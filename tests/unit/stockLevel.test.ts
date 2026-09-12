import { describe, it, expect } from 'vitest';
import { computeStockLevel, shortfall, allocatedBatches } from '../../src/domain/stockLevel';
import { Batch, StockItem } from '../../src/types';

/**
 * La couverture de stock, exprimée en brassins.
 *
 * ⚠️ Ce que ces tests protègent : `usageInBatch` lisait `batch.malts`, un champ
 * que plus AUCUN brassin ne renseigne depuis que la recette est figée dans un
 * snapshot. Toutes les jauges retombaient donc sur « niveau inconnu » et le
 * manque à commander valait zéro même quand il manquait vraiment du malt.
 */

const item = (over: Partial<StockItem> = {}): StockItem =>
  ({
    id: 'RM-1',
    ref: 'MP-001',
    name: 'Pilsner Malz',
    category: 'Malt',
    unit: 'kg',
    currentStock: 25,
    minStock: 0,
    reorder: false,
    ...over
  }) as StockItem;

/** Brassin moderne : la recette vit dans le snapshot. */
const modern = (over: Partial<Batch> = {}): Batch =>
  ({
    id: 'B-1',
    name: 'NEIPA #1',
    style: 'NEIPA',
    volumeL: 30,
    brewDate: '01.03.2026',
    status: 'planifie',
    recipeSnapshot: {
      name: 'NEIPA',
      style: 'NEIPA',
      volumeL: 30,
      boilMin: 60,
      fermentables: [
        { name: 'Pilsner Malz', weightKg: 6, kind: 'grain', use: 'empatage' },
        { name: 'Flocons d’avoine', weightKg: 1, kind: 'grain', use: 'empatage' }
      ],
      hops: [{ name: 'Citra', weightG: 50, stage: 'whirlpool', timeMin: 20 }],
      yeast: { name: 'SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet' }
    },
    ...over
  }) as Batch;

/** Brassin d'avant la refonte : les ingrédients sont posés à plat. */
const legacy = (over: Partial<Batch> = {}): Batch =>
  ({
    id: 'B-0',
    name: 'Milk Stout #3',
    style: 'Milk Stout',
    volumeL: 30,
    brewDate: '01.01.2026',
    status: 'termine',
    malts: [{ name: 'Pilsner Malz', weightKg: 5 }],
    hops: [{ name: 'Citra', weightG: 30, step: 'Ébullition', timeMin: 15 }],
    yeastName: 'SafAle US-05',
    ...over
  }) as Batch;

describe('Couverture depuis un brassin moderne', () => {
  it('lit les fermentescibles du snapshot, pas le champ hérité', () => {
    const level = computeStockLevel(item({ currentStock: 24 }), [modern()]);
    expect(level.source).toBe('planifie');
    expect(level.perBatch).toBe(6);
    expect(level.coverage).toBe(4);
    expect(level.band).toBe('fourni');
  });

  it('compte le houblon dans son unité à lui', () => {
    const houblon = item({ name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 120 });
    const level = computeStockLevel(houblon, [modern()]);
    expect(level.perBatch).toBe(50);
    expect(level.coverage).toBe(2.4);
  });

  it('compte les sachets de levure réellement ensemencés', () => {
    const levure = item({
      name: 'SafAle US-05',
      category: 'Levure',
      unit: 'sachet',
      currentStock: 3
    });
    const level = computeStockLevel(levure, [modern()]);
    expect(level.perBatch).toBe(2);
    expect(level.band).toBe('correct');
  });
});

describe('Bandes et libellés', () => {
  it('ne perd pas un brassin exact à cause des fractions de kilogramme', () => {
    const batch = modern();
    batch.recipeSnapshot!.hops[0].weightG = 100;
    expect(computeStockLevel(item({ name: 'Citra', unit: 'kg', currentStock: .3 }), [batch]).label).toBe('3 brassins d’avance');
    expect(computeStockLevel(item({ name: 'Citra', unit: 'kg', currentStock: .299 }), [batch]).label).toBe('2 brassins d’avance');
  });
  it('annonce la rupture quand il ne reste rien', () => {
    const level = computeStockLevel(item({ currentStock: 0 }), [modern()]);
    expect(level.band).toBe('rupture');
    expect(level.label).toBe('Rupture');
    expect(level.fillPercent).toBe(0);
  });

  it('dit « moins d’un brassin » sous la barre', () => {
    const level = computeStockLevel(item({ currentStock: 3 }), [modern()]);
    expect(level.band).toBe('juste');
    expect(level.label).toContain('Moins d');
  });

  it('accorde le pluriel des brassins d’avance', () => {
    expect(computeStockLevel(item({ currentStock: 7 }), [modern()]).label).toBe(
      '1 brassin d’avance'
    );
    expect(computeStockLevel(item({ currentStock: 13 }), [modern()]).label).toBe(
      '2 brassins d’avance'
    );
  });

  it('sature la jauge à trois brassins', () => {
    const level = computeStockLevel(item({ currentStock: 300 }), [modern()]);
    expect(level.fillPercent).toBe(100);
  });
});

