import type { Recipe, SaltId } from '../types';
import { addIons, dilute, ionsFromSalts, ionsAfterAcid, averageWater } from './water';

/** Refresh derived displays, keeping all physical doses exactly as approved. */
export function refreshCompanionRecipe(recipe: Recipe): Recipe {
  const next = structuredClone(recipe),
    p = next.waterPlan,
    rig = next.brewhouse?.equipment;
  next.totalGristKg = (next.fermentables ?? [])
    .filter((f) => f.kind === 'grain')
    .reduce((sum, f) => sum + f.weightKg, 0);
  next.fermentables = (next.fermentables ?? []).map((f) =>
    f.kind === 'grain'
      ? { ...f, pct: next.totalGristKg > 0 ? (f.weightKg / next.totalGristKg) * 100 : 0 }
      : f
  );
  if (p && next.totalGristKg > 0 && next.mash)
    next.mash.ratioLPerKg = p.mashWaterL / next.totalGristKg;
  if (p && rig) {
    next.preBoilL =
      Math.round(
        (p.mashWaterL + p.spargeWaterL - next.totalGristKg * rig.grainAbsorptionLPerKg) * 10
      ) / 10;
    next.preBoilHotL = Math.round((next.preBoilL / (1 - rig.coolingShrinkagePct / 100)) * 10) / 10;
  }
  if (p?.sourceSnapshot) {
    const mash = dilute(p.sourceSnapshot, p.diRatioPct),
      sparge = dilute(p.sourceSnapshot, p.spargeDiRatioPct ?? p.diRatioPct);
    const treated = (
      source: typeof mash,
      salts: Partial<Record<SaltId, number>>,
      litres: number,
      dose: number
    ) => {
      const ions = addIons(source, ionsFromSalts(salts, litres));
      return p.acid ? ionsAfterAcid(ions, dose, p.acid.id, litres) : ions;
    };
    p.startIons = averageWater(mash, sparge, p.mashWaterL, p.spargeWaterL);
    p.wortIons = averageWater(
      treated(mash, p.mash ?? {}, p.mashWaterL, p.acid?.mash ?? 0),
      treated(sparge, p.sparge ?? {}, p.spargeWaterL, p.acid?.sparge ?? 0),
      p.mashWaterL,
      p.spargeWaterL
    );
    p.treatmentVersion = 2;
  } else if (p) {
    delete p.startIons;
    delete p.wortIons;
  }
  return next;
}
