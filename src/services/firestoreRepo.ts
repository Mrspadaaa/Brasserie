import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDocsFromServer,
  getDocsFromCache,
  getDocFromServer,
  waitForPendingWrites,
  deleteField,
  increment,
  query,
  limit,
  orderBy,
  documentId,
  startAfter,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { BUSINESS_COLLECTIONS, BusinessCollection } from '../../functions/src/dataSchema';
import { FINANCIAL_SYNC_COLLECTIONS } from '../../functions/src/financialSyncTypes';
import { startFinancialLedgerSync, type FinancialLedgerState } from './financialLedgerSync';

/**
 * Couche d'accès Firestore.
 *
 * Le reste de l'application lit les données de façon SYNCHRONE (`getTransactions()`
 * renvoie un tableau, pas une promesse). Firestore, lui, est asynchrone. Le pont
 * entre les deux est ce cache mémoire :
 *
 *   1. `startSync()` ouvre un `onSnapshot` sur chaque collection ;
 *   2. chaque snapshot remplit le cache et prévient l'interface ;
 *   3. les lectures tapent dans le cache — instantanées ;
 *   4. les écritures partent vers Firestore, qui les applique D'ABORD à son cache
 *      IndexedDB local puis déclenche immédiatement un snapshot. L'affichage se
 *      met donc à jour tout de suite, même sans réseau, et la synchronisation
 *      serveur se fait quand elle peut.
 *
 * C'est ce mécanisme qui remplace Dexie : même persistance IndexedDB, même
 * fonctionnement hors-ligne, plus la synchro entre le téléphone et l'ordinateur.
 */

export type CollectionName = BusinessCollection;

// Original documents are loaded individually; don't download every receipt on startup.
export const ALL_COLLECTIONS: CollectionName[] = BUSINESS_COLLECTIONS.filter(c => c !== 'financeDocuments');
/** Accounting comes from a complete persistent register plus compact invalidations. */
export const LIVE_COLLECTIONS = ALL_COLLECTIONS.filter(name => !(FINANCIAL_SYNC_COLLECTIONS as readonly string[]).includes(name));
const isFinancialCollection = (name: CollectionName) => (FINANCIAL_SYNC_COLLECTIONS as readonly string[]).includes(name);
let financialController: Awaited<ReturnType<typeof startFinancialLedgerSync>> | undefined;
let financialStarting = false;
let financialState: FinancialLedgerState = { complete: false, loading: false, fromCache: true, loadedRows: 0 };

/** Cache mémoire : source de vérité des lectures synchrones. */
const cache: Partial<Record<CollectionName, any[]>> = {};

/** Collections dont le premier snapshot est arrivé. */
const loaded = new Set<CollectionName>();

const unsubscribers = new Map<CollectionName, Unsubscribe>();
const subscriptionTokens = new Map<CollectionName, object>();
let syncEpoch = 0;
let removeRecoveryListeners: (() => void) | undefined;
let lastResumeAt = 0;
const refreshFailures = new Set<string>();
const refreshing = new Map<string, Promise<boolean>>();
// A reconnect can emit an older cache-only query before its server snapshot arrives.
const confirmedReads = new Map<string, { name: CollectionName; id: string; value: any | null; at: number }>();
let syncing = false;

