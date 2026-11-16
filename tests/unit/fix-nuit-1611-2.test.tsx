// @vitest-environment jsdom
// Nuit 16.11, constat 2 : « Commencer le brassage » ouvrait la Conduite mais la fiche restait ouverte derrière.
// Fixture FICTIVE (préfixe ZZ).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Batch, Recipe } from '../../src/types';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const PLANIFIE = { id: 'ZZ-100', name: 'ZZ Blonde de soif', style: 'Blonde', volumeL: 24, brewDate: '', plannedBrewDate: '30.11.2026', status: 'planifie', stockAccountingVersion: 1, gravityLog: [], recipeRef: 'zz-r1' } as unknown as Batch;
const RECETTE = { id: 'zz-r1', name: 'ZZ Blonde de soif', style: 'Blonde', volumeL: 24, fermentables: [], hops: [], adjuncts: [], yeast: { name: 'ZZ US-05', qty: 1, unit: 'sachet' } } as unknown as Recipe;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 16, 9));
  vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {});
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([PLANIFIE]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('constat 2 : Commencer le brassage ferme la fiche', () => {
  it('onOpenBrewDay part avec le brassin ET la fiche se ferme', async () => {
    const onOpenBrewDay = vi.fn();
    render(<ProductionTab recipes={[RECETTE]} batches={[PLANIFIE]} brewhouses={[]} activeBrewhouseId="" globalTimeFilter="all"
      openBatchRequest={{ id: 'ZZ-100', at: 1 }} onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()}
      onOpenBrewDay={onOpenBrewDay} onDraftRecipe={vi.fn()} />);
    const commencer = await screen.findByRole('button', { name: /Commencer le brassage/ }, { timeout: 8000 });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(commencer);
    expect(onOpenBrewDay).toHaveBeenCalledTimes(1);
    expect(onOpenBrewDay.mock.calls[0][0].id).toBe('ZZ-100');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
