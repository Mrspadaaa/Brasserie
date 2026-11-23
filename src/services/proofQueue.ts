import { StorageService } from './storage';
import { FirestoreRepo, isConfirmedWriteRejection } from './firestoreRepo';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed, type DriveProofReceipt } from './financeDocuments';
import type { FinanceTransaction, ProofUpload, ProofUploadReason } from '../domain/finance/types';
import { createDexieProofStore, type ProofFileStore, type ProofJob } from './proofQueueStore';

export type { ProofFileStore, ProofJob };
export { createMemoryProofStore } from './proofQueueStore';

/**
 * L'envoi du justificatif au Drive en arrière-plan (voie d3c, plan `d3-drive-fond/PLAN.md`).
 * « Confirmer » écrit la dépense et met le fichier ici ; un seul travailleur l'envoie ensuite, sur des événements (démarrage, retour du réseau,
 * retour au premier plan), jamais sur des minuteries. Règle de la voie : un justificatif n'est jamais perdu ni effacé sur un doute.
 * Ce module ne touche ni `FirestoreRepo`, ni `StorageService`, ni la session qu'à l'appel, jamais à l'import.
 */

/** Seuils : des choix du pilote (D237 n° 3), réglables ici, pas des mesures. */
export const PROOF_LIMITS = {
  maxJobs: 20,
  maxBytes: 60_000_000,
  /** 30 s au moins entre deux essais d'un même job. */
  minRetryMs: 30_000,
  /** `failed network` : 6 échecs passagers sur 6 réveils distincts, étalés sur 2 h au moins. */
  transientFailures: 6,
  transientSpanMs: 2 * 3_600_000,
  /** Une erreur réellement inconnue : `failed unknown` au deuxième échec. */
  unknownFailures: 2,
  notFoundFailures: 2,
  /** Sans verrou entre onglets, un `sending` plus vieux que ça n'a plus de travailleur. */
  staleSendingMs: 2 * 60_000,
  /** Un fichier en échec ou annulé reste 30 jours sur l'appareil. */
  keepMs: 30 * 86_400_000,
  /** Alertes d'attente : une dépense en `queued` depuis 48 h ; un fichier sans dépense depuis 7 jours. */
  waitingAlertMs: 48 * 3_600_000,
  noExpenseAlertMs: 7 * 86_400_000,
  /** Un envoi qui dépasse 15 s continue : on rappelle, dans cette limite. */
  inProgressRounds: 40,
} as const;

const LOCK_NAME = 'laffinee-file-justificatifs';
/** La vie de cette page : un redémarrage de l'application est un nouveau réveil, le délai de 30 s ne le retient pas. */
const LIFE = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());

let override: ProofFileStore | null | undefined;
let defaultStore: ProofFileStore | null | undefined;
/** Le point d'injection : `undefined` = le défaut (Dexie si IndexedDB existe), `null` = pas de file (chemin synchrone), un magasin = les tests. */
export function setProofFileStore(store: ProofFileStore | null | undefined): void {
  override = store;
  if (store === undefined) defaultStore = undefined;
  wasReady = false;
}
function currentStore(): ProofFileStore | null {
  if (override !== undefined) return override;
  if (defaultStore === undefined) { try { defaultStore = createDexieProofStore(); } catch { defaultStore = null; } }
  return defaultStore;
}
/** La file est active si et seulement si ceci est vrai : sinon `savePurchaseWithProofReceipt` suit le chemin synchrone d'avant. */
export const proofQueueAvailable = (): boolean => currentStore() !== null;

const listeners = new Set<() => void>();
export function subscribeProofQueue(callback: () => void): () => void { listeners.add(callback); return () => { listeners.delete(callback); }; }
const emit = () => { for (const listener of [...listeners]) { try { listener(); } catch { /* un observateur ne casse pas la file */ } } };

