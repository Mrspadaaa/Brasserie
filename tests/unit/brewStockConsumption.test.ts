import { describe, expect, it } from 'vitest';
import type { Batch, StockItem } from '../../src/types';
import { prepareBrewStockConsumption } from '../../src/domain/finance/brewStockConsumption';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';

const stock = (ref: string, name: string, unit: string, currentStock: number): StockItem => ({ id: ref, ref, name, unit, currentStock, category: 'Malt', minStock: 0, reorder: false });
const stocks = [stock('M', 'Pils', 'kg', 20), stock('H', 'Citra', 'g', 200), stock('Y', 'US05', 'sachet', 5)];
const batch = (): Batch => ({ id: 'B1', status: 'fermentation', name: 'IPA', brewDate: '09.09.2026', volumeL: 30,
  brewDay: { currentIndex: 0, steps: [], pitchedAt: Date.parse('2026-09-09T12:00:00Z'), pitchQuantityConfirmation: 'planned', additions: { yeast: { amount: 2, unit: 'sachet', doneAt: Date.parse('2026-09-09T12:00:00Z') } } },
  recipeSnapshot: { sourceRecipeId: 'R1', capturedAt: '', name: 'IPA', volumeL: 30, fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [{ name: 'Citra', weightG: 40, stage: 'boil', alpha: 10 }, { name: 'Citra', weightG: 60, stage: 'dryHop', alpha: 10 }], yeast: { name: 'US05', qty: 2, unit: 'sachet', form: 'sèche', stockItemRef: 'Y' } }
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
    const b = batch(); b.brewDay = { ...b.brewDay, additions: { yeast: { amount: 2, unit: 'sachet', doneAt: b.brewDay?.pitchedAt }, 'grain-0': { amount: 4, replacement: { name: 'Vienna' } } } } as Batch['brewDay'];
    const result = prepareBrewStockConsumption(b, [...stocks, stock('V', 'Vienna', 'kg', 10)]);
    expect(result.stockUpdates.some(s => s.ref === 'M')).toBe(false);
    expect(result.stockUpdates.find(s => s.ref === 'V')?.currentStock).toBe(6);
    expect(b.recipeSnapshot.fermentables[0].name).toBe('Pils');
  });
  it('does not use the planned dose after an unmeasured confirmation or fabricate a zero movement', () => {
    const b = batch();
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: Date.parse('2026-09-09T12:00:00Z'), pitchQuantityConfirmation: 'unmeasured' };
    const result = prepareBrewStockConsumption(b, stocks);
    expect(result.status).toBe('needs-review');
    expect(result.issues).toContain('Levure : quantité réelle non renseignée ; consommation à régulariser, sans reprendre la dose prévue.');
    expect(result.stockUpdates).toEqual([]);
    expect(result.movements).toEqual([]);
  });
  it('does not treat a unique homonym as the explicitly associated yeast stock item', () => {
    const b = batch(); delete b.recipeSnapshot.yeast!.stockItemRef;
    const result = prepareBrewStockConsumption(b, stocks);
    expect(result.status).toBe('needs-review');
    expect(result.issues.join(' ')).toContain('article ou lot de levure à associer explicitement');
    expect(result.stockUpdates).toEqual([]);
    expect(result.movements).toEqual([]);
  });
  it('uses an explicit actual yeast unit when the recipe dose is zero and unit was missing', () => {
    const b = batch();
    b.recipeSnapshot.yeast = { name: 'US05', qty: 0, form: 'sèche', stockItemRef: 'Y' };
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'measured', additions: { yeast: { amount: 9.5, unit: 'g', doneAt: 100 } } };
    const result = prepareBrewStockConsumption(b, [stock('M', 'Pils', 'kg', 20), stock('H', 'Citra', 'g', 200), stock('Y', 'US05', 'g', 50)]);
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.find(s => s.ref === 'Y')?.currentStock).toBe(40.5);
    expect(result.movements.find(m => m.stockItemRef === 'Y')?.delta).toBe(-9.5);
  });
  it('converts one pack to grams only through the frozen exact format and matching stock lot', () => {
    const source = { url: 'https://yeast.example/product', title: 'Product sheet', checkedAt: '2026-09-01' };
    const product = { id: 'P-US05-11', referenceId: 'US-05', label: 'US-05 11 g', manufacturer: 'Example', form: 'sèche' as const,
      format: { amount: 11, unit: 'g' as const, label: '11 g', source }, source };
    const b = batch();
    b.recipeSnapshot.yeast = { name: 'US05', hopIndexId: 'US-05', form: 'sèche', qty: 1, unit: 'sachet', stockItemRef: 'Y', pitching: { version: 1, product } };
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'measured', additions: { yeast: { amount: 1, unit: 'sachet', doneAt: 100 } } };
    const matching = { ...stock('Y', 'US05', 'g', 50), yeastLot: { productId: product.id, lotNumber: 'LOT-11' } };
    const result = prepareBrewStockConsumption(b, [stock('M', 'Pils', 'kg', 20), stock('H', 'Citra', 'g', 200), matching]);
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.find(s => s.ref === 'Y')?.currentStock).toBe(39);
    expect(result.movements.find(m => m.stockItemRef === 'Y')?.delta).toBe(-11);

    const unassociated = prepareBrewStockConsumption(b, [stock('M', 'Pils', 'kg', 20), stock('H', 'Citra', 'g', 200), stock('Y', 'US05', 'g', 50)]);
    expect(unassociated.status).toBe('needs-review');
    expect(unassociated.issues.join(' ')).toContain('format exact et lot associé');
    expect(unassociated.movements).toEqual([]);
  });
  it('converts a measured 11.5 g addition to one sachet using the recipe lot confirmation and remains idempotent', () => {
    const source = { url: 'https://yeast.example/product', title: 'Product sheet', checkedAt: '2026-09-01' };
    const product = { id: 'P-US05-11_5', referenceId: 'US-05', label: 'US-05 11.5 g', manufacturer: 'Example', form: 'sèche' as const,
      format: { amount: 11.5, unit: 'g' as const, label: '11.5 g sachet', source }, source };
    const b = batch();
    b.recipeSnapshot.yeast = { name: 'US05', hopIndexId: 'US-05', form: 'sèche', qty: 0, unit: 'sachet', stockItemRef: 'Y',
      pitching: { version: 1, product, lot: { productId: product.id, lotNumber: 'LOT-11_5' } } };
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'measured', additions: { yeast: { amount: 11.5, unit: 'g', doneAt: 100 } } };
    const stockWithSachets = [...stocks.filter(item => item.ref !== 'Y'), { ...stock('Y', 'US05', 'sachet', 5), category: 'Levure' }];
    const result = prepareBrewStockConsumption(b, stockWithSachets);
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.find(s => s.ref === 'Y')?.currentStock).toBe(4);
    expect(result.movements.find(m => m.stockItemRef === 'Y')).toMatchObject({ delta: -1, unit: 'sachet' });
    expect(prepareBrewStockConsumption(result.batch, result.stockUpdates).status).toBe('already-applied');

    const conflictingLot = { ...stockWithSachets.find(item => item.ref === 'Y')!, yeastLot: { productId: 'P-OTHER' } };
    const conflict = prepareBrewStockConsumption(b, [...stockWithSachets.filter(item => item.ref !== 'Y'), conflictingLot]);
    expect(conflict.status).toBe('needs-review');
    expect(conflict.issues.join(' ')).toContain('contredit le format choisi');
    expect(conflict.movements).toEqual([]);

    const unknownFormat = structuredClone(b);
    delete unknownFormat.recipeSnapshot.yeast!.pitching!.product!.format;
    const unknown = prepareBrewStockConsumption(unknownFormat, stockWithSachets);
    expect(unknown.status).toBe('needs-review');
    expect(unknown.issues.join(' ')).toContain('format exact et lot associé');
    expect(unknown.movements).toEqual([]);
  });
  it('converts a measured half-flacon in mL to fractional flacon stock through the exact liquid format', () => {
    const source = { url: 'https://yeast.example/activator', title: 'Activator sheet', checkedAt: '2026-09-01' };
    const product = { id: 'P-ACTIVATOR-125', referenceId: 'LIQUID-A', label: 'Activator 125 mL', manufacturer: 'Example', form: 'liquide' as const,
      format: { amount: 125, unit: 'mL' as const, label: '125 mL', source }, source };
    const b = batch();
    b.recipeSnapshot.yeast = { name: 'Activator', hopIndexId: 'LIQUID-A', form: 'liquide', qty: 1, unit: 'flacon', stockItemRef: 'Y',
      pitching: { version: 1, product, lot: { productId: product.id, lotNumber: 'LOT-A' } } };
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'measured', additions: { yeast: { amount: 62.5, unit: 'mL', doneAt: 100 } } };
    const stockInFlacons = [...stocks.filter(item => item.ref !== 'Y'), { ...stock('Y', 'Activator', 'flacon', 3), category: 'Levure' }];
    const result = prepareBrewStockConsumption(b, stockInFlacons);
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.find(s => s.ref === 'Y')?.currentStock).toBe(2.5);
    expect(result.movements.find(m => m.stockItemRef === 'Y')).toMatchObject({ delta: -0.5, unit: 'flacon' });
  });
  it('deducts only the recorded starter inoculum, never the culture transfer volume', () => {
    const b = batch();
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'starter-transferred', additions: { yeast: { amount: 1.5, unit: 'L', doneAt: 100 } } };
    b.yeastPreparation = { plan: { id: 'P', revision: 1, productId: 'PROD', context: 'c', protocol: { id: 'M', label: 'Starter', source: { url: 'https://example.test/source', title: 'Notice', checkedAt: '2026-09-01' }, method: 'Notice', medium: 'malt-extract', targetSg: 1.035, conditions: 'selon notice', leadHours: { min: 24, max: 48 }, steps: ['Aérer'] }, volumeL: 1.5, inoculum: '1 sachet', equipment: 'Flacon', startAt: '2026-09-07T12:00:00Z', targetPitchAt: '2026-09-09T12:00:00Z', status: 'planned', steps: [{ id: 'step-0', label: 'Aérer', dueAt: '2026-09-07T12:00:00Z' }] }, status: 'transferred', startedAt: 1, steps: [{ id: 'step-0', at: 2 }], inoculumUsed: { amount: 1, unit: 'sachet', stockItemRef: 'Y' }, stockRegularization: [{ kind: 'medium', stockItemRef: 'MALTEX', at: 3 }], cultureVolumeL: 1.5 };
    const result = prepareBrewStockConsumption(b, stocks);
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.find(s => s.ref === 'Y')?.currentStock).toBe(4);
    expect(result.movements.filter(m => m.stockItemRef === 'Y')).toHaveLength(1);
    expect(result.issues).toEqual([]);
  });
  it('does not debit inoculum a second time after its inventory count was corrected', () => {
    const b = batch();
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'starter-transferred', additions: { yeast: { amount: 1.5, unit: 'L', doneAt: 100 } } };
    b.yeastPreparation = { plan: { id: 'P', revision: 1, productId: 'PROD', context: 'c', protocol: { id: 'M', label: 'Starter', source: { url: 'https://example.test/source', title: 'Notice', checkedAt: '2026-09-01' }, method: 'Notice', medium: 'malt-extract', targetSg: 1.035, conditions: 'selon notice', leadHours: { min: 24, max: 48 }, steps: ['Aérer'] }, volumeL: 1.5, inoculum: '1 sachet', equipment: 'Flacon', startAt: '2026-09-07T12:00:00Z', targetPitchAt: '2026-09-09T12:00:00Z', status: 'planned', steps: [{ id: 'step-0', label: 'Aérer', dueAt: '2026-09-07T12:00:00Z' }] }, status: 'transferred', startedAt: 1, steps: [{ id: 'step-0', at: 2 }], inoculumUsed: { amount: 1, unit: 'sachet', stockItemRef: 'Y', inventoryAdjustedAt: 3 }, stockRegularization: [{ kind: 'inoculum', stockItemRef: 'Y', at: 3 }, { kind: 'medium', stockItemRef: 'MALTEX', at: 4 }], cultureVolumeL: 1.5 };
    const result = prepareBrewStockConsumption(b, stocks);
    expect(result.status).toBe('ready');
    expect(result.stockUpdates.some(s => s.ref === 'Y')).toBe(false);
    expect(result.movements.some(m => m.stockItemRef === 'Y')).toBe(false);
  });
  it('requires an explicit article for the starter inoculum even when a same-name item is unique', () => {
    const b = batch();
    b.brewDay = { currentIndex: 0, steps: [], pitchedAt: 100, pitchQuantityConfirmation: 'starter-transferred' };
    b.yeastPreparation = { plan: { id: 'P', revision: 1, productId: 'PROD', context: 'c', protocol: { id: 'M', label: 'Starter', source: { url: 'https://example.test/source', title: 'Notice', checkedAt: '2026-09-01' }, method: 'Notice', medium: 'malt-extract', targetSg: 1.035, conditions: 'selon notice', leadHours: { min: 24, max: 48 }, steps: ['Aérer'] }, volumeL: 1.5, inoculum: '1 sachet', equipment: 'Flacon', startAt: '2026-09-07T12:00:00Z', targetPitchAt: '2026-09-09T12:00:00Z', status: 'planned', steps: [{ id: 'step-0', label: 'Aérer', dueAt: '2026-09-07T12:00:00Z' }] }, status: 'transferred', startedAt: 1, steps: [{ id: 'step-0', at: 2 }], inoculumUsed: { amount: 1, unit: 'sachet' }, stockRegularization: [{ kind: 'medium', stockItemRef: 'MALTEX', at: 3 }] };
    const result = prepareBrewStockConsumption(b, stocks);
    expect(result.status).toBe('needs-review');
    expect(result.issues.join(' ')).toContain('Inoculum du starter : article de stock à associer');
    expect(result.stockUpdates).toEqual([]);
    expect(result.movements).toEqual([]);
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
