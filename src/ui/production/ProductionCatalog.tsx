import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, ChevronRight, SearchX, Star } from 'lucide-react';
import type { Batch, Recipe, TimeFilterPeriod } from '../../types';
import { StorageService } from '../../services/storage';
import {
  CatalogEntry,
  CatalogFilters,
  CatalogKind,
  DEFAULT_CATALOG_FILTERS,
  batchEntries,
  filterCatalog,
  recipeEntries
} from '../../domain/productionCatalog';
import { statusOf } from '../../domain/batchStatus';
import { fermentationReadings } from '../../domain/fermentationReadings';
import { CatalogToolbar } from './CatalogToolbar';
import { CatalogAnalysis } from './CatalogAnalysis';

const num = (value: number) => value.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
function RecipeRow({
  entry,
  onOpen,
  onEdit
}: {
  entry: CatalogEntry;
  onOpen: (r: Recipe) => void;
  onEdit: (r: Recipe) => void;
}) {
  const recipe = entry.recipe!;
  const grist = (recipe.fermentables ?? recipe.malts ?? [])
    .filter((f) => !f.kind || f.kind === 'grain')
    .reduce((sum, f) => sum + f.weightKg, 0);
  return (
    <article
      className="panel overflow-hidden"
      aria-label={`Recette ${entry.name}, version ${entry.version}`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left min-h-touch flex gap-3"
          onClick={() => onOpen(recipe)}
          aria-label={`Ouvrir la recette ${entry.name}`}
        >
          <span
            className={`mt-1 h-10 w-2 rounded-full shrink-0 ${entry.swatch ?? 'bg-cave-700'}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-base text-cave-50 break-words">{entry.name}</span>
              {entry.favorite && (
                <Star className="h-3.5 w-3.5 shrink-0 text-ebc-straw" fill="currentColor" />
              )}
            </span>
            <span className="block text-sm text-cave-400 mt-0.5">
              {entry.style || 'Style à préciser'}
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-cave-200 mt-2">
              <span>{num(entry.volumeL)} L</span>
              <span>{num(grist)} kg de grain</span>
              {entry.abv !== undefined && <span>{num(entry.abv)} % cible</span>}
              {entry.ibu !== undefined && <span>{num(entry.ibu)} IBU</span>}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="touch-target shrink-0 rounded-control text-ebc-straw hover:bg-cave-850"
          onClick={() => onEdit(recipe)}
          aria-label={`Modifier la recette ${entry.name}`}
          title="Modifier la recette"
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-cave-800 px-4 py-2 text-sm text-cave-400">
        <span className={entry.linkedBatches.length ? 'text-water' : ''}>V{entry.version}</span>
        <span>
          {entry.linkedBatches.length
            ? `${entry.linkedBatches.length} brassin${entry.linkedBatches.length > 1 ? 's' : ''}`
          : 'Sans brassin associé'}
        </span>
        {entry.hops.length > 0 && (
          <span className="min-w-0 truncate text-hop">
            {entry.hops.slice(0, 2).join(', ')}
            {entry.hops.length > 2 ? ` +${entry.hops.length - 2}` : ''}
          </span>
        )}
      </div>
    </article>
  );
}
function BatchRow({
  entry,
  onOpen,
  onBrew
}: {
  entry: CatalogEntry;
  onOpen: (batch: Batch) => void;
  onBrew: (batch: Batch) => void;
}) {
  const batch = entry.batch!,
    status = statusOf(batch.status);
  const latestGravity = fermentationReadings(batch).points.at(-1);
  return (
    <article className="panel overflow-hidden" aria-label={`Brassin ${entry.id}, ${entry.name}`}>
      <button
        type="button"
        className="w-full min-h-touch p-3.5 flex items-start gap-3 text-left"
        onClick={() => onOpen(batch)}
        aria-label={`Ouvrir le brassin ${entry.id}`}
      >
        <span
          className={`h-12 w-2 shrink-0 rounded-full mt-1 ${entry.swatch ?? 'bg-cave-700'}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-sm text-cave-400">{entry.id}</span>
            <span className={`text-sm border rounded-full px-2.5 py-0.5 ${status.chip}`}>
              {status.label}
            </span>
          </span>
          <span className="block font-semibold text-base text-cave-50 mt-1 break-words">
            {entry.name}
          </span>
          <span className="block text-sm text-cave-400 mt-0.5">
            {entry.style || 'Style à préciser'}
            {entry.date ? ` · ${entry.date}` : ' · Date à renseigner'}
          </span>
          <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-cave-200 mt-2">
            <span>{num(entry.volumeL)} L prévus</span>
            {batch.volumeBrewedL != null && <span>{num(batch.volumeBrewedL)} L brassés</span>}
            {batch.volumePackagedL != null && (
              <span className="text-water">{num(batch.volumePackagedL)} L conditionnés</span>
            )}
            {entry.abv !== undefined && <span>{num(entry.abv)} %</span>}
          </span>
        </span>
      </button>
      <div className="border-t border-cave-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 flex-1 text-sm text-cave-400">
          {latestGravity
            ? `Dernier relevé : ${latestGravity.sg.toFixed(3)} · ${latestGravity.date}`
            : entry.hops.length
              ? entry.hops.slice(0, 2).join(', ')
              : 'Aucun relevé de densité'}
        </span>
        <button
          type="button"
          onClick={() => onBrew(batch)}
          aria-label={`Suivi du brassin ${entry.id}`}
          className="min-h-touch shrink-0 inline-flex items-center gap-1 text-sm text-ebc-straw"
        >
          {batch.status === 'planifie' ? 'Jour de brassage' : 'Voir le suivi'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
export function ProductionCatalog({
  kind,
  recipes,
  batches,
  globalTimeFilter,
  onOpenRecipe,
  onEditRecipe,
  onOpenBatch,
  onOpenBrewDay
}: {
  kind: CatalogKind;
  recipes: Recipe[];
  batches: Batch[];
  globalTimeFilter: TimeFilterPeriod;
  onOpenRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onOpenBatch: (batch: Batch) => void;
  onOpenBrewDay: (batch: Batch) => void;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...DEFAULT_CATALOG_FILTERS,
    period: kind === 'batches' ? 'global' : 'all',
    ...StorageService.getUiState(`catalog-${kind}-filters`, {})
  }));
  const [view, setView] = useState<'list' | 'analysis'>(() =>
    StorageService.getUiState(`catalog-${kind}-view`, 'list')
  );
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-filters`, filters);
  }, [filters, kind]);
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-view`, view);
  }, [view, kind]);
  const entries = useMemo(
    () => (kind === 'recipes' ? recipeEntries(recipes, batches) : batchEntries(batches)),
    [kind, recipes, batches]
  );
  const filtered = useMemo(
    () => filterCatalog(entries, filters, globalTimeFilter),
    [entries, filters, globalTimeFilter]
  );
  return (
    <div className="space-y-3">
      <CatalogToolbar
        kind={kind}
        entries={entries}
        count={filtered.length}
        filters={filters}
        onChange={setFilters}
        view={view}
        onViewChange={setView}
        globalPeriod={globalTimeFilter}
      />
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
              onClick={() => setFilters({ ...DEFAULT_CATALOG_FILTERS })}
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
          onFilter={(field, value) => {
            setFilters((f) => ({ ...f, [field]: value }));
            setView('list');
          }}
        />
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          aria-label={kind === 'recipes' ? 'Liste des recettes' : 'Liste des brassins'}
        >
          {filtered.map((entry) =>
            kind === 'recipes' ? (
              <RecipeRow key={entry.id} entry={entry} onOpen={onOpenRecipe} onEdit={onEditRecipe} />
            ) : (
              <BatchRow key={entry.id} entry={entry} onOpen={onOpenBatch} onBrew={onOpenBrewDay} />
            )
          )}
        </div>
      )}
    </div>
  );
}
