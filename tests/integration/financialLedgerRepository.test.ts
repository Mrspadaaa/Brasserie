import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({
  listeners: new Map<string, any>(), queries: [] as any[], ledger: null as any, local: new Map<string, any[]>(), server: new Map<string, any>(),
  readPage: vi.fn(), pending: vi.fn(), commit: vi.fn()
}));
vi.mock('../../src/services/firebase', () => ({ db: {} }));
vi.mock('../../src/services/financialLedgerSync', () => ({ startFinancialLedgerSync: async (callbacks: any) => { sdk.ledger = callbacks; return { stop: vi.fn(), refresh: vi.fn() }; } }));
vi.mock('firebase/firestore', () => ({
  collection: (_: any, name: string) => ({ name }), doc: (_: any, name: string, id: string) => ({ name, id }),
  query: (source: any, ...constraints: any[]) => ({ ...source, constraints }), orderBy: (...args: any[]) => ({ orderBy: args }), documentId: () => '__name__', limit: (value: number) => ({ limit: value }), startAfter: (value: string) => ({ after: value }),
  onSnapshot: (source: any, _: any, next: any) => { sdk.queries.push(source); sdk.listeners.set(source.name, next); return () => sdk.listeners.delete(source.name); },
  getDocsFromCache: async (source: any) => ({ docs: (sdk.local.get(source.name) ?? []).map(value => ({ id: value.id, data: () => value, metadata: { hasPendingWrites: true } })) }),
  getDocsFromServer: (...args: any[]) => sdk.readPage(...args),
  getDocFromServer: async (source: any) => ({ id: source.id, exists: () => sdk.server.has(`${source.name}/${source.id}`), data: () => sdk.server.get(`${source.name}/${source.id}`), metadata: { fromCache: false, hasPendingWrites: false } }),
  waitForPendingWrites: () => sdk.pending(), writeBatch: () => ({ set: vi.fn(), delete: vi.fn(), commit: () => sdk.commit() }), deleteField: vi.fn(), increment: vi.fn()
}));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
const snap = (rows: any[] = []) => ({ docs: rows.map(value => ({ id: value.id, data: () => value, metadata: { hasPendingWrites: false } })), metadata: { fromCache: false, hasPendingWrites: false } });
const publish = (rows: any[] = [], detail = { covered: new Set<string>(), requestStartedAt: Date.now() }) => {
  sdk.ledger.onData(rows.map(value => ({ collection: 'transactions', id: value.id, data: value, version: '001789000000-000000000' })), detail);
  sdk.ledger.onState({ complete: true, loading: false, fromCache: false, loadedRows: rows.length });
};
beforeEach(async () => {
  FirestoreRepo.stopSync(); sdk.listeners.clear(); sdk.queries.length = 0; sdk.ledger = null; sdk.local.clear(); sdk.server.clear(); sdk.readPage.mockReset(); sdk.pending.mockReset().mockResolvedValue(undefined); sdk.commit.mockReset().mockResolvedValue(undefined);
});
afterEach(() => FirestoreRepo.stopSync());
const start = async (audit: any[] = []) => { FirestoreRepo.startSync(); await vi.waitFor(() => expect(sdk.ledger).not.toBeNull()); sdk.listeners.forEach((next, name) => next(snap(name === 'auditLogs' ? audit : []))); };

