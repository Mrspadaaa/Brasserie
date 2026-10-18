// Les quatre objets de l'écran (work/refonte-frontend/v4/ecran-1/MODELE.md), en niveaux prêts à dessiner.
// Intensité dans la bière (objets 1, 2, 4) : 0 absent, 1 faible, 2 moyen, 3 marqué (classes V5.5).
// Fiches d'un houblon (objet 3) : 0 non décrit, 1 cité, 2 marqué. Ce n'est pas une intensité.
import bandsFile from '../../data/style-bands.json';
import { AXES } from './data';
import { FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies } from './hops';
import type { Profile } from './recipe';
import { tastingMention, type Tasting } from './tasting';
import type { FamilyEffect } from './voies';
import type { FamilyStatus, StyleScale } from '../style/scale';

export type Level = 0 | 1 | 2 | 3;
/** Borne haute du niveau « none » de la table mots → bandes (absent). */
const ABSENT_MAX = bandsFile.words.levels.find((l) => l.id === 'none')!.band[1];
const axis = (f: FamilyId) => AXES.find((a) => a.id === f)!;
/** Classe V5.5 d'une valeur 0–100 : faible ≤ lowMax < moyen ≤ mediumMax < marqué. Jamais 0 : l'absence se prouve à part. */
export const classOf = (v: number, f: FamilyId): 1 | 2 | 3 => (v <= axis(f).lowMax ? 1 : v <= axis(f).mediumMax ? 2 : 3);
const PERCEIVED: Record<string, Level> = { faible: 1, moyen: 2, marqué: 3 };

export const LEVEL_RULE = [
  'Intensité dans la bière, 0 à 3 : 0 absent, 1 faible, 2 moyen, 3 marqué (classes des axes V5.5 : 0–33, 33–66, 66–100).',
  'Profil de ma bière : la dégustation prime (faible 1, moyen 2, marqué 3) ; sinon le repère central V5.5 de la recette, converti par les classes ; 0 seulement si toute la plage du modèle reste sous le seuil « absent » (5) ; sinon null, « non situé ».',
  'Cible du style : bande [bas, haut] convertie ; bas ≤ 5 donne 0 (absent permis), sinon la classe juste au-dessus du bas ; haut ≤ 5 donne 0, sinon la classe qui contient le haut.',
  'Profil après une voie : le profil de ma bière décalé par l’effet établi de la voie (points). Famille du modèle : niveau du repère décalé, jamais 0 sans preuve d’absence. Famille dégustée : la classe perçue décalée ; le niveau change seulement si toute la classe décalée tombe dans une autre classe. Sans effet établi : niveau inchangé, effet « non établi ».',
  'Fiches d’un houblon, 0 à 2 : 0 non décrit, 1 cité (une fiche), 2 marqué (au moins deux fiches ou premier descripteur), avec « N fiches sur M ». Ce n’est pas une intensité dans la bière.',
];

export interface BeerLevel {
  family: FamilyId; name: string; status: FamilyStatus;
  level: Level | null;
  source: 'dégustation' | 'modèle' | 'non situé';
  /** Ce qui a été converti : classe perçue, ou repère central V5.5 (points 0–100). */
  basis: { perceived?: string; central?: number; range?: { min: number; max: number } } | null;
  /** Origine d'un niveau dégusté : « brassin du … », sinon la phrase datée du brasseur. */
  mention?: string;
}
export function beerLevels(profile: Profile, tasting: Tasting | null, scale: StyleScale): BeerLevel[] {
  return scale.order.map((f) => {
    const base = { family: f, name: FAMILY_NAMES[f], status: scale.families[f].status };
    const t = tasting?.axes.find((a) => a.family === f);
    if (t?.perceived && t.perceivedRange) return { ...base, level: PERCEIVED[t.perceived], source: 'dégustation', basis: { perceived: t.perceived, range: t.perceivedRange }, mention: tastingMention(tasting!) };
    const e = profile[f];
    if (e.status === 'estimé' && e.range && e.range.max <= ABSENT_MAX) return { ...base, level: 0, source: 'modèle', basis: { range: e.range } };
    if (e.status === 'inconnu' || !e.situated || e.central === undefined) return { ...base, level: null, source: 'non situé', basis: null };
    return { ...base, level: classOf(e.central, f), source: 'modèle', basis: { central: e.central } };
  });
}

