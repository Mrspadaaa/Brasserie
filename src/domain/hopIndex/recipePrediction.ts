import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import { hopTripletsOfRecipe } from './engine';
import { findRecipeHopMatches, findRecipeYeastMatches, withDocumentedYeastNames } from './recipeGuide';
import type { TrialRecipe } from './trials';

/** Resolve documented identities at read time. A name/AA annotation never becomes
 * a COA; a day number or fermentation note never creates an unrecorded hop event. */
export function prepareHopRecipeInput(recipe: TrialRecipe, varieties: HopVariety[], yeasts: HopYeast[]): { input: HopRecipeInput; proposed: string[] } {
  const proposed: string[] = [];
  const matches = findRecipeYeastMatches(recipe.yeast?.name ?? '', withDocumentedYeastNames(yeasts));
  const yeastId = recipe.yeast?.hopIndexId || (matches.length === 1 ? matches[0].item.id : null);
  if (!recipe.yeast?.hopIndexId && yeastId) proposed.push(`Souche reconnue pour la simulation : ${matches[0].item.name}.`);
  const additions = hopTripletsOfRecipe(recipe).map((triplet, i) => {
    const hop = recipe.hops[i];
    if (!triplet.varietyId) {
      const candidates = findRecipeHopMatches(hop.name, varieties);
      const generic = candidates.filter(m => m.item.id.startsWith('hopsteiner-'));
      const selected = generic.length === 1 ? generic[0] : candidates.length === 1 ? candidates[0] : undefined;
      if (selected) {
        triplet = { ...triplet, varietyId: selected.item.id };
        proposed.push(`Ajout ${i + 1} : « ${hop.name} » reconnu comme ${selected.item.name}.`);
      }
    }
    // No fallback to postFermentation: J+3 does not establish the fermentation state.
    return { id: `hop-${i}`, name: hop.name, triplet: { ...triplet, yeastId },
      ...(Number.isFinite(hop.dayOffset) ? { dayOffset: hop.dayOffset } : {}) };
  });
  return { input: { volumeL: Number.isFinite(recipe.volumeL) && recipe.volumeL > 0 ? recipe.volumeL : 0, yeastId, additions,
    ...(Number.isFinite(recipe.yeast?.pitchTempC) ? { pitchTempC: recipe.yeast.pitchTempC } : {}),
    fermentation: (recipe.fermentation ?? []).map(step => ({
      ...(step.kind ? { kind: step.kind } : {}), ...(step.name ? { name: step.name } : {}),
      ...(step.note ? { note: step.note } : {}),
      ...(Number.isFinite(step.tempC) ? { tempC: step.tempC } : {}),
      ...(Number.isFinite(step.days) ? { days: step.days } : {})
    })) }, proposed };
}
