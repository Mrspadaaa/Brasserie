import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCHF, type LedgerSummary } from '../../domain/finance/ledger';
import { compte } from '../../services/plural';

/**
 * Prévisions (p5b) : ce qui manque à la prévision, au second plan (pli « Limites »). Les chiffres sont dans l'escalier, la bascule et la légende :
 * ce composant ne dit que les limites, jamais un total (l'ancien résumé à cinq totaux est remplacé).
 */
interface Props {
  ledger: LedgerSummary;
  openingCashReady: boolean;
  warnings: string[];
  /** Pièces à payer ou à encaisser sans échéance : hors des mois, dites ici avec leur montant. */
  undatedCount?: number;
  undatedOutCents?: number;
  undatedInCents?: number;
  /** Parts de brassin sans montant (jamais écrites 0,00 sur l'escalier) : « Pale Ale d'hiver · emballage : à compléter ». */
  aCompleter?: string[];
  onProfile: () => void;
  onPayments: () => void;
}

export function FinanceForecastSummary({ ledger, openingCashReady, warnings, undatedCount = 0, undatedOutCents = 0, undatedInCents = 0, aCompleter = [], onProfile, onPayments }: Props) {
  const incomplete = warnings.length > 0 || !ledger.cashComplete || aCompleter.length > 0;
  /* Test d'écran P5B, constat 15 : un seul pli par ligne de trop ; les limites sont écrites d'emblée, sous l'avis, sans second « Voir les limites ». */
  const limites = [...warnings, ...aCompleter];
  /* Ce qui manque, une phrase vraie : seulement les causes que les données disent (aucune cause inventée). */
  const causes = [!openingCashReady ? 'le solde de départ' : '', ledger.unknownPaymentCount > 0 ? compte(ledger.unknownPaymentCount, 'paiement') + ' à confirmer' : ''].filter(Boolean);
  const manque = causes.length ? `Il manque ${causes.join(' et ')} ; les montants couvrent le reste.` : limites.length ? 'Voir les limites ci-dessous : certains montants restent partiels.' : 'Certaines données manquent : les montants sont partiels.';
  return <section className="finance-forecast-summary" aria-label="Limites de la prévision">
    {incomplete && <div className="finance-forecast-warning" role="status">
      <AlertCircle size={16}/><div><strong>Prévision incomplète</strong><p>{manque}</p></div>
    </div>}
    {!incomplete && undatedCount === 0 && <p className="finance-muted">Rien ne manque à cette prévision.</p>}
    {undatedCount > 0 && <p className="finance-notice" data-undated-line>Échéance à préciser : {compte(undatedCount, 'pièce')}
      {undatedOutCents > 0 && <> · {formatCHF(undatedOutCents)} à payer</>}{undatedInCents > 0 && <> · {formatCHF(undatedInCents)} à encaisser</>}</p>}
    {ledger.unknownPaymentCount > 0 && <button type="button" className="finance-task" onClick={onPayments}><span><strong>Confirmer les paiements</strong><small>{compte(ledger.unknownPaymentCount, 'paiement historique')} à vérifier.</small></span><ChevronRight size={16}/></button>}
    <button type="button" className="finance-link" onClick={onProfile}>{openingCashReady ? 'Solde et paramètres financiers' : 'Renseigner le solde de départ'}<ChevronRight size={14}/></button>
    {limites.length > 0 && <ul className="finance-issues" aria-label={`Limites de cette prévision (${limites.length})`}>{limites.map(warning => <li key={warning}>{warning}</li>)}</ul>}
  </section>;
}
