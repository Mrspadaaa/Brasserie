import { validHopRange, type HopRange } from '../../functions/src/hopIndexSchema';
import {
  assertBrewingSensoryDefinitionSet,
  brewingSensoryDefinitionReferenceError,
  brewingSensoryMetricError,
  brewingSensoryScaleError,
  type BrewingSensoryDefinitionReference,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
} from './brewingSensory';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

/** Append-only context/reference/observation envelope. It never runs J5. */
export const BREWING_REFERENCE_FORMAT_VERSION = 1 as const;
export const BREWING_REFERENCE_EVENT_FORMAT_VERSION = 1 as const;
export const BREWING_REFERENCE_ACTIVATION_EVENT_FORMAT_VERSION = 2 as const;

export interface BrewingReferenceIdentityV1 {
  id: string;
  version: string;
  contentReference: string;
}

export interface BrewingReferencePastAdditionV1 {
  id: string;
  label: string;
  reference?: string;
  details?: Record<string, JsonValue>;
}

export type BrewingReferencePastV1 =
  | { status: 'unknown' }
  | { status: 'partial'; knownAdditions: BrewingReferencePastAdditionV1[] }
  | { status: 'declaredComplete'; additions: BrewingReferencePastAdditionV1[] };

export interface BrewingReferenceContextV1 {
  /** Exact identity of an existing program, if supplied; this module never edits it. */
  programReference: { id: string; contentReference: string } | null;
  past: BrewingReferencePastV1;
  details: Record<string, JsonValue>;
}

export interface BrewingReferenceActorV1 {
  id?: string;
  label: string;
}

export interface BrewingReferenceOriginV1 {
  kind: string;
  description: string;
  sourceReference?: string;
}

export interface BrewingReferenceVersionV1 extends BrewingReferenceIdentityV1 {
  origin: BrewingReferenceOriginV1;
  hypotheses: string[];
  context: Record<string, JsonValue>;
  author: BrewingReferenceActorV1;
  createdAt: string;
  predecessor: BrewingReferenceIdentityV1 | null;
  /** Exact frozen definitions used by this reference; [] is a declared empty set. */
  sensoryDefinitions: BrewingSensoryDefinitionReference[];
  content: Record<string, JsonValue>;
}

export type BrewingReferenceObservationDimensionV1 =
  | { status: 'resolved'; definition: BrewingSensoryDefinitionReference }
  | { status: 'unresolved'; label: string };

export type BrewingReferenceObservationScaleV1 =
  | { status: 'known'; metric: BrewingSensoryMetric; scale: BrewingSensoryScale }
  | { status: 'unknown' };

export type BrewingReferenceObservationSenseV1 =
  | { kind: 'qualitative' }
  | { kind: 'sensoryRating'; value: number }
  | { kind: 'analyticalMeasurement'; value: number | HopRange; unit: string; basis: string; method: string };

export type BrewingReferenceObservationComparisonV1 =
  | { kind: 'absolute' }
  | { kind: 'relative'; relationship: string; referent: BrewingReferenceIdentityV1 | null };

export interface BrewingReferenceObservationV1 {
  id: string;
  version: number;
  subject: { kind: string; id?: string; label: string };
  observedAt: string;
  author: BrewingReferenceActorV1;
  origin: BrewingReferenceOriginV1;
  originalText: string;
  dimension: BrewingReferenceObservationDimensionV1;
  scale: BrewingReferenceObservationScaleV1;
  sense: BrewingReferenceObservationSenseV1;
  comparison: BrewingReferenceObservationComparisonV1;
  context: Record<string, JsonValue>;
}

/** A later semantic reading link; it never changes the fact or computes a numeric conversion/delta. */
export type BrewingReferenceInterpretationComparabilityV1 =
  | { kind: 'exact' }
  | { kind: 'nonComparable'; reason: string }
  | {
      kind: 'mapped';
      /** Adopted semantic mapping only; this envelope applies no formula to observation values. */
      mapping: {
        id: string;
        version: string;
        contentReference: string;
        source: BrewingReferenceObservationDimensionV1;
        target: BrewingSensoryDefinitionReference;
        description: string;
        adopted: true;
        adoptedBy: BrewingReferenceActorV1;
        adoptedAt: string;
      };
    };

export interface BrewingReferenceInterpretationV1 {
  id: string;
  observationId: string;
  observationVersion: number;
  reference: BrewingReferenceIdentityV1;
  targetDefinition: BrewingSensoryDefinitionReference;
  relation: string;
  reason: string;
  origin: BrewingReferenceOriginV1;
  author: BrewingReferenceActorV1;
  comparability: BrewingReferenceInterpretationComparabilityV1;
}

export type BrewingReferenceJ5ReceiptV1 =
  | { status: 'local'; receiptId: string; localRecordId: string; receivedAt: string }
  | { status: 'serverConfirmed'; receiptId: string; serverReference: string; confirmedAt: string };

export interface BrewingReferenceJ5ResultLinkV1 {
  id: string;
  reference: BrewingReferenceIdentityV1;
  result: {
    scenarioId: string;
    resultId: string;
    resultRevision: number;
    resultReference: string;
    snapshotReference: string;
  };
  receipt: BrewingReferenceJ5ReceiptV1;
}

export type BrewingReferenceEventKindV1 =
  | 'contextOpened'
  | 'observationRecorded'
  | 'observationCorrected'
  | 'referenceProposed'
  | 'referenceAdopted'
  | 'interpretationLinked'
  | 'interpretationsLinked'
  | 'j5ResultLinked';

export type BrewingReferenceEventKindV2 = 'referenceActivated';
export type BrewingReferenceEventKind = BrewingReferenceEventKindV1 | BrewingReferenceEventKindV2;

export interface BrewingReferenceEventPayloadV1 {
  contextOpened: { context: BrewingReferenceContextV1 };
  observationRecorded: { observation: BrewingReferenceObservationV1 };
  observationCorrected: { observation: BrewingReferenceObservationV1; correctsVersion: number; reason: string };
  referenceProposed: { reference: BrewingReferenceVersionV1 };
  referenceAdopted: { reference: BrewingReferenceIdentityV1; adoptedBy: BrewingReferenceActorV1 };
  interpretationLinked: { interpretation: BrewingReferenceInterpretationV1 };
  /** All links validate before any are appended; incompatible facts can carry nonComparable reasons. */
  interpretationsLinked: { interpretations: BrewingReferenceInterpretationV1[] };
  j5ResultLinked: { link: BrewingReferenceJ5ResultLinkV1 };
}

