import { describe, expect, it, vi } from 'vitest';
import { createFinancialLedgerSync, type FinancialLedgerTransport } from '../../src/services/financialLedgerSync';
import { validCachedFinancialLedger, type CachedFinancialLedger } from '../../src/services/financialLedgerCache';
import { FINANCIAL_CACHE_MAX_AGE, type FinancialSyncRow } from '../../functions/src/financialSyncTypes';

const owner = 'demo:brewer', asOf = '2026-09-09T12:00:00.000Z';
const row = (id: string, amount = 100, collection: FinancialSyncRow['collection'] = 'transactions', version = '001789000000-000000000'): FinancialSyncRow => ({ collection, id, version, data: { id, amount, ...(collection === 'financialPayments' ? { transactionId: 'T1' } : {}) } });
const cached = (rows = [row('T1')], cursor = 1): CachedFinancialLedger => ({ schemaVersion: 1, owner, complete: true, cursor, asOf, savedAt: Date.now(), rowCount: rows.length, rows });
const delta = (cursor: number, rows: FinancialSyncRow[] = [], done = true) => ({ cursor, rows, done, asOf });
function harness(cache: CachedFinancialLedger | null = null, handler?: (input: any) => any) {
  let notify!: () => void;
  const callbacks = { onData: vi.fn(), onState: vi.fn() }, saved: CachedFinancialLedger[] = [];
  const transport: FinancialLedgerTransport = { owner, call: vi.fn(async input => handler ? handler(input) : delta(cache?.cursor ?? 0)),
    readCache: vi.fn(async () => structuredClone(cache)), writeCache: vi.fn(async value => { saved.push(structuredClone(value)); }),
    watch: onRevision => { notify = onRevision; return vi.fn(); } };
  const sync = createFinancialLedgerSync(transport, callbacks);
  return { callbacks, transport, saved, sync, notify: () => notify() };
}
const settle = async (h: ReturnType<typeof harness>) => { await h.sync.refresh(); };

