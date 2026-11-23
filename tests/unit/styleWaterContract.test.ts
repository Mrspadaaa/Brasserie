import { describe, expect, it } from 'vitest';
import { STYLE_WATERS } from '../../src/domain/waterStyles';
import { solveSalts, calculateWaterTreatment } from '../../src/domain/water';
import { waterProfileTarget, waterTreatmentTarget } from '../../src/domain/water/profileTarget';
import { assessWaterProfile } from '../../src/domain/water/profileAssessment';
import { leastSquaresWithBounds } from '../../src/domain/water/lsq';

const source = { id: 'ro', name: 'RO', ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0, ph: 7 };
const band = { min: -60, max: 0 };

describe('All six profile bounds are the product contract', () => {
  it.each(STYLE_WATERS)('$code: reaches each supplied range on mineral-free water after automatic acid', style => {
    const target = waterProfileTarget(style, source, undefined, (style.ratio.min + style.ratio.max) / 2);
    const solved = solveSalts({ ...target, start: source, totalWaterL: 30, mashWaterL: 20,
      targetRa: band, raCeiling: -60, spargeHco3AfterAcid: 0 });
    const treated = calculateWaterTreatment(source, { diRatioPct: 0, mashWaterL: 20, spargeWaterL: 10,
      doses: solved.doses, acidId: 'lactique', ...waterTreatmentTarget(style) }, band);
    const assessment = assessWaterProfile(treated.treatedTotal, style.ions);
    expect(assessment.deviations, style.code).toEqual([]);
  });

  it('does not widen sulfate/chloride ranges to satisfy an incompatible slider request', () => {
    const style = STYLE_WATERS.find(style => style.code === '20C')!;
    const profile = waterProfileTarget(style, source, undefined, 9);
    expect(profile.ranges).toEqual(style.ions);
    const result = solveSalts({ ...profile, start: source, totalWaterL: 30, mashWaterL: 20 });
    expect(result.achievedWort.so4).toBeLessThanOrEqual(80);
    expect(result.achievedWort.cl).toBeGreaterThanOrEqual(80);
  });

  it('never reports the photo as reached just because its five other ions are in range', () => {
    const style = STYLE_WATERS.find(style => style.code === '20C')!;
    const result = assessWaterProfile({ ca: 105, mg: 11.2, na: 13, so4: 67, cl: 103, hco3: 84.8 }, style.ions);
    expect(result).toMatchObject({ reached: false, count: 6, inRange: 5,
      deviations: [{ ion: 'hco3', value: 84.8, min: 120, max: 250 }] });
  });

  it('does not add alkali to cancel a manual acid dose when zero bicarbonate is inside the profile', () => {
    const style = STYLE_WATERS.find(style => style.code === '21C')!;
    const target = waterProfileTarget(style, source, undefined, 0.5);
    const solve = (mashAcidHco3Mg: number) => solveSalts({ ...target, start: source,
      totalWaterL: 30, mashWaterL: 20, spargeHco3AfterAcid: 0, mashAcidHco3Mg });
    const normal = solve(0);
    const excess = solve(60_000);
    expect(excess.doses).toEqual(normal.doses);
    const treated = calculateWaterTreatment(source, { diRatioPct: 0, mashWaterL: 20, spargeWaterL: 10,
      doses: excess.doses, acidId: 'lactique', acidOverride: { mash: 100 }, ...waterTreatmentTarget(style) }, band);
    expect(treated.mashAcid.amount).toBe(100);
    expect(assessWaterProfile(treated.treatedTotal, style.ions).reached).toBe(true);
  });
});

describe('Joint lower and upper concentration constraints', () => {
  it('finds a feasible boundary point even when the unconstrained optimum violates a minimum', () => {
    const result = leastSquaresWithBounds([[1, 0], [0, 1]], [0, 0], [[-1, 0], [0, -1], [1, 1]], [-2, -3, 5]);
    expect(result.converged).toBe(true);
    expect(result.x[0]).toBeCloseTo(2, 5);
    expect(result.x[1]).toBeCloseTo(3, 5);
  });
  it('reports incompatible bounds rather than returning a false feasible solution', () => {
    expect(leastSquaresWithBounds([[1]], [2], [[-1], [1]], [-3, 2]).converged).toBe(false);
  });
});
