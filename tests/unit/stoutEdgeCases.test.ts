import { describe, expect, it } from 'vitest';
import {
  ACIDS, SALT_IDS, ALKALINE_SALTS, alkalineSaltGoal, calculateWaterTreatment,
  dilute, estimateMashPh, raSaltCeilingForGrist, rebalanceRatio,
  residualAlkalinity, solveSalts, targetRaForGrist
} from '../../src/domain/water';
import type { SolveInput } from '../../src/domain/water';
import type { AcidId, WaterIons } from '../../src/types';
import { midpoint, styleByCode, styleFromTargetIons } from '../../src/domain/waterStyles';
import { monSuperStoutRo } from '../fixtures/monSuperStout';

const recipe = monSuperStoutRo;
const plan = recipe.waterPlan!;
const source = plan.sourceSnapshot!;
const zero = plan.startIons!;
const ratio = 34.6 / 9.1;
const style = styleByCode('20C');
const band = targetRaForGrist(98.8, recipe.fermentables, ratio);
const ceiling = raSaltCeilingForGrist(recipe.fermentables, ratio);
const input: SolveInput = {
  start: zero, target: rebalanceRatio(midpoint(style), 0.4), ranges: style.ions,
  totalWaterL: 45.6, mashWaterL: 34.6, allSaltsInMash: true,
  targetRa: band, raCeiling: ceiling, ratio: 0.4
};
const tasteIons = ['ca', 'mg', 'na', 'so4', 'cl'] as const;

function finiteWater(water: WaterIons) {
  for (const value of Object.values(water)) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
}

describe('Imperial stout smoke — missing salts and real constraints', () => {
  it('checks all 512 salt availability combinations without inventing a successful plan', () => {
    for (let mask = 0; mask < 2 ** SALT_IDS.length; mask++) {
      const disabled = SALT_IDS.filter((_, i) => mask & (1 << i));
      const r = solveSalts({ ...input, disabled });
      const context = `disabled=${disabled.join(',') || 'none'}`;
      for (const id of disabled) expect(r.doses[id] ?? 0, context).toBe(0);
      finiteWater(r.achievedMash);
      finiteWater(r.achievedWort);
      for (const dose of Object.values(r.doses)) {
        expect(Number.isFinite(dose), context).toBe(true);
        expect(dose, context).toBeGreaterThanOrEqual(0);
      }
      for (const ion of tasteIons) {
        expect(r.achievedWort[ion], `${context}/${ion}`).toBeLessThanOrEqual(style.ions[ion].max + 0.2);
        if (r.achievedWort[ion] < style.ions[ion].min - 2.1)
          expect(r.issues, `${context}/${ion}`).toContainEqual(expect.objectContaining({ code: 'low', ion }));
      }
      expect(524.4 * (r.doses.kcl ?? 0) / 45.6, context).toBeLessThanOrEqual(50);
      expect(r.achievedSparge.hco3, context).toBe(0);
      if (residualAlkalinity(r.achievedMash) < alkalineSaltGoal(band, ceiling).target - 10)
        expect(r.issues, context).toContainEqual(expect.objectContaining({ code: 'alkalinity-low' }));
    }
  });

  it('uses another available alkali when bicarbonate is unavailable', () => {
    const r = solveSalts({ ...input, disabled: ['nahco3'] });
    expect(r.doses.nahco3).toBeUndefined();
    expect(r.doses.chaux).toBeGreaterThan(0);
    expect(r.achievedMash.hco3).toBeGreaterThan(0);
    expect(r.issues).not.toContainEqual(expect.objectContaining({ code: 'alkalinity-low' }));
  });

  it('reports the missing alkalinity when every alkali is disabled', () => {
    const r = solveSalts({ ...input, disabled: ALKALINE_SALTS });
    expect(r.achievedMash.hco3).toBe(0);
    expect(r.issues).toContainEqual(expect.objectContaining({ code: 'alkalinity-low', excluded: true }));
  });

  it('can add KCl when calcium, magnesium and sodium already leave no room', () => {
    const start = { ca: 130, mg: 30, na: 80, cl: 60, so4: 40, hco3: 100 };
    const r = solveSalts({ ...input, start });
    expect(r.doses.kcl).toBeGreaterThan(0);
    expect(r.achievedWort.cl).toBeGreaterThan(start.cl);
    for (const ion of ['ca', 'mg', 'na'] as const)
      expect(r.achievedWort[ion]).toBeLessThanOrEqual(start[ion] + 0.1);
  });

  it.each([
    { name: 'calcium', water: { ...zero, ca: 170, hco3: 300 }, ion: 'ca' },
    { name: 'magnesium', water: { ...zero, mg: 45, hco3: 200 }, ion: 'mg' },
    { name: 'sodium', water: { ...zero, na: 180, hco3: 450 }, ion: 'na' },
    { name: 'sulfate', water: { ...zero, so4: 250 }, ion: 'so4' },
    { name: 'chloride', water: { ...zero, cl: 300 }, ion: 'cl' }
  ])('reports source $name excess instead of adding more or pretending to remove it', ({ water, ion }) => {
    const r = solveSalts({ ...input, start: water });
    expect(r.achievedWort[ion]).toBeCloseTo(water[ion], 1);
    expect(r.issues).toContainEqual(expect.objectContaining({ code: 'high', ion, source: water[ion] }));
  });

  it('honours explicit magnesium and sodium targets on an RO stout', () => {
    const target = { ca: 95, mg: 15, na: 40, so4: 70, cl: 125, hco3: 100 };
    const custom = styleFromTargetIons(target, 'Imperial stout personnelle');
    const r = solveSalts({ ...input, target, ranges: custom.ions, mineralTargetMode: 'target' });
    expect((r.doses.epsom ?? 0) + (r.doses.mgcl2 ?? 0)).toBeGreaterThan(0);
    for (const ion of ['mg', 'na'] as const) {
      expect(r.achievedWort[ion]).toBeGreaterThanOrEqual(custom.ions[ion].min - 2);
      expect(r.achievedWort[ion]).toBeLessThanOrEqual(custom.ions[ion].max + 0.2);
    }
  });
});

