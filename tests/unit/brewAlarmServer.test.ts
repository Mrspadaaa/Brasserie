import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  docs: new Map<string, any>(),
  queued: [] as any[],
  send: vi.fn(),
  enqueue: vi.fn(),
  doc: (path: string) => ({
    path,
    get: async () => ({ exists: mock.docs.has(path), data: () => mock.docs.get(path) }),
    set: async (data: any) => {
      mock.docs.set(path, data);
    }
  })
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  Timestamp: { fromMillis: (n: number) => n },
  getFirestore: () => ({
    doc: mock.doc,
    runTransaction: async (fn: any) =>
      fn({
        get: async (ref: any) => ref.get(),
        update: (ref: any, patch: any) =>
          mock.docs.set(ref.path, { ...mock.docs.get(ref.path), ...patch })
      })
  })
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/functions/index.js', () => ({
  getFunctions: () => ({ taskQueue: () => ({ enqueue: mock.enqueue }) })
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/messaging/index.js', () => ({
  getMessaging: () => ({ send: mock.send })
}));
import { validAlarmEvents, syncBrewAlarms, deliverBrewAlarm } from '../../functions/src/brewAlarms';
const now = Date.UTC(2026, 8, 6, 10);
const event = { id: 'hop-0', at: now + 60000, title: 'Ajout en cuve', body: '20 g Citra' };
const request = (events: any[] = [event]) => ({
  auth: { uid: 'brewer', token: { email: 'brewer@example.test', email_verified: true } },
  data: { batchId: 'LOT', token: 'x'.repeat(150), events }
});
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mock.docs.clear();
  mock.queued = [];
  vi.spyOn(Date, 'now').mockReturnValue(now);
  vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test');
  mock.docs.set('batches/LOT', { brewDay: { steps: [] } });
  mock.enqueue.mockImplementation(async (data, options) => {
    mock.queued.push({ data, options });
  });
  mock.send.mockResolvedValue('message-id');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('Notifications serveur : validation et rappels périmés', () => {
  it('rejette les horaires aberrants, doublons et débordements', () => {
    for (const bad of [
      null,
      [{ ...event, at: Infinity }],
      [{ ...event, at: now - 11000 }],
      [{ ...event, at: now + 49 * 3600000 }],
      [event, event],
      [{ ...event, body: 'x'.repeat(901) }],
      Array(65).fill(event)
    ]) {
      expect(() => validAlarmEvents(bad, now)).toThrow();
    }
    expect(validAlarmEvents([event], now)).toEqual([event]);
    expect(validAlarmEvents([], now)).toEqual([]);
  });
  it('exige un compte autorisé et vérifié, ainsi qu’un brassin existant', async () => {
    for (const req of [
      { data: {} },
      {
        ...request(),
        auth: { uid: 'x', token: { email: 'brewer@example.test', email_verified: false } }
      },
      {
        ...request(),
        auth: { uid: 'x', token: { email: 'stranger@example.test', email_verified: true } }
      },
      { ...request(), data: { ...request().data, batchId: 'missing' } }
    ]) {
      await expect((syncBrewAlarms as any).run(req)).rejects.toThrow();
    }
    expect(mock.enqueue).not.toHaveBeenCalled();
  });
  it('programme l’heure absolue et livre un push court, sans texte de secret', async () => {
    await (syncBrewAlarms as any).run(request());
    expect(mock.queued[0].options.scheduleTime.getTime()).toBe(event.at);
    vi.mocked(Date.now).mockReturnValue(event.at);
    await (deliverBrewAlarm as any).run({ data: mock.queued[0].data });
    expect(mock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ body: '20 g Citra', batchId: 'LOT' }),
        webpush: { headers: { Urgency: 'high', TTL: '300' } }
      })
    );
  });
  it('annuler invalide les tâches déjà en file ; une ancienne révision ne sonne jamais', async () => {
    await (syncBrewAlarms as any).run(request());
    const old = mock.queued[0].data;
    await (syncBrewAlarms as any).run(request([]));
    vi.mocked(Date.now).mockReturnValue(event.at);
    await (deliverBrewAlarm as any).run({ data: old });
    expect(mock.send).not.toHaveBeenCalled();
  });
  it('ignore un rappel vieux de plus de cinq minutes ou un brassin clôturé', async () => {
    await (syncBrewAlarms as any).run(request());
    vi.mocked(Date.now).mockReturnValue(event.at + 300001);
    await (deliverBrewAlarm as any).run({ data: mock.queued[0].data });
    vi.mocked(Date.now).mockReturnValue(event.at);
    mock.docs.set('batches/LOT', { brewDay: { finishedAt: event.at } });
    await (deliverBrewAlarm as any).run({ data: mock.queued[0].data });
    expect(mock.send).not.toHaveBeenCalled();
  });
  it('une mise en file échouée ne laisse pas les vieux horaires actifs', async () => {
    await (syncBrewAlarms as any).run(request());
    const old = mock.queued[0].data;
    mock.enqueue.mockRejectedValueOnce(new Error('queue offline'));
    await expect(
      (syncBrewAlarms as any).run(request([{ ...event, at: event.at + 10000 }]))
    ).rejects.toThrow('queue offline');
    vi.mocked(Date.now).mockReturnValue(event.at);
    await (deliverBrewAlarm as any).run({ data: old });
    expect(mock.send).not.toHaveBeenCalled();
  });
});
