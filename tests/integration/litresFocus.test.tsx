/* Voie fx2 : un renvoi « litres » ouvre la fiche du brassin sur Mesures ET pose le focus sur « Saisir le volume conditionné »
   (comme `focusOg` pour la densité). `BatchDetailSheet` reçoit `focus?: 'densite' | 'volume'` ; la feuille Impôt bière a `onNoteLitres`. */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { ImpotBiereSheet } from '../../src/ui/production/ImpotBiereSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null, BrewBudgetDialog: () => null }));

const sansLitres = (over: Partial<Batch> = {}): Batch => ({ id: 'B13', name: 'Stout notée', style: 'Stout', volumeL: 30, brewDate: '15.09.2026', status: 'conditionne',
  stockAccountingVersion: 1, stockConsumption: { appliedAt: '2026-09-15', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] }, ...over } as Batch);
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('BatchDetailSheet › focus', () => {
  it('focus="volume" : Mesures, et le focus sur « Saisir le volume conditionné »', async () => {
    render(<BatchDetailSheet batch={sansLitres()} initialSection="measurements" focus="volume" onClose={vi.fn()} />);
    const bouton = await screen.findByRole('button', { name: 'Saisir le volume conditionné' });
    await waitFor(() => expect(bouton).toHaveFocus());
  });
  it('focus="densite" : le focus sur la densité initiale', async () => {
    render(<BatchDetailSheet batch={sansLitres()} initialSection="measurements" focus="densite" onClose={vi.fn()} />);
    await waitFor(() => expect(document.querySelector('input[name="batch_sheet_og"]')).toHaveFocus());
  });
  it('sans focus : aucun champ ne le prend', async () => {
    render(<BatchDetailSheet batch={sansLitres()} initialSection="measurements" onClose={vi.fn()} />);
    const bouton = await screen.findByRole('button', { name: 'Saisir le volume conditionné' });
    await new Promise(r => setTimeout(r, 450));
    expect(bouton).not.toHaveFocus();
  });
  it('Argent › Impôt sur la bière › « Noter les litres » : la fiche passe sur Mesures, focus sur le volume conditionné', async () => {
    render(<BatchDetailSheet batch={sansLitres()} initialSection="overview" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Argent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Impôt sur la bière' }));
    const feuille = await screen.findByRole('dialog', { name: /Impôt bière/ });
    fireEvent.click(within(feuille).getByRole('button', { name: 'Noter les litres' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Impôt bière/ })).toBeNull());
    const bouton = await screen.findByRole('button', { name: 'Saisir le volume conditionné' });
    await waitFor(() => expect(bouton).toHaveFocus());
  });
});

describe('ImpotBiereSheet › onNoteLitres', () => {
  it('sans litres : « Noter les litres » et « litres à noter › » appellent onNoteLitres, pas onNoteDensity', () => {
    const onNoteLitres = vi.fn(), onNoteDensity = vi.fn();
    render(<ImpotBiereSheet batch={sansLitres()} onClose={vi.fn()} onNoteDensity={onNoteDensity} onNoteLitres={onNoteLitres} />);
    fireEvent.click(screen.getByRole('button', { name: 'Noter les litres' }));
    fireEvent.click(screen.getByRole('button', { name: /litres à noter/ }));
    expect(onNoteLitres).toHaveBeenCalledTimes(2);
    expect(onNoteDensity).not.toHaveBeenCalled();
  });
  it('avec litres, sans densité : « Noter la densité » appelle onNoteDensity', () => {
    const onNoteLitres = vi.fn(), onNoteDensity = vi.fn();
    render(<ImpotBiereSheet batch={sansLitres({ volumePackagedL: 26.6 })} onClose={vi.fn()} onNoteDensity={onNoteDensity} onNoteLitres={onNoteLitres} />);
    fireEvent.click(screen.getByRole('button', { name: 'Noter la densité' }));
    expect(onNoteDensity).toHaveBeenCalledTimes(1);
    expect(onNoteLitres).not.toHaveBeenCalled();
  });
});
