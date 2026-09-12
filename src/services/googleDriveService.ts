import { DriveService } from './driveService';
import { Transaction } from '../types';
import { FirebaseAuthService } from './firebaseAuth';
import { uploadDriveOriginal } from './driveFileStore';

export interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  driveLink?: string;
  drivePath: string;
  error?: string;
}

/** Compatibility for legacy receipt screens. Financial originals use
 * driveFileStore directly and persist their verified reference in Firestore. */
export const GoogleDriveService = {
  getAccessToken(): string | null {
    // Remove obsolete persisted credentials rather than ever reusing them.
    try { localStorage.removeItem('laffinee_gdrive_access_token'); } catch { /* Storage may be unavailable. */ }
    return FirebaseAuthService.getDriveAccessToken();
  },

  isConnected(): boolean { return Boolean(this.getAccessToken()); },

  async uploadInvoiceFile(
    tx: Partial<Transaction>,
    fileDataUrl: string,
    mimeType = 'application/pdf'
  ): Promise<GoogleDriveUploadResult> {
    this.getAccessToken(); // Remove obsolete local credentials; renewal happens in the store.
    const year = Number((tx.date || '').split('.')[2]) || new Date().getFullYear();
    const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = DriveService.generateFileName(tx.date || `01.01.${year}`, tx.proofNotes || tx.description || 'Document', tx.amountTTC || tx.amountHT || 0, ext);
    const drivePath = `L’Affinée/Justificatifs/${year}/${fileName}`;
    try {
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${tx.id || ''}\0${fileDataUrl}`));
      const documentId = `legacy-${[...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
      const uploaded = await uploadDriveOriginal({ documentId, dataUrl: fileDataUrl, mimeType, fileName, year });
      return { success: true, fileId: uploaded.driveFileId, driveLink: `https://drive.google.com/file/d/${uploaded.driveFileId}/view`, drivePath };
    } catch (cause) {
      return { success: false, drivePath, error: cause instanceof Error ? cause.message : 'Le justificatif n’a pas été envoyé à Google Drive.' };
    }
  }
};
