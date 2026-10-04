import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import {
  assertHopPropertyAdviceRequestV3,
  type HopPropertyAdviceIntent,
  type HopPropertyAdviceIntentV3,
  type HopPropertyAdviceRequestV3,
} from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import {
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource,
} from './decisionArchive';
import {
  readHopV55AdoptedContextBinding,
  type HopV55AdoptedContextBindingV1,
} from './adoptedContextResolution';
import {
  assertHopV55PropertyAdviceRequestDraftV3,
  hopV55PropertyAdvicePreparedReferenceV3,
  hopV55PropertyAdviceRequestDraftReferenceV3,
  type HopV55PropertyAdviceRequestDraftV3,
} from './propertyAdvicePreparationV3';
import {
  buildHopV55PropertyAdviceInterpretation,
  buildHopV55PropertyAdviceRequestContext,
  scopeHopV55PropertyAdviceMaterials,
  assertHopV55PropertyAdviceIntentMaterialBindings,
  assertHopV55PropertyAdviceSourceSpans,
  assertHopV55PropertyAdviceCurrentLinksRemainValid,
  assertHopV55PropertyAdviceAccessUpdates,
} from './propertyAdvicePreparation';
import {
  assertHopV55PropertyAdviceAnnotationLedgerV1,
  createHopV55PropertyAdviceV4ReadingContext,
  readHopV55PropertyAdviceAnnotationLedgerV1,
  readHopV55PropertyAdviceAnswerRecordV4,
  sealHopV55PropertyAdviceAnnotationLedgerV1,
  sealHopV55PropertyAdviceLedgerEntryV1,
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT,
  type HopV55PropertyAdviceAnnotationLedgerV1,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceCorrectionV4Draft,
  type HopV55PropertyAdviceLedgerEntryV1,
  type HopV55PropertyAdviceV4Actor,
  type HopV55PropertyAdviceV4ReadingContext,
  type HopV55PropertyAdviceV4Transition,
} from './propertyAdviceRecordsV4';
import { HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT, readHopV55PropertyAdviceAnswerRecordV3,
  type HopV55PropertyAdviceAnswerRecordV3 } from './propertyAdviceRecordsV3';

export type HopV55PropertyAdviceLedgerActionV4 =
  | { kind: 'reject'; annotationId: string; reason: string }
  | { kind: 'revise' | 'restore'; annotationId: string; activeIntent: HopPropertyAdviceIntentV3; reason: string }
  | { kind: 'add'; sourceAnnotation: HopPropertyAdviceIntentV3; activeIntent: HopPropertyAdviceIntentV3; reason: string };

export type HopV55PropertyAdviceV4SourceRecord = HopV55PropertyAdviceAnswerRecordV3 | HopV55PropertyAdviceAnswerRecordV4;

export interface PrepareHopV55PropertyAdviceCorrectionV4Input {
  sourceRecord: HopV55PropertyAdviceV4SourceRecord;
  /** Strict V1/V2 archive read; no parser is called by this service. */
  sourceReadingArchive: unknown;
  prepared: PreparedBrewingScenarioContext;
  recordId: string;
  requestId?: string;
  transition: HopV55PropertyAdviceV4Transition;
  actions?: readonly HopV55PropertyAdviceLedgerActionV4[];
  /** For `reexamine`, this is the explicitly refreshed context. For other transitions it is an explicit edit. */
  readingContext?: HopV55PropertyAdviceV4ReadingContext;
  /** Omitted on V4 revision inherits the exact binding; null explicitly means no adopted context. */
  cultureBinding?: HopV55AdoptedContextBindingV1 | null;
}

export type PrepareHopV55PropertyAdviceCorrectionV4Result =
  | { status: 'ready'; requestDraftV3: HopV55PropertyAdviceRequestDraftV3; recordDraft: HopV55PropertyAdviceCorrectionV4Draft }
  | { status: 'allRejected'; recordDraft: HopV55PropertyAdviceCorrectionV4Draft };

export interface ResumeHopV55PropertyAdviceCorrectionV4Input {
  record: unknown;
  sourceReadingArchive: unknown;
  prepared: PreparedBrewingScenarioContext;
}

export type ResumeHopV55PropertyAdviceCorrectionV4Result =
  | { status: 'ready'; record: HopV55PropertyAdviceAnswerRecordV4; requestDraftV3: HopV55PropertyAdviceRequestDraftV3 }
  | { status: 'allRejected'; record: HopV55PropertyAdviceAnswerRecordV4 }
  | { status: 'stale'; record: HopV55PropertyAdviceAnswerRecordV4; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export const HOP_V55_PROPERTY_ADVICE_REEXAMINATION_PREVIEW_V1_FORMAT =
  'hop-v55-property-advice-reexamination-preview-v1' as const;
export const HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT =
  'hop-v55-property-advice-reexamination-binding-choice-v1' as const;

export interface HopV55PropertyAdviceReexaminationFreshAssertionV1 {
  assertionId: string;
  assertionReference: string;
  assertion: HopAdviceAssertion;
}

export interface HopV55PropertyAdviceReexaminationLinkDiagnosticV1 {
  annotationId: string;
  intentReference: string;
  previousAssertionId: string;
  previousAssertionReference: string;
  previousAssertion: HopAdviceAssertion;
  status: 'missing' | 'changed';
  currentAssertion?: HopAdviceAssertion;
  currentAssertionReference?: string;
  compatibleFreshAssertions: HopV55PropertyAdviceReexaminationFreshAssertionV1[];
}

/** A preview is a sealed, read-only comparison of one exact parent with one proposed fresh frame. */
export interface HopV55PropertyAdviceReexaminationPreviewV1 {
  format: typeof HOP_V55_PROPERTY_ADVICE_REEXAMINATION_PREVIEW_V1_FORMAT;
  previewId: string;
  ownerKey: string;
  workspaceId: string;
  parentRecordReference: string;
  parentLedgerReference: string;
  parentReadingReference: string;
  parentReadingArchiveReference: string;
  parentAnswerReference?: string;
  sourceReadingArchive: HopV55DecisionReadingArchive;
  sourceReadingReference: string;
  originalQuestion: string;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  preparedReference: string;
  cultureBindingReference: string | null;
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  diagnostics: HopV55PropertyAdviceReexaminationLinkDiagnosticV1[];
  reference: string;
}

export interface PrepareHopV55PropertyAdviceReexaminationPreviewV1Input {
  sourceRecord: HopV55PropertyAdviceAnswerRecordV4;
  /** Exact archived reading currently attached to the parent record. */
  parentReadingArchive: unknown;
  /** Proposed new reading archive; the host persists this exact archive only after confirmation. */
  sourceReadingArchive: unknown;
  prepared: PreparedBrewingScenarioContext;
  /** Explicit null means no current adopted binding; omission is rejected. */
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  currentSource: HopV55DecisionReadingSource;
  currentRuntimeReference: string;
  previewId: string;
}

export type HopV55PropertyAdviceReexaminationPreviewV1Result =
  | { status: 'ready'; preview: HopV55PropertyAdviceReexaminationPreviewV1 }
  | { status: 'blocked'; reason: string };

export type HopV55PropertyAdviceReexaminationBindingChoiceV1 =
  | { format: typeof HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT;
      kind: 'bind'; previewReference: string; annotationId: string; previousAssertionId: string; freshAssertionId: string }
  | { format: typeof HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT;
      kind: 'detach'; previewReference: string; annotationId: string; previousAssertionId: string };

export interface PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input
  extends PrepareHopV55PropertyAdviceReexaminationPreviewV1Input {
  preview: unknown;
  expectedPreviewReference: string;
  /** The fresh preview frame plus only access declarations made after the preview was shown. */
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  recordId: string;
  requestId?: string;
  transition: HopV55PropertyAdviceV4Transition;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  bindingChoices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
}

export type PrepareVerifiedHopV55PropertyAdviceReexaminationV4Result =
  | { status: 'ready'; requestDraftV3: HopV55PropertyAdviceRequestDraftV3;
      recordDraft: HopV55PropertyAdviceCorrectionV4Draft; previewReference: string }
  | { status: 'allRejected'; recordDraft: HopV55PropertyAdviceCorrectionV4Draft; previewReference: string }
  | { status: 'blocked'; reason: string };

const clone = <T,>(value: T): T => structuredClone(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const exact = (left: unknown, right: unknown): boolean =>
  hopAdviceContentReference('hop-v55-property-advice-v4-equality', left)
  === hopAdviceContentReference('hop-v55-property-advice-v4-equality', right);
const isoInstant = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));

