import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopAdviceStudyV3 } from '../../domain/hopDecision/adviceDossier';
import type { HopV55QuestionReading, HopV55QuestionSourceRange } from './decision';
import { normalizeHopV55QuestionWithSourceRanges, hopV55QuestionSourceAt, readHopV55Question } from './decision';
import { readHopV55QuestionSemanticV1, type HopV55SemanticQuestionReadingV1 } from './questionSemanticReading';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';

export const HOP_V55_QUESTION_SCOPE_LEDGER_V1_FORMAT = 'hop-v55-question-scope-ledger-v1' as const;

export type HopV55QuestionScopeKindV1 = 'employmentTiming' | 'materialSelection';
export type HopV55QuestionScopeStatusV1 = 'open' | 'retained' | 'excluded';
export type HopV55QuestionScopeActorV1 = { origin: 'user' | 'proposal' | 'fixture'; label: string };
export type HopV55QuestionScopeSpanV1 = HopV55QuestionSourceRange & { text: string };

/** A query scope is not a sensory criterion or a program operation. */
export interface HopV55QuestionScopeV1 {
  id: string;
  kind: HopV55QuestionScopeKindV1;
  sourceSpan: HopV55QuestionScopeSpanV1;
  focusSpan?: HopV55QuestionScopeSpanV1;
  /** Exact relational context phrases, such as a user-provided culture/beer context. */
  contextSpans: HopV55QuestionScopeSpanV1[];
  relatedScopeIds: string[];
  relatedCriterionIds: string[];
  relatedOperationIds: string[];
  origin: 'proposal' | 'brasseur';
}

export type HopV55QuestionScopeDecisionKindV1 = 'initialize' | 'retain' | 'exclude' | 'revise' | 'reopen';
export interface HopV55QuestionScopeDecisionV1 {
  actId: string;
  kind: HopV55QuestionScopeDecisionKindV1;
  reason: string;
  recordedAt: string;
  recordedBy: HopV55QuestionScopeActorV1;
  predecessorEntryReference?: string;
}

export interface HopV55QuestionScopeLedgerEntryV1 {
  entryId: string;
  scopeId: string;
  /** Parser/source span is immutable across every disposition. */
  sourceScope: HopV55QuestionScopeV1;
  status: HopV55QuestionScopeStatusV1;
  /** Only non-excluded scopes have an active, possibly user-corrected relation projection. */
  activeScope?: HopV55QuestionScopeV1;
  decision: HopV55QuestionScopeDecisionV1;
  reference: string;
}

export interface HopV55QuestionScopeLedgerV1 {
  format: typeof HOP_V55_QUESTION_SCOPE_LEDGER_V1_FORMAT;
  sourceScopes: HopV55QuestionScopeV1[];
  entries: HopV55QuestionScopeLedgerEntryV1[];
  reference: string;
}

export interface HopV55QuestionScopeTransitionV1 {
  actId: string;
  kind: 'create' | 'reviseScopes';
  parentReadingReference?: string;
  reason: string;
  recordedAt: string;
  actor: HopV55QuestionScopeActorV1;
}

export interface HopV55QuestionScopeDispositionActionV1 {
  scopeId: string;
  status: Exclude<HopV55QuestionScopeStatusV1, 'open'>;
  /** Required to reopen/revise relations; spans and identity remain anchored. */
  activeScope?: HopV55QuestionScopeV1;
  reason: string;
}

export interface HopV55QuestionScopeCoverageV1 {
  scopeId: string;
  kind: HopV55QuestionScopeKindV1;
  disposition: 'open' | 'retained' | 'excluded';
  sourceSpan: HopV55QuestionScopeSpanV1;
  focusSpan?: HopV55QuestionScopeSpanV1;
  relatedScopeIds: string[];
  relatedCriterionIds: string[];
  relatedOperationIds: string[];
  origin: 'proposal' | 'brasseur';
  coverage: 'bounded' | 'unresolved' | 'excluded';
  optionIds: string[];
  materialIds: string[];
  uses: string[];
  reason: string;
}

/** A historical structured reading or a semantic reading; scopes only reference IDs and exact spans. */
export type HopV55ScopedQuestionReading = HopV55QuestionReading | HopV55SemanticQuestionReadingV1;

