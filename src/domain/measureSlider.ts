import { isFinalWort, volumeTarget, type ReadingKind } from './brewDay';
import type { BrewDayStep, RecipeSnapshot } from '../types';

/**
 * Le curseur de la feuille Mesurer (maquette m2, passe 2b, choisie le 10.11) : les pas fins du brasseur.
 * pH 0,01 · °C 0,1 · densité 0,001 (un point) · litres 0,1.
 */
const PAS: Record<ReadingKind, { pas: number; decimales: number }> = {
  ph: { pas: 0.01, decimales: 2 },
  temperature: { pas: 0.1, decimales: 1 },
  densite: { pas: 0.001, decimales: 3 },
  volume: { pas: 0.1, decimales: 1 }
};
export const pasCurseur = (kind: ReadingKind) => PAS[kind];

/** Arrondit au pas puis borne : 64,30000000000001 devient 64,3 (jamais de dérive flottante sur un relevé). */
export function poserSurPas(kind: ReadingKind, valeur: number, min: number, max: number): number {
  const { pas, decimales } = PAS[kind];
  const sur = Number((Math.round(valeur / pas) * pas).toFixed(decimales));
  return Math.min(max, Math.max(min, sur));
}

/**
 * Les bornes plausibles de la grandeur au moment de l'étape, quand la recette n'a AUCUNE cible (VB-3, 10.11 : « utilise des slider »).
 * Ce n'est pas une cible : seulement l'étendue où un relevé de ce moment peut tomber (une ébullition se mesure vers 96–100 °C, pas à 20).
 * Une échelle sans bande ; un relevé hors de l'étendue l'étire (voir `measureScale`). `milieu` : où le pouce attend, jamais un relevé.
 */
export interface BornesPlausibles { min: number; max: number; milieu: number }

/** Étapes de l'ébullition (ids de `buildTimeline` : boil-N, boil-fin, hop-…, sucres). */
const enEbullition = (id: string) => /^boil-|^hop-/.test(id) || id === 'sucres';

export function bornesPlausibles(
  kind: ReadingKind,
  step: Pick<BrewDayStep, 'id'>,
  recipe?: RecipeSnapshot
): BornesPlausibles {
  const id = step.id;
  if (kind === 'ph') {
    // L'eau de brassage (avant l'empâtage) peut être basique ; ailleurs maische, moût, bière : 4,8 à 6,0.
    return id === 'eau' || id === 'concassage' ? { min: 5, max: 9, milieu: 7 } : { min: 4.8, max: 6, milieu: 5.4 };
  }
  if (kind === 'temperature') {
    if (enEbullition(id)) return { min: 90, max: 102, milieu: 96 };
    if (isFinalWort(id)) return { min: 10, max: 30, milieu: 20 };
    if (id === 'whirlpool') return { min: 60, max: 100, milieu: 80 };
    if (id === 'sparge' || id === 'fwh' || id === 'mashout' || id === 'preboil') return { min: 50, max: 90, milieu: 70 };
    return { min: 10, max: 100, milieu: 55 };
  }
  if (kind === 'densite') return { min: 1, max: 1.12, milieu: 1.06 };
  // Volume : autour du volume que la recette annonce pour ce moment ; aucun volume connu, une étendue de micro-brasserie.
  const plan = recipe?.waterPlan;
  const prevu = volumeTarget(step as BrewDayStep, recipe)
    ?? (/^mash/.test(id) ? plan?.mashWaterL : id === 'sparge' ? plan?.spargeWaterL : undefined)
    ?? (enEbullition(id) || id === 'preboil' ? recipe?.preBoilL : undefined)
    ?? recipe?.volumeL;
  if (prevu && prevu > 0) return { min: prevu * 0.6, max: prevu * 1.4, milieu: prevu };
  return { min: 1, max: 60, milieu: 30 };
}

/** Le pouce attend où le brasseur l'attend : sur son dernier relevé de l'étape, sinon au milieu de la cible (ou de l'échelle sans cible). */
export function departCurseur(
  kind: ReadingKind,
  echelle: { min: number; max: number; milieu?: number; bandMin?: number; bandMax?: number },
  dernier?: number | null
): number {
  const milieu = echelle.milieu ?? ((echelle.bandMin ?? echelle.min) + (echelle.bandMax ?? echelle.max)) / 2;
  const v = dernier != null && Number.isFinite(dernier) ? dernier : milieu;
  return poserSurPas(kind, v, echelle.min, echelle.max);
}

/** Le texte que le champ reçoit quand le curseur pose une valeur : virgule décimale, décimales du pas. */
export const formatCurseur = (kind: ReadingKind, valeur: number) =>
  valeur.toFixed(PAS[kind].decimales).replace('.', ',');

/** Bornes du rail alignées sur la grille du pas (sinon le natif décale le pouce d'un cran aux bouts). */
export function bornesCurseur(kind: ReadingKind, min: number, max: number): { min: number; max: number } {
  const { pas, decimales } = PAS[kind];
  return {
    min: Number((Math.ceil(min / pas - 1e-9) * pas).toFixed(decimales)),
    max: Number((Math.floor(max / pas + 1e-9) * pas).toFixed(decimales))
  };
}

/** L'écart des petits traits sous le rail (maquette m2) : 1 °C, 0,1 pH, 2 points de densité, 1 L. */
const TRAIT: Record<ReadingKind, number> = { ph: 0.1, temperature: 1, densite: 0.002, volume: 1 };
export function traitsCurseur(kind: ReadingKind, min: number, max: number): number[] {
  let t = TRAIT[kind];
  // Une échelle sans cible est plus large que la bande de z1 : jamais plus de 24 traits (un trait tous les 6 px au plus à 390).
  while ((max - min) / t > 24 && t < max - min) t *= 5;
  const out: number[] = [];
  for (let i = 1; min + i * t < max - t / 2 && i < 200; i++) out.push(min + i * t);
  return out;
}

/** Ce que la valeur dit, à côté d'elle (maquette m2) : sur quoi la mesure se prend. Rien quand le code ne le sait pas. */
export function quoiMesure(kind: ReadingKind, stepId = ''): string | null {
  if (kind === 'ph') return /^mash/.test(stepId) ? 'échantillon refroidi' : null;
  if (kind === 'temperature') return /^mash/.test(stepId) ? 'maische à cœur' : null;
  if (kind === 'densite') return ['refroidissement', 'ensemencement'].includes(stepId) ? 'moût refroidi' : null;
  if (kind === 'volume') return stepId === 'ensemencement' ? 'au fermenteur' : stepId === 'preboil' ? 'avant ébullition' : null;
  return null;
}
