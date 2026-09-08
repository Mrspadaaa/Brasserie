import { describe, expect, it } from 'vitest';
import {
  ACIDS, DEFAULT_WATER_SOURCE, calculateWaterTreatment, dilute, solveSalts,
} from '../../src/domain/water';
import { styleByCode, styleFromTargetIons } from '../../src/domain/waterStyles';
import { waterProfileTarget, waterTreatmentTarget } from '../../src/domain/water/profileTarget';
import { assessWaterProfile } from '../../src/domain/water/profileAssessment';

const style = styleByCode('20C');
const band = { min: -60, max: 0 };
const volume = { mashWaterL: 10.8, spargeWaterL: 21.5 };

describe('Interior style preferences without replacing the six profile bounds', () => {
  it('moves the photo toward the lower middle after BOTH retained acids, without optional Mg or K', () => {
    const start = dilute(DEFAULT_WATER_SOURCE, 20);
    const solution = solveSalts({ ...waterProfileTarget(style, start, undefined, 0.7),
      start, ratio: 0.7, totalWaterL: 32.3, mashWaterL: 10.8,
      spargeHco3AfterAcid: 200 - 6.2 * 600 / 21.5,
    });
    const treatment = calculateWaterTreatment(DEFAULT_WATER_SOURCE, {
      ...volume, diRatioPct: 20, doses: solution.doses, acidId: 'lactique',
      acidOverride: { mash: 0, sparge: 6.2 }, ...waterTreatmentTarget(style),
    }, band);
    expect(assessWaterProfile(treatment.treatedTotal, style.ions).reached).toBe(true);
    // Acceptance region around the proposed lower-middle point, not merely >=120.
    expect(treatment.treatedTotal.hco3).toBeGreaterThanOrEqual(153);
    expect(treatment.treatedTotal.hco3).toBeLessThanOrEqual(174);
    expect(treatment.treatedTotal.na).toBeGreaterThan(20);
    expect(treatment.treatedTotal.mg).toBe(11.2);
    expect(solution.doses.epsom ?? 0).toBe(0);
    expect(solution.doses.kcl ?? 0).toBe(0);
    expect(treatment.mashAcid.amount).toBe(0);
    expect(treatment.spargeAcid.amount).toBe(6.2);
  });

  it('does not discard a useful interior correction solely to use one fewer salt', () => {
    const source = { ...DEFAULT_WATER_SOURCE, ca: 85, mg: 0, na: 33, so4: 63, cl: 90, hco3: 120 };
    const solution = solveSalts({ ...waterProfileTarget(style, source, undefined, 0.7),
      start: source, ratio: 0.7, totalWaterL: 30, mashWaterL: 30 });
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 30, spargeWaterL: 0, doses: solution.doses,
      acidId: 'lactique', ...waterTreatmentTarget(style),
    }, band);
    expect(result.treatedTotal.hco3).toBeGreaterThanOrEqual(153);
    expect(result.treatedTotal.hco3).toBeLessThanOrEqual(174);
    expect(assessWaterProfile(result.treatedTotal, style.ions).reached).toBe(true);
  });

  it('accepts an in-range boundary result when the interior point cannot be supplied', () => {
    const source = { ...DEFAULT_WATER_SOURCE, ca: 85, mg: 0, na: 33, so4: 63, cl: 90, hco3: 125 };
    const solution = solveSalts({ ...waterProfileTarget(style, source, undefined, 0.7),
      start: source, ratio: 0.7, totalWaterL: 30, mashWaterL: 30,
      disabled: ['nahco3', 'chaux', 'caco3'] });
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 30, spargeWaterL: 0, doses: solution.doses,
      acidId: 'lactique', ...waterTreatmentTarget(style),
    }, band);
    expect(result.treatedTotal.hco3).toBe(125);
    expect(result.mashAcid.amount).toBe(0);
    expect(result.hco3Target).toBeUndefined();
    expect(assessWaterProfile(result.treatedTotal, style.ions).reached).toBe(true);
  });

  it('does not turn optional Mg, Na or alkalinity into compulsory additions on a pale profile', () => {
    const pale = styleByCode('05D');
    const source = { ...DEFAULT_WATER_SOURCE, ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };
    const solution = solveSalts({ ...waterProfileTarget(pale, source, undefined, 2),
      start: source, ratio: 2, totalWaterL: 30, mashWaterL: 20 });
    expect(assessWaterProfile(solution.achievedWort, pale.ions).reached).toBe(true);
    expect(solution.achievedWort).toMatchObject({ mg: 0, na: 0, hco3: 0 });
  });

  it('leaves explicit and partial personal targets intact', () => {
    const source = dilute(DEFAULT_WATER_SOURCE, 20);
    const custom = { hco3: 147, na: 16, so4: 65, cl: 100 };
    const profile = waterProfileTarget(styleFromTargetIons(custom), source, custom, 0.65, false);
    expect(profile.target).toMatchObject(custom);
    expect(profile.targetedIons).not.toContain('mg');
    expect(profile.mineralTargetMode).toBe('target');
    expect(waterTreatmentTarget(styleFromTargetIons(custom), custom)).toEqual({
      hco3Target: 147, hco3Range: { min: 145, max: 149 },
    });
  });
});

