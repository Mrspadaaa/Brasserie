// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Batch, RecipeSnapshot, StockItem } from '../../../src/types';

/**
 * Voie k1 (mission 2026-11-11-stock), diagnostic de P7 puis R2 : le parcours du 10.11 rejoué sur fixture, côté service
 * (recette figée → `completeBrewStock` → stock et brassin). Dépôt Firestore remplacé par un dépôt en mémoire ; aucune donnée réelle.
 * L'écran du jour de brassage (BrewDayPage) n'est pas rejoué ici : il appartient à la voie du jour de brassage.
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
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, consumeError: () => null, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));

const { StorageService } = await import('../../../src/services/storage');
const { prepareBrewStockConsumption } = await import('../../../src/domain/finance/brewStockConsumption');

const malt = (over: Partial<StockItem> = {}): StockItem =>
  ({ id: 'RM-36', ref: 'MP-036', name: 'ZZ TEST malt', category: 'Malt', unit: 'kg', currentStock: 5, reorder: false, ...over }) as StockItem;

/** La recette du parcours du 10.11 : un malt de 5 kg, ni houblon, ni levure choisie. */
const recette = (over: Partial<RecipeSnapshot> = {}): RecipeSnapshot => ({
  name: 'ZZ TEST parcours', style: 'Pilsner', volumeL: 20, capturedAt: '2026-11-10T08:00:00.000Z',
  fermentables: [{ name: 'ZZ TEST malt', weightKg: 5, kind: 'grain', use: 'empatage', stockItemRef: 'MP-036' }], hops: [], ...over
} as unknown as RecipeSnapshot);

/** Le brassin à la clôture du jour de brassage : levure ajoutée, quantité réelle consignée « sans mesure ». */
const brassin = (snapshot: RecipeSnapshot, brewDay: Record<string, unknown> = {}): Batch => ({
  id: 'LOT-016', brewDate: '2026-11-10', name: 'ZZ TEST parcours', style: 'Pilsner', volumeL: 20, status: 'fermentation', stockAccountingVersion: 1,
  recipeSnapshot: snapshot, gravityLog: [],
  brewDay: { steps: [], currentIndex: 0, startedAt: 1, pitchedAt: 2, pitchQuantityConfirmation: 'unmeasured', additions: {}, ...brewDay }
} as unknown as Batch);

const lit = <T,>(nom: string, id: string) => store.get(nom)?.get(id) as T | undefined;

beforeEach(() => { store.clear(); });

describe('P7 — le parcours du 10.11 rejoué : malt de 5 kg, levure non pesée', () => {
  it('le malt baisse de 5 kg, le brassin garde « fermentation », la levure est « à régulariser »', () => {
    StorageService.addStockItem('rawMaterials', malt());
    StorageService.addBatch(brassin(recette({ yeast: { name: 'Souche à préciser' } as RecipeSnapshot['yeast'] })));
    const r = StorageService.completeBrewStock(brassin(recette({ yeast: { name: 'Souche à préciser' } as RecipeSnapshot['yeast'] })));
    expect(r.success).toBe(true);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-036')!.currentStock).toBe(0);
    expect(StorageService.getBatches().find(b => b.id === 'LOT-016')!.status).toBe('fermentation');
    expect(r.issues.join(' ')).toMatch(/Levure/);
  });

  it('la recette sans levure du tout : le malt baisse aussi', () => {
    StorageService.addStockItem('rawMaterials', malt());
    StorageService.addBatch(brassin(recette()));
    const r = StorageService.completeBrewStock(brassin(recette()));
    expect(r.success).toBe(true);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-036')!.currentStock).toBe(0);
  });

  it('le malt cité par son nom seul (sans lien d’article) se retrouve par ce nom', () => {
    StorageService.addStockItem('rawMaterials', malt());
    const sansLien = recette({ fermentables: [{ name: 'ZZ TEST malt', weightKg: 5, kind: 'grain', use: 'empatage' }] as RecipeSnapshot['fermentables'] });
    StorageService.addBatch(brassin(sansLien));
    expect(StorageService.completeBrewStock(brassin(sansLien)).success).toBe(true);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-036')!.currentStock).toBe(0);
  });
});

