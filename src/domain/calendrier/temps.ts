import { scaleUtc, type ScaleTime } from 'd3-scale';
import { utcDay, utcMonday } from 'd3-time';
import { bornes, type Periode } from '../../components/periode/periode';

/**
 * Le temps de la frise (D444, 23.11 : « reconstruire le cœur de la frise sur une échelle de temps standard »).
 *
 * État de l'art (L29) : une frise zoomable se tient sur une échelle de temps continue date → px (d3-scale `scaleUtc`, la variante UTC de
 * `scaleTime` : aucun jour ne glisse à l'heure d'été) et sur les intervalles du calendrier de d3-time (`utcMonday` pour les semaines ISO,
 * `utcDay` pour les jours) : floor, offset, count, sans arithmétique de millisecondes écrite à la main. Le cadre est un intervalle de dates
 * [lundi, dimanche] ; ses semaines, son libellé et l'axe s'en dérivent.
 */

/** Un jour ISO (`AAAA-MM-JJ`) en Date UTC minuit. */
export const versDate = (iso: string): Date => { const [a, m, j] = iso.split('-').map(Number); return new Date(Date.UTC(a, m - 1, j)); };
/** Une Date en jour ISO (UTC). */
export const versIso = (d: Date): string => d.toISOString().slice(0, 10);

/** Le lundi de la semaine ISO qui contient `iso`. */
export const lundi = (iso: string): string => versIso(utcMonday.floor(versDate(iso)));
/** `n` semaines plus loin (ou plus tôt), d'un lundi à un lundi. */
export const plusSemaines = (lundiIso: string, n: number): string => versIso(utcMonday.offset(versDate(lundiIso), n));
/** `n` jours plus loin. */
export const plusJours = (iso: string, n: number): string => versIso(utcDay.offset(versDate(iso), n));
/** Les semaines d'un lundi à un autre (négatif si `b` vient avant `a`). */
export function semainesEntre(a: string, b: string): number {
  const da = utcMonday.floor(versDate(a)), db = utcMonday.floor(versDate(b));
  return db >= da ? utcMonday.count(da, db) : -utcMonday.count(db, da);
}
/** Les jours de `a` à `b` (négatif si `b` vient avant). */
export function joursEntre(a: string, b: string): number {
  const da = versDate(a), db = versDate(b);
  return db >= da ? utcDay.count(da, db) : -utcDay.count(db, da);
}

/** La fenêtre de la frise : le lundi de sa première semaine et le nombre de semaines. */
export interface FenetreSemaines { du: string; semaines: number }

/** Un mois lu au calendrier montre au moins ces semaines (décision pilote (c), 18.11). */
export const MOIS_MIN_SEMAINES = 4;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** La fenêtre écrite comme une période de l'app : du lundi de sa première semaine au dimanche de la dernière. */
export const periodeDeFenetre = (f: FenetreSemaines): Periode => ({ genre: 'dates', du: f.du, au: plusJours(plusSemaines(f.du, f.semaines), -1) });

/**
 * Une période lue comme une fenêtre de semaines, dans l'horizon (`premierLundi`, `total` semaines). `tout` n'a pas de bornes : `null`.
 * Une période tout entière hors de l'horizon : `null`. Une plage qui commence avant l'horizon garde sa durée et se pose à son début (CHV-4) ;
 * un mois montre au moins 4 semaines (décision (c)) ; au-delà d'un an, la fenêtre suit la période jusqu'au bout de l'horizon (CAL-PLUS-QU-UN-AN).
 */
export function fenetreDePeriode(periode: Periode | undefined, premierLundi: string, total: number): FenetreSemaines | null {
  // une période sans genre connu (un banc qui passe une fonction, calPasseG3) n'a pas de bornes
  const b = periode ? bornes(periode) : undefined;
  if (!periode || !b || !b.du || !b.au) return null;
  const voulu = lundi(b.du);
  const debut = voulu < premierLundi ? premierLundi : voulu;
  let fin = lundi(b.au);
  if (periode.genre === 'dates' && voulu < debut && fin >= debut) fin = plusSemaines(debut, semainesEntre(voulu, fin));
  if (fin < debut) return null;
  const decalage = semainesEntre(premierLundi, debut);
  if (decalage >= total) return null;
  const semaines = semainesEntre(debut, fin) + 1;
  const min = periode.genre === 'mois' ? MOIS_MIN_SEMAINES : 1;
  return { du: debut, semaines: clamp(Math.max(semaines, min), 1, total - decalage) };
}

/**
 * L'échelle de temps de la courbe et des rangées (D441 : une même date, un même x) : la vue (`v0`, `span`, en semaines depuis `lundi0`) posée
 * sur `largeur` px. `echelle(date)` donne le x ; `echelle.invert(x)` la date ; `echelle.domain()` l'axe montré.
 */
export function echelleDeVue(lundi0: string, vue: { v0: number; span: number }, largeur: number): ScaleTime<number, number> {
  const t0 = versDate(lundi0).getTime(), semaine = 7 * 864e5;
  return scaleUtc().domain([new Date(t0 + vue.v0 * semaine), new Date(t0 + (vue.v0 + vue.span) * semaine)]).range([0, Math.max(1, largeur)]);
}

/** L'axe d'une échelle en jours ISO : le premier jour (entamé) et le dernier jour (entamé) montrés. */
export function axeDeLEchelle(e: ScaleTime<number, number>): { du: string; au: string } {
  const [a, b] = e.domain();
  return { du: versIso(utcDay.floor(a)), au: versIso(utcDay.offset(utcDay.ceil(b), -1)) };
}
