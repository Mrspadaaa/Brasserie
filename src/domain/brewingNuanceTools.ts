import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import { usableHopKnowledge } from '../../functions/src/hopPredictionCore';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import { prepareBrewingScenarioContext } from './brewingScenarioContext';
import { assertBrewingScenarioRequest, simulateBrewingScenario } from './brewingScenario';
import { proposeBrewingNuancePlans, reviseBrewingNuancePlan, adoptBrewingNuancePlan, projectBrewingNuances,
  brewingNuanceViewModel, readBrewingNuanceProjection, type BrewingNuanceParameterChoice } from './brewingNuanceProjection';
import { assertBrewingSensoryDimension, assertBrewingSensoryComparison, type BrewingSensoryDimension } from './brewingSensory';
import { encodeBrewingScenarioArchive, decodeBrewingScenarioArchive } from './brewingScenarioArchive';
import { compactHopEvidence } from './hopIndex/companionPrediction';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

const names = ['prepare_brewing_nuances', 'project_brewing_nuances'] as const;
const string = (description: string) => ({ type: 'STRING', description });
const properties = {
  planId: string('ID stable du groupe de propositions'),
  proposedAt: string('Date ISO explicite; la conserver entre préparation et projection'),
  modelId: string('ID exact du modèle expert reçu à utiliser comme source de paramètres'),
  dimensionsJson: string('Tableau JSON de dimensions: id,version,name,definition,sourceRefs,terms; familyRefs facultatif et classificatoire seulement.')
};
export const brewingNuanceToolDeclarations = [
  { name: names[0], description: 'Préparer des variantes fines explicitement hypothétiques à partir des équations et paramètres reçus. Retourne plans, refs et choix éditables. Aucun score fin mesuré ni adoption implicite.',
    parameters: { type: 'OBJECT', properties, required: Object.keys(properties) } },
  { name: names[1], description: 'Exécuter une variante fine explicitement choisie sur les entrées d’un vrai scénario. Même DTO pour Barres/Radar, plan et sources archivés. Aucun enregistrement ni application recette; une sortie hypothétique ne devient pas observation.',
    parameters: { type: 'OBJECT', properties: { ...properties, selectedPlanReference: string('Référence exacte renvoyée par prepare_brewing_nuances'),
      requestJson: string('Requête complète de scénario J5, calculée avec les données privées du contexte'),
      parameterChoicesJson: string('Facultatif: liste COMPLETE de paramètres du plan révisé, avec identité/cible/plage/centrale/origine/raison/sources. Conserver les paramètres que l’on ne modifie pas.'),
      reason: string('Motif explicite du choix de ce scénario de paramètres par l’assistant, sans l’attribuer au brasseur') },
      required: [...Object.keys(properties), 'selectedPlanReference', 'requestJson', 'reason'] } }
];
export const isBrewingNuanceTool = (name: string): boolean => names.includes(name as typeof names[number]);
function json(value: unknown, label: string): any {
  if (typeof value !== 'string' || !value.trim() || value.length > 200_000) throw Error(`${label} JSON requis (200 Ko maximum).`);
  try { return JSON.parse(value); } catch { throw Error(`${label} JSON illisible.`); }
}
export function runBrewingNuanceTool(name: string, args: Record<string, unknown>, context: BrewerContext): Omit<BrewerEvidence, 'id'> {
  if (!isBrewingNuanceTool(name)) throw Error('Outil de nuances inconnu.');
  if (typeof args.planId !== 'string' || typeof args.proposedAt !== 'string' || typeof args.modelId !== 'string') throw Error('Identité, date et modèle requis.');
  const dimensions = json(args.dimensionsJson, 'Dimensions') as BrewingSensoryDimension[];
  if (!Array.isArray(dimensions)) throw Error('Tableau de dimensions requis.');
  dimensions.forEach(assertBrewingSensoryDimension);
  const prepared = prepareBrewingScenarioContext(context);
  const knowledge = usableHopKnowledge(prepared.runtime.engineData.knowledge).valid;
  const model = knowledge.find((row): row is HopExtrapolation => row.kind === 'extrapolation' && row.id === args.modelId && row.enabled);
  if (!model) throw Error('Modèle expert demandé indisponible dans ce contexte.');
  const proposedBy = { origin: 'assistant' as const, name: 'Assistant — proposition de paramètres explicitement hypothétiques' };
  const plans = proposeBrewingNuancePlans({ planId: args.planId, proposedAt: args.proposedAt, proposedBy,
    sourceModel: model, axes: knowledge.filter((row): row is HopAxis => row.kind === 'axis'), dimensions });
  const limits = [...prepared.limitations, 'Aucun coefficient source retuné; toute valeur fine est une projection de travail, pas une intensité mesurée.',
    'Les variantes aux centrales sont des scénarios, pas des incertitudes resserrées ou des faits attribués au brasseur.'];
  if (name === 'prepare_brewing_nuances') return { name, label: 'Propositions de modèle fin', facts: [], limits,
    data: { format: 'brewing-nuance-plans-v1', planId: args.planId, proposedAt: args.proposedAt, modelId: model.id,
      parameterBasis: { gain: model.gain, matrix: model.matrix, defaultYeast: model.defaultYeast, timings: model.timings,
        doseConventions: model.axes.map(axis => ({ id: axis.id, version: axis.version, doseScale: axis.doseScale })) },
      plans: plans.map(({ sourceModel, ...plan }) => ({ ...plan, sourceModel: { id: sourceModel.id, version: sourceModel.version, source: sourceModel.source },
        variant: plan.parameterChoices.length ? 'declaredCentralSensitivity' : 'fullGenericEnvelope' })),
      sourceModelArchive: encodeBrewingScenarioArchive(model) } };
  if (typeof args.selectedPlanReference !== 'string' || typeof args.reason !== 'string' || !args.reason.trim()) throw Error('Choix et motif explicites requis.');
  let plan = plans.find(row => row.reference === args.selectedPlanReference);
  if (!plan) throw Error('La proposition de modèle fin a changé; relire son contrat au lieu de la réancrer silencieusement.');
  if (args.parameterChoicesJson !== undefined) plan = reviseBrewingNuancePlan(plan, {
    parameterChoices: json(args.parameterChoicesJson, 'Paramètres') as BrewingNuanceParameterChoice[],
    proposedAt: args.proposedAt, proposedBy, explanation: args.reason
  });
  const adopted = adoptBrewingNuancePlan(plan, { adoptedAt: args.proposedAt, adoptedBy: proposedBy, reason: args.reason });
  const request = json(args.requestJson, 'Scénario'); assertBrewingScenarioRequest(request);
  const result = simulateBrewingScenario(request, prepared.runtime);
  const branches = [result.baseline, ...result.branches];
  const projection = projectBrewingNuances(adopted, branches.map(branch => ({ id: branch.id, name: branch.label,
    input: branch.input, sourceReference: branch.reference })), prepared.runtime.engineData,
  Object.fromEntries(branches.map(branch => [branch.id, branch.dependencySnapshot.engineData])));
  const view = brewingNuanceViewModel(projection, {
    context: { id: result.scenarioId, version: String(result.revision), kind: 'scenario', contentReference: result.inputReference,
      label: 'Contexte exact du scénario', sourceRefs: [] },
    reference: { id: 'baseline', version: String(result.revision), kind: request.baseline.kind, contentReference: result.baseline.reference, sourceRefs: [] }
  });
  return { name, label: 'Nuances projetées sous hypothèses adoptées', facts: [], limits: [...limits, ...projection.limitations],
    data: { format: 'brewing-nuance-evidence-v1', sourceScenarioReference: result.reference, projectionReference: projection.reference,
      planReference: adopted.reference, view: compactHopEvidence(view), archive: encodeBrewingScenarioArchive({
        format: 'brewing-nuance-evidence-content-v1', projection, view, sourceScenarioReference: result.reference }) } };
}

