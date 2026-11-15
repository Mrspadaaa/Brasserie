// Voie vd2, verdict 5cdcd12e n° 5 : un rayon plié (maquette g6, chevron ⌃) se résume sur une ligne, dans les mots des pastilles.
import { describe, expect, it } from 'vitest';
import { infoLigne, resumeRayon } from '../../src/domain/stock/liste';
import type { StockItem } from '../../src/types';

const art = (ref: string, name: string, currentStock: number, minStock?: number): StockItem =>
  ({ id: ref, ref, name, category: 'Malt', unit: 'kg', currentStock, minStock, colorEbc: 5, reorder: false } as StockItem);

describe('le résumé d\'un rayon plié', () => {
  const avoine = art('a', 'Avoine floconnée', 1.2, 2);   // manque
  const otter = art('o', 'Maris Otter', 0, 25);          // épuisé (et manque, si un besoin le demande)
  const pils = art('p', 'Pilsner', 120, 50);             // assez
  const caramel = art('c', 'Caramel', 3);                // sans seuil
  const items = [avoine, otter, pils, caramel];
  const aCommander = new Map([['a', { item: avoine, missing: 0.8, auMoins: false, sources: [] }]]);
  const infos = new Map(items.map((i) => [i.ref, infoLigne(i, aCommander as never, '2026-11-14')] as const));

  it('dit chaque état présent, avec son nombre, et nomme les articles quand ils sont deux au plus', () => {
    const r = resumeRayon(items, infos);
    expect(r).toContain('manque 1 : Avoine floconnée');
    expect(r).toContain('épuisés 1 : Maris Otter');
    expect(r).not.toContain('Pilsner'); // un article sans état n'est pas nommé
  });
  it('au-delà de deux articles d\'un état : le nombre seul', () => {
    const six = ['x1', 'x2', 'x3'].map((r) => art(r, 'Malt ' + r, 0, 5));
    const inf = new Map(six.map((i) => [i.ref, infoLigne(i, new Map(), '2026-11-14')] as const));
    expect(resumeRayon(six, inf)).toBe('épuisés 3');
  });
  it('rien à signaler : le dit, sans inventer un état', () => {
    const inf = new Map([[pils.ref, infoLigne(pils, new Map(), '2026-11-14')] as const]);
    expect(resumeRayon([pils], inf)).toBe('rien à signaler');
  });
  it('aucun article : une chaîne vide (le rayon n\'a pas de ligne à résumer)', () => {
    expect(resumeRayon([], new Map())).toBe('');
  });
});
