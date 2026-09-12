import type { SolveInput, SolveResult } from '../../domain/water/solver';
import type { MinimalDilution, MinimalDilutionInput } from '../../domain/water/dilution';

export interface WaterAnalysisInput {
  solve: SolveInput;
  dilution: MinimalDilutionInput;
}

export interface WaterAnalysisResult {
  solution: SolveResult;
  justEnough: MinimalDilution;
}

export interface WaterAnalysisRequest {
  id: number;
  key: string;
  input: WaterAnalysisInput;
}

export type WaterAnalysisResponse =
  | { kind: 'result'; id: number; key: string; result: WaterAnalysisResult }
  | { kind: 'error'; id: number; key: string; error: { name: string; message: string; stack?: string } };

/** Content equality, including infinite numeric bounds, rather than the identity
 * of React objects. Optional properties set to undefined equal omitted ones. */
export function waterAnalysisKey(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (typeof value === 'number') return `number:${String(value)}`;
  if (Array.isArray(value)) return `[${value.map(waterAnalysisKey).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter(key => value[key] !== undefined)
      .map(key => `${JSON.stringify(key)}:${waterAnalysisKey(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Copy the small numeric input without JSON's conversion of Infinity to null. */
export function waterAnalysisSnapshot<T>(value: T): T {
  if (Array.isArray(value)) return value.map(waterAnalysisSnapshot) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, waterAnalysisSnapshot(item)])) as T;
  }
  return value;
}
