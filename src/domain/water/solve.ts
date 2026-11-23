import { solveSaltsCore } from './solver';
import type { SolveInput, SolveResult } from './solver';
import { describeSolveIssue } from './solverMessages';

/** Public compatibility boundary; the engine returns data, screens still
 * receive the historical French messages as well as structured issues. */
export function solveSalts(input: SolveInput): SolveResult {
  const result = solveSaltsCore(input);
  return { ...result, unreachable: result.issues.map(describeSolveIssue) };
}
