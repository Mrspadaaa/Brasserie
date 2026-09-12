import { createHash, randomUUID } from 'node:crypto';
import { getFirestore, Timestamp, FieldPath, type DocumentSnapshot } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { requireBrewer } from './brewSession.js';
import { FINANCIAL_SYNC_COLLECTIONS, FINANCIAL_SYNC_RETENTION, type FinancialSyncCollection, type FinancialSyncPage, type FinancialSyncRow } from './financialSyncTypes.js';

const options = { region: 'europe-west6', timeoutSeconds: 120, memory: '512MiB' as const, maxInstances: 2 };
const SESSION_MS = 45 * 60000, PAGE_ROWS = 100, PAGE_BYTES = 2_000_000;
const version = (at: Timestamp) => `${String(at.seconds).padStart(12, '0')}-${String(at.nanoseconds).padStart(9, '0')}`;
const eventVersion = (time: string) => {
  // Deleted snapshots have no updateTime. CloudEvent time preserves nanoseconds;
  // Date alone truncates them and could discard a deletion in the same ms.
  const seconds = Math.floor(Date.parse(time) / 1000);
  const fraction = /\.(\d{1,9})Z$/.exec(time)?.[1] ?? '';
  if (!Number.isSafeInteger(seconds) || seconds < 0) throw Error('Date d’événement comptable invalide.');
  return `${String(seconds).padStart(12, '0')}-${fraction.padEnd(9, '0')}`;
};
const row = (name: FinancialSyncCollection, snap: DocumentSnapshot, at: Timestamp): FinancialSyncRow => ({ collection: name, id: snap.id, data: snap.data() ?? null, version: version(snap.updateTime ?? at) });
const invalid = (message: string): never => { throw new HttpsError('invalid-argument', message); };

/** A compact invalidation journal, never a second copy of an invoice or PDF. */
export async function recordFinancialChange(name: FinancialSyncCollection, event: any): Promise<void> {
  if (!event.data) return;
  const before = event.data.before.data(), after = event.data.after.data();
  if (!before && !after) return;
  const sourceVersion = event.data.after.updateTime ? version(event.data.after.updateTime) : eventVersion(event.time);
  const db = getFirestore(), sourceId = event.params.documentId;
  const versionRef = db.doc(`financialSyncVersions/${createHash('sha256').update(`${name}/${sourceId}`).digest('hex')}`);
  const headRef = db.doc('financialSync/state');
  await db.runTransaction(async tx => {
    const [seen, head] = await Promise.all([tx.get(versionRef), tx.get(headRef)]);
    // Firestore events can arrive out of order or more than once. A newer source
    // version already invalidated this path, so an old delivery is redundant.
    if (seen.exists && String(seen.data()!.version) >= sourceVersion) return;
    const revision = (Number(head.data()?.revision) || 0) + 1;
    if (!Number.isSafeInteger(revision)) throw new Error('Révision de synchronisation hors limites.');
    const at = Timestamp.now();
    tx.set(headRef, { schemaVersion: 1, revision, updatedAt: at });
    tx.set(versionRef, { collection: name, documentId: sourceId, version: sourceVersion });
    tx.create(db.doc(`financialSyncEvents/${String(revision).padStart(16, '0')}`), {
      revision, collection: name, documentId: sourceId, version: sourceVersion,
      recordedAt: at, expiresAt: Timestamp.fromMillis(at.toMillis() + FINANCIAL_SYNC_RETENTION)
    });
  });
}
export const recordFinancialTransactionChange = onDocumentWritten({ document: 'transactions/{documentId}', region: 'europe-west6', retry: true, maxInstances: 2 }, event => recordFinancialChange('transactions', event));
export const recordFinancialPaymentChange = onDocumentWritten({ document: 'financialPayments/{documentId}', region: 'europe-west6', retry: true, maxInstances: 2 }, event => recordFinancialChange('financialPayments', event));