export interface TargetLevel { family: FamilyId; name: string; status: FamilyStatus; min: Level; max: Level; band: [number, number] | null; hypothesis: string }
/** Cible du style en niveaux ; style non documenté : 0–3 sans bande (échelle absolue). */
export function targetLevels(scale: StyleScale): TargetLevel[] {
  return scale.order.map((f) => {
    const fs = scale.families[f];
    const hypothesis = `${bandsFile.status} (table ${bandsFile.words.version})`;
    if (!fs.band) return { family: f, name: FAMILY_NAMES[f], status: fs.status, min: 0, max: 3, band: null, hypothesis };
    const [lo, hi] = fs.band;
    const min: Level = lo <= ABSENT_MAX ? 0 : lo < axis(f).lowMax ? 1 : lo < axis(f).mediumMax ? 2 : 3;
    const max: Level = hi <= ABSENT_MAX ? 0 : classOf(hi, f);
    return { family: f, name: FAMILY_NAMES[f], status: fs.status, min, max, band: fs.band, hypothesis };
  });
}

export interface AfterLevel { family: FamilyId; level: Level | null; source: BeerLevel['source']; effet: number | 'non établi'; note?: string }
/** Profil de ma bière après une voie, sur la même échelle (voir LEVEL_RULE). */
export function afterLevels(before: BeerLevel[], effect: Record<FamilyId, FamilyEffect>): AfterLevel[] {
  return before.map((b) => {
    const e = effect[b.family];
    if (!e.established || e.central === null) return { family: b.family, level: b.level, source: b.source, effet: 'non établi' };
    const d = e.central;
    if (b.source === 'dégustation' && b.basis?.range) {
      const lo = Math.max(0, b.basis.range.min + d), hi = Math.min(100, b.basis.range.max + d);
      const same = classOf(lo, b.family) === classOf(hi, b.family);
      return { family: b.family, level: same ? classOf(lo, b.family) : b.level, source: b.source, effet: d,
        ...(same ? {} : { note: 'Variation trop faible pour faire changer la classe perçue.' }) };
    }
    if (b.source === 'modèle' && b.basis?.central !== undefined) return { family: b.family, level: Math.max(1, classOf(b.basis.central + d, b.family)) as Level, source: b.source, effet: d };
    return { family: b.family, level: b.level, source: b.source, effet: d, note: 'Bière non située sur cette famille : effet établi, niveau inconnu.' };
  });
}

