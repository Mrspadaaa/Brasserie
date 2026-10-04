import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export const BREWING_OBSERVED_STATE_INPUT_VERSION = 'brewing-observed-state-input-v1' as const;
export const BREWING_OBSERVED_STATE_VERSION = 'brewing-observed-state-v1' as const;
export const BREWING_OBSERVED_APPLICABILITY_VERSION = 'brewing-observed-state-applicability-v1' as const;

export interface BrewingObservedIdentityV1 {
  id: string;
  version: string;
  contentReference: string;
}

export interface BrewingObservedProvenanceV1 {
  kind: string;
  reference: string;
  description: string;
  author?: string;
}

export interface BrewingObservedTimeEvidenceV1 {
  effectiveAt: string;
  recordedAt: string;
  provenance: BrewingObservedProvenanceV1;
}

export type BrewingObservedSubjectV1 =
  | { kind: 'beer'; identity: BrewingObservedIdentityV1 }
  | {
      kind: 'sample';
      identity: BrewingObservedIdentityV1;
      sourceBeer: BrewingObservedIdentityV1 | null;
      collection: BrewingObservedTimeEvidenceV1;
    };

export type BrewingObservedEpistemicStatusV1 = 'observed' | 'reported' | 'assumed' | 'conflicting';
export type BrewingObservedKnownReferenceV1 =
  | { status: 'identified'; reference: BrewingObservedIdentityV1 }
  | { status: 'unresolved'; label: string; reason: string };

export type BrewingObservedQuantityV1 =
  | { status: 'known'; value: number; unit: string }
  | { status: 'unitUnknown'; value: number; rawUnit?: string; reason: string }
  | { status: 'unknown'; reason: string };

interface BrewingObservedFactBaseV1 {
  id: string;
  version: number;
  supersedesVersion: number | null;
  subjectReference: BrewingObservedIdentityV1;
  dependencyId: string;
  effectiveAt: string;
  recordedAt: string;
  epistemicStatus: BrewingObservedEpistemicStatusV1;
  provenance: BrewingObservedProvenanceV1;
}

export type BrewingObservedFactV1 =
  | (BrewingObservedFactBaseV1 & {
      kind: 'materialAdded' | 'materialRemoved';
      material: BrewingObservedKnownReferenceV1;
      lot: BrewingObservedKnownReferenceV1;
      quantity: BrewingObservedQuantityV1;
    })
  | (BrewingObservedFactBaseV1 & {
      kind: 'condition';
      property: string;
      value: { status: 'known'; value: JsonValue; unit: string | null } | { status: 'unknown'; reason: string };
    });

export interface BrewingObservedContactV1 {
  id: string;
  version: number;
  supersedesVersion: number | null;
  subjectReference: BrewingObservedIdentityV1;
  dependencyId: string;
  material: BrewingObservedKnownReferenceV1;
  lot: BrewingObservedKnownReferenceV1;
  started: BrewingObservedTimeEvidenceV1;
  /** Actual end evidence. Absence is unknown, never an inferred withdrawal. */
  ended?: BrewingObservedTimeEvidenceV1;
  /** Explicit continuity attestation through this instant; not a planned duration. */
  activeThrough?: BrewingObservedTimeEvidenceV1;
  epistemicStatus: BrewingObservedEpistemicStatusV1;
}

export interface BrewingObservedCoverageV1 {
  id: string;
  version: number;
  supersedesVersion: number | null;
  subjectReference: BrewingObservedIdentityV1;
  dependencyId: string;
  fromAt: string;
  throughAt: string;
  status: 'complete' | 'partial' | 'unknown' | 'conflicting';
  recordedAt: string;
  provenance: BrewingObservedProvenanceV1;
}

export interface BrewingObservedSampleContinuityV1 {
  id: string;
  version: number;
  supersedesVersion: number | null;
  sampleReference: BrewingObservedIdentityV1;
  fromAt: string;
  throughAt: string;
  status: 'preserved' | 'changed' | 'unknown' | 'conflicting';
  recordedAt: string;
  provenance: BrewingObservedProvenanceV1;
}

export interface BrewingObservedStateInputV1 {
  format: typeof BREWING_OBSERVED_STATE_INPUT_VERSION;
  subject: BrewingObservedSubjectV1;
  /** Physical-state cutoff. For a sample it must equal collection.effectiveAt. */
  asOf: string;
  /** Knowledge cutoff, distinct from effective time. */
  knowledgeAsOf: string;
  knowledgeReference: BrewingObservedIdentityV1;
  facts: BrewingObservedFactV1[];
  contacts: BrewingObservedContactV1[];
  coverage: BrewingObservedCoverageV1[];
  sampleContinuity: BrewingObservedSampleContinuityV1[];
}

export interface BrewingObservedStateDependencyV1 {
  id: string;
  status: 'available' | 'partial' | 'unknown' | 'conflicting';
  /** Physical dependency content, excluding event-registration/provenance metadata. */
  valueReferences: string[];
  factReferences: string[];
  contactReferences: string[];
  coverageReferences: string[];
  reasons: string[];
}

export interface BrewingObservedFactDispositionV1 {
  id: string;
  version: number;
  reference: string;
  disposition: 'effective' | 'afterCutoff' | 'notYetKnown' | 'superseded' | 'assumed' | 'conflicting' | 'atCutoff' | 'otherSubject';
  reason?: string;
}

export interface BrewingObservedContactResolutionV1 {
  id: string;
  version: number;
  reference: string;
  physicalValueReference: string;
  startedAt: string;
  dependencyId: string;
  material: BrewingObservedKnownReferenceV1;
  lot: BrewingObservedKnownReferenceV1;
  status: 'active' | 'ended' | 'notStarted' | 'continuityUnknown' | 'conflicting';
  /** Exact elapsed time only when continuity through asOf or an actual end is evidenced. */
  elapsedSeconds?: number;
  /** A known lower bound, never presented as total elapsed time. */
  lowerBoundSeconds?: number;
  evidenceReferences: string[];
  reason?: string;
}

export interface BrewingObservedContactDispositionV1 {
  id: string;
  version: number;
  reference: string;
  disposition: 'effective' | 'afterCutoff' | 'atCutoff' | 'notYetKnown' | 'superseded' | 'assumed' | 'conflicting' | 'otherSubject';
  reason?: string;
}

export interface BrewingObservedCoverageDispositionV1 {
  id: string;
  version: number;
  reference: string;
  dependencyId: string;
  disposition: 'applies' | 'outsideScope' | 'notYetKnown' | 'superseded' | 'conflicting' | 'otherSubject';
  reason?: string;
}

export interface BrewingObservedStateV1 {
  format: typeof BREWING_OBSERVED_STATE_VERSION;
  subject: BrewingObservedSubjectV1;
  asOf: string;
  knowledgeAsOf: string;
  knowledgeReference: BrewingObservedIdentityV1;
  /** Content identity of the resolved physical snapshot; not an applicability/expiry rule. */
  physicalStateReference: string;
  /** Identity of this resolution, including knowledge and dependency statuses. */
  resolutionReference: string;
  /** All source rows remain available, including future, superseded and conflicting facts. */
  facts: BrewingObservedFactV1[];
  contacts: BrewingObservedContactV1[];
  coverage: BrewingObservedCoverageV1[];
  sampleContinuity: BrewingObservedSampleContinuityV1[];
  factDispositions: BrewingObservedFactDispositionV1[];
  contactDispositions: BrewingObservedContactDispositionV1[];
  coverageDispositions: BrewingObservedCoverageDispositionV1[];
  contactStates: BrewingObservedContactResolutionV1[];
  dependencies: BrewingObservedStateDependencyV1[];
  /** Aggregate over declared dependencies only; it is not a universal completeness claim. */
  status: 'resolved' | 'partial' | 'unknown' | 'conflicting';
}

export type BrewingObservedStateUseV1 = 'describeCurrent' | 'projectFuture' | 'comparePrediction';

export type BrewingObservedDimensionV1 =
  | { status: 'resolved'; id: string; version: string }
  | { status: 'unresolved'; label: string };

export interface BrewingObservedStateApplicabilityInputV1 {
  use: BrewingObservedStateUseV1;
  anchor: {
    observationReference: BrewingObservedIdentityV1;
    observedAt: string;
    state: BrewingObservedStateV1;
    dimension: BrewingObservedDimensionV1;
  };
  /** Required for describeCurrent/comparePrediction; omitted for projectFuture. */
  evaluationState?: BrewingObservedStateV1;
  /** Dependency IDs are supplied by the capability/model boundary, not inferred from dimension names. */
  requiredDependencyIds: string[];
}

export interface BrewingObservedDependencyComparisonV1 {
  id: string;
  status: 'same' | 'changed' | 'partial' | 'unknown' | 'conflicting';
  anchor: BrewingObservedStateDependencyV1 | null;
  evaluation: BrewingObservedStateDependencyV1 | null;
  reasons: string[];
}

