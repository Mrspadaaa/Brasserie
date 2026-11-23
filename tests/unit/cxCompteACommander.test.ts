import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import { articlesACommander } from '../../src/domain/stockLevel';
import { compterEtats, infoLigne } from '../../src/domain/stock/liste';
import { libelleEtat } from '../../src/ui/stock/OutilsStock';

const art = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: o.ref ?? 'x', name: 'A', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o });

/** ST-T30 : le badge de la barre, Articles, Courses et le Bord comptent « à commander » ; les pastilles « manque » + « bas » le recoupent (hors quantité inconnue). */
describe('un seul nombre pour « à commander » (ST-T30)', () => {
  const items = [
    art({ ref: 'a', currentStock: 1.2, minStock: 1.5 }), // sous le seuil : manque
    art({ ref: 'b', currentStock: 0.5, minStock: 0.5 }), // pile au seuil : bas
    art({ ref: 'c', currentStock: 0, minStock: 2 }),     // épuisé sous seuil : manque
    art({ ref: 'd', currentStock: 5, minStock: 1 }),     // assez : rien
  ];
  const cmd = articlesACommander(items, [], []);
  const map = new Map(cmd.map((c) => [c.item.ref, c]));
  const comptes = compterEtats(items.map((i) => infoLigne(i, map, '2026-11-14')));
  it('manque + « au moins » + bas = articles à commander', () => {
    expect(cmd.map((c) => c.item.ref).sort()).toEqual(['a', 'b', 'c']);
    expect(comptes.manque + comptes.manquePlus + comptes.bas).toBe(cmd.length);
  });
  it('les pastilles se lisent « à commander » (manque) et « pile au seuil, déjà à commander » (bas)', () => {
    expect(libelleEtat('manque', 'manque', '2', comptes)).toBe('manque : 2 à commander');
    expect(libelleEtat('manque', 'manque', '17 + 3 ?', { ...comptes, manque: 17, manquePlus: 3 })).toBe('manque : 17 à commander, plus 3 « au moins »');
    expect(libelleEtat('bas', 'bas', '1', comptes)).toBe('bas : 1 pile au seuil, déjà à commander');
    expect(libelleEtat('epuise', 'épuisé', '1', comptes)).toBe('épuisé : 1');
  });
});
