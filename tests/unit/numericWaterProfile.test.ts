import { describe, expect, it } from 'vitest';
import { solveSalts, waterFromPlan, residualAlkalinity, saltIons, minimalDilution } from '../../src/domain/water';
import type { IonBand, WaterIons } from '../../src/types';
import { waterProfileTarget } from '../../src/domain/water/profileTarget';
import { styleFromTargetIons } from '../../src/domain/waterStyles';

const zero: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };
const rangesFor = (target: WaterIons) => Object.fromEntries(
  Object.entries(target).map(([ion, value]) => [ion, { min: 0, max: value + 10 }])
) as Record<keyof WaterIons, IonBand>;

describe('Numeric water profiles include bicarbonate', () => {
  it('recovers an independently constructed gypsum/bicarbonate water without a colour RA target', () => {
    // 3 g NaHCO3 and 4 g gypsum in 30 L. These are mass balances, not
    // another call to the solver or the production ion accumulation helper.
    const target = { ...zero, ca: 4 * 232.8 / 30, so4: 4 * 557.7 / 30, na: 3 * 273.7 / 30, hco3: 3 * 726.3 / 30 };
    const result = solveSalts({ start: zero, target, ranges: rangesFor(target), totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target' });
    expect(result.doses.nahco3).toBeGreaterThan(0);
    for (const ion of Object.keys(zero) as Array<keyof WaterIons>) {
      expect(Math.abs(result.achievedWort[ion] - target[ion]), ion).toBeLessThan(3);
    }
    expect(result.achievedSparge.hco3).toBe(0);
  });

  it('uses lime for an explicit alkalinity target when sodium is unavailable', () => {
    const target = { ...zero, ca: 540.9 / 30, hco3: 1647 / 30 };
    const ranges = rangesFor(target);
    ranges.na.max = 0;
    const result = solveSalts({ start: zero, target, ranges, totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target' });
    expect(result.doses.chaux).toBe(1);
    expect(result.doses.caco3).toBeUndefined();
    expect(result.achievedWort.hco3).toBeCloseTo(target.hco3, 0);
    expect(result.achievedWort.na).toBe(0);
  });

  it('compensates the retained sparge acid before fitting total-water HCO3', () => {
    const sourceSparge = { ...zero, hco3: 90 };
    const target = { ...zero, ca: 60, na: 35, so4: 70, cl: 90, hco3: 70 };
    const result = solveSalts({ start: zero, startSparge: sourceSparge, target, ranges: rangesFor(target), totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target', spargeHco3AfterAcid: 0 });
    const afterSparge = result.achievedMash.hco3 * 20 / 30;
    expect(Math.abs(afterSparge - target.hco3)).toBeLessThan(3);
    expect(result.achievedWort.hco3).toBeGreaterThan(target.hco3 + 25);
    const manualZeroAcid = solveSalts({ start: zero, startSparge: sourceSparge, target, ranges: rangesFor(target), totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target', spargeHco3AfterAcid: 90 });
    expect(Math.abs(manualZeroAcid.achievedWort.hco3 - target.hco3)).toBeLessThan(3);
  });

  it('reports a numeric HCO3 target blocked by the grist rather than buying excess alkali', () => {
    const target = { ...zero, ca: 30, na: 20, cl: 40, hco3: 150 };
    const result = solveSalts({ start: zero, target, ranges: rangesFor(target), totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target', targetRa: { min: 0, max: 20 }, raCeiling: 0 });
    expect(residualAlkalinity(result.achievedMash)).toBeLessThanOrEqual(0.2);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'bicarbonate-target', limitedByAlkalinity: true }));
    expect(result.achievedMash).toEqual(waterFromPlan(zero, result.doses, 20, 10).mash);
  });

  it('keeps excluded salts absent and makes an impossible HCO3 target explicit', () => {
    const target = { ...zero, ca: 50, cl: 70, hco3: 80 };
    const result = solveSalts({ start: zero, target, ranges: rangesFor(target), totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target', disabled: ['nahco3', 'chaux', 'caco3'] });
    expect(result.achievedWort.hco3).toBe(0);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'bicarbonate-target', target: 80 }));
    expect(Object.values(result.doses).every(g => Number.isFinite(g) && g > 0)).toBe(true);
  });

  it('keeps a chloride-free custom profile intact until the ratio is explicitly edited', () => {
    const custom = { so4: 80, cl: 0 };
    const style = styleFromTargetIons(custom);
    const preserved = waterProfileTarget(style, zero, custom, Infinity, false);
    expect(preserved.target.so4).toBe(80);
    expect(preserved.target.cl).toBe(0);
    expect(preserved.fitBicarbonate).toBe(false);
    expect(preserved.targetedIons).toEqual(['so4', 'cl']);
    const edited = waterProfileTarget(style, zero, custom, 0, true);
    expect(edited.target.so4).toBe(0);
    expect(edited.target.cl).toBe(80);
  });

  it('does not penalize calcium or invent a bicarbonate objective in a chloride-only profile', () => {
    const custom = { cl: 120 };
    const start = { ...zero, hco3: 60 };
    const profile = waterProfileTarget(styleFromTargetIons(custom), start, custom, 1, false);
    const result = solveSalts({ ...profile, start, totalWaterL: 30, mashWaterL: 20, disabled: ['mgcl2', 'nacl', 'kcl'] });
    expect(Math.abs(result.achievedWort.cl - 120)).toBeLessThan(2);
    expect(result.doses.cacl2).toBeGreaterThan(7);
    expect(result.doses.nahco3).toBeUndefined();
    expect(result.doses.chaux).toBeUndefined();
  });

  it('does not prescribe salts in an absent mash by silently moving all water there', () => {
    const target = { ...zero, ca: 60, cl: 120, hco3: 100 };
    const sparge = { ...zero, cl: 20 };
    const result = solveSalts({ start: zero, startSparge: sparge, target, ranges: rangesFor(target), totalWaterL: 10, mashWaterL: 0, mineralTargetMode: 'target' });
    expect(result.doses).toEqual({});
    expect(result.achievedMash).toEqual(zero);
    expect(result.achievedWort).toEqual(sparge);
    expect(result.issues).toEqual([{ code: 'volume' }]);
  });

  it('recovers 24 feasible six-ion profiles while respecting a simultaneous mash RA ceiling', () => {
    for (let seed = 1; seed <= 24; seed++) {
      const gypsum = 0.5 + seed / 10;
      const calciumChloride = 1 + seed % 5;
      const epsom = 0.5 + seed % 3;
      const bicarbonate = 0.5 + seed % 4;
      const target = {
        ca: (gypsum * 232.8 + calciumChloride * 272.6) / 30,
        mg: epsom * 98.6 / 30,
        na: bicarbonate * 273.7 / 30,
        so4: (gypsum * 557.7 + epsom * 389.6) / 30,
        cl: calciumChloride * 482.3 / 30,
        hco3: bicarbonate * 726.3 / 30
      };
      const ceiling = (target.hco3 * 50 / 61 - target.ca / 1.4 - target.mg / 1.7) * 30 / 20 + 2;
      const result = solveSalts({ start: zero, target, ranges: rangesFor(target), totalWaterL: 30, mashWaterL: 20, mineralTargetMode: 'target', raCeiling: ceiling });
      expect(residualAlkalinity(result.achievedMash), `RA case ${seed}`).toBeLessThanOrEqual(ceiling + 0.2);
      for (const ion of Object.keys(zero) as Array<keyof WaterIons>) {
        expect(Math.abs(result.achievedWort[ion] - target[ion]), `${seed}/${ion}`).toBeLessThan(3);
      }
    }
  });
});

describe('Salt table agrees with independent stoichiometry', () => {
  it('uses the declared hydrates, with alkalinity equivalents for hydroxide/carbonate', () => {
    const atomic = { ca: 40.078, mg: 24.305, na: 22.990, cl: 35.45, h: 1.008, o: 15.999, s: 32.06, c: 12.011 };
    const water = 2 * atomic.h + atomic.o;
    const sulfate = atomic.s + 4 * atomic.o;
    const bicarbonate = atomic.h + atomic.c + 3 * atomic.o;
    expect(saltIons('gypse').ca).toBeCloseTo(1000 * atomic.ca / (atomic.ca + sulfate + 2 * water), 0);
    expect(saltIons('cacl2').cl).toBeCloseTo(1000 * 2 * atomic.cl / (atomic.ca + 2 * atomic.cl + 2 * water), 0);
    expect(saltIons('epsom').mg).toBeCloseTo(1000 * atomic.mg / (atomic.mg + sulfate + 7 * water), 0);
    expect(saltIons('mgcl2').mg).toBeCloseTo(1000 * atomic.mg / (atomic.mg + 2 * atomic.cl + 6 * water), 0);
    expect(saltIons('nahco3').hco3).toBeCloseTo(1000 * bicarbonate / (atomic.na + bicarbonate), 0);
    expect(saltIons('chaux').hco3).toBeCloseTo(1000 * 2 * bicarbonate / (atomic.ca + 2 * (atomic.o + atomic.h)), 0);
  });
});

describe('Dilution follows retained acid doses', () => {
  const input = {
    source: { ...zero, hco3: 90 }, target: { ...zero, hco3: 90 },
    ranges: Object.fromEntries(Object.keys(zero).map(ion => [ion, { min: 0, max: 300 }])) as Record<keyof WaterIons, IonBand>,
    totalWaterL: 30, mashWaterL: 20, spargeWaterL: 10,
    targetRa: { min: -60, max: 0 }, acid: 'lactique' as const, beerVolumeL: 20
  };
  it('does not reintroduce calculated acid when both manual doses are zero', () => {
    const result = minimalDilution({ ...input, acidOverride: { mash: 0, sparge: 0 } });
    expect(result.feasible).toBe(true);
    expect(result.pct).toBe(0);
    expect(result.acid.mash).toBe(0);
    expect(result.acid.sparge).toBe(0);
  });
  it('does not claim pure RO can reduce an imposed acid dose', () => {
    const result = minimalDilution({ ...input, acidOverride: { mash: 12, sparge: 3 } });
    expect(result.feasible).toBe(false);
    expect(result.acid.mash).toBe(12);
    expect(result.acid.sparge).toBe(3);
    expect(result.reasons.join(' ')).toMatch(/dilution seule ne suffit pas/);
  });
});
