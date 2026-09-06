import { DriveService } from './driveService';
import { Transaction } from '../types';
import { StorageService } from './storage';

export interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  driveLink?: string;
  drivePath: string;
  error?: string;
}

export const GoogleDriveService = {
  // Storage keys for OAuth / Drive config
  TOKEN_KEY: 'laffinee_gdrive_access_token',
  ROOT_FOLDER_KEY: 'laffinee_gdrive_root_folder_id',

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setAccessToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token.trim());
  },

  clearAccessToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  isConnected(): boolean {
    const token = this.getAccessToken();
    return Boolean(token && token.length > 10);
  },

  getRootFolderId(): string | null {
    return localStorage.getItem(this.ROOT_FOLDER_KEY);
  },

  setRootFolderId(folderId: string) {
    localStorage.setItem(this.ROOT_FOLDER_KEY, folderId.trim());
  },

  /**
   * Uploads a file (base64 Data URL or Blob) to Google Drive v3 REST API
   */
  async uploadInvoiceFile(
    tx: Partial<Transaction>,
    fileDataUrl: string,
    mimeType: string = 'application/pdf'
  ): Promise<GoogleDriveUploadResult> {
    const drivePath = DriveService.generateDrivePath(tx);
    const fileName = DriveService.generateFileName(
      tx.date || '01.01.2026',
      tx.proofNotes || tx.description || 'Document',
      tx.amountTTC || tx.amountHT || 0,
      mimeType === 'application/pdf' ? 'pdf' : 'jpg'
    );

    const token = this.getAccessToken();

    // If no token, return path and simulate successful local drive readiness
    if (!token) {
      return {
        success: true,
        drivePath,
        driveLink: `https://drive.google.com/drive/search?q=${encodeURIComponent(fileName)}`
      };
    }

    try {
      // 1. Convert base64 Data URL to Blob
      const base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // 2. Prepare Multipart Body for Google Drive v3 API
      const metadata = {
        name: fileName,
        mimeType: mimeType,
        description: `Facture Brasserie L'Affinée — ${tx.description} (${tx.amountTTC} CHF)`,
        ...(this.getRootFolderId() ? { parents: [this.getRootFolderId()] } : {})
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          drivePath,
          error: `Google Drive Error (${res.status}): ${errText}`
        };
      }

      const driveFile = await res.json();
      return {
        success: true,
        fileId: driveFile.id,
        driveLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
        drivePath
      };
    } catch (err: any) {
      return {
        success: false,
        drivePath,
        error: err.message || 'Erreur de connexion Google Drive'
      };
    }
  }
};
