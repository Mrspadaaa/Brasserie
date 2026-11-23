import { assertHopExtrapolation, type HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import { assertHopKnowledge, type HopAxis, type HopTiming } from '../../functions/src/hopPredictionSchema';
import { assertHopRecipeInput, predictHopRecipe, type HopRecipeInput, type HopRecipePrediction } from '../../functions/src/hopRecipePrediction';
import { assertHopDocument, hopSourceError, validHopRange, type HopRange, type HopSource } from '../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import type { HopEngineData as EngineData } from '../../functions/src/hopPredictionCore';
import { isBrewingScenarioModelParameterUsed, type BrewingScenarioModelParameter } from './brewingScenario';
import { assertBrewingSensoryDimension, assertBrewingSensoryDefinitionReference, createBrewingSensoryDefinitionReference, createBrewingSensoryComparison,
  assertBrewingSensoryCandidates, assertBrewingSensoryDefinitionSet,
  type BrewingSensoryComparisonDTO, type BrewingSensoryComparisonContext, type BrewingSensoryComparisonReference,
  type BrewingSensoryDimension, type BrewingSensoryDefinitionReference } from './brewingSensory';

export const BREWING_NUANCE_PLAN_VERSION = 'brewing-nuance-plan-v1' as const;
export const BREWING_NUANCE_PROJECTION_VERSION = 'brewing-nuance-projection-v1' as const;
type Parameter = HopExtrapolation['matrix'];
type Actor = { origin: 'user' | 'assistant' | 'model'; name: string };
type Row = Record<string, any>;

const RULE_SOURCE: HopSource = { title: 'Projection de nuances sous hypothèses génériques explicitement adoptées',
  author: 'L’Affinée — convention exploratoire', year: 2026, kind: 'judgment',
  reference: 'local-rule:brewing-nuance-projection-v1', locator: 'src/domain/brewingNuanceProjection.ts; réemploi des équations du modèle expert, aucune calibration fine revendiquée.' };
const clone = <T>(value: T): T => structuredClone(value);
const object = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const check: (v: unknown, message: string) => asserts v = (v, message) => { if (!v) throw Error(message); };
const iso = (v: unknown) => text(v) && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
const content = (kind: string, value: unknown) => hopAdviceContentReference(kind, value);
const hashTail = (reference: string) => reference.slice(reference.lastIndexOf(':') + 1);
const keys = (row: Row, allowed: string[], label: string) => check(Object.keys(row).every(key => allowed.includes(key)), `${label}: champ non pris en charge.`);
const same = (a: unknown, b: unknown) => content('brewing-nuance-value-v1', a) === content('brewing-nuance-value-v1', b);

export type BrewingNuanceParameterTarget =
  | { kind: 'gain' }
  | { kind: 'matrix' }
  | { kind: 'timing'; timing: HopTiming; parameter: 'expression' | 'halfSaturationGL' | 'extractionHours' | 'decayHours' }
  | { kind: 'dimension'; dimensionReference: string; parameter: 'doseScale' | 'yeastAroma' | 'yeastExpression' };
export interface BrewingNuanceParameterChoice {
  id: string; target: BrewingNuanceParameterTarget; range: HopRange; central: number;
  origin: 'userHypothesis' | 'assistantHypothesis' | 'modelHypothesis' | 'analogy' | 'sourceRange';
  explanation: string; sourceRefs: HopSource[];
}
export interface BrewingNuancePlan {
  version: typeof BREWING_NUANCE_PLAN_VERSION;
  planId: string; revision: number; previousReference?: string;
  status: 'proposed' | 'adopted'; proposedAt: string; proposedBy: Actor; explanation: string;
  sourceModel: HopExtrapolation; sourceModelReference: string;
  doseAxis: HopAxis; doseAxisReference: string;
  definitions: BrewingSensoryDefinitionReference[];
  parameterChoices: BrewingNuanceParameterChoice[];
  adoption?: { adoptedAt: string; adoptedBy: Actor; reason: string; proposalReference: string };
  reference: string;
}
export interface BrewingNuanceCandidate {
  id: string; name: string; input: HopRecipeInput;
  /** Optional immutable J5 result/branch reference; never an application receipt. */
  sourceReference?: string;
}
export interface BrewingNuanceProjection {
  version: typeof BREWING_NUANCE_PROJECTION_VERSION;
  reference: string; planSnapshot: BrewingNuancePlan;
  candidates: Array<{
    id: string; name: string; sourceReference?: string;
    requestedInputSnapshot?: HopRecipeInput;
    inputSnapshot: HopRecipeInput; dependencySnapshot: EngineData; modelSnapshot: HopExtrapolation;
    prediction: HopRecipePrediction;
    values: Array<{ definition: BrewingSensoryDefinitionReference; internalAxisId: string;
      status: 'hypothetical' | 'unknown'; estimate: HopRecipePrediction['overall']['profile'][string] | null }>;
    usedParameterChoiceIds: string[]; unappliedParameterChoiceIds: string[];
  }>;
  limitations: string[];
}

export function brewingNuancePlanReference(plan: Omit<BrewingNuancePlan, 'reference'> | BrewingNuancePlan): string {
  const { reference: _reference, ...value } = plan as BrewingNuancePlan;
  return content('brewing-nuance-plan-content-v1', value);
}
function assertActor(value: unknown): asserts value is Actor {
  check(object(value) && ['user', 'assistant', 'model'].includes(value.origin) && text(value.name), 'Origine/auteur de l’hypothèse absent.');
  keys(value, ['origin', 'name'], 'Auteur');
}
function axisId(definition: BrewingSensoryDefinitionReference): string {
  return `nuance-${hashTail(definition.contentReference)}`;
}
function assertTarget(target: unknown, definitions: BrewingSensoryDefinitionReference[]): asserts target is BrewingNuanceParameterTarget {
  check(object(target), 'Cible du paramètre absente.');
  if (target.kind === 'gain' || target.kind === 'matrix') { keys(target, ['kind'], 'Cible'); return; }
  if (target.kind === 'timing') {
    keys(target, ['kind', 'timing', 'parameter'], 'Cible temporelle');
    check(['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'].includes(target.timing)
      && ['expression', 'halfSaturationGL', 'extractionHours', 'decayHours'].includes(target.parameter), 'Paramètre temporel invalide.'); return;
  }
  check(target.kind === 'dimension', 'Nature de paramètre inconnue.');
  keys(target, ['kind', 'dimensionReference', 'parameter'], 'Cible fine');
  check(definitions.some(row => row.contentReference === target.dimensionReference)
    && ['doseScale', 'yeastAroma', 'yeastExpression'].includes(target.parameter), 'Dimension/paramètre fin absent.');
}
export function assertBrewingNuancePlan(value: unknown): asserts value is BrewingNuancePlan {
  check(object(value), 'Plan de nuances absent.');
  keys(value, ['version', 'planId', 'revision', 'previousReference', 'status', 'proposedAt', 'proposedBy', 'explanation',
    'sourceModel', 'sourceModelReference', 'doseAxis', 'doseAxisReference', 'definitions', 'parameterChoices', 'adoption', 'reference'], 'Plan');
  check(value.version === BREWING_NUANCE_PLAN_VERSION && text(value.planId) && Number.isSafeInteger(value.revision) && value.revision >= 1
    && ['proposed', 'adopted'].includes(value.status) && iso(value.proposedAt) && text(value.explanation), 'Plan de nuances mal formé.');
  assertActor(value.proposedBy); assertHopExtrapolation(value.sourceModel); assertHopKnowledge(value.doseAxis);
  check(value.doseAxis.kind === 'axis' && value.sourceModel.enabled
    && value.sourceModel.axes.some((axis: Row) => axis.id === value.doseAxis.id && axis.version === value.doseAxis.version), 'Convention de dose/axe modèle indisponible.');
  check(value.sourceModelReference === content('brewing-nuance-source-model-v1', value.sourceModel)
    && value.doseAxisReference === content('brewing-nuance-dose-axis-v1', value.doseAxis), 'Source du plan modifiée.');
  check(Array.isArray(value.definitions) && value.definitions.length > 0 && Array.isArray(value.parameterChoices), 'Définitions/paramètres absents.');
  value.definitions.forEach(assertBrewingSensoryDefinitionReference);
  assertBrewingSensoryDefinitionSet(value.definitions);
  check(new Set(value.definitions.map((d: Row) => d.contentReference)).size === value.definitions.length, 'Définition fine dupliquée.');
  for (const definition of value.definitions as BrewingSensoryDefinitionReference[]) {
    check(definition.metric?.kind === 'modelIndex' && definition.scale?.domain
      && same(definition.scale.domain, value.doseAxis.scale) && definition.dimension.terms?.length,
    'La projection exige une métrique d’indice hypothétique, son échelle et un lexique explicites.');
  }
  const targetKeys = new Set<string>(), ids = new Set<string>();
  for (const choice of value.parameterChoices) {
    check(object(choice), 'Choix de paramètre invalide.');
    keys(choice, ['id', 'target', 'range', 'central', 'origin', 'explanation', 'sourceRefs'], 'Choix');
    check(text(choice.id) && !ids.has(choice.id) && validHopRange(choice.range) && Number.isFinite(choice.central)
      && choice.central >= choice.range.min && choice.central <= choice.range.max && text(choice.explanation)
      && ['userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'analogy', 'sourceRange'].includes(choice.origin)
      && Array.isArray(choice.sourceRefs) && choice.sourceRefs.every((source: unknown) => !hopSourceError(source)), 'Paramètre fin sans valeur/provenance cohérente.');
    assertTarget(choice.target, value.definitions);
    const key = content('brewing-nuance-parameter-target-v1', choice.target);
    check(!targetKeys.has(key), 'Deux choix concurrents pour le même paramètre.');
    if (choice.origin === 'sourceRange') check(choice.sourceRefs.length > 0, 'Une plage documentaire exige sa source.');
    targetKeys.add(key); ids.add(choice.id);
  }
  if (value.previousReference !== undefined) check(text(value.previousReference), 'Prédécesseur de plan invalide.');
  if (value.status === 'adopted') {
    check(object(value.adoption) && iso(value.adoption.adoptedAt) && text(value.adoption.reason), 'Adoption explicite absente.');
    keys(value.adoption, ['adoptedAt', 'adoptedBy', 'reason', 'proposalReference'], 'Adoption'); assertActor(value.adoption.adoptedBy);
    const { adoption: _adoption, ...proposed } = value;
    check(value.adoption.proposalReference === brewingNuancePlanReference({ ...proposed, status: 'proposed' } as BrewingNuancePlan), 'L’adoption ne correspond pas au plan proposé.');
  } else check(value.adoption === undefined, 'Un plan seulement proposé ne porte pas d’adoption.');
  check(value.reference === brewingNuancePlanReference(value as BrewingNuancePlan), 'Empreinte de plan invalide.');
}

/** Proposes distinct existing dose conventions, not a coefficient per fruit name. */
export function proposeBrewingNuancePlans(input: {
  planId: string; dimensions: BrewingSensoryDimension[]; sourceModel: HopExtrapolation;
  axes: HopAxis[]; proposedAt: string; proposedBy: Actor;
}): BrewingNuancePlan[] {
  assertHopExtrapolation(input.sourceModel); assertActor(input.proposedBy);
  check(iso(input.proposedAt) && text(input.planId) && input.dimensions.length > 0, 'Identité/date/dimensions de proposition requises.');
  input.dimensions.forEach(assertBrewingSensoryDimension);
  const conventions = new Map<string, HopAxis>();
  for (const sourceAxis of input.sourceModel.axes) {
    const axis = input.axes.find(row => row.id === sourceAxis.id && row.version === sourceAxis.version);
    if (!axis) continue;
    const key = content('brewing-nuance-dose-convention-v1', { range: sourceAxis.doseScale.range,
      central: sourceAxis.doseScale.central, scale: axis.scale });
    if (!conventions.has(key)) conventions.set(key, axis);
  }
  return [...conventions.values()].flatMap((axis, index) => {
    const metric = { id: 'hypothetical-nuance-salience', version: '1', kind: 'modelIndex' as const,
      name: 'Indice hypothétique de saillance d’une nuance', unit: 'points d’indice',
      meaning: 'Enveloppe conditionnelle d’une variante fine du modèle expert; aucune intensité mesurée ou couverture statistique.', sourceRefs: [RULE_SOURCE] };
    const scale = { id: `nuance-scale-${hashTail(content('range-v1', axis.scale))}`, version: '1',
      metricRef: { id: metric.id, version: metric.version }, domain: clone(axis.scale), sourceRefs: [RULE_SOURCE] };
    const plan: BrewingNuancePlan = { version: BREWING_NUANCE_PLAN_VERSION, planId: `${input.planId}-${index + 1}`, revision: 1,
      status: 'proposed', proposedAt: input.proposedAt, proposedBy: clone(input.proposedBy),
      explanation: `Hypothèse transférant les paramètres génériques du modèle ${input.sourceModel.name} et sa convention de dose ${axis.id}@${axis.version}. Les lexiques fins remplacent les lexiques de famille; les profils fermentaires fins utilisent explicitement les priors génériques, jamais la sortie chiffrée d’une famille.`,
      sourceModel: clone(input.sourceModel), sourceModelReference: content('brewing-nuance-source-model-v1', input.sourceModel),
      doseAxis: clone(axis), doseAxisReference: content('brewing-nuance-dose-axis-v1', axis),
      definitions: input.dimensions.map(dimension => createBrewingSensoryDefinitionReference(dimension, metric, scale)),
      parameterChoices: [], reference: '' };
    plan.reference = brewingNuancePlanReference(plan); assertBrewingNuancePlan(plan);
    // A sensitivity scenario fixes declared central coefficients; it does not
    // narrow the uncertainty of the source data or become the default truth.
    const centralChoices: BrewingNuanceParameterChoice[] = plan.definitions.flatMap(definition =>
      (['yeastAroma', 'yeastExpression'] as const).map(parameter => {
        const prior = input.sourceModel.defaultYeast[parameter === 'yeastAroma' ? 'aroma' : 'expression'];
        return { id: `${parameter}-${hashTail(definition.contentReference)}`,
          target: { kind: 'dimension' as const, dimensionReference: definition.contentReference, parameter },
          range: { min: prior.central, max: prior.central }, central: prior.central, origin: 'modelHypothesis' as const,
          explanation: `Scénario de sensibilité fixant ${parameter} à la centrale explicitement déclarée du modèle (${prior.central}); aucune incertitude empirique réduite.`,
          sourceRefs: [clone(prior.source)] };
      }));
    const central: BrewingNuancePlan = { ...clone(plan), planId: `${plan.planId}-central`, previousReference: plan.reference,
      explanation: `${plan.explanation} Variante de sensibilité aux seules centrales fermentaires déjà déclarées; hypothèse de travail distincte de l’enveloppe complète et sans meilleure calibration revendiquée.`,
      parameterChoices: centralChoices, reference: '' };
    central.reference = brewingNuancePlanReference(central); assertBrewingNuancePlan(central);
    return [plan, central];
  });
}

export function reviseBrewingNuancePlan(plan: BrewingNuancePlan, input: {
  parameterChoices: BrewingNuanceParameterChoice[]; proposedAt: string; proposedBy: Actor; explanation: string;
}): BrewingNuancePlan {
  assertBrewingNuancePlan(plan);
  const { adoption: _adoption, ...prior } = clone(plan);
  const next: BrewingNuancePlan = { ...prior, ...clone(input), revision: plan.revision + 1,
    previousReference: plan.reference, status: 'proposed', reference: '' };
  next.reference = brewingNuancePlanReference(next); assertBrewingNuancePlan(next); return next;
}
export function adoptBrewingNuancePlan(plan: BrewingNuancePlan, input: { adoptedAt: string; adoptedBy: Actor; reason: string }): BrewingNuancePlan {
  assertBrewingNuancePlan(plan); check(plan.status === 'proposed', 'Cette version du plan est déjà adoptée.');
  const next: BrewingNuancePlan = { ...clone(plan), status: 'adopted', adoption: { ...clone(input), proposalReference: plan.reference }, reference: '' };
  next.reference = brewingNuancePlanReference(next); assertBrewingNuancePlan(next); return next;
}

function hypothesisSource(plan: BrewingNuancePlan, choice?: BrewingNuanceParameterChoice): HopSource {
  return { title: choice ? `Paramètre hypothétique · ${choice.explanation}` : 'Variante fine explicitement adoptée du modèle expert',
    author: choice ? choice.origin : `${plan.proposedBy.origin} · ${plan.proposedBy.name}`, year: new Date(plan.proposedAt).getUTCFullYear(),
    kind: 'judgment', reference: `${plan.reference}${choice ? `:${encodeURIComponent(choice.id)}` : ''}`,
    locator: choice?.explanation ?? plan.explanation };
}
function workingData(plan: BrewingNuancePlan, candidate: BrewingNuanceCandidate, data: EngineData) {
  const source = hypothesisSource(plan), model = clone(plan.sourceModel);
  model.id = `nuance-model-${hashTail(plan.reference)}`; model.version = `${BREWING_NUANCE_PLAN_VERSION}:${plan.revision}`;
  model.name = 'Projection fine sous hypothèses adoptées'; model.source = source;
  model.evidence = [...model.evidence, clone(RULE_SOURCE), source];
  model.limitations = [...model.limitations, plan.explanation, 'Modèle fin distinct des familles; présence documentaire, quantité analytique et intensité observée ne sont pas interchangeables.'];
  const dose = plan.sourceModel.axes.find(axis => axis.id === plan.doseAxis.id && axis.version === plan.doseAxis.version)!.doseScale;
  const axes: HopAxis[] = plan.definitions.map(definition => ({ ...clone(plan.doseAxis), id: axisId(definition), version: definition.contentReference,
    name: definition.dimension.name, description: definition.dimension.definition, source: clone(RULE_SOURCE) }));
  model.axes = plan.definitions.map(definition => ({ id: axisId(definition), version: definition.contentReference,
    terms: [...definition.dimension.terms!], doseScale: clone(dose), source }));
  // Fine strain profiles are declared generic working priors, never a copied pomeFruit output or strain-specific measurement.
  model.yeasts = candidate.input.yeastId && data.knowledge.some(row => row.kind === 'yeast' && row.id === candidate.input.yeastId)
    ? [{ yeastId: candidate.input.yeastId, source, evidence: [source, plan.sourceModel.defaultYeast.aroma.source, plan.sourceModel.defaultYeast.expression.source],
      aroma: Object.fromEntries(axes.map(axis => [axis.id, clone(plan.sourceModel.defaultYeast.aroma)])),
      expression: Object.fromEntries(axes.map(axis => [axis.id, clone(plan.sourceModel.defaultYeast.expression)])),
      otherAroma: clone(plan.sourceModel.defaultYeast.aroma), otherExpression: clone(plan.sourceModel.defaultYeast.expression),
      notes: ['Priors génériques transférés par l’hypothèse adoptée; aucun profil fermentaire fin mesuré.'] }] : [];
  delete model.doseReferences; // Curves calibrated on a broad axis are not calibration of the fine facet.
  const uses = new Map<string, BrewingScenarioModelParameter[]>();
  for (const choice of plan.parameterChoices) {
    const parameter: Parameter = { range: clone(choice.range), central: choice.central, source: hypothesisSource(plan, choice) };
    model.evidence.push(parameter.source, ...choice.sourceRefs);
    const target = choice.target;
    if (target.kind === 'gain' || target.kind === 'matrix') { model[target.kind] = parameter; uses.set(choice.id, [{ kind: target.kind }]); }
    else if (target.kind === 'timing') {
      check(target.parameter !== 'decayHours' || model.timings[target.timing].decayHours !== null, 'Cette convention ne définit pas de décroissance pour cet emploi.');
      model.timings[target.timing][target.parameter] = parameter; uses.set(choice.id, [clone(target)]);
    } else {
      const definition = plan.definitions.find(row => row.contentReference === target.dimensionReference)!;
      const id = axisId(definition);
      if (target.parameter === 'doseScale') { model.axes.find(axis => axis.id === id)!.doseScale = parameter; uses.set(choice.id, [{ kind: 'axisDoseScale', axisId: id }]); }
      else {
        const field = target.parameter === 'yeastAroma' ? 'aroma' : 'expression';
        model.yeasts.forEach(yeast => { yeast[field][id] = clone(parameter); });
        uses.set(choice.id, model.yeasts.map(yeast => ({ kind: 'yeastProfile', yeastId: yeast.yeastId, axisId: id, parameter: field })));
      }
    }
  }
  assertHopExtrapolation(model); axes.forEach(axis => assertHopKnowledge(axis));
  const varietyIds = new Set(candidate.input.additions.map(row => row.triplet.varietyId));
  const lotIds = new Set(candidate.input.additions.map(row => row.triplet.lotId));
  const knowledge = data.knowledge.filter(row => row.kind === 'confidence' || row.kind === 'risk'
    || row.kind === 'yeast' && row.id === candidate.input.yeastId
    || row.kind === 'fermentation' && row.yeastId === candidate.input.yeastId);
  const projected: EngineData = { varieties: clone(data.varieties.filter(row => varietyIds.has(row.id))),
    lots: clone(data.lots.filter(row => lotIds.has(row.id))), knowledge: [...clone(knowledge), ...axes, model] };
  return { data: projected, model, uses };
}

export function brewingNuanceProjectionReference(value: Omit<BrewingNuanceProjection, 'reference'> | BrewingNuanceProjection): string {
  const { reference: _reference, ...body } = value as BrewingNuanceProjection;
  return content('brewing-nuance-projection-content-v1', body);
}

export function projectBrewingNuances(plan: BrewingNuancePlan, candidates: BrewingNuanceCandidate[], data: EngineData,
  candidateData?: Readonly<Record<string, EngineData>>): BrewingNuanceProjection {
  assertBrewingNuancePlan(plan); check(plan.status === 'adopted', 'Adopter explicitement une hypothèse de projection avant de chiffrer les nuances.');
  check(Array.isArray(candidates) && candidates.length > 0, 'Candidats absents.');
  // The producer accepts the same identities as the shared comparison DTO.
  // Reject early; never rename a series after a calculation has been archived.
  assertBrewingSensoryCandidates(candidates.map(candidate => object(candidate) ? { id: candidate.id, name: candidate.name } : candidate));
  const source = data.knowledge.find(row => row.kind === 'extrapolation' && row.id === plan.sourceModel.id && row.version === plan.sourceModel.version);
  const axis = data.knowledge.find(row => row.kind === 'axis' && row.id === plan.doseAxis.id && row.version === plan.doseAxis.version);
  check(source && same(source, plan.sourceModel) && axis && same(axis, plan.doseAxis), 'Le modèle source ou sa convention ont changé; réviser le plan au lieu de le réancrer silencieusement.');
  const projected = candidates.map(candidate => {
    check(text(candidate.id) && text(candidate.name) && (candidate.sourceReference === undefined || text(candidate.sourceReference)), 'Identité de candidat absente.');
    assertHopRecipeInput(candidate.input);
    const override = candidateData && Object.prototype.hasOwnProperty.call(candidateData, candidate.id) ? candidateData[candidate.id] : undefined;
    const working = workingData(plan, candidate, override ?? data);
    const prediction = predictHopRecipe(clone(candidate.input), {}, working.data);
    const usedParameterChoiceIds: string[] = [], unappliedParameterChoiceIds: string[] = [];
    for (const choice of plan.parameterChoices) {
      const used = (working.uses.get(choice.id) ?? []).some(parameter => isBrewingScenarioModelParameterUsed(parameter, working.model, [prediction], working.data));
      (used ? usedParameterChoiceIds : unappliedParameterChoiceIds).push(choice.id);
    }
    return { id: candidate.id, name: candidate.name, ...(candidate.sourceReference ? { sourceReference: candidate.sourceReference } : {}),
      requestedInputSnapshot: clone(candidate.input), inputSnapshot: clone(prediction.input),
      dependencySnapshot: clone(working.data), modelSnapshot: clone(working.model), prediction,
      values: plan.definitions.map(definition => {
        const estimate = prediction.overall.profile[axisId(definition)] ?? null;
        return { definition: clone(definition), internalAxisId: axisId(definition), status: estimate?.range ? 'hypothetical' as const : 'unknown' as const,
          estimate: clone(estimate) };
      }), usedParameterChoiceIds, unappliedParameterChoiceIds };
  });
  const value: BrewingNuanceProjection = { version: BREWING_NUANCE_PROJECTION_VERSION, reference: '', planSnapshot: clone(plan), candidates: projected,
    limitations: ['Indice de travail sous hypothèses adoptées; aucune intensité fine de bière observée ni intervalle de confiance.',
      'Les occurrences documentaires restent dans leur contexte; leur nombre et leurs qualificatifs ne sont pas convertis en mesures.',
      'Les profils fermentaires fins sont des priors génériques explicitement transférés, pas des valeurs copiées des familles ni une calibration par souche.',
      'Le paramètre d’expression est un indice expert; ce n’est pas un rendement enzymatique de biotransformation. Les contributions biologiques J5 restent distinctes.',
      'Les courbes empiriques de familles ne sont pas transférées aux nuances. Les coefficients reçus des modèles sources restent inchangés.',
      'Chaque projection conserve ses propres hypothèses; les réglages d’un autre modèle ne sont pas importés implicitement.',
      ...new Set(projected.flatMap(row => row.prediction.warnings))] };
  value.reference = brewingNuanceProjectionReference(value);
  return value;
}

/** Historical read verifies identities and exact payloads; no prediction is run. */
export function readBrewingNuanceProjection(value: unknown): BrewingNuanceProjection | { status: 'unsupportedFormat'; raw: unknown } {
  check(object(value) && text(value.version), 'Archive de projection fine invalide.');
  if (value.version !== BREWING_NUANCE_PROJECTION_VERSION) return { status: 'unsupportedFormat', raw: clone(value) };
  keys(value, ['version', 'reference', 'planSnapshot', 'candidates', 'limitations'], 'Projection fine');
  assertBrewingNuancePlan(value.planSnapshot);
  check(value.planSnapshot.status === 'adopted' && Array.isArray(value.candidates) && value.candidates.length > 0 && Array.isArray(value.limitations), 'Projection fine incomplète.');
  assertBrewingSensoryCandidates(value.candidates.map((candidate: unknown) => object(candidate) ? { id: candidate.id, name: candidate.name } : candidate));
  check(value.reference === brewingNuanceProjectionReference(value as BrewingNuanceProjection), 'Empreinte de projection fine incorrecte.');
  check(value.limitations.every(text), 'Limites de projection invalides.');
  const ids = new Set<string>(), definitions = value.planSnapshot.definitions;
  const parameterIds = new Set(value.planSnapshot.parameterChoices.map(row => row.id));
  for (const candidate of value.candidates) {
    check(object(candidate), 'Candidat de projection invalide.');
    keys(candidate, ['id', 'name', 'sourceReference', 'requestedInputSnapshot', 'inputSnapshot', 'dependencySnapshot', 'modelSnapshot', 'prediction', 'values',
      'usedParameterChoiceIds', 'unappliedParameterChoiceIds'], 'Candidat');
    check(text(candidate.id) && !ids.has(candidate.id) && text(candidate.name), 'Candidat absent ou répété.'); ids.add(candidate.id);
    assertHopRecipeInput(candidate.inputSnapshot); assertHopExtrapolation(candidate.modelSnapshot);
    if (candidate.requestedInputSnapshot !== undefined) assertHopRecipeInput(candidate.requestedInputSnapshot);
    const dependencies = candidate.dependencySnapshot;
    check(object(dependencies) && Array.isArray(dependencies.varieties) && Array.isArray(dependencies.lots) && Array.isArray(dependencies.knowledge), 'Dépendances de projection absentes.');
    keys(dependencies, ['varieties', 'lots', 'knowledge'], 'Dépendances');
    dependencies.varieties.forEach(row => assertHopDocument('hopVarieties', row));
    dependencies.lots.forEach(row => assertHopDocument('hopLots', row));
    dependencies.knowledge.forEach(row => assertHopKnowledge(row));
    check(dependencies.knowledge.some(row => row.kind === 'extrapolation' && same(row, candidate.modelSnapshot)), 'Le modèle figé ne correspond pas aux dépendances.');
    check(object(candidate.prediction) && same(candidate.prediction.input, candidate.inputSnapshot)
      && object(candidate.prediction.overall?.profile) && Array.isArray(candidate.values), 'Prédiction fine sans entrée cohérente.');
    check(candidate.values.length === definitions.length, 'Dimensions de projection incomplètes.');
    const seen = new Set<string>();
    for (const row of candidate.values) {
      check(object(row), 'Valeur fine invalide.');
      keys(row, ['definition', 'internalAxisId', 'status', 'estimate'], 'Valeur fine');
      assertBrewingSensoryDefinitionReference(row.definition);
      const definition = definitions.find(item => item.contentReference === row.definition.contentReference);
      check(definition && same(definition, row.definition) && !seen.has(definition.contentReference)
        && row.internalAxisId === axisId(definition), 'Définition fine absente, altérée ou répétée.'); seen.add(definition.contentReference);
      const estimate = candidate.prediction.overall.profile[row.internalAxisId] ?? null;
      check(same(row.estimate, estimate) && row.status === (estimate?.range ? 'hypothetical' : 'unknown'), 'Valeur affichée différente du calcul conservé.');
      if (estimate?.range) {
        const domain = definition.scale!.domain!;
        check(validHopRange(estimate.range) && estimate.range.min >= domain.min && estimate.range.max <= domain.max
          && (estimate.central === undefined || Number.isFinite(estimate.central) && estimate.central >= estimate.range.min && estimate.central <= estimate.range.max), 'Projection hors de son échelle.');
      }
    }
    const used = candidate.usedParameterChoiceIds, unused = candidate.unappliedParameterChoiceIds;
    check(Array.isArray(used) && Array.isArray(unused) && [...used, ...unused].every(id => parameterIds.has(id))
      && new Set([...used, ...unused]).size === parameterIds.size && used.length + unused.length === parameterIds.size,
    'Suivi des paramètres incomplet ou incohérent.');
  }
  return clone(value as BrewingNuanceProjection);
}

/** Both render modes consume this DTO; metric definitions are not UI conversions. */
export function brewingNuanceViewModel(projection: BrewingNuanceProjection, input: {
  context: BrewingSensoryComparisonContext; reference: BrewingSensoryComparisonReference;
}): BrewingSensoryComparisonDTO {
  const checked = readBrewingNuanceProjection(projection);
  check(!('status' in checked), 'Projection future conservée en lecture seule.');
  return createBrewingSensoryComparison({ ...clone(input), candidates: checked.candidates.map(({ id, name }) => ({ id, name })),
    candidateOrder: checked.candidates.map(row => row.id), dimensionOrder: checked.planSnapshot.definitions.map(row => row.contentReference),
    dimensions: checked.planSnapshot.definitions.map(definition => ({ definition: clone(definition), values: checked.candidates.map(candidate => {
      const estimate = candidate.values.find(value => value.definition.contentReference === definition.contentReference)?.estimate;
      const provenance = { sourceRefs: clone(estimate?.sources ?? []), modelRef: { id: candidate.modelSnapshot.id, version: candidate.modelSnapshot.version },
        hypothesisRefs: [checked.planSnapshot.reference, ...candidate.usedParameterChoiceIds.map(id => `${checked.planSnapshot.reference}:${encodeURIComponent(id)}`)],
        explanation: checked.planSnapshot.explanation, limitations: [...checked.limitations, ...(estimate?.reasons ?? [])] };
      return estimate?.range ? { candidateId: candidate.id, status: 'hypothetical' as const, range: clone(estimate.range),
        ...(estimate.central !== undefined ? { central: estimate.central } : {}), provenance }
        : { candidateId: candidate.id, status: 'unknown' as const, reason: estimate?.reasons.join(' ') || 'Projection indisponible pour cette dimension et ce contexte.', provenance };
    }) })) });
}
