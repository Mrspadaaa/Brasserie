import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import {
  HOP_V55_DECISION_READING_FORMAT,
  HOP_V55_DECISION_READING_FORMAT_V2,
  HOP_V55_DECISION_READING_FORMAT_V3,
  HOP_V55_DECISION_READING_FORMAT_V4,
  createHopV55DecisionReadingArchiveV2,
  createHopV55DecisionReadingArchiveV3,
  createHopV55DecisionReadingArchiveV4,
  type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV2,
  type HopV55DecisionReadingArchiveV3,
  type HopV55DecisionReadingArchiveV4,
  type HopV55DecisionReadingSource,
  type HopV55QuestionReadingV1,
} from './decisionArchive';
import {
  assertHopV55QuestionScopeLedgerV1,
  createHopV55QuestionScopeLedgerV1,
  hopV55QuestionReferenceViewV1,
  readHopV55QuestionScopeDraftsV1,
  type HopV55QuestionReferenceViewV1,
  type HopV55QuestionScopeActorV1,
  type HopV55QuestionScopeLedgerV1,
  type HopV55QuestionScopeTransitionV1,
  type HopV55QuestionScopeV1,
} from './questionScopeReading';
import type { HopV55QuestionReading } from './decision';
import { readHopV55QuestionSemanticV1, type HopV55SemanticAnnotationV1, type HopV55SemanticQuestionReadingV1 } from './questionSemanticReading';
import { applyHopV55SemanticCorrectionV1 } from './decisionCorrection';

/**
 * Pure accessors over a strictly read decision-reading archive. They never
 * parse the question, never reduce a semantic reading to its primitive
 * projection, and never convert one format into another. The only reader call
 * is the explicit reinterpretation gesture below.
 */

export type HopV55StructuredDecisionReadingArchive = HopV55DecisionReadingArchiveV2 | HopV55DecisionReadingArchiveV3
  | HopV55DecisionReadingArchiveV4;

export type HopV55DecisionReadingViewV1 =
  | { kind: 'text'; format: typeof HOP_V55_DECISION_READING_FORMAT; question: string; reading: HopV55QuestionReadingV1 }
  | { kind: 'historical'; format: typeof HOP_V55_DECISION_READING_FORMAT_V2 | typeof HOP_V55_DECISION_READING_FORMAT_V3;
    question: string; reading: HopV55QuestionReading }
  | { kind: 'semantic'; format: typeof HOP_V55_DECISION_READING_FORMAT_V4; question: string; reading: HopV55SemanticQuestionReadingV1 };

export interface HopV55DecisionReadingScopesV1 {
  scopeLedger: HopV55QuestionScopeLedgerV1;
  transition: HopV55QuestionScopeTransitionV1;
}

const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown) => hopAdviceContentReference('hop-v55-decision-reading-accessor-equality-v1', left ?? null)
  === hopAdviceContentReference('hop-v55-decision-reading-accessor-equality-v1', right ?? null);

export function hopV55DecisionReadingViewV1(archive: HopV55DecisionReadingArchive): HopV55DecisionReadingViewV1 {
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V4) {
    return { kind: 'semantic', format: archive.format, question: archive.reading.intent.question, reading: clone(archive.reading) };
  }
  if (archive.format === HOP_V55_DECISION_READING_FORMAT) {
    return { kind: 'text', format: archive.format, question: archive.reading.intent.question, reading: clone(archive.reading) };
  }
  return { kind: 'historical', format: archive.format, question: archive.reading.intent.question, reading: clone(archive.reading) };
}

/** V2, V3 and V4 carry typed annotations; V1 is text only and requires an explicit reinterpretation. */
export function isHopV55StructuredDecisionReadingArchive(archive: HopV55DecisionReadingArchive | undefined):
  archive is HopV55StructuredDecisionReadingArchive {
  return !!archive && (archive.format === HOP_V55_DECISION_READING_FORMAT_V2 || archive.format === HOP_V55_DECISION_READING_FORMAT_V3
    || archive.format === HOP_V55_DECISION_READING_FORMAT_V4);
}

export function isHopV55SemanticDecisionReadingArchive(archive: HopV55DecisionReadingArchive | undefined): archive is HopV55DecisionReadingArchiveV4 {
  return archive?.format === HOP_V55_DECISION_READING_FORMAT_V4;
}

/** Scope ledger and transition of a V3 archive or of a V4 archive that carries them. */
export function hopV55DecisionReadingScopesV1(archive: HopV55DecisionReadingArchive): HopV55DecisionReadingScopesV1 | undefined {
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V3) return { scopeLedger: clone(archive.scopeLedger), transition: clone(archive.transition) };
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V4 && archive.scopeLedger && archive.transition) {
    return { scopeLedger: clone(archive.scopeLedger), transition: clone(archive.transition) };
  }
  return undefined;
}

