import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { Batch, HopIngredient, Recipe } from '../../src/types';
import type { BrewingScenarioResult } from '../../src/domain/brewingScenario';
import type { HopV55ReadyPreview } from '../../src/services/hopV55/application';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { StorageService } from '../../src/services/storage';
import { createHopV55RecipeDraftContextSource, hopV55RecipeDraftIdentityError,
  type HopV55RecipeStepStorage } from '../../src/services/hopV55/recipeStepContext';
import { HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, appendHopV55RecipeApplication, applyHopV55RecipeDraftApplication,
  assertHopV55RecipeDraftApplicationTarget, hopV55RecipeDraftContextError, previewHopV55RecipeDraftApplication,
  hopV55RecipeApplicationValueReference,
  readHopV55RecipeApplication, readHopV55RecipeApplications,
  type HopV55RecipeApplicationRecordV1, type HopV55RecipeDraftApplicationV1 } from '../../src/services/hopV55/recipeDraftApplication';

afterEach(() => { vi.restoreAllMocks(); });

const ownerKey = 'owner:recipe-draft';
const draftId = 'recipe-draft-v55';

/** Wizard draft as built in memory: unsaved name, missing boil time (NaN) and an unknown alpha (0) stay as written. */
function draft(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: draftId, name: 'Pale non enregistrée', style: 'Pale Ale', volumeL: 20, boilMin: Number.NaN,
    fermentables: [{ name: 'Pale', kind: 'grain', weightKg: 4, use: 'mash' }], totalGristKg: 4,
    hops: [{ name: 'Citra', alpha: 0, weightG: 30, stage: 'dryHop' }],
    yeast: { name: 'Levure à choisir' },
    ...overrides,
  } as unknown as Recipe;
}
const finiteDraft = (overrides: Partial<Recipe> = {}) => draft({ boilMin: 60, ...overrides });

function storage(batches: Batch[] = []): HopV55RecipeStepStorage & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    getHopVarieties: () => { calls.push('varieties'); return []; },
    getHopLots: () => { calls.push('lots'); return []; },
    getHopKnowledge: () => { calls.push('knowledge'); return []; },
    getStocks: () => { calls.push('stocks'); return { rawMaterials: [] }; },
    getBatches: () => { calls.push('batches'); return batches; },
  };
}

function sealedRecord(overrides: Partial<Omit<HopV55RecipeApplicationRecordV1, 'reference'>> = {}): HopV55RecipeApplicationRecordV1 {
  const body: Omit<HopV55RecipeApplicationRecordV1, 'reference'> = {
    format: HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, id: 'hop-v55-recipe-application:1', ownerKey, recipeId: draftId,
    workspaceId: 'workspace:1', appliedAt: '2026-10-04T10:00:00.000Z', scenarioId: 'scenario:1', snapshotReference: 'snapshot:1',
    branchId: 'branch:1', branchReference: 'branch-reference:1', copyPreviewReference: 'copy-preview:1',
    recipePreviewReference: 'recipe-preview:1', sourceRecipeReference: hopV55RecipeApplicationValueReference('sourceRecipe', hopDecisionReference(finiteDraft())),
    hopsReference: hopV55RecipeApplicationValueReference('hops', finiteDraft().hops),
    alphaChoices: { 'scenario-hop:1': { value: 9, reason: 'Nominal du sachet prévu, à vérifier sur le lot.' } },
    assumptions: ['Hypothèse de fixture'], conditions: [], ...overrides,
  };
  return { ...body, reference: hopAdviceContentReference(HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, body) };
}

function application(current: Recipe = finiteDraft(),
  hops: HopIngredient[] = [{ name: 'Citra', alpha: 9, weightG: 25, stage: 'firstWort', timeMin: 60 }]): HopV55RecipeDraftApplicationV1 {
  const sourceRecipeReference = hopDecisionReference(current);
  return { identity: { ownerKey, draftId }, sourceRecipeReference, hops,
    record: sealedRecord({ sourceRecipeReference: hopV55RecipeApplicationValueReference('sourceRecipe', sourceRecipeReference), hopsReference: hopV55RecipeApplicationValueReference('hops', hops) }) };
}

