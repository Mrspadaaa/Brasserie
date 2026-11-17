import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '../../ui/Sheet';
import { Input } from '../../ui/Input';
import type { Batch, StockItem, Transaction } from '../../types';
import type { Periode } from '../periode/periode';
import { StorageService } from '../../services/storage';
import { usePlusPage } from '../../ui/plusPage';
import { useDonneesCalendrier, type DonneesCalendrier } from '../../ui/calendrier/useDonneesCalendrier';
import { appliquer, portParDefaut, type EcritureFaite, type PortEcritures } from '../../ui/calendrier/ecritures';
import { useOrientation } from '../../ui/calendrier/useOrientation';
import { EnTeteCalendrier, type VueCalendrier } from '../../ui/calendrier/entete/EnTete';
import { periodeDeFenetre, type FenetreSemaines } from '../../ui/calendrier/entete/Fenetre';
import { Frise, ordreComplet } from '../../ui/calendrier/frise/Frise';
import { Message, type MessageCal } from '../../ui/calendrier/frise/Message';
import { MenuAppuiLong } from '../../ui/calendrier/frise/MenuAppuiLong';
import { DetailChose } from '../../ui/calendrier/frise/DetailChose';
import { FeuilleAjout, type ResultatAjout } from '../../ui/calendrier/frise/FeuilleAjout';
import { VueListe } from '../../ui/calendrier/frise/VueListe';
import { CLASSE_TEINTE } from '../../ui/calendrier/frise/Marque';
import { positionDans, type Colonne, type DragEtat } from '../../ui/calendrier/frise/Rangee';
import {
  RANGEES, ajouterJours, dateDeSemaine, ecartJours, etiquetteS, jourLisible, lundiDe, nomRangee,
  type CibleOuverture, type ChoseCalendrier, type Rangee as IdRangee
} from '../../domain/calendrier';
import { courbeDecalee, courbeAvec, effetCaisse } from '../../domain/calendrierCaisse';
import {
  brouillonDepuisChose, brouillonDepuisProposition, brouillonVide, versEnregistrement, versModification, enregistrementIdee,
  type BrouillonAjout, type ContexteAjout
} from '../../domain/calendrierAjout';
import {
  accepterVente, allonger, deplacer, dupliquer, fait, lier, livrer, mettreDeCote, retirer, noterIdee,
  type ContexteGestes, type Ecriture, type Message as MessageGeste, type Resolution
} from '../../domain/calendrierGestes';

/**
 * L'onglet Calendrier (6e de la barre, entre Finances et Brassins ; E41). Le port du calendrier retenu le 16.11 et 17.11 : l'en-tête z2s (w3s en
 * paysage, lot B), la frise gi2/r2-c, les gestes de la page14 et le + volant de la passe 10 (lot C). Ce composant est le conteneur : il lit le
 * modèle (`useDonneesCalendrier`), tient l'état de l'écran (fenêtre, vue, rangées masquées, épingles, étoiles, détail, menu, feuille, message),
 * et écrit par les services existants (`ecritures.ts`) avec l'inverse de chaque geste (Annuler). Les vues (`ui/calendrier/*`) ne font que montrer.
 *
 * Tout vient de l'app : aucune donnée d'exemple. Les calendriers de section (E44, `section`, `centrerSur`) filtrent les rangées ; aucun n'est branché.
 */

interface CalendrierTabProps {
  transactions: Transaction[];
  batches: Batch[];
  stockItems: StockItem[];
  onOpenBatch: (batchId: string) => void;
  onOpenFinances: () => void;
  onOpenAgenda: () => void;
  /** Les courses (Stocks › Courses), pour « Commander ». */
  onOpenCourses: () => void;
  /** « Plus de détails › » d'un brassin : la quick action de l'app. */
  onPoserBrassin: () => void;
  /** Reçoit le lundi (aaaa-mm-jj) : « Plus de détails › » d'une fête. */
  onPoserFete: (lundi: string) => void;
  /** Reçoit le lundi : « Plus de détails › » d'un achat, d'un travail ou d'un papier ouvre Prévoir une dépense (PlanSheet, `date`). */
  onPoserDepense: (lundi: string) => void;
  /** LA période de l'app (E07, ET-PER) : le calendrier l'écrit, Finances la lit. */
  periode?: Periode;
  onPeriode?: (periode: Periode) => void;
  /** « Budget › » d'un brassin ouvre sa feuille de budget (D-71). */
  onOuvrirBudget?: (batchId: string) => void;
  /** Une pièce de Finances (facture, écriture) : « Payé » se joue par sa feuille. */
  onOpenPiece?: (id: string) => void;
  /** E44 : un calendrier de section ne montre que ses rangées. Aucun n'est branché dans ce port. */
  section?: 'finances' | 'brassins' | 'materiel' | 'stocks' | 'agenda';
  /** E44 : lundi ISO sur lequel ouvrir la vue (« manque S49 » des Stocks). */
  centrerSur?: string;
  /** Le port des écritures (les tests passent une mémoire ; l'app, ses services). */
  port?: PortEcritures;
  /** Le jour (les tests le fixent). */
  aujourdhui?: string;
  /** Le banc `?preview=calendrier` et les tests injectent un modèle simulé à la place de la lecture de l'app. */
  donnees?: DonneesCalendrier;
}

