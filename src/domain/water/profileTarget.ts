import type { IonBand, WaterIons } from '../../types';
import { type StyleWater } from '../waterStyles';
import { rebalanceRatio } from './ions';

/** House preference within a style, not a chemical optimum or another bound. */
export const STYLE_TARGET_FRACTION = 1 / 3;

export function stylePreferredIons(style: StyleWater): WaterIons {
  return Object.fromEntries(Object.entries(style.ions).map(([ion, band]) => {
    const interior = band.min + (band.max - band.min) * STYLE_TARGET_FRACTION;
    // Mg and Na need not be added when optional. On ordinary profiles, sodium
    // stays modest; a high requested floor explicitly calls for a salty beer.
    const optional = ['mg', 'na'].includes(ion) && band.min === 0;
    const modestSodium = ion === 'na' && band.min > 0 && band.min < 50;
    // HCO3 starts at the profile floor; the solve adapts it to the actual mash.
    return [ion, ion === 'hco3' ? band.min : optional ? 0 : modestSodium ? Math.max(band.min, Math.min(20, interior)) : interior];
  })) as unknown as WaterIons;
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

/** The style point is adapted to the actual mash in treatment and the solver. */
export function waterTreatmentTarget(style: StyleWater, customIons?: Partial<WaterIons>,
  mash?: { ceiling?: number | null; target?: number | null }) {
  return customIons ? { hco3Target: customIons.hco3,
    hco3Range: customIons.hco3 == null ? undefined : { min: Math.max(0, customIons.hco3 - 2), max: customIons.hco3 + 2 } }
    : { hco3Range: style.ions.hco3,
      matchMashAlkalinity: true,
      mashRaCeiling: mash?.ceiling, mashRaTarget: mash?.target };
}
