import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { readHopV55DocumentaryAnswerRecord } from './documentaryRecords';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchive } from './decisionArchive';
import { hopV55SuccessorPreservesParentV1 } from './decisionReadingAccessors';
import {
  HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  readHopV55PropertyAdviceReexaminationPreviewV1,
  type HopV55PropertyAdviceLedgerActionV4,
  type HopV55PropertyAdviceReexaminationBindingChoiceV1,
  type HopV55PropertyAdviceReexaminationPreviewV1,
} from './propertyAdvicePreparationV4';
import {
  readHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceV4Actor,
  type HopV55PropertyAdviceV4ReadingContext,
  assertHopV55PropertyAdviceV4ReadingContext,
} from './propertyAdviceRecordsV4';
import type { HopV55Workspace } from './contracts';

export const HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT =
  'hop-v55-property-advice-reexamination-command-staging-v1' as const;
export const HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT =
  'hop-v55-property-advice-reexamination-command-receipt-v1' as const;
const COMMAND_FINGERPRINT_KIND = 'hop-v55-property-advice-reexamination-confirmation-v1';
const STAGING_REFERENCE_KIND = HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT;
const RECEIPT_REFERENCE_KIND = HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT;
const EQUALITY_KIND = 'hop-v55-property-advice-reexamination-command-equality-v1';

/** The stable, UI-supplied part of one exact reexamination confirmation. */
export interface HopV55PropertyAdviceReexaminationConfirmationInputV1 {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  previewId: string;
  expectedPreviewReference: string;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  bindingChoices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  reason: string;
}

/**
 * Runtime-only durable staging for one confirmed V4 reexamination. `preparedRecord`
 * and the archive inside `preview` are the exact already-built outputs; replay never
 * calls an advice builder. This support envelope is not an answer/domain record.
 */
export interface HopV55PropertyAdviceReexaminationCommandStagingV1 {
  format: typeof HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT;
  commandId: string;
  fingerprint: string;
  ownerKey: string;
  workspaceId: string;
  parentRecordReference: string;
  parentLedgerReference: string;
  parentReadingReference: string;
  sourceReadingReference: string;
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  confirmation: HopV55PropertyAdviceReexaminationConfirmationInputV1;
  confirmedAt: string;
  confirmedBy: HopV55PropertyAdviceV4Actor;
  preparedRecord: HopV55PropertyAdviceAnswerRecordV4;
  reference: string;
}

/** Small immutable receipt closes a staging row and binds it to the committed answer. */
export interface HopV55PropertyAdviceReexaminationCommandReceiptV1 {
  format: typeof HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT;
  commandId: string;
  fingerprint: string;
  stagingReference: string;
  ownerKey: string;
  workspaceId: string;
  parentRecordReference: string;
  previewReference: string;
  sourceReadingReference: string;
  answerRecordReference: string;
  committedAt: string;
  reference: string;
}

export interface HopV55PropertyAdviceReexaminationCommandUnknownRecord {
  format: string;
  readonly [key: string]: unknown;
}

export type HopV55PropertyAdviceReexaminationCommandStagingHistoryEntry =
  | HopV55PropertyAdviceReexaminationCommandStagingV1
  | HopV55PropertyAdviceReexaminationCommandUnknownRecord;
export type HopV55PropertyAdviceReexaminationCommandReceiptHistoryEntry =
  | HopV55PropertyAdviceReexaminationCommandReceiptV1
  | HopV55PropertyAdviceReexaminationCommandUnknownRecord;

