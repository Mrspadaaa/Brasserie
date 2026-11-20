// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig, GanttTask } from '../../src/types';
import { DashboardTab } from '../../src/components/tabs/DashboardTab';

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

// BT-2 (08.11) : aucun écran n'affichait le Planning ; `DashboardTab` recevait `planning` sans le rendre. Lecture étroite : les tâches du Planning
// non faites se lisent au Bord, dans l'Agenda, en lecture seule (le Planning n'a aucun écran de saisie : rien à cocher ici).
const tache = (o: Partial<GanttTask>): GanttTask => ({ id: 't', category: 'Brassage', description: 'Commander les sacs de malt', cost: 0, startDate: '2026-12-01', endDate: '2026-12-03', isMilestone: false, ...o });
const mount = (planning: GanttTask[]) => render(<DashboardTab batches={[]} transactions={[]} stocks={{ rawMaterials: [], cleaning: [] }} planning={planning}
  config={{ fiscal: { isTvaRegistered: false } } as AppConfig} globalTimeFilter="this-month" onOpenBatch={vi.fn()} onNavigateTab={vi.fn()} onNavigateToCreativeLab={vi.fn()} />);

describe('BT-2 : le Planning s\'affiche au Bord', () => {
  afterEach(cleanup);
  it('les tâches non faites du Planning figurent dans l\'Agenda, la plus proche d\'abord, avec leur date', () => {
    mount([tache({ id: 'b', description: 'Nettoyer la cuve', startDate: '2026-12-10', endDate: '2026-12-10' }), tache({ id: 'a' }), tache({ id: 'c', description: 'Déjà faite', completed: true })]);
    const agenda = screen.getByRole('region', { name: 'Agenda' });
    const lignes = within(agenda).getAllByTestId('bord-planning').map(l => l.textContent ?? '');
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toMatch(/Commander les sacs de malt/);
    expect(lignes[0]).toMatch(/1\.12\.2026/);
    expect(lignes[1]).toMatch(/Nettoyer la cuve/);
    expect(within(agenda).queryByText('Déjà faite')).toBeNull();
    expect(within(agenda).queryByText('Aucune tâche prévue.')).toBeNull();
  });
  it('un Planning vide ne change rien : l\'Agenda dit toujours « Aucune tâche prévue. »', () => {
    mount([]);
    expect(screen.getByText('Aucune tâche prévue.')).toBeVisible();
    expect(screen.queryByTestId('bord-planning')).toBeNull();
  });
});
