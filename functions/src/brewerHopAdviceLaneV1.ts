import { createHash } from 'node:crypto';
import { HOP_ADVICE_PROTOCOL_V1, HOP_ADVICE_V1_COLLECTIONS } from './brewerHopAdviceTransportV1.js';
import type { HopAdviceAnalysisMode, HopAdviceV1Scope, HopAdviceV1AnyWireInput,
  HopAdviceV1WireInputV2, HopAdviceV1WireInputV3 } from './brewerHopAdviceTransportV1.js';
import { BREWER_HOP_ADVICE_REQUEST_FORMAT } from './brewerHopAdviceProposal.js';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
  assertBrewerHopAdviceRequestV3,
  measureBrewerHopAdviceSemanticJsonWire,
  type BrewerHopAdviceRequestV3,
} from './brewerHopAdviceSemanticV3.js';
export { HOP_ADVICE_PROTOCOL_V1, HOP_ADVICE_V1_COLLECTIONS, HOP_ADVICE_V1_FUNCTIONS } from './brewerHopAdviceTransportV1.js';
export type {
  HopAdviceAnalysisMode,
  HopAdviceV1ActivityReceipt,
  HopAdviceV1ActivityRequest,
  HopAdviceV1ClientEntry,
  HopAdviceV1ConversationHistoryReceipt,
  HopAdviceV1ConversationHistoryRequest,
  HopAdviceV1ConversationReceipt,
  HopAdviceV1ConversationRequest,
  HopAdviceV1ConversationStatusReceipt,
  HopAdviceV1ConversationStatusRequest,
  HopAdviceV1MarkReadReceipt,
  HopAdviceV1MarkReadRequest,
  HopAdviceV1PublicJob,
  HopAdviceV1PublicTurn,
  HopAdviceV1ResetReceipt,
  HopAdviceV1ResetRequest,
  HopAdviceV1RetryReceipt,
  HopAdviceV1RetryRequest,
  HopAdviceV1SubmitReceipt,
  HopAdviceV1UnsupportedJob,
  HopAdviceV1Scope,
  HopAdviceV1WireInput,
  HopAdviceV1AnyWireInput
} from './brewerHopAdviceTransportV1.js';

/**
 * Wire and storage contract for the isolated assisted-reading lane.
 * Keep this module free of Firebase/provider imports so admission and version
 * checks remain executable before any side effect.
 */
interface ParsedHopAdviceV1WireCommon {
  /** Original decoded request data. Retained to bind retries to the full request. */
  /** Exact JSON serialization size checked before field projection. */
  originalBytes: number;
  /** Ordinary chat fields plus analysis mode, with the transport marker removed. */
  chatInput: Record<string, unknown> & { mode: HopAdviceAnalysisMode };
}

export type ParsedHopAdviceV1Wire =
  | (ParsedHopAdviceV1WireCommon & { requestVersion: 'request-v2'; wireInput: HopAdviceV1WireInputV2 })
  | (ParsedHopAdviceV1WireCommon & { requestVersion: 'request-v3'; wireInput: HopAdviceV1WireInputV3; semanticRequest: BrewerHopAdviceRequestV3 });

export interface HopAdviceV1CanonicalChatInput {
  scope: HopAdviceV1Scope;
  operationId: string;
  question: string;
  generation?: number;
}

const allowedWireFields = new Set([
  'mode', 'analysisMode', 'scope', 'operationId', 'question', 'generation',
  'draft', 'localJournal', 'phase', 'hopAdvice'
]);
const analysisModes = new Set<HopAdviceAnalysisMode>(['fast', 'auto', 'deep']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assertJsonValues(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Le contenu du conseil contient une valeur non finie.');
    return;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('Le contenu du conseil n’est pas un JSON valide.');
    seen.add(value);
    for (const child of value) assertJsonValues(child, seen);
    seen.delete(value);
    return;
  }
  if (isRecord(value)) {
    if (seen.has(value)) throw new Error('Le contenu du conseil n’est pas un JSON valide.');
    seen.add(value);
    for (const child of Object.values(value)) {
      if (child === undefined || typeof child === 'function' || typeof child === 'symbol' || typeof child === 'bigint')
        throw new Error('Le contenu du conseil n’est pas un JSON valide.');
      assertJsonValues(child, seen);
    }
    seen.delete(value);
    return;
  }
  throw new Error('Le contenu du conseil n’est pas un JSON valide.');
}

/**
 * Check the complete original request before extraction, normalization or
 * handoff validation. Unknown top-level properties fail closed.
 */
