import { describe, expect, it } from 'vitest';
import type { Batch, StockItem } from '../../src/types';
import { prepareBrewStockConsumption } from '../../src/domain/finance/brewStockConsumption';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';

const stock = (ref: string, name: string, unit: string, currentStock: number): StockItem => ({ id: ref, ref, name, unit, currentStock, category: 'Malt', minStock: 0, reorder: false });
const stocks = [stock('M', 'Pils', 'kg', 20), stock('H', 'Citra', 'g', 200), stock('Y', 'US05', 'sachet', 5)];
const batch = (): Batch => ({ id: 'B1', status: 'fermentation', name: 'IPA', brewDate: '09.09.2026', volumeL: 30,
  recipeSnapshot: { sourceRecipeId: 'R1', capturedAt: '', name: 'IPA', volumeL: 30, fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [{ name: 'Citra', weightG: 40, stage: 'boil', alpha: 10 }, { name: 'Citra', weightG: 60, stage: 'dryHop', alpha: 10 }], yeast: { name: 'US05', qty: 2, unit: 'sachet', form: 'sèche' } }
} as Batch);

describe('brew stock consumption write proposal', () => {
  it('consumes day-J additions and reserves dry hop until a later event', () => {
    const b = batch(); const original = JSON.stringify(stocks);
    const result = prepareBrewStockConsumption(b, stocks, { now: '2026-09-09T12:00:00Z' });
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.find(s => s.ref === 'H')?.currentStock).toBe(160);
    expect(result.batch.stockConsumption.pendingItems).toEqual([{ stockItemRef: 'H', quantity: 60, unit: 'g' }]);
    expect(result.movements.find(m => m.stockItemRef === 'M')?.delta).toBe(-5);
    expect(JSON.stringify(stocks)).toBe(original);
    expect(b.stockConsumption).toBeUndefined();
  });
  it('does not apply the same stage twice and consumes remaining additions once', () => {
    const first = prepareBrewStockConsumption(batch(), stocks);
    expect(prepareBrewStockConsumption(first.batch, first.stockUpdates).status).toBe('already-applied');
    const remaining = prepareBrewStockConsumption(first.batch, first.stockUpdates, { stage: 'remaining' });
    expect(remaining.stockUpdates.find(s => s.ref === 'H')?.currentStock).toBe(100);
    expect(remaining.batch.stockConsumption.pendingItems).toEqual([]);
    expect(prepareBrewStockConsumption(remaining.batch, remaining.stockUpdates, { stage: 'remaining' }).status).toBe('already-applied');
  });
  it('uses measured additions and replacements rather than overwriting the recipe', () => {
    const b = batch(); b.brewDay = { additions: { 'grain-0': { amount: 4, replacement: { name: 'Vienna' } } } } as Batch['brewDay'];
    const result = prepareBrewStockConsumption(b, [...stocks, stock('V', 'Vienna', 'kg', 10)]);
    expect(result.stockUpdates.some(s => s.ref === 'M')).toBe(false);
    expect(result.stockUpdates.find(s => s.ref === 'V')?.currentStock).toBe(6);
    expect(b.recipeSnapshot.fermentables[0].name).toBe('Pils');
  });
  it('does not partially debit stock if an ingredient is ambiguous or insufficient', () => {
    const result = prepareBrewStockConsumption(batch(), stocks.map(s => s.ref === 'M' ? { ...s, currentStock: 2 } : s));
    expect(result.status).toBe('needs-review');
    expect(result.stockUpdates).toEqual([]);
    expect(result.movements).toEqual([]);
    expect(result.issues[0]).toContain('Corriger l’inventaire');
  });
  it('protects stock reserved for fermentation in the next brew estimate', () => {
    const first = prepareBrewStockConsumption(batch(), stocks);
    const next = estimateBrewBudget({ recipe: { ...batch().recipeSnapshot, id: 'R1' } as any, stockItems: first.stockUpdates, batches: [first.batch], brewDate: '15.09.2026' });
    const hops = next.lines.find(l => l.name === 'Citra');
    expect(hops.available).toBe(100);
    expect(hops.reserved).toBe(60);
  });
});
