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
function mountOrganized(kind: 'recipes' | 'batches' = 'recipes') {
  const actions = callbacks();
  function Harness() {
    const [recipeRows, setRecipes] = React.useState<Recipe[]>([
      ...recipes,
      {
        ...recipes[2],
        id: 'OLD',
        name: 'Ancienne recette',
        favorite: true,
        archivedAt: '2026-09-01'
      }
    ]);
    const [batchRows, setBatches] = React.useState<Batch[]>([
      ...batches,
      {
        ...batches[0],
        id: 'OLD-LOT',
        favorite: true,
        archivedAt: '2026-09-01'
      }
    ]);
    React.useEffect(() => {
      const favorite = vi
        .spyOn(StorageService, 'setCatalogFavorite')
        .mockImplementation((type, id, value) => {
          if (type === 'recipe')
            setRecipes((rows) => rows.map((r) => (r.id === id ? { ...r, favorite: value } : r)));
          else setBatches((rows) => rows.map((b) => (b.id === id ? { ...b, favorite: value } : b)));
          return true;
        });
      const archive = vi
        .spyOn(StorageService, 'setCatalogArchived')
        .mockImplementation((type, id, value) => {
          const archivedAt = value ? '2026-09-08' : null;
          if (type === 'recipe')
            setRecipes((rows) => rows.map((r) => (r.id === id ? { ...r, archivedAt } : r)));
          else setBatches((rows) => rows.map((b) => (b.id === id ? { ...b, archivedAt } : b)));
          return true;
        });
      return () => {
        favorite.mockRestore();
        archive.mockRestore();
      };
    }, []);
    return (
      <ProductionCatalog
        kind={kind}
        recipes={recipeRows}
        batches={batchRows}
        globalTimeFilter="all"
        {...actions}
      />
    );
  }
  return render(<Harness />);
}
beforeEach(() => {
  localStorage.clear();
  for (const kind of ['recipes', 'batches']) {
    StorageService.setUiState(`catalog-${kind}-filters`, {
      ...DEFAULT_CATALOG_FILTERS
    });
    StorageService.setUiState(`catalog-${kind}-view`, 'list');
    StorageService.setUiState(`catalog-${kind}-analysis-folder`, 'all');
  }
  StorageService.setUiState('catalog-batches-work', 'all');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Recipe and batch catalog interactions', () => {
  it('shows a remembered ingredient even when the chosen folder has no matching options', () => {
    StorageService.setUiState('catalog-recipes-filters', {
      ...DEFAULT_CATALOG_FILTERS,
      folder: 'archived',
      hop: 'Fuggle'
    });
    mount();
    expect(screen.getByLabelText('Filtres actifs mémorisés')).toHaveTextContent('Fuggle');
    fireEvent.click(screen.getByRole('button', { name: 'Filtres avancés, 1 actifs' }));
    expect(screen.getByLabelText('Filtrer par houblon')).toHaveValue('Fuggle');
    expect(screen.getByRole('option', { name: 'Fuggle · hors de ce dossier' })).toBeInTheDocument();
  });
  it('remembers quick filters and favorites and makes the restored restriction visible', () => {
    const first = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Favoris uniquement' }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Citra' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sans brassin' }));
    first.unmount();
    mount();
    expect(screen.getByLabelText('Filtres actifs mémorisés')).toHaveTextContent(
      'Vue filtrée · 3 critères'
    );
    expect(screen.getByRole('button', { name: 'Sans brassin' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Favoris uniquement' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Filtres avancés, 3 actifs' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    expect(screen.queryByLabelText('Filtres actifs mémorisés')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
  it.each(['recipes', 'batches'] as const)(
    'stars and archives %s with reversible filing and no implicit archive visibility',
    (kind) => {
      mountOrganized(kind);
      const recipeKind = kind === 'recipes';
      const label = recipeKind ? 'la recette Écume, V1' : 'le brassin LOT1';
      const folderLabel = recipeKind ? 'Dossier des recettes' : 'Dossier des brassins';
      const rowLabel = recipeKind ? 'Recette Écume, version 1' : 'Brassin LOT1, Écume';
      expect(screen.queryByText('Ancienne recette')).not.toBeInTheDocument();
      expect(screen.queryByRole('article', { name: /OLD-LOT/ })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: `Épingler ${label}` }));
      expect(screen.getByRole('button', { name: `Retirer ${label} des favoris` })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      fireEvent.click(screen.getByRole('button', { name: `Ranger ${label}` }));
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Classer dans les archives'
        })
      );
      expect(screen.queryByRole('article', { name: rowLabel })).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(folderLabel), {
        target: { value: 'archived' }
      });
      expect(screen.getByRole('article', { name: rowLabel })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Retirer ${label} des favoris` })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      fireEvent.click(screen.getByRole('button', { name: `Ranger ${label}` }));
      fireEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Remettre dans le carnet'
        })
      );
      expect(screen.queryByRole('article', { name: rowLabel })).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(folderLabel), {
        target: { value: 'current' }
      });
      expect(screen.getByRole('article', { name: rowLabel })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: `Retirer ${label} des favoris` }));
      expect(screen.getByRole('button', { name: `Épingler ${label}` })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    }
  );
  it('keeps the analysis scope independent from the current notebook, including after reopening', () => {
    const first = mountOrganized();
    expect(screen.getByLabelText('Dossier des recettes')).toHaveValue('current');
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    expect(screen.getByLabelText('Dossier des recettes')).toHaveValue('all');
    expect(screen.getByLabelText('Analyses des recettes')).toHaveTextContent('4 recettes');
    expect(screen.getByLabelText('Analyses des recettes')).toHaveTextContent(
      'incluse(s) dans les résultats'
    );
    fireEvent.change(screen.getByLabelText('Dossier des recettes'), {
      target: { value: 'current' }
    });
    expect(screen.getByLabelText('Analyses des recettes')).toHaveTextContent(
      'exclue(s) dans les résultats'
    );
    fireEvent.change(screen.getByLabelText('Dossier des recettes'), {
      target: { value: 'archived' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Afficher la liste' }));
    expect(screen.getByLabelText('Dossier des recettes')).toHaveValue('current');
    expect(screen.getAllByRole('article')).toHaveLength(3);
    first.unmount();
    mountOrganized();
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    expect(screen.getByLabelText('Dossier des recettes')).toHaveValue('archived');
    expect(screen.getByLabelText('Analyses des recettes')).toHaveTextContent('1 recette');
  });
  it('clears restrictions inside Archives without changing the folder or losing the chosen sort', () => {
    const first = mountOrganized();
    fireEvent.change(screen.getByLabelText('Dossier des recettes'), {
      target: { value: 'archived' }
    });
    fireEvent.change(screen.getByLabelText('Trier les recettes'), {
      target: { value: 'volume' }
    });
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Introuvable' }
    });
    first.unmount();
    mountOrganized();
    expect(screen.getByLabelText('Dossier des recettes')).toHaveValue('archived');
    expect(screen.getByLabelText('Filtres actifs mémorisés')).toHaveTextContent('Introuvable');
    fireEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    expect(screen.getByLabelText('Dossier des recettes')).toHaveValue('archived');
    expect(screen.getByLabelText('Trier les recettes')).toHaveValue('volume');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article')).toHaveTextContent('Ancienne recette');
  });
  it('requires explicit archive selection to reveal archived lots in recipe history', () => {
    mountOrganized();
    fireEvent.click(screen.getByRole('button', { name: 'Voir les brassins de Écume, V1' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('article')).toHaveLength(1);
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Afficher les brassins archivés (1)'
      })
    );
    expect(within(dialog).getAllByRole('article')).toHaveLength(2);
  });
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
    fireEvent.change(screen.getByLabelText('Filtrer par houblon'), {
      target: { value: 'Citra' }
    });
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
    fireEvent.change(screen.getByLabelText('Trier les recettes'), {
      target: { value: 'volume' }
    });
    const rows = within(screen.getByLabelText('Liste des recettes')).getAllByRole('article');
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Recette Nocturne, version 1',
      'Recette Écume v2, version 2',
      'Recette Écume, version 1'
    ]);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Citra' }
    });
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
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Explorer les profils et ingrédients'
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer : Citra, 2 sur 3' }));
    expect(screen.getByRole('button', { name: 'Afficher la liste' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(
      within(screen.getByLabelText('Liste des recettes')).getAllByRole('article')
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Explorer les profils et ingrédients'
      })
    );
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
  it('compares exactly two recipes with normalized doses, without editing them', () => {
    const { actions } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Choisir des recettes à comparer' }));
    const selection = screen.getByRole('region', {
      name: 'Sélection à comparer'
    });
    expect(within(selection).getByRole('button', { name: 'Comparer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Comparer Écume, V1' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Comparer Écume v2, V2' }));
    expect(screen.getByRole('checkbox', { name: 'Comparer Nocturne, V1' })).toBeDisabled();
    fireEvent.click(within(selection).getByRole('button', { name: 'Comparer' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Comparer les recettes'
    });
    expect(within(dialog).getByLabelText('Grains comparés')).toHaveTextContent('100 %');
    expect(within(dialog).getByLabelText('Houblons comparés')).toHaveTextContent('2,08 g/L');
    expect(within(dialog).getByLabelText('Houblons comparés')).toHaveTextContent('2 g/L');
    expect(actions.onEditRecipe).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Revenir au carnet' }));
    expect(screen.getByRole('checkbox', { name: 'Comparer Écume, V1' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
  it('opens the lots linked to a recipe and their measurements directly', () => {
    const { actions } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Voir les brassins de Écume, V1' }));
    const dialog = screen.getByRole('dialog', { name: 'Brassins de Écume' });
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Compléter les mesures · LOT1'
      })
    );
    expect(actions.onOpenBatch).toHaveBeenCalledWith(batches[0], 'measurements');
    expect(actions.onOpenBrewDay).not.toHaveBeenCalled();
  });
  it('filters missing measurements without flagging an unfinished fermentation for missing FG', () => {
    const list = [
      { ...batches[0], id: 'FERM', og: '1.060' },
      {
        ...batches[0],
        id: 'MISSING',
        status: 'conditionne' as const,
        og: '1.060'
      },
      {
        ...batches[0],
        id: 'DONE',
        status: 'termine' as const,
        og: '1.060',
        fg: '1.010'
      }
    ];
    const actions = callbacks();
    render(
      <ProductionCatalog
        kind="batches"
        recipes={recipes}
        batches={list}
        globalTimeFilter="all"
        {...actions}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mesures manquantes' }));
    expect(
      within(screen.getByLabelText('Liste des brassins')).getAllByRole('article')
    ).toHaveLength(1);
    expect(screen.getByLabelText('Liste des brassins')).toHaveTextContent('MISSING');
    fireEvent.click(screen.getByRole('button', { name: 'Notes à compléter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Noter la dégustation · DONE' }));
    expect(actions.onOpenBatch).toHaveBeenCalledWith(list[2], 'tasting');
    expect(actions.onOpenBrewDay).not.toHaveBeenCalled();
  });
  it('uses the same filtered lots for target deltas and opens their actual measurements', () => {
    const lot = { ...batches[0], og: '1.060', volumeBrewedL: 20 };
    const actions = callbacks();
    render(
      <ProductionCatalog
        kind="batches"
        recipes={recipes}
        batches={[lot]}
        globalTimeFilter="all"
        {...actions}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les analyses' }));
    const outcomes = screen.getByLabelText('Écarts entre cible et résultat');
    expect(outcomes).toHaveTextContent('-4,7 pts');
    fireEvent.click(within(outcomes).getByRole('button', { name: 'Comparer volume en cuve' }));
    expect(outcomes).toHaveTextContent('-4 L');
    fireEvent.click(within(outcomes).getByRole('button', { name: 'Mesures du brassin LOT1' }));
    expect(actions.onOpenBatch).toHaveBeenCalledWith(lot, 'measurements');
  });
});