export function parseHopAdviceV1Wire(raw: unknown): ParsedHopAdviceV1Wire {
  let json: string | undefined;
  try { json = JSON.stringify(raw); } catch { /* reported below */ }
  if (typeof json !== 'string') throw new Error('Le contenu du conseil n’est pas un JSON valide.');
  const originalBytes = Buffer.byteLength(json, 'utf8');
  if (originalBytes > 100_000) throw new Error('Contexte trop volumineux.');
  assertJsonValues(raw);
  if (!isRecord(raw)) throw new Error('Requête de lecture assistée invalide.');
  if (Object.prototype.hasOwnProperty.call(raw, 'editableTargets'))
    throw new Error('La lecture assistée ne prépare aucune modification de champs.');
  if (Object.keys(raw).some((key) => !allowedWireFields.has(key)))
    throw new Error('La requête de lecture assistée contient un champ de transport inconnu.');
  if (raw.mode !== HOP_ADVICE_PROTOCOL_V1.name)
    throw new Error('Protocole de lecture assistée absent ou non pris en charge.');
  if (!analysisModes.has(raw.analysisMode as HopAdviceAnalysisMode))
    throw new Error('Mode d’analyse invalide.');
  if (!isRecord(raw.hopAdvice)) throw new Error('Transmission de lecture assistée manquante.');
  const { mode: _wireMode, analysisMode, ...rest } = raw;
  const chatInput = { ...rest, mode: analysisMode as HopAdviceAnalysisMode };
  const requestFormat = raw.hopAdvice.format;
  // Preserve the old lane parser's loose projection for source compatibility;
  // admission/worker still run the strict RequestV2 validator before effects.
  if (requestFormat === undefined || requestFormat === BREWER_HOP_ADVICE_REQUEST_FORMAT) {
    return { requestVersion: 'request-v2', wireInput: raw as unknown as HopAdviceV1WireInputV2, originalBytes, chatInput };
  }
  if (requestFormat !== BREWER_HOP_ADVICE_REQUEST_FORMAT_V3)
    throw new Error('Version du handoff assisté absente ou non prise en charge.');
  const measured = measureBrewerHopAdviceSemanticJsonWire(raw);
  if (measured.utf8Bytes !== originalBytes || measured.utf8Bytes > 100_000)
    throw new Error('Wire sémantique trop volumineux ou mesure JSON incohérente.');
  if (measured.maxDepth > 18) throw new Error('Wire sémantique trop profond.');
  assertBrewerHopAdviceRequestV3(raw.hopAdvice);
  const semanticRequest = raw.hopAdvice as unknown as BrewerHopAdviceRequestV3;
  if (raw.question !== semanticRequest.question
    || semanticRequest.sourceReadingReference !== semanticRequest.sourceView.archiveIdentity.contentReference)
    throw new Error('La question V1, la vue sémantique et la référence source doivent correspondre exactement.');
  const scopeKind = isRecord(raw.scope) ? raw.scope.kind : undefined;
  if (scopeKind === 'draft' && (!Object.prototype.hasOwnProperty.call(raw, 'draft')
      || Object.prototype.hasOwnProperty.call(raw, 'localJournal'))
    || scopeKind === 'batch' && Object.prototype.hasOwnProperty.call(raw, 'draft')
    || (scopeKind === 'recipe' || scopeKind === 'app')
      && (Object.prototype.hasOwnProperty.call(raw, 'draft') || Object.prototype.hasOwnProperty.call(raw, 'localJournal'))) {
    throw new Error('Les champs source du wire sémantique ne correspondent pas à son scope.');
  }
  return { requestVersion: 'request-v3', wireInput: raw as unknown as HopAdviceV1WireInputV3,
    semanticRequest, originalBytes, chatInput };
}

/** Legacy admission must reject both the marker and an attached handoff. */
export function assertOrdinaryCompanionWire(raw: unknown): void {
  if (!isRecord(raw)) return;
  if (raw.mode === HOP_ADVICE_PROTOCOL_V1.name ||
      Object.prototype.hasOwnProperty.call(raw, 'hopAdvice') ||
      Object.prototype.hasOwnProperty.call(raw, 'analysisMode'))
    throw new Error('La lecture assistée exige son endpoint versionné. Aucune question ordinaire n’a été créée.');
}

function sorted(value: any): any {
  if (Array.isArray(value)) return value.map(sorted);
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => [key, sorted(child)]));
}

export function hopAdviceV1InputDigest(wireInput: HopAdviceV1AnyWireInput): string {
  return createHash('sha256')
    .update(JSON.stringify(sorted({ protocol: HOP_ADVICE_PROTOCOL_V1, wireInput })), 'utf8')
    .digest('hex');
}

export function hasHopAdviceV1Stamp(job: unknown): boolean {
  if (!isRecord(job) || !isRecord(job.protocol)) return false;
  if (Object.keys(job.protocol).length !== 2 ||
      !Object.prototype.hasOwnProperty.call(job.protocol, 'name') ||
      !Object.prototype.hasOwnProperty.call(job.protocol, 'version')) return false;
  return job.protocol.name === HOP_ADVICE_PROTOCOL_V1.name && job.protocol.version === HOP_ADVICE_PROTOCOL_V1.version;
}

/** A V1 job is visible/retryable only while its own V1 conversation generation remains current. */
export function isHopAdviceV1JobInCurrentGeneration(job: unknown, conversation: unknown): boolean {
  if (!isRecord(job) || !hasHopAdviceV1Stamp(job) || !isRecord(conversation) ||
      conversation.protocol !== HOP_ADVICE_PROTOCOL_V1.name || typeof conversation.generation !== 'number' ||
      !Number.isSafeInteger(conversation.generation)) return false;
  return job.generation === conversation.generation;
}

