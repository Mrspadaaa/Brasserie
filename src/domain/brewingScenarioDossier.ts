import {
  BREWING_SCENARIO_VERSION, assertBrewingScenarioResult,
  brewingScenarioInputReference,
  type BrewingScenarioBranchResult, type BrewingScenarioRequest, type BrewingScenarioResult,
} from './brewingScenario';
import { hopSourceError, validHopRange, type HopRange, type HopSource } from '../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export const BREWING_SCENARIO_DOSSIER_FORMAT_VERSION = 1 as const;
export const BREWING_SCENARIO_EVENT_FORMAT_VERSION = 1 as const;

export type BrewingScenarioState = 'resultSaved' | 'resultRevised' | 'branchPreferred' | 'observationAppended';

export interface BrewingScenarioDossierV1 {
  readonly formatVersion: 1;
  readonly ownerKey: string;
  readonly scenarioId: string;
  /** Local append-only ledger revision; distinct from result.revision. */
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastEventId: string;
  readonly state: BrewingScenarioState;
  /** Points to an immutable full BrewingScenarioResult stored in a result event. */
  readonly currentSnapshotReference: string;
  readonly currentResultRevision: number;
  /** A preference is a branch choice only. It never means a recipe was applied. */
  readonly preferredBranch?: BrewingScenarioBranchPreference;
  readonly reference: string;
}

export interface BrewingScenarioBranchPreference {
  preferenceId: string;
  snapshotReference: string;
  resultReference: string;
  branchId: string;
  branchReference: string;
  interpretation?: string;
  reason: string;
}

export type BrewingScenarioObservation =
  | {
      kind: 'qualitative';
      dimension: string;
      reported: string;
      context?: string;
      method?: string;
      source?: HopSource;
    }
  | {
      kind: 'measurement';
      dimension: string;
      analyte: string;
      value: number | HopRange;
      unit: string;
      basis: string;
      method: string;
      context?: string;
      source?: HopSource;
    };

export interface BrewingScenarioSnapshotV1 {
  formatVersion: 1;
  reference: string;
  /** Includes the exact request, all result branches and resolved dependency snapshots. */
  result: BrewingScenarioResult;
}

export type BrewingScenarioEventPayloadV1 = {
  resultSaved: { snapshot: BrewingScenarioSnapshotV1 };
  resultRevised: { snapshot: BrewingScenarioSnapshotV1; previousSnapshotReference: string; reason: string };
  branchPreferred: BrewingScenarioBranchPreference;
  observationAppended: {
    observationId: string;
    snapshotReference: string;
    resultReference: string;
    branchId?: string;
    observedAt: string;
    observation: BrewingScenarioObservation;
  };
};

export type BrewingScenarioEventKind = keyof BrewingScenarioEventPayloadV1;
type BrewingScenarioEventFor<K extends BrewingScenarioEventKind> = {
  readonly eventFormatVersion: 1;
  readonly ownerKey: string;
  readonly scenarioId: string;
  readonly eventId: string;
  readonly expectedRevision: number;
  readonly resultingRevision: number;
  readonly recordedAt: string;
  readonly kind: K;
  readonly payload: BrewingScenarioEventPayloadV1[K];
  readonly contentReference: string;
};

export type BrewingScenarioEventV1 = {
  [K in BrewingScenarioEventKind]: BrewingScenarioEventFor<K>
}[BrewingScenarioEventKind];

export type BrewingScenarioEventCommand<K extends BrewingScenarioEventKind = BrewingScenarioEventKind> = {
  [P in K]: Omit<BrewingScenarioEventFor<P>, 'eventFormatVersion' | 'resultingRevision' | 'contentReference'>;
}[K];

export interface CreateBrewingScenarioDossierInput {
  ownerKey: string;
  scenarioId: string;
  eventId: string;
  recordedAt: string;
  result: BrewingScenarioResult;
}

export interface CreatedBrewingScenarioDossier {
  dossier: BrewingScenarioDossierV1;
  event: BrewingScenarioEventV1;
}