export interface BrewingReferenceEventPayloadV2 {
  referenceActivated: { reference: BrewingReferenceIdentityV1; activatedBy: BrewingReferenceActorV1; reason: string };
}

export type BrewingReferenceEventPayload = BrewingReferenceEventPayloadV1 & BrewingReferenceEventPayloadV2;

type EventFor<K extends BrewingReferenceEventKind> = K extends BrewingReferenceEventKind ? {
  readonly eventFormatVersion: K extends BrewingReferenceEventKindV2 ? 2 : 1;
  readonly ownerKey: string;
  readonly contextId: string;
  readonly commandId: string;
  readonly expectedRevision: number;
  readonly resultingRevision: number;
  readonly recordedAt: string;
  readonly kind: K;
  readonly payload: BrewingReferenceEventPayload[K];
  /** Hash of the immutable event, including CAS revision and recorded time. */
  readonly contentReference: string;
  /** Stable retry fingerprint; excludes CAS revision and transport timestamp. */
  readonly commandReference: string;
} : never;

export type BrewingReferenceEventV1 = {
  [K in BrewingReferenceEventKindV1]: EventFor<K>
}[BrewingReferenceEventKindV1];

export type BrewingReferenceEventV2 = EventFor<BrewingReferenceEventKindV2>;
export type BrewingReferenceEvent = BrewingReferenceEventV1 | BrewingReferenceEventV2;

export type BrewingReferenceCommandInput<K extends BrewingReferenceEventKind = BrewingReferenceEventKind> = {
  [P in K]: {
    ownerKey: string;
    contextId: string;
    commandId: string;
    expectedRevision: number;
    recordedAt: string;
    kind: P;
    payload: BrewingReferenceEventPayload[P];
  }
}[K];

export interface BrewingReferenceRecordV1 {
  readonly formatVersion: 1;
  readonly ownerKey: string;
  readonly contextId: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastCommandId: string;
  readonly state: BrewingReferenceEventKind;
  readonly currentReference: BrewingReferenceIdentityV1 | null;
  readonly reference: string;
}

export interface BrewingReferenceProjectionV1 {
  context: BrewingReferenceContextV1;
  observations: BrewingReferenceObservationV1[];
  references: BrewingReferenceVersionV1[];
  adoptions: Array<{ reference: BrewingReferenceIdentityV1; adoptedBy: BrewingReferenceActorV1; adoptedAt: string }>;
  interpretations: BrewingReferenceInterpretationV1[];
  j5ResultLinks: BrewingReferenceJ5ResultLinkV1[];
  currentReference: BrewingReferenceIdentityV1 | null;
}

export interface BrewingReferenceRecordReadV1 {
  record: BrewingReferenceRecordV1;
  events: BrewingReferenceEvent[];
  projection: BrewingReferenceProjectionV1;
}

export interface BrewingReferenceUnsupportedRead {
  status: 'unsupportedFormat';
  reason: 'recordFormat' | 'eventFormat';
  formatVersion?: number;
  raw: unknown;
}

export type BrewingReferenceReadResult = BrewingReferenceRecordReadV1 | BrewingReferenceUnsupportedRead;

export class BrewingReferenceError extends Error {
  constructor(readonly code: 'invalidInput' | 'staleRevision' | 'commandIdConflict' | 'invalidTransition' | 'unsupportedFormat', message: string) {
    super(message);
    this.name = 'BrewingReferenceError';
  }
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clone = <T>(value: T): T => structuredClone(value);
function invalid(message: string): never { throw new BrewingReferenceError('invalidInput', message); }
function transition(message: string): never { throw new BrewingReferenceError('invalidTransition', message); }

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid(`${label} contient un champ non pris en charge.`);
}

