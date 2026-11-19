// @vitest-environment jsdom
// BR-75 / BE-95 : un seul nom pour l'écran. L'onglet du bas dit « Stocks » ; le sous-onglet des articles ne dit plus « Stock »
// (renommé « Articles », be70fa7c3) ; aucun titre ni onglet de l'écran ne dit « Stock » seul.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const art = (ref: string, name: string, stock: number): StockItem =>
  ({ id: ref, ref, name, currentStock: stock, minStock: 1, unit: 'kg', category: 'Malt', reorder: false, kind: 'rawMaterials' } as StockItem);
const lire = () => StorageService.getStocks();
function Ecran() {
  const stocks = useStorageValue(lire);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 2000, itemHeight: 54 }}><StocksTab stocks={stocks} batches={[]} /></VirtuosoMockContext.Provider>;
}
beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
afterEach(cleanup);

describe('BR-75 : un seul nom pour l’écran', () => {
  it('aucun onglet, bouton ni titre de l’écran ne s’appelle « Stock » seul', async () => {
    seedQa({ stockItems: [art('pale', 'Pale Ale', 20)] });
    const { container } = render(<Ecran />);
    await screen.findByRole('searchbox', { name: 'Rechercher dans le stock' });
    const noms = [...container.querySelectorAll('[role="tab"], button, h1, h2, h3, [role="heading"]')]
      .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' '));
    expect(noms.filter((n) => /^Stock$/i.test(n))).toEqual([]);
    expect(screen.getByRole('button', { name: /Articles/ })).toBeTruthy();
  });
});