export interface BrewingScenarioRecordRead {
  dossier: BrewingScenarioDossierV1;
  currentSnapshot: BrewingScenarioSnapshotV1;
  /** All full results remain available in immutable resultSaved/resultRevised events. */
  snapshots: BrewingScenarioSnapshotV1[];
  events: BrewingScenarioEventV1[];
}

export interface BrewingScenarioUnsupportedDossier {
  readonly status: 'unsupportedFormat';
  readonly reason: 'dossierFormat' | 'resultVersion' | 'history';
  readonly ownerKey?: string;
  readonly scenarioId?: string;
  readonly formatVersion?: number;
  readonly engineVersion?: string;
  readonly raw: unknown;
}

export interface BrewingScenarioUnsupportedEvent {
  readonly status: 'unsupportedEventFormat';
  readonly reason: 'eventFormat' | 'resultVersion';
  readonly ownerKey?: string;
  readonly scenarioId?: string;
  readonly eventId?: string;
  readonly eventFormatVersion?: number;
  readonly raw: unknown;
}

export type BrewingScenarioDossierRead = BrewingScenarioDossierV1 | BrewingScenarioUnsupportedDossier;
export type BrewingScenarioEventRead = BrewingScenarioEventV1 | BrewingScenarioUnsupportedEvent;
export type BrewingScenarioRecordResult = BrewingScenarioRecordRead | BrewingScenarioUnsupportedDossier;

