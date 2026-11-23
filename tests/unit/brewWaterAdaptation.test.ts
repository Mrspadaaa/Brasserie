import { describe, expect, it } from 'vitest';
import type { BrewhouseProfile, Recipe, WaterSource } from '../../src/types';
import { adaptRecipeEquipment } from '../../src/domain/adaptRecipeEquipment';
import { practicalEquipment, practicalBrewingPreferences } from '../../src/domain/brewEquipment';
import { replanRecipeWater } from '../../src/domain/recipeWater';
import { resizeWaterPlan } from '../../src/domain/resizeWaterPlan';
import { BrewingMath } from '../../src/services/brewingMath';
import { recipe as baseRecipe } from '../fixtures/brewCompanion';

const oldProfile: BrewhouseProfile = {
  id: 'brew-rig', name: 'Installation avant relevés', volumeL: 20,
  efficiencyPct: 75, mashRatioLPerKg: 3, boilOffRatePct: 10, deadSpaceL: 1.5,
  equipment: { ...practicalEquipment, heatingRateCPerMin: .4 }
};
const calibratedProfile: BrewhouseProfile = {
  ...oldProfile, name: 'Installation mesurée', efficiencyPct: 60,
  equipment: { ...practicalEquipment, heatingRateCPerMin: .2 },
  preferences: { ...practicalBrewingPreferences }
};
const source: WaterSource = {
  id: 'test-source', name: 'Analyse de test', ph: 7.5,
  ca: 50, mg: 5, na: 8, so4: 25, cl: 30, hco3: 280
};

function fixture(autoTreatment = false): Recipe {
  const recipe = {
    ...baseRecipe(), id: 'calibration-adaptation', volumeL: 20,
    efficiencyPct: 75, brewhouse: structuredClone(oldProfile),
    fermentables: [
      { name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 4, colorEbc: 6, potentialPpg: 36 },
      { name: 'Saccharose', kind: 'sucre', use: 'ebullition', weightKg: .5, colorEbc: 0, potentialPpg: 46 },
      { name: 'Extrait sec', kind: 'extrait', use: 'ebullition', weightKg: .25, colorEbc: 8, potentialPpg: 44 }
    ],
    hops: [], totalGristKg: 4,
    mash: { ...baseRecipe().mash!, ratioLPerKg: 3, heatingRateCPerMin: .4 },
    waterPlan: {
      ...baseRecipe().waterPlan!, sourceId: source.id, sourceSnapshot: structuredClone(source),
      mashWaterL: 12, spargeWaterL: 16.1, targetProfileId: '18B', diRatioPct: 0,
      allSaltsInMash: true, autoTreatment, measuredPh: 5.43,
      acid: { id: 'lactique', mash: 0, sparge: 0 }
    }
  } as Recipe;
  if (autoTreatment) recipe.waterPlan = replanRecipeWater(recipe).plan;
  return recipe;
}

/** Freeze all nested inputs so an accidental write fails at the line performing it. */
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => frozen(child));
    Object.freeze(value);
  }
  return value;
}

// Independent extract balance: the conversion constants cancel when comparing
// the same potential-PPG ingredients per litre. Dissolved extract has no mash loss.
function extractPerL(recipe: Recipe) {
  return recipe.fermentables.reduce((sum, ingredient) => sum + ingredient.weightKg * ingredient.potentialPpg! *
    (ingredient.kind === 'grain' ? recipe.efficiencyPct! / 100 : 1), 0) / recipe.volumeL;
}

describe('Adopter un rendement et une chauffe réellement mesurés', () => {
  it('conserve 0,125 L de levure lors de l’adoption puis 0,15 L pour 24 L de bière', () => {
    const original = fixture();
    original.yeast = { name: 'Culture personnelle', form: 'liquide', qty: .125, unit: 'L' };
    expect(adaptRecipeEquipment(original, calibratedProfile, 20).yeast).toEqual(original.yeast);
    expect(adaptRecipeEquipment(original, calibratedProfile, 24).yeast?.qty).toBe(.15);
    expect(BrewingMath.scaleRecipe(original, 20, oldProfile, calibratedProfile).scaledRecipe.yeast).toEqual(original.yeast);
    expect(BrewingMath.scaleRecipe(original, 24, oldProfile, calibratedProfile).scaledRecipe.yeast?.qty).toBe(.15);
    expect(original.yeast.qty).toBe(.125);
  });

  it('laisse inconnue une quantité de levure absente lors de l’adaptation', () => {
    const original = fixture();
    original.yeast = { name: 'Levure à documenter' };
    expect(adaptRecipeEquipment(original, calibratedProfile, 24).yeast?.qty).toBeUndefined();
    expect(BrewingMath.scaleRecipe(original, 24, oldProfile, calibratedProfile).scaledRecipe.yeast?.qty).toBeUndefined();
  });

  it('adopte 60 % et 0,2 °C/min tout en conservant la recette à 75 % et 0,4 °C/min', () => {
    const original = fixture(), before = structuredClone(original);
    const profile = frozen(structuredClone(calibratedProfile));
    const adapted = adaptRecipeEquipment(frozen(original), profile, 20);

    expect(adapted.efficiencyPct).toBe(60);
    expect(adapted.brewhouse?.efficiencyPct).toBe(60);
    expect(adapted.mash?.heatingRateCPerMin).toBe(.2);
    expect(adapted.brewhouse?.equipment?.heatingRateCPerMin).toBe(.2);
    expect(adapted.fermentables.map(row => row.weightKg)).toEqual([5, .5, .25]);
    expect(adapted.totalGristKg).toBe(5);
    expect(extractPerL(adapted)).toBeCloseTo(extractPerL(original), 10);
    expect(original).toEqual(before);
    expect(adapted.brewhouse).not.toBe(original.brewhouse);
    expect(adapted.waterPlan).not.toBe(original.waterPlan);
    expect(profile).toEqual(calibratedProfile);
    expect(adapted.waterPlan?.measuredPh).toBeUndefined();
  });

  it('combine volume et rendement uniquement sur les grains, avec la même densité prévue', () => {
    const original = fixture();
    const adapted = adaptRecipeEquipment(original, calibratedProfile, 24);
    expect(adapted.fermentables.map(row => row.weightKg)).toEqual([6, .6, .3]);
    expect(extractPerL(adapted)).toBeCloseTo(extractPerL(original), 10);
    expect(BrewingMath.calculateOg(adapted.fermentables, 24, 60))
      .toBe(BrewingMath.calculateOg(original.fermentables, 20, 75));
  });
});

