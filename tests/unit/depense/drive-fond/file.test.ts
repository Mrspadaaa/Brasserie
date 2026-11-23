import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/** Voie d3c, contrat de la file locale (PLAN § 2.1 et § 3) : durable avant le retour, un job par saisie, plafonds, identifiants. */
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], isReady: () => false } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: vi.fn() }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }) } }));
import * as queue from '../../../../src/services/proofQueue';

const PDF = 'data:application/pdf;base64,JVBERi0xLjQK';
const input = (id: string, extra: any = {}) => ({ submissionId: id, dataUrl: PDF, mimeType: 'application/pdf', driveName: `${id}.pdf`, year: 2026, uid: 'u1', ...extra });
let store: ReturnType<typeof queue.createMemoryProofStore>;
beforeEach(() => { store = queue.createMemoryProofStore(); queue.setProofFileStore(store); });
afterEach(() => { queue.setProofFileStore(undefined); });

describe('La file locale', () => {
  it('enqueueProof ne rend la main qu’après l’écriture durable', async () => {
    const order: string[] = []; const put = store.put;
    store.put = async job => { await new Promise(r => setTimeout(r, 15)); await put(job); order.push('écrit'); };
    await queue.enqueueProof(input('file-0001')); order.push('rendu');
    expect(order).toEqual(['écrit', 'rendu']);
    expect(store.rows.get('file-0001')).toMatchObject({ state: 'queued', dataUrl: PDF, transactionId: 'TX-file-0001', documentId: 'proof-file-0001' });
  });
  it('un module rechargé relit les jobs du même magasin', async () => {
    await queue.enqueueProof(input('file-0002'));
    vi.resetModules();
    const again = await import('../../../../src/services/proofQueue');
    again.setProofFileStore(store);
    expect((await again.listProofJobs()).map(job => job.submissionId)).toEqual(['file-0002']);
  });
  it('un job par saisie : un nouvel appel remplace la ligne, il n’en ajoute pas', async () => {
    await queue.enqueueProof(input('file-0003')); await queue.enqueueProof(input('file-0003', { fileNo: 2 }));
    expect(store.rows.size).toBe(1); expect(store.rows.get('file-0003')?.documentId).toBe('proof-file-0003-2');
  });
  it('plafond de 20 envois : le 21e est refusé (l’appelant retombe sur le chemin synchrone)', async () => {
    for (let i = 0; i < 20; i++) await queue.enqueueProof(input(`file-plein-${String(i).padStart(2, '0')}`));
    await expect(queue.enqueueProof(input('file-de-trop'))).rejects.toThrow(/pleine/);
    expect(store.rows.size).toBe(20);
  });
  it('plafond de 60 Mo', async () => {
    await store.put({ ...(await queue.enqueueProof(input('file-gros'))), bytes: 59_000_000 });
    await expect(queue.enqueueProof(input('file-petit', { dataUrl: `data:application/pdf;base64,${'A'.repeat(3_000_000)}` }))).rejects.toThrow(/pleine/);
  });
  it('fileNo et identifiant : 1 et absent = proof-<saisie> ; n > 1 = proof-<saisie>-<n>', () => {
    expect(queue.proofDocumentIdFor('abcd-1234')).toBe('proof-abcd-1234');
    expect(queue.proofDocumentIdFor('abcd-1234', 1)).toBe('proof-abcd-1234');
    expect(queue.proofDocumentIdFor('abcd-1234', 3)).toBe('proof-abcd-1234-3');
    expect(/^[A-Za-z0-9-]{8,100}$/.test(queue.proofDocumentIdFor('d3c-synchrone-000001', 12))).toBe(true);
  });
  it('les octets se lisent sur la chaîne data: (rembourrage compris)', () => {
    expect(queue.dataUrlBytes('data:application/pdf;base64,JVBERi0xLjQK')).toBe(9);
    expect(queue.dataUrlBytes('data:application/pdf;base64,QQ==')).toBe(1);
  });
});
