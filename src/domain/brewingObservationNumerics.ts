import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import { hopSourceError } from '../../functions/src/hopIndexSchema';
import {
  assertBrewingReferenceObservation, type BrewingReferenceObservationV1,
} from './brewingReference';
import {
  assertBrewingSensoryDefinitionSet, type BrewingSensoryDefinitionReference,
} from './brewingSensory';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export interface BrewingObservationArithmeticContract {
  version: 'brewing-observation-arithmetic-v1';
  id: string;
  definition: BrewingSensoryDefinitionReference;
  /** A working assumption about differences, never an empirical calibration. */
  operation: 'additiveDifference' | 'ordinalWorkingHypothesis';
  /** Required for an analytical observation; null means no analytical basis asserted. */
  basis: string | null;
  explanation: string;
  sourceRefs: HopSource[];
  adoptedAt: string;
  adoptedBy: { origin: 'user' | 'assistant' | 'model'; name: string };
  /** Explicit g(x)=x working interpretation. It never changes the source note. */
  unitBridge?: {
    sourceDefinition: BrewingSensoryDefinitionReference;
    rule: 'unitCorrespondence';
    domain: HopRange;
    sourceMeaning: { kind: 'intensity' | 'preference' | 'ranking' | 'other'; direction: 'increasing' | 'decreasing' | 'unknown' };
    targetMeaning: { kind: 'intensity' | 'preference' | 'ranking' | 'other'; direction: 'increasing' | 'decreasing' | 'unknown' };
    explanation: string;
  };
}

export type BrewingObservationNumericalReason =
  | 'scaleUnknown' | 'dimensionUnresolved' | 'definitionMismatch' | 'metricOrScaleMissing'
  | 'qualitativeObservation' | 'relativeWithoutReferent' | 'relativeValueNotResolved'
  | 'ordinalAdditionNotAdopted' | 'arithmeticKindMismatch' | 'analyticalUnitMismatch' | 'analyticalBasisMismatch'
  | 'bridgeMetricKindsMismatch' | 'bridgeDimensionMismatch' | 'bridgeDomainMismatch' | 'bridgeMeaningMismatch' | 'bridgeOrientationMismatch';

