import { describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipeImport, parseLocalRecipe } from '../../src/domain/recipeImport';
import { styleFromTargetIons } from '../../src/domain/waterStyles';

describe('Complete recipe text round trip', () => {
  it('preserves every business field, precision, zero, empty lists and multiline notes', () => {
    const { id, batchRef, favorite, ...expected } = fullRecipe;
    const text = writeRecipeText(fullRecipe);
    expect(text).toContain('Gypse (g) : 1.237');
    expect(text).not.toContain('private-id');
    expect(readRecipeText(text)).toEqual(expected);
    expect(readRecipeText(text.replaceAll('\n', '\r\n'))).toEqual(expected);
    expect(writeRecipeText(readRecipeText(text)!)).toBe(text);
  });
  it('does not reinterpret calculated water as a target', () => {
    const parsed = readRecipeText(
      writeRecipeText(fullRecipe, { mashIons: { ca: 999, mg: 0, na: 0, so4: 0, cl: 0, hco3: 999 } })
    );
    expect(parsed.waterPlan.targetIons).toEqual(fullRecipe.waterPlan.targetIons);
    expect(parsed).not.toHaveProperty('estimates');
  });
  it('preserves linked dilution, automatic acids, partial targets and absent optional fields', () => {
    const recipe = structuredClone(fullRecipe);
    delete recipe.waterPlan.spargeDiRatioPct;
    delete recipe.waterPlan.acidOverride;
    delete recipe.yeast.fermTempMaxC;
    recipe.waterPlan.targetIons = { so4: 75, cl: 150, hco3: 0 };
    recipe.hops = [];
    recipe.fermentation = [];
    recipe.notes = [];
    const parsed = readRecipeText(writeRecipeText(recipe));
    expect(parsed.waterPlan.spargeDiRatioPct).toBeUndefined();
    expect(parsed.waterPlan.acidOverride).toBeUndefined();
    expect(parsed.waterPlan.targetIons.ca).toBeUndefined();
    expect(parsed.hops).toEqual([]);
    expect(parsed.yeast.fermTempMaxC).toBeUndefined();
    const style = styleFromTargetIons(parsed.waterPlan.targetIons);
    expect(style.ions.ca.max).toBeGreaterThan(50);
    expect(style.ions.hco3.max).toBe(10);
  });
  it('returns null for arbitrary text but rejects damaged or newer own exports', () => {
    expect(readRecipeText('NEIPA\n4 kg malt')).toBeNull();
    const text = writeRecipeText(fullRecipe);
    for (const broken of [
      text.replace('v1', 'v2'),
      text.slice(0, -20),
      text.replace('Alpha (%) : 12.25', 'Alpha (%) : -5'),
      text.replace('Masse (kg) : 4.12345', 'Masse (kg) : 1e309'),
      text.replace('Famille : "grain"', 'Famille : "poison"'),
      text.replace('  Souche : "IPA"', '  constructor : {}')
    ])
      expect(() => readRecipeText(broken)).toThrow();
  });
  it('does not drop zero values or adjuncts from AI output and ignores bad numeric data', () => {
    const read = normalizeRecipeImport(
      {
        ...fullRecipe,
        mashSteps: fullRecipe.mash.steps,
        spargeWaterL: 0,
        carboVolumes: 0,
        volumeL: Infinity
      },
      'ia'
    );
    expect(read.volumeL).toBeUndefined();
    expect(read.spargeWaterL).toBe(0);
    expect(read.carboVolumes).toBe(0);
    expect(read.hops[1]).toMatchObject({ dayOffset: 0, tempC: 0, alpha: 0 });
    expect(read.fermentables[1].colorEbc).toBe(0);
    expect(read.adjuncts).toEqual(fullRecipe.adjuncts);
    expect(read.notesCreation).toEqual(fullRecipe.notesCreation);
    expect(read.waterPlan.acidOverride).toEqual({ mash: 0.325, sparge: 0 });
  });
  it('retains unparsed prose during local fallback', () => {
    const raw =
      'Milk Stout\n20 L\n4 kg Pale malt\n250 g lactose\nInstructions : ajouter le lactose en fin de cuisson.';
    const read = parseLocalRecipe(raw);
    expect(read.notesCreation).toBe(raw);
    expect(read.adjuncts.some((a) => /lactose/i.test(a.name))).toBe(false);
  });
  it('sweeps dilution, acid mode, salt allocation and empty collections', () => {
    for (const di of [0, 25.5, 100])
      for (const acid of ['lactique', 'phosphorique', 'maltAcidule'] as const)
        for (const manual of [true, false])
          for (const linked of [true, false]) {
            const recipe = structuredClone(fullRecipe);
            recipe.waterPlan.diRatioPct = di;
            recipe.waterPlan.acid.id = acid;
            if (!manual) delete recipe.waterPlan.acidOverride;
            if (linked) delete recipe.waterPlan.spargeDiRatioPct;
            recipe.adjuncts = [];
            recipe.fermentation = [];
            recipe.notes = [];
            const { id, batchRef, favorite, ...expected } = recipe;
            expect(readRecipeText(writeRecipeText(recipe))).toEqual(expected);
          }
  });
});
