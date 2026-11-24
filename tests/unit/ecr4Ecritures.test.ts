// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Voie ecr4 (24.11) : E41-1 (retirer un achat qui a un remboursement lié), E41-2 (« De quelle pièce ? » sur les vraies pièces payées).
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
const { retirerEcriture, ecrituresLiees } = await import('../../src/ui/finance/modifier/retirerEcriture');
const { avecGenre, brouillonNeuf, piecesRemboursables, preparer } = await import('../../src/ui/saisie/modele');
type Tx = import('../../src/domain/finance/types').FinanceTransaction;
type Pay = import('../../src/domain/finance/types').FinancialPayment;

const CTX = { aujourdhui: '2026-11-24', maintenant: '2026-11-24T10:00:00Z' };

function poser(e: ReturnType<typeof preparer>) {
  StorageService.addTransaction(e.transaction as never);
  if (e.paiement) FinanceService.recordPayment(e.paiement);
}

beforeEach(() => { store.clear(); localStorage.clear(); });

describe('E41-1 : retirer un achat qui a un remboursement lié', () => {
  function achatEtRemboursement() {
    const achat = preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), 'achat'), cents: 450, nom: 'ZZ TEST — Achat' }, { id: 'TX-A', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false });
    poser(achat);
    const b = { ...avecGenre(brouillonNeuf('2026-11-20'), 'rembt'), cents: 100, pieceId: 'TX-A' };
    const rembt = preparer(b, { id: 'TX-R', maintenant: '2026-11-20T10:00:00Z', transactions: [achat.transaction as Tx], tvaInscrit: false });
    poser(rembt);
  }
  it('le remboursement lié est retiré avec l’achat, ses paiements inversés', async () => {
    achatEtRemboursement();
    expect(ecrituresLiees('TX-A').map(t => t.id)).toEqual(['TX-R']);
    await retirerEcriture('TX-A', FinanceService.getPayments() as Pay[], CTX);
    const par = new Map(StorageService.getTransactions().map(t => [t.id, t]));
    expect(par.get('TX-A')?.finance?.voidedAt).toBeTruthy();
    expect(par.get('TX-R')?.finance?.voidedAt).toBeTruthy();
    const pay = FinanceService.getPayments() as Pay[];
    expect(pay.filter(p => p.transactionId === 'TX-R').length).toBe(2); // le paiement et son contre-paiement
  });
  it('sans remboursement, rien de lié', () => {
    poser(preparer({ ...avecGenre(brouillonNeuf('2026-11-19'), 'achat'), cents: 450, nom: 'ZZ TEST — Achat' }, { id: 'TX-A', maintenant: '2026-11-19T10:00:00Z', transactions: [], tvaInscrit: false }));
    expect(ecrituresLiees('TX-A')).toEqual([]);
  });
});

describe('E41-2 : « De quelle pièce ? » trouve les pièces payées, même sans statut « payé »', () => {
  const piece = (id: string, description: string, statut: string | undefined, cents: number, date: string, vendor?: string): Tx => ({
    id, date, description, category: 'brassage', subcategory: 'Achat', amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0,
    finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], ...(statut ? { paymentStatus: statut } : {}), ...(vendor ? { vendor } : {}) }
  }) as unknown as Tx;
  const pay = (id: string, transactionId: string, cents: number, date: string): Pay => ({ id, transactionId, date, amountCents: cents, direction: 'out', method: 'bank', recordedAt: `${date}T10:00:00Z` }) as Pay;
  const txs = [
    piece('R1', 'consomable ( masque gant)', 'unknown', 2300, '2026-11-19'),
    piece('R2', 'Brau- und Rauchshop', undefined, 11040, '2026-04-27', 'Brau- und Rauchshop'),
    piece('R3', 'Facture ouverte', 'unpaid', 5000, '2026-11-10'),
    piece('R4', 'Payée en partie', 'partial', 5000, '2026-11-11')
  ];
  const paiements = [pay('P1', 'R1', 2300, '2026-11-19'), pay('P2', 'R2', 11040, '2026-04-27'), pay('P4', 'R4', 2000, '2026-11-12')];
  it('les pièces payées au registre des paiements sont proposées et se cherchent par nom et montant', () => {
    expect(piecesRemboursables(txs, '', 30, true, paiements).map(p => p.id).sort()).toEqual(['R1', 'R2']);
    expect(piecesRemboursables(txs, 'masque', 30, true, paiements).map(p => p.id)).toEqual(['R1']);
    expect(piecesRemboursables(txs, '23', 30, true, paiements).map(p => p.id)).toEqual(['R1']);
    expect(piecesRemboursables(txs, 'Brau', 30, true, paiements).map(p => p.id)).toEqual(['R2']);
  });
  it('un paiement inversé ne compte pas : la pièce n’est plus payée', () => {
    const inverse = { ...pay('C1', 'R1', 2300, '2026-11-20'), direction: 'in', reversalOfId: 'P1' } as Pay;
    expect(piecesRemboursables(txs, '', 30, true, [...paiements, inverse]).map(p => p.id)).toEqual(['R2']);
  });
});
