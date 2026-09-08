import type { WaterIons, SaltId, IonBand } from '../../types';
import type { RaBand } from './mashPh';
import { ZERO, round1, residualAlkalinity } from './ions';
import { saltIons, netRaPerGramPerLitre, ALKALINE_SALTS } from './substances';
import { CHALK_RA_CAP_PPM, mineralTarget, MineralTargetMode, alkalineSaltGoal } from './practice';
import { waterFromPlan } from './plan';
import { solveMinerals, TASTE_IONS } from './mineralSolver';
import { solveNumericProfile } from './profileSolver';
import type { SolveIssue } from './solverMessages';
export type { IonBand } from '../../types';

export interface SolveInput {
  start: WaterIons;
  startSparge?: WaterIons;
  target: WaterIons;
  ranges: Record<keyof WaterIons, IonBand>;
  totalWaterL: number;
  mashWaterL: number;
  disabled?: SaltId[];
  targetRa?: RaBand;
  raCeiling?: number | null;
  ratio?: number;
  allSaltsInMash?: boolean;
  /** Existing style policy by default; custom numeric profiles use `target`. */
  mineralTargetMode?: MineralTargetMode;
  /** Partial custom profiles may omit bicarbonate: then it remains governed
   * by the mash policy instead of becoming an implicit source-water target. */
  fitBicarbonate?: boolean;
  /** Selected profile bounds take precedence over the heuristic mash RA estimate. */
  profilePriority?: boolean;
  /** Retained manual mash acid, expressed as mg HCO3 equivalent in that water. */
  mashAcidHco3Mg?: number;
  /** Missing values of partial custom profiles have no optimization weight. */
  targetedIons?: Array<keyof WaterIons>;
  /** Numeric HCO3 targets describe both waters after acid. Account for the
   * retained sparge acid before deciding how much mash alkali to add. */
  spargeHco3AfterAcid?: number;
}
export interface SolveResult {
  doses: Partial<Record<SaltId, number>>;
  achievedMash: WaterIons;
  achievedSparge: WaterIons;
  /** Combined treatment water, before acid, grain extraction and boil concentration. */
  achievedWort: WaterIons;
  unreachable: string[];
  issues?: SolveIssue[];
  convergence?: 'stable' | 'rounded' | 'bounded';
}

const clean = (water?: WaterIons): WaterIons =>
  Object.fromEntries(
    Object.keys(ZERO).map((ion) => [
      ion,
      Number.isFinite(water?.[ion]) ? Math.max(0, water[ion]) : 0
    ])
  ) as unknown as WaterIons;

/** Global mineral fit followed by the existing mash alkalinity policy.
 * Refit flavour salts around the alkaline contribution, with a bounded fixed
 * point iteration. Reported numbers come from the final weighed plan.
 * Mineral ceilings never get relaxed to make a target appear achievable.
 */
