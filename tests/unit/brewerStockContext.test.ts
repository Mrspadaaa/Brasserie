import { describe, expect, it, vi } from 'vitest';
import { readBrewerStockSnapshot } from '../../functions/src/brewerStockContext';
import { STOCK_FIELDS, BATCH_FIELDS, pick } from '../../functions/src/brewerContext';
import { prepareBrewingStockAvailability } from '../../src/domain/brewingStockAvailability';

function store(size = 1, hasLedger = true) {
  const before = { mass: 100, pending: 20 }, after = { mass: 80, pending: 0 };
  let current = before;
  const calls: any[] = [];
  const forbidden = () => { throw Error('Lecture hors snapshot de transaction.'); };
  const reference = (path: string, limit?: number): any => ({ path, limit, get: forbidden });
  const db = {
    collection: (path: string) => ({ limit: (count: number) => reference(path, count) }),
    doc: (path: string) => reference(path),
    runTransaction: vi.fn(async (callback: any, options: any) => {
      expect(options).toEqual({ readOnly: true });
      const snapshot = structuredClone(current);
      return callback({ get: async (ref: any) => {
        calls.push({ path: ref.path, limit: ref.limit });
        // A concurrent commit lands after the first read. Every transaction read
        // must still use its one snapshot, never physical-before/pending-after.
        current = after;
        if (ref.path === 'stockItems') return { docs: [{ id: 'HOP-1', data: () => ({ ref: 'HOP-1', unit: 'g', currentStock: snapshot.mass }) }] };
        const docs = Array.from({ length: Math.min(size, ref.limit ?? size) }, (_, i) => ({ id: i ? `other-${i}` : 'current',
          data: () => ({ status: 'fermentation', ...(hasLedger ? { stockConsumption: { pendingItems: [{ stockItemRef: 'HOP-1', quantity: snapshot.pending, unit: 'g' }] } } : {}) }) }));
        return ref.path === 'batches' ? { docs } : { ...docs[0], exists: true };
      } });
    })
  };
  return { db, calls };
}

describe('Lecture serveur cohérente et bornée des stocks et pending', () => {
  it('garde stock avant + pending avant dans un snapshot RO, puis stock après + pending après au suivant', async () => {
    const { db, calls } = store();
    const first = await readBrewerStockSnapshot(db as any, 'current');
    expect(first.stock.docs[0].data().currentStock).toBe(100);
    expect((first.stockReservations.batches[0] as any).stockConsumption.pendingItems[0].quantity).toBe(20);
    expect(first.batchDoc!.data()!.stockConsumption.pendingItems[0].quantity).toBe(20);
    expect(first.stockReservations).toMatchObject({ complete: true, source: 'firestoreReadOnlyTransaction' });
    const second = await readBrewerStockSnapshot(db as any, 'current');
    expect(second.stock.docs[0].data().currentStock).toBe(80);
    expect((second.stockReservations.batches[0] as any).stockConsumption.pendingItems[0].quantity).toBe(0);
    expect(db.runTransaction).toHaveBeenCalledTimes(2);
    expect(calls.slice(0, 3)).toEqual([{ path: 'stockItems', limit: 500 }, { path: 'batches', limit: 501 }, { path: 'batches/current', limit: undefined }]);
  });
  it('ne qualifie pas un résultat de501 en périmètre complet et conserve les500premières lignes', async () => {
    const { db } = store(700);
    const read = await readBrewerStockSnapshot(db as any);
    expect(read.stockReservations.complete).toBe(false);
    expect(read.stockReservations.batches).toHaveLength(500);
    expect(read.batchDoc).toBeNull();
  });
  it('conserve la ref physique et le ledger, sans substituer un nom ou id', () => {
    expect(pick({ id: 'technical-id', ref: 'HOP-1', name: 'Nom', currentStock: 0, unit: 'g' }, STOCK_FIELDS)).toMatchObject({ id: 'technical-id', ref: 'HOP-1', currentStock: 0 });
    const snapshot = { id: 'frozen-recipe', hops: [] };
    expect(pick({ id: 'batch', recipeSnapshot: snapshot, stockConsumption: { items: [], pendingItems: [] } }, BATCH_FIELDS))
      .toMatchObject({ stockConsumption: { pendingItems: [] }, recipeSnapshot: snapshot });
  });
  it('distingue absence du ledger effectivement lue et champ omis dans une projection partielle', async () => {
    const { db } = store(1, false);
    const read = await readBrewerStockSnapshot(db as any);
    expect(read.stockReservations.batches[0]).toMatchObject({ id: 'current', stockConsumption: null });
    const input = { materials: [{ id: 'material', name: 'Matière de fixture', form: 'unknown' as const, stockItemRef: 'HOP-1' }],
      inventory: read.stock.docs.map(doc => doc.data()), reservations: read.stockReservations };
    expect(prepareBrewingStockAvailability(input).rows[0].availableGrams).toBe(100);
    const omitted = structuredClone(read.stockReservations);
    delete (omitted.batches[0] as any).stockConsumption;
    expect(prepareBrewingStockAvailability({ ...input, reservations: omitted }).rows[0].availableGrams).toBeNull();
  });
});
