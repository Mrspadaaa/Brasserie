import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const mock = vi.hoisted(() => ({ call: vi.fn(), waitForDocument: vi.fn() }));
vi.mock('../../src/services/firebase', () => ({
  auth: { currentUser: { uid: 'server-test' } },
  functions: {}
}));
vi.mock('firebase/functions', () => ({
  httpsCallable: (_f: any, name: string) => (data: any) => mock.call(name, data)
}));
// The journal uses a strict document acknowledgement before calling its server.
// Model that network boundary explicitly; these hook tests never initialize Firestore.
vi.mock('../../src/services/firestoreRepo', () => ({
  FirestoreRepo: { waitForDocument: mock.waitForDocument }
}));
vi.mock('../../src/services/brewClock', () => ({
  brewNow: () => Date.now(),
  setBrewClock: vi.fn()
}));
import { useBrewSession } from '../../src/ui/useBrewSession';
import { brewState } from '../fixtures/brewCompanion';
import { Batch } from '../../src/types';
const batch = () =>
  ({
    id: 'LOT-SERVER',
    brewDay: brewState(undefined, { revision: 2 })
  }) as Batch;
beforeEach(() => {
  localStorage.clear();
  mock.call.mockReset();
  mock.waitForDocument.mockReset().mockResolvedValue({ id: 'LOT-SERVER' });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function useMockLocks() {
  let held = false;
  const queued: Array<() => void> = [];
  vi.stubGlobal('navigator', {
    locks: {
      request: (_name: string, options: any, callback: any) =>
        new Promise<void>((resolve, reject) => {
          const acquire = async () => {
            if (options.signal?.aborted) {
              reject(new DOMException('Aborted', 'AbortError'));
              queued.shift()?.();
              return;
            }
            held = true;
            try {
              await callback({ name: _name });
              resolve();
            } catch (e) {
              reject(e);
            } finally {
              held = false;
              queued.shift()?.();
            }
          };
          if (held) queued.push(acquire);
          else void acquire();
        })
    }
  });
}
describe('Journal navigateur : file persistante et conflits', () => {
  it('attend la confirmation du brassin avant de charger le journal ou autoriser la saisie', async () => {
    const b = batch();
    let confirm: () => void = () => {};
    mock.waitForDocument.mockImplementation(() => new Promise(resolve => { confirm = () => resolve({ id: b.id }); }));
    mock.call.mockResolvedValue({ data: { state: b.brewDay, serverNow: Date.now() } });
    const view = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(mock.waitForDocument).toHaveBeenCalledWith('batches', b.id));
    expect(view.result.current.canStart).toBe(false);
    expect(mock.call).not.toHaveBeenCalled();
    act(() => view.result.current.update(s => ({ ...s, currentIndex: 4 })));
    expect(view.result.current.state.currentIndex).toBe(0);
    await act(async () => confirm());
    await waitFor(() => expect(view.result.current.canStart).toBe(true));
    expect(mock.call).toHaveBeenCalledWith('getBrewSession', { batchId: b.id });
  });
  it('garde la confirmation refusée visible et reprend après une confirmation serveur réussie', async () => {
    const b = batch();
    mock.waitForDocument.mockRejectedValueOnce(new Error('Création du brassin refusée'));
    mock.call.mockResolvedValue({ data: { state: b.brewDay, serverNow: Date.now() } });
    const view = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(view.result.current.error).toBe('Création du brassin refusée'));
    expect(view.result.current.canStart).toBe(false);
    expect(mock.call).not.toHaveBeenCalled();
    await act(async () => { await view.result.current.retry(); });
    await waitFor(() => expect(view.result.current.canStart).toBe(true));
    expect(view.result.current.error).toBe('');
  });
  it('deux onglets du même appareil ne peuvent pas écraser leur file locale', async () => {
    useMockLocks();
    let server = batch().brewDay!;
    mock.call.mockImplementation(async (name, data) => {
      if (name === 'saveBrewSession') server = { ...data.state, revision: 3 };
      return { data: { state: server, serverNow: Date.now() } };
    });
    const b = batch();
    const first = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(first.result.current.canStart).toBe(true));
    const second = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(second.result.current.error).toContain('autre onglet'));
    act(() => second.result.current.update((s) => ({ ...s, currentIndex: 4 })));
    expect(second.result.current.state.currentIndex).toBe(0);
    expect(mock.call.mock.calls.filter((c) => c[0] === 'saveBrewSession')).toHaveLength(0);
    first.unmount();
    await waitFor(() => expect(second.result.current.canStart).toBe(true));
    act(() => second.result.current.update((s) => ({ ...s, currentIndex: 4 })));
    await waitFor(() => expect(second.result.current.state.revision).toBe(3));
  });
  it('le double montage React ne conserve pas une réservation abandonnée', async () => {
    useMockLocks();
    const b = batch();
    mock.call.mockResolvedValue({ data: { state: b.brewDay, serverNow: Date.now() } });
    const view = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()), {
      wrapper: React.StrictMode
    });
    await waitFor(() => expect(view.result.current.canStart).toBe(true));
    expect(view.result.current.error).toBe('');
  });
  it('envoie deux changements dans l’ordre, en utilisant la révision confirmée pour le second', async () => {
    let release: (v: any) => void = () => {};
    mock.call.mockImplementation((name, data) =>
      name === 'getBrewSession'
        ? Promise.resolve({
            data: { state: batch().brewDay, serverNow: Date.now() }
          })
        : new Promise((resolve) => {
            release = () =>
              resolve({
                data: {
                  state: {
                    ...data.state,
                    startedAt: 1234567891500,
                    revision: data.baseRevision + 1
                  },
                  serverNow: Date.now()
                }
              });
          })
    );
    const saved = vi.fn();
    const b = batch();
    const { result } = renderHook(() => useBrewSession(b, () => b.brewDay!, saved));
    await waitFor(() => expect(result.current.canStart).toBe(true));
    act(() => result.current.update((s) => ({ ...s, currentIndex: 1, startedAt: 1234567890000 })));
    act(() => result.current.update((s) => ({ ...s, currentIndex: 2 })));
    expect(mock.call.mock.calls.filter((c) => c[0] === 'saveBrewSession')).toHaveLength(1);
    await act(async () => release({}));
    await waitFor(() =>
      expect(mock.call.mock.calls.filter((c) => c[0] === 'saveBrewSession')).toHaveLength(2)
    );
    expect(mock.call.mock.calls.filter((c) => c[0] === 'saveBrewSession')[1][1].baseRevision).toBe(
      3
    );
    expect(
      mock.call.mock.calls.filter((c) => c[0] === 'saveBrewSession')[1][1].state.startedAt
    ).toBe(1234567891500);
    await act(async () => release({}));
    expect(result.current.state.currentIndex).toBe(2);
    expect(result.current.state.revision).toBe(4);
    expect(result.current.pending).toBe(false);
    expect(saved).not.toHaveBeenCalled();
    expect(localStorage.getItem('brew-outbox-server-test-LOT-SERVER')).toBeNull();
  });
  it('survit au rechargement hors ligne et rejoue le même identifiant après réponse perdue', async () => {
    const b = batch();
    let online = false;
    let committed: any;
    mock.call.mockImplementation(async (name, data) => {
      if (name === 'getBrewSession')
        return {
          data: { state: committed ?? b.brewDay, serverNow: Date.now() }
        };
      committed = { ...data.state, revision: 3 };
      if (!online) throw Error('réseau coupé');
      return { data: { state: committed, serverNow: Date.now() } };
    });
    const first = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(first.result.current.canStart).toBe(true));
    act(() => first.result.current.update((s) => ({ ...s, currentIndex: 3 })));
    await waitFor(() => expect(first.result.current.status).toBe('À synchroniser'));
    const sent = mock.call.mock.calls.find((c) => c[0] === 'saveBrewSession')![1];
    first.unmount();
    online = true;
    const second = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(second.result.current.state.revision).toBe(3));
    const calls = mock.call.mock.calls.filter((c) => c[0] === 'saveBrewSession');
    expect(calls).toHaveLength(2);
    expect(calls[1][1].operationId).toBe(sent.operationId);
    expect(calls[1][1].baseRevision).toBe(2);
    expect(second.result.current.state.currentIndex).toBe(3);
    expect(second.result.current.pending).toBe(false);
  });
  it('un conflit reste visible et le chargement serveur conserve une copie du brouillon', async () => {
    const b = batch();
    mock.call.mockImplementation(async (name) => {
      if (name === 'getBrewSession') return { data: { state: b.brewDay, serverNow: Date.now() } };
      throw Error('autre appareil');
    });
    const { result } = renderHook(() => useBrewSession(b, () => b.brewDay!, vi.fn()));
    await waitFor(() => expect(result.current.canStart).toBe(true));
    act(() => result.current.update((s) => ({ ...s, currentIndex: 4 })));
    await waitFor(() => expect(result.current.error).toContain('autre appareil'));
    expect(result.current.state.currentIndex).toBe(4);
    await act(async () => {
      expect(await result.current.flush()).toBe(false);
    });
    await act(async () => result.current.reload());
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.pending).toBe(false);
    expect(
      JSON.parse(localStorage.getItem('brew-outbox-server-test-LOT-SERVER-conflict-backup')!)[0]
        .state.currentIndex
    ).toBe(4);
  });
});
