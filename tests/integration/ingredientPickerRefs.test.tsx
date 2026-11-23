import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IngredientPicker } from '../../src/ui/IngredientPicker';
import type { StockItem } from '../../src/types';

afterEach(cleanup);

const stock = (id: string, ref: string, supplier: string): StockItem => ({
  id, ref, supplier, name: 'Pale Ale', category: 'Malt', unit: 'kg',
  currentStock: 5, minStock: 0, reorder: false,
});

describe('Sélection d’un ingrédient de stock homonyme', () => {
  it('retourne la référence réellement choisie et la montre dans chaque option', () => {
    const first = stock('doc-1', 'LOT-2025', 'Malterie A');
    const second = stock('doc-2', 'LOT-2026', 'Malterie B');
    const onChange = vi.fn();
    render(<IngredientPicker categories={['Malt']} items={[first, second]} value="" onChange={onChange} onCreate={vi.fn()} ariaLabel="Ajouter un malt" />);
    const picker = screen.getByRole('combobox', { name: 'Ajouter un malt' });
    fireEvent.focus(picker);
    const options = screen.getAllByRole('option', { name: /Pale Ale/ });
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('LOT-2025');
    expect(options[1]).toHaveTextContent('LOT-2026');
    fireEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('Pale Ale', second);
  });
});
