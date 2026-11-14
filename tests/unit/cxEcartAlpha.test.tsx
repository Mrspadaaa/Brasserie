// @vitest-environment jsdom
/**
 * DP-4 (10.11), sur l'écran réel : « Ça pose aucun problème que un houblon du stock soit ajouter en pièce ??? Et on voit pas la vue stock normalement comme sur le second screen ?? D'ailleurs on doit pouvoir
 * choisir justement avec la vue stock si on lie, créé un nouveau bis justement ?? » (« Idaho 7 », 1 pièce, 82,35, face à « Idaho 7 » houblon compté en g, 0 g). Gemini simulé, stock simulé, aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => state.writes.push(['transaction', tx]), addStockItem: (...a: any[]) => state.writes.push(['stock', ...a]), addEquipment: (i: any) => state.writes.push(['equipment', i]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../src/services/financeService', () => ({ validateFinancialPayment: () => {}, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => state.writes.push(['transaction', tx]) } }));
vi.mock('../../src/services/financeDocuments', () => ({ prepareFinanceDocument: () => ({ id: 'proof' }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { stockDe, toucherUnite, unitePressee } from './depense/aide-plateau';
import { ExpenseSheet } from '../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
import type { StockItem } from '../../src/types';

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
  const fuggle = () => item('MP-Fuggle', 'Fuggle', 'Houblon', 'g', { alphaPct: 4.5, currentStock: 200 });

  it('ST-T45 : une ligne Fuggle α 6,3 reliée au Fuggle α 4,5 du stock dit l\'écart d\'α (trait rompu), jamais « = »', async () => {
    const view = await lire('Fuggle 6,3%', 'g', [fuggle()], 100);
    fireEvent.click(sortie(view, 'relie')!);
    expect(stockDe(1)).toBe('existing');
    const duel = ligne(view).querySelector('[data-dp-duel]')!;
    expect(duel.getAttribute('data-dp-lien-etat')).toBe('inconnu');
    const trait = duel.querySelector('[role="img"]')!.getAttribute('aria-label');
    expect(trait).toBe('α 6,3 sur la facture, α 4,5 au stock');
  });
  it('même α : la ligne reste proposée, sans écart d’α inventé', async () => {
    const view = await lire('Fuggle 4,5%', 'g', [fuggle()], 100);
    expect(stockDe(1)).toBe('existing');
    const duel = ligne(view).querySelector('[data-dp-duel]')!;
    expect(duel.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('article proposé, à garder');
  });
});
