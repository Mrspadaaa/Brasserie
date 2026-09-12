import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Download, LoaderCircle, Upload } from 'lucide-react';
import {
  exportNextBackupVolume, getPendingBackupExport, inspectBackupFiles,
  restoreInspectedBackup, startBackupExport,
  type BackupExportSession, type BackupInspection, type BackupProgress, type BackupVolume,
} from '../services/backupTransfer';
import { FirebaseAuthService } from '../services/firebaseAuth';

const actionClass = 'min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ebc-straw';
const primaryClass = `${actionClass} bg-ebc-straw text-cave-950 hover:bg-ebc-gold`;
const secondaryClass = `${actionClass} border border-cave-700 bg-cave-850 text-cave-50 hover:bg-cave-800`;
const count = (value: number) => value.toLocaleString('fr-CH');
const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date non précisée' : date.toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' });
};
const fileSize = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString('fr-CH', { maximumFractionDigits: 1 })} Mo`;
type ExportDraft = { session: BackupExportSession; current?: BackupVolume; savedVolumes: number };
// Keep only the current volume in memory, including when Settings is closed.
// Retaining every original from every volume would exhaust a mobile browser.
let pendingExport: ExportDraft | undefined;

function Progress({ value }: { value: BackupProgress }) {
  const measurable = typeof value.total === 'number' && value.total > 0 && typeof value.completed === 'number';
  return <div className="space-y-2 rounded-xl border border-cave-700 bg-cave-950/50 p-3" role="status">
    <p className="flex items-start gap-2 text-sm text-cave-200"><LoaderCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"/>{value.message}</p>
    <progress aria-label={value.message} className="block h-2 w-full accent-ebc-straw" {...(measurable ? { value: value.completed, max: value.total } : {})}/>
    {measurable && <p className="text-right text-xs tabular-nums text-cave-400">{count(value.completed!)} / {count(value.total!)}</p>}
  </div>;
}

export function BackupPanel({ onBusyChange, disabled = false }: { onBusyChange?: (busy: boolean) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState<ExportDraft | undefined>(() => pendingExport);
  const [savedCurrent, setSavedCurrent] = useState(() => Boolean(pendingExport?.current && pendingExport.savedVolumes >= pendingExport.current.volume));
  const [downloadUrl, setDownloadUrl] = useState('');
  const [inspection, setInspection] = useState<BackupInspection>();
  const [progress, setProgress] = useState<BackupProgress>();
  const [operation, setOperation] = useState<'export' | 'inspect' | 'restore' | 'drive'>();
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [driveReconnect, setDriveReconnect] = useState(false);
  const [driveReady, setDriveReady] = useState(false);
  useEffect(() => {
    if (!driveReconnect) return;
    let active = true;
    void FirebaseAuthService.prepareGoogleLogin().then(() => { if (active) setDriveReady(true); }).catch(() => { if (active) setError('La connexion Google ne peut pas être préparée. Réessaie.'); });
    return () => { active = false; };
  }, [driveReconnect]);
  const fileInput = useRef<HTMLInputElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | undefined>(undefined);
  const busy = operation !== undefined || disabled;
  const volume = draft?.current;

  useEffect(() => { onBusyChange?.(operation !== undefined); }, [operation, onBusyChange]);
  useEffect(() => { if (error) errorBox.current?.scrollIntoView({ block: 'nearest' }); }, [error]);
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => {
    if (!volume) { setDownloadUrl(''); return; }
    const url = URL.createObjectURL(volume.blob); setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [volume]);

  const remember = (next: ExportDraft) => { pendingExport = next; setDraft(next); };
  const begin = (kind: NonNullable<typeof operation>, message: string) => {
    if (controller.current || disabled) return;
    const current = new AbortController(); controller.current = current;
    setOperation(kind); setError(''); setResult(''); setProgress({ stage: kind, message });
    return current;
  };
  const finish = (current: AbortController) => {
    if (controller.current !== current) return;
    controller.current = undefined; setOperation(undefined); setProgress(undefined);
  };
  const reportProgress = (current: AbortController) => (next: BackupProgress) => {
    if (!current.signal.aborted && controller.current === current) setProgress(next);
  };
  const noteDriveError = (cause: unknown) => {
    const failure = cause as { code?: string; message?: string };
    if (failure?.code === 'drive/auth-required' || /reconnecte.*google drive|connexion google drive.*expir/i.test(failure?.message || '')) setDriveReconnect(true);
  };
  const reconnectDrive = async () => {
    const current = begin('drive', 'Connexion à ton compte Google Drive…');
    if (!current) return;
    try {
      // Popup stays on this explicit click, never inside a transfer retry.
      const connected = await FirebaseAuthService.refreshDriveAccess();
      if (!connected.success) throw Error(connected.error || 'Google Drive n’a pas pu être reconnecté.');
      setDriveReconnect(false);
      setResult('Google Drive est reconnecté. Reprends la préparation ou la restauration avec les mêmes fichiers.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Connexion à Google Drive impossible.'); }
    finally { finish(current); }
  };

  const prepareVolume = async (fresh = false) => {
    const current = begin('export', 'Préparation de la sauvegarde serveur…');
    if (!current) return;
    try {
      const session = fresh ? await startBackupExport(reportProgress(current), current.signal)
        : draft?.session ?? getPendingBackupExport() ?? await startBackupExport(reportProgress(current), current.signal);
      const next: ExportDraft = { session, savedVolumes: fresh ? 0 : draft?.savedVolumes ?? 0, current: fresh ? undefined : draft?.current };
      remember(next);
      const prepared = await exportNextBackupVolume(session, reportProgress(current), current.signal);
      remember({ ...next, current: prepared }); setSavedCurrent(false);
    } catch (cause) {
      noteDriveError(cause);
      setError(cause instanceof Error ? cause.message : 'La sauvegarde n’a pas pu être préparée. Réessaie lorsque la connexion est disponible.');
    } finally { finish(current); }
  };

  const inspect = async (files: File[]) => {
    if (!files.length) return;
    const current = begin('inspect', 'Vérification des fichiers avant restauration…');
    if (!current) return;
    setInspection(undefined); setRestoreFailed(false);
    try { setInspection(await inspectBackupFiles(files, reportProgress(current), current.signal)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Ces fichiers ne peuvent pas être lus. Sélectionne à nouveau la sauvegarde complète.'); }
    finally { finish(current); }
  };

  const restore = async () => {
    if (!inspection) return;
    const current = begin('restore', 'Restauration en cours. Garde cette fenêtre ouverte…');
    if (!current) return;
    setRestoreFailed(false);
    try {
      const restored = await restoreInspectedBackup(inspection, reportProgress(current), current.signal);
      if (!restored.complete) throw new Error('La restauration n’est pas encore terminée. Reprends avec les mêmes fichiers.');
      const operationalPreserved = 'operationalPreserved' in restored && typeof restored.operationalPreserved === 'number' ? restored.operationalPreserved : 0;
      setResult(`Restauration confirmée : ${count(restored.changed)} éléments enregistrés.${operationalPreserved > 0 ? ` ${count(operationalPreserved)} fiches de stock et de production ont conservé leur état actuel.` : ''}${restored.journalsPreserved ? ' Les journaux de brassage actuels ont été conservés.' : ''}`);
      setInspection(undefined);
    } catch (cause) {
      noteDriveError(cause);
      setRestoreFailed(true);
      setError(`${cause instanceof Error ? cause.message : 'La restauration a été interrompue.'} Reprends avec les mêmes fichiers pour terminer sans répéter les modifications déjà confirmées.`);
    } finally { finish(current); }
  };

  const confirmSaved = (checked: boolean) => {
    if (!draft || !volume) return;
    setSavedCurrent(checked);
    remember({ ...draft, savedVolumes: checked ? volume.volume : Math.max(0, volume.volume - 1) });
  };

  return <div className="min-w-0 space-y-5">
    <section aria-labelledby="backup-export-title" className="space-y-3">
      <div>
        <h4 id="backup-export-title" className="text-base font-bold text-cave-50">Garder une copie de la brasserie</h4>
        <p className="mt-1 text-sm leading-relaxed text-cave-200">Recettes, brassins, stocks, comptabilité et originaux des factures enregistrés dans l’application.</p>
        <p className="mt-1 text-sm text-cave-400">Les originaux privés de Drive sont inclus dans les ZIP. Les anciens liens ajoutés à la main restent des liens.</p>
      </div>
      {!volume && <button type="button" disabled={busy} className={primaryClass} onClick={() => void prepareVolume()}>
        {draft ? 'Reprendre la préparation' : 'Préparer ma sauvegarde'}
      </button>}
      {draft && !volume && !busy && <button type="button" className={secondaryClass} onClick={() => void prepareVolume(true)}>Recommencer avec une nouvelle copie</button>}
      {volume && <div className="space-y-3 rounded-2xl border border-cave-700 bg-cave-950/50 p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h5 className="font-bold text-cave-50">Volume {volume.volume}{volume.final ? ' · dernier volume' : ''}</h5>
          <span className="text-sm tabular-nums text-cave-400">{fileSize(volume.blob.size)}</span>
        </div>
        <p className="text-sm text-cave-400">Copie du {dateLabel(volume.exportedAt)}</p>
        <p className="text-sm text-cave-200">{count(volume.documentCount)} éléments dans ce volume. {volume.final ? `${count(volume.totalDocuments)} éléments dans la sauvegarde complète.` : `${count(volume.totalDocuments)} préparés jusqu’ici ; la suite reste à préparer.`}</p>
        {volume.warnings?.length > 0 && <div className="space-y-2 border-l-2 border-ebc-straw pl-3">{volume.warnings.map((warning, index) => <p key={index} className="text-sm text-cave-200">{warning}</p>)}</div>}
        <a href={downloadUrl || undefined} download={volume.fileName} aria-disabled={!downloadUrl || busy}
          tabIndex={!downloadUrl || busy ? -1 : 0} onClick={event => { if (!downloadUrl || busy) event.preventDefault(); }}
          className={`${primaryClass} flex items-center justify-center gap-2 ${!downloadUrl || busy ? 'pointer-events-none opacity-50' : ''}`}>
          <Download aria-hidden="true" className="h-4 w-4 shrink-0"/>Enregistrer le volume {volume.volume}
        </a>
        <p className="break-all text-xs text-cave-400">{volume.fileName}</p>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm text-cave-200">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-ebc-straw" checked={savedCurrent} disabled={busy} onChange={event => confirmSaved(event.target.checked)}/>
          <span>J’ai enregistré ce volume et je le retrouve dans mes fichiers.</span>
        </label>
        {!volume.final && <>
          <p className="text-sm text-cave-400">Garde chaque volume dans le même dossier. La restauration les demandera tous.</p>
          <button type="button" disabled={busy || !savedCurrent} className={secondaryClass} onClick={() => void prepareVolume()}>Préparer le volume suivant</button>
        </>}
        {volume.final && savedCurrent && <p role="status" className="flex items-start gap-2 text-sm text-cave-200"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-hop"/>Tu as confirmé avoir enregistré les {volume.volume} volume{volume.volume > 1 ? 's' : ''} de cette sauvegarde.</p>}
        {draft && draft.savedVolumes > 0 && !volume.final && <p className="text-sm text-cave-400">{count(draft.savedVolumes)} volume{draft.savedVolumes > 1 ? 's' : ''} confirmé{draft.savedVolumes > 1 ? 's' : ''} comme enregistré{draft.savedVolumes > 1 ? 's' : ''}.</p>}
        <details className="border-t border-cave-800 pt-2">
          <summary className="cursor-pointer py-2 text-sm text-cave-400">Repartir avec une nouvelle copie</summary>
          <p className="mb-3 text-sm text-cave-400">Si un ancien volume manque, prépare une nouvelle sauvegarde complète. Ne mélange pas les fichiers de deux sauvegardes.</p>
          <button type="button" disabled={busy} className={secondaryClass} onClick={() => void prepareVolume(true)}>Préparer une nouvelle sauvegarde</button>
        </details>
      </div>}
      {draft && !volume?.final && <p className="text-sm text-cave-400">Garde cette page ouverte pour préparer la suite.{draft.session.expiresAt ? ` La copie serveur est disponible jusqu’au ${dateLabel(draft.session.expiresAt)}.` : ''} Après un rechargement de page, prépare une nouvelle copie complète.</p>}
      {operation === 'export' && progress && <Progress value={progress}/>}
    </section>

    <section aria-labelledby="backup-restore-title" className="space-y-3 border-t border-cave-800 pt-5">
      <div>
        <h4 id="backup-restore-title" className="text-base font-bold text-cave-50">Restaurer une sauvegarde</h4>
        <p className="mt-1 text-sm leading-relaxed text-cave-200">Choisis tous les volumes ZIP d’une même sauvegarde, ou un ancien fichier JSON. Ils seront vérifiés avant toute modification.</p>
      </div>
      <input ref={fileInput} type="file" multiple accept=".zip,.json,application/zip,application/json" aria-label="Fichiers de sauvegarde" className="hidden" disabled={busy}
        onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void inspect(files); }}/>
      <button type="button" className={`${secondaryClass} flex items-center justify-center gap-2`} disabled={busy} onClick={() => fileInput.current?.click()}><Upload aria-hidden="true" className="h-4 w-4 shrink-0"/>{inspection ? 'Choisir d’autres fichiers' : 'Choisir les fichiers de sauvegarde'}</button>
      {(operation === 'inspect' || operation === 'restore') && progress && <Progress value={progress}/>}
      {inspection && <div className="space-y-3 rounded-2xl border border-cave-700 bg-cave-950/50 p-3 sm:p-4">
        <h5 className="font-bold text-cave-50">{inspection.source === 'legacy' ? 'Ancienne sauvegarde JSON vérifiée' : 'Sauvegarde vérifiée'}</h5>
        <p className="text-sm text-cave-400">Copie du {dateLabel(inspection.exportedAt)}</p>
        <dl className="divide-y divide-cave-800 text-sm">
          <div className="flex justify-between gap-3 py-2"><dt className="text-cave-400">Fichiers sélectionnés</dt><dd className="font-semibold tabular-nums text-cave-50">{count(inspection.volumeCount)}</dd></div>
          <div className="flex justify-between gap-3 py-2"><dt className="text-cave-400">Éléments sauvegardés</dt><dd className="font-semibold tabular-nums text-cave-50">{count(inspection.documentCount)}</dd></div>
          <div className="flex justify-between gap-3 py-2"><dt className="text-cave-400">Originaux de justificatifs</dt><dd className="font-semibold tabular-nums text-cave-50">{count(inspection.originalCount)}</dd></div>
        </dl>
        {inspection.warnings.length > 0 && <div className="space-y-2 border-l-2 border-ebc-straw pl-3">{inspection.warnings.map((warning, index) => <p key={index} className="text-sm text-cave-200">{warning}</p>)}</div>}
        <p className="text-sm leading-relaxed text-cave-200">Les recettes, réglages et autres fiches modifiables reprennent la version sauvegardée. Les stocks, réservations, fûts et brassins déjà engagés gardent leur état actuel. Les registres protégés et journaux actuels sont conservés.</p>
        {inspection.originalCount > 0 && <p className="text-sm text-cave-400">Les justificatifs seront enregistrés dans ton Drive privé et reliés à la comptabilité.</p>}
        <button type="button" className={primaryClass} disabled={busy} onClick={() => void restore()}>{restoreFailed ? 'Reprendre cette restauration' : 'Confirmer la restauration'}</button>
        <button type="button" className="min-h-11 w-full rounded-xl text-sm text-cave-400 underline underline-offset-4 disabled:opacity-50" disabled={busy} onClick={() => { setInspection(undefined); setError(''); setRestoreFailed(false); }}>Annuler</button>
      </div>}
    </section>
    {error && <div ref={errorBox} role="alert" className="flex items-start gap-2 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm text-cave-50"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-alert"/><p className="min-w-0 break-words">{error}</p></div>}
    {driveReconnect && <button type="button" className={secondaryClass} disabled={busy || !driveReady} onClick={() => void reconnectDrive()}>Reconnecter Google Drive</button>}
    {operation === 'drive' && progress && <Progress value={progress}/>}
    {result && <p role="status" className="rounded-xl border border-hop/40 bg-hop/10 p-3 text-sm text-cave-50">{result}</p>}
  </div>;
}
