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
 * et « 1 140 mis de côté pour Frigo ». Toujours sur UNE ligne (jamais un nom coupé). `repere` : le trait pointillé qui relie le nom à sa marche
 * quand il en est loin (z2s).
 */
export interface Etiquette {
  genre: 'mouvement' | 'mise';
  i: number; nom: string; montant: string; x: number; y: number; neg: boolean;
  boite: Boite;
  /** Toutes les semaines où ce nom revient (un récurrent n'est nommé qu'une fois, D-183). */
  semaines: number[];
  repere: { x: number; y1: number; x2: number; y2: number } | null;
}
/** Hauteur d'une ligne de nom (texte de 14 px) et écart entre deux lignes. */
export const LIGNE_NOM = 16;
const PAS_LIGNE = 17;
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
  return Math.ceil(t.length * (gras ? 7.8 : 7.2)) + 4;
}
/** « Frigo −1 800 » : le nom en regular, une espace, le montant en gras. */
const largeurNom = (nom: string, montant: string) => largeurTexte(`${nom} `) + largeurTexte(montant, true);

export interface MisePlacee { i: number; centimes: number; titres: readonly string[] }
/** Les deux textes de la mise de côté, le plus complet d'abord (z2s : « 1 140 mis de côté pour le frigo »). */
export function textesMise(m: MisePlacee): string[] {
  const pour = m.titres.length ? ` pour ${m.titres.join(', ')}` : '';
  return [`${chf(m.centimes)} mis de côté${pour}`, `${chf(m.centimes)} mis de côté`];
}
/** Le carré hachuré de la mise de côté (12 px) et son écart au texte. */
const CARRE_MISE = 16;

/**
 * Noms posés par placement glouton (méthode standard d'annotation, MISSION § État de l'art), comme z2s fait tenir 8 noms à 390 :
 * - un mouvement n'est nommé qu'une fois : un récurrent (« Loyer du local », 12 fois) l'est à sa première semaine ;
 * - texte de 14 px, nom en regular et montant en gras, sur UNE ligne, jamais coupé ;
 * - les plus gros d'abord (la mise de côté vient après les deux plus gros), chacun sur la ligne la plus proche de sa marche, à côté d'elle ou
 *   au-dessus, d'abord hors de la courbe, sinon sur elle (le halo du texte le garde lisible, comme z2s) ;
 * - jamais sur un autre nom, ni sur une exclusion (le cadre de la fenêtre et son étiquette, le point du creux, le chiffre clé).
 * Un nom qui ne tient nulle part n'est pas posé : sa marche reste et la lecture au doigt le nomme.
 */
