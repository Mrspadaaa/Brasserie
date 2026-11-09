import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const batch = (over: Partial<Batch> = {}): Batch => ({ id: 'B12', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, volumePackagedL: 26.6, brewDate: '15.09.2026', status: 'fermentation',
  stockAccountingVersion: 1, stockConsumption: { appliedAt: '2026-09-15', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] }, ...over } as Batch);
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Fiche du brassin › Impôt bière', () => {
  it('17. le bouton « Impôt bière » ouvre la feuille ; « Noter la densité » la ferme, ouvre Mesures et pose le focus sur la densité initiale', async () => {
    render(<BatchDetailSheet batch={batch()} initialSection="overview" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Impôt bière/ }));
    const feuille = await screen.findByRole('dialog', { name: /Impôt bière/ });
    expect(within(feuille).getByText('Pale Ale de septembre')).toBeVisible();
    fireEvent.click(within(feuille).getByRole('button', { name: 'Noter la densité' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Impôt bière/ })).toBeNull());
    await waitFor(() => expect(document.querySelector('input[name="batch_sheet_og"]')).toHaveFocus());
  });

  it('17b. la densité se saisit par le chemin existant : enregistrée, alcool inchangé sans FG', async () => {
    render(<BatchDetailSheet batch={batch({ fg: '1.010' })} initialSection="measurements" onClose={vi.fn()} />);
    const champ = document.querySelector('input[name="batch_sheet_og"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '1.048' } });
    fireEvent.blur(champ);
    expect(StorageService.updateBatch).toHaveBeenCalledWith(expect.objectContaining({ og: '1.048', abv: expect.stringMatching(/%$/) }));
  });
});