function assertActor(value: HopV55PropertyAdviceV4Actor, label: string): void {
  if (!value || !['user', 'proposal', 'fixture'].includes(value.origin) || !text(value.label)) {
    throw new Error(`${label} V4 doit conserver un acteur typé.`);
  }
}

function assertTransition(input: PrepareHopV55PropertyAdviceCorrectionV4Input,
  source: HopV55PropertyAdviceV4SourceRecord, archive: HopV55DecisionReadingArchive): void {
  const transition = input.transition;
  if (!text(input.recordId) || input.recordId === source.id || !text(transition.actId)
    || !text(transition.reason) || !isoInstant(transition.recordedAt)) {
    throw new Error('Une correction V4 exige un nouvel ID de record, un acte, un motif et un instant exacts.');
  }
  assertActor(transition.actor, 'Acteur de transition');
  if (transition.actor.origin !== 'user') throw new Error('Upgrade, révision et réexamen V4 exigent un geste explicite du brasseur.');
  if (transition.parentRecordReference !== source.reference || transition.parentReadingReference !== source.sourceReadingReference) {
    throw new Error('La filiation V4 doit citer le record et la lecture parents exacts.');
  }
  if (transition.kind === 'upgradeV3') {
    if (source.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT
      || archive.contentReference !== source.sourceReadingReference) {
      throw new Error('Un upgrade V3 explicite conserve la lecture source exacte du record parent.');
    }
  } else if (transition.kind === 'revise') {
    if (source.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT
      || archive.contentReference !== source.sourceReadingReference) {
      throw new Error('Une révision V4 conserve la tête V4 et la même lecture source.');
    }
  } else if (transition.kind === 'reexamine') {
    if (source.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT
      || archive.contentReference === source.sourceReadingReference) {
      throw new Error('Un réexamen V4 exige un parent V4 et une nouvelle référence de lecture.');
    }
  } else {
    throw new Error('Cette préparation attend un parent V3 ou V4; une création sans parent utilise le parcours initial.');
  }
  const previousRequestId = source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT
    ? source.answerSnapshot.requestSnapshot.id
    : source.outcome.kind === 'domainAnswer' ? source.outcome.answerSnapshot.requestSnapshot.id : undefined;
  if (archive.reading.intent.question !== (source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT
    ? source.originalQuestion : source.answerSnapshot.requestSnapshot.originalQuestion)) {
    throw new Error('La lecture source courante ne conserve pas la question originale exacte.');
  }
  if (input.requestId !== undefined && (!text(input.requestId) || input.requestId === previousRequestId)) {
    throw new Error('Une correction V4 prête exige un nouvel ID de requête distinct.');
  }
}

function loadSourceRecord(value: HopV55PropertyAdviceV4SourceRecord): HopV55PropertyAdviceV4SourceRecord {
  if (value.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT) {
    const read = readHopV55PropertyAdviceAnswerRecordV3(value);
    if (read.status !== 'readOnly') throw new Error(`La réponse V3 ne peut pas être promue : ${read.reason}`);
    return read.record;
  }
  const read = readHopV55PropertyAdviceAnswerRecordV4(value);
  if (read.status !== 'readOnly') throw new Error(`La tête V4 n’est pas éditable : ${read.reason}`);
  return read.record;
}

function readArchive(value: unknown, ownerKey: string, workspaceId: string): HopV55DecisionReadingArchive {
  const read = readHopV55DecisionReadingArchive(value);
  if (read.status !== 'available') throw new Error(`L’archive de lecture source est indisponible : ${read.status}.`);
  if (read.archive.ownerKey !== ownerKey || read.archive.workspaceId !== workspaceId) {
    throw new Error('L’archive de lecture V4 appartient à un autre propriétaire ou workspace.');
  }
  return read.archive;
}

function activeEntries(ledger: HopV55PropertyAdviceAnnotationLedgerV1): Map<string, HopV55PropertyAdviceLedgerEntryV1> {
  const latest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of ledger.entries) latest.set(entry.annotationId, entry);
  return latest;
}

function activeProjection(ledger: HopV55PropertyAdviceAnnotationLedgerV1): HopPropertyAdviceIntentV3[] {
  const latest = activeEntries(ledger);
  return ledger.sourceAnnotations.flatMap(annotation => {
    const entry = latest.get(annotation.id);
    return entry?.disposition === 'active' && entry.activeIntent ? [clone(entry.activeIntent)] : [];
  });
}

function makeEntryId(actId: string, annotationId: string, kind: string): string {
  return hopAdviceContentReference('hop-v55-property-advice-ledger-entry-id-v1', { actId, annotationId, kind });
}

function initializeLedger(intents: readonly HopPropertyAdviceIntentV3[], question: string,
  transition: HopV55PropertyAdviceV4Transition): HopV55PropertyAdviceAnnotationLedgerV1 {
  const entries = intents.map(annotation => sealHopV55PropertyAdviceLedgerEntryV1({
    entryId: makeEntryId(transition.actId, annotation.id, 'initialize'), annotationId: annotation.id,
    sourceAnnotation: clone(annotation), sourceKind: 'initial', disposition: 'active', activeIntent: clone(annotation),
    decision: { kind: 'initialize', actId: transition.actId, reason: transition.reason,
      recordedAt: transition.recordedAt, recordedBy: clone(transition.actor) },
  }));
  return sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: intents.map(clone), entries, originalQuestion: question });
}

function assertAnchor(question: string, source: HopPropertyAdviceIntentV3, active: HopPropertyAdviceIntentV3): void {
  if (active.id !== source.id || !exact(active.sourceSpans, source.sourceSpans)) {
    throw new Error(`La projection ${active.id} doit conserver l’identité et les fragments source exacts.`);
  }
  for (const span of active.sourceSpans) {
    if (question.slice(span.start, span.end) !== span.text) throw new Error(`Le fragment source de ${active.id} ne correspond pas au texte exact.`);
  }
}

