import type { HopEngineData } from '../../../functions/src/hopPredictionCore';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import { applyBrewingReferenceCommand, readBrewingReferenceRecord,
  type BrewingReferenceCommandInput, type BrewingReferenceObservationV1,
  type BrewingReferenceRecordReadV1 } from '../../domain/brewingReference';
import { prepareBrewingObservedContext, type PrepareBrewingObservedContextOptions,
  type PreparedBrewingObservedContextV1 } from '../../domain/brewingObservationContext';
import { assertBrewingObservationAnchor, createBrewingObservationAnchor, type BrewingObservationAnchor } from '../../domain/brewingObservationAnchor';
import { buildBrewingObservationTarget, type BrewingObservationTargetRequest } from '../../domain/brewingObservationInputs';
import { BREWING_OBSERVATION_SELECTION_VERSION, resolveCurrentBrewingObservation, type BrewingObservationVersionReferenceV1,
  type BrewingObservationSelectionV1 } from '../../domain/brewingObservationSelection';
import { archiveBrewingObservationProjection, projectBrewingObservation,
  readBrewingObservationProjectionArchive, type BrewingObservationProjection,
  type BrewingObservationProjectionArchive, type BrewingObservationProjectionRequest } from '../../domain/brewingObservationProjection';
import { brewingObservationFactReference } from '../../domain/brewingObservationNumerics';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { BrewingReferenceObservationDimensionV1 } from '../../domain/brewingReference';
import type { HopV55ReferenceJournal, HopV55Workspace } from './contracts';
import { hopV55ReferenceContextId } from './referenceWorkspace';

export type HopV55ObservationProjectionRole = 'documentedAdvance' | 'targetHorizon';
export type HopV55ObservationReferenceCommand = BrewingReferenceCommandInput<'observationRecorded' | 'observationCorrected'>;
export type HopV55ObservationProjectionArchiveSnapshot = BrewingObservationProjectionArchive | Record<string, unknown>;
export type HopV55ObservationAnchorRecordKind = 'observationAnchor' | 'currentPreparation';

export interface HopV55ObservationAnchorRecordV1 {
  format: 'hop-v55-observation-anchor-record-v1';
  /** Missing in the original V1 envelope; legacy rows are observation anchors, never current-state snapshots. */
  recordKind?: HopV55ObservationAnchorRecordKind;
  id: string;
  workspaceId: string;
  preparation: PreparedBrewingObservedContextV1;
  preparationOptions: PrepareBrewingObservedContextOptions;
  preparationReference: string;
  observationReference: BrewingObservationVersionReferenceV1 | null;
  /** Null only for a retained refused preparation; a refusal never becomes a model input. */
  anchor: BrewingObservationAnchor | null;
  previousAnchorReference?: string;
  reference: string;
}

export interface HopV55ObservationProjectionRecordV1 {
  format: 'hop-v55-observation-projection-record-v1';
  id: string;
  workspaceId: string;
  question: { text: string; projectionQuestionReference: string };
  role: HopV55ObservationProjectionRole;
  anchorRecordId: string;
  anchorReference: string;
  /** Exact current physical preparation for a reloadable question; absent only on legacy archives. */
  currentPreparationRecordId?: string;
  /** The archive is canonical for new writes; raw future archives remain read-only. */
  archive: HopV55ObservationProjectionArchiveSnapshot;
  projectionReference: string;
  reference: string;
}

