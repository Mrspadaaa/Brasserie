import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie d3c, témoin du défaut (L13) : « Confirmer » ne doit plus attendre Drive. Drive ne répond JAMAIS ; l'enregistrement doit rendre la main
 * en moins d'une seconde (temps réel : le calcul d’empreinte du navigateur n’obéit pas aux minuteries factices), la dépense écrite avec `proofUpload.state === 'queued'` et sans `proofDocumentId`.
 * Sur HEAD (avant le code) : ROUGE parce que l'appel attend Drive. `setProofFileStore` n'existe pas encore : l'appel est conditionnel.
 */
const state = vi.hoisted(() => ({ transactions: [] as any[], added: [] as any[], upload: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: {
  getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }),
  addTransaction: (tx: any) => { state.added.push(tx); state.transactions.push(tx); }, addStockItem: () => undefined, addEquipment: () => undefined, updateTransaction: () => undefined, isReady: () => false } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false,
  FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined, adjustNumber: () => undefined, put: () => undefined, subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({
  prepareFinanceDocument: (id: string, dataUrl: string, fileName: string, mimeType: string) => ({ id, fileName, mimeType, parts: [dataUrl] }),
  saveFinanceDocumentConfirmed: (...args: any[]) => state.upload(...args), loadDriveProofReceipt: async () => undefined }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }), ensureDriveAccessToken: async () => 'jeton' } }));
import * as entry from '../../../../src/services/purchaseEntry';
import type { PurchaseDraft } from '../../../../src/services/purchaseEntry';

const draft: PurchaseDraft = { submissionId: 'd3c-confirmer-000001', date: '27.04.2026', vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '372765', description: 'Achat', category: 'brassage', amount: 10,
  lines: [{ id: 'l1', description: 'Port', kind: 'shipping', amount: 10, unit: '', stockAction: 'none', equipmentAction: 'none' }], paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF',
  proofDataUrl: 'data:image/jpeg;base64,AAAA', proofFileName: 'Screenshot.jpg', proofType: 'image/jpeg', documentHash: 'b'.repeat(64) };
/** Un magasin en mémoire : le même contrat que le magasin Dexie. */
function memoire() {
  const rows = new Map<string, any>();
  return { put: async (job: any) => { rows.set(job.submissionId, structuredClone(job)); }, get: async (id: string) => rows.get(id), all: async () => [...rows.values()], delete: async (id: string) => { rows.delete(id); }, rows };
}
beforeEach(() => { state.transactions = []; state.added = []; state.upload.mockReset().mockImplementation(() => new Promise(() => undefined)); });
afterEach(() => { (entry as any).setProofFileStore?.(undefined); });

describe('« Confirmer » ne attend plus Drive', () => {
  it('Drive ne répond jamais : la dépense est écrite et l’appel rend en moins d’une seconde, en file, sans proofDocumentId', async () => {
    (entry as any).setProofFileStore?.(memoire());
    const result: any = await Promise.race([
      entry.savePurchaseWithProofReceipt(draft).catch(error => ({ error })),
      new Promise(resolve => setTimeout(() => resolve(undefined), 1000)),
    ]);
    expect(result, 'l’appel attend encore Drive après 1 s').toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.transactionId).toBe('TX-d3c-confirmer-000001');
    expect(state.added).toHaveLength(1);
    expect(state.added[0].finance.proofUpload).toMatchObject({ state: 'queued', uid: 'u1' });
    expect(state.added[0].finance.proofDocumentId).toBeUndefined();
  });
});
