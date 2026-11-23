import { describe, it, expect, beforeEach, vi } from 'vitest';

// Lot 6 du Carnet, L-37 (CA12-M3-5, CRW-6) : la pièce qui avait soldé le projet de matériel est retirée (Finances › écriture › « Retirer cette
// écriture ») ; le projet restait « Réalisé · achats liés : aucun ». Attendu : il revient dans À venir, compté dans la prévision.
const store = new Map<string, Map<string, Record<string, unknown>>>();
const fakeRepo = {
  all: <T>(name: string): T[] => Array.from(store.get(name)?.entries() ?? []).map(([__docId, doc]) => ({ ...doc, __docId }) as T),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: () => {}, remove: (name: string, id: string) => { store.get(name)?.delete(id); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));
const { StorageService } = await import('../../src/services/storage');
const { FinanceService } = await import('../../src/services/financeService');
const { retirerEcriture } = await import('../../src/ui/finance/modifier/retirerEcriture');
type T = import('../../src/types');
type Plan = import('../../src/domain/finance/types').FinancialPlan;

const plan = (): Plan => ({ id: 'PLAN-ZZ', title: 'ZZ TEST — moulin', direction: 'out', category: 'materiel', amountCents: 50000, date: '2026-11-01', status: 'completed',
  source: 'equipment', createdAt: '2026-11-01T10:00:00Z', updatedAt: '2026-11-23T10:00:00Z',
  upgrade: { version: 1, stage: 'ready', timing: 'soon', budgetKnown: true, purchaseCents: 50000, estimateSource: 'estimate', datePrecision: 'month' } }) as unknown as Plan;
const achat = (): T['Transaction'] => ({ id: 'TX-ZZ', date: '23.11.2026', description: 'ZZ moulin', category: 'materiel', amountHT: 500, amountTTC: 500, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 50000, planId: 'PLAN-ZZ', lines: [] } }) as unknown as T['Transaction'];

beforeEach(() => { store.clear(); localStorage.clear(); });

describe('L-37 : retirer la pièce qui soldait le projet', () => {
  it('le projet revient dans À venir (actif : il a un mois et un prix)', async () => {
    FinanceService.savePlan(plan());
    StorageService.addTransaction(achat());
    await retirerEcriture('TX-ZZ', [], { aujourdhui: '2026-11-23', maintenant: '2026-11-23T11:00:00Z' });
    expect(StorageService.getTransactions().find(t => t.id === 'TX-ZZ')?.finance?.voidedAt).toBeTruthy();
    expect(FinanceService.getPlans().find(p => p.id === 'PLAN-ZZ')?.status).toBe('active');
  });
});