describe('R2 — déstockage partiel : ce qui manque est « à régulariser », le reste passe', () => {
  const deuxMalts = () => recette({ fermentables: [
    { name: 'ZZ TEST malt', weightKg: 5, kind: 'grain', use: 'empatage', stockItemRef: 'MP-036' },
    { name: 'ZZ TEST malt rare', weightKg: 2, kind: 'grain', use: 'empatage', stockItemRef: 'MP-037' }
  ] as RecipeSnapshot['fermentables'] });

  it('un article en stock insuffisant ne bloque pas les autres : le Pilsner baisse, le brassin passe en fermentation', () => {
    StorageService.addStockItem('rawMaterials', malt());
    StorageService.addStockItem('rawMaterials', malt({ id: 'RM-37', ref: 'MP-037', name: 'ZZ TEST malt rare', currentStock: 0.5 }));
    StorageService.addBatch(brassin(deuxMalts()));
    const r = StorageService.completeBrewStock(brassin(deuxMalts()));
    expect(r.success).toBe(true);
    const stocks = StorageService.getStocks().rawMaterials;
    expect(stocks.find(s => s.ref === 'MP-036')!.currentStock).toBe(0);
    // L'article insuffisant n'est pas touché, et le dit : rien n'est inventé, rien n'est mis à 0 en silence.
    expect(stocks.find(s => s.ref === 'MP-037')!.currentStock).toBe(0.5);
    expect(r.issues.join(' ')).toMatch(/malt rare/);
    const lot = StorageService.getBatches().find(b => b.id === 'LOT-016')!;
    expect(lot.status).toBe('fermentation');
    expect(lot.stockReviewIssues?.join(' ')).toMatch(/malt rare/);
    expect(lot.stockConsumption?.items.map(i => i.stockItemRef)).toEqual(['MP-036']);
  });

  it('un article introuvable ou sans lien est dit « à régulariser » ; les autres sont déstockés', () => {
    StorageService.addStockItem('rawMaterials', malt());
    StorageService.addBatch(brassin(deuxMalts()));
    const r = StorageService.completeBrewStock(brassin(deuxMalts()));
    expect(r.success).toBe(true);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-036')!.currentStock).toBe(0);
    expect(r.issues.join(' ')).toMatch(/malt rare/);
  });

  it('un mouvement est écrit par article déstocké, aucun pour l’article à régulariser', () => {
    StorageService.addStockItem('rawMaterials', malt());
    StorageService.addStockItem('rawMaterials', malt({ id: 'RM-37', ref: 'MP-037', name: 'ZZ TEST malt rare', currentStock: 0.5 }));
    StorageService.addBatch(brassin(deuxMalts()));
    StorageService.completeBrewStock(brassin(deuxMalts()));
    expect(Array.from(store.get('movements')?.keys() ?? [])).toEqual(['BREW-STOCK-LOT-016-brewday-MP-036']);
  });

  it('un second geste ne déstocke pas une deuxième fois', () => {
    StorageService.addStockItem('rawMaterials', malt({ currentStock: 12 }));
    StorageService.addBatch(brassin(recette()));
    StorageService.completeBrewStock(brassin(recette()));
    StorageService.completeBrewStock(brassin(recette()));
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(7);
  });

  it('la fonction pure sépare le déstocké (stockUpdates, movements) de l’à régulariser (reviewIssues)', () => {
    const plan = prepareBrewStockConsumption(brassin(deuxMalts()), [malt(), malt({ id: 'RM-37', ref: 'MP-037', name: 'ZZ TEST malt rare', currentStock: 0.5 })]);
    expect(plan.status).toBe('ready');
    expect(plan.stockUpdates.map(s => s.ref)).toEqual(['MP-036']);
    expect(plan.reviewIssues.join(' ')).toMatch(/malt rare/);
    expect(plan.issues).toEqual([]);
  });
});
