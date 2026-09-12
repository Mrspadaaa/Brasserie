import { createHash } from 'node:crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BACKUP_COLLECTIONS as BUSINESS_COLLECTIONS, IMMUTABLE_COLLECTIONS, BackupCollection as BusinessCollection } from './dataSchema.js';
import { BreweryBackup, parseBackup, preserveOperationalState, stableJson } from './backupCore.js';
import { requireBrewer } from './brewSession.js';
import { paymentGuardFromRegister } from './financePaymentGuard.js';

const options = { region: 'europe-west6', timeoutSeconds: 120, memory: '512MiB' as const, maxInstances: 2 };
export const exportBreweryData = onCall(options, async request => {
  requireBrewer(request);
  const db = getFirestore();
  // All collections are read at the same database snapshot, including complete registers.
  const collections = await db.runTransaction(async tx => {
    const snapshots = await Promise.all(BUSINESS_COLLECTIONS.map(c => tx.get(db.collection(c))));
    return Object.fromEntries(snapshots.map((s, i) => [BUSINESS_COLLECTIONS[i], s.docs.map(d => ({ id: d.id, data: d.data() }))]));
  }, { readOnly: true });
  if (collections.financeDocuments.some((row: { data: Record<string, unknown> }) => row.data.provider === 'google-drive')) throw new HttpsError('failed-precondition', 'Utilise les volumes ZIP dans Paramètres → Sauvegardes pour inclure les originaux de Drive.');
  const backup: BreweryBackup = { schemaVersion: 3, source: 'server', exportedAt: new Date().toISOString(), collections };
  const json = JSON.stringify(backup);
  if (Buffer.byteLength(json) > 8_000_000) throw new HttpsError('resource-exhausted', 'Utilise les volumes ZIP dans Paramètres → Sauvegardes pour cette base de plus de 8 Mo.');
  return { json, sha256: createHash('sha256').update(json).digest('hex') };
});

export const restoreBreweryData = onCall(options, async request => {
  const uid = requireBrewer(request);
  const { json, operationId } = request.data ?? {};
  if (typeof operationId !== 'string' || !/^[\w-]{16,100}$/.test(operationId)) throw new HttpsError('invalid-argument', 'Identifiant de restauration invalide.');
  let backup: BreweryBackup;
  try { backup = parseBackup(json); }
  catch (err) { throw new HttpsError('invalid-argument', (err as Error).message); }
  if (backup.collections.financeDocuments?.length) throw new HttpsError('failed-precondition', 'Cette sauvegarde contient des originaux. Importe-la depuis Paramètres → Sauvegardes pour les restaurer sur Drive avec vérification.');
  const db = getFirestore(), digest = createHash('sha256').update(json).digest('hex');
  const receipt = db.doc(`restoreOperations/${uid}-${operationId}`);
  const entries = Object.entries(backup.collections).flatMap(([collection, rows]) => (rows ?? []).map(row => ({ ...row, collection: collection as BusinessCollection })));
  const isImmutable = (e: typeof entries[number]) => IMMUTABLE_COLLECTIONS.has(e.collection) || e.collection === 'financialClosings' && !!e.data.report;
  const mutable = entries.filter(e => !isImmutable(e));
  const immutable = entries.filter(isImmutable);
  const core = await db.runTransaction(async tx => {
    const seen = await tx.get(receipt);
    if (seen.exists) {
      if (seen.data()!.digest !== digest) throw new HttpsError('already-exists', 'Cet identifiant correspond à un autre fichier.');
      return seen.data()!;
    }
    const current = mutable.length ? await tx.getAll(...mutable.map(e => db.doc(`${e.collection}/${e.id}`))) : [];
    // Existing payment IDs win over an older backup. Reserve their combined net
    // balance before restoring immutable rows, so an interrupted restore cannot
    // reopen capacity for a concurrent payment or void.
    const incomingPayments = entries.filter(e => e.collection === 'financialPayments');
    const financialIds = [...new Set([...mutable.filter(e => e.collection === 'transactions').map(e => e.id), ...incomingPayments.map(e => e.data.transactionId)])];
    if (financialIds.some(id => typeof id !== 'string' || !id || id.includes('/'))) throw new HttpsError('invalid-argument', 'Chaque paiement doit référencer une pièce valide.');
    const paymentSnapshot = financialIds.length ? await tx.get(db.collection('financialPayments')) : null;
    const paymentRows = new Map<string, Record<string, any>>((paymentSnapshot?.docs ?? []).map(d => [d.id, d.data()]));
    incomingPayments.forEach(entry => { if (!paymentRows.has(entry.id)) paymentRows.set(entry.id, entry.data); });
    const financialCurrent = financialIds.length ? await tx.getAll(...financialIds.map(id => db.doc(`transactions/${id}`))) : [];
    const guards = new Map<string, { settlementBalanceCents: number; lastPaymentId: string }>();
    financialIds.forEach((id, index) => {
      const old = financialCurrent[index].data();
      const incoming = mutable.find(e => e.collection === 'transactions' && e.id === id)?.data;
      const data = old?.finance?.voidedAt ? old : incoming ?? old;
      if (!data) throw new HttpsError('failed-precondition', `Le paiement restauré n’a pas de pièce ${id}.`);
      try { guards.set(id, paymentGuardFromRegister(data, [...paymentRows.values()])); }
      catch (error) { throw new HttpsError('failed-precondition', (error as Error).message); }
    });
    const writes: Array<{ path: string; data: Record<string, any> }> = [];
    let journalsPreserved = 0, operationalPreserved = 0;
    mutable.forEach((entry, i) => {
      const data = { ...entry.data }, old = current[i].data();
      // Restoring an older draft must not replace the frozen annual statement.
      if (entry.collection === 'financialClosings' && old?.report) return;
      // An old backup cannot reactivate a cancelled accounting document.
      if (entry.collection === 'transactions' && old?.finance?.voidedAt) return;
      if (entry.collection === 'transactions') Object.assign(data, guards.get(entry.id));
      if (preserveOperationalState(entry.collection, old)) { operationalPreserved++; if (entry.collection === 'batches' && old?.brewDay) journalsPreserved++; return; }
      // Restoring a recipe or lot must never rewind a live day's measurements and timers.
      if (entry.collection === 'batches') {
        if (data.brewDay) data.brewDay = { ...data.brewDay, restoredFromBackup: true };
      }
      if (stableJson(old) !== stableJson(data)) writes.push({ path: `${entry.collection}/${entry.id}`, data });
    });
    financialIds.forEach((id, index) => {
      if (mutable.some(e => e.collection === 'transactions' && e.id === id)) return;
      const old = financialCurrent[index].data()!;
      if (old.finance?.voidedAt) return;
      const data = { ...old, ...guards.get(id) };
      if (stableJson(old) !== stableJson(data)) writes.push({ path: `transactions/${id}`, data });
    });
    if (writes.length > 440) throw new HttpsError('resource-exhausted', 'Plus de 440 fiches à restaurer : utilise la restauration Firestore. Aucune donnée n’a été modifiée.');
    for (const entry of writes) tx.set(db.doc(entry.path), entry.data);
    const result = { digest, changed: writes.length, journalsPreserved, operationalPreserved, complete: false, at: Timestamp.now(), expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000) };
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
  return { changed: core.changed, journalsPreserved: core.journalsPreserved, operationalPreserved: core.operationalPreserved ?? 0, complete: true };
});
