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
import { monSuperStout } from '../fixtures/monSuperStout';

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
  it('stout: 7.5 mL is a manual override, not the calculated acid prescription', () => {
    const p = monSuperStout.waterPlan!;
    const band = targetRaForGrist(98.8, monSuperStout.fermentables, 5);
    const input = { ...p, doses: p.mash, acidId: p.acid!.id };
    const manual = calculateWaterTreatment(p.sourceSnapshot!, input, band);
    const automatic = calculateWaterTreatment(p.sourceSnapshot!, { ...input, acidOverride: undefined }, band);
    // 250 ppm × 80% network; 7.5 mL × 600 mg/mL neutralised over 45.5 L.
    expect(manual.treated.mash.hco3).toBeCloseTo(200 - 7.5 * 600 / 45.5, 6);
    expect(manual.treatedTotal.hco3).toBe(101.3);
    expect(manual.raAfter).toBeCloseTo(5, 0);
    expect(automatic.mashAcid.amount).toBe(0);
    expect(automatic.treated.mash.hco3).toBe(200);
    expect(automatic.raAfter).toBeGreaterThanOrEqual(band.min);
    expect(automatic.raAfter).toBeLessThanOrEqual(band.max);
    expect(automatic.split).toEqual(manual.split);
  });
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

  it('recomputes a saved v2 display from its frozen source and retained sparge acid', () => {
    const plan: WaterPlan = {
      sourceId: DEFAULT_WATER_SOURCE.id,
      sourceSnapshot: { ...DEFAULT_WATER_SOURCE, hco3: 250 },
      treatmentVersion: 2,
      diRatioPct: 0,
      mashWaterL: 20,
      spargeWaterL: 10,
      mash: {}, sparge: {}, targetPh: 5.4,
      startIons: { ...DEFAULT_WATER_SOURCE, hco3: 250 },
      wortIons: { ...DEFAULT_WATER_SOURCE, hco3: 250 },
      acid: { id: 'lactique', mash: 0, sparge: 2 }
    };
    expect(savedWaterDisplay(plan)!.achieved.hco3).toBe(210);
    plan.acid!.sparge = 3;
    expect(savedWaterDisplay(JSON.parse(JSON.stringify(plan)))!.achieved.hco3).toBe(190);
    const legacySource = { ...plan, sourceSnapshot: undefined };
    expect(savedWaterDisplay(legacySource)!.achieved.hco3).toBe(190);
    expect(plan.wortIons!.hco3).toBe(250); // Reading does not mutate the recipe.
    delete plan.wortIons;
    delete plan.startIons;
    expect(savedWaterDisplay(plan)!.achieved.hco3).toBe(190);
  });
});
