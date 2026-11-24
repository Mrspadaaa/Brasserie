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

/* ---------- CAL-LACHER-OU-DESSINE : le geste lu au doigt, par la même transformation que le dessin ---------- */

/*
 * CAL-LACHER-OU-DESSINE (23.11, « là j'ai mon événement au dessus de septembre, mais il est noté en avril ??? ») : à 51 semaines (axe en mois), le
 * bord tiré comptait ses jours à 1/7 de colonne, comme si chaque colonne était une semaine : tiré de 6,5 mois sous le doigt (et dessiné là), il
 * écrivait 45 jours. Le glisser retranchait des semaines (fenêtre glissée sous le doigt) à un pas compté en mois. Une seule transformation
 * date ↔ x (`xDeDate` et son inverse `jourReelDeX`, linéaire par morceaux sur les colonnes) sert désormais au dessin, au pas, à l'annonce et à
 * l'écriture : le jour sous le doigt à l'appui (dans l'axe de l'appui) et maintenant (dans l'axe du moment), et leur écart.
 */

const JOUR_MS = 864e5;
/** Un jour ISO en jours depuis le 1er janvier 1970 (UTC : jamais un jour glissé à l'heure d'été). */
const jourReel = (iso: string): number => Math.round(Date.parse(`${iso}T00:00:00Z`) / JOUR_MS);
const isoDeJour = (j: number): string => new Date(j * JOUR_MS).toISOString().slice(0, 10);
const joursDeColonne = (c: Colonne): number => Math.max(1, ecartJours(c.debut, c.fin) + 1);

/** L'inverse de `xDeDate` : le jour réel (jours depuis 1970, fraction comprise) sous l'abscisse `x` (px de la frise, colonne 0 à 0). Hors des colonnes, prolongé au pas de la colonne du bord. */
export function jourReelDeX(colonnes: readonly Colonne[], largeurColonne: number, x: number): number {
  const n = colonnes.length;
  if (!n || !(largeurColonne > 0)) return NaN;
  const i = Math.max(0, Math.min(n - 1, Math.floor(x / largeurColonne))), c = colonnes[i];
  return jourReel(c.debut) + ((x - i * largeurColonne) / largeurColonne) * joursDeColonne(c);
}

/** `xDeDate` pour un jour réel : le début de son jour, plus sa fraction au pas de la colonne qui le porte (prolongée hors des colonnes). */
export function xDeJourReel(colonnes: readonly Colonne[], largeurColonne: number, j: number): number {
  const n = colonnes.length;
  if (!n || !(largeurColonne > 0) || !Number.isFinite(j)) return 0;
  const entier = Math.floor(j), iso = isoDeJour(entier);
  const c = iso < colonnes[0].debut ? colonnes[0] : colonnes.find(k => iso <= k.fin) ?? colonnes[n - 1];
  return xDeDate(colonnes, largeurColonne, iso) + ((j - entier) * largeurColonne) / joursDeColonne(c);
}

/** L'axe de la frise tel que le doigt le lit : ses colonnes, leur largeur, et la gauche de la colonne 0 à l'écran (`clientX`). */
export interface AxeDoigt { colonnes: readonly Colonne[]; largeurColonne: number; gauche: number }

/** Le jour réel sous le doigt (`clientX`). */
export const jourSousLeDoigt = (a: AxeDoigt, x: number): number => jourReelDeX(a.colonnes, a.largeurColonne, x - a.gauche);

/*
 * CAL-JOUR-EXACT (23.11, « le choix d'un jour tombe pas exactement sur le jour ») et l'arrondi du lâcher (14 sem., doigt dans la 2e moitié de S3 :
 * S4 écrit) : un jour, une colonne, se lit au PLANCHER (la colonne qui contient le doigt), jamais à l'arrondi. L'écart arrondi de deux positions
 * fractionnaires se trompait d'un jour (ou d'une colonne) selon l'endroit du doigt dans sa colonne et l'endroit où il avait pris le bord.
 */