export function placerNoms(courbe: readonly SoldeSemaine[], g: Geo, max: number, exclusions: readonly Boite[] = [], mise: MisePlacee | null = null): Etiquette[] {
  type Article = { genre: 'mouvement' | 'mise'; i: number; nom: string; centimes: number; semaines: number[] };
  const parNom = new Map<string, Article>();
  courbe.forEach((s, i) => s.mouvements.forEach(m => {
    // Un montant inconnu ou de moins d'un franc ne se nomme pas « 0 » (l'inconnu n'est jamais 0) : la frise le montre, sans chiffre.
    if (Math.round(Math.abs(m.centimes) / 100) === 0) return;
    const deja = parNom.get(m.nom);
    if (deja) { if (!deja.semaines.includes(s.numero)) deja.semaines.push(s.numero); return; }
    parNom.set(m.nom, { genre: 'mouvement', i, nom: m.nom, centimes: m.centimes, semaines: [s.numero] });
  }));
  const articles = [...parNom.values()].sort((a, b) => Math.abs(b.centimes) - Math.abs(a.centimes) || a.i - b.i);
  if (mise && mise.centimes > 0) articles.splice(Math.min(2, articles.length), 0, { genre: 'mise', i: mise.i, nom: '', centimes: mise.centimes, semaines: [] });

  const pris: Boite[] = [...exclusions];
  const places: Boite[] = [];
  const traits: { x: number; y: number }[] = [];
  const dans = (p: { x: number; y: number }, b: Boite, m: number) => p.x >= b.l - m && p.x <= b.r + m && p.y >= b.t - m && p.y <= b.b + m;
  // Les points d'un trait, tous les 4 px, sans ses deux bouts (la marche et le bord du nom).
  const pointsTrait = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 4));
    return Array.from({ length: n - 1 }, (_, k) => ({ x: x1 + ((x2 - x1) * (k + 1)) / n, y: y1 + ((y2 - y1) * (k + 1)) / n }));
  };
  const sortie: Etiquette[] = [];
  const lignes: number[] = [];
  // La ligne de base d'un nom : sa boîte (le texte de 14 px) va de y − 11 à y + 3 ; deux lignes voisines, 17 px plus bas, laissent 3 px
  // entre elles. La première ligne laisse libre le bord haut du cadre de la fenêtre.
  for (let y = g.haut + 14; y + 3 <= g.bas - 3; y += PAS_LIGNE) lignes.push(y);
  const surLaCourbe = (b: Boite) => {
    const j0 = Math.max(0, Math.floor(b.l / g.unit)), j1 = Math.min(courbe.length - 1, Math.floor(b.r / g.unit));
    for (let j = j0; j <= j1; j++) for (const v of [courbe[j].libre, courbe[j].caisse]) { const yy = g.y(v); if (yy >= b.t - 2 && yy <= b.b + 2) return true; }
    // Les marches verticales entre deux semaines.
    for (let j = Math.max(1, j0); j <= j1; j++) {
      const a = g.y(courbe[j - 1].libre), c = g.y(courbe[j].libre);
      if (Math.min(a, c) <= b.b && Math.max(a, c) >= b.t && g.x(j) >= b.l && g.x(j) <= b.r) return true;
    }
    return false;
  };

  for (const m of articles) {
    if (sortie.length >= max) break;
    const s = courbe[m.i];
    const xm = g.x(m.i) + (m.genre === 'mise' ? g.unit / 2 : 0);
    const ymarche = m.i > 0 && m.genre === 'mouvement' ? (g.y(courbe[m.i - 1].libre) + g.y(s.libre)) / 2 : g.y(s.libre);
    const formes = m.genre === 'mise'
      ? textesMise({ i: m.i, centimes: m.centimes, titres: mise?.titres ?? [] }).map(t => ({ nom: t, montant: '', w: CARRE_MISE + largeurTexte(t) }))
      : [{ nom: m.nom, montant: sg(m.centimes), w: largeurNom(m.nom, sg(m.centimes)) }];
    const options = lignes.slice().sort((a, b) => Math.abs(a - 4 - ymarche) - Math.abs(b - 4 - ymarche));
    let pose: Etiquette | null = null;
    for (const souple of [false, true]) {
      for (const f of formes) {
        for (const y of options) {
          // À droite de la marche, à gauche, centré dessus, puis glissé le long de la ligne tant que la marche reste sous le nom (son trait
          // pointillé reste vertical, comme z2s), puis poussé contre un bord.
          const glisses: number[] = [];
          for (let l = xm + 5 - 8; l > xm - 5 - f.w; l -= 8) glisses.push(l);
          glisses.sort((a, b) => Math.abs(a + f.w / 2 - xm) - Math.abs(b + f.w / 2 - xm));
          // En dernier, décalé de côté (une marche dans le cadre étroit de la fenêtre) : le trait pointillé la relie alors en biais.
          const decales: number[] = [];
          for (let k = 1; k <= 24; k++) decales.push(xm + 5 + 8 * k, xm - 5 - f.w - 8 * k);
          for (const l0 of [xm + 5, xm - 5 - f.w, xm - f.w / 2, ...glisses, ...(souple ? decales : [])]) {
            const l = Math.max(2, Math.min(g.largeur - 2 - f.w, l0));
            const bo: Boite = { l, r: l + f.w, t: y - 11, b: y + 3 };
            // Deux noms sur une même ligne gardent 8 px entre eux (on lit où l'un finit) ; les lignes voisines, 3 px.
            if (bo.l < 2 || bo.r > g.largeur - 2 || pris.some(p => croise(p, bo) || (p.t < bo.b && bo.t < p.b && !(p.r + 8 <= bo.l || bo.r + 8 <= p.l))) || (!souple && surLaCourbe(bo))) continue;
            // D'abord une place nette : ni sur la courbe, ni sur le trait d'un autre nom, et un trait qui ne traverse aucun nom. Sinon (souple),
            // le halo du texte masque ce qu'il recouvre, comme dans z2s.
            if (!souple && traits.some(p => dans(p, bo, 1))) continue;
            const y2 = ymarche < bo.t ? bo.t : ymarche > bo.b ? bo.b : y - 4;
            const x2 = xm < bo.l - 6 ? bo.l : xm > bo.r + 6 ? bo.r : xm;
            const repere = Math.hypot(x2 - xm, y2 - ymarche) > 6 ? { x: xm, y1: ymarche, x2, y2 } : null;
            const points = repere ? pointsTrait(repere.x, repere.y1, repere.x2, repere.y2) : [];
            if (!souple && points.some(p => places.some(b => dans(p, b, 0)))) continue;
            pose = { genre: m.genre, i: m.i, nom: f.nom, montant: f.montant, x: bo.l, y, neg: m.centimes < 0, boite: bo, semaines: m.semaines, repere };
            pris.push(bo);
            places.push(bo);
            traits.push(...points);
            break;
          }
          if (pose) break;
        }
        if (pose) break;
      }
      if (pose) break;
    }
    if (pose) sortie.push(pose);
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

/** Les étiquettes des mois, de gauche à droite, sans chevauchement (premier mot posé, les suivants s'ils tiennent). */
export function etiquettesMois(courbe: readonly SoldeSemaine[], g: Geo): { x: number; texte: string }[] {
  const sortie: { x: number; texte: string }[] = [];
  let m0 = -1, fin = -Infinity;
  courbe.forEach((s, i) => {
    const m = moisDeSemaine(s.lundi);
    if (m === m0) return;
    m0 = m;
    const texte = MOIS_MIN[m], x = g.x(i) + 3;
    if (i > 0 && x > fin + 6 && x + largeurTexte(texte) <= g.largeur) { sortie.push({ x, texte }); fin = x + largeurTexte(texte); }
  });
  return sortie;
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
  /** La fenêtre posée sur la courbe. */
  children?: React.ReactNode;
}

/** Hauteur de la rangée des mois sous le tracé (texte de 14 px). */
export const HAUTEUR_MOIS = 18;
/** Au plus 8 noms, comme z2s, à 390 comme à 1280 : au-delà, « trop d'info sur le graph » (CRITIQUE-2 n° 10). */
export const maxNoms = (largeur: number) => Math.max(4, Math.min(8, Math.floor(largeur / 48)));

/** Les obstacles des noms : les bords du cadre (poignées comprises), son étiquette, et le point du creux. */
export function obstaclesCourbe(g: Geo, cadre: CourbeProps['cadre'], creux: { index: number; centimes: number } | null): Boite[] {
  const obstacles: Boite[] = [];
  if (cadre) {
    const l = g.x(cadre.index), r = g.x(cadre.index + cadre.nombre);
    for (const bord of [l, r]) obstacles.push({ l: bord - 8, r: bord + 8, t: g.haut, b: g.bas });
    // Les bords haut et bas du cadre (2 px de trait).
    obstacles.push({ l, r, t: g.haut, b: g.haut + 2 }, { l, r, t: g.bas - 2, b: g.bas });
    if (cadre.etiquette) obstacles.push(boiteEtiquette(cadre.etiquette, l, r - l, g.bas));
  }
  if (creux) obstacles.push({ l: g.x(creux.index) + g.unit / 2 - 9, r: g.x(creux.index) + g.unit / 2 + 9, t: g.y(creux.centimes) - 9, b: g.y(creux.centimes) + 9 });
  return obstacles;
}

export function Courbe({ courbe, largeur, hauteur, curseur = null, reference, gestes, cadre, mise = null, children }: CourbeProps) {
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
  const noms = placerNoms(courbe, g, maxNoms(largeur), obstaclesCourbe(g, cadre, creux), mise);
  const mois = etiquettesMois(courbe, g);
  const y0 = g.y(0);
  const marques = courbe.map((s, i) => ({ i, d: variation(courbe, i), nomme: s.mouvements.length > 0 })).filter(m => m.nomme && m.d !== null && m.d !== 0 && m.i > 0);
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
        {curseur !== null && curseur >= 0 && curseur < n && (
          <g className="ent-curseur" aria-hidden="true">
            <line x1={g.x(curseur) + g.unit / 2} x2={g.x(curseur) + g.unit / 2} y1={g.haut} y2={y0} />
            <circle cx={g.x(curseur) + g.unit / 2} cy={g.y(libres[curseur])} r={12} className="ent-cur-anneau" />
            <circle cx={g.x(curseur) + g.unit / 2} cy={g.y(libres[curseur])} r={5.5} className="ent-cur-pt" />
          </g>
        )}
        {courbe.map((s, i) => <circle key={`p${s.lundi}`} className="ent-pt" data-point-semaine={s.numero} data-semaine={s.numero} cx={g.x(i) + g.unit / 2} cy={g.y(s.libre)} r={1.6} />)}
        {noms.map((e, k) => e.repere && (
          <line key={`r${k}-${e.i}-${e.genre}`} className={e.genre === 'mise' ? 'ent-rep ent-rep-mise' : e.neg ? 'ent-rep ent-rep-neg' : 'ent-rep ent-rep-pos'} x1={e.repere.x} x2={e.repere.x2} y1={e.repere.y1} y2={e.repere.y2} />
        ))}
        {noms.map(e => (e.genre === 'mise' ? (
          <g key="mise" data-mise-de-cote="etiquette" className="ent-mdc">
            <rect x={e.boite.l + 1} y={e.y - 11} width={12} height={12} fill={`url(#h${uid})`} className="ent-mdc-c" />
            <text className="ent-nom ent-mdc-t" x={e.boite.l + CARRE_MISE} y={e.y}>{e.nom}</text>
            <title>{`${mise ? textesMise(mise)[0] : e.nom}${courbe[e.i] ? `, en S${courbe[e.i].numero}` : ''}`}</title>
          </g>
        ) : (
          // Le titre (la semaine, « 4 fois, dès S50 ») est à côté du texte, jamais dedans : le texte se lit « Frigo −1 800 », rien d'autre.
          <g key={`${e.i}-${e.nom}`} className="ent-nom-g">
            <text className="ent-nom" data-nom-courbe x={e.x} y={e.y}>
              {e.nom} <tspan className={e.neg ? 'ent-m' : 'ent-p'}>{e.montant}</tspan>
            </text>
            <title>{`${e.nom} ${e.montant}, ${e.semaines.length > 1 ? `${e.semaines.length} fois, dès S${e.semaines[0]}` : `S${e.semaines[0]}`}`}</title>
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
