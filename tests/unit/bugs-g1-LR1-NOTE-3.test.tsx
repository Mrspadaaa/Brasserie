// @vitest-environment jsdom
// LR1-NOTE-3 (g1, 20.11) : « BAC A en pièce / L » (BAUHAUS). Lecture réelle rejouée le 20.11 (doc24 et doc25, 3 tirages) : « BAC A … », kind equipment, quantité 1 ou vide, unité vide, prix 5,20 ;
// anonymisée ici (nom coupé, montants arrondis). La ligne ne doit pas sortir en litres : un bac à peinture est une pièce, jamais « L ».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[] }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: vi.fn(), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async () => ({ transactionId: 'TX-test' }), confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
import { apercuDepense } from '../../src/ui/depense/apercuDev';

beforeEach(() => { cleanup(); vi.restoreAllMocks(); state.transactions = []; vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('t'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); });
afterEach(cleanup);

describe('LR1-NOTE-3 : un bac à peinture lu sans unité n’est pas en litres', () => {
  it.each([[1, 'une quantité 1'], [null, 'sans quantité']])('quantité %s (%s) : la rangée dit « pièce » ou rien, jamais « L »', async (quantite) => {
    const ap = apercuDepense('montant-deduit');
    if (!ap.outcome.ok) throw new Error('lecture attendue');
    const it0 = ap.outcome.result.items[0] as any;
    Object.assign(it0, { name: 'BAC A PEINTURE', kind: 'equipment', quantity: quantite, unit: '', price: 5.2, amountTTC: 5.2, montantDeduit: undefined });
    Object.assign(ap.outcome.result, { amountTTC: 5.2 + 711.7 + 41.15 + 15.7 });
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={ap}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    const rangee = document.querySelector('[data-dp-ligne="line-1"] summary') as HTMLElement;
    const qte = (rangee.querySelector('[data-dp-qte]') as HTMLElement).textContent ?? '';
    const segments = Array.from(document.querySelectorAll('[data-dp-ligne="line-1"] [data-dp-unite-segments] button')).map(b => b.textContent);
    expect(qte).not.toMatch(/\bL\b/);
    expect(rangee.textContent).not.toMatch(/pièce \/ L/);
  });
});
