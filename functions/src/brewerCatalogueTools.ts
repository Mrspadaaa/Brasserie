import type { BrewerContext, BrewerEvidence } from './companionTypes.js';
import type { BrewerCatalogueCommand } from './brewerCatalogueSchema.js';

export const BREWER_CATALOGUE_TOOL_NAMES = [
  'describe_brewing_catalogue', 'lookup_brewing_catalogue',
  'create_brewing_catalogue_entry', 'enrich_brewing_catalogue_entry'
] as const;
const kinds = ['hopVariety', 'yeastStrain', 'brewingStyle'] as const;
type CatalogueKind = typeof kinds[number];
type Evidence = Omit<BrewerEvidence, 'id'>;

/** The production job supplies this port. The pure recipe bundle never imports Firebase. */
export interface BrewerCatalogueAccess {
  readReceipts?(): Promise<Array<{ operationId: string; kind: CatalogueKind; targetId: string }>>;
  lookup(input: { kind: CatalogueKind; query: string }): Promise<{
    records: Array<{ kind: CatalogueKind; id: string; record: unknown; revision: number; fingerprint: string }>;
    truncated: boolean;
  }>;
  write(command: BrewerCatalogueCommand): Promise<{
    status: string;
    kind?: CatalogueKind;
    id?: string;
    record?: unknown;
    revision?: number;
    fingerprint?: string;
    receipt?: unknown;
  }>;
}

const kindSchema = { type: 'STRING', enum: kinds, description: 'Variété de houblon, souche/culture ou style de bière. Un lot, produit commercial et stock restent distincts.' };
const declaration = (name: string, description: string, properties: Record<string, unknown>, required: string[]) => ({
  name, description, parameters: { type: 'OBJECT', properties, required }
});
export const brewerCatalogueToolDeclarations = [
  declaration('describe_brewing_catalogue', 'Lire le contrat et les exemples de création/enrichissement du catalogue. À consulter avant une nouvelle commande si son format manque.', { kind: kindSchema }, ['kind']),
  declaration('lookup_brewing_catalogue', 'Rechercher le catalogue persistant par nom, alias, contenu ou ID. Renvoie identité, version, empreinte, données, sources et hypothèses conservées. Les IDs retournés sont utilisables par les outils métier.', {
    kind: kindSchema, query: { type: 'STRING', description: 'Nom, alias, caractéristique ou ID exact; affiner si la réponse est tronquée.' }
  }, ['kind', 'query']),
  declaration('create_brewing_catalogue_entry', 'Créer réellement une variété, souche/culture ou style ABSENT, à la demande du brasseur. Aucun ID catalogue préexistant requis : le serveur attribue l’identité. Conserver les informations supplémentaires et les contradictions. Ne pas fabriquer une mesure. Consulter describe_brewing_catalogue pour le contrat; le reçu retourné fait foi.', {
    commandJson: { type: 'STRING', description: 'Commande create JSON suivant describe_brewing_catalogue, avec operationId stable pour toute reprise. Sources, assertions et éventuelles projections explicites; aucun secret ni instruction exécutable.' }
  }, ['commandJson']),
  declaration('enrich_brewing_catalogue_entry', 'Enrichir réellement une identité existante à la demande du brasseur. Exige ID, révision et empreinte courants obtenus par lookup. Ajoute données/sources/hypothèses sans effacer les contradictions; une correction cite les assertions remplacées. Conflit = relire, aucun écrasement automatique.', {
    commandJson: { type: 'STRING', description: 'Commande enrich ou reviewedCorrection JSON suivant describe_brewing_catalogue, avec operationId stable, target et préconditions exactes.' }
  }, ['commandJson'])
];

function kindOf(value: unknown): CatalogueKind {
  if (typeof value !== 'string' || !kinds.includes(value as CatalogueKind)) throw Error('Type de catalogue invalide.');
  return value as CatalogueKind;
}

