import type { IonBand, WaterIons } from '../../types';

export const PROFILE_IONS = ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const;

/** A profile is achieved only when every specified ion is inside its bounds. */
export function assessWaterProfile(actual: WaterIons, ranges: Record<keyof WaterIons, IonBand>,
  targeted: ReadonlyArray<keyof WaterIons> = PROFILE_IONS) {
  const deviations = targeted.flatMap(ion => {
    const value = actual[ion], range = ranges[ion];
    if (Number.isFinite(value) && value >= range.min && value <= range.max) return [];
    return [{ ion, value, min: range.min, max: range.max,
      delta: value < range.min ? value - range.min : value - range.max }];
  });
  return { reached: targeted.length > 0 && deviations.length === 0,
    count: targeted.length, inRange: targeted.length - deviations.length, deviations };
}