const RANGEES_SECTION: Record<NonNullable<CalendrierTabProps['section']>, readonly IdRangee[]> = {
  finances: ['ventes', 'achats', 'travaux', 'papiers'], brassins: ['brassins', 'ventes'], materiel: ['travaux', 'achats', 'activites'], stocks: ['brassins', 'achats'], agenda: ['fetes', 'activites', 'brassins']
};

/** Un état d'écran gardé par appareil (épingles, étoiles, rangées masquées, ordre : E39). */
function useEtatGarde<T>(cle: string, defaut: T): [T, (valeur: T) => void] {
  const [valeur, setValeur] = useState<T>(() => StorageService.getUiState<T>(cle, defaut));
  const ecrire = useCallback((suivant: T) => { setValeur(suivant); StorageService.setUiState(cle, suivant); }, [cle]);
  return [valeur, ecrire];
}

const LIBELLE_LIEN: Partial<Record<CibleOuverture['ecran'], string>> = { finances: 'Finances ›', plan: 'Finances ›', brassin: 'Ouvrir le brassin ›', piece: 'Ouvrir la pièce ›', courses: 'Les courses ›', solde: 'Finances ›' };

interface FeuilleEtat { mode: 'ajouter' | 'modifier'; initial: BrouillonAjout; chose?: ChoseCalendrier; sansPlusDeDetails?: boolean; cle: number }
type Panneau = 'tri' | 'filtre' | null;