function isoDate(value: unknown): value is string {
  return text(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function jsonValue(value: unknown, seen = new Set<object>()): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  const valid = Array.isArray(value)
    ? value.every(item => jsonValue(item, seen))
    : Object.getPrototypeOf(value) === Object.prototype && Object.values(value).every(item => jsonValue(item, seen));
  seen.delete(value);
  return valid;
}

function jsonObject(value: unknown, label: string): asserts value is Record<string, JsonValue> {
  if (!object(value) || !jsonValue(value)) invalid(`${label} doit être un objet JSON fini.`);
}

function identityError(value: unknown): string | null {
  if (!object(value) || !text(value.id) || !text(value.version) || !text(value.contentReference)) return 'Identité de référence incomplète.';
  if (Object.keys(value).some(key => !['id', 'version', 'contentReference'].includes(key))) return 'Identité de référence contient des données hors contrat.';
  return null;
}

function assertIdentity(value: unknown): asserts value is BrewingReferenceIdentityV1 {
  const error = identityError(value);
  if (error) invalid(error);
}

function actorError(value: unknown): string | null {
  return object(value) && Object.keys(value).every(key => key === 'id' || key === 'label')
    && text(value.label) && (value.id === undefined || text(value.id)) ? null : 'Auteur invalide.';
}

function assertActor(value: unknown): asserts value is BrewingReferenceActorV1 {
  const error = actorError(value);
  if (error) invalid(error);
}

function originError(value: unknown): string | null {
  return object(value) && Object.keys(value).every(key => ['kind', 'description', 'sourceReference'].includes(key)) && text(value.kind) && text(value.description)
    && (value.sourceReference === undefined || text(value.sourceReference)) ? null : 'Origine explicite invalide.';
}

function assertOrigin(value: unknown): asserts value is BrewingReferenceOriginV1 {
  const error = originError(value);
  if (error) invalid(error);
}

function validatePast(value: unknown): asserts value is BrewingReferencePastV1 {
  if (!object(value)) invalid('État du passé de brassage absent.');
  if (value.status === 'unknown') {
    onlyKeys(value, ['status'], 'Passé inconnu');
    return;
  }
  if (value.status !== 'partial' && value.status !== 'declaredComplete') invalid('État du passé de brassage inconnu.');
  const list = value.status === 'partial' ? value.knownAdditions : value.additions;
  onlyKeys(value, value.status === 'partial' ? ['status', 'knownAdditions'] : ['status', 'additions'], 'Passé de brassage');
  if (!Array.isArray(list)) invalid('La liste du passé déclaré doit être explicite.');
  for (const row of list) {
    if (!object(row) || !text(row.id) || !text(row.label) || row.reference !== undefined && !text(row.reference)) invalid('Entrée du passé de brassage invalide.');
    onlyKeys(row, ['id', 'label', 'reference', 'details'], 'Entrée du passé de brassage');
    if (row.details !== undefined) jsonObject(row.details, 'Détails du passé');
  }
}

function validateContext(value: unknown): asserts value is BrewingReferenceContextV1 {
  if (!object(value)) invalid('Contexte de référence absent.');
  onlyKeys(value, ['programReference', 'past', 'details'], 'Contexte de référence');
  if (value.programReference !== null) {
    if (!object(value.programReference) || !text(value.programReference.id) || !text(value.programReference.contentReference)) invalid('Référence du programme invalide.');
    onlyKeys(value.programReference, ['id', 'contentReference'], 'Référence du programme');
  }
  validatePast(value.past);
  jsonObject(value.details, 'Contexte');
}

function exactDefinitionError(value: unknown): string | null {
  return brewingSensoryDefinitionReferenceError(value);
}

function validateDefinition(value: unknown): asserts value is BrewingSensoryDefinitionReference {
  const error = exactDefinitionError(value);
  if (error) invalid(error);
}

function referenceHashContent(reference: Omit<BrewingReferenceVersionV1, 'contentReference'> | BrewingReferenceVersionV1): string {
  const { contentReference: _contentReference, ...content } = reference as BrewingReferenceVersionV1;
  return hopAdviceContentReference('brewing-reference-version-v1', content);
}

export function brewingReferenceVersionContentReference(reference: Omit<BrewingReferenceVersionV1, 'contentReference'> | BrewingReferenceVersionV1): string {
  return referenceHashContent(reference);
}

function validateReferenceVersion(value: unknown): asserts value is BrewingReferenceVersionV1 {
  if (!object(value)) invalid('Version de référence absente.');
  onlyKeys(value, ['id', 'version', 'contentReference', 'origin', 'hypotheses', 'context', 'author', 'createdAt', 'predecessor', 'sensoryDefinitions', 'content'], 'Version de référence');
  if (!text(value.id) || !text(value.version) || !text(value.contentReference) || !isoDate(value.createdAt)) invalid('Identité ou date de référence invalide.');
  assertOrigin(value.origin); assertActor(value.author);
  if (!Array.isArray(value.hypotheses) || value.hypotheses.some((row: unknown) => typeof row !== 'string')) invalid('Hypothèses de référence invalides.');
  jsonObject(value.context, 'Contexte de référence'); jsonObject(value.content, 'Contenu de référence');
  if (value.predecessor !== null) assertIdentity(value.predecessor);
  if (!Array.isArray(value.sensoryDefinitions)) invalid('Définitions sensorielles absentes.');
  for (const definition of value.sensoryDefinitions) validateDefinition(definition);
  if (new Set(value.sensoryDefinitions.map((definition: BrewingSensoryDefinitionReference) => definition.contentReference)).size !== value.sensoryDefinitions.length) invalid('Définition sensorielle répétée dans la référence.');
  if (referenceHashContent(value as BrewingReferenceVersionV1) !== value.contentReference) invalid('Empreinte de version de référence incorrecte.');
}

function validateScale(value: unknown): asserts value is BrewingReferenceObservationScaleV1 {
  if (!object(value)) invalid('Échelle de l’observation absente.');
  if (value.status === 'unknown') {
    onlyKeys(value, ['status'], 'Échelle inconnue');
    return;
  }
  if (value.status !== 'known') invalid('Statut d’échelle inconnu.');
  onlyKeys(value, ['status', 'metric', 'scale'], 'Échelle connue');
  const metricError = brewingSensoryMetricError(value.metric);
  const scaleError = brewingSensoryScaleError(value.scale);
  if (metricError || scaleError || value.scale.metricRef.id !== value.metric.id || value.scale.metricRef.version !== value.metric.version) invalid(metricError ?? scaleError ?? 'La métrique et l’échelle ne correspondent pas.');
}

function validateObservation(value: unknown): asserts value is BrewingReferenceObservationV1 {
  if (!object(value)) invalid('Observation absente.');
  onlyKeys(value, ['id', 'version', 'subject', 'observedAt', 'author', 'origin', 'originalText', 'dimension', 'scale', 'sense', 'comparison', 'context'], 'Observation');
  if (!text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1 || !isoDate(value.observedAt) || !text(value.originalText)) invalid('Identité, date ou texte original de l’observation invalide.');
  if (!object(value.subject) || !text(value.subject.kind) || !text(value.subject.label) || value.subject.id !== undefined && !text(value.subject.id)) invalid('Sujet observé invalide.');
  onlyKeys(value.subject, ['kind', 'id', 'label'], 'Sujet observé');
  assertActor(value.author); assertOrigin(value.origin);
  if (!object(value.dimension)) invalid('Dimension de l’observation absente.');
  if (value.dimension.status === 'resolved') {
    onlyKeys(value.dimension, ['status', 'definition'], 'Dimension résolue');
    validateDefinition(value.dimension.definition);
  } else if (value.dimension.status === 'unresolved') {
    onlyKeys(value.dimension, ['status', 'label'], 'Dimension non résolue');
    if (!text(value.dimension.label)) invalid('Libellé de dimension non résolue absent.');
  } else invalid('Statut de dimension inconnu.');
  validateScale(value.scale);
  if (value.dimension.status === 'resolved' && value.scale.status === 'known') {
    const definition = value.dimension.definition;
    if (!definition.metric || !definition.scale || !sameJson(definition.metric, value.scale.metric)
      || !sameJson(definition.scale, value.scale.scale)) invalid('L’échelle connue ne correspond pas à la définition sensorielle figée.');
  } else if (value.dimension.status === 'resolved' && value.scale.status === 'unknown'
    && (value.dimension.definition.metric !== null || value.dimension.definition.scale !== null)) {
    invalid('L’échelle marquée inconnue contredit la définition sensorielle figée.');
  }
  if (!object(value.sense)) invalid('Sens de l’observation absent.');
  if (value.sense.kind === 'qualitative') {
    onlyKeys(value.sense, ['kind'], 'Observation qualitative');
  } else if (value.sense.kind === 'sensoryRating') {
    onlyKeys(value.sense, ['kind', 'value'], 'Note sensorielle');
    if (!finite(value.sense.value)) invalid('Note sensorielle non finie.');
    if (value.scale.status === 'known' && value.scale.metric.kind !== 'ordinalNote') invalid('Une note sensorielle déclarée exige une métrique ordinale.');
    if (value.scale.status === 'known' && value.scale.scale.domain
      && (value.sense.value < value.scale.scale.domain.min || value.sense.value > value.scale.scale.domain.max)) invalid('Note hors des bornes de son échelle déclarée.');
  } else if (value.sense.kind === 'analyticalMeasurement') {
    onlyKeys(value.sense, ['kind', 'value', 'unit', 'basis', 'method'], 'Mesure analytique');
    if (!(finite(value.sense.value) || validHopRange(value.sense.value) && Object.keys(value.sense.value).every(key => key === 'min' || key === 'max'))
      || !text(value.sense.unit) || !text(value.sense.basis) || !text(value.sense.method)) invalid('Mesure analytique incomplète.');
    if (value.scale.status === 'known' && (value.scale.metric.kind !== 'measurement' || value.sense.unit !== value.scale.metric.unit)) invalid('Une mesure analytique exige une métrique de mesure et son unité exacte.');
    if (value.scale.status === 'known' && value.scale.scale.domain) {
      const observedRange = finite(value.sense.value) ? { min: value.sense.value, max: value.sense.value } : value.sense.value;
      if (observedRange.min < value.scale.scale.domain.min || observedRange.max > value.scale.scale.domain.max) invalid('Mesure analytique hors du domaine de l’échelle déclarée; aucune valeur n’est ajustée.');
    }
  } else invalid('Sens d’observation inconnu.');
  if (!object(value.comparison)) invalid('Sens de comparaison absent.');
  if (value.comparison.kind === 'absolute') onlyKeys(value.comparison, ['kind'], 'Comparaison absolue');
  else if (value.comparison.kind === 'relative') {
    onlyKeys(value.comparison, ['kind', 'relationship', 'referent'], 'Comparaison relative');
    if (!text(value.comparison.relationship)) invalid('Relation qualitative relative absente.');
    if (value.comparison.referent !== null) assertIdentity(value.comparison.referent);
  } else invalid('Sens de comparaison inconnu.');
  jsonObject(value.context, 'Contexte d’observation');
}

/** Shared validation for derived artefacts; reading an observation does not run J5. */
export function assertBrewingReferenceObservation(value: unknown): asserts value is BrewingReferenceObservationV1 {
  validateObservation(value);
}

type BrewingReferenceMapping = Extract<BrewingReferenceInterpretationComparabilityV1, { kind: 'mapped' }>['mapping'];

export function brewingReferenceMappingContentReference(mapping: Omit<BrewingReferenceMapping, 'contentReference'> | BrewingReferenceMapping): string {
  const content = { ...mapping } as Record<string, unknown>;
  delete content.contentReference;
  return hopAdviceContentReference('brewing-reference-mapping-v1', content);
}

function validateInterpretation(value: unknown): asserts value is BrewingReferenceInterpretationV1 {
  if (!object(value)) invalid('Lien d’interprétation absent.');
  onlyKeys(value, ['id', 'observationId', 'observationVersion', 'reference', 'targetDefinition', 'relation', 'reason', 'origin', 'author', 'comparability'], 'Lien d’interprétation');
  if (!text(value.id) || !text(value.observationId) || !Number.isSafeInteger(value.observationVersion) || value.observationVersion < 1
    || !text(value.relation) || !text(value.reason)) invalid('Lien d’interprétation incomplet.');
  assertIdentity(value.reference); validateDefinition(value.targetDefinition); assertOrigin(value.origin); assertActor(value.author);
  if (!object(value.comparability)) invalid('Comparabilité du lien absente.');
  if (value.comparability.kind === 'exact') onlyKeys(value.comparability, ['kind'], 'Comparabilité exacte');
  else if (value.comparability.kind === 'nonComparable') {
    onlyKeys(value.comparability, ['kind', 'reason'], 'Lien non comparable');
    if (!text(value.comparability.reason)) invalid('Motif de non-comparabilité absent.');
  } else if (value.comparability.kind === 'mapped') {
    onlyKeys(value.comparability, ['kind', 'mapping'], 'Lien mappé');
    const mapping = value.comparability.mapping;
    if (!object(mapping)) invalid('Mapping explicite absent.');
    onlyKeys(mapping, ['id', 'version', 'contentReference', 'source', 'target', 'description', 'adopted', 'adoptedBy', 'adoptedAt'], 'Mapping explicite');
    if (!text(mapping.id) || !text(mapping.version) || !text(mapping.contentReference) || !text(mapping.description)
      || mapping.adopted !== true || !isoDate(mapping.adoptedAt)) invalid('Mapping versionné non adopté.');
    if (!object(mapping.source)) invalid('Source du mapping absente.');
    if (mapping.source.status === 'resolved') {
      onlyKeys(mapping.source, ['status', 'definition'], 'Source résolue du mapping');
      validateDefinition(mapping.source.definition);
    } else if (mapping.source.status === 'unresolved') {
      onlyKeys(mapping.source, ['status', 'label'], 'Source non résolue du mapping');
      if (!text(mapping.source.label)) invalid('Libellé de source du mapping absent.');
    } else invalid('Source du mapping invalide.');
    validateDefinition(mapping.target); assertActor(mapping.adoptedBy);
    if (brewingReferenceMappingContentReference(mapping as unknown as BrewingReferenceMapping) !== mapping.contentReference) invalid('Empreinte du mapping incorrecte.');
    if (mapping.target.contentReference !== value.targetDefinition.contentReference) invalid('Le mapping vise une autre définition que le lien.');
  } else invalid('Type de comparabilité inconnu.');
}

function validateResultLink(value: unknown): asserts value is BrewingReferenceJ5ResultLinkV1 {
  if (!object(value)) invalid('Lien vers un résultat J5 absent.');
  onlyKeys(value, ['id', 'reference', 'result', 'receipt'], 'Lien de résultat J5');
  if (!text(value.id)) invalid('Identité du lien J5 absente.');
  assertIdentity(value.reference);
  if (!object(value.result)) invalid('Identité exacte du résultat J5 absente.');
  onlyKeys(value.result, ['scenarioId', 'resultId', 'resultRevision', 'resultReference', 'snapshotReference'], 'Identité du résultat J5');
  if (!text(value.result.scenarioId) || !text(value.result.resultId) || !Number.isSafeInteger(value.result.resultRevision) || value.result.resultRevision < 0
    || !text(value.result.resultReference) || !text(value.result.snapshotReference)) invalid('Identité du résultat J5 incomplète.');
  if (!object(value.receipt)) invalid('Reçu de résultat J5 absent.');
  if (value.receipt.status === 'local') {
    onlyKeys(value.receipt, ['status', 'receiptId', 'localRecordId', 'receivedAt'], 'Reçu local J5');
    if (!text(value.receipt.receiptId) || !text(value.receipt.localRecordId) || !isoDate(value.receipt.receivedAt)) invalid('Reçu local J5 incomplet.');
  } else if (value.receipt.status === 'serverConfirmed') {
    onlyKeys(value.receipt, ['status', 'receiptId', 'serverReference', 'confirmedAt'], 'Reçu serveur J5');
    if (!text(value.receipt.receiptId) || !text(value.receipt.serverReference) || !isoDate(value.receipt.confirmedAt)) invalid('Confirmation serveur J5 incomplète.');
  } else invalid('Statut de reçu J5 inconnu.');
}

function validatePayload<K extends BrewingReferenceEventKind>(kind: K, value: unknown): asserts value is BrewingReferenceEventPayload[K] {
  if (!object(value)) invalid('Charge utile de commande absente.');
  switch (kind) {
    case 'contextOpened':
      onlyKeys(value, ['context'], 'Ouverture du contexte'); validateContext(value.context); return;
    case 'observationRecorded':
      onlyKeys(value, ['observation'], 'Saisie d’observation'); validateObservation(value.observation); return;
    case 'observationCorrected':
      onlyKeys(value, ['observation', 'correctsVersion', 'reason'], 'Correction d’observation');
      validateObservation(value.observation);
      if (!Number.isSafeInteger(value.correctsVersion) || value.correctsVersion < 1 || !text(value.reason)) invalid('Correction d’observation incomplète.');
      return;
    case 'referenceProposed':
      onlyKeys(value, ['reference'], 'Proposition de référence'); validateReferenceVersion(value.reference); return;
    case 'referenceAdopted':
      onlyKeys(value, ['reference', 'adoptedBy'], 'Adoption de référence'); assertIdentity(value.reference); assertActor(value.adoptedBy); return;
    case 'referenceActivated':
      onlyKeys(value, ['reference', 'activatedBy', 'reason'], 'Réactivation de référence');
      assertIdentity(value.reference); assertActor(value.activatedBy);
      if (!text(value.reason)) invalid('La raison de réactivation est requise.');
      return;
    case 'interpretationLinked':
      onlyKeys(value, ['interpretation'], 'Ajout de lien d’interprétation'); validateInterpretation(value.interpretation); return;
    case 'interpretationsLinked':
      onlyKeys(value, ['interpretations'], 'Lot de liens d’interprétation');
      if (!Array.isArray(value.interpretations) || value.interpretations.length === 0) invalid('Le lot de réancrage est vide.');
      for (const interpretation of value.interpretations) validateInterpretation(interpretation);
      if (new Set(value.interpretations.map((interpretation: BrewingReferenceInterpretationV1) => interpretation.id)).size !== value.interpretations.length) invalid('Identité répétée dans le lot de réancrage.');
      return;
    case 'j5ResultLinked':
      onlyKeys(value, ['link'], 'Lien de résultat J5'); validateResultLink(value.link); return;
    default:
      invalid('Type de commande de référence inconnu.');
  }
}

function commandReference(command: Pick<BrewingReferenceCommandInput, 'ownerKey' | 'contextId' | 'kind' | 'payload'>): string {
  const format = command.kind === 'referenceActivated' ? 'v2' : 'v1';
  return hopAdviceContentReference(`brewing-reference-command-${format}`, { ownerKey: command.ownerKey, contextId: command.contextId, kind: command.kind, payload: command.payload });
}

export function brewingReferenceEventContentReference(event: Omit<BrewingReferenceEvent, 'contentReference'> | BrewingReferenceEvent): string {
  const { contentReference: _contentReference, ...content } = event as BrewingReferenceEvent;
  const format = (event as BrewingReferenceEvent).eventFormatVersion === 2 ? 'v2' : 'v1';
  return hopAdviceContentReference(`brewing-reference-event-${format}`, content);
}

export function brewingReferenceRecordContentReference(record: Omit<BrewingReferenceRecordV1, 'reference'> | BrewingReferenceRecordV1): string {
  const { reference: _reference, ...content } = record as BrewingReferenceRecordV1;
  return hopAdviceContentReference('brewing-reference-record-v1', content);
}

export function createBrewingReferenceCommand<K extends BrewingReferenceEventKind>(command: BrewingReferenceCommandInput<K>): EventFor<K> {
  if (!object(command) || !text(command.ownerKey) || command.ownerKey.trim() !== command.ownerKey || !text(command.contextId)
    || command.contextId.trim() !== command.contextId
    || !text(command.commandId) || !isoDate(command.recordedAt) || !Number.isSafeInteger(command.expectedRevision)
    || command.expectedRevision < 0 || command.expectedRevision >= Number.MAX_SAFE_INTEGER) invalid('Commande de référence incomplète.');
  onlyKeys(command, ['ownerKey', 'contextId', 'commandId', 'expectedRevision', 'recordedAt', 'kind', 'payload'], 'Commande de référence');
  validatePayload(command.kind, command.payload);
  if (command.kind === 'referenceProposed') {
    const proposal = command.payload as BrewingReferenceEventPayloadV1['referenceProposed'];
    try { assertBrewingSensoryDefinitionSet(proposal.reference.sensoryDefinitions); }
    catch (error) { invalid(error instanceof Error ? error.message : 'Ensemble de définitions sensorielles incohérent.'); }
  }
  const base = { ...clone(command), eventFormatVersion: command.kind === 'referenceActivated'
    ? BREWING_REFERENCE_ACTIVATION_EVENT_FORMAT_VERSION : BREWING_REFERENCE_EVENT_FORMAT_VERSION,
    resultingRevision: command.expectedRevision + 1,
    commandReference: commandReference(command) };
  const event = base as EventFor<K>;
  return { ...event, contentReference: brewingReferenceEventContentReference(event as BrewingReferenceEvent) };
}

export interface OpenBrewingReferenceContextInput {
  ownerKey: string;
  contextId: string;
  commandId: string;
  recordedAt: string;
  context: BrewingReferenceContextV1;
}

export interface OpenedBrewingReferenceContext {
  record: BrewingReferenceRecordV1;
  event: Extract<BrewingReferenceEvent, { kind: 'contextOpened' }>;
}

interface MutableProjection extends BrewingReferenceProjectionV1 {
  adoptedKeys: Set<string>;
}

const referenceKey = (reference: BrewingReferenceIdentityV1): string => `${reference.id}\u0000${reference.version}\u0000${reference.contentReference}`;

function sameJson(a: unknown, b: unknown): boolean {
  return hopAdviceContentReference('brewing-reference-equality-v1', a) === hopAdviceContentReference('brewing-reference-equality-v1', b);
}

function identityOf(reference: BrewingReferenceVersionV1): BrewingReferenceIdentityV1 {
  return { id: reference.id, version: reference.version, contentReference: reference.contentReference };
}

function findReference(projection: BrewingReferenceProjectionV1, identity: BrewingReferenceIdentityV1): BrewingReferenceVersionV1 | undefined {
  return projection.references.find(reference => referenceKey(reference) === referenceKey(identity));
}

export type BrewingReferenceVersionSuggestionV1 =
  | { status: 'suggested'; id: string; version: string }
  | { status: 'explicitVersionRequired'; id: string; reason: string; opaqueVersions: string[] };

/** Suggests the next decimal version from every archived version of this reference id. */
export function suggestNextBrewingReferenceVersion(
  references: readonly Pick<BrewingReferenceIdentityV1, 'id' | 'version'>[],
  id: string,
): BrewingReferenceVersionSuggestionV1 {
  if (!Array.isArray(references) || !text(id)) invalid('Identité requise pour suggérer une version de référence.');
  const sameId = references.filter(reference => reference.id === id);
  const numericVersions: number[] = [];
  const opaqueVersions: string[] = [];
  for (const reference of sameId) {
    if (!text(reference.version)) invalid('Version historique de référence mal formée.');
    if (!/^[1-9]\d*$/.test(reference.version)) {
      opaqueVersions.push(reference.version);
      continue;
    }
    const numericVersion = Number(reference.version);
    if (!Number.isSafeInteger(numericVersion)) {
      opaqueVersions.push(reference.version);
      continue;
    }
    numericVersions.push(numericVersion);
  }
  if (opaqueVersions.length) return {
    status: 'explicitVersionRequired', id,
    reason: 'Une ou plusieurs versions archivées ne sont pas des entiers décimaux canoniques.',
    opaqueVersions,
  };
  const highest = numericVersions.reduce((max, version) => Math.max(max, version), 0);
  if (highest >= Number.MAX_SAFE_INTEGER) return {
    status: 'explicitVersionRequired', id,
    reason: 'La version numérique suivante dépasse la plage entière prise en charge.',
    opaqueVersions: [],
  };
  return { status: 'suggested', id, version: String(highest + 1) };
}

function currentRecord(projection: BrewingReferenceProjectionV1): BrewingReferenceIdentityV1 | null { return projection.currentReference; }

function appendInterpretations(projection: MutableProjection, links: BrewingReferenceInterpretationV1[], recordedAt: string): void {
  const newIds = new Set<string>();
  for (const link of links) {
    if (newIds.has(link.id) || projection.interpretations.some(row => row.id === link.id)) transition('Identité de lien d’interprétation déjà utilisée.');
    newIds.add(link.id);
    const observation = projection.observations.find(row => row.id === link.observationId && row.version === link.observationVersion);
    if (!observation) transition('Le lien doit viser une version d’observation conservée.');
    const reference = findReference(projection, link.reference);
    if (!reference || !projection.adoptedKeys.has(referenceKey(link.reference))) transition('Le lien doit viser une référence adoptée exacte.');
    if (!reference.sensoryDefinitions.some(definition => definition.contentReference === link.targetDefinition.contentReference)) transition('La dimension cible ne figure pas dans la référence exacte.');
    validateComparability(observation, link, recordedAt);
  }
  projection.interpretations.push(...clone(links));
}

function projectionFromEvents(events: readonly BrewingReferenceEvent[]): { record: BrewingReferenceRecordV1; projection: BrewingReferenceProjectionV1 } {
  if (!events.length) invalid('Journal de référence vide.');
  let projection: MutableProjection | null = null;
  let record: BrewingReferenceRecordV1 | null = null;
  const commandIds = new Set<string>();
  const eventKeys = new Set<string>();
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    validateEvent(event);
    if (commandIds.has(event.commandId) || eventKeys.has(event.contentReference)) transition('Identité de commande ou événement déjà utilisée dans le journal.');
    commandIds.add(event.commandId); eventKeys.add(event.contentReference);
    if (index === 0) {
      if (event.kind !== 'contextOpened' || event.expectedRevision !== 0) transition('Le journal doit commencer par l’ouverture du contexte à la révision zéro.');
      projection = { context: clone(event.payload.context), observations: [], references: [], adoptions: [], interpretations: [], j5ResultLinks: [], currentReference: null, adoptedKeys: new Set() };
      record = makeRecord(event, projection, event.recordedAt);
      continue;
    }
    if (!record || !projection || event.kind === 'contextOpened') transition('Ouverture du contexte répétée ou historique mal formé.');
    if (event.ownerKey !== record.ownerKey || event.contextId !== record.contextId) transition('Événement lié à un autre contexte.');
    if (event.expectedRevision !== record.revision) throw new BrewingReferenceError('staleRevision', 'La révision du contexte de référence est périmée.');
    applyPayload(projection, event);
    record = makeRecord(event, projection, record.createdAt);
  }
  if (!record || !projection) invalid('Projection de référence absente.');
  return { record, projection: stripInternal(projection) };
}

