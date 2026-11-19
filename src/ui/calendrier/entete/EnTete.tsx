import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChartLine, ChevronDown, Clock, EyeOff, Maximize2, Minimize2, Ruler } from 'lucide-react';
import { alignerSemaines, colonnesDeSemaines, semaineSous } from './alignement';
import type { Periode } from '../../../components/periode/periode';
import { dateDeSemaine, etiquetteS, lundiDe, type ModeleCalendrier, type Retard } from '../../../domain/calendrier';
import { creuxDepuis, miseDeCoteVisible, type CourbeCaisse, type MouvementNomme } from '../../../domain/calendrierCaisse';
import type { Orientation } from '../useOrientation';
import { entrerPleinEcran, estPleinEcran, poserPleinCalendrier, sortirPleinEcran } from '../pleinEcran';
import { usePointeurCourbe } from '../usePointeurCourbe';
import { Courbe, CourbeZoom, HAUTEUR_MOIS, MOIS_MIN, ajouterJours, chf, courbePlate, jourCourt, moisDeSemaine, semaineCourte, type Boite, type EtoileCourbe } from './Courbe';
import { Cadre, etiquetteCadre, fenetreDePeriode, libelleDuree, libellePeriode, periodeDeFenetre, SEMAINES_ANNEE, type FenetreSemaines, type PriseCadre } from './Fenetre';
import { BandeSemaines } from './BandeSemaines';
import { BandeColonnes, jourEntier } from './BandeColonnes';
import type { Echelle } from '../echelle';
import type { Colonne } from '../frise/Rangee';
import { BandeAnnee } from './BandeAnnee';
import { MenuPeriode, hautDesOnglets } from './MenuPeriode';
import { DetailCreux } from './DetailCreux';
import { Retards, titreRetards } from './Retards';
import { LectureDetail, LectureTete } from './LectureCourbe';
import { GrandeCourbe, PLACE_DETAIL, TITRE_GRANDE, geoGrande, hautDuPlus, hautLegende, largeurGrande } from './GrandeCourbe';
import './entete.css';

/**
 * L'en-tête du calendrier (E01 à E13) : le chiffre clé et ses boutons, la courbe de la fenêtre, la bande des semaines. z2s en portrait, w3s en
 * paysage : le même composant, le même état, une mise en page par orientation (D-205).
 *
 * L'en-tête ne lit rien : tout vient du modèle (`ModeleEnTete`, un sous-ensemble de `ModeleCalendrier` du lot A), la fenêtre et la période sont
 * à l'appelant. Les montants sont des centimes ; un solde de départ inconnu (`courbe: null`) ne trace rien et le dit.
 */

export type VueCalendrier = 'semaines' | 'annee' | 'graph' | 'liste';

/** Ce que l'en-tête lit du modèle : `ModeleCalendrier` en entier convient. */
export type ModeleEnTete = Pick<ModeleCalendrier, 'semaines' | 'courbe' | 'creux' | 'retards' | 'sansDate' | 'icones'> & Partial<Pick<ModeleCalendrier, 'mois' | 'choses' | 'hypotheses'>>;

/** La courbe recalculée pendant un geste de la frise (E02) : une `CourbeCaisse` (`courbeDecalee`, `courbeSans`…). */
export type ApercuCourbe = CourbeCaisse | { courbe: CourbeCaisse; /** D388 : le jour où la chose tomberait si on lâchait (« si tu lâches en S51 »). */ lache?: string };

export interface EnTeteCalendrierProps {
  modele: ModeleEnTete;
  /** La fenêtre : le lundi de sa première semaine et son nombre de semaines (les colonnes de la frise). */
  fenetre: FenetreSemaines;
  onFenetre: (fenetre: FenetreSemaines) => void;
  /** LA période de l'app : le calendrier l'écrit, Finances la lit, et l'inverse (ET-PER). */
  periode: Periode;
  onPeriode: (periode: Periode) => void;
  vue: VueCalendrier;
  /** `ancre: 'sans-date'` ouvre la liste sur la poche (E46). */
  onVue: (vue: VueCalendrier, ancre?: 'sans-date') => void;
  mouvements: boolean;
  onMouvements: (afficher: boolean) => void;
  orientation: Orientation;
  apercu?: ApercuCourbe;
  /** Le lundi ISO de la semaine lue au doigt, `null` quand la lecture se ferme. */
  onLectureSemaine?: (lundi: string | null) => void;
  /** Appui long sur une semaine de la bande : une idée datée à ce lundi (E36). */
  onIdeeSemaine?: (lundi: string) => void;
  /** Largeur d'une colonne de la frise, en px (0 : inconnue, la courbe se mesure). */
  largeurColonne: number;
  /** Les liens « Solde et réglages › » et « Finances › Solde » (D-72). */
  onOuvrirFinances?: () => void;
  onOuvrirRetard?: (retard: Retard) => void;
  /** « Trier les rangées » et « Filtrer par type » du menu : le geste vit dans la frise (E39). */
  onTrier?: () => void;
  onFiltrer?: () => void;
  /**
   * Le canal unique des messages de l'onglet (E33, D-200) : « Tire jusqu'au bout : l'année » (`annee`, après un lâcher de poignée avant 80 %) et
   * « Tourne le téléphone : 13 semaines » (`invite`). `null` : retirer le message de l'en-tête s'il est encore celui qui s'affiche (arrivée dans
   * l'An, courbe en grand, rotation). Sans ce rappel, l'en-tête les montre lui-même, comme avant.
   */
  onMessage?: (m: MessageEnTete | null) => void;
  /** Les ids des choses étoilées (E31, `calendrier_etoiles`) : chacune se voit sur sa marche de la courbe, « ★ Hotte −900 ». */
  etoiles?: readonly string[];
  /** D385 : l'échelle de l'axe (Jour, Semaine, Mois) et son réglage au menu de la période (variante D). */
  echelle?: Echelle;
  onEchelle?: (echelle: Echelle) => void;
  /** D385 : les colonnes de la frise, pour la bande en jours ou en mois (variantes B et C). */
  colonnes?: readonly Colonne[];
  /** D385 (C) : le lundi de la semaine dépliée ; `onDeplier` présent : toucher une semaine la déplie (au lieu de la bulle de date). */
  deplie?: string | null;
  onDeplier?: (lundi: string | null) => void;
  aujourdhui?: string;
  /**
   * D387 (le brasseur, 18.11 : « juste un bouton qui match les deux ou pas genre un toggle switch ») : l'interrupteur de l'en-tête. Allumé, la
   * courbe se trace sur les colonnes de la frise (même x pour une même date, toutes périodes, vue Jour comprise) ; éteint, l'année avec le cadre.
   * Le chiffre « à dépenser » garde sa règle (le creux de toute la courbe). Sans `onAligne`, pas d'interrupteur.
   */
  aligne?: boolean;
  onAligne?: (aligne: boolean) => void;
  /** D389 : « un bouton qui peut cacher le graph » ; cachée, seule la bande de l'axe reste sous la tête. Sans `onCourbeCachee`, pas de bouton. */
  courbeCachee?: boolean;
  onCourbeCachee?: (cachee: boolean) => void;
}

