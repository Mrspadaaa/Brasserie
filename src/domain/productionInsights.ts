import type { Batch, Recipe, RecipeSnapshot } from '../types';
import { catalogDate, catalogNumber, catalogText, type CatalogEntry } from './productionCatalog';
import { normalizeHop } from './hopStage';

const dayMs = 86_400_000;
export type BatchDetailSection = 'measurements' | 'tasting' | 'overview';
export type WorkFilter = 'all' | 'measurements' | 'tasting';
export type OutcomeMetric = 'og' | 'fg' | 'volume' | 'abv';
const actualGravity = (value: unknown) => {
  const number = catalogNumber(value);
  return number !== undefined && number > 0 ? number : undefined;
};
export const isProduced = (batch: Batch) =>
  ['fermentation', 'garde', 'conditionne', 'termine'].includes(batch.status);
export const isPackaged = (batch: Batch) => ['conditionne', 'termine'].includes(batch.status);

/** Completeness only. A missing final gravity is normal while fermentation is in progress. */
export function missingBatchMeasurements(batch: Batch): string[] {
  if (!isProduced(batch)) return [];
  return [
    actualGravity(batch.og) === undefined ? 'OG' : '',
    isPackaged(batch) && actualGravity(batch.fg) === undefined ? 'FG' : ''
  ].filter(Boolean);
}
export function matchesWorkFilter(entry: CatalogEntry, filter: WorkFilter): boolean {
  if (!entry.batch || filter === 'all') return true;
  return filter === 'measurements'
    ? missingBatchMeasurements(entry.batch).length > 0
    : isPackaged(entry.batch) && !entry.batch.notesTasting?.trim();
}
/** Calendar days since brewing, never an inferred fermentation stage or readiness date. */
export function daysSinceBrew(batch: Batch, now = Date.now()): number | undefined {
  const date = catalogDate(batch.brewDate);
  if (date === undefined) return undefined;
  const local = new Date(now);
  const today = Date.UTC(local.getFullYear(), local.getMonth(), local.getDate());
  return Math.round((today - date) / dayMs);
}
export function batchNextAction(batch: Batch): {
  label: string;
  section?: BatchDetailSection;
  brew?: boolean;
} {
  if (batch.status === 'planifie') {
    return {
      label:
        batch.brewDay?.startedAt && !batch.brewDay.finishedAt
          ? 'Reprendre le brassage'
          : 'Jour de brassage',
      brew: true
    };
  }
  if (missingBatchMeasurements(batch).length)
    return { label: 'Compléter les mesures', section: 'measurements' };
  if (batch.status === 'fermentation' || batch.status === 'garde')
    return { label: 'Voir les mesures', section: 'measurements' };
  if (isPackaged(batch) && !batch.notesTasting?.trim())
    return { label: 'Noter la dégustation', section: 'tasting' };
  if (isPackaged(batch)) return { label: 'Relire la dégustation', section: 'tasting' };
  return { label: 'Ouvrir le dossier', section: 'overview' };
}
export const OUTCOME_METRICS: Record<
  OutcomeMetric,
  { label: string; unit: string; digits: number }
> = {
  og: { label: 'Densité initiale', unit: 'pts', digits: 3 },
  fg: { label: 'Densité finale', unit: 'pts', digits: 3 },
  volume: { label: 'Volume en cuve', unit: 'L', digits: 1 },
  abv: { label: 'Alcool', unit: 'pt de %', digits: 1 }
};
export function batchOutcome(entry: CatalogEntry, metric: OutcomeMetric) {
  const batch = entry.batch;
  if (!batch || !isProduced(batch)) return undefined;
  const snapshot = batch.recipeSnapshot;
  const target = catalogNumber(metric === 'volume' ? batch.volumeL : snapshot?.[`${metric}Target`]);
  const actual =
    metric === 'og' || metric === 'fg'
      ? actualGravity(batch[metric])
      : metric === 'volume'
        ? catalogNumber(batch.volumeBrewedL)
        : entry.abv;
  if (target === undefined || actual === undefined || target < 0 || actual < 0) return undefined;
  if ((metric === 'og' || metric === 'fg') && target <= 0) return undefined;
  const factor = metric === 'og' || metric === 'fg' ? 1000 : 1;
  const delta = Math.round((actual - target) * factor * 1000) / 1000;
  return { entry, target, actual, delta };
}
/** Paired completed lots only: pipeline volume must never be reported as a loss. */
export function packagingBalance(entries: CatalogEntry[]) {
  const pairs = entries
    .filter((e) => e.batch && isPackaged(e.batch))
    .flatMap((e) => {
      const brewed = catalogNumber(e.batch!.volumeBrewedL),
        packaged = catalogNumber(e.batch!.volumePackagedL);
      return brewed !== undefined && brewed > 0 && packaged !== undefined && packaged >= 0
        ? [{ brewed, packaged }]
        : [];
    });
  const brewed = pairs.reduce((sum, p) => sum + p.brewed, 0);
  const packaged = pairs.reduce((sum, p) => sum + p.packaged, 0);
  return {
    count: pairs.length,
    brewed,
    packaged,
    difference: brewed - packaged,
    pct: brewed > 0 ? (packaged / brewed) * 100 : undefined
  };
}