export type HopV55ObservationRecordRead<T> =
  | { status: 'readOnly'; record: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export class HopV55ObservationSessionError extends Error {
  constructor(readonly code: 'invalidInput' | 'staleReference' | 'unsupportedFormat' | 'notFound', message: string) {
    super(message);
    this.name = 'HopV55ObservationSessionError';
  }
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const exactKeys = (value: Record<string, unknown>, allowed: readonly string[]) => Object.keys(value).every(key => allowed.includes(key));
const clone = <T>(value: T): T => structuredClone(value);
const hash = (kind: string, value: unknown) => hopAdviceContentReference(kind, value);

function invalid(message: string): never { throw new HopV55ObservationSessionError('invalidInput', message); }
function stale(message: string): never { throw new HopV55ObservationSessionError('staleReference', message); }
function unsupported(message: string): never { throw new HopV55ObservationSessionError('unsupportedFormat', message); }

function observationVersionReference(observation: BrewingReferenceObservationV1): BrewingObservationVersionReferenceV1 {
  return { id: observation.id, version: observation.version, contentReference: brewingObservationFactReference(observation) };
}

function observationMatch(read: BrewingReferenceRecordReadV1, expected: BrewingObservationVersionReferenceV1): BrewingReferenceObservationV1 | null {
  return read.projection.observations.find(row => row.id === expected.id && row.version === expected.version
    && brewingObservationFactReference(row) === expected.contentReference) ?? null;
}

function journalReference(journal: HopV55ReferenceJournal | undefined): string | null {
  return journal ? hash('hop-v55-observation-reference-journal-v1', journal) : null;
}

function readWorkspaceJournal(journal: HopV55ReferenceJournal | undefined, workspace?: HopV55Workspace): BrewingReferenceRecordReadV1 {
  if (!journal) return invalid('Un journal NR ouvert est requis; une note locale ne peut pas remplacer la source NR.');
  if (workspace && (journal.record.ownerKey !== workspace.ownerKey || journal.record.contextId !== hopV55ReferenceContextId(workspace.id))) {
    return invalid('Le journal NR appartient à un autre utilisateur ou workspace.');
  }
  const read = readBrewingReferenceRecord(journal.record, journal.events);
  if ('status' in read) return unsupported('Le journal NR est dans un format futur; aucune ancre ou projection nouvelle ne peut être créée.');
  return read;
}

function preparedContextReference(preparation: PreparedBrewingObservedContextV1): string {
  const { reference: _reference, ...body } = preparation;
  return hash('brewing-observed-context-v1', body);
}

function assertPreparedContext(value: unknown): asserts value is PreparedBrewingObservedContextV1 {
  if (!object(value) || value.format !== 'brewing-observed-context-v1' || !['prepared', 'refused'].includes(value.status)
    || !text(value.reference) || value.reference !== preparedContextReference(value as PreparedBrewingObservedContextV1)
    || !Array.isArray(value.materials) || !Array.isArray(value.proposedBindings) || !Array.isArray(value.unmapped)
    || !Array.isArray(value.limitations)) invalid('Snapshot de préparation physique invalide ou altéré.');
  if (value.status === 'prepared') {
    if (!value.state || !value.stateInput) invalid('Une préparation dite prête doit conserver son état physique source.');
  } else if (!value.refusal || !text(value.refusal.code) || !text(value.refusal.message)) {
    invalid('Une préparation refusée doit conserver son motif exact.');
  }
}

function assertAnchorRecordBody(value: unknown): asserts value is HopV55ObservationAnchorRecordV1 {
  if (!object(value) || !exactKeys(value, ['format', 'recordKind', 'id', 'workspaceId', 'preparation', 'preparationOptions', 'preparationReference',
    'observationReference', 'anchor', 'previousAnchorReference', 'reference'])
    || value.format !== 'hop-v55-observation-anchor-record-v1'
    || value.recordKind !== undefined && !['observationAnchor', 'currentPreparation'].includes(value.recordKind)
    || !text(value.id) || !text(value.workspaceId)
    || !object(value.preparationOptions) || !text(value.preparationReference) || !text(value.reference)
    || value.previousAnchorReference !== undefined && !text(value.previousAnchorReference)) invalid('Enveloppe d’ancre V5.5 incomplète.');
  assertPreparedContext(value.preparation);
  if (value.preparationReference !== value.preparation.reference) invalid('L’enveloppe ne référence pas sa préparation exacte.');
  if (value.recordKind === 'currentPreparation') {
    if (value.observationReference !== null || value.anchor !== null || value.previousAnchorReference !== undefined) {
      invalid('Une préparation courante documente l’état physique uniquement; elle ne porte ni note ni ancre.');
    }
    return;
  }
  if (value.observationReference !== null) {
    const ref = value.observationReference;
    if (!object(ref) || !text(ref.id) || !Number.isSafeInteger(ref.version) || ref.version < 1 || !text(ref.contentReference)) {
      invalid('Référence de version NR invalide dans l’enveloppe d’ancre.');
    }
  }
  if (value.anchor !== null) {
    assertBrewingObservationAnchor(value.anchor);
    if (!value.observationReference || value.anchor.observationReference !== value.observationReference.contentReference
      || value.anchor.observation.id !== value.observationReference.id || value.anchor.observation.version !== value.observationReference.version
      || value.anchor.observedState.resolutionReference !== value.preparation.state?.resolutionReference) {
      invalid('L’ancre ne correspond pas à la note NR et à l’état préparé de son enveloppe.');
    }
    if (value.previousAnchorReference !== value.anchor.previousAnchorReference) {
      invalid('La filiation de correction de l’enveloppe et de son ancre diverge.');
    }
  } else if (value.preparation.status !== 'refused') invalid('Une préparation réussie doit conserver son ancre, même si l’entrée modèle est partielle.');
}

function anchorRecordKind(record: HopV55ObservationAnchorRecordV1): HopV55ObservationAnchorRecordKind {
  return record.recordKind ?? 'observationAnchor';
}

export function hopV55ObservationAnchorRecordReference(value: Omit<HopV55ObservationAnchorRecordV1, 'reference'> | HopV55ObservationAnchorRecordV1): string {
  const { reference: _reference, ...body } = value as HopV55ObservationAnchorRecordV1;
  return hash('hop-v55-observation-anchor-record-v1', body);
}

export function readHopV55ObservationAnchorRecord(value: unknown): HopV55ObservationRecordRead<HopV55ObservationAnchorRecordV1> {
  if (object(value) && text(value.format) && value.format.startsWith('hop-v55-observation-anchor-record-')
    && value.format !== 'hop-v55-observation-anchor-record-v1') {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de préparation/ancre préservé sans requalification.' };
  }
  assertAnchorRecordBody(value);
  if (value.reference !== hopV55ObservationAnchorRecordReference(value)) invalid('L’enveloppe ou la référence de l’ancre a été altérée.');
  return { status: 'readOnly', record: clone(value) };
}

function assertProjectionRecordBody(value: unknown): asserts value is HopV55ObservationProjectionRecordV1 {
  if (!object(value) || !exactKeys(value, ['format', 'id', 'workspaceId', 'question', 'role', 'anchorRecordId', 'anchorReference',
    'currentPreparationRecordId', 'archive', 'projectionReference', 'reference'])
    || value.format !== 'hop-v55-observation-projection-record-v1' || !text(value.id) || !text(value.workspaceId)
    || !object(value.question) || !exactKeys(value.question, ['text', 'projectionQuestionReference']) || !text(value.question.text)
    || !text(value.question.projectionQuestionReference) || !['documentedAdvance', 'targetHorizon'].includes(value.role)
    || !text(value.anchorRecordId) || !text(value.anchorReference)
    || value.currentPreparationRecordId !== undefined && !text(value.currentPreparationRecordId) || !object(value.archive)
    || !text(value.projectionReference) || !text(value.reference)) invalid('Enveloppe de projection V5.5 incomplète.');
  const archiveRead = readProjectionArchive(value.archive);
  if (archiveRead.status === 'readOnly') {
    if (archiveRead.projection.reference !== value.projectionReference
      || archiveRead.projection.questionReference !== value.question.projectionQuestionReference
      || archiveRead.projection.requestSnapshot.anchor.reference !== value.anchorReference) {
      invalid('Archive, question ou ancre ne correspondent pas à l’enveloppe immuable.');
    }
  } else if (!text(value.projectionReference)) invalid('Référence de projection future invalide.');
}

export function hopV55ObservationProjectionRecordReference(value: Omit<HopV55ObservationProjectionRecordV1, 'reference'> | HopV55ObservationProjectionRecordV1): string {
  const { reference: _reference, ...body } = value as HopV55ObservationProjectionRecordV1;
  return hash('hop-v55-observation-projection-record-v1', body);
}

export function readHopV55ObservationProjectionRecord(value: unknown): HopV55ObservationRecordRead<HopV55ObservationProjectionRecordV1> {
  if (object(value) && text(value.format) && value.format.startsWith('hop-v55-observation-projection-record-')
    && value.format !== 'hop-v55-observation-projection-record-v1') {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de question/projection préservé sans recalcul.' };
  }
  assertProjectionRecordBody(value);
  if (value.reference !== hopV55ObservationProjectionRecordReference(value)) invalid('La question ou l’archive de projection a été altérée.');
  const archiveRead = readProjectionArchive(value.archive);
  if (archiveRead.status === 'unsupportedReadOnly') {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: archiveRead.reason };
  }
  return { status: 'readOnly', record: clone(value) };
}

function readProjectionArchive(value: unknown): ReturnType<typeof readBrewingObservationProjectionArchive> {
  if (object(value) && text(value.format) && value.format.startsWith('brewing-observation-projection-archive-')
    && value.format !== 'brewing-observation-projection-archive-v1') {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur d’archive conservé sans migration.' };
  }
  return readBrewingObservationProjectionArchive(value);
}

export type HopV55ObservationPreparation =
  | { status: 'ready'; record: HopV55ObservationAnchorRecordV1; referenceJournalPatch?: HopV55ObservationReferenceJournalPatch }
  | { status: 'refused'; record: HopV55ObservationAnchorRecordV1; reasons: string[]; referenceJournalPatch?: HopV55ObservationReferenceJournalPatch }
  | { status: 'needs'; requirements: string[]; candidates?: BrewingObservationSelectionV1['candidates'] };

export interface HopV55ObservationReferenceJournalPatch {
  baseReference: string | null;
  next: HopV55ReferenceJournal;
}

export type HopV55ObservationAnchorSource =
  | { kind: 'context'; context: BrewerContext; options: PrepareBrewingObservedContextOptions }
  | { kind: 'reanchorCorrection'; previousAnchorRecordId: string };

export interface PrepareHopV55ObservationAnchorInput {
  workspace: HopV55Workspace;
  id: string;
  source: HopV55ObservationAnchorSource;
  /** Required when reusing an already-recorded NR version; a supplied command identifies its own exact version. */
  observationReference?: BrewingObservationVersionReferenceV1;
  referenceCommand?: HopV55ObservationReferenceCommand;
  anchor: {
    subjectRelation: BrewingObservationAnchor['subjectRelation'];
    explanation: string;
    createdAt: string;
    createdBy: BrewingObservationAnchor['createdBy'];
  };
}

function assertObservationReference(value: unknown): asserts value is BrewingObservationVersionReferenceV1 {
  if (!object(value) || !exactKeys(value, ['id', 'version', 'contentReference']) || !text(value.id)
    || !Number.isSafeInteger(value.version) || value.version < 1 || !text(value.contentReference)) invalid('Identité exacte de note NR requise.');
}

function correctionProtectedContent(observation: BrewingReferenceObservationV1): unknown {
  const sense = observation.sense.kind === 'analyticalMeasurement'
    ? { kind: observation.sense.kind, unit: observation.sense.unit, basis: observation.sense.basis, method: observation.sense.method }
    : { kind: observation.sense.kind };
  return { id: observation.id, observedAt: observation.observedAt, subject: observation.subject,
    dimension: observation.dimension, scale: observation.scale, sense, comparison: observation.comparison, context: observation.context };
}

function makeAnchorRecord(input: {
  id: string;
  workspaceId: string;
  preparation: PreparedBrewingObservedContextV1;
  options: PrepareBrewingObservedContextOptions;
  observationReference: BrewingObservationVersionReferenceV1 | null;
  observation: BrewingReferenceObservationV1 | null;
  anchor: PrepareHopV55ObservationAnchorInput['anchor'];
  previousAnchor?: BrewingObservationAnchor;
}): HopV55ObservationAnchorRecordV1 {
  const preparation = clone(input.preparation);
  const options = clone(input.options);
  const base = {
    format: 'hop-v55-observation-anchor-record-v1' as const,
    recordKind: 'observationAnchor' as const,
    id: input.id,
    workspaceId: input.workspaceId,
    preparation,
    preparationOptions: options,
    preparationReference: preparation.reference,
    observationReference: input.observationReference ? clone(input.observationReference) : null,
    anchor: preparation.status === 'prepared' && preparation.state && input.observation && input.observationReference
      ? createBrewingObservationAnchor({
        id: input.id,
        observation: input.observation,
        observedState: clone(input.previousAnchor?.observedState ?? preparation.state),
        subjectRelation: input.previousAnchor?.subjectRelation ?? input.anchor.subjectRelation,
        explanation: input.anchor.explanation,
        createdAt: input.anchor.createdAt,
        createdBy: clone(input.anchor.createdBy),
        ...(input.previousAnchor ? { previousAnchorReference: input.previousAnchor.reference } : {}),
      })
      : null,
    ...(input.previousAnchor ? { previousAnchorReference: input.previousAnchor.reference } : {}),
    reference: '',
  };
  const record = base as HopV55ObservationAnchorRecordV1;
  record.reference = hopV55ObservationAnchorRecordReference(record);
  assertAnchorRecordBody(record);
  return record;
}

function makeCurrentPreparationRecord(input: {
  id: string;
  workspaceId: string;
  preparation: PreparedBrewingObservedContextV1;
  options: PrepareBrewingObservedContextOptions;
}): HopV55ObservationAnchorRecordV1 {
  const preparation = clone(input.preparation), preparationOptions = clone(input.options);
  const record = {
    format: 'hop-v55-observation-anchor-record-v1' as const,
    recordKind: 'currentPreparation' as const,
    id: input.id,
    workspaceId: input.workspaceId,
    preparation,
    preparationOptions,
    preparationReference: preparation.reference,
    observationReference: null,
    anchor: null,
    reference: '',
  } as HopV55ObservationAnchorRecordV1;
  record.reference = hopV55ObservationAnchorRecordReference(record);
  assertAnchorRecordBody(record);
  return record;
}

export type HopV55CurrentPreparationResult =
  | { status: 'ready'; record: HopV55ObservationAnchorRecordV1 }
  | { status: 'refused'; record: HopV55ObservationAnchorRecordV1; reasons: string[] }
  | { status: 'needs'; requirements: string[] };

/** Captures a current physical-state preparation on an explicit UI gesture for read-only reload selection. */
export function prepareHopV55CurrentPreparationRecord(input: {
  workspace: HopV55Workspace;
  id: string;
  context: BrewerContext;
  options: PrepareBrewingObservedContextOptions;
}): HopV55CurrentPreparationResult {
  if (!object(input) || !object(input.workspace) || !text(input.workspace.id) || !text(input.id)
    || !object(input.options) || !object(input.options.source) || input.options.source.kind !== 'batch' || !text(input.options.source.id)) {
    invalid('La préparation courante requiert un workspace, un batch et un identifiant explicites.');
  }
  if (input.workspace.sourceBatchId && input.workspace.sourceBatchId !== input.options.source.id) {
    return { status: 'needs', requirements: ['Le batch de la préparation courante doit correspondre à la source exacte du workspace.'] };
  }
  const preparation = prepareBrewingObservedContext(input.context, clone(input.options));
  const record = makeCurrentPreparationRecord({ id: input.id, workspaceId: input.workspace.id,
    preparation, options: input.options });
  return preparation.status === 'prepared'
    ? { status: 'ready', record }
    : { status: 'refused', record, reasons: [preparation.refusal?.message ?? 'La préparation physique courante a été refusée.'] };
}

/** Stores the explicit preparation in the same immutable observation collection; no note is created. */
export function appendHopV55CurrentPreparationRecord(
  workspace: HopV55Workspace,
  recordValue: HopV55ObservationAnchorRecordV1,
): HopV55Workspace {
  const read = readHopV55ObservationAnchorRecord(recordValue);
  if (read.status !== 'readOnly') unsupported('Une préparation courante future reste en lecture seule.');
  if (anchorRecordKind(read.record) !== 'currentPreparation') invalid('Seule une préparation courante peut être ajoutée par ce chemin.');
  if (workspace.id !== read.record.workspaceId) invalid('Cette préparation appartient à un autre workspace.');
  const next = clone(workspace);
  next.observationAnchors = requireUniqueAppend(next.observationAnchors ?? [], read.record, 'préparation courante');
  return next;
}

export type HopV55CurrentObservationSelection =
  | { status: 'selected'; currentPreparation: HopV55ObservationAnchorRecordV1; selection: BrewingObservationSelectionV1 }
  | { status: 'needs'; requirements: string[]; currentPreparation?: HopV55ObservationAnchorRecordV1; candidates?: BrewingObservationSelectionV1['candidates'] }
  | { status: 'refused'; reasons: string[]; currentPreparation: HopV55ObservationAnchorRecordV1 };

/** Reload path: reads the last explicitly appended physical preparation and delegates all note ranking to NR's métier selector. */
export function resolveHopV55CurrentObservation(input: {
  workspace: HopV55Workspace;
  requestedDimension: BrewingReferenceObservationDimensionV1;
  requiredDependencyIds: string[];
  currentPreparationRecordId?: string;
}): HopV55CurrentObservationSelection {
  const rows = input.workspace.observationAnchors ?? [];
  const currentRows: Array<
    | { status: 'readOnly'; record: HopV55ObservationAnchorRecordV1 }
    | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  > = [];
  for (const raw of rows) {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status === 'readOnly' && anchorRecordKind(read.record) === 'currentPreparation') currentRows.push(read);
    else if (read.status === 'unsupportedReadOnly' && object(read.snapshot) && read.snapshot.recordKind === 'currentPreparation') currentRows.push(read);
  }
  const current = input.currentPreparationRecordId
    ? currentRows.find(row => row.status === 'readOnly' && row.record.id === input.currentPreparationRecordId
      || row.status === 'unsupportedReadOnly' && object(row.snapshot) && row.snapshot.id === input.currentPreparationRecordId)
    : currentRows.at(-1);
  if (!current) return { status: 'needs', requirements: ['Un état physique courant explicitement préparé et conservé est requis; le reload ne le déduit pas de la recette ni de l’horloge.'] };
  if (current.status === 'unsupportedReadOnly') {
    return { status: 'needs', requirements: [`Le dernier état documenté utilise un format futur conservé en lecture seule: ${current.reason}`] };
  }
  const preparation = current.record.preparation;
  if (preparation.status !== 'prepared' || !preparation.state) {
    return { status: 'refused', currentPreparation: current.record,
      reasons: [preparation.refusal?.message ?? 'Le dernier état documenté ne permet pas la sélection courante.'] };
  }
  let journal: BrewingReferenceRecordReadV1;
  try { journal = readWorkspaceJournal(input.workspace.referenceJournal, input.workspace); }
  catch (error) {
    return { status: 'needs', currentPreparation: current.record,
      requirements: [error instanceof Error ? error.message : 'Le journal NR ne peut pas être relu.'] };
  }
  const anchors = rows.flatMap(raw => {
    const read = readHopV55ObservationAnchorRecord(raw);
    return read.status === 'readOnly' && anchorRecordKind(read.record) === 'observationAnchor' && read.record.anchor
      ? [read.record.anchor] : [];
  });
  const selection = resolveCurrentBrewingObservation({ journal, anchors, currentState: preparation.state,
    requestedDimension: input.requestedDimension, requiredDependencyIds: input.requiredDependencyIds });
  if (!selection.selected) return { status: 'needs', currentPreparation: current.record,
    requirements: selection.reasons.length ? selection.reasons : ['Aucune note NR actuelle ne correspond à la dimension et aux dépendances exactes.'],
    candidates: selection.candidates };
  return { status: 'selected', currentPreparation: current.record, selection };
}

