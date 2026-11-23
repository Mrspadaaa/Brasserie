import { hopSourceError, validHopRange, type HopRange, type HopSource } from './hopIndexSchema.js';
import { NOLO_SUGARS, type NoloSugar } from './noloSchema.js';
/** Documentary lookup only. No fitted conversion coefficient can enter here. */
export interface IngredientFermentationFacts {
  version: 1; strainName: string; source: HopSource; retrievedAt: string; conditions: string;
  sugars: Partial<Record<NoloSugar, 'yes' | 'no' | 'unknown'>>;
  pof: 'positive' | 'negative' | 'unknown'; hydrolysis: 'positive' | 'negative' | 'unknown';
  pitchGL?: HopRange; temperatureC?: HopRange; durationDays?: HopRange;
}
export function readIngredientFermentationFacts(v: unknown): IngredientFermentationFacts | undefined {
  const r = v as IngredientFermentationFacts;
  if (!r || r.version !== 1 || typeof r.strainName !== 'string' || !r.strainName.trim() || hopSourceError(r.source) ||
    typeof r.retrievedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(r.retrievedAt) || !Number.isFinite(Date.parse(r.retrievedAt)) ||
    typeof r.conditions !== 'string' || !r.conditions.trim() || !r.sugars || typeof r.sugars !== 'object' || Array.isArray(r.sugars) ||
    !['positive','negative','unknown'].includes(r.pof) || !['positive','negative','unknown'].includes(r.hydrolysis)) return;
  if (Object.entries(r.sugars).some(([s, value]) => !NOLO_SUGARS.includes(s as NoloSugar) || !['yes','no','unknown'].includes(value))) return;
  for (const k of ['pitchGL','temperatureC','durationDays'] as const)
    if (r[k] !== undefined && (!validHopRange(r[k]) || r[k]!.min < 0)) return;
  return { version:1, strainName:r.strainName, source:r.source, retrievedAt:r.retrievedAt, conditions:r.conditions, sugars:{...r.sugars},
    pof:r.pof, hydrolysis:r.hydrolysis, ...(r.pitchGL?{pitchGL:r.pitchGL}:{}), ...(r.temperatureC?{temperatureC:r.temperatureC}:{}), ...(r.durationDays?{durationDays:r.durationDays}:{}) };
}