export type HopV55PropertyAdviceReexaminationCommandStagingRead =
  | { status: 'available'; staging: HopV55PropertyAdviceReexaminationCommandStagingV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55PropertyAdviceReexaminationCommandReceiptRead =
  | { status: 'available'; receipt: HopV55PropertyAdviceReexaminationCommandReceiptV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55PropertyAdviceReexaminationCommandLookup =
  | { status: 'absent' }
  | { status: 'pending'; staging: HopV55PropertyAdviceReexaminationCommandStagingV1;
      sourceReadingArchive: HopV55DecisionReadingArchive; preparedRecord: HopV55PropertyAdviceAnswerRecordV4 }
  | { status: 'committed'; staging: HopV55PropertyAdviceReexaminationCommandStagingV1;
      receipt: HopV55PropertyAdviceReexaminationCommandReceiptV1; record: HopV55PropertyAdviceAnswerRecordV4 }
  | { status: 'conflict'; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = <T,>(value: T): T => structuredClone(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const instant = (value: unknown): value is string => text(value)
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));
const same = (left: unknown, right: unknown): boolean => {
  try { return hopAdviceContentReference(EQUALITY_KIND, left) === hopAdviceContentReference(EQUALITY_KIND, right); }
  catch { return false; }
};
const isUnknownFamily = (value: unknown, family: 'staging' | 'receipt'): value is Row => {
  if (!isRow(value) || typeof value.format !== 'string') return false;
  const prefix = family === 'staging'
    ? 'hop-v55-property-advice-reexamination-command-staging-'
    : 'hop-v55-property-advice-reexamination-command-receipt-';
  return value.format.startsWith(prefix);
};
const isFutureFamily = (value: unknown, family: 'staging' | 'receipt'): value is Row =>
  isUnknownFamily(value, family) && value.format !== (family === 'staging'
    ? HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT
    : HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT);
const unsupported = (value: unknown, family: 'staging' | 'receipt') => ({
  status: 'unsupportedReadOnly' as const, snapshot: clone(value),
  reason: `Format futur de commande de réexamen ${family} conservé en lecture seule.`,
});
function onlyKeys(value: Row, keys: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error(`${label} contient un champ non pris en charge.`);
}

function confirmationFingerprintBody(input: HopV55PropertyAdviceReexaminationConfirmationInputV1) {
  return {
    commandId: input.commandId,
    expectedRecordReference: input.expectedRecordReference,
    expectedLedgerReference: input.expectedLedgerReference,
    previewId: input.previewId,
    expectedPreviewReference: input.expectedPreviewReference,
    actions: clone(input.actions),
    bindingChoices: clone(input.bindingChoices),
    readingContext: clone(input.readingContext),
    reason: input.reason,
  };
}

/** Date/actor are captured once in the staging; UI retries do not resupply them. */
export function hopV55PropertyAdviceReexaminationConfirmationFingerprintV1(
  input: HopV55PropertyAdviceReexaminationConfirmationInputV1,
): string {
  assertConfirmationInput(input);
  return hopAdviceContentReference(COMMAND_FINGERPRINT_KIND, confirmationFingerprintBody(input));
}

function assertConfirmationInput(value: unknown): asserts value is HopV55PropertyAdviceReexaminationConfirmationInputV1 {
  if (!isRow(value)) throw new Error('Confirmation de réexamen V4 absente.');
  onlyKeys(value, ['commandId', 'expectedRecordReference', 'expectedLedgerReference', 'previewId',
    'expectedPreviewReference', 'actions', 'bindingChoices', 'readingContext', 'reason'], 'Confirmation de réexamen V4');
  if (!text(value.commandId) || !text(value.expectedRecordReference) || !text(value.expectedLedgerReference)
    || !text(value.previewId) || !text(value.expectedPreviewReference) || !text(value.reason)
    || !Array.isArray(value.actions) || !Array.isArray(value.bindingChoices) || !isRow(value.readingContext)) {
    throw new Error('Confirmation de réexamen V4 incomplète.');
  }
  assertActions(value.actions);
  assertBindingChoices(value.bindingChoices, value.expectedPreviewReference);
}

function assertActions(value: readonly unknown[]): void {
  const ids = new Set<string>();
  for (const action of value) {
    if (!isRow(action) || !text(action.kind) || !text(action.reason)) throw new Error('Action de réexamen V4 invalide.');
    const id = action.kind === 'add' && isRow(action.sourceAnnotation) ? action.sourceAnnotation.id : action.annotationId;
    if (!text(id) || ids.has(id)) throw new Error('Les actions V4 doivent porter des IDs d’annotation uniques.');
    if (action.kind === 'reject') {
      onlyKeys(action, ['kind', 'annotationId', 'reason'], 'Action reject V4');
      if (!text(action.annotationId)) throw new Error('Action reject V4 sans annotation.');
    } else if (action.kind === 'revise' || action.kind === 'restore') {
      onlyKeys(action, ['kind', 'annotationId', 'activeIntent', 'reason'], 'Action revise/restore V4');
      if (!text(action.annotationId) || !isRow(action.activeIntent)) throw new Error('Action revise/restore V4 incomplète.');
    } else if (action.kind === 'add') {
      onlyKeys(action, ['kind', 'sourceAnnotation', 'activeIntent', 'reason'], 'Action add V4');
      if (!isRow(action.sourceAnnotation) || !isRow(action.activeIntent)) throw new Error('Action add V4 incomplète.');
    } else throw new Error('Type d’action de réexamen V4 inconnu.');
    ids.add(id);
  }
}

function assertBindingChoices(value: readonly unknown[], expectedPreviewReference: string): void {
  const identities = new Set<string>();
  for (const choice of value) {
    if (!isRow(choice) || choice.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT
      || !text(choice.annotationId) || !text(choice.previousAssertionId) || choice.previewReference !== expectedPreviewReference) {
      throw new Error('Choix de liaison V4 invalide ou rattaché à un autre preview.');
    }
    const key = `${choice.annotationId}\0${choice.previousAssertionId}`;
    if (identities.has(key)) throw new Error('Un lien d’annotation ne peut être choisi deux fois.');
    if (choice.kind === 'bind') {
      onlyKeys(choice, ['format', 'kind', 'previewReference', 'annotationId', 'previousAssertionId', 'freshAssertionId'], 'Choix bind V4');
      if (!text(choice.freshAssertionId)) throw new Error('Choix bind V4 sans assertion fraîche exacte.');
    } else if (choice.kind === 'detach') {
      onlyKeys(choice, ['format', 'kind', 'previewReference', 'annotationId', 'previousAssertionId'], 'Choix detach V4');
    } else throw new Error('Type de choix de liaison V4 inconnu.');
    identities.add(key);
  }
}

function assertActor(value: unknown): asserts value is HopV55PropertyAdviceV4Actor {
  if (!isRow(value) || Object.keys(value).some(key => key !== 'origin' && key !== 'label')
    || !['user', 'proposal', 'fixture'].includes(String(value.origin)) || !text(value.label)) {
    throw new Error('Auteur Runtime de confirmation V4 invalide.');
  }
}

function recordRead(value: unknown): HopV55PropertyAdviceAnswerRecordV4 {
  const read = readHopV55PropertyAdviceAnswerRecordV4(value);
  if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v4') {
    throw new Error(read.status === 'unsupportedReadOnly' ? read.reason : 'Record préparé V4 invalide.');
  }
  return read.record;
}

function archiveRead(value: unknown): HopV55DecisionReadingArchive {
  const read = readHopV55DecisionReadingArchive(value);
  if (read.status !== 'available') {
    throw new Error(read.status === 'invalidRecord' ? read.reason : `Archive source ${read.format} non prise en charge.`);
  }
  return read.archive;
}

function previewRead(value: unknown): HopV55PropertyAdviceReexaminationPreviewV1 {
  const read = readHopV55PropertyAdviceReexaminationPreviewV1(value);
  if (read.status !== 'readOnly') throw new Error(read.status === 'invalid' ? read.reason : 'Preview V4 illisible.');
  return read.preview;
}

function assertActionResultMatches(staging: Pick<HopV55PropertyAdviceReexaminationCommandStagingV1,
  'commandId' | 'confirmation' | 'preparedRecord'>): void {
  const record = staging.preparedRecord;
  const matching = record.ledger.entries.filter(entry => entry.decision.actId === staging.commandId);
  if (matching.length !== staging.confirmation.actions.length) throw new Error('Le ledger préparé ne correspond pas au nombre d’actions confirmées.');
  for (const action of staging.confirmation.actions) {
    const annotationId = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
    const entry = matching.find(row => row.annotationId === annotationId && row.decision.kind === action.kind);
    if (!entry || entry.decision.reason !== action.reason) throw new Error(`Le ledger préparé ne conserve pas l’action ${annotationId} exacte.`);
    if (action.kind === 'reject') {
      if (entry.disposition !== 'rejected' || entry.activeIntent !== undefined) throw new Error(`L’action reject ${annotationId} ne correspond pas au ledger.`);
    } else {
      if (entry.disposition !== 'active' || !same(entry.activeIntent, action.activeIntent)) {
        throw new Error(`La projection confirmée ${annotationId} ne correspond pas au ledger.`);
      }
      if (action.kind === 'add' && !same(entry.sourceAnnotation, action.sourceAnnotation)) {
        throw new Error(`L’annotation ajoutée ${annotationId} ne correspond pas à sa source exacte.`);
      }
    }
  }
}

function assertBindingChoicesMatchRecord(input: {
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  choices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
  record: HopV55PropertyAdviceAnswerRecordV4;
}): void {
  const latestByAnnotation = new Map<string, HopV55PropertyAdviceAnswerRecordV4['ledger']['entries'][number]>();
  for (const entry of input.record.ledger.entries) latestByAnnotation.set(entry.annotationId, entry);
  const choiceByLink = new Map(input.choices.map(choice => [`${choice.annotationId}\0${choice.previousAssertionId}`, choice]));
  for (const choice of input.choices) {
    const diagnostic = input.preview.diagnostics.find(row => row.annotationId === choice.annotationId
      && row.previousAssertionId === choice.previousAssertionId);
    if (!diagnostic) throw new Error('Un choix de liaison ne correspond à aucun diagnostic du preview exact.');
    const latest = latestByAnnotation.get(choice.annotationId);
    if (!latest || latest.disposition !== 'active' || !latest.activeIntent) {
      throw new Error('Un choix de liaison ne peut pas viser une annotation rejetée ou absente du ledger préparé.');
    }
    if (choice.kind === 'bind') {
      const compatible = diagnostic.compatibleFreshAssertions.find(row => row.assertionId === choice.freshAssertionId);
      const current = input.record.readingContext.context.assertions.find(row => row.id === choice.freshAssertionId);
      if (!compatible || !current || !same(compatible.assertion, current)
        || latest.activeIntent.comparisonBasis.kind !== 'current'
        || !latest.activeIntent.comparisonBasis.assertionIds.includes(choice.freshAssertionId)) {
        throw new Error('Le fait frais choisi n’est pas celui de la projection active V4.');
      }
    } else if (latest.activeIntent.comparisonBasis.kind === 'current'
      && latest.activeIntent.comparisonBasis.assertionIds.includes(choice.previousAssertionId)) {
      throw new Error('Le choix de détachement ne peut pas laisser le lien historique dans la projection active.');
    }
  }
  for (const diagnostic of input.preview.diagnostics) {
    const latest = latestByAnnotation.get(diagnostic.annotationId);
    if (!latest || latest.disposition !== 'active' || !latest.activeIntent
      || latest.activeIntent.comparisonBasis.kind !== 'current'
      || !latest.activeIntent.comparisonBasis.assertionIds.includes(diagnostic.previousAssertionId)) continue;
    if (!choiceByLink.has(`${diagnostic.annotationId}\0${diagnostic.previousAssertionId}`)) {
      throw new Error('Une base active qui cite un diagnostic du preview doit recevoir un choix explicite.');
    }
  }
}

function stagingBody(value: Omit<HopV55PropertyAdviceReexaminationCommandStagingV1, 'reference'>
  | HopV55PropertyAdviceReexaminationCommandStagingV1) {
  const { reference: _reference, ...body } = value as HopV55PropertyAdviceReexaminationCommandStagingV1;
  return body;
}

function assertStaging(value: unknown): asserts value is HopV55PropertyAdviceReexaminationCommandStagingV1 {
  if (!isRow(value)) throw new Error('Staging de commande de réexamen V4 absent.');
  const allowed = ['format', 'commandId', 'fingerprint', 'ownerKey', 'workspaceId', 'parentRecordReference',
    'parentLedgerReference', 'parentReadingReference', 'sourceReadingReference', 'preview', 'confirmation',
    'confirmedAt', 'confirmedBy', 'preparedRecord', 'reference'];
  onlyKeys(value, allowed, 'Staging de commande de réexamen V4');
  if (Object.keys(value).length !== allowed.length || value.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT
    || !text(value.commandId) || !text(value.fingerprint) || !text(value.ownerKey) || !text(value.workspaceId)
    || !text(value.parentRecordReference) || !text(value.parentLedgerReference) || !text(value.parentReadingReference)
    || !text(value.sourceReadingReference) || !instant(value.confirmedAt) || !text(value.reference)) {
    throw new Error('Identité, date ou référence du staging de commande V4 incomplète.');
  }
  assertActor(value.confirmedBy);
  assertConfirmationInput(value.confirmation);
  const confirmation = value.confirmation as HopV55PropertyAdviceReexaminationConfirmationInputV1;
  if (confirmation.commandId !== value.commandId || confirmation.expectedRecordReference !== value.parentRecordReference
    || confirmation.expectedLedgerReference !== value.parentLedgerReference
    || confirmation.expectedPreviewReference !== (value.preview as HopV55PropertyAdviceReexaminationPreviewV1)?.reference) {
    throw new Error('Staging V4 et confirmation n’ont pas les mêmes identités parent/preview.');
  }
  if (hopV55PropertyAdviceReexaminationConfirmationFingerprintV1(confirmation) !== value.fingerprint) {
    throw new Error('Empreinte de confirmation V4 incorrecte.');
  }
  const preview = previewRead(value.preview);
  const record = recordRead(value.preparedRecord);
  const archive = archiveRead(preview.sourceReadingArchive);
  if (preview.ownerKey !== value.ownerKey || preview.workspaceId !== value.workspaceId
    || preview.parentRecordReference !== value.parentRecordReference || preview.parentLedgerReference !== value.parentLedgerReference
    || preview.parentReadingReference !== value.parentReadingReference || preview.reference !== confirmation.expectedPreviewReference
    || preview.sourceReadingReference !== value.sourceReadingReference || archive.contentReference !== value.sourceReadingReference) {
    throw new Error('Le preview, la source et les références du staging V4 divergent.');
  }
  if (record.ownerKey !== value.ownerKey || record.workspaceId !== value.workspaceId
    || record.transition.actId !== value.commandId || record.transition.kind !== 'reexamine'
    || record.transition.parentRecordReference !== value.parentRecordReference
    || record.transition.parentReadingReference !== value.parentReadingReference
    || record.transition.reason !== confirmation.reason || record.transition.recordedAt !== value.confirmedAt
    || !same(record.transition.actor, value.confirmedBy)
    || record.sourceReadingReference !== preview.sourceReadingReference || record.originalQuestion !== preview.originalQuestion
    || !same(record.preparation.source, preview.source) || !same(record.readingContext, confirmation.readingContext)
    || (record.preparation.cultureBinding?.bindingReference ?? null) !== preview.cultureBindingReference) {
    throw new Error('Le record V4 préparé ne correspond pas à la confirmation et au preview exacts.');
  }
  assertHopV55PropertyAdviceV4ReadingContext(confirmation.readingContext, preview.originalQuestion);
  assertActionResultMatches({ commandId: value.commandId, confirmation, preparedRecord: record });
  assertBindingChoicesMatchRecord({ preview, choices: confirmation.bindingChoices, record });
  if (hopAdviceContentReference(STAGING_REFERENCE_KIND, stagingBody(value as unknown as HopV55PropertyAdviceReexaminationCommandStagingV1)) !== value.reference) {
    throw new Error('Le staging de commande V4 ne correspond plus à son empreinte.');
  }
}

export function createHopV55PropertyAdviceReexaminationCommandStagingV1(input: {
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  confirmation: HopV55PropertyAdviceReexaminationConfirmationInputV1;
  preparedRecord: HopV55PropertyAdviceAnswerRecordV4;
}): HopV55PropertyAdviceReexaminationCommandStagingV1 {
  const preview = previewRead(input.preview);
  const record = recordRead(input.preparedRecord);
  const confirmation = clone(input.confirmation);
  const body: Omit<HopV55PropertyAdviceReexaminationCommandStagingV1, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT,
    commandId: confirmation.commandId,
    fingerprint: hopV55PropertyAdviceReexaminationConfirmationFingerprintV1(confirmation),
    ownerKey: record.ownerKey, workspaceId: record.workspaceId,
    parentRecordReference: confirmation.expectedRecordReference, parentLedgerReference: confirmation.expectedLedgerReference,
    parentReadingReference: record.transition.parentReadingReference,
    sourceReadingReference: preview.sourceReadingReference,
    preview, confirmation,
    confirmedAt: record.transition.recordedAt, confirmedBy: clone(record.transition.actor),
    preparedRecord: record,
  };
  const staging = { ...body, reference: hopAdviceContentReference(STAGING_REFERENCE_KIND, body) };
  assertStaging(staging);
  return clone(staging);
}

