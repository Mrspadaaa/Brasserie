// Mission levure-port, voie b-stock (09.11) : BR-75 / BE-95 — l'écran s'appelle « Stocks », son premier sous-onglet « Articles ».
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { seedQa } from '../qa/hop-recipe/repo';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));
beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); seedQa({ stockItems: [] }); });
afterEach(cleanup);

describe('BR-75, BE-95 — un seul nom par écran', () => {
  it('le premier sous-onglet de Stocks est « Articles », plus « Stock »', () => {
    render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}><StocksTab stocks={StorageService.getStocks()} batches={[]} onOpenQuickAction={() => {}} /></VirtuosoMockContext.Provider>);
    const navigation = screen.getAllByText('Articles');
    expect(navigation.length).toBeGreaterThan(0);
    expect(screen.queryByText('Stock', { exact: true })).toBeNull();
  });
});
