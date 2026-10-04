import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { createHopPropertyAdviceDossier, assertHopPropertyAdviceAnswer, assertHopPropertyAdviceDossier,
  hopPropertyAdviceAnswerReference, hopPropertyAdviceDossierReference,
  HOP_PROPERTY_ADVICE_ANSWER_VERSION, HOP_PROPERTY_ADVICE_REQUEST_VERSION,
  readHopPropertyAdviceAnswer, readHopPropertyAdviceDossier,
  type HopPropertyAdviceAnswer, type HopPropertyAdviceDossier } from '../../domain/hopDecision/propertyAdviceSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55DocumentaryRevisionContextV1 } from './documentaryDecision';
import { assertHopV55PropertyAdviceRequestDraftV2, hopV55PropertyAdvicePreparedReference,
  hopV55PropertyAdviceRequestDraftReference, type HopV55PropertyAdviceRecordReexaminationContextV2,
  type HopV55PropertyAdviceRequestDraftV2 } from './propertyAdvicePreparation';

export const HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT = 'hop-v55-documentary-answer-record-v2' as const;
export const HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT = 'hop-v55-documentary-dossier-record-v2' as const;

export interface HopV55PropertyAdviceAnswerRecordV2 {
  format: typeof HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  requestDraftReference: string;
  preparedReference: string;
  answerSnapshot: HopPropertyAdviceAnswer;
  answerReference: string;
  revisionContext?: HopV55DocumentaryRevisionContextV1;
  reexaminationContext?: HopV55PropertyAdviceRecordReexaminationContextV2;
  reference: string;
}

export interface HopV55PropertyAdviceDossierRecordV2 {
  format: typeof HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  answerRecordReference: string;
  answerReference: string;
  strategyId: string;
  strategyReference: string;
  dossierSnapshot: HopPropertyAdviceDossier;
  dossierReference: string;
  reference: string;
}

export type HopV55PropertyAdviceRecordRead<T> =
  | { status: 'readOnly'; record: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

type Row = Record<string, any>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const clone = <T,>(value: T): T => structuredClone(value);

function onlyKeys(value: Row, allowed: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`${label} contient un champ non pris en charge.`);
}

function assertRevisionContext(value: unknown): asserts value is HopV55DocumentaryRevisionContextV1 {
  if (!isRow(value)) throw new Error('Contexte de révision documentaire absent.');
  onlyKeys(value, ['sourceAnswerRecordReference', 'sourceAnswerReference', 'reason', 'recordedAt', 'recordedBy'], 'Contexte de révision');
  if (!text(value.sourceAnswerRecordReference) || !text(value.sourceAnswerReference) || !text(value.reason)
    || !text(value.recordedAt) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.recordedAt)
    || !Number.isFinite(Date.parse(value.recordedAt)) || !isRow(value.recordedBy)) {
    throw new Error('Contexte de révision documentaire incomplet ou horodatage invalide.');
  }
  onlyKeys(value.recordedBy, ['origin', 'label'], 'Auteur de révision');
  if (!['user', 'proposal', 'fixture'].includes(value.recordedBy.origin) || !text(value.recordedBy.label)) {
    throw new Error('Auteur de révision documentaire invalide.');
  }
}

function assertReexaminationContext(value: unknown): asserts value is HopV55PropertyAdviceRecordReexaminationContextV2 {
  if (!isRow(value)) throw new Error('Contexte de réexamen documentaire absent.');
  onlyKeys(value, ['sourceAnswerRecordReference', 'sourceAnswerReference', 'sourceReadingReference', 'reason', 'recordedAt', 'recordedBy'],
    'Contexte de réexamen');
  if (!text(value.sourceAnswerRecordReference) || !text(value.sourceAnswerReference) || !text(value.sourceReadingReference)
    || !text(value.reason) || !text(value.recordedAt)
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.recordedAt)
    || !Number.isFinite(Date.parse(value.recordedAt)) || !isRow(value.recordedBy)) {
    throw new Error('Contexte de réexamen documentaire incomplet ou horodatage invalide.');
  }
  onlyKeys(value.recordedBy, ['origin', 'label'], 'Auteur de réexamen');
  if (!['user', 'proposal', 'fixture'].includes(value.recordedBy.origin) || !text(value.recordedBy.label)) {
    throw new Error('Auteur de réexamen documentaire invalide.');
  }
}

