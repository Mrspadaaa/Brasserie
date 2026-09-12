import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig, Batch, CreativeItem, StockItem } from '../../src/types';
import { DashboardTab } from '../../src/components/tabs/DashboardTab';
import { StorageService } from '../../src/services/storage';

const data = vi.hoisted(() => ({
  events: [] as CreativeItem[],
  listeners: new Set<() => void>(),
  saved: {} as Record<string, unknown>
}));
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getCreativeItems: () => data.events,
    subscribe: (callback: () => void) => {
      data.listeners.add(callback);
      return () => data.listeners.delete(callback);
    },
    getUiState: (key: string, fallback: unknown) => data.saved[key] ?? fallback,
    setUiState: vi.fn((key: string, value: unknown) => { data.saved[key] = value; }),
    updateCreativeItem: vi.fn((item: CreativeItem) => {
      data.events = data.events.map(current => current.id === item.id ? item : current);
      data.listeners.forEach(callback => callback());
    })
  }
}));
vi.mock('../../src/services/financeService', () => ({
  FinanceService: {
    getProfile: () => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' }),
    getPayments: () => []
  }
}));

const porter: Batch = {
  id: 'OLD-PORTER', name: 'Ancienne Porter', status: 'fermentation', style: 'Porter',
  volumeL: 30, brewDate: '2026-08-20', og: '1.062',
  gravityLog: [{ date: '2026-09-10', sg: 1.024 }, { date: '2026-09-01', sg: 1.030 }]
};
const stock = (id: string, name: string, currentStock: number, minStock: number): StockItem => ({
  id, ref: id, name, currentStock, minStock, unit: 'L', category: 'Nettoyage', reorder: true
});
function mount(overrides: Partial<React.ComponentProps<typeof DashboardTab>> = {}) {
  const props: React.ComponentProps<typeof DashboardTab> = {
    batches: [porter], transactions: [], stocks: { rawMaterials: [], cleaning: [] },
    planning: [], config: { fiscal: { isTvaRegistered: false } } as AppConfig,
    globalTimeFilter: 'this-month', onOpenBatch: vi.fn(), onNavigateTab: vi.fn(),
    onNavigateToCreativeLab: vi.fn(), onOpenCreateBatch: vi.fn(), onOpenQuickAction: vi.fn(),
    ...overrides
  };
  return { ...render(<DashboardTab {...props} />), props };
}

