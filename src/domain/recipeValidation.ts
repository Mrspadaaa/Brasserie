import type { Recipe } from '../types';

export type RecipeStepId = 'identite' | 'fermentescibles' | 'houblons' | 'levure' | 'paliers' | 'eau' | 'recap';
export interface RecipeFieldIssue {
  field: string;
  step: RecipeStepId;
  message: string;
}

/** Required recipe data, shared by keyboard submission, save and batch launch. */
export function recipeFieldIssues(recipe: Recipe): RecipeFieldIssue[] {
  const issues: RecipeFieldIssue[] = [];
  const number = (value: number | undefined, min: number, field: string, step: RecipeStepId, label: string, max = Infinity) => {
    if (value == null || !Number.isFinite(value)) issues.push({ field, step, message: `${label} : renseigne une valeur.` });
    else if (value < min || value > max) issues.push({ field, step, message: `${label} : ${max < Infinity ? `valeur attendue entre ${min} et ${max}` : min === 0 ? 'la valeur ne peut pas être négative' : min === Number.MIN_VALUE ? 'la valeur doit être supérieure à zéro' : `la valeur doit être d’au moins ${min}`}.` });
  };
  if (recipe.name.trim().length < 2) issues.push({ field: 'wz-title', step: 'identite', message: 'Donne un nom à la recette (au moins 2 caractères).' });
  number(recipe.volumeL, 1, 'wz-volume', 'identite', 'Volume en fermenteur');
  number(recipe.boilMin, 0, 'wz-boil', 'identite', 'Durée d’ébullition');
  (recipe.fermentables ?? recipe.malts ?? []).forEach((item, i) => {
    number(item.weightKg, 0, `wz-fermentable-${i}`, 'fermentescibles', `Quantité de ${item.name || `l’ingrédient ${i + 1}`}`);
  });
  (recipe.hops ?? []).forEach((item, i) => {
    number(item.weightG, 0, `wz-hop-${i}`, 'houblons', `Quantité de ${item.name || `houblon ${i + 1}`}`);
    if (item.stage === 'boil' || item.stage === 'whirlpool') number(item.timeMin, 0, `wz-hop-time-${i}`, 'houblons', `Durée de ${item.name}`);
    if (item.stage === 'whirlpool') number(item.tempC, 0, `wz-hop-temp-${i}`, 'houblons', `Température de ${item.name}`, 100);
  });
  if (recipe.yeast?.name) number(recipe.yeast.qty, 0, 'wz-yeast-qty', 'levure', 'Quantité de levure');
  (recipe.mash?.steps ?? []).forEach((item, i) => {
    number(item.tempC, 0, `wz-mash-temp-${i}`, 'paliers', `Température du palier ${i + 1}`, 100);
    number(item.durationMin, 0, `wz-mash-duration-${i}`, 'paliers', `Durée du palier ${i + 1}`);
  });
  (recipe.fermentation ?? []).forEach((item, i) => {
    number(item.tempC, -Infinity, `wz-ferment-temp-${i}`, 'paliers', `Température de ${item.name || `la phase ${i + 1}`}`);
    number(item.days, 0, `wz-ferment-days-${i}`, 'paliers', `Durée de ${item.name || `la phase ${i + 1}`}`);
  });
  if (recipe.waterPlan) {
    number(recipe.waterPlan.mashWaterL, 0, 'wz-mash-water', 'eau', 'Eau d’empâtage');
    number(recipe.waterPlan.spargeWaterL, 0, 'wz-sparge-water', 'eau', 'Eau de rinçage');
  }
  return issues;
}

export function assertRecipeFields(recipe: Recipe): void {
  const issue = recipeFieldIssues(recipe)[0];
  if (issue) throw new Error(issue.message);
}
