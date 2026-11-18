/**
 * Relier une levure sans fiche (un article du stock, une ligne de recette saisie à la main) à la fiche du catalogue qui lui correspond
 * (voie r4, mission 2026-11-09-levure-retours : « J'ai 4 sachets de Verdant, elle est au catalogue, et ma carte me dit non documenté partout ? »).
 *
 * Seule une correspondance UNIQUE et SÛRE relie ; au moindre doute, aucune fiche (l'inconnu reste « ? », jamais une fiche approchée) :
 *  - la recherche d'identité du catalogue (`yeastSearchScore` : nom, fabricant, code imprimé, alias) ; tous les mots utiles doivent être
 *    des mots d'identité EXACTS (pas de préfixe, pas de faute tolérée : « 1056 » et « 1065 » sont deux produits) ;
 *  - les mots de bruit d'un nom d'article (« Levure », « sachet », « 11 g », la parenthèse de quantité) ne comptent pas ;
 *  - au moins un mot qui n'est pas le fabricant seul (« Lallemand » ne désigne aucune fiche) ;
 *  - le laboratoire dit sur l'article, s'il y en a un, est celui de la fiche ;
 *  - exactement une fiche répond (deux homonymes : on ne choisit pas).
 */
import { catalogueMatches, normalizedYeastText, yeastSearchIndex, yeastSearchScore } from '../yeastCatalogue';
import type { YeastReference } from '../yeastReferences';

export interface IdentiteLevure { name: string; lab?: string; strain?: string }

/** Mots d'un nom d'article qui ne disent pas quelle levure c'est. */
const BRUIT = new Set(['levure', 'levures', 'yeast', 'yeasts', 'hefe', 'sachet', 'sachets', 'sec', 'seche', 'sèche', 'dry', 'liquide', 'liquid', 'flacon', 'pack']);

/** Le nom de l'article réduit à ce qui identifie : sans parenthèse, sans poids (« 11 g »), sans mot de bruit. */
export function motsUtiles(nom: string): string {
  const sansParenthese = nom.replace(/\([^)]*\)/g, ' ').replace(/\b\d+(?:[.,]\d+)?\s*(?:g|gr|kg|ml|l)\b/gi, ' ');
  return normalizedYeastText(sansParenthese).split(' ').filter(m => m && !BRUIT.has(m)).join(' ');
}

export function relierAuCatalogue(identite: IdentiteLevure, refs: readonly YeastReference[]): YeastReference | undefined {
  const requete = motsUtiles(`${identite.name ?? ''}${identite.strain ? ` ${identite.strain}` : ''}`);
  if (!requete) return undefined;
  const motsLab = identite.lab ? normalizedYeastText(identite.lab).split(' ').filter(Boolean) : [];
  const trouvees = refs.filter(ref => {
    if (!catalogueMatches(ref, requete)) return false;
    // Tous les mots, en identité exacte (10 par mot : plancher 1 000 ; une phrase exacte vaut 10 000).
    if (yeastSearchScore(yeastSearchIndex(ref), requete) < 1000) return false;
    const fabricant = new Set(normalizedYeastText(ref.catalogue?.manufacturer ?? '').split(' ').filter(Boolean));
    // « Lallemand » seul ne désigne aucune fiche : un mot au moins doit venir du produit.
    if (!requete.split(' ').some(m => !fabricant.has(m))) return false;
    if (motsLab.length) return fabricant.size > 0 && motsLab.every(m => fabricant.has(m));
    return true;
  });
  return trouvees.length === 1 ? trouvees[0] : undefined;
}
