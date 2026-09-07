import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDocsFromServer,
  waitForPendingWrites,
  deleteField,
  query,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { BUSINESS_COLLECTIONS } from '../../functions/src/dataSchema';

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

export type CollectionName =
  | 'transactions'
  | 'stockItems'
  | 'equipment'
  | 'kegs'
  | 'movements'
  | 'batches'
  | 'finishedGoods'
  | 'reservations'
  | 'recipes'
  | 'clients'
  | 'planning'
  | 'budgetLines'
  | 'tarifs'
  | 'creativeItems'
  | 'expenseTemplates'
  | 'auditLogs'
  | 'config';

export const ALL_COLLECTIONS: CollectionName[] = [...BUSINESS_COLLECTIONS];

/** Cache mémoire : source de vérité des lectures synchrones. */
const cache: Partial<Record<CollectionName, any[]>> = {};

/** Collections dont le premier snapshot est arrivé. */
const loaded = new Set<CollectionName>();

let unsubscribers: Unsubscribe[] = [];
let syncing = false;

const listeners = new Set<() => void>();
let lastError: string | null = null;
const collectionState = new Map<CollectionName, { pending: boolean; fromCache: boolean }>();
const failedCollections = new Set<CollectionName>();
type QueuedWrite = { name: CollectionName; id: string; data?: any; merge?: boolean; mergeFields?: string[]; remove?: boolean };
let queuedWrites: QueuedWrite[] = [];
const inFlight = new Set<Promise<void>>();
const inFlightTargets = new Map<Promise<void>, Set<string>>();
const pendingDocuments = new Set<string>();
let writeFailure: string | null = null;

function flushWrites(): void {
  if (!queuedWrites.length) return;
  const operations = queuedWrites;
  queuedWrites = [];
  const promise = (async () => {
    if (operations.length > 450) throw new Error('Plus de 450 modifications simultanées. Utilise la restauration serveur. Aucune de ces modifications n’a été enregistrée.');
    const batch = writeBatch(db);
    for (const op of operations) {
      const ref = doc(db, op.name, op.id);
      if (op.remove) batch.delete(ref);
      else batch.set(ref, op.data, op.mergeFields ? { mergeFields: op.mergeFields } : { merge: op.merge === true });
    }
    await batch.commit();
  })();
  inFlight.add(promise);
  inFlightTargets.set(promise, new Set(operations.map(op => `${op.name}/${op.id}`)));
  promise.then(() => { writeFailure = null; }, err => {
    writeFailure = `Enregistrement refusé : ${err.message}`;
    lastError = writeFailure;
    console.error('[Firestore] atomic write', err);
  }).finally(() => { inFlight.delete(promise); inFlightTargets.delete(promise); notify(); });
  notify();
}
function enqueueWrite(operation: QueuedWrite): void {
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
  async waitForDocument(name: CollectionName, id: string, timeoutMs = 15000) {
    flushWrites();
    const path = `${name}/${id}`;
    const writes = [...inFlightTargets].filter(([, paths]) => paths.has(path)).map(([promise]) => promise);
    if (!writes.length && !pendingDocuments.has(path)) return;
    let timer: ReturnType<typeof setTimeout>;
    try {
      await Promise.race([Promise.all([...writes, waitForPendingWrites(db)]), new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Création du brassin à synchroniser. Réessaie au retour du réseau.')), timeoutMs);
      })]);
    } finally { clearTimeout(timer!); }
  },
  syncStatus() {
    return {
      pending: queuedWrites.length > 0 || inFlight.size > 0 || [...collectionState.values()].some(s => s.pending),
      fromCache: collectionState.size === 0 || [...collectionState.values()].some(s => s.fromCache),
      error: writeFailure || (failedCollections.size ? 'Certaines données ne sont pas accessibles.' : null)
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
    return ((cache[name] ?? []) as T[]).find((d: any) => d.id === id);
  },

  /** Ouvre les abonnements temps réel. Idempotent. */
  startSync(): void {
    if (syncing) return;
    syncing = true;
    loaded.clear();
    failedCollections.clear();
    collectionState.clear();

    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      ALL_COLLECTIONS.forEach((c) => { loaded.add(c); collectionState.set(c, { pending: false, fromCache: false }); });
      return;
    }

    unsubscribers = ALL_COLLECTIONS.map((name) =>
      onSnapshot(
        collection(db, name),
        { includeMetadataChanges: true },
        (snap) => {
          for (const path of pendingDocuments) if (path.startsWith(`${name}/`)) pendingDocuments.delete(path);
          snap.docs.forEach(d => { if (d.metadata?.hasPendingWrites) pendingDocuments.add(`${name}/${d.id}`); });
          cache[name] = snap.docs.map((d) => ({ ...(d.data() as any), __docId: d.id }));
          loaded.add(name);
          failedCollections.delete(name);
          collectionState.set(name, { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache });
          notify();
        },
        (err) => {
          // `permission-denied` ici signifie que les règles Firestore ont fait
          // leur travail : le compte connecté n'est pas dans la liste autorisée.
          const isPermission = (err as any)?.code === 'permission-denied';
          lastError = isPermission
            ? "Accès refusé par les règles de sécurité Firestore. Ce compte Google n'est pas autorisé."
            : `Synchronisation ${name} impossible : ${err.message}`;
          console.error(`[Firestore] onSnapshot ${name}`, err);
          failedCollections.add(name);
          notify();
        }
      )
    );
  },

  stopSync(): void {
    // Queue business writes under the current identity before clearing the views.
    flushWrites();
    unsubscribers.forEach((u) => {
      try {
        u();
      } catch {
        /* ignore */
      }
    });
    unsubscribers = [];
    syncing = false;
    loaded.clear();
    failedCollections.clear();
    collectionState.clear();
    ALL_COLLECTIONS.forEach((c) => delete cache[c]);
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
          "Écriture refusée par les règles Firestore. Le lot est atomique : une seule " +
            "collection non autorisée le fait échouer entièrement. Collections concernées : " +
            collections +
            ". Vérifie qu'elles figurent toutes dans collectionsMetier() de firestore.rules " +
            "(script de contrôle : node scripts/check-rules.mjs)."
        );
      }
      throw err;
    }
  }
};
