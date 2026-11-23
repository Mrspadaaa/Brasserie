import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';
import { rescheduleBatchPatch } from '../domain/batchSchedule';
import type { Batch } from '../types';

/** A planning edit must not overwrite a journal started on another device. */
export async function saveBatchSchedule(batch: Batch, date: string, saveLocal: (batch: Batch) => void): Promise<Batch> {
  const patch = rescheduleBatchPatch(batch, date);
  const preview = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('preview');
  if (!auth?.currentUser || preview) {
    const updated = { ...batch, ...patch };
    saveLocal(updated);
    return updated;
  }
  const ref = doc(db, 'batches', batch.id);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ce brassin n’existe plus. Rouvre la liste des brassins.');
    const current = snapshot.data() as Batch;
    const next = rescheduleBatchPatch(current, date);
    transaction.update(ref, next);
    return { ...current, ...next, id: batch.id };
  });
}
