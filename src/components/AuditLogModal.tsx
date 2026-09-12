import React, { useState } from 'react';
import { compte } from '../services/plural';
import { X, Search, Shield, Clock, Download } from 'lucide-react';
import { AuditLog } from '../types';
import { ModalShell } from '../ui/ModalShell';
import { FirestoreRepo } from '../services/firestoreRepo';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [, updateHistory] = useState(0);
  React.useEffect(() => FirestoreRepo.subscribe(() => updateHistory(value => value + 1)), []);
  if (!isOpen) return null;
  const history = FirestoreRepo.auditHistoryStatus();

  const filteredLogs = logs.filter((l) => {
    const matchesCat = filterCat === 'all' || l.category === filterCat;
    const matchesUser = filterUser === 'all' || l.user === filterUser;
    const matchesSearch =
      l.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.timestamp.includes(searchTerm);
    return matchesCat && matchesUser && matchesSearch;
  });

  const handleExportLogs = () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Journal_Audit_${history.complete ? 'Complet' : 'Extrait'}_L_Affinee_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    if (ts.includes('T')) {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hrs = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${mon}.${year} ${hrs}:${min}`;
      }
    }
    return ts;
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-cave-800 bg-cave-900/90 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-cave-850 rounded-xl text-ebc-straw border border-cave-800">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-cave-50">Journal d'Audit</h3>
            <p className="text-xs text-cave-400">Traçabilité des modifications</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportLogs}
            title={history.complete ? 'Exporter le journal complet en JSON' : 'Exporter uniquement les événements chargés en JSON'}
            aria-label={history.complete ? 'Exporter le journal complet' : 'Exporter les événements chargés'}
            className="p-2 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 bg-cave-950/60 border-b border-cave-800/80 space-y-2 text-xs sm:text-sm shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-cave-400 absolute left-3 top-2.5" />
          <input
            type="search"
            name="audit_filter_query"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            placeholder="Filtrer par mot-clé, réf (LOT-001, B-008)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cave-900 border border-cave-800 rounded-xl pl-8 pr-3 py-1.5 text-cave-50 placeholder-cave-400 focus:outline-none focus:border-ebc-straw text-xs sm:text-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex space-x-1 overflow-x-auto scrollbar-none">
            {['all', 'Finances', 'Production', 'Stocks', 'Clients', 'Fûts'].map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  filterCat === cat
                    ? 'bg-ebc-straw text-cave-950 font-bold'
                    : 'bg-cave-850 text-cave-400 hover:text-cave-200'
                }`}
              >
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>

          {/* User Filter */}
          <div className="flex space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => setFilterUser(filterUser === 'Gaëtan' ? 'all' : 'Gaëtan')}
              className={`px-2 py-0.5 rounded-lg text-footnote font-semibold border ${
                filterUser === 'Gaëtan'
                  ? 'bg-water/20 text-water border-water/40'
                  : 'bg-cave-850 text-cave-400 border-cave-700'
              }`}
            >
              Gaëtan
            </button>
            <button
              type="button"
              onClick={() => setFilterUser(filterUser === 'Aricia' ? 'all' : 'Aricia')}
              className={`px-2 py-0.5 rounded-lg text-footnote font-semibold border ${
                filterUser === 'Aricia'
                  ? 'bg-ebc-copper/20 text-ebc-copper border-ebc-copper/40'
                  : 'bg-cave-850 text-cave-400 border-cave-700'
              }`}
            >
              Aricia
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 text-xs sm:text-sm overscroll-contain">
        {!history.complete && <p className="text-cave-400 leading-relaxed">Les événements récents sont chargés en premier. La recherche et l’export portent sur les {logs.length} événements chargés.</p>}
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-cave-400">
            Aucun événement ne correspond à vos filtres.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actionColors: Record<string, { bg: string; text: string; border: string }> = {
              Création: { bg: 'bg-hop/10', text: 'text-hop', border: 'border-hop/30' },
              Modification: { bg: 'bg-ebc-straw/10', text: 'text-ebc-straw', border: 'border-ebc-straw/30' },
              Suppression: { bg: 'bg-alert/10', text: 'text-alert', border: 'border-alert/30' },
              Statut: { bg: 'bg-water/10', text: 'text-water', border: 'border-water/30' }
            };
            const col = actionColors[log.action] || actionColors.Modification;

            return (
              <div
                key={log.id}
                className="p-3 bg-cave-900 border border-cave-800 rounded-2xl space-y-1.5 hover:border-cave-700 transition"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-footnote font-bold px-1.5 py-0.5 rounded border ${col.border} ${col.bg} ${col.text}`}>
                      {log.action}
                    </span>
                    <span className="text-footnote text-cave-400 font-medium">{log.category}</span>
                    <span className="text-footnote font-mono text-ebc-straw font-bold whitespace-nowrap">{log.entityId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-footnote text-cave-400 shrink-0 ml-auto sm:ml-0">
                    <span className="flex items-center whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1 text-cave-400" />
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className={`font-semibold px-1.5 py-0.5 rounded text-footnote ${
                      log.user === 'Gaëtan' ? 'bg-water/10 text-water' : 'bg-ebc-copper/10 text-ebc-copper'
                    }`}>
                      {log.user}
                    </span>
                  </div>
                </div>

                <p className="font-semibold text-cave-200 text-xs sm:text-sm">{log.summary}</p>
                {log.details && (
                  <p className="text-xs text-cave-400 bg-cave-950/60 p-1.5 rounded-lg font-mono">
                    {log.details}
                  </p>
                )}
              </div>
            );
          })
        )}
        {history.error && <p role="alert" className="text-alert leading-relaxed">{history.error}</p>}
        {!history.complete && <button type="button" disabled={history.loading} onClick={() => void FirestoreRepo.loadOlderAuditLogs().catch(() => {})}
          className="w-full min-h-11 rounded-xl border border-cave-700 text-ebc-straw px-4 py-3 disabled:opacity-50">
          {history.loading ? 'Chargement des événements précédents…' : 'Charger les 100 événements précédents'}
        </button>}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 border-t border-cave-800 bg-cave-900 flex justify-between items-center text-xs sm:text-sm text-cave-400 shrink-0">
        <span>{filteredLogs.length} / {compte(logs.length, 'entrée')}</span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition"
        >
          Fermer
        </button>
      </div>
    </ModalShell>
  );
};