const listeners = new Set<() => void>();
let lastError: string | null = null;
const collectionState = new Map<CollectionName, { pending: boolean; fromCache: boolean }>();
export const AUDIT_PAGE_SIZE = 100;
let auditHistoryComplete = false;
let auditHistoryLoading: Promise<void> | undefined;
let auditHistoryError: string | null = null;
const failedCollections = new Set<CollectionName>();
export type DocumentWriteStatus = 'unknown' | 'queued' | 'pending' | 'confirmed' | 'rejected';
export interface DocumentWriteState { status: DocumentWriteStatus; operationId?: string; error?: string }
export class DocumentWriteError extends Error {
  constructor(readonly status: 'pending' | 'rejected' | 'conflict', readonly path: string, readonly operationId: string | undefined, message: string) { super(message); this.name = 'DocumentWriteError'; }
}
export const isConfirmedWriteRejection = (error: unknown): error is DocumentWriteError => error instanceof DocumentWriteError && error.status === 'rejected';
type QueuedWrite = { name: CollectionName; id: string; data?: any; merge?: boolean; mergeFields?: string[]; remove?: boolean; operationId?: string };
let queuedWrites: QueuedWrite[] = [];
const inFlight = new Set<Promise<void>>();
const inFlightTargets = new Map<Promise<void>, Set<string>>();
const pendingDocuments = new Set<string>();
let writeFailure: string | null = null;
const documentWrites = new Map<string, DocumentWriteState>();
const unresolvedWriteError = () => [...documentWrites.values()].find(state => state.status !== 'confirmed' && state.error)?.error ?? null;
let writeSequence = 0;
const isLocalPreview = () => import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local');
const permanentWriteFailure = (error: any) => ['permission-denied', 'unauthenticated', 'invalid-argument', 'failed-precondition', 'already-exists', 'not-found', 'out-of-range', 'unimplemented', 'aborted'].includes(String(error?.code ?? '').replace(/^firestore\//, ''));
function updateWriteState(op: QueuedWrite, status: DocumentWriteStatus, error?: string) {
  const path = `${op.name}/${op.id}`;
  if (documentWrites.get(path)?.operationId === op.operationId) documentWrites.set(path, { operationId: op.operationId, status, ...(error ? { error } : {}) });
}

function flushWrites(): void {
  if (!queuedWrites.length) return;
  const operations = queuedWrites;
  queuedWrites = [];
  operations.forEach(op => updateWriteState(op, 'pending'));
  let dispatched = false;
  const promise = (async () => {
    if (operations.length > 450) throw new Error('Plus de 450 modifications simultanées. Utilise la restauration serveur. Aucune de ces modifications n’a été enregistrée.');
    const batch = writeBatch(db);
    for (const op of operations) {
      const ref = doc(db, op.name, op.id);
      if (op.remove) batch.delete(ref);
      else batch.set(ref, op.data, op.mergeFields ? { mergeFields: op.mergeFields } : { merge: op.merge === true });
    }
    dispatched = true;
    await batch.commit();
  })();
  inFlight.add(promise);
  inFlightTargets.set(promise, new Set(operations.map(op => `${op.name}/${op.id}`)));
  promise.then(() => {
    operations.forEach(op => updateWriteState(op, 'confirmed'));
    writeFailure = unresolvedWriteError();
  }, err => {
    const rejected = !dispatched || permanentWriteFailure(err);
    writeFailure = `${rejected ? 'Enregistrement refusé' : 'Confirmation incertaine'} : ${err.message}`;
    operations.forEach(op => updateWriteState(op, rejected ? 'rejected' : 'pending', writeFailure!));
    lastError = writeFailure;
    console.error('[Firestore] atomic write', err);
  }).finally(() => {
    inFlight.delete(promise); inFlightTargets.delete(promise);
    // There is no whole-collection listener for the financial register. Confirm
    // the exact touched rows without replaying their payment/stock operation.
    for (const op of operations) if (isFinancialCollection(op.name)) void FirestoreRepo.refreshDocument(op.name, op.id);
    notify();
  });
  notify();
}
function enqueueWrite(operation: QueuedWrite): void {
  operation.operationId = `write-${++writeSequence}`;
  documentWrites.set(`${operation.name}/${operation.id}`, { operationId: operation.operationId, status: 'queued' });
  if (!queuedWrites.length) queueMicrotask(flushWrites);
  queuedWrites.push(operation);
}

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('[Firestore] listener', err);
    }
  });
}

