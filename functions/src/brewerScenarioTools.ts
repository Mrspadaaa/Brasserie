import type { BrewerEvidence } from './companionTypes.js';
import type { BrewerScenarioAccess, BrewerScenarioCommand } from './brewerScenarioStore.js';
import { brewingScenarioArchiveApi as archive } from './brewerTools.js';

const names = ['lookup_brewing_scenario', 'save_brewing_scenario', 'observe_brewing_scenario', 'prefer_brewing_scenario_branch'] as const;
const text = (description: string) => ({ type: 'STRING', description });
const revision = { type: 'INTEGER', description: 'Révision actuelle du dossier lue par lookup (0 pour sa première sauvegarde), distincte de la version du résultat calculé.' };
const declaration = (name: string, description: string, properties: Record<string, unknown>, required: string[]) => ({
  name, description, parameters: { type: 'OBJECT', properties, required }
});
export const brewerScenarioStoreToolDeclarations = [
  declaration('lookup_brewing_scenario', 'Relire un dossier de scénario enregistré et ses observations. Aucun recalcul : les anciennes données/hypothèses restent figées. Choisir resultRevision pour une ancienne estimation, sinon version courante.', {
    scenarioId: text('Identifiant exact de la lignée de scénarios'), resultRevision: { type: 'INTEGER', description: 'Version du résultat moteur à relire, facultative.' },
    detail: { type: 'STRING', enum: ['summary', 'chemistry', 'additions', 'full'], description: 'Résumé par défaut; demander explicitement chimie, ajouts ou sortie complète lorsque nécessaire. L’archive contient toujours toutes les données.' }
  }, ['scenarioId']),
  declaration('save_brewing_scenario', 'Sauvegarder le résultat réel de simulate_brewing_scenarios. Référence une preuve du tour, jamais un résultat chiffré inventé dans les arguments. Une nouvelle estimation de la même lignée conserve les précédentes; aucun effet sur recette/brassin/stock.', {
    evidenceId: text('ID de la preuve simulate_brewing_scenarios de ce tour'), operationId: text('ID logique stable et unique de cette sauvegarde; identique en reprise'),
    expectedRevision: revision, previousSnapshotReference: text('Référence précédente exacte si révision d’un dossier'), reason: text('Motif de la nouvelle estimation si révision')
  }, ['evidenceId', 'operationId', 'expectedRevision']),
  declaration('observe_brewing_scenario', 'Ajouter une observation explicitement fournie par le brasseur, même contraire à la prédiction, avec date et portée. L’estimation d’origine et ses hypothèses restent intactes; aucune observation ni mesure déduite d’une cible.', {
    scenarioId: text('Identifiant du dossier'), operationId: text('ID logique stable de cet ajout'), expectedRevision: revision,
    snapshotReference: text('Référence exacte du résultat auquel confronter l’observation'), branchId: text('Branche observée si précisée'),
    observationId: text('Identifiant stable de cette observation'), observedAt: text('Date/heure ISO de l’observation, avec fuseau, explicitement connue'),
    observationJson: text('JSON : qualitative {kind,dimension,reported,context?,method?,source?}; measurement {kind,dimension,analyte,value (nombre ou {min,max}),unit,basis,method,context?,source?}. Une source fournie suit HopSource, déclarée et non automatiquement vérifiée.')
  }, ['scenarioId', 'operationId', 'expectedRevision', 'snapshotReference', 'observationId', 'observedAt', 'observationJson']),
  declaration('prefer_brewing_scenario_branch', 'Conserver une préférence exprimée pour une branche précise. Une préférence n’applique pas la recette : l’aperçu et la validation du changement restent nécessaires.', {
    scenarioId: text('Identifiant du dossier'), operationId: text('ID logique stable'), expectedRevision: revision,
    snapshotReference: text('Référence exacte du résultat'), branchId: text('ID exact de la branche'), branchReference: text('Référence exacte de la branche'),
    preferenceId: text('ID stable de préférence'), reason: text('Raison de la préférence'), interpretation: text('Interprétation de l’intention, si précisée')
  }, ['scenarioId', 'operationId', 'expectedRevision', 'snapshotReference', 'branchId', 'branchReference', 'preferenceId', 'reason'])
];
export const isBrewerScenarioStoreTool = (name: string) => (names as readonly string[]).includes(name);
function stringArg(args: Record<string, unknown>, key: string, max = 200) {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error(`Champ ${key} requis ou invalide.`);
  return value;
}