export interface BrewingObservedStateApplicabilityV1 {
  format: typeof BREWING_OBSERVED_APPLICABILITY_VERSION;
  use: BrewingObservedStateUseV1;
  observationReference: BrewingObservedIdentityV1;
  observedAt: string;
  dimension: BrewingObservedDimensionV1;
  anchorStateReference: string;
  evaluationStateReference: string | null;
  status: 'applicable' | 'historical' | 'continuityUnknown' | 'differentSubject' | 'partial' | 'unknown' | 'conflicting';
  dependencies: BrewingObservedDependencyComparisonV1[];
  reasons: string[];
}

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class BrewingObservedStateError extends Error {
  constructor(readonly code: 'invalidInput' | 'unsupportedFormat', message: string) {
    super(message);
    this.name = 'BrewingObservedStateError';
  }
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clone = <T>(value: T): T => structuredClone(value);
function invalid(message: string): never { throw new BrewingObservedStateError('invalidInput', message); }

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

function identityError(value: unknown): string | null {
  if (!object(value) || !text(value.id) || !text(value.version) || !text(value.contentReference)) return 'Identité observée incomplète.';
  if (Object.keys(value).some(key => !['id', 'version', 'contentReference'].includes(key))) return 'Identité observée contient des champs inconnus.';
  return null;
}

function assertIdentity(value: unknown): asserts value is BrewingObservedIdentityV1 {
  const error = identityError(value);
  if (error) invalid(error);
}

function provenanceError(value: unknown): string | null {
  return object(value) && Object.keys(value).every(key => ['kind', 'reference', 'description', 'author'].includes(key))
    && text(value.kind) && text(value.reference) && text(value.description)
    && (value.author === undefined || text(value.author)) ? null : 'Provenance de fait invalide.';
}

function assertProvenance(value: unknown): asserts value is BrewingObservedProvenanceV1 {
  const error = provenanceError(value);
  if (error) invalid(error);
}

function knownReferenceError(value: unknown): string | null {
  if (!object(value)) return 'Référence de matière ou de lot absente.';
  if (value.status === 'identified') {
    if (Object.keys(value).some(key => !['status', 'reference'].includes(key))) return 'Identité de matière ou de lot contient des champs inconnus.';
    return identityError(value.reference);
  }
  if (value.status === 'unresolved' && text(value.label) && text(value.reason)) {
    if (Object.keys(value).some(key => !['status', 'label', 'reason'].includes(key))) return 'Libellé non résolu contient des champs inconnus.';
    return null;
  }
  return 'Référence de matière ou de lot invalide.';
}

function assertKnownReference(value: unknown): asserts value is BrewingObservedKnownReferenceV1 {
  const error = knownReferenceError(value);
  if (error) invalid(error);
}

function amountError(value: unknown): string | null {
  if (!object(value)) return 'Quantité de matière absente.';
  if (value.status === 'known') {
    onlyKeys(value, ['status', 'value', 'unit'], 'Quantité connue');
    return finite(value.value) && text(value.unit) ? null : 'Quantité ou unité connue invalide.';
  }
  if (value.status === 'unitUnknown') {
    onlyKeys(value, ['status', 'value', 'rawUnit', 'reason'], 'Quantité sans unité résolue');
    return finite(value.value) && (value.rawUnit === undefined || typeof value.rawUnit === 'string') && text(value.reason) ? null : 'Quantité sans unité résolue invalide.';
  }
  if (value.status === 'unknown') {
    onlyKeys(value, ['status', 'reason'], 'Quantité inconnue');
    return text(value.reason) ? null : 'Motif de quantité inconnue absent.';
  }
  return 'Statut de quantité inconnu.';
}

function assertSubject(value: unknown): asserts value is BrewingObservedSubjectV1 {
  if (!object(value) || !text(value.kind)) invalid('Sujet physique absent.');
  if (value.kind === 'beer') {
    onlyKeys(value, ['kind', 'identity'], 'Sujet bière');
    assertIdentity(value.identity);
    return;
  }
  if (value.kind === 'sample') {
    onlyKeys(value, ['kind', 'identity', 'sourceBeer', 'collection'], 'Sujet échantillon');
    assertIdentity(value.identity);
    if (value.sourceBeer !== null) assertIdentity(value.sourceBeer);
    assertTimeEvidence(value.collection, 'Prélèvement');
    return;
  }
  invalid('Type de sujet physique inconnu.');
}

function assertTimeEvidence(value: unknown, label: string): asserts value is BrewingObservedTimeEvidenceV1 {
  if (!object(value)) invalid(`${label}: horodatage absent.`);
  onlyKeys(value, ['effectiveAt', 'recordedAt', 'provenance'], label);
  if (!isoDate(value.effectiveAt) || !isoDate(value.recordedAt)) invalid(`${label}: horodatage effectif ou enregistré invalide.`);
  assertProvenance(value.provenance);
}

function assertFact(value: unknown): asserts value is BrewingObservedFactV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1
    || (value.supersedesVersion !== null && (!Number.isSafeInteger(value.supersedesVersion) || value.supersedesVersion < 1))
    || !text(value.dependencyId) || identityError(value.subjectReference) || !isoDate(value.effectiveAt) || !isoDate(value.recordedAt)
    || !['observed', 'reported', 'assumed', 'conflicting'].includes(value.epistemicStatus)) invalid('Fait réalisé mal formé.');
  assertIdentity(value.subjectReference);
  assertProvenance(value.provenance);
  if (value.kind === 'materialAdded' || value.kind === 'materialRemoved') {
    onlyKeys(value, ['id', 'version', 'supersedesVersion', 'subjectReference', 'dependencyId', 'effectiveAt', 'recordedAt', 'epistemicStatus', 'provenance', 'kind', 'material', 'lot', 'quantity'], 'Fait de matière');
    assertKnownReference(value.material); assertKnownReference(value.lot);
    const error = amountError(value.quantity);
    if (error) invalid(error);
    return;
  }
  if (value.kind === 'condition') {
    onlyKeys(value, ['id', 'version', 'supersedesVersion', 'subjectReference', 'dependencyId', 'effectiveAt', 'recordedAt', 'epistemicStatus', 'provenance', 'kind', 'property', 'value'], 'Fait de condition');
    if (!text(value.property) || !object(value.value)) invalid('Condition observée incomplète.');
    if (value.value.status === 'known') {
      onlyKeys(value.value, ['status', 'value', 'unit'], 'Valeur de condition');
      if (!jsonValue(value.value.value) || (value.value.unit !== null && !text(value.value.unit))) invalid('Valeur ou unité de condition invalide.');
    } else if (value.value.status === 'unknown') {
      onlyKeys(value.value, ['status', 'reason'], 'Condition inconnue');
      if (!text(value.value.reason)) invalid('Motif de condition inconnue absent.');
    } else invalid('Statut de condition inconnu.');
    return;
  }
  invalid('Type de fait réalisé inconnu; le résolveur ne reçoit pas de faits planifiés.');
}

function assertContact(value: unknown): asserts value is BrewingObservedContactV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1
    || value.supersedesVersion !== null && (!Number.isSafeInteger(value.supersedesVersion) || value.supersedesVersion < 1)
    || !text(value.dependencyId) || identityError(value.subjectReference)
    || !['observed', 'reported', 'assumed', 'conflicting'].includes(value.epistemicStatus)) invalid('Contact réalisé mal formé.');
  onlyKeys(value, ['id', 'version', 'supersedesVersion', 'subjectReference', 'dependencyId', 'material', 'lot', 'started', 'ended', 'activeThrough', 'epistemicStatus'], 'Contact réalisé');
  assertIdentity(value.subjectReference); assertKnownReference(value.material); assertKnownReference(value.lot);
  assertTimeEvidence(value.started, 'Début de contact');
  if (value.ended !== undefined) assertTimeEvidence(value.ended, 'Fin de contact');
  if (value.activeThrough !== undefined) assertTimeEvidence(value.activeThrough, 'Attestation de continuité');
}

function assertCoverage(value: unknown): asserts value is BrewingObservedCoverageV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1
    || value.supersedesVersion !== null && (!Number.isSafeInteger(value.supersedesVersion) || value.supersedesVersion < 1)
    || !text(value.dependencyId) || identityError(value.subjectReference)
    || !isoDate(value.fromAt) || !isoDate(value.throughAt)
    || !['complete', 'partial', 'unknown', 'conflicting'].includes(value.status) || !isoDate(value.recordedAt)) invalid('Déclaration de portée de complétude invalide.');
  onlyKeys(value, ['id', 'version', 'supersedesVersion', 'subjectReference', 'dependencyId', 'fromAt', 'throughAt', 'status', 'recordedAt', 'provenance'], 'Complétude de portée');
  assertIdentity(value.subjectReference); assertProvenance(value.provenance);
}

function assertSampleContinuity(value: unknown): asserts value is BrewingObservedSampleContinuityV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1
    || value.supersedesVersion !== null && (!Number.isSafeInteger(value.supersedesVersion) || value.supersedesVersion < 1)
    || identityError(value.sampleReference) || !isoDate(value.fromAt) || !isoDate(value.throughAt)
    || !['preserved', 'changed', 'unknown', 'conflicting'].includes(value.status)
    || !isoDate(value.recordedAt)) invalid('Preuve de continuité d’échantillon invalide.');
  onlyKeys(value, ['id', 'version', 'supersedesVersion', 'sampleReference', 'fromAt', 'throughAt', 'status', 'recordedAt', 'provenance'], 'Continuité d’échantillon');
  assertIdentity(value.sampleReference); assertProvenance(value.provenance);
}

