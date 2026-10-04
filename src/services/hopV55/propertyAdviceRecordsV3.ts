import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { createHopPropertyAdviceDossierV3, assertHopPropertyAdviceAnswerV3, assertHopPropertyAdviceDossierV3,
  hopPropertyAdviceAnswerReferenceV3, hopPropertyAdviceDossierReferenceV3,
  HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION, HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION, HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION,
  readHopPropertyAdviceAnswerV3, readHopPropertyAdviceDossierV3,
  type HopPropertyAdviceAnswerV3, type HopPropertyAdviceDossierV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55DocumentaryRevisionContextV1 } from './documentaryDecision';
import { assertHopV55PropertyAdviceRequestDraftV3, hopV55PropertyAdvicePreparedReferenceV3,
  hopV55PropertyAdviceRequestDraftReferenceV3,
  type HopV55PropertyAdviceRecordReexaminationContextV3, type HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';

export const HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT = 'hop-v55-documentary-answer-record-v3' as const;
export const HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT = 'hop-v55-documentary-dossier-record-v3' as const;

export interface HopV55PropertyAdviceAnswerRecordV3 {
  format: typeof HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  requestDraftReference: string;
  preparedReference: string;
  answerSnapshot: HopPropertyAdviceAnswerV3;
  answerReference: string;
  revisionContext?: HopV55DocumentaryRevisionContextV1;
  reexaminationContext?: HopV55PropertyAdviceRecordReexaminationContextV3;
  reference: string;
}

export interface HopV55PropertyAdviceDossierRecordV3 {
  format: typeof HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  answerRecordReference: string;
  answerReference: string;
  strategyId: string;
  strategyReference: string;
  dossierSnapshot: HopPropertyAdviceDossierV3;
  dossierReference: string;
  reference: string;
}

export type HopV55PropertyAdviceRecordV3Read<T> =
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
  if (!isRow(value)) throw new Error('Contexte de révision documentaire V3 absent.');
  onlyKeys(value, ['sourceAnswerRecordReference', 'sourceAnswerReference', 'reason', 'recordedAt', 'recordedBy'], 'Contexte de révision V3');
  if (!text(value.sourceAnswerRecordReference) || !text(value.sourceAnswerReference) || !text(value.reason) || !text(value.recordedAt)
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.recordedAt)
    || !Number.isFinite(Date.parse(value.recordedAt)) || !isRow(value.recordedBy)) {
    throw new Error('Contexte de révision documentaire V3 incomplet ou invalide.');
  }
  onlyKeys(value.recordedBy, ['origin', 'label'], 'Auteur de révision V3');
  if (!['user', 'proposal', 'fixture'].includes(value.recordedBy.origin) || !text(value.recordedBy.label)) {
    throw new Error('Auteur de révision documentaire V3 invalide.');
  }
}

function assertReexaminationContext(value: unknown): asserts value is HopV55PropertyAdviceRecordReexaminationContextV3 {
  if (!isRow(value)) throw new Error('Contexte de réexamen documentaire V3 absent.');
  onlyKeys(value, ['sourceAnswerRecordReference', 'sourceAnswerReference', 'sourceReadingReference', 'reason', 'recordedAt', 'recordedBy'],
    'Contexte de réexamen V3');
  if (!text(value.sourceAnswerRecordReference) || !text(value.sourceAnswerReference) || !text(value.sourceReadingReference)
    || !text(value.reason) || !text(value.recordedAt)
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.recordedAt)
    || !Number.isFinite(Date.parse(value.recordedAt)) || !isRow(value.recordedBy)) {
    throw new Error('Contexte de réexamen documentaire V3 incomplet ou invalide.');
  }
  onlyKeys(value.recordedBy, ['origin', 'label'], 'Auteur de réexamen V3');
  if (!['user', 'proposal', 'fixture'].includes(value.recordedBy.origin) || !text(value.recordedBy.label)) {
    throw new Error('Auteur de réexamen documentaire V3 invalide.');
  }
}

function answerRecordReference(record: Omit<HopV55PropertyAdviceAnswerRecordV3, 'reference'> | HopV55PropertyAdviceAnswerRecordV3): string {
  const { reference: _reference, ...body } = record as HopV55PropertyAdviceAnswerRecordV3;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT, body);
}

