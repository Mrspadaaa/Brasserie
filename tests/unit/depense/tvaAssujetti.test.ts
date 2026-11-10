import { beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * AM-58 : une dépense d'un assujetti sans TVA lue passait avec une TVA à 0, sans alerte (impôt préalable faux). Pièce INVENTÉE. Services simulés.
 */
const state = vi.hoisted(() => ({ registered: true }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: state.registered } }) } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
import * as entry from '../../../src/services/purchaseEntry';
import type { PurchaseDraft } from '../../../src/services/purchaseEntry';

const brouillon = (more: Partial<PurchaseDraft> = {}): PurchaseDraft => ({
  submissionId: 'tva-assujetti-00001', date: '09.09.2026', vendor: 'Boutique fictive', invoiceNumber: '1', description: 'Achat fictif', category: 'brassage', amount: 50,
  lines: [{ id: 'a', description: 'Article fictif', kind: 'packaging', amount: 50, unit: '', stockAction: 'none', equipmentAction: 'none' } as any],
  paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF', ...more,
} as PurchaseDraft);
const erreurs = (d: PurchaseDraft) => entry.validatePurchase(d, { rawMaterials: [], cleaning: [], equipment: [] } as any, []).join(' ');
beforeEach(() => { state.registered = true; });

describe('TVA inconnue d’un assujetti', () => {
  it('assujetti, TVA absente : refusé, avec la consigne', () => {
    expect(erreurs(brouillon())).toMatch(/Brasserie assujettie à la TVA : indique la TVA/);
  });
  it('assujetti, TVA lue (même 0 saisi en le sachant) : accepté', () => {
    expect(erreurs(brouillon({ sourceVatAmount: 3.7 }))).toBe('');
    expect(erreurs(brouillon({ sourceVatAmount: 0 }))).toBe('');
  });
  it('non assujetti : la TVA absente ne gêne pas', () => {
    state.registered = false;
    expect(erreurs(brouillon())).toBe('');
  });
});
