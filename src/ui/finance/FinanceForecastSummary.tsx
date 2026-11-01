import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCHF, type LedgerSummary } from '../../domain/finance/ledger';
import { compte } from '../../services/plural';

interface Props {
  ledger: LedgerSummary;
  openingCashReady: boolean;
  warnings: string[];
  /** Pièces à payer ou à encaisser sans échéance : hors des mois, dites ici avec leur montant. */
  undatedCount?: number;
  undatedOutCents?: number;
  undatedInCents?: number;
  invoiceOut: number;
  estimatedOut: number;
  incoming: number;
  projectedCash: number | null;
  horizonLabel: string;
  onProfile: () => void;
  onPayments: () => void;
}

export function FinanceForecastSummary({ ledger, openingCashReady, warnings, undatedCount = 0, undatedOutCents = 0, undatedInCents = 0, invoiceOut, estimatedOut, incoming, projectedCash, horizonLabel, onProfile, onPayments }: Props) {
  const incomplete = warnings.length > 0 || !ledger.cashComplete;
  /* Ce qui manque, une phrase vraie : seulement les causes que les données disent (aucune cause inventée). */
  const causes = [!openingCashReady ? 'le solde de départ' : '', ledger.unknownPaymentCount > 0 ? compte(ledger.unknownPaymentCount, 'paiement') + ' à confirmer' : ''].filter(Boolean);
  const manque = causes.length ? `Il manque ${causes.join(' et ')} ; les montants couvrent le reste.` : warnings.length ? 'Voir les limites ci-dessous : certains montants restent partiels.' : 'Certaines données manquent : les montants sont partiels.';
  return <section className="finance-forecast-summary" aria-label={`Prévision sur ${horizonLabel}`}>
    {incomplete && <div className="finance-forecast-warning" role="status">
      <AlertCircle size={16}/><div><strong>Prévision incomplète</strong><p>{manque}</p></div>
    </div>}
    <dl className="finance-forecast-values">
      <div><dt>Factures à régler</dt><dd className="finance-money">{formatCHF(invoiceOut)}</dd></div>
      <div><dt>Budgets et estimations</dt><dd className="finance-money">{formatCHF(estimatedOut)}</dd></div>
      <div className="finance-total"><dt>Sorties {incomplete ? 'renseignées' : 'prévues'}</dt><dd className="finance-money">{formatCHF(invoiceOut + estimatedOut)}</dd></div>
      <div><dt>Entrées prévues</dt><dd className="finance-money">{formatCHF(incoming)}</dd></div>
      <div className="finance-projected"><dt>Solde estimé en fin de période<small>{incomplete ? 'Scénario partiel' : horizonLabel}</small></dt><dd className={`finance-money${projectedCash != null && projectedCash < 0 ? ' finance-negative' : ''}`}>{projectedCash == null ? 'À compléter' : formatCHF(projectedCash)}</dd></div>
    </dl>
    {undatedCount > 0 && <p className="finance-notice" data-undated-line>Échéance à préciser : {compte(undatedCount, 'pièce')}
      {undatedOutCents > 0 && <> · {formatCHF(undatedOutCents)} à payer</>}{undatedInCents > 0 && <> · {formatCHF(undatedInCents)} à encaisser</>}</p>}
    {ledger.unknownPaymentCount > 0 && <button type="button" className="finance-task" onClick={onPayments}><span><strong>Confirmer les paiements</strong><small>{compte(ledger.unknownPaymentCount, 'paiement historique')} à vérifier.</small></span><ChevronRight size={16}/></button>}
    {!openingCashReady && <button type="button" className="finance-link" onClick={onProfile}>Renseigner le solde de départ<ChevronRight size={14}/></button>}
    {warnings.length > 0 && <details className="finance-disclosure"><summary>Voir les limites de cette prévision ({warnings.length})</summary><ul className="finance-issues">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></details>}
  </section>;
}