function makeRecord(event: BrewingReferenceEvent, projection: BrewingReferenceProjectionV1, createdAt: string): BrewingReferenceRecordV1 {
  const withoutReference: Omit<BrewingReferenceRecordV1, 'reference'> = {
    formatVersion: 1, ownerKey: event.ownerKey, contextId: event.contextId, revision: event.resultingRevision,
    createdAt, updatedAt: event.recordedAt, lastCommandId: event.commandId,
    state: event.kind, currentReference: clone(projection.currentReference),
  };
  return { ...withoutReference, reference: brewingReferenceRecordContentReference(withoutReference) };
}

function stripInternal(projection: MutableProjection): BrewingReferenceProjectionV1 {
  const { adoptedKeys: _adoptedKeys, ...visible } = projection;
  return clone(visible);
}

function validateEvent(value: unknown): asserts value is BrewingReferenceEvent {
  if (!object(value) || !text(value.ownerKey) || value.ownerKey.trim() !== value.ownerKey
    || !text(value.contextId) || value.contextId.trim() !== value.contextId || !text(value.commandId)
    || !isoDate(value.recordedAt) || !Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0
    || !Number.isSafeInteger(value.resultingRevision) || value.resultingRevision !== value.expectedRevision + 1
    || !text(value.kind) || !object(value.payload) || !text(value.contentReference) || !text(value.commandReference)) invalid('Événement de référence mal formé.');
  onlyKeys(value, ['eventFormatVersion', 'ownerKey', 'contextId', 'commandId', 'expectedRevision', 'resultingRevision', 'recordedAt', 'kind', 'payload', 'contentReference', 'commandReference'], 'Événement de référence');
  if (!['contextOpened', 'observationRecorded', 'observationCorrected', 'referenceProposed', 'referenceAdopted', 'referenceActivated', 'interpretationLinked', 'interpretationsLinked', 'j5ResultLinked'].includes(value.kind)) invalid('Type d’événement de référence inconnu.');
  if (value.eventFormatVersion !== (value.kind === 'referenceActivated' ? BREWING_REFERENCE_ACTIVATION_EVENT_FORMAT_VERSION : BREWING_REFERENCE_EVENT_FORMAT_VERSION)) invalid('Le format d’événement ne correspond pas à son type.');
  validatePayload(value.kind as BrewingReferenceEventKind, value.payload);
  const expectedCommandReference = commandReference(value as BrewingReferenceCommandInput);
  if (expectedCommandReference !== value.commandReference || brewingReferenceEventContentReference(value as BrewingReferenceEvent) !== value.contentReference) invalid('Empreinte d’événement ou de commande incorrecte.');
}

