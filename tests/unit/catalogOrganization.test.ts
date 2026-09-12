import { describe, expect, it, vi, afterEach } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Batch } from '../../src/types';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import {
  batchEntries,
  recipeEntries,
  filterCatalog,
  measuredProduction,
  DEFAULT_CATALOG_FILTERS
} from '../../src/domain/productionCatalog';
import { restoreCatalogFilters, catalogCriteria } from '../../src/domain/catalogPreferences';
import { writeCatalogOrganization } from '../../src/services/catalogOrganization';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { BrewingMath } from '../../src/services/brewingMath';

const stamp = '2026-09-08T12:00:00.000Z';
const recipe = { ...fullRecipe, id: 'R1', favorite: true };
const archived = {
  ...recipe,
  id: 'R2',
  version: 2,
  parentRecipeId: 'R1',
  archivedAt: stamp
};
const lot: Batch = {
  id: 'LOT1',
  name: 'IPA',
  style: 'IPA',
  status: 'conditionne',
  volumeL: 24,
  volumeBrewedL: 23,
  volumePackagedL: 20,
  brewDate: '08.09.2026',
  recipeRef: 'R1',
  recipeSnapshot: captureSnapshot(recipe),
  og: '1.060',
  fg: '1.012',
  abv: '6.3',
  favorite: true
};
afterEach(() => vi.restoreAllMocks());

describe('Catalog organization and historical integrity', () => {
  it('excludes archived favorites from current lists and selects them only through an explicit scope', () => {
    const entries = recipeEntries([recipe, archived], []);
    const apply = (patch = {}) =>
      filterCatalog(entries, { ...DEFAULT_CATALOG_FILTERS, favoritesOnly: true, ...patch }, 'all');
    expect(apply().map((e) => e.id)).toEqual(['R1']);
    expect(apply({ folder: 'archived' }).map((e) => e.id)).toEqual(['R2']);
    expect(apply({ folder: 'all' })).toHaveLength(2);
    expect(apply({ versions: 'latest' }).map((e) => e.id)).toEqual(['R1']);
    expect(apply({ versions: 'latest', folder: 'all' }).map((e) => e.id)).toEqual(['R2']);
  });
  it('combines batch favorites and advancement without confusing the recipe star with the lot star', () => {
    const entries = batchEntries([
      lot,
      { ...lot, id: 'plain', favorite: false },
      { ...lot, id: 'old', archivedAt: stamp }
    ]);
    expect(
      filterCatalog(
        entries,
        {
          ...DEFAULT_CATALOG_FILTERS,
          favoritesOnly: true,
          status: 'conditionne'
        },
        'all'
      ).map((e) => e.id)
    ).toEqual(['LOT1']);
    expect(
      filterCatalog(
        entries,
        { ...DEFAULT_CATALOG_FILTERS, favoritesOnly: true, status: 'active' },
        'all'
      )
    ).toEqual([]);
  });
  it('preserves the complete production and tax history after archiving, with the same recipe linkage', () => {
    const after = { ...lot, archivedAt: stamp };
    expect(measuredProduction(batchEntries([after]))).toEqual(
      measuredProduction(batchEntries([lot]))
    );
    expect(BrewingMath.calculateSwissBeerTax([after])).toEqual(
      BrewingMath.calculateSwissBeerTax([lot])
    );
    expect(recipeEntries([recipe], [after])[0].linkedBatches).toEqual([after]);
    const snapshot = captureSnapshot(archived);
    expect(snapshot).not.toHaveProperty('archivedAt');
    expect(snapshot).not.toHaveProperty('favorite');
  });
  it('restores and sanitizes persisted filters, migrating the previous favorite-only filter', () => {
    expect(
      restoreCatalogFilters('recipes', {
        use: 'favorite',
        search: 'Citra',
        folder: 'archived',
        sort: 'volume'
      })
    ).toMatchObject({
      use: 'all',
      favoritesOnly: true,
      search: 'Citra',
      folder: 'archived',
      sort: 'volume'
    });
    expect(
      restoreCatalogFilters('batches', {
        folder: 'bogus',
        favoritesOnly: 'true',
        search: null,
        versions: 'latest',
        use: 'brewed'
      })
    ).toMatchObject({
      folder: 'current',
      favoritesOnly: false,
      search: '',
      use: 'all',
      versions: 'all'
    });
    expect(restoreCatalogFilters('recipes', null)).toMatchObject({
      folder: 'current',
      period: 'all'
    });
  });
  it('counts search, quick filters, work and favorites in the visible filter summary', () => {
    const criteria = catalogCriteria(
      {
        ...DEFAULT_CATALOG_FILTERS,
        search: 'Citra',
        status: 'active',
        favoritesOnly: true,
        abvMax: '6',
        period: 'global'
      },
      'measurements',
      'this-month'
    );
    expect(criteria.map((c) => c.id)).toEqual([
      'search',
      'abvMax',
      'favorite',
      'status',
      'work',
      'period'
    ]);
    expect(criteria.every((c) => c.clear || c.clearWork)).toBe(true);
  });
  it('writes only organization fields to the existing document, preserving snapshot, brew journal, status and stock', () => {
    const data: Record<string, any[]> = {
      recipes: [{ ...recipe, __docId: 'actual-recipe-doc' }],
      batches: [{ ...lot, brewDay: { revision: 3, startedAt: stamp }, __docId: 'LOT1' }]
    };
    vi.spyOn(FirestoreRepo, 'all').mockImplementation((collection: any) => data[collection] ?? []);
    const put = vi
      .spyOn(FirestoreRepo, 'put')
      .mockImplementation((collection, id, patch, options) => {
        expect(options).toEqual({ merge: true });
        const previous = data[collection].find((r) => r.__docId === id);
        Object.assign(previous, patch);
      });
    vi.spyOn(StorageService, 'logAction').mockImplementation(() => {});
    const originalLot = structuredClone(data.batches[0]);
    expect(StorageService.setCatalogArchived('recipe', 'R1', true)).toBe(true);
    expect(put.mock.calls[0][1]).toBe('actual-recipe-doc');
    expect(Object.keys(put.mock.calls[0][2])).toEqual(['archivedAt']);
    expect(data.batches[0]).toEqual(originalLot);
    expect(StorageService.setCatalogFavorite('batch', 'LOT1', false)).toBe(true);
    expect(StorageService.setCatalogArchived('batch', 'LOT1', true)).toBe(true);
    expect(StorageService.setCatalogArchived('batch', 'LOT1', false)).toBe(true);
    expect(data.batches[0]).toEqual({
      ...originalLot,
      favorite: false,
      archivedAt: null
    });
    expect(data.recipes[0].hops).toEqual(recipe.hops);
    expect(writeCatalogOrganization('batch', 'missing', { favorite: true })).toBeUndefined();
    expect(put).toHaveBeenCalledTimes(4);
  });
});
