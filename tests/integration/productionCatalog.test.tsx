import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionCatalog } from '../../src/ui/production/ProductionCatalog';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { fullRecipe } from '../fixtures/fullRecipe';
import { Batch, Recipe } from '../../src/types';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { StorageService } from '../../src/services/storage';
import { DEFAULT_CATALOG_FILTERS } from '../../src/domain/productionCatalog';

const recipes: Recipe[] = [
  {
    ...fullRecipe,
    id: 'IPA',
    name: 'Écume',
    style: 'IPA',
    abvTarget: 6,
    ibuTarget: 40,
    volumeL: 24,
    favorite: false,
    hops: [{ name: 'Citra', stage: 'dryHop', weightG: 50, alpha: 12 }]
  },
  {
    ...fullRecipe,
    id: 'IPA2',
    parentRecipeId: 'IPA',
    version: 2,
    name: 'Écume v2',
    style: 'IPA',
    abvTarget: 5,
    ibuTarget: 30,
    volumeL: 30,
    favorite: true,
    hops: [{ name: 'Citra', stage: 'dryHop', weightG: 60, alpha: 12 }]
  },
  {
    ...fullRecipe,
    id: 'STOUT',
    name: 'Nocturne',
    style: 'Stout',
    abvTarget: 8,
    ibuTarget: 45,
    volumeL: 40,
    favorite: false,
    hops: [{ name: 'Fuggle', stage: 'boil', weightG: 30, alpha: 5 }]
  }
];
const batches: Batch[] = [
  {
    id: 'LOT1',
    name: 'Écume',
    style: 'IPA',
    volumeL: 24,
    volumeBrewedL: 23,
    brewDate: '08.09.2026',
    status: 'fermentation',
    recipeRef: 'IPA',
    recipeSnapshot: captureSnapshot(recipes[0])
  }
];
const callbacks = () => ({
  onOpenRecipe: vi.fn(),
  onEditRecipe: vi.fn(),
  onOpenBatch: vi.fn(),
  onOpenBrewDay: vi.fn()
});
function mount(kind: 'recipes' | 'batches' = 'recipes') {
  const actions = callbacks();
  const view = render(
    <ProductionCatalog
      kind={kind}
      recipes={recipes}
      batches={batches}
      globalTimeFilter="all"
      {...actions}
    />
  );
  return { ...view, actions };
}
beforeEach(() => {
  localStorage.clear();
  for (const kind of ['recipes', 'batches']) {
    StorageService.setUiState(`catalog-${kind}-filters`, { ...DEFAULT_CATALOG_FILTERS });
    StorageService.setUiState(`catalog-${kind}-view`, 'list');
  }
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Recipe and batch catalog interactions', () => {
  it('offers a direct edit button instead of a scaling action, keeping read and edit separate', () => {
    const onEditRecipe = vi.fn(),
      onOpenRecipe = vi.fn();
    render(
      <ProductionTab
        batches={batches}
        recipes={recipes}
        brewhouses={[]}
        activeBrewhouseId=""
        globalTimeFilter="all"
        targetSubTab="recipes"
        onOpenCreateBatch={vi.fn()}
        onOpenQuickAction={vi.fn()}
        onDraftRecipe={vi.fn()}
        onOpenBrewDay={vi.fn()}
        onEditRecipe={onEditRecipe}
        onOpenRecipe={onOpenRecipe}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Modifier la recette Écume' }));
    expect(onEditRecipe).toHaveBeenCalledWith(recipes[0]);
    expect(onOpenRecipe).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la recette Écume' }));
    expect(onOpenRecipe).toHaveBeenCalledWith(recipes[0]);
    expect(screen.queryByRole('button', { name: /Adapter le volume/ })).not.toBeInTheDocument();
  });
  it('combines a hop filter with numeric criteria and exposes removable active filters', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Filtres avancés' }));
    fireEvent.change(screen.getByLabelText('Filtrer par houblon'), { target: { value: 'Citra' } });
    fireEvent.change(screen.getByLabelText('Alcool cible (%) maximum'), {
      target: { value: '5,5' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Voir 1 recette' }));
    const list = screen.getByLabelText('Liste des recettes');
    expect(within(list).getAllByRole('article')).toHaveLength(1);
    expect(within(list).getByText('Écume v2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer le filtre ABV max.' }));
    expect(within(list).getAllByRole('article')).toHaveLength(2);
  });
  it('reports an invalid numeric interval instead of silently showing unrelated results', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Filtres avancés' }));
    fireEvent.change(screen.getByLabelText('Volume prévu (L) minimum'), {
      target: { value: '50' }
    });
    fireEvent.change(screen.getByLabelText('Volume prévu (L) maximum'), {
      target: { value: '20' }
    });
    expect(screen.getByRole('alert')).toHaveTextContent('minimum inférieur');
    expect(screen.getByLabelText('Volume prévu (L) maximum')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voir 0 recette' }));
    expect(screen.getByText('Aucun résultat pour ces critères')).toBeInTheDocument();
    expect(screen.queryByLabelText('Liste des recettes')).not.toBeInTheDocument();
  });
  it('sorts volumes as numbers and retains search preferences after reopening', () => {
    const view = mount();
    fireEvent.change(screen.getByLabelText('Trier les recettes'), { target: { value: 'volume' } });
    const rows = within(screen.getByLabelText('Liste des recettes')).getAllByRole('article');
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Recette Nocturne, version 1',
      'Recette Écume v2, version 2',
      'Recette Écume, version 1'
    ]);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Citra' } });
    view.unmount();
    mount();
    expect(screen.getByRole('searchbox')).toHaveValue('Citra');
    expect(screen.getByLabelText('Trier les recettes')).toHaveValue('volume');
    expect(
      within(screen.getByLabelText('Liste des recettes')).getAllByRole('article')
    ).toHaveLength(2);
  });
  it('derives charts from the filtered selection and lets a hop bar open the matching list', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    expect(screen.getByLabelText('Analyses des recettes')).toHaveTextContent('3 recettes');
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer : Citra, 2 sur 3' }));
    expect(screen.getByRole('button', { name: 'Afficher la liste' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      within(screen.getByLabelText('Liste des recettes')).getAllByRole('article')
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    expect(screen.getByRole('button', { name: 'Filtrer : Citra, 2 sur 2' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filtrer : Fuggle/ })).not.toBeInTheDocument();
  });
  it('filters usage and preserves access to every version by default', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Avec brassin' }));
    expect(
      within(screen.getByLabelText('Liste des recettes')).getAllByRole('article')
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Toutes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filtres avancés' }));
    fireEvent.change(screen.getByLabelText('Filtrer les versions'), {
      target: { value: 'latest' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Voir 2 recettes' }));
    expect(
      screen.queryByRole('button', { name: 'Ouvrir la recette Écume' })
    ).not.toBeInTheDocument();
  });
  it('does not claim stock was deducted or water diluted without supporting data', () => {
    mount('batches');
    const list = screen.getByLabelText('Liste des brassins');
    expect(list).not.toHaveTextContent('Ingrédients déduits');
    expect(list).not.toHaveTextContent('50/50 DI');
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    expect(screen.getByLabelText('Analyses des brassins')).toHaveTextContent('23');
    expect(screen.getByLabelText('Analyses des brassins')).toHaveTextContent('1 lot');
  });
});
