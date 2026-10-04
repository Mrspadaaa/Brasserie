import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_FUNCTIONS,
  buildHopAdviceV1Wire,
  type HopAdviceAnalysisMode,
  type HopAdviceV1ActivityRequest,
  type HopAdviceV1ActivityReceipt,
  type HopAdviceV1ClientEntry,
  type HopAdviceV1ConversationHistoryRequest,
  type HopAdviceV1ConversationStatusReceipt,
  type HopAdviceV1ConversationStatusRequest,
  type HopAdviceV1MarkReadRequest,
  type HopAdviceV1MarkReadReceipt,
  type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1ResetReceipt,
  type HopAdviceV1ResetRequest,
  type HopAdviceV1RetryReceipt,
  type HopAdviceV1RetryRequest,
  type HopAdviceV1Scope,
  type HopAdviceV1SubmitReceipt,
  type HopAdviceV1WireInput,
} from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerAdvice, BrewerEvidence, BrewerJob, BrewerPending, BrewerProduct, BrewerProposal, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import { BREWER_HOP_ADVICE_REQUEST_FORMAT } from '../../functions/src/brewerHopAdviceProposal';
import { BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT, BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT } from '../../functions/src/brewerHopAdviceContextBinding';
import type { BrewerHopAdviceRequest } from '../../functions/src/brewerHopAdviceProposal';

export type BrewerHopAdviceV1CallableName =
  | typeof HOP_ADVICE_V1_FUNCTIONS.ask
  | typeof HOP_ADVICE_V1_FUNCTIONS.retry
  | typeof HOP_ADVICE_V1_FUNCTIONS.conversation
  | typeof HOP_ADVICE_V1_FUNCTIONS.reset
  | typeof HOP_ADVICE_V1_FUNCTIONS.activity
  | typeof HOP_ADVICE_V1_FUNCTIONS.markRead;

/** Network/auth boundary is injectable. The default implementation loads Firebase only on call. */
export interface BrewerHopAdviceV1CallableTransport {
  currentUserKey(): Promise<string | null>;
  invoke(name: BrewerHopAdviceV1CallableName, payload: unknown): Promise<unknown>;
}

export type BrewerHopAdviceV1Read<T> =
  | { status: 'available'; value: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type BrewerHopAdviceV1HistoryTurn = BrewerHopAdviceV1Read<HopAdviceV1PublicTurn>;
export type BrewerHopAdviceV1ActivityJob = BrewerHopAdviceV1Read<HopAdviceV1PublicJob>;

/** A v1 turn is public DTO data. Its hopAdviceProposal property remains unknown. */
export interface BrewerHopAdviceV1HistoryView {
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
  turns: BrewerHopAdviceV1HistoryTurn[];
  generation: number;
  draft?: unknown;
}

/** Future/explicitly unsupported activity rows are retained but never promoted to current jobs. */
export interface BrewerHopAdviceV1ActivityView {
  protocol: typeof HOP_ADVICE_PROTOCOL_V1.name;
  jobs: BrewerHopAdviceV1ActivityJob[];
}

export interface BrewerHopAdviceV1Api {
  readonly ownerKey: string;
  userKey(): Promise<string>;
  ask(entry: HopAdviceV1ClientEntry): Promise<BrewerHopAdviceV1Read<HopAdviceV1SubmitReceipt>>;
  /** A runtime adapter can submit these already-built wire bytes without rebuilding them. */
  askWire(input: HopAdviceV1WireInput): Promise<BrewerHopAdviceV1Read<HopAdviceV1SubmitReceipt>>;
  retry(request: HopAdviceV1RetryRequest, expectedScope: HopAdviceV1Scope): Promise<BrewerHopAdviceV1Read<HopAdviceV1RetryReceipt>>;
  history(request: HopAdviceV1ConversationHistoryRequest): Promise<BrewerHopAdviceV1Read<BrewerHopAdviceV1HistoryView>>;
  status(request: HopAdviceV1ConversationStatusRequest): Promise<BrewerHopAdviceV1Read<HopAdviceV1ConversationStatusReceipt>>;
  reset(request: HopAdviceV1ResetRequest): Promise<BrewerHopAdviceV1Read<HopAdviceV1ResetReceipt>>;
  activity(request?: HopAdviceV1ActivityRequest): Promise<BrewerHopAdviceV1Read<BrewerHopAdviceV1ActivityView>>;
  markRead(request: HopAdviceV1MarkReadRequest): Promise<BrewerHopAdviceV1Read<HopAdviceV1MarkReadReceipt>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const integer = (value: unknown, minimum = 0): value is number => Number.isSafeInteger(value) && (value as number) >= minimum;
const onlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) => Object.keys(value).every((key) => allowed.includes(key));
const exactKeys = (value: Record<string, unknown>, allowed: readonly string[]) => Object.keys(value).length === allowed.length
  && allowed.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const clone = <T>(value: T): T => structuredClone(value);

function serializable(value: unknown, ancestors = new WeakSet<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || value === undefined || ancestors.has(value)) return false;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
  ancestors.add(value);
  const valid = Array.isArray(value)
    ? value.every((entry) => serializable(entry, ancestors))
    : Object.values(value as Record<string, unknown>).every((entry) => serializable(entry, ancestors));
  ancestors.delete(value);
  return valid;
}

