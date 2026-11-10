import React, { useEffect, useId, useRef, useState } from 'react';
import type { Transaction } from '../../types';
import type { FinancialPayment } from '../../domain/finance/types';
import { formatCHF, isActiveTransaction, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { CATEGORY_LABELS, idFor } from './FinanceForms';
import { amountOnly } from './financeFormat';
import { contrePaiement, dernierPaiementAnnulable, etatDeLigne, paiementRapide, pieceDe } from './operations/calculs';
import { GROUPES, type GroupeId } from './operations/groupes';
import './operations.css';

/**
 * Une opération du journal (v6b) : deux étages serrés, le geste à côté du montant.
 *   étage 1 : quoi · qui                    [geste]  montant
 *   étage 2 : état · échéance ou date · pièce
 *
 * Un seul geste par ligne, dans l'ordre : payer (ou encaisser), annuler le paiement du jour, joindre une pièce.
 * ⚠️ « ✓ Payé » écrit un paiement du reste dû, daté d'aujourd'hui, par banque : une hypothèse du geste rapide, dite dans la pastille
 * (« · banque ») ; un autre mode ou une autre date se corrigent dans la fiche. Un état « à confirmer » n'écrit rien : la date réelle se demande.
 * ⚠️ Un seul bouton contient le texte (le bouton principal) ; son ::after couvre la ligne, le geste est un second bouton au-dessus
 * (jamais un bouton dans un bouton).
 */
const ICONE_PIECE = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M9.5 14l2 2 3.5-4"/></svg>;
const ICONE_SANS_PIECE = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeDasharray="3 2.4" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/></svg>;

export function TransactionRow({ transaction, transactions, payments, state: given, onOpen, onAddProof, onPay }: {
  transaction: Transaction;
  transactions: Transaction[];
  payments: FinancialPayment[];
  /** État déjà calculé par la liste, pour ne pas le refaire une fois par ligne. */
  state?: ReturnType<typeof paymentState>;
  onOpen: () => void;
  /** « + pièce » : ouvre la modification de l'écriture ; sans lui, la fiche. */
  onAddProof?: () => void;
  /** Paiement à confirmer : ouvre la feuille de paiement (la date réelle se demande). Sans lui, la fiche. */
  onPay?: () => void;
}) {
  const aujourdhui = todayISO();
  // Le geste ne répète pas le nom de la ligne : il le DÉCRIT (aria-describedby), et le nom du bouton principal reste unique.
  const nomId = useId();
  const state = given ?? paymentState(transaction, payments, transactions, aujourdhui);
  const sens = transactionDirection(transaction, transactions);
  const entrant = sens === 'in';
  const montant = transactionAmount(transaction);
  const categorie = CATEGORY_LABELS[transaction.category] ?? transaction.category;
  const tiers = transactionVendor(transaction);
  const etat = etatDeLigne(transaction, state, entrant, payments, aujourdhui);
  const piece = pieceDe(transaction);
  const actif = isActiveTransaction(transaction) && transaction.finance?.refundApplication !== 'offset';
  const annulable = actif ? dernierPaiementAnnulable(transaction, payments, aujourdhui) : null;
  const sansPiece = actif && piece.manque && piece.texte === 'sans pièce';
  // Un identifiant de paiement par ligne : un double toucher rejoue le même paiement (refusé « déjà enregistré » s'il diffère, ignoré s'il est identique).
  const [paiementId, setPaiementId] = useState(() => ({ id: idFor('PAI'), at: new Date().toISOString() }));
  const occupe = useRef(false);
  const [erreur, setErreur] = useState('');
  const [flash, setFlash] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(minuteur.current), []);

  const ecrire = (action: () => void) => {
    if (occupe.current) return;
    occupe.current = true;
    try { action(); setErreur(''); } catch (e) { setErreur(e instanceof Error ? e.message : 'Écriture impossible.'); } finally { occupe.current = false; }
  };
  const payer = () => ecrire(() => {
    const paiement = paiementRapide(transaction, state, sens, aujourdhui, paiementId.id, paiementId.at);
    if (!paiement) throw new Error('Rien à régler sur cette pièce.');
    FinanceService.recordPayment(paiement);
    setPaiementId(() => ({ id: idFor('PAI'), at: new Date().toISOString() })); // le prochain paiement de cette ligne (après « Annuler ») est un autre paiement
    setFlash(true); clearTimeout(minuteur.current); minuteur.current = setTimeout(() => setFlash(false), 3000);
  });
  const annuler = () => ecrire(() => { if (annulable) FinanceService.recordPayment(contrePaiement(annulable, new Date().toISOString())); });

  type Geste = { texte: string; aria: string; fort: boolean; action: () => void };
  const ouvert = actif && (state.state === 'unpaid' || state.state === 'partial') && state.remainingCents > 0;
  const geste: Geste | null = ouvert
    ? { texte: entrant ? '✓ Encaissé' : '✓ Payé', aria: `${entrant ? 'Encaisser' : 'Payer'} ${formatCHF(state.remainingCents)}`, fort: !etat.retard, action: payer }
    : actif && state.state === 'unknown'
      ? { texte: 'À confirmer', aria: 'Confirmer le paiement', fort: false, action: onPay ?? onOpen }
      : annulable
        ? { texte: 'Annuler', aria: 'Annuler le paiement du jour', fort: false, action: annuler }
        : sansPiece
          ? { texte: '+ pièce', aria: 'Joindre une pièce', fort: false, action: onAddProof ?? onOpen }
          : null;

  const groupe: GroupeId = transaction.category === 'materiel' || transaction.category === 'renovation' ? 'part' : (GROUPES[transaction.category as GroupeId] ? transaction.category as GroupeId : 'divers');
  const liseré = ouvert ? 'hachure' : undefined;
  const lisereCouleur = etat.retard ? 'rgb(var(--alert-strong-texte))' : GROUPES[groupe].liseré;
  const money = `${entrant ? '+ ' : ''}${formatCHF(montant)}`;
  const lisible = etat.texte.replace(/^✓\s*/, '');

  return <div className="ops-row" data-flash={flash || undefined} data-ton={etat.ton}>
    <span className="ops-bar" data-hachure={liseré} style={{ '--ops-couleur': lisereCouleur } as React.CSSProperties} aria-hidden="true"/>
    <button type="button" className="ops-main finance-op" onClick={onOpen}
      aria-label={`${transaction.description} · ${categorie}${tiers ? ` · ${tiers}` : ''} · ${money} · ${lisible} · ${piece.texte}`}>
      <span className="ops-q"><span className="ops-nom" id={nomId}>{transaction.description}</span>{tiers && <small> · {tiers}</small>}</span>
      <span className="ops-meta">
        <span className={`ops-tg ops-tg-${etat.ton}`}>{etat.texte}</span>
        {!(etat.ton === 'void') && <span className={`ops-pc${piece.manque ? ' ops-no' : ''}`}>{piece.manque ? ICONE_SANS_PIECE : ICONE_PIECE}{piece.texte}</span>}
      </span>
    </button>
    {geste && <button type="button" className={geste.fort ? 'ops-btn ops-act' : 'ops-mini ops-act'} aria-label={geste.aria} aria-describedby={nomId} onClick={geste.action}>{geste.texte}</button>}
    <span className={`ops-a ops-m${entrant ? ' ops-in' : ''}`} aria-hidden="true">{entrant ? '+' : ''}{amountOnly(montant)}</span>
    {erreur && <p className="ops-erreur" role="alert">{erreur}</p>}
  </div>;
}
