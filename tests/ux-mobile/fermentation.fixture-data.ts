import { applyYeastRecipeDesign, createYeastRecipeDraft } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';

export const fermentationUxRefs = yeastReferences([]);

/** Real recipe QA fixture, with one local phase added to exercise three-step selection. */
export function fermentationUxRecipe() {
  const source = yeastFlowRecipe();
  const recipe = {
    ...source,
    yeastDesign: undefined,
    fermentation: [
      ...(source.fermentation ?? []).slice(0, 1),
      { name: 'Repos diacétyle', kind: 'reposDiacetyle' as const, tempC: 20, days: 2 },
      ...(source.fermentation ?? []).slice(1),
    ],
  };
  return applyYeastRecipeDesign(recipe, {
    ...createYeastRecipeDraft(recipe, fermentationUxRefs),
    programme: recipe.fermentation,
    goal: 'clove',
  }, fermentationUxRefs, 'settings');
}
