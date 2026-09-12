import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { FirebaseAuthService } from './firebaseAuth';
import { uploadDriveOriginal } from './driveFileStore';
type Source = { kind: 'document' | 'transaction'; id: string; fileName?: string };
type Original = { done: boolean; id: string; dataUrl: string; fileName: string; mimeType: string; year: number; sha256: string; bytes: number };
const call = async <T>(payload: Record<string, unknown>) => (await httpsCallable<Record<string, unknown>, T>(functions, 'migrateFinanceDocuments', { timeout: 120000 })(payload)).data;
export interface MigrationProgress { inspected: number; migrated: number; bytes: number; current: string; done: boolean }
/** No content or credential is persisted here. Re-running scans only the remaining
 * legacy originals, and stable upload IDs safely recover a lost acknowledgement. */
export async function migrateLegacyOriginals(onProgress: (value: MigrationProgress) => void, signal?: AbortSignal) {
  const state: MigrationProgress = { inspected: 0, migrated: 0, bytes: 0, current: '', done: false };
  const abort = () => { if (signal?.aborted) throw new DOMException('Migration mise en pause.', 'AbortError'); };
  for (const kind of ['document', 'transaction'] as const) {
    let after = '', done = false;
    while (!done) {
      abort();
      const page = await call<{ candidates: Source[]; after: string; done: boolean; inspected: number }>({ action: 'list', kind, after });
      state.inspected += page.inspected; onProgress({ ...state });
      for (const source of page.candidates) {
        abort(); state.current = source.fileName || 'Justificatif'; onProgress({ ...state });
        const original = await call<Original>({ action: 'read', source }); if (original.done) continue;
        const drive = await uploadDriveOriginal({ documentId: original.id, dataUrl: original.dataUrl, fileName: original.fileName, mimeType: original.mimeType, year: original.year, signal });
        if (drive.sha256 !== original.sha256 || drive.bytes !== original.bytes) throw Error('Le fichier envoyé ne correspond pas à l’original. La copie en base est conservée.');
        abort();
        const result = await call<{ migrated: boolean; bytes?: number }>({ action: 'migrate', source, driveOriginal: drive, driveAccessToken: await FirebaseAuthService.ensureDriveAccessToken() });
        if (result.migrated) { state.migrated++; state.bytes += result.bytes ?? original.bytes; }
        onProgress({ ...state });
      }
      after = page.after; done = page.done;
    }
  }
  state.current = ''; state.done = true; onProgress({ ...state }); return state;
}
