import { describe, expect, it } from 'vitest';
import { recipeEntries, batchEntries } from '../../src/domain/productionCatalog';
import { computeBeerColor, recipeBeerColor } from '../../src/domain/beerColor';
import type { Fermentable } from '../../src/types';

// Contre-calcul du 08.11, CF-1 : la couleur vient de TOUS les fermentescibles qui colorent le moût (sucres colorés
// compris). Cas R11 du rapport : dubbel au sirop candi.
const pils = (kg: number): Fermentable => ({ name: 'Pilsner', weightKg: kg, potentialPpg: 37, colorEbc: 3.5, kind: 'grain', use: 'empatage' });
const specialB: Fermentable = { name: 'Special B', weightKg: 0.25, potentialPpg: 30, colorEbc: 300, kind: 'grain', use: 'empatage' };
const candi: Fermentable = { name: 'Sirop candi D-180', weightKg: 0.5, potentialPpg: 32, colorEbc: 355, kind: 'sucre', use: 'ebullition', fermentabilityPct: 100 };
const dubbel = [pils(4.5), specialB, candi];
const dubbelSansSirop = [pils(4.5), specialB];

const recette = (fermentables: Fermentable[]) => ({
  id: 'r', name: 'Dubbel', style: 'Dubbel', volumeL: 20, boilMin: 75, fermentables, hops: [],
  yeast: { name: 'Levure', qty: 1, unit: 'sachet' }
}) as never;

describe('CF-1 — la couleur des sucres compte dans l’EBC', () => {
  it('la liste des recettes compte le sirop candi D-180 (22,3 EBC avant, grains seuls)', () => {
    const grains = computeBeerColor(dubbelSansSirop, 20)!.ebc;
    const liste = recipeEntries([recette(dubbel)], [])[0].ebc!;
    expect(liste).toBeGreaterThan(grains * 1.4);
    expect(liste).toBe(recipeBeerColor(dubbel, 20)!.ebc);
  });

  it('la liste des brassins compte aussi le sirop (recette figée)', () => {
    const batch = { id: 'b', name: 'Dubbel', volumeL: 20, recipeSnapshot: recette(dubbel) } as never;
    expect(batchEntries([batch])[0].ebc).toBe(recipeBeerColor(dubbel, 20)!.ebc);
  });

  it('un sucre sans couleur (saccharose, 0 EBC) ne change pas la couleur des grains', () => {
    const sucre: Fermentable = { name: 'Saccharose', weightKg: 0.6, potentialPpg: 46, colorEbc: 0, kind: 'sucre', use: 'ebullition' };
    expect(recipeBeerColor([...dubbelSansSirop, sucre], 20)!.ebc).toBe(recipeBeerColor(dubbelSansSirop, 20)!.ebc);
  });

  it('un grain sans couleur rend toujours null : un chiffre partiel serait faux', () => {
    const inconnu = { ...specialB, colorEbc: undefined };
    expect(recipeBeerColor([pils(4.5), inconnu, candi], 20)).toBeNull();
  });
});