function assertScope(value: unknown): asserts value is HopAdviceV1Scope {
  if (!isRecord(value) || !exactKeys(value, ['kind', 'id'])
    || !['recipe', 'batch', 'draft', 'app'].includes(String(value.kind)) || !text(value.id)) {
    throw new Error('Scope v1 invalide.');
  }
}

function sameScope(left: unknown, right: HopAdviceV1Scope): boolean {
  return isRecord(left) && left.kind === right.kind && left.id === right.id;
}

function unsupported<T>(snapshot: unknown, reason: string): BrewerHopAdviceV1Read<T> {
  return { status: 'unsupportedReadOnly', snapshot, reason };
}

function invalid<T>(reason: string): BrewerHopAdviceV1Read<T> { return { status: 'invalid', reason }; }

type ProtocolRead =
  | { status: 'known'; record: Record<string, unknown> }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

function readProtocol(value: unknown): ProtocolRead {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Réponse hopAdviceReadonlyV1 non objet.' };
  if (value.protocol !== HOP_ADVICE_PROTOCOL_V1.name) {
    return { status: 'unsupportedReadOnly', snapshot: value,
      reason: 'Protocole de réponse futur ou absent; contenu conservé sans réinterprétation.' };
  }
  return { status: 'known', record: value };
}

function validAdvice(value: unknown): value is BrewerAdvice {
  if (!isRecord(value) || !onlyKeys(value, ['level', 'summary', 'action', 'why', 'watch', 'question', 'evidenceIds', 'productUrls'])
    || !['info', 'attention', 'urgent'].includes(String(value.level))
    || !['summary', 'action', 'why', 'watch', 'question'].every((key) => typeof value[key] === 'string')
    || !Array.isArray(value.evidenceIds) || !value.evidenceIds.every((id) => typeof id === 'string')) return false;
  return value.productUrls === undefined || Array.isArray(value.productUrls) && value.productUrls.every((url) => typeof url === 'string');
}

function validEvidence(value: unknown): value is BrewerEvidence {
  if (!isRecord(value) || !onlyKeys(value, ['id', 'name', 'label', 'facts', 'limits', 'data', 'sources', 'products', 'model'])
    || !text(value.id) || !text(value.name) || typeof value.label !== 'string'
    || !Array.isArray(value.facts) || !value.facts.every((entry) => typeof entry === 'string')
    || !Array.isArray(value.limits) || !value.limits.every((entry) => typeof entry === 'string')
    || !Object.prototype.hasOwnProperty.call(value, 'data') || !serializable(value.data)) return false;
  if (value.sources !== undefined && (!Array.isArray(value.sources) || !value.sources.every((source) => isRecord(source)
    && exactKeys(source, ['title', 'url']) && typeof source.title === 'string' && typeof source.url === 'string'))) return false;
  if (value.products !== undefined && (!Array.isArray(value.products) || !value.products.every((product) => validProduct(product)))) return false;
  return value.model === undefined || typeof value.model === 'string';
}

