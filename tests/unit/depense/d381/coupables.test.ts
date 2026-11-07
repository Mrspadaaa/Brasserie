// D381 : les coupables possibles d'un écart de somme (« un item est en trop et point sur le ou les potentiels coupable ? »), nommés dans le message et
// marqués sur la ligne même. Pièces INVENTÉES : aucun nom, aucune valeur d'une vraie pièce.
import { describe, expect, it } from 'vitest';
import { coupablesDeLEcart, sumCheck } from '../../../../functions/src/invoiceControls';
import { confianceLigne, type LigneConfiance } from '../../../../src/ui/depense/confiance';

const item = (name: string, amountTTC: number) => ({ name, amountTTC });

describe('coupablesDeLEcart : les lignes qui expliqueraient seules l\'écart', () => {
  it('une ligne doublée : les deux jumelles, en tête', () => {
    const items = [item('Malt A', 10), item('Levure B', 25.5), item('Levure B', 25.5), item('Port', 4)];
    // total 39.50, somme 65.00 : écart −25.50 (en centimes, total − somme)
    expect(coupablesDeLEcart(items, -2550)).toEqual({ enTrop: [2, 3], signe: [] });
  });
  it('une remise lue positive : signe inversé, et la ligne égale à l\'écart en trop', () => {
    const items = [item('Houblon C', 10), item('Remise', 5)];
    // total 5.00 (10 − 5), somme 15.00 : écart −10.00
    expect(coupablesDeLEcart(items, -1000)).toEqual({ enTrop: [1], signe: [2] });
  });
  it('écart nul ou impair : personne au signe', () => {
    expect(coupablesDeLEcart([item('X', 3)], 0)).toEqual({ enTrop: [], signe: [] });
    expect(coupablesDeLEcart([item('X', 3)], -301).signe).toEqual([]);
  });
  it('au plus 5 coupables', () => {
    const items = Array.from({ length: 8 }, (_, i) => item(`Article ${i}`, 2));
    expect(coupablesDeLEcart(items, -200).enTrop).toHaveLength(5);
  });
});

describe('sumCheck : le message nomme les coupables et le point les désigne', () => {
  it('ligne doublée : « En trop ? », lignes 2 et 3', () => {
    const items = [item('Malt A', 10), item('Levure B', 25.5), item('Levure B', 25.5), item('Port', 4)];
    const { points, sum } = sumCheck(items, 39.5, null, 0);
    expect(sum.statut).toBe('ecart');
    expect(points[0].lignes).toEqual([2, 3]);
    expect(points[0].message).toContain('En trop ? « Levure B », « Levure B »');
  });
  it('sans coupable : ce qui manquerait, sans lignes désignées', () => {
    const { points } = sumCheck([item('Malt A', 10), item('Levure B', 20)], 37, null, 0);
    expect(points[0].lignes).toBeUndefined();
    expect(points[0].message).toContain('Une ligne de 7,00 CHF manque peut-être.');
  });
  it('un écart d\'arrondi (≤ 5 centimes) ne désigne personne', () => {
    const { points } = sumCheck([item('Malt A', 10.02), item('B', 0.02)], 10, null, 0);
    expect(points[0]?.lignes).toBeUndefined();
  });
});

describe('confiance : le coupable est marqué sur SA ligne, pas sur les autres', () => {
  const l = (id: string, description: string, amount: number): LigneConfiance => ({ id, description, kind: 'stock', quantity: 1, unit: 'pce', unitPrice: amount, amount });
  const lignes = [l('a', 'Malt A', 10), l('b', 'Levure B', 25.5), l('c', 'Levure B', 25.5), l('d', 'Port', 4)];
  const points = sumCheck(lignes.map(x => ({ name: x.description, amountTTC: x.amount ?? null })), 39.5, null, 0).points.map(p => ({ ...p, pese: true }));
  it('lignes 2 et 3 : montant repris, raison « expliquerait l\'écart » ; lignes 1 et 4 intactes', () => {
    const ctx = { lignes, total: 39.5, points };
    const [c1, c2, c3, c4] = lignes.map(x => confianceLigne(x, ctx));
    expect(c2.montant.niveau).toBe('repris');
    expect(c2.montant.raison).toContain('expliquerait l\'écart');
    expect(c3.montant.raison).toContain('expliquerait l\'écart');
    expect(c1.montant.raison).not.toContain('expliquerait');
    expect(c4.montant.raison).not.toContain('expliquerait');
  });
});