function applyPayload(projection: MutableProjection, event: BrewingReferenceEvent): void {
  const payload = event.payload as any;
  switch (event.kind) {
    case 'observationRecorded': {
      const observation = payload.observation as BrewingReferenceObservationV1;
      if (projection.observations.some(row => row.id === observation.id)) transition('Une nouvelle dégustation doit employer une nouvelle identité d’observation.');
      if (observation.version !== 1) transition('Une première observation doit commencer à la version un.');
      projection.observations.push(clone(observation));
      return;
    }
    case 'observationCorrected': {
      const observation = payload.observation as BrewingReferenceObservationV1;
      const current = [...projection.observations].reverse().find(row => row.id === observation.id);
      if (!current || current.version !== payload.correctsVersion || observation.version !== current.version + 1) transition('La correction ne prolonge pas la version courante de cette observation.');
      projection.observations.push(clone(observation));
      return;
    }
    case 'referenceProposed': {
      const reference = payload.reference as BrewingReferenceVersionV1;
      if (projection.references.some(row => row.id === reference.id && row.version === reference.version)) transition('Cette version de référence existe déjà.');
      const current = currentRecord(projection);
      if (current && (!reference.predecessor || referenceKey(reference.predecessor) !== referenceKey(current))) transition('Une nouvelle référence doit nommer la référence adoptée exacte comme prédécesseur.');
      if (!current && reference.predecessor) transition('Une première référence ne peut pas revendiquer un prédécesseur absent.');
      projection.references.push(clone(reference));
      return;
    }
    case 'referenceAdopted': {
      const identity = payload.reference as BrewingReferenceIdentityV1;
      const reference = findReference(projection, identity);
      if (!reference) transition('Seule une version de référence proposée peut être adoptée.');
      if (projection.adoptedKeys.has(referenceKey(identity))) transition('Cette version de référence a déjà été adoptée.');
      const current = currentRecord(projection);
      if (current && (!reference.predecessor || referenceKey(reference.predecessor) !== referenceKey(current))) transition('La référence à adopter ne prolonge pas le prédécesseur courant.');
      if (!current && reference.predecessor) transition('Le prédécesseur de la référence à adopter est absent.');
      projection.adoptions.push({ reference: clone(identity), adoptedBy: clone(payload.adoptedBy), adoptedAt: event.recordedAt });
      projection.adoptedKeys.add(referenceKey(identity));
      projection.currentReference = clone(identity);
      return;
    }
    case 'referenceActivated': {
      const identity = payload.reference as BrewingReferenceIdentityV1;
      const reference = findReference(projection, identity);
      if (!reference || !projection.adoptedKeys.has(referenceKey(identity))) transition('Seule une référence exacte déjà adoptée peut être réactivée.');
      if (projection.currentReference && referenceKey(projection.currentReference) === referenceKey(identity)) transition('Cette référence est déjà active.');
      try { assertBrewingSensoryDefinitionSet(reference.sensoryDefinitions); }
      catch (error) { transition(error instanceof Error ? error.message : 'La référence historique ne passe pas le contrôle de définitions.'); }
      projection.currentReference = clone(identity);
      return;
    }
    case 'interpretationLinked': {
      appendInterpretations(projection, [payload.interpretation as BrewingReferenceInterpretationV1], event.recordedAt);
      return;
    }
    case 'interpretationsLinked': {
      appendInterpretations(projection, payload.interpretations as BrewingReferenceInterpretationV1[], event.recordedAt);
      return;
    }
    case 'j5ResultLinked': {
      const link = payload.link as BrewingReferenceJ5ResultLinkV1;
      if (projection.j5ResultLinks.some(row => row.id === link.id)) transition('Identité de lien de résultat J5 déjà utilisée.');
      if (!findReference(projection, link.reference) || !projection.adoptedKeys.has(referenceKey(link.reference))) transition('Le résultat doit être lié à une référence adoptée exacte.');
      const receiptAt = link.receipt.status === 'local' ? link.receipt.receivedAt : link.receipt.confirmedAt;
      if (Date.parse(receiptAt) > Date.parse(event.recordedAt)) transition('Le reçu de résultat doit précéder ou dater le lien au résultat.');
      projection.j5ResultLinks.push(clone(link));
      return;
    }
    case 'contextOpened':
      transition('L’ouverture du contexte ne peut apparaître qu’en première position.');
  }
}

