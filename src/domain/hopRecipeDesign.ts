import type { HopIngredient, HopStage } from '../types';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { TrialRecipe } from './hopIndex/trials';
import { hotBitterness } from './hopBitterness';
import { resolveBrewingStyle } from './brewingStyles';
import { inferYeastRecipeStyle, yeastRecipeHopSummary, type YeastStyleId } from './yeastRecipeDesign';
import { fermentationStateKey } from './fermentationGuide';
import { documentedHopNamesForStyle, hopNameHasStyleUsage, isIpaStyleName } from './hopIndex/styleSelection';

export const HOP_RECIPE_SOURCES = {
  tinseth: { label: 'Formule Tinseth · documentation Grainfather', url: 'https://help.grainfather.com/hc/en-us/articles/360014527537-Calculation-IBU' },
  weissbier: { label: 'BJCP 2021 · Weissbier', url: 'https://styles.bjcp.org/bjcp-2021-beer/10/10a-weissbier' },
  pils: { label: 'BJCP 2021 · German Pils', url: 'https://styles.bjcp.org/bjcp-2021-beer/5/5d-german-pils' },
  ipa: { label: 'BJCP 2021 · American IPA', url: 'https://styles.bjcp.org/bjcp-2021-beer/21/21a-american-ipa' },
  hazy: { label: 'BJCP 2021 · Hazy IPA', url: 'https://styles.bjcp.org/bjcp-2021-beer/21/21c-hazy-ipa' },
};

