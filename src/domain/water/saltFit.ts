import type { SaltId, WaterIons } from '../../types';
import { SALTS, saltIons } from './substances';
import { constrainedLeastSquares, leastSquaresWithBounds } from './lsq';

export interface SaltFitInput {
  start: WaterIons;
  target: WaterIons;
  maxima: WaterIons;
  litres: number;
  ids: SaltId[];
  ions: ReadonlyArray<keyof WaterIons>;
  weights: number[];
  minima?: Partial<WaterIons>;
  minimumGrams?: Partial<Record<SaltId, number>>;
  maximumGrams?: Partial<Record<SaltId, number>>;
  /** Seek a jointly feasible range before choosing the closest point within it. */
  preferRanges?: boolean;
  /** For style ranges: prefer a simple recipe among fits close to the best
   * sulfate/chloride balance. Numeric point targets keep their error ranking. */
  practical?: boolean;
  requestedRatio?: number;
}

/** House tolerance for equivalent style balances, not a sensory threshold. */
export const PRACTICAL_RATIO_TOLERANCE = 0.05;
/** Weighted ppm: a small preference improvement need not buy another product. */
export const PRACTICAL_ION_TOLERANCE_PPM = 5;

export function weightedIonError(actual: WaterIons, target: WaterIons, ions: ReadonlyArray<keyof WaterIons>, weights: number[]): number {
  return Math.sqrt(ions.reduce((sum, ion, i) => sum + weights[i] * (actual[ion] - target[ion]) ** 2, 0) / weights.reduce((sum, value) => sum + value, 0));
}

/** Compare jointly constrained fits of every available salt subset on the
 * actual 0.1 g weighing grid. Composition, bounds and target policy are inputs.
 */
