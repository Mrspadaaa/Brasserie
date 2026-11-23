// « Saisir à la main » — v01s (D426, « Le genre d'abord », simplifiée), portée de `work/missions/2026-11-22-saisie-main/choix-saisie.html`.
// Repos : habituels en tête, tuiles « Ça sort » / « Ça rentre », Remboursement en pointillés, la carte « Pour quoi ? · date · 0,00 ».
// Toucher un genre replie les tuiles en bande (« Ça sort [Loyer] changer ») ET ouvre le clavier sur le montant (même champ, focus dans le geste) ;
// le pied (Mon mois + le bouton qui dit le sens) reste au-dessus du clavier ; Entrée = ce bouton. Nom facultatif, gris par défaut, ou une puce des
// derniers noms ; « Revient ? » en 4 segments ; la date par la frise partagée (ChoixDate). Écrit par les services de Finances : pièce, paiement,
// prévision récurrente (rien de neuf dans le schéma). Le cas avec document reste la lecture (ExpenseSheet, p3c-3) : l'icône en haut à droite y passe.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Briefcase, CalendarDays, Check, ChevronDown, FileText, Home, Landmark, Link2, MoreHorizontal, Pencil, PiggyBank, Percent, Plus, Repeat, Search, ShoppingCart, Tag, Undo2, Wallet, X } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { ChoixDate } from '../ChoixDate';
import { CategoryTag } from '../finance/CategoryTag';
import { libelleEcriture } from '../../domain/finance/libelleEcriture';
import { CATEGORY_LABELS, idFor } from '../finance/FinanceForms';
import { StorageService } from '../../services/storage';
import { FinanceService, validateRefundTransaction } from '../../services/financeService';
import { FirestoreRepo, isConfirmedWriteRejection } from '../../services/firestoreRepo';
import { todayISO, validateFinanceTransaction } from '../../domain/finance/ledger';
import type { FinanceTransaction } from '../../domain/finance/types';
import type { FinanceCategory } from '../../types';
import { retirerEcriture } from '../finance/modifier/retirerEcriture';
import { soldeLeVuPlan } from '../finance/soldePrevu';
import type { FinancialPlan } from '../../domain/finance/types';
import {
  CATEGORIES_ACHAT, GENRES, RENTRE, SORT, achatPrevu, avecGenre, brouillonNeuf, chf, dateDeFin, derniersNoms, echeances, finsProposees, habituels, horsResultat,
  dateMontree, grouper, jjmm, lireMontant, nomFinal, piecesRemboursables, preparer, sensDe, signe, sommeDouzeMois, METHODES, propositionsTiers, tiersExiste, verbeEnregistrer,
  type Brouillon, type DateTiree, type Ecriture, type GenreId, type Habituel, type Methode, type Rythme
} from './modele';
import '../finance/finance.css';
import './saisie.css';

/** Ce que l'achat emporte vers le formulaire complet (articles et stock). */
export interface PrefillAchat { amount?: number; description: string; vendor: string; category: FinanceCategory; date: string }

