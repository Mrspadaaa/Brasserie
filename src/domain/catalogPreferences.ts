import {
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
  type CatalogKind
} from './productionCatalog';
import type { WorkFilter } from './productionInsights';
import type { TimeFilterPeriod } from '../types';
import { DateUtils } from '../services/dateUtils';
import { statusOf } from './batchStatus';

export function restoreCatalogFilters(kind: CatalogKind, saved: unknown): CatalogFilters {
  const result = {
    ...DEFAULT_CATALOG_FILTERS,
    period: kind === 'batches' ? 'global' : 'all',
    sort: kind === 'batches' ? 'work' : 'recent'
  } as CatalogFilters;
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return result;
  for (const [key, value] of Object.entries(saved)) {
    if (
      Object.prototype.hasOwnProperty.call(result, key) &&
      typeof value === typeof result[key as keyof CatalogFilters]
    )
      Object.assign(result, { [key]: value });
  }
  const enums = {
    folder: ['current', 'archived', 'all'],
    use: ['all', 'brewed', 'unbrewed', 'favorite'],
    versions: ['all', 'latest'],
    period: ['global', 'all', '30', '90', 'year', 'custom'],
    sort: ['recent', 'oldest', 'name', 'volume', 'abv', 'ibu', 'color', 'work', 'activity']
  } as const;
  for (const key of Object.keys(enums) as Array<keyof typeof enums>) {
    if (!(enums[key] as readonly string[]).includes(result[key]))
      Object.assign(result, { [key]: DEFAULT_CATALOG_FILTERS[key] });
  }
  if (result.use === 'favorite') {
    result.favoritesOnly = true;
    result.use = 'all';
  }
  if (kind === 'recipes') result.status = '';
  if (kind === 'batches') {
    result.use = 'all';
    result.versions = 'all';
  }
  return result;
}
export interface CatalogCriterion {
  id: string;
  label: string;
  value: string;
  clear?: Partial<CatalogFilters>;
  clearWork?: boolean;
}
/** Every restriction, including quick filters and search, participates in the visible summary. */
export function catalogCriteria(
  filters: CatalogFilters,
  work: WorkFilter,
  global: TimeFilterPeriod
): CatalogCriterion[] {
  const result: CatalogCriterion[] = [];
  const names: Partial<Record<keyof CatalogFilters, string>> = {
    search: 'Recherche',
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
  for (const [id, label] of Object.entries(names)) {
    const value = filters[id as keyof CatalogFilters];
    if (typeof value === 'string' && value.trim())
      result.push({ id, label, value: value.trim(), clear: { [id]: '' } });
  }
  if (filters.favoritesOnly || filters.use === 'favorite')
    result.push({
      id: 'favorite',
      label: 'Favoris',
      value: 'Uniquement',
      clear: {
        favoritesOnly: false,
        ...(filters.use === 'favorite' ? { use: 'all' } : {})
      }
    });
  if (filters.status)
    result.push({
      id: 'status',
      label: 'Avancement',
      value:
        filters.status === 'active'
          ? 'En cuve'
          : statusOf(filters.status as Parameters<typeof statusOf>[0]).label,
      clear: { status: '' }
    });
  if (filters.use === 'brewed' || filters.use === 'unbrewed')
    result.push({
      id: 'use',
      label: 'Recettes',
      value: filters.use === 'brewed' ? 'Avec brassin' : 'Sans brassin',
      clear: { use: 'all' }
    });
  if (work !== 'all')
    result.push({
      id: 'work',
      label: 'À suivre',
      value: work === 'measurements' ? 'Mesures manquantes' : 'Notes de dégustation à compléter',
      clearWork: true
    });
  if (filters.versions === 'latest')
    result.push({
      id: 'versions',
      label: 'Versions',
      value: 'Les dernières',
      clear: { versions: 'all' }
    });
  if (filters.period !== 'all' && !(filters.period === 'global' && global === 'all'))
    result.push({
      id: 'period',
      label: 'Période',
      value:
        filters.period === 'global'
          ? DateUtils.getPeriodLabel(global)
          : filters.period === 'custom'
            ? `${filters.from || 'Début'} → ${filters.to || 'Sans limite'}`
            : filters.period === 'year'
              ? 'Cette année'
              : `${filters.period} derniers jours`,
      clear: { period: 'all', from: '', to: '' }
    });
  return result;
}
