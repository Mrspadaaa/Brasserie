import { describe, expect, it } from 'vitest';
import { eauEmpatageVisee, temperatureEauFrappe } from '../../src/domain/brewDayCalculs';
import { lignesPesee } from '../../src/domain/brewLaunch';
import type { BrewDayState, Recipe, RecipeSnapshot } from '../../src/types';

// N2 (v09) : l'eau d'empâtage visée par l'équation de Palmer, et la pesée du jour J.
describe('temperatureEauFrappe (Palmer, How to Brew, « Infusion Mash Calculations »)', () => {
  it('20 kg de grain à 20 °C, 60 L (3 L/kg), maische à 67 °C : ≈ 73,4 °C', () => {
    expect(temperatureEauFrappe({ eauL: 60, grainKg: 20, cibleC: 67, grainC: 20 })).toBe(73.4);
  });
  it("redonne l'exemple de Palmer : 1,5 qt/lb, grain 70 °F, maische 154 °F → eau ≈ 165 °F (74 °C)", () => {
    const r = (1.5 * 0.946353) / 0.453592; // L/kg
    const f2c = (f: number) => ((f - 32) * 5) / 9;
    const eau = temperatureEauFrappe({ eauL: r * 10, grainKg: 10, cibleC: f2c(154), grainC: f2c(70) });
    expect(eau).not.toBeNull();
    expect(Math.abs(eau! - f2c(165.2))).toBeLessThan(0.2);
  });
  it('plus d’eau par kilo : une eau moins chaude', () => {
    expect(temperatureEauFrappe({ eauL: 80, grainKg: 20, cibleC: 67, grainC: 20 })!).toBeLessThan(73.4);
  });
  it('une donnée manque ou est incohérente : null, jamais une valeur devinée', () => {
    expect(temperatureEauFrappe({ eauL: 60, grainKg: 0, cibleC: 67, grainC: 20 })).toBeNull();
    expect(temperatureEauFrappe({ eauL: null, grainKg: 20, cibleC: 67, grainC: 20 })).toBeNull();
    expect(temperatureEauFrappe({ eauL: 60, grainKg: 20, cibleC: undefined, grainC: 20 })).toBeNull();
    expect(temperatureEauFrappe({ eauL: 60, grainKg: 20, cibleC: 18, grainC: 20 })).toBeNull();
    // 1 L/kg, grain très froid : l'eau dépasserait 100 °C, aucune visée.
    expect(temperatureEauFrappe({ eauL: 5, grainKg: 20, cibleC: 67, grainC: -40 })).toBeNull();
  });
});

describe('eauEmpatageVisee : le premier palier de la journée', () => {
  const recette = {} as RecipeSnapshot;
  const etat = (steps: { id: string; tempC?: number }[]) =>
    ({ steps: steps.map((s) => ({ label: s.id, durationMin: 60, ...s })), currentIndex: 0, readings: [], mashContext: { waterL: 60, gristKg: 20 } }) as unknown as BrewDayState;
  it('vise le premier palier (67 °C), grain supposé à 20 °C', () => {
    const v = eauEmpatageVisee(recette, etat([{ id: 'eau' }, { id: 'concassage' }, { id: 'mash-1', tempC: 67 }, { id: 'mash-2', tempC: 72 }]));
    expect(v).toMatchObject({ eauC: 73.4, cibleC: 67, grainC: 20, grainHypothese: true, eauL: 60, grainKg: 20 });
  });
  it('sans palier chiffré : null', () => {
    expect(eauEmpatageVisee(recette, etat([{ id: 'eau' }, { id: 'mash-1' }]))).toBeNull();
  });
});

describe('lignesPesee : la pesée du jour J', () => {
  const recette = {
    fermentables: [
      { name: 'ZZ TEST Malt pilsner', weightKg: 18, use: 'empatage', kind: 'grain' },
      { name: 'ZZ TEST Munich', weightKg: 2, use: 'empatage', kind: 'grain' },
      { name: 'ZZ TEST Dextrose', weightKg: 1, use: 'fermentation', kind: 'sugar' }
    ],
    hops: [
      { name: 'ZZ TEST Magnum', weightG: 50, alpha: 12.5, stage: 'boil', timeMin: 60 },
      { name: 'ZZ TEST Citra', weightG: 100, alpha: 13, stage: 'dryHop', dayOffset: 4 }
    ]
  } as unknown as Recipe;
  const stock = [
    { name: 'ZZ TEST Malt pilsner', currentStock: 25, unit: 'kg' },
    { name: 'zz test munich', currentStock: 1500, unit: 'g' }
  ];
  const lignes = lignesPesee(recette, stock);
  it('malts et houblons de la journée, sans dry hop ni ajout de fermentation', () => {
    expect(lignes.map((l) => `${l.nom} ${l.quantite} ${l.unite}`)).toEqual(['ZZ TEST Malt pilsner 18 kg', 'ZZ TEST Munich 2 kg', 'ZZ TEST Magnum 50 g']);
    expect(lignes[2]).toMatchObject({ alpha: 12.5 });
    expect(lignes[2].moment).toMatch(/Ébullition/);
  });
  it('couvert : le stock couvre (vrai), manque (faux), aucune ligne de stock (null)', () => {
    expect(lignes.map((l) => l.couvert)).toEqual([true, false, null]);
    expect(lignes[1].enStock).toBe(1.5);
    expect(lignes[2].enStock).toBeUndefined();
  });
  it('des clés uniques par ligne', () => {
    expect(new Set(lignes.map((l) => l.cle)).size).toBe(lignes.length);
  });
});

describe("eauEmpatageVisee sans plan d'eau : le rapport de l'installation", () => {
  it('20 kg de grain à 3 L/kg (installation) : 60 L, eau ≈ 73,4 °C, rapport dit', () => {
    const recette = {
      brewhouse: { mashRatioLPerKg: 3 },
      fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 18, kind: 'grain' }, { name: 'ZZ TEST Munich', weightKg: 2, kind: 'grain' }]
    } as unknown as RecipeSnapshot;
    const etat = { steps: [{ id: 'eau', label: 'eau', durationMin: 10 }, { id: 'mash-1', label: 'p', durationMin: 60, tempC: 67 }], currentIndex: 0, readings: [] } as unknown as BrewDayState;
    expect(eauEmpatageVisee(recette, etat)).toMatchObject({ eauC: 73.4, eauL: 60, grainKg: 20, rapportInstallation: 3 });
  });
  it('ni plan d’eau ni rapport : null', () => {
    const recette = { fermentables: [{ name: 'x', weightKg: 20, kind: 'grain' }] } as unknown as RecipeSnapshot;
    const etat = { steps: [{ id: 'mash-1', label: 'p', durationMin: 60, tempC: 67 }], currentIndex: 0, readings: [] } as unknown as BrewDayState;
    expect(eauEmpatageVisee(recette, etat)).toBeNull();
  });
});
