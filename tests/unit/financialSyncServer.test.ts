import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => {
  let clock = Date.now();
  class Stamp {
    constructor(public millis: number) {}
    get seconds() { return Math.floor(this.millis / 1000); }
    get nanoseconds() { return (this.millis % 1000) * 1000000; }
    toMillis() { return this.millis; }
    toDate() { return new Date(this.millis); }
    static now() { return new Stamp(++clock); }
    static fromMillis(millis: number) { return new Stamp(millis); }
    static fromDate(date: Date) { return new Stamp(date.getTime()); }
  }
  const docs = new Map<string, any>(), versions = new Map<string, Stamp>(), snapshots = new Map<number, { docs: Map<string, any>; versions: Map<string, Stamp> }>();
  const writes: string[] = [], reads: string[] = [];
  const clone = (value: any): any => value instanceof Stamp ? new Stamp(value.millis) : Array.isArray(value) ? value.map(clone) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, data]) => [key, clone(data)])) : value;
  const current = () => ({ docs: new Map([...docs].map(([key, data]) => [key, clone(data)])), versions: new Map(versions) });
  const snapshot = (path: string, source = current()): any => ({ id: path.split('/').at(-1), exists: source.docs.has(path), data: () => clone(source.docs.get(path)), updateTime: source.versions.get(path), ref: ref(path) });
  const seed = (path: string, data: any, at = Stamp.now()) => { docs.set(path, clone(data)); versions.set(path, at); };
  const ref = (path: string): any => ({ path, id: path.split('/').at(-1), get: async () => snapshot(path), create: async (value: any) => { if (docs.has(path)) throw Error('exists'); seed(path, value); } });
  const query = (path: string, config: any = {}): any => ({ path, query: true,
    orderBy: () => query(path, config), limit: (count: number) => query(path, { ...config, count }), startAfter: (after: string) => query(path, { ...config, after }),
    where: (field: string, op: string, value: any) => query(path, { ...config, filters: [...(config.filters ?? []), { field, op, value }] }),
    read: (source: ReturnType<typeof current>, time: Stamp) => {
      const items = [...source.docs.keys()].filter(key => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/')).sort()
        .filter(key => (!config.after || key.slice(path.length + 1) > config.after) && (config.filters ?? []).every((filter: any) => {
          const value = source.docs.get(key)[filter.field];
          return filter.op === '==' ? value === filter.value : filter.op === '>' ? value > filter.value : filter.op === '<=' ? value?.toMillis() <= filter.value.toMillis() : false;
        })).slice(0, config.count ?? Infinity).map(key => snapshot(key, source));
      return { docs: items, size: items.length, empty: !items.length, readTime: time };
    }, get: async () => query(path, config).read(current(), Stamp.now()) });
  const db = () => ({ doc: ref, collection: query,
    batch: () => { const deleted: string[] = []; return { delete: (document: any) => deleted.push(document.path), commit: async () => { deleted.forEach(path => { docs.delete(path); versions.delete(path); writes.push(path); }); } }; },
    runTransaction: async (handler: any, options: any = {}) => {
      const at = options.readTime ?? Stamp.now(), source = options.readTime ? snapshots.get(at.toMillis())! : current();
      if (options.readOnly && !options.readTime) snapshots.set(at.toMillis(), source);
      const pending: { path: string; value: any }[] = [];
      const result = await handler({ get: async (target: any) => { reads.push(target.path); return target.query ? target.read(source, at) : snapshot(target.path, source); },
        getAll: async (...targets: any[]) => targets.map(target => { reads.push(target.path); return snapshot(target.path, source); }),
        set: (target: any, value: any) => pending.push({ path: target.path, value }), create: (target: any, value: any) => { if (source.docs.has(target.path)) throw Error('exists'); pending.push({ path: target.path, value }); } });
      if (options.readOnly && pending.length) throw Error('read-only');
      pending.forEach(entry => { seed(entry.path, entry.value, at); writes.push(entry.path); }); return result;
    }
  });
  return { Stamp, docs, versions, snapshots, writes, reads, seed, snapshot, db };
});
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({ Timestamp: mock.Stamp, FieldPath: { documentId: () => '__name__' }, getFirestore: mock.db }));
import { syncFinancialLedger, recordFinancialChange, cleanupFinancialSync } from '../../functions/src/financialSync';
const request = (data: any, uid = 'brewer') => ({ data, auth: { uid, token: { email: 'brewer@example.test', email_verified: true } } });
const call = (data: any, uid?: string): Promise<any> => syncFinancialLedger.run(request(data, uid) as any);
const event = (path: string, before: any = null, at = mock.Stamp.now()) => ({ params: { documentId: path.split('/')[1] }, time: at.toDate().toISOString(), data: { before: { data: () => before }, after: { ...mock.snapshot(path), updateTime: at } } });
beforeEach(() => { mock.docs.clear(); mock.versions.clear(); mock.snapshots.clear(); mock.writes.length = 0; mock.reads.length = 0; vi.stubEnv('AUTHORIZED_ACCOUNTS', 'brewer@example.test'); });
afterEach(() => vi.unstubAllEnvs());

