import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { StorageService } from '../../src/services/storage';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { BrewingMath } from '../../src/services/brewingMath';
import { brewBudgetDemands } from '../../src/domain/finance/brewBudget';
import { scaleBrewBudgetRecipe, scaleBrewRecipeScenario } from '../../src/domain/finance/brewBudgetScaling';
import type { AppConfig, Batch, BrewhouseProfile, Recipe, StockItem } from '../../src/types';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const rig: BrewhouseProfile = { id: 'rig', name: 'Cuverie enregistrée', volumeL: 100, efficiencyPct: 75, boilOffRatePct: 0, deadSpaceL: 0, mashRatioLPerKg: 3 };
const recipe: Recipe = {
  id: 'R', parentRecipeId: 'R-base', version: 2, name: 'Pale Ale vanille', style: 'Pale Ale', volumeL: 25, brewDate: '15.09.2026', brewhouse: rig,
  boilMin: 60, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.2,
  fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }, { name: 'Sucre', weightKg: 0.5, kind: 'sucre', use: 'fermentation', dayOffset: 4 }],
  totalGristKg: 5, hops: [{ name: 'Citra', weightG: 20, alpha: 12, stage: 'dryHop', dayOffset: 4 }], yeast: { name: 'US-05', qty: 10, unit: 'g', form: 'sèche' },
  adjuncts: [{ name: 'Vanille', amount: 2, unit: 'gousse', step: 'Fermenteur', notes: 'Ajouter après fermentation.' }],
  waterPlan: { sourceId: 'tap', diRatioPct: 0, mashWaterL: 15, spargeWaterL: 15.8, mash: { gypse: 1 }, sparge: { gypse: 2 }, acid: { id: 'lactique', mash: 2, sparge: 3 }, targetPh: 5.3 },
  fermentation: [], steps: [], notes: ['Recette conservée.']
};
const stock: StockItem = { id: 'M', ref: 'M', name: 'Pils', unit: 'kg', currentStock: 30, category: 'Malt', minStock: 0, reorder: false };
const config = { fiscal: { isTvaRegistered: false }, activeBrewhouseId: 'different', brewhouses: [{ ...rig, id: 'different', efficiencyPct: 60, deadSpaceL: 8 }] } as unknown as AppConfig;
let created: Batch[];

