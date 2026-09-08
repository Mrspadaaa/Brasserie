import { describe, expect, it } from 'vitest';
import {
  ACIDS, DEFAULT_WATER_SOURCE, calculateWaterTreatment, dilute, solveSalts,
  estimateMashPh, raForGrist, raSaltCeilingForGrist, targetRaForGrist,
} from '../../src/domain/water';
import { styleByCode, styleFromTargetIons } from '../../src/domain/waterStyles';
import { waterProfileTarget, waterTreatmentTarget } from '../../src/domain/water/profileTarget';
import { assessWaterProfile } from '../../src/domain/water/profileAssessment';

const style = styleByCode('20C');
const band = { min: -60, max: 0 };
const volume = { mashWaterL: 10.8, spargeWaterL: 21.5 };
const paleGrist = [{ kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }];
const paleMash = { ceiling: raSaltCeilingForGrist(paleGrist, 10.8 / 2.2), target: raForGrist(paleGrist, 10.8 / 2.2) };

describe('Interior style preferences without replacing the six profile bounds', () => {
  it('keeps the pale photo near the compulsory floor instead of worsening its pH to centre HCO3', () => {
    const start = dilute(DEFAULT_WATER_SOURCE, 20);
    const solution = solveSalts({ ...waterProfileTarget(style, start, undefined, 0.7),
      start, ratio: 0.7, totalWaterL: 32.3, mashWaterL: 10.8,
      raCeiling: paleMash.ceiling, raPreference: paleMash.target,
      spargeHco3AfterAcid: 200 - 6.2 * 600 / 21.5,
    });
    const treatment = calculateWaterTreatment(DEFAULT_WATER_SOURCE, {
      ...volume, diRatioPct: 20, doses: solution.doses, acidId: 'lactique',
      acidOverride: { mash: 0, sparge: 6.2 }, ...waterTreatmentTarget(style, undefined, paleMash),
    }, band);
    expect(assessWaterProfile(treatment.treatedTotal, style.ions).reached).toBe(true);
    expect(treatment.treatedTotal.hco3).toBeGreaterThanOrEqual(120);
    expect(treatment.treatedTotal.hco3).toBeLessThanOrEqual(125);
    expect(treatment.bicarbonatePreference?.reason).toBe('profile-conflict');
    expect(treatment.treatedTotal.na).toBeGreaterThanOrEqual(10);
    expect(treatment.treatedTotal.na).toBeLessThanOrEqual(25);
    expect(treatment.treatedTotal.mg).toBe(11.2);
    expect(solution.doses.epsom ?? 0).toBe(0);
    expect(solution.doses.kcl ?? 0).toBe(0);
    expect(treatment.mashAcid.amount).toBe(0);
    expect(treatment.spargeAcid.amount).toBe(6.2);
    const unnecessaryAlkali = calculateWaterTreatment(DEFAULT_WATER_SOURCE, {
      ...volume, diRatioPct: 20, doses: { ...solution.doses, nahco3: 3.5 }, acidId: 'lactique',
      acidOverride: { mash: 0, sparge: 6.2 },
    }, band);
    const ph = (ra: number) => estimateMashPh(paleGrist, ra, 10.8 / 2.2).phPredicted;
    expect(ph(treatment.mashPhRa)).toBeLessThan(ph(unnecessaryAlkali.mashPhRa) - 0.2);
  });

  it('adds useful alkalinity for an acidic grist, even when that calls for more than the lower middle', () => {
    const source = { ...DEFAULT_WATER_SOURCE, ca: 85, mg: 0, na: 33, so4: 63, cl: 90, hco3: 120 };
    const grist = [{ kind: 'grain', use: 'empatage', weightKg: 3.5, colorEbc: 5 },
      { kind: 'grain', use: 'empatage', weightKg: 1.5, colorEbc: 1150 }];
    const mash = { ceiling: raSaltCeilingForGrist(grist, 3.5), target: raForGrist(grist, 3.5) };
    const gristBand = targetRaForGrist(120, grist, 3.5);
    const solution = solveSalts({ ...waterProfileTarget(style, source, undefined, 0.7),
      start: source, ratio: 0.7, totalWaterL: 17.5, mashWaterL: 17.5,
      raCeiling: mash.ceiling, raPreference: mash.target, targetRa: gristBand });
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 17.5, spargeWaterL: 0, doses: solution.doses,
      acidId: 'lactique', ...waterTreatmentTarget(style, undefined, mash),
    }, gristBand);
    expect(result.treatedTotal.hco3).toBeGreaterThan(175);
    expect(result.mashAcid.amount).toBe(0);
    const ph = estimateMashPh(grist, result.mashPhRa, 3.5);
    expect(ph.phPredicted).toBeGreaterThanOrEqual(5.2);
    expect(ph.phPredicted).toBeLessThanOrEqual(5.5);
    expect(assessWaterProfile(result.treatedTotal, style.ions).reached).toBe(true);
  });

  it('accepts an in-range boundary result when the interior point cannot be supplied', () => {
    const source = { ...DEFAULT_WATER_SOURCE, ca: 85, mg: 0, na: 33, so4: 63, cl: 90, hco3: 125 };
    const solution = solveSalts({ ...waterProfileTarget(style, source, undefined, 0.7),
      start: source, ratio: 0.7, totalWaterL: 30, mashWaterL: 30,
      raCeiling: 150, raPreference: 80,
      disabled: ['nahco3', 'chaux', 'caco3'] });
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 30, spargeWaterL: 0, doses: solution.doses,
      acidId: 'lactique', ...waterTreatmentTarget(style, undefined, { ceiling: 150, target: 80 }),
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

describe('Acid treats mash alkalinity, with two independent waters and retained doses', () => {
  it.each(['lactique', 'phosphorique', 'maltAcidule'] as const)(
    '%s: respects the mash need with different dilutions and a retained sparge dose', acidId => {
      const source = { ...DEFAULT_WATER_SOURCE, hco3: 500 };
      const spargeDose = acidId === 'maltAcidule' ? 0 : 0.8;
      const result = calculateWaterTreatment(source, {
        mashWaterL: 20, spargeWaterL: 10, diRatioPct: 20, spargeDiRatioPct: 80, doses: {}, acidId,
        acidOverride: { sparge: spargeDose }, ...waterTreatmentTarget(style, undefined, { ceiling: 180, target: 120 }),
      }, band);
      // Independent mass balance, including the two actual source fractions.
      const strength = { lactique: 600, phosphorique: 750, maltAcidule: 20 }[acidId];
      const mashMass = Math.max(0, 400 * 20 - result.mashAcid.amount * strength);
      const spargeMass = Math.max(0, 100 * 10 - spargeDose * strength);
      const expected = (mashMass + spargeMass) / 30;
      expect(result.treatedTotal.hco3).toBeCloseTo(expected, 1);
      const mashTargetHco3 = (120 + 68 / 1.4 + 11.2 / 1.7) * 61 / 50;
      const wanted = (mashTargetHco3 * 20 + spargeMass) / 30;
      expect(Math.abs(expected - wanted)).toBeLessThanOrEqual(strength * 0.05 / 30 + 0.1);
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
    expect(automatic.treatedTotal.hco3).toBe(120);
    expect(manual.treatedTotal.hco3).toBe(240);
    expect(manual.mashAcid.amount).toBe(0);
    expect(manual.mashAcidCalculated.amount).toBe(automatic.mashAcid.amount);
    expect(manual.hco3Target).toBeUndefined();
  });

  it('does not acidify already suitable water merely because its HCO3 is above the middle-low point', () => {
    const result = calculateWaterTreatment({ ...DEFAULT_WATER_SOURCE, hco3: 190 }, {
      diRatioPct: 0, mashWaterL: 30, spargeWaterL: 0, doses: {}, acidId: 'lactique',
      ...waterTreatmentTarget(style, undefined, { ceiling: 140, target: 80 }),
    }, band);
    expect(result.mashAcid.amount).toBe(0);
    expect(result.treatedTotal.hco3).toBe(190);
  });

  it('does not buy alkali solely to cancel a manual mash acid dose inside the profile', () => {
    const source = { ...DEFAULT_WATER_SOURCE, ca: 85, mg: 0, na: 18, so4: 63, cl: 90, hco3: 180 };
    const solved = solveSalts({ ...waterProfileTarget(style, source, undefined, 0.7), start: source,
      totalWaterL: 30, mashWaterL: 30, ratio: 0.7, mashAcidHco3Mg: 1200,
      raCeiling: 150, raPreference: 100 });
    expect(solved.doses).toEqual({});
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 30, spargeWaterL: 0, doses: solved.doses, acidId: 'lactique',
      acidOverride: { mash: 2 }, ...waterTreatmentTarget(style, undefined, { ceiling: 150, target: 100 }),
    }, band);
    expect(result.mashAcid.amount).toBe(2);
    expect(result.treatedTotal.hco3).toBe(140);
    expect(result.bicarbonatePreference?.reason).toBe('manual-acid');
  });

  it('prioritizes the true profile bounds over a preferred point that cannot be weighed exactly', () => {
    const source = { ...DEFAULT_WATER_SOURCE, hco3: 200 };
    const result = calculateWaterTreatment(source, {
      diRatioPct: 0, mashWaterL: 10, spargeWaterL: 0, doses: {}, acidId: 'lactique',
      hco3Range: { min: 120, max: 130 }, hco3Target: 121,
    }, band);
    // 1.3 mL -> 122 ppm; 1.4 mL -> 116 ppm would violate the hard minimum.
    expect(result.mashAcid.amount).toBe(1.3);
    expect(result.treatedTotal.hco3).toBe(200 - 1.3 * ACIDS.lactique.hco3NeutralizedPerUnit / 10);
  });
});
