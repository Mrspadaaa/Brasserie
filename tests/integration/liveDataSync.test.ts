import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  listeners: new Map<string, { next: (snap: any) => void; error: (error: any) => void }>(),
  read: vi.fn(), commit: vi.fn(), callable: vi.fn(), attachments: vi.fn()
}));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/services/financialLedgerSync', () => ({ startFinancialLedgerSync: async (callbacks: any) => {
  callbacks.onData([], { covered: new Set(), requestStartedAt: 0 });
  callbacks.onState({ complete: true, loading: false, fromCache: false, loadedRows: 0 });
  return { refresh: async () => {}, stop: () => {} };
} }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => sdk.callable }));
vi.mock('firebase/firestore', () => ({
  collection: (_: unknown, name: string) => name,
  doc: (_: unknown, name: string, id: string) => ({ name, id }),
  onSnapshot: (name: string, _: unknown, next: any, error: any) => {
    sdk.attachments(name);
    sdk.listeners.set(name, { next, error });
    return () => sdk.listeners.delete(name);
  },
  getDocFromServer: (...args: any[]) => sdk.read(...args),
  writeBatch: () => ({ set: vi.fn(), delete: vi.fn(), commit: sdk.commit }),
  waitForPendingWrites: async () => {},
  getDocs: vi.fn(), getDocsFromServer: vi.fn(), query: (name: string) => name, limit: vi.fn(), orderBy: vi.fn(), documentId: () => '__name__', startAfter: vi.fn(), deleteField: vi.fn()
}));
import { FirestoreRepo, LIVE_COLLECTIONS } from '../../src/services/firestoreRepo';
import { BrewerChat } from '../../src/services/brewerChat';

