import React from 'react';
import { ChevronRight, Settings2 } from 'lucide-react';
import { formatCHF, todayISO, type LedgerSummary } from '../../domain/finance/ledger';
import type { JournalRequest } from './TransactionJournal';
import { compte } from '../../services/plural';

interface Props {
  ledger: LedgerSummary;
  openingCashReady: boolean;
  undatedCount: number;
  onProfile: () => void;
  onJournal: (request: Omit<JournalRequest, 'key'>) => void;
  onTransaction: (id: string) => void;
  onPayment: (id: string) => void;
}

export function FinanceOverview({ ledger, openingCashReady, undatedCount, onProfile, onJournal, onTransaction, onPayment }: Props) {
  const reviewPayments = () => onJournal({ scope: 'all', allDates: true, filter: 'unknown' });
  const dueLabel = (date: string | null) => !date ? 'Échéance à préciser'
    : `${date < todayISO() ? 'En retard · ' : ''}${new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })}`;

  return <>
    <dl className="finance-position" aria-label="Situation financière actuelle">
      <div>
        <dt>Trésorerie <small>{ledger.cashComplete ? 'Paiements enregistrés inclus' : openingCashReady ? 'Des données restent à vérifier' : 'Solde de départ à renseigner'}</small></dt>
        <dd className="finance-money">{ledger.cashComplete && ledger.cashCents != null ? formatCHF(ledger.cashCents) : 'À compléter'}</dd>
        <button type="button" className="finance-icon-action" aria-label="Renseigner le solde de trésorerie" onClick={onProfile}><Settings2 size={16}/></button>
      </div>
      <div>
        <dt>À payer <small>Factures suivies, tous exercices</small></dt>
        <dd className="finance-money">{formatCHF(ledger.payablesCents)}</dd>
        <button type="button" className="finance-icon-action" aria-label="Voir les factures à payer" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'payable' })}><ChevronRight size={16}/></button>
      </div>
      <div>
        <dt>À encaisser <small>Ventes et remboursements suivis</small></dt>
        <dd className="finance-money">{formatCHF(ledger.receivablesCents)}</dd>
        <button type="button" className="finance-icon-action" aria-label="Voir les montants à encaisser" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'receivable' })}><ChevronRight size={16}/></button>
      </div>
    </dl>

    {(!openingCashReady || ledger.unknownPaymentCount > 0 || undatedCount > 0) && <section className="finance-section finance-completion" aria-label="Données à compléter">
      <h3>Pour une situation fiable</h3>
      {!openingCashReady && <button type="button" className="finance-task" onClick={onProfile}>
        <span><strong>Vérifier le solde de départ</strong><small>La trésorerie ne peut pas encore être confirmée.</small></span><ChevronRight size={16}/>
      </button>}
      {ledger.unknownPaymentCount > 0 && <button type="button" className="finance-task" onClick={reviewPayments}>
        <span><strong>Confirmer les paiements</strong><small>{compte(ledger.unknownPaymentCount, 'pièce')} exclue{ledger.unknownPaymentCount > 1 ? 's' : ''} des montants à payer et à encaisser.</small></span><span className="finance-count">{ledger.unknownPaymentCount}</span><ChevronRight size={16}/>
      </button>}
      {undatedCount > 0 && <button type="button" className="finance-task" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'review' })}>
        <span><strong>Vérifier les pièces sans date</strong><small>{compte(undatedCount, 'pièce')} à replacer dans la bonne période.</small></span><ChevronRight size={16}/>
      </button>}
    </section>}

    <section className="finance-section" aria-label="Paiements à suivre">
      <div className="finance-heading"><h3>Règlements à suivre</h3><button type="button" className="finance-link" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'due' })}>Tout voir<ChevronRight size={14}/></button></div>
      {ledger.outstanding.length ? <div className="finance-list">{ledger.outstanding.slice(0, 4).map(entry => <div key={entry.id} className="finance-settlement-row">
        <button type="button" className="finance-settlement-open" onClick={() => onTransaction(entry.id)}>
          <span className="finance-row-main"><strong>{entry.description}</strong><span className="finance-muted">{dueLabel(entry.dueDate)} · {entry.direction === 'in' ? 'À encaisser' : 'À payer'}</span></span>
          <span className="finance-money">{formatCHF(entry.remainingCents)}</span>
        </button>
        <button type="button" className="finance-link" aria-label={`Noter ${entry.direction === 'in' ? 'l’encaissement' : 'le paiement'} de ${entry.description}`} onClick={() => onPayment(entry.id)}>{entry.direction === 'in' ? 'Encaisser' : 'Payer'}</button>
      </div>)}</div> : <p className="finance-empty-inline">{ledger.unknownPaymentCount ? 'Aucune facture ouverte confirmée. Vérifie les paiements historiques ci-dessus.' : 'Aucune facture suivie ne reste à régler.'}</p>}
    </section>
    {ledger.warnings.length > 0 && <details className="finance-disclosure"><summary>Origine et limites des montants</summary><ul className="finance-issues">{ledger.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></details>}
  </>;
}
