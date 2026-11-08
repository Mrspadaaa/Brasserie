/**
 * Le bilan d'eau d'un brassage : l'eau préparée (empâtage + rinçage) moins ce que le grain retient donne le moût qu'on collecte.
 * MV-31 (08.11) : « Rinçage 0 L » donnait 28,7 L d'eau pour 8 kg de grain, et l'écran écrivait quand même « Moût avant ébullition 34,4 L » :
 * la cible, présentée comme si l'eau la donnait. Ici, un seul calcul dit ce que l'eau donne vraiment et ce qui manque.
 */
export interface WaterBalanceInput {
  mashWaterL: number;
  spargeWaterL: number;
  /** Moût à collecter avant ébullition, à froid (la cible du calcul de volumes). */
  preBoilVolumeL: number;
  /** Eau retenue par les drêches. */
  grainAbsorptionL: number;
}

export interface WaterBalance {
  /** Moût réellement collecté avec ces volumes d'eau, à froid. */
  collectedL: number;
  targetL: number;
  /** Eau qui manque pour atteindre la cible (0 si elle est atteinte à la tolérance près). */
  shortL: number;
  /** Eau en trop (0 si la cible n'est pas dépassée à la tolérance près). */
  excessL: number;
}

/** Sous un demi-litre d'écart, le bilan est tenu : c'est moins que ce qui reste dans un tuyau. */
export const WATER_BALANCE_TOLERANCE_L = 0.5;

/** `null` quand un volume est inconnu ou négatif : un bilan n'a pas de sens sans eux (l'inconnu n'est pas 0). */
export function waterBalance(input: WaterBalanceInput): WaterBalance | null {
  const { mashWaterL, spargeWaterL, preBoilVolumeL, grainAbsorptionL } = input;
  if (![mashWaterL, spargeWaterL, preBoilVolumeL, grainAbsorptionL].every(Number.isFinite)) return null;
  if (mashWaterL < 0 || spargeWaterL < 0 || preBoilVolumeL <= 0 || grainAbsorptionL < 0) return null;
  const round = (n: number) => Math.round(n * 10) / 10;
  const collected = mashWaterL + spargeWaterL - grainAbsorptionL;
  const gap = preBoilVolumeL - collected;
  return {
    collectedL: round(Math.max(0, collected)),
    targetL: round(preBoilVolumeL),
    shortL: gap > WATER_BALANCE_TOLERANCE_L ? round(gap) : 0,
    excessL: -gap > WATER_BALANCE_TOLERANCE_L ? round(-gap) : 0,
  };
}
