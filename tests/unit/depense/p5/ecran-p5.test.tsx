// @vitest-environment jsdom
/**
 * Voie p5, bloquant 2 du jeu en ligne 9 : « Idaho 7 » (lu, ou ajouté à la main) face à PLUSIEURS « Idaho 7 » au stock. Avant : ligne ouverte « article — · hors stock » avec un picto de stock ; fermée « plusieurs
 * articles « Idaho 7 » : choisis » ; ⇄ sortait tout le stock ; aucune vue FACTURE | STOCK. Attendu : un seul état, la vue FACTURE | STOCK, une sortie « Relier à … » par candidat (α, récolte, stock), « bis », « Nouvel article » ;
 * rien n'est relié en silence ; ⇄ montre d'abord ces candidats. Gemini simulé, stock simulé, aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined,
  addTransaction: (tx: any) => state.writes.push(['transaction', tx]), addStockItem: (...a: any[]) => state.writes.push(['stock', ...a]), addEquipment: (i: any) => state.writes.push(['equipment', i]), updateTransaction: (tx: any) => state.writes.push(['update', tx]) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined,
  adjustNumber: (...a: any[]) => state.writes.push(['increment', ...a]), put: (...a: any[]) => state.writes.push(['put', ...a]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => {}, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => state.writes.push(['transaction', tx]) } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: () => ({ id: 'proof' }), saveFinanceDocumentConfirmed: async () => undefined }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { stockDe } from '../aide-plateau';
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import type { StockItem } from '../../../../src/types';

const item = (ref: string, name: string, more: Record<string, unknown> = {}): StockItem => ({ id: ref, ref, name, category: 'Houblon', unit: 'g', currentStock: 0, minStock: 0, reorder: false, ...more } as StockItem);
/** Deux « Idaho 7 » : α 13 récolte 2025 (40 g) et α 15 récolte 2026 (120 g), comptés en g. */
const DEUX = () => [item('MP-I25', 'Idaho 7 2025', { alphaPct: 13, currentStock: 40 }), item('MP-I26', 'Idaho 7 2026', { alphaPct: 15, currentStock: 120 })];
/** Deux articles de MÊME nom, qu'une seule α sépare. */
const MEME_NOM = () => [item('MP-A', 'Idaho 7', { alphaPct: 13, currentStock: 40 }), item('MP-B', 'Idaho 7', { alphaPct: 15, currentStock: 120 })];
const AUTRES = () => [item('MP-Cit', 'Citra', { currentStock: 300 }), item('MP-Mos', 'Mosaic', { currentStock: 50 })];