export const proofDocumentIdFor = (submissionId: string, fileNo?: number): string => fileNo && fileNo > 1 ? `proof-${submissionId}-${fileNo}` : `proof-${submissionId}`;
const iso = () => new Date().toISOString();
const message = (error: unknown) => (error as { message?: string })?.message || String(error);
const codeOf = (error: unknown) => (error as { code?: string })?.code;

/** Les octets d'une chaîne `data:…;base64,…`. */
export function dataUrlBytes(dataUrl: string): number {
  const body = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor(body.length * 3 / 4) - padding);
}
export async function digestOfDataUrl(dataUrl: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Empreinte indisponible.');
  const raw = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const hash = new Uint8Array(await subtle.digest('SHA-256', Uint8Array.from(raw, char => char.charCodeAt(0))));
  return Array.from(hash, value => value.toString(16).padStart(2, '0')).join('');
}

let persistAsked = false;
async function askPersistence(): Promise<void> {
  if (persistAsked) return;
  persistAsked = true;
  try { await globalThis.navigator?.storage?.persist?.(); } catch { /* un refus ne bloque rien : le fichier peut alors disparaître, `expired` le dit */ }
}

export interface EnqueueInput {
  submissionId: string; dataUrl: string; mimeType: string; driveName: string; originalName?: string; year: number; uid: string;
  /** Un autre fichier que le premier envoyé pour cette dépense : `n` de `proof-<saisie>-<n>`. */
  fileNo?: number;
  /** L'écriture que le fichier justifie, quand elle n'est pas `TX-<saisie>` (la vente : `REC-…` ou le numéro de facture). */
  transactionId?: string;
}
/**
 * Écrit le fichier dans le magasin et ne rend la main que quand l'écriture est durable. Échec ou plafond (20 envois ou 60 Mo) : lève, l'appelant
 * retombe sur le chemin synchrone (rien ne se perd). Un job par saisie : un nouvel appel remplace la ligne de la même saisie.
 */
export async function enqueueProof(input: EnqueueInput): Promise<ProofJob> {
  const store = currentStore();
  if (!store) throw new Error('File des justificatifs indisponible.');
  const bytes = dataUrlBytes(input.dataUrl);
  const rows = (await store.all()).filter(row => row.submissionId !== input.submissionId);
  if (rows.length >= PROOF_LIMITS.maxJobs || rows.reduce((sum, row) => sum + (row.bytes || 0), 0) + bytes > PROOF_LIMITS.maxBytes)
    throw new Error('File des justificatifs pleine.');
  const sha256 = await digestOfDataUrl(input.dataUrl);
  const fileNo = input.fileNo && input.fileNo > 1 ? input.fileNo : undefined;
  const job: ProofJob = {
    state: 'queued', uid: input.uid, at: iso(), ...(fileNo ? { fileNo } : {}),
    submissionId: input.submissionId, transactionId: input.transactionId ?? `TX-${input.submissionId}`, documentId: proofDocumentIdFor(input.submissionId, fileNo),
    dataUrl: input.dataUrl, mimeType: input.mimeType, driveName: input.driveName, ...(input.originalName ? { originalName: input.originalName } : {}),
    year: input.year, sha256, bytes, createdAt: iso(),
  };
  await store.put(job);
  void askPersistence();
  emit();
  return job;
}
/** Retire une ligne qu'on vient d'écrire quand la dépense n'a finalement pas été enregistrée (le fichier est encore dans la feuille). */
export async function dropQueuedProof(submissionId: string): Promise<void> {
  const store = currentStore();
  try { await store?.delete(submissionId); } catch { /* la ligne sera sans dépense : l'alerte de 7 jours la dira */ }
  emit();
}
export async function listProofJobs(): Promise<ProofJob[]> {
  const store = currentStore();
  if (!store) return [];
  try { return await store.all(); } catch { return []; }
}
/** La ligne d'une écriture : par sa saisie (`TX-<saisie>` sans le préfixe), sinon par l'identifiant de l'écriture (une vente a son propre numéro). */
async function jobOfTransaction(store: ProofFileStore, transactionId: string): Promise<ProofJob | undefined> {
  const direct = await store.get(transactionId.replace(/^TX-/, ''));
  if (direct && direct.transactionId === transactionId) return direct;
  return (await store.all()).find(row => row.transactionId === transactionId) ?? direct;
}
/** Par saisie ou, à défaut, par identifiant d'écriture : la fiche d'une vente retrouve ainsi son envoi. */
export async function getProofJob(submissionId: string): Promise<ProofJob | undefined> {
  try {
    const store = currentStore();
    if (!store) return undefined;
    return (await store.get(submissionId)) ?? (await store.all()).find(row => row.transactionId === submissionId);
  } catch { return undefined; }
}

