import { describe, expect, it } from 'vitest';
import { CASE_MIN, carteArchives, hauteurCarte, pireRapport, squarify, type Rect } from '../../src/domain/finance/archivesCarte';

const aire = (r: Rect) => r.w * r.h;
const dedans = (r: Rect, b: Rect) => r.x >= b.x - 1e-9 && r.y >= b.y - 1e-9 && r.x + r.w <= b.x + b.w + 1e-9 && r.y + r.h <= b.y + b.h + 1e-9;
const sechevauchent = (a: Rect, b: Rect) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;

describe('squarify (Bruls, Huizing, van Wijk, 2000)', () => {
  it('remplit la boîte, sans recouvrement, chaque aire proportionnelle à sa valeur, dans l’ordre d’entrée', () => {
    const boite = { x: 0, y: 0, w: 6, h: 4 }, valeurs = [2, 6, 1, 6, 4, 3, 2];
    for (const sens of ['auto', 'largeur'] as const) {
      const rects = squarify(valeurs, boite, sens), total = valeurs.reduce((a, b) => a + b, 0);
      expect(rects).toHaveLength(valeurs.length);
      expect(rects.reduce((t, r) => t + aire(r), 0)).toBeCloseTo(24, 9);
      rects.forEach((r, i) => { expect(aire(r)).toBeCloseTo(24 * valeurs[i] / total, 9); expect(dedans(r, boite)).toBe(true); });
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(sechevauchent(rects[i], rects[j])).toBe(false);
    }
  });
  it('exemple de l’article : 6 6 4 3 2 2 1 dans 6×4, la première colonne tient les deux 6 (3×2 chacun), cases presque carrées', () => {
    const r = squarify([6, 6, 4, 3, 2, 2, 1], { x: 0, y: 0, w: 6, h: 4 });
    expect(r[0]).toMatchObject({ x: 0, y: 0, w: 3, h: 2 });
    expect(r[1]).toMatchObject({ x: 0, y: 2, w: 3, h: 2 });
    const pire = Math.max(...r.map(c => Math.max(c.w / c.h, c.h / c.w)));
    expect(pire).toBeLessThan(3); // rapport le plus allongé : 2,78 (la case de valeur 1)
  });
  it('une seule valeur remplit la boîte', () => {
    expect(squarify([5], { x: 2, y: 3, w: 10, h: 4 })).toEqual([{ x: 2, y: 3, w: 10, h: 4 }]);
  });
  it('sens « largeur » : la maquette (2 400 et 650 dans 366×250) empile deux rangées, 197 et 53 px', () => {
    const [a, b] = squarify([2400, 650], { x: 0, y: 0, w: 366, h: 250 }, 'largeur');
    expect(a.w).toBeCloseTo(366, 6); expect(b.w).toBeCloseTo(366, 6);
    expect(a.h).toBeCloseTo(250 * 2400 / 3050, 6); expect(Math.round(a.h)).toBe(197);
    expect(Math.round(b.h)).toBe(53); expect(b.y).toBeCloseTo(a.h, 6);
  });
  it('sens « auto » : dans une boîte plus large que haute, la rangée longe la hauteur (colonnes)', () => {
    const [a, b] = squarify([2400, 650], { x: 0, y: 0, w: 366, h: 250 }, 'auto');
    expect(a.h).toBeCloseTo(250, 6); expect(b.h).toBeCloseTo(250, 6);
  });
  it('boîte ou valeurs impossibles : rien de posé, jamais NaN', () => {
    expect(squarify([], { x: 0, y: 0, w: 10, h: 10 })).toEqual([]);
    expect(squarify([1, 2], { x: 0, y: 0, w: 0, h: 10 }).every(r => r.w === 0 && r.h === 0)).toBe(true);
  });
  it('pireRapport : une rangée d’aire 6 sur un côté de 2 vaut max(2²·6/6², 6²/(2²·6)) = 1,5', () => {
    expect(pireRapport([6], 2)).toBeCloseTo(1.5, 9);
    expect(pireRapport([3, 3], 2)).toBeCloseTo(Math.max(4 * 3 / 36, 36 / (4 * 3)), 9);
  });
});

