import React, { useEffect, useId, useState } from 'react';
import { ajouterJours, francs, francsSignes, jourLisible, semaineAvecAn } from '../../../domain/calendrier';
import { indexAujourdhui, type SoldeSemaine } from '../../../domain/calendrierCaisse';

/**
 * La courbe de l'en-tête (E02, z2s/w3s) : libre et caisse sur 52 semaines, un point par semaine, les mouvements nommés avec leur montant,
 * un seul rang de noms, les mois en haut de la courbe (w3s ; en portrait aussi depuis le paquet G n° 2 : une seule rangée d'axe, la bande des
 * semaines). SVG écrit à la main (MISSION § État de l'art) : la courbe doit tomber au pixel sur les
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

/** CAL-PASSE : l'index d'aujourd'hui dans la courbe (le passé la précède : `courbe[0]` n'est plus aujourd'hui). */
export const aujourdhuiDe = (courbe: readonly SoldeSemaine[]): number => indexAujourdhui(courbe);

/**
 * « À dépenser sans passer sous 0 » : le plus bas de la courbe libre, d'AUJOURD'HUI à la dernière semaine, avec sa semaine (le creux). Le passé
 * (solde reconstruit des paiements réels) se lit sur la courbe mais n'est jamais « ce qu'on peut dépenser » : un solde plus bas il y a six mois
 * ne dit rien de l'argent libre aujourd'hui.
 */
export function creuxDe(courbe: readonly SoldeSemaine[]): { index: number; numero: number; lundi: string; centimes: number } | null {
  if (!courbe.length) return null;
  const a = aujourdhuiDe(courbe);
  let m = a;
  for (let i = a + 1; i < courbe.length; i++) if (courbe[i].libre < courbe[m].libre) m = i;
  return { index: m, numero: courbe[m].numero, lundi: courbe[m].lundi, centimes: courbe[m].libre };
}

/**
 * La semaine dite comme l'en-tête la dit (CRITIQUE-6 n° 1 et 18) : « S44 » dans l'année de `reference` (la semaine d'aujourd'hui de la courbe,
 * `aujourdhuiDe` ; pas `courbe[0]`, qui peut être au passé), « S44 ’27 » sinon. L'année est celle du jeudi de la semaine (ISO), comme `semaineAvecAn` du domaine, en forme courte.
 */
export function semaineCourte(lundi: string, reference: string): string {
  return semaineAvecAn(lundi, reference).replace(/ \d{2}(\d{2})$/, (_tout: string, an: string) => ` ’${an}`);
}

export interface CauseCreux { index: number; numero: number; lundi: string; nom: string; centimes: number }
/** Au plus 6 lignes de causes, comme z2s ; on ne remonte pas plus d'un trimestre avant le creux (13 semaines). */
export const CAUSES_MAX = 6;
export const RECUL_MAX = 13;
/**
 * Les causes du creux (E01, q5, CRITIQUE-6 n° 8) : les sorties de la semaine du creux, puis celles des semaines qui y mènent, en remontant
 * semaine par semaine depuis le creux ; jamais plus loin que le dernier sommet de la courbe libre avant lui, ni plus d'un trimestre. Rendues
 * dans l'ordre chronologique (semaine, puis la plus lourde d'abord). Les gros mouvements du début de l'horizon n'y entrent que s'ils sont
 * eux-mêmes juste avant le creux : sur une courbe qui ne fait que descendre, le « sommet » est la semaine 0, d'où le défaut corrigé.
 */
