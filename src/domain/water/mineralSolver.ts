import type { WaterIons, SaltId } from '../../types';
import { fitSaltDoses } from './saltFit';

export const TASTE_IONS = ['ca', 'mg', 'na', 'so4', 'cl'] as const;
export const FLAVOUR_SALTS: SaltId[] = ['gypse', 'cacl2', 'epsom', 'mgcl2', 'nacl', 'kcl'];
// Sulfate/chloride drive balance, calcium follows; Mg/Na still have an objective.
export const ION_WEIGHTS = [1, 0.5, 0.5, 2, 2];
export function mineralError(actual: WaterIons, target: WaterIons, weights = ION_WEIGHTS): number {
  return Math.sqrt(
    TASTE_IONS.reduce((s, ion, i) => s + weights[i] * (actual[ion] - target[ion]) ** 2, 0) /
      weights.reduce((s, v) => s + v, 0)
  );
}

/** Flavour-only fitting used by the style/alkalinity policy. */
export function solveMinerals(
  start: WaterIons,
  target: WaterIons,
  maxima: WaterIons,
  litres: number,
  disabled: Set<SaltId>,
  weights = ION_WEIGHTS,
  minima?: Partial<WaterIons>,
  preferRanges = false
): Partial<Record<SaltId, number>> {
  return fitSaltDoses({
    start, target, maxima, litres, weights, minima, preferRanges,
    ids: FLAVOUR_SALTS.filter(id => !disabled.has(id)),
    ions: TASTE_IONS
  });
}
