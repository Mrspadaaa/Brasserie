import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { BrewerBudget } from '../../src/ui/BrewerBudget';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { DEFAULT_BREWER_LIMITS } from '../../functions/src/brewerLimits';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { budget: vi.fn(), setBudget: vi.fn() }
}));
const state = () => ({
  paused: false,
  limits: { ...DEFAULT_BREWER_LIMITS },
  day: '2026-09-07',
  usage: { calls: 4, proCalls: 1, tokens: 4200 }
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.budget).mockResolvedValue(state());
});
afterEach(cleanup);
const expand = () => {
  const panel = screen.getByText('Limites IA').closest('details')!;
  panel.open = true;
  fireEvent(panel, new Event('toggle'));
};
describe('Limites du compagnon', () => {
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
    fireEvent.click(await screen.findByRole('button', { name: 'Suspendre le compagnon' }));
    await screen.findByRole('button', { name: 'Réactiver le compagnon' });
    expect(api.setBudget).toHaveBeenCalledWith(true, undefined);
    expect(screen.getByRole('status')).toHaveTextContent('suspendu');
  });
  it('garde une erreur de suspension visible après la lecture de l’état serveur', async () => {
    vi.mocked(api.setBudget).mockRejectedValue(new Error('Network'));
    render(<BrewerBudget />);
    expand();
    fireEvent.click(await screen.findByRole('button', { name: 'Suspendre le compagnon' }));
    await waitFor(() => expect(api.budget).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('alert')).toHaveTextContent('n’a pas pu être confirmé');
    expect(screen.getByRole('button', { name: 'Suspendre le compagnon' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('enregistrer des plafonds ne réactive pas un compagnon suspendu ailleurs', async () => {
    vi.mocked(api.setBudget).mockResolvedValue({ ...state(), paused: true });
    render(<BrewerBudget />);
    expand();
    await screen.findByRole('button', { name: 'Suspendre le compagnon' });
    const inner = screen.getByText('Modifier les plafonds du jour').closest('details')!;
    inner.open = true;
    fireEvent(inner, new Event('toggle'));
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
});
