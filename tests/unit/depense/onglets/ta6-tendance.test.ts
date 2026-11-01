// TA6 : la tendance « Dépenses courantes » ne projette que les catégories récurrentes (charges fixes).
import { describe, expect, it } from 'vitest';
import { buildForecast, TREND_CATEGORIES } from '../../../../src/domain/finance/forecast';
import { ASOF, plan, profile, tx } from './fixtures';

const achats = (category: string, prefix = category) => ['2026-07-05', '2026-08-05', '2026-09-05'].map((d, i) =>
  tx(`${prefix}-${i}`, d, 10000, { paymentStatus: 'paid' }, 'expense', category));
const trend = (fc: ReturnType<typeof buildForecast>) => fc.items.filter(i => i.source === 'trend');
const run = (transactions: ReturnType<typeof tx>[], plans: ReturnType<typeof plan>[] = []) => buildForecast({ transactions, payments: [], plans, profile, asOf: ASOF });

describe('TA6 : tendance des dépenses courantes', () => {
  it('sonde F : trois achats de brassage isolés ne deviennent pas une charge mensuelle', () => {
    const fc = run(achats('brassage'));
    expect(trend(fc)).toEqual([]);
    expect(fc.items.reduce((s, i) => s + i.amountCents, 0)).toBe(0);
  });

  it('la raison est dite : une ligne d’avertissement nomme les achats non projetés', () => {
    const fc = run(achats('brassage'));
    expect(fc.warnings.some(w => w.includes('Achats de brassage non projetés'))).toBe(true);
  });

  it('trois charges fixes : la tendance garde sa médiane (50,00 CHF × 13 mois ne change pas de règle)', () => {
    const fc = run(achats('chargesFixes'));
    expect(trend(fc).length).toBeGreaterThan(0);
    expect(trend(fc).every(i => i.category === 'chargesFixes' && i.amountCents === 5000)).toBe(true);
    expect(fc.warnings.some(w => w.includes('non projetés'))).toBe(false);
  });

  it('un jeu mêlé : seule la catégorie récurrente produit une ligne', () => {
    const fc = run([...achats('brassage'), ...achats('chargesFixes')]);
    expect([...new Set(trend(fc).map(i => i.category))]).toEqual(['chargesFixes']);
  });

  it('nettoyage et divers : pas de périodicité connue, donc pas de projection', () => {
    const fc = run([...achats('nettoyage'), ...achats('divers')]);
    expect(trend(fc)).toEqual([]);
  });

  it('la liste des catégories récurrentes est un réglage lisible', () => {
    expect(TREND_CATEGORIES).toContain('chargesFixes');
    expect(TREND_CATEGORIES).not.toContain('brassage');
  });

  it('non-régression : un plan de brassin reste prévu dans le mois', () => {
    const fc = run(achats('brassage'), [plan({ source: 'brew', category: 'brassage', date: '2026-11-15', amountCents: 20000 })]);
    expect(fc.items.some(i => i.source === 'brew' && i.amountCents === 20000)).toBe(true);
  });
});
