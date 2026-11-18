/**
 * Banc du carnet d'idées : `?preview=carnets` (dev seulement, absent du paquet : `main.tsx` ne l'importe que sous `import.meta.env.DEV`).
 * **Banc — données simulées** : magasin mémoire, IA simulée, fixture « ZZ TEST — … » (noms fictifs, liens `exemple.invalid`, prix
 * d'exemple, aucune relève). Rien n'est écrit dans Firestore.
 *
 * Le banc rend Stocks › Matériel tel qu'il est (R08, p2:h05-9) : le segment « À venir · Carnets · Réalisés », avec l'`UpgradeWorkspace`
 * de l'app sous À venir et Réalisés. Pour qu'il lise les plans de la fixture, le banc pose `dev-local` dans l'adresse (le cache mémoire de
 * `FirestoreRepo`, même mode que `?dev-local` : aucune écriture ne part), puis y range plans, dépense et paiement d'exemple, et le reflet
 * des carnets du magasin mémoire (« Ouvrir le carnet », « du carnet … · supprimé »). Le segment Parc de l'app n'y est pas : le banc n'a
 * pas de parc.
 *
 * Paramètres, et l'état qu'ils ouvrent :
 * - `&vide=1` : aucun carnet (Créer · avant, p2:i02-2) ; `&zero=1` : le même départ vide, pour jouer le scénario D-63 de zéro (créer,
 *   puis frigo, ventilation, évier) ;
 * - `&g8=1` : Ventilation reçoit un critère mesurable que les deux premiers articles n'ont pas (la bulle G8 « peut trancher » paraît au focus du
 *   champ) ; `&g35=1` : une 2e idée de ventilation existe (G35 « déplacer les articles en veille dans … ») ;
 * - `&hors-ligne=1` : hors ligne, rangé sur l'appareil ;
 * - `&ia=eteint` : sans IA (analyse locale seule) ; `&ia=echec` : l'IA simulée tombe en panne ; `&ia=lent` : elle met 4 s, et la
 *   lecture d'une page aussi ;
 * - `&theme=sombre` | `&theme=clair` ; `&aides=0` : aides non classées éteintes, comme en production ;
 * - `&taches=1` : cinq tâches chronométrées (D-36, R41) ;
 * - `&realise=1` : l'Embouteillage envoyé dans À venir puis payé (dépense d'exemple) ; le banc s'ouvre sur **Réalisés** (états 30, 31,
 *   47) ; « Ouvrir le carnet » le rouvre (D-47b) ;
 * - `&lien-retient=a-venir` : le carnet Frigo ouvert, son plan dans À venir le retient (Supprimer : « 1 lien le retient », « Garder le
 *   plan sans ce carnet » ; pastille « Dans À venir depuis le 16 nov. · Voir », états 29, 49, 50) ;
 * - `&lien-retient=realise` : l'Embouteillage ouvert, son plan payé le retient (Supprimer : « Archiver » seul ; états 38, 55) ;
 * - `&adr=1` : le Frigo ouvert sur son choix revu (« Choix d'avant · 1 », ADR ; état 17) ;
 * - `&articles=1` | `&articles=2` : Ventilation, le carnet de comparaison, réduite à 1 article (pas de tableau) ou à 2 (le tableau
 *   naît, G20), ouverte (état 52).
 *
 * Liens à coller (pages simulées, `iaSimulee.ts`, lues en 1,5 s pour voir le squelette g5:v03-10) :
 * `https://exemple.invalid/hotte-140` (dans Ventilation : carte complète g5:v06-10, « tient 80 °C : oui »),
 * `https://exemple.invalid/pompe-inox` puis `…/pompe-magnetique` (depuis la liste : g5:v06-10, puis le tableau naît, g5:v06-11),
 * `https://exemple.invalid/evier-riviera` (G19), la puce `https://exemple.invalid/plaque-froid/echangeur-30` (R15), les liens des
 * articles de la fixture (`…/v1` à `…/v6`, `…/e1`…, `…/f1`…) ; seul `https://exemple.invalid/v5` est volontairement illisible (état 21).
 * Phrases : « attendre l’avis du ferblantier sur la hotte » dans Ventilation répète une note (G11, « Garder à part », état 12) ;
 * Ventilation › ✎ Renommer porte le titre proposé (G29, R46, état 34).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CreativeItem } from '../types';
import type { FinanceTransaction, FinancialPlan } from '../domain/finance/types';
import { magasinMemoire, type MagasinCarnets } from '../services/carnetsStore';
import { fixtureCarnets, fixturePlanRealise, fixturePlans, NOTE_EN_VRAC_BANC, ID_DENSIMETRE, ID_EMBOUTEILLAGE, ID_EVIER, ID_EXTRACTION, ID_FRIGO, ID_VENTILATION } from '../domain/carnets/fixture';
import { DELAI_LECTURE_BANC, lireLienSimule } from '../domain/carnets/iaSimulee';
import { aidesCarnet, comportementSimule, type AidesCarnet, type ComportementSimule, type ModeCarnetIA } from '../config/carnetIA';
import { appelsSimules, type AppelsIA } from '../ui/carnets/rangement';
import { CarnetsVue, type FinancesCarnet } from '../ui/carnets/CarnetsVue';
import { BARRE_MATERIEL, BARRE_SUR_DEFILEMENT, UpgradeWorkspace } from '../ui/finance/UpgradeWorkspace';
import { FirestoreRepo } from '../services/firestoreRepo';
import { FinanceService } from '../services/financeService';
import { StorageService } from '../services/storage';
import { useStorageValue } from '../hooks/useLiveData';
import { isUpgradePlan } from '../domain/finance/upgrades';
import { estRealise } from '../domain/finance/upgradeRing';
import { ACTION_CARNETS, plusMenuFor, type PlusCle } from '../domain/plusEcran';
import { fabActionFor } from '../domain/fabActions';
import { BottomNav } from '../components/BottomNav';
import { FloatingActions } from '../ui/FloatingActions';

const param = (nom: string) => new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get(nom);
const SANS_FINANCES: FinancesCarnet = { plans: [], transactions: [], payments: [] };

/* ───── Paramètres du banc ───── */

