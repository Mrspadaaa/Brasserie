import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { readFileSync } from 'node:fs';
import { BAREME_IMPOT_BIERE, TAUX_NORMAL_PAR_HL, beerTaxBracket, beerTaxForVolume, beerTaxPerFormat, estimateSwissBeerTax } from '../../src/domain/finance/swissBeerTax';
const round2 = (n: number) => Math.round(n * 100) / 100;
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

// d1 (09.11) : un barème, une seule fonction de calcul. Barème : OFDF, directives aux brasseries indigènes (avril 2022) : 16,88 / 25,32 / 33,76 CHF/hl.
// « 12 °P » = `plato: 12` ; l'OG 1,048 fait 11,9 °P (même palier).
describe('impôt sur la bière : beerTaxForVolume et beerTaxPerFormat (d1)', () => {
  it('lit le barème dans une seule donnée', () => {
    expect(BAREME_IMPOT_BIERE.map(t => t.chfParHl)).toEqual([16.88, 25.32, 33.76]);
    expect(TAUX_NORMAL_PAR_HL).toBe(25.32);
    expect(readFileSync('src/domain/finance/swissBeerTax.ts', 'utf8').replace(/export const BAREME_IMPOT_BIERE[^;]*;/s, '')).not.toMatch(/25\.32|16\.88|33\.76/);
  });
  it('12 °P : 26,6 L donnent 6,74 et 27 L donnent 6,84', () => {
    expect(round2(beerTaxForVolume({ plato: 12, litres: 26.6 }).montant!)).toBe(6.74);
    expect(round2(beerTaxForVolume({ plato: 12, litres: 27 }).montant!)).toBe(6.84);
    expect(round2(beerTaxForVolume({ og: '1.048', litres: 27 }).montant!)).toBe(6.84);
    expect(beerTaxForVolume({ og: '1.048', litres: 27 }).plato).toBe(11.9);
  });
  it('par format à 12 °P : 0,08 / 0,19 / 5,06, valeurs exactes gardées', () => {
    const [c33, c75, fut] = [0.33, 0.75, 20].map(volumeL => beerTaxPerFormat({ plato: 12, volumeL })!);
    expect([round2(c33), round2(c75), round2(fut)]).toEqual([0.08, 0.19, 5.06]);
    expect(c33).toBeCloseTo(0.083556, 6);
    expect(fut).toBeCloseTo(5.064, 9);
    expect(beerTaxPerFormat({ plato: null, volumeL: 0.33 })).toBeNull();
  });
  it('bornes 10,0 / 10,1 / 14,0 / 14,1 °P par beerTaxForVolume', () => {
    expect([10, 10.1, 14, 14.1].map(plato => beerTaxForVolume({ plato, litres: 100 }).chfParHl)).toEqual([16.88, 25.32, 25.32, 33.76]);
  });
  it('OG absente ou hors 1,020–1,130 : fourchette 4,56 à 9,12, jamais 25,32', () => {
    for (const og of [undefined, '', '1.001', '1.290']) {
      const r = beerTaxForVolume({ og, litres: 27 });
      expect([r.plato, r.chfParHl, r.montant]).toEqual([null, null, null]);
      expect([round2(r.montantMin!), round2(r.montantMax!)]).toEqual([4.56, 9.12]);
    }
  });
  it('des litres absents, nuls ou négatifs donnent un montant inconnu', () => {
    for (const litres of [0, -3, Number.NaN]) expect(beerTaxForVolume({ plato: 12, litres }).montant).toBeNull();
  });
  it('la réduction confirmée baisse le montant, le plein reste exposé', () => {
    const r = beerTaxForVolume({ plato: 12, litres: 27, reductionPct: 40 });
    expect(round2(r.montant!)).toBe(4.1);
    expect(round2(r.montantPlein!)).toBe(6.84);
    expect(beerTaxForVolume({ plato: 12, litres: 27, reductionPct: 41 }).reductionPct).toBe(0);
  });
  it('une bière à 0,5 % vol. ou moins est exonérée : 0, cas connu', () => {
    const r = beerTaxForVolume({ og: '1.040', litres: 27, abv: '0.5' });
    expect([r.exonere, r.montant, r.montantMin, r.montantMax]).toEqual([true, 0, 0, 0]);
    expect(beerTaxForVolume({ og: '1.040', litres: 27, abv: '0.6' }).exonere).toBe(false);
  });
  it('les litres sortis remplacent le conditionné, et un brassin jamais conditionné entre', () => {
    const lot = batch({ volumePackagedL: undefined });
    const e = estimateSwissBeerTax([lot, batch({ id: 'B2', volumePackagedL: 100 })], { year: 2026, litresSortis: { B1: 12.4, B2: 20 } });
    expect(e.totalVolumeL).toBe(32.4);
    expect(e.batchesCount).toBe(2);
    expect(estimateSwissBeerTax([lot], { year: 2026 }).batchesCount).toBe(0);
    expect(e.warning).toMatch(/sortis/);
  });
  it('sans brassin : le taux affiché vient du barème', () => {
    const e = estimateSwissBeerTax([], { year: 2026 });
    expect([e.ratePerHl, e.fullRatePerHl, e.taxDueCHF]).toEqual([TAUX_NORMAL_PAR_HL, TAUX_NORMAL_PAR_HL, 0]);
  });
});
