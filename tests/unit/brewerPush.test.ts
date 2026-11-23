import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync('public/brew-alerts-sw.js', 'utf8');
function worker(windows: any[] = []) {
  const handlers: Record<string, (event: any) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined),
    openWindow = vi.fn();
  runInNewContext(source, {
    URL,
    clients: { matchAll: async () => windows, openWindow, claim: vi.fn() },
    self: {
      addEventListener: (name: string, fn: any) => {
        handlers[name] = fn;
      },
      registration: { showNotification },
      location: { origin: 'https://brew.example' },
      skipWaiting: vi.fn()
    }
  });
  const run = async (name: string, value: any) => {
    let promise;
    handlers[name]({
      ...value,
      waitUntil: (p: Promise<unknown>) => {
        promise = p;
      }
    });
    await promise;
  };
  return { run, showNotification, openWindow };
}
describe('Notifications du compagnon et alarmes', () => {
  it('affiche une réponse même sans batchId, avec une vibration discrète', async () => {
    const w = worker();
    await w.run('push', {
      data: {
        json: () => ({
          data: {
            kind: 'companion',
            title: 'Ton compagnon a répondu',
            scopeKind: 'recipe',
            scopeId: 'REC-A',
            at: '123',
            tag: 'question'
          }
        })
      }
    });
    expect(w.showNotification).toHaveBeenCalledWith(
      'Ton compagnon a répondu',
      expect.objectContaining({
        requireInteraction: false,
        vibrate: [150, 80, 150],
        data: { kind: 'companion', scopeKind: 'recipe', scopeId: 'REC-A' }
      })
    );
  });
  it('garde les alarmes de brassage longues et ouvre le brassin', async () => {
    const w = worker();
    await w.run('push', {
      data: { json: () => ({ data: { title: 'Houblon', batchId: 'LOT-A', at: '123' } }) }
    });
    expect(w.showNotification.mock.calls[0][1].vibrate.length).toBeGreaterThan(6);
    await w.run('notificationclick', {
      notification: { close: vi.fn(), data: { batchId: 'LOT-A' } }
    });
    expect(w.openWindow).toHaveBeenCalledWith('https://brew.example/?brewday=LOT-A');
  });
  it('retrouve une réponse dans un onglet existant sans perdre le formulaire en cours', async () => {
    const app = { url: 'https://brew.example/', focus: vi.fn(), postMessage: vi.fn() },
      w = worker([app]);
    await w.run('notificationclick', {
      notification: {
        close: vi.fn(),
        data: { kind: 'companion', scopeKind: 'draft', scopeId: 'DRAFT-A' }
      }
    });
    expect(app.focus).toHaveBeenCalled();
    expect(app.postMessage).toHaveBeenCalledWith({
      kind: 'open-companion',
      scopeKind: 'draft',
      scopeId: 'DRAFT-A'
    });
    expect(w.openWindow).not.toHaveBeenCalled();
  });
  it('ouvre la bonne conversation lorsque le navigateur était fermé', async () => {
    const w = worker();
    await w.run('notificationclick', {
      notification: {
        close: vi.fn(),
        data: { kind: 'companion', scopeKind: 'recipe', scopeId: 'REC-A' }
      }
    });
    expect(w.openWindow).toHaveBeenCalledWith('https://brew.example/?companion=recipe%3AREC-A');
  });
});