export type SegmentBanc = 'avenir' | 'carnets' | 'realises';
export interface ParametresBanc {
  vide: boolean;
  horsLigne: boolean;
  mode: ModeCarnetIA;
  /** La variante « plan réalisé » de la fixture (Embouteillage payé). */
  realise: boolean;
  /** 1 ou 2 : Ventilation réduite (état 52). */
  articles?: 1 | 2;
  /** Critique 5, n° 21 et 27 : les options `g8` et `g35` de la fixture, par l'adresse. */
  g8?: boolean;
  g35?: boolean;
  /** Le carnet ouvert d'entrée. */
  ouvrir?: string;
  /** Le segment d'entrée de Stocks › Matériel. */
  segment: SegmentBanc;
  /** `&texte=…` : le champ arrive rempli (un état « pendant » atteint par l'adresse). */
  texte?: string;
}

/** `&ouvrir=<nom>` : le carnet de la fixture ouvert d'entrée. */
const CARNETS_BANC: Record<string, string> = {
  ventilation: ID_VENTILATION, evier: ID_EVIER, embouteillage: ID_EMBOUTEILLAGE, frigo: ID_FRIGO, densimetre: ID_DENSIMETRE, extraction: ID_EXTRACTION
};

/**
 * Critique 5, correction 12 : chaque état que la critique n'a pas atteint (n° 13 à 18), avec son adresse et les gestes qui y mènent.
 * Les gestes se jouent au doigt (390 tactile) comme à la souris (1280) ; les captures de la voie corr5-D suivent cette liste.
 */
