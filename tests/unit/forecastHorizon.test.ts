import { describe, expect, it } from 'vitest';
import { buildForecast, forecastHorizonEnd } from '../../src/domain/finance/forecast';
import type { FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';

describe('fin exclusive des horizons financiers partagée par l’écran et le contexte', () => {
  it.each([
    ['2026-06-01', 30, '2026-07-01'],
    ['2026-06-01', 90, '2026-08-30'],
    ['2026-09-09', 365, '2027-09-09'],
    ['2023-03-01', 365, '2024-03-01'],
    ['2024-02-29', 365, '2025-02-28'],
    ['2026-12-31', 365, '2027-12-31'],
    ['2026-03-15', 30, '2026-04-14'],
    ['2026-10-15', 30, '2026-11-14']
  ] as const)('%s + horizon %s finit avant %s', (asOf, horizon, expected) => {
    expect(forecastHorizonEnd(asOf, horizon)).toBe(expected);
  });

  it('normalise aussi une date suisse et refuse dates ou horizons invalides', () => {
    expect(forecastHorizonEnd('29.02.2024', 365)).toBe('2025-02-28');
    expect(() => forecastHorizonEnd('2026-02-31', 30)).toThrow(/Date/);
    expect(() => forecastHorizonEnd('2026-06-01', 31 as any)).toThrow(/Horizon/);
  });

  it('conserve la veille de la frontière dans le treizième mois et exclut la date limite', () => {
    const asOf = '2026-09-09';
    const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false };
    const makePlan = (id: string, date: string): FinancialPlan => ({ id, date, title: id, amountCents: 1000, direction: 'out', category: 'brassage', source: 'manual', status: 'active', createdAt: '2026-09-09T10:00:00Z' });
    const forecast = buildForecast({ transactions: [], payments: [], plans: [makePlan('INCLUDED', '2027-09-08'), makePlan('EXCLUDED', '2027-09-09')], profile, asOf, months: 13 });
    const items = forecast.items.filter(item => item.date >= asOf && item.date < forecastHorizonEnd(asOf, 365));
    expect(items.map(item => item.planId)).toEqual(['INCLUDED']);
  });
});
