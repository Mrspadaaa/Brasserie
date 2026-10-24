import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { readRecipeDraft, readRecipeDraftState } from '../../src/services/recipeDraft';
import type { Recipe } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import { allerEtape } from '../helpers/wizard';

// #162 (D65) : dans la VRAIE App, avec le vrai crochet de pile et le vrai wizard, les couches d'outils se posent sur la
// page sans la démonter. Preuves : même nœud DOM, même étape, aucune nouvelle lecture du brouillon, jamais
// `DraftFreshnessChoice` au retour, même quand la recette enregistrée change pendant que l'outil est ouvert.

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
vi.mock('../../src/services/recipeSave', () => ({ saveRecipeConfirmed: vi.fn(async (recipe: Recipe) => recipe) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
// La recherche universelle sert de porte d'entrée : chaque recette y est un bouton qui ouvre sa page.
vi.mock('../../src/ui/CommandPalette', () => ({
  CommandPalette: ({ groups }: { groups: { heading: string; items: { id: string; label: string; onSelect: () => void }[] }[] }) => <>
    {groups.filter(group => group.heading === 'Recettes').flatMap(group => group.items).map(item =>
      <button key={item.id} type="button" onClick={item.onSelect}>Ouvrir {item.label}</button>)}
  </>
}));
// La page recette, réduite à ce que la pile doit garder : un état local, l'édition et l'atelier.
vi.mock('../../src/pages/RecipePage', async () => {
  const { PageShell } = await import('../../src/pages/PageShell');
  return {
    RecipePage: ({ recipe, onClose, onEdit, onOpenHopV55 }: { recipe: Recipe; onClose: () => void; onEdit: () => void; onOpenHopV55: () => void }) => {
      const [taps, setTaps] = React.useState(0);
      return <PageShell title={`Recette ${recipe.name}`} onClose={onClose}>
        <button type="button" onClick={() => setTaps(n => n + 1)}>Compteur local {taps}</button>
        <button type="button" onClick={onEdit}>Modifier la recette</button>
        <button type="button" onClick={onOpenHopV55}>Atelier V5.5</button>
      </PageShell>;
    }
  };
});
vi.mock('../../src/ui/hopV55/Host', async () => {
  const { PageShell } = await import('../../src/pages/PageShell');
  return { HopV55Host: ({ onClose }: { onClose: () => void }) => <PageShell title="Atelier V5.5" onClose={onClose}><p>Atelier ouvert</p></PageShell> };
});
vi.mock('../../src/services/recipeDraft', async importOriginal => {
  const original = await importOriginal<typeof import('../../src/services/recipeDraft')>();
  return { ...original, readRecipeDraftState: vi.fn(original.readRecipeDraftState) };
});

const SAVED: Recipe = { ...fixtureRecipe(), id: 'REC-PILE', name: 'Pale de la pile' } as Recipe;
let recipes: Recipe[] = [];
const listeners = new Set<() => void>();
const notify = () => act(() => { listeners.forEach(listener => listener()); });

beforeEach(() => {
  window.history.replaceState(null, '', '/?dev-local');
  localStorage.clear();
  StorageService.clearMemoryCache();
  recipes = [SAVED];
  listeners.clear();
  vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(defaultConfig);
  vi.spyOn(StorageService, 'getRecipes').mockImplementation(() => recipes);
  vi.spyOn(StorageService, 'subscribe').mockImplementation(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; });
  vi.mocked(readRecipeDraftState).mockClear();
});
afterEach(() => { cleanup(); StorageService.clearMemoryCache(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

const pile = () => window.__hopPile!;
const openLayer = (route: Parameters<NonNullable<Window['__hopPile']>['open']>[0]) => act(() => { pile().open(route); });
const goBack = async (expectedTop: string) => {
  act(() => { window.history.back(); });
  await waitFor(() => expect(pile().pile().at(-1)?.view).toBe(expectedTop));
};
const base = () => document.querySelector<HTMLElement>('[data-route-base]')!;
const baseShell = () => base().querySelector<HTMLElement>('[data-page-shell]');
const currentStep = () => base().querySelector('[aria-current="step"]')?.textContent ?? '';

async function openWizardOnSavedRecipe() {
  const { App } = await import('../../src/App');
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Pale de la pile' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Modifier la recette' }));
  await waitFor(() => expect(document.getElementById('wz-title')).toBeTruthy(), { timeout: 12000 });
}

describe('App · pile de routes (#162)', () => {
  it('wizard → quatre couches → retour niveau par niveau : même instance, même étape, brouillon intact, jamais DraftFreshnessChoice', async () => {
    await openWizardOnSavedRecipe();
    fireEvent.change(document.getElementById('wz-title')!, { target: { value: 'Pale du brouillon' } });
    allerEtape(/Houblons/);
    await waitFor(() => expect(currentStep()).toMatch(/Houblons/));
    await waitFor(() => expect(readRecipeDraft(`dev-local:REC-PILE`)?.recipe.name).toBe('Pale du brouillon'));
    const draftBefore = localStorage.getItem('laffinee_recipe_draft_v1:dev-local:REC-PILE');
    const shell = baseShell();
    const reads = vi.mocked(readRecipeDraftState).mock.calls.length;
    expect(reads).toBe(1);

    openLayer({ view: 'hopBeer' });
    openLayer({ view: 'hopSuggest' });
    openLayer({ view: 'hopCompare', hops: ['citra', 'mosaic'] });
    openLayer({ view: 'hopTiming', additionId: 'a1', step: 'yeast' });
    expect(await screen.findByRole('heading', { name: 'Levure' })).toBeTruthy();
    expect(pile().pile().map(route => route.view)).toEqual(['tabs', 'wizard', 'hopBeer', 'hopSuggest', 'hopCompare', 'hopTiming']);
    // Le wizard reste monté, caché sous les couches et retiré de l'arbre d'accessibilité.
    expect(baseShell()).toBe(shell);
    expect(base()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('textbox', { name: /nom/i })).toBeNull();

    // Pendant l'outil, la recette enregistrée change (autre appareil) : un wizard remonté demanderait quelle version ouvrir.
    recipes = [{ ...SAVED, name: 'Pale modifiée ailleurs' }];
    notify();

    await goBack('hopCompare');
    expect(await screen.findByRole('heading', { name: 'Comparer' })).toBeTruthy();
    await goBack('hopSuggest');
    expect(await screen.findByRole('heading', { name: 'Suggérer' })).toBeTruthy();
    await goBack('hopBeer');
    expect(await screen.findByRole('heading', { name: 'Ma bière' })).toBeTruthy();
    await goBack('wizard');

    await waitFor(() => expect(base()).not.toHaveAttribute('aria-hidden'));
    expect(baseShell()).toBe(shell);
    expect(currentStep()).toMatch(/Houblons/);
    expect(vi.mocked(readRecipeDraftState).mock.calls.length).toBe(reads);
    expect(screen.queryByRole('heading', { name: 'La recette enregistrée a changé' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reprendre le brouillon' })).toBeNull();
    expect(localStorage.getItem('laffinee_recipe_draft_v1:dev-local:REC-PILE')).toBe(draftBefore);

    // Témoin : le même brouillon, relu par un wizard REMONTÉ (l'ancien chemin), fait surgir le choix.
    await goBack('tabs');
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Pale modifiée ailleurs' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier la recette' }));
    expect(await screen.findByRole('heading', { name: 'La recette enregistrée a changé' })).toBeTruthy();
  });

  it('RecipePage → atelier V5.5 → retour : la page recette garde son état ; → outil v4 → retour : idem', async () => {
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Pale de la pile' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Compteur local 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Compteur local 1' }));
    const shell = baseShell();

    fireEvent.click(screen.getByRole('button', { name: 'Atelier V5.5' }));
    expect(await screen.findByText('Atelier ouvert')).toBeTruthy();
    expect(pile().pile().map(route => route.view)).toEqual(['tabs', 'recipe', 'hopV55']);
    await goBack('recipe');
    expect(await screen.findByRole('button', { name: 'Compteur local 2' })).toBeTruthy();
    expect(baseShell()).toBe(shell);

    openLayer({ view: 'hopSubstitute', recipeId: SAVED.id, hopKey: 'citra' });
    expect(await screen.findByRole('heading', { name: 'Substituer' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Compteur local 2' })).toBeNull();
    await goBack('recipe');
    expect(await screen.findByRole('button', { name: 'Compteur local 2' })).toBeTruthy();
    expect(baseShell()).toBe(shell);

    // Retour existant : la recette ramène aux onglets.
    await goBack('tabs');
    expect(screen.queryByRole('button', { name: /Compteur local/ })).toBeNull();
  });
});
