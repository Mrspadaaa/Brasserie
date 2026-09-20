import type { Recipe, SaltId } from '../types';
import { addIons, dilute, ionsFromSalts, ionsAfterAcid, averageWater } from './water';
import { projectYeastRecipe, yeastRecipeComputedOg, yeastRecipeBoilOg } from './yeastProjection';
import { hotBitterness } from './hopBitterness';
import { yeastReferences } from './yeastReferences';
import { resolveFermentationYeast } from './fermentationScenario';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

/** Refresh derived displays, keeping all physical doses exactly as approved. */
export function refreshCompanionRecipe(recipe: Recipe, options: { changedPaths?: string[]; knowledge?: HopKnowledge[] } = {}): Recipe {
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
  // The spent bed is a record of the first brew, not a fresh grist to absorb water again.
  if (next.nolo?.enabled && next.nolo.process === 'secondRunnings') {
    delete next.preBoilL;
    delete next.preBoilHotL;
    return next;
  }
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
  // Match the editor: retain supplied targets until their calculation inputs
  // change. Explicit target edits remain targets, never invented measurements.
  const paths = options.changedPaths ?? [], roots = paths.map(path => path.split('.')[0]);
  const ogChanged = roots.some(root => ['volumeL', 'fermentables', 'efficiencyPct'].includes(root));
  const ibuChanged = ogChanged || roots.some(root => ['hops', 'boilMin', 'ogTarget'].includes(root));
  const fermentationChanged = ibuChanged || roots.includes('yeast');
  if (!next.nolo?.enabled && (fermentationChanged || next.yeastDesign?.modelVersion === 'yeast-recipe-2')) {
    if (ogChanged && !paths.includes('ogTarget')) next.ogTarget = yeastRecipeComputedOg(next);
    const projection = projectYeastRecipe(next, { reference: resolveFermentationYeast(next, yeastReferences(options.knowledge)) });
    if (ibuChanged && !paths.includes('ibuTarget')) {
      const ibu = hotBitterness(next.hops, next.volumeL, yeastRecipeBoilOg(next, projection).og, next.boilMin).total;
      next.ibuTarget = ibu == null ? undefined : Math.round(ibu);
    }
    if (fermentationChanged || next.yeastDesign?.modelVersion === 'yeast-recipe-2') {
      if (!paths.includes('fgTarget')) next.fgTarget = projection.fg.range && projection.fg.range.min === projection.fg.range.max ? projection.fg.range.min : null;
      if (!paths.includes('abvTarget')) next.abvTarget = projection.abv.range && projection.abv.range.min === projection.abv.range.max ? projection.abv.range.min : null;
    }
  }
  return next;
}
