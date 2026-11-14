// Voie vd, points 7 et 8 (verdict bdd71433 n° 7 et 8) : Recompter, bouton ⇅ de la maquette q-a3s (nom A → Z / Z → A, épuisés en fin de rayon)
// et en-tête de rayon en saisie sans repères ni date (« 0/8 comptés » tient sur une ligne).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const art = (ref: string, name: string, quantity: number): StockItem =>
  ({ id: ref, ref, name, currentStock: quantity, minStock: 1, unit: 'kg', category: 'Malt', reorder: false, kind: 'rawMaterials', ebc: 5 } as StockItem);
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 4000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={[]} onOpenQuickAction={() => {}}/>
  </VirtuosoMockContext.Provider>;
}
beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  StorageService.setUiState('stock_vue', 'recompter');
  seedQa({ stockItems: [art('a', 'Acide malt', 5), art('b', 'Biscuit', 5), art('c', 'Caramel', 5), art('z', 'Zéro épuisé', 0)] });
});
afterEach(cleanup);

const noms = (c: HTMLElement) => [...c.querySelectorAll('.sz-r-ray .sz-r-row .sz-r-nm b')].map((e) => e.textContent);

describe('Recompter : ordre du nom', () => {
  it('⇅ inverse A → Z en Z → A, les épuisés restent en fin de rayon, et revient', async () => {
    const { container } = render(<Catalogue/>);
    await screen.findByTestId('recompter');
    expect(noms(container)).toEqual(['Acide malt', 'Biscuit', 'Caramel', 'Zéro épuisé']);
    expect(container.querySelector('.sz-r-so')).toHaveTextContent('nom, A → Z');
    fireEvent.click(screen.getByRole('button', { name: "Inverser l'ordre : nom Z → A" }));
    expect(noms(container)).toEqual(['Caramel', 'Biscuit', 'Acide malt', 'Zéro épuisé']);
    expect(container.querySelector('.sz-r-so')).toHaveTextContent('nom, Z → A');
    fireEvent.click(screen.getByRole('button', { name: "Inverser l'ordre : nom A → Z" }));
    expect(noms(container)).toEqual(['Acide malt', 'Biscuit', 'Caramel', 'Zéro épuisé']);
  });

  it('en saisie, l\'en-tête du rayon n\'a ni repères ni date : « n/N comptés » seul', async () => {
    const { container } = render(<Catalogue/>);
    const rayon = (await screen.findByTestId('recompter')).querySelector('.sz-r-ray') as HTMLElement;
    expect(rayon.querySelector('.sz-r-tk')).not.toBeNull();
    fireEvent.click(within(rayon).getByRole('button', { name: /Compter/ }));
    expect(container.querySelector('.sz-r-ray .sz-r-tk')).toBeNull();
    expect(container.querySelector('.sz-r-ray .sz-r-mt')?.textContent).toMatch(/^\d+\/\d+ comptés$/);
  });
});
