import type { InputElement } from '../Input';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Archive, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialArchive, FinancialPayment } from '../../domain/finance/types';
import { archiveIndex, isTransactionArchived } from '../../domain/finance/archive';
import { ledgerDuplicates } from '../../domain/finance/duplicates';
import { estCreanceTropPaye, isoDate, isActiveTransaction, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { periodeSynthese, type PeriodeSynthese } from '../../domain/finance/periodeSynthese';
import { CATEGORY_LABELS } from './FinanceForms';
import { amountOnly, shortDate } from './financeFormat';
import { compte } from '../../services/plural';
import { Bande, type Actif } from './operations/Bande';
import { donneesFriseDe } from './operations/donneesFrise';
import { dansJours, finDuMois, jourMaxi, joursDeCompte, lirePlage, periodeSurJours, plageDuMois, redater, titreJours } from './operations/plage';
import { apportsDePeriode, enRetard, retardTotal } from './operations/calculs';
import { questionPoste } from './operations/assistant';
import { moisDit } from './compagnon/vue';
import { PaireDoublons, type GroupeDoublon } from './operations/PaireDoublons';
import { GROUPES, ORDRE, groupeDe, type GroupeId } from './operations/groupes';
import './operations.css';

/**
 * Une dépense sans justificatif RANGÉ : tant que l'envoi au Drive n'a pas abouti (`finance.proofUpload` en attente ou à renvoyer), elle n'a pas de
 * `proofDocumentId` et reste dans « Sans justificatif » et « À compléter ». Un envoi en cours n'est pas un justificatif.
 */
/** Le filtre « Matériel · à part » que pose la Synthèse : ce qu'Opérations range sous ce titre (matériel et local et travaux, ou une ligne `equipment` non passée en charge). */
export const CATEGORIE_A_PART = 'apart';
const libelleCategorie = (c: string): string => c === CATEGORIE_A_PART ? 'Matériel · à part' : CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c;
const estAPart = (t: Transaction): boolean => t.category === 'materiel' || t.category === 'renovation'
  || !!t.finance?.lines.some(l => l.kind === 'equipment' && l.capitalTreatment !== 'expense');
/** FIN-BARRES-MORTES : une pile filtre sur la catégorie qu'elle dessine ; « Matériel » dessine le « à part » (matériel, local et travaux). */
const categorieDePile = (cle: string): string => cle === 'materiel' ? CATEGORIE_A_PART : cle;
const pileDeCategorie = (categorie: string): string | null => categorie === 'all' ? null : categorie === CATEGORIE_A_PART ? 'materiel' : categorie;
export const sansJustificatif = (t: Transaction): boolean => !t.proofUrl && !t.finance?.proofDocumentId && !t.finance?.proofNotNeeded;

export type JournalScope = 'current' | 'archives' | 'all';
export type JournalFilter = 'all' | 'due' | 'late' | 'payable' | 'receivable' | 'review' | 'proof' | 'undated' | 'unknown' | 'void' | 'doublon';
export interface JournalRequest {
  key: string;
  scope?: JournalScope;
  query?: string;
  category?: string;
  filter?: string;
  month?: string;
  allDates?: boolean;
  archiveYear?: string;
  year?: string;
  /** Une plage venue de la Synthèse (19.11, « ça me renvoie sur le tout ») : jours `AAAA-MM-JJ`, bornes incluses ; elle remplace « toutes les dates ». */
  du?: string;
  au?: string;
}
export interface JournalState {
  scope: JournalScope;
  query: string;
  category: string;
  filter: string;
  month: string;
  allDates: boolean;
  archiveYear: string;
  year: string;
  /** La plage « du … au … » (s2ap2) : jours `AAAA-MM-JJ`, bornes incluses, toutes deux ou aucune. Elle remplace le mois ; `''` = pas de plage. Un ancien `AAAA-MM` se lit encore (`lirePlage`). */
  du: string;
  au: string;
  /** « Par date » (CP-12) : l'ORDRE des lignes (par jour au lieu de par catégorie), jamais la période. */
  parJour: boolean;
  page: number;
  /** A consumed request must not replace the user's filters when this view remounts. */
  requestKey?: string;
}
export function createJournalState(overrides: Partial<JournalState> = {}): JournalState {
  return { scope: 'current', query: '', category: 'all', filter: 'all', month: todayISO().slice(0, 7),
    allDates: false, archiveYear: '', year: '', du: '', au: '', parJour: false, page: 1, ...overrides };
}
const PAGE_SIZE = 50;
const CLE_DOUBLONS_ECARTES = 'laffinee.doublons-ecartes';
const lireEcartes = (): Set<string> => {
  try { const valeur = JSON.parse(window.localStorage.getItem(CLE_DOUBLONS_ECARTES) ?? '[]'); return new Set(Array.isArray(valeur) ? valeur.filter((x): x is string => typeof x === 'string') : []); } catch { return new Set(); }
};
const FOLLOW_UP_FILTERS = new Set(['due', 'late', 'payable', 'receivable', 'review', 'unknown', 'proof', 'undated', 'doublon']);
const FILTER_LABELS: Record<string, string> = {
  all: 'Sans filtre', due: 'À payer et encaisser', late: 'En retard', payable: 'À payer', receivable: 'À encaisser',
  review: 'À compléter', proof: 'Sans justificatif', undated: 'Sans date',
  unknown: 'Paiements à confirmer', void: 'Écritures annulées', doublon: 'Doublons possibles',
};
/**
 * Les états de suivi, dans l'ordre où le brasseur les traite.
 *
 * ⚠️ Chacun porte son compte : un filtre qui n'annonce pas ce qu'il contient oblige à l'essayer pour savoir s'il y a du travail derrière.
 * ⚠️ `always: false` ne s'affiche QUE s'il contient quelque chose (ou s'il est sélectionné) : ce sont les chasses ponctuelles (une facture en
 * retard, une pièce sans date, un paiement d'avant l'application). Les quatre premiers restent : ce sont les lectures du quotidien.
 * `review` (« À compléter ») est le sur-ensemble : date manquante, paiement inconnu, trop-perçu OU justificatif absent.
 */
const STATE_FILTERS: Array<{ value: string; always: boolean; urgent?: boolean }> = [
  { value: 'all', always: true },
  { value: 'payable', always: true },
  // « En retard » est un sous-ensemble de « À payer » : il se lit juste après, comme une aggravation.
  { value: 'late', always: false, urgent: true },
  { value: 'receivable', always: true },
  { value: 'review', always: true },
  { value: 'proof', always: false },
  { value: 'undated', always: false },
  { value: 'unknown', always: false },
  // AM n° 7 : un achat inscrit deux fois fausse toute la comptabilité ; la chasse se signale tant qu'elle n'est pas vide.
  { value: 'doublon', always: false, urgent: true },
];

const ICONE_JOUR = 'M8 3v4M16 3v4M4 9h16M5 5h14v15H5z';

export function TransactionJournal({ transactions, payments, archives, request, state: controlledState, onStateChange,
  renderRow, onManageArchives, onPrivateMovement, onScopeChange, assistant }: {
  transactions: Transaction[];
  payments: FinancialPayment[];
  archives: FinancialArchive[];
  request?: JournalRequest;
  state?: JournalState;
  onStateChange?: (next: JournalState) => void;
  /**
   * L'état de paiement est passé à la ligne, déjà calculé : `paymentState` parcourt tous les paiements et toutes les écritures pour une seule
   * pièce ; le journal le calcule une fois par écriture, dans un memo, au lieu de cinquante parcours à CHAQUE frappe dans la recherche.
   */
  renderRow: (transaction: Transaction, payment: ReturnType<typeof paymentState>) => React.ReactNode;
  onManageArchives: () => void;
  onPrivateMovement: () => void;
  onScopeChange?: (scope: JournalScope) => void;
  /** La puce de l'assistant, posée dans le pied (v6b : une seule rangée de puces, rien sous la liste). */
  assistant?: React.ReactNode;
}) {
  const [internalState, setInternalState] = useState(createJournalState);
  const journal = controlledState ?? internalState;
  const { scope, query, category, filter, month, allDates, archiveYear, year, parJour } = journal;
  const plage = useMemo(() => lirePlage(journal.du, journal.au), [journal.du, journal.au]);
  const searchRef = useRef<InputElement>(null);
  const searchId = useId();
  const [loupe, setLoupe] = useState(false);
  const [panneau, setPanneau] = useState(false);
  const panneauRef = useRef<HTMLDivElement>(null);
  // Le panneau s'ouvre sous la rangée de boutons du pied, souvent hors écran à 390 : on l'amène dans la vue.
  useEffect(() => { if (panneau) panneauRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [panneau]);
  const replaceState = (next: JournalState) => { setInternalState(next); onStateChange?.(next); };
  const change = (patch: Partial<JournalState>) => replaceState({ ...journal, ...patch, page: 1 });
  const index = useMemo(() => archiveIndex(archives), [archives]);
  const years = useMemo(() => [...new Set(archives.filter(a => a.status === 'archived').map(a => a.year))].sort((a, b) => b - a), [archives]);
  const selectedYear = archiveYear === 'all' || years.includes(Number(archiveYear)) ? archiveYear : String(years[0] ?? '');
  const aujourdhui = todayISO();
  const entries = useMemo(() => transactions.map(transaction => {
    const payment = paymentState(transaction, payments, transactions, todayISO());
    return {
      transaction, payment, date: isoDate(transaction.date), direction: transactionDirection(transaction, transactions),
      recordedAt: Date.parse(transaction.finance?.recordedAt ?? '') || 0,
      open: isActiveTransaction(transaction) && (payment.state === 'unpaid' || payment.state === 'partial' || payment.overpaidCents > 0),
      search: [transaction.description, transactionVendor(transaction), transaction.id, transaction.finance?.invoiceNumber,
        (transactionAmount(transaction) / 100).toFixed(2)].join(' ').toLocaleLowerCase('fr'),
    };
  }), [transactions, payments]);
  const classified = useMemo(() => entries.map(entry => ({ ...entry, archived: isTransactionArchived(entry.transaction, index) })), [entries, index]);
  /** s2ap2 : le jour où chaque pièce compte dans la frise et la plage (à payer : l'échéance ; payée : le dernier paiement). Le mois garde la date de pièce. */
  const joursCompte = useMemo(() => joursDeCompte(classified, payments, aujourdhui), [classified, payments, aujourdhui]);
  const jourPlage = (entry: { transaction: Transaction; date: string | null }): string | null => (plage ? joursCompte.get(entry.transaction.id) ?? entry.date : entry.date);
  /** AM n° 7 : les achats déjà inscrits plus d'une fois. Un avertissement : rien n'est supprimé ni annulé d'office. */
  // RF-3 : un avertissement écarté (« Ce n'est pas un doublon ») reste écarté sur cet appareil ; aucune écriture n'est modifiée.
  const [ecartes, setEcartes] = useState<Set<string>>(lireEcartes);
  const ecarter = (key: string) => {
    const next = new Set(ecartes).add(key);
    setEcartes(next);
    // Plus aucun doublon à montrer : le filtre « Doublons » ne laisse pas une liste vide derrière lui.
    if (filter === 'doublon' && ledgerDuplicates(transactions).every(group => next.has(group.key))) change({ filter: 'all' });
    try { window.localStorage.setItem(CLE_DOUBLONS_ECARTES, JSON.stringify([...next])); } catch { /* stockage indisponible : l'écart ne dure que pour cette session */ }
  };
  const duplicateGroups = useMemo(() => ledgerDuplicates(transactions).filter(group => !ecartes.has(group.key)), [transactions, ecartes]);
  const duplicateIds = useMemo(() => new Set(duplicateGroups.flatMap(group => group.ids)), [duplicateGroups]);
  /* t3 (problème 4) : une pièce annulée dans la paire (en attente d'écriture) ne compte plus ; un groupe qui n'en garde qu'une n'est plus un doublon. Bandeau et pastille se recomptent. */
  const [doublonsAnnules, setDoublonsAnnules] = useState<ReadonlySet<string>>(() => new Set());
  const nombreDoublons = useMemo(() => new Set(duplicateGroups.flatMap(group => { const vivantes = group.ids.filter(id => !doublonsAnnules.has(id)); return vivantes.length > 1 ? vivantes : []; })).size, [duplicateGroups, doublonsAnnules]);
  // m1do-a : plus aucun doublon à montrer (écarté, ou annulé) : le filtre se referme.
  useEffect(() => { if (filter === 'doublon' && duplicateGroups.length === 0) replaceState({ ...journal, filter: 'all', page: 1 }); });
  const vueDoublons = filter === 'doublon' && duplicateGroups.length > 0;

  useEffect(() => { onScopeChange?.(scope); }, [scope, onScopeChange]);
  useEffect(() => {
    if (!request || request.key === journal.requestKey) return;
    const next = createJournalState({
      scope: request.scope ?? 'all', query: request.query ?? '', category: request.category ?? 'all',
      filter: request.filter ?? 'all', month: request.month ?? todayISO().slice(0, 7),
      allDates: request.du && request.au ? false : request.allDates ?? true, archiveYear: request.archiveYear ?? '', year: request.year ?? '',
      du: request.du && request.au ? request.du : '', au: request.du && request.au ? request.au : '', requestKey: request.key,
    });
    setInternalState(next);
    onStateChange?.(next);
  }, [request, journal.requestKey, onStateChange]);
  useEffect(() => { if (loupe) searchRef.current?.focus(); }, [loupe]);
  // Une recherche arrivée d'ailleurs (la synthèse, une fiche) se voit : le champ s'ouvre tout seul.
  useEffect(() => { if (query) setLoupe(true); }, [query]);

  // Archiving never settles a bill. Follow-up includes earlier and archived years.
  // m1do-a : « Doublons » garde la bande du mois ; seuls les autres suivis (sur tous les exercices) la remplacent.
  const followingUp = scope === 'current' && FOLLOW_UP_FILTERS.has(filter) && filter !== 'doublon';
  /** Le mois de la bande : une période civile, ni un suivi, ni un exercice, ni « Par date », ni les archives. */
  // Le mois se change toujours (10.11 : « Pourquoi je peux pas changer de mois ? Je veux !! ») : archives comprises, il filtre aussi ce mois.
  const modeMois = scope !== 'archives' && !followingUp && !year && !allDates && !plage;
  /**
   * Les bornes de la période (`AAAA-MM`, incluses ; `null` = tout l'historique) : la plage, l'exercice, tout, ou le mois. Une seule règle pour la liste
   * et pour les piles, comme dans la Synthèse (`periodeSynthese({ mois, jusqua })`).
   */
  // Des JOURS (`AAAA-MM-JJ`) : la plage du jour au jour, le mois entier, l'exercice, ou tout (`null`).
  const [debut, fin]: [string | null, string | null] = plage ? [plage.du, plage.au] : year ? [`${year}-01-01`, `${year}-12-31`] : allDates ? [null, null] : [`${month}-01`, finDuMois(month)];
  /**
   * Le tri se fait en deux temps, et c'est une question de coût.
   * Le SOCLE — périmètre, période, recherche, catégorie — est le travail lourd ; il ne dépend de l'état demandé que par un booléen (un suivi
   * élargit la période), donc deux passes suffisent pour toutes les puces. L'ÉTAT ne regarde ensuite que des valeurs déjà calculées. Un seul
   * prédicat pour la liste et pour les comptes : une puce n'annonce jamais un nombre que son propre filtre ne montre pas.
   */
  /** La recherche et la catégorie : un seul prédicat pour la liste, le compte de la frise et ses barres (FIN-DEUX-PERIODES). */
  const correspond = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr').replace(/(\d),(\d)/g, '$1.$2');
    return ({ transaction: t, search }: { transaction: Transaction; search: string }): boolean => {
      if (needle && !search.includes(needle)) return false;
      if (category === CATEGORIE_A_PART) return estAPart(t);
      return category === 'all' || t.category === category || !!t.finance?.lines.some(line =>
        (line.category ?? (line.kind === 'equipment' ? 'materiel' : line.kind === 'cleaning' ? 'nettoyage' : ['ingredient', 'packaging'].includes(line.kind) ? 'brassage' : t.category)) === category);
    };
  }, [query, category]);
  const bases = useMemo(() => {
    const keep = (entry: typeof classified[number], chasing: boolean) => {
      const { date, open, archived } = entry;
      if (scope === 'archives' && (!archived || selectedYear !== 'all' && date?.slice(0, 4) !== selectedYear)) return false;
      if (scope === 'current' && !chasing && archived && !open) return false;
      if (scope !== 'archives' && !chasing && year && date?.slice(0, 4) !== year) return false;
      // Une facture ouverte reste dans la liste du mois, archives comprises aussi : « Tout » montre au moins ce que montrent les courantes (la pastille « en retard » ne promet rien d'absent).
      if (scope !== 'archives' && !year && !chasing && !open && !dansJours(jourPlage(entry) ?? '', debut, fin)) return false;
      return correspond(entry);
    };
    const scoped = classified.filter(entry => keep(entry, false));
    // Hors périmètre « courantes », un suivi ne change rien à la période.
    return { scoped, chasing: scope === 'current' ? classified.filter(entry => keep(entry, true)) : scoped };
  }, [classified, scope, selectedYear, correspond, debut, fin, year, plage, joursCompte]);
  const matchesState = useMemo(() => {
    const today = todayISO();
    return ({ transaction: t, payment, date, direction }: typeof classified[number], wanted: string) => {
      if (wanted === 'void') { if (isActiveTransaction(t)) return false; }
      // v1 (20) : une écriture annulée n'apparaît nulle part par défaut (liste du mois, « Tout », recherche) ; seule la puce « Écritures annulées uniquement » la montre.
      else if (!isActiveTransaction(t)) return false;
      if (['due', 'late', 'payable', 'receivable'].includes(wanted) && !['unpaid', 'partial'].includes(payment.state)) return false;
      if (wanted === 'payable' && direction !== 'out' || wanted === 'receivable' && direction !== 'in') return false;
      if (wanted === 'late') { const due = isoDate(t.finance?.dueDate); if (!due || due >= today) return false; }
      if (wanted === 'doublon' && !duplicateIds.has(t.id)) return false;
      if (wanted === 'undated' && date) return false;
      if (wanted === 'unknown' && payment.state !== 'unknown') return false;
      if (wanted === 'proof' && !sansJustificatif(t)) return false;
      if (wanted === 'review' && date && payment.state !== 'unknown' && payment.overpaidCents === 0 && !sansJustificatif(t)) return false;
      return true;
    };
  }, [scope, duplicateIds]);
  const baseFor = (wanted: string) => scope === 'current' && FOLLOW_UP_FILTERS.has(wanted) ? bases.chasing : bases.scoped;
  const filtered = useMemo(() => baseFor(filter).filter(entry => matchesState(entry, filter)).sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt - a.recordedAt || a.transaction.id.localeCompare(b.transaction.id)),
  [bases, matchesState, filter, scope]);
  /** Les comptes n'allouent rien : on ne garde que le nombre. */
  const counts = useMemo(() => {
    const total: Record<string, number> = {};
    for (const { value } of STATE_FILTERS) {
      let n = 0;
      for (const entry of baseFor(value)) if (matchesState(entry, value)) n += 1;
      total[value] = n;
    }
    return total;
  }, [bases, matchesState, scope]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.max(1, Math.min(journal.page, pageCount));
  const offset = (page - 1) * PAGE_SIZE;
  const changeScope = (value: JournalScope) => change({ scope: value, query: '', category: 'all', filter: 'all', allDates: value === 'all', year: '', du: '', au: '' });
  const periodLabel = followingUp ? 'Tous les exercices' : scope === 'archives'
    ? selectedYear === 'all' ? 'Toutes les années archivées' : selectedYear ? `Archives ${selectedYear}` : 'Aucune année archivée'
    : plage ? titreJours(plage, aujourdhui) : year ? `Exercice ${year}` : allDates ? 'Toutes les dates'
      : new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
  const hasFilters = !!query || category !== 'all' || filter !== 'all';
  /** Une chasse vide ne prend pas de place ; celle qu'on regarde reste toujours là. */
  const shownFilters = STATE_FILTERS.filter(({ value, always }) => always || counts[value] > 0 || filter === value);
  const clearFilters = () => { change({ query: '', category: 'all', filter: 'all' }); searchRef.current?.focus(); };
  const showEverything = () => { replaceState(createJournalState({ scope: 'all', allDates: true, requestKey: journal.requestKey })); searchRef.current?.focus(); };

  /**
   * La bande : ce que doit la période (piles de `periodeSynthese`, la période entière, jamais la liste filtrée) et ce qui est échu (toutes années).
   * Une seule vue pour toute période (CP-12) : un mois, une plage, un exercice, tout l'historique, les archives. Seul le suivi (« En retard »,
   * « À payer » sur tous les exercices) n'a pas de piles : sa liste n'est pas une période, des piles ne diraient pas ce qu'elle contient.
   */
  const piles = useMemo(() => {
    if (followingUp) return null;
    if (scope === 'archives') {
      const archivees = classified.filter(e => e.archived && (selectedYear === 'all' || e.date?.slice(0, 4) === selectedYear)).map(e => e.transaction);
      return periodeSynthese({ transactions: archivees, payments, mois: null, aujourdhui });
    }
    const sources = scope === 'current' ? classified.filter(e => !e.archived || e.open) : classified;
    const transactions = sources.map(e => e.transaction);
    if (plage) return periodeSurJours({ transactions, payments, du: plage.du, au: plage.au, aujourdhui, jours: joursCompte });
    return periodeSynthese({ transactions, payments, mois: debut?.slice(0, 7) ?? null, jusqua: fin?.slice(0, 7), aujourdhui });
  }, [followingUp, scope, selectedYear, classified, payments, debut, fin, plage, aujourdhui, joursCompte]);
  /** Apports (+) et prélèvements (−) de la période : hors « dépensé », montrés à part sur le graphe (CP-15). */
  const apportsCents = useMemo(() => {
    if (followingUp) return null;
    const sources = scope === 'archives' ? classified.filter(e => e.archived) : scope === 'current' ? classified.filter(e => !e.archived || e.open) : classified;
    const [du, au] = scope === 'archives' ? [null, null] : [debut, fin];
    return apportsDePeriode(sources, du, au);
  }, [followingUp, scope, classified, debut, fin]);
  /** Point 3 du test d'écran : les archives disent ce qu'elles contiennent, jamais « sur tout l'historique » quand l'historique a des opérations. */
  const videTexte = scope === 'archives'
    ? (years.length ? `Ni vente ni dépense dans ${selectedYear === 'all' ? 'les années archivées' : `l’année archivée ${selectedYear}`}.` : 'Aucune année archivée.') : undefined;
  /** Point 11 : la bande vide le dit déjà ; la carte de la liste ne le répète pas (elle garde ses liens, et sa phrase pour le lecteur d'écran). */
  const pilesVides = !!piles && !piles.entreCents && !piles.materielCents && !piles.postes.length && !apportsCents;
  // Tour 2 (19.11) : « la plage », pas « la période » : les piles se lisent, elles ne sont pas un second choix de période.
  const nomPiles = modeMois ? 'le mois' : !year && !allDates && scope !== 'archives' ? 'la plage' : 'tout l’historique';
  const retard = useMemo(() => retardTotal(classified, aujourdhui), [classified, aujourdhui]);
  // fx1 : la puce IA pose la question du plus gros poste des piles (v6b) ; sans poste, son libellé actuel.
  const pose = useMemo(() => piles ? questionPoste(piles, modeMois ? `en ${moisDit(month)}` : plage ? `la période ${titreJours(plage, aujourdhui)}` : nomPiles) : null, [piles, modeMois, month, nomPiles, plage, aujourdhui]);
  /** La frise (s2ap2) : un jour à la fois, par `periodeSynthese` (une seule règle de « dépensé ») ; un mois sans aucune opération saisie est inconnu, pas vide. */
  const sourcesFrise = useMemo(() => (scope === 'current' ? classified.filter(e => !e.archived || e.open) : classified), [classified, scope]);
  /* FIN-DEUX-PERIODES : filtré (catégorie, recherche), les barres des jours et « n opération » suivent la liste ; un mois reste « saisi » par toutes ses pièces. */
  const filtrees = useMemo(() => (query || category !== 'all' ? sourcesFrise.filter(correspond) : sourcesFrise), [sourcesFrise, correspond, query, category]);
  const donneesFrise = useMemo(() => donneesFriseDe(sourcesFrise, payments, aujourdhui, joursCompte, filtrees), [sourcesFrise, filtrees, payments, aujourdhui, joursCompte]);
  /* t3 (problème 5) : une année d'archive consultée remplit les champs « du … au … » à cette année ; « toutes les années » les laisse vides (aucune plage unique). */
  const jours = plage ?? (modeMois ? plageDuMois(month) : scope === 'archives' && /^\d{4}$/.test(String(selectedYear)) ? { du: `${selectedYear}-01-01`, au: `${selectedYear}-12-31` } : null);
  const nbOperations = useMemo(() => jours ? filtrees.filter(e => { const j = jourPlage(e); return j && isActiveTransaction(e.transaction) && dansJours(j, jours.du, jours.au); }).length : 0, [filtrees, jours?.du, jours?.au, plage, joursCompte]);
  /* T2-3 (tour 3, 19.11) : la liste épingle les opérations encore à régler même hors de la période (voulu : « Tout montre au moins ce que montrent les courantes »).
     Le compte de la frise le dit : « 0 opération · 1 à payer » ; sans lui, l'en-tête disait 0 pendant que la liste montrait une ligne. Seules ces lignes-là, jamais celles de la période. */
  const horsPeriodeAReglerLibelle = useMemo(() => {
    if (!jours || scope === 'archives' || year) return '';
    const ouvertes = filtrees.filter(e => { const j = jourPlage(e); return j && e.open && ['unpaid', 'partial'].includes(e.payment.state) && isActiveTransaction(e.transaction) && !dansJours(j, jours.du, jours.au); });
    if (!ouvertes.length) return '';
    const sorties = ouvertes.filter(e => e.direction === 'out').length;
    return `${ouvertes.length} ${sorties === ouvertes.length ? 'à payer' : sorties === 0 ? 'à encaisser' : 'à régler'}`;
  }, [filtrees, jours?.du, jours?.au, plage, joursCompte, scope, year]);
  const puce = pose && React.isValidElement(assistant) ? React.cloneElement(assistant as React.ReactElement<{ pose?: typeof pose }>, { pose }) : assistant;
  const actifs: Actif[] = [
    /* FIN-DEUX-PERIODES : sans pastille ‹ › dans la page, un exercice (ouvert depuis les archives) se quitte par sa pastille ; la liste revient à la période de l'en-tête. */
    ...(year && scope !== 'archives' ? [{ cle: 'exercice', libelle: `Exercice ${year}`, retirer: () => change({ year: '', allDates: false }) }] : []),
    // m1do-a : « Doublons » ouvert se lit sur sa propre pastille (pleine) ; ni pastille « Doublons possibles × » sous le mois ni « Filtres 1 » (la maquette n'en a pas).
    ...(filter !== 'all' && filter !== 'doublon' ? [{ cle: 'filtre', libelle: FILTER_LABELS[filter] ?? filter, retirer: () => change({ filter: 'all' }) }] : []),
    ...(category !== 'all' ? [{ cle: 'categorie', libelle: libelleCategorie(category), retirer: () => change({ category: 'all' }) }] : []),
  ];

  /** Les groupes : un jour (« Par date », tout périmètre) ou une catégorie (le mois, un suivi, un exercice, les archives). Une écriture paraît UNE fois. */
  const groupes = useMemo(() => {
    const lignes = filtered.slice(offset, offset + PAGE_SIZE);
    if (parJour) {
      const parDate: Array<{ cle: string; id: GroupeId | 'jour'; etiquette: string; rows: typeof lignes; hors: typeof lignes }> = [];
      for (const entry of lignes) {
        const dernier = parDate[parDate.length - 1];
        if (dernier && dernier.cle === (entry.date ?? 'sans-date')) dernier.rows.push(entry);
        else parDate.push({ cle: entry.date ?? 'sans-date', id: 'jour', etiquette: entry.date ? shortDate(entry.date) : 'Date à vérifier', rows: [entry], hors: [] });
      }
      return parDate;
    }
    const parGroupe = new Map<GroupeId, { rows: typeof lignes; hors: typeof lignes }>();
    for (const entry of lignes) {
      const jourEntry = jourPlage(entry);
      const horsPeriode = !!jourEntry && !dansJours(jourEntry, debut, fin);
      const echue = (modeMois || !!plage) && enRetard(entry.transaction, entry.payment, aujourdhui) && horsPeriode;
      const id = groupeDe(entry.transaction, { retardHorsMois: echue });
      // s2ap2 : une opération encore à régler, hors de la plage mais pas en retard, reste dite en une ligne « hors plage » (ni comptée, ni dans le sous-total).
      const hors = !!plage && !echue && horsPeriode && entry.open && ['unpaid', 'partial'].includes(entry.payment.state) && isActiveTransaction(entry.transaction);
      const g = parGroupe.get(id) ?? { rows: [], hors: [] };
      (hors ? g.hors : g.rows).push(entry);
      parGroupe.set(id, g);
    }
    return ORDRE.filter(id => parGroupe.has(id)).map(id => {
      const { rows, hors } = parGroupe.get(id)!;
      const annees = [...new Set(rows.map(r => isoDate(r.transaction.finance?.dueDate)?.slice(0, 4) ?? r.date?.slice(0, 4)).filter(Boolean))].sort();
      return { cle: id, id, etiquette: id === 'retard' ? `En retard${annees.length ? ` · ${annees.join(' · ')}` : ''}` : GROUPES[id].label, rows, hors };
    });
  }, [filtered, offset, parJour, modeMois, plage, debut, fin, aujourdhui, joursCompte]);
  /** Le compteur d'un groupe : les opérations actives se comptent, les annulées (listées) se disent à part, comme le total. */
  const libelleCompte = (rows: typeof filtered): string => {
    const annulees = rows.filter(r => !isActiveTransaction(r.transaction)).length, actives = rows.length - annulees;
    return annulees === 0 ? compte(actives, 'opération') : actives === 0 ? compte(annulees, 'annulée') : `${compte(actives, 'opération')} + ${compte(annulees, 'annulée')}`;
  };
  /** Sous-total d'un groupe : les écritures actives affichées ; une annulée se liste mais ne s'additionne pas. Les ventes en +, les charges en positif. */
  const sousTotal = (id: GroupeId | 'jour', rows: typeof filtered): string => {
    // Rien d'actif à additionner (un groupe d'annulées, un jour sans écriture active) : pas de total, jamais un « 0,00 ».
    if (!rows.some(r => isActiveTransaction(r.transaction))) return '';
    let cents = 0;
    for (const { transaction, direction } of rows) {
      if (!isActiveTransaction(transaction)) continue;
      // FN-37 : la créance « À récupérer » est listée dans son groupe, mais elle n'est pas une charge : le sous-total suit la pile.
      if (id !== 'jour' && estCreanceTropPaye(transaction)) continue;
      const entrant = direction === 'in';
      cents += (id === 'jour' || id === 'recettes' || id === 'apports' ? (entrant ? 1 : -1) : (entrant ? -1 : 1)) * transactionAmount(transaction);
    }
    const texte = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(cents) / 100);
    // CP-15 (10.11, « Pourquoi négatif sur un apport ? ») : un apport entre (+), un prélèvement sort (−), comme une vente.
    return `${cents < 0 ? '−' : (id === 'recettes' || id === 'apports' || id === 'jour') && cents > 0 ? '+' : ''}${texte}`;
  };

  /** m1do-a : un cadre par groupe de doublons, ses lignes complètes dans l'ordre de saisie. */
  const entreeParId = useMemo(() => new Map(classified.map(entry => [entry.transaction.id, entry] as const)), [classified]);
  const groupesDoublons = useMemo<GroupeDoublon[]>(() => !vueDoublons ? [] : duplicateGroups.map(group => {
    const lignes = group.ids.map(id => entreeParId.get(id)).filter((entry): entry is NonNullable<typeof entry> => !!entry)
      .sort((a, b) => a.recordedAt - b.recordedAt || a.transaction.id.localeCompare(b.transaction.id));
    return { cle: group.key, titre: group.titre, detail: group.detail, groupe: lignes[0] ? groupeDe(lignes[0].transaction, { retardHorsMois: false }) : 'divers',
      transactions: lignes.map(entry => entry.transaction),
      lignes: lignes.map(entry => <React.Fragment key={entry.transaction.id}>{renderRow(entry.transaction, entry.payment)}</React.Fragment>) };
  }), [vueDoublons, duplicateGroups, entreeParId, renderRow]);

  return <div className="ops">
    <Bande libellePeriode={periodLabel} contexte={followingUp ? 'Suivi sur tous les exercices, archives comprises.' : scope === 'all' ? 'Archives comprises' : undefined} moisActif={modeMois} month={month} today={aujourdhui}
      onMonth={value => change({ month: value, allDates: false, year: '', du: '', au: '', ...(scope === 'archives' ? { scope: 'all' as JournalScope } : {}), ...(followingUp ? { filter: 'all' } : {}) })}
      retardCents={retard.totalCents} onRetard={() => change({ filter: 'late' })}
      rechercheOuverte={loupe || !!query} onLoupe={() => { if (!query) setLoupe(open => !open); }}
      query={query} onQuery={value => { change({ query: value }); if (!value) searchRef.current?.focus(); }} searchRef={searchRef} searchId={searchId}
      actifs={actifs} piles={piles} apportsCents={apportsCents} nomPiles={nomPiles} plage={plage} jours={jours} donneesFrise={donneesFrise} nbOperations={nbOperations} horsPeriode={horsPeriodeAReglerLibelle} jourMax={jourMaxi(aujourdhui)} videTexte={videTexte}
      pileChoisie={pileDeCategorie(category)} onPile={cle => { const c = categorieDePile(cle); change({ category: category === c ? 'all' : c }); }}
      onPlage={(du, au) => change({ du, au, allDates: false, year: '', ...(scope === 'archives' ? { scope: 'all' as JournalScope } : {}), ...(followingUp ? { filter: 'all' } : {}) })}/>

    {vueDoublons && <PaireDoublons groupes={groupesDoublons} nombre={nombreDoublons} onEcarter={ecarter} onAnnulees={setDoublonsAnnules}/>}

    {!vueDoublons && <div className="ops-liste">{groupes.map(groupe => {
      const meta = groupe.id === 'jour' ? null : GROUPES[groupe.id];
      const total = sousTotal(groupe.id, groupe.rows);
      return <section key={groupe.cle} className="ops-groupe" data-groupe={groupe.id} aria-label={[groupe.etiquette, groupe.rows.length ? libelleCompte(groupe.rows) : '', total].filter(Boolean).join(' · ')}>
        {groupe.id === 'part' && <div className="ops-part" aria-hidden="true"/>}
        <p className="ops-g" aria-hidden="true">
          <span className="ops-sq" style={meta ? { background: meta.fond, color: meta.trait } : undefined}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap={groupe.id === 'divers' ? 'round' : undefined}><path d={meta ? meta.chemin : ICONE_JOUR}/></svg>
          </span>
          <b>{groupe.etiquette}</b><span className="ops-sub ops-m" data-signe={total.startsWith('+') ? '+' : undefined}>{total}</span>
        </p>
        {groupe.rows.map(entry => <React.Fragment key={entry.transaction.id}>
          {entry.archived && entry.open && <p className="ops-suivi">Exercice {entry.date?.slice(0, 4)} archivé · facture encore ouverte</p>}
          {renderRow(entry.transaction, entry.payment)}
        </React.Fragment>)}
        {groupe.hors.map(entry => {
          const verbe = entry.direction === 'in' ? 'à encaisser' : 'à payer', reste = amountOnly(entry.payment.remainingCents > 0 ? entry.payment.remainingCents : transactionAmount(entry.transaction));
          const quand = shortDate(isoDate(entry.transaction.finance?.dueDate) ?? entry.date ?? undefined);
          return <div key={entry.transaction.id} className="ops-hors" role="note" aria-label={`Hors plage : ${entry.transaction.description}, ${verbe} ${quand}, ${reste} CHF`}>
            <span className="ops-hp">hors plage</span><span className="ops-hors-nom">{entry.transaction.description} · {verbe} {quand}</span><b className="ops-m">{reste}</b>
          </div>;
        })}
      </section>;
    })}</div>}

    {!vueDoublons && pageCount > 1 && <nav className="ops-pages" aria-label="Pages du journal">
      <button type="button" className="ops-mini" aria-label="Page précédente" disabled={page === 1} onClick={() => replaceState({ ...journal, page: page - 1 })}><ChevronLeft size={16} aria-hidden="true"/></button>
      <span aria-live="polite">Page {page} sur {pageCount}</span>
      <button type="button" className="ops-mini" aria-label="Page suivante" disabled={page === pageCount} onClick={() => replaceState({ ...journal, page: page + 1 })}><ChevronRight size={16} aria-hidden="true"/></button>
    </nav>}

    {!vueDoublons && !filtered.length && <div className="ops-vide" data-nu={(pilesVides && !hasFilters) || undefined}>
      <h3>{scope === 'archives' && !years.length ? 'Aucune année archivée' : !transactions.length ? 'Aucune opération enregistrée' : 'Aucune opération trouvée'}</h3>
      <p>{scope === 'archives' && !years.length ? 'Range une année terminée pour la retrouver ici.' : !transactions.length ? 'Enregistre un achat ou une vente pour démarrer le journal.' : `${periodLabel}${query ? ` · « ${query} »` : ''}${category !== 'all' ? ` · ${libelleCategorie(category)}` : ''}${filter !== 'all' ? ` · ${FILTER_LABELS[filter] ?? filter}` : ''}`}</p>
      <div>{scope === 'archives' && !years.length && <button type="button" className="ops-lien" onClick={onManageArchives}>Choisir une année à archiver</button>}
        {hasFilters && <button type="button" className="ops-mini" onClick={clearFilters}>Retirer les filtres</button>}
        {transactions.length > 0 && <button type="button" className="ops-lien" onClick={showEverything}>Voir toutes les opérations</button>}
      </div>
    </div>}

    {scope === 'archives' && <div className="ops-archives">
      <label>Année archivée <select aria-label="Année archivée" value={selectedYear} onChange={e => change({ archiveYear: e.target.value })}>
        {!years.length && <option value="">Aucune année archivée</option>}
        {years.map(value => <option key={value} value={value}>{value}</option>)}
        {years.length > 1 && <option value="all">Toutes les années archivées</option>}
      </select></label>
    </div>}

    <div className="ops-pied">
      {puce}
      <button type="button" className="ops-pu journal-date-toggle" aria-pressed={parJour} title="Ranger les lignes de la période par jour, au lieu de par catégorie"
        onClick={() => change({ parJour: !parJour })}>Par date</button>
      <button type="button" className="ops-pu" aria-expanded={panneau} onClick={() => setPanneau(open => !open)}>
        Filtres{actifs.length > 0 && <span className="ops-n">{actifs.length}</span>}<ChevronDown size={13} aria-hidden="true"/></button>
      <button type="button" className="ops-pu" aria-pressed={filter === 'doublon'} disabled={duplicateGroups.length === 0 && filter !== 'doublon'}
        {...(duplicateGroups.length === 0 && filter !== 'doublon' ? { 'aria-label': 'Doublons : aucun doublon', title: 'Aucun doublon à montrer' } : {})}
        data-urgent={duplicateGroups.length > 0 || undefined} onClick={() => change({ filter: filter === 'doublon' ? 'all' : 'doublon' })}>
        Doublons{duplicateGroups.length > 0 && nombreDoublons > 0 && <span className="ops-n">{nombreDoublons}</span>}</button>
      {scope !== 'archives' && <button type="button" className="ops-pu" onClick={onPrivateMovement}>Apport ou prélèvement privé</button>}
      <button type="button" className="ops-pu" aria-pressed={scope === 'archives'} onClick={() => changeScope(scope === 'archives' ? 'current' : 'archives')}>Archives</button>
    </div>

    {panneau && <div className="ops-panneau" ref={panneauRef} aria-label="Filtres du journal">
      <div className="ops-chips" role="group" aria-label="Périmètre du journal">
        {([['current', 'Courantes'], ['all', 'Tout']] as const).map(([value, label]) =>
          <button type="button" className="ops-chip" key={value} aria-pressed={scope === value} onClick={() => changeScope(value)}>{label}</button>)}
      </div>
      {/* Deux périmètres, deux rangées : « Toutes 7 » compte le mois, « À compléter 15 » toutes les dates (la relance). Sur une même rangée, les nombres paraissaient faux. */}
      <div role="group" aria-label="État des opérations" className="ops-etats">
        {[shownFilters.filter(f => !(scope === 'current' && FOLLOW_UP_FILTERS.has(f.value))), shownFilters.filter(f => scope === 'current' && FOLLOW_UP_FILTERS.has(f.value))].map((rangee, i) => rangee.length > 0 && <div className="ops-chips" key={i}>
          {i === 1 && <span className="ops-cap">toutes les dates</span>}
          {rangee.map(({ value, urgent }) => <button type="button" className="ops-chip" key={value} aria-pressed={filter === value}
            aria-describedby={`${searchId}-${value}`} onClick={() => change({ filter: value })} data-urgent={urgent && counts[value] > 0 || undefined}>
            {FILTER_LABELS[value]}
            <span className="ops-chip-n ops-m" aria-hidden="true" data-empty={counts[value] === 0 || undefined}>{counts[value]}</span>
          </button>)}
        </div>)}
      </div>
      {/* Le compte DÉCRIT la puce, il n'entre pas dans son nom : « À payer » reste « À payer » au clavier, et le lecteur d'écran entend en plus
          combien d'opérations attendent derrière. Ces libellés vivent hors des boutons. */}
      <div hidden>{shownFilters.map(({ value }) => <span key={value} id={`${searchId}-${value}`}>{compte(counts[value], 'opération')}</span>)}</div>
      <div className="ops-ligne">
        <select className="ops-select" aria-label="Catégorie" value={category} onChange={e => change({ category: e.target.value })}><option value="all">Toutes catégories</option>{category === CATEGORIE_A_PART && <option value={CATEGORIE_A_PART}>{libelleCategorie(CATEGORIE_A_PART)}</option>}
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" className="ops-chip" aria-pressed={filter === 'void'} onClick={() => change({ filter: filter === 'void' ? 'all' : 'void' })}>Écritures annulées uniquement</button>
        {hasFilters && filtered.length > 0 && <button type="button" className="ops-lien" onClick={clearFilters}>Retirer les filtres</button>}
        <button type="button" className="ops-lien" onClick={onManageArchives}><Archive size={15} aria-hidden="true"/>Gérer les archives</button>
      </div>
    </div>}
  </div>;
}
