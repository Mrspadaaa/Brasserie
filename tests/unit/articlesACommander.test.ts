import { describe, expect, it } from 'vitest';
import { articlesACommander } from '../../src/domain/stockLevel';
import type { StockItem } from '../../src/types';

// Test en ligne n° 49 (07.11) : Stocks disait « À commander · 12 », le Bord et le badge « 26 articles au seuil · 21 ruptures ».
// Une seule règle : un article sans seuil renseigné (minStock 0) n'a pas de seuil à atteindre ; une rupture sur un article suivi se compte.
const article = (ref: string, currentStock: number, minStock: number, over: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name: ref, category: 'Malt', unit: 'kg', currentStock, minStock, reorder: false, ...over }) as StockItem;

describe('articlesACommander (n° 49)', () => {
  const items = [
    article('A-suivi-bas', 2, 5),         // sous son seuil : à commander (3 kg)
    article('B-suivi-seuil', 5, 5),       // pile au seuil : à commander, quantité à définir (0)
    article('C-rupture-suivie', 0, 10),   // rupture d'un article suivi : à commander (10 kg), rupture
    article('D-sans-seuil-vide', 0, 0),   // aucun seuil renseigné : pas un manque
    article('E-sans-seuil-plein', 40, 0), // aucun seuil, du stock : pas un manque
    article('F-confortable', 30, 5),      // au-dessus du seuil : rien
  ];

  it('compte les articles sous un seuil renseigné, pas ceux sans seuil', () => {
    const liste = articlesACommander(items, []);
    expect(liste.map((a) => a.item.ref)).toEqual(['A-suivi-bas', 'B-suivi-seuil', 'C-rupture-suivie']);
  });

  it('donne la quantité à commander et la rupture', () => {
    const [bas, seuil, vide] = articlesACommander(items, []);
    expect(bas).toMatchObject({ missing: 3, rupture: false });
    expect(seuil).toMatchObject({ missing: 0, rupture: false });
    expect(vide).toMatchObject({ missing: 10, rupture: true });
  });

  it('un même comptage pour le Bord, Stocks et le badge : sa longueur', () => {
    const liste = articlesACommander(items, []);
    expect(liste.length).toBe(3);
    expect(liste.filter((a) => a.rupture).length).toBe(1);
  });

  it('une liste vide ne manque de rien', () => {
    expect(articlesACommander([], [])).toEqual([]);
  });
});
