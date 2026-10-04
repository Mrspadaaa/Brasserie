import { describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { Recipe, RecipeSnapshot } from '../../src/types';
import { brewingScenarioCurrentReference } from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55Services } from '../../src/services/hopV55/runtime';
import {
  createHopV55FixtureServices,
  makeHopV55FixtureContext,
  type HopV55FixtureCatalogueDatabaseAdapter,
} from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55ContextSource } from '../../src/services/hopV55/contracts';

function hostContext(recipe: Recipe, extra: Partial<BrewerContext> = {}): BrewerContext {
  return {
    recipe: structuredClone(recipe), hopIndex: { varieties: [], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] },
    inventory: [{ id: `stock-${recipe.id}`, ref: `ref-${recipe.id}`, name: `Stock ${recipe.id}`, category: 'Houblon', unit: 'g', currentStock: 25 }],
    stockReservations: { complete: false, batches: [], source: 'localCache' }, material: [], waterSources: [],
    phase: 'Contexte synthétique', now: 1, provenance: [`Source de test ${recipe.id}`], ...structuredClone(extra),
  };
}

function emptyCatalogueDatabase(): HopV55FixtureCatalogueDatabaseAdapter {
  return {
    records: { get: async () => undefined, add: async () => undefined, put: async () => undefined, toArray: async () => [] },
    operations: { get: async () => undefined, add: async () => undefined },
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() {},
  };
}