/** Prepares a new exact NR anchor, or retains a refused physical preparation as a qualified non-numeric record. */
export function prepareHopV55ObservationAnchor(input: PrepareHopV55ObservationAnchorInput): HopV55ObservationPreparation {
  if (!object(input) || !object(input.workspace) || !text(input.workspace.id) || !text(input.id)
    || !object(input.anchor) || !text(input.anchor.explanation) || !text(input.anchor.createdAt)
    || !Number.isFinite(Date.parse(input.anchor.createdAt)) || !object(input.anchor.createdBy)
    || !text(input.anchor.createdBy.name) || !['user', 'assistant', 'model'].includes(input.anchor.createdBy.origin)) {
    invalid('Préparation d’ancre workspace incomplète.');
  }
  let preparation: PreparedBrewingObservedContextV1;
  let options: PrepareBrewingObservedContextOptions;
  let previousAnchor: BrewingObservationAnchor | undefined;
  if (input.source.kind === 'context') {
    options = clone(input.source.options);
    preparation = prepareBrewingObservedContext(input.source.context, options);
  } else if (input.source.kind === 'reanchorCorrection') {
    const previousAnchorRecordId = input.source.previousAnchorRecordId;
    const previous = (input.workspace.observationAnchors ?? []).map(readHopV55ObservationAnchorRecord)
      .find(row => row.status === 'readOnly' && row.record.id === previousAnchorRecordId);
    if (!previous || previous.status !== 'readOnly' || previous.record.workspaceId !== input.workspace.id || !previous.record.anchor) {
      return { status: 'needs', requirements: ['Choisir une ancre historique conservée pour la correction.'] };
    }
    preparation = clone(previous.record.preparation);
    options = clone(previous.record.preparationOptions);
    previousAnchor = previous.record.anchor;
  } else {
    invalid('Source de préparation d’ancre inconnue.');
  }

  const read = readWorkspaceJournal(input.workspace.referenceJournal, input.workspace);
  let nextJournal = input.workspace.referenceJournal!;
  let patch: HopV55ObservationReferenceJournalPatch | undefined;
  let observationReference = input.observationReference ?? null;
  if (input.referenceCommand && input.observationReference) {
    const commandObservation = input.referenceCommand.payload.observation;
    if (observationVersionReference(commandObservation).contentReference !== input.observationReference.contentReference
      || commandObservation.id !== input.observationReference.id || commandObservation.version !== input.observationReference.version) {
      invalid('La commande NR et la référence de note fournie désignent deux versions différentes.');
    }
  }
  if (input.referenceCommand) {
    const command = clone(input.referenceCommand);
    if (command.kind === 'observationCorrected' && input.source.kind !== 'reanchorCorrection') {
      invalid('Une correction NR doit reprendre l’état historique d’une ancre antérieure.');
    }
    const beforeReference = journalReference(input.workspace.referenceJournal);
    const applied = applyBrewingReferenceCommand(read.record, command, read.events);
    const events = read.events.some(event => event.commandId === applied.event.commandId) ? read.events : [...read.events, applied.event];
    nextJournal = { record: applied.record, events };
    const afterRead = readBrewingReferenceRecord(nextJournal.record, nextJournal.events);
    if ('status' in afterRead) return { status: 'needs', requirements: ['Le journal NR obtenu après la commande n’est pas lisible par ce format.'] };
    if (command.kind === 'observationRecorded' || command.kind === 'observationCorrected') {
      const observation = command.payload.observation;
      observationReference = observationVersionReference(observation);
    }
    patch = { baseReference: beforeReference, next: clone(nextJournal) };
  }
  if (!observationReference) return { status: 'needs', requirements: ['Sélectionner une version NR exacte ou fournir la commande NR qui l’enregistre.'] };
  assertObservationReference(observationReference);
    const journalRead = readBrewingReferenceRecord(nextJournal.record, nextJournal.events);
  if ('status' in journalRead) return { status: 'needs', requirements: ['Le journal NR est dans un format futur; aucune nouvelle ancre ne peut être créée.'] };
  const observation = observationMatch(journalRead, observationReference);
  if (!observation) return { status: 'needs', requirements: ['La version NR attendue n’existe plus dans le journal courant.'] };
  if (previousAnchor && (previousAnchor.observation.id !== observation.id
    || observation.version <= previousAnchor.observation.version
    || hash('hop-v55-observation-correction-lineage-v1', correctionProtectedContent(previousAnchor.observation))
      !== hash('hop-v55-observation-correction-lineage-v1', correctionProtectedContent(observation)))) {
    return { status: 'needs', requirements: ['La correction ne conserve pas l’identité physique, l’instant, la dimension, l’échelle et le contexte de l’ancre source.'] };
  }

  const record = makeAnchorRecord({ id: input.id, workspaceId: input.workspace.id, preparation, options,
    observationReference, observation, anchor: input.anchor, previousAnchor });
  const result = preparation.status === 'prepared' && record.anchor
    ? { status: 'ready' as const, record, ...(patch ? { referenceJournalPatch: patch } : {}) }
    : { status: 'refused' as const, record,
      reasons: [preparation.refusal?.message ?? 'Aucun état préparé ne permet de construire une ancre.'],
      ...(patch ? { referenceJournalPatch: patch } : {}) };
  return result;
}