function answerRecordReference(record: Omit<HopV55PropertyAdviceAnswerRecordV2, 'reference'> | HopV55PropertyAdviceAnswerRecordV2): string {
  const { reference: _reference, ...body } = record as HopV55PropertyAdviceAnswerRecordV2;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT, body);
}

function dossierRecordReference(record: Omit<HopV55PropertyAdviceDossierRecordV2, 'reference'> | HopV55PropertyAdviceDossierRecordV2): string {
  const { reference: _reference, ...body } = record as HopV55PropertyAdviceDossierRecordV2;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT, body);
}

function assertAnswerRecordEnvelope(record: HopV55PropertyAdviceAnswerRecordV2): void {
  if (record.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT || !text(record.id)
    || !text(record.ownerKey) || !text(record.workspaceId) || !text(record.sourceReadingReference)
    || !text(record.requestDraftReference) || !text(record.preparedReference) || !text(record.answerReference)
    || !text(record.reference)) throw new Error('Enveloppe de réponse par propriété V2 incomplète.');
  onlyKeys(record, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'requestDraftReference',
    'preparedReference', 'answerSnapshot', 'answerReference', 'revisionContext', 'reexaminationContext', 'reference'], 'Enveloppe de réponse V2');
  if (!isRow(record.answerSnapshot) || !text(record.answerSnapshot.reference)) {
    throw new Error('Snapshot de réponse V2 ou référence canonique absents.');
  }
  const expectedRequestDraftReference = hopV55PropertyAdviceRequestDraftReference({
    format: 'hop-v55-property-advice-request-draft-v2', id: record.answerSnapshot.requestSnapshot.id,
    ownerKey: record.ownerKey, workspaceId: record.workspaceId, sourceReadingReference: record.sourceReadingReference,
    preparedReference: record.preparedReference, requestSnapshot: record.answerSnapshot.requestSnapshot,
  });
  if (record.answerReference !== record.answerSnapshot.reference
    || record.answerReference !== hopPropertyAdviceAnswerReference(record.answerSnapshot)
    || record.requestDraftReference !== expectedRequestDraftReference
    || answerRecordReference(record) !== record.reference) throw new Error('La réponse canonique V2 ou son enveloppe a changé.');
  if (record.revisionContext !== undefined && record.reexaminationContext !== undefined) {
    throw new Error('Une réponse ne peut pas être une révision et un réexamen à la fois.');
  }
  if (record.revisionContext !== undefined) assertRevisionContext(record.revisionContext);
  if (record.reexaminationContext !== undefined) {
    assertReexaminationContext(record.reexaminationContext);
    if (record.reexaminationContext.sourceReadingReference === record.sourceReadingReference) {
      throw new Error('Un réexamen doit provenir d’une archive de lecture distincte.');
    }
  }
}

function assertAnswerRecord(record: HopV55PropertyAdviceAnswerRecordV2): void {
  assertAnswerRecordEnvelope(record);
  assertHopPropertyAdviceAnswer(record.answerSnapshot);
}

function assertDossierRecordEnvelope(record: HopV55PropertyAdviceDossierRecordV2): void {
  if (record.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT || !text(record.id)
    || !text(record.ownerKey) || !text(record.workspaceId) || !text(record.sourceReadingReference)
    || !text(record.answerRecordReference) || !text(record.answerReference) || !text(record.strategyId)
    || !text(record.strategyReference) || !text(record.dossierReference) || !text(record.reference)) {
    throw new Error('Enveloppe de dossier par propriété V2 incomplète.');
  }
  onlyKeys(record, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'answerRecordReference',
    'answerReference', 'strategyId', 'strategyReference', 'dossierSnapshot', 'dossierReference', 'reference'], 'Enveloppe de dossier V2');
  if (!isRow(record.dossierSnapshot) || !text(record.dossierSnapshot.reference)) {
    throw new Error('Snapshot de dossier V2 ou référence canonique absent.');
  }
  if (record.dossierSnapshot.id !== record.id || record.dossierSnapshot.answerReference !== record.answerReference
    || record.dossierSnapshot.strategyId !== record.strategyId || record.dossierSnapshot.strategyReference !== record.strategyReference
    || record.dossierReference !== record.dossierSnapshot.reference
    || record.dossierReference !== hopPropertyAdviceDossierReference(record.dossierSnapshot)
    || dossierRecordReference(record) !== record.reference) throw new Error('Le dossier V2 ne correspond pas à sa stratégie, sa réponse ou son enveloppe.');
}

