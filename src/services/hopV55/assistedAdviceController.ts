/**
 * Local orchestration for the assisted hop-advice turn. The ticket is a workspace-local
 * launch snapshot; it is never added to the network BrewerChatInput. Runtime owns receipt
 * sealing/persistence. This module only validates, prepares a proposal, and produces a
 * confirmed V4 action for the existing V4 command path.
 */
import type { BrewerChatInput, BrewerContext, BrewerEvidence, BrewerJob, BrewerTurn } from '../../../functions/src/companionTypes';
import {
  isBrewerHopAdviceContextLaunchClaim,
  mapBrewerHopAdviceLaunchSourceToScopeV1,
  type BrewerHopAdviceContextLaunchClaimV1,
  type BrewerHopAdviceContextProjectionV1,
  type BrewerHopAdviceContextScopeV1,
} from '../../../functions/src/brewerHopAdviceContextBinding';
import {
  hopAdviceContentReference,
} from '../../domain/hopDecision/adviceContentReference';
import type { HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { readBrewingScenarioEvidence } from '../../domain/brewingScenarioArchive';
import {
  HOP_V55_DECISION_READING_FORMAT_V3,
  hopV55DecisionReadingForDisplay,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV3,
  type HopV55DecisionReadingSource,
} from './decisionArchive';
import type { HopV55QuestionReading } from './decision';
import {
  assertHopV55QuestionScopeLedgerV1,
  type HopV55QuestionScopeLedgerV1,
  type HopV55QuestionScopeV1,
} from './questionScopeReading';
import type { HopV55Workspace } from './contracts';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  assertBrewerHopAdviceProposalEnvelope,
  stableBrewerHopAdviceJson,
  validateBrewerHopAdviceRequest,
  verifyBrewerHopAdviceEvidence,
  type BrewerHopAdviceProposalEnvelope,
  type BrewerHopAdviceRequest,
  type BrewerHopAdviceEvidenceSource,
} from '../../../functions/src/brewerHopAdviceProposal';
import {
  prepareHopV55AssistedAdviceContextLaunch,
  compareHopV55AssistedAdviceContextAtReception,
  type CompareHopV55AssistedContextAtReceptionResult,
  type PrepareHopV55AssistedContextLaunchInput,
} from './assistedAdviceContext';
import {
  buildHopV55AssistedAdviceRequest,
  hopV55V4ActionFromAssistedSuggestion,
  prepareHopV55AssistedAdviceFromProposal,
  type HopV55AssistedAdviceContextCheckInput,
  type HopV55AssistedV4Suggestion,
  type HopV55BrewerConfirmation,
  type PrepareHopV55AssistedAdviceResult,
} from './assistedAdviceProposal';
import type { HopV55PropertyAdviceLedgerActionV4, HopV55PropertyAdviceV4SourceRecord } from './propertyAdvicePreparationV4';
import type { HopV55PropertyAdviceV4Transition } from './propertyAdviceRecordsV4';
import { readHopV55PropertyAdviceAnswerRecordV3 } from './propertyAdviceRecordsV3';
import { readHopV55PropertyAdviceAnswerRecordV4 } from './propertyAdviceRecordsV4';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';

export const HOP_V55_ASSISTED_ADVICE_TICKET_V1_FORMAT = 'hop-v55-assisted-advice-ticket-v1' as const;

/** Only the source fields used by the launch validator are retained; never the whole workspace/receipt history. */
export type HopV55AssistedAdviceWorkspaceSnapshot = Pick<HopV55Workspace,
  'format' | 'id' | 'ownerKey' | 'revision' | 'title' | 'intent' | 'copies' | 'referenceHypotheses'> &
  Partial<Pick<HopV55Workspace,
    'sourceRecipeId' | 'sourceBatchId' | 'activeFutureDraftSource' | 'futureDrafts' | 'activeCopyId' | 'referenceJournal'>> & {
      decisionReadings: HopV55DecisionReadingArchive[];
    };

/** A complete but bounded A-snapshot, sufficient to validate/prepare a delayed turn without reading B or parsing again. */
export interface HopV55AssistedAdviceLaunchSnapshotV1 {
  archive: HopV55DecisionReadingArchive;
  reading: HopV55QuestionReading;
  activeScopes: HopV55QuestionScopeV1[];
  context: BrewerContext;
  prepared: PreparedBrewingScenarioContext;
  workspace: HopV55AssistedAdviceWorkspaceSnapshot;
}

export type HopV55AssistedAdviceBaseReferencesV1 = {
  format: 'hop-v55-documentary-answer-record-v3' | 'hop-v55-documentary-answer-record-v4';
  recordReference: string;
  answerReference?: string;
  ledgerReference?: string;
};

/** Workspace-local immutable job ticket. Runtime may wrap this in its append-only record codec. */
export interface HopV55AssistedAdviceTicketV1 {
  format: typeof HOP_V55_ASSISTED_ADVICE_TICKET_V1_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  operationId: string;
  createdAt: string;
  sourceReadingReference: string;
  archiveReference: string;
  source: HopV55DecisionReadingSource;
  sourceRuntimeReference: string;
  scope: BrewerHopAdviceContextScopeV1;
  contextProjection: BrewerHopAdviceContextProjectionV1;
  request: BrewerHopAdviceRequest;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  scopeLedgerReference?: string;
  adviceBase?: HopV55AssistedAdviceBaseReferencesV1;
  launchSnapshot: HopV55AssistedAdviceLaunchSnapshotV1;
  reference: string;
}

