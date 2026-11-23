import { financialRowKey, validFinancialSyncRow, type FinancialSyncPage, type FinancialSyncRow } from '../../functions/src/financialSyncTypes';
import { readFinancialLedgerCache, writeFinancialLedgerCache, validCachedFinancialLedger, type CachedFinancialLedger } from './financialLedgerCache';

export interface FinancialLedgerState {
  complete: boolean; loading: boolean; fromCache: boolean; asOf?: string; error?: string; cacheWarning?: string; loadedRows: number;
}
export interface FinancialLedgerCallbacks {
  onData(rows: FinancialSyncRow[], detail: { covered: Set<string>; requestStartedAt: number }): void;
  onState(state: FinancialLedgerState): void;
}
export interface FinancialLedgerTransport {
  owner: string;
  call(payload: Record<string, unknown>): Promise<any>;
  watch(onRevision: () => void, onError: (error: unknown) => void): () => void;
  readCache(): Promise<CachedFinancialLedger | null>;
  writeCache(value: CachedFinancialLedger): Promise<void>;
}
const message = (error: any) => error?.message ? String(error.message).replace(/^FirebaseError:\s*/, '') : 'La connexion comptable n’est pas disponible.';

/** A full, versioned register is published as one unit. Deltas are invalidations;
 * they never re-run a payment, change stocks or replay a business write. */