export interface MessageEnTete { genre: 'annee' | 'invite'; texte: string }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** Largeur de la colonne du chiffre clé et des boutons en paysage (w3s). */
const COLONNE_T = 214;
/**
 * Portrait (avant le paquet G) : 110 px, les mois dessous (z2s) ; voir HAUTEUR_COURBE. Paysage : 90 px, les mois EN HAUT, dans la courbe, comme w3s (l-repos) ; le tracé garde 70 px
 * (E02, CRITIQUE-4 n° 11) et l'en-tête tient dans 120 px (E10) : la place est prise sur la bande et l'écart, pas sur la courbe.
 */
/* lot C n° 7 : alignée en paysage, la rangée du chiffre passait au-dessus (28 px) ; paquet D n° 6 : 90 px de courbe (147 px d'en-tête).
   Paquet E n° 2 : la rangée du chiffre se pose sur celle des mois ; 92 px pour tout (rangée de 28 px, puis 62 px de tracé), 119 px d'en-tête. */
/* Paquet G n° 1 et 2 (CAL-PLACE-GACHEE, 19.11 : « beaucoup d'espace "gâché" ») : en portrait, les mois passent EN HAUT de la courbe, comme w3s
   (une seule rangée d'axe : la bande des semaines dessous) ; la courbe fait 88 px (plancher CAL-GRAPH-PETIT : 80), 44 px quand elle est plate
   (solde constant : rien à lire). Alignée en portrait, 110 px, comme avant. */
/* Tour 2 n° 2 (CAL-PLACE-GACHEE, « une seule rangée d'axe ») : la courbe non alignée (l'année) ne porte plus sa rangée de mois ; la bande des
   semaines, dessous, est la seule rangée d'axe. Son cadre (« S47 – S52 ») dit où est la fenêtre ; alignée, la courbe garde ses mois (ils sont
   ceux de la frise). Tour 2 n° 1 (capture b19e2698, paysage 844 × 340) : en paysage, la courbe descend à la hauteur de la colonne du chiffre
   (60 px, le chiffre et les boutons) ; la frise commence avant 40 % de la hauteur. */
const HAUTEUR_COURBE = { portrait: 88, portraitPlate: 44, portraitAlignee: 110, paysage: 60, paysageAlignee: 92 };
/** Paquet E n° 2 : la rangée du chiffre et des boutons en paysage aligné (boutons de 28 px), posée sur la rangée des mois de la courbe. */
export const RANGEE_CHIFFRE_PAYSAGE = 28;
/** Hauteur de la grande courbe au téléphone (p-c3a-pendant : environ 250 px, le détail dessous). */
const HAUTEUR_GRANDE_TEL = 250;
/** Ce qui, sous la grande courbe, doit rester visible : son titre (44), le détail de la semaine (3 lignes), la légende, une marge. */
// CRITIQUE-12 n° 5 : la réserve n'est plus une somme fixe (la légende de deux lignes et un détail de 4 lignes la dépassaient : la légende passait
// sous le + volant, et sous les onglets en S17). Le haut de la légende se règle sur le + lu à l'écran (`hautLegende`), le détail a une place fixe.
/** Au-delà de cette largeur (tablette, ordinateur), rien à tourner : aucune invitation « Tourne le téléphone » (CRITIQUE-4 n° 19). */
const LARGE_PX = 700;
/** « 16 nov. » ; avec l'année quand la plage change d'année (« 16 nov. 2026 → 14 nov. 2027 », CRITIQUE-4 n° 26). */
const plageDe = (du: string, au: string): string => {
  const autreAn = du.slice(0, 4) !== au.slice(0, 4);
  const d = (j: string) => (autreAn ? `${jourCourt(j)} ${j.slice(0, 4)}` : jourCourt(j));
  return `${d(du)} → ${d(au)}`;
};
const MESSAGE_ANNEE = 'Tire jusqu’au bout : l’année';
const INVITATION = 'Tourne le téléphone : 13 semaines';

