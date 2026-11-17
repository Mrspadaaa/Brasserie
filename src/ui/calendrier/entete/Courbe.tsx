import React, { useEffect, useId, useState } from 'react';
import { ajouterJours, francs, francsSignes, jourLisible } from '../../../domain/calendrier';
import type { SoldeSemaine } from '../../../domain/calendrierCaisse';

/**
 * La courbe de l'en-tête (E02, z2s/w3s) : libre et caisse sur 52 semaines, un point par semaine, les mouvements nommés avec leur montant,
 * un seul rang de noms, les mois sous la courbe. SVG écrit à la main (MISSION § État de l'art) : la courbe doit tomber au pixel sur les
 * colonnes de la frise, porter la fenêtre et la lecture au doigt ; `recharts` n'est pas utilisé ici.
 *
 * Ce module porte aussi les types et les calculs purs que les autres pièces de l'en-tête partagent (montants, creux, causes du creux,
 * placement des noms). Les montants sont des centimes ; l'inconnu n'est jamais 0 (une semaine sans variation connue rend `null`).
 */

/** Les types sont ceux du domaine (lot A) : le modèle de la caisse est la seule source des montants et des semaines. */
export type { SoldeSemaine, MouvementNomme } from '../../../domain/calendrierCaisse';

/* ---------- montants et dates (une seule façon de les dire : celle du domaine) ---------- */

/** Des centimes en francs entiers, « 2 800 », « −1 800 ». */
export const chf = (centimes: number): string => francs(centimes);
/** « +988 », « −56 » : le signe est toujours dit (0 se dit « 0 »). */
export const sg = (centimes: number): string => (centimes === 0 ? '0' : francsSignes(centimes));
export { ajouterJours };
export const MOIS_MIN = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;
/** Mois (0 à 11) d'une semaine : celui de son jeudi, comme la semaine ISO. */
export const moisDeSemaine = (lundi: string): number => new Date(Date.parse(`${ajouterJours(lundi, 3)}T00:00:00Z`)).getUTCMonth();
/** « 22 mars » */
export const jourCourt = (jour: string): string => jourLisible(jour);

/* ---------- lectures de la courbe ---------- */

/** Variation de la semaine `i` (la somme de ses mouvements, tendance comprise, du domaine) ; `null` quand elle est nulle : rien à dire. */
export function variation(courbe: readonly SoldeSemaine[], i: number): number | null {
  const s = courbe[i];
  return s && s.variation !== 0 ? s.variation : null;
}

/** « À dépenser sans passer sous 0 » : le plus bas de la courbe libre, de la première semaine à la dernière, avec sa semaine (le creux). */
export function creuxDe(courbe: readonly SoldeSemaine[]): { index: number; numero: number; lundi: string; centimes: number } | null {
  if (!courbe.length) return null;
  let m = 0;
  for (let i = 1; i < courbe.length; i++) if (courbe[i].libre < courbe[m].libre) m = i;
  return { index: m, numero: courbe[m].numero, lundi: courbe[m].lundi, centimes: courbe[m].libre };
}

export interface CauseCreux { index: number; numero: number; nom: string; centimes: number }
/**
 * Les causes du creux (q5) : les sorties nommées entre le dernier sommet qui précède le creux et le creux. Le sommet est le plus haut de la
 * courbe libre avant le creux ; la descente commence à la semaine d'après.
 */
export function causesDuCreux(courbe: readonly SoldeSemaine[], creux: number): { debut: number; causes: CauseCreux[] } {
  let sommet = -1;
  for (let i = 0; i < creux; i++) if (sommet < 0 || courbe[i].libre >= courbe[sommet].libre) sommet = i;
  const causes: CauseCreux[] = [];
  for (let i = sommet + 1; i <= creux; i++) {
    for (const m of courbe[i]?.mouvements ?? []) if (m.centimes < 0) causes.push({ index: i, numero: courbe[i].numero, nom: m.nom, centimes: m.centimes });
  }
  // Les plus lourdes d'abord si elles sont trop nombreuses, puis dans l'ordre des semaines.
  const retenues = causes.length > 6 ? [...causes].sort((a, b) => a.centimes - b.centimes).slice(0, 6).sort((a, b) => a.index - b.index) : causes;
  return { debut: causes.length ? retenues[0].index : creux, causes: retenues };
}

/** Rangée (id libre de A) vers un nom de classe : sans accent, en minuscules ; inconnue → `autre`. */
export function classeRangee(rangee?: string): string {
  const r = (rangee ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const id of ['brassin', 'fete', 'vente', 'achat', 'travaux', 'activite', 'papier']) if (r.includes(id)) return id;
  return 'autre';
}