function assertInput(value: unknown): asserts value is BrewingObservedStateInputV1 {
  if (!object(value) || value.format !== BREWING_OBSERVED_STATE_INPUT_VERSION || !isoDate(value.asOf)
    || !isoDate(value.knowledgeAsOf) || !Array.isArray(value.facts) || !Array.isArray(value.contacts)
    || !Array.isArray(value.coverage) || !Array.isArray(value.sampleContinuity)) invalid('Entrée de résolution d’état réalisé invalide.');
  onlyKeys(value, ['format', 'subject', 'asOf', 'knowledgeAsOf', 'knowledgeReference', 'facts', 'contacts', 'coverage', 'sampleContinuity'], 'Entrée d’état réalisé');
  assertSubject(value.subject); assertIdentity(value.knowledgeReference);
  value.facts.forEach(assertFact); value.contacts.forEach(assertContact); value.coverage.forEach(assertCoverage); value.sampleContinuity.forEach(assertSampleContinuity);
  if (value.subject.kind === 'sample' && Date.parse(value.asOf) !== Date.parse(value.subject.collection.effectiveAt)) invalid('Pour un échantillon, asOf doit être exactement l’instant du prélèvement.');
  if (value.subject.kind === 'beer' && value.sampleContinuity.length) invalid('Une bière entière ne peut pas recevoir des preuves de continuité d’un échantillon.');
  const sampleRef = value.subject.kind === 'sample' ? value.subject.identity : null;
  for (const continuity of value.sampleContinuity) {
    if (!sampleRef || referenceKey(sampleRef) !== referenceKey(continuity.sampleReference)) invalid('La continuité cible un autre échantillon.');
  }
}

const referenceKey = (reference: BrewingObservedIdentityV1): string => `${reference.id}\u0000${reference.version}\u0000${reference.contentReference}`;

export function brewingObservedStateInputContentReference(input: BrewingObservedStateInputV1): string {
  return hopAdviceContentReference('brewing-observed-state-input-v1', input);
}

export function brewingObservedStateContentReference(state: Omit<BrewingObservedStateV1, 'resolutionReference'> | BrewingObservedStateV1): string {
  return brewingObservedStateResolutionReference(state);
}

export function brewingObservedStateResolutionReference(state: Omit<BrewingObservedStateV1, 'resolutionReference'> | BrewingObservedStateV1): string {
  const { resolutionReference: _resolutionReference, ...content } = state as BrewingObservedStateV1;
  return hopAdviceContentReference('brewing-observed-resolution-v1', content);
}

export function createBrewingObservedStateInput(input: BrewingObservedStateInputV1): BrewingObservedStateInputV1 {
  assertInput(input);
  return clone(input);
}

interface GroupedVersion<T extends { id: string; version: number; supersedesVersion: number | null }> {
  selected?: T;
  conflicts: T[];
}

function selectedVersions<T extends { id: string; version: number; supersedesVersion: number | null }>(
  rows: readonly T[], knowledgeAsOf: string, recordedAtOf: (row: T) => string,
  groupKey: (row: T) => string = row => row.id,
): Map<string, GroupedVersion<T>> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = groupKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const result = new Map<string, GroupedVersion<T>>();
  for (const [id, versions] of groups) {
    const eligible = versions.filter(row => Date.parse(recordedAtOf(row)) <= Date.parse(knowledgeAsOf)).sort((a, b) => a.version - b.version);
    const conflicts: T[] = [];
    for (const version of new Set(eligible.map(row => row.version))) {
      const duplicates = eligible.filter(row => row.version === version);
      if (duplicates.length > 1) conflicts.push(...duplicates);
    }
    let selected: T | undefined;
    if (!conflicts.length && eligible.length) {
      const distinct = [...new Map(eligible.map(row => [row.version, row])).values()].sort((a, b) => a.version - b.version);
      for (let index = 0; index < distinct.length; index++) {
        const row = distinct[index];
        const expectedSupersedes = index === 0 ? null : distinct[index - 1].version;
        const recordingTimeInverted = index > 0 && Date.parse(recordedAtOf(row)) < Date.parse(recordedAtOf(distinct[index - 1]));
        if (row.supersedesVersion !== expectedSupersedes || (index === 0 && row.version !== 1) || recordingTimeInverted) {
          conflicts.push(row);
          break;
        }
      }
      if (!conflicts.length) selected = distinct.at(-1);
    }
    result.set(id, { selected, conflicts });
  }
  return result;
}

function actualSubjectReference(subject: BrewingObservedSubjectV1): BrewingObservedIdentityV1 {
  return subject.kind === 'beer' ? subject.identity : subject.sourceBeer ?? subject.identity;
}

function physicalSubjectContent(subject: BrewingObservedSubjectV1) {
  return subject.kind === 'beer'
    ? { kind: 'beer', identity: subject.identity }
    : { kind: 'sample', identity: subject.identity, sourceBeer: subject.sourceBeer, sampledAt: subject.collection.effectiveAt };
}

function eventContentReference<T>(prefix: string, value: T): string { return hopAdviceContentReference(prefix, value); }

function factReference(fact: BrewingObservedFactV1): string {
  return eventContentReference('brewing-observed-fact-v1', fact);
}

function findFactSource(facts: readonly BrewingObservedFactV1[], reference: string): BrewingObservedFactV1 | null {
  return facts.find(fact => factReference(fact) === reference) ?? null;
}

/** Finds a fact by its exact immutable documentary hash, including its subject identity. */
export function brewingObservedFactSource(state: BrewingObservedStateV1, reference: string): BrewingObservedFactV1 | null {
  if (!object(state) || !Array.isArray(state.facts) || !text(reference)) return null;
  return findFactSource(state.facts, reference);
}

function factValueReference(fact: BrewingObservedFactV1): string {
  const refValue = (value: BrewingObservedKnownReferenceV1) => value.status === 'identified'
    ? { status: value.status, reference: value.reference } : { status: value.status, label: value.label };
  const quantityValue = (value: BrewingObservedQuantityV1) => value.status === 'known'
    ? { status: value.status, value: value.value, unit: value.unit }
    : value.status === 'unitUnknown' ? { status: value.status, value: value.value, rawUnit: value.rawUnit ?? null }
      : { status: value.status };
  const value = fact.kind === 'condition'
    ? { kind: fact.kind, subjectReference: fact.subjectReference,
        effectiveAt: fact.effectiveAt, property: fact.property,
        value: fact.value.status === 'known' ? fact.value : { status: fact.value.status } }
    : { kind: fact.kind, subjectReference: fact.subjectReference,
        effectiveAt: fact.effectiveAt, material: refValue(fact.material), lot: refValue(fact.lot), quantity: quantityValue(fact.quantity) };
  return eventContentReference('brewing-observed-physical-fact-v1', value);
}

/** Physical content only; a later transcription/version does not itself change the realised fact. */
export function brewingObservedFactPhysicalReference(fact: BrewingObservedFactV1): string {
  assertFact(fact);
  return factValueReference(fact);
}

function contactReference(contact: BrewingObservedContactV1): string {
  return eventContentReference('brewing-observed-contact-v1', contact);
}

function findContactSource(contacts: readonly BrewingObservedContactV1[], reference: string): BrewingObservedContactV1 | null {
  return contacts.find(contact => contactReference(contact) === reference) ?? null;
}

/** Finds a contact by its exact immutable documentary hash, including its subject identity. */
export function brewingObservedContactSource(state: BrewingObservedStateV1, reference: string): BrewingObservedContactV1 | null {
  if (!object(state) || !Array.isArray(state.contacts) || !text(reference)) return null;
  return findContactSource(state.contacts, reference);
}

function contactPhysicalValueReference(contact: BrewingObservedContactV1, status: BrewingObservedContactResolutionV1['status'],
  elapsedSeconds?: number, lowerBoundSeconds?: number): string {
  const refValue = (value: BrewingObservedKnownReferenceV1) => value.status === 'identified'
    ? { status: value.status, reference: value.reference } : { status: value.status, label: value.label };
  return eventContentReference('brewing-observed-physical-contact-v1', {
    id: contact.id, subjectReference: contact.subjectReference,
    material: refValue(contact.material), lot: refValue(contact.lot), startedAt: contact.started.effectiveAt, status,
    ...(elapsedSeconds !== undefined ? { elapsedSeconds } : {}),
    ...(lowerBoundSeconds !== undefined ? { lowerBoundSeconds } : {}),
  });
}

function coverageReference(coverage: BrewingObservedCoverageV1): string {
  return eventContentReference('brewing-observed-coverage-v1', coverage);
}

function contactRecordedAt(contact: BrewingObservedContactV1): string {
  return [contact.started.recordedAt, contact.ended?.recordedAt, contact.activeThrough?.recordedAt]
    .filter((value): value is string => !!value).sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1)!;
}

function directRecordedAt<T extends { recordedAt: string }>(row: T): string { return row.recordedAt; }

function sampleContinuityReference(row: BrewingObservedSampleContinuityV1): string {
  return eventContentReference('brewing-observed-sample-continuity-v1', row);
}