function requireUniqueAppend<T extends { id: string; reference: string }>(rows: readonly T[], incoming: T, label: string): T[] {
  const prior = rows.find(row => row.id === incoming.id);
  if (prior) {
    if (prior.reference !== incoming.reference) stale(`L’identifiant ${label} existe déjà avec un autre contenu.`);
    return rows.map(row => clone(row));
  }
  if (rows.some(row => row.reference === incoming.reference)) stale(`Une autre identité ${label} porte déjà la même archive.`);
  return [...rows.map(row => clone(row)), clone(incoming)];
}

/** Rebase the prepared anchor record onto a freshly read workspace without running context resolution again. */
export function appendHopV55ObservationAnchor(
  workspace: HopV55Workspace,
  recordValue: HopV55ObservationAnchorRecordV1,
  journalPatch?: HopV55ObservationReferenceJournalPatch,
): HopV55Workspace {
  const read = readHopV55ObservationAnchorRecord(recordValue);
  if (read.status !== 'readOnly') unsupported('Une enveloppe d’ancre future reste en lecture seule.');
  const record = read.record;
  if (anchorRecordKind(record) !== 'observationAnchor') invalid('Une préparation courante doit passer par son append dédié.');
  if (workspace.id !== record.workspaceId) invalid('Cette ancre appartient à un autre workspace.');
  const next = clone(workspace);
  if (journalPatch) {
    const currentReference = journalReference(workspace.referenceJournal);
    const nextReference = journalReference(journalPatch.next);
    if (currentReference !== journalPatch.baseReference && currentReference !== nextReference) {
      stale('Le journal NR a changé; réévaluer l’ancre sur sa version actuelle.');
    }
    const journalRead = readWorkspaceJournal(journalPatch.next, workspace);
    if (record.observationReference && !observationMatch(journalRead, record.observationReference)) {
      stale('Le journal candidat ne contient pas la version NR exacte de l’ancre.');
    }
    if (currentReference === journalPatch.baseReference) next.referenceJournal = clone(journalPatch.next);
  } else if (record.observationReference) {
    const journalRead = readWorkspaceJournal(workspace.referenceJournal, workspace);
    if (!observationMatch(journalRead, record.observationReference)) stale('La note NR n’est pas conservée dans le workspace courant.');
  }
  next.observationAnchors = requireUniqueAppend(next.observationAnchors ?? [], record, 'ancre');
  return next;
}