// ─── Classement des échecs (T6) ───────────────────────────────────────────────────────────────

export type ProofFailure =
  | { genre: 'wait' }
  | { genre: 'transient' }
  | { genre: 'stop'; reason: 'auth' | 'quota' | 'forbidden' }
  | { genre: 'not-found' }
  | { genre: 'file' }
  | { genre: 'unknown' };
/**
 * La table du plan § 2.2. « Atteint un serveur » = une réponse de Drive ou un code `functions/*` renvoyé : seul un tel essai est compté.
 * `navigator.onLine` n'en décide jamais.
 */
export function classifyProofFailure(error: unknown): ProofFailure {
  const code = codeOf(error);
  const text = message(error);
  if (code === 'drive/auth-required') return { genre: 'stop', reason: 'auth' };
  if (code === 'drive/quota') return { genre: 'stop', reason: 'quota' };
  if (code === 'drive/forbidden') return { genre: 'stop', reason: 'forbidden' };
  if (code === 'drive/not-found') return { genre: 'not-found' };
  if (code === 'drive/invalid-file' || code === 'drive/integrity') return { genre: 'file' };
  if (/autre original utilise cet identifiant|justificatif invalide|ne correspond pas à son contenu|incomplet ou différent/i.test(text)) return { genre: 'file' };
  if (code === 'drive/network' || code === 'functions/unavailable' || code === 'functions/deadline-exceeded' || code === 'functions/unauthenticated' || code === 'drive/in-progress'
    || (error as { name?: string })?.name === 'AbortError' || /client is offline|failed to fetch|networkerror|network request failed|load failed/i.test(text)) return { genre: 'wait' };
  if (code === 'drive/unavailable' || code === 'drive/rate-limit' || code === 'drive/invalid-response' || code === 'functions/internal' || code === 'functions/resource-exhausted' || code === 'unavailable') return { genre: 'transient' };
  return { genre: 'unknown' };
}

// ─── Le travailleur ───────────────────────────────────────────────────────────────────────────

async function authService() { return (await import('./firebaseAuth')).FirebaseAuthService; }
const findTransaction = (id: string): FinanceTransaction | undefined => StorageService.getTransactions().find(tx => tx.id === id) as FinanceTransaction | undefined;
const isVoidedError = (error: unknown) => /annulée/i.test(message(error));
const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

type WriteOutcome = 'ok' | 'voided' | 'absent' | 'error';
/** Écrit (ou retire) `finance.proofUpload` sur la dépense relue, sans toucher au reste. Dépense annulée ou déjà liée : rien n'est écrit. */
async function writeProofUpload(job: ProofJob, upload: ProofUpload | undefined): Promise<WriteOutcome> {
  const current = findTransaction(job.transactionId);
  if (!current?.finance) return 'absent';
  if (current.finance.voidedAt || (current.finance.proofDocumentId && current.finance.proofDocumentId !== job.documentId)) return 'voided';
  if (current.finance.proofDocumentId) return 'ok';
  try {
    StorageService.updateTransaction({ ...current, finance: { ...current.finance, proofUpload: upload } } as FinanceTransaction);
    return 'ok';
  } catch (error) { return isVoidedError(error) ? 'voided' : 'error'; }
}
const uploadOf = (job: ProofJob, state: 'queued' | 'failed', reason?: ProofUploadReason): ProofUpload => ({
  state, uid: job.uid, at: iso(), ...(reason ? { reason } : {}), ...(job.failures ? { failures: job.failures } : {}), ...(job.fileNo ? { fileNo: job.fileNo } : {}),
});

