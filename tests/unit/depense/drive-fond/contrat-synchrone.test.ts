import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie d3c, garde-fou (PLAN § 0 « IndexedDB absent = synchrone ») : sans file, ou si la file refuse, `savePurchaseWithProofReceipt` suit exactement
 * l'ordre d'avant : Drive d'abord, la dépense ensuite, `proofDocumentId` posé, reçu rendu. VERT sur HEAD comme après. Il échoue si quelqu'un
 * ajoute `fake-indexeddb` sans le dire : ce contrat est ce qui garde verts tous les tests synchrones existants.
 */
const S = vi.hoisted(() => ({ txs: [] as any[], log: [] as string[], upload: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: {
  getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => S.txs, getConfig: () => ({ fiscal: { isTvaRegistered: false } }),
  addTransaction: (tx: any) => { S.log.push('dépense'); S.txs.push(tx); }, addStockItem: () => undefined, addEquipment: () => undefined, updateTransaction: () => undefined, isReady: () => false } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false,
  FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined, adjustNumber: () => undefined, put: () => undefined, subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({
  prepareFinanceDocument: (id: string, dataUrl: string, fileName: string, mimeType: string) => ({ id, fileName, mimeType, parts: [dataUrl] }),
  saveFinanceDocumentConfirmed: (...args: any[]) => { S.log.push('drive'); return S.upload(...args); }, loadDriveProofReceipt: async () => undefined }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }), ensureDriveAccessToken: async () => 'jeton' } }));
import * as entry from '../../../../src/services/purchaseEntry';
import type { PurchaseDraft } from '../../../../src/services/purchaseEntry';

let n = 0;
const draft = (): PurchaseDraft => ({ submissionId: `d3c-synchrone-${String(++n).padStart(6, '0')}`, date: '27.04.2026', vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '372765', description: 'Achat', category: 'brassage', amount: 10,
  lines: [{ id: 'l1', description: 'Port', kind: 'shipping', amount: 10, unit: '', stockAction: 'none', equipmentAction: 'none' }], paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF',
  proofDataUrl: 'data:image/jpeg;base64,AAAA', proofFileName: 'Screenshot.jpg', proofType: 'image/jpeg', documentHash: String(n).repeat(64).slice(0, 64) });
const RECEIPT = { driveFileId: 'd1', fileName: '2026-04-27 Brau- und Rauchshop GmbH 372765.jpg', bytes: 3, sha256: 'a'.repeat(64), verified: true };
beforeEach(() => { S.txs = []; S.log = []; S.upload.mockReset().mockResolvedValue(RECEIPT); });
afterEach(() => { entry.setProofFileStore(undefined); });

const expectSynchronous = async () => {
  const input = draft();
  const result = await entry.savePurchaseWithProofReceipt(input);
  expect(S.log).toEqual(['drive', 'dépense']);
  expect(result.queued).toBeUndefined();
  expect(result.proof).toMatchObject({ fileName: RECEIPT.fileName });
  expect(S.txs[0].finance.proofDocumentId).toBe(`proof-${input.submissionId}`);
  expect(S.txs[0].finance.proofUpload).toBeUndefined();
  expect(S.txs[0].proofFileName).toBe(RECEIPT.fileName);
};

describe('IndexedDB absent = synchrone', () => {
  it('l’environnement de test n’a pas d’IndexedDB (sinon ce contrat ne protège plus les tests synchrones)', () => {
    expect(typeof indexedDB).toBe('undefined');
    expect(entry.proofQueueAvailable()).toBe(false);
  });
  it('sans magasin : Drive, puis la dépense, proofDocumentId posé, reçu rendu', async () => { await expectSynchronous(); });
  it('file désactivée à la main (null) : même chemin', async () => { entry.setProofFileStore(null); await expectSynchronous(); });
  it('le magasin lève à l’écriture : retour au chemin synchrone, rien de perdu', async () => {
    entry.setProofFileStore({ put: async () => { throw new Error('quota IndexedDB'); }, get: async () => undefined, all: async () => [], delete: async () => undefined });
    await expectSynchronous();
  });
  it('plafond atteint (20 envois) : même chemin', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ submissionId: `autre-${i}`, bytes: 10 }) as any);
    entry.setProofFileStore({ put: async () => { throw new Error('ne doit pas être écrit'); }, get: async () => undefined, all: async () => rows, delete: async () => undefined });
    await expectSynchronous();
  });
});