export function causesDuCreux(courbe: readonly SoldeSemaine[], creux: number): { debut: number; causes: CauseCreux[] } {
  // CAL-PASSE : les causes se cherchent à partir d'aujourd'hui ; le sommet de la semaine 0 d'avant (le passé) n'est pas un point de départ.
  const a = aujourdhuiDe(courbe);
  let sommet = -1;
  for (let i = a; i < creux; i++) if (sommet < 0 || courbe[i].libre >= courbe[sommet].libre) sommet = i;
  const borne = Math.max(a, sommet + 1, creux - RECUL_MAX + 1);
  const causes: CauseCreux[] = [];
  for (let i = creux; i >= borne; i--) {
    const s = courbe[i];
    if (!s) continue;
    const sorties = s.mouvements.filter(m => m.centimes < 0).sort((a, b) => a.centimes - b.centimes);
    // La semaine du creux passe toujours (ses plus lourdes si elle en a plus de 6) ; une semaine d'avant entre entière ou pas du tout.
    if (i === creux) { causes.push(...sorties.slice(0, CAUSES_MAX).map(m => ({ index: i, numero: s.numero, lundi: s.lundi, nom: m.nom, centimes: m.centimes }))); continue; }
    if (causes.length + sorties.length > CAUSES_MAX) break;
    causes.push(...sorties.map(m => ({ index: i, numero: s.numero, lundi: s.lundi, nom: m.nom, centimes: m.centimes })));
  }
  causes.sort((a, b) => a.index - b.index || a.centimes - b.centimes);
  return { debut: causes.length ? causes[0].index : creux, causes };
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
  const plusBas = Math.min(0, ...valeurs);
  let hi = Math.max(1, ...valeurs);
  hi = hi + (hi - plusBas) * 0.04;
  /* CAL-PASSE (20.11, « je suis en négatif et on le voit même pas sur le graph ») : un solde négatif se tracerait collé au bord bas du dessin (y = bas) et
     la ligne zéro au bord haut : une bande bleue sans rien qui dise « sous zéro ». Sous zéro, le domaine garde de l'air sous la valeur la plus
     basse (6 % de la hauteur), comme il en garde au-dessus (4 %) : le tracé ne touche plus le bord, la zone sous zéro se dessine. */
  const lo = plusBas < 0 ? plusBas - (hi - plusBas) * 0.06 : plusBas;
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
/**
 * D387, D388 : la même échelle en y, mais chaque semaine posée sur ses bords lus dans la frise (`alignement.ts`) ; `unit` est leur largeur moyenne.
 * Au-delà des bords donnés, x reste au dernier bord.
 */
export function avecAbscisses(g: Geo, abscisses: readonly number[]): Geo {
  const n = Math.max(1, abscisses.length - 1);
  const x = (i: number) => abscisses[Math.max(0, Math.min(abscisses.length - 1, i))] ?? 0;
  return { ...g, unit: (x(n) - x(0)) / n, x };
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
  /** Le nom entier, quand `nom` a été raccourci pour tenir (CAL-PASSE n° 7) : le titre de l'infobulle le garde. */
  complet?: string;
}
/** La boîte que le navigateur rend pour un texte de 14 px (Source Sans 3 : 14,3 px au-dessus de la ligne de base, 5,6 px dessous, mesuré par getBBox). */
export const HAUT_RENDU = 15;
export const BAS_RENDU = 5;
/** Les formes plus courtes d'un nom, de la moins coupée à la plus coupée : avant « · », puis les 14 premiers signes et « … ». */
export function raccourcir(nom: string): string[] {
  const sortie: string[] = [];
  const k = nom.indexOf(' · ');
  if (k > 3) sortie.push(nom.slice(0, k));
  if (nom.length > 18) sortie.push(`${nom.slice(0, 14).trimEnd()}…`);
  return sortie.filter((s, i) => s !== nom && sortie.indexOf(s) === i);
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
  /* CAL-PASSE (21.11, n° 7) : les boîtes RENDUES des noms posés (HAUT_RENDU + BAS_RENDU = 20 px, ce que mesurent getBBox et getBoundingClientRect), pas leur encre */
  const rendus: Boite[] = [];
  const sortie: Etiquette[] = [];
  const lignes: number[] = [];
  // La ligne de base d'un nom : son encre (le texte de 14 px) va de y − 11 à y + 3, sa boîte rendue de y − 15 à y + 5.
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
    /* CAL-PASSE (21.11, n° 7) : un nom qui ne tient pas se raccourcit (avant « · », puis coupé avec « … »), le montant gardé, avant de se taire */
    const raccourcis = mouvement ? raccourcir(m.nom) : [];
    const formes = mouvement
      ? [{ nom: m.nom, montant, w: largeurNom(m.nom, montant, m.etoile) },
        ...raccourcis.map(nom => ({ nom, montant, w: largeurNom(nom, montant, m.etoile) })),
        ...(m.etoile && montant ? [{ nom: m.nom, montant: '', w: largeurNom(m.nom, '', true) }] : [])]
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
        // Les exclusions (cadre, chiffre clé, mois…) : encre contre encre, 2 px. Deux noms : leurs boîtes RENDUES (20 px) ne se recouvrent pas, et sur
        // une même rangée (boîtes qui se chevauchent en hauteur) ils gardent 8 px entre eux (on lit où l'un finit).
        if (pris.some(p => croise(p, bo))) continue;
        const rendu: Boite = { l: bo.l, r: bo.r, t: c.y - HAUT_RENDU, b: c.y + BAS_RENDU };
        if (rendus.some(p => p.t < rendu.b && rendu.t < p.b && !(p.r + 8 <= rendu.l || rendu.r + 8 <= p.l))) continue;
        if (toucheLeTrace(courbe, g, bo)) continue;
        pose = { genre: m.genre, i: m.i, nom: f.nom, montant: f.montant, x, y: c.y, ancre: c.ancre, neg: (m.centimes ?? 0) < 0, boite: bo, semaines: m.semaines, etoile: m.etoile, complet: m.nom };
        break;
      }
      if (pose) break;
    }
    if (pose) { pris.push(pose.boite); rendus.push({ l: pose.boite.l, r: pose.boite.r, t: pose.y - HAUT_RENDU, b: pose.y + BAS_RENDU }); sortie.push(pose); }
  }
  return sortie;
}