/** Recheck both stamp and digest on the job snapshot before using any provider. */
export function validateHopAdviceV1Job(job: unknown): ParsedHopAdviceV1Wire {
  if (!hasHopAdviceV1Stamp(job)) throw new Error('Version de lecture assistée absente ou non prise en charge.');
  const record = job as Record<string, any>;
  const parsed = parseHopAdviceV1Wire(record.wireInput);
  if (record.inputDigest !== hopAdviceV1InputDigest(parsed.wireInput))
    throw new Error('Transmission de lecture assistée altérée depuis sa réception.');
  return parsed;
}

/** Bind fields used outside `input` back to the exact authenticated wire snapshot. */
export function assertHopAdviceV1JobBinding(
  job: unknown,
  canonicalInput: HopAdviceV1CanonicalChatInput,
  documentId: string
): void {
  const scope = canonicalInput.scope;
  if (!isRecord(job) || !hasHopAdviceV1Stamp(job) || typeof job.uid !== 'string' || !job.uid ||
      typeof canonicalInput.operationId !== 'string' || typeof canonicalInput.question !== 'string' ||
      !isRecord(scope) || !['recipe', 'batch', 'draft', 'app'].includes(String(scope.kind)) || typeof scope.id !== 'string')
    throw new Error('L’identité du job assisté est incomplète.');
  const boundScope = { kind: scope.kind as HopAdviceV1Scope['kind'], id: scope.id as string } as HopAdviceV1Scope;
  const jobGeneration = job.generation;
  const expectedId = createHash('sha256').update(`${job.uid}:${canonicalInput.operationId}`, 'utf8').digest('hex');
  if (documentId !== expectedId || job.id !== documentId || job.operationId !== canonicalInput.operationId ||
      job.question !== canonicalInput.question ||
      JSON.stringify(sorted(job.scope)) !== JSON.stringify(sorted(boundScope)) ||
      job.threadId !== hopAdviceV1ThreadKey(job.uid, boundScope) ||
      typeof jobGeneration !== 'number' || !Number.isSafeInteger(jobGeneration) || jobGeneration < 0 ||
      (canonicalInput.generation != null && jobGeneration !== canonicalInput.generation))
    throw new Error('Le job assisté ne correspond plus à son identité, sa source ou sa question reçue.');
}

/** Authoritative retry gate: validate the untouched source before the caller changes its wire. */
export function validateHopAdviceV1RetrySource<TInput extends HopAdviceV1CanonicalChatInput>(options: {
  sourceJob: unknown;
  sourceDocumentId: string;
  ownerUid: string;
  expectedThreadId: string;
  currentGeneration: number;
  requestedGeneration?: unknown;
  canonicalize: (parsed: ParsedHopAdviceV1Wire) => TInput;
  stableJson: (value: unknown) => string;
}): { wireInput: HopAdviceV1AnyWireInput; input: TInput } {
  const parsed = validateHopAdviceV1Job(options.sourceJob);
  const input = options.canonicalize(parsed);
  assertHopAdviceV1JobBinding(options.sourceJob, input, options.sourceDocumentId);
  const job = options.sourceJob as Record<string, any>;
  if (job.uid !== options.ownerUid || job.threadId !== options.expectedThreadId)
    throw new Error('La source assistée ne correspond pas au propriétaire ou au fil demandé.');
  if (!Number.isSafeInteger(options.currentGeneration) || options.currentGeneration < 0 || job.generation !== options.currentGeneration)
    throw new Error('La source assistée appartient à une génération ancienne ou non valide.');
  if (options.requestedGeneration !== undefined &&
      (typeof options.requestedGeneration !== 'number' || !Number.isSafeInteger(options.requestedGeneration) ||
        options.requestedGeneration !== options.currentGeneration))
    throw new Error('La génération demandée ne correspond pas à la conversation courante.');
  if (options.stableJson(input) !== options.stableJson(job.input))
    throw new Error('Le contenu canonique du job source diffère de son wire reçu.');
  return { wireInput: parsed.wireInput, input };
}

/** Legacy worker guard: a marker in the old queue is terminal before provider setup. */
export function assertOrdinaryCompanionJob(job: unknown): void {
  if (!isRecord(job)) return;
  const input = isRecord(job.input) ? job.input : undefined;
  if (job.protocol !== undefined || input?.mode === HOP_ADVICE_PROTOCOL_V1.name ||
      (input && Object.prototype.hasOwnProperty.call(input, 'hopAdvice')))
    throw new Error('Un protocole assisté a atteint la file ordinaire. Traitement refusé.');
}

export function hopAdviceV1ThreadKey(uid: string, scope: HopAdviceV1Scope): string {
  const normalizedKind = scope.kind === 'draft' ? 'recipe' : scope.kind;
  return createHash('sha256').update(`${uid}:hopAdviceReadonlyV1:${normalizedKind}:${scope.id}`, 'utf8').digest('hex');
}
