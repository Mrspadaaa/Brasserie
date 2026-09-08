import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import type { FermentationGuide, FermentationGoal, FermentationGuidePlan } from '../../functions/src/fermentationGuideSchema';
import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import type { FermentationStep, YeastSpec } from '../types';
import type { TrialRecipe } from './hopIndex/trials';

export interface FermentationDraft {
  goal: FermentationGoal; pitchTempC: number | undefined;
  phases: { tempC: number | undefined; days: number | undefined }[];
  quantityG?: number;
}
export interface FermentationGuideSnapshot {
  guide: FermentationGuide; yeast: HopYeast; goal: FermentationGoal; programApplied: boolean;
  /** The knowledge and the actual adopted settings are frozen independently. */
  applied: { yeast: YeastSpec; volumeL: number; program: FermentationStep[] };
}
export const FERMENTATION_GOAL_LABELS: Record<FermentationGoal, string> = {
  banana: 'Banane en avant', balanced: 'Banane et girofle en équilibre'
};
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const within = (n: unknown, r: HopRange) => finite(n) && n >= r.min && n <= r.max;
export const fermentationStateKey = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item);

export function fermentationPlan(guide: FermentationGuide, goal: FermentationGoal): FermentationGuidePlan | undefined {
  return guide.plans.find(p => p.goal === goal);
}
export function createFermentationDraft(guide: FermentationGuide, goal: FermentationGoal): FermentationDraft | undefined {
  const p = fermentationPlan(guide, goal);
  return p && { goal, pitchTempC: p.pitchTemperatureC.central, phases: p.phases.map(s => ({ tempC: s.temperatureC.central, days: s.days.central })) };
}
/** Unit conversion only: grams = g/hL × litres / 100. Never infer packet weight or viability. */
export function fermentationDose(guide: FermentationGuide, volumeL: number): { range: HopRange; confidence: 'low' | 'medium'; source: HopSource } | undefined {
  if (!guide.dryPitchGHL || !finite(volumeL) || volumeL <= 0) return undefined;
  const range = { min: guide.dryPitchGHL.range.min * volumeL / 100, max: guide.dryPitchGHL.range.max * volumeL / 100 };
  if (!finite(range.min) || !finite(range.max)) return undefined;
  return { range, confidence: guide.dryPitchGHL.source.year === null ? 'low' : 'medium', source: guide.dryPitchGHL.source };
}
/** An envelope of proposed durations, not a probability of fermentation completion. */
export function fermentationDuration(plan: FermentationGuidePlan): HopRange {
  return plan.phases.reduce((sum, s) => ({ min: sum.min + s.days.range.min, max: sum.max + s.days.range.max }), { min: 0, max: 0 });
}
export function fermentationDraftErrors(guide: FermentationGuide, draft: FermentationDraft, withProgram = true): string[] {
  const plan = fermentationPlan(guide, draft.goal), errors: string[] = [];
  if (!guide.enabled || !plan) return ['Ce programme n’est plus disponible.'];
  if (draft.quantityG !== undefined && (!finite(draft.quantityG) || draft.quantityG <= 0 || !guide.dryPitchGHL)) errors.push('La quantité de levure sèche doit être positive, ou laissée à renseigner.');
  if (!withProgram) return errors;
  if (!within(draft.pitchTempC, guide.temperatureC.range)) errors.push('L’ensemencement proposé doit rester dans la fenêtre de fermentation de cette souche.');
  if (draft.phases.length !== plan.phases.length) errors.push('Le programme a changé : reprends ses paliers.');
  draft.phases.forEach((s, i) => {
    if (!within(s.tempC, guide.temperatureC.range) || !finite(s.days) || s.days <= 0) errors.push(`Palier ${i + 1} : renseigne une température dans la fenêtre fabricant et une durée positive.`);
  });
  return errors;
}
export function proposedFermentationSteps(guide: FermentationGuide, draft: FermentationDraft): FermentationStep[] {
  if (fermentationDraftErrors(guide, draft).length) return [];
  const plan = fermentationPlan(guide, draft.goal)!;
  return plan.phases.map((s, i) => ({ name: s.name, kind: s.kind, tempC: draft.phases[i].tempC!, days: draft.phases[i].days!,
    note: `${s.completeWhen} Durée indicative, à ajuster aux mesures. Proposition L’Affinée (${guide.version}) ; ${guide.source.reference}.` }));
}
/** Preserve conditioning and ingredient events. The complete new order is previewed before adoption. */
export function replacePrimaryFermentation(previous: FermentationStep[], phases: FermentationStep[]): FermentationStep[] {
  const isPrimary = (s: FermentationStep) => s.kind === 'primaire' || s.kind === 'reposDiacetyle';
  let inserted = false;
  const next = previous.flatMap(s => {
    if (!isPrimary(s)) return [s];
    if (inserted) return [];
    inserted = true; return phases;
  });
  return inserted ? next : [...phases, ...next];
}
export function applyFermentationGuide<T extends TrialRecipe>(recipe: T, guide: FermentationGuide, yeast: HopYeast, draft: FermentationDraft, withProgram = true): T {
  assertHopKnowledge(guide); assertHopKnowledge(yeast);
  if (yeast.id !== guide.yeastId) throw Error('La souche ne correspond pas au programme.');
  const errors = fermentationDraftErrors(guide, draft, withProgram);
  if (errors.length) throw Error(errors[0]);
  const sameYeast = recipe.yeast.hopIndexId === yeast.id;
  const nextYeast = sameYeast ? { ...recipe.yeast } : { name: yeast.name, hopIndexId: yeast.id, form: yeast.form ?? 'liquide', qty: 0, unit: yeast.form === 'sèche' ? 'g' : 'flacon' };
  // A different strain does not inherit attenuation, quantity, temperature or stock facts.
  if (draft.quantityG !== undefined && yeast.form === 'sèche') { nextYeast.qty = draft.quantityG; nextYeast.unit = 'g'; }
  if (withProgram) {
    nextYeast.pitchTempC = draft.pitchTempC;
    nextYeast.fermTempMinC = Math.min(...draft.phases.map(s => s.tempC!));
    nextYeast.fermTempMaxC = Math.max(...draft.phases.map(s => s.tempC!));
    nextYeast.fermentDays = draft.phases.reduce((sum, s) => sum + s.days!, 0);
  }
  const fermentation = withProgram ? replacePrimaryFermentation(recipe.fermentation ?? [], proposedFermentationSteps(guide, draft)) : recipe.fermentation;
  return { ...recipe, yeast: nextYeast, fermentation,
    hopPredictionIds: undefined, hopMatrixId: undefined, hopTrialId: undefined,
    yeastGuide: structuredClone({ guide, yeast, goal: draft.goal, programApplied: withProgram,
      applied: { yeast: nextYeast, volumeL: recipe.volumeL, program: fermentation ?? [] } }) };
}
export function readFermentationGuide(recipe: TrialRecipe): FermentationGuideSnapshot | undefined {
  const s = recipe.yeastGuide;
  try {
    if (!s) return undefined;
    assertHopKnowledge(s.guide); assertHopKnowledge(s.yeast);
    if (s.guide.kind !== 'fermentation' || s.yeast.kind !== 'yeast' || s.guide.yeastId !== s.yeast.id || !fermentationPlan(s.guide, s.goal) || typeof s.programApplied !== 'boolean' || !Array.isArray(s.applied?.program) || !s.applied?.yeast || typeof s.applied.yeast.name !== 'string') return undefined;
    return s;
  } catch { return undefined; }
}
export function fermentationGuideChanged(recipe: TrialRecipe, s: FermentationGuideSnapshot): boolean {
  return fermentationStateKey(recipe.yeast) !== fermentationStateKey(s.applied.yeast) || recipe.volumeL !== s.applied.volumeL ||
    fermentationStateKey(recipe.fermentation ?? []) !== fermentationStateKey(s.applied.program);
}