export function readHopV55PropertyAdviceReexaminationCommandStaging(value: unknown):
  HopV55PropertyAdviceReexaminationCommandStagingRead {
  if (isUnknownFamily(value, 'staging')
    && value.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_STAGING_V1_FORMAT) return unsupported(value, 'staging');
  try {
    assertStaging(value);
    return { status: 'available', staging: clone(value as HopV55PropertyAdviceReexaminationCommandStagingV1) };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Staging de commande V4 invalide.' }; }
}

function receiptBody(value: Omit<HopV55PropertyAdviceReexaminationCommandReceiptV1, 'reference'>
  | HopV55PropertyAdviceReexaminationCommandReceiptV1) {
  const { reference: _reference, ...body } = value as HopV55PropertyAdviceReexaminationCommandReceiptV1;
  return body;
}

function assertReceipt(value: unknown): asserts value is HopV55PropertyAdviceReexaminationCommandReceiptV1 {
  if (!isRow(value)) throw new Error('Reçu de commande de réexamen V4 absent.');
  const allowed = ['format', 'commandId', 'fingerprint', 'stagingReference', 'ownerKey', 'workspaceId',
    'parentRecordReference', 'previewReference', 'sourceReadingReference', 'answerRecordReference', 'committedAt', 'reference'];
  onlyKeys(value, allowed, 'Reçu de commande de réexamen V4');
  if (Object.keys(value).length !== allowed.length || value.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT
    || !text(value.commandId) || !text(value.fingerprint) || !text(value.stagingReference) || !text(value.ownerKey)
    || !text(value.workspaceId) || !text(value.parentRecordReference) || !text(value.previewReference)
    || !text(value.sourceReadingReference) || !text(value.answerRecordReference) || !instant(value.committedAt)
    || !text(value.reference)) throw new Error('Identité ou date du reçu de commande V4 incomplète.');
  if (hopAdviceContentReference(RECEIPT_REFERENCE_KIND, receiptBody(value as unknown as HopV55PropertyAdviceReexaminationCommandReceiptV1)) !== value.reference) {
    throw new Error('Le reçu de commande V4 ne correspond plus à son empreinte.');
  }
}

export function createHopV55PropertyAdviceReexaminationCommandReceiptV1(input: {
  staging: HopV55PropertyAdviceReexaminationCommandStagingV1;
  committedAt: string;
}): HopV55PropertyAdviceReexaminationCommandReceiptV1 {
  const stageRead = readHopV55PropertyAdviceReexaminationCommandStaging(input.staging);
  if (stageRead.status !== 'available') throw new Error(stageRead.status === 'invalid' ? stageRead.reason : 'Staging futur non pris en charge.');
  if (!instant(input.committedAt)) throw new Error('Date du reçu de commande V4 invalide.');
  const stage = stageRead.staging;
  const body: Omit<HopV55PropertyAdviceReexaminationCommandReceiptV1, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT,
    commandId: stage.commandId, fingerprint: stage.fingerprint, stagingReference: stage.reference,
    ownerKey: stage.ownerKey, workspaceId: stage.workspaceId,
    parentRecordReference: stage.parentRecordReference, previewReference: stage.preview.reference,
    sourceReadingReference: stage.sourceReadingReference, answerRecordReference: stage.preparedRecord.reference,
    committedAt: input.committedAt,
  };
  const receipt = { ...body, reference: hopAdviceContentReference(RECEIPT_REFERENCE_KIND, body) };
  assertReceipt(receipt);
  return clone(receipt);
}

