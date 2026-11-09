// Dose de la levure au choix (#132) : aujourd'hui, choisir une autre levure effaçait la dose (`delete next.yeast.qty`). Ici la dose se
// recalcule depuis yeastPitching.ts, pour la nouvelle levure et le volume de la recette. Aucune règle neuve : le produit, le moût
// estimé et le conseil sont ceux de `yeastPitching.ts` ; ce fichier les enchaîne.
//  - un seul produit documenté pour cette référence et cette forme : il est retenu (deux produits : aucun choix muet) ;
//  - le moût à ensemencer : la mesure déjà saisie si elle existe, sinon l'estimation de la recette (volume, OG) ;
//  - la dose n'est posée que si le conseil se réduit à un nombre de sachets ; une plage reste une plage (jamais son milieu) ;
//  - l'inconnu n'est jamais 0 : sans produit documenté, ni dose ni zéro.
import type { YeastSpec } from '../../types';
import type { YeastSupply } from '../../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import {
  applyYeastPitchingAdvice, estimatePitchingWort, evaluateYeastPitching, selectYeastProduct, type YeastPitchingAdvice,
} from '../../domain/yeastPitching';

/** Le produit exact de cette levure : le seul de sa référence et de sa forme, sinon aucun. */
function produitUnique(supply: YeastSupply, yeast: YeastSpec) {
  if (!yeast.hopIndexId) return undefined;
  const produits = supply.products.filter(p => p.referenceId === yeast.hopIndexId && (!yeast.form || p.form === yeast.form));
  return produits.length === 1 ? produits[0] : undefined;
}

/** La levure avec son produit et son moût, prête pour `evaluateYeastPitching`. Rien n'est écrit dans la recette. */
function preparer(recipe: TrialRecipe, supply: YeastSupply, mesure?: YeastSpec['pitching']): YeastSpec {
  let yeast: YeastSpec = { ...recipe.yeast };
  if (!yeast.pitching?.product) {
    const produit = produitUnique(supply, yeast);
    if (produit) yeast = selectYeastProduct(yeast, produit);
  }
  if (!yeast.pitching?.product) return yeast;
  const wort = mesure?.wort && mesure.wort.basis !== 'recipe-estimate' ? mesure.wort : estimatePitchingWort(recipe).wort;
  if (wort) yeast = { ...yeast, pitching: { ...yeast.pitching, version: 1, wort } };
  return yeast;
}

/** Le conseil de dose de la levure de la recette, pour l'affichage (plage de sachets) : jamais écrit dans la recette. */
export function doseDeLaLevure(recipe: TrialRecipe, supply: YeastSupply): { yeast: YeastSpec; conseil: YeastPitchingAdvice } {
  const yeast = preparer(recipe, supply, recipe.yeast.pitching);
  return { yeast, conseil: evaluateYeastPitching({ ...recipe, yeast }) };
}

/**
 * La recette après le choix d'une levure (`recipe` porte déjà la nouvelle levure, issue de `applyCatalogueYeast`) : produit et moût
 * recalculés, dose posée quand le conseil est un nombre de sachets, sinon laissée vide. `avant` est la levure remplacée : on n'en
 * reprend que la mesure du moût, jamais sa dose ni son produit.
 */
export function doseApresChoix(recipe: TrialRecipe, avant: YeastSpec, supply: YeastSupply): TrialRecipe {
  const { qty: _qty, unit: _unit, ...sansDose } = recipe.yeast;
  const nue: TrialRecipe = { ...recipe, yeast: sansDose };
  const { yeast, conseil } = doseDeLaLevure(nue, supply);
  const mesure = avant.pitching?.wort && avant.pitching.wort.basis !== 'recipe-estimate' ? avant.pitching.wort : undefined;
  const prepared = mesure && yeast.pitching?.product ? preparer(nue, supply, { version: 1, wort: mesure }) : yeast;
  const advice = mesure ? evaluateYeastPitching({ ...nue, yeast: prepared }) : conseil;
  if (advice.packs && advice.packs.min === advice.packs.max && !advice.stale) {
    try { return { ...nue, yeast: applyYeastPitchingAdvice(prepared, advice, advice.packs.min) }; } catch { /* conseil périmé : la dose reste à saisir */ }
  }
  return { ...nue, yeast: prepared };
}
