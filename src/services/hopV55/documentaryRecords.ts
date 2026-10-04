import {
  readHopV55DocumentaryAnswerRecord as readV1Answer,
  readHopV55DocumentaryDossierRecord as readV1Dossier,
  type HopV55DocumentaryAnswerRecordV1,
  type HopV55DocumentaryDossierRecordV1,
} from './documentaryDecision';
import {
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT,
  HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT,
  readHopV55PropertyAdviceAnswerRecord,
  readHopV55PropertyAdviceDossierRecord,
  type HopV55PropertyAdviceAnswerRecordV2,
  type HopV55PropertyAdviceDossierRecordV2,
} from './propertyAdviceRecords';
import {
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT,
  HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT,
  readHopV55PropertyAdviceAnswerRecordV3,
  readHopV55PropertyAdviceDossierRecordV3,
  type HopV55PropertyAdviceAnswerRecordV3,
  type HopV55PropertyAdviceDossierRecordV3,
} from './propertyAdviceRecordsV3';
import {
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT,
  HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT,
  readHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceDossierRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceDossierRecordV4,
} from './propertyAdviceRecordsV4';

export interface HopV55DocumentaryUnknownRecord {
  format: string;
  readonly [key: string]: unknown;
}

export type HopV55DocumentaryAnswerRecord = HopV55DocumentaryAnswerRecordV1 | HopV55PropertyAdviceAnswerRecordV2
  | HopV55PropertyAdviceAnswerRecordV3 | HopV55PropertyAdviceAnswerRecordV4;
export type HopV55DocumentaryDossierRecord = HopV55DocumentaryDossierRecordV1 | HopV55PropertyAdviceDossierRecordV2
  | HopV55PropertyAdviceDossierRecordV3 | HopV55PropertyAdviceDossierRecordV4;
export type HopV55DocumentaryAnswerHistoryEntry = HopV55DocumentaryAnswerRecord | HopV55DocumentaryUnknownRecord;
export type HopV55DocumentaryDossierHistoryEntry = HopV55DocumentaryDossierRecord | HopV55DocumentaryUnknownRecord;

export type HopV55DocumentaryRecordRead<T> =
  | { status: 'readOnly'; version: 'v1' | 'v2' | 'v3' | 'v4'; record: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clone<T>(value: T): T { return structuredClone(value); }

function unsupported(value: unknown, kind: 'answer' | 'dossier'): { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  return { status: 'unsupportedReadOnly', snapshot: clone(value),
    reason: `Format futur de record documentaire ${kind} conservé sans conversion ni fallback.` };
}

/** Version dispatch occurs before either strict envelope reader; V1 bytes/read semantics stay untouched. */
export function readHopV55DocumentaryAnswerRecord(value: unknown): HopV55DocumentaryRecordRead<HopV55DocumentaryAnswerRecord> {
  if (isRecord(value) && typeof value.format === 'string') {
    if (value.format === 'hop-v55-documentary-answer-record-v1') {
      const read = readV1Answer(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v1', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_FORMAT) {
      const read = readHopV55PropertyAdviceAnswerRecord(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v2', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT) {
      const read = readHopV55PropertyAdviceAnswerRecordV3(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v3', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format === HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT) {
      const read = readHopV55PropertyAdviceAnswerRecordV4(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v4', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format.startsWith('hop-v55-documentary-answer-record-')) return unsupported(value, 'answer');
  }
  throw new Error('Enveloppe de réponse documentaire invalide.');
}

/** V1 dossier snapshots remain bound to V1 Answer records; V2 keeps its strategy-specific DTO. */
export function readHopV55DocumentaryDossierRecord(value: unknown): HopV55DocumentaryRecordRead<HopV55DocumentaryDossierRecord> {
  if (isRecord(value) && typeof value.format === 'string') {
    if (value.format === 'hop-v55-documentary-dossier-record-v1') {
      const read = readV1Dossier(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v1', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format === HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_FORMAT) {
      const read = readHopV55PropertyAdviceDossierRecord(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v2', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format === HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V3_FORMAT) {
      const read = readHopV55PropertyAdviceDossierRecordV3(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v3', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format === HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT) {
      const read = readHopV55PropertyAdviceDossierRecordV4(value);
      return read.status === 'readOnly'
        ? { status: 'readOnly', version: 'v4', record: read.record }
        : { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    }
    if (value.format.startsWith('hop-v55-documentary-dossier-record-')) return unsupported(value, 'dossier');
  }
  throw new Error('Enveloppe de dossier documentaire invalide.');
}