const record = { id: 'R-1', name: 'Avant', volumeL: 30 };
function documentSnapshot(value: any = record) {
  return { id: 'R-1', exists: () => value !== null, data: () => value,
    metadata: { fromCache: false, hasPendingWrites: false } };
}
function emit(value: any = record, fromCache = false, pending = false) {
  sdk.listeners.get('recipes')!.next({
    metadata: { fromCache, hasPendingWrites: pending },
    docs: value ? [{ ...documentSnapshot(value), metadata: { hasPendingWrites: pending } }] : []
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => {
  FirestoreRepo.stopSync();
  vi.clearAllMocks();
  sdk.read.mockReset();
  sdk.commit.mockReset().mockResolvedValue(undefined);
  sdk.callable.mockReset().mockResolvedValue({ data: { turn: { id: 'turn', proposal: { status: 'applied' } } } });
  FirestoreRepo.startSync();
  for (const listener of sdk.listeners.values()) listener.next({
    docs: [], metadata: { fromCache: false, hasPendingWrites: false }
  });
  emit();
});
afterEach(() => { FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Live cache after a confirmed server mutation (no real network or Gemini)', () => {
  it('refreshes the shared recipe cache after AI approval even if the list listener is delayed', async () => {
    sdk.read.mockResolvedValue(documentSnapshot({ ...record, name: 'Après', volumeL: 24 }));
    const result = await BrewerChat.apply({ kind: 'recipe', id: record.id }, 'turn', ['volume'], 'apply');
    expect(result.turn.proposal.status).toBe('applied');
    await vi.waitFor(() => expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ name: 'Après', volumeL: 24 }));
    expect(sdk.read).toHaveBeenCalledWith({ name: 'recipes', id: record.id });
    expect(sdk.callable).toHaveBeenCalledTimes(1);
  });

  it('does not refresh persisted records for a dismissed proposal or a local wizard draft', async () => {
    await BrewerChat.apply({ kind: 'recipe', id: record.id }, 'turn', [], 'dismiss');
    await BrewerChat.apply({ kind: 'draft', id: 'draft1' }, 'turn', ['name'], 'apply', record);
    expect(sdk.read).not.toHaveBeenCalled();
  });

  it('does not let an older cache-only reconnect undo a confirmed read or resurrect a deletion', async () => {
    sdk.read.mockResolvedValue(documentSnapshot({ ...record, volumeL: 24 }));
    await FirestoreRepo.refreshDocument('recipes', record.id);
    emit(record, true);
    expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ volumeL: 24 });
    emit({ ...record, volumeL: 22 });
    expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ volumeL: 22 });
    sdk.read.mockResolvedValue(documentSnapshot(null));
    await FirestoreRepo.refreshDocument('recipes', record.id);
    emit(record, true);
    expect(FirestoreRepo.find('recipes', record.id)).toBeUndefined();
  });

  it('keeps a newer streaming update when an older explicit read completes late', async () => {
    const pending = deferred<any>();
    sdk.read.mockReturnValue(pending.promise);
    const refresh = FirestoreRepo.refreshDocument('recipes', record.id);
    await Promise.resolve();
    emit({ ...record, volumeL: 22 });
    pending.resolve(documentSnapshot({ ...record, volumeL: 24 }));
    await refresh;
    expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ volumeL: 22 });
  });

  it('preserves offline edits instead of replacing them with server values', async () => {
    emit({ ...record, name: 'Saisie locale' }, true, true);
    sdk.read.mockResolvedValue(documentSnapshot(record));
    await FirestoreRepo.refreshDocument('recipes', record.id);
    expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ name: 'Saisie locale' });
    expect(FirestoreRepo.syncStatus().pending).toBe(true);
  });

  it('serializes consecutive invalidations, so a second approval cannot reuse the first read', async () => {
    const first = deferred<any>();
    sdk.read.mockReturnValueOnce(first.promise).mockResolvedValue(documentSnapshot({ ...record, volumeL: 20 }));
    const refreshes = [FirestoreRepo.refreshDocument('recipes', record.id), FirestoreRepo.refreshDocument('recipes', record.id)];
    await Promise.resolve();
    expect(sdk.read).toHaveBeenCalledTimes(1);
    first.resolve(documentSnapshot({ ...record, volumeL: 24 }));
    await Promise.all(refreshes);
    expect(sdk.read).toHaveBeenCalledTimes(2);
    expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ volumeL: 20 });
  });

  it('reports failed readback and retries only the read on recovery, never the AI mutation', async () => {
    sdk.read.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(documentSnapshot({ ...record, volumeL: 24 }));
    const result = await BrewerChat.apply({ kind: 'recipe', id: record.id }, 'turn', ['volume'], 'apply');
    expect(result.turn.proposal.status).toBe('applied');
    await vi.waitFor(() => expect(FirestoreRepo.syncStatus().error).toMatch(/actualisation en attente/));
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ volumeL: 24 }));
    expect(FirestoreRepo.syncStatus().error).toBeNull();
    expect(sdk.callable).toHaveBeenCalledTimes(1);
  });

  it('reattaches a failed listener on focus, without restarting healthy collections or accepting late callbacks', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const old = sdk.listeners.get('recipes')!;
    old.error({ code: 'unavailable', message: 'interrupted' });
    sdk.attachments.mockClear();
    window.dispatchEvent(new Event('focus'));
    expect(sdk.attachments.mock.calls).toEqual([['recipes']]);
    emit({ ...record, name: 'Actualisé' });
    old.next({ docs: [], metadata: { fromCache: false, hasPendingWrites: false } });
    expect(FirestoreRepo.find('recipes', record.id)).toMatchObject({ name: 'Actualisé' });
    window.dispatchEvent(new Event('focus'));
    expect(sdk.attachments).toHaveBeenCalledTimes(1);
    expect(FirestoreRepo.isReady()).toBe(true);
  });

  it('drops delayed snapshots and readback results after logout, including after a new session starts', async () => {
    const pending = deferred<any>();
    sdk.read.mockReturnValue(pending.promise);
    const refresh = FirestoreRepo.refreshDocument('recipes', record.id);
    await Promise.resolve();
    const old = sdk.listeners.get('recipes')!;
    FirestoreRepo.stopSync();
    FirestoreRepo.startSync();
    old.next({ docs: [documentSnapshot(record)], metadata: { fromCache: false, hasPendingWrites: false } });
    pending.resolve(documentSnapshot(record));
    expect(await refresh).toBe(false);
    expect(FirestoreRepo.all('recipes')).toEqual([]);
    expect(sdk.listeners.size).toBe(LIVE_COLLECTIONS.length);
  });
});
