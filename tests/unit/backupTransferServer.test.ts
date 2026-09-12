import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const mock = vi.hoisted(() => {
  class Stamp {
    constructor(public millis: number) {}
    toMillis() { return this.millis; }
    toDate() { return new Date(this.millis); }
    static now() { return new Stamp(Date.now()); }
    static fromMillis(millis: number) { return new Stamp(millis); }
  }
  const state = { docs: new Map<string, any>(), snapshots: new Map<number, Map<string, any>>(), writes: [] as Array<{ count: number; bytes: number; paths: string[] }>, failCollection: '' };
  const clone = (value: any): any => value instanceof Stamp ? new Stamp(value.millis) : Array.isArray(value) ? value.map(clone) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) : value;
  const snapshot = (path: string, source = state.docs): any => ({ id: path.split('/').at(-1), exists: source.has(path), data: () => clone(source.get(path)), ref: ref(path) });
  const ref = (path: string): any => ({ path, id: path.split('/').at(-1), get: async () => snapshot(path), collection: (name: string) => query(`${path}/${name}`),
    create: async (value: any) => { if (state.docs.has(path)) throw Error('exists'); state.docs.set(path, clone(value)); },
    update: async (value: any) => state.docs.set(path, { ...state.docs.get(path), ...clone(value) }) });
  const query = (path: string, config: any = {}): any => ({ path, query: true,
    doc: (id: string) => ref(`${path}/${id}`), orderBy: () => query(path, config),
    limit: (limit: number) => query(path, { ...config, limit }), startAfter: (after: string) => query(path, { ...config, after }),
    where: (field: string, op: string, value: any) => query(path, { ...config, filters: [...(config.filters ?? []), { field, op, value }] }),
    get: async () => querySnapshot(path, config), read: (source: Map<string, any>, time: Stamp) => querySnapshot(path, config, source, time) });
  const querySnapshot = (path: string, config: any, source = state.docs, time = Stamp.now()) => ({ readTime: time,
    docs: [...source.keys()].filter(key => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'))
      .sort().filter(key => (!config.after || key.slice(path.length + 1) > config.after) && (config.filters ?? []).every((filter: any) => {
        const actual = source.get(key)[filter.field];
        return filter.op === '==' ? actual === filter.value : filter.op === '<=' ? actual?.toMillis() <= filter.value.toMillis() : false;
      })).slice(0, config.limit ?? Infinity).map(key => snapshot(key, source)) });
  return { ...state, Stamp, clone, snapshot, ref, query, db: () => ({
    doc: ref, collection: query,
    recursiveDelete: async (document: any) => { for (const path of state.docs.keys()) if (path === document.path || path.startsWith(`${document.path}/`)) state.docs.delete(path); },
    runTransaction: async (fn: any, options: any = {}) => {
      const time = options.readTime ?? Stamp.now();
      if (options.readOnly && !options.readTime) state.snapshots.set(time.millis, new Map([...state.docs].map(([k, v]) => [k, clone(v)])));
      const source = options.readTime ? state.snapshots.get(time.millis)! : state.docs;
      const writes: any[] = [];
      const result = await fn({
        get: async (r: any) => r.query ? r.read(source, time) : snapshot(r.path, source),
        getAll: async (...refs: any[]) => refs.map(r => snapshot(r.path, source)),
        set: (r: any, value: any) => writes.push({ path: r.path, value }),
        update: (r: any, value: any) => writes.push({ path: r.path, value: { ...state.docs.get(r.path), ...value } }),
        delete: (r: any) => writes.push({ path: r.path, remove: true }),
        create: (r: any, value: any) => { if (state.docs.has(r.path)) throw Error('exists'); writes.push({ path: r.path, value }); }
      });
      if (options.readOnly && writes.length) throw Error('Read-only transaction wrote');
      if (state.failCollection && writes.some(w => w.path.startsWith(`${state.failCollection}/`))) throw Error('Interruption simulée');
      if (writes.length) state.writes.push({ count: writes.length, bytes: Buffer.byteLength(JSON.stringify(writes)), paths: writes.map(w => w.path) });
      for (const write of writes) write.remove ? state.docs.delete(write.path) : state.docs.set(write.path, clone(write.value));
      return result;
    }
  }), setFailure: (collection: string) => { state.failCollection = collection; } };
});
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ Timestamp: mock.Stamp, FieldPath: { documentId: () => '__name__' }, getFirestore: mock.db }));
import { transferBreweryData, cleanupBreweryTransfers } from '../../functions/src/backupTransfer';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const exportedAt = '2026-09-09T12:00:00.000Z';
const request = (data: any, uid = 'brewer') => ({ auth: { uid, token: { email: 'brewer@example.test', email_verified: true } }, data });
const call = (data: any, uid?: string): Promise<any> => transferBreweryData.run(request(data, uid) as any);
type Entry = { collection: string; id: string; data: any };
const recipe = (id: string): Entry => ({ collection: 'recipes', id, data: { id, name: 'Stout', volumeL: 24 } });
const payment = (id: string, transactionId = 'T1', amountCents = 4000): Entry => ({ collection: 'financialPayments', id, data: { id, transactionId, amountCents, direction: 'out', recordedAt: '2026-09-01T10:00:00Z' } });
const invoice = (id = 'T1', amountTTC = 100): Entry => ({ collection: 'transactions', id, data: { id, amountTTC, amountHT: amountTTC, tvaRate: 0, category: 'brassage' } });
function makePages(entries: Entry[], pageSize = 100) {
  const pages: string[] = [];
  for (let start = 0; start < entries.length || !start; start += pageSize) {
    const collections: Record<string, any[]> = {};
    for (const entry of entries.slice(start, start + pageSize)) (collections[entry.collection] ??= []).push({ id: entry.id, data: entry.data });
    if (!Object.keys(collections).length) collections.recipes = [];
    pages.push(JSON.stringify({ schemaVersion: 3, source: 'server', exportedAt, collections }));
    if (!entries.length) break;
  }
  return pages;
}
async function upload(entries: Entry[], operationId = 'restore-transfer-operation-123', pages = makePages(entries)) {
  const digest = hash(JSON.stringify({ exportedAt, pages: pages.map(hash), totalDocuments: entries.length }));
  const start = await call({ action: 'startRestore', operationId, pageCount: pages.length, totalDocuments: entries.length, exportedAt, digest });
  for (let pageIndex = start.nextPageIndex; pageIndex < pages.length; pageIndex++) await call({ action: 'uploadRestorePage', sessionId: start.sessionId, pageIndex, json: pages[pageIndex], sha256: hash(pages[pageIndex]) });
  return start.sessionId;
}
async function validate(sessionId: string) {
  let result;
  for (let i = 0; i < 100; i++) { result = await call({ action: 'validateRestore', sessionId }); if (result.phase === 'ready') return result; }
  throw Error('Validation did not finish');
}
async function apply(sessionId: string) {
  let result;
  for (let i = 0; i < 100; i++) { result = await applyOnce(sessionId); if (result.phase === 'complete') return result; }
  throw Error('Apply did not finish');
}
const driveFiles = new Map<string, { bytes: Buffer; mimeType: string }>();
const driveFetch = vi.fn(async (url: string, options: any) => {
  expect(options.headers.Authorization).toBe('Bearer synthetic-drive-token-only');
  const parsed = new URL(url), id = parsed.pathname.split('/').at(-1)!, file = driveFiles.get(id);
  if (!file) return new Response('{}', { status: 404 });
  return parsed.searchParams.get('alt') === 'media' ? new Response(new Uint8Array(file.bytes))
    : Response.json({ id, mimeType: file.mimeType, size: file.bytes.length, trashed: false, sha256Checksum: createHash('sha256').update(file.bytes).digest('hex') });
});
async function restoreInput(sessionId: string) {
  const step = await call({ action: 'prepareRestoreStep', sessionId });
  if (!step.original) return {};
  const original = step.original, driveFileId = `drive-restored-${original.id}`;
  driveFiles.set(driveFileId, { bytes: Buffer.from(original.dataUrl.slice(original.dataUrl.indexOf(',') + 1), 'base64'), mimeType: original.mimeType });
  return { driveOriginal: { id: original.id, provider: 'google-drive', driveFileId, sha256: original.sha256, bytes: original.bytes, mimeType: original.mimeType, fileName: original.fileName, createdAt: exportedAt }, driveAccessToken: 'synthetic-drive-token-only' };
}
async function applyOnce(sessionId: string, overrides: Record<string, unknown> = {}) {
  return call({ action: 'applyRestore', sessionId, ...await restoreInput(sessionId), ...overrides });
}
const businessPaths = () => [...mock.docs.keys()].filter(key => !key.startsWith('backupTransfers/'));
beforeEach(() => { mock.docs.clear(); mock.snapshots.clear(); mock.writes.length = 0; mock.setFailure(''); driveFiles.clear(); driveFetch.mockClear(); vi.stubGlobal('fetch', driveFetch); vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Sauvegarde serveur paginée', () => {
  it('exporte plus de 8 Mo à instant constant, avec pages bornées et répétables', async () => {
    for (let i = 0; i < 17; i++) mock.docs.set(`recipes/R-${String(i).padStart(3, '0')}`, { ...recipe(`R-${String(i).padStart(3, '0')}`).data, note: 'é'.repeat(320_000) });
    const start = await call({ action: 'startExport' });
    const pages = [];
    for (let pageIndex = 0; pageIndex < 20; pageIndex++) {
      const result = await call({ action: 'exportPage', sessionId: start.sessionId, pageIndex });
      expect(Buffer.byteLength(result.json)).toBeLessThanOrEqual(3_000_000);
      expect(hash(result.json)).toBe(result.sha256);
      if (!pageIndex) {
        mock.docs.set('recipes/R-016', { ...recipe('R-016').data, note: 'Nouveau contenu après début export' });
        mock.docs.set('recipes/new', recipe('new').data);
        expect(await call({ action: 'exportPage', sessionId: start.sessionId, pageIndex })).toEqual(result);
      }
      pages.push(result); if (result.done) break;
    }
    expect(pages.at(-1).done).toBe(true);
    expect(pages.at(-1).totalDocuments).toBe(17);
    expect(pages.reduce((sum, page) => sum + Buffer.byteLength(page.json), 0)).toBeGreaterThan(8_000_000);
    const rows = pages.flatMap(page => JSON.parse(page.json).collections.recipes ?? []);
    expect(rows.find(row => row.id === 'R-016').data.note).toBe('é'.repeat(320_000));
    expect(rows.some(row => row.id === 'new')).toBe(false);
  });
  it('refuse une autre identité, les sauts de page et les sessions expirées', async () => {
    const start = await call({ action: 'startExport' });
    await expect(call({ action: 'exportPage', sessionId: start.sessionId, pageIndex: 0 }, 'other')).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(call({ action: 'exportPage', sessionId: start.sessionId, pageIndex: 2 })).rejects.toMatchObject({ code: 'invalid-argument' });
    mock.docs.get(`backupTransfers/${start.sessionId}`).expiresAt = mock.Stamp.fromMillis(0);
    await expect(call({ action: 'exportPage', sessionId: start.sessionId, pageIndex: 0 })).rejects.toMatchObject({ code: 'deadline-exceeded' });
    await expect(transferBreweryData.run({ data: { action: 'startExport' } } as any)).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});

describe('Restauration volumineuse, validation et reprise', () => {
  it('restaure plus de 440 fiches sans plafond global et conserve journal, stock consommé et registres', async () => {
    const brewDay = { revision: 5, steps: [{ id: 'mash' }] }, stockConsumption = { appliedAt: exportedAt, items: [{ ref: 'MALT', quantity: 4 }] };
    mock.docs.set('batches/B1', { id: 'B1', volumeL: 24, brewDay, stockConsumption, stockAccountingVersion: 1 });
    mock.docs.set('auditLogs/H1', { id: 'H1', summary: 'Original' });
    const entries = [...Array.from({ length: 551 }, (_, index) => recipe(`R-${index}`)), { collection: 'batches', id: 'B1', data: { id: 'B1', volumeL: 24, brewDay: { revision: 0 } } }, { collection: 'auditLogs', id: 'H1', data: { id: 'H1', summary: 'Ancien' } }];
    const sessionId = await upload(entries);
    expect(businessPaths()).toHaveLength(2);
    await expect(call({ action: 'applyRestore', sessionId })).rejects.toThrow('validation complète');
    expect((await validate(sessionId)).checked).toBe(entries.length);
    const result = await apply(sessionId);
    expect(result).toMatchObject({ phase: 'complete', processed: entries.length, journalsPreserved: 1 });
    expect([...mock.docs.keys()].filter(key => key.startsWith('recipes/'))).toHaveLength(551);
    expect(mock.docs.get('batches/B1')).toMatchObject({ brewDay, stockConsumption, stockAccountingVersion: 1 });
    expect(mock.docs.get('auditLogs/H1').summary).toBe('Original');
    expect(mock.writes.every(write => write.count <= 202)).toBe(true);
    const size = mock.docs.size;
    expect(await apply(sessionId)).toEqual(result); expect(mock.docs.size).toBe(size);
  });
  it('reprend un groupe interrompu sans rejouer les groupes déjà appliqués', async () => {
    const entries = [{ collection: 'auditLogs', id: 'H1', data: { id: 'H1', summary: 'À garder' } }, ...Array.from({ length: 180 }, (_, i) => recipe(`R-${i}`))];
    const sessionId = await upload(entries); await validate(sessionId);
    await call({ action: 'applyRestore', sessionId });
    const applied = [...mock.docs.keys()].find(key => key.startsWith('recipes/'))!;
    mock.docs.set(applied, { ...mock.docs.get(applied), name: 'Modifié après import' });
    const cursor = mock.docs.get(`backupTransfers/${sessionId}`).applyCursor;
    mock.setFailure('recipes');
    await expect(call({ action: 'applyRestore', sessionId })).rejects.toThrow('Interruption');
    expect(mock.docs.get(`backupTransfers/${sessionId}`).applyCursor).toBe(cursor);
    mock.setFailure(''); await apply(sessionId);
    expect(mock.docs.get(applied).name).toBe('Modifié après import');
  });
  it('restaure plus de 8 Mo avec chaque groupe métier borné en octets, y compris une grande clôture', async () => {
    const entries = Array.from({ length: 17 }, (_, i) => ({ ...recipe(`R-${i}`), data: { ...recipe(`R-${i}`).data, note: 'é'.repeat(320_000) } }));
    entries.push({ collection: 'financialClosings', id: 'C1', data: { id: 'C1', year: 2025, report: { notes: 'x'.repeat(890_000) } } } as any);
    const sessionId = await upload(entries, 'restore-many-megabytes-123', makePages(entries, 3));
    await validate(sessionId); await apply(sessionId);
    expect(mock.docs.get('financialClosings/C1').report.notes).toHaveLength(890_000);
    expect(mock.writes.filter(write => write.paths.some(path => !path.startsWith('backupTransfers/'))).every(write => write.bytes < 3_020_000)).toBe(true);
  });
  it('ne recrée pas du malt consommé ni des bouteilles vendues en restaurant un ancien état', async () => {
    const rows: Entry[] = [
      { collection: 'stockItems', id: 'MALT', data: { ref: 'MALT', currentStock: 10, unit: 'kg' } },
      { collection: 'finishedGoods', id: 'FG1', data: { id: 'FG1', quantity: 50 } },
      { collection: 'reservations', id: 'RES1', data: { id: 'RES1', quantity: 5 } },
      { collection: 'kegs', id: 'K1', data: { id: 'K1', capacityL: 20, status: 'filled' } },
      { collection: 'batches', id: 'B1', data: { id: 'B1', volumeL: 30, recipeId: 'OLD' } }
    ];
    const current = [{ ref: 'MALT', currentStock: 7, unit: 'kg' }, { id: 'FG1', quantity: 35 }, { id: 'RES1', quantity: 2 }, { id: 'K1', capacityL: 20, status: 'empty' }, { id: 'B1', volumeL: 24, recipeId: 'NEW', stockConsumption: { items: [{ ref: 'MALT', quantity: 3 }] } }];
    rows.forEach((row, i) => mock.docs.set(`${row.collection}/${row.id}`, current[i]));
    rows.push({ collection: 'stockItems', id: 'NEW', data: { ref: 'NEW', currentStock: 1 } });
    const sessionId = await upload(rows); await validate(sessionId); const result = await apply(sessionId);
    rows.slice(0, 5).forEach((row, i) => expect(mock.docs.get(`${row.collection}/${row.id}`)).toEqual(current[i]));
    expect(mock.docs.get('stockItems/NEW').currentStock).toBe(1);
    expect(result.operationalPreserved).toBe(5);
  });
  it('refuse doublons, corruption et manifeste incomplet avant de modifier les données métier', async () => {
    const pages = makePages([recipe('R1'), recipe('R1')], 1);
    await expect(upload([recipe('R1'), recipe('R1')], 'restore-duplicate-test-123', pages)).rejects.toThrow('plusieurs pages');
    expect(businessPaths()).toEqual([]);
    const sessionId = await upload([recipe('R2')], 'restore-invalid-digest-123');
    mock.docs.get(`backupTransfers/${sessionId}`).digest = '0'.repeat(64);
    await expect(validate(sessionId)).rejects.toThrow('empreinte globale');
    expect(businessPaths()).toEqual([]);
    const start = await call({ action: 'startRestore', operationId: 'restore-incomplete-test-123', pageCount: 2, totalDocuments: 1, exportedAt, digest: '0'.repeat(64) });
    await expect(validate(start.sessionId)).rejects.toThrow('manquent');
    const page = makePages([recipe('R3')])[0];
    await expect(call({ action: 'uploadRestorePage', sessionId: start.sessionId, pageIndex: 0, json: page, sha256: '0'.repeat(64) })).rejects.toThrow('empreinte incorrecte');
  });
  it('accepte une répétition de téléversement et retrouve une opération sans doublon', async () => {
    const entry = recipe('R1'), pages = makePages([entry]);
    const sessionId = await upload([entry]);
    const count = mock.docs.size;
    expect((await call({ action: 'uploadRestorePage', sessionId, pageIndex: 0, json: pages[0], sha256: hash(pages[0]) })).nextPageIndex).toBe(1);
    expect(await upload([entry])).toBe(sessionId); expect(mock.docs.size).toBe(count);
    await expect(upload([recipe('different')])).rejects.toThrow('autre sauvegarde');
  });
});

describe('Intégrité des factures et paiements restaurés', () => {
  it('insère une pièce et ses paiements dans le même groupe atomique, avec règlement concurrent conservé', async () => {
    const incoming = invoice(), existing = payment('existing', 'T1', 1000);
    mock.docs.set('transactions/T1', incoming.data); mock.docs.set('financialPayments/existing', existing.data);
    const sessionId = await upload([incoming, payment('P1')]); await validate(sessionId);
    mock.docs.set('financialPayments/P2', payment('P2', 'T1', 2000).data);
    mock.docs.set('transactions/T1', { ...incoming.data, settlementBalanceCents: 3000, lastPaymentId: 'P2' });
    await apply(sessionId);
    expect(mock.docs.get('transactions/T1').settlementBalanceCents).toBe(7000);
    const group = mock.writes.find(write => write.paths.includes('financialPayments/P1'))!;
    expect(group.paths).toContain('transactions/T1');
    expect(mock.docs.get('financialPayments/P2').amountCents).toBe(2000);
  });
  it('ne remplace pas un règlement existant ou une clôture figée et garde les pièces annulées', async () => {
    const old = invoice(), cancelled = invoice('void'); cancelled.data.finance = { voidedAt: exportedAt };
    mock.docs.set('transactions/T1', old.data); mock.docs.set('transactions/void', cancelled.data);
    mock.docs.set('financialPayments/P1', payment('P1', 'T1', 1000).data);
    mock.docs.set('financialClosings/C1', { id: 'C1', year: 2025, report: { resultCents: 123 } });
    const sessionId = await upload([old, invoice('void'), payment('P1'), { collection: 'financialClosings', id: 'C1', data: { id: 'C1', year: 2025 } }]);
    await validate(sessionId); await apply(sessionId);
    expect(mock.docs.get('transactions/T1').settlementBalanceCents).toBe(1000);
    expect(mock.docs.get('financialPayments/P1').amountCents).toBe(1000);
    expect(mock.docs.get('transactions/void')).toEqual(cancelled.data);
    expect(mock.docs.get('financialClosings/C1').report.resultCents).toBe(123);
  });
  it('refuse un registre incompatible, une pièce absente et plus de 400 règlements sur une seule pièce avant mutation', async () => {
    for (const [index, entries] of [[recipe('R1'), invoice(), payment('P1', 'T1', 20000)], [recipe('R2'), payment('P2', 'absent')], [invoice(), ...Array.from({ length: 401 }, (_, i) => payment(`P-${i}`, 'T1', 1))]].entries()) {
      const sessionId = await upload(entries, `restore-finance-invalid-${index}-123`);
      await expect(validate(sessionId)).rejects.toThrow();
      expect(businessPaths()).toEqual([]);
    }
  });
  it('vérifie tous les blocs et références avant écriture et conserve les octets de l’original', async () => {
    const id = 'DOC-ORIGINAL-1234', dataUrl = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\nJustificatif de test\n%%EOF').toString('base64')}`;
    const metadata: Entry = { collection: 'financeDocuments', id, data: { id, fileName: 'Facture.pdf', mimeType: 'application/pdf', chunkCount: 1, length: dataUrl.length } };
    const chunk: Entry = { collection: 'financeDocuments', id: `${id}-0`, data: { id: `${id}-0`, documentId: id, index: 0, data: dataUrl } };
    const transaction = invoice(); transaction.data.finance = { proofDocumentId: id };
    const missing = await upload([metadata, transaction], 'restore-document-missing-123');
    await expect(validate(missing)).rejects.toThrow('manque'); expect(businessPaths()).toEqual([]);
    const referenceMissing = await upload([transaction], 'restore-reference-missing-123');
    await expect(validate(referenceMissing)).rejects.toThrow('incomplet'); expect(businessPaths()).toEqual([]);
    const sessionId = await upload([metadata, chunk, transaction], 'restore-document-valid-123');
    await validate(sessionId); await apply(sessionId);
    const stored = mock.docs.get(`financeDocuments/${id}`);
    expect(stored).toMatchObject({ provider: 'google-drive', fileName: 'Facture.pdf' });
    expect(driveFiles.get(stored.driveFileId)!.bytes.toString('base64')).toBe(dataUrl.slice(dataUrl.indexOf(',') + 1));
    expect(mock.docs.has(`financeDocuments/${id}-0`)).toBe(false);
    const firstOriginal = mock.writes.findIndex(write => write.paths.includes(`financeDocuments/${id}`));
    const invoiceWrite = mock.writes.findIndex(write => write.paths.includes('transactions/T1'));
    expect(firstOriginal).toBeLessThan(invoiceWrite);
  });
  it('restaure un gros PDF vérifié dans Drive, sans réinjecter ses blocs en base et avant sa clôture', async () => {
    const id = 'DOC-LARGE-PDF-1234', dataUrl = `data:application/pdf;base64,${Buffer.from(`%PDF-1.4\n${'x'.repeat(3_200_000)}\n%%EOF`).toString('base64')}`;
    const parts = Array.from({ length: Math.ceil(dataUrl.length / 400_000) }, (_, index) => dataUrl.slice(index * 400_000, (index + 1) * 400_000));
    const entries: Entry[] = [
      { collection: 'financeDocuments', id, data: { id, fileName: 'Grande facture.pdf', mimeType: 'application/pdf', chunkCount: parts.length, length: dataUrl.length } },
      ...parts.map((data, index) => ({ collection: 'financeDocuments', id: `${id}-${index}`, data: { id: `${id}-${index}`, documentId: id, index, data } })),
      { collection: 'financialClosings', id: 'C1', data: { id: 'C1', year: 2025, report: { documents: [{ proofDocumentId: id }] } } }
    ];
    const sessionId = await upload(entries, 'restore-atomic-original-123', makePages(entries, 5)); await validate(sessionId);
    mock.setFailure('financeDocuments');
    await expect(applyOnce(sessionId)).rejects.toThrow('Interruption');
    expect(businessPaths()).toEqual([]);
    mock.setFailure(''); await applyOnce(sessionId);
    expect(mock.docs.has('financialClosings/C1')).toBe(false);
    const restored = mock.docs.get(`financeDocuments/${id}`);
    expect(driveFiles.get(restored.driveFileId)!.bytes.toString('base64')).toBe(dataUrl.slice(dataUrl.indexOf(',') + 1));
    expect(parts.every((_, index) => !mock.docs.has(`financeDocuments/${id}-${index}`))).toBe(true);
    const group = mock.writes.find(write => write.paths.includes(`financeDocuments/${id}`))!;
    expect(group.paths.filter(path => path.startsWith('financeDocuments/'))).toHaveLength(1);
    expect(group.bytes).toBeLessThan(10_000);
    await apply(sessionId); expect(mock.docs.has('financialClosings/C1')).toBe(true);
  });
  it('bloque un original existant différent avant la validation et contrôle encore la collision à l’application', async () => {
    const id = 'DOC-COLLISION-1234', original = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\nVersion A\n%%EOF').toString('base64')}`;
    const other = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\nVersion B\n%%EOF').toString('base64')}`;
    const metadata: Entry = { collection: 'financeDocuments', id, data: { id, fileName: 'Facture.pdf', mimeType: 'application/pdf', chunkCount: 1, length: original.length } };
    const chunk: Entry = { collection: 'financeDocuments', id: `${id}-0`, data: { id: `${id}-0`, documentId: id, index: 0, data: original } };
    const transaction = invoice(); transaction.data.finance = { proofDocumentId: id };
    const rows = [metadata, chunk, transaction];
    const sessionId = await upload(rows); mock.docs.set(`financeDocuments/${id}`, metadata.data); mock.docs.set(`financeDocuments/${id}-0`, { ...chunk.data, data: other });
    await expect(validate(sessionId)).rejects.toThrow('contenu différent');
    expect(mock.docs.has('transactions/T1')).toBe(false);
    mock.docs.delete(`financeDocuments/${id}`); mock.docs.delete(`financeDocuments/${id}-0`); await validate(sessionId);
    mock.docs.set(`financeDocuments/${id}`, metadata.data); mock.docs.set(`financeDocuments/${id}-0`, { ...chunk.data, data: other });
    await expect(applyOnce(sessionId)).rejects.toThrow('contenu différent');
    expect(mock.docs.has('transactions/T1')).toBe(false); expect(mock.docs.get(`financeDocuments/${id}-0`).data).toBe(other);
  });
  it('n’applique aucun original sans accès Drive ni avec une empreinte client falsifiée', async () => {
    const { rows } = portableInvoice(); const sessionId = await upload(rows); await validate(sessionId);
    const input = await restoreInput(sessionId);
    await expect(call({ action: 'applyRestore', sessionId, ...input, driveAccessToken: '' })).rejects.toThrow('Connecte Drive');
    await expect(call({ action: 'applyRestore', sessionId, ...input, driveOriginal: { ...input.driveOriginal, sha256: '0'.repeat(64) } })).rejects.toThrow('ne correspond pas');
    expect(businessPaths()).toEqual([]); expect(driveFetch).not.toHaveBeenCalled();
  });
  it('calcule lui-même le SHA du téléchargement Drive avant d’associer une facture', async () => {
    const { rows } = portableInvoice(); const sessionId = await upload(rows); await validate(sessionId);
    const input = await restoreInput(sessionId), metadata = input.driveOriginal!;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('alt=media') ? new Response(new Uint8Array(Buffer.alloc(metadata.bytes, 65)))
      : Response.json({ id: metadata.driveFileId, mimeType: metadata.mimeType, size: metadata.bytes, trashed: false, sha256Checksum: metadata.sha256 })));
    await expect(call({ action: 'applyRestore', sessionId, ...input })).rejects.toThrow('contenu du fichier Drive');
    expect(businessPaths()).toEqual([]); expect(mock.docs.get(`backupTransfers/${sessionId}`).processed).toBe(0);
  });
  it('répare une ancienne référence Drive cassée avec le nouvel original identique vérifié', async () => {
    const { rows, id } = portableInvoice(); const sessionId = await upload(rows), input = await restoreInputForUnvalidated(sessionId);
    mock.docs.set(`financeDocuments/${id}`, { ...input.driveOriginal, driveFileId: 'old-drive-file-deleted' });
    await validate(sessionId); await apply(sessionId);
    const restored = mock.docs.get(`financeDocuments/${id}`);
    expect(restored.driveFileId).toBe(`drive-restored-${id}`); expect(restored.sha256).toBe(input.driveOriginal.sha256);
    expect(mock.docs.has(`financeDocuments/${id}-0`)).toBe(false); expect(mock.docs.get('transactions/T1').finance.proofDocumentId).toBe(id);
  });
  it('supprime les anciens blocs uniquement dans le commit atomique de la référence vérifiée', async () => {
    const { rows, id } = portableInvoice(); rows.filter(row => row.collection === 'financeDocuments').forEach(row => mock.docs.set(`${row.collection}/${row.id}`, row.data));
    const sessionId = await upload(rows); await validate(sessionId); const before = JSON.stringify(rows.slice(0, 2).map(row => mock.docs.get(`${row.collection}/${row.id}`)));
    mock.setFailure('financeDocuments'); await expect(applyOnce(sessionId)).rejects.toThrow('Interruption');
    expect(JSON.stringify(rows.slice(0, 2).map(row => mock.docs.get(`${row.collection}/${row.id}`)))).toBe(before);
    expect(mock.docs.has('transactions/T1')).toBe(false); mock.setFailure(''); await applyOnce(sessionId);
    expect(mock.docs.has(`financeDocuments/${id}-0`)).toBe(false); expect(mock.docs.get(`financeDocuments/${id}`).provider).toBe('google-drive');
    expect(mock.writes.find(write => write.paths.includes(`financeDocuments/${id}-0`))?.paths).toContain(`financeDocuments/${id}`);
  });
  it('ne stocke jamais les champs supplémentaires de la réponse Drive cliente', async () => {
    const { rows, id } = portableInvoice(); const sessionId = await upload(rows); await validate(sessionId); const input = await restoreInput(sessionId);
    await call({ action: 'applyRestore', sessionId, ...input, driveOriginal: { ...input.driveOriginal, accessToken: 'unwanted-oauth-secret', dataUrl: 'binary-must-not-return', sessionUrl: 'upload-session-private' } });
    const saved = mock.docs.get(`financeDocuments/${id}`);
    expect(Object.keys(saved).sort()).toEqual(['id', 'provider', 'driveFileId', 'sha256', 'bytes', 'mimeType', 'fileName', 'createdAt'].sort());
    expect(JSON.stringify(saved)).not.toContain('unwanted-oauth-secret'); expect(JSON.stringify(saved)).not.toContain('binary-must-not-return');
  });
  it('supprime les sessions expirées et leurs sous-collections privées', async () => {
    const sessionId = await upload([recipe('R1')]);
    mock.docs.get(`backupTransfers/${sessionId}`).expiresAt = mock.Stamp.fromMillis(0);
    mock.docs.set('recipes/existing', recipe('existing').data);
    await cleanupBreweryTransfers.run({} as any);
    expect([...mock.docs.keys()].some(path => path.startsWith('backupTransfers/'))).toBe(false);
    expect(mock.docs.get('recipes/existing')).toEqual(recipe('existing').data);
  });
});

function portableInvoice() {
  const id = 'DOC-DRIVE-SECURITY-1234', content = Buffer.from('%PDF-1.4\nOriginal de test securite\n%%EOF');
  const dataUrl = `data:application/pdf;base64,${content.toString('base64')}`;
  const metadata: Entry = { collection: 'financeDocuments', id, data: { id, fileName: 'Original.pdf', mimeType: 'application/pdf', chunkCount: 1, length: dataUrl.length, createdAt: exportedAt } };
  const chunk: Entry = { collection: 'financeDocuments', id: `${id}-0`, data: { id: `${id}-0`, documentId: id, index: 0, data: dataUrl } };
  const transaction = invoice(); transaction.data.finance = { proofDocumentId: id };
  return { id, content, rows: [metadata, chunk, transaction] };
}
async function restoreInputForUnvalidated(sessionId: string) {
  const { id, content } = portableInvoice();
  return { driveOriginal: { id, provider: 'google-drive', driveFileId: `drive-restored-${id}`, sha256: createHash('sha256').update(content).digest('hex'), bytes: content.length, mimeType: 'application/pdf', fileName: 'Original.pdf', createdAt: exportedAt } };
}