/** Explicit reference view shared by V3 and V4 scope ledgers; no reading is cast to another format. */
export interface HopV55QuestionReferenceViewV1 {
  question: string;
  annotations: Array<{ id: string; source: { start: number; end: number; text: string } }>;
  operations: Array<{ id: string; sourceSpan?: { start: number; end: number; text: string } }>;
}

export function hopV55QuestionReferenceViewV1(reading: HopV55ScopedQuestionReading): HopV55QuestionReferenceViewV1 {
  const annotations = 'annotations' in reading ? reading.annotations : reading.criterionDrafts;
  return {
    question: reading.intent.question,
    annotations: annotations.map(row => ({ id: row.id, source: { ...row.source } })),
    operations: (reading.operationDrafts ?? []).map(row => ({ id: row.id, ...(row.sourceSpan ? { sourceSpan: { ...row.sourceSpan } } : {}) })),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T,>(value: T): T => structuredClone(value);
const exact = (left: unknown, right: unknown): boolean => hopAdviceContentReference('hop-v55-question-scope-equality-v1', left)
  === hopAdviceContentReference('hop-v55-question-scope-equality-v1', right);
const isoInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));

function span(question: string, normalized: string, ranges: readonly HopV55QuestionSourceRange[], start: number, end: number): HopV55QuestionScopeSpanV1 | undefined {
  if (end <= start) return undefined;
  const value = hopV55QuestionSourceAt(question, ranges, start, end);
  return value.start < value.end && question.slice(value.start, value.end) === value.text ? value : undefined;
}

function sourceScopeId(kind: HopV55QuestionScopeKindV1, source: HopV55QuestionScopeSpanV1): string {
  return `scope-source-${source.start}-${source.end}-${kind}`;
}

function clauseEnd(textValue: string, start: number): number {
  let end = textValue.length;
  const tail = textValue.slice(start);
  const punctuation = tail.search(/[.!?;\n]/u);
  if (punctuation >= 0) end = Math.min(end, start + punctuation);
  for (const boundary of [' mais ', ' but ', ' however ', ' sauf ', ' except ']) {
    const index = textValue.indexOf(boundary, start);
    if (index >= 0) end = Math.min(end, index);
  }
  return end;
}

function matches(textValue: string, expression: RegExp): Array<{ start: number; end: number; text: string }> {
  return [...textValue.matchAll(expression)].map(match => {
    const start = match.index ?? 0;
    return { start, end: start + match[0].length, text: match[0] };
  });
}

function materialMentions(textValue: string): Array<{ start: number; end: number; text: string }> {
  return matches(textValue, /\b(?:(?:mon|ma|mes|un|une|le|la|les|my|our|the|a|an)\s+)?(?:houblons?|hops?|mati[eè]res?|materials?|vari[eè]t[eé]s?|varieties?)\b/giu);
}

function relationalContextSpans(question: string, normalized: string, ranges: readonly HopV55QuestionSourceRange[],
  start: number, end: number): HopV55QuestionScopeSpanV1[] {
  const section = normalized.slice(start, end);
  const relation = /\b(?:avec|with)\s+(?:(?:ma|mon|mes|notre|nos|the|my|our)\s+)?[\p{L}\p{N}]+(?:\s+[\p{L}\p{N}]+){0,2}/giu;
  return matches(section, relation).flatMap(match => {
    const absoluteStart = start + match.start;
    const absoluteEnd = start + match.end;
    const source = span(question, normalized, ranges, absoluteStart, absoluteEnd);
    return source ? [source] : [];
  });
}

/**
 * Read only interrogative scopes. A command such as “Ajoute 20 g au whirlpool”
 * remains an operation; it does not create a timing or selection question.
 */