/* ---------- géométrie ---------- */

export interface Geo {
  largeur: number;
  hauteur: number;
  haut: number;
  bas: number;
  unit: number;
  lo: number;
  hi: number;
  x: (i: number) => number;
  y: (v: number) => number;
}
/** Échelle partagée par la courbe et ses surcouches : x par semaine (largeur / n), y par montant, 0 inclus. */
export function geometrie(valeurs: readonly number[], n: number, largeur: number, hauteur: number, haut: number, bas: number): Geo {
  const lo = Math.min(0, ...valeurs);
  let hi = Math.max(1, ...valeurs);
  hi = hi + (hi - lo) * 0.04;
  const unit = largeur / Math.max(1, n);
  return { largeur, hauteur, haut, bas, unit, lo, hi, x: i => i * unit, y: v => bas - ((v - lo) / (hi - lo)) * (bas - haut) };
}

/** Chemin en escalier : une marche par semaine, à la hauteur de sa valeur. */
export function escalier(valeurs: readonly number[], g: Geo, debut = 0): string {
  let d = '';
  valeurs.forEach((v, k) => {
    const y = g.y(v).toFixed(1), x0 = g.x(debut + k).toFixed(1), x1 = g.x(debut + k + 1).toFixed(1);
    d += k === 0 ? `M${x0} ${y}H${x1}` : `V${y}H${x1}`;
  });
  return d;
}
/** Le même escalier, parcouru de droite à gauche (pour fermer une zone entre deux courbes). */
function escalierInverse(valeurs: readonly number[], g: Geo, debut = 0): string {
  let d = '';
  for (let k = valeurs.length - 1; k >= 0; k--) {
    const y = g.y(valeurs[k]).toFixed(1);
    d += `L${g.x(debut + k + 1).toFixed(1)} ${y}L${g.x(debut + k).toFixed(1)} ${y}`;
  }
  return d;
}
export const zoneEscalier = (haute: readonly number[], basse: readonly number[], g: Geo, debut = 0) => `${escalier(haute, g, debut)}${escalierInverse(basse, g, debut)}Z`;

/* ---------- placement des noms ---------- */

export interface Boite { l: number; r: number; t: number; b: number }
/**
 * Une étiquette posée. `genre: 'mouvement'` : « Frigo −1 800 » (nom en regular, montant en gras, comme z2s) ; `genre: 'mise'` : le carré hachuré
 * et « 1 140 mis de côté pour Frigo ». Toujours sur UNE ligne (jamais un nom coupé), toujours contre sa marche : `x` est l'abscisse d'ancrage du
 * texte, à 3 px de la marche, son début (`ancre: 'start'`, le nom à droite) ou sa fin (`'end'`, le nom à gauche). Aucun trait de rappel.
 */
export interface Etiquette {
  genre: 'mouvement' | 'mise';
  i: number; nom: string; montant: string; x: number; y: number; ancre: 'start' | 'end' | 'middle'; neg: boolean;
  boite: Boite;
  /** Toutes les semaines où ce nom revient (un récurrent n'est nommé qu'une fois, D-183). */
  semaines: number[];
  /** Une chose étoilée (E31) : « ★ Hotte −900 », posée la première. */
  etoile: boolean;
}
/** Une chose étoilée sur la courbe : le nom de son mouvement (ou son titre, si elle n'en a pas) et sa semaine (index dans la courbe). */
export interface EtoileCourbe { nom: string; i: number }
/** Hauteur d'une ligne de nom (texte de 14 px) et écart entre deux lignes. */
export const LIGNE_NOM = 16;
/** Pas vertical des places essayées, et écart vertical maximal entre un nom et sa marche (au-delà, il n'est plus « sur sa marche »). */
const PAS_Y = 1;
const LOIN_MARCHE = 44;
/** La mise de côté (E03) doit se lire : toute la hauteur lui est ouverte, au plus près de sa zone hachurée. */
const LOIN_MISE_MAX = Infinity;
const croise = (a: Boite, b: Boite, m = 2) => !(a.r + m <= b.l || a.l >= b.r + m || a.b + m <= b.t || a.t >= b.b + m);
export const boitesSeCroisent = (a: Boite, b: Boite): boolean => croise(a, b, 0);