/** L'étiquette de la fenêtre (« S47 – S52 », « nov. – oct. ») : une ligne si elle tient dans le cadre, sinon deux (« S47 – » puis « S52 », z2s). */
export function lignesEtiquette(texte: string, largeurCadre: number): string[] {
  if (largeurTexte(texte, true) <= largeurCadre - 6) return [texte];
  const k = texte.indexOf(' – ');
  return k < 0 ? [texte] : [`${texte.slice(0, k)} –`, texte.slice(k + 3)];
}
/** La place de l'étiquette de la fenêtre : centrée en bas du cadre (une ou deux lignes) ; quand le cadre est plus étroit que ses lignes
 *  (fenêtre de 2 semaines, D385), une ligne posée à côté du cadre, à droite si la courbe a la place, sinon à gauche, jamais hors de la courbe
 *  (au banc du 18.11, « S47 – S48 » centrée sur un cadre de 14 px sortait de l'écran). `l` est en px de la courbe. */
export function placeEtiquette(texte: string, gauche: number, largeurCadre: number, largeurCourbe: number): { lignes: string[]; l: number; w: number; dehors: boolean } {
  const lignes = lignesEtiquette(texte, largeurCadre);
  const w = Math.max(...lignes.map(t => largeurTexte(t, true)));
  if (w <= largeurCadre - 4) return { lignes, l: gauche + largeurCadre / 2 - w / 2, w, dehors: false };
  const w1 = largeurTexte(texte, true);
  const droite = gauche + largeurCadre + 4;
  const l = droite + w1 <= largeurCourbe ? droite : Math.max(0, gauche - 4 - w1);
  return { lignes: [texte], l, w: w1, dehors: true };
}
/** La boîte de l'étiquette de la fenêtre (obstacle pour les noms), à la place que lui donne `placeEtiquette`. */
export function boiteEtiquette(texte: string, gauche: number, largeurCadre: number, bas: number, largeurCourbe = Infinity): Boite {
  const p = placeEtiquette(texte, gauche, largeurCadre, largeurCourbe);
  return { l: p.l, r: p.l + p.w, t: bas - 2 - p.lignes.length * LIGNE_NOM, b: bas };
}

/** Écart minimal entre deux libellés de mois (CRITIQUE-3 n° 33). */
export const ECART_MOIS = 24;
/** T2B-2 (19.11, « déc. » coupé au bord) : un libellé de mois qui ne tient pas ENTIER avant le bord de la courbe ne s'écrit pas (ni coupé, ni orphelin). */
export const MARGE_BORD_MOIS = 4;
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
    const pris = tous.filter((_, k) => k % pas === 0).filter(e => e.x + e.w + MARGE_BORD_MOIS <= g.largeur);
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
  /**
   * Les mois EN HAUT de la courbe, dans son dessin, avec leur trait « |déc. » (w3s, paysage) ; le tracé commence dessous. Par défaut, les mois
   * sont sous la courbe (z2s, portrait).
   */
  moisEnHaut?: boolean;
  /**
   * Paquet E n° 2 (E10 : 120 px au plus en paysage) : en paysage aligné, la rangée du chiffre et des boutons se pose SUR la rangée des mois.
   * `hauteur` : celle de cette rangée partagée (le tracé commence dessous, rien ne passe sous le chiffre) ; `reserves` : les plages [x0, x1]
   * du chiffre et des boutons, en px de la courbe. Un mois dont le nom tombe sous le chiffre se pose juste à sa droite tant qu'il reste dans
   * son mois (étiquette collante, comme l'en-tête de mois d'une frise) ; sinon, et sous les boutons, il ne s'écrit pas (la bande le date).
   */
  rangeeHaute?: { hauteur: number; reserves: ReadonlyArray<readonly [number, number]> };
  /** D387 : les bords des semaines lus dans la frise (n + 1 valeurs, px de la courbe) ; absent : largeur / n. */
  abscisses?: readonly number[];
  /** D387 : le creux à marquer (index dans `courbe`) quand la courbe n'est qu'une part de l'année ; `null` : il est hors de la part. */
  creuxIndex?: number | null;
  /** Paquet G n° 1 : la courbe est plate (solde constant) ; l'en-tête la réduit, le cadre et ses poignées se serrent (`data-courbe-plate`). */
  plate?: boolean;
}

/** Paquet G n° 1 (CAL-PLACE-GACHEE) : la courbe est-elle plate, libre et caisse constants sur toutes ses semaines ? Rien à y lire. */
export function courbePlate(courbe: readonly SoldeSemaine[]): boolean {
  if (!courbe.length) return false;
  const { libre, caisse } = courbe[0];
  return courbe.every(s => s.libre === libre && s.caisse === caisse);
}

/** Hauteur de la rangée des mois posée en haut (paysage, w3s) : le tracé commence dessous. */
export const HAUTEUR_MOIS_HAUT = 18;

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
    if (cadre.etiquette) obstacles.push(boiteEtiquette(cadre.etiquette, l, r - l, g.bas, g.largeur));
  }
  if (creux) obstacles.push({ l: g.x(creux.index) + g.unit / 2 - 9, r: g.x(creux.index) + g.unit / 2 + 9, t: g.y(creux.centimes) - 9, b: g.y(creux.centimes) + 9 });
  return obstacles;
}

/**
 * Paquet E n° 2 : les mois dans une rangée haute partagée avec le chiffre et les boutons. Chaque nom de mois évite les `reserves` : sous l'une
 * d'elles, il glisse à sa droite s'il y tient avant le mois suivant (et avant le bord) ; sinon il part. `largeurNom` : la largeur du texte.
 */