function dependencyFromRows(id: string, patches: Partial<BrewingObservedStateDependencyV1>[]): BrewingObservedStateDependencyV1 {
  const statuses = patches.map(row => row.status).filter((status): status is BrewingObservedStateDependencyV1['status'] => !!status);
  const status = statuses.includes('conflicting') ? 'conflicting'
    : statuses.includes('partial') ? 'partial'
      : statuses.includes('unknown') ? (patches.some(row => (row.factReferences?.length ?? 0) > 0 || (row.contactReferences?.length ?? 0) > 0) ? 'partial' : 'unknown')
        : 'available';
  return { id, status,
    valueReferences: patches.flatMap(row => row.valueReferences ?? []).sort(),
    factReferences: [...new Set(patches.flatMap(row => row.factReferences ?? []))],
    contactReferences: [...new Set(patches.flatMap(row => row.contactReferences ?? []))],
    coverageReferences: [...new Set(patches.flatMap(row => row.coverageReferences ?? []))],
    reasons: [...new Set(patches.flatMap(row => row.reasons ?? []))],
  };
}

function contactState(contact: BrewingObservedContactV1, asOf: string): BrewingObservedContactResolutionV1 {
  const reference = contactReference(contact);
  const evidenceReferences = [
    eventContentReference('brewing-observed-contact-time-v1', contact.started),
    ...(contact.ended ? [eventContentReference('brewing-observed-contact-time-v1', contact.ended)] : []),
    ...(contact.activeThrough ? [eventContentReference('brewing-observed-contact-time-v1', contact.activeThrough)] : []),
  ];
  const base = { id: contact.id, version: contact.version, reference, dependencyId: contact.dependencyId,
    material: clone(contact.material), lot: clone(contact.lot), evidenceReferences };
  const finish = (status: BrewingObservedContactResolutionV1['status'], details: { elapsedSeconds?: number; lowerBoundSeconds?: number; reason?: string } = {}): BrewingObservedContactResolutionV1 => {
    const physicalValueReference = contactPhysicalValueReference(contact, status, details.elapsedSeconds, details.lowerBoundSeconds);
    return { ...base, physicalValueReference, startedAt: contact.started.effectiveAt, status,
      ...(details.elapsedSeconds !== undefined ? { elapsedSeconds: details.elapsedSeconds } : {}),
      ...(details.lowerBoundSeconds !== undefined ? { lowerBoundSeconds: details.lowerBoundSeconds } : {}),
      ...(details.reason ? { reason: details.reason } : {}) };
  };
  const start = Date.parse(contact.started.effectiveAt), cutoff = Date.parse(asOf);
  if (contact.epistemicStatus === 'conflicting' || Date.parse(contact.started.effectiveAt) > Date.parse(contact.started.recordedAt)) {
    return finish('conflicting', { reason: 'Le début du contact est contradictoire ou enregistré avant son effet.' });
  }
  if (contact.epistemicStatus === 'assumed') return finish('continuityUnknown', { reason: 'Le contact est supposé, pas attesté comme réalisé.' });
  if (start > cutoff) return finish('notStarted');
  if (start === cutoff) return finish('continuityUnknown', { reason: 'L’ordre entre début de contact et coupure est inconnu.' });
  if (contact.ended && Date.parse(contact.ended.effectiveAt) > Date.parse(contact.ended.recordedAt)
    || contact.activeThrough && Date.parse(contact.activeThrough.effectiveAt) > Date.parse(contact.activeThrough.recordedAt)) {
    return finish('conflicting', { reason: 'Une borne du contact est enregistrée avant son effet.' });
  }
  if (contact.ended && contact.activeThrough) return finish('conflicting', { reason: 'Fin observée et attestation active incompatibles.' });
  if (contact.ended) {
    const end = Date.parse(contact.ended.effectiveAt);
    if (end < start) return finish('conflicting', { reason: 'La fin du contact précède son début.' });
    if (end === start) return finish('conflicting', { reason: 'Début et fin du contact sont simultanés sans ordre prouvé.' });
    const elapsedUntil = Math.min(cutoff, end);
    return finish(end <= cutoff ? 'ended' : 'active', { elapsedSeconds: (elapsedUntil - start) / 1000 });
  }
  if (contact.activeThrough) {
    const through = Date.parse(contact.activeThrough.effectiveAt);
    if (through < start) return finish('conflicting', { reason: 'L’attestation activeThrough précède le début du contact.' });
    if (through === start) return finish('conflicting', { reason: 'La continuité attestée ne couvre aucune durée positive.' });
    if (through >= cutoff) return finish('active', { elapsedSeconds: (cutoff - start) / 1000 });
    return finish('continuityUnknown', { lowerBoundSeconds: (through - start) / 1000,
      reason: 'La continuité après activeThrough n’est pas attestée; l’écoulé total reste inconnu.' });
  }
  return finish('continuityUnknown', { reason: 'Début connu, mais ni fin ni continuité activeThrough ne sont attestées.' });
}

function appendDependency(map: Map<string, Partial<BrewingObservedStateDependencyV1>[]>, id: string, patch: Partial<BrewingObservedStateDependencyV1>): void {
  map.set(id, [...(map.get(id) ?? []), patch]);
}

