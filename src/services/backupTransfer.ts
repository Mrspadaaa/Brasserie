import { parseBackup, type BreweryBackup, type BackupDocument } from '../../functions/src/backupCore';
import { BACKUP_PAGE_BYTES, BACKUP_VOLUME_BYTES, BACKUP_VOLUME_PAGES, BackupInventory, backupDocumentCount, backupHash, checkBackupAbort, createBackupVolume, readBackupVolume, splitLegacyBackup, type BackupPage, type BackupVolume, type BackupVolumeManifest } from './backupArchive';
import { getDriveOriginalBytes, uploadDriveOriginal, validateDriveOriginalReference, type DriveOriginalReference } from './driveFileStore';

export type { BackupVolume } from './backupArchive';
export interface BackupProgress { stage: string; message: string; completed?: number; total?: number }
type Progress = (progress: BackupProgress) => void;
export interface BackupExportSession {
  sessionId: string; exportedAt: string; expiresAt: string; finished: boolean;
  nextPageIndex: number; nextVolume: number; previousDigest: string | null; totalDocuments: number;
  pendingPages: BackupPage[]; pendingBytes: number; pendingDone: boolean;
  pendingTotalDocuments: number; inProgress: boolean;
  inventory: BackupInventory; invalid?: string;
  serverPageIndex: number; serverTotalDocuments: number; serverDone: boolean;
  sourceRows: ExportRow[]; sourceOffset: number; expandedRows: ExportRow[]; expandedOffset: number;
  pageCollections: BreweryBackup['collections']; pageBytes: number; pageDocuments: number;
  hydratedOriginals: Set<string>;
}
interface ExportRow { collection: string; row: BackupDocument }
interface SourceVolume { file: File; manifest: BackupVolumeManifest; digest: string }
export interface BackupInspection {
  exportedAt: string; volumeCount: number; documentCount: number; originalCount: number;
  source: 'archive' | 'legacy'; warnings: string[];
  digest: string; pageHashes: string[]; volumes: SourceVolume[]; legacyFile?: File;
}
let pendingExport: BackupExportSession | undefined;
const inspections = new WeakSet<BackupInspection>();
interface OriginalProof { fileName?: string; mimeType?: string; length?: number; chunks: Map<number, string> }
const inspectionOriginals = new WeakMap<BackupInspection, Map<string, OriginalProof>>();
const pendingRestorations = new Map<string, string>();
export const getPendingBackupExport = () => pendingExport;
async function transfer<T>(payload: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  checkBackupAbort(signal);
  const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
  checkBackupAbort(signal);
  const result = await httpsCallable<Record<string, unknown>, T>(functions, 'transferBreweryData', { timeout: 120000 })(payload);
  checkBackupAbort(signal); return result.data;
}
export async function startBackupExport(onProgress?: Progress, signal?: AbortSignal): Promise<BackupExportSession> {
  onProgress?.({ stage: 'preparing', message: 'Confirmation des dernières modifications…' });
  const { FirestoreRepo } = await import('./firestoreRepo'); await FirestoreRepo.waitForWrites(); checkBackupAbort(signal);
  const data = await transfer<{ sessionId: string; exportedAt: string; expiresAt: string }>({ action: 'startExport' }, signal);
  if (!data.sessionId || !Number.isFinite(Date.parse(data.exportedAt)) || !Number.isFinite(Date.parse(data.expiresAt))) throw Error('La session de sauvegarde reçue est invalide.');
  pendingExport = { ...data, finished: false, nextPageIndex: 0, nextVolume: 1, previousDigest: null, totalDocuments: 0, pendingPages: [], pendingBytes: 0, pendingDone: false, pendingTotalDocuments: 0, inProgress: false, inventory: new BackupInventory(), serverPageIndex: 0, serverTotalDocuments: 0, serverDone: false, sourceRows: [], sourceOffset: 0, expandedRows: [], expandedOffset: 0, pageCollections: {}, pageBytes: 0, pageDocuments: 0, hydratedOriginals: new Set() };
  return pendingExport;
}
async function flushExportPage(session: BackupExportSession) {
  if (!Object.keys(session.pageCollections).length) return;
  const json = JSON.stringify({ schemaVersion: 3, source: 'server', exportedAt: session.exportedAt, collections: session.pageCollections });
  const parsed = parseBackup(json);
  const bytes = new TextEncoder().encode(json).length;
  if (bytes > BACKUP_PAGE_BYTES || backupDocumentCount(parsed) > 100) throw Error('Page locale de sauvegarde trop volumineuse.');
  try { session.inventory.add(parsed); }
  catch (cause) { session.invalid = `La copie serveur contient une incohérence : ${(cause as Error).message} Corrige le point indiqué, puis commence une nouvelle sauvegarde.`; throw Error(session.invalid); }
  const sha256 = await backupHash(json);
  session.pendingPages.push({ pageIndex: session.nextPageIndex + session.pendingPages.length, json, sha256 });
  session.pendingBytes += bytes; session.pendingTotalDocuments += session.pageDocuments;
  session.pageCollections = {}; session.pageBytes = 0; session.pageDocuments = 0;
}

