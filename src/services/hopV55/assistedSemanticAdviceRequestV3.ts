import {
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV4,
} from './brewerHopAdviceSemanticSource4';
import {
  assertBrewerHopAdviceSourceViewMatchesArchiveV1,
  BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
  assertBrewerHopAdviceRequestV3,
  createBrewerHopAdviceRequestV3,
  measureBrewerHopAdviceSemanticJsonWire,
  readBrewerHopAdviceRequestV3,
  type BrewerHopAdviceRequestV3,
} from '../../../functions/src/brewerHopAdviceSemanticV3';
import type { HopAdviceV1WireInputV3 } from '../../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerHopAdviceContextLaunchClaimV1 } from '../../../functions/src/brewerHopAdviceContextBinding';

const SOURCE_ARCHIVE_V4 = 'hop-v55-decision-reading-v4';
const SEMANTIC_READING_V1 = 'hop-v55-question-semantic-reading-v1';
const WIRE_MODE_V1 = 'hopAdviceReadonlyV1';
const MAX_JSON_WIRE_BYTES = 100_000;
const MAX_JSON_WIRE_DEPTH = 18;

type RecordValue = Record<string, unknown>;
const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);

export type BuildHopV55AssistedSemanticAdviceRequestV3Result =
  | {
      status: 'ready';
      request: BrewerHopAdviceRequestV3;
      /** Full exact V4 archive retained locally for the ticket and later receipt qualification; omitted from RequestV3 wire. */
      sourceArchive: HopV55DecisionReadingArchiveV4;
      /** This is RequestV3 JSON only; it does not include transport IDs, phase, draft or journal. */
      requestBytes: { utf8Bytes: number; maxDepth: number };
    }
  | { status: 'legacyReadOnly'; format: string; sourceArchive: unknown }
  | { status: 'unsupportedReadOnly'; format?: string; snapshot: unknown; reason: string }
  | { status: 'tooLarge'; requestBytes: { utf8Bytes: number; maxDepth: number }; maxBytes: 100000; maxDepth: 18; snapshot: unknown }
  | { status: 'invalid'; reason: string };

export type MeasureHopAdviceV1SemanticWireV3Result =
  | { status: 'ready'; request: BrewerHopAdviceRequestV3; wire: HopAdviceV1WireInputV3; wireBytes: { utf8Bytes: number; maxDepth: number } }
  | { status: 'tooLarge'; wireBytes: { utf8Bytes: number; maxDepth: number }; maxBytes: 100000; maxDepth: 18 }
  | { status: 'invalid'; reason: string };

const isRecord = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  throw new Error('Valeur non JSON dans le wire sémantique.');
}

/**
 * Build the new request only from the exact source4 archive and immutable context launch.
 * Historical source1–3 archives belong to the closed request2 path; no downgrade occurs here.
 */
export function buildHopV55AssistedSemanticAdviceRequestV3(input: {
  sourceArchive: unknown;
  contextLaunch: unknown;
}): BuildHopV55AssistedSemanticAdviceRequestV3Result {
  let read: ReturnType<typeof readHopV55DecisionReadingArchive>;
  try {
    read = readHopV55DecisionReadingArchive(input.sourceArchive);
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Archive source illisible.' };
  }
  if (read.status === 'unsupportedFormat') {
    try {
      return { status: 'unsupportedReadOnly', format: read.format, snapshot: structuredClone(read.raw), reason: 'Format d’archive source futur conservé sans conversion.' };
    } catch {
      return { status: 'invalid', reason: 'Archive source future non sérialisable; aucune conversion effectuée.' };
    }
  }
  if (read.status !== 'available') return { status: 'invalid', reason: read.reason };
  const archiveValue = read.archive;
  if (archiveValue.format !== SOURCE_ARCHIVE_V4) {
    try {
      return { status: 'legacyReadOnly', format: archiveValue.format, sourceArchive: structuredClone(archiveValue) };
    } catch {
      return { status: 'invalid', reason: 'Archive historique non sérialisable.' };
    }
  }
  const sourceArchive = archiveValue as HopV55DecisionReadingArchiveV4;
  if (sourceArchive.reading.format !== SEMANTIC_READING_V1) {
    try {
      return { status: 'unsupportedReadOnly', format: sourceArchive.reading.format,
        snapshot: structuredClone(sourceArchive), reason: 'Archive V4 contenant une lecture sémantique inconnue.' };
    } catch {
      return { status: 'invalid', reason: 'Archive V4 future non sérialisable; aucune conversion effectuée.' };
    }
  }

  return createHopV55AssistedSemanticAdviceRequestV3FromArchive({ sourceArchive, contextLaunch: input.contextLaunch });
}

