import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService, defaultConfig } from '../../src/services/storage';
import type { Recipe } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

/**
 * Matin 16.11 (n° 36) : « aucune suppression de recette trouvée ». Preuve dans la VRAIE App, avec la vraie page de la recette :
 * Supprimer demande confirmation, Annuler garde la recette, la confirmation appelle `StorageService.deleteRecipe`, la recette
 * quitte le catalogue et la page se ferme. Le magasin est une liste en mémoire (comme AppRoutePile) ; seul le bruit hors sujet
 * est simulé (réseau, chat, palette réduite à ses recettes).
 */
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
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

const CIBLE: Recipe = { ...fixtureRecipe(), id: 'REC-ZZ-SUP', name: 'ZZ TEST — à supprimer' } as Recipe;
const GARDEE: Recipe = { ...fixtureRecipe(), id: 'REC-ZZ-GARDE', name: 'ZZ TEST — gardée' } as Recipe;
let recipes: Recipe[] = [];
const listeners = new Set<() => void>();
const supprimees: string[] = [];

beforeEach(() => {
  window.history.replaceState(null, '', '/?dev-local');
  localStorage.clear();
  StorageService.clearMemoryCache();
  recipes = [CIBLE, GARDEE];
  listeners.clear();
  supprimees.length = 0;
  vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(defaultConfig);
  vi.spyOn(StorageService, 'getRecipes').mockImplementation(() => recipes);
  vi.spyOn(StorageService, 'deleteRecipe').mockImplementation((id: string) => {
    supprimees.push(id);
    recipes = recipes.filter((r) => r.id !== id);
    act(() => { listeners.forEach((l) => l()); });
  });
  vi.spyOn(StorageService, 'subscribe').mockImplementation(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; });
});
afterEach(() => { cleanup(); StorageService.clearMemoryCache(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/'); });

describe('App · suppression d\'une recette depuis sa page', () => {
  it('Supprimer ouvre une feuille de confirmation ; Annuler garde la recette ; Supprimer la recette la retire et ferme la page', async () => {
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: `Ouvrir ${CIBLE.name}` }));
    const rangee = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-page-shell] [data-element="r1-supprimer"]');
      expect(el).toBeTruthy();
      return el!;
    }, { timeout: 12000 });

    // Éloigné de Modifier : Dupliquer d'un côté, Supprimer de l'autre, après toutes les sections.
    expect(within(rangee).getAllByRole('button').map((b) => b.textContent)).toEqual(['Dupliquer', 'Supprimer la recette']);

    fireEvent.click(within(rangee).getByRole('button', { name: 'Supprimer la recette' }));
    expect((await screen.findAllByText('Supprimer cette recette ?')).length).toBeGreaterThan(0);
    expect(supprimees).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(screen.queryByText('Supprimer cette recette ?')).toBeNull());
    expect(supprimees).toEqual([]);

    fireEvent.click(within(rangee).getByRole('button', { name: 'Supprimer la recette' }));
    await screen.findAllByText('Supprimer cette recette ?');
    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer la recette' }).pop()!);

    await waitFor(() => expect(supprimees).toEqual([CIBLE.id]));
    // La page de la recette est fermée ; la recette ne se rouvre plus depuis la recherche ; l'autre reste.
    await waitFor(() => expect(document.querySelector('[data-element="r1-supprimer"]')).toBeNull());
    expect(screen.queryByRole('button', { name: `Ouvrir ${CIBLE.name}` })).toBeNull();
    expect(screen.getByRole('button', { name: `Ouvrir ${GARDEE.name}` })).toBeTruthy();
  }, 30000);
});
