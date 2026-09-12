import { recipeIbu } from './hopBitterness';
import type { Recipe, SaltId } from '../types';
import { BrewingMath } from '../services/brewingMath';
import { computeBeerColor } from './beerColor';
import { hopBalanceHint } from './hopBalance';
import { styleByCode, styleFromTargetIons, styleWaterForName } from './waterStyles';
import { dilute } from './water/ions';
import { estimateMashPh, targetRaForGrist, raSaltCeilingForGrist, raForGrist } from './water/mashPh';
import { waterProfileTarget, waterTreatmentTarget } from './water/profileTarget';
import { SALT_IDS } from './water/substances';
import { calculateWaterTreatment } from './water/treatment';

export type WaterReadingsRecipe = Pick<Recipe,
  'waterPlan' | 'fermentables' | 'hops' | 'style' | 'volumeL' | 'boilMin' | 'efficiencyPct' | 'brewhouse' | 'nolo'>;

/** Reconstruct a saved plan from its frozen source and retained doses, without replanning. */
export function describeSavedRecipeWater(recipe: WaterReadingsRecipe) {
  if((recipe.nolo?.enabled&&recipe.nolo.process==='secondRunnings'))return null;
  const plan = recipe.waterPlan;
  if (!plan) return null;
  const source = plan.sourceSnapshot;
  if (!source || !(plan.mashWaterL > 0) || !(plan.spargeWaterL >= 0)
    || !Number.isFinite(plan.mashWaterL + plan.spargeWaterL)
    || !['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].every(ion => Number.isFinite(source[ion]) && source[ion] >= 0))
    return null;
  const fermentables = recipe.fermentables ?? [];
  const hops = recipe.hops ?? [];
  const mash = plan.mash ?? {}, sparge = plan.sparge ?? {};
  const grains = fermentables.filter(f => f.kind === 'grain' && (f.use ?? 'empatage') === 'empatage');
  const grainKg = grains.reduce((sum, grain) => sum + grain.weightKg, 0);
  const mashRatio = grainKg > 0 ? plan.mashWaterL / grainKg : 0;
  const beerEbc = computeBeerColor(grains, recipe.volumeL)?.ebc ?? null;
  const raBand = targetRaForGrist(beerEbc, grains, mashRatio);
  const doses = Object.fromEntries(SALT_IDS.map((id: SaltId) =>
    [id, (mash[id] ?? 0) + (sparge[id] ?? 0)]));
  const style = plan.targetIons ? styleFromTargetIons(plan.targetIons, plan.targetName)
    : plan.targetProfileId ? styleByCode(plan.targetProfileId) : styleWaterForName(recipe.style);
  const treatment = calculateWaterTreatment(source, {
    ...plan, doses, saltSplit: { mash, sparge },
    acidId: plan.acid?.id ?? 'lactique',
    acidOverride: { mash: plan.acid?.mash ?? 0, sparge: plan.acid?.sparge ?? 0 },
    ...waterTreatmentTarget(style, plan.targetIons, {
      ceiling: raSaltCeilingForGrist(grains, mashRatio), target: raForGrist(grains, mashRatio)
    })
  }, raBand);
  const phEstimate = estimateMashPh(grains, treatment.mashPhRa, mashRatio);
  const start = dilute(source, plan.diRatioPct);
  const og = BrewingMath.calculateOg(fermentables, recipe.volumeL,
    recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct ?? 75);
  const ibu = recipeIbu(hops, recipe.volumeL, og, recipe.boilMin);
  const customSo4 = plan.targetIons?.so4 ?? start.so4;
  const customCl = plan.targetIons?.cl ?? start.cl;
  const requestedRatio = plan.ratioOverride ?? (plan.targetIons
    ? customCl > 0 ? customSo4 / customCl : customSo4 > 0 ? Infinity : 0
    : hopBalanceHint(hops, ibu, og, style.ratio)?.ratio ?? (style.ratio.min + style.ratio.max) / 2);
  const profile = waterProfileTarget(style, start, plan.targetIons, requestedRatio,
    !plan.targetIons || plan.ratioOverride != null);
  return { treatment, raBand, beerEbc, style, phEstimate, targetPh: plan.targetPh,
    requestedRatio, targetRanges: profile.ranges };
}
