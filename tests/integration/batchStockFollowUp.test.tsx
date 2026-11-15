import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
    // p4 : e2a ouvre un brassin annulé sur son Dossier, où une ligne renvoie à la rubrique qui porte le bandeau.
    if (status === 'annule') fireEvent.click(screen.getByRole('button', { name: /Stock à confirmer/ }));
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
    // p4 : e4c — de la garde, « Conditionner » passe par l'échelle des étapes (bouteilles au curseur, volume réparti, plafonné à la cuve de 30 L).
    render(<BatchDetailSheet batch={base({ status: 'garde', og: '1.050', fg: '1.010', stockAccountingVersion: 1, stockConsumption: { ...stockConsumption, completedStages: ['brewday'] } })} initialSection="measurements" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Conditionner · bouteilles et fût/ }));
    // AM n° 6 : le passage en Conditionné demande d'abord le volume conditionné ; sans lui, rien ne part.
    const echelle = within(document.querySelector('[data-echelle]') as HTMLElement);
    fireEvent.click(echelle.getByRole('button', { name: /^Conditionner/ }));
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    for (let i = 0; i < 83; i++) fireEvent.click(echelle.getByRole('button', { name: 'Une bouteille de plus' }));
    fireEvent.click(echelle.getByRole('button', { name: /^Conditionner 27,39 L/ }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'conditionne', volumePackagedL: 27.39 }), 'remaining', false);
    fireEvent.click(screen.getByRole('button', { name: 'Dossier' }));
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
    render(<BatchDetailSheet batch={base({ status: 'planifie', stockAccountingVersion: 1, brewDay: { steps: [], currentIndex: 0, startedAt: 1, pitchedAt: 2 } })} initialSection="measurements" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Étape/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Passer en fermentation' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'fermentation' }), 'brewday', false);
  });
  it('blocks fermentation before pitching and preserves both legacy dates when cancelling the transferred batch', () => {
    const pending = base({ status: 'planifie', stockAccountingVersion: 1, brewDate: '27.09.2026',
      brewDay: { steps: [], currentIndex: 0, phase: 'awaiting-pitch', startedAt: Date.parse('2026-09-20T10:00:00Z'), transferredAt: Date.parse('2026-09-20T16:00:00Z') } });
    render(<BatchDetailSheet batch={pending} initialSection="overview" onClose={vi.fn()} />);
    // p4 : e1a/e4c — l'état se lit dans la pastille du Dossier, la fermentation et l'abandon se jouent dans l'échelle des étapes.
    expect(screen.getByText('En attente d’ensemencement')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Passer en « Fermentation »' })).not.toBeInTheDocument();
    // AM 4 : la fermentation n'est même pas offerte avant l'ajout réel de levure ; la raison est écrite.
    expect(screen.getByText(/consigner l’ajout réel de levure/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer' }));
    fireEvent.click(screen.getByRole('button', { name: /Étape/ }));
    expect(screen.queryByRole('button', { name: /Passer en/ })).not.toBeInTheDocument();
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Abandonner le lot/ }));
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));
    expect(StorageService.updateBatch).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      status: 'annule', plannedBrewDate: '27.09.2026', brewDate: '20.09.2026', brewDay: pending.brewDay
    }));
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(pending.plannedBrewDate).toBeUndefined();
    expect(pending.brewDate).toBe('27.09.2026');
  });
});

describe('TE-41 — le bandeau de stock n’est pas répété dans chaque rubrique', () => {
  it.each(['tasting', 'overview'] as const)('rubrique %s : une ligne renvoie à Mesures, le bandeau complet n’y est pas', section => {
    render(<BatchDetailSheet batch={base()} initialSection={section} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Tout est déjà déstocké' })).not.toBeInTheDocument();
    const renvoi = screen.getByRole('button', { name: /Stock à confirmer/ });
    fireEvent.click(renvoi);
    expect(screen.getByRole('button', { name: 'Tout est déjà déstocké' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Stock à confirmer/ })).not.toBeInTheDocument();
  });
  it('rubrique Mesures : le bandeau complet, une seule fois', () => {
    render(<BatchDetailSheet batch={base()} initialSection="measurements" onClose={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: 'Tout est déjà déstocké' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Stock à confirmer/ })).not.toBeInTheDocument();
  });
});