function openCollection(name: CollectionName) {
  const token = {};
  subscriptionTokens.set(name, token);
  unsubscribers.get(name)?.();
  const current = () => syncing && subscriptionTokens.get(name) === token;
  unsubscribers.set(name, onSnapshot(
    name === 'auditLogs' ? query(collection(db, name), orderBy(documentId(), 'desc'), limit(AUDIT_PAGE_SIZE)) : collection(db, name),
    { includeMetadataChanges: true },
    snap => {
      if (!current()) return;
      for (const path of pendingDocuments) if (path.startsWith(`${name}/`)) pendingDocuments.delete(path);
      snap.docs.forEach(d => { if (d.metadata?.hasPendingWrites) pendingDocuments.add(`${name}/${d.id}`); });
      let items = snap.docs.map(d => ({ ...(d.data() as any), __docId: d.id }));
      for (const [path, read] of confirmedReads) {
        if (read.name !== name) continue;
        if (!snap.metadata.fromCache || hasPendingDocumentWrite(name, read.id)) {
          confirmedReads.delete(path);
        } else {
          items = items.filter(d => d.__docId !== read.id);
          if (read.value) items.push(read.value);
        }
      }
      // The audit journal is immutable. Keep only already visited older pages;
      // the live query watches its newest page, never years of past activity.
      if (name === 'auditLogs') {
        const merged = new Map((cache[name] ?? []).map(item => [item.__docId ?? item.id, item]));
        items.forEach(item => merged.set(item.__docId, item));
        items = [...merged.values()];
        if (!snap.metadata.fromCache && snap.docs.length < AUDIT_PAGE_SIZE) auditHistoryComplete = true;
      }
      cache[name] = items;
      if (!snap.metadata.fromCache) {
        for (const path of refreshFailures) if (path.startsWith(`${name}/`)) refreshFailures.delete(path);
      }
      loaded.add(name);
      failedCollections.delete(name);
      collectionState.set(name, { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache });
      notify();
    },
    err => {
      if (!current()) return;
      lastError = err.code === 'permission-denied'
        ? "Accès refusé par les règles de sécurité Firestore. Ce compte Google n'est pas autorisé."
        : `Synchronisation ${name} impossible : ${err.message}`;
      console.error(`[Firestore] onSnapshot ${name}`, err);
      // A failed Firestore listener is terminal; it must be attached again on recovery.
      failedCollections.add(name);
      notify();
    }
  ));
}

function hasPendingDocumentWrite(name: CollectionName, id: string) {
  const path = `${name}/${id}`;
  return pendingDocuments.has(path) || queuedWrites.some(op => op.name === name && op.id === id) ||
    [...inFlightTargets.values()].some(paths => paths.has(path));
}