/* La largeur d'un texte de 14 px : mesurée par le canevas du navigateur (la police réelle de l'app), estimée hors navigateur (jsdom, tests). */
let canevas: CanvasRenderingContext2D | null | undefined;
function contexte(): CanvasRenderingContext2D | null {
  if (canevas !== undefined) return canevas;
  canevas = null;
  try {
    if (typeof document !== 'undefined' && typeof navigator !== 'undefined' && !/jsdom/i.test(navigator.userAgent)) canevas = document.createElement('canvas').getContext('2d');
  } catch { canevas = null; }
  return canevas;
}
export function largeurTexte(t: string, gras = false): number {
  const c = contexte();
  if (c) {
    const famille = getComputedStyle(document.body).fontFamily || 'sans-serif';
    c.font = `${gras ? 700 : 400} 14px ${famille}`;
    return Math.ceil(c.measureText(t).width) + 4;
  }
  // Hors navigateur : la chasse moyenne de Source Sans 3 à 14 px, mesurée au banc le 17.11 (« Embouteilleuse −2 800 » : 132 px au canevas).
  return Math.ceil(t.length * (gras ? 7.0 : 6.4)) + 4;
}
/** « Frigo −1 800 » : le nom en regular, une espace, le montant en gras ; « ★ » devant une chose étoilée. */
const largeurNom = (nom: string, montant: string, etoile: boolean) => (etoile ? largeurTexte('★ ') : 0) + largeurTexte(montant ? `${nom} ` : nom) + (montant ? largeurTexte(montant, true) : 0);

export interface MisePlacee { i: number; centimes: number; titres: readonly string[] }
/** Les deux textes de la mise de côté, le plus complet d'abord (z2s : « 1 140 mis de côté pour le frigo »). */
export function textesMise(m: MisePlacee): string[] {
  const pour = m.titres.length ? ` pour ${m.titres.join(', ')}` : '';
  return [`${chf(m.centimes)} mis de côté${pour}`, `${chf(m.centimes)} mis de côté`];
}
/** Le carré hachuré de la mise de côté (12 px) et son écart au texte. */
const CARRE_MISE = 16;

/** Le tracé (libre et caisse, marches comprises) touche-t-il cette boîte ? Un nom ne se pose jamais dessus (CRITIQUE-3 n° 17). */
function toucheLeTrace(courbe: readonly SoldeSemaine[], g: Geo, b: Boite, marge = 0.5): boolean {
  const t = b.t - marge, bb = b.b + marge, l = b.l - marge, r = b.r + marge;
  const j0 = Math.max(0, Math.floor(l / g.unit)), j1 = Math.min(courbe.length - 1, Math.floor(r / g.unit));
  for (const serie of ['libre', 'caisse'] as const) {
    for (let j = j0; j <= j1; j++) {
      const y = g.y(courbe[j][serie]);
      if (y >= t && y <= bb) return true;
      if (j > 0) {
        const x = g.x(j), a = g.y(courbe[j - 1][serie]);
        if (x >= l && x <= r && Math.min(a, y) <= bb && Math.max(a, y) >= t) return true;
      }
    }
  }
  return false;
}

/**
 * Noms posés sur leur marche, comme z2s : placement glouton sans chevauchement (méthode standard d'annotation, MISSION § État de l'art).
 * - un mouvement n'est nommé qu'une fois : un récurrent (« Loyer du local », 12 fois) l'est à sa première semaine ;
 * - texte de 14 px, nom en regular et montant en gras, sur UNE ligne, jamais coupé ;
 * - une chose étoilée d'abord (« ★ Hotte −900 »), puis la mise de côté (E03 la veut lisible), puis les plus gros ;
 * - chaque nom est ancré à 3 px de sa marche (à droite ou à gauche d'elle), à la hauteur libre la plus proche de la marche : son abscisse reste
 *   celle de sa semaine, aucun trait de rappel, aucune liste empilée ;
 * - jamais sur le tracé (libre, caisse, leurs marches), ni sur un autre nom, ni sur une exclusion (les barres des poignées, l'étiquette de la
 *   fenêtre, le point du creux, le chiffre clé).
 * Un nom qui ne tient pas n'est pas posé : sa marche reste, la lecture au doigt le nomme (c2-b).
 */
