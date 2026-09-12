import { solveSalts } from '../../domain/water/solve';
import { minimalDilution } from '../../domain/water/dilution';
import { waterAnalysisKey } from './waterAnalysisProtocol';
import type { WaterAnalysisInput, WaterAnalysisResult } from './waterAnalysisProtocol';

/** Shared by the worker and its compatibility fallback: no alternate maths. */
export function computeWaterAnalysis(input: WaterAnalysisInput): WaterAnalysisResult {
  return {
    solution: solveSalts(input.solve),
    justEnough: minimalDilution(input.dilution)
  };
}

/** One cache entry per independent calculation, owned by a single worker. Moving
 * the selected dilution changes the salt plan, not the search for minimum RO. */
export function createWaterAnalysisComputer(): (input: WaterAnalysisInput) => WaterAnalysisResult {
  let solve: { key: string; result: WaterAnalysisResult['solution'] } | undefined;
  let dilution: { key: string; result: WaterAnalysisResult['justEnough'] } | undefined;
  return input => {
    const solveKey = waterAnalysisKey(input.solve);
    const dilutionKey = waterAnalysisKey(input.dilution);
    if (solve?.key !== solveKey) solve = { key: solveKey, result: solveSalts(input.solve) };
    if (dilution?.key !== dilutionKey) dilution = { key: dilutionKey, result: minimalDilution(input.dilution) };
    return { solution: solve.result, justEnough: dilution.result };
  };
}