function validateComparability(observation: BrewingReferenceObservationV1, link: BrewingReferenceInterpretationV1, recordedAt: string): void {
  const source = observation.dimension;
  if (link.comparability.kind === 'exact') {
    if (source.status !== 'resolved' || source.definition.contentReference !== link.targetDefinition.contentReference
      || observation.scale.status !== 'known') transition('Une comparabilité exacte exige la même définition et une échelle connue.');
  } else if (link.comparability.kind === 'mapped') {
    const mapping = link.comparability.mapping;
    if (!sameJson(mapping.source, source) || mapping.target.contentReference !== link.targetDefinition.contentReference) transition('Le mapping ne couvre pas exactement la source et la cible du lien.');
    if (Date.parse(mapping.adoptedAt) > Date.parse(recordedAt)) transition('Le mapping doit être adopté avant le lien d’interprétation.');
  }
}

export function openBrewingReferenceContext(input: OpenBrewingReferenceContextInput): OpenedBrewingReferenceContext {
  const event = createBrewingReferenceCommand({ ownerKey: input.ownerKey, contextId: input.contextId, commandId: input.commandId,
    expectedRevision: 0, recordedAt: input.recordedAt, kind: 'contextOpened', payload: { context: input.context } });
  const { record } = projectionFromEvents([event]);
  return { record, event };
}