function dossierRecordReference(record: Omit<HopV55PropertyAdviceDossierRecordV3, 'reference'> | HopV55PropertyAdviceDossierRecordV3): string {
  const { reference: _reference, ...body } = record as HopV55PropertyAdviceDossierRecordV3;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT, body);
}

function answerDraftReference(record: HopV55PropertyAdviceAnswerRecordV3): string {
  const requestSnapshot = record.answerSnapshot.requestSnapshot;
  return hopV55PropertyAdviceRequestDraftReferenceV3({
    format: 'hop-v55-property-advice-request-draft-v3', id: requestSnapshot.id,
    ownerKey: record.ownerKey, workspaceId: record.workspaceId,
    sourceReadingReference: record.sourceReadingReference, preparedReference: record.preparedReference,
    requestSnapshot, reference: record.requestDraftReference,
  } as HopV55PropertyAdviceRequestDraftV3);
}

function isKnownCurrentV3Answer(value: unknown): value is HopPropertyAdviceAnswerV3 {
  return isRow(value) && value.format === HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION
    && isRow(value.requestSnapshot) && value.requestSnapshot.format === HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION
    && isRow(value.corpusSnapshot) && value.corpusSnapshot.format === 'hop-documentary-corpus-v1';
}

function isKnownCurrentV3Dossier(value: unknown): value is HopPropertyAdviceDossierV3 {
  return isRow(value) && value.format === HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION
    && isKnownCurrentV3Answer(value.answerSnapshot);
}

function assertAnswerRecordV3Outer(record: HopV55PropertyAdviceAnswerRecordV3, requireDomainV3: boolean): void {
  if (record.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT || !text(record.id)
    || !text(record.ownerKey) || !text(record.workspaceId) || !text(record.sourceReadingReference)
    || !text(record.requestDraftReference) || !text(record.preparedReference) || !text(record.answerReference)
    || !text(record.reference)) throw new Error('Enveloppe de réponse propriété V3 incomplète.');
  onlyKeys(record, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'requestDraftReference',
    'preparedReference', 'answerSnapshot', 'answerReference', 'revisionContext', 'reexaminationContext', 'reference'],
  'Enveloppe de réponse V3');
  if (!isRow(record.answerSnapshot) || !text(record.answerSnapshot.reference)
    || record.answerReference !== record.answerSnapshot.reference) {
    throw new Error('La réponse V3 doit pointer vers la référence exacte du snapshot imbriqué.');
  }
  const knownV3Snapshot = isKnownCurrentV3Answer(record.answerSnapshot);
  if (requireDomainV3) assertHopPropertyAdviceAnswerV3(record.answerSnapshot);
  if (requireDomainV3 || knownV3Snapshot) {
    if (record.answerReference !== hopPropertyAdviceAnswerReferenceV3(record.answerSnapshot as HopPropertyAdviceAnswerV3)
      || record.requestDraftReference !== answerDraftReference(record)) {
      throw new Error('Le snapshot réponse, draft V3 ou leurs références ne correspondent pas à l’enveloppe.');
    }
  }
  if (answerRecordReference(record) !== record.reference) throw new Error('Référence SHA de l’enveloppe réponse V3 altérée.');
  if (record.revisionContext !== undefined && record.reexaminationContext !== undefined) {
    throw new Error('Une réponse V3 ne peut pas être une révision et un réexamen simultanés.');
  }
  if (record.revisionContext !== undefined) assertRevisionContext(record.revisionContext);
  if (record.reexaminationContext !== undefined) {
    assertReexaminationContext(record.reexaminationContext);
    if (record.reexaminationContext.sourceReadingReference === record.sourceReadingReference) {
      throw new Error('Un réexamen V3 doit référencer une lecture distincte.');
    }
  }
}