describe('Registre comptable complet et synchronisation incrémentale sans IA', () => {
  it('réutilise un cache complet et ne relit aucune ancienne facture inchangée', async () => {
    const h = harness(cached()); await settle(h);
    expect(h.callbacks.onData.mock.calls[0][0]).toEqual([row('T1')]);
    expect((h.transport.call as any).mock.calls.every(([input]: any[]) => input.action === 'delta' && input.cursor === 1)).toBe(true);
    expect(h.sync.state()).toMatchObject({ complete: true, loading: false, fromCache: false }); h.sync.stop();
  });
  it('ne publie pas une première copie tant que transactions ET paiements ne sont pas complets', async () => {
    let release!: (value: any) => void;
    const pending = new Promise(resolve => { release = resolve; });
    const h = harness(null, input => input.action === 'start' ? { sessionId: 'session', cursor: 0, asOf }
      : input.action === 'page' ? input.collectionIndex === 0
        ? { ...delta(0, [row('T1')], false), sessionId: 'session', pageIndex: 0, nextCollectionIndex: 1, nextAfterId: null }
        : pending : delta(0));
    await vi.waitFor(() => expect(h.sync.state().loadedRows).toBe(1));
    expect(h.callbacks.onData).not.toHaveBeenCalled(); expect(h.sync.state().complete).toBe(false);
    release({ ...delta(0, [row('P1', 100, 'financialPayments')]), sessionId: 'session', pageIndex: 1, nextCollectionIndex: 2, nextAfterId: null });
    await settle(h); expect(h.callbacks.onData.mock.calls.at(-1)![0]).toHaveLength(2); expect(h.saved.at(-1)?.rowCount).toBe(2); h.sync.stop();
  });
  it('garde le précédent registre complet si une page de changements échoue, puis reprend au même curseur', async () => {
    let fail = true;
    const h = harness(cached(), input => {
      if (input.cursor === 1) return delta(2, [row('T1', 200, 'transactions', '001789000001-000000000')], false);
      if (fail) throw Error('Réseau perdu');
      return delta(3, [row('P1', 200, 'financialPayments', '001789000002-000000000')]);
    });
    await settle(h);
    expect(h.callbacks.onData.mock.calls.at(-1)![0]).toEqual([row('T1')]); expect(h.saved).toEqual([]);
    fail = false; await h.sync.refresh();
    expect(h.callbacks.onData.mock.calls.at(-1)![0]).toEqual([row('T1', 200, 'transactions', '001789000001-000000000'), row('P1', 200, 'financialPayments', '001789000002-000000000')]);
    expect(h.saved.at(-1)?.cursor).toBe(3); h.sync.stop();
  });
  it('refait une copie complète si le journal de changements a expiré', async () => {
    const h = harness(cached(), input => input.action === 'start' ? { sessionId: 'new', cursor: 50, asOf }
      : input.action === 'page' ? { ...delta(50, input.collectionIndex === 0 ? [row('T2')] : [], input.collectionIndex === 1), sessionId: 'new', pageIndex: input.pageIndex, nextCollectionIndex: input.collectionIndex + 1, nextAfterId: null }
      : input.cursor === 1 ? { ...delta(50), reset: true } : delta(50));
    await settle(h); expect(h.callbacks.onData.mock.calls.at(-1)![0]).toEqual([row('T2')]); expect(h.saved.at(-1)?.cursor).toBe(50); h.sync.stop();
  });
  it('ouvre hors ligne seulement un registre antérieur complet et l’indique', async () => {
    const h = harness(cached(), () => { throw Error('Hors ligne'); }); await settle(h);
    expect(h.sync.state()).toMatchObject({ complete: true, fromCache: true }); expect(h.sync.state().error).toContain('Hors ligne');
    expect(h.callbacks.onData.mock.calls.at(-1)![0]).toEqual([row('T1')]); h.sync.stop();
  });
  it('sans cache et hors ligne, ne fabrique jamais un journal vide utilisable', async () => {
    const h = harness(null, () => { throw Error('Hors ligne'); }); await settle(h);
    expect(h.sync.state().complete).toBe(false); expect(h.callbacks.onData).not.toHaveBeenCalled(); expect(h.saved).toEqual([]); h.sync.stop();
  });
  it('isole les comptes et refuse cache expiré, tronqué ou document répété', () => {
    expect(validCachedFinancialLedger(cached(), owner)).toBe(true);
    expect(validCachedFinancialLedger(cached(), 'demo:other')).toBe(false);
    expect(validCachedFinancialLedger({ ...cached(), savedAt: Date.now() - FINANCIAL_CACHE_MAX_AGE - 1 }, owner)).toBe(false);
    expect(validCachedFinancialLedger({ ...cached(), rows: [] }, owner)).toBe(false);
    expect(validCachedFinancialLedger(cached([row('T1'), row('T1')]), owner)).toBe(false);
    expect(validCachedFinancialLedger({ ...cached(), complete: false }, owner)).toBe(false);
  });
  it('ignore une ancienne version et applique les suppressions sans recréer de paiement', async () => {
    const h = harness(cached([row('T1', 200, 'transactions', '001789000002-000000000'), row('P1', 100, 'financialPayments')]), () => delta(2, [row('T1'), { ...row('P1', 0, 'financialPayments', '001789000003-000000000'), data: null }]));
    await settle(h); expect(h.callbacks.onData.mock.calls.at(-1)![0]).toEqual([row('T1', 200, 'transactions', '001789000002-000000000')]);
    expect((h.transport.call as any).mock.calls.every(([input]: any[]) => input.action === 'delta')).toBe(true); h.sync.stop();
  });
  it('conserve les chiffres en mémoire mais signale une sauvegarde locale refusée', async () => {
    const h = harness(cached()); (h.transport.writeCache as any).mockRejectedValue(Error('QuotaExceededError')); await settle(h);
    expect(h.sync.state()).toMatchObject({ complete: true, fromCache: false }); expect(h.sync.state().cacheWarning).toContain('hors ligne'); h.sync.stop();
  });
  it('ne publie aucune réponse tardive après la déconnexion', async () => {
    let release!: (value: any) => void; const pending = new Promise(resolve => { release = resolve; });
    const h = harness(cached(), () => pending); await vi.waitFor(() => expect(h.callbacks.onData).toHaveBeenCalledOnce()); h.sync.stop();
    release(delta(2, [row('T2')])); await settle(h); expect(h.callbacks.onData).toHaveBeenCalledOnce(); expect(h.saved).toHaveLength(0);
  });
});
