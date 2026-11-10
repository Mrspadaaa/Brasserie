import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
const recordPayment = vi.fn();
vi.mock('../../src/services/financeService', async (importOriginal) => {
  const reel = await importOriginal<typeof import('../../src/services/financeService')>();
  return { ...reel, FinanceService: { ...reel.FinanceService, recordPayment: (p: unknown) => recordPayment(p) } };
});
import { TransactionJournal, createJournalState } from '../../src/ui/finance/TransactionJournal';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

/**
 * CP-12 (10.11) : « Toujours pas la bonne vue et je peux pas filtrer pour un intervalle de temps précis ».
 * Une seule vue (v6b : bande, graphe des piles, groupes par catégorie, « Annulées » en fin) pour toute période ; « Par date » ne change
 * que l'ordre des lignes ; « … » ouvre le filtre du … au … ; « Annuler » ne paraît que juste après « ✓ Payé ».
 */
const today = todayISO();
const annee = today.slice(0, 4);
const tx = (id: string, date: string, category: Transaction['category'] = 'brassage', extra: Partial<Transaction> = {}): Transaction => ({
  id, description: `Op ${id}`, date, category, subcategory: '', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: 10000, paymentStatus: 'unpaid', recordedAt: `${today}T12:00:00Z`, lines: [] },
  ...extra,
});
const pay = (t: Transaction, date = t.date): FinancialPayment => ({ id: `PAY-${t.id}`, transactionId: t.id, date, amountCents: 10000,
  direction: t.category === 'recettes' ? 'in' : 'out', method: 'bank', recordedAt: `${today}T12:00:00Z` });
const defaults = {
  archives: [], renderRow: (t: Transaction) => <button>{t.description}</button>,
  onManageArchives: () => {}, onPrivateMovement: () => {},
};
const juin = tx('JUIN', `${annee}-06-10`, 'brassage');
const aout = tx('AOUT', `${annee}-08-12`, 'nettoyage');
const sept = tx('SEPT', `${annee}-09-03`, 'chargesFixes');
const mars = tx('MARS', `${annee}-03-05`, 'brassage');
const toutes = [juin, aout, sept, mars];
const paiements = toutes.map(t => pay(t));
const montre = (name: string) => !!screen.queryByRole('button', { name });
const Hote = ({ initial = {}, transactions = toutes }: { initial?: Parameters<typeof createJournalState>[0]; transactions?: Transaction[] }) => {
  const [etat, setEtat] = React.useState(() => createJournalState(initial));
  return <TransactionJournal {...defaults} transactions={transactions} payments={transactions.map(t => pay(t))} state={etat} onStateChange={setEtat}/>;
};
afterEach(() => { cleanup(); recordPayment.mockClear(); });

