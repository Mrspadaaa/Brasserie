import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal, createJournalState, type JournalRequest, type JournalState } from '../../src/ui/finance/TransactionJournal';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialArchive, FinancialPayment } from '../../src/domain/finance/types';

const today = todayISO();
const previousYear = Number(today.slice(0, 4)) - 1;
const purchase = (id: string, patch: Partial<Transaction> = {}): Transaction => ({
  id, description: `Opération ${id}`, date: today, category: 'brassage', subcategory: '', amountHT: 100,
  amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 10000, paymentStatus: 'unpaid', recordedAt: `${today}T12:00:00Z`, lines: [] },
  ...patch,
});
const income = (id: string) => {
  const transaction = purchase(id, { category: 'recettes' });
  return { ...transaction, finance: { ...transaction.finance!, kind: 'income' as const } };
};
const paymentFor = (transaction: Transaction, amountCents = 10000): FinancialPayment => ({
  id: `PAY-${transaction.id}`, transactionId: transaction.id, date: transaction.date, amountCents,
  direction: transaction.category === 'recettes' ? 'in' : 'out', method: 'bank', recordedAt: `${today}T12:00:00Z`,
});
const archive: FinancialArchive = { id: `ARCHIVE-${previousYear}`, year: previousYear, status: 'archived', operationId: 'ARCHIVE-OP', archivedAt: `${today}T13:00:00Z`, updatedAt: `${today}T13:00:00Z` };
const defaults = {
  payments: [] as FinancialPayment[], archives: [] as FinancialArchive[],
  renderRow: (transaction: Transaction) => <button>{transaction.description}</button>,
  onManageArchives: () => {}, onSale: () => {}, onPrivateMovement: () => {},
};
const filterButton = (name: string) => within(screen.getByRole('group', { name: 'État des opérations' })).getByRole('button', { name, exact: true });
afterEach(cleanup);

