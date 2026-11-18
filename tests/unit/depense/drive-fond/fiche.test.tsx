// @vitest-environment jsdom
/**
 * Voie d3c, contrat de la fiche d'une dépense dont le justificatif n'est pas parti (PLAN § 2.3 et § 2.4) : motif en clair, « Renvoyer maintenant »,
 * « Abandonner » (retire l'état, la dépense reste « sans justificatif », job voided) ; `DocumentProofLink` seulement avec `proofDocumentId`.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const S = vi.hoisted(() => ({ txs: [] as any[], writes: [] as any[], resend: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: {
  getTransactions: () => S.txs, isReady: () => false, revertTransaction: () => ({ success: true }),
  updateTransaction: (tx: any) => { S.writes.push(structuredClone(tx)); S.txs = S.txs.map(t => t.id === tx.id ? tx : t); } } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { recordPayment: vi.fn() } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { subscribe: () => () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: vi.fn(), saveFinanceDocumentConfirmed: vi.fn(), loadFinanceDocument: vi.fn() }));
vi.mock('../../../../src/services/purchaseEntry', () => ({ resendProof: (...args: any[]) => S.resend(...args) }));
vi.mock('../../../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }), ensureDriveAccessToken: async () => 'jeton', prepareGoogleLogin: async () => undefined, refreshDriveAccess: async () => ({ success: true }), hasDriveAccess: () => true } }));
import * as queue from '../../../../src/services/proofQueue';
import { TransactionDetails } from '../../../../src/ui/finance/TransactionDetails';

const expense = (finance: any = {}) => ({ id: 'TX-fiche-0001', date: '2026-04-27', description: 'Malt de la Pale Ale', category: 'brassage', amountHT: 10, tvaRate: 0, tvaAmount: 0, amountTTC: 10,
  finance: { version: 1, kind: 'expense', amountCents: 1000, lines: [], vendor: 'Malterie', ...finance } });
const failed = (reason = 'quota') => ({ state: 'failed', reason, uid: 'u1', at: '2026-11-01T10:00:00Z' });
let store: ReturnType<typeof queue.createMemoryProofStore>;
const open = async (tx: any) => {
  S.txs = [tx];
  render(createElement(TransactionDetails, { transaction: tx, transactions: S.txs, payments: [], plans: [], onClose: () => undefined, onEdit: () => undefined, onPay: () => undefined, onRefund: () => undefined }));
  await new Promise(r => setTimeout(r, 20));
};
const localJob = async (state: 'failed' | 'queued' = 'failed') => {
  const job = await queue.enqueueProof({ submissionId: 'fiche-0001', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK', mimeType: 'application/pdf', driveName: 'x.pdf', year: 2026, uid: 'u1' });
  await store.put({ ...job, state, ...(state === 'failed' ? { reason: 'quota' as const, settledAt: Date.now() } : {}) });
};
beforeEach(() => { S.txs = []; S.writes = []; S.resend.mockReset().mockResolvedValue(undefined); store = queue.createMemoryProofStore(); queue.setProofFileStore(store); });
afterEach(() => { cleanup(); queue.setProofFileStore(undefined); });

describe('Fiche d’une dépense dont le justificatif n’est pas parti', () => {
  it('motif lisible, « Renvoyer maintenant », « Abandonner » ; pas de bouton « Justificatif » sans proofDocumentId', async () => {
    await open(expense({ proofUpload: failed('quota') }));
    expect(screen.getByText(/Justificatif à renvoyer · Ton espace Drive est plein\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Renvoyer maintenant' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abandonner' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Justificatif$/ })).toBeNull();
  });
  it('avec proofDocumentId : le bouton « Justificatif » est là, le bloc ne l’est pas', async () => {
    await open(expense({ proofDocumentId: 'proof-fiche-0001' }));
    expect(screen.getByRole('button', { name: /Justificatif/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Renvoyer maintenant' })).toBeNull();
  });
  it('en cours d’envoi (queued) : un état, pas de bouton de renvoi', async () => {
    await open(expense({ proofUpload: { state: 'queued', uid: 'u1', at: '2026-11-01T10:00:00Z' } }));
    expect(screen.getByRole('status').textContent).toContain('en cours d’envoi');
    expect(screen.queryByRole('button', { name: 'Renvoyer maintenant' })).toBeNull();
  });
  it('« Renvoyer maintenant » avec le fichier local : bascule queued (écrite sur la dépense) sans rien choisir', async () => {
    await localJob('failed');
    await open(expense({ proofUpload: failed('quota') }));
    fireEvent.click(await screen.findByRole('button', { name: 'Renvoyer maintenant' }));
    await waitFor(async () => expect((await store.get('fiche-0001'))?.state).toBe('queued'));
    expect(S.writes.at(-1).finance.proofUpload).toMatchObject({ state: 'queued', uid: 'u1' });
    expect(S.resend).not.toHaveBeenCalled();
  });
  it('sans fichier local (autre appareil) : « Renvoyer maintenant » ouvre le sélecteur, le fichier choisi part par resendProof', async () => {
    await open(expense({ proofUpload: failed('quota') }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Renvoyer maintenant' }));
    expect(click).toHaveBeenCalled();
    const file = new File(['%PDF'], 'facture.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(S.resend).toHaveBeenCalledWith('TX-fiche-0001', file));
  });
  it('un refus de resendProof (fichier trop lourd) est dit, rien ne part', async () => {
    S.resend.mockRejectedValue(new Error('Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.'));
    await open(expense({ proofUpload: failed('quota') }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'gros.pdf', { type: 'application/pdf' })] } });
    expect((await screen.findByText(/4 Mo maximum/)).textContent).toContain('Choisis un JPG');
  });
  it('« Abandonner » retire proofUpload, la dépense reste sans justificatif, le job devient voided (fichier gardé)', async () => {
    await localJob('failed');
    await open(expense({ proofUpload: failed('quota') }));
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Abandonner l’envoi' }));
    await waitFor(async () => expect((await store.get('fiche-0001'))?.state).toBe('voided'));
    expect((await store.get('fiche-0001'))).toMatchObject({ reason: 'abandoned' });
    expect((await store.get('fiche-0001'))?.dataUrl).toBeTruthy();
    expect(S.writes.at(-1).finance.proofUpload).toBeUndefined();
    expect(S.writes.at(-1).finance.proofDocumentId).toBeUndefined();
  });
  it('motif auth : « Reconnecter Drive » dans la fiche', async () => {
    await open(expense({ proofUpload: failed('auth') }));
    expect(await screen.findByRole('button', { name: /Reconnecter Drive/ })).toBeTruthy();
  });
});