export function solveSaltsCore(
  input: SolveInput
): Omit<SolveResult, 'unreachable'> & { issues: SolveIssue[] } {
  const start = clean(input?.start);
  const total = input?.totalWaterL;
  const issues: SolveIssue[] = [];
  if (!Number.isFinite(total) || total <= 0) {
    issues.push({ code: 'volume' });
    return { doses: {}, achievedMash: start, achievedSparge: start, achievedWort: start, issues };
  }
  const startSparge = input.startSparge ? clean(input.startSparge) : start;
  if (!Number.isFinite(input.mashWaterL) || input.mashWaterL <= 0) {
    issues.push({ code: 'volume' });
    return { doses: {}, achievedMash: start, achievedSparge: startSparge, achievedWort: startSparge, issues };
  }
  const mashL = Math.min(total, input.mashWaterL);
  const spargeL = total - mashL;
  const allInMash = input.allSaltsInMash !== false;
  const target = mineralTarget(
    clean(input.target),
    input.ranges,
    input.mineralTargetMode ?? 'minimum'
  );
  const numericProfile = input.mineralTargetMode === 'target';
  const practicalProfile = input.profilePriority && !numericProfile;
  const balancedProfile = input.mineralTargetMode === 'balanced';
  const numericBicarbonate = input.fitBicarbonate ?? numericProfile;
  const maxima = Object.fromEntries(
    Object.keys(ZERO).map((ion) => [
      ion,
      Number.isFinite(input.ranges?.[ion]?.max) ? Math.max(0, input.ranges[ion].max) : Infinity
    ])
  ) as unknown as WaterIons;
  const off = new Set(input.disabled ?? []);
  // An explicit Mg/Na floor is a recipe choice, even below the Gose range.
  // Zero minima stay optional: the grist supplies magnesium.
  const weights = [
    // Calcium has a soft interior preference; its coupled taste ions matter
    // more. Joint lower bounds, not large Mg/Na weights, enforce style floors.
    balancedProfile ? 0.1 : practicalProfile ? 0 : 1,
    !balancedProfile && (input.ranges?.mg?.min ?? 0) > 0 ? 8 : 0.5,
    !balancedProfile && (input.ranges?.na?.min ?? 0) > 0 ? 8 : 0.5,
    2,
    2
  ].map((weight, index) => input.targetedIons && !input.targetedIons.includes(TASTE_IONS[index]) ? 0 : weight);
  const minima = Object.fromEntries(
    [...TASTE_IONS, ...(numericBicarbonate ? ['hco3' as const] : [])].map((ion) => [
      ion,
      Number.isFinite(input.ranges?.[ion]?.min) ? Math.max(0, input.ranges[ion].min) : 0
    ])
  );
  const combined = (mash: WaterIons, sparge: WaterIons): WaterIons =>
    Object.fromEntries(
      Object.keys(ZERO).map((ion) => [ion, (mash[ion] * mashL + sparge[ion] * spargeL) / total])
    ) as unknown as WaterIons;
  const base = combined(start, startSparge);
  const spargeHco3Removed = numericBicarbonate && Number.isFinite(input.spargeHco3AfterAcid)
    ? Math.max(0, startSparge.hco3 - Math.max(0, input.spargeHco3AfterAcid)) * spargeL / total
    : 0;
  const mashHco3Removed = numericBicarbonate && Number.isFinite(input.mashAcidHco3Mg)
    ? Math.max(0, input.mashAcidHco3Mg) / total : 0;
  const acidHco3Removed = spargeHco3Removed + mashHco3Removed;
  const spargeAfterContribution = startSparge.hco3 * spargeL / total - spargeHco3Removed;
  // Each water is neutralized separately and cannot have negative HCO3.
  // If the sparge already supplies the requested minimum, zero mash HCO3
  // is valid: do not buy alkali merely to cancel an excessive manual acid dose.
  const rawTarget = (after: number) => after > spargeAfterContribution
    ? after + acidHco3Removed : startSparge.hco3 * spargeL / total;
  target.hco3 = rawTarget(target.hco3);
  maxima.hco3 += acidHco3Removed;
  if (numericBicarbonate) minima.hco3 = minima.hco3 > spargeAfterContribution
    ? minima.hco3 + acidHco3Removed : 0;
  const waters = (doses: Partial<Record<SaltId, number>>) =>
    waterFromPlan(start, doses, mashL, spargeL, startSparge, allInMash);
  const wort = (doses: Partial<Record<SaltId, number>>) => {
    const w = waters(doses);
    return combined(w.mash, w.sparge);
  };
  const band = input.targetRa;
  const alkaliGoal = alkalineSaltGoal(band, input.raCeiling);
  const saltTarget = alkaliGoal.target;
  const needsAlkaline = band && band.min >= 0;
  const alkaline = (flavour: Partial<Record<SaltId, number>>) => {
    const doses = { ...flavour };
    if (!needsAlkaline) return {};
    const candidates = ALKALINE_SALTS.filter(
      (id) => !off.has(id) && (id !== 'caco3' || off.has('chaux'))
    );
    const used = new Set<SaltId>();
    for (let pass = 0; pass < candidates.length; pass++) {
      const gap = saltTarget - residualAlkalinity(waters(doses).mash);
      if (gap <= 5) break;
      const current = wort(doses);
      let best: SaltId | undefined,
        bestG = 0,
        bestRa = 0;
      for (const id of candidates.filter((id) => !used.has(id))) {
        const perGram = netRaPerGramPerLitre(id);
        if (perGram <= 0) continue;
        let g = (gap * mashL) / perGram;
        for (const ion of TASTE_IONS) {
          const ppm = (saltIons(id)[ion] ?? 0) / total;
          if (ppm > 0) g = Math.min(g, Math.max(0, maxima[ion] - current[ion]) / ppm);
        }
        if (id === 'caco3') g = Math.min(g, (CHALK_RA_CAP_PPM * mashL) / perGram);
        const delivered = (g * perGram) / mashL;
        g = Math.floor((g + 1e-9) * 10) / 10;
        if (g < (id === 'chaux' ? 0.1 : 0.5)) continue;
        // Compare before rounding; otherwise a 0.1 g remainder changes the
        // chosen alkali at every EBC tick, switching calcium for sodium.
        if (delivered > bestRa + 1e-7) {
          best = id;
          bestG = g;
          bestRa = delivered;
        }
      }
      if (!best) break;
      doses[best] = bestG;
      used.add(best);
    }
    return Object.fromEntries(
      ALKALINE_SALTS.filter((id) => doses[id]).map((id) => [id, doses[id]])
    );
  };
  let doses: Partial<Record<SaltId, number>> = {};
  let stable = !needsAlkaline;
  let numericAlkalinityLimit = false;
  if (numericBicarbonate) {
    const fitted = solveNumericProfile({
      start: base, target, maxima, minima, totalL: total, mashL,
      disabled: off, weights, waters,
      preferRanges: input.profilePriority,
      practical: practicalProfile,
      requestedRatio: input.ratio ?? (target.cl > 0 ? target.so4 / target.cl : undefined),
      raCeiling: input.profilePriority ? Infinity : Math.min(
        Number.isFinite(band?.max) ? band.max : Infinity,
        Number.isFinite(input.raCeiling) ? input.raCeiling : Infinity
      )
    });
    doses = fitted.doses;
    stable = fitted.converged;
    numericAlkalinityLimit = fitted.limitedByAlkalinity;
  } else {
    let alk: Partial<Record<SaltId, number>> = alkaline({});
    const seen = new Set<string>();
    for (let pass = 0; pass < (needsAlkaline ? 12 : 1); pass++) {
      const flavour = solveMinerals(wort(alk), target, maxima, total, off, weights, minima, input.profilePriority);
      // Recompute from scratch: corrections must not accumulate and need acid
      // merely to undo the previous iteration.
      const nextAlk = alkaline(flavour);
      doses = { ...flavour, ...nextAlk };
      const signature = JSON.stringify(nextAlk);
      if (signature === JSON.stringify(alk)) {
        stable = true;
        break;
      }
      if (seen.has(signature)) break;
      seen.add(signature);
      alk = nextAlk;
    }
  }
  const water = waters(doses);
  const finalWort = combined(water.mash, water.sparge);
  const ra = residualAlkalinity(water.mash);
  let convergence: SolveResult['convergence'] = 'stable';
  if (!stable && !numericBicarbonate) {
    const finalAlk = Object.fromEntries(
      ALKALINE_SALTS.filter((id) => doses[id]).map((id) => [id, doses[id]])
    );
    const refit = {
      ...solveMinerals(wort(finalAlk), target, maxima, total, off, weights, minima, input.profilePriority),
      ...finalAlk
    };
    const check = wort(refit);
    // A cycle of neighbouring 0.1 g doses is a weighing compromise, not an
    // unresolved numerical failure. Keep that distinction available to tests.
    convergence =
      Math.abs(ra - saltTarget) <= 5 &&
      TASTE_IONS.every((ion) => Math.abs(check[ion] - finalWort[ion]) <= 2)
        ? 'rounded'
        : 'bounded';
  }
  if (!stable && numericBicarbonate) convergence = 'bounded';
  if (numericBicarbonate && (input.profilePriority
    ? round1(finalWort.hco3) < minima.hco3 : target.hco3 - finalWort.hco3 > 3)) {
    issues.push({
      code: 'bicarbonate-target', value: finalWort.hco3 - acidHco3Removed,
      target: (input.profilePriority ? minima.hco3 : target.hco3) - acidHco3Removed,
      limitedByAlkalinity: numericAlkalinityLimit,
      excluded: ALKALINE_SALTS.every(id => off.has(id))
    });
  }
  if (band) {
    if (!numericBicarbonate && alkaliGoal.limitedByGrist)
      issues.push({ code: 'grist', target: saltTarget, colour: band.min });
    if (!numericBicarbonate && needsAlkaline && ra < saltTarget - 10)
      issues.push({
        code: 'alkalinity-low',
        value: saltTarget - ra,
        excluded: ALKALINE_SALTS.every((id) => off.has(id))
      });
    if (ra > band.max + 5)
      issues.push({ code: 'alkalinity-high', value: ra, min: band.min, max: band.max });
    if (convergence === 'bounded') issues.push({ code: 'iteration' });
  }
  for (const ion of TASTE_IONS) {
    if (input.profilePriority) {
      if (input.targetedIons && !input.targetedIons.includes(ion)) continue;
      const value = round1(finalWort[ion]);
      if (value < (minima[ion] ?? 0)) issues.push({ code: 'low', ion, value, target: minima[ion] });
      if (value > maxima[ion]) issues.push({ code: 'high', ion, value, max: maxima[ion], source: base[ion] });
      continue;
    }
    if (finalWort[ion] > maxima[ion] + 2)
      issues.push({
        code: 'high',
        ion,
        value: finalWort[ion],
        max: maxima[ion],
        source: base[ion]
      });
    const minimum = input.ranges?.[ion]?.min ?? 0;
    if (ion === 'ca' && (finalWort.ca < minimum - 2 || numericProfile && target.ca - finalWort.ca > 3))
      issues.push({ code: 'low', ion, value: finalWort.ca, target: numericProfile ? Math.max(minimum, target.ca) : minimum });
    if (
      ion !== 'ca' &&
      (minimum - finalWort[ion] > 2 || target[ion] - finalWort[ion] > (ion === 'mg' ? 3 : 10))
    )
      issues.push({
        code: 'low',
        ion,
        value: finalWort[ion],
        target: Math.max(minimum, target[ion])
      });
  }
  Object.keys(finalWort).forEach((ion) => {
    finalWort[ion] = round1(finalWort[ion]);
  });
  return {
    doses,
    achievedMash: water.mash,
    achievedSparge: water.sparge,
    achievedWort: finalWort,
    issues,
    convergence
  };
}
