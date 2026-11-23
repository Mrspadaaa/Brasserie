/**
 * Les brassins d'une recette, comptés comme la feuille des recettes (T3B-11, 20.11 : « brassée 1 fois » sur la feuille, « aucun brassin » sur la fiche).
 *
 * La feuille (`recettesModel.lignees`) compte les brassins de TOUTE la lignée d'une recette (ses versions, par `parentRecipeId`) et lie un brassin
 * à sa recette par `recipeRef`, par `recipeSnapshot.sourceRecipeId` ou par `recipe.batchRef` (`relatedRecipeBatches`). La fiche ne regardait que
 * les deux premiers liens, pour cette seule version : un brassin lié par `batchRef`, ou brassé sur une autre version, y était « aucun brassin ».
 * Une seule règle pour les deux : `relatedRecipeBatches`, étendue à la lignée.
 */
import type { Batch, Recipe } from '../types';
import { relatedRecipeBatches } from './productionCatalog';

type Lien = Pick<Recipe, 'id' | 'batchRef' | 'parentRecipeId'>;

/** La plus ancienne version de la lignée (garde contre une boucle de `parentRecipeId`). */
function racine(recette: Lien, toutes: readonly Lien[]): string {
  const vues = new Set<string>();
  let cur = recette;
  while (cur.parentRecipeId && !vues.has(cur.id)) {
    vues.add(cur.id);
    const parent = toutes.find(r => r.id === cur.parentRecipeId);
    if (!parent) return cur.parentRecipeId;
    cur = parent;
  }
  return cur.id;
}

/** Les brassins de la recette et de ses autres versions, sans doublon, dans l'ordre de `batches`. `recettes` : toutes les recettes (sinon, cette seule version). */
export function brassinsDeLaRecette(recette: Lien, batches: readonly Batch[], recettes: readonly Lien[] = [recette]): Batch[] {
  const toutes = recettes.some(r => r.id === recette.id) ? recettes : [...recettes, recette];
  const lignee = racine(recette, toutes);
  const membres = toutes.filter(r => racine(r, toutes) === lignee);
  const ids = new Set(membres.flatMap(m => relatedRecipeBatches(m, batches as Batch[]).map(b => b.id)));
  return batches.filter(b => ids.has(b.id));
}
