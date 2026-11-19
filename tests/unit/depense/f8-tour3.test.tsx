// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f8 (Dépense) : v3-6. Constat de la vision v3 (M9-3) : après « Retirer la ligne 3 » voulu par le brasseur, l'app disait « 2,40 CHF manquants »
 * et « Ajouter la ligne manquante » : un retrait volontaire n'est pas un manque. Il se dit « 1 ligne retirée · 2,40 », jamais un appel à rajouter.
 * Lecture FICTIVE (3 lignes, total imprimé = leur somme, 3 lignes annoncées) ; Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { controlesCroises, type EntreeControles } from '../../../src/ui/finance/controlesCroises';
import { phraseDuPied } from '../../../src/ui/depense/phrasePied';

const state = vi.hoisted(() => ({ saved: vi.fn(), scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';

const base: EntreeControles = { lignesCents: 8410, nLignes: 22, nAjoutes: 0, ajoutsCents: 0, totalCents: 8650, attendus: 23, payeCents: 8650, moyen: 'TWINT', qte: { ok: true, valeur: '22/22' } };

describe('v3-6 : un retrait volontaire n’est pas un manque (contrôles)', () => {
  it('sans retrait : 2,40 manquants et « Ajouter la ligne manquante » (le vrai manque reste dit)', () => {
    const c = controlesCroises(base);
    expect(c.resume).toBe('2,40 CHF manquants');
    expect(c.rangs.some(r => r.geste === 'Ajouter la ligne manquante')).toBe(true);
  });
  it('1 ligne retirée par le brasseur (2,40) : ni manque, ni geste d’ajout, ni drapeau ; la somme dit « 1 ligne retirée · 2,40 »', () => {
    const c = controlesCroises({ ...base, retraitsBrasseur: { n: 1, cents: 240 } });
    expect(c.resume).not.toMatch(/manquant/);
    expect(c.rangs.every(r => r.verdict !== 'ecart')).toBe(true);
    expect(c.drapeau).toBe(false);
    expect(c.rangs.some(r => /Ajouter|manquant/.test(`${r.texte} ${r.valeurs} ${r.geste ?? ''}`))).toBe(false);
    const somme = c.rangs.find(r => r.cle === 'somme')!;
    expect(somme.verdict).toBe('inconnu');
    expect(`${somme.texte} ${somme.valeurs}`).toMatch(/1 ligne retirée · 2,40/);
    const articles = c.rangs.find(r => r.cle === 'articles')!;
    expect(articles.verdict).toBe('inconnu');
    expect(articles.valeurs).toMatch(/1 retirée/);
  });
  it('un manque plus grand que le retrait reste un manque (le retrait n’efface que sa part)', () => {
    const c = controlesCroises({ ...base, lignesCents: 7410, nLignes: 21, retraitsBrasseur: { n: 1, cents: 240 } });
    expect(c.drapeau).toBe(true);
    expect(c.resume).toMatch(/manquants/);
  });
  it('le pied : « Lignes 84,10 = total 86,50 − 2,40 retiré (Bouchons) », sans attention', () => {
    const fr = (n: number) => (n / 100).toFixed(2).replace('.', ',');
    const p = phraseDuPied(8410, 8650, [], fr, [{ nom: 'Bouchons', cents: 240 }]);
    expect(p).toEqual({ texte: 'Lignes 84,10 = total 86,50 − 2,40 retiré (Bouchons)', attention: false });
    expect(phraseDuPied(8410, 8650, [], fr).attention).toBe(true);
  });
});

const lecture = () => ({ vendor: 'Fournisseur fictif', date: '09.09.2026', currency: 'CHF', invoiceNumber: 'TEST-F8', description: 'Petit matériel', amountTTC: 86.5, category: 'materiel', subcategory: 'Brasserie', issues: [] as string[],
  printedLineCount: 3, review: { status: 'checked', findings: [], readers: 2 },
  items: [{ id: 'line-1', name: 'Tuyau silicone', kind: 'equipment', quantity: 1, unit: 'pièce', amountTTC: 60, evidence: 'Tuyau silicone — CHF 60.00' },
    { id: 'line-2', name: 'Collier inox', kind: 'equipment', quantity: 1, unit: 'pièce', amountTTC: 24.1, evidence: 'Collier inox — CHF 24.10' },
    { id: 'line-3', name: 'Bouchons', kind: 'equipment', quantity: 1, unit: 'pièce', amountTTC: 2.4, evidence: 'Bouchons — CHF 2.40' }] });

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('v3-6 : la feuille Dépense après « Retirer la ligne 3 »', () => {
  it('dit « 1 ligne retirée · 2,40 », jamais « manquants » ni « Ajouter la ligne manquante » ; « ↶ Annuler » rend le contrôle d’avant', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.scanned.mockResolvedValue({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result: lecture() });
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    const bloc = await screen.findByRole('region', { name: 'Vérification du justificatif' });
    await waitFor(() => expect(view.container.querySelectorAll('article[data-purchase-line]').length).toBe(3));
    expect(bloc.textContent).toMatch(/Somme = imprimé/);
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Retirer la ligne 3' })[0]); });
    await waitFor(() => expect(view.container.querySelectorAll('article[data-purchase-line]').length).toBe(2));
    const tout = view.container.textContent ?? '';
    expect(tout).not.toMatch(/manquants?\b/);
    expect(screen.queryByRole('button', { name: /Ajouter la ligne manquante/ })).toBeNull();
    expect(tout).not.toMatch(/2,40 de moins|non retrouvé/);
    expect(bloc.textContent).toMatch(/1 ligne retirée · 2,40/);
    expect(tout).toMatch(/− 2,40 retiré/);
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /Annuler/ }).find(b => /Annuler/.test(b.textContent ?? ''))!); });
    await waitFor(() => expect(view.container.querySelectorAll('article[data-purchase-line]').length).toBe(3));
    expect(bloc.textContent).toMatch(/Somme = imprimé/);
    expect(bloc.textContent).not.toMatch(/retirée/);
  });
});
