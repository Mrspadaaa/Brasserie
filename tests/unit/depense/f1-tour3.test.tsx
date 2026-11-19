// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f1 (Dépense, lecture des justificatifs) : LR1-6, LR1-7, LR1-10, LR1-12 (VERDICT-EN-LIGNE-1 de lecture-robuste, 10.11, reprises 5, 6 et 9, et n° 12).
 * Lectures FICTIVES (noms et montants de la forme des cas Sun Store et doc25, aucun réel) ; flux simulé ; Gemini jamais appelé.
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
import { controlesProvisoires, chercherLignes, type RangControle } from '../../../src/ui/finance/controlesCroises';
import { sansMotsBruts } from '../../../src/ui/depense/phrasePied';
import { prixDeLaRangee } from '../../../src/ui/depense/calculPlateau';
import type { PurchaseLineDraft } from '../../../src/services/purchaseEntry';

const sortie = (result: any, extra: Record<string, unknown> = {}) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result, ...extra });
const porte = () => { let ouvre!: () => void; const promesse = new Promise<void>(r => { ouvre = r; }); return { promesse, ouvre }; };
const EAN_BARRE = '481300722244', REF_AVANT = '7680000000017', REF_APRES = '7680000000024';

type L = [nom: string, q: number | null, prix: number | null, montant: number, ref?: string, kind?: string];
/** Le provisoire voit deux tickets (somme 313,10 pour un total de 163,85 : un rouge que la 3.8 renverse) ; la 3.8 ne garde que les deux dernières lignes. */
const LIGNES_PROV: L[] = [
  ['Vaccin grippe A', 1, 26.68, 26.68], ['Rabais', 1, null, -0.68, '', 'discount'], ['Vaccin covid B', 1, 75.15, 75.15, EAN_BARRE], ['Rabais', 1, null, -1.9, '', 'discount'],
  ['Pansement stérile', 1, 151.83, 151.83], ['Rabais', 1, null, -2.58, '', 'discount'], ['Article H21', 2, null, 50],
  ['Paracétamol cpr 500 mg', 1, 5.4, 5.4, REF_AVANT], ['Ibuprofène cpr 400 mg', 1, 9.2, 9.2],
];
function lectures(lignesFinal: Array<{ l: L; i: number }>) {
  const { provisoire, final, jeton } = lecturesLenteur('perdue');
  const modele = provisoire!.items[0];
  const item = (l: L, i: number) => ({ ...modele, id: `line-${i + 1}`, name: l[0], kind: l[5] ?? 'other', quantity: l[1], unit: '', price: l[2], amountTTC: l[3], stockCategory: undefined, variant: '', reference: l[4] ?? '', rangProvisoire: undefined });
  const commun = { documentType: 'receipt', paymentMethod: 'twint', terminalAmount: 163.85, vendor: 'Pharmacie Test', category: 'divers' };
  Object.assign(provisoire!, commun, { items: LIGNES_PROV.map(item), printedLineCount: 6, amountTTC: 163.85, tvaAmount: 0.37, amountPaid: undefined });
  const somme = Math.round(lignesFinal.reduce((t, x) => t + x.l[3] * 100, 0)) / 100;
  Object.assign(final, commun, { items: lignesFinal.map((x, k) => ({ ...item(x.l, k), rangProvisoire: x.i })), printedLineCount: lignesFinal.length, amountTTC: somme, tvaAmount: 0, amountPaid: somme, terminalAmount: somme });
  return { provisoire: provisoire!, final, jeton };
}
const fichier = (view: ReturnType<typeof render>) => {
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
};
/** Le flux : le provisoire arrive, la porte retient la 3.8 ; `ouvrir` la laisse finir. */
async function lireEnFlux(lignesFinal: Array<{ l: L; i: number }>) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final, jeton } = lectures(lignesFinal);
  if (final.items[0]?.name === 'Paracétamol cpr 500 mg') final.items[0].reference = REF_APRES;
  const g = porte();
  state.scanned.mockImplementation(async (_f: any, _t: any, opts: any) => { opts?.onProvisoire?.(sortie(provisoire, { jeton })); await g.promesse; return sortie(final); });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  fichier(view);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  const ouvrir = async () => {
    await act(async () => { g.ouvre(); await g.promesse; await new Promise(r => setTimeout(r, 0)); });
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  };
  return { view, ouvrir };
}
const preuve = (view: ReturnType<typeof render>) => view.container.querySelector<HTMLElement>('[data-dp="preuve"]')!;
const chercher = (view: ReturnType<typeof render>, texte: string) => fireEvent.change(view.container.querySelector<HTMLInputElement>('input[placeholder^="Chercher une ligne"]')!, { target: { value: texte } });

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('LR1-6 : pendant la 3e lecture, le bloc de contrôles ne se rouge pas sur le provisoire', () => {
  const rangs: RangControle[] = [
    { cle: 'articles', verdict: 'ecart', texte: 'Articles lus ≠ annoncés', valeurs: '7 / 6', ecart: '+1', geste: 'Ouvrir la ligne en trop', renvoi: 'fausse', resume: '1 article en trop' },
    { cle: 'somme', verdict: 'ecart', texte: 'Somme ≠ imprimé', valeurs: '313,10 / 163,85', ecart: '+149,25', geste: 'Comparer à la photo', renvoi: 'photo' },
    { cle: 'qte', verdict: 'ecart', texte: 'Qté × prix', valeurs: '4/5', geste: 'Ouvrir la ligne fausse', renvoi: 'fausse' },
    { cle: 'paye', verdict: 'ok', texte: 'Payé = imprimé · TWINT', valeurs: '163,85' },
  ];
  it('controlesProvisoires : chaque écart devient « en cours », neutre, sans écart, sans geste ni ton ; un « ≠ » ne reste pas dans le libellé', () => {
    const p = controlesProvisoires(rangs);
    expect(p).toHaveLength(4);
    for (const r of p.slice(0, 3)) {
      expect(r.verdict).toBe('inconnu');
      expect(r.valeurs).toBe('en cours');
      expect(r).not.toHaveProperty('geste'); expect(r).not.toHaveProperty('renvoi'); expect(r).not.toHaveProperty('ecart'); expect(r).not.toHaveProperty('ton'); expect(r).not.toHaveProperty('resume');
      expect(r.texte).not.toMatch(/≠/);
    }
    expect(p.map(r => r.texte).slice(0, 3)).toEqual(['Articles lus', 'Somme', 'Qté × prix']);
    expect(p[3]).toEqual(rangs[3]);
  });
  it('à l’écran, provisoire (somme 313,10 / total 163,85) : ni drapeau ni pastille d’erreur, « en cours » ; la 3.8 finie, les contrôles reviennent', async () => {
    const { view, ouvrir } = await lireEnFlux([{ l: LIGNES_PROV[7], i: 7 }, { l: LIGNES_PROV[8], i: 8 }]);
    const p = preuve(view);
    expect(p.getAttribute('data-dp-drapeau')).toBeNull();
    expect(p.querySelector('[data-dp-verdict="ecart"]')).toBeNull();
    expect(p.textContent).not.toMatch(/Ouvrir la ligne fausse|manquants|en trop/);
    expect(p.textContent).toMatch(/en cours/);
    await ouvrir();
    expect(preuve(view).textContent).not.toMatch(/en cours/);
  });
});

