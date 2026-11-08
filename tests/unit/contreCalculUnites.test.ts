import { describe, expect, it } from 'vitest';
import { Units } from '../../src/services/units';
import { estimateBrewBudget, ignoredPurchaseLines, weightedBrewPrices } from '../../src/domain/finance/brewBudget';

// Contre-calcul du 08.11, CF-8 : « litres », « millilitres », « kilogramme », « gr » et « lt » (écrits en toutes lettres ou abrégés
// sur une facture lue) donnaient `null` : la ligne d'achat était sautée sans un mot dans le prix moyen du stock.
describe('CF-8 — unités écrites en toutes lettres', () => {
  it.each([
    [2, 'litres', 'L', 2], [500, 'millilitres', 'L', 0.5], [1, 'kilogramme', 'g', 1000], [3, 'Kg', 'g', 3000], [500, 'gr', 'g', 500],
    [2, 'lt', 'L', 2], [250, 'grammes', 'kg', 0.25], [1, 'litre', 'ml', 1000], [2, 'kilos', 'kg', 2], [75, 'centilitres', 'L', 0.75],
    [33, 'Cl.', 'l', 0.33], [1.5, 'ltr', 'l', 1.5], [20, 'liters', 'l', 20], [2, 'kilogrammes', 'kg', 2], [10, 'grs', 'g', 10],
    [5, 'décilitres', 'cl', 50], [100, 'milligrammes', 'g', 0.1]
  ])('%s %s -> %s : %s', (quantite, de, vers, attendu) => {
    expect(Units.convert(quantite, de, vers)).toBeCloseTo(attendu, 9);
  });

  it('une vraie pièce reste une pièce : « sachet » ne devient pas une masse', () => {
    expect(Units.convert(1, 'sachet', 'kg')).toBeNull();
    expect(Units.familyOf('pce')).toBe('piece');
  });
});

const stock = [{ id: 's1', ref: 'MP-001', name: 'Pale', unit: 'kg', currentStock: 10, category: 'Malt' }] as never;
const achat = (id: string, quantity: number, unit: string, amountCents: number) => ({
  id: `TX-${id}`, date: '01.09.2026', amountTTC: amountCents / 100, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents, lines: [{ id: `l-${id}`, description: 'Pale', kind: 'ingredient', amountCents, quantity, unit, stockItemRef: 'MP-001' }] }
}) as never;

describe('CF-8 — un achat non convertible n’est plus ignoré en silence', () => {
  it('« 500 gr » et « 1 kilogramme » entrent dans la moyenne pondérée du malt tenu en kg', () => {
    const prix = weightedBrewPrices([achat('a', 25, 'kg', 6250), achat('b', 500, 'gr', 150), achat('c', 1, 'kilogramme', 300)], stock);
    expect(prix['MP-001'].quantity).toBeCloseTo(26.5, 9);
    expect(prix['MP-001'].amount).toBeCloseTo(67, 2);
    expect(prix['MP-001'].note).not.toMatch(/ignoré/);
  });

  it('une ligne en « sachet » est listée, et la note du prix moyen la dit', () => {
    const transactions = [achat('a', 25, 'kg', 6250), achat('b', 3, 'sachet', 900)];
    const ignorees = ignoredPurchaseLines(transactions, stock);
    expect(ignorees).toEqual([expect.objectContaining({ stockRef: 'MP-001', unit: 'sachet', stockUnit: 'kg' })]);
    const prix = weightedBrewPrices(transactions, stock);
    expect(prix['MP-001'].amount).toBe(62.5);
    expect(prix['MP-001'].note).toMatch(/1 achat en unité non convertible ignoré/);
  });

  it('le budget d’un brassin le signale sur la ligne du malt', () => {
    const recipe = { id: 'r', name: 'R', style: '', volumeL: 20, boilMin: 60, fermentables: [{ name: 'Pale', weightKg: 4, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 6, stockItemRef: 'MP-001' }], hops: [], yeast: { name: 'US-05', qty: 0, unit: 'sachet' } } as never;
    const budget = estimateBrewBudget({ recipe, stockItems: stock, batches: [], brewDate: '2026-11-10', transactions: [achat('a', 25, 'kg', 6250), achat('b', 3, 'sachet', 900)],
      settings: { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false } } as never);
    expect(JSON.stringify(budget)).toMatch(/non convertible/);
  });
});
