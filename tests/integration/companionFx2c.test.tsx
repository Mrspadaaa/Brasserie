import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewerActivity } from '../../src/ui/BrewerActivity';
import { BandeauPlafond, BrewerBudgetCapView, BrewerLimitsView, PLACEHOLDER_PLAFOND } from '../../src/ui/BrewerBudget';
import { BrewerChat as api } from '../../src/services/brewerChat';
import { brewerJobs } from '../../src/services/brewerJobs';
import { DEFAULT_BREWER_LIMITS } from '../../functions/src/brewerLimits';
import type { BrewerJob } from '../../functions/src/companionTypes';

vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { userKey: vi.fn(), history: vi.fn(), activity: vi.fn(), reset: vi.fn(), submit: vi.fn(), status: vi.fn(), markRead: vi.fn(), retry: vi.fn(), budget: vi.fn(), setBudget: vi.fn() },
  brewerChatError: () => 'Erreur de connexion.'
}));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer, onClose }: any) => open ? <div role="dialog" aria-label={title}>
    {children}{footer}<button onClick={onClose}>Fermer {title}</button>
  </div> : null
}));
vi.mock('../../src/ui/BrewerNotifications', () => ({
  BrewerNotifySwitch: ({ label }: { label?: string }) => <button role="switch" aria-checked="false" aria-label={label ?? 'Me notifier à la réponse'} />
}));

const job = (id: string, recipe: string, o: Partial<BrewerJob> & Record<string, unknown> = {}): BrewerJob => ({
  id: id.repeat(64), operationId: `operation-${id.repeat(20)}`, scope: { kind: 'recipe', id: recipe },
  generation: 0, question: `Question ${id}`, label: recipe, status: 'done', stage: 'saving',
  createdAt: Number(id) || 1, updatedAt: 1, attempt: 1, readAt: 1, ...o
});
beforeEach(() => {
  brewerJobs.stop();
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(api.userKey).mockResolvedValue('fx2c-test');
  vi.mocked(api.history).mockResolvedValue([]);
  vi.mocked(api.activity).mockImplementation(async () => brewerJobs.snapshot().jobs);
  vi.mocked(api.markRead).mockResolvedValue(undefined);
  vi.mocked(api.status).mockResolvedValue({});
  vi.mocked(api.reset).mockResolvedValue({ generation: 1 });
});
afterEach(() => { cleanup(); brewerJobs.stop(); });

/* La feuille s'ouvre par l'événement que le compagnon envoie (BrewerChat.ouvrirConversations), avec la portée d'où l'on vient. */
const ouvrirConversations = async (detail?: unknown) => {
  await waitFor(() => expect(api.userKey).toHaveBeenCalled());
  await act(async () => { window.dispatchEvent(new CustomEvent('brewer-inbox-open', detail ? { detail } : undefined)); });
  await screen.findByRole('dialog', { name: 'Mes conversations' });
};

