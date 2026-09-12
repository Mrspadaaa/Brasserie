import { Input } from '../Input';
import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, List, ChartNoAxesCombined, Star, Plus } from 'lucide-react';
import { useMobileLayout } from '../useViewport';
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
import { matchesWorkFilter, type WorkFilter } from '../../domain/productionInsights';
import { catalogCriteria, type CatalogCriterion } from '../../domain/catalogPreferences';
import { inCatalogFolder } from '../../domain/catalogOrganization';
import { CatalogFilterNotice } from './CatalogFilterNotice';
import { CatalogScopeBar } from './CatalogScopeBar';

export const catalogField =
  'w-full min-h-touch-lg rounded-control border border-cave-700 bg-cave-950 px-2 text-base text-cave-50 focus:border-ebc-straw focus:outline-none';
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
  const mobile = useMobileLayout();
  const [searchOpen, setSearchOpen] = useState(false);
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });
  const criteria = catalogCriteria(filters, work, globalPeriod);
  const moreCount = criteria.length;
  const secondaryCriteria = criteria.filter(criterion => criterion.id !== 'search');
  const scopedEntries = entries.filter((e) => inCatalogFolder(e, filters.folder));
  const remove = (criterion: CatalogCriterion) => {
    if (criterion.clear) set(criterion.clear);
    if (criterion.clearWork) onWorkChange('all');
  };
  const reset = () => {
    onChange({
      ...DEFAULT_CATALOG_FILTERS,
      sort: filters.sort,
      folder: filters.folder
    });
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
        {filters[field] && !options.includes(filters[field]) && (
          <option value={filters[field]}>{filters[field]} · hors de ce dossier</option>
        )}
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
          <Input
            aria-label={`${label} minimum`}
            aria-invalid={!!invalid}
            inputMode="decimal"
            type="text"
            placeholder="Minimum"
            className={catalogField}
            value={filters[min]}
            onChange={(e) => set({ [min]: e.target.value })}
          />
          <Input
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
          ['unbrewed', 'Sans brassin']
        ];
  return (
    <section aria-label={`Recherche et filtres des ${noun}s`} className="space-y-2 sm:space-y-3">
      {mobile && <>
        <div className="flex items-center gap-1">
          <p className="min-w-0 flex-1 text-sm text-cave-200" role="status">
            {count} {noun}{count > 1 ? 's' : ''}{filters.folder !== 'current' ? ` · ${filters.folder === 'archived' ? 'Archives' : 'Historique'}` : ''}
            {view === 'analysis' && <span className="block text-xs text-ebc-straw">Bilan</span>}
          </p>
          <button type="button" aria-label={`Rechercher des ${noun}s`} aria-expanded={searchOpen || !!filters.search}
            onClick={() => setSearchOpen(value => !value)} className="touch-target rounded-control text-cave-200"><Search size={20}/></button>
          <button type="button" aria-label={`Filtres avancés${moreCount ? `, ${moreCount} actifs` : ''}`} onClick={() => setOpen(true)}
            className="relative touch-target rounded-control text-cave-200"><SlidersHorizontal size={20}/>{moreCount > 0 && <span className="absolute right-0 top-0 rounded-full bg-ebc-straw px-1.5 text-xs text-cave-950">{moreCount}</span>}</button>
          <button type="button" aria-label={view === 'list' ? 'Afficher les analyses' : 'Afficher la liste'}
            onClick={() => onViewChange(view === 'list' ? 'analysis' : 'list')} className={`touch-target rounded-control ${view === 'analysis' ? 'text-ebc-straw' : 'text-cave-400'}`}>
            {view === 'list' ? <ChartNoAxesCombined size={20}/> : <List size={20}/>}</button>
        </div>
        {(searchOpen || !!filters.search) && <div className="flex gap-1">
          <Input type="search" aria-label={`Rechercher des ${noun}s`} placeholder="Nom, lot, houblon, malt…" className={catalogField}
            value={filters.search} onChange={event => set({search:event.target.value})}/>
          <button type="button" aria-label="Fermer la recherche" className="touch-target text-cave-200" onClick={() => { set({search:''}); setSearchOpen(false); }}><X size={19}/></button>
        </div>}
        {secondaryCriteria.length > 0 && <div className="flex items-center gap-2 rounded-control bg-ebc-straw/5 px-2">
          <button type="button" onClick={() => setOpen(true)} className="min-h-touch min-w-0 flex-1 truncate text-left text-sm text-ebc-straw" aria-label={`Vue filtrée, ${criteria.length} critères actifs`}>
            {secondaryCriteria[0].label} : {secondaryCriteria[0].value}{secondaryCriteria.length > 1 ? ` · +${secondaryCriteria.length - 1}` : ''}
          </button>
          <button type="button" onClick={reset} aria-label="Tout effacer" className="touch-target text-cave-200"><X size={17}/></button>
        </div>}
      </>}
      {!mobile && <>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cave-400" aria-hidden />
          <Input
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
      <div className="flex gap-2">
        <div
          className="flex flex-1 min-w-0 gap-1.5 overflow-x-auto pb-1 scrollbar-none"
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
                    onWorkChange(
                      value.startsWith('work:') ? (value.slice(5) as WorkFilter) : 'all'
                    );
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
        <button
          type="button"
          aria-label="Favoris uniquement"
          aria-pressed={filters.favoritesOnly}
          onClick={() => set({ favoritesOnly: !filters.favoritesOnly })}
          className={`min-h-touch shrink-0 inline-flex gap-1.5 items-center self-start rounded-full px-3 border text-sm ${filters.favoritesOnly ? 'border-ebc-straw/60 bg-ebc-straw/10 text-ebc-straw' : 'border-cave-700 text-cave-200'}`}
        >
          <Star className={`w-4 h-4 ${filters.favoritesOnly ? 'fill-current' : ''}`} />
          <span>Favoris</span>
        </button>
      </div>
      <CatalogFilterNotice
        criteria={criteria}
        onRemove={remove}
        onReset={reset}
        onShowAll={() => setOpen(true)}
      />
      <CatalogScopeBar
        kind={kind}
        entries={entries}
        count={count}
        filters={filters}
        onChange={onChange}
        comparing={comparing}
        onCompare={onCompare}
      />
      </>}
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
        <div className="space-y-2">
          {mobile && <>
            <CatalogScopeBar kind={kind} entries={entries} count={count} filters={filters} onChange={onChange} comparing={comparing}
              onCompare={() => { onCompare(); setOpen(false); }}/>
            <label className="block space-y-1.5"><span className="text-sm text-cave-200">{kind === 'batches' ? 'Suivi des brassins' : 'Usage des recettes'}</span>
              <select className={catalogField} aria-label={kind === 'batches' ? 'Suivi des brassins' : 'Usage des recettes'}
                value={kind === 'batches' ? (work !== 'all' ? `work:${work}` : filters.status) : filters.use}
                onChange={event => { const value=event.target.value; if(kind === 'batches'){onWorkChange(value.startsWith('work:') ? value.slice(5) as WorkFilter : 'all');set({status:value.startsWith('work:') ? '' : value});}else set({use:value as CatalogFilters['use']}); }}>
                {quick.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="min-h-touch flex items-center gap-3 text-sm text-cave-200"><input type="checkbox" checked={filters.favoritesOnly} onChange={event => set({favoritesOnly:event.target.checked})}/>Favoris uniquement</label>
          </>}
          {criteria.length > 0 && (
            <div className="space-y-2" aria-label="Tous les critères actifs">
              <p className="text-sm text-ebc-straw font-semibold">
                Vue filtrée · {criteria.length} critère
                {criteria.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {criteria.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => remove(c)}
                    aria-label={`Retirer le filtre ${c.label}`}
                    className="min-h-touch max-w-full inline-flex items-center gap-2 px-3 rounded-control bg-cave-850 text-sm text-cave-50"
                  >
                    <span className="truncate">
                      {c.label} : {c.value}
                    </span>
                    <X className="w-4 h-4 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {select('style', catalogOptions(scopedEntries, 'style'))}
            {select('hop', catalogOptions(scopedEntries, 'hops'))}
            {select('malt', catalogOptions(scopedEntries, 'malts'))}
            {select('yeast', catalogOptions(scopedEntries, 'yeast'))}
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
                onChange={(e) =>
                  set({
                    versions: e.target.value as CatalogFilters['versions']
                  })
                }
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