describe('p5 — « Idaho 7 » face à plusieurs « Idaho 7 » au stock', () => {
  beforeEach(() => {
    cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
    vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
  });
  afterEach(cleanup);
  const lire = async (nom: string, unit: string, rawMaterials: StockItem[], quantity = 1, category = 'brassage') => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    state.stocks = { rawMaterials, cleaning: [], equipment: [] };
    state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: { documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Houblons Fictifs SA', date: '10.11.2026', currency: 'CHF', invoiceNumber: 'HF-1',
      amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 82.35, category, subcategory: '', description: 'Houblons', issues: [], fieldWarnings: [], review: { status: 'checked', findings: [], readers: 2 },
      items: [{ id: 'line-1', name: nom, kind: 'stock', quantity, unit, price: 82.35 / quantity, amountTTC: 82.35, stockCategory: 'Houblon' }] } });
    const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
    const file = new File(['%PDF-1.4\n'], 'f.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    return view;
  };
  const ligne = (view: ReturnType<typeof render>, n = 1) => view.container.querySelector<HTMLElement>(`[data-dp-ligne="line-${n}"]`)!;
  const sorties = (l: HTMLElement) => [...l.querySelectorAll<HTMLElement>('[data-dp-sortie]')];
  const relies = (l: HTMLElement) => sorties(l).filter(s => s.getAttribute('data-dp-sortie')!.startsWith('relie'));
  const coches = (l: HTMLElement) => sorties(l).filter(s => s.getAttribute('aria-checked') === 'true').map(s => s.getAttribute('data-dp-sortie'));

  /** Les mêmes attendus pour une ligne lue et pour une ligne ajoutée à la main. */
  const verifierLaVue = (l: HTMLElement, avecMemeNom = false) => {
    expect(l.querySelectorAll('[data-dp-duel]')).toHaveLength(1);
    expect(l.textContent).not.toMatch(/hors stock/); // un seul état : plus « hors stock » à côté d'un picto de stock
    const r = relies(l);
    expect(r).toHaveLength(2);
    expect(r.map(s => s.textContent).join(' | ')).toMatch(/Relier à Idaho 7/);
    const texte = r.map(s => s.textContent ?? '');
    if (avecMemeNom) { expect(texte[0]).toContain('α 13'); expect(texte[1]).toContain('α 15'); } else { expect(texte[0]).toContain('2025'); expect(texte[1]).toContain('2026'); expect(texte[0]).toContain('α 13'); expect(texte[1]).toContain('α 15'); }
    expect(texte[0]).toContain('40 g'); expect(texte[1]).toContain('120 g'); // ce qui reste au stock
    expect(l.querySelector('[data-dp-sortie="bis"]')).not.toBeNull();
    expect(l.querySelector('[data-dp-sortie="neuf"]')).not.toBeNull();
    expect(coches(l)).toEqual([]); // rien n'est relié ni créé en silence
    expect(l.querySelector('[data-dp-duel]')!.textContent).toContain('2 articles');
  };

  it('ligne LUE « Idaho 7 » (pièce) : la vue FACTURE | STOCK, une sortie « Relier à » par article, bis, nouvel article ; rien relié en silence', async () => {
    const view = await lire('Idaho 7', 'pièce', DEUX());
    verifierLaVue(ligne(view));
    expect(state.writes).toEqual([]);
  });
  it('deux articles de MÊME nom : l’α sépare les sorties', async () => {
    const view = await lire('Idaho 7', 'pièce', MEME_NOM());
    verifierLaVue(ligne(view), true);
  });
  it('chaque sortie se choisit ; « Relier » à l’un puis à l’autre, la vue reste ; « bis » et « Nouvel article » aussi', async () => {
    const view = await lire('Idaho 7', 'pièce', DEUX());
    const l = ligne(view);
    fireEvent.click(relies(l)[0]);
    expect(coches(l)).toEqual(['relie-MP-I25']); expect(stockDe(1)).toBe('existing');
    expect(l.querySelector('[data-dp-duel]')!.textContent).toContain('Idaho 7 2025');
    fireEvent.click(relies(l)[1]);
    expect(coches(l)).toEqual(['relie-MP-I26']);
    expect(relies(l)).toHaveLength(2);
    fireEvent.click(l.querySelector('[data-dp-sortie="bis"]')!);
    expect(coches(l)).toEqual(['bis']); expect(stockDe(1)).toBe('new');
    expect(relies(l)).toHaveLength(2);
    fireEvent.click(l.querySelector('[data-dp-sortie="neuf"]')!);
    expect(coches(l)).toEqual(['neuf']);
  });
  it('⇄ montre d’abord ces candidats (puis le reste du stock), et ne relie rien', async () => {
    const view = await lire('Idaho 7', 'pièce', [...AUTRES(), ...DEUX()]);
    const l = ligne(view);
    fireEvent.click(within(l).getAllByRole('button', { name: 'Choisir un autre article' })[0]);
    const champ = within(l).getByLabelText('Article');
    fireEvent.focus(champ); fireEvent.click(champ); fireEvent.change(champ, { target: { value: '' } });
    const options = await within(l).findAllByRole('option');
    const noms = options.map(o => o.textContent ?? '');
    expect(noms[0]).toContain('Idaho 7 2025'); expect(noms[1]).toContain('Idaho 7 2026');
    expect(noms.findIndex(n => n.includes('Citra'))).toBeGreaterThan(1);
    expect(noms[0]).toContain('α 13'); expect(noms[0]).toContain('40 g');
    expect(coches(l)).toEqual([]); expect(state.writes).toEqual([]);
  });
  it('ligne AJOUTÉE à la main, nom « Idaho 7 » tapé : la même vue, la même règle', async () => {
    const view = await lire('Sucre candi', 'Kg', DEUX());
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
    const champ = await screen.findByRole('textbox', { name: 'Libellé ligne 2' });
    fireEvent.focusIn(champ); fireEvent.change(champ, { target: { value: 'Idaho 7' } });
    const neuve = () => champ.closest<HTMLElement>('[data-dp-ligne]')!;
    await waitFor(() => expect(neuve().querySelector('[data-dp-sortie="bis"]')).not.toBeNull());
    verifierLaVue(neuve());
    fireEvent.click(relies(neuve())[1]);
    expect(coches(neuve())).toEqual(['relie-MP-I26']);
  });
  it('ticket de RÉNOVATION : la ligne lue ne touche pas au stock (s1) ; « Idaho 7 » ajouté à la main sur ce ticket a la vue et ses sorties (ses mots du 10.11)', async () => {
    const view = await lire('Peinture', 'pièce', DEUX(), 1, 'renovation');
    expect(ligne(view).querySelector('[data-dp-sortie]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
    const champ = await screen.findByRole('textbox', { name: 'Libellé ligne 2' });
    fireEvent.focusIn(champ); fireEvent.change(champ, { target: { value: 'Idaho 7' } });
    const neuve = () => champ.closest<HTMLElement>('[data-dp-ligne]')!;
    await waitFor(() => expect(relies(neuve())).toHaveLength(2));
    verifierLaVue(neuve());
  });
  it('un seul article au même nom : le rendu validé (D215, p4) reste : une sortie « relie », jamais « relie- »', async () => {
    const view = await lire('Idaho 7', 'pièce', [item('MP-I', 'Idaho 7', { currentStock: 0 })]);
    const l = ligne(view);
    expect(sorties(l).map(s => s.getAttribute('data-dp-sortie'))).toEqual(['bis', 'relie', 'neuf']);
    expect(l.textContent).not.toContain('2 articles');
  });
  it('« Retirer » après un lien : la vue des candidats revient, rien n’est relié', async () => {
    const view = await lire('Idaho 7', 'pièce', DEUX());
    const l = ligne(view);
    fireEvent.click(relies(l)[0]);
    fireEvent.click(within(l).getByRole('button', { name: 'Retirer l’article, ligne 1' }));
    expect(coches(l)).toEqual([]); expect(relies(l)).toHaveLength(2);
  });
});