export interface PrepareHopV55ObservationProjectionInput {
  workspace: HopV55Workspace;
  /** Use the exact current-state snapshot already saved by an explicit gesture on reload. */
  currentPreparationRecordId?: string;
  /** An explicitly chosen historical anchor. This never changes the current NR selection. */
  anchorRecordId?: string;
  expectedAnchorReference?: string;
  expectedObservationReference?: BrewingObservationVersionReferenceV1;
  /** Optional live preparation path for an explicit current-state gesture before it is persisted. */
  currentContext?: BrewerContext;
  currentOptions?: PrepareBrewingObservedContextOptions;
  requestedDimension: BrewingReferenceObservationDimensionV1;
  requiredDependencyIds: string[];
  target: Omit<BrewingObservationTargetRequest, 'current'>;
  projection: Omit<BrewingObservationProjectionRequest, 'id' | 'anchor' | 'observedInput' | 'targetInput' | 'createdAt' | 'createdBy'> & {
    id: string;
    question: string;
    role: HopV55ObservationProjectionRole;
    createdAt: string;
    createdBy: BrewingObservationProjectionRequest['createdBy'];
  };
  data: HopEngineData;
}

export type HopV55ObservationProjectionPreparation =
  | { status: 'ready'; record: HopV55ObservationProjectionRecordV1; projection: BrewingObservationProjection;
      /** Selector result for the latest target state; historical anchoring does not promote its candidates. */
      selection: BrewingObservationSelectionV1; chosenAnchor: HopV55ChosenObservationAnchorV1 }
  | { status: 'needs'; requirements: string[]; selection?: BrewingObservationSelectionV1 }
  | { status: 'refused'; reasons: string[]; selection?: BrewingObservationSelectionV1 };