async function expandExportRow(entry: ExportRow, session: BackupExportSession, onProgress?: Progress, signal?: AbortSignal): Promise<ExportRow[]> {
  const { collection, row } = entry;
  if (collection !== 'financeDocuments') return [entry];
  // A migration can overlap the server snapshot. Its old binary chunks are not
  // needed once that snapshot contains the verified Drive metadata for the ID.
  if (typeof row.data.documentId === 'string' && session.hydratedOriginals.has(row.data.documentId)) return [];
  if (row.data.provider !== 'google-drive') return [entry];
  const createdAt = row.data.createdAt;
  if (!validateDriveOriginalReference(row.data)) throw Error(`Référence Drive invalide : ${row.data.fileName || row.id}.`);
  onProgress?.({ stage: 'downloading-original', message: `Copie du justificatif ${row.data.fileName} depuis Drive…` });
  const bytes = await getDriveOriginalBytes(row.data, signal);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 16_384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16_384));
  const source = `data:${row.data.mimeType};base64,${btoa(binary)}`;
  const parts = Array.from({ length: Math.ceil(source.length / 400_000) }, (_, index) => source.slice(index * 400_000, (index + 1) * 400_000));
  session.hydratedOriginals.add(row.id);
  // ZIPs contain the actual original, not a dependency on this Drive account.
  // Preserve the application document ID so frozen tax references remain valid.
  return [{ collection, row: { id: row.id, data: { id: row.id, fileName: row.data.fileName, mimeType: row.data.mimeType, chunkCount: parts.length, length: source.length, ...(createdAt ? { createdAt } : {}) } } },
    ...parts.map((data, index) => ({ collection, row: { id: `${row.id}-${index}`, data: { id: `${row.id}-${index}`, documentId: row.id, index, data } } }))];
}

