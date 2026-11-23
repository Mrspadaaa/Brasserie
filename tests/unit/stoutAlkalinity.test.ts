import { describe, expect, it } from 'vitest';
import {
  alkalineSaltGoal, calculateWaterTreatment, dilute, estimateMashPh,
  raSaltCeilingForGrist, residualAlkalinity, rebalanceRatio, solveSalts, targetRaForGrist
} from '../../src/domain/water';
import { midpoint, styleByCode } from '../../src/domain/waterStyles';
import { monSuperStoutRo } from '../fixtures/monSuperStout';

const grist = monSuperStoutRo.fermentables;
const plan = monSuperStoutRo.waterPlan!;
const style = styleByCode('20C');
const ratio = 34.6 / 9.1;
const band = targetRaForGrist(98.8, grist, ratio);
const ceiling = raSaltCeilingForGrist(grist, ratio);

describe('Reported stout — mass balance versus an indicative style band', () => {
  it('distinguishes 81.9 ppm in the mash from 62.1 ppm over both waters', () => {
    const t = calculateWaterTreatment(plan.sourceSnapshot!, { ...plan, doses: plan.mash, acidId: 'lactique' }, band);
    // Independent mass balances, in mg/L. No bicarbonate is added to the sparge.
    expect(t.treated.mash.hco3).toBeCloseTo(3.9 * 726.3 / 34.6, 1);
    expect(t.treatedTotal.hco3).toBeCloseTo(3.9 * 726.3 / 45.6, 1);
    expect(t.treated.mash.na).toBeCloseTo(3.9 * 273.7 / 34.6, 1);
    expect(t.treatedTotal.na).toBeCloseTo(3.9 * 273.7 / 45.6, 1);
    expect(Object.values(t.treated.sparge)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(t.mashAcid.amount).toBe(0);
    expect(t.spargeAcid.amount).toBe(0);
    expect(t.treated.mash.mg).toBe(0);
    expect(style.ions.mg.min).toBe(0);
    expect(t.raAfter).toBeCloseTo(-19.5, 0);
    const ph = estimateMashPh(grist, t.raAfter, ratio);
    expect(ph.phPredicted).toBe(5.5);
    expect(ph.uncertainty).toBeGreaterThanOrEqual(0.15);
    expect(alkalineSaltGoal(band, ceiling)).toEqual({ target: -18, limitedByGrist: true });
    expect(band).toMatchObject({ min: 110, max: 166 });
  });

  it('reproduces the reported Doser plan without forcing the style HCO3 minimum', () => {
    const result = solveSalts({
      start: plan.startIons!, target: rebalanceRatio(midpoint(style), 0.4), ranges: style.ions,
      totalWaterL: 45.6, mashWaterL: 34.6, allSaltsInMash: true,
      targetRa: band, raCeiling: ceiling, ratio: 0.4
    });
    expect(result.doses).toEqual(plan.mash);
    expect(result.achievedWort.hco3).toBeLessThan(style.ions.hco3.min);
    expect(result.issues).toContainEqual({ code: 'grist', target: -18, colour: 110 });
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: 'alkalinity-low' }));
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: 'low', ion: 'mg' }));
  });
});

const cases = [0, 20, 50, 80, 100].flatMap((ro) =>
  [0.4, 0.65, 0.9].flatMap((balance) =>
    [27.3, 34.6, 45.5].flatMap((mashL) =>
      [true, false].map((allInMash) => ({ ro, balance, mashL, allInMash }))
    )
  )
);

describe('Stout — dilution, balance, mash volume and salt distribution', () => {
  it.each(cases)('RO $ro%, SO4:Cl $balance, mash $mashL L, all salts in mash $allInMash', ({ ro, balance, mashL, allInMash }) => {
    const start = dilute(plan.sourceSnapshot!, ro);
    const mashRatio = mashL / 9.1;
    const b = targetRaForGrist(98.8, grist, mashRatio);
    const c = raSaltCeilingForGrist(grist, mashRatio);
    const goal = alkalineSaltGoal(b, c);
    const result = solveSalts({
      start, target: rebalanceRatio(midpoint(style), balance), ranges: style.ions,
      totalWaterL: 45.6, mashWaterL: mashL, allSaltsInMash: allInMash,
      targetRa: b, raCeiling: c, ratio: balance
    });
    const actual = calculateWaterTreatment(plan.sourceSnapshot!, {
      diRatioPct: ro, doses: result.doses, acidId: 'lactique',
      mashWaterL: mashL, spargeWaterL: 45.6 - mashL, allSaltsInMash: allInMash
    }, b);
    expect(actual.raw.mash).toEqual(result.achievedMash);
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl'] as const) {
      expect(actual.treatedTotal[ion]).toBeLessThanOrEqual(Math.max(start[ion], style.ions[ion].max) + 0.2);
      if (actual.treatedTotal[ion] < style.ions[ion].min - 2)
        expect(result.issues).toContainEqual(expect.objectContaining({ code: 'low', ion }));
    }
    for (const dose of Object.values(result.doses)) {
      expect(Number.isFinite(dose)).toBe(true);
      expect(dose).toBeGreaterThanOrEqual(0);
    }
    // A real shortfall against the alkali objective must be reported; being
    // below the colour/style reference alone must not invent that warning.
    const ra = residualAlkalinity(result.achievedMash);
    expect(result.issues!.some((issue) => issue.code === 'alkalinity-low')).toBe(ra < goal.target - 10);
    if (ro === 100) {
      expect((result.doses.nahco3 ?? 0) + (result.doses.chaux ?? 0)).toBeGreaterThan(0);
      expect(actual.mashAcid.amount).toBe(0);
      expect(actual.spargeAcid.amount).toBe(0);
    }
    expect(goal.target).toBeLessThanOrEqual(b.min);
  });
});
