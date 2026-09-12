import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockItem } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';

const mock = vi.hoisted(() => ({
  docs: new Map<string, Map<string, any>>(),
  listeners: new Map<string, (snap: any) => void>(),
  setDoc: vi.fn()
}));
vi.mock('../../src/services/firebase', () => ({ db: {} }));
vi.mock('../../src/services/financialLedgerSync', () => ({ startFinancialLedgerSync: async (callbacks: any) => {
  callbacks.onData([], { covered: new Set(), requestStartedAt: 0 });
  callbacks.onState({ complete: true, loading: false, fromCache: false, loadedRows: 0 });
  return { refresh: async () => {}, stop: () => {} };
} }));
vi.mock('firebase/firestore', () => ({
  collection: (_: unknown, name: string) => name,
  doc: (_: unknown, name: string, id: string) => ({ name, id }),
  onSnapshot: (name: string, _options: unknown, next: (snap: any) => void) => {
    mock.listeners.set(name, next);
    next({
      metadata: { hasPendingWrites: false, fromCache: false },
      docs: [...(mock.docs.get(name)?.entries() ?? [])].map(([id, data]) => ({
        id,
        data: () => data
      }))
    });
    return () => mock.listeners.delete(name);
  },
  setDoc: (...args: unknown[]) => mock.setDoc(...args),
  deleteDoc: vi.fn(),
  writeBatch: () => {
    const writes: any[][] = [];
    return { set: (...args: any[]) => writes.push(args), delete: vi.fn(),
      commit: async () => { for (const args of writes) await mock.setDoc(...args); } };
  },
  waitForPendingWrites: async () => {},
  getDocsFromServer: vi.fn(),
  deleteField: () => ({ _methodName: 'deleteField' }),
  getDocs: vi.fn(),
  query: (name: string) => name,
  orderBy: vi.fn(), documentId: () => '__name__', startAfter: vi.fn(), limit: vi.fn()
}));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';

beforeEach(() => {
  FirestoreRepo.stopSync();
  mock.docs.clear();
  mock.setDoc.mockReset().mockImplementation(async ({ name, id }, data, options) => {
    if (!mock.docs.has(name)) mock.docs.set(name, new Map());
    const collection = mock.docs.get(name)!;
    const saved = JSON.parse(
      JSON.stringify({ ...(options.merge ? collection.get(id) : {}), ...data })
    );
    collection.set(id, saved);
    mock.listeners.get(name)?.({
      metadata: { hasPendingWrites: false, fromCache: false },
      docs: [...collection].map(([id, data]) => ({ id, data: () => data }))
    });
  });
  FirestoreRepo.startSync();
});

describe('AI facts through storage and the real Firestore adapter (SDK mocked)', () => {
  it('merges only missing facts, preserves stock, and reads them after restarting sync', async () => {
    const item: StockItem = {
      id: 'm',
      ref: 'M-1',
      name: 'Maris Otter',
      category: 'Malt',
      unit: 'kg',
      currentStock: 17,
      minStock: 3,
      reorder: false,
      colorEbc: 5
    };
    StorageService.addStockItem('rawMaterials', item);
    await FirestoreRepo.waitForWrites();
    mock.setDoc.mockClear();
    StorageService.learnIngredient(' Maris Otter ', {
      category: 'Malt',
      colorEbc: 8,
      potentialPpg: 38,
      currentStock: 0,
      technicalSource: 'Fiche du malteur'
    });
    await FirestoreRepo.waitForWrites();
    expect(mock.setDoc).toHaveBeenCalledWith(
      { name: 'stockItems', id: 'M-1' },
      { potentialPpg: 38, technicalSource: 'Fiche du malteur' },
      { merge: true }
    );
    FirestoreRepo.stopSync();
    FirestoreRepo.startSync();
    expect(StorageService.getStocks().rawMaterials[0]).toMatchObject({
      ...item,
      potentialPpg: 38,
      technicalSource: 'Fiche du malteur'
    });
  });
  it('keeps a reusable zero-stock record for an imported ingredient absent from stock', async () => {
    StorageService.learnIngredient('Malt inconnu', {
      category: 'Malt',
      colorEbc: 120,
      potentialPpg: 34
    });
    StorageService.learnIngredient('Malt inconnu', {
      category: 'Malt',
      colorEbc: 120,
      potentialPpg: 34
    });
    await FirestoreRepo.waitForWrites();
    FirestoreRepo.stopSync();
    FirestoreRepo.startSync();
    expect(StorageService.getStocks().rawMaterials).toHaveLength(1);
    expect(StorageService.getStocks().rawMaterials[0]).toMatchObject({
      name: 'Malt inconnu',
      currentStock: 0,
      colorEbc: 120,
      potentialPpg: 34,
      category: 'Malt'
    });
  });
  it('serializes manual malt data and zero acid overrides without losing them on readback', async () => {
    const recipe: any = {
      id: 'R-test',
      name: 'Test',
      style: 'Stout',
      volumeL: 20,
      ogTarget: 1.05,
      fgTarget: 1.01,
      abvTarget: 5,
      totalGristKg: 4,
      fermentables: [
        {
          name: 'Malt',
          kind: 'grain',
          use: 'empatage',
          weightKg: 4,
          colorEbc: 8.5,
          potentialPpg: 37
        }
      ],
      hops: [],
      yeast: {
        name: 'US-05',
        form: 'sèche',
        qty: 1,
        unit: 'sachet',
        attenuationPct: 81,
        fermTempMaxC: 22
      },
      waterPlan: {
        sourceId: 'source',
        treatmentVersion: 2,
        diRatioPct: 100,
        acidOverride: { mash: 0 },
        mashWaterL: 20,
        spargeWaterL: 10,
        mash: { mgso4: 1.5 },
        sparge: {},
        acid: { id: 'lactique', mash: 0, sparge: 0.2 },
        targetPh: 5.4
      },
      steps: [],
      notes: []
    };
    StorageService.addRecipe(recipe);
    await FirestoreRepo.waitForWrites();
    FirestoreRepo.stopSync();
    FirestoreRepo.startSync();
    expect(StorageService.getRecipes().find((r) => r.id === recipe.id)).toMatchObject(recipe);
    const payload = mock.setDoc.mock.calls.find(([ref]) => ref.name === 'recipes')[1];
    expect(payload.waterPlan.acidOverride).toEqual({ mash: 0 });
  });
  it('reports a Firestore write rejection', async () => {
    mock.setDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    StorageService.learnIngredient('Rejected', { category: 'Malt', colorEbc: 6 });
    await expect(FirestoreRepo.waitForWrites()).rejects.toThrow('permission-denied');
    expect(FirestoreRepo.consumeError()).toMatch(/permission-denied/);
    spy.mockRestore();
  });
  it('persists all imported recipe fields through the actual storage adapter', async () => {
    const imported = { ...readRecipeText(writeRecipeText(fullRecipe)), id: 'copie-test' };
    StorageService.addRecipe(imported);
    await FirestoreRepo.waitForWrites();
    FirestoreRepo.stopSync();
    FirestoreRepo.startSync();
    const restored = StorageService.getRecipes().find(r => r.id === imported.id);
    expect(restored).toEqual(imported);
    expect(readRecipeText(writeRecipeText(restored))).toEqual(readRecipeText(writeRecipeText(fullRecipe)));
  });
});