export interface AppliedBrewingReferenceCommand {
  record: BrewingReferenceRecordV1;
  event: BrewingReferenceEvent;
  duplicate: boolean;
}

export function applyBrewingReferenceCommand(
  recordValue: BrewingReferenceRecordV1,
  command: BrewingReferenceCommandInput,
  eventValues: readonly BrewingReferenceEvent[],
): AppliedBrewingReferenceCommand {
  const replay = projectionFromEvents(eventValues);
  assertBrewingReferenceRecord(recordValue);
  if (recordValue.reference !== replay.record.reference) invalid('La projection de référence ne correspond pas au journal append-only.');
  if (recordValue.ownerKey !== command.ownerKey || recordValue.contextId !== command.contextId) invalid('Commande liée à un autre contexte de référence.');
  const fingerprint = commandReference(command);
  const existing = eventValues.find(row => row.commandId === command.commandId);
  if (existing) {
    if (existing.commandReference !== fingerprint) throw new BrewingReferenceError('commandIdConflict', 'commandId déjà utilisé avec un contenu différent.');
    return { record: clone(recordValue), event: clone(existing), duplicate: true };
  }
  if (command.kind === 'contextOpened') transition('Un contexte déjà ouvert ne peut pas être ouvert à nouveau.');
  if (command.expectedRevision !== recordValue.revision) throw new BrewingReferenceError('staleRevision', 'La révision du contexte de référence est périmée.');
  const candidate = createBrewingReferenceCommand(command);
  if (command.kind === 'referenceAdopted') {
    const proposed = findReference(replay.projection, command.payload.reference);
    if (proposed) {
      try { assertBrewingSensoryDefinitionSet(proposed.sensoryDefinitions); }
      catch (error) { invalid(error instanceof Error ? error.message : 'La référence ne peut pas être adoptée avec ces définitions sensorielles.'); }
    }
  }
  const event = candidate;
  const next = projectionFromEvents([...eventValues, event]);
  return { record: next.record, event, duplicate: false };
}

