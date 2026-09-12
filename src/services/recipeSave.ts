import type { Recipe } from '../types';
import { assertRecipeFields } from '../domain/recipeValidation';
import { FirestoreRepo, stripUndefined } from './firestoreRepo';
import { StorageService } from './storage';

/** Document values compare by content; object key order is not a recipe change. */
function sameValue(actual: unknown, submitted: unknown): boolean {
  if (actual === submitted) return true;
  if (typeof actual === 'number' && typeof submitted === 'number') return Number.isNaN(actual) && Number.isNaN(submitted);
  if (!actual || !submitted || typeof actual !== 'object' || typeof submitted !== 'object') return false;
  if (Array.isArray(actual) || Array.isArray(submitted)) {
    if (!Array.isArray(actual) || !Array.isArray(submitted) || actual.length !== submitted.length) return false;
    for (let index = 0; index < submitted.length; index++) if (!sameValue(actual[index], submitted[index])) return false;
    return true;
  }
  if (actual instanceof Date || submitted instanceof Date) {
    return actual instanceof Date && submitted instanceof Date && actual.getTime() === submitted.getTime();
  }
  const keys = Object.keys(submitted);
  return keys.length === Object.keys(actual).length && keys.every(key =>
    Object.prototype.hasOwnProperty.call(actual, key) && sameValue(actual[key], submitted[key]));
}

/** Resolves only for the submitted document, so callers can then clear the draft. */
export async function saveRecipeConfirmed(recipe: Recipe): Promise<Recipe> {
  assertRecipeFields(recipe);
  if (!recipe.id?.trim()) throw new Error('Identifiant de recette manquant.');
  // Freeze the intended values before callbacks, edits or server completion can alter them.
  const submitted = structuredClone(recipe);
  const expected = stripUndefined(submitted);
  const addsScience = expected.nolo != null && expected.nolo.scienceSnapshot == null;
  if (addsScience) delete expected.nolo!.scienceSnapshot;
  const identity = (value: Recipe) => {
    const actual = stripUndefined(value);
    // StorageService fills this one optional field when the author did not supply it.
    // An explicitly supplied science snapshot, and all other fields, must match exactly.
    if (addsScience && actual?.nolo) delete actual.nolo.scienceSnapshot;
    return sameValue(actual, expected);
  };
  if (StorageService.getRecipes().some(existing => existing.id === submitted.id)) StorageService.updateRecipe(submitted);
  else StorageService.addRecipe(submitted);
  const confirmed = await FirestoreRepo.waitForDocument<Recipe>('recipes', submitted.id, 15000, identity);
  return stripUndefined(confirmed);
}