describe('Opérations : une seule vue, quelle que soit la période', () => {
  it('(a) « Par date » : la bande et le graphe restent, les lignes se rangent par jour', () => {
    const { container } = render(<Hote initial={{ scope: 'all', allDates: true }}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Par date' }));
    expect(screen.getByRole('group', { name: /par catégorie/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Payé, à payer et dépensé/)).toBeInTheDocument();
    expect(container.querySelector('.ops-bande')).not.toBeNull();
    const groupes = [...container.querySelectorAll('[data-groupe]')].map(g => g.getAttribute('data-groupe'));
    expect(groupes.length).toBe(4);
    expect(new Set(groupes)).toEqual(new Set(['jour']));
    // « Par date » ne change pas la période : la pastille dit toujours la même chose.
    expect(screen.getByRole('button', { name: /Choisir le mois, Toutes les dates/ })).toBeInTheDocument();
  });

  it('(a bis) « Par date » se défait : retour aux groupes par catégorie, sans toucher la période', () => {
    const { container } = render(<Hote initial={{ scope: 'all', allDates: true }}/>);
    const puce = screen.getByRole('button', { name: 'Par date' });
    fireEvent.click(puce);
    expect(puce).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(puce);
    expect(puce).toHaveAttribute('aria-pressed', 'false');
    const groupes = new Set([...container.querySelectorAll('[data-groupe]')].map(g => g.getAttribute('data-groupe')));
    expect(groupes.has('jour')).toBe(false);
    expect(groupes.has('brassage')).toBe(true);
  });

  it('(b) « Tout », archives comprises : groupes par catégorie ET graphe', () => {
    const { container } = render(<Hote initial={{ scope: 'all', allDates: true }}/>);
    expect(screen.getByRole('group', { name: /par catégorie/ })).toBeInTheDocument();
    const groupes = [...container.querySelectorAll('[data-groupe]')].map(g => g.getAttribute('data-groupe'));
    expect(groupes).not.toContain('jour');
    expect(groupes).toContain('brassage');
    expect(groupes).toContain('nettoyage');
    expect(screen.getByText('Archives comprises')).toBeVisible();
    // Le graphe de « tout » additionne tout l'historique : 4 pièces à 100,00, soit 400,00 dépensés.
    expect(screen.getByLabelText(/Payé, à payer et dépensé/).textContent).toMatch(/dépensé\s*400,00/);
  });

  it('(b bis) « Tout » depuis les archives : l\'année archivée garde la vue (bande + graphe)', () => {
    const vieux = tx('VIEUX', `${Number(annee) - 1}-05-05`, 'brassage');
    const archive = { id: `ARCHIVE-${Number(annee) - 1}`, year: Number(annee) - 1, status: 'archived', operationId: 'ARCHIVE-OP', archivedAt: `${today}T13:00:00Z`, updatedAt: `${today}T13:00:00Z` } as const;
    render(<TransactionJournal {...defaults} archives={[archive]} transactions={[vieux, juin]} payments={[pay(vieux), pay(juin)]}
      state={createJournalState({ scope: 'archives' })} onStateChange={() => {}}/>);
    expect(montre('Op VIEUX')).toBe(true);
    expect(montre('Op JUIN')).toBe(false);
    expect(screen.getByRole('group', { name: /par catégorie/ })).toBeInTheDocument();
  });

  it('(c) « … » → du juin au sept. : seules les pièces de juin à sept., titre « juin – sept. 2026 », piles de la plage', () => {
    const { container } = render(<Hote initial={{ scope: 'all' }}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    // Même rangée que la Synthèse : « du [mois] au [mois] ».
    const plage = screen.getByRole('group', { name: 'Plage de mois' });
    fireEvent.change(within(plage).getByLabelText('Du mois'), { target: { value: `${annee}-06` } });
    fireEvent.change(within(plage).getByLabelText('Au mois'), { target: { value: `${annee}-09` } });
    expect(montre('Op JUIN') && montre('Op AOUT') && montre('Op SEPT')).toBe(true);
    expect(montre('Op MARS')).toBe(false);
    expect(screen.getByRole('button', { name: new RegExp(`Choisir le mois, juin – sept\\. ${annee}`) })).toBeInTheDocument();
    // Les piles : 3 pièces à 100,00.
    expect(screen.getByLabelText(/Payé, à payer et dépensé/).textContent).toMatch(/dépensé\s*300,00/);
    expect(container.querySelector('[data-groupe="jour"]')).toBeNull();
  });

  it('(c bis) une plage se défait par ‹ : retour à un mois', () => {
    render(<Hote initial={{ scope: 'all', du: `${annee}-06`, au: `${annee}-09` }}/>);
    expect(montre('Op MARS')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    expect(screen.queryByRole('button', { name: /juin – sept\./ })).not.toBeInTheDocument();
  });
});

describe('Opérations : « Annuler » seulement juste après « ✓ Payé »', () => {
  const ligne = (t: Transaction, payments: FinancialPayment[]) =>
    <TransactionRow transaction={t} transactions={[t]} payments={payments} onOpen={() => {}}/>;

  it('(d) une ligne payée aujourd\'hui, sans geste de cette session : « + pièce », pas « Annuler »', () => {
    const payee = tx('PAYEE', today, 'brassage');
    render(ligne(payee, [pay(payee, today)]));
    expect(screen.queryByRole('button', { name: 'Annuler le paiement du jour' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Joindre une pièce' })).toHaveTextContent('+ pièce');
  });

  it('(d bis) juste après le geste « ✓ Payé » de cette session : « Annuler » apparaît', () => {
    const due = tx('DUE', today, 'brassage');
    const { rerender } = render(ligne(due, []));
    fireEvent.click(screen.getByRole('button', { name: /^Payer/ }));
    expect(recordPayment).toHaveBeenCalledTimes(1);
    const ecrit = recordPayment.mock.calls[0][0] as FinancialPayment;
    rerender(ligne(due, [ecrit]));
    expect(screen.getByRole('button', { name: 'Annuler le paiement du jour' })).toHaveTextContent('Annuler');
  });
});
