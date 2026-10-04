import type { BrewerHopAdviceRequest } from './brewerHopAdviceProposal.js';
import type { BrewerHopAdviceRequestV3 } from './brewerHopAdviceSemanticV3.js';
import type { BrewerJob, BrewerPending, BrewerTurn } from './companionTypes.js';

/** Shared browser/server names. This module has no Node, Firebase or provider runtime dependency. */
export const HOP_ADVICE_PROTOCOL_V1 = Object.freeze({
  name: 'hopAdviceReadonlyV1',
  version: 1
} as const);

export const HOP_ADVICE_V1_COLLECTIONS = Object.freeze({
  jobs: 'brewerHopAdviceJobsV1',
  conversations: 'brewerHopAdviceConversationsV1',
  chats: 'brewerHopAdviceChatsV1',
  contexts: 'brewerHopAdviceContextsV1'
} as const);

export const HOP_ADVICE_V1_FUNCTIONS = Object.freeze({
  ask: 'askBrewerHopAdviceV1',
  dispatch: 'dispatchBrewerHopAdviceV1',
  process: 'processBrewerHopAdviceV1',
  conversation: 'getBrewerHopAdviceConversationV1',
  reset: 'resetBrewerHopAdviceConversationV1',
  activity: 'getBrewerHopAdviceActivityV1',
  markRead: 'markBrewerHopAdviceReadV1',
  retry: 'retryBrewerHopAdviceQuestionV1'
} as const);

export type HopAdviceAnalysisMode = 'fast' | 'auto' | 'deep';
export type HopAdviceV1Scope =
  | { kind: 'recipe'; id: string }
  | { kind: 'batch'; id: string }
  | { kind: 'draft'; id: string }
  | { kind: 'app'; id: string };

interface HopAdviceV1ClientCommon {
  operationId: string;
  question: string;
  generation?: number;
  phase?: string;
  hopAdvice: BrewerHopAdviceRequest;
}

type HopAdviceV1SourceFields<TDraft, TLocalJournal> =
  | { scope: { kind: 'draft'; id: string }; draft: TDraft; localJournal?: never }
  | { scope: { kind: 'batch'; id: string }; draft?: never; localJournal?: TLocalJournal }
  | { scope: { kind: 'recipe' | 'app'; id: string }; draft?: never; localJournal?: never };

/** Precisely shaped client entry; source data remains generic and is passed through unchanged. */
export type HopAdviceV1ClientEntry<TDraft = unknown, TLocalJournal = unknown> =
  HopAdviceV1ClientCommon &
  HopAdviceV1SourceFields<TDraft, TLocalJournal> &
  { analysisMode: HopAdviceAnalysisMode };

/**
 * `askBrewerHopAdviceV1` request. `mode` and `analysisMode` are both required;
 * the canonical C4 handoff is not an open object. No lifecycle request carries this marker.
 */
export type HopAdviceV1WireInputV2<TDraft = unknown, TLocalJournal = unknown> =
  HopAdviceV1ClientCommon &
  HopAdviceV1SourceFields<TDraft, TLocalJournal> &
  { mode: typeof HOP_ADVICE_PROTOCOL_V1.name; analysisMode: HopAdviceAnalysisMode };

export type HopAdviceV1WireInputV3<TDraft = unknown, TLocalJournal = unknown> =
  Omit<HopAdviceV1ClientCommon, 'hopAdvice'> &
  HopAdviceV1SourceFields<TDraft, TLocalJournal> &
  { hopAdvice: BrewerHopAdviceRequestV3; mode: typeof HOP_ADVICE_PROTOCOL_V1.name; analysisMode: HopAdviceAnalysisMode };

/** V3 entry keeps the semantic request explicit; it never passes through the V2 client contract. */
export type HopAdviceV1ClientEntryV3<TDraft = unknown, TLocalJournal = unknown> =
  Omit<HopAdviceV1ClientCommon, 'hopAdvice'> &
  HopAdviceV1SourceFields<TDraft, TLocalJournal> &
  { hopAdvice: BrewerHopAdviceRequestV3; analysisMode: HopAdviceAnalysisMode };

/** Historical public name remains the strict V2 request consumed by the original runtime adapter. */
export type HopAdviceV1WireInput<TDraft = unknown, TLocalJournal = unknown> = HopAdviceV1WireInputV2<TDraft, TLocalJournal>;

/** New admission/worker boundary explicitly discriminates V2 and V3 without widening the old alias. */
export type HopAdviceV1AnyWireInput<TDraft = unknown, TLocalJournal = unknown> =
  | HopAdviceV1WireInputV2<TDraft, TLocalJournal>
  | HopAdviceV1WireInputV3<TDraft, TLocalJournal>;

export type HopAdviceV1PublicJob = BrewerJob & { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name };
export type HopAdviceV1UnsupportedJob = BrewerJob & { protocol: 'unsupported' };
/** V1 returns proposal bytes for the reader to qualify; the transport does not claim a future v4 shape. */
export type HopAdviceV1PublicTurn = Omit<BrewerTurn, 'hopAdviceProposal'> & {
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
  hopAdviceProposal?: unknown;
};

/** `mode` is mandatory only for ask; lifecycle callables are selected by their V1 endpoint name. */
export type HopAdviceV1SubmitReceipt =
  | { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name; job: HopAdviceV1PublicJob }
  | { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name; turn: HopAdviceV1PublicTurn };
export type HopAdviceV1RetryReceipt = HopAdviceV1SubmitReceipt;

