// @vitest-environment jsdom
/**
 * Voie s1-stock — D213 « oui attention au unités » (31.10).
 * Une quantité garde l'unité imprimée, jamais réécrite en silence ; une conversion se voit (ligne repliée) et se teste ; une ligne sans
 * unité lisible n'est reliée à rien. Gemini simulé, aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => state.writes.push(['transaction', tx]), addStockItem: (...a: any[]) => state.writes.push(['stock', ...a]), addEquipment: (i: any) => state.writes.push(['equipment', i]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => {}, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => state.writes.push(['transaction', tx]) } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: () => ({ id: 'proof' }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { proposeStockItem, formatUnitLink } from '../../../../src/services/stockLineMatching';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { Units } from '../../../../src/services/units';
import type { StockItem } from '../../../../src/types';

const item = (ref: string, name: string, category: string, unit: string): StockItem => ({ id: ref, ref, name, category, unit, currentStock: 1, minStock: 0, reorder: false });
const hop = (ref: string, name: string) => item(ref, name, 'Houblon', 'g');

describe('D213 unités : l’appariement', () => {
  it('« Crystal » en kg face au seul « Houblon Crystal » en g → rien (g et kg sont compatibles, ce n’est pas une preuve)', () => {
    expect(proposeStockItem({ description: 'Crystal', unit: 'kg', quantity: 25, vendor: '' }, [hop('HC', 'Houblon Crystal')])).toBeUndefined();
  });
  // D214 (« Unité illisible : la ligne n'est reliée à aucun article.???? ») remplace la règle D213 n° 4 : une unité illisible
  // n'empêche pas la proposition, aux mêmes conditions que toute autre ligne ; aucune unité n'est devinée ; une unité lisible mais
  // incompatible avec l'article donne toujours « rien ».
  it('D214 : une ligne à l’unité illisible reste proposée à son article, aux mêmes conditions', () => {
    const stock = [item('MO', 'Maris Otter', 'Malt', 'kg')];
    for (const unit of ['', '   ', '-', '?', '12', '…']) expect(proposeStockItem({ description: 'Maris Otter', unit, quantity: 6, vendor: '' }, stock)?.ref, `unité « ${unit} »`).toBe('MO');
    expect(proposeStockItem({ description: 'Maris Otter', unit: 'Kg', quantity: 6, vendor: '' }, stock)?.ref).toBe('MO');
  });
  it('D214 : l’unité absente n’assouplit aucune autre règle (nom, catégorie, α, poids de levure, homonyme)', () => {
    const faux = (description: string, stock: StockItem[], extra: Partial<Parameters<typeof proposeStockItem>[0]> = {}) => proposeStockItem({ description, unit: '', quantity: 6, vendor: '', ...extra }, stock);
    expect(faux('Maris Otter Pale', [item('MO', 'Maris Otter', 'Malt', 'kg')])).toBeUndefined();
    expect(faux('Crystal', [hop('HC', 'Houblon Crystal')])).toBeUndefined();
    expect(faux('Cascade', [hop('H', 'Houblon Cascade')], { stockCategory: 'malt' })).toBeUndefined();
    expect(faux('Target 11.8%', [hop('T', 'Target 11.3%')])).toBeUndefined();
    expect(faux('Safale US-05 11,5g', [item('U', 'Safale US-05 500 g', 'Levure', 'sachet')])).toBeUndefined();
    expect(faux('Safale US-05 11,5g', [item('U', 'Safale US-05', 'Levure', 'sachet')])?.ref).toBe('U');
  });
  it('D214 : une unité lisible mais incompatible avec l’article donne toujours rien', () => {
    expect(proposeStockItem({ description: 'Maris Otter', unit: 'Stk', quantity: 6, vendor: '' }, [item('MO', 'Maris Otter', 'Malt', 'kg')])).toBeUndefined();
    expect(proposeStockItem({ description: 'Maris Otter', unit: 'sachet', quantity: 6, vendor: '' }, [item('MO', 'Maris Otter', 'Malt', 'kg')])).toBeUndefined();
  });
  it('une quantité nulle, négative ou absente n’est reliée à rien', () => {
    const stock = [item('MO', 'Maris Otter', 'Malt', 'kg')];
    for (const quantity of [0, -1, undefined, Number.NaN]) expect(proposeStockItem({ description: 'Maris Otter', unit: 'kg', quantity: quantity as number, vendor: '' }, stock)).toBeUndefined();
  });
  it('la conversion s’écrit « 25 kg → 25 000 g » et jamais en silence ; l’inconvertible s’écrit à part', () => {
    expect(formatUnitLink(25, 'kg', 'g', 'Houblon')).toBe('25 kg → 25 000 g');
    expect(formatUnitLink(0.5, 'kg', 'g', 'Houblon')).toBe('0,5 kg → 500 g');
    expect(formatUnitLink(250, 'g', 'kg', 'Malt')).toBe('250 g → 0,25 kg');
    expect(formatUnitLink(2, 'Stk', 'sachet', 'Levure')).toBe('2 Stk = 2 sachet');
    expect(formatUnitLink(6, 'Kg', 'kg', 'Malt')).toBeUndefined();
    expect(formatUnitLink(2, 'Stk', 'g', 'Levure')).toBeUndefined();
  });
  it('units.ts ne change pas : Stk ne se convertit pas, ni en sachet ni en grammes', () => {
    expect(Units.convert(2, 'Stk', 'sachet')).toBeNull();
    expect(Units.convert(2, 'Stk', 'g')).toBeNull();
    expect(Units.areCompatible('Stk', 'sachet')).toBe(false);
  });
});

describe('D213 unités : la ligne repliée de la feuille', () => {
  beforeEach(() => {
    cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset(); state.stocks = { rawMaterials: [], cleaning: [], equipment: [] };
    vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
  });
  afterEach(cleanup);
  const lire = async (items: any[], rawMaterials: StockItem[]) => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.stocks = { rawMaterials, cleaning: [], equipment: [] };
    state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: { documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Malterie du Banc SA', date: '12.03.2026', currency: 'CHF', invoiceNumber: 'MB-1',
      amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 10, category: 'brassage', subcategory: '', description: 'Achat', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 }, items } });
    const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
    const file = new File(['%PDF-1.4\n'], 'f.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    return view;
  };
  const dans = (view: ReturnType<typeof render>, n: number, sel: string) => view.container.querySelector('[data-dp-ligne="line-' + n + '"]' + sel)?.textContent ?? ''; // R1 : la ligne n par son id
  const stock = (view: ReturnType<typeof render>, n: number) => dans(view, n, ' [data-dp-stock]'); // la ligne « stock : … » du plateau (dans le DOM, plateau fermé)
  const qte = (view: ReturnType<typeof render>, n: number) => dans(view, n, ' [data-dp-qte]');
  const ligneTexte = (view: ReturnType<typeof render>, n: number) => dans(view, n, ''); // toute la rangée, plateau fermé compris

  it('une proposition d’unité différente de l’article montre la quantité convertie, l’unité imprimée n’est pas réécrite', async () => {
    const view = await lire([{ id: 'line-1', name: 'Cascade', kind: 'stock', quantity: 25, unit: 'kg', amountTTC: 10, stockCategory: '' }], [hop('HC', 'Houblon Cascade')]);
    expect(stock(view, 1)).toContain('proposé');
    expect(stock(view, 1)).toContain('25 kg → 25 000 g');
    expect((screen.getByLabelText('Unité ligne 1') as HTMLInputElement).value).toBe('kg');
    expect(state.writes).toEqual([]);
  });

  it('l’unité imprimée est là quand la proposition est écartée, et la conversion disparaît', async () => {
    const view = await lire([{ id: 'line-1', name: 'Cascade', kind: 'stock', quantity: 25, unit: 'kg', amountTTC: 10, stockCategory: '' }], [hop('HC', 'Houblon Cascade')]);
    fireEvent.change(screen.getByLabelText('Stock ligne 1'), { target: { value: 'none' } });
    expect(ligneTexte(view, 1)).not.toContain('→');
    expect(ligneTexte(view, 1)).not.toContain('proposé');
    // sans stock lié, les champs de réception sont repliés : l'unité imprimée se lit dans la ligne (« 25 kg »), inchangée
    expect(qte(view, 1)).toContain('25 kg');
    expect(ligneTexte(view, 1)).not.toContain('25 000'); expect(stock(view, 1)).not.toContain('25 000');
    expect(state.writes).toEqual([]);
  });

  it('« Stk » face à un sachet de levure : proposé, « Stk » reste imprimé, l’équivalence est dite', async () => {
    const view = await lire([{ id: 'line-1', name: 'Safale US-05 11,5g', kind: 'stock', quantity: 2, unit: 'Stk', amountTTC: 10, stockCategory: '' }], [item('U', 'Safale US-05', 'Levure', 'sachet')]);
    expect(stock(view, 1)).toContain('proposé');
    expect(stock(view, 1)).toContain('2 Stk = 2 sachet');
    expect((screen.getByLabelText('Unité ligne 1') as HTMLInputElement).value).toBe('Stk');
  });

  it('D214 : une ligne sans unité lisible est proposée, son champ « Unité » reste vide, la rangée repliée dit « unité ? » et le plateau « unité à préciser »', async () => {
    const view = await lire([{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 6, unit: '', amountTTC: 10, stockCategory: '' }], [item('MO', 'Maris Otter', 'Malt', 'kg')]);
    // D277 (voie f3) : la rangée REPLIÉE dit la quantité « 6 ? » en rouge (niveau inconnu) ; HEAD : « unité ? ». La phrase entière vit au plateau ; la proposition est signalée au-dessus de la liste.
    expect(view.container.querySelector('[data-dp-ligne="line-1"] summary [data-dp-qte]')!.textContent).toBe('6 ?');
    expect(view.container.querySelector('[data-dp-ligne="line-1"] summary [data-dp-qte]')!.getAttribute('data-dp-niveau')).toBe('inconnu');
    // VERDICT-f3-p2, majeur 1 (D277) : HEAD « 1 proposée par la lecture, à vérifier » ; désormais la pastille jaune « 1 proposé » au récap.
    expect(view.container.querySelector('[data-dp="compte-liens"] [data-va="propose"]')!.textContent).toMatch(/^1 proposé/);
    expect(stock(view, 1)).toContain('proposé');
    expect(stock(view, 1)).toContain('unité à préciser');
    expect((screen.getByLabelText('Stock ligne 1') as HTMLSelectElement).value).toBe('existing');
    expect((screen.getByLabelText('Unité ligne 1') as HTMLInputElement).value).toBe('');
    expect(ligneTexte(view, 1)).not.toContain('→');
    expect(state.writes).toEqual([]);
  });

  it('D214, D275 (voie f3) : une unité lisible (« Stk ») face à un malt en kg reste sans proposition ; l’ingrédient non relié est nouvel article d’office (HEAD : none)', async () => {
    const view = await lire([{ id: 'line-1', name: 'Maris Otter', kind: 'stock', quantity: 6, unit: 'Stk', amountTTC: 10, stockCategory: '' }], [item('MO', 'Maris Otter', 'Malt', 'kg')]);
    expect(ligneTexte(view, 1)).not.toContain('proposé');
    expect((screen.getByLabelText('Stock ligne 1') as HTMLSelectElement).value).toBe('new');
  });
});