describe('carteArchives : la carte de l’argent mis de côté', () => {
  const entrees = [{ id: 'froid', cents: 240000, payeCents: 20000 }, { id: 'moulin', cents: 65000 }, { id: 'tireuse', cents: null }];
  it('la maquette : 3 050 CHF pour 2 prix connus sur 3, la tireuse hors carte, jamais une case à zéro', () => {
    const c = carteArchives(entrees, 366);
    expect(c.totalCents).toBe(305000); expect(c.nbPrix).toBe(2); expect(c.nbProjets).toBe(3);
    expect(c.cases.map(x => x.id)).toEqual(['froid', 'moulin']); // du plus cher au moins cher
    expect(c.horsCarte).toEqual([{ id: 'tireuse', prixNul: false }]);
    expect(c.cases.some(x => !(x.w > 0 && x.h > 0))).toBe(false);
  });
  it('surface = prix : le rapport des aires est celui des prix', () => {
    const [a, b] = carteArchives(entrees, 366).cases;
    expect(a.w * a.h / (b.w * b.h)).toBeCloseTo(240000 / 65000, 6);
  });
  it('l’acompte payé est la part de la case (200 sur 2 400), absent sans achat lié', () => {
    const [froid, moulin] = carteArchives(entrees, 366).cases;
    expect(froid.payeCents).toBe(20000); expect(froid.partPayee).toBeCloseTo(200 / 2400, 9);
    expect(moulin.payeCents).toBeNull(); expect(moulin.partPayee).toBe(0);
  });
  it('un payé qui dépasse le prix est borné au prix ; un payé nul ou négatif n’est pas une bande', () => {
    const c = carteArchives([{ id: 'a', cents: 1000, payeCents: 5000 }, { id: 'b', cents: 1000, payeCents: 0 }, { id: 'c', cents: 1000, payeCents: -3 }], 366);
    expect(c.cases.find(x => x.id === 'a')!.partPayee).toBe(1);
    expect(c.cases.find(x => x.id === 'b')!.payeCents).toBeNull(); expect(c.cases.find(x => x.id === 'c')!.payeCents).toBeNull();
  });
  it('un prix de 0 ou invalide n’a pas de surface : hors carte, sans être compté dans le total', () => {
    const c = carteArchives([{ id: 'zero', cents: 0 }, { id: 'nan', cents: Number.NaN }, { id: 'ok', cents: 5000 }], 366);
    expect(c.cases.map(x => x.id)).toEqual(['ok']); expect(c.totalCents).toBe(5000);
    expect(c.horsCarte).toEqual([{ id: 'zero', prixNul: true }, { id: 'nan', prixNul: false }]);
  });
  it('rien d’archivé ou rien de chiffré : carte vide, total 0 sans case', () => {
    expect(carteArchives([], 366)).toMatchObject({ cases: [], horsCarte: [], totalCents: 0, nbPrix: 0, hauteur: 0 });
    const c = carteArchives([{ id: 'x', cents: null }], 366);
    expect(c.cases).toEqual([]); expect(c.horsCarte).toHaveLength(1); expect(c.nbPrix).toBe(0);
  });
  it('la hauteur grandit jusqu’à ce que chaque case garde un bouton de 44 px et une largeur lisible', () => {
    const prix = [240000, 150000, 65000, 40000, 35000, 20000];
    const h = hauteurCarte(prix, 366);
    expect(h).toBeGreaterThanOrEqual(250);
    const rects = squarify(prix, { x: 0, y: 0, w: 366, h }, 'largeur');
    rects.forEach(r => { expect(r.h).toBeGreaterThanOrEqual(CASE_MIN.h); expect(r.w).toBeGreaterThanOrEqual(CASE_MIN.w); });
  });
  it('les cases sont dans la carte et ne se recouvrent pas, à 390 comme à 680 de large', () => {
    for (const largeur of [366, 680]) {
      const c = carteArchives([{ id: 'a', cents: 240000 }, { id: 'b', cents: 65000 }, { id: 'c', cents: 35000 }, { id: 'd', cents: 12000 }], largeur);
      const boite = { x: 0, y: 0, w: largeur, h: c.hauteur };
      c.cases.forEach(r => expect(dedans(r, boite)).toBe(true));
      for (let i = 0; i < c.cases.length; i++) for (let j = i + 1; j < c.cases.length; j++) expect(sechevauchent(c.cases[i], c.cases[j])).toBe(false);
    }
  });
});