export async function exportNextBackupVolume(session: BackupExportSession, onProgress?: Progress, signal?: AbortSignal): Promise<BackupVolume> {
  if (session.finished) throw Error('Tous les volumes de cette sauvegarde sont prêts.');
  if (session.invalid) throw Error(session.invalid);
  if (session.inProgress) throw Error('Un volume est déjà en cours de préparation.');
  session.inProgress = true;
  try {
    while (!session.pendingDone && session.pendingBytes < BACKUP_VOLUME_BYTES && session.pendingPages.length < BACKUP_VOLUME_PAGES) {
      checkBackupAbort(signal);
      if (Date.now() >= Date.parse(session.expiresAt)) throw Error('Cette copie serveur a expiré. Recommence une sauvegarde complète ; ne mélange pas les volumes de deux copies.');
      if (session.expandedOffset < session.expandedRows.length) {
        const { collection, row } = session.expandedRows[session.expandedOffset];
        const size = new TextEncoder().encode(JSON.stringify(row)).length + collection.length + 200;
        if (session.pageDocuments >= 100 || session.pageBytes + size > BACKUP_PAGE_BYTES - 1000) { await flushExportPage(session); continue; }
        ((session.pageCollections as any)[collection] ??= []).push(row);
        session.pageBytes += size; session.pageDocuments++; session.expandedOffset++;
        continue;
      }
      session.expandedRows = []; session.expandedOffset = 0;
      if (session.sourceOffset < session.sourceRows.length) {
        session.expandedRows = await expandExportRow(session.sourceRows[session.sourceOffset], session, onProgress, signal);
        // Advance only after the original has been downloaded and verified.
        session.sourceOffset++;
        continue;
      }
      if (Object.keys(session.pageCollections).length) { await flushExportPage(session); continue; }
      if (session.serverDone) { session.pendingDone = true; break; }
      const pageIndex = session.serverPageIndex;
      onProgress?.({ stage: 'exporting', message: `Préparation du volume ${session.nextVolume} · ${session.pendingTotalDocuments} éléments copiés`, completed: session.pendingTotalDocuments });
      const page = await transfer<{ pageIndex: number; json: string; sha256: string; done: boolean; documents: number; totalDocuments: number }>({ action: 'exportPage', sessionId: session.sessionId, pageIndex }, signal);
      const bytes = new TextEncoder().encode(page.json).length;
      if (page.pageIndex !== pageIndex || typeof page.done !== 'boolean' || bytes > BACKUP_PAGE_BYTES || await backupHash(page.json) !== page.sha256) throw Error('Page de sauvegarde incomplète. Réessaie la préparation du volume.');
      const parsed = parseBackup(page.json), count = backupDocumentCount(parsed);
      if (count > 100 || parsed.exportedAt !== session.exportedAt || count !== page.documents || page.totalDocuments !== session.serverTotalDocuments + count) throw Error('La copie serveur a changé de période ou de nombre d’éléments.');
      session.sourceRows = Object.entries(parsed.collections).flatMap(([collection, rows]) => (rows ?? []).map(row => ({ collection, row })));
      session.sourceOffset = 0; session.serverPageIndex++; session.serverTotalDocuments = page.totalDocuments; session.serverDone = page.done;
      for (const [collection, rows] of Object.entries(parsed.collections)) if (!rows?.length) (session.pageCollections as any)[collection] ??= [];
    }
    checkBackupAbort(signal);
    if (session.serverDone && session.sourceOffset >= session.sourceRows.length && session.expandedOffset >= session.expandedRows.length && !Object.keys(session.pageCollections).length) session.pendingDone = true;
    let warnings: string[] = [];
    if (session.pendingDone) {
      try { warnings = session.inventory.finish(); }
      catch (error) { session.invalid = `La sauvegarde complète ne peut pas être validée : ${(error as Error).message} Corrige le point indiqué, puis commence une nouvelle sauvegarde.`; throw Error(session.invalid); }
    }
    const result = await createBackupVolume({ backupId: session.sessionId, exportedAt: session.exportedAt, volume: session.nextVolume, previousDigest: session.previousDigest, final: session.pendingDone, totalDocuments: session.pendingTotalDocuments, pages: session.pendingPages });
    result.warnings = warnings;
    checkBackupAbort(signal);
    session.nextPageIndex += session.pendingPages.length; session.nextVolume++; session.previousDigest = result.digest; session.finished = result.final; session.totalDocuments = result.totalDocuments;
    session.pendingPages = []; session.pendingBytes = 0; session.pendingDone = false;
    onProgress?.({ stage: 'ready', message: result.final ? 'Dernier volume prêt. Conserve tous les volumes ensemble.' : `Volume ${result.volume} prêt. La sauvegarde comporte encore une suite.`, completed: result.totalDocuments });
    return result;
  } finally { session.inProgress = false; }
}
const completeDigest = (exportedAt: string, pageHashes: string[], totalDocuments: number) => backupHash(JSON.stringify({ exportedAt, pages: pageHashes, totalDocuments }));
async function readLegacy(file: File): Promise<BreweryBackup> {
  if (file.size > 8_000_000) throw Error('Cet ancien fichier JSON dépasse le format pris en charge. Utilise une sauvegarde ZIP par volumes pour les gros dossiers.');
  return parseBackup(await file.text());
}
async function recordOriginalProofs(backup: BreweryBackup, originals: Map<string, OriginalProof>) {
  for (const { id, data } of backup.collections.financeDocuments ?? []) {
    const originalId = typeof data.documentId === 'string' ? data.documentId : id;
    const proof = originals.get(originalId) ?? { chunks: new Map<number, string>() };
    if (typeof data.documentId === 'string') proof.chunks.set(data.index, await backupHash(data.data));
    else Object.assign(proof, { fileName: data.fileName, mimeType: data.mimeType, length: data.length });
    originals.set(originalId, proof);
  }
}
export async function inspectBackupFiles(files: File[], onProgress?: Progress, signal?: AbortSignal): Promise<BackupInspection> {
  if (!files.length) throw Error('Sélectionne tous les volumes d’une sauvegarde, ou un ancien fichier JSON.');
  const inventory = new BackupInventory(); const pageHashes: string[] = []; const volumes: SourceVolume[] = []; const originals = new Map<string, OriginalProof>();
  const legacy = files.length === 1 && /\.json$/i.test(files[0].name);
  let exportedAt: string;
  if (legacy) {
    checkBackupAbort(signal); onProgress?.({ stage: 'checking', message: 'Vérification de l’ancienne sauvegarde…' });
    const backup = await readLegacy(files[0]); inventory.add(backup); await recordOriginalProofs(backup, originals); exportedAt = backup.exportedAt;
    for (const page of splitLegacyBackup(backup)) { checkBackupAbort(signal); pageHashes.push(await backupHash(page)); }
  } else {
    if (files.some(f => !/\.zip$/i.test(f.name))) throw Error('Sélectionne les ZIP d’une seule sauvegarde. Le dossier fiscal et les JSON ne se mélangent pas à ces volumes.');
    for (let i = 0; i < files.length; i++) {
      checkBackupAbort(signal); onProgress?.({ stage: 'checking', message: `Vérification du fichier ${i + 1} sur ${files.length}…`, completed: i, total: files.length });
      const result = await readBackupVolume(files[i], signal);
      volumes.push({ file: files[i], manifest: result.manifest, digest: result.digest });
      for (const page of result.pages) { const backup = parseBackup(page.json); inventory.add(backup); await recordOriginalProofs(backup, originals); }
    }
    volumes.sort((a, b) => a.manifest.volume - b.manifest.volume);
    exportedAt = volumes[0].manifest.exportedAt; const backupId = volumes[0].manifest.backupId;
    let previousDigest: string | null = null, nextPage = 0, count = 0;
    for (let i = 0; i < volumes.length; i++) {
      const { manifest, digest } = volumes[i];
      if (manifest.backupId !== backupId || manifest.exportedAt !== exportedAt) throw Error('Ces volumes proviennent de sauvegardes différentes.');
      if (manifest.volume !== i + 1 || manifest.previousDigest !== previousDigest) throw Error(`Le volume ${i + 1} manque ou la suite des volumes a été modifiée.`);
      if (manifest.final !== (i === volumes.length - 1)) throw Error(manifest.final ? 'Des fichiers suivent le dernier volume annoncé.' : 'La sauvegarde est incomplète. Sélectionne aussi les volumes suivants.');
      for (const page of manifest.pages) { if (page.index !== nextPage++) throw Error('Une page de sauvegarde manque ou figure plusieurs fois.'); pageHashes.push(page.sha256); count += page.documents; }
      if (manifest.totalDocuments !== count) throw Error('Le nombre total d’éléments est incohérent.'); previousDigest = digest;
    }
    if (count !== inventory.documentCount) throw Error('Le dossier de sauvegarde est incomplet.');
  }
  const warnings = inventory.finish();
  if (legacy) warnings.push('Ancien format : seules les collections présentes dans ce fichier seront restaurées.');
  const result: BackupInspection = { exportedAt, volumeCount: files.length, documentCount: inventory.documentCount, originalCount: inventory.originalCount, source: legacy ? 'legacy' : 'archive', warnings, digest: await completeDigest(exportedAt, pageHashes, inventory.documentCount), pageHashes, volumes, ...(legacy ? { legacyFile: files[0] } : {}) };
  inspections.add(result); inspectionOriginals.set(result, originals); onProgress?.({ stage: 'checked', message: 'Fichiers et justificatifs vérifiés. Aucune donnée n’a encore été modifiée.', completed: result.documentCount, total: result.documentCount }); return result;
}

