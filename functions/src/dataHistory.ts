import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWrittenWithAuthContext } from 'firebase-functions/v2/firestore';
import { BUSINESS_COLLECTIONS } from './dataSchema.js';
import { stableJson } from './backupCore.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
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
  const data = {
    collection, documentId: event.params.documentId, eventId: event.id,
    action: before === null ? 'create' : after === null ? 'delete' : 'update',
    committedAt: event.data.after.updateTime?.toDate().toISOString() ?? event.time,
    recordedAt: new Date().toISOString(), authType: event.authType, authId: event.authId ?? null,
    changedFields, beforeHash: hash(beforeJson), afterHash: hash(afterJson),
    // Large attachments remain in native backups; one history entry always fits in Firestore.
    snapshotsIncluded: Buffer.byteLength(beforeJson) + Buffer.byteLength(afterJson) < 700_000,
    ...(Buffer.byteLength(beforeJson) + Buffer.byteLength(afterJson) < 700_000 ? { before, after } : {})
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
