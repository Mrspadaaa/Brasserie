import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { YeastCatalogueFact, YeastFactKey } from '../../functions/src/yeastCatalogueSchema';
import { YEAST_PRACTICAL_GUIDES, type YeastPracticalNote } from '../data/yeastPracticalGuides';

const LABELS = {
  temperature: 'Fermentation', attenuation: 'Atténuation apparente', alcoholTolerance: 'Tolérance à l’alcool',
  flocculation: 'Floculation', pof: 'Statut POF', sta1: 'Gène STA1', diastatic: 'Caractère diastatique', pitchRate: 'Dose fabricant',
} as const;
const NOTE_LABELS: Partial<Record<YeastFactKey, string>> = { aroma: 'Arômes décrits', esters: 'Esters décrits', higherAlcohols: 'Alcools supérieurs', betaLyase: 'Activité β-lyase', biotransformation: 'Interactions aromatiques', application: 'Usage et conduite', foam: 'Mousse', nutrientNeed: 'Nutrition', h2s: 'Soufre', fermentationRate: 'Déroulement', fermentationTime: 'Durée documentée' };
// Presentation grouping for the named, source-checked catalogue observations. No process inference.
const PRACTICAL_PHASES: Partial<Record<string, YeastPracticalNote['phase']>> = {
  'Ensemencement direct': 'preparation', 'Réhydratation facultative': 'preparation',
  'Préparer l’inoculum': 'preparation', 'Préparer le conditionnement liquide': 'preparation',
  'Sachet ouvert': 'storage', 'Gamme et conservation': 'storage',
};
const FR: Record<string, string> = { low: 'Faible', medium: 'Moyenne', high: 'Forte', 'very high': 'Très forte', 'medium-high': 'Moyenne à forte', 'medium to high': 'Moyenne à forte', 'low to medium': 'Faible à moyenne', 'medium-low': 'Faible à moyenne', positive: 'Positif', negative: 'Négatif', yes: 'Oui', no: 'Non', 'pof+': 'Positif', 'pof-': 'Négatif', unknown: 'Non documenté' };
const format = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
/** Bounds and conditions remain documentary: a tolerance threshold is never a predicted ABV. */
export function yeastFactValue(fact: YeastCatalogueFact): string {
  if (!fact.range) return FR[fact.reported.trim().toLowerCase()] ?? fact.reported;
  const { min, max } = fact.range;
  const prefix = fact.qualifier === 'atLeast' ? '≥ ' : fact.qualifier === 'upTo' ? '≤ ' : '';
  return `${prefix}${format(min)}${min === max ? '' : `–${format(max)}`} ${fact.unit === 'd' ? 'j' : fact.unit}`;
}
export function yeastStrainInformation(reference: HopYeast | undefined, actualForm: HopYeast['form']) {
  if (!reference) return null;
  // Preserve different sources and conditions, even when their numeric interval is identical.
  const observations = [...new Map((reference.catalogue?.facts ?? []).map(f => [JSON.stringify(f), f])).values()];
  const facts = Object.entries(LABELS).map(([key, label]) => {
    const rows = observations.filter(f => f.key === key);
    const values = rows.map(f => ({ value: yeastFactValue(f), reported: f.reported, condition: f.context === 'Beer' ? undefined : f.context, source: f.source }));
    const sedimentation = key === 'flocculation' && rows.some(f => /s[ée]dimentation/i.test(f.label));
    const metricLabel = sedimentation ? rows.every(f => /s[ée]dimentation/i.test(f.label)) ? 'Sédimentation' : 'Floculation / sédimentation' : label;
    return { key, label: metricLabel, values, multiple: new Set(values.map(v => v.value)).size > 1 };
  });
  const guide = YEAST_PRACTICAL_GUIDES[reference.id];
  const formConfirmed = !!actualForm && !!reference.form && actualForm === reference.form;
  const guideMatches = guide && guide.form === reference.form;
  const catalogueNotes = observations.filter(f => NOTE_LABELS[f.key]).map((f, i): YeastPracticalNote => ({
    id: `catalogue-${i}`, title: f.key === 'application' ? f.label : NOTE_LABELS[f.key]!, detail: `${yeastFactValue(f)}${f.context && f.context !== 'Beer' ? ` · ${f.context}` : ''}`,
    phase: f.key === 'application' ? PRACTICAL_PHASES[f.label] ?? 'fermentation' : 'fermentation', source: f.source,
  }));
  const productProtocols = [...guideMatches ? guide.notes : [], ...catalogueNotes.filter(n => n.phase !== 'fermentation')];
  const practical = formConfirmed ? productProtocols.map(n => ({ ...n })) : [];
  // Documentary behaviour does not become an instruction to dose or package.
  const behaviour = formConfirmed ? catalogueNotes.filter(n => n.phase === 'fermentation') : [];
  const sources = [...new Map([...observations.map(f => f.source), ...practical.map(n => n.source), reference.source].map(s => [JSON.stringify(s), s])).values()];
  return { yeastId: reference.id, name: reference.name, form: reference.form, formConfirmed, facts, observations, practical, behaviour, sources,
    preparationWithheld: productProtocols.some(n => n.phase === 'preparation') && !formConfirmed,
    preparationDocumented: practical.some(n => n.phase === 'preparation'),
    retrievedAt: reference.catalogue?.retrievals.map(r => r.retrievedAt).sort().at(-1) ?? null,
  };
}
export type YeastStrainInformation = NonNullable<ReturnType<typeof yeastStrainInformation>>;
