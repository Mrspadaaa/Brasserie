import type { BrewhouseProfile, Recipe } from '../../types';
import { BrewingMath } from '../../services/brewingMath';

/**
 * Recipe scenario shared by budgets, the calculator and batch creation.
 * Keep the source identity for recipe→batch reconciliation.
 * The common scaler owns the final water plan, doses and frozen equipment.
 * Only source identity and adjunct quantities need completing for the budget.
 */
export function scaleBrewBudgetRecipe(recipe: Recipe, volumeL: number, brewhouse?: BrewhouseProfile, targetBrewhouse = brewhouse): Recipe {
  if (!(volumeL > 0) || !Number.isFinite(volumeL) || !(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL)) throw new Error('Volume à brasser invalide.');
  if (volumeL === recipe.volumeL && targetBrewhouse === brewhouse) return structuredClone(recipe);
  return scaleBrewRecipeScenario(recipe, volumeL, brewhouse, targetBrewhouse).scaledRecipe;
}

/** Keep the scientific scaler's water/absorption outputs intact for its existing UI. */
export function scaleBrewRecipeScenario(recipe: Recipe, volumeL: number, brewhouse?: BrewhouseProfile, targetBrewhouse = brewhouse): ReturnType<typeof BrewingMath.scaleRecipe> {
  if (!(volumeL > 0) || !Number.isFinite(volumeL) || !(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL)) throw new Error('Volume à brasser invalide.');
  if (!brewhouse || !targetBrewhouse) throw new Error('Configure une cuverie pour adapter les ingrédients à ce volume.');
  const source = structuredClone(recipe);
  const ratio = volumeL / source.volumeL;
  const sized = BrewingMath.scaleRecipe(source, volumeL, brewhouse, targetBrewhouse);
  if (volumeL === recipe.volumeL && targetBrewhouse === brewhouse) return { ...sized, scaledRecipe: source };
  const scaled = { ...sized.scaledRecipe, id: recipe.id };
  if (source.adjuncts) scaled.adjuncts = source.adjuncts.map(item => ({ ...item, amount: item.amount * ratio }));
  return { ...sized, scaledRecipe: scaled };
}
