import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCHF, type LedgerSummary } from '../../domain/finance/ledger';
import type { AvertissementCible, CibleLimite } from '../../domain/finance/forecast';
import { compte } from '../../services/plural';

/**
 * Prévisions (p5b) : ce qui manque à la prévision, au second plan (pli « Limites »). Les chiffres sont dans l'escalier, la bascule et la légende :
 * ce composant ne dit que les limites, jamais un total (l'ancien résumé à cinq totaux est remplacé).
 * CP-18 : chaque limite est une ligne-tâche « … › » qui ouvre l'endroit où la régler (pièce, brassin, journal, feuille du solde) ; une limite sans cible
 * reste une phrase (information, pas un manque). Un brassin qui porte plusieurs limites les range sous son nom.
 */
interface Props {
  ledger: LedgerSummary;
  openingCashReady: boolean;
  warnings: string[];
  /** Les mêmes limites avec leur cible (`buildForecast().avertissements`, plus les parts de brassin sans montant) ; sans elles, des phrases. */
  avertissements?: AvertissementCible[];
  onCible?: (cible: CibleLimite) => void;
  /** Pièces à payer ou à encaisser sans échéance : hors des mois, dites ici avec leur montant. */
  undatedCount?: number;
  undatedOutCents?: number;
  undatedInCents?: number;
  /** Parts de brassin sans montant (jamais écrites 0,00 sur l'escalier) : « Pale Ale d'hiver · emballage : à compléter ». */
  aCompleter?: string[];
  onProfile: () => void;
  onPayments: () => void;
}

/** Ces deux limites ont déjà leur ligne dans la feuille (« Confirmer les paiements », « Renseigner le solde de départ ») : pas de doublon. */
const PORTEE_AILLEURS: ReadonlyArray<CibleLimite['kind']> = ['journal-a-confirmer', 'solde'];

function Tache({ a, enTete, onCible }: { a: AvertissementCible; enTete: string; onCible: (c: CibleLimite) => void }) {
  return <button type="button" className="finance-task" data-limite={a.cible.kind} onClick={() => onCible(a.cible)}>
    <span><strong>{enTete}</strong><small>{a.detail}</small></span><ChevronRight size={16} aria-hidden="true"/></button>;
}

export function FinanceForecastSummary({ ledger, openingCashReady, warnings, avertissements = [], onCible, undatedCount = 0, undatedOutCents = 0, undatedInCents = 0, aCompleter = [], onProfile, onPayments }: Props) {
  const incomplete = warnings.length > 0 || !ledger.cashComplete || aCompleter.length > 0;
  /* Test d'écran P5B, constat 15 : un seul pli par ligne de trop ; les limites sont écrites d'emblée, sous l'avis, sans second « Voir les limites ». */
  const limites = [...warnings, ...aCompleter];
  /* Ce qui manque, une phrase vraie : seulement les causes que les données disent (aucune cause inventée). */
  const causes = [!openingCashReady ? 'le solde de départ' : '', ledger.unknownPaymentCount > 0 ? compte(ledger.unknownPaymentCount, 'paiement') + ' à confirmer' : ''].filter(Boolean);
  const manque = causes.length ? `Il manque ${causes.join(' et ')} ; les montants couvrent le reste.` : limites.length ? 'Voir les limites ci-dessous : certains montants restent partiels.' : 'Certaines données manquent : les montants sont partiels.';

  // Chaque chaîne de limite retrouve sa cible (même texte) ; celles que la feuille porte déjà plus haut disparaissent de la liste.
  const parTexte = new Map(avertissements.map(a => [a.texte, a]));
  const lignes = onCible ? [...new Set(limites)].flatMap(texte => { const a = parTexte.get(texte); return a && PORTEE_AILLEURS.includes(a.cible.kind) ? [] : [{ texte, a }]; }) : [];
  // Regroupe par brassin dès qu'il porte au moins deux limites : son nom une fois, puis ce qui manque.
  const nParLot = new Map<string, number>();
  for (const { a } of lignes) if (a?.batchId) nParLot.set(a.batchId, (nParLot.get(a.batchId) ?? 0) + 1);
  const rangees: Array<{ cle: string; lot?: string; titreLot?: string; lignes: typeof lignes }> = [];
  for (const l of lignes) {
    const lot = l.a?.batchId && (nParLot.get(l.a.batchId) ?? 0) > 1 ? l.a.batchId : undefined;
    const existante = lot ? rangees.find(r => r.lot === lot) : undefined;
    if (existante) existante.lignes.push(l);
    else rangees.push({ cle: lot ?? l.texte, lot, titreLot: lot ? l.a!.titre.split(' · ')[0] : undefined, lignes: [l] });
  }
  const nbVisibles = onCible ? lignes.length : limites.length;

  return <section className="finance-forecast-summary" aria-label="Limites de la prévision">
    {incomplete && <div className="finance-forecast-warning" role="status">
      <AlertCircle size={16}/><div><strong>Prévision incomplète</strong><p>{manque}</p></div>
    </div>}
    {!incomplete && undatedCount === 0 && <p className="finance-muted">Rien ne manque à cette prévision.</p>}
    {undatedCount > 0 && <p className="finance-notice" data-undated-line>Échéance à préciser : {compte(undatedCount, 'pièce')}
      {undatedOutCents > 0 && <> · {formatCHF(undatedOutCents)} à payer</>}{undatedInCents > 0 && <> · {formatCHF(undatedInCents)} à encaisser</>}</p>}
    {ledger.unknownPaymentCount > 0 && <button type="button" className="finance-task" onClick={onPayments}><span><strong>Confirmer les paiements</strong><small>{compte(ledger.unknownPaymentCount, 'paiement historique')} à vérifier.</small></span><ChevronRight size={16}/></button>}
    <button type="button" className="finance-link" onClick={onProfile}>{openingCashReady ? 'Solde et paramètres financiers' : 'Renseigner le solde de départ'}<ChevronRight size={14}/></button>
    {onCible
      ? nbVisibles > 0 && <ul className="finance-issues" style={{ listStyle: 'none', paddingLeft: 0 }} aria-label={`Limites de cette prévision (${nbVisibles})`}>{rangees.map(r => r.lot
        ? <li key={r.cle}><p className="finance-muted"><strong>{r.titreLot}</strong></p>{r.lignes.map(({ texte, a }) => <Tache key={texte} a={a!} enTete={a!.sujet ?? a!.titre} onCible={onCible}/>)}</li>
        : <React.Fragment key={r.cle}>{r.lignes.map(({ texte, a }) => <li key={texte}>{a ? <Tache a={a} enTete={a.titre} onCible={onCible}/> : texte}</li>)}</React.Fragment>)}</ul>
      : limites.length > 0 && <ul className="finance-issues" aria-label={`Limites de cette prévision (${limites.length})`}>{limites.map(warning => <li key={warning}>{warning}</li>)}</ul>}
  </section>;
}
