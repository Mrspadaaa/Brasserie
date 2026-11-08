/**
 * Bornes des densités d'un brassin (fiche brassin, catalogue, taxe).
 *
 * OG d'une bière : 1,020 à 1,130 (BJCP 2021 : Imperial Stout et Eisbock ≤ 1,120). Au-delà, c'est une
 * erreur de saisie probable (« 1048 » pour 1,048, « 5 » pour 1,050), jamais une bière.
 * FG : de 0,995 (bière très sèche) jusqu'à l'OG. Une FG au-dessus de l'OG est une atténuation négative.
 * L'alcool qui en découle est plausible sous 18 % vol. (`ABV_MAX`) : seul le coin extrême 1,130 vers 0,995 le dépasse (18,6 par la méthode ASBC, 17,7 par l'ancienne formule simple) et n'est alors pas calculé.
 */

import { BORNES } from './bornesMetier';
import { alcoholByVolume } from './alcohol';

export const OG_MIN = 1.02;
// Source unique de la borne haute d'OG : la table des bornes métier de la recette (08.11, pas de seconde copie).
export const OG_MAX = BORNES.og.max;
export const FG_MIN = 0.995;
export const ABV_MAX = 18;

export type GravityProblem = 'og-low' | 'og-high' | 'fg-low' | 'fg-above-og' | 'fg-high';

const fr = (n: number) => n.toFixed(3).replace('.', ',');

/** `null` quand la valeur est plausible, sinon le motif. L'OG connue sert de plafond à la FG. */
export function gravityProblem(field: 'og' | 'fg', value: number, og: number | null = null): GravityProblem | null {
  if (!Number.isFinite(value)) return field === 'og' ? 'og-low' : 'fg-low';
  if (field === 'og') return value < OG_MIN ? 'og-low' : value > OG_MAX ? 'og-high' : null;
  if (value < FG_MIN) return 'fg-low';
  if (og !== null && Number.isFinite(og) && value > og) return 'fg-above-og';
  if (value > OG_MAX) return 'fg-high';
  return null;
}

/** Phrase claire pour le brasseur, valeur comprise. */
export function gravityMessage(problem: GravityProblem, value: number, og: number | null = null): string {
  switch (problem) {
    case 'og-low': return `OG ${fr(value)} : sous ${fr(OG_MIN)}, trop faible pour une bière. Vérifie la saisie (1,048 se tape 1,048).`;
    case 'og-high': return `OG ${fr(value)} : au-dessus de ${fr(OG_MAX)}, aucune bière n’est si dense. Vérifie la saisie (1,048 se tape 1,048).`;
    case 'fg-low': return `FG ${fr(value)} : sous ${fr(FG_MIN)}, impossible pour une bière finie. Vérifie la saisie.`;
    case 'fg-above-og': return `FG ${fr(value)} : au-dessus de l’OG${og !== null ? ` ${fr(og)}` : ''}. L’alcool ne peut pas se calculer.`;
    case 'fg-high': return `FG ${fr(value)} : au-dessus de ${fr(OG_MAX)}, aucune bière n’est si dense. Vérifie la saisie.`;
  }
}

/** Un alcool écrit (en % vol.) est plausible entre 0 et 18. */
export function plausibleAbv(abv: number | null | undefined): abv is number {
  return typeof abv === 'number' && Number.isFinite(abv) && abv >= 0 && abv <= ABV_MAX;
}

/**
 * Alcool tiré d'une OG et d'une FG, ou `null` : une des deux manque, sort des bornes, ou la FG dépasse l'OG.
 * Un alcool absurde n'est jamais calculé, donc jamais écrit.
 */
export function abvFromGravities(og: number | null, fg: number | null): number | null {
  if (og === null || fg === null) return null;
  if (gravityProblem('og', og) || gravityProblem('fg', fg, og)) return null;
  // Même formule que BrewingMath.calculateABV : `alcohol.ts`, sans import (brewingMath importe la taxe, qui importe ce module).
  const abv = Math.round(alcoholByVolume(og, fg) * 10) / 10;
  return plausibleAbv(abv) ? abv : null;
}
