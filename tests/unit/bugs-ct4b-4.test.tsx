// @vitest-environment jsdom
// CT4-B-4 (critique du tour 4) : l'aperçu d'une recette s'ouvrait sur un grand bandeau de stock (« est à vérifier : il n'est pas relié… »)
// qui contredisait les lignes (« pas au stock »). Quand rien n'est relié, un petit repère dit « Stock à vérifier » ; les lignes disent pourquoi.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Recipe } from '../../src/types';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: <T,>(read: () => T) => read() }));
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getStocks: () => ({ rawMaterials: [], cleaning: [] }),
    getConfig: () => ({ brewhouses: [{ id: 'b', efficiencyPct: 75 }], activeBrewhouseId: 'b' }),
    getUiState: (_k: string, d: unknown) => d,
    setUiState: () => undefined,
    subscribe: () => () => undefined
  }
}));
import { CarnetRecettes } from '../../src/ui/production/recettes/CarnetRecettes';

afterEach(cleanup);

const ipa = {
  id: 'ipa', name: 'ZZ American IPA', style: '21A', volumeL: 30, ogTarget: 1.066,
  fermentables: [{ name: 'Pilsner', weightKg: 6.2 }],
  hops: [{ name: 'Citra', weightG: 60, stage: 'boil', timeMin: 20, alpha: 12 }],
  yeast: { name: 'SafAle US-05', qty: 11.5, unit: 'g' }, adjuncts: []
} as unknown as Recipe;

describe('CT4-B-4 : l’aperçu ne s’ouvre pas sur un bandeau de stock', () => {
  it('stock non relié : plus de grand bandeau « il n’est pas relié… », un repère court, et les lignes disent « pas au stock »', () => {
    const { container } = render(<CarnetRecettes recipes={[ipa]} batches={[]} onOpenRecipe={vi.fn()} onEditRecipe={vi.fn()} onOpenBatch={vi.fn()} onBrew={vi.fn()} onNewRecipe={vi.fn()} />);
    fireEvent.click(screen.getByText('ZZ American IPA'));
    expect(screen.queryByText(/il n’est pas relié à un article/)).toBeNull();
    expect(container.ownerDocument.querySelector('.rcp-alerte')).toBeNull();
    const repere = screen.getByText('Stock à vérifier');
    expect(repere.closest('.rcp-averifier')).not.toBeNull();
    expect(screen.getAllByText('pas au stock').length).toBeGreaterThan(0);
    // La bière reste un toucher plus bas : OG et IBU, puis la fiche.
    expect(screen.getByRole('button', { name: /OG 1,066/ })).toBeTruthy();
  });
});
