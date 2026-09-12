import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { parseBackup } from '../../functions/src/backupCore';
import { BACKUP_COLLECTIONS } from '../../functions/src/dataSchema';
import { sessionEvents } from '../../functions/src/brewSessionCore';

const mock = vi.hoisted(() => ({
  docs: new Map<string, any>(), failHistory: false, commits: 0,
  snapshot: (path: string) => ({ exists: mock.docs.has(path), id: path.split('/').at(-1), data: () => structuredClone(mock.docs.get(path)) }),
  ref: (path: string): any => ({ path, update: async (value: any) => mock.docs.set(path, { ...mock.docs.get(path), ...value }),
    create: async (value: any) => { if (mock.docs.has(path)) throw { code: 6 }; mock.docs.set(path, value); } })
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  Timestamp: { now: () => new Date(), fromMillis: (n: number) => new Date(n) },
  getFirestore: () => ({ doc: mock.ref, collection: (name: string) => ({ collection: name }),
    batch: () => {
      const writes: any[] = [];
      return { create: (ref: any, data: any) => writes.push({ ref, data }), commit: async () => {
        if (writes.some(w => mock.docs.has(w.ref.path))) throw { code: 6 };
        for (const w of writes) mock.docs.set(w.ref.path, w.data);
      } };
    },
    runTransaction: async (fn: any) => {
      const writes: Array<{ path: string; value: any }> = [];
      const result = await fn({
        get: async (ref: any) => ref.collection ? { docs: [...mock.docs.keys()].filter(p => p.startsWith(ref.collection + '/')).map(mock.snapshot) } : mock.snapshot(ref.path),
        getAll: async (...refs: any[]) => refs.map(r => mock.snapshot(r.path)),
        set: (ref: any, value: any) => writes.push({ path: ref.path, value }),
        create: (ref: any, value: any) => { if (mock.docs.has(ref.path)) throw new Error('exists'); writes.push({ path: ref.path, value }); }
      });
      if (mock.failHistory && writes.some(w => w.path.startsWith('auditLogs/'))) throw new Error('interruption réseau');
      for (const w of writes) mock.docs.set(w.path, structuredClone(w.value));
      mock.commits++;
      return result;
    }
  })
}));
import { exportBreweryData, restoreBreweryData } from '../../functions/src/dataBackup';
import { recordDataChange } from '../../functions/src/dataHistory';
const request = (data: any = {}) => ({ auth: { uid: 'brewer', token: { email: 'brewer@example.test', email_verified: true } }, data });
const backup = (collections: any) => JSON.stringify({ schemaVersion: 3, source: 'server', exportedAt: '2026-09-07T12:00:00Z', collections });
const recipe = { id: 'R', name: 'Stout', volumeL: 24 };
beforeEach(() => { mock.docs.clear(); mock.failHistory = false; mock.commits = 0; vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test'); });
afterEach(() => vi.unstubAllEnvs());

describe('Validation intégrale des sauvegardes', () => {
  it('redirige l’ancien export vers les ZIP pour ne pas omettre les octets Drive', async () => {
    mock.docs.set('financeDocuments/original-drive', { id: 'original-drive', provider: 'google-drive' });
    await expect(exportBreweryData.run(request() as any)).rejects.toThrow('volumes ZIP');
    expect(mock.docs.size).toBe(1);
  });
  it('refuse la restauration binaire par l’ancien endpoint avant toute écriture', async () => {
    const json = backup({ financeDocuments: [{ id: 'original-legacy', data: { id: 'original-legacy', chunkCount: 1 } }] });
    await expect(restoreBreweryData.run(request({ json, operationId: 'restore-original-legacy' }) as any)).rejects.toThrow('restaurer sur Drive');
    expect(mock.docs.size).toBe(0); expect(mock.commits).toBe(0);
  });
  it('refuse une politique d’archivage invalide avant toute restauration', async () => {
    const row = { id: 'ARCHIVE-2025', year: 2025, status: 'archived', updatedAt: '2026-09-01T12:00:00.000Z', archivedAt: 'date-invalide', operationId: 'archive-backup-test' };
    const json = backup({ recipes: [{ id: 'R', data: recipe }], financialArchives: [{ id: row.id, data: row }] });
    await expect(restoreBreweryData.run(request({ json, operationId: 'restore-invalid-archive-123' }) as any)).rejects.toThrow();
    expect(mock.commits).toBe(0); expect(mock.docs.size).toBe(0);
  });
  it.each(['{}', '[]', '{"schemaVersion":99}', '{"schemaVersion":3,"exportedAt":"bad","collections":{}}'])('refuse %s sans écrire', async json => {
    await expect(restoreBreweryData.run(request({ json, operationId: 'validation-test-1234' }) as any)).rejects.toThrow();
    expect(mock.commits).toBe(0);
  });
  it('rejette un document tardif invalide avant la première écriture', async () => {
    const json = backup({ recipes: [{ id: 'R', data: recipe }], stockItems: [{ id: 'bad/path', data: { ref: 'bad/path' } }] });
    await expect(restoreBreweryData.run(request({ json, operationId: 'validation-test-1234' }) as any)).rejects.toThrow();
    expect(mock.docs.size).toBe(0);
  });
  it('valide types, doublons, identifiants, version et champs techniques', () => {
    expect(() => parseBackup(backup({ recipes: [{ id: 'R', data: { ...recipe, volumeL: '24' } }] }))).toThrow();
    expect(() => parseBackup(backup({ recipes: [{ id: 'R', data: recipe }, { id: 'R', data: recipe }] }))).toThrow();
    expect(() => parseBackup(backup({ brewPrivate: [{ id: 'x', data: { key: 'x' } }] }))).toThrow();
    expect(() => parseBackup(backup({ recipes: [{ id: 'R', data: { ...recipe, __docId: 'R' } }] }))).toThrow();
  });
  it('reprend un ancien export sans effacer les collections qu’il ne contenait pas', () => {
    const b = parseBackup(JSON.stringify({ schemaVersion: 2, recipes: [recipe], stocks: { rawMaterials: [{ ref: 'm', currentStock: 5 }] } }));
    expect(b.collections.recipes?.[0].id).toBe('R');
    expect(b.collections.stockItems?.[0].data.kind).toBe('rawMaterials');
    expect(b.collections.creativeItems).toBeUndefined();
  });
});

describe('Export et restauration serveur', () => {
  it('refuse les appels anonymes et les comptes non autorisés', async () => {
    await expect(exportBreweryData.run({ data: {} } as any)).rejects.toMatchObject({ code: 'unauthenticated' });
    const req = request(); req.auth.token.email = 'other@example.test';
    await expect(exportBreweryData.run(req as any)).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('exporte toutes les collections et tout l’historique avec un digest vérifiable', async () => {
    for (let i = 0; i < 650; i++) mock.docs.set(`auditLogs/LOG-${i}`, { id: `LOG-${i}`, summary: 'test' });
    mock.docs.set('creativeItems/idea', { id: 'idea', title: 'À conserver' });
    const result = await exportBreweryData.run(request() as any);
    const b = parseBackup(result.json);
    expect(Object.keys(b.collections)).toHaveLength(BACKUP_COLLECTIONS.length);
    expect(b.collections.brewerChats).toEqual([]);
    expect(b.collections.brewerContexts).toEqual([]);
    expect(b.collections.auditLogs).toHaveLength(650);
    expect(b.collections.creativeItems![0].data.title).toBe('À conserver');
    expect(createHash('sha256').update(result.json).digest('hex')).toBe(result.sha256);
  });
  it('sauvegarde et restaure le classement réversible, ses seuils et son audit sans modifier les pièces', async () => {
    const archived = { id: 'ARCHIVE-2025', year: 2025, status: 'archived', archivedAt: '2026-03-01T12:00:00.000Z', updatedAt: '2026-03-01T12:00:00.000Z', operationId: 'archive-backup-2025' };
    const opened = { id: 'ARCHIVE-2024', year: 2024, status: 'open', updatedAt: '2026-03-01T13:00:00.000Z', operationId: 'archive-open-2024' };
    const transaction = { id: 'old-invoice', date: '10.12.2025', amountHT: 100, amountTTC: 100, tvaRate: 0, tvaAmount: 0, settlementBalanceCents: 0, lastPaymentId: '' };
    const audit = { id: `ARCHIVE-${archived.operationId}`, entityId: archived.id, operationId: archived.operationId, summary: 'Classement' };
    mock.docs.set(`financialArchives/${archived.id}`, archived); mock.docs.set(`financialArchives/${opened.id}`, opened);
    mock.docs.set(`transactions/${transaction.id}`, transaction); mock.docs.set(`auditLogs/${audit.id}`, audit);
    const result = await exportBreweryData.run(request() as any);
    expect(parseBackup(result.json).collections.financialArchives).toHaveLength(2);
    mock.docs.clear();
    await restoreBreweryData.run(request({ json: result.json, operationId: 'restore-archive-roundtrip-123' }) as any);
    expect(mock.docs.get(`financialArchives/${archived.id}`)).toEqual(archived);
    expect(mock.docs.get(`financialArchives/${opened.id}`)).toEqual(opened);
    expect(mock.docs.get(`transactions/${transaction.id}`)).toEqual(transaction);
    expect(mock.docs.get(`auditLogs/${audit.id}`)).toEqual(audit);
    // An older backup with no archive collection cannot delete the current policies.
    await restoreBreweryData.run(request({ json: backup({ recipes: [{ id: 'R', data: recipe }] }), operationId: 'restore-old-no-archive-123' }) as any);
    expect(mock.docs.get(`financialArchives/${archived.id}`)).toEqual(archived);
    expect(mock.docs.get(`financialArchives/${opened.id}`)).toEqual(opened);
  });
  it('conserve le journal actif, les registres existants et les documents absents du fichier', async () => {
    const brewDay = { revision: 12, steps: [{ id: 'mash-0', durationMin: 60, startedAt: Date.now(), label: 'Palier' }], currentIndex: 0 };
    mock.docs.set('batches/B', { id: 'B', volumeL: 24, brewDay });
    mock.docs.set('recipes/untouched', { ...recipe, id: 'untouched' });
    mock.docs.set('auditLogs/L', { id: 'L', summary: 'Original' });
    const json = backup({ batches: [{ id: 'B', data: { id: 'B', volumeL: 24, brewDay: { revision: 1 } } }], auditLogs: [{ id: 'L', data: { id: 'L', summary: 'Modifié' } }] });
    const req = request({ json, operationId: 'restore-safe-12345' });
    const result = await restoreBreweryData.run(req as any);
    expect(result.journalsPreserved).toBe(1);
    expect(mock.docs.get('batches/B').brewDay).toEqual(brewDay);
    expect(mock.docs.get('auditLogs/L').summary).toBe('Original');
    expect(mock.docs.has('recipes/untouched')).toBe(true);
  });
  it('reprend après interruption sans rejouer les changements métier ni dupliquer les registres', async () => {
    const json = backup({ recipes: [{ id: 'R', data: recipe }], auditLogs: Array.from({ length: 650 }, (_, i) => ({ id: `L-${i}`, data: { id: `L-${i}` } })) });
    const req = request({ json, operationId: 'restore-retry-12345' });
    mock.failHistory = true;
    await expect(restoreBreweryData.run(req as any)).rejects.toThrow('interruption');
    expect(mock.docs.get('recipes/R')).toEqual(recipe);
    mock.docs.set('recipes/R', { ...recipe, name: 'Modifié après import' });
    mock.failHistory = false;
    await expect(restoreBreweryData.run(req as any)).resolves.toMatchObject({ complete: true });
    expect(mock.docs.get('recipes/R').name).toBe('Modifié après import');
    expect([...mock.docs.keys()].filter(p => p.startsWith('auditLogs/'))).toHaveLength(650);
    const size = mock.docs.size;
    await restoreBreweryData.run(req as any);
    expect(mock.docs.size).toBe(size);
  });
  it('préserve une pièce annulée et une clôture figée lors de la restauration d’anciens états', async () => {
    const cancelled = { id: 'T1', amountHT: 100, amountTTC: 100, tvaRate: 0, finance: { voidedAt: '2026-09-09T10:00:00Z' } };
    const frozen = { id: 'C1', year: 2026, report: { year: 2026, resultCents: 42_000 } };
    mock.docs.set('transactions/T1', cancelled); mock.docs.set('financialClosings/C1', frozen);
    mock.docs.set('transactions/absent-in-backup', { ...cancelled, id: 'absent-in-backup' });
    const json = backup({ transactions: [{ id: 'T1', data: { ...cancelled, finance: {} } }], financialClosings: [{ id: 'C1', data: { id: 'C1', year: 2026 } }] });
    await restoreBreweryData.run(request({ json, operationId: 'restore-finance-12345' }) as any);
    expect(mock.docs.get('transactions/T1')).toEqual(cancelled);
    expect(mock.docs.get('financialClosings/C1')).toEqual(frozen);
    expect(mock.docs.has('transactions/absent-in-backup')).toBe(true);
  });
  it('reconstruit le verrou des paiements du registre, sans restaurer un ancien solde nul', async () => {
    const tx = { id: 'T1', amountHT: 100, amountTTC: 100, tvaRate: 0, category: 'brassage', settlementBalanceCents: 4000, lastPaymentId: 'P1' };
    mock.docs.set('transactions/T1', tx);
    mock.docs.set('financialPayments/P1', { id: 'P1', transactionId: 'T1', amountCents: 4000, direction: 'out', date: '2026-09-01', recordedAt: '2026-09-01T10:00:00Z' });
    const json = backup({ transactions: [{ id: 'T1', data: { ...tx, settlementBalanceCents: 0, lastPaymentId: '' } }], financialPayments: [{ id: 'P1', data: { id: 'P1', transactionId: 'T1', amountCents: 9000, direction: 'out' } }] });
    await restoreBreweryData.run(request({ json, operationId: 'restore-guard-12345' }) as any);
    expect(mock.docs.get('transactions/T1')).toMatchObject({ settlementBalanceCents: 4000, lastPaymentId: 'P1' });
    expect(mock.docs.get('financialPayments/P1').amountCents).toBe(4000);
  });
  it('réserve le paiement à restaurer avant une interruption et reprend sans le compter deux fois', async () => {
    mock.docs.set('transactions/T1', { id: 'T1', amountHT: 100, amountTTC: 100, tvaRate: 0, category: 'brassage' });
    const json = backup({ auditLogs: [{ id: 'H', data: { id: 'H' } }], financialPayments: [{ id: 'P1', data: { id: 'P1', transactionId: 'T1', amountCents: 4000, direction: 'out', recordedAt: '2026-09-01T10:00:00Z' } }] });
    const req = request({ json, operationId: 'restore-guard-retry-12345' });
    mock.failHistory = true;
    await expect(restoreBreweryData.run(req as any)).rejects.toThrow('interruption');
    expect(mock.docs.get('transactions/T1').settlementBalanceCents).toBe(4000);
    mock.failHistory = false;
    await restoreBreweryData.run(req as any);
    expect(mock.docs.get('transactions/T1').settlementBalanceCents).toBe(4000);
    expect(mock.docs.get('financialPayments/P1').amountCents).toBe(4000);
  });
  it('refuse avant écriture un paiement restauré sur une pièce annulée', async () => {
    mock.docs.set('transactions/T1', { id: 'T1', amountHT: 100, amountTTC: 100, tvaRate: 0, finance: { voidedAt: '2026-09-01T10:00:00Z' } });
    const json = backup({ financialPayments: [{ id: 'P1', data: { id: 'P1', transactionId: 'T1', amountCents: 4000, direction: 'out' } }] });
    await expect(restoreBreweryData.run(request({ json, operationId: 'restore-guard-void-12345' }) as any)).rejects.toThrow('incompatible');
    expect(mock.commits).toBe(0);
    expect(mock.docs.has('financialPayments/P1')).toBe(false);
  });
  it('un journal restauré ne relance pas une ancienne sonnerie', async () => {
    const state = { steps: [{ id: 'mash-0', label: 'Palier', durationMin: 60, startedAt: Date.now() }], currentIndex: 0 };
    const json = backup({ batches: [{ id: 'B', data: { id: 'B', volumeL: 24, brewDay: state } }] });
    await restoreBreweryData.run(request({ json, operationId: 'restore-alarm-12345' }) as any);
    expect(sessionEvents(mock.docs.get('batches/B').brewDay, {})).toEqual([]);
  });
  it('préserve aussi les quantités et les brassins actifs depuis l’ancien endpoint', async () => {
    const currentStock = { ref: 'MALT', currentStock: 7, unit: 'kg' };
    const currentBatch = { id: 'B', volumeL: 24, recipeId: 'CURRENT', stockConsumption: { items: [{ ref: 'MALT', quantity: 3 }] } };
    mock.docs.set('stockItems/MALT', currentStock); mock.docs.set('batches/B', currentBatch);
    const json = backup({ stockItems: [{ id: 'MALT', data: { ...currentStock, currentStock: 10 } }], batches: [{ id: 'B', data: { id: 'B', volumeL: 30, recipeId: 'OLD' } }] });
    const result = await restoreBreweryData.run(request({ json, operationId: 'restore-operational-12345' }) as any);
    expect(mock.docs.get('stockItems/MALT')).toEqual(currentStock);
    expect(mock.docs.get('batches/B')).toEqual(currentBatch);
    expect(result.operationalPreserved).toBe(2);
  });
});

describe('Historique observé par le serveur', () => {
  it('consigne chaque variation réelle de stock sans doublon et sans assimiler un changement d’unité à une consommation', async () => {
    const event = { params: { collection: 'stockItems', documentId: 'M' }, id: 'stock1', source: 'firestore', time: new Date().toISOString(), authType: 'system',
      data: { before: { data: () => ({ ref: 'M', currentStock: 12, unit: 'kg' }) }, after: { data: () => ({ ref: 'M', currentStock: 9.5, unit: 'kg' }) } } };
    await recordDataChange.run(event as any); await recordDataChange.run(event as any);
    const movements = [...mock.docs].filter(([path]) => path.startsWith('movements/'));
    expect(movements).toHaveLength(1); expect(movements[0][1].delta).toBe(-2.5);
    await recordDataChange.run({ ...event, id: 'unit-change', data: { ...event.data, after: { data: () => ({ ref: 'M', currentStock: 12000, unit: 'g' }) } } } as any);
    expect([...mock.docs].filter(([p, v]) => p.startsWith('movements/') && v.delta === null)).toHaveLength(1);
  });
  it('conserve avant/après, auteur et champs modifiés une seule fois par événement', async () => {
    const event = { params: { collection: 'recipes', documentId: 'R' }, id: 'event1', source: 'firestore', time: new Date().toISOString(), authType: 'system',
      data: { before: { data: () => recipe }, after: { data: () => ({ ...recipe, volumeL: 22 }) } } };
    await recordDataChange.run(event as any); await recordDataChange.run(event as any);
    expect(mock.docs.size).toBe(1);
    const row = [...mock.docs.values()][0];
    expect(row.changedFields).toEqual(['volumeL']); expect(row.before.volumeL).toBe(24); expect(row.after.volumeL).toBe(22);
    await recordDataChange.run({ ...event, params: { ...event.params, collection: 'dataHistory' } } as any);
    expect(mock.docs.size).toBe(1);
  });
});
