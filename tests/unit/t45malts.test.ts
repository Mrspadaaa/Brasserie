// T4-5 (passe 5, 20.11, rouvre TL-10) : des malts Weyermann restaient sans couleur. « Caramünch Typ 2 » (écriture du malteur : « Typ », chiffre arabe, lettres
// accentuées) ne se reliait pas à sa fiche ; « Munich » seul (type 1 ou 2) restait inconnu ; la fiche Milk Stout disait « EBC — · Couleur EBC manquante ».
// Chaque test échoue sur le code d'avant. Valeurs : table `src/data/malts/weyermann.json` (catalogue « Brewery » Weyermann, récolte 2026).
import { describe, expect, it } from 'vitest';
import { fichePubliee, plageEbc } from '../../src/domain/fermentables/fichesMalts';
import { recetteLue } from '../../src/domain/recipeIngredientsAbimes';
import type { Recipe } from '../../src/types';

describe('T4-5 : les écritures du malteur se relient à leur fiche', () => {
  it.each([
    ['Caramünch Typ 2', 'Caramunich® Type 2', 110, 130],
    ['Caramünch® Typ 2', 'Caramunich® Type 2', 110, 130],
    ['Weyermann® Caramünch Typ 1', 'Caramunich® Type 1', 80, 100],
    ['CARAMÜNCH TYP III', 'Caramunich® Type 3', 140, 160],
    ['Carafa Spezial Typ 2', 'Carafa® Special Type 2', 1050, 1250],
    ['Carafa Typ 3', 'Carafa® Type 3', 1300, 1500],
    ['Münchner Malz Typ 2', 'Munich Malt Type 2', 20, 25],
    ['Munich Type 1', 'Munich Malt Type 1', 12, 18],
    ['Carahell', 'Carahell®', 20, 30],
    ['Melanoidin', 'Melanoidin Malt', 60, 80],
  ])('%s → %s, %i–%i EBC', (nom, produit, min, max) => {
    const f = fichePubliee(nom);
    expect(f?.produit).toBe(produit);
    expect([f?.ebcMin, f?.ebcMax]).toEqual([min, max]);
    expect(f?.colorEbc).toBe((min + max) / 2);
    expect(f?.source).toMatch(/Weyermann/);
  });

  it('« Munich » seul : le type n’est pas dit, la plage couvre les deux fiches (12–25 EBC) et le dit ; la valeur centrale est marquée', () => {
    const f = fichePubliee('Munich');
    expect([f?.ebcMin, f?.ebcMax]).toEqual([12, 25]);
    expect(f?.ambigu).toMatch(/type 1 ou 2/);
    expect(f?.colorEbc).toBe(18.5);
    expect(plageEbc(f!)).toBe('12–25');
    expect(fichePubliee('Münchner Malz')?.ambigu).toBeTruthy();
  });

  it('jamais deviné : un type absent de la table, un autre malteur', () => {
    expect(fichePubliee('Caramünch Typ 4')).toBeNull();
    expect(fichePubliee('Castle Munich')).toBeNull();
    expect(fichePubliee('Carafa Typ 9')).toBeNull();
  });
});

describe('T4-5 : la fiche de recette lit la couleur publiée quand elle manque (donnée enregistrée intacte)', () => {
  const recette = () => ({
    id: 'zz-t45', name: 'ZZ TEST — Milk Stout', style: '15A', volumeL: 20, boilMin: 60, efficiencyPct: 75, hops: [], yeast: { name: '' },
    fermentables: [
      { name: 'Pilsner Malz', weightKg: 4, kind: 'grain', use: 'empatage', colorEbc: 3.5 },
      { name: 'Caramünch Typ 2', weightKg: 0.4, kind: 'grain', use: 'empatage' },
      { name: 'Castle Chateau Pilsen', weightKg: 1, kind: 'grain', use: 'empatage' },
      { name: 'Lactose', weightKg: 0.3, kind: 'lactose', use: 'ebullition' },
    ],
  } as unknown as Recipe);
  it('Caramünch Typ 2 prend 120 EBC (milieu de 110–130) ; la saisie prime ; hors table : inconnu, jamais 0 ; un sucre garde sa couleur absente', () => {
    const enregistree = recette();
    const lue = recetteLue(enregistree);
    const f = lue.fermentables!;
    expect(f[0].colorEbc).toBe(3.5);
    expect(f[1].colorEbc).toBe(120);
    expect(f[2].colorEbc).toBeUndefined();
    expect(f[3].colorEbc).toBeUndefined();
    expect(enregistree.fermentables![1].colorEbc).toBeUndefined();
  });
});
