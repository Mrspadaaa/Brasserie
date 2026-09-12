/** Derived synchronization state. Business records remain the authoritative source. */
export const FINANCIAL_SYNC_COLLECTIONS = ['transactions', 'financialPayments'] as const;
export type FinancialSyncCollection = typeof FINANCIAL_SYNC_COLLECTIONS[number];
export interface FinancialSyncRow { collection: FinancialSyncCollection; id: string; data: Record<string, any> | null; version: string }
export interface FinancialSyncPage {
  rows: FinancialSyncRow[]; cursor: number; done: boolean; asOf: string;
  sessionId?: string; pageIndex?: number; reset?: boolean;
}
export const FINANCIAL_CACHE_MAX_AGE = 30 * 86400000;
export const FINANCIAL_SYNC_RETENTION = 35 * 86400000;
export const financialRowKey = (row: Pick<FinancialSyncRow, 'collection' | 'id'>) => `${row.collection}/${row.id}`;
export function validFinancialSyncRow(row: any): row is FinancialSyncRow {
  return row && FINANCIAL_SYNC_COLLECTIONS.includes(row.collection) && typeof row.id === 'string' && row.id.length > 0 && !row.id.includes('/') &&
    typeof row.version === 'string' && /^\d{12}-\d{9}$/.test(row.version) && (row.data === null || typeof row.data === 'object' && !Array.isArray(row.data));
}
