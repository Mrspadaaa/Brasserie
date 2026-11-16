// @vitest-environment jsdom
/**
 * p3, bloquant 1 (jeu en ligne 5, passage f) : deux photos servies du CACHE rendaient une dépense vide (« Fournisseur — », « Ligne sans libellé », total « — »).
 * Cause : `finLecture` posait le provisoire reconstruit (`setDraft`) puis lançait la fusion du final dans un `setTimeout(0)` : dans un navigateur le minuteur peut passer AVANT le rendu qui met à jour `draftCourant`,
 * la fusion lisait alors le brouillon VIDE d'avant la lecture (tout lui semblait « touché ») et son `setDraft(()=>s.draft)` écrasait le provisoire. Ici le minuteur est rendu immédiat : le cas le plus défavorable.
 * Lecture FICTIVE (`lecturesLenteur`) ; Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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
const rangee = (view: ReturnType<typeof render>, cle: string) => view.container.querySelector<HTMLElement>(`[data-dp="preuve"] [data-dp-controle-cle="${cle}"]`);

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/** Un final tel que le cache le sert : aucun jeton de flux, aucun rang provisoire, `retirees` écrit par le serveur. */
function finalDuCache() {
  const { provisoire, final } = lecturesLenteur('perdue');
  const avoine = provisoire!.items.find(i => i.name === 'Avoine maltée')!;
  Object.assign(final, { paymentMethod: 'twint', terminalAmount: 46.4, amountPaid: undefined, amountTTC: 44.7, tvaAmount: 0 });
  delete (final as any).provisoireJeton;
  for (const i of final.items) delete (i as any).rangProvisoire;
  (final as any).retirees = { lignes: [{ rang: provisoire!.items.indexOf(avoine), ligne: avoine }], amountTTC: 46.4, tvaAmount: 0.37 };
  return final;
}
async function servirDuCache(final: any, minuteurImmediat: boolean) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockImplementation(async () => sortie(structuredClone(final)));
  if (minuteurImmediat) {
    const vrai = window.setTimeout.bind(window);
    vi.spyOn(window, 'setTimeout').mockImplementation(((fn: any, ms?: number, ...a: any[]) => { if (!ms && typeof fn === 'function') { fn(...a); return 0 as any; } return vrai(fn, ms, ...a); }) as any);
  }
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await waitFor(() => expect(view.container.querySelector('[data-dp-perdue]')).not.toBeNull());
  await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  return view;
}

describe('p3 bloquant 1 : un final servi du cache s’affiche comme le final d’une lecture neuve', () => {
  for (const minuteurImmediat of [false, true]) {
    it(`fournisseur, total et lignes lus restent (minuteur ${minuteurImmediat ? 'avant le rendu' : 'normal'}) ; la ligne retirée est barrée`, async () => {
      const view = await servirDuCache(finalDuCache(), minuteurImmediat);
      expect((view.container.querySelector('#purchase-total') as HTMLInputElement).value).toMatch(/44[,.]70/);
      const texte = view.container.textContent ?? '';
      expect(texte).toMatch(/Brauhaus Ouest/);
      expect(texte).toMatch(/Malt Pilsner/);
      expect(texte).not.toMatch(/Ligne sans libellé/);
      expect(texte).not.toMatch(/Total non imprimé/);
      expect(rangee(view, 'retirees')!.textContent).toMatch(/1 ligne lue puis retirée\s*1,70/);
      expect(rangee(view, 'total-corrige')!.textContent).toMatch(/46,40 → 44,70/);
    });
  }
  it('un final du cache sans `retirees` ne passe pas par la fusion : même écran qu’une lecture neuve', async () => {
    const final = finalDuCache(); delete (final as any).retirees;
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.scanned.mockImplementation(async () => sortie(structuredClone(final)));
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await waitFor(() => expect((view.container.querySelector('#purchase-total') as HTMLInputElement).value).toMatch(/44[,.]70/));
    expect(view.container.textContent).toMatch(/Malt Pilsner/);
  });
});
