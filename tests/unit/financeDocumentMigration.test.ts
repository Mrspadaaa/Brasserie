import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const memory = vi.hoisted(() => {
  const docs = new Map<string, any>(), writes: string[][] = [];
  let beforeTransaction: (() => void) | undefined, rejectCommit = false;
  const clone = (value: any) => value === undefined ? undefined : structuredClone(value);
  const snapshot = (path: string): any => { const value = clone(docs.get(path)); return { id: path.split('/').at(-1), exists: value !== undefined, data: () => clone(value), ref: ref(path) }; };
  const ref = (path: string): any => ({ path, id: path.split('/').at(-1), get: async () => snapshot(path) });
  const query = (path: string, size = Infinity, after = ''): any => ({ orderBy: () => query(path, size, after), limit: (count: number) => query(path, count, after), startAfter: (id: string) => query(path, size, id),
    get: async () => { const rows = [...docs.keys()].filter(key => key.startsWith(`${path}/`) && key.slice(path.length + 1) > after).sort().slice(0, size).map(snapshot); return { docs: rows, size: rows.length }; } });
  const db = () => ({ doc: ref, collection: query, getAll: async (...refs: any[]) => refs.map(item => snapshot(item.path)),
    runTransaction: async (handler: any) => {
      beforeTransaction?.(); beforeTransaction = undefined;
      const pending: any[] = [];
      const result = await handler({ get: async (item: any) => snapshot(item.path), getAll: async (...refs: any[]) => refs.map(item => snapshot(item.path)),
        create: (item: any, value: any) => { if (docs.has(item.path)) throw Error('exists'); pending.push({ path: item.path, value }); },
        set: (item: any, value: any) => pending.push({ path: item.path, value }), delete: (item: any) => pending.push({ path: item.path, remove: true }),
        update: (item: any, changes: any) => {
          const value = clone(docs.get(item.path));
          for (const [field, next] of Object.entries(changes)) {
            const keys = field.split('.'); let target = value;
            for (const key of keys.slice(0, -1)) target = target[key] ??= {};
            if ((next as any)?.__delete) delete target[keys.at(-1)!]; else target[keys.at(-1)!] = clone(next);
          }
          pending.push({ path: item.path, value });
        } });
      if (rejectCommit) throw Error('Commit refusé');
      pending.forEach(item => item.remove ? docs.delete(item.path) : docs.set(item.path, clone(item.value)));
      writes.push(pending.map(item => item.path)); return result;
    }
  });
  return { docs, writes, db, reset: () => { docs.clear(); writes.length = 0; beforeTransaction = undefined; rejectCommit = false; }, before: (fn: () => void) => { beforeTransaction = fn; }, failCommit: (value: boolean) => { rejectCommit = value; } };
});
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ getFirestore: memory.db, FieldPath: { documentId: () => '__name__' }, FieldValue: { delete: () => ({ __delete: true }) } }));
import { migrateFinanceDocuments } from '../../functions/src/financeDocumentMigration';
import { decodeOriginal, verifyDriveOriginal } from '../../functions/src/driveOriginalVerification';

