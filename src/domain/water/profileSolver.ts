import type { SaltId, WaterIons } from '../../types';
import { CA_DIVISOR, MG_DIVISOR, residualAlkalinity } from './ions';
import { ALKALINE_SALTS, netRaPerGramPerLitre } from './substances';
import { FLAVOUR_SALTS, TASTE_IONS } from './mineralSolver';
import { fitSaltDoses } from './saltFit';
import { CHALK_RA_CAP_PPM } from './practice';

interface ProfileFitInput {
  start: WaterIons;
  target: WaterIons;
  maxima: WaterIons;
  minima: Partial<WaterIons>;
  totalL: number;
  mashL: number;
  disabled: Set<SaltId>;
  weights: number[];
  /** Maximum mash RA; a numeric profile must not buy alkali beyond it. */
  raCeiling?: number;
  preferRanges?: boolean;
  practical?: boolean;
  requestedRatio?: number;
  waters: (doses: Partial<Record<SaltId, number>>) => { mash: WaterIons; sparge: WaterIons };
}

/** Numeric profiles fit all six concentrations together. The old flavour-only
 * fit silently discarded HCO3, even for an explicit user-entered target.
 * A mash RA limit is converted to a total-water HCO3 ceiling and tightened
 * after every refit, since calcium and magnesium are part of that limit.
 */
export function solveNumericProfile(input: ProfileFitInput) {
  const { start, target, totalL, mashL, disabled, waters, weights, minima } = input;
  const maxima = { ...input.maxima };
  const spargeL = totalL - mashL;
  const alkaline = ALKALINE_SALTS.filter(id => !disabled.has(id) && (id !== 'caco3' || disabled.has('chaux')));
  const ids = [...FLAVOUR_SALTS.filter(id => !disabled.has(id)), ...alkaline];
  let doses: Partial<Record<SaltId, number>> = {};
  let limitedByAlkalinity = false;
  let converged = true;
  for (let pass = 0; pass < 16; pass++) {
    doses = fitSaltDoses({
      start, target, maxima, minima, litres: totalL, ids,
      ions: [...TASTE_IONS, 'hco3'], weights: [...weights, 2],
      minimumGrams: { chaux: 0.1 },
      preferRanges: input.preferRanges,
      practical: input.practical,
      requestedRatio: input.requestedRatio,
      maximumGrams: { caco3: CHALK_RA_CAP_PPM * mashL / netRaPerGramPerLitre('caco3') }
    });
    const water = waters(doses);
    const ceiling = input.raCeiling;
    if (!Number.isFinite(ceiling) || residualAlkalinity(water.mash) <= ceiling + 0.2) break;
    // Source alkalinity can only be removed by acid/dilution, never by
    // inventing a negative salt dose. Forbid additional alkali in that case.
    const allowedMash = Math.max(0, (ceiling + water.mash.ca / CA_DIVISOR + water.mash.mg / MG_DIVISOR) * 61 / 50);
    const allowedTotal = (allowedMash * mashL + water.sparge.hco3 * spargeL) / totalL;
    const nextMax = Math.max(start.hco3, Math.min(maxima.hco3, allowedTotal));
    if (nextMax >= maxima.hco3 - 0.01) break;
    maxima.hco3 = nextMax;
    limitedByAlkalinity = true;
    converged = pass < 15;
  }
  // Enforce the last bound even if the grid changed at the iteration limit.
  // Removing positive-RA salts cannot violate any mineral ceiling.
  if (Number.isFinite(input.raCeiling)) {
    const flavour = Object.fromEntries(Object.entries(doses).filter(([id]) => !ALKALINE_SALTS.includes(id as SaltId)));
    const flavourRa = residualAlkalinity(waters(flavour).mash);
    let room = Math.max(0, input.raCeiling - flavourRa);
    for (const id of alkaline) {
      const grams = doses[id] ?? 0;
      if (!grams) continue;
      const perGram = netRaPerGramPerLitre(id) / mashL;
      const allowed = Math.floor((Math.min(grams, room / perGram) + 1e-9) * 10) / 10;
      const retained = allowed >= (id === 'chaux' ? 0.1 : 0.5) ? allowed : 0;
      if (retained < grams) limitedByAlkalinity = true;
      if (retained) doses[id] = retained;
      else delete doses[id];
      room = Math.max(0, room - retained * perGram);
    }
  }
  return { doses, limitedByAlkalinity, converged };
}
