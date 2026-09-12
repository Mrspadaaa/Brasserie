import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests d'intégration de la façade de données.
 *
 * On remplace le dépôt Firestore par un dépôt EN MÉMOIRE, et on exerce la
 * façade telle que l'application l'utilise : créer, modifier, supprimer,
 * corriger un inventaire, et vérifier que le journal d'audit garde trace.
 *
 * ⚠️ Ce que ces tests attrapent et que les tests unitaires ne peuvent pas :
 * les méthodes d'écriture qui MANQUAIENT. Le matériel, les fûts, les tarifs et
 * le planning s'affichaient sans jamais pouvoir être modifiés ni supprimés,
 * parce qu'aucune fonction n'existait pour ça. Un test qui appelle réellement
 * `deleteEquipment` échoue si elle disparaît.
 */

/** Dépôt en mémoire : mêmes signatures que `FirestoreRepo`, aucun réseau. */
const store = new Map<string, Map<string, Record<string, unknown>>>();

const fakeRepo = {
  all: <T>(name: string): T[] =>
    Array.from(store.get(name)?.entries() ?? []).map(
      ([__docId, doc]) => ({ ...doc, __docId }) as T
    ),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: (name: string, id: string, field: string, delta: number, extra: Record<string, unknown> = {}) => {
    const current = store.get(name)?.get(id) ?? {};
    fakeRepo.put(name, id, { ...extra, [field]: (Number(current[field]) || 0) + delta }, { merge: true });
  },
  remove: (name: string, id: string) => {
    store.get(name)?.delete(id);
  },
  startSync: () => {},
  isReady: () => true,
  subscribe: () => () => {},
  consumeWriteError: () => null,
  clearMemoryCache: () => store.clear()
};

vi.mock('../../src/services/firestoreRepo', () => ({
  FirestoreRepo: fakeRepo,
  ALL_COLLECTIONS: []
}));

const { StorageService } = await import('../../src/services/storage');
const { captureSnapshot } = await import('../../src/domain/recipeSnapshot');
type Types = typeof import('../../src/types');

const stockItem = (over: Partial<import('../../src/types').StockItem> = {}) => ({
  id: 'RM-1',
  ref: 'MP-001',
  name: 'Pilsner Malz',
  category: 'Malt',
  unit: 'kg',
  currentStock: 25,
  minStock: 5,
  reorder: false,
  ...over
});

beforeEach(() => {
  store.clear();
});

describe('Stock', () => {
  it('crée, relit, modifie et supprime un article', () => {
    StorageService.addStockItem('rawMaterials', stockItem());
    expect(StorageService.getStocks().rawMaterials).toHaveLength(1);

    StorageService.updateStockItem('rawMaterials', stockItem({ currentStock: 30 }));
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(30);

    StorageService.deleteStockItem('rawMaterials', 'MP-001');
    expect(StorageService.getStocks().rawMaterials).toHaveLength(0);
  });

  it('range l’hygiène à part des matières premières', () => {
    StorageService.addStockItem('rawMaterials', stockItem());
    StorageService.addStockItem('cleaning', stockItem({ ref: 'NT-001', name: 'Star San' }));
    const s = StorageService.getStocks();
    expect(s.rawMaterials).toHaveLength(1);
    expect(s.cleaning).toHaveLength(1);
  });

  it('⚠️ la correction d’inventaire calcule l’ÉCART et le journalise avec son motif', () => {
    StorageService.addStockItem('rawMaterials', stockItem({ currentStock: 25 }));

    const r = StorageService.adjustInventory('rawMaterials', 'MP-001', 22.5, 'casse', 'sac percé');
    expect(r).not.toBeNull();
    expect(r!.delta).toBeCloseTo(-2.5, 2);
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBeCloseTo(22.5, 2);

    // On cherche par contenu, pas par position : deux écritures dans la même
    // milliseconde peuvent s'ordonner l'une ou l'autre.
    const log = StorageService.getAuditLogs().find((l) => l.summary.includes('Inventaire'))!;
    expect(log).toBeDefined();
    expect(log.category).toBe('Stocks');
    expect(log.details).toMatch(/casse/i);
    expect(log.details).toMatch(/sac percé/);
    expect(log.summary).toMatch(/2.5/);
  });

  it('une correction sans écart reste enregistrée — confirmer un inventaire est une information', () => {
    StorageService.addStockItem('rawMaterials', stockItem({ currentStock: 25 }));
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', 25, 'comptage')!.delta).toBe(0);
  });

  it('rend null sur un article inexistant plutôt que de créer un fantôme', () => {
    expect(StorageService.adjustInventory('rawMaterials', 'INCONNU', 10, 'comptage')).toBeNull();
    expect(StorageService.getStocks().rawMaterials).toHaveLength(0);
  });
});

