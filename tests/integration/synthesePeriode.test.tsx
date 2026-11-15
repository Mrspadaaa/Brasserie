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
function Ecran() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" />; }
const choisir = (nom: string, valeur: string) => fireEvent.change(screen.getByLabelText(nom), { target: { value: valeur } });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
  StorageService.setUiState('finances_workspace', 'overview');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Synthèse : choisir n’importe quelle période (CP-9)', () => {
  it('au repos, le segment de g3a est intact (3 mois, tout) avec « … » à sa fin ; la rangée du/au est fermée', () => {
    annee(); render(<Ecran/>);
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    expect(segment.getAllByRole('button').map(b => b.textContent)).toEqual(['sept.', 'oct.', 'nov.', 'tout', '…']);
    expect(segment.getByRole('button', { name: 'nov.' })).toHaveAttribute('aria-pressed', 'true');
    expect(segment.getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Du mois')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Novembre' })).toBeVisible();
  });

  it('« … » montre du/au ; choisir juin → nov. donne le titre et les totaux de 6 mois', () => {
    annee(); const { container } = render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    const du = screen.getByLabelText('Du mois') as HTMLInputElement, au = screen.getByLabelText('Au mois') as HTMLInputElement;
    expect(du).toHaveAttribute('type', 'month');
    expect(au).toHaveAttribute('type', 'month');
    expect(au).toHaveAttribute('max', '2026-11'); // borné au mois courant
    expect(au.value).toBe('2026-11');
    choisir('Du mois', '2026-06');
    expect(screen.getByRole('heading', { level: 2, name: 'Juin – nov. 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('600,00');
    expect(screen.getByText('Dépensé').parentElement).toHaveTextContent('150,00');
    expect(container.querySelector('.syn-gb')).toHaveTextContent('+450,00');
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    expect(segment.getByRole('button', { name: 'nov.' })).toHaveAttribute('aria-pressed', 'false');
    expect(segment.getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-pressed', 'true');
    expect((screen.getByLabelText('Du mois') as HTMLInputElement).value).toBe('2026-06');
  });

  it('4 mois, puis « Pourquoi ? » dit la plage dans sa source', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Du mois', '2026-08');
    expect(screen.getByRole('heading', { level: 2, name: 'Août – nov. 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('400,00');
    fireEvent.click(screen.getByRole('button', { name: /Pourquoi \?/ }));
    expect(within(screen.getByRole('dialog')).getByText(/Source : Opérations de août – nov\. 2026 \(8 lignes\)/)).toBeVisible();
  });

  it('à cheval sur deux années : « Déc. 2025 – mars 2026 », 4 mois', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Au mois', '2026-03'); choisir('Du mois', '2025-12');
    expect(screen.getByRole('heading', { level: 2, name: 'Déc. 2025 – mars 2026' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('400,00');
    expect(screen.getByText('Dépensé').parentElement).toHaveTextContent('100,00');
  });

  it('du ≤ au : un début après la fin tire la fin avec lui, jamais de plage inversée', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Au mois', '2026-03'); choisir('Du mois', '2026-05');
    expect((screen.getByLabelText('Au mois') as HTMLInputElement).value).toBe('2026-05');
    expect(screen.getByRole('heading', { level: 2, name: 'Mai' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('100,00');
  });

  it('un mois touché referme la rangée et remplace la plage ; « tout » aussi', () => {
    annee(); render(<Ecran/>);
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    fireEvent.click(segment.getByRole('button', { name: 'Autre période' }));
    choisir('Du mois', '2026-06');
    fireEvent.click(segment.getByRole('button', { name: 'oct.' }));
    expect(screen.queryByLabelText('Du mois')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Octobre' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('100,00');
    expect(segment.getByRole('button', { name: 'Autre période' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(segment.getByRole('button', { name: 'Autre période' }));
    choisir('Du mois', '2026-09');
    fireEvent.click(segment.getByRole('button', { name: 'tout' }));
    expect(screen.queryByLabelText('Du mois')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Tout l’historique' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent(/1\s?200,00/);
  });

  it('un segment de catégorie, sur une plage, ouvre Opérations (toutes dates : le journal ne sait pas encore filtrer une plage)', () => {
    annee(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    choisir('Du mois', '2026-06');
    fireEvent.click(screen.getByRole('button', { name: /Brassage 150,00.*juin – nov\. 2026/ }));
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
  });
});