export const ETATS_BANC: readonly { d: string; capture: string; adresse: string; gestes: readonly string[] }[] = [
  { d: 'D-35', capture: '23p', adresse: '?preview=carnets',
    gestes: ['coller « https://exemple.invalid/pompe-inox » · Ajouter (un carnet « Pompe… » naît et s’ouvre)',
      'coller « https://exemple.invalid/pompe-magnetique » · Ajouter', 'la puce « ✻ Comparer sur … · Ajouter » paraît sous le bandeau ; la toucher'] },
  { d: 'D-63', capture: 'zero-0 à zero-4', adresse: '?preview=carnets&zero=1',
    gestes: ['zero-0 : la liste vide', 'zero-1 : « frigo de garde pour 6 fûts » · Ajouter', 'zero-2 : ‹ Carnets, « ventilation de la salle de brassage » · Ajouter',
      'zero-3 : ‹ Carnets, « évier 2 bacs pour laver les fûts » · Ajouter', 'zero-4 : ‹ Carnets (3 carnets)'] },
  { d: 'D-131', capture: '05/04', adresse: '?preview=carnets&texte=hotte%20au-dessus%20de%20la%20cuve',
    gestes: ['le cadre « Nouveau carnet · ↓ arrive ici » et « ✻ Déjà un carnet proche : Ventilation de la salle de brassage · Y ajouter en façon »',
      'toucher « Y ajouter en façon » : Ventilation s’ouvre'] },
  { d: 'D-118', capture: '32b', adresse: '?preview=carnets&ouvrir=ventilation',
    gestes: ['··· d’une note › Modifier : « ✎ Se modifie ici » à la place de la note, le texte dans le champ', 'changer le texte · Enregistrer : « ✓ Note modifiée · Annuler »'] },
  { d: 'D-120', capture: '35b et 35c', adresse: '?preview=carnets&ouvrir=ventilation',
    gestes: ['··· d’une note › Supprimer : « Note supprimée · Annuler » à sa place (35b)', 'Annuler : la note revient, plus aucun bandeau (35c)'] },
  /* Critique 6 (lot C) : 14b et 15b collent une adresse que la lecture simulée connaît (jamais `hotte-inox-80c` ni `hotte-2`, qui
     tombent en « page non lue ») ; 19b fait naître le tableau au 2e lien d'un carnet né d'un lien (G20). */
  { d: 'D-27, G20', capture: '14b et 15b', adresse: '?preview=carnets&ouvrir=ventilation',
    gestes: ['coller « https://exemple.invalid/hotte-140 » · Ajouter : la carte complète (g5:v06-10), « tient 80 °C : oui »'] },
  { d: 'G20', capture: '19b', adresse: '?preview=carnets',
    gestes: ['coller « https://exemple.invalid/pompe-inox » · Ajouter (le carnet né du lien s’ouvre)', 'coller « https://exemple.invalid/pompe-magnetique » · Ajouter : le tableau naît'] },
  /* Doute de la critique 6 : la note du banc tapée à la main portait une pompe à « 1 800 m³/h » ; une pompe de brasserie débite 2 à
     5 m³/h. La note à taper est `NOTE_EN_VRAC_BANC` (fixture), aux valeurs plausibles. */
  { d: 'D-139, D-140', capture: '22 et 23', adresse: '?preview=carnets',
    gestes: [`taper la note en vrac « ${NOTE_EN_VRAC_BANC.replace(/\n/g, ' / ')} » · Ajouter`] },
  { d: 'D-46', capture: '55', adresse: '?preview=carnets&lien-retient=a-venir',
    gestes: ['le Frigo ouvert : pastille « À venir · … » sous le titre', 'la toucher : l’aperçu « dans À venir · depuis le … » et « Ouvrir dans À venir »'] }
];

