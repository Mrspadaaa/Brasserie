import type { HopRange, HopSource } from './hopIndexSchema.js';
import type { HopYeast } from './hopPredictionSchema.js';

export type FermentationRange = { range: HopRange; source: HopSource };
/** A qualified bound or a non-beer application is not a brewing operating range. */
export function agreedFermentationFact(yeast: HopYeast | undefined, key: 'temperature' | 'attenuation', unit: string): FermentationRange | undefined {
  const facts = yeast?.catalogue?.facts.filter(f => f.key === key) ?? [], first = facts[0];
  if (!first?.range || !facts.every(f => f.qualifier === 'range' && f.unit === unit &&
    f.range?.min === first.range!.min && f.range?.max === first.range!.max && (!f.context || f.context === 'Beer'))) return undefined;
  return { range: first.range, source: first.source };
}

export type FermentationPhase = { name?: string; note?: string; kind?: string; tempC?: number | null; days?: number | null };
export type FermentationIssue = { code: 'no-primary' | 'phase' | 'duration' | 'temperature' | 'outside' | 'pitch' | 'window' | 'dry-hop'; message: string; source?: HopSource };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const namesDryHop = (s: FermentationPhase) => s.kind === 'ajout' && /houblonnage\s+[àa]\s+cru|dry[ -]?hop/iu.test(`${s.name ?? ''} ${s.note ?? ''}`);

/** Shared process checks. No numerical aroma effect is inferred from a warning.
 * Only primary/rest phases use the fermentation window; cold conditioning and
 * bottle refermentation have their own context. A named event creates no ingredient. */
export function fermentationProgramIssues(steps: FermentationPhase[], temperature?: FermentationRange,
  options: { pitchTempC?: number; hasDryHop?: boolean; checkAdditions?: boolean } = {}): FermentationIssue[] {
  const issues: FermentationIssue[] = [];
  if (!steps.some(s => s.kind === 'primaire' || s.kind === 'reposDiacetyle')) issues.push({ code: 'no-primary', message: 'Aucun palier de fermentation principale renseigné.' });
  for (const s of steps) {
    const name = s.name || 'Palier';
    if (!s.kind || !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(s.kind)) issues.push({ code: 'phase', message: `${name} : phase inconnue, effet sur la fermentation non évalué.` });
    if (!finite(s.days) || s.days < 0) issues.push({ code: 'duration', message: `${name} : durée inconnue ou invalide.` });
    if (s.kind !== 'primaire' && s.kind !== 'reposDiacetyle') continue;
    if (!finite(s.tempC)) issues.push({ code: 'temperature', message: `${name} : température inconnue.` });
    else if (temperature && (s.tempC < temperature.range.min || s.tempC > temperature.range.max)) issues.push({ code: 'outside', message: `${name} : ${s.tempC} °C, hors de la fenêtre fabricant (${temperature.range.min}–${temperature.range.max} °C).`, source: temperature.source });
  }
  if (!temperature) issues.push({ code: 'window', message: 'Fenêtre de température absente ou sources non concordantes.' });
  if (finite(options.pitchTempC) && temperature && (options.pitchTempC < temperature.range.min || options.pitchTempC > temperature.range.max)) issues.push({ code: 'pitch', message: 'Ensemencement hors de la fenêtre de fermentation fabricant ; vérifier la consigne spécifique d’ensemencement.', source: temperature.source });
  if (options.checkAdditions !== false && options.hasDryHop === false && steps.some(namesDryHop)) issues.push({ code: 'dry-hop', message: 'Le calendrier nomme un houblonnage à cru, mais aucun ajout à cru ne figure dans la recette. Ce palier ne crée pas un effet aromatique.' });
  return issues;
}