describe('Automatic acid uses the same interior preference as salt dosing', () => {
  it.each(['lactique', 'phosphorique', 'maltAcidule'] as const)(
    '%s: aims inside the range with two different dilutions and a retained sparge dose', acidId => {
      const source = { ...DEFAULT_WATER_SOURCE, hco3: 500 };
      const spargeDose = acidId === 'maltAcidule' ? 0 : 0.8;
      const result = calculateWaterTreatment(source, {
        ...volume, diRatioPct: 20, spargeDiRatioPct: 80, doses: {}, acidId,
        acidOverride: { sparge: spargeDose }, ...waterTreatmentTarget(style),
      }, band);
      // Independent mass balance, including the two actual source fractions.
      const strength = { lactique: 600, phosphorique: 750, maltAcidule: 20 }[acidId];
      const mashMass = Math.max(0, 400 * 10.8 - result.mashAcid.amount * strength);
      const spargeMass = Math.max(0, 100 * 21.5 - spargeDose * strength);
      const expected = (mashMass + spargeMass) / 32.3;
      expect(result.treatedTotal.hco3).toBeCloseTo(expected, 1);
      // At most half an acid step plus display rounding away from 163 1/3.
      expect(Math.abs(expected - 163 - 1 / 3)).toBeLessThanOrEqual(strength * 0.05 / 32.3 + 0.05);
      expect(result.mashAcid.amount).toBeGreaterThan(0);
      expect(result.spargeAcid.amount).toBe(spargeDose);
    },
  );

  it('keeps a manual zero even when automatic acid would reach the preferred point', () => {
    const source = { ...DEFAULT_WATER_SOURCE, hco3: 240 };
    const input = { diRatioPct: 0, mashWaterL: 30, spargeWaterL: 0, doses: {},
      acidId: 'lactique' as const, ...waterTreatmentTarget(style) };
    const automatic = calculateWaterTreatment(source, input, band);
    const manual = calculateWaterTreatment(source, { ...input, acidOverride: { mash: 0 } }, band);
    expect(automatic.treatedTotal.hco3).toBeCloseTo(164, 1);
    expect(manual.treatedTotal.hco3).toBe(240);
    expect(manual.mashAcid.amount).toBe(0);
    expect(manual.mashAcidCalculated.amount).toBe(automatic.mashAcid.amount);
    expect(manual.hco3Target).toBeUndefined();
  });

  it('prioritizes the true profile bounds over a preferred point that cannot be weighed exactly', () => {
    const source = { ...DEFAULT_WATER_SOURCE, hco3: 200 };
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 10, spargeWaterL: 0, doses: {}, acidId: 'lactique',
      hco3Range: { min: 120, max: 130 }, hco3Preferred: 121,
    }, band);
    // 1.3 mL -> 122 ppm; 1.4 mL -> 116 ppm would violate the hard minimum.
    expect(result.mashAcid.amount).toBe(1.3);
    expect(result.treatedTotal.hco3).toBe(200 - 1.3 * ACIDS.lactique.hco3NeutralizedPerUnit / 10);
  });
});