export function moisHorsReserves(
  mois: ReadonlyArray<{ x: number; texte: string }>, reserves: ReadonlyArray<readonly [number, number]>, largeur: number,
  largeurNom: (t: string) => number = largeurTexte
): Array<{ x: number; texte: string; trait: boolean }> {
  const sous = (x0: number, x1: number) => reserves.find(([l, r]) => x1 > l - 6 && x0 < r + 6);
  const sortie: Array<{ x: number; texte: string; trait: boolean }> = [];
  mois.forEach((m, i) => {
    const w = largeurNom(m.texte);
    const fin = Math.min(largeur - 2, i + 1 < mois.length ? mois[i + 1].x - 10 : largeur - 2);
    let x = m.x;
    for (let essai = 0; essai < reserves.length + 1; essai++) {
      const r = sous(x - 4, x + w);
      if (!r) break;
      x = r[1] + 10;
    }
    if (x + w > fin || sous(x - 4, x + w)) return;
    sortie.push({ x, texte: m.texte, trait: x === m.x && !sous(m.x - 4, m.x - 2) });
  });
  return sortie;
}

export function Courbe({ courbe, largeur, hauteur, curseur = null, reference, gestes, cadre, mise = null, mois: avecMois = true, etoiles, masque = null, children, moisEnHaut = false, abscisses, creuxIndex, rangeeHaute, plate = false }: CourbeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // La police réelle arrive après le premier rendu : les noms se replacent avec ses vraies largeurs.
  const [, setPolice] = useState(0);
  useEffect(() => {
    const f = typeof document !== 'undefined' ? (document as Document & { fonts?: FontFaceSet }).fonts : undefined;
    let vivant = true;
    const replacer = () => { if (vivant) setPolice(p => p + 1); };
    f?.ready?.then(replacer).catch(() => undefined);
    /* CAL-PASSE (n° 7) : une graisse (le gras des montants) ne se charge qu'à son premier emploi, après `ready` : chaque chargement terminé replace les noms */
    f?.addEventListener?.('loadingdone', replacer);
    return () => { vivant = false; f?.removeEventListener?.('loadingdone', replacer); };
  }, []);
  const n = courbe.length;
  const g0 = moisEnHaut
    ? geometrie(courbe.flatMap(s => [s.libre, s.caisse]), n, largeur, hauteur, rangeeHaute ? rangeeHaute.hauteur + 2 : HAUTEUR_MOIS_HAUT, hauteur - 2)
    : geometrie(courbe.flatMap(s => [s.libre, s.caisse]), n, largeur, hauteur, 4, hauteur - HAUTEUR_MOIS);
  const g = abscisses && abscisses.length === n + 1 ? avecAbscisses(g0, abscisses) : g0;
  // La ligne de base des mois : en haut (w3s) ou sous le tracé (z2s) ; au milieu de la rangée haute partagée (paquet E n° 2).
  const yMois = rangeeHaute && moisEnHaut ? Math.round(rangeeHaute.hauteur / 2 + 5) : moisEnHaut ? 13 : hauteur - 3;
  const reservesHaut = rangeeHaute && moisEnHaut ? rangeeHaute.reserves.map(([l, r]) => ({ l: l - 4, r: r + 4, t: 0, b: rangeeHaute.hauteur })) : [];
  const libres = courbe.map(s => s.libre), caisses = courbe.map(s => s.caisse);
  const creux = creuxIndex === undefined ? creuxDe(courbe)
    : creuxIndex === null || !courbe[creuxIndex] ? null
      : { index: creuxIndex, numero: courbe[creuxIndex].numero, lundi: courbe[creuxIndex].lundi, centimes: courbe[creuxIndex].libre };
  const causes = creux ? causesDuCreux(courbe, creux.index) : null;
  const misDeCote = courbe.some(s => s.caisse - s.libre > 1);
  const mois0 = avecMois ? etiquettesMois(courbe, g) : [];
  const moisPose = rangeeHaute && moisEnHaut ? moisHorsReserves(mois0, rangeeHaute.reserves, largeur) : mois0.map(m => ({ ...m, trait: true }));
  /* T2B-2 : jamais un libellé coupé au bord, quelle que soit la route (colonne du chiffre, abscisses de la frise) */
  const mois = moisPose.filter(m => m.x >= 0 && m.x + largeurTexte(m.texte) + MARGE_BORD_MOIS <= largeur);
  // Les mois d'abord : un nom peut se poser dans leur rangée, entre deux mois, à 8 px d'eux.
  const boitesMois = mois.map(m => ({ l: m.x - 8, r: m.x + largeurTexte(m.texte) + 8, t: yMois - HAUT_RENDU, b: yMois + BAS_RENDU + 2 }));
  // Un nom peut se poser dans la rangée des mois, entre deux mois (z2s « Six fûts inox −1 080 », w3s « Festival +2 450 »).
  const noms = placerNoms(courbe, g, maxNoms(largeur), [...obstaclesCourbe(g, cadre, creux), ...boitesMois, ...reservesHaut], mise, etoiles, [yMois]);
  const y0 = g.y(0);
  /* le solde passe sous zéro quelque part : la ligne zéro se lit et la zone en dessous se teinte */
  const sousZero = g.lo < 0;
  const marques = courbe.map((s, i) => ({ i, d: variation(courbe, i), nomme: s.mouvements.length > 0 })).filter(m => m.nomme && m.d !== null && m.d !== 0 && m.i > 0);
  const cache = (e: Etiquette) => !!masque && boitesSeCroisent(e.boite, masque);
  // La ★ d'une chose étoilée dont le nom n'a pas trouvé de place : au milieu de sa semaine, juste au-dessus de sa marche (dans le dessin).
  const marquesEtoiles = (etoiles ?? []).filter(e => courbe[e.i] && !noms.some(x => x.etoile && x.i === e.i))
    .map(e => ({ ...e, x: g.x(e.i) + g.unit / 2, y: Math.max(g.haut + 14, Math.min(g.bas - 2, g.y(courbe[e.i].libre) - 5)) }));
  return (
    <div ref={reference} className="ent-cb" style={{ height: hauteur }} data-courbe-alignee={abscisses ? '' : undefined} data-courbe-semaines={courbe.map(s => s.numero).join(' ')}
      data-mois-haut={moisEnHaut ? '' : undefined} data-courbe-plate={plate ? '' : undefined} {...gestes}>
      <svg className="ent-svg" width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} role="img"
        aria-label={`Libre et caisse sur ${n} semaines${creux ? ` ; au plus serré en S${creux.numero} : ${chf(creux.centimes)} CHF` : ''} ; les mouvements sont nommés avec leur montant`}>
        <defs>
          <pattern id={`h${uid}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" className="ent-hach" /></pattern>
          <clipPath id={`z${uid}`}><rect x={0} y={0} width={largeur} height={hauteur} /></clipPath>
          {sousZero && <clipPath id={`zn${uid}`}><rect x={0} y={y0} width={largeur} height={Math.max(0, hauteur - y0)} /></clipPath>}
          {sousZero && <clipPath id={`zp${uid}`}><rect x={0} y={0} width={largeur} height={Math.max(0, y0)} /></clipPath>}
        </defs>
        {/* CAL-PASSE : sous zéro, la zone en dessous de la ligne zéro est teintée (comme la zone du creux de r6b) et l'aire sous zéro est rouge */}
        {sousZero && <rect className="ent-neg-zone" data-sous-zero="zone" x={0} y={y0} width={largeur} height={Math.max(0, g.bas - y0)} />}
        {causes && creux && causes.causes.length > 0 && <rect className="ent-creux-zone" x={g.x(causes.debut)} y={g.haut} width={g.x(creux.index + 1) - g.x(causes.debut)} height={g.bas - g.haut} />}
        {sousZero
          ? <>
            <path className="ent-aire" clipPath={`url(#zp${uid})`} d={`${escalier(libres, g)}V${y0.toFixed(1)}H${g.x(0).toFixed(1)}Z`} />
            <path className="ent-aire ent-aire-neg" data-sous-zero="aire" clipPath={`url(#zn${uid})`} d={`${escalier(libres, g)}V${y0.toFixed(1)}H${g.x(0).toFixed(1)}Z`} />
          </>
          : <path className="ent-aire" d={`${escalier(libres, g)}V${y0.toFixed(1)}H${g.x(0).toFixed(1)}Z`} />}
        {misDeCote && <path className="ent-miscote" data-mise-de-cote="zone" d={zoneEscalier(caisses, libres, g)} fill={`url(#h${uid})`} />}
        <line className={sousZero ? 'ent-zero ent-zero-neg' : 'ent-zero'} data-ligne-zero={sousZero ? 'visible' : undefined} x1={0} x2={largeur} y1={y0} y2={y0} />
        {sousZero && <text className="ent-zero-l" data-sous-zero="repere" x={largeur - 3} y={y0 - 3} textAnchor="end" aria-hidden="true">0</text>}
        <path className="ent-caisse" d={escalier(caisses, g)} />
        <path className="ent-libre" d={escalier(libres, g)} />
        {marques.map(m => (
          <line key={`m${m.i}`} className={(m.d as number) < 0 ? 'ent-mk ent-mk-neg' : 'ent-mk ent-mk-pos'} x1={g.x(m.i)} x2={g.x(m.i)} y1={g.y(libres[m.i - 1])} y2={g.y(libres[m.i])} />
        ))}
        {/* Le curseur est tracé avant les noms, et son trait s'interrompt au passage de chacun (c2-b, E11 « le curseur passe sous les noms »,
            CRITIQUE-11 doute c2-b) : le halo seul laissait le trait se voir entre les lettres (« Sols : colle et | joints »). */}
        {curseur !== null && curseur >= 0 && curseur < n && (
          <g className="ent-curseur" data-curseur aria-hidden="true">
            <path data-curseur-trait d={traitCurseur(g.x(curseur) + g.unit / 2, g.haut, y0, noms.filter(e => !cache(e)).map(e => e.boite))} />
            {/* CRITIQUE-12, doute c2-b : l'anneau pointillé passe lui aussi sous les noms, à 2 px de leur boîte (à 844, il touchait « −24 ») ; le
                point de lecture reste entier. */}
            <mask id={`cm${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={largeur} height={hauteur}>
              <rect x={0} y={0} width={largeur} height={hauteur} fill="white" />
              {noms.filter(e => !cache(e)).map(e => <rect key={`${e.i}-${e.nom}`} data-curseur-trou x={e.boite.l - 2} y={e.boite.t - 2} width={e.boite.r - e.boite.l + 4} height={e.boite.b - e.boite.t + 4} fill="black" />)}
            </mask>
            {/* CAL-ENTETE (21.11, deuxième refus du rond : « Avec le point qui bouge toujours pas super fan ») : plus d'anneau ni de point. La
                semaine lue se marque par sa colonne, à peine teintée, et sa marche de la courbe, épaissie : aucun rond, rien qui dépasse du tracé. */}
            <rect className="ent-cur-col" data-curseur-colonne x={g.x(curseur)} y={g.haut} width={Math.max(2, g.unit)} height={Math.max(0, g.bas - g.haut)} mask={`url(#cm${uid})`} />
            <line className="ent-cur-marche" data-curseur-marche x1={g.x(curseur) + 0.5} x2={g.x(curseur) + Math.max(3, g.unit) - 0.5} y1={g.y(libres[curseur])} y2={g.y(libres[curseur])} />
          </g>
        )}
        {/* Les points restent dans la zone de tracé (CRITIQUE-4 n° 25) : rien ne déborde du dessin. */}
        <g className="ent-pts" clipPath={`url(#z${uid})`}>
          {courbe.map((s, i) => <circle key={`p${s.lundi}`} className="ent-pt" data-point-semaine={s.numero} data-semaine={s.numero} cx={g.x(i) + g.unit / 2} cy={g.y(s.libre)} r={1.6} />)}
        </g>
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
            <title>{`${e.etoile ? '★ ' : ''}${e.complet ?? e.nom}${e.montant ? ` ${e.montant}` : ''}, ${e.semaines.length > 1 ? `${e.semaines.length} fois, dès S${e.semaines[0]}` : `S${e.semaines[0]}`}`}</title>
          </g>
        )))}
        {creux && <circle className="ent-creux-pt" cx={g.x(creux.index) + g.unit / 2} cy={g.y(creux.centimes)} r={5.5} />}
        {moisEnHaut && mois.filter(m => m.trait).map(m => <line key={`t${m.x}`} className="ent-mois-t" x1={m.x - 3} x2={m.x - 3} y1={rangeeHaute ? yMois - 12 : 1} y2={rangeeHaute ? yMois + 3 : 16} />)}
        {mois.map(m => <text key={m.x} className="ent-mois" x={m.x} y={yMois}>{m.texte}</text>)}
      </svg>
      {/* CRITIQUE-6 n° 9 (E31, D-37) : chaque chose étoilée porte sa ★ sur la courbe, à sa semaine, sur sa marche, même quand son nom n'a pas de
          place ; posée AU-DESSUS du cadre de la fenêtre (z-order), jamais cachée par lui. Son nom placé la porte déjà (« ★ Festival +2 450 »). */}
      {marquesEtoiles.length > 0 && (
        <svg className="ent-svg ent-etoiles-dessus" data-etoiles-dessus width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} aria-hidden="true">
          {marquesEtoiles.map(m => (
            <text key={`e${m.i}-${m.nom}`} className="ent-etoile-mq" data-etoile-marque data-semaine={courbe[m.i].numero} x={m.x} y={m.y} textAnchor="middle">★<title>{`★ ${m.nom}, S${courbe[m.i].numero}`}</title></text>
          ))}
        </svg>
      )}
      {children}
    </div>
  );
}

