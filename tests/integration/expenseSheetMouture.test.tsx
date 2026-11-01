// @vitest-environment jsdom
/**
 * Voie e-port, relecture R1 : le prix « avec mouture » que l'écran montre est celui que le catalogue écrira. Le parcours est complet :
 * l'écran (lecture simulée, Gemini jamais appelé) → le VRAI `savePurchase` (stockage factice, comme les autres tests d'enregistrement) → `latestBrewPrices`.
 * Cas 1 : malt relié → le prix affiché égale celui du catalogue. Cas 2 : malt non relié → rien n'est affiché et le catalogue n'écrit rien.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => { state.writes.push(['transaction', tx]); state.transactions.push(tx); }, addStockItem: (kind: any, item: any) => state.writes.push(['stock', kind, item]), addEquipment: (item: any) => state.writes.push(['equipment', item]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined, adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => { state.writes.push(['transaction', tx]); state.transactions.push(tx); } } }));
vi.mock('../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
// Le VRAI savePurchase : seul l'envoi Drive est simulé (savePurchaseWithProofReceipt appelle le vrai `savePurchase`, la confirmation est factice).
vi.mock('../../src/services/purchaseEntry', async importOriginal => { const entry = await importOriginal<any>(); return { ...entry, purchaseDuplicates: () => [], confirmPurchase: async () => undefined,
  savePurchaseWithProofReceipt: async (draft: any) => { try { return { transactionId: entry.savePurchase({ ...draft, proofDataUrl: undefined, proofFileName: undefined, proofType: undefined }) }; } catch (e) { console.error('SAVE-ERREUR', (e as Error).message); throw e; } } }; });
import { ExpenseSheet } from '../../src/ui/finance/ExpenseSheet';
import { latestBrewPrices } from '../../src/domain/finance/brewBudget';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';

const facture = () => ({ documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Malterie du Banc SA', date: '27.04.2026', currency: 'CHF', invoiceNumber: 'MB-372765', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 14.4, category: 'brassage', subcategory: '',
  description: 'Achat', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 }, points: [], controls: { lines: { checked: 2, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'ok', base: null }, totals: { statut: 'ok' } },
  items: [{ id: 'line-1', name: 'Maris Otter, Kg', kind: 'stock', quantity: 6, unit: 'Kg', price: 2.3, amountTTC: 13.8, stockCategory: 'malt' },
    { id: 'line-2', name: 'Zuschlag Schrotung', kind: 'service', quantity: 6, unit: 'Kg', price: 0.1, amountTTC: 0.6, reference: 'ISHOP-SCHROT' }] });

const ouvrir = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: [{ id: 'malt', ref: 'MP-001', name: 'Maris Otter', unit: 'kg', currentStock: 10, minStock: 0, reorder: false, category: 'Malt' }], cleaning: [], equipment: [] };
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: facture() });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const maltLigne = (view: { container: HTMLElement }) => view.container.querySelector('[data-dp-ligne="line-1"]') as HTMLElement; // R1 : par id
// La pastille visible « ✓ 2,40/Kg » porte son nom accessible « 2,40/Kg avec mouture » (un seul porteur, pas de doublon).
const affiche = (view: { container: HTMLElement }) => /([\d,]+)\/Kg avec mouture/.exec(maltLigne(view).querySelector('[data-dp-prixkg]')?.getAttribute('aria-label') ?? '')?.[1];
const enregistrer = async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' })); try { await waitFor(() => expect(state.transactions).toHaveLength(1), { timeout: 5000 }); } catch (e) { throw new Error('rien d’écrit (' + state.writes.map(w => w[0]).join(',') + ' écritures ; transactions ' + state.transactions.length + '). Alertes : ' + screen.queryAllByRole('alert').map(a => a.textContent).join(' | ') + ' · pied : ' + document.querySelector('footer')?.textContent, { cause: e }); } };

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.transactions = []; state.writes = []; state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('R1 (relecture) : le prix affiché « avec mouture » est celui du catalogue', () => {
  it('malt relié : l’écran montre 2,40/Kg, le vrai savePurchase écrit le lien, latestBrewPrices rend 14,40 CHF pour 6 kg (2,40/kg)', async () => {
    const view = await ouvrir();
    expect((screen.getByLabelText('Stock ligne 1') as HTMLSelectElement).value).toBe('existing');
    expect(affiche(view)).toBeUndefined(); // sans geste, aucun lien : rien d'affiché
    fireEvent.click(view.container.querySelector('[data-dp-mouture]')!);
    expect(affiche(view)).toBe('2,40');
    await enregistrer();
    expect(state.transactions[0].finance.lines[1]).toMatchObject({ kind: 'service', amountCents: 60, surchargeOfLineId: 'line-1' });
    const catalogue = latestBrewPrices(state.transactions)['MP-001'];
    expect(catalogue).toMatchObject({ amount: 14.4, quantity: 6, unit: 'Kg' });
    expect((catalogue.amount / catalogue.quantity).toFixed(2).replace('.', ',')).toBe(affiche(view));
  });
  it('malt non relié : rien n’est affiché, et le catalogue n’écrit aucun prix', async () => {
    const view = await ouvrir();
    fireEvent.click(view.container.querySelector('[data-dp-mouture]')!);
    expect(affiche(view)).toBe('2,40');
    fireEvent.click(screen.getByRole('switch', { name: 'Mettre en stock, ligne 1' }));
    expect((screen.getByLabelText('Stock ligne 1') as HTMLSelectElement).value).toBe('none');
    expect(affiche(view)).toBeUndefined();
    expect(maltLigne(view).querySelector('[data-dp-prixkg]')).toBeNull();
    expect(maltLigne(view).querySelector('[aria-label*="avec mouture"]')).toBeNull(); // toute la rangée : un aria-label n'est pas dans textContent
    expect(maltLigne(view).textContent).not.toMatch(/avec mouture/);
    await enregistrer();
    expect(latestBrewPrices(state.transactions)).toEqual({});
  });
});
