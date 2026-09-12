import type { Batch } from '../types';
import { catalogDate, catalogNumber } from './productionCatalog';

/** Observations only. The target is a separate reference, never a future measurement. */
export function fermentationReadings(batch: Batch) {
  const points: Array<{ name: string; date: string; sg: number; tempC?: number }> = [];
  const og = catalogNumber(batch.og),
    fg = catalogNumber(batch.fg);
  if (og !== undefined && og > 0)
    points.push({ name: 'OG mesurée', date: batch.brewDate || 'Date non renseignée', sg: og });
  const logs = [...(batch.gravityLog ?? [])]
    .filter((log) => Number.isFinite(log.sg) && log.sg > 0)
    .sort((a, b) => (catalogDate(a.date) ?? Infinity) - (catalogDate(b.date) ?? Infinity));
  logs.forEach((log, index) =>
    points.push({
      name: `Relevé ${index + 1}`,
      date: log.date || 'Date non renseignée',
      sg: log.sg,
      tempC: Number.isFinite(log.tempC) ? log.tempC : undefined
    })
  );
  if (fg !== undefined && fg > 0)
    points.push({ name: 'FG mesurée', date: batch.bottlingDate || 'Date non renseignée', sg: fg });
  const target = catalogNumber(batch.recipeSnapshot?.fgTarget);
  const latest = points.at(-1)?.sg;
  const attenuation =
    og !== undefined && og > 1 && latest !== undefined && latest <= og
      ? ((og - latest) / (og - 1)) * 100
      : undefined;
  return {
    points,
    target: target !== undefined && target > 0 ? target : undefined,
    latest,
    attenuation
  };
}