function validProduct(value: unknown): value is BrewerProduct {
  if (!isRecord(value) || !onlyKeys(value, ['name', 'supplier', 'url', 'availability', 'availabilityText', 'checkedAt',
    'verifiedBy', 'stockEvidence', 'canonicalUrl', 'packageLabel', 'priceText', 'sku'])
    || !['name', 'supplier', 'url', 'availabilityText'].every((key) => typeof value[key] === 'string')
    || !['in_stock', 'out_of_stock', 'unknown'].includes(String(value.availability)) || !number(value.checkedAt)) return false;
  if (value.verifiedBy !== undefined && value.verifiedBy !== 'product-page') return false;
  if (value.stockEvidence !== undefined && !['visible-text', 'structured-data', 'none'].includes(String(value.stockEvidence))) return false;
  return ['canonicalUrl', 'packageLabel', 'priceText', 'sku'].every((key) => value[key] === undefined || typeof value[key] === 'string');
}

function validTurnProposalFields(value: Record<string, unknown>): boolean {
  const knownKeys = ['protocol', 'id', 'operationId', 'question', 'advice', 'evidence', 'createdAt', 'model', 'reviewed',
    'reviewModel', 'reviewReason', 'mode', 'contextLabel', 'proposal', 'hopAdviceProposal'];
  if (!onlyKeys(value, knownKeys) || !text(value.id) || !text(value.operationId) || typeof value.question !== 'string'
    || !validAdvice(value.advice) || !Array.isArray(value.evidence) || !value.evidence.every(validEvidence)
    || !number(value.createdAt) || !text(value.model) || typeof value.reviewed !== 'boolean' || !text(value.contextLabel)) return false;
  if (value.reviewModel !== undefined && !text(value.reviewModel)) return false;
  if (value.reviewReason !== undefined && !['fast', 'requested', 'sensitive', 'repair', 'complexity', 'research'].includes(String(value.reviewReason))) return false;
  if (value.mode !== undefined && !['fast', 'auto', 'deep'].includes(String(value.mode))) return false;
  if (value.proposal !== undefined && !serializable(value.proposal)) return false;
  // `hopAdviceProposal` deliberately remains opaque until the canonical reception reader runs.
  if (Object.prototype.hasOwnProperty.call(value, 'hopAdviceProposal') && !serializable(value.hopAdviceProposal)) return false;
  return true;
}

/** Validates public-turn fields but never interprets or casts hopAdviceProposal to its future schema. */
export function readHopAdviceV1PublicTurn(value: unknown): BrewerHopAdviceV1Read<HopAdviceV1PublicTurn> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  if (!validTurnProposalFields(protocol.record)) return invalid('PublicTurn v1 mal formé.');
  return { status: 'available', value: clone(protocol.record) as unknown as HopAdviceV1PublicTurn };
}