export type BrewingObservationNumericalQualification = {
  version: 'brewing-observation-numerical-qualification-v1';
  observationReference: string;
  contractReference: string;
  definitionReference: string;
} & (
  | { status: 'comparable'; observationValue: number | HopRange;
      valueStatus: 'originalObservation' | 'hypotheticalInterpretation'; sourceDefinitionReference: string;
      reasons: []; limitations: string[] }
  | { status: 'nonComparable'; observationValue: null;
      reasons: Array<{ code: BrewingObservationNumericalReason; message: string }>; limitations: string[] }
);

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const keys = (value: Record<string, any>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
const validInstant = (value: unknown) => text(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

export function assertBrewingObservationArithmeticContract(value: unknown): asserts value is BrewingObservationArithmeticContract {
  if (!object(value) || !keys(value, ['version', 'id', 'definition', 'operation', 'basis', 'explanation', 'sourceRefs', 'adoptedAt', 'adoptedBy', 'unitBridge'])
    || value.version !== 'brewing-observation-arithmetic-v1' || !text(value.id)
    || !['additiveDifference', 'ordinalWorkingHypothesis'].includes(value.operation)
    || !(value.basis === null || text(value.basis)) || !text(value.explanation)
    || !Array.isArray(value.sourceRefs) || value.sourceRefs.some((source: unknown) => hopSourceError(source))
    || !validInstant(value.adoptedAt) || !object(value.adoptedBy) || !keys(value.adoptedBy, ['origin', 'name'])
    || !['user', 'assistant', 'model'].includes(value.adoptedBy.origin) || !text(value.adoptedBy.name)) {
    throw Error('Contrat numérique d’ancrage incomplet ou non adopté explicitement.');
  }
  assertBrewingSensoryDefinitionSet([value.definition]);
  if (value.unitBridge !== undefined) {
    const bridge = value.unitBridge;
    const meaning = (row: unknown) => object(row) && keys(row, ['kind', 'direction'])
      && ['intensity', 'preference', 'ranking', 'other'].includes(row.kind)
      && ['increasing', 'decreasing', 'unknown'].includes(row.direction);
    if (!object(bridge) || !keys(bridge, ['sourceDefinition', 'rule', 'domain', 'sourceMeaning', 'targetMeaning', 'explanation'])
      || bridge.rule !== 'unitCorrespondence' || !object(bridge.domain) || !keys(bridge.domain, ['min', 'max'])
      || !Number.isFinite(bridge.domain.min) || !Number.isFinite(bridge.domain.max) || bridge.domain.min >= bridge.domain.max
      || !meaning(bridge.sourceMeaning) || !meaning(bridge.targetMeaning) || !text(bridge.explanation)) {
      throw Error('Correspondance numérique unitaire incomplète ; aucune conversion implicite ou générale.');
    }
    assertBrewingSensoryDefinitionSet([bridge.sourceDefinition, value.definition]);
  }
}

export function brewingObservationFactReference(observation: BrewingReferenceObservationV1): string {
  assertBrewingReferenceObservation(observation);
  return hopAdviceContentReference('brewing-observation-fact-v1', observation);
}

export function brewingObservationArithmeticReference(contract: BrewingObservationArithmeticContract): string {
  assertBrewingObservationArithmeticContract(contract);
  return hopAdviceContentReference('brewing-observation-arithmetic-v1', contract);
}

/** Checks numerical compatibility only. Physical/temporal applicability is separate.
 * No conversion, simulation, clamping or replacement of the original observation occurs. */
export function qualifyBrewingObservationNumerics(
  observation: BrewingReferenceObservationV1,
  contract: BrewingObservationArithmeticContract,
): BrewingObservationNumericalQualification {
  assertBrewingReferenceObservation(observation);
  assertBrewingObservationArithmeticContract(contract);
  const common = {
    version: 'brewing-observation-numerical-qualification-v1' as const,
    observationReference: brewingObservationFactReference(observation),
    contractReference: brewingObservationArithmeticReference(contract),
    definitionReference: contract.definition.contentReference,
  };
  const reasons: Array<{ code: BrewingObservationNumericalReason; message: string }> = [];
  const reject = (code: BrewingObservationNumericalReason, message: string) => reasons.push({ code, message });
  const bridge = contract.unitBridge;
  const sourceDefinition = bridge?.sourceDefinition ?? contract.definition;
  if (observation.scale.status === 'unknown') reject('scaleUnknown', 'La note est conservée, mais son échelle inconnue interdit cette addition numérique.');
  if (observation.dimension.status === 'unresolved') reject('dimensionUnresolved', 'La dimension d’origine reste non résolue.');
  else if (observation.dimension.definition.contentReference !== sourceDefinition.contentReference) {
    reject('definitionMismatch', 'La dimension, la métrique ou l’échelle ne sont pas la définition exacte du calcul ; aucun mapping numérique implicite.');
  }
  const metric = sourceDefinition.metric;
  if (!metric || !contract.definition.scale) reject('metricOrScaleMissing', 'Le contrat ne fournit pas une métrique et une échelle numériques définies.');
  if (bridge) {
    if (metric?.kind !== 'ordinalNote' || contract.definition.metric?.kind !== 'modelIndex') {
      reject('bridgeMetricKindsMismatch', 'Ce contrat porte seulement sur une note ordinale et un indice de modèle, conservés séparément.');
    }
    const dimensionRef = (definition: BrewingSensoryDefinitionReference) => hopAdviceContentReference('brewing-observation-dimension-v1', definition.dimension);
    if (dimensionRef(sourceDefinition) !== dimensionRef(contract.definition)) reject('bridgeDimensionMismatch', 'La correspondance ne porte pas sur la même dimension exacte.');
    const sourceDomain = sourceDefinition.scale?.domain, targetDomain = contract.definition.scale?.domain;
    if (!sourceDomain || !targetDomain || sourceDomain.min !== targetDomain.min || sourceDomain.max !== targetDomain.max
      || bridge.domain.min !== sourceDomain.min || bridge.domain.max !== sourceDomain.max) {
      reject('bridgeDomainMismatch', 'Les domaines numériques doivent être connus et exactement égaux ; aucune conversion 0–5 vers 0–100.');
    }
    if (bridge.sourceMeaning.kind !== 'intensity' || bridge.targetMeaning.kind !== 'intensity') {
      reject('bridgeMeaningMismatch', 'Une préférence ou un classement ne devient pas une intensité par correspondance numérique.');
    }
    if (bridge.sourceMeaning.direction !== 'increasing' || bridge.targetMeaning.direction !== 'increasing') {
      reject('bridgeOrientationMismatch', 'L’orientation croissante de l’intensité doit être explicitement compatible des deux côtés.');
    }
  }
  if (observation.sense.kind === 'qualitative') reject('qualitativeObservation', 'Une observation qualitative ne devient pas une quantité numérique.');
  if (observation.comparison.kind === 'relative') {
    reject(observation.comparison.referent === null ? 'relativeWithoutReferent' : 'relativeValueNotResolved',
      observation.comparison.referent === null ? 'La note relative ne possède pas de référent résolu.'
        : 'Le lien vers un référent ne fournit pas à lui seul une valeur absolue ; aucune conversion de la note relative.');
  }
  if (metric?.kind === 'ordinalNote' && contract.operation !== 'ordinalWorkingHypothesis') {
    reject('ordinalAdditionNotAdopted', 'L’addition de différences sur une note ordinale exige une hypothèse numérique de travail adoptée.');
  } else if (metric && metric.kind !== 'ordinalNote' && contract.operation === 'ordinalWorkingHypothesis') {
    reject('arithmeticKindMismatch', 'L’hypothèse d’ordinalité ne correspond pas à la métrique choisie.');
  }
  if (observation.sense.kind === 'analyticalMeasurement') {
    if (observation.sense.unit !== metric?.unit) reject('analyticalUnitMismatch', 'L’unité de mesure ne correspond pas exactement à la métrique ; aucune conversion implicite.');
    if (observation.sense.basis !== contract.basis) reject('analyticalBasisMismatch', 'La base analytique ne correspond pas au contrat retenu.');
  }
  const limitations = ['Compatibilité arithmétique seulement : ne prouve ni état dégusté, ni validité physique du modèle, ni stabilité du reste de la bière.',
    ...(contract.operation === 'ordinalWorkingHypothesis' ? ['Différences ordinales traitées comme additives par hypothèse de travail explicite, pas par calibration.'] : []),
    ...(bridge ? ['Correspondance g(x)=x adoptée dans ce domaine : interprétation hypothétique dans la métrique cible, jamais nouvelle observation ni identité sémantique des deux échelles.'] : [])];
  if (reasons.length || observation.sense.kind === 'qualitative') return { ...common, status: 'nonComparable', observationValue: null, reasons, limitations };
  return { ...common, status: 'comparable', observationValue: structuredClone(observation.sense.value),
    valueStatus: bridge ? 'hypotheticalInterpretation' : 'originalObservation', sourceDefinitionReference: sourceDefinition.contentReference,
    reasons: [], limitations };
}
