// @vitest-environment jsdom
/**
 * DP-4 (10.11), sur l'écran réel : « Ça pose aucun problème que un houblon du stock soit ajouter en pièce ??? Et on voit pas la vue stock normalement comme sur le second screen ?? D'ailleurs on doit pouvoir
 * choisir justement avec la vue stock si on lie, créé un nouveau bis justement ?? » (« Idaho 7 », 1 pièce, 82,35, face à « Idaho 7 » houblon compté en g, 0 g). Gemini simulé, stock simulé, aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => state.writes.push(['transaction', tx]), addStockItem: (...a: any[]) => state.writes.push(['stock', ...a]), addEquipment: (i: any) => state.writes.push(['equipment', i]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => {}, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => state.writes.push(['transaction', tx]) } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: () => ({ id: 'proof' }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { stockDe, toucherUnite, unitePressee } from '../aide-plateau';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import type { StockItem } from '../../../../src/types';

const item = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}): StockItem => ({ id: ref, ref, name, category, unit, currentStock: 0, minStock: 0, reorder: false, ...more } as StockItem);
const idaho = () => item('MP-Idaho7', 'Idaho 7', 'Houblon', 'g');

describe('DP-4 — la ligne « Idaho 7 » en pièce face au houblon « Idaho 7 » compté en g', () => {
  beforeEach(() => {
    cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
    vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
  });
  afterEach(cleanup);
  const lire = async (nom: string, unit: string, rawMaterials: StockItem[], quantity = 1) => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.stocks = { rawMaterials, cleaning: [], equipment: [] };
    state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: { documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Houblons Fictifs SA', date: '10.11.2026', currency: 'CHF', invoiceNumber: 'HF-1',
      amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 82.35, category: 'brassage', subcategory: '', description: 'Houblons', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
      items: [{ id: 'line-1', name: nom, kind: 'stock', quantity, unit, price: 82.35 / quantity, amountTTC: 82.35, stockCategory: 'Houblon' }] } });
    const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
    const file = new File(['%PDF-1.4\n'], 'f.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    return view;
  };
  const ligne = (view: ReturnType<typeof render>) => view.container.querySelector<HTMLElement>('[data-dp-ligne="line-1"]')!;
  const sortie = (view: ReturnType<typeof render>, id: string) => ligne(view).querySelector<HTMLElement>(`[data-dp-sortie="${id}"]`);

  it('la vue FACTURE | STOCK et les trois sorties paraissent, « Relier » est proposé ; jamais « Idaho 7 bis » d’office ni « 0 → 1 pièce »', async () => {
    const view = await lire('Idaho 7', 'pièce', [idaho()]);
    const l = ligne(view);
    expect(stockDe(1)).toBe('existing');
    for (const id of ['bis', 'relie', 'neuf']) expect(sortie(view, id), id).not.toBeNull();
    expect(sortie(view, 'relie')!.getAttribute('aria-checked')).toBe('true');
    expect(sortie(view, 'relie')!.textContent).toContain('proposé');
    const duel = l.querySelector('[data-dp-duel]')!;
    expect(duel.getAttribute('data-dp-lien-etat')).toBe('inconnu'); // sa capture 2 : le trait rompu, l'unité ne s'ajoute pas
    expect(duel.textContent).toContain('pièce ne s’ajoute pas');
    expect(duel.textContent).toContain('compté en g');
    expect(l.querySelectorAll('[data-dp-duel]')).toHaveLength(1); // une seule vue, pas deux
    expect(l.textContent).not.toContain('Idaho 7 bis · nouvel article');
    expect(l.textContent).not.toContain('0 → 1 pièce');
    expect(within(l).getByRole('button', { name: 'Retirer l’article, ligne 1' })).toBeTruthy(); // la ligne « article » reste (⇄, Retirer)
    expect(state.writes).toEqual([]);
  });

  it('l’unité du stock est proposée (g), la question « 1 pièce = ? g » est posée, jamais un poids inventé ; g d’un toucher ferme la vue', async () => {
    const view = await lire('Idaho 7', 'pièce', [idaho()]);
    const cases = ligne(view).querySelector('[data-dp-cases-unite]')!;
    expect(cases.textContent).toContain('1 pièce = ? g');
    expect(cases.textContent).toContain('g proposé, comme au stock');
    expect(ligne(view).querySelector('[data-dp-poids-lu]')).toBeNull();
    toucherUnite(1, 'g');
    expect(ligne(view).querySelector('[data-dp-cases-unite]')).toBeNull();
    expect(ligne(view).textContent).not.toContain('ne s’ajoute pas'); // la proposition reste (D374 : « Garder »), plus l'unité rompue
    expect(unitePressee(1)).toBe('g');
    expect(stockDe(1)).toBe('existing');
  });

  it('« Nouvel article » et « bis » se choisissent dans la vue ; le houblon neuf en pièce sans poids n’entre pas (« 1 pièce = ? g »)', async () => {
    const view = await lire('Idaho 7', 'pièce', [idaho()]);
    fireEvent.click(sortie(view, 'bis')!);
    expect(stockDe(1)).toBe('new');
    expect(sortie(view, 'bis')!.getAttribute('aria-checked')).toBe('true');
    const l = ligne(view);
    expect(l.textContent).not.toContain('0 → 1 pièce');
    expect(l.querySelector('[data-dp-cases-unite]')!.textContent).toContain('1 pièce = ? g');
    expect(l.querySelector('[data-dp-cases-unite] button[data-val="g"]')).not.toBeNull();
    fireEvent.click(sortie(view, 'neuf')!);
    expect(stockDe(1)).toBe('new');
    expect(sortie(view, 'neuf')!.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sortie(view, 'relie')!);
    expect(stockDe(1)).toBe('existing');
    expect(sortie(view, 'relie')!.textContent).not.toContain('proposé'); // son choix est fait : plus de « proposé »
  });

  it('un houblon neuf en pièce AVEC son poids lu sur le nom (« Idaho 7 100 g ») : la pièce est permise, rien n’est demandé', async () => {
    const view = await lire('Idaho 7 100 g', 'pièce', [idaho()]);
    const l = ligne(view);
    expect(l.querySelector('[data-dp-cases-unite]')).toBeNull();
    expect(l.textContent).not.toContain('= ? g');
  });

  it('une autre α (15 face à 13) : « bis » proposé (D215), la vue et les trois sorties sont là, « bis » proposé', async () => {
    const view = await lire('Idaho 7 15%', 'g', [item('MP-Idaho7', 'Idaho 7', 'Houblon', 'g', { alphaPct: 13 })], 100);
    expect(stockDe(1)).toBe('new');
    for (const id of ['bis', 'relie', 'neuf']) expect(sortie(view, id), id).not.toBeNull();
    expect(sortie(view, 'bis')!.textContent).toContain('proposé');
  });

  it('un malt compté en Kg, ligne en pièce : relié, proposé, même vue', async () => {
    const view = await lire('Malt Pilsner', 'pièce', [item('MP-Pils', 'Malt Pilsner', 'Malt', 'Kg', { currentStock: 25 })]);
    expect(stockDe(1)).toBe('existing');
    expect(sortie(view, 'relie')!.textContent).toContain('proposé');
    expect(ligne(view).querySelector('[data-dp-duel]')!.textContent).toContain('compté en Kg');
  });
});