describe('Synchronisation serveur du registre comptable, sans copies des originaux', () => {
  it('lit toutes les pages transactions/paiements au même instant, malgré des écritures concurrentes', async () => {
    for (let i = 0; i < 125; i++) mock.seed(`transactions/T${String(i).padStart(3, '0')}`, { id: `T${String(i).padStart(3, '0')}`, amount: i });
    for (let i = 0; i < 115; i++) mock.seed(`financialPayments/P${String(i).padStart(3, '0')}`, { id: `P${String(i).padStart(3, '0')}`, amount: i });
    const start = await call({ action: 'start' }), rows = []; let collectionIndex = 0, afterId = null;
    for (let pageIndex = 0; pageIndex < 10; pageIndex++) {
      const input = { action: 'page', sessionId: start.sessionId, pageIndex, collectionIndex, afterId };
      const page = await call(input); expect(page.rows.length).toBeLessThanOrEqual(100); expect(page.asOf).toBe(start.asOf);
      if (!pageIndex) {
        mock.seed('transactions/T124', { id: 'T124', amount: 999 }); mock.seed('transactions/T999', { id: 'T999' });
        expect(await call(input)).toEqual(page);
      }
      rows.push(...page.rows); if (page.done) break; collectionIndex = page.nextCollectionIndex; afterId = page.nextAfterId;
    }
    expect(rows).toHaveLength(240); expect(rows.find(row => row.id === 'T124').data.amount).toBe(124); expect(rows.some(row => row.id === 'T999')).toBe(false);
  });
  it('déduplique les livraisons de trigger et ignore une version arrivée en retard', async () => {
    mock.seed('transactions/T1', { id: 'T1', proofUrl: 'data:application/pdf;base64,large-private-original' });
    const first = event('transactions/T1', null, mock.Stamp.fromMillis(2000)); await recordFinancialChange('transactions', first);
    await recordFinancialChange('transactions', first); await recordFinancialChange('transactions', event('transactions/T1', null, mock.Stamp.fromMillis(1000)));
    expect(mock.docs.get('financialSync/state').revision).toBe(1);
    const events = [...mock.docs.entries()].filter(([key]) => key.startsWith('financialSyncEvents/'));
    expect(events).toHaveLength(1); expect(JSON.stringify(events)).not.toContain('private-original'); expect(JSON.stringify(events)).not.toContain('proofUrl');
    await recordFinancialChange('transactions', event('transactions/T1', null, mock.Stamp.fromMillis(3000)));
    expect(mock.docs.get('financialSync/state').revision).toBe(2);
  });
  it('renvoie le règlement et sa transaction ensemble même si le deuxième trigger est retardé', async () => {
    mock.seed('transactions/T1', { id: 'T1', settlementBalanceCents: 10000, lastPaymentId: 'P1' });
    mock.seed('financialPayments/P1', { id: 'P1', transactionId: 'T1', amountCents: 10000 });
    await recordFinancialChange('transactions', event('transactions/T1'));
    const result = await call({ action: 'delta', cursor: 0 });
    expect(result).toMatchObject({ cursor: 1, done: true });
    expect(result.rows).toEqual(expect.arrayContaining([expect.objectContaining({ collection: 'transactions', id: 'T1', data: expect.objectContaining({ settlementBalanceCents: 10000 }) }), expect.objectContaining({ collection: 'financialPayments', id: 'P1', data: expect.objectContaining({ amountCents: 10000 }) })]));
    expect(mock.writes.filter(path => path.startsWith('transactions/') || path.startsWith('financialPayments/'))).toEqual([]);
  });
  it('ne perd pas une suppression intervenue dans la même milliseconde que la dernière écriture', async () => {
    mock.seed('transactions/T1', { id: 'T1' });
    await recordFinancialChange('transactions', { ...event('transactions/T1'), data: { before: { data: () => null }, after: { ...mock.snapshot('transactions/T1'), updateTime: { seconds: 1, nanoseconds: 123456789 } } } });
    mock.docs.delete('transactions/T1');
    await recordFinancialChange('transactions', { params: { documentId: 'T1' }, time: '1970-01-01T00:00:01.123456790Z', data: { before: { data: () => ({ id: 'T1' }) }, after: { data: () => undefined } } });
    expect(mock.docs.get('financialSync/state').revision).toBe(2);
    expect((await call({ action: 'delta', cursor: 1 })).rows).toContainEqual(expect.objectContaining({ collection: 'transactions', id: 'T1', data: null }));
  });
  it('ne relit pas les anciennes pièces quand la révision est inchangée', async () => {
    mock.seed('financialSync/state', { revision: 42 }); mock.seed('transactions/OLD', { id: 'OLD' }); mock.reads.length = 0;
    expect(await call({ action: 'delta', cursor: 42 })).toMatchObject({ rows: [], cursor: 42, done: true });
    expect(mock.reads).toEqual(['financialSync/state', 'financialSyncEvents']);
  });
  it('impose un nouveau bootstrap si un événement manque ou si le curseur vient d’une autre génération', async () => {
    mock.seed('financialSync/state', { revision: 50 });
    expect(await call({ action: 'delta', cursor: 1 })).toMatchObject({ reset: true });
    expect(await call({ action: 'delta', cursor: 90 })).toMatchObject({ reset: true });
    mock.seed('financialSyncEvents/0000000000000002', { revision: 2, collection: 'transactions', documentId: 'T1' });
    expect(await call({ action: 'delta', cursor: 0 })).toMatchObject({ reset: true });
  });
  it('refuse une session étrangère/expirée et les appels sans authentification', async () => {
    const start = await call({ action: 'start' });
    await expect(call({ action: 'page', sessionId: start.sessionId, pageIndex: 0 }, 'other')).rejects.toMatchObject({ code: 'failed-precondition' });
    mock.docs.get(`financialSyncSessions/${start.sessionId}`).expiresAt = mock.Stamp.fromMillis(0);
    await expect(call({ action: 'page', sessionId: start.sessionId, pageIndex: 0 })).rejects.toMatchObject({ code: 'failed-precondition' });
    await expect(syncFinancialLedger.run({ data: { action: 'start' } } as any)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(call({ action: 'delta', cursor: -1 })).rejects.toMatchObject({ code: 'invalid-argument' });
  });
  it('le nettoyage touche uniquement les métadonnées temporaires expirées', async () => {
    mock.seed('transactions/T1', { id: 'T1' }); mock.seed('financialSyncEvents/old', { expiresAt: mock.Stamp.fromMillis(0) }); mock.seed('financialSyncSessions/old', { expiresAt: mock.Stamp.fromMillis(0) });
    mock.seed('financialSyncEvents/new', { expiresAt: mock.Stamp.fromMillis(Date.now() + 86400000) });
    await cleanupFinancialSync.run({} as any);
    expect(mock.docs.has('transactions/T1')).toBe(true); expect(mock.docs.has('financialSyncEvents/new')).toBe(true);
    expect(mock.docs.has('financialSyncEvents/old')).toBe(false); expect(mock.docs.has('financialSyncSessions/old')).toBe(false);
  });
});