export function resolveBrewingObservedState(input: BrewingObservedStateInputV1): BrewingObservedStateV1 {
  assertInput(input);
  const cutoff = Date.parse(input.asOf), knowledgeCutoff = Date.parse(input.knowledgeAsOf);
  const subjectFactRef = actualSubjectReference(input.subject);
  const factsById = selectedVersions(input.facts, input.knowledgeAsOf, directRecordedAt,
    row => `${referenceKey(row.subjectReference)}\u0000${row.id}`);
  const contactsById = selectedVersions(input.contacts, input.knowledgeAsOf, contactRecordedAt,
    row => `${referenceKey(row.subjectReference)}\u0000${row.id}`);
  const coverageById = selectedVersions(input.coverage, input.knowledgeAsOf, directRecordedAt,
    row => `${referenceKey(row.subjectReference)}\u0000${row.id}`);
  const factDispositions: BrewingObservedFactDispositionV1[] = [];
  const dependencyPatches = new Map<string, Partial<BrewingObservedStateDependencyV1>[]>();
  const sourceSubjectKey = referenceKey(subjectFactRef);

  for (const fact of input.facts) {
    const reference = factReference(fact);
    const group = factsById.get(`${referenceKey(fact.subjectReference)}\u0000${fact.id}`)!;
    const isSuperseded = group.selected && group.selected.version !== fact.version
      && Date.parse(fact.recordedAt) <= knowledgeCutoff;
    let state: BrewingObservedFactDispositionV1['disposition'] = 'effective';
    let reason: string | undefined;
    if (referenceKey(fact.subjectReference) !== sourceSubjectKey) {
      state = 'otherSubject'; reason = 'Le fait est conservé mais vise un autre sujet physique exact.';
    } else if (Date.parse(fact.recordedAt) > knowledgeCutoff) {
      state = 'notYetKnown'; reason = 'Le fait n’était pas enregistré à la version de connaissance demandée.';
    } else if (isSuperseded) {
      state = 'superseded'; reason = 'Une correction ultérieure connue remplace cette version.';
    } else if (group.conflicts.some(row => row.version === fact.version)) {
      state = 'conflicting'; reason = 'Plusieurs contenus portent la même identité/version.';
    } else if (group.conflicts.length && group.selected?.version === fact.version) {
      state = 'conflicting'; reason = 'La chaîne de corrections est incohérente.';
    } else if (fact.epistemicStatus === 'assumed') {
      state = 'assumed'; reason = 'Une hypothèse ne devient pas un fait réalisé.';
    } else if (fact.epistemicStatus === 'conflicting' || Date.parse(fact.effectiveAt) > Date.parse(fact.recordedAt)) {
      state = 'conflicting'; reason = 'Le fait réalisé est contradictoire ou enregistré avant son effet.';
    } else if (Date.parse(fact.effectiveAt) > cutoff) {
      state = 'afterCutoff'; reason = 'Le fait prend effet après l’instant de résolution.';
    } else if (Date.parse(fact.effectiveAt) === cutoff) {
      state = 'atCutoff'; reason = 'L’ordre entre le fait et la coupure n’est pas établi.';
    } else if (!group.selected || group.selected.version !== fact.version) {
      state = 'superseded'; reason = 'Cette version n’est pas retenue dans l’état de connaissance.';
    } else if ((fact.kind === 'materialAdded' || fact.kind === 'materialRemoved')
      && fact.quantity.status !== 'unknown' && fact.quantity.value < 0) {
      state = 'conflicting'; reason = 'Une quantité de matière négative est conservée comme fait contradictoire.';
    }
    factDispositions.push({ id: fact.id, version: fact.version, reference, disposition: state, ...(reason ? { reason } : {}) });
    if (state === 'effective') {
      const missing: string[] = [];
      if (fact.kind === 'materialAdded' || fact.kind === 'materialRemoved') {
        if (fact.material.status === 'unresolved' || fact.lot.status === 'unresolved' || fact.quantity.status !== 'known') {
          missing.push(...(fact.material.status === 'unresolved' ? [fact.material.reason] : []),
            ...(fact.lot.status === 'unresolved' ? [fact.lot.reason] : []),
            ...(fact.quantity.status !== 'known' ? [fact.quantity.reason] : []));
        }
      } else if (fact.kind === 'condition' && fact.value.status === 'unknown') {
        missing.push(fact.value.reason);
      }
      appendDependency(dependencyPatches, fact.dependencyId, { status: missing.length ? 'partial' : 'available', factReferences: [reference],
        valueReferences: [factValueReference(fact)], reasons: missing });
    } else if (state === 'atCutoff') {
      appendDependency(dependencyPatches, fact.dependencyId, { status: 'partial', factReferences: [reference], valueReferences: [factValueReference(fact)], reasons: [reason!] });
    } else if (state === 'conflicting') {
      appendDependency(dependencyPatches, fact.dependencyId, { status: 'conflicting', factReferences: [reference], reasons: [reason!] });
    } else if (state === 'assumed') {
      appendDependency(dependencyPatches, fact.dependencyId, { status: 'partial', factReferences: [reference], reasons: [reason!] });
    }
  }

  const materialUnits = new Map<string, string[]>();
  for (const fact of input.facts) {
    if ((fact.kind !== 'materialAdded' && fact.kind !== 'materialRemoved') || fact.quantity.status !== 'known') continue;
    const reference = factReference(fact);
    const accepted = factDispositions.find(row => row.reference === reference)?.disposition === 'effective';
    if (!accepted) continue;
    materialUnits.set(fact.dependencyId, [...(materialUnits.get(fact.dependencyId) ?? []), fact.quantity.unit]);
  }
  for (const [dependencyId, units] of materialUnits) {
    if (new Set(units).size > 1) appendDependency(dependencyPatches, dependencyId, {
      status: 'partial',
      reasons: ['Plusieurs unités restent dans leurs formes sources; aucune conversion ou agrégation n’est appliquée.'],
    });
  }

  const contactDispositions: BrewingObservedContactDispositionV1[] = [];
  const contactStates: BrewingObservedContactResolutionV1[] = [];
  for (const contact of input.contacts) {
    const reference = contactReference(contact);
    const group = contactsById.get(`${referenceKey(contact.subjectReference)}\u0000${contact.id}`)!;
    const selected = group.selected?.version === contact.version;
    let dispositionValue: BrewingObservedContactDispositionV1['disposition'];
    let reason: string | undefined;
    if (referenceKey(contact.subjectReference) !== sourceSubjectKey) {
      dispositionValue = 'otherSubject'; reason = 'Le contact est conservé mais vise un autre sujet physique exact.';
    } else if (Date.parse(contactRecordedAt(contact)) > knowledgeCutoff) {
      dispositionValue = 'notYetKnown'; reason = 'Le début du contact n’était pas connu à la coupure de connaissance.';
    } else if (!selected && Date.parse(contactRecordedAt(contact)) <= knowledgeCutoff) {
      dispositionValue = group.conflicts.length ? 'conflicting' : 'superseded'; reason = group.conflicts.length ? 'Historique de contact contradictoire.' : 'Une version plus récente du contact est connue.';
    } else if (contact.epistemicStatus === 'assumed') {
      dispositionValue = 'assumed'; reason = 'Un contact supposé ne devient pas un contact réalisé.';
    } else if (contact.epistemicStatus === 'conflicting') {
      dispositionValue = 'conflicting'; reason = 'Le statut du contact est contradictoire.';
    } else if (Date.parse(contact.started.effectiveAt) > Date.parse(contact.started.recordedAt)) {
      dispositionValue = 'conflicting'; reason = 'Le contact est enregistré avant son début effectif.';
    } else if (Date.parse(contact.started.effectiveAt) > cutoff) {
      dispositionValue = 'afterCutoff'; reason = 'Le contact commence après la coupure physique.';
      const state = contactState(contact, input.asOf);
      contactStates.push(state);
      contactDispositions.push({ id: contact.id, version: contact.version, reference, disposition: dispositionValue, reason });
      continue;
    } else if (Date.parse(contact.started.effectiveAt) === cutoff) {
      dispositionValue = 'atCutoff'; reason = 'L’ordre entre début de contact et coupure physique n’est pas établi.';
      const state = contactState(contact, input.asOf);
      contactStates.push(state);
      appendDependency(dependencyPatches, contact.dependencyId, { status: 'partial', contactReferences: [reference], valueReferences: [state.physicalValueReference], reasons: [reason] });
      contactDispositions.push({ id: contact.id, version: contact.version, reference, disposition: dispositionValue, reason });
      continue;
    } else {
      dispositionValue = 'effective';
    }
    contactDispositions.push({ id: contact.id, version: contact.version, reference, disposition: dispositionValue, ...(reason ? { reason } : {}) });
    if (dispositionValue === 'effective') {
      const state = contactState(contact, input.asOf);
      contactStates.push(state);
      appendDependency(dependencyPatches, contact.dependencyId, {
        status: state.status === 'conflicting' ? 'conflicting' : state.status === 'continuityUnknown' ? 'partial' : 'available',
        contactReferences: [reference], valueReferences: [state.physicalValueReference], reasons: state.reason ? [state.reason] : [],
      });
    } else if (dispositionValue === 'conflicting') {
      appendDependency(dependencyPatches, contact.dependencyId, { status: 'conflicting', contactReferences: [reference], reasons: [reason!] });
    } else if (dispositionValue === 'assumed') {
      appendDependency(dependencyPatches, contact.dependencyId, { status: 'partial', contactReferences: [reference], reasons: [reason!] });
    }
  }

  const coverageDispositions: BrewingObservedCoverageDispositionV1[] = [];
  for (const coverage of input.coverage) {
    const reference = coverageReference(coverage);
    const group = coverageById.get(`${referenceKey(coverage.subjectReference)}\u0000${coverage.id}`)!;
    const selected = group.selected?.version === coverage.version;
    let dispositionValue: BrewingObservedCoverageDispositionV1['disposition'];
    let reason: string | undefined;
    if (referenceKey(coverage.subjectReference) !== sourceSubjectKey) {
      dispositionValue = 'otherSubject'; reason = 'La complétude est conservée mais vise un autre sujet exact.';
    } else if (Date.parse(coverage.recordedAt) > knowledgeCutoff) {
      dispositionValue = 'notYetKnown'; reason = 'La portée n’était pas déclarée à la coupure de connaissance.';
    } else if (!selected) {
      dispositionValue = group.conflicts.length ? 'conflicting' : 'superseded'; reason = group.conflicts.length ? 'Portées contradictoires.' : 'Une version plus récente de la portée est connue.';
    } else if (Date.parse(coverage.fromAt) > Date.parse(coverage.throughAt) || Date.parse(coverage.throughAt) > Date.parse(coverage.recordedAt)) {
      dispositionValue = 'conflicting'; reason = 'Portée de complétude inversée ou attestée dans le futur.';
    } else if (Date.parse(coverage.fromAt) <= cutoff && cutoff <= Date.parse(coverage.throughAt)) {
      dispositionValue = 'applies';
    } else {
      dispositionValue = 'outsideScope'; reason = 'La coupure est hors de la portée déclarée.';
    }
    coverageDispositions.push({ id: coverage.id, version: coverage.version, reference, dependencyId: coverage.dependencyId, disposition: dispositionValue, ...(reason ? { reason } : {}) });
    if (dispositionValue === 'applies') {
      const status = coverage.status === 'complete' ? 'available'
        : coverage.status === 'conflicting' ? 'conflicting'
          : coverage.status === 'unknown' ? 'unknown' : 'partial';
      appendDependency(dependencyPatches, coverage.dependencyId, { status, coverageReferences: [reference], reasons: coverage.status === 'complete' ? [] : [`Complétude ${coverage.status} pour cette portée.`] });
    } else if (dispositionValue === 'conflicting') {
      appendDependency(dependencyPatches, coverage.dependencyId, { status: 'conflicting', coverageReferences: [reference], reasons: [reason!] });
    }
  }

  const coveredDependencies = new Set(coverageDispositions.filter(row => row.disposition === 'applies').map(row => row.dependencyId));
  const factDependencies = new Set(input.facts.filter(fact => factDispositions.some(row => row.reference === factReference(fact)
    && (row.disposition === 'effective' || row.disposition === 'atCutoff'))).map(fact => fact.dependencyId));
  const contactDependencies = new Set(input.contacts.filter(contact => contactDispositions.some(row => row.reference === contactReference(contact)
    && (row.disposition === 'effective' || row.disposition === 'atCutoff'))).map(contact => contact.dependencyId));
  for (const dependencyId of new Set([...factDependencies, ...contactDependencies])) {
    if (!coveredDependencies.has(dependencyId)) appendDependency(dependencyPatches, dependencyId, {
      status: 'unknown', reasons: ['Aucune déclaration de complétude ne couvre cette dépendance à l’instant demandé.'],
    });
  }

  if (input.subject.kind === 'sample') {
    const sampleSubject = input.subject;
    if (Date.parse(sampleSubject.collection.recordedAt) > knowledgeCutoff) {
      appendDependency(dependencyPatches, `sample:${sampleSubject.identity.id}@${sampleSubject.identity.version}`,
        { status: 'unknown', reasons: ['Le prélèvement n’était pas encore enregistré dans la version de connaissance demandée.'] });
    }
    if (Date.parse(sampleSubject.collection.effectiveAt) > Date.parse(sampleSubject.collection.recordedAt)) {
      appendDependency(dependencyPatches, `sample:${sampleSubject.identity.id}@${sampleSubject.identity.version}`,
        { status: 'conflicting', reasons: ['Le prélèvement est enregistré avant son instant effectif.'] });
    }
  }

  if (!dependencyPatches.size) appendDependency(dependencyPatches, 'stateScope:unqualified', { status: 'unknown', reasons: ['Aucune dépendance ou portée n’est attestée.'] });

  const dependencies = [...dependencyPatches.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, patches]) => dependencyFromRows(id, patches));
  const status = dependencies.some(row => row.status === 'conflicting') ? 'conflicting'
    : dependencies.some(row => row.status === 'partial') ? 'partial'
      : dependencies.some(row => row.status === 'unknown') ? (dependencies.some(row => row.status === 'available') ? 'partial' : 'unknown')
        : 'resolved';
  const subject = clone(input.subject);
  const withoutPhysicalReference = {
    format: BREWING_OBSERVED_STATE_VERSION,
    subject,
    asOf: input.asOf,
    knowledgeAsOf: input.knowledgeAsOf,
    knowledgeReference: clone(input.knowledgeReference),
    physicalStateReference: '',
    facts: clone(input.facts), contacts: clone(input.contacts), coverage: clone(input.coverage), sampleContinuity: clone(input.sampleContinuity),
    factDispositions, contactDispositions, coverageDispositions, contactStates, dependencies, status,
  };
  const physicalStateReference = hopAdviceContentReference('brewing-physical-state-v1', physicalStateContent(withoutPhysicalReference as BrewingObservedStateV1));
  const withoutResolutionReference = { ...withoutPhysicalReference, physicalStateReference };
  const resolutionReference = brewingObservedStateResolutionReference(withoutResolutionReference as BrewingObservedStateV1);
  return { ...withoutResolutionReference, resolutionReference } as BrewingObservedStateV1;
}

