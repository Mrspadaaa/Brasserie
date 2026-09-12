import type { FinanceTransaction, FinancialArchive } from './types';
import { isoDate } from './ledger';
import { assertFinancialArchive, isArchiveTimestamp } from '../../../functions/src/financialArchiveCore';

export function archiveIndex(records: FinancialArchive[]): Map<number, FinancialArchive> {
  const index = new Map<number, FinancialArchive>();
  for (const record of records) {
    try { assertFinancialArchive(record); } catch { continue; }
    const previous = index.get(record.year);
    if (!previous || Date.parse(record.updatedAt) > Date.parse(previous.updatedAt) || Date.parse(record.updatedAt) === Date.parse(previous.updatedAt) && record.operationId > previous.operationId) index.set(record.year, record);
  }
  return index;
}
export function isTransactionArchived(transaction: FinanceTransaction, index: ReadonlyMap<number, FinancialArchive>): boolean {
  const date = isoDate(transaction.date);
  if (!date) return false;
  const archive = index.get(Number(date.slice(0, 4)));
  if (!archive || archive.status !== 'archived' || !archive.archivedAt) return false;
  const recorded = transaction.finance?.recordedAt;
  if (recorded == null) return true;
  if (!isArchiveTimestamp(recorded)) return false;
  const recordedAt = Date.parse(recorded), cutoff = Date.parse(archive.archivedAt);
  return Number.isFinite(recordedAt) && Number.isFinite(cutoff) && recordedAt <= cutoff;
}
