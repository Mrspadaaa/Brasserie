// @vitest-environment jsdom
/**
 * Voie u1, constat 20 : retirer une écriture payée en un geste. Les règles Firestore interdisent de supprimer une pièce et un paiement : « Retirer »
 * écrit donc le contre-paiement de chaque paiement en vigueur (un lot par étape, comme `executerCorrection`), puis annule l'écriture. L'écriture
 * annulée sort de la liste par défaut ; elle reste visible par « Écritures annulées uniquement ». Vrais services (?dev-local).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children }: any) => open ? <div role="dialog" aria-label={title}>{children}</div> : null }));
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { retirerEcriture, planRetrait } from '../../src/ui/finance/modifier/retirerEcriture';
import { isActiveTransaction } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

const depense = (id = 'T-DEP'): Transaction => ({
  id, date: '09.11.2026', description: 'ZZ TEST dépense', category: 'nettoyage', subcategory: 'CIP', amountHT: 42, tvaRate: 0, tvaAmount: 0, amountTTC: 42, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: 4200, lines: [], paymentStatus: 'paid' }
});
const apport = (): Transaction => ({
  id: 'T-APP', date: '15.11.2026', description: 'ZZ TEST — Apport', category: 'apports', amountHT: 5, tvaRate: 0, tvaAmount: 0, amountTTC: 5, proofNotes: '',
  finance: { version: 1, kind: 'contribution', amountCents: 500, lines: [], paymentStatus: 'paid' }
} as Transaction);
const paye = (id: string, transactionId: string, cents: number, date: string, direction: 'in' | 'out' = 'out') =>
  FinanceService.recordPayment({ id, transactionId, date, amountCents: cents, direction, method: 'bank', recordedAt: `${date}T08:00:00.000Z` });
const vivante = (id: string) => StorageService.getTransactions().find(t => t.id === id)!;
const ctx = () => ({ aujourdhui: '2026-11-16', maintenant: '2026-11-16T09:00:00.000Z' });

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('20 : retirer une écriture payée', () => {
  it('le plan : un contre-paiement par paiement en vigueur, jamais pour un paiement déjà inversé', () => {
    StorageService.addTransaction(depense());
    paye('P1', 'T-DEP', 3000, '2026-11-05'); paye('P2', 'T-DEP', 1200, '2026-11-09');
    FinanceService.recordPayment({ id: 'CONTRE-P1', transactionId: 'T-DEP', date: '2026-11-05', amountCents: 3000, direction: 'in', method: 'bank', reversalOfId: 'P1', recordedAt: '2026-11-06T08:00:00.000Z' });
    expect(planRetrait(vivante('T-DEP'), FinanceService.getPayments())).toEqual([{ type: 'contre', paiementId: 'P2' }]);
  });

  it('une dépense payée en deux fois : retirée en un appel, les deux paiements inversés puis l’écriture annulée', async () => {
    StorageService.addTransaction(depense());
    paye('P1', 'T-DEP', 3000, '2026-11-05'); paye('P2', 'T-DEP', 1200, '2026-11-09');
    await retirerEcriture('T-DEP', FinanceService.getPayments(), ctx());
    const ps = FinanceService.getPayments().filter(p => p.transactionId === 'T-DEP');
    expect(ps.map(p => p.id).sort()).toEqual(['CONTRE-P1', 'CONTRE-P2', 'P1', 'P2']);
    expect(isActiveTransaction(vivante('T-DEP'))).toBe(false);
    expect(vivante('T-DEP').settlementBalanceCents ?? 0).toBe(0);
  });

  it('un apport payé : même chemin, le contre-paiement part dans le sens inverse', async () => {
    StorageService.addTransaction(apport());
    paye('P-APP', 'T-APP', 500, '2026-11-15', 'in');
    await retirerEcriture('T-APP', FinanceService.getPayments(), ctx());
    expect(FinanceService.getPayments().find(p => p.id === 'CONTRE-P-APP')).toMatchObject({ direction: 'out', amountCents: 500 });
    expect(isActiveTransaction(vivante('T-APP'))).toBe(false);
  });

  it('une pièce sans paiement : l’écriture s’annule simplement', async () => {
    StorageService.addTransaction({ ...depense(), finance: { version: 1, kind: 'expense', amountCents: 4200, lines: [], paymentStatus: 'unpaid' } });
    await retirerEcriture('T-DEP', FinanceService.getPayments(), ctx());
    expect(isActiveTransaction(vivante('T-DEP'))).toBe(false);
  });

  it('un avoir actif lié : refusé AVANT toute écriture (aucun contre-paiement orphelin)', async () => {
    StorageService.addTransaction(depense());
    paye('P1', 'T-DEP', 4200, '2026-11-09');
    StorageService.addTransaction({ ...depense('T-AVOIR'), description: 'ZZ avoir', finance: { version: 1, kind: 'refund', amountCents: 500, lines: [], refundOfId: 'T-DEP', refundDirection: 'in', refundApplication: 'offset' } } as Transaction);
    await expect(retirerEcriture('T-DEP', FinanceService.getPayments(), ctx())).rejects.toThrow(/avoir/i);
    expect(FinanceService.getPayments().filter(p => p.transactionId === 'T-DEP')).toHaveLength(1);
    expect(isActiveTransaction(vivante('T-DEP'))).toBe(true);
  });

  it('la fiche : « Retirer cette écriture » demande confirmation et dit que la suppression est interdite ; confirmée, l’écriture est annulée', async () => {
    StorageService.addTransaction(depense());
    paye('P1', 'T-DEP', 4200, '2026-11-09');
    render(<TransactionDetails transaction={vivante('T-DEP')} transactions={StorageService.getTransactions()} payments={FinanceService.getPayments()} plans={[]}
      onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} />);
    fireEvent.click(screen.getByText('Corriger une erreur de saisie'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer cette écriture' }));
    expect(screen.getByText(/ne se supprime jamais/i)).toBeTruthy();
    expect(isActiveTransaction(vivante('T-DEP'))).toBe(true); // confirmation d'abord : rien n'est écrit
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le retrait' }));
    await waitFor(() => expect(isActiveTransaction(vivante('T-DEP'))).toBe(false));
    expect(FinanceService.getPayments().some(p => p.id === 'CONTRE-P1')).toBe(true);
  });
});