export class BrewingScenarioDossierError extends Error {
  constructor(readonly code: 'invalidInput' | 'unsupportedFormat' | 'staleRevision' | 'eventIdConflict' |
    'scenarioIdConflict' | 'invalidTransition' | 'sizeLimit', message: string) {
    super(message);
    this.name = 'BrewingScenarioDossierError';
  }
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clone = <T>(value: T): T => structuredClone(value);
function invalid(message: string): never { throw new BrewingScenarioDossierError('invalidInput', message); }
function onlyKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid(`${label} contient un champ non pris en charge.`);
}
function isoDate(value: unknown): value is string {
  return text(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function snapshotFor(result: BrewingScenarioResult): BrewingScenarioSnapshotV1 {
  try {
    // The result validator checks the request's archived structure and hashes.
    // A historical snapshot must not be judged by newer generation-only rules.
    assertBrewingScenarioResult(result);
  } catch (error) {
    invalid(error instanceof Error ? error.message : 'Résultat de scénario invalide.');
  }
  if (!text(result.scenarioId) || result.requestSnapshot.scenarioId !== result.scenarioId
    || result.requestSnapshot.revision !== result.revision
    || result.inputReference !== brewingScenarioInputReference(result.requestSnapshot)
    || !text(result.reference) || result.reference.length > 256) {
    invalid('Le snapshot de résultat ne correspond pas à sa requête, son identifiant ou sa référence.');
  }
  return { formatVersion: 1, reference: result.reference, result: clone(result) };
}

export function brewingScenarioSnapshotReference(snapshot: BrewingScenarioSnapshotV1): string {
  return snapshot.reference;
}

export function brewingScenarioDossierReference(dossier: Omit<BrewingScenarioDossierV1, 'reference'> | BrewingScenarioDossierV1): string {
  const { reference: _reference, ...content } = dossier as BrewingScenarioDossierV1;
  return hopAdviceContentReference('brewing-scenario-dossier-v1', content);
}

export function brewingScenarioEventContentReference(event: Omit<BrewingScenarioEventV1, 'contentReference'> | BrewingScenarioEventV1): string {
  const { contentReference: _reference, ...content } = event as BrewingScenarioEventV1;
  return hopAdviceContentReference('brewing-scenario-event-v1', content);
}

export function createBrewingScenarioEvent<K extends BrewingScenarioEventKind>(
  command: BrewingScenarioEventCommand<K>,
): BrewingScenarioEventFor<K> {
  if (!object(command) || !text(command.ownerKey) || command.ownerKey.trim() !== command.ownerKey
    || !text(command.scenarioId) || !text(command.eventId) || !isoDate(command.recordedAt)
    || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0
    || command.expectedRevision >= Number.MAX_SAFE_INTEGER || !object(command.payload)) invalid('Commande d’événement de scénario incomplète.');
  const event = { ...clone(command), eventFormatVersion: 1 as const, resultingRevision: command.expectedRevision + 1 } as BrewingScenarioEventFor<K>;
  validateEventShape(event as BrewingScenarioEventV1);
  const typed = event as BrewingScenarioEventV1;
  return { ...event, contentReference: brewingScenarioEventContentReference(typed) } as BrewingScenarioEventFor<K>;
}

function validateObservation(observation: unknown): asserts observation is BrewingScenarioObservation {
  if (!object(observation) || !text(observation.dimension)) invalid('Observation de scénario invalide.');
  if (observation.kind === 'qualitative') {
    onlyKeys(observation, ['kind', 'dimension', 'reported', 'context', 'method', 'source'], 'Observation qualitative');
    if (!text(observation.reported) || observation.context !== undefined && typeof observation.context !== 'string'
      || observation.method !== undefined && typeof observation.method !== 'string'
      || observation.source !== undefined && hopSourceError(observation.source)) invalid('Observation qualitative incomplète.');
    return;
  }
  if (observation.kind === 'measurement') {
    onlyKeys(observation, ['kind', 'dimension', 'analyte', 'value', 'unit', 'basis', 'method', 'context', 'source'], 'Mesure observée');
    const valueValid = finite(observation.value) || validHopRange(observation.value)
      && Object.keys(observation.value).every(key => key === 'min' || key === 'max');
    if (!text(observation.analyte) || !valueValid || !text(observation.unit) || !text(observation.basis)
      || !text(observation.method) || observation.context !== undefined && typeof observation.context !== 'string'
      || observation.source !== undefined && hopSourceError(observation.source)) invalid('Mesure observée incomplète ou invalide.');
    return;
  }
  invalid('Type d’observation de scénario inconnu.');
}

function validateEventShape(event: BrewingScenarioEventV1): void {
  if (!object(event) || event.eventFormatVersion !== 1 || !text(event.ownerKey) || !text(event.scenarioId)
    || !text(event.eventId) || !isoDate(event.recordedAt) || !Number.isSafeInteger(event.expectedRevision)
    || event.expectedRevision < 0 || !Number.isSafeInteger(event.resultingRevision)
    || event.resultingRevision !== event.expectedRevision + 1 || !object(event.payload)) invalid('Événement de scénario mal formé.');
  onlyKeys(event, ['eventFormatVersion', 'ownerKey', 'scenarioId', 'eventId', 'expectedRevision', 'resultingRevision', 'recordedAt', 'kind', 'payload', 'contentReference'], 'Événement de scénario');
  const payload = event.payload as Record<string, any>;
  switch (event.kind) {
    case 'resultSaved':
      onlyKeys(payload, ['snapshot'], 'Événement resultSaved');
      if (event.expectedRevision !== 0 || !object(payload.snapshot) || payload.snapshot.formatVersion !== 1) invalid('Événement resultSaved invalide.');
      assertSnapshot(payload.snapshot);
      if (payload.snapshot.result.scenarioId !== event.scenarioId) invalid('Le snapshot initial ne correspond pas à la lignée de scénario.');
      return;
    case 'resultRevised':
      onlyKeys(payload, ['snapshot', 'previousSnapshotReference', 'reason'], 'Événement resultRevised');
      if (!text(payload.previousSnapshotReference) || !text(payload.reason) || !object(payload.snapshot) || payload.snapshot.formatVersion !== 1) invalid('Événement resultRevised invalide.');
      assertSnapshot(payload.snapshot);
      return;
    case 'branchPreferred':
      onlyKeys(payload, ['preferenceId', 'snapshotReference', 'resultReference', 'branchId', 'branchReference', 'interpretation', 'reason'], 'Événement branchPreferred');
      if (!text(payload.preferenceId) || !text(payload.snapshotReference) || !text(payload.resultReference)
        || !text(payload.branchId) || !text(payload.branchReference) || !text(payload.reason)
        || payload.interpretation !== undefined && typeof payload.interpretation !== 'string') invalid('Préférence de branche invalide.');
      return;
    case 'observationAppended':
      onlyKeys(payload, ['observationId', 'snapshotReference', 'resultReference', 'branchId', 'observedAt', 'observation'], 'Événement observationAppended');
      if (!text(payload.observationId) || !text(payload.snapshotReference) || !text(payload.resultReference)
        || payload.branchId !== undefined && !text(payload.branchId) || !isoDate(payload.observedAt)) invalid('Événement observationAppended invalide.');
      validateObservation(payload.observation);
      return;
    default:
      invalid('Nature d’événement de scénario inconnue.');
  }
}

function assertEventContentReference(event: BrewingScenarioEventV1): void {
  if (!text(event.contentReference) || event.contentReference !== brewingScenarioEventContentReference(event)) invalid('Référence de contenu événement invalide.');
}

function assertSnapshot(value: unknown): asserts value is BrewingScenarioSnapshotV1 {
  if (!object(value) || value.formatVersion !== 1 || !text(value.reference) || !object(value.result)) invalid('Snapshot de scénario absent.');
  onlyKeys(value, ['formatVersion', 'reference', 'result'], 'Snapshot de scénario');
  const snapshot = value as unknown as BrewingScenarioSnapshotV1;
  const checked = snapshotFor(snapshot.result);
  if (snapshot.reference !== checked.reference || snapshot.result.reference !== snapshot.reference) invalid('Référence de snapshot incohérente.');
}

function initialDossier(ownerKey: string, scenarioId: string, event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' }>): BrewingScenarioDossierV1 {
  const snapshot = event.payload.snapshot;
  const draft = {
    formatVersion: 1 as const, ownerKey, scenarioId, revision: 1, createdAt: event.recordedAt, updatedAt: event.recordedAt,
    lastEventId: event.eventId, state: 'resultSaved' as const, currentSnapshotReference: snapshot.reference,
    currentResultRevision: snapshot.result.revision,
  };
  return { ...draft, reference: brewingScenarioDossierReference(draft) };
}

function assertDossierProjection(value: unknown): asserts value is BrewingScenarioDossierV1 {
  if (!object(value) || value.formatVersion !== 1 || !text(value.ownerKey) || value.ownerKey.trim() !== value.ownerKey
    || !text(value.scenarioId) || !Number.isSafeInteger(value.revision) || value.revision < 1
    || !isoDate(value.createdAt) || !isoDate(value.updatedAt) || !text(value.lastEventId)
    || !['resultSaved', 'resultRevised', 'branchPreferred', 'observationAppended'].includes(value.state)
    || !text(value.currentSnapshotReference) || !Number.isSafeInteger(value.currentResultRevision) || value.currentResultRevision < 0
    || !text(value.reference)) invalid('Projection de dossier scénario mal formée.');
  onlyKeys(value, ['formatVersion', 'ownerKey', 'scenarioId', 'revision', 'createdAt', 'updatedAt', 'lastEventId', 'state',
    'currentSnapshotReference', 'currentResultRevision', 'preferredBranch', 'reference'], 'Projection de dossier scénario');
  if (value.preferredBranch !== undefined) assertBranchPreference(value.preferredBranch);
  const { reference: _reference, ...draft } = value as BrewingScenarioDossierV1;
  if (value.reference !== brewingScenarioDossierReference(draft)) invalid('Référence de projection de dossier invalide.');
}

function assertBranchPreference(value: unknown): asserts value is BrewingScenarioBranchPreference {
  if (!object(value)) invalid('Préférence de branche mal formée.');
  onlyKeys(value, ['preferenceId', 'snapshotReference', 'resultReference', 'branchId', 'branchReference', 'interpretation', 'reason'], 'Préférence de branche');
  if (!text(value.preferenceId) || !text(value.snapshotReference) || !text(value.resultReference) || !text(value.branchId)
    || !text(value.branchReference) || !text(value.reason)
    || value.interpretation !== undefined && typeof value.interpretation !== 'string') invalid('Préférence de branche mal formée.');
}

function resultSnapshots(events: readonly BrewingScenarioEventV1[]): BrewingScenarioSnapshotV1[] {
  return events.flatMap(event => event.kind === 'resultSaved' || event.kind === 'resultRevised' ? [event.payload.snapshot] : []);
}

function findSnapshot(events: readonly BrewingScenarioEventV1[], reference: string): BrewingScenarioSnapshotV1 | undefined {
  return resultSnapshots(events).find(snapshot => snapshot.reference === reference);
}

function findBranch(snapshot: BrewingScenarioSnapshotV1, branchId: string): BrewingScenarioBranchResult | undefined {
  if (snapshot.result.baseline.id === branchId) return snapshot.result.baseline;
  return snapshot.result.branches.find(branch => branch.id === branchId);
}

function assertPriorEventHistory(events: readonly BrewingScenarioEventV1[]): BrewingScenarioDossierV1 {
  if (!events.length || events[0].kind !== 'resultSaved' || events[0].expectedRevision !== 0) invalid('Historique scénario sans événement initial resultSaved.');
  const first = events[0] as Extract<BrewingScenarioEventV1, { kind: 'resultSaved' }>;
  validateEventShape(first);
  assertEventContentReference(first);
  let current = initialDossier(first.ownerKey, first.scenarioId, first);
  const seen = new Set<string>([first.eventId]);
  for (let index = 1; index < events.length; index++) {
    const event = events[index];
    validateEventShape(event);
    assertEventContentReference(event);
    if (event.ownerKey !== current.ownerKey || event.scenarioId !== current.scenarioId || seen.has(event.eventId)) invalid('Historique scénario mêlé ou événement dupliqué.');
    if (event.expectedRevision !== current.revision) throw new BrewingScenarioDossierError('staleRevision', 'Historique de scénario non contigu.');
    current = projectEvent(current, event, events.slice(0, index));
    seen.add(event.eventId);
  }
  return current;
}

function projectEvent(dossier: BrewingScenarioDossierV1, event: BrewingScenarioEventV1, previousEvents: readonly BrewingScenarioEventV1[]): BrewingScenarioDossierV1 {
  validateEventShape(event);
  if (event.ownerKey !== dossier.ownerKey || event.scenarioId !== dossier.scenarioId) invalid('Événement scenario/ownerKey incohérent.');
  if (event.expectedRevision !== dossier.revision) throw new BrewingScenarioDossierError('staleRevision', 'La révision du dossier scénario est périmée.');
  if (event.kind === 'resultSaved') invalid('resultSaved ne peut apparaître qu’en première position.');

  let currentSnapshotReference = dossier.currentSnapshotReference;
  let currentResultRevision = dossier.currentResultRevision;
  let preferredBranch = dossier.preferredBranch;

  if (event.kind === 'resultRevised') {
    const next = event.payload.snapshot;
    if (event.payload.previousSnapshotReference !== dossier.currentSnapshotReference) invalid('La révision ne référence pas le snapshot courant.');
    if (next.result.scenarioId !== dossier.scenarioId || next.result.revision <= dossier.currentResultRevision) invalid('La révision du moteur ne progresse pas dans la même lignée de scénario.');
    if (findSnapshot(previousEvents, next.reference)) invalid('Une référence de résultat déjà sauvegardée ne peut pas être réutilisée pour une nouvelle révision.');
    currentSnapshotReference = next.reference;
    currentResultRevision = next.result.revision;
  } else if (event.kind === 'branchPreferred') {
    if (previousEvents.some(prior => prior.kind === 'branchPreferred' && prior.payload.preferenceId === event.payload.preferenceId)) {
      invalid('Une préférence de branche déjà utilisée ne peut pas être recyclée sous un nouvel événement.');
    }
    const snapshot = findSnapshot(previousEvents, event.payload.snapshotReference);
    if (!snapshot || event.payload.resultReference !== snapshot.result.reference) invalid('La préférence ne référence pas un résultat conservé.');
    const branch = findBranch(snapshot, event.payload.branchId);
    if (!branch || branch.reference !== event.payload.branchReference) invalid('La préférence ne référence pas une branche exacte du résultat.');
    preferredBranch = { ...event.payload };
  } else if (event.kind === 'observationAppended') {
    if (previousEvents.some(prior => prior.kind === 'observationAppended' && prior.payload.observationId === event.payload.observationId)) {
      invalid('Une identité d’observation déjà utilisée ne peut pas être recyclée sous un nouvel événement.');
    }
    const snapshot = findSnapshot(previousEvents, event.payload.snapshotReference);
    if (!snapshot || snapshot.result.reference !== event.payload.resultReference) invalid('L’observation ne référence pas un snapshot conservé.');
    if (event.payload.branchId && !findBranch(snapshot, event.payload.branchId)) invalid('L’observation référence une branche absente.');
    // Observations, y compris contradictoires, never alter a saved estimate.
  }

  const next = {
    ...dossier, revision: event.resultingRevision, updatedAt: event.recordedAt, lastEventId: event.eventId,
    state: event.kind, currentSnapshotReference, currentResultRevision,
    ...(preferredBranch ? { preferredBranch } : {}),
  };
  const { reference: _reference, ...withoutReference } = next;
  return { ...next, reference: brewingScenarioDossierReference(withoutReference) };
}

export function createBrewingScenarioDossier(input: CreateBrewingScenarioDossierInput): {
  dossier: BrewingScenarioDossierV1;
  event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' }>;
} {
  if (!object(input) || !text(input.ownerKey) || input.ownerKey.trim() !== input.ownerKey || !text(input.scenarioId)
    || !text(input.eventId) || !isoDate(input.recordedAt)) invalid('Identité ou horodatage de dossier scénario invalide.');
  const snapshot = snapshotFor(input.result);
  if (snapshot.result.scenarioId !== input.scenarioId) invalid('L’identifiant de scénario ne correspond pas au résultat moteur.');
  const event = createBrewingScenarioEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, eventId: input.eventId,
    expectedRevision: 0, recordedAt: input.recordedAt, kind: 'resultSaved', payload: { snapshot } }) as Extract<BrewingScenarioEventV1, { kind: 'resultSaved' }>;
  return { dossier: initialDossier(input.ownerKey, input.scenarioId, event), event };
}