export const syncFinancialLedger = onCall(options, async request => {
  const uid = requireBrewer(request), db = getFirestore(), input = request.data ?? {};
  if (input.action === 'start') {
    const initial = await db.runTransaction(async tx => {
      const [head, probe] = await Promise.all([tx.get(db.doc('financialSync/state')), tx.get(db.collection('transactions').limit(1))]);
      return { cursor: Number(head.data()?.revision) || 0, readTime: probe.readTime };
    }, { readOnly: true });
    const sessionId = randomUUID();
    await db.doc(`financialSyncSessions/${sessionId}`).create({ uid, ...initial, pageIndex: 0, collectionIndex: 0, afterId: null, expiresAt: Timestamp.fromMillis(Date.now() + SESSION_MS) });
    return { sessionId, cursor: initial.cursor, asOf: initial.readTime.toDate().toISOString() };
  }
  if (input.action === 'page') {
    if (typeof input.sessionId !== 'string' || !/^[\w-]{16,80}$/.test(input.sessionId) || !Number.isSafeInteger(input.pageIndex) || input.pageIndex < 0) invalid('Page comptable invalide.');
    const ref = db.doc(`financialSyncSessions/${input.sessionId}`), sessionSnap = await ref.get(), session = sessionSnap.data();
    if (!session || session.uid !== uid || session.expiresAt.toMillis() <= Date.now()) throw new HttpsError('failed-precondition', 'La première synchronisation a expiré. Recommence son chargement.');
    // The immutable readTime makes every page retry deterministic. Client
    // cursors are validated below and never authorize any database mutation.
    const collectionIndex = Number(input.collectionIndex ?? session.collectionIndex), afterId = input.afterId ?? null;
    if (!Number.isInteger(collectionIndex) || collectionIndex < 0 || collectionIndex >= FINANCIAL_SYNC_COLLECTIONS.length || afterId !== null && (typeof afterId !== 'string' || afterId.includes('/'))) invalid('Curseur comptable invalide.');
    const name = FINANCIAL_SYNC_COLLECTIONS[collectionIndex];
    let source = db.collection(name).orderBy(FieldPath.documentId()).limit(PAGE_ROWS);
    if (afterId) source = source.startAfter(afterId);
    const snap = await db.runTransaction(tx => tx.get(source), { readOnly: true, readTime: session.readTime });
    const rows: FinancialSyncRow[] = []; let bytes = 0;
    for (const document of snap.docs) {
      const entry = row(name, document, session.readTime), size = Buffer.byteLength(JSON.stringify(entry));
      if (rows.length && bytes + size > PAGE_BYTES) break;
      rows.push(entry); bytes += size;
    }
    const endCollection = rows.length === snap.docs.length && snap.docs.length < PAGE_ROWS;
    const nextCollection = endCollection ? collectionIndex + 1 : collectionIndex;
    return { rows, cursor: session.cursor, asOf: session.readTime.toDate().toISOString(), done: nextCollection >= FINANCIAL_SYNC_COLLECTIONS.length,
      sessionId: input.sessionId, pageIndex: input.pageIndex, nextCollectionIndex: nextCollection, nextAfterId: endCollection ? null : rows.at(-1)?.id ?? afterId };
  }
  if (input.action === 'delta') {
    const cursor = input.cursor;
    if (!Number.isSafeInteger(cursor) || cursor < 0) invalid('Révision comptable invalide.');
    return db.runTransaction(async tx => {
      const [head, events] = await Promise.all([
        tx.get(db.doc('financialSync/state')),
        tx.get(db.collection('financialSyncEvents').where('revision', '>', cursor).orderBy('revision').limit(25))
      ]);
      const revision = Number(head.data()?.revision) || 0, asOf = events.readTime.toDate().toISOString();
      const reset = (): FinancialSyncPage => ({ rows: [], cursor: revision, done: false, asOf, reset: true });
      if (cursor > revision) return reset();
      if (cursor === revision) return { rows: [], cursor, done: true, asOf } satisfies FinancialSyncPage;
      if (!events.docs.length || events.docs.some((item, i) => item.data().revision !== cursor + i + 1)) return reset();
      const changed = new Map<string, FinancialSyncCollection>();
      events.docs.forEach(item => { const event = item.data(); if (FINANCIAL_SYNC_COLLECTIONS.includes(event.collection)) changed.set(`${event.collection}/${event.documentId}`, event.collection); });
      const direct = await tx.getAll(...[...changed.keys()].map(path => db.doc(path)));
      const result = new Map<string, FinancialSyncRow>(), transactions = new Set<string>();
      direct.forEach(item => {
        const name = changed.get(item.ref.path)!; result.set(item.ref.path, row(name, item, events.readTime));
        if (name === 'transactions') transactions.add(item.id);
        if (name === 'financialPayments' && item.data()?.transactionId) transactions.add(item.data()!.transactionId);
      });
      // A payment and the balance guard are committed atomically by the app.
      // Read their whole group at this same snapshot even if the other trigger
      // is delivered later, so cash/debt never sees half of that commit.
      for (const id of transactions) {
        const [transaction, payments] = await Promise.all([tx.get(db.doc(`transactions/${id}`)), tx.get(db.collection('financialPayments').where('transactionId', '==', id))]);
        result.set(`transactions/${id}`, row('transactions', transaction, events.readTime));
        payments.docs.forEach(item => result.set(item.ref.path, row('financialPayments', item, events.readTime)));
      }
      const next = events.docs.at(-1)!.data().revision;
      return { rows: [...result.values()], cursor: next, done: next === revision, asOf } satisfies FinancialSyncPage;
    }, { readOnly: true });
  }
  return invalid('Action de synchronisation inconnue.');
});

export const cleanupFinancialSync = onSchedule({ schedule: 'every 24 hours', region: 'europe-west6', maxInstances: 1, timeoutSeconds: 120 }, async () => {
  const db = getFirestore();
  for (const name of ['financialSyncEvents', 'financialSyncSessions']) {
    for (let page = 0; page < 8; page++) {
      const expired = await db.collection(name).where('expiresAt', '<=', Timestamp.now()).limit(400).get();
      if (expired.empty) break;
      const batch = db.batch(); expired.docs.forEach(document => batch.delete(document.ref)); await batch.commit();
      if (expired.size < 400) break;
    }
  }
});