describe('Ouverture workspace V5.5 par source exacte', () => {
  it('garde le contexte actif sans argument puis demande précisément la recette B au fournisseur', async () => {
    const a = makeHopV55FixtureContext('planning').recipe!;
    a.id = 'recipe-active-a';
    a.name = 'Recette A active';
    const b = structuredClone(a); b.id = 'recipe-workspace-b'; b.name = 'Recette B du workspace';
    const calls: Array<HopV55ContextSource | undefined> = [];
    const provider = vi.fn(async (source?: HopV55ContextSource) => {
      calls.push(source && structuredClone(source));
      if (!source) return hostContext(a);
      if (source.kind === 'recipe' && source.recipeId === b.id) return hostContext(b);
      // Deliberately return A for an unknown request: the runtime must refuse it, never bless the fallback.
      return hostContext(a);
    });
    const services = createHopV55Services({ ownerKey: 'source-open-owner-a', databasePrefix: 'source-open-a', context: provider });
    try {
      expect((await services.loadContext()).recipe?.id).toBe(a.id);
      expect((await services.loadContext(undefined, { kind: 'recipe', recipeId: b.id })).recipe?.id).toBe(b.id);
      await expect(services.loadContext(undefined, { kind: 'recipe', recipeId: 'recipe-absent-c' }))
        .rejects.toThrow(/Recette source « recipe-absent-c » indisponible/i);
      expect(calls).toEqual([undefined, { kind: 'recipe', recipeId: b.id }, { kind: 'recipe', recipeId: 'recipe-absent-c' }]);
      expect((await services.loadContext()).recipe?.id).toBe(a.id);
    } finally { services.close(); }
  });

  it('exige une source concordante pour les contexts statiques et efface la bière active en exploration explicite', async () => {
    const recipe = makeHopV55FixtureContext('planning').recipe!;
    recipe.id = 'recipe-static-source';
    const staticServices = createHopV55Services({ ownerKey: 'source-open-static', databasePrefix: 'source-open-static', context: hostContext(recipe) });
    const explorationServices = createHopV55Services({ ownerKey: 'source-open-exploration', databasePrefix: 'source-open-exploration',
      context: hostContext(recipe, { workspace: { screen: 'recipe', records: { recipes: [{ id: recipe.id, name: recipe.name }] }, truncated: [] }, editableTargets: ['recipe'] }) });
    try {
      await expect(staticServices.loadContext(undefined, { kind: 'recipe', recipeId: 'recipe-other' }))
        .rejects.toThrow(/Recette source « recipe-other » indisponible/i);
      const exploration = await explorationServices.loadContext(undefined, { kind: 'exploration' });
      expect(exploration.recipe).toBeUndefined();
      expect(exploration.batch).toBeUndefined();
      expect(exploration.journal).toBeUndefined();
      expect(exploration.inventory[0].ref).toBe('ref-recipe-static-source');
      expect(exploration.workspace).toBeUndefined();
      expect(exploration.editableTargets).toBeUndefined();
      expect(exploration.provenance.join(' ')).not.toContain('recipe-static-source');
      await expect(staticServices.loadContext(recipe, { kind: 'exploration' })).rejects.toThrow(/recette détachée exige une source recette explicite/i);
    } finally { staticServices.close(); explorationServices.close(); }
  });

  it('utilise le snapshot et journal du batch exact; un autre batch ou une copie après lancement sont refusés', async () => {
    const batchRecipe = makeHopV55FixtureContext('fermenting').recipe!;
    const snapshot = { ...structuredClone(batchRecipe), sourceRecipeId: batchRecipe.id,
      capturedAt: '2026-10-01T09:00:00.000Z' } as RecipeSnapshot;
    delete (snapshot as Partial<Recipe>).id;
    const journal = { revision: 7, additions: { 'hop-0': { amount: 18.75, unit: 'g', doneAt: 1_790_000_000_000 } } };
    const batch = { id: 'batch-source-b', status: 'fermentation', recipeSnapshot: snapshot, brewDay: { revision: 6 } };
    const context = hostContext(batchRecipe, { batch, journal });
    const services = createHopV55Services({ ownerKey: 'source-open-batch', databasePrefix: 'source-open-batch', context });
    try {
      const opened = await services.loadContext(undefined, { kind: 'batch', batchId: batch.id });
      expect(opened.batch?.id).toBe(batch.id);
      expect(opened.recipe).toEqual(snapshot);
      expect(opened.journal).toEqual(journal);
      await expect(services.loadContext(undefined, { kind: 'batch', batchId: 'batch-other' }))
        .rejects.toThrow(/Brassin source « batch-other » indisponible/i);
      const detached = structuredClone(batchRecipe); detached.id = 'detached-future-recipe';
      await expect(services.loadContext(detached, { kind: 'batch', batchId: batch.id })).rejects.toThrow(/déjà commencé/i);
    } finally { services.close(); }
  });

  it('fixture résout seulement ses IDs/namespace, conserve le snapshot exact et expose une exploration au passé inconnu', async () => {
    const references = async () => ({ varieties: [], knowledge: [] });
    const planning = createHopV55FixtureServices('source-opening-planning', {
      mode: 'planning', catalogueDatabase: emptyCatalogueDatabase(), loadReferences: references,
    });
    const fermenting = createHopV55FixtureServices('source-opening-fermenting', {
      mode: 'fermenting', catalogueDatabase: emptyCatalogueDatabase(), loadReferences: references,
    });
    const unknown = createHopV55FixtureServices('source-opening-unknown', {
      mode: 'unknown', catalogueDatabase: emptyCatalogueDatabase(), loadReferences: references,
    });
    try {
      const planningContext = await planning.loadContext();
      const recipeId = planningContext.recipe!.id;
      const exactRecipe = await planning.loadContext(undefined, { kind: 'recipe', recipeId });
      expect(exactRecipe.recipe?.id).toBe(recipeId);
      const copy = structuredClone(planningContext.recipe!); copy.id = 'fixture-detached-future-recipe';
      expect((await planning.loadContext(copy, { kind: 'recipe', recipeId })).recipe?.id).toBe(copy.id);
      await expect(planning.loadContext(undefined, { kind: 'recipe', recipeId: 'host-recipe-from-another-namespace' }))
        .rejects.toThrow(/absente du mode et namespace/i);

      const batchContext = await fermenting.loadContext();
      const exactBatch = await fermenting.loadContext(undefined, { kind: 'batch', batchId: batchContext.batch!.id });
      expect(batchContext.recipe).toEqual(batchContext.batch!.recipeSnapshot);
      expect(exactBatch.batch?.id).toBe(batchContext.batch!.id);
      expect(exactBatch.recipe).toEqual(batchContext.batch!.recipeSnapshot);
      expect(exactBatch.journal).toEqual(batchContext.journal);
      const defaultCurrent = prepareBrewingScenarioContext(batchContext).runtime.current;
      const explicitBatchCurrent = prepareBrewingScenarioContext(exactBatch).runtime.current;
      expect(defaultCurrent).toBeDefined(); expect(explicitBatchCurrent).toBeDefined();
      expect(brewingScenarioCurrentReference(defaultCurrent!)).toBe(brewingScenarioCurrentReference(explicitBatchCurrent!));
      const sourceRecipeId = batchContext.batch!.recipeRef!;
      const exactSourceRecipe = await fermenting.loadContext(undefined, { kind: 'recipe', recipeId: sourceRecipeId });
      expect(exactSourceRecipe.recipe?.id).toBe(sourceRecipeId);
      expect(exactSourceRecipe.batch).toBeUndefined();
      expect(exactSourceRecipe.journal).toBeUndefined();
      await expect(fermenting.loadContext(undefined, { kind: 'batch', batchId: 'batch-from-other-namespace' }))
        .rejects.toThrow(/absent du mode et namespace/i);
      await expect(fermenting.loadContext(copy, { kind: 'batch', batchId: batchContext.batch!.id }))
        .rejects.toThrow(/déjà commencé/i);

      const exploration = await unknown.loadContext(undefined, { kind: 'exploration' });
      expect(exploration.recipe).toBeUndefined();
      expect(exploration.batch).toBeUndefined();
      expect(exploration.journal).toBeUndefined();
      await expect(unknown.loadContext(undefined, { kind: 'recipe', recipeId }))
        .rejects.toThrow(/absente du mode et namespace/i);
    } finally {
      planning.close(); fermenting.close(); unknown.close();
    }
  });
});
