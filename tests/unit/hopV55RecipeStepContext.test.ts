import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../src/types';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { newNoloConfig } from '../../src/domain/nolo';
import { canonicalizeHopV55RecipeDraft, createHopV55RecipeDraftContextSource,
  type HopV55RecipeStepStorage } from '../../src/services/hopV55/recipeStepContext';
import { StorageService } from '../../src/services/storage';
import { recipe as recipeFixture } from '../fixtures/brewCompanion';
import { hopTestVariety } from '../fixtures/hopIndex';

afterEach(() => vi.restoreAllMocks());

const ownerKey = 'owner:recipe-step-context-test';
const draftId = 'recipe-step-context-test';

function stores(): HopV55RecipeStepStorage {
  return {
    getHopVarieties: () => [hopTestVariety()],
    getHopLots: () => [],
    getHopKnowledge: () => [],
    getStocks: () => ({ rawMaterials: [] }),
    getBatches: () => [],
  };
}

function blankDraft(overrides: Partial<Recipe> = {}): Recipe {
  return {
    ...recipeFixture(),
    id: draftId,
    name: 'Nouvelle recette de travail',
    volumeL: Number.NaN,
    boilMin: Number.NaN,
    hops: [],
    yeast: { name: 'Culture libre inconnue', qty: 0, unit: 'sachet' },
    ...overrides,
  } as unknown as Recipe;
}

