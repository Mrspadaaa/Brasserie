import type { Recipe, WaterPlan, WaterSource, WaterIons, SaltId, IonBand } from '../types';
import {
  ACIDS,
  SALT_IDS,
  dilute,
  solveSalts,
  calculateWaterTreatment,
  targetRaForGrist,
  raSaltCeilingForGrist,
  rebalanceRatio,
  estimateMashPh,
  lactateInBeer,
  LACTATE_TASTE_THRESHOLD
} from './water';
import { styleByCode, styleWaterForName, styleFromTargetIons, midpoint } from './waterStyles';
import { computeBeerColor } from './beerColor';
import { hopBalanceHint } from './hopBalance';
import { BrewingMath } from '../services/brewingMath';
type WaterRecipe = Pick<
  Recipe,
  | 'style'
  | 'volumeL'
  | 'fermentables'
  | 'hops'
  | 'waterPlan'
  | 'boilMin'
  | 'efficiencyPct'
  | 'brewhouse'
>;

export const waterInputPaths = [
  'waterPlan.roLimitL',
  'waterPlan.diRatioPct',
  'waterPlan.spargeDiRatioPct',
  'waterPlan.mashWaterL',
  'waterPlan.spargeWaterL',
  'waterPlan.sourceId',
  'waterPlan.sourceSnapshot',
  'waterPlan.targetProfileId',
  'waterPlan.targetIons',
  'waterPlan.allSaltsInMash',
  'waterPlan.disabled',
  'waterPlan.autoTreatment',
  'waterPlan.acid.id',
  'waterPlan.ratioOverride',
  'waterPlan.saltOverrides',
  'waterPlan.acidOverride',
  'mash.ratioLPerKg'
];
export const waterRelatedPath = (path: string) =>
  path.startsWith('waterPlan.') ||
  path === 'mash.ratioLPerKg' ||
  ['fermentables', 'volumeL', 'hops', 'boilMin', 'style', 'efficiencyPct'].some(
    (root) => path === root || path.startsWith(root + '.')
  );

/** Preserve the chosen mash/sparge balance; a stock limit is a maximum, not water to waste. */
export function constrainRo<
  T extends Pick<
    WaterPlan,
    'diRatioPct' | 'spargeDiRatioPct' | 'mashWaterL' | 'spargeWaterL' | 'roLimitL'
  >
>(plan: T): T {
  if (plan.roLimitL == null) return plan;
  if (!Number.isFinite(plan.roLimitL) || plan.roLimitL < 0)
    throw Error('Limite d’osmosée invalide.');
  const used =
    (plan.mashWaterL * plan.diRatioPct +
      plan.spargeWaterL * (plan.spargeDiRatioPct ?? plan.diRatioPct)) /
    100;
  if (used <= plan.roLimitL + 1e-9) return plan;
  const factor = plan.roLimitL / used;
  return {
    ...plan,
    diRatioPct: plan.diRatioPct * factor,
    ...(plan.spargeDiRatioPct != null ? { spargeDiRatioPct: plan.spargeDiRatioPct * factor } : {})
  };
}

export function recipeWaterCalculation(recipe: WaterRecipe) {
  const p = recipe.waterPlan;
  if (!p || !(p.mashWaterL > 0) || !(p.spargeWaterL >= 0))
    throw Error('Renseigne les volumes d’empâtage et de rinçage.');
  const source = p.sourceSnapshot;
  if (
    !source ||
    !['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].every(
      (k) => Number.isFinite(source[k]) && source[k] >= 0
    )
  )
    throw Error('Analyse de l’eau source manquante ou incomplète : aucun dosage inventé.');
  const grains = (recipe.fermentables ?? []).filter((f) => f.kind === 'grain');
  const grainKg = grains.reduce((sum, f) => sum + f.weightKg, 0);
  const ratio = grainKg > 0 ? p.mashWaterL / grainKg : 0;
  const band = targetRaForGrist(
    computeBeerColor(grains, recipe.volumeL)?.ebc ?? null,
    grains,
    ratio
  );
  return { p, source, grains, ratio, band };
}

