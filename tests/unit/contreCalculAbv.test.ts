import { describe, expect, it } from 'vitest';
import { alcoholByVolume } from '../../src/domain/alcohol';
import { BrewingMath } from '../../src/services/brewingMath';
import { abvFromGravities } from '../../src/domain/gravityBounds';
import { projectYeastRecipe } from '../../src/domain/yeastProjection';
import { batchEntries } from '../../src/domain/productionCatalog';

// Contre-calcul du 08.11, CF-6 : (OG − FG) × 131,25 sous-estime l'alcool des bières fortes (imperial stout 1,102 → 1,026 :
// 10,0 % vol affichés pour 10,4 en méthode officielle ASBC Beer-4, extrait réel de Balling). Une seule fonction pour la projection,
// le brassin mesuré et les bornes. Sous 1,070 elle reste à 0,2 % vol de l'ancienne formule.
const simple = (og: number, fg: number) => (og - fg) * 131.25;

describe('CF-6 — alcool par la méthode ASBC (Balling)', () => {
  it('imperial stout 1,102 → 1,026 : 10,4 % vol (10,0 avant)', () => {
    expect(alcoholByVolume(1.102, 1.026)).toBeGreaterThan(10.3);
    expect(alcoholByVolume(1.102, 1.026)).toBeLessThan(10.5);
    expect(BrewingMath.calculateABV(1.102, 1.026)).toBe(10.4);
    expect(abvFromGravities(1.102, 1.026)).toBe(10.4);
  });

  it('bière ordinaire 1,050 → 1,010 : 5,3 %, comme avant', () => {
    expect(BrewingMath.calculateABV(1.05, 1.01)).toBe(5.3);
  });

  it('sous 1,070, l’écart avec l’ancienne formule reste sous 0,2 % vol (OG 1,020 à 1,070, atténuation 50 à 95 %)', () => {
    let pire = 0;
    for (let og = 1.02; og <= 1.0701; og += 0.002)
      for (let att = 0.5; att <= 0.951; att += 0.05) {
        const fg = 1 + (og - 1) * (1 - att);
        pire = Math.max(pire, Math.abs(alcoholByVolume(og, fg) - simple(og, fg)));
      }
    expect(pire).toBeLessThanOrEqual(0.2);
  });

  it('une FG au niveau de l’OG ou au-dessus, ou une valeur non numérique, donne 0 : pas d’alcool inventé', () => {
    expect(alcoholByVolume(1.05, 1.05)).toBe(0);
    expect(alcoholByVolume(1.05, 1.06)).toBe(0);
    expect(alcoholByVolume(Number.NaN, 1.01)).toBe(0);
  });

  it('la projection d’une recette forte lit la même fonction que le brassin mesuré', () => {
    const recette: never = {
      id: 'r', name: 'Imperial', style: 'Imperial Stout', volumeL: 20, boilMin: 90, efficiencyPct: 65,
      fermentables: [
        { name: 'Pale', weightKg: 9, potentialPpg: 37, colorEbc: 6, kind: 'grain', use: 'empatage' },
        { name: 'Chocolat', weightKg: 0.6, potentialPpg: 28, colorEbc: 900, kind: 'grain', use: 'empatage' },
        { name: 'Crystal', weightKg: 0.5, potentialPpg: 33, colorEbc: 150, kind: 'grain', use: 'empatage' }
      ],
      hops: [], yeast: { name: 'Levure', form: 'sèche', qty: 1, unit: 'sachet', attenuationPct: 75, attenuationBasis: 'recipe' }
    } as never;
    const p = projectYeastRecipe(recette, { attenuationPct: 75, attenuationBasis: 'recipe' });
    expect(p.og).toBeGreaterThan(1.09);
    const fg = p.fg.range!;
    expect(p.abv.range!.min).toBeCloseTo(alcoholByVolume(p.og!, fg.max), 10);
    expect(p.abv.range!.max).toBeCloseTo(alcoholByVolume(p.og!, fg.min), 10);
    expect(p.abv.range!.max).toBeGreaterThan(simple(p.og!, fg.min) + 0.2);
  });

  it('un alcool mesuré et enregistré garde sa valeur : aucun recalcul', () => {
    const lot = { id: 'b', name: 'Imperial', volumeL: 20, og: '1.102', fg: '1.026', abv: '10%' } as never;
    expect(batchEntries([lot])[0].abv).toBe(10);
  });
});