function assertDossierRecord(record: HopV55PropertyAdviceDossierRecordV2): void {
  assertDossierRecordEnvelope(record);
  assertHopPropertyAdviceDossier(record.dossierSnapshot);
}

function isKnownCurrentAnswerV2(value: unknown): value is HopPropertyAdviceAnswer {
  return isRow(value) && value.format === HOP_PROPERTY_ADVICE_ANSWER_VERSION
    && isRow(value.requestSnapshot) && value.requestSnapshot.format === HOP_PROPERTY_ADVICE_REQUEST_VERSION
    && isRow(value.corpusSnapshot) && value.corpusSnapshot.format === 'hop-documentary-corpus-v1';
}

function isKnownCurrentDossierV2(value: unknown): value is HopPropertyAdviceDossier {
  return isRow(value) && value.format === 'hop-documentary-dossier-v2'
    && isKnownCurrentAnswerV2(value.answerSnapshot);
}

/** Seals an already-built canonical answer. It does not invoke the property-advice builder. */
export function createHopV55PropertyAdviceAnswerRecord(input: {
  draft: HopV55PropertyAdviceRequestDraftV2;
  prepared: PreparedBrewingScenarioContext;
  answerSnapshot: HopPropertyAdviceAnswer;
  answerRecordId: string;
  revisionContext?: HopV55DocumentaryRevisionContextV1;
  reexaminationContext?: HopV55PropertyAdviceRecordReexaminationContextV2;
}): HopV55PropertyAdviceAnswerRecordV2 {
  const { draft } = input;
  if (!draft || draft.format !== 'hop-v55-property-advice-request-draft-v2' || !text(draft.id)
    || !text(draft.ownerKey) || !text(draft.workspaceId) || !text(draft.sourceReadingReference)
    || !text(draft.preparedReference) || !text(draft.reference) || !text(input.answerRecordId)) {
    throw new Error('Brouillon V2 ou identité de réponse exacte requis.');
  }
  assertHopV55PropertyAdviceRequestDraftV2(draft);
  if (hopV55PropertyAdvicePreparedReference(input.prepared, draft.requestSnapshot) !== draft.preparedReference) {
    throw new Error('Le contexte, les matières ou la policy ont changé; relis explicitement le brouillon avant la réponse.');
  }
  assertHopPropertyAdviceAnswer(input.answerSnapshot);
  if (hopAdviceContentReference('hop-v55-property-advice-request-equality-v2', input.answerSnapshot.requestSnapshot)
    !== hopAdviceContentReference('hop-v55-property-advice-request-equality-v2', draft.requestSnapshot)) {
    throw new Error('La réponse V2 ne conserve pas exactement le requestSnapshot scellé du brouillon.');
  }
  if (input.revisionContext !== undefined && input.reexaminationContext !== undefined) {
    throw new Error('Une réponse ne peut pas être une révision et un réexamen à la fois.');
  }
  if (input.revisionContext !== undefined) assertRevisionContext(input.revisionContext);
  if (input.reexaminationContext !== undefined) {
    assertReexaminationContext(input.reexaminationContext);
    if (input.reexaminationContext.sourceReadingReference === draft.sourceReadingReference) {
      throw new Error('Un réexamen doit provenir d’une archive de lecture distincte.');
    }
  }
  const body: Omit<HopV55PropertyAdviceAnswerRecordV2, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT,
    id: input.answerRecordId, ownerKey: draft.ownerKey, workspaceId: draft.workspaceId,
    sourceReadingReference: draft.sourceReadingReference, requestDraftReference: draft.reference,
    preparedReference: draft.preparedReference, answerSnapshot: clone(input.answerSnapshot),
    answerReference: input.answerSnapshot.reference,
    ...(input.revisionContext ? { revisionContext: clone(input.revisionContext) } : {}),
    ...(input.reexaminationContext ? { reexaminationContext: clone(input.reexaminationContext) } : {}),
  };
  const record = { ...body, reference: answerRecordReference(body) };
  assertAnswerRecord(record);
  return clone(record);
}

