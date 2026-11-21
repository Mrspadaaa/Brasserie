import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from '../../ui/Sheet';
import { Input } from '../../ui/Input';
import type { Batch, FinanceCategory, StockItem, Transaction } from '../../types';
import type { Periode } from '../periode/periode';
import { StorageService } from '../../services/storage';
import { usePlusPage } from '../../ui/plusPage';
import { useDonneesCalendrier, type DonneesCalendrier } from '../../ui/calendrier/useDonneesCalendrier';
import { appliquer, portParDefaut, type EcritureFaite, type PortEcritures } from '../../ui/calendrier/ecritures';
import { useOrientation } from '../../ui/calendrier/useOrientation';
import { EnTeteCalendrier, type MessageEnTete, type VueCalendrier } from '../../ui/calendrier/entete/EnTete';
import { fenetreDePeriode, libelleDuree, periodeDeFenetre, SEMAINES_ANNEE, type FenetreSemaines } from '../../ui/calendrier/entete/Fenetre';
import { Frise, ordreComplet } from '../../ui/calendrier/frise/Frise';
import type { SaisieRapide } from '../../ui/finance/prevision/PlanSheetC';
import { isoDate } from '../../domain/finance/ledger';
import { Message, type MessageCal } from '../../ui/calendrier/frise/Message';
import { MenuAppuiLong, type LiensPossibles } from '../../ui/calendrier/frise/MenuAppuiLong';
import { DetailChose } from '../../ui/calendrier/frise/DetailChose';
import { FeuilleAjout, type ResultatAjout } from '../../ui/calendrier/frise/FeuilleAjout';
import { VueListe } from '../../ui/calendrier/frise/VueListe';
import { CLASSE_TEINTE } from '../../ui/calendrier/frise/Marque';
import { positionDans, type Colonne, type DragEtat } from '../../ui/calendrier/frise/Rangee';
import { aDesJours, ajouterMois, cibleDuGlisse, colonnesDeLAxe, ECHELLES, enMois, echelleApres, echelleEffective, peutDeplier, PERIODE_DE_L_ECHELLE, type Echelle, type SensPincement } from '../../ui/calendrier/echelle';
import {
  RANGEES, anneeEnMois, ajouterJours, barreLiee, dateDeSemaine, ecartJours, estPonctuel, etiquetteS, jourLisible, lundiDe, nomRangee, nomSeules, preparerChoses,
  type CibleOuverture, type ChoseCalendrier, type ModeleCalendrier, type Rangee as IdRangee
} from '../../domain/calendrier';
import { courbeAvec, effetCaisse, type CourbeCaisse } from '../../domain/calendrierCaisse';
import {
  brouillonDepuisChose, brouillonDepuisProposition, brouillonVide, versEnregistrement, versModification, enregistrementIdee, jourPose,
  type BrouillonAjout, type ContexteAjout
} from '../../domain/calendrierAjout';
import {
  accepterVente, alignerCourbe, allonger, deplacer, deplacerJours, dupliquer, dureeAllongee, fait, lier, delier, livrer, mettreDeCote, modifierIdee, retirer, noterIdee, supprimerSansDate,
  courbeDuGlisse, jourDuGlisse, raisonNommee, type ContexteGestes, type Ecriture, type Message as MessageGeste, type Promesse, type Resolution
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
  /** R48 : l'icône d'une idée notée ici ouvre son carnet (Stocks › Matériel › Carnets, ce carnet ouvert). */
  onOpenCarnet?: (id: string) => void;
  /**
   * Les courses (Stocks › Courses), pour « Commander ». `batchId` : le brassin dont on part (f4-b) ; l'app ouvre alors les Courses sur une
   * fenêtre qui contient sa semaine de brassage (CRITIQUE-5 n° 17, D-191).
   */
  onOpenCourses: (batchId?: string) => void;
  /** « Plus de détails › » d'un brassin : la quick action de l'app, sur la recette déjà choisie dans la feuille rapide s'il y en a une. */
  onPoserBrassin: (recetteId?: string) => void;
  /** Reçoit le lundi (aaaa-mm-jj) : « Plus de détails › » d'une fête ; `saisie` : le nom et le montant déjà tapés (lot A, n° 3). */
  onPoserFete: (lundi: string, saisie?: SaisieRapide) => void;
  /**
   * Reçoit le lundi et la rangée : « Plus de détails › » d'un achat, d'un travail ou d'un papier ouvre Prévoir une dépense (PlanSheet, `date`),
   * avec la catégorie de sa rangée (CRITIQUE-5 n° 3, D-68 : un achat ne s'ouvre plus en « Charges fixes », qui le rangeait dans Papiers).
   */
  onPoserDepense: (lundi: string, rangee: IdRangee, categorie?: FinanceCategory, saisie?: SaisieRapide) => void;
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

/** « déc.. » et « nov. . » deviennent « déc. » et « nov. » : une abréviation qui finit une phrase ne double pas son point (CRITIQUE-3 n° 37). */
/**
 * CRITIQUE-6 n° 3 (D-68, E34, E38) : la catégorie d'une prévision ouverte par « Plus de détails › » depuis une rangée. Un achat de matières
 * est « Brassage » (le domaine le range dans Achats), jamais « Charges fixes » (rangé dans Papiers). Clés de `CATEGORY_LABELS`.
 */
export const CATEGORIE_DE_RANGEE: Partial<Record<IdRangee, FinanceCategory>> = { achats: 'brassage', travaux: 'renovation', papiers: 'chargesFixes' };

export function sansPointDouble(texte: string): string {
  return texte.replace(/\.(?:\s*\.)+/g, () => '.');
}

/**
 * CRITIQUE-7 (A6) : le résumé d'une pose (« 3 fûts La Cigogne · S47 ») suivi de l'effet sur la caisse (« S47 : 3 268 → 4 168 ») disait deux fois
 * la semaine. Quand l'effet commence par une semaine que le résumé porte déjà en segment « · Snn », ce segment part ; le reste du résumé
 * (« vente confirmée ») est gardé. Assemblé par segments, sans remplacement de chaîne (L26).
 */
export function resumeSansSemaine(resume: string, effet: string): string {
  const semaine = /^S\d{1,2}\b/.exec(effet)?.[0];
  if (!semaine) return resume;
  const segments = resume.split(' · ');
  /* « S2 ’27 » (une semaine de l'an prochain) est la même semaine que l'effet « S2 : … » */
  const i = segments.findIndex((s, k) => k > 0 && (s === semaine || s.startsWith(`${semaine} `)));
  return i < 0 ? resume : segments.filter((_, k) => k !== i).join(' · ');
}

/** Une semaine dite en phrase : « S52, 21 – 27 déc. » suivi d'une phrase, sans « déc.. ». */
const phraseSemaine = (lundi: string, suite: string) => sansPointDouble(`${dateDeSemaine(lundi)}. ${suite}`);

/**
 * f6-b (E32, CRITIQUE-3 n° 20) : « 3 fûts promis à La Cigogne le 15 déc. · prête le 4 janv. », composé depuis la promesse du domaine. Le client
 * vient de `clientId` ; s'il manque ou est inconnu, la phrase du domaine reste (« 3 fûts La Cigogne promis le … »), sans rien inventer.
 */
export function textePromesse(p: Promesse, clients: ReadonlyArray<{ id: string; name: string }>): string {
  const client = p.clientId ? clients.find(c => c.id === p.clientId)?.name?.trim() : undefined;
  if (!client) return sansPointDouble(p.texte);
  const titre = p.titre.trim();
  const i = titre.toLocaleLowerCase('fr').indexOf(client.toLocaleLowerCase('fr'));
  const quoi = (i >= 0 ? `${titre.slice(0, i)} ${titre.slice(i + client.length)}` : titre).replace(/\s+/g, ' ').replace(/[\s,·–-]+$/, '').trim() || titre;
  return sansPointDouble(`${quoi} promis à ${client} le ${jourLisible(p.jourPromis)} · prête le ${jourLisible(p.preteLe)}`);
}

/** Les durées du menu période (E07), en semaines : « Voir S20 › » prend la plus petite qui contient la chose posée (CRITIQUE-10 n° 2). */
const DUREES_MENU: readonly number[] = [6, 13, 26, SEMAINES_ANNEE];

/** L'étendue d'une chose posée par la feuille, du lundi de son début au dimanche de sa fin ; un brassin court jusqu'à « prête ». */
export function etendueDuBrouillon(b: BrouillonAjout): { du: string; au: string } | null {
  if (!b.debut) return null;
  const du = lundiDe(b.debut);
  const finBrassin = b.rangee === 'brassins' && b.tempsEnCuve ? ajouterJours(du, b.tempsEnCuve) : null;
  const fin = finBrassin ?? (b.fin && b.fin > du ? b.fin : du);
  return { du, au: ajouterJours(lundiDe(fin), 6) };
}

type CritereTri = 'urgent' | 'date' | 'montant';
const CRITERES_TRI: readonly CritereTri[] = ['urgent', 'date', 'montant'];
const NOM_CRITERE: Record<CritereTri, string> = { urgent: 'Urgent', date: 'Date', montant: 'Montant' };

/**
 * « Trier les rangées » (k15 du jouable, `k15Ordre`) : sans critère, l'ordre par genre ; « Urgent » met d'abord les rangées en retard, puis
 * celle dont la prochaine chose de la fenêtre arrive le plus tôt ; « Date » la première chose qui commence ; « Montant » la plus grosse somme,
 * les rangées sans montant en dernier. Égalité : l'ordre par genre.
 */
export function ordreSelon(critere: CritereTri | null, choses: readonly ChoseCalendrier[], retards: ReadonlyArray<{ id: string }>, du: string, au: string): IdRangee[] {
  const base = RANGEES.map(r => r.id);
  if (!critere) return base;
  const enRetard = new Set(retards.map(r => r.id));
  const score = new Map<IdRangee, number>();
  base.forEach(r => {
    const dans = choses.filter(c => c.rangee === r && !c.sansDate && !c.fait && c.debut && c.debut <= au && (c.fin || c.debut) >= du);
    const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86400000;
    let v: number;
    if (critere === 'urgent') {
      v = dans.reduce((m, c) => Math.min(m, jour(c.debut > du ? c.debut : du)), 1e9);
      if (choses.some(c => c.rangee === r && (enRetard.has(c.id) || enRetard.has((c.source as { id?: string }).id ?? '')))) v = -1e9;
    } else if (critere === 'date') v = dans.reduce((m, c) => Math.min(m, jour(c.debut)), 1e9);
    else v = dans.some(c => c.centimes != null) ? -dans.reduce((m, c) => Math.max(m, Math.abs(c.centimes ?? 0)), 0) : 1e12;
    score.set(r, v);
  });
  return [...base].sort((a, b) => (score.get(a)! - score.get(b)!) || base.indexOf(a) - base.indexOf(b));
}

interface FeuilleEtat { mode: 'ajouter' | 'modifier'; initial: BrouillonAjout; chose?: ChoseCalendrier; sansPlusDeDetails?: boolean; cle: number }
type Panneau = 'tri' | 'filtre' | null;

export function CalendrierTab(props: CalendrierTabProps) {
  const { transactions, batches, stockItems, onOpenBatch, onOpenFinances, onOpenAgenda, onOpenCarnet, onOpenCourses, onPoserBrassin, onPoserFete, onPoserDepense, onOuvrirBudget, onOpenPiece, section, centrerSur } = props;
  const port = useMemo(() => props.port ?? portParDefaut(), [props.port]);
  const lues = useDonneesCalendrier({ transactions, batches, stockItems, aujourdhui: props.aujourdhui });
  const don = props.donnees ?? lues;
  const { modele: modeleLu, aujourdhui } = don;
  /* les choses prêtes pour la frise : budget de chaque brassin, courses d'un brassin en un caddie relié, pastilles « lié à » ; la courbe
     rattachée aux ids stables des choses (CRITIQUE-2 n° 1 b, 9, 11, 32) */
  const nomsLiens = useMemo(() => ({
    brassins: new Map(don.batches.map(b => [b.id, b.name || b.id] as const)),
    clients: new Map(don.clients.map(c => [c.id, c.name] as const))
  }), [don.batches, don.clients]);
  const modele: ModeleCalendrier = useMemo(() => {
    const prets = preparerChoses(modeleLu.choses, nomsLiens);
    return { ...modeleLu, choses: prets, courbe: alignerCourbe(modeleLu.courbe, prets) };
  }, [modeleLu, nomsLiens]);
  const orientation = useOrientation();
  const paysage = orientation === 'paysage';
  /* CAL-PASSE : `premierLundi` est le bord de la frise (le passé en fait partie) ; `lundiAuj` la semaine courante, où l'on ajoute et d'où l'on part */
  const premierLundi = modele.semaines[0]?.debut ?? lundiDe(aujourdhui);
  const lundiAuj = lundiDe(aujourdhui);

  /* ---------- l'état de l'écran ---------- */
  const [vue, setVueEtat] = useState<VueCalendrier>('semaines');
  const [ancreListe, setAncreListe] = useState<'sans-date' | undefined>(undefined);
  const [fenetre, setFenetre] = useState<FenetreSemaines>(() => {
    const du = centrerSur ? (lundiDe(ajouterJours(centrerSur, -14)) < premierLundi ? premierLundi : lundiDe(ajouterJours(centrerSur, -14))) : lundiAuj;
    return { du, semaines: 6 };
  });
  const [periodeLocale, setPeriodeLocale] = useState<Periode | undefined>(props.periode);
  const clePeriode = JSON.stringify(props.periode ?? null);
  useEffect(() => { setPeriodeLocale(props.periode); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clePeriode]);
  /* CRITIQUE-6 n° 11 (E07 ET-PER, D-12, D-13) : la période de l'app EST celle du calendrier, dans les deux sens. Une plage, un mois, un
     trimestre ou une année réglés dans la barre de l'app ou dans Finances règlent la fenêtre (l'en-tête la suit : « Nov. » dans la barre,
     « Nov. » au calendrier, les semaines de novembre dans l'horizon). Seuls « Tout » (sans bornes) et une période tout entière passée ne
     se lisent pas en semaines : la fenêtre reste la sienne. */
  const periodeEnTete: Periode = periodeLocale && fenetreDePeriode(periodeLocale, premierLundi, modele.semaines.length || SEMAINES_ANNEE) ? periodeLocale : periodeDeFenetre(fenetre);
  const onPeriode = useCallback((p: Periode) => { setPeriodeLocale(p); props.onPeriode?.(p); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onPeriode]);
  const [mouvements, setMouvements] = useState(false);
  const [epingles, setEpingles] = useEtatGarde<string[]>('calendrier_epingles', []);
  const [etoiles, setEtoiles] = useEtatGarde<string[]>('calendrier_etoiles', []);
  const [masquees, setMasquees] = useEtatGarde<IdRangee[]>('calendrier_masquees', []);
  const [ordreBrut, setOrdre] = useEtatGarde<IdRangee[]>('calendrier_ordre', RANGEES.map(r => r.id));
  /* E44 : un calendrier de section ne montre que ses rangées (CAL-PASSE : `section` ne filtrait que les choses, les rangées vides restaient) */
  const ordre = useMemo(() => { const o = ordreComplet(ordreBrut); return section ? o.filter(r => RANGEES_SECTION[section].includes(r)) : o; }, [ordreBrut, section]);
  /* le filtre dure le temps de la visite : il n'est pas gardé (E39) */
  const [filtre, setFiltre] = useState<IdRangee | null>(null);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; ancre: HTMLElement } | null>(null);
  const [feuille, setFeuille] = useState<FeuilleEtat | null>(null);
  const [idee, setIdee] = useState<string | null>(null);
  /* CAL-PASSE : une idée hors carnet touchée au Calendrier s'ouvre dans sa feuille, sur place (« Modifier », comme une fête) */
  const [ideeModif, setIdeeModif] = useState<{ id: string; titre: string; lundi: string; jour: string | null } | null>(null);
  const [message, setMessage] = useState<MessageCal | null>(null);
  /** L'id du message posé dans le flux faute de place libre (PC-109). */
  const [fluxForce, setFluxForce] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragEtat | null>(null);
  const [ici, setIci] = useState<string | null>(null);
  const [apercuLundi, setApercu] = useState<{ courbe: CourbeCaisse; lache: string } | null>(null);
  /* D387 (interrupteur : courbe alignée sur la frise) et D389 (courbe cachée) : des choix gardés par appareil */
  const [courbeAlignee, setCourbeAlignee] = useEtatGarde<boolean>('calendrier_courbe_alignee', false);
  const [courbeCachee, setCourbeCachee] = useEtatGarde<boolean>('calendrier_courbe_cachee', false);
  const [duree, setDuree] = useState<{ id: string; texte: string } | null>(null);
  const [mesure, setMesure] = useState({ largeur: 0, largeurColonne: 0 });
  /* D385 : l'échelle de l'axe (Jour, Semaine, Mois), Semaine par défaut (« semaine par default », #202) ; la semaine dépliée (C).
     Paquet F n° 3 (PC-139) : l'échelle choisie se garde par appareil, comme la plage : au rechargement, « 3 mois » en Mois reste en Mois */
  const [echelleVoulue, setEchelleVoulue] = useEtatGarde<Echelle>('calendrier_echelle', 'semaine');
  const [deplie, setDeplie] = useState<string | null>(null);
  const compteur = useRef(0);

  const rangeesVisibles = useMemo(() => (section ? RANGEES_SECTION[section] : null), [section]);
  const choses = useMemo(() => (rangeesVisibles ? modele.choses.filter(c => rangeesVisibles.includes(c.rangee)) : modele.choses), [modele.choses, rangeesVisibles]);
  const choseDe = useCallback((id: string | null | undefined) => (id ? [...choses, ...modele.sansDate].find(c => c.id === id) : undefined), [choses, modele.sansDate]);

  const ctxGestes: ContexteGestes = useMemo(() => ({ aujourdhui, batches: don.batches, plans: don.plans, courbe: modele.courbe, debutHorizon: premierLundi }), [aujourdhui, don.batches, don.plans, modele.courbe, premierLundi]);
  const ctxRef = useRef(ctxGestes);
  ctxRef.current = ctxGestes;
  const modeleRef = useRef(modele);
  modeleRef.current = modele;
  const ctxClients = useRef(don.clients);
  ctxClients.current = don.clients;
  const ctxAjout: ContexteAjout = useMemo(() => ({ aujourdhui, recettes: don.recettes, clients: don.clients, plans: don.plans, choses: modele.choses }), [aujourdhui, don.recettes, don.clients, don.plans, modele.choses]);

  /* ---------- les colonnes de la frise : des semaines, ou les douze mois de l'année ---------- */
  const annee = vue === 'annee';
  /* D385 (D, C, B ensemble) : l'échelle voulue, si la période la permet (Jour jusqu'à 3 semaines, Mois dès 3 mois) ; une semaine se déplie en
     Semaine, si ses jours gardent 16 px au moins et si elle est dans la fenêtre */
  const echelle = echelleEffective(echelleVoulue, fenetre.semaines, annee);
  const deplieVu = !annee && echelle === 'semaine' && deplie && peutDeplier(mesure.largeur || 360, fenetre.semaines) && deplie >= fenetre.du && deplie < ajouterJours(fenetre.du, fenetre.semaines * 7) ? deplie : null;
  /* CAL-PASSE (décision du pilote, 20.11) : l'An, ce sont douze mois à partir du début de la fenêtre (aujourd'hui par défaut, plus tôt si l'on a
     reculé), jamais tout le passé ajouté plus l'avenir (23 colonnes) */
  const moisAn = useMemo(() => anneeEnMois(fenetre.du, Math.min(SEMAINES_ANNEE, Math.max(1, fenetre.semaines))), [fenetre.du, fenetre.semaines]);
  const colonnes: Colonne[] = useMemo(() => {
    if (annee) return moisAn.map(m => ({ debut: m.debut, fin: m.fin, etiquette: m.court }));
    return colonnesDeLAxe({ echelle, semaines: modele.semaines, mois: modele.mois, du: fenetre.du, nombre: fenetre.semaines, deplie: deplieVu });
  }, [annee, echelle, deplieVu, moisAn, modele.mois, modele.semaines, fenetre]);
  const colonnesRef = useRef(colonnes);
  colonnesRef.current = colonnes;
  const echelleRef = useRef(echelle);
  echelleRef.current = echelle;
  /* une période réglée ailleurs (menu, Finances, cadre de la courbe) que l'échelle voulue ne permet pas la ramène à celle montrée ; jamais en
     paysage (13 semaines le temps de la rotation : l'échelle revient au retour) */
  /* paquet F n° 3 : pas avant que la fenêtre ait rejoint la période de l'app (au montage, 6 semaines le temps que l'en-tête lise « 3 mois ») ;
     sinon l'échelle gardée retomberait à Semaine à chaque rechargement */
  const semainesDeLaPeriode = useMemo(() => {
    const total = modele.semaines.length;
    return periodeLocale && total ? fenetreDePeriode(periodeLocale, modele.semaines[0].debut, total)?.semaines ?? null : null;
  }, [periodeLocale, modele.semaines]);
  const fenetreSurLaPeriode = !periodeLocale || (modele.semaines.length > 0 && (semainesDeLaPeriode === null || semainesDeLaPeriode === fenetre.semaines));
  useEffect(() => {
    if (!paysage && !annee && fenetreSurLaPeriode && echelleVoulue !== echelle) setEchelleVoulue(echelle);
  }, [paysage, annee, fenetreSurLaPeriode, echelleVoulue, echelle, setEchelleVoulue]);

  /* ---------- le message : UN canal pour tout l'onglet (E33, D-200, CRITIQUE-3 n° 7) ----------
     Un message chasse le précédent. Il part au premier défilement de 24 px (la page ou un conteneur de l'onglet, la frise comprise), à tout
     nouveau toucher hors de lui (frise, courbe, bande, + volant, onglets), à l'ouverture d'un détail, d'un menu, d'une feuille, et au
     changement de vue. L'en-tête passe par le même canal (`onMessage`) : jamais deux messages à la fois. */
  const montrer = useCallback((m: Omit<MessageCal, 'id'>) => { compteur.current += 1; setMessage({ ...m, texte: sansPointDouble(m.texte), id: compteur.current }); }, []);
  const fermerMessage = useCallback(() => setMessage(null), []);
  /* CRITIQUE-10 (constat D n° 1, E33, D-126) : le geste Lier ouvre lui-même le détail ; le défilement qui le dégage du + (lot C) n'est pas
     celui du brasseur et ne chasse pas « Liée à X · Annuler ». Jusqu'à cette heure, un défilement est absorbé (la position repart de là). */
  const ouvertureParGeste = useRef(0);
  /* CRITIQUE-13 n° 1 : la frise défile pour montrer l'alerte f6-b entière ; ce défilement-là ne la chasse pas */
  const absorberDefilement = useCallback(() => { ouvertureParGeste.current = Date.now() + 600; }, []);
  const racine = useRef<HTMLDivElement>(null);
  const idMessage = message?.id;
  useEffect(() => {
    if (idMessage === undefined || typeof window === 'undefined') return undefined;
    /* les positions de départ : la page, et chaque conteneur défilant de l'onglet (la frise) */
    const defilant = (t: EventTarget): Element => (t instanceof Element ? t : document.scrollingElement ?? document.documentElement);
    const depart = new Map<EventTarget, { x: number; y: number; h: number }>([[document, { x: window.scrollX, y: window.scrollY, h: defilant(document).scrollHeight }]]);
    racine.current?.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) depart.set(el, { x: el.scrollLeft, y: el.scrollTop, h: el.scrollHeight });
    });
    const position = (t: EventTarget) => (t instanceof Element ? { x: t.scrollLeft, y: t.scrollTop } : { x: window.scrollX, y: window.scrollY });
    const surDefilement = (e: Event) => {
      /* la page défile (cible : document ou window) ou un conteneur de l'onglet */
      const t: EventTarget = e.target instanceof Element ? e.target : document;
      const d = depart.get(t);
      if (!d) { if (t instanceof Element && racine.current?.contains(t)) depart.set(t, { ...position(t), h: t.scrollHeight }); return; }
      const p = position(t);
      if (Date.now() < ouvertureParGeste.current) { depart.set(t, { ...p, h: defilant(t).scrollHeight }); return; }
      /* CRITIQUE-7, banc 1280 : une rangée qui rétrécit après un geste (une file de moins) raccourcit la page ; au bout du défilement, le navigateur
         ramène la page de lui-même (−30 px) et chassait « Annuler ». Un défilement qui ne fait que suivre le nouveau bas n'est pas celui du brasseur :
         on repart de là. */
      const el = defilant(t), h = el.scrollHeight;
      if (h < d.h - 1 && Math.abs(p.y - Math.max(0, h - el.clientHeight)) <= 1) { depart.set(t, { ...p, h }); return; }
      if (Math.abs(p.y - d.y) >= 24 || Math.abs(p.x - d.x) >= 24) setMessage(null);
    };
    const surToucher = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest && t.closest('[data-message]')) return;
      setMessage(null);
    };
    window.addEventListener('scroll', surDefilement, { passive: true, capture: true });
    document.addEventListener('pointerdown', surToucher, true);
    return () => { window.removeEventListener('scroll', surDefilement, true); document.removeEventListener('pointerdown', surToucher, true); };
  }, [idMessage]);
  /* l'en-tête (« Tire jusqu'au bout : l'année », « Tourne le téléphone : 13 semaines ») parle par ce canal ; son retrait ne chasse que lui */
  const surMessageEnTete = useCallback((m: MessageEnTete | null) => {
    if (m) montrer({ role: 'status', texte: m.texte, origine: 'entete' });
    else setMessage(cur => (cur?.origine === 'entete' ? null : cur));
  }, [montrer]);

  /** L'événement d'agenda `id` ouvert dans sa feuille du Calendrier ; faux s'il n'y est pas (la chose n'est pas au modèle). */
  const agendaOuvert = useCallback((id: string): boolean => {
    const chose = modele.choses.find(c => c.source.genre === 'creative' && (c.source as { id: string }).id === id);
    if (!chose) return false;
    setMessage(null); setMenu(null); setSelectionId(null);
    const initial = chose.sansDate ? { ...brouillonDepuisChose(chose), debut: lundiAuj, debutChoisi: true } : brouillonDepuisChose(chose);
    setFeuille({ mode: 'modifier', initial, chose, cle: ++compteur.current });
    return true;
  }, [modele.choses, lundiAuj]);

  const ouvrir = useCallback((cible: CibleOuverture) => {
    const ideeHorsCarnet = cible.ecran === 'atelier' && cible.id ? don.items.find(i => i.id === cible.id && i.type === 'recipe-idea') : undefined;
    if (ideeHorsCarnet) {
      const jour = isoDate(ideeHorsCarnet.date) ?? null;
      setMessage(null); setMenu(null);
      setIdeeModif({ id: ideeHorsCarnet.id, titre: ideeHorsCarnet.title, lundi: lundiDe(jour ?? lundiAuj), jour });
    }
    else if (cible.ecran === 'brassin' && cible.id) onOpenBatch(cible.id);
    else if ((cible.ecran === 'piece') && cible.id && onOpenPiece) onOpenPiece(cible.id);
    else if (cible.ecran === 'carnets' && cible.id && onOpenCarnet) onOpenCarnet(cible.id);
    /* k1 (21.11, audit des vues n° 5) : un événement d'agenda reste au Calendrier ; sa feuille (Modifier) est sa vue choisie, comme dans
       sa fiche (DetailChose). Sans date : la feuille pour le poser. Seule une idée ou un projet part au Carnet (CarnetsVue). */
    else if (cible.ecran === 'agenda' && cible.id && agendaOuvert(cible.id)) return;
    else if (cible.ecran === 'agenda' || cible.ecran === 'atelier' || cible.ecran === 'carnets') onOpenAgenda();
    else if (cible.ecran === 'courses' || cible.ecran === 'fournisseur') onOpenCourses();
    /* test en ligne 1, n° 2 (« Je demande mon achat, il me montre rien ») : un plan (achat prévu, vente prévue, charge) vit dans
       Finances › Prévisions ; l'app ouvre ce sous-onglet (`affinee:ouvrir-finances`, CP-13). Personne ne répond (banc) : Finances seul. */
    else if (cible.ecran === 'plan' && !window.dispatchEvent(new CustomEvent('affinee:ouvrir-finances', { cancelable: true, detail: { onglet: 'previsions' } }))) return;
    else onOpenFinances();
  }, [don.items, lundiAuj, onOpenBatch, onOpenPiece, onOpenCarnet, onOpenAgenda, onOpenCourses, onOpenFinances, agendaOuvert]);

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
    montrer({ role: 'status', texte: jalon ? raisonNommee(chose.titre, raison) : raison, ancre: chose.id, ...(texte ? { lien: { texte, agir: () => ouvrir(cible) } } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montrer, ouvrir]);

  function setDetailFerme() { setSelectionId(null); setMenu(null); }

  /* ---------- écrire : la source, puis le message avec son inverse ---------- */
  /* CRITIQUE-12 n° 1 : `ancre` (id de la chose touchée, `data-chose`) : le message se pose près d'elle s'il n'y cache aucun texte, sinon en bas */
  const ecrire = useCallback(async (res: Resolution, depuisMenu = false, ancre?: string, ouvreSonDetail = false, aussi?: MessageCal['aussi']): Promise<boolean> => {
    if (res.ok === false) { montrer({ role: 'status', texte: res.raison, ...(ancre ? { ancre } : {}), ...(res.message.lien ? { lien: lienDe(res.message.lien) } : {}) }); return false; }
    let faite: EcritureFaite;
    try { faite = await appliquer(res.ecritures as Ecriture[], port); } catch (e) { montrer({ role: 'status', texte: e instanceof Error ? e.message : 'Écriture impossible. Rien n’a changé.' }); return false; }
    setDetailFerme();
    /* CRITIQUE-4 n° 6 : au téléphone, le « click » qui suit le lâcher d'une action du menu tombe sur le message qui vient d'apparaître sous le
       doigt (vu au banc : « Liée à La Cigogne » annulé aussitôt). Après une action du menu, Annuler n'écoute qu'après 400 ms : aucun doigt ne vise si vite. */
    const montreLe = Date.now();
    const annuler = async () => { if (depuisMenu && Date.now() - montreLe < 400) return; await faite.annuler(); setMessage(null); };
    if (res.promesse) {
      const p = res.promesse;
      montrer({
        /* l'alerte f6-b se pose sous la vente promise si elle n'y cache aucun nom, sinon en bas (CRITIQUE-12 n° 1) */
        role: 'alert', texte: textePromesse(p, ctxClients.current), annuler, ancre: `argent-${p.planId}`,
        livrer: { texte: `Livrer le ${jourLisible(p.livrerLe)}`, agir: () => { void ecrire(livrer(p, ctxRef.current), false, `argent-${p.planId}`); } },
        ...(res.effet ? { detail: `Caisse : ${res.effet.texte}` } : {})
      });
    } else montrer({ role: 'status', texte: res.message.texte, annuler, ...(ancre ? { ancre } : {}), ...(res.message.lien ? { lien: lienDe(res.message.lien) } : {}), ...(ouvreSonDetail ? { ouvreSonDetail: true } : {}), ...(aussi ? { aussi } : {}) });
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, montrer, lienDe]);

  /* ---------- les gestes de la frise ---------- */
  /* D385 : sur un axe qui porte des jours (vue Jour, semaine dépliée), le glisser vise un jour ; en Semaine, il reste à la semaine (domaine inchangé) */
  const cibleJour = (chose: ChoseCalendrier, k: number) => {
    const cols = colonnesRef.current;
    if (!aDesJours(cols)) return null;
    const pos = positionDans(cols, chose);
    if (!pos) return null;
    const ancre = chose.debut > cols[0].debut ? chose.debut : cols[0].debut;
    return cibleDuGlisse(cols, pos.a, k, ancre);
  };
  /* PC-145 : l'aperçu montre la courbe que le geste écrira (`courbeDuGlisse` = la résolution du geste), jamais un décalage en bloc */
  const apercuDe = (chose: ChoseCalendrier, ecart: number, auJour: boolean, lache: string, k: number) => {
    if (k === 0) return null;
    const courbe = courbeDuGlisse(chose, ecart, ctxRef.current, auJour);
    return courbe ? { courbe, lache } : null;
  };
  const surGlisse = useCallback((chose: ChoseCalendrier, k: number) => {
    setDrag({ id: chose.id, mode: 'glisse', k, jours: 0 });
    /* paquet E n° 3 : sur un axe en mois (Mois, An), une colonne est un mois ; le glisser va de `k` mois, au même jour du mois si possible */
    if (enMois(colonnesRef.current)) {
      const cible = ajouterMois(chose.debut, k);
      const jours = ecartJours(chose.debut, cible);
      setIci(k === 0 ? null : `${jourLisible(cible)} · lâcher ici`);
      setApercu(apercuDe(chose, jours, true, cible, k));
      setMessage(null); setMenu(null); setSelectionId(null);
      return;
    }
    const auJour = aDesJours(colonnesRef.current);
    const r = auJour ? cibleJour(chose, k) : null;
    if (auJour) {
      setIci(k === 0 || !r || r.jours === 0 ? null : `${jourLisible(r.cible)} · lâcher ici`);
      setApercu(r ? apercuDe(chose, r.jours, true, r.cible, k) : null);
      setMessage(null); setMenu(null); setSelectionId(null);
      return;
    }
    /* paquet D n° 2 (D385) : en Semaine, un jalon d'un jour se glisse à la semaine (`k` compte des colonnes) et garde son jour de la semaine */
    if (estPonctuel(chose)) {
      const jour = ajouterJours(chose.debut, k * 7);
      setIci(k === 0 ? null : `${etiquetteS(jour)} · ${jourLisible(jour)} · lâcher ici`);
      setApercu(apercuDe(chose, k * 7, true, jour, k));
      setMessage(null); setMenu(null); setSelectionId(null);
      return;
    }
    /* CAL-PASSE voie S, R2-4 : la bulle dit le jour que le geste écrira (le jour de la semaine de la barre est gardé), pas le lundi de la colonne visée */
    const cible = jourDuGlisse(chose, k, ctxRef.current);
    setIci(k === 0 ? null : `${etiquetteS(cible)} · ${jourLisible(cible)} · lâcher ici`);
    setApercu(apercuDe(chose, k, false, cible, k));
    /* un glisser commencé ferme le menu ouvert et le détail (CRITIQUE-2 n° 1 a) */
    setMessage(null); setMenu(null); setSelectionId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modele.courbe]);
  const finGeste = useCallback(() => { setDrag(null); setIci(null); setApercu(null); setDuree(null); }, []);
  /*
   * Paquet E n° 4 (PC-NOTE-11, décision du pilote) : une fête ou une activité glissée n'emmène pas seuls ses achats et ventes d'un jour liés (une
   * date réelle d'achat ne bouge pas toute seule). Le message le dit (« 1 achat lié reste au 4 déc. ») et offre « Le déplacer aussi », qui les
   * déplace du même écart, en une écriture (un seul Annuler).
   */
  const suiviDesLies = (chose: ChoseCalendrier, jours: number): MessageCal['aussi'] | undefined => {
    if (chose.source.genre !== 'creative' || jours === 0) return undefined;
    const lies = modeleRef.current.choses.filter(x => estPonctuel(x) && barreLiee(x) === chose.id);
    if (!lies.length) return undefined;
    const n = lies.length;
    const genres = new Set(lies.map(x => x.rangee));
    const [nom, feminin] = genres.size === 1 && genres.has('achats') ? ['achat', false] : genres.size === 1 && genres.has('ventes') ? ['vente', true] : ['chose', true];
    const lie = `${nom}${n > 1 ? 's' : ''} lié${feminin ? 'e' : ''}${n > 1 ? 's' : ''}`;
    const memeJour = lies.every(x => x.debut === lies[0].debut);
    const texte = `${n} ${lie} ${n > 1 ? 'restent' : 'reste'} ${memeJour ? `au ${jourLisible(lies[0].debut)}` : 'à leur date'}`;
    return {
      texte: sansPointDouble(texte), bouton: n > 1 ? 'Les déplacer aussi' : 'Le déplacer aussi',
      agir: () => {
        const res = lies.map(x => deplacerJours(x, jours, ctxRef.current));
        const refus = res.find(r => r.ok === false);
        if (refus) { void ecrire(refus, false, lies[0].id); return; }
        const oks = res as Array<Extract<Resolution, { ok: true }>>;
        void ecrire({ ...oks[0], ecritures: oks.flatMap(r => r.ecritures) }, false, lies[0].id);
      }
    };
  };
  const surLacheGlisse = useCallback((chose: ChoseCalendrier, k: number, annule: boolean) => {
    finGeste();
    if (annule || k === 0) return;
    const glisserDe = (jours: number) => { if (jours !== 0) void ecrire(deplacerJours(chose, jours, ctxRef.current), false, chose.id, false, suiviDesLies(chose, jours)); };
    if (enMois(colonnesRef.current)) { glisserDe(ecartJours(chose.debut, ajouterMois(chose.debut, k))); return; }
    if (aDesJours(colonnesRef.current)) {
      const r = cibleJour(chose, k);
      if (r) glisserDe(r.jours);
      return;
    }
    if (estPonctuel(chose)) { glisserDe(k * 7); return; }
    void ecrire(deplacer(chose, k, ctxRef.current), false, chose.id, false, suiviDesLies(chose, k * 7));
  }, [ecrire, finGeste]);
  const surBord = useCallback((chose: ChoseCalendrier, jours: number) => {
    setDrag({ id: chose.id, mode: 'bord', k: 0, jours });
    setDuree({ id: chose.id, texte: dureeAllongee(chose, jours, aujourdhui) });
    setMessage(null); setMenu(null);
  }, [aujourdhui]);
  const surLacheBord = useCallback((chose: ChoseCalendrier, jours: number, annule: boolean) => {
    finGeste();
    if (annule || jours === 0) return;
    void ecrire(allonger(chose, jours, ctxRef.current), false, chose.id);
  }, [ecrire, finGeste]);
  const surToucher = useCallback((chose: ChoseCalendrier, _cible: HTMLElement) => {
    setMenu(null);
    /* E47, CRITIQUE-2 n° 38 : toucher une proposition l'accepte */
    if (chose.proposition === 'echeance') { onOpenFinances(); return; }
    if (chose.proposition === 'brassin-habituel') {
      const b = brouillonDepuisProposition(chose);
      if (b) { setMessage(null); setFeuille({ mode: 'ajouter', initial: b, sansPlusDeDetails: true, cle: ++compteur.current }); }
      return;
    }
    if (chose.proposition === 'vente' && chose.source.genre === 'plan') { setSelectionId(null); void ecrire(accepterVente(chose, ctxRef.current), false, chose.id); return; }
    /* E37, CRITIQUE-2 n° 39 : toucher ouvre la source. Une facture : sa pièce, où « Payé » se joue ; la TVA et la clôture : leur écran */
    if (chose.source.genre === 'facture' && onOpenPiece) { setSelectionId(null); onOpenPiece(chose.source.id); return; }
    if (chose.source.genre === 'plan' && chose.source.origine === 'tax') { setSelectionId(null); onOpenFinances(); return; }
    setMessage(null);
    setSelectionId(id => (id === chose.id ? null : chose.id));
  }, [onOpenFinances, onOpenPiece, ecrire]);
  const surAppuiLong = useCallback((chose: ChoseCalendrier, cible: HTMLElement) => {
    setMessage(null); setSelectionId(null);
    setMenu({ id: chose.id, ancre: cible });
  }, []);
  /* D-199, E27, CRITIQUE-3 n° 5 : l'appui long sur une marque (3 mois, 6 mois, An) ouvre 6 semaines centrées sur sa semaine (deux avant, trois
     après), la chose choisie et prête au glisser f1-a. C'est la période de l'app qui change (onPeriode), pas un affichage local : sinon la
     période de 3 mois remettrait aussitôt la fenêtre à 13 semaines. */
  const surSixSemaines = useCallback((chose: ChoseCalendrier) => {
    const debut = lundiDe(ajouterJours(chose.debut, -14));
    const fen: FenetreSemaines = { du: debut < premierLundi ? premierLundi : debut, semaines: 6 };
    setMessage(null); setMenu(null);
    setVueEtat('semaines'); setAncreListe(undefined);
    setFenetre(fen);
    onPeriode(periodeDeFenetre(fen));
    setSelectionId(chose.id);
  }, [premierLundi, onPeriode]);
  const surRefus = useCallback((chose: ChoseCalendrier, raison: string, jalon?: unknown) => { refuser(raison, chose, !!jalon); }, [refuser]);
  /*
   * D385 : changer d'échelle règle la période de l'app (comme le menu) : Jour = 2 semaines, Semaine = 6, Mois = 6 mois (maquette D, ses crans).
   * `focus` (le jour sous les doigts du pincer) reste en vue : Jour part de sa semaine ; Semaine, venue des mois, le pose en troisième semaine.
   */
  const changerEchelle = useCallback((e: Echelle, focus?: string) => {
    const lundis = modele.semaines.map(s => s.debut);
    const total = lundis.length || SEMAINES_ANNEE;
    const n = Math.min(PERIODE_DE_L_ECHELLE[e], total);
    const voulu = e === 'jour' ? lundiDe(focus ?? fenetre.du) : e === 'semaine' && focus && echelleRef.current === 'mois' ? lundiDe(ajouterJours(focus, -14)) : fenetre.du;
    const depart = voulu < premierLundi ? premierLundi : voulu;
    const i0 = Math.max(0, lundis.findIndex(l => l >= depart));
    const i = Math.min(i0, Math.max(0, total - n));
    const fen: FenetreSemaines = { du: lundis[i] ?? depart, semaines: n };
    setMessage(null); setMenu(null); setAncreListe(undefined);
    setEchelleVoulue(e); setDeplie(null);
    setVueEtat('semaines'); setFenetre(fen); onPeriode(periodeDeFenetre(fen));
    /* PC-144 (paquet F n° 2) : l'échelle règle la période de toute l'app (D385, ses crans) ; quand elle la change, le message le dit, avec
       Finances qui suit, et Annuler remet l'échelle et la période d'avant */
    const avant = { fenetre, annee: vue === 'annee', echelle: echelleVoulue, periode: periodeLocale };
    if (avant.annee || avant.fenetre.semaines !== fen.semaines) {
      const nom = ECHELLES.find(x => x.id === e)?.nom ?? e;
      montrer({
        role: 'status', texte: `Échelle ${nom} : période ${libelleDuree(avant.fenetre.semaines, avant.annee)} → ${libelleDuree(fen.semaines, false)}, Finances aussi`,
        annuler: () => {
          setMessage(null); setEchelleVoulue(avant.echelle); setDeplie(null);
          setVueEtat(avant.annee ? 'annee' : 'semaines'); setFenetre(avant.fenetre);
          /* rejeu en ligne (20.11) : Finances retrouve sa période d'avant (« Tout l'historique » compris), pas la fenêtre du calendrier */
          onPeriode(avant.periode ?? periodeDeFenetre(avant.fenetre));
        }
      });
    }
  }, [modele.semaines, fenetre, vue, echelleVoulue, periodeLocale, premierLundi, onPeriode, montrer]);
  /* D385 (variante B) : écarter les doigts ouvre l'échelle plus fine, les pincer la plus large ; un cran par geste, autour du jour visé */
  const surPincer = useCallback((sens: SensPincement, x: number) => {
    const suivante = echelleApres(echelleRef.current, sens);
    if (!suivante) return;
    const cols = colonnesRef.current;
    const r = racine.current?.querySelector('[data-frise]')?.getBoundingClientRect();
    const i = r && r.width > 0 && cols.length ? Math.max(0, Math.min(cols.length - 1, Math.floor((x - r.left) / (r.width / cols.length)))) : 0;
    changerEchelle(suivante, cols[i]?.debut);
  }, [changerEchelle]);
  /* D385 (variante C) : toucher une semaine de la bande la déplie en sept jours ; la toucher dépliée la replie */
  const surDeplier = useCallback((lundi: string | null) => { setMessage(null); setMenu(null); setDeplie(d => (lundi === null || d === lundi ? null : lundi)); }, []);
  const deplier = !annee && echelle === 'semaine' && peutDeplier(mesure.largeur || 360, fenetre.semaines);
  /* CRITIQUE-10 n° 2 (E34, E45, D-200, « J'ajoute et je vois rien ») : une chose posée hors de la fenêtre se montre par « Voir S20 › ». Le
     toucher règle LA période de l'app (même chemin que le menu période, ET-PER) sur la plus petite durée du menu (6 sem., 3 mois, 6 mois, An)
     qui contient la chose entière, une semaine avant son début. Nouveau, à valider. */
  const voirEtendue = useCallback((du: string, au: string) => {
    const total = modele.semaines.length || SEMAINES_ANNEE;
    const lundis = modele.semaines.map(s => s.debut);
    const voulu = lundiDe(ajouterJours(du, -7));
    const depart = voulu < premierLundi ? premierLundi : voulu;
    const besoin = Math.round((Date.parse(`${lundiDe(au)}T00:00:00Z`) - Date.parse(`${depart}T00:00:00Z`)) / (7 * 86400000)) + 1;
    const n = DUREES_MENU.find(d => d >= besoin) ?? SEMAINES_ANNEE;
    setMessage(null); setMenu(null); setSelectionId(null); setAncreListe(undefined);
    if (n >= SEMAINES_ANNEE || n >= total) {
      const iAn = Math.min(Math.max(0, lundis.findIndex(l => l >= depart)), Math.max(0, total - SEMAINES_ANNEE));
      const fen: FenetreSemaines = { du: lundis[iAn] ?? premierLundi, semaines: Math.min(SEMAINES_ANNEE, total) };
      setVueEtat('annee'); setFenetre(fen); onPeriode(periodeDeFenetre(fen));
      return;
    }
    const i0 = Math.max(0, lundis.findIndex(l => l >= depart));
    const i = Math.min(i0, Math.max(0, total - n));
    const fen: FenetreSemaines = { du: lundis[i] ?? depart, semaines: n };
    setVueEtat('semaines'); setFenetre(fen); onPeriode(periodeDeFenetre(fen));
  }, [modele.semaines, premierLundi, onPeriode]);

  /* ---------- masquer, épingler, étoiler, filtrer, trier (E22, E31, E39) ---------- */
  const basculerMasque = useCallback((r: IdRangee) => setMasquees(masquees.includes(r) ? masquees.filter(x => x !== r) : [...masquees, r]), [masquees, setMasquees]);
  const basculer = (liste: string[], id: string) => (liste.includes(id) ? liste.filter(x => x !== id) : [...liste, id]);
  const chosesMenu = choseDe(menu?.id);

  /* ---------- la feuille d'ajout : le + de chaque rangée, le + volant, une proposition, Modifier, Poser ---------- */
  const ouvrirFeuille = useCallback((r: IdRangee) => {
    setMessage(null); setSelectionId(null); setMenu(null);
    setFeuille({ mode: 'ajouter', initial: brouillonVide(r, fenetre.du < lundiAuj ? lundiAuj : fenetre.du), cle: ++compteur.current });
  }, [fenetre.du, lundiAuj]);
  const ouvrirIdee = useCallback((lundi?: string) => { setMessage(null); setMenu(null); setIdee(lundi ?? lundiAuj); }, [lundiAuj]);

  /**
   * R48 (L4-2) : un toucher sur l'icône d'idée d'une semaine (± affiché) ouvre son carnet (`CibleOuverture` `carnets`, Stocks › Matériel ›
   * Carnets, ce carnet ouvert). L'icône vit dans le bouton de la semaine (BandeSemaines), dont le toucher donne la date : ce toucher-là est
   * pris avant lui, à la capture, et l'infobulle ne s'ouvre pas. Cible de 44 px : le carré de 44 px centré sur l'ampoule de 14 px, ou
   * l'ampoule elle-même. Le reste de la semaine garde son toucher (date) et son appui long (Noter une idée, L1 b) : rien d'autre ne change.
   * Plusieurs idées la même semaine : la première (ordre de `iconesIdees`).
   */
  const toucherIconeIdee = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const cible = e.target as Element | null;
    const semaine = cible?.closest?.('[data-bande-semaines] [data-semaine]');
    const ampoule = semaine?.querySelector('.ent-ic svg.lucide-lightbulb');
    if (!semaine || !ampoule) return;
    const r = ampoule.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dedans = ampoule.contains(cible) || (Math.abs(e.clientX - cx) <= 22 && Math.abs(e.clientY - cy) <= 22);
    if (!dedans) return;
    const etiquette = semaine.getAttribute('aria-label') ?? '';
    const icone = modele.icones.find(i => i.genre === 'idee' && i.ouvre && etiquette.startsWith(dateDeSemaine(i.lundi)));
    if (!icone?.ouvre) return;
    e.preventDefault(); e.stopPropagation();
    setMessage(null); setMenu(null);
    ouvrir(icone.ouvre);
  }, [modele.icones, ouvrir]);

  /* passe 10 : une ligne par rangée, de la couleur et du picto de la rangée ; Poser un brassin en plein, avec sa semaine et « prête le … » (le + lui-même ne porte aucun « S47 », D-206) */
  const COULEUR_RANGEE: Record<IdRangee, string> = {
    brassins: 'rgb(var(--area-production))', fetes: 'rgb(var(--area-agenda))', ventes: 'rgb(var(--hop))', achats: 'rgb(var(--area-finances))',
    travaux: 'rgb(var(--attention))', activites: 'rgb(var(--water))', papiers: 'rgb(var(--cave-400))'
  };
  const ligne = (id: string, label: string, r: IdRangee, extra: { hint?: string; plein?: boolean } = {}) => ({
    id, label, genre: 'ajouter' as const, couleur: COULEUR_RANGEE[r], icone: ICONE_PLUS[r], lancer: () => ouvrirFeuille(r), ...extra
  });
  /* passe 10 (p-clair-ouvert) : « S47 · prête le … », la semaine où la feuille s'ouvre et 28 j en cuve (demande de L3, CRITIQUE-2 n° 12).
     CRITIQUE-7 n° 4 : « prête le » se compte depuis le jour où le brassin sera posé (`jourPose` : aujourd'hui dans la semaine en cours, jamais un
     lundi passé), comme la feuille et l'écriture : le 18 nov., « S47 · prête le 16 déc. », plus « 14 déc. ». */
  const lundiPose = fenetre.du < lundiAuj ? lundiAuj : fenetre.du;
  usePlusPage({
    titre: 'le calendrier',
    surOnglets: true,
    actions: [
      ligne('brassin', 'Poser un brassin', 'brassins', { plein: true, hint: `${etiquetteS(lundiPose)} · prête le ${jourLisible(ajouterJours(jourPose(lundiPose, aujourdhui), 28))}` }),
      ligne('fete', 'Poser une fête', 'fetes'),
      ligne('vente', 'Poser une vente', 'ventes'),
      ligne('achat', 'Prévoir un achat', 'achats'),
      ligne('travaux', 'Prévoir des travaux', 'travaux'),
      ligne('activite', 'Noter une activité', 'activites'),
      ligne('papier', 'Prévoir un papier', 'papiers'),
      { id: 'idee', label: 'Noter une idée', genre: 'ajouter', hint: `en ${etiquetteS(lundiPose)}, dans le carnet`, precisionEnCase: true, lancer: () => ouvrirIdee(lundiPose) }
    ]
  });

  const ajouterDepuisFeuille = useCallback(async (b: BrouillonAjout): Promise<ResultatAjout> => {
    const etat = feuille;
    if (etat?.mode === 'modifier' && etat.chose) {
      const m = versModification(b, etat.chose, ctxAjout.aujourdhui);
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
      effet = effetCaisse(modele.courbe, courbeAvec(modele.courbe, [{ id: p.id, jour: p.date, centimes: signe * p.amountCents, nom: p.title, choseId: `argent-${p.id}` }]));
    }
    /* CRITIQUE-7 (A6) : « 3 fûts La Cigogne · S47 · S47 : 3 268 → 4 168 » disait deux fois la semaine. Avec un effet, la semaine du résumé
       part (l'effet la dit déjà) : « 3 fûts La Cigogne · S47 : 3 268 → 4 168 » ; « vente confirmée » reste. */
    const ok = await ecrire({
      ok: true, ecritures: [ecriture], effet, promesse: null, courbeApres: null,
      message: { texte: effet ? `${resumeSansSemaine(conv.resume, effet.texte)} · ${effet.texte}` : conv.resume, action: 'Annuler', lecture: '' }
    });
    if (ok) {
      setFeuille(null);
      /* un ajout dans une rangée masquée ou filtrée la réaffiche, et le message le dit : « J'ajoute et je vois rien » (D-200, CRITIQUE-2 n° 15) */
      const etaitMasquee = masquees.includes(b.rangee);
      const etaitFiltree = !!filtre && filtre !== b.rangee;
      if (etaitMasquee) setMasquees(masquees.filter(r => r !== b.rangee));
      if (etaitFiltree) setFiltre(null);
      if (etaitMasquee || etaitFiltree) setMessage(m => (m ? { ...m, texte: sansPointDouble(`${m.texte} · rangée ${nomRangee(b.rangee)} réaffichée`) } : m));
      /* CRITIQUE-10 n° 2 : posée hors de la fenêtre affichée (S20 → S40 quand on regarde S47 à S52), la chose ne se voit pas. Le message
         porte « Voir S20 › », de la forme de « Sans date › » : son toucher règle la période sur la chose entière. */
      const etendue = etendueDuBrouillon(b);
      const premiere = colonnes[0]?.debut, derniere = colonnes[colonnes.length - 1]?.fin;
      if (etendue && premiere && derniere && (etendue.au < premiere || etendue.du > derniere)) {
        const lien = { texte: `Voir ${etiquetteS(etendue.du)} ›`, agir: () => voirEtendue(etendue.du, etendue.au) };
        setMessage(m => (m && !m.lien ? { ...m, lien } : m));
      }
    }
    return ok ? { ok: true } : { ok: false, raison: 'Écriture impossible. Rien n’a changé.' };
  }, [feuille, ctxAjout, modele.courbe, ecrire, masquees, setMasquees, filtre, colonnes, voirEtendue]);

  const plusDeDetails = useCallback((b: BrouillonAjout) => {
    const lundi = b.debut ?? lundiAuj;
    setFeuille(null);
    /* lot A du test en ligne (18.11, n° 3) : ce qui est déjà tapé passe à la feuille complète, jamais perdu. Brassin : la recette choisie ;
       fête : le nom et le montant ; achat, travail, papier : le nom et le montant dans « Prévoir une dépense ». Rien de tapé : l'appel d'avant. */
    const titre = b.titre.trim();
    const saisie: SaisieRapide = { ...(titre ? { titre } : {}), ...(b.centimes ? { centimes: b.centimes, direction: b.signe === '+' ? 'in' as const : 'out' as const } : {}) };
    const tape = !!(saisie.titre || saisie.centimes);
    if (b.rangee === 'brassins') { if (b.recetteId) onPoserBrassin(b.recetteId); else onPoserBrassin(); }
    else if (b.rangee === 'fetes') { if (tape) onPoserFete(lundi, saisie); else onPoserFete(lundi); }
    else if (tape) onPoserDepense(lundi, b.rangee, CATEGORIE_DE_RANGEE[b.rangee], saisie);
    else onPoserDepense(lundi, b.rangee, CATEGORIE_DE_RANGEE[b.rangee]);
  }, [lundiAuj, onPoserBrassin, onPoserFete, onPoserDepense]);

  const idee_modifier = useCallback(async (titre: string, lundi: string): Promise<string | null> => {
    if (!ideeModif) return null;
    const r = modifierIdee(ideeModif.id, titre, lundi, ideeModif.jour);
    if (r.ok === false) return r.raison;
    const ok = await ecrire(r);
    if (ok) setIdeeModif(null);
    return ok ? null : 'Écriture impossible. Rien n’a changé.';
  }, [ecrire, ideeModif]);

  const idee_ecrire = useCallback(async (titre: string, lundi: string): Promise<string | null> => {
    const r = noterIdee(titre, lundi, {});
    if (r.ok === false) return r.raison;
    const ok = await ecrire(r);
    if (ok) setIdee(null);
    return ok ? null : 'Écriture impossible. Rien n’a changé.';
  }, [ecrire]);

  /* ---------- le détail d'une chose (f4-b) ---------- */
  /** À quoi une chose peut se lier (appui long et fiche) : brassins, clients, et D386 les fêtes et activités qui durent (une barre sur la
      frise), pour lier un jalon d'un jour (la tireuse) à la foire. */
  const liensDe = (c: ChoseCalendrier): LiensPossibles => ({
    brassins: don.batches.filter(b => !b.archivedAt).map(b => ({ id: b.id, nom: b.name || b.id })),
    clients: don.clients.filter(cl => !cl.archivedAt).map(cl => ({ id: cl.id, nom: cl.name })),
    evenements: modele.choses.filter(x => x.source.genre === 'creative' && !x.sansDate && !estPonctuel(x) && x.id !== c.id).map(x => ({ id: (x.source as { id: string }).id, nom: x.titre }))
  });
  /** Les fêtes et activités qui durent, pour le groupe « Fêtes et activités » de Modifier (D386). */
  const evenementsLiables = useMemo(() => modele.choses.filter(x => x.source.genre === 'creative' && !x.sansDate && !estPonctuel(x)).map(x => ({ id: (x.source as { id: string }).id, nom: x.titre })), [modele.choses]);

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
          onCommander: () => { const id = (chose.source as { id: string }).id; setSelectionId(null); onOpenCourses(id); },
          ...(onOuvrirBudget ? { onBudget: () => { const id = (chose.source as { id: string }).id; setSelectionId(null); onOuvrirBudget(id); } } : {})
        } : {})}
        {...(editable && !sansDate ? { onModifier: () => { setSelectionId(null); setFeuille({ mode: 'modifier', initial: brouillonDepuisChose(chose), chose, cle: ++compteur.current }); } } : {})}
        {...(editable && !sansDate ? { onRetirer: () => { void ecrire(retirer(chose, ctxRef.current)); } } : {})}
        {...(creative && chose.source.genre === 'creative' && chose.source.type !== 'recipe-idea' && (chose.rangee === 'activites' || sansDate) ? { onFait: () => { void ecrire(fait(chose)); } } : {})}
        {...(chose.rangee === 'ventes' && chose.source.genre === 'plan' && !chose.probable ? { onFacturer: () => { setSelectionId(null); onOpenFinances(); } } : {})}
        {...(/* paquet F n° 1 (PC-142) : toute chose de la poche se supprime, sans dialogue ; le message garde Annuler (7 s) */ sansDate && creative ? { onSupprimer: () => { setSelectionId(null); void ecrire(supprimerSansDate(chose)); } } : {})}
        {...(sansDate ? { onPoser: () => { setSelectionId(null); setFeuille({ mode: 'modifier', initial: { ...brouillonDepuisChose(chose), debut: lundiAuj, debutChoisi: true }, chose, cle: ++compteur.current }); } } : {})}
        {...(chose.probable && chose.source.genre === 'plan' && !chose.proposition ? { onAccepter: () => { void ecrire(accepterVente(chose, ctxRef.current)); } } : {})}
        {...(editable ? { onMettreDeCote: (actif: boolean) => { void ecrire(mettreDeCote(chose, actif, ctxRef.current)); } } : {})}
        {...(!chose.proposition && !sansDate ? {
          /* lot A du test en ligne (18.11, n° 2, D386) : « Lier » dans la fiche, les mêmes puces que l'appui long ; la fiche reste ouverte et
             montre aussitôt « lié à … » */
          liens: liensDe(chose),
          onLier: (l: { batchId?: string; clientId?: string; evenementId?: string }, nom: string) => {
            void ecrire(lier(chose, l, ctxGestes, nom), true, chose.id, true).then(ok => { if (ok) { ouvertureParGeste.current = Date.now() + 1200; setSelectionId(chose.id); } });
          },
          /* lot C (test en ligne, n° 5) : délier depuis la fiche, avec Annuler ; la fiche reste ouverte */
          onDelier: (nom: string) => {
            void ecrire(delier(chose, ctxGestes, nom), true, chose.id, true).then(ok => { if (ok) { ouvertureParGeste.current = Date.now() + 1200; setSelectionId(chose.id); } });
          }
        } : {})}
      />
    );
  };

  /* ---------- l'en-tête (lot B) : tout vient du modèle ---------- */

  const surVue = useCallback((v: VueCalendrier, ancre?: 'sans-date') => { setMessage(null); setVueEtat(v); setAncreListe(v === 'liste' ? ancre : undefined); setSelectionId(null); setMenu(null); }, []);

  /* ---------- le tri des rangées (k15 du jouable) et le filtre par type (menu période, E07, E39) ----------
     « Trier les rangées » : chaque toucher passe au critère suivant (genre → Urgent → Date → Montant → genre), les rangées se rangent, et le
     critère s'affiche un court instant à droite sous l'en-tête (3,5 s), où un toucher le choisit directement. L'ordre obtenu est gardé
     (`calendrier_ordre`) : il revient à la réouverture. */
  const [critere, setCritere] = useState<CritereTri | null>(null);
  const [segTri, setSegTri] = useState(false);
  const minuterieTri = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (minuterieTri.current) clearTimeout(minuterieTri.current); }, []);
  const choisirTri = (c: CritereTri | null) => {
    setCritere(c);
    const fin = colonnes.length ? colonnes[colonnes.length - 1].fin : ajouterJours(fenetre.du, fenetre.semaines * 7 - 1);
    setOrdre(ordreSelon(c, choses, modele.retards, colonnes[0]?.debut ?? fenetre.du, fin));
    setSegTri(true);
    if (minuterieTri.current) clearTimeout(minuterieTri.current);
    minuterieTri.current = setTimeout(() => setSegTri(false), 3500);
  };
  const trierSuivant = () => {
    setMessage(null); setPanneau(null);
    const i = critere ? CRITERES_TRI.indexOf(critere) : -1;
    choisirTri(i < CRITERES_TRI.length - 1 ? CRITERES_TRI[i + 1] : null);
  };
  /* « Achats seuls · 6 rangées masquées · Tout afficher » : les autres rangées sont masquées, sauf leurs choses épinglées (D-5, D-34) */
  const rangeesSousFiltre = filtre ? ordre.filter(r => r !== filtre).length : 0;

  const largeurColonne = mesure.largeurColonne;
  /* D385 : la courbe et la bande des semaines restent en semaines ; quand l'axe porte des jours ou des mois, leur pas est la largeur / semaines */
  const largeurSemaine = !annee && (echelle !== 'semaine' || deplieVu) && mesure.largeur > 0 ? mesure.largeur / Math.max(1, fenetre.semaines) : largeurColonne;
  /* au téléphone, aucun nom ni montant ne passe sous le + volant : sa zone, à droite, est réservée (D-135, passe10/p-clair-ferme) */
  const reserveDroite = paysage || (mesure.largeur > 0 && mesure.largeur < 700) ? 76 : 0;
  /*
   * CAL-PASSE N1 n° 1 (20.11, « impossible de modifier dans le passé ») : le défilement automatique au bord. Une barre tenue au bord gauche de la
   * frise, sans que la fenêtre la montre plus tôt, recule : la fenêtre se décale d'une colonne à chaque pas (le même geste que l'en-tête : la
   * période de l'app la suit) et le geste vise toute la semaine sous le doigt, même hors de la fenêtre (`marge`, en semaines). Seulement sur l'axe
   * en semaines : un axe en jours ou en mois garde ses bornes.
   */
  const defilable = !annee && echelle === 'semaine' && !deplieVu && modele.semaines.length > 0;
  const derniereSemaine = modele.semaines[modele.semaines.length - 1]?.debut ?? premierLundi;
  const finFenetre = ajouterJours(fenetre.du, (fenetre.semaines - 1) * 7);
  const marge: [number, number] = defilable ? [Math.max(0, ecartJours(premierLundi, fenetre.du) / 7), Math.max(0, ecartJours(finFenetre, derniereSemaine) / 7)] : [0, 0];
  const fenetreRef = useRef(fenetre);
  fenetreRef.current = fenetre;
  const defilerFenetre = useCallback((sens: -1 | 1): boolean => {
    const f = fenetreRef.current;
    const du = ajouterJours(f.du, sens * 7);
    if (du < premierLundi || ajouterJours(du, (f.semaines - 1) * 7) > derniereSemaine) return false;
    const fen: FenetreSemaines = { du, semaines: f.semaines };
    fenetreRef.current = fen;
    /* B8 (WFP-4, 21.11) : « Nov. » devenu « 16 nov. → 27 déc. » après un glisser, et resté au rechargement. Le défilement au bord est celui du
       geste : la fenêtre suit la barre (elle reste où le doigt l'a lâchée), la période de l'app et de Finances ne bouge que par le brasseur. */
    setFenetre(fen);
    return true;
  }, [premierLundi, derniereSemaine]);
  /* E32 : « Livraison La Cigogne · S1 › » mène à la vente hors de la vue */
  const surRenvoi = (c: ChoseCalendrier) => {
    const n = Math.max(2, fenetre.semaines);
    const du = lundiDe(ajouterJours(c.debut, -7 * (n - 2)));
    setVueEtat('semaines'); setMenu(null); setMessage(null);
    setFenetre({ du: du < premierLundi ? premierLundi : du, semaines: fenetre.semaines });
    setSelectionId(c.id);
  };
  const liste = vue === 'liste';
  const graph = vue === 'graph';
  /* CRITIQUE-13 n° 1 (règle n° 1, `as/cap/p-f6b-apres`) : l'alerte f6-b (et f2-a) se pose dans la rangée de la vente promise, sous elle, dans le
     flux ; elle pousse la suite et ne cache rien. Vente hors de la vue, rangée masquée ou vue Liste : le message reste à sa place commune. */
  const rangeeAlerte: IdRangee | null = (() => {
    /* PC-109, PC-96, PC-85 (CRITIQUE-13 n° 3, E33) : un message sans place qui laisse les noms libres passe lui aussi dans le flux, sous sa chose */
    if (!message || (message.role !== 'alert' && fluxForce !== message.id) || !message.ancre || liste || graph) return null;
    const a = message.ancre;
    const c = choses.find(x => x.id === a) ?? choses.find(x => x.id.startsWith(a));
    /* hors de la vue (Livrer au 5 janv., hors des 6 semaines) : au pied de sa rangée, jamais sur un nom */
    if (!c || (!positionDans(colonnes, c) && fluxForce !== message.id) || masquees.includes(c.rangee) || (filtre && filtre !== c.rangee)) return null;
    return c.rangee;
  })();
  /* sans chose dans la frise (l'échelle qui change la période, une fête rangée sans date) : en tête de la frise */
  const messageEnTete = !!message && fluxForce === message.id && rangeeAlerte === null && !liste && !graph;
  const noeudMessage = (
    <Message message={message} onFermer={fermerMessage} detailOuvert={selectionId} dansLaFrise={rangeeAlerte !== null || messageEnTete} onDefileSeul={absorberDefilement}
      onSansPlace={() => { if (message && fluxForce !== message.id) setFluxForce(message.id); }} />
  );

  return (
    /* Tour 2 n° 1 (paysage 844 × 340) : couché, 4 px entre l'en-tête et la frise, rien au-dessus ; chaque pixel va aux rangées. */
    <div ref={racine} className={`cal-tab text-sm${paysage ? ' cal-tab-paysage cal-pile-serre' : ' cal-pile pt-1'}`} data-calendrier data-vue={vue} data-orientation={orientation}>
      <h1 className="sr-only">Calendrier</h1>

      {/* Paquet G n° 7 (CAL-ENTETE-CACHE) : collée SOUS l'en-tête de l'app (sa hauteur publiée par Header), jamais dessous. */}
      <div className={`cal-entete-zone sticky z-30 bg-cave-950${paysage ? ' !mt-0' : ''}`} style={{ top: 'var(--main-header-height, 0px)' }} data-entete-zone onClickCapture={toucherIconeIdee}>
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
          largeurColonne={largeurSemaine}
          echelle={echelle}
          onEchelle={changerEchelle}
          colonnes={colonnes}
          deplie={deplieVu}
          aujourdhui={aujourdhui}
          {...(deplier ? { onDeplier: surDeplier } : {})}
          onOuvrirFinances={onOpenFinances}
          onOuvrirRetard={r => ouvrir(r.ouvre)}
          onIdeeSemaine={ouvrirIdee}
          onTrier={trierSuivant}
          onFiltrer={() => { setMessage(null); setPanneau('filtre'); }}
          onMessage={surMessageEnTete}
          etoiles={etoiles}
          aligne={courbeAlignee}
          onAligne={setCourbeAlignee}
          courbeCachee={courbeCachee}
          onCourbeCachee={setCourbeCachee}
        />
      </div>

      {segTri && (
        <div className="cal-tri-seg" role="group" aria-label="Trier les rangées" data-tri-seg data-critere={critere ?? 'genre'}>
          {!critere && <small>par genre</small>}
          {CRITERES_TRI.map(c => (
            <button key={c} type="button" aria-pressed={critere === c} onClick={() => choisirTri(critere === c ? null : c)}>{NOM_CRITERE[c]}</button>
          ))}
        </div>
      )}

      {filtre && (
        <p className="cal-filtre" data-filtre>
          <b>{nomSeules(filtre)}</b>
          {rangeesSousFiltre > 0 && <span> · {rangeesSousFiltre} rangée{rangeesSousFiltre > 1 ? 's' : ''} masquée{rangeesSousFiltre > 1 ? 's' : ''} · </span>}
          <button type="button" className="cal-b" onClick={() => { setMessage(null); setFiltre(null); }}>Tout afficher</button>
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
          seulement={section ? RANGEES_SECTION[section] : undefined}
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
          alerte={rangeeAlerte ? { rangee: rangeeAlerte, noeud: noeudMessage } : null}
          tete={messageEnTete ? noeudMessage : undefined}
          onMesure={setMesure}
          reserveDroite={reserveDroite}
          onRenvoi={surRenvoi}
          onAjouter={ouvrirFeuille}
          onBasculerMasque={basculerMasque}
          onSixSemaines={surSixSemaines}
          onPincer={surPincer}
          echelle={deplieVu ? 'semaine-depliee' : echelle}
          aujourdhui={aujourdhui}
          barre={{ onToucher: surToucher, onAppuiLong: surAppuiLong, onGlisse: surGlisse, onLacheGlisse: surLacheGlisse, onBord: surBord, onLacheBord: surLacheBord, onRefus: surRefus, ...(defilable ? { defile: defilerFenetre, marge } : {}) }}
        />
      )}

      {rangeeAlerte === null && !messageEnTete && noeudMessage}

      {menu && chosesMenu && (() => {
        const c = chosesMenu;
        /* jamais une semaine que la barre occupe déjà (« Dupliquer en S47 » sur ce qui est en S47 n'a pas de sens) : la semaine après sa fin ; un brassin se duplique sur la semaine qui suit son jour de brassage, au plus tôt la semaine prochaine */
        const apresFin = ajouterJours(lundiDe(c.fin || c.debut), 7);
        const prochain = c.source.genre === 'batch' ? (() => { const s = ajouterJours(lundiDe(c.debut), 7), p = ajouterJours(lundiAuj, 7); return s < p ? p : s; })() : apresFin;
        const dup = dupliquer(c, prochain, ctxGestes);
        const ret = retirer(c, ctxGestes);
        return (
          <MenuAppuiLong
            chose={c}
            nomRangee={nomSeules(c.rangee)}
            onOuvrirSource={() => { setMenu(null); ouvrir(c.ouvre); }}
            libelleSource={LIBELLE_LIEN[c.ouvre.ecran]}
            ancre={menu.ancre}
            epinglee={epingles.includes(c.id)}
            etoilee={etoiles.includes(c.id)}
            autresRangees={ordre.filter(r => r !== c.rangee).length}
            dupliquer={dup.ok === false ? null : (() => {
              /* CRITIQUE-10 n° 5 (E31) : l'effet en mots du domaine d'abord (lot A : « courses S47 : 3 268 → 3 179 » quand la semaine
                 touchée n'est pas celle de la copie, « coût à venir » sans budget), jamais rien ; sinon l'effet chiffré */
              const effet = dup.effetMots ?? dup.effet?.texte;
              return { libelle: etiquetteS(prochain), ...(effet ? { effet } : {}) };
            })()}
            retirer={ret.ok === false ? { raison: ret.raison } : (() => {
              /* CRITIQUE-11 n° 4 (E31, D-192) : l'effet chiffré, sinon l'effet en mots du domaine (« recette estimée 1 180 · ne change pas la courbe (pas dans Finances) »,
                 « sans montant ») : jamais « Retirer » seul */
              const effet = ret.effet?.texte ?? ret.effetMots;
              return effet ? { effet } : {};
            })()}
            liens={liensDe(c)}
            onEpingler={() => {
              const avant = epingles, on = !avant.includes(c.id);
              setEpingles(basculer(avant, c.id)); setMenu(null);
              montrer({ role: 'status', texte: on ? `${c.titre} épinglée : reste visible si tu masques ${nomRangee(c.rangee)}` : 'Épingle retirée', ancre: c.id, annuler: () => { setEpingles(avant); setMessage(null); } });
            }}
            onEtoile={() => {
              const avant = etoiles, on = !avant.includes(c.id);
              setEtoiles(basculer(avant, c.id)); setMenu(null);
              montrer({ role: 'status', texte: on ? `Étoile : ${c.titre} marquée sur la courbe` : 'Étoile retirée', ancre: c.id, annuler: () => { setEtoiles(avant); setMessage(null); } });
            }}
            onSeules={() => {
              setFiltre(c.rangee); setMenu(null);
              montrer({ role: 'status', texte: nomSeules(c.rangee), ancre: c.id, annuler: () => { setFiltre(null); setMessage(null); } });
            }}
            onDupliquer={() => { setMenu(null); void ecrire(dup, true, c.id); }}
            onLier={(liens, nom) => {
              /* CRITIQUE-4 n° 6 (D-126) : le lien est écrit dans la source ; la pastille « lié à X » vient avec le modèle, l'aperçu s'ouvre
                 aussitôt (le détail de la chose), et le message dit « Liée à X · Annuler » */
              setMenu(null);
              /* CRITIQUE-11 n° 8 (D-126 : le message ET le détail) : le message est marqué `ouvreSonDetail` ; il résiste à l'ouverture de ce
                 détail et au défilement qui dégage ce détail du +. CRITIQUE-12 n° 1 : il se pose près de la Hotte ou en bas, hors du détail */
              void ecrire(lier(c, liens, ctxGestes, nom), true, c.id, true).then(ok => { if (ok) { ouvertureParGeste.current = Date.now() + 1200; setSelectionId(c.id); } });
            }}
            onRetirer={() => { setMenu(null); void ecrire(ret, true, c.id); }}
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
          /* CAL-PASSE : ajouter, c'est à partir de la semaine courante ; modifier une chose du passé garde le passé (sa date y est) */
          semaines={feuille.mode === 'modifier' ? modele.semaines : modele.semaines.slice(modele.passe ?? 0)}
          /* k1 : une fête n'a pas d'autre écran que cette feuille (la donnée d'agenda reste au Calendrier) : pas de « Plus de détails › » */
          sansPlusDeDetails={feuille.sansPlusDeDetails || feuille.mode === 'modifier' || feuille.initial.rangee === 'fetes'}
          evenements={evenementsLiables.filter(e => !(feuille.chose?.source.genre === 'creative' && feuille.chose.source.id === e.id))}
          onPlusDeDetails={plusDeDetails}
          onAjouter={ajouterDepuisFeuille}
          onFermer={() => setFeuille(null)}
        />
      )}

      {ideeModif && <FeuilleIdee modifier titreInitial={ideeModif.titre} lundi={ideeModif.lundi} semaines={modele.semaines} onNoter={idee_modifier} onFermer={() => setIdeeModif(null)} />}
      {idee !== null && <FeuilleIdee lundi={idee} semaines={modele.semaines} onNoter={idee_ecrire} onFermer={() => setIdee(null)} />}

      {panneau === 'filtre' && (
        <Sheet open onClose={() => setPanneau(null)} title="Filtrer par type">
          <div className="flex flex-wrap gap-2 px-3 pb-3" role="group" aria-label="Type">
            {RANGEES.map(r => (
              <button key={r.id} type="button" aria-pressed={filtre === r.id} className={`cal-b ${CLASSE_TEINTE[r.id]}`} onClick={() => { setFiltre(r.id); setPanneau(null); }}>{nomSeules(r.id)}</button>
            ))}
            <button type="button" className="cal-b" onClick={() => { setFiltre(null); setPanneau(null); }}>Tout afficher</button>
          </div>
        </Sheet>
      )}
      {/* Paquet G n° 7 : la place laissée sous la frise (barre d'onglets, + volant) est un bloc, plus une marge intérieure : une zone collée ne
          quitte son parent qu'à la fin de son contenu ; avec la marge, l'en-tête du calendrier remontait sous celui de l'app en bas de page
          (844 × 390, défilé de 600 px : 13 px au lieu de 49). */}
      <div aria-hidden="true" className="cal-tab-fin" style={{ height: 'calc(var(--main-navigation-height, 2.5rem) + 6.5rem)', marginTop: 0 }} />
    </div>
  );
}

/*
 * Doute de CRITIQUE-12 (E35, D-15 à D-18) : les pictos du + volant sont ceux de sa maquette (`as/cap/passe10/p-clair-ouvert.png`), recopiés
 * des symboles du jouable (`as/cal.html`, `PA_CAL` de `as-gestes.js` : i-beer, i-fete, i-vente, i-k17cart, i-outil, i-jour, i-doc). Le port
 * y mettait ceux de la frise (fête : cotillon, travaux : marteau, activité : liste cochée) : la fête est un agenda, les travaux une clé, une
 * activité un jour. Ordre et libellés inchangés.
 */
type PictoProps = { size?: number };
const picto = (nom: string, corps: React.ReactNode): React.FC<PictoProps> => {
  const P: React.FC<PictoProps> = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-picto={nom}>{corps}</svg>
  );
  P.displayName = `Picto(${nom})`;
  return P;
};
export const ICONE_PLUS: Record<IdRangee, React.FC<PictoProps>> = {
  brassins: picto('i-beer', <><path d="M17 11h1a3 3 0 0 1 0 6h-1" /><path d="M9 12v6M13 12v6" /><path d="M14 7.5c-1 0-1.4.5-3 .5s-2-.5-3-.5-1.7.5-2.5.5a2.5 2.5 0 0 1 0-5c.8 0 1.6.5 2.5.5S9.4 2 11 2s2 1.5 3 1.5 1.7-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.8 0-1.5-.5-2.5-.5Z" /><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" /></>),
  fetes: picto('i-fete', <><path d="M8 2v4M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 14h8M8 18h5" /></>),
  ventes: picto('i-vente', <><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></>),
  achats: picto('i-k17cart', <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 8H6" /></>),
  travaux: picto('i-outil', <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z" />),
  activites: picto('i-jour', <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
  papiers: picto('i-doc', <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></>)
};

/** « Noter une idée » (E36, L1 a et b) : une idée datée, envoyée au carnet par le service existant. Elle n'a ni rangée ni case. */
function FeuilleIdee({ lundi, semaines, onNoter, onFermer, modifier, titreInitial }: { modifier?: boolean; titreInitial?: string; lundi: string; semaines: ReadonlyArray<{ debut: string; numero: number }>; onNoter: (titre: string, lundi: string) => Promise<string | null>; onFermer: () => void }) {
  const [titre, setTitre] = useState(titreInitial ?? '');
  const [semaine, setSemaine] = useState(lundiDe(lundi));
  const [refus, setRefus] = useState<string | null>(null);
  void enregistrementIdee;
  return (
    <Sheet
      open
      onClose={onFermer}
      title={modifier ? 'Modifier l’idée' : 'Noter une idée'}
      subtitle={`en ${etiquetteS(semaine)}`}
      footer={<button type="button" className="cal-cta min-h-11 w-full rounded-control px-4 text-base font-bold" onClick={async () => setRefus(await onNoter(titre, semaine))}>{modifier ? 'Enregistrer' : 'Noter'}</button>}
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
        <p className="text-sm text-cave-200">{phraseSemaine(semaine, modifier ? 'Elle reste là où elle est notée.' : 'Elle arrive dans le carnet.')}</p>
        {refus && <p className="text-sm text-alert-strong">{refus}</p>}
      </div>
    </Sheet>
  );
}