function applyActions(input: {
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  question: string;
  sourceReadingReference: string;
  transition: HopV55PropertyAdviceV4Transition;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  /** Used only after a sealed reexamination choice confirms a same-ID changed assertion. */
  allowNoOpRevisionIds?: ReadonlySet<string>;
}): HopV55PropertyAdviceAnnotationLedgerV1 {
  if (!input.actions.length) return clone(input.ledger);
  const sourceAnnotations = clone(input.ledger.sourceAnnotations);
  const entries = clone(input.ledger.entries);
  const latest = activeEntries(input.ledger);
  const touched = new Set<string>();

  for (const action of input.actions) {
    const annotationId = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
    if (!text(annotationId) || touched.has(annotationId)) throw new Error(`Action V4 répétée ou sans ID : ${annotationId}.`);
    touched.add(annotationId);
    const prior = latest.get(annotationId);
    let sourceAnnotation: HopPropertyAdviceIntentV3;
    let sourceKind: HopV55PropertyAdviceLedgerEntryV1['sourceKind'];
    let additionActId: string | undefined;
    let sourceQuestionReference: string | undefined;
    let disposition: HopV55PropertyAdviceLedgerEntryV1['disposition'];
    let activeIntent: HopPropertyAdviceIntentV3 | undefined;
    let decisionKind: HopV55PropertyAdviceLedgerEntryV1['decision']['kind'];

    if (action.kind === 'add') {
      if (prior || sourceAnnotations.some(annotation => annotation.id === annotationId)) {
        throw new Error(`L’ajout V4 ne peut réutiliser l’ID d’annotation ${annotationId}.`);
      }
      assertAnchor(input.question, action.sourceAnnotation, action.activeIntent);
      sourceAnnotation = clone(action.sourceAnnotation); sourceAnnotations.push(sourceAnnotation);
      sourceKind = 'added'; additionActId = input.transition.actId;
      sourceQuestionReference = input.sourceReadingReference;
      disposition = 'active'; activeIntent = clone(action.activeIntent); decisionKind = 'add';
    } else {
      if (!prior) throw new Error(`L’annotation ${annotationId} n’existe pas dans le ledger source.`);
      sourceAnnotation = clone(prior.sourceAnnotation); sourceKind = prior.sourceKind;
      additionActId = prior.additionActId; sourceQuestionReference = prior.sourceQuestionReference;
      if (action.kind === 'reject') {
        if (prior.disposition !== 'active') throw new Error(`L’annotation ${annotationId} est déjà rejetée.`);
        disposition = 'rejected'; decisionKind = 'reject';
      } else if (action.kind === 'revise') {
        if (prior.disposition !== 'active' || !prior.activeIntent) throw new Error(`L’annotation ${annotationId} rejetée doit être restaurée explicitement.`);
        assertAnchor(input.question, sourceAnnotation, action.activeIntent);
        if (exact(prior.activeIntent, action.activeIntent) && !input.allowNoOpRevisionIds?.has(annotationId)) {
          throw new Error(`La révision ${annotationId} ne change aucune projection.`);
        }
        disposition = 'active'; activeIntent = clone(action.activeIntent); decisionKind = 'revise';
      } else {
        if (prior.disposition !== 'rejected') throw new Error(`L’annotation ${annotationId} n’est pas rejetée; aucune restauration n’est requise.`);
        assertAnchor(input.question, sourceAnnotation, action.activeIntent);
        disposition = 'active'; activeIntent = clone(action.activeIntent); decisionKind = 'restore';
      }
    }
    if (action.kind !== 'reject' && input.transition.actor.origin === 'user'
      && activeIntent?.interpretationOrigin !== 'user') {
      throw new Error(`La projection ${annotationId} confirmée par le brasseur doit porter interpretationOrigin=user.`);
    }
    const entryInput: Omit<HopV55PropertyAdviceLedgerEntryV1, 'reference'> = {
      entryId: makeEntryId(input.transition.actId, annotationId, action.kind), annotationId,
      sourceAnnotation, sourceKind,
      ...(sourceKind === 'added' ? { additionActId, sourceQuestionReference } : {}),
      disposition, ...(activeIntent ? { activeIntent } : {}),
      decision: {
        kind: decisionKind, actId: input.transition.actId, reason: action.reason,
        recordedAt: input.transition.recordedAt, recordedBy: clone(input.transition.actor),
        ...(prior ? { predecessorEntryReference: prior.reference } : {}),
      },
    };
    const entry = sealHopV55PropertyAdviceLedgerEntryV1(entryInput);
    entries.push(entry); latest.set(annotationId, entry);
  }
  const ledger = sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations, entries, originalQuestion: input.question });
  assertHopV55PropertyAdviceAnnotationLedgerV1(ledger, input.question);
  return ledger;
}

function assertBinding(value: HopV55AdoptedContextBindingV1 | null | undefined,
  ownerKey: string, workspaceId: string): HopV55AdoptedContextBindingV1 | undefined {
  if (value === null || value === undefined) return undefined;
  const read = readHopV55AdoptedContextBinding(value);
  if (read.status !== 'available' || read.binding.ownerKey !== ownerKey || read.binding.workspaceId !== workspaceId) {
    throw new Error(`La résolution NR n’est pas valide pour ce workspace : ${read.status === 'invalid' ? read.reason : 'owner/workspace différent'}.`);
  }
  return clone(read.binding);
}

function withCultureBinding(context: HopV55PropertyAdviceV4ReadingContext, binding: HopV55AdoptedContextBindingV1 | undefined,
  question: string): HopV55PropertyAdviceV4ReadingContext {
  const next = clone(context);
  next.context.assertions = next.context.assertions.filter(assertion => assertion.id !== 'adopted-context-culture');
  if (binding?.culture.status === 'declared') {
    const culture = binding.culture.value;
    next.context.assertions.push({
      id: 'adopted-context-culture', subject: 'culture',
      statement: 'Culture adoptée explicitement comme hypothèse. Les membres, proportions et provenance sont conservés dans le binding NR; aucun coefficient n’est déduit.',
      state: culture.state === 'unknown' ? 'unknown' : 'planned',
      value: JSON.stringify(culture), dimension: 'bioInteraction',
    });
  }
  return createHopV55PropertyAdviceV4ReadingContext(next, question);
}

/**
 * Fingerprints the current Prepared context, the exact reading context, the
 * annotations that bound its material scope, and the adopted NR binding.
 * It is stable for allRejected because source annotations and readingContext
 * remain available even when no request or answer snapshot exists.
 */
export function hopV55PropertyAdvicePreparedReferenceV4(input: {
  prepared: PreparedBrewingScenarioContext;
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  cultureBinding?: HopV55AdoptedContextBindingV1;
}): string {
  const dependencyIntents = [...input.ledger.sourceAnnotations,
    ...input.ledger.entries.flatMap(entry => entry.activeIntent ? [entry.activeIntent] : [])];
  const scoped = scopeHopV55PropertyAdviceMaterials(input.prepared, input.readingContext.candidatePolicy, dependencyIntents);
  const preparedReferenceV3 = hopV55PropertyAdvicePreparedReferenceV3(input.prepared, {
    candidatePolicy: input.readingContext.candidatePolicy, propertyIntents: dependencyIntents, materials: scoped,
  });
  return hopAdviceContentReference('hop-v55-property-advice-prepared-v4', {
    preparedReferenceV3, readingContext: input.readingContext,
    cultureBindingReference: input.cultureBinding?.bindingReference ?? null,
  });
}

function readingContextFromRequest(request: HopPropertyAdviceRequestV3): HopV55PropertyAdviceV4ReadingContext {
  return {
    interpretation: clone(request.interpretation), candidatePolicy: clone(request.candidatePolicy),
    context: clone(request.context), exclusions: clone(request.exclusions),
  };
}

function sourceBase(input: PrepareHopV55PropertyAdviceCorrectionV4Input, source: HopV55PropertyAdviceV4SourceRecord): {
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  sourceActive: HopPropertyAdviceIntentV3[];
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  previousBinding?: HopV55AdoptedContextBindingV1;
} {
  if (source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT) {
    const request = source.answerSnapshot.requestSnapshot;
    const ledger = initializeLedger(request.propertyIntents, request.originalQuestion, input.transition);
    return { ledger, sourceActive: clone(request.propertyIntents), readingContext: readingContextFromRequest(request) };
  }
  const ledgerRead = readHopV55PropertyAdviceAnnotationLedgerV1(source.ledger, source.originalQuestion);
  if (ledgerRead.status !== 'readOnly') throw new Error(`Ledger V4 non éditable : ${ledgerRead.reason}`);
  return { ledger: ledgerRead.ledger, sourceActive: activeProjection(ledgerRead.ledger),
    readingContext: clone(source.readingContext),
    ...(source.preparation.cultureBinding ? { previousBinding: clone(source.preparation.cultureBinding) } : {}) };
}

function requestDraftV3(input: {
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  question: string;
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  active: readonly HopPropertyAdviceIntentV3[];
  prepared: PreparedBrewingScenarioContext;
}): HopV55PropertyAdviceRequestDraftV3 {
  if (!text(input.requestId)) throw new Error('Une projection V4 active exige un requestId neuf.');
  if (!input.active.length) throw new Error('Aucune RequestV3 ne peut être construite sans annotation active.');
  const requestSnapshot: HopPropertyAdviceRequestV3 = {
    format: 'hop-documentary-request-v3', id: input.requestId, originalQuestion: input.question,
    interpretation: clone(input.readingContext.interpretation), propertyIntents: input.active.map(clone),
    candidatePolicy: clone(input.readingContext.candidatePolicy), context: clone(input.readingContext.context),
    exclusions: clone(input.readingContext.exclusions),
    materials: scopeHopV55PropertyAdviceMaterials(input.prepared, input.readingContext.candidatePolicy, input.active),
  };
  assertHopV55PropertyAdviceSourceSpans(input.question, requestSnapshot.propertyIntents);
  assertHopV55PropertyAdviceIntentMaterialBindings(requestSnapshot);
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  const body: Omit<HopV55PropertyAdviceRequestDraftV3, 'reference' | 'revisionContext' | 'reexaminationSource'> = {
    format: 'hop-v55-property-advice-request-draft-v3', id: input.requestId,
    ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, preparedReference: input.preparedReference, requestSnapshot,
  };
  const draft: HopV55PropertyAdviceRequestDraftV3 = {
    ...body, reference: hopV55PropertyAdviceRequestDraftReferenceV3(body),
  };
  assertHopV55PropertyAdviceRequestDraftV3(draft);
  return draft;
}

