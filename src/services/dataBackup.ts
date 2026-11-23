import { FirestoreRepo } from './firestoreRepo';
import { BUSINESS_COLLECTIONS, IMMUTABLE_COLLECTIONS, BusinessCollection } from '../../functions/src/dataSchema';
import { BreweryBackup, parseBackup } from '../../functions/src/backupCore';
import { paymentGuardFromRegister } from '../../functions/src/financePaymentGuard';

export { parseBackup };
export function deviceBackup(): string {
  const collections = Object.fromEntries(BUSINESS_COLLECTIONS.map(name => [name,
    FirestoreRepo.all<any>(name).map(({ __docId, ...data }) => ({ id: __docId, data }))
  ]));
  return JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: new Date().toISOString(), collections } satisfies BreweryBackup);
}
const hash = async (json: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json))))
  .map(b => b.toString(16).padStart(2, '0')).join('');
export async function exportConfirmedBackup(): Promise<string> {
  const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
  await FirestoreRepo.waitForWrites();
  const { data } = await httpsCallable<void, { json: string; sha256: string }>(functions, 'exportBreweryData', { timeout: 120000 })();
  if (await hash(data.json) !== data.sha256) throw new Error('La copie reçue est incomplète. Relance l’export.');
  parseBackup(data.json);
  return data.json;
}
export function restoreBackup(json: string): Promise<{ changed: number; journalsPreserved: number; complete: boolean }> {
  const backup = parseBackup(json); // synchronous validation for all callers
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('dev-local')) {
    const writes: Array<{ col: BusinessCollection; id: string; data: Record<string, any> }> = [];
    for (const [name, rows] of Object.entries(backup.collections)) for (const row of rows ?? []) {
      // Server-only AI history is restored by the callable, never through browser writes.
      if (!(BUSINESS_COLLECTIONS as readonly string[]).includes(name)) continue;
      const col = name as BusinessCollection;
      const current = FirestoreRepo.all<any>(col).find(d => d.__docId === row.id || d.id === row.id);
      if (current && (IMMUTABLE_COLLECTIONS.has(col) || col === 'financialClosings' && current.report || col === 'transactions' && current.finance?.voidedAt)) continue;
      writes.push({ col, id: row.id, data: row.data });
    }
    const transactions = new Map(FirestoreRepo.all<any>('transactions').map(t => [t.id, t]));
    const payments = new Map(FirestoreRepo.all<any>('financialPayments').map(p => [p.id, p]));
    const affected = new Set<string>();
    writes.forEach(write => {
      if (write.col === 'transactions') { transactions.set(write.id, write.data); affected.add(write.id); }
      if (write.col === 'financialPayments') { payments.set(write.id, write.data); affected.add(write.data.transactionId); }
    });
    for (const id of affected) {
      const transaction = transactions.get(id);
      if (!transaction) throw new Error(`Le paiement restauré n’a pas de pièce ${id}.`);
      const guard = paymentGuardFromRegister(transaction, [...payments.values()]);
      if (transaction.finance?.voidedAt) continue;
      const pending = writes.find(w => w.col === 'transactions' && w.id === id);
      if (pending) pending.data = { ...pending.data, ...guard };
      else writes.push({ col: 'transactions', id, data: { ...transaction, ...guard } });
    }
    writes.forEach(write => FirestoreRepo.put(write.col, write.id, write.data));
    return Promise.resolve({ changed: writes.length, journalsPreserved: 0, complete: true });
  }
  return (async () => {
    const [{ httpsCallable }, { auth, functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
    await FirestoreRepo.waitForWrites();
    // Keep the id after a timeout: retrying the same file cannot replay stock/config changes.
    const key = `restore-operation-${auth.currentUser?.uid}-${await hash(json)}`;
    let operationId = localStorage.getItem(key);
    if (!operationId) { operationId = crypto.randomUUID(); localStorage.setItem(key, operationId); }
    const result = await httpsCallable<{ json: string; operationId: string }, { changed: number; journalsPreserved: number; complete: boolean }>(functions, 'restoreBreweryData', { timeout: 120000 })({ json, operationId });
    if (!result.data.complete) throw new Error('Restauration incomplète. Réimporte le même fichier pour reprendre.');
    localStorage.removeItem(key);
    return result.data;
  })();
}
