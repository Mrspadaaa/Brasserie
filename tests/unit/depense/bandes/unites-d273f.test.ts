// D273f (01.11, nuit) : sur sa commande, la 3.8 lit l'unité « Gramm » (« SPECIAL W®, Gramm »). Inconnue des unités, elle restait une
// unité « à la pièce » (aucune conversion vers g ni kg) et s'affichait telle quelle : « 100 Gramm » débordait la colonne de 37 px et courait sur
// le prix unitaire (« 100 Gram0,0101 », capture 390 du bout en bout). Les écritures longues des quatre langues des factures (D271) sont des
// masses ou des volumes pour la Dépense, et s'affichent en symbole ; une unité courte reste telle qu'imprimée (« Kg », « Stk »).
// `Units` global ne change pas (s1b n° 2, tests/unit/depense/stock/relecture.test.ts).
import { describe, expect, it } from 'vitest';
import { Units } from '../../../../src/services/units';
import { linkUnit, shortUnit } from '../../../../src/services/stockLineMatching';
import { bandes, texteQte } from '../../../../src/ui/depense/groupes';

describe('D273f — les unités écrites en toutes lettres sur une facture', () => {
  it.each([
    ['Gramm', 'g', 100, 100], ['Gramme', 'g', 100, 100], ['grammi', 'g', 100, 100], ['grams', 'g', 100, 100],
    ['Kilogramm', 'g', 2, 2000], ['kilo', 'g', 2, 2000], ['chilogrammi', 'g', 2, 2000], ['Liter', 'ml', 2, 2000], ['litri', 'ml', 2, 2000],
  ])('« %s » se convertit en %s pour la Dépense', (unite, vers, n, attendu) => {
    expect(Units.convert(n, linkUnit(unite), vers)).toBe(attendu);
  });

  it('une écriture longue s’affiche en symbole, une courte telle qu’imprimée', () => {
    expect(shortUnit('Gramm')).toBe('g');
    expect(shortUnit(' Kilogramm ')).toBe('kg');
    expect(shortUnit('Liter')).toBe('l');
    expect(shortUnit('Kg')).toBe('Kg');
    expect(shortUnit('Stk')).toBe('Stk');
    expect(shortUnit('')).toBe('');
  });

  it('le sous-total d’une bande additionne « Gramm » et « g » sous le symbole', () => {
    const lignes = [
      { id: 'a', groupe: 'malt' as const, amount: 1, quantity: 100, unit: shortUnit('Gramm'), uniteLisible: true, mouture: false },
      { id: 'b', groupe: 'malt' as const, amount: 1, quantity: 50, unit: shortUnit('g'), uniteLisible: true, mouture: false },
    ];
    expect(texteQte(bandes(lignes)[0].qte)).toBe('150 g');
  });
});
