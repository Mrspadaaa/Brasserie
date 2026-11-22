import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie d3c, contrat de `resendProof` (PLAN § 2.4, Conception M5) : mêmes gardes que « Joindre » de la feuille, rien en file sur un refus, nom lisible
 * calculé depuis la dépense, `fileNo + 1` pour un autre fichier (lu sur Firestore quand le job est sur un autre appareil).
 */
const S = vi.hoisted(() => ({ txs: [] as any[], writes: [] as any[], upload: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: {
  getTransactions: () => S.txs, isReady: () => false, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getConfig: () => ({ fiscal: { isTvaRegistered: false } }),
  updateTransaction: (tx: any) => { S.writes.push(structuredClone(tx)); S.txs = S.txs.map(t => t.id === tx.id ? tx : t); } } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false,
  FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'confirmed' }), waitForDocument: async () => undefined, subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/financeDocuments', () => ({
  prepareFinanceDocument: (id: string, dataUrl: string, fileName: string, mimeType: string) => ({ id, fileName, mimeType, parts: [dataUrl] }),
  saveFinanceDocumentConfirmed: (...args: any[]) => S.upload(...args), loadDriveProofReceipt: async () => undefined }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }), ensureDriveAccessToken: async () => 'jeton' } }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: {
  normalizeMimeType: (file: File) => file.type,
  fileToDataUrl: async (file: File) => `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}` } }));
import * as entry from '../../../../src/services/purchaseEntry';
import * as queue from '../../../../src/services/proofQueue';

const expense = (finance: any = {}, extra: any = {}) => ({ id: 'TX-renvoi-0001', date: '27.04.2026', description: 'Achat', category: 'brassage', amountTTC: 10,
  finance: { version: 1, kind: 'expense', amountCents: 1000, lines: [], vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '372765', ...finance }, ...extra });
const pdf = (bytes = 'PDF-un', name = 'facture.pdf', type = 'application/pdf') => new File([bytes], name, { type });
let store: ReturnType<typeof queue.createMemoryProofStore>;
beforeEach(() => { S.txs = [expense({ proofUpload: { state: 'failed', reason: 'quota', uid: 'u1', at: '2026-11-01T10:00:00Z' } })]; S.writes = []; S.upload.mockReset().mockImplementation(() => new Promise(() => undefined)); store = queue.createMemoryProofStore(); queue.setProofFileStore(store); });
afterEach(() => { queue.setProofFileStore(undefined); });

describe('resendProof', () => {
  it('un fichier de 5 Mo est refusé, rien en file, rien d’écrit', async () => {
    await expect(entry.resendProof('TX-renvoi-0001', pdf('x'.repeat(5 * 1024 * 1024)))).rejects.toThrow(/4 Mo/);
    expect(store.rows.size).toBe(0); expect(S.writes).toEqual([]);
  });
  it('un format refusé est refusé, rien en file', async () => {
    await expect(entry.resendProof('TX-renvoi-0001', pdf('texte', 'notes.txt', 'text/plain'))).rejects.toThrow(/JPG, PNG, WebP ou PDF/);
    expect(store.rows.size).toBe(0);
  });
  it('une dépense qui a déjà un proofDocumentId est refusée', async () => {
    S.txs = [expense({ proofDocumentId: 'proof-deja-1234' })];
    await expect(entry.resendProof('TX-renvoi-0001', pdf())).rejects.toThrow(/déjà un justificatif/);
    expect(store.rows.size).toBe(0);
  });
  it('une dépense annulée est refusée', async () => {
    S.txs = [expense({ voidedAt: '2026-11-01' })];
    await expect(entry.resendProof('TX-renvoi-0001', pdf())).rejects.toThrow(/annulée/);
  });
  it('une dépense déjà tentée sans fichier local (job perdu) : le fichier choisi prend fileNo+1 ; le nom lisible est calculé depuis la dépense (date, fournisseur, numéro), pas depuis le nom du fichier', async () => {
    await entry.resendProof('TX-renvoi-0001', pdf());
    expect(store.rows.get('renvoi-0001')).toMatchObject({ driveName: '2026-04-27 Brau- und Rauchshop GmbH 372765.pdf', originalName: 'facture.pdf', year: 2026, documentId: 'proof-renvoi-0001-2', state: 'queued' });
    expect(S.writes[0].finance.proofUpload).toMatchObject({ state: 'queued', uid: 'u1' });
  });
  it('autre appareil (aucun job local) : fileNo+1 lu sur la dépense (Firestore)', async () => {
    S.txs = [expense({ proofUpload: { state: 'failed', reason: 'quota', uid: 'u1', at: '2026-11-01T10:00:00Z', fileNo: 2 } })];
    await entry.resendProof('TX-renvoi-0001', pdf('PDF-trois'));
    expect(store.rows.get('renvoi-0001')).toMatchObject({ fileNo: 3, documentId: 'proof-renvoi-0001-3' });
    expect(S.writes[0].finance.proofUpload.fileNo).toBe(3);
  });
  it('même fichier qu’un envoi en échec : même identifiant ; autre fichier : fileNo+1', async () => {
    await entry.resendProof('TX-renvoi-0001', pdf('PDF-un'));
    const first = store.rows.get('renvoi-0001')!;
    await store.put({ ...first, state: 'failed', reason: 'quota' });
    await entry.resendProof('TX-renvoi-0001', pdf('PDF-un'));
    expect(store.rows.get('renvoi-0001')!.documentId).toBe('proof-renvoi-0001-2');
    await store.put({ ...store.rows.get('renvoi-0001')!, state: 'failed', reason: 'quota' });
    await entry.resendProof('TX-renvoi-0001', pdf('PDF-deux'));
    expect(store.rows.get('renvoi-0001')!.documentId).toBe('proof-renvoi-0001-3');
  });
  it('un envoi en cours : le même fichier est sans effet, un autre fichier est refusé', async () => {
    await entry.resendProof('TX-renvoi-0001', pdf('PDF-un'));
    const writes = S.writes.length;
    await entry.resendProof('TX-renvoi-0001', pdf('PDF-un'));
    expect(S.writes.length).toBe(writes);
    await expect(entry.resendProof('TX-renvoi-0001', pdf('PDF-deux'))).rejects.toThrow(/en cours/);
  });
  it('« Rattacher » est refusé pour une dépense qui porte proofUpload (un seul envoi à la fois)', () => {
    const draft: any = { proofDataUrl: 'data:application/pdf;base64,AAAA', amount: 10, invoiceNumber: '372765', vendor: 'Brau- und Rauchshop GmbH', date: '27.04.2026', description: 'Achat', lines: [] };
    expect(entry.purchaseProofAttachable(draft, expense({}) as any)).toBe(true);
    expect(entry.purchaseProofAttachable(draft, expense({ proofUpload: { state: 'queued', uid: 'u1', at: 'x' } }) as any)).toBe(false);
  });
});
