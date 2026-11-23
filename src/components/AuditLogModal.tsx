import React, { useMemo, useState } from 'react';
import { Download, History, Search } from 'lucide-react';
import { AuditLog } from '../types';
import { FirestoreRepo } from '../services/firestoreRepo';
import { Feuille } from './feuilles/Feuille';
import {
  actionCourte, comptesRubriques, etatVideJournal, filtrerJournal, filtreActif, groupesParJour, heureCourte, histogramme14, partsParPersonne,
  RUBRIQUES, SANS_FILTRE, type Filtre, type Personne
} from './feuilles/regles';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

/** BE-59 : « REC-df46da79-dce9-4a7a-… » n'apprend rien au brasseur ; on garde le préfixe et le début, l'identifiant entier reste au survol et dans la recherche. */
export const referenceCourte = (id: string): string => id.length > 15 ? id.slice(0, 12) + '…' : id;

const PERSONNES: { nom: Personne; lettre: 'G' | 'A'; couleur: string }[] = [
  { nom: 'Gaëtan', lettre: 'G', couleur: 'var(--wat)' },
  { nom: 'Aricia', lettre: 'A', couleur: 'var(--cop)' }
];

/**
 * Journal des modifications (d3p2) : une frise de quatorze jours (touchable : elle filtre sur le jour), la part de
 * Gaëtan et d'Aricia (touchable : elle filtre sur la personne), la recherche, les rubriques, puis les écritures par jour.
 * Tout se lit dans `logs` : sans écriture, les barres sont vides et le dit.
 */