export function placerNoms(courbe: readonly SoldeSemaine[], g: Geo, max: number, exclusions: readonly Boite[] = [], mise: MisePlacee | null = null, etoiles: readonly EtoileCourbe[] = [],
  lignesSous: readonly number[] = []): Etiquette[] {
  type Article = { genre: 'mouvement' | 'mise'; i: number; nom: string; centimes: number | null; semaines: number[]; etoile: boolean };
  const parNom = new Map<string, Article>();
  courbe.forEach((s, i) => s.mouvements.forEach(m => {
    // Un montant inconnu ou de moins d'un franc ne se nomme pas « 0 » (l'inconnu n'est jamais 0) : la frise le montre, sans chiffre.
    if (Math.round(Math.abs(m.centimes) / 100) === 0) return;
    const deja = parNom.get(m.nom);
    if (deja) { if (!deja.semaines.includes(s.numero)) deja.semaines.push(s.numero); return; }
    parNom.set(m.nom, { genre: 'mouvement', i, nom: m.nom, centimes: m.centimes, semaines: [s.numero], etoile: false });
  }));
  // Une chose étoilée : son mouvement nommé, ou son titre seul à sa semaine (sans montant : rien n'est inventé).
  for (const e of etoiles) {
    const a = parNom.get(e.nom);
    if (a) a.etoile = true;
    else if (courbe[e.i]) parNom.set(e.nom, { genre: 'mouvement', i: e.i, nom: e.nom, centimes: null, semaines: [courbe[e.i].numero], etoile: true });
  }
  const poids = (a: Article) => Math.abs(a.centimes ?? 0);
  const articles = [...parNom.values()].sort((a, b) => Number(b.etoile) - Number(a.etoile) || poids(b) - poids(a) || a.i - b.i);
  if (mise && mise.centimes > 0) {
    const etoilees = articles.filter(a => a.etoile).length;
    articles.splice(Math.min(etoilees, articles.length), 0, { genre: 'mise', i: mise.i, nom: '', centimes: mise.centimes, semaines: [], etoile: false });
  }

  const pris: Boite[] = [...exclusions];
  const sortie: Etiquette[] = [];
  const lignes: number[] = [];
  // La ligne de base d'un nom : sa boîte (le texte de 14 px) va de y − 11 à y + 3.
  for (let y = g.haut + 12; y + 3 <= g.bas - 2; y += PAS_Y) lignes.push(y);
  // La rangée sous le tracé (celle des mois), comme z2s y pose « Six fûts inox −1 080 » : entre les mois, que l'appelant passe en exclusions.
  lignes.push(...lignesSous);

  for (const m of articles) {
    if (sortie.filter(e => !e.etoile).length >= max && !m.etoile) break;
    const s = courbe[m.i];
    if (!s) continue;
    const mouvement = m.genre === 'mouvement';
    const xm = g.x(m.i) + (mouvement ? 0 : g.unit / 2);
    // La marche : de l'ancien niveau au nouveau (la mise de côté : la zone hachurée de sa semaine).
    const ya = mouvement && m.i > 0 ? g.y(courbe[m.i - 1].libre) : g.y(s.libre);
    const yb = mouvement ? g.y(s.libre) : g.y(s.caisse);
    const marcheT = Math.min(ya, yb), marcheB = Math.max(ya, yb);
    // Une chose étoilée doit se voir : toute la hauteur lui est ouverte, et son nom seul (sans montant) si le nom entier ne tient pas.
    const loin = m.etoile ? Infinity : mouvement ? LOIN_MARCHE : LOIN_MISE_MAX;
    const montant = mouvement && m.centimes !== null ? sg(m.centimes) : '';
    const formes = mouvement
      ? [{ nom: m.nom, montant, w: largeurNom(m.nom, montant, m.etoile) }, ...(m.etoile && montant ? [{ nom: m.nom, montant: '', w: largeurNom(m.nom, '', true) }] : [])]
      : textesMise({ i: m.i, centimes: m.centimes ?? 0, titres: mise?.titres ?? [] }).map(t => ({ nom: t, montant: '', w: CARRE_MISE + largeurTexte(t) }));
    // À droite de la marche, à gauche, ou centré au-dessus (ou au-dessous) d'elle : l'abscisse d'ancrage reste celle de sa semaine. La mise de
    // côté n'a pas de marche : elle se pose sur sa zone hachurée, à la semaine la plus proche de la sienne où elle tient.
    const ancres: Etiquette['ancre'][] = xm < g.largeur / 2 ? ['start', 'end', 'middle'] : ['end', 'start', 'middle'];
    const colonnes = mouvement ? [m.i] : courbe.map((x, k) => k).filter(k => courbe[k].caisse - courbe[k].libre > 1).sort((a, b) => Math.abs(a - m.i) - Math.abs(b - m.i));
    let pose: Etiquette | null = null;
    for (const f of formes) {
      const candidats: { ecart: number; y: number; ancre: Etiquette['ancre']; ordre: number; xk: number; rang: number }[] = [];
      colonnes.forEach((k, rang) => {
        const xk = mouvement ? xm : g.x(k) + g.unit / 2;
        const mt = mouvement ? marcheT : Math.min(g.y(courbe[k].libre), g.y(courbe[k].caisse)), mb = mouvement ? marcheB : Math.max(g.y(courbe[k].libre), g.y(courbe[k].caisse));
        for (const y of lignes) {
          const t = y - 11, b = y + 3;
          const ecart = b < mt ? mt - b : t > mb ? t - mb : 0;
          if (ecart > loin) continue;
          ancres.forEach((ancre, ordre) => candidats.push({ ecart, y, ancre, ordre, xk, rang }));
        }
      });
      candidats.sort((a, b) => a.rang - b.rang || a.ecart - b.ecart || a.ordre - b.ordre);
      for (const c of candidats) {
        const x = c.ancre === 'start' ? c.xk + 3 : c.ancre === 'end' ? c.xk - 3 : c.xk;
        const l = c.ancre === 'start' ? x : c.ancre === 'end' ? x - f.w : x - f.w / 2;
        const bo: Boite = { l, r: l + f.w, t: c.y - 11, b: c.y + 3 };
        if (bo.l < 2 || bo.r > g.largeur - 2) continue;
        // Deux noms sur une même ligne gardent 8 px entre eux (on lit où l'un finit) ; les lignes voisines, 2 px.
        if (pris.some(p => croise(p, bo) || (p.t < bo.b && bo.t < p.b && !(p.r + 8 <= bo.l || bo.r + 8 <= p.l)))) continue;
        if (toucheLeTrace(courbe, g, bo)) continue;
        pose = { genre: m.genre, i: m.i, nom: f.nom, montant: f.montant, x, y: c.y, ancre: c.ancre, neg: (m.centimes ?? 0) < 0, boite: bo, semaines: m.semaines, etoile: m.etoile };
        break;
      }
      if (pose) break;
    }
    if (pose) { pris.push(pose.boite); sortie.push(pose); }
  }
  return sortie;
}

