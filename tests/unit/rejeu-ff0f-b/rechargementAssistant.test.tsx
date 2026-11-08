// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService, defaultConfig } from '../../../src/services/storage';
import { readRecipeDraft, recipeServerBase } from '../../../src/services/recipeDraft';
import type { Recipe } from '../../../src/types';
import { recipe as fixtureRecipe } from '../../fixtures/brewCompanion';
import { allerEtape } from '../../helpers/wizard';

// B1-14 / B1-NOTE-5 : un rechargement pendant l'assistant de recette ramenait au carnet. Dans la vraie App, avec le vrai
// crochet de route, le vrai wizard et un rechargement simulé (démontage, puis nouveau montage sur la MÊME entrée
// d'historique et le MÊME localStorage) : l'assistant se rouvre sur la recette et l'étape où il était, avec son brouillon ;
// la fiche enregistrée redevient sa base ; recette supprimée ou brouillon absent : retour au carnet, sans erreur.

vi.mock('../../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
vi.mock('../../../src/services/recipeSave', () => ({ saveRecipeConfirmed: vi.fn(async (recipe: Recipe) => recipe) }));
vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
vi.mock('../../../src/ui/CommandPalette', () => ({
  CommandPalette: ({ groups }: { groups: { heading: string; items: { id: string; label: string; onSelect: () => void }[] }[] }) => <>
    {groups.filter(group => group.heading === 'Recettes').flatMap(group => group.items).map(item =>
      <button key={item.id} type="button" onClick={item.onSelect}>Ouvrir {item.label}</button>)}
  </>
}));
vi.mock('../../../src/pages/RecipePage', async () => {
  const { PageShell } = await import('../../../src/pages/PageShell');
  return {
    RecipePage: ({ recipe, onClose, onEdit }: { recipe: Recipe; onClose: () => void; onEdit: () => void }) =>
      <PageShell title={`Recette ${recipe.name}`} onClose={onClose}>
        <button type="button" onClick={onEdit}>Modifier la recette</button>
      </PageShell>
  };
});

const SAVED: Recipe = { ...fixtureRecipe(), id: 'REC-RELOAD', name: 'Pale du rechargement' } as Recipe;
let recipes: Recipe[] = [];
const DRAFT_KEY = 'laffinee_recipe_draft_v1:dev-local:REC-RELOAD';
const T = 60000;

beforeEach(() => {
  window.history.replaceState(null, '', '/?dev-local');
  localStorage.clear();
  StorageService.clearMemoryCache();
  recipes = [SAVED];
  vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(defaultConfig);
  vi.spyOn(StorageService, 'getRecipes').mockImplementation(() => recipes);
  vi.spyOn(StorageService, 'subscribe').mockImplementation(() => () => {});
});
afterEach(() => { cleanup(); StorageService.clearMemoryCache(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

const currentStep = () => document.querySelector('[aria-current="step"]')?.textContent ?? '';
const assistantOuvert = () => !!document.querySelector('[aria-current="step"]');
const erreurs = () => screen.queryAllByRole('alert').map(a => (a.textContent ?? '').trim()).filter(Boolean);
/** Le carnet est revenu : la barre « Actions rapides » du tableau de bord est là, aucun assistant. */
const attendreCarnet = () => waitFor(() => expect(screen.queryByText(/Ouverture de la page/)).toBeNull());

async function modifierPuisEcrire(valeur: string) {
  const { App } = await import('../../../src/App');
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Pale du rechargement' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Modifier la recette' }));
  await waitFor(() => expect(document.getElementById('wz-title')).toBeTruthy(), { timeout: 12000 });
  fireEvent.change(document.getElementById('wz-title')!, { target: { value: valeur } });
  allerEtape(/Houblons/);
  await waitFor(() => expect(currentStep()).toMatch(/Houblons/));
  await waitFor(() => expect(readRecipeDraft('dev-local:REC-RELOAD')?.recipe.name).toBe(valeur));
}

/** Un rechargement : l'arbre disparaît, l'entrée d'historique et le localStorage restent. */
async function recharger(entreTemps?: () => void) {
  const { App } = await import('../../../src/App');
  cleanup(); // le démontage écrit une dernière fois le brouillon (pagehide) : ce qui change « pendant » le rechargement vient après
  entreTemps?.();
  render(<App />);
}

describe('B1-14 · rechargement pendant l’assistant de recette', () => {
  it('recette modifiée : après rechargement, l’assistant se rouvre sur la recette, à son étape, avec son brouillon', async () => {
    await modifierPuisEcrire('Pale du brouillon');
    await recharger();
    await waitFor(() => expect(currentStep()).toMatch(/Houblons/), { timeout: 12000 });
    expect(screen.getByText('Brouillon repris sur cet appareil.')).toBeTruthy();
    allerEtape(/Identité/);
    await waitFor(() => expect((document.getElementById('wz-title') as HTMLInputElement | null)?.value).toBe('Pale du brouillon'));
    expect(readRecipeDraft('dev-local:REC-RELOAD')?.recipe.id).toBe('REC-RELOAD');
  }, T);

  it('recette supprimée entre-temps : retour au carnet, sans erreur', async () => {
    await modifierPuisEcrire('Pale du brouillon');
    await recharger(() => { recipes = []; });
    await attendreCarnet();
    expect(assistantOuvert()).toBe(false);
    expect(erreurs()).toEqual([]);
  }, T);

  it('brouillon absent : retour au carnet, sans erreur', async () => {
    await modifierPuisEcrire('Pale du brouillon');
    await recharger(() => { localStorage.removeItem(DRAFT_KEY); });
    await attendreCarnet();
    expect(assistantOuvert()).toBe(false);
    expect(erreurs()).toEqual([]);
  }, T);
});

describe('B1-NOTE-5 · la fiche enregistrée redevient la base après un rechargement', () => {
  it('le brouillon repris garde l’empreinte de la recette enregistrée (serverBase), comme après « Modifier »', async () => {
    await modifierPuisEcrire('Pale du brouillon');
    const empreinte = recipeServerBase(SAVED);
    expect(readRecipeDraft('dev-local:REC-RELOAD')?.serverBase).toBe(empreinte);
    await recharger();
    await waitFor(() => expect(currentStep()).toMatch(/Houblons/), { timeout: 12000 });
    allerEtape(/Identité/);
    fireEvent.change(document.getElementById('wz-title')!, { target: { value: 'Pale du brouillon 2' } });
    await waitFor(() => expect(readRecipeDraft('dev-local:REC-RELOAD')?.recipe.name).toBe('Pale du brouillon 2'));
    expect(readRecipeDraft('dev-local:REC-RELOAD')?.serverBase).toBe(empreinte);
  }, T);

  it('la recette a changé ailleurs pendant le rechargement : le choix de version est posé, jamais un écrasement muet', async () => {
    await modifierPuisEcrire('Pale du brouillon');
    await recharger(() => { recipes = [{ ...SAVED, name: 'Pale modifiée ailleurs' }]; });
    expect(await screen.findByRole('heading', { name: 'La recette enregistrée a changé' }, { timeout: 12000 })).toBeTruthy();
    expect(readRecipeDraft('dev-local:REC-RELOAD')?.recipe.name).toBe('Pale du brouillon');
  }, T);
});
