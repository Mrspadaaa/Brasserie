import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { Batch, Recipe } from '../../src/types';
import {
  DEFAULT_CATALOG_FILTERS,
  batchEntries,
  catalogDate,
  countGroups,
  filterCatalog,
  measuredProduction,
  recipeEntries
} from '../../src/domain/productionCatalog';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';

const recipe = (id: string, patch: Partial<Recipe> = {}): Recipe => ({
  ...structuredClone(fullRecipe),
  id,
  name: id,
  style: 'IPA',
  brewDate: '08.09.2026',
  ...patch
});
const first = recipe('R1', {
  hops: [{ name: 'Citra', weightG: 100, stage: 'dryHop', alpha: 12 }],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' },
  abvTarget: 6,
  ibuTarget: 35
});
const second = recipe('R2', {
  name: 'Écume',
  style: 'Stout',
  brewDate: '01.08.2026',
  abvTarget: 4,
  volumeL: 40,
  hops: [{ name: 'Fuggle', weightG: 30, stage: 'boil', timeMin: 60, alpha: 5 }]
});
const batch = (id: string, patch: Partial<Batch> = {}): Batch => ({
  id,
  name: id,
  style: 'IPA',
  status: 'planifie',
  volumeL: 24,
  brewDate: '08.09.2026',
  ...patch
});
const now = new Date(2026, 8, 8, 12).getTime();
const entries = () => recipeEntries([first, second], [batch('LOT-1', { recipeRef: 'R1' })]);
const apply = (patch = {}, items = entries()) =>
  filterCatalog(items, { ...DEFAULT_CATALOG_FILTERS, ...patch }, 'this-month', now);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Business filters and honest production summaries', () => {
  it('searches accents, ingredient names and multiple words together', () => {
    expect(apply({ search: 'ecume fuggle' }).map((e) => e.id)).toEqual(['R2']);
    expect(apply({ search: 'IPA citra us-05' }).map((e) => e.id)).toEqual(['R1']);
  });
  it('combines exact hop, style, yeast, volume and ABV criteria', () => {
    expect(
      apply({ hop: 'Citra', style: 'IPA', yeast: 'US-05', abvMin: '5,5', volumeMax: '100' }).map(
        (e) => e.id
      )
    ).toEqual(['R1']);
    expect(apply({ hop: 'Citra', style: 'Stout' })).toEqual([]);
    expect(apply({ abvMin: '7', abvMax: '3' })).toEqual([]);
    expect(apply({ abvMin: 'invalide' })).toEqual([]);
    expect(apply({ ibuMin: '36' })).toHaveLength(0);
    expect(apply({ ibuMin: '35', ibuMax: '35' })).toHaveLength(1);
  });
  it('does not silently widen an empty period back to the full catalog', () => {
    expect(apply({ period: 'custom', from: '2027-01-01', to: '2027-01-31' })).toEqual([]);
    expect(apply({ period: 'global' }).map((e) => e.id)).toEqual(['R1']);
  });
  it('includes both custom-date endpoints and excludes missing or impossible dates', () => {
    expect(apply({ period: 'custom', from: '2026-08-01', to: '2026-09-08' })).toHaveLength(2);
    const unknown = recipeEntries(
      [recipe('bad', { brewDate: '31.02.2026' }), recipe('missing', { brewDate: undefined })],
      []
    );
    expect(apply({ period: '30' }, unknown)).toEqual([]);
    expect(apply({ period: 'global' }, unknown)).toEqual([]);
    expect(catalogDate('31.02.2026')).toBeUndefined();
    expect(catalogDate('08.09.2026')).toBe(catalogDate('2026-09-08'));
  });
  it('never reads changed recipe ingredients into an existing lot', () => {
    const frozen = captureSnapshot(first);
    const lot = batchEntries([batch('LOT', { recipeSnapshot: frozen, recipeRef: first.id })]);
    const changed = recipeEntries([{ ...first, hops: second.hops }], []);
    expect(apply({ hop: 'Citra' }, lot)).toHaveLength(1);
    expect(apply({ hop: 'Fuggle' }, lot)).toHaveLength(0);
    expect(apply({ hop: 'Fuggle' }, changed)).toHaveLength(1);
  });
  it('knows recipe usage through reference, snapshot or legacy reverse reference', () => {
    const recipes = [first, second, recipe('R3', { batchRef: 'L3' })];
    const list = recipeEntries(recipes, [
      batch('L1', { recipeSnapshot: captureSnapshot(first) }),
      batch('L3')
    ]);
    expect(
      apply({ use: 'brewed' }, list)
        .map((e) => e.id)
        .sort()
    ).toEqual(['R1', 'R3']);
    expect(apply({ use: 'unbrewed' }, list).map((e) => e.id)).toEqual(['R2']);
  });
  it('selects the latest family version without hiding older versions by default', () => {
    const list = recipeEntries(
      [
        first,
        recipe('V2', { version: 2, parentRecipeId: 'R1' }),
        recipe('V3', { version: 3, parentRecipeId: 'V2' }),
        second
      ],
      []
    );
    expect(apply({}, list)).toHaveLength(4);
    expect(
      apply({ versions: 'latest' }, list)
        .map((e) => e.id)
        .sort()
    ).toEqual(['R2', 'V3']);
  });
  it('sorts numeric values and dates correctly, keeping missing values last', () => {
    expect(apply({ sort: 'abv' }).map((e) => e.id)).toEqual(['R1', 'R2']);
    expect(apply({ sort: 'oldest' }).map((e) => e.id)).toEqual(['R2', 'R1']);
    const lots = batchEntries([
      batch('unknown'),
      batch('low', { abv: '4,2' }),
      batch('high', { abv: '10.1' })
    ]);
    expect(apply({ sort: 'abv' }, lots).map((e) => e.id)).toEqual(['high', 'low', 'unknown']);
    expect(apply({ abvMax: '5' }, lots).map((e) => e.id)).toEqual(['low']);
  });
  it('does not invent ABV or fermentation data for an unmeasured lot', () => {
    expect(batchEntries([batch('unknown')])[0].abv).toBeUndefined();
    expect(batchEntries([batch('valid', { og: '1,050', fg: '1,010' })])[0].abv).toBeCloseTo(5.3, 1);
  });
  it('groups only actual measured production and excludes cancelled lots and planned litres', () => {
    const lots = batchEntries([
      batch('planned', { volumeL: 300 }),
      batch('real', { status: 'conditionne', volumeBrewedL: 25, volumePackagedL: 22 }),
      batch('cancelled', { status: 'annule', volumeBrewedL: 70 }),
      batch('undated', { brewDate: '', volumeBrewedL: 12 })
    ]);
    expect(measuredProduction(lots)).toEqual({
      brewed: 37,
      packaged: 22,
      measured: 2,
      undated: 1,
      months: [{ month: '2026-09', brewed: 25, packaged: 22 }]
    });
  });
  it('counts one hop occurrence per recipe even with several additions', () => {
    const list = recipeEntries([{ ...first, hops: [...first.hops, ...first.hops] }, second], []);
    expect(countGroups(list, 'hops')).toEqual([
      { name: 'Citra', count: 1 },
      { name: 'Fuggle', count: 1 }
    ]);
    expect(countGroups(apply({ style: 'IPA' }, list), 'style')).toEqual([
      { name: 'IPA', count: 1 }
    ]);
  });
  it('does not count missing styles and groups spelling case consistently', () => {
    const list = recipeEntries(
      [
        first,
        { ...first, id: 'lowercase', style: 'ipa', hops: [{ ...first.hops[0], name: 'citra' }] },
        { ...second, style: '' }
      ],
      []
    );
    expect(countGroups(list, 'style')).toEqual([{ name: 'IPA', count: 2 }]);
    expect(countGroups(list, 'hops')[0]).toEqual({ name: 'Citra', count: 2 });
  });
});
