import type { WaterIons, SaltId } from '../../types';
import { SALTS, saltIons } from './substances';
import { constrainedLeastSquares } from './lsq';

export const TASTE_IONS = ['ca', 'mg', 'na', 'so4', 'cl'] as const;
export const FLAVOUR_SALTS: SaltId[] = ['gypse', 'cacl2', 'epsom', 'mgcl2', 'nacl', 'kcl'];
// Sulfate/chloride drive balance, calcium follows; Mg/Na still have an objective.
export const ION_WEIGHTS = [1, 0.5, 0.5, 2, 2];
export function mineralError(actual: WaterIons, target: WaterIons, weights = ION_WEIGHTS): number {
  return Math.sqrt(TASTE_IONS.reduce((s, ion, i) => s + weights[i] * (actual[ion] - target[ion]) ** 2, 0) / weights.reduce((s,v) => s+v, 0));
}

/** Enumerate the 64 supports, solve each with its joint ion ceilings, then
 * compare the doses that can actually be weighed. Accuracy comes first;
 * within 0.75 weighted ppm of the best plan prefer fewer salts.
 */
export function solveMinerals(start: WaterIons, target: WaterIons, maxima: WaterIons,
  litres: number, disabled: Set<SaltId>, weights = ION_WEIGHTS): Partial<Record<SaltId, number>> {
  const ids = FLAVOUR_SALTS.filter(id => !disabled.has(id));
  const columns = ids.map(id => TASTE_IONS.map(ion => (saltIons(id)[ion] ?? 0) / litres));
  const b = TASTE_IONS.map(ion => target[ion] - start[ion]);
  const rooms = TASTE_IONS.map(ion => Math.max(0, maxima[ion] - start[ion]));
  const candidates: Array<{ doses: Partial<Record<SaltId, number>>; error: number; count: number; grams: number }> = [];
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const selected = ids.map((_, j) => j).filter(j => mask & (1 << j));
    const A = TASTE_IONS.map((_, i) => selected.map(j => columns[j][i]));
    // Each selected salt must be weighable. Translate x >= 0.5 into y >= 0.
    const minimum = 0.5;
    const offset = A.map(row => row.reduce((s, v) => s + v * minimum, 0));
    const C: number[][] = [], upper: number[] = [];
    rooms.forEach((room, i) => { if (Number.isFinite(room)) { C.push(A[i]); upper.push(room - offset[i]); } });
    selected.forEach((j, k) => {
      const un = SALTS[ids[j]].untracked;
      if (un?.maxPpm != null) {
        const perGram = un.ppmPerGramPerLitre / litres;
        C.push(selected.map((_, t) => t === k ? perGram : 0));
        upper.push(un.maxPpm - minimum * perGram);
      }
    });
    if (upper.some(v => v < -1e-8)) continue;
    const fit = constrainedLeastSquares(A.map((row, i) => row.map(v => v * Math.sqrt(weights[i]))),
      b.map((v, i) => (v - offset[i]) * Math.sqrt(weights[i])), C, upper.map(v => Math.max(0, v)));
    if (!fit.converged) continue;
    // Check both neighbouring 0.1 g doses, never round over a joint ceiling.
    const low = fit.x.map(v => Math.floor((v + minimum + 1e-8) * 10) / 10);
    for (let rounding = 0; rounding < 1 << selected.length; rounding++) {
      const x = low.map((v, k) => Math.round((v + ((rounding & (1 << k)) ? 0.1 : 0)) * 10) / 10);
      if (C.some((row, i) => row.reduce((s, v, k) => s + v * (x[k] - minimum), 0) > upper[i] + 1e-7)) continue;
      const actual = { ...start };
      TASTE_IONS.forEach((ion, i) => { actual[ion] += A[i].reduce((s, v, k) => s + v * x[k], 0); });
      const doses = Object.fromEntries(selected.map((j, k) => [ids[j], x[k]]));
      candidates.push({ doses, error: mineralError(actual, target, weights), count: selected.length, grams: x.reduce((s, v) => s + v, 0) });
    }
  }
  const best = Math.min(...candidates.map(c => c.error));
  candidates.sort((a, b) => {
    const nearA = a.error <= best + 0.75, nearB = b.error <= best + 0.75;
    return Number(nearB) - Number(nearA) || (nearA && nearB ? a.count - b.count : 0) || a.error - b.error || a.grams - b.grams;
  });
  return candidates[0]?.doses ?? {};
}