function validJob(value: Record<string, unknown>): value is Record<string, unknown> & BrewerJob {
  const allowed = ['protocol', 'id', 'operationId', 'scope', 'generation', 'question', 'label', 'status', 'stage', 'detail', 'model',
    'createdAt', 'updatedAt', 'startedAt', 'finishedAt', 'readAt', 'attempt', 'catalogueReceipts', 'scenarioReceipts', 'error'];
  if (!onlyKeys(value, allowed) || !text(value.id) || !text(value.operationId) || typeof value.question !== 'string'
    || !text(value.label) || !['queued', 'running', 'done', 'error', 'cancelled'].includes(String(value.status))
    || !['queued', 'context', 'analysis', 'tools', 'research', 'review', 'repair', 'saving', 'retry'].includes(String(value.stage))
    || !integer(value.generation) || !number(value.createdAt) || !number(value.updatedAt) || !integer(value.attempt)) return false;
  try { assertScope(value.scope); } catch { return false; }
  for (const key of ['detail', 'model'] as const) if (value[key] !== undefined && typeof value[key] !== 'string') return false;
  for (const key of ['startedAt', 'finishedAt', 'readAt'] as const) if (value[key] !== undefined && !number(value[key])) return false;
  if (value.catalogueReceipts !== undefined && (!Array.isArray(value.catalogueReceipts)
    || !value.catalogueReceipts.every((receipt) => isRecord(receipt)
      && exactKeys(receipt, ['operationId', 'kind', 'targetId', 'revision', 'fingerprint', 'committedAt', 'status'])
      && text(receipt.operationId) && text(receipt.kind) && text(receipt.targetId) && integer(receipt.revision, 1)
      && text(receipt.fingerprint) && text(receipt.committedAt) && receipt.status === 'committed'))) return false;
  if (value.scenarioReceipts !== undefined && (!Array.isArray(value.scenarioReceipts)
    || !value.scenarioReceipts.every((receipt) => isRecord(receipt)
      && exactKeys(receipt, ['scenarioId', 'operationId', 'revision', 'reference', 'committedAt'])
      && text(receipt.scenarioId) && text(receipt.operationId) && integer(receipt.revision, 1)
      && text(receipt.reference) && text(receipt.committedAt)))) return false;
  if (value.error !== undefined) {
    if (!isRecord(value.error) || !exactKeys(value.error, ['code', 'message', 'retryable'])
      || !text(value.error.code) || !text(value.error.message) || typeof value.error.retryable !== 'boolean') return false;
  }
  return true;
}

function readPublicJob(value: unknown): BrewerHopAdviceV1Read<HopAdviceV1PublicJob> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  if (protocol.record.protocol !== HOP_ADVICE_PROTOCOL_V1.name) return unsupported(value, 'Job d’un protocole futur.');
  if (!validJob(protocol.record)) return invalid('PublicJob v1 mal formé.');
  return { status: 'available', value: clone(protocol.record) as unknown as HopAdviceV1PublicJob };
}

function readPublicTurn(value: unknown): BrewerHopAdviceV1Read<HopAdviceV1PublicTurn> {
  return readHopAdviceV1PublicTurn(value);
}

function validateClientEntry(ownerKey: string, value: unknown): string | undefined {
  if (!isRecord(value) || !onlyKeys(value, ['scope', 'operationId', 'question', 'generation', 'phase', 'hopAdvice', 'analysisMode', 'draft', 'localJournal'])
    || !text(value.operationId) || typeof value.question !== 'string'
    || !['fast', 'auto', 'deep'].includes(String(value.analysisMode))) return 'Entrée client hopAdviceReadonlyV1 mal formée.';
  try { assertScope(value.scope); } catch { return 'Scope client hopAdviceReadonlyV1 invalide.'; }
  if (value.generation !== undefined && !integer(value.generation)) return 'Génération de requête invalide.';
  if (value.phase !== undefined && typeof value.phase !== 'string') return 'Phase de requête invalide.';
  if (!isRecord(value.hopAdvice) || value.hopAdvice.format !== BREWER_HOP_ADVICE_REQUEST_FORMAT
    || value.hopAdvice.question !== value.question || !text(value.hopAdvice.sourceReadingReference)) {
    return 'Question, format ou lecture du handoff ne correspondent pas.';
  }
  const request = value.hopAdvice as unknown as BrewerHopAdviceRequest;
  const contextLaunch = request.contextLaunch as unknown;
  if (!isRecord(contextLaunch) || contextLaunch.format !== BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT
    || contextLaunch.ownerKey !== ownerKey || !sameScope(contextLaunch.scope, value.scope)
    || contextLaunch.sourceReadingReference !== request.sourceReadingReference || !isRecord(contextLaunch.expected)
    || contextLaunch.expected.format !== BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT
    || !sameScope(contextLaunch.expected.scope, value.scope)) {
    return 'Owner/source du handoff différent de l’entrée client.';
  }
  const scope = value.scope as HopAdviceV1Scope;
  if (scope.kind === 'draft') {
    if (!Object.prototype.hasOwnProperty.call(value, 'draft') || Object.prototype.hasOwnProperty.call(value, 'localJournal')) {
      return 'Source draft différente du contrat client V1.';
    }
  } else if (scope.kind === 'batch') {
    if (Object.prototype.hasOwnProperty.call(value, 'draft')) return 'Source batch différente du contrat client V1.';
  } else if (Object.prototype.hasOwnProperty.call(value, 'draft') || Object.prototype.hasOwnProperty.call(value, 'localJournal')) {
    return 'Scope recipe/app avec source draft/journal inattendue.';
  }
  return undefined;
}

