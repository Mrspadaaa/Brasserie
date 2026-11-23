import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../src/types';
import { recipeToText, type RecipeTextInput } from '../../src/domain/recipeText';
import { fullRecipe } from '../fixtures/fullRecipe';

/**
 * Monkey, graine 11 de « l'assistant de recette » (26.10, rejeu de b1d73ea1) : un champ vidé dans l'assistant (la durée d'une
 * phase de fermentation, `emptyValue = NaN`) donnait « NaN j » dans le texte copié depuis x2 (7f811c2c) : les gardes `!= null`
 * laissaient passer NaN. Un champ vide est une valeur inconnue : le texte le dit, il n'écrit jamais « NaN » ni 0.
 */
const DATE = new Date('2026-10-26T10:00:00Z');

function texte(modifier: (r: Recipe) => void): string {
  const rec = structuredClone(fullRecipe) as Recipe;
  modifier(rec);
  const entree = {
    recipe: rec, name: rec.name, style: rec.style ?? '', volumeL: rec.volumeL, boilMin: rec.boilMin,
    fermentables: rec.fermentables, totalGristKg: rec.totalGristKg, hops: rec.hops, yeast: rec.yeast,
    mashSteps: rec.mash?.steps ?? [], fermentation: rec.fermentation ?? [], adjuncts: rec.adjuncts
  } as unknown as RecipeTextInput;
  return recipeToText(entree, DATE);
}

/** Le texte lisible seul : le bloc de réimport relit des nombres et n'est pas affiché dans le champ vide. */
const lisible = (t: string) => t.split('— Données de réimport')[0];

describe('texte de recette : un champ vidé n’écrit jamais « NaN »', () => {
  it('durée d’une phase de fermentation vide : « durée inconnue »', () => {
    const t = lisible(texte(r => { r.fermentation = [{ name: 'Froid court', kind: 'garde', tempC: 4, days: Number.NaN }] as Recipe['fermentation']; }));
    expect(t).not.toMatch(/NaN|undefined|Infinity/);
    expect(t).toMatch(/Froid court/);
    expect(t).toMatch(/durée inconnue — Froid court/);
  });

  it('température d’une phase de fermentation vide : « T° inconnue »', () => {
    const t = lisible(texte(r => { r.fermentation = [{ name: 'Primaire', kind: 'primaire', tempC: Number.NaN, days: 7 }] as Recipe['fermentation']; }));
    expect(t).not.toMatch(/NaN|undefined|Infinity/);
    expect(t).toMatch(/T° inconnue\s+7 j — Primaire/);
  });

  it('palier d’empâtage sans température ni durée', () => {
    const t = lisible(texte(r => { r.mash = { ...r.mash, steps: [{ name: 'Sacch.', tempC: Number.NaN, durationMin: Number.NaN }] } as Recipe['mash']; }));
    expect(t).not.toMatch(/NaN|undefined|Infinity/);
    expect(t).toMatch(/T° inconnue\s+durée inconnue — Sacch\./);
  });

  it('houblon sans minutes, sans température, sans jour de dry hop', () => {
    const t = lisible(texte(r => {
      r.hops = [
        { name: 'Citra', stage: 'whirlpool', weightG: 40, alpha: 12, timeMin: Number.NaN, tempC: Number.NaN },
        { name: 'Mosaic', stage: 'boil', weightG: 20, alpha: 11, timeMin: 20, tempC: Number.NaN },
        { name: 'Galaxy', stage: 'dryHop', weightG: 60, alpha: 0, dayOffset: Number.NaN, timeMin: Number.NaN }
      ] as Recipe['hops'];
    }));
    expect(t).not.toMatch(/NaN|undefined|Infinity/);
    expect(t).toMatch(/Mosaic\s+\(20 min/);
  });

  it('ébullition vide, fermentescible sans couleur ni jour', () => {
    const t = lisible(texte(r => {
      r.boilMin = Number.NaN;
      r.fermentables = [{ name: 'Sucre', weightKg: 0.2, kind: 'sugar', use: 'ebullition', colorEbc: Number.NaN, potentialPpg: Number.NaN, dayOffset: Number.NaN, fermentabilityPct: Number.NaN }] as Recipe['fermentables'];
    }));
    expect(t).not.toMatch(/NaN|undefined|Infinity/);
  });
});