/** `getBrewerHopAdviceConversationV1` history request; no wire marker or operationId. */
export interface HopAdviceV1ConversationHistoryRequest {
  scope: HopAdviceV1Scope;
  before?: number;
  operationId?: never;
  generation?: never;
}
/** Status/pending lookup variant; marker absent, operationId and scope required. */
export interface HopAdviceV1ConversationStatusRequest {
  scope: HopAdviceV1Scope;
  operationId: string;
  generation?: number;
  before?: number;
}
export type HopAdviceV1ConversationRequest =
  | HopAdviceV1ConversationHistoryRequest
  | HopAdviceV1ConversationStatusRequest;

export type HopAdviceV1ConversationStatusReceipt =
  | { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name; turn: HopAdviceV1PublicTurn }
  | { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name; job: HopAdviceV1PublicJob; pending?: BrewerPending }
  | { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name; pending: BrewerPending }
  | { protocol: typeof HOP_ADVICE_PROTOCOL_V1.name };
export interface HopAdviceV1ConversationHistoryReceipt<TDraft = unknown> {
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
  turns: HopAdviceV1PublicTurn[];
  generation: number;
  draft?: TDraft;
}
export type HopAdviceV1ConversationReceipt<TDraft = unknown> =
  | HopAdviceV1ConversationStatusReceipt
  | HopAdviceV1ConversationHistoryReceipt<TDraft>;

/** `resetBrewerHopAdviceConversationV1`: marker absent; scope, operation and generation required. */
export interface HopAdviceV1ResetRequest {
  scope: HopAdviceV1Scope;
  operationId: string;
  generation: number;
}
export interface HopAdviceV1ResetReceipt {
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
  generation: number;
}
/** `retryBrewerHopAdviceQuestionV1`: marker absent; generation is optional. */
export interface HopAdviceV1RetryRequest {
  jobId: string;
  operationId: string;
  generation?: number;
}
/** `getBrewerHopAdviceActivityV1` has no payload fields and no wire marker. */
export interface HopAdviceV1ActivityRequest {}
export interface HopAdviceV1ActivityReceipt {
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
  jobs: Array<HopAdviceV1PublicJob | HopAdviceV1UnsupportedJob>;
}
/** `markBrewerHopAdviceReadV1`: marker absent; jobId is required. */
export interface HopAdviceV1MarkReadRequest { jobId: string }
export interface HopAdviceV1MarkReadReceipt {
  ok: true;
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
}

/**
 * Project a typed entry to the dedicated callable wire format. Question text,
 * source, draft/journal, phase and handoff are not trimmed, remapped or inferred.
 */
export function buildHopAdviceV1Wire<TDraft = unknown, TLocalJournal = unknown>(
  entry: HopAdviceV1ClientEntry<TDraft, TLocalJournal>
): HopAdviceV1WireInput<TDraft, TLocalJournal> {
  const source = entry.scope.kind === 'draft'
    ? { draft: entry.draft }
    : entry.scope.kind === 'batch' && entry.localJournal !== undefined
      ? { localJournal: entry.localJournal }
      : {};
  return {
    mode: HOP_ADVICE_PROTOCOL_V1.name,
    analysisMode: entry.analysisMode,
    scope: entry.scope,
    operationId: entry.operationId,
    question: entry.question,
    ...(entry.generation === undefined ? {} : { generation: entry.generation }),
    ...source,
    ...(entry.phase === undefined ? {} : { phase: entry.phase }),
    hopAdvice: entry.hopAdvice
  } as HopAdviceV1WireInput<TDraft, TLocalJournal>;
}

/** Build a semantic V3 wire without projecting it through the legacy V2 handoff type. */
export function buildHopAdviceV1WireV3<TDraft = unknown, TLocalJournal = unknown>(
  entry: HopAdviceV1ClientEntryV3<TDraft, TLocalJournal>
): HopAdviceV1WireInputV3<TDraft, TLocalJournal> {
  if (entry.question !== entry.hopAdvice.question
    || entry.scope.kind !== entry.hopAdvice.contextLaunch.scope.kind
    || entry.scope.id !== entry.hopAdvice.contextLaunch.scope.id) {
    throw new Error('La question ou le scope V1 doit correspondre exactement à la RequestV3.');
  }
  const source = entry.scope.kind === 'draft'
    ? { draft: entry.draft }
    : entry.scope.kind === 'batch' && entry.localJournal !== undefined
      ? { localJournal: entry.localJournal }
      : {};
  return {
    mode: HOP_ADVICE_PROTOCOL_V1.name,
    analysisMode: entry.analysisMode,
    scope: entry.scope,
    operationId: entry.operationId,
    question: entry.question,
    ...(entry.generation === undefined ? {} : { generation: entry.generation }),
    ...source,
    ...(entry.phase === undefined ? {} : { phase: entry.phase }),
    hopAdvice: entry.hopAdvice,
  } as HopAdviceV1WireInputV3<TDraft, TLocalJournal>;
}

/**
 * Local conversation partition. It intentionally differs from the server SHA-256
 * document ID. JSON tuple encoding prevents delimiter collisions and namespaces
 * the owner, protocol name/version, normalized source kind and source ID.
 * Draft and saved-recipe conversations share a partition, as on the server.
 */
export function hopAdviceV1ClientPartitionKey(ownerKey: string, scope: HopAdviceV1Scope): string {
  if (typeof ownerKey !== 'string' || !ownerKey.trim()) throw new Error('Clé locale du propriétaire manquante.');
  const sourceKind = scope.kind === 'draft' ? 'recipe' : scope.kind;
  return JSON.stringify([
    'laffinee',
    HOP_ADVICE_PROTOCOL_V1.name,
    HOP_ADVICE_PROTOCOL_V1.version,
    ownerKey,
    sourceKind,
    scope.id
  ]);
}