beforeEach(() => {
  data.events = [];
  data.saved = {};
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('dashboard daily overview', () => {
  it('shows the saved phase and latest real gravity, including older active batches', () => {
    const { props } = mount({ batches: [porter, { ...porter, id: 'COLD', name: 'Saison en garde', status: 'garde' }] });
    const row = screen.getByRole('button', { name: /Ancienne Porter/ });
    expect(within(row).getByText('Fermentation')).toBeVisible();
    expect(within(row).getByText('SG 1,024')).toBeVisible();
    expect(screen.getByText('Garde froide')).toBeVisible();
    expect(screen.queryByText(/Prêt|21 jours|FG Actuelle/)).not.toBeInTheDocument();
    fireEvent.click(row);
    expect(props.onOpenBatch).toHaveBeenCalledWith('OLD-PORTER');
    expect(props.onNavigateTab).not.toHaveBeenCalled();
  });

  it('keeps missing observations unknown and archived batches out of the overview', () => {
    mount({ batches: [
      { ...porter, id: 'NONE', name: 'Sans relevé', og: undefined, gravityLog: [] },
      { ...porter, id: 'ARCHIVE', name: 'Archivé', archivedAt: '2026-09-01' }
    ] });
    expect(screen.getByText('SG non relevée')).toBeVisible();
    expect(screen.queryByText('Archivé')).not.toBeInTheDocument();
  });

  it('reveals other active batches in place without losing them to the period filter', () => {
    const batches = Array.from({ length: 6 }, (_, index) => ({
      ...porter, id: String(index), name: `Brassin ${index + 1}`
    }));
    mount({ batches });
    expect(screen.queryByRole('button', { name: /Brassin 6/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir les 2 autres en cuve' }));
    expect(screen.getByRole('button', { name: /Brassin 6/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Réduire la liste' }));
    expect(screen.queryByRole('button', { name: /Brassin 6/ })).not.toBeInTheDocument();
  });

  it('copies measured shortages, waits for success and permits retry after refusal', async () => {
    let finishCopy: () => void = () => {};
    const writeText = vi.fn()
      .mockImplementationOnce(() => new Promise<void>(resolve => { finishCopy = resolve; }))
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    mount({ stocks: { rawMaterials: [], cleaning: [
      stock('CIP', 'Nettoyant', 0.2, 1), stock('EQUAL', 'Au seuil', 1, 1)
    ] } });
    expect(screen.getByText('+0,8 L')).toBeVisible();
    expect(screen.getByText('Seuil atteint')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Copier la liste' }));
    expect(screen.getByRole('button', { name: 'Copie…' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(writeText.mock.calls[0][0]).toContain('Nettoyant : manque 0,8 L');
    expect(writeText.mock.calls[0][0]).toContain('Au seuil : seuil atteint, quantité à définir');
    expect(writeText.mock.calls[0][0]).not.toContain('Brau-Rauchshop');
    await act(async () => { finishCopy(); });
    expect(screen.getByRole('status')).toHaveTextContent('Liste copiée');
    fireEvent.click(screen.getByRole('button', { name: 'Liste copiée' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Copie impossible');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la copie' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Liste copiée');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('orders pending events by date and saves reversible checkbox actions', () => {
    data.events = [
      { id: 'LATER', type: 'event', title: 'Marché', date: '2026-09-20', status: 'todo' },
      { id: 'NOW', type: 'event', title: 'Nettoyer', date: '2026-09-12', status: 'todo' },
      { id: 'DONE', type: 'event', title: 'Commander', date: '2026-09-10', status: 'done' }
    ];
    mount();
    const agenda = screen.getByRole('region', { name: 'Agenda' });
    expect(within(agenda).getAllByRole('checkbox').map(input => input.parentElement?.textContent))
      .toEqual([expect.stringContaining('Nettoyer'), expect.stringContaining('Marché'), expect.stringContaining('Commander')]);
    fireEvent.click(within(agenda).getByRole('checkbox', { name: /Nettoyer/ }));
    expect(StorageService.updateCreativeItem).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'NOW', status: 'done' }));
    expect(within(agenda).getByRole('checkbox', { name: /Nettoyer/ })).toBeChecked();
    fireEvent.click(within(agenda).getByRole('checkbox', { name: /Nettoyer/ }));
    expect(StorageService.updateCreativeItem).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'NOW', status: 'todo' }));
  });

  it('starts administrative follow-up unconfirmed, preserves choices and lets them be undone', () => {
    const { unmount } = mount();
    fireEvent.click(screen.getByText('Échéances et démarches'));
    const hygiene = screen.getByRole('checkbox', { name: /Autocontrôle/ });
    expect(hygiene).not.toBeChecked();
    fireEvent.click(hygiene);
    expect(data.saved.dashboard_completed_deadlines).toEqual({ saav: true });
    unmount();
    mount();
    fireEvent.click(screen.getByText('Échéances et démarches'));
    expect(screen.getByRole('checkbox', { name: /Autocontrôle/ })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /Autocontrôle/ }));
    expect(data.saved.dashboard_completed_deadlines).toEqual({ saav: false });
  });

  it('keeps useful empty states and primary/quick actions available', () => {
    const { props } = mount({ batches: [] });
    expect(screen.getByText('Aucun brassin en cuve.')).toBeVisible();
    expect(screen.getByText('Stocks suffisants')).toBeVisible();
    expect(screen.getByText('Aucune tâche prévue.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Brassin', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Saisie rapide' }));
    expect(props.onOpenCreateBatch).toHaveBeenCalledOnce();
    expect(props.onOpenQuickAction).toHaveBeenCalledOnce();
  });
});