function validateWireInput(ownerKey: string, value: unknown): string | undefined {
  if (!isRecord(value) || value.mode !== HOP_ADVICE_PROTOCOL_V1.name
    || !onlyKeys(value, ['mode', 'scope', 'operationId', 'question', 'generation', 'phase', 'hopAdvice', 'analysisMode', 'draft', 'localJournal'])) {
    return 'Wire hopAdvice v1 futur, incomplet ou hors DTO exact.';
  }
  const { mode: _mode, ...entry } = value;
  return validateClientEntry(ownerKey, entry);
}

function readSubmitReceipt(value: unknown, expected: { scope: HopAdviceV1Scope; operationId: string; question: string; generation: number }):
  BrewerHopAdviceV1Read<HopAdviceV1SubmitReceipt> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  if (Object.keys(row).includes('job') === Object.keys(row).includes('turn')
    || !exactKeys(row, ['protocol', Object.prototype.hasOwnProperty.call(row, 'job') ? 'job' : 'turn'])) {
    return invalid('SubmitReceipt v1 doit contenir uniquement son job ou son turn.');
  }
  if (Object.prototype.hasOwnProperty.call(row, 'job')) {
    const job = readPublicJob(row.job);
    if (job.status === 'unsupportedReadOnly') return unsupported(value, job.reason);
    if (job.status === 'invalid') return job;
    if (!sameScope(job.value.scope, expected.scope) || job.value.operationId !== expected.operationId
      || job.value.question !== expected.question || job.value.generation !== expected.generation) {
      return invalid('Job reçu différent du scope, operationId, texte ou génération envoyés.');
    }
    return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: job.value } };
  }
  const turn = readPublicTurn(row.turn);
  if (turn.status === 'unsupportedReadOnly') return unsupported(value, turn.reason);
  if (turn.status === 'invalid') return turn;
  if (turn.value.operationId !== expected.operationId || turn.value.question !== expected.question) {
    return invalid('Turn reçu différent de l’opération ou de la question envoyées.');
  }
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: turn.value } };
}

function readRetryReceipt(value: unknown, request: HopAdviceV1RetryRequest, expectedScope: HopAdviceV1Scope): BrewerHopAdviceV1Read<HopAdviceV1RetryReceipt> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  if (Object.keys(row).includes('job') === Object.keys(row).includes('turn')
    || !exactKeys(row, ['protocol', Object.prototype.hasOwnProperty.call(row, 'job') ? 'job' : 'turn'])) {
    return invalid('RetryReceipt v1 doit contenir uniquement son job ou son turn.');
  }
  if (Object.prototype.hasOwnProperty.call(row, 'job')) {
    const job = readPublicJob(row.job);
    if (job.status === 'unsupportedReadOnly') return unsupported(value, job.reason);
    if (job.status === 'invalid') return job;
    if (!sameScope(job.value.scope, expectedScope) || job.value.operationId !== request.operationId
      || request.generation !== undefined && job.value.generation !== request.generation) {
      return invalid('Job retry différent de la portée, operationId ou génération attendus.');
    }
    return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: job.value } };
  }
  const turn = readPublicTurn(row.turn);
  if (turn.status === 'unsupportedReadOnly') return unsupported(value, turn.reason);
  if (turn.status === 'invalid') return turn;
  if (turn.value.operationId !== request.operationId) return invalid('Turn retry différent de l’operationId demandé.');
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: turn.value } };
}

