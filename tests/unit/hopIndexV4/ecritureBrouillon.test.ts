// @vitest-environment jsdom
// Voie t6a (#165, a) : la porte d'écriture du wizard pour les outils v4. `preparerEcritureHoublons` est la règle
// pure (refus, nouveau brouillon) ; `applyHopV4Change` (BrewWizard) l'appelle puis passe par writeRecipeDraft, le
// point de validation, comme applyHopV55Change.
import fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { companionRecipe } from '../../fixtures/companionRecipe';
import type { Recipe } from '../../../src/types';
import { readRecipeDraftState, RecipeDraftWriteBlockedError, serializeRecipeDraft, writeRecipeDraft, type RecipeWizardDraft } from '../../../src/services/recipeDraft';
import { preparerEcritureHoublons } from '../../../src/domain/hopIndex/v4/recipeConversion';

const CLE = 'proprietaire-t6a:brouillon-1';
afterEach(() => localStorage.clear());

function brouillon(): RecipeWizardDraft {
  const recipe = { ...companionRecipe(), id: 'brouillon-1',
    hopPredictionIds: ['prediction-1'], hopTrialId: 'essai-1',
    hopV55Applications: [{ id: 'app-1' }], hopV55ColdEvidenceAssociations: [{ id: 'froid-1' }] } as Recipe;
  return { recipe, details: { hopV55Applications: recipe.hopV55Applications, hopV55ColdEvidenceAssociations: recipe.hopV55ColdEvidenceAssociations,
      hopPredictionIds: ['prediction-1'], hopTrialId: 'essai-1' }, step: 'houblons',
    water: {} as RecipeWizardDraft['water'], volumesEdited: false, waterProfileAuto: true, targetBasis: 'ibu', mashRatioOverride: null };
}
const patch = (d: RecipeWizardDraft) => ({ hops: [{ ...d.recipe.hops[0], weightG: 31 }, d.recipe.hops[1]] });
const entree = (d: RecipeWizardDraft, o: Partial<Parameters<typeof preparerEcritureHoublons>[0]> = {}) =>
  ({ draftReadOnly: false, ownerKey: 'proprietaire-t6a', draftRecipeId: 'brouillon-1', current: d, change: { draftId: 'brouillon-1', patch: patch(d) }, ...o });

describe('preparerEcritureHoublons : les refus de applyHopV55Change, avant toute écriture', () => {
  it('refuse un brouillon conservé en lecture seule', () => {
    const d = brouillon();
    expect(() => preparerEcritureHoublons(entree(d, { draftReadOnly: true }))).toThrow(/lecture seule/);
  });
  it('refuse un brouillon sans profil propriétaire', () => {
    const d = brouillon();
    expect(() => preparerEcritureHoublons(entree(d, { ownerKey: undefined }))).toThrow(/propriétaire/);
  });
  it('refuse un changement qui vise un autre brouillon', () => {
    const d = brouillon();
    expect(() => preparerEcritureHoublons(entree(d, { change: { draftId: 'autre', patch: patch(d) } }))).toThrow(/autre brouillon/);
  });
  it('ne modifie pas le brouillon reçu en cas de refus', () => {
    const d = brouillon();
    const avant = serializeRecipeDraft(d);
    try { preparerEcritureHoublons(entree(d, { draftReadOnly: true })); } catch { /* attendu */ }
    expect(serializeRecipeDraft(d)).toBe(avant);
  });
});

