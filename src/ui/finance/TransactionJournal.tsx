import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Archive, ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialArchive, FinancialPayment } from '../../domain/finance/types';
import { archiveIndex, isTransactionArchived } from '../../domain/finance/archive';
import { isoDate, isActiveTransaction, paymentState, todayISO, transactionAmount, transactionDirection, transactionVendor } from '../../domain/finance/ledger';
import { CATEGORY_LABELS, Field } from './FinanceForms';
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
const FOLLOW_UP_FILTERS = new Set(['due', 'payable', 'receivable', 'review', 'unknown']);
const FILTER_LABELS: Record<string, string> = {
  all: 'Toutes', due: 'À payer et encaisser', payable: 'À payer', receivable: 'À encaisser',
  review: 'À compléter', unknown: 'Paiements à confirmer', void: 'Écritures annulées',
};

export function TransactionJournal({ transactions, payments, archives, request, state: controlledState, onStateChange,
  renderRow, onManageArchives, onSale, onPrivateMovement, onScopeChange }: {
  transactions: Transaction[];
  payments: FinancialPayment[];
  archives: FinancialArchive[];
  request?: JournalRequest;
  state?: JournalState;
  onStateChange?: (next: JournalState) => void;
  renderRow: (transaction: Transaction) => React.ReactNode;
  onManageArchives: () => void;
  onSale: () => void;
  onPrivateMovement: () => void;
  onScopeChange?: (scope: JournalScope) => void;
}) {
  const [internalState, setInternalState] = useState(createJournalState);
  const journal = controlledState ?? internalState;
  const { scope, query, category, filter, month, allDates, archiveYear, year } = journal;
  const searchRef = useRef<HTMLInputElement>(null);
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
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr').replace(/(\d),(\d)/g, '$1.$2');
    return classified.filter(({ transaction: t, payment, date, direction, open, search, archived }) => {
      if (scope === 'archives' && (!archived || selectedYear !== 'all' && date?.slice(0, 4) !== selectedYear)) return false;
      if (scope === 'current' && !followingUp && archived && !open) return false;
      if (scope !== 'archives' && !followingUp && year && date?.slice(0, 4) !== year) return false;
      if (scope !== 'archives' && !year && !allDates && !followingUp && !(scope === 'current' && open) && !date?.startsWith(month)) return false;
      if (filter === 'void') { if (isActiveTransaction(t)) return false; }
      else if (!isActiveTransaction(t) && (scope === 'current' || filter !== 'all')) return false;
      if (needle && !search.includes(needle)) return false;
      if (category !== 'all' && t.category !== category && !t.finance?.lines.some(line =>
        (line.category ?? (line.kind === 'equipment' ? 'materiel' : line.kind === 'cleaning' ? 'nettoyage' : ['ingredient', 'packaging'].includes(line.kind) ? 'brassage' : t.category)) === category)) return false;
      if (['due', 'payable', 'receivable'].includes(filter) && !['unpaid', 'partial'].includes(payment.state)) return false;
      if (filter === 'payable' && direction !== 'out' || filter === 'receivable' && direction !== 'in') return false;
      if (filter === 'unknown' && payment.state !== 'unknown') return false;
      if (filter === 'review' && date && payment.state !== 'unknown' && payment.overpaidCents === 0 && (t.proofUrl || t.finance?.proofDocumentId)) return false;
      return true;
    }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt - a.recordedAt || a.transaction.id.localeCompare(b.transaction.id));
  }, [classified, scope, selectedYear, followingUp, query, category, filter, allDates, month, year]);
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
  const clearFilters = () => { change({ query: '', category: 'all', filter: 'all' }); searchRef.current?.focus(); };
  const showEverything = () => {
    replaceState(createJournalState({ scope: 'all', allDates: true, requestKey: journal.requestKey }));
    searchRef.current?.focus();
  };

  return <div className="finance-journal">
    <div className="journal-toolbar" aria-label="Filtres du journal">
      <div className="journal-scopes" role="group" aria-label="Périmètre du journal">
        {([['current', 'Courantes'], ['archives', 'Archives'], ['all', 'Tout']] as const).map(([value, label]) =>
          <button type="button" key={value} aria-pressed={scope === value} onClick={() => changeScope(value)}>{label}</button>)}
      </div>
      <div className="journal-period">
        {scope === 'archives' ? <Field label="Année archivée"><select aria-label="Année archivée" value={selectedYear} onChange={e => change({ archiveYear: e.target.value })}>
          {!years.length && <option value="">Aucune année archivée</option>}
          {years.map(value => <option key={value} value={value}>{value}</option>)}
          {years.length > 1 && <option value="all">Toutes les années archivées</option>}
        </select></Field> : followingUp ? <div className="journal-period-reading"><span>Période du suivi</span><strong>{periodLabel}</strong></div>
          : year ? <div className="journal-period-reading"><span>Période du journal</span><strong>{periodLabel}</strong></div>
            : <Field label="Période du journal"><input type="month" aria-label="Période du journal" value={month} disabled={allDates}
              onChange={e => { if (e.target.value) change({ month: e.target.value, allDates: false }); }}/></Field>}
        {scope !== 'archives' && !followingUp && <button type="button" className="journal-chip journal-date-toggle" aria-pressed={allDates && !year}
          onClick={() => change({ year: '', allDates: year ? true : !allDates })}>Toutes les dates</button>}
      </div>
      <div className="journal-search-category">
        <div className="finance-field journal-search"><label htmlFor={searchId}>Rechercher une opération</label><span className="journal-search-control"><Search size={15} aria-hidden="true"/>
          <input id={searchId} ref={searchRef} aria-label="Rechercher une opération" placeholder="Libellé, tiers, montant…" value={query} onChange={e => change({ query: e.target.value })}/>
          {query && <button type="button" aria-label="Effacer la recherche" onClick={() => { change({ query: '' }); searchRef.current?.focus(); }}><X size={14} aria-hidden="true"/></button>}
        </span></div>
        <Field label="Catégorie"><select aria-label="Catégorie" value={category} onChange={e => change({ category: e.target.value })}><option value="all">Toutes</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></Field>
      </div>
      <div className="journal-filters" role="group" aria-label="État des opérations">
        {(['all', 'payable', 'receivable', 'review'] as const).map(value => <button type="button" className="journal-chip" key={value}
          aria-pressed={filter === value} onClick={() => change({ filter: value })}>{FILTER_LABELS[value]}</button>)}
      </div>
      {specialFilter && <div className="journal-active-filter"><button type="button" className="journal-chip" aria-label={`Retirer le filtre : ${FILTER_LABELS[filter]}`}
        onClick={() => change({ filter: 'all' })}>{FILTER_LABELS[filter]}<X size={13} aria-hidden="true"/></button></div>}
      <details className="journal-extra"><summary>Autres filtres</summary><div>
        <button type="button" className="journal-chip" aria-pressed={filter === 'void'} onClick={() => change({ filter: filter === 'void' ? 'all' : 'void' })}>Écritures annulées uniquement</button>
        {hasFilters && filtered.length > 0 && <button type="button" className="journal-text-action" onClick={clearFilters}>Retirer les filtres</button>}
        <button type="button" className="journal-text-action" onClick={onManageArchives}><Archive size={15} aria-hidden="true"/>Gérer les archives</button>
      </div></details>
    </div>
    <p className="journal-result-count" role="status">{filtered.length} opération{filtered.length > 1 ? 's' : ''}{filtered.length > PAGE_SIZE ? ` · ${offset + 1}–${Math.min(offset + PAGE_SIZE, filtered.length)} affichées` : ''}
      <span>{followingUp ? 'Suivi sur tous les exercices, archives comprises.' : scope === 'current' ? 'Factures ouvertes incluses' : scope === 'all' ? 'Archives comprises' : `${archivedCount} pièce(s) conservée(s) · ${periodLabel}`}</span></p>
    <div className="finance-list">{filtered.slice(offset, offset + PAGE_SIZE).map(entry => <React.Fragment key={entry.transaction.id}>
      {entry.archived && entry.open && <p className="finance-archive-followup">Exercice {entry.date?.slice(0, 4)} archivé · facture encore ouverte</p>}
      {renderRow(entry.transaction)}
    </React.Fragment>)}</div>
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
    {scope !== 'archives' && <div className="journal-actions"><button type="button" className="journal-text-action" onClick={onSale}><ArrowUpRight size={15} aria-hidden="true"/>Enregistrer une vente</button><button type="button" className="journal-text-action" onClick={onPrivateMovement}>Apport ou prélèvement privé</button></div>}
  </div>;
}
