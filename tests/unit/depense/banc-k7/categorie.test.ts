import { beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie k7-enregistrer, défauts 2 et 3 + D271 (les factures viennent en allemand, anglais, français, italien) :
 * - la catégorie d'un article NEUF est toujours un nom français de STOCK_CATEGORIES, jamais « yeast » ni « Grain » ;
 * - « Pour quoi ? » proposé est en français ;
 * - une ligne lue en allemand, anglais ou italien se relie à l'article français existant de sa famille ;
 * - la ligne lue « grain » (référence à trois lettres de préfixe) tombe dans la famille Malt.
 * Pièces INVENTÉES. Témoin : sur HEAD ces tests échouent (catégorie « Yeast » / « Grain » écrite, « yeast » dans la description, contexte « autre »).
 */
const state = vi.hoisted(() => ({ transactions: [] as any[], stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[] }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), addTransaction: (tx: any) => { state.writes.push(['transaction', tx]); state.transactions.push(tx); }, addStockItem: (type: string, item: any) => { state.writes.push(['stock', type, item]); }, addEquipment: () => undefined, updateTransaction: () => undefined } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined, adjustNumber: (...args: any[]) => state.writes.push(['adjust', ...args]), put: (...args: any[]) => state.writes.push(['put', ...args]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => { state.writes.push(['transaction', tx]); } } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
import * as entry from '../../../../src/services/purchaseEntry';
import { canonicalStockCategory, categorieArticleNeuf, contexteDe, matchStockLine, STOCK_CATEGORIES } from '../../../../src/services/stockLineMatching';
import { invoicePurchaseDescription } from '../../../../src/services/purchasePrefill';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';
import type { StockItem } from '../../../../src/types';

beforeEach(() => { state.transactions = []; state.writes = []; state.stocks = { rawMaterials: [], cleaning: [], equipment: [] }; });

/** Famille française ← mots de base des quatre langues, singulier et pluriel. L'italien : ses mots de base seulement (D271, « beaucoup plus rare »). */
const MOTS: Array<[string, string[]]> = [
  ['Levure', ['Hefe', 'Hefen', 'yeast', 'Yeasts', 'levure', 'Levures', 'lievito', 'lieviti']],
  ['Malt', ['Malz', 'grain', 'Grains', 'Getreide', 'malt', 'Malts', 'céréales', 'malto']],
  ['Houblon', ['Hopfen', 'hop', 'Hops', 'pellets', 'houblon', 'Houblons', 'luppolo']],
  ['Sucre', ['Zucker', 'sugar', 'Sugars', 'sucre', 'Sucres', 'zucchero']],
  ['Additif', ['Zusatz', 'Zusatzstoffe', 'additive', 'Additives', 'additif', 'Additifs', 'additivo']],
  ['Emballage', ['Verpackung', 'Verpackungen', 'packaging', 'emballage', 'Emballages', 'imballaggio']],
  ['Consommable', ['Verbrauchsmaterial', 'consumable', 'Consumables', 'consommable', 'Consommables']],
  ['Détergent', ['Reinigungsmittel', 'detergent', 'détergent', 'detersivo']],
  ['Désinfectant', ['Desinfektionsmittel', 'disinfectant', 'désinfectant', 'disinfettante']],
];

describe('catégorie de stock : les quatre langues ramenées au nom français', () => {
  for (const [famille, mots] of MOTS) {
    it(`${famille} ← ${mots.join(', ')}`, () => {
      expect(mots.map(canonicalStockCategory)).toEqual(mots.map(() => famille));
      expect(STOCK_CATEGORIES).toContain(famille);
    });
  }
  it('la lecture des articles existants ne change pas : initiale en capitale pour un mot inconnu, casse et accents pour les catégories connues', () => {
    expect(['malt', 'HOUBLON', 'cip alcalin', 'épices du Banc', ''].map(canonicalStockCategory)).toEqual(['Malt', 'Houblon', 'CIP alcalin', 'Épices du Banc', '']);
  });
});

const ligne = (id: string, description: string, stockCategory: string | undefined, more: Partial<PurchaseLineDraft> = {}): PurchaseLineDraft => ({ id, description, kind: 'ingredient', amount: 1, quantity: 2, unit: 'kg', stockAction: 'new', equipmentAction: 'none', stockCategory, ...more });
let n = 0;
const brouillon = (lines: PurchaseLineDraft[]): PurchaseDraft => ({ submissionId: `k7-categorie-${String(++n).padStart(5, '0')}`, date: '09.09.2026', vendor: 'Boutique fictive', invoiceNumber: '1', description: 'Achat', category: 'brassage', amount: lines.length, lines, paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF' });
const categoriesEcrites = (lines: PurchaseLineDraft[]) => { state.writes = []; entry.savePurchase(brouillon(lines)); return state.writes.filter(w => w[0] === 'stock').map(w => w[2].category); };

describe('k7 — un article neuf n’est jamais écrit dans une catégorie étrangère', () => {
  it('« yeast », « grain », « hop », « additive » : Levure, Malt, Houblon, Additif', () => {
    expect(categoriesEcrites([ligne('l1', 'Souche fictive', 'yeast', { unit: 'Stk' }), ligne('l2', 'Mélange fictif', 'grain'), ligne('l3', 'Variété fictive', 'hop', { unit: 'g' }), ligne('l4', 'Produit fictif', 'additive', { unit: 'pce' })]))
      .toEqual(['Levure', 'Malt', 'Houblon', 'Additif']);
  });
  it('une catégorie allemande ou italienne s’écrit en français', () => {
    expect(categoriesEcrites([ligne('l1', 'Souche fictive', 'Hefe', { unit: 'Stk' }), ligne('l2', 'Mélange fictif', 'Getreide'), ligne('l3', 'Variété fictive', 'Hopfen', { unit: 'g' }), ligne('l4', 'Produit fictif', 'Zucker'), ligne('l5', 'Autre fictif', 'luppolo', { unit: 'g' })]))
      .toEqual(['Levure', 'Malt', 'Houblon', 'Sucre', 'Houblon']);
  });
  it('une catégorie valide reste telle quelle (sa casse, ses synonymes français)', () => {
    expect(categoriesEcrites([ligne('l1', 'Produit fictif', 'malt'), ligne('l2', 'Produit fictif 2', 'Désinfectant', { kind: 'cleaning' })])).toEqual(['Malt', 'Désinfectant']);
  });
  it('une catégorie inconnue sans nature déduite : le repli par nature de ligne, jamais le mot lu', () => {
    expect(categoriesEcrites([ligne('l1', 'Produit fictif', 'truc bizarre'), ligne('l2', 'Carton fictif', 'cartonnage', { kind: 'packaging', unit: 'Stk' }), ligne('l3', 'Spray fictif', 'cleaning', { kind: 'cleaning', unit: 'Stk' })]))
      .toEqual(['Divers', 'Emballage', 'Consommable']);
  });
  it('une catégorie inconnue : la nature déduite du libellé passe avant le repli (« Hopfen Saaz » → Houblon)', () => {
    expect(categoriesEcrites([ligne('l1', 'Hopfen fictif', 'truc bizarre', { unit: 'g' })])).toEqual(['Houblon']);
  });
  it('un emballage au libellé de houblon n’est jamais un houblon (D262c)', () => {
    expect(categorieArticleNeuf({ description: 'Hop Filter Bag fictif', stockCategory: 'truc bizarre', kind: 'packaging' })).toBe('Emballage');
  });
  it('sans catégorie lue : le repli d’avant, inchangé', () => {
    expect(categoriesEcrites([ligne('l1', 'Produit fictif', undefined), ligne('l2', 'Carton fictif', '', { kind: 'packaging', unit: 'Stk' })])).toEqual(['Divers', 'Emballage']);
  });
});

describe('k7 — « Pour quoi ? » proposé est en français', () => {
  const item = (name: string, kind: string, stockCategory?: string, reference = '') => ({ id: name, name, kind, reference, quantity: 1, unit: 'kg', price: 1, amountTTC: 1, stockCategory }) as any;
  const scan = (items: any[]) => ({ vendor: 'Boutique fictive', invoiceNumber: '', items }) as any;
  it('« yeast, grain, hop, additive » → levures, malts, houblons, additifs', () => {
    const texte = invoicePurchaseDescription(scan([item('A', 'stock', 'yeast'), item('B', 'stock', 'grain'), item('C', 'stock', 'hop'), item('D', 'stock', 'additive')]));
    expect(texte).toBe('Boutique fictive · levures, malts, houblons, additifs');
    expect(texte).not.toMatch(/yeast|grain|hop\b|additive/);
  });
  it('allemand et italien : « Hefe, Malz, Hopfen, Zucker, lievito » en français', () => {
    expect(invoicePurchaseDescription(scan([item('A', 'stock', 'Hefe'), item('B', 'stock', 'Malz'), item('C', 'stock', 'Hopfen'), item('D', 'stock', 'Zucker'), item('E', 'stock', 'lievito')])))
      .toBe('Boutique fictive · levures, malts, houblons, sucres');
  });
  it('une catégorie inconnue n’est pas recopiée : la nature de la ligne la remplace', () => {
    const texte = invoicePurchaseDescription(scan([item('Hopfen fictif', 'stock', 'truc bizarre'), item('Cuve fictive', 'equipment', 'truc bizarre')]));
    expect(texte).toBe('Boutique fictive · houblons, matériel');
    expect(texte).not.toMatch(/truc/);
  });
});

describe('k7 — la ligne lue « grain » à référence MAG… est un malt (défaut 3)', () => {
  const ligneLue = { description: 'Mélange fictif sans mot de famille', stockCategory: 'grain', reference: 'MAG0123', kind: 'ingredient' };
  it('contexte Malt (HEAD : « autre », car la catégorie « Grain » n’était pas reconnue et « MAG » n’est pas un préfixe à deux lettres)', () => {
    expect(contexteDe(ligneLue)).toBe('Malt');
  });
  it('les deux voisines (référence MA…, même catégorie lue) sont dans la même famille', () => {
    expect(contexteDe({ ...ligneLue, reference: 'MA0222' })).toBe('Malt');
  });
  it('sans catégorie lue, une référence à trois lettres reste « autre » : dans le doute, rien (inferNature, hors de la voie)', () => {
    expect(contexteDe({ ...ligneLue, stockCategory: undefined })).toBe('autre');
  });
  it('une ligne d’emballage de catégorie « grain » reste hors stock', () => {
    expect(contexteDe({ ...ligneLue, kind: 'packaging' })).toBe('autre');
  });
});

describe('k7 — une ligne lue dans une autre langue se relie à l’article français de sa famille', () => {
  const article = (category: string, unit = 'kg'): StockItem => ({ id: 'A', ref: 'A', name: 'Testar Pur', category, unit, currentStock: 1, minStock: 0, reorder: false }) as StockItem;
  const lue = (stockCategory: string, unit = 'Kg') => ({ description: 'Testar Pur', unit, quantity: 2, vendor: 'Boutique fictive', stockCategory, kind: 'ingredient' });
  it.each([
    ['allemand', 'Malz', 'Malt'], ['allemand', 'Hopfen', 'Houblon'], ['allemand', 'Hefe', 'Levure'], ['allemand', 'Zucker', 'Sucre'], ['allemand', 'Getreide', 'Malt'],
    ['anglais', 'grain', 'Malt'], ['anglais', 'hops', 'Houblon'], ['anglais', 'yeast', 'Levure'], ['anglais', 'sugar', 'Sucre'],
    ['français', 'malts', 'Malt'], ['français', 'houblons', 'Houblon'], ['français', 'levures', 'Levure'],
    ['italien', 'lievito', 'Levure'],
  ])('%s : « %s » ↔ article « %s »', (_langue, lu, francais) => {
    expect(matchStockLine(lue(lu), [article(francais)])?.item.ref).toBe('A');
  });
  it('et la famille sert toujours à refuser : « Hefe » ne se relie pas à un malt', () => {
    expect(matchStockLine(lue('Hefe'), [article('Malt')])).toBeUndefined();
    expect(matchStockLine(lue('yeast'), [article('Houblon', 'g')])).toBeUndefined();
  });
});