type ReexaminationPreviewBodyV1 = Omit<HopV55PropertyAdviceReexaminationPreviewV1, 'reference'>;
const REEXAMINATION_PREVIEW_KEYS_V1 = [
  'format', 'previewId', 'ownerKey', 'workspaceId', 'parentRecordReference', 'parentLedgerReference',
  'parentReadingReference', 'parentReadingArchiveReference', 'parentAnswerReference', 'sourceReadingArchive',
  'sourceReadingReference', 'originalQuestion', 'source', 'runtimeReference', 'preparedReference',
  'cultureBindingReference', 'readingContext', 'diagnostics',
] as const;

function previewBodyV1(preview: HopV55PropertyAdviceReexaminationPreviewV1 | ReexaminationPreviewBodyV1): ReexaminationPreviewBodyV1 {
  const { reference: _reference, ...body } = preview as HopV55PropertyAdviceReexaminationPreviewV1;
  return body;
}

export function hopV55PropertyAdviceReexaminationPreviewReferenceV1(
  preview: HopV55PropertyAdviceReexaminationPreviewV1 | ReexaminationPreviewBodyV1,
): string {
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_REEXAMINATION_PREVIEW_V1_FORMAT, previewBodyV1(preview));
}

function assertReexaminationPreviewV1(value: unknown): asserts value is HopV55PropertyAdviceReexaminationPreviewV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Preview de réexamen V4 absent ou illisible.');
  const preview = value as HopV55PropertyAdviceReexaminationPreviewV1;
  const keys = Object.keys(preview);
  if (keys.some(key => key !== 'reference' && !(REEXAMINATION_PREVIEW_KEYS_V1 as readonly string[]).includes(key))) {
    throw new Error('Preview de réexamen V4 avec champs non pris en charge.');
  }
  if (preview.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_PREVIEW_V1_FORMAT
    || !text(preview.previewId) || !text(preview.ownerKey) || !text(preview.workspaceId)
    || !text(preview.parentRecordReference) || !text(preview.parentLedgerReference)
    || !text(preview.parentReadingReference) || !text(preview.parentReadingArchiveReference)
    || !text(preview.sourceReadingReference) || !text(preview.originalQuestion)
    || !text(preview.runtimeReference) || !text(preview.preparedReference)
    || typeof preview.cultureBindingReference !== 'string' && preview.cultureBindingReference !== null
    || !Array.isArray(preview.diagnostics) || !text(preview.reference)) {
    throw new Error('Preview de réexamen V4 incomplet.');
  }
  if (preview.sourceReadingArchive.contentReference !== preview.sourceReadingReference
    || preview.sourceReadingArchive.reading.intent.question !== preview.originalQuestion
    || !exact(preview.sourceReadingArchive.source, preview.source)
    || preview.sourceReadingArchive.runtimeReference !== preview.runtimeReference) {
    throw new Error('Le preview ne conserve pas son archive courante exacte.');
  }
  createHopV55PropertyAdviceV4ReadingContext(preview.readingContext, preview.originalQuestion);
  for (const diagnostic of preview.diagnostics) {
    if (!text(diagnostic.annotationId) || !text(diagnostic.intentReference) || !text(diagnostic.previousAssertionId)
      || !text(diagnostic.previousAssertionReference) || !['missing', 'changed'].includes(diagnostic.status)
      || !Array.isArray(diagnostic.compatibleFreshAssertions)) throw new Error('Diagnostic de lien du preview invalide.');
    if (hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', diagnostic.previousAssertion)
      !== diagnostic.previousAssertionReference || diagnostic.previousAssertion.id !== diagnostic.previousAssertionId) {
      throw new Error('Le preview a altéré le fait historique lié.');
    }
    const current = preview.readingContext.context.assertions.find(row => row.id === diagnostic.previousAssertionId);
    if (diagnostic.status === 'missing' ? current !== undefined
      : !current || !diagnostic.currentAssertion || !diagnostic.currentAssertionReference
        || !exact(current, diagnostic.currentAssertion)
        || hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', current) !== diagnostic.currentAssertionReference
        || diagnostic.currentAssertionReference === diagnostic.previousAssertionReference) {
      throw new Error('Le diagnostic du preview ne correspond plus au cadre courant.');
    }
    const candidateIds = new Set<string>();
    for (const candidate of diagnostic.compatibleFreshAssertions) {
      const exactFresh = preview.readingContext.context.assertions.find(row => row.id === candidate.assertionId);
      if (candidateIds.has(candidate.assertionId) || !exactFresh || !exact(exactFresh, candidate.assertion)
        || hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', exactFresh) !== candidate.assertionReference) {
        throw new Error('Un fait frais proposé par le preview est absent ou altéré.');
      }
      candidateIds.add(candidate.assertionId);
    }
  }
  if (hopV55PropertyAdviceReexaminationPreviewReferenceV1(preview) !== preview.reference) {
    throw new Error('Le contenu du preview de réexamen V4 a changé.');
  }
}