describe('contexte V5.5 de l’étape Houblons du brouillon', () => {
  it('prépare réellement une nouvelle recette avec valeurs manquantes comme unknown/null et garde le catalogue', async () => {
    const saved = blankDraft({ name: 'Ancienne recette enregistrée', volumeL: 20, boilMin: 60 });
    const readSaved = vi.spyOn(StorageService, 'getRecipes').mockReturnValue([saved] as never);
    const raw = blankDraft();
    const canonical = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: raw });
    const source = createHopV55RecipeDraftContextSource({
      ownerKey, draftId, readDraft: () => raw, storage: stores(), now: () => 123,
    });

    const context = await source({ kind: 'recipe', recipeId: draftId });
    expect(context.recipe).not.toBe(raw);
    expect(context.recipe).toEqual(canonical.recipe);
    expect(context.provenance.join(' ')).toContain(canonical.reference);
    expect((context.recipe as Recipe).volumeL).toBeNull();
    expect((context.recipe as Recipe).boilMin).toBeNull();
    expect(Number.isNaN(raw.volumeL)).toBe(true);
    expect(Number.isNaN(raw.boilMin)).toBe(true);

    const prepared = prepareBrewingScenarioContext(context);
    expect(prepared.runtime.current?.program?.volumeL).toBeNull();
    // This existing engine input uses 0 only as its explicit unknown-volume sentinel.
    expect(prepared.runtime.current?.input.volumeL).toBe(0);
    expect(prepared.runtime.current?.program?.additions).toEqual([]);
    expect(prepared.runtime.materials.some(material => material.id === 'variety:test-variety')).toBe(true);
    expect(readSaved).not.toHaveBeenCalled();
  });

  it('prend le volume 23 L non enregistré du même ID au lieu des 20 L stockés', async () => {
    const saved = blankDraft({ name: 'Ancienne version stockée', volumeL: 20, boilMin: 60 });
    const readSaved = vi.spyOn(StorageService, 'getRecipes').mockReturnValue([saved] as never);
    const live = blankDraft({ name: 'Version du Wizard non enregistrée', volumeL: 23, boilMin: 60 });
    const canonical = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: live });
    const source = createHopV55RecipeDraftContextSource({ ownerKey, draftId, readDraft: () => live, storage: stores() });

    const context = await source({ kind: 'recipe', recipeId: draftId });
    const prepared = prepareBrewingScenarioContext(context);

    expect((context.recipe as Recipe).volumeL).toBe(23);
    expect(prepared.runtime.current?.program?.volumeL).toBe(23);
    expect(prepared.runtime.current?.input.volumeL).toBe(23);
    expect(canonical.reference).toContain('hop-v55-recipe-step-draft-context-v1:sha256:');
    expect(canonical.reference).not.toBe(canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: saved }).reference);
    expect(saved.volumeL).toBe(20);
    expect(readSaved).not.toHaveBeenCalled();
  });
  it('préserve culture inconnue, contexte NOLO, conditions et champs manuels sans modifier le brut', async () => {
    const rawNolo = { ...newNoloConfig(), enabled: true, process: 'coldExtraction' as const };
    const manualWaterPlan = { ...recipeFixture().waterPlan!, sourceId: 'manual-water-source', mashWaterL: 21.5 };
    const raw = blankDraft({
      volumeL: Number.NaN,
      boilMin: Number.NaN,
      nolo: rawNolo,
      waterPlan: manualWaterPlan,
      instructions: 'Maintenir la consigne manuelle sans la recalculer.',
      hops: [{
        name: 'Houblon de travail', alpha: 0, weightG: Number.NaN, stage: 'dryHop',
        hopVarietyId: 'test-variety', stockItemRef: 'manual-hop-stock',
        aromaTiming: 'fermentation', aromaContactHours: 36, aromaTemperatureC: 15, dayOffset: 2,
      }],
      yeast: { name: 'Culture non répertoriée', form: 'liquide', qty: 0, unit: 'mL' },
    });
    const before = structuredClone(raw);
    const source = createHopV55RecipeDraftContextSource({ ownerKey, draftId, readDraft: () => raw, storage: stores() });

    const context = await source();
    const prepared = prepareBrewingScenarioContext(context);
    const projected = context.recipe as Recipe & { volumeL: number | null; boilMin: number | null;
      hops: Array<{ alpha: number | null; weightG: number | null }> };

    expect(prepared.runtime.current?.culture).toMatchObject({ state: 'unknown', members: [] });
    expect(prepared.runtime.current?.input.aromaDomain).toBe('nolo');
    expect(prepared.runtime.current?.input.aromaContext?.stage).toBe('reference');
    expect(prepared.runtime.current?.program?.volumeL).toBeNull();
    expect(prepared.runtime.current?.program?.additions[0]).toMatchObject({
      grams: null, use: 'fermentation', contactHours: 36, temperatureC: 15, dayOffset: 2,
    });
    expect(prepared.runtime.current?.input.additions[0].triplet).toMatchObject({
      timing: 'fermentation', doseGL: null, contactHours: 36, temperatureC: 15,
    });
    expect(projected.volumeL).toBeNull();
    expect(projected.boilMin).toBeNull();
    expect(projected.hops[0]).toMatchObject({ alpha: 0, weightG: null, aromaTiming: 'fermentation',
      aromaContactHours: 36, aromaTemperatureC: 15, dayOffset: 2, stockItemRef: 'manual-hop-stock' });
    expect(projected.nolo).toEqual(rawNolo);
    expect(projected.waterPlan).toEqual(manualWaterPlan);
    expect(projected.instructions).toBe('Maintenir la consigne manuelle sans la recalculer.');
    expect(raw).toEqual(before);
    expect(Number.isNaN(raw.volumeL)).toBe(true);
    expect(Number.isNaN(raw.hops[0].weightG)).toBe(true);
  });

  it('scelle propriétaire, ID et Recipe canonique; refuse autres sources et non-finis hors sentinelle', async () => {
    const raw = blankDraft();
    const canonical = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: raw });
    const otherOwner = canonicalizeHopV55RecipeDraft({ ownerKey: 'owner:other', draftId, draft: raw });
    const explicitUnknown = canonicalizeHopV55RecipeDraft({ ownerKey, draftId,
      draft: blankDraft({ volumeL: null as unknown as number, boilMin: null as unknown as number }) });
    const physicalZero = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: blankDraft({ volumeL: 0 }) });

    expect(otherOwner.reference).not.toBe(canonical.reference);
    expect(explicitUnknown.reference).toBe(canonical.reference);
    expect(physicalZero.reference).not.toBe(canonical.reference);
    expect(Number.isNaN(raw.volumeL)).toBe(true);
    expect(() => canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: blankDraft({ volumeL: Infinity }) })).toThrow(/Nombre infini/);
    expect(() => canonicalizeHopV55RecipeDraft({ ownerKey, draftId: 'other-recipe', draft: raw })).toThrow(/ne correspond pas/);
    expect(() => createHopV55RecipeDraftContextSource({ ownerKey: 'owner/other', draftId, readDraft: () => raw }))
      .toThrow(/profil propriétaire/);

    let live = raw;
    const source = createHopV55RecipeDraftContextSource({ ownerKey, draftId, readDraft: () => live, storage: stores() });
    await expect(source({ kind: 'recipe', recipeId: 'saved-other' })).rejects.toThrow(/aucune recette enregistrée n’est substituée/);
    await expect(source({ kind: 'batch', batchId: 'batch-other' })).rejects.toThrow(/aucun brassin ni journal n’est substitué/);
    live = blankDraft({ id: 'other-recipe' } as Partial<Recipe>);
    await expect(source()).rejects.toThrow(/ne correspond plus à son identifiant/);
    expect(raw.id).toBe(draftId);
  });
});