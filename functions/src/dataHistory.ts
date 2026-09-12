import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWrittenWithAuthContext } from 'firebase-functions/v2/firestore';
import { BUSINESS_COLLECTIONS } from './dataSchema.js';
import { stableJson } from './backupCore.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function originalMetadata(value: Record<string, any> | null) {
  if (!value) return null;
  const result: Record<string, string | number> = {};
  for (const key of ['id', 'documentId', 'fileName', 'mimeType', 'createdAt', 'provider', 'driveFileId', 'sha256']) {
    if (typeof value[key] === 'string') result[key] = value[key].slice(0, 200);
  }
  for (const key of ['index', 'chunkCount', 'length', 'bytes']) {
    if (Number.isSafeInteger(value[key]) && value[key] >= 0) result[key] = value[key];
  }
  if (typeof value.data === 'string') result.encodedLength = value.data.length;
  return result;
}
function withoutInlineOriginal(value: Record<string, any> | null) {
  if (!value || typeof value.proofUrl !== 'string' || !value.proofUrl.startsWith('data:')) return value;
  const { proofUrl, ...rest } = value;
  return { ...rest, originalProofHash: hash(proofUrl), originalProofEncodedLength: proofUrl.length };
}
/** Idempotent, server-observed history. It never watches its own collection. */
export const recordDataChange = onDocumentWrittenWithAuthContext({
  document: '{collection}/{documentId}', region: 'europe-west6', retry: true, maxInstances: 2
}, async event => {
  const collection = event.params.collection;
  if (!(BUSINESS_COLLECTIONS as readonly string[]).includes(collection) || ['auditLogs', 'movements'].includes(collection) || !event.data) return;
  const before = event.data.before.data() ?? null, after = event.data.after.data() ?? null;
  const beforeJson = stableJson(before), afterJson = stableJson(after);
  if (beforeJson === afterJson) return;
  const changedFields = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
    .filter(k => stableJson(before?.[k]) !== stableJson(after?.[k]));
  const isOriginal = collection === 'financeDocuments';
  const historyBefore = collection === 'transactions' ? withoutInlineOriginal(before) : before;
  const historyAfter = collection === 'transactions' ? withoutInlineOriginal(after) : after;
  const snapshotsIncluded = !isOriginal && Buffer.byteLength(stableJson(historyBefore)) + Buffer.byteLength(stableJson(historyAfter)) < 700_000;
  const data = {
    collection, documentId: event.params.documentId, eventId: event.id,
    action: before === null ? 'create' : after === null ? 'delete' : 'update',
    committedAt: event.data.after.updateTime?.toDate().toISOString() ?? event.time,
    recordedAt: new Date().toISOString(), authType: event.authType, authId: event.authId ?? null,
    changedFields, beforeHash: hash(beforeJson), afterHash: hash(afterJson),
    // Originals are immutable and backed up from financeDocuments. Copying their
    // 400 kB chunks here would store every invoice twice. Keep traceable hashes
    // and bounded metadata instead; existing history is never rewritten.
    snapshotsIncluded,
    ...(isOriginal ? { originalMetadata: { before: originalMetadata(before), after: originalMetadata(after) } }
      : snapshotsIncluded ? { before: historyBefore, after: historyAfter } : {})
  };
  const db = getFirestore(), id = hash(event.source + ':' + event.id);
  const batch = db.batch();
  batch.create(db.doc(`dataHistory/${id}`), data);
  if (collection === 'stockItems' && after && Number.isFinite(after.currentStock) &&
    (before?.currentStock !== after.currentStock || before?.unit !== after.unit)) {
    batch.create(db.doc(`movements/${id}`), {
      id, itemRef: event.params.documentId, sourceId: id, source: 'stock-document',
      ts: data.committedAt, beforeQty: before?.currentStock ?? 0, afterQty: after.currentStock,
      unit: after.unit ?? null, previousUnit: before?.unit ?? null,
      delta: !before || before.unit === after.unit ? after.currentStock - (before?.currentStock ?? 0) : null
    });
  }
  try { await batch.commit(); }
  catch (err) { if ((err as { code?: number }).code !== 6) throw err; }
});
