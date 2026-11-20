// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig, StockItem } from '../../src/types';
import { DashboardTab } from '../../src/components/tabs/DashboardTab';
import { levuresADateProche } from '../../src/domain/stock/durabilite';

vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getCreativeItems: () => [], getRecipes: () => [],
    subscribe: () => () => undefined,
    getUiState: (_k: string, fallback: unknown) => fallback, setUiState: vi.fn(), updateCreativeItem: vi.fn(),
  },
}));
vi.mock('../../src/services/financeService', () => ({
  FinanceService: { getProfile: () => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' }), getPayments: () => [] },
}));

// AM-56 (08.11) : un sachet de levure périmé était brassé sans alerte. Le champ DDM et « Périmé depuis N j » existent dans le Stock (8c1490eb2) ;
// ce qui manquait : au Bord, là où le brasseur regarde avant de brasser, rien ne signalait une levure périmée ou sur le point de l'être.
const J = '2026-11-20';
const levure = (o: Partial<StockItem> & { expiresOn?: string }): StockItem => {
  const { expiresOn, ...reste } = o;
  return { id: 'L1', ref: 'L1', name: 'Safale US-05', category: 'Levure', unit: 'sachet', currentStock: 2, reorder: false,
    ...(expiresOn ? { yeastLot: { expiresOn } as never } : {}), ...reste };
};

describe('AM-56 : levures à date de durabilité dépassée ou proche', () => {
  it('range les périmées d\'abord, puis les proches, selon la date ; l\'inconnu et l\'épuisé n\'y sont pas', () => {
    const r = levuresADateProche([
      levure({ ref: 'a', id: 'a', name: 'Proche', expiresOn: '2026-11-30' }),
      levure({ ref: 'b', id: 'b', name: 'Périmée', expiresOn: '2026-11-10' }),
      levure({ ref: 'c', id: 'c', name: 'Sans date' }),
      levure({ ref: 'd', id: 'd', name: 'Épuisée', expiresOn: '2026-01-01', currentStock: 0 }),
      levure({ ref: 'e', id: 'e', name: 'Valide', expiresOn: '2027-05-30' }),
      { ...levure({ ref: 'f', id: 'f', name: 'Houblon', expiresOn: '2026-01-01' }), category: 'Houblon' },
    ], J);
    expect(r.map(x => [x.item.name, x.statut, x.texte])).toEqual([
      ['Périmée', 'perime', 'Périmé depuis 10 j'],
      ['Proche', 'bientot', 'Périme dans 10 j'],
    ]);
  });
});

describe('AM-56 : le Bord signale la levure périmée', () => {
  afterEach(cleanup);
  const mount = (rawMaterials: StockItem[], onNavigateTab = vi.fn()) => render(<DashboardTab batches={[]} transactions={[]}
    stocks={{ rawMaterials, cleaning: [] }} config={{ fiscal: { isTvaRegistered: false } } as AppConfig} globalTimeFilter="this-month"
    onOpenBatch={vi.fn()} onNavigateTab={onNavigateTab} onNavigateToCreativeLab={vi.fn()} />);

  it('une levure périmée en stock : alerte avec son nom, sa date, et un toucher qui ouvre Stocks', () => {
    const onNavigateTab = vi.fn();
    mount([levure({ expiresOn: '2020-01-31' })], onNavigateTab);
    const rangee = screen.getByRole('button', { name: /Safale US-05.*périmé/i });
    expect(within(rangee).getByText(/Périmé depuis \d+ j/)).toBeVisible();
    fireEvent.click(rangee);
    expect(onNavigateTab).toHaveBeenCalledWith('stocks');
  });
  it('sans date de durabilité ou valide : rien de plus à dire', () => {
    mount([levure({}), levure({ ref: 'v', id: 'v', expiresOn: '2099-01-01' })]);
    expect(screen.queryByText(/Périmé depuis/)).toBeNull();
    expect(screen.queryByText(/Périme dans/)).toBeNull();
  });
});
