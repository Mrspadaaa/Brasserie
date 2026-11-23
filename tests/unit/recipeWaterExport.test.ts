import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../src/types';
import { describeSavedRecipeWater } from '../../src/domain/recipeWaterReadings';
import { recipeWaterExport } from '../../src/domain/recipeWaterExport';
import { readRecipeFields, readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';

/** User's Ttt export, 8 September 2026. Keep the retained doses independent of today's solver. */
const ttt: Recipe = {
  id: 'ttt-regression', name: 'Ttt', style: 'Imperial stout', volumeL: 24,
  boilMin: 95, efficiencyPct: 75, totalGristKg: 2.2,
  ogTarget: 1.021, fgTarget: 1.004, abvTarget: 2.2, ibuTarget: 12,
  fermentables: [{ name: 'Pilsner Malz', weightKg: 2.2, kind: 'grain', use: 'empatage',
    colorEbc: 3.5, potentialPpg: 37, fermentabilityPct: 100 }],
  hops: [
    { name: 'Cascade', weightG: 14, alpha: 6.5, stage: 'boil', timeMin: 95 },
    { name: 'Houblon Idaho 7 12.7%', weightG: 20, alpha: 0, stage: 'dryHop', dayOffset: 3 }
  ],
  yeast: { name: 'Levure Safale US-05', form: 'sèche', qty: 1, unit: 'sachet' },
  waterPlan: {
    sourceId: 'reseau', sourceSnapshot: { id: 'reseau', name: 'Réseau — Villars-sur-Glâne',
      ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250, ph: 7.4 },
    treatmentVersion: 2, diRatioPct: 20, targetProfileId: '20C',
    mashWaterL: 10.8, spargeWaterL: 21.5, allSaltsInMash: true,
    mash: { gypse: 3.1, cacl2: 1.5, nacl: 0.5, kcl: 3 }, sparge: {},
    acid: { id: 'lactique', mash: 1.2, sparge: 6.2 }, targetPh: 5.4
  },
  steps: [], notes: []
};

describe('Saved water diagnostics and Ttt export regression', () => {
  it('reconstructs the independently checked concentrations and distinguishes pH from the consigne', () => {
    const before = structuredClone(ttt);
    const readings = describeSavedRecipeWater(ttt)!;
    // Weighted HCO3 mass: 200 * 32.3 - (1.2 + 6.2) * 600 = 2020 mg.
    expect(readings.treatment.treatedTotal).toEqual({
      ca: 103, mg: 11.2, na: 12.5, so4: 75.9, cl: 93.6, hco3: 62.5
    });
    expect(readings.treatment.treated.mash.hco3).toBeCloseTo(133.3333333333, 8);
    expect(readings.treatment.treated.sparge.hco3).toBeCloseTo(26.976744186, 8);
    expect(readings.treatment.raAfter).toBe(-20.6);
    expect(readings.raBand).toMatchObject({ min: -43, max: 0 });
    expect(readings.phEstimate).toMatchObject({ known: true, phPredicted: 5.7, uncertainty: 0.15 });
    expect(readings.targetPh).toBe(5.4);
    expect(readings.requestedRatio).toBe(0.7);
    expect(readings.treatment.ratio.ratio).toBe(0.81);
    expect(ttt).toEqual(before);
  });

  it('exports actual pH, ratio provenance and mineral ranges without importing them as recipe inputs', () => {
    const text = writeRecipeText(ttt);
    expect(text).toContain('Consigne de pH à l’empâtage (à mesurer) : 5.4');
    expect(text).toContain('pH empâtage estimé après acide : 5.7');
    expect(text).toContain('Incertitude du pH estimé (±) : 0.15');
    expect(text).toContain('ne garantit pas la consigne');
    expect(text).toContain('Rapport SO₄/Cl visé actuellement : 0.7');
    expect(text).toContain('Rapport SO₄/Cl obtenu : 0.81');
    expect(text).toContain('les doses retenues peuvent provenir d’un réglage antérieur');
    expect(text).toContain('Plages du profil (ppm, eau de traitement totale)');
    expect(text).toContain('six ions');
    const { id: _, ...expected } = ttt;
    expect(readRecipeText(text)).toEqual(expected);
    expect(readRecipeFields({ ...ttt, estimates: recipeWaterExport(ttt) })).toEqual(expected);
    expect(writeRecipeText(readRecipeText(text)!)).toBe(text);
  });

  it('accepts the old v1 pH label but rejects duplicating it alongside the clarified label', () => {
    const text = writeRecipeText(ttt);
    const old = text.replace('Consigne de pH à l’empâtage (à mesurer)', 'pH cible');
    expect(readRecipeText(old)?.waterPlan?.targetPh).toBe(5.4);
    expect(() => readRecipeText(text.replace(
      'Consigne de pH à l’empâtage (à mesurer) : 5.4',
      'Consigne de pH à l’empâtage (à mesurer) : 5.4\n  pH cible : 5.3'
    ))).toThrow(/répété/);
  });

  it('preserves all retained acids, including zero, regardless of automatic or stale override settings', () => {
    const recipe = structuredClone(ttt);
    recipe.waterPlan!.autoTreatment = true;
    recipe.waterPlan!.acid!.sparge = 0;
    recipe.waterPlan!.acidOverride = { mash: 4, sparge: 8 };
    recipe.waterPlan!.targetPh = 5.2;
    const readings = describeSavedRecipeWater(recipe)!;
    expect(readings.treatment.mashAcid.amount).toBe(1.2);
    expect(readings.treatment.spargeAcid.amount).toBe(0);
    expect(readings.treatment.treatedTotal.hco3).toBe(177.7);
    expect(readings.phEstimate.phPredicted).toBe(5.7);
    expect(readRecipeText(writeRecipeText(recipe))!.waterPlan).toEqual(recipe.waterPlan);
  });

  it('identifies a saved ratio override and omits unsupplied targets in a partial personal profile', () => {
    const recipe = structuredClone(ttt);
    recipe.waterPlan!.ratioOverride = 0.8;
    expect(recipeWaterExport(recipe)).toMatchObject({
      requestedRatio: 0.8, achievedRatio: 0.81, requestedRatioNote: 'Choix manuel enregistré.'
    });
    recipe.waterPlan!.targetIons = { so4: 75, cl: 100 };
    delete recipe.waterPlan!.ratioOverride;
    const diagnostic = recipeWaterExport(recipe);
    expect(Object.keys(diagnostic.mineralRanges!)).toEqual(['so4', 'cl']);
    expect(diagnostic.requestedRatio).toBe(0.75);
  });

  it('does not invent a pH when the frozen source or malt analysis is unavailable', () => {
    const recipe = structuredClone(ttt);
    delete recipe.waterPlan!.sourceSnapshot;
    expect(describeSavedRecipeWater(recipe)).toBeNull();
    expect(recipeWaterExport(recipe)).toEqual({
      waterDiagnosticNote: 'Analyse source ou volumes manquants : traitement et pH non vérifiables.'
    });
    recipe.waterPlan!.sourceSnapshot = ttt.waterPlan!.sourceSnapshot;
    delete recipe.fermentables[0].colorEbc;
    expect(recipeWaterExport(recipe).mashPhEstimated).toBeUndefined();
  });

  it('keeps legacy missing grain, hop and salt collections readable without inventing a pH', () => {
    const recipe = structuredClone(ttt);
    delete (recipe as Partial<Recipe>).fermentables;
    delete (recipe as Partial<Recipe>).hops;
    delete (recipe.waterPlan as Partial<NonNullable<Recipe['waterPlan']>>).mash;
    delete (recipe.waterPlan as Partial<NonNullable<Recipe['waterPlan']>>).sparge;
    const readings = describeSavedRecipeWater(recipe)!;
    expect(readings.phEstimate.known).toBe(false);
    expect(readings.treatment.treatedTotal.ca).toBe(68);
    expect(recipeWaterExport(recipe).mashPhEstimated).toBeUndefined();
  });
});