export function readHopV55QuestionScopeDraftsV1(input: {
  question: string;
  reading: HopV55ScopedQuestionReading;
}): HopV55QuestionScopeV1[] {
  const { question } = input;
  if (!text(question) || input.reading.intent.question !== question) throw new Error('Les portées de question exigent la lecture et le texte source exacts.');
  const view = hopV55QuestionReferenceViewV1(input.reading);
  const normalized = normalizeHopV55QuestionWithSourceRanges(question);
  const textValue = normalized.text;
  const ranges = normalized.sourceRanges;
  const nouns = materialMentions(textValue);
  const timingCues = matches(textValue, /\b(?:quand|when|[aà]\s+quel\s+moment|at\s+what\s+time)\b/giu);
  const materialCues = matches(textValue, /\b(?:lequel|laquelle|lesquels|lesquelles|which\s+(?:one|ones|hops?|materials?|varieties?)?)\b/giu);
  const scopes: HopV55QuestionScopeV1[] = [];

  for (const cue of timingCues) {
    const end = clauseEnd(textValue, cue.start);
    const use = matches(textValue.slice(cue.end, end), /\b(?:utilis(?:er|e|es|ez|ent|ant)|employ(?:er|e|es|ez|ent|ant)|use|uses|using|apply|applies|applying)\b/giu)[0];
    if (!use) continue;
    const useStart = cue.end + use.start;
    const nextMaterialCue = materialCues.find(row => row.start > useStart && row.start < end);
    const object = nouns.filter(row => row.start >= useStart && row.start < (nextMaterialCue?.start ?? end)).at(-1);
    const rawEnd = object?.end ?? useStart + use.end;
    const sourceSpan = span(question, textValue, ranges, cue.start, rawEnd);
    if (!sourceSpan) continue;
    const focusSpan = object ? span(question, textValue, ranges, object.start, object.end) : undefined;
    const id = sourceScopeId('employmentTiming', sourceSpan);
    const contextSpans = relationalContextSpans(question, textValue, ranges, cue.start, rawEnd);
    const criterionIds = view.annotations.filter(row => {
      const rowEnd = row.source.end, rowStart = row.source.start;
      return [...contextSpans, ...(focusSpan ? [focusSpan] : [])].some(link => rowStart < link.end && link.start < rowEnd);
    }).map(row => row.id);
    const operationIds = view.operations.filter(operation => operation.sourceSpan
      && operation.sourceSpan.start < sourceSpan.end && sourceSpan.start < operation.sourceSpan.end).map(operation => operation.id);
    scopes.push({ id, kind: 'employmentTiming', sourceSpan, ...(focusSpan ? { focusSpan } : {}), contextSpans,
      relatedScopeIds: [], relatedCriterionIds: [...new Set(criterionIds)], relatedOperationIds: [...new Set(operationIds)], origin: 'proposal' });
  }

  for (const cue of materialCues) {
    const end = clauseEnd(textValue, cue.start);
    const prior = nouns.filter(row => row.end <= cue.start && row.end >= Math.max(0, cue.start - 100)).at(-1);
    const following = nouns.find(row => row.start >= cue.end && row.start < end);
    const focus = prior ?? following;
    const sourceSpan = span(question, textValue, ranges, cue.start, cue.end);
    if (!sourceSpan) continue;
    const focusSpan = focus ? span(question, textValue, ranges, focus.start, focus.end) : undefined;
    const id = sourceScopeId('materialSelection', sourceSpan);
    const relatedScopeIds = scopes.filter(scope => scope.kind === 'employmentTiming'
      && scope.sourceSpan.end <= sourceSpan.start && scope.sourceSpan.start >= Math.max(0, sourceSpan.start - 180)).map(scope => scope.id);
    const contextSpans = relationalContextSpans(question, textValue, ranges, cue.start, cue.end);
    const criterionIds = view.annotations.filter(row => {
      const rowStart = row.source.start, rowEnd = row.source.end;
      return [...contextSpans, ...(focusSpan ? [focusSpan] : [])].some(link => rowStart < link.end && link.start < rowEnd);
    }).map(row => row.id);
    const operationIds = view.operations.filter(operation => operation.sourceSpan
      && operation.sourceSpan.start < sourceSpan.end && sourceSpan.start < operation.sourceSpan.end).map(operation => operation.id);
    scopes.push({ id, kind: 'materialSelection', sourceSpan, ...(focusSpan ? { focusSpan } : {}), contextSpans,
      relatedScopeIds, relatedCriterionIds: [...new Set(criterionIds)], relatedOperationIds: [...new Set(operationIds)], origin: 'proposal' });
  }
  return scopes.sort((left, right) => left.sourceSpan.start - right.sourceSpan.start || left.kind.localeCompare(right.kind));
}

