import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { abvFromGravities, gravityKeepable, gravityMessage, gravityProblem, plausibleAbv } from '../../src/domain/gravityBounds';

describe('RJ-2 · improbable (à confirmer) ou impossible (jamais enregistré)', () => {
  it('OG : improbable entre 0,990 et 1,200 hors [1,020 ; 1,130] ; impossible au-delà', () => {
    expect([1.02, 1.048, 1.13, 1.15, 1.2, 1.0, 0.99].map(v => gravityKeepable('og', v))).toEqual([true, true, true, true, true, true, true]);
    expect([-5, 0, 0.5, 0.989, 1.201, 1.29, 5, 1048, NaN].map(v => gravityKeepable('og', v))).toEqual([false, false, false, false, false, false, false, false, false]);
  });
  it('FG : improbable entre 0,990 et l’OG ; impossible sous 0,990 ou au-dessus de l’OG', () => {
    expect(gravityKeepable('fg', 0.992, 1.05)).toBe(true);
    expect(gravityKeepable('fg', 1.05, 1.05)).toBe(true);
    expect(gravityKeepable('fg', 1.07, 1.06)).toBe(false);
    expect(gravityKeepable('fg', 0.5, 1.05)).toBe(false);
    expect(gravityKeepable('fg', 1.15)).toBe(true);
    expect(gravityKeepable('fg', 1.25)).toBe(false);
  });
  it('OG sous la FG déjà notée : impossible, avec son motif', () => {
    expect(gravityProblem('og', 1.025, null, 1.03)).toBe('og-below-fg');
    expect(gravityKeepable('og', 1.025, null, 1.03)).toBe(false);
    expect(gravityKeepable('og', 1.03, null, 1.03)).toBe(true);
  });
  it('le message d’une valeur impossible le dit', () => {
    expect(gravityMessage('og-low', -5, null, false)).toContain('ne s’enregistre pas');
    expect(gravityMessage('og-low', 1.01, null, true)).not.toContain('ne s’enregistre pas');
  });
});
import { batchEntries } from '../../src/domain/productionCatalog';
import { estimateSwissBeerTax } from '../../src/domain/finance/swissBeerTax';

describe('AM 5 · bornes de densité', () => {
  it('OG : 1,020 à 1,130 inclus', () => {
    expect([1.02, 1.048, 1.13].map(v => gravityProblem('og', v))).toEqual([null, null, null]);
    expect(gravityProblem('og', 1.019)).toBe('og-low');
    expect(gravityProblem('og', 1.131)).toBe('og-high');
    expect(gravityProblem('og', 5)).toBe('og-high');
    expect(gravityProblem('og', 1048)).toBe('og-high');
  });
  it('FG : de 0,995 à l’OG', () => {
    expect(gravityProblem('fg', 0.995, 1.05)).toBeNull();
    expect(gravityProblem('fg', 1.05, 1.05)).toBeNull();
    expect(gravityProblem('fg', 0.5, 1.05)).toBe('fg-low');
    expect(gravityProblem('fg', 1.06, 1.05)).toBe('fg-above-og');
    expect(gravityProblem('fg', 1.2)).toBe('fg-high');
  });
  it('l’alcool n’est calculé que pour un couple plausible', () => {
    expect(abvFromGravities(1.05, 1.01)).toBe(5.3);
    expect(abvFromGravities(5, 1.01)).toBeNull();
    expect(abvFromGravities(1.05, 0.5)).toBeNull();
    expect(abvFromGravities(1.05, 1.06)).toBeNull();
    expect(abvFromGravities(1.05, null)).toBeNull();
    expect(plausibleAbv(400)).toBe(false);
    expect(plausibleAbv(-1)).toBe(false);
    expect(plausibleAbv(5.3)).toBe(true);
  });
  it('les messages donnent la valeur et la borne', () => {
    expect(gravityMessage('og-high', 1.29)).toContain('1,290');
    expect(gravityMessage('og-high', 1.29)).toContain('1,130');
    expect(gravityMessage('fg-above-og', 1.06, 1.05)).toContain('1,050');
  });
});

const lot = (patch: Partial<Batch>): Batch => ({ id: 'B1', name: 'Brassin', style: 'Ale', volumeL: 100, volumePackagedL: 100, brewDate: '01.02.2026', status: 'termine', ...patch });

describe('AM 5 · un alcool absurde ne part ni au catalogue ni à la taxe', () => {
  it('catalogue : OG 5 / FG 0,5 ou alcool écrit à 400 % ne donnent aucun alcool', () => {
    const abv = (patch: Partial<Batch>) => batchEntries([lot(patch)])[0].abv;
    expect(abv({ og: '5', fg: '0.5' })).toBeUndefined();
    expect(abv({ og: '1.050', fg: '1.060' })).toBeUndefined();
    expect(abv({ og: '1.050', fg: '1.010', abv: '400%' })).toBe(5.3);
    expect(abv({ og: '5', fg: '0.5', abv: '400%' })).toBeUndefined();
    expect(abv({ og: '1.050', fg: '1.010' })).toBe(5.3);
    expect(abv({ abv: '5,2%' })).toBe(5.2);
  });
  it('taxe : une OG absurde n’ouvre ni l’exonération sans alcool ni un palier Plato', () => {
    // OG 1,001 / FG 1,000 donnerait 0,1 % : exonéré à tort. Désormais : fourchette, OG à vérifier.
    const absurde = estimateSwissBeerTax([lot({ og: '1.001', abv: '0.1' })], { year: 2026 });
    expect(absurde.estimateHighCHF).toBeGreaterThan(0);
    expect(absurde.missingPlatoCount).toBe(1);
    const grande = estimateSwissBeerTax([lot({ og: '1.290', abv: '5' })], { year: 2026 });
    expect(grande.missingPlatoCount).toBe(1);
    const normale = estimateSwissBeerTax([lot({ og: '1.048', abv: '0.4' })], { year: 2026 });
    expect(normale.estimateHighCHF).toBe(0);
  });
});
