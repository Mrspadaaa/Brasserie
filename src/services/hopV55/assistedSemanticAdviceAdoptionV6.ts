/**
 * Pure adoption of linked V6 suggestions into the V4 advice ledger. A sealed local plan binds the V6
 * envelope, ticket, archive/view, the explicit selection, its evidence, the relevant fresh context and
 * the expected head; confirmation re-reads all of them before building anything. The result is an
 * adopted advice record and a local receipt: never a Recipe patch. Durable, atomic persistence of the
 * record with its receipt (CAS on the expected head, commandId index) belongs to the Application
 * repository/controller; nothing here simulates it.
 */
import type { BrewerEvidence } from '../../../functions/src/companionTypes';
import {
  brewerHopAdviceCurrentCultureReference,
  compareBrewerHopAdviceContextBindings,
  type BrewerHopAdviceCultureUseV1,
  type BrewerHopAdviceContextProjectionV1,
  type BrewerHopAdviceContextScopeV1,
} from '../../../functions/src/brewerHopAdviceContextBinding';
import { brewerHopAdviceRequestV3Reference, brewerHopAdviceRequestV3ReferenceForWizardV1,
  readBrewerHopAdviceRequestV3ForWizardV1,
  brewerHopAdviceSourceViewReferenceV1ForWizardV1, type BrewerHopAdviceWizardRequestV3 } from '../../../functions/src/brewerHopAdviceSemanticV3';