describe('Journal financier compact', () => {
  it('montre la période et la catégorie sans repli, avec les factures anciennes ouvertes', () => {
    const current = purchase('CE-MOIS');
    const oldPaid = purchase('ANCIEN-PAYÉ', { date: `${previousYear}-02-10` });
    const oldDue = purchase('ANCIEN-OUVERT', { date: `${previousYear}-02-11` });
    render(<TransactionJournal {...defaults} transactions={[current, oldPaid, oldDue]} payments={[paymentFor(current), paymentFor(oldPaid)]}/>);
    expect(screen.getByLabelText('Période du journal')).toBeVisible();
    expect(screen.getByLabelText('Catégorie')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Rechercher une opération' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Opération ANCIEN-PAYÉ' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opération ANCIEN-OUVERT' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Période du journal'), { target: { value: `${previousYear}-02` } });
    expect(screen.getByRole('button', { name: 'Opération ANCIEN-PAYÉ' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération CE-MOIS' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Toutes les dates', exact: true }));
    expect(screen.getByRole('button', { name: 'Opération CE-MOIS' })).toBeInTheDocument();
  });

  it('sépare payer et encaisser, y compris les avoirs et les factures archivées', () => {
    const oldDue = purchase('FOURNISSEUR', { date: `${previousYear}-02-10` });
    const sale = income('CLIENT');
    const supplierCredit = purchase('AVOIR-FOURNISSEUR');
    supplierCredit.finance = { ...supplierCredit.finance!, kind: 'refund', refundDirection: 'in', refundOfId: oldDue.id };
    const customerCredit = purchase('AVOIR-CLIENT', { category: 'recettes' });
    customerCredit.finance = { ...customerCredit.finance!, kind: 'refund', refundDirection: 'out', refundOfId: sale.id };
    const unknown = purchase('HISTORIQUE', { finance: undefined });
    render(<TransactionJournal {...defaults} transactions={[oldDue, sale, supplierCredit, customerCredit, unknown]} archives={[archive]}/>);
    fireEvent.click(filterButton('À payer'));
    expect(screen.getByRole('button', { name: 'Opération FOURNISSEUR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opération AVOIR-CLIENT' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération CLIENT' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération HISTORIQUE' })).not.toBeInTheDocument();
    expect(screen.getByText('Tous les exercices')).toBeVisible();
    expect(screen.getByText(/Exercice .* archivé · facture encore ouverte/)).toBeInTheDocument();
    fireEvent.click(filterButton('À encaisser'));
    expect(screen.getByRole('button', { name: 'Opération CLIENT' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opération AVOIR-FOURNISSEUR' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération FOURNISSEUR' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération AVOIR-CLIENT' })).not.toBeInTheDocument();
  });

  it('ne confond pas les paiements historiques inconnus avec une pièce sans justificatif', () => {
    const unknown = purchase('PAIEMENT-INCONNU', { date: `${previousYear}-02-10`, finance: undefined });
    const missingProof = purchase('SANS-PIÈCE');
    render(<TransactionJournal {...defaults} transactions={[unknown, missingProof]} archives={[archive]}
      request={{ key: 'confirm-payments', scope: 'current', filter: 'unknown' }}/>);
    expect(screen.getByRole('button', { name: 'Opération PAIEMENT-INCONNU' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération SANS-PIÈCE' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirer le filtre : Paiements à confirmer' })).toBeVisible();
    fireEvent.click(filterButton('À compléter'));
    expect(screen.getByRole('button', { name: 'Opération SANS-PIÈCE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opération PAIEMENT-INCONNU' })).toBeInTheDocument();
  });

  it('cherche un tiers, une facture ou un montant décimal et filtre les lignes mixtes', () => {
    const mixed = purchase('MIXTE');
    mixed.finance = { ...mixed.finance!, vendor: 'Comptoir du malt', invoiceNumber: 'F-123', amountCents: 12860,
      lines: [{ id: 'line', description: 'Désinfectant', kind: 'cleaning', amountCents: 2860 }] };
    render(<TransactionJournal {...defaults} transactions={[mixed, purchase('AUTRE')]}/>);
    const search = screen.getByRole('textbox', { name: 'Rechercher une opération' });
    for (const query of ['Comptoir', 'F-123', '128,60']) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getByRole('button', { name: 'Opération MIXTE' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Opération AUTRE' })).not.toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    expect(search).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'nettoyage' } });
    expect(screen.getByRole('button', { name: 'Opération MIXTE' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opération AUTRE' })).not.toBeInTheDocument();
  });

  it('sort du vide en retirant les filtres ou en élargissant toutes les périodes et archives', () => {
    const oldPaid = purchase('ARCHIVÉ', { date: `${previousYear}-02-10` });
    const transactions = [oldPaid];
    const initial = JSON.stringify(transactions);
    render(<TransactionJournal {...defaults} transactions={transactions} payments={[paymentFor(oldPaid)]} archives={[archive]}/>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher une opération' }), { target: { value: 'introuvable' } });
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'materiel' } });
    expect(screen.getByText('Aucune opération trouvée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer les filtres', exact: true }));
    expect(screen.getByLabelText('Catégorie')).toHaveValue('all');
    expect(screen.getByRole('textbox', { name: 'Rechercher une opération' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Rechercher une opération' })).toHaveFocus();
    expect(screen.getByText('Aucune opération trouvée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir toutes les opérations' }));
    expect(screen.getByRole('button', { name: 'Opération ARCHIVÉ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tout', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Toutes les dates', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.stringify(transactions)).toBe(initial);
  });

  it('conserve le contexte et la page au remontage sans rejouer une demande déjà consommée', () => {
    const transactions = Array.from({ length: 65 }, (_, i) => purchase(String(i).padStart(3, '0')));
    const request: JournalRequest = { key: 'from-summary', scope: 'all', allDates: true, filter: 'due' };
    function Workspace() {
      const [state, setState] = useState<JournalState>(() => createJournalState());
      const [visible, setVisible] = useState(true);
      const [requested, setRequested] = useState(request);
      return <><button onClick={() => setVisible(value => !value)}>Changer de vue</button>
        <button onClick={() => setRequested({ key: 'another-summary-link', scope: 'current', filter: 'payable', allDates: true })}>Ouvrir les paiements</button>
        {visible && <TransactionJournal {...defaults} transactions={transactions} request={requested} state={state} onStateChange={setState}/>}</>;
    }
    render(<Workspace/>);
    expect(screen.getByRole('button', { name: 'Retirer le filtre : À payer et encaisser' })).toBeVisible();
    fireEvent.click(filterButton('Toutes'));
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'brassage' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher une opération' }), { target: { value: 'Opération' } });
    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(screen.getByText('Page 2 sur 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Changer de vue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Changer de vue' }));
    expect(screen.getByText('Page 2 sur 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Catégorie')).toHaveValue('brassage');
    expect(screen.getByRole('textbox', { name: 'Rechercher une opération' })).toHaveValue('Opération');
    expect(filterButton('Toutes')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher une opération' }), { target: { value: 'Opération 000' } });
    expect(screen.getByRole('button', { name: 'Opération 000' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pages du journal' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir les paiements' }));
    expect(filterButton('À payer')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Rechercher une opération' })).toHaveValue('');
    expect(screen.getByLabelText('Catégorie')).toHaveValue('all');
    expect(screen.getByText('Page 1 sur 2')).toBeInTheDocument();
  });

  it('garde les anciennes demandes, les annulées et les callbacks accessibles', () => {
    const voided = purchase('ANNULÉE', { date: `${previousYear}-02-10` });
    voided.finance = { ...voided.finance!, voidedAt: `${today}T12:00:00Z` };
    const onSale = vi.fn(), onPrivateMovement = vi.fn(), onManageArchives = vi.fn(), onScopeChange = vi.fn();
    render(<TransactionJournal {...defaults} transactions={[voided]} archives={[archive]} request={{ key: 'annual', year: String(previousYear), allDates: true }}
      onSale={onSale} onPrivateMovement={onPrivateMovement} onManageArchives={onManageArchives} onScopeChange={onScopeChange}/>);
    expect(screen.getByText(`Exercice ${previousYear}`)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Opération ANNULÉE' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Autres filtres', { exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Écritures annulées uniquement' }));
    expect(screen.getByRole('button', { name: 'Retirer le filtre : Écritures annulées' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Gérer les archives' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer une vente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apport ou prélèvement privé' }));
    expect(onManageArchives).toHaveBeenCalledOnce();
    expect(onSale).toHaveBeenCalledOnce();
    expect(onPrivateMovement).toHaveBeenCalledOnce();
    expect(onScopeChange).toHaveBeenLastCalledWith('all');
  });
});