/* ---------- la courbe zoomée pendant un geste de la frise (f1-a) ---------- */

/**
 * Le trait vertical du curseur (c2-b), de `haut` à `bas` à l'abscisse `x`, interrompu à chaque nom qu'il traverse (sa boîte, 2 px de marge),
 * comme le jouable (`as-gestes.js`, « le trait s'interrompt au passage d'un nom ») : un chemin de segments `M x y V y`.
 */
export function traitCurseur(x: number, haut: number, bas: number, boites: readonly Boite[]): string {
  const trous = boites.filter(b => x >= b.l - 3 && x <= b.r + 3).map(b => [b.t - 2, b.b + 2] as const).sort((a, b) => a[0] - b[0]);
  let d = '', y = Math.min(haut, bas);
  const fin = Math.max(haut, bas);
  for (const [t, b] of trous) {
    if (t > y) d += `M${x.toFixed(1)} ${y.toFixed(1)}V${Math.min(t, fin).toFixed(1)}`;
    y = Math.max(y, b);
    if (y >= fin) break;
  }
  if (y < fin) d += `M${x.toFixed(1)} ${y.toFixed(1)}V${fin.toFixed(1)}`;
  return d;
}

export interface CourbeZoomProps {
  /** Les colonnes visibles : l'avant (pointillé), l'après (plein), en centimes. */
  avant: readonly number[];
  apres: readonly number[];
  largeur: number;
  hauteur: number;
  /** D388 : les bords des semaines lus dans la frise (n + 1 valeurs) ; absent : largeur / n. */
  abscisses?: readonly number[];
  /**
   * D388 (jouable paysage, `as-gestes.js` `zoom`) : la ligne sous la courbe, « - - avant — si tu lâches en S51 : S50 5 120 → 4 480 », l'écart
   * (« −640 ») sur la première semaine qui change, la colonne d'arrivée éclairée. Index dans les colonnes montrées ; numéros de semaine pour le texte.
   */
  lacher?: { colonne: number | null; numero: number | null; change: { colonne: number | null; numero: number; avant: number; apres: number } | null };
}