export function readHopV55PropertyAdviceReexaminationCommandReceipt(value: unknown):
  HopV55PropertyAdviceReexaminationCommandReceiptRead {
  if (isUnknownFamily(value, 'receipt')
    && value.format !== HOP_V55_PROPERTY_ADVICE_REEXAMINATION_COMMAND_RECEIPT_V1_FORMAT) return unsupported(value, 'receipt');
  try {
    assertReceipt(value);
    return { status: 'available', receipt: clone(value as HopV55PropertyAdviceReexaminationCommandReceiptV1) };
  } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Reçu de commande V4 invalide.' }; }
}

function hasCommandId(value: unknown, commandId: string): boolean {
  return isRow(value) && value.commandId === commandId;
}

function answerFor(workspace: HopV55Workspace, reference: string): HopV55PropertyAdviceAnswerRecordV4 | undefined {
  for (const raw of workspace.documentaryAnswers ?? []) {
    if (!isRow(raw) || raw.reference !== reference) continue;
    const read = readHopV55DocumentaryAnswerRecord(raw);
    if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v4') return undefined;
    return read.record;
  }
  return undefined;
}

function stageFor(workspace: HopV55Workspace, reference: string): HopV55PropertyAdviceReexaminationCommandStagingV1 | undefined {
  for (const raw of workspace.propertyAdviceReexaminationCommandStaging ?? []) {
    if (!isRow(raw) || raw.reference !== reference) continue;
    const read = readHopV55PropertyAdviceReexaminationCommandStaging(raw);
    return read.status === 'available' ? read.staging : undefined;
  }
  return undefined;
}

