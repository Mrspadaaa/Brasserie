import { ajouterJours, ecartJours } from '../../../domain/calendrier';
import type { Colonne } from '../frise/Rangee';

/**
 * D387 (le brasseur, 18.11 : « juste un bouton qui match les deux ou pas genre un toggle switch ») et D388 (le zoom pendant le glisser, jouable
 * paysage `as-gestes.js` : la courbe se trace sur les colonnes de la frise). Une même date a le même x dans la courbe et dans la frise.
 *
 * État de l'art : une échelle date → px linéaire par morceaux (celle des colonnes de la frise, `echelle.ts`) ; une date tombe dans sa colonne,
 * au prorata de ses jours. Les semaines de la courbe s'y posent par leur lundi et le lundi suivant. Rien d'autre : pas d'échelle inventée.
 */

/** Le x (px de la frise, colonne 0 à 0) du début du jour `date`. Hors des colonnes, prolongé au pas de la colonne du bord. */
export function xDeDate(colonnes: readonly Colonne[], largeurColonne: number, date: string): number {
  const n = colonnes.length;
  if (!n || !(largeurColonne > 0)) return 0;
  const jours = (c: Colonne) => Math.max(1, ecartJours(c.debut, c.fin) + 1);
  if (date < colonnes[0].debut) return (largeurColonne * ecartJours(colonnes[0].debut, date)) / jours(colonnes[0]);
  for (let i = 0; i < n; i++) {
    const c = colonnes[i];
    if (date <= c.fin) return i * largeurColonne + (largeurColonne * ecartJours(c.debut, date)) / jours(c);
  }
  const d = colonnes[n - 1];
  return (n - 1) * largeurColonne + (largeurColonne * ecartJours(d.debut, date)) / jours(d);
}

/** Les semaines de la courbe posées sur la frise : la première montrée (`debut`, index dans `lundis`) et les bords de chacune, en px de la courbe. */
export interface Alignement { debut: number; abscisses: number[] }

/**
 * Les semaines (`lundis`, dans l'ordre) qui tombent dans la largeur de la courbe, alignées sur la frise. `decalage` : le bord gauche de la frise
 * moins celui de la courbe (0 en portrait ; négatif en paysage, où la courbe commence après la colonne du chiffre : les semaines cachées sous
 * cette colonne ne se tracent pas). Les bords sont bornés à [0, largeur]. `null` : aucune colonne, ou aucune semaine dans la largeur.
 */
export function alignerSemaines(lundis: readonly string[], colonnes: readonly Colonne[], largeurColonne: number, decalage: number, largeur: number): Alignement | null {
  if (!lundis.length || !colonnes.length || !(largeurColonne > 0) || !(largeur > 0)) return null;
  const xs = [...lundis, ajouterJours(lundis[lundis.length - 1], 7)].map(l => xDeDate(colonnes, largeurColonne, l) + decalage);
  let debut = -1, fin = -1;
  for (let i = 0; i < lundis.length; i++) {
    if (xs[i + 1] > 0.5 && xs[i] < largeur - 0.5) { if (debut < 0) debut = i; fin = i; }
  }
  if (debut < 0) return null;
  const borne = (x: number) => Math.max(0, Math.min(largeur, x));
  return { debut, abscisses: xs.slice(debut, fin + 2).map(x => Math.round(borne(x) * 10) / 10) };
}

/** La semaine (index dans l'alignement) sous l'abscisse `x` de la courbe ; bornée aux semaines montrées. */
export function semaineSous(al: Alignement, x: number): number {
  const a = al.abscisses;
  for (let k = 0; k < a.length - 1; k++) if (x < a[k + 1]) return k;
  return Math.max(0, a.length - 2);
}

/** Les colonnes d'une semaine chacune, quand l'appelant n'en donne pas (banc de l'en-tête seul). */
export const colonnesDeSemaines = (lundis: readonly string[]): Colonne[] => lundis.map(l => ({ debut: l, fin: ajouterJours(l, 6), etiquette: '' }));
