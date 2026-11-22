// Regard brasseur du 08.11 : MV-44 à MV-47, prouvés à l'image. Une table de bornes métier (src/domain/bornesMetier.ts), lue par la validation
// et les calculs. Chaque test échoue sur 65d3c645 et passe après (L13). N'importe que des API qui existaient à 65d3c645.
import { describe, expect, it } from 'vitest';
import type { Fermentable, HopIngredient, Recipe } from '../../../src/types';
import { recipeSaveIssues } from '../../../src/domain/recipeValidation';
import { hotBitterness } from '../../../src/domain/hopBitterness';
import { yeastRecipeComputedOg } from '../../../src/domain/yeastProjection';
import { BrewingMath } from '../../../src/services/brewingMath';

// Simulé : Pale Ale à 37 ppg (valeur typique de fiche malterie).
const pale = (kg: number): Fermentable => ({ name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: kg, potentialPpg: 37, colorEbc: 6.5 });
const houblon = (name: string, alpha: number, weightG: number): HopIngredient => ({ name, alpha, weightG, stage: 'boil', timeMin: 60 } as HopIngredient);
const recette = (fermentables: Fermentable[], hops: HopIngredient[] = []): Recipe =>
  ({ id: 'R', name: 'Pale', volumeL: 20, boilMin: 60, fermentables, hops } as unknown as Recipe);
const messages = (r: Recipe) => recipeSaveIssues(r).map((i) => i.message).join(' | ');

describe('MV-44 et MV-45 — 10 000 kg ou 50 kg de Pale Ale dans 20 L', () => {
  for (const kg of [10000, 50]) {
    it(`${kg} kg : la validation dit l’erreur de saisie, et l’IBU n’est pas calculé sur l’OG absurde`, () => {
      expect(messages(recette([pale(kg)]))).toMatch(/kg\/L.*erreur de saisie probable/);
      const og = yeastRecipeComputedOg({ fermentables: [pale(kg)], volumeL: 20, efficiencyPct: 75 })!;
      expect(og).toBeGreaterThan(1.13);
      expect(BrewingMath.efficiencyAtGravity(75, og).note).toMatch(/Erreur de saisie probable/);
      expect(hotBitterness([houblon('Citra', 8, 30)], 20, og, 60).total).toBeNull();
    });
  }
  it('une vraie recette (5 kg dans 20 L, OG ~1,079) passe', () => {
    expect(messages(recette([pale(5)], [houblon('Citra', 8, 30)]))).not.toMatch(/kg\/L|g\/L/);
    const og = yeastRecipeComputedOg({ fermentables: [pale(5)], volumeL: 20, efficiencyPct: 75 })!;
    expect(hotBitterness([houblon('Citra', 8, 30)], 20, og, 60).total).toBeGreaterThan(0);
  });
});

describe('MV-46 — alpha 100 %', () => {
  it('100 % : à confirmer, pas 469 IBU en silence', () => {
    expect(hotBitterness([houblon('Citra', 100, 30)], 20, 1.05, 60).total).toBeNull();
    expect(messages(recette([pale(5)], [houblon('Citra', 100, 30)]))).toMatch(/Citra : α 100 %/);
  });
});

describe('MV-47 — 99 999 g de Nugget dans 20 L', () => {
  it('erreur claire à la validation, et pas d’IBU (112 477 IBU auparavant)', () => {
    expect(messages(recette([pale(5)], [houblon('Nugget', 13, 99999)]))).toMatch(/g\/L.*erreur de saisie probable/);
    const r = hotBitterness([houblon('Nugget', 13, 99999)], 20, 1.05, 60);
    expect(r.total).toBeNull();
    expect(r.missing.join(' ')).toMatch(/g\/L/);
  });
});
