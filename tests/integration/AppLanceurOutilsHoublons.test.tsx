import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService, defaultConfig } from '../../src/services/storage';
import type { Recipe } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

// T15b (#174) : une couche d'outil houblons v4 a son propre dock ; le lanceur flottant global (« + » rond) s'efface tant
// qu'elle est ouverte et revient à sa fermeture. Même amorce que AppRoutePile.test.tsx (vraie App, vrai crochet de pile).

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
vi.mock('../../src/services/recipeSave', () => ({ saveRecipeConfirmed: vi.fn(async (recipe: Recipe) => recipe) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
vi.mock('../../src/ui/CommandPalette', () => ({
  CommandPalette: ({ groups }: { groups: { heading: string; items: { id: string; label: string; onSelect: () => void }[] }[] }) => <>
    {groups.filter(group => group.heading === 'Recettes').flatMap(group => group.items).map(item =>
      <button key={item.id} type="button" onClick={item.onSelect}>Ouvrir {item.label}</button>)}
  </>
}));
vi.mock('../../src/pages/RecipePage', async () => {
  const { PageShell } = await import('../../src/pages/PageShell');
  return { RecipePage: ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => <PageShell title={`Recette ${recipe.name}`} onClose={onClose}><p>Page recette</p></PageShell> };
});
vi.mock('../../src/ui/hopV55/Host', async () => {
  const { PageShell } = await import('../../src/pages/PageShell');
  return { HopV55Host: ({ onClose }: { onClose: () => void }) => <PageShell title="Atelier V5.5" onClose={onClose}><p>Atelier ouvert</p></PageShell> };
});

const SAVED: Recipe = { ...fixtureRecipe(), id: 'REC-LANCEUR', name: 'Pale du lanceur' } as Recipe;
const listeners = new Set<() => void>();

beforeEach(() => {
  window.history.replaceState(null, '', '/?dev-local');
  localStorage.clear();
  StorageService.clearMemoryCache();
  listeners.clear();
  vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(defaultConfig);
  vi.spyOn(StorageService, 'getRecipes').mockImplementation(() => [SAVED]);
  vi.spyOn(StorageService, 'subscribe').mockImplementation(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; });
});
afterEach(() => { cleanup(); StorageService.clearMemoryCache(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

const lanceur = () => document.querySelector('[data-floating-actions-dock]');
const pile = () => window.__hopPile!;

describe('App · lanceur flottant et couches d\'outils houblons (T15b)', () => {
  it('couche d\'outil ouverte : aucun lanceur ; fermée : il revient', async () => {
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Pale du lanceur' }));
    await screen.findByText('Page recette');
    await waitFor(() => expect(lanceur()).not.toBeNull());

    act(() => { pile().open({ view: 'hopCompare', hops: ['citra', 'mosaic'] }); });
    expect(await screen.findByRole('heading', { name: 'Comparer' })).toBeTruthy();
    expect(lanceur()).toBeNull();
    // Un second outil par-dessus : toujours aucun lanceur.
    act(() => { pile().open({ view: 'hopSuggest' }); });
    expect(await screen.findByRole('heading', { name: 'Suggérer' })).toBeTruthy();
    expect(lanceur()).toBeNull();

    act(() => { window.history.back(); });
    await waitFor(() => expect(pile().pile().at(-1)?.view).toBe('hopCompare'));
    expect(lanceur()).toBeNull();
    act(() => { window.history.back(); });
    await waitFor(() => expect(pile().pile().at(-1)?.view).toBe('recipe'));
    await waitFor(() => expect(lanceur()).not.toBeNull());
  });

  it('l\'atelier V5.5 garde son lanceur', async () => {
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Pale du lanceur' }));
    await screen.findByText('Page recette');
    act(() => { pile().open({ view: 'hopV55', recipeId: SAVED.id }); });
    expect(await screen.findByText('Atelier ouvert')).toBeTruthy();
    expect(lanceur()).not.toBeNull();
  });
});
