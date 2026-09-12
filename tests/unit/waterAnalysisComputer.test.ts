import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computeWaterAnalysis, createWaterAnalysisComputer } from '../../src/ui/water/computeWaterAnalysis';
import type { WaterAnalysisInput } from '../../src/ui/water/waterAnalysisProtocol';

const { solveSalts, minimalDilution } = vi.hoisted(() => ({ solveSalts: vi.fn(), minimalDilution: vi.fn() }));
vi.mock('../../src/domain/water/solve', () => ({ solveSalts }));
vi.mock('../../src/domain/water/dilution', () => ({ minimalDilution }));

// Only identities matter to this transport test; domain arithmetic is tested
// separately and these spies prove the unchanged inputs reach its public API.
const input = (solve: number, dilution = 1) => ({
  solve: { ratio: solve }, dilution: { acidOverride: { sparge: dilution } }
}) as WaterAnalysisInput;

beforeEach(() => {
  solveSalts.mockReset().mockImplementation(value => ({ doses: { gypsum: value.ratio } }));
  minimalDilution.mockReset().mockImplementation(value => ({ pct: value.acidOverride.sparge }));
});

describe('Independent, bounded water advice calculations', () => {
  it('passes the exact inputs to the existing domain functions in the synchronous fallback', () => {
    const snapshot = input(1);
    expect(computeWaterAnalysis(snapshot)).toEqual({ solution: { doses: { gypsum: 1 } }, justEnough: { pct: 1 } });
    expect(solveSalts.mock.calls[0][0]).toBe(snapshot.solve);
    expect(minimalDilution.mock.calls[0][0]).toBe(snapshot.dilution);
  });

  it('does not repeat the RO search when only the current salt-plan input changes', () => {
    const compute = createWaterAnalysisComputer();
    const first = compute(input(1));
    const second = compute(input(2));
    expect(second.justEnough).toBe(first.justEnough);
    expect(second.solution).toEqual({ doses: { gypsum: 2 } });
    expect(solveSalts).toHaveBeenCalledTimes(2);
    expect(minimalDilution).toHaveBeenCalledOnce();
  });

  it('reuses the salt plan independently and recomputes the RO search for a new manual acid dose', () => {
    const compute = createWaterAnalysisComputer();
    const first = compute(input(1, 1));
    const second = compute(input(1, 2));
    expect(second.solution).toBe(first.solution);
    expect(second.justEnough).toEqual({ pct: 2 });
    expect(solveSalts).toHaveBeenCalledOnce();
    expect(minimalDilution).toHaveBeenCalledTimes(2);
  });

  it('keeps only the last input per calculation and shares no cache across workers', () => {
    const compute = createWaterAnalysisComputer();
    compute(input(1, 1));
    compute(input(2, 2));
    compute(input(1, 1));
    expect(solveSalts).toHaveBeenCalledTimes(3);
    expect(minimalDilution).toHaveBeenCalledTimes(3);
    createWaterAnalysisComputer()(input(1, 1));
    expect(solveSalts).toHaveBeenCalledTimes(4);
    expect(minimalDilution).toHaveBeenCalledTimes(4);
  });

  it('does not cache a failed domain calculation as a successful result', () => {
    const compute = createWaterAnalysisComputer();
    minimalDilution.mockImplementationOnce(() => { throw new Error('Invalid dilution input'); });
    expect(() => compute(input(1))).toThrow('Invalid dilution input');
    expect(compute(input(1))).toEqual({ solution: { doses: { gypsum: 1 } }, justEnough: { pct: 1 } });
    expect(minimalDilution).toHaveBeenCalledTimes(2);
  });
});