async function save(store: ProofFileStore, job: ProofJob) { await store.put(job); emit(); }
/** Annulée, refusée ou abandonnée : aucun appel Drive, aucune alerte, aucune écriture Firestore ; le fichier reste 30 jours sur l'appareil. */
async function voidJob(store: ProofFileStore, job: ProofJob, reason: 'cancelled' | 'refused' | 'abandoned', note?: string) {
  await save(store, { ...job, state: 'voided', reason, settledAt: Date.now(), ...(note ? { lastFailure: { message: note, at: iso() } } : {}) });
}
async function failJob(store: ProofFileStore, job: ProofJob, reason: ProofUploadReason, text: string) {
  const failed: ProofJob = { ...job, state: 'failed', reason, settledAt: Date.now(), lastFailure: { message: text, at: iso() } };
  await save(store, failed);
  if (await writeProofUpload(failed, uploadOf(failed, 'failed', reason)) === 'voided') await voidJob(store, failed, 'cancelled');
}

type Verdict = { go: true } | { go: false; wait: true } | { go: false; linked: true } | { go: false; void: 'cancelled' | 'refused' };
/** T1 : ce qu'on peut conclure de la dépense. « Absente » ne conclut jamais : le cache peut ne pas être chargé. */
async function judgeExpense(job: ProofJob): Promise<Verdict> {
  const rejected = FirestoreRepo.documentWriteState('transactions', job.transactionId).status === 'rejected';
  if (rejected) return { go: false, void: 'refused' };
  const tx = findTransaction(job.transactionId);
  if (!tx) return { go: false, wait: true };
  if (tx.finance?.voidedAt) return { go: false, void: 'cancelled' };
  if (tx.finance?.proofDocumentId) return tx.finance.proofDocumentId === job.documentId ? { go: false, linked: true } : { go: false, void: 'cancelled' };
  const status = FirestoreRepo.documentWriteState('transactions', job.transactionId).status;
  if (status !== 'confirmed') {
    // L'écriture initiale n'est pas encore confirmée : on attend son accusé, le job reste sinon.
    try { await FirestoreRepo.waitForDocument<FinanceTransaction>('transactions', job.transactionId, 15000); }
    catch (error) { return isConfirmedWriteRejection(error) ? { go: false, void: 'refused' } : { go: false, wait: true }; }
  }
  return { go: true };
}

async function sendWithPatience(job: ProofJob): Promise<DriveProofReceipt | undefined> {
  const prepared = prepareFinanceDocument(job.documentId, job.dataUrl, job.driveName, job.mimeType);
  for (let round = 0; round < PROOF_LIMITS.inProgressRounds; round++) {
    try { return await saveFinanceDocumentConfirmed(prepared, job.year); }
    catch (error) { if (codeOf(error) !== 'drive/in-progress') throw error; /* T7 : l'envoi continue, on rappelle */ }
  }
  throw Object.assign(new Error('L’envoi du justificatif est encore en cours.'), { code: 'drive/network' });
}

async function readFresh(id: string): Promise<FinanceTransaction | undefined> {
  try { return await FirestoreRepo.waitForDocument<FinanceTransaction>('transactions', id, 15000); }
  catch { return findTransaction(id); }
}

