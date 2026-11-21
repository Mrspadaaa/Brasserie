import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig, Batch, StockItem, Transaction } from '../../src/types';
import { DashboardTab } from '../../src/components/tabs/DashboardTab';
import { todayISO } from '../../src/domain/finance/ledger';

/**
 * Critique tour 4, voie F1 (fixtures simulées, aucune donnée réelle).
 * CT4-A-5 : Bord « Charges 725,40 » contre Synthèse « Dépensé 696,80 » (le matériel 28,60 se lit « à part » dans Finances) : le Bord dit pourquoi.
 * CT4-A-6 : Bord › Stocks « Pilsner · Stock 3 / seuil 2 kg · À compléter +3 kg » : l'article est au-dessus du seuil ; le Bord dit que le manque vient d'un brassin prévu.
 */
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getCreativeItems: () => [],
    getRecipes: () => [],
    subscribe: () => () => undefined,
    getUiState: (_k: string, fallback: unknown) => fallback,
    setUiState: vi.fn(),
    updateCreativeItem: vi.fn()
  }
}));
vi.mock('../../src/services/financeService', () => ({
  FinanceService: {
    getProfile: () => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' }),
    getPayments: () => [],
    getPlans: () => [], getAssets: () => [] // K4 : le point le plus bas se lit sur la prévision de Finances
  }
}));

afterEach(cleanup);

const depense = (id: string, description: string, category: string, cents: number): Transaction => ({
  id, description, date: todayISO(), category, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, paymentStatus: 'paid', paidDate: todayISO(), lines: [{ id: 'l', kind: 'ingredient', description, amountCents: cents }] }
}) as Transaction;

const monter = (over: Partial<React.ComponentProps<typeof DashboardTab>> = {}) => render(<DashboardTab
  batches={[]} transactions={[]} stocks={{ rawMaterials: [], cleaning: [] }} config={{ fiscal: { isTvaRegistered: false } } as AppConfig}
  globalTimeFilter="this-month" onOpenBatch={vi.fn()} onNavigateTab={vi.fn()} onNavigateToCreativeLab={vi.fn()} {...over} />);

describe('CT4-A-5 : le Bord dit pourquoi ses Charges dépassent le « Dépensé » de la Synthèse', () => {
  it('« dont matériel 28,60 » (à part dans Finances) sous les Charges, quand la période a du matériel', () => {
    monter({ transactions: [depense('T1', 'Loyer de l’atelier', 'chargesFixes', 46800), depense('T2', 'Malt et houblons', 'brassage', 18680), depense('T3', 'Nettoyant', 'nettoyage', 4200), depense('M1', 'Joints de la cuve', 'materiel', 2860)] });
    const finances = screen.getByRole('region', { name: 'Finances' });
    expect(within(finances).getAllByText(/725,40/).length).toBeGreaterThan(0);
    expect(finances).toHaveTextContent(/dont matériel 28,60/);
  });
  it('sans matériel dans la période : rien de plus', () => {
    monter({ transactions: [depense('T1', 'Loyer de l’atelier', 'chargesFixes', 46800)] });
    expect(screen.getByRole('region', { name: 'Finances' })).not.toHaveTextContent(/dont matériel/);
  });
});

describe('CT4-A-6 : un article au-dessus de son seuil, à compléter pour un brassin prévu, le dit', () => {
  const pilsner: StockItem = { id: 'PIL', ref: 'PIL', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 3, minStock: 2, reorder: false } as StockItem;
  const brassin = { id: 'B1', name: 'Saison de ferme', style: 'Saison', volumeL: 20, brewDate: '', plannedBrewDate: '2026-11-10', status: 'planifie', stockAccountingVersion: 1,
    recipeSnapshot: { name: 'Saison de ferme', style: 'Saison', volumeL: 20, capturedAt: '2026-11-01T10:00:00.000Z',
      fermentables: [{ name: 'Pilsner', stockItemRef: 'PIL', weightKg: 6, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '' } } } as unknown as Batch;
  it('« manque 3 kg pour Saison de ferme prévu le 10.11 », à côté de « Stock 3 / seuil 2 kg »', () => {
    monter({ batches: [brassin], stocks: { rawMaterials: [pilsner], cleaning: [] } });
    const ligne = screen.getByRole('button', { name: /Pilsner/ });
    expect(ligne).toHaveTextContent('Stock 3 / seuil 2 kg');
    expect(ligne).toHaveTextContent('À compléter');
    expect(ligne).toHaveTextContent(/manque 3 kg pour Saison de ferme prévu le 10\.11/);
  });
  it('sous le seuil sans brassin prévu : le seuil explique, rien de plus', () => {
    monter({ stocks: { rawMaterials: [{ ...pilsner, currentStock: 1 }], cleaning: [] } });
    expect(screen.getByRole('button', { name: /Pilsner/ })).not.toHaveTextContent(/pour /);
  });
});