function assertDossierRecordV3Outer(record: HopV55PropertyAdviceDossierRecordV3, requireDomainV3: boolean): void {
  if (record.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT || !text(record.id)
    || !text(record.ownerKey) || !text(record.workspaceId) || !text(record.sourceReadingReference)
    || !text(record.answerRecordReference) || !text(record.answerReference) || !text(record.strategyId)
    || !text(record.strategyReference) || !text(record.dossierReference) || !text(record.reference)) {
    throw new Error('Enveloppe de dossier propriété V3 incomplète.');
  }
  onlyKeys(record, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'answerRecordReference',
    'answerReference', 'strategyId', 'strategyReference', 'dossierSnapshot', 'dossierReference', 'reference'],
  'Enveloppe de dossier V3');
  if (!isRow(record.dossierSnapshot) || !text(record.dossierSnapshot.reference)
    || record.dossierSnapshot.id !== record.id || record.dossierSnapshot.answerReference !== record.answerReference
    || record.dossierSnapshot.strategyId !== record.strategyId || record.dossierSnapshot.strategyReference !== record.strategyReference
    || record.dossierSnapshot.reference !== record.dossierReference) {
    throw new Error('Le dossier V3 doit rester lié à ses références internes exactes.');
  }
  const knownV3Snapshot = isKnownCurrentV3Dossier(record.dossierSnapshot);
  if (requireDomainV3) assertHopPropertyAdviceDossierV3(record.dossierSnapshot);
  if (requireDomainV3 || knownV3Snapshot) {
    if (record.dossierReference !== hopPropertyAdviceDossierReferenceV3(record.dossierSnapshot as HopPropertyAdviceDossierV3)
      || record.answerReference !== hopPropertyAdviceAnswerReferenceV3(record.dossierSnapshot.answerSnapshot)) {
      throw new Error('Les références canoniques du dossier ou de la réponse V3 imbriquée sont altérées.');
    }
  }
  if (dossierRecordReference(record) !== record.reference) throw new Error('Référence SHA de l’enveloppe dossier V3 altérée.');
}

function assertAnswerRecordV3(record: HopV55PropertyAdviceAnswerRecordV3): void {
  assertAnswerRecordV3Outer(record, true);
}

function assertDossierRecordV3(record: HopV55PropertyAdviceDossierRecordV3): void {
  assertDossierRecordV3Outer(record, true);
}

/** Seals an already-built answer V3; no builder or corpus lookup runs here. */
export function createHopV55PropertyAdviceAnswerRecordV3(input: {
  draft: HopV55PropertyAdviceRequestDraftV3;
  prepared: PreparedBrewingScenarioContext;
  answerSnapshot: HopPropertyAdviceAnswerV3;
  answerRecordId: string;
  revisionContext?: HopV55DocumentaryRevisionContextV1;
  reexaminationContext?: HopV55PropertyAdviceRecordReexaminationContextV3;
}): HopV55PropertyAdviceAnswerRecordV3 {
  const { draft } = input;
  if (!draft || !text(input.answerRecordId)) throw new Error('Brouillon V3 et identité de réponse requis.');
  assertHopV55PropertyAdviceRequestDraftV3(draft);
  if (hopV55PropertyAdvicePreparedReferenceV3(input.prepared, draft.requestSnapshot) !== draft.preparedReference) {
    throw new Error('Le contexte ou le périmètre préparé a changé; revois explicitement la demande V3.');
  }
  assertHopPropertyAdviceAnswerV3(input.answerSnapshot);
  if (hopAdviceContentReference('hop-property-advice-request-equality-v3', input.answerSnapshot.requestSnapshot)
    !== hopAdviceContentReference('hop-property-advice-request-equality-v3', draft.requestSnapshot)) {
    throw new Error('La réponse V3 ne conserve pas exactement le requestSnapshot V3 du draft.');
  }
  if (input.revisionContext !== undefined && input.reexaminationContext !== undefined) {
    throw new Error('Une réponse V3 ne peut pas être une révision et un réexamen simultanés.');
  }
  if (input.revisionContext !== undefined) assertRevisionContext(input.revisionContext);
  if (input.reexaminationContext !== undefined) {
    assertReexaminationContext(input.reexaminationContext);
    if (input.reexaminationContext.sourceReadingReference === draft.sourceReadingReference) {
      throw new Error('Un réexamen V3 doit référencer une lecture distincte.');
    }
  }
  const body: Omit<HopV55PropertyAdviceAnswerRecordV3, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT, id: input.answerRecordId,
    ownerKey: draft.ownerKey, workspaceId: draft.workspaceId, sourceReadingReference: draft.sourceReadingReference,
    requestDraftReference: draft.reference, preparedReference: draft.preparedReference,
    answerSnapshot: clone(input.answerSnapshot), answerReference: input.answerSnapshot.reference,
    ...(input.revisionContext ? { revisionContext: clone(input.revisionContext) } : {}),
    ...(input.reexaminationContext ? { reexaminationContext: clone(input.reexaminationContext) } : {}),
  };
  const record = { ...body, reference: answerRecordReference(body) };
  assertAnswerRecordV3(record);
  return clone(record);
}

