// @vitest-environment jsdom
/**
 * BD-1 (24.11, 19:30 ; déjà CFP-8, L-49, CA12-M2-12, CA13-5) : l'avis « Enregistrement sur le serveur… » restait des minutes et se posait
 * sur les onglets. Règles :
 *  1. il n'apparaît que pendant une écriture réelle de CET appareil (file, envoi, écriture non confirmée), jamais pour l'écho d'un
 *     instantané (`hasPendingWrites` d'une collection ou d'un document), qui peut durer tant que le flux d'écoute n'a rien livré ;
 *  2. il part à la fin de l'écriture, ou il dit l'échec ;
 *  3. il ne recouvre jamais un contrôle ni du contenu : jamais posé en haut (le haut porte l'en-tête, les onglets, les sous-onglets,
 *     que la mesure unique de `header` ne voyait pas) ; une petite pastille en bas, à gauche, au-dessus de la barre du bas, qui ne prend
 *     aucun toucher (sauf « Actualiser »).
 * Aucun réseau réel : le SDK est simulé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

const sdk = vi.hoisted(() => ({
  listeners: new Map<string, { next: (snap: any) => void; error: (error: any) => void }>(),
  commit: vi.fn()
}));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/services/financialLedgerSync', () => ({ startFinancialLedgerSync: async (callbacks: any) => {
  callbacks.onData([], { covered: new Set(), requestStartedAt: 0 });
  callbacks.onState({ complete: true, loading: false, fromCache: false, loadedRows: 0 });
  return { refresh: async () => {}, stop: () => {} };
} }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => vi.fn() }));
vi.mock('firebase/firestore', () => ({
  collection: (_: unknown, name: string) => name,
  doc: (_: unknown, name: string, id: string) => ({ name, id }),
  onSnapshot: (name: string, _: unknown, next: any, error: any) => {
    sdk.listeners.set(name, { next, error });
    return () => sdk.listeners.delete(name);
  },
  getDocFromServer: vi.fn(),
  writeBatch: () => ({ set: vi.fn(), delete: vi.fn(), commit: sdk.commit }),
  waitForPendingWrites: async () => {},
  getDocsFromCache: async () => ({ docs: [] }),
  getDocs: vi.fn(), getDocsFromServer: vi.fn(), query: (name: string) => name, limit: vi.fn(), orderBy: vi.fn(), documentId: () => '__name__',
  startAfter: vi.fn(), deleteField: vi.fn(), increment: (n: number) => n
}));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { PersistenceStatus } from '../../src/ui/PersistenceStatus';

const record = { id: 'R-1', name: 'Avant', volumeL: 30 };
function emit(pending = false, fromCache = false) {
  sdk.listeners.get('recipes')!.next({
    metadata: { fromCache, hasPendingWrites: pending },
    docs: [{ id: 'R-1', exists: () => true, data: () => record, metadata: { hasPendingWrites: pending } }]
  });
}
function deferred<T = void>() {
  let resolve!: (value: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((ok, ko) => { resolve = ok; reject = ko; });
  return { promise, resolve, reject };
}
const avis = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-bandeau-persistance]');
const ecouler = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  FirestoreRepo.stopSync();
  sdk.commit.mockReset().mockResolvedValue(undefined);
  FirestoreRepo.startSync();
  for (const listener of sdk.listeners.values()) listener.next({ docs: [], metadata: { fromCache: false, hasPendingWrites: false } });
  emit();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('BD-1 · l’état « écriture en cours » de FirestoreRepo', () => {
  it('writing : vrai de la mise en file à la confirmation du serveur, faux ensuite', async () => {
    const commit = deferred();
    sdk.commit.mockReturnValue(commit.promise);
    expect(FirestoreRepo.syncStatus().writing).toBe(false);
    FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Après' });
    expect(FirestoreRepo.syncStatus().writing).toBe(true);
    await Promise.resolve();
    expect(FirestoreRepo.syncStatus().pendingSources).toContain('envoi');
    expect(FirestoreRepo.syncStatus().writing).toBe(true);
    commit.resolve();
    await vi.waitFor(() => expect(FirestoreRepo.syncStatus().writing).toBe(false));
  });

  it('l’écho d’un instantané « en attente » n’est pas une écriture de cet appareil (writing reste faux, pending dit vrai)', () => {
    emit(true);
    const s = FirestoreRepo.syncStatus();
    expect(s.pending).toBe(true);
    expect(s.writing).toBe(false);
  });

  it('une écriture refusée n’est plus « en cours » : l’échec est dit', async () => {
    sdk.commit.mockRejectedValue(Object.assign(new Error('nope'), { code: 'permission-denied' }));
    FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Refusé' });
    await vi.waitFor(() => expect(FirestoreRepo.syncStatus().error).toMatch(/Enregistrement refusé/));
    expect(FirestoreRepo.syncStatus().writing).toBe(false);
  });
});

describe('BD-1 · l’avis d’enregistrement', () => {
  it('rien à l’écran au repos', async () => {
    const { container } = render(<PersistenceStatus />);
    await ecouler(2000);
    expect(avis(container)).toBeNull();
  });

  it('l’écho « en attente » d’un instantané n’affiche jamais « Enregistrement sur le serveur… » (même après des minutes)', async () => {
    const { container } = render(<PersistenceStatus />);
    await act(async () => { emit(true); });
    await ecouler(5 * 60 * 1000);
    expect(container.textContent ?? '').not.toMatch(/Enregistrement sur le serveur/);
    expect(avis(container)).toBeNull();
  });

  it('pendant une écriture réelle : un avis ; à sa fin : il part', async () => {
    const commit = deferred();
    sdk.commit.mockReturnValue(commit.promise);
    const { container } = render(<PersistenceStatus />);
    await act(async () => { FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Après' }); await Promise.resolve(); });
    await ecouler(1500);
    expect(avis(container)).not.toBeNull();
    expect(avis(container)!.getAttribute('aria-label') ?? avis(container)!.textContent).toMatch(/Enregistrement sur le serveur/);
    await act(async () => { commit.resolve(); await commit.promise; });
    await ecouler(1500);
    expect(avis(container)).toBeNull();
  });

  it('une écriture instantanée ne fait pas clignoter l’écran (pas d’avis avant un court délai)', async () => {
    const commit = deferred();
    sdk.commit.mockReturnValue(commit.promise);
    const { container } = render(<PersistenceStatus />);
    await act(async () => { FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Vite' }); await Promise.resolve(); });
    expect(avis(container)).toBeNull();
    await act(async () => { commit.resolve(); await commit.promise; });
    await ecouler(1500);
    expect(avis(container)).toBeNull();
  });

  it('un refus du serveur est dit en toutes lettres et reste (jamais un avis muet)', async () => {
    sdk.commit.mockRejectedValue(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }));
    const { container } = render(<PersistenceStatus />);
    await act(async () => { FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Refusé' }); await Promise.resolve(); });
    await ecouler(1500);
    expect(avis(container)!.textContent).toMatch(/Enregistrement refusé/);
  });

  it('ne recouvre rien : jamais posé en haut (ni top, ni mesure de l’en-tête), toujours en bas et sans prise de toucher', async () => {
    const entete = document.createElement('header');
    entete.getBoundingClientRect = () => ({ top: 0, bottom: 56, height: 56, left: 0, right: 390, width: 390, x: 0, y: 0, toJSON: () => ({}) });
    document.body.prepend(entete);
    const commit = deferred();
    sdk.commit.mockReturnValue(commit.promise);
    const { container } = render(<PersistenceStatus />);
    await act(async () => { FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Après' }); await Promise.resolve(); });
    await ecouler(1500);
    const el = avis(container)!;
    expect(el).not.toBeNull();
    expect(el.style.top).toBe('');
    expect(el.className).not.toMatch(/(^|\s)(min-\[[^\]]+\]:)?top-/);
    expect(el.style.bottom).toMatch(/px$/);
    expect(el.className).toMatch(/pointer-events-none/);
    expect(el.className).not.toMatch(/-translate-x-1\/2/);
    entete.remove();
  });

  it('ne se cache pas sous le message passager du même coin : il se pose au-dessus', async () => {
    const toast = document.createElement('div');
    toast.setAttribute('data-toast', '');
    toast.getBoundingClientRect = () => ({ top: window.innerHeight - 90, bottom: window.innerHeight - 56, height: 34, left: 8, right: 300, width: 292, x: 8, y: 0, toJSON: () => ({}) });
    document.body.append(toast);
    sdk.commit.mockRejectedValue(Object.assign(new Error('x'), { code: 'permission-denied' }));
    const { container } = render(<PersistenceStatus />);
    await act(async () => { FirestoreRepo.put('recipes', 'R-1', { ...record, name: 'Refusé' }); await Promise.resolve(); });
    await ecouler(1500);
    expect(parseFloat(avis(container)!.style.bottom)).toBeGreaterThanOrEqual(90);
    toast.remove();
  });
});