export function readHopV55QuestionWithScopesV1(question: string, prepared: PreparedBrewingScenarioContext): {
  reading: HopV55QuestionReading;
  scopeDrafts: HopV55QuestionScopeV1[];
} {
  const reading = readHopV55Question(question, prepared);
  return { reading, scopeDrafts: readHopV55QuestionScopeDraftsV1({ question, reading }) };
}

/** Semantic reading plus the same query scopes, referencing its annotation and operation IDs. */
export function readHopV55QuestionSemanticWithScopesV1(question: string, prepared: PreparedBrewingScenarioContext): {
  reading: HopV55SemanticQuestionReadingV1;
  scopeDrafts: HopV55QuestionScopeV1[];
} {
  const reading = readHopV55QuestionSemanticV1(question, prepared);
  return { reading, scopeDrafts: readHopV55QuestionScopeDraftsV1({ question, reading }) };
}

function assertScopeSpan(value: unknown, question: string, label: string): asserts value is HopV55QuestionScopeSpanV1 {
  if (!isRecord(value) || Object.keys(value).some(key => !['start', 'end', 'text'].includes(key))
    || !Number.isSafeInteger(value.start) || !Number.isSafeInteger(value.end) || (value.start as number) < 0
    || (value.end as number) <= (value.start as number) || !text(value.text)
    || question.slice(value.start as number, value.end as number) !== value.text) throw new Error(`${label} doit conserver un span UTF-16 exact.`);
}

function assertScopeShape(value: unknown, question: string): asserts value is HopV55QuestionScopeV1 {
  if (!isRecord(value) || Object.keys(value).some(key => !['id', 'kind', 'sourceSpan', 'focusSpan', 'contextSpans',
    'relatedScopeIds', 'relatedCriterionIds', 'relatedOperationIds', 'origin'].includes(key))
    || !text(value.id) || !['employmentTiming', 'materialSelection'].includes(String(value.kind))
    || !Array.isArray(value.contextSpans) || !Array.isArray(value.relatedScopeIds) || !Array.isArray(value.relatedCriterionIds)
    || !Array.isArray(value.relatedOperationIds) || !['proposal', 'brasseur'].includes(String(value.origin))) {
    throw new Error('Portée de question V1 illisible ou inconnue.');
  }
  assertScopeSpan(value.sourceSpan, question, 'questionScope.sourceSpan');
  if (value.focusSpan !== undefined) assertScopeSpan(value.focusSpan, question, 'questionScope.focusSpan');
  value.contextSpans.forEach((row, index) => assertScopeSpan(row, question, `questionScope.contextSpans[${index}]`));
  for (const key of ['relatedScopeIds', 'relatedCriterionIds', 'relatedOperationIds'] as const) {
    const values = value[key] as unknown[];
    if (values.some((id: unknown) => !text(id)) || new Set(values).size !== values.length) throw new Error(`Portée ${key} contient un ID vide ou dupliqué.`);
  }
}

function scopeEntryReference(value: Omit<HopV55QuestionScopeLedgerEntryV1, 'reference'> | HopV55QuestionScopeLedgerEntryV1): string {
  const { reference: _reference, ...body } = value as HopV55QuestionScopeLedgerEntryV1;
  return hopAdviceContentReference('hop-v55-question-scope-ledger-entry-v1', body);
}

export function sealHopV55QuestionScopeLedgerEntryV1(input: Omit<HopV55QuestionScopeLedgerEntryV1, 'reference'>): HopV55QuestionScopeLedgerEntryV1 {
  return { ...clone(input), reference: scopeEntryReference(input) };
}

export function hopV55QuestionScopeLedgerReferenceV1(value: Omit<HopV55QuestionScopeLedgerV1, 'reference'>
  | HopV55QuestionScopeLedgerV1): string {
  const { reference: _reference, ...body } = value as HopV55QuestionScopeLedgerV1;
  return hopAdviceContentReference(HOP_V55_QUESTION_SCOPE_LEDGER_V1_FORMAT, body);
}

