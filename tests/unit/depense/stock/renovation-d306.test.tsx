// @vitest-environment jsdom
/**
 * Voie r1-renovation (D306) — la feuille « Nouvelle dépense » lit une pièce de travaux SIMULÉE (« Pour quoi ? » = renovation, lignes lues « stock » comme la lecture le fait)
 * à côté d'une ligne de malt du stock simulé. Une ligne de Rénovation ne crée jamais d'article de stock ni de mouvement (pas de proposition, pas de « nouvel article »
 * d'office), même lue « stock » ; le malt, lui, est proposé sur son article. Gemini jamais appelé ; stock SIMULÉ ; rien n'est écrit.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import lecture from './fixtures/lecture-372765.json';
import stockJson from './fixtures/stock-simule.json';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => state.writes.push(['transaction', tx]), addStockItem: (...a: any[]) => state.writes.push(['stock', ...a]), addEquipment: (i: any) => state.writes.push(['equipment', i]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => {}, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => state.writes.push(['transaction', tx]) } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: () => ({ id: 'proof' }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { stockDe, toucherNature, suivreAuStock } from '../aide-plateau';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number, stockCategory = '') =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC: Math.round(quantity * price * 100) / 100, reference: '', variant: '', stockCategory, evidence: '', ambiguity: '' });
/** Une pièce SIMULÉE : un malt du stock simulé, puis des lignes de travaux lues « stock » ou « other ». */
const piece = (category: string, extra: Array<ReturnType<typeof ligne>> = []) => {
  const items = [
    ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), ligne(2, 'Peinture murale blanche mate 10 L', 'stock', 1, 'Stk', 64.9), ligne(3, 'Gants nitrile M', 'stock', 1, 'Stk', 8.4, 'EPI'),
    ligne(4, 'Dübel 8 mm, 50 Stück', 'stock', 2, 'Stk', 6.5), ligne(5, 'Eimer 12 Liter', 'other', 2, 'Stk', 3.9), ...extra,
  ];
  const total = Math.round(items.reduce((a, i) => a + i.amountTTC, 0) * 100) / 100;
  return { ...JSON.parse(JSON.stringify(lecture)), items, category, amountTTC: total, amountHT: null, tvaRate: null, tvaAmount: null, orderNumber: '', invoiceNumber: 'B-3003', vendor: 'Brico Fictif SA' };
};

const lire = async (category: string, extra: Array<ReturnType<typeof ligne>> = []) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: JSON.parse(JSON.stringify(stockJson.articles)), cleaning: [], equipment: [] };
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: piece(category, extra) });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\n'], 'facture-travaux.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const bandeDe = (view: ReturnType<typeof render>, id: string) => view.container.querySelector(`[data-dp-ligne="${id}"]`)!.closest('[data-dp-bande]')!.getAttribute('data-dp-bande');
const natureDe = (view: ReturnType<typeof render>, id: string) => view.container.querySelector(`[data-dp-ligne="${id}"] [data-dp-nature] [aria-pressed="true"]`)?.textContent;
// 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : le menu « Stock ligne n » est lu sur la ligne « article » du plateau (aide-plateau.ts).

