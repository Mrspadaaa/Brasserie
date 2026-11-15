import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCHF, todayISO, type LedgerSummary } from '../../../domain/finance/ledger';
import type { JournalRequest } from '../TransactionJournal';
import { amountOnly, shortDate } from '../financeFormat';
import { renvoiCaisse } from '../causeCaisse';
import { compte } from '../../../services/plural';

export interface CaisseProps {
  ledger: LedgerSummary;
  openingCashReady: boolean;
  openingCash?: { amountCents: number; date: string; confirmed: boolean };
  onProfile: () => void;
  onJournal: (request: Omit<JournalRequest, 'key'>) => void;
  onTransaction: (id: string) => void;
  onPayment: (id: string) => void;
}
const CHIPS = 3;

/** E4 : « En caisse », la barre libre / à payer, les règlements à suivre en pastilles avec leur geste. */
export function Caisse({ ledger, openingCash, onProfile, onJournal, onTransaction, onPayment }: CaisseProps) {
  const connue = ledger.cashComplete && ledger.cashCents != null;
  const caisse = connue ? ledger.cashCents! : 0;
  const libre = caisse - ledger.payablesCents;
  const total = Math.max(1, caisse);
  const echus = ledger.outstanding.filter(e => e.dueDate && e.dueDate < todayISO());
  const ordre = [...echus, ...ledger.outstanding.filter(e => !echus.includes(e))];
  const solde = openingCash && Number.isSafeInteger(openingCash.amountCents) ? openingCash : null;
  // CP-4 : la note sous « En caisse » dit la cause exacte de la caisse inconnue et renvoie là où elle se règle.
  const renvoi = connue ? null : renvoiCaisse(ledger, openingCash, todayISO());
  const ouvrirRenvoi = () => renvoi?.geste === 'paiements' ? onJournal({ scope: 'all', allDates: true, filter: 'unknown' }) : renvoi?.geste === 'registre' ? onJournal({ scope: 'all', allDates: true }) : onProfile();

  return <div className="syn-caisse">
    <button type="button" className="syn-ct syn-ct-bouton" aria-label="Solde et paramètres financiers" onClick={onProfile}>
      <span>En caisse</span>
      {connue ? <span className="syn-m syn-f">{formatCHF(caisse)}</span> : <span className="syn-m syn-f">À compléter</span>}
    </button>
    {!connue && renvoi && <p className="syn-note">
      <button type="button" className="syn-note-lien" onClick={ouvrirRenvoi}>
        <span>{renvoi.cause === 'a-confirmer' && solde
          ? <>Solde de départ saisi : {formatCHF(solde.amountCents)}, à confirmer. <span className="syn-note-date">Solde saisi : {formatCHF(solde.amountCents)} au {solde.date.split('-').reverse().join('.')}, pas encore confirmé. Coche « J’ai vérifié ce solde ».</span></>
          : <>{renvoi.cause === 'paiements' ? `${compte(ledger.unknownSinceOpeningCount, 'paiement', 'paiements')} à confirmer` : renvoi.titre}{renvoi.cause !== 'absent' && renvoi.aide && <span className="syn-note-date">{renvoi.aide}</span>}</>}</span>
        <ChevronRight size={12} aria-hidden="true" />
      </button>
    </p>}
    {connue && <>
      <div className="syn-cb" role="img" aria-label={`En caisse ${formatCHF(caisse)} : ${libre >= 0 ? `libre ${formatCHF(libre)}` : `manque ${formatCHF(-libre)}`}, à payer ${formatCHF(ledger.payablesCents)}`}>
        {libre > 0 && <i className="syn-cb-libre" style={{ flex: libre }}/>}
        {ledger.payablesCents > 0 && <i className="syn-cb-dette" style={{ flex: Math.min(ledger.payablesCents, total) }}/>}
      </div>
      <div className="syn-ct">
        <span>{libre >= 0 ? 'libre' : 'manque'} <span className="syn-m">{libre >= 0 ? amountOnly(libre) : `−${amountOnly(-libre)}`}</span></span>
        {ledger.payablesCents > 0 && <button type="button" aria-label="Voir les factures à payer" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'payable' })}>à payer <span className="syn-m">{amountOnly(ledger.payablesCents)}</span></button>}
      </div>
    </>}
    {!connue && ledger.payablesCents > 0 && <div className="syn-ct">
      <span/>
      <button type="button" aria-label="Voir les factures à payer" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'payable' })}>à payer <span className="syn-m">{amountOnly(ledger.payablesCents)}</span></button>
    </div>}
    {ledger.receivablesCents > 0 && <div className="syn-ct">
      <span/>
      <button type="button" aria-label="Voir les montants à encaisser" onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'receivable' })}>à encaisser <span className="syn-m">{amountOnly(ledger.receivablesCents)}</span></button>
    </div>}
    {ordre.length > 0 && <div className="syn-pay">
      {ordre.slice(0, CHIPS).map(e => {
        const retard = !!e.dueDate && e.dueDate < todayISO();
        const entrant = e.direction === 'in';
        return <span key={e.id} className={`syn-chip${retard ? ' syn-chip-retard' : ''}`}>
          {retard && <><span className="syn-dot" aria-hidden="true"/><span className="syn-sr">En retard : </span></>}
          <button type="button" className="syn-chip-nom" aria-label={`Ouvrir ${e.description}`} onClick={() => onTransaction(e.id)}>{e.description} <span className="syn-m">{amountOnly(e.remainingCents)}</span>
            <span className="syn-sr">{e.dueDate ? `, échéance ${shortDate(e.dueDate)}` : ', échéance à préciser'}</span></button>
          <button type="button" className="syn-chip-geste" aria-label={`Noter ${entrant ? 'l’encaissement' : 'le paiement'} de ${e.description}`} onClick={() => onPayment(e.id)}>{entrant ? 'Encaisser' : 'Payer'}</button>
        </span>;
      })}
      {ordre.length > CHIPS && <button type="button" className="syn-chip syn-chip-plus" aria-label={`Voir les ${ordre.length} règlements`} onClick={() => onJournal({ scope: 'all', allDates: true, filter: 'due' })}>+ {ordre.length - CHIPS}</button>}
    </div>}
  </div>;
}
