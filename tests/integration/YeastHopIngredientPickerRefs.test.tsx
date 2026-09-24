import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { StockItem } from '../../src/types';
import { YeastIngredientPicker } from '../../src/ui/YeastIngredientPicker';
import { HopIngredientPicker } from '../../src/ui/hopIndex/HopIngredientPicker';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getHopKnowledge: vi.fn() } }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({
  useHopCatalogue: () => ({ varieties: [], loading: false, error: '' }),
}));
afterEach(cleanup);

const item = (ref: string, category: 'Levure' | 'Houblon'): StockItem => ({
  id: `doc-${ref}`, ref, name: category === 'Levure' ? 'Levure homonyme' : 'Houblon homonyme',
  category, supplier: `Fournisseur ${ref}`, unit: category === 'Levure' ? 'sachet' : 'g',
  currentStock: 2, minStock: 0, reorder: false,
});

describe('Choix de stock dans la recette', () => {
  it('garde la levure du bon article et n’associe pas un homonyme sans référence', () => {
    const first = item('LOT-1', 'Levure'), second = item('LOT-2', 'Levure');
    const onStock = vi.fn();
    const props = { items: [first, second], onStock, onReference: vi.fn(), onCreate: vi.fn() };
    const view = render(<YeastIngredientPicker {...props} yeast={{ name: second.name, stockItemRef: second.ref }} />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Souche de levure' }));
    const firstOption = screen.getByRole('option', { name: /Levure homonyme.*LOT-1/ });
    const secondOption = screen.getByRole('option', { name: /Levure homonyme.*LOT-2/ });
    expect(firstOption).toHaveTextContent('Fournisseur LOT-1');
    expect(secondOption).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(firstOption);
    expect(onStock).toHaveBeenCalledExactlyOnceWith(first.name, first);

    view.rerender(<YeastIngredientPicker {...props} yeast={{ name: first.name }} />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Souche de levure' }));
    expect(screen.getByRole('option', { name: /Levure homonyme.*LOT-1/ })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: /Levure homonyme.*LOT-2/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('propose une levure réellement disponible en un geste avant la recherche', () => {
    const available = item('LOT-3', 'Levure');
    const onStock = vi.fn();
    render(<YeastIngredientPicker items={[available]} yeast={{ name: '' }} personalChoice
      onStock={onStock} onReference={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choisir Levure homonyme, article LOT-3' }));
    expect(onStock).toHaveBeenCalledExactlyOnceWith(available.name, available);
  });

  it('distingue deux houblons homonymes par leur référence de stock', () => {
    const first = item('HOP-1', 'Houblon'), second = item('HOP-2', 'Houblon');
    const onChange = vi.fn();
    render(<HopIngredientPicker items={[first, second]} onChange={onChange} onReference={vi.fn()} onCreate={vi.fn()}
      placeholder="Ajouter un houblon…" ariaLabel="Ajouter un houblon" />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Ajouter un houblon' }));
    const option = screen.getByRole('option', { name: /Houblon homonyme.*HOP-2/ });
    expect(option).toHaveTextContent('Fournisseur HOP-2');
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(second.name, second);
  });
});
