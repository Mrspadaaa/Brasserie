import type { Transaction } from '../types';
import type { FinancialPayment } from '../domain/finance/types';
import { isoDate, validateFinanceTransaction } from '../domain/finance/ledger';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from './financeDocuments';
import { FirestoreRepo, isConfirmedWriteRejection } from './firestoreRepo';
import { stageNewTransactionPayment, validateFinancialPayment } from './financeService';
import { StorageService } from './storage';

export interface IncomeEntry {
  transaction: Transaction;
  proof: ReturnType<typeof prepareFinanceDocument>;
  payment?: FinancialPayment;
}
const pending = new WeakMap<IncomeEntry, { staged: boolean; running?: Promise<void> }>();

/** The caller retains this exact draft/PDF on retry. Never attach a dataURL to
 * the transaction, and never replay stock/payment writes after a lost reply. */
export async function saveIncomeEntry(entry: IncomeEntry): Promise<void> {
  let state = pending.get(entry);
  if (!state) { state = { staged: false }; pending.set(entry, state); }
  if (state.running) return state.running;
  const work = (async () => {
    const tx = entry.transaction;
    validateFinanceTransaction(tx);
    if (tx.finance?.kind !== 'income' || tx.finance.proofDocumentId !== entry.proof.id || tx.proofUrl)
      throw Error('La vente doit référencer son original privé, sans fichier dans l’écriture.');
    if (entry.payment) validateFinancialPayment(entry.payment);
    const date = isoDate(tx.date);
    if (!date) throw Error('Date de vente invalide.');
    if (!state.staged) {
      await saveFinanceDocumentConfirmed(entry.proof, Number(date.slice(0, 4)));
      if (entry.payment) stageNewTransactionPayment(tx, entry.payment);
      else StorageService.addTransaction(tx);
      state.staged = true;
    }
    try {
      await FirestoreRepo.waitForDocument<Transaction>('transactions', tx.id, 15000, saved =>
        saved.finance?.kind === 'income' && saved.finance.amountCents === tx.finance!.amountCents &&
        saved.finance.proofDocumentId === entry.proof.id && saved.finance.recordedAt === tx.finance!.recordedAt &&
        saved.date === tx.date && (!entry.payment || saved.lastPaymentId === entry.payment.id));
      if (entry.payment) await FirestoreRepo.waitForDocument<FinancialPayment>('financialPayments', entry.payment.id, 15000, saved =>
        saved.transactionId === tx.id && saved.amountCents === entry.payment!.amountCents && saved.date === entry.payment!.date && saved.direction === 'in');
    } catch (error) {
      if (isConfirmedWriteRejection(error) && error.path === `transactions/${tx.id}` &&
          error.operationId === FirestoreRepo.documentWriteState('transactions', tx.id).operationId) state.staged = false;
      throw error;
    }
  })();
  state.running = work;
  try { await work; }
  finally { if (state.running === work) state.running = undefined; }
}
