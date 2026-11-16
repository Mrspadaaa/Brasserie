// @vitest-environment jsdom
/**
 * Voie u1, constat 19 (grave, jeu en ligne du 16.11) : « ZZ TEST — Apport » (+5,00) impossible à retirer. « Annuler cette écriture » demande d'abord
 * d'annuler le paiement erroné, mais la ligne Paiements d'un apport (ou d'un prélèvement) n'offrait aucun « Corriger ce paiement », que la dépense offre.
 * Parcours sur les vrais services (?dev-local) : la ligne offre la correction, le contre-paiement s'écrit, puis l'écriture s'annule.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children }: any) => open ? <div role="dialog" aria-label={title}>{children}</div> : null }));
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { paymentState } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

const mouvement = (id: string, kind: 'contribution' | 'withdrawal'): Transaction => ({
  id, date: '15.11.2026', description: `ZZ TEST — ${kind === 'contribution' ? 'Apport' : 'Prélèvement'}`, category: kind === 'contribution' ? 'apports' : 'prélèvements',
  amountHT: 5, tvaRate: 0, tvaAmount: 0, amountTTC: 5, proofNotes: '',
  finance: { version: 1, kind, amountCents: 500, lines: [], paymentStatus: 'paid' }
} as Transaction);
const ouvrir = (id: string) => {
  const tx = StorageService.getTransactions().find(t => t.id === id)!;
  return render(<TransactionDetails transaction={tx} transactions={StorageService.getTransactions()} payments={FinanceService.getPayments()} plans={[]}
    onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} />);
};

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('19 : un apport et un prélèvement se retirent', () => {
  for (const [kind, id, sens, contre] of [['contribution', 'T-APPORT', 'in', 'out'], ['withdrawal', 'T-PRELEV', 'out', 'in']] as const) {
    it(`${kind} : sa ligne de paiement offre « Corriger ce paiement », qui écrit le contre-paiement, puis l'écriture s'annule`, () => {
      StorageService.addTransaction(mouvement(id, kind));
      FinanceService.recordPayment({ id: `PAI-${id}`, transactionId: id, date: '2026-11-15', amountCents: 500, direction: sens, method: 'bank', recordedAt: '2026-11-15T08:00:00.000Z' });
      ouvrir(id);
      fireEvent.click(screen.getByRole('button', { name: 'Corriger ce paiement saisi par erreur' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirmer la correction' }));
      const paiements = FinanceService.getPayments().filter(p => p.transactionId === id);
      expect(paiements.find(p => p.id === `CONTRE-PAI-${id}`)).toMatchObject({ reversalOfId: `PAI-${id}`, direction: contre, amountCents: 500 });
      const tx = StorageService.getTransactions().find(t => t.id === id)!;
      expect(paymentState(tx, paiements, StorageService.getTransactions()).paidCents).toBe(0);
      expect(StorageService.revertTransaction(id).success).toBe(true);
      expect(StorageService.getTransactions().find(t => t.id === id)!.finance?.voidedAt).toBeTruthy();
    });
  }
});
