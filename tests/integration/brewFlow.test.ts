import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Le parcours métier complet : achat ➔ planification ➔ brassage ➔ annulation.
 *
 * ⚠️ Ce que ces tests protègent, et qu'aucun test unitaire n'atteint : les
 * règles qui traversent PLUSIEURS écritures.
 *
 *   • Planifier ne consomme rien. La fin du brassage retire les ingrédients une
 *     seule fois. Un achat monte le stock, une annulation
 *     le rend, une correction se journalise — rien d'autre n'y touche.
 *   • Le brassin fige sa recette. Corriger la recette demain ne doit pas
 *     réécrire ce qu'on a brassé aujourd'hui.
 *
 * Le nom historique `brewRecipeAndDeductStocks` reste compatible, mais suit
 * désormais la même planification sans déstockage que l'assistant principal.
 */

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
const { isActiveTransaction, transactionAmount } = await import('../../src/domain/finance/ledger');
type T = import('../../src/types');

const stock = (over: Partial<T['StockItem']> = {}): T['StockItem'] =>
  ({
    id: 'RM-1',
    ref: 'MP-001',
    name: 'US 2-row',
    category: 'Malt',
    unit: 'kg',
    currentStock: 25,
    minStock: 5,
    reorder: false,
    ...over
  }) as T['StockItem'];

const recipe = (over: Partial<T['Recipe']> = {}): T['Recipe'] =>
  ({
    id: 'R-1',
    name: 'NEIPA',
    style: 'NEIPA',
    volumeL: 30,
    boilMin: 60,
    ogTarget: 1.061,
    fgTarget: 1.012,
    abvTarget: 6.5,
    fermentables: [
      { name: 'US 2-row', weightKg: 6, kind: 'grain', use: 'empatage' },
      { name: 'Lactose', weightKg: 0.5, kind: 'lactose', use: 'ebullition' }
    ],
    hops: [{ name: 'Citra', weightG: 100, alpha: 12, stage: 'whirlpool', timeMin: 20 }],
    yeast: { name: 'SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet' },
    ...over
  }) as T['Recipe'];

const refStock = (ref: string) =>
  StorageService.getStocks().rawMaterials.find((i) => i.ref === ref)?.currentStock;

beforeEach(() => {
  store.clear();
  localStorage.clear();
  StorageService.saveStocks({
    rawMaterials: [
      stock(),
      stock({ id: 'RM-2', ref: 'MP-002', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 400, minStock: 100 }),
      stock({ id: 'RM-3', ref: 'MP-003', name: 'Lactose', category: 'Sucre', unit: 'kg', currentStock: 2, minStock: 1 }),
      stock({ id: 'RM-4', ref: 'MP-004', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 6, minStock: 2 })
    ],
    cleaning: []
  });
});

const finish = (r: T['Recipe'], id: string) => {
  const batch = StorageService.brewRecipeAndDeductStocks(r, id);
  return StorageService.completeBrewStock({ ...batch, status: 'fermentation' });
};

