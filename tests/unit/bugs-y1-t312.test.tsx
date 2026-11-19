// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';
import { effacerBandeau } from '../../src/ui/suppression/bandeau';

// Voie y1, T3-12 (en ligne, 19.11) : Brassin › Plus › « Supprimer ce brassin » supprimait sans confirmation ni retour visible.
// Un brassin planifié n'a aucun lien : maquette suppression/v2 = suppression directe, MAIS le bandeau « … supprimé · Annuler » doit rester à l'écran
// au-delà d'une seconde (6 s) et « Annuler » doit rétablir le brassin.
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const lot = (): Batch => ({ id: 'ZZ-LOT-020', name: 'ZZ TEST — recette', style: 'Pale Ale', volumeL: 20, brewDate: '20.11.2026', plannedBrewDate: '2026-11-20', status: 'planifie' } as unknown as Batch);

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'deleteBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'addBatch').mockImplementation(() => {});
});
afterEach(() => { effacerBandeau(); cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('T3-12 : supprimer un brassin planifié', () => {
  it('rend un retour visible (bandeau « supprimé · Annuler ») encore là après 1,2 s, et Annuler rétablit le brassin', async () => {
    const onClose = vi.fn();
    render(<BatchDetailSheet batch={lot()} initialSection="overview" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Budget, compagnon, supprimer' }));
    const gestes = screen.getAllByRole('button', { name: /Supprimer ce brassin/ });
    await act(async () => { fireEvent.click(gestes[0]); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    // soit une feuille de confirmation, soit le bandeau avec Annuler, à l'écran
    const bandeau = screen.queryByTestId('bandeau-suppression');
    const feuille = screen.queryByRole('dialog', { name: /Supprimer/ });
    expect(feuille ?? bandeau, 'ni confirmation ni bandeau « Annuler » à 1,2 s').toBeTruthy();
    if (bandeau) {
      expect(bandeau.textContent).toMatch(/ZZ-LOT-020 supprimé/);
      expect(StorageService.deleteBatch).toHaveBeenCalledWith('ZZ-LOT-020');
      fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
      expect(StorageService.addBatch).toHaveBeenCalled();
    }
  });
});
