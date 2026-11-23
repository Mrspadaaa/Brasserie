import { describe, expect, it } from 'vitest';
import type { BrewhouseProfile, Recipe, WaterSource } from '../../src/types';
import { scaleBrewBudgetRecipe, scaleBrewRecipeScenario } from '../../src/domain/finance/brewBudgetScaling';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { replanRecipeWater } from '../../src/domain/recipeWater';
import { BrewingMath } from '../../src/services/brewingMath';
import { recipe as baseRecipe } from '../fixtures/brewCompanion';

const originalProfile: BrewhouseProfile = {
  id: 'rig', name: 'Cuverie', volumeL: 24, efficiencyPct: 75,
  mashRatioLPerKg: 3.5, boilOffRatePct: 10, deadSpaceL: 1.5,
  equipment: { ...practicalEquipment }
};
const targetProfile: BrewhouseProfile = {
  ...originalProfile, efficiencyPct: 60,
  preferences: { ...practicalBrewingPreferences },
  calibrationHistory: [{ id: 'calibration-1' }] as BrewhouseProfile['calibrationHistory']
};
const source: WaterSource = {
  id: 'water', name: 'Analyse conservée', ph: 7.5,
  ca: 50, mg: 5, na: 8, so4: 25, cl: 30, hco3: 280
};
function recipe(): Recipe {
  const result: Recipe = {
    ...baseRecipe(), id: 'R24', volumeL: 24, efficiencyPct: 75,
    brewhouse: structuredClone(originalProfile),
    adjuncts: [{ name: 'Écorce', amount: 12, unit: 'g', step: 'Ébullition' }],
    waterPlan: {
      ...baseRecipe().waterPlan!, sourceId: source.id, sourceSnapshot: structuredClone(source),
      mashWaterL: 20, spargeWaterL: 15, targetProfileId: '18B',
      autoTreatment: true, allSaltsInMash: true
    }
  };
  result.waterPlan = { ...replanRecipeWater(result).plan, measuredPh: 5.4, measuredSpargePh: 5.8 };
  return result;
}

const operations = [
  { name: 'budget et création rapide', apply: (input: Recipe) => scaleBrewBudgetRecipe(input, 26, originalProfile, targetProfile) },
  { name: 'scénario de production', apply: (input: Recipe) => scaleBrewRecipeScenario(input, 26, originalProfile, targetProfile).scaledRecipe }
];

describe.each(operations)('Traitement d’eau commun au $name', ({ apply }) => {
  it('conserve le dosage automatique final, la provenance du profil et aucune ancienne mesure', () => {
    const input = recipe(), before = structuredClone(input);
    const core = BrewingMath.scaleRecipe(input, 26, originalProfile, targetProfile);
    const scaled = apply(input);
    expect(scaled.waterPlan).toEqual(core.scaledRecipe.waterPlan);
    expect(scaled.waterPlan).toEqual(replanRecipeWater(scaled).plan);
    expect(scaled.waterPlan!.acid!.mash).toBeGreaterThan(0);
    expect(scaled.waterPlan!.acid!.mash).not.toBeCloseTo(input.waterPlan!.acid!.mash * scaled.waterPlan!.mashWaterL / input.waterPlan!.mashWaterL, 2);
    expect(scaled.waterPlan!.measuredPh).toBeUndefined();
    expect(scaled.waterPlan!.measuredSpargePh).toBeUndefined();
    expect(scaled.brewhouse).toEqual(core.scaledRecipe.brewhouse);
    expect(scaled.brewhouse!.calibrationHistory).toBeUndefined();
    expect(scaled.brewhouse!.calibrationEventIds).toEqual(['calibration-1']);
    expect(scaled.id).toBe(input.id);
    expect(scaled.adjuncts![0].amount).toBe(13);
    expect(input).toEqual(before);
  });

  it('conserve les doses manuelles selon le ratio de volume, y compris un zéro explicite', () => {
    const input = recipe();
    input.waterPlan = { ...input.waterPlan!,
      saltOverrides: { mash: { gypse: 1.2, cacl2: 0 }, sparge: { epsom: .6 } },
      acidOverride: { mash: .6, sparge: 0 }
    };
    const before = structuredClone(input);
    const scaled = apply(input);
    expect(scaled.waterPlan!.saltOverrides).toEqual({ mash: { gypse: 1.3, cacl2: 0 }, sparge: { epsom: .65 } });
    expect(scaled.waterPlan!.mash.gypse).toBe(1.3);
    expect(scaled.waterPlan!.sparge.epsom).toBe(.65);
    expect(scaled.waterPlan!.acidOverride).toEqual({ mash: .65, sparge: 0 });
    expect(scaled.waterPlan!.acid).toEqual({ id: 'lactique', mash: .65, sparge: 0 });
    expect(scaled.waterPlan!.measuredPh).toBeUndefined();
    expect(input).toEqual(before);
  });

  it('ne contourne pas le refus du moteur si l’analyse automatique manque', () => {
    const input = recipe();
    delete input.waterPlan!.sourceSnapshot;
    const before = structuredClone(input);
    expect(() => apply(input)).toThrow(/Analyse de l’eau source manquante ou incomplète/);
    expect(input).toEqual(before);
  });
});

it('une consultation du budget sans adaptation conserve une copie du plan enregistré', () => {
  const input = recipe(), before = structuredClone(input);
  const unchanged = scaleBrewBudgetRecipe(input, 24, originalProfile);
  expect(unchanged).toEqual(before);
  expect(unchanged).not.toBe(input);
  expect(unchanged.waterPlan).not.toBe(input.waterPlan);
});
