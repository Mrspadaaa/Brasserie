import { describe, expect, it } from 'vitest';
import { compareRecipeWithStock, computeStockLevel } from '../../src/domain/stockLevel';
import type { Batch, Recipe, StockItem } from '../../src/types';

const recipe = (over: Partial<Recipe> = {}): Recipe => ({
  id: 'REC-STOCK',
  name: 'Ale témoin',
  style: 'Pale Ale',
  volumeL: 20,
  fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: 6, kind: 'grain', use: 'empatage' }],
  hops: [],
  yeast: { name: '', step: '', tempC: 0, durationMin: 0, notes: '' },
  ...over
} as Recipe);

const stock = (over: Partial<StockItem> = {}): StockItem => ({
  id: 'MALT-1',
  ref: 'MALT-1',
  name: 'Pilsner Malz',
  category: 'Malt',
  unit: 'g',
  currentStock: 5000,
  minStock: 0,
  reorder: false,
  ...over
} as StockItem);

const batch = (over: Partial<Batch> = {}): Batch => ({
  id: 'B-1',
  name: 'Brassin témoin',
  style: 'Pale Ale',
  volumeL: 20,
  brewDate: '24.09.2026',
  status: 'fermentation',
  ...over
} as Batch);

describe('comparaison d’une recette au stock physique', () => {
  it('convertit les besoins, déduit seulement les ajouts encore réservés et garde le manque exact', () => {
    const inFermentation = batch({
      stockConsumption: {
        appliedAt: '2026-09-24T10:00:00.000Z',
        eventId: 'BREW-B-1',
        completedStages: ['brewday'],
        items: [{ stockItemRef: 'MALT-1', quantity: 2000, unit: 'g' }],
        pendingItems: [{ stockItemRef: 'MALT-1', quantity: 1000, unit: 'g' }]
      }
    });
    const planned = batch({
      id: 'B-2',
      status: 'planifie',
      stockConsumption: undefined,
      recipeSnapshot: {
        name: 'Autre recette planifiée',
        style: 'Pale Ale',
        volumeL: 20,
        capturedAt: '2026-09-24T10:00:00.000Z',
        fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: 20, kind: 'grain', use: 'empatage' }],
        hops: [],
        yeast: { name: '' }
      } as NonNullable<Batch['recipeSnapshot']>
    });

    const [result] = compareRecipeWithStock(recipe(), [inFermentation, planned], [stock()]);

    expect(result).toMatchObject({
      match: 'linked',
      quantity: 6000,
      unit: 'g',
      physical: 5000,
      reserved: 1000,
      available: 4000,
      shortage: 2000
    });
    // The 2 kg in `items` are already deducted from `currentStock` (5 kg).
    // Planned demand is not an actual reservation.
    expect(result.available).toBe(4000);
    expect(result.shortage).toBe(2000);
  });

  it('laisse besoin et manque inconnus si la recette et le stock ont des unités incompatibles', () => {
    const [result] = compareRecipeWithStock(recipe(), [], [stock({ unit: 'sachet', currentStock: 3 })]);

    expect(result.quantity).toBeNull();
    expect(result.shortage).toBeNull();
    expect(result.issue).toContain('kg vers sachet');
    expect(result.physical).toBe(3);
    expect(result.available).toBe(3);
  });

  it('ne transforme pas une réserve dans une unité incompatible en zéro disponible', () => {
    const inFermentation = batch({
      stockConsumption: {
        appliedAt: '2026-09-24T10:00:00.000Z',
        eventId: 'BREW-B-1',
        completedStages: ['brewday'],
        items: [],
        pendingItems: [{ stockItemRef: 'MALT-1', quantity: 1, unit: 'sachet' }]
      }
    });

    const [result] = compareRecipeWithStock(recipe({ fermentables: [{
      name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: 1, kind: 'grain', use: 'empatage'
    }] }), [inFermentation], [stock()]);

    expect(result.quantity).toBe(1000);
    expect(result.reserved).toBeNull();
    expect(result.available).toBeNull();
    expect(result.shortage).toBeNull();
    expect(result.availabilityIssue).toContain('Réservation inconnue');
    expect(computeStockLevel(stock(), [inFermentation]).band).toBe('inconnu');
    expect(computeStockLevel(stock(), [inFermentation]).coverage).toBeNull();
  });
});
