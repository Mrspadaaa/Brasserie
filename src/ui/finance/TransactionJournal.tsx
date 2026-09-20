import { Input, type InputElement } from '../Input';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Archive, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialArchive, FinancialPayment } from '../../domain/finance/types';
import { archiveIndex, isTransactionArchived } from '../../domain/finance/archive';
import { isoDate, isActiveTransaction, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { CATEGORY_LABELS, Field } from './FinanceForms';
import { FinancePeriodBar, MonthStepper } from './FinancePeriod';
import { shortDate, signedCHF } from './financeFormat';
import { compte } from '../../services/plural';
import './journal.css';

export type JournalScope = 'current' | 'archives' | 'all';
export type JournalFilter = 'all' | 'due' | 'payable' | 'receivable' | 'review' | 'unknown' | 'void';
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
  page: number;
  /** A consumed request must not replace the user's filters when this view remounts. */
  requestKey?: string;
}
export function createJournalState(overrides: Partial<JournalState> = {}): JournalState {
  return { scope: 'current', query: '', category: 'all', filter: 'all', month: todayISO().slice(0, 7),
    allDates: false, archiveYear: '', year: '', page: 1, ...overrides };
}
const PAGE_SIZE = 50;
const FOLLOW_UP_FILTERS = new Set(['due', 'payable', 'receivable', 'review', 'unknown', 'proof']);
const FILTER_LABELS: Record<string, string> = {
  all: 'Toutes', due: 'À payer et encaisser', payable: 'À payer', receivable: 'À encaisser',
  review: 'À compléter', proof: 'Sans justificatif', unknown: 'Paiements à confirmer', void: 'Écritures annulées',
};
/**
 * Les états proposés en permanence, dans l'ordre où le brasseur les traite.
 *
 * ⚠️ Chacun porte son compte. Un filtre qui n'annonce pas ce qu'il contient
 * oblige à l'essayer pour savoir s'il y a du travail derrière : on l'ouvre,
 * on trouve zéro, on revient. Le compte transforme la rangée de puces en
 * relevé de ce qui reste à faire, lisible sans toucher à rien.
 *
 * `review` (« À compléter ») reste le sur-ensemble : date manquante, paiement
 * inconnu, trop-perçu OU justificatif absent. `proof` en isole la part la plus
 * demandée — retrouver une pièce pour la comptabilité.
 */
const STATE_FILTERS = ['all', 'payable', 'receivable', 'review', 'proof'] as const;

