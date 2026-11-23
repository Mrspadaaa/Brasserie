/**
 * Banc « conseil houblons V6 » (AI07-C) — entrées et contrôles, hors `npm test`.
 *
 * Ce module ne parle à aucun réseau et n'utilise aucune clé. Il fabrique, pour le VRAI harnais
 * `runBrewerHarness` (functions/src/brewerHarness.ts) et le profil V6 `hopAdviceSemanticProposalV6`
 * (functions/src/brewerHopAdviceSemanticAdapter.ts), les mêmes entrées que le worker de production
 * (functions/src/brewerJobs.ts:395-420) : contexte, RequestV3 validée par le parseur du wire,
 * profil, catalogue, `loadHopIndex`. Les outils sont servis en mémoire par des fixtures SYNTHÉTIQUES
 * posées par-dessus le référentiel embarqué de l'app (`loadBrewingCatalogueReferences`) ; aucun
 * Firestore. Le transport Gemini (réel ou simulé) est fourni par l'appelant.
 *
 *   Auto-test hors ligne (fetch remplacé par une fonction qui lève, generate scripté) :
 *     npx vite-node --config vitest.config.ts scripts/gemini-usage-bench-hop.ts -- --self-test
 *
 * Utilisation par un banc (un contexte neuf par exécution : le harnais le mute) :
 *     const setup = await hopAdviceSetup('hh-biotransformation', 'auto');
 *     const result = await runBrewerHarness(setup.context, setup.question, [], generate, { mode: 'auto', ...setup.options });
 *     const checks = hopAdviceChecks(result, setup);
 * Un banc qui importe ce module ne doit pas lui transmettre `--self-test`.
 *
 * Écarts de fidélité connus (voir aussi la fin du fichier) : le contexte n'a pas de journal ni de
 * `stockReservations` (portée « recette » sans lot) ; l'index et le catalogue sont des doubles mémoire ;
 * les variétés/lots synthétiques n'ont ni modèle de prédiction ni connaissance propres : les prédictions
 * viennent de l'extrapolation embarquée (`laffinee-experimental-v1`).
 */
import type { Generate } from '../functions/src/brewerHarness';
import { runBrewerHarness, geminiRestBody } from '../functions/src/brewerHarness';
import { assertGeminiModel } from '../functions/src/models';
import {
  brewerHopAdviceSemanticHarnessOptionsV6,
  validateHopAdviceV1ChatInput,
} from '../functions/src/brewerHopAdviceSemanticAdapter';
import { parseHopAdviceV1Wire } from '../functions/src/brewerHopAdviceLaneV1';
import { buildHopAdviceV1WireV3 } from '../functions/src/brewerHopAdviceTransportV1';
import { createBrewerHopAdviceRequestV3 } from '../functions/src/brewerHopAdviceSemanticV3';
import { projectBrewerHopAdviceContext } from '../functions/src/brewerHopAdviceContextBinding';
import {
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6,
  assertBrewerHopAdviceProposalV6MatchesSource,
  readBrewerHopAdviceProposalEnvelopeV6,
  verifyBrewerHopAdviceSemanticEvidenceV6,
} from '../functions/src/brewerHopAdviceSemanticV6';
import { RECIPE_FIELDS, cleanContext, pick } from '../functions/src/brewerContext';
import { searchHopVarieties } from '../functions/src/hopIndexFacts';
import type { BrewerCatalogueAccess } from '../functions/src/brewerCatalogueTools';
import type { BrewerContext, BrewerReferenceRequest } from '../functions/src/companionTypes';
import type { HopLot, HopMeasurement, HopSource, HopVariety } from '../functions/src/hopIndexSchema';
import type { HopKnowledge, HopYeast } from '../functions/src/hopPredictionSchema';
import {
  brewingScenarioArchiveApi,
  loadBrewingCatalogueReferences,
  normalizeRecipe,
  prepareBrewingScenarioContext,
} from '../src/domain/brewerTools';
import { practicalEquipment } from '../src/domain/brewEquipment';
import { catalogueMatches } from '../src/domain/yeastCatalogue';
import { hopV55ScenarioRuntimeReference } from '../src/services/hopV55/scenarioCommit';
import {
  createHopV55DecisionReadingArchiveV4,
  readHopV55QuestionSemanticV1,
} from '../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { recipe as fixtureRecipeOf } from '../tests/fixtures/brewCompanion';

// ---------------------------------------------------------------------------------------------
// Contrat public

export interface HopAdviceSetup {
  /** Frais à chaque appel (le harnais le mute). `editableTargets: []`. SANS hopIndex avant la création du profil (P1). */
  context: BrewerContext;
  /** `validated.input.question` : la question exacte du wire. */
  question: string;
  /** `{ profile, catalogue, loadHopIndex }` : à étaler dans `runBrewerHarness(context, question, [], generate, { mode, ...options })`. */
  options: Record<string, unknown>;
  /** La RequestV3 validée par `parseHopAdviceV1Wire` puis `validateHopAdviceV1ChatInput` (aller-retour JSON). */
  request: unknown;
  /** Identités de l'index fixture (synthétiques + référentiel embarqué) pour détecter une invention. */
  index: {
    varietyIds: string[];
    lotIds: string[];
    /** Noms et alias de variétés (synthétiques + référentiel embarqué). */
    names: string[];
    /** Ajouts du banc, hors référentiel embarqué. */
    fixtureVarietyIds?: string[];
    fixtureLotIds?: string[];
    /** Identifiants de levures du référentiel embarqué (pour contrôler `yeastId`). */
    yeastIds?: string[];
  };
  /** Extras utiles à l'appelant. */
  caseId?: string;
  mode?: 'auto' | 'deep';
  /** Appels de `loadHopIndex` et de `catalogue.lookup` faits par le harnais (preuve du chargement paresseux, P1). */
  probes?: { loadHopIndex: BrewerReferenceRequest[]; catalogueLookups: Array<{ kind: string; query: string }>; catalogueWrites: number };
}

export interface HopAdviceChecks {
  /** `profileResult.payload` relu sans erreur : readBrewerHopAdviceProposalEnvelopeV6 → readOnly + assertBrewerHopAdviceProposalV6MatchesSource. */
  envelope: boolean;
  /** `verifyBrewerHopAdviceSemanticEvidenceV6(envelope, result.evidence)` ne lève pas. */
  evidenceVerified: boolean;
  /** `answer.program.qualification` : none | preparedRequest | computedResult | programPreview ('' si l'enveloppe est illisible). */
  qualification: string;
  computedOptions: number;
  options: number;
  /** IDs de variété/lot/levure présents dans `result.trace[].args` et absents de l'index fixture (et du référentiel embarqué). */
  inventedIds: string[];
  /** Noms de variétés cités dans les textes de la proposition et absents de la question, de la recette et des preuves (heuristique §4.3). */
  inventedNames: string[];
  /** Doses lues dans `trace[].args` hors bornes de banc. */
  doseOutOfBounds: string[];
  /** Nombres avec unité écrits par le modèle dans les textes de la proposition (vide si `complete` a passé). */
  modelNumbers: string[];
  /** Extra : appels d'outil en erreur (« outil: message ») ; le harnais ne les rend pas fatals. */
  toolErrors: string[];
  errors: string[];
}