/** L'étiquette de la fenêtre (« S47 – S52 », « nov. – oct. ») : une ligne si elle tient dans le cadre, sinon deux (« S47 – » puis « S52 », z2s). */
export function lignesEtiquette(texte: string, largeurCadre: number): string[] {
  if (largeurTexte(texte, true) <= largeurCadre - 6) return [texte];
  const k = texte.indexOf(' – ');
  return k < 0 ? [texte] : [`${texte.slice(0, k)} –`, texte.slice(k + 3)];
}
/** La boîte de l'étiquette de la fenêtre, centrée en bas du cadre (obstacle pour les noms). */
export function boiteEtiquette(texte: string, gauche: number, largeurCadre: number, bas: number): Boite {
  const lignes = lignesEtiquette(texte, largeurCadre);
  const w = Math.max(...lignes.map(l => largeurTexte(l, true)));
  const centre = gauche + largeurCadre / 2;
  return { l: centre - w / 2, r: centre + w / 2, t: bas - 2 - lignes.length * LIGNE_NOM, b: bas };
}

/** Écart minimal entre deux libellés de mois (CRITIQUE-3 n° 33). */
export const ECART_MOIS = 24;
/** Jour du mois du jeudi d'une semaine. */
const jourDuJeudi = (lundi: string): number => Number(ajouterJours(lundi, 3).slice(8, 10));
/**
 * Les mois sous la courbe, réguliers (CRITIQUE-3 n° 33) : un libellé par mois, au lundi de sa première semaine (le mois d'une semaine est celui
 * de son jeudi). Si deux libellés voisins laissent moins de 24 px entre eux, on n'en garde qu'un sur deux, puis un sur trois… toujours au
 * même pas : jamais « déc. janv. mars mai juil. août ».
 */
export function etiquettesMois(courbe: readonly SoldeSemaine[], g: Geo): { x: number; texte: string }[] {
  const debuts: { i: number; m: number }[] = [];
  let m0 = -1;
  courbe.forEach((s, i) => {
    const m = moisDeSemaine(s.lundi);
    if (m === m0) return;
    m0 = m;
    // La première semaine ne porte son mois que si elle en est la première (sinon le mois a commencé avant la courbe).
    if (i > 0 || jourDuJeudi(s.lundi) <= 7) debuts.push({ i, m });
  });
  const tous = debuts.map(d => ({ x: g.x(d.i) + 3, texte: MOIS_MIN[d.m] as string })).map(e => ({ ...e, w: largeurTexte(e.texte) }));
  for (let pas = 1; pas <= 6; pas++) {
    const pris = tous.filter((_, k) => k % pas === 0).filter(e => e.x + e.w <= g.largeur);
    if (pris.every((e, k) => k === 0 || e.x - (pris[k - 1].x + pris[k - 1].w) >= ECART_MOIS)) return pris.map(({ x, texte }) => ({ x, texte }));
  }
  return [];
}

