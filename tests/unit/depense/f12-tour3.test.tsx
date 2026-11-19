// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f12 (constats du pilote sur la Dépense, capture f10-doc2-lectures-1280-cave) :
 * P-1 : un acte vétérinaire rangé sous « Services » (LR2-7) montrait « Matériel » au choix de nature et s'enregistrait `other` ;
 * P-2 : un barré dont la seule différence est une valeur inconnue (« ? ») ne dit rien (« Collerette … · ? », « 3 cp × ? · ? »).
 * Lectures FICTIVES (noms de la forme du doc2, aucune valeur d'une vraie pièce) ; Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { barreSansInfo, libelleAvant } from '../../../src/ui/depense/finale';

const sortie = (result: any) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result });
const fichier = (view: ReturnType<typeof render>) => {
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
};
const item = (id: string, name: string, kind: string, amountTTC: number) => ({ id, name, kind, quantity: 1, unit: 'pièce', price: amountTTC, amountTTC, reference: '', variant: '', stockCategory: '', evidence: '', ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });
/** doc2 (forme) : trois actes vétérinaires lus `unknown` ou `equipment`, et un médicament (fournitures : la nature lue reste). */
async function lireVeto() {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { final } = lecturesLenteur('sans-38') as any;
  const items = [
    item('line-1', 'Sedation IM, pose catheter, induction narcose propofol, intubation et narcose gazeuse (FICTIF)', 'unknown', 120),
    item('line-2', 'Sterilisation de la chienne ovariectomie (FICTIF)', 'equipment', 300),
    item('line-3', 'Injection sous-cutanee petits animaux (FICTIF)', 'unknown', 10),
    item('line-4', 'Collerette ROUGE 25cm (FICTIF)', 'equipment', 18),
  ];
  Object.assign(final, { vendor: 'Cabinet vétérinaire FICTIF', category: 'divers', amountTTC: 448, items, printedLineCount: 4, description: 'Soins (SIMULÉ)',
    controls: { ...final.controls, lines: { checked: 4, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' } } });
  state.scanned.mockResolvedValue(sortie(final));
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  fichier(view);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await waitFor(() => expect(view.container.querySelectorAll('article[data-purchase-line]').length).toBe(4));
  return view;
}

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('P-1 : un acte rangé sous « Services » a la nature Service, à l’écran et à l’enregistrement', () => {
  it('le choix de nature allume « Service » sur les actes ; la collerette garde « Matériel »', async () => {
    const view = await lireVeto();
    const allume = (id: string) => view.container.querySelector(`article[data-purchase-line][data-dp-ligne="${id}"] [data-dp-nature] [aria-pressed="true"]`)?.textContent;
    const ouvrir = (id: string) => { const d = view.container.querySelector<HTMLDetailsElement>(`article[data-purchase-line][data-dp-ligne="${id}"] details[data-dp-plateau]`)!; d.open = true; fireEvent(d, new Event('toggle')); };
    for (const id of ['line-1', 'line-2', 'line-3', 'line-4']) { ouvrir(id); await waitFor(() => expect(allume(id), id).toBeTruthy()); }
    expect(['line-1', 'line-2', 'line-3', 'line-4'].map(allume)).toEqual(['Service', 'Service', 'Service', 'Matériel']);
  });
  it('« Confirmer » enregistre `kind: service` pour les actes, `equipment` pour la collerette', async () => {
    const view = await lireVeto();
    fireEvent.click(view.container.querySelector<HTMLButtonElement>('[data-primary]')!);
    await waitFor(() => expect(state.saved).toHaveBeenCalled());
    const kinds = state.saved.mock.calls[0][0].lines.map((l: any) => [l.description.slice(0, 12), l.kind]);
    expect(kinds).toEqual([['Sedation IM,', 'service'], ['Sterilisatio', 'service'], ['Injection so', 'service'], ['Collerette R', 'equipment']]);
  });
});

describe('P-2 : un barré dont la seule différence est une valeur inconnue ne s’affiche pas', () => {
  const avant = { description: 'Collerette Velfast ROUGE 25cm', quantity: 1, unit: 'pièce' } as const;
  it('« Collerette Velfast ROUGE 25cm · ? » sous le même nom (montant lu ensuite) : muet', () => {
    const cs = [{ champ: 'imprime' as const }, { champ: 'amount' as const }];
    const courant = { ...avant, amount: 18.05, unitPrice: 18.05 };
    expect(libelleAvant(avant, cs, courant)).toBe('Collerette Velfast ROUGE 25cm · ?');
    expect(barreSansInfo(avant, cs, courant)).toBe(true);
  });
  it('« 3 cp × ? · ? » (quantité identique, prix et montant lus ensuite) : muet', () => {
    const base = { description: 'Rimadyl 50mg', quantity: 3, unit: 'cp' };
    const cs = [{ champ: 'unitPrice' as const }, { champ: 'amount' as const }];
    const courant = { ...base, unitPrice: 1.5, amount: 4.5 };
    expect(libelleAvant(base, cs, courant)).toBe('3 cp × ? · ?');
    expect(barreSansInfo(base, cs, courant)).toBe(true);
  });
  it('« Combiclav 250 /cp · 8 cp × ? · ? » : muet', () => {
    const base = { description: 'Combiclav 250 /cp', quantity: 8, unit: 'cp' };
    const cs = [{ champ: 'description' as const }, { champ: 'unitPrice' as const }, { champ: 'amount' as const }];
    const courant = { ...base, unitPrice: 1.9, amount: 15.2 };
    expect(libelleAvant(base, cs, courant)).toBe('Combiclav 250 /cp · 8 cp × ? · ?');
    expect(barreSansInfo(base, cs, courant)).toBe(true);
  });
  it('un barré qui parle reste : autre nom, autre quantité, autre prix', () => {
    const base = { description: 'Malt Pilsner', quantity: 10, unit: 'kg', unitPrice: 1.45, amount: 14.5 };
    expect(barreSansInfo(base, [{ champ: 'quantity' }, { champ: 'unitPrice' }], { ...base, quantity: 5, unitPrice: 2.9 })).toBe(false);
    expect(barreSansInfo(base, [{ champ: 'unitPrice' }], { ...base, unitPrice: 1.5 })).toBe(false);
    expect(barreSansInfo({ ...base, description: 'Colerette bleue' }, [{ champ: 'description' }, { champ: 'amount' }], { ...base, description: 'Collerette ROUGE 25cm', amount: 18 })).toBe(false);
    // Une quantité connue autre, un prix inconnu : la quantité parle.
    expect(barreSansInfo({ description: 'Rimadyl', quantity: 2, unit: 'cp' }, [{ champ: 'quantity' }, { champ: 'unitPrice' }], { description: 'Rimadyl', quantity: 3, unit: 'cp', unitPrice: 1.5 })).toBe(false);
  });
});