beforeEach(() => {
  created = [];
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [stock], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => created);
  vi.spyOn(StorageService, 'addBatch').mockImplementation(batch => { created.push(structuredClone(batch)); });
  vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation(async (_name, id) => created.find(batch => batch.id === id));
  vi.spyOn(StorageService, 'getUiState').mockImplementation((_key, fallback) => fallback);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('brew budget to doubled-volume batch creation', () => {
  it('creates the full scaled snapshot with its source identity and production metadata, while reserving stock', async () => {
    const original = structuredClone(recipe);
    const close = vi.fn();
    // d1b : la feuille « Brasser » brasse le volume de la recette (le curseur est retiré) ; le doublement se prouve plus bas, au calculateur.
    render(<QuickActionModal isOpen recipes={[recipe]} onClose={close} initialScreen="brew-batch" />);
    fireEvent.click(screen.getByRole('button', { name: /^Brasser$/ }));
    expect(screen.getByText(/le stock se réserve à la planification/)).toBeInTheDocument();
    expect(screen.queryByText('Déduction automatique des stocks')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Planifier/ }));
    expect(created).toHaveLength(1);
    const batch = created[0];
    expect(batch).toEqual(expect.objectContaining({ name: recipe.name, style: recipe.style, volumeL: 25, brewDate: '', plannedBrewDate: expect.stringMatching(/^\d{2}\.\d{2}\.\d{4}$/), status: 'planifie', recipeRef: 'R', stockAccountingVersion: 1, gravityLog: [] }));
    expect(batch.recipeSnapshot).toEqual(expect.objectContaining({ sourceRecipeId: 'R', parentRecipeId: 'R-base', version: 2, volumeL: 25, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.2, brewhouse: rig, notes: recipe.notes }));
    // Au volume de la recette, le plan d’eau reste celui de la recette (mesuré : empâtage 15 L, rinçage 15,8 L, sels et acide inchangés).
    expect(batch.recipeSnapshot.waterPlan).toEqual(expect.objectContaining({ sourceId: 'tap', mashWaterL: 15, spargeWaterL: 15.8, mash: { gypse: 1 }, sparge: { gypse: 2 }, acid: { id: 'lactique', mash: 2, sparge: 3 } }));
    expect(batch.recipeSnapshot.fermentables.map(item => item.weightKg)).toEqual([5, 0.5]);
    expect(batch.recipeSnapshot.hops[0]).toEqual(expect.objectContaining({ weightG: 20, stage: 'dryHop', dayOffset: 4 }));
    expect(batch.recipeSnapshot.adjuncts[0]).toEqual(expect.objectContaining({ amount: 2, notes: recipe.adjuncts[0].notes }));
    expect(brewBudgetDemands(batch.recipeSnapshot)).toEqual(brewBudgetDemands(scaleBrewBudgetRecipe(recipe, 25, rig)));
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(30);
    expect(batch.stockConsumption).toBeUndefined();
    expect(recipe).toEqual(original);
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });

  it('requires explicit installation adoption for an old recipe, including the unchanged volume', () => {
    vi.mocked(StorageService.getConfig).mockReturnValue({ ...config, brewhouses: [] });
    const close = vi.fn();
    render(<QuickActionModal isOpen recipes={[{ ...recipe, volumeL: 30, brewhouse: undefined }]} onClose={close} initialScreen="brew-batch" />);
    fireEvent.click(screen.getByRole('button', { name: /^Brasser$/ }));
    // d1b : le volume n’est plus saisi ; il reste celui de la recette, donc le refus d’adoption vaut pour le volume inchangé.
    fireEvent.click(screen.getByRole('button', { name: /^Planifier/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Modifier la recette');
    expect(created).toEqual([]);
    expect(close).not.toHaveBeenCalled();
  });

  it('shows doubled adjuncts in the calculator and preserves the scientific results for a different target cuverie', () => {
    const target = { ...rig, id: 'large', name: 'Grande cuverie', volumeL: 300, efficiencyPct: 85, deadSpaceL: 5 };
    render(<ProductionTab batches={[]} recipes={[recipe]} brewhouses={[rig, target]} activeBrewhouseId={rig.id} globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} />);
    // Maquette e10c : le volume se tape après « Taper le volume », validé au blur ; les étapes sont dans [data-role="etapes"].
    const taperVolume = (valeur: string) => {
      fireEvent.click(screen.getByRole('button', { name: 'Taper le volume' }));
      const champ = screen.getByRole('textbox', { name: 'Volume cible' });
      fireEvent.change(champ, { target: { value: valeur } });
      fireEvent.blur(champ);
    };
    const etape = (id: string) => document.querySelector(`[data-role="etapes"] [data-etape="${id}"]`) as HTMLElement;
    taperVolume('50');
    const vanille = within(etape('levurage')).getByText('Vanille').closest('.pv-row') as HTMLElement;
    expect(vanille).toHaveTextContent(/Vanille\s*4,00\s*gousse/);
    expect(etape('rincage')).toHaveTextContent('29,6') /* CF-9 : avant ébullition à froid */;
    taperVolume('300');
    const scientific = BrewingMath.scaleRecipe(recipe, 300, rig, target);
    const scenario = scaleBrewRecipeScenario(recipe, 300, rig, target);
    expect(etape('rincage').textContent).toContain(scientific.spargeWaterL.toLocaleString('fr-CH', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace('.', ','));
    expect(scenario).toEqual(expect.objectContaining({ mashWaterL: scientific.mashWaterL, spargeWaterL: scientific.spargeWaterL, preBoilVolumeL: scientific.preBoilVolumeL, grainAbsorptionL: scientific.grainAbsorptionL }));
    expect(scenario.scaledRecipe.id).toBe('R');
    expect(scenario.scaledRecipe.brewhouse).toEqual(target);
    expect(scenario.scaledRecipe.fermentables).toEqual(scientific.scaledRecipe.fermentables);
  });
});
