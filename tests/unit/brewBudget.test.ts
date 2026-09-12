import { describe, expect, it } from 'vitest';
import type { Batch, Recipe, StockItem } from '../../src/types';
import { newNoloConfig } from '../../src/domain/nolo';
import { annualBrewFixedCosts, brewBudgetDateKey, brewBudgetDemands, demandKey, estimateBrewBudget, latestBrewPrices, matchingRecipeBrewPlans, resolveBudgetStock, type BrewBudgetSettings, type BrewPrice } from '../../src/domain/finance/brewBudget';
import type { FinanceTransaction, FinancialPlan } from '../../src/domain/finance/types';

const recipe = (patch: Partial<Recipe> = {}): Recipe => ({ id: 'R1', name: 'Pale Ale', volumeL: 30, style: 'Pale Ale', fermentables: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' }, ...patch } as Recipe);
const stock = (patch: Partial<StockItem> = {}): StockItem => ({ id: 's1', ref: 'MP-1', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 0, reorder: false, ...patch });
const price = (patch: Partial<BrewPrice> = {}): BrewPrice => ({ amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, date: '09.09.2026', source: 'manual', ...patch });
const settings: BrewBudgetSettings = { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false };
const input = (patch = {}) => ({ recipe: recipe(), stockItems: [stock()], batches: [], brewDate: '15.09.2026', settings, prices: { [demandKey('Pilsner', 'kg')]: price() }, now: '2026-09-09T12:00:00Z', ...patch });
const batch = (patch: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Prior brew', style: 'Pale Ale', volumeL: 30, brewDate: '10.09.2026', status: 'planifie', recipeSnapshot: { ...recipe(), sourceRecipeId: 'R1', capturedAt: '' }, ...patch } as Batch);

describe('brew planner reconciliation', () => {
  const plan = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'P', title: 'Loyer', date: '2026-09-15', amountCents: 10000, category: 'chargesFixes', source: 'recurring', status: 'active', direction: 'out', recurrence: { frequency: 'monthly' }, createdAt: '2026-09-09', ...patch });
  it('allocates only confirmed overhead, not energy already costed per brew', () => {
    expect(annualBrewFixedCosts([plan({ costAllocation: 'fixed' }), plan({ id: 'energy', title: 'Énergie', costAllocation: 'brew' })])).toEqual({ amountCHF: 1200, warnings: [] });
    expect(annualBrewFixedCosts([plan()]).amountCHF).toBeUndefined();
    expect(annualBrewFixedCosts([plan()]).warnings[0]).toContain('Loyer');
    expect(annualBrewFixedCosts([]).amountCHF).toBeUndefined();
  });
  it('finds only active recipe intentions matching a real batch date and volume', () => {
    const recipeEstimate = estimateBrewBudget(input());
    const batchEstimate = estimateBrewBudget(input({ batchId: 'B1' }));
    const plans = [plan({ id: 'match', source: 'brew', brewEstimate: recipeEstimate }), plan({ id: 'other-date', source: 'brew', brewEstimate: { ...recipeEstimate, brewDate: '16.09.2026' } }), plan({ id: 'other-volume', source: 'brew', brewEstimate: { ...recipeEstimate, volumeL: 60 } }), plan({ id: 'already-batch', source: 'brew', brewEstimate: { ...recipeEstimate, batchId: 'B2' } }), plan({ id: 'draft', source: 'brew', brewEstimate: recipeEstimate, status: 'draft' })];
    expect(matchingRecipeBrewPlans(plans, batchEstimate).map(p => p.id)).toEqual(['match']);
    expect(matchingRecipeBrewPlans(plans, recipeEstimate)).toEqual([]);
    expect(plans[0].status).toBe('active');
  });
});

describe('budget for the whole brew', () => {
  it('does not buy recovered grain again but retains fresh second-runnings additions', () => {
    const r = recipe({ nolo: { ...newNoloConfig(), process: 'secondRunnings' }, fermentables: [
      { name: 'Recovered pilsner', weightKg: 5, kind: 'grain', use: 'empatage' },
      { name: 'Fresh candi', weightKg: .1, kind: 'sucre', use: 'fermentation' },
    ] });
    expect(brewBudgetDemands(r).map(d => [d.name, d.quantity])).toEqual([['Fresh candi', .1]]);
    r.nolo!.enabled = false;
    expect(brewBudgetDemands(r).find(d => d.name === 'Recovered pilsner')?.quantity).toBe(5);
  });
  it('separates consumed cost, purchase gap and cost per net litre', () => {
    const result = estimateBrewBudget(input({ netVolumeL: 25 }));
    expect(result.ingredientsCost).toBe(15);
    expect(result.purchasesTTC).toBe(9);
    expect(result.costPerL).toBe(.6);
    expect(result.complete).toBe(true);
  });
  it('does not ask to pay for stock already owned', () => {
    const result = estimateBrewBudget(input({ stockItems: [stock({ currentStock: 50 })] }));
    expect(result.cashRequiredTTC).toBe(0);
    expect(result.ingredientsCost).toBe(15);
  });
  it('prices whole bags without allocating the whole bag as consumed', () => {
    const result = estimateBrewBudget(input({ prices: { [demandKey('Pilsner', 'kg')]: price({ amount: 60, quantity: 25, packQuantity: 25 }) } }));
    expect(result.lines[0].purchaseQuantity).toBe(25);
    expect(result.purchasesTTC).toBe(60);
    expect(result.ingredientsCost).toBe(12);
  });
  it('purchases one shared pack when two ingredient aliases bind to the same article', () => {
    const r = recipe({ fermentables: [], hops: [{ name: 'Citra T90', weightG: 50, stage: 'whirlpool', alpha: 10 }, { name: 'Citra pellets', weightG: 50, stage: 'dryHop', alpha: 10 }] });
    const result = estimateBrewBudget(input({ recipe: r, stockItems: [stock({ name: 'Citra', unit: 'g', currentStock: 0 })], bindings: { [demandKey('Citra T90', 'g')]: 'MP-1', [demandKey('Citra pellets', 'g')]: 'MP-1' }, prices: { [demandKey('Citra T90', 'g')]: price({ amount: 5, quantity: 100, unit: 'g', packQuantity: 100 }), [demandKey('Citra pellets', 'g')]: price({ amount: 5, quantity: .1, unit: 'kg', packQuantity: .1 }) } }));
    expect(result.purchasesTTC).toBe(5);
    expect(result.ingredientsCost).toBe(5);
    expect(result.lines.map(line => line.purchaseQuantity)).toEqual([100, 0]);
  });
  it('combines all hop additions including dry hop and fermentation sugars', () => {
    const demands = brewBudgetDemands(recipe({ fermentables: [{ name: 'Candi', weightKg: .5, kind: 'sucre', use: 'fermentation' }], hops: [{ name: 'Citra', weightG: 40, stage: 'whirlpool', alpha: 10 }, { name: 'Citra', weightG: 60, stage: 'dryHop', alpha: 10 }], adjuncts: [{ name: 'Vanille', amount: 2, unit: 'gousse', step: 'Fermenteur' }] }));
    expect(demands.find(d => d.name === 'Citra')?.quantity).toBe(100);
    expect(demands.find(d => d.name === 'Candi')?.quantity).toBe(.5);
    expect(demands.find(d => d.name === 'Vanille')?.quantity).toBe(2);
  });
  it('includes RO and network water, salts on both sides and retained acid', () => {
    const demands = brewBudgetDemands(recipe({ waterPlan: { sourceId: 'tap', mashWaterL: 20, spargeWaterL: 10, diRatioPct: 50, spargeDiRatioPct: 100, mash: { gypse: 1 }, sparge: { gypse: 2 }, acid: { id: 'lactique', mash: 2, sparge: 3 }, targetPh: 5.3 } as Recipe['waterPlan'] }));
    expect(demands.find(d => d.name === 'Eau osmosée')?.quantity).toBe(20);
    expect(demands.find(d => d.name === 'Eau du réseau')?.quantity).toBe(10);
    expect(demands.some(d => d.kind === 'treatment' && d.quantity === 5 && d.unit === 'mL')).toBe(true);
  });
  it('converts kg of stock and per-kg price to a hop requirement in grams', () => {
    const r = recipe({ fermentables: [], hops: [{ name: 'Citra', weightG: 100, stage: 'dryHop', alpha: 10 }] });
    const result = estimateBrewBudget(input({ recipe: r, stockItems: [stock({ name: 'Citra', unit: 'kg', currentStock: .07 })], prices: { [demandKey('Citra', 'g')]: price({ amount: 50 }) } }));
    expect(result.lines[0].available).toBe(70);
    expect(result.ingredientsCost).toBe(5);
    expect(result.purchasesTTC).toBe(1.5);
  });
  it('never silently converts sachets to grams', () => {
    const r = recipe({ fermentables: [], yeast: { name: 'US05', qty: 2, unit: 'sachet', form: 'sèche' } });
    const result = estimateBrewBudget(input({ recipe: r, stockItems: [stock({ name: 'US05', unit: 'g', currentStock: 100 })], prices: { [demandKey('US05', 'sachet')]: price({ unit: 'g' }) } }));
    expect(result.complete).toBe(false);
    expect(result.lines[0].consumedCost).toBeNull();
    expect(result.lines[0].issues).toContain('Unité de stock incompatible');
  });
  it('shows missing price as unknown while allowing a real free product', () => {
    expect(estimateBrewBudget(input({ prices: {} })).lines[0].consumedCost).toBeNull();
    expect(estimateBrewBudget(input({ prices: { [demandKey('Pilsner', 'kg')]: price({ amount: 0 }) } })).complete).toBe(true);
  });
  it('does not trust old prices with unknown VAT basis', () => {
    const result = estimateBrewBudget(input({ stockItems: [stock({ pricePerUnit: 3 })], prices: {} }));
    expect(result.lines[0].issues).toContain('Ancien prix à confirmer (HT ou TTC)');
  });
  it('rejects nonfinite pack sizes and negative ingredient amounts without producing NaN money', () => {
    const invalidPack = estimateBrewBudget(input({ prices: { [demandKey('Pilsner', 'kg')]: price({ packQuantity: Infinity }) } }));
    expect(invalidPack.complete).toBe(false);
    expect(Number.isFinite(invalidPack.cashRequiredTTC)).toBe(true);
    const invalidRecipe = estimateBrewBudget(input({ recipe: recipe({ fermentables: [{ name: 'Pilsner', weightKg: -5, kind: 'grain', use: 'empatage' }] }) }));
    expect(invalidRecipe.complete).toBe(false);
    expect(invalidRecipe.issues).toContain('Pilsner : quantité invalide');
  });
  it('separates recoverable VAT from the cash purchase', () => {
    const result = estimateBrewBudget(input({ isTvaRegistered: true, prices: { [demandKey('Pilsner', 'kg')]: price({ amount: 10, basis: 'HT', tvaRate: .081 }) } }));
    expect(result.ingredientsCost).toBe(50);
    expect(result.purchasesTTC).toBe(32.43);
  });
  it('allocates annual fixed and depreciation cost without increasing cash', () => {
    const result = estimateBrewBudget(input({ netVolumeL: 25, settings: { ...settings, annualVolumeL: 1000, annualFixedCHF: 2000, annualDepreciationCHF: 1000, includeFixed: true, includeDepreciation: true } }));
    expect(result.fixedAllocation).toBe(50);
    expect(result.depreciationAllocation).toBe(25);
    expect(result.totalCost).toBe(90);
    expect(result.cashRequiredTTC).toBe(9);
  });
  it('keeps recurring energy in cost without paying for it a second time', () => {
    const result = estimateBrewBudget(input({ settings: { ...settings, costs: { ...settings.costs, energy: { enabled: true, amountTTC: 8, cashTreatment: 'included-in-recurring' } } } }));
    expect(result.totalCost).toBe(23);
    expect(result.cashRequiredTTC).toBe(9);
    expect(result.operatingCashTTC).toBe(0);
  });
  it('includes the water bill unless the brewer explicitly confirms recurring coverage', () => {
    const r = recipe({ waterPlan: { sourceId: 'tap', mashWaterL: 20, spargeWaterL: 0, diRatioPct: 0, mash: {}, sparge: {}, targetPh: 5.3 } as Recipe['waterPlan'] });
    const result = estimateBrewBudget(input({ recipe: r, prices: { [demandKey('Pilsner', 'kg')]: price(), [demandKey('Eau du réseau', 'L')]: price({ amount: .01, unit: 'L' }) } }));
    expect(result.totalCost).toBe(15.2);
    expect(result.cashRequiredTTC).toBe(9.2);
    const recurring = estimateBrewBudget(input({ recipe: r, cashTreatments: { [demandKey('Eau du réseau', 'L')]: 'included-in-recurring' }, prices: { [demandKey('Pilsner', 'kg')]: price(), [demandKey('Eau du réseau', 'L')]: price({ amount: .01, unit: 'L' }) } }));
    expect(recurring.totalCost).toBe(15.2);
    expect(recurring.cashRequiredTTC).toBe(9);
  });
  it('refuses complete totals when annual production is unknown', () => {
    const result = estimateBrewBudget(input({ settings: { ...settings, annualFixedCHF: 1000, includeFixed: true } }));
    expect(result.complete).toBe(false);
    expect(result.issues).toContain('Volume annuel nécessaire pour répartir les charges');
  });
  it('does not mutate stock, recipes, settings or saved snapshots', () => {
    const source = input(); const serialized = JSON.stringify(source);
    const result = estimateBrewBudget(source);
    source.recipe.fermentables[0].weightKg = 10;
    expect(result.recipeSnapshot.fermentables[0].weightKg).toBe(5);
    source.recipe.fermentables[0].weightKg = 5;
    expect(JSON.stringify(source)).toBe(serialized);
  });
});

describe('stock allocation is chronological and exact', () => {
  it('earlier batches get priority and later batches do not change this brew', () => {
    const result = estimateBrewBudget(input({ stockItems: [stock({ currentStock: 7 })], batches: [batch(), batch({ id: 'B2', brewDate: '20.09.2026' })] }));
    expect(result.lines[0].available).toBe(2);
    expect(result.lines[0].reserved).toBe(5);
    expect(result.purchasesTTC).toBe(9);
  });
  it('does not reserve the edited batch twice or reserve cancelled batches', () => {
    const result = estimateBrewBudget(input({ batchId: 'B1', stockItems: [stock({ currentStock: 7 })], batches: [batch(), batch({ id: 'B2', status: 'annule' })] }));
    expect(result.lines[0].available).toBe(7);
    expect(result.purchasesTTC).toBe(0);
  });
  it('keeps fermentation reservations when an already brewed batch is moved back to planned', () => {
    const prior = batch({ stockAccountingVersion: 1, stockConsumption: { appliedAt: '2026-09-09', eventId: 'brew', items: [], pendingItems: [{ stockItemRef: 'MP-1', quantity: 3, unit: 'kg' }], completedStages: ['brewday'] } });
    const result = estimateBrewBudget(input({ stockItems: [stock({ currentStock: 5 })], batches: [prior] }));
    expect(result.lines[0].available).toBe(2);
    expect(result.lines[0].reserved).toBe(3);
    expect(result.purchasesTTC).toBe(9);
  });
  it('does not merge identically named ingredients with distinct stable stock references', () => {
    const r = recipe({ hops: [{ name: 'Citra', weightG: 50, stage: 'whirlpool', alpha: 10, stockItemRef: 'H1' }, { name: 'Citra', weightG: 60, stage: 'dryHop', alpha: 10, stockItemRef: 'H2' }] });
    const demands = brewBudgetDemands(r).filter(demand => demand.name === 'Citra');
    expect(demands.map(d => [d.stockItemRef, d.quantity])).toEqual([['H1', 50], ['H2', 60]]);
    expect(new Set(demands.map(d => d.key)).size).toBe(2);
  });
  it('marks an old planning stock history uncertain instead of presenting a final estimate', () => {
    const result = estimateBrewBudget(input({ batches: [batch()] }));
    expect(result.complete).toBe(false);
    expect(result.issues.some(issue => issue.includes('historique du stock à confirmer'))).toBe(true);
  });
  it('uses stable refs and refuses fuzzy or ambiguous matches', () => {
    const demand = brewBudgetDemands(recipe())[0];
    expect(resolveBudgetStock(demand, [stock({ name: 'Pilsner bio' })]).item).toBeUndefined();
    expect(resolveBudgetStock(demand, [stock(), stock({ ref: 'MP2' })]).item).toBeUndefined();
    expect(resolveBudgetStock({ ...demand, stockItemRef: 'MP2' }, [stock(), stock({ ref: 'MP2' })]).item?.ref).toBe('MP2');
    expect(resolveBudgetStock({ ...demand, stockItemRef: 'gone' }, [stock()]).item).toBeUndefined();
  });
  it('rejects invalid dates rather than rolling them into another month', () => {
    expect(brewBudgetDateKey('31.02.2026')).toBeNull();
    expect(brewBudgetDateKey('29.02.2028')).toBe('2028-02-29');
  });
});

describe('invoice price provenance', () => {
  const tx = (id: string, date: string, amountCents: number): FinanceTransaction => ({ id, date, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents, lines: [{ id: 'line', description: 'Malt', kind: 'ingredient', stockItemRef: 'MP-1', unit: 'kg', quantity: 25, amountCents }] } } as FinanceTransaction);
  it('takes the latest explicit price, excluding refunds, voids and future invoices', () => {
    const transactions = [tx('old', '01.08.2026', 5000), tx('new', '01.09.2026', 6000), tx('future', '01.10.2026', 7000), { ...tx('void', '02.09.2026', 9000), finance: { ...tx('void', '', 9000).finance, voidedAt: '2026-09-02' } }];
    expect(latestBrewPrices(transactions, '2026-09-15')['MP-1']).toMatchObject({ amount: 60, quantity: 25, source: 'invoice', date: '01.09.2026' });
    const result = estimateBrewBudget(input({ transactions, prices: {} }));
    expect(result.ingredientsCost).toBe(11.6); // 2 kg owned at weighted 2.20 + 3 kg purchased at latest 2.40.
    expect(result.purchasesTTC).toBe(7.2);
    expect(result.lines[0].price?.note).toBe('new');
    expect(result.lines[0].inventoryPrice?.note).toContain('Moyenne pondérée');
  });
  it('does not derive line prices from old mixed invoices or absent quantities', () => {
    expect(latestBrewPrices([{ id: 'old', date: '01.09.2026', amountTTC: 100 } as FinanceTransaction])).toEqual({});
    const invalid = tx('missing-qty', '01.09.2026', 5000); delete invalid.finance.lines[0].quantity;
    expect(latestBrewPrices([invalid])).toEqual({});
  });
});