const operations = [
  { name: 'adaptation matérielle', apply: (r: Recipe, target: number) => adaptRecipeEquipment(r, calibratedProfile, target) },
  { name: 'mise à l’échelle', apply: (r: Recipe, target: number) => BrewingMath.scaleRecipe(r, target, oldProfile, calibratedProfile).scaledRecipe }
];

describe.each(operations)('Chimie finale après $name', ({ apply }) => {
  it('recalcule les doses automatiques avec les nouveaux grains et la nouvelle répartition', () => {
    const original = fixture(true), before = structuredClone(original);
    const result = apply(frozen(original), 20);
    const independentlyReplanned = replanRecipeWater({
      ...result,
      // Deliberately supply stale amounts. Automatic calculation must derive its
      // answer from final ingredients, source and split rather than these doses.
      waterPlan: { ...result.waterPlan!, acid: { id: 'lactique', mash: 99, sparge: 99 } }
    }).plan;
    expect(result.fermentables[0].weightKg).toBe(5);
    expect(result.waterPlan!.mashWaterL).toBe(21);
    expect(result.waterPlan!.spargeWaterL).not.toBe(original.waterPlan!.spargeWaterL);
    expect(result.waterPlan!.acid!.mash).toBeGreaterThan(0);
    expect(result.waterPlan).toEqual(independentlyReplanned);
    const merelyProportional = resizeWaterPlan(original, result.waterPlan!, 1)!;
    expect(result.waterPlan!.acid).not.toEqual(merelyProportional.acid);
    expect(original).toEqual(before);
  });

  it.each([20, 24])('conserve les doses fixées explicitement, à %s L', target => {
    const original = fixture(true);
    original.waterPlan = {
      ...original.waterPlan!, saltOverrides: { mash: { gypse: 1.25, cacl2: 0 }, sparge: { epsom: .5 } },
      acidOverride: { mash: .5, sparge: 0 }
    };
    const before = structuredClone(original);
    const result = apply(frozen(original), target);
    const volumeRatio = target / 20;
    expect(result.waterPlan!.saltOverrides).toEqual({
      mash: { gypse: 1.25 * volumeRatio, cacl2: 0 }, sparge: { epsom: .5 * volumeRatio }
    });
    expect(result.waterPlan!.mash.gypse).toBe(1.25 * volumeRatio);
    expect(result.waterPlan!.mash.cacl2 ?? 0).toBe(0);
    expect(result.waterPlan!.sparge.epsom).toBe(.5 * volumeRatio);
    expect(result.waterPlan!.acidOverride).toEqual({ mash: .5 * volumeRatio, sparge: 0 });
    expect(result.waterPlan!.acid!.mash).toBe(.5 * volumeRatio);
    expect(result.waterPlan!.acid!.sparge).toBe(0);
    expect(original).toEqual(before);
  });

  it('refuse un traitement automatique sans analyse au lieu de conserver un dosage périmé', () => {
    const original = fixture(true);
    delete original.waterPlan!.sourceSnapshot;
    const before = structuredClone(original);
    expect(() => apply(frozen(original), 20)).toThrow(/Analyse de l’eau source manquante ou incomplète/);
    expect(original).toEqual(before);
  });
});

describe('Dosage conservé lors d’un simple déplacement de l’eau', () => {
  it.each([undefined, true])('allSaltsInMash=%s dose le gypse sur les 35 L totaux', allSaltsInMash => {
    const original = fixture();
    original.waterPlan = { ...original.waterPlan!, mashWaterL: 20, spargeWaterL: 15,
      mash: { gypse: 10 }, sparge: {}, allSaltsInMash };
    const before = structuredClone(original);
    const initial = resizeWaterPlan(original, { mashWaterL: 20, spargeWaterL: 15 })!;
    const moved = resizeWaterPlan(frozen(original), { mashWaterL: 30, spargeWaterL: 5 })!;
    expect(moved.mash.gypse).toBe(10);
    // Ion concentrations are rounded to 0.1 ppm within each water stage.
    expect(Math.abs(moved.wortIons!.so4 - initial.wortIons!.so4)).toBeLessThanOrEqual(.1 + 1e-8);
    expect(moved.mashWaterL + moved.spargeWaterL).toBe(35);
    expect(original).toEqual(before);
  });

  it('un choix explicite par eau garde la concentration dans l’empâtage', () => {
    const original = fixture();
    original.waterPlan = { ...original.waterPlan!, mashWaterL: 20, spargeWaterL: 15,
      mash: { gypse: 10 }, sparge: {}, allSaltsInMash: false };
    const moved = resizeWaterPlan(original, { mashWaterL: 30, spargeWaterL: 5 })!;
    expect(moved.mash.gypse).toBe(15);
    expect(moved.mash.gypse! / moved.mashWaterL).toBe(10 / 20);
  });
});