/* ---------- le composant ---------- */

export interface CourbeProps {
  courbe: readonly SoldeSemaine[];
  largeur: number;
  hauteur: number;
  /** Semaine lue au doigt (c2-b) : le curseur passe sous les noms. */
  curseur?: number | null;
  reference?: React.Ref<HTMLDivElement>;
  /** Poignées du doigt (usePointeurCourbe). */
  gestes?: React.HTMLAttributes<HTMLDivElement>;
  /** La fenêtre posée sur la courbe : son cadre et son étiquette (« S47 – S52 », « nov. – oct. ») sont des obstacles pour les noms. */
  cadre?: { index: number; nombre: number; etiquette?: string };
  /** La mise de côté nommée sur la courbe (E03) : sa semaine, son montant, pour quoi. */
  mise?: MisePlacee | null;
  /** Les mois sous la courbe ; `false` dans l'année, où la bande des 12 mois est la seule échelle (D-168, CRITIQUE-3 n° 11). */
  mois?: boolean;
  /** Les choses étoilées, sur leur marche (« ★ Hotte −900 »). */
  etoiles?: readonly EtoileCourbe[];
  /** Pendant le tirage d'une poignée, la place de l'étiquette qui suit le doigt : les noms qu'elle couvrirait s'effacent le temps du geste. */
  masque?: Boite | null;
  /** La fenêtre posée sur la courbe. */
  children?: React.ReactNode;
}

/** Hauteur de la rangée des mois sous le tracé (texte de 14 px). */
export const HAUTEUR_MOIS = 18;
/** Au plus 8 noms, comme z2s, à 390 comme à 1280 : au-delà, « trop d'info sur le graph » (CRITIQUE-2 n° 10). */
export const maxNoms = (largeur: number) => Math.max(4, Math.min(8, Math.floor(largeur / 48)));

/**
 * Les obstacles des noms : les barres des poignées (la zone de prise est transparente, un nom peut passer sous elle), les bords haut et bas du
 * cadre, son étiquette, et le point du creux. Un nom peut croiser le trait vertical du cadre : la marche d'une chose de la fenêtre est dedans.
 */
export function obstaclesCourbe(g: Geo, cadre: CourbeProps['cadre'], creux: { index: number; centimes: number } | null): Boite[] {
  const obstacles: Boite[] = [];
  if (cadre) {
    const l = g.x(cadre.index), r = g.x(cadre.index + cadre.nombre);
    const milieu = (g.haut + g.bas) / 2;
    for (const bord of [l, r]) obstacles.push({ l: bord - 6, r: bord + 6, t: milieu - 16, b: milieu + 16 });
    // Les bords haut et bas du cadre (2 px de trait).
    obstacles.push({ l, r, t: g.haut, b: g.haut + 2 }, { l, r, t: g.bas - 2, b: g.bas });
    if (cadre.etiquette) obstacles.push(boiteEtiquette(cadre.etiquette, l, r - l, g.bas));
  }
  if (creux) obstacles.push({ l: g.x(creux.index) + g.unit / 2 - 9, r: g.x(creux.index) + g.unit / 2 + 9, t: g.y(creux.centimes) - 9, b: g.y(creux.centimes) + 9 });
  return obstacles;
}