describe('preparerEcritureHoublons : le brouillon suivant', () => {
  it('change hops seulement ; garde les traces V5.5 (recette ET détails) ; lâche les liens de prévision devenus faux', () => {
    const d = brouillon();
    const { nextDraft } = preparerEcritureHoublons(entree(d));
    expect(nextDraft.recipe.hops[0].weightG).toBe(31);
    expect(nextDraft.recipe.hopV55Applications).toBe(d.recipe.hopV55Applications);
    expect(nextDraft.recipe.hopV55ColdEvidenceAssociations).toBe(d.recipe.hopV55ColdEvidenceAssociations);
    expect(nextDraft.details.hopV55Applications).toBe(d.details.hopV55Applications);
    expect(nextDraft.details.hopV55ColdEvidenceAssociations).toBe(d.details.hopV55ColdEvidenceAssociations);
    expect(nextDraft.recipe.hopPredictionIds).toBeUndefined();
    expect(nextDraft.recipe.hopTrialId).toBeUndefined();
    expect(nextDraft.details.hopPredictionIds).toBeUndefined();
    expect(nextDraft.recipe.fermentables).toBe(d.recipe.fermentables);
    expect(nextDraft.step).toBe('houblons');
  });
  it('un patch sans changement de houblon garde aussi les liens de prévision', () => {
    const d = brouillon();
    const { nextDraft } = preparerEcritureHoublons(entree(d, { change: { draftId: 'brouillon-1', patch: { hops: d.recipe.hops } } }));
    expect(nextDraft.recipe.hopPredictionIds).toEqual(['prediction-1']);
    expect(nextDraft.recipe.hopTrialId).toBe('essai-1');
  });
  it('le patch de levure change yeast ; sinon yeast reste', () => {
    const d = brouillon();
    const levure = { name: 'SafAle US-05', hopIndexId: 'us-05' };
    expect(preparerEcritureHoublons(entree(d, { change: { draftId: 'brouillon-1', patch: { ...patch(d), yeast: levure } } })).nextDraft.recipe.yeast).toBe(levure);
    expect(preparerEcritureHoublons(entree(d)).nextDraft.recipe.yeast).toBe(d.recipe.yeast);
  });
});

describe('writeRecipeDraft reste le point de validation', () => {
  it('écrit, puis la relecture redonne le brouillon suivant avec ses traces V5.5', () => {
    const d = brouillon();
    const committed = serializeRecipeDraft(preparerEcritureHoublons(entree(d)).nextDraft);
    writeRecipeDraft(CLE, committed);
    const lu = readRecipeDraftState(CLE);
    expect(lu.status).toBe('available');
    if (lu.status !== 'available') return;
    expect(lu.draft.recipe.hops[0].weightG).toBe(31);
    expect(lu.draft.recipe.hopV55Applications).toEqual([{ id: 'app-1' }]);
    expect(lu.draft.recipe.hopV55ColdEvidenceAssociations).toEqual([{ id: 'froid-1' }]);
  });
  it('un brouillon stocké dans un format inconnu n’est pas remplacé : écriture refusée, copie brute intacte', () => {
    const brut = JSON.stringify({ version: 99, draft: { x: 1 } });
    localStorage.setItem(`laffinee_recipe_draft_v1:${CLE}`, brut);
    const d = brouillon();
    const committed = serializeRecipeDraft(preparerEcritureHoublons(entree(d)).nextDraft);
    expect(() => writeRecipeDraft(CLE, committed)).toThrow(RecipeDraftWriteBlockedError);
    expect(localStorage.getItem(`laffinee_recipe_draft_v1:${CLE}`)).toBe(brut);
  });
});

describe('applyHopV4Change dans BrewWizard : la même porte que applyHopV55Change', () => {
  const source = fs.readFileSync('src/pages/BrewWizard.tsx', 'utf8');
  const i = source.indexOf('const applyHopV4Change');
  const corps = source.slice(i, i + 3500);
  it('existe, et ses contrôles précèdent l’écriture', () => {
    expect(i).toBeGreaterThan(0);
    expect(corps).toMatch(/draftReadOnly/);
    expect(corps).toMatch(/draftRecipeId/);
    expect(corps).toMatch(/preparerEcritureHoublons/);
    expect(corps.indexOf('preparerEcritureHoublons')).toBeLessThan(corps.indexOf('writeRecipeDraft'));
  });
  it('écrit par writeRecipeDraft, comme point de validation, avant de toucher l’écran', () => {
    expect(corps).toMatch(/writeRecipeDraft\(draftKey/);
    expect(corps.indexOf('writeRecipeDraft')).toBeLessThan(corps.indexOf('setHops'));
    expect(corps).toMatch(/RecipeDraftWriteBlockedError/);
  });
  it('ne contient aucune autre porte : pas de saveRecipe', () => {
    expect(i).toBeGreaterThan(0);
    expect(corps).not.toMatch(/saveRecipe/);
  });
});
