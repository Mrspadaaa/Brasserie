// La table de typicité (Beer Analytics, CC BY-SA 4.0) : sa forme, sa licence, et le lien avec la table des noms.
import { describe, expect, it } from 'vitest';
import table from '../../../src/data/fermentables/typicite-styles.json';
import noms from '../../../src/data/fermentables/fermentescibles.json';
import { NOMS } from '../../../src/domain/fermentables/noms';
import { PALIERS_TYPICITE, palierDansLaCle, palierDePart, typiciteDe, type TableTypicite } from '../../../src/domain/fermentables/typicite';

const T = table as unknown as TableTypicite & { source: { licence: string; url: string } };
const FERMENTESCIBLES = (noms as unknown as { fermentescibles: Record<string, { nom: string; categorie: string }> }).fermentescibles;

describe('typicite-styles.json', () => {
  it('porte sa licence et sa source en tête', () => {
    expect(T.source.licence).toBe('CC BY-SA 4.0');
    expect(T.source.url).toContain('beer-analytics.com');
  });

  it('rattache les styles courants au BJCP 2021', () => {
    expect(T.styles['5D']).toBe('German Pils');
    for (const code of ['4A', '10A', '15B', '16A', '20C', '21A', '26C']) expect(T.styles[code], code).toBeTruthy();
  });

  it('toute part est une fraction de 0 à 1, et la borne p16 ne dépasse aucune part publiée', () => {
    for (const [, parStyle] of Object.entries(T.parts)) {
      for (const [slug, part] of Object.entries(parStyle)) {
        expect(part).toBeGreaterThanOrEqual(0);
        expect(part).toBeLessThanOrEqual(1);
        expect(T.p16[slug], slug).toBeDefined();
        expect(T.p16[slug]).toBeLessThanOrEqual(part);
      }
    }
  });

  it('aucune part publiée n\'est écrasée en zéro par l\'arrondi', () => {
    const zeros = [...Object.values(T.p16), ...Object.values(T.parts).flatMap((o) => Object.values(o))].filter((v) => v === 0);
    expect(zeros).toHaveLength(0);
  });

  it('le Pilsner pèse dans les German Pils, le Roasted Barley dans les stouts', () => {
    expect(T.parts['5D']['pilsner-malt']).toBeGreaterThan(0.5);
    expect(T.parts['15B']['roasted-barley-malt']).toBeGreaterThan(0.2);
  });

  it('chaque nom de la table des noms désigne une page de Beer Analytics', () => {
    for (const n of NOMS) {
      expect(FERMENTESCIBLES[n.slug], `${n.canonique} (${n.slug}) n'est pas chez Beer Analytics`).toBeDefined();
    }
  });
});

describe('typiciteDe : paliers et inconnu', () => {
  it('les paliers découpent la part', () => {
    expect(PALIERS_TYPICITE.map((p) => p.palier)).toEqual([4, 3, 2, 1]);
    expect([0.91, 0.5, 0.49, 0.15, 0.14, 0.03, 0.029, 0].map(palierDePart)).toEqual([4, 4, 3, 3, 2, 2, 1, 1]);
  });

  it('un style hors des 16 premiers n\'est pas 0 : rare par la borne si elle est basse, sinon inconnu borné', () => {
    const t: TableTypicite = { source: { nom: '', licence: '', releve: null }, styles: { '5D': 'German Pils' }, p16: { a: 0.01, b: 0.2 }, parts: { '5D': {} } };
    const a = typiciteDe('a', '5D', t), b = typiciteDe('b', '5D', t), c = typiciteDe('c', '5D', t);
    expect(a).toMatchObject({ palier: 1, part: null, origine: 'borne', auPlus: 0.01 });
    expect(b).toMatchObject({ palier: null, part: null, auPlus: 0.2 });
    expect(palierDansLaCle(b)).toBe(1.5);
    expect(c).toMatchObject({ palier: null, auPlus: null });
    expect(palierDansLaCle(c)).toBeNull();
  });

  it('une stout lit ses voisines à moitié ; le style visé, quand il est publié, prime', () => {
    const t: TableTypicite = { source: { nom: '', licence: '', releve: null }, styles: { '15B': 'Irish Stout', '16A': 'Sweet Stout' }, voisins: { '15B': ['16A'], '16A': ['15B'] }, poidsVoisin: 0.5, p16: { c: 0.3, d: 0.3 }, parts: { '15B': { d: 0.9 }, '16A': { c: 0.7, d: 0.1 } } };
    expect(typiciteDe('c', '15B', t)).toMatchObject({ palier: 3, part: 0.35, origine: 'voisin' });
    expect(typiciteDe('d', '16A', t)).toMatchObject({ palier: 2, part: 0.1, origine: 'style' });
    expect(typiciteDe('d', '15B', t)).toMatchObject({ palier: 4, part: 0.9, origine: 'style' });
  });

  it('la table réelle déclare les stouts voisines', () => {
    expect(T.voisins?.['15B']).toContain('16A');
    expect(T.poidsVoisin).toBe(0.5);
  });

  it('sans table, sans style, sans nom : inconnu, jamais 0', () => {
    expect(typiciteDe('pilsner-malt', '5D', null).palier).toBeNull();
    expect(typiciteDe('pilsner-malt', null, T).palier).toBeNull();
    expect(typiciteDe(null, '5D', T).palier).toBeNull();
    expect(typiciteDe('pilsner-malt', '5D', T).part).not.toBe(0);
  });
});