/**
 * Firestore refuse les valeurs `undefined`. L'application en produit
 * naturellement (champs optionnels non remplis) : on les retire avant écriture
 * plutôt que de laisser l'écriture entière échouer.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((v) => v === undefined ? null : stripUndefined(v)) as unknown as T;
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, any> = {};
    Object.entries(value as Record<string, any>).forEach(([k, v]) => {
      if (v !== undefined && k !== '__docId') out[k] = stripUndefined(v);
    });
    return out as T;
  }
  return value;
}

export const FirestoreRepo = {
  financialLedgerStatus(): FinancialLedgerState { return { ...financialState }; },
  auditHistoryStatus() {
    return { complete: isLocalPreview() || auditHistoryComplete, loading: !!auditHistoryLoading, error: auditHistoryError };
  },

  /** Fetch one older audit page only after an explicit request from its viewer. */
  async loadOlderAuditLogs(): Promise<void> {
    if (isLocalPreview() || auditHistoryComplete) return;
    if (auditHistoryLoading) return auditHistoryLoading;
    if (!syncing || !loaded.has('auditLogs')) throw new Error('Le journal récent est encore en cours de chargement.');
    const epoch = syncEpoch;
    const cursor = (cache.auditLogs ?? []).map(item => String(item.__docId ?? item.id)).sort()[0];
    if (!cursor) throw new Error('Le journal récent est encore en cours de chargement.');
    auditHistoryError = null;
    const work = (async () => {
      try {
        const snap = await getDocsFromServer(query(collection(db, 'auditLogs'), orderBy(documentId(), 'desc'), startAfter(cursor), limit(AUDIT_PAGE_SIZE)));
        if (!syncing || epoch !== syncEpoch) return;
        const merged = new Map((cache.auditLogs ?? []).map(item => [item.__docId ?? item.id, item]));
        snap.docs.forEach(item => merged.set(item.id, { ...item.data(), __docId: item.id }));
        cache.auditLogs = [...merged.values()];
        auditHistoryComplete = snap.docs.length < AUDIT_PAGE_SIZE;
      } catch (error) {
        if (syncing && epoch === syncEpoch) auditHistoryError = 'Le journal ancien n’a pas pu être chargé. Les événements déjà affichés sont conservés.';
        throw error;
      }
    })();
    auditHistoryLoading = work;
    notify();
    try { await work; }
    finally {
      if (auditHistoryLoading === work) auditHistoryLoading = undefined;
      if (syncing && epoch === syncEpoch) notify();
    }
  },
  documentWriteState(name: CollectionName, id: string): DocumentWriteState {
    return { ...(documentWrites.get(`${name}/${id}`) ?? { status: 'unknown' }) };
  },
  /** A confirmed result is a server read of this exact document, never a global queue status.
   * A rejected write is replayable only after the server also confirms this document absent.
   * Timeouts, network failures and a different document remain uncertain and cannot be replayed.
   */
  async waitForDocument<T extends { id?: string } = any>(name: CollectionName, id: string, timeoutMs = 15000, identity?: (value: T) => boolean): Promise<T> {
    flushWrites();
    const path = `${name}/${id}`, epoch = syncEpoch;
    const operationId = documentWrites.get(path)?.operationId;
    const matches = (value: T) => value?.id === id && (!identity || identity(value));
    if (isLocalPreview()) {
      const value = this.find(name, id) as T | undefined;
      if (!value || !matches(value)) throw new DocumentWriteError('conflict', path, operationId, 'Le document local ne correspond pas à cette saisie. Le brouillon est conservé.');
      return value;
    }
    const writes = [...inFlightTargets].filter(([, paths]) => paths.has(path)).map(([promise]) => promise);
    const uncertain = () => new DocumentWriteError('pending', path, operationId, 'Confirmation de cette écriture en attente. Le brouillon est conservé ; vérifie la synchronisation sans la recréer.');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const verify = async (): Promise<T> => {
      // A rejected commit still needs its own readback: a previous identical submission may exist.
      await Promise.allSettled(writes);
      if (epoch !== syncEpoch) throw uncertain();
      let snap: Awaited<ReturnType<typeof getDocFromServer>>;
      try { snap = await getDocFromServer(doc(db, name, id)); } catch { throw uncertain(); }
      if (epoch !== syncEpoch || snap.metadata.hasPendingWrites || snap.metadata.fromCache) throw uncertain();
      const current = documentWrites.get(path);
      if (current?.operationId !== operationId && current?.operationId) throw uncertain();
      if (!snap.exists()) {
        if (current?.status === 'rejected') {
          // Remove only this absent document's optimistic cache entry, never an existing stock row.
          cache[name] = (cache[name] ?? []).filter(d => d.id !== id && d.__docId !== id);
          confirmedReads.set(path, { name, id, value: null, at: Date.now() });
          notify();
          throw new DocumentWriteError('rejected', path, operationId, `${current.error ?? 'Enregistrement refusé.'} Aucun document de cette saisie n’a été enregistré. Corrige le brouillon puis réessaie.`);
        }
        throw uncertain();
      }
      const value = { ...(snap.data() as Record<string, unknown>), __docId: snap.id } as unknown as T;
      if (snap.id !== id || !matches(value)) throw new DocumentWriteError('conflict', path, operationId, 'Une écriture différente porte cet identifiant. Le brouillon est conservé ; aucun nouvel enregistrement automatique.');
      documentWrites.set(path, { operationId, status: 'confirmed' });
      writeFailure = unresolvedWriteError();
      cache[name] = [...(cache[name] ?? []).filter(d => d.id !== id && d.__docId !== id), value];
      confirmedReads.set(path, { name, id, value, at: Date.now() });
      notify();
      return value;
    };
    try {
      return await Promise.race([verify(), new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(uncertain()), timeoutMs);
      })]);
    } finally { if (timer) clearTimeout(timer); }
  },
  syncStatus() {
    return {
      pending: queuedWrites.length > 0 || inFlight.size > 0 || pendingDocuments.size > 0 || [...collectionState.values()].some(s => s.pending) || [...documentWrites.values()].some(s => s.status === 'queued' || s.status === 'pending'),
      fromCache: collectionState.size === 0 || [...collectionState.values()].some(s => s.fromCache),
      refreshing: refreshing.size > 0 || financialState.loading,
      needsRefresh: failedCollections.size > 0 || refreshFailures.size > 0 || !!financialState.error,
      error: writeFailure || financialState.error || financialState.cacheWarning || (failedCollections.size ? 'Certaines données ne sont pas accessibles.' :
        refreshFailures.size ? 'Modifications enregistrées · actualisation en attente.' : null)
    };
  },

  /** Resolves only after server acknowledgement. A timeout never claims success or cancels the queue. */
  async waitForWrites(timeoutMs = 15000): Promise<void> {
    if (import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local')) return;
    flushWrites();
    const work = Promise.all([...inFlight, waitForPendingWrites(db)]).then(() => {
      if (writeFailure) throw new Error(writeFailure);
    });
    let timer: ReturnType<typeof setTimeout>;
    try {
      await Promise.race([work, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Confirmation serveur en attente. Les modifications locales restent en file de synchronisation.')), timeoutMs);
      })]);
    } finally { clearTimeout(timer!); }
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  },

  consumeError(): string | null {
    const e = lastError;
    lastError = null;
    return e;
  },

  isSyncing(): boolean {
    return syncing;
  },

  syncSession(): number {
    return syncEpoch;
  },

  /** Vrai quand toutes les collections ont reçu leur premier snapshot. */
  isReady(): boolean {
    return failedCollections.size === 0 && ALL_COLLECTIONS.every((c) => loaded.has(c));
  },

  readyCount(): { loaded: number; total: number } {
    return { loaded: loaded.size, total: ALL_COLLECTIONS.length };
  },

  /** Lecture synchrone depuis le cache. */
  all<T>(name: CollectionName): T[] {
    return (cache[name] as T[]) ?? [];
  },

  find<T extends { id?: string }>(name: CollectionName, id: string): T | undefined {
    return ((cache[name] ?? []) as T[]).find((d: any) => d.id === id || d.__docId === id);
  },

  /** Read after a server-side mutation, without replaying the mutation if the network drops. */
  async refreshDocument(name: CollectionName, id: string): Promise<boolean> {
    const epoch = syncEpoch;
    if (!syncing) return false;
    const path = `${name}/${id}`;
    // A second mutation must read after the first refresh, not reuse its older result.
    const preceding = refreshing.get(path);
    const work = (async () => {
      await preceding;
      if (!syncing || epoch !== syncEpoch) return false;
      const previous = this.find(name, id);
      try {
        const snap = await getDocFromServer(doc(db, name, id));
        if (!syncing || epoch !== syncEpoch) return false;
        // SDK snapshots and local writes may have advanced while the read was in flight.
        if (this.find(name, id) === previous && !hasPendingDocumentWrite(name, id) && !snap.metadata.hasPendingWrites) {
          const items = (cache[name] ?? []).filter(d => d.__docId !== id && d.id !== id);
          const value = snap.exists() ? { ...snap.data(), __docId: snap.id } : null;
          if (value) items.push(value);
          cache[name] = items;
          confirmedReads.set(path, { name, id, value, at: Date.now() });
        }
        refreshFailures.delete(path);
        return true;
      } catch {
        if (syncing && epoch === syncEpoch) refreshFailures.add(path);
        return false;
      }
    })();
    refreshing.set(path, work);
    notify();
    try { return await work; }
    finally {
      if (refreshing.get(path) === work) refreshing.delete(path);
      if (syncing && epoch === syncEpoch) notify();
    }
  },

  /** Resume only interrupted streams. No polling or full database download on every focus. */
  resumeSync(force = false): void {
    if (!syncing || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    if (!force && Date.now() - lastResumeAt < 15000) return;
    lastResumeAt = Date.now();
    void financialController?.refresh();
    if (!financialController && !isLocalPreview()) this.startFinancialSync();
    for (const name of LIVE_COLLECTIONS) {
      if (failedCollections.has(name) || collectionState.get(name)?.fromCache) openCollection(name);
    }
    for (const path of refreshFailures) {
      if (!refreshing.has(path)) {
        const slash = path.indexOf('/');
        void this.refreshDocument(path.slice(0, slash) as CollectionName, path.slice(slash + 1));
      }
    }
  },

  startFinancialSync(): void {
    if (financialStarting || financialController) return;
    financialStarting = true;
    const epoch = syncEpoch;
    financialState = { complete: false, loading: true, fromCache: true, loadedRows: 0 };
    // SDK pending writes survive a closed tab. Recover only those pending rows
    // from its local cache (zero server reads), never treat that query as a
    // complete ledger. Their confirmed counterparts still come from the sync.
    const recoverPending = async () => {
      const recovered: Array<{ name: CollectionName; id: string }> = [];
      await Promise.all(FINANCIAL_SYNC_COLLECTIONS.map(async name => {
        try {
          const local = await getDocsFromCache(collection(db, name));
          if (!syncing || epoch !== syncEpoch) return;
          for (const document of local.docs) if (document.metadata.hasPendingWrites) {
            const value = { ...document.data(), __docId: document.id };
            cache[name] = [...(cache[name] ?? []).filter(item => item.__docId !== document.id && item.id !== document.id), value];
            pendingDocuments.add(`${name}/${document.id}`); recovered.push({ name, id: document.id });
          }
        } catch { /* An empty/unavailable SDK cache is not a complete register. */ }
      }));
      if (recovered.length) {
        notify();
        void waitForPendingWrites(db).then(async () => {
          if (!syncing || epoch !== syncEpoch) return;
          recovered.forEach(({ name, id }) => pendingDocuments.delete(`${name}/${id}`));
          await Promise.all(recovered.map(({ name, id }) => this.refreshDocument(name, id)));
        }).catch(() => { /* Session changes cancel SDK waits; next login recovers its own queue. */ });
      }
    };
    void recoverPending().then(() => startFinancialLedgerSync({
      onData(rows, detail) {
        if (!syncing || epoch !== syncEpoch) return;
        for (const name of FINANCIAL_SYNC_COLLECTIONS) {
          const previous = cache[name] ?? [];
          const items = new Map(rows.filter(row => row.collection === name && row.data).map(row => [row.id, { ...row.data, __docId: row.id }]));
          for (const item of previous) if (hasPendingDocumentWrite(name, item.__docId ?? item.id)) items.set(item.__docId ?? item.id, item);
          for (const [path, read] of confirmedReads) {
            if (read.name !== name) continue;
            if (detail.covered.has(path) && detail.requestStartedAt >= read.at && !hasPendingDocumentWrite(name, read.id)) confirmedReads.delete(path);
            else { items.delete(read.id); if (read.value) items.set(read.id, read.value); }
          }
          cache[name] = [...items.values()]; loaded.add(name);
        }
        notify();
      },
      onState(state) {
        if (!syncing || epoch !== syncEpoch) return;
        financialState = state;
        for (const name of FINANCIAL_SYNC_COLLECTIONS) collectionState.set(name, { pending: false, fromCache: state.fromCache });
        notify();
      }
    })).then(controller => { if (!syncing || epoch !== syncEpoch) controller.stop(); else { financialStarting = false; financialController = controller; } })
      .catch(error => { if (syncing && epoch === syncEpoch) { financialStarting = false; financialState = { ...financialState, loading: false, error: (error as Error).message }; notify(); } });
  },

  /** Ouvre les abonnements temps réel. Idempotent. */
  startSync(): void {
    if (syncing) return;
    syncing = true;
    syncEpoch += 1;
    lastResumeAt = 0;
    loaded.clear();
    failedCollections.clear();
    collectionState.clear();
    auditHistoryComplete = false;
    auditHistoryLoading = undefined;
    auditHistoryError = null;

    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      ALL_COLLECTIONS.forEach((c) => { loaded.add(c); collectionState.set(c, { pending: false, fromCache: false }); });
      return;
    }

    LIVE_COLLECTIONS.forEach(openCollection);
    this.startFinancialSync();
    if (typeof window !== 'undefined') {
      const resume = () => { if (document.visibilityState !== 'hidden') this.resumeSync(); };
      window.addEventListener('online', resume);
      window.addEventListener('pageshow', resume);
      window.addEventListener('focus', resume);
      document.addEventListener('visibilitychange', resume);
      removeRecoveryListeners = () => {
        window.removeEventListener('online', resume);
        window.removeEventListener('pageshow', resume);
        window.removeEventListener('focus', resume);
        document.removeEventListener('visibilitychange', resume);
      };
    }
  },

  stopSync(): void {
    financialController?.stop(); financialController = undefined; financialStarting = false;
    financialState = { complete: false, loading: false, fromCache: true, loadedRows: 0 };
    // Queue business writes under the current identity before clearing the views.
    flushWrites();
    syncEpoch += 1;
    subscriptionTokens.clear();
    removeRecoveryListeners?.();
    removeRecoveryListeners = undefined;
    unsubscribers.forEach((u) => {
      try {
        u();
      } catch {
        /* ignore */
      }
    });
    unsubscribers.clear();
    refreshFailures.clear();
    refreshing.clear();
    confirmedReads.clear();
    documentWrites.clear();
    writeFailure = null;
    syncing = false;
    loaded.clear();
    failedCollections.clear();
    collectionState.clear();
    BUSINESS_COLLECTIONS.forEach((c) => delete cache[c]);
    pendingDocuments.clear();
    notify();
  },

  /**
   * Écrit un document. Volontairement « fire and forget » : Firestore applique
   * la modification à son cache local immédiatement (donc l'écran se met à jour
   * tout de suite), et se charge de la pousser au serveur dès que possible.
   * Attendre la promesse bloquerait l'interface hors-ligne pour rien.
   */
  put(name: CollectionName, id: string, data: any, options: { merge?: boolean } = {}): void {
    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      if (!cache[name]) cache[name] = [];
      const idx = cache[name]!.findIndex((d: any) => d.id === id || d.__docId === id);
      const itemWithDoc = { ...(options.merge && idx >= 0 ? cache[name]![idx] : {}), ...data, id: data.id ?? id, __docId: id };
      if (idx >= 0) {
        cache[name]![idx] = itemWithDoc;
      } else {
        cache[name]!.push(itemWithDoc);
      }
      documentWrites.set(`${name}/${id}`, { operationId: `write-${++writeSequence}`, status: 'confirmed' });
      notify();
      return;
    }

    // Once migrated, the journal is written exclusively through its revisioned server endpoint.
    const cached = cache[name]?.find((d: any) => d.id === id || d.__docId === id);
    const managedJournal = name === 'batches' && (data.brewDay?.revision != null || cached?.brewDay?.revision != null);
    const payload = { ...data };
    if (managedJournal) delete payload.brewDay;
    const cleaned = stripUndefined(payload);
    if (managedJournal) for (const [key, value] of Object.entries(payload)) {
      if (value === undefined && key !== '__docId') cleaned[key] = deleteField();
    }
    // One user gesture may write stock, a lot and its audit entry. Commit them together.
    enqueueWrite({ name, id, data: cleaned, merge: options.merge === true,
      ...(managedJournal ? { mergeFields: Object.keys(cleaned) } : {}) });
    if (isFinancialCollection(name) && syncing) {
      cache[name] = [...(cache[name] ?? []).filter(item => item.id !== id && item.__docId !== id), { ...(options.merge ? cached : {}), ...cleaned, __docId: id }];
      notify();
    }
  },

  /** Add a quantity without overwriting a concurrent receipt or consumption. */
  adjustNumber(name: CollectionName, id: string, field: string, delta: number, extra: Record<string, unknown> = {}): void {
    if (!Number.isFinite(delta)) throw new Error('Quantité invalide.');
    if (import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local')) {
      const current = cache[name]?.find((d: any) => d.id === id || d.__docId === id);
      this.put(name, id, { ...extra, [field]: Math.round(((Number(current?.[field]) || 0) + delta) * 1e6) / 1e6 }, { merge: true });
      return;
    }
    enqueueWrite({ name, id, data: { ...stripUndefined(extra), [field]: increment(delta) }, merge: true });
    if (isFinancialCollection(name) && syncing) {
      const current = cache[name]?.find((item: any) => item.id === id || item.__docId === id);
      if (current) { cache[name] = [...(cache[name] ?? []).filter(item => item !== current), { ...current, ...extra, [field]: (Number(current[field]) || 0) + delta }]; notify(); }
    }
  },

  remove(name: CollectionName, id: string): void {
    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      if (cache[name]) {
        cache[name] = cache[name]!.filter((d: any) => d.id !== id && d.__docId !== id);
        notify();
      }
      return;
    }

    enqueueWrite({ name, id, remove: true });
  },

  /**
   * Remplace intégralement une collection (utilisé par les `saveXxx` en masse).
   * Firestore limite un lot à 500 opérations : on découpe.
   */
  async replaceAll(
    name: CollectionName,
    items: any[],
    idOf: (item: any, index: number) => string
  ): Promise<void> {
    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      cache[name] = items.map((it, i) => ({
        ...it,
        id: it.id ?? idOf(it, i),
        __docId: idOf(it, i)
      }));
      notify();
      return;
    }

    const existing = await getDocs(collection(db, name));
    const keep = new Set(items.map((it, i) => idOf(it, i)));

    const ops: Array<() => void> = [];
    let batch = writeBatch(db);
    let count = 0;
    const flushes: Promise<void>[] = [];

    const push = (fn: (b: ReturnType<typeof writeBatch>) => void) => {
      fn(batch);
      count += 1;
      if (count >= 450) {
        flushes.push(batch.commit());
        batch = writeBatch(db);
        count = 0;
      }
    };

    existing.docs.forEach((d) => {
      if (!keep.has(d.id)) push((b) => b.delete(d.ref));
    });
    items.forEach((it, i) => {
      push((b) => b.set(doc(db, name, idOf(it, i)), stripUndefined(it)));
    });

    if (count > 0) flushes.push(batch.commit());
    await Promise.all(flushes);
    void ops;
  },

  /** Nombre de documents réellement présents côté base (hors cache). */
  async isEmpty(name: CollectionName): Promise<boolean> {
    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      return (cache[name]?.length ?? 0) === 0;
    }
    const snap = await getDocsFromServer(query(collection(db, name), limit(1)));
    return snap.empty;
  },

  /** Écrit un gros lot en une passe — utilisé par la migration initiale. */
  async bulkWrite(entries: Array<{ name: CollectionName; id: string; data: any }>): Promise<void> {
    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      entries.forEach((e) => {
        if (!cache[e.name]) cache[e.name] = [];
        const existingIdx = cache[e.name]!.findIndex(
          (d: any) => d.id === e.id || d.__docId === e.id
        );
        const itemWithDoc = { ...e.data, id: e.data.id ?? e.id, __docId: e.id };
        if (existingIdx >= 0) {
          cache[e.name]![existingIdx] = itemWithDoc;
        } else {
          cache[e.name]!.push(itemWithDoc);
        }
      });
      notify();
      return;
    }

    let batch = writeBatch(db);
    let count = 0;
    const flushes: Promise<void>[] = [];

    for (const e of entries) {
      batch.set(doc(db, e.name, e.id), stripUndefined(e.data));
      count += 1;
      if (count >= 450) {
        flushes.push(batch.commit());
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) flushes.push(batch.commit());

    try {
      await Promise.all(flushes);
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        const collections = [...new Set(entries.map((e) => e.name))].join(', ');
        throw new Error(
          "Écriture refusée par les règles Firestore. Chaque groupe d’écritures est atomique ; " +
            "un import en plusieurs groupes peut être partiel et doit être rejoué. Collections concernées : " +
            collections +
            ". Vérifie qu'elles figurent toutes dans collectionsMetier() de firestore.rules " +
            "(script de contrôle : node scripts/check-rules.mjs)."
        );
      }
      throw err;
    }
  }
};
