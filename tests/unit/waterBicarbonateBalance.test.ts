import { describe, expect, it } from 'vitest';
import type { WaterPlan, WaterSource } from '../../src/types';
import { calculateWaterTreatment, savedWaterDisplay } from '../../src/domain/water/treatment';
import type { TreatmentInput } from '../../src/domain/water/treatment';
import { waterAcidBalance } from '../../src/domain/water/acid';

const source: WaterSource = {
  id: 'reseau', name: 'Réseau — Villars-sur-Glâne',
  ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250, ph: 7.4
};
const band = { min: -43, max: 0, label: 'Empâtage', hint: '' };
const photo: TreatmentInput = {
  diRatioPct: 20, spargeDiRatioPct: 20,
  mashWaterL: 10.8, spargeWaterL: 21.5,
  doses: { gypse: 2.6, cacl2: 2.1, nacl: 0.5, kcl: 3 },
  allSaltsInMash: true, acidId: 'lactique',
  acidOverride: { mash: 0, sparge: 6.2 }
};

describe('Bicarbonate balance across separately prepared brewing waters', () => {
  it('explains 13 ppm with 107.7 mL at mash without losing the acid beyond the water buffer', () => {
    const input: TreatmentInput = {
      diRatioPct: 45, spargeDiRatioPct: 45,
      mashWaterL: 7.7, spargeWaterL: 22,
      doses: { gypse: 3.4, nacl: 1.4 }, acidId: 'lactique',
      acidOverride: { mash: 107.7, sparge: 4.4 },
    };
    const result = calculateWaterTreatment(source, input, band);
    // Each water starts at 137.5 mg/L. Sparge retains 3025 - 2640 = 385 mg.
    expect(result.treated.mash.hco3).toBe(0);
    expect(result.treated.sparge.hco3).toBeCloseTo(17.5, 10);
    expect(result.treatedTotal.hco3).toBe(13);
    expect(result.acidBalance.mash?.neutralizationAmount).toBeCloseTo(1058.75 / 600, 10);
    expect(result.acidBalance.mash?.beyondWaterAmount).toBeCloseTo((64620 - 1058.75) / 600, 10);
    expect(result.acidBalance.sparge?.beyondWaterAmount).toBe(0);
    // Increasing acid after HCO3 reaches zero must still lower the mash model's input.
    const lessAcid = calculateWaterTreatment(source, {
      ...input, acidOverride: { mash: 2, sparge: 4.4 },
    }, band);
    expect(lessAcid.treatedTotal.hco3).toBe(result.treatedTotal.hco3);
    expect(result.mashPhRa).toBeLessThan(lessAcid.mashPhRa);
    expect(result.mashAcid.amount).toBe(107.7);
  });

  it.each([
    { acid: 'lactique' as const, strength: 600 },
    { acid: 'phosphorique' as const, strength: 750 },
    { acid: 'maltAcidule' as const, strength: 20 },
  ])('accounts for the actual product strength and units for $acid', ({ acid, strength }) => {
    const capacity = 100 * 10 / strength;
    const before = waterAcidBalance({ ...source, hco3: 100 }, capacity / 2, acid, 10)!;
    const at = waterAcidBalance({ ...source, hco3: 100 }, capacity, acid, 10)!;
    const beyond = waterAcidBalance({ ...source, hco3: 100 }, capacity + 1, acid, 10)!;
    expect(before.hco3After).toBeCloseTo(50, 10);
    expect(before.beyondWaterAmount).toBe(0);
    expect(at.hco3After).toBeCloseTo(0, 10);
    expect(at.beyondWaterAmount).toBe(0);
    expect(beyond.hco3After).toBe(0);
    expect(beyond.beyondWaterAmount).toBeCloseTo(1, 10);
  });

  it('keeps unknown or absent water distinct from exhausted bicarbonate', () => {
    for (const litres of [0, -1, NaN, Infinity])
      expect(waterAcidBalance(source, 107.7, 'lactique', litres)).toBeNull();
    expect(waterAcidBalance({ ...source, hco3: NaN }, 1, 'lactique', 10)).toBeNull();
    expect(waterAcidBalance(source, NaN, 'lactique', 10)).toBeNull();
    expect(waterAcidBalance({ ...source, hco3: 0 }, 1, 'lactique', 10))
      .toEqual({ hco3After: 0, neutralizationAmount: 0, beyondWaterAmount: 1 });
    const noSparge = calculateWaterTreatment(source, {
      ...photo, spargeWaterL: 0, acidOverride: { mash: 107.7, sparge: 200 },
    }, band);
    expect(noSparge.acidBalance.sparge).toBeNull();
    expect(noSparge.spargeAcid.amount).toBe(0);
    expect(noSparge.treatedTotal.hco3).toBe(0);
  });

  it('explains the photo: 200 ppm at mash and 27 ppm at sparge give 85 ppm on the total-water graph', () => {
    const result = calculateWaterTreatment(source, photo, band);

    expect(result.start.hco3).toBe(200);
    expect(result.startSparge.hco3).toBe(200);
    expect(result.mashAcid.amount).toBe(0);
    expect(result.spargeAcid.amount).toBe(6.2);
    expect(result.treated.mash.hco3).toBe(200);
    expect(result.treated.sparge.hco3).toBeCloseTo(26.976744186046517, 10);

    // Independent mass balance using the product's 600 mg HCO3-equivalent/mL:
    // 200 mg/L × 32.3 L − 6.2 mL × 600 mg/mL = 2740 mg in 32.3 L.
    expect(result.treatedTotal.hco3).toBe(84.8);
    expect(result.treatedTotal.hco3).toBeCloseTo(2740 / 32.3, 1);
    expect(Math.round(result.treatedTotal.hco3)).toBe(85);
  });

  it.each([
    { mash: 0, sparge: 0, expected: 100.2 },
    { mash: 1, sparge: 0, expected: 81.6 },
    { mash: 0, sparge: 0.5, expected: 90.9 },
    { mash: 1, sparge: 0.5, expected: 72.3 }
  ])('keeps independent 20% / 80% RO mixtures with $mash / $sparge mL manual acid', ({ mash, sparge, expected }) => {
    const result = calculateWaterTreatment(source, {
      ...photo, spargeDiRatioPct: 80, acidOverride: { mash, sparge }
    }, band);

    // 8.64 L network at mash + 4.30 L at sparge contain 3235 mg HCO3.
    // Each manual acid dose consumes its own water's alkalinity before mixing.
    expect(result.start.hco3).toBe(200);
    expect(result.startSparge.hco3).toBe(50);
    expect(result.startTotal.hco3).toBe(100.2);
    expect(result.mashAcid.amount).toBe(mash);
    expect(result.spargeAcid.amount).toBe(sparge);
    expect(result.treated.mash.hco3).toBeCloseTo(mash === 0 ? 200 : 144.44444444444446, 10);
    expect(result.treated.sparge.hco3).toBeCloseTo(sparge === 0 ? 50 : 36.04651162790697, 10);
    expect(result.treatedTotal.hco3).toBe(expected);
    expect(result.treatedTotal.hco3).toBeCloseTo((3235 - 600 * (mash + sparge)) / 32.3, 1);
  });

  it('reopens the photo with retained zero mash acid and updated sparge acid rather than stale total ions', () => {
    const result = calculateWaterTreatment(source, photo, band);
    const plan: WaterPlan = {
      sourceId: source.id, sourceSnapshot: source, treatmentVersion: 2,
      diRatioPct: 20, spargeDiRatioPct: 20,
      mashWaterL: 10.8, spargeWaterL: 21.5, allSaltsInMash: true,
      ...result.split, targetPh: 5.4,
      // The old export had 1.2 mL mash acid and stored 62.5 ppm total.
      wortIons: { ...result.treatedTotal, hco3: 62.5 },
      acid: { id: 'lactique', mash: 0, sparge: 6.2 }
    };
    const saved = JSON.parse(JSON.stringify(plan)) as WaterPlan;
    expect(savedWaterDisplay(saved)?.achieved.hco3).toBe(84.8);
    saved.acid!.sparge = 0;
    expect(savedWaterDisplay(saved)?.achieved.hco3).toBe(200);
    expect(saved.wortIons?.hco3).toBe(62.5);
  });
});
