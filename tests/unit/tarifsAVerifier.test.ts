import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../src/types';
import { decoderLigneVente, encoderLigneVente } from '../../src/ui/vente/ligneVente';
import { PLAGE_LITRE_PLAUSIBLE, separerAVerifier, ventesAuLitre } from '../../src/domain/tarifs/ventesAuLitre';
import { domaineKxc } from '../../src/domain/tarifs/echellePrix';

/** Fixture anonymisée : la forme de la ligne de caisse du jeu en ligne du 16.11 (10 bouteilles de 75 cl, 5 695 CHF), client « ZZ Bar du Test ». */
const vente = (id: string, vendor: string, lot: string, format: string, litres: number, quantite: number, cents: number) => ({
  id, date: '12.11.2026', description: '', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, category: 'recettes', subcategory: '',
  finance: { version: 1, kind: 'income', amountCents: cents, vendor, lines: [{ id: `${id}-0`, description: '', kind: 'other', quantity: quantite, unit: 'pièce', amountCents: cents, sourceReference: encoderLigneVente(lot, format, litres) }] }
}) as unknown as Transaction;
const lire = (transactions: Transaction[]) => ventesAuLitre({ transactions, clients: [], decoder: decoderLigneVente, biereDuLot: () => 'Blonde', estDemo: () => false });

describe('ventes à vérifier (constat 12, jeu en ligne 16.11)', () => {
  const ventes = lire([
    vente('T1', 'ZZ Café A', 'B1', '33cl', 0.33, 24, 8400),            // 3,50 la bouteille = 10,61 CHF/L
    vente('T2', 'ZZ Café B', 'B1', 'fut', 20, 1, 15000),               // 7,50 CHF/L
    vente('T3', 'ZZ Bar du Test', 'B1', '75cl', 0.75, 10, 569500)      // 569,50 la bouteille = 759,33 CHF/L
  ]);

  it('le litre de la vente est juste : 569,50 ÷ 0,75 = 759,33 (c’est le montant qui est douteux)', () => {
    const v = ventes.find((x) => x.qui === 'ZZ Bar du Test')!;
    expect(v.prix).toBe(569.5);
    expect(v.litre).toBeCloseTo(759.33, 2);
  });

  it('la plage plausible est [1 ; 100] CHF le litre', () => {
    expect([...PLAGE_LITRE_PLAUSIBLE]).toEqual([1, 100]);
  });

  it('un point hors plage est séparé : montré « à vérifier », jamais parmi les sûrs', () => {
    const { sures, aVerifier } = separerAVerifier(ventes);
    expect(aVerifier.map((v) => v.qui)).toEqual(['ZZ Bar du Test']);
    expect(sures.map((v) => v.qui).sort()).toEqual(['ZZ Café A', 'ZZ Café B']);
  });

  it('l’échelle ne dépend que des points sûrs : elle reste celle de kxc (4,5 – 23), pas tirée jusqu’à 759', () => {
    const { sures } = separerAVerifier(ventes);
    expect(domaineKxc(sures.map((v) => v.litre))).toEqual([4.5, 23]);
    expect(domaineKxc(ventes.map((v) => v.litre))[1]).toBeGreaterThan(700); // la base : le point fou tirait l'axe
  });

  it('les bornes sont comprises ; un litre non fini est à vérifier', () => {
    const { sures, aVerifier } = separerAVerifier([{ litre: 1 }, { litre: 100 }, { litre: 0.99 }, { litre: 100.01 }, { litre: NaN }]);
    expect(sures).toEqual([{ litre: 1 }, { litre: 100 }]);
    expect(aVerifier).toHaveLength(3);
  });
});
