import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialPayment, FinancialProfile, TransactionFinance } from '../../src/domain/finance/types';
import { cascade, type EntreeAnalyse } from '../../src/domain/finance/analyse';

// fx1 (10.11) : « Pas encore payé, apports +400,00 » était obscur. Ce qui rattache la caisse de fin à celle du début se dit en deux choses :
// les apports privés (paiements signés, exacts) et le reste à payer (pièces du mois dont l'argent n'est pas encore sorti).
const AUJ = '2026-11-10';
const tx = (id: string, description: string, cents: number, category: string, date: string, finance: Partial<TransactionFinance> = {}): FinanceTransaction => ({
  id, description, date, category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'paid', ...finance },
});
const pai = (t: FinanceTransaction, direction: 'in' | 'out', date = t.date): FinancialPayment => ({ id: `P-${t.id}`, transactionId: t.id, date, amountCents: t.finance!.amountCents, direction, method: 'bank', recordedAt: `${date}T10:00:00Z` });
const profil = (): FinancialProfile => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-09-01', amountCents: 200000, confirmed: true } });

const vente = tx('V1', 'Café du Bourg', 54000, 'recettes', '2026-10-22');
const loyer = tx('L1', 'Loyer', 40000, 'chargesFixes', '2026-10-25');
const apport = tx('A1', 'Apport du brasseur', 40000, 'apports', '2026-10-28', { kind: 'contribution' });
const retrait = tx('R1', 'Retrait privé', 5000, 'apports', '2026-10-29', { kind: 'withdrawal' });
const electricite = tx('E1', 'Électricité', 12000, 'chargesFixes', '2026-10-20', { paymentStatus: 'unpaid' });
const entree = (transactions: FinanceTransaction[], payments: FinancialPayment[]): EntreeAnalyse => ({ transactions, payments, plans: [], profile: profil(), aujourdhui: AUJ });
const plage = { du: '2026-10', au: '2026-11' };

describe('fx1 : la cascade dit ses deux restes', () => {
  const e = entree([vente, loyer, apport, retrait, electricite], [pai(vente, 'in'), pai(loyer, 'out'), pai(apport, 'in'), pai(retrait, 'out')]);
  const c = cascade(e, plage);
  it('les apports privés sont la somme signée des paiements d\'apport et de retrait', () => expect(c.apportsCents).toBe(40000 - 5000));
  it('le reste à payer est la pièce du mois dont l\'argent n\'est pas sorti', () => expect(c.resteCents).toBe(12000));
  it('les deux restes ensemble sont l\'ancien « autres mouvements », jamais un écart caché', () => {
    expect(c.autresMouvementsCents).toBe(35000 + 12000);
    expect(c.apportsCents! + c.resteCents!).toBe(c.autresMouvementsCents);
  });
  it('sans solde confirmé : les deux sont null, jamais 0', () => {
    const sans = cascade({ ...e, profile: { ...profil(), openingCash: undefined } }, plage);
    expect(sans.apportsCents).toBeNull(); expect(sans.resteCents).toBeNull();
  });
  it('sans apport : 0 pour les apports, et le reste garde tout l\'écart', () => {
    const c2 = cascade(entree([vente, loyer, electricite], [pai(vente, 'in'), pai(loyer, 'out')]), plage);
    expect(c2.apportsCents).toBe(0); expect(c2.resteCents).toBe(12000);
  });
});
