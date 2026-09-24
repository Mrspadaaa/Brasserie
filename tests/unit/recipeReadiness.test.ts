import { describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { recipeFieldIssues, recipeReadiness, recipeSaveIssues } from '../../src/domain/recipeValidation';

const recipe = () => structuredClone(fullRecipe);

describe('État d’une recette avant sauvegarde et brassin', () => {
  it('garde enregistrable une recette dont la dose et le conditionnement de levure manquent', () => {
    const value = recipe();
    delete value.yeast.qty;
    delete value.yeast.unit;
    expect(recipeSaveIssues(value)).toEqual([]);
    expect(recipeReadiness(value).status).toBe('incomplete');
    expect(recipeFieldIssues(value).map(issue => issue.field)).toEqual(expect.arrayContaining(['wz-yeast-qty', 'wz-yeast-unit']));
  });

  it('signale les lignes à zéro sans les transformer en doses fictives', () => {
    const value = recipe();
    value.fermentables[0].weightKg = 0;
    value.hops[0].weightG = 0;
    value.yeast.qty = 0;
    expect(recipeSaveIssues(value)).toEqual([]);
    expect(recipeReadiness(value).status).toBe('incomplete');
    expect(recipeFieldIssues(value).map(issue => issue.field)).toEqual(expect.arrayContaining(['wz-fermentable-0', 'wz-hop-0', 'wz-yeast-qty']));
    expect(value.fermentables[0].weightKg).toBe(0);
  });

  it('enregistre un ajout whirlpool sans durée ni température mais le garde incomplet pour le brassin', () => {
    const value = recipe();
    value.hops[0].stage = 'whirlpool';
    delete value.hops[0].timeMin;
    delete value.hops[0].tempC;
    expect(recipeSaveIssues(value)).toEqual([]);
    expect(recipeReadiness(value).status).toBe('incomplete');
    expect(recipeFieldIssues(value).map(issue => issue.field)).toEqual(expect.arrayContaining(['wz-hop-time-0', 'wz-hop-temp-0']));
    value.hops[0].timeMin = Number.NaN;
    expect(recipeReadiness(value).status).toBe('invalid');
  });

  it('refuse les nombres effacés ou invalides et une plage manuelle inversée', () => {
    const value = recipe();
    value.hops[0].weightG = Number.NaN;
    value.yeast.fermTempMinC = 24;
    value.yeast.fermTempMaxC = 18;
    expect(recipeReadiness(value).status).toBe('invalid');
    expect(recipeSaveIssues(value).map(issue => issue.field)).toEqual(expect.arrayContaining(['wz-hop-0', 'wz-yeast-range']));
    expect(recipeSaveIssues(value).some(issue => issue.field === 'wz-validation')).toBe(false);
  });

  it('intercepte aussi un nombre invalide dans un détail ou un snapshot sans l’effacer', () => {
    const value = recipe();
    value.waterPlan!.mash.gypse = Number.NaN;
    expect(recipeSaveIssues(value)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'wz-validation', message: expect.stringContaining('waterPlan.mash.gypse') })
    ]));
    expect(Number.isNaN(value.waterPlan!.mash.gypse)).toBe(true);
  });

  it('refuse les valeurs de houblon hors bornes sans exiger les repères facultatifs', () => {
    const value = recipe();
    value.hops[0] = { ...value.hops[0], stage: 'dryHop', alpha: 101, dayOffset: -1, aromaContactHours: -2 };
    expect(recipeSaveIssues(value).map(issue => issue.field)).toEqual(expect.arrayContaining([
      'wz-hop-alpha-0', 'wz-hop-day-0', 'wz-hop-contact-0'
    ]));
    value.hops[0] = { ...value.hops[0], alpha: 0, dayOffset: undefined, aromaContactHours: undefined };
    expect(recipeSaveIssues(value)).toEqual([]);
  });

  it('annonce prête une recette renseignée sans confondre son stock avec ses données', () => {
    expect(recipeReadiness(recipe())).toMatchObject({ status: 'ready', invalid: [], missing: [] });
  });

  it('refuse un ajout plus long que l’ébullition sans appliquer cette limite au whirlpool', () => {
    const value = recipe();
    value.boilMin = 30;
    value.hops[0] = { ...value.hops[0], stage: 'boil', timeMin: 60 };
    expect(recipeReadiness(value).status).toBe('invalid');
    expect(recipeSaveIssues(value)).toContainEqual(expect.objectContaining({ field: 'wz-hop-time-0', message: expect.stringContaining('30 min d’ébullition') }));
    value.hops[0].timeMin = 30;
    expect(recipeSaveIssues(value)).toEqual([]);
    value.hops[0] = { ...value.hops[0], stage: 'whirlpool', timeMin: 60, tempC: 80 };
    expect(recipeSaveIssues(value)).toEqual([]);
  });
});