function readPending(value: unknown, expectedOperationId: string): BrewerHopAdviceV1Read<BrewerPending> {
  if (!isRecord(value) || !exactKeys(value, ['operationId', 'question', 'until']) || value.operationId !== expectedOperationId
    || typeof value.question !== 'string' || !number(value.until)) return invalid('Pending différent ou mal formé.');
  return { status: 'available', value: clone(value) as unknown as BrewerPending };
}

function readStatusReceipt(value: unknown, request: HopAdviceV1ConversationStatusRequest):
  BrewerHopAdviceV1Read<HopAdviceV1ConversationStatusReceipt> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  const expectedGeneration = request.generation ?? 0;
  if (Object.prototype.hasOwnProperty.call(row, 'turn')) {
    if (!exactKeys(row, ['protocol', 'turn'])) return invalid('Status turn v1 contient des champs inattendus.');
    const turn = readPublicTurn(row.turn);
    if (turn.status === 'unsupportedReadOnly') return unsupported(value, turn.reason);
    if (turn.status === 'invalid') return turn;
    if (turn.value.operationId !== request.operationId) return invalid('Turn status différent de l’operationId demandé.');
    return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: turn.value } };
  }
  if (Object.prototype.hasOwnProperty.call(row, 'job')) {
    if (!onlyKeys(row, ['protocol', 'job', 'pending'])) return invalid('Status job v1 contient des champs inattendus.');
    const job = readPublicJob(row.job);
    if (job.status === 'unsupportedReadOnly') return unsupported(value, job.reason);
    if (job.status === 'invalid') return job;
    if (!sameScope(job.value.scope, request.scope) || job.value.operationId !== request.operationId
      || job.value.generation !== expectedGeneration) return invalid('Job status différent du scope/opération/génération attendus.');
    if (row.pending !== undefined) {
      const pending = readPending(row.pending, request.operationId);
      if (pending.status !== 'available') return pending;
      return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: job.value, pending: pending.value } };
    }
    return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: job.value } };
  }
  if (Object.prototype.hasOwnProperty.call(row, 'pending')) {
    if (!exactKeys(row, ['protocol', 'pending'])) return invalid('Status pending v1 contient des champs inattendus.');
    const pending = readPending(row.pending, request.operationId);
    if (pending.status !== 'available') return pending;
    return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, pending: pending.value } };
  }
  if (!exactKeys(row, ['protocol'])) return invalid('Status vide v1 contient des champs inattendus.');
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name } };
}

function readHistory(value: unknown): BrewerHopAdviceV1Read<BrewerHopAdviceV1HistoryView> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  if (!onlyKeys(row, ['protocol', 'turns', 'generation', 'draft']) || !Array.isArray(row.turns) || !integer(row.generation)) {
    return invalid('Historique hopAdvice v1 mal formé.');
  }
  const turns: BrewerHopAdviceV1HistoryTurn[] = row.turns.map((turn) => readPublicTurn(turn));
  if (turns.some((turn) => turn.status === 'invalid')) return invalid('Un turn de l’historique hopAdvice v1 est invalide.');
  if (row.draft !== undefined && !serializable(row.draft)) return invalid('Draft d’historique non sérialisable.');
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, turns, generation: row.generation as number,
    ...(row.draft === undefined ? {} : { draft: clone(row.draft) }) } };
}

function readActivity(value: unknown): BrewerHopAdviceV1Read<BrewerHopAdviceV1ActivityView> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  if (!exactKeys(row, ['protocol', 'jobs']) || !Array.isArray(row.jobs)) return invalid('Activity hopAdvice v1 mal formée.');
  const jobs: BrewerHopAdviceV1ActivityJob[] = row.jobs.map((job) => readPublicJob(job));
  if (jobs.some((job) => job.status === 'invalid')) return invalid('Un job de l’activity hopAdvice v1 est invalide.');
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, jobs } };
}

