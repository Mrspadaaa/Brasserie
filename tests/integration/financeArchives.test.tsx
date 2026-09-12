import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { FinancialArchiveService } from '../../src/services/financialArchiveService';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

const previousYear = Number(todayISO().slice(0, 4)) - 1;
const purchase = (id: string, date = `${previousYear}-02-10`): Transaction => ({
  id, description: `Achat ${id}`, date, category: 'brassage', subcategory: '', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 10000, paymentStatus: 'unpaid', recordedAt: `${previousYear}-02-10T12:00:00.000Z`, lines: [] },
});
const read = () => StorageService.getTransactions();
function Workspace({ request }: { request?: { id: string; at: number } }) {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={() => {}} openTransactionRequest={request}/>;
}
function savePaid(id: string) {
  FinanceService.stageNewTransactionPayment(purchase(id), { id: `PAY-${id}`, transactionId: id, date: `${previousYear}-02-10`, amountCents: 10000, direction: 'out', method: 'bank', recordedAt: new Date().toISOString() });
}
beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'journal');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Archives accessibles et journal quotidien', () => {
  it('retrouve le dernier achat saisi en premier parmi les opérations du même jour', () => {
    const older=purchase('A-PREMIER',todayISO()),latest=purchase('Z-DERNIER',todayISO());
    older.finance!.recordedAt=`${todayISO()}T09:00:00Z`;latest.finance!.recordedAt=`${todayISO()}T10:00:00Z`;
    render(<TransactionJournal transactions={[older,latest]} payments={[]} archives={[]} renderRow={t=><button>{t.description}</button>} onManageArchives={()=>{}} onSale={()=>{}} onPrivateMovement={()=>{}}/>);
    expect(screen.getAllByRole('button',{name:/^Achat /}).map(button=>button.textContent)).toEqual(['Achat Z-DERNIER','Achat A-PREMIER']);
    expect(screen.getByLabelText('Période du journal')).not.toBeVisible();
    fireEvent.click(screen.getByText('Période et filtres',{exact:true}));
    expect(screen.getByLabelText('Période du journal')).toBeVisible();
  });
  it('archive une année depuis le récapitulatif puis la réintègre sans changer les pièces', async () => {
    savePaid('ANCIEN'); const original = JSON.stringify(StorageService.getTransactions()); render(<Workspace/>);
    fireEvent.click(screen.getByText('Période et filtres', {exact:true}));
    fireEvent.click(screen.getByRole('button', { name: 'Gérer les archives', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: `Archiver ${previousYear}`, exact: true }));
    expect(FinancialArchiveService.getArchives()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer l’archivage', exact: true }));
    await waitFor(() => expect(screen.getByText(`Année ${previousYear} archivée. Les factures ouvertes restent dans le suivi.`)).toBeInTheDocument());
    expect(JSON.stringify(StorageService.getTransactions())).toBe(original);
    fireEvent.click(screen.getByRole('button', { name: `Réintégrer ${previousYear}`, exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Réintégrer cette année', exact: true }));
    await waitFor(() => expect(FinancialArchiveService.getArchives()[0].status).toBe('open'));
    expect(JSON.stringify(StorageService.getTransactions())).toBe(original);
  });

  it('range les pièces payées et conserve une facture ancienne ouverte dans le suivi', async () => {
    savePaid('PAYÉ'); StorageService.addTransaction(purchase('IMPAYÉ'));
    await FinancialArchiveService.setYearArchived(previousYear, true); render(<Workspace/>);
    expect(screen.queryByRole('button', { name: /Achat PAYÉ/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Achat IMPAYÉ/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true }));
    expect(screen.getByLabelText('Année archivée')).toHaveValue(String(previousYear));
    expect(screen.getByRole('button', { name: /Achat PAYÉ/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Achat IMPAYÉ/ })).toBeInTheDocument();
  });

  it('retrouve les paiements historiques inconnus dans À compléter même après archivage', async () => {
    StorageService.addTransaction({ ...purchase('HISTORIQUE'), finance: undefined });
    await FinancialArchiveService.setYearArchived(previousYear, true); render(<Workspace/>);
    expect(screen.queryByRole('button', { name: /Achat HISTORIQUE/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'À compléter', exact: true }));
    expect(screen.getByRole('button', { name: /Achat HISTORIQUE/ })).toBeInTheDocument();
    expect(screen.getByText(/Suivi sur tous les exercices/)).toBeInTheDocument();
  });

  it('cherche dans toutes les pièces avant de paginer et remet la recherche en première page', () => {
    const transactions = Array.from({ length: 123 }, (_, i) => ({ ...purchase(`PAGE-${String(i).padStart(3, '0')}`, todayISO()), description: `Pièce page ${i}` }));
    render(<TransactionJournal transactions={transactions} payments={[]} archives={[]} renderRow={t => <button key={t.id}>{t.description}</button>} onManageArchives={() => {}} onSale={() => {}} onPrivateMovement={() => {}}/>);
    expect(screen.getAllByRole('button', { name: /^Pièce page / })).toHaveLength(50);
    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(screen.getByText('Page 2 sur 3')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher une opération' }), { target: { value: 'Pièce page 122' } });
    expect(screen.getByRole('button', { name: 'Pièce page 122' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Pièce page / })).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Pages du journal' })).not.toBeInTheDocument();
  });

  it('ouvre directement une pièce archivée demandée par la recherche et ne la rouvre pas après fermeture', async () => {
    savePaid('RECHERCHE'); await FinancialArchiveService.setYearArchived(previousYear, true);
    render(<Workspace request={{ id: 'RECHERCHE', at: 123 }}/>);
    expect(screen.getByRole('dialog', { name: 'Achat RECHERCHE' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer', exact: true }));
    act(() => StorageService.addTransaction(purchase('SUIVANTE', todayISO())));
    expect(screen.queryByRole('dialog', { name: 'Achat RECHERCHE' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Achat RECHERCHE/ })).toBeInTheDocument();
  });
});