export function sealHopV55QuestionScopeLedgerV1(input: Omit<HopV55QuestionScopeLedgerV1, 'format' | 'reference'>
  & { originalQuestion: string; reading: HopV55ScopedQuestionReading }): HopV55QuestionScopeLedgerV1 {
  const { originalQuestion, reading, ...body } = input;
  const ledger = { format: HOP_V55_QUESTION_SCOPE_LEDGER_V1_FORMAT, ...clone(body), reference: '' };
  ledger.reference = hopV55QuestionScopeLedgerReferenceV1(ledger);
  assertHopV55QuestionScopeLedgerV1(ledger, originalQuestion, reading);
  return clone(ledger);
}

const latestByScope = (ledger: HopV55QuestionScopeLedgerV1): Map<string, HopV55QuestionScopeLedgerEntryV1> => {
  const latest = new Map<string, HopV55QuestionScopeLedgerEntryV1>();
  for (const entry of ledger.entries) latest.set(entry.scopeId, entry);
  return latest;
};

export function assertHopV55QuestionScopeLedgerV1(value: unknown, question: string,
  reading: HopV55ScopedQuestionReading): asserts value is HopV55QuestionScopeLedgerV1 {
  if (!isRecord(value) || value.format !== HOP_V55_QUESTION_SCOPE_LEDGER_V1_FORMAT || !text(value.reference)
    || !Array.isArray(value.sourceScopes) || !value.sourceScopes.length || !Array.isArray(value.entries) || !value.entries.length) {
    throw new Error('Ledger de portées de question V1 incomplet.');
  }
  if (Object.keys(value).some(key => !['format', 'sourceScopes', 'entries', 'reference'].includes(key))) throw new Error('Ledger de portées V1 contient un champ futur.');
  const sourceById = new Map<string, HopV55QuestionScopeV1>();
  const view = hopV55QuestionReferenceViewV1(reading);
  const criterionIds = new Set(view.annotations.map(row => row.id));
  const operationIds = new Set(view.operations.map(row => row.id));
  for (const raw of value.sourceScopes) {
    assertScopeShape(raw, question);
    if (sourceById.has(raw.id)) throw new Error(`ID de portée V1 dupliqué : ${raw.id}.`);
    sourceById.set(raw.id, raw);
  }
  for (const source of sourceById.values()) {
    if (source.relatedScopeIds.some(id => !sourceById.has(id))
      || source.relatedCriterionIds.some(id => !criterionIds.has(id))
      || source.relatedOperationIds.some(id => !operationIds.has(id))) throw new Error(`Portée ${source.id} liée à une annotation/opération absente.`);
  }
  const latest = new Map<string, HopV55QuestionScopeLedgerEntryV1>();
  const entryIds = new Set<string>(), refs = new Set<string>();
  for (const raw of value.entries) {
    if (!isRecord(raw) || Object.keys(raw).some(key => !['entryId', 'scopeId', 'sourceScope', 'status', 'activeScope', 'decision', 'reference'].includes(key))
      || !text(raw.entryId) || !text(raw.scopeId) || !text(raw.reference)
      || !['open', 'retained', 'excluded'].includes(String(raw.status)) || !isRecord(raw.decision)) {
      throw new Error('Entrée de ledger de portées V1 invalide.');
    }
    const source = sourceById.get(raw.scopeId);
    assertScopeShape(raw.sourceScope, question);
    if (!source || raw.sourceScope.id !== raw.scopeId || !exact(source, raw.sourceScope)) throw new Error(`Source immuable de portée ${raw.scopeId} divergente.`);
    const decision = raw.decision;
    if (Object.keys(decision).some(key => !['actId', 'kind', 'reason', 'recordedAt', 'recordedBy', 'predecessorEntryReference'].includes(key))
      || !text(decision.actId) || !['initialize', 'retain', 'exclude', 'revise', 'reopen'].includes(String(decision.kind))
      || !text(decision.reason) || !isoInstant(decision.recordedAt) || !isRecord(decision.recordedBy)
      || Object.keys(decision.recordedBy).some(key => !['origin', 'label'].includes(key))
      || !['user', 'proposal', 'fixture'].includes(String(decision.recordedBy.origin)) || !text(decision.recordedBy.label)) {
      throw new Error(`Décision de portée ${raw.scopeId} invalide.`);
    }
    const prior = latest.get(raw.scopeId);
    if (!prior) {
      if (decision.predecessorEntryReference !== undefined || decision.kind !== 'initialize' || raw.status !== 'open') {
        throw new Error(`Première disposition de portée ${raw.scopeId} doit initialiser une proposition ouverte.`);
      }
    } else if (decision.predecessorEntryReference !== prior.reference || decision.kind === 'initialize') {
      throw new Error(`Filiation de portée ${raw.scopeId} invalide.`);
    }
    if (raw.status === 'excluded') {
      if (raw.activeScope !== undefined || decision.kind !== 'exclude') throw new Error(`Portée exclue ${raw.scopeId} garde une projection active.`);
    } else {
      if (!raw.activeScope) throw new Error(`Projection active absente pour la portée ${raw.scopeId}.`);
      assertScopeShape(raw.activeScope, question);
      if (raw.activeScope.id !== raw.scopeId || raw.activeScope.sourceSpan.start !== source.sourceSpan.start
        || raw.activeScope.sourceSpan.end !== source.sourceSpan.end || raw.activeScope.sourceSpan.text !== source.sourceSpan.text) {
        throw new Error(`Projection active ${raw.scopeId} a perdu son span/ID exact.`);
      }
      if (decision.kind === 'exclude') throw new Error(`Décision exclude incompatible avec scope active ${raw.scopeId}.`);
    }
    if (entryIds.has(raw.entryId) || refs.has(raw.reference) || scopeEntryReference(raw as unknown as HopV55QuestionScopeLedgerEntryV1) !== raw.reference) {
      throw new Error(`ID ou référence d’entrée scope V1 dupliqué/altéré : ${raw.entryId}.`);
    }
    entryIds.add(raw.entryId); refs.add(raw.reference); latest.set(raw.scopeId, raw as unknown as HopV55QuestionScopeLedgerEntryV1);
  }
  if (latest.size !== sourceById.size || [...sourceById.keys()].some(id => !latest.has(id))) throw new Error('Le ledger ne couvre pas chaque scope source exactement.');
  const activeIds = new Set([...latest.values()].filter(row => row.status !== 'excluded').map(row => row.scopeId));
  for (const entry of latest.values()) if (entry.status !== 'excluded' && entry.activeScope) {
    if (entry.activeScope.relatedScopeIds.some(id => !activeIds.has(id))) throw new Error(`Portée active ${entry.scopeId} pointe vers une portée exclue/absente.`);
    if (entry.activeScope.relatedCriterionIds.some(id => !criterionIds.has(id))
      || entry.activeScope.relatedOperationIds.some(id => !operationIds.has(id))) throw new Error(`Portée active ${entry.scopeId} a perdu une relation exacte.`);
  }
  if (hopV55QuestionScopeLedgerReferenceV1(value as unknown as HopV55QuestionScopeLedgerV1) !== value.reference) throw new Error('SHA du ledger scope V1 altéré.');
}