/** Reopens the exact numerical/provenance artifact, independently of current runtime/catalogues. */
export function readBrewingNuanceEvidence(value: unknown) {
  const row = value as any;
  if (!row || row.format !== 'brewing-nuance-evidence-v1' || !row.archive) throw Error('Preuve de nuances absente.');
  const decoded = decodeBrewingScenarioArchive(row.archive);
  if (decoded?.format !== 'brewing-nuance-evidence-content-v1' || decoded.sourceScenarioReference !== row.sourceScenarioReference) throw Error('Archive de nuances incompatible.');
  const projection = readBrewingNuanceProjection(decoded.projection);
  if ('status' in projection || projection.reference !== row.projectionReference || projection.planSnapshot.reference !== row.planReference) throw Error('Référence de preuve fine incohérente.');
  assertBrewingSensoryComparison(decoded.view);
  const expected = brewingNuanceViewModel(projection, { context: decoded.view.context, reference: decoded.view.reference });
  if (hopAdviceContentReference('brewing-nuance-view-content-v1', expected)
    !== hopAdviceContentReference('brewing-nuance-view-content-v1', decoded.view)) throw Error('Comparaison fine différente du résultat archivé.');
  return { projection, view: decoded.view, sourceScenarioReference: decoded.sourceScenarioReference as string };
}