describe('Matériel', () => {
  const eq = { id: 'EQ-1', ref: 'EQ-001', name: 'Cuve 50 L', category: 'Brassage', state: 'Bon' };

  it('⚠️ se crée, se modifie et se SUPPRIME — aucune de ces méthodes n’existait', () => {
    StorageService.addEquipment(eq);
    expect(StorageService.getStocks().equipment).toHaveLength(1);

    StorageService.updateEquipment({ ...eq, state: 'À réparer' });
    expect(StorageService.getStocks().equipment[0].state).toBe('À réparer');

    StorageService.deleteEquipment('EQ-001');
    expect(StorageService.getStocks().equipment).toHaveLength(0);
  });

  it('journalise le changement d’état avec l’ancien', () => {
    StorageService.addEquipment(eq);
    StorageService.updateEquipment({ ...eq, state: 'À réparer' });
    expect(StorageService.getAuditLogs()[0].details).toMatch(/Bon/);
  });
});

describe('Fûts', () => {
  const keg = { id: 'F-001', capacityL: 30, state: 'propre' as const };

  it('⚠️ se créent — c’était impossible, seuls les changements d’état existaient', () => {
    StorageService.addKeg(keg);
    expect(StorageService.getStocks().kegs).toHaveLength(1);

    StorageService.updateKeg({ ...keg, state: 'plein', beerName: 'NEIPA' });
    expect(StorageService.getStocks().kegs[0].state).toBe('plein');

    StorageService.deleteKeg('F-001');
    expect(StorageService.getStocks().kegs).toHaveLength(0);
  });
});

describe('Tarifs', () => {
  const tarif = {
    product: 'Bouteille 75 cl',
    costIngredients: 1.2,
    costLabor: 1,
    costFixed: 0.5,
    costTotal: 2.7,
    priceHT: 7,
    marginCHF: 4.3,
    marginPercent: 61.4
  };

  it('⚠️ se créent, se modifient et se suppriment — ils étaient en lecture seule', () => {
    StorageService.updateTarif(tarif);
    expect(StorageService.getTarifs()).toHaveLength(1);

    StorageService.updateTarif({ ...tarif, priceHT: 8 });
    expect(StorageService.getTarifs()).toHaveLength(1);
    expect(StorageService.getTarifs()[0].priceHT).toBe(8);

    StorageService.deleteTarif('Bouteille 75 cl');
    expect(StorageService.getTarifs()).toHaveLength(0);
  });
});

describe('Planning', () => {
  const task = {
    id: 'T-1',
    category: 'Travaux',
    description: 'Poser le carrelage',
    cost: 1200,
    startDate: '01.03.2026',
    endDate: '15.03.2026',
    isMilestone: false
  };

  it('⚠️ se modifie et se supprime — une tâche terminée restait ouverte', () => {
    StorageService.updatePlanningTask(task);
    expect(StorageService.getPlanning()).toHaveLength(1);

    StorageService.updatePlanningTask({ ...task, completed: true });
    expect(StorageService.getPlanning()[0].completed).toBe(true);

    StorageService.deletePlanningTask('T-1');
    expect(StorageService.getPlanning()).toHaveLength(0);
  });
});

