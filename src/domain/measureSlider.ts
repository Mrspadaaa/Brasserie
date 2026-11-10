import type { ReadingKind } from './brewDay';

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

/** Le pouce attend où le brasseur l'attend : sur son dernier relevé de l'étape, sinon au milieu de la cible. */
export function departCurseur(
  kind: ReadingKind,
  echelle: { min: number; max: number; bandMin: number; bandMax: number },
  dernier?: number | null
): number {
  const milieu = (echelle.bandMin + echelle.bandMax) / 2;
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
  const t = TRAIT[kind];
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
