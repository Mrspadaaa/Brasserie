import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopTriplet, HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { TrialRecipe } from './trials';
import { findRecipeHopMatches, findRecipeYeastMatches } from './recipeGuide';
import { hopTripletsOfRecipe } from './engine';

/** Read-time scenario only. The UI names every proposed identity/phase, and only
 * an explicit Apply action may copy it into a recipe. AA labels are never COAs. */
export function recipeHopScenario(recipe: TrialRecipe, index: number, varieties: HopVariety[], yeasts: HopYeast[]) {
  const hop = recipe.hops[index];
  const original = hopTripletsOfRecipe(recipe)[index];
  if (!hop || !original) return null;
  const proposed: string[] = [];
  const triplet: HopTriplet = { ...original };
  if (!triplet.varietyId) {
    const matches = findRecipeHopMatches(hop.name, varieties);
    // Prefer a generic manufacturer reference over a particular experimental lot.
    const match = matches.find(m => m.item.id.startsWith('hopsteiner-')) ?? (matches.length === 1 ? matches[0] : undefined);
    if (match) { triplet.varietyId = match.item.id; proposed.push(`Référence proposée pour « ${hop.name} » : ${match.item.name} (${match.item.descriptions[0]?.source.author ?? 'catalogue'}).`); }
  }
  if (!triplet.yeastId) {
    const matches = findRecipeYeastMatches(recipe.yeast?.name ?? '', yeasts);
    if (matches.length === 1) { triplet.yeastId = matches[0].item.id; proposed.push(`Souche reconnue pour la simulation : ${matches[0].item.name}.`); }
  }
  if (!triplet.timing && hop.stage === 'dryHop') {
    triplet.timing = 'postFermentation';
    proposed.push('Phase à cru non renseignée : scénario après fermentation. Compare aussi « Fermentation active » avant de l’appliquer.');
  }
  return { triplet, proposed };
}

export function applyHopScenario<T extends TrialRecipe>(recipe: T, index: number, triplet: HopTriplet, variety: HopVariety, yeast: HopYeast): T {
  if (!(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL) || triplet.doseGL === null || !Number.isFinite(triplet.doseGL) || triplet.doseGL < 0) throw Error('Renseigne le volume et la dose avant d’appliquer ce scénario.');
  if (!triplet.timing || triplet.varietyId !== variety.id || triplet.yeastId !== yeast.id) throw Error('Choisis le houblon, la levure et le moment d’ajout.');
  if (index < 0 || index > recipe.hops.length || !Number.isInteger(index)) throw Error('Ajout introuvable.');
  const previous = recipe.hops[index];
  const sameHop = previous && (previous.hopVarietyId ? previous.hopVarietyId === variety.id : findRecipeHopMatches(previous.name, [variety]).length === 1);
  const sameYeast = recipe.yeast?.hopIndexId ? recipe.yeast.hopIndexId === yeast.id : findRecipeYeastMatches(recipe.yeast?.name ?? '', [yeast]).length === 1;
  const dry = ['fermentation', 'postFermentation'].includes(triplet.timing);
  const weightG = triplet.doseGL * recipe.volumeL;
  if (!Number.isFinite(weightG)) throw Error('Dose ou volume trop élevé.');
  const hops = [...recipe.hops];
  hops[index] = {
    name: sameHop ? previous.name : variety.name, alpha: sameHop ? previous.alpha : 0, weightG,
    hopVarietyId: variety.id, hopLotId: triplet.lotId ?? undefined,
    stage: dry ? 'dryHop' : triplet.timing as 'firstWort' | 'boil' | 'whirlpool',
    aromaTiming: dry ? triplet.timing : undefined,
    aromaContactHours: triplet.contactHours ?? undefined, aromaTemperatureC: triplet.temperatureC ?? undefined,
    timeMin: !dry && triplet.contactHours !== null ? triplet.contactHours * 60 : undefined,
    tempC: triplet.timing === 'whirlpool' ? triplet.temperatureC ?? undefined : undefined,
    dayOffset: dry && previous?.stage === 'dryHop' ? previous.dayOffset : undefined
  };
  const form = yeast.form ?? recipe.yeast.form;
  return { ...recipe, hops, hopMatrixId: undefined, hopPredictionIds: undefined, yeast: sameYeast ? { ...recipe.yeast, hopIndexId: yeast.id } : {
    name: yeast.name, hopIndexId: yeast.id, form, qty: 0, unit: form === 'liquide' ? 'flacon' : form === 'levain' ? 'L' : 'sachet'
  } };
}
