import type { StockItem } from '../../types';

/**
 * Les tuiles que le champ d'ajout de Malts/sucres propose à l'ouverture, avant toute frappe (D222 : « avec algo de reconnaissance
 * pour le style et autres comme pour les houblons », sur les tuiles de s1). Le modèle est l'ajout en un toucher des houblons
 * (`QUICK_ADD_RULE` de `hopIndex/v4/quickAdd.ts`, typicité f9) : un classement lexicographique, une donnée inconnue jamais 0.
 *
 * Contrat stable entre la voie a1-proposition (qui écrit la règle et sa donnée) et le port de l'étape (qui l'appelle) :
 * la signature ne change pas sans le pilote. Tant que a1 n'a pas rendu, la règle est la provisoire ci-dessous.
 */
export interface EntreeProposition {
  /** Articles du stock du rayon de la famille du champ (`KIND_DEF[famille].stock`). */
  articles: readonly StockItem[];
  /** Ce que la recette contient déjà : jamais proposé à l'ouverture (la frappe le retrouve, « déjà … kg »). */
  dejaLa: readonly { name: string; stockItemRef?: string }[];
  /** Code BJCP 2021 du style visé, s'il est connu. */
  styleCode?: string | null;
  /** Teinte visée de la bière, en EBC, si elle est connue. */
  ebcVise?: number | null;
  /** Nombre de tuiles au plus. */
  max?: number;
}

export interface Proposition {
  article: StockItem;
  /** Les clés du rang, dans l'ordre où elles ont compté : pour les tests et la relecture, jamais affichées (D222, lecture étroite). */
  cles: string[];
}

export const PROPOSITION_RULE: readonly string[] = [
  'Règle provisoire du pilote, avant la voie a1 : les articles déjà dans la recette sont écartés ; puis les épinglés, les disponibles (stock > 0) avant les épuisés, le nom.',
];

const memeArticle = (a: StockItem, l: { name: string; stockItemRef?: string }) =>
  (l.stockItemRef !== undefined && l.stockItemRef === a.id) || l.name.trim().toLowerCase() === a.name.trim().toLowerCase();

export function proposerFermentables({ articles, dejaLa, max = 6 }: EntreeProposition): Proposition[] {
  return articles
    .filter((a) => !dejaLa.some((l) => memeArticle(a, l)))
    .map((a) => ({ a, cles: [a.favorite ? 'épinglé' : 'non épinglé', a.currentStock > 0 ? 'disponible' : 'épuisé', a.name] }))
    .sort((x, y) =>
      Number(Boolean(y.a.favorite)) - Number(Boolean(x.a.favorite)) ||
      Number(y.a.currentStock > 0) - Number(x.a.currentStock > 0) ||
      x.a.name.localeCompare(y.a.name, 'fr'))
    .slice(0, max)
    .map(({ a, cles }) => ({ article: a, cles }));
}