describe('Recettes et brassins', () => {
  const recipe = {
    id: 'REC-1',
    name: 'NEIPA',
    style: 'NEIPA',
    volumeL: 20,
    ogTarget: 1.061,
    fgTarget: 1.012,
    abvTarget: 6.4,
    fermentables: [
      { name: 'Pale', weightKg: 5, kind: 'grain' as const, use: 'empatage' as const }
    ],
    totalGristKg: 5,
    hops: [{ name: 'Citra', alpha: 12, weightG: 40, stage: 'dryHop' as const, dayOffset: 3 }],
    yeast: { name: 'US-05', form: 'sèche' as const, qty: 1, unit: 'sachet' },
    steps: [],
    notes: []
  };

  it('planifie sans sortir le stock, puis journalise la sortie une seule fois', () => {
    StorageService.addStockItem('rawMaterials', stockItem({ name: 'Pale' }));
    StorageService.addStockItem('rawMaterials', stockItem({ ref: 'H', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 100 }));
    StorageService.addStockItem('rawMaterials', stockItem({ ref: 'Y', name: 'US-05', category: 'Levure', unit: 'sachet', currentStock: 4 }));
    const planned = StorageService.brewRecipeAndDeductStocks(recipe, 'LOT-NEW');
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-001')?.currentStock).toBe(25);
    expect(planned.stockAccountingVersion).toBe(1);
    expect(StorageService.completeBrewStock({ ...planned, status: 'fermentation' }).success).toBe(true);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-001')?.currentStock).toBe(20);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'H')?.currentStock).toBe(100); // dry hop remains reserved
    expect(StorageService.completeBrewStock({ ...planned, status: 'fermentation' }).success).toBe(true);
    expect(StorageService.getStocks().rawMaterials.find(s => s.ref === 'MP-001')?.currentStock).toBe(20);
    expect(fakeRepo.all('movements')).toHaveLength(2);
  });

  it('ne reconstruit pas automatiquement le stock d’un brassin historique', () => {
    const historical = { id: 'LOT-OLD', name: 'NEIPA', style: 'NEIPA', volumeL: 20, brewDate: '01.03.2026', status: 'fermentation' as const, recipeSnapshot: captureSnapshot(recipe) };
    StorageService.addBatch(historical);
    const result = StorageService.completeBrewStock(historical);
    expect(result.success).toBe(false);
    expect(result.issues.join(' ')).toContain('historique');
    expect(fakeRepo.all('movements')).toEqual([]);
    expect(StorageService.getBatches()[0].stockReviewIssues).toEqual(result.issues);
  });

  it('une ancienne fiche ne peut ni effacer ni régresser les étapes de stock confirmées', () => {
    const historical = { id: 'LOT-OLD', name: 'NEIPA', style: 'NEIPA', volumeL: 20, brewDate: '01.03.2026', status: 'fermentation' as const };
    StorageService.addBatch(historical);
    expect(StorageService.completeBrewStock(historical, 'historical-already', true).success).toBe(true);
    const confirmed = StorageService.getBatches()[0].stockConsumption;
    const put = vi.spyOn(fakeRepo, 'put');
    StorageService.updateBatch({ ...historical, fg: '1.012', stockConsumption: { appliedAt: 'old', eventId: 'old', items: [], pendingItems: [], completedStages: ['brewday'] } });
    const write = put.mock.calls.find(call => call[0] === 'batches');
    expect(write?.[2]).not.toHaveProperty('stockConsumption');
    expect(write?.[3]).toEqual({ merge: true });
    expect(StorageService.getBatches()[0].stockConsumption).toEqual(confirmed);
    expect(StorageService.getBatches()[0].stockAccountingVersion).toBe(1);
    expect(StorageService.getBatches()[0].fg).toBe('1.012');
    put.mockRestore();
    StorageService.updateBatch({ ...historical, og: '1.055' });
    expect(StorageService.getBatches()[0].stockConsumption).toEqual(confirmed);
  });

  it('réconcilie explicitement les historiques sans écrire de mouvements ou remplacer un marqueur confirmé', () => {
    const old = { id: 'LOT-OLD', name: 'NEIPA', style: 'NEIPA', volumeL: 20, brewDate: '01.03.2026', status: 'planifie' as const };
    StorageService.addBatch(old);
    expect(StorageService.completeBrewStock(old, 'historical-unconsumed').success).toBe(false);
    expect(StorageService.completeBrewStock(old, 'historical-unconsumed', true).success).toBe(true);
    expect(StorageService.getBatches()[0].stockAccountingVersion).toBe(1);
    expect(StorageService.getBatches()[0].stockConsumption).toBeUndefined();
    expect(StorageService.completeBrewStock(old, 'historical-already', true).success).toBe(true);
    const marker = StorageService.getBatches()[0].stockConsumption;
    expect(marker).toMatchObject({ historicalConfirmation: { choice: 'already-consumed' }, completedStages: ['brewday', 'remaining'], items: [] });
    expect(StorageService.completeBrewStock(old, 'historical-unconsumed', true).success).toBe(false);
    expect(StorageService.getBatches()[0].stockConsumption).toEqual(marker);
    expect(fakeRepo.all('movements')).toEqual([]);
  });

  it('refuse un commit de stock préparé avant une confirmation plus récente', () => {
    const old = { id: 'LOT-OLD', name: 'NEIPA', style: 'NEIPA', volumeL: 20, brewDate: '01.03.2026', status: 'planifie' as const };
    StorageService.addBatch(old);
    StorageService.completeBrewStock(old, 'historical-already', true);
    expect(() => StorageService.updateBatch(old, { previous: undefined })).toThrow('Le stock de ce brassin a changé');
    expect(StorageService.getBatches()[0].stockConsumption?.historicalConfirmation?.choice).toBe('already-consumed');
  });

  it('⚠️ `updateRecipe` modifie UNE recette — seul `saveRecipes` existait, réécrivant tout', () => {
    StorageService.addRecipe(recipe);
    StorageService.addRecipe({ ...recipe, id: 'REC-2', name: 'Stout' });

    StorageService.updateRecipe({ ...recipe, name: 'NEIPA v2' });

    const all = StorageService.getRecipes();
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.id === 'REC-1')!.name).toBe('NEIPA v2');
    expect(all.find((r) => r.id === 'REC-2')!.name).toBe('Stout');
  });

  it('un brassin, une recette et un client se suppriment', () => {
    StorageService.addRecipe(recipe);
    StorageService.addBatch({
      id: 'LOT-1',
      name: 'NEIPA',
      style: 'NEIPA',
      volumeL: 20,
      brewDate: '01.03.2026',
      status: 'planifie'
    });
    StorageService.saveClients([
      { id: 'CL-1', name: 'Bistrot', type: 'Pro', contact: '', phone: '', email: '' }
    ]);

    StorageService.deleteBatch('LOT-1');
    StorageService.deleteRecipe('REC-1');
    StorageService.deleteClient('CL-1');

    expect(StorageService.getBatches()).toHaveLength(0);
    expect(StorageService.getRecipes()).toHaveLength(0);
    expect(StorageService.getClients()).toHaveLength(0);
  });

  it('⚠️ le brassin garde sa copie figée : modifier la recette ne réécrit pas l’histoire', () => {
    StorageService.addRecipe(recipe);
    StorageService.addBatch({
      id: 'LOT-1',
      name: 'NEIPA',
      style: 'NEIPA',
      volumeL: 20,
      brewDate: '01.03.2026',
      status: 'fermentation',
      recipeRef: 'REC-1',
      recipeSnapshot: captureSnapshot(recipe)
    });

    StorageService.updateRecipe({ ...recipe, name: 'Tout autre chose', volumeL: 99 });

    const batch = StorageService.getBatches()[0];
    expect(batch.recipeSnapshot!.name).toBe('NEIPA');
    expect(batch.recipeSnapshot!.volumeL).toBe(20);
    expect(StorageService.getRecipes()[0].name).toBe('Tout autre chose');
  });

  it('normalise les anciens houblons à la lecture, sans réécrire la base', () => {
    fakeRepo.put('batches', 'LOT-OLD', {
      id: 'LOT-OLD',
      name: 'Ancien',
      style: 'Ale',
      volumeL: 30,
      brewDate: '01.01.2025',
      status: 'termine',
      hops: [{ name: 'Citra', alpha: 12, weightG: 60, timeMin: 0, step: 'Dry hop #2' }],
      yeastName: 'US-05'
    });

    const batch = StorageService.getBatches()[0];
    expect(batch.hops![0].stage).toBe('dryHop');
    expect(batch.yeast!.name).toBe('US-05');

    // La base n'a PAS été touchée : la migration se fait à la lecture.
    expect(store.get('batches')!.get('LOT-OLD')!.yeastName).toBe('US-05');
  });
});

describe('Journal d’audit', () => {
  it('garde trace de chaque écriture, la plus récente en tête', () => {
    StorageService.addStockItem('rawMaterials', stockItem());
    StorageService.deleteStockItem('rawMaterials', 'MP-001');

    const logs = StorageService.getAuditLogs();
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0].action).toBe('Suppression');
    expect(logs[0].entityId).toBe('MP-001');
  });

  it('note l’utilisateur qui a saisi', () => {
    StorageService.addStockItem('rawMaterials', stockItem());
    expect(['Gaëtan', 'Aricia']).toContain(StorageService.getAuditLogs()[0].user);
  });
});