export function CalendrierTab(props: CalendrierTabProps) {
  const { transactions, batches, stockItems, onOpenBatch, onOpenFinances, onOpenAgenda, onOpenCourses, onPoserBrassin, onPoserFete, onPoserDepense, onOuvrirBudget, onOpenPiece, section, centrerSur } = props;
  const port = useMemo(() => props.port ?? portParDefaut(), [props.port]);
  const lues = useDonneesCalendrier({ transactions, batches, stockItems, aujourdhui: props.aujourdhui });
  const don = props.donnees ?? lues;
  const { modele, aujourdhui } = don;
  const orientation = useOrientation();
  const paysage = orientation === 'paysage';
  const premierLundi = lundiDe(aujourdhui);

  /* ---------- l'état de l'écran ---------- */
  const [vue, setVueEtat] = useState<VueCalendrier>('semaines');
  const [ancreListe, setAncreListe] = useState<'sans-date' | undefined>(undefined);
  const [fenetre, setFenetre] = useState<FenetreSemaines>(() => {
    const du = centrerSur ? (lundiDe(ajouterJours(centrerSur, -14)) < premierLundi ? premierLundi : lundiDe(ajouterJours(centrerSur, -14))) : premierLundi;
    return { du, semaines: 6 };
  });
  const [periodeLocale, setPeriodeLocale] = useState<Periode | undefined>(props.periode);
  const clePeriode = JSON.stringify(props.periode ?? null);
  useEffect(() => { setPeriodeLocale(props.periode); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clePeriode]);
  /* la période de l'app n'est lue que si c'est une plage (« du … au ») : un mois ou une année de Finances ne règle pas la fenêtre à la place du brasseur */
  const periodeEnTete: Periode = periodeLocale && periodeLocale.genre === 'dates' ? periodeLocale : periodeDeFenetre(fenetre);
  const onPeriode = useCallback((p: Periode) => { setPeriodeLocale(p); props.onPeriode?.(p); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onPeriode]);
  const [mouvements, setMouvements] = useState(false);
  const [epingles, setEpingles] = useEtatGarde<string[]>('calendrier_epingles', []);
  const [etoiles, setEtoiles] = useEtatGarde<string[]>('calendrier_etoiles', []);
  const [masquees, setMasquees] = useEtatGarde<IdRangee[]>('calendrier_masquees', []);
  const [ordreBrut, setOrdre] = useEtatGarde<IdRangee[]>('calendrier_ordre', RANGEES.map(r => r.id));
  const ordre = useMemo(() => ordreComplet(ordreBrut), [ordreBrut]);
  /* le filtre dure le temps de la visite : il n'est pas gardé (E39) */
  const [filtre, setFiltre] = useState<IdRangee | null>(null);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; ancre: HTMLElement } | null>(null);
  const [feuille, setFeuille] = useState<FeuilleEtat | null>(null);
  const [idee, setIdee] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageCal | null>(null);
  const [drag, setDrag] = useState<DragEtat | null>(null);
  const [ici, setIci] = useState<string | null>(null);
  const [apercuLundi, setApercu] = useState<ReturnType<typeof courbeDecalee> | null>(null);
  const [duree, setDuree] = useState<{ id: string; texte: string } | null>(null);
  const [mesure, setMesure] = useState({ largeur: 0, largeurColonne: 0 });
  const compteur = useRef(0);

  const rangeesVisibles = useMemo(() => (section ? RANGEES_SECTION[section] : null), [section]);
  const choses = useMemo(() => (rangeesVisibles ? modele.choses.filter(c => rangeesVisibles.includes(c.rangee)) : modele.choses), [modele.choses, rangeesVisibles]);
  const choseDe = useCallback((id: string | null | undefined) => (id ? [...choses, ...modele.sansDate].find(c => c.id === id) : undefined), [choses, modele.sansDate]);

  const ctxGestes: ContexteGestes = useMemo(() => ({ aujourdhui, batches: don.batches, plans: don.plans, courbe: modele.courbe }), [aujourdhui, don.batches, don.plans, modele.courbe]);
  const ctxRef = useRef(ctxGestes);
  ctxRef.current = ctxGestes;
  const ctxAjout: ContexteAjout = useMemo(() => ({ aujourdhui, recettes: don.recettes, clients: don.clients, plans: don.plans, choses: modele.choses }), [aujourdhui, don.recettes, don.clients, don.plans, modele.choses]);

  /* ---------- les colonnes de la frise : des semaines, ou les douze mois de l'année ---------- */
  const annee = vue === 'annee';
  const colonnes: Colonne[] = useMemo(() => {
    if (annee) return modele.mois.map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court }));
    const i = Math.max(0, modele.semaines.findIndex(s => s.debut >= fenetre.du));
    return modele.semaines.slice(i, i + Math.max(1, fenetre.semaines)).map(s => ({ debut: s.debut, fin: ajouterJours(s.debut, 6), etiquette: `S${s.numero}` }));
  }, [annee, modele.mois, modele.semaines, fenetre]);

  /* ---------- le message : un seul à la fois, qui part au premier défilement de 24 px ---------- */
  const montrer = useCallback((m: Omit<MessageCal, 'id'>) => { compteur.current += 1; setMessage({ ...m, id: compteur.current }); }, []);
  const fermerMessage = useCallback(() => setMessage(null), []);
  useEffect(() => {
    if (!message) return undefined;
    const y0 = typeof window !== 'undefined' ? window.scrollY : 0;
    const suit = () => { if (Math.abs(window.scrollY - y0) > 24) setMessage(null); };
    window.addEventListener('scroll', suit, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', suit, true);
  }, [message]);

  const ouvrir = useCallback((cible: CibleOuverture) => {
    if (cible.ecran === 'brassin' && cible.id) onOpenBatch(cible.id);
    else if ((cible.ecran === 'piece') && cible.id && onOpenPiece) onOpenPiece(cible.id);
    else if (cible.ecran === 'agenda' || cible.ecran === 'atelier') onOpenAgenda();
    else if (cible.ecran === 'courses' || cible.ecran === 'fournisseur') onOpenCourses();
    else onOpenFinances();
  }, [onOpenBatch, onOpenPiece, onOpenAgenda, onOpenCourses, onOpenFinances]);

  const lienDe = useCallback((lien: MessageGeste['lien']): MessageCal['lien'] => {
    if (!lien) return undefined;
    if (lien.ancre === 'sans-date') return { texte: lien.texte, agir: () => { setMessage(null); setAncreListe('sans-date'); setVueEtat('liste'); } };
    if (lien.ancre === 'brassin') return { texte: lien.texte, agir: () => lien.cible && ouvrir(lien.cible) };
    return { texte: lien.texte, agir: () => ouvrir(lien.cible ?? { ecran: 'finances' }) };
  }, [ouvrir]);

  /* un refus (charge fixe, facture, brassin en cuve, jalon qui suit la recette) dit où régler la chose, avec le lien qui y mène */
  const refuser = useCallback((raison: string, chose: ChoseCalendrier, jalon?: boolean) => {
    const cible: CibleOuverture = jalon ? { ecran: 'brassin', id: chose.source.genre === 'batch' ? chose.source.id : undefined } : chose.ouvre;
    const texte = LIBELLE_LIEN[cible.ecran];
    setDetailFerme();
    montrer({ role: 'status', texte: raison, ...(texte ? { lien: { texte, agir: () => ouvrir(cible) } } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montrer, ouvrir]);

  function setDetailFerme() { setSelectionId(null); setMenu(null); }

  /* ---------- écrire : la source, puis le message avec son inverse ---------- */
  const ecrire = useCallback(async (res: Resolution): Promise<boolean> => {
    if (res.ok === false) { montrer({ role: 'status', texte: res.raison, ...(res.message.lien ? { lien: lienDe(res.message.lien) } : {}) }); return false; }
    let faite: EcritureFaite;
    try { faite = await appliquer(res.ecritures as Ecriture[], port); } catch (e) { montrer({ role: 'status', texte: e instanceof Error ? e.message : 'Écriture impossible. Rien n’a changé.' }); return false; }
    setDetailFerme();
    const annuler = async () => { await faite.annuler(); setMessage(null); };
    if (res.promesse) {
      const p = res.promesse;
      montrer({
        role: 'alert', texte: p.texte, annuler,
        livrer: { texte: `Livrer le ${jourLisible(p.livrerLe)}`, agir: () => { void ecrire(livrer(p, ctxRef.current)); } },
        ...(res.effet ? { detail: `Caisse : ${res.effet.texte}` } : {})
      });
    } else montrer({ role: 'status', texte: res.message.texte, annuler, ...(res.message.lien ? { lien: lienDe(res.message.lien) } : {}) });
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, montrer, lienDe]);

  /* ---------- les gestes de la frise ---------- */
  const surGlisse = useCallback((chose: ChoseCalendrier, k: number) => {
    setDrag({ id: chose.id, mode: 'glisse', k, jours: 0 });
    const cible = lundiDe(ajouterJours(chose.debut, k * 7));
    setIci(k === 0 ? null : `${etiquetteS(cible)} · ${jourLisible(cible)} · lâcher ici`);
    setApercu(k !== 0 && modele.courbe ? courbeDecalee(modele.courbe, chose.id, k * 7) : null);
    setMessage(null);
  }, [modele.courbe]);
  const finGeste = useCallback(() => { setDrag(null); setIci(null); setApercu(null); setDuree(null); }, []);
  const surLacheGlisse = useCallback((chose: ChoseCalendrier, k: number, annule: boolean) => {
    finGeste();
    if (annule || k === 0) return;
    void ecrire(deplacer(chose, k, ctxRef.current));
  }, [ecrire, finGeste]);
  const textePrete = (chose: ChoseCalendrier, jours: number) => {
    const fin = chose.preteLe ?? chose.fin;
    const nouvelle = ajouterJours(fin, jours);
    return chose.source.genre === 'batch' ? `J0 / ${ecartJours(chose.debut, nouvelle)} · prête ${jourLisible(nouvelle)}` : `${etiquetteS(chose.debut)} → ${etiquetteS(nouvelle)}`;
  };
  const surBord = useCallback((chose: ChoseCalendrier, jours: number) => {
    setDrag({ id: chose.id, mode: 'bord', k: 0, jours });
    setDuree({ id: chose.id, texte: textePrete(chose, jours) });
    setMessage(null);
  }, []);
  const surLacheBord = useCallback((chose: ChoseCalendrier, jours: number, annule: boolean) => {
    finGeste();
    if (annule || jours === 0) return;
    void ecrire(allonger(chose, jours, ctxRef.current));
  }, [ecrire, finGeste]);
  const surToucher = useCallback((chose: ChoseCalendrier, _cible: HTMLElement) => {
    setMenu(null);
    if (chose.proposition === 'echeance') { onOpenFinances(); return; }
    if (chose.proposition === 'brassin-habituel') {
      const b = brouillonDepuisProposition(chose);
      if (b) { setMessage(null); setFeuille({ mode: 'ajouter', initial: b, sansPlusDeDetails: true, cle: ++compteur.current }); }
      return;
    }
    setMessage(null);
    setSelectionId(id => (id === chose.id ? null : chose.id));
  }, [onOpenFinances]);
  const surAppuiLong = useCallback((chose: ChoseCalendrier, cible: HTMLElement) => {
    setMessage(null); setSelectionId(null);
    setMenu({ id: chose.id, ancre: cible });
  }, []);
  const surSixSemaines = useCallback((chose: ChoseCalendrier) => {
    const debut = lundiDe(ajouterJours(chose.debut, -14));
    setVueEtat('semaines');
    setFenetre({ du: debut < premierLundi ? premierLundi : debut, semaines: 6 });
    setMenu(null); setSelectionId(chose.id);
  }, [premierLundi]);
  const surRefus = useCallback((chose: ChoseCalendrier, raison: string, jalon?: unknown) => { refuser(raison, chose, !!jalon); }, [refuser]);

  /* ---------- masquer, épingler, étoiler, filtrer, trier (E22, E31, E39) ---------- */
  const basculerMasque = useCallback((r: IdRangee) => setMasquees(masquees.includes(r) ? masquees.filter(x => x !== r) : [...masquees, r]), [masquees, setMasquees]);
  const basculer = (liste: string[], id: string) => (liste.includes(id) ? liste.filter(x => x !== id) : [...liste, id]);
  const chosesMenu = choseDe(menu?.id);

  /* ---------- la feuille d'ajout : le + de chaque rangée, le + volant, une proposition, Modifier, Poser ---------- */
  const ouvrirFeuille = useCallback((r: IdRangee) => {
    setMessage(null); setSelectionId(null); setMenu(null);
    setFeuille({ mode: 'ajouter', initial: brouillonVide(r, fenetre.du < premierLundi ? premierLundi : fenetre.du), cle: ++compteur.current });
  }, [fenetre.du, premierLundi]);
  const ouvrirIdee = useCallback((lundi?: string) => { setMessage(null); setMenu(null); setIdee(lundi ?? premierLundi); }, [premierLundi]);

  usePlusPage({
    titre: 'Calendrier',
    surOnglets: true,
    actions: [
      { id: 'brassin', label: 'Poser un brassin', genre: 'brasser', lancer: () => ouvrirFeuille('brassins') },
      { id: 'fete', label: 'Poser une fête', genre: 'ajouter', lancer: () => ouvrirFeuille('fetes') },
      { id: 'vente', label: 'Poser une vente', genre: 'ajouter', lancer: () => ouvrirFeuille('ventes') },
      { id: 'achat', label: 'Prévoir un achat', genre: 'ajouter', lancer: () => ouvrirFeuille('achats') },
      { id: 'travaux', label: 'Prévoir des travaux', genre: 'ajouter', lancer: () => ouvrirFeuille('travaux') },
      { id: 'activite', label: 'Noter une activité', genre: 'ajouter', lancer: () => ouvrirFeuille('activites') },
      { id: 'papier', label: 'Prévoir un papier', genre: 'ajouter', lancer: () => ouvrirFeuille('papiers') },
      { id: 'idee', label: 'Noter une idée', genre: 'ajouter', lancer: () => ouvrirIdee() }
    ]
  });

  const ajouterDepuisFeuille = useCallback(async (b: BrouillonAjout): Promise<ResultatAjout> => {
    const etat = feuille;
    if (etat?.mode === 'modifier' && etat.chose) {
      const m = versModification(b, etat.chose);
      if (m.ok === false) return { ok: false, raison: m.raison };
      const ok = await ecrire({ ok: true, ecritures: m.ecritures, message: { texte: `${b.titre.trim() || etat.chose.titre} : ${etiquetteS(b.debut as string)}`, action: 'Annuler', lecture: '' }, effet: null, promesse: null, courbeApres: null });
      if (ok) { setFeuille(null); if (etat.chose.sansDate) setVueEtat('semaines'); }
      return ok ? { ok: true } : { ok: false, raison: 'Écriture impossible. Rien n’a changé.' };
    }
    const conv = versEnregistrement(b, ctxAjout);
    if (conv.ok === false) return { ok: false, raison: conv.raison, ...(conv.confirmer ? { confirmer: conv.confirmer } : {}) };
    const e = conv.enregistrement;
    const ecriture: Ecriture = { op: 'creer', collection: e.collection, document: e.document as unknown as { id: string } & Record<string, unknown>, ...(e.cible === 'batch' ? { recetteId: e.recetteId } : {}) };
    /* l'effet sur la caisse d'une prévision ajoutée : « S50 : 5 120 → 4 700 » */
    let effet = null;
    if (e.cible === 'plan' && modele.courbe) {
      const p = e.document;
      const signe = p.direction === 'in' ? 1 : -1;
      effet = effetCaisse(modele.courbe, courbeAvec(modele.courbe, [{ id: p.id, jour: p.date, centimes: signe * p.amountCents, nom: p.title, choseId: `argent-${p.id}:${p.date}` }]));
    }
    const ok = await ecrire({
      ok: true, ecritures: [ecriture], effet, promesse: null, courbeApres: null,
      message: { texte: effet ? `${conv.resume} · ${effet.texte}` : conv.resume, action: 'Annuler', lecture: '' }
    });
    if (ok) setFeuille(null);
    return ok ? { ok: true } : { ok: false, raison: 'Écriture impossible. Rien n’a changé.' };
  }, [feuille, ctxAjout, modele.courbe, ecrire]);

  const plusDeDetails = useCallback((b: BrouillonAjout) => {
    const lundi = b.debut ?? premierLundi;
    setFeuille(null);
    if (b.rangee === 'brassins') onPoserBrassin();
    else if (b.rangee === 'fetes') onPoserFete(lundi);
    else onPoserDepense(lundi);
  }, [premierLundi, onPoserBrassin, onPoserFete, onPoserDepense]);

  const idee_ecrire = useCallback(async (titre: string, lundi: string): Promise<string | null> => {
    const r = noterIdee(titre, lundi, {});
    if (r.ok === false) return r.raison;
    const ok = await ecrire(r);
    if (ok) setIdee(null);
    return ok ? null : 'Écriture impossible. Rien n’a changé.';
  }, [ecrire]);

  /* ---------- le détail d'une chose (f4-b) ---------- */
  const detail = (chose: ChoseCalendrier) => {
    const semaineIdx = chose.debut ? modele.courbe?.semaines.findIndex(s => s.lundi === lundiDe(chose.debut)) ?? -1 : -1;
    const libre = semaineIdx >= 0 ? modele.courbe?.semaines[semaineIdx]?.libre : undefined;
    const creative = chose.source.genre === 'creative';
    const manuel = chose.source.genre === 'plan' && chose.source.origine === 'manual';
    const editable = (creative || manuel) && !chose.proposition;
    const sansDate = chose.sansDate === true;
    return (
      <DetailChose
        chose={chose}
        libreSemaine={libre ?? null}
        onFermer={() => setSelectionId(null)}
        onOuvrir={() => { setSelectionId(null); ouvrir(chose.ouvre); }}
        {...(chose.source.genre === 'batch' ? {
          onCommander: () => { setSelectionId(null); onOpenCourses(); },
          ...(onOuvrirBudget ? { onBudget: () => { const id = (chose.source as { id: string }).id; setSelectionId(null); onOuvrirBudget(id); } } : {})
        } : {})}
        {...(editable && !sansDate ? { onModifier: () => { setSelectionId(null); setFeuille({ mode: 'modifier', initial: brouillonDepuisChose(chose), chose, cle: ++compteur.current }); } } : {})}
        {...(editable && !sansDate ? { onRetirer: () => { void ecrire(retirer(chose, ctxRef.current)); } } : {})}
        {...(creative && chose.source.genre === 'creative' && chose.source.type !== 'recipe-idea' ? { onFait: () => { void ecrire(fait(chose)); } } : {})}
        {...(sansDate ? { onPoser: () => { setSelectionId(null); setFeuille({ mode: 'modifier', initial: { ...brouillonDepuisChose(chose), debut: premierLundi, debutChoisi: true }, chose, cle: ++compteur.current }); } } : {})}
        {...(chose.probable && chose.source.genre === 'plan' && !chose.proposition ? { onAccepter: () => { void ecrire(accepterVente(chose, ctxRef.current)); } } : {})}
        {...(editable ? { onMettreDeCote: (actif: boolean) => { void ecrire(mettreDeCote(chose, actif, ctxRef.current)); } } : {})}
      />
    );
  };

  /* ---------- l'en-tête (lot B) : tout vient du modèle ---------- */
  const etoilesSurCourbe = useMemo(() => {
    if (annee) return [];
    return etoiles.flatMap(id => {
      const c = choses.find(x => x.id === id);
      const p = c ? positionDans(colonnes, c) : null;
      return c && p ? [{ id, titre: c.titre, numero: etiquetteS(c.debut), colonne: p.a }] : [];
    });
  }, [etoiles, choses, colonnes, annee]);

  const surVue = useCallback((v: VueCalendrier, ancre?: 'sans-date') => { setVueEtat(v); setAncreListe(v === 'liste' ? ancre : undefined); setSelectionId(null); setMenu(null); }, []);

  /* ---------- le tri des rangées et le filtre par type (menu période, E07) ---------- */
  const deplacerRangee = (r: IdRangee, sens: -1 | 1) => {
    const i = ordre.indexOf(r), j = i + sens;
    if (j < 0 || j >= ordre.length) return;
    const suivant = [...ordre]; [suivant[i], suivant[j]] = [suivant[j], suivant[i]];
    setOrdre(suivant);
  };

  const largeurColonne = mesure.largeurColonne;
  const liste = vue === 'liste';
  const graph = vue === 'graph';

  return (
    <div className={`cal-tab space-y-2 pt-1 pb-[calc(var(--main-navigation-height,2.5rem)+6.5rem)] text-sm${paysage ? ' cal-tab-paysage' : ''}`} data-calendrier data-vue={vue} data-orientation={orientation}>
      <h1 className="sr-only">Calendrier</h1>

      <div className="cal-entete-zone sticky top-0 z-30 bg-cave-950" data-entete-zone>
        <EnTeteCalendrier
          modele={modele}
          fenetre={fenetre}
          onFenetre={setFenetre}
          periode={periodeEnTete}
          onPeriode={onPeriode}
          vue={vue}
          onVue={surVue}
          mouvements={mouvements}
          onMouvements={setMouvements}
          orientation={orientation}
          apercu={apercuLundi ?? undefined}
          largeurColonne={largeurColonne}
          onOuvrirFinances={onOpenFinances}
          onOuvrirRetard={r => ouvrir(r.ouvre)}
          onIdeeSemaine={ouvrirIdee}
          onTrier={() => setPanneau('tri')}
          onFiltrer={() => setPanneau('filtre')}
        />
        {etoilesSurCourbe.length > 0 && (
          <div className="cal-etoiles" aria-hidden={false} data-etoiles-courbe>
            {etoilesSurCourbe.map(e => (
              <span key={e.id} data-etoile-courbe={e.id} role="img" aria-label={`Étoile : ${e.titre}, ${e.numero}`} className="cal-etoile-c" style={{ left: `${((e.colonne + 0.5) / Math.max(1, colonnes.length)) * 100}%` }}>★</span>
            ))}
          </div>
        )}
      </div>

      {filtre && (
        <p className="cal-filtre" data-filtre>
          <b>{nomRangee(filtre)} seules</b>
          <button type="button" className="cal-b" onClick={() => setFiltre(null)}>Tout afficher</button>
        </p>
      )}

      {liste ? (
        <VueListe
          choses={choses}
          sansDate={modele.sansDate}
          aujourdhui={aujourdhui}
          ancre={ancreListe}
          selectionId={selectionId}
          onChose={(c, cible) => surToucher(c, cible)}
          detail={detail}
        />
      ) : graph ? (
        <div className="cal-bande-graph" data-bande-graph aria-label="Frise : une bande par rangée">
          {ordre.map(r => (
            <div key={r} className={`cal-bg-r ${CLASSE_TEINTE[r]}`} data-bg-rangee={r}>
              {choses.filter(c => c.rangee === r).map(c => {
                const p = positionDans(colonnes, c);
                return p ? <i key={c.id} className="cal-bg-i" style={{ left: `${(p.a / colonnes.length) * 100}%`, width: `${((p.b - p.a + 1) / colonnes.length) * 100}%` }} /> : null;
              })}
            </div>
          ))}
        </div>
      ) : (
        <Frise
          choses={choses}
          colonnes={colonnes}
          paysage={paysage}
          ordre={ordre}
          masquees={masquees}
          filtre={filtre}
          epingles={epingles}
          etoiles={etoiles}
          selectionId={selectionId}
          menuId={menu?.id ?? null}
          drag={drag}
          ici={ici}
          etiquetteDuree={duree}
          detail={detail}
          onMesure={setMesure}
          onAjouter={ouvrirFeuille}
          onBasculerMasque={basculerMasque}
          onSixSemaines={surSixSemaines}
          barre={{ onToucher: surToucher, onAppuiLong: surAppuiLong, onGlisse: surGlisse, onLacheGlisse: surLacheGlisse, onBord: surBord, onLacheBord: surLacheBord, onRefus: surRefus }}
        />
      )}

      <Message message={message} onFermer={fermerMessage} />

      {menu && chosesMenu && (() => {
        const c = chosesMenu;
        const prochain = ajouterJours(lundiDe(c.debut), 7);
        const dup = dupliquer(c, prochain, ctxGestes);
        const ret = retirer(c, ctxGestes);
        return (
          <MenuAppuiLong
            chose={c}
            nomRangee={nomRangee(c.rangee)}
            ancre={menu.ancre}
            epinglee={epingles.includes(c.id)}
            etoilee={etoiles.includes(c.id)}
            autresRangees={ordre.filter(r => r !== c.rangee).length}
            dupliquer={dup.ok === false ? null : { libelle: etiquetteS(prochain), ...(dup.effet ? { effet: dup.effet.texte } : {}) }}
            retirer={ret.ok === false ? { raison: ret.raison } : { ...(ret.effet ? { effet: ret.effet.texte } : {}) }}
            liens={{
              brassins: don.batches.filter(b => !b.archivedAt).map(b => ({ id: b.id, nom: b.name || b.id })),
              clients: don.clients.filter(cl => !cl.archivedAt).map(cl => ({ id: cl.id, nom: cl.name }))
            }}
            onEpingler={() => {
              const avant = epingles, on = !avant.includes(c.id);
              setEpingles(basculer(avant, c.id)); setMenu(null);
              montrer({ role: 'status', texte: on ? `${c.titre} épinglée : reste visible si tu masques ${nomRangee(c.rangee)}` : 'Épingle retirée', annuler: () => { setEpingles(avant); setMessage(null); } });
            }}
            onEtoile={() => {
              const avant = etoiles, on = !avant.includes(c.id);
              setEtoiles(basculer(avant, c.id)); setMenu(null);
              montrer({ role: 'status', texte: on ? `Étoile : ${c.titre} marquée sur la courbe` : 'Étoile retirée', annuler: () => { setEtoiles(avant); setMessage(null); } });
            }}
            onSeules={() => {
              setFiltre(c.rangee); setMenu(null);
              montrer({ role: 'status', texte: `${nomRangee(c.rangee)} seules`, annuler: () => { setFiltre(null); setMessage(null); } });
            }}
            onDupliquer={() => { setMenu(null); void ecrire(dup); }}
            onLier={(liens, nom) => { setMenu(null); void ecrire(lier(c, liens, ctxGestes)).then(ok => { if (ok) void 0; void nom; }); }}
            onRetirer={() => { setMenu(null); void ecrire(ret); }}
            onFermer={() => setMenu(null)}
          />
        );
      })()}

      {feuille && (
        <FeuilleAjout
          key={feuille.cle}
          mode={feuille.mode}
          initial={feuille.initial}
          contexte={ctxAjout}
          semaines={modele.semaines}
          sansPlusDeDetails={feuille.sansPlusDeDetails || feuille.mode === 'modifier'}
          onPlusDeDetails={plusDeDetails}
          onAjouter={ajouterDepuisFeuille}
          onFermer={() => setFeuille(null)}
        />
      )}

      {idee !== null && <FeuilleIdee lundi={idee} semaines={modele.semaines} onNoter={idee_ecrire} onFermer={() => setIdee(null)} />}

      {panneau === 'tri' && (
        <Sheet open onClose={() => setPanneau(null)} title="Trier les rangées">
          <ol className="cal-tri px-3 pb-3" aria-label="Ordre des rangées">
            {ordre.map((r, i) => (
              <li key={r} className={`cal-tri-l ${CLASSE_TEINTE[r]}`}>
                <i className="cal-pt-teinte" aria-hidden="true" />
                <span className="flex-1">{nomRangee(r)}</span>
                <button type="button" className="cal-b" aria-label={`Monter ${nomRangee(r)}`} disabled={i === 0} onClick={() => deplacerRangee(r, -1)}>↑</button>
                <button type="button" className="cal-b" aria-label={`Descendre ${nomRangee(r)}`} disabled={i === ordre.length - 1} onClick={() => deplacerRangee(r, 1)}>↓</button>
              </li>
            ))}
          </ol>
        </Sheet>
      )}
      {panneau === 'filtre' && (
        <Sheet open onClose={() => setPanneau(null)} title="Filtrer par type">
          <div className="flex flex-wrap gap-2 px-3 pb-3" role="group" aria-label="Type">
            {RANGEES.map(r => (
              <button key={r.id} type="button" aria-pressed={filtre === r.id} className={`cal-b ${CLASSE_TEINTE[r.id]}`} onClick={() => { setFiltre(r.id); setPanneau(null); }}>{r.nom} seules</button>
            ))}
            <button type="button" className="cal-b" onClick={() => { setFiltre(null); setPanneau(null); }}>Tout afficher</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** « Noter une idée » (E36, L1 a et b) : une idée datée, envoyée au carnet par le service existant. Elle n'a ni rangée ni case. */
function FeuilleIdee({ lundi, semaines, onNoter, onFermer }: { lundi: string; semaines: ReadonlyArray<{ debut: string; numero: number }>; onNoter: (titre: string, lundi: string) => Promise<string | null>; onFermer: () => void }) {
  const [titre, setTitre] = useState('');
  const [semaine, setSemaine] = useState(lundiDe(lundi));
  const [refus, setRefus] = useState<string | null>(null);
  void enregistrementIdee;
  return (
    <Sheet
      open
      onClose={onFermer}
      title="Noter une idée"
      subtitle={`en ${etiquetteS(semaine)}`}
      footer={<button type="button" className="min-h-11 w-full rounded-control bg-cave-50 px-4 text-base font-bold text-cave-950" onClick={async () => setRefus(await onNoter(titre, semaine))}>Noter</button>}
    >
      <div className="space-y-3 px-3 pb-3 text-sm">
        <label className="block">
          <span className="mb-0.5 block text-sm text-cave-200">L’idée, en quelques mots</span>
          <Input type="text" value={titre} onChange={e => setTitre(e.target.value)} enterKeyHint="done" className="min-h-10 w-full rounded-control border border-cave-700 bg-cave-950 px-2 text-base text-cave-50" />
        </label>
        <div role="group" aria-label="Semaine" data-vaul-no-drag className="flex gap-1 overflow-x-auto pb-1">
          {semaines.map(s => (
            <button key={s.debut} type="button" aria-pressed={s.debut === semaine} onClick={() => setSemaine(s.debut)}
              className="flex min-h-11 min-w-12 shrink-0 flex-col items-center justify-center rounded-control border border-cave-700 text-cave-50 aria-pressed:border-cave-50">
              <b className="text-sm">S{s.numero}</b><small className="text-xs text-cave-200">{jourLisible(s.debut)}</small>
            </button>
          ))}
        </div>
        <p className="text-sm text-cave-200">{dateDeSemaine(semaine)}. Elle arrive dans le carnet.</p>
        {refus && <p className="text-sm text-alert-strong">{refus}</p>}
      </div>
    </Sheet>
  );
}