export function createFinancialLedgerSync(transport: FinancialLedgerTransport, callbacks: FinancialLedgerCallbacks) {
  let stopped = false, initialized = false, work: Promise<void> | undefined, requested = false;
  let ledger: CachedFinancialLedger | null = null;
  let state: FinancialLedgerState = { complete: false, loading: true, fromCache: true, loadedRows: 0 };
  const emit = (update: Partial<FinancialLedgerState>) => { state = { ...state, ...update }; if (!stopped) callbacks.onState(state); };
  const publish = (rows: Map<string, FinancialSyncRow>, covered: Set<string>, requestStartedAt: number) => {
    if (stopped || !ledger) return;
    ledger.rows = [...rows.values()].filter(row => row.data !== null);
    ledger.rowCount = ledger.rows.length;
    callbacks.onData(ledger.rows, { covered, requestStartedAt });
    emit({ complete: true, fromCache: false, asOf: ledger.asOf, loadedRows: ledger.rows.length, error: undefined });
  };
  const checkPage = (page: FinancialSyncPage) => {
    if (!page || !Array.isArray(page.rows) || !page.rows.every(validFinancialSyncRow) || !Number.isSafeInteger(page.cursor) || page.cursor < 0 || typeof page.done !== 'boolean' || !Number.isFinite(Date.parse(page.asOf))) throw Error('La synchronisation comptable a renvoyé une page incomplète. Réessaie son chargement.');
  };
  const bootstrap = async (): Promise<CachedFinancialLedger> => {
    emit({ loading: true, loadedRows: 0 });
    const start = await transport.call({ action: 'start' });
    if (!start?.sessionId || !Number.isSafeInteger(start.cursor) || !Number.isFinite(Date.parse(start.asOf))) throw Error('La première synchronisation n’a pas pu commencer.');
    const rows = new Map<string, FinancialSyncRow>();
    let collectionIndex = 0, afterId: string | null = null, pageIndex = 0;
    while (!stopped) {
      const page = await transport.call({ action: 'page', sessionId: start.sessionId, pageIndex, collectionIndex, afterId });
      checkPage(page);
      if (page.cursor !== start.cursor || page.sessionId !== start.sessionId || page.pageIndex !== pageIndex || page.asOf !== start.asOf) throw Error('Le point de lecture comptable a changé. Recommence le chargement.');
      const expectedName = collectionIndex === 0 ? 'transactions' : 'financialPayments';
      let lastId = afterId;
      for (const row of page.rows) {
        if (row.collection !== expectedName || row.data === null || rows.has(financialRowKey(row)) || lastId !== null && row.id <= lastId) throw Error('La copie comptable contient une page manquante ou répétée.');
        rows.set(financialRowKey(row), row); lastId = row.id;
      }
      if (![collectionIndex, collectionIndex + 1].includes(page.nextCollectionIndex) || page.nextCollectionIndex === collectionIndex && (!page.rows.length || page.nextAfterId !== lastId) || page.nextCollectionIndex !== collectionIndex && page.nextAfterId !== null || page.done !== (page.nextCollectionIndex === 2)) throw Error('Le parcours du registre comptable est incomplet.');
      emit({ loadedRows: rows.size });
      if (page.done) return { schemaVersion: 1, owner: transport.owner, complete: true, cursor: start.cursor, asOf: start.asOf, savedAt: Date.now(), rowCount: rows.size, rows: [...rows.values()] };
      collectionIndex = page.nextCollectionIndex; afterId = page.nextAfterId; pageIndex++;
    }
    throw Error('Synchronisation interrompue.');
  };
  const run = async () => {
    emit({ loading: true, error: undefined });
    const requestStartedAt = Date.now();
    try {
      if (!initialized) {
        initialized = true;
        ledger = await transport.readCache().catch(() => null);
        if (!validCachedFinancialLedger(ledger, transport.owner)) ledger = null;
        if (stopped) return;
        if (ledger) {
          callbacks.onData(ledger.rows, { covered: new Set(), requestStartedAt: 0 });
          emit({ complete: true, fromCache: true, asOf: ledger.asOf, loadedRows: ledger.rows.length });
        }
      }
      let resetCount = 0;
      if (!ledger) ledger = await bootstrap();
      if (stopped) return;
      let candidate = ledger;
      let rows = new Map(candidate.rows.map(row => [financialRowKey(row), row]));
      const covered = new Set<string>();
      while (!stopped) {
        const page: FinancialSyncPage = await transport.call({ action: 'delta', cursor: candidate.cursor });
        if (stopped) return;
        checkPage(page);
        if (page.reset) {
          if (++resetCount > 1) throw Error('Le registre a changé pendant sa synchronisation. Réessaie le chargement.');
          candidate = await bootstrap(); rows = new Map(candidate.rows.map(row => [financialRowKey(row), row])); covered.clear(); continue;
        }
        if (page.cursor < candidate.cursor || !page.done && page.cursor === candidate.cursor) throw Error('Le suivi des changements comptables est interrompu.');
        for (const row of page.rows) {
          const key = financialRowKey(row), previous = rows.get(key);
          if (!previous || row.version >= previous.version) { row.data === null ? rows.delete(key) : rows.set(key, row); covered.add(key); }
        }
        candidate = { ...candidate, cursor: page.cursor, asOf: page.asOf, savedAt: Date.now() };
        if (!page.done) continue;
        ledger = candidate;
        publish(rows, covered, requestStartedAt);
        try { await transport.writeCache(ledger); emit({ cacheWarning: undefined }); }
        catch { emit({ cacheWarning: 'Le registre est chargé, mais cet appareil ne peut pas le conserver hors ligne. Le prochain démarrage nécessitera un nouveau chargement.' }); }
        break;
      }
    } catch (error) {
      emit({ error: `Synchronisation comptable : ${message(error)}`, fromCache: true });
    } finally { emit({ loading: false }); }
  };
  const refresh = () => {
    if (stopped) return Promise.resolve();
    requested = true;
    if (work) return work;
    work = (async () => { while (requested && !stopped) { requested = false; await run(); } })().finally(() => { work = undefined; });
    return work;
  };
  const unwatch = transport.watch(() => { void refresh(); }, error => emit({ error: `Suivi comptable : ${message(error)}`, fromCache: true }));
  void refresh();
  return { refresh, stop() { stopped = true; unwatch(); }, state: () => state };
}

export async function startFinancialLedgerSync(callbacks: FinancialLedgerCallbacks) {
  const [{ auth, db, functions, firebaseConfig }, { httpsCallable }, { doc, onSnapshot }] = await Promise.all([import('./firebase'), import('firebase/functions'), import('firebase/firestore')]);
  if (!auth.currentUser) throw Error('Reconnecte ton compte pour charger la comptabilité.');
  const owner = `${firebaseConfig.projectId}:${auth.currentUser.uid}`;
  const callable = httpsCallable<Record<string, unknown>, any>(functions, 'syncFinancialLedger', { timeout: 120000 });
  return createFinancialLedgerSync({ owner,
    call: async payload => (await callable(payload)).data,
    watch: (onRevision, onError) => onSnapshot(doc(db, 'financialSync', 'state'), { includeMetadataChanges: true }, snapshot => { if (!snapshot.metadata.fromCache) onRevision(); }, onError),
    readCache: () => readFinancialLedgerCache(owner), writeCache: writeFinancialLedgerCache
  }, callbacks);
}