/** La hauteur de la ligne « avant / si tu lâches » sous la courbe zoomée (jouable : 26 px). */
export const HAUTEUR_LIGNE_ZOOM = 26;

/** Pas d'axe « rond » le plus petit qui garde au plus 2,2 graduations dans l'écart (reprise du jouable, en centimes). */
const PAS = [10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000];
export function CourbeZoom({ avant, apres, largeur, hauteur, abscisses, lacher }: CourbeZoomProps) {
  const n = Math.min(avant.length, apres.length);
  const tout = [...avant.slice(0, n), ...apres.slice(0, n)];
  const lo0 = Math.min(...tout), hi0 = Math.max(...tout);
  const pas = PAS.find(p => (hi0 - lo0) / p <= 2.2) ?? 1000000;
  const lo = Math.floor(lo0 / pas) * pas - pas * 0.35, hi = Math.ceil(hi0 / pas) * pas + pas * 0.15;
  // Avec la ligne du jouable sous la courbe, la légende ne prend plus le haut du dessin : le tracé part de 6 px, comme le jouable.
  const ligne = !!lacher;
  const h = ligne ? Math.max(40, hauteur - HAUTEUR_LIGNE_ZOOM) : hauteur;
  const haut = ligne ? 6 : 20, bas = h - 4;
  const unit = largeur / Math.max(1, n);
  const g0: Geo = { largeur, hauteur: h, haut, bas, unit, lo, hi, x: i => i * unit, y: v => bas - ((v - lo) / (hi - lo)) * (bas - haut) };
  const g = abscisses && abscisses.length === n + 1 ? avecAbscisses(g0, abscisses) : g0;
  const x0 = g.x(0), xn = g.x(n);
  const graduations: number[] = [];
  for (let v = Math.ceil(lo / pas) * pas; v <= hi; v += pas) graduations.push(v);
  const ch = lacher?.change ?? null;
  const ecart = ch && ch.colonne !== null && ch.colonne >= 0 && ch.colonne < n ? (() => {
    const d = ch.apres - ch.avant, ya = g.y(ch.apres), yb = g.y(ch.avant);
    const ty = Math.max(15, Math.min(h - 3, d < 0 ? Math.max(ya, yb) + 18 : Math.min(ya, yb) - 6));
    return { d, x: (g.x(ch.colonne) + g.x(ch.colonne + 1)) / 2, y: ty };
  })() : null;
  const cl = lacher && lacher.colonne !== null && lacher.colonne >= 0 && lacher.colonne < n ? lacher.colonne : null;
  const svg = (
    <svg className="ent-svg ent-zoom" width={largeur} height={h} viewBox={`0 0 ${largeur} ${h}`} role="img" aria-label="La courbe zoomée sur les semaines visibles : avant en pointillé, après en plein">
      {cl !== null && <rect className="ent-zlache" data-zoom-lache x={g.x(cl)} y={0} width={g.x(cl + 1) - g.x(cl)} height={h} />}
      {ligne && Array.from({ length: n - 1 }, (_, i) => i + 1).map(i => <line key={`c${i}`} className="ent-zcol" x1={g.x(i)} x2={g.x(i)} y1={0} y2={h} />)}
      {Array.from({ length: n }, (_, i) => i).filter(i => apres[i] !== avant[i]).map(i => {
        const y1 = g.y(avant[i]), y2 = g.y(apres[i]);
        return <rect key={i} className={apres[i] < avant[i] ? 'ent-ecart ent-ecart-neg' : 'ent-ecart ent-ecart-pos'} x={g.x(i)} y={Math.min(y1, y2)} width={g.x(i + 1) - g.x(i)} height={Math.abs(y2 - y1)} />;
      })}
      {graduations.map(v => <line key={v} className="ent-grad" x1={x0} x2={xn} y1={g.y(v)} y2={g.y(v)} />)}
      <path className="ent-aire" d={`${escalier(apres.slice(0, n), g)}V${h}H${x0.toFixed(1)}Z`} />
      <path className="ent-avant" d={escalier(avant.slice(0, n), g)} />
      <path className="ent-apres" d={escalier(apres.slice(0, n), g)} />
      {placerAxe(graduations, [avant.slice(0, n), apres.slice(0, n)], g, ligne ? null : boiteLegende(largeur)).map(a => (
        <g key={`t${a.v}`} className="ent-axe-g" data-axe={a.v}>
          <rect className="ent-axe-fond" x={a.boite.l} y={a.boite.t} width={a.boite.r - a.boite.l} height={a.boite.b - a.boite.t} rx={3} />
          <text className="ent-axe" x={a.x} y={a.y}>{chf(a.v)}</text>
        </g>
      ))}
      {ecart && ecart.d !== 0 && <text className={`ent-zd ${ecart.d < 0 ? 'ent-zd-neg' : 'ent-zd-pos'}`} data-zoom-ecart x={ecart.x} y={ecart.y} textAnchor="middle">{sg(ecart.d)}</text>}
      {!ligne && <text className="ent-zleg" x={largeur - 4} y={14} textAnchor="end"><tspan className="ent-leg-av">{LEGENDE_AVANT}</tspan>  <tspan className="ent-leg-ap">{LEGENDE_APRES}</tspan></text>}
    </svg>
  );
  if (!lacher) return svg;
  return (
    <>
      {svg}
      <p className="ent-zl" data-zoom-ligne>
        <span><i className="ent-zav" aria-hidden="true" />avant</span>
        <span><i className="ent-zap" aria-hidden="true" />si tu lâches{lacher.numero !== null ? ` en S${lacher.numero}` : ''}{ch ? <>{' : '}{ch.numero !== lacher.numero ? `S${ch.numero} ` : ''}{chf(ch.avant)} → <b>{chf(ch.apres)}</b></> : null}</span>
      </p>
    </>
  );
}

