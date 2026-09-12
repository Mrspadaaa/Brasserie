import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCHF, type LedgerSummary } from '../../domain/finance/ledger';
import { compte } from '../../services/plural';

interface Props {
  ledger: LedgerSummary;
  openingCashReady: boolean;
  warnings: string[];
  invoiceOut: number;
  estimatedOut: number;
  incoming: number;
  projectedCash: number | null;
  horizonLabel: string;
  onProfile: () => void;
  onPayments: () => void;
}

export function FinanceForecastSummary({ ledger, openingCashReady, warnings, invoiceOut, estimatedOut, incoming, projectedCash, horizonLabel, onProfile, onPayments }: Props) {
  const incomplete = warnings.length > 0 || !ledger.cashComplete;
  return <section className="finance-forecast-summary" aria-label={`Prévision sur ${horizonLabel}`}>
    {incomplete && <div className="finance-forecast-warning" role="status">
      <AlertCircle size={16}/><div><strong>Prévision incomplète</strong><p>Les montants ci-dessous couvrent les données renseignées.</p></div>
    </div>}
    <dl className="finance-forecast-values">
      <div><dt>Factures à régler</dt><dd className="finance-money">{formatCHF(invoiceOut)}</dd></div>
      <div><dt>Budgets et estimations</dt><dd className="finance-money">{formatCHF(estimatedOut)}</dd></div>
      <div className="finance-total"><dt>Sorties {incomplete ? 'renseignées' : 'prévues'}</dt><dd className="finance-money">{formatCHF(invoiceOut + estimatedOut)}</dd></div>
      <div><dt>Entrées prévues</dt><dd className="finance-money">{formatCHF(incoming)}</dd></div>
      <div className="finance-projected"><dt>Solde estimé en fin de période<small>{incomplete ? 'Scénario partiel' : horizonLabel}</small></dt><dd className={`finance-money${projectedCash != null && projectedCash < 0 ? ' finance-negative' : ''}`}>{projectedCash == null ? 'À compléter' : formatCHF(projectedCash)}</dd></div>
    </dl>
    {ledger.unknownPaymentCount > 0 && <button type="button" className="finance-task" onClick={onPayments}><span><strong>Confirmer les paiements</strong><small>{compte(ledger.unknownPaymentCount, 'paiement historique')} à vérifier.</small></span><ChevronRight size={16}/></button>}
    {!openingCashReady && <button type="button" className="finance-link" onClick={onProfile}>Renseigner le solde de départ<ChevronRight size={14}/></button>}
    {warnings.length > 0 && <details className="finance-disclosure"><summary>Voir les limites de cette prévision ({warnings.length})</summary><ul className="finance-issues">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></details>}
  </section>;
}
