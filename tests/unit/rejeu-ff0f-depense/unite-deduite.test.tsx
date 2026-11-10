// @vitest-environment jsdom
/**
 * Rejeu en ligne ff0f822e, B2-2 et B2-3 : « Malt Munich 2 Kg × 4,20 » dont l'unité n'est pas imprimée sur la ligne (le ticket dit « Malt Munich 1 kg » puis « 2 x 4.20 » :
 * l'écran déduit « Kg » du prix, en jaune). Toucher « g » doit CONVERTIR (2 Kg → 2 000 g, prix ÷ 1 000), garder le montant de la ligne, ne rien effacer ;
 * le retour à « Kg » rend 2 et 4,20. Avant le correctif, `choisirUnite` ne lisait que l'unité ÉCRITE : une unité déduite passait pour « absente », la quantité restait 2
 * (2 g) et le prix lu était retiré. Lecture FICTIVE (Brasserie Fictive), Gemini simulé, aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ scanned: vi.fn(), saved: vi.fn() }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: async (draft: any) => { state.saved(structuredClone(draft)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { toucherUnite, unitePressee } from '../depense/aide-plateau';
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';

const lecture = (unit: string) => ({ documentType: 'receipt', paymentEvidence: 'paid', vendor: 'Brasserie Fictive Sarl', date: '27.09.2026', currency: 'CHF', invoiceNumber: '',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 8.4, category: 'brassage', subcategory: '', description: 'Malt', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Malt Munich', kind: 'stock', quantity: 2, unit, price: 4.2, amountTTC: 8.4, stockCategory: 'malt' }] });
const ouvrir = async (unit: string) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: lecture(unit) });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\nun'], 'un.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nun').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const champ = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value.replace(/[\s  ]/g, '');

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.saved.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('B2-2, B2-3 : changer d\'unité une ligne dont l\'unité est déduite', () => {
  it('« Kg » déduit du prix : un toucher sur « g » convertit (2 000 g × 0,0042), garde le montant, et « Kg » rend 2 × 4,20', async () => {
    await ouvrir('');
    expect(unitePressee(1)).toBe('Kg');
    expect(champ('Quantité ligne 1')).toBe('2');
    expect(champ('Prix ligne 1')).toBe('4,20');
    toucherUnite(1, 'g');
    expect(unitePressee(1)).toBe('g');
    expect(champ('Quantité ligne 1')).toBe('2000');
    expect(champ('Prix ligne 1')).toMatch(/^0,0042/);
    expect(champ('Montant ligne 1')).toBe('8,40');
    toucherUnite(1, 'Kg');
    expect(unitePressee(1)).toBe('Kg');
    expect(champ('Quantité ligne 1')).toBe('2');
    expect(champ('Prix ligne 1')).toBe('4,20');
    expect(champ('Montant ligne 1')).toBe('8,40');
  });
  it('contrôle : la même ligne avec « Kg » imprimé se convertit déjà (ce qui marchait)', async () => {
    await ouvrir('Kg');
    toucherUnite(1, 'g');
    expect(champ('Quantité ligne 1')).toBe('2000');
    expect(champ('Montant ligne 1')).toBe('8,40');
  });
});
