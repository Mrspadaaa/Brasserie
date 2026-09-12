import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArchiveRestore, ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialArchive, FinancialClosing, FinancialPayment } from '../../domain/finance/types';
import { archiveIndex, isTransactionArchived } from '../../domain/finance/archive';
import { isActiveTransaction, isoDate, paymentState, todayISO } from '../../domain/finance/ledger';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { Sheet } from '../Sheet';

export function ArchiveManagerSheet({ transactions, payments, archives, closings, onClose, onBrowse, onSaved }: {
  transactions: Transaction[]; payments: FinancialPayment[]; archives: FinancialArchive[]; closings: FinancialClosing[];
  onClose: () => void; onBrowse: (year: number, archived: boolean) => void; onSaved: (message: string) => void;
}) {
  const [action, setAction] = useState<{ year: number; archive: boolean } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const confirmation = useRef<HTMLElement>(null);
  useEffect(() => { if (action) confirmation.current?.scrollIntoView?.({ block: 'nearest' }); }, [action]);
  const currentYear = Number(todayISO().slice(0, 4));
  const index = useMemo(() => archiveIndex(archives), [archives]);
  const overview = useMemo(() => {
    const groups = new Map<number, { year: number; total: number; archived: number; open: number; unknown: number }>();
    for (const archive of archives) groups.set(archive.year, { year: archive.year, total: 0, archived: 0, open: 0, unknown: 0 });
    for (const transaction of transactions) {
      const date = isoDate(transaction.date); if (!date) continue;
      const year = Number(date.slice(0, 4));
      const group = groups.get(year) ?? { year, total: 0, archived: 0, open: 0, unknown: 0 };
      group.total++;
      if (isTransactionArchived(transaction, index)) group.archived++;
      if (isActiveTransaction(transaction)) {
        const state = paymentState(transaction, payments, transactions, todayISO());
        if (['unpaid', 'partial'].includes(state.state) || state.overpaidCents > 0) group.open++;
        if (state.state === 'unknown') group.unknown++;
      }
      groups.set(year, group);
    }
    return [...groups.values()].sort((a, b) => b.year - a.year);
  }, [transactions, payments, archives, index]);
  const undated = transactions.filter(t => !isoDate(t.date)).length;
  const selected = overview.find(row => row.year === action?.year);
  const submit = async () => {
    if (!action || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      await FinancialArchiveService.setYearArchived(action.year, action.archive);
      onSaved(action.archive ? `Année ${action.year} archivée. Les factures ouvertes restent dans le suivi.` : `Année ${action.year} réintégrée dans le journal courant.`);
      setAction(null);
    } catch (e) { setError((e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Sheet open title="Les archives de la brasserie" subtitle="Classer et retrouver chaque année." onClose={onClose} className="finance-sheet"
    footer={<button className="finance-action secondary w-full" onClick={onClose}>Fermer</button>}>
    <div className="finance-form">
      <div className="finance-archive-summary"><Archive size={25}/><div><h3>Un journal léger au quotidien</h3><p className="finance-muted">Archive les années terminées. Tes analyses, les prix de tes ingrédients, les amortissements et les dossiers annuels gardent toutes leurs références.</p></div></div>
      <p className="finance-muted">Tu peux réintégrer une année à tout moment. Archiver ne supprime rien et ne marque aucune facture comme payée. Une nouvelle écriture ajoutée à une ancienne année reste courante jusqu’au prochain archivage.</p>
      <p className="finance-muted">Les chiffres des années conservées restent dans le cache de cet appareil pour garder des analyses complètes. Après la première ouverture, seuls les changements sont synchronisés ; les justificatifs sont ouverts à la demande.</p>
      {undated > 0 && <p className="finance-notice">{undated} pièce(s) sans date valide restent dans le journal courant. Corrige leur date pour les ranger dans la bonne année.</p>}
      {action && selected && <section ref={confirmation} className="finance-archive-confirm" aria-label="Vérifier le classement de l’année">
        <h3>{action.archive ? `Archiver ${action.year}` : `Réintégrer ${action.year}`}</h3>
        <p>{action.archive ? `${selected.total - selected.archived} pièce(s) supplémentaire(s) seront rangées dans cette année.` : `${selected.archived} pièce(s) reviendront dans le journal courant.`}</p>
        {action.archive && selected.open > 0 && <p className="finance-muted">{selected.open} facture(s) ouverte(s) resteront accessibles dans le suivi quotidien.</p>}
        {action.archive && selected.unknown > 0 && <p className="finance-muted">{selected.unknown} règlement(s) historique(s) restent à confirmer. Ils restent dans « À compléter » et dans les contrôles annuels.</p>}
        {error && <p className="finance-error" role="alert">{error}</p>}
        <div className="finance-actions"><button className="finance-action secondary" disabled={busy} onClick={() => { setAction(null); setError(''); }}>Retour</button>
          <button className="finance-action" disabled={busy} onClick={() => void submit()}>{busy ? 'Confirmation en cours…' : error ? 'Réessayer la confirmation' : action.archive ? 'Confirmer l’archivage' : 'Réintégrer cette année'}</button></div>
      </section>}
      <div className="finance-archive-years">{overview.map(row => {
        const record = archives.find(a => a.year === row.year);
        const archived = record?.status === 'archived';
        const closed = closings.some(c => c.year === row.year && c.report);
        return <section className="finance-archive-year" key={row.year}>
          <div className="finance-heading"><h3>{row.year}</h3><span className={`finance-status ${archived ? 'paid' : 'unknown'}`}>{archived ? 'Archivée' : row.year >= currentYear ? 'En cours' : 'Dans le journal'}</span></div>
          <p className="finance-muted">{row.total} pièce(s){row.open > 0 ? ` · ${row.open} à suivre` : ''}{closed ? ' · rapport annuel figé' : ''}</p>
          {archived && row.total > row.archived && <p className="finance-muted">{row.total - row.archived} nouvelle(s) pièce(s) encore dans le journal courant.</p>}
          {archived && record?.archivedAt && <p className="finance-muted">Classée le {new Date(record.archivedAt).toLocaleDateString('fr-CH')}</p>}
          <div className="finance-archive-year-actions"><button className="finance-link" onClick={() => onBrowse(row.year, archived)}>Consulter {row.year}<ChevronRight size={17}/></button>
            {archived ? <button className="finance-action secondary" disabled={busy} onClick={() => { setAction({ year: row.year, archive: false }); setError(''); }}><ArchiveRestore size={17}/>Réintégrer {row.year}</button>
              : row.year < currentYear && row.total > 0 && <button className="finance-action secondary" disabled={busy} onClick={() => { setAction({ year: row.year, archive: true }); setError(''); }}><Archive size={17}/>Archiver {row.year}</button>}
            {archived && row.total > row.archived && <button className="finance-link" disabled={busy} onClick={() => { setAction({ year: row.year, archive: true }); setError(''); }}>Classer les nouvelles pièces de {row.year}</button>}
          </div>
        </section>;
      })}</div>
      {!overview.some(row => row.year < currentYear) && <p className="finance-notice">L’archivage sera disponible dès qu’une année de ton journal sera terminée.</p>}
    </div>
  </Sheet>;
}