function activeScopeProjection(ledger: HopV55QuestionScopeLedgerV1): HopV55QuestionScopeV1[] {
  const latest = latestByScope(ledger);
  return ledger.sourceScopes.flatMap(source => {
    const entry = latest.get(source.id);
    return entry?.status !== 'excluded' && entry?.activeScope ? [clone(entry.activeScope)] : [];
  });
}

function scopeEntryId(actId: string, scopeId: string, kind: string): string {
  return hopAdviceContentReference('hop-v55-question-scope-entry-id-v1', { actId, scopeId, kind });
}

export function createHopV55QuestionScopeLedgerV1(input: {
  question: string;
  reading: HopV55ScopedQuestionReading;
  scopeDrafts: readonly HopV55QuestionScopeV1[];
  transition: HopV55QuestionScopeTransitionV1;
}): HopV55QuestionScopeLedgerV1 {
  assertTransition(input.transition, undefined);
  if (!input.scopeDrafts.length) throw new Error('Un ledger de portées V1 exige au moins une portée source.');
  const entries = input.scopeDrafts.map(scope => sealHopV55QuestionScopeLedgerEntryV1({
    entryId: scopeEntryId(input.transition.actId, scope.id, 'initialize'), scopeId: scope.id,
    sourceScope: clone(scope), activeScope: clone(scope), status: 'open',
    decision: { actId: input.transition.actId, kind: 'initialize', reason: input.transition.reason,
      recordedAt: input.transition.recordedAt, recordedBy: clone(input.transition.actor) },
  }));
  return sealHopV55QuestionScopeLedgerV1({ sourceScopes: input.scopeDrafts.map(clone), entries,
    originalQuestion: input.question, reading: input.reading });
}

