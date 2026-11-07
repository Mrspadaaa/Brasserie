// D369 : la quantité en un toucher (nombres selon l'unité, additifs) et le champ qui manque calculé des deux autres. Règles pures (D343 : Vitest pour le calcul).
import { describe, expect, it } from 'vitest';
import { nombresRapides, recalculer } from '../../../../src/ui/depense/calculPlateau';

describe('D369 nombres d’un toucher', () => {
  it('pièces 1, 2, 3, 5, 10 ; grammes 1, 5, 10, 100 et plus', () => {
    expect(nombresRapides('pièce', 'materiel')).toEqual([1, 2, 3, 5, 10]);
    expect(nombresRapides('Stk', 'materiel')).toEqual([1, 2, 3, 5, 10]);
    expect(nombresRapides('g', 'houblon').slice(0, 4)).toEqual([1, 5, 10, 100]);
  });
  it('unité illisible : la première unité du genre (matériel : pièce, houblon : g)', () => {
    expect(nombresRapides('', 'materiel')).toEqual([1, 2, 3, 5, 10]);
    expect(nombresRapides('', 'houblon').slice(0, 4)).toEqual([1, 5, 10, 100]);
  });
});

describe('D369 q × prix = montant', () => {
  it('montant lu et quantité posée : le prix se calcule', () => {
    const r = recalculer({ amount: 8.5 }, 'quantity', 2);
    expect(r.patch).toEqual({ quantity: 2, unitPrice: 4.25 });
    expect(r.calcule).toBe('unitPrice');
  });
  it('le prix calculé suit la quantité (1 puis 10 donnent 11), jamais figé à la première valeur', () => {
    const un = recalculer({ amount: 8.5 }, 'quantity', 1);
    const onze = recalculer({ amount: 8.5, quantity: 1, unitPrice: un.patch.unitPrice }, 'quantity', 11, un.calcule);
    expect(onze.patch.quantity).toBe(11);
    expect(onze.patch.unitPrice).toBe(0.773); // B2 n° 6 : trois décimales quand 11 × 0,773 = 8,50 au centime (8,5 / 11 = 0,7727…)
  });
  it('un prix lu ne s’écrase jamais : le montant se calcule (D373 : même un montant lu suit la quantité modifiée)', () => {
    expect(recalculer({ unitPrice: 4.25 }, 'quantity', 2).patch).toEqual({ quantity: 2, amount: 8.5 });
    expect(recalculer({ unitPrice: 4.25, amount: 9 }, 'quantity', 2).patch).toEqual({ quantity: 2, amount: 8.5 });
  });
  it('la quantité ne se déduit que si elle tombe juste', () => {
    expect(recalculer({ amount: 8.5 }, 'unitPrice', 4.25).patch).toEqual({ unitPrice: 4.25, quantity: 2 });
    expect(recalculer({ amount: 8.5 }, 'unitPrice', 3).patch).toEqual({ unitPrice: 3 });
  });
  it('quantité effacée : le prix calculé part avec elle', () => {
    const r = recalculer({ amount: 8.5, quantity: 2, unitPrice: 4.25 }, 'quantity', undefined, 'unitPrice');
    expect(r.patch).toEqual({ quantity: undefined, unitPrice: undefined });
    expect(r.calcule).toBeUndefined();
  });
  it('le brasseur pose lui-même le champ calculé : il n’est plus calculé, le montant suit (D373)', () => {
    const r = recalculer({ amount: 8.5, quantity: 2, unitPrice: 4.25 }, 'unitPrice', 4, 'unitPrice');
    expect(r.patch).toEqual({ unitPrice: 4, amount: 8 });
    expect(r.calcule).toBe('amount');
  });
});
