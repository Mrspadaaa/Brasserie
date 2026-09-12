import type { Batch, Recipe, TimeFilterPeriod } from '../types';
import { bandForEbc, computeBeerColor } from './beerColor';
import { statusOf } from './batchStatus';
import { DateUtils } from '../services/dateUtils';
import { BrewingMath } from '../services/brewingMath';
import { inCatalogFolder, type CatalogFolder } from './catalogOrganization';

export type CatalogKind = 'batches' | 'recipes';
export type CatalogSort =
  'recent' | 'oldest' | 'name' | 'volume' | 'abv' | 'ibu' | 'color' | 'work' | 'activity';
export interface CatalogFilters {
  folder: CatalogFolder;
  favoritesOnly: boolean;
  search: string;
  style: string;
  hop: string;
  malt: string;
  yeast: string;
  status: string;
  use: 'all' | 'brewed' | 'unbrewed' | 'favorite';
  versions: 'all' | 'latest';
  period: 'global' | 'all' | '30' | '90' | 'year' | 'custom';
  from: string;
  to: string;
  volumeMin: string;
  volumeMax: string;
  abvMin: string;
  abvMax: string;
  ibuMin: string;
  ibuMax: string;
  colorMin: string;
  colorMax: string;
  sort: CatalogSort;
}
export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  folder: 'current',
  favoritesOnly: false,
  search: '',
  style: '',
  hop: '',
  malt: '',
  yeast: '',
  status: '',
  use: 'all',
  versions: 'all',
  period: 'all',
  from: '',
  to: '',
  volumeMin: '',
  volumeMax: '',
  abvMin: '',
  abvMax: '',
  ibuMin: '',
  ibuMax: '',
  colorMin: '',
  colorMax: '',
  sort: 'recent'
};
export const catalogText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
export const catalogNumber = (value: unknown): number | undefined => {
  if (value == null || String(value).trim() === '') return undefined;
  const parsed = Number(String(value).replace(',', '.').replace(/\s*%$/, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};
/** French/Swiss and ISO dates only; reject overflow instead of silently rolling months. */
export function catalogDate(value?: string): number | undefined {
  if (!value) return undefined;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  const local = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(value);
  if (!iso && !local) return undefined;
  const [year, month, day] = iso
    ? [+iso[1], +iso[2], +iso[3]]
    : [+local![3], +local![2], +local![1]];
  const time = Date.UTC(year, month - 1, day),
    date = new Date(time);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? time
    : undefined;
}
const names = (values: Array<{ name?: string }> = []) => [
  ...new Map(
    values.filter((v) => v.name?.trim()).map((v) => [catalogText(v.name), v.name!.trim()])
  ).values()
];
export interface CatalogEntry {
  id: string;
  name: string;
  style: string;
  volumeL: number;
  date?: string;
  timestamp?: number;
  abv?: number;
  ibu?: number;
  ebc?: number;
  swatch?: string;
  hops: string[];
  malts: string[];
  yeast: string;
  version: number;
  family: string;
  linkedBatches: Batch[];
  favorite: boolean;
  archivedAt?: string | null;
  recipe?: Recipe;
  batch?: Batch;
}
export function relatedRecipeBatches(
  recipe: Pick<Recipe, 'id' | 'batchRef'>,
  batches: Batch[]
): Batch[] {
  return batches.filter(
    (batch) =>
      batch.recipeRef === recipe.id ||
      batch.recipeSnapshot?.sourceRecipeId === recipe.id ||
      batch.id === recipe.batchRef
  );
}
function familyOf(recipe: Recipe, recipes: Recipe[]): string {
  const visited = new Set<string>();
  let item = recipe;
  while (item.parentRecipeId && !visited.has(item.id)) {
    visited.add(item.id);
    const parent = recipes.find((r) => r.id === item.parentRecipeId);
    if (!parent) return item.parentRecipeId;
    item = parent;
  }
  return item.id;
}
export function recipeEntries(recipes: Recipe[], batches: Batch[]): CatalogEntry[] {
  return recipes.map((recipe) => {
    const color = recipe.nolo?.enabled && ['coldExtraction','secondRunnings'].includes(recipe.nolo.process) ? null : computeBeerColor(
      (recipe.fermentables ?? recipe.malts ?? []).filter((f) => !f.kind || f.kind === 'grain'),
      recipe.volumeL
    );
    return {
      id: recipe.id,
      name: recipe.name,
      style: recipe.style,
      volumeL: recipe.volumeL,
      date: recipe.brewDate,
      timestamp: catalogDate(recipe.brewDate),
      abv: catalogNumber(recipe.nolo?.enabled ? recipe.nolo.targetAbvPct : recipe.abvTarget),
      ibu: catalogNumber(recipe.ibuTarget),
      ebc: color?.ebc ?? recipe.colorEbc,
      swatch:
        color?.swatch ?? (recipe.colorEbc != null ? bandForEbc(recipe.colorEbc).swatch : undefined),
      hops: names(recipe.hops),
      malts: names(
        (recipe.fermentables ?? recipe.malts ?? []).filter((f) => !f.kind || f.kind === 'grain')
      ),
      yeast: recipe.yeast?.name ?? '',
      version: recipe.version ?? 1,
      family: familyOf(recipe, recipes),
      linkedBatches: relatedRecipeBatches(recipe, batches),
      favorite: !!recipe.favorite,
      archivedAt: recipe.archivedAt,
      recipe
    };
  });
}
export function batchEntries(batches: Batch[]): CatalogEntry[] {
  return batches.map((batch) => {
    // Ingredients of an old lot come from its frozen snapshot, never a recipe edited later.
    const recipe = batch.recipeSnapshot;
    const grain = (recipe?.fermentables ?? recipe?.malts ?? batch.malts ?? []).filter(
      (f) => !f.kind || f.kind === 'grain'
    );
    const nolo = batch.nolo ?? recipe?.nolo;
    const color = nolo?.enabled && ['coldExtraction','secondRunnings'].includes(nolo.process) ? null : computeBeerColor(grain, recipe?.volumeL ?? batch.volumeL);
    const og = catalogNumber(batch.og),
      fg = catalogNumber(batch.fg);
    return {
      id: batch.id,
      name: batch.name,
      style: batch.style,
      volumeL: batch.volumeL,
      date: batch.brewDate,
      timestamp: catalogDate(batch.brewDate),
      // NOLO alcohol is an analysis with its own context and uncertainty.
      // Neither an old scalar nor OG–FG can replace that reading in charts.
      abv: (batch.nolo ?? recipe?.nolo)?.enabled ? undefined :
        catalogNumber(batch.abv) ??
        (og && fg && og > 1 && fg >= 1 && og >= fg ? BrewingMath.calculateABV(og, fg) : undefined),
      ibu: catalogNumber(recipe?.ibuTarget),
      ebc: color?.ebc ?? recipe?.colorEbc,
      swatch:
        color?.swatch ??
        (recipe?.colorEbc != null ? bandForEbc(recipe.colorEbc).swatch : undefined),
      hops: names(recipe?.hops ?? batch.hops),
      malts: names(grain),
      yeast: recipe?.yeast?.name ?? batch.yeast?.name ?? batch.yeastName ?? '',
      version: recipe?.version ?? 1,
      family: batch.recipeRef ?? batch.id,
      linkedBatches: [],
      favorite: !!batch.favorite,
      archivedAt: batch.archivedAt,
      batch
    };
  });
}
export function catalogOptions(
  entries: CatalogEntry[],
  field: 'style' | 'hops' | 'malts' | 'yeast'
): string[] {
  const options = new Map<string, string>();
  entries
    .flatMap((e) => (Array.isArray(e[field]) ? e[field] : [e[field]]))
    .forEach((value) => {
      const key = catalogText(value);
      if (key && !options.has(key)) options.set(key, value.trim());
    });
  return [...options.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}
function inRange(value: number | undefined, min: string, max: string): boolean {
  const low = catalogNumber(min),
    high = catalogNumber(max);
  if (
    (min.trim() && (low === undefined || low < 0)) ||
    (max.trim() && (high === undefined || high < 0))
  )
    return false;
  if (low === undefined && high === undefined) return true;
  return (
    value !== undefined &&
    (low === undefined || value >= low) &&
    (high === undefined || value <= high)
  );
}
export function filterCatalog(
  entries: CatalogEntry[],
  filters: CatalogFilters,
  globalPeriod: TimeFilterPeriod,
  now = Date.now()
): CatalogEntry[] {
  const latest = new Map<string, number>();
  entries
    .filter((e) => inCatalogFolder(e, filters.folder ?? 'current'))
    .forEach((e) => latest.set(e.family, Math.max(latest.get(e.family) ?? 0, e.version)));
  const day = new Date(now);
  const today = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
  const matches = entries.filter((e) => {
    if (!inCatalogFolder(e, filters.folder ?? 'current')) return false;
    if (filters.favoritesOnly && !e.favorite) return false;
    const search = catalogText(filters.search).split(/\s+/).filter(Boolean);
    const haystack = catalogText([e.id, e.name, e.style, e.yeast, ...e.hops, ...e.malts].join(' '));
    if (!search.every((word) => haystack.includes(word))) return false;
    if (filters.style && catalogText(e.style) !== catalogText(filters.style)) return false;
    if (filters.hop && !e.hops.some((name) => catalogText(name) === catalogText(filters.hop)))
      return false;
    if (filters.malt && !e.malts.some((name) => catalogText(name) === catalogText(filters.malt)))
      return false;
    if (filters.yeast && catalogText(e.yeast) !== catalogText(filters.yeast)) return false;
    if (filters.status === 'active' && !['fermentation', 'garde'].includes(e.batch?.status ?? ''))
      return false;
    if (filters.status && filters.status !== 'active' && e.batch?.status !== filters.status)
      return false;
    if (filters.use === 'brewed' && !e.linkedBatches.length) return false;
    if (filters.use === 'unbrewed' && e.linkedBatches.length) return false;
    if (filters.use === 'favorite' && !e.favorite) return false;
    if (filters.versions === 'latest' && e.version !== latest.get(e.family)) return false;
    if (
      !inRange(e.volumeL, filters.volumeMin, filters.volumeMax) ||
      !inRange(e.abv, filters.abvMin, filters.abvMax) ||
      !inRange(e.ibu, filters.ibuMin, filters.ibuMax) ||
      !inRange(e.ebc, filters.colorMin, filters.colorMax)
    )
      return false;
    if (
      filters.period === 'global' &&
      globalPeriod !== 'all' &&
      (e.timestamp === undefined || !DateUtils.isDateInPeriod(e.date ?? '', globalPeriod))
    )
      return false;
    if (filters.period === '30' || filters.period === '90') {
      if (
        e.timestamp === undefined ||
        e.timestamp < today - (Number(filters.period) - 1) * 86400000 ||
        e.timestamp > today
      )
        return false;
    }
    if (
      filters.period === 'year' &&
      (e.timestamp === undefined || new Date(e.timestamp).getUTCFullYear() !== day.getFullYear())
    )
      return false;
    if (filters.period === 'custom') {
      const from = catalogDate(filters.from),
        to = catalogDate(filters.to);
      if (
        (from !== undefined || to !== undefined) &&
        (e.timestamp === undefined ||
          (from !== undefined && e.timestamp < from) ||
          (to !== undefined && e.timestamp > to))
      )
        return false;
    }
    return true;
  });
  const numeric = (a: number | undefined, b: number | undefined, ascending = false) =>
    a === undefined ? (b === undefined ? 0 : 1) : b === undefined ? -1 : ascending ? a - b : b - a;
  const workRank = (batch?: Batch) => {
    if (!batch) return 99;
    if (batch.status === 'planifie' && batch.brewDay?.startedAt && !batch.brewDay.finishedAt)
      return 0;
    if (['fermentation', 'garde'].includes(batch.status)) return 1;
    if (batch.status === 'planifie') return 2;
    return batch.status === 'conditionne' ? 3 : batch.status === 'termine' ? 4 : 5;
  };
  return matches.sort((a, b) => {
    const order =
      filters.sort === 'work'
        ? workRank(a.batch) - workRank(b.batch) ||
          numeric(
            a.timestamp,
            b.timestamp,
            a.batch?.status === 'planifie' && b.batch?.status === 'planifie'
          )
        : filters.sort === 'name'
          ? a.name.localeCompare(b.name, 'fr')
          : filters.sort === 'recent' || filters.sort === 'oldest'
            ? numeric(a.timestamp, b.timestamp, filters.sort === 'oldest')
            : filters.sort === 'volume'
              ? numeric(a.volumeL, b.volumeL)
              : filters.sort === 'abv'
                ? numeric(a.abv, b.abv)
                : filters.sort === 'ibu'
                  ? numeric(a.ibu, b.ibu)
                  : filters.sort === 'color'
                    ? numeric(a.ebc, b.ebc)
                    : a.batch && b.batch
                      ? statusOf(a.batch.status).order - statusOf(b.batch.status).order
                      : b.linkedBatches.length - a.linkedBatches.length;
    return order || a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id);
  });
}
export function countGroups(entries: CatalogEntry[], field: 'style' | 'hops') {
  const counts = new Map<string, { name: string; count: number }>();
  entries.forEach((e) =>
    (field === 'hops' ? e.hops : [e.style])
      .filter((name) => name.trim())
      .forEach((name) => {
        const key = catalogText(name);
        const previous = counts.get(key);
        counts.set(key, {
          name: previous?.name ?? name.trim(),
          count: (previous?.count ?? 0) + 1
        });
      })
  );
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr')
  );
}
export function measuredProduction(entries: CatalogEntry[]) {
  const months = new Map<string, { month: string; brewed: number; packaged: number }>();
  let brewed = 0,
    packaged = 0,
    measured = 0,
    undated = 0;
  entries.forEach(({ batch, timestamp }) => {
    if (!batch || batch.status === 'annule') return;
    const actual = catalogNumber(batch.volumeBrewedL),
      bottled = catalogNumber(batch.volumePackagedL);
    if (actual === undefined && bottled === undefined) return;
    brewed += Math.max(0, actual ?? 0);
    packaged += Math.max(0, bottled ?? 0);
    measured++;
    if (timestamp === undefined) {
      undated++;
      return;
    }
    const month = new Date(timestamp).toISOString().slice(0, 7);
    const point = months.get(month) ?? { month, brewed: 0, packaged: 0 };
    point.brewed += Math.max(0, actual ?? 0);
    point.packaged += Math.max(0, bottled ?? 0);
    months.set(month, point);
  });
  return {
    brewed,
    packaged,
    measured,
    undated,
    months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month))
  };
}
