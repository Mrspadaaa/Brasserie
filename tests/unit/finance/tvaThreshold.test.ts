import { describe, expect, it } from 'vitest';
import { tvaThresholdStatus } from '../../../src/domain/finance/tvaThreshold';
import type { FinanceTransaction } from '../../../src/domain/finance/types';

// AM n° 10 : l'app est « non assujettie » ; le seuil de 100 000 CHF de chiffre d'affaires imposable sur 12 mois glissants (LTVA art. 10 al. 2 let. a)
// doit être surveillé : alerte à 80 % puis à 100 %. Avant : `tvaThresholdTurnover` n'était lu nulle part.
const vente = (id: string, date: string, chf: number, more: Record<string, unknown> = {}, financeMore: Record<string, unknown> = {}): FinanceTransaction => ({
  id, date, description: id, category: 'recettes', amountHT: chf, amountTTC: chf, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'income', amountCents: Math.round(chf * 100), lines: [], ...financeMore }, ...more }) as unknown as FinanceTransaction;
const ASOF = '2026-11-08';

describe('AM n° 10 : seuil de 100 000 CHF', () => {
  it('sous 80 % : rien à signaler', () => {
    const s = tvaThresholdStatus([vente('V1', '2026-10-01', 79_999)], ASOF, 100_000, false);
    expect(s?.level).toBe('ok');
    expect(s?.turnoverCents).toBe(7_999_900);
  });
  it('dès 80 % : avertissement avec le chiffre, le pourcentage et le reste', () => {
    const s = tvaThresholdStatus([vente('V1', '2026-10-01', 50_000), vente('V2', '2026-03-15', 30_000)], ASOF, 100_000, false);
    expect(s?.level).toBe('warn');
    expect(s?.ratio).toBeCloseTo(0.8);
    expect(s?.message).toMatch(/80 %/);
    expect(s?.message).toMatch(/20\s?000/);
  });
  it('à 100 % et au-delà : seuil franchi, annonce à faire', () => {
    const s = tvaThresholdStatus([vente('V1', '2026-10-01', 100_000)], ASOF, 100_000, false);
    expect(s?.level).toBe('over');
    expect(s?.message).toMatch(/franchi/);
    expect(s?.message).toMatch(/30 jours/);
  });
  it('12 mois glissants : une vente d’il y a 12 mois pile ou plus ne compte plus ; celle du jour compte', () => {
    expect(tvaThresholdStatus([vente('V1', '2025-11-08', 90_000), vente('V2', '2026-11-08', 5_000)], ASOF, 100_000, false)?.turnoverCents).toBe(500_000);
    expect(tvaThresholdStatus([vente('V1', '2025-11-09', 90_000)], ASOF, 100_000, false)?.turnoverCents).toBe(9_000_000);
  });
  it('ne compte ni les annulées, ni les dépenses, ni les apports, ni le futur ; retranche les avoirs de vente', () => {
    const txs = [vente('V1', '2026-10-01', 60_000), vente('V2', '2026-10-02', 40_000, {}, { voidedAt: '2026-10-03T00:00:00Z' }),
      vente('E1', '2026-10-01', 50_000, { category: 'brassage' }, { kind: 'expense' }), vente('A1', '2026-10-01', 50_000, { category: 'apports' }, { kind: 'contribution' }),
      vente('V3', '2026-12-01', 50_000), vente('R1', '2026-10-10', 10_000, {}, { kind: 'refund', refundDirection: 'out' })];
    expect(tvaThresholdStatus(txs, ASOF, 100_000, false)?.turnoverCents).toBe(5_000_000);
  });
  it('retire la TVA d’une vente assujettie (chiffre d’affaires imposable = hors taxe)', () => {
    const s = tvaThresholdStatus([vente('V1', '2026-10-01', 108.1, { tvaAmount: 8.1 })], ASOF, 100_000, false);
    expect(s?.turnoverCents).toBe(10_000);
  });
  it('déjà assujettie, ou seuil inconnu : pas d’alerte (null), l’inconnu n’est pas 0', () => {
    expect(tvaThresholdStatus([vente('V1', '2026-10-01', 150_000)], ASOF, 100_000, true)).toBeNull();
    expect(tvaThresholdStatus([vente('V1', '2026-10-01', 150_000)], ASOF, undefined as unknown as number, false)).toBeNull();
    expect(tvaThresholdStatus([vente('V1', '2026-10-01', 150_000)], ASOF, 0, false)).toBeNull();
  });
});
