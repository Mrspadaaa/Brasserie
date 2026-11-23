import type { Recipe } from '../types';
import { averageWater, addIons, ionsFromSalts, ionsAfterAcid } from './water';

/** Preserve chosen concentrations when volumes change. Measured pH is not a recipe target. */
export function resizeWaterPlan(recipe: Pick<Recipe, 'waterPlan'>, water: { mashWaterL: number; spargeWaterL: number }, ratio = 1): Recipe['waterPlan'] {
  const round = (n: number, d = 3) => Number(n.toFixed(d));
  const plan = recipe.waterPlan ? structuredClone(recipe.waterPlan) : undefined;
  if (plan) {
    const m = plan.mashWaterL > 0 ? water.mashWaterL / plan.mashWaterL : ratio;
    const s = plan.spargeWaterL > 0 ? water.spargeWaterL / plan.spargeWaterL : ratio;
    const oldTotal = plan.mashWaterL + plan.spargeWaterL;
    const totalRatio = oldTotal > 0 ? (water.mashWaterL + water.spargeWaterL) / oldTotal : ratio;
    plan.mash = Object.fromEntries(
      Object.entries(plan.mash).map(([k, v]) => [k, round(v! * (plan.allSaltsInMash !== false ? totalRatio : m), 2)])
    );
    plan.sparge = Object.fromEntries(
      Object.entries(plan.sparge).map(([k, v]) => [k, round(v! * s, 2)])
    );
    if (plan.acid)
      plan.acid = {
        ...plan.acid,
        mash: round(plan.acid.mash * m, 2),
        sparge: round(plan.acid.sparge * s, 2)
      };
    if (plan.acidOverride)
      plan.acidOverride = {
        ...(plan.acidOverride.mash != null ? { mash: round(plan.acidOverride.mash * ratio, 2) } : {}),
        ...(plan.acidOverride.sparge != null
          ? { sparge: round(plan.acidOverride.sparge * ratio, 2) }
          : {})
      };
    // A pinned quantity belongs to the brewer. Changing only the water split
    // keeps it unchanged; an explicit recipe resize applies its volume ratio.
    if (plan.acid && plan.acidOverride) {
      if (plan.acidOverride.mash != null) plan.acid.mash = plan.acidOverride.mash;
      if (plan.acidOverride.sparge != null) plan.acid.sparge = plan.acidOverride.sparge;
    }
    for (const side of ['mash', 'sparge'] as const) {
      const pinned = plan.saltOverrides?.[side];
      if (!pinned) continue;
      plan.saltOverrides![side] = Object.fromEntries(Object.entries(pinned).map(([id, dose]) => [id, round(dose * ratio, 2)]));
      plan[side] = { ...plan[side], ...plan.saltOverrides![side] };
    }
    plan.mashWaterL = water.mashWaterL;
    plan.spargeWaterL = water.spargeWaterL;
    // An altered recipe has no measured pH yet.
    delete plan.measuredPh;
    delete plan.measuredSpargePh;
    const old = recipe.waterPlan!;
    const mashTap = 1 - plan.diRatioPct / 100,
      spargeTap = 1 - (plan.spargeDiRatioPct ?? plan.diRatioPct) / 100;
    const oldFraction =
      old.treatmentVersion === 2
        ? (old.mashWaterL * mashTap + old.spargeWaterL * spargeTap) /
          (old.mashWaterL + old.spargeWaterL)
        : mashTap;
    const source =
      plan.sourceSnapshot ??
      (old.startIons && oldFraction > 0
        ? Object.fromEntries(Object.entries(old.startIons).map(([k, v]) => [k, v / oldFraction]))
        : mashTap === 0 && spargeTap === 0
          ? { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 }
          : undefined);
    if (source) {
      const originalMashStart = Object.fromEntries(
        ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].map((k) => [k, source[k] * mashTap])
      );
      const spargeStart = Object.fromEntries(
        ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].map((k) => [k, source[k] * spargeTap])
      ) as any;
      const treated = (side: 'mash' | 'sparge', start: any) => {
        const l = side === 'mash' ? water.mashWaterL : water.spargeWaterL;
        const mineral = addIons(start, ionsFromSalts(plan[side], l));
        return plan.acid ? ionsAfterAcid(mineral, plan.acid[side], plan.acid.id, l) : mineral;
      };
      plan.startIons = averageWater(
        originalMashStart as any,
        spargeStart,
        water.mashWaterL,
        water.spargeWaterL
      );
      plan.wortIons = averageWater(
        treated('mash', originalMashStart),
        treated('sparge', spargeStart),
        water.mashWaterL,
        water.spargeWaterL
      );
      plan.treatmentVersion = 2;
    } else {
      delete plan.wortIons;
      delete plan.startIons;
    }
  }
  return plan;
}