describe('Imperial stout smoke — water volumes and independent sparge', () => {
  it.each([0, -1, NaN, Infinity])('has no dose when total water is invalid: %s L', (totalWaterL) => {
    const r = solveSalts({ ...input, totalWaterL });
    expect(r.doses).toEqual({});
    expect(r.issues).toContainEqual({ code: 'volume' });
    finiteWater(r.achievedWort);
  });

  it.each([0.01, 0.5, 2, 10])('scales the recipe by %s, retaining finite values and mineral limits', (scale) => {
    const r = solveSalts({ ...input, totalWaterL: 45.6 * scale, mashWaterL: 34.6 * scale });
    finiteWater(r.achievedMash);
    finiteWater(r.achievedWort);
    for (const ion of tasteIons)
      expect(r.achievedWort[ion]).toBeLessThanOrEqual(style.ions[ion].max + 0.2);
    // Very small batches may be unreachable with the minimum weighable dose.
    if (scale >= 0.5)
      expect(r.achievedWort.hco3).toBeCloseTo(plan.wortIons!.hco3, -1);
  });

  it.each([0, 0.1, 11, 25])('does not put alkali into %s L of sparge water', (spargeL) => {
    const r = solveSalts({ ...input, totalWaterL: 34.6 + spargeL, allSaltsInMash: false });
    const t = calculateWaterTreatment(source, {
      diRatioPct: 100, mashWaterL: 34.6, spargeWaterL: spargeL,
      doses: r.doses, acidId: 'lactique', allSaltsInMash: false
    }, band);
    for (const id of ALKALINE_SALTS) expect(t.split.sparge[id] ?? 0).toBe(0);
    expect(t.treated.sparge.hco3).toBe(0);
    expect(t.spargeAcid.amount).toBe(0);
    expect(t.raw.mash).toEqual(r.achievedMash);
    expect(t.raw.sparge).toEqual(r.achievedSparge);
  });

  it.each([[100, 0], [0, 100], [50, 90]])('keeps mash RO %s%% and sparge RO %s%% separate', (mashRo, spargeRo) => {
    const r = solveSalts({ ...input, start: dilute(source, mashRo), startSparge: dilute(source, spargeRo) });
    const t = calculateWaterTreatment(source, {
      diRatioPct: mashRo, spargeDiRatioPct: spargeRo, mashWaterL: 34.6, spargeWaterL: 11,
      doses: r.doses, acidId: 'lactique', allSaltsInMash: true
    }, band);
    expect(t.raw.mash).toEqual(r.achievedMash);
    expect(t.raw.sparge).toEqual(r.achievedSparge);
    expect(t.spargeAcid.amount > 0).toBe(spargeRo < 100);
    expect(t.treatedTotal.hco3).toBeCloseTo((t.treated.mash.hco3 * 34.6 + t.treated.sparge.hco3 * 11) / 45.6, 0);
    for (const ion of tasteIons) expect(t.treatedTotal[ion]).toBe(r.achievedWort[ion]);
  });
});

