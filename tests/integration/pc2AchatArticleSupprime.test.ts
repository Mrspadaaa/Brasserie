import { describe, it, expect, beforeEach, vi } from 'vitest';

// PC-2 (c) : un achat dont l'article a été supprimé s'annule quand même ; l'écart de stock est dit.
const store = new Map<string, Map<string, Record<string, unknown>>>();
const fakeRepo = {
  all: <T>(name: string): T[] => Array.from(store.get(name)?.entries() ?? []).map(([__docId, doc]) => ({ ...doc, __docId }) as T),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: (name: string, id: string, field: string, delta: number, extra: Record<string, unknown> = {}) => {
    const current = store.get(name)?.get(id) ?? {};
    fakeRepo.put(name, id, { ...extra, [field]: (Number(current[field]) || 0) + delta }, { merge: true });
  },
  remove: (name: string, id: string) => { store.get(name)?.delete(id); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));
const { StorageService } = await import('../../src/services/storage');
const { isActiveTransaction } = await import('../../src/domain/finance/ledger');
type T = import('../../src/types');

const achat = (): T['Transaction'] => ({ id: 'TX-ZZ', date: '10.11.2026', description: 'ZZ achat', category: 'brassage', amountHT: 12.5, amountTTC: 12.5, tvaRate: 0,
  stockImpact: [{ itemRef: 'MP-036', itemName: 'ZZ malt', addedQty: 5, unit: 'kg', itemType: 'rawMaterials' }] }) as T['Transaction'];

beforeEach(() => {
  store.clear(); localStorage.clear();
  StorageService.saveStocks({ rawMaterials: [{ id: 'RM-36', ref: 'MP-036', name: 'ZZ malt', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false } as T['StockItem']], cleaning: [] });
});

describe('PC-2 (c) : annuler un achat dont l’article est supprimé', () => {
  it('l’annulation passe, le stock n’est pas inventé, l’écart est dit', () => {
    StorageService.addTransaction(achat());
    StorageService.deleteStockItem('rawMaterials', 'MP-036');
    const res = StorageService.revertTransaction('TX-ZZ');
    expect(res.success).toBe(true);
    expect(res.message).toContain('ZZ malt');
    expect(res.message).toMatch(/supprimé/);
    expect(StorageService.getTransactions().find((t) => t.id === 'TX-ZZ')?.finance?.voidedAt).toBeTruthy();
    expect(StorageService.getTransactions().filter(isActiveTransaction)).toHaveLength(0);
    expect(StorageService.getStocks().rawMaterials.find((s) => s.ref === 'MP-036')).toBeUndefined();
  });
  it('un stock réellement consommé garde son refus', () => {
    StorageService.addTransaction(achat());
    StorageService.updateStockItem('rawMaterials', { id: 'RM-36', ref: 'MP-036', name: 'ZZ malt', category: 'Malt', unit: 'kg', currentStock: 1, minStock: 0, reorder: false } as T['StockItem']);
    expect(StorageService.revertTransaction('TX-ZZ').success).toBe(false);
  });
});
