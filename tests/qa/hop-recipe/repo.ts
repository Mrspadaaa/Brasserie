// Compiled only by scripts/check-hop-recipe-ui.mjs. Never imported from src/.
import { BUSINESS_COLLECTIONS } from '../../../functions/src/dataSchema';
export const ALL_COLLECTIONS = [...BUSINESS_COLLECTIONS];
/** Same serialization boundary as the real repository; this adapter owns no network. */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(v => v === undefined ? null : stripUndefined(v)) as T;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([key, v]) => v !== undefined && key !== '__docId')
      .map(([key, v]) => [key, stripUndefined(v)])) as T;
  }
  return value;
}
// Compatibility with the installed finance screens in a combined release.
export class DocumentWriteError extends Error {
  constructor(readonly status:'pending'|'rejected'|'conflict',readonly path:string,readonly operationId:string|undefined,message:string){super(message);this.name='DocumentWriteError';}
}
export const isConfirmedWriteRejection=(error:unknown):error is DocumentWriteError=>error instanceof DocumentWriteError&&error.status==='rejected';
const key = '__HOP_RECIPE_QA_ONLY__';
let rows: Record<string, Record<string, any>> = JSON.parse(localStorage.getItem(key) || '{}');
let ready = false, failure: string | null = null;
const listeners = new Set<() => void>();
export const qaMetrics = { writes: 0, reads: 0, confirmations: 0, failNext: false, rejectNextRecipe: false, holdNextRecipe: false };
let releaseRecipe: (() => void) | undefined;
export const releaseQaRecipe = () => { releaseRecipe?.(); releaseRecipe = undefined; };
const rejectedRecipes = new Map<string, string>();
const notify = () => listeners.forEach(fn => fn());
const persist = () => { localStorage.setItem(key, JSON.stringify(rows)); notify(); };
export function seedQa(data: Record<string, any[]>) {
  rows = Object.fromEntries(Object.entries(data).map(([name, entries]) => [name, Object.fromEntries(entries.map(row => [row.id ?? row.ref, row]))]));
  failure = null; persist(); qaMetrics.writes = 0;
}
export const FirestoreRepo = {
  startSync() { ready = true; notify(); }, stopSync() { ready = false; },
  isReady: () => ready, isSyncing: () => ready, syncSession: () => 1,
  financialLedgerStatus: () => ({complete:ready,loading:false,fromCache:false,loadedRows:0}),
  documentWriteState: () => ({status:'confirmed'}),
  readyCount: () => ({ loaded: ALL_COLLECTIONS.length, total: ALL_COLLECTIONS.length }),
  all: <T,>(name: string): T[] => Object.entries(rows[name] ?? {}).map(([id, row]) => ({ ...row, __docId: id })) as T[],
  find: <T,>(name: string, id: string): T | undefined => rows[name]?.[id],
  subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  consumeError() { const value = failure; failure = null; return value; },
  syncStatus: () => ({ pending: false, fromCache: false, refreshing: false, needsRefresh: false, error: failure }),
  resumeSync() {}, refreshDocument: async () => true,
  async waitForDocument(name: string, id: string, _timeout?: number, identity?: (value: any) => boolean) {
    qaMetrics.confirmations++;
    if (name === 'recipes' && qaMetrics.holdNextRecipe) {
      qaMetrics.holdNextRecipe = false;
      await new Promise<void>(resolve => { releaseRecipe = resolve; });
    }
    if (name === 'recipes' && rejectedRecipes.has(id)) throw Error(rejectedRecipes.get(id));
    const value = rows[name]?.[id];
    if (!value || (identity && !identity(value))) throw Error('QA : document différent de la saisie');
    return structuredClone(value);
  },
  put(name: string, id: string, data: any, options: { merge?: boolean } = {}) {
    qaMetrics.writes++;
    if (name === 'recipes') {
      if (qaMetrics.rejectNextRecipe) {
        qaMetrics.rejectNextRecipe = false;
        failure = 'QA : enregistrement refusé. Le brouillon est conservé.';
        rejectedRecipes.set(id, failure); notify(); return;
      }
      rejectedRecipes.delete(id);
    }
    rows[name] ??= {};
    rows[name][id] = JSON.parse(JSON.stringify(options.merge ? { ...rows[name][id], ...data } : data));
    persist();
  },
  remove(name: string, id: string) { qaMetrics.writes++; delete rows[name]?.[id]; persist(); },
  async bulkWrite(entries: any[]) { for (const e of entries) this.put(e.name, e.id, e.data); await this.waitForWrites(); },
  async replaceAll(data: Record<string, any[]>) { seedQa(data); },
  async isEmpty(name: string) { return !Object.keys(rows[name] ?? {}).length; },
  async waitForWrites() {
    qaMetrics.confirmations++;
    if (qaMetrics.failNext) { qaMetrics.failNext = false; failure = 'QA : confirmation de persistance refusée'; notify(); throw Error(failure); }
  }
};