/** Creates a V3 strategy dossier from its exact V3 answer and strategy. */
export function createHopV55PropertyAdviceDossierRecordV3(input: {
  answerRecord: HopV55PropertyAdviceAnswerRecordV3;
  dossierId: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
  createdAt: string;
  createdBy: HopPropertyAdviceDossierV3['createdBy'];
}): HopV55PropertyAdviceDossierRecordV3 {
  assertAnswerRecordV3(input.answerRecord);
  const dossier = createHopPropertyAdviceDossierV3({
    id: input.dossierId, answer: input.answerRecord.answerSnapshot,
    expectedAnswerReference: input.expectedAnswerReference,
    expectedInterpretationReference: input.expectedInterpretationReference,
    strategyId: input.strategyId, expectedStrategyReference: input.expectedStrategyReference,
    motive: input.motive, createdAt: input.createdAt, createdBy: clone(input.createdBy),
  });
  const body: Omit<HopV55PropertyAdviceDossierRecordV3, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT, id: input.dossierId,
    ownerKey: input.answerRecord.ownerKey, workspaceId: input.answerRecord.workspaceId,
    sourceReadingReference: input.answerRecord.sourceReadingReference,
    answerRecordReference: input.answerRecord.reference, answerReference: input.answerRecord.answerReference,
    strategyId: input.strategyId, strategyReference: input.expectedStrategyReference,
    dossierSnapshot: clone(dossier), dossierReference: dossier.reference,
  };
  const record = { ...body, reference: dossierRecordReference(body) };
  assertDossierRecordV3(record);
  return clone(record);
}

export function readHopV55PropertyAdviceAnswerRecordV3(value: unknown): HopV55PropertyAdviceRecordV3Read<HopV55PropertyAdviceAnswerRecordV3> {
  if (isRow(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-answer-record-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format d’enveloppe de réponse différent de V3 conservé sans conversion.' };
  }
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT) throw new Error('Enveloppe de réponse V3 invalide.');
  const nested = readHopPropertyAdviceAnswerV3(value.answerSnapshot);
  if (nested.status === 'readOnly') {
    assertAnswerRecordV3(value as unknown as HopV55PropertyAdviceAnswerRecordV3);
    return { status: 'readOnly', record: clone(value) as unknown as HopV55PropertyAdviceAnswerRecordV3 };
  }
  if (nested.status === 'legacyReadOnly') {
    assertAnswerRecordV3Outer(value as unknown as HopV55PropertyAdviceAnswerRecordV3, false);
    return { status: 'unsupportedReadOnly', snapshot: clone(value),
      reason: `Réponse de domaine ${nested.version.toUpperCase()} dans une enveloppe V3 conservée sans promotion.` };
  }
  assertAnswerRecordV3Outer(value as unknown as HopV55PropertyAdviceAnswerRecordV3, false);
  return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: nested.reason };
}

export function readHopV55PropertyAdviceDossierRecordV3(value: unknown): HopV55PropertyAdviceRecordV3Read<HopV55PropertyAdviceDossierRecordV3> {
  if (isRow(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-dossier-record-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format d’enveloppe de dossier différent de V3 conservé sans conversion.' };
  }
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT) throw new Error('Enveloppe de dossier V3 invalide.');
  const nested = readHopPropertyAdviceDossierV3(value.dossierSnapshot);
  if (nested.status === 'readOnly') {
    assertDossierRecordV3(value as unknown as HopV55PropertyAdviceDossierRecordV3);
    return { status: 'readOnly', record: clone(value) as unknown as HopV55PropertyAdviceDossierRecordV3 };
  }
  if (nested.status === 'legacyReadOnly') {
    assertDossierRecordV3Outer(value as unknown as HopV55PropertyAdviceDossierRecordV3, false);
    return { status: 'unsupportedReadOnly', snapshot: clone(value),
      reason: `Dossier de domaine ${nested.version.toUpperCase()} dans une enveloppe V3 conservé sans promotion.` };
  }
  assertDossierRecordV3Outer(value as unknown as HopV55PropertyAdviceDossierRecordV3, false);
  return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: nested.reason };
}
