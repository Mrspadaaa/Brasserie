// @vitest-environment jsdom
/**
 * Lecture en ligne du 08.11 (point 1) : doc2, facture d'un cabinet vétérinaire, total 768,55, TVA 56,61 imprimée sur deux taux (0,50 à 2,6 % + 56,11 à 8,1 %) : la tuile TVA affichait « — ».
 * Cause : la lecture rend `tvaAmount: null` (aucun total de TVA n'est imprimé en toutes lettres) mais le bloc `vat` complet, avec le montant de chaque taux. Le serveur le recoupe depuis LP-2
 * (functions/src/invoiceVisionReview.ts) pour le final à 2 ou 3 lectures ; l'écran, lui, ne lisait QUE `result.tvaAmount` (finale.ts `enteteDeLecture`, ExpenseSheet `tvaLue`) : une lecture seule,
 * le provisoire, un résultat en cache ou d'un serveur d'avant LP-2 laissaient « — » devant un bloc imprimé et lu.
 * La lecture est une vraie sortie stockée du banc k6 (doc2, variante Csv8, avant LP-2), ANONYMISÉE (fournisseur, numéro, actes et médicaments remplacés par des libellés neutres ; montants,
 * taux, bloc `vat` et contrôles inchangés) : ./doc2.json. Aucune donnée personnelle dans Git. Aucun appel à Gemini.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import doc2 from './doc2.json';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => state.writes.push(['transaction', tx]), addStockItem: (...a: any[]) => state.writes.push(['stock', ...a]), addEquipment: (i: any) => state.writes.push(['equipment', i]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => {}, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => state.writes.push(['transaction', tx]) } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: () => ({ id: 'proof' }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { enteteDeLecture } from '../../../../src/ui/depense/finale';

const copie = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const lectureDoc2 = (plus: Record<string, unknown> = {}): any => ({ ...copie(doc2), ...plus });
const AVANT = { description: '', lines: [] } as any;

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('doc2 : la TVA imprimée sur deux taux (l’en-tête du brouillon)', () => {
  it('la lecture réelle (tvaAmount null, bloc 0,50 + 56,11) pose 56,61 dans le brouillon', () => {
    const lue = lectureDoc2();
    expect(lue.tvaAmount).toBeNull();
    expect(lue.vat.map((r: any) => r.amount)).toEqual([0.5, 56.11]);
    expect(enteteDeLecture(AVANT, lue, '08.11.2026').sourceVatAmount).toBe(56.61);
  });
  it('un total de TVA lu prime sur la somme du bloc (jamais deux sources mélangées)', () => {
    expect(enteteDeLecture(AVANT, lectureDoc2({ tvaAmount: 56.61 }), '08.11.2026').sourceVatAmount).toBe(56.61);
    expect(enteteDeLecture(AVANT, lectureDoc2({ tvaAmount: 40 }), '08.11.2026').sourceVatAmount).toBe(40);
  });
  it('sans bloc lu, la TVA reste inconnue (jamais 0, jamais déduite du total)', () => {
    expect(enteteDeLecture(AVANT, lectureDoc2({ vat: [] }), '08.11.2026').sourceVatAmount).toBeUndefined();
    expect(enteteDeLecture(AVANT, lectureDoc2({ vat: undefined }), '08.11.2026').sourceVatAmount).toBeUndefined();
  });
  it('un bloc dont un taux n’a pas de montant lu : pas de somme (elle serait fausse)', () => {
    const bloc = [{ code: 'TVA', rate: 0.026, base: 19.2, amount: 0.5 }, { code: 'TVA', rate: 0.081, base: 692.74, amount: null }];
    expect(enteteDeLecture(AVANT, lectureDoc2({ vat: bloc }), '08.11.2026').sourceVatAmount).toBeUndefined();
  });
  it('un bloc que le contrôle serveur dit en écart avec le document n’est pas posé', () => {
    const lue = lectureDoc2(); lue.controls = { ...lue.controls, vat: { statut: 'ecart', base: 'HT' } };
    expect(enteteDeLecture(AVANT, lue, '08.11.2026').sourceVatAmount).toBeUndefined();
  });
  it('une somme de bloc plus grande que le total TTC lu est absurde : pas posée', () => {
    expect(enteteDeLecture(AVANT, lectureDoc2({ amountTTC: 50 }), '08.11.2026').sourceVatAmount).toBeUndefined();
  });
});

const lireSurEcran = async (result: any) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: [], cleaning: [], equipment: [] };
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};

describe('doc2 sur l’écran Dépense', () => {
  it('la tuile TVA affiche 56,61 (et plus « — »), et son panneau dit les deux taux', async () => {
    const view = await lireSurEcran(lectureDoc2());
    const tuile = view.container.querySelector('[data-dp="tuile-tva"]') as HTMLElement;
    expect(tuile.textContent).toContain('56,61');
    expect(tuile.textContent).not.toContain('—');
    fireEvent.click(tuile);
    const panneau = view.container.querySelector('[data-dp="panneau-tva"]') as HTMLElement;
    expect(panneau.textContent).toMatch(/0,50/);
    expect(panneau.textContent).toMatch(/2,6 ?%/);
    expect(panneau.textContent).toMatch(/56,11/);
    expect(panneau.textContent).toMatch(/8,1 ?%/);
    expect([...panneau.querySelectorAll('button')].some(b => /56,61/.test(b.textContent ?? '') && b.getAttribute('aria-pressed') === 'true')).toBe(true);
  });
  it('sans bloc lu, la tuile garde « — » et le panneau n’invente aucun taux', async () => {
    const view = await lireSurEcran(lectureDoc2({ vat: [] }));
    const tuile = view.container.querySelector('[data-dp="tuile-tva"]') as HTMLElement;
    expect(tuile.textContent).toContain('—');
    fireEvent.click(tuile);
    const panneau = view.container.querySelector('[data-dp="panneau-tva"]') as HTMLElement;
    expect(panneau.textContent).not.toMatch(/2,6 ?%|8,1 ?%/);
  });
});