describe('contexte V5.5 du brouillon de recette', () => {
  it('exige un profil et un identifiant de brouillon explicites et stables', () => {
    expect(hopV55RecipeDraftIdentityError(undefined, draftId)).toMatch(/profil propriétaire/);
    expect(hopV55RecipeDraftIdentityError('owner/a', draftId)).toMatch(/profil propriétaire/);
    expect(hopV55RecipeDraftIdentityError(' owner', draftId)).toMatch(/profil propriétaire/);
    expect(hopV55RecipeDraftIdentityError(ownerKey, '')).toMatch(/identifiant stable/);
    expect(hopV55RecipeDraftIdentityError(ownerKey, 'a/b')).toMatch(/identifiant stable/);
    expect(hopV55RecipeDraftIdentityError(ownerKey, draftId)).toBeUndefined();
    expect(() => createHopV55RecipeDraftContextSource({ ownerKey: '', draftId, readDraft: () => draft(), storage: storage() }))
      .toThrow(/profil propriétaire/);
  });

  it('rend le brouillon vivant, valeurs manquantes comprises, et jamais la recette enregistrée du même ID', async () => {
    const saved = finiteDraft({ name: 'Version enregistrée', hops: [] });
    const getRecipes = vi.spyOn(StorageService, 'getRecipes').mockReturnValue([saved] as never);
    vi.spyOn(StorageService, 'getHopVarieties').mockReturnValue([] as never);
    vi.spyOn(StorageService, 'getHopLots').mockReturnValue([] as never);
    vi.spyOn(StorageService, 'getHopKnowledge').mockReturnValue([] as never);
    vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [] } as never);
    vi.spyOn(StorageService, 'getBatches').mockReturnValue([] as never);
    let live = draft();
    const source = createHopV55RecipeDraftContextSource({ ownerKey, draftId, readDraft: () => live, now: () => 42 });

    for (const request of [undefined, { kind: 'recipe' as const, recipeId: draftId }]) {
      const context = await source(request);
      const recipe = context.recipe as Recipe;
      expect(recipe).not.toBe(live);
      expect(recipe.name).toBe('Pale non enregistrée');
      expect(recipe.boilMin).toBeNull();
      expect(Number.isNaN(live.boilMin)).toBe(true);
      expect(recipe.hops[0].alpha).toBe(0);
      expect(context.batch).toBeUndefined();
      expect(context.journal).toBeUndefined();
      expect(context.now).toBe(42);
    }
    expect(getRecipes).not.toHaveBeenCalled();

    live = draft({ name: 'Nom modifié ensuite' });
    expect(((await source()).recipe as Recipe).name).toBe('Nom modifié ensuite');
    const returned = await source();
    (returned.recipe as Recipe).hops.push({ name: 'Mosaic', alpha: 12, weightG: 5, stage: 'boil' });
    expect(live.hops).toHaveLength(1);
  });

  it('refuse toute autre recette, tout brassin et toute copie au lieu de les substituer', async () => {
    const launched = { id: 'batch-launched', status: 'fermentation', recipeSnapshot: finiteDraft({ name: 'Snapshot du brassin lancé' }) } as unknown as Batch;
    const stores = storage([launched]);
    let current: Recipe | undefined = draft();
    const source = createHopV55RecipeDraftContextSource({ ownerKey, draftId, readDraft: () => current, storage: stores });

    await expect(source({ kind: 'recipe', recipeId: 'recipe-saved-other' })).rejects.toThrow(/aucune recette enregistrée n’est substituée/);
    await expect(source({ kind: 'batch', batchId: launched.id })).rejects.toThrow(/aucun brassin ni journal n’est substitué/);
    await expect(source({ kind: 'localRecipeCopy', workspaceId: 'w', copyId: 'c', recipeId: draftId, recipeReference: 'r' }))
      .rejects.toThrow(/non prise en charge/);
    current = finiteDraft({ id: 'recipe-other' } as Partial<Recipe>);
    await expect(source()).rejects.toThrow(/ne correspond plus à son identifiant/);
    current = undefined;
    await expect(source({ kind: 'recipe', recipeId: draftId })).rejects.toThrow(/Aucune recette enregistrée n’est substituée/);

    const exploration = await source({ kind: 'exploration' });
    expect(exploration.recipe).toBeUndefined();
    expect(exploration.batch).toBeUndefined();
    // Batches only feed the read-only reservation picture; their snapshots are never rewritten or reused as the draft.
    expect(exploration.stockReservations).toMatchObject({ complete: false, source: 'localCache' });
    expect((exploration.stockReservations as { batches: Array<Record<string, unknown>> }).batches[0]).toMatchObject({ id: launched.id, stockConsumption: null });
    expect(launched.recipeSnapshot.name).toBe('Snapshot du brassin lancé');
  });
});