function assertTransition(value: HopV55QuestionScopeTransitionV1, parentReference: string | undefined): void {
  if (!text(value.actId) || !text(value.reason) || !isoInstant(value.recordedAt)
    || !value.actor || !['user', 'proposal', 'fixture'].includes(value.actor.origin) || !text(value.actor.label)) {
    throw new Error('Transition de portée V1 exige acte, motif, date et acteur.');
  }
  if (value.kind === 'create') {
    if (value.parentReadingReference !== undefined || parentReference !== undefined) throw new Error('Transition create scope ne peut pas avoir de parent.');
  } else if (value.kind === 'reviseScopes') {
    if (!text(value.parentReadingReference) || parentReference !== undefined && value.parentReadingReference !== parentReference) {
      throw new Error('Révision scope exige la référence de lecture parent exacte.');
    }
  } else throw new Error('Transition de portée inconnue.');
}

export function reviseHopV55QuestionScopeLedgerV1(input: {
  ledger: HopV55QuestionScopeLedgerV1;
  question: string;
  reading: HopV55ScopedQuestionReading;
  transition: HopV55QuestionScopeTransitionV1;
  expectedParentReadingReference: string;
  actions: readonly HopV55QuestionScopeDispositionActionV1[];
}): HopV55QuestionScopeLedgerV1 {
  assertHopV55QuestionScopeLedgerV1(input.ledger, input.question, input.reading);
  assertTransition(input.transition, input.expectedParentReadingReference);
  if (input.transition.kind !== 'reviseScopes' || input.transition.actor.origin !== 'user') {
    throw new Error('Une disposition de portée doit être une révision successorale explicitement confirmée par le brasseur.');
  }
  const entries = clone(input.ledger.entries), latest = latestByScope(input.ledger), touched = new Set<string>();
  for (const action of input.actions) {
    if (!text(action.scopeId) || touched.has(action.scopeId) || !text(action.reason)) throw new Error('Action scope répétée ou sans motif/ID.');
    touched.add(action.scopeId);
    const prior = latest.get(action.scopeId);
    if (!prior) throw new Error(`Portée ${action.scopeId} absente du ledger source.`);
    const previousActive = prior.status !== 'excluded' ? prior.activeScope : undefined;
    let activeScope: HopV55QuestionScopeV1 | undefined;
    let kind: HopV55QuestionScopeDecisionKindV1;
    if (action.status === 'excluded') {
      if (action.activeScope !== undefined) throw new Error(`Une portée exclue ${action.scopeId} ne garde pas de projection active.`);
      if (prior.status === 'excluded') throw new Error(`Portée ${action.scopeId} déjà exclue.`);
      kind = 'exclude';
    } else {
      activeScope = clone(action.activeScope ?? previousActive ?? prior.sourceScope);
      assertScopeShape(activeScope, input.question);
      if (activeScope.id !== prior.scopeId || activeScope.sourceSpan.start !== prior.sourceScope.sourceSpan.start
        || activeScope.sourceSpan.end !== prior.sourceScope.sourceSpan.end || activeScope.sourceSpan.text !== prior.sourceScope.sourceSpan.text) {
        throw new Error(`La correction ${action.scopeId} doit conserver l’ancre source exacte.`);
      }
      if (action.status === 'retained') {
        const comparable = clone(activeScope);
        if (previousActive) comparable.origin = previousActive.origin;
        kind = prior.status === 'excluded' ? 'reopen' : previousActive && exact(comparable, previousActive) ? 'retain' : 'revise';
      } else kind = 'revise';
      activeScope.origin = 'brasseur';
    }
    const entry = sealHopV55QuestionScopeLedgerEntryV1({
      entryId: scopeEntryId(input.transition.actId, action.scopeId, kind), scopeId: action.scopeId,
      sourceScope: clone(prior.sourceScope), status: action.status,
      ...(activeScope ? { activeScope } : {}),
      decision: { actId: input.transition.actId, kind, reason: action.reason,
        recordedAt: input.transition.recordedAt, recordedBy: clone(input.transition.actor), predecessorEntryReference: prior.reference },
    });
    entries.push(entry); latest.set(action.scopeId, entry);
  }
  return sealHopV55QuestionScopeLedgerV1({ sourceScopes: clone(input.ledger.sourceScopes), entries,
    originalQuestion: input.question, reading: input.reading });
}

