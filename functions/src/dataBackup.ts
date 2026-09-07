import { createHash } from 'node:crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BUSINESS_COLLECTIONS, IMMUTABLE_COLLECTIONS, BusinessCollection } from './dataSchema.js';
import { BreweryBackup, parseBackup, stableJson } from './backupCore.js';
import { requireBrewer } from './brewSession.js';

const options = { region: 'europe-west6', timeoutSeconds: 120, memory: '512MiB' as const, maxInstances: 2 };
export const exportBreweryData = onCall(options, async request => {
  requireBrewer(request);
  const db = getFirestore();
  // All collections are read at the same database snapshot, including complete registers.
  const collections = await db.runTransaction(async tx => {
    const snapshots = await Promise.all(BUSINESS_COLLECTIONS.map(c => tx.get(db.collection(c))));
    return Object.fromEntries(snapshots.map((s, i) => [BUSINESS_COLLECTIONS[i], s.docs.map(d => ({ id: d.id, data: d.data() }))]));
  }, { readOnly: true });
  const backup: BreweryBackup = { schemaVersion: 3, source: 'server', exportedAt: new Date().toISOString(), collections };
  const json = JSON.stringify(backup);
  if (Buffer.byteLength(json) > 8_000_000) throw new HttpsError('resource-exhausted', 'Utilise la sauvegarde Firestore pour cette base de plus de 8 Mo.');
  return { json, sha256: createHash('sha256').update(json).digest('hex') };
});

export const restoreBreweryData = onCall(options, async request => {
  const uid = requireBrewer(request);
  const { json, operationId } = request.data ?? {};
  if (typeof operationId !== 'string' || !/^[\w-]{16,100}$/.test(operationId)) throw new HttpsError('invalid-argument', 'Identifiant de restauration invalide.');
  let backup: BreweryBackup;
  try { backup = parseBackup(json); }
  catch (err) { throw new HttpsError('invalid-argument', (err as Error).message); }
  const db = getFirestore(), digest = createHash('sha256').update(json).digest('hex');
  const receipt = db.doc(`restoreOperations/${uid}-${operationId}`);
  const entries = Object.entries(backup.collections).flatMap(([collection, rows]) => (rows ?? []).map(row => ({ ...row, collection: collection as BusinessCollection })));
  const mutable = entries.filter(e => !IMMUTABLE_COLLECTIONS.has(e.collection));
  const immutable = entries.filter(e => IMMUTABLE_COLLECTIONS.has(e.collection));
  const core = await db.runTransaction(async tx => {
    const seen = await tx.get(receipt);
    if (seen.exists) {
      if (seen.data()!.digest !== digest) throw new HttpsError('already-exists', 'Cet identifiant correspond à un autre fichier.');
      return seen.data()!;
    }
    const current = mutable.length ? await tx.getAll(...mutable.map(e => db.doc(`${e.collection}/${e.id}`))) : [];
    const writes: Array<{ path: string; data: Record<string, any> }> = [];
    let journalsPreserved = 0;
    mutable.forEach((entry, i) => {
      const data = { ...entry.data }, old = current[i].data();
      // Restoring a recipe or lot must never rewind a live day's measurements and timers.
      if (entry.collection === 'batches') {
        if (old?.brewDay) { data.brewDay = old.brewDay; journalsPreserved++; }
        else if (data.brewDay) data.brewDay = { ...data.brewDay, restoredFromBackup: true };
      }
      if (stableJson(old) !== stableJson(data)) writes.push({ path: `${entry.collection}/${entry.id}`, data });
    });
    if (writes.length > 440) throw new HttpsError('resource-exhausted', 'Plus de 440 fiches à restaurer : utilise la restauration Firestore. Aucune donnée n’a été modifiée.');
    for (const entry of writes) tx.set(db.doc(entry.path), entry.data);
    const result = { digest, changed: writes.length, journalsPreserved, complete: false, at: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000) };
    tx.create(receipt, result);
    return result;
  });
  if (!core.complete) {
    // Historical registers are append-only. Each chunk is retryable; existing IDs are untouched.
    for (let offset = 0; offset < immutable.length; offset += 400) {
      const chunk = immutable.slice(offset, offset + 400);
      await db.runTransaction(async tx => {
        const refs = chunk.map(e => db.doc(`${e.collection}/${e.id}`));
        const current = await tx.getAll(...refs);
        current.forEach((snap, i) => { if (!snap.exists) tx.create(refs[i], chunk[i].data); });
      });
    }
    await receipt.update({ complete: true, completedAt: Timestamp.now() });
  }
  return { changed: core.changed, journalsPreserved: core.journalsPreserved, complete: true };
});