/** Reference view (question, annotation IDs/spans, operation IDs/spans); none for a text-only V1 reading. */
export function hopV55DecisionReadingReferenceViewV1(archive: HopV55DecisionReadingArchive): HopV55QuestionReferenceViewV1 | undefined {
  return isHopV55StructuredDecisionReadingArchive(archive) ? hopV55QuestionReferenceViewV1(archive.reading) : undefined;
}

/** Active scopes from the validated ledger; a V2 archive or a V4 archive without scopes has none. */
export function hopV55DecisionReadingActiveScopesV1(archive: HopV55DecisionReadingArchive): HopV55QuestionScopeV1[] {
  const scopes = hopV55DecisionReadingScopesV1(archive);
  if (!scopes || !isHopV55StructuredDecisionReadingArchive(archive)) return [];
  assertHopV55QuestionScopeLedgerV1(scopes.scopeLedger, archive.reading.intent.question, archive.reading);
  const latest = new Map<string, HopV55QuestionScopeLedgerV1['entries'][number]>();
  for (const entry of scopes.scopeLedger.entries) latest.set(entry.scopeId, entry);
  return scopes.scopeLedger.sourceScopes.flatMap(source => {
    const entry = latest.get(source.id);
    return entry && entry.status !== 'excluded' && entry.activeScope ? [clone(entry.activeScope)] : [];
  });
}

/** A successor keeps the parent format, its exact annotations/corrections, scopes and lineage. */
export function hopV55SuccessorPreservesParentV1(successor: HopV55DecisionReadingArchive, parent: HopV55DecisionReadingArchive): boolean {
  if (successor.format !== parent.format) return false;
  if (!same(hopV55DecisionReadingScopesV1(successor), hopV55DecisionReadingScopesV1(parent))) return false;
  if (successor.format === HOP_V55_DECISION_READING_FORMAT_V4 && parent.format === HOP_V55_DECISION_READING_FORMAT_V4
    && (!same(successor.lineage, parent.lineage) || !same(successor.reading.annotations, parent.reading.annotations)
      || !same(successor.reading.correction, parent.reading.correction))) return false;
  return true;
}

/**
 * Creates a successor archive of the same format for a new source/runtime
 * frame: the reading is copied without its calculated response or branches.
 * Scopes, transition and lineage stay exact; no format is upgraded or downgraded.
 */
export function createHopV55DecisionReadingSuccessorArchiveV1(input: {
  previous: HopV55StructuredDecisionReadingArchive;
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  keepProgramPreparation?: boolean;
}): HopV55StructuredDecisionReadingArchive {
  const { previous } = input;
  const common = { id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId, recordedAt: input.recordedAt,
    source: clone(input.source), runtimeReference: input.runtimeReference,
    ...(input.keepProgramPreparation && previous.programPreparation ? { programPreparation: clone(previous.programPreparation) } : {}) };
  if (previous.format === HOP_V55_DECISION_READING_FORMAT_V4) {
    const reading = clone(previous.reading); reading.branches = []; delete reading.response;
    return createHopV55DecisionReadingArchiveV4({ ...common, reading,
      ...(previous.scopeLedger ? { scopeLedger: clone(previous.scopeLedger) } : {}),
      ...(previous.transition ? { transition: clone(previous.transition) } : {}),
      ...(previous.lineage ? { lineage: clone(previous.lineage) } : {}) });
  }
  const reading = clone(previous.reading); reading.branches = []; delete reading.response;
  return previous.format === HOP_V55_DECISION_READING_FORMAT_V3
    ? createHopV55DecisionReadingArchiveV3({ ...common, reading, scopeLedger: clone(previous.scopeLedger), transition: clone(previous.transition) })
    : createHopV55DecisionReadingArchiveV2({ ...common, reading });
}

/** The reading exactly as the successor builder will copy it; used to derive a stable successor ID. */
export function hopV55SuccessorReadingV1(previous: HopV55StructuredDecisionReadingArchive): HopV55QuestionReading | HopV55SemanticQuestionReadingV1 {
  const reading = clone(previous.reading); reading.branches = []; delete reading.response;
  return reading;
}

/**
 * Seals a new semantic reading as V4. Query scopes, when the reader found some,
 * are bound by a `create` transition in the same archive; no scope is invented.
 */
