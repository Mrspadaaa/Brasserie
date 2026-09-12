import { hopSourceError, validHopRange, type HopSource, type HopRange } from './hopIndexSchema.js';
import type { HopExperimentalParameter } from './hopExtrapolationSchema.js';

export const FERMENTATION_GOALS = ['banana', 'balanced', 'fruit', 'clean', 'phenolic', 'thiols'] as const;
export type FermentationGoal = typeof FERMENTATION_GOALS[number];
export interface FermentationFact { range: HopRange; source: HopSource }
export interface FermentationGuidePlan {
  goal: FermentationGoal; name: string; rationale: string; source: HopSource;
  pitchTemperatureC: HopExperimentalParameter;
  phases: {
    id: string; name: string; kind: 'primaire' | 'reposDiacetyle';
    temperatureC: HopExperimentalParameter; days: HopExperimentalParameter; completeWhen: string;
  }[];
  notes: { text: string; source: HopSource }[];
}
/** Sourced operating guidance, not a concentration or sensory prediction. */
export interface FermentationGuide {
  id: string; kind: 'fermentation'; name: string; version: string; enabled: boolean; source: HopSource;
  yeastId: string; aliases: string[]; styles: string[];
  aroma: { banana: string; phenols: string; summary?: string; pof: 'positive' | 'negative' | 'unknown'; source: HopSource };
  temperatureC: FermentationFact; attenuationPct?: FermentationFact; dryPitchGHL?: FermentationFact;
  plans: FermentationGuidePlan[];
}

export function assertFermentationGuide(v: any): asserts v is FermentationGuide {
  const object = (x: any) => !!x && typeof x === 'object' && !Array.isArray(x);
  const check = (ok: any, why: string) => { if (!ok) throw Error(`Guide de fermentation : ${why}.`); };
  const text = (x: any) => typeof x === 'string' && !!x.trim();
  const keys = (x: any, allowed: string[]) => check(object(x) && Object.keys(x).every(k => allowed.includes(k)), 'champ inconnu');
  const source = (x: any, dated = false) => check(!hopSourceError(x, dated), 'provenance absente ou invalide');
  const fact = (x: any, lower: number, upper = Infinity) => {
    keys(x, ['range', 'source']); check(validHopRange(x.range) && x.range.min >= lower && x.range.max <= upper, 'plage documentaire invalide'); source(x.source);
  };
  const parameter = (x: any, lower: number, upper = Infinity) => {
    keys(x, ['range', 'central', 'source']);
    check(validHopRange(x.range) && x.range.min >= lower && x.range.max <= upper && Number.isFinite(x.central) && x.central >= x.range.min && x.central <= x.range.max, 'consigne proposée invalide'); source(x.source, true);
  };
  keys(v, ['id', 'kind', 'name', 'version', 'enabled', 'source', 'yeastId', 'aliases', 'styles', 'aroma', 'temperatureC', 'attenuationPct', 'dryPitchGHL', 'plans']);
  check(v.kind === 'fermentation' && text(v.version) && typeof v.enabled === 'boolean' && text(v.yeastId), 'identité invalide'); source(v.source, true);
  check(Array.isArray(v.aliases) && v.aliases.every(text) && Array.isArray(v.styles) && v.styles.length > 0 && v.styles.every(text), 'noms ou styles invalides');
  keys(v.aroma, ['banana', 'phenols', 'summary', 'pof', 'source']);
  check(v.aroma.summary === undefined || text(v.aroma.summary), 'description aromatique invalide');
  check(text(v.aroma.banana) && text(v.aroma.phenols) && ['positive', 'negative', 'unknown'].includes(v.aroma.pof), 'profil documentaire incomplet'); source(v.aroma.source);
  fact(v.temperatureC, -273.15);
  if (v.attenuationPct !== undefined) fact(v.attenuationPct, 0, 100);
  if (v.dryPitchGHL !== undefined) { fact(v.dryPitchGHL, 0); check(v.dryPitchGHL.range.min > 0, 'dose strictement positive requise'); }
  check(Array.isArray(v.plans) && v.plans.length > 0 && new Set(v.plans.map((p: any) => p.goal)).size === v.plans.length, 'objectifs absents ou dupliqués');
  for (const p of v.plans) {
    keys(p, ['goal', 'name', 'rationale', 'source', 'pitchTemperatureC', 'phases', 'notes']);
    check(FERMENTATION_GOALS.includes(p.goal) && text(p.name) && text(p.rationale), 'objectif invalide'); source(p.source, true);
    parameter(p.pitchTemperatureC, v.temperatureC.range.min, v.temperatureC.range.max);
    check(Array.isArray(p.phases) && p.phases.length > 0 && new Set(p.phases.map((s: any) => s.id)).size === p.phases.length, 'paliers absents ou dupliqués');
    for (const s of p.phases) {
      keys(s, ['id', 'name', 'kind', 'temperatureC', 'days', 'completeWhen']);
      check(text(s.id) && text(s.name) && ['primaire', 'reposDiacetyle'].includes(s.kind) && text(s.completeWhen), 'palier invalide');
      parameter(s.temperatureC, v.temperatureC.range.min, v.temperatureC.range.max); parameter(s.days, 0);
      check(s.days.range.min > 0, 'durée strictement positive requise');
    }
    check(Array.isArray(p.notes), 'notes absentes');
    for (const n of p.notes) { keys(n, ['text', 'source']); check(text(n.text), 'note vide'); source(n.source); }
  }
}