/** Same RequestV3 builder after the launch helper has strictly read this exact V4 archive. */
export function createHopV55AssistedSemanticAdviceRequestV3FromArchive(input: {
  sourceArchive: HopV55DecisionReadingArchiveV4;
  contextLaunch: unknown;
}): BuildHopV55AssistedSemanticAdviceRequestV3Result {
  try {
    const request = createBrewerHopAdviceRequestV3({ sourceArchive: input.sourceArchive, contextLaunch: input.contextLaunch });
    assertBrewerHopAdviceRequestV3(request);
    if (request.format !== BREWER_HOP_ADVICE_REQUEST_FORMAT_V3
      || request.question !== input.sourceArchive.reading.intent.question
      || request.sourceReadingReference !== input.sourceArchive.contentReference
      || request.contextLaunch.sourceReadingReference !== input.sourceArchive.contentReference) {
      return { status: 'invalid', reason: 'RequestV3 ne lie pas exactement la question, l’archive et le lancement source4.' };
    }
    const requestBytes = measureBrewerHopAdviceSemanticJsonWire(request);
    if (requestBytes.utf8Bytes > MAX_JSON_WIRE_BYTES || requestBytes.maxDepth > MAX_JSON_WIRE_DEPTH) {
      return { status: 'tooLarge', requestBytes, maxBytes: MAX_JSON_WIRE_BYTES, maxDepth: MAX_JSON_WIRE_DEPTH,
        snapshot: structuredClone(request) };
    }
    return {
      status: 'ready', request, sourceArchive: structuredClone(input.sourceArchive),
      requestBytes,
    };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'RequestV3 source4 invalide.' };
  }
}

/**
 * Measure the exact hopAdviceReadonlyV1 V3 object the runtime will dispatch.
 * The caller owns operationId, generation, mode, source and persistence; this function neither
 * synthesizes them nor reports RequestV3 bytes as complete transport bytes.
 */
export function measureHopAdviceV1SemanticWireV3(input: {
  request: unknown;
  wire: unknown;
  /** The complete local source4 archive kept beside the compact wire request. */
  sourceArchive: unknown;
}): MeasureHopAdviceV1SemanticWireV3Result {
  if (!isRecord(input.wire) || !isRecord(input.request)) return { status: 'invalid', reason: 'Request ou wire complet absent.' };
  const wire = input.wire;
  const wireKeys = ['operationId', 'question', 'scope', 'mode', 'analysisMode', 'hopAdvice', 'generation', 'phase', 'draft', 'localJournal'];
  const presentKeys = Object.keys(wire);
  const allowedKeys = new Set(wireKeys);
  if (presentKeys.some((key) => !allowedKeys.has(key))
    || wire.mode !== WIRE_MODE_V1 || wire.hopAdvice === undefined || wire.question !== input.request.question
    || !isText(wire.operationId) || !isRecord(wire.scope) || !isText(wire.scope.id)
    || Object.keys(wire.scope).sort().join('|') !== 'id|kind'
    || !['recipe', 'batch', 'draft', 'app'].includes(String(wire.scope.kind))
    || !['fast', 'auto', 'deep'].includes(String(wire.analysisMode))
    || wire.generation !== undefined && (!Number.isSafeInteger(wire.generation) || Number(wire.generation) < 0)
    || wire.phase !== undefined && typeof wire.phase !== 'string'
    || wire.scope.kind === 'draft' && (!hasOwn(wire, 'draft') || hasOwn(wire, 'localJournal'))
    || wire.scope.kind === 'batch' && hasOwn(wire, 'draft')
    || ['recipe', 'app'].includes(String(wire.scope.kind)) && (hasOwn(wire, 'draft') || hasOwn(wire, 'localJournal'))) {
    return { status: 'invalid', reason: 'Wire V1 V3 incomplet ou incohérent avec la RequestV3.' };
  }

  try {
    const requestRead = readBrewerHopAdviceRequestV3(input.request);
    if (requestRead.status !== 'readOnly') {
      return requestRead.status === 'unsupportedReadOnly'
        ? { status: 'invalid', reason: 'RequestV3 future ou legacy : aucun wire V3 ne peut être mesuré comme compatible.' }
        : { status: 'invalid', reason: requestRead.status === 'invalid' ? requestRead.reason : 'RequestV3 n’est pas reconnue.' };
    }
    assertBrewerHopAdviceSourceViewMatchesArchiveV1(requestRead.request.sourceView, input.sourceArchive);
    if (!isRecord(requestRead.request.contextLaunch.scope)
      || stableJson(wire.scope) !== stableJson(requestRead.request.contextLaunch.scope)) {
      return { status: 'invalid', reason: 'Le scope V1 diffère du scope exact enregistré dans le lancement RequestV3.' };
    }
    const wireRequestRead = readBrewerHopAdviceRequestV3(wire.hopAdvice);
    if (wireRequestRead.status !== 'readOnly' || stableJson(wireRequestRead.request) !== stableJson(requestRead.request)) {
      return { status: 'invalid', reason: 'Le hopAdvice du wire diffère de la RequestV3 préparée.' };
    }
    const wireBytes = measureBrewerHopAdviceSemanticJsonWire(wire);
    if (wireBytes.utf8Bytes > MAX_JSON_WIRE_BYTES || wireBytes.maxDepth > MAX_JSON_WIRE_DEPTH) {
      return { status: 'tooLarge', wireBytes, maxBytes: MAX_JSON_WIRE_BYTES, maxDepth: MAX_JSON_WIRE_DEPTH };
    }
    return { status: 'ready', request: requestRead.request, wire: wire as unknown as HopAdviceV1WireInputV3, wireBytes };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Le wire complet ne se sérialise pas.' };
  }
}
