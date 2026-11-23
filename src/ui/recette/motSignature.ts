import type { HopIngredient } from '../../types';
import { toHopRecipe } from '../../domain/hopIndex/v4/recipeConversion';
import { familyWords, hopRef } from '../hopIndex/parcours/v4';
import { motsHors } from '../hopIndex/substituer/donnees';
import { estGenerique, motAffiche } from '../hopIndex/fiche/traduction';
import type { FamilyId } from '../../domain/hopIndex/v4/families';

/**
 * Le mot d'arôme d'une rangée de houblon : son descripteur signature (L14, [[descripteurs-hors-familles]]).
 * Mêmes sources que l'étape Houblons de l'assistant : la clé de la variété vient de la conversion de la recette (toHopRecipe),
 * les mots hors des 12 familles de `motsHors` (celui des écrans Substituer et Suggérer : traduits, sans mot générique, triés par fiches),
 * les mots rangés de `familyWords`. Hors famille (pointillé) quand au moins deux fiches le disent (« groseille à maquereau » : Citra, Nelson Sauvin) ;
 * sinon le mot que le plus de fiches citent, avec sa famille (Mosaic « myrtille », six fiches). Variété hors des fiches du moteur : aucun mot (l'inconnu n'est pas 0).
 */
export type MotSignature = { texte: string; famille: FamilyId | null; fiches: number };

/** La clé de la variété du moteur pour un ajout de la recette, ou null si la variété n'y figure pas. */
export function cleMoteurDe(h: HopIngredient): string | null {
  const cle = toHopRecipe({ hops: [h] } as never).recette.additions[0]?.hopKey;
  return cle && hopRef(cle) ? cle : null;
}

export function motSignature(cle: string): MotSignature | null {
  const ref = hopRef(cle);
  if (!ref) return null;
  const hors = motsHors(cle).hors[0];
  if (hors && hors.fiches >= 2) return { texte: hors.mot, famille: null, fiches: hors.fiches };
  const w = familyWords(ref.varietyId, ref.catalogue);
  const compte = new Map<string, { famille: FamilyId; sources: Set<string> }>();
  for (const [f, lignes] of Object.entries(w.mots) as [FamilyId, { source: string; mots: string[] }[]][]) {
    for (const l of lignes) for (const brut of l.mots) {
      const mot = motAffiche(brut)?.toLowerCase().trim();
      if (!mot || estGenerique(mot)) continue;
      const e = compte.get(mot) ?? { famille: f, sources: new Set<string>() };
      e.sources.add(l.source); compte.set(mot, e);
    }
  }
  // Le plus cité ; à égalité, le premier cité (l'ordre des fiches, Beer Maverick en tête).
  let meilleur: MotSignature | null = null;
  for (const [mot, e] of compte) if (!meilleur || e.sources.size > meilleur.fiches) meilleur = { texte: mot, famille: e.famille, fiches: e.sources.size };
  return meilleur ?? (hors ? { texte: hors.mot, famille: null, fiches: hors.fiches } : null);
}
