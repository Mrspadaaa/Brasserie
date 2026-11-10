import { StorageService } from './storage';
import { FirestoreRepo } from './firestoreRepo';
import type { FinanceTransaction, ProofUploadReason } from '../domain/finance/types';
import { listProofJobs, PROOF_LIMITS, subscribeProofQueue, type ProofJob } from './proofQueue';

/**
 * Ce que la notification a à dire : un état global observable (modèle `FirestoreRepo.subscribe`), calculé par une fonction pure.
 * Quatre sources, jamais deux alertes pour la même dépense : (1) `finance.proofUpload.state === 'failed'` sur la dépense (visible depuis tout
 * appareil) ; (2) un `queued` vieux de plus de 48 h ; (3) un job local `failed` ; (4) un job local dont la dépense reste absente après 7 jours,
 * cache prêt. Une dépense annulée, un job `voided` et une attente récente n'alertent jamais.
 */
export type ProofAlertKind = 'failed' | 'waiting' | 'no-expense';
export interface ProofAlert {
  transactionId: string;
  kind: ProofAlertKind;
  reason?: ProofUploadReason;
  /** ISO : depuis quand. */
  since: string;
  /** Pour la phrase : « fournisseur · description ». Absent pour un fichier sans dépense. */
  label?: string;
  hasLocalFile: boolean;
}

export function computeProofAlerts(input: { transactions: FinanceTransaction[]; jobs: ProofJob[]; ready: boolean; now: number }): ProofAlert[] {
  const { transactions, jobs, ready, now } = input;
  const jobOf = new Map(jobs.map(job => [job.transactionId, job]));
  const alerts: ProofAlert[] = [];
  const seen = new Set<string>();
  for (const tx of transactions) {
    const finance = tx.finance;
    if (!finance || finance.kind !== 'expense' || finance.voidedAt || finance.proofDocumentId || tx.proofUrl) continue;
    const job = jobOf.get(tx.id);
    const upload = finance.proofUpload;
    if (job?.state === 'voided') continue;
    const label = [finance.vendor, tx.description].filter(Boolean).join(' · ') || tx.id;
    if (job?.state === 'failed' || upload?.state === 'failed') {
      alerts.push({ transactionId: tx.id, kind: 'failed', reason: job?.state === 'failed' ? job.reason : upload?.reason, since: job?.lastFailure?.at ?? upload?.at ?? tx.date, label, hasLocalFile: Boolean(job?.dataUrl) });
      seen.add(tx.id);
      continue;
    }
    const since = upload?.state === 'queued' ? upload.at : job && (job.state === 'queued' || job.state === 'sending') ? job.createdAt : undefined;
    if (since && now - Date.parse(since) > PROOF_LIMITS.waitingAlertMs) { alerts.push({ transactionId: tx.id, kind: 'waiting', since, label, hasLocalFile: Boolean(job?.dataUrl) }); seen.add(tx.id); }
  }
  const known = new Set(transactions.map(tx => tx.id));
  for (const job of jobs) {
    if (seen.has(job.transactionId) || job.state === 'voided') continue;
    if (job.state === 'failed') { alerts.push({ transactionId: job.transactionId, kind: 'failed', reason: job.reason, since: job.lastFailure?.at ?? job.createdAt, hasLocalFile: Boolean(job.dataUrl) }); continue; }
    // Dépense absente : « pas encore chargée » ou « création refusée ». Le cache doit être prêt, et l'attente de 7 jours ; le fichier n'est jamais supprimé.
    if (ready && !known.has(job.transactionId) && now - Date.parse(job.createdAt) > PROOF_LIMITS.noExpenseAlertMs)
      alerts.push({ transactionId: job.transactionId, kind: 'no-expense', since: job.createdAt, hasLocalFile: Boolean(job.dataUrl) });
  }
  return alerts;
}

const same = (a: ProofAlert[], b: ProofAlert[]) => a.length === b.length && a.every((x, i) => x.transactionId === b[i].transactionId && x.kind === b[i].kind && x.reason === b[i].reason && x.label === b[i].label && x.hasLocalFile === b[i].hasLocalFile);

let snapshot: ProofAlert[] = [];
let jobs: ProofJob[] = [];
let uid: string | undefined;
const listeners = new Set<() => void>();
let wired: Array<() => void> = [];

function recompute() {
  try { compute(); } catch { /* un cache pas encore là : la notification reste muette, rien n'est conclu */ }
}
function compute() {
  const next = computeProofAlerts({
    transactions: StorageService.getTransactions() as FinanceTransaction[],
    jobs: jobs.filter(job => !uid || job.uid === uid), ready: StorageService.isReady(), now: Date.now(),
  });
  if (same(next, snapshot)) return;
  snapshot = next;
  for (const listener of [...listeners]) listener();
}
async function refresh(): Promise<void> {
  jobs = await listProofJobs();
  try { uid = (await import('./firebaseAuth')).FirebaseAuthService.getCurrentUser()?.uid; } catch { uid = undefined; }
  recompute();
}

export const proofUploadStatus = {
  /** Le premier abonné branche les sources (dépenses, file locale) ; le dernier qui part les débranche. */
  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    if (listeners.size === 1) {
      try { wired = [FirestoreRepo.subscribe(recompute), subscribeProofQueue(() => { void refresh(); })]; } catch { wired = []; }
      void refresh().catch(() => undefined);
    }
    return () => {
      listeners.delete(callback);
      if (!listeners.size) { for (const off of wired) off(); wired = []; }
    };
  },
  getSnapshot: (): ProofAlert[] => snapshot,
  refresh,
};
