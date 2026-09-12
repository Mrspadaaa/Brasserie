import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: new Map<string, any>(), writes: [] as string[], proof: vi.fn(), confirm: vi.fn() }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: (error: any) => error?.kind === 'rejected', FirestoreRepo: {
  all: (name: string) => [...state.rows.entries()].filter(([key]) => key.startsWith(`${name}/`)).map(([, value]) => value),
  put: (name: string, id: string, value: any) => { state.rows.set(`${name}/${id}`, value); state.writes.push(`${name}/${id}`); },
  documentWriteState: () => ({ operationId: 'op', status: 'pending' }),
  waitForDocument: (...args: any[]) => state.confirm(...args)
} }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getTransactions: () => [...state.rows.entries()].filter(([key]) => key.startsWith('transactions/')).map(([, value]) => value),
  addTransaction: (tx: any) => { state.rows.set(`transactions/${tx.id}`, tx); state.writes.push(`transactions/${tx.id}`); }
} }));
vi.mock('../../src/services/financeDocuments', () => ({ saveFinanceDocumentConfirmed: (...args: any[]) => state.proof(...args) }));
import { saveIncomeEntry, type IncomeEntry } from '../../src/services/incomeEntry';
const draft = (paid = true): IncomeEntry => ({
  transaction: { id: 'SALE-1', date: '2026-01-02', description: 'Carton Pale Ale', category: 'recettes', subcategory: 'Vente', amountHT: 50, amountTTC: 50, tvaAmount: 0, tvaRate: 0, proofFileName: 'Quittance.pdf', proofType: 'application/pdf', finance: { version: 1, kind: 'income', amountCents: 5000, lines: [], paymentStatus: paid ? 'paid' : 'unpaid', recordedAt: '2026-01-02T12:00:00Z', proofDocumentId: 'proof-sale-original' } },
  proof: { id: 'proof-sale-original', fileName: 'Quittance.pdf', mimeType: 'application/pdf', parts: ['data:application/pdf;base64,JVBERg=='] },
  ...(paid ? { payment: { id: 'PAY-SALE-1', transactionId: 'SALE-1', date: '2026-01-02', amountCents: 5000, direction: 'in' as const, method: 'twint' as const, recordedAt: '2026-01-02T12:00:00Z' } } : {})
});
beforeEach(() => {
  state.rows.clear(); state.writes = []; state.proof.mockReset().mockResolvedValue(undefined);
  state.confirm.mockReset().mockImplementation(async (name: string, id: string, _timeout: number, identity: any) => { const value = state.rows.get(`${name}/${id}`); if (!identity(value)) throw Error('Identity mismatch'); return value; });
});
describe('Originaux de vente et confirmation, sans Drive réel', () => {
  it('attend l’original avant la transaction et son paiement, sans base64 dans leurs données', async () => {
    let release!: () => void; state.proof.mockImplementation(() => new Promise<void>(resolve => { release = resolve; }));
    const entry = draft(), pending = saveIncomeEntry(entry);
    await vi.waitFor(() => expect(state.proof).toHaveBeenCalledOnce());
    expect(state.writes).toEqual([]); release(); await pending;
    expect(state.proof).toHaveBeenCalledWith(entry.proof, 2026);
    expect(state.writes).toEqual(['transactions/SALE-1', 'financialPayments/PAY-SALE-1']);
    expect(JSON.stringify([...state.rows.values()])).not.toContain('data:');
    expect(state.confirm).toHaveBeenCalledTimes(2);
  });
  it('reprend uniquement la confirmation après réponse perdue sans régénérer ni payer deux fois', async () => {
    state.confirm.mockRejectedValueOnce(Error('Confirmation en attente'));
    const entry = draft(); await expect(saveIncomeEntry(entry)).rejects.toThrow('attente');
    await saveIncomeEntry(entry);
    expect(state.proof).toHaveBeenCalledOnce(); expect(state.writes).toHaveLength(2);
  });
  it('ne crée aucun paiement pour une facture à régler et refuse un ancien fichier inline', async () => {
    await saveIncomeEntry(draft(false)); expect(state.writes).toEqual(['transactions/SALE-1']);
    const invalid = draft(); invalid.transaction.proofUrl = 'data:application/pdf;base64,JVBERg==';
    await expect(saveIncomeEntry(invalid)).rejects.toThrow('sans fichier');
    expect(state.proof).toHaveBeenCalledOnce();
  });
  it('un refus de Drive garde la vente absente et réutilise le même original au clic suivant', async () => {
    state.proof.mockRejectedValueOnce(Error('Reconnecte Drive'));
    const entry = draft(); await expect(saveIncomeEntry(entry)).rejects.toThrow('Reconnecte');
    expect(state.writes).toEqual([]); await saveIncomeEntry(entry);
    expect(state.proof.mock.calls[0][0]).toBe(state.proof.mock.calls[1][0]); expect(state.writes).toHaveLength(2);
  });
});
