import { describe, it, expect } from 'vitest';
import type { Batch, Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import {
  batchEntries,
  DEFAULT_CATALOG_FILTERS,
  filterCatalog
} from '../../src/domain/productionCatalog';
import {
  batchNextAction,
  batchOutcome,
  daysSinceBrew,
  missingBatchMeasurements,
  packagingBalance,
  recipeSignature
} from '../../src/domain/productionInsights';

const recipe: Recipe = {
  ...fullRecipe,
  volumeL: 20,
  ogTarget: 1.065,
  fgTarget: 1.014,
  abvTarget: 6.7,
  hops: [{ name: 'Citra', weightG: 100, alpha: 12, stage: 'dryHop', dayOffset: 3 }]
};
const batch = (patch: Partial<Batch> = {}): Batch => ({
  id: 'LOT',
  name: 'Essai',
  style: 'IPA',
  volumeL: 20,
  brewDate: '05.09.2026',
  status: 'fermentation',
  recipeSnapshot: captureSnapshot(recipe),
  ...patch
});
const entry = (patch: Partial<Batch> = {}) => batchEntries([batch(patch)])[0];

describe('Brewer outcomes and useful actions', () => {
  it('compares real gravity with the frozen target in gravity points', () => {
    const result = batchOutcome(entry({ og: '1,060' }), 'og');
    expect(result).toMatchObject({ actual: 1.06, target: 1.065, delta: -5 });
    expect(batchOutcome(entry({ fg: '1.014' }), 'fg')?.delta).toBe(0);
    expect(batchOutcome(entry({ volumeBrewedL: 18 }), 'volume')?.delta).toBe(-2);
  });
  it('never substitutes a live recipe, an absent measurement, or a planned number', () => {
    expect(batchOutcome(entry({ recipeSnapshot: undefined, og: '1.060' }), 'og')).toBeUndefined();
    expect(batchOutcome(entry(), 'og')).toBeUndefined();
    expect(batchOutcome(entry({ status: 'planifie', og: '1.060' }), 'og')).toBeUndefined();
    expect(batchOutcome(entry({ status: 'annule', og: '1.060' }), 'og')).toBeUndefined();
    expect(batchOutcome(entry({ og: '0' }), 'og')).toBeUndefined();
  });
  it('includes a measured zero and uses weighted pairs rather than pipeline totals for packaging', () => {
    const entries = batchEntries([
      batch({ id: 'A', status: 'conditionne', volumeBrewedL: 100, volumePackagedL: 90 }),
      batch({ id: 'B', status: 'termine', volumeBrewedL: 20, volumePackagedL: 10 }),
      batch({ id: 'C', status: 'fermentation', volumeBrewedL: 500 }),
      batch({ id: 'D', status: 'conditionne', volumePackagedL: 50 }),
      batch({ id: 'E', status: 'annule', volumeBrewedL: 100, volumePackagedL: 100 })
    ]);
    expect(packagingBalance(entries)).toMatchObject({
      count: 2,
      brewed: 120,
      packaged: 100,
      difference: 20
    });
    expect(packagingBalance(entries).pct).toBeCloseTo(83.333333, 5);
    expect(
      packagingBalance([entry({ status: 'termine', volumeBrewedL: 20, volumePackagedL: 0 })]).pct
    ).toBe(0);
    expect(packagingBalance([]).pct).toBeUndefined();
  });
  it('only requests final gravity for packaged lots, never infers completion from time or SG', () => {
    expect(missingBatchMeasurements(batch({ status: 'planifie' }))).toEqual([]);
    expect(missingBatchMeasurements(batch({ og: '1.060' }))).toEqual([]);
    expect(missingBatchMeasurements(batch({ status: 'conditionne', og: '1.060' }))).toEqual(['FG']);
    expect(missingBatchMeasurements(batch({ status: 'annule' }))).toEqual([]);
    expect(batchNextAction(batch({ og: '1.060', fg: '1.010' }))).toEqual({
      label: 'Voir les mesures',
      section: 'measurements'
    });
  });
  it('opens tasting for packaged lots and never sends them to a brew-day timer', () => {
    expect(batchNextAction(batch({ status: 'conditionne', og: '1.060', fg: '1.014' }))).toEqual({
      label: 'Noter la dégustation',
      section: 'tasting'
    });
    expect(
      batchNextAction(
        batch({
          status: 'termine',
          og: '1.060',
          fg: '1.014',
          notesTasting: 'Plus sec au prochain essai.'
        })
      ).section
    ).toBe('tasting');
    expect(batchNextAction(batch({ status: 'annule' })).brew).toBeUndefined();
    expect(batchNextAction(batch({ status: 'planifie' })).brew).toBe(true);
  });
  it('counts local calendar days and preserves invalid and future dates', () => {
    const now = new Date(2026, 8, 8, 9).getTime();
    expect(daysSinceBrew(batch(), now)).toBe(3);
    expect(daysSinceBrew(batch({ brewDate: '09.09.2026' }), now)).toBe(-1);
    expect(daysSinceBrew(batch({ brewDate: '31.02.2026' }), now)).toBeUndefined();
  });
  it('puts ongoing work first and schedules upcoming planned batches chronologically', () => {
    const entries = batchEntries([
      batch({ id: 'done', status: 'termine' }),
      batch({ id: 'later', status: 'planifie', brewDate: '12.09.2026' }),
      batch({ id: 'active', status: 'fermentation' }),
      batch({ id: 'sooner', status: 'planifie', brewDate: '09.09.2026' }),
      batch({ id: 'undated', status: 'planifie', brewDate: '' }),
      batch({
        id: 'brewing',
        status: 'planifie',
        brewDay: { startedAt: 10, steps: [], currentIndex: 0 }
      })
    ]);
    expect(
      filterCatalog(entries, { ...DEFAULT_CATALOG_FILTERS, sort: 'work' }, 'all').map((e) => e.id)
    ).toEqual(['brewing', 'active', 'sooner', 'later', 'undated', 'done']);
  });
});

describe('Recipe comparisons independent of batch size', () => {
  it('compares grain percentages without lactose, sugars, or fruit in the denominator', () => {
    const signature = recipeSignature({
      ...recipe,
      fermentables: [
        { name: 'Pils', kind: 'grain', weightKg: 4.5 },
        { name: 'Cara', kind: 'grain', weightKg: 0.5 },
        { name: 'Sucre', kind: 'sugar', weightKg: 1 },
        { name: 'Lactose', kind: 'lactose', weightKg: 0.5 },
        { name: 'Mangue', kind: 'fruit', weightKg: 2 }
      ]
    });
    expect(signature.grainKg).toBe(5);
    expect(signature.grain.map((g) => g.pct)).toEqual([90, 10]);
    expect(signature.otherFermentables.map((f) => f.gramsPerL)).toEqual([50, 25, 100]);
  });
  it('preserves dose per litre when a recipe is scaled', () => {
    const first = recipeSignature(recipe),
      doubled = recipeSignature({
        ...recipe,
        volumeL: 40,
        hops: recipe.hops.map((h) => ({ ...h, weightG: h.weightG * 2 }))
      });
    expect(first.dryHopPerL).toBe(5);
    expect(doubled.dryHopPerL).toBe(first.dryHopPerL);
    expect(doubled.hops[0].gramsPerL).toBe(first.hops[0].gramsPerL);
  });
  it('distinguishes dosing schedules and retains duplicate additions at the same moment', () => {
    const signature = recipeSignature({
      ...recipe,
      hops: [
        { name: 'Citra', weightG: 50, stage: 'dryHop', dayOffset: 3, alpha: 12 },
        { name: 'citra', weightG: 50, stage: 'dryHop', dayOffset: 3, alpha: 12 },
        { name: 'Citra', weightG: 40, stage: 'dryHop', dayOffset: 7, alpha: 12 },
        { name: 'Citra', weightG: 10, stage: 'boil', timeMin: 60, alpha: 12 }
      ]
    });
    expect(signature.hops).toHaveLength(3);
    expect(signature.hops.map((h) => [h.detail, h.gramsPerL])).toEqual([
      ['J+3', 5],
      ['J+7', 2],
      ['60 min', 0.5]
    ]);
    expect(signature.dryHopPerL).toBe(7);
  });
  it('does not divide by zero or invent grain percentages', () => {
    expect(recipeSignature({ ...recipe, volumeL: 0 }).dryHopPerL).toBeUndefined();
    expect(recipeSignature({ ...recipe, volumeL: NaN }).hops[0].gramsPerL).toBeUndefined();
    expect(recipeSignature({ ...recipe, fermentables: [] }).grain).toEqual([]);
  });
});