export function fitSaltDoses(input: SaltFitInput): Partial<Record<SaltId, number>> {
  const litres = input.litres;
  if (!Number.isFinite(litres) || litres <= 0) return {};
  const { ids, ions, weights, start, target, maxima, minima, minimumGrams = {}, maximumGrams = {} } = input;
  if (weights.every(weight => weight === 0)) return {};
  const columns = ids.map((id) => ions.map((ion) => (saltIons(id)[ion] ?? 0) / litres));
  const b = ions.map((ion) => target[ion] - start[ion]);
  // Salt additions cannot remove an existing excess. Exclude its constant
  // squared error from the near-tie tolerance: otherwise 150 ppm of source
  // HCO3 can make losing 15 ppm of reachable sodium look "within 0.75 ppm".
  const unavoidableError = ions.reduce((sum, ion, i) => sum + weights[i] * Math.max(0, start[ion] - target[ion]) ** 2, 0)
    / weights.reduce((sum, value) => sum + value, 0);
  const rooms = ions.map((ion) => Math.max(0, maxima[ion] - start[ion]));
  // An optimistic per-salt ceiling cheaply rules out subsets that cannot
  // supply a floor, before the feasibility solver explores dependent columns.
  const gramCeilings = ids.map((id, j) => Math.min(
    maximumGrams[id] ?? Infinity,
    ...columns[j].map((amount, i) => amount > 0 ? rooms[i] / amount : Infinity),
    SALTS[id].untracked?.maxPpm != null
      ? SALTS[id].untracked!.maxPpm! * litres / SALTS[id].untracked!.ppmPerGramPerLitre : Infinity,
  ));
  const candidates: Array<{
    doses: Partial<Record<SaltId, number>>;
    error: number;
    shortfall: number;
    count: number;
    grams: number;
    ratioGap: number;
  }> = [];
  let rangeFit = false;
  for (const strict of input.preferRanges ? [true, false] : [false]) {
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const selected = ids.map((_, j) => j).filter((j) => mask & (1 << j));
    if (strict && ions.some((ion, i) => (minima?.[ion] ?? 0) > start[ion] + 1e-8
      && selected.reduce((sum, j) => sum + (columns[j][i] > 0 ? columns[j][i] * gramCeilings[j] : 0), 0)
        < (minima?.[ion] ?? 0) - start[ion] - 1e-8)) continue;
    const A = ions.map((_, i) => selected.map((j) => columns[j][i]));
    // NaCl is the only sodium carrier in this mineral layer (alkalis already
    // belong to start). Translate its explicit sodium floor into grams.
    // Without this bound, the least-squares compromise consistently misses
    // 60 ppm Na even when that floor is feasible within all ion ceilings.
    const minimum = selected.map((j) =>
      ids[j] === 'nacl' && !ids.includes('nahco3')
        ? Math.max(
            0.5,
            Math.ceil(
              ((Math.max(0, (minima?.na ?? 0) - start.na) * litres) / SALTS.nacl.ions.na) * 10
            ) / 10
          )
        : (minimumGrams[ids[j]] ?? 0.5)
    );
    const offset = A.map((row) => row.reduce((s, v, k) => s + v * minimum[k], 0));
    const C: number[][] = [],
      upper: number[] = [];
    rooms.forEach((room, i) => {
      if (Number.isFinite(room)) {
        C.push(A[i]);
        upper.push(room - offset[i]);
      }
    });
    selected.forEach((j, k) => {
      if (maximumGrams[ids[j]] != null) {
        C.push(selected.map((_, t) => t === k ? 1 : 0));
        upper.push(maximumGrams[ids[j]] - minimum[k]);
      }
      const un = SALTS[ids[j]].untracked;
      if (un?.maxPpm != null) {
        const perGram = un.ppmPerGramPerLitre / litres;
        C.push(selected.map((_, t) => (t === k ? perGram : 0)));
        upper.push(un.maxPpm - minimum[k] * perGram);
      }
    });
    if (upper.some((v) => v < -1e-8)) continue;
    if (strict) ions.forEach((ion, i) => {
      if ((minima?.[ion] ?? 0) > 0) {
        C.push(A[i].map(value => -value));
        upper.push(start[ion] - minima![ion]! + offset[i]);
      }
    });
    const fit = (strict ? leastSquaresWithBounds : constrainedLeastSquares)(
      A.map((row, i) => row.map((v) => v * Math.sqrt(weights[i]))),
      b.map((v, i) => (v - offset[i]) * Math.sqrt(weights[i])),
      C,
      upper.map((v) => strict ? v : Math.max(0, v))
    );
    if (!fit.converged) continue;
    // Check both neighbouring 0.1 g doses, never round over a joint ceiling.
    const low = fit.x.map((v, k) => Math.floor((v + minimum[k] + 1e-8) * 10) / 10);
    for (let rounding = 0; rounding < 1 << selected.length; rounding++) {
      const x = low.map((v, k) => Math.round((v + (rounding & (1 << k) ? 0.1 : 0)) * 10) / 10);
      if (
        C.some(
          (row, i) => row.reduce((s, v, k) => s + v * (x[k] - minimum[k]), 0) > upper[i] + 1e-7
        )
      )
        continue;
      const actual = { ...start };
      ions.forEach((ion, i) => {
        actual[ion] += A[i].reduce((s, v, k) => s + v * x[k], 0);
      });
      const doses = Object.fromEntries(selected.map((j, k) => [ids[j], x[k]]));
      const shortfall = ions.reduce(
        (sum, ion) => sum + Math.max(0, (minima?.[ion] ?? 0) - actual[ion]) ** 2,
        0
      );
      candidates.push({
        doses,
        error: Math.sqrt(Math.max(0, weightedIonError(actual, target, ions, weights) ** 2 - unavoidableError)),
        shortfall,
        count: selected.length,
        grams: x.reduce((s, v) => s + v, 0),
        ratioGap: Number.isFinite(input.requestedRatio)
          ? actual.cl > 0 ? Math.abs(actual.so4 / actual.cl - input.requestedRatio!) : Infinity : 0,
      });
    }
  }
  if (candidates.length > 0) { rangeFit = strict; break; }
  }
  const pool = candidates;
  const best = Math.min(...pool.map((c) => c.error));
  const bestRatio = Math.min(...pool.map(candidate => candidate.ratioGap));
  const bestBalancedError = Math.min(...pool
    .filter(candidate => candidate.ratioGap <= bestRatio + PRACTICAL_RATIO_TOLERANCE)
    .map(candidate => candidate.error));
  pool.sort((a, b) => {
    if (input.practical && rangeFit) {
      const balancedA = a.ratioGap <= bestRatio + PRACTICAL_RATIO_TOLERANCE;
      const balancedB = b.ratioGap <= bestRatio + PRACTICAL_RATIO_TOLERANCE;
      const nearA = a.error <= bestBalancedError + PRACTICAL_ION_TOLERANCE_PPM;
      const nearB = b.error <= bestBalancedError + PRACTICAL_ION_TOLERANCE_PPM;
      // A simpler recipe must not erase the interior preference altogether.
      // Among comparable balances and concentration fits, use fewer products.
      return Number(balancedB) - Number(balancedA)
        || (balancedA && balancedB
          ? Number(nearB) - Number(nearA) || (nearA && nearB ? a.count - b.count : 0)
          : a.ratioGap - b.ratioGap)
        || a.error - b.error || a.grams - b.grams;
    }
    const nearA = a.error <= best + 0.75,
      nearB = b.error <= best + 0.75;
    // Entre pesées de précision comparable, préférer celle qui atteint les
    // planchers : 4.6 g de NaCl atteignent 60 ppm là où 4.5 g en donnent 59.
    return (
      Number(nearB) - Number(nearA) ||
      (nearA && nearB ? a.shortfall - b.shortfall || a.count - b.count : 0) ||
      a.error - b.error ||
      a.grams - b.grams
    );
  });
  return pool[0]?.doses ?? {};
}
