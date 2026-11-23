/**
 * Bugs des workflows du 21.11 (Brasserie work/missions/2026-11-21-workflows-app/SYNTHESE.md § 1), règles de calcul. Les gestes sont joués au
 * doigt par scripts/parcours/calendrier.mjs (étape 9b).
 */
import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem, StockItem, Transaction } from '../../src/types';
import type { FinanceTransaction, FinancialPayment, FinancialProfile } from '../../src/domain/finance/types';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { brewBudgetDemands } from '../../src/domain/finance/brewBudget';
import { brassagePoseAuPasse, choseBrassin } from '../../src/domain/calendrier';

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

describe('B8 (WFP-3) : la barre va où le doigt la lâche', () => {
  it('un brassin pas brassé prévu la semaine d’avant la courante se dessine à SA date', () => {
    expect(brassagePoseAuPasse('2026-11-10', AUJ)).toBe(true);
    expect(brassagePoseAuPasse('2026-11-16', AUJ)).toBe(false); // la semaine courante : depuis aujourd'hui (T3-2)
    const b = { id: 'LOT-B8', name: 'Blonde', style: 'Blonde', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 14 }] } } as unknown as Batch;
    expect(choseBrassin(b, AUJ)).toMatchObject({ debut: '2026-11-10', pasBrassee: true });
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

  /* CAL-ANNULEES-COMPTEES (23.11, argent faux) : les deux ventes « ZZ TEST — parcours », annulées (« Écriture annulée », hors de Finances), étaient
     comptées au Calendrier (Ventes +5 785 au lieu de +5 695). Pour annuler, le paiement est d'abord rendu (un paiement sortant égal) : la caisse est
     nette, la rangée Ventes ne doit rien montrer de la pièce, ni sa recette ni son remboursement. */
  it('CAL-ANNULEES-COMPTEES : une vente annulée (paiement rendu, pièce annulée) n’est dans aucune rangée et ne compte nulle part', () => {
    const annulee = { ...piece('REC-4', 'paid'), finance: { ...piece('REC-4', 'paid').finance!, voidedAt: `${AUJ}T11:00:00.000Z` } } as FinanceTransaction;
    const rendu = { ...paiement('REC-4'), id: 'PAY-REC-4-RENDU', direction: 'out' } as FinancialPayment;
    const avec = construireModele(entrees([annulee], [paiement('REC-4'), rendu]));
    const sans = construireModele(entrees([], []));
    expect(avec.choses.filter(c => c.source.id === 'REC-4' || c.id.includes('REC-4'))).toEqual([]);
    expect(avec.choses.filter(c => c.rangee === 'ventes').reduce((s, c) => s + (c.centimes ?? 0), 0)).toBe(sans.choses.filter(c => c.rangee === 'ventes').reduce((s, c) => s + (c.centimes ?? 0), 0));
    /* la caisse : la recette et son remboursement s'annulent (comme Finances) ; « à dépenser » et la courbe ne bougent pas */
    const libres = (m: typeof avec) => (m.courbe as { semaines: Array<{ caisse: number; libre: number }> } | null)?.semaines.map(x => [x.caisse, x.libre]);
    expect(libres(avec)).toEqual(libres(sans));
  });
  it('CAL-ANNULEES-COMPTEES : une facture de vente annulée, jamais payée, n’est pas attendue', () => {
    const annulee = { ...piece('REC-5', 'unpaid'), finance: { ...piece('REC-5', 'unpaid').finance!, voidedAt: `${AUJ}T11:00:00.000Z` } } as FinanceTransaction;
    const m = construireModele(entrees([annulee], []));
    expect(m.choses.filter(c => c.source.id === 'REC-5' || c.id.includes('REC-5'))).toEqual([]);
  });
});
