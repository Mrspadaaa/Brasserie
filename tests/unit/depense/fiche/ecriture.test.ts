import { beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie s6-fiche : ce que l'enregistrement écrit pour un article neuf (R3b, R5, R8, R10, R12, R13, R16). Drive et Firestore simulés, aucune donnée réelle.
 * Les témoins échouent sur HEAD par leur comportement : l'article y est écrit `name = description`, sans α, EBC, origine ni fiche.
 */
const state = vi.hoisted(() => ({ transactions: [] as any[], stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[] }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), addTransaction: (tx: any) => { state.writes.push(['transaction', tx]); state.transactions.push(tx); }, addStockItem: (type: string, item: any) => { state.writes.push(['stock', type, item]); }, addEquipment: () => undefined, updateTransaction: () => undefined } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined, adjustNumber: (...args: any[]) => state.writes.push(['adjust', ...args]), put: (...args: any[]) => state.writes.push(['put', ...args]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => { state.writes.push(['transaction', tx]); } } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
import * as entry from '../../../../src/services/purchaseEntry';
import { DONNEES_FIXTURE } from '../../../../src/domain/hopIndex/v4/data';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';

const item = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}) => ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more }) as any;
const nouvelle = (id: string, description: string, unit: string, quantity: number, more: Partial<PurchaseLineDraft> = {}): PurchaseLineDraft => ({ id, description, kind: 'ingredient', amount: 1, quantity, unit, stockAction: 'new', equipmentAction: 'none', ...more });
let counter = 0;
const draft = (lines: PurchaseLineDraft[]): PurchaseDraft => ({ submissionId: `s6-fiche-${String(++counter).padStart(5, '0')}`, date: '27.04.2026', vendor: 'Fournisseur test', invoiceNumber: '1', description: 'Achat', category: 'brassage', amount: Math.round(lines.reduce((sum, l) => sum + (l.amount ?? 0) * 100, 0)) / 100, lines, paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF' });
const withStock = (...items: any[]) => { state.stocks = { rawMaterials: items, cleaning: [], equipment: [] }; };
const ecrits = () => state.writes.filter(w => w[0] === 'stock').map(w => w[2]);
beforeEach(() => { state.transactions = []; state.writes = []; state.stocks = { rawMaterials: [], cleaning: [], equipment: [] }; });

describe('R5 : « Target 11.3% » face à « Target » (α 11,8) s’écrit « Target bis », α 11,3', () => {
  it('nom, α, et le reste de la création inchangé (ref, unité, quantité, fournisseur, mouvement)', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }));
    const value = draft([nouvelle('h1', 'Target 11.3%', 'g', 40)]);
    entry.savePurchase(value);
    expect(ecrits()).toHaveLength(1);
    expect(ecrits()[0]).toMatchObject({ name: 'Target bis', alphaPct: 11.3, unit: 'g', currentStock: 40, minStock: 0, reorder: false, supplier: 'Fournisseur test', ref: `MP-${value.submissionId}-0` });
    expect(Object.keys(ecrits()[0])).not.toContain('colorEbc');
    expect(Object.keys(ecrits()[0])).not.toContain('fiche');
    expect(state.writes.some(w => w[0] === 'put' && w[3]?.type === 'receipt' && w[3].quantity === 40 && w[3].unit === 'g')).toBe(true);
  });
});

describe('R3b : « Cascade CH » face à « Cascade US » s’écrit « Cascade CH » avec son origine et sa fiche approchée', () => {
  it('nom, origine, et la fiche du catalogue plein quand il est donné', () => {
    withStock(item('U', 'Cascade US', 'Houblon', 'g'));
    entry.savePurchase(draft([nouvelle('h1', 'Cascade CH', 'g', 30)]), { catalogues: { houblons: DONNEES_FIXTURE.catalogue } } as any);
    expect(ecrits()[0]).toMatchObject({ name: 'Cascade CH', origin: 'CH', fiche: { id: 'beermaverick-cascade', approchee: true } });
    expect(Object.keys(ecrits()[0])).not.toContain('alphaPct');
  });
  it('sans catalogue : aucune fiche, jamais une fiche différente selon le moment', () => {
    withStock(item('U', 'Cascade US', 'Houblon', 'g'));
    entry.savePurchase(draft([nouvelle('h1', 'Cascade CH', 'g', 30)]));
    expect(ecrits()[0]).toMatchObject({ name: 'Cascade CH', origin: 'CH' });
    expect(Object.keys(ecrits()[0])).not.toContain('fiche');
  });
});

