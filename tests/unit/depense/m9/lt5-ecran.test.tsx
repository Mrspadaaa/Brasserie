// @vitest-environment jsdom
/**
 * LT-5 (08.11, doc21) à l'écran : « 4 à contrôler » sur un ticket de 2 lignes juste, et le bandeau « Bloc TVA : lectures divergentes ».
 * Lectures FICTIVES à la forme de doc21 (ticket de quincaillerie : 2 outils, quantité 1 sans unité, une rangée de TVA 8,1 %), rapprochées par le vrai
 * `reconcileInvoiceVision` comme le fait aiTask ; Gemini n'est jamais appelé, aucune valeur de la vraie pièce.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async () => ({ transactionId: 'TX-test' }), confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { entete, ligne, lire } from '../rapprochement/aide';

const ticket = (code: string) => lire(entete({ vendor: 'Quincaillerie Fictive SA', documentType: 'receipt', amountTTC: 51.8, tvaAmount: 3.88, tvaRate: 0.081,
  vat: [{ code, rate: 0.081, base: 51.8, amount: 3.88 }],
  items: [ligne({ name: 'Outil fictif A', kind: 'equipment', unit: '', price: 43.5, amountTTC: 43.5, vatCode: code }), ligne({ name: 'Outil fictif B', kind: 'equipment', unit: '', price: 8.3, amountTTC: 8.3, vatCode: code })] }));

async function ouvrir(result: any) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValue({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'ticket.pdf', mimeType: 'application/pdf', result: JSON.parse(JSON.stringify(result)) });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'ticket.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  return view;
}
const aControler = (v: ReturnType<typeof render>) => Number(v.container.querySelector('[data-va="controler"]')?.textContent?.match(/\d+/)?.[0] ?? 0);

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.traduire.mockReset(); state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('LT-5 à l’écran : deux lectures du même ticket dont seul le code de TVA diffère', () => {
  it('ni « Bloc TVA : lectures divergentes », ni ligne « à contrôler » ; la lecture n’est pas en désaccord', async () => {
    const { result } = reconcileInvoiceVision([ticket('N'), ticket('%-TVA1')]);
    const v = await ouvrir(result);
    expect(v.container.textContent).not.toMatch(/Bloc TVA : lectures divergentes/);
    expect(aControler(v)).toBe(0);
  });
});
