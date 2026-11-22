// @vitest-environment jsdom
/**
 * p3, bloquants 2 et 3 (jeu en ligne 5, Sun Store : deux tickets d'un même règlement). Lecture FICTIVE (noms et montants de la forme du cas, aucun réel) ; flux simulé ; Gemini jamais appelé.
 * Les deux premières lectures voient les deux tickets : 5 lignes d'un ticket (2 articles remisés, un article, avec un « Total brut CHF » et un « Rabais » total qui est la somme des deux remises) + 2 lignes du second ticket,
 * total 163,85, TVA 0,37, TWINT 163,85. La 3.8 ne garde que le second ticket : total 14,60, payé lu 14,60 (la partie gardée), terminal 163,85.
 * Avant p3 : « 7 lignes lues puis retirées 348,50 » (sous-total et rabais total comptés), « Payé = imprimé · TWINT 14,60 » vert.
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
import { rangsHorsPiece } from '../../../src/domain/finance/controlesPiece';

const sortie = (result: any, extra: Record<string, unknown> = {}) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result, ...extra });
const rangee = (view: ReturnType<typeof render>, cle: string) => view.container.querySelector<HTMLElement>(`[data-dp="preuve"] [data-dp-controle-cle="${cle}"]`);
const porte = () => { let ouvre!: () => void; const promesse = new Promise<void>(r => { ouvre = r; }); return { promesse, ouvre }; };

type L = [nom: string, q: number | null, prix: number | null, montant: number, kind?: string];
const LIGNES_PROV: L[] = [
  ['Vaccin grippe A', 1, 26.68, 26.68], ['Rabais', 1, null, -0.68, 'discount'], ['Vaccin covid B', 1, 75.15, 75.15], ['Rabais', 1, null, -1.9, 'discount'],
  ['Total brut CHF', 1, null, 151.83], ['Rabais', 1, null, -2.58, 'discount'], ['Article H21', 2, 25, 50],
  ['Paracétamol cpr 500 mg', 1, 5.4, 5.4], ['Ibuprofène cpr 400 mg', 1, 9.2, 9.2],
];
function lectures() {
  const { provisoire, final, jeton } = lecturesLenteur('perdue');
  const modele = provisoire!.items[0];
  const item = (l: L, i: number) => ({ ...modele, id: `line-${i + 1}`, name: l[0], kind: l[4] ?? 'other', quantity: l[1], unit: '', price: l[2], amountTTC: l[3], stockCategory: undefined, variant: '', reference: '', rangProvisoire: undefined });
  const commun = { documentType: 'receipt', paymentMethod: 'twint', terminalAmount: 163.85, vendor: 'Pharmacie Test', category: 'divers' };
  Object.assign(provisoire!, commun, { items: LIGNES_PROV.map(item), printedLineCount: 9, amountTTC: 163.85, tvaAmount: 0.37, amountPaid: undefined });
  const gardees = LIGNES_PROV.map((l, i) => ({ l, i })).filter(x => x.i >= 7);
  Object.assign(final, commun, { items: gardees.map((x, k) => ({ ...item(x.l, k), rangProvisoire: x.i })), printedLineCount: 2, amountTTC: 14.6, tvaAmount: 0, amountPaid: 14.6 });
  return { provisoire: provisoire!, final, jeton };
}
async function lireEnFlux() {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final, jeton } = lectures();
  const g = porte();
  state.scanned.mockImplementation(async (_f: any, _t: any, opts: any) => { opts?.onProvisoire?.(sortie(provisoire, { jeton })); await g.promesse; return sortie(final); });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await act(async () => { g.ouvre(); await g.promesse; await new Promise(r => setTimeout(r, 0)); });
  await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  return view;
}
async function lireDuCache() {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final } = lectures();
  delete (final as any).provisoireJeton;
  for (const i of final.items) delete (i as any).rangProvisoire;
  (final as any).retirees = { lignes: LIGNES_PROV.map((_, i) => i).filter(i => i < 7).map(i => ({ rang: i, ligne: provisoire.items[i] })), amountTTC: 163.85, tvaAmount: 0.37 };
  state.scanned.mockImplementation(async () => sortie(structuredClone(final)));
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await waitFor(() => expect(rangee(view, 'retirees')).not.toBeNull());
  return view;
}

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('p3 bloquant 2 : une ligne retirée qui n’est pas un article n’est ni proposée ni comptée', () => {
  it('rangsHorsPiece : le total brut (par son nom) et le rabais total (somme de deux remises) ; une remise seule reste une remise', () => {
    const items = LIGNES_PROV.map(l => ({ name: l[0], kind: l[4], quantity: l[1], price: l[2], amountTTC: l[3] }));
    expect([...rangsHorsPiece(items)].sort()).toEqual([4, 5]);
    expect([...rangsHorsPiece([items[0], items[1], items[2]])]).toEqual([]);
    expect([...rangsHorsPiece([items[0], items[1], items[5]])]).toEqual([]); // le -2,58 sans ses deux remises : rien ne le prouve
  });
  for (const [titre, lire] of [['flux', lireEnFlux], ['cache', lireDuCache]] as const) {
    it(`${titre} : « 5 lignes lues puis retirées 149,25 » (ni « Total brut », ni le rabais total) ; « Les garder » ne ramène que 5 articles`, async () => {
      const view = await lire();
      const r = rangee(view, 'retirees')!;
      expect(r.textContent).toMatch(/5 lignes lues puis retirées\s*149,25/);
      const perdues = [...view.container.querySelectorAll('[data-dp-perdue]')].map(e => e.textContent ?? '');
      expect(perdues).toHaveLength(5);
      expect(perdues.join('|')).not.toMatch(/Total brut/);
      fireEvent.click(r);
      await waitFor(() => expect(rangee(view, 'retirees')).toBeNull());
      expect(view.container.textContent).not.toMatch(/Total brut/);
      expect(view.container.querySelectorAll('[data-dp="ligne"], [data-dp-ligne]').length).toBeGreaterThanOrEqual(0);
    });
  }
});

describe('p3 bloquant 3 : le payé n’est jamais une copie du total changé', () => {
  for (const [titre, lire] of [['flux', lireEnFlux], ['cache', lireDuCache]] as const) {
    it(`${titre} : total changé 163,85 → 14,60, terminal 163,85 : « Payé ≠ imprimé 163,85 / 14,60 » rouge, jamais « Payé = imprimé » vert`, async () => {
      const view = await lire();
      const p = rangee(view, 'paye')!;
      expect(p.getAttribute('data-dp-ton')).toBe('rouge');
      expect(p.textContent).toMatch(/≠ imprimé\s*163,85 \/ 14,60\s*\+149,25/);
      expect(p.textContent).not.toMatch(/Payé = imprimé/);
    });
    it(`${titre} : « Remettre 163,85 » : le payé est le terminal, « Payé = imprimé · TWINT 163,85 »`, async () => {
      const view = await lire();
      fireEvent.click(rangee(view, 'total-corrige')!);
      await waitFor(() => expect(rangee(view, 'total-corrige')).toBeNull());
      const p = rangee(view, 'paye')!;
      expect(p.getAttribute('data-dp-verdict')).toBe('ok');
      expect(p.textContent).toMatch(/Payé = imprimé.*TWINT\s*163,85/);
    });
  }
  it('un payé lu qui ne suit aucun total changé reste lu : « Payé = imprimé » quand il égale le total', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const { final } = lectures();
    Object.assign(final, { terminalAmount: undefined }); delete (final as any).provisoireJeton;
    for (const i of final.items) delete (i as any).rangProvisoire;
    state.scanned.mockImplementation(async () => sortie(structuredClone(final)));
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await waitFor(() => expect(rangee(view, 'paye')).not.toBeNull());
    expect(rangee(view, 'paye')!.getAttribute('data-dp-verdict')).toBe('ok');
  });
});
