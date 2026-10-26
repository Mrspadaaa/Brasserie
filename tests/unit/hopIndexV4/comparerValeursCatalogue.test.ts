// Voie c2-comparer-valeurs : la feuille Valeurs de Comparer lit aussi le catalogue du moteur (Beer Maverick, Hopsteiner) quand la
// fiche de composés du houblon n'a pas la valeur ; la ligne « Autres » lit la valeur publiée ; la fiche du moteur porte le farnésène.
// Données : fixtures du moteur (proto-data.json) ; aucune donnée réelle.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { hopSheet } from '../../../src/domain/hopIndex/v4/fiches';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { compose, huile } from '../../../src/ui/hopIndex/comparer/valeurs';

const MOSAIC = 'beermaverick-mosaic', NELSON = 'beermaverick-nelson-sauvin', CITRA = 'beermaverick-citra';
const cat = (id: string) => CATALOGUE.find((h) => h.id === id)!;

describe('la chimie de Comparer prend le catalogue quand la fiche de composés manque', () => {
  it('Mosaic (aucune fiche de composés) : myrcène, humulène, caryophyllène de Beer Maverick', () => {
    expect(compose(MOSAIC, 'myrcene')).toMatchObject({ lo: 47, hi: 55, texte: '47–55', refs: ['BM'] });
    expect(compose(MOSAIC, 'humulene')).toMatchObject({ lo: 10, hi: 16, refs: ['BM'] });
    expect(compose(MOSAIC, 'caryophyllene')).toMatchObject({ lo: 3, hi: 8, refs: ['BM'] });
  });
  it('« inconnu » reste quand aucune source n’a la valeur : linalol de Mosaic (pas de fiche Hopsteiner), géraniol, 4MMP', () => {
    expect(cat(MOSAIC).hsLinalool).toBeNull();
    expect(compose(MOSAIC, 'linalol')).toBeNull();
    expect(compose(MOSAIC, 'geraniol')).toBeNull();
    expect(compose(MOSAIC, '4MMP')).toBeNull();
  });
  it('le linalol vient de Hopsteiner (HS) pour tout houblon dont le catalogue le porte', () => {
    const avecHS = CATALOGUE.filter((h) => h.hsLinalool);
    expect(avecHS.length).toBeGreaterThan(0);
    for (const h of avecHS) {
      const v = compose(h.id, 'linalol')!;
      expect(v, h.id).not.toBeNull();
      expect(v.refs, h.id).toContain('HS');
      expect(v.lo, h.id).toBeLessThanOrEqual(h.hsLinalool!.range[0]);
      expect(v.hi!, h.id).toBeGreaterThanOrEqual(h.hsLinalool!.range[1]);
    }
  });
  it('la plage reste l’enveloppe de toutes les sources : Citra garde ses fiches H1, H7c, H8 en plus de BM', () => {
    const c = compose(CITRA, 'myrcene')!;
    expect(c.lo).toBeCloseTo(28.6, 5);
    expect(c.hi).toBe(70);
    expect(c.refs).toEqual(expect.arrayContaining(['H1', 'H7c', 'H8', 'BM']));
  });
});

describe('l’huile totale prend le catalogue (BM oil, HS totalOil) quand la fiche de composés manque', () => {
  it('Mosaic : 1–1,5 mL/100 g, Beer Maverick', () => {
    expect(cat(MOSAIC).oil).toEqual([1, 1.5]);
    expect(huile(MOSAIC)).toMatchObject({ lo: 1, hi: 1.5, refs: ['BM'] });
  });
  it('Nelson Sauvin : l’enveloppe garde BM et HS', () => {
    const v = huile(NELSON)!;
    expect(v.refs).toEqual(expect.arrayContaining(['BM', 'HS']));
    for (const p of [cat(NELSON).oil, cat(NELSON).hs?.totalOil]) if (p) { expect(v.lo).toBeLessThanOrEqual(p[0]); expect(v.hi!).toBeGreaterThanOrEqual(p[1]); }
  });
  it('un houblon sans aucune huile publiée reste null (jamais 0)', () => {
    const sans = CATALOGUE.find((h) => !h.oil && !h.hs?.totalOil && !compose(h.id, 'myrcene'));
    if (sans) expect(huile(sans.id)).toBeNull();
  });
});

describe('la fiche du moteur porte le farnésène de Beer Maverick avec sa source', () => {
  const base: Recipe = { name: 'Pale', styleCode: '16D', volumeL: 20, og: 1.05, boilMin: 60, yeastId: null, additions: [] };
  const ctx = { recipes: [], ibuBase: base };
  it('Nelson Sauvin : 0–1 % de l’huile, Beer Maverick', () => {
    const f = hopSheet(NELSON, ctx).huiles.composants;
    expect(f.farnesene).toMatchObject({ min: 0, max: 1, unite: '% de l’huile', source: 'Beer Maverick' });
    expect('farneseneRaison' in f).toBe(false);
  });
  it('un houblon sans farnésène publié reste null, avec sa raison', () => {
    const sans = CATALOGUE.find((h) => !h.oils.farnesene);
    if (!sans) return;
    const f = hopSheet(sans.id, ctx).huiles.composants;
    expect(f.farnesene).toBeNull();
    expect((f as { farneseneRaison?: string }).farneseneRaison).toMatch(/ne publie pas/);
  });
});
