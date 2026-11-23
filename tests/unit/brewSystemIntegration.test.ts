import { describe, expect, it } from 'vitest';
import type { AppConfig, BrewhouseProfile, Recipe } from '../../src/types';
import { currentInstallation, snapshotBrewhouse, withCurrentInstallation } from '../../src/domain/brewPreferences';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { recipeThermalPlan, withoutMashout } from '../../src/domain/recipeThermalPlan';
import { equipmentCheck, practicalBrewingPreferences, practicalEquipment, spargePlan } from '../../src/domain/brewEquipment';
import { recipeInstallationIssues } from '../../src/domain/recipeInstallation';
import { BrewingMath } from '../../src/services/brewingMath';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import { fullRecipe } from '../fixtures/fullRecipe';

function rig(id = 'active'): BrewhouseProfile {
  return { id, name: 'Installation', volumeL: 24, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1,
    mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment }, equipmentRefs: { kettle: 'E-1', sparger: 'E-2', fermenter: 'E-3', auxiliary: 'E-4' } };
}
function thermalRecipe(): Recipe {
  return { ...fixtureRecipe(), id: 'thermal', brewhouse: { ...rig(), equipment: { ...practicalEquipment, heatingRateCPerMin: 0.2 } },
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }, { name: 'Mash-out', tempC: 75, durationMin: 10 }], spargeType: 'batch' } };
}

describe('liaisons profil actuel, recette figée et transfert', () => {
  it('ajoute les préférences uniquement au profil actif, sans réécrire les autres profils ni les recettes', () => {
    const active = rig(), inactive = rig('other');
    const historical = captureSnapshot({ ...fixtureRecipe(), id: 'old', brewhouse: active });
    const config = { activeBrewhouseId: active.id, brewhouses: [active, inactive] } as AppConfig;
    const upgraded = withCurrentInstallation(config);
    expect(upgraded.brewhouses[0].preferences).toMatchObject({ preferredMashRatioLPerKg: 4.2, preferredSpargeHotL: 18, maximumSpargeHotL: 24 });
    expect(upgraded.brewhouses[1]).toBe(inactive);
    expect(config.brewhouses[0].preferences).toBeUndefined();
    expect(historical.brewhouse!.preferences).toBeUndefined();
  });
  it('préserve des préférences explicites et ne dote pas un profil inconnu de matériel fictif', () => {
    const customized = { ...rig(), preferences: { ...practicalBrewingPreferences, preferredSpargeHotL: 15 } };
    expect(currentInstallation(customized)).toBe(customized);
    const unknown = rig('legacy'); delete unknown.equipment;
    expect(currentInstallation(unknown)).toBe(unknown);
  });
  it('fige les coefficients et références de calibration sans recopier leur historique', () => {
    const profile = rig();
    profile.preferences = { ...practicalBrewingPreferences };
    profile.calibrationHistory = [{ id: 'cal-1', parameter: 'efficiencyPct', previousValue: 75, value: 70,
      appliedAt: 123, batchIds: ['B-1', 'B-2', 'B-3'], readingIds: ['v1', 'g1'], evidenceFingerprint: 'private-proof', contextKey: 'context' }];
    const recipe: Recipe = { ...fixtureRecipe(), id: 'new', brewhouse: profile };
    const frozen = captureSnapshot(recipe);
    expect(frozen.brewhouse!.calibrationHistory).toBeUndefined();
    expect(frozen.brewhouse!.calibrationEventIds).toEqual(['cal-1']);
    expect(frozen.brewhouse!.equipmentRefs).toEqual(profile.equipmentRefs);
    profile.equipment!.boilOffLPerHour = 9; profile.equipmentRefs!.kettle = 'changed';
    expect(frozen.brewhouse!.equipment!.boilOffLPerHour).toBe(3);
    expect(frozen.brewhouse!.equipmentRefs!.kettle).toBe('E-1');
    expect(recipe.brewhouse!.calibrationHistory).toHaveLength(1);
  });
  it('exporte et réimporte les choix, préférences et références avec les valeurs explicites false et zéro', () => {
    const recipe = structuredClone(fullRecipe);
    recipe.brewhouse = snapshotBrewhouse({ ...rig(), preferences: { ...practicalBrewingPreferences, regulatedCoolingAvailable: false }, calibrationEventIds: ['cal-old'] });
    recipe.installation = { fermenterHeadspacePct: 0, headspaceReason: 'Choix à revoir avant brassage', manualWaterSplit: true, spargeExceptionAccepted: false };
    recipe.preBoilHotL = 29.125;
    recipe.mash!.mashoutEnabled = false;
    const imported = readRecipeText(writeRecipeText(recipe))!;
    expect(imported.brewhouse).toEqual(recipe.brewhouse);
    expect(imported.installation).toEqual(recipe.installation);
    expect(imported.preBoilHotL).toBe(29.125);
    expect(imported.mash!.mashoutEnabled).toBe(false);
    expect(writeRecipeText(imported)).toBe(writeRecipeText(recipe));
  });
});

