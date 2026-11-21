// @vitest-environment jsdom
// Tour 2 de ct4b, point 8 (critique k4 : BT-2 / BK3-2, Bord) : l'Agenda disait « 1 à faire » sous « Cette semaine au calendrier · rien de posé »
// alors que la seule ligne, « Marché d'Automne… 10.10.2026 », était passée depuis 41 jours, sans un mot sur son retard.
// Le défaut est antérieur au retrait du Planning (même code sur HEAD^ de 920773e97). Un événement passé et pas fait dit « en retard » (avec sa date,
// jamais un compteur de jours : E08) ; un événement à venir, fait ou sans date ne le dit pas.
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig, CreativeItem } from '../../src/types';
import { DashboardTab } from '../../src/components/tabs/DashboardTab';

let items: CreativeItem[] = [];
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getCreativeItems: () => items, getRecipes: () => [],
    subscribe: () => () => undefined,
    getUiState: (_k: string, fallback: unknown) => fallback, setUiState: vi.fn(), updateCreativeItem: vi.fn(),
  },
}));
vi.mock('../../src/services/financeService', () => ({
  FinanceService: { getProfile: () => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' }), getPayments: () => [], getPlans: () => [], getAssets: () => [] },
}));

const evenement = (id: string, title: string, date: string, status: 'todo' | 'done' = 'todo') =>
  ({ id, type: 'event', title, date, status, createdAt: '2026-10-01T10:00:00.000Z' }) as unknown as CreativeItem;
const mount = () => render(<DashboardTab batches={[]} transactions={[]} stocks={{ rawMaterials: [], cleaning: [] }}
  config={{ fiscal: { isTvaRegistered: false } } as AppConfig} globalTimeFilter="this-month" onOpenBatch={vi.fn()} onNavigateTab={vi.fn()} onNavigateToCreativeLab={vi.fn()} />);

describe('Bord, Agenda : un événement passé et pas fait se dit en retard', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-20T10:00:00')); });
  afterEach(() => { cleanup(); vi.useRealTimers(); items = []; });

  it('« Marché d’Automne » du 10.10.2026, pas fait : la ligne dit « en retard » ; l’événement à venir ne le dit pas', () => {
    items = [evenement('a', 'Marché d’Automne de Villars-sur-Glâne', '2026-10-10'), evenement('b', 'Dégustation de Noël', '2026-12-18')];
    mount();
    const agenda = screen.getByRole('region', { name: 'Agenda' });
    const passe = within(agenda).getByText('Marché d’Automne de Villars-sur-Glâne').closest('label')!;
    expect(within(passe as HTMLElement).getByText(/en retard/)).toBeTruthy();
    const avenir = within(agenda).getByText('Dégustation de Noël').closest('label')!;
    expect(within(avenir as HTMLElement).queryByText(/en retard/)).toBeNull();
  });

  it('un événement passé mais fait n’est pas en retard', () => {
    items = [evenement('a', 'Marché d’Automne', '2026-10-10', 'done')];
    mount();
    expect(within(screen.getByRole('region', { name: 'Agenda' })).queryByText(/en retard/)).toBeNull();
  });
});
