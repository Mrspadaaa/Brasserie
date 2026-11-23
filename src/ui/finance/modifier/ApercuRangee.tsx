import React from 'react';
import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import { paymentState, todayISO, transactionAmount, transactionDirection } from '../../../domain/finance/ledger';
import { amountOnly } from '../financeFormat';
import { echeance, etatDeLigne, pieceDe } from '../operations/calculs';
import { GROUPES, type GroupeId } from '../operations/groupes';
import './modifier.css';

/**
 * L'aperçu de m5mo-c : la rangée v6a telle qu'elle sera dans Opérations, avant (barrée, pâle) et après (hachure « reste 3,50 »).
 * Deux étages comme la liste : nom et montant ; puis l'état, la pièce et le mot « avant » ou « après ».
 * L'état « après » vient de la même règle que la liste (`paymentState`, `etatDeLigne`) appliquée au plan simulé : jamais un texte écrit à la main.
 */
const ICONE_SANS_PIECE = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 2.4" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/></svg>;
const ICONE_PIECE = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M9.5 14l2 2 3.5-4"/></svg>;

function groupeDe(tx: Transaction): GroupeId {
  if (tx.category === 'materiel' || tx.category === 'renovation') return 'part';
  return GROUPES[tx.category as GroupeId] ? tx.category as GroupeId : 'divers';
}

export function RangeeApercu({ piece, paiements, transactions, mot, ancien = false, nom, aRecupererCents = 0, entrantRecup = false }: {
  piece: Transaction; paiements: FinancialPayment[]; transactions: Transaction[];
  mot: 'avant' | 'après'; ancien?: boolean; nom: string;
  /** FN-36 : « J'ai bien payé » : le trop-payé que la correction écrira en créance ; l'aperçu le dit à côté du « payé » (la pièce elle-même est soldée au nouveau montant). */
  aRecupererCents?: number; entrantRecup?: boolean;
}) {
  const aujourdhui = todayISO();
  const etat = paymentState(piece, paiements, transactions, aujourdhui);
  const entrant = transactionDirection(piece, transactions) === 'in';
  const ligne = etatDeLigne(piece, etat, entrant, paiements, aujourdhui);
  const ouvert = etat.state === 'partial' || etat.state === 'unpaid';
  const partiel = etat.state === 'partial';
  const ech = echeance(piece.finance?.dueDate, aujourdhui);
  const verbe = entrant ? 'encaissé' : 'payé';
  const lisere = ligne.retard ? 'rgb(var(--alert-strong-texte))' : GROUPES[groupeDe(piece)].liseré;
  const p = pieceDe(piece);
  return <div className={`mod-rw${ancien ? ' mod-old' : ''}`} data-mot={mot}>
    <i className="mod-rw-bar" data-hachure={ouvert || undefined} style={{ '--mod-lisere': lisere } as React.CSSProperties} aria-hidden="true" />
    <b className="mod-rw-nom">{nom}</b>
    <span className="mod-m mod-rw-m">{entrant ? '+ ' : ''}{amountOnly(transactionAmount(piece))}</span>
    <span className="mod-rw-meta">
      {partiel
        ? <>
            <span className="mod-tg mod-tg-ok">✓ {verbe} {amountOnly(etat.paidCents)}</span>
            <span className={`mod-tg ${ech.retard ? 'mod-tg-late' : 'mod-tg-pay'}`}>reste {amountOnly(etat.remainingCents)}</span>
          </>
        : <span className={`mod-tg mod-tg-${ligne.ton}`}>{ligne.texte}</span>}
      {aRecupererCents > 0 && <span className="mod-tg mod-tg-pay">{amountOnly(aRecupererCents)} {entrantRecup ? 'à rembourser' : 'à récupérer'}</span>}
      {ligne.ton !== 'void' && <span className={`mod-pc${p.manque ? ' mod-no' : ''}`}>{p.manque ? ICONE_SANS_PIECE : ICONE_PIECE}{p.texte}</span>}
      <span className="mod-rw-mot">{mot}</span>
    </span>
  </div>;
}
