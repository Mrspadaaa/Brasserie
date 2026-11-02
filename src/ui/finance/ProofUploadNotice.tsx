import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, Cloud, Loader2 } from 'lucide-react';
import type { ProofUploadReason } from '../../domain/finance/types';
import { FirebaseAuthService } from '../../services/firebaseAuth';
import { abandonProof, getProofJob, requeueAfterReconnect, requeueProof, subscribeProofQueue, type ProofJob } from '../../services/proofQueue';
import { resendProof } from '../../services/purchaseEntry';
import { proofUploadStatus, type ProofAlert } from '../../services/proofUploadStatus';

/** La cause, en clair (jamais « erreur 403 »). */
export const PROOF_REASON_TEXT: Record<ProofUploadReason, string> = {
  auth: 'Drive n’est plus connecté.',
  quota: 'Ton espace Drive est plein.',
  forbidden: 'Drive refuse l’accès.',
  'not-found': 'Le dossier Drive est introuvable.',
  network: 'Drive ne répond pas depuis plusieurs heures.',
  file: 'Drive refuse ce fichier.',
  unknown: 'L’envoi n’aboutit pas.',
  expired: 'Le fichier n’est plus sur cet appareil : joins-le à nouveau.',
  cancelled: 'Dépense annulée.', refused: 'Écriture refusée.', abandoned: 'Envoi abandonné.',
};

const DIALOGS = '[role="dialog"],[role="alertdialog"]';
/** T4 : la notification ne paraît que sans feuille ouverte ; une feuille ouverte la retarde jusqu'à sa fermeture. */
function useSheetOpen(): boolean {
  const [open, setOpen] = useState(() => typeof document !== 'undefined' && Boolean(document.querySelector(DIALOGS)));
  useEffect(() => {
    const check = () => setOpen(Boolean(document.querySelector(DIALOGS)));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['role', 'open'] });
    return () => observer.disconnect();
  }, []);
  return open;
}

const pill = 'inline-flex min-h-7 items-center justify-center gap-1.5 rounded-control border px-2.5 text-[13px] font-medium';

/** « Reconnecter Drive » : le même geste que `DriveConnection` (consentement Google, un clic), puis les envois arrêtés pour `auth` repartent. */
export function ReconnectDriveButton({ onDone }: { onDone?: () => void }) {
  const [busy, setBusy] = useState(false), [ready, setReady] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void FirebaseAuthService.prepareGoogleLogin().then(() => { if (active) setReady(true); }).catch(() => { if (active) setError('La connexion Google ne peut pas être préparée. Réessaie.'); });
    return () => { active = false; };
  }, []);
  const connect = async () => {
    setBusy(true); setError('');
    try {
      const result = await FirebaseAuthService.refreshDriveAccess();
      if (result.success) { await requeueAfterReconnect(); onDone?.(); }
      else setError(result.error || 'La connexion Drive reste à confirmer.');
    } catch { setError('La connexion Drive a échoué. Réessaie.'); }
    finally { setBusy(false); }
  };
  return <span className="inline-flex flex-col gap-1">
    <button type="button" disabled={busy || (!ready && !error)} onClick={() => void connect()} className={`${pill} border-cave-600 text-cave-50 disabled:opacity-50`}>
      {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Cloud size={14} aria-hidden="true" />}Reconnecter Drive
    </button>
    {error ? <span role="alert" className="text-xs text-attention">{error}</span> : null}
  </span>;
}

function sentenceFor(alerts: ProofAlert[]): string {
  const failed = alerts.filter(alert => alert.kind === 'failed'), first = alerts[0];
  if (alerts.length > 1) return `${alerts.length} justificatifs à renvoyer`;
  if (first.kind === 'failed') return `Justificatif non envoyé · ${PROOF_REASON_TEXT[first.reason ?? 'unknown']}`;
  if (first.kind === 'waiting') return `Justificatif en attente d’envoi depuis ${Math.max(2, Math.floor((Date.now() - Date.parse(first.since)) / 86_400_000))} jours`;
  return failed.length ? '' : 'Un justificatif attend sa dépense';
}

/**
 * La notification d'échec (forme provisoire, D237 n° 6) : persistante, une seule pour N dépenses, deux gestes. Elle ne paraît pas pendant qu'une
 * feuille est ouverte, ni dans les vues exclues (`hidden` : wizard, hopV55) ; « Plus tard » la réduit sans effacer l'état.
 */
