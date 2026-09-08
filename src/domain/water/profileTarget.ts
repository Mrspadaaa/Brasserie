import type { IonBand, WaterIons } from '../../types';
import { type StyleWater } from '../waterStyles';
import { rebalanceRatio } from './ions';

/** House preference within a style, not a chemical optimum or another bound. */
export const STYLE_TARGET_FRACTION = 1 / 3;

export function stylePreferredIons(style: StyleWater): WaterIons {
  return Object.fromEntries(Object.entries(style.ions).map(([ion, band]) => [ion,
    // A zero floor permits these additions; it does not require them.
    ['mg', 'na', 'hco3'].includes(ion) && band.min === 0 ? 0
      : band.min + (band.max - band.min) * STYLE_TARGET_FRACTION
  ])) as unknown as WaterIons;
}

/** One target policy for the workshop, saved recipes and dilution proposals. */
export function waterProfileTarget(
  style: StyleWater,
  start: WaterIons,
  customIons: Partial<WaterIons> | undefined,
  ratio: number,
  applyRatio = true
) {
  const original = customIons ? { ...start, ...customIons } : stylePreferredIons(style);
  const target = customIons && !applyRatio ? original : rebalanceRatio(original, ratio);
  // A requested ratio never silently widens the selected profile.
  const ranges = Object.fromEntries(Object.entries(style.ions).map(([ion, band]) => [ion, { ...band }])) as Record<keyof WaterIons, IonBand>;
  const targetedIons = customIons
    ? (Object.keys(start) as Array<keyof WaterIons>).filter(ion => customIons[ion] != null || applyRatio && (ion === 'so4' || ion === 'cl'))
    : undefined;
  return {
    target, ranges,
    mineralTargetMode: customIons ? 'target' as const : 'balanced' as const,
    fitBicarbonate: !customIons || customIons.hco3 != null,
    profilePriority: true,
    targetedIons
  };
}

/** The same post-acid bicarbonate objective for editor, recap and saved recipes. */
export function waterTreatmentTarget(style: StyleWater, customIons?: Partial<WaterIons>) {
  return customIons ? { hco3Target: customIons.hco3,
    hco3Range: customIons.hco3 == null ? undefined : { min: Math.max(0, customIons.hco3 - 2), max: customIons.hco3 + 2 } }
    : { hco3Range: style.ions.hco3,
      // When the style permits zero, keep the mash-based acid preference.
      hco3Preferred: style.ions.hco3.min > 0 ? stylePreferredIons(style).hco3 : undefined };
}
