/**
 * C46-4 (Q-1 A) : le choix fait le prix. Le prix de l'article choisi, en francs, quand il y en a un ; le prix du carnet n'est alors plus
 * « estimé » mais celui de l'article. Une autre devise ou aucun choix : `undefined` (jamais un chiffre inventé).
 */
import type { CarnetDoc } from './modele';

export function prixChoisiCentimes(c: Pick<CarnetDoc, 'carnet'>): number | undefined {
  const k = c.carnet;
  const a = k.choix ? k.articles.find(x => x.id === k.choix!.articleId) : undefined;
  if (!a || typeof a.prixCentimes !== 'number' || !(a.prixCentimes > 0) || (a.devise ?? 'CHF') !== 'CHF') return undefined;
  return a.prixCentimes;
}

/** Le prix dit par le carnet (`centimes`) est-il celui de l'article choisi ? */
export const prixEstChoisi = (c: Pick<CarnetDoc, 'carnet'>, centimes: number | undefined): boolean =>
  centimes !== undefined && prixChoisiCentimes(c) === centimes;