export function ProofUploadNotice({ hidden = false, onResend }: { hidden?: boolean; onResend: (transactionId: string) => void }) {
  const alerts = useSyncExternalStore(proofUploadStatus.subscribe, proofUploadStatus.getSnapshot, proofUploadStatus.getSnapshot);
  const sheetOpen = useSheetOpen();
  const [reduced, setReduced] = useState(false);
  const [error, setError] = useState('');
  const seen = useRef('');
  const key = alerts.map(alert => `${alert.transactionId}:${alert.kind}:${alert.reason ?? ''}`).join('|');
  // Une alerte nouvelle ressort même si l'ancienne avait été réduite.
  useEffect(() => { if (key !== seen.current) { seen.current = key; setReduced(false); } }, [key]);
  if (hidden || sheetOpen || !alerts.length) return null;
  const ordered = [...alerts].sort((a, b) => Number(b.kind === 'failed') - Number(a.kind === 'failed'));
  const target = ordered.find(alert => alert.kind !== 'no-expense') ?? ordered[0];
  const needsAuth = alerts.some(alert => alert.kind === 'failed' && alert.reason === 'auth');
  const onlyOrphans = alerts.every(alert => alert.kind === 'no-expense');
  if (reduced) return <div className="fixed inset-x-2 bottom-[calc(var(--main-navigation-height,3rem)+0.5rem)] z-[60] flex justify-end pointer-events-none">
    <button type="button" onClick={() => setReduced(false)} className={`${pill} pointer-events-auto border-attention/50 bg-cave-900 text-attention shadow-lg`}><AlertTriangle size={14} aria-hidden="true" />{alerts.length} justificatif{alerts.length > 1 ? 's' : ''} à renvoyer</button>
  </div>;
  return <div role="alert" data-proof-notice className="fixed inset-x-2 bottom-[calc(var(--main-navigation-height,3rem)+0.5rem)] z-[60] mx-auto max-w-xl rounded-panel border border-attention/50 bg-cave-900 p-2.5 shadow-2xl">
    <p className="flex items-start gap-2 text-sm font-medium text-cave-50"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-attention" aria-hidden="true" /><span className="min-w-0 break-words">{sentenceFor(alerts)}</span></p>
    {alerts.length === 1 && alerts[0].label ? <p className="mt-0.5 pl-6 text-xs text-cave-400 break-words">{alerts[0].label}</p> : null}
    {error ? <p role="alert" className="mt-1 pl-6 text-xs text-attention">{error}</p> : null}
    <div className="mt-2 flex flex-wrap items-start gap-1.5 pl-6">
      {onlyOrphans
        ? <button type="button" onClick={() => void abandonProof(alerts[0].transactionId).catch(() => setError('L’abandon n’a pas abouti. Réessaie.'))} className={`${pill} border-cave-600 text-cave-50`}>Abandonner</button>
        : <button type="button" onClick={() => onResend(target.transactionId)} className={`${pill} border-ebc-straw bg-ebc-straw text-cave-950 font-semibold`}>Renvoyer le justificatif</button>}
      {needsAuth ? <ReconnectDriveButton /> : null}
      <button type="button" onClick={() => setReduced(true)} className={`${pill} border-cave-700 text-cave-200`}>Plus tard</button>
    </div>
  </div>;
}

/** Le bloc « justificatif à renvoyer » de la fiche d'une dépense : motif en clair, « Renvoyer maintenant », « Abandonner ». */
export function ProofResendPanel({ transaction }: { transaction: { id: string; finance?: { proofUpload?: { state: string; reason?: ProofUploadReason }; proofDocumentId?: string; voidedAt?: string } } }) {
  const finance = transaction.finance, upload = finance?.proofUpload;
  const [job, setJob] = useState<ProofJob | undefined>();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirming, setConfirming] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const submissionId = transaction.id.replace(/^TX-/, '');
  useEffect(() => {
    let active = true;
    const load = () => { void getProofJob(submissionId).then(row => { if (active) setJob(row); }); };
    load();
    const off = subscribeProofQueue(load);
    return () => { active = false; off(); };
  }, [submissionId]);
  if (!upload || finance?.proofDocumentId || finance?.voidedAt) return null;
  const reason = (job?.state === 'failed' ? job.reason : upload.reason) ?? 'unknown';
  const failed = upload.state === 'failed' || job?.state === 'failed';
  const hasFile = Boolean(job?.dataUrl) && job?.state !== 'voided';
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await work(); } catch (cause) { setError((cause as Error).message || 'Le renvoi n’a pas abouti.'); } finally { setBusy(false); }
  };
  if (!failed) return <p role="status" data-proof-panel className="finance-notice flex items-center gap-2"><Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />Justificatif en cours d’envoi sur ton Drive.</p>;
  return <div data-proof-panel className="finance-notice space-y-2">
    <p className="font-medium">Justificatif à renvoyer · {PROOF_REASON_TEXT[reason]}</p>
    {error ? <p role="alert" className="finance-error">{error}</p> : null}
    <div className="flex flex-wrap items-start gap-1.5">
      <button type="button" disabled={busy} className="finance-action" onClick={() => hasFile && reason !== 'file' ? void run(async () => { if (!await requeueProof(transaction.id)) throw Error('Le fichier n’est plus sur cet appareil : choisis-le à nouveau.'); }) : input.current?.click()}>Renvoyer maintenant</button>
      {hasFile && reason !== 'file' ? <button type="button" disabled={busy} className="finance-action secondary" onClick={() => input.current?.click()}>Choisir un autre fichier</button> : null}
      {reason === 'auth' ? <ReconnectDriveButton /> : null}
      <button type="button" disabled={busy} className="finance-action secondary" onClick={() => setConfirming(true)}>Abandonner</button>
    </div>
    <input ref={input} hidden type="file" aria-label="Choisir le justificatif à renvoyer" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void run(() => resendProof(transaction.id, file)); }} />
    {confirming ? <div className="space-y-1.5"><p className="text-sm">Abandonner l’envoi ? La dépense reste sans justificatif ; le fichier reste 30 jours sur cet appareil.</p>
      <div className="flex gap-1.5"><button type="button" className="finance-action secondary" onClick={() => setConfirming(false)}>Garder</button><button type="button" disabled={busy} className="finance-action danger" onClick={() => void run(async () => { await abandonProof(transaction.id); setConfirming(false); })}>Abandonner l’envoi</button></div></div> : null}
  </div>;
}