describe('Dépôt partagé avec registre comptable et journal borné', () => {
  it('attend le registre complet et ne crée aucun abonnement global aux transactions/paiements', async () => {
    await start(); expect(FirestoreRepo.isReady()).toBe(false);
    expect(sdk.queries.some(query => ['transactions', 'financialPayments'].includes(query.name))).toBe(false);
    publish([{ id: 'old-year', amountTTC: 100 }]); expect(FirestoreRepo.isReady()).toBe(true);
    expect(FirestoreRepo.all('transactions')).toHaveLength(1);
  });
  it('reprend les écritures SDK hors ligne sans les confondre avec un registre complet', async () => {
    let confirmed!: () => void; sdk.pending.mockReturnValue(new Promise<void>(resolve => { confirmed = resolve; }));
    sdk.local.set('transactions', [{ id: 'pending', amountTTC: 88 }]); await start();
    expect(FirestoreRepo.isReady()).toBe(false); publish([{ id: 'old-year', amountTTC: 100 }]);
    expect(FirestoreRepo.all('transactions')).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'pending', amountTTC: 88 }), expect.objectContaining({ id: 'old-year' })]));
    expect(FirestoreRepo.syncStatus().pending).toBe(true);
    sdk.server.set('transactions/pending', { id: 'pending', amountTTC: 88 }); confirmed();
    await vi.waitFor(() => expect(FirestoreRepo.syncStatus().pending).toBe(false));
    expect(FirestoreRepo.find('transactions', 'pending')).toMatchObject({ amountTTC: 88 });
  });
  it('un ancien delta ne remplace pas l’écriture locale dont le serveur vient de confirmer le montant', async () => {
    await start(); publish([{ id: 'T1', amountTTC: 10 }]);
    sdk.server.set('transactions/T1', { id: 'T1', amountTTC: 25 }); await FirestoreRepo.refreshDocument('transactions', 'T1');
    publish([{ id: 'T1', amountTTC: 10 }], { covered: new Set(['transactions/T1']), requestStartedAt: 0 });
    expect(FirestoreRepo.find('transactions', 'T1')).toMatchObject({ amountTTC: 25 });
    publish([{ id: 'T1', amountTTC: 30 }], { covered: new Set(['transactions/T1']), requestStartedAt: Date.now() + 1 });
    expect(FirestoreRepo.find('transactions', 'T1')).toMatchObject({ amountTTC: 30 });
  });
  it('le journal suit seulement ses 100 dernières entrées et charge les précédentes à la demande', async () => {
    const recent = Array.from({ length: 100 }, (_, i) => ({ id: `LOG-${String(200 - i).padStart(3, '0')}` }));
    await start(recent);
    sdk.listeners.get('auditLogs')(snap(recent));
    expect(sdk.queries.find(query => query.name === 'auditLogs').constraints).toContainEqual({ limit: 100 });
    expect(FirestoreRepo.auditHistoryStatus().complete).toBe(false); expect(sdk.readPage).not.toHaveBeenCalled();
    sdk.readPage.mockResolvedValue(snap([{ id: 'LOG-100' }, { id: 'LOG-099' }])); await FirestoreRepo.loadOlderAuditLogs();
    expect(sdk.readPage.mock.calls[0][0].constraints).toContainEqual({ after: 'LOG-101' });
    expect(FirestoreRepo.all('auditLogs')).toHaveLength(102); expect(FirestoreRepo.auditHistoryStatus().complete).toBe(true);
    sdk.listeners.get('auditLogs')(snap([{ id: 'LOG-201' }, ...recent.slice(0, 99)])); expect(FirestoreRepo.all('auditLogs')).toHaveLength(103);
  });
  it('conserve les pages déjà chargées après une panne et abandonne une réponse après déconnexion', async () => {
    const recent = Array.from({ length: 100 }, (_, i) => ({ id: `LOG-${String(200 - i).padStart(3, '0')}` })); await start(recent); sdk.listeners.get('auditLogs')(snap(recent));
    sdk.readPage.mockRejectedValueOnce(Error('offline')); await expect(FirestoreRepo.loadOlderAuditLogs()).rejects.toThrow('offline');
    expect(FirestoreRepo.all('auditLogs')).toHaveLength(100); expect(FirestoreRepo.auditHistoryStatus().error).toContain('conservés');
    let release!: (value: any) => void; sdk.readPage.mockReturnValueOnce(new Promise(resolve => { release = resolve; })); const older = FirestoreRepo.loadOlderAuditLogs();
    FirestoreRepo.stopSync(); release(snap([{ id: 'LOG-001' }])); await older; expect(FirestoreRepo.all('auditLogs')).toEqual([]);
  });
});
