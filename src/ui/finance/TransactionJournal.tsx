import React, { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowUpRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialArchive, FinancialPayment } from '../../domain/finance/types';
import { archiveIndex, isTransactionArchived } from '../../domain/finance/archive';
import { isoDate, isActiveTransaction, paymentState, todayISO, transactionAmount, transactionVendor } from '../../domain/finance/ledger';
import { CATEGORY_LABELS, Field } from './FinanceForms';
import { MobileDetails } from '../ViewNavigation';

export type JournalScope = 'current' | 'archives' | 'all';
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
const PAGE_SIZE = 50;

export function TransactionJournal({ transactions, payments, archives, request, renderRow, onManageArchives, onSale, onPrivateMovement, onScopeChange }: {
  transactions: Transaction[];
  payments: FinancialPayment[];
  archives: FinancialArchive[];
  request?: JournalRequest;
  renderRow: (transaction: Transaction) => React.ReactNode;
  onManageArchives: () => void;
  onSale: () => void;
  onPrivateMovement: () => void;
  onScopeChange?: (scope: JournalScope) => void;
}) {
  const [scope, setScope] = useState<JournalScope>('current');
  const [query, setQuery] = useState(''), [category, setCategory] = useState('all'), [filter, setFilter] = useState('all');
  const [month, setMonth] = useState(todayISO().slice(0, 7)), [allDates, setAllDates] = useState(false);
  const [archiveYear, setArchiveYear] = useState('');
  const [journalYear, setJournalYear] = useState('');
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const index = useMemo(() => archiveIndex(archives), [archives]);
  const years = useMemo(() => archives.filter(a => a.status === 'archived').map(a => a.year).sort((a, b) => b - a), [archives]);
  const selectedYear = archiveYear === 'all' || years.includes(Number(archiveYear)) ? archiveYear : String(years[0] ?? '');
  const entries = useMemo(() => transactions.map(transaction => {
    const state = paymentState(transaction, payments, transactions, todayISO());
    const date = isoDate(transaction.date);
    return {
      transaction, state, date,
      recordedAt: Date.parse(transaction.finance?.recordedAt ?? '') || 0,
      open: isActiveTransaction(transaction) && (state.state === 'unpaid' || state.state === 'partial' || state.overpaidCents > 0),
      search: [transaction.description, transactionVendor(transaction), transaction.id, transaction.finance?.invoiceNumber,
        (transactionAmount(transaction) / 100).toFixed(2)].join(' ').toLocaleLowerCase('fr'),
    };
  }), [transactions, payments]);
  const classified = useMemo(() => entries.map(entry => ({ ...entry, archived: isTransactionArchived(entry.transaction, index) })), [entries, index]);
  const archivedCount = classified.filter(e => e.archived).length;
  useEffect(() => { onScopeChange?.(scope); }, [scope, onScopeChange]);

  useEffect(() => {
    if (!request) return;
    setScope(request.scope ?? 'all');
    setQuery(request.query ?? ''); setCategory(request.category ?? 'all'); setFilter(request.filter ?? 'all');
    setMonth(request.month ?? todayISO().slice(0, 7)); setAllDates(request.allDates ?? true);
    setArchiveYear(request.archiveYear ?? '');
    setJournalYear(request.year ?? '');
  }, [request]);

  // Follow-up deliberately includes earlier years. Archiving never settles a bill.
  const followingUp = scope === 'current' && (filter === 'due' || filter === 'review');
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr').replace(/(\d),(\d)/g, '$1.$2');
    return classified.filter(({ transaction: t, state, date, open, search, archived }) => {
      if (scope === 'archives' && (!archived || selectedYear !== 'all' && date?.slice(0, 4) !== selectedYear)) return false;
      if (scope === 'current' && !followingUp && archived && !open) return false;
      if (scope !== 'archives' && !followingUp && journalYear && date?.slice(0, 4) !== journalYear) return false;
      if (scope !== 'archives' && !journalYear && !allDates && !followingUp && !(scope === 'current' && open) && !date?.startsWith(month)) return false;
      if (filter === 'void') { if (isActiveTransaction(t)) return false; }
      else if (!isActiveTransaction(t) && (scope === 'current' || filter !== 'all')) return false;
      if (needle && !search.includes(needle)) return false;
      if (category !== 'all' && t.category !== category && !t.finance?.lines.some(line =>
        (line.category ?? (line.kind === 'equipment' ? 'materiel' : line.kind === 'cleaning' ? 'nettoyage' : ['ingredient', 'packaging'].includes(line.kind) ? 'brassage' : t.category)) === category)) return false;
      if (filter === 'due' && !['unpaid', 'partial'].includes(state.state)) return false;
      if (filter === 'review' && date && state.state !== 'unknown' && state.overpaidCents === 0 && (t.proofUrl || t.finance?.proofDocumentId)) return false;
      return true;
    }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.recordedAt - a.recordedAt || a.transaction.id.localeCompare(b.transaction.id));
  }, [classified, scope, selectedYear, followingUp, query, category, filter, allDates, month, journalYear]);
  const pageKey = JSON.stringify([scope, selectedYear, query, category, filter, allDates, month, journalYear]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = pageState.key === pageKey ? Math.min(pageState.page, pageCount) : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const changeScope = (value: JournalScope) => { setScope(value); setQuery(''); setCategory('all'); setFilter('all'); setAllDates(value === 'all'); setJournalYear(''); };
  const periodLabel = followingUp ? 'Tous les exercices' : scope === 'archives' ? 'Années archivées'
    : journalYear ? `Exercice ${journalYear}` : allDates ? 'Toutes les dates'
      : new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
  const filterLabel = [scope === 'archives' ? 'Archives' : scope === 'all' ? 'Tout' : 'Courantes', periodLabel, query ? `« ${query} »` : '', category !== 'all' ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category : '', filter === 'void' ? 'Écritures annulées' : filter === 'due' ? 'À payer' : filter === 'review' ? 'À compléter' : ''].filter(Boolean).join(' · ');

  return <>
    <MobileDetails title="Rechercher et filtrer" summary={filterLabel}>
    <div className="finance-filter finance-journal-scopes" role="group" aria-label="Périmètre du journal">
      {([['current', 'Courantes'], ['archives', 'Archives'], ['all', 'Tout']] as const).map(([value, label]) =>
        <button key={value} aria-pressed={scope === value} onClick={() => changeScope(value)}>{label}</button>)}
    </div>
    {scope === 'archives' && <Field label="Année archivée"><select value={selectedYear} onChange={e => setArchiveYear(e.target.value)}>
      {!years.length && <option value="">Aucune année archivée</option>}
      {years.map(y => <option key={y} value={y}>{y}</option>)}
      {years.length > 1 && <option value="all">Toutes les années archivées</option>}
    </select></Field>}
    <div className="relative"><Search size={19} className="absolute left-3 top-3.5 text-cave-400"/>
      <input className="finance-search" style={{ paddingLeft: 40 }} aria-label="Rechercher une opération" placeholder="Fournisseur, libellé, montant…" value={query} onChange={e => setQuery(e.target.value)}/>
    </div>
    <div className="finance-filter" role="group" aria-label="État des opérations">
      {[['all', 'Toutes'], ['due', 'À payer'], ['review', 'À compléter']].map(([value, label]) =>
        <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
    </div>
    <details className="finance-journal-filters"><summary><span>Période et filtres<small>{filterLabel}</small></span></summary>
    {scope !== 'archives' && !followingUp && (journalYear ? <div className="finance-notice">Exercice {journalYear}<button className="finance-link" onClick={() => { setJournalYear(''); setAllDates(true); }}>Choisir une autre période</button></div> : <div className="finance-actions finance-period">
      <Field label="Période du journal"><input type="month" value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setAllDates(false); } }}/></Field>
      <button className="finance-link self-end" aria-pressed={allDates} onClick={() => setAllDates(!allDates)}>Toutes les dates</button>
    </div>)}
    <Field label="Catégorie"><select value={category} onChange={e => setCategory(e.target.value)}><option value="all">Toutes les catégories</option>
      {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></Field>
    <button className="finance-link" aria-pressed={filter === 'void'} onClick={() => setFilter(filter === 'void' ? 'all' : 'void')}>Écritures annulées uniquement</button>
    {scope !== 'archives' && <button className="finance-link" onClick={onManageArchives}><Archive size={18}/>Gérer les archives</button>}
    </details>
    </MobileDetails>
    {scope === 'archives' && <div className="finance-archive-intro"><p className="finance-muted">{archivedCount} pièce(s) conservée(s).</p><button className="finance-link" onClick={onManageArchives}><Archive size={18}/>Gérer les archives</button></div>}
    <p className="finance-muted mt-3" role="status">{filtered.length} opération{filtered.length > 1 ? 's' : ''}{filtered.length > PAGE_SIZE ? ` · ${offset + 1}–${Math.min(offset + PAGE_SIZE, filtered.length)} affichées` : ''}{followingUp ? ' · Suivi sur tous les exercices, archives comprises.' : scope === 'current' ? ' · Factures ouvertes incluses' : scope === 'all' ? ' · Archives comprises' : ''}</p>
    <div className="finance-list">{filtered.slice(offset, offset + PAGE_SIZE).map(entry => <React.Fragment key={entry.transaction.id}>
      {entry.archived && entry.open && <p className="finance-archive-followup">Exercice {entry.date?.slice(0, 4)} archivé · facture encore ouverte</p>}
      {renderRow(entry.transaction)}
    </React.Fragment>)}</div>
    {pageCount > 1 && <nav className="finance-pagination" aria-label="Pages du journal">
      <button className="finance-action secondary" aria-label="Page précédente" disabled={page === 1} onClick={() => setPageState({ key: pageKey, page: page - 1 })}><ChevronLeft size={18}/></button>
      <span aria-live="polite">Page {page} sur {pageCount}</span>
      <button className="finance-action secondary" aria-label="Page suivante" disabled={page === pageCount} onClick={() => setPageState({ key: pageKey, page: page + 1 })}><ChevronRight size={18}/></button>
    </nav>}
    {!filtered.length && <div className="finance-empty"><Archive className="mx-auto"/><h3>{scope === 'archives' && !years.length ? 'Tes archives, année après année' : 'Aucune opération trouvée'}</h3>
      <p>{scope === 'archives' && !years.length ? 'Range une année terminée pour alléger ton journal. Tu pourras toujours la consulter ou la réintégrer.' : 'Change la période, la recherche ou les filtres.'}</p>
      {scope === 'archives' && !years.length && <button className="finance-link mx-auto" onClick={onManageArchives}>Choisir une année à archiver</button>}
    </div>}
    {scope !== 'archives' && <div className="finance-actions"><button className="finance-link" onClick={onSale}><ArrowUpRight size={17}/>Enregistrer une vente</button><button className="finance-link" onClick={onPrivateMovement}>Apport ou prélèvement privé</button></div>}
  </>;
}