// ---------- Crans du style (décision du pilote : objets 1, 2 et 4 dits en crans du style) ----------
export const CRANS_RULE = [
  'Position en crans : (valeur − bas de la bande) / cran du style (cran = largeur effective / 3) ; entier le plus proche, de 0 à 3 dans la bande ; 4 = au-dessus de la bande ; −1 = sous la bande (seulement si la bande ne part pas de 0) ; null = non situé.',
  'Valeur : la dégustation prime, par le milieu de sa classe V5.5 (faible 16,5, moyen 49,5, marqué 83) ; sinon le repère central V5.5 de la recette.',
  'Arrondi ambigu : si la valeur exacte en crans tombe à 0,1 cran ou moins d’un demi-cran (k,4 à k,6), la position s’affiche « ≈ k » (approx).',
  'Cible : la bande occupe 0 à 3 crans (moins pour une bande plus étroite que le plancher) ; « visée » = la cible absolue de la direction (targetAbsolute) en crans.',
  'Après une voie : même règle sur la valeur décalée par l’effet établi ; deltaCrans = effet / cran, entier signé ; « ≈ » si l’effet reste sous le seuil d’écart du style (un quart de bande) ; « non établi » sans effet établi.',
];
export interface CransPosition { family: FamilyId; crans: number | null; exact: number | null; approx: boolean; display: string; source: BeerLevel['source'] }
const midClass = (f: FamilyId, level: string) => { const a = axis(f); return level === 'faible' ? (a.scale.min + a.lowMax) / 2 : level === 'moyen' ? (a.lowMax + a.mediumMax) / 2 : (a.mediumMax + a.scale.max) / 2; };
function position(f: FamilyId, value: number | null, scale: StyleScale, source: BeerLevel['source']): CransPosition {
  const fs = scale.families[f];
  if (value === null || !fs.band) return { family: f, crans: null, exact: null, approx: false, display: 'non situé', source: value === null ? 'non situé' : source };
  const [lo, hi] = fs.band;
  const exact = Math.round(((value - lo) / fs.cran) * 100) / 100;
  if (value > hi) return { family: f, crans: 4, exact, approx: false, display: 'au-dessus', source };
  if (value < lo) return { family: f, crans: -1, exact, approx: false, display: 'en dessous', source };
  const top = Math.round((hi - lo) / fs.cran);
  const crans = Math.min(top, Math.max(0, Math.round(exact)));
  const frac = exact - Math.floor(exact);
  const approx = frac >= 0.4 && frac <= 0.6;
  return { family: f, crans, exact, approx, display: approx ? `≈ ${crans}` : String(crans), source };
}
/** Valeur 0–100 qui situe la bière sur une famille : dégustation (milieu de classe) d'abord, puis repère central. */
function beerValue(b: BeerLevel): number | null {
  if (b.source === 'dégustation' && b.basis?.perceived) return midClass(b.family, b.basis.perceived);
  if (b.source === 'modèle' && b.basis?.central !== undefined) return b.basis.central;
  return null;
}
export function beerCrans(beer: BeerLevel[], scale: StyleScale): CransPosition[] {
  return beer.map((b) => position(b.family, beerValue(b), scale, b.source));
}
export interface TargetCrans { family: FamilyId; status: FamilyStatus; bande: { min: number; max: number } | null; visee?: number }
export function targetCrans(scale: StyleScale, targets: { family: FamilyId; targetAbsolute: number | null }[] = []): TargetCrans[] {
  return scale.order.map((f) => {
    const fs = scale.families[f];
    if (!fs.band) return { family: f, status: fs.status, bande: null };
    const t = targets.find((x) => x.family === f);
    const visee = t && t.targetAbsolute !== null ? position(f, t.targetAbsolute, scale, 'modèle').crans ?? undefined : undefined;
    return { family: f, status: fs.status, bande: { min: 0, max: Math.round((fs.band[1] - fs.band[0]) / fs.cran) }, ...(visee !== undefined ? { visee } : {}) };
  });
}
export interface AfterCrans extends CransPosition { deltaCrans: number | '≈' | 'non établi'; effet: number | null }
export function afterCrans(beer: BeerLevel[], effect: Record<FamilyId, FamilyEffect>, scale: StyleScale): AfterCrans[] {
  return beer.map((b) => {
    const e = effect[b.family], v = beerValue(b), fs = scale.families[b.family];
    if (!e.established || e.central === null) return { ...position(b.family, v, scale, b.source), deltaCrans: 'non établi', effet: null };
    const pos = position(b.family, v === null ? null : Math.max(0, Math.min(100, v + e.central)), scale, b.source);
    const delta = Math.abs(e.central) < fs.threshold ? '≈' : Math.round(e.central / fs.cran);
    return { ...pos, deltaCrans: delta, effet: e.central };
  });
}

/** Radars en intensité absolue (D24) : niveaux 0–3 après la voie, et écart de niveau par famille :
 * « ≈ » si l'effet établi reste sous le seuil d'écart du style, null s'il n'est pas établi ou si un niveau manque. */