export function TransactionJournal({ transactions, payments, archives, request, state: controlledState, onStateChange,
  renderRow, onManageArchives, onPrivateMovement, onScopeChange }: {
  transactions: Transaction[];
  payments: FinancialPayment[];
  archives: FinancialArchive[];
  request?: JournalRequest;
  state?: JournalState;
  onStateChange?: (next: JournalState) => void;
  renderRow: (transaction: Transaction) => React.ReactNode;
  onManageArchives: () => void;
  onPrivateMovement: () => void;
  onScopeChange?: (scope: JournalScope) => void;
}) {
  const [internalState, setInternalState] = useState(createJournalState);
  const journal = controlledState ?? internalState;
  const { scope, query, category, filter, month, allDates, archiveYear, year } = journal;
  const searchRef = useRef<InputElement>(null);
  const searchId = useId();
  const replaceState = (next: JournalState) => { setInternalState(next); onStateChange?.(next); };
  const change = (patch: Partial<JournalState>) => replaceState({ ...journal, ...patch, page: 1 });
  const index = useMemo(() => archiveIndex(archives), [archives]);
  const years = useMemo(() => [...new Set(archives.filter(a => a.status === 'archived').map(a => a.year))].sort((a, b) => b - a), [archives]);
  const selectedYear = archiveYear === 'all' || years.includes(Number(archiveYear)) ? archiveYear : String(years[0] ?? '');
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
  const archivedCount = classified.filter(entry => entry.archived).length;

  useEffect(() => { onScopeChange?.(scope); }, [scope, onScopeChange]);
  useEffect(() => {
    if (!request || request.key === journal.requestKey) return;
    const next = createJournalState({
      scope: request.scope ?? 'all', query: request.query ?? '', category: request.category ?? 'all',
      filter: request.filter ?? 'all', month: request.month ?? todayISO().slice(0, 7),
      allDates: request.allDates ?? true, archiveYear: request.archiveYear ?? '', year: request.year ?? '', requestKey: request.key,
    });
    setInternalState(next);
    onStateChange?.(next);
  }, [request, journal.requestKey, onStateChange]);

  // Archiving never settles a bill. Follow-up includes earlier and archived years.
  const followingUp = scope === 'current' && FOLLOW_UP_FILTERS.has(filter);
  /**
   * Un seul prédicat, paramétré par l'état demandé.
   *
   * Il était écrit une fois pour la liste affichée ; le compte annoncé sur
   * chaque puce doit répondre exactement à « qu'est-ce que ce filtre me
   * montrerait ? », y compris son élargissement à tous les exercices. Le
   * dupliquer aurait fait diverger les deux réponses au premier ajustement.
   */
  const select = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr').replace(/(\d),(\d)/g, '$1.$2');
    return (wanted: string) => {
      const chasing = scope === 'current' && FOLLOW_UP_FILTERS.has(wanted);
      return classified.filter(({ transaction: t, payment, date, direction, open, search, archived }) => {
        if (scope === 'archives' && (!archived || selectedYear !== 'all' && date?.slice(0, 4) !== selectedYear)) return false;
        if (scope === 'current' && !chasing && archived && !open) return false;
        if (scope !== 'archives' && !chasing && year && date?.slice(0, 4) !== year) return false;
        if (scope !== 'archives' && !year && !allDates && !chasing && !(scope === 'current' && open) && !date?.startsWith(month)) return false;
        if (wanted === 'void') { if (isActiveTransaction(t)) return false; }
        else if (!isActiveTransaction(t) && (scope === 'current' || wanted !== 'all')) return false;
        if (needle && !search.includes(needle)) return false;
        if (category !== 'all' && t.category !== category && !t.finance?.lines.some(line =>
          (line.category ?? (line.kind === 'equipment' ? 'materiel' : line.kind === 'cleaning' ? 'nettoyage' : ['ingredient', 'packaging'].includes(line.kind) ? 'brassage' : t.category)) === category)) return false;
        if (['due', 'payable', 'receivable'].includes(wanted) && !['unpaid', 'partial'].includes(payment.state)) return false;
        if (wanted === 'payable' && direction !== 'out' || wanted === 'receivable' && direction !== 'in') return false;
        if (wanted === 'unknown' && payment.state !== 'unknown') return false;
        if (wanted === 'proof' && (t.proofUrl || t.finance?.proofDocumentId)) return false;
        if (wanted === 'review' && date && payment.state !== 'unknown' && payment.overpaidCents === 0 && (t.proofUrl || t.finance?.proofDocumentId)) return false;
        return true;
      });
    };
  }, [classified, scope, selectedYear, query, category, allDates, month, year]);
  const filtered = useMemo(() => [...select(filter)].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt - a.recordedAt || a.transaction.id.localeCompare(b.transaction.id)),
  [select, filter]);
  const counts = useMemo(() => Object.fromEntries(STATE_FILTERS.map(value =>
    [value, value === filter ? filtered.length : select(value).length])) as Record<string, number>,
  [select, filter, filtered.length]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.max(1, Math.min(journal.page, pageCount));
  const offset = (page - 1) * PAGE_SIZE;
  const changeScope = (value: JournalScope) => change({ scope: value, query: '', category: 'all', filter: 'all', allDates: value === 'all', year: '' });
  const periodLabel = followingUp ? 'Tous les exercices' : scope === 'archives'
    ? selectedYear === 'all' ? 'Toutes les années archivées' : selectedYear ? `Archives ${selectedYear}` : 'Aucune année archivée'
    : year ? `Exercice ${year}` : allDates ? 'Toutes les dates'
      : new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
  const hasFilters = !!query || category !== 'all' || filter !== 'all';
  const specialFilter = ['due', 'unknown', 'void'].includes(filter);
  /**
   * Solde net des écritures affichées : les entrées comptent en plus, les
   * sorties en moins. Les écritures annulées restent hors du total — les
   * afficher dans une liste est un contrôle, les additionner serait faux.
   */
  const netCents = (rows: typeof filtered) => rows.reduce((total, entry) =>
    isActiveTransaction(entry.transaction)
      ? total + (entry.direction === 'in' ? 1 : -1) * transactionAmount(entry.transaction)
      : total, 0);
  /** Une écriture porte sa date une seule fois, en tête de son jour. */
  const days = useMemo(() => {
    const groups: Array<{ key: string; date: string | null; rows: typeof filtered }> = [];
    for (const entry of filtered.slice(offset, offset + PAGE_SIZE)) {
      const last = groups[groups.length - 1];
      if (last && last.date === entry.date) last.rows.push(entry);
      else groups.push({ key: entry.date ?? 'sans-date', date: entry.date, rows: [entry] });
    }
    return groups;
  }, [filtered, offset]);
  const clearFilters = () => { change({ query: '', category: 'all', filter: 'all' }); searchRef.current?.focus(); };
  const showEverything = () => {
    replaceState(createJournalState({ scope: 'all', allDates: true, requestKey: journal.requestKey }));
    searchRef.current?.focus();
  };

  return <div className="finance-journal">
    <div className="journal-toolbar" aria-label="Filtres du journal">
      <FinancePeriodBar
        count={`${compte(filtered.length, 'opération')}${filtered.length > PAGE_SIZE ? ` · ${offset + 1}–${Math.min(offset + PAGE_SIZE, filtered.length)} affichées` : ''}`}
        context={followingUp ? 'Suivi sur tous les exercices, archives comprises.' : scope === 'current' ? 'Factures ouvertes incluses' : scope === 'all' ? 'Archives comprises' : `${archivedCount} pièce(s) conservée(s) · ${periodLabel}`}
        total={filtered.length ? signedCHF(netCents(filtered)) : undefined} totalLabel="Solde net des opérations affichées">
        {scope === 'archives' ? <Field label="Année archivée"><select aria-label="Année archivée" value={selectedYear} onChange={e => change({ archiveYear: e.target.value })}>
          {!years.length && <option value="">Aucune année archivée</option>}
          {years.map(value => <option key={value} value={value}>{value}</option>)}
          {years.length > 1 && <option value="all">Toutes les années archivées</option>}
        </select></Field> : followingUp ? <div className="journal-period-reading"><span>Période du suivi</span><strong>{periodLabel}</strong></div>
          : year ? <div className="journal-period-reading"><span>Période du journal</span><strong>{periodLabel}</strong></div>
            : <MonthStepper label="Période du journal" month={month} disabled={allDates}
              onMonth={value => change({ month: value, allDates: false })}/>}
        {scope !== 'archives' && !followingUp && <button type="button" className="journal-chip journal-date-toggle" aria-pressed={allDates && !year}
          onClick={() => change({ year: '', allDates: year ? true : !allDates })}>Toutes les dates</button>}
      </FinancePeriodBar>
      <div className="journal-search-category">
        <div className="finance-field journal-search"><label className="sr-only" htmlFor={searchId}>Rechercher une opération</label><span className="journal-search-control"><Search size={15} aria-hidden="true"/>
          <Input id={searchId} ref={searchRef} aria-label="Rechercher une opération" placeholder="Libellé, tiers, montant…" value={query} onChange={e => change({ query: e.target.value })}/>
          {query && <button type="button" aria-label="Effacer la recherche" onClick={() => { change({ query: '' }); searchRef.current?.focus(); }}><X size={14} aria-hidden="true"/></button>}
        </span></div>
        <select className="journal-select" aria-label="Catégorie" value={category} onChange={e => change({ category: e.target.value })}><option value="all">Toutes catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="journal-rail">
        <div className="journal-scopes" role="group" aria-label="Périmètre du journal">
          {([['current', 'Courantes'], ['archives', 'Archives'], ['all', 'Tout']] as const).map(([value, label]) =>
            <button type="button" key={value} aria-pressed={scope === value} onClick={() => changeScope(value)}>{label}</button>)}
        </div>
        <span className="journal-rail-split" aria-hidden="true"/>
        <div className="journal-filters" role="group" aria-label="État des opérations">
          {STATE_FILTERS.map(value => <button type="button" className="journal-chip" key={value}
            aria-pressed={filter === value} aria-describedby={`${searchId}-${value}`} onClick={() => change({ filter: value })}>
            {FILTER_LABELS[value]}
            <span className="journal-chip-count" aria-hidden="true" data-empty={counts[value] === 0 || undefined}>{counts[value]}</span>
          </button>)}
        </div>
        {/* Le compte DÉCRIT la puce, il n'entre pas dans son nom : « À payer »
            reste « À payer » au clavier, et le lecteur d'écran entend en plus
            combien d'opérations attendent derrière. Ces libellés vivent hors
            des boutons, sans quoi ils s'ajouteraient à leur nom accessible. */}
        <div hidden>{STATE_FILTERS.map(value =>
          <span key={value} id={`${searchId}-${value}`}>{compte(counts[value], 'opération')}</span>)}</div>
        {specialFilter && <div className="journal-active-filter"><button type="button" className="journal-chip" aria-label={`Retirer le filtre : ${FILTER_LABELS[filter]}`}
          onClick={() => change({ filter: 'all' })}>{FILTER_LABELS[filter]}<X size={13} aria-hidden="true"/></button></div>}
      </div>
      <details className="journal-extra"><summary>Autres filtres</summary><div>
        <button type="button" className="journal-chip" aria-pressed={filter === 'void'} onClick={() => change({ filter: filter === 'void' ? 'all' : 'void' })}>Écritures annulées uniquement</button>
        {hasFilters && filtered.length > 0 && <button type="button" className="journal-text-action" onClick={clearFilters}>Retirer les filtres</button>}
        <button type="button" className="journal-text-action" onClick={onManageArchives}><Archive size={15} aria-hidden="true"/>Gérer les archives</button>
      </div></details>
    </div>
    <div className="finance-list">{days.map(day => {
      const label = day.date ? shortDate(day.date) : 'Date à vérifier';
      return <section key={day.key} className="journal-day-group" aria-label={`${label} · ${compte(day.rows.length, 'opération')} · ${signedCHF(netCents(day.rows))}`}>
      <p className="journal-day" aria-hidden="true"><strong>{label}</strong>
        <span>{compte(day.rows.length, 'opération')}<span className="finance-money">{signedCHF(netCents(day.rows))}</span></span></p>
      {day.rows.map(entry => <React.Fragment key={entry.transaction.id}>
        {entry.archived && entry.open && <p className="finance-archive-followup">Exercice {entry.date?.slice(0, 4)} archivé · facture encore ouverte</p>}
        {renderRow(entry.transaction)}
      </React.Fragment>)}
    </section>;
    })}</div>
    {pageCount > 1 && <nav className="finance-pagination" aria-label="Pages du journal">
      <button type="button" className="journal-chip" aria-label="Page précédente" disabled={page === 1} onClick={() => replaceState({ ...journal, page: page - 1 })}><ChevronLeft size={16} aria-hidden="true"/></button>
      <span aria-live="polite">Page {page} sur {pageCount}</span>
      <button type="button" className="journal-chip" aria-label="Page suivante" disabled={page === pageCount} onClick={() => replaceState({ ...journal, page: page + 1 })}><ChevronRight size={16} aria-hidden="true"/></button>
    </nav>}
    {!filtered.length && <div className="journal-empty">
      <h3>{scope === 'archives' && !years.length ? 'Aucune année archivée' : !transactions.length ? 'Aucune opération enregistrée' : 'Aucune opération trouvée'}</h3>
      <p>{scope === 'archives' && !years.length ? 'Range une année terminée pour la retrouver ici.' : !transactions.length ? 'Enregistre un achat ou une vente pour démarrer le journal.' : `${periodLabel}${query ? ` · « ${query} »` : ''}${category !== 'all' ? ` · ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}` : ''}${filter !== 'all' ? ` · ${FILTER_LABELS[filter] ?? filter}` : ''}`}</p>
      <div>{scope === 'archives' && !years.length && <button type="button" className="journal-text-action" onClick={onManageArchives}>Choisir une année à archiver</button>}
        {hasFilters && <button type="button" className="journal-chip" onClick={clearFilters}>Retirer les filtres</button>}
        {transactions.length > 0 && <button type="button" className="journal-text-action" onClick={showEverything}>Voir toutes les opérations</button>}
      </div>
    </div>}
    {scope !== 'archives' && <div className="journal-actions"><button type="button" className="journal-text-action" onClick={onPrivateMovement}>Apport ou prélèvement privé</button></div>}
  </div>;
}
