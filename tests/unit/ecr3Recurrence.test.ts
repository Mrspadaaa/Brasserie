import { describe, expect, it } from 'vitest';
import { buildForecast } from '../../src/domain/finance/forecast';
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { avecGenre, brouillonNeuf, piecesRemboursables, preparer, type GenreId } from '../../src/ui/saisie/modele';

/* E40-1 : Apport et Pour moi « Revient Mois » saisis payés le 21.11 : l'occurrence du 21.11 est liée à l'écriture, la suivante tombe le 21.12 (comme l'Abonnement). */
const profile: FinancialProfile = {
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01',
  openingCash: { date: '2026-01-01', amountCents: 100000, confirmed: true }
};

function saisir(genre: GenreId, cents: number): { tx: FinanceTransaction; pay?: FinancialPayment; plan: FinancialPlan } {
  const b = { ...avecGenre(brouillonNeuf('2026-11-21'), genre), cents, rythme: 'monthly' as const, nom: `ZZ ${genre}` };
  const e = preparer(b, { id: `TX-${genre}`, maintenant: '2026-11-21T10:00:00Z', transactions: [], tvaInscrit: false });
  expect(e.plan).toBeTruthy();
  return { tx: e.transaction, pay: e.paiement, plan: e.plan! };
}

/* E40-6, E40-7 : « De quelle pièce ? » ne propose que du payé ou encaissé, avec le picto de sa sorte et une sous-ligne qui ne répète pas le nom */
describe('E40-6, E40-7 : les pièces qu’on peut rembourser', () => {
  const piece = (id: string, description: string, statut: 'paid' | 'unpaid' | 'partial' | undefined, genreSubcat: { subcategory: string; category?: string; kind?: 'expense' | 'income' }, vendor?: string): FinanceTransaction => ({
    id, date: '2026-11-18', description, category: (genreSubcat.category ?? 'brassage') as FinanceTransaction['category'], subcategory: genreSubcat.subcategory, amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0,
    finance: { version: 1, kind: genreSubcat.kind ?? 'expense', amountCents: 1000, lines: [], ...(statut ? { paymentStatus: statut } : {}), ...(vendor ? { vendor } : {}) }
  }) as FinanceTransaction;
  const txs = [
    piece('A', 'ZZ Achat', 'paid', { subcategory: 'Achat' }),
    piece('L', 'Loyer', 'unpaid', { subcategory: 'Loyer', category: 'chargesFixes' }),
    piece('S', 'ZZ Salaire', 'partial', { subcategory: 'Salaire', category: 'chargesFixes' }),
    piece('V', 'ZZ Vente', 'paid', { subcategory: 'Vente', category: 'recettes', kind: 'income' }, 'Café du Port'),
    piece('E', 'ZZ Autre entrée', 'paid', { subcategory: 'Autre recette', category: 'recettes', kind: 'income' }),
    piece('I', 'Impôts', 'unpaid', { subcategory: 'Impôt sur la bière', category: 'divers' })
  ];
  it('E40-6 : seules les pièces payées ou encaissées sont proposées', () => {
    expect(piecesRemboursables(txs).map(p => p.id).sort()).toEqual(['A', 'E', 'V']);
    expect(piecesRemboursables(txs, '', 30, false).map(p => p.id).sort()).toEqual(['A', 'E', 'I', 'L', 'S', 'V']);
  });
  it('E40-7 : chaque pièce porte sa sorte, et la sous-ligne ne répète pas son nom', () => {
    const par = new Map(piecesRemboursables(txs).map(p => [p.id, p]));
    expect(par.get('A')!.genre).toBe('achat');
    expect(par.get('V')!.genre).toBe('vente');
    expect(par.get('E')!.genre).toBe('autrei');
    expect(par.get('A')!.sous).toBe('Achat · 18.11');
    expect(par.get('V')!.sous).toBe('Vente · 18.11 · ZZ Vente');
    expect(par.get('E')!.sous).toBe('Autre entrée · 18.11');
  });
});

describe('E40-1 : l\'occurrence déjà saisie ne revient pas « à payer »', () => {
  for (const [genre, direction] of [['apport', 'in'], ['prel', 'out'], ['abo', 'out']] as Array<[GenreId, 'in' | 'out']>) {
    it(`${genre} : première prévision le 21.12, aucune au 23.11`, () => {
      const { tx, pay, plan } = saisir(genre, 500);
      const f = buildForecast({ transactions: [tx], payments: pay ? [pay] : [], plans: [plan], profile, asOf: '2026-11-23', months: 6 });
      const siens = f.items.filter(i => i.planId === plan.id).sort((a, b) => a.date.localeCompare(b.date));
      expect(plan.direction).toBe(direction);
      expect(siens[0]?.date).toBe('2026-12-21');
      expect(siens.map(i => i.date)).not.toContain('2026-11-23');
      expect(siens.some(i => i.occurrenceId === `${plan.id}:2026-11-21`)).toBe(false);
    });
  }
});