describe('LR1-7 : quantité et montant lus sans prix unitaire : le prix se déduit, dit déduit', () => {
  it('prixDeLaRangee : 2 et 50,00 → 25 déduit ; un prix lu reste lu ; ni quantité ni montant : rien ; un rabais : rien', () => {
    const l = (o: Partial<PurchaseLineDraft>) => ({ kind: 'other', ...o }) as Pick<PurchaseLineDraft, 'kind' | 'quantity' | 'unitPrice' | 'amount'>;
    expect(prixDeLaRangee(l({ quantity: 2, amount: 50 }))).toEqual({ valeur: 25, deduit: true });
    expect(prixDeLaRangee(l({ quantity: 3, amount: 10 }))).toEqual({ valeur: 3.333, deduit: true }); // prixCalcule : 3 décimales quand 3 × 3,333 retombe sur 10,00
    expect(prixDeLaRangee(l({ quantity: 2, unitPrice: 24, amount: 50 }))).toEqual({ valeur: 24, deduit: false });
    expect(prixDeLaRangee(l({ quantity: 2 }))).toBeUndefined();
    expect(prixDeLaRangee(l({ amount: 50 }))).toBeUndefined();
    expect(prixDeLaRangee(l({ quantity: 0, amount: 50 }))).toBeUndefined();
    expect(prixDeLaRangee(l({ kind: 'discount', quantity: 1, amount: -2 }))).toBeUndefined();
  });
  it('à l’écran, ligne H21 « 2 × 25,00 · 50,00 », le prix marqué déduit (jamais « 2 × — »)', async () => {
    const { view, ouvrir } = await lireEnFlux([{ l: LIGNES_PROV[6], i: 6 }, { l: LIGNES_PROV[8], i: 8 }]);
    await ouvrir();
    const rangee = [...view.container.querySelectorAll<HTMLElement>('article[data-purchase-line]')].find(a => /Article H21/.test(a.textContent ?? ''))!;
    expect(rangee).toBeTruthy();
    const prix = rangee.querySelector<HTMLElement>('[data-dp-prix]')!;
    expect(prix.textContent).toBe('25,00');
    expect(prix.getAttribute('data-dp-prix-deduit')).toBe('1');
    expect(prix.getAttribute('title')).toMatch(/déduit/);
    expect(rangee.querySelector('[data-dp-montant]')!.textContent).toBe('50,00');
  });
});

