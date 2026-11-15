import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { BrewerLimitsView, BrewerBudgetCapView, budgetResume, useBrewerBudget } from '../../src/ui/BrewerBudget';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { DEFAULT_BREWER_LIMITS, BREWER_LIMIT_BOUNDS } from '../../functions/src/brewerLimits';
vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { budget: vi.fn(), setBudget: vi.fn() }
}));
vi.mock('../../src/ui/BrewerNotifications', () => ({
  BrewerNotifySwitch: ({ label }: { label?: string }) => <button role="switch" aria-checked="false" aria-label={label ?? 'Me notifier à la réponse'} />
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
const vue = (props: Partial<React.ComponentProps<typeof BrewerLimitsView>> = {}) =>
  render(<BrewerLimitsView onBack={vi.fn()} mode="auto" onMode={vi.fn()} {...props} />);
const expandAdvanced = () => { screen.getByText('Limites quotidiennes et par question').closest('details')!.open = true; };
const enregistrer = () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

describe('Vue Limites du compagnon', () => {
  it('ne configure aucun budget sans validation et montre la réserve commune', async () => {
    vi.mocked(api.budget).mockResolvedValue({ ...state(), monthly: { ...state().monthly, limitMicroChf: null } });
    vi.mocked(api.setBudget).mockResolvedValue({ ...state(), monthly: { ...state().monthly, limitMicroChf: 10_000_000 } });
    const onBack = vi.fn();
    vue({ onBack });
    expect(await screen.findByText(/Choisis et enregistre ton budget/)).toBeInTheDocument();
    expect(api.setBudget).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Plafond du mois'), { target: { value: '10' } });
    expect(api.setBudget).not.toHaveBeenCalled();
    enregistrer();
    await waitFor(() => expect(api.setBudget).toHaveBeenCalledWith(undefined, undefined, 10_000_000));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });
  it('montre l’usage du jour et du mois en chiffres, sans nom de modèle ni de fournisseur', async () => {
    const { container } = vue();
    await screen.findByText('Appels aujourd’hui');
    expect(screen.getByText('Budget du mois')).toBeInTheDocument();
    expect(screen.getByText('0,18')).toBeInTheDocument();
    expect(screen.getByText(/Dont 0,05\sCHF réservés/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Gemini|Flash|Google|USD|\bPro\b/);
  });
  it('conseille une révision des prix sans imposer une maintenance mensuelle', async () => {
    vi.mocked(api.budget).mockResolvedValue({ ...state(), monthly: { ...state().monthly, pricing: 'expired' } });
    vue();
    expect(await screen.findByRole('status')).toHaveTextContent('Révision des tarifs conseillée');
  });
  it('suspend sans modifier les plafonds, par un interrupteur', async () => {
    const data = state();
    vi.mocked(api.budget).mockImplementation(async () => data);
    vi.mocked(api.setBudget).mockImplementation(async (paused) => {
      data.paused = paused!;
      return { ...data };
    });
    vue();
    const interrupteur = await screen.findByRole('switch', { name: 'Suspendre l’IA' });
    expect(interrupteur).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(interrupteur);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Suspendre l’IA' })).toHaveAttribute('aria-checked', 'true'));
    expect(api.setBudget).toHaveBeenCalledWith(true, undefined);
    expect(screen.getByRole('status')).toHaveTextContent('suspendu');
  });
  it('garde une erreur de suspension visible', async () => {
    vi.mocked(api.setBudget).mockRejectedValue(new Error('Network'));
    vue();
    fireEvent.click(await screen.findByRole('switch', { name: 'Suspendre l’IA' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('n’a pas pu être confirmé');
    expect(screen.getByRole('switch', { name: 'Suspendre l’IA' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('enregistrer des plafonds ne réactive pas un compagnon suspendu ailleurs', async () => {
    vi.mocked(api.budget).mockResolvedValue({ ...state(), paused: true });
    vi.mocked(api.setBudget).mockResolvedValue({ ...state(), paused: true });
    vue();
    await screen.findByRole('switch', { name: 'Suspendre l’IA' });
    fireEvent.change(screen.getByLabelText('Plafond par jour'), { target: { value: '40' } });
    enregistrer();
    await waitFor(() =>
      expect(api.setBudget).toHaveBeenCalledWith(undefined, { ...DEFAULT_BREWER_LIMITS, dailyCalls: 40 })
    );
  });
  it('règle aussi les limites par question et ramène un plafond hors bornes', async () => {
    vi.mocked(api.setBudget).mockResolvedValue(state());
    vue();
    await screen.findByLabelText('Appels par question');
    expandAdvanced();
    fireEvent.change(screen.getByLabelText('Appels par question'), { target: { value: '18' } });
    fireEvent.change(screen.getByLabelText('Tokens par question'), { target: { value: '9999999' } });
    enregistrer();
    await waitFor(() =>
      expect(api.setBudget).toHaveBeenCalledWith(undefined, {
        ...DEFAULT_BREWER_LIMITS,
        questionCalls: 18,
        questionTokens: BREWER_LIMIT_BOUNDS.questionTokens.max
      })
    );
  });
  it('change le mode par défaut aussitôt et sans appel serveur', async () => {
    const onMode = vi.fn();
    vue({ onMode });
    fireEvent.click(await screen.findByRole('button', { name: /Approfondi/ }));
    expect(onMode).toHaveBeenCalledWith('deep');
    expect(localStorage.getItem('brewer-chat-mode')).toBe('deep');
    expect(api.setBudget).not.toHaveBeenCalled();
  });
});

describe('Vue Plafond atteint', () => {
  const atteint = () => ({ ...state(), monthly: { ...state().monthly, limitMicroChf: 15_000_000, usedMicroChf: 15_000_000, reservedMicroChf: 0 } });
  it('relève le plafond du mois par le curseur, en micro-CHF', async () => {
    vi.mocked(api.budget).mockResolvedValue(atteint());
    vi.mocked(api.setBudget).mockResolvedValue({ ...atteint(), monthly: { ...atteint().monthly, limitMicroChf: 25_000_000 } });
    const onRaised = vi.fn();
    render(<BrewerBudgetCapView onLimits={vi.fn()} onLater={vi.fn()} onRaised={onRaised} />);
    expect(await screen.findByText('Budget IA du mois atteint')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: 'Plafond du mois en CHF' }), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /Relever à 25\sCHF/ }));
    await waitFor(() => expect(api.setBudget).toHaveBeenCalledWith(undefined, undefined, 25_000_000));
    await waitFor(() => expect(onRaised).toHaveBeenCalled());
  });
  it('offre « Plus tard » et « Régler toutes les limites »', async () => {
    vi.mocked(api.budget).mockResolvedValue(atteint());
    const onLater = vi.fn(), onLimits = vi.fn();
    render(<BrewerBudgetCapView onLimits={onLimits} onLater={onLater} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Plus tard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Régler toutes les limites' }));
    expect(onLater).toHaveBeenCalledOnce();
    expect(onLimits).toHaveBeenCalledOnce();
  });
});

describe('Résumé du budget pour le pied', () => {
  it('écrit les deux textes courts, et ne devine rien quand le serveur n’a rien dit', () => {
    expect(budgetResume(state())).toMatchObject({ appelsJour: `Aujourd’hui 4 sur ${DEFAULT_BREWER_LIMITS.dailyCalls}`, atteint: false });
    expect(budgetResume(state()).mois).toMatch(/^mois 0,18 sur 5\sCHF$/);
    expect(budgetResume({ ...state(), monthly: { ...state().monthly, usedMicroChf: 5_000_000, reservedMicroChf: 0 } }).atteint).toBe(true);
    expect(budgetResume({ ...state(), monthly: { ...state().monthly, limitMicroChf: null } }).mois).toBe('budget du mois à régler');
    expect(budgetResume(undefined)).toEqual({ appelsJour: '', mois: '', atteint: false });
  });
  it('le hook lit une fois et relève le plafond sans jamais rejeter', async () => {
    vi.mocked(api.setBudget).mockRejectedValue(new Error('Network'));
    let sortie!: ReturnType<typeof useBrewerBudget>;
    const Sonde = () => { sortie = useBrewerBudget(); return null; };
    render(<Sonde />);
    await waitFor(() => expect(sortie.status).toBeDefined());
    expect(api.budget).toHaveBeenCalledTimes(1);
    await sortie.saveMonthlyChf(20);
    await waitFor(() => expect(sortie.error).toMatch(/n’a pas pu être confirmé/));
  });
});
