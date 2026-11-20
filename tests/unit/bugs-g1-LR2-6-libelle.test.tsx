// @vitest-environment jsdom
// LR2-6 (g1, 20.11), lisibilité : sur les captures `montant-deduit-*`, seul « à contrôler » (pastille du bandeau) se lisait ; le mot « déduit » ne vivait que dans un `title` (invisible au toucher).
// Sur la ligne même, sous le nom, un petit libellé visible dit « montant déduit (somme = total) » tant que le 0,00 déduit n'est pas remplacé ; il tombe dès qu'un autre montant est tapé.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);
});
afterEach(cleanup);

const ouvrir = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercuDepense('montant-deduit')}/>);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
};
const libelles = () => Array.from(document.querySelectorAll('[data-dp-montant-deduit]')) as HTMLElement[];

describe('LR2-6 : le libellé « déduit » se lit sur la ligne', () => {
  it('la ligne Sédation porte, visible, « montant déduit (somme = total) » ; les autres lignes rien', async () => {
    await ouvrir();
    const l = libelles();
    expect(l).toHaveLength(1);
    expect(l[0].closest('[data-dp-ligne]')!.getAttribute('data-dp-ligne')).toBe('line-1');
    expect(l[0].textContent).toMatch(/montant déduit \(somme = total\)/);
    expect(l[0].className).not.toMatch(/sr-only|hidden/); // lisible à l'écran, pas seulement aux lecteurs d'écran ou au survol
    expect(l[0].className).toMatch(/text-attention/);
  });
  it('dès qu’un autre montant est tapé sur la ligne, le libellé tombe', async () => {
    await ouvrir();
    const champ = screen.getByLabelText('Montant ligne 1') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '12,00' } }); fireEvent.blur(champ);
    expect(libelles()).toHaveLength(0);
  });
});
