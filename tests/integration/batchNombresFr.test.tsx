import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BatchCard } from '../../src/ui/production/CatalogCards';
import { batchEntries } from '../../src/domain/productionCatalog';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'IPA', style: 'IPA', volumeL: 30, brewDate: '01.09.2026', status: 'fermentation', stockAccountingVersion: 1, ...over });
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const open = (b: Batch) => render(<BatchDetailSheet batch={b} initialSection="measurements" onClose={vi.fn()} />);
const typeBlur = (el: HTMLElement, value: string) => { fireEvent.change(el, { target: { value } }); fireEvent.blur(el); };

describe('Brassins › carte : la densité cible a trois décimales (RJ-5)', () => {
  it('« OG cible 1,08048 » s’écrit 1,080', () => {
    const batch: Batch = { ...yeastFlowRecipe(), id: 'og-cible', status: 'planifie', brewDate: '12.09.2026',
      recipeSnapshot: { ...yeastFlowRecipe(), capturedAt: '2026-09-12', ogTarget: 1.08048, fgTarget: 1.0102 } };
    const props = { onOpen: vi.fn(), onBrew: vi.fn(), onFavorite: vi.fn(), onArchive: vi.fn() };
    render(<BatchCard entry={batchEntries([batch])[0]} {...props} />);
    expect(within(screen.getByText('OG cible').parentElement!).getByText('1,080')).toBeVisible();
    expect(document.body.textContent).not.toContain('1,08048');
  });
});

describe('Fiche brassin › Mesures : nombres à la française (RJ-5, RJ-6, RJ-7)', () => {
  it('RJ-6 · l’alcool se lit avec la virgule', () => {
    open(base({ og: '1.060', fg: '1.010' }));
    // RJ-6 vérifie la virgule. La valeur suit la formule ASBC adoptée par le contre-calcul (0c3f4d41) : 6,6 avec l'ancienne
    // formule simple, 6,7 avec l'ASBC pour 1,060 → 1,010.
    expect(screen.getByText(/Alcool calculé/)).toHaveTextContent(/6,[67] % vol/);
    expect(screen.getByText(/Alcool calculé/)).not.toHaveTextContent(/6\.\d/);
  });

  it('RJ-7 · l’aide donne l’erreur réelle : 1048 pour 1,048', () => {
    open(base());
    typeBlur(screen.getByPlaceholderText('À mesurer'), '1048');
    expect(screen.getByRole('alert')).toHaveTextContent('1,048 et non 1048');
    expect(screen.getByRole('alert')).not.toHaveTextContent('se tape');
  });

  it('RJ-5 · les cibles de la fiche s’écrivent avec la virgule, à trois décimales', () => {
    open(base({ recipeSnapshot: { ogTarget: 1.08048, fgTarget: 1.0102 } as Batch['recipeSnapshot'] }));
    expect(screen.getByText('Cible 1,080')).toBeInTheDocument();
    expect(screen.getByText('Cible 1,010')).toBeInTheDocument();
  });

  it('RJ-6 · la courbe écrit ses densités avec la virgule', () => {
    const { container } = open(base({ og: '1.060', fg: '1.010', gravityLog: [{ date: '2026-09-03', sg: 1.04 }, { date: '2026-09-06', sg: 1.02 }] as Batch['gravityLog'] }));
    expect(container.textContent).not.toMatch(/\b[01]\.\d{3}\b/);
  });
});