describe('R8 : « Münchner Malz 15 EBC » face à colorEbc 20 s’écrit « Münchner Malz bis », colorEbc 15', () => {
  it('l’EBC sort du nom et entre dans colorEbc ; la fiche du malt est exacte pour son nom canonique', () => {
    withStock(item('M', 'Münchner Malz', 'Malt', 'kg', { colorEbc: 20 }));
    entry.savePurchase(draft([nouvelle('m1', 'Münchner Malz 15 EBC', 'kg', 5, { stockCategory: 'malt' })]));
    expect(ecrits()[0]).toMatchObject({ name: 'Münchner Malz bis', colorEbc: 15, category: 'Malt', fiche: { id: 'munich-malt', approchee: false } });
  });
});

describe('R10 : l’article écrit suit la ligne COURANTE ; le nom tapé reste', () => {
  it('libellé « Galaxy 17.2% » : Galaxy, α 17,2 ; avec un nom tapé, le nom tapé', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }));
    entry.savePurchase(draft([nouvelle('h1', 'Galaxy 17.2%', 'g', 60)]));
    expect(ecrits()[0]).toMatchObject({ name: 'Galaxy', alphaPct: 17.2 });
    state.writes = []; state.transactions = [];
    entry.savePurchase(draft([nouvelle('h1', 'Galaxy 17.2%', 'g', 60, { articleName: '  Galaxy du Banc ' })]));
    expect(ecrits()[0]).toMatchObject({ name: 'Galaxy du Banc', alphaPct: 17.2 });
  });
});

describe('R12 : le menu « Créer un nouvel article » sur « Maris Otter, Kg » écrit « Maris Otter »', () => {
  it('le conditionnement imprimé sort du nom ; l’unité et la quantité restent celles de la ligne', () => {
    const value = draft([nouvelle('m1', 'Maris Otter, Kg', 'Kg', 6)]);
    entry.savePurchase(value);
    expect(ecrits()[0]).toMatchObject({ name: 'Maris Otter', unit: 'Kg', currentStock: 6 });
    const tx = state.writes.find(w => w[0] === 'transaction')![1];
    expect(tx.finance.lines[0]).toMatchObject({ description: 'Maris Otter, Kg', unit: 'Kg', quantity: 6 });
  });
  it('un produit hors houblon et malt garde son libellé (comportement d’avant)', () => {
    entry.savePurchase(draft([nouvelle('e1', 'Étiquettes autocollantes, 100 pces', 'pce', 100, { kind: 'packaging' })]));
    expect(ecrits()[0].name).toBe('Étiquettes autocollantes, 100 pces');
  });
});

describe('R13, T4 : jamais deux articles du même nom', () => {
  it('ambigu : le menu « Créer » donne un nom libre', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }), item('B', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 }));
    entry.savePurchase(draft([nouvelle('h1', 'Target', 'g', 40)]));
    expect(ecrits()[0].name).toBe('Target bis 2');
  });
  it('deux lignes du même produit dans la saisie : « bis » puis « bis 2 »', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }));
    entry.savePurchase(draft([nouvelle('h1', 'Target 12%', 'g', 40), nouvelle('h2', 'Target 12.5%', 'g', 40)]));
    expect(ecrits().map(i => i.name)).toEqual(['Target bis', 'Target bis 2']);
  });
  it('un nom tapé déjà pris, ou vide, est refusé avec un message vrai', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }));
    const pris = draft([nouvelle('h1', 'Target 11.3%', 'g', 40, { articleName: ' target ' })]);
    expect(() => entry.savePurchase(pris)).toThrow(/déjà/);
    expect(entry.validatePurchase(pris, state.stocks as any).join(' ')).toMatch(/Un article porte déjà ce nom/);
    const vide = draft([nouvelle('h1', 'Target 11.3%', 'g', 40, { articleName: '   ' })]);
    expect(entry.validatePurchase(vide, state.stocks as any).join(' ')).toMatch(/nom de l’article/);
    expect(ecrits()).toHaveLength(0);
  });
  it('deux noms tapés égaux dans une saisie : refusé', () => {
    const value = draft([nouvelle('h1', 'Citra 12%', 'g', 40, { articleName: 'Citra' }), nouvelle('h2', 'Citra 13%', 'g', 40, { articleName: 'citra' })]);
    expect(entry.validatePurchase(value, state.stocks as any).join(' ')).toMatch(/Un article porte déjà ce nom/);
  });
  it('« Créer » sur un produit que s1 relierait : refusé, relier la ligne (jamais un « bis » inventé)', () => {
    withStock(item('G', 'Galaxy', 'Houblon', 'g'));
    expect(entry.validatePurchase(draft([nouvelle('h1', 'Galaxy 17.2%', 'g', 60)]), state.stocks as any).join(' ')).toMatch(/existe déjà.*relie/);
  });
});

