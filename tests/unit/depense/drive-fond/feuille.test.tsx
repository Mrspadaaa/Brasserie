// @vitest-environment jsdom
/**
 * Voie d3c, garde-fou de la feuille « Nouvelle dépense » (PLAN § 2.1 (7), (8), T5) : quand le service rend `{ transactionId, queued: true }`, la feuille
 * se ferme sans attendre Drive, sans reçu, sans « Envoi au Drive » ni « Justificatif rangé » ; hors ligne avec l'écriture en file locale, elle se
 * ferme sans attendre l'accusé. Premier cas VERT sur HEAD aussi (HEAD ferme déjà quand le service ne rend pas de `proof`) : il garde, il ne prouve pas
 * le défaut ; le défaut de la feuille est prouvé par le cas Chrome 1 du banc. Drive et Gemini simulés.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], scanned: vi.fn(), save: vi.fn(), confirmed: vi.fn(), closeWithout: vi.fn(), watch: vi.fn(), onSaved: vi.fn(), onClose: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: (error: any) => error?.status === 'rejected' }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: (...a: any[]) => state.save(...a), confirmPurchase: (...a: any[]) => state.confirmed(...a),
  canCloseWithoutAck: (...a: any[]) => state.closeWithout(...a), watchPurchaseConfirmation: (...a: any[]) => state.watch(...a) }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { createMemoryProofStore, setProofFileStore } from '../../../../src/services/proofQueue';

const scan = () => ({ ok: true, model: 'rejeu', result: { documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Fournisseur A', date: '12.03.2026', currency: 'CHF', invoiceNumber: 'MB-1',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 10, category: 'brassage', subcategory: '', description: 'Achat', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 1, unit: 'Kg', amountTTC: 10, stockCategory: '' }] } });
const open = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValueOnce(scan());
  const view = render(createElement(ExpenseSheet, { onClose: state.onClose, onSaved: state.onSaved }));
  const file = new File(['%PDF-1.4\n'], 'f.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const CONFIRM = 'Confirmer et enregistrer';
beforeEach(() => {
  cleanup(); vi.restoreAllMocks();
  for (const mock of [state.scanned, state.save, state.confirmed, state.closeWithout, state.watch, state.onSaved, state.onClose]) mock.mockReset();
  state.transactions = []; state.confirmed.mockResolvedValue(undefined); state.closeWithout.mockReturnValue(false);
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); setProofFileStore(undefined); vi.unstubAllGlobals(); });

describe('Feuille « Nouvelle dépense » avec l’envoi en arrière-plan', () => {
  it('le service rend queued : onSaved sans reçu, onClose sans « Terminé », ni « Envoi au Drive » ni « Justificatif rangé »', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', queued: true });
    await open();
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    await waitFor(() => expect(state.onClose).toHaveBeenCalledTimes(1));
    expect(state.onSaved).toHaveBeenCalledTimes(1);
    expect(state.onSaved.mock.calls[0]).toEqual([]);
    expect(state.confirmed).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Terminé' })).toBeNull();
    expect(screen.queryByText(/Envoi au Drive/)).toBeNull();
    expect(screen.queryByText(/Justificatif rangé/)).toBeNull();
  });
  it('hors ligne et écriture en file locale : fermée sans attendre l’accusé, qui est suivi hors de la feuille', async () => {
    state.save.mockResolvedValue({ transactionId: 'TX-test', queued: true });
    state.closeWithout.mockReturnValue(true);
    state.confirmed.mockImplementation(() => new Promise(() => undefined));
    await open();
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    await waitFor(() => expect(state.onClose).toHaveBeenCalledTimes(1));
    expect(state.confirmed).not.toHaveBeenCalled();
    expect(state.watch).toHaveBeenCalledTimes(1);
    expect(state.closeWithout).toHaveBeenCalledWith('TX-test');
  });
  it('file active : le pied dit « Enregistrement… », jamais « Envoi au Drive »', async () => {
    setProofFileStore(createMemoryProofStore());
    state.save.mockImplementation(() => new Promise(() => undefined));
    await open();
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    await waitFor(() => expect(screen.getAllByText('Enregistrement…').length).toBeGreaterThan(0));
    expect(screen.queryByText(/Envoi au Drive/)).toBeNull();
  });
  it('repli synchrone (pas de file) : le pied garde « Envoi au Drive » et le reçu reste jusqu’à « Terminé »', async () => {
    setProofFileStore(null);
    state.save.mockImplementation(() => new Promise(() => undefined));
    await open();
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    await waitFor(() => expect(screen.getByText(/Envoi au Drive/)).toBeInTheDocument());
  });
});