export function createBrewingScenarioResultRevisionEvent(input: {
  ownerKey: string; scenarioId: string; eventId: string; expectedRevision: number; recordedAt: string;
  previousSnapshotReference: string; reason: string; result: BrewingScenarioResult;
}): Extract<BrewingScenarioEventV1, { kind: 'resultRevised' }> {
  const snapshot = snapshotFor(input.result);
  if (snapshot.result.scenarioId !== input.scenarioId || !text(input.previousSnapshotReference) || !text(input.reason)) invalid('Révision de résultat incomplète.');
  return createBrewingScenarioEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, eventId: input.eventId,
    expectedRevision: input.expectedRevision, recordedAt: input.recordedAt, kind: 'resultRevised',
    payload: { snapshot, previousSnapshotReference: input.previousSnapshotReference, reason: input.reason } }) as Extract<BrewingScenarioEventV1, { kind: 'resultRevised' }>;
}

export function createBrewingScenarioBranchPreferenceEvent(input: {
  ownerKey: string; scenarioId: string; eventId: string; expectedRevision: number; recordedAt: string;
  preferenceId: string; snapshotReference: string; branchId: string; branchReference: string; reason: string; interpretation?: string;
}): Extract<BrewingScenarioEventV1, { kind: 'branchPreferred' }> {
  return createBrewingScenarioEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, eventId: input.eventId,
    expectedRevision: input.expectedRevision, recordedAt: input.recordedAt, kind: 'branchPreferred',
    payload: { preferenceId: input.preferenceId, snapshotReference: input.snapshotReference, resultReference: input.snapshotReference,
      branchId: input.branchId, branchReference: input.branchReference, reason: input.reason,
      ...(input.interpretation !== undefined ? { interpretation: input.interpretation } : {}) } }) as Extract<BrewingScenarioEventV1, { kind: 'branchPreferred' }>;
}

