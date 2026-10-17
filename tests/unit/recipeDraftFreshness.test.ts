// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { readRecipeDraftState, recipeDraftResumeCheck, recipeServerBase, serializeRecipeDraft, writeRecipeDraft,
  type RecipeWizardDraft } from '../../src/services/recipeDraft';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Recipe } from '../../src/types';

const KEY = 'fixture-owner:REC-FRESH';
const saved = (): Recipe => ({ ...yeastFlowRecipe(), id: 'REC-FRESH', name: 'Version serveur' });
const draftOf = (recipe: Recipe, serverBase?: string): RecipeWizardDraft => ({
  recipe: { ...recipe, name: 'Version brouillon' }, details: {}, step: 'houblons',
  water: { diRatioPct: 0, styleCode: 'NEIPA', doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 15, spargeWaterL: 10, allSaltsInMash: true },
  volumesEdited: false, waterProfileAuto: false, targetBasis: 'recipe', mashRatioOverride: null,
  ...(serverBase === undefined ? {} : { serverBase }),
});
const stored = (draft: RecipeWizardDraft) => { writeRecipeDraft(KEY, serializeRecipeDraft(draft)); return readRecipeDraftState(KEY); };

afterEach(() => localStorage.clear());

describe('#97 empreinte de la version serveur de départ', () => {
  it('ne dépend ni de l’ordre des clés ni de l’identifiant, mais de tout autre champ', () => {
    const recipe = saved();
    const reordered = Object.fromEntries(Object.entries(recipe).reverse()) as unknown as Recipe;
    expect(recipeServerBase(reordered)).toBe(recipeServerBase(recipe));
    expect(recipeServerBase({ ...recipe, id: 'REC-COPIE-NEUVE' })).toBe(recipeServerBase(recipe));
    expect(recipeServerBase({ ...recipe, hopV55ColdEvidenceAssociations: [{ restored: true }] } as unknown as Recipe))
      .not.toBe(recipeServerBase(recipe));
    expect(recipeServerBase({ ...recipe, hops: recipe.hops.map((hop, index) => index ? hop : { ...hop, weightG: hop.weightG + 1 }) }))
      .not.toBe(recipeServerBase(recipe));
    expect(recipeServerBase(recipe)).toMatch(/^recipe-server:sha256:[0-9a-f]{64}$/);
    expect(recipeServerBase(undefined)).toBeUndefined();
  });

  it('distingue une valeur manquante d’un zéro sans lever d’erreur', () => {
    const recipe = saved();
    expect(recipeServerBase({ ...recipe, volumeL: Number.NaN })).not.toBe(recipeServerBase({ ...recipe, volumeL: 0 }));
  });

  it('voyage dans l’enveloppe v1 sans clé de premier niveau nouvelle', () => {
    const base = recipeServerBase(saved())!;
    const state = stored(draftOf(saved(), base));
    expect(state.status).toBe('available');
    expect(Object.keys(JSON.parse(localStorage.getItem(`laffinee_recipe_draft_v1:${KEY}`)!))).toEqual(['version', 'draft']);
    expect(state.status === 'available' && state.draft.serverBase).toBe(base);
  });

  it('écarte une empreinte illisible : le brouillon devient non vérifié', () => {
    const state = stored({ ...draftOf(saved()), serverBase: 42 as unknown as string });
    expect(state.status === 'available' && state.draft.serverBase).toBeUndefined();
    expect(recipeDraftResumeCheck(state, saved())).toBe('unverified');
  });
});

describe('#97 décision de reprise', () => {
  it('reprend en silence si la version serveur est celle de départ', () => {
    expect(recipeDraftResumeCheck(stored(draftOf(saved(), recipeServerBase(saved()))), saved())).toBe('resume');
  });

  it('demande un choix si la version serveur a changé', () => {
    const before = { ...saved(), name: 'Version de départ' };
    expect(recipeDraftResumeCheck(stored(draftOf(before, recipeServerBase(before))), saved())).toBe('changed');
  });

  it('demande un choix pour un ancien brouillon sans empreinte', () => {
    expect(recipeDraftResumeCheck(stored(draftOf(saved())), saved())).toBe('unverified');
  });

  it('reprend en silence sans recette enregistrée et ne décide rien sans brouillon lisible', () => {
    expect(recipeDraftResumeCheck(stored(draftOf(saved())), undefined)).toBe('resume');
    expect(recipeDraftResumeCheck({ status: 'absent' }, saved())).toBe('none');
    expect(recipeDraftResumeCheck({ status: 'readOnly', reason: 'storage-unavailable' }, saved())).toBe('none');
  });
});
