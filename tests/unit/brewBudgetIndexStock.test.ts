import { describe, expect, it } from 'vitest';
import { resolveBudgetStock } from '../../src/domain/finance/brewBudget';
import type { StockItem } from '../../src/types';

// PERF (nuit du 26.11) : l'index du stock rend le même article que la recherche linéaire, et suit un tableau modifié sur place.
const art = (ref: string, name: string) => ({ ref, name, category: 'Malt', unit: 'kg', currentStock: 1 }) as unknown as StockItem;
const demande = (name: string, stockItemRef?: string) => ({ key: name, name, quantity: 1, unit: 'kg', kind: 'ingredient' as const, ...(stockItemRef ? { stockItemRef } : {}) });

describe('resolveBudgetStock, index du stock', () => {
  it('par référence : le premier article de cette référence ; absente : introuvable', () => {
    const stock = [art('a', 'Pilsner'), art('b', 'Munich'), art('a', 'Doublon')];
    expect(resolveBudgetStock(demande('x', 'a'), stock).item?.name).toBe('Pilsner');
    expect(resolveBudgetStock(demande('x', 'z'), stock).issue).toBe('Article associé introuvable');
  });
  it('par nom, sans casse ni espaces ; deux homonymes : à choisir ; aucun : à associer', () => {
    const stock = [art('a', ' Pilsner Malz'), art('b', 'Munich'), art('c', 'munich ')];
    expect(resolveBudgetStock(demande('pilsner malz'), stock).item?.ref).toBe('a');
    expect(resolveBudgetStock(demande('Munich'), stock).issue).toBe('Plusieurs articles portent ce nom : choisir le bon');
    expect(resolveBudgetStock(demande('Vienna'), stock).issue).toBe('Article à associer ou prix à renseigner');
  });
  it('un tableau modifié sur place (ajout, renommage) est réindexé', () => {
    const stock = [art('a', 'Pilsner')];
    expect(resolveBudgetStock(demande('Vienna'), stock).item).toBeUndefined();
    stock.push(art('v', 'Vienna'));
    expect(resolveBudgetStock(demande('Vienna'), stock).item?.ref).toBe('v');
    stock[0].name = 'Pale Ale';
    expect(resolveBudgetStock(demande('Pale Ale'), stock).item?.ref).toBe('a');
    expect(resolveBudgetStock(demande('Pilsner'), stock).item).toBeUndefined();
  });
});