export interface HopV55ChosenObservationAnchorV1 {
  recordId: string;
  anchor: BrewingObservationAnchor;
  observationReference: BrewingObservationVersionReferenceV1;
}

function selectionFromCurrentResolution(current: HopV55CurrentObservationSelection): BrewingObservationSelectionV1 {
  if (current.status === 'selected') return current.selection;
  if (current.status === 'refused') return { format: BREWING_OBSERVATION_SELECTION_VERSION, selected: null, candidates: [], reasons: current.reasons };
  return { format: BREWING_OBSERVATION_SELECTION_VERSION, selected: null, candidates: clone(current.candidates ?? []), reasons: [...current.requirements] };
}

/** Resolves the latest target state separately from either a current or explicitly selected historical NR anchor. */
export function prepareHopV55ObservationProjection(input: PrepareHopV55ObservationProjectionInput): HopV55ObservationProjectionPreparation {
  const workspace = input.workspace;
  if (!object(input.projection) || !text(input.projection.id) || !text(input.projection.question)
    || !['documentedAdvance', 'targetHorizon'].includes(input.projection.role)) {
    return { status: 'needs', requirements: ['Une question explicite et son rôle dans le parcours sont requis avant calcul.'] };
  }
  const historicalRequested = input.anchorRecordId !== undefined || input.expectedAnchorReference !== undefined
    || input.expectedObservationReference !== undefined;
  const expectedObservation = input.expectedObservationReference;
  if (historicalRequested && (!text(input.anchorRecordId) || !text(input.expectedAnchorReference)
    || !object(expectedObservation) || !text(expectedObservation.id) || !Number.isSafeInteger(expectedObservation.version)
    || expectedObservation.version < 1 || !text(expectedObservation.contentReference))) {
    return { status: 'needs', requirements: ['Une ancre de départ historique, sa référence et la version NR affichée doivent être choisies ensemble.'] };
  }
  const usesSaved = !!input.currentPreparationRecordId;
  if (historicalRequested && !usesSaved) {
    return { status: 'needs', requirements: ['Une comparaison historique exige la dernière préparation courante explicitement conservée comme cible.'] };
  }
  if (!usesSaved && (!input.currentContext || !input.currentOptions)) {
    return { status: 'needs', requirements: ['Une préparation courante explicite sauvegardée ou un contexte et ses options exactes sont requis.'] };
  }

  let targetPreparation: PreparedBrewingObservedContextV1;
  let targetPreparationRecord: HopV55ObservationAnchorRecordV1 | undefined;
  let currentPreparationRecordId: string | undefined;
  let currentSelection: BrewingObservationSelectionV1;
  if (usesSaved) {
    const currentRows = (workspace.observationAnchors ?? []).map(readHopV55ObservationAnchorRecord);
    const savedCurrent = currentRows.find(row => row.status === 'readOnly' && row.record.id === input.currentPreparationRecordId);
    if (!savedCurrent || savedCurrent.status !== 'readOnly' || anchorRecordKind(savedCurrent.record) !== 'currentPreparation'
      || savedCurrent.record.workspaceId !== workspace.id) {
      return { status: 'needs', requirements: ['La préparation courante explicite n’est pas conservée dans ce workspace.'] };
    }
    targetPreparation = savedCurrent.record.preparation;
    targetPreparationRecord = savedCurrent.record;
    currentPreparationRecordId = savedCurrent.record.id;
    if (targetPreparation.status !== 'prepared' || !targetPreparation.state || !targetPreparation.observedHopInput) {
      return { status: 'needs', requirements: [targetPreparation.refusal?.message ?? 'Le dernier état documenté ne fournit pas une entrée préparée comme cible.'] };
    }
    const current = resolveHopV55CurrentObservation({ workspace, currentPreparationRecordId,
      requestedDimension: input.requestedDimension, requiredDependencyIds: input.requiredDependencyIds });
    if (current.status === 'refused') return { status: 'refused', reasons: current.reasons, selection: selectionFromCurrentResolution(current) };
    if (current.status === 'needs' && !historicalRequested) {
      return { status: 'needs', requirements: current.requirements, selection: selectionFromCurrentResolution(current) };
    }
    currentSelection = selectionFromCurrentResolution(current);
  } else {
    let journal: BrewingReferenceRecordReadV1;
    try { journal = readWorkspaceJournal(workspace.referenceJournal, workspace); }
    catch (error) { return { status: 'needs', requirements: [error instanceof Error ? error.message : 'Le journal NR ne peut pas être relu.'] }; }
    targetPreparation = prepareBrewingObservedContext(input.currentContext!, input.currentOptions!);
    if (targetPreparation.status !== 'prepared' || !targetPreparation.state || !targetPreparation.observedHopInput) {
      return { status: 'needs', requirements: [targetPreparation.refusal?.message ?? 'L’état courant ne fournit pas une entrée préparée.'] };
    }
    const anchors = (workspace.observationAnchors ?? []).flatMap(raw => {
      const read = readHopV55ObservationAnchorRecord(raw);
      return read.status === 'readOnly' && anchorRecordKind(read.record) === 'observationAnchor' && read.record.anchor ? [read.record.anchor] : [];
    });
    currentSelection = resolveCurrentBrewingObservation({ journal, anchors, currentState: targetPreparation.state,
      requestedDimension: input.requestedDimension, requiredDependencyIds: input.requiredDependencyIds });
    if (!currentSelection.selected) return { status: 'needs', requirements: currentSelection.reasons.length
      ? currentSelection.reasons : ['Aucune observation NR actuelle ne répond aux critères exacts.'], selection: currentSelection };
  }

  let chosenAnchor: HopV55ChosenObservationAnchorV1 | undefined;
  let chosenAnchorRecord: HopV55ObservationAnchorRecordV1 | undefined;
  if (historicalRequested) {
    const expected = expectedObservation!;
    const sourceRecordRead = (workspace.observationAnchors ?? []).map(readHopV55ObservationAnchorRecord)
      .find(row => row.status === 'readOnly' && row.record.id === input.anchorRecordId);
    if (!sourceRecordRead || sourceRecordRead.status !== 'readOnly'
      || anchorRecordKind(sourceRecordRead.record) !== 'observationAnchor' || !sourceRecordRead.record.anchor
      || sourceRecordRead.record.workspaceId !== workspace.id) {
      return { status: 'needs', requirements: ['L’ancre de départ historique exacte n’est plus conservée dans ce workspace.',], selection: currentSelection };
    }
    const sourceRecord = sourceRecordRead.record;
    const sourceAnchor = sourceRecord.anchor!;
    if (!workspace.sourceBatchId || sourceRecord.preparationOptions.source.kind !== 'batch'
      || sourceRecord.preparationOptions.source.id !== workspace.sourceBatchId
      || !targetPreparationRecord || targetPreparationRecord.preparationOptions.source.kind !== 'batch'
      || targetPreparationRecord.preparationOptions.source.id !== workspace.sourceBatchId) {
      return { status: 'needs', requirements: ['L’ancre de départ et la cible doivent conserver le même brassin source exact.'], selection: currentSelection };
    }
    const sourceObservationReference = sourceRecord.observationReference;
    if (sourceAnchor.reference !== input.expectedAnchorReference
      || !sourceObservationReference || sourceObservationReference.id !== expected.id
      || sourceObservationReference.version !== expected.version
      || sourceObservationReference.contentReference !== expected.contentReference
      || sourceAnchor.observationReference !== expected.contentReference
      || sourceAnchor.observation.id !== expected.id || sourceAnchor.observation.version !== expected.version) {
      return { status: 'needs', requirements: ['La note NR affichée et l’ancre choisie ne portent plus exactement la même version. Rechoisis la version corrigée et son ancre.'], selection: currentSelection };
    }
    const sourcePreparation = sourceRecord.preparation;
    if (sourcePreparation.status !== 'prepared' || !sourcePreparation.state || !sourcePreparation.observedHopInput
      || sourcePreparation.state.resolutionReference !== sourceAnchor.observedState.resolutionReference
      || sourcePreparation.observedHopInput.source.state.resolutionReference !== sourceAnchor.observedState.resolutionReference) {
      return { status: 'needs', requirements: ['L’entrée physique historique conservée avec cette ancre est absente ou appartient à un autre état.'], selection: currentSelection };
    }
    let journal: BrewingReferenceRecordReadV1;
    try { journal = readWorkspaceJournal(workspace.referenceJournal, workspace); }
    catch (error) { return { status: 'needs', requirements: [error instanceof Error ? error.message : 'Le journal NR ne peut pas être relu.'], selection: currentSelection };
    }
    const expectedVersionExists = journal.events.some(event => {
      if (event.kind !== 'observationRecorded' && event.kind !== 'observationCorrected') return false;
      const observation = event.payload.observation;
      return observation.id === expected.id && observation.version === expected.version
        && brewingObservationFactReference(observation) === expected.contentReference;
    });
    if (!expectedVersionExists) return { status: 'needs', requirements: ['La version NR exacte choisie ne figure plus dans le journal vérifié. Rechoisis la version affichée.'], selection: currentSelection };
    chosenAnchor = { recordId: sourceRecord.id, anchor: sourceAnchor, observationReference: expected };
    chosenAnchorRecord = sourceRecord;
  } else {
    const selected = currentSelection.selected;
    if (!selected) return { status: 'needs', requirements: currentSelection.reasons.length
      ? currentSelection.reasons : ['Aucune observation NR actuelle ne répond aux critères exacts.'], selection: currentSelection };
    if (!selected.anchor || selected.anchor.observationReference !== selected.observationReference.contentReference
      || selected.anchor.observation.id !== selected.observationReference.id || selected.anchor.observation.version !== selected.observationReference.version) {
      return { status: 'needs', requirements: ['La version NR corrigée doit recevoir une nouvelle ancre à partir de l’état historique avant projection.'], selection: currentSelection };
    }
    const selectedAnchorRead = (workspace.observationAnchors ?? []).map(readHopV55ObservationAnchorRecord)
      .find(row => row.status === 'readOnly' && row.record.anchor?.reference === selected.anchor!.reference);
    if (selectedAnchorRead?.status === 'readOnly') {
      chosenAnchorRecord = selectedAnchorRead.record;
      chosenAnchor = { recordId: selectedAnchorRead.record.id, anchor: selected.anchor,
        observationReference: selected.observationReference };
    }
  }

  if (!chosenAnchor || !chosenAnchorRecord || chosenAnchorRecord.id !== chosenAnchor.recordId
    || anchorRecordKind(chosenAnchorRecord) !== 'observationAnchor'
    || chosenAnchorRecord.anchor?.reference !== chosenAnchor.anchor.reference
    || chosenAnchorRecord.preparation.status !== 'prepared' || !chosenAnchorRecord.preparation.observedHopInput) {
    return { status: 'needs', requirements: ['L’entrée physique conservée avec cette ancre exacte est absente.'], selection: currentSelection };
  }
  if (!targetPreparation.observedHopInput || !targetPreparation.state) {
    return { status: 'needs', requirements: ['Une entrée de modèle explicitement préparée manque pour l’état cible courant.'], selection: currentSelection };
  }
  if (input.projection.role === 'documentedAdvance'
    && (input.target.future.length !== 0 || input.target.contactTargets.length !== 0
      || input.target.horizon.kind !== 'instant'
      || Date.parse(input.target.horizon.at) !== Date.parse(targetPreparation.state.asOf))) {
    return { status: 'needs', requirements: ['Avancement documenté: conserver l’entrée physique courante comme cible, sans ajout futur ni cible de contact; l’instant cible doit être exactement celui de l’état courant.'], selection: currentSelection };
  }
  const targetInput = buildBrewingObservationTarget({ ...clone(input.target), current: targetPreparation.observedHopInput });
  const projectionRequest: BrewingObservationProjectionRequest = {
    id: input.projection.id,
    anchor: chosenAnchor.anchor,
    observedInput: chosenAnchorRecord.preparation.observedHopInput!,
    targetInput,
    frames: clone(input.projection.frames),
    arithmetic: clone(input.projection.arithmetic),
    restStability: clone(input.projection.restStability),
    createdAt: input.projection.createdAt,
    createdBy: clone(input.projection.createdBy),
  };
  let projection: BrewingObservationProjection;
  try { projection = projectBrewingObservation(projectionRequest, input.data); }
  catch (error) {
    return { status: 'refused', reasons: [error instanceof Error ? error.message : 'La projection ancrée a été refusée.'], selection: currentSelection };
  }
  const archive = archiveBrewingObservationProjection(projection);
  const base = {
    format: 'hop-v55-observation-projection-record-v1' as const,
    id: input.projection.id,
    workspaceId: workspace.id,
    question: { text: input.projection.question, projectionQuestionReference: projection.questionReference },
    role: input.projection.role,
    anchorRecordId: chosenAnchorRecord.id,
    anchorReference: chosenAnchor.anchor.reference,
    ...(currentPreparationRecordId ? { currentPreparationRecordId } : {}),
    archive,
    projectionReference: projection.reference,
    reference: '',
  };
  const record = base as HopV55ObservationProjectionRecordV1;
  record.reference = hopV55ObservationProjectionRecordReference(record);
  assertProjectionRecordBody(record);
  return { status: 'ready', record, projection, selection: currentSelection, chosenAnchor };
}

