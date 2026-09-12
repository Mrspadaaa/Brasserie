import type { BrewhouseProfile, Recipe } from '../../types';
import { BrewingMath } from '../../services/brewingMath';

/**
 * Recipe scenario shared by budgets, the calculator and batch creation.
 * Keep the source identity for recipe→batch reconciliation.
 * The production scaler returns water volumes separately and leaves adjuncts and
 * retained treatment doses unchanged; carry those quantities into this snapshot.
 * This prices retained treatment concentrations, it does not solve a new water plan.
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
  const scaled = { ...sized.scaledRecipe, id: recipe.id, preBoilL: sized.preBoilVolumeL, brewhouse: structuredClone(targetBrewhouse), efficiencyPct: targetBrewhouse.efficiencyPct };
  if (source.adjuncts) scaled.adjuncts = source.adjuncts.map(item => ({ ...item, amount: item.amount * ratio }));
  const water = source.waterPlan;
  if (water) {
    const mashRatio = water.mashWaterL > 0 ? sized.mashWaterL / water.mashWaterL : ratio;
    const spargeRatio = water.spargeWaterL > 0 ? sized.spargeWaterL / water.spargeWaterL : ratio;
    const totalRatio = water.mashWaterL + water.spargeWaterL > 0 ? (sized.mashWaterL + sized.spargeWaterL) / (water.mashWaterL + water.spargeWaterL) : ratio;
    const saltMashRatio = water.allSaltsInMash ? totalRatio : mashRatio;
    const doses = <T extends Partial<Record<string, number>>>(values: T | undefined, factor: number): T | undefined => values ? Object.fromEntries(Object.entries(values).map(([key, amount]) => [key, amount * factor])) as T : undefined;
    scaled.waterPlan = {
      ...water,
      mashWaterL: sized.mashWaterL,
      spargeWaterL: sized.spargeWaterL,
      mash: doses(water.mash, saltMashRatio),
      sparge: doses(water.sparge, spargeRatio),
      ...(water.acid ? { acid: { ...water.acid, mash: water.acid.mash * mashRatio, sparge: water.acid.sparge * spargeRatio } } : {}),
      ...(water.saltOverrides ? { saltOverrides: { mash: doses(water.saltOverrides.mash, saltMashRatio), sparge: doses(water.saltOverrides.sparge, spargeRatio) } } : {}),
      ...(water.acidOverride ? { acidOverride: { ...(water.acidOverride.mash != null ? { mash: water.acidOverride.mash * mashRatio } : {}), ...(water.acidOverride.sparge != null ? { sparge: water.acidOverride.sparge * spargeRatio } : {}) } } : {})
    };
  }
  return { ...sized, scaledRecipe: scaled };
}