describe('LR1-10 : « Chercher une ligne » trouve aussi les références des lectures écartées', () => {
  const ligne = (o: Partial<PurchaseLineDraft>): PurchaseLineDraft => ({ id: 'a', description: 'Vaccin', kind: 'other', unit: '', ...o }) as PurchaseLineDraft;
  it('chercherLignes : une référence lue avant (avant la 3.8) trouve sa ligne ; sans elle, rien', () => {
    const lignes = [ligne({ id: 'a', sourceReference: REF_APRES }), ligne({ id: 'b', description: 'Autre' })];
    expect(chercherLignes(lignes, REF_AVANT)).toEqual([]);
    expect(chercherLignes(lignes, REF_AVANT, undefined, l => (l.id === 'a' ? [REF_AVANT] : []))).toEqual(['a']);
    expect(chercherLignes(lignes, REF_APRES, undefined, () => [])).toEqual(['a']);
  });
  it('à l’écran : l’EAN d’une ligne barrée (pas retrouvée par la 3.8) la montre ; la référence d’avant d’une ligne corrigée trouve sa ligne', async () => {
    const { view, ouvrir } = await lireEnFlux([{ l: LIGNES_PROV[7], i: 7 }, { l: LIGNES_PROV[8], i: 8 }]);
    await ouvrir();
    const barree = view.container.querySelector<HTMLElement>('[data-dp-perdue]:not([hidden])');
    expect([...view.container.querySelectorAll('[data-dp-perdue]')].some(e => /Vaccin covid B/.test(e.getAttribute('aria-label') ?? ''))).toBe(true);
    expect(barree).toBeTruthy();
    chercher(view, EAN_BARRE);
    const covid = [...view.container.querySelectorAll<HTMLElement>('[data-dp-perdue]')].find(e => /Vaccin covid B/.test(e.getAttribute('aria-label') ?? ''))!;
    await waitFor(() => expect(covid.closest('[hidden]')).toBeNull());
    const autres = [...view.container.querySelectorAll<HTMLElement>('[data-dp-perdue]')].filter(e => e !== covid);
    expect(autres.every(e => e.hidden)).toBe(true);
    chercher(view, REF_AVANT);
    await waitFor(() => {
      const para = [...view.container.querySelectorAll<HTMLElement>('article[data-purchase-line]')].find(a => /Paracétamol/.test(a.textContent ?? ''))!;
      expect(para.closest('[hidden]')).toBeNull();
      const ibu = [...view.container.querySelectorAll<HTMLElement>('article[data-purchase-line]')].find(a => /Ibuprofène/.test(a.textContent ?? ''))!;
      expect(ibu.closest('[hidden]')).not.toBeNull();
    });
  });
});

describe('LR1-12 : un message repris du serveur s’écrit en virgule décimale suisse', () => {
  it('« (2.6% base … TVA 0,44 / 2.6% …) » → « (2,6 % base … ) » ; les dates et le nom hors parenthèses ne changent pas', () => {
    expect(sansMotsBruts('Bloc TVA : lectures divergentes (2.6% base non lu TVA 0,44 / 2.6% base non lu TVA 0,44), vérifier le justificatif.'))
      .toBe('Bloc TVA : lectures divergentes (2,6 % base non lu TVA 0,44 / 2,6 % base non lu TVA 0,44), vérifier le justificatif.');
    expect(sansMotsBruts('Taux : lectures divergentes (8.1% / 2.6%)')).toBe('Taux : lectures divergentes (8,1 % / 2,6 %)');
    expect(sansMotsBruts('Montant : lectures divergentes (0.44 / 12.5)')).toBe('Montant : lectures divergentes (0,44 / 12,5)');
    expect(sansMotsBruts('Date : lectures divergentes (19.11.2026 / 18.11.2026)')).toBe('Date : lectures divergentes (19.11.2026 / 18.11.2026)');
    expect(sansMotsBruts('Huile 2.5L — nature : lectures divergentes (other / equipment)')).toBe('Huile 2.5L — nature : lectures divergentes (autre / matériel)');
    expect(sansMotsBruts('Taux : lectures divergentes (8% / 2.6 %)')).toBe('Taux : lectures divergentes (8 % / 2,6 %)');
  });
});
