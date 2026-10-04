import type { HopEngineData } from '../../../functions/src/hopPredictionCore';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import { loadBrewingCatalogueReferences } from '../../domain/brewingCatalogueReferences';
import { proposeBrewingNuancePlans, adoptBrewingNuancePlan, type BrewingNuancePlan } from '../../domain/brewingNuanceProjection';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryDefinitionReference, type BrewingSensoryMetric,
  type BrewingSensoryScale } from '../../domain/brewingSensory';
import { createBrewingObservationAnchor, type BrewingObservationAnchor } from '../../domain/brewingObservationAnchor';
import { prepareBrewingObservedContext, type PrepareBrewingObservedContextOptions,
  type PreparedBrewingObservedContextV1 } from '../../domain/brewingObservationContext';
import { buildBrewingObservationTarget, type BrewingObservationTargetRequest } from '../../domain/brewingObservationInputs';
import { type BrewingObservationArithmeticContract } from '../../domain/brewingObservationNumerics';
import { type BrewingReferenceObservationV1 } from '../../domain/brewingReference';
import { type BrewingObservationRestStability } from '../../domain/brewingObservationProjection';

export const HOP_V55_CANONICAL_OBSERVATION_FIXTURE_VERSION = 'hop-v55-canonical-observation-fixture-v1' as const;
export const HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS = {
  batchId: 'fixture-canonical-batch',
  sourceRecipeId: 'fixture-source-recipe',
  modelId: 'laffinee-experimental-v1',
  doseScaleReferenceAxisId: 'pomeFruit',
  dimensionId: 'fixture-pear',
  planId: 'fixture-anchored-pear',
  noteId: 'fixture-canonical-note',
  anchorId: 'fixture-canonical-anchor',
  currentPreparationId: 'fixture-canonical-current-preparation',
  protocolSupportId: 'fixture-canonical-protocol-note',
  scopeSupportId: 'fixture-canonical-hop-scope',
  arithmeticSupportId: 'fixture-canonical-arithmetic',
  supportSelectionId: 'fixture-canonical-support-selection',
  workspaceId: 'workspace:canonical-observation-pear',
} as const;

export interface HopV55CanonicalObservationFixtureV1 {
  version: typeof HOP_V55_CANONICAL_OBSERVATION_FIXTURE_VERSION;
  context: BrewerContext;
  /** Input for the real observation-anchor helper; its exact batch/options are retained. */
  source: { kind: 'context'; context: BrewerContext; options: PrepareBrewingObservedContextOptions };
  options: PrepareBrewingObservedContextOptions;
  prepared: PreparedBrewingObservedContextV1;
  data: HopEngineData;
  material: HopDecisionMaterial;
  note: BrewingReferenceObservationV1;
  /** An ordinal note definition; deliberately distinct from the model-index definition. */
  noteDefinition: BrewingSensoryDefinitionReference;
  /** Adopted real-model definitions/centrals for a fixture sensitivity frame. */
  plan: BrewingNuancePlan;
  arithmetic: BrewingObservationArithmeticContract;
  restStability: BrewingObservationRestStability;
  anchor: BrewingObservationAnchor;
  /** Target request has no current input; observation UI still supplies its freshly prepared state. */
  target: Omit<BrewingObservationTargetRequest, 'current'>;
}

const actor = { origin: 'model' as const, name: 'Fixture automatisée, aucune adoption humaine prétendue' };
const fixtureSource: HopSource = {
  title: 'Fixture d’état réalisé', author: 'Test automatisé', year: null,
  kind: 'judgment', reference: 'fixture://observed-scenario',
};
const canonicalContactProvenance = {
  kind: 'fixtureAttestation', reference: 'fixture://canonical-contact', description: 'Attestation synthétique explicite.',
};
const observedScenarioAt = (hours: number) => new Date(Date.parse('2026-10-02T00:00:00.000Z') + hours * 3600000).toISOString();
const clone = <T,>(value: T): T => structuredClone(value);

/**
 * Builds the positive BrewerContext observation witness used by the reference
 * projection test. It reads real catalogue references and adopts their exact
 * model definition, but does not run a projection, engine prediction, J5, or
 * any storage write. Every measured-looking value in this returned package is
 * explicitly synthetic fixture input.
 */