export function createBrewingScenarioObservationEvent(input: {
  ownerKey: string; scenarioId: string; eventId: string; expectedRevision: number; recordedAt: string;
  observationId: string; snapshotReference: string; branchId?: string; observedAt: string; observation: BrewingScenarioObservation;
}): Extract<BrewingScenarioEventV1, { kind: 'observationAppended' }> {
  return createBrewingScenarioEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, eventId: input.eventId,
    expectedRevision: input.expectedRevision, recordedAt: input.recordedAt, kind: 'observationAppended',
    payload: { observationId: input.observationId, snapshotReference: input.snapshotReference, resultReference: input.snapshotReference,
      ...(input.branchId ? { branchId: input.branchId } : {}), observedAt: input.observedAt, observation: input.observation } }) as Extract<BrewingScenarioEventV1, { kind: 'observationAppended' }>;
}

export function applyBrewingScenarioEvent(dossier: BrewingScenarioDossierV1, event: BrewingScenarioEventV1,
  previousEvents: readonly BrewingScenarioEventV1[]): BrewingScenarioDossierV1 {
  assertBrewingScenarioDossier(dossier);
  validateEventShape(event);
  assertEventContentReference(event);
  const replayed = assertPriorEventHistory(previousEvents);
  if (brewingScenarioDossierReference(replayed) !== dossier.reference) invalid('La projection de dossier ne correspond pas à son historique append-only.');
  if (previousEvents.some(row => row.eventId === event.eventId)) {
    if (previousEvents.some(row => row.contentReference === event.contentReference)) throw new BrewingScenarioDossierError('eventIdConflict', 'L’événement est déjà présent; utiliser le résultat idempotent du dépôt.');
    throw new BrewingScenarioDossierError('eventIdConflict', 'eventId déjà utilisé avec un autre contenu.');
  }
  return projectEvent(dossier, event, previousEvents);
}

