import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, subtitle, children, footer }: any) => open ? <div role="dialog" aria-label={title}><p>{subtitle}</p>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { PaymentSheet } from '../../src/ui/finance/FinanceForms';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

/**
 * Critique tour 4, voie F1 (fixtures simulées).
 * CT4-A-2 : « ✓ Payé » sur une facture NON payée se lisait « déjà payé » : le geste dit ce qu'il fait (« Marquer payé »), sans changer le geste.
 * CT4-A-3 : « Payer » touché sur « Solde atelier 60,00 » ouvrait « Payer l'Atelier » à 460,00 (loyer pas encore dû coché d'office) et « ✓ soldé » avant tout paiement.
 * CT4-A-4 : deux « Payer » qui font des choses différentes : Opérations écrit d'un toucher (« Marquer payé »), la Synthèse ouvre la feuille (« Payer »).
 */
const tx = (id: string, description: string, vendor: string, amountCents: number, dueDate: string): Transaction => ({
  id, description, date: todayISO(), category: 'chargesFixes', subcategory: '', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents, paymentStatus: 'unpaid', dueDate, vendor, lines: [{ id: 'l', kind: 'ingredient', description, amountCents }] }
}) as Transaction;
const solde = () => tx('SOLDE', 'Solde atelier · ancienne année', 'Atelier', 6000, '2025-12-20');
const loyer = () => tx('LOYER', 'Loyer de l’atelier', 'Atelier', 40000, '2099-11-25');

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); [solde(), loyer()].forEach(t => StorageService.addTransaction(t)); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('CT4-A-2 / CT4-A-4 : le geste d’une ligne non payée dit « Marquer payé », pas « ✓ Payé »', () => {
  it('une facture à payer : « Marquer payé » (jamais « Payé » seul), nom accessible compris', () => {
    render(<TransactionRow transaction={loyer()} transactions={StorageService.getTransactions()} payments={[]} onOpen={() => {}} />);
    const bouton = screen.getByRole('button', { name: /^Marquer payé 400,00/ });
    expect(bouton).toHaveTextContent(/^Marquer payé$/);
    expect(screen.queryByText(/^✓ Payé$/)).not.toBeInTheDocument();
  });
  it('un solde en retard : le même libellé', () => {
    render(<TransactionRow transaction={solde()} transactions={StorageService.getTransactions()} payments={[]} onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /^Marquer payé 60,00/ })).toHaveTextContent(/^Marquer payé$/);
  });
  it('une vente non encaissée : « Marquer encaissé »', () => {
    const vente = { ...tx('V', 'Vente au marché', 'Marché', 72000, '2099-11-25'), category: 'recettes', finance: { version: 1, kind: 'income', amountCents: 72000, paymentStatus: 'unpaid', dueDate: '2099-11-25', vendor: 'Marché', lines: [{ id: 'l', kind: 'ingredient', description: 'Vente', amountCents: 72000 }] } } as unknown as Transaction;
    render(<TransactionRow transaction={vente} transactions={[vente]} payments={[]} onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /^Marquer encaissé 720,00/ })).toHaveTextContent(/^Marquer encaissé$/);
  });
});

describe('CT4-A-3 : la feuille Payer ouverte sur une ligne ne coche que cette ligne', () => {
  const ouvre = (ouverte: Transaction) => render(<PaymentSheet transaction={ouverte} payments={FinanceService.getPayments()} transactions={StorageService.getTransactions()} seule onClose={() => {}} />);
  it('« Solde atelier 60,00 » : 60,00 au virement, le loyer reste visible mais « pas dans ce virement »', () => {
    ouvre(solde());
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('60,00');
    expect(screen.getByRole('checkbox', { name: 'Inclure Solde atelier · ancienne année dans le virement' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Inclure Loyer de l’atelier dans le virement' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('pas dans ce virement')).toBeVisible();
    expect(screen.getByRole('button', { name: /^✓ Payer 60,00/ })).toBeEnabled();
  });
  it('le loyer se coche d’un toucher : 460,00', () => {
    ouvre(solde());
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure Loyer de l’atelier dans le virement' }));
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('460,00');
  });
  it('« soldé » ne s’écrit qu’après : avant le paiement, la ligne dit « sera soldé »', () => {
    ouvre(solde());
    expect(screen.queryByText('✓ soldé')).not.toBeInTheDocument();
    expect(screen.getByText('sera soldé')).toBeVisible();
  });
  it('sans `seule` : la feuille groupée de m5pa-d reste (les deux pièces cochées, 460,00)', () => {
    render(<PaymentSheet transaction={solde()} payments={FinanceService.getPayments()} transactions={StorageService.getTransactions()} onClose={() => {}} />);
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('460,00');
    expect(within(screen.getByRole('dialog')).getAllByRole('checkbox').every(c => c.getAttribute('aria-checked') === 'true')).toBe(true);
  });
});
