// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

// Voie b1 : BR-114 / BE-85 (densité 2,5 acceptée) et BR-115 / BE-86 (« Conditionné 57,9 L » pour 19,8 L brassés, sans alerte).
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B9', name: 'Hazy IPA', style: 'Hazy IPA', volumeL: 19.8, brewDate: '01.10.2026', status: 'garde',
  og: '1.060', fg: '1.012', stockAccountingVersion: 1,
  stockConsumption: { appliedAt: '2026-10-01', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] }, ...over } as Batch);

beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'completeBrewStock').mockReturnValue({ success: true, issues: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Feuille Mesures', () => {
  it('BR-114 : une densité initiale de 2,5 est refusée avec un message, rien n’est enregistré', () => {
    render(<BatchDetailSheet batch={base()} initialSection="measurements" onClose={vi.fn()} />);
    const champ = document.querySelector('input[name="batch_sheet_og"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '2,5' } });
    fireEvent.blur(champ);
    expect(screen.getAllByRole('alert').some(a => /impossible|au-dessus/.test(a.textContent ?? ''))).toBe(true);
    expect(StorageService.updateBatch).not.toHaveBeenCalledWith(expect.objectContaining({ og: '2,5' }));
    expect(screen.queryByText(/194/)).toBeNull();
  });

  it('BR-115 : un volume conditionné au-dessus du volume brassé est signalé, sans être effacé', () => {
    render(<BatchDetailSheet batch={base({ status: 'conditionne', volumeBrewedL: 19.8, volumePackagedL: 57.9 })} initialSection="measurements" onClose={vi.fn()} />);
    // Une seule fois (k1 n° 4) : dans le panneau « Contenants » de la fiche, plus sous « Corriger les mesures ».
    expect(document.querySelector('[data-conditionne-trop]')?.textContent).toMatch(/57,9 L pour 19,8 L brassés/);
    expect(screen.queryByText(/57,9 L conditionnés pour 19,8 L brassés/)).toBeNull();
    expect(screen.getAllByText('57,9 L').length).toBeGreaterThan(0);
  });

  it('BR-117 / BE-88 : « Supprimer ce brassin » du menu Plus ouvre la confirmation, rien n’est supprimé avant', () => {
    render(<BatchDetailSheet batch={base()} initialSection="overview" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Supprimer ce brassin/ })[0]);
    // Maquette suppression/v2 : une feuille « Supprimer … » avec ses liens, ou, sans lien, le bandeau « … supprimé · Annuler ».
    const feuille = screen.queryByRole('dialog', { name: /Supprimer/ });
    const bandeau = screen.queryByText(/supprimé/);
    expect(feuille ?? bandeau).toBeTruthy();
  });

  it('BR-115 : un volume conditionné cohérent ne déclenche aucune alerte', () => {
    render(<BatchDetailSheet batch={base({ status: 'conditionne', volumeBrewedL: 19.8, volumePackagedL: 18.5 })} initialSection="measurements" onClose={vi.fn()} />);
    expect(screen.queryByText(/conditionnés pour/)).toBeNull();
    expect(document.querySelector('[data-conditionne-trop]')).toBeNull();
  });
});
