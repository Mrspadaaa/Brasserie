import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => <button>Estimer le budget de ce brassin</button> }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'IPA', style: 'IPA', volumeL: 30, brewDate: '01.09.2026', status: 'fermentation', ...over });
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'completeBrewStock').mockReturnValue({ success: true, issues: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('production stock reconciliation', () => {
  it.each(['planifie', 'annule'] as const)('asks about historical stock even when status is %s and never consumes on confirmation', status => {
    render(<BatchDetailSheet batch={base({ status })} onClose={vi.fn()} />);
    expect(screen.getByText('Stock de ce brassin à confirmer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Déstocker le brassage maintenant' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Le stock n’a pas été déduit' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status }), 'historical-unconsumed', true);
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });
  it('requires an explicit confirmation before marking a historical batch already consumed', () => {
    render(<BatchDetailSheet batch={base()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tout est déjà déstocké' }));
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le stock déjà retiré' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ id: 'B1' }), 'historical-already', true);
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('quantités de stock sont restées inchangées');
  });
  it('consumes historical brew-day quantities only after explicit confirmation', () => {
    render(<BatchDetailSheet batch={base()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Déstocker le brassage maintenant' }));
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et déstocker' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ id: 'B1' }), 'brewday', true);
  });
  it('consumes remaining fermentation additions when entering conditioning', () => {
    const stockConsumption = { appliedAt: '2026-09-01', eventId: 'brew', completedStages: ['brewday'] as const, items: [], pendingItems: [{ stockItemRef: 'H', quantity: 60, unit: 'g' }] };
    render(<BatchDetailSheet batch={base({ status: 'garde', stockAccountingVersion: 1, stockConsumption: { ...stockConsumption, completedStages: ['brewday'] } })} initialSection="overview" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Passer en « Conditionné »' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'conditionne' }), 'remaining', false);
    expect(screen.getByRole('button', { name: 'Estimer le budget de ce brassin' })).toBeInTheDocument();
  });
  it('keeps actionable stock issues visible when an attempted deduction needs review', () => {
    vi.mocked(StorageService.completeBrewStock).mockReturnValue({ success: false, issues: ['Citra : unité incompatible'] });
    render(<BatchDetailSheet batch={base({ stockAccountingVersion: 1, stockReviewIssues: ['Citra : unité incompatible'] })} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Revérifier et déstocker' }));
    expect(screen.getByText('Citra : unité incompatible')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Le stock attend les vérifications');
  });
  it('a direct planned-to-fermentation transition follows the stock service', () => {
    render(<BatchDetailSheet batch={base({ status: 'planifie', stockAccountingVersion: 1 })} initialSection="overview" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Passer en « Fermentation »' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'fermentation' }), 'brewday', false);
  });
});
