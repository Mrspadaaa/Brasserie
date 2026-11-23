// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { readRecipeDraft, readRecipeDraftState, RecipeDraftWriteBlockedError,
  serializeRecipeDraft, writeRecipeDraft, type RecipeWizardDraft } from '../../src/services/recipeDraft';

const prefix = 'laffinee_recipe_draft_v1:';
const key = 'unit-recipe-draft-format';
const storageKey = `${prefix}${key}`;
afterEach(() => localStorage.removeItem(storageKey));

function knownDraft(): RecipeWizardDraft & { localMetadata: { sourceReference: string; operatorLabel: string } } {
  return {
    recipe: {
      ...structuredClone(fullRecipe),
      id: 'REC-MANUAL-42',
      name: 'Brouillon exact QA',
      volumeL: Number.NaN,
      hopMatrixId: 'matrix:manual-exact',
      hops: [{ ...structuredClone(fullRecipe.hops[0]), name: 'Houblon saisi', hopVarietyId: 'variety:exact-7',
        hopLotId: 'lot:exact-12', weightG: 17.125, alpha: 6.75, stage: 'dryHop',
        aromaTiming: 'postFermentation', aromaTemperatureC: 14, aromaContactHours: 24 }],
    },
    details: { ...structuredClone(fullRecipe), name: 'Détails saisis', hopMatrixId: 'matrix:details-9' },
    step: 'houblons',
    water: { sourceReference: 'water-source:manual-3', manualSalts: { gypse: 1.25 } } as never,
    volumesEdited: true,
    waterProfileAuto: false,
    targetBasis: 'manual-basis:17',
    mashRatioOverride: 2.72,
    localMetadata: { sourceReference: 'recipe-source:origin-11', operatorLabel: 'saisie conservée' },
  };
}

describe('Protection des enveloppes de brouillon de recette', () => {
  it('garde le format futur brut et refuse un autosave provenant d’une autre étape', () => {
    const futureRaw = JSON.stringify({ version: 99, format: 'laffinee-recipe-draft-v99',
      draft: { step: 'fermentation-specialisee', recipe: { id: 'future-id' }, futureFields: ['must', 'stay'] },
      opaqueMetadata: { sourceReference: 'future:source-7', exact: 'bytes-as-string' } });
    localStorage.setItem(storageKey, futureRaw);

    const state = readRecipeDraftState(key);
    expect(state).toMatchObject({ status: 'readOnly', reason: 'future-version', version: 99, raw: futureRaw,
      format: 'laffinee-recipe-draft-v99' });
    expect(readRecipeDraft(key)).toBeUndefined();

    const changedStepDraft = knownDraft();
    changedStepDraft.step = 'houblons';
    let thrown: unknown;
    try { writeRecipeDraft(key, serializeRecipeDraft(changedStepDraft)); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(RecipeDraftWriteBlockedError);
    expect(thrown).toMatchObject({ code: 'recipe-draft-read-only', state: { reason: 'future-version', raw: futureRaw } });
    expect(localStorage.getItem(storageKey)).toBe(futureRaw);
  });

  it.each([
    ['unknown external format', JSON.stringify({ format: 'external-recipe-envelope-v7', payload: { exact: ['kept', 31] } }), 'unsupported-format'],
    ['ill-formed JSON', '{"version":1,"draft":', 'invalid-envelope'],
    ['version 1 missing required fields', JSON.stringify({ version: 1, draft: { recipe: { id: 'x' } } }), 'invalid-envelope'],
  ] as const)('keeps a present %s envelope read-only and byte-for-byte unchanged', (_label, raw, reason) => {
    localStorage.setItem(storageKey, raw);
    const state = readRecipeDraftState(key);
    expect(state).toMatchObject({ status: 'readOnly', reason, raw });
    expect(readRecipeDraft(key)).toBeUndefined();
    expect(() => writeRecipeDraft(key, serializeRecipeDraft(knownDraft()))).toThrow(RecipeDraftWriteBlockedError);
    expect(localStorage.getItem(storageKey)).toBe(raw);
  });

  it('does not discard an unrecognized envelope field added to version 1', () => {
    const current = JSON.parse(serializeRecipeDraft(knownDraft()));
    const raw = JSON.stringify({ ...current, futureHeaderMetadata: { exact: ['kept', 57] } });
    localStorage.setItem(storageKey, raw);

    expect(readRecipeDraftState(key)).toMatchObject({ status: 'readOnly', reason: 'unsupported-format', raw });
    expect(() => writeRecipeDraft(key, serializeRecipeDraft(knownDraft()))).toThrow(RecipeDraftWriteBlockedError);
    expect(localStorage.getItem(storageKey)).toBe(raw);
  });

  it('keeps real absence distinct from an unreadable saved envelope', () => {
    expect(readRecipeDraftState(key)).toEqual({ status: 'absent' });
    expect(readRecipeDraft(key)).toBeUndefined();

    const futureRaw = JSON.stringify({ version: 12, draft: { future: true } });
    localStorage.setItem(storageKey, futureRaw);
    expect(readRecipeDraftState(key)).toMatchObject({ status: 'readOnly', reason: 'future-version', raw: futureRaw });
    expect(readRecipeDraftState(key)).not.toEqual({ status: 'absent' });
  });

  it('retains a valid version 1 draft, including NaN sentinel, manual values and references', () => {
    const draft = knownDraft();
    const serialized = serializeRecipeDraft(draft);
    expect(serialized).toContain('__recipe_number_missing__');
    writeRecipeDraft(key, serialized);

    const state = readRecipeDraftState(key);
    expect(state.status).toBe('available');
    if (state.status !== 'available') throw new Error('Un brouillon local V1 valide doit rester disponible.');
    const restored = state.draft as typeof draft;
    expect(state.version).toBe(1);
    expect(state.raw).toBe(serialized);
    expect(restored.recipe.volumeL).toBeNaN();
    expect(restored.recipe.hops[0]).toMatchObject({ hopVarietyId: 'variety:exact-7', hopLotId: 'lot:exact-12',
      weightG: 17.125, alpha: 6.75, aromaTiming: 'postFermentation', aromaTemperatureC: 14, aromaContactHours: 24 });
    expect(restored.recipe.hopMatrixId).toBe('matrix:manual-exact');
    expect(restored.details.hopMatrixId).toBe('matrix:details-9');
    expect(restored.water).toEqual({ sourceReference: 'water-source:manual-3', manualSalts: { gypse: 1.25 } });
    expect(restored.targetBasis).toBe('manual-basis:17');
    expect(restored.mashRatioOverride).toBe(2.72);
    expect(restored.localMetadata).toEqual({ sourceReference: 'recipe-source:origin-11', operatorLabel: 'saisie conservée' });
    expect(readRecipeDraft(key)?.recipe.hops[0].hopLotId).toBe('lot:exact-12');
  });

  it('keeps a storage access failure distinguishable and recoverable for the caller', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    let writes = 0;
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem() { throw new Error('Storage inaccessible.'); },
      setItem() { writes++; },
    } });
    try {
      expect(readRecipeDraftState(key)).toEqual({ status: 'readOnly', reason: 'storage-unavailable' });
      expect(() => writeRecipeDraft(key, serializeRecipeDraft(knownDraft()))).toThrow(RecipeDraftWriteBlockedError);
      expect(writes).toBe(0);
    } finally {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
    }
  });
});