/** Creates a V2 strategy dossier with strategy IDs/references; it never casts to a V1 route. */
export function createHopV55PropertyAdviceDossierRecord(input: {
  answerRecord: HopV55PropertyAdviceAnswerRecordV2;
  dossierId: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
  createdAt: string;
  createdBy: HopPropertyAdviceDossier['createdBy'];
}): HopV55PropertyAdviceDossierRecordV2 {
  assertAnswerRecord(input.answerRecord);
  const dossier = createHopPropertyAdviceDossier({
    id: input.dossierId, answer: input.answerRecord.answerSnapshot,
    expectedAnswerReference: input.expectedAnswerReference,
    expectedInterpretationReference: input.expectedInterpretationReference,
    strategyId: input.strategyId, expectedStrategyReference: input.expectedStrategyReference,
    motive: input.motive, createdAt: input.createdAt, createdBy: clone(input.createdBy),
  });
  const body: Omit<HopV55PropertyAdviceDossierRecordV2, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT,
    id: input.dossierId, ownerKey: input.answerRecord.ownerKey, workspaceId: input.answerRecord.workspaceId,
    sourceReadingReference: input.answerRecord.sourceReadingReference,
    answerRecordReference: input.answerRecord.reference, answerReference: input.answerRecord.answerReference,
    strategyId: input.strategyId, strategyReference: input.expectedStrategyReference,
    dossierSnapshot: clone(dossier), dossierReference: dossier.reference,
  };
  const record = { ...body, reference: dossierRecordReference(body) };
  assertDossierRecord(record);
  return clone(record);
}

export function readHopV55PropertyAdviceAnswerRecord(value: unknown): HopV55PropertyAdviceRecordRead<HopV55PropertyAdviceAnswerRecordV2> {
  if (isRow(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-answer-record-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur d’enveloppe V2 conservé sans interprétation.' };
  }
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT) throw new Error('Enveloppe de réponse V2 invalide.');
  const nested = readHopPropertyAdviceAnswer(value.answerSnapshot);
  if (nested.status === 'unsupportedReadOnly') {
    // A known V2 domain snapshot can be RO only after its wrapper links and seal
    // also pass. A true nested future DTO remains byte-preserved as received.
    if (isKnownCurrentAnswerV2(value.answerSnapshot)) {
      assertAnswerRecordEnvelope(value as unknown as HopV55PropertyAdviceAnswerRecordV2);
    }
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: nested.reason };
  }
  if (nested.status !== 'readOnly') throw new Error('Une enveloppe V2 ne peut contenir une réponse de domaine V1.');
  assertAnswerRecord(value as unknown as HopV55PropertyAdviceAnswerRecordV2);
  return { status: 'readOnly', record: clone(value) as unknown as HopV55PropertyAdviceAnswerRecordV2 };
}

export function readHopV55PropertyAdviceDossierRecord(value: unknown): HopV55PropertyAdviceRecordRead<HopV55PropertyAdviceDossierRecordV2> {
  if (isRow(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-dossier-record-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur d’enveloppe de dossier V2 conservé sans interprétation.' };
  }
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT) throw new Error('Enveloppe de dossier V2 invalide.');
  const nested = readHopPropertyAdviceDossier(value.dossierSnapshot);
  if (nested.status === 'unsupportedReadOnly') {
    if (isKnownCurrentDossierV2(value.dossierSnapshot)) {
      assertDossierRecordEnvelope(value as unknown as HopV55PropertyAdviceDossierRecordV2);
    }
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: nested.reason };
  }
  if (nested.status !== 'readOnly') throw new Error('Une enveloppe V2 ne peut contenir un dossier de domaine V1.');
  assertDossierRecord(value as unknown as HopV55PropertyAdviceDossierRecordV2);
  return { status: 'readOnly', record: clone(value) as unknown as HopV55PropertyAdviceDossierRecordV2 };
}