const id = 'DOC-MIGRATION-1234', token = 'synthetic-drive-token-only';
const content = Buffer.from('%PDF-1.4\nOriginal intact de migration\n%%EOF'), sha256 = createHash('sha256').update(content).digest('hex');
const url = `data:application/pdf;base64,${content.toString('base64')}`;
const metadata = (originalId = id, bytes = content) => ({ id: originalId, provider: 'google-drive', driveFileId: 'private-drive-file-1234', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), mimeType: 'application/pdf', fileName: 'Facture.pdf', createdAt: '2026-09-09T12:00:00Z' });
const request = (data: any) => ({ data, auth: { uid: 'brewer', token: { email: 'brewer@example.test', email_verified: true } } });
const call = (data: any): Promise<any> => migrateFinanceDocuments.run(request(data) as any);
let driveContent = content, driveStatus = 200, trash = false;
const fetchDrive = vi.fn(async (url: string, options: any) => {
  expect(options.headers.Authorization).toBe(`Bearer ${token}`); expect(options.redirect).toBe('error');
  if (driveStatus !== 200) return new Response('{}', { status: driveStatus });
  const file = metadata();
  return url.includes('alt=media') ? new Response(new Uint8Array(driveContent)) : Response.json({ id: file.driveFileId, mimeType: file.mimeType, size: file.bytes, sha256Checksum: file.sha256, trashed: trash });
});
function seedChunks() {
  memory.docs.set(`financeDocuments/${id}`, { id, fileName: 'Facture.pdf', mimeType: 'application/pdf', chunkCount: 2, length: url.length, createdAt: '2025-06-02T12:00:00Z' });
  const split = Math.floor(url.length / 2);
  [url.slice(0, split), url.slice(split)].forEach((data, index) => memory.docs.set(`financeDocuments/${id}-${index}`, { id: `${id}-${index}`, documentId: id, index, data }));
}
const migrate = (source = { kind: 'document', id }, driveOriginal = metadata(), driveAccessToken = token) => call({ action: 'migrate', source, driveOriginal, driveAccessToken });
beforeEach(() => { memory.reset(); driveContent = content; driveStatus = 200; trash = false; fetchDrive.mockClear(); vi.stubGlobal('fetch', fetchDrive); vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Migration vers Drive avec preuve du contenu avant suppression', () => {
  it('migre l’original sans altérer les octets et retire les blocs dans le même commit', async () => {
    seedChunks(); const original = await call({ action: 'read', source: { kind: 'document', id } });
    expect(original).toMatchObject({ dataUrl: url, sha256, bytes: content.length, year: 2025 });
    const result = await migrate(); expect(result).toMatchObject({ migrated: true, bytes: content.length });
    expect(memory.docs.get(`financeDocuments/${id}`)).toMatchObject({ provider: 'google-drive', sha256, bytes: content.length });
    expect(memory.docs.has(`financeDocuments/${id}-0`)).toBe(false); expect(memory.docs.has(`financeDocuments/${id}-1`)).toBe(false);
    expect(memory.writes).toHaveLength(1); expect(memory.writes[0]).toEqual(expect.arrayContaining([`financeDocuments/${id}`, `financeDocuments/${id}-0`, `financeDocuments/${id}-1`, `financeDocumentMigrations/${id}`]));
    expect(JSON.stringify([...memory.docs])).not.toContain(token); expect(JSON.stringify([...memory.docs])).not.toContain('base64,');
    expect(await migrate()).toMatchObject({ done: true, migrated: false }); expect(fetchDrive).toHaveBeenCalledTimes(2); expect(memory.writes).toHaveLength(1);
  });
  it('conserve la transaction, ses catégories et ses règlements lors de la migration d’un ancien PDF jsPDF', async () => {
    const source = { kind: 'transaction', id: 'OLD-SALE' };
    const legacyUrl = url.replace(';base64,', ';filename=generated.pdf;base64,');
    memory.docs.set('transactions/OLD-SALE', { id: 'OLD-SALE', proofUrl: legacyUrl, proofFileName: 'Vente.pdf', date: '03.08.2024', amountTTC: 150, settlementBalanceCents: 15000, finance: { version: 1, kind: 'sale', paymentStatus: 'paid' } });
    const original = await call({ action: 'read', source }); expect(original.dataUrl).toBe(url); expect(original.sha256).toBe(sha256); expect(original.year).toBe(2024);
    await migrate(source, metadata(original.id));
    const saved = memory.docs.get('transactions/OLD-SALE'); expect(saved).toMatchObject({ amountTTC: 150, settlementBalanceCents: 15000, syncedToDrive: true, finance: { version: 1, kind: 'sale', paymentStatus: 'paid', proofDocumentId: original.id } });
    expect(saved.proofUrl).toBeUndefined(); expect(memory.docs.get(`financeDocuments/${original.id}`).fileName).toBe('Vente.pdf');
  });
  it('ne supprime aucun bloc si Drive est inaccessible, non autorisé ou si le jeton est absent', async () => {
    for (const status of [401, 403, 404]) {
      memory.reset(); seedChunks(); driveStatus = status; const before = JSON.stringify([...memory.docs]);
      await expect(migrate()).rejects.toThrow(); expect(JSON.stringify([...memory.docs])).toBe(before); expect(memory.writes).toEqual([]);
    }
    driveStatus = 200; await expect(migrate({ kind: 'document', id }, metadata(), '')).rejects.toThrow('Connecte Drive'); expect(memory.writes).toEqual([]);
  });
  it('rejette un fichier dans la corbeille et un téléchargement dont les octets diffèrent du SHA annoncé', async () => {
    seedChunks(); trash = true; await expect(migrate()).rejects.toThrow('ne correspond pas'); expect(memory.writes).toEqual([]);
    trash = false; driveContent = Buffer.alloc(content.length, 88); await expect(migrate()).rejects.toThrow('contenu du fichier Drive');
    expect(memory.docs.get(`financeDocuments/${id}-0`).data).toBe(url.slice(0, Math.floor(url.length / 2))); expect(memory.writes).toEqual([]);
  });
  it('détecte la modification concurrente de l’original après sa vérification Drive', async () => {
    seedChunks(); memory.before(() => memory.docs.get(`financeDocuments/${id}-1`).data += 'modifié');
    await expect(migrate()).rejects.toMatchObject({ code: 'aborted' }); expect(memory.writes).toEqual([]);
    expect(memory.docs.get(`financeDocuments/${id}`).chunkCount).toBe(2); expect(memory.docs.has(`financeDocuments/${id}-0`)).toBe(true);
  });
  it('préserve intégralement les anciens documents si le commit serveur échoue', async () => {
    seedChunks(); const before = JSON.stringify([...memory.docs]); memory.failCommit(true);
    await expect(migrate()).rejects.toThrow('Commit refusé'); expect(JSON.stringify([...memory.docs])).toBe(before);
    memory.failCommit(false); await expect(migrate()).resolves.toMatchObject({ migrated: true });
  });
  it('refuse une collision sur la destination d’une facture inline', async () => {
    const source = { kind: 'transaction', id: 'OLD-SALE' }; memory.docs.set('transactions/OLD-SALE', { id: source.id, proofUrl: url, proofFileName: 'Facture.pdf', amountTTC: 25 });
    const original = await call({ action: 'read', source }); memory.docs.set(`financeDocuments/${original.id}`, { ...metadata(original.id), sha256: '0'.repeat(64) });
    await expect(migrate(source, metadata(original.id))).rejects.toMatchObject({ code: 'already-exists' });
    expect(memory.docs.get('transactions/OLD-SALE').proofUrl).toBe(url); expect(memory.writes).toEqual([]);
  });
  it('ne migre ni ne télécharge un original dont un bloc est absent', async () => {
    seedChunks(); memory.docs.delete(`financeDocuments/${id}-1`); await expect(migrate()).rejects.toThrow('manque'); expect(fetchDrive).not.toHaveBeenCalled(); expect(memory.writes).toEqual([]);
  });
  it('pagine les candidats, ignore les références Drive et refuse les identités/sources invalides', async () => {
    for (let i = 0; i < 35; i++) memory.docs.set(`transactions/T${String(i).padStart(2, '0')}`, { id: `T${i}`, proofUrl: i % 2 ? url : undefined });
    const first = await call({ action: 'list', kind: 'transaction' }); expect(first.inspected).toBe(30); expect(first.candidates).toHaveLength(15); expect(first.done).toBe(false);
    const last = await call({ action: 'list', kind: 'transaction', after: first.after }); expect(last.inspected).toBe(5); expect(last.done).toBe(true);
    await expect(call({ action: 'read', source: { kind: 'document', id: '../bad' } })).rejects.toMatchObject({ code: 'invalid-argument' });
    await expect(migrateFinanceDocuments.run({ data: { action: 'list' } } as any)).rejects.toMatchObject({ code: 'unauthenticated' });
  });
  it('refuse URL arbitraire, base64 non canonique et PDF tronqué sans accès réseau', async () => {
    expect(() => decodeOriginal('https://example.test/file.pdf', 'application/pdf')).toThrow();
    expect(() => decodeOriginal(url + ' ', 'application/pdf')).toThrow();
    expect(() => decodeOriginal(`data:application/pdf;base64,${Buffer.from('%PDF-1.4 sans fin').toString('base64')}`, 'application/pdf')).toThrow();
    await expect(verifyDriveOriginal({ ...metadata(), driveFileId: 'https://attacker.test/file' }, token)).rejects.toThrow('Référence Drive');
    expect(fetchDrive).not.toHaveBeenCalled();
  });
  it('ne persiste aucun champ inconnu, jeton ou binaire transmis dans les métadonnées clientes', async () => {
    seedChunks();
    await migrate({ kind: 'document', id }, { ...metadata(), accessToken: 'unwanted-oauth-secret', dataUrl: url, sessionUrl: 'https://upload.example.invalid/private-session' } as any);
    const serialized = JSON.stringify([...memory.docs]);
    expect(serialized).not.toContain('unwanted-oauth-secret'); expect(serialized).not.toContain('base64,'); expect(serialized).not.toContain('sessionUrl');
    expect(Object.keys(memory.docs.get(`financeDocuments/${id}`)).sort()).toEqual(['id', 'provider', 'driveFileId', 'sha256', 'bytes', 'mimeType', 'fileName', 'createdAt'].sort());
  });
});