import {
  assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1,
  readBrewerHopAdviceProposalEnvelopeV6ForWizardV1,
  verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1,
  type BrewerHopAdviceProposalEnvelopeV6,
  type BrewerHopAdviceWizardProposalEnvelopeV6,
} from '../../../functions/src/brewerHopAdviceSemanticV6';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { buildHopPropertyAdviceV3 } from '../../domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3, HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { readHopV55AdoptedContextBinding, type HopV55AdoptedContextBindingV1 } from './adoptedContextResolution';
import {
  compareHopV55SemanticAdviceContextAtReceptionV1,
  readHopV55SemanticCurrentPageContextV1,
  prepareHopV55SemanticAssistedAdviceLaunchForWizardV1,
  type PrepareHopV55SemanticContextLaunchInput,
  type PrepareHopV55SemanticContextLaunchInputForWizardV1,
} from './assistedSemanticAdviceContextV4';
import { receiveHopV55AssistedSemanticAdviceProposalV6 } from './assistedSemanticAdviceV6';
import {
  prepareCorrectionV4,
  prepareInitialPropertyAdviceV4,
  prepareCorrectionV4ForWizardV1,
  prepareInitialPropertyAdviceV4ForWizardV1,
  type HopV55PropertyAdviceAdditionV4,
} from './propertyAdvicePreparationV4';
import type { HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';
import {
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT,
  createHopV55PropertyAdviceAnswerRecordV4,
  createHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  readHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  type HopV55PropertyAdviceCorrectionV4Draft,
  type HopV55PropertyAdviceCorrectionV4DraftForWizardV1,
  type HopV55PropertyAdviceV4Transition,
} from './propertyAdviceRecordsV4';
import {
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT,
  readHopV55PropertyAdviceAnswerRecordV3,
  type HopV55PropertyAdviceAnswerRecordV3,
} from './propertyAdviceRecordsV3';
import type { BrewerHopAdviceWizardCanonicalSnapshotV1, BrewerHopAdviceWizardOriginV1 } from '../../../functions/src/brewerHopAdviceWizardSourceV1';
import type { HopV55WizardDecisionReadingArchiveV4 } from './decisionArchive';

export const HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT = 'hop-v55-semantic-adoption-plan-v1' as const;
export const HOP_V55_SEMANTIC_ADOPTION_COMMAND_V1_FORMAT = 'hop-v55-semantic-adoption-command-v1' as const;
export const HOP_V55_SEMANTIC_ADOPTION_RECEIPT_V1_FORMAT = 'hop-v55-semantic-adoption-receipt-v1' as const;

/** Expected head of the advice chain; a head appearing after the preview never turns a create into a revise. */
export type HopV55SemanticAdoptionHeadV1 =
  | { kind: 'none' }
  | { kind: 'recordV3'; reference: string }
  | { kind: 'recordV4'; reference: string; ledgerReference: string };

/** Current head as re-read by the host: the exact record, or its explicit absence. */
export type HopV55SemanticAdoptionHeadInputV1 =
  | { kind: 'none' }
  | { kind: 'recordV3' | 'recordV4'; record: unknown };

/** Authorized principal from the host session, bound by the host to owner/workspace/scope. */
export interface HopV55SemanticAdoptionPrincipalV1 {
  principalId: string;
  ownerKey: string;
  workspaceId: string;
  scope: BrewerHopAdviceContextScopeV1;
  /** Display label only. It becomes the closed V4 actor label and proves no identity. */
  label: string;
}

/** Identity of the durable Application ticket that carried the turn; never read from the model. */
export interface HopV55SemanticAdoptionTicketV1 {
  /** Absent on the byte-stable classic Request3 profile; Wizard tickets carry this explicit discriminator. */
  profile?: 'wizardV1';
  ticketId: string;
  operationId: string;
  generation: number;
  ownerKey: string;
  workspaceId: string;
  scope: BrewerHopAdviceContextScopeV1;
  /** Exact RequestV3 reference sealed in this ticket. */
  requestReference: string;
}

export interface HopV55SemanticAdoptionSelectionInputV1 {
  optionId: string;
  proposalId: string;
  /** Brewer's motive for this line. */
  reason: string;
  /** Optional brewer edit of the suggested intent, same ID and fragments; its origin is set to user here. */
  activeIntent?: HopPropertyAdviceIntentV3;
}

export interface HopV55SemanticAdoptionSelectionV1 {
  optionId: string;
  proposalId: string;
  /** Evidence of the sealed link: a subset of the option's typed references. */
  evidenceIds: string[];
  /** Exact turn dependencies of these evidence IDs, as sealed in the envelope. */
  evidenceDependencies: Array<{ evidenceId: string; toolName: string; contentReference: string }>;
  /** The qualified suggestion, kept as the immutable source of the ledger line (origin proposal). */
  sourceAnnotation: HopPropertyAdviceIntentV3;
  /** The brewer-confirmed active intent (origin user). */
  activeIntent: HopPropertyAdviceIntentV3;
  reason: string;
}

export interface HopV55SemanticAdoptionPlanV1 {
  format: typeof HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT;
  /** Absent on historical/classic plans; Wizard plans use an explicit same-record profile discriminator. */
  profile?: 'wizardV1';
  commandId: string;
  recordId: string;
  requestId: string;
  reason: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ticket: HopV55SemanticAdoptionTicketV1;
  envelopeReference: string;
  requestReference: string;
  sourceReadingReference: string;
  sourceViewReference: string;
  selection: HopV55SemanticAdoptionSelectionV1[];
  expectedHead: HopV55SemanticAdoptionHeadV1;
  /** Fresh physical/dependency projection at preview; compared by canonical references, never by timestamps. */
  currentProjection: BrewerHopAdviceContextProjectionV1;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  cultureBindingReference: string | null;
  previewedAt: string;
  reference: string;
}

export interface HopV55SemanticAdoptionReceiptV1 {
  format: typeof HOP_V55_SEMANTIC_ADOPTION_RECEIPT_V1_FORMAT;
  commandId: string;
  fingerprint: string;
  planReference: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ticket: HopV55SemanticAdoptionTicketV1;
  selection: Array<{ optionId: string; proposalId: string }>;
  expectedHead: HopV55SemanticAdoptionHeadV1;
  record: { id: string; reference: string; ledgerReference: string };
  /** Host commit instant of the first commit; a replay returns this receipt unchanged. */
  effectiveAt: string;
  /** An adopted intent is advice, not a recipe change. */
  recipeEffect: 'none';
  reference: string;
}

/** What the Application must persist atomically: record and receipt, under a CAS on `expectedHead`. */
export interface HopV55SemanticAdoptionCommandV1 {
  format: typeof HOP_V55_SEMANTIC_ADOPTION_COMMAND_V1_FORMAT;
  commandId: string;
  fingerprint: string;
  planReference: string;
  /** `none` means the CAS must also prove that no head exists. */
  expectedHead: HopV55SemanticAdoptionHeadV1;
  recordId: string;
}

export interface PrepareHopV55SemanticAdoptionPlanV1Input {
  envelope: unknown;
  request: unknown;
  sourceArchive: unknown;
  turnEvidence: readonly BrewerEvidence[];
  current: PrepareHopV55SemanticContextLaunchInput | PrepareHopV55SemanticContextLaunchInputForWizardV1;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ticket: HopV55SemanticAdoptionTicketV1;
  selection: readonly HopV55SemanticAdoptionSelectionInputV1[];
  head: HopV55SemanticAdoptionHeadInputV1;
  commandId: string;
  recordId: string;
  requestId: string;
  reason: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  previewedAt: string;
}

export type PrepareHopV55SemanticAdoptionPlanV1Result =
  | { status: 'ready'; plan: HopV55SemanticAdoptionPlanV1;
      preview: { record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
        requestDraftV3: HopV55PropertyAdviceRequestDraftV3 } }
  | { status: 'pending' | 'stale' | 'unsupported' | 'invalid'; reason: string };

export interface ConfirmHopV55SemanticAdoptionV1Input {
  plan: unknown;
  /** Objects re-read from the durable ticket and workspace at confirmation, not kept from the preview. */
  envelope: unknown;
  request: unknown;
  sourceArchive: unknown;
  turnEvidence: readonly BrewerEvidence[];
  current: PrepareHopV55SemanticContextLaunchInput | PrepareHopV55SemanticContextLaunchInputForWizardV1;
  principal: HopV55SemanticAdoptionPrincipalV1;
  /** Current durable ticket identity, operation and generation from the Application runtime. */
  ticket: HopV55SemanticAdoptionTicketV1;
  head: HopV55SemanticAdoptionHeadInputV1;
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  /** Receipt already stored under the plan's commandId, if any. */
  existingReceipt?: unknown;
  /** Host commit instant; ignored for a replay. */
  effectiveAt: string;
}

export type ConfirmHopV55SemanticAdoptionV1Result =
  | { status: 'ready'; record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1; receipt: HopV55SemanticAdoptionReceiptV1;
      command: HopV55SemanticAdoptionCommandV1; recipeEffect: 'none' }
  /** Already committed under this commandId and fingerprint: nothing is rebuilt or reapplied. */
  | { status: 'replay'; receipt: HopV55SemanticAdoptionReceiptV1 }
  | { status: 'conflict' | 'stale' | 'pending' | 'unsupported' | 'invalid'; reason: string };

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T>(value: T): T => structuredClone(value);
const ref = (namespace: string, value: unknown) => hopAdviceContentReference(namespace, value);
const same = (left: unknown, right: unknown) => ref('hop-v55-semantic-adoption-equality-v1', left) === ref('hop-v55-semantic-adoption-equality-v1', right);
const isoInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && Number.isFinite(Date.parse(value));
class AdoptionRefusal extends Error {
  constructor(readonly status: 'stale' | 'unsupported' | 'invalid' | 'conflict', message: string) { super(message); }
}
function refuse(status: AdoptionRefusal['status'], message: string): never { throw new AdoptionRefusal(status, message); }
const exactKeys = (value: Row, keys: readonly string[], label: string): void => {
  const extra = Object.keys(value).filter(key => !keys.includes(key));
  if (extra.length) refuse('invalid', `${label} contient des champs inconnus (${extra.slice(0, 4).join(', ')}).`);
};

function assertScope(value: unknown, label: string): asserts value is BrewerHopAdviceContextScopeV1 {
  if (!isRow(value) || !['recipe', 'batch', 'draft', 'app'].includes(String(value.kind)) || !text(value.id)) refuse('invalid', `${label} invalide.`);
  exactKeys(value as Row, ['kind', 'id'], label);
}
function assertPrincipal(value: unknown): asserts value is HopV55SemanticAdoptionPrincipalV1 {
  if (!isRow(value) || !text(value.principalId) || !text(value.ownerKey) || !text(value.workspaceId) || !text(value.label)) {
    refuse('invalid', 'Principal hôte absent ou incomplet; ni le modèle ni un label ne l’authentifient.');
  }
  exactKeys(value as Row, ['principalId', 'ownerKey', 'workspaceId', 'scope', 'label'], 'Principal');
  assertScope((value as Row).scope, 'Scope du principal');
}
function assertTicket(value: unknown): asserts value is HopV55SemanticAdoptionTicketV1 {
  if (!isRow(value) || !text(value.ticketId) || !text(value.operationId) || !Number.isSafeInteger(value.generation)
    || (value.generation as number) < 0 || !text(value.ownerKey) || !text(value.workspaceId) || !text(value.requestReference)) {
    refuse('invalid', 'Ticket assisté absent ou incomplet.');
  }
  const keys = ['ticketId', 'operationId', 'generation', 'ownerKey', 'workspaceId', 'scope', 'requestReference'];
  if (value.profile !== undefined && value.profile !== 'wizardV1') refuse('unsupported', 'Profil du ticket d’adoption futur.');
  exactKeys(value as Row, value.profile === 'wizardV1' ? [...keys, 'profile'] : keys, 'Ticket');
  assertScope((value as Row).scope, 'Scope du ticket');
}

function principalAuthorization(value: Pick<HopV55SemanticAdoptionPrincipalV1, 'principalId' | 'ownerKey' | 'workspaceId' | 'scope'>) {
  return { principalId: value.principalId, ownerKey: value.ownerKey, workspaceId: value.workspaceId, scope: value.scope };
}

/** A current display label is not authentication; only the host principal and its partition/scope identify the caller. */
function assertCurrentPrincipalForPlan(current: unknown, plan: HopV55SemanticAdoptionPrincipalV1): void {
  if (!isRow(current) || !text(current.principalId) || !text(current.ownerKey) || !text(current.workspaceId)) {
    refuse('invalid', 'Identité authentifiée, owner ou workspace du principal courant absent.');
  }
  exactKeys(current, ['principalId', 'ownerKey', 'workspaceId', 'scope', 'label'], 'Principal authentifié');
  if (current.label !== undefined && typeof current.label !== 'string') {
    refuse('invalid', 'Le label d’affichage du principal courant doit rester un texte.');
  }
  assertScope(current.scope, 'Scope du principal authentifié');
  const currentAuthorization = { principalId: current.principalId as string, ownerKey: current.ownerKey as string,
    workspaceId: current.workspaceId as string, scope: current.scope };
  if (!same(principalAuthorization(currentAuthorization), principalAuthorization(plan))) {
    refuse('invalid', 'Le principal authentifié ne correspond pas à l’identité, au workspace ou au scope du plan.');
  }
}

function cultureBindingReferenceFromProjection(value: unknown): string | null {
  if (!isRow(value) || !text(value.status)) refuse('invalid', 'Projection de consommation culturelle absente ou invalide.');
  if (value.status === 'notApplicable' || value.status === 'notReceived') {
    exactKeys(value, ['status'], 'CultureUse');
    return null;
  }
  const keys = value.status === 'declaredNotConsumed'
    ? ['status', 'reference', 'bindingReference']
    : value.status === 'consumed' ? ['status', 'reference', 'bindingReference', 'cultureReference'] : [];
  if (!keys.length) refuse('unsupported', 'Statut de consommation NR futur conservé sans adoption.');
  exactKeys(value, keys, 'CultureUse');
  if (!isRow(value.reference) || !text(value.reference.id) || !text(value.reference.version) || !text(value.reference.contentReference)
    || !text(value.bindingReference) || value.status === 'consumed' && !text(value.cultureReference)) {
    refuse('invalid', 'Identité ou référence du binding NR absente de la projection courante.');
  }
  return value.bindingReference as string;
}

/** Verifies a supplied adopted binding against the fresh Page projection before any V4 builder runs. */
function assertCultureBindingMatchesProjection(input: {
  binding: HopV55AdoptedContextBindingV1 | null;
  culture: BrewerHopAdviceCultureUseV1;
  ownerKey: string;
  workspaceId: string;
  runtime: Parameters<typeof brewerHopAdviceCurrentCultureReference>[0];
}): string | null {
  if (input.culture.status === 'notApplicable' || input.culture.status === 'notReceived') {
    if (input.binding !== null) refuse('stale', `La projection NR est ${input.culture.status}; aucun binding ne doit être passé au builder.`);
    return null;
  }
  if (input.binding === null) refuse('stale', 'La projection NR porte une identité adoptée, mais aucun binding courant n’est fourni.');
  // `strict: false` does not narrow the shared notApplicable|notReceived discriminant union reliably.
  // The early return above makes this the exact adopted-status subset at runtime.
  const culture = input.culture as Extract<BrewerHopAdviceCultureUseV1,
    { status: 'declaredNotConsumed' | 'consumed' }>;
  const read = readHopV55AdoptedContextBinding(input.binding);
  if (read.status !== 'available') refuse('invalid', `Binding NR fourni illisible : ${read.reason}`);
  const binding = read.binding;
  if (binding.ownerKey !== input.ownerKey || binding.workspaceId !== input.workspaceId) {
    refuse('invalid', 'Le binding NR fourni appartient à un autre owner ou workspace.');
  }
  if (binding.bindingReference !== culture.bindingReference || !same(binding.reference, culture.reference)) {
    refuse('stale', 'Le binding NR fourni ne correspond pas à la référence et à l’empreinte de la projection courante.');
  }
  if (culture.status === 'consumed') {
    if (binding.culture.status !== 'declared') refuse('stale', 'La projection NR consommée ne correspond pas à la déclaration culturelle scellée.');
    if (brewerHopAdviceCurrentCultureReference(input.runtime) !== culture.cultureReference) {
      refuse('stale', 'La culture réellement consommée diffère de sa référence dans la projection courante.');
    }
  }
  return binding.bindingReference;
}

function readHead(value: HopV55SemanticAdoptionHeadInputV1):
  { expected: HopV55SemanticAdoptionHeadV1; record?: HopV55PropertyAdviceAnswerRecordV3 | HopV55PropertyAdviceAnswerRecordV4 } {
  if (!isRow(value)) refuse('invalid', 'Tête de conseil absente.');
  if (value.kind === 'none') { exactKeys(value as Row, ['kind'], 'Tête'); return { expected: { kind: 'none' } }; }
  exactKeys(value as Row, ['kind', 'record'], 'Tête');
  const record = (value as { record: unknown }).record;
  try {
    if (value.kind === 'recordV3' && isRow(record) && record.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT) {
      const read = readHopV55PropertyAdviceAnswerRecordV3(record);
      if (read.status === 'readOnly') return { expected: { kind: 'recordV3', reference: read.record.reference }, record: read.record };
      refuse('unsupported', `Tête V3 en lecture seule : ${read.reason}`);
    }
    if (value.kind === 'recordV4' && isRow(record) && record.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT) {
      const read = readHopV55PropertyAdviceAnswerRecordV4(record);
      if (read.status === 'readOnly') return { expected: { kind: 'recordV4', reference: read.record.reference,
        ledgerReference: read.record.ledger.reference }, record: read.record };
      refuse('unsupported', `Tête V4 en lecture seule : ${read.reason}`);
    }
  } catch (error) {
    if (error instanceof AdoptionRefusal) throw error;
    refuse('invalid', error instanceof Error ? error.message : 'Tête de conseil illisible.');
  }
  return refuse('invalid', 'La tête déclarée ne correspond pas au format exact de son record.');
}

function readHeadForWizardV1(value: HopV55SemanticAdoptionHeadInputV1):
  { expected: HopV55SemanticAdoptionHeadV1; record?: HopV55PropertyAdviceAnswerRecordV4ForWizardV1 } {
  if (!isRow(value)) refuse('invalid', 'Tête documentaire Wizard absente.');
  if (value.kind === 'none') { exactKeys(value, ['kind'], 'Tête Wizard'); return { expected: { kind: 'none' } }; }
  if (value.kind === 'recordV4') {
    exactKeys(value, ['kind', 'record'], 'Tête Wizard');
    const read = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(value.record);
    if (read.status === 'readOnly') return { expected: { kind: 'recordV4', reference: read.record.reference,
      ledgerReference: read.record.ledger.reference }, record: read.record };
    refuse('unsupported', `Tête V4 Wizard conservée en lecture seule : ${read.reason}`);
  }
  if (value.kind === 'recordV3') refuse('unsupported', 'Une archive Wizard ne convertit pas une tête documentaire V3 classique.');
  return refuse('invalid', 'Tête Wizard de kind inconnu.');
}

/** Qualifies the V6 turn, its bindings to principal/ticket and the fresh Page context, at preview or confirmation. */
function qualifyTurn(input: {
  envelope: unknown; request: unknown; sourceArchive: unknown; turnEvidence: readonly BrewerEvidence[];
  current: PrepareHopV55SemanticContextLaunchInput | PrepareHopV55SemanticContextLaunchInputForWizardV1;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ticket: HopV55SemanticAdoptionTicketV1; stage: 'reception' | 'confirmation';
}) {
  assertPrincipal(input.principal);
  assertTicket(input.ticket);
  if (input.ticket.profile === 'wizardV1') {
    if (!('archiveWizard' in input.current)) refuse('invalid', 'Le ticket Wizard exige le reader, le snapshot et le Prepared exacts du Wizard courant.');
    const requestRead = readBrewerHopAdviceRequestV3ForWizardV1(input.request);
    if (requestRead.status !== 'readOnly') refuse(requestRead.status === 'invalid' ? 'invalid' : 'unsupported', requestRead.reason);
    const request = requestRead.request;
    const envelopeRead = readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(input.envelope);
    if (envelopeRead.status === 'invalid') refuse('invalid', envelopeRead.reason);
    if (envelopeRead.status !== 'readOnly') refuse('unsupported', envelopeRead.reason);
    const envelope = envelopeRead.envelope;
    assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1(envelope, request);
    verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1(envelope, input.turnEvidence);
    if (!same(envelope.requestSnapshot, request)
      || input.principal.ownerKey !== request.contextLaunch.ownerKey
      || input.principal.workspaceId !== request.contextLaunch.workspaceId
      || !same(input.principal.scope, request.contextLaunch.scope)
      || input.ticket.ownerKey !== request.contextLaunch.ownerKey || input.ticket.workspaceId !== request.contextLaunch.workspaceId
      || !same(input.ticket.scope, request.contextLaunch.scope)
      || input.ticket.requestReference !== brewerHopAdviceRequestV3ReferenceForWizardV1(request)) {
      refuse('invalid', 'Principal, ticket, scope ou Request3 Wizard divergent de la fermeture V6.');
    }
    const current = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(input.current);
    if (current.status !== 'ready') {
      if (current.status === 'stale') refuse('stale', current.reason);
      if (current.status === 'unsupportedReadOnly') refuse('unsupported', current.reason);
      refuse('invalid', current.reason);
    }
    if (current.sourceReadingReference !== request.sourceReadingReference
      || current.request.sourceReadingReference !== request.sourceReadingReference
      || brewerHopAdviceRequestV3ReferenceForWizardV1(current.request) !== brewerHopAdviceRequestV3ReferenceForWizardV1(request)) {
      refuse('stale', 'L’archive, le snapshot, le Prepared ou la projection physique Wizard ont changé depuis le ticket.');
    }
    return { profile: 'wizardV1' as const, envelope, request, prepared: current.prepared, projection: current.projection };
  }
  if ('archiveWizard' in input.current) refuse('invalid', 'La lecture Wizard exige un ticket explicitement profilé Wizard.');
  const received = receiveHopV55AssistedSemanticAdviceProposalV6({ request: input.request, sourceArchive: input.sourceArchive,
    envelope: input.envelope, current: input.current, turnEvidence: input.turnEvidence });
  if (received.status === 'invalid') refuse('invalid', received.reason);
  if (received.status !== 'readOnly') {
    refuse('unsupported', received.status === 'legacyReadOnly'
      ? `Réponse ${received.format} relisible en lecture seule; aucun lien V6 ne peut être reconstitué pour l’adopter.`
      : received.reason);
  }
  const accepted = received as Extract<typeof received, { status: 'readOnly' }>;
  const envelope = accepted.envelope;
  const request = envelope.requestSnapshot;
  const launch = request.contextLaunch;
  if (input.principal.ownerKey !== launch.ownerKey || input.principal.workspaceId !== launch.workspaceId
    || !same(input.principal.scope, launch.scope)) {
    refuse('invalid', 'Le principal hôte ne correspond pas à l’owner, au workspace ou au scope du lancement.');
  }
  if (input.ticket.ownerKey !== launch.ownerKey || input.ticket.workspaceId !== launch.workspaceId
    || !same(input.ticket.scope, launch.scope) || input.ticket.requestReference !== brewerHopAdviceRequestV3Reference(request)) {
    refuse('invalid', 'Le ticket ne porte pas la RequestV3, l’owner, le workspace ou le scope exacts de cette réponse.');
  }
  // The existing comparator, at the requested stage: A stays readable, but only a current A may be adopted.
  const check = compareHopV55SemanticAdviceContextAtReceptionV1({ launch,
    serverRequestReadingReference: request.sourceReadingReference, serverProjection: envelope.serverContext.binding,
    current: input.current, stage: input.stage });
  if (check.history.status !== 'matched') refuse('stale', check.history.reason);
  if (check.applicability.status !== 'current') refuse('stale', check.applicability.reason);
  if (check.applicability.recalculationRequired) refuse('stale', 'Les dépendances du tour diffèrent du contexte courant; relance le conseil avant de confirmer.');
  const fresh = readHopV55SemanticCurrentPageContextV1(input.current);
  if (fresh.status !== 'ready') refuse('stale', 'reason' in fresh ? fresh.reason : `Page conserve un format ${fresh.format} sans conversion.`);
  const ready = fresh as Extract<typeof fresh, { status: 'ready' }>;
  return { profile: 'classicV3' as const, envelope, request, prepared: ready.prepared, projection: ready.projection };
}

/** Selection rebuilt from the sealed envelope only: link, suggestion, evidence dependencies, confirmed intent. */
function selectionFromEnvelope(envelope: { proposal: BrewerHopAdviceProposalEnvelopeV6['proposal'];
  evidence: BrewerHopAdviceProposalEnvelopeV6['evidence'] },
  inputs: readonly HopV55SemanticAdoptionSelectionInputV1[]): HopV55SemanticAdoptionSelectionV1[] {
  if (!Array.isArray(inputs) || !inputs.length) refuse('invalid', 'Une adoption confirme au moins une suggestion explicitement choisie.');
  const proposals = new Set<string>();
  return inputs.map((input, index) => {
    const label = `Sélection ${index + 1}`;
    if (!isRow(input) || !text(input.optionId) || !text(input.proposalId) || !text(input.reason)) {
      refuse('invalid', `${label} exige une option, une suggestion et le motif du brasseur.`);
    }
    exactKeys(input as unknown as Row, ['optionId', 'proposalId', 'reason', 'activeIntent'], label);
    if (proposals.has(input.proposalId)) refuse('invalid', `${label} répète la suggestion ${input.proposalId}.`);
    proposals.add(input.proposalId);
    const link = envelope.proposal.optionProposalLinks.find(row => row.optionId === input.optionId && row.proposalId === input.proposalId);
    if (!link) refuse('invalid', `${label} : aucun lien scellé ne relie l’option ${input.optionId} à ${input.proposalId}.`);
    if (envelope.proposal.semanticRevisionProposals.some(row => row.proposalId === input.proposalId)) {
      refuse('unsupported', `${label} : une révision de la lecture source4 ne s’adopte pas dans le ledger de conseil; la correction source4 V1 n’accepte aucun nouvel ID.`);
    }
    const proposal = envelope.proposal.propertyIntentProposals.find(row => row.proposalId === input.proposalId);
    if (!proposal) refuse('invalid', `${label} : ${input.proposalId} n’est pas une suggestion de cette réponse.`);
    if (proposal!.kind !== 'add') refuse('unsupported', `${label} : une révision d’intention source passe par la correction V4 existante, pas par cet ajout.`);
    const activeIntent = { ...clone((input.activeIntent ?? proposal!.intent) as unknown as HopPropertyAdviceIntentV3),
      interpretationOrigin: 'user' as const };
    const evidenceIds = [...link!.evidenceIds];
    return {
      optionId: input.optionId, proposalId: input.proposalId, evidenceIds,
      evidenceDependencies: envelope.evidence.dependencies.filter(row => evidenceIds.includes(row.evidenceId)).map(clone),
      sourceAnnotation: clone(proposal!.intent) as unknown as HopPropertyAdviceIntentV3, activeIntent, reason: input.reason,
    };
  });
}

function buildRecord(input: {
  head: ReturnType<typeof readHead>;
  sourceArchive: unknown;
  ownerKey: string; workspaceId: string;
  prepared: Parameters<typeof prepareInitialPropertyAdviceV4>[0]['prepared'];
  commandId: string; recordId: string; requestId: string; reason: string; label: string; recordedAt: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  selection: readonly HopV55SemanticAdoptionSelectionV1[];
}): { status: 'ready'; record: HopV55PropertyAdviceAnswerRecordV4; requestDraftV3: HopV55PropertyAdviceRequestDraftV3 } | { status: 'pending'; reason: string } {
  const additions: HopV55PropertyAdviceAdditionV4[] = input.selection.map(row => ({ kind: 'add',
    sourceAnnotation: clone(row.sourceAnnotation), activeIntent: clone(row.activeIntent), reason: row.reason }));
  const actor = { origin: 'user' as const, label: input.label };
  const prepareDraft = (): { requestDraftV3: HopV55PropertyAdviceRequestDraftV3; recordDraft: HopV55PropertyAdviceCorrectionV4Draft }
    | { status: 'pending'; reason: string } => {
    if (input.head.expected.kind === 'none') {
      const transition: HopV55PropertyAdviceV4Transition = { actId: input.commandId, kind: 'create', reason: input.reason,
        actor, recordedAt: input.recordedAt };
      const initial = prepareInitialPropertyAdviceV4({ sourceReadingArchive: input.sourceArchive, ownerKey: input.ownerKey,
        workspaceId: input.workspaceId, prepared: input.prepared, recordId: input.recordId, requestId: input.requestId,
        candidatePolicy: input.candidatePolicy, cultureBinding: input.cultureBinding, transition, additions });
      return initial;
    }
    const source = input.head.record!;
    const transition: HopV55PropertyAdviceV4Transition = { actId: input.commandId,
      kind: input.head.expected.kind === 'recordV3' ? 'upgradeV3' : 'revise',
      parentRecordReference: source.reference, parentReadingReference: source.sourceReadingReference,
      reason: input.reason, actor, recordedAt: input.recordedAt };
    const corrected = prepareCorrectionV4({ sourceRecord: source, sourceReadingArchive: input.sourceArchive,
      prepared: input.prepared, recordId: input.recordId, requestId: input.requestId, transition, actions: additions,
      cultureBinding: input.cultureBinding });
    return corrected.status === 'ready' ? corrected : { status: 'pending', reason: 'Aucune ligne active après l’ajout; rien n’est scellé.' };
  };
  let draft: ReturnType<typeof prepareDraft>;
  // Collision, foreign link, fabricated measurement, other reading (explicit reexamination needed): no silent fix.
  try { draft = prepareDraft(); }
  catch (error) { return refuse('invalid', error instanceof Error ? error.message : 'Sélection non qualifiable en V4.'); }
  if (!('recordDraft' in draft)) return draft;
  // Canonical documentary answer from the V3 request; the model's answer is never the domain result.
  const answer = buildHopPropertyAdviceV3(draft.requestDraftV3.requestSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV4({ draft: draft.recordDraft,
    outcome: { kind: 'domainAnswer', requestDraftReference: draft.requestDraftV3.reference, answerSnapshot: answer, answerReference: answer.reference } });
  return { status: 'ready', record, requestDraftV3: draft.requestDraftV3 };
}

function buildRecordForWizardV1(input: {
  head: { expected: HopV55SemanticAdoptionHeadV1; record?: HopV55PropertyAdviceAnswerRecordV4ForWizardV1 };
  sourceArchive: HopV55WizardDecisionReadingArchiveV4;
  current: PrepareHopV55SemanticContextLaunchInputForWizardV1;
  ownerKey: string; workspaceId: string;
  prepared: Parameters<typeof prepareInitialPropertyAdviceV4ForWizardV1>[0]['prepared'];
  commandId: string; recordId: string; requestId: string; reason: string; label: string; recordedAt: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  selection: readonly HopV55SemanticAdoptionSelectionV1[];
}): { status: 'ready'; record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
      requestDraftV3: HopV55PropertyAdviceRequestDraftV3 } | { status: 'pending'; reason: string } {
  const additions: HopV55PropertyAdviceAdditionV4[] = input.selection.map(row => ({ kind: 'add',
    sourceAnnotation: clone(row.sourceAnnotation), activeIntent: clone(row.activeIntent), reason: row.reason }));
  const actor = { origin: 'user' as const, label: input.label };
  let draft: { requestDraftV3: HopV55PropertyAdviceRequestDraftV3; recordDraft: HopV55PropertyAdviceCorrectionV4DraftForWizardV1 }
    | { status: 'pending'; reason: string };
  try {
    if (input.head.expected.kind === 'none') {
      const transition: HopV55PropertyAdviceV4Transition = { actId: input.commandId, kind: 'create', reason: input.reason,
        actor, recordedAt: input.recordedAt };
      const initial = prepareInitialPropertyAdviceV4ForWizardV1({ sourceReadingArchive: input.sourceArchive,
        origin: input.current.origin, snapshot: input.current.snapshot, ownerKey: input.ownerKey,
        workspaceId: input.workspaceId, prepared: input.prepared, recordId: input.recordId, requestId: input.requestId,
        candidatePolicy: input.candidatePolicy, cultureBinding: input.cultureBinding, transition, additions });
      draft = initial.status === 'ready' ? initial : { status: 'pending', reason: 'Aucune intention active ne reste après la création Wizard.' };
    } else if (input.head.expected.kind === 'recordV4' && input.head.record) {
      const transition: HopV55PropertyAdviceV4Transition = { actId: input.commandId, kind: 'revise',
        parentRecordReference: input.head.record.reference, parentReadingReference: input.head.record.sourceReadingReference,
        reason: input.reason, actor, recordedAt: input.recordedAt };
      const corrected = prepareCorrectionV4ForWizardV1({ sourceRecord: input.head.record,
        sourceReadingArchive: input.sourceArchive, origin: input.current.origin, snapshot: input.current.snapshot,
        prepared: input.prepared, recordId: input.recordId, requestId: input.requestId, transition,
        actions: additions, cultureBinding: input.cultureBinding });
      draft = corrected.status === 'ready' ? corrected : { status: 'pending', reason: 'Aucune intention active ne reste après la correction Wizard.' };
    } else {
      refuse('unsupported', 'La correction Wizard exige une absence de tête ou une tête V4 Wizard stricte; aucune migration implicite.');
    }
  } catch (error) {
    return refuse('invalid', error instanceof Error ? error.message : 'Sélection Wizard non qualifiable en V4.');
  }
  if (!('recordDraft' in draft)) return draft;
  const answer = buildHopPropertyAdviceV3(draft.requestDraftV3.requestSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV4ForWizardV1({ draft: draft.recordDraft,
    outcome: { kind: 'domainAnswer', requestDraftReference: draft.requestDraftV3.reference,
      answerSnapshot: answer, answerReference: answer.reference } });
  return { status: 'ready', record, requestDraftV3: draft.requestDraftV3 };
}

function planBody(plan: HopV55SemanticAdoptionPlanV1 | Omit<HopV55SemanticAdoptionPlanV1, 'reference'>) {
  const { reference: _reference, ...body } = plan as HopV55SemanticAdoptionPlanV1;
  return body;
}

/** Content bound by one command: selection, expected references and head, principal, ticket and relevant context. */
export function hopV55SemanticAdoptionFingerprintV1(plan: HopV55SemanticAdoptionPlanV1): string {
  const { previewedAt: _previewedAt, ...bound } = planBody(plan);
  return ref(HOP_V55_SEMANTIC_ADOPTION_COMMAND_V1_FORMAT, bound);
}

const PLAN_KEYS = ['format', 'commandId', 'recordId', 'requestId', 'reason', 'principal', 'ticket', 'envelopeReference',
  'requestReference', 'sourceReadingReference', 'sourceViewReference', 'selection', 'expectedHead', 'currentProjection',
  'candidatePolicy', 'cultureBindingReference', 'previewedAt', 'reference'] as const;

export function readHopV55SemanticAdoptionPlanV1(value: unknown): HopV55SemanticAdoptionPlanV1 {
  if (!isRow(value) || value.format !== HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT) refuse('invalid', 'Plan d’adoption V1 absent ou de format inconnu.');
  const plan = value as Row;
  if (plan.profile !== undefined && plan.profile !== 'wizardV1') refuse('unsupported', 'Profil de plan d’adoption futur.');
  exactKeys(plan, plan.profile === 'wizardV1' ? [...PLAN_KEYS, 'profile'] : PLAN_KEYS, 'Plan d’adoption');
  if (!text(plan.commandId) || !text(plan.recordId) || !text(plan.requestId) || !text(plan.reason) || !text(plan.reference)
    || !Array.isArray(plan.selection) || !plan.selection.length || !isRow(plan.expectedHead) || !isoInstant(plan.previewedAt)) {
    refuse('invalid', 'Plan d’adoption incomplet.');
  }
  assertPrincipal(plan.principal);
  assertTicket(plan.ticket);
  if ((plan.profile === 'wizardV1') !== (isRow(plan.ticket) && plan.ticket.profile === 'wizardV1')) {
    refuse('invalid', 'Le profil Wizard doit être lié au ticket explicite, sans élargir le plan classique.');
  }
  if (ref(HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT, planBody(plan as unknown as HopV55SemanticAdoptionPlanV1)) !== plan.reference) {
    refuse('invalid', 'Référence du plan d’adoption altérée.');
  }
  if (!isRow(plan.currentProjection)
    || cultureBindingReferenceFromProjection(plan.currentProjection.culture) !== plan.cultureBindingReference) {
    refuse('invalid', 'Le binding NR du plan ne correspond pas à son état culturel projeté (notApplicable et notReceived restent distincts).');
  }
  return clone(plan) as unknown as HopV55SemanticAdoptionPlanV1;
}

const RECEIPT_KEYS = ['format', 'commandId', 'fingerprint', 'planReference', 'principal', 'ticket', 'selection', 'expectedHead',
  'record', 'effectiveAt', 'recipeEffect', 'reference'] as const;

export function readHopV55SemanticAdoptionReceiptV1(value: unknown): HopV55SemanticAdoptionReceiptV1 {
  if (!isRow(value) || value.format !== HOP_V55_SEMANTIC_ADOPTION_RECEIPT_V1_FORMAT) refuse('invalid', 'Reçu d’adoption V1 absent ou de format inconnu.');
  const receipt = value as Row;
  exactKeys(receipt, RECEIPT_KEYS, 'Reçu d’adoption');
  if (!text(receipt.commandId) || !text(receipt.fingerprint) || !text(receipt.planReference) || !isoInstant(receipt.effectiveAt)
    || receipt.recipeEffect !== 'none' || !isRow(receipt.record) || !text(receipt.record.id) || !text(receipt.record.reference)
    || !text(receipt.record.ledgerReference) || !Array.isArray(receipt.selection) || !text(receipt.reference)) {
    refuse('invalid', 'Reçu d’adoption incomplet.');
  }
  assertPrincipal(receipt.principal);
  assertTicket(receipt.ticket);
  const { reference: _reference, ...body } = receipt;
  if (ref(HOP_V55_SEMANTIC_ADOPTION_RECEIPT_V1_FORMAT, body) !== receipt.reference) refuse('invalid', 'Référence du reçu d’adoption altérée.');
  return clone(receipt) as unknown as HopV55SemanticAdoptionReceiptV1;
}

/** Same commandId + same fingerprint → the original receipt; another content under that ID → conflict. */
export function resolveHopV55SemanticAdoptionReplayV1(input: { existingReceipt: unknown; commandId: string; fingerprint: string }):
  | { status: 'new' } | { status: 'replay'; receipt: HopV55SemanticAdoptionReceiptV1 }
  | { status: 'conflict' | 'invalid'; reason: string } {
  if (input.existingReceipt === undefined || input.existingReceipt === null) return { status: 'new' };
  let receipt: HopV55SemanticAdoptionReceiptV1;
  try { receipt = readHopV55SemanticAdoptionReceiptV1(input.existingReceipt); }
  catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Reçu illisible.' }; }
  if (receipt.commandId !== input.commandId) return { status: 'invalid', reason: 'Le reçu fourni appartient à une autre commande.' };
  return receipt.fingerprint === input.fingerprint ? { status: 'replay', receipt }
    : { status: 'conflict', reason: `La commande ${input.commandId} est déjà engagée pour un autre contenu; aucune nouvelle adoption.` };
}

/** The durable lookup must return a receipt for this exact sealed plan before any receipt is disclosed. */
function assertReplayReceiptLinkedToPlan(receipt: HopV55SemanticAdoptionReceiptV1, plan: HopV55SemanticAdoptionPlanV1,
  fingerprint: string): void {
  const expectedSelection = plan.selection.map(row => ({ optionId: row.optionId, proposalId: row.proposalId }));
  if (receipt.commandId !== plan.commandId || receipt.fingerprint !== fingerprint || receipt.planReference !== plan.reference
    || !same(receipt.principal, plan.principal) || !same(receipt.ticket, plan.ticket)
    || !same(receipt.selection, expectedSelection) || !same(receipt.expectedHead, plan.expectedHead)
    || receipt.record.id !== plan.recordId) {
    refuse('invalid', 'Le reçu trouvé sous cette commande n’est pas relié au plan, au principal et à la sélection exacts.');
  }
}

const asResult = <T>(run: () => T): T | { status: AdoptionRefusal['status']; reason: string } => {
  try { return run(); }
  catch (error) {
    if (error instanceof AdoptionRefusal) return { status: error.status, reason: error.message };
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Adoption illisible.' };
  }
};

/**
 * Preview: qualify the turn and the explicit selection against the fresh context and the expected head,
 * dry-run the V4 builder, then seal the plan. Nothing is persisted and no suggestion becomes active.
 */
export function prepareHopV55SemanticAdoptionPlanV1(input: PrepareHopV55SemanticAdoptionPlanV1Input): PrepareHopV55SemanticAdoptionPlanV1Result {
  return asResult(() => {
    if (!text(input.commandId) || !text(input.recordId) || !text(input.requestId) || !text(input.reason) || !isoInstant(input.previewedAt)) {
      refuse('invalid', 'Le plan exige commandId, recordId, requestId, motif et instant de preview explicites.');
    }
    if (input.candidatePolicy === undefined) refuse('invalid', 'La politique de candidats est explicite; elle n’est jamais déduite.');
    const turn = qualifyTurn({ ...input, stage: 'reception' });
    const cultureBindingReference = assertCultureBindingMatchesProjection({ binding: input.cultureBinding,
      culture: turn.projection.culture, ownerKey: input.principal.ownerKey, workspaceId: input.principal.workspaceId,
      runtime: turn.prepared.runtime });
    const selection = selectionFromEnvelope(turn.envelope, input.selection);
    let expectedHead: HopV55SemanticAdoptionHeadV1;
    let built: { status: 'ready'; record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
      requestDraftV3: HopV55PropertyAdviceRequestDraftV3 } | { status: 'pending'; reason: string };
    let requestReference: string;
    let sourceReadingReference: string;
    let sourceViewReference: string;
    if (turn.profile === 'wizardV1') {
      if (!('archiveWizard' in input.current) || input.ticket.profile !== 'wizardV1') {
        refuse('invalid', 'Le ticket et le contexte courant ne partagent pas le profil Wizard exact.');
      }
      const head = readHeadForWizardV1(input.head);
      expectedHead = head.expected;
      requestReference = brewerHopAdviceRequestV3ReferenceForWizardV1(turn.request);
      sourceReadingReference = turn.request.sourceReadingReference;
      sourceViewReference = brewerHopAdviceSourceViewReferenceV1ForWizardV1(turn.request.sourceView);
      built = buildRecordForWizardV1({ head, sourceArchive: input.current.archiveWizard, current: input.current,
        ownerKey: input.principal.ownerKey, workspaceId: input.principal.workspaceId, prepared: turn.prepared,
        commandId: input.commandId, recordId: input.recordId, requestId: input.requestId, reason: input.reason,
        label: input.principal.label, recordedAt: input.previewedAt, candidatePolicy: input.candidatePolicy,
        cultureBinding: input.cultureBinding, selection });
    } else {
      if ('archiveWizard' in input.current || input.ticket.profile !== undefined) {
        refuse('invalid', 'Le plan classic ne reçoit jamais une archive ou un ticket Wizard.');
      }
      const head = readHead(input.head);
      expectedHead = head.expected;
      requestReference = brewerHopAdviceRequestV3Reference(turn.request);
      sourceReadingReference = turn.request.sourceReadingReference;
      sourceViewReference = turn.request.sourceView.reference;
      built = buildRecord({ head, sourceArchive: input.sourceArchive, ownerKey: input.principal.ownerKey,
        workspaceId: input.principal.workspaceId, prepared: turn.prepared, commandId: input.commandId, recordId: input.recordId,
        requestId: input.requestId, reason: input.reason, label: input.principal.label, recordedAt: input.previewedAt,
        candidatePolicy: input.candidatePolicy, cultureBinding: input.cultureBinding, selection });
    }
    if (built.status === 'pending') return built;
    const body: Omit<HopV55SemanticAdoptionPlanV1, 'reference'> = {
      format: HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT, commandId: input.commandId, recordId: input.recordId,
      requestId: input.requestId, reason: input.reason, principal: clone(input.principal), ticket: clone(input.ticket),
      ...(turn.profile === 'wizardV1' ? { profile: 'wizardV1' as const } : {}),
      envelopeReference: turn.envelope.reference, requestReference,
      sourceReadingReference, sourceViewReference,
      selection, expectedHead, currentProjection: clone(turn.projection), candidatePolicy: clone(input.candidatePolicy),
      cultureBindingReference, previewedAt: input.previewedAt,
    };
    const plan: HopV55SemanticAdoptionPlanV1 = { ...body, reference: ref(HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT, body) };
    return { status: 'ready' as const, plan, preview: { record: built.record, requestDraftV3: built.requestDraftV3 } };
  }) as PrepareHopV55SemanticAdoptionPlanV1Result;
}

/**
 * Confirmation validates the current authenticated principal and receipt-to-plan link before replay can
 * disclose a receipt. A linked committed receipt is historical: current ticket generation, display label,
 * fresh physical context and the new effectiveAt do not cause a second effect or hide that receipt.
 */
export function confirmHopV55SemanticAdoptionV1(input: ConfirmHopV55SemanticAdoptionV1Input): ConfirmHopV55SemanticAdoptionV1Result {
  return asResult(() => {
    const plan = readHopV55SemanticAdoptionPlanV1(input.plan);
    assertCurrentPrincipalForPlan(input.principal, plan.principal);
    const fingerprint = hopV55SemanticAdoptionFingerprintV1(plan);
    const replay = resolveHopV55SemanticAdoptionReplayV1({ existingReceipt: input.existingReceipt, commandId: plan.commandId, fingerprint });
    if (replay.status === 'replay') {
      assertReplayReceiptLinkedToPlan(replay.receipt, plan, fingerprint);
      return replay;
    }
    if (replay.status !== 'new') return replay;
    if (!isoInstant(input.effectiveAt)) refuse('invalid', 'Instant effectif de l’hôte invalide.');
    assertTicket(input.ticket);
    if (!same(input.ticket, plan.ticket)) refuse('stale', 'Le ticket, l’opération ou la génération ont changé depuis le plan; aucune adoption.');
    const turn = qualifyTurn({ ...input, stage: 'confirmation' });
    const requestReference = turn.profile === 'wizardV1'
      ? brewerHopAdviceRequestV3ReferenceForWizardV1(turn.request) : brewerHopAdviceRequestV3Reference(turn.request);
    const sourceViewReference = turn.profile === 'wizardV1'
      ? brewerHopAdviceSourceViewReferenceV1ForWizardV1(turn.request.sourceView) : turn.request.sourceView.reference;
    if ((turn.profile === 'wizardV1') !== (plan.profile === 'wizardV1')
      || turn.envelope.reference !== plan.envelopeReference || requestReference !== plan.requestReference
      || turn.request.sourceReadingReference !== plan.sourceReadingReference || sourceViewReference !== plan.sourceViewReference) {
      refuse('stale', 'La réponse, la RequestV3 ou la vue relues diffèrent du plan; prépare un nouveau plan.');
    }
    const compared = compareBrewerHopAdviceContextBindings(plan.currentProjection, turn.projection);
    if (compared.status !== 'matched' || compared.catalogueDependenciesChanged || compared.calculationDependenciesChanged
      || compared.runtimeDataRevisionChanged || compared.stockAvailabilityChanged) {
      refuse('stale', 'Le contexte pertinent a changé depuis l’aperçu; prépare un nouveau plan sous ce contexte.');
    }
    // The generic context comparator treats notApplicable and notReceived as both having no NR consumption.
    // Adoption keeps these states distinct because the builder receives an explicit null binding.
    if (!same(plan.currentProjection.culture, turn.projection.culture)) {
      refuse('stale', 'L’état NR (absence, non-réception ou identité adoptée) a changé depuis l’aperçu.');
    }
    const cultureBindingReference = assertCultureBindingMatchesProjection({ binding: input.cultureBinding,
      culture: turn.projection.culture, ownerKey: plan.principal.ownerKey, workspaceId: plan.principal.workspaceId,
      runtime: turn.prepared.runtime });
    if (cultureBindingReference !== plan.cultureBindingReference) {
      refuse('stale', 'Le binding NR diffère de celui du plan.');
    }
    const selection = selectionFromEnvelope(turn.envelope, plan.selection.map(row => ({ optionId: row.optionId,
      proposalId: row.proposalId, reason: row.reason, activeIntent: row.activeIntent })));
    if (!same(selection, plan.selection)) refuse('stale', 'La sélection relue diffère de celle du plan confirmé.');
    let built: { status: 'ready'; record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
      requestDraftV3: HopV55PropertyAdviceRequestDraftV3 } | { status: 'pending'; reason: string };
    if (turn.profile === 'wizardV1') {
      if (!('archiveWizard' in input.current) || input.ticket.profile !== 'wizardV1') {
        refuse('invalid', 'Le plan Wizard ne peut pas être confirmé depuis un contexte classic.');
      }
      const head = readHeadForWizardV1(input.head);
      if (!same(head.expected, plan.expectedHead)) {
        refuse('stale', 'La tête documentaire Wizard a changé depuis l’aperçu; aucune rébase automatique.');
      }
      built = buildRecordForWizardV1({ head, sourceArchive: input.current.archiveWizard, current: input.current,
        ownerKey: plan.principal.ownerKey, workspaceId: plan.principal.workspaceId, prepared: turn.prepared,
        commandId: plan.commandId, recordId: plan.recordId, requestId: plan.requestId, reason: plan.reason,
        label: plan.principal.label, recordedAt: input.effectiveAt, candidatePolicy: plan.candidatePolicy,
        cultureBinding: input.cultureBinding, selection });
    } else {
      if ('archiveWizard' in input.current || input.ticket.profile !== undefined) {
        refuse('invalid', 'Le plan classic ne peut pas être confirmé depuis un contexte ou ticket Wizard.');
      }
      const head = readHead(input.head);
      if (!same(head.expected, plan.expectedHead)) {
        refuse('stale', 'La tête du conseil a changé depuis l’aperçu; une création n’est jamais convertie en révision.');
      }
      built = buildRecord({ head, sourceArchive: input.sourceArchive, ownerKey: plan.principal.ownerKey,
        workspaceId: plan.principal.workspaceId, prepared: turn.prepared, commandId: plan.commandId,
        recordId: plan.recordId, requestId: plan.requestId, reason: plan.reason, label: plan.principal.label,
        recordedAt: input.effectiveAt, candidatePolicy: plan.candidatePolicy, cultureBinding: input.cultureBinding, selection });
    }
    if (built.status === 'pending') return built;
    const receiptBody: Omit<HopV55SemanticAdoptionReceiptV1, 'reference'> = {
      format: HOP_V55_SEMANTIC_ADOPTION_RECEIPT_V1_FORMAT, commandId: plan.commandId, fingerprint, planReference: plan.reference,
      principal: clone(plan.principal), ticket: clone(plan.ticket),
      selection: plan.selection.map(row => ({ optionId: row.optionId, proposalId: row.proposalId })),
      expectedHead: clone(plan.expectedHead),
      record: { id: built.record.id, reference: built.record.reference, ledgerReference: built.record.ledger.reference },
      effectiveAt: input.effectiveAt, recipeEffect: 'none',
    };
    const receipt: HopV55SemanticAdoptionReceiptV1 = { ...receiptBody, reference: ref(HOP_V55_SEMANTIC_ADOPTION_RECEIPT_V1_FORMAT, receiptBody) };
    const command: HopV55SemanticAdoptionCommandV1 = { format: HOP_V55_SEMANTIC_ADOPTION_COMMAND_V1_FORMAT, commandId: plan.commandId,
      fingerprint, planReference: plan.reference, expectedHead: clone(plan.expectedHead), recordId: plan.recordId };
    return { status: 'ready' as const, record: built.record, receipt, command, recipeEffect: 'none' as const };
  }) as ConfirmHopV55SemanticAdoptionV1Result;
}
