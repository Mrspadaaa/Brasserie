/**
 * Local adapter of the assisted reading. It re-validates the server proposal against the CURRENT archived
 * reading, re-derives every retained tool record from the turn payloads, then prepares V3 drafts with the
 * existing validators. Nothing is adopted or sealed here: V4 actions exist only after a brewer gesture.
 * Browser-safe: no Node or Firebase Admin import.
 */
import type { HopPropertyAdviceIntentV3, HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { readBrewingScenarioEvidence } from '../../domain/brewingScenarioArchive';
import type { HopV55QuestionReading } from './decision';
import type { HopV55QuestionScopeV1 } from './questionScopeReading';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';
import {
  compareHopV55AssistedAdviceContextAtReception,
  type PrepareHopV55AssistedContextLaunchInput,
  type CompareHopV55AssistedContextAtReceptionResult,
} from './assistedAdviceContext';
import type { BrewerHopAdviceContextLaunchClaimV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import { readAssistedColdContactEvidence } from './assistedColdContactEvidence';
import { prepareHopV55PropertyAdviceRequestDraftV3, type HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';
import type { HopV55PropertyAdviceLedgerActionV4 } from './propertyAdvicePreparationV4';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  assertBrewerHopAdviceProposalEnvelope,
  brewerHopAdviceReaderCues,
  stableBrewerHopAdviceJson,
  validateBrewerHopAdviceRequest,
  verifyBrewerHopAdviceEvidence,
  type BrewerHopAdviceAnswer,
  type BrewerHopAdviceDirection,
  type BrewerHopAdviceEvidenceRecord,
  type BrewerHopAdviceEvidenceSource,
  type BrewerHopAdviceMaterialMention,
  type BrewerHopAdviceOpenQuestion,
  type BrewerHopAdviceProposalEnvelope,
  type BrewerHopAdviceReading,
  type BrewerHopAdviceRequest,
  type BrewerHopAdviceSpan,
} from '../../../functions/src/brewerHopAdviceProposal';

type Intent = HopPropertyAdviceIntentV3;

export type HopV55AssistedAnnotationDisposition = 'unchanged' | 'revised' | 'disputed' | 'added' | 'refused' | 'protected';
export interface HopV55AssistedAnnotationRow {
  id: string;
  source: 'reader' | 'assistant';
  disposition: HopV55AssistedAnnotationDisposition;
  /** Line as it stands in the assisted V3 draft (absent when refused, or when no draft exists). */
  intent?: Intent;
  /** Proposed projection kept for the brewer when V3 refused it or a confirmed line or guard protected it. */
  proposedIntent?: Intent;
  reason: string;
}

/** Typed suggestions for the V4 ledger. None of them is an action until the brewer confirms it. */
export type HopV55AssistedV4Suggestion =
  | { kind: 'add'; annotationId: string; sourceAnnotation: Intent; reason: string }
  | { kind: 'revise'; annotationId: string; proposedIntent: Intent; reason: string }
  | { kind: 'reject'; annotationId: string; reason: string };

export interface HopV55AssistedReadingConflict {
  annotationId: string;
  kind: 'negatedObjective' | 'hypotheticalObservation';
  /** True when the assisted draft no longer carries the suspect reading. */
  resolved: boolean;
}

export type PrepareHopV55AssistedAdviceResult =
  | { status: 'stale'; reason: string }
  | { status: 'invalid'; reason: string }
  | {
      status: 'ready';
      envelope: BrewerHopAdviceProposalEnvelope;
      contextCheck: CompareHopV55AssistedContextAtReceptionResult;
      /** The local reading prepared as is, for comparison; null when the reader produced no annotation. */
      readerDraft: HopV55PropertyAdviceRequestDraftV3 | null;
      /** Reader lines plus accepted assistant changes; interpretation and changed lines stay origin proposal. */
      assistedDraft: HopV55PropertyAdviceRequestDraftV3 | null;
      changedFromReader: boolean;
      annotations: HopV55AssistedAnnotationRow[];
      conflicts: HopV55AssistedReadingConflict[];
      scopeDrafts: HopV55QuestionScopeV1[];
      openQuestions: BrewerHopAdviceOpenQuestion[];
      materials: BrewerHopAdviceMaterialMention[];
      answer: BrewerHopAdviceAnswer;
      evidenceRecords: BrewerHopAdviceEvidenceRecord[];
      /** Exact protocol results rendered outside model prose; never target-beer IBU or a programme permission. */
      coldContactEvidence: Array<ReturnType<typeof readAssistedColdContactEvidence>>;
      v4Suggestions: HopV55AssistedV4Suggestion[];
      notes: string[];
    };

export interface PrepareHopV55AssistedAdviceInput {
  envelope: unknown;
  /** Payloads of the same turn: every retained record is re-derived from them before use. */
  turnEvidence: readonly BrewerHopAdviceEvidenceSource[];
  reading: HopV55QuestionReading;
  /** contentReference of the archived reading currently shown to the brewer. */
  sourceReadingReference: string;
  /** The immutable Page launch, and a fresh Page/workspace/context read at reception. */
  context: HopV55AssistedAdviceContextCheckInput;
  scopeDrafts?: readonly HopV55QuestionScopeV1[];
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  /** Families known locally; a family hint from the model is kept only when listed here. */
  knownFamilyIds?: readonly string[];
}

export interface HopV55AssistedAdviceContextCheckInput {
  launch: BrewerHopAdviceContextLaunchClaimV1;
  current: PrepareHopV55AssistedContextLaunchInput;
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
const same = (left: unknown, right: unknown) => stableBrewerHopAdviceJson(left) === stableBrewerHopAdviceJson(right);
const direction = (value: BrewerHopAdviceDirection): Intent['direction'] => (value === 'none' ? null : value);
const isGuard = (intent: Intent) => intent.direction === 'keep' || intent.direction === 'exclude';

/** Typed handoff of the archived local reading for BrewerChatInput.hopAdvice. */
export function buildHopV55AssistedAdviceRequest(input: {
  reading: HopV55QuestionReading;
  sourceReadingReference: string;
  scopeDrafts?: readonly HopV55QuestionScopeV1[];
  contextLaunch: BrewerHopAdviceContextLaunchClaimV1;
}): BrewerHopAdviceRequest {
  const span = (value: { start: number; end: number; text: string }): BrewerHopAdviceSpan => ({ start: value.start, end: value.end, text: value.text });
  const request: BrewerHopAdviceRequest = {
    format: BREWER_HOP_ADVICE_REQUEST_FORMAT,
    question: input.reading.intent.question,
    sourceReadingReference: input.sourceReadingReference,
    contextLaunch: structuredClone(input.contextLaunch),
    readerAnnotations: input.reading.criterionDrafts.map((draft) => ({
      id: draft.id, span: span(draft.source), term: draft.term,
      direction: (draft.direction ?? 'none') as BrewerHopAdviceDirection, requirement: draft.requirement,
      ...(draft.qualification ? { qualification: draft.qualification } : {}),
      ...(draft.familyId ? { familyId: draft.familyId } : {}),
      ...(draft.dimension ? { dimension: String(draft.dimension) } : {}),
      origin: draft.origin,
    })),
    readerScopes: (input.scopeDrafts ?? []).map((scope) => ({
      id: scope.id, kind: scope.kind, span: span(scope.sourceSpan), ...(scope.focusSpan ? { focusSpan: span(scope.focusSpan) } : {}),
    })),
  };
  return validateBrewerHopAdviceRequest(request, request.question);
}

/** 'none' becomes null; identity, alpha and stock are never attached; a known family or binding is only inherited. */
function intentFromReading(id: string, spans: readonly BrewerHopAdviceSpan[], reading: BrewerHopAdviceReading,
  families: ReadonlySet<string>, base?: Intent): { intent: Intent; note?: string } {
  const family = reading.familyId && families.has(reading.familyId) ? reading.familyId
    : base && base.property === reading.property ? base.familyId : undefined;
  const partner = reading.partner ? { kind: 'freeContext' as const, text: reading.partner.text } : base?.partner;
  const materialId = base?.subject.kind === 'material' && reading.subject.kind === 'material' ? base.subject.materialId : null;
  const intent: Intent = {
    id, property: reading.property, label: base?.label ?? spans[0].text,
    ...(family ? { familyId: family } : {}), ...(partner ? { partner: structuredClone(partner) } : {}),
    role: reading.role, direction: direction(reading.direction), qualification: reading.qualifier ?? null, required: reading.required,
    comparisonBasis: { kind: reading.basis,
      assertionIds: reading.basis === 'current' && base?.comparisonBasis.kind === 'current' ? [...base.comparisonBasis.assertionIds] : [] },
    metric: reading.metric,
    subject: { kind: reading.subject.kind, label: reading.subject.label, materialId, sensoryContext: reading.subject.sensoryContext },
    // A revision reuses the reader's span objects verbatim: V3 compares them exactly.
    sourceSpans: base ? structuredClone(base.sourceSpans) : spans.map((span) => ({ start: span.start, end: span.end, text: span.text })),
    interpretationOrigin: 'proposal', basis: reading.reason, relatedIntentIds: [...reading.relatedIds],
    ...(reading.compensates.length ? { investigation: { kind: 'comparePerceptualCompensation' as const, observationIntentIds: [...reading.compensates] } } : {}),
  };
  const note = reading.familyId && !families.has(reading.familyId)
    ? `Famille « ${reading.familyId} » proposée pour ${id} : inconnue localement, non retenue.` : undefined;
  return { intent, ...(note ? { note } : {}) };
}

/**
 * A disputed line is kept, never erased: it becomes non-required context without direction, so the
 * interpretation no longer announces it as a target. A line others depend on may then fail V3 and stay refused.
 */
function disputedIntent(base: Intent, reason: string): Intent {
  const { investigation: _investigation, ...rest } = structuredClone(base);
  return { ...rest, role: 'preference', direction: null, required: false, comparisonBasis: { kind: 'none', assertionIds: [] },
    interpretationOrigin: 'proposal', basis: `Lecture contestée par l’assistant, conservée comme contexte non requis : ${reason}`.slice(0, 600) };
}

interface Change { id: string; source: 'reader' | 'assistant'; kind: 'revise' | 'dispute' | 'add'; proposed: Intent; reason: string }

export function prepareHopV55AssistedAdviceFromProposal(input: PrepareHopV55AssistedAdviceInput): PrepareHopV55AssistedAdviceResult {
  let envelope: BrewerHopAdviceProposalEnvelope;
  try {
    assertBrewerHopAdviceProposalEnvelope(input.envelope);
    envelope = structuredClone(input.envelope);
  } catch (error) {
    return { status: 'invalid', reason: message(error) };
  }
  const contextCheck = checkCurrentContext(envelope, input.context, 'reception');
  if (contextCheck.history.status !== 'matched') return { status: 'stale', reason: contextCheck.history.reason };
  if (contextCheck.applicability.status !== 'current') return { status: 'stale', reason: contextCheck.applicability.reason };
  let currentPrepared: PreparedBrewingScenarioContext;
  try { currentPrepared = prepareBrewingScenarioContext(input.context.current.context); }
  catch (error) { return { status: 'invalid', reason: `Contexte courant non préparable : ${message(error)}` }; }
  if (input.ownerKey !== input.context.launch.ownerKey || input.workspaceId !== input.context.launch.workspaceId
    || hopV55ScenarioRuntimeReference(input.prepared.runtime) !== hopV55ScenarioRuntimeReference(currentPrepared.runtime)) {
    return { status: 'stale', reason: 'Le brouillon proposé ne serait pas préparé avec le workspace et le contexte courant vérifié.' };
  }
  // Freshness: the same question, the same archived reading, the same reader lines as the brewer sees now.
  const question = input.reading.intent.question;
  if (envelope.request.question !== question) return { status: 'stale', reason: 'La proposition porte sur une autre question exacte ; relance la lecture assistée.' };
  if (envelope.request.sourceReadingReference !== input.sourceReadingReference) {
    return { status: 'stale', reason: 'La lecture locale a changé depuis la proposition (autre archive de lecture).' };
  }
  let expected: BrewerHopAdviceRequest;
  try {
    expected = buildHopV55AssistedAdviceRequest({ reading: input.reading, sourceReadingReference: input.sourceReadingReference,
      scopeDrafts: input.scopeDrafts, contextLaunch: input.context.launch });
  } catch (error) {
    return { status: 'invalid', reason: `Lecture locale non transmissible : ${message(error)}` };
  }
  if (!same(expected.readerAnnotations, envelope.request.readerAnnotations) || !same(expected.readerScopes, envelope.request.readerScopes)) {
    return { status: 'stale', reason: 'Les annotations ou portées locales ont changé depuis la proposition ; elle n’est pas appliquée à une autre lecture.' };
  }
  try {
    verifyBrewerHopAdviceEvidence(envelope, input.turnEvidence, { readScenario: readBrewingScenarioEvidence });
  } catch (error) {
    return { status: 'invalid', reason: message(error) };
  }

  const notes: string[] = [];
  if (contextCheck.applicability.recalculationRequired) {
    notes.push('Les données de référence ou de stock diffèrent de celles du conseil. Les résultats conservés décrivent leur contexte d’origine; recalcule avant de les employer dans un programme actuel.');
  }
  if (envelope.serverContext.binding.culture.status === 'declaredNotConsumed') {
    notes.push('La référence de comparaison est identifiée, mais son contenu n’a pas été transmis au compagnon. Aucun calcul utilisant cette hypothèse n’est établi par cette réponse.');
  }
  const families = new Set(input.knownFamilyIds ?? []);
  const base = { reading: input.reading, prepared: input.prepared, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, candidatePolicy: input.candidatePolicy };
  let readerDraft: HopV55PropertyAdviceRequestDraftV3 | null = null;
  if (input.reading.criterionDrafts.length) {
    try {
      readerDraft = prepareHopV55PropertyAdviceRequestDraftV3({ ...base, requestId: `${input.requestId}:reader` });
    } catch (error) {
      return { status: 'invalid', reason: `La lecture locale ne se prépare pas en V3 : ${message(error)}` };
    }
  }
  const attempt = (intents: readonly Intent[]): { draft: HopV55PropertyAdviceRequestDraftV3 } | { error: string } => {
    try {
      return { draft: prepareHopV55PropertyAdviceRequestDraftV3({ ...base, requestId: input.requestId, propertyIntents: intents }) };
    } catch (error) {
      return { error: message(error) };
    }
  };

  const baseline = readerDraft?.requestSnapshot.propertyIntents ?? [];
  const reviews = new Map(envelope.proposal.readerReview.map((review) => [review.annotationId, review]));
  const rows: HopV55AssistedAnnotationRow[] = [];
  const suggestions: HopV55AssistedV4Suggestion[] = [];
  const changes: Change[] = [];
  for (const intent of baseline) {
    const review = reviews.get(intent.id);
    if (!review || review.verdict === 'consistent') {
      rows.push({ id: intent.id, source: 'reader', disposition: 'unchanged', reason: review?.reason ?? 'Lecture locale conservée.' });
      continue;
    }
    let proposed: Intent;
    if (review.verdict === 'revise' && review.revision) {
      const built = intentFromReading(intent.id, intent.sourceSpans, review.revision, families, intent);
      proposed = built.intent;
      if (built.note) notes.push(built.note);
    } else proposed = disputedIntent(intent, review.reason);
    const suggestion: HopV55AssistedV4Suggestion = review.verdict === 'revise'
      ? { kind: 'revise', annotationId: intent.id, proposedIntent: proposed, reason: review.reason }
      : { kind: 'reject', annotationId: intent.id, reason: review.reason };
    // A brewer-confirmed line or a guard is never changed by the assistant; the doubt stays a suggestion.
    if (intent.interpretationOrigin === 'user' || isGuard(intent)) {
      rows.push({ id: intent.id, source: 'reader', disposition: 'protected', proposedIntent: proposed,
        reason: intent.interpretationOrigin === 'user' ? 'Annotation confirmée par le brasseur : la proposition reste une suggestion.'
          : 'Garde de la lecture locale conservée : la proposition reste une suggestion à confirmer.' });
      suggestions.push(suggestion);
      continue;
    }
    changes.push({ id: intent.id, source: 'reader', kind: review.verdict === 'revise' ? 'revise' : 'dispute', proposed, reason: review.reason });
  }
  for (const annotation of envelope.proposal.annotations) {
    const built = intentFromReading(annotation.id, annotation.spans, annotation.reading, families);
    if (built.note) notes.push(built.note);
    changes.push({ id: annotation.id, source: 'assistant', kind: 'add', proposed: built.intent, reason: annotation.reading.reason });
  }

  // Every change passes the real V3 validators; one that cannot is kept visible, never forced.
  let current: Intent[] = baseline.map((intent) => structuredClone(intent));
  let draft: HopV55PropertyAdviceRequestDraftV3 | null = null;
  const errors = new Map<string, string>();
  const accepted: Change[] = [];
  let pending = changes;
  for (let progress = true; progress && pending.length;) {
    progress = false;
    const still: Change[] = [];
    for (const change of pending) {
      const next = change.kind === 'add' ? [...current, change.proposed] : current.map((intent) => (intent.id === change.id ? change.proposed : intent));
      const result = attempt(next);
      if ('draft' in result) {
        current = next; draft = result.draft; progress = true; accepted.push(change);
      } else {
        errors.set(change.id, result.error); still.push(change);
      }
    }
    pending = still;
  }
  if (!draft && current.length) {
    const result = attempt(current);
    if ('error' in result) return { status: 'invalid', reason: `Brouillon assisté non préparable : ${result.error}` };
    draft = result.draft;
  }
  for (const change of accepted) {
    rows.push({ id: change.id, source: change.source, disposition: change.kind === 'add' ? 'added' : change.kind === 'revise' ? 'revised' : 'disputed', reason: change.reason });
    if (change.kind === 'add') suggestions.push({ kind: 'add', annotationId: change.id, sourceAnnotation: change.proposed, reason: change.reason });
    else if (change.kind === 'revise') suggestions.push({ kind: 'revise', annotationId: change.id, proposedIntent: change.proposed, reason: change.reason });
    else suggestions.push({ kind: 'reject', annotationId: change.id, reason: change.reason });
  }
  for (const change of pending) {
    rows.push({ id: change.id, source: change.source, disposition: 'refused', proposedIntent: change.proposed,
      reason: `Refusée par la validation V3 : ${errors.get(change.id) ?? 'motif inconnu'}` });
  }
  const finalIntents = new Map((draft?.requestSnapshot.propertyIntents ?? []).map((intent) => [intent.id, intent]));
  for (const row of rows) if (row.disposition !== 'refused' && finalIntents.has(row.id)) row.intent = structuredClone(finalIntents.get(row.id)!);

  const conflicts: HopV55AssistedReadingConflict[] = [];
  const readerById = new Map(baseline.map((intent) => [intent.id, intent]));
  for (const cue of brewerHopAdviceReaderCues(expected)) {
    const reader = readerById.get(cue.id);
    const finalIntent = finalIntents.get(cue.id);
    if (cue.negatedObjective) conflicts.push({ annotationId: cue.id, kind: 'negatedObjective',
      resolved: !!finalIntent && finalIntent.direction !== 'increase' && finalIntent.direction !== 'decrease' });
    if (cue.hypotheticalContext && reader?.role === 'reportedObservation') conflicts.push({ annotationId: cue.id, kind: 'hypotheticalObservation',
      resolved: !!finalIntent && finalIntent.role !== 'reportedObservation' });
  }

  // Query scopes: reader scopes first; an assistant scope on the same span and kind is redundant.
  const criterionIds = new Set(input.reading.criterionDrafts.map((entry) => entry.id));
  const scopeDrafts: HopV55QuestionScopeV1[] = (input.scopeDrafts ?? []).map((scope) => structuredClone(scope));
  for (const scope of envelope.proposal.scopes) {
    if (scopeDrafts.some((entry) => entry.kind === scope.kind && entry.sourceSpan.start === scope.span.start && entry.sourceSpan.end === scope.span.end)) {
      notes.push(`Portée ${scope.id} déjà lue localement : la portée locale est conservée.`);
      continue;
    }
    scopeDrafts.push({ id: scope.id, kind: scope.kind, sourceSpan: structuredClone(scope.span),
      ...(scope.focusSpan ? { focusSpan: structuredClone(scope.focusSpan) } : {}),
      contextSpans: scope.contextSpans.map((span) => structuredClone(span)), relatedScopeIds: [],
      // The scope ledger links reader criteria only; assistant annotations stay linked in the proposal itself.
      relatedCriterionIds: scope.relatedIds.filter((id) => criterionIds.has(id)), relatedOperationIds: [], origin: 'proposal' });
  }

  const changedFromReader = !!draft && (!readerDraft || !same(draft.requestSnapshot.propertyIntents, readerDraft.requestSnapshot.propertyIntents));
  return {
    status: 'ready', envelope, contextCheck, readerDraft, assistedDraft: draft, changedFromReader, annotations: rows, conflicts, scopeDrafts,
    openQuestions: structuredClone(envelope.proposal.openQuestions), materials: structuredClone(envelope.proposal.materials),
    answer: structuredClone(envelope.proposal.answer), evidenceRecords: structuredClone(envelope.evidence.records),
    coldContactEvidence: input.turnEvidence.filter(entry => entry.name === 'cold_contact_bitterness_reference')
      .map(entry => readAssistedColdContactEvidence({ id: entry.id, name: entry.name, data: entry.data })),
    v4Suggestions: suggestions, notes: [
      ...notes,
      `Proposition reliée à sa lecture et au contexte serveur (${envelope.serverContext.phase}), vérifiés à réception. Une confirmation exige une nouvelle vérification.`,
    ],
  };
}

function checkCurrentContext(envelope: BrewerHopAdviceProposalEnvelope, input: HopV55AssistedAdviceContextCheckInput,
  stage: 'reception' | 'confirmation'): CompareHopV55AssistedContextAtReceptionResult {
  if (!input?.launch || !same(input.launch, envelope.request.contextLaunch)) {
    return { history: { status: 'invalid', reason: 'Le lancement local exact diffère de celui du tour serveur.' },
      applicability: { status: 'unavailable', reason: 'La liaison de contexte originale est absente ou différente.' },
      stage, historicalSourceReadingReference: envelope.request.sourceReadingReference };
  }
  return compareHopV55AssistedAdviceContextAtReception({ launch: input.launch,
    serverRequestReadingReference: envelope.request.sourceReadingReference, serverProjection: envelope.serverContext.binding,
    current: input.current, stage });
}

/**
 * The only bridge from a suggestion to a V4 action: an explicit brewer confirmation, optionally edited.
 * The caller still runs prepareCorrectionV4 with a transition whose actor is the brewer; nothing is sealed here.
 */
export interface HopV55BrewerConfirmation {
  kind: 'brewerConfirmation';
  reason: string;
  /** The brewer's own edit of the proposed line; ID and source spans must stay identical. */
  editedIntent?: Intent;
}

export function hopV55V4ActionFromAssistedSuggestion(suggestion: HopV55AssistedV4Suggestion,
  confirmation: HopV55BrewerConfirmation,
  context: HopV55AssistedAdviceContextCheckInput & { envelope: BrewerHopAdviceProposalEnvelope }): HopV55PropertyAdviceLedgerActionV4 {
  if (confirmation?.kind !== 'brewerConfirmation' || !confirmation.reason?.trim()) throw new Error('Une action V4 exige la confirmation explicite du brasseur et son motif.');
  assertBrewerHopAdviceProposalEnvelope(context?.envelope);
  const checked = checkCurrentContext(context.envelope, context, 'confirmation');
  if (checked.history.status !== 'matched') throw new Error(checked.history.reason);
  if (checked.applicability.status !== 'current') throw new Error(checked.applicability.reason);
  if (suggestion.kind === 'reject') return { kind: 'reject', annotationId: suggestion.annotationId, reason: confirmation.reason };
  const proposed = suggestion.kind === 'add' ? suggestion.sourceAnnotation : suggestion.proposedIntent;
  const edited = confirmation.editedIntent ?? proposed;
  if (edited.id !== proposed.id || !same(edited.sourceSpans, proposed.sourceSpans)) {
    throw new Error('La confirmation conserve l’identifiant et les fragments source exacts de la suggestion.');
  }
  const activeIntent: Intent = { ...structuredClone(edited), interpretationOrigin: 'user' };
  return suggestion.kind === 'add'
    ? { kind: 'add', sourceAnnotation: structuredClone(suggestion.sourceAnnotation), activeIntent, reason: confirmation.reason }
    : { kind: 'revise', annotationId: suggestion.annotationId, activeIntent, reason: confirmation.reason };
}
