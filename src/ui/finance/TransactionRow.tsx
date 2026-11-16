import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import type { Transaction } from '../../types';
import type { FinancialPayment } from '../../domain/finance/types';
import { formatCHF, isActiveTransaction, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { FinanceService } from '../../services/financeService';
import { CATEGORY_LABELS, idFor } from './FinanceForms';
import { amountOnly } from './financeFormat';
import { contrePaiement, dernierPaiementAnnulable, etatDeLigne, paiementRapide, pieceDe, tiersAAfficher } from './operations/calculs';
import { GROUPES, type GroupeId } from './operations/groupes';
import { ContextePaire } from './operations/doublons';
import './operations.css';
import './operations/paire.css';

/**
 * Une opération du journal (v6a, « Lignes serrées ») : deux étages serrés, le geste sous le montant.
 *   étage 1 : quoi · qui                      montant
 *   étage 2 : état · échéance ou date · pièce   [geste]
 *
 * Un seul geste par ligne, dans l'ordre : payer (ou encaisser), confirmer, annuler le paiement qu'on vient d'écrire, joindre une pièce.
 * ⚠️ « ✓ Payé » écrit un paiement du reste dû, daté d'aujourd'hui, par banque : une hypothèse du geste rapide, dite dans la pastille
 * (« · banque ») et, juste après, dans un avis « Payé 400,00 · Annuler · Autre montant » (FN-2) ; un autre mode ou une autre date se corrigent
 * par « Autre montant » (la feuille Payer m5pa-d, sans rien inverser avant l'enregistrement) ou dans la fiche. Un état « à confirmer » n'écrit rien : la date réelle se demande.
 * ⚠️ Un seul bouton contient le texte (le bouton principal) ; son ::after couvre la ligne, le geste est un second bouton au-dessus
 * (jamais un bouton dans un bouton).
 * Dans la paire de doublons (m1do-a), la ligne reçoit `ContextePaire` : son geste devient « Annuler celle-ci » (ou « Rétablir » dans le délai).
 */
const ICONE_PIECE = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M9.5 14l2 2 3.5-4"/></svg>;
const ICONE_SANS_PIECE = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 2.4" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/></svg>;

/**
 * Les paiements écrits par le geste « ✓ Payé » depuis l'ouverture de l'application, avec l'heure du geste (CP-12, v6a état « Après »). « Annuler » ne se montre que pour
 * eux : une ligne payée aujourd'hui par un autre chemin (la fiche, un import) propose « + pièce » comme toute ligne sans pièce. Hors du composant :
 * la ligne change de groupe en passant à « payé » et se remonte, un état local serait perdu. Il se vide au rechargement : « juste après le geste ».
 */
const payesParLeGeste = new Map<string, number>();
/** FN-2 : l'avis reste ce temps sous la ligne ; ensuite, la ligne garde son « Annuler » (v6a, état « Après »). */
const DUREE_AVIS_MS = 10000;
/** FN-33 : l'avis naît là où l'on vient de toucher « ✓ Payé » ; le second toucher d'un double (ou un toucher sur une ligne qui vient de bouger) ne doit ni annuler ni ouvrir Payer. */
const GARDE_AVIS_MS = 800;

export function TransactionRow({ transaction, transactions, payments, state: given, onOpen, onAddProof, onPay }: {
  transaction: Transaction;
  transactions: Transaction[];
  payments: FinancialPayment[];
  /** État déjà calculé par la liste, pour ne pas le refaire une fois par ligne. */
  state?: ReturnType<typeof paymentState>;
  onOpen: () => void;
  /** « + pièce » : ouvre la modification de l'écriture ; sans lui, la fiche. */
  onAddProof?: () => void;
  /**
   * Paiement à confirmer, ou « Autre montant » : ouvre la feuille de paiement (la date réelle se demande). Sans lui, la fiche.
   * « Autre montant » passe le paiement rapide à REMPLACER : rien n'est écrit ici ; c'est l'enregistrement de Payer (m5pa-d) qui inverse ce paiement
   * puis écrit le nouveau, un lot par étape. Fermer la feuille ne change rien.
   */
  onPay?: (remplace?: FinancialPayment) => void;
}) {
  const aujourdhui = todayISO();
  // Le geste ne répète pas le nom de la ligne : il le DÉCRIT (aria-describedby), et le nom du bouton principal reste unique.
  const nomId = useId();
  const state = given ?? paymentState(transaction, payments, transactions, aujourdhui);
  const sens = transactionDirection(transaction, transactions);
  const entrant = sens === 'in';
  const montant = transactionAmount(transaction);
  const categorie = CATEGORY_LABELS[transaction.category] ?? transaction.category;
  // Le client déjà écrit dans le titre (« Vente 10 × Bière — Restaurant du Lac ») ne se répète pas après lui (revue du 10.11).
  const tiers = tiersAAfficher(transaction.description, transactionVendor(transaction));
  const etat = etatDeLigne(transaction, state, entrant, payments, aujourdhui);
  const piece = pieceDe(transaction);
  const actif = isActiveTransaction(transaction) && transaction.finance?.refundApplication !== 'offset';
  const dernierDuJour = actif ? dernierPaiementAnnulable(transaction, payments, aujourdhui) : null;
  const annulable = dernierDuJour && payesParLeGeste.has(dernierDuJour.id) ? dernierDuJour : null;
  const sansPiece = actif && piece.manque && piece.texte === 'sans pièce';
  const paire = useContext(ContextePaire);
  const enAttente = !!paire?.enAttente(transaction.id);
  // FN-2 : l'avis suit le geste, même si la ligne se remonte en changeant de groupe (l'heure du geste vit hors du composant).
  const [, tic] = useState(0);
  const poseLe = annulable ? payesParLeGeste.get(annulable.id) ?? 0 : 0;
  const avis = !!annulable && !paire && Date.now() - poseLe < DUREE_AVIS_MS;
  useEffect(() => {
    if (!avis) return;
    const t = setTimeout(() => tic(n => n + 1), Math.max(0, DUREE_AVIS_MS - (Date.now() - poseLe)) + 20);
    return () => clearTimeout(t);
  }, [avis, poseLe]);
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
    payesParLeGeste.set(paiement.id, Date.now());
    setPaiementId(() => ({ id: idFor('PAI'), at: new Date().toISOString() })); // le prochain paiement de cette ligne (après « Annuler ») est un autre paiement
    setFlash(true); clearTimeout(minuteur.current); minuteur.current = setTimeout(() => setFlash(false), 3000);
  });
  const tropTot = () => avis && Date.now() - poseLe < GARDE_AVIS_MS;
  const annuler = () => { if (tropTot()) return; ecrire(() => { if (annulable) FinanceService.recordPayment(contrePaiement(annulable, new Date().toISOString())); }); };
  /** « Autre montant » : la feuille Payer (m5pa-d) s'ouvre SANS rien écrire ; le paiement rapide lui est passé pour que son enregistrement l'inverse puis écrive le nouveau. */
  const autreMontant = () => { if (!annulable || tropTot()) return; if (onPay) onPay(annulable); else onOpen(); };
  const confirmer = () => { if (onPay) onPay(); else onOpen(); };

  type Geste = { texte: string; aria: string; fort: boolean; action: () => void };
  const ouvert = actif && (state.state === 'unpaid' || state.state === 'partial') && state.remainingCents > 0;
  const gestePaire: Geste | null = !paire ? null : enAttente
    ? { texte: 'Rétablir', aria: 'Rétablir cette pièce', fort: false, action: () => paire.retablir(transaction.id) }
    : isActiveTransaction(transaction)
      ? { texte: 'Annuler celle-ci', aria: 'Annuler cette pièce en double', fort: false, action: () => paire.annuler(transaction.id) }
      : null;
  const geste: Geste | null = paire ? gestePaire : avis ? null : ouvert
    ? { texte: entrant ? '✓ Encaissé' : '✓ Payé', aria: `${entrant ? 'Encaisser' : 'Payer'} ${formatCHF(state.remainingCents)}`, fort: !etat.retard, action: payer }
    : actif && state.state === 'unknown'
      ? { texte: 'À confirmer', aria: 'Confirmer le paiement', fort: false, action: confirmer }
      : annulable
        ? { texte: 'Annuler', aria: 'Annuler le paiement du jour', fort: false, action: annuler }
        : sansPiece
          ? { texte: '+ pièce', aria: 'Joindre une pièce', fort: false, action: onAddProof ?? onOpen }
          : null;

  const groupe: GroupeId = transaction.category === 'materiel' || transaction.category === 'renovation' ? 'part' : (GROUPES[transaction.category as GroupeId] ? transaction.category as GroupeId : 'divers');
  const liseré = ouvert ? 'hachure' : undefined;
  const lisereCouleur = etat.retard ? 'rgb(var(--alert-strong-texte))' : GROUPES[groupe].liseré;
  const money = `${entrant ? '+ ' : ''}${formatCHF(montant)}`;
  // m1do-a : une pièce annulée dans le délai se montre barrée, « annulée le 15 nov. », avec sa pièce et son « Rétablir ».
  const ton = enAttente ? 'void' : etat.ton;
  const texteEtat = enAttente ? `annulée le ${paire?.jour}` : etat.texte;
  const lisible = texteEtat.replace(/^✓\s*/, '');
  // Pièce en partie payée (q6, point 10) : « Reste 160,00 CHF à payer · 25 nov. · dans 10 j » se coupait à 390 ; la pastille garde le reste et l'échéance, le geste « Payé » dit déjà « à payer ». Le nom accessible garde la phrase entière.
  const partiel = ouvert && state.state === 'partial';
  const texteTg = partiel ? texteEtat.replace(/^(Reste \S+) CHF à (?:payer|encaisser)/, (_, reste: string) => reste) : texteEtat;
  const messageErreur = erreur || paire?.erreur(transaction.id) || '';

  return <div className="ops-row" data-flash={flash || undefined} data-ton={ton} data-partiel={partiel ? '' : undefined}>
    <span className="ops-bar" data-hachure={liseré} style={{ '--ops-couleur': lisereCouleur } as React.CSSProperties} aria-hidden="true"/>
    <button type="button" className="ops-main finance-op" onClick={onOpen}
      aria-label={`${transaction.description} · ${categorie}${tiers ? ` · ${tiers}` : ''} · ${money} · ${lisible} · ${piece.texte}`}>
      <span className="ops-q" title={`${transaction.description}${tiers ? ` · ${tiers}` : ''}`}><span className="ops-nom" id={nomId}>{transaction.description}</span>{tiers && <small> · {tiers}</small>}</span>
      <span className="ops-meta">
        <span className={`ops-tg ops-tg-${ton}`}>{texteTg}</span>
        {(ton !== 'void' || enAttente) && <span className={`ops-pc${piece.manque ? ' ops-no' : ''}`}>{piece.manque ? ICONE_SANS_PIECE : ICONE_PIECE}{piece.texte}</span>}
      </span>
    </button>
    {geste && <button type="button" className={geste.fort ? 'ops-btn ops-act' : 'ops-mini ops-act'} aria-label={geste.aria} aria-describedby={nomId} onClick={geste.action}>{geste.texte}</button>}
    <span className={`ops-a ops-m${entrant ? ' ops-in' : ''}`} aria-hidden="true">{entrant ? '+' : ''}{amountOnly(montant)}</span>
    {avis && annulable && <div className="ops-avis" role="status">
      <span>Payé <b className="ops-m">{amountOnly(annulable.amountCents)}</b></span>
      <button type="button" className="ops-avis-b" aria-label={`Annuler le paiement de ${amountOnly(annulable.amountCents)}`} onClick={annuler}>Annuler</button>
      <button type="button" className="ops-avis-b" aria-label="Autre montant : ouvrir la feuille Payer" onClick={autreMontant}>Autre montant</button>
    </div>}
    {messageErreur && <p className="ops-erreur" role="alert">{messageErreur}</p>}
  </div>;
}