export type HopV55AssistedAdviceTicketRead =
  | { status: 'readOnly'; ticket: HopV55AssistedAdviceTicketV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type PrepareHopV55AssistedAdviceLaunchInput = {
  archive: unknown;
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  context: BrewerContext;
  /** Required for a first advice launch; an existing V3/V4 parent owns this value on a correction. */
  candidatePolicy?: HopPropertyAdviceRequestV3['candidatePolicy'];
  /** Exact parent V3/V4 record when this turn is based on one. */
  adviceBaseRecord?: unknown;
};

/** Ephemeral canonical request available before BrewerChat assigns its operationId. */
export type HopV55AssistedAdvicePreparedLaunchV1 = Omit<HopV55AssistedAdviceTicketV1,
  'id' | 'operationId' | 'createdAt' | 'reference' | 'format'> & {
    format: 'hop-v55-assisted-advice-prepared-launch-v1';
  };

export type CaptureHopV55AssistedAdviceTicketInput = {
  id: string;
  operationId: string;
  createdAt: string;
  launch: HopV55AssistedAdvicePreparedLaunchV1;
};

export type PrepareHopV55AssistedAdviceLaunchResult =
  | { status: 'ready'; launch: HopV55AssistedAdvicePreparedLaunchV1 }
  | { status: 'stale' | 'invalid'; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export type CaptureHopV55AssistedAdviceTicketResult =
  | { status: 'ready'; ticket: HopV55AssistedAdviceTicketV1 }
  | { status: 'stale' | 'invalid'; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export type BeforeSubmitHopV55AssistedAdviceResult =
  | { status: 'ready'; ticket: HopV55AssistedAdviceTicketV1; input: BrewerChatInput }
  | { status: 'blocked'; reason: string };

export interface HopV55AssistedAdviceReceptionPayloadV1 {
  /** Unsealed service payload; Runtime creates and reads the durable receipt envelope. */
  ticketReference: string;
  operationId: string;
  turnId: string;
  receivedAt: string;
  /** Exact local adapter result, including a stale result that remains useful as historical evidence. */
  clientResult: Extract<PrepareHopV55AssistedAdviceResult, { status: 'ready' | 'stale' }>;
  turnEvidence: BrewerHopAdviceEvidenceSource[];
  /** Fresh B comparison is kept separate from the helper's proposal-at-A check. */
  contextCheckAtReception: CompareHopV55AssistedContextAtReceptionResult;
}

export type ReceiveHopV55AssistedAdviceResult =
  | { status: 'ready'; ticket: HopV55AssistedAdviceTicketV1; payload: HopV55AssistedAdviceReceptionPayloadV1 }
  | { status: 'blocked' | 'invalid'; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export interface HopV55AssistedAdviceHistoryReader<T> {
  /** Runtime's pure, strict codec reader; it must not parse, prepare, build, call HTTP, or mutate. */
  read(value: unknown):
    | { status: 'readOnly'; record: T }
    | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
    | { status: 'invalid'; reason: string };
}

const isRow = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const isoInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));
const exact = (left: unknown, right: unknown) => stableBrewerHopAdviceJson(left) === stableBrewerHopAdviceJson(right);
const reference = (value: unknown) => hopAdviceContentReference('hop-v55-assisted-advice-equality-v1', value);
const clone = <T,>(value: T): T => structuredClone(value);

function ticketReference(value: Omit<HopV55AssistedAdviceTicketV1, 'reference'> | HopV55AssistedAdviceTicketV1): string {
  const { reference: _reference, ...body } = value as HopV55AssistedAdviceTicketV1;
  return hopAdviceContentReference(HOP_V55_ASSISTED_ADVICE_TICKET_V1_FORMAT, body);
}

function workspaceSnapshot(workspace: HopV55Workspace, archive: HopV55DecisionReadingArchive): HopV55AssistedAdviceWorkspaceSnapshot {
  return {
    format: workspace.format, id: workspace.id, ownerKey: workspace.ownerKey, revision: workspace.revision,
    title: workspace.title, intent: clone(workspace.intent), sourceRecipeId: workspace.sourceRecipeId,
    sourceBatchId: workspace.sourceBatchId, decisionReadings: [clone(archive)],
    ...(workspace.activeFutureDraftSource ? { activeFutureDraftSource: clone(workspace.activeFutureDraftSource) } : {}),
    ...(workspace.futureDrafts ? { futureDrafts: clone(workspace.futureDrafts) } : {}),
    ...(workspace.activeCopyId ? { activeCopyId: workspace.activeCopyId } : {}), copies: clone(workspace.copies),
    referenceHypotheses: clone(workspace.referenceHypotheses),
    ...(workspace.referenceJournal ? { referenceJournal: clone(workspace.referenceJournal) } : {}),
  };
}

function snapshotWorkspaceForContext(snapshot: HopV55AssistedAdviceWorkspaceSnapshot): HopV55Workspace {
  // The validator reads only these fields. Defaults satisfy the workspace shape without hiding source facts.
  return {
    format: snapshot.format, id: snapshot.id, ownerKey: snapshot.ownerKey, revision: snapshot.revision,
    title: snapshot.title, intent: clone(snapshot.intent), sourceRecipeId: snapshot.sourceRecipeId,
    sourceBatchId: snapshot.sourceBatchId, decisionReadings: clone(snapshot.decisionReadings),
    ...(snapshot.activeFutureDraftSource ? { activeFutureDraftSource: clone(snapshot.activeFutureDraftSource) } : {}),
    ...(snapshot.futureDrafts ? { futureDrafts: clone(snapshot.futureDrafts) } : {}),
    ...(snapshot.activeCopyId ? { activeCopyId: snapshot.activeCopyId } : {}), copies: clone(snapshot.copies),
    referenceHypotheses: clone(snapshot.referenceHypotheses),
    ...(snapshot.referenceJournal ? { referenceJournal: clone(snapshot.referenceJournal) } : {}),
    scenarioIds: [], updatedAt: '',
  };
}

function activeScopes(archive: HopV55DecisionReadingArchive, reading: HopV55QuestionReading): HopV55QuestionScopeV1[] {
  if (archive.format !== HOP_V55_DECISION_READING_FORMAT_V3) return [];
  const v3 = archive as HopV55DecisionReadingArchiveV3;
  assertHopV55QuestionScopeLedgerV1(v3.scopeLedger, reading.intent.question, reading);
  const latest = new Map<string, HopV55QuestionScopeLedgerV1['entries'][number]>();
  for (const entry of v3.scopeLedger.entries) latest.set(entry.scopeId, entry);
  return v3.scopeLedger.sourceScopes.flatMap(source => {
    const entry = latest.get(source.id);
    return entry && entry.status !== 'excluded' && entry.activeScope ? [clone(entry.activeScope)] : [];
  });
}

function adviceBaseReferences(value: unknown, ownerKey: string, workspaceId: string, sourceReadingReference: string):
  | { status: 'ready'; value: HopV55AssistedAdviceBaseReferencesV1; candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'] }
  | { status: 'invalid'; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  try {
    if (!isRow(value)) return { status: 'invalid', reason: 'Record de conseil parent invalide.' };
    if (value.format === 'hop-v55-documentary-answer-record-v3') {
      const read = readHopV55PropertyAdviceAnswerRecordV3(value);
      if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
      const record = read.record;
      if (record.ownerKey !== ownerKey || record.workspaceId !== workspaceId || record.sourceReadingReference !== sourceReadingReference) {
        return { status: 'invalid', reason: 'Le record V3 parent ne correspond pas au workspace et à la lecture exacte.' };
      }
      return { status: 'ready', value: { format: record.format, recordReference: record.reference, answerReference: record.answerReference },
        candidatePolicy: clone(record.answerSnapshot.requestSnapshot.candidatePolicy) };
    }
    if (value.format === 'hop-v55-documentary-answer-record-v4') {
      const read = readHopV55PropertyAdviceAnswerRecordV4(value);
      if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
      const record = read.record;
      if (record.ownerKey !== ownerKey || record.workspaceId !== workspaceId || record.sourceReadingReference !== sourceReadingReference) {
        return { status: 'invalid', reason: 'Le record V4 parent ne correspond pas au workspace et à la lecture exacte.' };
      }
      return { status: 'ready', value: { format: record.format, recordReference: record.reference,
        ...(record.outcome.kind === 'domainAnswer' ? { answerReference: record.outcome.answerReference } : {}),
        ledgerReference: record.ledger.reference }, candidatePolicy: clone(record.readingContext.candidatePolicy) };
    }
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format du record de conseil parent conservé sans conversion.' };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Record parent illisible.' }; }
}

function assertCandidatePolicy(value: unknown): asserts value is HopPropertyAdviceRequestV3['candidatePolicy'] {
  if (!isRow(value) || Object.keys(value).some(key => !['kind', 'materialIds', 'basis'].includes(key))
    || !['explicit', 'discover'].includes(value.kind) || !Array.isArray(value.materialIds)
    || value.materialIds.some(id => !text(id)) || new Set(value.materialIds).size !== value.materialIds.length || !text(value.basis)) {
    throw new Error('La politique de candidats doit être fournie explicitement et rester exacte.');
  }
}

function launchSnapshotInput(ticket: HopV55AssistedAdviceTicketV1): PrepareHopV55AssistedContextLaunchInput {
  return { archive: ticket.launchSnapshot.archive, workspace: snapshotWorkspaceForContext(ticket.launchSnapshot.workspace),
    ownerKey: ticket.ownerKey, workspaceId: ticket.workspaceId, scopeAtPageLaunch: clone(ticket.scope),
    context: clone(ticket.launchSnapshot.context) };
}

function validateTicket(value: unknown): HopV55AssistedAdviceTicketV1 {
  if (!isRow(value) || value.format !== HOP_V55_ASSISTED_ADVICE_TICKET_V1_FORMAT) throw new Error('Ticket assisté V1 absent ou futur.');
  const allowed = ['format', 'id', 'ownerKey', 'workspaceId', 'operationId', 'createdAt', 'sourceReadingReference', 'archiveReference',
    'source', 'sourceRuntimeReference', 'scope', 'contextProjection', 'request', 'candidatePolicy', 'scopeLedgerReference', 'adviceBase',
    'launchSnapshot', 'reference'];
  if (Object.keys(value).some(key => !allowed.includes(key)) || !text(value.id) || !text(value.ownerKey) || !text(value.workspaceId)
    || !text(value.operationId) || !isoInstant(value.createdAt) || !text(value.sourceReadingReference) || !text(value.archiveReference)
    || !text(value.sourceRuntimeReference) || !text(value.reference) || !isRow(value.launchSnapshot)) throw new Error('Ticket assisté V1 incomplet.');
  const ticket = value as unknown as HopV55AssistedAdviceTicketV1;
  if (!isBrewerHopAdviceContextLaunchClaim(ticket.request.contextLaunch)) throw new Error('Claim de contexte du ticket invalide.');
  const snapshot = ticket.launchSnapshot;
  const read = readHopV55DecisionReadingArchive(snapshot.archive);
  if (read.status === 'unsupportedFormat') throw Object.assign(new Error('Archive de lecture future conservée.'), { unsupported: read.raw });
  if (read.status !== 'available') throw new Error(read.reason);
  const archive = read.archive;
  if (archive.contentReference !== ticket.archiveReference || archive.contentReference !== ticket.sourceReadingReference
    || archive.ownerKey !== ticket.ownerKey || archive.workspaceId !== ticket.workspaceId
    || archive.runtimeReference !== ticket.sourceRuntimeReference || reference(archive.source) !== reference(ticket.source)) {
    throw new Error('L’archive du ticket ne correspond plus à sa source/scopé capturé.');
  }
  if (snapshot.workspace.id !== ticket.workspaceId || snapshot.workspace.ownerKey !== ticket.ownerKey
    || snapshot.workspace.decisionReadings.length !== 1 || snapshot.workspace.decisionReadings[0].contentReference !== archive.contentReference) {
    throw new Error('Snapshot A du ticket non minimal ou rattaché à une autre archive.');
  }
  if (snapshot.reading.intent.question !== archive.reading.intent.question
    || reference(snapshot.reading) !== reference(hopV55DecisionReadingForDisplay(archive))) throw new Error('Lecture A du ticket différente de l’archive scellée.');
  const expectedScope = mapBrewerHopAdviceLaunchSourceToScopeV1(ticket.ownerKey, ticket.workspaceId, archive.source);
  if (reference(expectedScope) !== reference(ticket.scope) || ticket.contextProjection.scope.kind !== ticket.scope.kind
    || ticket.contextProjection.scope.id !== ticket.scope.id) throw new Error('Scope du ticket différent du mapping source canonique.');
  if (!isRow(ticket.contextProjection) || ticket.contextProjection.format !== 'brewer-hop-advice-context-projection-v1'
    || !reference(ticket.contextProjection) || !exact(ticket.contextProjection, ticket.request.contextLaunch.expected)) {
    throw new Error('Projection de contexte du ticket invalide.');
  }
  assertCandidatePolicy(ticket.candidatePolicy);
  const request = validateBrewerHopAdviceRequest(ticket.request, snapshot.reading.intent.question);
  if (request.format !== BREWER_HOP_ADVICE_REQUEST_FORMAT || request.sourceReadingReference !== ticket.sourceReadingReference
    || !exact(request.contextLaunch.expected, ticket.contextProjection) || request.contextLaunch.sourceReadingReference !== ticket.sourceReadingReference
    || request.contextLaunch.ownerKey !== ticket.ownerKey || request.contextLaunch.workspaceId !== ticket.workspaceId) {
    throw new Error('Requête du ticket non liée à la lecture et projection capturées.');
  }
  const scopes = activeScopes(archive, snapshot.reading);
  if (!exact(scopes, snapshot.activeScopes)) throw new Error('Portées actives différentes du ledger V3 capturé.');
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V3
    ? ticket.scopeLedgerReference !== archive.scopeLedger.reference
    : ticket.scopeLedgerReference !== undefined) throw new Error('Référence du ledger de portées différente de l’archive exacte.');
  if (ticket.adviceBase !== undefined) {
    const base = ticket.adviceBase;
    if (!isRow(base) || !['hop-v55-documentary-answer-record-v3', 'hop-v55-documentary-answer-record-v4'].includes(base.format)
      || !text(base.recordReference) || base.answerReference !== undefined && !text(base.answerReference)
      || base.format === 'hop-v55-documentary-answer-record-v4' && !text(base.ledgerReference)
      || base.format === 'hop-v55-documentary-answer-record-v3' && base.ledgerReference !== undefined) {
      throw new Error('Références du record parent V3/V4 invalides.');
    }
  }
  // Reader-only projection check: no question parser, request-preparation helper, or domain builder runs on history.
  const archivedAnnotations = snapshot.reading.criterionDrafts.map(draft => ({
    id: draft.id, span: { ...draft.source }, term: draft.term,
    direction: draft.direction ?? 'none', requirement: draft.requirement,
    ...(draft.qualification ? { qualification: draft.qualification } : {}),
    ...(draft.familyId ? { familyId: draft.familyId } : {}),
    ...(draft.dimension ? { dimension: String(draft.dimension) } : {}), origin: draft.origin,
  }));
  const archivedScopes = scopes.map(scope => ({ id: scope.id, kind: scope.kind, span: { ...scope.sourceSpan },
    ...(scope.focusSpan ? { focusSpan: { ...scope.focusSpan } } : {}) }));
  if (!exact(request.readerAnnotations, archivedAnnotations) || !exact(request.readerScopes, archivedScopes)) {
    throw new Error('Requête du ticket différente des annotations ou portées archivées.');
  }
  if (hopV55ScenarioRuntimeReference(snapshot.prepared.runtime) !== archive.runtimeReference) throw new Error('Prepared A ne correspond pas à la référence runtime archivée.');
  const recomputed = ticketReference(ticket);
  if (recomputed !== ticket.reference) throw new Error('Référence du ticket assisté altérée.');
  return clone(ticket);
}

/** Pure strict reader for a workspace-local launch ticket; no question parser or engine runs. */
export function readHopV55AssistedAdviceTicketV1(value: unknown): HopV55AssistedAdviceTicketRead {
  if (isRow(value) && value.format !== HOP_V55_ASSISTED_ADVICE_TICKET_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Ticket assisté futur/inconnu conservé sans conversion.' };
  }
  try { return { status: 'readOnly', ticket: validateTicket(value) }; }
  catch (error) {
    const raw = isRow(error) && 'unsupported' in error ? (error as any).unsupported : undefined;
    return raw === undefined ? { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket assisté illisible.' }
      : { status: 'unsupportedReadOnly', snapshot: raw, reason: error instanceof Error ? error.message : 'Archive future conservée.' };
  }
}

/** Prepare the canonical request at click/session creation, before BrewerChat assigns an operationId. */
export function prepareHopV55AssistedAdviceLaunchV1(input: PrepareHopV55AssistedAdviceLaunchInput): PrepareHopV55AssistedAdviceLaunchResult {
  try {
    const archiveRead = readHopV55DecisionReadingArchive(input.archive);
    if (archiveRead.status === 'unsupportedFormat') return { status: 'unsupportedReadOnly', snapshot: archiveRead.raw, reason: `Archive ${archiveRead.format} conservée sans conversion.` };
    if (archiveRead.status !== 'available') return { status: 'invalid', reason: archiveRead.reason };
    const archive = archiveRead.archive;
    const reading = hopV55DecisionReadingForDisplay(archive);
    const scopes = activeScopes(archive, reading);
    const scope = mapBrewerHopAdviceLaunchSourceToScopeV1(input.ownerKey, input.workspaceId, archive.source);
    const launchInput: PrepareHopV55AssistedContextLaunchInput = { archive, workspace: input.workspace,
      ownerKey: input.ownerKey, workspaceId: input.workspaceId, scopeAtPageLaunch: scope, context: input.context };
    const launched = prepareHopV55AssistedAdviceContextLaunch(launchInput);
    if (launched.status === 'unsupportedFormat') return { status: 'unsupportedReadOnly', snapshot: launched.raw, reason: `Contexte ${launched.format} conservé sans conversion.` };
    if (launched.status !== 'ready') return { status: launched.status, reason: launched.reason };
    if (!exact(reading, launched.reading) || input.workspace.ownerKey !== input.ownerKey || input.workspace.id !== input.workspaceId) {
      return { status: 'stale', reason: 'La lecture ou le workspace ne correspond pas exactement à la capture Page.' };
    }
    let adviceBase: HopV55AssistedAdviceBaseReferencesV1 | undefined;
    let candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
    if (input.adviceBaseRecord !== undefined) {
      const base = adviceBaseReferences(input.adviceBaseRecord, input.ownerKey, input.workspaceId, archive.contentReference);
      if (base.status !== 'ready') return base;
      const storedParent = input.workspace.documentaryAnswers?.find(row => (row as { reference?: string }).reference === base.value.recordReference);
      if (!storedParent || !exact(storedParent, input.adviceBaseRecord)) {
        return { status: 'stale', reason: 'Le record parent exact n’est pas présent dans l’historique du workspace.' };
      }
      if (input.candidatePolicy !== undefined && !exact(input.candidatePolicy, base.candidatePolicy)) {
        return { status: 'stale', reason: 'La politique de candidats diffère du snapshot exact du record parent.' };
      }
      candidatePolicy = clone(base.candidatePolicy);
      adviceBase = base.value;
    } else {
      if (input.candidatePolicy === undefined) return { status: 'invalid', reason: 'Une politique explicite du brasseur est requise sans record parent.' };
      assertCandidatePolicy(input.candidatePolicy);
      candidatePolicy = clone(input.candidatePolicy);
    }
    const request = buildHopV55AssistedAdviceRequest({ reading, sourceReadingReference: archive.contentReference,
      scopeDrafts: scopes, contextLaunch: launched.launch });
    const prepared = prepareBrewingScenarioContext(input.context);
    if (hopV55ScenarioRuntimeReference(prepared.runtime) !== archive.runtimeReference) {
      return { status: 'stale', reason: 'Le runtime chargé diffère de celui de la lecture archivée.' };
    }
    const launch: HopV55AssistedAdvicePreparedLaunchV1 = {
      format: 'hop-v55-assisted-advice-prepared-launch-v1', ownerKey: input.ownerKey, workspaceId: input.workspaceId,
      sourceReadingReference: archive.contentReference,
      archiveReference: archive.contentReference, source: clone(archive.source), sourceRuntimeReference: archive.runtimeReference,
      scope: clone(scope), contextProjection: clone(launched.launch.expected), request: clone(request),
      candidatePolicy, ...(archive.format === HOP_V55_DECISION_READING_FORMAT_V3
        ? { scopeLedgerReference: archive.scopeLedger.reference } : {}),
      ...(adviceBase ? { adviceBase } : {}),
      launchSnapshot: { archive: clone(archive), reading: clone(reading), activeScopes: clone(scopes), context: clone(input.context),
        prepared: clone(prepared), workspace: workspaceSnapshot(input.workspace, archive) },
    };
    return { status: 'ready', launch: clone(launch) };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Préparation assistée impossible.' }; }
}

/** Add the operation identity to a prepared launch and seal it before network submission. */
export function captureHopV55AssistedAdviceTicketV1(input: CaptureHopV55AssistedAdviceTicketInput): CaptureHopV55AssistedAdviceTicketResult {
  try {
    if (!text(input.id) || !text(input.operationId) || !isoInstant(input.createdAt)
      || input.launch?.format !== 'hop-v55-assisted-advice-prepared-launch-v1') {
      return { status: 'invalid', reason: 'Identité d’opération, date ou lancement assisté invalide.' };
    }
    const { format: _launchFormat, ...launchBody } = clone(input.launch);
    const body: Omit<HopV55AssistedAdviceTicketV1, 'reference'> = {
      ...launchBody, format: HOP_V55_ASSISTED_ADVICE_TICKET_V1_FORMAT,
      id: input.id, operationId: input.operationId, createdAt: input.createdAt,
    };
    const ticket: HopV55AssistedAdviceTicketV1 = { ...body, reference: ticketReference(body) };
    const validated = validateTicket(ticket);
    return { status: 'ready', ticket: validated };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Capture assistée impossible.' }; }
}

function currentLaunch(ticket: HopV55AssistedAdviceTicketV1, current: PrepareHopV55AssistedContextLaunchInput):
  | { status: 'ready' }
  | { status: 'blocked'; reason: string } {
  try {
    const result = prepareHopV55AssistedAdviceContextLaunch(current);
    if (result.status === 'unsupportedFormat') return { status: 'blocked', reason: `Format ${result.format} conservé sans conversion.` };
    if (result.status !== 'ready') return { status: 'blocked', reason: result.reason };
    if (result.archive.contentReference !== ticket.sourceReadingReference || !exact(result.launch, ticket.request.contextLaunch)) {
      return { status: 'blocked', reason: 'La lecture ou le contexte courant ne correspond plus au ticket A.' };
    }
    return { status: 'ready' };
  } catch (error) { return { status: 'blocked', reason: error instanceof Error ? error.message : 'Contexte courant illisible.' }; }
}

function currentAdviceBaseMatches(ticket: HopV55AssistedAdviceTicketV1, current: PrepareHopV55AssistedContextLaunchInput):
  | { status: 'ready' }
  | { status: 'blocked'; reason: string } {
  if (!ticket.adviceBase) return { status: 'ready' };
  const stored = current.workspace.documentaryAnswers?.find(row =>
    (row as { reference?: string }).reference === ticket.adviceBase!.recordReference);
  if (!stored) return { status: 'blocked', reason: 'Le record parent capturé n’est plus dans l’historique du workspace.' };
  const refs = adviceBaseReferences(stored, ticket.ownerKey, ticket.workspaceId, ticket.sourceReadingReference);
  if (refs.status !== 'ready' || !exact(refs.value, ticket.adviceBase)
    || !exact(refs.candidatePolicy, ticket.candidatePolicy)) {
    return { status: 'blocked', reason: 'Le record ou ledger parent a changé depuis la préparation de la session.' };
  }
  return { status: 'ready' };
}

/** Last local check before submit; preserves every caller field and adds only the canonical request. */
export function beforeSubmitHopV55AssistedAdvice(input: {
  ticket: unknown;
  current: PrepareHopV55AssistedContextLaunchInput;
  input: BrewerChatInput;
}): BeforeSubmitHopV55AssistedAdviceResult {
  const read = readHopV55AssistedAdviceTicketV1(input.ticket);
  if (read.status !== 'readOnly') return { status: 'blocked', reason: read.status === 'invalid' ? read.reason : read.reason };
  const ticket = read.ticket;
  if (input.input.operationId !== ticket.operationId || input.input.question !== ticket.request.question
    || !exact(input.input.scope, ticket.scope)) return { status: 'blocked', reason: 'Question, scope ou operationId réseau différent du ticket local.' };
  if (input.input.hopAdvice !== undefined && !exact(input.input.hopAdvice, ticket.request)) {
    return { status: 'blocked', reason: 'Une autre requête assistée est déjà attachée à cet input.' };
  }
  const fresh = currentLaunch(ticket, input.current);
  if (fresh.status !== 'ready') return fresh;
  const freshBase = currentAdviceBaseMatches(ticket, input.current);
  if (freshBase.status !== 'ready') return freshBase;
  return { status: 'ready', ticket, input: { ...clone(input.input), hopAdvice: clone(ticket.request) } };
}

function inputMatchesTicket(input: BrewerChatInput, ticket: HopV55AssistedAdviceTicketV1): boolean {
  return input.operationId === ticket.operationId && input.question === ticket.request.question
    && exact(input.scope, ticket.scope) && exact(input.hopAdvice, ticket.request);
}

/** Prepare an immutable local payload to be sealed by the Runtime receipt codec. */
export function receiveHopV55AssistedAdvice(input: {
  ticket: unknown;
  input: BrewerChatInput;
  job: Pick<BrewerJob, 'operationId'> & { input?: BrewerChatInput };
  turn: BrewerTurn;
  envelope: unknown;
  evidence: readonly BrewerEvidence[];
  current: PrepareHopV55AssistedContextLaunchInput;
  receivedAt: string;
}): ReceiveHopV55AssistedAdviceResult {
  const ticketRead = readHopV55AssistedAdviceTicketV1(input.ticket);
  if (ticketRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: ticketRead.snapshot, reason: ticketRead.reason };
  if (ticketRead.status !== 'readOnly') return { status: 'invalid', reason: ticketRead.reason };
  const ticket = ticketRead.ticket;
  try {
    assertBrewerHopAdviceProposalEnvelope(input.envelope);
    const envelope = input.envelope as BrewerHopAdviceProposalEnvelope;
    if (!inputMatchesTicket(input.input, ticket) || input.job.operationId !== ticket.operationId
      || (input.job.input && !inputMatchesTicket(input.job.input, ticket))
      || input.turn.operationId !== ticket.operationId || input.turn.question !== ticket.request.question
      || !text(input.turn.id) || !isoInstant(input.receivedAt)) {
      return { status: 'blocked', reason: 'Input réseau, job ou tour différent de l’opération assistée capturée.' };
    }
    if (!input.turn.hopAdviceProposal || !exact(input.turn.hopAdviceProposal, input.envelope)
      || !exact(input.turn.evidence, input.evidence)) {
      return { status: 'invalid', reason: 'La proposition ou les preuves ne proviennent pas exactement du même tour.' };
    }
    if (!exact(envelope.request, ticket.request)) return { status: 'blocked', reason: 'Le tour serveur n’a pas conservé la requête exacte du ticket.' };

    const snapshotInput = launchSnapshotInput(ticket);
    const original = prepareHopV55AssistedAdviceContextLaunch(snapshotInput);
    if (original.status !== 'ready' || !exact(original.launch, envelope.request.contextLaunch)) {
      const reason = original.status === 'ready' ? 'Le claim serveur ne correspond pas au ticket A.'
        : original.status === 'unsupportedFormat' ? `Format ${original.format} conservé sans conversion.` : original.reason;
      return { status: 'blocked', reason };
    }
    const launchCheck: HopV55AssistedAdviceContextCheckInput = { launch: ticket.request.contextLaunch, current: snapshotInput };
    const proposal = prepareHopV55AssistedAdviceFromProposal({
      envelope, turnEvidence: input.evidence as readonly BrewerHopAdviceEvidenceSource[], reading: ticket.launchSnapshot.reading,
      sourceReadingReference: ticket.sourceReadingReference, context: launchCheck,
      scopeDrafts: ticket.launchSnapshot.activeScopes, prepared: ticket.launchSnapshot.prepared,
      requestId: `${ticket.id}:${input.turn.id}`, ownerKey: ticket.ownerKey, workspaceId: ticket.workspaceId,
      candidatePolicy: ticket.candidatePolicy,
    });
    if (proposal.status === 'invalid') return { status: 'invalid', reason: proposal.reason };
    // A is validated above and is the sole basis for the proposal. B is checked separately and never rewrites A.
    const contextCheckAtReception = compareHopV55AssistedAdviceContextAtReception({
      launch: ticket.request.contextLaunch, serverRequestReadingReference: envelope.request.sourceReadingReference,
      serverProjection: envelope.serverContext.binding, current: input.current, stage: 'reception',
    });
    const payload: HopV55AssistedAdviceReceptionPayloadV1 = {
      ticketReference: ticket.reference, operationId: ticket.operationId, turnId: input.turn.id, receivedAt: input.receivedAt,
      clientResult: clone(proposal), turnEvidence: clone(input.evidence) as unknown as BrewerHopAdviceEvidenceSource[],
      contextCheckAtReception: clone(contextCheckAtReception),
    };
    return { status: 'ready', ticket, payload };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Réception assistée illisible.' }; }
}

export interface HopV55AssistedAdviceV4CommandInput {
  ticket: HopV55AssistedAdviceTicketV1;
  action: HopV55PropertyAdviceLedgerActionV4;
  sourceRecord: HopV55PropertyAdviceV4SourceRecord;
  sourceReadingArchive: HopV55DecisionReadingArchive;
  prepared: PreparedBrewingScenarioContext;
  transition: HopV55PropertyAdviceV4Transition;
  expected: { sourceReadingReference: string; sourceRecordReference: string; ledgerReference?: string };
}

export type ConfirmHopV55AssistedAdviceResult<T> =
  | { status: 'applied'; action: HopV55PropertyAdviceLedgerActionV4; result: T }
  | { status: 'blocked' | 'invalid'; reason: string };

/** Recheck exact source/base/freshness and ask the already-injected V4 host command to persist. */
export async function confirmHopV55AssistedAdviceSuggestion<T>(input: {
  ticket: unknown;
  payload: HopV55AssistedAdviceReceptionPayloadV1;
  current: PrepareHopV55AssistedContextLaunchInput;
  sourceRecord: unknown;
  transition: HopV55PropertyAdviceV4Transition;
  suggestion: HopV55AssistedV4Suggestion;
  confirmation: HopV55BrewerConfirmation;
  executeV4(command: HopV55AssistedAdviceV4CommandInput): Promise<T>;
}): Promise<ConfirmHopV55AssistedAdviceResult<T>> {
  const ticketRead = readHopV55AssistedAdviceTicketV1(input.ticket);
  if (ticketRead.status !== 'readOnly') return { status: 'blocked', reason: ticketRead.reason };
  const ticket = ticketRead.ticket;
  try {
    if (input.payload.ticketReference !== ticket.reference || input.payload.operationId !== ticket.operationId
      || !input.payload.turnId || !isoInstant(input.payload.receivedAt)) return { status: 'blocked', reason: 'Le reçu ne correspond pas au ticket de lancement.' };
    if (input.payload.clientResult.status !== 'ready') return { status: 'blocked', reason: 'Un résultat historique périmé/incomplet ne peut pas être confirmé.' };
    assertBrewerHopAdviceProposalEnvelope(input.payload.clientResult.envelope);
    if (!exact(input.payload.clientResult.envelope.request, ticket.request)
      || !input.payload.clientResult.v4Suggestions.some(row => exact(row, input.suggestion))) {
      return { status: 'blocked', reason: 'La suggestion n’appartient pas au résultat archivé de cette opération.' };
    }
    const envelope = input.payload.clientResult.envelope;
    if (input.transition.actor.origin !== 'user' || !text(input.transition.reason) || !isoInstant(input.transition.recordedAt)) {
      return { status: 'blocked', reason: 'La commande V4 doit porter un geste, auteur brasseur, motif et date explicites.' };
    }
    const sourceArchiveRead = readHopV55DecisionReadingArchive(ticket.launchSnapshot.archive);
    if (sourceArchiveRead.status !== 'available') return { status: 'blocked', reason: 'Archive historique A indisponible.' };
    const sourceArchive = sourceArchiveRead.archive;
    const baseRefs = ticket.adviceBase;
    if (!baseRefs) return { status: 'blocked', reason: 'Aucun record parent V3/V4 exact n’a été capturé pour appliquer cette suggestion.' };
    const base = adviceBaseReferences(input.sourceRecord, ticket.ownerKey, ticket.workspaceId, ticket.sourceReadingReference);
    if (base.status !== 'ready') return { status: 'blocked', reason: base.reason };
    if (!exact(base.value, baseRefs)) return { status: 'blocked', reason: 'Le record ou ledger parent a changé depuis le lancement.' };
    const storedParent = input.current.workspace.documentaryAnswers?.find(row =>
      (row as { reference?: string }).reference === baseRefs.recordReference);
    if (!storedParent || !exact(storedParent, input.sourceRecord)) {
      return { status: 'blocked', reason: 'Le record parent exact n’est plus présent dans l’historique courant du workspace.' };
    }
    if (input.transition.parentRecordReference !== baseRefs.recordReference
      || input.transition.parentReadingReference !== ticket.sourceReadingReference
      || (baseRefs.format === 'hop-v55-documentary-answer-record-v3' && input.transition.kind !== 'upgradeV3')
      || (baseRefs.format === 'hop-v55-documentary-answer-record-v4'
        && !['revise', 'reexamine'].includes(input.transition.kind))) {
      return { status: 'blocked', reason: 'La transition V4 ne cible pas exactement le record et la lecture parent capturés.' };
    }

    const contextAtConfirm = compareHopV55AssistedAdviceContextAtReception({
      launch: ticket.request.contextLaunch, serverRequestReadingReference: envelope.request.sourceReadingReference,
      serverProjection: envelope.serverContext.binding, current: input.current, stage: 'confirmation',
    });
    if (contextAtConfirm.history.status !== 'matched') return { status: 'blocked', reason: contextAtConfirm.history.reason };
    if (contextAtConfirm.applicability.status !== 'current' || contextAtConfirm.applicability.recalculationRequired) {
      return { status: 'blocked', reason: contextAtConfirm.applicability.status === 'current'
        ? 'Les dépendances ont changé; recalcule avant toute confirmation.' : contextAtConfirm.applicability.reason };
    }
    verifyBrewerHopAdviceEvidence(envelope, input.payload.turnEvidence, { readScenario: readBrewingScenarioEvidence });
    const action = hopV55V4ActionFromAssistedSuggestion(input.suggestion, input.confirmation,
      { launch: ticket.request.contextLaunch, current: input.current, envelope });
    const prepared = prepareBrewingScenarioContext(input.current.context);
    const result = await input.executeV4({ ticket, action, sourceRecord: input.sourceRecord as HopV55PropertyAdviceV4SourceRecord,
      sourceReadingArchive: sourceArchive, prepared, transition: clone(input.transition),
      expected: { sourceReadingReference: ticket.sourceReadingReference, sourceRecordReference: baseRefs.recordReference,
        ...(baseRefs.ledgerReference ? { ledgerReference: baseRefs.ledgerReference } : {}) } });
    return { status: 'applied', action, result };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Confirmation V4 impossible.' }; }
}

/** History is deliberately a reader-only pass-through: this adapter never rebuilds the proposal. */
export function readHopV55AssistedAdviceHistory<T>(value: unknown, codec: HopV55AssistedAdviceHistoryReader<T>):
  ReturnType<HopV55AssistedAdviceHistoryReader<T>['read']> {
  return codec.read(value);
}

/** Expose an exact request check to Page/Host without allowing them to reparse question text. */
export function hopV55AssistedAdviceTicketMatchesInput(ticket: unknown, input: BrewerChatInput): boolean {
  const read = readHopV55AssistedAdviceTicketV1(ticket);
  return read.status === 'readOnly' && inputMatchesTicket(input, read.ticket);
}

