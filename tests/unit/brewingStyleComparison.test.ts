import { describe, expect, it } from 'vitest';
import { compareBeerWithBrewingStyle } from '../../src/domain/brewingStyleComparison';
import type { ListedStyle } from '../../src/domain/brewingStyles';

const style: ListedStyle = {
  id: 'fixture-style', name: 'Intention personnelle fictive', code: 'FX', family: 'personnel', aliases: [],
  stats: { ibu: { min: 15, max: 25 }, abv: { min: 4, max: 5 }, fg: { min: 1.01, max: 1.014 } },
  edition: 'Fixture', ref: { guideId: 'fixture-guide', version: '1', styleId: 'fixture-style' },
  source: { title: 'Fixture seulement', author: 'Test', year: null, kind: 'judgment', reference: 'fixture:style' }
};

describe('Intention de style et valeurs de bière séparées', () => {
  it('conserve inconnue, chevauchement et manque de cible sans faux accord global', () => {
    const result = compareBeerWithBrewingStyle(style, {
      ibu: { range: { min: 0, max: 0 }, origin: 'measured' },
      abv: { range: { min: 4.5, max: 5.5 }, origin: 'recipeProjection' },
      fg: { range: null, origin: 'recipeProjection' }
    });
    expect(result.dimensions.find(row => row.dimension === 'ibu')).toMatchObject({ status: 'below', range: { min: 0, max: 0 }, origin: 'measured' });
    expect(result.dimensions.find(row => row.dimension === 'abv')?.status).toBe('overlapping');
    expect(result.dimensions.find(row => row.dimension === 'fg')?.status).toBe('unknown');
    expect(result.dimensions.find(row => row.dimension === 'og')?.status).toBe('notSpecified');
    expect(result.outside).toEqual(['ibu']);
    expect(result.uncertain).toEqual(['fg', 'abv']);
  });
  it('renommer un style ne modifie ni nombres ni classement dimensionnel', () => {
    const values = { ibu: { range: { min: 20, max: 25 }, origin: 'scenarioHypothesis' as const } };
    expect(compareBeerWithBrewingStyle({ ...style, name: 'Un autre nom sans autre fait' }, values).dimensions)
      .toEqual(compareBeerWithBrewingStyle(style, values).dimensions);
  });
  it('modifier une cible agit sur la comparaison, jamais sur la projection de bière', () => {
    const values = { ibu: { range: { min: 20, max: 25 }, origin: 'recipeProjection' as const } };
    const before = compareBeerWithBrewingStyle(style, values);
    const after = compareBeerWithBrewingStyle({ ...style, stats: { ibu: { min: 30, max: 40 } } }, values);
    expect(before.dimensions.find(row => row.dimension === 'ibu')?.status).toBe('within');
    expect(after.dimensions.find(row => row.dimension === 'ibu')).toMatchObject({ status: 'below', range: { min: 20, max: 25 } });
    expect(values.ibu.range).toEqual({ min: 20, max: 25 });
  });
  it('refuse les bornes invalides plutôt que leur donner un statut utile', () => {
    expect(() => compareBeerWithBrewingStyle(style, { abv: { range: { min: 6, max: 3 }, origin: 'measured' } })).toThrow();
    expect(() => compareBeerWithBrewingStyle(style, { ibu: { range: { min: NaN, max: 25 }, origin: 'recipeProjection' } })).toThrow();
  });
});
