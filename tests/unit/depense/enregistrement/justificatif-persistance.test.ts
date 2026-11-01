// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
// Voie s2-enregistrement : DR1 (reçu Drive), DR4 (« en cours » après 15 s, pas de retéléchargement au second clic), DR5 (nom tolérant).
// `financeDocuments` est réel ; Firestore, `firestoreRepo` et `driveFileStore` sont simulés (modèle de financeDocumentPersistence.test.ts). Aucun Drive réel.
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), upload: vi.fn(), load: vi.fn(), details: vi.fn(), commits: vi.fn(), driveNames: new Map<string, string>() }));
vi.mock('../../../../src/services/firebase', () => ({ db: {} }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ FirestoreRepo: { find: () => undefined } }));
vi.mock('../../../../src/services/driveFileStore', () => ({
  uploadDriveOriginal: (...args: any[]) => state.upload(...args), loadDriveOriginal: (...args: any[]) => state.load(...args), getDriveProofDetails: (...args: any[]) => state.details(...args)
}));
vi.mock('firebase/firestore', () => ({
  doc: (_: unknown, collection: string, id: string) => `${collection}/${id}`,
  getDoc: async (path: string) => ({ exists: () => state.docs.has(path), data: () => state.docs.get(path) }),
  getDocFromServer: async (path: string) => ({ exists: () => state.docs.has(path), data: () => state.docs.get(path) }),
  writeBatch: () => {
    const rows: Array<[string, any]> = [];
    return { set: (path: string, value: any) => rows.push([path, value]), commit: async () => { await state.commits(); rows.forEach(([path, value]) => state.docs.set(path, value)); } };
  }
}));
import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from '../../../../src/services/financeDocuments';
const sha = (data: string) => createHash('sha256').update(Buffer.from(data, 'base64')).digest('hex');
const original = (id: string, fileName = `${id}.pdf`, letter = 'A') => prepareFinanceDocument(id, `data:application/pdf;base64,${letter.repeat(16)}`, fileName, 'application/pdf');
const FOLDER = 'L’Affinée / Justificatifs / 2026';
const LINK = 'https://drive.google.com/file/d/drive-x/view';
beforeEach(() => {
  state.docs.clear(); state.commits.mockReset().mockResolvedValue(undefined); state.load.mockReset().mockResolvedValue(undefined);
  // Drive garde le nom sous lequel le fichier est arrivé la première fois ; il le rend dans les métadonnées (`fileName`).
  state.driveNames.clear();
  state.details.mockReset().mockImplementation(async (ref: any) => ({ fileName: state.driveNames.get(ref.driveFileId), folder: FOLDER, webViewLink: LINK, checksumVerified: true }));
  state.upload.mockReset().mockImplementation(async (input) => {
    const data = input.dataUrl.split(',')[1], driveFileId = `drive-${input.documentId}`;
    if (!state.driveNames.has(driveFileId)) state.driveNames.set(driveFileId, input.fileName);
    return { driveFileId, sha256: sha(data), bytes: Buffer.from(data, 'base64').length, mimeType: input.mimeType, fileName: input.fileName };
  });
});
afterEach(() => vi.useRealTimers());

describe('DR1 : la preuve Drive revient de l’envoi', () => {
  it('rend dossier, nom, octets, empreinte vérifiée et webViewLink', async () => {
    const receipt = await saveFinanceDocumentConfirmed(original('proof-recu-0001', '2026-04-27 Brau- und Rauchshop GmbH 372765.pdf'), 2026);
    expect(receipt).toEqual({ driveFileId: 'drive-proof-recu-0001', fileName: '2026-04-27 Brau- und Rauchshop GmbH 372765.pdf', bytes: 12, sha256: sha('A'.repeat(16)), verified: true, folder: FOLDER, webViewLink: LINK });
  });
  it('le dossier est lu sur Drive, jamais déduit de l’année demandée ; un détail qui échoue ne fait pas échouer l’envoi', async () => {
    state.details.mockResolvedValueOnce({ checksumVerified: true });
    const unread = await saveFinanceDocumentConfirmed(original('proof-recu-0002'), 2025);
    expect(unread).toMatchObject({ verified: true }); expect(unread).not.toHaveProperty('folder'); expect(unread).not.toHaveProperty('webViewLink');
    state.details.mockRejectedValueOnce(Object.assign(Error('hors ligne'), { code: 'drive/network' }));
    const failed = await saveFinanceDocumentConfirmed(original('proof-recu-0003'), 2026);
    expect(failed).toMatchObject({ driveFileId: 'drive-proof-recu-0003', verified: true }); expect(failed).not.toHaveProperty('folder');
    expect(state.docs.has('financeDocuments/proof-recu-0003')).toBe(true);
  });
  it('le nom du reçu et celui du document sont ceux de Drive : fichier déjà rangé sous A, renvoyé sous B, le reçu dit A', async () => {
    state.driveNames.set('drive-proof-nom-0001', '2026-04-27 Fournisseur A 111.pdf');
    const receipt = await saveFinanceDocumentConfirmed(original('proof-nom-0001', '2026-04-27 Fournisseur A 222.pdf'), 2026);
    expect(receipt).toMatchObject({ driveFileId: 'drive-proof-nom-0001', fileName: '2026-04-27 Fournisseur A 111.pdf' });
    expect(state.docs.get('financeDocuments/proof-nom-0001').fileName).toBe('2026-04-27 Fournisseur A 111.pdf');
  });
  it('Drive qui ne rend pas le nom : le reçu n’en a pas (il n’est jamais pris dans la saisie) ; l’envoi réussit', async () => {
    state.details.mockResolvedValueOnce({ folder: FOLDER, checksumVerified: true });
    const receipt = await saveFinanceDocumentConfirmed(original('proof-nom-0002', 'nom-de-la-saisie.pdf'), 2026);
    expect(receipt).toMatchObject({ driveFileId: 'drive-proof-nom-0002', verified: true });
    expect(receipt).not.toHaveProperty('fileName');
    state.details.mockRejectedValueOnce(Object.assign(Error('hors ligne'), { code: 'drive/network' }));
    expect(await saveFinanceDocumentConfirmed(original('proof-nom-0003', 'nom-de-la-saisie.pdf'), 2026)).not.toHaveProperty('fileName');
  });
  it('après rechargement, le nom du reçu est lu sur Drive, pas dans le document Firestore', async () => {
    const { loadDriveProofReceipt } = await import('../../../../src/services/financeDocuments');
    state.driveNames.set('drive-proof-nom-0004', 'nom-sur-drive.pdf');
    state.docs.set('financeDocuments/proof-nom-0004', { id: 'proof-nom-0004', provider: 'google-drive', driveFileId: 'drive-proof-nom-0004', sha256: sha('A'.repeat(16)), bytes: 12, mimeType: 'application/pdf', fileName: 'nom-du-document.pdf', createdAt: '2026-04-27T10:00:00.000Z' });
    expect(await loadDriveProofReceipt('proof-nom-0004')).toMatchObject({ fileName: 'nom-sur-drive.pdf' });
    state.driveNames.clear();
    expect(await loadDriveProofReceipt('proof-nom-0004')).not.toHaveProperty('fileName');
  });
});

