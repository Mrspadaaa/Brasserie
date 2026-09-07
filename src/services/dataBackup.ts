import { FirestoreRepo } from './firestoreRepo';
import { BUSINESS_COLLECTIONS, IMMUTABLE_COLLECTIONS, BusinessCollection } from '../../functions/src/dataSchema';
import { BreweryBackup, parseBackup } from '../../functions/src/backupCore';

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
    let changed = 0;
    for (const [name, rows] of Object.entries(backup.collections)) for (const row of rows ?? []) {
      // Server-only AI history is restored by the callable, never through browser writes.
      if (!(BUSINESS_COLLECTIONS as readonly string[]).includes(name)) continue;
      const col = name as BusinessCollection;
      if (IMMUTABLE_COLLECTIONS.has(col) && FirestoreRepo.all<any>(col).some(d => d.__docId === row.id)) continue;
      FirestoreRepo.put(col, row.id, row.data); changed++;
    }
    return Promise.resolve({ changed, journalsPreserved: 0, complete: true });
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