/** Normalized recipe signature; sugars, fruit and lactose never enter the grain denominator. */
export function recipeSignature(recipe: Recipe | RecipeSnapshot) {
  const grain = (recipe.fermentables ?? recipe.malts ?? []).filter(
    (f) => !f.kind || f.kind === 'grain'
  );
  const grainKg = grain.reduce((sum, f) => sum + Math.max(0, catalogNumber(f.weightKg) ?? 0), 0);
  const grainNames = new Map<string, { name: string; weight: number }>();
  grain.forEach((f) => {
    const key = catalogText(f.name),
      previous = grainNames.get(key);
    if (key)
      grainNames.set(key, {
        name: previous?.name ?? f.name,
        weight: (previous?.weight ?? 0) + Math.max(0, catalogNumber(f.weightKg) ?? 0)
      });
  });
  const volume = catalogNumber(recipe.volumeL);
  const validVolume = volume !== undefined && volume > 0;
  const otherGroups = new Map<string, { name: string; use: string; weight: number }>();
  (recipe.fermentables ?? [])
    .filter((f) => f.kind && f.kind !== 'grain')
    .forEach((f) => {
      const use =
        f.use === 'fermentation'
          ? `Fermentation${f.dayOffset != null ? ` J+${f.dayOffset}` : ''}`
          : f.use === 'ebullition'
            ? 'Ébullition'
            : f.use === 'empatage'
              ? 'Empâtage'
              : 'Moment non précisé';
      const key = `${catalogText(f.name)}:${f.kind}:${use}`,
        previous = otherGroups.get(key),
        weight = catalogNumber(f.weightKg);
      if (weight !== undefined && weight > 0)
        otherGroups.set(key, {
          name: previous?.name ?? f.name,
          use,
          weight: (previous?.weight ?? 0) + weight
        });
    });
  const hopGroups = new Map<
    string,
    { name: string; stage: string; detail: string; weight: number }
  >();
  (recipe.hops ?? []).map(normalizeHop).forEach((h) => {
    const detail =
      h.stage === 'dryHop'
        ? h.dayOffset != null
          ? `J+${h.dayOffset}`
          : 'Jour non précisé'
        : `${h.timeMin != null ? `${h.timeMin} min` : 'Durée non précisée'}${h.tempC != null ? ` à ${h.tempC} °C` : ''}`;
    const key = `${catalogText(h.name)}:${h.stage}:${detail}`,
      previous = hopGroups.get(key);
    const weight = catalogNumber(h.weightG);
    if (!h.name.trim() || weight === undefined || weight <= 0) return;
    hopGroups.set(key, {
      name: previous?.name ?? h.name,
      stage: h.stage,
      detail,
      weight: (previous?.weight ?? 0) + weight
    });
  });
  const hops = [...hopGroups.entries()].map(([key, h]) => ({
    ...h,
    key,
    gramsPerL: validVolume ? h.weight / volume : undefined
  }));
  return {
    grainKg,
    otherFermentables: [...otherGroups.entries()].map(([key, f]) => ({
      ...f,
      key,
      gramsPerL: validVolume ? (f.weight * 1000) / volume : undefined
    })),
    grain: [...grainNames.entries()]
      .filter(([, g]) => g.weight > 0)
      .map(([key, g]) => ({
        key,
        name: g.name,
        pct: grainKg > 0 ? (g.weight / grainKg) * 100 : undefined
      })),
    hops,
    dryHopPerL: validVolume
      ? hops.filter((h) => h.stage === 'dryHop').reduce((sum, h) => sum + h.weight, 0) / volume
      : undefined,
    yeast: recipe.yeast?.name || undefined
  };
}