export function Courbe({ courbe, largeur, hauteur, curseur = null, reference, gestes, cadre, mise = null, mois: avecMois = true, etoiles, masque = null, children }: CourbeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // La police réelle arrive après le premier rendu : les noms se replacent avec ses vraies largeurs.
  const [, setPolice] = useState(0);
  useEffect(() => {
    const f = typeof document !== 'undefined' ? (document as Document & { fonts?: FontFaceSet }).fonts : undefined;
    let vivant = true;
    f?.ready?.then(() => { if (vivant) setPolice(p => p + 1); }).catch(() => undefined);
    return () => { vivant = false; };
  }, []);
  const n = courbe.length;
  const g = geometrie(courbe.flatMap(s => [s.libre, s.caisse]), n, largeur, hauteur, 4, hauteur - HAUTEUR_MOIS);
  const libres = courbe.map(s => s.libre), caisses = courbe.map(s => s.caisse);
  const creux = creuxDe(courbe);
  const causes = creux ? causesDuCreux(courbe, creux.index) : null;
  const misDeCote = courbe.some(s => s.caisse - s.libre > 1);
  const mois = avecMois ? etiquettesMois(courbe, g) : [];
  // Les mois d'abord : un nom peut se poser dans leur rangée, entre deux mois, à 8 px d'eux.
  const boitesMois = mois.map(m => ({ l: m.x - 8, r: m.x + largeurTexte(m.texte) + 8, t: hauteur - 14, b: hauteur }));
  const noms = placerNoms(courbe, g, maxNoms(largeur), [...obstaclesCourbe(g, cadre, creux), ...boitesMois], mise, etoiles, [hauteur - 3]);
  const y0 = g.y(0);
  const marques = courbe.map((s, i) => ({ i, d: variation(courbe, i), nomme: s.mouvements.length > 0 })).filter(m => m.nomme && m.d !== null && m.d !== 0 && m.i > 0);
  const cache = (e: Etiquette) => !!masque && boitesSeCroisent(e.boite, masque);
  return (
    <div ref={reference} className="ent-cb" style={{ height: hauteur }} {...gestes}>
      <svg className="ent-svg" width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} role="img"
        aria-label={`Libre et caisse sur ${n} semaines${creux ? ` ; au plus serré en S${creux.numero} : ${chf(creux.centimes)} CHF` : ''} ; les mouvements sont nommés avec leur montant`}>
        <defs>
          <pattern id={`h${uid}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" className="ent-hach" /></pattern>
        </defs>
        {causes && creux && causes.causes.length > 0 && <rect className="ent-creux-zone" x={g.x(causes.debut)} y={g.haut} width={g.x(creux.index + 1) - g.x(causes.debut)} height={g.bas - g.haut} />}
        <path className="ent-aire" d={`${escalier(libres, g)}V${y0.toFixed(1)}H${g.x(0).toFixed(1)}Z`} />
        {misDeCote && <path className="ent-miscote" data-mise-de-cote="zone" d={zoneEscalier(caisses, libres, g)} fill={`url(#h${uid})`} />}
        <line className="ent-zero" x1={0} x2={largeur} y1={y0} y2={y0} />
        <path className="ent-caisse" d={escalier(caisses, g)} />
        <path className="ent-libre" d={escalier(libres, g)} />
        {marques.map(m => (
          <line key={`m${m.i}`} className={(m.d as number) < 0 ? 'ent-mk ent-mk-neg' : 'ent-mk ent-mk-pos'} x1={g.x(m.i)} x2={g.x(m.i)} y1={g.y(libres[m.i - 1])} y2={g.y(libres[m.i])} />
        ))}
        {/* Le curseur est tracé avant les noms : leur halo le coupe, il passe dessous (c2-b). */}
        {curseur !== null && curseur >= 0 && curseur < n && (
          <g className="ent-curseur" data-curseur aria-hidden="true">
            <line x1={g.x(curseur) + g.unit / 2} x2={g.x(curseur) + g.unit / 2} y1={g.haut} y2={y0} />
            <circle cx={g.x(curseur) + g.unit / 2} cy={g.y(libres[curseur])} r={12} className="ent-cur-anneau" />
            <circle cx={g.x(curseur) + g.unit / 2} cy={g.y(libres[curseur])} r={5.5} className="ent-cur-pt" />
          </g>
        )}
        {courbe.map((s, i) => <circle key={`p${s.lundi}`} className="ent-pt" data-point-semaine={s.numero} data-semaine={s.numero} cx={g.x(i) + g.unit / 2} cy={g.y(s.libre)} r={1.6} />)}
        {noms.map(e => (e.genre === 'mise' ? (
          <g key="mise" data-mise-de-cote="etiquette" className={cache(e) ? 'ent-mdc ent-nom-cache' : 'ent-mdc'} aria-hidden={cache(e) || undefined}>
            <rect x={e.boite.l + 1} y={e.y - 11} width={12} height={12} fill={`url(#h${uid})`} className="ent-mdc-c" />
            <text className="ent-nom ent-mdc-t" x={e.boite.l + CARRE_MISE} y={e.y}>{e.nom}</text>
            <title>{`${mise ? textesMise(mise)[0] : e.nom}${courbe[e.i] ? `, en S${courbe[e.i].numero}` : ''}`}</title>
          </g>
        ) : (
          // Le titre (la semaine, « 4 fois, dès S50 ») est à côté du texte, jamais dedans : le texte se lit « Frigo −1 800 », rien d'autre.
          <g key={`${e.i}-${e.nom}`} className={cache(e) ? 'ent-nom-g ent-nom-cache' : 'ent-nom-g'} data-nom-index={e.i} data-etoile={e.etoile ? 'oui' : undefined} aria-hidden={cache(e) || undefined}>
            <text className="ent-nom" data-nom-courbe x={e.x} y={e.y} textAnchor={e.ancre}>
              {e.etoile && <tspan className="ent-etoile">★ </tspan>}{e.nom}{e.montant ? ' ' : ''}{e.montant && <tspan className={e.neg ? 'ent-m' : 'ent-p'}>{e.montant}</tspan>}
            </text>
            <title>{`${e.etoile ? '★ ' : ''}${e.nom}${e.montant ? ` ${e.montant}` : ''}, ${e.semaines.length > 1 ? `${e.semaines.length} fois, dès S${e.semaines[0]}` : `S${e.semaines[0]}`}`}</title>
          </g>
        )))}
        {creux && <circle className="ent-creux-pt" cx={g.x(creux.index) + g.unit / 2} cy={g.y(creux.centimes)} r={5.5} />}
        {mois.map(m => <text key={m.x} className="ent-mois" x={m.x} y={hauteur - 3}>{m.texte}</text>)}
      </svg>
      {children}
    </div>
  );
}

/* ---------- la courbe zoomée pendant un geste de la frise (f1-a) ---------- */

export interface CourbeZoomProps {
  /** Les colonnes visibles : l'avant (pointillé), l'après (plein), en centimes. */
  avant: readonly number[];
  apres: readonly number[];
  largeur: number;
  hauteur: number;
}

/** Pas d'axe « rond » le plus petit qui garde au plus 2,2 graduations dans l'écart (reprise du jouable, en centimes). */
const PAS = [10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000];
export function CourbeZoom({ avant, apres, largeur, hauteur }: CourbeZoomProps) {
  const n = Math.min(avant.length, apres.length);
  const tout = [...avant.slice(0, n), ...apres.slice(0, n)];
  const lo0 = Math.min(...tout), hi0 = Math.max(...tout);
  const pas = PAS.find(p => (hi0 - lo0) / p <= 2.2) ?? 1000000;
  const lo = Math.floor(lo0 / pas) * pas - pas * 0.35, hi = Math.ceil(hi0 / pas) * pas + pas * 0.15;
  const haut = 20, bas = hauteur - 4;
  const unit = largeur / Math.max(1, n);
  const g: Geo = { largeur, hauteur, haut, bas, unit, lo, hi, x: i => i * unit, y: v => bas - ((v - lo) / (hi - lo)) * (bas - haut) };
  const graduations: number[] = [];
  for (let v = Math.ceil(lo / pas) * pas; v <= hi; v += pas) graduations.push(v);
  return (
    <svg className="ent-svg ent-zoom" width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label="La courbe zoomée sur les semaines visibles : avant en pointillé, après en plein">
      {Array.from({ length: n }, (_, i) => i).filter(i => apres[i] !== avant[i]).map(i => {
        const y1 = g.y(avant[i]), y2 = g.y(apres[i]);
        return <rect key={i} className={apres[i] < avant[i] ? 'ent-ecart ent-ecart-neg' : 'ent-ecart ent-ecart-pos'} x={g.x(i)} y={Math.min(y1, y2)} width={unit} height={Math.abs(y2 - y1)} />;
      })}
      {graduations.map(v => <line key={v} className="ent-grad" x1={0} x2={largeur} y1={g.y(v)} y2={g.y(v)} />)}
      <path className="ent-aire" d={`${escalier(apres.slice(0, n), g)}V${hauteur}H0Z`} />
      <path className="ent-avant" d={escalier(avant.slice(0, n), g)} />
      <path className="ent-apres" d={escalier(apres.slice(0, n), g)} />
      {graduations.filter(v => g.y(v) - 3 >= 15).map(v => <text key={`t${v}`} className="ent-axe" x={3} y={g.y(v) - 3}>{chf(v)}</text>)}
      <text className="ent-zleg" x={largeur - 4} y={14} textAnchor="end"><tspan className="ent-leg-av">- - avant</tspan>  <tspan className="ent-leg-ap">— après</tspan></text>
    </svg>
  );
}