describe('programme de chauffe utilisable', () => {
  it('compte 40 minutes de montée puis 10 minutes de maintien, en conservant la recette', () => {
    const recipe = thermalRecipe(), original = structuredClone(recipe);
    const plan = recipeThermalPlan(recipe);
    expect(plan.rows[1].rampMin).toBe(40);
    expect(plan.rows[1].durationMin).toBe(10);
    expect(plan.beforeFiltrationSavedMin).toBe(50);
    expect(plan.holdMin).toBe(70);
    expect(recipe).toEqual(original);
  });
  it('laisse une durée inconnue lorsque la vitesse de chauffe n’est pas documentée', () => {
    const recipe = thermalRecipe(); delete recipe.brewhouse;
    const plan = recipeThermalPlan(recipe);
    expect(plan.rate).toBeUndefined();
    expect(plan.rows[1].rampMin).toBeUndefined();
    expect(plan.beforeFiltrationSavedMin).toBeUndefined();
    expect(plan.holdMin).toBe(70);
  });
  it('ne retire le mash-out que dans la copie explicitement choisie', () => {
    const recipe = thermalRecipe(), original = structuredClone(recipe);
    const simplified = withoutMashout(recipe);
    expect(simplified.mash!.steps).toEqual([recipe.mash!.steps[0]]);
    expect(simplified.mash!.mashoutEnabled).toBe(false);
    expect(recipe).toEqual(original);
    expect(recipeThermalPlan(simplified).holdMin).toBe(60);
  });
  it('ne propose pas la suppression pour une maische riche en blé ou un procédé NOLO', () => {
    const wheat = thermalRecipe(); wheat.fermentables[0].name = 'Malt de blé';
    expect(recipeThermalPlan(wheat).canConsiderSkipping).toBe(false);
    expect(withoutMashout(wheat)).toBe(wheat);
    const nolo = thermalRecipe(); nolo.nolo = { enabled: true, process: 'coldExtraction' } as Recipe['nolo'];
    expect(recipeThermalPlan(nolo).canConsiderSkipping).toBe(false);
  });
});

describe('contraintes physiques et choix enregistrés', () => {
  it('distingue les litres préparés à froid des budgets de 18 et 24 litres chauds', () => {
    expect(spargePlan(18 / 1.03, practicalEquipment, practicalBrewingPreferences)).toMatchObject({ status: 'ready', auxiliaryHotL: 0 });
    const exception = spargePlan(24 / 1.03, practicalEquipment, practicalBrewingPreferences)!;
    expect(exception.status).toBe('exception');
    expect(exception.mainHotL).toBe(18);
    expect(exception.auxiliaryHotL).toBeCloseTo(6);
    expect(exception.mainColdL + exception.auxiliaryColdL).toBeCloseTo(exception.coldL);
    expect(spargePlan(24.1 / 1.03, practicalEquipment, practicalBrewingPreferences)!.status).toBe('impossible');
    expect(spargePlan(18, practicalEquipment, practicalBrewingPreferences)!.status).toBe('exception');
  });
  it('autorise 26 litres physiquement et présente la réserve de mousse comme conseil', () => {
    const input = { volumeL: 26, grainKg: 5, mashL: 21, spargeL: 10, preferences: practicalBrewingPreferences };
    const provisional = equipmentCheck(practicalEquipment, input)!;
    expect(provisional.fermenterTooFull).toBe(false);
    expect(provisional.fermenterAboveRecommendation).toBe(true);
    const chosen = equipmentCheck(practicalEquipment, { ...input, fermenterHeadspacePct: 10 })!;
    expect(chosen.fermenterAboveRecommendation).toBe(false);
    expect(equipmentCheck(practicalEquipment, { ...input, volumeL: 30 })!.fermenterTooFull).toBe(true);
  });
  it('exige l’exception explicite au lancement et bloque une répartition qui perd de l’eau', () => {
    const profile = { ...rig(), preferences: { ...practicalBrewingPreferences } };
    const recipe: Recipe = { ...fixtureRecipe(), id: 'manual', volumeL: 26, totalGristKg: 3.5,
      brewhouse: profile, hops: [], fermentables: [{ ...fixtureRecipe().fermentables[0], weightKg: 3.5 }] };
    const required = BrewingMath.waterVolumes(3.5, 26, profile, 'batch', 60, 0);
    recipe.waterPlan = { ...recipe.waterPlan!, mashWaterL: 12, spargeWaterL: required.mashWaterL + required.spargeWaterL - 12 };
    recipe.preBoilHotL = required.preBoilHotL;
    expect(recipeInstallationIssues(recipe).some(issue => issue.includes('Confirme le complément'))).toBe(true);
    recipe.installation = { manualWaterSplit: true, spargeExceptionAccepted: true };
    expect(recipeInstallationIssues(recipe)).toEqual([]);
    recipe.waterPlan.mashWaterL -= 1;
    expect(recipeInstallationIssues(recipe).some(issue => issue.includes('total d’eau'))).toBe(true);
  });
});