type CaseLevel = 'simple' | 'très compliqué';
interface CaseSpec { question: string; level: CaseLevel; recipe: string }

/**
 * Questions lues réellement par `readHopV55QuestionSemanticV1` (annotations relevées le 2026-10-16, voir
 * hop-setup.md). Elles ne contiennent aucun chiffre : tout « nombre + unité » écrit par le modèle sort donc
 * en `modelNumbers` ou est refusé par `complete`.
 */
export const HOP_ADVICE_CASES: Record<string, CaseSpec> = {
  'hh-lecture': {
    question: 'Je veux garder l’arôme agrume de mon houblon de dry-hop et augmenter le floral, sans augmenter l’amertume.',
    level: 'simple',
    recipe: 'Pale Ale 20 L fixture : Veldrine en ébullition (amérisant), Quorlin en dry-hop avec lot, LalBrew Verdant IPA.',
  },
  'hh-biotransformation': {
    question: 'Dans ma NEIPA, exploiter la biotransformation avec la levure de ma recette pour plus de tropical, avec un dry-hop à froid sans augmenter l’amertume. Quelle famille de houblons du catalogue choisir et quelles quantités proposer ?',
    level: 'très compliqué',
    recipe: 'NEIPA 20 L fixture : Veldrine en ébullition, Brumel en whirlpool, Quorlin en dry-hop, LalBrew Verdant IPA (hopIndexId).',
  },
};

// ---------------------------------------------------------------------------------------------
// Fixtures synthétiques (noms inventés, marqués fixture dans chaque description et dans `origin`)

const OWNER = 'owner:hop-bench-fixture';
const WORKSPACE = 'workspace:hop-bench-fixture';
const NOW = Date.parse('2026-10-16T08:00:00.000Z');
const RECORDED_AT = '2026-10-16T08:00:00.000Z';
const FIXTURE_ORIGIN = 'Fixture synthétique AI07-C (aucune donnée réelle)';
const FIXTURE_SOURCE: HopSource = {
  title: 'Fixture synthétique AI07-C (banc houblons)', author: 'Banc local', year: 2026, kind: 'observation',
  reference: 'scripts/gemini-usage-bench-hop.ts — aucune donnée réelle',
};
const FIXTURE_COA: HopSource = { ...FIXTURE_SOURCE, title: 'COA synthétique AI07-C (banc houblons)', kind: 'coa' };
const YEAST_ID = 'lalbrew-verdant-ipa';

const measurement = (analyte: HopMeasurement['analyte'], unit: HopMeasurement['unit'], min: number, max: number): HopMeasurement => ({
  analyte, unit, basis: 'asIs', kind: 'range', range: { min, max }, source: FIXTURE_SOURCE, confidence: 'medium',
});

interface FixtureVarietySpec {
  id: string; name: string; alias: string; description: string; alpha: [number, number]; oil: [number, number];
  thiols?: Array<[HopMeasurement['analyte'], number, number]>;
}
const FIXTURE_VARIETIES: FixtureVarietySpec[] = [
  { id: 'fixture-hop-quorlin', name: 'Quorlin', alias: 'Quorlin fixture', alpha: [5, 7], oil: [1.8, 2.6],
    description: 'Agrumes (citrus) : pamplemousse et zeste de citron, arôme net de houblon brut (fixture synthétique).' },
  { id: 'fixture-hop-veldrine', name: 'Veldrine', alias: 'Veldrine fixture', alpha: [9, 12], oil: [2, 3],
    description: 'Tropical : fruits tropicaux, mangue et ananas, amertume franche (fixture synthétique).' },
  { id: 'fixture-hop-brumel', name: 'Brumel', alias: 'Brumel fixture', alpha: [6, 8], oil: [1.5, 2.2],
    description: 'Tropical : fruits tropicaux, fruit de la passion et cassis ; précurseurs de thiols élevés (fixture synthétique).',
    thiols: [['3mhCys', 900, 2600], ['3mhGsh', 400, 1500]] },
  { id: 'fixture-hop-tarnova', name: 'Tarnova', alias: 'Tarnova fixture', alpha: [12, 15], oil: [2.2, 3.2],
    description: 'Résine (resin) : pin et sapin, caractère résineux marqué (fixture synthétique).' },
  { id: 'fixture-hop-selvane', name: 'Selvane', alias: 'Selvane fixture', alpha: [3, 5], oil: [0.8, 1.4],
    description: 'Floral : fleur de sureau et herbacé léger (fixture synthétique).' },
];
const FIXTURE_LOTS: Array<{ id: string; varietyId: string; name: string; lotNumber: string; alpha: number }> = [
  { id: 'fixture-lot-quorlin-2025', varietyId: 'fixture-hop-quorlin', name: 'Quorlin lot 2025 (fixture)', lotNumber: 'FX-QUO-2025', alpha: 6.1 },
  { id: 'fixture-lot-veldrine-2025', varietyId: 'fixture-hop-veldrine', name: 'Veldrine lot 2025 (fixture)', lotNumber: 'FX-VEL-2025', alpha: 10.4 },
  { id: 'fixture-lot-brumel-2025', varietyId: 'fixture-hop-brumel', name: 'Brumel lot 2025 (fixture)', lotNumber: 'FX-BRU-2025', alpha: 7.2 },
];

function fixtureVariety(spec: FixtureVarietySpec): HopVariety {
  return {
    id: spec.id, name: spec.name, aliases: [spec.alias], origin: FIXTURE_ORIGIN, form: 'pelletT90',
    descriptions: [{ text: spec.description, context: 'rawHop', source: FIXTURE_SOURCE }],
    analysis: [measurement('alpha', 'percentMass', ...spec.alpha), measurement('totalOil', 'ml100g', ...spec.oil),
      ...(spec.thiols ?? []).map(([analyte, min, max]) => measurement(analyte, 'ugKgThiolEquivalent', min, max))],
  };
}
function fixtureLot(spec: typeof FIXTURE_LOTS[number]): HopLot {
  return {
    id: spec.id, varietyId: spec.varietyId, name: spec.name, lotNumber: spec.lotNumber, harvestYear: 2025,
    growingRegion: 'Région fictive', referenceOnly: true, form: 'pelletT90',
    analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: spec.alpha,
      range: { min: spec.alpha - 0.2, max: spec.alpha + 0.2 }, source: FIXTURE_COA, confidence: 'high' }],
    notes: FIXTURE_ORIGIN,
  };
}

const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
const mergeById = <T extends { id: string }>(base: T[], extra: T[]): T[] => [...new Map([...base, ...extra].map(row => [row.id, row])).values()];