/** Same global mineral solver and acid calculation as the water workshop. No AI arithmetic. */
export function replanRecipeWater(recipe: WaterRecipe): { plan: WaterPlan; warnings: string[] } {
  const { p: original, source, grains, ratio, band } = recipeWaterCalculation(recipe);
  const p = constrainRo(original);
  const start = dilute(source, p.diRatioPct);
  const startSparge = dilute(source, p.spargeDiRatioPct ?? p.diRatioPct);
  const style = p.targetIons
    ? styleFromTargetIons(p.targetIons, p.targetName ?? 'Cible de la recette')
    : p.targetProfileId
      ? styleByCode(p.targetProfileId)
      : styleWaterForName(recipe.style);
  const og = BrewingMath.calculateOg(
    recipe.fermentables,
    recipe.volumeL,
    recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct ?? 75
  );
  const ibu = BrewingMath.calculateTinsethIBU(
    recipe.hops ?? [],
    recipe.volumeL,
    og,
    recipe.boilMin
  );
  // Numeric custom profiles keep their specified SO4/Cl, as the workshop does.
  const wantedRatio =
    p.ratioOverride ??
    (p.targetIons?.so4 != null && p.targetIons?.cl != null && p.targetIons.cl > 0
      ? p.targetIons.so4 / p.targetIons.cl
      : (hopBalanceHint(recipe.hops, ibu, og, style.ratio)?.ratio ??
        (style.ratio.min + style.ratio.max) / 2));
  const target = rebalanceRatio(
    p.targetIons ? { ...start, ...p.targetIons } : midpoint(style),
    wantedRatio
  );
  const ranges = Object.fromEntries(
    Object.entries(style.ions).map(([ion, range]) => [ion, { ...range }])
  ) as Record<keyof WaterIons, IonBand>;
  if (wantedRatio < style.ratio.min || wantedRatio > style.ratio.max)
    for (const ion of ['so4', 'cl'] as const)
      ranges[ion] = {
        min: Math.min(ranges[ion].min, target[ion]),
        max: Math.max(ranges[ion].max, target[ion])
      };
  const solved = solveSalts({
    start,
    startSparge,
    target,
    ranges,
    mineralTargetMode: p.targetIons ? 'target' : 'minimum',
    totalWaterL: p.mashWaterL + p.spargeWaterL,
    mashWaterL: p.mashWaterL,
    targetRa: band,
    raCeiling: raSaltCeilingForGrist(grains, ratio),
    disabled: p.disabled,
    allSaltsInMash: p.allSaltsInMash !== false,
    ratio: wantedRatio
  });
  // calculateWaterTreatment needs an acid ID even when no acid has been selected.
  // The zero override below prevents it from prescribing an unknown product.
  const acidId = p.acid?.id ?? 'lactique';
  const input = {
    ...p,
    doses: solved.doses,
    acidId,
    acidOverride: p.acid ? p.acidOverride : { mash: 0, sparge: 0 }
  };
  let treatment = calculateWaterTreatment(source, input, band);
  const split = structuredClone(treatment.split);
  for (const side of ['mash', 'sparge'] as const) {
    for (const [id, grams] of Object.entries(p.saltOverrides?.[side] ?? {}))
      if (!p.disabled?.includes(id as SaltId)) split[side][id] = grams;
  }
  const doses = Object.fromEntries(
    SALT_IDS.map((id) => [id, (split.mash[id] ?? 0) + (split.sparge[id] ?? 0)])
  );
  treatment = calculateWaterTreatment(source, { ...input, doses, saltSplit: split }, band);
  const plan: WaterPlan = {
    ...p,
    autoTreatment: true,
    ...split,
    startIons: treatment.startTotal,
    wortIons: treatment.treatedTotal,
    treatmentVersion: 2,
    ...(p.acid
      ? {
          acid: { id: acidId, mash: treatment.mashAcid.amount, sparge: treatment.spargeAcid.amount }
        }
      : {})
  };
  const warnings = [...solved.unreachable];
  for (const ion of ['ca', 'mg', 'na', 'so4', 'cl'] as const) {
    if (treatment.treatedTotal[ion] > ranges[ion].max + 2)
      warnings.push(
        `${ion.toUpperCase()} : ${treatment.treatedTotal[ion]} mg/L dépasse la cible ${ranges[ion].max}. Les sels ne retirent pas les ions déjà présents.`
      );
  }
  if (!p.acid)
    warnings.push(
      'Acidifiant non choisi : les sels sont calculés, l’acidification reste à préparer.'
    );
  if (
    p.acid?.id === 'lactique' &&
    lactateInBeer(plan.acid!.mash + plan.acid!.sparge, recipe.volumeL) > LACTATE_TASTE_THRESHOLD
  )
    warnings.push(
      'Charge lactique au-dessus du repère gustatif : envisager un autre acide ou davantage d’osmosée, sans dépasser le stock déclaré.'
    );
  if (p.saltOverrides || p.acidOverride)
    warnings.push('Doses manuelles conservées ; vérifier le profil obtenu après ces exceptions.');
  return { plan, warnings };
}

