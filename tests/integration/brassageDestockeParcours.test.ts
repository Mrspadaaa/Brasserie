import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * PC-1 (parcours complet du 10.11, VERDICT n° 7) : un jour de brassage conduit jusqu'à l'ensemencement doit
 * retirer le malt du stock et passer le brassin en fermentation, même quand la levure n'est pas renseignée
 * (recette sans levure, « Sans mesure » choisi). Une seule fois ; réversible par une correction d'inventaire.
 *
 * L'inconnu n'est jamais 0 : la levure non pesée n'est pas déstockée, elle est dite « à régulariser ».
 */

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
type T = import('../../src/types');

const stock = (over: Partial<T['StockItem']>): T['StockItem'] =>
  ({ id: over.ref, ref: 'X', name: 'X', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false, ...over }) as T['StockItem'];

// La recette telle que l'assistant l'écrit pour « malt seul » : ni houblon, ni levure précisée (nom vide, dose 0).
const recipe = (malt: Record<string, unknown> = {}): T['Recipe'] => ({
  id: 'REC-ZZ', name: 'ZZ TEST', style: 'American Pale Ale', volumeL: 24, boilMin: 60, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5,
  fermentables: [{ name: 'ZZ malt', weightKg: 5, kind: 'grain', use: 'empatage', ...malt }],
  hops: [], yeast: { name: '', form: 'sèche', qty: 0, unit: '' }
}) as unknown as T['Recipe'];

// L'état du jour de brassage après le geste « Sans mesure » puis « J'ai ajouté la levure ».
const jourConduit = (extra: Record<string, unknown> = {}) => ({
  currentIndex: 8, steps: [], readings: [], pitchedAt: 1000, pitchQuantityConfirmation: 'unmeasured',
  additions: { 'grain-0': { doneAt: 900 } }, ...extra
});

beforeEach(() => {
  store.clear(); localStorage.clear();
  StorageService.saveStocks({
    rawMaterials: [
      stock({ ref: 'MP-036', name: 'ZZ malt', category: 'Malt', unit: 'kg', currentStock: 5 }),
      stock({ ref: 'MP-038', name: 'ZZ levure', category: 'Levure', unit: 'sachet', currentStock: 3 })
    ],
    cleaning: []
  });
});
const refStock = (ref: string) => StorageService.getStocks().rawMaterials.find((i) => i.ref === ref)?.currentStock;

describe('PC-1 : le jour de brassage retire le malt', () => {
  it.each([
    ['malt rapproché par son nom', {}],
    ['malt lié à son article (stockItemRef)', { stockItemRef: 'MP-036' }]
  ])('%s : 5 kg → 0, brassin en fermentation, levure dite « à régulariser »', (_nom, malt) => {
    const batch = StorageService.planRecipeBatch(recipe(malt), 'LOT-ZZ');
    const result = StorageService.completeBrewStock({ ...batch, status: 'fermentation', brewDay: jourConduit() as never });
    expect(refStock('MP-036')).toBe(0);
    expect(refStock('MP-038')).toBe(3);
    const stored = StorageService.getBatches().find((b) => b.id === 'LOT-ZZ')!;
    expect(stored.status).toBe('fermentation');
    expect(result.success).toBe(true);
    expect(stored.stockConsumption?.items).toEqual([{ stockItemRef: 'MP-036', quantity: 5, unit: 'kg' }]);
    expect(stored.stockReviewIssues?.join(' ')).toContain('Levure');
    expect(fakeRepo.all('movements')).toHaveLength(1);
  });

  it('une seule fois : le second geste ne retire rien de plus', () => {
    const batch = StorageService.planRecipeBatch(recipe(), 'LOT-ZZ');
    const fin = { ...batch, status: 'fermentation' as const, brewDay: jourConduit() as never };
    StorageService.completeBrewStock(fin);
    StorageService.completeBrewStock(fin);
    expect(refStock('MP-036')).toBe(0);
    expect(fakeRepo.all('movements')).toHaveLength(1);
  });

  it('R2 : un manque réel de stock ne bloque plus le brassin ; l’article reste intact et dit « à régulariser »', () => {
    StorageService.saveStocks({ rawMaterials: [stock({ ref: 'MP-036', name: 'ZZ malt', currentStock: 2 })], cleaning: [] });
    const batch = StorageService.planRecipeBatch(recipe(), 'LOT-ZZ');
    const result = StorageService.completeBrewStock({ ...batch, status: 'fermentation', brewDay: jourConduit() as never });
    expect(result.success).toBe(true);
    expect(refStock('MP-036')).toBe(2);
    expect(result.issues.join(' ')).toContain('ZZ malt');
    expect(StorageService.getBatches().find((b) => b.id === 'LOT-ZZ')!.status).toBe('fermentation');
  });

  it('une levure réellement mesurée mais sans article associé : le malt part, la levure reste à régulariser', () => {
    const batch = StorageService.planRecipeBatch(recipe(), 'LOT-ZZ');
    const brewDay = jourConduit({ pitchQuantityConfirmation: 'measured', additions: { 'grain-0': { doneAt: 900 }, yeast: { amount: 1, unit: 'sachet', doneAt: 1000 } } });
    StorageService.completeBrewStock({ ...batch, status: 'fermentation', brewDay: brewDay as never });
    expect(refStock('MP-036')).toBe(0);
    expect(refStock('MP-038')).toBe(3);
    expect(StorageService.getBatches().find((b) => b.id === 'LOT-ZZ')!.status).toBe('fermentation');
  });
});