/** La largeur d'un élément, mesurée ; 0 tant qu'elle est inconnue (jsdom, premier rendu). */
function useMesure(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const lire = () => { const r = Math.round(el.getBoundingClientRect().width); if (r > 0) setW(r); };
    lire();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

type Info = { genre: 'message' | 'invite' | 'date'; texte: string; colonne?: number; colonnes?: number; cle?: string };

export function EnTeteCalendrier(props: EnTeteCalendrierProps) {
  const { modele, fenetre, onFenetre, periode, onPeriode, vue, onVue, mouvements, onMouvements, orientation, apercu, onLectureSemaine, onIdeeSemaine, largeurColonne, onOuvrirFinances, onOuvrirRetard, onTrier, onFiltrer, onMessage, etoiles } = props;
  const paysage = orientation === 'paysage';
  const graph = vue === 'graph';
  const liste = vue === 'liste';
  const base = modele.courbe;
  const apercuC: CourbeCaisse | null = apercu ? ('semaines' in apercu ? apercu : apercu.courbe) : null;
  const lache = apercu && !('semaines' in apercu) ? apercu.lache ?? null : null;
  const cachee = !!props.courbeCachee && !!props.onCourbeCachee && !graph;
  const courbeC = apercuC ?? base;
  const courbe = courbeC?.semaines ?? null;

  // Les semaines, la fenêtre dans leur suite.
  const semainesTot = useMemo(() => (base ? base.semaines.map(s => ({ debut: s.lundi, numero: s.numero })) : modele.semaines.map(s => ({ debut: s.debut, numero: s.numero }))), [base, modele.semaines]);
  const total = semainesTot.length;
  // CRITIQUE-11 n° 1 (E13, E40, D-184, D-194, D-204) : la Liste porte l'en-tête de la frise pour la même période. Quand sa fenêtre couvre toutes
  // les semaines (l'An, laissé tel quel en passant en Liste), c'est l'An : la bande en 12 mois, le cadre « nov. – nov. 2027 » ; jamais 52
  // numéros écrits les uns sur les autres. En 6 sem., 3 mois et 6 mois, la Liste garde la bande des semaines de la frise.
  const anneeListe = liste && total > 0 && fenetre.semaines >= Math.min(SEMAINES_ANNEE, total);
  const annee = vue === 'annee' || anneeListe;
  const premier = Math.max(0, semainesTot.findIndex(s => s.debut >= fenetre.du));
  const nombre = annee ? Math.max(1, total) : clamp(fenetre.semaines, 1, Math.max(1, total - premier));
  const index = annee ? 0 : premier;
  const visibles = semainesTot.slice(index, index + nombre);

  // La largeur : mesurée, sinon la colonne de la frise × le nombre de colonnes, sinon 390.
  const zone = useRef<HTMLDivElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  const cadreCourbe = useRef<HTMLDivElement | null>(null);
  const cadreGrande = useRef<HTMLDivElement | null>(null);
  const boutonPeriode = useRef<HTMLButtonElement>(null);
  /** Les boutons de tête : la lecture au doigt prend la place qu'ils laissent (CRITIQUE-7 n° 5). */
  const boutonsTete = useRef<HTMLSpanElement>(null);
  const mesure = useMesure(zone);
  // ---- D387, D388 : la courbe posée sur les colonnes de la frise (bouton allumé, ou pendant un glisser, comme le jouable) ----
  // Lot C (18.11) : le bouton à bascule (Ruler, pas Link2 qui dit « Lier ») a la taille des autres boutons-icônes, dans la rangée du chiffre, partout. Allumé en paysage, la
  // rangée du chiffre passe au-dessus et la courbe prend toute la largeur de l'en-tête (n° 7, comme le jouable).
  const alignee = !!props.aligne && !!props.onAligne && !graph && !liste && !cachee && !!base;
  const paysageAligne = paysage && alignee;
  const boutonAligne = !!props.onAligne && !!base && !graph && !liste && !cachee;
  const repliTotal = largeurColonne > 0 ? largeurColonne * Math.max(1, nombre) : 390;
  const repli = paysage && !graph && !paysageAligne ? Math.max(200, repliTotal - COLONNE_T - 8) : repliTotal;
  const largeur = mesure || repli;
  // La platitude se lit sur la courbe du modèle, jamais sur l'aperçu d'un geste : la hauteur ne saute pas pendant un glisser.
  const plate = !!base && courbePlate(base.semaines);
  const hauteur = paysageAligne ? HAUTEUR_COURBE.paysageAlignee : paysage ? HAUTEUR_COURBE.paysage
    : alignee ? HAUTEUR_COURBE.portraitAlignee : plate ? HAUTEUR_COURBE.portraitPlate : HAUTEUR_COURBE.portrait;
  const zoomee = !!apercuC && !graph && !cachee && !!base;
  /*
   * Paquet E n° 2 (E10, « en-tête de 120 px au plus » en paysage) : alignée en paysage, la rangée du chiffre (28 px) se posait au-dessus de la
   * courbe (147 px en tout). Elle se pose maintenant sur la rangée des mois de la courbe (CSS : même case de grille) ; la courbe garde le tracé
   * dessous, et ses mois évitent le chiffre et les boutons, mesurés ici (px de la courbe).
   */
  const [reserves, setReserves] = useState<Array<[number, number]>>([]);
  useLayoutEffect(() => {
    if (!paysageAligne) { setReserves(r => (r.length ? [] : r)); return undefined; }
    const mesurer = () => {
      const z = zone.current?.getBoundingClientRect(), t = racine.current?.querySelector('.ent-t');
      if (!z || !t) return;
      /* l'étendue du contenu (le texte du chiffre, les boutons), pas la boîte : celle du chiffre s'étire sur la rangée */
      const etendue = (e: Element) => {
        const r = document.createRange();
        r.selectNodeContents(e);
        const b = typeof r.getBoundingClientRect === 'function' ? r.getBoundingClientRect() : null;
        return b && b.width > 0 ? b : e.getBoundingClientRect();
      };
      const plages = [...t.children].map(etendue).filter(b => b.width > 0)
        .map(b => [Math.round(b.left - z.left), Math.round(b.right - z.left)] as [number, number]);
      setReserves(r => (r.length === plages.length && r.every((p, i) => p[0] === plages[i][0] && p[1] === plages[i][1]) ? r : plages));
    };
    mesurer();
    const t = setTimeout(mesurer, 300);
    window.addEventListener('resize', mesurer);
    return () => { clearTimeout(t); window.removeEventListener('resize', mesurer); };
  });
  /** La frise mesurée : son bord gauche moins celui de la courbe (`decalage`) et moins celui de l'en-tête (`decEnt`) ; la boîte de l'en-tête. */
  const [frise, setFrise] = useState<{ decalage: number; largeur: number; decEnt: number; largEnt: number; hautEnt: number } | null>(null);
  useLayoutEffect(() => {
    if (!alignee && !zoomee) return undefined;
    const lireFrise = () => (racine.current?.closest('[data-calendrier]') ?? document).querySelector<HTMLElement>('[data-frise]');
    const r1 = (v: number) => Math.round(v * 10) / 10;
    const mesurer = () => {
      const rz = zone.current?.getBoundingClientRect(), rf = lireFrise()?.getBoundingClientRect(), re = racine.current?.getBoundingClientRect();
      // Le bord gauche de la frise moins celui de la courbe : 0 en portrait, négatif en paysage (la colonne du chiffre est à gauche de la courbe).
      const suivant = rz && rf && rf.width > 0
        ? { decalage: r1(rf.left - rz.left), largeur: r1(rf.width), decEnt: r1(rf.left - (re?.left ?? rz.left)), largEnt: r1(re?.width ?? rz.width), hautEnt: Math.round(re?.height ?? 0) }
        : null;
      const egal = (p: NonNullable<typeof suivant>, q: NonNullable<typeof suivant>) => p.decalage === q.decalage && p.largeur === q.largeur && p.decEnt === q.decEnt && p.largEnt === q.largEnt && p.hautEnt === q.hautEnt;
      setFrise(p => ((p && suivant && egal(p, suivant)) || (!p && !suivant) ? p : suivant));
    };
    mesurer();
    window.addEventListener('resize', mesurer);
    const f = lireFrise();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null;
    if (ro && f) ro.observe(f);
    if (ro && zone.current) ro.observe(zone.current);
    return () => { window.removeEventListener('resize', mesurer); ro?.disconnect(); };
  }, [alignee, zoomee, orientation, props.colonnes]);
  const lundiDebut = visibles[0]?.debut ?? fenetre.du;
  const alignement = useMemo(() => {
    if ((!alignee && !zoomee) || !base) return null;
    const cols = props.colonnes?.length ? props.colonnes : colonnesDeSemaines(base.semaines.slice(index, index + nombre).map(s => s.lundi));
    const lf = frise?.largeur ?? largeur;
    return alignerSemaines(base.semaines.map(s => s.lundi), cols, lf / Math.max(1, cols.length), frise?.decalage ?? 0, largeur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignee, zoomee, base, props.colonnes, index, nombre, lundiDebut, frise, largeur]);
  // Lot C n° 7 (jouable paysage, `as-gestes.js` zoomOn : `.as-zoom` fixe, toute la largeur, la hauteur de l'en-tête) : en paysage, la courbe
  // zoomée du glisser se pose par-dessus tout l'en-tête, colonne du chiffre comprise ; ses semaines sur les colonnes de la frise.
  const alignementTout = useMemo(() => {
    if (!paysage || !zoomee || !base || !frise || !(frise.largEnt > 0) || !(frise.hautEnt > 0)) return null;
    const cols = props.colonnes?.length ? props.colonnes : colonnesDeSemaines(base.semaines.slice(index, index + nombre).map(s => s.lundi));
    return alignerSemaines(base.semaines.map(s => s.lundi), cols, frise.largeur / Math.max(1, cols.length), frise.decEnt, frise.largEnt);
  }, [paysage, zoomee, base, props.colonnes, index, nombre, frise]);
  // La grande courbe : en paysage, la hauteur de l'écran moins l'en-tête ; au téléphone en portrait, celle de sa maquette ; plus large, toute la
  // hauteur de la zone de la frise jusqu'au bas de l'écran (ou au haut de la barre d'onglets), moins son titre, le détail et la légende.
  const [hautDispo, setHautDispo] = useState(0);
  // CRITIQUE-5 n° 16 : au téléphone aussi, la courbe prend la hauteur disponible (plus de moitié basse vide), sans descendre sous sa maquette.
  useLayoutEffect(() => {
    if (!graph || paysage || typeof window === 'undefined') { setHautDispo(0); return undefined; }
    const mesurer = () => {
      const haut = zone.current?.getBoundingClientRect().top ?? 0;
      setHautDispo(Math.round(hautLegende(hautDesOnglets(), hautDuPlus()) - haut - TITRE_GRANDE - PLACE_DETAIL));
    };
    mesurer();
    window.addEventListener('resize', mesurer);
    return () => window.removeEventListener('resize', mesurer);
  }, [graph, paysage]);
  const hauteurGrande = paysage
    ? clamp((typeof window !== 'undefined' ? window.innerHeight : 390) - 150, 150, 250)
    : Math.max(HAUTEUR_GRANDE_TEL, hautDispo);

  // Les états de l'en-tête.
  const [creuxOuvert, setCreuxOuvert] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [retardsOuverts, setRetardsOuverts] = useState(false);
  const [lecture, setLecture] = useState<number | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [plein, setPlein] = useState(() => estPleinEcran());
  // Doute m27 (CRITIQUE-10) : le cadre de focus des boutons de tête est pour le clavier seul. La dernière modalité de la page se lit sur
  // `document`, en capture : un doigt (ou la souris) pose `data-doigt`, une touche du clavier l'enlève ; avec lui, l'anneau `:focus-visible`
  // des boutons de tête est retiré (entete.css), même quand Chrome juge « clavier » un focus rendu par programme.
  const [doigt, setDoigt] = useState(false);
  useEffect(() => {
    const pose = () => setDoigt(true);
    const leve = () => setDoigt(false);
    document.addEventListener('pointerdown', pose, true);
    document.addEventListener('keydown', leve, true);
    return () => { document.removeEventListener('pointerdown', pose, true); document.removeEventListener('keydown', leve, true); };
  }, []);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vueAvant = useRef<VueCalendrier>('semaines');
  const fenAvantAnnee = useRef<FenetreSemaines | null>(null);

  const montrer = useCallback((i: Info, dureeMs: number | null) => {
    if (minuterie.current) clearTimeout(minuterie.current);
    setInfo(i);
    minuterie.current = dureeMs ? setTimeout(() => setInfo(null), dureeMs) : null;
  }, []);
  useEffect(() => () => { if (minuterie.current) clearTimeout(minuterie.current); }, []);

  // ---- Les messages : par le canal unique de l'onglet (onMessage), sinon ici comme avant (E33, CRITIQUE-3 n° 7) ----
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const emis = useRef<MessageEnTete['genre'] | null>(null);
  const dire = useCallback((m: MessageEnTete) => {
    const canal = onMessageRef.current;
    if (canal) { emis.current = m.genre; canal(m); return; }
    montrer({ genre: m.genre === 'annee' ? 'message' : 'invite', texte: m.texte }, m.genre === 'annee' ? 4000 : null);
  }, [montrer]);
  /** Retire le message de l'en-tête (`genre` donné : seulement celui-là). */
  const taire = useCallback((genre?: MessageEnTete['genre']) => {
    const canal = onMessageRef.current;
    if (canal) {
      if (emis.current && (!genre || emis.current === genre)) { emis.current = null; canal(null); }
      return;
    }
    setInfo(i => (i && i.genre !== 'date' && (!genre || (genre === 'annee' ? i.genre === 'message' : i.genre === 'invite')) ? null : i));
  }, []);

  // ---- La période de l'app et la fenêtre sont la même chose (E07, ET-PER, les deux sens) ----
  const fenRef = useRef(fenetre);
  fenRef.current = fenetre;
  const clePeriode = JSON.stringify(periode);
  useEffect(() => {
    if (!total) return;
    const d = fenetreDePeriode(periode, semainesTot[0].debut, total);
    if (!d) return;
    const f = fenRef.current;
    if (d.du !== f.du || d.semaines !== f.semaines) onFenetre(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clePeriode, total]);

  const ecrire = useCallback((f: FenetreSemaines) => { onFenetre(f); onPeriode(periodeDeFenetre(f)); }, [onFenetre, onPeriode]);

  // ---- La rotation : 13 semaines en paysage, la fenêtre d'avant au retour (E10). Jamais une période écrite : la rotation ne règle pas Finances ----
  const avantPaysage = useRef<FenetreSemaines | null>(null);
  const orientationVue = useRef<Orientation>('portrait');
  useEffect(() => {
    if (orientationVue.current === orientation) return;
    orientationVue.current = orientation;
    if (orientation === 'paysage') {
      taire('invite');
      const f = (total ? fenetreDePeriode(periode, semainesTot[0].debut, total) : null) ?? fenRef.current;
      avantPaysage.current = f;
      if (f.semaines < 13) onFenetre({ du: f.du, semaines: 13 });
    } else if (avantPaysage.current) {
      onFenetre(avantPaysage.current);
      avantPaysage.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

  // ---- Le plein écran (E09) ----
  useEffect(() => {
    const h = () => setPlein(estPleinEcran());
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  /* Tour 2 n° 1 : en plein écran, l'en-tête de l'app s'efface (Header lit ce magasin) ; il revient au retour et quand le calendrier part. */
  useEffect(() => { poserPleinCalendrier(plein); }, [plein]);
  useEffect(() => () => poserPleinCalendrier(false), []);
  const basculerPlein = async () => {
    if (plein) { await sortirPleinEcran(); setPlein(false); return; }
    // L'invitation est pour le téléphone tenu droit (CRITIQUE-4 n° 19) ; un écran large n'a rien à tourner. La largeur se lit AVANT le plein
    // écran : une fois en plein écran, la fenêtre peut avoir changé de taille sans que le téléphone ait tourné (CRITIQUE-7, doute E09).
    const telephoneDroit = !paysage && window.innerWidth < LARGE_PX;
    const r = await entrerPleinEcran(document.documentElement);
    setPlein(estPleinEcran());
    if (r === 'invite' && telephoneDroit) dire({ genre: 'invite', texte: INVITATION });
  };

  // ---- Le doigt sur la courbe : lire (c2-b), appui long (c3-a) ----
  const indexSous = (clientX: number): number => {
    const n = Math.max(1, courbe?.length ?? 1);
    if (graph && courbe) {
      const l = largeurGrande(largeur, paysage);
      const r = cadreGrande.current?.getBoundingClientRect();
      const g = geoGrande(courbe, l, hauteurGrande);
      return clamp(Math.floor((((clientX - (r?.left ?? 0)) * (r && r.width ? l / r.width : 1)) - g.xl) / g.unit), 0, n - 1);
    }
    const r = cadreCourbe.current?.getBoundingClientRect();
    if (alignement && !apercuC) {
      const x = (clientX - (r?.left ?? 0)) * (r && r.width ? largeur / r.width : 1);
      return clamp(alignement.debut + semaineSous(alignement, x), 0, n - 1);
    }
    return clamp(Math.floor((((clientX - (r?.left ?? 0)) * (r && r.width ? largeur / r.width : 1)) / (largeur / n))), 0, n - 1);
  };
  const { props: gestes, attacher } = usePointeurCourbe({
    indexSous,
    actif: !!courbe && !apercuC,
    onLire: i => setLecture(i),
    onAppuiLong: i => {
      if (vue === 'graph') return;
      vueAvant.current = vue;
      setLecture(i);
      taire();
      onVue('graph');
    }
  });
  // Les nœuds des deux courbes reçoivent l'écouteur `touchmove` qui bloque le défilement pendant la lecture et l'appui long (n° 3).
  const refCourbe = useCallback((el: HTMLDivElement | null) => { cadreCourbe.current = el; attacher(el); }, [attacher]);
  const refGrande = useCallback((el: HTMLDivElement | null) => { cadreGrande.current = el; attacher(el); }, [attacher]);
  const gestesGrande = { ...gestes, onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => { gestes.onPointerDown(e); setLecture(indexSous(e.clientX)); } };
  // Sur la petite courbe, seules les deux zones de prise (44 px) tirent la fenêtre ; tout autre doigt lit la semaine (c2-b, CRITIQUE-3 n° 6).
  // La décision se prend ici, par la géométrie, pas par la cible du toucher (l'ajustement tactile la rabat sur le bouton voisin).
  const prise = useRef<PriseCadre | null>(null);
  const gestesCourbe = {
    ...gestes,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // Alignée (D387), la courbe n'a pas de cadre : aucune prise à tirer.
      const z = alignement ? null : prise.current;
      if (z && e.button <= 0) {
        const r = cadreCourbe.current?.getBoundingClientRect();
        const x = (e.clientX - (r?.left ?? 0)) * (r && r.width ? largeur / r.width : 1);
        const dans = (zz: { l: number; w: number }) => x >= Math.max(0, zz.l) && x <= zz.l + zz.w;
        const genre = dans(z.zones.fin) ? 'fin' : dans(z.zones.debut) ? 'debut' : null;
        if (genre) { if (lecture !== null) setLecture(null); z.tirer(genre, e); return; }
      }
      gestes.onPointerDown(e);
    }
  };

  // CRITIQUE-10 n° 6 (E11, D-195) : un doigt posé DANS la courbe, que Chrome rabat sur un bouton de tête voisin (ajustement tactile : à 390,
  // ⛶ prend un doigt de 16 px posé 2 à 4 px sous lui), reste un geste de la courbe. Le pointerdown garde ses coordonnées brutes : s'il tombe
  // dans la boîte de la courbe, il part vers elle (lecture au glissé, prises comprises) ; le bouton ne prend ni le focus ni le clic (avalé).
  const versCourbe = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cadreCourbe.current;
    if (graph || apercuC || !courbe || !el || e.button > 0) return;
    const r = el.getBoundingClientRect();
    if (!r.width || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    e.preventDefault();
    e.stopPropagation();
    gestesCourbe.onPointerDown({
      button: e.button, pointerId: e.pointerId, pointerType: e.pointerType, clientX: e.clientX, clientY: e.clientY, currentTarget: el, target: el,
      preventDefault: () => e.preventDefault(), stopPropagation: () => undefined
    } as unknown as React.PointerEvent<HTMLDivElement>);
  };

  const fermerLecture = () => { setLecture(null); if (vue === 'graph') onVue(vueAvant.current === 'graph' ? 'semaines' : vueAvant.current); };
  const fermerRef = useRef(fermerLecture);
  fermerRef.current = fermerLecture;
  // La lecture (c2-b) reste après le doigt levé, comme le jouable ; la courbe en grand (c3-a) aussi, jusqu'au × (E12, CRITIQUE-3 n° 25).
  // Un toucher hors de l'en-tête ferme la lecture ; un toucher hors de la courbe ferme la courbe en grand.
  useEffect(() => {
    if (lecture === null && !graph) return undefined;
    const dehors = (e: PointerEvent) => {
      const dedans = graph ? zone.current : racine.current;
      if (dedans && e.target instanceof Node && dedans.contains(e.target)) return;
      fermerRef.current();
    };
    document.addEventListener('pointerdown', dehors, true);
    return () => document.removeEventListener('pointerdown', dehors, true);
  }, [lecture, graph]);
  const premiereLecture = useRef(true);
  useEffect(() => {
    if (premiereLecture.current) { premiereLecture.current = false; return; }
    onLectureSemaine?.(lecture !== null && courbe ? courbe[lecture]?.lundi ?? null : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture]);

  // ---- Les gestes de la fenêtre ----
  const versAnnee = () => {
    if (!total) return;
    fenAvantAnnee.current = fenetre;
    taire('annee');
    // En Liste, la période change et la Liste reste : l'An s'y lit par sa fenêtre (anneeListe).
    if (!liste) onVue('annee');
    ecrire({ du: semainesTot[0].debut, semaines: Math.min(SEMAINES_ANNEE, total) });
  };
  const quitterAnnee = () => {
    const f = fenAvantAnnee.current ?? { du: semainesTot[0]?.debut ?? fenetre.du, semaines: 6 };
    fenAvantAnnee.current = null;
    if (!liste) onVue('semaines');
    ecrire(f);
  };
  const choisirDuree = (n: number) => {
    if (n >= SEMAINES_ANNEE) { versAnnee(); return; }
    const depart = annee ? (fenAvantAnnee.current ?? fenetre) : fenetre;
    const i0 = Math.max(0, semainesTot.findIndex(s => s.debut >= depart.du));
    const i = total >= n ? Math.min(i0, total - n) : i0;
    fenAvantAnnee.current = null;
    ecrire({ du: semainesTot[i]?.debut ?? depart.du, semaines: n });
    if ((annee || graph) && !liste) onVue('semaines');
  };

  // ---- Ce qui se lit ----
  const creux = apercuC ? creuxDepuis(apercuC) : (modele.creux ?? (base ? creuxDepuis(base) : null));
  const icones = modele.icones ?? [];
  const idees = useMemo(() => new Set(icones.filter(i => i.genre === 'idee').map(i => i.lundi)), [icones]);
  const semainesRetard = useMemo(() => new Set(icones.filter(i => i.genre === 'retard').map(i => i.lundi)), [icones]);
  const retards = modele.retards ?? [];
  const sansDate = modele.sansDate?.length ?? 0;
  const premiereSemaine = visibles[0]?.debut ?? fenetre.du;
  const plage = plageDe(premiereSemaine, ajouterJours(premiereSemaine, nombre * 7 - 1));
  const libelle = total ? libellePeriode(periode, { du: semainesTot[index]?.debut ?? fenetre.du, semaines: nombre }, semainesTot[0].debut, total, annee) : libelleDuree(nombre, annee);
  // La rangée d'un mouvement (sa couleur) et les noms mis de côté viennent des choses du modèle.
  const rangeeDe = useMemo(() => {
    const parMouvement = new Map<string, string>();
    const parChose = new Map<string, string>();
    for (const c of modele.choses ?? []) { parChose.set(c.id, c.rangee); for (const id of c.mouvements ?? []) parMouvement.set(id, c.rangee); }
    return (m: MouvementNomme) => parMouvement.get(m.id) ?? (m.choseId ? parChose.get(m.choseId) : undefined);
  }, [modele.choses]);
  const nomsMisDeCote = useMemo(() => (modele.choses ?? []).filter(c => c.miseDeCote).map(c => c.titre), [modele.choses]);

  // Un toucher sur une semaine donne sa date ; un deuxième toucher sur la même l'efface (E04, D-158).
  // La bulle part au prochain toucher hors d'elle (la frise comprise, avant que son geste ne commence), au premier défilement de 24 px, à
  // l'ouverture d'un détail et au début d'un glisser (E33, CRITIQUE-3 n° 7). Le toucher qui l'a chassée sur sa propre semaine ne la rouvre pas.
  const bulle = useRef<HTMLParagraphElement>(null);
  const chassee = useRef<{ lundi: string; t: number } | null>(null);
  const dateOuverte = info?.genre === 'date';
  useEffect(() => {
    if (!dateOuverte) return undefined;
    const y0 = window.scrollY;
    const fermer = () => { if (minuterie.current) clearTimeout(minuterie.current); minuterie.current = null; setInfo(i => (i?.genre === 'date' ? null : i)); };
    const touche0 = (e: PointerEvent) => {
      if (bulle.current && e.target instanceof Node && bulle.current.contains(e.target)) return;
      const lundi = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-lundi]')?.dataset.lundi : undefined;
      chassee.current = lundi ? { lundi, t: Date.now() } : null;
      fermer();
    };
    const defile = () => { if (Math.abs(window.scrollY - y0) > 24) fermer(); };
    document.addEventListener('pointerdown', touche0, true);
    window.addEventListener('scroll', defile, { passive: true, capture: true });
    return () => { document.removeEventListener('pointerdown', touche0, true); window.removeEventListener('scroll', defile, true); };
  }, [dateOuverte]);
  /* D385 : un jour touché (vue Jour, semaine dépliée) donne la sienne, « lun. 16 nov. · S47 » ; `colonnes` : le nombre de colonnes de sa bande */
  const touche = (lundi: string, colonne: number, texte = dateDeSemaine(lundi), colonnes = visibles.length) => {
    const c = chassee.current;
    chassee.current = null;
    if (c && c.lundi === lundi && Date.now() - c.t < 1500) return;
    if (info?.genre === 'date' && info.cle === lundi) {
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = null;
      setInfo(null);
      return;
    }
    montrer({ genre: 'date', texte, colonne, colonnes: Math.max(1, colonnes), cle: lundi }, 3000);
  };

  // La mise de côté nommée sur la courbe (E03) : celle du creux, sinon la plus haute (calendrierCaisse, A10).
  const miseCourbe = useMemo(() => {
    if (!base || apercuC) return null;
    const m = miseDeCoteVisible(base, creux);
    return m ? { i: m.index, centimes: m.centimes, titres: m.titres } : null;
  }, [base, apercuC, creux]);
  // Dans l'année, le cadre dit les mois (c1-d : « nov. – oct. »).
  // Les douze mois de la bande de l'année (le premier, puis onze de plus : « nov. – oct. »), pas le treizième que touche la 52e semaine.
  // CRITIQUE-5 n° 2 : la bande couvre toutes les semaines (13 mois quand la dernière tombe dans un treizième) ; le cadre nomme le premier et le
  // dernier mois, chacun celui du jeudi de sa semaine, l'année du dernier quand elle change (« nov. – nov. 2027 »).
  const etiquetteAnnee = total ? (() => {
    // `moisDeSemaine` lit le jeudi d'un lundi ; l'année se lit sur ce même jeudi.
    const premier = semainesTot[0].debut, dernier = semainesTot[total - 1].debut;
    const an = (lundi: string) => ajouterJours(lundi, 3).slice(0, 4);
    return `${MOIS_MIN[moisDeSemaine(premier)]} – ${MOIS_MIN[moisDeSemaine(dernier)]}${an(dernier) !== an(premier) ? ` ${an(dernier)}` : ''}`;
  })() : undefined;
  const lundis = useMemo(() => semainesTot.map(s => s.debut), [semainesTot]);

  // Les choses étoilées, sur leur marche (E31, CRITIQUE-3 n° 23) : le nom de leur mouvement sur la courbe, sinon leur titre à leur semaine.
  const etoilesCourbe = useMemo<EtoileCourbe[]>(() => {
    if (!base || !etoiles?.length) return [];
    const sem = base.semaines;
    return etoiles.flatMap(id => {
      const c = (modele.choses ?? []).find(x => x.id === id);
      if (!c) return [];
      const ids = new Set(c.mouvements ?? []);
      for (let i = 0; i < sem.length; i++) {
        const m = sem[i].mouvements.find(mv => ids.has(mv.id) || mv.choseId === id);
        if (m) return [{ nom: m.nom, i }];
      }
      const debut = (c as { debut?: string }).debut;
      const i = debut ? sem.findIndex(s => s.lundi === lundiDe(debut)) : -1;
      return i >= 0 ? [{ nom: c.titre, i }] : [];
    });
  }, [base, etoiles, modele.choses]);

  // Pendant le tirage d'une poignée, l'étiquette qui suit le doigt efface les noms qu'elle couvrirait (CRITIQUE-3 n° 24).
  const [tirage, setTirage] = useState<Boite | null>(null);

  // Le chiffre clé sur UNE ligne, comme z2s (« 113 CHF à dépenser · S24 ») ; la phrase entière est dans son nom accessible (E01, D-181).
  // CRITIQUE-5 n° 2 : la semaine du creux porte son année quand elle n'est pas celle d'aujourd'hui ; CRITIQUE-6 n° 1, en forme courte
  // (« S44 ’27 »). Rien ne se rogne jamais (D-114, E33) : quand la ligne ne tient pas (« −6 397 », un creux l'an prochain, l'An en paysage),
  // la semaine passe sous « CHF à dépenser », à droite du chiffre, sur la même hauteur de rangée (E43 : l'en-tête ne grandit pas).
  const semaineCreux = creux ? semaineCourte(creux.lundi, semainesTot[0]?.debut ?? creux.lundi) : '';
  const refCle = useRef<HTMLButtonElement>(null);
  const [empile, setEmpile] = useState(false);
  const [serre, setSerre] = useState(false);
  useLayoutEffect(() => {
    const el = refCle.current;
    if (!el) return undefined;
    const juger = () => {
      const [b, u, em] = Array.from(el.children) as HTMLElement[];
      if (!b || !u || !em || !el.clientWidth) return;
      // La largeur d'une ligne : les trois morceaux à leur taille naturelle (nowrap) et leurs deux écarts ; la même dans les deux formes.
      const bN = el.hasAttribute('data-serre') ? b.offsetWidth * 21 / 17 : b.offsetWidth;
      const ligne = bN + u.offsetWidth + em.offsetWidth + 8;
      setEmpile(ligne > el.clientWidth);
      /* paquet D n° 5 : empilé, « CHF à dépenser » finissait à 0,4 px du ± (vue Jour, 390) ; un montant plus long l'aurait chevauché. Repli :
         le montant passe de 21 à 17 px (`data-serre` ; la légende garde 14 px, plancher de B9), pour garder 4 px au moins. Mesuré à la taille normale (sans
         osciller) : le montant serré se rapporte à sa taille de 21 px. */
      setSerre(ligne > el.clientWidth && bN + Math.max(u.offsetWidth, em.offsetWidth) + 4 + 4 > el.clientWidth);
    };
    juger();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(juger);
    ro.observe(el);
    return () => ro.disconnect();
    // Le bouton est remonté quand la lecture au doigt se ferme : il se rejuge alors (lecture dans les dépendances).
  }, [semaineCreux, creux?.centimes, orientation, vue, courbe, lecture === null]);
  const cle = courbe && creux ? (
    <button ref={refCle} type="button" className="ent-k" data-ent-cle data-empile={empile ? '' : undefined} data-serre={empile && serre ? '' : undefined} aria-expanded={creuxOuvert}
      aria-label={`${chf(creux.centimes)} CHF à dépenser sans passer sous 0 (${semaineCreux}) : voir ses causes`} onClick={() => setCreuxOuvert(o => !o)}>
      <b className={creux.centimes < 0 ? 'ent-neg' : undefined}>{chf(creux.centimes)}</b><span className="ent-k-u">CHF à dépenser</span><em><span className="ent-k-sep">· </span>{semaineCreux}</em>
    </button>
  ) : <span className="ent-k ent-k-vide" />;

  // D387, D388 : la part de la courbe posée sur la frise (index `d` à `d + m` de l'année) ; le creux, la mise de côté et les étoiles s'y décalent.
  const vueAl = alignement && base ? (() => {
    const d = alignement.debut, m = alignement.abscisses.length - 1;
    const dedans = (i: number) => i >= d && i < d + m;
    return {
      d, m, sem: base.semaines.slice(d, d + m), ap: zoomee && apercuC ? apercuC.semaines.slice(d, d + m) : null,
      creuxIndex: creux && dedans(creux.index) ? creux.index - d : null,
      mise: miseCourbe && dedans(miseCourbe.i) ? { ...miseCourbe, i: miseCourbe.i - d } : null,
      etoiles: etoilesCourbe.filter(e => dedans(e.i)).map(e => ({ ...e, i: e.i - d }))
    };
  })() : null;
  // D388, la ligne du jouable : « si tu lâches en S51 : S50 5 120 → 4 480 » (la semaine d'arrivée, la première qui change, avant → après).
  // `d` : l'index de la première semaine montrée (celui de l'alignement de la courbe, ou de l'en-tête entier en paysage).
  const lacherDe = (d: number) => {
    if (!base || !apercuC) return undefined;
    const av = base.semaines, ap = apercuC.semaines;
    let ich = -1;
    for (let i = 0; i < Math.min(av.length, ap.length); i++) if (av[i].libre !== ap[i].libre) { ich = i; break; }
    const il = lache ? av.findIndex(s => s.lundi === lundiDe(lache)) : -1;
    return {
      colonne: il >= 0 ? il - d : null, numero: il >= 0 ? av[il].numero : null,
      change: ich >= 0 ? { colonne: ich - d, numero: av[ich].numero, avant: av[ich].libre, apres: ap[ich].libre } : null
    };
  };
  const lacherZoom = vueAl?.ap ? lacherDe(vueAl.d) : undefined;
  const zoomTout = alignementTout && base && apercuC && frise ? (() => {
    const d = alignementTout.debut, m = alignementTout.abscisses.length - 1;
    return { d, avant: base.semaines.slice(d, d + m).map(s => s.libre), apres: apercuC.semaines.slice(d, d + m).map(s => s.libre), lacher: lacherDe(d) };
  })() : null;

  return (
    <div ref={racine} className={`ent ent--${orientation}`} data-vue={vue} data-doigt={doigt ? 'oui' : undefined} data-aligne={paysageAligne ? 'oui' : undefined}
      data-bouton-al={boutonAligne ? '' : undefined} data-calendrier-entete aria-label="En-tête du calendrier" role="group">
      <div className="ent-t" onPointerDownCapture={versCourbe}>
        {lecture !== null && !graph && courbeC ? <LectureTete courbe={courbeC} index={lecture} boutons={paysage ? undefined : boutonsTete} /> : cle}
        <span ref={boutonsTete} className="ent-t-b">
          <button type="button" className="ent-mb" aria-pressed={mouvements} title="Afficher les + et − et les icônes de chaque semaine" onClick={() => onMouvements(!mouvements)}>±</button>
          <button ref={boutonPeriode} type="button" className="ent-per" data-ent-periode aria-haspopup="dialog" aria-expanded={menuOuvert} title="Période, liste, tri et filtre"
            aria-label={`${props.echelle === 'jour' && !annee ? `${libelle} · j` : libelle} · période, liste, tri et filtre`} onClick={() => setMenuOuvert(o => !o)}>
            {props.echelle === 'jour' && !annee ? `${libelle} · j` : libelle}<ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
          {retards.length > 0 && (
            <button type="button" className="ent-ret-b" aria-label={titreRetards(retards.length)} onClick={() => setRetardsOuverts(true)}><Clock size={16} strokeWidth={2.4} aria-hidden="true" />{retards.length}</button>
          )}
          {boutonAligne && (
            <button type="button" className="ent-al" data-ent-aligne aria-pressed={!!props.aligne} aria-label="Aligner la courbe sur la frise"
              title={props.aligne ? 'La courbe suit la frise ; éteint, elle montre l’année' : 'Aligner la courbe sur la frise'} onClick={() => props.onAligne?.(!props.aligne)}>
              <Ruler size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
          {props.onCourbeCachee && base && !graph && (
            <button type="button" className="ent-cc" data-ent-cacher aria-pressed={cachee} aria-label={cachee ? 'Montrer la courbe' : 'Cacher la courbe'}
              title={cachee ? 'Montrer la courbe' : 'Cacher la courbe : le calendrier prend la place'} onClick={() => props.onCourbeCachee?.(!props.courbeCachee)}>
              {cachee ? <ChartLine size={17} strokeWidth={2.2} aria-hidden="true" /> : <EyeOff size={17} strokeWidth={2.2} aria-hidden="true" />}
            </button>
          )}
          {/* Paquet G n° 8 (CAL-RETOUR-PLEIN, 19.11 : « mettre un highlights sur le bouton pour revenir normal ») : en plein écran seulement, le
              retour prend le fond d'accent et une icône contrastée, deux thèmes ; aucun texte ajouté. */}
          <button type="button" className={plein ? 'ent-pl ent-pl--plein' : 'ent-pl'} data-plein={plein ? '' : undefined} aria-label={plein ? 'Quitter le plein écran' : 'Plein écran'} onClick={() => { void basculerPlein(); }}>
            {plein ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
          </button>
        </span>
      </div>

      <div ref={zone} className="ent-cbz">
        {graph && courbeC && courbe ? (
          <GrandeCourbe courbe={courbeC} rangeeDe={rangeeDe} largeur={largeur} hauteur={hauteurGrande} paysage={paysage} lecture={lecture} onFermer={fermerLecture} reference={refGrande} gestes={gestesGrande} />
        ) : courbe && base && cachee ? null : courbe && base && vueAl && alignement ? (
          <Courbe courbe={vueAl.sem} abscisses={alignement.abscisses} creuxIndex={vueAl.creuxIndex} largeur={largeur} hauteur={hauteur}
            curseur={lecture !== null && !apercuC ? lecture - vueAl.d : null} reference={refCourbe} gestes={apercuC ? undefined : gestesCourbe}
            mise={vueAl.mise} mois moisEnHaut etoiles={vueAl.etoiles} {...(paysageAligne ? { rangeeHaute: { hauteur: RANGEE_CHIFFRE_PAYSAGE, reserves } } : {})}>
            {vueAl.ap && !zoomTout && (
              <div className="ent-zoom-c" data-zoom-aligne style={{ height: hauteur }}>
                <CourbeZoom avant={vueAl.sem.map(s => s.libre)} apres={vueAl.ap.map(s => s.libre)} abscisses={alignement.abscisses} largeur={largeur} hauteur={hauteur} lacher={lacherZoom} />
              </div>
            )}
          </Courbe>
        ) : courbe && base ? (
          <Courbe courbe={courbe} largeur={largeur} hauteur={hauteur} curseur={lecture} reference={refCourbe} gestes={apercuC ? undefined : gestesCourbe} mise={miseCourbe}
            mois={false} moisEnHaut plate={plate && !paysage} etoiles={etoilesCourbe} masque={apercuC ? null : tirage}
            cadre={apercuC ? undefined : { index, nombre, etiquette: etiquetteCadre(semainesTot.map(s => s.numero), index, nombre, annee, etiquetteAnnee, lundis) }}>
            {apercuC ? (
              <div className="ent-zoom-c" style={{ height: hauteur }}>
                <CourbeZoom avant={base.semaines.slice(index, index + nombre).map(s => s.libre)} apres={apercuC.semaines.slice(index, index + nombre).map(s => s.libre)} largeur={largeur} hauteur={hauteur - HAUTEUR_MOIS + 8} />
              </div>
            ) : (
              <Cadre numeros={semainesTot.map(s => s.numero)} lundis={lundis} index={index} nombre={nombre} largeur={largeur} annee={annee}
                onChange={c => ecrire({ du: semainesTot[c.index].debut, semaines: c.nombre })} onAnnee={versAnnee} onRevient={quitterAnnee}
                onTropCourt={() => dire({ genre: 'annee', texte: MESSAGE_ANNEE })} onTirage={setTirage} etiquetteAnnee={etiquetteAnnee} prise={prise} />
            )}
          </Courbe>
        ) : base === null ? (
          // CRITIQUE-5 n° 24 : la phrase et le lien dans un seul élément en ligne ; enfants directs d'une boîte flex, l'espace finale de la
          // phrase était retirée au rendu (« dansFinances › Solde »).
          <p className="ent-inconnu">
            <span>
              Solde de départ inconnu : à régler dans{' '}
              <a className="ent-lien" href="#finances" onClick={e => { e.preventDefault(); onOuvrirFinances?.(); }}>Finances › Solde</a>
            </span>
          </p>
        ) : null}
      </div>

      {!graph && (
        <div className="ent-bz">
          {annee && courbe ? <BandeAnnee courbe={courbe} mois={modele.mois} creux={creux} /> : vue === 'semaines' && props.colonnes && props.echelle && (props.echelle !== 'semaine' || props.deplie) ? (
            <BandeColonnes colonnes={props.colonnes} echelle={props.echelle} aujourdhui={props.aujourdhui} deplie={props.deplie ?? null} onDeplier={props.onDeplier} onIdeeSemaine={onIdeeSemaine}
              onJour={(jour, colonne, n) => touche(jour, colonne, `${jourEntier(jour)} · ${etiquetteS(jour)}`, n)}
              onSemaine={(lundi, colonne, n) => touche(lundi, colonne, dateDeSemaine(lundi), n)} />
          ) : (
            <BandeSemaines semaines={visibles} courbe={courbe} decalage={index} mouvements={mouvements} idees={idees} retards={semainesRetard} onDate={touche} onIdeeSemaine={onIdeeSemaine}
              {...(props.onDeplier && vue === 'semaines' ? { onDeplier: props.onDeplier } : {})}
              largeurColonne={largeurColonne > 0 ? largeurColonne : largeur / Math.max(1, nombre)} />
          )}
          {/* La date d'une semaine (i3) : au-dessus de la bande, dans l'en-tête ; jamais sur un nom de la frise (CRITIQUE-3 n° 7). */}
          <div className="ent-live ent-live-date" aria-live="polite">
            {info?.genre === 'date' && <p ref={bulle} className="ent-info ent-info--date" data-info="date"
              style={{ left: `clamp(80px, ${(((info.colonne ?? 0) + 0.5) / (info.colonnes ?? 1)) * 100}%, calc(100% - 80px))` }}>{info.texte}</p>}
          </div>
        </div>
      )}

      {lecture !== null && !graph && courbeC && <div className="ent-lu"><LectureDetail courbe={courbeC} index={lecture} rangeeDe={rangeeDe} /></div>}
      <div className="ent-live" aria-live="polite">
        {info && info.genre !== 'date' && <p className={`ent-info ent-info--${info.genre}`} data-info={info.genre}>{info.texte}</p>}
      </div>

      {creuxOuvert && courbe && creux && <DetailCreux courbe={courbe} index={creux.index} hypotheses={modele.hypotheses} nomsMisDeCote={nomsMisDeCote} dates={paysage} onOuvrirFinances={onOuvrirFinances} onFermer={() => setCreuxOuvert(false)} />}
      {menuOuvert && (
        <MenuPeriode ancre={boutonPeriode.current} paysage={paysage} plage={libelle !== libelleDuree(nombre, annee) ? `${libelle} · ${etiquetteCadre(semainesTot.map(s => s.numero), index, nombre, annee, etiquetteAnnee, lundis)} · ${plage}` : plage} semaines={nombre} annee={annee} liste={liste} sansDate={sansDate}
          {...(props.onEchelle && props.echelle ? { echelle: props.echelle, onEchelle: props.onEchelle } : {})}
          onChoisir={choisirDuree} onListe={() => onVue('liste')} onCalendrier={() => onVue(anneeListe ? 'annee' : 'semaines')} onSansDate={() => onVue('liste', 'sans-date')}
          onTrier={onTrier} onFiltrer={onFiltrer} onFermer={() => setMenuOuvert(false)} />
      )}
      {retardsOuverts && <Retards retards={retards} onOuvrir={onOuvrirRetard} onFermer={() => setRetardsOuverts(false)} />}
      {zoomTout && alignementTout && frise && (
        <div className="ent-zoom-tout" data-zoom-aligne data-zoom-tout style={{ height: frise.hautEnt }}>
          <CourbeZoom avant={zoomTout.avant} apres={zoomTout.apres} abscisses={alignementTout.abscisses} largeur={frise.largEnt} hauteur={frise.hautEnt} lacher={zoomTout.lacher} />
        </div>
      )}
    </div>
  );
}
