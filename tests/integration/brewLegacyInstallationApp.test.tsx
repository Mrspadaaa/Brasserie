import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { saveRecipeConfirmed } from '../../src/services/recipeSave';
import type { Recipe } from '../../src/types';
import type { Route } from '../../src/pages/useFullScreenRoute';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/migration', () => ({ runMigrationIfNeeded: async () => ({ ran: false }) }));
vi.mock('../../src/services/recipeSave', () => ({ saveRecipeConfirmed: vi.fn(async (recipe: Recipe) => recipe) }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/BrewerActivity', () => ({ BrewerActivity: () => null }));
vi.mock('../../src/ui/PersistenceStatus', () => ({ PersistenceStatus: () => null }));
vi.mock('../../src/ui/CommandPalette', () => ({ CommandPalette: () => null }));
vi.mock('../../src/pages/useFullScreenRoute', () => ({
  useFullScreenRoute: () => {
    const [route, setRoute] = React.useState<Route>({ view: 'recipe', recipeId: 'legacy' });
    return { route, open: setRoute, close: () => setRoute({ view: 'tabs' }) };
  }
}));
vi.mock('../../src/pages/RecipePage', () => ({
  RecipePage: ({ onBrew, onEdit }: { onBrew: () => void; onEdit: () => void }) => <>
    <button type="button" onClick={onBrew}>Lancer depuis la recette</button>
    <button type="button" onClick={onEdit}>Modifier la recette</button>
  </>
}));
vi.mock('../../src/pages/BrewWizard', () => ({
  BrewWizard: ({ seed, onSave }: { seed: { recipe: Recipe }; onSave: (recipe: Recipe, thenBrew: boolean) => Promise<void> }) => {
    const [error, setError] = React.useState('');
    return <>
      <button type="button" onClick={() => void onSave(seed.recipe, true).catch(cause => setError(cause.message))}>Enregistrer et préparer un brassin</button>
      {error && <p role="alert">{error}</p>}
    </>;
  }
}));

const active = { ...defaultConfig.brewhouses[0], id: 'active', volumeL: 24,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences } };

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  localStorage.clear();
  StorageService.clearMemoryCache();
  vi.spyOn(StorageService, 'startSync').mockImplementation(() => {});
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue({ ...defaultConfig, brewhouses: [active], activeBrewhouseId: active.id });
  vi.spyOn(StorageService, 'addBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.mocked(saveRecipeConfirmed).mockClear();
});
afterEach(() => { cleanup(); StorageService.clearMemoryCache(); vi.restoreAllMocks(); });

describe('contrôle App avant le nouveau lancement d’une ancienne recette', () => {
  it.each([false, true])('ne crée aucun brassin depuis le planificateur avant adoption (ancien profil : %s)', async withProfile => {
    const legacy: Recipe = { ...fixtureRecipe(), id: 'legacy', volumeL: 30,
      ...(withProfile ? { brewhouse: { ...active, equipment: undefined, preferences: undefined } } : {}) };
    const before = structuredClone(legacy);
    vi.spyOn(StorageService, 'getRecipes').mockReturnValue([legacy]);
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Lancer depuis la recette' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Créer le brassin à brasser' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Adapter à mon matériel actuel');
    expect(saveRecipeConfirmed).not.toHaveBeenCalled();
    expect(StorageService.addBatch).not.toHaveBeenCalled();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(legacy).toEqual(before);
  });

  it.each([false, true])('ne sauvegarde pas la recette en préparant depuis l’assistant avant adoption (ancien profil : %s)', async withProfile => {
    const legacy: Recipe = { ...fixtureRecipe(), id: 'legacy', volumeL: 30,
      ...(withProfile ? { brewhouse: { ...active, equipment: undefined, preferences: undefined } } : {}) };
    vi.spyOn(StorageService, 'getRecipes').mockReturnValue([legacy]);
    const { App } = await import('../../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier la recette' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer et préparer un brassin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Adapter à mon matériel actuel');
    expect(saveRecipeConfirmed).not.toHaveBeenCalled();
    expect(StorageService.addBatch).not.toHaveBeenCalled();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Créer le brassin à brasser' })).not.toBeInTheDocument();
  });
});
