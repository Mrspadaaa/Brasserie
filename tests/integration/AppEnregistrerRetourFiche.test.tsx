// BR-7 (08.11) : « Enregistrer la recette » ouvert par « Modifier la recette » ramenait à la liste des recettes (défilée), pas à la fiche d'où l'on venait.
// Écrit avant le correctif (L13) : rouge sur le code d'alors. Même harnais que AppRoutePile (vraie App, vrai wizard, vraie pile).
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

describe('BR-7 · enregistrer une recette modifiée ramène à sa fiche', () => {
  it('fiche → Modifier la recette → Récap → Enregistrer : la fiche de la recette, pas la liste', async () => {
    await openWizardOnSavedRecipe();
    allerEtape(/Récap/);
    fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer la recette' }));
    await waitFor(() => expect(pile().pile().at(-1)?.view).toBe('recipe'), { timeout: 20000 });
    expect(await screen.findByText('Recette Pale de la pile')).toBeTruthy();
    expect(pile().pile().map(route => route.view)).toEqual(['tabs', 'recipe']);
  }, 60000);
});
