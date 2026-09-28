import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ app: {}, auth: {}, db: {}, functions: {}, firebaseConfig: {} }));
vi.mock('../../src/ui/finance/FinanceComparisonChart', () => ({ FinanceComparisonChart: () => null }));
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { FinanceService } from '../../src/services/financeService';
import { FinancialArchiveService } from '../../src/services/financialArchiveService';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { formatCHF, todayISO } from '../../src/domain/finance/ledger';
import { shortDate } from '../../src/ui/finance/financeFormat';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import type { Transaction } from '../../src/types';

const today = todayISO();
const recordedAt = `${today}T12:00:00.000Z`;
const dateIn = (days: number) => {
  const date = new Date(`${today}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const invoiceMonth = dateIn(18).slice(0, 7);
const otherMonth = dateIn(47).slice(0, 7);
const proof = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="white"/><text x="40" y="90" font-size="28" fill="#221D19">JUSTIFICATIF FACTURE FICTIVE</text></svg>')}`;

const invoice = (id: string, description: string, amountCents: number, direction: 'in' | 'out', dueDate: string): Transaction => ({
  id, description, date: today, category: direction === 'in' ? 'recettes' : 'brassage', subcategory: '',
  amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
  ...(direction === 'out' ? { proofUrl: proof, proofType: 'image/svg+xml', proofFileName: `${id}.svg` } : {}),
  finance: { version: 1, kind: direction === 'in' ? 'income' : 'expense', amountCents, paymentStatus: 'unpaid', dueDate, recordedAt, lines: [] }
});

const plan = (id: string, title: string, days: number, amountCents: number, direction: 'in' | 'out'): FinancialPlan => ({
  id, title, date: dateIn(days), amountCents, direction,
  category: direction === 'in' ? 'recettes' : 'brassage', source: 'manual', status: 'active', createdAt: recordedAt
});

const transactions: Transaction[] = [
  invoice('FACTURE-MALT', 'Facture de malt à régler', 15475, 'out', dateIn(18)),
  invoice('FACTURE-VENTE', 'Facture de vente à encaisser', 38000, 'in', dateIn(47)),
  { id: 'ACHAT-MOIS', description: 'Houblon Cascade', date: today, category: 'brassage', subcategory: '', amountHT: 68, amountTTC: 68,
    tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 6800, paymentStatus: 'unpaid', recordedAt, lines: [] } }
];
const plans = [
  plan('PLAN-SEPTEMBRE', 'Estimation emballages', 2, 4250, 'out'),
  plan('PLAN-OCTOBRE', 'Estimation levures', 28, 6200, 'out'),
  plan('PLAN-OCTOBRE-ENTREE', 'Vente prévue', 32, 9000, 'in'),
  plan('PLAN-NOVEMBRE', 'Estimation entretien', 63, 3150, 'out')
];
const profile: FinancialProfile = {
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified',
  openingCash: { date: today, amountCents: 825000, confirmed: true }, historyCompleteFrom: `${today.slice(0, 4)}-01-01`, annualProductionL: 1500
};
const snapshot = { profile, plans, payments: [], assets: [], closings: [] };

function renderFinances() {
  return render(<FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all"/>);
}
function openMonthlyForecast() {
  fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
  fireEvent.click(screen.getByText('Comparer les mois'));
}
function periodButton(container: HTMLElement, month: string) {
  const button = container.querySelector<HTMLButtonElement>(`[data-finance-period="${month}"]`);
  if (!button) throw new Error(`Période ${month} absente du tableau.`);
  return button;
}

beforeEach(() => {
  vi.spyOn(FinanceService, 'snapshot').mockReturnValue(snapshot as ReturnType<typeof FinanceService.snapshot>);
  vi.spyOn(FinancialArchiveService, 'getArchives').mockReturnValue([]);
  vi.spyOn(StorageService, 'subscribe').mockReturnValue(() => {});
  StorageService.setUiState('finances_workspace', 'overview');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Percer une période de prévisions', () => {
  it('reprend les mêmes opérations pour les sorties, entrées et lignes du mois, en séparant factures et estimations', async () => {
    const { container } = renderFinances();
    openMonthlyForecast();
    await waitFor(() => expect(periodButton(container, invoiceMonth)).toBeVisible());

    const row = periodButton(container, invoiceMonth).closest('tr')!;
    const amounts = [...row.querySelectorAll('td')].map(cell => cell.textContent);
    expect(amounts).toEqual([formatCHF(15475 + 6200), formatCHF(9000), formatCHF(825000 - 4250 - 6800 - 15475 - 6200 + 9000)]);

    fireEvent.click(periodButton(container, invoiceMonth));
    const operations = container.querySelector<HTMLElement>('[data-finance-period-operations]')!;
    expect(operations.getAttribute('aria-label')).toContain(invoiceMonth.slice(0, 4));
    expect(screen.getByText(/Scénario mensuel à venir, pas un historique des dépenses/)).toBeVisible();
    expect(within(operations).getByRole('button', { name: /Facture de malt à régler/ })).toBeVisible();
    expect(within(operations).getByRole('button', { name: /Estimation levures/ })).toBeVisible();
    expect(within(operations).getByRole('heading', { name: 'Sorties prévues' })).toBeVisible();
    expect(within(operations).getByRole('heading', { name: 'Entrées prévues' })).toBeVisible();
    const invoiceRow = within(operations).getByRole('button', { name: /Facture de malt à régler/ });
    expect(invoiceRow).toHaveTextContent(`Facture enregistrée · reste à payer`);
    expect(invoiceRow).toHaveTextContent(shortDate(dateIn(18)));
    expect(invoiceRow).toHaveTextContent(/154,75\s+CHF/);
    expect(within(operations).getByText('Factures · reste à régler').parentElement).toHaveTextContent(/154,75\s+CHF/);
    expect(within(operations).getAllByText('Plans, budgets et estimations')).toHaveLength(2);
    expect(within(operations).getAllByRole('button', { name: /Plan enregistré · montant prévu/ })).toHaveLength(2);
    expect(within(operations).getByText(/montants restant à régler ou encaisser/)).toBeVisible();
  });

  it('remplace puis retire le filtre de période et garde celui-ci après ouverture de la pièce', async () => {
    const { container } = renderFinances();
    openMonthlyForecast();
    await waitFor(() => expect(periodButton(container, invoiceMonth)).toBeVisible());

    fireEvent.click(periodButton(container, invoiceMonth));
    expect(container.querySelector('[data-finance-period-filter]')).toHaveAttribute('data-finance-period-filter', invoiceMonth);
    fireEvent.click(periodButton(container, otherMonth));
    expect(container.querySelector('[data-finance-period-filter]')).toHaveAttribute('data-finance-period-filter', otherMonth);
    fireEvent.click(periodButton(container, invoiceMonth));

    const operations = container.querySelector<HTMLElement>('[data-finance-period-operations]')!;
    fireEvent.click(within(operations).getByRole('button', { name: /Facture de malt à régler/ }));
    expect(await screen.findByRole('dialog', { name: 'Facture de malt à régler' })).toBeVisible();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:finance-fixture') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: 'Justificatif' }));
    const proofDialog = await screen.findByRole('dialog', { name: 'Justificatif' });
    expect(proofDialog).toBeVisible();
    expect(await screen.findByRole('img', { name: 'FACTURE-MALT.svg' })).toBeVisible();
    expect(container.querySelector('[data-finance-period-filter]')).toHaveAttribute('data-finance-period-filter', invoiceMonth);

    fireEvent.click(within(proofDialog).getByRole('button', { name: 'Fermer' }));
    const invoiceDialog = screen.getByRole('dialog', { name: 'Facture de malt à régler' });
    fireEvent.click(within(invoiceDialog).getAllByRole('button', { name: 'Fermer' })[0]);
    expect(container.querySelector('[data-finance-period-filter]')).toHaveAttribute('data-finance-period-filter', invoiceMonth);
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-clear-finance-period]')!);
    expect(container.querySelector('[data-finance-period-filter]')).toBeNull();
    expect(container.querySelector('[data-finance-period-operations]')).toBeNull();
    expect(periodButton(container, invoiceMonth)).toHaveFocus();
  });

  it('préserve le parcours de catégorie de CostComposition vers le journal', async () => {
    renderFinances();
    fireEvent.click(screen.getByRole('button', { name: 'Coûts' }));
    fireEvent.click(screen.getByRole('button', { name: /Brassage.*Voir ces opérations/ }));
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByLabelText('Catégorie')).toHaveValue('brassage');
    expect(screen.getByRole('button', { name: /Houblon Cascade/ })).toBeVisible();
  });
});
