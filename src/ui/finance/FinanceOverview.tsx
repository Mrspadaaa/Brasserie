import React from 'react';
import { ChevronRight } from 'lucide-react';
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
  const mixedDirections = ledger.payablesCents > 0 && ledger.receivablesCents > 0;
  const dueLabel = (date: string | null) => !date ? 'Échéance à préciser'
    : `${date < todayISO() ? 'En retard · ' : ''}${new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })}`;

  return <>
    {/* ⚠️ Une seule valeur en tête d'écran, et c'est la trésorerie.
        « À payer » et « À encaisser » occupaient les deux tiers de la bande en
        permanence. Dans l'usage réel tout est réglé la plupart du temps : deux
        chiffres à 0,00 CHF annonçaient qu'il n'y a rien à faire, en plus grand
        que le seul montant toujours utile. Et quand ils portaient un montant,
        ils répétaient ce que la liste juste en dessous détaille ligne à ligne.
        Ces deux totaux vivent donc maintenant SUR cette liste, qu'ils résument,
        et seulement quand il reste quelque chose à régler. */}
    <dl className="finance-position" aria-label="Situation financière actuelle">
      <div>
        <dt>Trésorerie</dt>
        <dd className="finance-money">{ledger.cashComplete && ledger.cashCents != null ? formatCHF(ledger.cashCents) : 'À compléter'}</dd>
        <dd className="finance-position-note">{ledger.cashComplete ? 'Paiements enregistrés inclus' : openingCashReady ? 'Des données restent à vérifier' : 'Solde de départ à renseigner'}</dd>
        <button type="button" className="finance-position-open" aria-label="Renseigner le solde de trésorerie" onClick={onProfile}><ChevronRight size={15}/></button>
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
      {(ledger.payablesCents > 0 || ledger.receivablesCents > 0) && <p className="finance-settlement-totals">
        {ledger.payablesCents > 0 && <button type="button" aria-label="Voir les factures à payer" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'payable' })}>
          <strong className="finance-money finance-due">{formatCHF(ledger.payablesCents)}</strong> à payer</button>}
        {ledger.receivablesCents > 0 && <button type="button" aria-label="Voir les montants à encaisser" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'receivable' })}>
          <strong className="finance-money">{formatCHF(ledger.receivablesCents)}</strong> à encaisser</button>}
      </p>}
      {ledger.outstanding.length ? <div className="finance-list">{ledger.outstanding.slice(0, 4).map(entry => <div key={entry.id} className="finance-settlement-row">
        <button type="button" className="finance-settlement-open" onClick={() => onTransaction(entry.id)}>
          {/* Le sens n'est rappelé que si la liste en mêle deux : sinon le total
              au-dessus, la ligne et son bouton disaient trois fois « à payer ». */}
          <span className="finance-row-main"><strong>{entry.description}</strong><span className="finance-muted">{dueLabel(entry.dueDate)}{mixedDirections ? ` · ${entry.direction === 'in' ? 'À encaisser' : 'À payer'}` : ''}</span></span>
          <span className="finance-money">{formatCHF(entry.remainingCents)}</span>
        </button>
        <button type="button" className="finance-link" aria-label={`Noter ${entry.direction === 'in' ? 'l’encaissement' : 'le paiement'} de ${entry.description}`} onClick={() => onPayment(entry.id)}>{entry.direction === 'in' ? 'Encaisser' : 'Payer'}</button>
      </div>)}</div> : <p className="finance-empty-inline">{ledger.unknownPaymentCount ? 'Aucune facture ouverte confirmée. Vérifie les paiements historiques ci-dessus.' : 'Aucune facture suivie ne reste à régler.'}</p>}
    </section>
    {ledger.warnings.length > 0 && <details className="finance-disclosure"><summary>Origine et limites des montants</summary><ul className="finance-issues">{ledger.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></details>}
  </>;
}
