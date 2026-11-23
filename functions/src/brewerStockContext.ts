import type { Firestore } from 'firebase-admin/firestore';
import { pick } from './brewerContext.js';

/** Bounded read-only snapshot. A complete reservation set is never inferred
 * from a truncated list, and no balance is read outside this transaction. */
export async function readBrewerStockSnapshot(db: Firestore, batchId?: string) {
  return db.runTransaction(async transaction => {
    const [stock, reservations, batchDoc] = await Promise.all([
      transaction.get(db.collection('stockItems').limit(500)),
      transaction.get(db.collection('batches').limit(501)),
      batchId ? transaction.get(db.doc(`batches/${batchId}`)) : Promise.resolve(null)
    ]);
    return { stock, reservations, batchDoc, stockReservations: {
      complete: reservations.docs.length < 501,
      source: 'firestoreReadOnlyTransaction' as const,
      batches: reservations.docs.slice(0, 500).map(d => pick({ ...d.data(), id: d.id,
        stockConsumption: d.data().stockConsumption ?? null }, ['id', 'status', 'stockConsumption']))
    } };
  }, { readOnly: true });
}
