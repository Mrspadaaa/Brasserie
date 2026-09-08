import { hopSourceError, validHopRange, type HopSource, type HopRange } from './hopIndexSchema.js';
import type { HopTiming } from './hopPredictionSchema.js';
import type { HopExperimentalParameter } from './hopExtrapolationSchema.js';

export const HOP_CHEMISTRY_GOALS = ['thiols', 'terpenes', 'phenols'] as const;
export type HopChemistryGoal = typeof HOP_CHEMISTRY_GOALS[number];
export interface HopSolverIntent {
  styleId: string; avoid: string[];
  chemistry: Partial<Record<HopChemistryGoal, 'seek' | 'avoid'>>;
  keepYeast: boolean; timings: HopTiming[];
}
/** Fixed recipe guidance, stored alongside coefficients; no executable rules. */
export interface HopSolverPolicy {
  id: string; kind: 'solver'; name: string; version: string; enabled: boolean; source: HopSource;
  defaults: Record<HopTiming, { doseGL: HopExperimentalParameter; temperatureC: HopExperimentalParameter; contactHours: HopExperimentalParameter; searchDosesGL: HopExperimentalParameter[] }>;
  styles: { id: string; name: string; aliases: string[]; targets: Record<string, 'low' | 'medium' | 'high'>; avoid: string[]; timings: HopTiming[]; chemistry: HopSolverIntent['chemistry']; source: HopSource }[];
  yeastPhenols: { yeastId: string; status: 'positive' | 'negative'; source: HopSource }[];
  yeastConditions?: { yeastId: string; temperatureC: HopRange; warning?: string; source: HopSource }[];
  trialChemistry: { trialId: string; goals: HopChemistryGoal[]; source: HopSource }[];
  dryHopReviewGL: HopExperimentalParameter;
}
export function assertHopSolverPolicy(v: any): asserts v is HopSolverPolicy {
  const object = (x: any) => !!x && typeof x === 'object' && !Array.isArray(x);
  const check = (ok: any, why: string) => { if (!ok) throw Error(`Guide du solver : ${why}.`); };
  const text = (x: any) => typeof x === 'string' && !!x.trim();
  const keys = (x: any, allowed: string[]) => check(object(x) && Object.keys(x).every(k => allowed.includes(k)), 'champ inconnu');
  const source = (x: any, dated = true) => check(!hopSourceError(x, dated), 'provenance absente ou invalide');
  const parameter = (x: any, min = 0) => {
    keys(x, ['range', 'central', 'source']);
    check(validHopRange(x.range) && x.range.min >= min && Number.isFinite(x.central) && x.central >= x.range.min && x.central <= x.range.max, 'condition invalide'); source(x.source);
  };
  const phases = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
  const timingList = (x: any) => check(Array.isArray(x) && x.length > 0 && x.every(t => phases.includes(t)) && new Set(x).size === x.length, 'phases invalides');
  const chemistry = (x: any) => { keys(x, [...HOP_CHEMISTRY_GOALS]); check(Object.values(x).every(p => ['seek', 'avoid'].includes(p as string)), 'intention chimique invalide'); };
  keys(v, ['id', 'kind', 'name', 'version', 'enabled', 'source', 'defaults', 'styles', 'yeastPhenols', 'yeastConditions', 'trialChemistry', 'dryHopReviewGL']);
  check(v.kind === 'solver' && text(v.version) && typeof v.enabled === 'boolean', 'identité invalide'); source(v.source);
  keys(v.defaults, phases);
  for (const phase of phases) {
    const d = v.defaults[phase]; keys(d, ['doseGL', 'temperatureC', 'contactHours', 'searchDosesGL']);
    parameter(d.doseGL); parameter(d.temperatureC, -273.15); parameter(d.contactHours);
    check(Array.isArray(d.searchDosesGL) && d.searchDosesGL.length > 0 && d.searchDosesGL.length <= 8, 'doses de recherche invalides'); d.searchDosesGL.forEach((p: any) => parameter(p));
  }
  check(Array.isArray(v.styles) && new Set(v.styles.map((s: any) => s.id)).size === v.styles.length, 'styles dupliqués');
  for (const s of v.styles) {
    keys(s, ['id', 'name', 'aliases', 'targets', 'avoid', 'timings', 'chemistry', 'source']);
    check(text(s.id) && text(s.name) && Array.isArray(s.aliases) && s.aliases.every(text) && object(s.targets) && Object.values(s.targets).every(x => ['low', 'medium', 'high'].includes(x as string)) && Array.isArray(s.avoid) && s.avoid.every(text), 'style invalide');
    timingList(s.timings); chemistry(s.chemistry); source(s.source);
  }
  check(Array.isArray(v.yeastPhenols) && Array.isArray(v.trialChemistry), 'références absentes');
  for (const p of v.yeastPhenols) { keys(p, ['yeastId', 'status', 'source']); check(text(p.yeastId) && ['positive', 'negative'].includes(p.status), 'statut POF invalide'); source(p.source, false); }
  if (v.yeastConditions !== undefined) {
    check(Array.isArray(v.yeastConditions), 'conditions de levure invalides');
    for (const c of v.yeastConditions) { keys(c, ['yeastId', 'temperatureC', 'warning', 'source']); check(text(c.yeastId) && validHopRange(c.temperatureC) && c.temperatureC.min >= -273.15 && (c.warning === undefined || text(c.warning)), 'conditions de levure invalides'); source(c.source, false); }
  }
  for (const t of v.trialChemistry) { keys(t, ['trialId', 'goals', 'source']); check(text(t.trialId) && Array.isArray(t.goals) && t.goals.every((g: any) => HOP_CHEMISTRY_GOALS.includes(g)), 'voie expérimentale invalide'); source(t.source); }
  parameter(v.dryHopReviewGL);
}
