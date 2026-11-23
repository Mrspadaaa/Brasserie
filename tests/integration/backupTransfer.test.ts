// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { parseBackup, type BreweryBackup } from '../../functions/src/backupCore';
import { BACKUP_PAGE_BYTES, BackupInventory, backupDocumentCount, backupHash, createBackupVolume, readBackupVolume, splitLegacyBackup, type BackupPage } from '../../src/services/backupArchive';
const mock = vi.hoisted(() => ({ call: vi.fn(), wait: vi.fn(), driveBytes: vi.fn(), driveUpload: vi.fn(), storage: new Map<string, string>() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => mock.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {}, auth: { currentUser: { uid: 'synthetic-test' } } }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: { waitForWrites: mock.wait } }));
vi.mock('../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getDriveAccessToken: () => 'synthetic-drive-memory-token', ensureDriveAccessToken: async () => 'synthetic-drive-memory-token' } }));
vi.mock('../../src/services/driveFileStore', async (original) => ({ ...await original<any>(), getDriveOriginalBytes: mock.driveBytes, uploadDriveOriginal: mock.driveUpload }));
import { exportNextBackupVolume, inspectBackupFiles, restoreInspectedBackup, startBackupExport } from '../../src/services/backupTransfer';
const at = '2026-09-09T12:00:00.000Z';
const expiry = '2099-01-01T00:00:00.000Z';
const makeBackup = (collections: BreweryBackup['collections']): BreweryBackup => ({ schemaVersion: 3, source: 'server', exportedAt: at, collections });
const pagesFor = async (backup: BreweryBackup): Promise<BackupPage[]> => Promise.all(splitLegacyBackup(backup).map(async (json, pageIndex) => ({ pageIndex, json, sha256: await backupHash(json) })));
const file = (blob: Blob, name = 'sauvegarde.zip') => new File([blob], name, { type: 'application/zip' });
async function volume(backup: BreweryBackup) { return createBackupVolume({ backupId: 'synthetic-backup-0001', exportedAt: at, volume: 1, previousDigest: null, final: true, totalDocuments: backupDocumentCount(backup), pages: await pagesFor(backup) }); }
function documentsWithOriginals(count = 3): BreweryBackup {
  const docs: Array<{ id: string; data: Record<string, any> }> = [], transactions: Array<{ id: string; data: Record<string, any> }> = [];
  for (let n = 0; n < count; n++) {
    const id = `proof-synthetic-${n}`, bytes = Buffer.alloc(3 * 1024 * 1024, 32);
    bytes.write('%PDF-1.7\n'); bytes.write('\n%%EOF', bytes.length - 6);
    const source = `data:application/pdf;base64,${bytes.toString('base64')}`, parts = Array.from({ length: Math.ceil(source.length / 400_000) }, (_, i) => source.slice(i * 400_000, (i + 1) * 400_000));
    docs.push({ id, data: { id, fileName: `facture-${n}.pdf`, mimeType: 'application/pdf', chunkCount: parts.length, length: source.length } });
    parts.forEach((data, index) => docs.push({ id: `${id}-${index}`, data: { id: `${id}-${index}`, documentId: id, index, data } }));
    transactions.push({ id: `TX-${n}`, data: { id: `TX-${n}`, date: '2025-10-03', amountTTC: 100 + n, finance: { proofDocumentId: id } } });
  }
  return makeBackup({ financeDocuments: docs, transactions });
}
beforeEach(() => {
  mock.call.mockReset(); mock.wait.mockReset(); mock.driveBytes.mockReset(); mock.driveUpload.mockReset(); mock.wait.mockResolvedValue(undefined); mock.storage.clear();
  vi.stubGlobal('localStorage', { getItem: (k: string) => mock.storage.get(k), setItem: (k: string, v: string) => mock.storage.set(k, v), removeItem: (k: string) => mock.storage.delete(k) });
});

describe('Sauvegarde restaurable par volumes, sans réseau', () => {
  it('reconstitue plus de 8 Mo avec trois originaux exacts et toutes leurs références', async () => {
    const backup = documentsWithOriginals(), result = await volume(backup);
    expect(result.blob.size).toBeGreaterThan(8_000_000);
    const decoded = await readBackupVolume(result.blob);
    const restored = decoded.pages.flatMap(p => parseBackup(p.json).collections.financeDocuments ?? []);
    expect(restored).toEqual(backup.collections.financeDocuments);
    const inspection = await inspectBackupFiles([file(result.blob)]);
    expect(inspection).toMatchObject({ originalCount: 3, documentCount: backupDocumentCount(backup), warnings: [], source: 'archive' });
    expect(mock.call).not.toHaveBeenCalled();
  });
  it('accepte tous les volumes dans le désordre et refuse une partie manquante', async () => {
    const backup = makeBackup({ clients: Array.from({ length: 601 }, (_, i) => ({ id: `C-${i}`, data: { id: `C-${i}`, name: 'Client fictif' } })) });
    const pages = await pagesFor(backup), firstPages = pages.slice(0, 3), secondPages = pages.slice(3);
    expect(pages.every(p => backupDocumentCount(parseBackup(p.json)) <= 100 && new TextEncoder().encode(p.json).length <= BACKUP_PAGE_BYTES)).toBe(true);
    const first = await createBackupVolume({ backupId: 'synthetic-multipart-01', exportedAt: at, volume: 1, previousDigest: null, final: false, totalDocuments: 300, pages: firstPages });
    const last = await createBackupVolume({ backupId: 'synthetic-multipart-01', exportedAt: at, volume: 2, previousDigest: first.digest, final: true, totalDocuments: 601, pages: secondPages });
    expect((await inspectBackupFiles([file(last.blob, '2.zip'), file(first.blob, '1.zip')])).documentCount).toBe(601);
    await expect(inspectBackupFiles([file(first.blob)])).rejects.toThrow('incomplète');
    await expect(inspectBackupFiles([file(last.blob)])).rejects.toThrow('volume 1');
    expect(mock.call).not.toHaveBeenCalled();
  });
  it('refuse ZIP tronqué, contenu altéré et compression avant tout appel serveur', async () => {
    const result = await volume(makeBackup({ clients: [{ id: 'C-1', data: { id: 'C-1', name: 'MARKER_SYNTHETIC' } }] }));
    await expect(inspectBackupFiles([file(result.blob.slice(0, -2))])).rejects.toThrow('incomplet');
    const bytes = new Uint8Array(await result.blob.arrayBuffer()), marker = strToU8('MARKER_SYNTHETIC');
    const offset = Buffer.from(bytes).indexOf(Buffer.from(marker)); expect(offset).toBeGreaterThan(0); bytes[offset] = 88;
    await expect(inspectBackupFiles([file(new Blob([bytes]))])).rejects.toThrow('altérée');
    const compressed = zipSync({ 'manifest.json': strToU8('a'.repeat(2_000_000)) }, { level: 9 });
    await expect(inspectBackupFiles([file(new Blob([compressed]))])).rejects.toThrow('compressé');
    expect(mock.call).not.toHaveBeenCalled();
  });
  it('refuse les originaux incomplets et signale les liens externes conservés', async () => {
    const backup = documentsWithOriginals(1); backup.collections.financeDocuments!.pop();
    const result = await volume(backup);
    await expect(inspectBackupFiles([file(result.blob)])).rejects.toThrow('incomplet');
    const external = await volume(makeBackup({ transactions: [{ id: 'OLD-TX', data: { id: 'OLD-TX', proofUrl: 'https://example.test/invoice.pdf' } }] }));
    expect((await inspectBackupFiles([file(external.blob)])).warnings[0]).toContain('externes');
  });
  it('rejette les doublons entre pages, y compris dans un manifeste cohérent', async () => {
    const inventory = new BackupInventory(), data = makeBackup({ config: [{ id: 'app', data: { name: 'Fictif' } }] });
    inventory.add(data); expect(() => inventory.add(data)).toThrow('plusieurs fois');
  });
  it('reprend une page de téléchargement interrompue sans oublier les pages déjà reçues', async () => {
    const pages = await pagesFor(makeBackup({ clients: Array.from({ length: 201 }, (_, i) => ({ id: `C-${i}`, data: { id: `C-${i}` } })) }));
    let failed = false;
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startExport') return { data: { sessionId: 'synthetic-export-session', exportedAt: at, expiresAt: expiry } };
      if (request.pageIndex === 1 && !failed) { failed = true; throw Error('Connexion interrompue'); }
      const page = pages[request.pageIndex]; return { data: { ...page, done: request.pageIndex === pages.length - 1, documents: backupDocumentCount(parseBackup(page.json)), totalDocuments: Math.min(201, (request.pageIndex + 1) * 100) } };
    });
    const session = await startBackupExport();
    await expect(exportNextBackupVolume(session)).rejects.toThrow('interrompue');
    expect(session.pendingPages).toHaveLength(1);
    const result = await exportNextBackupVolume(session);
    expect(result).toMatchObject({ final: true, documentCount: 201 });
    expect(mock.call.mock.calls.filter(([r]) => r.action === 'exportPage').map(([r]) => r.pageIndex)).toEqual([0, 1, 1, 2]);
    expect((await inspectBackupFiles([file(result.blob)])).documentCount).toBe(201);
  });
  it('importe un ancien JSON en pages bornées et attend validation serveur avant application', async () => {
    const backup = makeBackup({ clients: Array.from({ length: 601 }, (_, i) => ({ id: `C-${i}`, data: { id: `C-${i}`, name: 'Fictif' } })) });
    const inspection = await inspectBackupFiles([new File([JSON.stringify(backup)], 'ancien.json')]);
    let validated = false;
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-restore-session', phase: 'uploading', nextPageIndex: 0 } };
      if (request.action === 'uploadRestorePage') { expect(backupDocumentCount(parseBackup(request.json))).toBeLessThanOrEqual(100); return { data: { nextPageIndex: request.pageIndex + 1 } }; }
      if (request.action === 'validateRestore') { const phase = validated ? 'ready' : 'validating'; validated = true; return { data: { phase, checked: 601, totalDocuments: 601 } }; }
      expect(validated).toBe(true); return { data: { phase: 'complete', processed: 601, totalDocuments: 601, changed: 601, journalsPreserved: 0 } };
    });
    expect(await restoreInspectedBackup(inspection)).toEqual({ complete: true, changed: 601, journalsPreserved: 0 });
    const actions = mock.call.mock.calls.map(([r]) => r.action);
    expect(actions.filter(a => a === 'uploadRestorePage')).toHaveLength(7);
    expect(actions.indexOf('validateRestore')).toBeGreaterThan(actions.lastIndexOf('uploadRestorePage'));
    expect(actions.indexOf('applyRestore')).toBeGreaterThan(actions.lastIndexOf('validateRestore'));
  });
  it('reprend la restauration avec la même identité après une confirmation perdue', async () => {
    const inspection = await inspectBackupFiles([new File([JSON.stringify(makeBackup({ config: [{ id: 'app', data: { name: 'Fictif' } }] }))], 'ancien.json')]);
    let first = true;
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-restore-session', phase: first ? 'uploading' : 'applying', nextPageIndex: first ? 0 : 1 } };
      if (request.action === 'uploadRestorePage') return { data: { nextPageIndex: 1 } };
      if (request.action === 'validateRestore') return { data: { phase: 'ready', checked: 1, totalDocuments: 1 } };
      if (first) { first = false; throw Error('Confirmation perdue'); }
      return { data: { phase: 'complete', processed: 1, totalDocuments: 1, changed: 1, journalsPreserved: 0 } };
    });
    await expect(restoreInspectedBackup(inspection)).rejects.toThrow('perdue');
    expect((await restoreInspectedBackup(inspection)).complete).toBe(true);
    const starts = mock.call.mock.calls.filter(([r]) => r.action === 'startRestore').map(([r]) => r.operationId);
    expect(starts[0]).toBe(starts[1]); expect(mock.call.mock.calls.filter(([r]) => r.action === 'uploadRestorePage')).toHaveLength(1);
  });
  it('interrompt la vérification sans appel réseau et refuse une inspection fabriquée', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(inspectBackupFiles([new File(['{}'], 'ancien.json')], undefined, controller.signal)).rejects.toThrow('interrompue');
    await expect(restoreInspectedBackup({} as any)).rejects.toThrow('Vérifie'); expect(mock.call).not.toHaveBeenCalled();
  });
  it('détecte un original absent dès la préparation de la sauvegarde complète', async () => {
    const json = JSON.stringify(makeBackup({ transactions: [{ id: 'TX-BROKEN', data: { id: 'TX-BROKEN', finance: { proofDocumentId: 'proof-missing-1234' } } }] }));
    const sha256 = await backupHash(json);
    mock.call.mockImplementation(async (request: any) => ({ data: request.action === 'startExport' ? { sessionId: 'synthetic-export-broken', exportedAt: at, expiresAt: expiry } : { pageIndex: 0, json, sha256, done: true, documents: 1, totalDocuments: 1 } }));
    const session = await startBackupExport();
    await expect(exportNextBackupVolume(session)).rejects.toThrow('ne peut pas être validée');
    expect(session.finished).toBe(false);
    await expect(exportNextBackupVolume(session)).rejects.toThrow('original');
    expect(mock.call).toHaveBeenCalledTimes(2);
  });
  it('distingue une nouvelle restauration volontaire d’une reprise de la précédente', async () => {
    const inspection = await inspectBackupFiles([new File([JSON.stringify(makeBackup({ config: [{ id: 'app', data: { name: 'Fictif' } }] }))], 'ancien.json')]);
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-restore-session', nextPageIndex: 0, phase: 'uploading' } };
      if (request.action === 'uploadRestorePage') return { data: { nextPageIndex: 1 } };
      if (request.action === 'validateRestore') return { data: { phase: 'ready', checked: 1, totalDocuments: 1 } };
      return { data: { phase: 'complete', changed: 1, processed: 1, totalDocuments: 1, journalsPreserved: 0 } };
    });
    await restoreInspectedBackup(inspection); await restoreInspectedBackup(inspection);
    const ids = mock.call.mock.calls.filter(([request]) => request.action === 'startRestore').map(([request]) => request.operationId);
    expect(ids).toHaveLength(2); expect(ids[0]).not.toBe(ids[1]);
  });
  it('libère une session expirée sans réessai automatique puis crée une nouvelle identité au réimport', async () => {
    const files = [new File([JSON.stringify(makeBackup({ config: [{ id: 'app', data: { name: 'Session expirée' } }] }))], 'ancien.json')];
    const inspection = await inspectBackupFiles(files);
    const key = `backup-restoration-synthetic-test-${inspection.digest}`, expiredId = 'restore-expired-session-12345';
    mock.storage.set(key, expiredId);
    mock.call.mockRejectedValueOnce(Object.assign(Error('La session de sauvegarde a expiré. Recommencez avec les mêmes fichiers.'), { code: 'functions/deadline-exceeded' }));
    await expect(restoreInspectedBackup(inspection)).rejects.toThrow('Réimporte les mêmes fichiers pour démarrer une nouvelle restauration');
    expect(mock.storage.has(key)).toBe(false); expect(mock.call).toHaveBeenCalledTimes(1);
    expect(mock.call.mock.calls[0][0].operationId).toBe(expiredId);
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-new-session', nextPageIndex: 0, phase: 'uploading' } };
      if (request.action === 'uploadRestorePage') return { data: { nextPageIndex: 1 } };
      if (request.action === 'validateRestore') return { data: { phase: 'ready', checked: 1, totalDocuments: 1 } };
      return { data: { phase: 'complete', changed: 1, processed: 1, totalDocuments: 1, journalsPreserved: 0 } };
    });
    expect((await restoreInspectedBackup(await inspectBackupFiles(files))).complete).toBe(true);
    const ids = mock.call.mock.calls.filter(([request]) => request.action === 'startRestore').map(([request]) => request.operationId);
    expect(ids).toHaveLength(2); expect(ids[1]).not.toBe(expiredId); // both memory and storage pointers were cleared
  });
  it('conserve l’identité lorsque le démarrage expire côté réseau sans expiration confirmée de la session', async () => {
    const inspection = await inspectBackupFiles([new File([JSON.stringify(makeBackup({ config: [{ id: 'app', data: { name: 'Timeout réseau' } }] }))], 'ancien.json')]);
    mock.call.mockRejectedValueOnce(Object.assign(Error('deadline-exceeded'), { code: 'functions/deadline-exceeded' }));
    await expect(restoreInspectedBackup(inspection)).rejects.toThrow('deadline-exceeded');
    const firstId = mock.call.mock.calls[0][0].operationId;
    expect(mock.storage.get(`backup-restoration-synthetic-test-${inspection.digest}`)).toBe(firstId);
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-resumed-session', nextPageIndex: 1, phase: 'complete' } };
      return { data: { phase: 'complete', changed: 1, processed: 1, totalDocuments: 1, journalsPreserved: 0 } };
    });
    expect((await restoreInspectedBackup(inspection)).complete).toBe(true);
    expect(mock.call.mock.calls.filter(([request]) => request.action === 'startRestore')[1][0].operationId).toBe(firstId);
  });

  it('inclut les octets Drive dans plusieurs volumes portables en séparant le curseur serveur des pages ZIP', async () => {
    const bytes = new Uint8Array(4 * 1024 * 1024).fill(32); bytes.set(new TextEncoder().encode('%PDF-1.7\n'));
    const sha256 = await backupHash(bytes);
    const originals = Array.from({ length: 7 }, (_, n) => ({ id: `drive-original-${n}`, data: { id: `drive-original-${n}`, provider: 'google-drive', driveFileId: `drive-file-${n}`, sha256, bytes: bytes.length, mimeType: 'application/pdf', fileName: `facture-${n}.pdf` } }));
    const sourcePages = await pagesFor(makeBackup({ financeDocuments: originals }));
    mock.driveBytes.mockResolvedValue(bytes);
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startExport') return { data: { sessionId: 'synthetic-drive-export', exportedAt: at, expiresAt: expiry } };
      const page = sourcePages[request.pageIndex];
      return { data: { ...page, done: true, documents: 7, totalDocuments: 7 } };
    });
    const session = await startBackupExport();
    const first = await exportNextBackupVolume(session);
    expect(first.final).toBe(false);
    // The rest of the small server page stays queued; no seven-file hydration in RAM.
    expect(mock.driveBytes.mock.calls.length).toBeLessThanOrEqual(7);
    expect(session.expandedRows.length).toBeLessThanOrEqual(15);
    const last = await exportNextBackupVolume(session);
    expect(last.final).toBe(true);
    expect(mock.driveBytes).toHaveBeenCalledTimes(7);
    expect(mock.call.mock.calls.filter(([request]) => request.action === 'exportPage').map(([request]) => request.pageIndex)).toEqual([0]);
    expect(last.totalDocuments).toBe(105); // seven originals, fourteen chunks each
    const firstRead = await readBackupVolume(first.blob), lastRead = await readBackupVolume(last.blob);
    const pages = [...firstRead.pages, ...lastRead.pages];
    expect(pages.map(page => page.pageIndex)).toEqual(pages.map((_, index) => index));
    expect(pages.every(page => new TextEncoder().encode(page.json).length <= BACKUP_PAGE_BYTES && backupDocumentCount(parseBackup(page.json)) <= 100)).toBe(true);
    const inspection = await inspectBackupFiles([file(last.blob, 'last.zip'), file(first.blob, 'first.zip')]);
    expect(inspection).toMatchObject({ originalCount: 7, documentCount: 105, warnings: [] });
    const restoredRows = pages.flatMap(page => parseBackup(page.json).collections.financeDocuments ?? []);
    expect(restoredRows.filter(row => row.data.provider === 'google-drive')).toHaveLength(0);
    const reassembled = restoredRows.filter(row => row.data.documentId === 'drive-original-6').sort((a, b) => a.data.index - b.data.index).map(row => row.data.data).join('');
    expect(await backupHash(new Uint8Array(Buffer.from(reassembled.split(',')[1], 'base64')))).toBe(sha256);
  });

  it('reprend un téléchargement Drive interrompu sans relire le curseur serveur ni dupliquer les originaux', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.4\nSynthetic\n%%EOF');
    const sha256 = await backupHash(bytes);
    const rows = [0, 1].map(n => ({ id: `drive-proof-${n}`, data: { id: `drive-proof-${n}`, provider: 'google-drive', driveFileId: `drive-file-${n}`, sha256, bytes: bytes.length, mimeType: 'application/pdf', fileName: `facture-${n}.pdf` } }));
    const page = (await pagesFor(makeBackup({ financeDocuments: rows })))[0];
    mock.driveBytes.mockResolvedValueOnce(bytes).mockRejectedValueOnce(Error('Reconnecte Google Drive')).mockResolvedValue(bytes);
    mock.call.mockImplementation(async (request: any) => ({ data: request.action === 'startExport' ? { sessionId: 'synthetic-drive-resume', exportedAt: at, expiresAt: expiry } : { ...page, done: true, documents: 2, totalDocuments: 2 } }));
    const session = await startBackupExport();
    await expect(exportNextBackupVolume(session)).rejects.toThrow('Reconnecte');
    const completed = await exportNextBackupVolume(session);
    expect(await inspectBackupFiles([file(completed.blob)])).toMatchObject({ originalCount: 2, documentCount: 4 });
    expect(mock.call).toHaveBeenCalledTimes(2);
    expect(mock.driveBytes.mock.calls.map(([ref]) => ref.driveFileId)).toEqual(['drive-file-0', 'drive-file-1', 'drive-file-1']);
  });

  it('restaure un original vérifié dans Drive avant de demander l’écriture serveur de sa référence', async () => {
    const backup = documentsWithOriginals(1);
    const originalRows = backup.collections.financeDocuments!;
    const dataUrl = originalRows.filter(row => row.data.documentId).sort((a, b) => a.data.index - b.data.index).map(row => row.data.data).join('');
    const meta = originalRows[0].data, bytes = Buffer.from(dataUrl.split(',')[1], 'base64'), sha256 = await backupHash(new Uint8Array(bytes));
    const inspection = await inspectBackupFiles([file((await volume(backup)).blob)]);
    const reference = { driveFileId: 'restored-drive-file', sha256, bytes: bytes.length, fileName: meta.fileName, mimeType: meta.mimeType };
    mock.driveUpload.mockResolvedValue(reference);
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-drive-restore', nextPageIndex: 0, phase: 'uploading' } };
      if (request.action === 'uploadRestorePage') return { data: { nextPageIndex: request.pageIndex + 1 } };
      if (request.action === 'validateRestore') return { data: { phase: 'ready', checked: inspection.documentCount, totalDocuments: inspection.documentCount } };
      if (request.action === 'prepareRestoreStep') return { data: { phase: 'restoring', original: { id: meta.id, dataUrl, fileName: meta.fileName, mimeType: meta.mimeType, year: 2026, sha256, bytes: bytes.length } } };
      expect(mock.driveUpload).toHaveBeenCalledTimes(1);
      expect(request).toMatchObject({ action: 'applyRestore', driveOriginal: reference, driveAccessToken: 'synthetic-drive-memory-token' });
      return { data: { phase: 'complete', processed: inspection.documentCount, totalDocuments: inspection.documentCount, changed: 1, journalsPreserved: 0 } };
    });
    expect((await restoreInspectedBackup(inspection)).complete).toBe(true);
    expect(mock.driveUpload.mock.calls[0][0]).toMatchObject({ documentId: meta.id, dataUrl, year: 2026 });
    expect([...mock.storage.values()].join('')).not.toContain('synthetic-drive-memory-token');
  });

  it('bloque un original serveur différent des octets ZIP avant toute copie Drive ou application', async () => {
    const backup = documentsWithOriginals(1), meta = backup.collections.financeDocuments![0].data;
    const original = backup.collections.financeDocuments!.filter(row => row.data.documentId).map(row => row.data.data).join('');
    const tampered = original.slice(0, -5) + 'AAAA' + original.slice(-1);
    const inspection = await inspectBackupFiles([file((await volume(backup)).blob)]);
    mock.call.mockImplementation(async (request: any) => {
      if (request.action === 'startRestore') return { data: { sessionId: 'synthetic-drive-tampered', nextPageIndex: 0, phase: 'uploading' } };
      if (request.action === 'uploadRestorePage') return { data: { nextPageIndex: request.pageIndex + 1 } };
      if (request.action === 'validateRestore') return { data: { phase: 'ready' } };
      return { data: { phase: 'restoring', original: { id: meta.id, dataUrl: tampered, fileName: meta.fileName, mimeType: meta.mimeType, year: 2026, sha256: 'a'.repeat(64), bytes: 3 * 1024 * 1024 } } };
    });
    await expect(restoreInspectedBackup(inspection)).rejects.toThrow('diffère de l’original');
    expect(mock.driveUpload).not.toHaveBeenCalled();
    expect(mock.call.mock.calls.some(([request]) => request.action === 'applyRestore')).toBe(false);
  });
});
