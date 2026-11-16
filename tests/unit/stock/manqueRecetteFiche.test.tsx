/** @vitest-environment jsdom */
// Point 37 (16.11) : la fiche Stock disait « manque 49 kg » de Pilsner Malz pour une recette de 5 kg (stock négatif, ou 44 kg prévus
// ailleurs) ; la recette dit « manque 5 kg » (ab6c4327). Même calcul des deux côtés : rouge sur en-ligne/2026-11-16-finances-rejeu.
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockDetailSheet } from '../../../src/ui/StockDetailSheet';
import { manqueRecette, MOT_STOCK_NEGATIF } from '../../../src/domain/stock/manqueRecette';
import type { StockItem } from '../../../src/types';
import type { RecipeStockComparison } from '../../../src/domain/stockLevel';

const pilsner = (currentStock: number): StockItem => ({ id: 'MALT-1', ref: 'MALT-1', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock, minStock: 0, reorder: false });
const comparaison = (item: StockItem, shortage: number | null, quantity = 5): RecipeStockComparison => ({
  key: 'MALT-1', label: 'Pilsner Malz', ingredientNames: ['Pilsner Malz'], stockItem: item, match: 'linked', quantity, unit: 'kg',
  sourceQuantities: [{ quantity, unit: 'kg' }], physical: Math.max(0, item.currentStock), reserved: 0, available: Math.max(0, item.currentStock), shortage
} as unknown as RecipeStockComparison);

function fiche(item: StockItem, shortage: number | null) {
  render(<StockDetailSheet item={item} stockItems={[item]} batches={[]} movements={[]} onClose={() => {}} onSave={() => {}} onDelete={() => {}}
    onToggleFavorite={() => {}} recipeCheck={{ recipeName: 'ZZ TEST — Pils', comparison: comparaison(item, shortage) }}/>);
  return document.body.textContent ?? '';
}

describe('point 37 — règle', () => {
  it('44 kg prévus ailleurs, stock 0 : manque 5 kg, pas 49', () => expect(manqueRecette(comparaison(pilsner(0), 49))).toEqual({ genre: 'manque', quantite: 5 }));
  it('stock 10, 8 prévus ailleurs : manque 3', () => expect(manqueRecette(comparaison(pilsner(10), 3))).toEqual({ genre: 'manque', quantite: 3 }));
  it('couvert', () => expect(manqueRecette(comparaison(pilsner(10), 0))).toEqual({ genre: 'couvert' }));
  it('stock négatif : jamais un manque gonflé', () => expect(manqueRecette(comparaison(pilsner(-44), 49))).toEqual({ genre: 'stock-negatif' }));
});

describe('point 37 — la fiche Stock dit le même manque que la recette', () => {
  it('stock 0 et 44 kg prévus ailleurs : « manque 5 kg », jamais 49', () => {
    const t = fiche(pilsner(0), 49);
    expect(t).toMatch(/Recette ouverte · ZZ TEST — Pils : besoin 5\s?kg · manque 5\s?kg/);
    expect(t).not.toMatch(/49/);
  });
  it('stock à −44 kg : « stock négatif : à corriger », aucun manque', () => {
    const t = fiche(pilsner(-44), 49);
    expect(t).toContain(MOT_STOCK_NEGATIF);
    expect(t).not.toMatch(/manque 49/i);
    expect(screen.queryByText(/manque 49/i)).toBeNull();
  });
});
