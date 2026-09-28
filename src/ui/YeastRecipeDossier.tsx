import { useId, useMemo, useState, type ReactNode } from 'react';
import type { YeastSpec } from '../types';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { Input, Textarea } from './Input';
import { NumberInput } from './NumberInput';
import { Units } from '../services/units';
import { YEAST_FACT_LABELS } from '../domain/yeastCatalogue';
import { beerSheetContext, editYeastDocumentaryNote, mergeYeastTechnicalFacts } from '../domain/ingredientFacts';
import { resolveYeastDossier, type YeastDossierMeasurement } from '../domain/yeastProjection';
import { resolveFermentationYeast } from '../domain/fermentationScenario';
import { yeastReferences } from '../domain/yeastReferences';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { yeastWithAdoptedDocumentary } from '../services/recipeDraft';
import { readYeastFactValue, readYeastTechnicalFacts, type YeastDocumentaryNote, type YeastFactValue, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

const units = ['g', 'kg', 'mL', 'L', 'sachet', 'flacon', 'paquet'];
// Observations that may fill a recipe field or a calculation.
const fieldKeys = new Set(['temperature', 'attenuation', 'alcoholTolerance', 'flocculation', 'form', 'fermentationTime']);
const exact = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 20 });
const fold = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const OPERATORS = { atLeast: '≥', upTo: '≤', greaterThan: '>', lessThan: '<' } as const;
const owns = (value: object | undefined, key: PropertyKey) => !!value && Object.prototype.hasOwnProperty.call(value, key);

export type YeastDocumentaryKey = 'temperature' | 'attenuation' | 'alcoholTolerance';
export type YeastSheetKey = YeastDocumentaryKey | 'flocculation';
/** Unit stored with the observation, unit shown to the brewer, and the limits already used by the readers. */
export const YEAST_DOCUMENTARY_UNITS: Record<YeastDocumentaryKey, { unit: string; shown: string; min: number; max: number }> = {
  temperature: { unit: '°C', shown: '°C', min: -5, max: 60 },
  attenuation: { unit: '%', shown: '%', min: 0, max: 100 },
  alcoholTolerance: { unit: '%', shown: '% vol', min: 0, max: 100 },
};
export const YEAST_SHEET_LABELS: Record<YeastSheetKey, string> = {
  temperature: 'Température de fermentation', attenuation: 'Atténuation annoncée', alcoholTolerance: 'Tolérance à l’alcool', flocculation: 'Floculation',
};
export const YEAST_VALUE_KIND: Record<YeastFactValue['kind'], string> = { range: 'plage', point: 'valeur ponctuelle', bound: 'borne', category: 'catégorie', unknown: 'inconnu' };

/** Typed reading of a retained measurement: a bound stays a bound, a point never becomes a range. */
export function yeastMeasurementValue(measurement?: Pick<YeastDossierMeasurement, 'range' | 'qualifier'>): YeastFactValue {
  if (!measurement) return { kind: 'unknown' };
  const { range, qualifier } = measurement;
  if (qualifier === 'range') return { kind: 'range', min: range.min, max: range.max, qualifier };
  if (qualifier === 'reportedPoint') return { kind: 'point', value: range.min, qualifier };
  return { kind: 'bound', value: range.min, qualifier, operator: OPERATORS[qualifier] };
}

/** One wording for every typed value: never a midpoint, never a bound written as a point. */
export function yeastValueText(value: YeastFactValue, unit = ''): string {
  const suffix = unit ? ` ${unit}` : '';
  if (value.kind === 'range') return `${exact(value.min)}–${exact(value.max)}${suffix}`;
  if (value.kind === 'point') return `${exact(value.value)}${suffix} · valeur ponctuelle`;
  if (value.kind === 'bound') return `${value.operator} ${exact(value.value)}${suffix}`;
  if (value.kind === 'category') return value.value;
  return 'Inconnu';
}

const FLOCCULATION_CATEGORIES = ['Faible', 'Faible à moyenne', 'Moyenne', 'Moyenne à élevée', 'Élevée', 'Très élevée'];
const FLOCCULATION_WORDS: Record<string, string> = {
  low: 'Faible', faible: 'Faible', basse: 'Faible', 'low-medium': 'Faible à moyenne', 'medium-low': 'Faible à moyenne', 'faible a moyenne': 'Faible à moyenne',
  medium: 'Moyenne', moyenne: 'Moyenne', moyen: 'Moyenne', 'medium-high': 'Moyenne à élevée', 'moyenne a elevee': 'Moyenne à élevée',
  high: 'Élevée', elevee: 'Élevée', haute: 'Élevée', 'very high': 'Très élevée', 'tres elevee': 'Très élevée',
};
/** A translated manufacturer category is the same category; any other wording stays as published. */
export const yeastCategoryKey = (text: string) => { const key = fold(text).replace(/\s*-\s*/g, '-'); return FLOCCULATION_WORDS[key] ?? key; };

type YeastHistoricalScalarReading = NonNullable<ReturnType<typeof resolveYeastDossier>['historicalScalarReading']>;
export interface YeastRetainedValue {
  value: YeastFactValue; unit: string;
  historical?: YeastHistoricalScalarReading;
  origin?: YeastTechnicalFact['origin']; source?: string; sourceUrl?: string;
  /** The retained observation itself when the sheet holds it (selection or agreeing local fact). */
  fact?: YeastTechnicalFact;
  /** An explicit reviewed unknown: older scalars no longer stand in for it. */
  reviewedUnknown: boolean;
}