/** Lit l'adresse du banc (voir l'en-tête) : quel jeu de données, quel carnet ouvert, quel segment. */
export function lireParametresBanc(search: string): ParametresBanc {
  const q = new URLSearchParams(search);
  const n = Number(q.get('articles'));
  const articles = n === 1 || n === 2 ? n : undefined;
  const retient = q.get('lien-retient');
  const texte = q.get('texte') ?? undefined;
  const ouvrir = CARNETS_BANC[q.get('ouvrir') ?? ''] ? CARNETS_BANC[q.get('ouvrir')!]
    : articles ? ID_VENTILATION
    : retient === 'a-venir' ? ID_FRIGO
      : retient === 'realise' ? ID_EMBOUTEILLAGE
        : q.get('adr') === '1' ? ID_FRIGO
          : undefined;
  return {
    /* `&zero=1` (D-63, P24) : son scénario de zéro, sans fixture : aucun carnet, aucun plan, aucune dépense ; tout naît de ses gestes */
    vide: q.get('vide') === '1' || q.get('zero') === '1',
    horsLigne: q.get('hors-ligne') === '1',
    mode: q.get('ia') === 'eteint' ? 'eteint' : 'simule',
    realise: q.get('realise') === '1' || retient === 'realise',
    ...(articles ? { articles } : {}),
    ...(q.get('g8') === '1' ? { g8: true } : {}),
    ...(q.get('g35') === '1' ? { g35: true } : {}),
    ...(ouvrir ? { ouvrir } : {}),
    ...(texte ? { texte } : {}),
    segment: q.get('realise') === '1' && !ouvrir ? 'realises' : 'carnets'
  };
}

/** Le jeu de départ : idées et messages, plans, dépense et paiement (tous « ZZ TEST — … », exemple). */
export function departBanc(o: { vide?: boolean; realise?: boolean; articles?: number; g8?: boolean; g35?: boolean; items?: CreativeItem[] }): { items: CreativeItem[]; finances: FinancesCarnet } {
  if (o.items) return { items: o.items, finances: SANS_FINANCES };
  if (o.vide) return { items: [], finances: SANS_FINANCES };
  if (o.realise) {
    const r = fixturePlanRealise();
    const reduite = o.articles ? fixtureCarnets({ articles: o.articles }).find(d => d.id === ID_VENTILATION) : undefined;
    const items = reduite ? r.items.map(d => (d.id === ID_VENTILATION ? reduite : d)) : r.items;
    return { items, finances: { plans: r.plans, transactions: r.transactions, payments: r.payments } };
  }
  return { items: fixtureCarnets({ articles: o.articles, ...(o.g8 ? { g8: true } : {}), ...(o.g35 ? { g35: true } : {}) }), finances: { plans: fixturePlans(), transactions: [], payments: [] } };
}

/** Les appels du banc : le rangement simulé de l'app, et `lireLien` simulé lent (1,5 s ; 4 s en `&ia=lent`) pour voir le squelette. */
export function appelsBanc(comportement: ComportementSimule, delaiLecture = comportement === 'lent' ? 4000 : DELAI_LECTURE_BANC): AppelsIA {
  const base = appelsSimules(comportement);
  return { ranger: base.ranger, lire: (url, signal) => lireLienSimule(url, { delaiMs: delaiLecture, signal }) };
}

/* ───── Le cache mémoire de l'app (`dev-local`), pour l'UpgradeWorkspace d'À venir et de Réalisés ───── */

const devLocal = () => import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local');
type Collection = 'creativeItems' | 'financialPlans' | 'transactions' | 'financialPayments';
/** Écrit dans le cache mémoire seulement : sans `dev-local`, rien (jamais une écriture qui partirait vers Firestore). */
function poserBanc(nom: Collection, id: string, doc: unknown) { if (devLocal()) FirestoreRepo.put(nom, id, doc); }
function retirerBanc(nom: Collection, id: string) { if (devLocal()) FirestoreRepo.remove(nom, id); }

/** Pose `dev-local` dans l'adresse (banc, dev seulement), puis range le jeu de départ dans le cache. `false` si le cache est hors d'atteinte. */
function semerCache(depart: { items: CreativeItem[]; finances: FinancesCarnet }): boolean {
  if (!import.meta.env.DEV || typeof location === 'undefined') return false;
  if (!devLocal()) {
    const q = new URLSearchParams(location.search);
    q.set('dev-local', '1');
    history.replaceState(history.state, '', `${location.pathname}?${q.toString()}${location.hash}`);
  }
  if (!devLocal()) return false;
  for (const d of depart.items) if (d.type === 'carnet') poserBanc('creativeItems', d.id, d);
  for (const p of depart.finances.plans) poserBanc('financialPlans', p.id, p);
  for (const t of depart.finances.transactions) poserBanc('transactions', t.id, t);
  for (const pay of depart.finances.payments) poserBanc('financialPayments', pay.id, pay);
  return true;
}