type Outcome = 'done' | 'next' | 'stop';
/** Compte l'échec (une fois par réveil) et décide : renvoyer plus tard, ou `failed`. */
async function onFailure(store: ProofFileStore, job: ProofJob, error: unknown, wakeId: string): Promise<Outcome> {
  const kind = classifyProofFailure(error);
  const text = message(error);
  const base: ProofJob = { ...job, state: 'queued', lastFailure: { message: text, at: iso() } };
  if (kind.genre === 'wait') { await save(store, { ...base, waited: true }); return 'stop'; }
  if (kind.genre === 'stop') { await failJob(store, base, kind.reason, text); return 'stop'; }
  if (kind.genre === 'file') { await failJob(store, base, 'file', text); return 'next'; }
  const first = base.countedWakeId !== wakeId;
  const failures = (base.failures ?? 0) + (first ? 1 : 0);
  const counted: ProofJob = { ...base, failures, countedWakeId: wakeId, firstFailureAt: base.firstFailureAt ?? Date.now() };
  if (kind.genre === 'transient') {
    if (failures >= PROOF_LIMITS.transientFailures && Date.now() - (counted.firstFailureAt ?? Date.now()) >= PROOF_LIMITS.transientSpanMs) { await failJob(store, counted, 'network', text); return 'next'; }
    await save(store, counted); return 'stop';
  }
  if (kind.genre === 'not-found') {
    if (failures >= PROOF_LIMITS.notFoundFailures) { await failJob(store, counted, 'not-found', text); return 'next'; }
    await save(store, counted); return 'next';
  }
  if (failures >= PROOF_LIMITS.unknownFailures) { await failJob(store, counted, 'unknown', text); return 'next'; }
  await save(store, counted);
  return 'next';
}

/** T8 : le lien se pose sur la dépense relue juste avant, jamais sur l'instantané ; un `proofDocumentId` déjà là n'est jamais écrasé. */
async function linkJob(store: ProofFileStore, job: ProofJob, receipt: DriveProofReceipt | undefined, wakeId: string): Promise<Outcome> {
  let current = await readFresh(job.transactionId);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!current?.finance) { await save(store, { ...job, state: 'queued' }); return 'next'; }
    if (current.finance.voidedAt) { await voidJob(store, job, 'cancelled'); return 'next'; }
    if (current.finance.proofDocumentId && current.finance.proofDocumentId !== job.documentId) {
      await voidJob(store, job, 'cancelled', `Orphelin Drive : ${job.documentId} (la dépense porte déjà ${current.finance.proofDocumentId}).`);
      return 'next';
    }
    if (current.finance.proofDocumentId !== job.documentId) {
      try {
        // `syncedToDrive` (une vente) ne dit vrai qu'ici, l'envoi fait ; une dépense ne le porte pas et reste telle quelle.
        StorageService.updateTransaction({ ...current, proofFileName: receipt?.fileName ?? job.driveName, ...(current.syncedToDrive === false ? { syncedToDrive: true } : {}),
          finance: { ...current.finance, proofDocumentId: job.documentId, proofUpload: undefined } } as FinanceTransaction);
      } catch (error) {
        if (isVoidedError(error)) { await voidJob(store, job, 'cancelled'); return 'next'; }
        return onFailure(store, job, error, wakeId);
      }
    }
    try {
      await FirestoreRepo.waitForDocument<FinanceTransaction>('transactions', job.transactionId, 15000, saved => saved.finance?.proofDocumentId === job.documentId);
      await store.delete(job.submissionId);
      emit();
      return 'done';
    } catch (error) {
      // Paiement arrivé entre-temps (garde de la règle) : relire et réessayer une fois, puis passager.
      if (isConfirmedWriteRejection(error) && attempt === 0) { current = await readFresh(job.transactionId); continue; }
      return onFailure(store, job, Object.assign(new Error(message(error)), { code: 'drive/unavailable' }), wakeId);
    }
  }
  return 'next';
}

