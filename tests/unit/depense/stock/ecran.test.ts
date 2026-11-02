// @vitest-environment jsdom
/**
 * Voie s1-stock — la feuille « Nouvelle dépense » propose l'article à la lecture (S1), sans rien écrire, sans remplacer un choix,
 * et garde le libellé brut (A8, REVUE-PLAN Conception n° 4). Lecture simulée de la facture 372765 (Gemini jamais appelé), stock SIMULÉ.
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
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const lineOf = (n: number) => { const row = (lecture as any).items[n - 1]; return row; };
const summaries = (view: ReturnType<typeof render>) => Array.from({ length: 23 }, (_, i) => view.container.querySelector('[data-dp-ligne="line-' + (i + 1) + '"]') as HTMLElement); // R1 : par id, dans l'ordre du brouillon

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const lire = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: JSON.parse(JSON.stringify(stockJson.articles)), cleaning: [], equipment: [] };
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: JSON.parse(JSON.stringify(lecture)) });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\n'], 'facture-372765.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};

describe('S1 : la feuille propose l’article à la lecture de la facture 372765 (stock SIMULÉ)', () => {
  it('propose Maris Otter sur la ligne 1, avec la marque « proposé », sans aucune écriture', async () => {
    const view = await lire();
    const ligne1 = summaries(view)[0];
    expect(lineOf(1).name).toBe('Maris Otter, Kg');
    expect(ligne1.querySelector('[data-dp-stock]')!.textContent).toContain('proposé');
    expect(ligne1.querySelector('[data-dp-nom]')!.textContent).toContain('Maris Otter');
    expect((screen.getByLabelText('Stock ligne 1') as HTMLSelectElement).value).toBe('existing');
    expect(state.writes).toEqual([]);
  });

  it('les lignes de mouture (service) n’ont ni sélecteur de stock ni proposition ; Goldings et Hallertauer, absents, sont nouveaux d’office (D275, voie f3 ; HEAD : « aucun mouvement »)', async () => {
    await lire();
    for (const n of [2, 5, 7, 14, 16]) expect(screen.queryByLabelText(`Stock ligne ${n}`), `ligne ${n}`).toBeNull();
    for (const n of [9, 22]) expect((screen.getByLabelText(`Stock ligne ${n}`) as HTMLSelectElement).value, `ligne ${n}`).toBe('new');
  });

  it('Caramünch, Target, Galaxy et les quatre levures sont proposées sur leur article', async () => {
    await lire();
    for (const n of [1, 3, 4, 6, 8, 10, 11, 12, 13, 15, 17, 18, 19, 20, 21, 23]) expect((screen.getByLabelText(`Stock ligne ${n}`) as HTMLSelectElement).value, `ligne ${n}`).toBe('existing');
  });

  it('la description est la base du libellé, l’imprimé reste à côté (D275, voie f3 ; HEAD : le libellé brut) ; l’α, la récolte et le poids sont déduits en clair dans l’extrait, avec leur source', async () => {
    const view = await lire();
    expect((screen.getByLabelText('Libellé ligne 1') as HTMLInputElement).value).toBe('Maris Otter');
    expect((screen.getByLabelText('Libellé ligne 8') as HTMLInputElement).value).toBe('Target 11.3%');
    const texte8 = summaries(view)[7].textContent ?? '';
    expect(texte8).toContain('Libellé : Target 11.3%');
    expect(texte8).toContain('α 11,3 % (libellé)');
    const levure = Array.from(summaries(view)).find(row => (row.textContent ?? '').includes('Safale US-05'))!;
    expect(levure.textContent).toContain('poids du sachet 11,5 g (libellé)');
    expect(levure.querySelector('[data-dp-stock]')!.textContent).toContain('poids du sachet non confirmé');
  });

  it('un choix du brasseur n’est jamais remplacé : écarter la proposition la laisse écartée, même après d’autres modifications', async () => {
    const view = await lire();
    fireEvent.change(screen.getByLabelText('Stock ligne 1'), { target: { value: 'none' } });
    fireEvent.change(view.container.querySelector('#purchase-total')!, { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Libellé ligne 1'), { target: { value: 'Maris Otter (sac)' } });
    expect((screen.getByLabelText('Stock ligne 1') as HTMLSelectElement).value).toBe('none');
    expect(summaries(view)[0].textContent).not.toContain('proposé'); // toute la rangée (HEAD : tout le summary), pas seulement l'effet de stock
    expect(state.writes).toEqual([]);
  });
});