/** Editorial usage families, never a taxonomy of molecules or an exclusive permitted list. */
export const HOP_STYLE_ROLES: Record<YeastStyleId | 'stout-porter' | 'kolsch-alt' | 'sour', { role: string; examples: string[] }> = {
  weissbier: { role: 'Amertume en soutien. Banane et girofle se travaillent avec la levure et le procédé.', examples: ['Hallertauer Mittelfrüh', 'Tettnanger', 'Spalter Select', 'Hersbrucker'] },
  lager: { role: 'Construire une amertume nette ; doser la finition florale, herbacée ou épicée selon la lager précise.', examples: ['Saaz', 'Hallertauer Mittelfrüh', 'Tettnanger', 'Spalter Select', 'Perle', 'Magnum'] },
  'hazy-ipa': { role: 'Arômes de houblon et esters se complètent. Comparer les apports tardifs et à cru, puis leur phase de fermentation.', examples: documentedHopNamesForStyle('Hazy IPA') },
  'clean-ale': { role: 'Séparer l’amertume structurante de la finition aromatique ; choisir une fermentation qui laisse lire le houblon.', examples: documentedHopNamesForStyle('American IPA') },
  'english-ale': { role: 'Accorder le houblon au malt et aux esters anglais, sans confondre intensité et quantité.', examples: ['East Kent Goldings', 'Fuggle', 'Challenger', 'Target'] },
  witbier: { role: 'Laisser la place aux phénols de fermentation et aux épices éventuelles. Le houblon apporte le soutien amer.', examples: ['Saaz', 'Hallertauer Mittelfrüh', 'Styrian Golding', 'Tettnanger'] },
  'american-wheat': { role: 'Le blé américain peut mettre le houblon en avant avec une fermentation discrète ; ne pas lui appliquer le profil banane–girofle allemand.', examples: ['Cascade', 'Centennial', 'Amarillo', 'Hallertauer Mittelfrüh'] },
  saison: { role: 'Comparer la finale sèche et épicée de la levure au houblonnage ; l’amertume calculée ne décrit pas à elle seule l’équilibre.', examples: ['Saaz', 'Styrian Golding', 'East Kent Goldings', 'Hallertauer Mittelfrüh'] },
  'belgian-ale': { role: 'Mettre en balance fermentation, malt et amertume selon le style belge précis.', examples: ['Saaz', 'Styrian Golding', 'Hallertauer Mittelfrüh', 'Magnum'] },
  'stout-porter': { role: 'Équilibrer la torréfaction et l’amertume. L’expression houblonnée dépend de la variante exacte.', examples: [] },
  'kolsch-alt': { role: 'Situer le houblon face au malt et à la fermentation ; Kölsch et Altbier demandent des équilibres distincts.', examples: [] },
  sour: { role: 'Vérifier la tolérance aux houblons de la culture acidifiante ; amertume et houblonnage à cru dépendent du procédé, sans seuil universel.', examples: [] },
  unknown: { role: 'Précise le style dans Identité pour situer le rôle des houblons. Les calculs restent disponibles.', examples: [] },
};
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const positive = (v: unknown): v is number => finite(v) && v > 0;
const fold = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const aliases: Record<string, string[]> = {
  hallertauermittelfruh: ['hallertaumittelfruh', 'hallertaumittelfrueh', 'hallertauermittelfrueh', 'mittelfruh'],
  eastkentgoldings: ['eastkentgolding', 'ekg'], fuggle: ['fuggles'], styriangolding: ['styriangoldings'],
  spalterselect: ['spaltselect'], columbus: ['ctz', 'columbustomahawkzeus'],
  saaz: ['saazer'], magnum: ['hallertauermagnum'], hersbrucker: ['hersbruckerspat'],
};
export function hopMatchesName(name: string, expected: string, otherNames: string[] = []): boolean {
  const expectedKeys = [fold(expected), ...(aliases[fold(expected)] ?? [])];
  return [name, ...otherNames].some(value => expectedKeys.includes(fold(value)));
}
export function hopFitsStyle(name: string, family: YeastStyleId, otherNames: string[] = [], styleName?: string): boolean {
  if (styleName && isIpaStyleName(styleName))
    return hopNameHasStyleUsage(name, styleName, otherNames);
  if (family === 'hazy-ipa' || family === 'clean-ale')
    return hopNameHasStyleUsage(name, family === 'hazy-ipa' ? 'Hazy IPA' : 'American IPA', otherNames);
  return HOP_STYLE_ROLES[family].examples.some(example => hopMatchesName(name, example, otherNames));
}
export function hopRecipeStyle(recipe: TrialRecipe) {
  // Older brew-day snapshots may omit the free-text style.
  const style = resolveBrewingStyle(recipe.style ?? '', recipe.styleRef);
  // A resolved guide identity can be an opaque ID (e.g. BA); use its actual name.
  const family = inferYeastRecipeStyle(style ? { ...recipe, styleRef: undefined, style: style.name } : recipe);
  return { family, ...HOP_STYLE_ROLES[family], name: style?.name ?? recipe.style, ibu: style?.stats.ibu, source: style?.source, edition: style?.edition };
}
export const hopRecipeKey = (recipe: TrialRecipe) => fermentationStateKey({ hops: recipe.hops, volumeL: recipe.volumeL, ogTarget: recipe.ogTarget,
  boilMin: recipe.boilMin, style: recipe.style, styleRef: recipe.styleRef, yeast: recipe.yeast, fermentation: recipe.fermentation, nolo: recipe.nolo });