interface FixtureIndex {
  refs: { varieties: HopVariety[]; knowledge: HopKnowledge[] };
  stored: { varieties: HopVariety[]; lots: HopLot[]; knowledge: HopKnowledge[] };
}
let fixtureIndexPromise: Promise<FixtureIndex> | undefined;
/** Référentiel embarqué (pur) + ajouts synthétiques ; refuse un nom synthétique qui collisionnerait avec une variété réelle. */
function fixtureIndex(): Promise<FixtureIndex> {
  return fixtureIndexPromise ??= (async () => {
    const refs = await loadBrewingCatalogueReferences();
    const stored = { varieties: FIXTURE_VARIETIES.map(fixtureVariety), lots: FIXTURE_LOTS.map(fixtureLot), knowledge: [] as HopKnowledge[] };
    const real = new Set(refs.varieties.flatMap(variety => [variety.name, ...variety.aliases]).map(fold));
    const clash = stored.varieties.flatMap(variety => [variety.name, ...variety.aliases]).find(name => real.has(fold(name)));
    if (clash) throw new Error(`Nom synthétique « ${clash} » déjà présent dans le référentiel embarqué : choisir un nom inventé.`);
    if (!refs.knowledge.some(row => row.kind === 'yeast' && row.id === YEAST_ID)) throw new Error(`Levure ${YEAST_ID} absente du référentiel embarqué.`);
    return { refs, stored };
  })();
}

/** Même sémantique que `loadBrewerHopContext` (functions/src/brewerHopContext.ts), sans Firestore. */
function makeLoadHopIndex(index: FixtureIndex, probes: NonNullable<HopAdviceSetup['probes']>) {
  return async (request: BrewerReferenceRequest = {}): Promise<NonNullable<BrewerContext['hopIndex']>> => {
    probes.loadHopIndex.push(structuredClone(request));
    const empty = { predictions: [], tastings: [], truncated: [] as string[] };
    if (request.onlyReferences) {
      const wanted = (ids?: string[]) => new Set(ids ?? []);
      const [wantedVarieties, wantedLots, wantedKnowledge] = [wanted(request.varietyIds), wanted(request.lotIds), wanted(request.knowledgeIds)];
      const lots = index.stored.lots.filter(lot => wantedLots.has(lot.id));
      const linked = new Set(lots.map(lot => lot.varietyId));
      return structuredClone({ varieties: index.stored.varieties.filter(variety => wantedVarieties.has(variety.id) || linked.has(variety.id)),
        lots, knowledge: index.stored.knowledge.filter(row => wantedKnowledge.has(row.id)), ...empty }) as NonNullable<BrewerContext['hopIndex']>;
    }
    return structuredClone({ varieties: mergeById(index.refs.varieties, index.stored.varieties), lots: index.stored.lots,
      knowledge: mergeById(index.refs.knowledge, index.stored.knowledge), ...empty }) as NonNullable<BrewerContext['hopIndex']>;
  };
}

