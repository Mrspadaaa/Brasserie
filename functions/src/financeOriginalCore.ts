/** Portable description: no OAuth credential or publicly shared URL is persisted. */
export interface DriveFinanceOriginal {
  id: string;
  provider: 'google-drive';
  driveFileId: string;
  sha256: string;
  bytes: number;
  mimeType: string;
  fileName: string;
  createdAt: string;
}
export const ORIGINAL_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export function isDriveFinanceOriginal(value: any): value is DriveFinanceOriginal {
  return value?.provider === 'google-drive' && typeof value.id === 'string' && /^[A-Za-z0-9-]{8,100}$/.test(value.id)
    && typeof value.driveFileId === 'string' && /^[A-Za-z0-9_-]{8,200}$/.test(value.driveFileId)
    && typeof value.sha256 === 'string' && /^[a-f0-9]{64}$/.test(value.sha256)
    && Number.isSafeInteger(value.bytes) && value.bytes > 0 && value.bytes <= 4 * 1024 * 1024
    && ORIGINAL_MIME_TYPES.includes(value.mimeType) && typeof value.fileName === 'string' && value.fileName.length > 0 && value.fileName.length <= 200
    && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt));
}
export function sameOriginalContent(a: Pick<DriveFinanceOriginal, 'sha256' | 'bytes' | 'mimeType'>, b: Pick<DriveFinanceOriginal, 'sha256' | 'bytes' | 'mimeType'>): boolean {
  return a.sha256 === b.sha256 && a.bytes === b.bytes && a.mimeType === b.mimeType;
}
/** Copy an allowlist, never a request object that could carry OAuth credentials. */
export function driveFinanceMetadata(reference: any, id: string, fileName: string, createdAt: string): DriveFinanceOriginal {
  return { id, provider: 'google-drive', driveFileId: reference?.driveFileId, sha256: reference?.sha256,
    bytes: reference?.bytes, mimeType: reference?.mimeType, fileName, createdAt };
}
