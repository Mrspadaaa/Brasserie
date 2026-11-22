// D373 : « Les calculs sont pas dynamique ??? SI j'entre ou modife un champs, genre le total doit être calculé ?? ».
// Trois champs lus (une ligne de houblon imprimée 0.036 × 30 = 1.10, prix arrondi par le fournisseur) : le champ que le brasseur ne touche pas suit.
import { describe, expect, it } from 'vitest';
import { recalculer, type ChampCalcul } from '../../../../src/ui/depense/calculPlateau';

const lu = { quantity: 30, unitPrice: 0.036, amount: 1.1 };
/** Rejoue une suite de gestes comme le plateau : le champ calculé et le dernier touché sont gardés d'un geste à l'autre. */
function gestes(depart: { quantity?: number; unitPrice?: number; amount?: number }, suite: Array<[ChampCalcul, number | undefined]>) {
  let l = { ...depart }, calcule: ChampCalcul | undefined, dernier: ChampCalcul | undefined;
  for (const [champ, valeur] of suite) { const r = recalculer(l, champ, valeur, calcule, dernier); l = { ...l, ...r.patch }; calcule = r.calcule; dernier = champ; }
  return l;
}

describe('D373 — le calcul suit le geste, même sur des valeurs lues', () => {
  it('le prix modifié recalcule le total', () => {
    expect(recalculer(lu, 'unitPrice', 0.037).patch).toEqual({ unitPrice: 0.037, amount: 1.11 });
  });
  it('la quantité modifiée recalcule le total', () => {
    expect(recalculer(lu, 'quantity', 31).patch).toEqual({ quantity: 31, amount: 1.12 });
  });
  it('le total modifié recalcule le prix (1,10 ÷ 30), le calcul tombe juste', () => {
    const r = recalculer({ ...lu, amount: 1.08 }, 'amount', 1.1);
    expect(r.patch.unitPrice).toBeCloseTo(0.0367, 4);
    expect(r.calcule).toBe('unitPrice');
  });
  it('prix posé puis total posé : la quantité suit (le prix tient)', () => {
    expect(gestes({ quantity: 2, unitPrice: 4, amount: 8 }, [['unitPrice', 5], ['amount', 15]])).toEqual({ quantity: 3, unitPrice: 5, amount: 15 });
  });
  it('prix, puis quantité : le total suit les deux, jamais figé à la première valeur', () => {
    expect(gestes(lu, [['unitPrice', 0.037], ['quantity', 40]])).toEqual({ quantity: 40, unitPrice: 0.037, amount: 1.48 });
  });
  it('total, puis quantité : le prix suit (le total tient)', () => {
    const l = gestes(lu, [['amount', 1.2], ['quantity', 40]]);
    expect(l.amount).toBe(1.2);
    expect(l.unitPrice).toBeCloseTo(0.03, 4);
  });
  it('un champ effacé ne recalcule rien de lu', () => {
    expect(recalculer(lu, 'unitPrice', undefined).patch).toEqual({ unitPrice: undefined });
  });
});
