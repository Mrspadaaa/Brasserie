/**
 * C46-4 (Q-1 A) : le choix fait le prix. Le prix de l'article choisi, en francs, quand il y en a un ; le prix du carnet n'est alors plus
 * « estimé » mais celui de l'article. Une autre devise ou aucun choix : `undefined` (jamais un chiffre inventé).
 * R54 (C66-4) : quand le choix porte une quantité (1 kg cochée sur la fiche d'un houblon), son prix (62,20) fait le prix, pas celui d'un autre sachet.
 */
import type { Article, CarnetDoc, Choix } from './modele';
import { articleHonnete } from './prixUnitaire';

/** Le prix en francs (centimes) que le choix pose : celui de la quantité cochée, sinon celui de l'article (en francs seulement). */
export function prixCentimesDuChoix(choix: Pick<Choix, 'prixCentimes'> | undefined, a: Pick<Article, 'prixCentimes' | 'devise'>): number | undefined {
  if (typeof choix?.prixCentimes === 'number' && choix.prixCentimes > 0) return choix.prixCentimes;
  return typeof a.prixCentimes === 'number' && a.prixCentimes > 0 && (a.devise ?? 'CHF') === 'CHF' ? a.prixCentimes : undefined;
}

export function prixChoisiCentimes(c: Pick<CarnetDoc, 'carnet'>): number | undefined {
  const k = c.carnet;
  const choix = k.choix;
  const brut = choix ? k.articles.find(x => x.id === choix.articleId) : undefined;
  if (!brut) return undefined;
  if (typeof choix!.prixCentimes === 'number' && choix!.prixCentimes > 0) return choix!.prixCentimes;
  /* R43 (C61-1) : un prix « dès » sans quantité (0,10 CHF le gramme) ne part ni à À venir ni au Calendrier */
  const a = articleHonnete(brut);
  if (!a || typeof a.prixCentimes !== 'number' || !(a.prixCentimes > 0) || (a.devise ?? 'CHF') !== 'CHF') return undefined;
  return a.prixCentimes;
}

/** Le prix dit par le carnet (`centimes`) est-il celui de l'article choisi ? */
export const prixEstChoisi = (c: Pick<CarnetDoc, 'carnet'>, centimes: number | undefined): boolean =>
  centimes !== undefined && prixChoisiCentimes(c) === centimes;