export function readHopV55PropertyAdviceReexaminationPreviewV1(value: unknown):
  | { status: 'readOnly'; preview: HopV55PropertyAdviceReexaminationPreviewV1 }
  | { status: 'invalid'; reason: string } {
  try {
    assertReexaminationPreviewV1(value);
    return { status: 'readOnly', preview: clone(value as HopV55PropertyAdviceReexaminationPreviewV1) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Preview de réexamen V4 invalide.' };
  }
}

function reexaminationReadingProjection(archive: HopV55DecisionReadingArchive): unknown {
  const { response: _response, branches: _branches, ...reading } = archive.reading as HopV55DecisionReadingArchive['reading'] & {
    response?: unknown; branches: unknown[];
  };
  return { reading, ...(archive.format === 'hop-v55-decision-reading-v1' ? {} : {
    programPreparation: archive.programPreparation ?? null,
  }) };
}

function assertCurrentArchivePreservesParent(parent: HopV55DecisionReadingArchive,
  current: HopV55DecisionReadingArchive, source: HopV55PropertyAdviceAnswerRecordV4): void {
  if (parent.format !== current.format || parent.contentReference !== source.sourceReadingReference
    || parent.ownerKey !== source.ownerKey || parent.workspaceId !== source.workspaceId
    || parent.source && !exact(parent.source, source.preparation.source)
    || current.contentReference === parent.contentReference
    || parent.reading.intent.question !== source.originalQuestion
    || current.reading.intent.question !== source.originalQuestion
    || !exact(reexaminationReadingProjection(parent), reexaminationReadingProjection(current))) {
    throw new Error('La nouvelle archive ne conserve pas la lecture, les critères/opérations ou les scopes du parent exact.');
  }
  if (current.reading.response !== undefined || current.reading.branches.length !== 0) {
    throw new Error('Une archive de réexamen ne réutilise ni une réponse ni des branches calculées du parent.');
  }
  if (current.format === 'hop-v55-decision-reading-v3' && parent.format === 'hop-v55-decision-reading-v3'
    && (!exact(current.scopeLedger, parent.scopeLedger) || !exact(current.transition, parent.transition))) {
    throw new Error('Le réexamen V4 conserve le ledger et la transition de scopes V3 exacts.');
  }
  // A semantic reading keeps its optional scopes, transition and lineage exactly across a reexamination.
  if (current.format === 'hop-v55-decision-reading-v4' && parent.format === 'hop-v55-decision-reading-v4'
    && (!exact(current.scopeLedger ?? null, parent.scopeLedger ?? null) || !exact(current.transition ?? null, parent.transition ?? null)
      || !exact(current.lineage ?? null, parent.lineage ?? null))) {
    throw new Error('Le réexamen conserve les portées, la transition et la filiation exactes de la lecture sémantique V4.');
  }
}

function valueType(value: unknown): string { return value === null ? 'null' : typeof value; }

function assertionDimensionFitsIntent(intent: HopPropertyAdviceIntent, assertion: HopAdviceAssertion): boolean {
  const dimension = assertion.dimension;
  switch (intent.property) {
    case 'aroma': return dimension === undefined || dimension === 'aroma';
    case 'acidity': return dimension === 'acidity';
    case 'bioContribution': return dimension === 'bioInteraction';
    case 'bitterness':
    case 'sweetness': return dimension === undefined || dimension === 'other';
    case 'materialCharacter': return dimension === undefined || dimension === 'documentation';
    case 'unresolved': return false;
  }
}

function assertionMetricFitsIntent(intent: HopPropertyAdviceIntent, assertion: HopAdviceAssertion): boolean {
  if (intent.role === 'measurement') {
    if (assertion.state !== 'measured' || typeof assertion.value !== 'number' || !Number.isFinite(assertion.value)) return false;
    if (intent.metric === 'pH') return intent.property === 'acidity' && assertion.unit === 'pH' && assertion.dimension === 'acidity';
    if (intent.metric === 'analyticalBU') return intent.property === 'bitterness' && assertion.unit === 'BU'
      && (assertion.dimension === undefined || assertion.dimension === 'other');
    return false;
  }
  if (intent.metric === 'pH') return intent.property === 'acidity' && assertion.unit === 'pH' && assertion.dimension === 'acidity';
  if (intent.metric === 'analyticalBU') return intent.property === 'bitterness' && assertion.unit === 'BU'
    && (assertion.dimension === undefined || assertion.dimension === 'other');
  if (intent.metric === 'titratableAcidity') return false;
  return true;
}

function assertionCanBind(intent: HopPropertyAdviceIntent, previous: HopAdviceAssertion, fresh: HopAdviceAssertion): boolean {
  return fresh.subject === previous.subject && fresh.dimension === previous.dimension
    && fresh.state === previous.state && fresh.unit === previous.unit
    && valueType(fresh.value) === valueType(previous.value)
    && assertionDimensionFitsIntent(intent, fresh) && assertionMetricFitsIntent(intent, fresh);
}

function lastActiveIntent(ledger: HopV55PropertyAdviceAnnotationLedgerV1, annotationId: string): HopPropertyAdviceIntentV3 | undefined {
  return [...ledger.entries].reverse().find(entry => entry.annotationId === annotationId
    && entry.disposition === 'active' && entry.activeIntent)?.activeIntent;
}

function reexaminationDiagnostics(input: {
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  previousContext: HopV55PropertyAdviceV4ReadingContext['context'];
  currentContext: HopV55PropertyAdviceV4ReadingContext['context'];
}): HopV55PropertyAdviceReexaminationLinkDiagnosticV1[] {
  const previousAssertions = new Map(input.previousContext.assertions.map(assertion => [assertion.id, assertion]));
  const currentAssertions = new Map(input.currentContext.assertions.map(assertion => [assertion.id, assertion]));
  const diagnostics: HopV55PropertyAdviceReexaminationLinkDiagnosticV1[] = [];
  for (const sourceAnnotation of input.ledger.sourceAnnotations) {
    const intent = lastActiveIntent(input.ledger, sourceAnnotation.id);
    if (!intent || intent.comparisonBasis.kind !== 'current') continue;
    for (const assertionId of intent.comparisonBasis.assertionIds) {
      const oldAssertion = previousAssertions.get(assertionId);
      if (!oldAssertion) throw new Error(`Le parent V4 ne conserve pas le fait ${assertionId} lié à ${intent.id}; aucune base historique à comparer.`);
      const currentAssertion = currentAssertions.get(assertionId);
      const previousAssertionReference = hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', oldAssertion);
      const currentAssertionReference = currentAssertion
        ? hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', currentAssertion) : undefined;
      if (currentAssertion && currentAssertionReference === previousAssertionReference) continue;
      const compatibleFreshAssertions = input.currentContext.assertions.flatMap(assertion =>
        assertionCanBind(intent, oldAssertion, assertion) ? [{ assertionId: assertion.id,
          assertionReference: hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', assertion), assertion: clone(assertion) }] : []);
      diagnostics.push({ annotationId: intent.id,
        intentReference: hopAdviceContentReference('hop-v55-property-advice-reexamination-intent-v1', intent),
        previousAssertionId: assertionId, previousAssertionReference, previousAssertion: clone(oldAssertion),
        status: currentAssertion ? 'changed' : 'missing',
        ...(currentAssertion ? { currentAssertion: clone(currentAssertion), currentAssertionReference } : {}),
        compatibleFreshAssertions });
    }
  }
  return diagnostics;
}

function currentFrameFromPrepared(input: PrepareHopV55PropertyAdviceReexaminationPreviewV1Input,
  parent: HopV55PropertyAdviceAnswerRecordV4): HopV55PropertyAdviceV4ReadingContext {
  const ledgerRead = readHopV55PropertyAdviceAnnotationLedgerV1(parent.ledger, parent.originalQuestion);
  if (ledgerRead.status !== 'readOnly') throw new Error(`Ledger V4 parent invalide : ${ledgerRead.reason}`);
  const base: HopV55PropertyAdviceV4ReadingContext = {
    interpretation: clone(parent.readingContext.interpretation),
    candidatePolicy: clone(parent.readingContext.candidatePolicy),
    context: buildHopV55PropertyAdviceRequestContext(input.prepared),
    exclusions: clone(parent.readingContext.exclusions),
  };
  const binding = assertBinding(input.cultureBinding, parent.ownerKey, parent.workspaceId);
  return withCultureBinding(base, binding, parent.originalQuestion);
}

function buildReexaminationPreviewV1(input: PrepareHopV55PropertyAdviceReexaminationPreviewV1Input):
  HopV55PropertyAdviceReexaminationPreviewV1 {
  if (!text(input.previewId)) throw new Error('previewId V4 requis.');
  if (!Object.prototype.hasOwnProperty.call(input, 'cultureBinding')) throw new Error('Le preview doit déclarer la résolution NR courante ou son absence.');
  const source = loadSourceRecord(input.sourceRecord);
  if (source.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT) throw new Error('Un réexamen de liens exige un parent V4 scellé.');
  const parentArchive = readArchive(input.parentReadingArchive, source.ownerKey, source.workspaceId);
  const currentArchive = readArchive(input.sourceReadingArchive, source.ownerKey, source.workspaceId);
  if (parentArchive.contentReference !== source.sourceReadingReference || !exact(parentArchive.source, source.preparation.source)) {
    throw new Error('L’archive parent ne correspond pas au record V4 et à sa source scellés.');
  }
  assertCurrentArchivePreservesParent(parentArchive, currentArchive, source);
  if (currentArchive.source.kind !== input.currentSource.kind || !exact(currentArchive.source, input.currentSource)
    || currentArchive.runtimeReference !== input.currentRuntimeReference) {
    throw new Error('L’archive courante ne correspond pas à la source/runtime relue par l’hôte.');
  }
  const ledgerRead = readHopV55PropertyAdviceAnnotationLedgerV1(source.ledger, source.originalQuestion);
  if (ledgerRead.status !== 'readOnly' || ledgerRead.ledger.reference !== source.ledger.reference) {
    throw new Error('Le ledger V4 parent n’est pas scellé ou ne correspond plus à son record.');
  }
  const readingContext = currentFrameFromPrepared(input, source);
  const diagnostics = reexaminationDiagnostics({ ledger: ledgerRead.ledger,
    previousContext: source.readingContext.context, currentContext: readingContext.context });
  const preparedReference = hopV55PropertyAdvicePreparedReferenceV4({ prepared: input.prepared, readingContext,
    ledger: ledgerRead.ledger,
    ...(input.cultureBinding ? { cultureBinding: assertBinding(input.cultureBinding, source.ownerKey, source.workspaceId) } : {}) });
  const body: ReexaminationPreviewBodyV1 = {
    format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_PREVIEW_V1_FORMAT, previewId: input.previewId,
    ownerKey: source.ownerKey, workspaceId: source.workspaceId,
    parentRecordReference: source.reference, parentLedgerReference: source.ledger.reference,
    parentReadingReference: source.sourceReadingReference, parentReadingArchiveReference: parentArchive.contentReference,
    ...(source.outcome.kind === 'domainAnswer' ? { parentAnswerReference: source.outcome.answerReference } : {}),
    sourceReadingArchive: clone(currentArchive), sourceReadingReference: currentArchive.contentReference,
    originalQuestion: source.originalQuestion, source: clone(currentArchive.source), runtimeReference: currentArchive.runtimeReference,
    preparedReference, cultureBindingReference: input.cultureBinding?.bindingReference ?? null,
    readingContext, diagnostics,
  };
  return { ...body, reference: hopV55PropertyAdviceReexaminationPreviewReferenceV1(body) };
}

/** Creates a read-only preview; invalid parent/source/frame input is blocked before any request projection. */
export function prepareReexaminationPreviewV1(
  input: PrepareHopV55PropertyAdviceReexaminationPreviewV1Input,
): HopV55PropertyAdviceReexaminationPreviewV1Result {
  try { return { status: 'ready', preview: buildReexaminationPreviewV1(input) }; }
  catch (error) { return { status: 'blocked', reason: error instanceof Error ? error.message : 'Le preview V4 est invalide.' }; }
}

/**
 * Build an append-only V4 correction projection from a validated V3/V4 parent.
 * It never parses the source question and never calls the domain answer builder.
 */
function assertCurrentLinksWithExplicitRebindings(input: {
  previousContext: HopV55PropertyAdviceV4ReadingContext['context'];
  active: readonly HopPropertyAdviceIntentV3[];
  nextContext: HopV55PropertyAdviceV4ReadingContext['context'];
  explicitAssertionIds?: ReadonlyMap<string, ReadonlySet<string>>;
}): void {
  const strictIntents = input.active.map(intent => {
    const skipped = input.explicitAssertionIds?.get(intent.id);
    if (!skipped?.size || intent.comparisonBasis.kind !== 'current') return intent;
    return { ...clone(intent), comparisonBasis: { kind: 'current' as const,
      assertionIds: intent.comparisonBasis.assertionIds.filter(id => !skipped.has(id)) } };
  });
  assertHopV55PropertyAdviceCurrentLinksRemainValid({ context: input.previousContext, propertyIntents: strictIntents }, input.nextContext);
}

function prepareCorrectionV4Internal(input: PrepareHopV55PropertyAdviceCorrectionV4Input, options?: {
  explicitAssertionIds?: ReadonlyMap<string, ReadonlySet<string>>;
  allowNoOpRevisionIds?: ReadonlySet<string>;
}): PrepareHopV55PropertyAdviceCorrectionV4Result {
  const source = loadSourceRecord(input.sourceRecord);
  const archive = readArchive(input.sourceReadingArchive, source.ownerKey, source.workspaceId);
  assertTransition(input, source, archive);
  const question = archive.reading.intent.question;
  if ((source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT ? source.originalQuestion
    : source.answerSnapshot.requestSnapshot.originalQuestion) !== question) {
    throw new Error('La source V4 conserve strictement la question source du record parent.');
  }
  if (source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT
    && source.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(input.prepared, source.answerSnapshot.requestSnapshot)) {
    throw new Error('Le contexte Prepared V3 a changé; réexamine explicitement avant l’upgrade V4.');
  }

  const base = sourceBase(input, source);
  if (source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT && input.transition.kind === 'revise') {
    if (!exact(source.preparation.source, archive.source)) {
      throw new Error('La source de la lecture ne correspond plus à la source V4 du record parent.');
    }
    const expected = hopV55PropertyAdvicePreparedReferenceV4({ prepared: input.prepared,
      readingContext: base.readingContext, ledger: base.ledger, cultureBinding: base.previousBinding });
    if (source.preparation.preparedReference !== expected) {
      throw new Error('Le contexte ou le binding NR V4 a changé; réexamine explicitement la lecture avant de réviser.');
    }
  }

  const bindingSpecified = Object.prototype.hasOwnProperty.call(input, 'cultureBinding');
  let binding: HopV55AdoptedContextBindingV1 | undefined;
  if (input.transition.kind === 'reexamine') {
    if (!bindingSpecified) throw new Error('Un réexamen V4 doit fournir la résolution NR courante ou déclarer son absence.');
    binding = assertBinding(input.cultureBinding ?? undefined, source.ownerKey, source.workspaceId);
  } else if (source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT && !bindingSpecified) {
    binding = assertBinding(base.previousBinding, source.ownerKey, source.workspaceId);
  } else {
    binding = assertBinding(input.cultureBinding ?? undefined, source.ownerKey, source.workspaceId);
  }
  if (source.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT && input.transition.kind === 'revise'
    && (binding?.bindingReference ?? null) !== (base.previousBinding?.bindingReference ?? null)) {
    throw new Error('Un changement de binding NR exige un réexamen V4 explicite.');
  }

  let readingContext = input.readingContext
    ? createHopV55PropertyAdviceV4ReadingContext(input.readingContext, question)
    : clone(base.readingContext);
  if (input.transition.kind === 'reexamine' && !input.readingContext) {
    throw new Error('Le réexamen V4 doit conserver explicitement le readingContext actualisé.');
  }
  readingContext = withCultureBinding(readingContext, binding, question);

  const ledger = applyActions({ ledger: base.ledger, question, sourceReadingReference: archive.contentReference,
    transition: input.transition, actions: input.actions ?? [], allowNoOpRevisionIds: options?.allowNoOpRevisionIds });
  assertHopV55PropertyAdviceAnnotationLedgerV1(ledger, question);
  const active = activeProjection(ledger);
  if (input.transition.kind === 'reexamine') {
    // The current frame is fresh; an active measurement/baseline link may not
    // silently inherit a new value under an old assertion identity.
    assertCurrentLinksWithExplicitRebindings({ previousContext: base.readingContext.context, active,
      nextContext: readingContext.context, explicitAssertionIds: options?.explicitAssertionIds });
  }
  const activeIds = new Set(active.map(intent => intent.id));
  if (readingContext.exclusions.some(exclusion => exclusion.intentIds.some(id => !activeIds.has(id)))) {
    throw new Error('Une exclusion cite une annotation écartée. Relie-la à une annotation active ou retire explicitement cette exclusion.');
  }
  if (active.length && !input.readingContext && !exact(active, base.sourceActive)
    && readingContext.interpretation.origin === 'proposal') {
    if (!text(input.requestId)) throw new Error('Une projection active modifiée exige un nouvel requestId.');
    readingContext.interpretation = {
      id: `interpretation-${input.requestId}`, version: 'hop-v55-property-advice-reading-v4',
      text: buildHopV55PropertyAdviceInterpretation(active), origin: 'proposal',
    };
    readingContext = createHopV55PropertyAdviceV4ReadingContext(readingContext, question);
  }

  const preparedReference = hopV55PropertyAdvicePreparedReferenceV4({ prepared: input.prepared,
    readingContext, ledger, ...(binding ? { cultureBinding: binding } : {}) });
  const recordDraft: HopV55PropertyAdviceCorrectionV4Draft = {
    format: HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT, id: input.recordId,
    ownerKey: source.ownerKey, workspaceId: source.workspaceId, sourceReadingReference: archive.contentReference,
    originalQuestion: question, transition: clone(input.transition), ledger,
    preparation: { preparedReference, source: clone(archive.source), ...(binding ? { cultureBinding: binding } : {}) },
    readingContext,
  };
  if (!active.length) return { status: 'allRejected', recordDraft };
  if (!text(input.requestId)) throw new Error('Le résultat V4 a des annotations actives mais aucun requestId.');
  const requestDraft = requestDraftV3({ requestId: input.requestId, ownerKey: source.ownerKey, workspaceId: source.workspaceId,
    sourceReadingReference: archive.contentReference, preparedReference, question, readingContext, active, prepared: input.prepared });
  return { status: 'ready', requestDraftV3: requestDraft, recordDraft };
}

/** Strict correction path; it does not accept any reexamination link-bypass metadata. */
export function prepareCorrectionV4(input: PrepareHopV55PropertyAdviceCorrectionV4Input): PrepareHopV55PropertyAdviceCorrectionV4Result {
  return prepareCorrectionV4Internal(input);
}

function stripAdoptedCultureAssertion(context: HopV55PropertyAdviceV4ReadingContext['context']): HopV55PropertyAdviceV4ReadingContext['context'] {
  return { ...clone(context), assertions: context.assertions.filter(assertion => assertion.id !== 'adopted-context-culture') };
}

function validateConfirmedReexaminationContext(input: {
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
}): HopV55PropertyAdviceV4ReadingContext {
  const question = input.preview.originalQuestion;
  const submitted = createHopV55PropertyAdviceV4ReadingContext(input.readingContext, question);
  if (!exact(submitted.interpretation, input.preview.readingContext.interpretation)
    || !exact(submitted.candidatePolicy, input.preview.readingContext.candidatePolicy)
    || !exact(submitted.exclusions, input.preview.readingContext.exclusions)) {
    throw new Error('Cette phase conserve le résumé, la politique et les exclusions du preview; révise-les dans une étape V4 distincte.');
  }

  const baseContext = stripAdoptedCultureAssertion(input.preview.readingContext.context);
  const submittedContext = stripAdoptedCultureAssertion(submitted.context);
  if (submittedContext.stage !== baseContext.stage || submittedContext.stageBasis !== baseContext.stageBasis) {
    throw new Error('Le stade de la frame de confirmation diffère du Prepared scellé au preview.');
  }
  const baseById = new Map(baseContext.assertions.map(assertion => [assertion.id, assertion]));
  const submittedById = new Map(submittedContext.assertions.map(assertion => [assertion.id, assertion]));
  if (submittedById.size !== submittedContext.assertions.length) throw new Error('La frame de confirmation répète une identité d’assertion.');
  for (const assertion of baseContext.assertions) {
    if (!exact(assertion, submittedById.get(assertion.id))) {
      throw new Error(`La frame de confirmation a retiré ou réécrit le fait Prepared ${assertion.id}.`);
    }
  }
  const extraAssertions = submittedContext.assertions.filter(assertion => !baseById.has(assertion.id));
  const scopes = ['bulkBeer', 'sampling', 'separatePortion'] as const;
  const updates = scopes.flatMap(scope => {
    const scopedAssertions = extraAssertions.filter(assertion => assertion.subject === scope);
    const access = submittedContext.access[scope];
    return exact(access, baseContext.access[scope]) && scopedAssertions.length === 0
      ? [] : [{ scope, access: clone(access), assertions: clone(scopedAssertions) }];
  });
  const claimed = new Set(updates.flatMap(update => update.assertions.map(assertion => assertion.id)));
  if (claimed.size !== extraAssertions.length || extraAssertions.some(assertion => !claimed.has(assertion.id))) {
    throw new Error('Une assertion ajoutée au preview doit être une attestation fraîche d’accès typée et sourcée.');
  }
  assertHopV55PropertyAdviceAccessUpdates({ context: baseContext }, updates);

  const expectedWithBinding = withCultureBinding({ ...clone(submitted), context: submittedContext }, input.cultureBinding ?? undefined, question);
  const submittedCulture = submitted.context.assertions.find(assertion => assertion.id === 'adopted-context-culture');
  const expectedCulture = expectedWithBinding.context.assertions.find(assertion => assertion.id === 'adopted-context-culture');
  if (submittedCulture && !exact(submittedCulture, expectedCulture)
    || !submittedCulture && expectedCulture && input.readingContext.context.assertions.some(assertion => assertion.id === 'adopted-context-culture')) {
    throw new Error('La déclaration de culture diffère du binding NR scellé au preview.');
  }
  return expectedWithBinding;
}

function previousActiveIntent(ledger: HopV55PropertyAdviceAnnotationLedgerV1, annotationId: string): HopPropertyAdviceIntentV3 | undefined {
  return lastActiveIntent(ledger, annotationId);
}

function latestLedgerEntry(ledger: HopV55PropertyAdviceAnnotationLedgerV1, annotationId: string): HopV55PropertyAdviceLedgerEntryV1 | undefined {
  return [...ledger.entries].reverse().find(entry => entry.annotationId === annotationId);
}

function requalificationSemanticContent(intent: HopPropertyAdviceIntentV3): unknown {
  const { comparisonBasis: _comparisonBasis, basis: _basis, interpretationOrigin: _origin, ...rest } = intent;
  return rest;
}

function canDetachCurrentLink(intent: HopPropertyAdviceIntentV3): boolean {
  return intent.role !== 'measurement' && !['keep', 'decrease'].includes(String(intent.direction));
}

function validateBindingChoices(input: {
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  bindingChoices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
}): { explicitAssertionIds: Map<string, Set<string>>; allowNoOpRevisionIds: Set<string> } {
  const choiceByLink = new Map<string, HopV55PropertyAdviceReexaminationBindingChoiceV1>();
  const linkKey = (annotationId: string, assertionId: string) => `${annotationId}\u0000${assertionId}`;
  for (const choice of input.bindingChoices) {
    if (!choice || choice.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT
      || !text(choice.previewReference) || choice.previewReference !== input.preview.reference
      || !text(choice.annotationId) || !text(choice.previousAssertionId)
      || choice.kind === 'bind' && !text(choice.freshAssertionId)
      || choice.kind !== 'bind' && choice.kind !== 'detach') {
      throw new Error('Choix de liaison V4 absent, non versionné ou différent du preview affiché.');
    }
    const key = linkKey(choice.annotationId, choice.previousAssertionId);
    if (choiceByLink.has(key)) throw new Error('Un lien périmé ne peut recevoir deux choix de requalification.');
    choiceByLink.set(key, clone(choice));
  }

  const actionsById = new Map<string, HopV55PropertyAdviceLedgerActionV4>();
  for (const action of input.actions) {
    const annotationId = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
    if (actionsById.has(annotationId)) throw new Error(`L’annotation ${annotationId} a plusieurs actions au même acte.`);
    actionsById.set(annotationId, action);
  }

  const diagnosticsByAnnotation = new Map<string, HopV55PropertyAdviceReexaminationLinkDiagnosticV1[]>();
  for (const diagnostic of input.preview.diagnostics) {
    const rows = diagnosticsByAnnotation.get(diagnostic.annotationId) ?? [];
    rows.push(diagnostic); diagnosticsByAnnotation.set(diagnostic.annotationId, rows);
  }
  const explicitAssertionIds = new Map<string, Set<string>>();
  const allowNoOpRevisionIds = new Set<string>();
  const consumedChoices = new Set<string>();

  for (const [annotationId, diagnostics] of diagnosticsByAnnotation) {
    const action = actionsById.get(annotationId);
    const latest = latestLedgerEntry(input.ledger, annotationId);
    if (!latest) throw new Error(`Le preview cite une annotation ${annotationId} absente du ledger parent.`);
    if (action?.kind === 'reject') continue;
    if (latest.disposition === 'rejected' && action?.kind !== 'restore') continue;
    if (latest.disposition === 'active' && !action) {
      throw new Error(`L’annotation active ${annotationId} possède des liens périmés; requalifie chaque lien ou rejette l’annotation.`);
    }
    if (latest.disposition === 'rejected' && action?.kind !== 'restore') {
      throw new Error(`L’annotation rejetée ${annotationId} doit être restaurée explicitement avant sa requalification.`);
    }
    if (action?.kind !== 'revise' && action?.kind !== 'restore') {
      throw new Error(`L’annotation ${annotationId} doit recevoir une révision/restauration explicite ou être rejetée.`);
    }
    const previousIntent = previousActiveIntent(input.ledger, annotationId);
    if (!previousIntent) throw new Error(`L’intention historique ${annotationId} ne porte aucune projection active à réqualifier.`);
    const confirmedIntent = action.activeIntent;
    if (confirmedIntent.interpretationOrigin !== 'user'
      || !exact(requalificationSemanticContent(previousIntent), requalificationSemanticContent(confirmedIntent))) {
      throw new Error(`La liaison ${annotationId} ne peut modifier automatiquement le rôle ou la propriété; confirme l’annotation dans une action distincte.`);
    }
    const expectedAssertionIds = [...previousIntent.comparisonBasis.assertionIds];
    for (const diagnostic of diagnostics) {
      const key = linkKey(annotationId, diagnostic.previousAssertionId);
      const choice = choiceByLink.get(key);
      if (!choice) throw new Error(`Le lien ${diagnostic.previousAssertionId} de ${annotationId} exige un choix explicite.`);
      consumedChoices.add(key);
      const index = expectedAssertionIds.indexOf(diagnostic.previousAssertionId);
      if (index < 0) throw new Error(`Le lien ${diagnostic.previousAssertionId} ne fait plus partie de ${annotationId}.`);
      expectedAssertionIds.splice(index, 1);
      if (choice.kind === 'bind') {
        const candidate = diagnostic.compatibleFreshAssertions.find(row => row.assertionId === choice.freshAssertionId);
        if (!candidate) throw new Error(`Le fait ${choice.freshAssertionId} n’est pas compatible et présent dans ce preview.`);
        expectedAssertionIds.splice(index, 0, candidate.assertionId);
        const explicit = explicitAssertionIds.get(annotationId) ?? new Set<string>();
        explicit.add(candidate.assertionId); explicitAssertionIds.set(annotationId, explicit);
        if (candidate.assertionId === diagnostic.previousAssertionId
          && candidate.assertionReference !== diagnostic.previousAssertionReference) allowNoOpRevisionIds.add(annotationId);
      } else if (!canDetachCurrentLink(previousIntent)) {
        throw new Error(`Le rôle ou la direction de ${annotationId} exige une base current; ce lien ne peut pas être détaché.`);
      }
    }
    if (new Set(expectedAssertionIds).size !== expectedAssertionIds.length) {
      throw new Error(`Les choix de requalification de ${annotationId} dupliquent un fait courant.`);
    }
    const expectedKind = expectedAssertionIds.length ? 'current' : 'none';
    if (confirmedIntent.comparisonBasis.kind !== expectedKind
      || !exact(confirmedIntent.comparisonBasis.assertionIds, expectedAssertionIds)) {
      throw new Error(`La révision ${annotationId} ne reflète pas exactement les choix de base affichés.`);
    }
  }

  if (consumedChoices.size !== choiceByLink.size) throw new Error('Un choix de liaison ne correspond à aucun lien périmé actif du preview.');
  return { explicitAssertionIds, allowNoOpRevisionIds };
}

function requirePreviewMatchesFreshInputs(input: PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input): {
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  sourceRecord: HopV55PropertyAdviceAnswerRecordV4;
  readingContext: HopV55PropertyAdviceV4ReadingContext;
} {
  assertReexaminationPreviewV1(input.preview);
  const preview = input.preview;
  if (input.expectedPreviewReference !== preview.reference) throw new Error('La référence attendue ne correspond pas au preview consulté.');
  const sourceRecord = loadSourceRecord(input.sourceRecord);
  if (sourceRecord.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT
    || sourceRecord.reference !== preview.parentRecordReference || sourceRecord.ledger.reference !== preview.parentLedgerReference
    || sourceRecord.sourceReadingReference !== preview.parentReadingReference) {
    throw new Error('Le record parent ou sa tête de ledger diffère du preview; relis le contexte avant confirmation.');
  }
  const recomputed = buildReexaminationPreviewV1({ ...input, previewId: preview.previewId });
  if (recomputed.reference !== preview.reference) throw new Error('Le Prepared, la source, l’archive ou le binding ont changé depuis le preview; prépare un nouveau preview.');
  if (input.transition.kind !== 'reexamine' || input.transition.parentRecordReference !== preview.parentRecordReference
    || input.transition.parentReadingReference !== preview.parentReadingReference) {
    throw new Error('La transition de confirmation ne cite pas le parent exact du preview.');
  }
  const binding = assertBinding(input.cultureBinding, sourceRecord.ownerKey, sourceRecord.workspaceId);
  const readingContext = validateConfirmedReexaminationContext({ preview, readingContext: input.readingContext,
    cultureBinding: binding ?? null });
  return { preview, sourceRecord, readingContext };
}

/** Confirms only choices shown in an exact fresh preview. This prepares a V4 draft but never builds or persists an answer. */
export function prepareVerifiedReexaminationV4(
  input: PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input,
): PrepareVerifiedHopV55PropertyAdviceReexaminationV4Result {
  try {
    const verified = requirePreviewMatchesFreshInputs(input);
    const ledgerRead = readHopV55PropertyAdviceAnnotationLedgerV1(verified.sourceRecord.ledger, verified.sourceRecord.originalQuestion);
    if (ledgerRead.status !== 'readOnly') throw new Error(`Le ledger V4 parent est invalide : ${ledgerRead.reason}`);
    const { explicitAssertionIds, allowNoOpRevisionIds } = validateBindingChoices({ preview: verified.preview,
      ledger: ledgerRead.ledger, actions: input.actions, bindingChoices: input.bindingChoices });
    const preparedInput: PrepareHopV55PropertyAdviceCorrectionV4Input = {
      sourceRecord: verified.sourceRecord, sourceReadingArchive: verified.preview.sourceReadingArchive,
      prepared: input.prepared, recordId: input.recordId, requestId: input.requestId,
      transition: input.transition, actions: input.actions, readingContext: verified.readingContext,
      cultureBinding: input.cultureBinding,
    };
    const result = prepareCorrectionV4Internal(preparedInput, { explicitAssertionIds, allowNoOpRevisionIds });
    return result.status === 'allRejected'
      ? { status: 'allRejected', recordDraft: result.recordDraft, previewReference: verified.preview.reference }
      : { status: 'ready', requestDraftV3: result.requestDraftV3, recordDraft: result.recordDraft,
        previewReference: verified.preview.reference };
  } catch (error) {
    return { status: 'blocked', reason: error instanceof Error ? error.message : 'La confirmation V4 est invalide.' };
  }
}

/** Explicit V3→V4 upgrade: annotations are initialized from the sealed request; no parse or source mutation. */
export function upgradeV3ToV4(input: Omit<PrepareHopV55PropertyAdviceCorrectionV4Input, 'sourceRecord' | 'actions'> & {
  sourceRecord: HopV55PropertyAdviceAnswerRecordV3;
}): PrepareHopV55PropertyAdviceCorrectionV4Result {
  if (input.transition.kind !== 'upgradeV3') throw new Error('La migration V3→V4 exige une transition upgradeV3 explicite.');
  return prepareCorrectionV4({ ...input, actions: [] });
}

/** Read-only V4 resume. It neither reparses the question nor invokes the answer builder. */
export function resumeV4(input: ResumeHopV55PropertyAdviceCorrectionV4Input): ResumeHopV55PropertyAdviceCorrectionV4Result {
  const read = readHopV55PropertyAdviceAnswerRecordV4(input.record);
  if (read.status !== 'readOnly') return read;
  const record = read.record;
  const archive = readArchive(input.sourceReadingArchive, record.ownerKey, record.workspaceId);
  if (archive.contentReference !== record.sourceReadingReference || archive.reading.intent.question !== record.originalQuestion
    || !exact(archive.source, record.preparation.source)) {
    return { status: 'unsupportedReadOnly', snapshot: input.record, reason: 'L’archive de lecture ne correspond plus à la référence V4 exacte.' };
  }
  const ledgerRead = readHopV55PropertyAdviceAnnotationLedgerV1(record.ledger, record.originalQuestion);
  if (ledgerRead.status !== 'readOnly') return { status: 'unsupportedReadOnly', snapshot: input.record, reason: ledgerRead.reason };
  const expected = hopV55PropertyAdvicePreparedReferenceV4({ prepared: input.prepared, readingContext: record.readingContext,
    ledger: ledgerRead.ledger, ...(record.preparation.cultureBinding ? { cultureBinding: record.preparation.cultureBinding } : {}) });
  if (expected !== record.preparation.preparedReference) {
    return { status: 'stale', record, reason: 'Le contexte Prepared, la lecture ou le binding NR a changé; réexamine avant toute nouvelle réponse.' };
  }
  if (record.outcome.kind === 'allRejected') return { status: 'allRejected', record };
  const answer = record.outcome.answerSnapshot;
  const body: Omit<HopV55PropertyAdviceRequestDraftV3, 'reference' | 'revisionContext' | 'reexaminationSource'> = {
    format: 'hop-v55-property-advice-request-draft-v3', id: answer.requestSnapshot.id,
    ownerKey: record.ownerKey, workspaceId: record.workspaceId,
    sourceReadingReference: record.sourceReadingReference, preparedReference: record.preparation.preparedReference,
    requestSnapshot: clone(answer.requestSnapshot),
  };
  const requestDraftV3: HopV55PropertyAdviceRequestDraftV3 = {
    ...body, reference: record.outcome.requestDraftReference,
  };
  assertHopV55PropertyAdviceRequestDraftV3(requestDraftV3);
  if (hopV55PropertyAdviceRequestDraftReferenceV3(body) !== record.outcome.requestDraftReference) {
    return { status: 'unsupportedReadOnly', snapshot: input.record, reason: 'La référence de requestDraft V3 du record V4 est incohérente.' };
  }
  return { status: 'ready', record, requestDraftV3 };
}
