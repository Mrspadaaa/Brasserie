import type { IonBand, WaterIons } from '../../types';
import { midpoint, type StyleWater } from '../waterStyles';
import { rebalanceRatio } from './ions';

/** One target policy for the workshop, saved recipes and dilution proposals. */
export function waterProfileTarget(
  style: StyleWater,
  start: WaterIons,
  customIons: Partial<WaterIons> | undefined,
  ratio: number,
  applyRatio = true
) {
  const original = customIons ? { ...start, ...customIons } : midpoint(style);
  const target = customIons && !applyRatio ? original : rebalanceRatio(original, ratio);
  // A requested ratio never silently widens the selected profile.
  const ranges = Object.fromEntries(Object.entries(style.ions).map(([ion, band]) => [ion, { ...band }])) as Record<keyof WaterIons, IonBand>;
  if (!customIons) target.hco3 = ranges.hco3.min;
  const targetedIons = customIons
    ? (Object.keys(start) as Array<keyof WaterIons>).filter(ion => customIons[ion] != null || applyRatio && (ion === 'so4' || ion === 'cl'))
    : undefined;
  return {
    target, ranges,
    mineralTargetMode: customIons ? 'target' as const : 'minimum' as const,
    fitBicarbonate: !customIons || customIons.hco3 != null,
    profilePriority: true,
    targetedIons
  };
}

/** The same post-acid bicarbonate objective for editor, recap and saved recipes. */
export function waterTreatmentTarget(style: StyleWater, customIons?: Partial<WaterIons>) {
  return customIons ? { hco3Target: customIons.hco3,
    hco3Range: customIons.hco3 == null ? undefined : { min: Math.max(0, customIons.hco3 - 2), max: customIons.hco3 + 2 } }
    : { hco3Range: style.ions.hco3 };
}
