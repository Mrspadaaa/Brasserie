import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialPayment } from '../../domain/finance/types';
import { formatCHF, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { CATEGORY_LABELS } from './FinanceForms';
import { amountOnly } from './financeFormat';

const STATE_LABELS: Record<string, string> = {
  paid: 'Payé', partial: 'Partiellement payé', unpaid: 'À payer', unknown: 'Paiement à confirmer',
};

/** État de règlement : un mot court à l'écran, la phrase entière dans le nom accessible. */
function settlementLabel(
  transaction: Transaction, state: ReturnType<typeof paymentState>, incoming: boolean,
): { text: string; tone: string } {
  if (transaction.finance?.voidedAt) return { text: 'Annulé', tone: 'unknown' };
  if (transaction.finance?.refundApplication === 'offset') return { text: 'Imputé', tone: 'unknown' };
  if (state.overpaidCents > 0) return { text: 'Paiement à vérifier', tone: 'alert' };
  if (state.state === 'paid' && state.appliedCreditCents > 0) return { text: 'Soldé', tone: 'paid' };
  if (state.state === 'partial') {
    return { text: `Reste ${formatCHF(state.remainingCents)} à ${incoming ? 'encaisser' : 'payer'}`, tone: 'partial' };
  }
  if (incoming && state.state === 'unpaid') return { text: 'À encaisser', tone: 'unpaid' };
  if (incoming && state.state === 'paid') return { text: 'Encaissé', tone: 'paid' };
  return { text: STATE_LABELS[state.state] ?? state.state, tone: state.state };
}

/**
 * Une écriture du journal.
 *
 * ⚠️ Ce que la ligne NE répète PLUS : la date et le franc.
 * La date est portée une fois par l'en-tête du jour — six lignes affichaient
 * « 20 sept. » à l'identique — et l'unité une fois par le sous-total du jour,
 * puisque toute la colonne est en CHF. Ce qui manquait, en revanche, apparaît :
 * la catégorie, qui était effacée dès qu'un fournisseur était renseigné.
 *
 * Le montant et l'état gardent leur écriture complète dans le nom accessible :
 * on compacte le dessin, pas l'information.
 */
export function TransactionRow({ transaction, transactions, payments, onOpen }: {
  transaction: Transaction;
  transactions: Transaction[];
  payments: FinancialPayment[];
  onOpen: () => void;
}) {
  const state = paymentState(transaction, payments, transactions, todayISO());
  const incoming = transactionDirection(transaction, transactions) === 'in';
  const amount = transactionAmount(transaction);
  const category = CATEGORY_LABELS[transaction.category] ?? transaction.category;
  const vendor = transactionVendor(transaction);
  const settlement = settlementLabel(transaction, state, incoming);
  const money = `${incoming ? '+ ' : ''}${formatCHF(amount)}`;
  // La colonne entière est en francs : l'unité se lit une fois, dans l'en-tête du jour.
  const shown = `${incoming ? '+ ' : ''}${amountOnly(amount)}`;

  return <button type="button" className="finance-row finance-op" onClick={onOpen}
    aria-label={`${transaction.description} · ${category}${vendor ? ` · ${vendor}` : ''} · ${money} · ${settlement.text}`}>
    <span className="finance-op-label">{transaction.description}</span>
    <span className={`finance-op-amount finance-money${incoming ? ' finance-in' : ''}`} aria-hidden="true">{shown}</span>
    <span className="finance-op-meta">{category}{vendor ? ` · ${vendor}` : ''}</span>
    <span className={`finance-status ${settlement.tone}`} aria-hidden="true">{settlement.text}</span>
    <ChevronRight size={15} className="finance-op-go" aria-hidden="true"/>
  </button>;
}
