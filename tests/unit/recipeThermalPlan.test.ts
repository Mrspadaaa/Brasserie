import { describe, expect, it } from 'vitest';
import { recipeThermalPlan, withoutMashout } from '../../src/domain/recipeThermalPlan';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

function recipe() {
  return fixtureRecipe({ mash: {
    steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }, { name: 'Mash-out', tempC: 75, durationMin: 10 }],
    heatingRateCPerMin: 0.2, spargeType: 'batch'
  } });
}

describe('plan thermique pendant une saisie incomplète', () => {
  it.each([NaN, Infinity, -1])('une durée %s ne devient ni zéro ni un total annoncé', invalid => {
    const input = recipe();
    input.mash!.steps[0].durationMin = invalid;
    const original = structuredClone(input);
    const plan = recipeThermalPlan(input);
    expect(plan.rows[0].durationMin).toBeUndefined();
    expect(plan.holdMin).toBeUndefined();
    expect(plan.incomplete).toBe(true);
    expect(plan.canConsiderSkipping).toBe(false);
    expect(plan.beforeFiltrationSavedMin).toBeUndefined();
    expect(withoutMashout(input)).toBe(input);
    expect(input).toEqual(original);
  });

  it.each([NaN, Infinity, -1, 101])('une température %s interdit une montée chiffrée et la comparaison du mash-out', invalid => {
    const input = recipe();
    input.mash!.steps[0].tempC = invalid;
    const plan = recipeThermalPlan(input);
    expect(plan.rows[0].tempC).toBeUndefined();
    expect(plan.rows[1].fromC).toBeUndefined();
    expect(plan.rows[1].rampMin).toBeUndefined();
    expect(plan.rampMin).toBeUndefined();
    expect(plan.canConsiderSkipping).toBe(false);
    // The written holds remain known, independently of the missing temperature.
    expect(plan.holdMin).toBe(70);
  });

  it('une durée nulle explicite reste connue et une correction rétablit la montée', () => {
    const input = recipe();
    input.mash!.steps[1].durationMin = 0;
    input.mash!.steps[0].tempC = NaN;
    expect(recipeThermalPlan(input).rampMin).toBeUndefined();
    input.mash!.steps[0].tempC = 67;
    const plan = recipeThermalPlan(input);
    expect(plan.holdMin).toBe(60);
    expect(plan.rampMin).toBe(40);
    expect(plan.rows[1].durationMin).toBe(0);
    expect(plan.beforeFiltrationSavedMin).toBe(40);
    expect(plan.incomplete).toBe(false);
  });

  it('un dépassement numérique ne fabrique pas une durée infinie', () => {
    const input = recipe();
    input.mash!.steps.forEach(step => { step.durationMin = Number.MAX_VALUE; });
    input.mash!.heatingRateCPerMin = Number.MIN_VALUE;
    const plan = recipeThermalPlan(input);
    expect(plan.holdMin).toBeUndefined();
    expect(plan.rampMin).toBeUndefined();
    expect(plan.beforeFiltrationSavedMin).toBeUndefined();
    expect(plan.canConsiderSkipping).toBe(false);
  });
});
