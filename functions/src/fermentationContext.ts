import type { HopRange, HopSource } from './hopIndexSchema.js';
import type { HopYeast } from './hopPredictionSchema.js';
import type { YeastTechnicalFact } from './yeastTechnicalFacts.js';

export type FermentationRange = { range: HopRange; source: HopSource };
export type RecipeFermentationTemperature = { range: HopRange; source?: HopSource };
const brewingContext = (context: string | undefined, key: string) => !context || /^(beer|bière|biere)$/i.test(context) ||
  // This collector annotation records a unit conversion, not a special process.
  key === 'temperature' && context === 'Conversion exacte Fahrenheit → Celsius, arrondie au dixième.';
/** A qualified bound or a non-beer application is not a brewing operating range. */
export function agreedFermentationFact(yeast: HopYeast | undefined, key: 'temperature' | 'attenuation' | 'pitchRate' | 'alcoholTolerance', unit: string): FermentationRange | undefined {
  const facts = yeast?.catalogue?.facts.filter(f => f.key === key) ?? [], first = facts[0];
  if (!first?.range || !facts.every(f => (f.qualifier === 'range' || key !== 'temperature' && f.qualifier === 'reportedPoint') && f.unit === unit &&
    f.range?.min === first.range!.min && f.range?.max === first.range!.max && brewingContext(f.context, key))) return undefined;
  return { range: first.range, source: first.source };
}

/** The explicit recipe dossier is authoritative for this recipe only. null means
 * it contains a conflict/unsupported context: never fall back to the catalogue.
 * No fact means undefined, preserving the legacy guide/catalogue diagnostics. */
export function recipeFermentationTemperature(yeast: { technicalFacts?: YeastTechnicalFact[] } | undefined): RecipeFermentationTemperature | null | undefined {
  const facts = yeast?.technicalFacts?.filter(f => f.key === 'temperature') ?? [];
  if (!facts.length) return undefined;
  const first = facts[0];
  if (!first.range || !facts.every(f => f.qualifier === 'range' && f.unit === '°C' && f.range &&
    finite(f.range.min) && finite(f.range.max) && f.range.min >= 0 && f.range.max <= 60 &&
    f.range.min <= f.range.max && f.range.min === first.range!.min && f.range.max === first.range!.max && brewingContext(f.context, 'temperature'))) return null;
  const source: HopSource | undefined = first.source || first.sourceUrl ? { author: first.origin === 'manufacturer' ? 'Fiche fabricant' : first.origin === 'personal' ? 'Fiche personnelle' : 'Source proposée',
    title: first.source ?? first.reported, reference: first.sourceUrl ?? first.source!, kind: first.origin === 'manufacturer' ? 'manufacturer' : 'observation', year: null } : undefined;
  return { range: { ...first.range }, ...(source ? { source } : {}) };
}

export type FermentationPhase = { name?: string; note?: string; kind?: string; tempC?: number | null; days?: number | null };
export type FermentationIssue = { code: 'no-primary' | 'phase' | 'duration' | 'temperature' | 'outside' | 'pitch' | 'window' | 'dry-hop'; message: string; source?: HopSource };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const namesDryHop = (s: FermentationPhase) => s.kind === 'ajout' && /houblonnage\s+[àa]\s+cru|dry[ -]?hop/iu.test(`${s.name ?? ''} ${s.note ?? ''}`);

/** Shared process checks. No numerical aroma effect is inferred from a warning.
 * Only primary/rest phases use the fermentation window; cold conditioning and
 * bottle refermentation have their own context. A named event creates no ingredient. */
export function fermentationProgramIssues(steps: FermentationPhase[], temperature?: { range: HopRange; source?: HopSource },
  options: { pitchTempC?: number; hasDryHop?: boolean; checkAdditions?: boolean; requireWindow?: boolean; windowLabel?: string } = {}): FermentationIssue[] {
  const issues: FermentationIssue[] = [];
  const windowLabel = options.windowLabel ?? 'fenêtre fabricant';
  if (!steps.some(s => s.kind === 'primaire' || s.kind === 'reposDiacetyle')) issues.push({ code: 'no-primary', message: 'Aucun palier de fermentation principale renseigné.' });
  for (const s of steps) {
    const name = s.name || 'Palier';
    if (!s.kind || !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(s.kind)) issues.push({ code: 'phase', message: `${name} : phase inconnue, effet sur la fermentation non évalué.` });
    if (!finite(s.days) || s.days < 0) issues.push({ code: 'duration', message: `${name} : durée inconnue ou invalide.` });
    if (s.kind !== 'primaire' && s.kind !== 'reposDiacetyle') continue;
    if (!finite(s.tempC)) issues.push({ code: 'temperature', message: `${name} : température inconnue.` });
    else if (temperature && (s.tempC < temperature.range.min || s.tempC > temperature.range.max)) issues.push({ code: 'outside', message: `${name} : ${s.tempC} °C, hors de la ${windowLabel} (${temperature.range.min}–${temperature.range.max} °C).`, source: temperature.source });
  }
  if (!temperature && options.requireWindow !== false) issues.push({ code: 'window', message: 'Fenêtre de température absente ou sources non concordantes.' });
  if (finite(options.pitchTempC) && temperature && (options.pitchTempC < temperature.range.min || options.pitchTempC > temperature.range.max)) issues.push({ code: 'pitch', message: options.windowLabel ? `Ensemencement hors de la ${windowLabel} ; vérifier la consigne spécifique d’ensemencement.` : 'Ensemencement hors de la fenêtre de fermentation fabricant ; vérifier la consigne spécifique d’ensemencement.', source: temperature.source });
  if (options.checkAdditions !== false && options.hasDryHop === false && steps.some(namesDryHop)) issues.push({ code: 'dry-hop', message: 'Le calendrier nomme un houblonnage à cru, mais aucun ajout à cru ne figure dans la recette. Ce palier ne crée pas un effet aromatique.' });
  return issues;
}
