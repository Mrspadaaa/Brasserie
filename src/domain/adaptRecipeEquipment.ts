import { Recipe, BrewhouseProfile } from '../types';
import { BrewingMath, kettleHopGrams } from '../services/brewingMath';
import { equipmentCheck, defaultBrewVolume } from './brewEquipment';
import { averageWater, addIons, ionsFromSalts, ionsAfterAcid } from './water';

/** A deliberate recipe resize. Recorded batches and their snapshots are never touched. */
export function adaptRecipeEquipment(
  recipe: Recipe,
  profile: BrewhouseProfile,
  targetL = defaultBrewVolume(profile)
): Recipe {
  if (!(targetL > 0) || !Number.isFinite(targetL) || !(recipe.volumeL > 0))
    throw Error('Volume de recette invalide.');
  const ratio = targetL / recipe.volumeL;
  const round = (n: number, d = 3) => Number(n.toFixed(d));
  const fermentables = (
    recipe.fermentables ??
    (recipe.malts ?? []).map((f) => ({ ...f, kind: 'grain' as const, use: 'empatage' as const }))
  ).map((f) => ({ ...f, weightKg: round(f.weightKg * ratio) }));
  const grain = fermentables
    .filter((f) => f.kind === 'grain' && f.use === 'empatage')
    .reduce((s, f) => s + f.weightKg, 0);
  if (grain <= 0) throw Error('Renseigne le grain avant d’adapter cette recette tout grain.');
  const hops = (recipe.hops ?? []).map((h) => ({ ...h, weightG: round(h.weightG * ratio, 1) }));
  const rig = { ...profile, mashRatioLPerKg: recipe.mash?.ratioLPerKg ?? profile.mashRatioLPerKg };
  const water = BrewingMath.waterVolumes(
    grain,
    targetL,
    rig,
    recipe.mash?.spargeType ?? 'batch',
    recipe.boilMin ?? 60,
    kettleHopGrams(hops)
  );
  const check = equipmentCheck(profile.equipment, {
    volumeL: targetL,
    grainKg: grain,
    mashL: water.mashWaterL,
    spargeL: water.spargeWaterL,
    preBoilHotL: water.preBoilHotL
  });
  if (
    check &&
    (check.mashTooFull || check.boilTooFull || check.fermenterTooFull || !check.thinEnough)
  )
    throw Error(
      'Ce volume ne tient pas dans le matériel. Réduis la cible ou ajuste les capacités réelles.'
    );
  const plan = recipe.waterPlan ? structuredClone(recipe.waterPlan) : undefined;
  if (plan) {
    const m = plan.mashWaterL > 0 ? water.mashWaterL / plan.mashWaterL : ratio;
    const s = plan.spargeWaterL > 0 ? water.spargeWaterL / plan.spargeWaterL : ratio;
    plan.mash = Object.fromEntries(
      Object.entries(plan.mash).map(([k, v]) => [k, round(v! * m, 2)])
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
        ...(plan.acidOverride.mash != null ? { mash: round(plan.acidOverride.mash * m, 2) } : {}),
        ...(plan.acidOverride.sparge != null
          ? { sparge: round(plan.acidOverride.sparge * s, 2) }
          : {})
      };
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
  return {
    ...recipe,
    volumeL: targetL,
    brewhouse: structuredClone(rig),
    notesCreation: [
      recipe.notesCreation,
      `Matériel : ${recipe.volumeL} → ${targetL} L ; les quantités structurées sont recalculées. Vérifier les volumes des notes libres de la source.`
    ]
      .filter(Boolean)
      .join('\n'),
    fermentables,
    malts: recipe.malts ? fermentables.filter((f) => f.kind === 'grain') : undefined,
    totalGristKg: round(grain),
    hops,
    yeast: recipe.yeast
      ? {
          ...recipe.yeast,
          qty:
            recipe.yeast.unit === 'sachet'
              ? Math.max(1, Math.ceil(recipe.yeast.qty * ratio))
              : round(recipe.yeast.qty * ratio, 1)
        }
      : undefined,
    adjuncts: recipe.adjuncts?.map((a) => ({ ...a, amount: round(a.amount * ratio, 2) })),
    waterPlan: plan,
    preBoilL: water.preBoilVolumeL,
    preBoilHotL: water.preBoilHotL,
    mash: recipe.mash
      ? {
          ...recipe.mash,
          ratioLPerKg: grain > 0 ? water.mashWaterL / grain : undefined,
          heatingRateCPerMin:
            recipe.mash.heatingRateCPerMin ?? profile.equipment?.heatingRateCPerMin
        }
      : undefined
  };
}