export function projectHopV55QuestionScopeCoverageV1(input: {
  ledger: HopV55QuestionScopeLedgerV1;
  question: string;
  reading: HopV55ScopedQuestionReading;
  study: HopAdviceStudyV3;
}): HopV55QuestionScopeCoverageV1[] {
  assertHopV55QuestionScopeLedgerV1(input.ledger, input.question, input.reading);
  const latest = latestByScope(input.ledger);
  const result = input.study.responseSnapshot.result;
  return input.ledger.sourceScopes.map(source => {
    const entry = latest.get(source.id)!;
    const active = entry.status === 'excluded' ? undefined : entry.activeScope;
    if (!active) return { scopeId: source.id, kind: source.kind, disposition: 'excluded', sourceSpan: clone(source.sourceSpan),
      ...(source.focusSpan ? { focusSpan: clone(source.focusSpan) } : {}), relatedScopeIds: [...source.relatedScopeIds],
      relatedCriterionIds: [...source.relatedCriterionIds], relatedOperationIds: [...source.relatedOperationIds], origin: source.origin, coverage: 'excluded',
      optionIds: [], materialIds: [], uses: [], reason: entry.decision.reason };
    const options = result.options;
    if (active.kind === 'employmentTiming') {
      const applicable = options.filter(option => option.programScope.kind === 'addOrReplace' && option.programScope.uses.length > 0);
      const uses = [...new Set(applicable.flatMap(option => option.programScope.kind === 'addOrReplace' ? option.programScope.uses : []))];
      return { scopeId: source.id, kind: source.kind, disposition: entry.status, sourceSpan: clone(source.sourceSpan),
        ...(active.focusSpan ? { focusSpan: clone(active.focusSpan) } : {}), relatedScopeIds: [...active.relatedScopeIds],
        relatedCriterionIds: [...active.relatedCriterionIds], relatedOperationIds: [...active.relatedOperationIds], origin: active.origin,
        coverage: uses.length ? 'bounded' : 'unresolved', optionIds: applicable.map(option => option.id), materialIds: [], uses,
        reason: uses.length ? 'Des options exposent des emplois candidats; elles ne choisissent ni emploi final ni calendrier.'
          : 'Aucune option enregistrée ne porte d’emploi typé; le moment reste à qualifier.' };
    }
    const requested = new Set(input.study.requestSnapshot.action.situation.materialIds ?? []);
    const applicable = options.filter(option => option.materialIds.some(id => requested.has(id)));
    const materialIds = [...new Set(applicable.flatMap(option => option.materialIds.filter(id => requested.has(id))))];
    return { scopeId: source.id, kind: source.kind, disposition: entry.status, sourceSpan: clone(source.sourceSpan),
      ...(active.focusSpan ? { focusSpan: clone(active.focusSpan) } : {}), relatedScopeIds: [...active.relatedScopeIds],
      relatedCriterionIds: [...active.relatedCriterionIds], relatedOperationIds: [...active.relatedOperationIds], origin: active.origin,
      coverage: materialIds.length ? 'bounded' : 'unresolved', optionIds: applicable.map(option => option.id), materialIds, uses: [],
      reason: materialIds.length ? 'Des options mentionnent les matières explicitement sélectionnées; aucun choix définitif n’est enregistré.'
        : requested.size ? 'Aucune option de l’étude ne couvre les matières choisies pour cette portée.'
          : 'Aucune matière candidate explicite n’a été fournie pour répondre au choix demandé.' };
  });
}