describe('DR4 : l’envoi qui continue se dit « en cours », et le second clic ne retélécharge rien', () => {
  it('au-delà de 15 s : code drive/in-progress, texte neutre ; le second clic reprend le même envoi sans téléchargement', async () => {
    vi.useFakeTimers();
    let release!: () => void;
    state.upload.mockImplementationOnce((input) => new Promise((resolve) => {
      const data = input.dataUrl.split(',')[1];
      release = () => resolve({ driveFileId: 'drive-lent', sha256: sha(data), bytes: 12, mimeType: input.mimeType, fileName: input.fileName });
    }));
    const file = original('proof-lent-00001');
    const first = saveFinanceDocumentConfirmed(file, 2026).catch((error) => error);
    await vi.advanceTimersByTimeAsync(15_001);
    const error: any = await first;
    expect(error.code).toBe('drive/in-progress');
    expect(error.message).toMatch(/plus de temps|peut encore aboutir/);
    expect(error.message).not.toMatch(/achat|connexion est rétablie/i);
    const second = saveFinanceDocumentConfirmed(file, 2026);
    await vi.advanceTimersByTimeAsync(10); release();
    const receipt = await second;
    expect(receipt).toMatchObject({ driveFileId: 'drive-lent', verified: true });
    expect(state.upload).toHaveBeenCalledTimes(1); expect(state.load).not.toHaveBeenCalled();
  });
  it('original déjà confirmé : comparaison locale + métadonnées Drive, zéro téléchargement ; même contenu sous un autre nom accepté', async () => {
    const file = original('proof-confirme-001', 'nom-enregistre.pdf');
    await saveFinanceDocumentConfirmed(file, 2026);
    state.details.mockClear();
    const again = await saveFinanceDocumentConfirmed({ ...file, fileName: 'autre-nom.pdf' }, 2026);
    expect(again).toMatchObject({ fileName: 'nom-enregistre.pdf', verified: true, folder: FOLDER });
    expect(state.load).not.toHaveBeenCalled(); expect(state.details).toHaveBeenCalledTimes(1); expect(state.upload).toHaveBeenCalledTimes(1);
  });
  it('autre contenu sous le même identifiant : refusé, sans téléchargement ni remplacement', async () => {
    await saveFinanceDocumentConfirmed(original('proof-collision-01'), 2026);
    await expect(saveFinanceDocumentConfirmed(original('proof-collision-01', 'proof-collision-01.pdf', 'B'), 2026)).rejects.toThrow('autre original');
    expect(state.load).not.toHaveBeenCalled();
  });
  it('sans empreinte Drive (omitChecksum) : repli sur le téléchargement, jamais d’acceptation silencieuse', async () => {
    const file = original('proof-sans-empreinte');
    await saveFinanceDocumentConfirmed(file, 2026);
    state.details.mockResolvedValue({ folder: FOLDER, checksumVerified: false });
    state.load.mockResolvedValueOnce(`data:application/pdf;base64,${'A'.repeat(16)}`);
    await expect(saveFinanceDocumentConfirmed(file, 2026)).resolves.toMatchObject({ verified: true });
    expect(state.load).toHaveBeenCalledTimes(1);
    state.load.mockResolvedValueOnce(`data:application/pdf;base64,${'B'.repeat(16)}`);
    await expect(saveFinanceDocumentConfirmed(file, 2026)).rejects.toThrow('autre original');
  });
});
