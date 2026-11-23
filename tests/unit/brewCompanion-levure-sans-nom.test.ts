import { describe, expect, it } from 'vitest';
import { brewIngredients } from '../../src/domain/brewCompanion';
import type { RecipeSnapshot } from '../../src/types';

describe('WF2-1 : une levure liée au stock sans nom ne casse pas le déroulé du jour', () => {
  it('la levure a un nom lisible, jamais undefined', () => {
    const recette = { name: 'ZZ TEST Saison', volumeL: 100, ogTarget: 1.05, fermentables: [], hops: [], yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' } } as unknown as RecipeSnapshot;
    const levure = brewIngredients(recette).find((i) => i.id === 'yeast');
    expect(levure?.name).toBe('Levure');
    expect(() => levure!.name.trim().toLowerCase()).not.toThrow();
  });
});
