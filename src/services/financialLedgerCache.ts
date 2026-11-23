import { FINANCIAL_CACHE_MAX_AGE, financialRowKey, validFinancialSyncRow, type FinancialSyncRow } from '../../functions/src/financialSyncTypes';

export interface CachedFinancialLedger {
  schemaVersion: 1; owner: string; complete: true; cursor: number; asOf: string; savedAt: number; rowCount: number; rows: FinancialSyncRow[];
}
const DB_NAME = 'laffinee-financial-ledger-v1';
function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(Error('Le cache local n’est pas disponible sur cet appareil.')); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('ledgers', { keyPath: 'owner' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? Error('Le cache local n’est pas accessible.'));
    request.onblocked = () => reject(Error('La mise à jour du cache attend la fermeture d’un autre onglet.'));
  });
}
export function validCachedFinancialLedger(value: any, owner: string, now = Date.now()): value is CachedFinancialLedger {
  if (!value || value.schemaVersion !== 1 || value.owner !== owner || value.complete !== true || !Number.isSafeInteger(value.cursor) || value.cursor < 0 ||
    typeof value.asOf !== 'string' || !Number.isFinite(Date.parse(value.asOf)) || !Number.isFinite(value.savedAt) || value.savedAt > now + 60000 || now - value.savedAt > FINANCIAL_CACHE_MAX_AGE || !Array.isArray(value.rows) || value.rowCount !== value.rows.length) return false;
  const ids = new Set<string>();
  return value.rows.every((row: any) => {
    if (!validFinancialSyncRow(row) || row.data === null || ids.has(financialRowKey(row))) return false;
    ids.add(financialRowKey(row)); return true;
  });
}
/** One IndexedDB transaction commits rows and their completeness/cursor together.
 * There is never a cursor pointing to half of a saved register. */
export async function readFinancialLedgerCache(owner: string): Promise<CachedFinancialLedger | null> {
  const database = await openCache();
  try {
    const value = await new Promise<any>((resolve, reject) => {
      const transaction = database.transaction('ledgers', 'readonly'), request = transaction.objectStore('ledgers').get(owner);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return validCachedFinancialLedger(value, owner) ? value : null;
  } finally { database.close(); }
}
export async function writeFinancialLedgerCache(value: CachedFinancialLedger): Promise<void> {
  if (!validCachedFinancialLedger(value, value.owner)) throw Error('Le registre comptable ne peut pas être mis en cache : données incomplètes.');
  const database = await openCache();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('ledgers', 'readwrite');
      transaction.objectStore('ledgers').put(value);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? Error('La mémoire de cet appareil est pleine.'));
    });
  } finally { database.close(); }
}