export function analyseHopRecipe(recipe: TrialRecipe) {
  const style = hopRecipeStyle(recipe), hot = hotBitterness(recipe.hops, recipe.volumeL, recipe.ogTarget, recipe.boilMin);
  const dry = yeastRecipeHopSummary(recipe);
  const phases = (['firstWort', 'boil', 'whirlpool', 'dryHop'] as const).map(stage => {
    const rows = recipe.hops.filter(h => h.stage === stage);
    const grams = rows.every(h => finite(h.weightG) && h.weightG >= 0) ? rows.reduce((sum, h) => sum + h.weightG, 0) : undefined;
    return { stage, grams, doseGL: grams !== undefined && positive(recipe.volumeL) ? grams / recipe.volumeL : undefined, count: rows.length };
  });
  const warnings: string[] = [];
  if (hot.total != null && style.ibu && hot.total > style.ibu.max) warnings.push(`L’amertume calculée dépasse le repère ${style.name}. Compare la dose de l’ajout amer.`);
  if (style.family === 'weissbier' && (dry.additions.length || recipe.hops.some(h => (h.stage === 'whirlpool' || h.stage === 'boil' && (h.timeMin ?? Infinity) <= 15) && h.weightG > 0)))
    warnings.push('Une finition houblonnée peut prendre la place de la banane et du girofle. Compare un essai plus discret avant d’augmenter les doses.');
  if (dry.additions.length) {
    warnings.push('Après le dernier ajout à cru, contrôler la stabilité de densité et le diacétyle avant refroidissement et conditionnement : un hop creep peut relancer la fermentation.');
    if (dry.unknownCount) warnings.push('Phase du dry hop à préciser : un jour prévu ne permet pas de savoir si la fermentation sera encore active.');
    if (dry.additions.some(h => h.contactHours === undefined || h.temperatureC === undefined)) warnings.push('Précise température et durée de contact à cru pour rendre l’essai reproductible.');
  }
  if (recipe.nolo?.enabled && dry.additions.length) warnings.push('NOLO : le houblonnage à cru peut changer l’alcool final. Revenir au bilan NOLO et vérifier après les ajouts.');
  return { style, hot, dry, phases, warnings };
}

export type HopAdjustmentMode = 'ibu' | 'move' | 'replace' | 'dryHop';
export interface HopRecipeAdjustment {
  index: number; mode: HopAdjustmentMode; name: string; varietyId?: string; alpha?: number;
  weightG?: number; targetIbu?: number; stage: HopStage; timeMin?: number; tempC?: number;
  keepIbu: boolean; doseGL?: number; phase?: 'fermentation' | 'postFermentation'; contactHours?: number; dayOffset?: number;
  originalForm?: 'pelletT90' | 'cone';
  replacementForm?: 'pelletT90' | 'cone';
}
export function createHopRecipeAdjustment(recipe: TrialRecipe, index = recipe.hops.length ? 0 : -1, mode: HopAdjustmentMode = 'ibu'): HopRecipeAdjustment {
  const hop = recipe.hops[index], dry = mode === 'dryHop';
  return { index, mode, name: hop?.name ?? '', varietyId: hop?.hopVarietyId, alpha: positive(hop?.alpha) ? hop.alpha : undefined,
    weightG: hop?.weightG, targetIbu: undefined, keepIbu: mode === 'replace', stage: dry ? 'dryHop' : hop?.stage ?? 'boil',
    timeMin: hop?.timeMin ?? (hop ? undefined : recipe.boilMin), tempC: hop?.aromaTemperatureC ?? hop?.tempC,
    doseGL: hop && positive(recipe.volumeL) && finite(hop.weightG) ? hop.weightG / recipe.volumeL : undefined,
    phase: hop?.aromaTiming === 'fermentation' || hop?.aromaTiming === 'postFermentation' ? hop.aromaTiming : undefined,
    contactHours: hop?.aromaContactHours, dayOffset: hop?.dayOffset };
}
export interface HopRecipeAdjustmentResult {
  errors: string[]; notes: string[]; nextHop?: HopIngredient; beforeIbu: number | null; afterIbu: number | null;
  beforeGrams?: number; afterGrams?: number; afterDryGL?: number; changed: boolean;
}

