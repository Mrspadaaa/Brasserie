/**
 * N3 (v07, « Rebrasser ») : « Tout relier à ton stock » relie d'un toucher les lignes d'une recette passée qui ne portent pas de lien
 * (`stockItemRef`) à l'article du stock qui porte leur nom.
 *
 * État de l'art : rapprocher un libellé d'un article est un appariement d'enregistrements (record linkage). L'app en a déjà la méthode,
 * éprouvée à 0 fausse proposition sur les factures : `matchStockLine` (mots du nom, « Typ 2 », α, unité convertible, catégorie, un seul
 * article sinon rien) ; `reparerNomAbime` rend ses accents à un nom dont l'encodage les a perdus. Ce module ne réécrit aucun appariement :
 * - exact : le même nom, sans casse ni accent (`memeNom`), un seul article d'une catégorie compatible ;
 * - proche (à confirmer) : le nom réparé de ses accents, ou `matchStockLine` ;
 * - aucun : la ligne reste au brasseur.
 * Un houblon relié prend l'α du lot posé (`StockItem.alphaPct`) ; l'ancien α est gardé pour le dire. La dose n'est jamais touchée.
 */
import type { Recipe, StockItem } from '../../types';
import { canonicalStockCategory, matchStockLine, memeNom } from '../../services/stockLineMatching';
import { reparerNomAbime } from '../recipeIngredientsAbimes';

export type Genre = 'malt' | 'houblon' | 'levure';
export type Correspondance = 'exact' | 'proche' | 'aucun';

export interface Lien {
  genre: Genre;
  /** Rang de la ligne dans `fermentables` ou `hops` (0 pour la levure). */
  index: number;
  /** Le nom de la ligne dans la recette. */
  nom: string;
  correspondance: Correspondance;
  article?: StockItem;
  /** Houblon : l'α que la recette portait avant le lien. */
  alphaAvant?: number;
}

export interface Reliure {
  recette: Recipe;
  liens: Lien[];
  /** Lignes reliées (exactes et proches). */
  reliees: number;
  aConfirmer: number;
  /** Lignes sans lien avant le geste. */
  aRelier: number;
}

const CATEGORIE: Record<Genre, string> = { malt: 'Malt', houblon: 'Houblon', levure: 'Levure' };

/** Un article d'une autre catégorie connue ne se relie jamais (un malt n'est pas un houblon) ; une catégorie inconnue est permise. */
function compatible(item: StockItem, genre: Genre): boolean {
  const c = canonicalStockCategory(item.category ?? '');
  return !['Malt', 'Houblon', 'Levure'].includes(c) || c === CATEGORIE[genre] || (genre === 'malt' && c === 'Sucre');
}

/** L'article du stock qui porte ce nom : exact, proche, ou aucun. */
export function trouverArticle(nom: string, genre: Genre, quantite: number | null | undefined, unite: string, stock: readonly StockItem[]): { correspondance: Correspondance; article?: StockItem } {
  const pool = stock.filter((i) => compatible(i, genre));
  const exacts = pool.filter((i) => memeNom(i.name, nom));
  if (exacts.length === 1) return { correspondance: 'exact', article: exacts[0] };
  if (exacts.length > 1) return { correspondance: 'aucun' };
  const repare = reparerNomAbime(nom, pool.map((i) => i.name));
  if (repare !== nom) {
    const r = pool.filter((i) => i.name === repare);
    if (r.length === 1) return { correspondance: 'proche', article: r[0] };
  }
  const m = matchStockLine({ description: nom, unit: unite, quantity: quantite && quantite > 0 ? quantite : 1, stockCategory: CATEGORIE[genre], kind: 'ingredient' }, [...pool]);
  return m ? { correspondance: 'proche', article: m.item } : { correspondance: 'aucun' };
}

/** Le nombre de lignes de malt, houblon et levure sans lien au stock. */
export function lignesSansLien(recette: Recipe): number {
  return (recette.fermentables ?? []).filter((l) => !l.stockItemRef && l.name?.trim()).length
    + (recette.hops ?? []).filter((l) => !l.stockItemRef && l.name?.trim()).length
    + (recette.yeast?.name?.trim() && !recette.yeast.stockItemRef ? 1 : 0);
}

/** Relie chaque ligne sans lien ; rend la recette neuve (les lignes déjà reliées ne bougent pas) et ce qui a été fait, ligne par ligne. */
export function relierAuStock(recette: Recipe, stock: readonly StockItem[]): Reliure {
  const liens: Lien[] = [];
  const fermentables = (recette.fermentables ?? []).map((l, index) => {
    if (l.stockItemRef || !l.name?.trim()) return l;
    const t = trouverArticle(l.name, 'malt', l.weightKg, 'kg', stock);
    liens.push({ genre: 'malt', index, nom: l.name, ...t });
    return t.article ? { ...l, stockItemRef: t.article.ref } : l;
  });
  const hops = (recette.hops ?? []).map((l, index) => {
    if (l.stockItemRef || !l.name?.trim()) return l;
    const t = trouverArticle(l.name, 'houblon', l.weightG, 'g', stock);
    const alpha = t.article?.alphaPct;
    liens.push({ genre: 'houblon', index, nom: l.name, ...t, ...(t.article ? { alphaAvant: l.alpha } : {}) });
    if (!t.article) return l;
    return { ...l, stockItemRef: t.article.ref, ...(alpha && alpha > 0 ? { alpha } : {}) };
  });
  let yeast = recette.yeast;
  if (yeast?.name?.trim() && !yeast.stockItemRef) {
    const t = trouverArticle(yeast.name, 'levure', yeast.qty ?? null, yeast.unit ?? 'sachet', stock);
    liens.push({ genre: 'levure', index: 0, nom: yeast.name, ...t });
    if (t.article) yeast = { ...yeast, stockItemRef: t.article.ref };
  }
  const reliees = liens.filter((l) => l.article).length;
  return {
    recette: { ...recette, fermentables, hops, ...(yeast ? { yeast } : {}) },
    liens,
    reliees,
    aConfirmer: liens.filter((l) => l.correspondance === 'proche').length,
    aRelier: liens.length
  };
}

/** La ligne sans son lien (la clé est retirée, jamais posée à `undefined` : Firestore la refuserait). */
function sansLien<T extends { stockItemRef?: string }>(l: T): T {
  const { stockItemRef: _retire, ...reste } = l;
  return reste as T;
}

/** Défait un lien posé par `relierAuStock` : la ligne perd son article, le houblon reprend son α d'avant. */
export function delier(recette: Recipe, lien: Lien): Recipe {
  if (lien.genre === 'malt') {
    return { ...recette, fermentables: (recette.fermentables ?? []).map((l, i) => (i === lien.index ? sansLien(l) : l)) };
  }
  if (lien.genre === 'houblon') {
    return { ...recette, hops: (recette.hops ?? []).map((l, i) => (i === lien.index ? { ...sansLien(l), ...(lien.alphaAvant !== undefined ? { alpha: lien.alphaAvant } : {}) } : l)) };
  }
  return recette.yeast ? { ...recette, yeast: sansLien(recette.yeast) } : recette;
}
