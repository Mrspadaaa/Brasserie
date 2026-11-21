import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: ({ initialQuestion }: any) => <div role="dialog" aria-label="Compagnon">{initialQuestion}</div> }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import type { Transaction } from '../../src/types';

// CP-9 (10.11) : « je peux pas faire par exemple 6 mois ? 4 mois ETC ? ». Date fixée au 9 novembre 2026.
// Une vente de 100,00 et un achat de brassage de 25,00 par mois, de décembre 2025 à novembre 2026.
const MOIS = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
const tx = (id: string, description: string, cents: number, category: string, date: string): Transaction => ({
  id, description, date, category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid' },
});
function annee() {
  for (const m of MOIS) {
    for (const t of [tx(`V-${m}`, `Vente ${m}`, 10000, 'recettes', `${m}-04`), tx(`B-${m}`, `Malt ${m}`, 2500, 'brassage', `${m}-06`)]) {
      StorageService.addTransaction(t);
      FinanceService.recordPayment({ id: `PAI-${t.id}`, transactionId: t.id, date: t.date as string, amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: `${t.date}T10:00:00Z` });
    }
  }
}
const read = () => StorageService.getTransactions();
function Ecran() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="this-month" />; }
const choisir = (nom: string, valeur: string) => fireEvent.change(screen.getByLabelText(nom), { target: { value: valeur } });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
  StorageService.setUiState('finances_workspace', 'overview');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Synthèse : choisir n’importe quelle période (CP-9)', () => {
  it('au repos, le segment de g3a est intact (3 mois, tout) avec « … » à sa fin ; la frise est fermée', () => {
    annee(); render(<Ecran/>);
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    expect(segment.getAllByRole('button').map(b => b.textContent)).toEqual(['sept.', 'oct.', 'nov.', 'tout', '…']);
    expect(segment.getByRole('button', { name: 'nov.' })).toHaveAttribute('aria-pressed', 'true');
    expect(segment.getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('frise')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Novembre' })).toBeVisible();
  });

  it('PERIODE-PARTOUT : « … » ouvre la frise d’Opérations (deux poignées), jamais deux listes de mois ; juin → nov. donne le titre et les totaux de 6 mois', () => {
    annee(); const { container } = render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    expect(screen.getByTestId('frise')).toBeInTheDocument();
    expect(screen.getAllByRole('slider').map(s => s.getAttribute('aria-label'))).toEqual(['Début', 'Fin']);
    expect(container.querySelector('input[type="month"], select')).toBeNull();
    expect(screen.getByLabelText('Fin').getAttribute('aria-valuetext')).toMatch(/^30 nov\. 2026/);
    choisir('Du', '2026-06-01');
    expect(screen.getByRole('heading', { level: 2, name: 'Juin – nov. 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('600,00');
    expect(screen.getByText('Dépensé').parentElement).toHaveTextContent('150,00');
    expect(container.querySelector('.syn-gb')).toHaveTextContent('+450,00');
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    expect(segment.getByRole('button', { name: 'nov.' })).toHaveAttribute('aria-pressed', 'false');
    expect(segment.getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Début').getAttribute('aria-valuetext')).toMatch(/^1er juin 2026/);
  });

  it('la frise se règle comme dans Opérations : Page bas sur le début recule de 7 jours, la Synthèse compte les mois couverts', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    fireEvent.keyDown(screen.getByLabelText('Début'), { key: 'PageDown' });
    expect(screen.getByLabelText('Début').getAttribute('aria-valuetext')).toMatch(/^25 oct\. 2026/);
    expect(screen.getByRole('heading', { level: 2, name: 'Oct. – nov. 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('200,00');
    expect(within(screen.getByRole('group', { name: 'Période' })).getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('4 mois, puis « Pourquoi ? » dit la plage dans sa source', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Du', '2026-08-01');
    expect(screen.getByRole('heading', { level: 2, name: 'Août – nov. 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('400,00');
    fireEvent.click(screen.getByRole('button', { name: /Pourquoi \?/ }));
    expect(within(screen.getByRole('dialog')).getByText(/Source : Opérations d’août – nov\. 2026 \(8 lignes\)/)).toBeVisible();
  });

  it('à cheval sur deux années : « Déc. 2025 – mars 2026 », 4 mois', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Au', '2026-03-31'); choisir('Du', '2025-12-01');
    expect(screen.getByRole('heading', { level: 2, name: 'Déc. 2025 – mars 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('400,00');
    expect(screen.getByText('Dépensé').parentElement).toHaveTextContent('100,00');
  });

  it('du ≤ au : un début après la fin tire la fin avec lui, jamais de plage inversée', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Au', '2026-03-31'); choisir('Du', '2026-05-01');
    expect((screen.getByLabelText('Au') as HTMLInputElement).value).toBe('2026-05-01');
    expect(screen.getByRole('heading', { level: 2, name: 'Mai' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('100,00');
  });

  it('un mois touché referme la frise et remplace la plage ; « tout » aussi', () => {
    annee(); render(<Ecran/>);
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    fireEvent.click(segment.getByRole('button', { name: 'Autre période' }));
    choisir('Du', '2026-06-01');
    fireEvent.click(segment.getByRole('button', { name: 'oct.' }));
    expect(screen.queryByTestId('frise')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Octobre' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('100,00');
    expect(segment.getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(segment.getByRole('button', { name: 'Autre période' }));
    choisir('Du', '2026-09-01');
    fireEvent.click(segment.getByRole('button', { name: 'tout' }));
    expect(screen.queryByTestId('frise')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tout l’historique' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent(/1\s?200,00/);
  });

  it('un segment de catégorie, sur une plage, ouvre Opérations (toutes dates : le journal ne sait pas encore filtrer une plage)', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Du', '2026-06-01');
    fireEvent.click(screen.getByRole('button', { name: /Brassage 150,00.*juin – nov\. 2026/ }));
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
  });
});
