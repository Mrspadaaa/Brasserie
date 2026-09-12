import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { BatchCard } from '../../src/ui/production/CatalogCards';
import { batchEntries } from '../../src/domain/productionCatalog';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch } from '../../src/types';

afterEach(cleanup);

it('keeps a planned batch readable with unknown targets and distinguishes an explicit zero', () => {
  const batch: Batch = { ...yeastFlowRecipe(), id: 'missing-targets', status: 'planifie', brewDate: '12.09.2026',
    recipeSnapshot: { ...yeastFlowRecipe(), capturedAt: '2026-09-12', ogTarget: null, fgTarget: null, abvTarget: null } };
  const props = { onOpen: vi.fn(), onBrew: vi.fn(), onFavorite: vi.fn(), onArchive: vi.fn() };
  const view = render(<BatchCard entry={batchEntries([batch])[0]} {...props}/>);
  const alcohol = () => within(screen.getByText('Alcool cible').parentElement!);
  expect(alcohol().getByText('— %')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Jour de brassage · missing-targets' })).toBeEnabled();
  view.rerender(<BatchCard entry={batchEntries([{ ...batch, recipeSnapshot: { ...batch.recipeSnapshot!, abvTarget: 0 } }])[0]} {...props}/>);
  expect(alcohol().getByText('0 %')).toBeVisible();
});