export function afterLevelsDelta(beer: BeerLevel[], effect: Record<FamilyId, FamilyEffect>, scale: StyleScale) {
  const after = afterLevels(beer, effect);
  const niveaux = after.map((a) => ({ family: a.family, level: a.level }));
  const delta = Object.fromEntries(after.map((a) => {
    const e = effect[a.family], b = beer.find((x) => x.family === a.family)!;
    if (!e.established || e.central === null) return [a.family, null];
    if (Math.abs(e.central) < scale.families[a.family].threshold) return [a.family, '≈'];
    return [a.family, a.level === null || b.level === null ? null : a.level - b.level];
  })) as Record<FamilyId, number | '≈' | null>;
  return { niveaux, delta };
}
// ---------- Échelle continue 0–3 (classes V5.5 : valeur / 33,33) ----------
export const CONTINU_RULE = [
  'Échelle continue 0–3, cohérente avec les classes V5.5 (0–33, 33–66, 66–100) : valeur 0–100 / 33,33, à 2 décimales.',
  'Profil : la dégustation prime et prend le milieu de sa classe (faible 0,5 ; moyen 1,5 ; marqué 2,5) ; sinon le repère central V5.5 ; « absent » prouvé : borne haute de la plage ; sinon null (non situé).',
  'Cible : bas et haut de la bande du style / 33,33.',
  'Après une voie : null si l’effet n’est pas établi sur la famille ; sinon la base (dégustation ou repère) plus l’effet / 33,33, bornée à 0–3.',
];
const UNIT = 100 / 3;
const r2 = (x: number) => Math.round(x * 100) / 100;
const clamp3 = (x: number) => Math.max(0, Math.min(3, x));
function continuousBase(b: BeerLevel): number | null {
  if (b.source === 'dégustation' && b.level !== null) return b.level - 0.5;
  if (b.source === 'modèle' && b.basis?.central !== undefined) return b.basis.central / UNIT;
  if (b.source === 'modèle' && b.level === 0 && b.basis?.range) return b.basis.range.max / UNIT;
  return null;
}
export function beerContinuous(beer: BeerLevel[]) {
  return beer.map((b) => { const v = continuousBase(b); return { family: b.family, value: v === null ? null : r2(v), source: v === null ? 'non situé' : b.source }; });
}
export function targetContinuous(scale: StyleScale) {
  return scale.order.map((f) => { const fs = scale.families[f]; return { family: f, status: fs.status, bas: fs.band ? r2(fs.band[0] / UNIT) : null, haut: fs.band ? r2(fs.band[1] / UNIT) : null }; });
}
export function afterContinuous(beer: BeerLevel[], effect: Record<FamilyId, FamilyEffect>) {
  return beer.map((b) => {
    const e = effect[b.family], base = continuousBase(b);
    return { family: b.family, value: !e.established || e.central === null || base === null ? null : r2(clamp3(base + e.central / UNIT)) };
  });
}

/** Ordre des familles pour les radars : adjacences de la roue d'arômes de Beer Maverick (grammaire, pas critère). */
export const ROUE_AROMES: { id: FamilyId; nom: string }[] = [
  { id: 'citrus', nom: 'Agrumes' }, { id: 'tropical', nom: 'Tropical' }, { id: 'melon', nom: 'Melon' }, { id: 'stoneFruit', nom: 'Noyau' },
  { id: 'pomeFruit', nom: 'Pomme-poire' }, { id: 'berries', nom: 'Petits fruits' }, { id: 'floral', nom: 'Floral' }, { id: 'green', nom: 'Herbe' },
  { id: 'herbal', nom: 'Herbacé' }, { id: 'spice', nom: 'Épicé' }, { id: 'earthy', nom: 'Terreux' }, { id: 'resin', nom: 'Résine' },
];

export interface FicheLevel { family: FamilyId; name: string; status: FamilyStatus; level: 0 | 1 | 2; label: string; sources: number; of: number }
/** Fiches d'un houblon sur les 12 familles, dans l'ordre du style. */
export function ficheLevels(varietyId: string, scale: StyleScale): FicheLevel[] {
  const d = describeFamilies(varietyId);
  return scale.order.map((f) => ({ family: f, name: FAMILY_NAMES[f], status: scale.families[f].status,
    level: d[f].level === 'marqué' ? 2 : d[f].level === 'cité' ? 1 : 0, label: d[f].level, sources: d[f].sources, of: d[f].of }));
}