function receiptFor(workspace: HopV55Workspace, reference: string): HopV55PropertyAdviceReexaminationCommandReceiptV1 | undefined {
  for (const raw of workspace.propertyAdviceReexaminationCommandReceipts ?? []) {
    if (!isRow(raw) || raw.reference !== reference) continue;
    const read = readHopV55PropertyAdviceReexaminationCommandReceipt(raw);
    return read.status === 'available' ? read.receipt : undefined;
  }
  return undefined;
}

/** Resolve a lost reply from exact persisted payloads before any caller revalidates freshness or builds. */
export function lookupStoredHopV55PropertyAdviceReexaminationCommand(input: {
  workspace: HopV55Workspace;
  confirmation: HopV55PropertyAdviceReexaminationConfirmationInputV1;
}): HopV55PropertyAdviceReexaminationCommandLookup {
  let fingerprint: string;
  try { fingerprint = hopV55PropertyAdviceReexaminationConfirmationFingerprintV1(input.confirmation); }
  catch (error) { return { status: 'conflict', reason: error instanceof Error ? error.message : 'Commande V4 invalide.' }; }
  const workspace = input.workspace;
  const rawStages = workspace.propertyAdviceReexaminationCommandStaging ?? [];
  const rawReceipts = workspace.propertyAdviceReexaminationCommandReceipts ?? [];
  const futureStage = rawStages.find(raw => isFutureFamily(raw, 'staging') && hasCommandId(raw, input.confirmation.commandId));
  if (futureStage) return { status: 'unsupportedReadOnly', snapshot: clone(futureStage), reason: 'Une version future de cette commande réserve déjà cet ID.' };
  const futureReceipt = rawReceipts.find(raw => isFutureFamily(raw, 'receipt') && hasCommandId(raw, input.confirmation.commandId));
  if (futureReceipt) return { status: 'unsupportedReadOnly', snapshot: clone(futureReceipt), reason: 'Un reçu futur de cette commande réserve déjà cet ID.' };
  const stages: HopV55PropertyAdviceReexaminationCommandStagingV1[] = [];
  for (const raw of rawStages) {
    if (!isRow(raw) || raw.commandId !== input.confirmation.commandId) continue;
    const read = readHopV55PropertyAdviceReexaminationCommandStaging(raw);
    if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    if (read.status !== 'available') return { status: 'conflict', reason: `Staging portant ce commandId invalide : ${read.reason}` };
    stages.push(read.staging);
  }
  const receipts: HopV55PropertyAdviceReexaminationCommandReceiptV1[] = [];
  for (const raw of rawReceipts) {
    if (!isRow(raw) || raw.commandId !== input.confirmation.commandId) continue;
    const read = readHopV55PropertyAdviceReexaminationCommandReceipt(raw);
    if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    if (read.status !== 'available') return { status: 'conflict', reason: `Reçu portant ce commandId invalide : ${read.reason}` };
    receipts.push(read.receipt);
  }
  if (stages.length > 1 || receipts.length > 1) return { status: 'conflict', reason: 'Cet ID de commande V4 est dupliqué dans le workspace.' };
  const staging = stages[0];
  const receipt = receipts[0];
  if (!staging && !receipt) return { status: 'absent' };
  if (!staging) return { status: 'conflict', reason: 'Le reçu de commande ne possède pas son staging exact.' };
  if (staging.ownerKey !== workspace.ownerKey || staging.workspaceId !== workspace.id) {
    return { status: 'conflict', reason: 'La commande persistée appartient à un autre owner/workspace.' };
  }
  if (staging.fingerprint !== fingerprint) return { status: 'conflict', reason: 'Le commandId existe avec une confirmation ou des bindingChoices différents.' };
  const archive = archiveRead(staging.preview.sourceReadingArchive);
  if (!same(workspace.decisionReadings?.find(row => row.contentReference === staging.sourceReadingReference), archive)) {
    return { status: 'conflict', reason: 'L’archive exacte de la commande n’est pas persistée dans le workspace.' };
  }
  const answer = answerFor(workspace, staging.preparedRecord.reference);
  if (receipt) {
    if (receipt.stagingReference !== staging.reference || receipt.fingerprint !== staging.fingerprint
      || receipt.answerRecordReference !== staging.preparedRecord.reference || receipt.sourceReadingReference !== staging.sourceReadingReference
      || !answer || !same(answer, staging.preparedRecord)) {
      return { status: 'conflict', reason: 'Le reçu durable ne correspond pas au record préconstruit exact.' };
    }
    return { status: 'committed', staging, receipt, record: answer };
  }
  if (answer) return { status: 'conflict', reason: same(answer, staging.preparedRecord)
    ? 'Le record existe sans son receipt de commande, état impossible après le CAS atomique answer+receipt.'
    : 'Un autre record utilise l’ID de réponse préparé.' };
  return { status: 'pending', staging, sourceReadingArchive: archive, preparedRecord: staging.preparedRecord,
  };
}

