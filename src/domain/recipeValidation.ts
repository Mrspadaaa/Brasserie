import type { Recipe } from '../types';

export type RecipeStepId = 'identite' | 'fermentescibles' | 'houblons' | 'levure' | 'paliers' | 'eau' | 'recap';
export interface RecipeFieldIssue {
  field: string;
  step: RecipeStepId;
  message: string;
}

export interface RecipeReadiness {
  status: 'invalid' | 'incomplete' | 'ready';
  /** Values that cannot be written as a usable recipe. */
  invalid: RecipeFieldIssue[];
  /** Unknown choices and zero planned doses that may remain in a saved recipe. */
  missing: RecipeFieldIssue[];
}

/** Recipe invariant: never persist NaN or Infinity, including nested snapshots. */
function firstInvalidNumber(value: unknown, path = 'recette', seen = new WeakSet<object>()): string | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? undefined : path;
  if (value === null || typeof value !== 'object' || seen.has(value)) return undefined;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    const invalid = firstInvalidNumber(child, Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`, seen);
    if (invalid) return invalid;
  }
  return undefined;
}

/** Save only finite, coherent numbers. An unplanned dose is 0 or absent, never NaN. */
export function recipeSaveIssues(recipe: Recipe): RecipeFieldIssue[] {
  const issues: RecipeFieldIssue[] = [];
  let knownNonFinite = false;
  const add = (field: string, step: RecipeStepId, message: string) => issues.push({ field, step, message });
  const number = (value: number | undefined, min: number, field: string, step: RecipeStepId, label: string, max = Infinity) => {
    if (value == null || !Number.isFinite(value)) {
      if (value != null) knownNonFinite = true;
      add(field, step, `${label} : renseigne une valeur.`);
    }
    else if (value < min || value > max) add(field, step, `${label} : ${max < Infinity ? `valeur attendue entre ${min} et ${max}` : min === 0 ? 'la valeur ne peut pas être négative' : min === Number.MIN_VALUE ? 'la valeur doit être supérieure à zéro' : `la valeur doit être d’au moins ${min}`}.`);
  };
  if (typeof recipe.name !== 'string' || recipe.name.trim().length < 2) add('wz-title', 'identite', 'Donne un nom à la recette (au moins 2 caractères).');
  number(recipe.volumeL, 1, 'wz-volume', 'identite', 'Volume en fermenteur');
  number(recipe.boilMin, 0, 'wz-boil', 'identite', 'Durée d’ébullition');
  (recipe.fermentables ?? recipe.malts ?? []).forEach((item, i) =>
    number(item.weightKg, 0, `wz-fermentable-${i}`, 'fermentescibles', `Quantité de ${item.name || `l’ingrédient ${i + 1}`}`));
  (recipe.hops ?? []).forEach((item, i) => {
    number(item.weightG, 0, `wz-hop-${i}`, 'houblons', `Quantité de ${item.name || `houblon ${i + 1}`}`);
    // 0 means this lot's alpha is unknown; it is not a fabricated estimate.
    if (item.alpha != null) number(item.alpha, 0, `wz-hop-alpha-${i}`, 'houblons', `Alpha de ${item.name}`, 100);
    if ((item.stage === 'boil' || item.stage === 'whirlpool') && item.timeMin != null)
      number(item.timeMin, 0, `wz-hop-time-${i}`, 'houblons', `Durée de ${item.name}`);
    if (item.stage === 'boil' && Number.isFinite(item.timeMin) && Number.isFinite(recipe.boilMin) && item.timeMin! > recipe.boilMin)
      add(`wz-hop-time-${i}`, 'houblons', `${item.name} : les ${item.timeMin} min de contact dépassent les ${recipe.boilMin} min d’ébullition.`);
    if (item.stage === 'whirlpool' && item.tempC != null)
      number(item.tempC, 0, `wz-hop-temp-${i}`, 'houblons', `Température de ${item.name}`, 100);
    if (item.stage === 'dryHop') {
      if (item.dayOffset != null) number(item.dayOffset, 0, `wz-hop-day-${i}`, 'houblons', `Jour à cru de ${item.name}`);
      if (item.aromaContactHours != null) number(item.aromaContactHours, 0, `wz-hop-contact-${i}`, 'houblons', `Contact à cru de ${item.name}`);
    }
  });
  // A missing yeast dose is a valid saved plan; a malformed or negative dose is not.
  if (recipe.yeast?.qty != null) number(recipe.yeast.qty, 0, 'wz-yeast-qty', 'levure', 'Quantité de levure');
  for (const [value, label] of [[recipe.yeast?.fermTempMinC, 'minimale'], [recipe.yeast?.fermTempMaxC, 'maximale']] as const) {
    if (value != null && (!Number.isFinite(value) || value < -5 || value > 60)) {
      if (!Number.isFinite(value)) knownNonFinite = true;
      add('wz-yeast-range', 'levure', `Température ${label} de la levure : valeur attendue entre −5 et 60 °C.`);
    }
  }
  if (recipe.yeast?.fermTempMinC != null && recipe.yeast?.fermTempMaxC != null &&
    recipe.yeast.fermTempMinC > recipe.yeast.fermTempMaxC)
    add('wz-yeast-range', 'levure', 'La température minimale de la levure dépasse la maximale.');
  if (recipe.yeast?.attenuationPct != null && (!Number.isFinite(recipe.yeast.attenuationPct) || recipe.yeast.attenuationPct < 0 || recipe.yeast.attenuationPct > 100)) {
    if (!Number.isFinite(recipe.yeast.attenuationPct)) knownNonFinite = true;
    add('wz-yeast-range', 'levure', 'Atténuation de la levure : valeur attendue entre 0 et 100 %.');
  }
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
  const invalidNumber = firstInvalidNumber(recipe);
  if (invalidNumber && !knownNonFinite) add('wz-validation', 'recap', `Une valeur numérique de la recette est invalide (${invalidNumber}). Corrige-la avant l’enregistrement.`);
  return issues;
}

function recipeMissingIssues(recipe: Recipe): RecipeFieldIssue[] {
  const missing: RecipeFieldIssue[] = [];
  const add = (field: string, step: RecipeStepId, message: string) => missing.push({ field, step, message });
  const fermentables = recipe.fermentables ?? recipe.malts ?? [];
  if (!fermentables.length) add('wz-fermentable-list', 'fermentescibles', 'Ajoute les fermentescibles prévus.');
  fermentables.forEach((item, i) => { if (item.weightKg === 0) add(`wz-fermentable-${i}`, 'fermentescibles', `Quantité de ${item.name} : à compléter.`); });
  (recipe.hops ?? []).forEach((item, i) => {
    if (item.weightG === 0) add(`wz-hop-${i}`, 'houblons', `Quantité de ${item.name} : à compléter.`);
    if ((item.stage === 'boil' || item.stage === 'whirlpool') && item.timeMin == null)
      add(`wz-hop-time-${i}`, 'houblons', `Durée de ${item.name} : à compléter.`);
    if (item.stage === 'whirlpool' && item.tempC == null)
      add(`wz-hop-temp-${i}`, 'houblons', `Température de ${item.name} : à compléter.`);
  });
  if (!recipe.yeast?.name?.trim()) add('wz-yeast-name', 'levure', 'Choisis une souche de levure.');
  else {
    if (recipe.yeast.qty == null || recipe.yeast.qty === 0) add('wz-yeast-qty', 'levure', 'Quantité de levure : à compléter.');
    if (!recipe.yeast.unit?.trim()) add('wz-yeast-unit', 'levure', 'Unité de la quantité de levure : à choisir.');
  }
  return missing;
}

/** The save gate and the brew gate deliberately differ. */
export function recipeReadiness(recipe: Recipe): RecipeReadiness {
  const invalid = recipeSaveIssues(recipe), missing = recipeMissingIssues(recipe);
  return { status: invalid.length ? 'invalid' : missing.length ? 'incomplete' : 'ready', invalid, missing };
}

/** All corrections required before starting a brew. */
export function recipeFieldIssues(recipe: Recipe): RecipeFieldIssue[] {
  const { invalid, missing } = recipeReadiness(recipe);
  return [...invalid, ...missing];
}

export function assertRecipeFields(recipe: Recipe): void {
  const issue = recipeFieldIssues(recipe)[0];
  if (issue) throw new Error(issue.message);
}

export function assertRecipeSaveFields(recipe: Recipe): void {
  const issue = recipeSaveIssues(recipe)[0];
  if (issue) throw new Error(issue.message);
}
