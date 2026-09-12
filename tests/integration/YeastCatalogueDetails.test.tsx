import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { YeastCatalogueDetails, YeastCataloguePanel } from '../../src/ui/YeastCataloguePanel';

const state = vi.hoisted(() => ({ rows: [] as unknown[] }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => state.rows }));
afterEach(cleanup);
const strain = (id: string) => catalogue.find(row => row.id === id) as HopYeast;
describe('catalogue enrichi de levures', () => {
  it('signals the LA-01 values to compare while keeping the detailed observations collapsed', () => {
    render(<YeastCatalogueDetails yeast={strain('yeast-fermentis-safbrew-la-01')} />);
    expect(screen.getByText(/Atténuation : plusieurs valeurs publiées/)).toBeVisible();
    const disclosure = screen.getByText(/Caractéristiques et consignes/).closest('details')!;
    expect(disclosure.open).toBe(false);
    expect(disclosure).toHaveTextContent('13–17 %');
    expect(disclosure).toHaveTextContent('15%');
    expect(disclosure).toHaveTextContent('15 °P');
    expect(screen.getByText('Sources et mises à jour').closest('details')!.open).toBe(false);
  });
  it('lets the brewer select the documented liquid culture without opening every technical observation', () => {
    const cali = strain('yeast-escarpment-4559492808836'), selected = vi.fn();
    state.rows = [cali];
    render(<YeastCataloguePanel onSelect={selected} />);
    fireEvent.click(screen.getByRole('button', { name: /Escarpment Labs · Cali Ale/ }));
    expect(screen.getByLabelText('Forme utilisée dans la recette')).toHaveValue('liquide');
    expect(screen.getByText(/Caractéristiques et consignes/).closest('details')!.open).toBe(false);
    const choose = screen.getByRole('button', { name: 'Choisir cette culture' });
    expect(choose).toBeVisible(); fireEvent.click(choose);
    expect(selected).toHaveBeenCalledWith(cali, 'liquide');
  });
});
