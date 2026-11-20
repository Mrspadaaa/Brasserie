// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f14 (CT3-52 / E1-2) : Dépense saisie à la main, « pièce » choisie sur une ligne puis « Ajouter une ligne » dans le même geste :
 * la ligne ajoutée se calculait sur le brouillon du rendu (périmé) et effaçait l’unité qui venait d’être posée (« art2 · 3 » sans unité).
 * Aucune valeur réelle ; flux simulé ; Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], saved: vi.fn(), scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const boutons = (view: ReturnType<typeof render>) => [...view.container.querySelectorAll<HTMLButtonElement>('button')];
const ajouter = (view: ReturnType<typeof render>) => boutons(view).find(b => (b.textContent ?? '').trim().endsWith('Ajouter une ligne'))!;
const pieceDe = (view: ReturnType<typeof render>, n: number) => {
  const groupe = view.container.querySelector(`[aria-label="Unité ligne ${n}"],[aria-label="Unité à remplir, ligne ${n}"]`);
  return [...(groupe?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(b => (b.textContent ?? '').trim() === 'pièce')!;
};

describe('CT3-52 / E1-2 : une unité posée n’est pas perdue par la ligne ajoutée dans le même geste', () => {
  it('« pièce » sur la ligne 2, puis « Ajouter une ligne » avant le rendu : la ligne 2 garde « pièce » (son groupe « Unité à remplir » a laissé la place au segment)', async () => {
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const total = view.container.querySelector<HTMLInputElement>('#purchase-total')!;
    await act(async () => { fireEvent.focus(total); fireEvent.change(total, { target: { value: '90' } }); fireEvent.blur(total); });
    await act(async () => { fireEvent.click(ajouter(view)); });
    await act(async () => { fireEvent.click(ajouter(view)); });
    expect(view.container.querySelector('[aria-label="Unité à remplir, ligne 2"]')).not.toBeNull();
    // Un seul `act` : les deux gestes arrivent avant que React ait rendu le premier (deux touchers rapprochés, ou un geste groupé).
    await act(async () => { fireEvent.click(pieceDe(view, 2)); fireEvent.click(ajouter(view)); });
    expect(view.container.querySelector('[aria-label="Unité à remplir, ligne 2"]')).toBeNull();
    expect(view.container.querySelector('[aria-label="Unité ligne 2"]')).not.toBeNull();
  });
});
