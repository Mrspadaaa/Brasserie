import React, { useId } from 'react';
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

export interface Etiquette { i: number; nom: string; montant: string; x: number; y: number; ancre: 'start' | 'end'; neg: boolean; deux: boolean }
export interface Boite { l: number; r: number; t: number; b: number }
const courtNom = (nom: string) => (nom.length > 18 ? `${nom.slice(0, 17).trim()}…` : nom);
const largeurTexte = (t: string) => Math.ceil(t.length * 7.4) + 2;
const croise = (a: Boite, b: Boite, m = 3) => !(a.r + m <= b.l || a.l >= b.r + m || a.b + m <= b.t || a.t >= b.b + m);

/**
 * Noms posés par placement glouton en une dimension (méthode standard d'annotation) : les plus gros mouvements d'abord, chacun à côté de son
 * repère, au premier endroit qui ne touche ni un autre nom, ni la courbe, ni le bord. Deux formes, la plus courte d'abord : « Frigo −1 800 » sur
 * une ligne, puis le nom au-dessus du montant. Les trois plus gros ne se perdent jamais : faute de place nette, ils passent sur la courbe (leur
 * halo les garde lisibles). Un nom qui ne tient nulle part n'est pas posé : le repère reste et la lecture au doigt le nomme.
 */
export function placerNoms(courbe: readonly SoldeSemaine[], g: Geo, max: number, exclusions: readonly Boite[] = []): Etiquette[] {
  const tous: { i: number; nom: string; centimes: number }[] = [];
  courbe.forEach((s, i) => s.mouvements.forEach(m => tous.push({ i, nom: m.nom, centimes: m.centimes })));
  tous.sort((a, b) => Math.abs(b.centimes) - Math.abs(a.centimes));
  const pris: Boite[] = [...exclusions];
  const sortie: Etiquette[] = [];
  const lignes: number[] = [];
  for (let y = g.haut + 14; y <= g.bas - 3; y += 17) lignes.push(y);
  const surLaCourbe = (b: Boite) => {
    const j0 = Math.max(0, Math.floor(b.l / g.unit)), j1 = Math.min(courbe.length - 1, Math.floor(b.r / g.unit));
    for (let j = j0; j <= j1; j++) for (const v of [courbe[j].libre, courbe[j].caisse]) { const yy = g.y(v); if (yy >= b.t - 2 && yy <= b.b + 2) return true; }
    return false;
  };
  tous.forEach((m, rang) => {
    if (sortie.length >= max) return;
    const nom = courtNom(m.nom), montant = sg(m.centimes);
    const xm = g.x(m.i), ymid = g.y(courbe[m.i].libre);
    const options = lignes.slice().sort((a, b) => Math.abs(a - ymid) - Math.abs(b - ymid));
    for (const souple of rang < 3 ? [false, true] : [false]) {
      for (const deux of [false, true]) {
        const w = deux ? Math.max(largeurTexte(nom), largeurTexte(montant)) : largeurTexte(`${nom} ${montant}`);
        for (const y of options) {
          if (deux && y + 16 > g.bas - 1) continue;
          for (const ancre of ['start', 'end'] as const) {
            const l = ancre === 'start' ? xm + 5 : xm - 5 - w;
            const bo: Boite = { l, r: l + w, t: y - 13, b: y + (deux ? 19 : 3) };
            if (bo.l < 2 || bo.r > g.largeur - 2 || pris.some(p => croise(p, bo)) || (!souple && surLaCourbe(bo))) continue;
            pris.push(bo);
            sortie.push({ i: m.i, nom, montant, x: ancre === 'start' ? bo.l : bo.r, y, ancre, neg: m.centimes < 0, deux });
            return;
          }
        }
      }
    }
  });
  return sortie;
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
  /** La fenêtre posée sur la courbe : son étiquette (« S47 – S52 ») est un obstacle pour les noms. */
  cadre?: { index: number; nombre: number };
  /** La fenêtre posée sur la courbe. */
  children?: React.ReactNode;
}

/** Hauteur de la rangée des mois sous le tracé (texte de 14 px). */
export const HAUTEUR_MOIS = 18;

export function Courbe({ courbe, largeur, hauteur, curseur = null, reference, gestes, cadre, children }: CourbeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const n = courbe.length;
  const g = geometrie(courbe.flatMap(s => [s.libre, s.caisse]), n, largeur, hauteur, 4, hauteur - HAUTEUR_MOIS);
  const libres = courbe.map(s => s.libre), caisses = courbe.map(s => s.caisse);
  const creux = creuxDe(courbe);
  const causes = creux ? causesDuCreux(courbe, creux.index) : null;
  const misDeCote = courbe.some(s => s.caisse - s.libre > 1);
  // Obstacles pour les noms : l'étiquette du cadre (en bas à gauche de la fenêtre) et le point du creux.
  const obstacles: Boite[] = [];
  if (cadre) {
    obstacles.push({ l: g.x(cadre.index), r: g.x(cadre.index) + Math.min(g.unit * cadre.nombre, 80), t: g.bas - 36, b: g.bas });
    // Les deux bords du cadre (les poignées) : un nom ne passe pas dessus.
    for (const bord of [g.x(cadre.index), g.x(cadre.index + cadre.nombre)]) obstacles.push({ l: bord - 8, r: bord + 8, t: g.haut, b: g.bas });
  }
  if (creux) obstacles.push({ l: g.x(creux.index) + g.unit / 2 - 9, r: g.x(creux.index) + g.unit / 2 + 9, t: g.y(creux.centimes) - 9, b: g.y(creux.centimes) + 9 });
  const noms = placerNoms(courbe, g, Math.max(4, Math.floor(largeur / 48)), obstacles);
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
        {misDeCote && <path className="ent-miscote" d={zoneEscalier(caisses, libres, g)} fill={`url(#h${uid})`} />}
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
        {noms.map(e => (
          <text key={`${e.i}-${e.nom}`} className="ent-nom" x={e.x} y={e.y} textAnchor={e.ancre}>
            {e.nom} <tspan className={e.neg ? 'ent-m' : 'ent-p'} {...(e.deux ? { x: e.x, dy: 16 } : {})}>{e.montant}</tspan>
          </text>
        ))}
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
