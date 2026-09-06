import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Préremplissage des formulaires, sur des données réellement enregistrées.
 *
 * Ce test est d'intégration et pas unitaire parce que `Suggestions` n'a de sens
 * qu'au-dessus de la façade de données : c'est l'enchaînement « j'enregistre un
 * achat ➔ le fournisseur devient une suggestion avec ses articles habituels »
 * qu'il faut protéger, pas une fonction isolée.
 *
 * La règle vérifiée partout ici : **rien n'est inventé**. Une valeur proposée
 * vient d'une écriture qui existe, ou elle n'est pas proposée.
 */

const store = new Map<string, Map<string, Record<string, unknown>>>();

const fakeRepo = {
  all: <T>(name: string): T[] =>
    Array.from(store.get(name)?.entries() ?? []).map(
      ([__docId, doc]) => ({ ...doc, __docId }) as T
    ),
  put: (name: string, id: string, doc: unknown) => {
    if (!store.has(name)) store.set(name, new Map());
    store.get(name)!.set(id, JSON.parse(JSON.stringify(doc)));
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
const { Suggestions, byFavoriteThenName } = await import('../../src/services/suggestions');

type T = import('../../src/types');

const item = (over: Partial<T['StockItem']> = {}): T['StockItem'] =>
  ({
    id: 'RM-1',
    ref: 'MP-001',
    name: 'Pilsner Malz',
    category: 'Malt',
    unit: 'kg',
    currentStock: 25,
    minStock: 5,
    reorder: false,
    supplier: 'Brau-Rauchshop',
    pricePerUnit: 2.4,
    ...over
  }) as T['StockItem'];

const purchase = (over: Partial<T['Transaction']> = {}): T['Transaction'] =>
  ({
    id: 'TX-1',
    date: '10.03.2026',
    description: 'Commande malt',
    category: 'brassage',
    amountHT: 110.39,
    amountTTC: 113.26,
    tvaRate: 0.026,
    proofNotes: 'Fournisseur: Brau-Rauchshop',
    ...over
  }) as T['Transaction'];

beforeEach(() => {
  store.clear();
  localStorage.clear();
  StorageService.saveStocks({
    rawMaterials: [
      item(),
      item({ id: 'RM-2', ref: 'MP-002', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 400 }),
      item({ id: 'RM-3', ref: 'MP-003', name: 'Avoine', category: 'Malt', favorite: true })
    ],
    cleaning: [
      item({ id: 'CL-1', ref: 'NT-001', name: 'Soude', category: 'Nettoyage', unit: 'L', supplier: 'Bauhaus' })
    ]
  });
});

describe('Fournisseurs récurrents', () => {
  it('n’en propose aucun tant qu’il n’y a pas d’écriture', () => {
    expect(Suggestions.vendors()).toEqual([]);
  });

  it('déduit le fournisseur, sa catégorie et son taux de TVA habituels', () => {
    StorageService.addTransaction(purchase());
    StorageService.addTransaction(purchase({ id: 'TX-2', date: '20.03.2026' }));

    const [v] = Suggestions.vendors();
    expect(v.name).toBe('Brau-Rauchshop');
    expect(v.count).toBe(2);
    expect(v.category).toBe('brassage');
    expect(v.tvaRate).toBeCloseTo(0.026, 4);
  });

  it('retient le dernier montant par la DATE, pas par l’ordre de saisie', () => {
    StorageService.addTransaction(purchase({ id: 'TX-2', date: '20.03.2026', amountHT: 200 }));
    StorageService.addTransaction(purchase({ id: 'TX-1', date: '10.03.2026', amountHT: 110.39 }));

    const [v] = Suggestions.vendors();
    expect(v.lastDate).toBe('20.03.2026');
    expect(v.lastAmountHT).toBe(200);
  });

  it('ignore les ventes et les apports : ce ne sont pas des fournisseurs', () => {
    StorageService.addTransaction(
      purchase({ id: 'TX-V', category: 'recettes', proofNotes: 'Le Carnotzet' })
    );
    StorageService.addTransaction(purchase({ id: 'TX-A', category: 'apports', proofNotes: 'Gaëtan' }));
    expect(Suggestions.vendors()).toEqual([]);
  });

  it('classe les fournisseurs du plus fréquent au moins', () => {
    StorageService.addTransaction(purchase());
    StorageService.addTransaction(purchase({ id: 'TX-2' }));
    StorageService.addTransaction(
      purchase({ id: 'TX-3', proofNotes: 'Fournisseur: Bauhaus', category: 'materiel' })
    );
    expect(Suggestions.vendors().map((v) => v.name)).toEqual(['Brau-Rauchshop', 'Bauhaus']);
  });

  it('propose la quantité MÉDIANE, qu’une commande exceptionnelle ne fausse pas', () => {
    const impact = (qty: number) => [
      { itemRef: 'MP-001', itemName: 'Pilsner Malz', addedQty: qty, unit: 'kg' }
    ];
    StorageService.addTransaction(purchase({ id: 'TX-1', stockImpact: impact(25) }));
    StorageService.addTransaction(purchase({ id: 'TX-2', stockImpact: impact(25) }));
    StorageService.addTransaction(purchase({ id: 'TX-3', stockImpact: impact(500) }));

    const usual = Suggestions.vendors()[0].usualItems.find((u) => u.ref === 'MP-001');
    expect(usual?.typicalQty).toBe(25);
  });
});

describe('Articles proposés à la réception', () => {
  it('liste tout le stock, épinglés en tête', () => {
    const items = Suggestions.stockItems();
    expect(items[0].name).toBe('Avoine');
    expect(items.map((i) => i.ref)).toContain('NT-001');
  });

  it('ne propose une dernière quantité que si un achat en donne une', () => {
    expect(Suggestions.stockItems().find((i) => i.ref === 'MP-001')?.lastQty).toBeUndefined();

    StorageService.addTransaction(
      purchase({
        stockImpact: [{ itemRef: 'MP-001', itemName: 'Pilsner Malz', addedQty: 25, unit: 'kg' }]
      })
    );
    expect(Suggestions.stockItems().find((i) => i.ref === 'MP-001')?.lastQty).toBe(25);
  });

  it('sans historique, s’en tient aux articles rattachés au fournisseur', () => {
    const items = Suggestions.itemsForVendor('Bauhaus');
    expect(items.map((i) => i.ref)).toEqual(['NT-001']);
  });

  it('avec un historique, propose d’abord ce qu’on lui commande vraiment', () => {
    StorageService.addTransaction(
      purchase({
        stockImpact: [
          { itemRef: 'MP-002', itemName: 'Citra', addedQty: 500, unit: 'g' },
          { itemRef: 'MP-001', itemName: 'Pilsner Malz', addedQty: 25, unit: 'kg' }
        ]
      })
    );
    const items = Suggestions.itemsForVendor('Brau-Rauchshop');
    expect(items.map((i) => i.ref)).toEqual(['MP-002', 'MP-001']);
    expect(items[0].lastQty).toBe(500);
  });

  it('ne propose rien pour un fournisseur inconnu', () => {
    expect(Suggestions.itemsForVendor('Jamais Vu SA')).toEqual([]);
  });
});

describe('Ce qui a déjà été brassé', () => {
  const batch = (over: Partial<T['Batch']> = {}): T['Batch'] =>
    ({
      id: 'B-1',
      name: 'NEIPA #1',
      style: 'NEIPA',
      volumeL: 30,
      brewDate: '01.03.2026',
      status: 'termine',
      ...over
    }) as T['Batch'];

  it('retrouve le dernier brassin d’un style', () => {
    StorageService.addBatch(batch());
    StorageService.addBatch(batch({ id: 'B-2', name: 'NEIPA #2', brewDate: '01.06.2026' }));
    expect(Suggestions.lastBatchOfStyle('neipa')?.id).toBe('B-2');
  });

  it('ne ressort pas un brassin annulé', () => {
    StorageService.addBatch(batch({ status: 'annule' }));
    expect(Suggestions.lastBatchOfStyle('neipa')).toBeUndefined();
  });

  it('ne devine pas un style à partir de rien', () => {
    expect(Suggestions.lastBatchOfStyle('')).toBeUndefined();
    expect(Suggestions.knownStyles()).toEqual([]);
  });

  it('ne propose que les styles réellement brassés', () => {
    StorageService.addBatch(batch());
    StorageService.addBatch(batch({ id: 'B-2', style: 'Milk Stout' }));
    expect(Suggestions.knownStyles()).toEqual(['Milk Stout', 'NEIPA']);
  });
});

describe('Unités et catégories', () => {
  it('part des unités usuelles et y ajoute celles du stock', () => {
    const units = Suggestions.knownUnits();
    expect(units).toContain('kg');
    expect(units).toContain('sachet');
    expect(units).toContain('L');
  });

  it('ne propose que les catégories présentes dans le stock', () => {
    expect(Suggestions.knownCategories()).toEqual(['Houblon', 'Malt', 'Nettoyage']);
  });
});

describe('Tri commun des listes', () => {
  it('épinglés d’abord, puis par ordre alphabétique français', () => {
    const list = [
      { name: 'Épeautre' },
      { name: 'Avoine' },
      { name: 'Zeste', favorite: true }
    ];
    expect([...list].sort(byFavoriteThenName).map((x) => x.name)).toEqual([
      'Zeste',
      'Avoine',
      'Épeautre'
    ]);
  });
});