describe('application V5.5 au brouillon : refus avant tout calcul', () => {
  const context = (recipe: unknown, extra: Partial<BrewerContext> = {}) => ({ recipe, now: 1, phase: 'Brouillon', provenance: [],
    editableTargets: [], ...extra }) as unknown as BrewerContext;

  it('refuse un autre profil, un brassin ou un autre brouillon', () => {
    const identity = { ownerKey, draftId };
    expect(hopV55RecipeDraftContextError(context(finiteDraft()), identity, 'owner:other')).toMatch(/autre profil/);
    expect(hopV55RecipeDraftContextError(context(finiteDraft(), { batch: { id: 'batch-1' } as never }), identity, ownerKey)).toMatch(/brassin/);
    expect(hopV55RecipeDraftContextError(context(finiteDraft({ id: 'recipe-other' } as Partial<Recipe>)), identity, ownerKey)).toMatch(/n’est pas le brouillon ouvert/);
    expect(hopV55RecipeDraftContextError(context(undefined), identity, ownerKey)).toMatch(/n’est pas le brouillon ouvert/);
    expect(hopV55RecipeDraftContextError(context(finiteDraft()), identity, ownerKey)).toBeUndefined();

    expect(previewHopV55RecipeDraftApplication({ identity, servicesOwnerKey: 'owner:other', result: {} as BrewingScenarioResult,
      branchId: 'branch:1', context: context(finiteDraft()) })).toEqual({ status: 'blocked', reason: expect.stringMatching(/autre profil/), recompute: true });
    const newId = vi.fn(() => 'never');
    expect(applyHopV55RecipeDraftApplication({ identity, servicesOwnerKey: ownerKey,
      preview: { sourceRecipeId: 'recipe-other' } as unknown as HopV55ReadyPreview, context: context(finiteDraft()),
      workspaceId: 'workspace:1', appliedAt: '2026-10-04T10:00:00.000Z', newId })).toMatchObject({ status: 'blocked', reason: expect.stringMatching(/autre recette/) });
    expect(newId).not.toHaveBeenCalled();
  });
});

describe('traces scellées de l’application V5.5', () => {
  it('relit une trace courante et refuse une trace altérée, incomplète ou étendue', () => {
    const record = sealedRecord();
    expect(readHopV55RecipeApplication(record)).toEqual({ status: 'current', record });
    expect(readHopV55RecipeApplication({ ...record, branchId: 'branch:other' })).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/altérée/) });
    expect(readHopV55RecipeApplication({ ...record, workspace: { large: true } })).toMatchObject({ status: 'invalid' });
    const { scenarioId: _scenarioId, ...incomplete } = record;
    expect(readHopV55RecipeApplication(incomplete)).toMatchObject({ status: 'invalid' });
    expect(readHopV55RecipeApplication('illisible')).toMatchObject({ status: 'invalid', raw: 'illisible' });
  });

  it('garde un format futur brut, en lecture seule, et n’ajoute qu’en fin d’historique', () => {
    const future = { format: 'hop-v55-recipe-draft-application-v2', id: 'future', nested: { kept: [1, 2] } };
    expect(readHopV55RecipeApplication(future)).toEqual({ status: 'unsupported', format: future.format, raw: future });
    const existing: unknown[] = [future, 'illisible'];
    const read = readHopV55RecipeApplications(existing);
    expect(read.records).toEqual([]);
    expect(read.unreadable).toHaveLength(2);
    expect(readHopV55RecipeApplications(undefined)).toEqual({ records: [], unreadable: [] });
    expect(readHopV55RecipeApplications({ not: 'an array' }).unreadable).toHaveLength(1);

    const record = sealedRecord();
    const next = appendHopV55RecipeApplication(existing, record);
    expect(next).toEqual([future, 'illisible', record]);
    expect(existing).toHaveLength(2);
    expect(readHopV55RecipeApplications(next).records).toEqual([record]);
    expect(appendHopV55RecipeApplication(next, record)).toEqual(next);
    expect(() => appendHopV55RecipeApplication(next, sealedRecord({ branchId: 'different-branch' }))).toThrow(/autre trace/);
    expect(() => appendHopV55RecipeApplication({ not: 'an array' }, record)).toThrow(/conservé tel quel/);
    expect(() => appendHopV55RecipeApplication([], { ...record, hopsReference: 'altered' })).toThrow(/invalide/);
  });
});

describe('garde du wizard au moment d’écrire', () => {
  it('accepte seulement le même profil, le même brouillon et le contenu exact prouvé par l’aperçu', () => {
    const current = finiteDraft();
    const proven = application(current);
    expect(() => assertHopV55RecipeDraftApplicationTarget(proven, current, { ownerKey, draftId })).not.toThrow();
    expect(() => assertHopV55RecipeDraftApplicationTarget(proven, current, { ownerKey: 'owner:other', draftId })).toThrow(/autre profil/);
    expect(() => assertHopV55RecipeDraftApplicationTarget(proven, current, { ownerKey, draftId: 'recipe-other' })).toThrow(/autre brouillon/);
    expect(() => assertHopV55RecipeDraftApplicationTarget(proven, { ...current, name: 'Nom modifié après l’aperçu' }, { ownerKey, draftId }))
      .toThrow(/a changé depuis l’aperçu/);
    expect(() => assertHopV55RecipeDraftApplicationTarget({ ...proven, hops: [{ ...proven.hops[0], weightG: 50 }] }, current, { ownerKey, draftId }))
      .toThrow(/trace scellée/);
    expect(() => assertHopV55RecipeDraftApplicationTarget({ ...proven, record: { ...proven.record, branchId: 'branch:other' } }, current, { ownerKey, draftId }))
      .toThrow(/trace scellée/);
  });
});