/** Le jour (entier, jours depuis 1970) dont la colonne contient l'abscisse ; un doigt posé sur une limite est dans le jour qui commence là. */
const plancher = (j: number): number => Math.floor(j + 1e-7);

/** Les jours entre le jour sous le doigt à l'appui (`a0`, `x0`) et celui sous le doigt maintenant (`a`, `x`), chacun lu au plancher. */
export function joursDuDoigt(a0: AxeDoigt, x0: number, a: AxeDoigt, x: number): number {
  const d = plancher(jourSousLeDoigt(a, x)) - plancher(jourSousLeDoigt(a0, x0));
  return Number.isFinite(d) ? d : 0;
}

/** CAL-JOUR-EXACT : le bord tiré, au jour sous le doigt : les jours qui mènent du bout de la barre (`bout`, ISO) au jour dont la colonne contient `x`. */
export function joursJusquAuDoigt(a: AxeDoigt, x: number, bout: string): number {
  const j = jourSousLeDoigt(a, x);
  return Number.isFinite(j) ? plancher(j) - jourReel(bout) : 0;
}

/**
 * K57-2 (24.11, test en ligne : prise à 15, 30 ou 60 px du bout, la fin sautait de 2 à 3 jours dès le premier mouvement) : saisir une poignée ne change
 * rien, le bout suit le DÉPLACEMENT du doigt depuis le point de prise. Le décalage (px) entre le doigt posé en `x0` et le milieu du jour du bout (`bout`,
 * ISO) : ajouté à la position du doigt, il fait lire au bout le jour qu'il a déjà tant que le doigt ne bouge pas ; `joursJusquAuDoigt` rend alors 0.
 */
export function correctionAuBout(a: AxeDoigt, x0: number, bout: string): number {
  const x = a.gauche + xDeJourReel(a.colonnes, a.largeurColonne, jourReel(bout) + 0.5);
  return Number.isFinite(x) && Number.isFinite(x0) ? x - x0 : 0;
}

/**
 * Les colonnes de l'axe du moment entre la colonne du point pris (le jour sous le doigt à l'appui, reporté sur l'axe du moment) et celle sous le
 * doigt maintenant : le pas d'une barre glissée (son dessin `k × colonne`, sa date un mois, une semaine ou un jour par colonne). `parJour` (axe en
 * semaines, CAL-JOUR) : les jours, en septièmes de semaine. Plancher des deux côtés : la colonne sous le doigt reçoit ce qu'il a pris.
 */
export function pasDuDoigt(a0: AxeDoigt, x0: number, a: AxeDoigt, x: number, parJour = false): number {
  const j0 = jourSousLeDoigt(a0, x0), j = jourSousLeDoigt(a, x);
  if (!Number.isFinite(j0) || !Number.isFinite(j)) return 0;
  if (parJour) return (plancher(j) - plancher(j0)) / 7;
  return Math.floor((x - a.gauche) / a.largeurColonne + 1e-7) - colonneDuJour(a.colonnes, plancher(j0));
}

/** La colonne (index, négatif ou au-delà hors des colonnes) qui porte le jour `j` : comptée en jours, semaines ou MOIS de calendrier hors de
 *  l'axe (le prolongement au pas d'une colonne de mois se trompait d'un mois : février n'a pas les jours de novembre). */
function colonneDuJour(colonnes: readonly Colonne[], j: number): number {
  const iso = isoDeJour(j), n = colonnes.length;
  const i = colonnes.findIndex(c => iso >= c.debut && iso <= c.fin);
  if (i >= 0) return i;
  const bord = iso < colonnes[0].debut ? 0 : n - 1, c = colonnes[bord], jc = joursDeColonne(c);
  if (jc === 1) return bord + (j - jourReel(c.debut));
  if (jc === 7) return bord + Math.floor((j - jourReel(c.debut)) / 7);
  const mois = (s: string) => Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7));
  return bord + mois(iso) - mois(c.debut);
}
