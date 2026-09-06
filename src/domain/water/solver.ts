import type { WaterIons, SaltId, IonBand } from '../../types';
import type { RaBand } from './mashPh';
import { ZERO, round1, residualAlkalinity } from './ions';
import { saltIons, netRaPerGramPerLitre, ALKALINE_SALTS } from './substances';
import { CHALK_RA_CAP_PPM, mineralTarget, MineralTargetMode } from './practice';
import { waterFromPlan } from './plan';
import { solveMinerals, TASTE_IONS } from './mineralSolver';
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

const clean = (water?: WaterIons): WaterIons => Object.fromEntries(Object.keys(ZERO).map(ion =>
  [ion, Number.isFinite(water?.[ion]) ? Math.max(0, water[ion]) : 0])) as unknown as WaterIons;

/** Global mineral fit followed by the existing mash alkalinity policy.
 * Refit flavour salts around the alkaline contribution, with a bounded fixed
 * point iteration. Reported numbers come from the final weighed plan.
 * Mineral ceilings never get relaxed to make a target appear achievable.
 */
export function solveSaltsCore(input: SolveInput): Omit<SolveResult, 'unreachable'> & { issues: SolveIssue[] } {
  const start = clean(input?.start);
  const total = input?.totalWaterL;
  const issues: SolveIssue[] = [];
  if (!Number.isFinite(total) || total <= 0) {
    issues.push({ code: 'volume' });
    return { doses: {}, achievedMash: start, achievedSparge: start, achievedWort: start,
      issues };
  }
  const mashL = Number.isFinite(input.mashWaterL) && input.mashWaterL > 0 ? Math.min(total, input.mashWaterL) : total;
  const spargeL = total - mashL;
  const startSparge = input.startSparge ? clean(input.startSparge) : start;
  const allInMash = input.allSaltsInMash !== false;
  const target = mineralTarget(clean(input.target), input.ranges, input.mineralTargetMode ?? 'minimum');
  const maxima = Object.fromEntries(Object.keys(ZERO).map(ion =>
    [ion, Number.isFinite(input.ranges?.[ion]?.max) ? Math.max(0, input.ranges[ion].max) : Infinity])) as unknown as WaterIons;
  const off = new Set(input.disabled ?? []);
  const combined = (mash: WaterIons, sparge: WaterIons): WaterIons => Object.fromEntries(Object.keys(ZERO).map(ion =>
    [ion, (mash[ion] * mashL + sparge[ion] * spargeL) / total])) as unknown as WaterIons;
  const base = combined(start, startSparge);
  const waters = (doses: Partial<Record<SaltId, number>>) => waterFromPlan(start, doses, mashL, spargeL, startSparge, allInMash);
  const wort = (doses: Partial<Record<SaltId, number>>) => { const w = waters(doses); return combined(w.mash, w.sparge); };
  const band = input.targetRa;
  const saltTarget = band ? Math.min(band.min,
    Number.isFinite(input.raCeiling) && input.raCeiling != null ? input.raCeiling : Infinity) : -Infinity;
  const needsAlkaline = band && band.min >= 0;
  const alkaline = (flavour: Partial<Record<SaltId, number>>) => {
    const doses = { ...flavour };
    if (!needsAlkaline) return {};
    const candidates = ALKALINE_SALTS.filter(id => !off.has(id) && (id !== 'caco3' || off.has('chaux')));
    const used = new Set<SaltId>();
    for (let pass = 0; pass < candidates.length; pass++) {
      const gap = saltTarget - residualAlkalinity(waters(doses).mash);
      if (gap <= 5) break;
      const current = wort(doses);
      let best: SaltId | undefined, bestG = 0, bestRa = 0;
      for (const id of candidates.filter(id => !used.has(id))) {
        const perGram = netRaPerGramPerLitre(id);
        if (perGram <= 0) continue;
        let g = gap * mashL / perGram;
        for (const ion of TASTE_IONS) {
          const ppm = (saltIons(id)[ion] ?? 0) / total;
          if (ppm > 0) g = Math.min(g, Math.max(0, maxima[ion] - current[ion]) / ppm);
        }
        if (id === 'caco3') g = Math.min(g, CHALK_RA_CAP_PPM * mashL / perGram);
        const delivered = g * perGram / mashL;
        g = Math.floor((g + 1e-9) * 10) / 10;
        if (g < (id === 'chaux' ? 0.1 : 0.5)) continue;
        // Compare before rounding; otherwise a 0.1 g remainder changes the
        // chosen alkali at every EBC tick, switching calcium for sodium.
        if (delivered > bestRa + 1e-7) { best = id; bestG = g; bestRa = delivered; }
      }
      if (!best) break;
      doses[best] = bestG;
      used.add(best);
    }
    return Object.fromEntries(ALKALINE_SALTS.filter(id => doses[id]).map(id => [id, doses[id]]));
  };
  let alk: Partial<Record<SaltId, number>> = alkaline({});
  let doses: Partial<Record<SaltId, number>> = {};
  let stable = !needsAlkaline;
  const seen = new Set<string>();
  for (let pass = 0; pass < (needsAlkaline ? 12 : 1); pass++) {
    // Salt is a defining ingredient in a Gose: retain the sodium priority.
    const weights = (input.ranges?.na?.min ?? 0) >= 40 ? [1, 0.5, 8, 2, 2] : undefined;
    const flavour = solveMinerals(wort(alk), target, maxima, total, off, weights);
    // Recompute from scratch: corrections must not accumulate and need acid
    // merely to undo the previous iteration.
    const nextAlk = alkaline(flavour);
    doses = { ...flavour, ...nextAlk };
    const signature = JSON.stringify(nextAlk);
    if (signature === JSON.stringify(alk)) { stable = true; break; }
    if (seen.has(signature)) break;
    seen.add(signature);
    alk = nextAlk;
  }
  const water = waters(doses);
  const finalWort = combined(water.mash, water.sparge);
  const ra = residualAlkalinity(water.mash);
  let convergence: SolveResult['convergence'] = 'stable';
  if (!stable) {
    const finalAlk = Object.fromEntries(ALKALINE_SALTS.filter(id => doses[id]).map(id => [id, doses[id]]));
    const weights = (input.ranges?.na?.min ?? 0) >= 40 ? [1, 0.5, 8, 2, 2] : undefined;
    const refit = { ...solveMinerals(wort(finalAlk), target, maxima, total, off, weights), ...finalAlk };
    const check = wort(refit);
    // A cycle of neighbouring 0.1 g doses is a weighing compromise, not an
    // unresolved numerical failure. Keep that distinction available to tests.
    convergence = Math.abs(ra - saltTarget) <= 5 && TASTE_IONS.every(ion => Math.abs(check[ion] - finalWort[ion]) <= 2)
      ? 'rounded' : 'bounded';
  }
  if (band) {
    if (needsAlkaline && saltTarget < band.min - 5) issues.push({ code: 'grist', target: saltTarget, colour: band.min });
    if (needsAlkaline && ra < saltTarget - 10) issues.push({ code: 'alkalinity-low', value: saltTarget - ra,
      excluded: ALKALINE_SALTS.every(id => off.has(id)) });
    if (ra > band.max + 5) issues.push({ code: 'alkalinity-high', value: ra, min: band.min, max: band.max });
    if (convergence === 'bounded') issues.push({ code: 'iteration' });
  }
  for (const ion of TASTE_IONS) {
    if (finalWort[ion] > maxima[ion] + 2) issues.push({ code: 'high', ion, value: finalWort[ion], max: maxima[ion], source: base[ion] });
    const minimum = input.ranges?.[ion]?.min ?? 0;
    if (ion === 'ca' && finalWort.ca < minimum - 2) issues.push({ code: 'low', ion, value: finalWort.ca, target: minimum });
    if (ion !== 'ca' && target[ion] - finalWort[ion] > (ion === 'mg' ? 3 : 10))
      issues.push({ code: 'low', ion, value: finalWort[ion], target: target[ion] });
  }
  Object.keys(finalWort).forEach(ion => { finalWort[ion] = round1(finalWort[ion]); });
  return { doses, achievedMash: water.mash, achievedSparge: water.sparge, achievedWort: finalWort,
    issues, convergence };
}
