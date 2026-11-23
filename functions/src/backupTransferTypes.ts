/** Each HTTP request and Firestore write group stays bounded; the archive has no global size limit. */
export const BACKUP_PAGE_BYTES = 3_000_000;
export const BACKUP_PAGE_DOCUMENTS = 100;
export const BACKUP_FINANCE_GROUP_PAYMENTS = 400;
export type BackupTransferPhase = 'uploading' | 'validating' | 'ready' | 'applying' | 'complete';
export type BackupTransferRequest =
  | { action: 'startExport' }
  | { action: 'exportPage'; sessionId: string; pageIndex: number }
  | { action: 'startRestore'; operationId: string; pageCount: number; totalDocuments: number; exportedAt: string; digest: string }
  | { action: 'uploadRestorePage'; sessionId: string; pageIndex: number; json: string; sha256: string }
  | { action: 'validateRestore' | 'applyRestore'; sessionId: string };
export interface BackupExportSession { sessionId: string; exportedAt: string; expiresAt: string; pageBytes: number; pageDocuments: number }
export interface BackupExportPage { pageIndex: number; json: string; sha256: string; done: boolean; documents: number; totalDocuments: number }
export interface BackupRestoreProgress {
  sessionId: string; phase: BackupTransferPhase; nextPageIndex: number; checked: number;
  processed: number; totalDocuments: number; changed: number; journalsPreserved: number; operationalPreserved: number;
}
