import { describe, expect, it } from 'vitest';
import { calculateWaterTreatment, DEFAULT_WATER_SOURCE, SALT_IDS } from '../../src/domain/water';
import { describeSolveIssue, describeTreatmentIssues, type SolveIssue } from '../../src/domain/water/solverMessages';
import { recipeWaterCalculation, replanRecipeWater } from '../../src/domain/recipeWater';
import { recipe } from '../fixtures/brewCompanion';

const band = { min: -52, max: 8, label: 'Pale', hint: '' };
const input = { diRatioPct: 0, mashWaterL: 20, spargeWaterL: 10, doses: {}, acidId: 'lactique' as const };
const highAlkalinity: SolveIssue = { code: 'alkalinity-high', value: 136, min: band.min, max: band.max };

describe('Solver warnings describe the retained treatment', () => {
  it('removes the alkalinity warning after acid resolves it while retaining unrelated limitations', () => {
    const treatment = calculateWaterTreatment({ ...DEFAULT_WATER_SOURCE, na: 120 }, input, band);
    const sodium: SolveIssue = { code: 'high', ion: 'na', value: 120, max: 50, source: 120 };
    const sulfate: SolveIssue = { code: 'low', ion: 'so4', value: 28, target: 100 };
    const messages = describeTreatmentIssues([highAlkalinity, sodium, sulfate, { code: 'iteration' }], treatment, band);
    expect(treatment.mashAcid.amount).toBeGreaterThan(0);
    expect(treatment.raAfter).toBeLessThanOrEqual(band.max);
    expect(messages).toEqual([
      describeSolveIssue(sodium), describeSolveIssue(sulfate), describeSolveIssue({ code: 'iteration' })
    ]);
  });

  it.each([0, 1])('keeps a real remaining alkalinity warning with the actual value for manual acid %s mL', (mash) => {
    const treatment = calculateWaterTreatment(DEFAULT_WATER_SOURCE,
      { ...input, acidOverride: { mash } }, band);
    const messages = describeTreatmentIssues([{ ...highAlkalinity, value: 999 }], treatment, band);
    expect(treatment.mashAcid.amount).toBe(mash);
    expect(messages).toEqual([describeSolveIssue({ ...highAlkalinity, value: treatment.raAfter })]);
    expect(messages[0]).not.toContain('999');
  });

  it('uses the actual bicarbonate result instead of the pre-acid solver warning', () => {
    const targetBand = { ...band, min: -30, max: 60 };
    const source = { ...DEFAULT_WATER_SOURCE, ca: 50, mg: 5 };
    const resolved = calculateWaterTreatment(source,
      { ...input, hco3Target: 80, acidOverride: { sparge: 1 } }, targetBand);
    const bicarbonate: SolveIssue = { code: 'bicarbonate-target', value: 0, target: 80, limitedByAlkalinity: true };
    expect(resolved.hco3Target!.reached).toBe(true);
    expect(describeTreatmentIssues([bicarbonate], resolved, targetBand)).toEqual([]);

    const manual = calculateWaterTreatment(source,
      { ...input, hco3Target: 80, acidOverride: { mash: 0, sparge: 1 } }, targetBand);
    expect(manual.hco3Target!.reason).toBe('manual-acid');
    expect(describeTreatmentIssues([bicarbonate], manual, targetBand)).toEqual([manual.hco3Target!.message]);
    // A manual dose can introduce an error even when the original salt fit had none.
    expect(describeTreatmentIssues([], manual, targetBand)).toEqual([manual.hco3Target!.message]);
    expect(describeTreatmentIssues([bicarbonate], manual, targetBand, { includeBicarbonateTarget: false }))
      .toEqual([]);
  });

  it('recipe replanning removes a resolved acid instruction and keeps it when a manual zero blocks treatment', () => {
    const r = recipe();
    r.waterPlan = { ...r.waterPlan!, sourceSnapshot: DEFAULT_WATER_SOURCE,
      sourceId: DEFAULT_WATER_SOURCE.id, targetProfileId: '18B', disabled: SALT_IDS,
      acidOverride: undefined, acid: { id: 'lactique', mash: 0, sparge: 0 } };
    const automatic = replanRecipeWater(r);
    expect(automatic.plan.acid!.mash).toBeGreaterThan(0);
    expect(automatic.warnings.some(message => message.startsWith('Alcalinité résiduelle à'))).toBe(false);

    r.waterPlan.acidOverride = { mash: 0 };
    const manual = replanRecipeWater(r);
    const { band: actualBand } = recipeWaterCalculation(r);
    const actual = calculateWaterTreatment(DEFAULT_WATER_SOURCE,
      { ...input, acidOverride: { mash: 0 } }, actualBand);
    expect(manual.plan.acid!.mash).toBe(0);
    expect(manual.warnings).toContainEqual(expect.stringContaining(`Alcalinité résiduelle à ${Math.round(actual.raAfter)} ppm`));
    expect(manual.warnings).toContainEqual(expect.stringContaining('Le profil HCO₃ choisi est conservé'));
    expect(manual.warnings.join(' ')).not.toContain('À traiter à l’acide, pas au sel.');
  });
});
