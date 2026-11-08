// @vitest-environment jsdom
/**
 * Voie SM (08.11), sur l'écran rendu : « SI je mets suivre au stock, ça devrait faire le mapping automatique... ».
 * Sa capture : la ligne ajoutée « Idaho7 », 5 g, rangée dans « Autres », « article — · hors stock », bouton « + Suivre au stock ».
 * Voulu : la ligne arrive en Houblons ; le bouton la relie à l'article « Idaho 7 » du stock s'il y est, sinon en fait un nouvel article Houblon « Idaho 7 »
 * avec sa fiche (jamais l'α de la fiche posé), sinon (nom inconnu) un nouvel article simple. Stock SIMULÉ, Gemini jamais appelé, rien d'écrit.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import lecture from '../stock/fixtures/lecture-372765.json';
import stockJson from '../stock/fixtures/stock-simule.json';

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

const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number) =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC: Math.round(quantity * price * 100) / 100, reference: '', variant: '', stockCategory: '', evidence: '', ambiguity: '' });
const lire = async (stockPlus: any[] = []) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: [...JSON.parse(JSON.stringify(stockJson.articles)), ...stockPlus], cleaning: [], equipment: [] };
  const items = [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3)];
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: { ...JSON.parse(JSON.stringify(lecture)), items, category: 'brassage', amountTTC: 13.8, amountHT: null, tvaRate: null, tvaAmount: null, orderNumber: '', invoiceNumber: 'B-3003', vendor: 'Brico Fictif SA' } });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const ligneEl = (view: ReturnType<typeof render>, id: string) => view.container.querySelector(`[data-dp-ligne="${id}"]`) as HTMLElement;
const bandeDe = (view: ReturnType<typeof render>, id: string) => ligneEl(view, id).closest('[data-dp-bande]')!.getAttribute('data-dp-bande');
const ouvrir = (view: ReturnType<typeof render>, id: string) => { const d = ligneEl(view, id).querySelector('details')!; if (!d.open) fireEvent.click(d.querySelector('summary')!); return ligneEl(view, id); };

/** Ajoute une ligne à la main : libellé, 5, unité g. Rend son id. */
const ajouter = (view: ReturnType<typeof render>, libelle: string): string => {
  const avant = new Set([...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')));
  fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
  const id = [...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')!).find(x => !avant.has(x))!;
  let l = ouvrir(view, id);
  const champ = l.querySelector('[aria-label^="Libellé ligne"]') as HTMLTextAreaElement;
  champ.focus(); fireEvent.change(champ, { target: { value: libelle } }); champ.blur();
  l = ligneEl(view, id);
  fireEvent.change(l.querySelector('[aria-label^="Quantité ligne"]')!, { target: { value: '5' } });
  l = ligneEl(view, id);
  const cases = l.querySelector('[data-dp-cases-unite]');
  if (cases) fireEvent.click(cases.querySelector('button[data-val="g"]')!);
  return id;
};
const suivre = (view: ReturnType<typeof render>, id: string) => { fireEvent.click(within(ligneEl(view, id)).getByRole('button', { name: /Suivre au stock/ })); };
/** L'état du stock de la ligne, lu sur son plateau (même lecture que `aide-plateau.ts`, mais par id : une ligne ajoutée à la main n'est pas « line-N »). */
const stockDe = (view: ReturnType<typeof render>, id: string): 'existing' | 'new' | 'none' | undefined => {
  const t = ligneEl(view, id).querySelector('[data-dp-stock]')?.textContent ?? '';
  if (/hors stock/.test(t)) return 'none';
  if (/nouvel article/.test(t)) return 'new';
  if (/relié|proposé|à choisir/.test(t)) return 'existing';
  return undefined;
};

describe('SM — « Suivre au stock » relie tout seul', () => {
  it('« Idaho7 », 5 g, rien au stock : la ligne est déjà dans Houblons, puis le bouton en fait un article Houblon « Idaho 7 » (fiche, pas d’α), la ligne y reste', async () => {
    const view = await lire();
    const id = ajouter(view, 'Idaho7');
    expect(bandeDe(view, id)).toBe('houblon');
    suivre(view, id);
    const l = ouvrir(view, id);
    expect(bandeDe(view, id)).toBe('houblon');
    await waitFor(() => expect(l.querySelector('[data-dp-stock]')?.textContent).toContain('Idaho 7'));
    const brut = ligneEl(view, id).textContent ?? '';
    expect(stockDe(view, id)).toBe('new');
    expect(brut).toContain('Idaho 7');
    expect(brut).not.toMatch(/α\s*\d/);
    await waitFor(() => expect(ligneEl(view, id).textContent ?? '').toMatch(/fiche Idaho 7/i), { timeout: 8000 }); // la pastille de fiche, du catalogue des houblons
    expect(state.writes).toEqual([]); // rien n'est écrit sans « Confirmer »
  });
  it('« Idaho7 », le stock porte déjà « Idaho 7 » : la ligne est reliée (existing), nom déjà au stock', async () => {
    const view = await lire([{ id: 'h1', ref: 'MP-Idaho7', name: 'Idaho 7', category: 'Houblon', unit: 'g', currentStock: 200, minStock: 0, reorder: false }]);
    const id = ajouter(view, 'Idaho7');
    suivre(view, id);
    const l = ouvrir(view, id);
    expect(stockDe(view, id)).toBe('existing');
    expect(l.textContent).toContain('Idaho 7');
    expect(state.writes).toEqual([]);
  });
  it('« Machin7 », nom inconnu : un nouvel article simple, la ligne n’entre pas en Houblons', async () => {
    const view = await lire();
    const id = ajouter(view, 'Machin7');
    expect(bandeDe(view, id)).not.toBe('houblon');
    suivre(view, id);
    ouvrir(view, id);
    expect(stockDe(view, id)).toBe('new');
    expect(bandeDe(view, id)).not.toBe('houblon');
    expect(state.writes).toEqual([]);
  });
});