/** Le reflet des carnets du magasin mémoire dans le cache : « Ouvrir le carnet » ou « du carnet … · supprimé » dans À venir. */
function refleterCarnets(magasin: MagasinCarnets) {
  const carnets = magasin.lire().filter(d => d.type === 'carnet');
  const ids = new Set(carnets.map(d => d.id));
  for (const d of carnets) poserBanc('creativeItems', d.id, d);
  for (const d of StorageService.getCreativeItems()) if (d.type === 'carnet' && !ids.has(d.id)) retirerBanc('creativeItems', d.id);
}

const lireFinancesCache = (): FinancesCarnet => ({
  plans: FinanceService.getPlans(), transactions: StorageService.getTransactions() as unknown as FinanceTransaction[], payments: FinanceService.getPayments()
});
/** Les comptes du segment, la règle même de Stocks › Matériel (`readSegments`, StocksTab). */
const lireComptes = () => {
  const { plans, payments } = FinanceService.snapshot();
  const transactions = StorageService.getTransactions() as unknown as FinanceTransaction[];
  const projets = plans.filter(isUpgradePlan);
  const realise = (p: (typeof projets)[number]) => ['draft', 'active'].includes(p.status) && estRealise(p, transactions, payments);
  return {
    avenir: projets.filter(p => ['draft', 'active'].includes(p.status) && !realise(p)).length,
    realises: projets.filter(p => p.status === 'completed' || realise(p)).length,
    carnets: StorageService.getCreativeItems().filter(i => i.type === 'carnet' && !(i as { carnet?: { archive?: unknown } }).carnet?.archive).length
  };
};

/* ───── Le banc ───── */

export interface BancCarnetsProps {
  vide?: boolean;
  horsLigne?: boolean;
  mode?: ModeCarnetIA;
  appels?: AppelsIA;
  aides?: AidesCarnet;
  /** La variante « plan réalisé » de la fixture (Suppression v2, archiver). */
  realise?: boolean;
  /** 1 ou 2 : Ventilation réduite (état 52). */
  articles?: number;
  items?: CreativeItem[];
  /** Magasin fourni (la page du banc) ; sinon un magasin mémoire sur la fixture. */
  magasin?: MagasinCarnets;
  /** Finances fournies (la page : le cache de l'app) ; sinon tenues en mémoire ici. */
  finances?: FinancesCarnet;
  ecrirePlan?: (plan: FinancialPlan) => void;
  ouvrir?: { id: string; at: number } | null;
  /** « Nouvelle idée » du + volant (R28) : un horodatage neuf met le focus dans le champ du bas, comme dans l'app (StocksTab). */
  focusChamp?: number | null;
  onVoirAVenir?: () => void;
  onVoirRealises?: () => void;
  onPlan?:(plan: FinancialPlan) => void;
  /** `&texte=…` : le champ arrive rempli. */
  texte?: string;
}

/** Le banc lui-même (aussi monté par `carnetsParcours.test.tsx`) : magasin mémoire, plans en mémoire, IA simulée. */
export function BancCarnets(p: BancCarnetsProps) {
  const depart = useMemo(() => departBanc(p), []); // eslint-disable-line react-hooks/exhaustive-deps
  const magasin = useMemo(() => p.magasin ?? magasinMemoire(depart.items), [depart]); // eslint-disable-line react-hooks/exhaustive-deps
  const [financesLocales, setFinances] = useState<FinancesCarnet>(depart.finances);
  const finances = p.finances ?? financesLocales;
  const [avis, setAvis] = useState<string | null>(null);
  const mode = p.mode ?? 'simule';
  return (
    <div data-banc-carnets className="flex h-full min-h-0 flex-col">
      <CarnetsVue className="min-h-0 flex-1" magasin={magasin} finances={finances} mode={mode}
        appels={p.appels ?? appelsSimules(comportementSimule())} aides={p.aides ?? aidesCarnet(mode, {}, param('aides'))} horsLigne={p.horsLigne}
        ouvrir={p.ouvrir} focusChamp={p.focusChamp} onVoirAVenir={p.onVoirAVenir} onVoirRealises={p.onVoirRealises} {...(p.texte ? { texteInitial: p.texte } : {})}
        ecrirePlan={plan => {
          p.onPlan?.(plan);
          if (p.ecrirePlan) p.ecrirePlan(plan);
          else setFinances(f => ({ ...f, plans: [...f.plans.filter(x => x.id !== plan.id), plan] }));
        }}
        onMessage={setAvis} />
      {avis && <p role="status" className="px-3 py-1 text-sm text-cave-200">{avis}</p>}
      <p hidden data-plans>{finances.plans.map(x => `${x.id}|${x.upgrade?.sourceCarnetTitre ?? ''}`).join(';')}</p>
    </div>
  );
}

