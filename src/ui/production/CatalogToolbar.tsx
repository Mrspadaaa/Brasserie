import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, List, ChartNoAxesCombined } from 'lucide-react';
import { Sheet } from '../Sheet';
import { BATCH_STATUSES, statusOf } from '../../domain/batchStatus';
import {
  CatalogEntry,
  CatalogFilters,
  CatalogKind,
  DEFAULT_CATALOG_FILTERS,
  catalogNumber,
  catalogOptions
} from '../../domain/productionCatalog';
import { TimeFilterPeriod } from '../../types';
import { DateUtils } from '../../services/dateUtils';
import { matchesWorkFilter, type WorkFilter } from '../../domain/productionInsights';

export const catalogField =
  'w-full min-h-touch rounded-control border border-cave-700 bg-cave-950 px-3 text-base text-cave-50 focus:border-ebc-straw focus:outline-none';
const filterLabel: Partial<Record<keyof CatalogFilters, string>> = {
  style: 'Style',
  hop: 'Houblon',
  malt: 'Malt',
  yeast: 'Levure',
  volumeMin: 'Volume min.',
  volumeMax: 'Volume max.',
  abvMin: 'ABV min.',
  abvMax: 'ABV max.',
  ibuMin: 'IBU min.',
  ibuMax: 'IBU max.',
  colorMin: 'EBC min.',
  colorMax: 'EBC max.'
};
export function CatalogToolbar({
  kind,
  entries,
  facetEntries,
  count,
  filters,
  onChange,
  view,
  onViewChange,
  globalPeriod,
  work,
  onWorkChange,
  comparing,
  onCompare,
  onCreate
}: {
  kind: CatalogKind;
  entries: CatalogEntry[];
  facetEntries: CatalogEntry[];
  count: number;
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  view: 'list' | 'analysis';
  onViewChange: (view: 'list' | 'analysis') => void;
  globalPeriod: TimeFilterPeriod;
  work: WorkFilter;
  onWorkChange: (work: WorkFilter) => void;
  comparing: boolean;
  onCompare: () => void;
  onCreate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });
  const active = (Object.keys(filterLabel) as Array<keyof CatalogFilters>).filter(
    (key) => filters[key]
  );
  const periodIsActive =
    filters.period !== 'all' && (filters.period !== 'global' || globalPeriod !== 'all');
  const moreCount = active.length + Number(filters.versions !== 'all') + Number(periodIsActive);
  const reset = () => {
    onChange({ ...DEFAULT_CATALOG_FILTERS, sort: filters.sort });
    onWorkChange('all');
  };
  const noun = kind === 'recipes' ? 'recette' : 'brassin';
  const select = (field: 'style' | 'hop' | 'malt' | 'yeast', options: string[]) => (
    <label className="block space-y-1.5">
      <span className="text-sm text-cave-200">{filterLabel[field]}</span>
      <select
        aria-label={`Filtrer par ${filterLabel[field]?.toLowerCase()}`}
        value={filters[field]}
        onChange={(event) => set({ [field]: event.target.value })}
        className={catalogField}
      >
        <option value="">Tous</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
  const range = (
    label: string,
    min: 'volumeMin' | 'abvMin' | 'ibuMin' | 'colorMin',
    max: 'volumeMax' | 'abvMax' | 'ibuMax' | 'colorMax'
  ) => {
    const low = catalogNumber(filters[min]),
      high = catalogNumber(filters[max]);
    const invalid =
      (filters[min].trim() && (low === undefined || low < 0)) ||
      (filters[max].trim() && (high === undefined || high < 0)) ||
      (low !== undefined && high !== undefined && low > high);
    return (
      <fieldset className="space-y-1.5">
        <legend className="text-sm text-cave-200">{label}</legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            aria-label={`${label} minimum`}
            aria-invalid={!!invalid}
            inputMode="decimal"
            type="text"
            placeholder="Minimum"
            className={catalogField}
            value={filters[min]}
            onChange={(e) => set({ [min]: e.target.value })}
          />
          <input
            aria-label={`${label} maximum`}
            aria-invalid={!!invalid}
            inputMode="decimal"
            type="text"
            placeholder="Maximum"
            className={catalogField}
            value={filters[max]}
            onChange={(e) => set({ [max]: e.target.value })}
          />
        </div>
        {!!invalid && (
          <p className="text-sm text-alert" role="alert">
            Saisis des bornes positives, avec le minimum inférieur ou égal au maximum.
          </p>
        )}
      </fieldset>
    );
  };
  const quick =
    kind === 'batches'
      ? [
          ['', 'Tous'],
          ['active', 'En cuve'],
          ['planifie', 'À brasser'],
          ['work:measurements', 'Mesures manquantes'],
          ['work:tasting', 'Notes à compléter'],
          ['conditionne', 'Conditionnés'],
          ['termine', 'Terminés'],
          ['annule', 'Annulés']
        ]
      : [
          ['all', 'Toutes'],
          ['brewed', 'Avec brassin'],
          ['unbrewed', 'Sans brassin'],
          ['favorite', 'Favoris']
        ];
  return (
    <section aria-label={`Recherche et filtres des ${noun}s`} className="space-y-3">
      <div className="flex gap-1 border-b border-cave-700" aria-label="Présentation">
        <button
          type="button"
          aria-label="Afficher la liste"
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
          className={`min-h-touch flex-1 flex items-center justify-center gap-2 border-b-2 text-base ${view === 'list' ? 'border-ebc-straw text-ebc-straw font-semibold' : 'border-transparent text-cave-400'}`}
        >
          <List className="h-4 w-4" />
          Carnet
        </button>
        <button
          type="button"
          aria-label="Afficher les analyses"
          aria-pressed={view === 'analysis'}
          onClick={() => onViewChange('analysis')}
          className={`min-h-touch flex-1 flex items-center justify-center gap-2 border-b-2 text-base ${view === 'analysis' ? 'border-ebc-straw text-ebc-straw font-semibold' : 'border-transparent text-cave-400'}`}
        >
          <ChartNoAxesCombined className="h-4 w-4" />
          Bilan
        </button>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="min-h-touch shrink-0 rounded-control bg-ebc-straw px-3 mb-1 ml-2 text-sm font-semibold text-cave-950"
          >
            {kind === 'recipes' ? '+ Recette' : '+ Brassin'}
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-cave-400" aria-hidden />
          <input
            className={`${catalogField} pl-9 pr-8`}
            type="search"
            aria-label={`Rechercher des ${noun}s`}
            placeholder="Nom, lot, houblon, malt…"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Filtres avancés${moreCount ? `, ${moreCount} actifs` : ''}`}
          className="min-h-touch shrink-0 flex items-center gap-1.5 rounded-control border border-cave-700 px-3 text-sm text-cave-200"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtres</span>
          {moreCount > 0 && (
            <span className="rounded-full bg-ebc-straw px-1.5 text-cave-950">{moreCount}</span>
          )}
        </button>
      </div>
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        aria-label={kind === 'batches' ? 'Avancement des brassins' : 'Usage des recettes'}
      >
        {quick.map(([value, label]) => {
          const current =
            kind === 'batches' ? (work !== 'all' ? `work:${work}` : filters.status) : filters.use;
          const quantity = facetEntries.filter((e) =>
            kind === 'recipes'
              ? value === 'all' ||
                (value === 'favorite'
                  ? e.favorite
                  : value === 'brewed'
                    ? e.linkedBatches.length > 0
                    : e.linkedBatches.length === 0)
              : value.startsWith('work:')
                ? matchesWorkFilter(e, value.slice(5) as WorkFilter)
                : !value ||
                  (value === 'active'
                    ? ['fermentation', 'garde'].includes(e.batch?.status ?? '')
                    : e.batch?.status === value)
          ).length;
          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={current === value}
              onClick={() => {
                if (kind === 'batches') {
                  onWorkChange(value.startsWith('work:') ? (value.slice(5) as WorkFilter) : 'all');
                  set({ status: value.startsWith('work:') ? '' : value });
                } else set({ use: value as CatalogFilters['use'] });
              }}
              className={`min-h-touch shrink-0 rounded-full px-3 text-sm border ${current === value ? 'border-ebc-straw/60 bg-ebc-straw/10 text-ebc-straw' : 'border-cave-800 text-cave-400'}`}
            >
              {label}{' '}
              <span className="ml-1 tabular-nums opacity-75" aria-hidden>
                {quantity}
              </span>
            </button>
          );
        })}
      </div>
      {(active.length > 0 ||
        filters.versions !== 'all' ||
        periodIsActive ||
        work !== 'all' ||
        (filters.status && !quick.some(([value]) => value === filters.status))) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Filtres actifs">
          {work !== 'all' && (
            <button
              type="button"
              onClick={() => onWorkChange('all')}
              className="min-h-touch px-2.5 rounded-control bg-cave-850 text-sm text-cave-200"
            >
              {work === 'measurements' ? 'Mesures manquantes' : 'Dégustation à noter'} ×
            </button>
          )}
          {filters.status && !quick.some(([value]) => value === filters.status) && (
            <button
              type="button"
              onClick={() => set({ status: '' })}
              className="min-h-touch px-2.5 rounded-control bg-cave-850 text-sm text-cave-200"
            >
              {statusOf(filters.status as Parameters<typeof statusOf>[0]).label} ×
            </button>
          )}
          {active.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => set({ [key]: '' })}
              aria-label={`Retirer le filtre ${filterLabel[key]}`}
              className="min-h-touch max-w-full inline-flex items-center gap-1.5 rounded-control bg-cave-850 px-2.5 text-sm text-cave-200"
            >
              <span className="truncate">
                {filterLabel[key]} : {filters[key]}
              </span>
              <X className="h-3.5 w-3.5 shrink-0" />
            </button>
          ))}
          {filters.versions === 'latest' && (
            <button
              type="button"
              onClick={() => set({ versions: 'all' })}
              className="min-h-touch rounded-control bg-cave-850 px-2.5 text-sm text-cave-200"
            >
              Dernières versions ×
            </button>
          )}
          {periodIsActive && (
            <button
              type="button"
              onClick={() => set({ period: 'all' })}
              className="min-h-touch rounded-control bg-cave-850 px-2.5 text-sm text-cave-200"
            >
              {filters.period === 'custom'
                ? `${filters.from || 'Début'} → ${filters.to || 'Sans limite'}`
                : filters.period === 'global'
                  ? DateUtils.getPeriodLabel(globalPeriod)
                  : filters.period === 'year'
                    ? 'Cette année'
                    : `${filters.period} derniers jours`}{' '}
              ×
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-sm text-cave-400" role="status">
          {count} {noun}
          {count > 1 ? 's' : ''}
          <span> sur {entries.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`catalog-sort-${kind}`}>
            Trier les {noun}s
          </label>
          <select
            id={`catalog-sort-${kind}`}
            className="min-h-touch max-w-[155px] bg-transparent pr-1 text-sm text-cave-200"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as CatalogFilters['sort'] })}
          >
            {kind === 'batches' && <option value="work">À suivre d’abord</option>}
            <option value="recent">Date ↓</option>
            <option value="oldest">Date ↑</option>
            <option value="name">Nom A–Z</option>
            <option value="volume">Volume ↓</option>
            <option value="abv">Alcool ↓</option>
            <option value="ibu">IBU cible ↓</option>
            <option value="color">Couleur EBC ↓</option>
            <option value="activity">
              {kind === 'batches' ? 'Avancement' : 'Nombre de lots ↓'}
            </option>
          </select>
          {kind === 'recipes' && (
            <button
              type="button"
              aria-label="Choisir des recettes à comparer"
              aria-pressed={comparing}
              onClick={onCompare}
              className={`min-h-touch px-2 text-sm ${comparing ? 'text-ebc-straw' : 'text-cave-200'}`}
            >
              Comparer
            </button>
          )}
        </div>
      </div>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Filtrer les ${noun}s`}
        subtitle="Combine les critères de ton carnet de brassage."
        footer={
          <div className="flex gap-2">
            <button
              className="min-h-touch rounded-control border border-cave-700 px-3 text-cave-200"
              onClick={reset}
            >
              Tout effacer
            </button>
            <button
              className="min-h-touch flex-1 rounded-control bg-ebc-straw px-3 font-semibold text-cave-950"
              onClick={() => setOpen(false)}
            >
              Voir {count} {noun}
              {count > 1 ? 's' : ''}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {select('style', catalogOptions(entries, 'style'))}
            {select('hop', catalogOptions(entries, 'hops'))}
            {select('malt', catalogOptions(entries, 'malts'))}
            {select('yeast', catalogOptions(entries, 'yeast'))}
          </div>
          {kind === 'batches' ? (
            <label className="block space-y-1.5">
              <span className="text-sm text-cave-200">Avancement</span>
              <select
                aria-label="Filtrer par avancement"
                value={filters.status}
                onChange={(e) => {
                  set({ status: e.target.value });
                  onWorkChange('all');
                }}
                className={catalogField}
              >
                <option value="">Tous</option>
                <option value="active">En cuve</option>
                {BATCH_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusOf(s).label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-sm text-cave-200">Versions</span>
              <select
                aria-label="Filtrer les versions"
                className={catalogField}
                value={filters.versions}
                onChange={(e) => set({ versions: e.target.value as CatalogFilters['versions'] })}
              >
                <option value="all">Toutes les versions</option>
                <option value="latest">Dernière version de chaque recette</option>
              </select>
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm text-cave-200">
              Date de brassage{kind === 'recipes' ? ' prévue' : ''}
            </span>
            <select
              aria-label="Filtrer par période"
              value={filters.period}
              onChange={(e) => set({ period: e.target.value as CatalogFilters['period'] })}
              className={catalogField}
            >
              <option value="all">Toutes les dates</option>
              <option value="global">Période de l’application</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="year">Cette année</option>
              <option value="custom">Choisir les dates</option>
            </select>
          </label>
          {filters.period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1.5 text-sm text-cave-200 block">
                Du
                <input
                  aria-label="Date de début"
                  type="date"
                  value={filters.from}
                  onChange={(e) => set({ from: e.target.value })}
                  className={catalogField}
                />
              </label>
              <label className="space-y-1.5 text-sm text-cave-200 block">
                Au
                <input
                  aria-label="Date de fin"
                  type="date"
                  value={filters.to}
                  onChange={(e) => set({ to: e.target.value })}
                  className={catalogField}
                />
              </label>
            </div>
          )}
          {range('Volume prévu (L)', 'volumeMin', 'volumeMax')}
          {range(kind === 'recipes' ? 'Alcool cible (%)' : 'Alcool mesuré (%)', 'abvMin', 'abvMax')}
          {range('Amertume cible (IBU)', 'ibuMin', 'ibuMax')}
          {range('Couleur prévue (EBC)', 'colorMin', 'colorMax')}
          <p className="text-sm text-cave-400">
            Une valeur inconnue est exclue quand tu filtres dessus. Les ingrédients des brassins
            proviennent de leur recette figée.
          </p>
        </div>
      </Sheet>
    </section>
  );
}