function latestAnswerReference(workspace: HopV55Workspace, sourceReadingReference: string): string | undefined {
  const latest = [...(workspace.documentaryAnswers ?? [])].reverse().find(raw => {
    if (!isRow(raw)) return false;
    const read = readHopV55DocumentaryAnswerRecord(raw);
    return read.status === 'readOnly' && read.record.sourceReadingReference === sourceReadingReference;
  });
  return isRow(latest) && text(latest.reference) ? latest.reference : undefined;
}

/** Pure CAS1 candidate: append the fresh archive and exact staging in one workspace revision. */
export function appendHopV55PropertyAdviceReexaminationCommandStaging(
  workspace: HopV55Workspace,
  staging: HopV55PropertyAdviceReexaminationCommandStagingV1,
): HopV55Workspace {
  const read = readHopV55PropertyAdviceReexaminationCommandStaging(staging);
  if (read.status !== 'available') throw new Error(read.status === 'invalid' ? read.reason : 'Staging futur non modifiable.');
  const value = read.staging;
  if (workspace.ownerKey !== value.ownerKey || workspace.id !== value.workspaceId) throw new Error('Le staging V4 appartient à un autre workspace.');
  const parent = answerFor(workspace, value.parentRecordReference);
  if (!parent || parent.ledger.reference !== value.parentLedgerReference || parent.sourceReadingReference !== value.parentReadingReference) {
    throw new Error('Le parent ou le ledger V4 exact n’est plus disponible pour le CAS de staging.');
  }
  const occupied = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace,
    confirmation: value.confirmation });
  if (occupied.status !== 'absent') throw new Error(occupied.status === 'conflict' ? occupied.reason
    : occupied.status === 'unsupportedReadOnly' ? occupied.reason : 'Cette commande de réexamen V4 est déjà persistée.');
  if (workspace.decisionReadings?.some(row => row.contentReference === value.sourceReadingReference)) {
    throw new Error('L’archive de ce staging doit être ajoutée dans le même CAS; une archive seule n’autorise pas la reprise du builder.');
  }
  if (workspace.decisionReadings?.some(row => row.id === value.preview.sourceReadingArchive.id)) {
    throw new Error('L’ID d’archive du preview appartient déjà à un autre contenu.');
  }
  const sourceReadingArchive = archiveRead(value.preview.sourceReadingArchive);
  return {
    ...clone(workspace),
    decisionReadings: [...(workspace.decisionReadings ?? []), sourceReadingArchive],
    propertyAdviceReexaminationCommandStaging: [...(workspace.propertyAdviceReexaminationCommandStaging ?? []), clone(value)],
    updatedAt: value.confirmedAt,
  };
}

/** Root adapter shorthand: returns the CAS1 workspace candidate and exact staged command. */
export function stageHopV55PropertyAdviceReexaminationRecord(input: {
  workspace: HopV55Workspace;
  preview: HopV55PropertyAdviceReexaminationPreviewV1;
  confirmation: HopV55PropertyAdviceReexaminationConfirmationInputV1;
  preparedRecord: HopV55PropertyAdviceAnswerRecordV4;
}): { workspace: HopV55Workspace; staging: HopV55PropertyAdviceReexaminationCommandStagingV1 } {
  const staging = createHopV55PropertyAdviceReexaminationCommandStagingV1({ preview: input.preview,
    confirmation: input.confirmation, preparedRecord: input.preparedRecord });
  return { workspace: appendHopV55PropertyAdviceReexaminationCommandStaging(input.workspace, staging), staging };
}

/** Pure CAS2 candidate: append the exact prepared answer and receipt; staging remains an immutable prefix. */
export function appendHopV55PropertyAdviceReexaminationCommandReceipt(
  workspace: HopV55Workspace,
  receipt: HopV55PropertyAdviceReexaminationCommandReceiptV1,
): HopV55Workspace {
  const read = readHopV55PropertyAdviceReexaminationCommandReceipt(receipt);
  if (read.status !== 'available') throw new Error(read.status === 'invalid' ? read.reason : 'Reçu futur non modifiable.');
  const value = read.receipt;
  if (workspace.ownerKey !== value.ownerKey || workspace.id !== value.workspaceId) throw new Error('Le reçu V4 appartient à un autre workspace.');
  const staging = stageFor(workspace, value.stagingReference);
  if (!staging) throw new Error('Le staging exact doit être persisté dans un CAS antérieur au reçu V4.');
  if (staging.commandId !== value.commandId || staging.fingerprint !== value.fingerprint
    || staging.preparedRecord.reference !== value.answerRecordReference
    || staging.preview.reference !== value.previewReference || staging.sourceReadingReference !== value.sourceReadingReference
    || staging.parentRecordReference !== value.parentRecordReference) {
    throw new Error('Le reçu de commande V4 ne cite pas le staging exact.');
  }
  const sourceArchive = workspace.decisionReadings?.find(row => row.contentReference === staging.sourceReadingReference);
  if (!sourceArchive || !same(archiveRead(sourceArchive), staging.preview.sourceReadingArchive)) {
    throw new Error('L’archive exacte de la staging V4 n’est pas persistée.');
  }
  const priorReceipt = (workspace.propertyAdviceReexaminationCommandReceipts ?? []).find(row => isRow(row) && row.commandId === value.commandId);
  if (priorReceipt) {
    const existingRead = readHopV55PropertyAdviceReexaminationCommandReceipt(priorReceipt);
    if (existingRead.status !== 'available' || existingRead.receipt.reference !== value.reference) {
      throw new Error('Le commandId V4 possède déjà un receipt différent.');
    }
    const existingAnswer = answerFor(workspace, value.answerRecordReference);
    if (!existingAnswer || !same(existingAnswer, staging.preparedRecord)) throw new Error('Le reçu existant n’a pas son record exact.');
    return clone(workspace);
  }
  const priorAnswer = answerFor(workspace, value.answerRecordReference);
  const answers = workspace.documentaryAnswers ?? [];
  if (priorAnswer) throw new Error(same(priorAnswer, staging.preparedRecord)
    ? 'Le record exact existe sans son receipt, état impossible après le CAS atomique answer+receipt.'
    : 'L’ID de réponse existe avec un contenu différent.');
  if (latestAnswerReference(workspace, staging.sourceReadingReference)
    && latestAnswerReference(workspace, staging.sourceReadingReference) !== staging.parentRecordReference) {
    throw new Error('Une nouvelle tête documentaire a remplacé le parent depuis le preview; le record reste pending/historique.');
  }
  if (!sourceArchive) throw new Error('L’archive doit être persistée avant le record V4.');
  return {
    ...clone(workspace),
    documentaryAnswers: [...clone(answers), clone(staging.preparedRecord)],
    propertyAdviceReexaminationCommandReceipts: [ ...(workspace.propertyAdviceReexaminationCommandReceipts ?? []), clone(value) ],
    updatedAt: value.committedAt,
  };
}

