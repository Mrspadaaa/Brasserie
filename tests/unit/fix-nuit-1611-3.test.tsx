// @vitest-environment jsdom
// Nuit 16.11, constat 3 : la feuille d'un brassin planifié changeait de hauteur entre Préparer, Carnet et Dossier (les onglets bougeaient).
// jsdom ne mesure pas : on vérifie que la feuille porte la MÊME hauteur fixe sur les trois onglets (la hauteur réelle se prouve en capture).
// Fixture FICTIVE (préfixe ZZ).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const PLANIFIE = { id: 'ZZ-100', name: 'ZZ Blonde de soif', style: 'Blonde', volumeL: 24, brewDate: '', plannedBrewDate: '30.11.2026', status: 'planifie', stockAccountingVersion: 1, gravityLog: [] } as unknown as Batch;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 16, 9));
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([PLANIFIE]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('constat 3 : la feuille garde sa hauteur d\'un onglet à l\'autre', () => {
  it('Préparer, Carnet et Dossier : même classe de hauteur fixe sur le dialogue', () => {
    render(<BatchDetailSheet batch={PLANIFIE} initialSection="measurements" onClose={vi.fn()} />);
    const hauteurs: string[] = [];
    for (const onglet of ['Préparer', 'Carnet', 'Dossier']) {
      fireEvent.click(screen.getByRole('button', { name: onglet }));
      const classes = (screen.getByRole('dialog').className.match(/(?:^|\s)h-\[[^\]]+\]/g) ?? []).join('').trim();
      hauteurs.push(classes);
    }
    expect(hauteurs).toEqual(['h-[88dvh]', 'h-[88dvh]', 'h-[88dvh]']);
  });
});
