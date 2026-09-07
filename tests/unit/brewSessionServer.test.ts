import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  docs: new Map<string, any>(),
  enqueued: [] as any[],
  send: vi.fn()
}));
function patch(path: string, data: any) {
  const current = { ...mock.docs.get(path) };
  for (const [key, value] of Object.entries(data)) {
    const parts = key.split('.');
    if (parts.length === 2) current[parts[0]] = { ...current[parts[0]], [parts[1]]: value };
    else current[key] = value;
  }
  mock.docs.set(path, current);
}
function doc(path: string): any {
  return {
    path,
    id: path.split('/').pop(),
    get: async () => ({
      exists: mock.docs.has(path),
      data: () => structuredClone(mock.docs.get(path))
    }),
    set: async (d: any, opts: any) => (opts?.merge ? patch(path, d) : mock.docs.set(path, d)),
    update: async (d: any) => patch(path, d)
  };
}
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  Timestamp: { now: () => Date.now(), fromMillis: (n: number) => n },
  getFirestore: () => ({
    doc,
    runTransaction: async (fn: any) =>
      fn({
        get: (r: any) => r.get(),
        update: (r: any, d: any) => patch(r.path, d),
        create: (r: any, d: any) => {
          if (mock.docs.has(r.path)) throw Error('exists');
          mock.docs.set(r.path, d);
        }
      })
  })
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/functions/index.js', () => ({
  getFunctions: () => ({
    taskQueue: () => ({
      enqueue: async (data: any, options: any) => mock.enqueued.push({ data, options })
    })
  })
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/messaging/index.js', () => ({
  getMessaging: () => ({ send: mock.send })
}));
vi.mock('../../functions/node_modules/web-push/src/index.js', () => ({
  default: {
    generateVAPIDKeys: () => ({
      publicKey: 'public-key',
      privateKey: 'private-key'
    }),
    sendNotification: mock.send
  }
}));
import { saveBrewSession, getBrewSession } from '../../functions/src/brewSession';
import {
  getBrewAlertConfig,
  registerBrewDevice,
  scheduleDevice,
  validateSubscription
} from '../../functions/src/brewPush';
import { deliverBrewAlarm } from '../../functions/src/brewAlarms';
const now = Date.UTC(2026, 8, 7, 10);
const state = () => ({
  steps: [{ id: 'mash-0', label: 'Empâtage', durationMin: 60, startedAt: now }],
  currentIndex: 0
});
const auth = {
  uid: 'brewer',
  token: { email: 'brewer@example.test', email_verified: true }
};
const request = (data: any) => ({ auth, data });
const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/example',
  keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) }
};
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mock.docs.clear();
  mock.enqueued = [];
  vi.spyOn(Date, 'now').mockReturnValue(now);
  vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test');
  mock.docs.set('batches/LOT', { brewDay: state() });
  mock.send.mockResolvedValue({ statusCode: 201 });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('Enregistrement du journal côté serveur', () => {
  it('authentifie les lectures et écritures', async () => {
    await expect((getBrewSession as any).run({ data: { batchId: 'LOT' } })).rejects.toThrow();
    await expect(
      (saveBrewSession as any).run({
        auth: { ...auth, token: { ...auth.token, email_verified: false } },
        data: {}
      })
    ).rejects.toThrow();
    const res = await (getBrewSession as any).run(request({ batchId: 'LOT' }));
    expect(res.serverNow).toBe(now);
  });
  it('un retry après réponse perdue ne duplique pas la révision, et un autre appareil crée un conflit explicite', async () => {
    const data = {
      batchId: 'LOT',
      operationId: 'op-one',
      baseRevision: 0,
      clientNow: now,
      state: state()
    };
    expect((await (saveBrewSession as any).run(request(data))).state.revision).toBe(1);
    expect((await (saveBrewSession as any).run(request(data))).state.revision).toBe(1);
    await expect(
      (saveBrewSession as any).run(request({ ...data, operationId: 'stale' }))
    ).rejects.toThrow(/autre appareil/);
    await (saveBrewSession as any).run(
      request({ ...data, operationId: 'other-device', baseRevision: 1 })
    );
    await expect((saveBrewSession as any).run(request(data))).rejects.toThrow(/réussi/);
    expect(mock.docs.get('batches/LOT').brewDay.revision).toBe(2);
  });
  it('conserve l’heure d’un événement resté dans la file hors ligne', async () => {
    const s = state();
    s.steps[0].startedAt = now - 3600000;
    const res = await (saveBrewSession as any).run(
      request({
        batchId: 'LOT',
        operationId: 'offline',
        baseRevision: 0,
        clientNow: now,
        state: s
      })
    );
    expect(res.state.steps[0].startedAt).toBe(now - 3600000);
  });
});
describe('Web Push natif : clé stable, programmation canonique et livraisons périmées', () => {
  it('ne divulgue jamais la clé privée et refuse les endpoints externes arbitraires', async () => {
    expect(await (getBrewAlertConfig as any).run(request({}))).toEqual({
      publicKey: 'public-key'
    });
    expect(await (getBrewAlertConfig as any).run(request({}))).toEqual({
      publicKey: 'public-key'
    });
    for (const endpoint of [
      'http://localhost',
      'https://evil.test/send',
      'https://fcm.googleapis.com.evil.test/send'
    ])
      expect(() => validateSubscription({ ...subscription, endpoint })).toThrow();
  });
  it('ignore les horaires proposés par le client, déduplique et reprogramme après une pause', async () => {
    const res = await (registerBrewDevice as any).run(
      request({
        batchId: 'LOT',
        subscription,
        events: [{ at: now + 100 }],
        enabled: true
      })
    );
    expect(res.synced).toBe(true);
    expect(mock.enqueued).toHaveLength(1);
    expect(mock.enqueued[0].options.scheduleTime.getTime()).toBe(now + 3600000);
    await (registerBrewDevice as any).run(request({ batchId: 'LOT', subscription, enabled: true }));
    expect(mock.enqueued).toHaveLength(1);
    const old = mock.enqueued[0].data,
      s = { ...state(), revision: 1 };
    s.steps[0] = { ...s.steps[0], pausedAt: now + 1000 } as any;
    mock.docs.set('batches/LOT', { brewDay: s });
    await scheduleDevice(old.docId, { brewDay: s }, 1);
    vi.mocked(Date.now).mockReturnValue(now + 3600000);
    await (deliverBrewAlarm as any).run({ data: old });
    expect(mock.send).not.toHaveBeenCalled();
  });
  it('envoie un test natif chiffré par web-push et ignore une seconde livraison du même événement', async () => {
    await (registerBrewDevice as any).run(
      request({ batchId: 'LOT', subscription, enabled: true, test: true })
    );
    const task = mock.enqueued.find((t) => t.data.eventId.startsWith('test-'));
    vi.mocked(Date.now).mockReturnValue(now + 10000);
    await (deliverBrewAlarm as any).run({ data: task.data });
    await (deliverBrewAlarm as any).run({ data: task.data });
    expect(mock.send).toHaveBeenCalledTimes(1);
    expect(mock.send).toHaveBeenCalledWith(
      subscription,
      expect.stringContaining('Test de brassage'),
      expect.objectContaining({ TTL: 300, urgency: 'high' })
    );
  });
  it('désactive un abonnement expiré et refuse les alertes d’un journal clôturé', async () => {
    await (registerBrewDevice as any).run(request({ batchId: 'LOT', subscription, enabled: true }));
    const task = mock.enqueued[0];
    vi.mocked(Date.now).mockReturnValue(now + 3600000);
    mock.send.mockRejectedValueOnce({ statusCode: 410 });
    await (deliverBrewAlarm as any).run({ data: task.data });
    expect(mock.docs.get(`brewAlarmDevices/${task.data.docId}`).enabled).toBe(false);
    mock.docs.set('batches/LOT', { brewDay: { ...state(), finishedAt: now } });
    await (deliverBrewAlarm as any).run({ data: task.data });
    expect(mock.send).toHaveBeenCalledTimes(1);
  });
});