export function recipeWaterSummary(recipe: WaterRecipe) {
  const p = recipe.waterPlan;
  if (!p) return null;
  const mashRoL = (p.mashWaterL * p.diRatioPct) / 100;
  const spargeRoL = (p.spargeWaterL * (p.spargeDiRatioPct ?? p.diRatioPct)) / 100;
  let ph: ReturnType<typeof estimateMashPh> | undefined;
  const warnings: string[] = [];
  try {
    const { source, grains, ratio, band } = recipeWaterCalculation(recipe);
    const doses = Object.fromEntries(
      SALT_IDS.map((id) => [id, (p.mash?.[id] ?? 0) + (p.sparge?.[id] ?? 0)])
    );
    const treatment = calculateWaterTreatment(
      source,
      {
        ...p,
        doses,
        saltSplit: { mash: p.mash, sparge: p.sparge },
        acidId: p.acid?.id ?? 'lactique',
        acidOverride: { mash: p.acid?.mash ?? 0, sparge: p.acid?.sparge ?? 0 }
      },
      band
    );
    ph = estimateMashPh(grains, treatment.mashPhRa, ratio);
    const style = p.targetIons
      ? styleFromTargetIons(p.targetIons)
      : p.targetProfileId
        ? styleByCode(p.targetProfileId)
        : styleWaterForName(recipe.style);
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl'] as const) {
      const value = treatment.treatedTotal[ion],
        range = style.ions[ion];
      if (value < range.min - 2 || value > range.max + 2)
        warnings.push(
          `${ion.toUpperCase()} : ${value} mg/L, repère ${range.min}–${range.max}. Les ajouts ne retirent pas les ions du réseau.`
        );
    }
  } catch {
    warnings.push('Analyse source manquante : ions et pH non vérifiables.');
  }
  if (!p.acid) warnings.push('Acidifiant non choisi ; acidification non calculée.');
  if (
    p.acid?.id === 'lactique' &&
    lactateInBeer(p.acid.mash + p.acid.sparge, recipe.volumeL) > LACTATE_TASTE_THRESHOLD
  )
    warnings.push('Charge lactique au-dessus du repère gustatif.');
  const rounded = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    mashRoL: rounded(mashRoL),
    spargeRoL: rounded(spargeRoL),
    totalRoL: rounded(mashRoL + spargeRoL),
    tapL: rounded(p.mashWaterL + p.spargeWaterL - mashRoL - spargeRoL),
    warnings,
    ...(p.roLimitL != null ? { availableRoL: p.roLimitL } : {}),
    ...(ph ? { mashPhEstimate: ph } : {}),
    acidProduct: p.acid ? ACIDS[p.acid.id] : null
  };
}

/** Called only while preparing a proposal: all physical deltas are exposed for approval. */
export function reconcileRecipeWater(recipe: Recipe, paths: string[], sources: WaterSource[] = []) {
  const next = structuredClone(recipe);
  const p = next.waterPlan;
  if (!p) return next;
  if (paths.includes('mash.ratioLPerKg')) {
    if (paths.some((path) => ['waterPlan.mashWaterL', 'waterPlan.spargeWaterL'].includes(path)))
      throw Error('Choisis le rapport eau/grain ou les volumes, pas les deux commandes ensemble.');
    const total = p.mashWaterL + p.spargeWaterL;
    const kg = next.fermentables
      .filter((f) => f.kind === 'grain')
      .reduce((sum, f) => sum + f.weightKg, 0);
    const mashL = kg * next.mash!.ratioLPerKg!;
    if (!(kg > 0) || mashL > total)
      throw Error('Ce rapport dépasse l’eau prévue : revois d’abord les volumes.');
    p.mashWaterL = mashL;
    p.spargeWaterL = total - mashL;
  }
  const matches = (path: string, root: string) => path === root || path.startsWith(root + '.');
  if (paths.includes('waterPlan.sourceId')) {
    const source = sources.find((s) => s.id === p.sourceId);
    if (!source) throw Error('Cette source d’eau n’existe pas dans la brasserie.');
    p.sourceSnapshot = structuredClone(source);
  } else if (!p.sourceSnapshot) {
    const source = sources.find((s) => s.id === p.sourceId);
    if (source) p.sourceSnapshot = structuredClone(source);
  }
  const inputChanged = paths.some((path) => waterInputPaths.some((root) => matches(path, root)));
  const recipeChanged = paths.some(
    (path) => waterRelatedPath(path) && !/measured|targetPh/.test(path)
  );
  for (const side of ['mash', 'sparge'] as const) {
    const root = `waterPlan.${side}`;
    const pinned = paths.filter((path) => matches(path, root));
    if (pinned.length) {
      p.saltOverrides ??= {};
      p.saltOverrides[side] ??= {};
      for (const id of SALT_IDS)
        if (pinned.includes(root) || pinned.includes(`${root}.${id}`)) {
          if (p.disabled?.includes(id) && (p[side]?.[id] ?? 0) > 0)
            throw Error('Ce sel est écarté : réactive-le avant de proposer une dose.');
          p.saltOverrides[side][id] = p[side]?.[id] ?? 0;
        }
    }
    if (paths.includes('waterPlan.acid') || paths.includes(`waterPlan.acid.${side}`)) {
      p.acidOverride ??= {};
      p.acidOverride[side] = p.acid?.[side] ?? 0;
    }
  }
  if (
    paths.includes('waterPlan.acid.id') &&
    !paths.some((path) => path.startsWith('waterPlan.acidOverride'))
  )
    delete p.acidOverride;
  const explicitlyManual = paths.includes('waterPlan.autoTreatment') && p.autoTreatment === false;
  if (explicitlyManual && p.acid) p.acidOverride = { mash: p.acid.mash, sparge: p.acid.sparge };
  if (!explicitlyManual && (inputChanged || (p.autoTreatment && recipeChanged))) {
    next.waterPlan = replanRecipeWater(next).plan;
  } else next.waterPlan = constrainRo(p);
  return next;
}