const LEGENDE_AVANT = '- - avant';
const LEGENDE_APRES = '— après';
/** La boîte de la légende « - - avant — après », en haut à droite de la courbe zoomée. */
const boiteLegende = (largeur: number): Boite => ({ l: largeur - 4 - largeurTexte(`${LEGENDE_AVANT}  ${LEGENDE_APRES}`, true), r: largeur, t: 0, b: 18 });

/** Une étiquette d'axe posée : sa valeur, l'ancre du texte, la boîte de son fond. */
export interface EtiquetteAxe { v: number; x: number; y: number; boite: Boite }

/**
 * Les traits d'un escalier (`escalier`), en px de la courbe : un palier horizontal par colonne, une marche verticale entre deux colonnes. Le trait
 * de l'après fait 3,5 px : chaque trait est une boîte élargie de `demi` px de part et d'autre.
 */
function traitsEscalier(valeurs: readonly number[], g: Geo, demi: number): Boite[] {
  const traits: Boite[] = [];
  valeurs.forEach((v, k) => {
    const y = g.y(v);
    traits.push({ l: g.x(k), r: g.x(k + 1), t: y - demi, b: y + demi });
    if (k > 0) {
      const y0 = g.y(valeurs[k - 1]);
      traits.push({ l: g.x(k) - demi, r: g.x(k) + demi, t: Math.min(y0, y), b: Math.max(y0, y) });
    }
  });
  return traits;
}