export function assertBrewingReferenceRecord(value: unknown): asserts value is BrewingReferenceRecordV1 {
  if (!object(value) || value.formatVersion !== 1 || !text(value.ownerKey) || value.ownerKey.trim() !== value.ownerKey
    || !text(value.contextId) || value.contextId.trim() !== value.contextId || !Number.isSafeInteger(value.revision)
    || value.revision < 1 || !isoDate(value.createdAt) || !isoDate(value.updatedAt) || !text(value.lastCommandId)
    || !text(value.state) || !text(value.reference) || value.currentReference !== null && identityError(value.currentReference)) invalid('Projection de référence persistée mal formée.');
  onlyKeys(value, ['formatVersion', 'ownerKey', 'contextId', 'revision', 'createdAt', 'updatedAt', 'lastCommandId', 'state', 'currentReference', 'reference'], 'Projection de référence');
  if (!['contextOpened', 'observationRecorded', 'observationCorrected', 'referenceProposed', 'referenceAdopted', 'referenceActivated', 'interpretationLinked', 'interpretationsLinked', 'j5ResultLinked'].includes(value.state)) invalid('État de projection inconnu.');
  const { reference: _reference, ...content } = value;
  if (brewingReferenceRecordContentReference(content as BrewingReferenceRecordV1) !== value.reference) invalid('Empreinte de projection de référence incorrecte.');
}

export function readBrewingReferenceRecord(recordValue: unknown, eventValues: readonly unknown[]): BrewingReferenceReadResult {
  if (!Array.isArray(eventValues)) invalid('Journal de référence invalide.');
  if (!object(recordValue) || !Number.isSafeInteger(recordValue.formatVersion)) invalid('Enveloppe de référence persistée mal formée.');
  if (recordValue.formatVersion !== 1) return { status: 'unsupportedFormat', reason: 'recordFormat', formatVersion: recordValue.formatVersion, raw: clone({ record: recordValue, events: eventValues }) };
  const futureEvent = eventValues.find(value => object(value) && value.eventFormatVersion !== 1 && value.eventFormatVersion !== 2);
  if (futureEvent) return { status: 'unsupportedFormat', reason: 'eventFormat', formatVersion: futureEvent.eventFormatVersion, raw: clone({ record: recordValue, events: eventValues }) };
  const events = eventValues.map(value => { validateEvent(value); return clone(value); });
  const replay = projectionFromEvents(events);
  assertBrewingReferenceRecord(recordValue);
  if (replay.record.reference !== recordValue.reference || !sameJson(replay.record, recordValue)) invalid('La projection stockée ne correspond pas au journal relu.');
  if (events.at(-1)?.commandId !== recordValue.lastCommandId) invalid('Le dernier commandId de la projection ne correspond pas au journal.');
  return { record: clone(recordValue), events, projection: clone(replay.projection) };
}

/** Returns the stored projection only; this function has no calculation path. */
export function getBrewingReferenceProjection(read: BrewingReferenceRecordReadV1): BrewingReferenceProjectionV1 {
  if (!read || !read.record || !Array.isArray(read.events) || !read.projection) invalid('Relecture de référence validée attendue.');
  return clone(read.projection);
}

