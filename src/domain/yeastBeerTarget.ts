import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { TrialRecipe } from './hopIndex/trials';
import type { YeastReference } from './yeastReferences';
import { projectYeastRecipe, yeastRecipeBoilOg, type YeastRecipeProjection } from './yeastProjection';
import { hotBitterness, type HotBitterness } from './hopBitterness';
import { resolveFermentationYeast } from './fermentationScenario';
import { fermentationStateKey } from './fermentationGuide';
import { applyYeastBeerTargetIntent, readYeastBeerTarget, type YeastRecipeDraft, type YeastRecipeChange } from './yeastRecipeDesign';

export { readYeastBeerTarget };
export interface YeastBeerTarget {
  modelVersion?: 'yeast-beer-target-1';
  abv?: HopRange; ibu?: HopRange;
  finish?: 'unspecified' | 'dry' | 'round' | 'sweet';
  accent?: 'none' | 'chocolate'; sparkling?: boolean; label?: string;
}
export interface YeastBeerVariation { fermentableScale: number; hotHopScale: number; attenuationPct?: number }
export type YeastBeerTargetStatus = 'unset' | 'unknown' | 'inside' | 'overlap' | 'outside';
export interface YeastBeerTargetMetrics { projection: YeastRecipeProjection; ibu: HotBitterness; boilOg: number | null }
export interface YeastBeerTargetPreview {
  current: YeastBeerTargetMetrics; variant: YeastBeerTargetMetrics; variation: YeastBeerVariation;
  changes: YeastRecipeChange[]; errors: string[]; warnings: string[]; basis: string[];
  targetStatus: { abv: YeastBeerTargetStatus; ibu: YeastBeerTargetStatus };
  baseKey: string;
}
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const format = (n: number, unit: string) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 4 })} ${unit}`;
const hot = (stage: string) => ['firstWort', 'boil', 'whirlpool'].includes(stage);
const neutral = (): YeastBeerVariation => ({ fermentableScale: 1, hotHopScale: 1 });
const point = (range: HopRange | null) => range && range.min === range.max ? range.min : null;
export const yeastBeerTargetStateKey = (recipe: TrialRecipe) => fermentationStateKey(recipe);
const status = (value: HopRange | null, target?: HopRange): YeastBeerTargetStatus => {
  if (!target) return 'unset';
  if (!value) return 'unknown';
  const epsilon = 1e-9 * Math.max(1, value.max, target.max);
  if (value.min >= target.min - epsilon && value.max <= target.max + epsilon) return 'inside';
  return value.max >= target.min - epsilon && value.min <= target.max + epsilon ? 'overlap' : 'outside';
};
function metrics(recipe: TrialRecipe, refs: YeastReference[]): YeastBeerTargetMetrics {
  const projection = projectYeastRecipe(recipe, { reference: resolveFermentationYeast(recipe, refs) });
  const boil = yeastRecipeBoilOg(recipe, projection);
  return { projection, boilOg: boil.og, ibu: hotBitterness(recipe.hops, recipe.volumeL, boil.og, recipe.boilMin) };
}
function variationErrors(recipe: TrialRecipe, variation: YeastBeerVariation): string[] {
  const errors: string[] = [];
  if (!finite(variation.fermentableScale) || variation.fermentableScale <= 0) errors.push('Facteur de fermentescibles positif et fini requis.');
  if (!finite(variation.hotHopScale) || variation.hotHopScale < 0) errors.push('Facteur de houblons à chaud positif ou nul et fini requis.');
  if (variation.attenuationPct !== undefined && (!finite(variation.attenuationPct) || variation.attenuationPct < 0 || variation.attenuationPct > 100)) errors.push('Hypothèse d’atténuation requise entre 0 et 100 %.');
  if (errors.length) return errors;
  if (variation.fermentableScale !== 1 && (!finite(recipe.volumeL) || recipe.volumeL <= 0 || recipe.fermentables.some(f => (f.kind ?? 'grain') === 'grain' && f.weightKg !== 0) && (!finite(recipe.efficiencyPct) || recipe.efficiencyPct <= 0 || recipe.efficiencyPct > 100))) errors.push('Volume et rendement d’extraction connus requis pour faire varier les fermentescibles.');
  if (variation.fermentableScale !== 1 && (!recipe.fermentables.some(f => finite(f.weightKg) && f.weightKg > 0) || recipe.fermentables.some(f => !finite(f.weightKg) || f.weightKg < 0 || !finite(f.weightKg * variation.fermentableScale)))) errors.push('Masses des fermentescibles à compléter avant de les multiplier.');
  if (variation.hotHopScale !== 1 && recipe.hops.some(h => h.stage !== 'dryHop' && (!hot(h.stage) || !finite(h.weightG) || h.weightG < 0 || !finite(h.weightG * variation.hotHopScale)))) errors.push('Masse et moment de chaque ajout à chaud requis avant de les multiplier.');
  if (recipe.nolo?.enabled && (variation.fermentableScale !== 1 || variation.hotHopScale !== 1 || variation.attenuationPct !== undefined)) errors.push('Variations NOLO : utiliser le bilan et les réglages dédiés.');
  return errors;
}
function variedRecipe<T extends TrialRecipe>(recipe: T, variation: YeastBeerVariation, current: YeastBeerTargetMetrics): T {
  return { ...recipe,
    ...(variation.fermentableScale !== 1 ? { fermentables: recipe.fermentables.map(f => ({ ...f, weightKg: f.weightKg * variation.fermentableScale })),
      totalGristKg: recipe.fermentables.filter(f => (f.kind ?? 'grain') === 'grain').reduce((sum, f) => sum + f.weightKg * variation.fermentableScale, 0),
      ogTarget: current.projection.og == null ? null : 1 + (current.projection.og - 1) * variation.fermentableScale } : {}),
    ...(variation.hotHopScale !== 1 ? { hops: recipe.hops.map(h => hot(h.stage) ? { ...h, weightG: h.weightG * variation.hotHopScale } : h) } : {}),
    ...(variation.attenuationPct !== undefined ? { yeast: { ...recipe.yeast, attenuationPct: variation.attenuationPct, attenuationBasis: 'recipe' } } : {}) };
}
function targetLabel(target: YeastBeerTarget | undefined): string {
  if (!target) return 'Aucune cible';
  const finish = { unspecified: '', dry: 'Finale sèche', round: 'Finale ronde', sweet: 'Finale sucrée' };
  return [target.label, target.abv && `${format(target.abv.min, 'à')} ${format(target.abv.max, '% vol')}`, target.ibu && `${format(target.ibu.min, 'à')} ${format(target.ibu.max, 'IBU')}`,
    target.finish && finish[target.finish], target.accent === 'chocolate' && 'Accent chocolat', target.sparkling && 'Effervescente'].filter(Boolean).join(' · ') || 'Intention libre';
}

/** The draft supplies intent only. Uncommitted programme, dose or culture edits
 * are not silently included in this independent variation. */
export function previewYeastBeerTarget(recipe: TrialRecipe, draft: YeastRecipeDraft, refs: YeastReference[], variation: YeastBeerVariation = neutral()): YeastBeerTargetPreview {
  const target = readYeastBeerTarget(draft.beerTarget), current = metrics(recipe, refs), errors = variationErrors(recipe, variation);
  if (draft.beerTarget !== undefined && !target) errors.push('Cible invalide : minimum, maximum et unités à vérifier.');
  if (!errors.length && variation.fermentableScale !== 1 && (!finite(current.projection.og) || current.projection.og <= 1)) errors.push('DI équivalente connue requise pour conserver l’extraction en faisant varier les masses.');
  const unchanged = variation.fermentableScale === 1 && variation.hotHopScale === 1 && variation.attenuationPct === undefined;
  const next = errors.length || unchanged ? recipe : variedRecipe(recipe, variation, current);
  const variant = next === recipe ? current : metrics(next, refs);
  if (!errors.length && variation.fermentableScale !== 1 && (!finite(variant.projection.og) || variant.projection.og <= 1 || variant.projection.og > 1.25)) errors.push('La variation sort de la plage de DI du modèle (1,000–1,250 SG).');
  const changes: YeastRecipeChange[] = [];
  const add = (id: string, label: string, before: string, after: string) => { if (before !== after) changes.push({ id, label, before, after }); };
  if (!errors.length) {
    recipe.fermentables.forEach((f, i) => { if (variation.fermentableScale !== 1) add(`beer-fermentable-${i}`, f.name, format(f.weightKg, 'kg'), format(next.fermentables[i].weightKg, 'kg')); });
    recipe.hops.forEach((h, i) => { if (variation.hotHopScale !== 1 && hot(h.stage)) add(`beer-hop-${i}`, h.name, format(h.weightG, 'g'), format(next.hops[i].weightG, 'g')); });
    if (variation.attenuationPct !== undefined) add('beer-attenuation', 'Hypothèse d’atténuation', finite(recipe.yeast.attenuationPct) ? format(recipe.yeast.attenuationPct, '%') : 'Non choisie', format(variation.attenuationPct, '%'));
    add('beer-target', 'Bière visée', targetLabel(recipe.yeastDesign?.beerTarget), targetLabel(target));
  }
  const basis = ['Échelles de masse à volume et rendement constants ; proportions des fermentescibles conservées. Aucun ajustement de température n’est converti en DF ou en douceur.',
    ...yeastRecipeBoilOg(next, variant.projection).reasons];
  if (!errors.length && variation.fermentableScale !== 1) basis.push(`DI équivalente estimée : points de DI × ${format(variation.fermentableScale, '').trim()}. Ce facteur ne prédit pas un changement réel de rendement.`);
  const warnings = [...variant.projection.warnings, ...variant.ibu.missing];
  if (target?.finish && target.finish !== 'unspecified') warnings.push('Finale souhaitée : la DF seule ne prédit ni douceur perçue ni corps.');
  if (target?.accent === 'chocolate') warnings.push('Accent chocolat : vérifier les ingrédients et leur documentation ; aucun score n’est déduit de la couleur.');
  if (target?.sparkling) warnings.push('Effervescence : intention conservée, aucun sucre de refermentation ni niveau de CO₂ ajouté automatiquement.');
  return { current, variant, variation: { ...variation }, changes, errors: [...new Set(errors)], warnings: [...new Set(warnings)], basis,
    targetStatus: { abv: status(variant.projection.abv.range, target?.abv), ibu: status(variant.ibu.total == null ? null : { min: variant.ibu.total, max: variant.ibu.total }, target?.ibu) },
    baseKey: yeastBeerTargetStateKey(recipe) };
}

/** Fit complete numeric ranges where the existing model is determinate. It
 * does not choose attenuation, create ingredients or infer numbers from taste. */
export function prepareYeastBeerVariation(recipe: TrialRecipe, draft: YeastRecipeDraft, refs: YeastReference[], seed: YeastBeerVariation = neutral()): { variation: YeastBeerVariation; preview: YeastBeerTargetPreview; reasons: string[] } {
  const variation = { ...seed }, reasons: string[] = [], target = readYeastBeerTarget(draft.beerTarget);
  let preview = previewYeastBeerTarget(recipe, draft, refs, variation);
  if (preview.errors.length) return { variation, preview, reasons: [...preview.errors] };
  if (target?.abv && preview.targetStatus.abv !== 'inside') {
    const range = preview.variant.projection.abv.range;
    if (!range) reasons.push('Alcool non déterminable : préciser les données et l’hypothèse avant de rapprocher cette cible.');
    else if (range.min <= 0 || target.abv.max <= 0) reasons.push('Un facteur de masse ne détermine pas cette cible d’alcool ; aucune atténuation ni voie NOLO n’est inventée.');
    else {
      const lower = target.abv.min / range.min, upper = target.abv.max / range.max;
      if (lower > upper) reasons.push('La plage d’alcool calculée est trop large pour cette cible ; choisir une hypothèse explicite pour réduire l’incertitude.');
      else {
        const factor = Math.max(lower, Math.min(1, upper));
        if (factor > 0) variation.fermentableScale *= factor;
      }
    }
  }
  preview = previewYeastBeerTarget(recipe, draft, refs, variation);
  if (!preview.errors.length && target?.ibu && preview.targetStatus.ibu !== 'inside') {
    const ibu = preview.variant.ibu.total;
    if (ibu == null) reasons.push('IBU inconnus : compléter alpha du lot, masse et moment d’ajout avant de rapprocher cette cible.');
    else if (ibu <= 0) reasons.push('Aucun apport amer à chaud calculable à multiplier ; préparer les ajouts dans Houblons.');
    else variation.hotHopScale *= Math.max(target.ibu.min / ibu, Math.min(1, target.ibu.max / ibu));
  }
  preview = previewYeastBeerTarget(recipe, draft, refs, variation);
  if (!target?.abv && !target?.ibu) reasons.push('Aucune plage numérique choisie : les intentions de goût ne déclenchent aucun réglage chiffré.');
  if (preview.errors.length) reasons.push(...preview.errors);
  if (variation.fermentableScale !== seed.fermentableScale) reasons.push('Fermentescibles ajustés ensemble ; volume, rendement et proportions conservés.');
  if (variation.hotHopScale !== seed.hotHopScale) reasons.push('Houblons à chaud ajustés après recalcul de la DI d’ébullition ; houblons à cru conservés.');
  return { variation, preview, reasons: [...new Set(reasons)] };
}

/** Atomic commit boundary. Save intent alone without rewriting legacy metrics. */
export function applyYeastBeerVariation<T extends TrialRecipe>(recipe: T, draft: YeastRecipeDraft, refs: YeastReference[], variation: YeastBeerVariation = neutral(), expectedBaseKey?: string): T {
  if (expectedBaseKey !== undefined && expectedBaseKey !== yeastBeerTargetStateKey(recipe)) throw Error('La recette a changé : recalculer la variante avant de l’appliquer.');
  const preview = previewYeastBeerTarget(recipe, draft, refs, variation);
  if (preview.errors.length) throw Error(preview.errors[0]);
  let next = variedRecipe(recipe, variation, preview.current);
  if (variation.fermentableScale !== 1 || variation.attenuationPct !== undefined) next = { ...next, fgTarget: point(preview.variant.projection.fg.range), abvTarget: point(preview.variant.projection.abv.range) };
  if (variation.fermentableScale !== 1 || variation.hotHopScale !== 1) next = { ...next, ibuTarget: preview.variant.ibu.total == null ? null : Math.round(preview.variant.ibu.total),
    hopPredictionIds: undefined, hopMatrixId: undefined, hopTrialId: undefined };
  return applyYeastBeerTargetIntent(next, draft.beerTarget, refs);
}
