import React, { useEffect, useMemo, useState } from 'react';
import { SearchX, X } from 'lucide-react';
import type { Batch, Recipe, TimeFilterPeriod } from '../../types';
import { StorageService } from '../../services/storage';
import {
  CatalogFilters,
  CatalogKind,
  DEFAULT_CATALOG_FILTERS,
  batchEntries,
  filterCatalog,
  recipeEntries
} from '../../domain/productionCatalog';
import {
  matchesWorkFilter,
  type WorkFilter,
  type BatchDetailSection
} from '../../domain/productionInsights';
import { CatalogToolbar } from './CatalogToolbar';
import { CatalogAnalysis } from './CatalogAnalysis';
import { RecipeCard, BatchCard } from './CatalogCards';
import { RecipeComparison } from './RecipeComparison';
import { Sheet } from '../Sheet';

export function ProductionCatalog({
  kind,
  recipes,
  batches,
  globalTimeFilter,
  onOpenRecipe,
  onEditRecipe,
  onOpenBatch,
  onOpenBrewDay,
  onCreate
}: {
  kind: CatalogKind;
  recipes: Recipe[];
  batches: Batch[];
  globalTimeFilter: TimeFilterPeriod;
  onOpenRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onOpenBatch: (batch: Batch, section?: BatchDetailSection) => void;
  onOpenBrewDay: (batch: Batch) => void;
  onCreate?: () => void;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...DEFAULT_CATALOG_FILTERS,
    period: kind === 'batches' ? 'global' : 'all',
    sort: kind === 'batches' ? 'work' : 'recent',
    ...StorageService.getUiState(`catalog-${kind}-filters`, {})
  }));
  const [work, setWork] = useState<WorkFilter>(() =>
    kind === 'batches' ? StorageService.getUiState('catalog-batches-work', 'all') : 'all'
  );
  const [view, setView] = useState<'list' | 'analysis'>(() =>
    StorageService.getUiState(`catalog-${kind}-view`, 'list')
  );
  const [comparing, setComparing] = useState(false),
    [selectedIds, setSelectedIds] = useState<string[]>([]),
    [compareOpen, setCompareOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-filters`, filters);
  }, [filters, kind]);
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-view`, view);
  }, [view, kind]);
  useEffect(() => {
    if (kind === 'batches') StorageService.setUiState('catalog-batches-work', work);
  }, [work, kind]);
  const entries = useMemo(
    () => (kind === 'recipes' ? recipeEntries(recipes, batches) : batchEntries(batches)),
    [kind, recipes, batches]
  );
  const filtered = useMemo(() => {
    return filterCatalog(entries, filters, globalTimeFilter).filter((e) =>
      matchesWorkFilter(e, work)
    );
  }, [entries, filters, globalTimeFilter, work]);
  const facetEntries = useMemo(
    () => filterCatalog(entries, { ...filters, status: '', use: 'all' }, globalTimeFilter),
    [entries, filters, globalTimeFilter]
  );
  const selected = selectedIds.flatMap((id) => {
    const e = entries.find((e) => e.id === id);
    return e ? [e] : [];
  });
  const history = entries.find((e) => e.id === historyId);
  const reset = () => {
    setFilters({ ...DEFAULT_CATALOG_FILTERS });
    setWork('all');
  };
  return (
    <div className="space-y-3">
      <CatalogToolbar
        kind={kind}
        entries={entries}
        facetEntries={facetEntries}
        count={filtered.length}
        filters={filters}
        onChange={setFilters}
        view={view}
        onViewChange={setView}
        globalPeriod={globalTimeFilter}
        work={work}
        onWorkChange={setWork}
        comparing={comparing}
        onCompare={() => {
          setComparing(!comparing);
          setSelectedIds([]);
          setView('list');
        }}
        onCreate={onCreate}
      />
      {comparing && view === 'list' && (
        <div
          className="sticky top-0 z-20 flex gap-2 items-center bg-cave-850 border border-cave-700 rounded-control px-3 py-2 shadow-lift"
          role="region"
          aria-label="Sélection à comparer"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-cave-50">{selected.length}/2 recettes choisies</p>
            <p className="text-sm text-cave-400">
              {selected.length < 2
                ? 'Coche deux recettes à comparer.'
                : selected.map((e) => `${e.name} V${e.version}`).join(' / ')}
            </p>
          </div>
          <button
            type="button"
            disabled={selected.length !== 2}
            onClick={() => setCompareOpen(true)}
            className="min-h-touch rounded-control bg-ebc-straw text-cave-950 font-semibold px-3 text-sm disabled:opacity-40"
          >
            Comparer
          </button>
          <button
            type="button"
            className="touch-target text-cave-400"
            aria-label="Quitter la comparaison"
            onClick={() => {
              setComparing(false);
              setSelectedIds([]);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="panel p-6 text-center space-y-3">
          <SearchX className="h-7 w-7 mx-auto text-cave-400" />
          <h3 className="font-semibold text-cave-50">
            {entries.length
              ? 'Aucun résultat pour ces critères'
              : kind === 'recipes'
                ? 'Le carnet attend ta première recette'
                : 'Aucun brassin pour le moment'}
          </h3>
          <p className="text-sm text-cave-400">
            {entries.length
              ? 'Élargis les filtres ou la période pour retrouver tes fiches.'
              : 'Crée une recette, puis planifie son brassin.'}
          </p>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="min-h-touch px-4 rounded-control border border-cave-700 text-ebc-straw"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : view === 'analysis' ? (
        <CatalogAnalysis
          kind={kind}
          entries={filtered}
          onOpenBatch={onOpenBatch}
          onFilter={(field, value) => {
            setFilters((f) => ({ ...f, [field]: value }));
            if (field === 'status') setWork('all');
            setView('list');
          }}
        />
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start"
          aria-label={kind === 'recipes' ? 'Liste des recettes' : 'Liste des brassins'}
        >
          {filtered.map((entry) =>
            kind === 'recipes' ? (
              <RecipeCard
                key={entry.id}
                entry={entry}
                onOpen={onOpenRecipe}
                onEdit={onEditRecipe}
                onHistory={(e) => setHistoryId(e.id)}
                comparing={comparing}
                selected={selectedIds.includes(entry.id)}
                disabled={selected.length === 2 && !selectedIds.includes(entry.id)}
                onSelect={() =>
                  setSelectedIds((ids) =>
                    ids.includes(entry.id)
                      ? ids.filter((id) => id !== entry.id)
                      : ids.length < 2
                        ? [...ids, entry.id]
                        : ids
                  )
                }
              />
            ) : (
              <BatchCard key={entry.id} entry={entry} onOpen={onOpenBatch} onBrew={onOpenBrewDay} />
            )
          )}
        </div>
      )}
      {compareOpen && <RecipeComparison entries={selected} onClose={() => setCompareOpen(false)} />}
      {history && (
        <Sheet
          open
          onClose={() => setHistoryId(null)}
          title={`Brassins de ${history.name}`}
          subtitle={`Recette V${history.version} · ${history.linkedBatches.length} lot(s) associé(s)`}
          className="md:max-w-2xl md:mx-auto"
        >
          <div className="space-y-3">
            {batchEntries(history.linkedBatches)
              .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
              .map((entry) => (
                <BatchCard
                  key={entry.id}
                  entry={entry}
                  onOpen={(batch, section) => {
                    setHistoryId(null);
                    onOpenBatch(batch, section);
                  }}
                  onBrew={(batch) => {
                    setHistoryId(null);
                    onOpenBrewDay(batch);
                  }}
                />
              ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