const LIBELLES: Record<SegmentBanc, string> = { avenir: 'À venir', carnets: 'Carnets', realises: 'Réalisés' };

/** La page `?preview=carnets` : bandeau « Banc — données simulées », thème, tâches, segment de Stocks › Matériel. */
export function CarnetsPreview() {
  const zone = useRef<HTMLDivElement>(null);
  const taches = param('taches') === '1';
  const prm = useMemo(() => lireParametresBanc(typeof location === 'undefined' ? '' : location.search), []);
  const depart = useMemo(() => departBanc(prm), [prm]);
  const magasin = useMemo(() => magasinMemoire(depart.items), [depart]);
  // Le cache est semé avant le premier rendu de l'UpgradeWorkspace (idempotent : StrictMode rejoue l'initialiseur).
  const [cache] = useState(() => semerCache(depart));
  const financesCache = useStorageValue(lireFinancesCache);
  const comptes = useStorageValue(lireComptes);
  const [segment, setSegment] = useState<SegmentBanc>(prm.segment);
  const [ouvrir, setOuvrir] = useState<{ id: string; at: number } | null>(prm.ouvrir ? { id: prm.ouvrir, at: 1 } : null);
  const appels = useMemo(() => appelsBanc(comportementSimule()), []);
  const ecrirePlan = useCallback((plan: FinancialPlan) => poserBanc('financialPlans', plan.id, plan), []);

  useEffect(() => {
    if (param('theme') === 'sombre') document.documentElement.setAttribute('data-theme', 'cave');
    else if (param('theme') === 'clair') document.documentElement.removeAttribute('data-theme');
  }, []);
  useEffect(() => (cache ? magasin.ecouter(() => refleterCarnets(magasin)) : undefined), [cache, magasin]);

  const n = (s: SegmentBanc) => (s === 'avenir' ? comptes.avenir : s === 'realises' ? comptes.realises : comptes.carnets);
  /* Le + volant de l'app (R28, p2:g05-1 ; d1280-5, m390-4b) : le composant même, avec le menu que l'app lui donne sur cet écran. Sur Carnets,
     « Nouvelle idée » met le focus dans le champ du bas (StocksTab, `focusChamp`) ; ailleurs, le banc dit ce que l'app ouvrirait. */
  const [focusChamp, setFocusChamp] = useState<number | null>(null);
  const [renvoi, setRenvoi] = useState<string | null>(null);
  const surCarnets = segment === 'carnets';
  const menuPlus = useMemo(() => plusMenuFor('stocks', (surCarnets ? 'carnets' : 'materiel') as Parameters<typeof plusMenuFor>[1]), [surCarnets]);
  const actionPlus = surCarnets ? ACTION_CARNETS : fabActionFor('stocks', 'materiel');
  const lancerPlus = (cle: PlusCle | 'ecran') => {
    if (cle === 'ecran' && surCarnets) { setRenvoi(null); setFocusChamp(Date.now()); return; }
    const ligne = cle === 'ecran' ? menuPlus.action : [...menuPlus.autres, ...menuPlus.partout].find(e => e.cle === cle);
    setRenvoi(`banc — l’app ouvrirait : ${ligne?.label ?? cle}`);
  };
  return (
    <div className="flex h-[100dvh] flex-col bg-cave-950 pb-[var(--main-navigation-height,2.5rem)] text-cave-50">
      <p className="shrink-0 bg-cave-900 px-3 py-1 text-sm text-cave-200">Banc — données simulées · Stocks › Matériel</p>
      {renvoi && <p role="status" data-banc-renvoi className="shrink-0 px-3 py-1 text-sm text-cave-200">{renvoi}</p>}
      {taches && <BandeauTaches zone={zone} />}
      {/* Le même conteneur que le <main> de l'app sur Stocks (App.tsx) : marges, largeur, place du rail au 1280. */}
      <div ref={zone} className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-1 px-2 pt-1 xs:px-3 min-[900px]:max-w-[1264px] min-[1024px]:pl-[calc(var(--rail-width,88px)+0.75rem)]">
        {/* Le segment de Stocks › Matériel (R08, p2:h05-9), même habit et même barre que StocksTab (BARRE_MATERIEL). */}
        <nav aria-label="Vue du matériel" className={`${BARRE_MATERIEL} ${BARRE_SUR_DEFILEMENT}`}>
          {(['avenir', 'carnets', 'realises'] as const).map(seg => (
            <button key={seg} type="button" onClick={() => setSegment(seg)} aria-current={segment === seg ? 'page' : undefined}
              className={`flex-1 min-w-fit px-2 min-h-touch rounded-control flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${segment === seg ? 'bg-ebc-straw text-cave-950' : 'text-cave-400 hover:text-cave-50'}`}>
              <span>{LIBELLES[seg]}</span>{cache && <span className="font-mono">{n(seg)}</span>}
            </button>
          ))}
        </nav>
        {segment !== 'carnets' && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {cache
              ? <UpgradeWorkspace vue={segment === 'avenir' ? 'future' : 'completed'} onVue={v => setSegment(v === 'future' ? 'avenir' : 'realises')}
                onOpenCarnet={id => { setSegment('carnets'); setOuvrir({ id, at: Date.now() }); }} />
              : <p className="px-3 py-2 text-sm text-cave-400">Banc sans cache local : À venir et Réalisés ne s'affichent que sur le serveur de développement.</p>}
          </div>
        )}
        {/* Carnets reste monté : passer par À venir ne perd ni le carnet ouvert ni ce qui a été écrit. */}
        <div className={segment === 'carnets' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
          <BancCarnets magasin={magasin} {...(cache ? { finances: financesCache, ecrirePlan } : { realise: prm.realise, articles: prm.articles })}
            vide={prm.vide} horsLigne={prm.horsLigne} mode={prm.mode} appels={appels}
            ouvrir={ouvrir} focusChamp={focusChamp} onVoirAVenir={() => setSegment('avenir')} onVoirRealises={() => setSegment('realises')} {...(prm.texte ? { texte: prm.texte } : {})} />
        </div>
      </div>
      <div className="app-bottom-dock">
        <BottomNav activeTab="stocks" onChangeTab={tab => setRenvoi(`banc — l’app ouvrirait l’onglet ${tab}`)} criticalStockCount={0} horsConnexion={prm.horsLigne} />
      </div>
      <FloatingActions action={actionPlus} onAction={() => lancerPlus('ecran')} companionLabel={surCarnets ? 'Carnets' : 'Matériel'}
        menu={menuPlus} onPlus={lancerPlus} horsConnexion={prm.horsLigne} anchor="nav" />
    </div>
  );
}

/* ───── &taches=1 (D-36, R41) : cinq tâches chronométrées, du premier toucher au « ✓ » ───── */

export const TACHES = [
  'Créer « embouteillage »',
  'Ajouter un lien',
  'Ajouter une note en vrac',
  'Comparer et choisir, avec son pourquoi',
  'Retrouver ce pourquoi'
] as const;

export interface TempsTache { tache: string; ms: number; gestes: number; le: string }
const CLE_TACHES = 'banc-carnets-taches';

export function lireTemps(): TempsTache[] {
  try { const v = JSON.parse(localStorage.getItem(CLE_TACHES) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function texteTemps(temps: readonly TempsTache[]): string {
  return temps.map(t => `${t.tache} : ${(t.ms / 1000).toFixed(1)} s, ${t.gestes} geste${t.gestes > 1 ? 's' : ''} (${t.le})`).join('\n');
}

/**
 * Le bandeau des tâches. Le chrono part au premier toucher dans l'app (pas dans le bandeau) et s'arrête au « ✓ ».
 * Un geste = un toucher (pointerdown) ou une touche Entrée dans l'app ; la frappe d'un texte n'en est pas un.
 */
export function BandeauTaches({ zone }: { zone: React.RefObject<HTMLElement | null> }) {
  const [i, setI] = useState(0);
  const [temps, setTemps] = useState<TempsTache[]>(lireTemps);
  const [debut, setDebut] = useState<number | null>(null);
  const [gestes, setGestes] = useState(0);
  const [maintenant, setMaintenant] = useState(Date.now());
  const [copie, setCopie] = useState(false);
  const debutRef = useRef<number | null>(null);
  debutRef.current = debut;

  useEffect(() => {
    const el = zone.current;
    if (!el) return;
    const toucher = () => { if (debutRef.current === null) setDebut(Date.now()); setGestes(g => g + 1); };
    const touche = (e: KeyboardEvent) => { if (e.key === 'Enter') toucher(); };
    el.addEventListener('pointerdown', toucher, true);
    el.addEventListener('keydown', touche, true);
    return () => { el.removeEventListener('pointerdown', toucher, true); el.removeEventListener('keydown', touche, true); };
  }, [zone]);
  useEffect(() => {
    if (debut === null) return;
    const t = setInterval(() => setMaintenant(Date.now()), 250);
    return () => clearInterval(t);
  }, [debut]);

  const fini = i >= TACHES.length;
  const valider = useCallback(() => {
    if (fini || debut === null) return;
    const suite = [...temps, { tache: TACHES[i], ms: Date.now() - debut, gestes, le: new Date().toISOString() }];
    setTemps(suite);
    localStorage.setItem(CLE_TACHES, JSON.stringify(suite));
    setI(i + 1); setDebut(null); setGestes(0);
  }, [fini, debut, temps, i, gestes]);
  const recommencer = () => { localStorage.removeItem(CLE_TACHES); setTemps([]); setI(0); setDebut(null); setGestes(0); };
  const copier = async () => {
    try { await navigator.clipboard.writeText(texteTemps(temps)); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { setCopie(false); }
  };
  const ecoule = debut === null ? 0 : Math.max(0, maintenant - debut);

  return (
    <section aria-label="Tâches chronométrées" data-taches className="border-b border-cave-800 bg-cave-900 px-3 py-2 text-sm text-cave-50">
      {!fini ? (
        <div className="flex flex-wrap items-center gap-2">
          <b className="min-w-0 flex-1">Tâche {i + 1} / {TACHES.length} · {TACHES[i]}</b>
          <span className="font-mono" aria-live="off">{(ecoule / 1000).toFixed(1)} s · {gestes} geste{gestes > 1 ? 's' : ''}</span>
          <button type="button" className="min-h-11 rounded-control bg-ebc-straw px-3 font-semibold text-cave-950 disabled:opacity-50" disabled={debut === null} onClick={valider}>✓ Fait</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <b className="min-w-0 flex-1">Les 5 tâches sont faites.</b>
          <button type="button" className="min-h-11 rounded-control border border-cave-700 px-3 font-semibold" onClick={() => void copier()}>{copie ? 'Copié' : 'Copier les temps'}</button>
          <button type="button" className="min-h-11 rounded-control border border-cave-700 px-3" onClick={recommencer}>Recommencer</button>
        </div>
      )}
      {temps.length > 0 && <pre data-temps className="mt-1 whitespace-pre-wrap font-mono text-sm text-cave-200">{texteTemps(temps)}</pre>}
    </section>
  );
}
