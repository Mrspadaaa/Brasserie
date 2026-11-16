import type { Recipe, RecipeSnapshot } from '../../types';
import { recipeThermalPlan } from '../../domain/recipeThermalPlan';
import type { PointCourbe, SegmentEmpatage } from './Dessins';

/** Les paliers d'empâtage tels que la fiche les dessine : seuls les paliers dont la température et la durée sont connues. */
export function segmentsEmpatage(recipe: Recipe | RecipeSnapshot): { segments: SegmentEmpatage[]; holdMin: number | undefined; principal: number | null } {
  const plan = recipeThermalPlan(recipe);
  const segments: SegmentEmpatage[] = plan.rows
    .filter((r) => Number.isFinite(r.tempC) && Number.isFinite(r.durationMin) && (r.durationMin as number) > 0)
    .map((r) => ({ nom: r.name, tempC: r.tempC as number, fromC: r.fromC ?? undefined, rampMin: r.rampMin ?? undefined, durationMin: r.durationMin as number }));
  // Le palier principal est le maintien le plus long (la saccharification) : c'est la température du résumé replié.
  const principal = segments.length ? segments.reduce((a, b) => (b.durationMin > a.durationMin ? b : a)).tempC : null;
  return { segments, holdMin: plan.holdMin ?? undefined, principal };
}

/** Courbe de fermentation : un palier par phase enregistrée (jours cumulés en x, température en y). Une phase sans durée connue n'est pas dessinée. */
export function pointsFermentation(phases: Recipe['fermentation'] | undefined): { points: PointCourbe[]; jours: number | null } {
  const points: PointCourbe[] = []; let t = 0, connues = 0;
  for (const p of phases ?? []) {
    if (!Number.isFinite(p.tempC) || !Number.isFinite(p.days)) continue;
    points.push({ x: t, y: p.tempC }); t += p.days; points.push({ x: t, y: p.tempC }); connues++;
  }
  return { points, jours: connues ? t : null };
}
