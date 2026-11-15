/** @vitest-environment jsdom */
// Voie p1g (12.11) : « Maximum update depth exceeded » sur l'onglet Stocks quand on le rouvre (sous-onglet Articles mémorisé).
// Cause : `useStorageValue(() => StorageService.getStockMovements())` écrit dans le rendu — `read` change à chaque rendu, donc l'effet
// se rejoue, et `FirestoreRepo.all('movements')` rend un tableau NEUF tant que la collection est absente : setState, rendu, effet, à l'infini.
// Le dépôt simulé de QA mémoïse la collection vide et masquerait la boucle : on rejoue ici le comportement réel (`cache[name] ?? []`).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', async () => {
  const qa = await import('../qa/hop-recipe/repo');
  // Comme le vrai `all` : une collection absente rend un tableau neuf à chaque lecture.
  return { ...qa, FirestoreRepo: { ...qa.FirestoreRepo, all: (name: string) => name === 'movements' ? [] : qa.FirestoreRepo.all(name) } };
});
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const item = (ref: string, name: string, quantity: number): StockItem => ({ id: ref, ref, name, currentStock: quantity, minStock: 5, unit: 'kg', category: 'Malt', reorder: false });
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={[]}/>
  </VirtuosoMockContext.Provider>;
}

beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [item('pale', 'Malt Pale Ale', 18), item('pils', 'Malt Pilsner', 2)].map(row => ({ ...row, kind: 'rawMaterials' })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('onglet Stocks rouvert sur Articles, sans mouvement enregistré', () => {
  it('ne boucle pas : aucun « Maximum update depth exceeded »', async () => {
    StorageService.setUiState('stocks_subtab', 'stock');
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Catalogue/>);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeInTheDocument();
    const boucle = erreurs.mock.calls.filter(appel => /Maximum update depth/.test(appel.map(String).join(' ')));
    expect(boucle).toHaveLength(0);
  });
});