interface RestoreOriginal { id: string; dataUrl: string; fileName: string; mimeType: string; year: number; sha256: string; bytes: number }
async function checkRestoreOriginal(original: RestoreOriginal, inspection: BackupInspection) {
  const proof = inspectionOriginals.get(inspection)?.get(original.id);
  if (!proof || proof.fileName !== original.fileName || proof.mimeType !== original.mimeType || typeof original.dataUrl !== 'string' || original.dataUrl.length !== proof.length)
    throw Error('Le justificatif à restaurer ne correspond pas aux fichiers vérifiés. Aucune copie Drive n’a été envoyée.');
  const parts = Array.from({ length: Math.ceil(original.dataUrl.length / 400_000) }, (_, index) => original.dataUrl.slice(index * 400_000, (index + 1) * 400_000));
  if (parts.length !== proof.chunks.size) throw Error('Le justificatif à restaurer est incomplet.');
  for (let index = 0; index < parts.length; index++) if (await backupHash(parts[index]) !== proof.chunks.get(index)) throw Error('Le justificatif à restaurer diffère de l’original vérifié.');
  const base64 = original.dataUrl.slice(original.dataUrl.indexOf(',') + 1);
  const decoded = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  if (decoded.length !== original.bytes || await backupHash(decoded) !== original.sha256) throw Error('L’empreinte du justificatif à restaurer est incohérente.');
}