describe('Mes conversations (fx2c)', () => {
  it('a une flèche « Retour au fil » qui ferme la feuille', async () => {
    vi.mocked(api.activity).mockResolvedValue([job('1', 'REC-A')]);
    render(<BrewerActivity />);
    await ouvrirConversations();
    expect(screen.getByRole('dialog', { name: 'Mes conversations' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au fil' }));
    expect(screen.queryByRole('dialog', { name: 'Mes conversations' })).not.toBeInTheDocument();
  });
  it('ajoute le niveau du verdict (attention) à « Réponse prête », sans l’inventer quand le tour manque', async () => {
    const avecTour = job('1', 'REC-A', { turn: { advice: { level: 'attention' } } } as never);
    const sansTour = job('2', 'REC-B');
    vi.mocked(api.activity).mockResolvedValue([avecTour, sansTour]);
    render(<BrewerActivity />);
    await ouvrirConversations();
    expect(screen.getByText('Réponse prête · attention')).toBeVisible();
    expect(screen.getByText('Réponse prête')).toBeVisible();
  });
  it('dit « rien compté » seulement pour un échec de plafond de budget', async () => {
    const plafond = job('1', 'REC-A', { status: 'error', error: { code: 'ai-monthly-limit', message: 'Budget atteint.', retryable: true } });
    const autre = job('2', 'REC-B', { status: 'error', error: { code: 'analysis-failed', message: 'Échec.', retryable: true } });
    vi.mocked(api.activity).mockResolvedValue([plafond, autre]);
    render(<BrewerActivity />);
    await ouvrirConversations();
    expect(screen.getByText('Échec · rien compté')).toBeVisible();
    expect(screen.getByText('Échec · à relancer')).toBeVisible();
  });
  it('montre « Repartir à zéro » pour la conversation d’où l’on vient, la nomme, et la remet à zéro après confirmation', async () => {
    const a = job('1', 'REC-A'), b = job('2', 'REC-B');
    vi.mocked(api.activity).mockResolvedValue([a, b]);
    render(<BrewerActivity />);
    await ouvrirConversations({ scope: { kind: 'recipe', id: 'REC-B' } });
    fireEvent.click(screen.getByRole('button', { name: /Repartir à zéro · nouvelle conversation/ }));
    expect(api.reset).not.toHaveBeenCalled();
    expect(screen.getByText(/Les échanges de « REC-B » seront effacés/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Repartir à zéro' }));
    await waitFor(() => expect(api.reset).toHaveBeenCalledWith({ kind: 'recipe', id: 'REC-B' }, 0, expect.any(String)));
    await waitFor(() => expect(brewerJobs.snapshot().jobs.map((j) => j.scope.id)).toEqual(['REC-A']));
  });
  it('ne montre pas « Repartir à zéro » quand la conversation d’origine est inconnue, et laisse annuler', async () => {
    vi.mocked(api.activity).mockResolvedValue([job('1', 'REC-A')]);
    render(<BrewerActivity />);
    await ouvrirConversations();
    expect(screen.queryByRole('button', { name: /Repartir à zéro/ })).not.toBeInTheDocument();
    await act(async () => { window.dispatchEvent(new CustomEvent('brewer-inbox-open', { detail: { scope: { kind: 'recipe', id: 'REC-A' } } })); });
    fireEvent.click(screen.getByRole('button', { name: /Repartir à zéro · nouvelle conversation/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(api.reset).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Repartir à zéro · nouvelle conversation/ })).toBeVisible();
  });
});

const etat = () => ({
  paused: false,
  limits: { ...DEFAULT_BREWER_LIMITS },
  day: '2026-11-14',
  usage: { calls: 4, proCalls: 1, tokens: 4200 },
  monthly: { month: '2026-11', limitMicroChf: 15_000_000 as number | null, usedMicroChf: 2_100_000, reservedMicroChf: 0, pricing: 'current' as const, pricingVerifiedAt: '2026-11-15', pricingValidUntil: '2026-12-15T00:00:00+01:00' }
});

describe('Limites IA (fx2c)', () => {
  beforeEach(() => { vi.mocked(api.budget).mockResolvedValue(etat()); });
  it('a une flèche « Retour au fil », parle de questions (pas d’appels) et n’a plus de réglage repliable', async () => {
    const onBack = vi.fn();
    const { container } = render(<BrewerLimitsView onBack={onBack} mode="auto" onMode={vi.fn()} />);
    await screen.findByText('Questions aujourd’hui');
    expect(screen.getByText('questions')).toBeVisible();
    expect(container.textContent).not.toMatch(/Appels aujourd|\bappels\b/);
    expect(container.querySelector('details')).toBeNull();
    expect(screen.queryByText(/Limites quotidiennes et par question/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au fil' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
  it('place la note « Limite atteinte » en dernier, après la carte du budget qui repart, et le pied à deux boutons', async () => {
    const { container } = render(<BrewerLimitsView onBack={vi.fn()} mode="auto" onMode={vi.fn()} />);
    await screen.findByText(/Le budget repart/);
    const texte = container.textContent ?? '';
    expect(texte.indexOf('Le budget repart')).toBeLessThan(texte.indexOf('Limite atteinte'));
    const pied = container.querySelector('.cmp-pied.cmp-pied-l')!;
    expect([...pied.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Annuler', 'Enregistrer']);
  });
  it('affiche « Le budget repart » même si le serveur n’a pas donné le mois du budget (le jour de l’usage le donne)', async () => {
    const sansMois = etat() as unknown as { monthly: { month?: string } };
    delete sansMois.monthly.month;
    vi.mocked(api.budget).mockResolvedValue(sansMois as never);
    render(<BrewerLimitsView onBack={vi.fn()} mode="auto" onMode={vi.fn()} />);
    expect(await screen.findByText(/Le budget repart le 1er décembre/)).toBeVisible();
  });
  it('n’invente aucun mois quand ni le mois ni le jour ne sont connus', async () => {
    const rien = etat() as unknown as { day?: string; monthly: { month?: string } };
    delete rien.monthly.month;
    delete rien.day;
    vi.mocked(api.budget).mockResolvedValue(rien as never);
    render(<BrewerLimitsView onBack={vi.fn()} mode="auto" onMode={vi.fn()} />);
    await screen.findByText('Budget du mois');
    expect(screen.queryByText(/Le budget repart/)).not.toBeInTheDocument();
  });
  it('envoie les limites par question et en jetons telles quelles (plus de champ pour les changer)', async () => {
    vi.mocked(api.setBudget).mockResolvedValue(etat());
    render(<BrewerLimitsView onBack={vi.fn()} mode="auto" onMode={vi.fn()} />);
    await screen.findByLabelText('Plafond par jour');
    fireEvent.change(screen.getByLabelText('Plafond par jour'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(api.setBudget).toHaveBeenCalledWith(undefined, { ...DEFAULT_BREWER_LIMITS, dailyCalls: 40 }));
  });
});

describe('Plafond atteint (fx2c)', () => {
  it('parle de questions, et fournit le placeholder et le bandeau « question gardée »', async () => {
    vi.mocked(api.budget).mockResolvedValue({ ...etat(), monthly: { ...etat().monthly, usedMicroChf: 15_000_000 } });
    const { container } = render(<><BrewerBudgetCapView onLimits={vi.fn()} onLater={vi.fn()} /><BandeauPlafond /></>);
    expect(await screen.findByText('Budget IA du mois atteint')).toBeVisible();
    expect(container.textContent).toMatch(/4\s*sur\s*1\D?000\s*questions/);
    expect(container.textContent).not.toMatch(/appels/);
    expect(screen.getByText('Une nouvelle question sera gardée ici')).toBeVisible();
    expect(PLACEHOLDER_PLAFOND).toBe('En pause · budget du mois atteint');
  });
});