describe('D306 — une pièce de travaux lue « stock » sous Local : la Rénovation ne crée ni article ni mouvement', () => {
  it('les lignes de travaux sont en bande Rénovation, sans sélecteur de stock (kind Matériel : aucun article), le malt reste proposé sur son article', async () => {
    const view = await lire('renovation');
    for (const id of ['line-2', 'line-3', 'line-4', 'line-5']) expect(bandeDe(view, id), id).toBe('renovation');
    expect(bandeDe(view, 'line-1')).toBe('malt');
    for (const n of [2, 3, 4]) { expect(stockDe(n), `ligne ${n}`).toBe('none'); expect(document.querySelector(`[data-dp-ligne="line-${n}"] [data-dp-suivre]`), `ligne ${n}`).not.toBeNull(); } // « hors stock », « Ajouter au stock » offert à la demande (BR-124, 10.11 : « toujours disponible »)
    expect(stockDe(1)).toBe('none'); // s1 (VERDICT-EN-LIGNE-2, 10.11) : une dépense de travaux ne relie plus aucune ligne, même le malt qui retrouve un article (avant : 'existing', proposé sur son article) ; « Suivre au stock » reste à la main
    expect(state.writes).toEqual([]);
  });
  it('une ligne lue « stock » dont la famille est la Rénovation prend le kind Matériel (sélecteur « Matériel », plus « Ingrédient »), le malt reste Ingrédient', async () => {
    const view = await lire('renovation');
    for (const id of ['line-2', 'line-3', 'line-4']) expect(natureDe(view, id), id).toBe('Matériel');
    expect(natureDe(view, 'line-1')).toBe('Ingrédient');
  });
  it('sous Brassage aussi : un mot sans équivoque (peinture, chevilles) donne la Rénovation, donc le kind Matériel', async () => {
    const view = await lire('brassage');
    for (const id of ['line-2', 'line-4']) expect(natureDe(view, id), id).toBe('Matériel');
  });
  it('« Pour quoi ? » change après la lecture : le « nouvel article » posé d’office d’une ligne devenue Rénovation repasse à « aucun article » ; un choix du brasseur ne bouge pas', async () => {
    await lire('brassage', [ligne(6, 'Balai de cantonnier', 'stock', 1, 'Stk', 5.5), ligne(7, 'Seau galvanisé', 'stock', 1, 'Stk', 9.9)]);
    expect(stockDe(6), 'brosse avant').toBe('new');
    expect(stockDe(7), 'seau avant').toBe('new');
    // le brasseur écarte puis choisit lui-même « nouvel article » pour le seau : ce n’est plus un choix d’office
    // 28c98cba (pu4d, D350, p-port-pu4d/RESULTAT.md) : plus de menu : écarter = passer la nature à Service (hors stock), puis choisir = Ingrédient et « Suivre au stock » (nouvel article choisi).
    toucherNature(7, 'Service'); toucherNature(7, 'Ingrédient'); suivreAuStock(7);
    fireEvent.change(document.querySelector('#purchase-category')!, { target: { value: 'renovation' } });
    expect(stockDe(6), 'brosse après').toBe('none');
    expect(stockDe(7), 'seau (choix du brasseur) après').toBe('new');
    expect(state.writes).toEqual([]);
  });
  it('aucune rangée de la Rénovation n’est « nouvel article » ni « proposé »', async () => {
    const view = await lire('renovation');
    for (const id of ['line-2', 'line-3', 'line-4', 'line-5']) {
      // Le lien de stock de la rangée (picto et marque), hors liste des options du sélecteur (qui propose toujours « Créer un nouvel article »).
      const rangee = view.container.querySelector(`[data-dp-ligne="${id}"]`)!;
      const lien = Array.from(rangee.querySelectorAll('[data-dp-lien], [data-dp-stock]')).map(e => `${e.textContent} ${e.getAttribute('title') ?? ''} ${e.getAttribute('aria-label') ?? ''}`).join(' | ');
      expect(lien, id).not.toMatch(/nouvel article|proposé|relié/);
    }
  });
  it('sans catégorie « Local » : la peinture et les chevilles (mots sans équivoque) restent en Rénovation sans article ; le seau (ambigu) garde sa famille d’avant', async () => {
    const view = await lire('brassage');
    expect(bandeDe(view, 'line-2')).toBe('renovation');
    expect(bandeDe(view, 'line-4')).toBe('renovation');
    expect(bandeDe(view, 'line-5')).not.toBe('renovation');
    for (const n of [2, 4]) expect(stockDe(n), `ligne ${n}`).toBe('none');
    expect(state.writes).toEqual([]);
  });
});
