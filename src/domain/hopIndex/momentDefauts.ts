// Les champs d'un moment de houblon : ce qu'une ligne neuve porte, et ce qu'un changement de moment emporte (BR-3, TE-26, 08.11).
//
// Cas réel : « Ébullition (60 min) » passée en Whirlpool gardait « durée 60 min » (un whirlpool d'une heure), et le retour à l'ébullition ne
// rendait pas le temps. Chaque moment a ses champs : durée seule en ébullition, durée et température en whirlpool, jour à cru. Changer de
// moment pose ceux du nouveau moment, aux valeurs d'une ligne neuve, et retire ceux de l'ancien. Une seule règle pour l'ajout et le changement.
import type { HopIngredient, HopStage } from '../../types';

/** Whirlpool d'une ligne neuve : 20 min à 80 °C (hop stand courant ; les bornes sont dans `bornesMetier.ts`). */
export const WHIRLPOOL_DEFAUT = { timeMin: 20, tempC: 80 } as const;
/** Jour d'un houblonnage à cru neuf : J+3. */
export const DRYHOP_JOUR_DEFAUT = 3;

/** Les champs de moment d'une ligne neuve de ce moment. */
export function champsMomentNeuf(stage: HopStage, boilMin: number): Pick<HopIngredient, 'timeMin' | 'tempC' | 'dayOffset'> {
  if (stage === 'boil') return { timeMin: Number.isFinite(boilMin) && boilMin > 0 ? boilMin : undefined };
  if (stage === 'whirlpool') return { ...WHIRLPOOL_DEFAUT };
  if (stage === 'dryHop') return { dayOffset: DRYHOP_JOUR_DEFAUT };
  return {};
}

/** La ligne passée à un autre moment : les champs de l'ancien moment partent, ceux du nouveau sont posés (sans clé vide). */
export function changerMoment(h: HopIngredient, stage: HopStage, boilMin: number): HopIngredient {
  if (h.stage === stage) return h;
  const { timeMin: _t, tempC: _c, dayOffset: _d, ...reste } = h;
  const neufs = champsMomentNeuf(stage, boilMin);
  return { ...reste, stage, ...Object.fromEntries(Object.entries(neufs).filter(([, v]) => v !== undefined)) } as HopIngredient;
}