function assertProjectionCurrentPreparation(workspace: HopV55Workspace, record: HopV55ObservationProjectionRecordV1): void {
  if (!record.currentPreparationRecordId) return;
  const saved = (workspace.observationAnchors ?? []).map(readHopV55ObservationAnchorRecord)
    .find(row => row.status === 'readOnly' && row.record.id === record.currentPreparationRecordId);
  if (!saved || saved.status !== 'readOnly' || anchorRecordKind(saved.record) !== 'currentPreparation'
    || saved.record.workspaceId !== workspace.id || saved.record.preparation.status !== 'prepared'
    || !saved.record.preparation.state || !saved.record.preparation.observedHopInput) {
    stale('La projection ne retrouve plus sa préparation courante immuable.');
  }
  const archive = readProjectionArchive(record.archive);
  if (archive.status !== 'readOnly') unsupported('La préparation courante de cette archive future reste en lecture seule.');
  const currentInput = archive.projection.requestSnapshot.targetInput.source.current;
  if (currentInput.reference !== saved.record.preparation.observedHopInput.reference
    || currentInput.source.state.resolutionReference !== saved.record.preparation.state.resolutionReference) {
    invalid('La projection ne correspond pas à l’entrée et à l’état de sa préparation courante conservée.');
  }
}

/** Appends the already calculated archive; safe to reuse after a CAS conflict without invoking the model. */
export function appendHopV55ObservationProjection(
  workspace: HopV55Workspace,
  recordValue: HopV55ObservationProjectionRecordV1,
): HopV55Workspace {
  const read = readHopV55ObservationProjectionRecord(recordValue);
  if (read.status !== 'readOnly') unsupported('Une projection future reste préservée en lecture seule.');
  const record = read.record;
  if (workspace.id !== record.workspaceId) invalid('Cette projection appartient à un autre workspace.');
  const anchors = workspace.observationAnchors ?? [];
  const anchorRead = anchors.map(readHopV55ObservationAnchorRecord).find(row => row.status === 'readOnly' && row.record.id === record.anchorRecordId);
  if (!anchorRead || anchorRead.status !== 'readOnly' || anchorRead.record.anchor?.reference !== record.anchorReference) {
    stale('La projection doit référencer une ancre immuable déjà conservée dans le workspace.');
  }
  assertProjectionCurrentPreparation(workspace, record);
  const next = clone(workspace);
  next.observationProjections = requireUniqueAppend(next.observationProjections ?? [], record, 'projection');
  return next;
}