function readReset(value: unknown, request: HopAdviceV1ResetRequest): BrewerHopAdviceV1Read<HopAdviceV1ResetReceipt> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  if (!exactKeys(row, ['protocol', 'generation']) || !integer(row.generation)
    || row.generation <= request.generation) return invalid('ResetReceipt v1 doit déclarer une nouvelle génération connue.');
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, generation: row.generation as number } };
}

function readMarkRead(value: unknown): BrewerHopAdviceV1Read<HopAdviceV1MarkReadReceipt> {
  const protocol = readProtocol(value);
  if (protocol.status === 'unsupportedReadOnly' || protocol.status === 'invalid') return protocol;
  const row = protocol.record;
  if (!exactKeys(row, ['protocol', 'ok']) || row.ok !== true) return invalid('MarkReadReceipt v1 mal formé.');
  return { status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name, ok: true } };
}

function isClientFunction(name: unknown): name is BrewerHopAdviceV1CallableName {
  return name === HOP_ADVICE_V1_FUNCTIONS.ask || name === HOP_ADVICE_V1_FUNCTIONS.retry
    || name === HOP_ADVICE_V1_FUNCTIONS.conversation || name === HOP_ADVICE_V1_FUNCTIONS.reset
    || name === HOP_ADVICE_V1_FUNCTIONS.activity || name === HOP_ADVICE_V1_FUNCTIONS.markRead;
}

function assertCallableTransport(value: unknown): asserts value is BrewerHopAdviceV1CallableTransport {
  if (!isRecord(value) || typeof value.currentUserKey !== 'function' || typeof value.invoke !== 'function') {
    throw new Error('Transport callable hopAdvice v1 incomplet.');
  }
}

export interface BrewerHopAdviceV1CallableTransport {
  currentUserKey(): Promise<string | null>;
  invoke(name: BrewerHopAdviceV1CallableName, payload: unknown): Promise<unknown>;
}

const firebaseCallableTransport: BrewerHopAdviceV1CallableTransport = {
  async currentUserKey() {
    const { auth } = await import('./firebase');
    return auth.currentUser?.uid ?? null;
  },
  async invoke(name, payload) {
    const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
    const timeout = name === HOP_ADVICE_V1_FUNCTIONS.ask || name === HOP_ADVICE_V1_FUNCTIONS.retry ? 35000
      : name === HOP_ADVICE_V1_FUNCTIONS.reset ? 65000 : 15000;
    const callable = httpsCallable<unknown, unknown>(functions, name, { timeout });
    return (await callable(payload)).data;
  }
};

