// @vitest-environment jsdom
// Décision du brasseur du 20.11 (SPEC-BRASSEUR, l. 2330) : BT-2 — « le Calendrier fait ce travail… tu peux le supprimer ».
// Le Planning (GanttTask) quitte le code : type, prop de DashboardTab, état de App, lecture et écriture du stockage, exemples.
// Test écrit avant le retrait (L13) : sur le code d'avant, DashboardTab exige `planning` et StorageService lit encore la collection.
import React from 'react';
import { existsSync, readFileSync } from 'node:fs';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../../src/types';
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

const mount = (extra: Record<string, unknown> = {}) => render(<DashboardTab batches={[]} transactions={[]} stocks={{ rawMaterials: [], cleaning: [] }}
  config={{ fiscal: { isTvaRegistered: false } } as AppConfig} globalTimeFilter="this-month" onOpenBatch={vi.fn()} onNavigateTab={vi.fn()} onNavigateToCreativeLab={vi.fn()} {...extra} />);
// src/data/seedData.ts est ignoré par git (données réelles) : absent d'une copie propre du dépôt, il n'y a alors rien à lire ; seedData.example.ts est versionné et reste contrôlé.
const source = (f: string) => (f === 'src/data/seedData.ts' && !existsSync(f) ? '' : readFileSync(f, 'utf8'));

describe('BT-2 (décision 20.11) : plus de Planning dans le code', () => {
  afterEach(cleanup);
  it('le Bord se monte sans Planning : l’Agenda dit « Aucune tâche prévue. »', () => {
    mount();
    const agenda = screen.getByRole('region', { name: 'Agenda' });
    expect(within(agenda).getByText('Aucune tâche prévue.')).toBeVisible();
    expect(within(agenda).queryByTestId('bord-planning')).toBeNull();
  });
  it('une ancienne donnée `planning` transmise est ignorée, sans erreur', () => {
    mount({ planning: [{ id: 'a', category: 'Brassage', description: 'Commander les sacs de malt', cost: 0, startDate: '2026-12-01', endDate: '2026-12-03', isMilestone: false }] });
    const agenda = screen.getByRole('region', { name: 'Agenda' });
    expect(within(agenda).queryByText('Commander les sacs de malt')).toBeNull();
    expect(within(agenda).getByText('Aucune tâche prévue.')).toBeVisible();
  });
  it('plus de type, d’état, de lecture ni d’écriture du Planning dans les sources', () => {
    const fichiers = ['src/types/index.ts', 'src/App.tsx', 'src/components/tabs/DashboardTab.tsx', 'src/services/storage.ts', 'src/services/migration.ts', 'src/data/seedData.ts', 'src/data/seedData.example.ts'];
    for (const f of fichiers) expect(source(f), f).not.toMatch(/GanttTask|getPlanning|savePlanning|updatePlanningTask|deletePlanningTask|setPlanning|initialPlanning/);
  });
});