export function replayBrewingScenarioEvents(events: readonly BrewingScenarioEventV1[]): {
  dossier: BrewingScenarioDossierV1; snapshots: BrewingScenarioSnapshotV1[];
} {
  const dossier = assertPriorEventHistory(events);
  return { dossier, snapshots: resultSnapshots(events) };
}

export function assertBrewingScenarioDossier(value: unknown): asserts value is BrewingScenarioDossierV1 {
  assertDossierProjection(value);
}

export function readBrewingScenarioDossier(value: unknown): BrewingScenarioDossierRead {
  if (!object(value) || !text(value.ownerKey) || !text(value.scenarioId) || !Number.isSafeInteger(value.formatVersion)) invalid('Enveloppe de scénario persistée mal formée.');
  if (value.formatVersion !== 1) return { status: 'unsupportedFormat', reason: 'dossierFormat', ownerKey: value.ownerKey,
    scenarioId: value.scenarioId, formatVersion: value.formatVersion, raw: clone(value) };
  assertDossierProjection(value);
  return clone(value as BrewingScenarioDossierV1);
}

export function readBrewingScenarioEvent(value: unknown): BrewingScenarioEventRead {
  if (!object(value) || !Number.isSafeInteger(value.eventFormatVersion)) invalid('Enveloppe d’événement scénario mal formée.');
  if (value.eventFormatVersion !== 1) return { status: 'unsupportedEventFormat', reason: 'eventFormat', ownerKey: value.ownerKey,
    scenarioId: value.scenarioId, eventId: value.eventId, eventFormatVersion: value.eventFormatVersion, raw: clone(value) };
  if ((value.kind === 'resultSaved' || value.kind === 'resultRevised') && object(value.payload)
    && object(value.payload.snapshot) && object(value.payload.snapshot.result)
    && typeof value.payload.snapshot.result.version === 'string'
    && value.payload.snapshot.result.version !== BREWING_SCENARIO_VERSION) {
    return { status: 'unsupportedEventFormat', reason: 'resultVersion', ownerKey: value.ownerKey,
      scenarioId: value.scenarioId, eventId: value.eventId, eventFormatVersion: 1, raw: clone(value) };
  }
  validateEventShape(value as BrewingScenarioEventV1);
  assertEventContentReference(value as BrewingScenarioEventV1);
  return clone(value as BrewingScenarioEventV1);
}

