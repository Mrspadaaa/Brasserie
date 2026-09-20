import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialPayment } from '../../domain/finance/types';
import { formatCHF, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { CATEGORY_LABELS } from './FinanceForms';
import { CategoryTag } from './CategoryTag';
import { amountOnly } from './financeFormat';

/** Les deux seuls états que la cascade ci-dessous n'a pas déjà nommés. */
const STATE_LABELS: Record<string, string> = { unpaid: 'À payer', unknown: 'Paiement à confirmer' };

/**
 * État de règlement : un mot court à l'écran, la phrase entière dans le nom
 * accessible.
 *
 * `settled` marque le cas ORDINAIRE — la pièce est réglée, rien à faire. Dans
 * l'usage réel la quasi-totalité des écritures est dans cet état : afficher
 * « Payé » sur chaque ligne revenait à répéter la normalité vingt fois et à
 * noyer les trois lignes qui, elles, demandent quelque chose. La pastille est
 * donc réservée aux exceptions ; le nom accessible, lui, dit toujours l'état.
 */
function settlementLabel(
  transaction: Transaction, state: ReturnType<typeof paymentState>, incoming: boolean,
): { text: string; tone: string; settled: boolean } {
  if (transaction.finance?.voidedAt) return { text: 'Annulé', tone: 'unknown', settled: false };
  if (transaction.finance?.refundApplication === 'offset') return { text: 'Imputé', tone: 'unknown', settled: false };
  if (state.overpaidCents > 0) return { text: 'Paiement à vérifier', tone: 'alert', settled: false };
  if (state.state === 'paid' && state.appliedCreditCents > 0) return { text: 'Soldé', tone: 'paid', settled: false };
  if (state.state === 'partial') {
    return { text: `Reste ${formatCHF(state.remainingCents)} à ${incoming ? 'encaisser' : 'payer'}`, tone: 'partial', settled: false };
  }
  if (incoming && state.state === 'unpaid') return { text: 'À encaisser', tone: 'unpaid', settled: false };
  if (state.state === 'paid') return { text: incoming ? 'Encaissé' : 'Payé', tone: 'paid', settled: true };
  return { text: STATE_LABELS[state.state] ?? state.state, tone: state.state, settled: false };
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
export function TransactionRow({ transaction, transactions, payments, state: given, onOpen }: {
  transaction: Transaction;
  transactions: Transaction[];
  payments: FinancialPayment[];
  /** État déjà calculé par la liste, pour ne pas le refaire une fois par ligne. */
  state?: ReturnType<typeof paymentState>;
  onOpen: () => void;
}) {
  const state = given ?? paymentState(transaction, payments, transactions, todayISO());
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
    <span className="finance-op-meta"><CategoryTag category={transaction.category}/>{vendor && <span className="finance-op-vendor">{vendor}</span>}</span>
    {!settlement.settled && <span className={`finance-status ${settlement.tone}`} aria-hidden="true">{settlement.text}</span>}
    <ChevronRight size={15} className="finance-op-go" aria-hidden="true"/>
  </button>;
}
