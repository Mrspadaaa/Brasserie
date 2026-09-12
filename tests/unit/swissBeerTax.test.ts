import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { beerTaxBracket, estimateSwissBeerTax } from '../../src/domain/finance/swissBeerTax';
const batch = (patch: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Brassin', style: 'Ale', volumeL: 120, volumePackagedL: 100, brewDate: '01.02.2026', status: 'termine', og: '1.048', abv: '5', ...patch });
describe('Réserve suisse bière avec sources et incertitude', () => {
  it('applique les trois paliers officiels de degrés Plato', () => {
    expect([10, 10.1, 14, 14.1].map(beerTaxBracket)).toEqual([16.88, 25.32, 25.32, 33.76]);
    const estimate = estimateSwissBeerTax([batch()], { year: 2026 });
    expect(estimate.estimateLowCHF).toBe(25.32);
    expect(estimate.estimateHighCHF).toBe(25.32);
    expect(estimate.estimateOnly).toBe(true);
  });
  it('montre une fourchette quand la densité initiale manque', () => {
    const estimate = estimateSwissBeerTax([batch({ og: undefined })], { year: 2026 });
    expect(estimate).toMatchObject({ missingPlatoCount: 1, estimateLowCHF: 16.88, estimateHighCHF: 33.76, reductionPct: 0, reductionConfirmed: false });
  });
  it('utilise uniquement une réduction confirmée pour le même exercice', () => {
    expect(estimateSwissBeerTax([batch()], { year: 2026, annualReductionPct: 40, reductionYear: 2026 }).estimateHighCHF).toBe(15.19);
    expect(estimateSwissBeerTax([batch()], { year: 2026, annualReductionPct: 40, reductionYear: 2025 }).reductionPct).toBe(0);
    expect(estimateSwissBeerTax([batch()], { year: 2026, annualReductionPct: 41, reductionYear: 2026 }).reductionPct).toBe(0);
  });
  it('exclut la bière à 0,5 % et les brassins hors exercice ou annulés', () => {
    const estimate = estimateSwissBeerTax([batch({ abv: '0.5' }), batch({ id: 'B2', brewDate: '01.02.2025' }), batch({ id: 'B3', status: 'annule' })], { year: 2026 });
    expect(estimate.estimateHighCHF).toBe(0);
    expect(estimate.batchesCount).toBe(1);
  });
});
