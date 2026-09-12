import type { Recipe } from '../../src/types';
import { fullRecipe } from './fullRecipe';
import { applyYeastRecipeDesign, createYeastRecipeDraft } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
export const yeastFlowRecipe = (): Recipe => {
  const recipe: Recipe = { ...structuredClone(fullRecipe), name: 'Weissbier essai girofle', style: 'Hefeweizen', styleRef: undefined,
    nolo: undefined, yeastDesign: undefined, yeastGuide: undefined, waterPlan: undefined, volumeL: 20, ogTarget: 1.05,
    yeast: { name: 'Wyeast 3068', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 125, unit: 'mL', pitchTempC: 18 },
    fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 18, days: 10 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
    hops: [{ name: 'Hallertau', stage: 'boil', weightG: 20, alpha: 4, timeMin: 60 },
      { name: 'Mandarina Bavaria', stage: 'dryHop', weightG: 20, alpha: 0, dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 18 }] };
  const refs = yeastReferences([]);
  return applyYeastRecipeDesign(recipe, { ...createYeastRecipeDraft(recipe, refs), goal: 'clove', ferulicRest: true, pressureBar: 0 }, refs);
};
