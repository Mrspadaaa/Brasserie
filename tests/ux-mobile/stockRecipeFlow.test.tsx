import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { Batch, Recipe, StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const items: StockItem[] = [
  { id: 'malt', ref: 'malt', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false },
  { id: 'yeast', ref: 'yeast', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 1, minStock: 0, reorder: false }
];

const recipe: Recipe = {
  id: 'recipe-stock-flow',
  name: 'Ale témoin',
  style: 'Pale Ale',
  volumeL: 20,
  fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'malt', weightKg: 6, kind: 'grain', use: 'empatage' }],
  hops: [],
  yeast: { name: 'SafAle US-05', stockItemRef: 'yeast', qty: 11, unit: 'g' },
  steps: [],
  notes: []
} as Recipe;

const batch: Batch = {
  id: 'batch-stock-flow',
  name: 'Ale en fermentation',
  style: 'Pale Ale',
  volumeL: 20,
  brewDate: '24.09.2026',
  status: 'fermentation',
  stockConsumption: {
    appliedAt: '2026-09-24T10:00:00.000Z',
    eventId: 'BREW-STOCK-FLOW',
    completedStages: ['brewday'],
    items: [{ stockItemRef: 'malt', quantity: 2000, unit: 'g' }],
    pendingItems: [{ stockItemRef: 'malt', quantity: 1000, unit: 'g' }]
  }
} as Batch;

const readStocks = () => StorageService.getStocks();
const readBatches = () => StorageService.getBatches();

function Catalogue() {
  const stocks = useStorageValue(readStocks);
  const batches = useStorageValue(readBatches);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={batches} />
  </VirtuosoMockContext.Provider>;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  StorageService.clearMemoryCache();
  seedQa({
    recipes: [recipe],
    batches: [batch],
    stockItems: items.map(item => ({ ...item, kind: 'rawMaterials' }))
  });
});

afterEach(() => {
  cleanup();
  StorageService.clearMemoryCache();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('parcours recette et article dans Stocks', () => {
  it('sélectionne une recette, garde les unités inconnues et permet de revenir corriger le stock', async () => {
    const view = render(<Catalogue />);
    fireEvent.click(screen.getByText('Comparer une recette'));

    const recipePicker = screen.getByRole('combobox', { name: 'Recette à comparer' });
    fireEvent.click(recipePicker);
    fireEvent.click(await screen.findByRole('option', { name: /Ale témoin/ }));

    expect(screen.getAllByText('Besoin prévu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manque').length).toBeGreaterThan(0);
    expect(screen.getByText('2 kg')).toBeInTheDocument();
    expect(screen.getByText('Unité incompatible : g vers sachet.')).toBeInTheDocument();
    expect(screen.getByText(/commandes entrantes non suivies/i)).toBeInTheDocument();
    expect(screen.getByText('Physique · 5 kg')).toBeInTheDocument();
    expect(screen.getAllByText('Libre', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getByText('4 kg')).toBeInTheDocument();

    const linkedArticle = screen.getAllByRole('button', { name: 'Ouvrir Pilsner Malz' })[0];
    fireEvent.click(linkedArticle);
    expect(await screen.findByText('Besoin prévu · Ale témoin')).toBeInTheDocument();
    expect(screen.getAllByText('Libre').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer', exact: true }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir Pilsner Malz' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Corriger l’inventaire', exact: true }));

    const counted = await screen.findByRole('textbox', { name: 'Stock réellement compté (kg)' });
    fireEvent.click(screen.getByRole('button', { name: 'Retirer 1 kg' }));
    expect(counted).toHaveValue('4');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’écart' }));

    await waitFor(() => {
      expect(StorageService.getStocks().rawMaterials.find(item => item.ref === 'malt')?.currentStock).toBe(4);
      expect(screen.getAllByText('3 kg').length).toBeGreaterThanOrEqual(2);
    });
    expect(StorageService.getRecipes()[0].fermentables[0].weightKg).toBe(6);
    expect(StorageService.getBatches()[0].stockConsumption?.items).toEqual([{ stockItemRef: 'malt', quantity: 2000, unit: 'g' }]);

    view.unmount();
    render(<Catalogue />);
    fireEvent.click(screen.getByText('Comparer une recette'));
    fireEvent.click(screen.getByRole('combobox', { name: 'Recette à comparer' }));
    fireEvent.click(await screen.findByRole('option', { name: /Ale témoin/ }));
    expect(await screen.findByText('Physique · 4 kg')).toBeInTheDocument();
    expect(screen.getAllByText('Manque').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3 kg').length).toBeGreaterThanOrEqual(2);
  });
});
