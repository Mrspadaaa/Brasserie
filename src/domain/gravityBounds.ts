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

/**
 * Limites physiques d'une densité : en deçà ou au-delà, ce n'est plus « improbable » mais impossible (l'eau pure vaut 1,000 ; un sirop
 * de sucre saturé dépasse à peine 1,300 ; un moût de bière reste sous 1,200 même pour un Eisbock réduit). Une densité hors de ces limites
 * ne s'enregistre jamais (RJ-2, 08.11) ; entre ces limites et les bornes d'un brassin, elle se garde après confirmation.
 */
export const GRAVITY_FLOOR = 0.99;
export const GRAVITY_CEILING = 1.2;

export type GravityProblem = 'og-low' | 'og-high' | 'og-below-fg' | 'fg-low' | 'fg-above-og' | 'fg-high';

const fr = (n: number) => n.toFixed(3).replace('.', ',');

/** `null` quand la valeur est plausible, sinon le motif. L'OG connue sert de plafond à la FG ; la FG connue, de plancher à l'OG. */
export function gravityProblem(field: 'og' | 'fg', value: number, og: number | null = null, fg: number | null = null): GravityProblem | null {
  if (!Number.isFinite(value)) return field === 'og' ? 'og-low' : 'fg-low';
  if (field === 'og') {
    if (value < OG_MIN) return 'og-low';
    if (value > OG_MAX) return 'og-high';
    return fg !== null && Number.isFinite(fg) && fg > value ? 'og-below-fg' : null;
  }
  if (value < FG_MIN) return 'fg-low';
  if (og !== null && Number.isFinite(og) && value > og) return 'fg-above-og';
  if (value > OG_MAX) return 'fg-high';
  return null;
}

/**
 * Une densité se garde-t-elle, au besoin après confirmation ? Non si elle est impossible : hors de [0,990 ; 1,200], illisible, ou dans un
 * ordre qu'aucune bière ne produit (FG au-dessus de l'OG, OG sous la FG déjà notée). `og` et `fg` sont les mesures déjà connues de l'autre champ.
 */
export function gravityKeepable(field: 'og' | 'fg', value: number, og: number | null = null, fg: number | null = null): boolean {
  if (!Number.isFinite(value) || value < GRAVITY_FLOOR || value > GRAVITY_CEILING) return false;
  if (field === 'fg') return !(og !== null && Number.isFinite(og) && value > og);
  return !(fg !== null && Number.isFinite(fg) && fg > value);
}

/**
 * Phrase claire pour le brasseur, valeur comprise. `keepable: false` ajoute que la valeur ne s'enregistre pas.
 * Un OG tapé 1048 pour 1,048 est l'erreur la plus courante : l'exemple la montre (le champ ne devine pas la virgule).
 */
export function gravityMessage(problem: GravityProblem, value: number, og: number | null = null, keepable = true, fg: number | null = null): string {
  const refus = keepable ? '' : ' Cette valeur est impossible : elle ne s’enregistre pas.';
  const virgule = ' Vérifie la saisie : la densité s’écrit avec sa virgule, 1,048 et non 1048.';
  switch (problem) {
    case 'og-low': return `OG ${fr(value)} : sous ${fr(OG_MIN)}, trop faible pour une bière.${virgule}${refus}`;
    case 'og-high': return `OG ${fr(value)} : au-dessus de ${fr(OG_MAX)}, aucune bière n’est si dense.${virgule}${refus}`;
    case 'og-below-fg': return `OG ${fr(value)} : sous la FG${fg !== null ? ` ${fr(fg)}` : ''} déjà notée. Une bière ne finit pas plus dense qu’elle ne commence : corrige d’abord la FG.${refus}`;
    case 'fg-low': return `FG ${fr(value)} : sous ${fr(FG_MIN)}, impossible pour une bière finie. Vérifie la saisie.${refus}`;
    case 'fg-above-og': return `FG ${fr(value)} : au-dessus de l’OG${og !== null ? ` ${fr(og)}` : ''}. Une bière ne finit pas plus dense qu’elle ne commence, et l’alcool ne peut pas se calculer.${refus}`;
    case 'fg-high': return `FG ${fr(value)} : au-dessus de ${fr(OG_MAX)}, aucune bière n’est si dense. Vérifie la saisie.${refus}`;
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