export async function loadHopV55CanonicalObservationFixture(): Promise<HopV55CanonicalObservationFixtureV1> {
  const refs = await loadBrewingCatalogueReferences();
  const data: HopEngineData = { ...refs, lots: [] };
  const sourceModel = refs.knowledge.find(row => row.kind === 'extrapolation'
    && row.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.modelId) as HopExtrapolation | undefined;
  const axis = refs.knowledge.find(row => row.kind === 'axis'
    && row.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.doseScaleReferenceAxisId) as HopAxis | undefined;
  if (!sourceModel || !axis) throw new Error('Les références réelles du modèle et de l’axe de fixture sont absentes.');
  const modelAxis = sourceModel.axes.find(row => row.id === axis.id && row.version === axis.version);
  const variety = refs.varieties.find(row => row.id === 'hopsteiner-eld');
  const description = variety?.descriptions.find(row => row.context === 'rawHop' && /\bpear\b/i.test(row.text));
  if (!modelAxis || !variety || !description) throw new Error('La variété, la description ou l’axe exact de la fixture canonique est absent.');

  const plans = proposeBrewingNuancePlans({ planId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.planId,
    dimensions: [{ id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.dimensionId, version: '1', name: 'Poire',
      definition: 'Nuance de fixture, distincte d’une famille et d’une intensité mesurée.', terms: ['pear', 'poire'], sourceRefs: [description.source] }],
    sourceModel, axes: refs.knowledge.filter((row): row is HopAxis => row.kind === 'axis'),
    proposedAt: observedScenarioAt(6), proposedBy: actor });
  const selected = plans.find(candidate => candidate.parameterChoices.some(choice => choice.target.kind === 'dimension'
    && choice.target.parameter === 'yeastAroma')
    && sourceModel.axes.some(row => row.id === candidate.doseAxis.id && row.version === candidate.doseAxis.version
      && JSON.stringify(row.doseScale.range) === JSON.stringify(modelAxis.doseScale.range)
      && row.doseScale.central === modelAxis.doseScale.central && JSON.stringify(candidate.doseAxis.scale) === JSON.stringify(axis.scale)));
  if (!selected) throw new Error('Convention de dose réelle non retrouvée pour la fixture canonique.');
  const plan = adoptBrewingNuancePlan(selected, { adoptedAt: observedScenarioAt(6), adoptedBy: actor,
    reason: 'Sensibilité conditionnelle de fixture, pas calibration.' });

  const material: HopDecisionMaterial = { id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety: clone(variety) };
  const snapshot = {
    capturedAt: observedScenarioAt(-1), sourceRecipeId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.sourceRecipeId,
    name: 'Recette figée de fixture', style: '', volumeL: 20, fermentables: [], totalGristKg: 0,
    hops: [{ name: 'Libellé libre sans résolution nominale', hopVarietyId: variety.id, weightG: 200,
      alpha: 5, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 15 }],
    yeast: { name: 'Culture déclarée de travail', hopIndexId: 'wyeast-1728' }, fermentation: [], steps: [], notes: [],
  };
  const context = {
    now: Date.parse(observedScenarioAt(7)), phase: 'Fixture canonique d’observation',
    batch: { id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId, status: 'fermentation', recipeSnapshot: snapshot },
    // Deliberate decoy: observation preparation must read the named immutable
    // batch snapshot (200 g), never this mutable recipe (999 g / 999 L).
    recipe: { ...snapshot, volumeL: 999, hops: [{ ...snapshot.hops[0], weightG: 999 }] },
    journal: { steps: [], currentIndex: 0, additions: { 'hop-0': { amount: 80, unit: 'g', doneAt: Date.parse(observedScenarioAt(0)) } } },
    inventory: [], material: [], waterSources: [], provenance: ['Fixture canonique synthétique; aucune donnée brasseur.'],
    hopIndex: { ...data, predictions: [], tastings: [], truncated: [] },
  } as unknown as BrewerContext;
  const options: PrepareBrewingObservedContextOptions = {
    source: { kind: 'batch', id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId },
    asOf: observedScenarioAt(6), knowledgeAsOf: observedScenarioAt(7), materials: [clone(material)],
    contactAttestations: [{ additionKey: 'hop-0', kind: 'activeThrough', epistemicStatus: 'reported',
      evidence: { effectiveAt: observedScenarioAt(6), recordedAt: observedScenarioAt(7), provenance: clone(canonicalContactProvenance) } }],
    coverageAttestations: ['hopMaterials', 'hopContact'].map(dependencyId => ({ id: `coverage-${dependencyId}`, version: 1,
      supersedesVersion: null, dependencyId, fromAt: observedScenarioAt(0), throughAt: observedScenarioAt(6), status: 'complete' as const,
      recordedAt: observedScenarioAt(7), provenance: clone(canonicalContactProvenance) })),
    hopScope: { id: 'canonical-hop-scope', dependencyIds: ['hopMaterials', 'hopContact'], fromAt: observedScenarioAt(0),
      explanation: 'Programme connu de fixture.' },
  };
  const prepared = prepareBrewingObservedContext(context, options);
  if (prepared.status !== 'prepared' || !prepared.state || !prepared.observedHopInput?.used[0]) {
    throw new Error(prepared.refusal?.message ?? 'La préparation physique canonique de fixture est indisponible.');
  }

  const targetDefinition = plan.definitions[0];
  if (!targetDefinition?.metric || !targetDefinition.scale) throw new Error('Le plan de fixture doit contenir une définition de modèle complète.');
  const metric: BrewingSensoryMetric = { ...targetDefinition.metric, id: 'fixture-ordinal-intensity', kind: 'ordinalNote',
    name: 'Note ordinale d’intensité de fixture', meaning: 'Note perçue de fixture sur une échelle ordinale déclarée, jamais un calcul ni une préférence.',
    unit: null, sourceRefs: [fixtureSource] };
  const scale: BrewingSensoryScale = { ...targetDefinition.scale, id: 'fixture-ordinal-scale', metricRef: { id: metric.id, version: metric.version },
    sourceRefs: [fixtureSource] };
  const noteDefinition = createBrewingSensoryDefinitionReference(targetDefinition.dimension, metric, scale);
  const note: BrewingReferenceObservationV1 = {
    id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.noteId, version: 1,
    subject: { kind: 'beer', id: prepared.state.subject.identity.id, label: 'Bière synthétique' },
    observedAt: prepared.state.asOf, author: { label: 'Fixture automatisée' },
    origin: { kind: 'fixture', description: 'Valeur synthétique, aucune dégustation réelle.' },
    originalText: 'Note de fixture sur une échelle déclarée 0–100.', dimension: { status: 'resolved', definition: clone(noteDefinition) },
    scale: { status: 'known', metric: clone(metric), scale: clone(scale) },
    sense: { kind: 'sensoryRating', value: 37 }, comparison: { kind: 'absolute' }, context: {},
  };
  const anchor = createBrewingObservationAnchor({ id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.anchorId, observation: note,
    observedState: prepared.state, subjectRelation: 'sameSubject', explanation: 'Identité de bière explicitement liée au snapshot de fixture.',
    createdAt: observedScenarioAt(7), createdBy: actor });
  const arithmetic: BrewingObservationArithmeticContract = {
    version: 'brewing-observation-arithmetic-v1', id: 'fixture-unit-bridge', definition: clone(targetDefinition),
    operation: 'ordinalWorkingHypothesis', basis: null,
    explanation: 'Correspondance numérique conditionnelle de fixture, non empirique.', sourceRefs: [fixtureSource],
    adoptedAt: prepared.state.asOf, adoptedBy: actor,
    unitBridge: { sourceDefinition: clone(noteDefinition), rule: 'unitCorrespondence', domain: { min: 0, max: 100 },
      sourceMeaning: { kind: 'intensity', direction: 'increasing' }, targetMeaning: { kind: 'intensity', direction: 'increasing' },
      explanation: 'g(x)=x est une hypothèse locale de cette fixture; la note ordinal et l’indice modèle restent des définitions distinctes.' },
  };
  const restStability: BrewingObservationRestStability = {
    status: 'adopted', explanation: 'Hypothèse de stabilité hors domaine du modèle, pas observation.',
    adoptedAt: prepared.state.asOf, adoptedBy: actor,
    conditions: [{ id: 'unchanged-rest', status: 'declaredCompatible',
      explanation: 'Reste de la bière invariant par hypothèse dans cette fixture.', sourceRefs: [fixtureSource] }],
  };
  const target: Omit<BrewingObservationTargetRequest, 'current'> = {
    future: [], contactTargets: [{ additionId: prepared.observedHopInput.used[0].additionId, contactHours: 24,
      explanation: 'Horizon cible hypothétique explicite.' }],
    horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Contact évalué à 24 h.' },
    explanation: 'Source physique conservée, horizon hypothétique distinct des faits.',
  };
  return {
    version: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_VERSION,
    context: clone(context),
    source: { kind: 'context', context: clone(context), options: clone(options) },
    options: clone(options), prepared: clone(prepared), data: clone(data), material: clone(material), note: clone(note),
    noteDefinition: clone(noteDefinition), plan: clone(plan), arithmetic: clone(arithmetic), restStability: clone(restStability),
    anchor: clone(anchor), target: clone(target),
  };
}

export const HOP_V55_CANONICAL_OBSERVATION_FIXTURE_SOURCE = fixtureSource;
