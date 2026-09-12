// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), drive: new Map<string, string>(), driveUpload: vi.fn(), driveLoad: vi.fn(), commits: vi.fn(), batches: [] as Array<Array<[string, any]>> }));
vi.mock('../../src/services/firebase', () => ({ db: {} }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: { find: () => undefined } }));
vi.mock('../../src/services/driveFileStore', () => ({ uploadDriveOriginal: (...args: any[]) => state.driveUpload(...args), loadDriveOriginal: (...args: any[]) => state.driveLoad(...args) }));
vi.mock('firebase/firestore', () => ({
  doc: (_: unknown, collection: string, id: string) => `${collection}/${id}`,
  getDoc: async (path: string) => ({ exists: () => state.docs.has(path), data: () => state.docs.get(path) }),
  getDocFromServer: async (path: string) => ({ exists: () => state.docs.has(path), data: () => state.docs.get(path) }),
  writeBatch: () => {
    const rows: Array<[string, any]> = [];
    return { set: (path: string, value: any) => rows.push([path, value]), commit: async () => {
      state.batches.push(rows); await state.commits();
      // Mirror the production create-only rules: any existing row rejects the entire batch.
      if (rows.some(([path]) => state.docs.has(path))) throw Error('permission-denied');
      rows.forEach(([path, value]) => state.docs.set(path, value));
    } };
  }
}));
import { loadFinanceDocument, prepareFinanceDocument, saveFinanceDocumentConfirmed } from '../../src/services/financeDocuments';
const original = (id: string, size = 16) => prepareFinanceDocument(id, `data:application/pdf;base64,${'A'.repeat(size)}`, `${id}.pdf`, 'application/pdf');
beforeEach(() => {
  state.docs.clear(); state.drive.clear(); state.batches = []; state.commits.mockReset().mockResolvedValue(undefined);
  state.driveUpload.mockReset().mockImplementation(async (input) => {
    const bytes = Buffer.from(input.dataUrl.split(',')[1], 'base64');
    const driveFileId = `drive-${input.documentId}`;
    state.drive.set(driveFileId, input.dataUrl);
    return { driveFileId, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, mimeType: input.mimeType, fileName: input.fileName };
  });
  state.driveLoad.mockReset().mockImplementation(async (ref) => {
    if (!state.drive.has(ref.driveFileId)) throw Object.assign(Error('Justificatif Drive indisponible.'), { code: 'drive/not-found' });
    return state.drive.get(ref.driveFileId);
  });
});
describe('Persistance des originaux dans Drive avec références Firestore légères', () => {
  it('conserve trois originaux de 4 Mo dans Drive et seulement trois petites références en base', async () => {
    const files = ['original-grand-a', 'original-grand-b', 'original-grand-c'].map(id => original(id, 5_590_000));
    for (const file of files) await saveFinanceDocumentConfirmed(file);
    expect(state.batches).toHaveLength(3);
    expect(state.driveUpload).toHaveBeenCalledTimes(3);
    expect(state.docs.size).toBe(3);
    expect(state.batches.every(rows => rows.length === 1 && Buffer.byteLength(JSON.stringify(rows)) < 1024)).toBe(true);
    expect([...state.docs.values()].every(value => value.provider === 'google-drive' && !('data' in value) && !('chunkCount' in value))).toBe(true);
    for (const file of files) expect((await loadFinanceDocument(file.id)).dataUrl).toBe(file.parts.join(''));
  });
  it('reprend un échec sans remplacer les originaux déjà confirmés', async () => {
    const first = original('original-premier'), second = original('original-suivant');
    await saveFinanceDocumentConfirmed(first);
    state.commits.mockRejectedValueOnce(Error('connexion interrompue'));
    await expect(saveFinanceDocumentConfirmed(second)).rejects.toThrow('interrompue');
    expect(state.docs.has(`financeDocuments/${second.id}`)).toBe(false);
    await saveFinanceDocumentConfirmed(first); // no write to immutable records
    await saveFinanceDocumentConfirmed(second);
    expect(state.batches).toHaveLength(3); // first success, second failure, second retry
    expect((await loadFinanceDocument(second.id)).fileName).toBe(second.fileName);
  });
  it('refuse une collision ou un original Drive indisponible sans le remplacer', async () => {
    const file = original('original-protege');
    await saveFinanceDocumentConfirmed(file);
    await expect(saveFinanceDocumentConfirmed({ ...file, fileName: 'autre.pdf' })).rejects.toThrow('autre original');
    state.drive.clear();
    await expect(saveFinanceDocumentConfirmed(file)).rejects.toThrow('indisponible');
    expect(state.batches).toHaveLength(1);
  });
  it('ne lance qu’un commit lorsque le même fichier est confirmé deux fois en parallèle', async () => {
    let resolve!: () => void;
    state.commits.mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
    const file = original('original-concurrent');
    const first = saveFinanceDocumentConfirmed(file), second = saveFinanceDocumentConfirmed(file);
    await vi.waitFor(() => expect(state.commits).toHaveBeenCalledOnce());
    resolve(); await Promise.all([first, second]);
    expect(state.batches).toHaveLength(1);
    expect(state.driveUpload).toHaveBeenCalledTimes(1);
  });
  it('ne programme aucune écriture Firestore si Drive refuse le quota ou la connexion', async () => {
    state.driveUpload.mockRejectedValueOnce(Object.assign(Error('Drive plein.'), { code: 'drive/quota' }));
    await expect(saveFinanceDocumentConfirmed(original('original-drive-quota'))).rejects.toMatchObject({ code: 'drive/quota' });
    expect(state.docs.size).toBe(0); expect(state.commits).not.toHaveBeenCalled();
  });
  it('refuse une confirmation Drive invalide avant la première écriture', async () => {
    state.driveUpload.mockResolvedValueOnce({ driveFileId: 'drive-original-invalid', bytes: 12, sha256: 'not-a-sha256', mimeType: 'application/pdf', fileName: 'f.pdf' });
    await expect(saveFinanceDocumentConfirmed(original('original-drive-invalid'))).rejects.toThrow('confirmation Drive est invalide');
    expect(state.commits).not.toHaveBeenCalled();
  });
  it('reconnaît une confirmation Firestore perdue après le commit du même original', async () => {
    state.commits.mockImplementationOnce(async () => {
      for (const [path, data] of state.batches.at(-1)!) state.docs.set(path, data);
      throw Error('Confirmation perdue');
    });
    const file = original('original-lost-ack');
    await saveFinanceDocumentConfirmed(file, 2025);
    expect(state.driveUpload.mock.calls[0][0].year).toBe(2025);
    expect((await loadFinanceDocument(file.id)).dataUrl).toBe(file.parts.join(''));
    expect(state.batches).toHaveLength(1);
  });
  it('relit les anciens chunks sans les réécrire et refuse les blocs absents ou modifiés', async () => {
    const file = original('original-legacy-preserved', 800_000);
    state.docs.set(`financeDocuments/${file.id}`, { id: file.id, fileName: file.fileName, mimeType: file.mimeType, chunkCount: file.parts.length, length: file.parts.join('').length });
    file.parts.forEach((data, index) => state.docs.set(`financeDocuments/${file.id}-${index}`, { id: `${file.id}-${index}`, documentId: file.id, index, data }));
    expect((await loadFinanceDocument(file.id)).dataUrl).toBe(file.parts.join(''));
    await saveFinanceDocumentConfirmed(file);
    expect(state.driveUpload).not.toHaveBeenCalled(); expect(state.commits).not.toHaveBeenCalled();
    state.docs.delete(`financeDocuments/${file.id}-1`);
    await expect(saveFinanceDocumentConfirmed(file)).rejects.toThrow('incomplet');
    await expect(loadFinanceDocument(file.id)).rejects.toThrow('indisponible');
    state.docs.set(`financeDocuments/${file.id}-1`, { id: `${file.id}-1`, documentId: 'another-original', index: 1, data: file.parts[1] });
    await expect(loadFinanceDocument(file.id)).rejects.toThrow('incomplet');
    expect(state.commits).not.toHaveBeenCalled();
  });
});
