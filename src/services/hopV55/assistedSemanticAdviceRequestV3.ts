import {
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV4,
  type HopV55WizardDecisionReadingArchiveV4,
} from './brewerHopAdviceSemanticSource4';
import {
  assertBrewerHopAdviceSourceViewMatchesArchiveV1,
  assertBrewerHopAdviceSourceViewMatchesArchiveV1ForWizardV1,
  BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
  assertBrewerHopAdviceRequestV3,
  createBrewerHopAdviceRequestV3,
  createBrewerHopAdviceRequestV3ForWizardV1,
  measureBrewerHopAdviceSemanticJsonWire,
  readBrewerHopAdviceRequestV3,
  readBrewerHopAdviceRequestV3ForWizardV1,
  type BrewerHopAdviceRequestV3,
  type BrewerHopAdviceWizardRequestV3,
} from '../../../functions/src/brewerHopAdviceSemanticV3';
import {
  buildHopAdviceV1WireV3ForWizardV1,
  type HopAdviceAnalysisMode,
  type HopAdviceV1WireInputV3,
  type HopAdviceV1WizardClientEntryV1,
  type HopAdviceV1WizardWireInputV1,
} from '../../../functions/src/brewerHopAdviceTransportV1';
import {
  type BrewerHopAdviceContextLaunchClaimV1,
  type BrewerHopAdviceWizardContextLaunchV1,
} from '../../../functions/src/brewerHopAdviceContextBinding';
import { prepareHopV55SemanticAssistedAdviceLaunchForWizardV1,
  type PrepareHopV55SemanticContextLaunchInputForWizardV1 } from './assistedSemanticAdviceContextV4';

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

export type BuildHopV55AssistedSemanticAdviceRequestForWizardV1Result =
  | { status: 'ready'; request: BrewerHopAdviceWizardRequestV3; sourceArchive: HopV55WizardDecisionReadingArchiveV4;
      sourceSnapshot: import('./contracts').HopV55WizardSourceSnapshotV1;
      contextLaunch: BrewerHopAdviceWizardContextLaunchV1; scope: HopAdviceV1WizardClientEntryV1['scope'];
      wire: HopAdviceV1WizardWireInputV1; requestBytes: { utf8Bytes: number; maxDepth: number };
      wireBytes: { utf8Bytes: number; maxDepth: number } }
  | { status: 'stale' | 'invalid'; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'tooLarge'; requestBytes?: { utf8Bytes: number; maxDepth: number };
      wireBytes?: { utf8Bytes: number; maxDepth: number }; maxBytes: 100000; maxDepth: 18; snapshot: unknown };

/** Build the explicit Wizard Request3 and its exact transport wire from the validated live context. */
export function buildHopV55AssistedSemanticAdviceRequestForWizardV1(input: {
  current: PrepareHopV55SemanticContextLaunchInputForWizardV1;
  operationId: string;
  generation: number;
  analysisMode: HopAdviceAnalysisMode;
  phase?: string;
}): BuildHopV55AssistedSemanticAdviceRequestForWizardV1Result {
  if (!isText(input.operationId) || !Number.isSafeInteger(input.generation) || input.generation < 0
    || !['fast', 'auto', 'deep'].includes(input.analysisMode)
    || input.phase !== undefined && typeof input.phase !== 'string') {
    return { status: 'invalid', reason: 'Identité, génération ou mode du wire Wizard absent/invalide.' };
  }
  const launch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(input.current);
  if (launch.status !== 'ready') return launch;
  try {
    const requestRead = readBrewerHopAdviceRequestV3ForWizardV1(launch.request);
    if (requestRead.status === 'unsupportedReadOnly') {
      return { status: 'unsupportedReadOnly', snapshot: requestRead.snapshot, reason: requestRead.reason };
    }
    if (requestRead.status !== 'readOnly') return { status: 'invalid', reason: requestRead.reason };
    assertBrewerHopAdviceSourceViewMatchesArchiveV1ForWizardV1(requestRead.request.sourceView, launch.sourceArchive);
    if (requestRead.request.question !== launch.sourceArchive.reading.intent.question
      || requestRead.request.sourceReadingReference !== launch.sourceArchive.contentReference
      || requestRead.request.contextLaunch.sourceReadingReference !== launch.sourceArchive.contentReference
      || !isRecord(requestRead.request.contextLaunch.scope)
      || stableJson(requestRead.request.contextLaunch.scope) !== stableJson(launch.scope)) {
      return { status: 'stale', reason: 'Question, archive V4, Request3 ou scope Wizard ne correspondent plus.' };
    }
    const requestBytes = measureBrewerHopAdviceSemanticJsonWire(requestRead.request);
    if (requestBytes.utf8Bytes > MAX_JSON_WIRE_BYTES || requestBytes.maxDepth > MAX_JSON_WIRE_DEPTH) {
      return { status: 'tooLarge', requestBytes, maxBytes: MAX_JSON_WIRE_BYTES, maxDepth: MAX_JSON_WIRE_DEPTH,
        snapshot: requestRead.request };
    }
    const entry: HopAdviceV1WizardClientEntryV1 = {
      operationId: input.operationId, question: requestRead.request.question, generation: input.generation,
      ...(input.phase === undefined ? {} : { phase: input.phase }), scope: launch.scope,
      draft: launch.sourceSnapshot.draft, hopAdvice: requestRead.request, analysisMode: input.analysisMode,
    };
    const wire = buildHopAdviceV1WireV3ForWizardV1(entry);
    const wireBytes = measureBrewerHopAdviceSemanticJsonWire(wire);
    if (wireBytes.utf8Bytes > MAX_JSON_WIRE_BYTES || wireBytes.maxDepth > MAX_JSON_WIRE_DEPTH) {
      return { status: 'tooLarge', requestBytes, wireBytes, maxBytes: MAX_JSON_WIRE_BYTES, maxDepth: MAX_JSON_WIRE_DEPTH,
        snapshot: wire };
    }
    const wireRequest = readBrewerHopAdviceRequestV3ForWizardV1(wire.hopAdvice);
    if (wireRequest.status !== 'readOnly' || stableJson(wireRequest.request) !== stableJson(requestRead.request)) {
      return { status: 'invalid', reason: 'Le wire Wizard ne conserve pas la Request3 V6 préparée exacte.' };
    }
    if (stableJson(wire.draft) !== stableJson(launch.sourceSnapshot.draft)) {
      return { status: 'invalid', reason: 'Le champ wire.draft ne conserve pas le snapshot durable Wizard exact.' };
    }
    return { status: 'ready', request: requestRead.request, sourceArchive: launch.sourceArchive,
      sourceSnapshot: launch.sourceSnapshot, contextLaunch: launch.contextLaunch, scope: launch.scope,
      wire, requestBytes, wireBytes };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Construction Request3 Wizard invalide.' };
  }
}
