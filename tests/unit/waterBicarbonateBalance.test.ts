import { describe, expect, it } from 'vitest';
import type { WaterPlan, WaterSource } from '../../src/types';
import { calculateWaterTreatment, savedWaterDisplay } from '../../src/domain/water/treatment';
import type { TreatmentInput } from '../../src/domain/water/treatment';

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
