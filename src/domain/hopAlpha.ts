// L'alpha d'un houblon au-delà du plausible : une saisie à confirmer (audit métier du 08.11, AM 9).
//
// « 80 » tapé pour 8,0 multipliait l'IBU par dix, sans alerte. Un alpha commercial va de ~2 % (houblons nobles) à ~20–22 % (Apollo, CTZ ;
// fiches de lot Hopsteiner, Yakima Chief). Seuls les extraits (CO₂, isomérisés) dépassent 30 % : c'est donc une valeur à confirmer, pas à refuser.
// Tant qu'elle n'est pas confirmée, l'IBU n'est pas calculé (`hotBitterness`), et la recette ne s'enregistre pas (`recipeSaveIssues`).
// La confirmation porte la valeur confirmée (`alphaConfirme`) : changer l'alpha la redemande.
import type { HopIngredient } from '../types';
import { BORNES } from './bornesMetier';

export const ALPHA_PLAUSIBLE_MAX = BORNES.alphaPct.max;

/** Le champ de confirmation, écrit à côté de l'alpha sur la ligne de houblon de la recette. */
export type HopAlphaConfirmable = Pick<HopIngredient, 'alpha'> & { alphaConfirme?: number };

export const alphaAConfirmer = (h: HopAlphaConfirmable): boolean =>
  Number.isFinite(h.alpha) && h.alpha > ALPHA_PLAUSIBLE_MAX && h.alpha <= 100 && h.alphaConfirme !== h.alpha;

const fr = (x: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
/** La lecture probable d'un alpha trop haut : « 80 » pour 8,0. */
export const alphaProbable = (alpha: number): string => (alpha / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

export function messageAlpha(h: HopAlphaConfirmable & { name?: string }): string | null {
  if (!alphaAConfirmer(h)) return null;
  return `${h.name?.trim() || 'Ce houblon'} : α ${fr(h.alpha)} % ? Un houblon dépasse rarement 22 % (${alphaProbable(h.alpha)} % ?). Corrige, ou confirme si c’est un extrait.`;
}
