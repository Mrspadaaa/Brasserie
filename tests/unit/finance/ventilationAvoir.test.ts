import { describe, expect, it } from 'vitest';
import { categorieChangeLeSens, sensDeCategorie, ventilationAvoir } from '../../../src/domain/finance/ledger';
import type { Transaction } from '../../../src/types';

// AM-64 : un avoir sans ventilation de TVA (HT = TTC). AM-62 : le sens d'une écriture ne change pas avec sa catégorie.

const facture = (ttc: number, tva: number, rate: number): Transaction => ({ id: 'F', date: '2026-11-01', description: 'x', category: 'brassage', amountHT: ttc - tva, amountTTC: ttc, tvaRate: rate, tvaAmount: tva } as Transaction);

describe('Ventilation d’un avoir', () => {
  it('reprend la part de TVA de la facture : 108,10 dont 8,10 de TVA, avoir de 54,05 → 4,05 de TVA', () => {
    expect(ventilationAvoir(facture(108.10, 8.10, 0.081), 5405)).toEqual({ amountHT: 50, tvaRate: 0.081, tvaAmount: 4.05 });
  });
  it('un avoir total reprend toute la TVA', () => {
    expect(ventilationAvoir(facture(108.10, 8.10, 0.081), 10810)).toEqual({ amountHT: 100, tvaRate: 0.081, tvaAmount: 8.10 });
  });
  it('facture sans TVA : tout en HT, taux 0', () => {
    expect(ventilationAvoir(facture(50, 0, 0), 2000)).toEqual({ amountHT: 20, tvaRate: 0, tvaAmount: 0 });
  });
});

describe('Sens d’une catégorie', () => {
  it('range les catégories par sens et refuse de passer de l’un à l’autre', () => {
    expect(sensDeCategorie('materiel')).toBe('charge');
    expect(sensDeCategorie('recettes')).toBe('recette');
    expect(sensDeCategorie('apports')).toBe('apport');
    expect(categorieChangeLeSens('divers', 'materiel')).toBe(false);
    expect(categorieChangeLeSens('divers', 'recettes')).toBe(true);
    expect(categorieChangeLeSens('apports', 'recettes')).toBe(true);
  });
});