export async function runBrewerScenarioStoreTool(name: string, args: Record<string, unknown>, evidence: readonly BrewerEvidence[], store: BrewerScenarioAccess): Promise<Omit<BrewerEvidence, 'id'>> {
  if (!isBrewerScenarioStoreTool(name)) throw Error('Outil de dossier scénario inconnu.');
  if (name === 'lookup_brewing_scenario') {
    const record = await store.read(stringArg(args, 'scenarioId'));
    if (!record) return { name, label: 'Scénario introuvable', data: null, facts: [], limits: ['Aucun dossier trouvé pour cet identifiant dans ce compte.'] };
    if (record.status === 'unsupportedFormat') return { name, label: 'Scénario conservé en lecture seule', data: record, facts: [], limits: ['Version future ou historique non pris en charge; aucun recalcul ni remplacement.'] };
    if (args.resultRevision !== undefined && (!Number.isSafeInteger(args.resultRevision) || Number(args.resultRevision) < 1)) throw Error('Version de résultat invalide.');
    const snapshot = args.resultRevision === undefined ? record.currentSnapshot : record.snapshots.find((row: any) => row.result.revision === args.resultRevision);
    if (!snapshot) throw Error('Cette version du résultat ne figure pas dans le dossier.');
    if (args.detail !== undefined && !['summary', 'chemistry', 'additions', 'full'].includes(String(args.detail))) throw Error('Niveau de détail inconnu.');
    return { name, label: 'Scénario enregistré · relecture fidèle', data: { ...archive.compactBrewingScenarioEvidence({ result: snapshot.result }, args.detail as any), scope: record.scope, dossier: record.dossier,
      history: record.snapshots.map((row: any) => ({ reference: row.reference, resultRevision: row.result.revision })),
      observations: record.events.filter((event: any) => event.kind === 'observationAppended'),
      preferences: record.events.filter((event: any) => event.kind === 'branchPreferred') },
      facts: ['Résultat relu avec ses données et hypothèses d’origine, sans exécution du simulateur.'],
      limits: ['Une observation opposée est conservée à côté de l’estimation. La préférence ne prouve pas une application de recette.'] };
  }
  const operationId = stringArg(args, 'operationId', 128);
  if (!Number.isSafeInteger(args.expectedRevision) || Number(args.expectedRevision) < 0) throw Error('Révision de dossier requise.');
  const expectedRevision = Number(args.expectedRevision);
  let command: BrewerScenarioCommand;
  if (name === 'save_brewing_scenario') {
    const source = evidence.find(entry => entry.id === args.evidenceId && entry.name === 'simulate_brewing_scenarios');
    const simulation = source ? archive.readBrewingScenarioEvidence(source.data, id => evidence.find(entry => entry.id === id)?.data).result : null;
    if (!simulation) throw Error('Une preuve réelle de simulate_brewing_scenarios dans ce tour est nécessaire.');
    command = { kind: 'saveResult', scenarioId: simulation.scenarioId, operationId, expectedRevision, result: simulation,
      ...(args.previousSnapshotReference !== undefined ? { previousSnapshotReference: stringArg(args, 'previousSnapshotReference', 300) } : {}),
      ...(args.reason !== undefined ? { reason: stringArg(args, 'reason', 4000) } : {}) };
  } else if (name === 'observe_brewing_scenario') {
    let observation: unknown;
    try { observation = JSON.parse(stringArg(args, 'observationJson', 40_000)); } catch { throw Error('Observation JSON illisible.'); }
    command = { kind: 'observe', scenarioId: stringArg(args, 'scenarioId'), operationId, expectedRevision,
      snapshotReference: stringArg(args, 'snapshotReference', 300), observationId: stringArg(args, 'observationId'),
      observedAt: stringArg(args, 'observedAt', 50), observation,
      ...(args.branchId !== undefined ? { branchId: stringArg(args, 'branchId') } : {}) };
  } else {
    command = { kind: 'preferBranch', scenarioId: stringArg(args, 'scenarioId'), operationId, expectedRevision,
      snapshotReference: stringArg(args, 'snapshotReference', 300), preferenceId: stringArg(args, 'preferenceId'),
      branchId: stringArg(args, 'branchId'), branchReference: stringArg(args, 'branchReference', 300), reason: stringArg(args, 'reason', 4000),
      ...(args.interpretation !== undefined ? { interpretation: stringArg(args, 'interpretation', 4000) } : {}) };
  }
  const saved = await store.write(command);
  return { name, label: 'Dossier scénario enregistré', data: { status: saved.status, receipt: saved.receipt, dossier: saved.record.dossier },
    facts: [saved.status === 'duplicate' ? 'Reçu déjà acquis; aucune écriture en double.' : 'Enregistrement du dossier confirmé par son reçu.'],
    limits: ['Aucune recette, opération effectuée ou donnée de stock modifiée. Les anciens résultats et observations sont conservés.'] };
}