export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, logs }) => {
  const [filtre, setFiltre] = useState<Filtre>(SANS_FILTRE);
  const [, updateHistory] = useState(0);
  React.useEffect(() => FirestoreRepo.subscribe(() => updateHistory(value => value + 1)), []);
  const maintenant = useMemo(() => new Date(), [isOpen]);
  const histo = useMemo(() => histogramme14(logs, maintenant), [logs, maintenant]);
  const parts = useMemo(() => partsParPersonne(histo), [histo]);
  const visibles = useMemo(() => filtrerJournal(logs, filtre), [logs, filtre]);
  const comptes = useMemo(() => comptesRubriques(logs, filtre), [logs, filtre]);
  const groupes = useMemo(() => groupesParJour(visibles, maintenant), [visibles, maintenant]);
  if (!isOpen) return null;
  const history = FirestoreRepo.auditHistoryStatus();
  const poser = (partiel: Partial<Filtre>) => setFiltre(f => ({ ...f, ...partiel }));
  const maxJour = Math.max(1, ...histo.map(j => j.g + j.a));
  const jourTitre = filtre.jour ? groupesLabel(histo, filtre.jour) : '';

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

  const vide = !visibles.length ? etatVideJournal(logs.length, filtre) : null;

  const bande = (
    <>
      <div className="fe-cap">
        <span><b className="fe-m">{parts.total}</b> {parts.total > 1 ? 'modifications' : 'modification'} en 14 jours</span>
        <span>{filtre.jour ? `jour : ${jourTitre}` : 'touche un jour'}</span>
      </div>
      <div className="fe-histo" role="group" aria-label="Modifications par jour, sur 14 jours">
        {histo.map(j => (
          <button key={j.cle} type="button" className={j.aujourdhui ? 'fe-auj' : undefined} aria-pressed={filtre.jour === j.cle}
            aria-label={`${j.cle} : ${j.g + j.a} ${j.g + j.a > 1 ? 'modifications' : 'modification'}`}
            onClick={() => poser({ jour: filtre.jour === j.cle ? null : j.cle })}>
            {j.a > 0 && <i style={{ height: `${(j.a / maxJour) * 100}%`, background: 'var(--cop)' }} />}
            {j.g > 0 && <i style={{ height: `${(j.g / maxJour) * 100}%`, background: 'var(--wat)' }} />}
          </button>
        ))}
      </div>
      <div className="fe-hleg" aria-hidden="true">{histo.map(j => <span key={j.cle} className={`fe-m${j.aujourdhui ? ' fe-auj' : ''}`}>{j.legende}</span>)}</div>
      <div className="fe-pp">
        {PERSONNES.map(p => {
          const n = p.nom === 'Gaëtan' ? parts.g : parts.a, pct = p.nom === 'Gaëtan' ? parts.pctG : parts.pctA;
          return (
            <button key={p.nom} type="button" className="fe-pe" aria-pressed={filtre.personne === p.nom}
              onClick={() => poser({ personne: filtre.personne === p.nom ? null : p.nom })}>
              <i className="fe-av" data-p={p.lettre}>{p.lettre}</i>
              <div><span><b className="fe-m">{n}</b>{p.nom}<small className="fe-m">{pct === null ? '–' : pct + ' %'}</small></span>
                <u><s style={{ width: `${pct ?? 0}%`, background: p.couleur }} /></u></div>
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <Feuille open={isOpen} onClose={onClose} teinte="age" icone={<History size={16} />} titre="Journal des modifications" bande={bande}
      pied={<>
        <span className="fe-sp" />
        <button type="button" className="fe-b2" onClick={handleExportLogs} disabled={!logs.length}
          title={history.complete ? 'Exporter le journal complet en JSON' : 'Exporter uniquement les événements chargés en JSON'}
          aria-label={history.complete ? 'Exporter le journal complet' : 'Exporter les événements chargés'}><Download size={14} aria-hidden="true" />Exporter JSON</button>
        {!history.complete && <button type="button" className="fe-b2" disabled={history.loading} onClick={() => void FirestoreRepo.loadOlderAuditLogs().catch(() => {})}>
          {history.loading ? 'Chargement…' : 'Charger les 100 précédents'}</button>}
      </>}>
      <label className="fe-se"><Search size={15} aria-hidden="true" />
        <input type="search" name="audit_filter_query" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
          aria-label="Filtrer le journal" placeholder="Mot-clé, réf (LOT-001, B-031)…" value={filtre.mot} onChange={e => poser({ mot: e.target.value })} /></label>
      <div className="fe-ch" role="group" aria-label="Rubrique">
        {(['all', ...RUBRIQUES] as string[]).map(r => (
          <button key={r} type="button" aria-pressed={filtre.rubrique === r} onClick={() => poser({ rubrique: r })}>
            {r === 'all' ? 'Tous' : r}<em className="fe-m">{comptes[r] ?? 0}</em>
          </button>
        ))}
      </div>
      {!history.complete && <p className="fe-notice">Les événements récents sont chargés en premier. La recherche et l’export portent sur les {logs.length} événements chargés.</p>}
      {groupes.map(g => (
        <section key={g.cle} aria-label={g.titre}>
          <div className="fe-day"><span>{g.titre}</span><span className="fe-m">{g.entrees.length}</span></div>
          {g.entrees.map(log => {
            const ac = actionCourte(log.action);
            return (
              <div className="fe-je" key={log.id}>
                <time className="fe-m">{heureCourte(log.timestamp)}</time>
                <i className="fe-av" data-p={log.user === 'Gaëtan' ? 'G' : 'A'} title={log.user}>{log.user === 'Gaëtan' ? 'G' : 'A'}</i>
                <span className="fe-l">{log.summary}
                  <small><code className="fe-m" title={log.entityId}>{referenceCourte(log.entityId)}</code> · {log.category}</small>
                  {log.details && <span className="fe-det fe-m">{log.details}</span>}
                </span>
                <span className="fe-ac" data-a={ac.classe}>{ac.texte}</span>
              </div>
            );
          })}
        </section>
      ))}
      {vide && (
        <div className="fe-emp" role="status"><History size={28} aria-hidden="true" /><b>{vide.titre}</b>{vide.texte}
          {vide.effacer && <button type="button" className="fe-b2" onClick={() => setFiltre(SANS_FILTRE)}>Enlever les filtres</button>}</div>
      )}
      {history.error && <p role="alert" className="fe-err-t">{history.error}</p>}
    </Feuille>
  );
};

const groupesLabel = (histo: { cle: string; legende: string }[], cle: string) => {
  const [, m, d] = cle.split('-');
  return histo.some(j => j.cle === cle) ? `${d}.${m}` : cle;
};
