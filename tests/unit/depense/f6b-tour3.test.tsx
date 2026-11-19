// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f6b (Dépense, constats de la vision locale v3) : LR1-9, v3-1, LR1-6 réserve, v3-5, LR1-7 réserve, v3-2, v3-7/v3-8.
 * Lectures FICTIVES (forme du doc2 : Collerette, variante lue par une seule lecture) ; Gemini jamais appelé.
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
import { lecturesLenteur } from '../../../src/ui/depense/apercuDev';

const sortie = (result: any) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result });
const fichier = (view: ReturnType<typeof render>) => {
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
};
const desaccord = (o: Record<string, unknown>) => ({ code: 'lectures-divergentes', gravite: 'ecart', origine: 'lecture', bloque: false, regle: 'les lectures indépendantes lisent la même valeur', lu: null, calcule: null, ecart: null, unite: 'texte', source: 'désaccord', pese: true, ...o });
/** doc2 (forme) : le règlement (sans ligne) d'abord, puis la variante de la ligne 2 lue par une seule lecture. */
const POINTS_DOC2 = [
  desaccord({ enjeu: 'info', champ: 'paymentEvidence', champs: ['paymentEvidence'], ligne: null, cle: 'lectures-divergentes:-:paymentEvidence', luTexte: 'unknown', message: 'Paiement : lectures divergentes (unknown / unpaid), vérifier le justificatif.', valeurs: [{ lecture: 1, valeur: 'unknown', retenue: true }, { lecture: 2, valeur: 'unpaid', retenue: false }] }),
  desaccord({ enjeu: 'stock', champ: 'items', champs: ['items.2.variant'], ligne: 2, cle: 'lectures-divergentes:2:variant', message: 'Collerette Velfast — taille ou variante : lectures divergentes (absent / ROUGE 25cm), vérifier les articles du justificatif.', valeurs: [{ lecture: 1, valeur: null, retenue: true }, { lecture: 2, valeur: 'ROUGE 25cm', retenue: false }] }),
];
async function lire(maj: (final: any) => void = () => {}) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { final } = lecturesLenteur('perdue') as any;
  maj(final);
  state.scanned.mockResolvedValue(sortie(final));
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  fichier(view);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await waitFor(() => expect(view.container.querySelector('article[data-purchase-line]')).not.toBeNull());
  return view;
}
const rangees = (view: ReturnType<typeof render>) => [...view.container.querySelectorAll<HTMLElement>('article[data-purchase-line]')];

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('LR1-9 : « Voir le désaccord » ouvre la ligne en désaccord et y montre les deux lectures', () => {
  it('doc2 (forme) : 1er toucher → ligne 2 ouverte, rangée « les lectures diffèrent · variante : « — » / « ROUGE 25cm » » ; 2e → le règlement', async () => {
    const view = await lire(f => { f.points = POINTS_DOC2; f.review = { ...f.review, readers: 2 }; });
    const voir = await waitFor(() => { const b = view.container.querySelector<HTMLElement>('[data-dp-renvoi="lectures"]'); expect(b).not.toBeNull(); return b!; });
    expect(voir.textContent).toMatch(/Voir le désaccord/);
    await act(async () => { fireEvent.click(voir); });
    const l2 = rangees(view)[1];
    expect(l2.querySelector('details')!.open).toBe(true);
    const marque = l2.querySelector<HTMLElement>('[data-dp-desaccord-ligne]');
    expect(marque).not.toBeNull();
    expect(marque!.textContent).toBe('les lectures diffèrent · variante : « — » / « ROUGE 25cm »');
    expect(rangees(view)[0].querySelector('[data-dp-desaccord-ligne]')).toBeNull();
    await act(async () => { fireEvent.click(view.container.querySelector<HTMLElement>('[data-dp-renvoi="lectures"]')!); });
    expect(view.container.querySelector('[data-dp="panneau-paye"]')!.className).toMatch(/\bblock\b/);
  });
});

describe('v3-1 : à 1280, la colonne d’une lecture tient la preuve (420) ET la liste (760), pas 760 en tout', () => {
  it('sans lecture : colonne 760 (saisie à la main, u1 n° 18) ; avec lecture : 1220 = 420 + 16 + 760 + 24', async () => {
    const vide = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    expect(vide.container.querySelector('[data-dp="colonne"]')!.className).toMatch(/lg:max-w-\[760px\]/);
    cleanup();
    const view = await lire();
    const colonne = view.container.querySelector('[data-dp="colonne"]')!;
    expect(colonne.className).toMatch(/lg:max-w-\[1220px\]/);
    expect(colonne.className).not.toMatch(/lg:max-w-\[760px\]/);
  });
});