export function readBrewingScenarioRecord(dossierValue: unknown, eventValues: readonly unknown[]): BrewingScenarioRecordResult {
  const parsedDossier = readBrewingScenarioDossier(dossierValue);
  if ('status' in parsedDossier) return parsedDossier;
  const futureResult = eventValues.find(value => object(value) && value.eventFormatVersion === 1
    && object(value.payload) && (value.kind === 'resultSaved' || value.kind === 'resultRevised')
    && object(value.payload.snapshot) && object(value.payload.snapshot.result)
    && typeof value.payload.snapshot.result.version === 'string'
    && value.payload.snapshot.result.version !== BREWING_SCENARIO_VERSION);
  if (futureResult && object(futureResult) && object(futureResult.payload) && object(futureResult.payload.snapshot)
    && object(futureResult.payload.snapshot.result)) {
    const engineVersion = futureResult.payload.snapshot.result.version;
    return { status: 'unsupportedFormat', reason: 'resultVersion', ownerKey: parsedDossier.ownerKey,
      scenarioId: parsedDossier.scenarioId, formatVersion: 1,
      ...(typeof engineVersion === 'string' ? { engineVersion } : {}), raw: { dossier: clone(dossierValue), events: clone(eventValues) } };
  }
  const parsedEvents = eventValues.map(readBrewingScenarioEvent);
  const unsupported = parsedEvents.find((event): event is BrewingScenarioUnsupportedEvent => 'status' in event);
  if (unsupported) return { status: 'unsupportedFormat', reason: 'history', ownerKey: parsedDossier.ownerKey,
    scenarioId: parsedDossier.scenarioId, formatVersion: 1, raw: { dossier: clone(dossierValue), events: clone(eventValues) } };
  const history = parsedEvents as BrewingScenarioEventV1[];
  const replayed = replayBrewingScenarioEvents(history);
  if (replayed.dossier.reference !== parsedDossier.reference) invalid('La projection stockée ne correspond pas à l’historique relu.');
  const currentSnapshot = replayed.snapshots.find(snapshot => snapshot.reference === parsedDossier.currentSnapshotReference);
  if (!currentSnapshot) invalid('Le résultat courant manque dans l’historique append-only.');
  return { dossier: parsedDossier, currentSnapshot, snapshots: replayed.snapshots, events: history };
}

/** UTF-8 serialized size; a server adapter supplies its platform-specific hard limit. */
export function brewingScenarioSerializedBytes(value: unknown): number {
  let serialized: string;
  try { serialized = JSON.stringify(value); } catch { invalid('Le dossier scénario ne peut pas être sérialisé.'); }
  if (serialized === undefined) invalid('Le dossier scénario ne peut pas être sérialisé.');
  return new TextEncoder().encode(serialized).byteLength;
}

export function assertBrewingScenarioSizeLimit(value: unknown, maxBytes: number): number {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) invalid('Limite de taille de scénario invalide.');
  const bytes = brewingScenarioSerializedBytes(value);
  if (bytes > maxBytes) throw new BrewingScenarioDossierError('sizeLimit', 'Le snapshot de scénario dépasse la limite de stockage; aucune donnée n’a été tronquée.');
  return bytes;
}
