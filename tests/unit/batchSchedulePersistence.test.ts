import { beforeEach, expect, it, vi } from 'vitest';
import type { Batch } from '../../src/types';

const db = vi.hoisted(() => ({ currentUser: { uid: 'brewer' } as { uid: string } | null, batch: {} as Batch, exists: true, update: vi.fn() }));
vi.mock('../../src/services/firebase', () => ({ auth: db, db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  runTransaction: async (_db: unknown, action: (transaction: unknown) => unknown) => action({
    get: async () => ({ exists: () => db.exists, data: () => structuredClone(db.batch) }), update: db.update
  })
}));
import { saveBatchSchedule } from '../../src/services/batchSchedule';

const prepared = (): Batch => ({ id: 'LOT-1', name: 'Pale', style: 'Pale Ale', volumeL: 20, status: 'planifie', brewDate: '', plannedBrewDate: '27.09.2026' });
beforeEach(() => { db.currentUser = { uid: 'brewer' }; db.batch = prepared(); db.exists = true; db.update.mockReset(); });

it('updates only the two dates and retains the current server data', async () => {
  const stale = prepared(), local = vi.fn(); db.batch.name = 'Nom corrigé ailleurs';
  const saved = await saveBatchSchedule(stale, '28.09.2026', local);
  expect(db.update).toHaveBeenCalledWith('batches/LOT-1', { plannedBrewDate: '28.09.2026', brewDate: '' });
  expect(saved.name).toBe('Nom corrigé ailleurs'); expect(local).not.toHaveBeenCalled();
});
it.each(['planifie', 'fermentation'] as const)('rejects a stale edit after a brew has started (%s)', async status => {
  const stale = prepared(); db.batch = { ...prepared(), status, brewDate: '20.09.2026' };
  await expect(saveBatchSchedule(stale, '', vi.fn())).rejects.toThrow('commencé');
  expect(db.update).not.toHaveBeenCalled(); expect(db.batch.brewDate).toBe('20.09.2026');
});
it('rejects deleted batches instead of recreating them', async () => {
  db.exists = false; await expect(saveBatchSchedule(prepared(), '', vi.fn())).rejects.toThrow('n’existe plus');
  expect(db.update).not.toHaveBeenCalled();
});
it('retains the local test/preview save path without a remote write', async () => {
  db.currentUser = null; const local = vi.fn();
  await saveBatchSchedule(prepared(), '', local);
  expect(local).toHaveBeenCalledWith(expect.objectContaining({ plannedBrewDate: '', brewDate: '' }));
  expect(db.update).not.toHaveBeenCalled();
});
