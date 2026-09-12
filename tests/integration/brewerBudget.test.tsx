import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { BrewerBudget } from '../../src/ui/BrewerBudget';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { DEFAULT_BREWER_LIMITS, BREWER_LIMIT_BOUNDS } from '../../functions/src/brewerLimits';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { budget: vi.fn(), setBudget: vi.fn() }
}));
const state = () => ({
  paused: false,
  limits: { ...DEFAULT_BREWER_LIMITS },
  day: '2026-09-07',
  usage: { calls: 4, proCalls: 1, tokens: 4200 },
  monthly: { month: '2026-09', limitMicroChf: 5_000_000 as number | null, usedMicroChf: 125_000, reservedMicroChf: 50_000, pricing: 'current' as 'current' | 'expired', pricingVerifiedAt: '2026-09-09', pricingValidUntil: '2026-10-09T00:00:00+02:00' }
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.budget).mockResolvedValue(state());
});
afterEach(cleanup);
const expandAdvanced = () => { screen.getByText('Limites quotidiennes et par question').closest('details')!.open = true; };
const expand = () => {
  const panel = screen.getByText('Limites IA').closest('details')!;
  panel.open = true;
  fireEvent(panel, new Event('toggle'));
};
describe('Limites du compagnon', () => {
  it('ne configure aucun budget sans validation et montre la réserve commune', async () => {
    vi.mocked(api.budget).mockResolvedValue({ ...state(), monthly: { ...state().monthly, limitMicroChf: null } });
    vi.mocked(api.setBudget).mockResolvedValue({ ...state(), monthly: { ...state().monthly, limitMicroChf: 10_000_000 } });
    render(<BrewerBudget />); expand();
    expect(await screen.findByText(/Le montant proposé n’est pas encore activé/)).toBeInTheDocument();
    expect(api.setBudget).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '10 CHF' }));
    expect(api.setBudget).not.toHaveBeenCalled();
    fireEvent.submit(screen.getByRole('button', { name: 'Enregistrer le budget mensuel' }).closest('form')!);
    await waitFor(() => expect(api.setBudget).toHaveBeenCalledWith(undefined, undefined, 10_000_000));
    expect(await screen.findByText(/comptabilisés sur 10 CHF/)).toBeInTheDocument();
    expect(screen.getByText(/Dont 0.05 CHF réservés/)).toBeInTheDocument();
  });
  it('conseille une révision des prix sans imposer une maintenance mensuelle', async () => {
    vi.mocked(api.budget).mockResolvedValue({ ...state(), monthly: { ...state().monthly, pricing: 'expired' } });
    render(<BrewerBudget />); expand();
    expect(await screen.findByRole('status')).toHaveTextContent('Révision des tarifs conseillée');
  });
  it('charge à la demande et permet de suspendre sans modifier les plafonds', async () => {
    const data = state();
    vi.mocked(api.budget).mockImplementation(async () => data);
    vi.mocked(api.setBudget).mockImplementation(async (paused) => {
      data.paused = paused!;
      return { ...data };
    });
    render(<BrewerBudget />);
    expect(api.budget).not.toHaveBeenCalled();
    expand();
    fireEvent.click(await screen.findByRole('button', { name: 'Suspendre l’IA' }));
    await screen.findByRole('button', { name: 'Réactiver l’IA' });
    expect(api.setBudget).toHaveBeenCalledWith(true, undefined);
    expect(screen.getByRole('status')).toHaveTextContent('suspendu');
  });
  it('garde une erreur de suspension visible après la lecture de l’état serveur', async () => {
    vi.mocked(api.setBudget).mockRejectedValue(new Error('Network'));
    render(<BrewerBudget />);
    expand();
    fireEvent.click(await screen.findByRole('button', { name: 'Suspendre l’IA' }));
    await waitFor(() => expect(api.budget).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('alert')).toHaveTextContent('n’a pas pu être confirmé');
    expect(screen.getByRole('button', { name: 'Suspendre l’IA' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('enregistrer des plafonds ne réactive pas un compagnon suspendu ailleurs', async () => {
    vi.mocked(api.setBudget).mockResolvedValue({ ...state(), paused: true });
    render(<BrewerBudget />);
    expand();
    await screen.findByRole('button', { name: 'Suspendre l’IA' });
    expandAdvanced();
    fireEvent.change(screen.getByLabelText('Appels Gemini'), { target: { value: '40' } });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Enregistrer les plafonds' }).closest('form')!
    );
    await waitFor(() =>
      expect(api.setBudget).toHaveBeenCalledWith(undefined, {
        ...DEFAULT_BREWER_LIMITS,
        dailyCalls: 40
      })
    );
  });
  it('règle aussi les limites par question et ramène un plafond hors bornes', async () => {
    vi.mocked(api.setBudget).mockResolvedValue(state());
    render(<BrewerBudget />);
    expand();
    await screen.findByLabelText('Appels par question');
    expandAdvanced();
    fireEvent.change(await screen.findByLabelText('Appels par question'), {
      target: { value: '18' }
    });
    fireEvent.change(screen.getByLabelText('Tokens par question'), {
      target: { value: '9999999' }
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Enregistrer les plafonds' }).closest('form')!
    );
    await waitFor(() =>
      expect(api.setBudget).toHaveBeenCalledWith(undefined, {
        ...DEFAULT_BREWER_LIMITS,
        questionCalls: 18,
        questionTokens: BREWER_LIMIT_BOUNDS.questionTokens.max
      })
    );
  });
});