describe('Imperial stout smoke — incomplete grist and acids', () => {
  it.each(['lactique', 'phosphorique', 'maltAcidule'] as AcidId[])('%s keeps full acid equivalents in the pH model, even after HCO3 is exhausted', (acidId) => {
    const neutralizes = ACIDS[acidId].hco3NeutralizedPerUnit;
    const amounts = ACIDS[acidId].unit === 'g' ? [0, 30, 180, 450] : [0, 1, 6, 15];
    const results = amounts.map(amount => calculateWaterTreatment(source, {
      diRatioPct: 100, doses: plan.mash, mashWaterL: 34.6, spargeWaterL: 11,
      acidId, acidOverride: { mash: amount }
    }, band));
    results.forEach((t, i) => {
      expect(t.mashPhRa).toBeCloseTo(t.raBefore - amounts[i] * neutralizes / 34.6 * 50 / 61, 8);
      expect(t.treated.mash.hco3).toBeGreaterThanOrEqual(0);
      expect(t.mashAcidCalculated.amount).toBe(0);
      expect(t.split.mash).toEqual(plan.mash);
    });
    expect(results[2].treated.mash.hco3).toBe(0);
    expect(results[3].treated.mash.hco3).toBe(0);
    expect(results[3].mashPhRa).toBeLessThan(results[2].mashPhRa);
    expect(results[0].mashPhRa).toBe(results[0].raBefore);
    expect(results[1].mashPhRa).toBeCloseTo(results[1].raAfter, 0);
  });

  it.each([
    { name: 'missing EBC', grist: recipe.fermentables.map(g => ({ ...g, colorEbc: undefined })), known: false },
    { name: 'no grist', grist: [], known: false },
    { name: 'acid malt', grist: [...recipe.fermentables, { name: 'Malt acidulé', kind: 'grain', use: 'empatage', weightKg: 0.5, colorEbc: 5 }], known: true },
    { name: 'more roasted barley', grist: recipe.fermentables.map(g => ({ ...g, weightKg: g.name === 'Röstgerste' ? 2 : 7.1 })), known: true }
  ])('$name never increases acid based on uncertain grist estimates', ({ grist, known }) => {
    const b = targetRaForGrist(98.8, grist, ratio);
    const c = raSaltCeilingForGrist(grist, ratio);
    expect(c !== null).toBe(known);
    const r = solveSalts({ ...input, targetRa: b, raCeiling: c });
    finiteWater(r.achievedMash);
    expect(estimateMashPh(grist, residualAlkalinity(r.achievedMash), ratio).known).toBe(known);
    const state = { diRatioPct: 0, doses: r.doses, mashWaterL: 34.6, spargeWaterL: 11, acidId: 'lactique' as const };
    const withGrist = calculateWaterTreatment(source, state, b);
    const colourOnly = calculateWaterTreatment(source, state, targetRaForGrist(98.8, undefined, ratio));
    expect(withGrist.mashAcid.amount).toBeLessThanOrEqual(colourOnly.mashAcid.amount);
  });

  it.each(['lactique', 'phosphorique', 'maltAcidule'] as AcidId[])('%s preserves explicit zero and accounts for a hand-set dose in the right units', (acidId) => {
    const state = { diRatioPct: 100, doses: plan.mash, mashWaterL: 34.6, spargeWaterL: 11, acidId };
    const unit = ACIDS[acidId].unit;
    const amount = unit === 'g' ? 30 : 1;
    const t = calculateWaterTreatment(source, { ...state, acidOverride: { mash: amount, sparge: 0 } }, band);
    expect(t.mashAcid).toMatchObject({ amount, unit });
    expect(t.spargeAcid.amount).toBe(0);
    expect(t.treated.mash.hco3).toBeCloseTo(t.raw.mash.hco3 - amount * ACIDS[acidId].hco3NeutralizedPerUnit / 34.6, 6);
    for (const ion of tasteIons) expect(t.treated.mash[ion]).toBe(t.raw.mash[ion]);
    const reset = calculateWaterTreatment(source, { ...state, acidOverride: { mash: 0 } }, band);
    expect(reset.treated.mash).toEqual(reset.raw.mash);
    expect(reset.mashAcid.amount).toBe(0);
  });
});
