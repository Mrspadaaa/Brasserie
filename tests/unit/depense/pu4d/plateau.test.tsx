// @vitest-environment jsdom
/**
 * Voie p-port-pu4d (D361, D364) : le plateau de sa maquette pu4d, porté. Peu de tests, ciblés :
 *  - les règles pures : le stock avant → après réception, le choix d'unité avec la pièce (D353) ;
 *  - la structure sur l'écran rendu : l'article relié montre « 1 → 7 Kg » (stock réel du banc simulé), la ligne hors stock porte « Suivre au stock » (greffe pa1d)
 *    et ses types en pastilles, aucun menu ni « plus » dans le plateau (D350, D346) ;
 *  - D364 : une ligne d'emballage sous « Local » se range dans la bande Rénovation par le champ « Famille », et y reste.
 * Gemini jamais appelé ; stock SIMULÉ ; rien n'est écrit.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
import { apresReception, choixUnite } from '../../../../src/ui/depense/calculPlateau';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.writes = []; state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('règles pures du plateau pu4d', () => {
  const article: any = { id: 'a', ref: 'MP-Maris', name: 'Maris Otter', unit: 'kg', category: 'Malt', currentStock: 18 };
  const ligne = (id: string, quantity: number, unit: string, stockRef = 'MP-Maris'): any => ({ id, description: 'Maris Otter', kind: 'ingredient', quantity, unit, stockAction: 'existing', stockRef, equipmentAction: 'none' });
  it('le stock après réception : 18 → 24 Kg ; deux lignes du même article s’additionnent ; une unité illisible ne dit rien (jamais 0)', () => {
    expect(apresReception([ligne('l1', 6, 'Kg')], 'l1', article, l => l.unit)?.texte).toBe('18 → 24 Kg');
    expect(apresReception([ligne('l1', 6, 'Kg'), ligne('l2', 500, 'g')], 'l1', article, l => l.unit)?.texte).toBe('18 → 24,5 Kg');
    expect(apresReception([ligne('l1', 6, '')], 'l1', article, l => l.unit)).toBeUndefined();
    expect(apresReception([ligne('l1', 6, 'Kg', 'autre')], 'l1', article, l => l.unit)).toBeUndefined();
  });
  it('le choix d’unité offre toujours la pièce (D353) ; une unité lue hors liste passe en tête', () => {
    expect(choixUnite('malt', 'Kg').map(c => c.label)).toEqual(['Kg', 'g', 'pièce']);
    expect(choixUnite('houblon', 'g').map(c => c.label)).toEqual(['g', 'Kg', 'pièce']);
    expect(choixUnite('levure', 'sachet').map(c => c.label)).toEqual(['sachets', 'g', 'pièce']);
    expect(choixUnite('materiel', 'Stk').map(c => c.label)).toEqual(['pièce', 'L']);
    expect(choixUnite('malt', 'L').map(c => c.label)).toEqual(['L', 'Kg', 'pièce']);
  });
});

const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number, stockCategory = '') =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC: Math.round(quantity * price * 100) / 100, reference: '', variant: '', stockCategory, evidence: '', ambiguity: '' });
const lire = async (category: string, items: Array<ReturnType<typeof ligne>>, tvaAmount: number | null = null, totalImpose?: number) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: JSON.parse(JSON.stringify(stockJson.articles)), cleaning: [], equipment: [] };
  const total = totalImpose ?? Math.round(items.reduce((a, i) => a + i.amountTTC, 0) * 100) / 100;
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: { ...JSON.parse(JSON.stringify(lecture)), items, category, amountTTC: total, amountHT: null, tvaRate: null, tvaAmount, orderNumber: '', invoiceNumber: 'B-3003', vendor: 'Brico Fictif SA' } });
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

describe('le plateau porté, sur l’écran rendu', () => {
  it('une ligne reliée : « 1 → 7 Kg » à droite de la nature, ses unités en segment avec la pièce, aucun menu, ni « plus », ni « au centime »', async () => {
    const view = await lire('brassage', [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), ligne(2, 'Détartrant express 1 L', 'stock', 1, 'Stk', 9.5, 'CIP acide')]);
    const a = ouvrir(view, 'line-1');
    expect(a.querySelector('[data-dp-apres]')?.textContent).toBe('1 → 7 Kg');
    const seg = a.querySelector('[data-dp-unite-segments]')!;
    expect([...seg.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Kg', 'g', 'pièce']);
    expect(seg.querySelector('[aria-pressed="true"]')?.textContent).toBe('Kg');
    expect(a.querySelector('[data-dp-pu4d] select:not([data-dp-famille])')).toBeNull();
    expect(a.querySelector('[data-dp-plus]')).toBeNull();
    expect(a.querySelector('[data-dp-centime]')).toBeNull();
    expect(a.querySelector('[data-dp-stock]')?.textContent).toContain('Maris Otter');
  });
  it('une ligne hors stock : « article — · hors stock », « Suivre au stock » (greffe pa1d) et la famille sous « Famille », sans pastilles (D364)', async () => {
    const view = await lire('brassage', [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), ligne(2, 'Tournevis cruciforme', 'equipment', 1, 'Stk', 9.5)]);
    const c = ouvrir(view, 'line-2');
    expect(c.querySelector('[data-dp-stock]')?.textContent).toContain('hors stock');
    expect(c.querySelector('[data-dp-types]')).toBeNull();
    expect(c.querySelector('[data-dp-suivre], button')).not.toBeNull();
    expect(c.querySelector('select[data-dp-famille]')).not.toBeNull();
    expect(c.querySelector('select:not([data-dp-famille])')).toBeNull();
  });
});

describe('D364 — changer la famille d’une ligne', () => {
  it('une ligne d’emballage sous « Local », ouverte : « Famille » → Rénovation, la ligne est dans la bande Rénovation, et elle y reste', async () => {
    const view = await lire('renovation', [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), ligne(2, 'Peinture murale blanche mate 10 L', 'stock', 1, 'Stk', 64.9), ligne(3, 'Grand sac', 'stock', 1, 'Stk', 5, 'Emballage')]);
    expect(bandeDe(view, 'line-3')).toBe('emballage');
    const l = ouvrir(view, 'line-3');
    const select = l.querySelector('select[data-dp-famille]') as HTMLSelectElement;
    expect(select.value).toBe('emballage');
    fireEvent.change(select, { target: { value: 'renovation' } });
    expect(bandeDe(view, 'line-3')).toBe('renovation');
    fireEvent.click(ligneEl(view, 'line-3').querySelector('[data-dp-nature] button:not([aria-pressed="true"])')!);
    expect(bandeDe(view, 'line-3')).toBe('renovation'); // le choix tient contre la règle, même quand la nature change
    expect(state.writes).toEqual([]);
  });
});

describe('D370 — le libellé d’une ligne ajoutée', () => {
  it('« + Ajouter une ligne », puis « Rouleau » tapé lettre par lettre : le champ reste le même, sans partir à la première lettre', async () => {
    const view = await lire('renovation', [ligne(1, 'Peinture murale blanche mate 10 L', 'stock', 1, 'Stk', 64.9)]);
    const avant = new Set([...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
    const id = [...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')!).find(x => !avant.has(x))!;
    const l = ouvrir(view, id);
    const champ = l.querySelector('[aria-label^="Libellé ligne"]') as HTMLTextAreaElement;
    expect(champ).not.toBeNull();
    champ.focus();
    let tape = '';
    for (const lettre of 'Rouleau') {
      tape += lettre;
      fireEvent.change(champ, { target: { value: tape } });
      expect(champ.isConnected).toBe(true); // le même champ, toujours là : le focus n'a pas à partir
    }
    expect(champ.value).toBe('Rouleau');
    expect(ligneEl(view, id).querySelector('[aria-label^="Libellé ligne"]')).toBe(champ);
    expect(champ.closest('[data-dp-niveau="inconnu"]')).toBeNull(); // nommée, plus de rouge
    expect(state.writes).toEqual([]);
  });
});

describe('D371, D372 — une ligne en pièce reliée à un houblon compté en g', () => {
  it('« Galaxy » en pièce, « Suivre au stock » : reliée (pas de doublon) ; son face à face Facture | Stock (pu4d), « compté en g », cinq cases, g proposé ; g d’un toucher', async () => {
    const view = await lire('brassage', [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3)]);
    const avant = new Set([...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une ligne/ }));
    const id = [...view.container.querySelectorAll('[data-dp-ligne]')].map(e => e.getAttribute('data-dp-ligne')!).find(x => !avant.has(x))!;
    let l = ouvrir(view, id);
    const champ = l.querySelector('[aria-label^="Libellé ligne"]') as HTMLTextAreaElement;
    champ.focus(); fireEvent.change(champ, { target: { value: 'Galaxy' } }); champ.blur();
    l = ligneEl(view, id);
    fireEvent.click(l.querySelector('[data-dp-cases-unite] button[data-val="pièce"]')!);
    fireEvent.click(screen.getByRole('button', { name: /Suivre au stock/ }));
    l = ligneEl(view, id);
    expect(l.querySelector('[data-dp-stock]')?.textContent).toContain('Galaxy');
    expect(l.querySelector('[data-dp-stock]')?.textContent).toContain('relié');
    // D372 : sa vue, pas une alerte : le face à face rouge, l'unité en ▒, les cinq cases, l'unité du stock proposée.
    const duel = l.querySelector('[data-dp-duel]');
    expect(duel?.getAttribute('data-dp-lien-etat')).toBe('inconnu');
    expect(duel?.textContent).toContain('pièce ne s’ajoute pas');
    expect(duel?.textContent).toContain('compté en g');
    expect(l.querySelector('[data-dp-unite-segments]')).toBeNull();
    const cases = l.querySelector('[data-dp-cases-unite]');
    expect(cases?.textContent).toContain('g proposé, comme au stock');
    expect(l.querySelector('[data-dp-alerte-unite]')).toBeNull();
    fireEvent.click(cases!.querySelector('button[data-val="g"]')!);
    l = ligneEl(view, id);
    expect(l.querySelector('[data-dp-duel]')).toBeNull();
    expect(l.querySelector('[data-dp-cases-unite]')).toBeNull();
    expect(l.querySelector('[data-dp-unite-segments] [aria-pressed="true"]')?.textContent).toBe('g');
    expect(state.writes).toEqual([]);
  });
});

describe('D374 — « Là on voit pas la vue des stocks ? » : une ligne à l’article proposé montre son face à face', () => {
  it('malt en Kg et levure « 2 Stk » proposés : FACTURE | STOCK, ≈ jaune, « avant → après » dans le stock ; « Garder » : le face à face part', async () => {
    const view = await lire('brassage', [ligne(1, 'Weizenmalz hell, Kg', 'stock', 1, 'Kg', 1.55), ligne(2, 'Safale BE-256 (Abbaye) 11.5 g', 'stock', 2, 'Stk', 4)]);
    for (const id of ['line-1', 'line-2']) {
      const l = ouvrir(view, id);
      expect(l.querySelector('[data-dp-stock]')?.textContent).toContain('proposé');
      const duel = l.querySelector('[data-dp-duel]');
      expect(duel?.getAttribute('data-dp-lien-etat')).toBe('repris');
      expect(duel?.textContent).toContain('FACTURE');
      expect(duel?.textContent).toContain('STOCK');
      expect(duel?.querySelector('[data-dp-apres]')?.textContent).toMatch(/→/);
    }
    const levure = ligneEl(view, 'line-2').querySelector('[data-dp-duel]')!;
    expect(levure.textContent).toContain('2 Stk');
    expect(levure.textContent).toMatch(/compté en sachet/);
    const garder = [...ligneEl(view, 'line-1').querySelectorAll('button')].find(b => b.textContent === 'Garder')!;
    fireEvent.click(garder);
    const malt = ligneEl(view, 'line-1');
    expect(malt.querySelector('[data-dp-duel]')).toBeNull();
    expect(malt.querySelector('[data-dp-apres]')?.textContent).toMatch(/→/);
    expect(state.writes).toEqual([]);
  });
});

describe('D375 — « SI je click en ht, je peux plus revenir ? » : la TVA lue reste offerte', () => {
  it('TVA lue 1,25 sans lectures divergentes : « sans TVA » la vide, la tuile rouverte offre encore 1,25 ; la reposer la remet', async () => {
    const view = await lire('brassage', [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3)], 1.25);
    const tuile = view.container.querySelector('[data-dp="tuile-tva"]') as HTMLElement;
    const panneau = () => view.container.querySelector('[data-dp="panneau-tva"]') as HTMLElement;
    const cases = () => [...panneau().querySelectorAll('button')].map(b => ({ t: b.textContent ?? '', p: b.getAttribute('aria-pressed') }));
    fireEvent.click(tuile);
    expect(cases().some(c => /1,25/.test(c.t) && c.p === 'true')).toBe(true);
    expect(panneau().textContent).not.toContain('proposé');
    fireEvent.click([...panneau().querySelectorAll('button')].find(b => /sans TVA/.test(b.textContent ?? ''))!);
    expect(tuile.textContent).not.toContain('1,25');
    fireEvent.click(tuile);
    const lue = [...panneau().querySelectorAll('button')].find(b => /1,25/.test(b.textContent ?? ''));
    expect(lue).toBeTruthy();
    fireEvent.click(lue!);
    expect(tuile.textContent).toContain('1,25');
    expect(state.writes).toEqual([]);
  });
});

describe('D377 — « Item en rouge mais pas total ?? »', () => {
  it('q × prix ≠ montant, le total ne tranche pas : le montant de la ligne est rouge, le total de sa bande aussi', async () => {
    const view = await lire('brassage', [{ ...ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), amountTTC: 14.5 }], null, 20);
    const l = ligneEl(view, 'line-1');
    expect(l.querySelector('[data-dp-niveau="inconnu"]')).not.toBeNull();
    const bande = l.closest('[data-dp-bande]')!;
    expect(bande.querySelector('[data-dp-sous-montant]')?.getAttribute('data-dp-niveau')).toBe('inconnu');
  });
});

describe('D378 — « on peut toujours pas fermé les famille et les 2 boutons, plier déplier sont absent »', () => {
  it('pièce de brassage (Malts sans sous-familles) : chevron sur l’en-tête, ouvert par défaut ; « Plié » cache ses rangées, « Déplié » les rend', async () => {
    const view = await lire('brassage', [ligne(1, 'Maris Otter, Kg', 'stock', 6, 'Kg', 2.3), ligne(2, 'Pilsner Malz, Kg', 'stock', 5, 'Kg', 1.65)]);
    const bande = ligneEl(view, 'line-1').closest('[data-dp-bande]') as HTMLElement;
    const pli = bande.querySelector('[data-dp-bande-pli]') as HTMLButtonElement;
    expect(pli).not.toBeNull();
    expect(pli.getAttribute('aria-expanded')).toBe('true');
    const corps = () => bande.querySelector('[data-dp-sg-corps]') as HTMLElement;
    expect(corps().hidden).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /^Plié$/ }));
    expect(corps().hidden).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^Déplié$/ }));
    expect(corps().hidden).toBe(false);
    fireEvent.click(pli);
    expect(corps().hidden).toBe(true);
  });
});
