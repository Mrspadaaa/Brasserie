import { describe, it, expect } from 'vitest';
import {
  calculateWaterTreatment,
  savedWaterDisplay,
  DEFAULT_WATER_SOURCE,
  targetRaForGrist,
  ionsAfterAcid,
  waterFromPlan,
  dilute
} from '../../src/domain/water';
import { WaterPlan } from '../../src/types';

const base = {
  diRatioPct: 0,
  spargeDiRatioPct: 70,
  doses: { gypse: 2, cacl2: 3 },
  mashWaterL: 25,
  spargeWaterL: 10,
  acidId: 'lactique' as const,
  allSaltsInMash: true
};
const band = targetRaForGrist(8, undefined, 4);

describe('One retained water treatment for all recipe views', () => {
  it.each([0, 40, 100])('retains manual acid including zero, at %s%% RO', (diRatioPct) => {
    const input = { ...base, diRatioPct, acidOverride: { mash: 0, sparge: 0.7 } };
    const t = calculateWaterTreatment(DEFAULT_WATER_SOURCE, input, band);
    expect(t.mashAcid.amount).toBe(0);
    expect(t.spargeAcid.amount).toBe(0.7);
    const raw = waterFromPlan(
      dilute(DEFAULT_WATER_SOURCE, diRatioPct),
      input.doses,
      25,
      10,
      dilute(DEFAULT_WATER_SOURCE, 70),
      true
    );
    expect(t.treated.mash).toEqual(raw.mash);
    expect(t.treated.sparge).toEqual(ionsAfterAcid(raw.sparge, 0.7, 'lactique', 10));
    expect(t.treatedTotal.hco3).toBeCloseTo(
      (t.treated.mash.hco3 * 25 + t.treated.sparge.hco3 * 10) / 35,
      0
    );
    expect(t.startTotal.hco3).toBeCloseTo((t.start.hco3 * 25 + t.startSparge.hco3 * 10) / 35, 0);
  });
  it('manual acid changes the bicarbonate, not calcium or the target band', () => {
    const before = calculateWaterTreatment(
      DEFAULT_WATER_SOURCE,
      { ...base, acidOverride: { mash: 0 } },
      band
    );
    const after = calculateWaterTreatment(
      DEFAULT_WATER_SOURCE,
      { ...base, acidOverride: { mash: 3 } },
      band
    );
    expect(after.treatedTotal.hco3).toBeLessThan(before.treatedTotal.hco3);
    expect(after.treatedTotal.ca).toBe(before.treatedTotal.ca);
    expect(after.raAfter).toBeLessThan(before.raAfter);
    expect(after.ratio).toEqual(before.ratio);
  });
  it('removes a stale sparge override when there is no sparge', () => {
    expect(
      calculateWaterTreatment(
        DEFAULT_WATER_SOURCE,
        { ...base, spargeWaterL: 0, acidOverride: { sparge: 9 } },
        band
      ).spargeAcid.amount
    ).toBe(0);
  });
  it('updates legacy pre-acid snapshots once and leaves v2 snapshots unchanged', () => {
    const t = calculateWaterTreatment(
      DEFAULT_WATER_SOURCE,
      { ...base, acidOverride: { mash: 3, sparge: 0.7 } },
      band
    );
    const plan: WaterPlan = {
      sourceId: 'old',
      diRatioPct: 0,
      spargeDiRatioPct: 70,
      mashWaterL: 25,
      spargeWaterL: 10,
      ...t.split,
      targetPh: 5.4,
      startIons: t.start,
      wortIons: t.total,
      acid: { id: 'lactique', mash: 3, sparge: 0.7 }
    };
    expect(savedWaterDisplay(plan)).toEqual({ start: t.startTotal, achieved: t.treatedTotal });
    const saved = {
      ...plan,
      treatmentVersion: 2 as const,
      startIons: t.startTotal,
      wortIons: t.treatedTotal
    };
    expect(savedWaterDisplay(JSON.parse(JSON.stringify(saved)))).toEqual(savedWaterDisplay(plan));
  });
});
