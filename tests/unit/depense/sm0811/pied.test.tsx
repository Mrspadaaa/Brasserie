// @vitest-environment jsdom
/**
 * Voie SM (08.11), le pied de la liste : « Et Détail 56,80 / 51,80 c'est assez trompeur et donne pas d'info.... Mettre des informations cooreante.
 * On a l'impression que c'est faux alors que c'est juste ». Les lignes du ticket font 51,80 (= le total imprimé) ; il ajoute « Idaho7 » 5,00 à la main.
 * Le pied dit ce que sont les nombres et d'où vient l'écart :
 *   égal                                   « Lignes = total 51,80 » (neutre)
 *   écart = les lignes ajoutées à la main  « Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7) » (neutre, ce n'est pas une erreur)
 *   autre écart                            « Lignes 56,80 · total 51,80 · 5,00 de plus » / « de moins » (attention)
 * Stock et lecture SIMULÉS, Gemini jamais appelé, rien d'écrit.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import lecture from '../stock/fixtures/lecture-372765.json';
import stockJson from '../stock/fixtures/stock-simule.json';
import { ajoutsALaMain, phraseDuPied, estAjouteeAMain } from '../../../../src/ui/depense/phrasePied';

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

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const fr = (c: number) => (c / 100).toFixed(2).replace('.', ',');

describe('SM — la phrase du pied (règle pure)', () => {
  it('égal : « Lignes = total 51,80 », neutre', () => {
    expect(phraseDuPied(5180, 5180, [], fr)).toEqual({ texte: 'Lignes = total 51,80', attention: false });
  });
  it('l’écart égal à la ligne ajoutée à la main : neutre, avec son nom', () => {
    expect(phraseDuPied(5680, 5180, [{ nom: 'Idaho7', cents: 500 }], fr)).toEqual({ texte: 'Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7)', attention: false });
    expect(phraseDuPied(5680, 5180, [{ nom: 'Idaho7', cents: 300 }, { nom: 'Citra', cents: 200 }], fr).texte).toBe('Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7, Citra)');
  });
  it('au-delà de deux lignes ajoutées : leur nombre', () => {
    const tres = [{ nom: 'A', cents: 100 }, { nom: 'B', cents: 100 }, { nom: 'C', cents: 100 }];
    expect(phraseDuPied(5480, 5180, tres, fr).texte).toBe('Lignes 54,80 = total 51,80 + 3,00 ajouté (3 lignes)');
  });
  it('autre écart : en chiffres, en attention ; l’ajout qui n’explique pas tout reste un écart', () => {
    expect(phraseDuPied(5680, 5180, [], fr)).toEqual({ texte: 'Lignes 56,80 · total 51,80 · 5,00 de plus', attention: true });
    expect(phraseDuPied(5000, 5180, [], fr)).toEqual({ texte: 'Lignes 50,00 · total 51,80 · 1,80 de moins', attention: true });
    expect(phraseDuPied(5680, 5180, [{ nom: 'Idaho7', cents: 400 }], fr).attention).toBe(true);
  });
  it('une ligne ajoutée à la main : sans nom lu, sans imprimé, sans référence ni extrait ; les lignes lues ne le sont jamais', () => {
    expect(estAjouteeAMain({} as any)).toBe(true);
    expect(estAjouteeAMain({ nomLu: 'Idaho 7' } as any)).toBe(false);
    expect(estAjouteeAMain({ imprime: { nom: 'x' } } as any)).toBe(false);
    expect(ajoutsALaMain([{ id: 'a', description: ' Idaho7 ', amount: 5 } as any, { id: 'b', description: 'Lue', nomLu: 'Lue', amount: 3 } as any, { id: 'c', description: 'Sans montant' } as any])).toEqual([{ nom: 'Idaho7', cents: 500 }]);
  });
});

const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number) =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC: Math.round(quantity * price * 100) / 100, reference: '', variant: '', stockCategory: '', evidence: '', ambiguity: '' });
/** Deux lignes lues, 13,80 + 38,00 = 51,80 ; `total` : le total imprimé. */
const lire = async (total = 51.8) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: JSON.parse(JSON.stringify(stockJson.articles)), cleaning: [], equipment: [] };
  const items = [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), ligne(2, 'Tournevis cruciforme', 'equipment', 1, 'Stk', 38)];
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: { ...JSON.parse(JSON.stringify(lecture)), items, category: 'brassage', amountTTC: total, amountHT: null, tvaRate: null, tvaAmount: null, orderNumber: '', invoiceNumber: 'B-3003', vendor: 'Brico Fictif SA' } });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const ligneEl = (view: ReturnType<typeof render>, id: string) => view.container.querySelector(`[data-dp-ligne="${id}"]`) as HTMLElement;
const ouvrir = (view: ReturnType<typeof render>, id: string) => { const d = ligneEl(view, id).querySelector('details')!; if (!d.open) fireEvent.click(d.querySelector('summary')!); return ligneEl(view, id); };
/** Le pied : tout ce que dit la ligne « fin » avant « Regrouper » (le lien reste, au même endroit). */
const pied = (view: ReturnType<typeof render>) => {
  const fin = view.container.querySelector('[data-dp="fin"]')!;
  const regrouper = fin.querySelector('[data-dp-regrouper]');
  const mots = [...fin.querySelectorAll<HTMLElement>('span')].find(s => /^(Lignes|Détail)/.test(s.textContent ?? '') && !s.contains(regrouper));
  return { fin, regrouper, mots: mots!, texte: (mots?.textContent ?? '').replace(/\s+/g, ' ').trim() };
};
/** Ajoute à la main « libellé », 5 × 1,00 (5,00). */
const ajouter = (view: ReturnType<typeof render>, libelle: string): string => {
  const avant = new Set([...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')));
  fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
  const id = [...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')!).find(x => !avant.has(x))!;
  let l = ouvrir(view, id);
  const champ = l.querySelector('[aria-label^="Libellé ligne"]') as HTMLTextAreaElement;
  champ.focus(); fireEvent.change(champ, { target: { value: libelle } }); champ.blur();
  l = ligneEl(view, id);
  fireEvent.change(l.querySelector('[aria-label^="Quantité ligne"]')!, { target: { value: '5' } });
  fireEvent.change(ligneEl(view, id).querySelector('[aria-label^="Prix ligne"]')!, { target: { value: '1' } });
  return id;
};

describe('SM — le pied sur l’écran rendu', () => {
  it('lignes = total imprimé : « Lignes = total 51,80 », neutre, « Regrouper en une dépense » au même endroit', async () => {
    const view = await lire();
    const p = pied(view);
    expect(p.texte).toBe('Lignes = total 51,80');
    expect(p.mots.className).not.toMatch(/text-attention|text-alert/);
    expect(p.regrouper).not.toBeNull();
    expect(p.regrouper!.parentElement).toBe(p.mots.parentElement);
  });
  it('« Idaho7 » 5,00 ajouté à la main : « Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7) », neutre', async () => {
    const view = await lire();
    ajouter(view, 'Idaho7');
    const p = pied(view);
    expect(p.texte).toBe('Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7)');
    expect(p.mots.className).not.toMatch(/text-attention|text-alert/);
    expect(p.regrouper).not.toBeNull();
  });
  it('un vrai écart (total imprimé 50,00, lignes 51,80) : « Lignes 51,80 · total 50,00 · 1,80 de plus », en attention', async () => {
    const view = await lire(50);
    const p = pied(view);
    expect(p.texte).toBe('Lignes 51,80 · total 50,00 · 1,80 de plus');
    expect(p.mots.className).toMatch(/text-attention/);
  });
  it('la ligne ajoutée ne couvre pas l’écart (total 49,00) : écart réel, en attention', async () => {
    const view = await lire(49);
    ajouter(view, 'Idaho7');
    const p = pied(view);
    expect(p.texte).toBe('Lignes 56,80 · total 49,00 · 7,80 de plus');
    expect(p.mots.className).toMatch(/text-attention/);
  });
  it('manque : total 60,00, lignes 51,80 : « 8,20 de moins »', async () => {
    const view = await lire(60);
    expect(pied(view).texte).toBe('Lignes 51,80 · total 60,00 · 8,20 de moins');
  });
});
