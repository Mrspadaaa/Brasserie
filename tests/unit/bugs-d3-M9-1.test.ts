/**
 * M9-1 (voie d3) : une ligne d'ingrédient du brassage restée « hors stock » ne s'enregistre plus sans alerte à « Confirmer » (cas C0 et C3 de
 * tests/unit/depense/d381/stock-repare.test.tsx). Règle pure : `validatePurchase`. Aucune lecture réelle, aucun appel IA.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/storage', () => ({ StorageService: { getConfig: () => ({ fiscal: { isTvaRegistered: false } }), getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => [] } }));
import { validatePurchase, type PurchaseDraft, type PurchaseLineDraft } from '../../src/services/purchaseEntry';

const stocks = { rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any;
const ligne = (extra: Partial<PurchaseLineDraft> = {}): PurchaseLineDraft => ({ id: 'line-1', description: 'Citra', kind: 'ingredient', amount: 9, quantity: 100, unit: 'g', nomLu: 'Citra', stockAction: 'none', equipmentAction: 'none', ...extra });
const brouillon = (lines: PurchaseLineDraft[], category: any = 'brassage'): PurchaseDraft => ({
  submissionId: 'SUB-12345678', date: '2026-10-21', vendor: 'Brauhaus Ouest', invoiceNumber: 'F-1', description: 'Essai', category, amount: lines.reduce((a, l) => a + (l.amount ?? 0), 0), lines,
  paymentStatus: 'unpaid', paymentMethod: 'transfer' as any, paymentDate: '', dueDate: '',
} as PurchaseDraft);
const HORS_STOCK = /Citra : ingrédient hors stock/;

describe('M9-1 : un ingrédient du brassage hors stock est signalé à « Confirmer »', () => {
  it('houblon, kind ingrédient, stockAction none, dépense de brassage : message qui dit quoi faire', () => {
    const e = validatePurchase(brouillon([ligne()]), stocks);
    expect(e.find(m => HORS_STOCK.test(m))).toMatch(/Ajouter au stock/);
  });
  it('même ligne reliée à un article ou créée : aucun message hors stock', () => {
    const items = [{ id: 'a', ref: 'MP-Citra', name: 'Citra', unit: 'g', category: 'Houblon', currentStock: 10, minStock: 0, reorder: false }];
    expect(validatePurchase(brouillon([ligne({ stockAction: 'existing', stockRef: 'MP-Citra' })]), { ...stocks, rawMaterials: items }).filter(m => HORS_STOCK.test(m))).toEqual([]);
    expect(validatePurchase(brouillon([ligne({ stockAction: 'new' })]), stocks).filter(m => HORS_STOCK.test(m))).toEqual([]);
  });
  it('malt, levure, sucre, additif : même règle', () => {
    for (const nom of ['Malt Pilsner', 'Safale US-05', 'Sucre candi', 'Acide lactique 80 %']) {
      const e = validatePurchase(brouillon([ligne({ description: nom, quantity: 1, unit: 'kg' })]), stocks);
      expect(e.some(m => m.startsWith(`${nom} : ingrédient hors stock`)), nom).toBe(true);
    }
  });
  it('une ligne tapée à la main (aucune lecture : ni nomLu ni imprimé) reste libre : un achat noté sans suivi de stock est un choix', () => {
    const { nomLu, ...main } = ligne();
    expect(validatePurchase(brouillon([main as PurchaseLineDraft]), stocks).filter(m => HORS_STOCK.test(m))).toEqual([]);
  });
  it('dépense hors brassage (rénovation), nature « autre », service ou ligne sans mot d’ingrédient : aucun message', () => {
    expect(validatePurchase(brouillon([ligne()], 'renovation'), stocks).filter(m => HORS_STOCK.test(m))).toEqual([]);
    expect(validatePurchase(brouillon([ligne({ kind: 'other' })]), stocks).filter(m => HORS_STOCK.test(m))).toEqual([]);
    expect(validatePurchase(brouillon([ligne({ kind: 'service' })]), stocks).filter(m => HORS_STOCK.test(m))).toEqual([]);
    expect(validatePurchase(brouillon([ligne({ description: 'Peinture murale' })]), stocks).some(m => /hors stock/.test(m))).toBe(false);
  });
});