export function archiveHopV55SemanticReadingV1(input: {
  reading: HopV55SemanticQuestionReadingV1;
  scopeDrafts?: readonly HopV55QuestionScopeV1[];
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  scopeActor?: HopV55QuestionScopeActorV1;
}): HopV55DecisionReadingArchiveV4 {
  const question = input.reading.intent.question;
  const scopes = input.scopeDrafts?.length ? (() => {
    const transition: HopV55QuestionScopeTransitionV1 = { actId: `question-scope-create:${input.id}`, kind: 'create',
      reason: 'Portées de question proposées par la lecture sémantique, à confirmer.', recordedAt: input.recordedAt,
      actor: clone(input.scopeActor ?? { origin: 'proposal', label: 'Lecture locale' }) };
    return { transition, scopeLedger: createHopV55QuestionScopeLedgerV1({ question, reading: input.reading,
      scopeDrafts: input.scopeDrafts!, transition }) };
  })() : undefined;
  return createHopV55DecisionReadingArchiveV4({ id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    recordedAt: input.recordedAt, reading: clone(input.reading), source: clone(input.source), runtimeReference: input.runtimeReference,
    ...(scopes ?? {}) });
}

/**
 * Explicit brasseur correction of a V4 reading. The corrected reading is sealed
 * as a new V4 that keeps the parent scopes, transition and lineage; the parent
 * bytes stay untouched. A program preparation computed for the old annotations
 * is not carried over.
 */
export function createHopV55SemanticCorrectionArchiveV1(input: {
  parent: HopV55DecisionReadingArchiveV4;
  annotations: readonly HopV55SemanticAnnotationV1[];
  reason: string;
  prepared: PreparedBrewingScenarioContext;
  id: string;
  recordedAt: string;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
}): HopV55DecisionReadingArchiveV4 {
  const { parent } = input;
  if (parent.format !== HOP_V55_DECISION_READING_FORMAT_V4) throw new Error('Une correction sémantique part d’une lecture V4 exacte.');
  if (!same(parent.source, input.source)) throw new Error('La source de la lecture a changé; réexamine-la avant de corriger ses annotations.');
  const reading = applyHopV55SemanticCorrectionV1({ reading: parent.reading, annotations: input.annotations, prepared: input.prepared,
    sourceReadingReference: parent.contentReference, recordedAt: input.recordedAt, reason: input.reason });
  return createHopV55DecisionReadingArchiveV4({ id: input.id, ownerKey: parent.ownerKey, workspaceId: parent.workspaceId,
    recordedAt: input.recordedAt, reading, source: clone(input.source), runtimeReference: input.runtimeReference,
    ...(parent.scopeLedger ? { scopeLedger: clone(parent.scopeLedger) } : {}),
    ...(parent.transition ? { transition: clone(parent.transition) } : {}),
    ...(parent.lineage ? { lineage: clone(parent.lineage) } : {}) });
}

/**
 * Explicit reinterpretation of an older archive (V1–V4) as a new semantic V4
 * reading with lineage. It is the only accessor that calls the question
 * reader, and only on a brasseur gesture; the parent bytes, summary and
 * dossiers are never rewritten. Query scopes are proposed afresh; earlier V3
 * dispositions stay readable in the parent archive.
 */
export function createHopV55SemanticReinterpretationArchiveV1(input: {
  parent: HopV55DecisionReadingArchive;
  prepared: PreparedBrewingScenarioContext;
  id: string;
  recordedAt: string;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  reason: string;
  actorLabel: string;
}): HopV55DecisionReadingArchiveV4 {
  if (!input.reason.trim() || !input.actorLabel.trim()) throw new Error('Une réinterprétation exige un motif et un acteur explicites.');
  const question = input.parent.reading.intent.question;
  const reading = readHopV55QuestionSemanticV1(question, input.prepared);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question, reading });
  const archive = archiveHopV55SemanticReadingV1({ reading, scopeDrafts, id: input.id, ownerKey: input.parent.ownerKey,
    workspaceId: input.parent.workspaceId, recordedAt: input.recordedAt, source: input.source, runtimeReference: input.runtimeReference });
  return createHopV55DecisionReadingArchiveV4({ id: archive.id, ownerKey: archive.ownerKey, workspaceId: archive.workspaceId,
    recordedAt: archive.recordedAt, reading: archive.reading, source: archive.source, runtimeReference: archive.runtimeReference,
    ...(archive.scopeLedger ? { scopeLedger: archive.scopeLedger } : {}), ...(archive.transition ? { transition: archive.transition } : {}),
    lineage: { kind: 'reinterpretation', parentReadingReference: input.parent.contentReference, parentReadingFormat: input.parent.format,
      reason: input.reason.trim(), recordedAt: input.recordedAt, actor: { origin: 'user', label: input.actorLabel.trim() } } });
}
