import { describe, it, expect } from 'vitest';
import { RecipeTextParser } from '../../src/services/recipeParser';

/** AM-33 : un houblon sans moment, ou à l'empâtage, ne devient pas une ébullition en silence. */
const base = (hopLine: string) =>
  `Test\nVolume 20 L\n4 kg malt pils\n${hopLine}\nLevure US-05 11 g\n`;

describe('AM-33 — moment du houblon à l’import collé', () => {
  it('un houblon sans moment ni durée est signalé, pas lu en silence à l’ébullition', () => {
    const r = RecipeTextParser.parse(base('30 g Cascade hops 5.5% alpha'));
    expect(r.hops).toHaveLength(1);
    expect(r.warnings.some((w) => /moment/i.test(w) && /Cascade/.test(w))).toBe(true);
  });

  it('un houblon à l’empâtage est signalé (le modèle n’a pas ce moment)', () => {
    const r = RecipeTextParser.parse(base('30 g Saaz hops (mash hop) 4% alpha'));
    expect(r.hops).toHaveLength(1);
    expect(r.warnings.some((w) => /empâtage/i.test(w) && /Saaz/.test(w))).toBe(true);
  });

  it('un houblon à l’empattage (orthographe du brasseur) est signalé de même', () => {
    const r = RecipeTextParser.parse(base('30 g Saaz hops (empattage) 4% alpha'));
    expect(r.warnings.some((w) => /empâtage/i.test(w) && /Saaz/.test(w))).toBe(true);
  });

  it('un houblon avec sa durée ne reçoit aucune alerte de moment', () => {
    const r = RecipeTextParser.parse(base('30 g Cascade hops (60 min) 5.5% alpha'));
    expect(r.hops[0].stage).toBe('boil');
    expect(r.warnings.some((w) => /moment/i.test(w))).toBe(false);
  });
});
