import { describe, expect, it } from 'vitest';
import { BrewingMath } from '../../src/services/brewingMath';
import { adaptRecipeEquipment } from '../../src/domain/adaptRecipeEquipment';
import { equipmentCheck, practicalEquipment, practicalBrewingPreferences, spargePlan, defaultBrewVolume } from '../../src/domain/brewEquipment';
import { fermenterRecommendation } from '../../src/domain/fermenterPlanning';
import { resizeWaterPlan } from '../../src/domain/resizeWaterPlan';
import { recipe } from '../fixtures/brewCompanion';
import type { BrewhouseProfile, Recipe } from '../../src/types';

const profile: BrewhouseProfile = {
  id: 'personal', name: 'Mon installation', volumeL: 26, efficiencyPct: 75,
  boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const r = (over: Partial<Recipe> = {}) => ({ ...recipe(), id: 'water-test', ...over }) as Recipe;

describe('Plan d’eau de l’installation', () => {
  it('commence à 4,2 L/kg sans chercher à remplir toute la cuve', () => {
    const water = BrewingMath.waterVolumes(5, 24, profile);
    expect(water.mashWaterL).toBe(21);
    expect(water.spargeHotL).toBeLessThan(18);
    expect(water.mashIncreasedForSparge).toBe(false);
    expect(water.planningStatus).toBe('ready');
  });
  it('augmente l’empâtage pour rester sous 18 L chauds, sans changer le volume final', () => {
    const water = BrewingMath.waterVolumes(3, 24, profile, 'batch', 115, 14);
    expect(water.mashWaterL).toBe(16.6);
    expect(water.spargeWaterL).toBe(17.4);
    expect(water.spargeHotL).toBeCloseTo(17.922, 6);
    expect(water.spargeMainHotL).toBe(water.spargeHotL);
    expect(water.spargeAuxiliaryHotL).toBe(0);
    expect(water.mashIncreasedForSparge).toBe(true);
    expect(water.mashWaterL + water.spargeWaterL - 3 * .96 - 3 * (115 / 60) * .96 - 1.5 - water.hopLossL).toBeCloseTo(24, 1);
    expect(water.preBoilHotL).toBeCloseTo((24 + 1.5 + water.hopLossL) / .96 + 3 * 115 / 60, 1);
  });
  it('calcule 18 et 24 comme des budgets chauds, avec un seul principal et un appoint', () => {
    const normal = spargePlan(18 / 1.03, practicalEquipment, practicalBrewingPreferences)!;
    expect(normal.status).toBe('ready');
    expect(normal.mainHotL).toBeCloseTo(18, 10);
    expect(normal.coldL).toBeLessThan(18);
    const exceptional = spargePlan(24 / 1.03, practicalEquipment, practicalBrewingPreferences)!;
    expect(exceptional.status).toBe('exception');
    expect(exceptional.mainHotL).toBe(18);
    expect(exceptional.auxiliaryHotL).toBeCloseTo(6, 10);
    expect(spargePlan(24.1 / 1.03, practicalEquipment, practicalBrewingPreferences)!.status).toBe('impossible');
  });
  it('conserve une répartition manuelle et expose le besoin exceptionnel', () => {
    const water = BrewingMath.waterVolumes(3, 24, profile, 'batch', 115, 14, {
      manualWaterSplit: { mashWaterL: 12.6, spargeWaterL: 21.4 }
    });
    expect(water.mashWaterL).toBe(12.6);
    expect(water.spargeWaterL).toBe(21.4);
    expect(water.planningStatus).toBe('exception');
    expect(water.waterBalanceErrorL).toBe(0);
    expect(water.spargeAuxiliaryHotL).toBeCloseTo(4.042, 6);
    const impossible = BrewingMath.waterVolumes(3, 24, profile, 'batch', 115, 14, {
      manualWaterSplit: { mashWaterL: 10.5, spargeWaterL: 23.5 }
    });
    expect(impossible.planningStatus).toBe('impossible');
    expect(impossible.mashWaterL + impossible.spargeWaterL).toBe(34);
    expect(impossible.issues.join(' ')).toMatch(/maximum de 24 L/);
  });
  it('ne corrige pas silencieusement une saisie manuelle dont le bilan est incohérent', () => {
    const water = BrewingMath.waterVolumes(3, 24, profile, 'batch', 115, 14, {
      manualWaterSplit: { mashWaterL: 12.6, spargeWaterL: 10 }
    });
    expect(water.spargeWaterL).toBe(10);
    expect(water.planningStatus).toBe('impossible');
    expect(water.waterBalanceErrorL).toBe(-11.4);
  });
  it('respecte l’occupation des grains et ne jette pas d’eau quand la cuve ne suffit plus', () => {
    const water = BrewingMath.waterVolumes(18, 24, profile, 'batch', 115);
    const check = equipmentCheck(profile.equipment, { volumeL: 24, grainKg: 18, mashL: water.mashWaterL, spargeL: water.spargeWaterL, preBoilHotL: water.preBoilHotL, preferences: profile.preferences })!;
    expect(check.mashTooFull).toBe(false);
    expect(check.spargeTooMuch).toBe(true);
    expect(water.planningStatus).toBe('impossible');
    expect(water.mashWaterL + water.spargeWaterL - water.grainAbsorptionL).toBeCloseTo(water.preBoilVolumeL, 1);
    const noSparge = BrewingMath.waterVolumes(9, 24, profile, 'none');
    expect(noSparge.spargeWaterL).toBe(0);
    expect(noSparge.planningStatus).toBe('impossible');
  });
  it('préserve le calcul des anciens profils et refuse un nouveau profil incohérent', () => {
    const legacy = { ...profile, preferences: undefined, mashRatioLPerKg: 3.5 };
    expect(BrewingMath.waterVolumes(3, 24, legacy, 'batch', 115, 14).mashWaterL).toBe(10.5);
    expect(BrewingMath.waterVolumes(3, 24, { ...profile, preferences: { ...practicalBrewingPreferences, maximumSpargeHotL: 12 } }).planningStatus).toBe('invalid');
    expect(BrewingMath.waterVolumes(3, 24, { ...profile, equipment: { ...practicalEquipment, kettleWorkingL: 50 } }).planningStatus).toBe('invalid');
    expect(equipmentCheck(practicalEquipment, { volumeL: 24, grainKg: 3, mashL: NaN, spargeL: 18 })).toBeNull();
  });
  it('unifie adaptation et mise à l’échelle avec le plan enregistré', () => {
    const original = r({ volumeL: 24, fermentables: [{ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 3, potentialPpg: 36 }], hops: [], boilMin: 115 });
    const adapted = adaptRecipeEquipment(original, profile, 24);
    const scaled = BrewingMath.scaleRecipe(original, 24, profile, profile);
    expect(adapted.waterPlan?.mashWaterL).toBe(scaled.mashWaterL);
    expect(adapted.waterPlan?.spargeWaterL).toBe(scaled.spargeWaterL);
    expect(scaled.scaledRecipe.waterPlan?.mashWaterL).toBe(scaled.mashWaterL);
    expect(scaled.scaledRecipe.brewhouse).toEqual(profile);
    expect(scaled.scaledRecipe.preBoilHotL).toBe(scaled.waterPlan.preBoilHotL);
    expect(scaled.scaledRecipe.installation?.spargeExceptionAccepted).toBe(false);
  });
  it('conserve les sels groupés et les doses explicitement choisies lors d’une redistribution', () => {
    const original = r();
    original.waterPlan = {
      ...original.waterPlan!, allSaltsInMash: true, mashWaterL: 20, spargeWaterL: 10,
      mash: { cacl2: 3, gypse: 1.2 }, sparge: {},
      saltOverrides: { mash: { gypse: 1.2 } },
      acid: { id: 'lactique', mash: 2, sparge: 1 }, acidOverride: { mash: 2 }
    };
    const moved = resizeWaterPlan(original, { mashWaterL: 25, spargeWaterL: 5 })!;
    expect(moved.mash.cacl2).toBe(3);
    expect(moved.mash.gypse).toBe(1.2);
    expect(moved.acid?.mash).toBe(2);
    expect(moved.acid?.sparge).toBe(.5);
    const resized = resizeWaterPlan(original, { mashWaterL: 50, spargeWaterL: 10 }, 2)!;
    expect(resized.mash.gypse).toBe(2.4);
    expect(resized.acidOverride?.mash).toBe(4);
  });
});

describe('Remplissage propre à la recette', () => {
  it('ne plafonne plus un volume choisi à 24 L', () => {
    expect(defaultBrewVolume(profile)).toBe(26);
    const check = equipmentCheck(practicalEquipment, { volumeL: 26, grainKg: 5, mashL: 21, spargeL: 12 })!;
    expect(check.fermenterTooFull).toBe(false);
    expect(check.fermenterAboveRecommendation).toBe(true);
    expect(adaptRecipeEquipment(r(), profile, 26).volumeL).toBe(26);
  });
  it('utilise les 33 % documentés uniquement pour la souche et sa forme exacte', () => {
    const weizen = r({ yeast: { name: '3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide' } });
    const recommendation = fermenterRecommendation(weizen, practicalEquipment)!;
    expect(recommendation).toMatchObject({ headspacePct: 33, recommendedFillL: 20.1, basis: 'manufacturer' });
    expect(recommendation.source?.reference).toContain('wyeastlab.com');
    expect(fermenterRecommendation({ ...weizen, yeast: { ...weizen.yeast!, form: 'sèche' } }, practicalEquipment)?.basis).toBe('provisional');
    expect(fermenterRecommendation({ ...weizen, yeast: { ...weizen.yeast!, form: undefined } }, practicalEquipment)?.basis).toBe('provisional');
    expect(fermenterRecommendation({ ...weizen, yeast: { ...weizen.yeast!, hopIndexId: 'unknown-3068' } }, practicalEquipment)?.basis).toBe('provisional');
  });
  it('respecte le choix manuel sans effacer la recommandation documentaire', () => {
    const recommendation = fermenterRecommendation(r({ yeast: { name: '3068', hopIndexId: 'wyeast-3068', form: 'liquide' }, installation: { fermenterHeadspacePct: 10, headspaceReason: 'Mon essai précédent' } }), practicalEquipment)!;
    expect(recommendation).toMatchObject({ headspacePct: 10, recommendedFillL: 27, basis: 'manual', reason: 'Mon essai précédent', documentedHeadspacePct: 33, belowDocumentedRecommendation: true });
    const check = equipmentCheck(practicalEquipment, { volumeL: 30, grainKg: 5, mashL: 21, spargeL: 12, fermenterHeadspacePct: 0 })!;
    expect(check.fermenterTooFull).toBe(true);
  });
});
