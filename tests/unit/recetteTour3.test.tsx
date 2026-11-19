// @vitest-environment jsdom
/**
 * T2B-1 (tour 3, 19.11) : Brassins › Brasser depuis une recette dont le matériel « n'est pas figé ». Avant : un message rouge au
 * clic, « Planifier » (« quand même » compris) actif mais sans effet. Maintenant : le bouton est désactivé tant que la recette n'a pas
 * le matériel actuel, et « Adapter à mon matériel actuel » l'adopte sur place, pour ce brassin, sans quitter la feuille ni changer la recette.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { adaptRecipeEquipment } from '../../src/domain/adaptRecipeEquipment';
import { recipeInstallationAdoptionIssue } from '../../src/domain/recipeInstallation';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { brewerJobs } from '../../src/services/brewerJobs';
import type { Batch, BrewhouseProfile, Recipe } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const profil: BrewhouseProfile = {
  id: 'current-rig', name: 'Installation actuelle', volumeL: 24, efficiencyPct: 75,
  boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const sansMateriel: BrewhouseProfile = { ...profil, equipment: undefined, preferences: undefined };
const recetteLegacy = (volumeL = 24): Recipe => ({
  ...fixtureRecipe(), id: 'legacy', name: 'Ancienne pale', volumeL, fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }]
});
let created: Batch[];

function brancher(active: BrewhouseProfile) {
  const config = { ...defaultConfig, brewhouses: [active], activeBrewhouseId: active.id };
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
}
beforeEach(() => {
  localStorage.clear();
  created = [];
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => created);
  vi.spyOn(StorageService, 'addBatch').mockImplementation(batch => { created.push(structuredClone(batch)); });
  vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation(async (_name, id) => created.find(batch => batch.id === id));
  vi.spyOn(StorageService, 'getUiState').mockImplementation((_key, fallback) => fallback);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
});
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

const planifier = () => screen.getByRole('button', { name: /^Planifier/ });
const adapter = () => screen.queryByRole('button', { name: /Adapter à mon matériel actuel/ });

describe('T2B-1 — planifier depuis une recette dont le matériel n’est pas figé', () => {
  it('matériel connu : « Planifier » est désactivé tant que la recette n’est pas adaptée, avec un bouton direct pour l’adapter', () => {
    brancher(profil);
    render(<QuickActionModal isOpen initialScreen="brew-batch" recipes={[recetteLegacy()]} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Brasser$/ }));
    expect(planifier()).toBeDisabled();
    expect(adapter()).toBeVisible();
    fireEvent.click(planifier());
    expect(created).toEqual([]);
  });

  it('« Adapter à mon matériel actuel » : sans quitter la feuille, le brassin se planifie avec ce matériel, la recette ne change pas', async () => {
    brancher(profil);
    const recette = recetteLegacy(), avant = structuredClone(recette);
    const close = vi.fn();
    render(<QuickActionModal isOpen initialScreen="brew-batch" recipes={[recette]} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: /^Brasser$/ }));
    fireEvent.click(adapter()!);
    expect(close).not.toHaveBeenCalled();
    expect(adapter()).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(planifier()).toBeEnabled();
    fireEvent.click(planifier());
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(created).toHaveLength(1);
    expect(created[0].volumeL).toBe(24);
    expect(created[0].status).toBe('planifie');
    expect(created[0].recipeSnapshot?.brewhouse?.equipment).toEqual(profil.equipment);
    expect(recette).toEqual(avant);
    expect(recipeInstallationAdoptionIssue(recette, profil)).toBeDefined();
  });

  it('matériel non renseigné : « Planifier » désactivé, aucun bouton d’adaptation, rien n’est écrit', () => {
    brancher(sansMateriel);
    render(<QuickActionModal isOpen initialScreen="brew-batch" recipes={[recetteLegacy()]} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Brasser$/ }));
    expect(planifier()).toBeDisabled();
    expect(adapter()).toBeNull();
    fireEvent.click(planifier());
    expect(created).toEqual([]);
  });

  it('une recette au matériel figé garde son geste : « Planifier » actif, aucun bouton d’adaptation', async () => {
    brancher(profil);
    const figee: Recipe = adaptRecipeEquipment(recetteLegacy(), profil, 24);
    const close = vi.fn();
    render(<QuickActionModal isOpen initialScreen="brew-batch" recipes={[figee]} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: /^Brasser$/ }));
    expect(adapter()).toBeNull();
    expect(planifier()).toBeEnabled();
    fireEvent.click(planifier());
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(created).toHaveLength(1);
  });
});