describe('Planifier puis brasser consomme le stock une seule fois', () => {
  it('ne débite pas le malt neuf une deuxième fois pour la seconde extraction',async()=>{
    const {newNoloConfig}=await import('../../src/domain/nolo');
    const nolo=newNoloConfig();nolo.process='secondRunnings';
    finish(recipe({nolo}),'NOLO-runnings');
    expect(StorageService.getStocks().rawMaterials.find(s=>s.ref==='MP-001')!.currentStock).toBe(25);
    expect(StorageService.getStocks().rawMaterials.find(s=>s.ref==='MP-002')!.currentStock).toBe(300);
  });
  it('ne remplace pas une quantité de levure inconnue ou nulle par un sachet inventé',()=>{
    StorageService.brewRecipeAndDeductStocks(recipe({yeast:{name:'SafAle US-05',form:'sèche',qty:0,unit:'sachet'}}),'NOLO-0');
    expect(StorageService.getStocks().rawMaterials.find(s=>s.ref==='MP-004')!.currentStock).toBe(6);
  });
  it('ne jette pas sur une recette du modèle actuel', () => {
    expect(() => StorageService.brewRecipeAndDeductStocks(recipe(), 'LOT-1')).not.toThrow();
  });

  it('la planification ne déduit aucun ingrédient', () => {
    StorageService.brewRecipeAndDeductStocks(recipe(), 'LOT-1');
    expect(refStock('MP-001')).toBe(25);
    expect(refStock('MP-002')).toBe(400);
    expect(refStock('MP-003')).toBe(2);
    expect(refStock('MP-004')).toBe(6);
    expect(fakeRepo.all('movements')).toEqual([]);
  });

  it('la fin du brassage déduit le grain, le houblon, le sucre et la levure', () => {
    expect(finish(recipe(), 'LOT-1').success).toBe(true);
    expect(refStock('MP-001')).toBe(19); // 25 − 6 kg
    expect(refStock('MP-002')).toBe(300); // 400 − 100 g
    expect(refStock('MP-003')).toBe(1.5); // 2 − 0.5 kg
    expect(refStock('MP-004')).toBe(4); // 6 − 2 sachets
  });

  it('lève le drapeau de réapprovisionnement en passant sous le minimum', () => {
    finish(recipe(), 'LOT-1');
    const citra = StorageService.getStocks().rawMaterials.find((i) => i.ref === 'MP-002');
    expect(citra?.reorder).toBe(false);

    finish(recipe(), 'LOT-2');
    finish(recipe(), 'LOT-3');
    const apres = StorageService.getStocks().rawMaterials.find((i) => i.ref === 'MP-002');
    expect(apres?.currentStock).toBe(100);
    expect(apres?.reorder).toBe(true);
  });

  it('refuse une consommation insuffisamment approvisionnée sans débit partiel', () => {
    const result = finish(recipe({ volumeL: 30, fermentables: [
      { name: 'US 2-row', weightKg: 999, kind: 'grain', use: 'empatage' }
    ] } as Partial<T['Recipe']>), 'LOT-1');
    expect(result.success).toBe(false);
    expect(refStock('MP-001')).toBe(25);
    expect(refStock('MP-002')).toBe(400);
    expect(fakeRepo.all('movements')).toEqual([]);
    expect(StorageService.getBatches()[0].stockReviewIssues?.join(' ')).toContain('Corriger l’inventaire');
  });

  it('conserve le brassin et demande le rapprochement d’un ingrédient absent', () => {
    const r = recipe({
      fermentables: [{ name: 'Malt fantôme', weightKg: 3, kind: 'grain', use: 'empatage' }]
    } as Partial<T['Recipe']>);
    const result = finish(r, 'LOT-1');
    expect(result.success).toBe(false);
    expect(result.issues.join(' ')).toContain('Malt fantôme');
    expect(refStock('MP-001')).toBe(25);
  });

  it('un double clic avec un ancien brouillon ne déstocke jamais deux fois', () => {
    const planned = StorageService.brewRecipeAndDeductStocks(recipe(), 'LOT-1');
    expect(StorageService.completeBrewStock({ ...planned, status: 'fermentation' }).success).toBe(true);
    expect(StorageService.completeBrewStock({ ...planned, status: 'fermentation' }).success).toBe(true);
    expect(refStock('MP-001')).toBe(19);
    expect(fakeRepo.all('movements')).toHaveLength(4);
  });

  it('ne déduit les ajouts de fermentation qu’à leur confirmation', () => {
    const r = recipe({ hops: [{ name: 'Citra', weightG: 40, alpha: 12, stage: 'whirlpool' }, { name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop' }] });
    finish(r, 'LOT-1');
    expect(refStock('MP-002')).toBe(360);
    const brewed = StorageService.getBatches()[0];
    expect(brewed.stockConsumption?.pendingItems).toEqual([{ stockItemRef: 'MP-002', quantity: 60, unit: 'g' }]);
    expect(StorageService.completeBrewStock({ ...brewed, status: 'conditionne' }, 'remaining').success).toBe(true);
    expect(refStock('MP-002')).toBe(300);
    expect(StorageService.completeBrewStock({ ...brewed, status: 'conditionne' }, 'remaining').success).toBe(true);
    expect(refStock('MP-002')).toBe(300);
  });

  it('fige la recette dans le brassin', () => {
    StorageService.brewRecipeAndDeductStocks(recipe(), 'LOT-1');
    const batch = StorageService.getBatches().find((b) => b.id === 'LOT-1')!;
    expect(batch.recipeSnapshot?.fermentables).toHaveLength(2);
    expect(batch.recipeSnapshot?.yeast?.name).toBe('SafAle US-05');
    expect(batch.status).toBe('planifie');
    expect(batch.og).toBeUndefined();
    expect(batch.fg).toBeUndefined();
    expect(batch.gravityLog).toEqual([]);
  });

  it('modifier la recette ensuite ne réécrit pas le brassin', () => {
    StorageService.saveRecipes([recipe()]);
    StorageService.brewRecipeAndDeductStocks(recipe(), 'LOT-1');

    StorageService.updateRecipe(
      recipe({
        name: 'NEIPA v2',
        fermentables: [{ name: 'Pilsner', weightKg: 99, kind: 'grain', use: 'empatage' }]
      } as Partial<T['Recipe']>)
    );

    const batch = StorageService.getBatches().find((b) => b.id === 'LOT-1')!;
    expect(batch.recipeSnapshot?.fermentables[0].name).toBe('US 2-row');
    expect(batch.recipeSnapshot?.fermentables[0].weightKg).toBe(6);
  });

  it('accepte une recette sans densité visée sans afficher NaN', () => {
    const r = recipe({ ogTarget: undefined, fgTarget: undefined, abvTarget: undefined } as Partial<T['Recipe']>);
    const batch = StorageService.brewRecipeAndDeductStocks(r, 'LOT-1');
    expect(batch.og).toBeUndefined();
    expect(batch.abv).toBeUndefined();
    expect(batch.gravityLog).toEqual([]);
  });

  it('lit encore une recette d’avant la refonte', () => {
    const ancienne = recipe({
      fermentables: undefined,
      malts: [{ name: 'US 2-row', weightKg: 4 }]
    } as Partial<T['Recipe']>);
    finish(ancienne, 'LOT-1');
    expect(refStock('MP-001')).toBe(21);
  });
});

describe('Une écriture annulée rend le stock', () => {
  const achat = (): T['Transaction'] =>
    ({
      id: 'TX-1',
      date: '10.03.2026',
      description: 'Commande malt',
      category: 'brassage',
      amountHT: 100,
      amountTTC: 102.6,
      tvaRate: 0.026,
      proofNotes: 'Fournisseur: Brau-Rauchshop',
      stockImpact: [
        { itemRef: 'MP-001', itemName: 'US 2-row', addedQty: 25, unit: 'kg', itemType: 'rawMaterials' }
      ]
    }) as T['Transaction'];

  it('annuler une réception retire ce qu’elle avait ajouté', () => {
    StorageService.addTransaction(achat());
    StorageService.saveStocks({
      ...StorageService.getStocks(),
      rawMaterials: StorageService.getStocks().rawMaterials.map((i) =>
        i.ref === 'MP-001' ? { ...i, currentStock: 50 } : i
      )
    });

    const res = StorageService.revertTransaction('TX-1');
    expect(res.success).toBe(true);
    expect(refStock('MP-001')).toBe(25);
    const retained = StorageService.getTransactions().find((t) => t.id === 'TX-1');
    expect(retained?.finance?.voidedAt).toBeTruthy();
    expect(retained?.amountTTC).toBe(102.6);
    expect(StorageService.getTransactions().filter(isActiveTransaction).reduce((sum, tx) => sum + transactionAmount(tx), 0)).toBe(0);
    expect(fakeRepo.all<any>('movements').find(m => m.type === 'receipt-reversal')).toMatchObject({ transactionId: 'TX-1', stockItemRef: 'MP-001', delta: -25 });
  });

  it('une seconde annulation ne retire pas deux fois le même stock', () => {
    StorageService.addTransaction(achat());
    expect(StorageService.revertTransaction('TX-1').success).toBe(true);
    expect(refStock('MP-001')).toBe(0);
    const count = fakeRepo.all('movements').length;
    expect(StorageService.revertTransaction('TX-1').success).toBe(true);
    expect(refStock('MP-001')).toBe(0);
    expect(fakeRepo.all('movements')).toHaveLength(count);
  });

  it('ne gomme pas du stock consommé et garde l’écriture active si l’annulation est impossible', () => {
    StorageService.addTransaction(achat());
    StorageService.updateStockItem('rawMaterials', stock({ currentStock: 10 }));
    const result = StorageService.revertTransaction('TX-1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('inventaire');
    expect(refStock('MP-001')).toBe(10);
    expect(StorageService.getTransactions().filter(isActiveTransaction)).toHaveLength(1);
    expect(fakeRepo.all('movements')).toHaveLength(0);
  });

  it('demande de corriger un paiement avant d’annuler sa facture', () => {
    StorageService.addTransaction(achat());
    fakeRepo.put('financialPayments', 'PAY-1', { id: 'PAY-1', transactionId: 'TX-1', date: '2026-03-10', amountCents: 10260, direction: 'out', method: 'bank', recordedAt: '2026-03-10' });
    const result = StorageService.revertTransaction('TX-1');
    expect(result.success).toBe(false);
    expect(result.message).toContain('paiement');
    expect(refStock('MP-001')).toBe(25);
    expect(StorageService.getTransactions().filter(isActiveTransaction)).toHaveLength(1);
  });

  it('le dit franchement quand l’écriture n’existe pas', () => {
    const res = StorageService.revertTransaction('TX-INEXISTANT');
    expect(res.success).toBe(false);
    expect(res.message).toContain('introuvable');
  });

  it('laisse une trace au journal', () => {
    StorageService.addTransaction(achat());
    StorageService.revertTransaction('TX-1');
    const log = StorageService.getAuditLogs()[0];
    expect(log.action).toBe('Annulation');
    expect(log.entityId).toBe('TX-1');
    expect(log.summary).toContain('Annulation conservée');
    expect(log.details).toContain('justificatif');
  });
});

describe('Idées et projets : modifier et supprimer', () => {
  const idee = (over: Partial<T['CreativeItem']> = {}): T['CreativeItem'] =>
    ({
      id: 'CR-1',
      type: 'recipe-idea',
      title: 'Bière d’hiver au miel',
      description: 'Dubbel 7.2 % au miel de forêt.',
      status: 'idea',
      ...over
    }) as T['CreativeItem'];

  const mine = () => StorageService.getCreativeItems().find((i) => i.id === 'CR-1');

  it('ajoute, modifie et supprime — ce qui n’était pas possible avant', () => {
    StorageService.addCreativeItem(idee());
    expect(mine()?.title).toBe('Bière d’hiver au miel');

    StorageService.updateCreativeItem(idee({ status: 'research', title: 'Bière d’hiver v2' }));
    expect(mine()?.title).toBe('Bière d’hiver v2');
    expect(mine()?.status).toBe('research');

    StorageService.deleteCreativeItem('CR-1');
    expect(mine()).toBeUndefined();
  });
});

describe('Épinglage', () => {
  it('bascule l’épingle d’un article et la conserve', () => {
    StorageService.toggleFavorite('stockItem', 'MP-002');
    expect(StorageService.getStocks().rawMaterials.find((i) => i.ref === 'MP-002')?.favorite).toBe(
      true
    );
    StorageService.toggleFavorite('stockItem', 'MP-002');
    expect(StorageService.getStocks().rawMaterials.find((i) => i.ref === 'MP-002')?.favorite).toBe(
      false
    );
  });
});

describe('Export et réimport', () => {
  it('rend les données telles qu’elles étaient', async () => {
    window.history.replaceState({}, '', '/?dev-local');
    finish(recipe(), 'LOT-1');
    const dump = StorageService.exportAllData();

    store.clear();
    expect(StorageService.getBatches()).toHaveLength(0);

    await StorageService.importAllData(dump);
    expect(StorageService.getBatches().map((b) => b.id)).toContain('LOT-1');
    expect(refStock('MP-001')).toBe(19);
    window.history.replaceState({}, '', '/');
  });

  it('refuse un contenu qui n’est pas une sauvegarde', () => {
    expect(() => StorageService.importAllData('ceci n’est pas du JSON')).toThrow();
  });
});