/**
 * CRITIQUE-11 n° 6 (E02, E33 au sens large, D-189) : les étiquettes d'axe de la courbe zoomée (f1-a) ne sont jamais barrées par le tracé. Chaque
 * valeur se pose d'abord à gauche, au-dessus de sa graduation (comme le jouable, p-f1a-pendant) ; si l'avant ou l'après y passe, sous sa
 * graduation ; puis plus à droite, colonne par colonne, au-dessus puis dessous. Jamais sur la légende, jamais sur une autre étiquette, jamais
 * hors du dessin. Sans place libre, la graduation reste sans chiffre : un chiffre barré ne se lit pas. Le fond (`ent-axe-fond`) est celui du thème.
 */
export function placerAxe(graduations: readonly number[], series: readonly (readonly number[])[], g: Geo, legende: Boite | null = null): EtiquetteAxe[] {
  const traits = series.flatMap(s => traitsEscalier(s, g, 2.5));
  const n = Math.max(1, Math.round(g.largeur / g.unit));
  const posees: EtiquetteAxe[] = [];
  for (const v of graduations) {
    const yv = g.y(v);
    const w = largeurTexte(chf(v)) + 2;
    // Le texte de 14 px : 11 px au-dessus de sa ligne de base, 3 dessous ; le fond déborde de 2 px à gauche et à droite.
    const boiteDe = (x: number, y: number): Boite => ({ l: x - 2, r: x + w, t: y - 12, b: y + 4 });
    const xs = [4, ...Array.from({ length: n - 1 }, (_, i) => g.x(i + 1) + 4)];
    const essais = [
      { x: 4, y: yv - 5 }, { x: 4, y: yv + 15 },
      ...xs.slice(1).map(x => ({ x, y: yv - 5 })), ...xs.slice(1).map(x => ({ x, y: yv + 15 }))
    ];
    const libre = essais.find(({ x, y }) => {
      const b = boiteDe(x, y);
      if (b.l < 0 || b.r > g.largeur || b.t < 0 || b.b > g.hauteur) return false;
      if (legende && croise(b, legende, 0)) return false;
      if (posees.some(p => croise(b, p.boite, 0))) return false;
      return !traits.some(t => croise(b, t, 0));
    });
    if (libre) posees.push({ v, x: libre.x, y: libre.y, boite: boiteDe(libre.x, libre.y) });
  }
  return posees;
}
