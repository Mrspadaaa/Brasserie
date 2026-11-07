/**
 * Critique B2 n° 3, 6, 7 (règles de calcul du plateau) : la masse se convertit d'une unité à l'autre (aller-retour exact), le prix calculé tient en trois décimales quand il rend le montant,
 * la mouture rattachée suit son malt. Fixtures fictives.
 */
import { describe, expect, it } from 'vitest';
import { convertirMasse, facteurMasse, moutureSuit, prixCalcule, recalculer } from '../../../../src/ui/depense/calculPlateau';

describe('B2 n° 3 : la masse se convertit', () => {
  it('Kg → g : ×1000 ; g → Kg : ÷1000 ; hors masse : rien', () => {
    expect(facteurMasse('Kg', 'g')).toBe(1000); expect(facteurMasse('g', 'kg')).toBe(0.001);
    expect(facteurMasse('Kg', 'pièce')).toBeUndefined(); expect(facteurMasse('sachet', 'g')).toBeUndefined(); expect(facteurMasse('Kg', 'kilo')).toBeUndefined();
  });
  it('2 Kg × 1,55 devient 2 000 g × 0,00155 (montant inchangé) et revient exactement', () => {
    const ligne = { quantity: 2, unitPrice: 1.55 };
    const g = convertirMasse(ligne, 1000);
    expect(g).toEqual({ quantity: 2000, unitPrice: 0.00155 });
    expect(convertirMasse(g, 0.001)).toEqual(ligne);
  });
  it('un champ absent reste absent (l\'inconnu n\'est jamais 0)', () => {
    expect(convertirMasse({ quantity: undefined, unitPrice: 1.55 }, 1000)).toEqual({ quantity: undefined, unitPrice: 0.00155 });
    expect(convertirMasse({ quantity: 60, unitPrice: undefined }, 0.001)).toEqual({ quantity: 0.06, unitPrice: undefined });
  });
});

describe('B2 n° 6 : le prix calculé', () => {
  it('10 sur 3 : 3,333 (trois décimales), et 3 × 3,333 rend 10,00 au centime', () => {
    expect(prixCalcule(10, 3)).toBe(3.333);
    expect(recalculer({ quantity: 3, unitPrice: undefined, amount: 10 }, 'amount', 10).patch.unitPrice).toBe(3.333);
  });
  it('un grand nombre de petits prix garde quatre décimales : jamais un prix qui ne rend plus le montant', () => {
    expect(prixCalcule(1.1, 30)).toBe(0.0367); // 30 × 0,037 = 1,11 ≠ 1,10
    expect(prixCalcule(3.1, 2000)).toBe(0.0016); // 2 000 × 0,002 = 4,00 ≠ 3,10 : trois décimales fausses
  });
});

describe('B2 n° 7 : la mouture rattachée suit son malt', () => {
  const mouture = { quantity: 2, unit: 'Kg', unitPrice: 0.1, amount: 0.2 };
  it('quantité 2 → 3 : la mouture passe à 3 Kg × 0,10 = 0,30', () => {
    expect(moutureSuit({ quantity: 2, unit: 'Kg' }, { quantity: 3, unit: 'Kg' }, mouture)).toEqual({ quantity: 3, unit: 'Kg', unitPrice: 0.1, amount: 0.3 });
  });
  it('Kg → g : 2 000 g × 0,0001, montant inchangé', () => {
    expect(moutureSuit({ quantity: 2, unit: 'Kg' }, { quantity: 2000, unit: 'g' }, mouture)).toEqual({ quantity: 2000, unit: 'g', unitPrice: 0.0001, amount: 0.2 });
  });
  it('rien à suivre : même valeur, quantité vidée, ou unité sans conversion', () => {
    expect(moutureSuit({ quantity: 2, unit: 'Kg' }, { quantity: 2, unit: 'Kg' }, mouture)).toBeUndefined();
    expect(moutureSuit({ quantity: 2, unit: 'Kg' }, { quantity: undefined, unit: 'pièce' }, mouture)).toBeUndefined();
    expect(moutureSuit({ quantity: 2, unit: 'Kg' }, { quantity: 4, unit: 'pièce' }, mouture)).toBeUndefined();
  });
});