/** Root adapter shorthand for the CAS2 candidate. */
export const appendHopV55PropertyAdviceReexaminationCommandReceiptToWorkspace =
  appendHopV55PropertyAdviceReexaminationCommandReceipt;
/** Short stable names for the host's two-CAS adapter. */
export const appendStage = appendHopV55PropertyAdviceReexaminationCommandStaging;
export const appendReceipt = appendHopV55PropertyAdviceReexaminationCommandReceipt;
export const lookupReexaminationCommand = lookupStoredHopV55PropertyAdviceReexaminationCommand;

function opaqueIdentity(value: unknown, workspace: HopV55Workspace): void {
  if (!isRow(value) || value.ownerKey !== workspace.ownerKey || value.workspaceId !== workspace.id
    || !text(value.commandId)) throw new Error('Commande future opaque sans owner/workspace/commandId exact.');
}

/** Strict static read for the two Runtime command families inside an existing workspace envelope. */
export function assertHopV55PropertyAdviceReexaminationCommandWorkspace(workspace: HopV55Workspace): void {
  const stages = workspace.propertyAdviceReexaminationCommandStaging ?? [];
  const receipts = workspace.propertyAdviceReexaminationCommandReceipts ?? [];
  const stageIds = new Set<string>();
  const stageReferences = new Set<string>();
  const receiptIds = new Set<string>();
  const receiptReferences = new Set<string>();
  for (const raw of stages) {
    const read = readHopV55PropertyAdviceReexaminationCommandStaging(raw);
    if (read.status === 'unsupportedReadOnly') { opaqueIdentity(read.snapshot, workspace); continue; }
    if (read.status !== 'available') throw new Error(`Staging de commande V4 invalide : ${read.reason}`);
    const stage = read.staging;
    if (stage.ownerKey !== workspace.ownerKey || stage.workspaceId !== workspace.id
      || stageIds.has(stage.commandId) || stageReferences.has(stage.reference)) throw new Error('Staging de commande V4 étranger ou dupliqué.');
    const parent = answerFor(workspace, stage.parentRecordReference);
    const source = workspace.decisionReadings?.find(row => row.contentReference === stage.parentReadingReference);
    const currentArchive = workspace.decisionReadings?.find(row => row.contentReference === stage.sourceReadingReference);
    const preparedAnswer = answerFor(workspace, stage.preparedRecord.reference);
    const hasReceipt = receipts.some(row => isRow(row) && row.commandId === stage.commandId);
    if (!parent || parent.format !== 'hop-v55-documentary-answer-record-v4' || parent.ledger.reference !== stage.parentLedgerReference
      || parent.sourceReadingReference !== stage.parentReadingReference || !source || !currentArchive
      || !same(archiveRead(currentArchive), stage.preview.sourceReadingArchive)
      || preparedAnswer && !hasReceipt) {
      throw new Error('Staging V4 sans parent, archive source ou archive confirmée exacts.');
    }
    stageIds.add(stage.commandId); stageReferences.add(stage.reference);
  }
  for (const raw of receipts) {
    const read = readHopV55PropertyAdviceReexaminationCommandReceipt(raw);
    if (read.status === 'unsupportedReadOnly') { opaqueIdentity(read.snapshot, workspace); continue; }
    if (read.status !== 'available') throw new Error(`Reçu de commande V4 invalide : ${read.reason}`);
    const receipt = read.receipt;
    if (receipt.ownerKey !== workspace.ownerKey || receipt.workspaceId !== workspace.id
      || receiptIds.has(receipt.commandId) || receiptReferences.has(receipt.reference)) throw new Error('Reçu de commande V4 étranger ou dupliqué.');
    const stage = stageFor(workspace, receipt.stagingReference);
    const answer = answerFor(workspace, receipt.answerRecordReference);
    if (!stage || !answer || stage.commandId !== receipt.commandId || stage.fingerprint !== receipt.fingerprint
      || stage.preparedRecord.reference !== receipt.answerRecordReference || !same(stage.preparedRecord, answer)
      || stage.preview.reference !== receipt.previewReference || stage.sourceReadingReference !== receipt.sourceReadingReference
      || stage.parentRecordReference !== receipt.parentRecordReference) {
      throw new Error('Reçu V4 sans staging, archive et record exacts.');
    }
    receiptIds.add(receipt.commandId); receiptReferences.add(receipt.reference);
  }
  const reserved = new Set([...stageIds, ...receiptIds]);
  for (const raw of [...stages, ...receipts]) {
    if (!isFutureFamily(raw, 'staging') && !isFutureFamily(raw, 'receipt')) continue;
    if (typeof raw.commandId === 'string' && reserved.has(raw.commandId)) {
      throw new Error('Une commande future opaque réserve un commandId déjà utilisé par une version courante.');
    }
    if (isRow(raw) && ![...stageIds, ...receiptIds].includes(String(raw.commandId))) opaqueIdentity(raw, workspace);
  }
}