async function processJob(store: ProofFileStore, job: ProofJob, wakeId: string, force: boolean): Promise<Outcome> {
  const now = Date.now();
  // 30 s au moins entre deux essais d'un même job, dans la même vie de page ; un essai raté faute de réseau n'a atteint aucun serveur : il n'attend pas.
  if (!force && job.lastWakeAt !== undefined && job.lastLife === LIFE && !job.waited && now - job.lastWakeAt < PROOF_LIMITS.minRetryMs) return 'next';
  const verdict = await judgeExpense(job);
  if (!verdict.go) {
    if ('void' in verdict) await voidJob(store, job, verdict.void);
    else if ('linked' in verdict) { await store.delete(job.submissionId); emit(); return 'done'; }
    return 'next';
  }
  let sending: ProofJob = { ...job, state: 'sending', wakeId, lastWakeAt: now, lastLife: LIFE, waited: false };
  await save(store, sending);
  let receipt: DriveProofReceipt | undefined;
  try {
    const token = await (await authService()).ensureDriveAccessToken();
    if (!token) throw Object.assign(new Error('Drive est à reconnecter.'), { code: 'drive/auth-required' });
    receipt = await sendWithPatience(sending);
  } catch (error) { return onFailure(store, sending, error, wakeId); }
  sending = { ...sending };
  return linkJob(store, sending, receipt, wakeId);
}

let running = false;
let rerun: { wakeId: string; force: boolean } | null = null;
let wakeSeq = 0;
let wasReady = false;

async function runOnce(wakeId: string, force: boolean, viaLock: boolean): Promise<void> {
  const store = currentStore();
  if (!store) return;
  const user = (await authService()).getCurrentUser();
  if (!user) return;
  const now = Date.now();
  let jobs = (await store.all()).filter(job => job.uid === user.uid);
  // Maintenance locale : purge à J+30 (voided), `sending` sans travailleur (jamais compté).
  for (const job of jobs) {
    if (job.state === 'voided' && now - (job.settledAt ?? now) > PROOF_LIMITS.keepMs) await store.delete(job.submissionId);
    else if (job.state === 'sending' && (viaLock || now - (job.lastWakeAt ?? 0) > PROOF_LIMITS.staleSendingMs)) await store.put({ ...job, state: 'queued' });
  }
  if (!StorageService.isReady()) return;
  jobs = (await store.all()).filter(job => job.uid === user.uid);
  for (const job of jobs) {
    if (job.state === 'failed' && job.reason !== 'expired' && now - (job.settledAt ?? now) > PROOF_LIMITS.keepMs) {
      const expired: ProofJob = { ...job, reason: 'expired', dataUrl: '', lastFailure: { message: 'Fichier local effacé après 30 jours.', at: iso() } };
      await store.put(expired);
      await writeProofUpload(expired, uploadOf(expired, 'failed', 'expired'));
    }
  }
  emit();
  if (!online()) return;
  const queue = (await store.all()).filter(job => job.uid === user.uid && job.state === 'queued').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const job of queue) {
    if (!job.dataUrl) continue;
    const outcome = await processJob(store, job, wakeId, force);
    if (outcome === 'stop') break;
  }
}

/**
 * Un tour de la file. Un seul travailleur à la fois : un verrou entre onglets (`navigator.locks`), sinon un drapeau de module. Ne lève jamais.
 * `wakeId` identifie le réveil (un échec ne se compte qu'une fois par réveil) ; `resend` et `reconnect` sont des gestes : pas de délai de 30 s.
 */
export async function runProofQueue(reason: string, wakeId = `${reason}#${++wakeSeq}`): Promise<void> {
  const force = reason === 'resend' || reason === 'reconnect';
  if (running) { rerun = { wakeId, force: force || Boolean(rerun?.force) }; return; }
  running = true;
  try {
    let next: { wakeId: string; force: boolean } | null = { wakeId, force };
    while (next) {
      rerun = null;
      const { wakeId: id, force: gesture } = next;
      const locks = typeof navigator !== 'undefined' ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
      try {
        if (locks?.request) await locks.request(LOCK_NAME, { ifAvailable: true }, async lock => { if (lock) await runOnce(id, gesture, true); });
        else await runOnce(id, gesture, false);
      } catch { /* la file ne casse jamais l'application ; le réveil suivant réessaie */ }
      next = rerun;
    }
  } finally { running = false; }
}

