import type { HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { readHopV55DocumentaryAnswerRecord } from '../../services/hopV55/documentaryRecords';
import type { HopV55PropertyAdviceAnswerRecordV3 } from '../../services/hopV55/propertyAdviceRecordsV3';

type AccessScope = keyof HopPropertyAdviceRequestV3['context']['access'];
export type PropertyAdviceContextProvenance =
  | { kind: 'initial' }
  | { kind: 'unavailable' }
  | { kind: 'reexamined'; recordedAt: string; unknownAccesses: AccessScope[] };

/** Follow the displayed record's exact revision links; never inspect its free text or the live context. */
export function propertyAdviceContextProvenance(
  displayed: HopV55PropertyAdviceAnswerRecordV3,
  records: readonly unknown[],
): PropertyAdviceContextProvenance {
  const visited = new Set<string>();
  let current = displayed;
  while (!visited.has(current.reference)) {
    visited.add(current.reference);
    if (current.reexaminationContext) {
      const access = displayed.answerSnapshot.requestSnapshot.context.access;
      return { kind: 'reexamined', recordedAt: current.reexaminationContext.recordedAt,
        unknownAccesses: (Object.keys(access) as AccessScope[]).filter(scope => access[scope].state === 'unknown') };
    }
    if (!current.revisionContext) return { kind: 'initial' };
    const link = current.revisionContext;
    let parent: HopV55PropertyAdviceAnswerRecordV3 | undefined;
    for (const raw of records) {
      const read = readHopV55DocumentaryAnswerRecord(raw);
      if (read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v3'
        && read.record.reference === link.sourceAnswerRecordReference) {
        parent = read.record; break;
      }
    }
    if (!parent || parent.answerReference !== link.sourceAnswerReference
      || parent.ownerKey !== displayed.ownerKey || parent.workspaceId !== displayed.workspaceId
      || parent.sourceReadingReference !== displayed.sourceReadingReference) return { kind: 'unavailable' };
    current = parent;
  }
  return { kind: 'unavailable' };
}