/** Workspace transition guard. Stage/archive are one CAS; answer/receipt are a later CAS. */
export function assertHopV55PropertyAdviceReexaminationCommandAppendOnly(
  previous: HopV55Workspace, next: HopV55Workspace,
): void {
  const oldStages = previous.propertyAdviceReexaminationCommandStaging ?? [];
  const newStages = next.propertyAdviceReexaminationCommandStaging ?? [];
  const oldReceipts = previous.propertyAdviceReexaminationCommandReceipts ?? [];
  const newReceipts = next.propertyAdviceReexaminationCommandReceipts ?? [];
  if (newStages.length < oldStages.length || oldStages.some((row, index) => !same(row, newStages[index]))) {
    throw new Error('Les staging V4 sont immuables et append-only.');
  }
  if (newReceipts.length < oldReceipts.length || oldReceipts.some((row, index) => !same(row, newReceipts[index]))) {
    throw new Error('Les reçus de commande V4 sont immuables et append-only.');
  }
  const oldArchives = new Set((previous.decisionReadings ?? []).map(row => row.contentReference));
  for (const raw of newStages.slice(oldStages.length)) {
    const read = readHopV55PropertyAdviceReexaminationCommandStaging(raw);
    if (read.status !== 'available') throw new Error('Un format futur ou invalide ne peut pas être ajouté comme staging courant.');
    const stage = read.staging;
    if (previous.ownerKey !== stage.ownerKey || previous.id !== stage.workspaceId
      || (oldStages.some(row => hasCommandId(row, stage.commandId)) || oldReceipts.some(row => hasCommandId(row, stage.commandId)))) {
      throw new Error('Cette commande V4 appartient à un autre workspace ou réserve déjà son ID.');
    }
    const appendedArchive = (next.decisionReadings ?? []).find(row => row.contentReference === stage.sourceReadingReference);
    if (oldArchives.has(stage.sourceReadingReference) || !appendedArchive
      || !same(archiveRead(appendedArchive), stage.preview.sourceReadingArchive)) {
      throw new Error('Le CAS de staging V4 doit ajouter ensemble le preview source exact et sa commande pending.');
    }
    const parent = answerFor(previous, stage.parentRecordReference);
    if (!parent || parent.format !== 'hop-v55-documentary-answer-record-v4'
      || parent.ledger.reference !== stage.parentLedgerReference || parent.sourceReadingReference !== stage.parentReadingReference) {
      throw new Error('Le CAS de staging V4 doit partir du record/ledger parent exact déjà persisté.');
    }
    // The staged archive is the real successor: same reading format, scopes, lineage and semantic annotations as its parent.
    const parentArchive = (previous.decisionReadings ?? []).find(row => row.contentReference === stage.parentReadingReference);
    if (!parentArchive || !hopV55SuccessorPreservesParentV1(archiveRead(appendedArchive), archiveRead(parentArchive))) {
      throw new Error('L’archive staged ne conserve pas le format, les portées, la filiation ou les annotations de la lecture parent.');
    }
  }
  for (const raw of newReceipts.slice(oldReceipts.length)) {
    const read = readHopV55PropertyAdviceReexaminationCommandReceipt(raw);
    if (read.status !== 'available') throw new Error('Un format futur ou invalide ne peut pas être ajouté comme reçu courant.');
    const receipt = read.receipt;
    const stage = stageFor(previous, receipt.stagingReference);
    if (!stage || stage.commandId !== receipt.commandId || stage.fingerprint !== receipt.fingerprint) {
      throw new Error('Le CAS de reçu V4 exige la staging exacte dans le préfixe antérieur.');
    }
    if (answerFor(previous, receipt.answerRecordReference)) {
      throw new Error('Le CAS de réponse V4 et son receipt doivent être appendés ensemble; un record préexistant sans receipt est orphelin.');
    }
    if (oldReceipts.some(row => hasCommandId(row, receipt.commandId))) throw new Error('La commande V4 a déjà un reçu durable.');
    const answer = answerFor(next, receipt.answerRecordReference);
    if (!answer || !same(answer, stage.preparedRecord) || answer.sourceReadingReference !== stage.sourceReadingReference) {
      throw new Error('Le CAS de reçu V4 doit ajouter le record préconstruit exact avec son receipt.');
    }
    if (!(previous.decisionReadings ?? []).some(row => row.contentReference === stage.sourceReadingReference)) {
      throw new Error('L’archive V4 doit être préfixée avant le CAS de réponse/reçu.');
    }
  }
  for (const raw of (next.documentaryAnswers ?? []).slice((previous.documentaryAnswers ?? []).length)) {
    const read = readHopV55DocumentaryAnswerRecord(raw);
    if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v4'
      || read.record.transition.kind !== 'reexamine') continue;
    const reexamined = read.record as HopV55PropertyAdviceAnswerRecordV4;
    const stage = (next.propertyAdviceReexaminationCommandStaging ?? []).flatMap(value => {
      const parsed = readHopV55PropertyAdviceReexaminationCommandStaging(value);
      return parsed.status === 'available' && parsed.staging.commandId === reexamined.transition.actId ? [parsed.staging] : [];
    })[0];
    if (!stage) continue; // Legacy direct reexamine commands remain unchanged.
    const receipt = (next.propertyAdviceReexaminationCommandReceipts ?? []).flatMap(value => {
      const parsed = readHopV55PropertyAdviceReexaminationCommandReceipt(value);
      return parsed.status === 'available' && parsed.receipt.commandId === stage.commandId ? [parsed.receipt] : [];
    })[0];
    if (!receipt || receipt.answerRecordReference !== reexamined.reference || !same(stage.preparedRecord, reexamined)) {
      throw new Error('Un reexamen V4 staged exige son answer exact et son receipt dans le même CAS de commit.');
    }
  }
}