export function assertBrewingObservedStateInput(value: unknown): asserts value is BrewingObservedStateInputV1 { assertInput(value); }

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(text);
}

function assertStateDependency(value: unknown): asserts value is BrewingObservedStateDependencyV1 {
  if (!object(value) || !text(value.id) || !['available', 'partial', 'unknown', 'conflicting'].includes(value.status)
    || !stringArray(value.valueReferences) || !stringArray(value.factReferences) || !stringArray(value.contactReferences)
    || !stringArray(value.coverageReferences) || !stringArray(value.reasons)) invalid('Dépendance de snapshot invalide.');
  onlyKeys(value, ['id', 'status', 'valueReferences', 'factReferences', 'contactReferences', 'coverageReferences', 'reasons'], 'Dépendance de snapshot');
}

function assertFactDisposition(value: unknown, facts: readonly BrewingObservedFactV1[]): asserts value is BrewingObservedFactDispositionV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1 || !text(value.reference)
    || !['effective', 'afterCutoff', 'notYetKnown', 'superseded', 'assumed', 'conflicting', 'atCutoff', 'otherSubject'].includes(value.disposition)
    || value.reason !== undefined && !text(value.reason)) invalid('Disposition de fait invalide.');
  onlyKeys(value, ['id', 'version', 'reference', 'disposition', 'reason'], 'Disposition de fait');
  const source = findFactSource(facts, value.reference);
  if (!source || source.id !== value.id || source.version !== value.version) invalid('Disposition de fait sans snapshot source exact.');
}

function assertContactDisposition(value: unknown, contacts: readonly BrewingObservedContactV1[]): asserts value is BrewingObservedContactDispositionV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1 || !text(value.reference)
    || !['effective', 'afterCutoff', 'atCutoff', 'notYetKnown', 'superseded', 'assumed', 'conflicting', 'otherSubject'].includes(value.disposition)
    || value.reason !== undefined && !text(value.reason)) invalid('Disposition de contact invalide.');
  onlyKeys(value, ['id', 'version', 'reference', 'disposition', 'reason'], 'Disposition de contact');
  const source = findContactSource(contacts, value.reference);
  if (!source || source.id !== value.id || source.version !== value.version) invalid('Disposition de contact sans snapshot source exact.');
}

function assertCoverageDisposition(value: unknown, coverage: readonly BrewingObservedCoverageV1[]): asserts value is BrewingObservedCoverageDispositionV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1 || !text(value.reference)
    || !text(value.dependencyId) || !['applies', 'outsideScope', 'notYetKnown', 'superseded', 'conflicting', 'otherSubject'].includes(value.disposition)
    || value.reason !== undefined && !text(value.reason)) invalid('Disposition de complétude invalide.');
  onlyKeys(value, ['id', 'version', 'reference', 'dependencyId', 'disposition', 'reason'], 'Disposition de complétude');
  const source = coverage.find(row => row.id === value.id && row.version === value.version && coverageReference(row) === value.reference);
  if (!source || coverageReference(source) !== value.reference || source.dependencyId !== value.dependencyId) invalid('Disposition de complétude sans snapshot source exact.');
}

function assertContactResolution(value: unknown, state: BrewingObservedStateV1): asserts value is BrewingObservedContactResolutionV1 {
  if (!object(value) || !text(value.id) || !Number.isSafeInteger(value.version) || value.version < 1 || !text(value.reference)
    || !text(value.physicalValueReference) || !isoDate(value.startedAt) || !text(value.dependencyId)
    || !['active', 'ended', 'notStarted', 'continuityUnknown', 'conflicting'].includes(value.status)
    || value.elapsedSeconds !== undefined && (!finite(value.elapsedSeconds) || value.elapsedSeconds < 0)
    || value.lowerBoundSeconds !== undefined && (!finite(value.lowerBoundSeconds) || value.lowerBoundSeconds < 0)
    || !stringArray(value.evidenceReferences) || value.reason !== undefined && !text(value.reason)) invalid('Résolution de contact invalide.');
  onlyKeys(value, ['id', 'version', 'reference', 'physicalValueReference', 'startedAt', 'dependencyId', 'material', 'lot', 'status', 'elapsedSeconds', 'lowerBoundSeconds', 'evidenceReferences', 'reason'], 'Résolution de contact');
  assertKnownReference(value.material); assertKnownReference(value.lot);
  if (value.elapsedSeconds !== undefined && value.lowerBoundSeconds !== undefined) invalid('Un contact ne porte pas simultanément durée exacte et borne basse.');
  if ((value.status === 'active' || value.status === 'ended') !== (value.elapsedSeconds !== undefined)) invalid('Durée exacte incohérente avec le statut du contact.');
  if (value.status !== 'continuityUnknown' && value.lowerBoundSeconds !== undefined) invalid('Borne basse hors statut continuityUnknown.');
  const source = brewingObservedContactSource(state, value.reference);
  if (!source || source.id !== value.id || source.version !== value.version || source.started.effectiveAt !== value.startedAt || source.dependencyId !== value.dependencyId) invalid('Résolution de contact sans source exacte.');
  if (contactPhysicalValueReference(source, value.status, value.elapsedSeconds, value.lowerBoundSeconds) !== value.physicalValueReference) invalid('Empreinte de valeur physique du contact incorrecte.');
}