const ICONE: Record<GenreId, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  achat: ShoppingCart, loyer: Home, abo: Repeat, salaire: Briefcase, impot: Percent, prel: Wallet, autreo: MoreHorizontal,
  vente: Tag, apport: PiggyBank, autrei: MoreHorizontal, rembt: Undo2
};
/** Teinte du picto de tuile : celle de la catégorie (DESIGN.md, Finances) ; l'impôt garde sa teinte rouille de la maquette. */
const TEINTE: Record<string, { fond: string; trait: string; seg: string }> = {
  chargesFixes: { fond: '#3F2556', trait: '#D8B9F4', seg: '#9856D2' }, apports: { fond: '#562544', trait: '#F4B9DE', seg: '#D256A4' },
  recettes: { fond: '#255633', trait: '#B9F4CA', seg: '#56D27B' }, brassage: { fond: '#564925', trait: '#F4E5B9', seg: '#D2B356' },
  materiel: { fond: '#564925', trait: '#F4E5B9', seg: '#D2B356' }, nettoyage: { fond: '#564925', trait: '#F4E5B9', seg: '#D2B356' },
  renovation: { fond: '#564925', trait: '#F4E5B9', seg: '#D2B356' }, impot: { fond: '#4E2A22', trait: '#F4C6B9', seg: '#D27356' },
  divers: { fond: '#2C2521', trait: '#D8CEC5', seg: '#9A8A7E' }
};
export const teinteGenre = (g: GenreId) => TEINTE[g === 'impot' ? 'impot' : GENRES[g].category];
const RYTHMES: Array<{ id: Rythme; nom: string }> = [{ id: 'une', nom: '1×' }, { id: 'monthly', nom: 'Mois' }, { id: 'quarterly', nom: 'Trim.' }, { id: 'yearly', nom: 'Année' }];
const RYTHME_LONG: Record<Rythme, string> = { une: 'une fois', monthly: 'chaque mois', quarterly: 'chaque trimestre', yearly: 'chaque année' };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const moisDe = (iso: string) => MOIS[Number(iso.slice(5, 7)) - 1];
const moisAn = (iso: string) => `${MOIS_COURT[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const TVA = [0, 0.026, 0.038, 0.081];

function Barres() {
  return <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true"><rect x="0" y="2" width="4" height="16" rx="1" fill="#6E9B5B" /><rect x="5" y="7" width="4" height="11" rx="1" fill="#9856D2" /><rect x="10" y="10" width="4" height="8" rx="1" fill="#D2B356" /><rect x="15" y="14" width="4" height="4" rx="1" fill="#56C1D2" /></svg>;
}
/** E40-4 : le picto du genre, réemployé par Modifier (la même bande que la saisie). */
export function Ic({ g, size = 16 }: { g: GenreId; size?: number }) { const I = ICONE[g]; return <I size={size} strokeWidth={2} />; }

/** Une pastille de date (« 22.11 ») ; touchée, la frise partagée du Calendrier s'ouvre dessous (GESTE-DATE-PARTOUT). */
function useDate() {
  const [ouverte, setOuverte] = useState<string | null>(null);
  /* le jour que le doigt tient dans la frise ouverte : la pastille le dit en direct (23.11), l'écriture reste au lâcher */
  const [tiree, setTiree] = useState<DateTiree | null>(null);
  useEffect(() => { setTiree(null); }, [ouverte]);
  return { ouverte, tiree, tirer: (cle: string, iso: string) => setTiree({ cle, iso }), basculer: (k: string) => setOuverte((o) => (o === k ? null : k)), fermer: () => setOuverte(null) };
}

export function SaisieMain({ onClose, onDocument, onArticles, onSaved }: {
  onClose: () => void; onDocument: () => void; onArticles: (p: PrefillAchat) => void; onSaved?: (message: string) => void;
}) {
  const titreId = useId();
  const aujourdhui = todayISO();
  const [version, setVersion] = useState(0);
  const donnees = useMemo(() => ({ txs: StorageService.getTransactions() as FinanceTransaction[], plans: FinanceService.getPlans() }), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const tvaInscrit = useMemo(() => Boolean(StorageService.getConfig()?.fiscal?.isTvaRegistered || FinanceService.getProfile().vatRegistered), []);
  const [id, setId] = useState(() => idFor('MAIN'));
  const [b, setB] = useState<Brouillon>(() => brouillonNeuf(aujourdhui));
  const [choisi, setChoisi] = useState(false);
  const [brut, setBrut] = useState('');
  const [nomEdit, setNomEdit] = useState(false);
  const [plateau, setPlateau] = useState(false);
  /* E35-5 : le choix de la contrepartie (« + autre ») : ouvert ou non, et ce qu'on y tape */
  const [tiersEdit, setTiersEdit] = useState(false);
  const [tiersSaisie, setTiersSaisie] = useState('');
  /* E38-8 : la liste des comptes (Banque, Espèces, TWINT, Autre), ouverte au toucher du compte */
  const [comptes, setComptes] = useState(false);
  const tiersRef = useRef<HTMLInputElement | null>(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');
  const [avis, setAvis] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [fait, setFait] = useState<(Ecriture & { attente: boolean; prevuAvant?: FinancialPlan }) | null>(null);
  /* WFA-15 : l'achat prévu refusé d'un toucher (« Ne solde pas ») ; un autre prévu proposé ensuite revient coché */
  const [refusPrevu, setRefusPrevu] = useState<string | null>(null);
  const [ombre, setOmbre] = useState(false);
  const [enLigne, setEnLigne] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const dates = useDate();
  const montantRef = useRef<HTMLInputElement | null>(null);
  const nomRef = useRef<HTMLInputElement | null>(null);
  const corps = useRef<HTMLDivElement | null>(null);
  const focusVoulu = useRef(false);

  useEffect(() => { const on = () => setEnLigne(true), off = () => setEnLigne(false); addEventListener('online', on); addEventListener('offline', off); return () => { removeEventListener('online', on); removeEventListener('offline', off); }; }, []);
  /* Le focus se pose dans le geste (même champ, gardé d'un état à l'autre) ; s'il a été perdu au rendu, on le repose ici. */
  useEffect(() => { if (focusVoulu.current) { focusVoulu.current = false; if (document.activeElement !== montantRef.current) montantRef.current?.focus({ preventScroll: true }); } });
  useEffect(() => { if (nomEdit) nomRef.current?.focus(); }, [nomEdit]);
  useEffect(() => { if (tiersEdit) tiersRef.current?.focus(); }, [tiersEdit]);
  const mesurerOmbre = () => { const c = corps.current; if (c) setOmbre(c.scrollHeight - c.scrollTop - c.clientHeight > 2); };
  useEffect(mesurerOmbre);

  const G = GENRES[b.genre];
  const jourVu = dateMontree('date', b.date, dates.tiree);
  const cents = lireMontant(brut);
  const sens = choisi ? sensDe(b, donnees.txs) : null;
  const piece = b.pieceId ? donnees.txs.find((t) => t.id === b.pieceId) : undefined;
  const pieceInfo = useMemo(() => (b.pieceId ? piecesRemboursables(donnees.txs, '', 500, false).find((p) => p.id === b.pieceId) : undefined), [b.pieceId, donnees.txs]);
  const habs = useMemo(() => habituels(donnees.txs, donnees.plans, aujourdhui), [donnees, aujourdhui]);
  const noms = useMemo(() => (choisi && G.qui ? derniersNoms(donnees.txs, b.genre) : []), [choisi, G.qui, donnees.txs, b.genre]);
  const clients = useMemo(() => (choisi && G.qui === 'Client' ? StorageService.getClients() : []), [choisi, G.qui, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const propositionsTiersListe = useMemo(() => (tiersEdit ? propositionsTiers(b.genre, tiersSaisie, { clients, transactions: donnees.txs }) : []), [tiersEdit, b.genre, tiersSaisie, clients, donnees.txs]);
  const pieces = useMemo(() => (plateau ? piecesRemboursables(donnees.txs, recherche) : []), [plateau, recherche, donnees.txs]);
  const recurrent = choisi && !b.solde && G.rythme !== null && b.rythme !== 'une';
  const prevu = useMemo(() => (choisi ? achatPrevu(b, cents, donnees.plans) : null), [choisi, b, cents, donnees.plans]);
  const soldePrevu = !!prevu && refusPrevu !== prevu.id;
  const fin = recurrent ? dateDeFin(b.date, b.rythme, b.fin, b.finDate) : undefined;
  const apayer = b.reglement === 'apayer';
  const sansPiece = b.genre === 'rembt' && !b.pieceId;

  const garde = (e: React.PointerEvent) => { if (document.activeElement === montantRef.current) e.preventDefault(); };
  const ouvrirMontant = (selection = false) => { focusVoulu.current = true; const m = montantRef.current; if (m) { m.focus({ preventScroll: true }); if (selection) m.select(); } };
  const poserGenre = (g: GenreId) => {
    setErreur(''); setAvis(''); setNomEdit(false); setTiersEdit(false); dates.fermer();
    setB((x) => avecGenre(x, g)); setChoisi(true);
    if (g === 'rembt') { setPlateau(true); setRecherche(''); return; }
    ouvrirMontant();
  };
  const poserHabituel = (h: Habituel) => {
    setErreur(''); setAvis(''); setNomEdit(false); setTiersEdit(false); dates.fermer();
    setB((x) => ({ ...avecGenre(x, h.genre), nom: h.nom, vendor: h.vendor, solde: h.solde }));
    setChoisi(true); setBrut(chf(h.cents).replace(/ /g, ' '));
    ouvrirMontant(true);
  };
  const changer = () => { setComptes(false); setChoisi(false); setPlateau(false); setNomEdit(false); setTiersEdit(false); dates.fermer(); setB((x) => ({ ...brouillonNeuf(aujourdhui), date: x.date })); };
  const choisirPiece = (pid: string) => {
    /* la pièce donne son nom (« Remboursement Malterie ») ; le montant se tape (« reste » le pose d'un toucher) : rembourser tout n'est pas le cas courant */
    const o = donnees.txs.find((t) => t.id === pid);
    setB((x) => ({ ...x, pieceId: pid, nom: o ? `Remboursement ${o.finance?.vendor || o.description}` : '' })); setPlateau(false);
    ouvrirMontant(true);
  };
  const patch = (p: Partial<Brouillon>) => setB((x) => ({ ...x, ...p }));
  /** Choisir ou créer la contrepartie : elle devient « Chez / Client… » ; le nom tapé du titre reste le sien (le titre prend la contrepartie seulement s'il est vide ou était la précédente). */
  const poserTiers = (n: string) => {
    setB((x) => ({ ...x, vendor: n, nom: !x.nom.trim() || x.nom === x.vendor ? n : x.nom }));
    setTiersEdit(false); setTiersSaisie('');
  };

  const neuf = (message = '') => { setComptes(false); setId(idFor('MAIN')); setB(brouillonNeuf(aujourdhui)); setChoisi(false); setBrut(''); setNomEdit(false); setTiersEdit(false); setTiersSaisie(""); setPlateau(false); setFait(null); setErreur(''); setAvis(message); setRefusPrevu(null); setVersion((v) => v + 1); dates.fermer(); };

  const enregistrer = async () => {
    if (occupe || !choisi || !cents) return;
    if (b.genre === 'rembt' && !b.pieceId) { setPlateau(true); return; }
    setOccupe(true); setErreur('');
    try {
      const txs = StorageService.getTransactions() as FinanceTransaction[];
      const e = preparer({ ...b, cents, prevu: soldePrevu ? prevu!.id : undefined }, { id, maintenant: new Date().toISOString(), transactions: txs, tvaInscrit });
      let prevuAvant: FinancialPlan | undefined;
      validateFinanceTransaction(e.transaction);
      if (e.transaction.finance?.kind === 'refund') {
        validateRefundTransaction(e.transaction, txs, FinanceService.getPayments());
        if (pieceInfo && cents > pieceInfo.reste) throw new Error(`Le remboursement dépasse ce qui reste sur la pièce (${chf(pieceInfo.reste)}).`);
      }
      if (!txs.some((t) => t.id === id)) {
        if (e.plan) FinanceService.savePlan(e.plan);
        if (e.paiement) FinanceService.stageNewTransactionPayment(e.transaction, e.paiement); else StorageService.addTransaction(e.transaction);
        /* WFA-15 : le prévu soldé quitte « À venir » (la même suite que la feuille de facture) ; « Annuler » le remet tel qu'il était */
        const p = e.transaction.finance?.planId && !e.plan && !b.solde ? FinanceService.getPlans().find((x) => x.id === e.transaction.finance!.planId) : undefined;
        if (p && soldeLeVuPlan(p.id, cents / 100)) prevuAvant = p;
      }
      let attente = false;
      try { await FirestoreRepo.waitForDocument<FinanceTransaction>('transactions', id, 15000, (t) => t.finance?.amountCents === cents); }
      catch (err) { if (isConfirmedWriteRejection(err)) throw err; attente = true; }
      (document.activeElement as HTMLElement | null)?.blur?.();
      setFait({ ...e, attente, prevuAvant });
    } catch (err) { setErreur((err as Error).message); } finally { setOccupe(false); }
  };
  const annuler = async () => {
    if (!fait || occupe) return;
    setOccupe(true);
    try {
      await retirerEcriture(fait.transaction.id, FinanceService.getPayments(), { aujourdhui: todayISO(), maintenant: new Date().toISOString(), idPaiement: () => idFor('PAI') });
      if (fait.plan) FinanceService.cancelPlan(fait.plan.id);
      if (fait.prevuAvant) FinanceService.savePlan(fait.prevuAvant);
      neuf('Écriture annulée : rien n’est compté.');
    } catch (err) { setErreur((err as Error).message); setFait(null); } finally { setOccupe(false); }
  };
  const fermer = () => { if (fait) onSaved?.(`${fait.transaction.description} enregistré.`); onClose(); };

  /* le pied : Mon mois (l'effet de ce mouvement) et le bouton qui dit le sens */
  const mm = !choisi || !cents ? { c: 'vide', t: '—' } : horsResultat(b.genre) ? { c: 'vide', t: 'inchangé' } : apayer ? { c: 'prevu', t: signe(sens!, cents) } : { c: sens!, t: signe(sens!, cents) };
  const verbe = verbeEnregistrer(apayer, sens, b.genre);
  const bouton = !choisi
    ? { texte: cents ? 'Ça sort ou ça rentre ?' : 'Enregistrer', montant: '', off: true }
    : b.genre === 'rembt' && !b.pieceId ? { texte: 'De quelle pièce ?', montant: '', off: false }
      : { texte: occupe ? 'Enregistrement…' : verbe, montant: cents ? signe(sens!, cents) : '', off: !cents || occupe };

  const chip = (on: boolean, contenu: React.ReactNode, onClick: () => void, extra: Record<string, string> = {}, cls = '') =>
    <button type="button" className={`sai-chip${cls ? ` ${cls}` : ''}`} aria-pressed={on} onPointerDown={garde} onClick={onClick} {...extra}>{contenu}</button>;
  const dateChip = (cle: string, valeur: string, label: string, an = false, avant = '') =>
    <button type="button" className="sai-chip dt" aria-expanded={dates.ouverte === cle} aria-label={`${label} : ${jjmm(valeur, true)}`} onPointerDown={garde} onClick={() => dates.basculer(cle)}><CalendarDays size={14} />{avant}{jjmm(dateMontree(cle, valeur, dates.tiree), an)}</button>;
  const frise = (cle: string, valeur: string, label: string, onChange: (d: string) => void, o: { min?: string; max?: string; mois?: boolean } = {}) =>
    dates.ouverte === cle ? <div className="sai-date"><ChoixDate ouvert saisie valeur={valeur} label={label} min={o.min} max={o.max} mois={o.mois} rangee="achats" onBrouillon={(d) => dates.tirer(cle, d)} onChange={(d) => { onChange(d); dates.fermer(); }} /></div> : null;

  const listeComptes = comptes ? <div className="sai-row" role="radiogroup" aria-label="Compte de paiement" data-saisie-comptes>
    {METHODES.map((m) => <React.Fragment key={m.id}>{chip(b.methode === m.id, m.nom, () => { patch({ methode: m.id }); setComptes(false); }, { 'data-saisie-compte': m.id, role: 'radio', 'aria-checked': String(b.methode === m.id) })}</React.Fragment>)}</div> : null;

  const tuile = (g: GenreId) => {
    const t = teinteGenre(g);
    return <button key={g} type="button" className="sai-t" data-saisie-genre={g} onClick={() => poserGenre(g)}>
      <span style={{ color: t.seg }}><Ic g={g} size={20} /></span><span>{GENRES[g].nom}</span>{GENRES[g].sous && g !== 'apport' ? <small>{GENRES[g].sous}</small> : null}
    </button>;
  };

  const repos = !choisi;
  const enfants: React.ReactNode[] = [];
  if (avis) enfants.push(<p key="avis" className="sai-lk" role="status"><Check size={15} /> {avis}</p>);
  if (repos) {
    if (habs.length) enfants.push(<div key="hab" className="sai-hab"><h3>HABITUELS</h3>{habs.map((h) => {
      const t = teinteGenre(h.genre);
      return <button key={h.cle} type="button" className="sai-hr" data-saisie-habituel={h.cle} onClick={() => poserHabituel(h)}>
        <span className="sai-ic" style={{ background: t.fond, color: t.trait }}><Ic g={h.genre} /></span>
        <span><b>{h.nom}</b><small>{h.sous}</small></span><span className={`sai-pm ${h.sens}`}>{signe(h.sens, h.cents)}</span>
      </button>;
    })}</div>);
    enfants.push(<div key="sort" className="sai-side out"><div className="sai-lab"><ArrowUp size={16} /> Ça sort</div><div className="sai-g">{SORT.map(tuile)}</div></div>);
    enfants.push(<div key="rentre" className="sai-side in"><div className="sai-lab"><ArrowDown size={16} /> Ça rentre</div><div className="sai-g">{RENTRE.map(tuile)}</div></div>);
    enfants.push(<button key="rb" type="button" className="sai-rb" data-saisie-genre="rembt" onClick={() => poserGenre('rembt')}><Undo2 size={18} /> Remboursement <span>d’une pièce · le sens suit</span></button>);
  } else {
    const neutre = b.genre === 'rembt' && !b.pieceId;
    enfants.push(<div key="bande" className={`sai-sel ${neutre ? 'neu' : sens}`} data-saisie-bande>
      {neutre ? <Undo2 size={16} /> : sens === 'out' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      {neutre ? 'Remboursement' : <>{sens === 'out' ? 'Ça sort' : 'Ça rentre'}<span className="g"><span style={{ color: teinteGenre(b.genre).seg, display: 'inline-flex' }}><Ic g={b.genre} size={18} /></span>{G.nom}</span></>}
      <button type="button" onPointerDown={garde} onClick={changer}>changer</button>
    </div>);
  }
  /* la carte : même nœud au repos et après le genre (le champ montant garde le focus ouvert dans le geste) */
  const badge = choisi ? (b.genre === 'prel' ? <span className="finance-tag finance-tag-apports">Privé</span> : <CategoryTag category={b.genre === 'rembt' ? (piece?.category ?? 'divers') : b.genre === 'achat' ? b.categorie : G.category} libelle={b.genre === 'autrei' ? 'Autre entrée' : b.genre === 'impot' ? 'Impôts' : undefined} />) : null;
  enfants.push(<div key="carte" className={`sai-card${choisi && !(b.genre === 'rembt' && !b.pieceId) ? ` ${sens}` : ''}`} data-saisie-carte>
    <div className="sai-c1">
      {sansPiece ? <span className="sai-nm ph fixe"><span>Remboursement de…</span></span> : !choisi || nomEdit
        ? <input ref={nomRef} aria-label="Nom, facultatif" placeholder={choisi ? (b.genre === 'rembt' && piece ? `Remboursement ${piece.finance?.vendor || piece.description}` : G.nomDefaut(jjmm(jourVu))) : 'Pour quoi ?'} value={b.nom} enterKeyHint="done" autoComplete="off"
          onChange={(e) => patch({ nom: e.target.value })} onBlur={() => setNomEdit(false)}
          // L-53 (M3-9) : Entrée valide le nom seul ; sans cela le formulaire partait (« −500,00 payé » sans toucher Payé).
          onKeyDown={(e) => { if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return; e.preventDefault(); e.currentTarget.blur(); }} />
        : <button type="button" className={`sai-nm${b.nom ? '' : ' ph'}`} aria-label="Nom, facultatif" data-saisie-nom onPointerDown={garde} onClick={() => setNomEdit(true)}>
          <span>{b.nom || (b.genre === 'rembt' ? (piece ? `Remboursement ${piece.finance?.vendor || piece.description}` : 'Remboursement de…') : G.nomDefaut(jjmm(jourVu)))}</span><Pencil size={14} /></button>}
      {sansPiece ? null : badge}
      {sansPiece ? null : dateChip('date', b.date, b.solde ? 'Date du paiement' : 'Date', !choisi)}
    </div>
    {frise('date', b.date, 'Date du mouvement', (d) => patch({ date: d }), { max: aujourdhui })}
    <label className={`sai-amt${choisi && sens && !(b.genre === 'rembt' && !b.pieceId) ? ` ${sens}` : ''}`}>
      {choisi && sens && !(b.genre === 'rembt' && !b.pieceId) ? <span aria-hidden="true">{sens === 'out' ? '−' : '+'}</span> : null}
      <input ref={montantRef} data-saisie-montant inputMode="decimal" enterKeyHint="done" autoComplete="off" aria-label="Montant en CHF" placeholder="0,00" value={brut}
        onChange={(e) => setBrut(grouper(e.target.value))} />
      {brut && !/[.,]/.test(brut) ? <span className="gh" aria-hidden="true">,00</span> : null}
      <small>CHF</small>
    </label>
    {choisi && b.genre !== 'rembt' ? <div className="sai-row">
      {chip(b.reglement === 'paye', <>{b.reglement === 'paye' ? <Check size={14} /> : null}{sens === 'in' ? 'Reçu' : 'Payé'}{b.reglement === 'paye' && jourVu === aujourdhui ? ' aujourd’hui' : ''}</>, () => patch({ reglement: 'paye' }), { 'data-saisie-reglement': 'paye' })}
      {chip(b.reglement === 'apayer', <>{b.reglement === 'apayer' ? <Check size={14} /> : null}{sens === 'in' ? 'À recevoir' : 'À payer'}</>, () => patch({ reglement: 'apayer' }), { 'data-saisie-reglement': 'apayer' })}
      {b.reglement === 'apayer' ? dateChip('echeance', b.echeance, 'Échéance', false, 'd’ici le ') : chip(comptes, <><Landmark size={14} />{METHODES.find((m) => m.id === b.methode)!.nom}<ChevronDown size={12} /></>, () => setComptes((o) => !o), { 'aria-label': 'Compte de paiement', 'aria-expanded': String(comptes), 'data-saisie-compte-ouvrir': '' })}
    </div> : null}
    {choisi && b.genre !== 'rembt' && b.reglement === 'paye' ? listeComptes : null}
    {choisi && b.genre === 'rembt' && b.pieceId ? <div className="sai-row">
      {chip(b.reglement === 'paye', <>{b.reglement === 'paye' ? <Check size={14} /> : null}{sens === 'in' ? 'Reçu' : 'Rendu'}{b.reglement === 'paye' && jourVu === aujourdhui ? ' aujourd’hui' : ''}</>, () => patch({ reglement: 'paye' }))}
      {chip(b.reglement === 'apayer', <>{b.reglement === 'apayer' ? <Check size={14} /> : null}{sens === 'in' ? 'À recevoir' : 'À rendre'}</>, () => patch({ reglement: 'apayer' }))}
      {chip(comptes, <><Landmark size={14} />{METHODES.find((m) => m.id === b.methode)!.nom}<ChevronDown size={12} /></>, () => setComptes((o) => !o), { 'aria-label': 'Compte de paiement', 'aria-expanded': String(comptes), 'data-saisie-compte-ouvrir': '' })}
    </div> : null}
    {choisi && b.genre === 'rembt' && b.pieceId ? listeComptes : null}
    {b.reglement === 'apayer' && choisi ? frise('echeance', b.echeance, 'Échéance', (d) => patch({ echeance: d }), { min: b.date }) : null}
    {choisi && b.genre === 'rembt' && pieceInfo ? <div className="sai-lk"><Link2 size={15} /><span className="t">{pieceInfo.sens === 'out' ? 'Facture' : 'Vente'} {pieceInfo.nom} du {jjmm(pieceInfo.date)} · {chf(pieceInfo.cents)}</span>
      {chip(false, <>reste : {chf(pieceInfo.reste)}</>, () => setBrut(chf(pieceInfo.reste).replace(/ /g, ' ')))}</div> : null}
  </div>);
  if (choisi) {
    /* WFA-15 : une ligne sous la carte, comme « solde l'échéance » de l'habituel : cochée d'office, un toucher la refuse (le prévu reste au Calendrier) */
    if (prevu) enfants.push(<button key="prevu" type="button" className={`sai-lk sai-hab2 sai-prevu${soldePrevu ? '' : ' non'}`} aria-pressed={soldePrevu} data-saisie-prevu
      onPointerDown={garde} onClick={() => setRefusPrevu(soldePrevu ? prevu.id : null)}>
      <Link2 size={15} /><span className="t">{soldePrevu ? '✓ Solde' : 'Ne solde pas'} l’achat prévu « {prevu.title} »{prevu.date ? `, prévu le ${jjmm(String(prevu.date))}` : ''}</span>
      <b className="n">{signe('out', prevu.amountCents)}</b></button>);
    if (G.qui && !b.solde) enfants.push(<div key="qui" className="sai-qui"><small>{G.qui}</small>
      {noms.map((n) => chip(b.vendor === n, n, () => patch(b.vendor === n ? { vendor: undefined, nom: b.nom === n ? '' : b.nom } : { vendor: n, nom: n }), { 'data-saisie-nom-puce': n }))}
      {b.vendor && !noms.includes(b.vendor) ? chip(true, b.vendor, () => patch({ vendor: undefined, nom: b.nom === b.vendor ? '' : b.nom }), { 'data-saisie-nom-puce': b.vendor }) : null}
      {chip(tiersEdit, <><Plus size={13} />autre</>, () => { setTiersEdit((o) => !o); setTiersSaisie(''); }, { 'data-saisie-tiers-autre': '' }, 'pl')}</div>);
    /* E35-5 : « + autre » ouvre le choix de la contrepartie (le client de l'onglet Clients, le fournisseur déjà écrit, ou un nom neuf), jamais le titre */
    if (G.qui && !b.solde && tiersEdit) enfants.push(<div key="tiers" className="sai-tiers" data-saisie-tiers>
      <input ref={tiersRef} className="sai-in" aria-label={`${G.qui}, nom`} placeholder={`${G.qui} : un nom, ou « créer »`} value={tiersSaisie} enterKeyHint="done" autoComplete="off"
        onChange={(e) => setTiersSaisie(e.target.value)}
        onKeyDown={(e) => { if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return; e.preventDefault(); if (tiersSaisie.trim()) poserTiers(propositionsTiersListe.find((n) => n.toLowerCase() === tiersSaisie.trim().toLowerCase()) ?? tiersSaisie.trim()); }} />
      <div className="sai-row">{propositionsTiersListe.map((n) => chip(b.vendor === n, n, () => poserTiers(n), { 'data-saisie-tiers-prop': n }))}
        {tiersSaisie.trim() && !tiersExiste(tiersSaisie, propositionsTiersListe) ? chip(false, <><Plus size={13} />Créer « {tiersSaisie.trim()} »</>, () => poserTiers(tiersSaisie.trim()), { 'data-saisie-tiers-creer': '' }) : null}
        {!propositionsTiersListe.length && !tiersSaisie.trim() ? <small className="sai-vide">{G.qui === 'Client' ? 'Aucun client dans l’onglet Clients : tape un nom.' : 'Aucun nom encore écrit : tape un nom.'}</small> : null}</div>
    </div>);
    if (b.genre === 'achat') enfants.push(<div key="ach" className="sai-blk"><small className="sai-lb"><Tag size={13} /> Catégorie</small>
      <div className="sai-row">{CATEGORIES_ACHAT.map((c) => chip(b.categorie === c.id, c.nom, () => patch({ categorie: c.id }), { 'data-saisie-categorie': c.id }))}</div>
      <button type="button" className="sai-art" onClick={() => onArticles({ amount: cents ? cents / 100 : undefined, description: b.nom.trim(), vendor: b.vendor ?? '', category: b.categorie, date: b.date })}>
        <ShoppingCart size={15} /><b>Articles · aucun</b><span><Plus size={13} />Ajouter, pour le stock</span></button></div>);
    if (b.genre === 'impot') enfants.push(<div key="imp" className="sai-blk"><small className="sai-lb"><Percent size={13} /> Quel impôt ?</small>
      <div className="sai-row">{chip(true, 'Impôt sur la bière', () => undefined)}{chip(false, 'Impôts privés → Pour moi', () => { setB((x) => ({ ...avecGenre(x, 'prel'), nom: 'Impôts privés' })); ouvrirMontant(); })}</div></div>);
    if (b.solde) enfants.push(<div key="hab2" className="sai-lk sai-hab2"><Repeat size={15} /><span className="t">{(() => { const p = donnees.plans.find((x) => x.id === b.solde!.planId); return `${p?.recurrence ? RYTHME_LONG[p.recurrence.frequency].replace(/^./, (c) => c.toUpperCase()) : 'Prévu'} · solde l’échéance de ${moisDe(b.solde!.date)}, prévue le ${jjmm(b.solde!.date)}`; })()}</span></div>);
    else if (G.rythme !== null) {
      const fins = finsProposees(b.rythme);
      const ech = recurrent ? echeances(b.date, b.rythme, fin, 4) : [];
      enfants.push(<div key="rec" className="sai-rec"><h3><Repeat size={15} /> Revient ?</h3>
        <div className="sai-seg" role="group" aria-label="Revient ?">{RYTHMES.map((r) => <button key={r.id} type="button" aria-pressed={b.rythme === r.id} data-saisie-rythme={r.id} onPointerDown={garde} onClick={() => patch({ rythme: r.id, fin: 'sans', finDate: undefined })}>{r.nom}</button>)}</div>
        {recurrent ? <>
          <div className="sai-row"><small>dès le</small>{dateChip('debut', b.date, 'Début', true)}</div>
          {frise('debut', b.date, 'Début de la récurrence', (d) => patch({ date: d }), { max: aujourdhui })}
          <div className="sai-row"><small>jusqu’à</small>{fins.map((f) => chip(b.fin === f.id, f.id === 'date' ? <><CalendarDays size={14} />date</> : f.nom,
            () => { if (f.id === 'date') { patch({ fin: 'date', finDate: b.finDate ?? dateDeFin(b.date, b.rythme, '1an') }); dates.basculer('fin'); } else patch({ fin: f.id }); }, { 'data-saisie-fin': f.id }))}</div>
          {b.fin === 'date' ? frise('fin', b.finDate ?? b.date, 'Dernière échéance', (d) => patch({ finDate: d }), { min: b.date }) : null}
          {cents ? <div className="sai-row"><span className="sai-sum">Σ 12 mois <b className={sens ?? 'out'}>{signe(sens ?? 'out', sommeDouzeMois(cents, b.date, b.rythme, fin))}</b></span></div> : null}
          <div className="sai-ap" data-saisie-apercu><b><CalendarDays size={14} />Calendrier</b>{ech.map((d, i) => <i key={d} className={i === 0 ? (sens === 'out' ? 'f' : 'fi') : ''}>{jjmm(d)}{i === 0 && !apayer ? ' ✓' : ''}</i>)}
            <small>… {fin ? `${jjmm(fin, true)} · ${echeances(b.date, b.rythme, fin, 400).length} fois` : 'sans fin'}</small></div>
        </> : null}
      </div>);
    }
    if (b.genre !== 'rembt' && !b.solde) enfants.push(<details key="pli" className="sai-fold"><summary>{G.pli}<span>facultatif <ChevronDown size={12} /></span></summary><div className="sai-blk">
      {tvaInscrit && !horsResultat(b.genre) ? <div className="sai-row"><small>TVA</small>{TVA.map((t) => chip(b.tvaRate === t, `${String(Math.round(t * 1000) / 10).replace('.', ',')} %`, () => patch({ tvaRate: t })))}</div> : null}
      <input className="sai-in" aria-label={b.genre === 'impot' ? 'Période, référence' : 'Référence'} placeholder={b.genre === 'impot' ? 'Période, référence' : horsResultat(b.genre) ? 'Référence' : 'Référence (n° de facture)'} value={b.reference} onChange={(e) => patch({ reference: e.target.value })} />
      <input className="sai-in" aria-label="Note" placeholder="Note" value={b.note} onChange={(e) => patch({ note: e.target.value })} />
    </div></details>);
    if (b.genre !== 'rembt') enfants.push(<label key="sj" className="sai-ck" data-saisie-sans-justificatif><input type="checkbox" checked={!!b.sansJustificatif} onPointerDown={garde} onChange={(e) => patch({ sansJustificatif: e.target.checked })} />Sans justificatif, c’est normal</label>);
  }
  if (erreur) enfants.push(<p key="err" className="sai-err" role="alert">{erreur}</p>);

  return <ModalShell open onClose={() => { if (!occupe) fermer(); }} dismissible={!occupe} labelledBy={titreId} size="xl" plein>
    <div className="sai sai-col" data-saisie-main>
      <header className="sai-hd">
        <button type="button" aria-label="Fermer" onClick={fermer}><X size={20} /></button>
        <h2 id={titreId}>Saisir à la main</h2>
        {!enLigne ? <span className="sai-hl" title="Hors ligne : écrit sur l’appareil, envoyé à la reconnexion">hors ligne</span> : null}
        <button type="button" className="sai-doc" aria-label="Lire un document (facture, ticket)" title="Lire un document" onClick={onDocument}><FileText size={18} /></button>
      </header>
      <form className="contents" autoComplete="off" onSubmit={(e) => { e.preventDefault(); if (!bouton.off) void enregistrer(); }}>
        <div ref={corps} className="sai-b" onScroll={mesurerOmbre}>{enfants}</div>
        <footer className={`sai-ft${ombre ? ' ombre' : ''}`}>
          <span className="sai-mm" data-saisie-mon-mois><Barres /> Mon mois <span className={`sai-mmv ${mm.c}`}>{mm.t}</span></span>
          <button type="submit" className="sai-go" data-saisie-enregistrer disabled={bouton.off} onPointerDown={garde}><Check size={18} /> {bouton.texte}{bouton.montant ? <> <b>{bouton.montant}</b></> : null}</button>
        </footer>
      </form>
      {plateau ? <>
        <div className="sai-voile" onClick={() => setPlateau(false)} />
        <div className="sai-pl" role="dialog" aria-label="De quelle pièce ?" data-saisie-pieces>
          <i className="sai-grip" aria-hidden="true" />
          <h3>De quelle pièce ?<button type="button" aria-label="Fermer" onClick={() => setPlateau(false)}><X size={18} /></button></h3>
          <label className="sai-q"><Search size={16} /><input inputMode="search" aria-label="Chercher une pièce" placeholder="Chercher un nom, un montant" value={recherche} onChange={(e) => setRecherche(e.target.value)} /></label>
          <div className="sai-pcs">{pieces.length ? pieces.map((p) => {
            const t = TEINTE[p.category] ?? TEINTE.divers;
            /* E40-7 : le picto de la sorte de la pièce (maison, mallette, %, flèches…), jamais le chariot d'Achat pour tout ce qui sort */
            return <button key={p.id} type="button" className="sai-pc" data-saisie-piece={p.id} data-saisie-piece-genre={p.genre} onClick={() => choisirPiece(p.id)}>
              <span className="sai-ic" style={{ background: t.fond, color: t.trait }}><Ic g={p.genre} /></span>
              <span><b>{p.nom}</b><small>{p.sous}</small></span><span className="n">{signe(p.sens, p.cents)}</span>
              <span className={`sai-dir ${p.sens === 'out' ? 'in' : 'out'}`}>{p.sens === 'out' ? '↓ rentre' : '↑ sort'}</span></button>;
          }) : <p className="sai-vide">{recherche ? 'Aucune pièce ne correspond.' : 'Aucune pièce à rembourser.'}</p>}</div>
        </div></> : null}
      {fait ? <Confirmation fait={fait} txs={donnees.txs} occupe={occupe} onAnnuler={annuler} onAutre={() => neuf()} onFermer={fermer} /> : null}
    </div>
  </ModalShell>;
}

function Confirmation({ fait, txs, occupe, onAnnuler, onAutre, onFermer }: { fait: Ecriture & { attente: boolean; prevuAvant?: FinancialPlan }; txs: FinanceTransaction[]; occupe: boolean; onAnnuler: () => void; onAutre: () => void; onFermer: () => void }) {
  const tx = fait.transaction, f = tx.finance!, cents = f.amountCents;
  const sens: 'in' | 'out' = f.kind === 'refund' ? (f.refundDirection ?? 'in') : f.kind === 'income' || f.kind === 'contribution' ? 'in' : 'out';
  const hors = f.kind === 'contribution' || f.kind === 'withdrawal';
  const apayer = f.paymentStatus === 'unpaid';
  const verbe = apayer ? (sens === 'out' ? 'à payer' : 'à recevoir') : f.kind === 'withdrawal' ? 'retiré' : sens === 'out' ? 'payé' : 'reçu';
  const rec = fait.plan?.recurrence;
  const fin = rec?.endDate;
  const origine = f.refundOfId ? txs.find((t) => t.id === f.refundOfId) : undefined;
  const ech = rec ? echeances(tx.date, rec.frequency, fin, 4) : [];
  const dejaAvoirs = origine ? txs.filter((t) => t.finance?.refundOfId === origine.id && !t.finance?.voidedAt && t.id !== tx.id).reduce((n, t) => n + (t.finance?.amountCents ?? 0), 0) : 0;
  return <>
    <div className="sai-voile" />
    <div className="sai-ok" role="dialog" aria-label="Enregistré" data-saisie-ok>
      <div className="sai-ok-h"><span className="sai-okc"><Check size={20} /></span><div>
        <b>{tx.description} · {signe(sens, cents)} {verbe}</b>
        <span>{f.kind === 'withdrawal' ? <span className="finance-tag finance-tag-apports">Privé</span> : <CategoryTag category={tx.category} libelle={libelleEcriture(tx, CATEGORY_LABELS[tx.category] ?? tx.category)} />} {origine ? `avoir sur ${origine.description} du ${jjmm(origine.date)}` : rec ? `${RYTHME_LONG[rec.frequency]}, dès le ${jjmm(tx.date)}` : `une fois, le ${jjmm(tx.date)}`}</span>
      </div></div>
      {hors ? <>
        <div className="sai-ok-r"><b><Barres /> Mon mois</b><span className="sai-mmv vide">inchangé</span><small>{f.kind === 'contribution' ? 'un apport n’est ni une vente ni une recette' : 'un prélèvement n’est pas une charge'}</small></div>
      </> : <div className="sai-ok-r"><b><Barres /> Mon mois</b><span className={`sai-mmv ${apayer ? 'prevu' : sens}`}>{signe(sens, cents)}</span><small>{origine ? `${CATEGORY_LABELS[origine.category] ?? origine.category} réduit de ${chf(cents)}` : apayer ? `prévu, échéance ${f.dueDate ? jjmm(f.dueDate) : ''}` : moisDe(tx.date)}</small></div>}
      {origine ? <div className="sai-ok-r"><b><Link2 size={16} /> Pièce</b><span className="sai-pv">{origine.finance?.vendor || origine.description} {jjmm(origine.date)} · {chf(origine.finance?.amountCents ?? 0)} → net {chf((origine.finance?.amountCents ?? 0) - dejaAvoirs - cents)}</span></div> : null}
      {rec ? <>
        <div className="sai-ok-r"><b><CalendarDays size={16} /> Calendrier</b><div className="sai-ap">{ech.map((d, i) => <i key={d} className={i === 0 ? (sens === 'out' ? 'f' : 'fi') : ''}>{jjmm(d)}{i === 0 && !apayer ? ' ✓' : ''}</i>)}<small>… {fin ? `→ ${moisAn(fin)}` : 'sans fin'}</small></div></div>
        <div className="sai-ok-r"><b>Σ 12 mois</b><span className={`n ${sens}`}>{signe(sens, sommeDouzeMois(cents, tx.date, rec.frequency, fin))}</span><small>sur un an</small></div>
      </> : null}
      {fait.prevuAvant ? <div className="sai-ok-r"><b><Link2 size={16} /> Prévu</b><span className="sai-pv">« {fait.prevuAvant.title} » soldé, quitte le Calendrier</span></div> : null}
      {fait.attente ? <p className="sai-lk">Écrit sur l’appareil ; envoyé dès la connexion revenue.</p> : null}
      <div className="sai-ok-a">
        <button type="button" disabled={occupe} onClick={onAnnuler}><Undo2 size={15} /> Annuler</button>
        <button type="button" disabled={occupe} onClick={onAutre}><Plus size={15} /> Saisir un autre</button>
        <button type="button" className="sai-go" data-saisie-fermer autoFocus onClick={onFermer}>Fermer</button>
      </div>
    </div>
  </>;
}
