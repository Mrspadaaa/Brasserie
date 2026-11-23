import type { FinancialArchive } from '../domain/finance/types';
import { archiveIndex } from '../domain/finance/archive';
import { todayISO } from '../domain/finance/ledger';
import { assertFinancialArchive } from '../../functions/src/financialArchiveCore';
import { FirestoreRepo, DocumentWriteError } from './firestoreRepo';
import { StorageService } from './storage';

type ArchiveOperation = { record: FinancialArchive; promise?: Promise<FinancialArchive> };
// A timeout leaves this intent intact: the next click verifies it instead of replaying it.
const pending = new Map<string, ArchiveOperation>();
const clean = ({ __docId, ...record }: FinancialArchive & { __docId?: string }): FinancialArchive => record;

async function confirm(key: string, operation: ArchiveOperation): Promise<FinancialArchive> {
  const record = operation.record;
  try {
    const confirmed = await FirestoreRepo.waitForDocument<FinancialArchive>('financialArchives', record.id, 15000,
      value => value.operationId === record.operationId && value.year === record.year && value.status === record.status && value.updatedAt === record.updatedAt && value.archivedAt === record.archivedAt);
    assertFinancialArchive(confirmed);
    if (pending.get(key) === operation) pending.delete(key);
    return clean(confirmed);
  } catch (error) {
    if (error instanceof DocumentWriteError && error.path === `financialArchives/${record.id}`) {
      if (error.status === 'rejected') {
        // This exact creation was refused and its absence was confirmed by the server.
        if (pending.get(key) === operation) pending.delete(key);
      } else if (error.status === 'conflict') {
        // Updates can be refused while the older policy still exists; that is a real retry,
        // unlike a timeout. A competing confirmed policy also requires a new explicit intent.
        const state = FirestoreRepo.documentWriteState('financialArchives', record.id);
        const refused = state.status === 'rejected' && state.operationId === error.operationId;
        if (pending.get(key) === operation) pending.delete(key);
        await FirestoreRepo.refreshDocument('financialArchives', record.id).catch(() => false);
        throw new Error(refused
          ? 'La modification de l’archive a été refusée. L’état précédent est conservé ; tu peux réessayer.'
          : 'L’état de cet exercice a changé sur un autre appareil. Vérifie son état puis relance ton choix.');
      }
    }
    throw error;
  } finally { operation.promise = undefined; }
}

export const FinancialArchiveService = {
  getArchives(): FinancialArchive[] {
    return [...archiveIndex(FirestoreRepo.all<FinancialArchive>('financialArchives').map(clean)).values()];
  },

  async setYearArchived(year: number, archived: boolean): Promise<FinancialArchive> {
    if (!Number.isInteger(year) || year < 1900 || year > 2200 || typeof archived !== 'boolean') throw new Error('Choisis un exercice valide, entre 1900 et 2200.');
    if (archived && year >= Number(todayISO().slice(0, 4))) throw new Error('Seuls les exercices terminés peuvent être archivés.');
    const session = FirestoreRepo.syncSession();
    const key = `${session}:${year}`;
    // A new authenticated session must not inherit a previous account's pending intent.
    for (const oldKey of pending.keys()) if (!oldKey.startsWith(`${session}:`)) pending.delete(oldKey);
    let operation = pending.get(key);
    if (operation) {
      if ((operation.record.status === 'archived') !== archived) throw new Error('Une modification de cet exercice attend sa confirmation. Vérifie cette modification avant de changer de choix.');
      if (operation.promise) return operation.promise;
    } else {
      const at = new Date().toISOString();
      const operationId = `${String(Date.parse(at)).padStart(14, '0')}-000000-${crypto.randomUUID()}`;
      const record: FinancialArchive = { id: `ARCHIVE-${year}`, year, status: archived ? 'archived' : 'open', updatedAt: at, operationId, ...(archived ? { archivedAt: at } : {}) };
      assertFinancialArchive(record);
      const audit = {
        id: `LOG-${record.operationId}`, timestamp: new Date(at).toLocaleString('fr-CH', { timeZone: 'Europe/Zurich' }),
        user: StorageService.getCurrentUser(), action: archived ? 'Archivage' : 'Restauration', category: 'Finances', entityId: record.id,
        summary: archived ? `Exercice ${year} rangé dans les archives` : `Exercice ${year} remis dans le journal courant`,
        operationId: record.operationId,
        details: 'Classement réversible. Les pièces, paiements, stocks et rapports restent conservés.'
      };
      operation = { record };
      pending.set(key, operation);
      // Both documents share a single Firestore batch; no original business row is changed.
      FirestoreRepo.put('financialArchives', record.id, record);
      FirestoreRepo.put('auditLogs', audit.id, audit);
    }
    operation.promise = confirm(key, operation);
    return operation.promise;
  }
};
