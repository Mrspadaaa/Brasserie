/**
 * Bugs des workflows du 21.11 (Brasserie work/missions/2026-11-21-workflows-app/SYNTHESE.md § 1), règles de calcul. Les gestes sont joués au
 * doigt par scripts/parcours/calendrier.mjs (étape 9b).
 */
import { describe, expect, it } from 'vitest';
import type { CreativeItem, StockItem, Transaction } from '../../src/types';
import type { FinanceTransaction, FinancialPayment, FinancialProfile } from '../../src/domain/finance/types';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { brewBudgetDemands } from '../../src/domain/finance/brewBudget';

const AUJ = '2026-11-18'; // mercredi, lundi 2026-11-16 (S47)

describe('B3 (WFR-11) : une levure sans nom ne fait pas tomber le calcul', () => {
  it('levure liée au stock, sans nom : une demande « Levure » par sa référence ; sans nom ni référence : rien', () => {
    const recette = { name: 'ZZ', volumeL: 100, fermentables: [{ name: 'Malt pilsner', weightKg: 20, kind: 'grain' }], hops: [], yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' } };
    const d = brewBudgetDemands(recette as never);
    expect(d.find(x => x.stockItemRef === 'ZZ-US05')).toMatchObject({ name: 'Levure', quantity: 2, unit: 'sachet' });
    const sansRef = brewBudgetDemands({ ...recette, yeast: { qty: 2, unit: 'sachet' } } as never);
    expect(sansRef.map(x => x.name)).toEqual(['Malt pilsner']);
  });
});

describe('B11 (WFV-3) : la vente encaissée du jour est une chose de la rangée Ventes', () => {
  const profil: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01', openingCash: { date: '2026-01-01', amountCents: 500000, confirmed: true } };
  const piece = (id: string, statut: 'paid' | 'unpaid'): FinanceTransaction => ({
    id, date: AUJ, description: 'Vente 6 × Pale Ale — Comptoir', category: 'recettes', subcategory: 'Vente directe', amountHT: 27, amountTTC: 27, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind: 'income', amountCents: 2700, lines: [], paymentStatus: statut, ...(statut === 'unpaid' ? { dueDate: '2026-11-30' } : {}) }
  }) as FinanceTransaction;
  const paiement = (id: string, date = AUJ): FinancialPayment => ({ id: `PAY-${id}`, transactionId: id, date, amountCents: 2700, direction: 'in', method: 'twint', recordedAt: `${date}T10:00:00.000Z` }) as FinancialPayment;
  const entrees = (transactions: FinanceTransaction[], payments: FinancialPayment[]): EntreesModele => ({
    aujourdhui: AUJ, transactions: transactions as unknown as Transaction[], payments, plans: [], profile: profil, assets: [], batches: [], stockItems: [] as StockItem[],
    items: [] as CreativeItem[], recettes: [], reglages: REGLAGES_VIDES
  });
  const ventes = (m: ReturnType<typeof construireModele>) => m.choses.filter(c => c.rangee === 'ventes' && c.titre.startsWith('Vente 6 × Pale Ale'));

  it('payée à la caisse aujourd’hui : une chose Ventes à son jour, son montant, qui ouvre la pièce', () => {
    const v = ventes(construireModele(entrees([piece('REC-1', 'paid')], [paiement('REC-1')])));
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ id: 'paiement-PAY-REC-1', debut: AUJ, fin: AUJ, centimes: 2700, ouvre: { ecran: 'piece', id: 'REC-1' } });
  });
  it('payée avant le début de la vue, ou sans paiement : rien d’inventé', () => {
    expect(ventes(construireModele(entrees([piece('REC-2', 'paid')], [])))).toHaveLength(0);
    expect(ventes(construireModele(entrees([piece('REC-3', 'paid')], [paiement('REC-3', '2025-01-10')])))).toHaveLength(0);
  });
});