describe('R16 : l’article existant ne bouge pas', () => {
  it('identique en profondeur avant et après ; aucun put ni ajustement ne le vise', () => {
    const T = item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8, supplier: 'X' });
    withStock(T);
    const avant = JSON.parse(JSON.stringify(T));
    entry.savePurchase(draft([nouvelle('h1', 'Target 11.3%', 'g', 40)]));
    expect(JSON.parse(JSON.stringify(state.stocks.rawMaterials[0]))).toEqual(avant);
    expect(state.writes.filter(w => (w[0] === 'adjust' || w[0] === 'put') && (w[2] === 'T' || w[1] === 'T' || w[3]?.stockItemRef === 'T'))).toEqual([]);
  });
});

describe('une saisie sans produit connu s’écrit comme avant', () => {
  it('« Sabro® 13.4% » inconnu : « Sabro », α 13,4 ; le reste inchangé', () => {
    entry.savePurchase(draft([nouvelle('h1', 'Sabro® 13.4%', 'g', 30)]));
    expect(ecrits()[0]).toMatchObject({ name: 'Sabro', alphaPct: 13.4, category: 'Divers' });
  });
});

describe('tri n° 1 (R1) : une saisie refusée puis rejouée garde son nom et ne lève aucune erreur', () => {
  it('« Target bis » déjà dans le cache local (ref de CETTE saisie) : ni « existe déjà », ni « bis 2 »', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }));
    const value = draft([nouvelle('h1', 'Target 11.3%', 'g', 40)]);
    // Le premier essai a écrit l'article dans le cache local, puis le lot a été refusé : l'article y est encore, sous la ref de cette saisie.
    state.stocks.rawMaterials.push(item(`MP-${value.submissionId}-0`, 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 }));
    expect(entry.validatePurchase(value, state.stocks as any)).toEqual([]);
    expect(() => entry.savePurchase(value)).not.toThrow();
    expect(ecrits()[0]).toMatchObject({ name: 'Target bis', alphaPct: 11.3, ref: `MP-${value.submissionId}-0` });
  });
  it('produit sans « bis » : « Cascade CH » reste « Cascade CH » au rejeu (pas « Cascade CH bis »), deux lignes : « bis » puis « bis 2 » comme au premier essai', () => {
    withStock(item('U', 'Cascade US', 'Houblon', 'g'), item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }));
    const value = draft([nouvelle('h1', 'Cascade CH', 'g', 30), nouvelle('h2', 'Target 12%', 'g', 40), nouvelle('h3', 'Target 12.5%', 'g', 40)]);
    state.stocks.rawMaterials.push(item(`MP-${value.submissionId}-0`, 'Cascade CH', 'Houblon', 'g', { origin: 'CH' }), item(`MP-${value.submissionId}-1`, 'Target bis', 'Houblon', 'g', { alphaPct: 12 }));
    expect(entry.validatePurchase(value, state.stocks as any)).toEqual([]);
    entry.savePurchase(value);
    expect(ecrits().map(i => i.name)).toEqual(['Cascade CH', 'Target bis', 'Target bis 2']);
  });
  it('un article d’une AUTRE saisie, lui, compte toujours comme existant', () => {
    withStock(item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 }), item('MP-autre-saisie-0', 'Target bis', 'Houblon', 'g', { alphaPct: 11.3 }));
    expect(entry.validatePurchase(draft([nouvelle('h1', 'Target 11.3%', 'g', 40)]), state.stocks as any).join(' ')).toMatch(/existe déjà.*relie/);
  });
});
