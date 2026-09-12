import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  vi.spyOn(StorageService, 'getUiState').mockImplementation((_key, fallback) => fallback);
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('brew budget to doubled-volume batch creation', () => {
  it('creates the full scaled snapshot with its source identity and production metadata, while reserving stock', () => {
    const original = structuredClone(recipe);
    const close = vi.fn();
    render(<QuickActionModal isOpen recipes={[recipe]} onClose={close} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    fireEvent.click(screen.getByRole('button', { name: '50 L' }));
    expect(screen.queryByText('Déduction automatique des stocks')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le brassin' }));
    expect(created).toHaveLength(1);
    const batch = created[0];
    expect(batch).toEqual(expect.objectContaining({ name: recipe.name, style: recipe.style, volumeL: 50, brewDate: recipe.brewDate, status: 'planifie', recipeRef: 'R', stockAccountingVersion: 1, gravityLog: [] }));
    expect(batch.recipeSnapshot).toEqual(expect.objectContaining({ sourceRecipeId: 'R', parentRecipeId: 'R-base', version: 2, volumeL: 50, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.2, preBoilL: 52, brewhouse: rig, notes: recipe.notes }));
    expect(batch.recipeSnapshot.waterPlan).toEqual(expect.objectContaining({ sourceId: 'tap', mashWaterL: 30, spargeWaterL: 31.6, mash: { gypse: 2 }, sparge: { gypse: 4 }, acid: { id: 'lactique', mash: 4, sparge: 6 } }));
    expect(batch.recipeSnapshot.fermentables.map(item => item.weightKg)).toEqual([10, 1]);
    expect(batch.recipeSnapshot.hops[0]).toEqual(expect.objectContaining({ weightG: 40, stage: 'dryHop', dayOffset: 4 }));
    expect(batch.recipeSnapshot.adjuncts[0]).toEqual(expect.objectContaining({ amount: 4, notes: recipe.adjuncts[0].notes }));
    expect(brewBudgetDemands(batch.recipeSnapshot)).toEqual(brewBudgetDemands(scaleBrewBudgetRecipe(recipe, 50, rig)));
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(30);
    expect(batch.stockConsumption).toBeUndefined();
    expect(recipe).toEqual(original);
    expect(close).toHaveBeenCalledOnce();
  });

  it('keeps creation open with a useful error when the new volume has no cuverie', () => {
    vi.mocked(StorageService.getConfig).mockReturnValue({ ...config, brewhouses: [] });
    const close = vi.fn();
    render(<QuickActionModal isOpen recipes={[{ ...recipe, volumeL: 30, brewhouse: undefined }]} onClose={close} />);
    fireEvent.click(screen.getByText('Préparer un brassin'));
    fireEvent.click(screen.getByRole('button', { name: '50 L' }));
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le brassin' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Configure une cuverie');
    expect(created).toEqual([]);
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /30 L/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le brassin' }));
    expect(created).toHaveLength(1);
    expect(created[0].recipeSnapshot.sourceRecipeId).toBe('R');
  });

  it('shows doubled adjuncts in the calculator and preserves the scientific results for a different target cuverie', () => {
    const target = { ...rig, id: 'large', name: 'Grande cuverie', volumeL: 300, efficiencyPct: 85, deadSpaceL: 5 };
    render(<ProductionTab batches={[]} recipes={[recipe]} brewhouses={[rig, target]} activeBrewhouseId={rig.id} globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '50L' }));
    expect(screen.getByText('Vanille · Fermenteur').parentElement).toHaveTextContent('4 gousse');
    expect(screen.getByText('Eau Rinçage (Sparge)').parentElement).toHaveTextContent('31.6');
    fireEvent.click(screen.getByRole('button', { name: '300L' }));
    const scientific = BrewingMath.scaleRecipe(recipe, 300, rig, target);
    const scenario = scaleBrewRecipeScenario(recipe, 300, rig, target);
    expect(screen.getByText('Eau Rinçage (Sparge)').parentElement).toHaveTextContent(String(scientific.spargeWaterL));
    expect(scenario).toEqual(expect.objectContaining({ mashWaterL: scientific.mashWaterL, spargeWaterL: scientific.spargeWaterL, preBoilVolumeL: scientific.preBoilVolumeL, grainAbsorptionL: scientific.grainAbsorptionL }));
    expect(scenario.scaledRecipe.id).toBe('R');
    expect(scenario.scaledRecipe.brewhouse).toEqual(target);
    expect(scenario.scaledRecipe.fermentables).toEqual(scientific.scaledRecipe.fermentables);
  });
});