/** Pure preview. The one-gram response uses the same current Tinseth convention as the recipe. */
export function evaluateHopRecipeAdjustment(recipe: TrialRecipe, draft: HopRecipeAdjustment, varieties: HopVariety[] = []): HopRecipeAdjustmentResult {
  const analysis = analyseHopRecipe(recipe), original = recipe.hops[draft.index], errors: string[] = [], notes: string[] = [];
  const result: HopRecipeAdjustmentResult = { errors, notes, beforeIbu: analysis.hot.total, afterIbu: null, beforeGrams: original?.weightG, changed: false };
  if (!Number.isInteger(draft.index) || draft.index < -1 || draft.index >= recipe.hops.length) errors.push('L’ajout sélectionné n’existe plus. Reprends la recette actuelle.');
  if (!['ibu', 'move', 'replace', 'dryHop'].includes(draft.mode)) errors.push('Choisis un outil de houblonnage.');
  if (!draft.name.trim()) errors.push('Choisis un houblon pour le scénario.');
  if (!positive(recipe.volumeL)) errors.push('Renseigne un volume de bière positif dans Identité.');
  const changedReference = original && (draft.name !== original.name || draft.varietyId !== original.hopVarietyId);
  const reference = draft.varietyId ? varieties.find(v => v.id === draft.varietyId) : undefined;
  if (draft.varietyId && (!reference || reference.archived)) errors.push('La référence de houblon est indisponible. Choisis une référence actuelle.');
  const sourceReference = original?.hopVarietyId && varieties.find(v => v.id === original.hopVarietyId);
  if (draft.mode === 'replace' && (!original || original.stage !== 'boil')) errors.push('Le remplacement à amertume conservée concerne un ajout d’ébullition. Pour le dry hop, comparer les doses.');
  const originalForm = sourceReference && sourceReference.form !== 'unknown' ? sourceReference.form : draft.originalForm;
  const replacementForm = reference?.form === 'unknown' ? draft.replacementForm : reference?.form;
  if (draft.mode === 'replace' && (!reference || !originalForm || replacementForm !== originalForm || !['pelletT90', 'cone'].includes(replacementForm ?? '')))
    errors.push('Identifie les deux produits de même forme (T90 ou cônes). Un extrait ou un concentré ne se convertit pas à partir des seuls alpha.');
  const stage = draft.mode === 'dryHop' ? 'dryHop' : draft.stage;
  if (!['firstWort', 'boil', 'whirlpool', 'dryHop'].includes(stage)) errors.push('Choisis un moment d’ajout.');
  const next: HopIngredient = { ...original, name: draft.name.trim(), weightG: draft.weightG ?? NaN, alpha: draft.alpha ?? 0, stage,
    hopVarietyId: draft.varietyId,
    ...(changedReference || original && draft.alpha !== original.alpha ? { hopLotId: undefined } : {}),
    ...(changedReference ? { stockItemRef: undefined } : {}),
    timeMin: stage === 'boil' || stage === 'whirlpool' ? draft.timeMin : undefined,
    tempC: stage === 'whirlpool' ? draft.tempC : undefined,
    dayOffset: stage === 'dryHop' ? draft.dayOffset : undefined,
    aromaTiming: stage === 'dryHop' ? draft.phase : undefined,
    aromaContactHours: stage === 'dryHop' ? draft.contactHours : undefined,
    aromaTemperatureC: stage === 'dryHop' ? draft.tempC : undefined,
  };
  if (stage === 'dryHop') {
    if (draft.mode !== 'dryHop') errors.push('Utilise l’outil Dose à cru pour préparer cet ajout.');
    if (!positive(draft.doseGL)) errors.push('Saisis une dose à cru positive en g/L.');
    next.weightG = (draft.doseGL ?? NaN) * recipe.volumeL;
    if (!['fermentation', 'postFermentation'].includes(draft.phase ?? '')) errors.push('Précise la phase biologique du dry hop.');
    if (!positive(draft.contactHours)) errors.push('Saisis la durée de contact à cru en heures.');
    if (!finite(draft.tempC) || draft.tempC < 0 || draft.tempC > 40) errors.push('Saisis la température de contact à cru entre 0 et 40 °C.');
    if (draft.dayOffset !== undefined && (!finite(draft.dayOffset) || draft.dayOffset < 0)) errors.push('Le jour indicatif doit être positif ou nul.');
    notes.push(draft.phase === 'fermentation' ? 'Déclencher sur une fermentation active constatée. La biotransformation dépend du couple souche–houblon ; aucun bonus aromatique automatique.' : 'Déclencher après la phase principale constatée ; limiter l’oxygène à l’ajout. Une reprise de fermentation reste possible.');
    notes.push('Recontrôler densité stable et diacétyle après le dernier ajout avant de refroidir ou conditionner. Plus de g/L ne garantit pas plus d’arôme.');
  } else {
    if (reference && !['unknown', 'pelletT90', 'cone'].includes(reference.form)) errors.push('Ce produit concentré demande son propre rendement : la conversion Tinseth standard n’est pas applicable.');
    const perGram = hotBitterness([{ ...next, weightG: 1 }], recipe.volumeL, recipe.ogTarget, recipe.boilMin);
    errors.push(...perGram.missing);
    const solve = draft.mode === 'ibu' || draft.mode === 'replace' || draft.keepIbu;
    if (solve) {
      const others = hotBitterness(recipe.hops.filter((_, i) => i !== draft.index), recipe.volumeL, recipe.ogTarget, recipe.boilMin);
      const target = draft.mode === 'ibu' ? draft.targetIbu : analysis.hot.total;
      if (!finite(target) || target < 0) errors.push(draft.mode === 'ibu' ? 'Saisis la cible totale d’IBU à chaud.' : 'L’amertume actuelle est inconnue : complète les alpha et les conditions des ajouts.');
      errors.push(...others.missing);
      if (finite(target) && others.total !== null && perGram.total !== null) {
        const needed = target - others.total;
        if (needed < -1e-8) errors.push('Les autres ajouts dépassent déjà la cible. Choisis un autre ajout ou réduis-les d’abord.');
        else if (needed > 1e-8 && perGram.total <= 0) errors.push('À ce moment, le modèle n’extrait aucune amertume. Augmente le contact ou choisis un ajout amer.');
        else next.weightG = needed <= 1e-8 ? 0 : needed / perGram.total;
      }
    }
    if (stage === 'whirlpool' || stage === 'firstWort') notes.push('Premier moût et whirlpool : facteurs conventionnels de l’application. Le refroidissement réel n’est pas modélisé ; vérifier sur tes brassins.');
    if (draft.mode === 'move') notes.push('Un ajout plus tardif change l’exposition à la chaleur. Les arômes retenus dépendent de la variété et du procédé ; le déplacement ne calcule pas un gain de goût.');
    if (draft.mode === 'replace') notes.push('Même amertume calculée et même forme de produit. Ce remplacement ne garantit ni le même arôme ni la même qualité d’amertume.');
  }
  if (!finite(next.weightG) || next.weightG < 0) errors.push('La masse du scénario ne peut pas être calculée. Complète les données manquantes.');
  if (errors.length) { result.errors = [...new Set(errors)]; return result; }
  const hops = draft.index === -1 ? [...recipe.hops, next] : recipe.hops.map((h, i) => i === draft.index ? next : h);
  result.nextHop = next;
  result.afterGrams = next.weightG;
  result.afterIbu = hotBitterness(hops, recipe.volumeL, recipe.ogTarget, recipe.boilMin).total;
  result.afterDryGL = yeastRecipeHopSummary({ ...recipe, hops }).doseGL;
  result.changed = fermentationStateKey(hops) !== fermentationStateKey(recipe.hops);
  if (next.weightG / recipe.volumeL > 20) notes.push('Dose très élevée pour un seul ajout : vérifier pertes de bière, filtration et intérêt sensoriel par un essai fractionné. Ce repère de vigilance est éditorial.');
  return result;
}

export function applyHopRecipeAdjustment<T extends TrialRecipe>(recipe: T, draft: HopRecipeAdjustment, expectedKey: string, varieties: HopVariety[] = []): T {
  if (hopRecipeKey(recipe) !== expectedKey) throw Error('La recette a changé. Reprends ses données avant d’appliquer le scénario.');
  const result = evaluateHopRecipeAdjustment(recipe, draft, varieties);
  if (result.errors.length || !result.nextHop) throw Error(result.errors[0] ?? 'Scénario incomplet.');
  if (!result.changed) return recipe;
  return { ...recipe, hops: draft.index === -1 ? [...recipe.hops, result.nextHop] : recipe.hops.map((h, i) => i === draft.index ? result.nextHop! : h),
    hopMatrixId: undefined, hopTrialId: undefined, hopPredictionIds: undefined, hopSolverIntent: undefined };
}