/** Retained documentary values, read exactly as the projection reads them. */
export function yeastRetainedValues(yeast: YeastSpec, reference?: HopYeast): Record<YeastSheetKey, YeastRetainedValue> {
  yeast = yeastWithAdoptedDocumentary(yeast);
  const dossier = resolveYeastDossier(yeast, reference);
  const local = readYeastTechnicalFacts(yeast.technicalFacts ?? []) ?? [];
  const provenance = (key: YeastSheetKey, same: (fact: YeastTechnicalFact) => boolean, measurement?: YeastDossierMeasurement):
    Partial<Pick<YeastRetainedValue, 'origin' | 'source' | 'sourceUrl' | 'fact'>> => {
    const selected = yeast.technicalSelections?.[key];
    const fact = selected ?? local.find(item => item.key === key && beerSheetContext(item.context, key) && same(item));
    if (fact) return { origin: fact.origin, source: fact.source, sourceUrl: fact.sourceUrl, fact };
    const source = measurement?.sources[0];
    // A value typed in the recipe cites its notice, not the strain name used as a title.
    return source ? { origin: source.kind === 'manufacturer' ? 'manufacturer' as const : 'personal' as const,
      source: source.title && source.title !== yeast.name ? source.title : source.reference,
      sourceUrl: /^https?:\/\//.test(source.reference) ? source.reference : undefined } : {};
  };
  const measured = (key: YeastDocumentaryKey, measurement?: YeastDossierMeasurement): YeastRetainedValue => ({
    value: yeastMeasurementValue(measurement), unit: YEAST_DOCUMENTARY_UNITS[key].shown,
    ...(measurement ? provenance(key, fact => !!fact.range && fact.range.min === measurement.range.min && fact.range.max === measurement.range.max && fact.qualifier === measurement.qualifier, measurement) : {}),
    reviewedUnknown: owns(yeast.technicalSelections, key) && yeast.technicalSelections?.[key] === null,
  });
  const flocculation = dossier.flocculation;
  return {
    temperature: measured('temperature', dossier.temperature),
    attenuation: { ...measured('attenuation', dossier.documentedAttenuation), historical: dossier.historicalScalarReading },
    alcoholTolerance: measured('alcoholTolerance', dossier.alcoholTolerance),
    flocculation: { value: flocculation.value, unit: '', origin: flocculation.origin, source: flocculation.source, sourceUrl: flocculation.sourceUrl,
      ...(flocculation.value.kind === 'category' ? { fact: provenance('flocculation', item => yeastCategoryKey(item.reported) === yeastCategoryKey(flocculation.reported ?? '')).fact } : {}),
      reviewedUnknown: owns(yeast.technicalSelections, 'flocculation') && yeast.technicalSelections?.flocculation === null },
  };
}

const explicitHypothesis = (yeast: YeastSpec) => yeast.attenuationBasis === 'recipe' || yeast.attenuationBasis === 'measured' ||
  yeast.attenuationBasis === undefined && yeast.attenuationPct != null && !owns(yeast.technicalSelections, 'attenuation');

/** Retain one reviewed documentary value. Legacy scalars follow only where they can represent it exactly. */
export function withRetainedYeastFact(yeast: YeastSpec, key: YeastSheetKey, fact: YeastTechnicalFact | null): YeastSpec {
  const next: YeastSpec = { ...yeast, technicalSelections: { ...yeast.technicalSelections, [key]: fact },
    technicalFacts: fact ? mergeYeastTechnicalFacts(yeast.technicalFacts, [fact]) : yeast.technicalFacts };
  const range = fact?.range;
  if (key === 'temperature') {
    const bounds = fact?.qualifier === 'range' && !!range && range.min < range.max;
    next.fermTempMinC = bounds ? range!.min : undefined; next.fermTempMaxC = bounds ? range!.max : undefined;
  } else if (key === 'attenuation') {
    if (!explicitHypothesis(yeast)) {
      next.attenuationPct = fact?.qualifier === 'reportedPoint' ? range!.min : undefined;
      next.attenuationBasis = fact ? 'declared' : undefined;
    }
  } else if (key === 'alcoholTolerance') next.alcoholTolerancePct = fact?.qualifier === 'reportedPoint' ? range!.min : undefined;
  else next.flocculation = fact?.reported;
  return next;
}

/** Remove the brewer's own correction and let the published observations speak again. */
function withoutPersonalCorrection(yeast: YeastSpec, key: YeastSheetKey): YeastSpec {
  const { [key]: _removed, ...selections } = yeast.technicalSelections ?? {};
  const facts = yeast.technicalFacts?.filter(fact => !(fact.key === key && fact.origin === 'personal'));
  const next: YeastSpec = { ...yeast, technicalSelections: Object.keys(selections).length ? selections : undefined, technicalFacts: facts?.length ? facts : undefined };
  if (key === 'temperature') { next.fermTempMinC = undefined; next.fermTempMaxC = undefined; }
  else if (key === 'attenuation' && !explicitHypothesis(yeast)) { next.attenuationPct = undefined; next.attenuationBasis = undefined; }
  else if (key === 'alcoholTolerance') next.alcoholTolerancePct = undefined;
  else if (key === 'flocculation') next.flocculation = undefined;
  return next;
}

type MeasuredKind = 'choose' | 'range' | 'reportedPoint' | 'atLeast' | 'greaterThan' | 'upTo' | 'lessThan' | 'unknown';
const MEASURED_KINDS: { value: MeasuredKind; label: string }[] = [
  { value: 'range', label: 'Plage (min–max)' }, { value: 'reportedPoint', label: 'Valeur ponctuelle publiée' },
  { value: 'atLeast', label: 'Au moins (≥)' }, { value: 'greaterThan', label: 'Strictement supérieur (>)' },
  { value: 'upTo', label: 'Au plus (≤)' }, { value: 'lessThan', label: 'Strictement inférieur (<)' }, { value: 'unknown', label: 'Inconnu' },
];
const originLabel = (origin?: YeastTechnicalFact['origin']) => origin === 'manufacturer' ? 'Fabricant' : origin === 'ai' ? 'Recherche IA' : origin === 'personal' ? 'Donnée personnelle' : undefined;
const sourceFact = (text: string) => { const trimmed = text.trim(); return { source: trimmed || 'Correction manuelle de la fiche', ...(/^https?:\/\//.test(trimmed) ? { sourceUrl: trimmed } : {}) }; };
/** Correcting the brewer's own observation keeps its conditions, consultation date and, when unchanged, its source. */
const personalProvenance = (base: YeastTechnicalFact | undefined, source: string) => ({
  ...(base && source.trim() === (base.source ?? '') ? { ...(base.source ? { source: base.source } : {}), ...(base.sourceUrl ? { sourceUrl: base.sourceUrl } : {}) } : sourceFact(source)),
  context: base?.context ?? 'beer', ...(base?.retrievedAt ? { retrievedAt: base.retrievedAt } : {}),
});

function Provenance({ retained }: { retained: YeastRetainedValue }) {
  const origin = originLabel(retained.origin);
  if (!origin && !retained.source) return null;
  return <span className="yc-fact-provenance">{[origin, retained.sourceUrl ? undefined : retained.source].filter(Boolean).join(' · ')}
    {retained.sourceUrl && <>{origin ? ' · ' : ''}<a className="yeast-source" href={retained.sourceUrl} target="_blank" rel="noreferrer">{retained.source || 'source'}</a></>}</span>;
}

/** Typed entry of one measured sheet value. It returns a personal observation (or an explicit unknown) and writes nothing itself. */
export function YeastMeasuredFactEditor({ factKey, initial, base, historical, onRetain, onCancel, submitLabel = 'Retenir', extraAction }: {
  factKey: YeastDocumentaryKey; initial: YeastFactValue | { kind: 'range'; min: number; max: number };
  /** The brewer's own retained observation, whose conditions and date survive its correction. */
  base?: YeastTechnicalFact;
  /** An old scalar has no inferred type or origin; the brewer must choose its type explicitly. */
  historical?: YeastHistoricalScalarReading;
  onRetain: (fact: YeastTechnicalFact | null) => void; onCancel: () => void; submitLabel?: string; extraAction?: ReactNode;
}) {
  const id = useId(), unit = YEAST_DOCUMENTARY_UNITS[factKey], label = YEAST_SHEET_LABELS[factKey];
  const personal = base?.origin === 'personal' ? base : undefined;
  const [kind, setKind] = useState<MeasuredKind>(historical ? 'choose' : initial.kind === 'point' ? 'reportedPoint' : initial.kind === 'bound' ? initial.qualifier : 'range');
  const [min, setMin] = useState<number | undefined>(historical?.value ?? (initial.kind === 'range' ? initial.min : initial.kind === 'point' || initial.kind === 'bound' ? initial.value : undefined));
  const [max, setMax] = useState<number | undefined>(initial.kind === 'range' ? initial.max : undefined);
  const [source, setSource] = useState(personal?.source ?? historical?.source ?? '');
  const [error, setError] = useState('');
  const retain = () => {
    if (kind === 'choose') { setError('Choisis le type de cette ancienne valeur, ou indique explicitement qu’elle est inconnue.'); return; }
    if (kind === 'unknown') { onRetain(null); return; }
    const inside = (value?: number): value is number => value != null && Number.isFinite(value) && value >= unit.min && value <= unit.max;
    if (!inside(min) || kind === 'range' && !inside(max)) { setError(`Saisis ${kind === 'range' ? 'deux bornes' : 'une valeur'} entre ${exact(unit.min)} et ${exact(unit.max)} ${unit.shown}.`); return; }
    if (kind === 'range' && max! <= min) { setError('Le maximum doit dépasser le minimum. Pour une valeur unique, choisis « Valeur ponctuelle publiée ».'); return; }
    const upper = kind === 'range' ? max! : min;
    const reported = kind === 'range' ? `${exact(min)}–${exact(upper)} ${unit.unit}` : kind === 'reportedPoint' ? `${exact(min)} ${unit.unit}` : `${OPERATORS[kind]} ${exact(min)} ${unit.unit}`;
    const fact = readYeastTechnicalFacts([{ key: factKey, reported, range: { min, max: upper }, unit: unit.unit, qualifier: kind, origin: 'personal', ...personalProvenance(personal, source) }])?.[0];
    if (!fact) { setError('Valeur ou source illisible. Vérifie la saisie.'); return; }
    setError(''); onRetain(fact);
  };
  return <fieldset className="yc-fact-editor"><legend className="sr-only">Corriger {label}</legend>
    <label htmlFor={`${id}-kind`}>Type de valeur<select id={`${id}-kind`} aria-label={`Type de valeur · ${label}`} value={kind} onChange={e => { setKind(e.target.value as MeasuredKind); setError(''); }}>
      {historical && <option value="choose" disabled>Choisir le type de l’ancienne valeur…</option>}
      {MEASURED_KINDS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {kind !== 'unknown' && kind !== 'choose' && <div className="yc-input-pair">
      <label>{kind === 'range' ? 'Minimum' : 'Valeur'} · {unit.shown}<NumberInput aria-label={`${label} · ${kind === 'range' ? 'minimum' : 'valeur'}`} min={unit.min} max={unit.max} value={min} emptyValue={undefined} onValue={setMin} /></label>
      {kind === 'range' && <label>Maximum · {unit.shown}<NumberInput aria-label={`${label} · maximum`} min={unit.min} max={unit.max} value={max} emptyValue={undefined} onValue={setMax} /></label>}
    </div>}
    {kind !== 'unknown' && kind !== 'choose' && <label>Source de cette valeur<Input aria-label={`Source · ${label}`} value={source} onChange={e => setSource(e.target.value)} placeholder="Fiche, URL, retour de brassin…" /></label>}
    {kind === 'choose' && <p className="yeast-small">L’ancienne valeur et sa source sont conservées. Précise son type pour la corriger.</p>}
    {kind === 'unknown' && <p className="yeast-small">La valeur sera marquée inconnue : aucune ancienne saisie ni observation ne la remplacera dans les calculs.</p>}
    {error && <p className="yeast-error" role="alert">{error}</p>}
    <div className="yc-fact-actions"><button type="button" onClick={retain}>{submitLabel}</button>
      <button type="button" className="yeast-link" onClick={onCancel}>Annuler</button>{extraAction}</div>
  </fieldset>;
}

type CategoryKind = 'category' | 'text' | 'unknown';
/** Category, manufacturer wording or explicit unknown; a category is never turned into a score. */
export function YeastFlocculationEditor({ initial, base, onRetain, onCancel, submitLabel = 'Retenir' }: {
  initial: string; base?: YeastTechnicalFact; onRetain: (fact: YeastTechnicalFact | null) => void; onCancel: () => void; submitLabel?: string;
}) {
  const id = useId(), label = YEAST_SHEET_LABELS.flocculation;
  const personal = base?.origin === 'personal' ? base : undefined;
  const known = initial ? FLOCCULATION_CATEGORIES.find(category => category === yeastCategoryKey(initial)) : undefined;
  const [kind, setKind] = useState<CategoryKind>(initial && !known ? 'text' : 'category');
  const [category, setCategory] = useState(known ?? '');
  const [text, setText] = useState(initial);
  const [source, setSource] = useState(personal?.source ?? '');
  const [error, setError] = useState('');
  const retain = () => {
    if (kind === 'unknown') { onRetain(null); return; }
    const reported = (kind === 'category' ? category : text).trim();
    if (!reported) { setError(kind === 'category' ? 'Choisis une catégorie.' : 'Saisis le texte publié par le fabricant.'); return; }
    const fact = readYeastTechnicalFacts([{ key: 'flocculation', reported, origin: 'personal', ...personalProvenance(personal, source) }])?.[0];
    if (!fact) { setError('Texte ou source illisible.'); return; }
    setError(''); onRetain(fact);
  };
  return <fieldset className="yc-fact-editor"><legend className="sr-only">Corriger {label}</legend>
    <label htmlFor={`${id}-kind`}>Type de valeur<select id={`${id}-kind`} aria-label={`Type de valeur · ${label}`} value={kind} onChange={e => { setKind(e.target.value as CategoryKind); setError(''); }}>
      <option value="category">Catégorie</option><option value="text">Texte du fabricant</option><option value="unknown">Inconnue</option></select></label>
    {kind === 'category' && <label htmlFor={`${id}-category`}>Catégorie<select id={`${id}-category`} aria-label={`${label} · catégorie`} value={category} onChange={e => setCategory(e.target.value)}>
      <option value="">Choisir…</option>{FLOCCULATION_CATEGORIES.map(option => <option key={option}>{option}</option>)}</select></label>}
    {kind === 'text' && <label>Texte publié<Input aria-label={`${label} · texte du fabricant`} value={text} onChange={e => setText(e.target.value)} /></label>}
    {kind !== 'unknown' && <label>Source de cette valeur<Input aria-label={`Source · ${label}`} value={source} onChange={e => setSource(e.target.value)} placeholder="Fiche, URL…" /></label>}
    {kind === 'category' && <p className="yeast-small">Une catégorie reste une catégorie : elle n’est convertie ni en score ni en chiffre.</p>}
    {error && <p className="yeast-error" role="alert">{error}</p>}
    <div className="yc-fact-actions"><button type="button" onClick={retain}>{submitLabel}</button>
      <button type="button" className="yeast-link" onClick={onCancel}>Annuler</button></div>
  </fieldset>;
}

/** Read the retained value first; correct it with an explicit type, never through an empty scalar box. */
function MeasuredFactRow({ yeast, factKey, retained, others, observations, onChange, invalidScalars }: {
  yeast: YeastSpec; factKey: YeastDocumentaryKey; retained: YeastRetainedValue; others: number; onChange: (value: YeastSpec) => void;
  observations: YeastTechnicalFact[];
  invalidScalars?: { min: number; max: number };
}) {
  const unit = YEAST_DOCUMENTARY_UNITS[factKey], label = YEAST_SHEET_LABELS[factKey];
  const [open, setOpen] = useState(!!invalidScalars);
  const personal = retained.origin === 'personal' && owns(yeast.technicalSelections, factKey);
  const textOnly = retained.value.kind === 'unknown' ? observations.filter(fact => fact.key === factKey
    && beerSheetContext(fact.context, factKey) && readYeastFactValue(fact).value.kind === 'category') : [];
  const historicalReading = retained.reviewedUnknown ? undefined : retained.historical;
  const selected = owns(yeast.technicalSelections, factKey) && yeast.technicalSelections?.[factKey];
  const historical = selected ? undefined : historicalReading;
  return <div role="group" aria-label={label} className="yc-fact-row" data-sheet-fact={factKey} data-value-kind={retained.value.kind}
    id={factKey === 'temperature' ? 'wz-yeast-range' : undefined} tabIndex={factKey === 'temperature' ? -1 : undefined}>
    <div className="yc-fact-reading"><span className="yc-fact-label">{label}</span>
      <span className={!historical && retained.value.kind === 'unknown' ? 'yc-compare-missing' : 'yc-number'} data-fact-reading>{historical ? `${exact(historical.value)} ${unit.shown}` : retained.value.kind === 'unknown'
        ? retained.reviewedUnknown ? 'Inconnue après revue' : textOnly.length ? 'Lecture numérique inconnue' : 'Non renseignée' : yeastValueText(retained.value, unit.shown)}</span>
      {historical ? <span className="yeast-small" data-historical-scalar>Valeur historique · qualification et origine non renseignées
        {historical.source ? ` · ${historical.source}` : ' · source non renseignée'}</span>
        : retained.value.kind !== 'unknown' && retained.value.kind !== 'point' && <span className="yeast-small">{YEAST_VALUE_KIND[retained.value.kind]}</span>}
      {historical && retained.value.kind !== 'unknown' && <span className="yeast-small">Autre lecture documentée : {yeastValueText(retained.value, unit.shown)}<Provenance retained={retained} /></span>}
      {!historical && historicalReading && <span className="yeast-small" data-historical-scalar>Ancienne valeur conservée : {exact(historicalReading.value)} {unit.shown} · qualification et origine non renseignées
        {historicalReading.source ? ` · ${historicalReading.source}` : ' · source non renseignée'}</span>}
      {textOnly.map((fact,index) => <span key={index} className="yeast-small" data-unstructured-observation>
        Texte publié : <strong>{fact.reported}</strong> · {fact.origin === 'manufacturer' ? 'Fabricant' : fact.origin === 'personal' ? 'Personnel' : 'IA'}
        {fact.sourceUrl ? <> · <a className="yeast-source" href={fact.sourceUrl} target="_blank" rel="noreferrer">{fact.source || 'Source'}</a></> : fact.source ? ` · ${fact.source}` : ' · source non renseignée'}
        <span className="block">Aucun point ni opérateur numérique retenu.</span>
      </span>)}
      {!historical && <Provenance retained={retained} />}
      {others > 0 && <span className="yeast-small">{others} autre{others > 1 ? 's' : ''} observation{others > 1 ? 's' : ''} conservée{others > 1 ? 's' : ''} ci-dessous</span>}
      {!open && <button type="button" className="yeast-link" aria-label={`Corriger ${label}`} onClick={() => setOpen(true)}>{!historical && retained.value.kind === 'unknown' ? 'Renseigner' : 'Corriger'}</button>}
    </div>
    {invalidScalars && <p role="alert" className="yeast-error">La température minimale enregistrée dépasse la maximale ({exact(invalidScalars.min)} &gt; {exact(invalidScalars.max)} °C). Corrige la plage.</p>}
    {open && <YeastMeasuredFactEditor factKey={factKey} initial={invalidScalars ? { kind: 'range', ...invalidScalars } : retained.value} base={retained.fact} historical={historical}
      onRetain={fact => { onChange(withRetainedYeastFact(yeast, factKey, fact)); setOpen(false); }} onCancel={() => setOpen(false)}
      extraAction={personal && others > 0 ? <button type="button" className="yeast-link" onClick={() => { onChange(withoutPersonalCorrection(yeast, factKey)); setOpen(false); }}>Rétablir les valeurs publiées</button> : undefined} />}
  </div>;
}

function FlocculationRow({ yeast, retained, onChange }: { yeast: YeastSpec; retained: YeastRetainedValue; onChange: (value: YeastSpec) => void }) {
  const label = YEAST_SHEET_LABELS.flocculation;
  const current = retained.value.kind === 'category' ? retained.value.value : '';
  const known = current ? FLOCCULATION_CATEGORIES.find(category => category === yeastCategoryKey(current)) : undefined;
  const [open, setOpen] = useState(false);
  return <div role="group" aria-label={label} className="yc-fact-row" data-sheet-fact="flocculation" data-value-kind={retained.value.kind}>
    <div className="yc-fact-reading"><span className="yc-fact-label">{label}</span>
      <span className={current ? 'yc-number' : 'yc-compare-missing'} data-fact-reading>{current || (retained.reviewedUnknown ? 'Inconnue après revue' : 'Non renseignée')}</span>
      {current && <span className="yeast-small">{known ? 'catégorie' : 'texte du fabricant'}</span>}
      <Provenance retained={retained} />
      {!open && <button type="button" className="yeast-link" aria-label={`Corriger ${label}`} onClick={() => setOpen(true)}>{current ? 'Corriger' : 'Renseigner'}</button>}
    </div>
    {open && <YeastFlocculationEditor initial={current} base={retained.fact} onRetain={fact => { onChange(withRetainedYeastFact(yeast, 'flocculation', fact)); setOpen(false); }} onCancel={() => setOpen(false)} />}
  </div>;
}

const noteOrigin = (note: YeastDocumentaryNote) => note.origin === 'ai' ? 'Recherche IA' : note.origin === 'manufacturer' ? 'Fabricant' : 'Note personnelle';

/** Narrative sheet notes keep their own provenance; editing one makes it personal, clearing all is explicit. */
function DocumentaryNotesEditor({ notes, onChange }: { notes: YeastSpec['documentaryNotes']; onChange: (notes: YeastDocumentaryNote[] | null) => void }) {
  const [editing, setEditing] = useState<number>();
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState('');
  const list = Array.isArray(notes) ? notes : [];
  const save = (index: number) => {
    const edited = editYeastDocumentaryNote(list[index], draft);
    if (!edited) return;
    onChange(list.map((note, at) => at === index ? edited : note)); setEditing(undefined);
  };
  return <div className="yc-documentary-notes" role="group" aria-label="Notes documentaires de la souche">
    <span className="yc-fact-label">Notes documentaires</span>
    {notes === null && <p className="yeast-small">Documentation narrative marquée inconnue.</p>}
    {notes !== null && !list.length && <p className="yeast-small">{notes === undefined ? 'Aucune note documentaire.' : 'Notes documentaires retirées.'}</p>}
    {list.length > 0 && <ul>{list.map((note, index) => <li key={`${index}-${note.text.slice(0, 24)}`} data-note-origin={note.origin}>
      {editing === index ? <div className="yc-fact-editor"><label>Texte de la note<Textarea aria-label="Texte de la note documentaire" value={draft} rows={3} onChange={e => setDraft(e.target.value)} /></label>
        <div className="yc-fact-actions"><button type="button" onClick={() => save(index)}>Enregistrer la note</button><button type="button" className="yeast-link" onClick={() => setEditing(undefined)}>Annuler</button></div></div>
        : <><p>{note.text}</p>
          <span className="yeast-small">{noteOrigin(note)}{note.source ? ` · ${note.origin === 'ai' ? 'référence de recherche' : 'source'} : ` : ''}
            {note.sourceUrl ? <a className="yeast-source" href={note.sourceUrl} target="_blank" rel="noreferrer">{note.source || note.sourceUrl}</a> : note.source}
            {note.retrievedAt ? ` · consultée le ${note.retrievedAt}` : ''}{note.context ? ` · ${note.context}` : ''}</span>
          <span className="yc-fact-actions"><button type="button" className="yeast-link" onClick={() => { setEditing(index); setDraft(note.text); }}>Modifier</button>
            <button type="button" className="yeast-link" onClick={() => onChange(list.filter((_, at) => at !== index))}>Retirer</button></span></>}
    </li>)}</ul>}
    <details className="yc-note-add"><summary>Ajouter une note personnelle</summary><div className="yc-fact-editor">
      <label>Nouvelle note<Textarea aria-label="Nouvelle note documentaire" value={adding} rows={2} onChange={e => setAdding(e.target.value)} /></label>
      <button type="button" disabled={!adding.trim()} onClick={() => { onChange([...list, { text: adding.trim(), origin: 'personal' }]); setAdding(''); }}>Ajouter la note</button>
    </div></details>
  </div>;
}

/** Product form and packaging are independent. Only physical unit conversions are automatic. */
export function YeastRecipeQuantity({ yeast, onChange, invalid }: { yeast: YeastSpec; onChange: (value: YeastSpec) => void; invalid?: boolean }) {
  const id = useId();
  const [notice, setNotice] = useState('');
  const invalidNumber = yeast.qty != null && (!Number.isFinite(yeast.qty) || yeast.qty < 0);
  const changeUnit = (unit: string) => {
    // The first unit qualifies the number already entered; there is no source
    // unit from which to convert it. Only a change between two known units may
    // require a conversion or a deliberate new quantity.
    if (!yeast.unit || !unit || yeast.qty == null) {
      setNotice('');
      onChange({ ...yeast, unit: unit || undefined });
      return;
    }
    const converted = Units.convert(yeast.qty, yeast.unit, unit);
    setNotice(converted === null ? `Quantité à ressaisir en ${unit} : aucune conversion depuis ${yeast.unit}.` : '');
    onChange({ ...yeast, unit, qty: converted ?? undefined });
  };
  return <div className="yc-quantity-editor">
    <div className="yc-dose-input"><label htmlFor="wz-yeast-qty">Quantité prévue</label>
      <NumberInput id="wz-yeast-qty" aria-label={`Quantité de levure${yeast.unit ? `, en ${yeast.unit}` : ''}`} value={yeast.qty} emptyValue={undefined} required aria-invalid={invalid || invalidNumber} onValue={qty => { if (qty != null && qty > 0) setNotice(''); onChange({ ...yeast, qty }); }} />
      <select id="wz-yeast-unit" aria-label="Unité de la quantité de levure" value={yeast.unit ?? ''} onChange={e => changeUnit(e.target.value)}>
        <option value="">Unité…</option>{[...new Set([...units, ...yeast.unit ? [yeast.unit] : []])].map(unit => <option key={unit}>{unit}</option>)}
      </select>
    </div>
    <div className="yc-form-input"><label htmlFor={id}>Forme</label><select id={id} aria-label="Forme de la levure" value={yeast.form ?? ''} onChange={e => onChange({ ...yeast, form: e.target.value as YeastSpec['form'] || undefined })}>
      <option value="">À préciser</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain / récup.</option>
    </select></div>
    {notice && <p className="yeast-notice" role="status">{notice}</p>}
    {invalidNumber && <p className="yeast-error" role="alert">La quantité de levure doit être un nombre positif ou nul.</p>}
  </div>;
}

/** Documentary sheet of one strain, typed field by field; a recipe hypothesis stays separate and named as such.
 * `scope="candidate"` edits a local candidate sheet: no recipe hypothesis and no lot notes are shown. */
function YeastRecipeNameEditor({name,onRename}:{name:string;onRename:(name:string)=>void}) {
  const [draft,setDraft]=useState(name),[error,setError]=useState('');
  const rename=()=>{const value=draft.trim();if(!value){setError('Renseigne un nom.');return;}onRename(value);setError('');};
  return <details className="yc-preparation"><summary>Corriger le nom dans cette recette</summary>
    <label>Nom affiché<Input aria-label="Nom de la levure dans cette recette" value={draft} onChange={event=>{setDraft(event.target.value);setError('');}}
      onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();rename();}}} /></label>
    {error&&<p role="alert" className="yeast-error">{error}</p>}
    <button type="button" className="yeast-link" onClick={rename}>Renommer</button>
  </details>;
}
export function YeastRecipeDossier({ yeast: originalYeast, onChange, reference, scope = 'recipe' }: {
  yeast: YeastSpec; onChange: (value: YeastSpec, intent?: 'documentary' | 'hypothesis') => void;
  /** Catalogue reference already resolved by the caller; otherwise resolved like the recipe projection. */
  reference?: HopYeast | null;
  scope?: 'recipe' | 'candidate';
}) {
  const yeast = yeastWithAdoptedDocumentary(originalYeast);
  const id = useId();
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const resolved = useMemo(() => reference !== undefined ? reference ?? undefined
    : resolveFermentationYeast({ yeast } as TrialRecipe, yeastReferences(saved)),
  [reference, saved, yeast.name, yeast.hopIndexId, yeast.lab, yeast.strain]);
  const retained = yeastRetainedValues(yeast, resolved);
  const patch = (value: Partial<YeastSpec>) => onChange({ ...yeast, ...value });
  // Display an identical observation from the same URL once. The underlying
  // records, alternate sources and different conditions are all preserved.
  const facts = [...new Map((yeast.technicalFacts ?? []).map(fact => [JSON.stringify([fact.key, fact.reported, fact.range, fact.unit, fact.qualifier ?? (fact.range && fact.range.min !== fact.range.max ? 'range' : undefined), fact.origin, fact.sourceUrl ?? fact.source, fact.context]), fact])).values()];
  // Observations that differ from the retained reading stay listed below, never averaged into it.
  const others = (key: YeastSheetKey) => facts.filter(fact => fact.key === key
    && JSON.stringify(readYeastFactValue(fact).value) !== JSON.stringify(retained[key].value)).length;
  const invalidScalars = yeast.fermTempMinC != null && yeast.fermTempMaxC != null && yeast.fermTempMinC > yeast.fermTempMaxC
    ? { min: yeast.fermTempMinC, max: yeast.fermTempMaxC } : undefined;
  const sheetDays = facts.filter(fact => fact.key === 'fermentationTime' && beerSheetContext(fact.context, 'fermentationTime'));
  const hypothesis = explicitHypothesis(yeast);
  // An empty hypothesis lets the documented reading apply: the field says which one, so a known range never reads as missing.
  const documented = retained.attenuation.value;
  const documentedHint = documented.kind === 'range' ? `fiche ${exact(documented.min)}–${exact(documented.max)}`
    : documented.kind === 'point' ? `fiche ${exact(documented.value)}` : documented.kind === 'bound' ? `fiche ${documented.operator} ${exact(documented.value)}` : undefined;
  const [basis, setBasis] = useState<'recipe' | 'measured'>(yeast.attenuationBasis === 'measured' ? 'measured' : 'recipe');
  const setHypothesis = (value: number | undefined, nextBasis = basis) => {
    if (value == null) {
      const point = yeast.technicalSelections?.attenuation?.qualifier === 'reportedPoint' ? yeast.technicalSelections.attenuation.range?.min : undefined;
      onChange({ ...yeast, attenuationPct: point, attenuationBasis: point != null ? 'declared' : undefined }, 'hypothesis');
    } else onChange({ ...yeast, attenuationPct: value, attenuationBasis: nextBasis }, 'hypothesis');
  };
  return <div className="yc-dossier-fields" data-sheet-scope={scope}>
    <p className="yeast-small">Valeurs retenues, typées et sourcées ; une valeur absente reste inconnue.</p>
    {scope==='recipe'&&<YeastRecipeNameEditor key={yeast.name} name={yeast.name} onRename={name=>onChange({...originalYeast,name},'documentary')} />}
    <label>Laboratoire<Input aria-label="Laboratoire de la levure" value={yeast.lab ?? ''} onChange={e => patch({ lab: e.target.value || undefined })} /></label>
    <label>Code de souche<Input aria-label="Code de souche" value={yeast.strain ?? ''} onChange={e => patch({ strain: e.target.value || undefined })} /></label>
    {(['temperature', 'attenuation', 'alcoholTolerance'] as const).map(key => <MeasuredFactRow key={`${key}-${JSON.stringify(retained[key].value)}`} yeast={yeast} factKey={key}
      retained={retained[key]} others={others(key)} observations={facts} onChange={onChange} invalidScalars={key === 'temperature' ? invalidScalars : undefined} />)}
    <FlocculationRow key={JSON.stringify(retained.flocculation.value)} yeast={yeast} retained={retained.flocculation} onChange={onChange} />
    <div className="yeast-setting-line"><label htmlFor={`${id}-days`}>Durée indicative de la fiche</label><NumberInput id={`${id}-days`} aria-label="Durée indicative de la fiche, en jours" min={0} value={yeast.fermentDays} emptyValue={undefined} onValue={fermentDays => patch({ fermentDays })} /><span>j</span></div>
    {sheetDays.some(fact => !(fact.range && fact.range.min === yeast.fermentDays && fact.range.max === yeast.fermentDays)) &&
      <p className="yeast-small">Fiche : {[...new Set(sheetDays.map(fact => fact.range ? yeastValueText(readYeastFactValue(fact).value, fact.unit) : fact.reported))].join(' · ')}. Repère de fiche, pas un palier.</p>}
    <label>Source / notice<Input aria-label="Source de la fiche technique" value={yeast.technicalSource ?? ''} onChange={e => patch({ technicalSource: e.target.value || undefined })} /></label>
    <DocumentaryNotesEditor notes={yeast.documentaryNotes} onChange={documentaryNotes => patch({ documentaryNotes })} />
    {scope === 'recipe' && <label>Notes existantes · portée non classée (recette, lot)<Textarea aria-label="Notes sur la levure" value={yeast.notes ?? ''} onChange={e => patch({ notes: e.target.value || undefined })} rows={2} /></label>}
    {scope === 'recipe' && <fieldset className="yc-hypothesis" aria-label="Hypothèse de cette recette"><legend>Hypothèse de cette recette</legend>
      <p className="yeast-small">Atténuation supposée pour ce moût. Ce n’est pas une donnée de fiche : elle sert au calcul de cette recette seulement.</p>
      <div className="yeast-setting-line"><label htmlFor={`${id}-att`}>Atténuation retenue pour cette recette</label><NumberInput id={`${id}-att`} aria-label="Atténuation retenue pour cette recette, en pourcent" min={0} max={100}
        value={hypothesis ? yeast.attenuationPct : undefined} emptyValue={undefined} onValue={value => setHypothesis(value)} placeholder={documentedHint} /><span>%</span></div>
      <label>Nature de cette hypothèse<select aria-label="Nature de l’hypothèse d’atténuation" value={basis} onChange={e => { const next = e.target.value as 'recipe' | 'measured'; setBasis(next); if (hypothesis && yeast.attenuationPct != null) setHypothesis(yeast.attenuationPct, next); }}>
        <option value="recipe">Estimation pour cette recette</option><option value="measured">Retour mesuré d’un brassin</option>
      </select></label>
    </fieldset>}
    {!!facts.length && <details aria-label="Données documentaires conservées"><summary>Toutes les observations · {facts.length}</summary>
      <dl className="yeast-strain-notes">{facts.map((fact, i) => <div key={`${fact.key}-${i}`}><dt>{YEAST_FACT_LABELS[fact.key]}</dt><dd>
        <p>{fact.reported}</p>
        {fact.range && <span className="yc-number">{yeastValueText(readYeastFactValue(fact).value, fact.unit)}</span>}
        {fact.context && fact.context !== 'Beer' && fact.context !== 'beer' && <p>{fact.context}</p>}
        {fieldKeys.has(fact.key) && !beerSheetContext(fact.context, fact.key) && <p className="yeast-small">Non repris dans les champs ni le calcul : milieu ou condition non attribuable à la bière.</p>}<span className="yeast-small">{originLabel(fact.origin) ?? 'Donnée personnelle'}{fact.source ? ` · ${fact.source}` : ''}</span>
        {fact.sourceUrl && <a className="yeast-source block" href={fact.sourceUrl} target="_blank" rel="noreferrer">Voir la source</a>}
      </dd></div>)}</dl>
    </details>}
  </div>;
}
