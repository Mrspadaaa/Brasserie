import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { recipeInstallationIssues } from '../../src/domain/recipeInstallation';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { brewerJobs } from '../../src/services/brewerJobs';
import type { Batch, BrewhouseProfile, Recipe } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import { allerEtape } from '../helpers/wizard';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const activeProfile: BrewhouseProfile = {
  id: 'current-rig', name: 'Installation actuelle', volumeL: 24, efficiencyPct: 75,
  boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const config = { ...defaultConfig, brewhouses: [activeProfile], activeBrewhouseId: activeProfile.id };
function legacyRecipe(withProfile = false, volumeL = 30): Recipe {
  return {
    ...fixtureRecipe(), id: 'legacy', name: 'Ancienne pale', volumeL,
    ...(withProfile ? { brewhouse: { ...activeProfile, equipment: undefined, preferences: undefined } } : {}),
    fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }]
  };
}
let created: Batch[];
let history: Batch;

beforeEach(() => {
  localStorage.clear();
  created = [];
  history = { id: 'OLD', name: 'Brassin conservé', style: 'Pale Ale', volumeL: 30,
    brewDate: '01.09.2026', status: 'garde', recipeSnapshot: captureSnapshot(legacyRecipe()) };
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => [history, ...created]);
  vi.spyOn(StorageService, 'addBatch').mockImplementation(batch => { created.push(structuredClone(batch)); });
  vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation(async (_name, id) => created.find(batch => batch.id === id));
  vi.spyOn(StorageService, 'getUiState').mockImplementation((_key, fallback) => fallback);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
});
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

describe('nouveau lancement depuis une recette sans capacités figées', () => {
  it.each([
    { withProfile: false, targetL: 30 }, { withProfile: false, targetL: 24 },
    { withProfile: true, targetL: 30 }, { withProfile: true, targetL: 24 }
  ])('refuse la source legacy avant tout changement vers $targetL L (profil : $withProfile)', ({ withProfile, targetL }) => {
    const recipe = legacyRecipe(withProfile), original = structuredClone(recipe), oldBatch = structuredClone(history);
    const close = vi.fn();
    render(<QuickActionModal isOpen initialScreen="brew-batch" recipes={[recipe]} onClose={close} />);
    const volume = screen.getByLabelText('Volume du brassin');
    fireEvent.change(volume, { target: { value: String(targetL) } });
    fireEvent.blur(volume);
    fireEvent.click(screen.getByRole('button', { name: 'Créer le brassin à brasser' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Modifier la recette');
    expect(screen.getByRole('alert')).toHaveTextContent('Adapter à mon matériel actuel');
    expect(StorageService.addBatch).not.toHaveBeenCalled();
    expect(FirestoreRepo.waitForDocument).not.toHaveBeenCalled();
    expect(created).toEqual([]);
    expect(recipe).toEqual(original);
    expect(history).toEqual(oldBatch);
    expect(close).not.toHaveBeenCalled();
  });

  it.each([{ withProfile: false, volumeL: 19 }, { withProfile: true, volumeL: 26 }])('adopte le matériel en conservant les $volumeL L choisis (ancien profil : $withProfile)', async ({ withProfile, volumeL }) => {
    const original = legacyRecipe(withProfile, volumeL), before = structuredClone(original), oldBatch = structuredClone(history);
    const save = vi.fn();
    const editor = render(<BrewWizard localOnly seed={{ recipe: original }} config={config}
      stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
      onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Adapter à mon matériel actuel · Installation actuelle' })).toBeVisible();
    allerEtape(/^Récapitulatif$/);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true })));
    expect(save).toHaveBeenCalledOnce();
    const unchanged = save.mock.calls[0][0] as Recipe;
    expect(unchanged.brewhouse).toEqual(original.brewhouse);
    expect(unchanged.installation?.manualWaterSplit).toBeUndefined();
    expect(recipeInstallationIssues(unchanged, activeProfile).join(' ')).toContain('Adapter à mon matériel actuel');
    allerEtape(/^Identité$/);
    fireEvent.click(screen.getByRole('button', { name: 'Adapter à mon matériel actuel · Installation actuelle' }));
    expect(screen.queryByRole('button', { name: 'Adapter à mon matériel actuel · Installation actuelle' })).not.toBeInTheDocument();
    allerEtape(/^Récapitulatif$/);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true })));
    const adapted = save.mock.calls[1][0] as Recipe;
    expect(adapted.volumeL).toBe(volumeL);
    expect(adapted.brewhouse?.equipment).toEqual(activeProfile.equipment);
    expect(adapted.brewhouse?.preferences).toEqual(activeProfile.preferences);
    expect(recipeInstallationIssues(adapted, activeProfile)).toEqual([]);
    expect(original).toEqual(before);
    editor.unmount();
    const close = vi.fn();
    render(<QuickActionModal isOpen initialScreen="brew-batch" recipes={[adapted]} onClose={close} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Autre date' }));
    fireEvent.change(screen.getByLabelText('Jour prévu'), { target: { value: '2026-10-24' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le brassin à brasser' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(created).toHaveLength(1);
    expect(created[0].volumeL).toBe(volumeL);
    expect(created[0]).toMatchObject({ plannedBrewDate: '24.10.2026', brewDate: '', status: 'planifie' });
    expect(created[0].brewDay).toBeUndefined();
    expect(created[0].recipeSnapshot?.brewhouse?.equipment).toEqual(activeProfile.equipment);
    expect(history).toEqual(oldBatch);
  });
});