/** Catalogue en mémoire : les variétés viennent de `searchHopVarieties` (nom, alias, origine, descriptions), comme l'outil de recherche. */
function makeCatalogue(index: FixtureIndex, probes: NonNullable<HopAdviceSetup['probes']>): BrewerCatalogueAccess {
  const stored = new Set(index.stored.varieties.map(variety => variety.id));
  const record = (kind: 'hopVariety' | 'yeastStrain' | 'brewingStyle', id: string, row: unknown, origin: string) =>
    ({ kind, id, record: structuredClone(row), revision: 1, fingerprint: 'f'.repeat(64), origin });
  return {
    // P9 : aucun reçu de reprise.
    readReceipts: async () => [],
    async lookup({ kind, query }) {
      probes.catalogueLookups.push({ kind, query });
      const max = 20;
      let rows: ReturnType<typeof record>[] = [];
      if (kind === 'hopVariety') {
        const varieties = searchHopVarieties(mergeById(index.refs.varieties, index.stored.varieties), query);
        const exact = varieties.filter(variety => variety.id === query);
        rows = (exact.length ? exact : varieties).map(variety => record(kind, variety.id, variety, stored.has(variety.id) ? 'persisted' : 'bundled'));
      } else {
        const terms = fold(query).split(/\s+/).filter(Boolean);
        const yeasts = index.refs.knowledge.filter((row): row is HopYeast => row.kind === 'yeast');
        rows = kind === 'yeastStrain'
          ? yeasts.filter(yeast => yeast.id === query || catalogueMatches(yeast, query)).map(yeast => record(kind, yeast.id, yeast, 'bundled'))
          : index.refs.knowledge.filter(row => row.kind === 'styleGuide' && terms.every(term => fold(`${row.id} ${row.name}`).includes(term)))
            .map(row => record(kind, row.id, row, 'bundled'));
      }
      return { records: rows.slice(0, max), truncated: rows.length > max };
    },
    // Jamais atteint : le harnais refuse l'outil d'écriture, et la façade lecture seule du profil lève aussi.
    async write() {
      probes.catalogueWrites++;
      throw new Error('Le banc houblons n’écrit jamais dans le catalogue.');
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Contexte et recettes

interface RecipeSpec { name: string; style: string; hops: Array<Record<string, unknown>> }
const RECIPES: Record<string, RecipeSpec> = {
  'hh-lecture': {
    name: 'Pale Ale fixture', style: 'Pale Ale',
    hops: [
      { name: 'Veldrine', stage: 'boil', weightG: 25, alpha: 10.4, timeMin: 60, hopVarietyId: 'fixture-hop-veldrine', hopLotId: 'fixture-lot-veldrine-2025' },
      { name: 'Quorlin', stage: 'dryHop', weightG: 60, alpha: 6.1, dayOffset: 3, hopVarietyId: 'fixture-hop-quorlin', hopLotId: 'fixture-lot-quorlin-2025',
        aromaTiming: 'fermentation', aromaContactHours: 72, aromaTemperatureC: 18 },
    ],
  },
  'hh-biotransformation': {
    name: 'NEIPA fixture', style: 'New England IPA',
    hops: [
      { name: 'Veldrine', stage: 'boil', weightG: 20, alpha: 10.4, timeMin: 60, hopVarietyId: 'fixture-hop-veldrine', hopLotId: 'fixture-lot-veldrine-2025' },
      { name: 'Brumel', stage: 'whirlpool', weightG: 40, alpha: 7.2, timeMin: 20, tempC: 80, hopVarietyId: 'fixture-hop-brumel', hopLotId: 'fixture-lot-brumel-2025' },
      { name: 'Quorlin', stage: 'dryHop', weightG: 100, alpha: 6.1, dayOffset: 3, hopVarietyId: 'fixture-hop-quorlin', hopLotId: 'fixture-lot-quorlin-2025',
        aromaTiming: 'fermentation', aromaContactHours: 72, aromaTemperatureC: 18 },
    ],
  },
};

/** Comme `loadBrewerContext` pour la portée « recette » : recette normalisée, pas de journal, pas d'index houblon (P1, P3). */
function fixtureContext(caseId: string): BrewerContext {
  const spec = RECIPES[caseId];
  const base = fixtureRecipeOf({ efficiencyPct: 75, name: spec.name, style: spec.style, volumeL: 20,
    hops: spec.hops as never, yeast: { name: 'LalBrew Verdant IPA', form: 'sèche', qty: 1, unit: 'sachet', hopIndexId: YEAST_ID } });
  const recipe = { ...base, id: scopeOf(caseId).id };
  return cleanContext({
    recipe: normalizeRecipe(pick(recipe, RECIPE_FIELDS)),
    equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment },
    inventory: [], material: [], waterSources: [],
    phase: 'recipe', now: NOW, provenance: ['Recette enregistrée'], editableTargets: [],
  }) as BrewerContext;
}
const scopeOf = (caseId: string) => ({ kind: 'recipe' as const, id: `fixture-recipe-${caseId}` });

// ---------------------------------------------------------------------------------------------
// Chaîne client → wire → serveur (brewerJobs.ts:270-287,395-420, sans Firestore)

export async function hopAdviceSetup(caseId: string, mode: 'auto' | 'deep'): Promise<HopAdviceSetup> {
  const spec = HOP_ADVICE_CASES[caseId];
  if (!spec) throw new Error(`Cas houblons inconnu : ${caseId} (attendus : ${Object.keys(HOP_ADVICE_CASES).join(', ')}).`);
  if (mode !== 'auto' && mode !== 'deep') throw new Error(`Mode inconnu : ${String(mode)}.`);
  const index = await fixtureIndex();
  const probes: NonNullable<HopAdviceSetup['probes']> = { loadHopIndex: [], catalogueLookups: [], catalogueWrites: 0 };
  const scope = scopeOf(caseId);

  // Client : contexte préparé SANS index (comme la lecture locale), lecture sémantique, archive source4, RequestV3.
  const clientContext = fixtureContext(caseId);
  const prepared = prepareBrewingScenarioContext(clientContext);
  const reading = readHopV55QuestionSemanticV1(spec.question, prepared);
  if (!reading.annotations.length) throw new Error(`La lecture sémantique locale n’a produit aucune annotation pour ${caseId}.`);
  const sourceArchive = createHopV55DecisionReadingArchiveV4({
    id: `reading:${caseId}`, ownerKey: OWNER, workspaceId: WORKSPACE, recordedAt: RECORDED_AT, reading,
    source: { kind: 'recipe', id: scope.id }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const projection = projectBrewerHopAdviceContext({ scope, context: clientContext, runtime: prepared.runtime });
  if (projection.status !== 'ready') throw new Error(`Contexte de fixture non qualifiable : ${projection.reason}`);
  const contextLaunch = {
    format: 'brewer-hop-advice-context-launch-v1' as const, ownerKey: OWNER, workspaceId: WORKSPACE,
    sourceReadingReference: sourceArchive.contentReference, source: { kind: 'recipe' as const, id: scope.id },
    sourceRuntimeReference: sourceArchive.runtimeReference, scope, expected: projection.projection,
  };
  const clientRequest = createBrewerHopAdviceRequestV3({ sourceArchive, contextLaunch });
  // Le callable reçoit des octets, pas des objets figés.
  const wire = JSON.parse(JSON.stringify(buildHopAdviceV1WireV3({
    operationId: `hop-bench-${caseId}-${mode}`, question: clientRequest.question, scope, analysisMode: mode, hopAdvice: clientRequest,
  })));

  // Serveur : parse, validation liée à l'owner, contexte rechargé (neuf), profil V6, catalogue en lecture seule.
  const parsed = parseHopAdviceV1Wire(wire);
  const validated = validateHopAdviceV1ChatInput(parsed, OWNER);
  if (validated.requestVersion !== 'request-v3') throw new Error('La fixture doit rester une RequestV3.');
  const context = fixtureContext(caseId);
  const catalogue = makeCatalogue(index, probes);
  const harnessOptions = brewerHopAdviceSemanticHarnessOptionsV6(validated.request, context,
    { scope: validated.input.scope, catalogue, ownerUid: OWNER });
  if (context.hopIndex) throw new Error('Le contexte ne doit pas porter d’index houblon avant le premier outil (P1).');

  const allVarieties = mergeById(index.refs.varieties, index.stored.varieties);
  return {
    context, question: validated.input.question,
    options: { ...harnessOptions, loadHopIndex: makeLoadHopIndex(index, probes) },
    request: validated.request,
    index: {
      varietyIds: allVarieties.map(variety => variety.id),
      lotIds: index.stored.lots.map(lot => lot.id),
      names: [...new Set(allVarieties.flatMap(variety => [variety.name, ...variety.aliases]))],
      fixtureVarietyIds: index.stored.varieties.map(variety => variety.id),
      fixtureLotIds: index.stored.lots.map(lot => lot.id),
      yeastIds: index.refs.knowledge.filter(row => row.kind === 'yeast').map(row => row.id),
    },
    caseId, mode, probes,
  };
}

// ---------------------------------------------------------------------------------------------
// Finish simulé

export interface HopAdviceSimulatedFinishOptions {
  /** `preparedRequest` : preuve d'un `prepare_brewing_scenario` ; `scenarioBranch` : preuve d'un `simulate_brewing_scenarios` et sa branche. */
  program?: { kind: 'preparedRequest'; evidenceId: string } | { kind: 'scenarioBranch'; evidenceId: string; branchId: string };
  /** Ajoute une option « calculée » liée à une branche de scénario existante. */
  computedBranch?: { evidenceId: string; branchId: string };
}

/**
 * Arguments VALIDES de `finish_hop_advice_proposal_v6` : une option « enquête » qui cite les preuves reçues
 * (≤ 6 ; une preuve `predict_hop_aroma` devient une exploration côté serveur), aucun nombre avec unité,
 * `optionProposalLinks: []`. Les identifiants `E…` doivent désigner des résultats d'outil de CE tour.
 */
export function hopAdviceSimulatedFinish(evidenceIds: string[], extra: HopAdviceSimulatedFinishOptions = {}): Record<string, unknown> {
  const cited = [...new Set(evidenceIds)].slice(0, 6);
  const options: Array<Record<string, unknown>> = [{
    id: 'assist-option-1', kind: 'investigation', title: 'Préciser la cible aromatique avant de choisir',
    rationale: 'Réponse de simulation : les résultats d’outil reçus sont cités sans conclusion calculée.',
    conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: cited,
  }];
  if (extra.computedBranch) options.push({
    id: 'assist-option-2', kind: 'characterization', title: 'Lire la branche calculée du scénario',
    rationale: 'La valeur affichée vient de la branche de scénario liée, pas du texte du modèle.',
    conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [], computed: { ...extra.computedBranch },
  });
  return {
    annotationReviews: [], propertyIntentProposals: [], semanticRevisionProposals: [], openQuestions: [], materials: [],
    answer: {
      summary: 'Réponse de simulation sans chiffre écrit par le modèle.',
      readingNote: 'Lecture de la question telle qu’elle est posée, sans interprétation ajoutée.',
      options, unknowns: [],
      program: extra.program
        ? { ...extra.program, note: 'Programme repris de la preuve d’outil citée.' }
        : { kind: 'none', note: 'Aucun programme préparé.' },
      refusals: [],
    },
    optionProposalLinks: [],
  };
}

// ---------------------------------------------------------------------------------------------
// Contrôles

/** Copie de `QUANTITY` / `LABELLED_NUMBER` / `URL` (functions/src/brewerHopAdviceProposal.ts:488-490, non exportées). */
const QUANTITY = /\d+(?:[.,]\d+)?\s*(?:%|°\s*[CFP]?|g\s*\/\s*h?l|mg\s*\/\s*l|kg|grammes?|grams?|g|ppm|ibu|bu|ebc|ml|cl|hl|litres?|liters?|l|heures?|hours?|h|minutes?|min|jours?|days?|semaines?|weeks?|bars?)(?![\p{L}])/giu;
const LABELLED_NUMBER = /\b(?:ph|ibu|ebc|abv|alpha)\s*[:=]?\s*\d/giu;

const isRow = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const TEXT_KEYS = ['summary', 'readingNote', 'title', 'rationale', 'conditions', 'tradeoffs', 'question', 'changesChoice', 'text', 'note', 'restatement', 'whyOpen'];

/** Textes rédigés par le modèle dans la proposition (réponse, questions ouvertes, notes de matière). Les notes d'exploration sont écrites par le serveur. */
function proposalTexts(proposal: any): string[] {
  const out: string[] = [];
  const push = (value: unknown) => { if (typeof value === 'string' && value.trim()) out.push(value); };
  const pushKeys = (row: unknown, keys: string[]) => { if (isRow(row)) for (const key of keys) { const value = row[key]; Array.isArray(value) ? value.forEach(push) : push(value); } };
  const answer = proposal?.answer ?? {};
  pushKeys(answer, ['summary', 'readingNote']);
  for (const option of answer.options ?? []) pushKeys(option, ['title', 'rationale', 'conditions', 'tradeoffs']);
  for (const unknown of answer.unknowns ?? []) pushKeys(unknown, ['question', 'changesChoice']);
  for (const refusal of answer.refusals ?? []) pushKeys(refusal, ['text']);
  pushKeys(answer.program, ['note']);
  for (const open of proposal?.openQuestions ?? []) pushKeys(open, ['restatement', 'whyOpen']);
  for (const material of proposal?.materials ?? []) pushKeys(material, ['note']);
  return out;
}

/** Parcourt récursivement les arguments, y compris les JSON sérialisés (`requestJson`, `inputJson`, `commandJson`). */
function walkArgs(value: unknown, visit: (key: string, child: unknown, parent: Record<string, unknown>, path: string) => void, path = '', depth = 0): void {
  if (depth > 14 || !value || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach((item, index) => walkArgs(item, visit, `${path}[${index}]`, depth + 1)); return; }
  for (const [key, child] of Object.entries(value)) {
    const at = path ? `${path}.${key}` : key;
    visit(key, child, value as Record<string, unknown>, at);
    if (typeof child === 'string' && ['requestJson', 'inputJson', 'commandJson'].includes(key) && child.length <= 200_000) {
      try { walkArgs(JSON.parse(child), visit, `${at}{json}`, depth + 1); } catch { /* L'outil signale lui-même un JSON illisible. */ }
    } else if (child && typeof child === 'object') walkArgs(child, visit, at, depth + 1);
  }
}

const VARIETY_KEYS = ['varietyId', 'hopVarietyId', 'targetVarietyId', 'referenceVarietyId'];
const LOT_KEYS = ['lotId', 'hopLotId'];
const YEAST_KEYS = ['yeastId', 'hopIndexId', 'targetYeastId', 'referenceYeastId'];
const DRY_HOP_TIMINGS = ['fermentation', 'postFermentation'];
/** Bornes de banc (pas de production) : dry-hop 0,5-20 g/L ; contact 0-240 h ; whirlpool/froid -2..100 °C. Une dose nulle explicite (0) est admise. */
export const HOP_BENCH_BOUNDS = { dryHopDoseGL: [0.5, 20], otherDoseGL: [0, 20], contactHours: [0, 240], temperatureC: [-2, 100], gramsPerLitreMax: 20 } as const;

/** Chiffres avec unité écrits par le modèle (règle de `complete`, rejouée) : un chiffre qui figure littéralement dans la question est admis. */
export function hopAdviceModelNumbers(proposal: unknown, question: string): string[] {
  const found: string[] = [];
  for (const text of proposalTexts(proposal))
    for (const pattern of [QUANTITY, LABELLED_NUMBER])
      for (const match of text.matchAll(pattern)) if (!question.includes(match[0])) found.push(`« ${match[0]} » dans « ${text.slice(0, 80)} »`);
  return found;
}

/**
 * Heuristique §4.3 : noms (et mots de nom) de variétés de l'index cités dans les textes de la proposition mais absents de la
 * question, de la recette et des données d'outil reçues. Sensible à la casse (« Target » est un nom, « target » non), mot entier.
 * Faux positifs possibles : nom de variété ressemblant à un mot courant en début de phrase (Bravo, Horizon, Perle…).
 */
export function hopAdviceInventedNames(proposal: unknown, setup: Pick<HopAdviceSetup, 'question' | 'context' | 'index'>, evidence: any[]): string[] {
  const corpus = fold(`${setup.question}\n${JSON.stringify(setup.context?.recipe ?? {})}\n${JSON.stringify(evidence.map(entry => entry?.data ?? null))}`);
  const texts = proposalTexts(proposal).join('\n');
  // Les mots d'un nom composé (« Hallertau Blanc ») comptent s'ils sont capitalisés ; « fixture » (alias synthétique) ne compte pas.
  const parts = (name: string) => name.split(/[\s/·()!.,;:]+/).filter(part => part.length >= 4 && part[0] !== part[0].toLowerCase());
  const lexicon = new Set(setup.index.names.flatMap(name => [name, ...parts(name)]).filter(name => name.length >= 4));
  const found: string[] = [];
  for (const name of lexicon) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u').test(texts) && !corpus.includes(fold(name))) found.push(name);
  }
  return found.sort();
}

export function hopAdviceChecks(result: any, setup: HopAdviceSetup): HopAdviceChecks {
  const errors: string[] = [];
  const checks: HopAdviceChecks = { envelope: false, evidenceVerified: false, qualification: '', computedOptions: 0, options: 0,
    inventedIds: [], inventedNames: [], doseOutOfBounds: [], modelNumbers: [], toolErrors: [], errors };
  const question = setup.question;
  const trace: Array<{ name: string; args: unknown; resultId?: string; error?: string }> = Array.isArray(result?.trace) ? result.trace : [];
  checks.toolErrors = trace.filter(entry => entry.error).map(entry => `${entry.name}: ${String(entry.error).slice(0, 200)}`);

  // 1. Enveloppe relue comme le ferait le client (readOnly + liée à la RequestV3 exacte), puis preuves re-dérivées.
  let envelope: any;
  const payload = result?.profileResult?.payload;
  if (payload === undefined) errors.push('profileResult absent : aucune enveloppe à relire.');
  else {
    try {
      const read = readBrewerHopAdviceProposalEnvelopeV6(payload);
      if (read.status !== 'readOnly') throw new Error(`lecture ${read.status}${'reason' in read ? ` : ${read.reason}` : ''}`);
      assertBrewerHopAdviceProposalV6MatchesSource(read.envelope, setup.request);
      envelope = read.envelope;
      checks.envelope = true;
    } catch (error) { errors.push(`enveloppe : ${(error as Error).message}`); }
  }
  if (envelope) {
    try {
      verifyBrewerHopAdviceSemanticEvidenceV6(envelope, result.evidence ?? [],
        { readScenario: (value: unknown, resolve?: (id: string) => unknown) => brewingScenarioArchiveApi.readBrewingScenarioEvidence(value, resolve) });
      checks.evidenceVerified = true;
    } catch (error) { errors.push(`preuves : ${(error as Error).message}`); }
    const answer = envelope.proposal?.answer ?? {};
    checks.qualification = String(answer.program?.qualification ?? '');
    checks.options = Array.isArray(answer.options) ? answer.options.length : 0;
    checks.computedOptions = (answer.options ?? []).filter((option: any) => option?.computed).length;

    // 2. Nombres avec unité écrits par le modèle (règle de `complete`, rejouée sur tous les textes).
    checks.modelNumbers = hopAdviceModelNumbers(envelope.proposal, question);
  }

  // 3. Identifiants et doses lus dans les arguments d'outil (toutes les tentatives, y compris celles que l'outil a refusées).
  const known = {
    variety: new Set(setup.index.varietyIds), lot: new Set(setup.index.lotIds), yeast: new Set(setup.index.yeastIds ?? []),
  };
  const volumeL = Number(setup.context?.recipe?.volumeL) > 0 ? Number(setup.context.recipe.volumeL) : 20;
  const invented = new Set<string>();
  trace.forEach((entry, position) => {
    if (!isRow(entry.args)) return;
    const where = `${entry.name}#${position}`;
    walkArgs(entry.args, (key, child, parent, path) => {
      const family = VARIETY_KEYS.includes(key) ? 'variety' : LOT_KEYS.includes(key) ? 'lot' : YEAST_KEYS.includes(key) ? 'yeast' : undefined;
      if (family) {
        if (typeof child === 'string' && !known[family].has(child)) invented.add(`${family}:${child}`);
        return;
      }
      if (child === null || child === undefined) return;
      const bound = (label: string, unit: string, low: number, high: number) => {
        if (typeof child !== 'number' || !Number.isFinite(child)) { checks.doseOutOfBounds.push(`${where} ${path}=${String(child)} (${label} non numérique)`); return; }
        if (child < low || child > high) checks.doseOutOfBounds.push(`${where} ${path}=${child} ${unit} hors ${low}–${high}`);
      };
      if (key === 'doseGL') {
        if (child === 0) return; // dose nulle explicite : admise
        const [low, high] = parent.timing === undefined || DRY_HOP_TIMINGS.includes(String(parent.timing)) ? HOP_BENCH_BOUNDS.dryHopDoseGL : HOP_BENCH_BOUNDS.otherDoseGL;
        bound('dose', 'g/L', low, high);
      } else if (key === 'contactHours' || key === 'aromaContactHours') bound('contact', 'h', ...HOP_BENCH_BOUNDS.contactHours);
      else if (key === 'temperatureC' || key === 'tempC' || key === 'aromaTemperatureC') bound('température', '°C', ...HOP_BENCH_BOUNDS.temperatureC);
      else if (key === 'grams' || key === 'weightG') bound('masse', 'g', 0, HOP_BENCH_BOUNDS.gramsPerLitreMax * volumeL);
    });
  });
  checks.inventedIds = [...invented].sort();

  // 4. Noms de variétés cités dans les textes, absents de la question, de la recette et des preuves (heuristique).
  if (envelope) checks.inventedNames = hopAdviceInventedNames(envelope.proposal, setup, result?.evidence ?? []);

  if (checks.inventedIds.length) errors.push(`identifiants absents de l’index : ${checks.inventedIds.join(', ')}`);
  if (checks.inventedNames.length) errors.push(`noms de variété cités sans source : ${checks.inventedNames.join(', ')}`);
  if (checks.doseOutOfBounds.length) errors.push(`doses hors bornes : ${checks.doseOutOfBounds.join(' ; ')}`);
  if (checks.modelNumbers.length) errors.push(`chiffres écrits par le modèle : ${checks.modelNumbers.join(' ; ')}`);
  return checks;
}

// ---------------------------------------------------------------------------------------------
// Auto-test hors ligne

type ToolCall = [string, Record<string, unknown>];
type Turn = ToolCall[] | ((body: Record<string, any>) => ToolCall[]);
interface CallLog { kind: 'analysis' | 'review'; model: string; bytes: number; declared: string[]; maxOutputTokens: unknown; thinkingLevel: unknown; encoded: boolean }

/** Identifiants `E…` des résultats d'outil réussis déjà reçus par le modèle (dans l'ordre). */
function receivedEvidenceIds(body: Record<string, any>, tool?: string): string[] {
  const ids: string[] = [];
  for (const message of body.contents ?? []) for (const part of message.parts ?? []) {
    const response = part.functionResponse;
    if (!response || (tool && response.name !== tool)) continue;
    const id = response.response?.id;
    if (typeof id === 'string' && /^E\d+$/.test(id) && !response.response?.error) ids.push(id);
  }
  return ids;
}

const REVIEW_APPROVED = { candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] };

/** Routage de brewerHopAdviceProposal.test.ts:461-464 : relecture si le schéma de réponse porte `approved`, sinon analyse. */
function scriptedGenerate(turns: Turn[], log: CallLog[]): Generate {
  let next = 0;
  return async (model, body) => {
    assertGeminiModel(model);
    // Le corps doit s'encoder comme au transport de production (outils → parametersJsonSchema).
    const encoded = geminiRestBody(body) as Record<string, any>;
    const wire = JSON.stringify(encoded);
    const declarations: any[] = encoded.tools?.[0]?.functionDeclarations ?? [];
    const config = (body.generationConfig ?? {}) as Record<string, any>;
    const review = Boolean(config.responseSchema?.properties?.approved);
    log.push({ kind: review ? 'review' : 'analysis', model, bytes: wire.length, declared: declarations.map(tool => tool.name),
      maxOutputTokens: config.maxOutputTokens, thinkingLevel: config.thinkingConfig?.thinkingLevel,
      encoded: declarations.every(tool => tool.parametersJsonSchema !== undefined && tool.parameters === undefined) });
    if (review) return REVIEW_APPROVED;
    const turn = turns[next++];
    if (!turn) throw new Error('Script épuisé : le harnais a demandé un tour d’analyse de plus que prévu.');
    const calls = typeof turn === 'function' ? turn(body as Record<string, any>) : turn;
    return { candidates: [{ content: { role: 'model', parts: calls.map(([name, args]) => ({ functionCall: { name, args } })) } }] };
  };
}

interface Script { turns: Turn[]; qualifications: string[]; minComputedOptions: number }

/** Dernier résultat d'outil `name` reçu par le modèle (réponse brute du harnais, ids `E…` compris). */
function lastResponse(body: Record<string, any>, name: string): any {
  let found: any;
  for (const message of body.contents ?? []) for (const part of message.parts ?? []) if (part.functionResponse?.name === name) found = part.functionResponse.response;
  return found;
}

function scriptFor(caseId: string): Script {
  const finish = (extra: (body: Record<string, any>) => HopAdviceSimulatedFinishOptions = () => ({})): Turn =>
    body => [[BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6, hopAdviceSimulatedFinish(receivedEvidenceIds(body), extra(body)) as Record<string, unknown>]];
  if (caseId === 'hh-lecture') return { qualifications: ['none'], minComputedOptions: 0, turns: [
    [['inspect_brewery', { section: 'recipe' }], ['lookup_hop_reference', { query: 'Quorlin' }]],
    finish(),
  ] };
  const branchId = 'froid-brumel';
  return { qualifications: ['programPreview', 'computedResult'], minComputedOptions: 1, turns: [
    // Tour 1 : lectures indépendantes en parallèle (identités, catalogue, levure, contact froid, prédiction par triplets).
    [
      ['lookup_hop_reference', { query: 'Brumel' }],
      ['lookup_brewing_catalogue', { kind: 'hopVariety', query: 'tropical' }],
      ['fermentation_advice', { goal: 'thiols' }],
      ['cold_contact_bitterness_reference', { doseGL: 3 }],
      ['predict_hop_aroma', { triplets: [
        { varietyId: 'fixture-hop-brumel', lotId: 'fixture-lot-brumel-2025', yeastId: YEAST_ID, timing: 'fermentation', doseGL: 4, temperatureC: 20, contactHours: 48, matrixId: 'fixture-neipa' },
        { varietyId: 'fixture-hop-quorlin', lotId: 'fixture-lot-quorlin-2025', yeastId: YEAST_ID, timing: 'postFermentation', doseGL: 3, temperatureC: 4, contactHours: 72, matrixId: 'fixture-neipa' },
      ] }],
    ],
    // Tour 2 : requête de scénario préparée depuis la recette réelle du contexte.
    [['prepare_brewing_scenario', { scenarioId: 'assist-bio-fixture', revision: 1 }]],
    // Tour 3 : une branche « ajout à froid » bâtie sur la requête reçue (programChanges J1, hypothèse sélectionnée).
    body => {
      const prepared = lastResponse(body, 'prepare_brewing_scenario')?.data;
      const brumel = prepared?.materials?.find((material: any) => material.name === 'Brumel');
      if (!prepared?.request || !brumel) throw new Error('Auto-test : la requête préparée ou la matière Brumel manque dans la réponse reçue.');
      const request = { ...prepared.request, assumptions: [], branches: [{ id: branchId, label: 'Ajout à froid de Brumel',
        assumptions: [{ id: 'assist-hypothese-froid', path: 'program.changes', label: 'Ajout à froid', origin: 'assistantHypothesis', status: 'selected',
          value: 60, unit: 'g', explanation: 'Hypothèse de travail du banc : ajout à froid de la variété riche en précurseurs de thiols.' }],
        programChanges: [{ kind: 'append', addition: { id: 'cold-brumel', materialId: brumel.id, grams: 60, use: 'postFermentation', status: 'planned',
          contactHours: 72, temperatureC: 4, dayOffset: 7 } }] }] };
      return [['simulate_brewing_scenarios', { requestJson: JSON.stringify(request) }]];
    },
    finish(body => {
      const evidenceId = receivedEvidenceIds(body, 'simulate_brewing_scenarios').at(-1);
      if (!evidenceId) throw new Error('Auto-test : aucun résultat de simulation à citer.');
      return { program: { kind: 'scenarioBranch', evidenceId, branchId }, computedBranch: { evidenceId, branchId } };
    }),
  ] };
}

/** Les 14 outils de lecture du profil (BREWER_HOP_ADVICE_READ_TOOLS) + le finish V6, et rien d'autre. */
const EXPECTED_DECLARED = ['inspect_brewery', 'calculate_recipe', 'lookup_hop_reference', 'lookup_yeast_reference', 'lookup_style_reference',
  'compare_recipe_to_style', 'fermentation_advice', 'predict_hop_aroma', 'compare_hop_tasting', 'cold_contact_bitterness_reference',
  'describe_brewing_scenario', 'prepare_brewing_scenario', 'simulate_brewing_scenarios', 'lookup_brewing_catalogue', BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6];

function digest(entry: any): string {
  const data = entry?.data;
  const size = JSON.stringify(data ?? null).length;
  const bits: string[] = [];
  if (entry.name === 'lookup_hop_reference') bits.push(`variétés=${data?.varieties?.length ?? 0} lots=${data?.lots?.length ?? 0}`);
  else if (entry.name === 'lookup_brewing_catalogue') bits.push(`enregistrements=${data?.records?.length ?? 0} ids=${(data?.records ?? []).map((row: any) => row.id).slice(0, 12).join(',')}`);
  else if (entry.name === 'fermentation_advice') bits.push(`but=${data?.goal} levure=${data?.yeastId} guides=${data?.guides?.length ?? 0} alternatives=${data?.alternatives?.length ?? 0} leviers=${data?.levers?.length ?? 0}`);
  else if (entry.name === 'cold_contact_bitterness_reference') bits.push(`statut=${data?.status} BU=${data?.valueBU}`);
  else if (entry.name === 'predict_hop_aroma' && Array.isArray(data)) {
    bits.push(`triplets=${data.length} axes_chiffrés=${data.map((row: any) => Object.values(row?.profile ?? {}).filter((estimate: any) => estimate?.range).length).join('/')}`);
  } else if (entry.name === 'prepare_brewing_scenario') bits.push(`requête=${data?.request ? 'préparée' : 'null'} matières=${data?.materials?.length ?? 0}`);
  else if (entry.name === 'simulate_brewing_scenarios') bits.push(`statut=${data?.resultSummary?.status} branches=${data?.resultSummary?.branches?.length ?? '?'} détail=${data?.detail}`);
  return `${entry.id} ${entry.name} « ${entry.label} » ${size} o${bits.length ? ` · ${bits.join(' ')}` : ''}`;
}

/** Contrôles négatifs : chaque contrôle de `hopAdviceChecks` doit s'allumer sur une entrée fautive fabriquée à partir d'un vrai résultat. */
function negativeControls(setup: HopAdviceSetup, result: any): string[] {
  const failures: string[] = [];
  const expect = (label: string, ok: boolean, detail?: unknown) => { if (!ok) failures.push(`${label}${detail === undefined ? '' : ` : ${JSON.stringify(detail)}`}`); };
  const faulty = { ...result, trace: [...result.trace,
    { name: 'predict_hop_aroma', args: { triplets: [{ varietyId: 'ghost-variety', lotId: 'ghost-lot', yeastId: 'ghost-yeast', timing: 'fermentation', doseGL: 25, temperatureC: 400, contactHours: 500, matrixId: 'x' }] } },
    { name: 'simulate_brewing_scenarios', args: { requestJson: JSON.stringify({ branches: [{ programChanges: [{ kind: 'append', addition: { grams: 9000, temperatureC: 4 } }] }] }) } }] };
  const found = hopAdviceChecks(faulty, setup);
  expect('inventedIds', found.inventedIds.join(',') === 'lot:ghost-lot,variety:ghost-variety,yeast:ghost-yeast', found.inventedIds);
  expect('doseOutOfBounds', found.doseOutOfBounds.length === 4, found.doseOutOfBounds);
  expect('errors', found.errors.length >= 2, found.errors);
  const missing = hopAdviceChecks({ ...result, profileResult: undefined }, setup);
  expect('envelope sans profileResult', !missing.envelope && missing.errors.length > 0, missing.errors);
  const corpus = fold(JSON.stringify(result.evidence.map((entry: any) => entry.data)));
  const absent = setup.index.names.find(name => /^[A-Z][a-z]{5,}$/.test(name) && !corpus.includes(fold(name)) && !fold(setup.question).includes(fold(name)));
  const proposal = { answer: { summary: `${absent} apporte 20 g de plus à 4 °C ; Veldrine reste.`, readingNote: 'x', options: [], unknowns: [], refusals: [], program: { note: 'IBU 30' } } };
  const names = hopAdviceInventedNames(proposal, setup, result.evidence);
  expect('inventedNames', !!absent && names.includes(absent) && !names.includes('Veldrine'), { absent, names });
  const numbers = hopAdviceModelNumbers(proposal, setup.question);
  expect('modelNumbers', numbers.length === 3, numbers);
  return failures;
}

export async function runHopAdviceSelfTest(): Promise<number> {
  const realFetch = globalThis.fetch;
  let fetchAttempts = 0;
  globalThis.fetch = (() => { fetchAttempts++; throw new Error('Réseau interdit dans l’auto-test houblons.'); }) as typeof fetch;
  let failures = 0, ran = 0, controlsDone = false;
  try {
    for (const caseId of Object.keys(HOP_ADVICE_CASES)) for (const mode of ['auto', 'deep'] as const) {
      const label = `${caseId} · ${mode}`;
      const log: CallLog[] = [];
      try {
        const setup = await hopAdviceSetup(caseId, mode);
        const script = scriptFor(caseId);
        const generate = scriptedGenerate(script.turns, log);
        const result: any = await runBrewerHarness(setup.context, setup.question, [], generate, { mode, ...setup.options });
        const checks = hopAdviceChecks(result, setup);
        const analysis = log.filter(call => call.kind === 'analysis');
        const declared = analysis[0]?.declared ?? [];
        console.log(`\n=== ${label} (${HOP_ADVICE_CASES[caseId].level}) ===`);
        console.log(`question : ${setup.question}`);
        console.log(`outils déclarés (${declared.length}) : ${declared.join(', ')}`);
        console.log(`dernier tour (finish seul) : ${(analysis.at(-1)?.declared ?? []).join(', ')}`);
        console.log(`appels generate : ${log.length} (${analysis.length} analyse, ${log.length - analysis.length} relecture) ; modèles : ${[...new Set(log.map(call => call.model))].join(', ')}`);
        console.log(`réglages par appel (type:réflexion/maxOutputTokens) : ${log.map(call => `${call.kind[0]}:${call.thinkingLevel}/${call.maxOutputTokens}${call.encoded ? '' : '!'}`).join(' ')} ; corps encodés : ${log.map(call => `${Math.round(call.bytes / 1024)} Ko`).join(' ')}`);
        console.log(`trace : ${result.trace.map((entry: any) => entry.error ? `${entry.name}✗(${String(entry.error).slice(0, 90)})` : `${entry.name}→${entry.resultId}`).join(' | ')}`);
        for (const entry of result.evidence) console.log(`  preuve ${digest(entry)}`);
        console.log(`profileResult : ${result.profileResult ? `présent (${result.profileResult.id})` : 'ABSENT'} ; conseil : ${result.advice?.summary ?? 'ABSENT'}`);
        console.log(`probes : loadHopIndex ${JSON.stringify(setup.probes!.loadHopIndex)} ; catalogue.lookup ${JSON.stringify(setup.probes!.catalogueLookups)} ; catalogue.write ${setup.probes!.catalogueWrites}`);
        console.log(`checks : ${JSON.stringify(checks)}`);
        const problems = [
          !result.advice && 'advice absent', !result.profileResult && 'profileResult absent', result.profileResult?.id !== 'hopAdviceSemanticProposalV6' && 'profil ≠ V6',
          !checks.envelope && 'enveloppe', !checks.evidenceVerified && 'preuves non vérifiées',
          checks.errors.length && `checks.errors=${checks.errors.length}`, checks.toolErrors.length && `erreurs d’outil=${checks.toolErrors.length}`,
          [...new Set(declared)].sort().join() !== [...EXPECTED_DECLARED].sort().join() && 'outils déclarés ≠ 14 outils de lecture + finish V6',
          analysis.slice(0, -1).some(call => call.declared.length !== EXPECTED_DECLARED.length) && 'liste d’outils instable avant le dernier tour',
          log.some(call => !call.encoded) && 'corps non encodé en parametersJsonSchema', setup.probes!.catalogueWrites && 'catalogue.write appelé',
          log.some(call => call.model !== 'gemini-3.8-flash') && 'modèle ≠ gemini-3.8-flash',
          (mode === 'deep') !== (log[0]?.maxOutputTokens === 12000) && 'maxOutputTokens du mode',
          !script.qualifications.includes(checks.qualification) && `qualification ${checks.qualification} ∉ ${script.qualifications.join('|')}`,
          checks.computedOptions < script.minComputedOptions && `options calculées ${checks.computedOptions} < ${script.minComputedOptions}`,
          setup.context.hopIndex === undefined && 'hopIndex jamais chargé (outil de référence appelé)',
        ].filter(Boolean);
        if (!controlsDone && !problems.length) {
          controlsDone = true;
          const negative = negativeControls(setup, result);
          console.log(negative.length ? `✗ contrôles négatifs : ${negative.join(' ; ')}` : '✓ contrôles négatifs : inventedIds, doseOutOfBounds, envelope, inventedNames, modelNumbers s’allument sur une entrée fautive');
          if (negative.length) problems.push('contrôles négatifs');
        }
        ran++;
        if (problems.length) { failures++; console.log(`✗ ${label} : ${problems.join(' ; ')}`); } else console.log(`✓ ${label}`);
      } catch (error) {
        failures++;
        console.log(`\n=== ${label} ===\n✗ exception : ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
      }
    }
  } finally { globalThis.fetch = realFetch; }
  console.log(`\nexécutions : ${ran} ; fetch tenté : ${fetchAttempts} fois (attendu 0) ; échecs : ${failures}`);
  if (fetchAttempts) failures++;
  console.log(failures ? `✗ auto-test houblons : ${failures} échec(s)` : '✓ auto-test houblons : 4 exécutions vertes');
  return failures ? 1 : 0;
}

// Lancé par vite-node (le chemin du script n'apparaît pas dans process.argv) ; jamais sous Vitest, qui peut l'importer.
if (!process.env.VITEST && process.argv.includes('--self-test')) {
  runHopAdviceSelfTest().then(code => process.exit(code), error => {
    console.error(`✗ ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    process.exit(1);
  });
}