export function assertBrewingObservedState(value: unknown): asserts value is BrewingObservedStateV1 {
  if (!object(value) || value.format !== BREWING_OBSERVED_STATE_VERSION || !isoDate(value.asOf) || !isoDate(value.knowledgeAsOf)
    || !text(value.physicalStateReference) || !text(value.resolutionReference) || !['resolved', 'partial', 'unknown', 'conflicting'].includes(value.status)
    || !Array.isArray(value.facts) || !Array.isArray(value.contacts) || !Array.isArray(value.coverage) || !Array.isArray(value.sampleContinuity)
    || !Array.isArray(value.factDispositions) || !Array.isArray(value.contactDispositions) || !Array.isArray(value.coverageDispositions)
    || !Array.isArray(value.contactStates) || !Array.isArray(value.dependencies)) invalid('Snapshot d’état réalisé mal formé.');
  onlyKeys(value, ['format', 'subject', 'asOf', 'knowledgeAsOf', 'knowledgeReference', 'physicalStateReference', 'resolutionReference',
    'facts', 'contacts', 'coverage', 'sampleContinuity', 'factDispositions', 'contactDispositions', 'coverageDispositions', 'contactStates', 'dependencies', 'status'], 'Snapshot d’état réalisé');
  assertSubject(value.subject); assertIdentity(value.knowledgeReference);
  value.facts.forEach(assertFact); value.contacts.forEach(assertContact); value.coverage.forEach(assertCoverage); value.sampleContinuity.forEach(assertSampleContinuity);
  if (value.subject.kind === 'sample' && Date.parse(value.asOf) !== Date.parse(value.subject.collection.effectiveAt)) invalid('Instant physique du snapshot sample incohérent avec le prélèvement.');
  if (value.subject.kind === 'beer' && value.sampleContinuity.length) invalid('Preuve de continuité reçue sans sujet sample.');
  if (value.subject.kind === 'sample') {
    const sampleIdentity = value.subject.identity;
    if (value.sampleContinuity.some((row: BrewingObservedSampleContinuityV1) => referenceKey(row.sampleReference) !== referenceKey(sampleIdentity))) invalid('Preuve de continuité liée à un autre sujet sample.');
  }
  if (value.factDispositions.length !== value.facts.length || value.contactDispositions.length !== value.contacts.length
    || value.coverageDispositions.length !== value.coverage.length) invalid('Le snapshot ne conserve pas la disposition de chaque source.');
  value.factDispositions.forEach((row: unknown) => assertFactDisposition(row, value.facts));
  value.contactDispositions.forEach((row: unknown) => assertContactDisposition(row, value.contacts));
  value.coverageDispositions.forEach((row: unknown) => assertCoverageDisposition(row, value.coverage));
  value.contactStates.forEach((row: unknown) => assertContactResolution(row, value as BrewingObservedStateV1));
  value.dependencies.forEach(assertStateDependency);
  const knownFactReferences = new Set(value.facts.map((row: BrewingObservedFactV1) => factReference(row)));
  const knownContactReferences = new Set(value.contacts.map((row: BrewingObservedContactV1) => contactReference(row)));
  const knownCoverageReferences = new Set([...value.coverage.map((row: BrewingObservedCoverageV1) => coverageReference(row)), ...value.sampleContinuity.map((row: BrewingObservedSampleContinuityV1) => sampleContinuityReference(row))]);
  for (const dependency of value.dependencies as BrewingObservedStateDependencyV1[]) {
    if (dependency.factReferences.some(reference => !knownFactReferences.has(reference))
      || dependency.contactReferences.some(reference => !knownContactReferences.has(reference))
      || dependency.coverageReferences.some(reference => !knownCoverageReferences.has(reference))) invalid('Dépendance de snapshot sans fait/contact/source de portée conservé.');
  }
  const expectedStateStatus = value.dependencies.some((row: BrewingObservedStateDependencyV1) => row.status === 'conflicting') ? 'conflicting'
    : value.dependencies.some((row: BrewingObservedStateDependencyV1) => row.status === 'partial') ? 'partial'
      : value.dependencies.some((row: BrewingObservedStateDependencyV1) => row.status === 'unknown')
        ? (value.dependencies.some((row: BrewingObservedStateDependencyV1) => row.status === 'available') ? 'partial' : 'unknown') : 'resolved';
  if (value.status !== expectedStateStatus) invalid('Statut global incohérent avec les dépendances conservées.');
  // Shape and stored hashes are checked without re-resolving facts or consulting the current clock.
  const { resolutionReference, ...content } = value;
  if (hopAdviceContentReference('brewing-physical-state-v1', physicalStateContent(value as BrewingObservedStateV1)) !== value.physicalStateReference) invalid('Identité du snapshot physique incorrecte.');
  if (brewingObservedStateResolutionReference(content as BrewingObservedStateV1) !== resolutionReference) invalid('Empreinte du snapshot d’état réalisé incorrecte.');
}

export function assessBrewingObservedStateApplicability(input: BrewingObservedStateApplicabilityInputV1): BrewingObservedStateApplicabilityV1 {
  assertBrewingObservedState(input.anchor.state);
  if (input.evaluationState) assertBrewingObservedState(input.evaluationState);
  if (!['describeCurrent', 'projectFuture', 'comparePrediction'].includes(input.use) || !isoDate(input.anchor.observedAt)
    || !Array.isArray(input.requiredDependencyIds) || input.requiredDependencyIds.some(id => !text(id))) invalid('Demande d’applicabilité d’état mal formée.');
  assertIdentity(input.anchor.observationReference);
  if (!object(input.anchor.dimension)) invalid('Dimension d’applicabilité absente.');
  if (input.anchor.dimension.status === 'resolved') {
    onlyKeys(input.anchor.dimension, ['status', 'id', 'version'], 'Dimension d’ancre');
    if (!text(input.anchor.dimension.id) || !text(input.anchor.dimension.version)) invalid('Identité de dimension d’ancre invalide.');
  } else if (input.anchor.dimension.status === 'unresolved') {
    onlyKeys(input.anchor.dimension, ['status', 'label'], 'Dimension non résolue d’ancre');
    if (!text(input.anchor.dimension.label)) invalid('Libellé de dimension non résolue absent.');
  } else invalid('Statut de dimension inconnu.');
  if (new Set(input.requiredDependencyIds).size !== input.requiredDependencyIds.length) invalid('Dépendance requise répétée.');

  const anchorState = input.anchor.state;
  const evaluationState = input.evaluationState;
  const reasons: string[] = [];
  const dependencies: BrewingObservedDependencyComparisonV1[] = [];
  let status: BrewingObservedStateApplicabilityV1['status'] = 'applicable';
  const evaluationRequired = input.use !== 'projectFuture';
  if (evaluationRequired && !evaluationState) {
    status = 'unknown'; reasons.push('L’usage demande un état d’évaluation explicite.');
  }

  if (anchorState.subject.kind === 'sample') {
    const sampledAt = anchorState.subject.collection.effectiveAt;
    if (Date.parse(input.anchor.observedAt) < Date.parse(sampledAt)) {
      status = 'conflicting'; reasons.push('La dégustation précède le prélèvement de son sujet.');
    } else if (Date.parse(input.anchor.observedAt) > Date.parse(sampledAt)) {
      const sampleStatus = sampleContinuityAt(anchorState, input.anchor.observedAt);
      if (sampleStatus === 'unknown') {
        status = 'continuityUnknown'; reasons.push('La dégustation est postérieure au prélèvement, sans continuité du sample attestée jusque-là.');
      } else if (sampleStatus === 'changed') {
        status = 'historical'; reasons.push('Le sample a changé après prélèvement.');
      } else if (sampleStatus === 'conflicting') {
        status = 'conflicting'; reasons.push('Les attestations de continuité du sample se contredisent.');
      }
    }
  }

  if (evaluationState && input.use !== 'projectFuture') {
    const subjectMatch = sameSubjectAtRelevantTime(anchorState, evaluationState);
    if (!subjectMatch.compatible) {
      status = subjectMatch.status;
      if (subjectMatch.reason) reasons.push(subjectMatch.reason);
    } else if (subjectMatch.sampleContinuity === 'unknown') {
      status = 'continuityUnknown';
      reasons.push('L’intervalle entre prélèvement et dégustation n’est pas couvert par une continuité attestée.');
    } else if (subjectMatch.sampleContinuity === 'changed') {
      status = 'historical';
      reasons.push('Le sample a changé après prélèvement et ne décrit plus l’état prélevé.');
    }
  }

  const subjectHistorical = status === 'historical';
  const sameObservationPoint = input.use === 'describeCurrent' && !!evaluationState
    && anchorState.physicalStateReference === evaluationState.physicalStateReference
    && Date.parse(input.anchor.observedAt) === Date.parse(evaluationState.asOf);
  if (evaluationState && input.use !== 'projectFuture' && !sameObservationPoint
    && !['differentSubject', 'conflicting'].includes(status)
    && evaluationState.contactStates.some(contact => input.requiredDependencyIds.includes(contact.dependencyId) && contact.status === 'continuityUnknown')) {
    status = 'continuityUnknown';
    reasons.push('Le temps a avancé sans continuité qualifiée pour un contact pertinent ; la date cible ne fournit pas ce fait.');
  }

  for (const id of input.requiredDependencyIds) {
    const anchorDependency = anchorState.dependencies.find(row => row.id === id) ?? null;
    const evaluationDependency = evaluationState?.dependencies.find(row => row.id === id) ?? null;
    let dependencyStatus: BrewingObservedDependencyComparisonV1['status'];
    let dependencyReasons: string[] = [];
    if (input.use === 'projectFuture') {
      dependencyStatus = anchorDependency ? dependencyFromAnchor(anchorDependency) : 'unknown';
      if (!anchorDependency) dependencyReasons.push('Dépendance absente de l’état d’ancrage.');
      else dependencyReasons.push(...anchorDependency.reasons);
    } else if (!evaluationState) {
      dependencyStatus = 'unknown'; dependencyReasons.push('État d’évaluation absent.');
    } else if (!anchorDependency || !evaluationDependency) {
      dependencyStatus = 'unknown'; dependencyReasons.push('La dépendance manque d’un côté de la comparaison.');
    } else {
      dependencyStatus = compareDependency(anchorDependency, evaluationDependency);
      if (['partial', 'unknown'].includes(dependencyStatus)
        && hasDocumentedPhysicalAdvance(anchorState, evaluationState, id, input.anchor.observedAt)) dependencyStatus = 'changed';
      if (dependencyStatus === 'changed') dependencyReasons.push('Les faits réalisés pertinents pour cette dépendance ont changé.');
      else if (dependencyStatus === 'unknown') dependencyReasons.push('La continuité de cette dépendance n’est pas établie.');
      else if (dependencyStatus === 'partial') dependencyReasons.push('La dépendance n’est que partiellement connue.');
      else if (dependencyStatus === 'conflicting') dependencyReasons.push('Les faits de cette dépendance sont contradictoires.');
    }
    dependencies.push({ id, status: dependencyStatus, anchor: clone(anchorDependency), evaluation: clone(evaluationDependency), reasons: [...new Set(dependencyReasons)] });
    if (dependencyStatus === 'conflicting' && status !== 'differentSubject') status = 'conflicting';
    else if (dependencyStatus === 'unknown' && ['applicable', 'historical'].includes(status)) status = 'unknown';
    else if (dependencyStatus === 'partial' && ['applicable', 'historical'].includes(status)) status = 'partial';
    else if (dependencyStatus === 'changed' && status === 'applicable') status = 'historical';
  }

  if ((subjectHistorical || dependencies.some(row => row.status === 'changed'))
    && !['differentSubject', 'conflicting', 'continuityUnknown'].includes(status)) status = 'historical';
  if (sameObservationPoint && ['applicable', 'partial', 'unknown'].includes(status)) {
    status = 'applicable';
    reasons.push('Observation présentée à son propre état et instant : les inconnues sur ses causes ne deviennent pas des faits et restent requises séparément pour un calcul.');
  }

  return {
    format: BREWING_OBSERVED_APPLICABILITY_VERSION,
    use: input.use,
    observationReference: clone(input.anchor.observationReference),
    observedAt: input.anchor.observedAt,
    dimension: clone(input.anchor.dimension),
    anchorStateReference: anchorState.physicalStateReference,
    evaluationStateReference: input.use === 'projectFuture' ? null : evaluationState?.physicalStateReference ?? null,
    status, dependencies, reasons: [...new Set(reasons)],
  };
}