export function assertHopV55ObservationCollections(value: unknown): void {
  if (!object(value)) invalid('Collections d’observation absentes du workspace.');
  const workspaceId = text(value.id) ? value.id : null;
  for (const [field, reader] of [['observationAnchors', readHopV55ObservationAnchorRecord], ['observationProjections', readHopV55ObservationProjectionRecord]] as const) {
    const rows = value[field];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) invalid(`La collection ${field} doit être une liste append-only.`);
    const ids = new Set<string>();
    for (const raw of rows) {
      const read = reader(raw);
      const row = read.status === 'readOnly' ? read.record : read.snapshot as Record<string, unknown>;
      if (text(row.id) && ids.has(row.id)) invalid(`Identifiant répété dans ${field}.`);
      if (text(row.id)) ids.add(row.id);
      if (read.status === 'readOnly' && workspaceId && read.record.workspaceId !== workspaceId) {
        invalid(`Une archive ${field} appartient à un autre workspace.`);
      }
    }
  }
}

export function assertHopV55ObservationAppendOnly(previous: HopV55Workspace, next: HopV55Workspace): void {
  for (const [field, reader] of [['observationAnchors', readHopV55ObservationAnchorRecord], ['observationProjections', readHopV55ObservationProjectionRecord]] as const) {
    const priorRows = previous[field] ?? [];
    const nextRows = next[field] ?? [];
    if (nextRows.length < priorRows.length || priorRows.some((row, index) => hash(`hop-v55-${field}-prefix-v1`, row) !== hash(`hop-v55-${field}-prefix-v1`, nextRows[index]))) {
      invalid(`Les archives ${field} sont immuables et append-only.`);
    }
    for (const row of nextRows.slice(priorRows.length)) {
      const read = reader(row);
      if (read.status !== 'readOnly') unsupported(`Un nouvel élément ${field} doit utiliser le format pris en charge courant.`);
      if (read.record.workspaceId !== next.id) invalid(`L’élément ${field} appartient à un autre workspace.`);
    }
  }
  const anchorRefs = new Set((next.observationAnchors ?? []).flatMap(raw => {
    const read = readHopV55ObservationAnchorRecord(raw);
    return read.status === 'readOnly' && read.record.anchor ? [read.record.anchor.reference] : [];
  }));
  const priorProjectionCount = (previous.observationProjections ?? []).length;
  for (const raw of (next.observationProjections ?? []).slice(priorProjectionCount)) {
    const read = readHopV55ObservationProjectionRecord(raw);
    if (read.status === 'readOnly' && !anchorRefs.has(read.record.anchorReference)) {
      invalid('Une projection doit conserver son ancre source dans le même workspace.');
    }
    if (read.status === 'readOnly') assertProjectionCurrentPreparation(next, read.record);
  }
}

