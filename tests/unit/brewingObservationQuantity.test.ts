import { describe, expect, it } from 'vitest';
import { readNativeMassInGrams, subtractNativeMassesFromGrams } from '../../src/domain/brewingObservationQuantity';

describe('masses décimales des observations de houblon', () => {
  it('compare exactement 0,1 + 0,2 à 0,3 sans fabriquer un déficit flottant', () => {
    expect(0.3 - (0.1 + 0.2)).toBeLessThan(0); // Reproduit l’ancien faux déficit Number.

    const result = subtractNativeMassesFromGrams(0.3, [
      { value: 0.1, unit: 'g' }, { value: 0.2, unit: 'g' },
    ]);

    expect(result.status).toBe('equal');
    expect(result.realizedGrams).toBe(0.3);
    expect(result.remainingGrams).toBe(0);
    expect(result.deficitGrams).toBe(0);
    expect(result.exact).toMatchObject({
      totalGrams: { coefficient: '3', scale: 1, decimal: '0.3' },
      realizedGrams: { coefficient: '3', scale: 1, decimal: '0.3' },
      differenceGrams: { coefficient: '0', scale: 0, decimal: '0' },
    });
  });

  it('agrège exactement 5,49 + 281,72 + 32,79 g en 320 g', () => {
    const result = subtractNativeMassesFromGrams(320, [
      { value: 5.49, unit: 'g' }, { value: 281.72, unit: 'g' }, { value: 32.79, unit: 'g' },
    ]);

    expect(result.status).toBe('equal');
    expect(result.realizedGrams).toBe(320);
    expect(result.exact.realizedGrams?.decimal).toBe('320');
  });

  it('convertit chaque source d’unité différente avant de sommer', () => {
    const result = subtractNativeMassesFromGrams(320, [
      { value: 5.49, unit: 'g' }, { value: 0.28172, unit: 'kg' }, { value: 32790, unit: 'mg' },
    ]);

    expect(result.status).toBe('equal');
    expect(result.realizedGrams).toBe(320);
    expect(result.quantities.map(row => row.exactGrams?.decimal)).toEqual(['5.49', '281.72', '32.79']);
  });

  it('garde un vrai écart décimal voisin sans epsilon', () => {
    const result = subtractNativeMassesFromGrams(0.30000000000000004, [
      { value: 0.1, unit: 'g' }, { value: 0.2, unit: 'g' },
    ]);

    expect(result.status).toBe('remaining');
    expect(result.remainingGrams).toBe(4e-17);
    expect(result.exact.differenceGrams?.decimal).toBe('0.00000000000000004');
  });

  it('distingue un déficit réel d’une égalité sans clamp', () => {
    const result = subtractNativeMassesFromGrams(0.3, [
      { value: 0.1, unit: 'g' }, { value: 0.2, unit: 'g' }, { value: 0.001, unit: 'g' },
    ]);

    expect(result.status).toBe('deficit');
    expect(result.remainingGrams).toBeNull();
    expect(result.deficitGrams).toBe(0.001);
    expect(result.exact.differenceGrams?.decimal).toBe('-0.001');
  });

  it('prend le facteur et les alias de masse depuis Units tout en gardant la source brute', () => {
    const kilogram = readNativeMassInGrams(0.001, 'kg');
    const alias = readNativeMassInGrams(1, 'pounds');

    expect(kilogram).toMatchObject({ status: 'known', source: { value: 0.001, unit: 'kg' }, grams: 1,
      conversionFactor: { decimal: '1000' }, exactGrams: { decimal: '1' } });
    expect(alias).toMatchObject({ status: 'known', source: { value: 1, unit: 'pounds' }, grams: 453.59237,
      conversionFactor: { decimal: '453.59237' }, exactGrams: { decimal: '453.59237' } });
  });

  it.each([
    ['absente', null, 'g', 'invalidValue'],
    ['négative', -0.1, 'g', 'negativeValue'],
    ['sans unité', 1, '', 'invalidUnit'],
    ['à la pièce', 0, 'sachet', 'incompatibleUnit'],
  ])('refuse une source %s au lieu de la transformer en zéro gramme', (_case, value, unit, code) => {
    const result = readNativeMassInGrams(value, unit);

    expect(result.status).toBe('unknown');
    if (result.status === 'unknown') expect(result.issue.code).toBe(code);
  });

  it('refuse une conversion positive qui déborde ou sous-déborde la représentation Number', () => {
    const overflow = readNativeMassInGrams(Number.MAX_VALUE, 'kg');
    const underflow = readNativeMassInGrams(Number.MIN_VALUE, 'mg');

    expect(overflow.status).toBe('unknown');
    if (overflow.status === 'unknown') expect(overflow.issue.code).toBe('overflow');
    expect(underflow.status).toBe('unknown');
    if (underflow.status === 'unknown') expect(underflow.issue.code).toBe('underflow');
  });

  it('refuse toute soustraction dès qu’une des quantités réalisées est inconnue ou incompatible', () => {
    const unknown = subtractNativeMassesFromGrams(10, [
      { value: 2, unit: 'g' }, { value: null, unit: 'g' },
    ]);
    const incompatible = subtractNativeMassesFromGrams(10, [{ value: 2, unit: 'sachet' }]);

    expect(unknown.status).toBe('unknown');
    expect(unknown.remainingGrams).toBeNull();
    expect(unknown.issues).toContainEqual(expect.objectContaining({ code: 'invalidValue', index: 1 }));
    expect(incompatible.status).toBe('unknown');
    expect(incompatible.issues).toContainEqual(expect.objectContaining({ code: 'incompatibleUnit', index: 0 }));
  });
});