function hasDocumentedPhysicalAdvance(anchor: BrewingObservedStateV1, evaluation: BrewingObservedStateV1,
  dependencyId: string, observedAt: string): boolean {
  if (Date.parse(evaluation.asOf) <= Date.parse(observedAt)) return false;
  for (const current of evaluation.contactStates.filter(row => row.dependencyId === dependencyId)) {
    const currentSource = brewingObservedContactSource(evaluation, current.reference);
    const prior = currentSource && anchor.contactStates.find(row => {
      if (row.dependencyId !== dependencyId) return false;
      const priorSource = brewingObservedContactSource(anchor, row.reference);
      return priorSource?.id === currentSource.id
        && referenceKey(priorSource.subjectReference) === referenceKey(currentSource.subjectReference);
    });
    if (prior && finite(prior.elapsedSeconds) && finite(current.elapsedSeconds) && current.elapsedSeconds !== prior.elapsedSeconds) return true;
  }
  const knownBefore = new Set(anchor.factDispositions.filter(row => row.disposition === 'effective')
    .map(row => brewingObservedFactSource(anchor, row.reference)).filter((fact): fact is BrewingObservedFactV1 => !!fact)
    .map(fact => `${referenceKey(fact.subjectReference)}\u0000${fact.id}`));
  return evaluation.factDispositions.some(row => {
    if (row.disposition !== 'effective') return false;
    const fact = brewingObservedFactSource(evaluation, row.reference);
    return !!fact && !knownBefore.has(`${referenceKey(fact.subjectReference)}\u0000${fact.id}`)
      && fact.dependencyId === dependencyId && Date.parse(fact.effectiveAt) > Date.parse(observedAt);
  });
}

function dependencyFromAnchor(dependency: BrewingObservedStateDependencyV1): BrewingObservedDependencyComparisonV1['status'] {
  switch (dependency.status) {
    case 'available': return 'same';
    case 'partial': return 'partial';
    case 'unknown': return 'unknown';
    case 'conflicting': return 'conflicting';
  }
}

function compareDependency(anchor: BrewingObservedStateDependencyV1, evaluation: BrewingObservedStateDependencyV1): BrewingObservedDependencyComparisonV1['status'] {
  if (anchor.status === 'conflicting' || evaluation.status === 'conflicting') return 'conflicting';
  if (anchor.status === 'unknown' || evaluation.status === 'unknown') return 'unknown';
  if (anchor.status === 'partial' || evaluation.status === 'partial') return 'partial';
  if (!sameJson(anchor.valueReferences, evaluation.valueReferences)) {
    return anchor.valueReferences.length || evaluation.valueReferences.length ? 'changed' : 'partial';
  }
  return 'same';
}

function sameSubjectAtRelevantTime(anchor: BrewingObservedStateV1, evaluation: BrewingObservedStateV1): {
  compatible: boolean; status: BrewingObservedStateApplicabilityV1['status']; reason?: string; sampleContinuity?: 'preserved'|'changed'|'unknown'|'conflicting';
} {
  const anchorSubject = anchor.subject, evaluationSubject = evaluation.subject;
  if (referenceKey(anchorSubject.identity) === referenceKey(evaluationSubject.identity) && anchorSubject.kind === evaluationSubject.kind) {
    if (anchorSubject.kind === 'sample') {
      const state = sampleContinuityAt(anchor, evaluation.asOf);
      if (state === 'unknown') return { compatible: true, status: 'continuityUnknown', sampleContinuity: state };
      if (state === 'changed') return { compatible: true, status: 'historical', sampleContinuity: state };
      if (state === 'conflicting') return { compatible: false, status: 'conflicting', reason: 'Continuité du sample contradictoire.', sampleContinuity: state };
    }
    return { compatible: true, status: 'applicable', sampleContinuity: anchorSubject.kind === 'sample' ? 'preserved' : undefined };
  }
  if (anchorSubject.kind === 'sample') {
    const sample = anchorSubject;
    if (evaluationSubject.kind === 'beer' && sample.sourceBeer
      && referenceKey(sample.sourceBeer) === referenceKey(evaluationSubject.identity)) {
      return { compatible: true, status: 'applicable' };
    }
  }
  return { compatible: false, status: 'differentSubject', reason: 'Les sujets physiques ne sont pas reliés par une identité exacte.' };
}

function sampleContinuityAt(state: BrewingObservedStateV1, observedAt: string): 'preserved'|'changed'|'unknown'|'conflicting' {
  if (state.subject.kind !== 'sample') return 'preserved';
  const sample = state.subject;
  if (Date.parse(observedAt) <= Date.parse(sample.collection.effectiveAt)) return 'preserved';
  const groups = selectedVersions(state.sampleContinuity, state.knowledgeAsOf, directRecordedAt,
    row => `${referenceKey(row.sampleReference)}\u0000${row.id}`);
  const rows: BrewingObservedSampleContinuityV1[] = [];
  for (const [id, group] of groups) {
    const sourceRows = state.sampleContinuity.filter(row => `${referenceKey(row.sampleReference)}\u0000${row.id}` === id
      && referenceKey(row.sampleReference) === referenceKey(sample.identity));
    if (!sourceRows.length) continue;
    if (group.conflicts.length) return 'conflicting';
    if (group.selected && referenceKey(group.selected.sampleReference) === referenceKey(sample.identity)) rows.push(group.selected);
  }
  if (!rows.length) return 'unknown';
  if (rows.some(row => Date.parse(row.fromAt) !== Date.parse(sample.collection.effectiveAt) || Date.parse(row.fromAt) > Date.parse(row.throughAt)
    || Date.parse(row.throughAt) > Date.parse(row.recordedAt))) return 'conflicting';
  if (rows.some(row => row.status === 'conflicting' && Date.parse(row.fromAt) <= Date.parse(observedAt)
    && Date.parse(row.throughAt) >= Date.parse(sample.collection.effectiveAt))) return 'conflicting';
  const changed = rows.filter(row => row.status === 'changed' && Date.parse(row.fromAt) <= Date.parse(sample.collection.effectiveAt)
    && Date.parse(row.throughAt) >= Date.parse(sample.collection.effectiveAt) && Date.parse(row.throughAt) <= Date.parse(observedAt));
  const preserved = rows.filter(row => row.status === 'preserved' && Date.parse(row.fromAt) <= Date.parse(sample.collection.effectiveAt)
    && Date.parse(row.throughAt) >= Date.parse(observedAt));
  const unknown = rows.some(row => row.status === 'unknown' && Date.parse(row.fromAt) <= Date.parse(observedAt)
    && Date.parse(row.throughAt) >= Date.parse(sample.collection.effectiveAt));
  if (changed.length && preserved.length) return 'conflicting';
  if (changed.length) return 'changed';
  if (preserved.length && !unknown) return 'preserved';
  return 'unknown';
}

function sameJson(a: unknown, b: unknown): boolean {
  return hopAdviceContentReference('brewing-observed-state-compare-v1', a) === hopAdviceContentReference('brewing-observed-state-compare-v1', b);
}

function physicalStateContent(state: Pick<BrewingObservedStateV1, 'subject' | 'asOf' | 'facts' | 'factDispositions' | 'contactStates' | 'contactDispositions'>) {
  const effectiveContacts = new Set(state.contactDispositions
    .filter(row => row.disposition === 'effective').map(row => row.reference));
  const effectiveFacts = state.factDispositions.filter(row => row.disposition === 'effective').map(disposition => {
    const source = findFactSource(state.facts, disposition.reference);
    if (!source || source.id !== disposition.id || source.version !== disposition.version) invalid('Fait effectif manquant lors de l’identité physique.');
    return factValueReference(source);
  });
  return {
    subject: physicalSubjectContent(state.subject),
    asOf: state.asOf,
    effectiveFactReferences: effectiveFacts.sort(),
    effectiveContactReferences: state.contactStates.filter(row => effectiveContacts.has(row.reference))
      .map(row => row.physicalValueReference).sort(),
  };
}

