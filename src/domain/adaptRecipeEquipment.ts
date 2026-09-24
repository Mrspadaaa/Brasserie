import { Recipe, BrewhouseProfile } from '../types';
import { BrewingMath, kettleHopGrams } from '../services/brewingMath';
import { equipmentCheck, defaultBrewVolume } from './brewEquipment';
import { resizeWaterPlan } from './resizeWaterPlan';
import { fermenterRecommendation } from './fermenterPlanning';
import { snapshotBrewhouse } from './brewPreferences';
import { replanRecipeWater } from './recipeWater';

/** A deliberate recipe resize. Recorded batches and their snapshots are never touched. */
export function adaptRecipeEquipment(
  recipe: Recipe,
  profile: BrewhouseProfile,
  targetL = defaultBrewVolume(profile)
): Recipe {
  if (!(targetL > 0) || !Number.isFinite(targetL) || !(recipe.volumeL > 0))
    throw Error('Volume de recette invalide.');
  const ratio = targetL / recipe.volumeL;
  const previousEfficiency = recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct ?? profile.efficiencyPct;
  if (!(profile.efficiencyPct > 0) || !Number.isFinite(profile.efficiencyPct))
    throw Error('Renseigne un rendement positif pour le matériel choisi.');
  const grainRatio = ratio * previousEfficiency / profile.efficiencyPct;
  const round = (n: number, d = 3) => Number(n.toFixed(d));
  const fermentables = (
    recipe.fermentables ??
    (recipe.malts ?? []).map((f) => ({ ...f, kind: 'grain' as const, use: 'empatage' as const }))
  ).map((f) => ({ ...f, weightKg: round(f.weightKg * (f.kind === 'grain' ? grainRatio : ratio)) }));
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
    kettleHopGrams(hops),
    recipe.installation?.manualWaterSplit && recipe.waterPlan ? {
      manualWaterSplit: {
        mashWaterL: round(recipe.waterPlan.mashWaterL * ratio, 1),
        spargeWaterL: round(recipe.waterPlan.spargeWaterL * ratio, 1)
      }
    } : undefined
  );
  if (water.planningStatus === 'invalid') throw Error(water.issues.join(' '));
  const recommendation = fermenterRecommendation(recipe, profile.equipment);
  const check = equipmentCheck(profile.equipment, {
    volumeL: targetL,
    grainKg: grain,
    mashL: water.mashWaterL,
    spargeL: water.spargeWaterL,
    preBoilHotL: water.preBoilHotL,
    preferences: profile.preferences,
    fermenterHeadspacePct: recommendation?.headspacePct
  });
  if (
    check &&
    (check.mashTooFull || check.boilTooFull || check.fermenterTooFull || check.spargeTooMuch || !check.thinEnough)
  )
    throw Error(
      'Ce volume ne tient pas dans le matériel. Réduis la cible ou ajuste les capacités réelles.'
    );
  const plan = resizeWaterPlan(recipe, water, ratio);
  const adapted: Recipe = {
    ...recipe,
    volumeL: targetL,
    brewhouse: snapshotBrewhouse(rig),
    efficiencyPct: profile.efficiencyPct,
    installation: { ...recipe.installation, manualWaterSplit: !!recipe.installation?.manualWaterSplit, spargeExceptionAccepted: false },
    notesCreation: [
      recipe.notesCreation,
      `Matériel : ${recipe.volumeL} → ${targetL} L ; les quantités structurées sont recalculées. Vérifier les volumes des notes libres de la source.`
      , ...(previousEfficiency !== profile.efficiencyPct ? [`Rendement adopté : ${previousEfficiency} → ${profile.efficiencyPct} % ; grains ajustés pour conserver l’extrait prévu.`] : [])
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
            recipe.yeast.qty == null || ratio === 1
              ? recipe.yeast.qty
              : recipe.yeast.unit === 'sachet'
                ? Math.max(1, Math.ceil(recipe.yeast.qty * ratio))
                : round(recipe.yeast.qty * ratio, 6)
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
            profile.equipment?.heatingRateCPerMin ?? recipe.mash.heatingRateCPerMin
        }
      : undefined
  };
  // Automatic acid depends on the grist and the new split, not only litres.
  if (adapted.waterPlan?.autoTreatment) adapted.waterPlan = replanRecipeWater(adapted).plan;
  return adapted;
}