/** Refresh the records actually used by the existing tools, even beyond a bounded catalogue overview. */
export function hydrateBrewerCatalogueRecord(context: BrewerContext, kind: CatalogueKind, value: unknown) {
  if (!value || typeof value !== 'object' || typeof (value as any).id !== 'string') throw Error('Le catalogue n’a pas renvoyé une identité lisible.');
  const record = structuredClone(value) as any;
  const index = context.hopIndex ??= { varieties: [], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] };
  if (kind === 'hopVariety') {
    index.varieties = [...index.varieties.filter(item => item.id !== record.id), record];
  } else {
    const expectedKind = kind === 'yeastStrain' ? 'yeast' : 'styleGuide';
    if (record.kind !== expectedKind) throw Error('La projection ne correspond pas au type de catalogue.');
    index.knowledge = [...index.knowledge.filter(item => item.id !== record.id), record];
  }
}

export function isBrewerCatalogueTool(name: string) {
  return (BREWER_CATALOGUE_TOOL_NAMES as readonly string[]).includes(name);
}

/** Async side effects stay outside runBrewerTool, with a real receipt and read-after-write projection. */
export async function runBrewerCatalogueTool(
  name: string, args: Record<string, unknown>, context: BrewerContext, store: BrewerCatalogueAccess,
  describe: (kind: CatalogueKind) => unknown
): Promise<Evidence> {
  if (!isBrewerCatalogueTool(name)) throw Error('Outil de catalogue inconnu.');
  if (name === 'describe_brewing_catalogue') return {
    name, label: 'Contrat du catalogue', data: describe(kindOf(args.kind)), facts: [],
    limits: ['Le contrat décrit les commandes; aucun enregistrement n’est réalisé par cette lecture.']
  };
  if (name === 'lookup_brewing_catalogue') {
    const kind = kindOf(args.kind);
    if (typeof args.query !== 'string' || !args.query.trim() || args.query.length > 200) throw Error('Recherche de catalogue requise (200 caractères maximum).');
    const data = await store.lookup({ kind, query: args.query });
    for (const entry of data.records) hydrateBrewerCatalogueRecord(context, entry.kind, entry.record);
    return { name, label: 'Catalogue et références', data, facts: [], limits: [
      'Données documentaires, observations et hypothèses gardent leur statut; la présence dans le catalogue ne valide pas une estimation.',
      'Une référence embarquée est consultable sans être un enregistrement serveur; origin distingue bundled et persisted.',
      ...(data.truncated ? ['Recherche partielle : affiner ou consulter un ID exact.'] : [])
    ] };
  }
  if (typeof args.commandJson !== 'string' || !args.commandJson.trim() || args.commandJson.length > 160_000) throw Error('Commande JSON requise (160 Ko maximum).');
  let command: BrewerCatalogueCommand;
  try { command = JSON.parse(args.commandJson); } catch { throw Error('Commande de catalogue JSON illisible.'); }
  if (!command || typeof command !== 'object' || Array.isArray(command)) throw Error('Commande de catalogue invalide.');
  const operation = (command as any).operation;
  if (name === 'create_brewing_catalogue_entry' ? operation !== 'create' : !['enrich', 'reviewedCorrection'].includes(operation)) {
    throw Error('L’opération ne correspond pas à cet outil de catalogue.');
  }
  // Validation, identity allocation, CAS and idempotence are performed by the store/core.
  const data = await store.write(command);
  const committed = data.status === 'applied' || data.status === 'duplicate';
  if (committed) {
    hydrateBrewerCatalogueRecord(context, kindOf(data.kind), data.record);
    if (!data.receipt) throw Error('Enregistrement sans reçu de catalogue : vérifier l’opération avant toute reprise.');
  }
  return { name, label: committed ? 'Catalogue enregistré · reçu conservé' : 'Catalogue · conflit à résoudre', data,
    facts: committed ? [data.status === 'duplicate' ? 'Opération déjà enregistrée : aucune écriture en double.' : 'Enregistrement du catalogue confirmé par son reçu.'] : ['Aucun nouvel enregistrement confirmé par cette commande.'],
    limits: ['Cette commande ne modifie ni recette, ni brassin, ni stock. Les hypothèses restent distinctes des mesures et faits documentaires.']
  };
}