describe('Provenance de l’estimation', () => {
  it('préfère les brassins planifiés à l’historique', () => {
    const level = computeStockLevel(item(), [legacy(), modern()]);
    expect(level.source).toBe('planifie');
    expect(level.perBatch).toBe(6);
  });

  it('retombe sur l’historique quand rien n’est planifié', () => {
    const level = computeStockLevel(item(), [legacy()]);
    expect(level.source).toBe('historique');
    expect(level.perBatch).toBe(5);
  });

  it('ignore les brassins annulés dans la moyenne', () => {
    const level = computeStockLevel(item(), [
      legacy(),
      legacy({ id: 'B-X', status: 'annule', malts: [{ name: 'Pilsner Malz', weightKg: 99 }] })
    ]);
    expect(level.perBatch).toBe(5);
  });

  it('retombe sur le stock minimum faute de brassin', () => {
    const level = computeStockLevel(item({ minStock: 10 }), []);
    expect(level.source).toBe('minStock');
    expect(level.perBatch).toBe(10);
  });

  it('avoue ne pas savoir plutôt que de simuler une jauge pleine', () => {
    const level = computeStockLevel(item(), []);
    expect(level.source).toBe('aucune');
    expect(level.band).toBe('inconnu');
    expect(level.coverage).toBeNull();
    expect(level.perBatch).toBeNull();
  });

  it('sans donnée ET sans stock, c’est une rupture, pas un inconnu', () => {
    const level = computeStockLevel(item({ currentStock: 0 }), []);
    expect(level.band).toBe('rupture');
    expect(level.tone).toBe('alert');
  });
});

describe('Manque à commander', () => {
  it('additionne tous les brassins planifiés', () => {
    const missing = shortfall(item({ currentStock: 4 }), [
      modern(),
      modern({ id: 'B-2', name: 'NEIPA #2' })
    ]);
    expect(missing).toBe(8); // 6 + 6 − 4
  });

  it('vaut zéro quand le stock suffit', () => {
    expect(shortfall(item({ currentStock: 50 }), [modern()])).toBe(0);
  });

  it('ne compte pas les brassins déjà brassés', () => {
    expect(shortfall(item({ currentStock: 4 }), [legacy()])).toBe(0);
  });
});

describe('Brassins qui réservent l’article', () => {
  it('ne liste que les planifiés qui l’utilisent vraiment', () => {
    const alloc = allocatedBatches(item(), [
      modern(),
      modern({ id: 'B-3', name: 'Pils', recipeSnapshot: undefined, malts: [] }),
      legacy()
    ]);
    expect(alloc).toEqual([{ id: 'B-1', name: 'NEIPA #1', qty: 6 }]);
  });
  it('garde les ajouts de fermentation réservés après le déstockage du jour J', () => {
    const hop = item({ ref: 'H', name: 'Citra', unit: 'g', category: 'Houblon', currentStock: 80 });
    const fermenting = modern({ status: 'fermentation', stockConsumption: { appliedAt: '2026-09-01', eventId: 'brew', completedStages: ['brewday'], items: [{ stockItemRef: 'H', quantity: 40, unit: 'g' }], pendingItems: [{ stockItemRef: 'H', quantity: 60, unit: 'g' }] } });
    expect(allocatedBatches(hop, [fermenting])).toEqual([{ id: fermenting.id, name: fermenting.name, qty: 60 }]);
    expect(shortfall(hop, [fermenting, modern({ id: 'next' })])).toBe(30); // 60 reserved + 50 planned - 80 on hand.
    expect(computeStockLevel(hop, [fermenting, modern({ id: 'next' })]).coverage).toBe(.4); // 20 free / 50 for next brew.
  });
  it('ne réserve plus un brassin annulé, terminé ou entièrement déstocké', () => {
    const consumed = { appliedAt: '2026-09-01', eventId: 'brew', completedStages: ['brewday', 'remaining'] as Array<'brewday' | 'remaining'>, items: [{ stockItemRef: 'MP-001', quantity: 6, unit: 'kg' }], pendingItems: [] };
    expect(allocatedBatches(item(), [modern({ stockConsumption: consumed }), modern({ id: 'cancel', status: 'annule' }), modern({ id: 'done', status: 'termine' })])).toEqual([]);
  });
  it('ne devine pas un nom partiel et refuse les homonymes sans référence explicite', () => {
    expect(allocatedBatches(item({ name: 'Pilsner' }), [modern()])).toEqual([]);
    const duplicates = [item(), item({ ref: 'MP-002' })];
    expect(allocatedBatches(duplicates[0], [modern()], duplicates)).toEqual([]);
    const explicit = modern(); explicit.recipeSnapshot!.fermentables[0].stockItemRef = 'MP-001';
    expect(allocatedBatches(duplicates[0], [explicit], duplicates)[0].qty).toBe(6);
    expect(allocatedBatches(duplicates[1], [explicit], duplicates)).toEqual([]);
  });
  it('ne transforme pas une levure en grammes en nombre de sachets', () => {
    const yeast = item({ name: 'SafAle US-05', category: 'Levure', unit: 'g' });
    expect(allocatedBatches(yeast, [modern()])).toEqual([]);
  });
});
