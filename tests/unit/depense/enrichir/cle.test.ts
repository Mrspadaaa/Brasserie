import { describe, expect, it } from 'vitest';
/** Voie f4-enrichir, P3 : la clé de fiche (famille|fabricant|mots, ni EBC ni α ni origine) et la comparaison de deux produits. Pur. */
import { cleFiche, ficheRetenueDe, generique, memeProduitDeFiche, partiesDe } from '../../../../src/domain/stock/ficheCle';
import { nomPropre } from '../../../../src/domain/stock/donnees';
import type { StockItem } from '../../../../src/types';

const article = (ref: string, name: string, category: string, fiche?: Record<string, unknown>): StockItem =>
  ({ id: ref, ref, name, category, unit: 'kg', currentStock: 1, minStock: 0, reorder: false, ...(fiche ? { fiche } : {}) }) as StockItem;
const parente = (f: 'malt' | 'houblon' | 'levure', a: string, b: string) => memeProduitDeFiche(partiesDe(f, a), partiesDe(f, b));

describe('La clé ne porte ni origine, ni EBC, ni α (P3)', () => {
  it('« Cascade US » et « Cascade CH » (nom propre) : une clé', () => {
    expect(cleFiche('houblon', nomPropre('Cascade US', 'Houblon'))).toBe(cleFiche('houblon', nomPropre('Cascade CH', 'Houblon')));
  });
  it('« Münchner Malz 20 EBC » et son « bis » 15 EBC : une clé', () => {
    const a = nomPropre('Münchner Malz 20 EBC', 'Malt', { unit: 'kg', quantity: 5 }), b = nomPropre('Münchner Malz 15 EBC', 'Malt', { unit: 'kg', quantity: 5 });
    expect(cleFiche('malt', a)).toBe(cleFiche('malt', b));
  });
  it('« Target 11.3% » et « Target » : une clé', () => {
    expect(cleFiche('houblon', nomPropre('Target 11.3%', 'Houblon'))).toBe(cleFiche('houblon', nomPropre('Target', 'Houblon')));
  });
  it('le fabricant écrit entre dans la clé, ramené à un nom', () => {
    expect(partiesDe('malt', 'Weyermann Carahell')).toMatchObject({ fabricant: 'weyermann', mots: 'carahell' });
    expect(partiesDe('levure', 'Safale US-05 11,5g')).toMatchObject({ fabricant: 'fermentis' });
  });
});

describe('La comparaison, composante par composante (les 5 couples du plan)', () => {
  it('« Carahell » contre « Weyermann Carahell » → proche', () => { expect(parente('malt', 'Carahell', 'Weyermann Carahell')).toBe('proche'); });
  it('« Pilsner Malz » contre « Pilsner Malz Castle » → proche, et « Pilsner Malz » est générique', () => {
    expect(parente('malt', 'Pilsner Malz', 'Pilsner Malz Castle')).toBe('proche');
    expect(generique('malt', 'Pilsner Malz')).toBe(true);
    expect(generique('malt', 'Pilsner Malz Castle')).toBe(false);
    expect(generique('malt', 'Carahell')).toBe(false);
  });
  it('« Fermentis Windsor » contre « LalBrew Windsor » → autre (fabricants différents)', () => { expect(parente('levure', 'Fermentis Windsor', 'LalBrew Windsor')).toBe('autre'); });
  it('mêmes mots, aucun fabricant des deux côtés → meme ; « Cara Munich » = « Caramunich »', () => {
    expect(parente('malt', 'Ambre 60', 'Ambre 60')).toBe('meme');
    expect(parente('malt', 'Cara Munich', 'Caramunich')).toBe('meme');
  });
  it('mots différents → autre', () => { expect(parente('malt', 'Pilsner Malz', 'Münchner Malz')).toBe('autre'); });
});

describe('ficheRetenueDe, pour `learnIngredient` (PLAN § 4.4)', () => {
  const f4 = (cle: string) => ({ id: `cle:${cle}`, approchee: false, par: 'en-ligne', cle });
  const carahell = article('C1', 'Carahell Weyermann 1 kg', 'Malt', f4(cleFiche('malt', 'Weyermann Carahell')));
  it('meme : l’article f4 du même produit, nom différent', () => {
    expect(ficheRetenueDe('Weyermann Carahell', 'Malt', [carahell])).toEqual({ cas: 'meme', article: carahell });
  });
  it('proche : un nom sans fabricant contre une fiche avec → rien n’est écrit', () => {
    expect(ficheRetenueDe('Carahell', 'Malt', [carahell])).toEqual({ cas: 'proche' });
  });
  it('deux articles `meme` → proche (jamais un article au hasard)', () => {
    const autre = article('C2', 'Carahell sac 2', 'Malt', f4(cleFiche('malt', 'Weyermann Carahell')));
    expect(ficheRetenueDe('Weyermann Carahell', 'Malt', [carahell, autre])).toEqual({ cas: 'proche' });
  });
  it('aucun article f4, une autre catégorie, ou une catégorie absente → undefined', () => {
    expect(ficheRetenueDe('Weyermann Carahell', 'Malt', [article('X', 'Weyermann Carahell', 'Malt')])).toBeUndefined();
    expect(ficheRetenueDe('Weyermann Carahell', 'Levure', [carahell])).toBeUndefined();
    expect(ficheRetenueDe('Weyermann Carahell', undefined, [carahell])).toBeUndefined();
    expect(ficheRetenueDe('Weyermann Carahell', 'Emballage', [carahell])).toBeUndefined();
    // M2 (REVUE-code) : jamais un houblon (une valeur typique n'est pas l'α du lot).
    const cascade = article('H1', 'Cascade 2025 sac', 'Houblon', f4(cleFiche('houblon', 'Cascade')));
    expect(ficheRetenueDe('Cascade', 'Houblon', [cascade])).toBeUndefined();
  });
});
