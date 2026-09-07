import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

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

export const ALL_COLLECTIONS: CollectionName[] = [
  'transactions',
  'stockItems',
  'equipment',
  'kegs',
  'movements',
  'batches',
  'finishedGoods',
  'reservations',
  'recipes',
  'clients',
  'planning',
  'budgetLines',
  'tarifs',
  'creativeItems',
  'expenseTemplates',
  'auditLogs',
  'config'
];

/** Cache mémoire : source de vérité des lectures synchrones. */
const cache: Partial<Record<CollectionName, any[]>> = {};

/** Collections dont le premier snapshot est arrivé. */
const loaded = new Set<CollectionName>();

let unsubscribers: Unsubscribe[] = [];
let syncing = false;

const listeners = new Set<() => void>();
let lastError: string | null = null;

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
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, any> = {};
    Object.entries(value as Record<string, any>).forEach(([k, v]) => {
      if (v !== undefined) out[k] = stripUndefined(v);
    });
    return out as T;
  }
  return value;
}

export const FirestoreRepo = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
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
    return ALL_COLLECTIONS.every((c) => loaded.has(c));
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

    if (
      import.meta.env.DEV &&
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).has('dev-local')
    ) {
      ALL_COLLECTIONS.forEach((c) => loaded.add(c));
      return;
    }

    unsubscribers = ALL_COLLECTIONS.map((name) =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          cache[name] = snap.docs.map((d) => ({ ...(d.data() as any), __docId: d.id }));
          loaded.add(name);
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
          // On marque quand même la collection comme « arrivée » pour ne pas
          // bloquer l'application sur un écran de chargement infini.
          loaded.add(name);
          notify();
        }
      )
    );
  },

  stopSync(): void {
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
    ALL_COLLECTIONS.forEach((c) => delete cache[c]);
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
    setDoc(doc(db, name, id), stripUndefined(payload), { merge: managedJournal || options.merge === true }).catch((err) => {
      lastError = `Sauvegarde de ${name}/${id} impossible : ${err.message}`;
      console.error('[Firestore] setDoc', name, id, err);
      notify();
    });
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

    deleteDoc(doc(db, name, id)).catch((err) => {
      lastError = `Suppression de ${name}/${id} impossible : ${err.message}`;
      console.error('[Firestore] deleteDoc', name, id, err);
      notify();
    });
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
    const snap = await getDocs(query(collection(db, name), limit(1)));
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
