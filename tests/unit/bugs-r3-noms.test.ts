/**
 * Voie r3 (relance 20.11) — T3B-12 / T4-4 : « Rstgerste (orge torrfie) », « Caramnch Typ 2 » (accents perdus dans la donnée de la recette Milk Stout).
 * Le même nom, avec ses accents, partout : sur la fiche (recetteLue) ET sur la feuille « Brasser » (besoinsDe). Le nom vient du stock quand il est
 * unique, sinon du catalogue des noms de malts ; jamais deviné. La recette enregistrée n'est pas modifiée (données réelles).
 * Rouge avant : le stock de l'essai ne contient pas Röstgerste, la fiche garde « Rstgerste » ; la feuille garde les deux noms abîmés.
 */
import { describe, expect, it } from 'vitest';
import { reparerNomAbime, recetteLue } from '../../src/domain/recipeIngredientsAbimes';
import { besoinsDe } from '../../src/ui/production/recettes/recettesModel';
import type { Recipe, StockItem } from '../../src/types';

const stock = (name: string, ref: string): StockItem => ({ id: ref, ref, name, category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false } as StockItem);
const STOCK = [stock('Caramünch Typ 2', 'MALT-CARA')];

const milkStout = (): Recipe => ({
  id: 'REC-ZZTEST-MS', name: 'ZZ TEST — Milk Stout', style: 'Milk Stout', volumeL: 20,
  fermentables: [
    { name: 'Rstgerste (orge torrfie)', weightKg: 0.4, kind: 'grain', use: 'empatage' },
    { name: 'Caramnch Typ 2', weightKg: 0.6, kind: 'grain', use: 'empatage' },
  ],
  hops: [], yeast: { name: '' },
} as unknown as Recipe);

describe('reparerNomAbime : le stock d’abord, puis le catalogue des noms de malts', () => {
  it('sans Röstgerste au stock, le catalogue rend « Röstgerste (orge torréfiée) », mot par mot', () => {
    expect(reparerNomAbime('Rstgerste (orge torrfie)', ['Caramünch Typ 2'])).toBe('Röstgerste (orge torréfiée)');
    expect(reparerNomAbime('Rstgerste (orge torrfie)', [])).toBe('Röstgerste (orge torréfiée)');
  });
  it('le stock garde la priorité : « Caramnch Typ 2 » devient le nom du stock', () => {
    expect(reparerNomAbime('Caramnch Typ 2', ['Caramünch Typ 2'])).toBe('Caramünch Typ 2');
  });
  it('jamais deviné : un nom sans correspondance ou ambigu au stock reste tel quel', () => {
    expect(reparerNomAbime('Xyzstgerste (abc)', STOCK.map(s => s.name))).toBe('Xyzstgerste (abc)');
    expect(reparerNomAbime('Caramnch', ['Caramünch', 'Caramônch'])).toBe('Caramnch');
    expect(reparerNomAbime('Pilsner Malz', [])).toBe('Pilsner Malz');
    expect(reparerNomAbime('Röstgerste (orge torréfiée)', [])).toBe('Röstgerste (orge torréfiée)');
  });
});

describe('le même nom sur la fiche et sur la feuille', () => {
  const noms = STOCK.map(s => s.name);
  it('la fiche (recetteLue) lit les deux noms avec leurs accents', () => {
    const lue = recetteLue(milkStout(), noms);
    expect(lue.fermentables!.map(f => f.name)).toEqual(['Röstgerste (orge torréfiée)', 'Caramünch Typ 2']);
  });
  it('la feuille (besoinsDe) dit les mêmes noms, jamais « Rstgerste » ni « Caramnch »', () => {
    const lignes = besoinsDe(milkStout(), [], STOCK);
    const dit = lignes.map(l => `${l.texte} | ${l.manque ?? ''} | ${l.manqueGras ?? ''}`).join('\n');
    expect(dit).toMatch(/Röstgerste \(orge torréfiée\)/);
    expect(dit).toMatch(/Caramünch Typ 2/);
    expect(dit).not.toMatch(/Rstgerste|Caramnch/);
  });
  it('la recette enregistrée n’est pas modifiée', () => {
    const r = milkStout();
    const avant = JSON.stringify(r);
    recetteLue(r, noms); besoinsDe(r, [], STOCK);
    expect(JSON.stringify(r)).toBe(avant);
  });
});