export function createBrewerHopAdviceApiV1(input: { ownerKey: string; transport?: BrewerHopAdviceV1CallableTransport }): BrewerHopAdviceV1Api {
  if (typeof input.ownerKey !== 'string' || !input.ownerKey.trim() || input.ownerKey.trim() !== input.ownerKey) {
    throw new Error('ownerKey courant requis pour l’API hopAdvice v1.');
  }
  const ownerKey = input.ownerKey;
  const transport = input.transport ?? firebaseCallableTransport;
  assertCallableTransport(transport);
  const assertOwner = async () => {
    const currentUser = await transport.currentUserKey();
    if (currentUser !== ownerKey) throw new Error('Session Firebase différente de l’ownerKey capturé pour hopAdvice v1.');
    return currentUser;
  };
  const call = async (name: BrewerHopAdviceV1CallableName, payload: unknown) => {
    if (!isClientFunction(name)) throw new Error('Callable hors du contrat client hopAdvice v1.');
    await assertOwner();
    return transport.invoke(name, payload);
  };
  const submitWire = async (wire: HopAdviceV1WireInput): Promise<BrewerHopAdviceV1Read<HopAdviceV1SubmitReceipt>> => {
    const problem = validateWireInput(ownerKey, wire);
    if (problem) return invalid(problem);
    const raw = await call(HOP_ADVICE_V1_FUNCTIONS.ask, wire);
    return readSubmitReceipt(raw, { scope: wire.scope, operationId: wire.operationId, question: wire.question,
      generation: wire.generation ?? 0 });
  };

  return {
    ownerKey,
    userKey: assertOwner,
    async ask(entry) {
      const problem = validateClientEntry(ownerKey, entry);
      if (problem) return invalid(problem);
      const wire = buildHopAdviceV1Wire(entry);
      return submitWire(wire);
    },
    askWire: submitWire,
    async retry(request, expectedScope) {
      if (!validateRetryRequest(request)) return invalid('RetryRequest hopAdvice v1 mal formé.');
      assertScope(expectedScope);
      const raw = await call(HOP_ADVICE_V1_FUNCTIONS.retry, request);
      return readRetryReceipt(raw, request, expectedScope);
    },
    async history(request) {
      if (!validateConversationHistoryRequest(request)) return invalid('HistoryRequest hopAdvice v1 mal formé.');
      const raw = await call(HOP_ADVICE_V1_FUNCTIONS.conversation, request);
      return readHistory(raw);
    },
    async status(request) {
      if (!validateConversationStatusRequest(request)) return invalid('StatusRequest hopAdvice v1 mal formé.');
      const raw = await call(HOP_ADVICE_V1_FUNCTIONS.conversation, request);
      return readStatusReceipt(raw, request);
    },
    async reset(request) {
      if (!validateResetRequest(request)) return invalid('ResetRequest hopAdvice v1 mal formé.');
      const raw = await call(HOP_ADVICE_V1_FUNCTIONS.reset, request);
      return readReset(raw, request);
    },
    async activity(request = {}) {
      if (!isRecord(request) || Object.keys(request).length !== 0) return invalid('ActivityRequest hopAdvice v1 ne porte aucun champ.');
      const raw = await call(HOP_ADVICE_V1_FUNCTIONS.activity, {});
      return readActivity(raw);
    },
    async markRead(request) {
      if (!isRecord(request) || !exactKeys(request, ['jobId']) || !text(request.jobId)) return invalid('MarkReadRequest hopAdvice v1 mal formé.');
      const raw = await call(HOP_ADVICE_V1_FUNCTIONS.markRead, request);
      const result = readMarkRead(raw);
      return result;
    },
  };
}

function validateRetryRequest(value: unknown): value is HopAdviceV1RetryRequest {
  return isRecord(value) && onlyKeys(value, ['jobId', 'operationId', 'generation']) && text(value.jobId)
    && text(value.operationId) && (value.generation === undefined || integer(value.generation));
}

function validateConversationHistoryRequest(value: unknown): value is HopAdviceV1ConversationHistoryRequest {
  if (!isRecord(value) || !onlyKeys(value, ['scope', 'before']) || Object.prototype.hasOwnProperty.call(value, 'operationId')
    || Object.prototype.hasOwnProperty.call(value, 'generation')) return false;
  try { assertScope(value.scope); } catch { return false; }
  return value.before === undefined || number(value.before);
}

function validateConversationStatusRequest(value: unknown): value is HopAdviceV1ConversationStatusRequest {
  if (!isRecord(value) || !onlyKeys(value, ['scope', 'operationId', 'generation', 'before']) || !text(value.operationId)) return false;
  try { assertScope(value.scope); } catch { return false; }
  return (value.generation === undefined || integer(value.generation)) && (value.before === undefined || number(value.before));
}

function validateResetRequest(value: unknown): value is HopAdviceV1ResetRequest {
  if (!isRecord(value) || !exactKeys(value, ['scope', 'operationId', 'generation']) || !text(value.operationId)
    || !integer(value.generation)) return false;
  try { assertScope(value.scope); return true; } catch { return false; }
}