/** Les réveils (T6) : démarrage, `online`, `focus`, `visibilitychange`, `pageshow`, et le passage du cache en « prêt ». Aucune minuterie. */
export function startProofQueue(): () => void {
  if (typeof window === 'undefined' || !proofQueueAvailable()) return () => undefined;
  wasReady = false;
  const wake = (reason: string) => () => { if (reason === 'online' || document.visibilityState !== 'hidden') void runProofQueue(reason); };
  const handlers: Array<[EventTarget, string, () => void]> = [
    [window, 'online', wake('online')], [window, 'focus', wake('focus')], [window, 'pageshow', wake('pageshow')], [document, 'visibilitychange', wake('visible')],
  ];
  for (const [target, name, handler] of handlers) target.addEventListener(name, handler);
  const unsubscribe = FirestoreRepo.subscribe(() => {
    const ready = StorageService.isReady();
    if (ready && !wasReady) void runProofQueue('ready');
    wasReady = ready;
  });
  void runProofQueue('start');
  return () => { for (const [target, name, handler] of handlers) target.removeEventListener(name, handler); unsubscribe(); };
}

// ─── Les gestes (fiche, notification, feuille) ───────────────────────────────────────────────

/** Écrit `queued` sur la dépense (avec `fileNo`) : la notification ne reste jamais « à renvoyer » pendant l'envoi, sur aucun appareil. */
export async function markQueuedOnTransaction(job: ProofJob): Promise<WriteOutcome> {
  return writeProofUpload(job, uploadOf(job, 'queued'));
}
/** Bascule `failed` → `queued` (après « Renvoyer » ou « Reconnecter ») puis relance. Dépense annulée : le job devient `voided`, rien n'est écrit. */
export async function requeueProof(transactionId: string, reason: 'resend' | 'reconnect' = 'resend'): Promise<boolean> {
  const store = currentStore();
  if (!store) return false;
  const job = await jobOfTransaction(store, transactionId);
  if (!job || job.state === 'voided' || !job.dataUrl) return false;
  const queued: ProofJob = { ...job, state: 'queued', reason: undefined, failures: 0, firstFailureAt: undefined, countedWakeId: undefined, lastWakeAt: undefined, settledAt: undefined };
  delete queued.reason; delete queued.firstFailureAt; delete queued.countedWakeId; delete queued.lastWakeAt; delete queued.settledAt;
  await save(store, queued);
  if (await markQueuedOnTransaction(queued) === 'voided') { await voidJob(store, queued, 'cancelled'); return false; }
  void runProofQueue(reason);
  return true;
}
/** Après « Reconnecter Drive » : tous les envois arrêtés pour `auth` repartent. */
export async function requeueAfterReconnect(): Promise<number> {
  const user = (await authService()).getCurrentUser();
  const jobs = (await listProofJobs()).filter(job => job.state === 'failed' && job.reason === 'auth' && job.uid === user?.uid);
  let count = 0;
  for (const job of jobs) if (await requeueProof(job.transactionId, 'reconnect')) count++;
  if (!count) void runProofQueue('reconnect');
  return count;
}
/** « Abandonner » : le job devient `voided` (fichier gardé 30 jours), `proofUpload` est retiré de la dépense, qui reste « sans justificatif ». */
export async function abandonProof(transactionId: string): Promise<void> {
  const store = currentStore();
  const job = store ? await jobOfTransaction(store, transactionId) : undefined;
  const current = findTransaction(transactionId);
  if (current?.finance && !current.finance.voidedAt && !current.finance.proofDocumentId && current.finance.proofUpload) {
    try { StorageService.updateTransaction({ ...current, finance: { ...current.finance, proofUpload: undefined } } as FinanceTransaction); } catch { /* annulée entre-temps : rien à retirer */ }
  }
  if (store && job) await voidJob(store, job, 'abandoned');
  emit();
}
/** L'écriture de la dépense a été refusée plus tard (suiveur hors ligne) : le job devient `voided` `refused`, le lien n'est jamais écrit. */
export async function voidProofJob(submissionId: string, reason: 'cancelled' | 'refused'): Promise<void> {
  const store = currentStore();
  const job = await store?.get(submissionId);
  if (store && job && job.state !== 'voided') await voidJob(store, job, reason);
}