async function* inspectionPages(inspection: BackupInspection, signal?: AbortSignal): AsyncGenerator<BackupPage> {
  if (inspection.legacyFile) {
    const pages = splitLegacyBackup(await readLegacy(inspection.legacyFile));
    for (let i = 0; i < pages.length; i++) { checkBackupAbort(signal); yield { pageIndex: i, json: pages[i], sha256: await backupHash(pages[i]) }; }
  } else {
    for (const volume of inspection.volumes) {
      const result = await readBackupVolume(volume.file, signal);
      if (result.digest !== volume.digest) throw Error('Un volume a changé depuis sa vérification. Sélectionne à nouveau la sauvegarde.');
      for (const page of result.pages) yield page;
    }
  }
}
export async function restoreInspectedBackup(inspection: BackupInspection, onProgress?: Progress, signal?: AbortSignal): Promise<{ changed: number; journalsPreserved: number; operationalPreserved?: number; complete: boolean }> {
  if (!inspections.has(inspection)) throw Error('Vérifie les fichiers avant de lancer la restauration.');
  checkBackupAbort(signal); const { FirestoreRepo } = await import('./firestoreRepo'); await FirestoreRepo.waitForWrites();
  const { auth } = await import('./firebase');
  const key = `backup-restoration-${auth.currentUser?.uid ?? 'unknown'}-${inspection.digest}`;
  let operationId = pendingRestorations.get(key);
  try { operationId ??= localStorage.getItem(key) ?? undefined; } catch { /* memory fallback when storage is unavailable */ }
  if (!operationId || !/^[\w-]{16,100}$/.test(operationId)) operationId = `restore-${crypto.randomUUID()}`;
  pendingRestorations.set(key, operationId);
  // Persist before starting: a lost response must resume this operation, not replay it.
  try { localStorage.setItem(key, operationId); } catch { /* memory fallback */ }
  onProgress?.({ stage: 'uploading', message: 'Préparation de la restauration sur le serveur…' });
  let session: { sessionId: string; nextPageIndex: number; phase: string };
  try {
    session = await transfer({ action: 'startRestore', operationId, pageCount: inspection.pageHashes.length, totalDocuments: inspection.documentCount, exportedAt: inspection.exportedAt, digest: inspection.digest }, signal);
  } catch (error) {
    const failure = error as { code?: string; message?: string };
    // SDK timeouts use the same code: only the explicit server expiry proves
    // this operation cannot resume. An uncertain request must keep its identity.
    if (failure?.code === 'functions/deadline-exceeded' && /session de sauvegarde a expiré/i.test(failure.message ?? '')) {
      pendingRestorations.delete(key);
      try { localStorage.removeItem(key); } catch { /* memory pointer is cleared too */ }
      throw Error('La précédente session de restauration a expiré. Réimporte les mêmes fichiers pour démarrer une nouvelle restauration.');
    }
    throw error;
  }
  for await (const page of inspectionPages(inspection, signal)) {
    if (page.sha256 !== inspection.pageHashes[page.pageIndex]) throw Error('Une page a changé depuis sa vérification.');
    if (page.pageIndex < session.nextPageIndex) continue;
    onProgress?.({ stage: 'uploading', message: `Envoi de la partie ${page.pageIndex + 1} sur ${inspection.pageHashes.length}…`, completed: page.pageIndex, total: inspection.pageHashes.length });
    const uploaded = await transfer<{ nextPageIndex: number }>({ action: 'uploadRestorePage', sessionId: session.sessionId, pageIndex: page.pageIndex, json: page.json, sha256: page.sha256 }, signal);
    if (uploaded.nextPageIndex !== page.pageIndex + 1) throw Error('La réception de cette partie reste à confirmer. Réimporte les mêmes fichiers pour reprendre.');
  }
  let validated: { phase: string; checked: number; totalDocuments: number };
  do {
    checkBackupAbort(signal); validated = await transfer({ action: 'validateRestore', sessionId: session.sessionId }, signal);
    onProgress?.({ stage: 'validating', message: 'Contrôle serveur des données et des justificatifs…', completed: validated.checked, total: validated.totalDocuments });
    if (!['validating', 'ready', 'applying', 'complete'].includes(validated.phase)) throw Error('État de validation inattendu. Réimporte les mêmes fichiers pour reprendre.');
  } while (validated.phase === 'validating');
  let result: { phase: string; processed: number; totalDocuments: number; changed: number; journalsPreserved: number; operationalPreserved?: number };
  do {
    checkBackupAbort(signal);
    const prepared = await transfer<{ phase: 'restoring' | 'complete'; original?: RestoreOriginal }>({ action: 'prepareRestoreStep', sessionId: session.sessionId }, signal);
    if (!['restoring', 'complete'].includes(prepared.phase)) throw Error('La préparation de restauration reste à confirmer. Réessaie avec les mêmes fichiers.');
    let driveOriginal: DriveOriginalReference | undefined, driveAccessToken: string | undefined;
    if (prepared.original) {
      await checkRestoreOriginal(prepared.original, inspection); checkBackupAbort(signal);
      onProgress?.({ stage: 'restoring-original', message: `Restauration du justificatif ${prepared.original.fileName} dans Drive…` });
      driveOriginal = await uploadDriveOriginal({ documentId: prepared.original.id, dataUrl: prepared.original.dataUrl, mimeType: prepared.original.mimeType, fileName: prepared.original.fileName, year: prepared.original.year, signal });
      const { FirebaseAuthService } = await import('./firebaseAuth');
      driveAccessToken = await FirebaseAuthService.ensureDriveAccessToken() || undefined;
      if (!driveAccessToken) throw Error('Reconnecte Google Drive, puis reprends cette restauration. Le justificatif envoyé ne sera pas dupliqué.');
    }
    result = await transfer({ action: 'applyRestore', sessionId: session.sessionId, ...(driveOriginal ? { driveOriginal, driveAccessToken } : {}) }, signal);
    if (!['applying', 'complete'].includes(result.phase)) throw Error('La restauration reste à confirmer. Réimporte les mêmes fichiers pour reprendre.');
    onProgress?.({ stage: 'restoring', message: 'Restauration des éléments vérifiés…', completed: result.processed, total: result.totalDocuments });
  } while (result.phase !== 'complete');
  try { localStorage.removeItem(key); } catch { /* no effect on the server receipt */ }
  pendingRestorations.delete(key);
  onProgress?.({ stage: 'complete', message: 'Restauration confirmée par le serveur.', completed: result.totalDocuments, total: result.totalDocuments });
  return { changed: result.changed, journalsPreserved: result.journalsPreserved, ...(result.operationalPreserved != null ? { operationalPreserved: result.operationalPreserved } : {}), complete: true };
}
