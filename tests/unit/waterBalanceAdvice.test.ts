import { describe, expect, it } from 'vitest';
import { calculateWaterTreatment, DEFAULT_WATER_SOURCE, SALT_IDS, solveSalts, dilute } from '../../src/domain/water';
import { styleByCode } from '../../src/domain/waterStyles';
import { waterProfileTarget, waterTreatmentTarget } from '../../src/domain/water/profileTarget';
import { diagnoseWaterProfile } from '../../src/domain/water/profileDiagnosis';
import { assessWaterProfile } from '../../src/domain/water/profileAssessment';

const style = styleByCode('20C');
const band = { min: -60, max: 0 };
const doses = { gypse: 2.6, cacl2: 2.1, nacl: 0.5, kcl: 3 };
const input = { diRatioPct: 20, mashWaterL: 10.8, spargeWaterL: 21.5,
  doses, acidId: 'lactique' as const, acidOverride: { mash: 0, sparge: 6.2 }, ...waterTreatmentTarget(style) };

describe('Brewer-oriented balance and explanations', () => {
  it('finds a simple, in-range stout balance without adding optional magnesium or potassium', () => {
    const start = dilute(DEFAULT_WATER_SOURCE, 20);
    const solution = solveSalts({ ...waterProfileTarget(style, start, undefined, 0.7), start, ratio: 0.7,
      totalWaterL: 32.3, mashWaterL: 10.8, spargeHco3AfterAcid: 200 - 6.2 * 600 / 21.5 });
    const after = calculateWaterTreatment(DEFAULT_WATER_SOURCE, { ...input, doses: solution.doses }, band);
    expect(assessWaterProfile(after.treatedTotal, style.ions).reached).toBe(true);
    expect(Object.keys(solution.doses).sort()).toEqual(['cacl2', 'gypse', 'nahco3']);
    expect(after.treatedTotal.mg).toBe(11.2);
    expect(Math.abs(after.treatedTotal.so4 / after.treatedTotal.cl - 0.7)).toBeLessThanOrEqual(0.05);
    expect(after.spargeAcid.amount).toBe(6.2);
    expect(after.mashAcid.amount).toBe(0);
  });

  it('explains the real sparge floor, which no mash acid adjustment can remove', () => {
    const ranges = { ...style.ions, hco3: { min: 0, max: 40 } };
    const actual = calculateWaterTreatment(DEFAULT_WATER_SOURCE, { ...input, mashWaterL: 10,
      spargeWaterL: 20, doses: {}, acidOverride: { mash: 100, sparge: 0 } }, band);
    const reasons = diagnoseWaterProfile({ actual, ranges, targeted: ['hco3'], totalWaterL: 30, spargeWaterL: 20 });
    expect(reasons[0]).toMatchObject({ code: 'sparge', ions: ['hco3'] });
    expect(reasons[0].message).toContain('133,3 ppm');
    expect(reasons[0].message).toContain('Corriger seulement l’empâtage ne suffit pas');
  });

  it('distinguishes source excess from excluded salts and coupled additions', () => {
    const ranges = { ...style.ions, ca: { min: 50, max: 100 }, so4: { min: 100, max: 150 } };
    const make = (ca: number) => calculateWaterTreatment({ ...DEFAULT_WATER_SOURCE, ca, so4: 10 },
      { ...input, diRatioPct: 0, mashWaterL: 20, spargeWaterL: 0, doses: {}, acidOverride: { mash: 0 } }, band);
    const source = diagnoseWaterProfile({ actual: make(150), ranges, targeted: ['ca'], totalWaterL: 20, spargeWaterL: 0 });
    expect(source[0].code).toBe('source');
    expect(source[0].message).toContain('déjà 150 ppm');
    const excluded = diagnoseWaterProfile({ actual: make(90), ranges, targeted: ['so4'], totalWaterL: 20,
      spargeWaterL: 0, disabled: ['gypse', 'epsom'] });
    expect(excluded[0].code).toBe('excluded');
    const coupled = diagnoseWaterProfile({ actual: make(90), ranges, targeted: ['so4'], totalWaterL: 20,
      spargeWaterL: 0, disabled: SALT_IDS.filter(id => id !== 'gypse') });
    expect(coupled[0].code).toBe('coupled');
    expect(coupled[0].message).toContain('3,3 g de Gypse');
    expect(coupled[0].message).toContain('128,4 ppm (maximum 100)');
  });

  it('proves an incompatible ratio from the unchanged sulfate and chloride ranges', () => {
    const actual = calculateWaterTreatment(DEFAULT_WATER_SOURCE, input, band);
    const reason = diagnoseWaterProfile({ actual, ranges: style.ions, totalWaterL: 32.3,
      spargeWaterL: 21.5, requestedRatio: 9 }).find(item => item.code === 'ratio')!;
    expect(reason.message).toContain('SO₄ ≥ 720 ppm');
    expect(reason.message).toContain('limite à 80');
  });

  it('only attributes a gap to manual acid after checking the same salts with calculated acid', () => {
    const ranges = { ...style.ions, hco3: { min: 100, max: 150 } };
    const treatmentInput = { ...input, mashWaterL: 20, spargeWaterL: 10, doses: {}, hco3Range: ranges.hco3 };
    const actual = calculateWaterTreatment(DEFAULT_WATER_SOURCE, { ...treatmentInput, acidOverride: { mash: 10, sparge: 0 } }, band);
    const automaticAcid = calculateWaterTreatment(DEFAULT_WATER_SOURCE, { ...treatmentInput, acidOverride: undefined }, band);
    const reasons = diagnoseWaterProfile({ actual, automaticAcid, ranges, targeted: ['hco3'], totalWaterL: 30, spargeWaterL: 10 });
    expect(reasons[0].code).toBe('manual-acid');
    expect(automaticAcid.treatedTotal.hco3).toBeGreaterThanOrEqual(100);
    expect(automaticAcid.treatedTotal.hco3).toBeLessThanOrEqual(150);
  });
});
