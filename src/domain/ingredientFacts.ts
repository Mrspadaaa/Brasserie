import { Fermentable, HopIngredient, StockItem, YeastSpec } from '../types';

import { readIngredientFermentationFacts, type IngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';
import { alcoholPercentUnit, readYeastDocumentaryNotes, readYeastFactValue, readYeastTechnicalFacts,
  type YeastDocumentaryNote, type YeastDocumentaryNotes, type YeastTechnicalFact, type YeastTechnicalSelections } from '../../functions/src/yeastTechnicalFacts';
import type { YeastCandidateDocumentaryFields } from '../../functions/src/yeastDocumentarySheet';
import { readYeastDocumentaryView as readSharedYeastDocumentaryView } from '../services/recipeDraft';

export type IngredientKind = 'levure' | 'malt' | 'houblon';

export interface YeastHistoricalScalarReading {
  kind: 'historical-untyped';
  value: number;
  source?: string;
}

export interface YeastDocumentaryView {
  status: 'adopted' | 'local' | 'legacy' | 'invalid';
  scope?: 'catalogue' | 'local';
  /** Clone with the compatible adopted documentary values overlaid for readers. */
  effectiveYeast: YeastSpec;
  /** Partial effective DTO; omitted fields stay omitted and explicit nulls stay null. */
  documentary?: YeastCandidateDocumentaryFields;
  technicalFacts?: YeastTechnicalFact[];
  technicalSelections?: YeastTechnicalSelections;
  documentaryNotes?: YeastDocumentaryNotes;
  fermentationFacts?: IngredientFermentationFacts;
  historicalScalarReading?: YeastHistoricalScalarReading;
}

const owns = (value: object | undefined, key: PropertyKey): boolean => !!value && Object.prototype.hasOwnProperty.call(value, key);

function legacyDocumentaryFields(yeast: YeastSpec): YeastCandidateDocumentaryFields | undefined {
  const row = yeast as unknown as Record<string, unknown>;
  const documentary: Record<string, unknown> = {};
  for (const key of ['lab', 'strain', 'form', 'fermTempMinC', 'fermTempMaxC', 'flocculation', 'alcoholTolerancePct', 'fermentDays', 'technicalSource'] as const)
    if (owns(yeast, key) && row[key] !== undefined) documentary[key] = row[key];
  const attenuationUnknown = owns(yeast.technicalSelections, 'attenuation') && yeast.technicalSelections?.attenuation === null;
  if (!attenuationUnknown && yeast.attenuationBasis === 'declared' && owns(yeast, 'attenuationPct') && yeast.attenuationPct !== undefined)
    documentary.declaredAttenuationPct = yeast.attenuationPct;
  return Object.keys(documentary).length ? documentary as YeastCandidateDocumentaryFields : undefined;
}

function historicalScalarReading(documentary?: YeastCandidateDocumentaryFields,
  selections?: YeastTechnicalSelections): YeastHistoricalScalarReading | undefined {
  if (owns(selections, 'attenuation') && selections?.attenuation === null) return undefined;
  const value = documentary?.declaredAttenuationPct;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) return undefined;
  const source = typeof documentary?.technicalSource === 'string' && documentary.technicalSource.trim()
    ? documentary.technicalSource : undefined;
  return { kind: 'historical-untyped', value, ...(source ? { source } : {}) };
}

/** Read adopted documentary values by identity, falling back only to admissible legacy fields.
 * The result is a clone for calculations and display; it never writes or migrates the recipe. */
export function readYeastDocumentaryView(yeast: YeastSpec): YeastDocumentaryView {
  const shared = readSharedYeastDocumentaryView(yeast);
  const effectiveYeast = shared.effectiveYeast;
  const status: YeastDocumentaryView['status'] = shared.status === 'none' ? 'legacy'
    : shared.status === 'valid' ? shared.scope === 'local' ? 'local' : 'adopted' : 'invalid';
  const legacy = legacyDocumentaryFields(effectiveYeast);
  const body = shared.status === 'valid' ? shared.body : undefined;
  const documentary = status === 'invalid' ? undefined : body?.documentary
    ? { ...legacy, ...structuredClone(body.documentary) } as YeastCandidateDocumentaryFields
    : legacy;
  const view: YeastDocumentaryView = { status, effectiveYeast,
    ...(shared.status === 'valid' ? { scope: shared.scope } : {}) };
  if (documentary !== undefined) view.documentary = documentary;
  if (effectiveYeast.technicalFacts !== undefined) view.technicalFacts = structuredClone(effectiveYeast.technicalFacts);
  if (effectiveYeast.technicalSelections !== undefined) view.technicalSelections = structuredClone(effectiveYeast.technicalSelections);
  if (effectiveYeast.documentaryNotes !== undefined) view.documentaryNotes = structuredClone(effectiveYeast.documentaryNotes);
  if (effectiveYeast.fermentationFacts !== undefined) view.fermentationFacts = structuredClone(effectiveYeast.fermentationFacts);
  const historical = shared.status === 'none' || shared.status === 'valid'
    ? historicalScalarReading(documentary, effectiveYeast.technicalSelections) : undefined;
  if (historical) view.historicalScalarReading = historical;
  return view;
}

export interface IngredientFacts {
  found: boolean;
  hopIndexId?: string;
  fermentation?: IngredientFermentationFacts;
  technicalFacts?: YeastTechnicalFact[];
  documentaryNotes?: YeastDocumentaryNotes;
  sourceUrl?: string;
  retrievedAt?: string;
  origin?: YeastTechnicalFact['origin'];
  name: string;
  source: string;
  note?: string;

  lab?: string;
  strain?: string;
  form?: 'sèche' | 'liquide' | 'levain';
  attenuationPct?: number;
  tempMinC?: number;
  tempMaxC?: number;
  flocculation?: string;
  alcoholTolerancePct?: number;
  /** Sheet duration in days, only from one published point; never a recipe step. */
  fermentDays?: number;

  colorEbc?: number;
  potentialPpg?: number;
  grainType?: string;
  diastaticPower?: number;

  alphaPct?: number;
  betaPct?: number;
  usage?: string;
  aroma?: string;
  substitutes?: string[];
}

/** Adapt only the server lookup response. Stock and recipe notes never pass through this path. */
export function adaptYeastLookupResult(facts: IngredientFacts): IngredientFacts {
  if (!facts.found) return facts;
  const { note, documentaryNotes: _untrustedNotes, technicalFacts: untrustedTechnicalFacts, ...response } = facts;
  const documentaryNotes = typeof note === 'string' && note.trim() ? [{
    text: note, origin: 'ai' as const,
    ...(facts.source?.trim() ? { source: facts.source } : {}),
    ...(facts.sourceUrl?.trim() ? { sourceUrl: facts.sourceUrl } : {}),
    ...(facts.retrievedAt?.trim() ? { retrievedAt: facts.retrievedAt } : {})
  }] : undefined;
  // Only a confirmed correction pair can stamp a scalar link. A fresh lookup
  // remains an observation even if its payload claims an earlier acceptance.
  const lookupTechnicalFacts = Array.isArray(untrustedTechnicalFacts) ? untrustedTechnicalFacts.map(fact => {
    if (!fact || typeof fact !== 'object' || Array.isArray(fact)) return fact;
    const { acceptedScalarFields: _untrustedAcceptance, ...observation } = fact;
    return observation;
  }) : untrustedTechnicalFacts;
  const technicalFacts = readYeastTechnicalFacts(lookupTechnicalFacts);
  // Older lookup responses may put flocculation only in the documented scalar
  // field while returning an empty technicalFacts array. The sheet-review path
  // works from observations, so carry the verbatim text and its sheet-level
  // provenance into that shared representation. Do not classify or rewrite
  // descriptions such as “High / Fast sedimentation”. If an observation already
  // exists, it remains the source of truth and is never duplicated by the scalar.
  const scalarFlocculation = typeof facts.flocculation === 'string' ? facts.flocculation.trim() : '';
  const hasFlocculationObservation = technicalFacts?.some(fact => fact.key === 'flocculation') ?? false;
  let normalizedTechnicalFacts = technicalFacts;
  if (technicalFacts && scalarFlocculation && scalarFlocculation.length <= 2000 && !hasFlocculationObservation) {
    const source = typeof facts.source === 'string' && facts.source.trim().length <= 2000 ? facts.source.trim() : undefined;
    const sourceUrl = typeof facts.sourceUrl === 'string' && facts.sourceUrl.trim().length <= 2000
      ? facts.sourceUrl.trim() : undefined;
    const retrievedAt = typeof facts.retrievedAt === 'string' && facts.retrievedAt.trim().length <= 2000 &&
      Number.isFinite(Date.parse(facts.retrievedAt)) ? facts.retrievedAt.trim() : undefined;
    const promoted = readYeastTechnicalFacts([...technicalFacts, {
      key: 'flocculation', reported: scalarFlocculation, origin: 'ai',
      ...(source ? { source } : {}), ...(sourceUrl ? { sourceUrl } : {}), ...(retrievedAt ? { retrievedAt } : {})
    }]);
    if (promoted) normalizedTechnicalFacts = promoted;
  }
  return {
    ...response,
    origin: 'ai',
    ...(normalizedTechnicalFacts ? { technicalFacts: normalizedTechnicalFacts.map(fact => ({ ...fact, origin: 'ai', source: fact.source || facts.source })) } : {}),
    ...(documentaryNotes ? { documentaryNotes } : {})
  };
}

export type LearnIngredient = (name: string, facts: Partial<StockItem>) => void;
export const ingredientKey = (kind: IngredientKind, name: string) =>
  `${kind}:${name.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ')}`;
/** A selected stock article has its own facts, even when another lot shares its name. */
export const recipeIngredientKey = (kind: IngredientKind, ingredient: { name: string; stockItemRef?: string }) =>
  ingredient.stockItemRef ? `${kind}:ref:${ingredient.stockItemRef}` : ingredientKey(kind, ingredient.name);

type FactKey = YeastTechnicalFact['key'];
// Drops the combining accents (U+0300–U+036F) left by NFKD.
const fold = (text: string) => Array.from(text.normalize('NFKD'))
  .filter(char => char.charCodeAt(0) < 0x300 || char.charCodeAt(0) > 0x36f).join('').toLowerCase();
const wordSet = (list: string) => new Set(list.split(/\s+/).filter(Boolean));
const FAHRENHEIT_NOTE = 'Conversion exacte Fahrenheit → Celsius, arrondie au dixième.';
// The brewing medium, named explicitly.
const beerWords = wordSet('beer beers biere bieres wort mout brewing brassage');
const otherMediumWords = wordSet('vin vins wine wines cidre cidres cider ciders hydromel hydromels mead meads kombucha sake');
const otherProcessWords = wordSet('conditionnement conditioning bottle bottling bouteille bouteilles refermentation packaging');
// Sheet wording and grammar: it names neither a medium nor a condition.
const sheetWords = wordSet(`a au aux d de des du en et l la le les pour sur of the for in on and
  recommandation recommandations recommande recommandee recommended recommendation conseille conseillee preconise preconisee
  optimal optimale optimum ideal ideale plage gamme range typique typical niveau level valeur value annonce annoncee
  declare declaree declared publie publiee published fiche technique technical data donnees sheet fabricant manufacturer
  produit product levure yeast souche strain`);
// The property of the fact's own field. One label word is required, so a
// context written for another property is never borrowed.
const propertyWords: Partial<Record<string, { label: Set<string>; extra: Set<string> }>> = {
  temperature: { label: wordSet('temperature temperatures temp fermentation'), extra: wordSet('primaire primary c celsius') },
  attenuation: { label: wordSet('attenuation'), extra: wordSet('apparente apparent aa') },
  alcoholTolerance: { label: wordSet('tolerance alcool alcoolique alcohol ethanol'), extra: wordSet('maximale maximum max abv vol') },
  flocculation: { label: wordSet('floculation flocculation sedimentation'), extra: wordSet('') },
  form: { label: wordSet('forme form presentation'), extra: wordSet('commerciale commercial') },
  fermentationTime: { label: wordSet('duree temps time duration'), extra: wordSet('fermentation primaire primary jours days') }
};
export type YeastFactScope = 'unspecified' | 'beer' | 'descriptive' | 'other';
/**
 * Where a published observation applies. No context, an explicit beer/wort
 * medium, or a bare label naming this fact's own property (« Atténuation
 * apparente », « Tolérance maximale à l'alcool ») describes the brewing sheet.
 * A descriptive label needs only known property words. An explicitly named
 * beer/wort medium can also state protocol figures, but a different medium
 * or conditioning use still excludes it. A missing « vin » is not beer.
 */
export function yeastFactScope(context: string | null | undefined, key: FactKey): YeastFactScope {
  if (!context?.trim()) return 'unspecified';
  if (context === FAHRENHEIT_NOTE) return 'descriptive';
  const text = fold(context), property = propertyWords[key];
  const words = text.split(/[^a-z]+/).filter(Boolean);
  if (words.some(word => otherMediumWords.has(word) || otherProcessWords.has(word))) return 'other';
  // A qualitative flocculation description often names settling behaviour
  // instead of a numeric beer condition. Its property label is sufficient
  // unless the context explicitly names another medium or process above.
  if (key === 'flocculation' && words.some(word => property?.label.has(word))) return 'descriptive';
  // A named beer/wort medium remains beer when its protocol also has numbers,
  // temperatures or free wording (for example « moût de contrôle à 20 °C »).
  if (words.some(word => beerWords.has(word))) return 'beer';
  if (/[^a-z\s'’"«»()\/.,;:·\-–—%°]/.test(text)) return 'other';
  const known = (word: string) => beerWords.has(word) || sheetWords.has(word) || !!property && (property.label.has(word) || property.extra.has(word));
  if (!words.length || !words.every(known)) return 'other';
  return words.some(word => beerWords.has(word)) ? 'beer' : words.some(word => property?.label.has(word)) ? 'descriptive' : 'other';
}
/** One rule for field filling, range selection and the recipe projection. */
export const beerSheetContext = (context: string | null | undefined, key: FactKey) => yeastFactScope(context, key) !== 'other';
const beerObservations = (facts: YeastTechnicalFact[] | undefined, key: FactKey) =>
  facts?.filter(fact => fact.key === key && beerSheetContext(fact.context, key)) ?? [];
const plainText = (text: string) => text.toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();
const reportedForm = (reported: string): 'sèche' | 'liquide' | undefined => {
  const text = plainText(reported), dry = /\bs[eè]che\b|\bdry\b/.test(text), liquid = /\bliquide?\b/.test(text);
  return dry === liquid ? undefined : dry ? 'sèche' : 'liquide';
};
/** One explicit wording outside another medium; a disagreement or an unreadable wording stays unknown. */
const explicitReported = <T extends string>(facts: YeastTechnicalFact[] | undefined, key: 'flocculation' | 'form',
  read: (reported: string) => T | undefined): T | undefined => {
  const values = beerObservations(facts, key).map(fact => read(fact.reported.trim()));
  const distinct = new Map(values.map(value => [value && plainText(value), value]));
  return distinct.size === 1 ? values[0] : undefined;
};

/** Only usable published values may reach calculations or the ingredient catalogue. */
export function sanitizeFacts(facts: IngredientFacts): IngredientFacts {
  const out = { ...facts };
  const fermentation = readIngredientFermentationFacts(facts.fermentation);
  if (fermentation) out.fermentation = fermentation; else delete out.fermentation;
  const technical = readYeastTechnicalFacts(facts.technicalFacts);
  if (technical) out.technicalFacts = technical; else delete out.technicalFacts;
  const documentaryNotes = facts.documentaryNotes === undefined ? undefined : readYeastDocumentaryNotes(facts.documentaryNotes);
  if (facts.documentaryNotes !== undefined && documentaryNotes === undefined) delete out.documentaryNotes;
  else if (documentaryNotes !== undefined) out.documentaryNotes = documentaryNotes;
  const limits: Partial<Record<keyof IngredientFacts, [number, number]>> = {
    colorEbc: [0, 5000],
    potentialPpg: [1, 50],
    alphaPct: [0.01, 100],
    betaPct: [0, 100],
    attenuationPct: [0, 100],
    tempMinC: [-5, 60],
    tempMaxC: [-5, 60],
    alcoholTolerancePct: [0, 40],
    diastaticPower: [0, 1000]
  };
  for (const [key, [min, max]] of Object.entries(limits)) {
    const v = out[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) delete out[key];
  }
  if (out.tempMinC != null && out.tempMaxC != null && out.tempMinC > out.tempMaxC) {
    delete out.tempMinC;
    delete out.tempMaxC;
  }
  for (const key of ['lab', 'strain', 'source', 'sourceUrl', 'retrievedAt', 'note', 'name', 'flocculation'] as const) {
    if (typeof out[key] !== 'string') delete out[key];
    else out[key] = out[key].trim();
  }
  if (!['sèche', 'liquide', 'levain'].includes(out.form)) delete out.form;
  if (!['manufacturer', 'personal', 'ai'].includes(out.origin)) delete out.origin;
  // A textual sheet value may come without its duplicate scalar. Its single
  // explicit wording fills the empty field; the observation keeps its source.
  if (!out.flocculation) { const reported = explicitReported(out.technicalFacts, 'flocculation', text => text || undefined); if (reported) out.flocculation = reported; }
  if (!out.form) { const form = explicitReported(out.technicalFacts, 'form', reportedForm); if (form) out.form = form; }
  if (out.sourceUrl) {
    try { if (!['http:', 'https:'].includes(new URL(out.sourceUrl).protocol)) delete out.sourceUrl; }
    catch { delete out.sourceUrl; }
  }
  if (out.retrievedAt && !Number.isFinite(Date.parse(out.retrievedAt))) delete out.retrievedAt;
  // A model sometimes duplicates a published range as its midpoint. The range
  // is the evidence; never retain that unsupported pseudo-exact scalar.
  for (const [field, key] of [['attenuationPct', 'attenuation'], ['alcoholTolerancePct', 'alcoholTolerance']] as const) {
    const documented = out.technicalFacts?.filter(f => f.key === key && f.range &&
      (key === 'alcoholTolerance' ? alcoholPercentUnit(f.unit) : f.unit === '%')) ?? [];
    if (documented.length && !documented.every(f => f.qualifier === 'reportedPoint' && f.range!.min === out[field])) delete out[field];
  }
  // An empty field takes one agreeing published beer observation: a two-bound
  // temperature range, an exact point for the percentages and the sheet
  // duration. A range, a bound or a mean never becomes a point; observations
  // that disagree leave the field unknown until review.
  const agreed = (key: FactKey, qualifier: 'range' | 'reportedPoint', unit: (unit?: string) => boolean) => {
    const values = beerObservations(out.technicalFacts, key).filter(fact => fact.range);
    const first = values[0]?.range;
    return first && values.every(fact => fact.qualifier === qualifier && unit(fact.unit) &&
      fact.range!.min === first.min && fact.range!.max === first.max) ? first : undefined;
  };
  const temperature = agreed('temperature', 'range', unit => unit === '°C');
  if (out.tempMinC == null && out.tempMaxC == null && temperature && temperature.min < temperature.max && temperature.min >= -5 && temperature.max <= 60) {
    out.tempMinC = temperature.min; out.tempMaxC = temperature.max;
  }
  const attenuation = agreed('attenuation', 'reportedPoint', unit => unit === '%');
  if (out.attenuationPct == null && attenuation && attenuation.min >= 0 && attenuation.min <= 100) out.attenuationPct = attenuation.min;
  const tolerance = agreed('alcoholTolerance', 'reportedPoint', unit => alcoholPercentUnit(unit));
  if (out.alcoholTolerancePct == null && tolerance && tolerance.min >= 0 && tolerance.min <= 40) out.alcoholTolerancePct = tolerance.min;
  // No model scalar exists for the duration: only the sheet point counts.
  delete out.fermentDays;
  const days = agreed('fermentationTime', 'reportedPoint', unit => /^(j|jours?|d|days?)$/i.test(unit?.trim() ?? ''));
  if (days && days.min > 0 && days.min <= 365) out.fermentDays = days.min;
  return out;
}

/** Keep independent observations and disagreements, removing only exact repeats. */
export function mergeYeastTechnicalFacts(...groups: (YeastTechnicalFact[] | undefined)[]): YeastTechnicalFact[] | undefined {
  const facts = groups.flatMap(group => readYeastTechnicalFacts(group) ?? []);
  const unique = [...new Map(facts.map(fact => [JSON.stringify(fact), fact])).values()];
  return unique.length ? unique : undefined;
}

/** A published bound stays a bound wherever its wording is shown alone. */
export function yeastFactReported(fact: YeastTechnicalFact): string {
  const prefix = fact.qualifier === 'greaterThan' ? '>' : fact.qualifier === 'lessThan' ? '<'
    : fact.qualifier === 'upTo' ? 'au plus' : fact.qualifier === 'atLeast' ? 'au moins' : '';
  return prefix && !/[≤≥<>]|au plus|au moins|up to|at least|jusqu|max|min/i.test(fact.reported)
    ? `${prefix} ${fact.reported}` : fact.reported;
}

/** Older scalar responses remain usable without pretending they were ranges. */
export function yeastTechnicalFactsFromIngredient(facts: IngredientFacts): YeastTechnicalFact[] | undefined {
  const v = sanitizeFacts(facts), items = [...(v.technicalFacts ?? [])];
  const provenance = { origin: v.origin ?? 'ai' as const,
    ...(v.source ? { source: v.source } : {}), ...(v.sourceUrl ? { sourceUrl: v.sourceUrl } : {}),
    ...(v.retrievedAt ? { retrievedAt: v.retrievedAt } : {}) };
  const numeric = (key: YeastTechnicalFact['key'], min: number | undefined, max: number | undefined, unit: string) => {
    if (min == null || max == null || items.some(f => f.key === key)) return;
    items.push({ key, reported: `${min}${min === max ? '' : `–${max}`} ${unit}`, range: { min, max }, unit,
      qualifier: min === max ? 'reportedPoint' : 'range', ...provenance });
  };
  numeric('attenuation', v.attenuationPct, v.attenuationPct, '%');
  numeric('temperature', v.tempMinC, v.tempMaxC, '°C');
  numeric('alcoholTolerance', v.alcoholTolerancePct, v.alcoholTolerancePct, '%');
  for (const [key, reported] of [['flocculation', v.flocculation], ['form', v.form]] as const)
    if (reported && !items.some(f => f.key === key)) items.push({ key, reported, ...provenance });
  return mergeYeastTechnicalFacts(items);
}

export type YeastFactField = 'lab' | 'strain' | 'form' | 'attenuationPct' | 'fermTempMinC' | 'fermTempMaxC' | 'flocculation' | 'alcoholTolerancePct' | 'notes' | 'documentaryNotes' | 'fermentationFacts' | 'fermentDays';
export interface YeastFactChange { field: YeastFactField; label: string; current: unknown; proposed: unknown; conflict: boolean }
export type YeastDocumentaryNotesDecision = 'keep' | 'add' | { action: 'replace'; target: YeastDocumentaryNote };
export interface YeastDocumentaryNotesDecisionResult { value: YeastDocumentaryNotes | undefined; error?: string }
const sameDocumentaryNote = (a: YeastDocumentaryNote, b: YeastDocumentaryNote) => JSON.stringify(a) === JSON.stringify(b);
const uniqueDocumentaryNotes = (notes: YeastDocumentaryNote[]) =>
  [...new Map(notes.map(note => [JSON.stringify(note), note])).values()];

/** Manual edits change the note's origin while keeping only the original provenance actually supplied. */
export function editYeastDocumentaryNote(note: YeastDocumentaryNote, text: string): YeastDocumentaryNote | undefined {
  if (typeof text !== 'string' || !text.trim()) return undefined;
  const valid = readYeastDocumentaryNotes([note])?.[0];
  return valid ? { ...valid, text, origin: 'personal' } : undefined;
}

/** Resolve narrative acceptance without turning differences into data conflicts. */
export function decideYeastDocumentaryNotes(current: YeastDocumentaryNotes | undefined, incoming: unknown,
  decision: YeastDocumentaryNotesDecision = 'add'): YeastDocumentaryNotesDecisionResult {
  const next = incoming === undefined ? undefined : readYeastDocumentaryNotes(incoming);
  if (incoming !== undefined && next === undefined) return { value: current, error: 'La note documentaire reçue est invalide; aucune note n’a été modifiée.' };
  if (decision === 'keep' || next === undefined) return { value: current };
  if (decision === 'add') {
    if (next === null) return { value: null };
    return { value: uniqueDocumentaryNotes([...(Array.isArray(current) ? current : []), ...next]) };
  }
  if (next === null || !Array.isArray(current))
    return { value: current, error: 'La note visée n’existe plus; gardez les notes actuelles ou relisez la fiche.' };
  const index = current.findIndex(note => sameDocumentaryNote(note, decision.target));
  if (index < 0) return { value: current, error: 'La note visée a changé; gardez les notes actuelles ou relisez la fiche.' };
  return { value: uniqueDocumentaryNotes([...current.slice(0, index), ...next, ...current.slice(index + 1)]) };
}
const yeastFactFields: [YeastFactField, keyof IngredientFacts, string][] = [
  ['lab', 'lab', 'Laboratoire'], ['strain', 'strain', 'Code de souche'], ['form', 'form', 'Forme'],
  ['attenuationPct', 'attenuationPct', 'Atténuation (%)'], ['fermTempMinC', 'tempMinC', 'Température minimale (°C)'],
  ['fermTempMaxC', 'tempMaxC', 'Température maximale (°C)'], ['flocculation', 'flocculation', 'Floculation'],
  ['alcoholTolerancePct', 'alcoholTolerancePct', 'Tolérance alcoolique (%)'], ['notes', 'note', 'Notes existantes'],
  ['documentaryNotes', 'documentaryNotes', 'Notes documentaires'],
  ['fermentationFacts', 'fermentation', 'Assimilation et domaine publié'], ['fermentDays', 'fermentDays', 'Durée indicative de la fiche (j)']
];
export function yeastFactChanges(yeast: YeastSpec, facts: IngredientFacts): YeastFactChange[] {
  const clean = sanitizeFacts(facts), effective = readYeastDocumentaryView(yeast).effectiveYeast;
  return yeastFactFields.flatMap(([field, sourceField, label]) => {
    const proposed = clean[sourceField], current = effective[field];
    if (proposed == null || proposed === '' || JSON.stringify(current) === JSON.stringify(proposed)) return [];
    return [{ field, label, current, proposed, conflict: field === 'documentaryNotes' ? false : current != null && current !== '' }];
  });
}

export function applyMaltFacts(f: Fermentable, facts: IngredientFacts): Fermentable {
  const v = sanitizeFacts(facts);
  return {
    ...f,
    colorEbc: f.colorEbc ?? v.colorEbc,
    potentialPpg: f.potentialPpg || v.potentialPpg
  };
}
export function applyHopFacts(h: HopIngredient, facts: IngredientFacts): HopIngredient {
  return { ...h, alpha: h.alpha || sanitizeFacts(facts).alphaPct };
}
export function applyYeastFacts(y: YeastSpec, facts: IngredientFacts, replaceFields: readonly YeastFactField[] = [],
  documentaryNotesDecision: YeastDocumentaryNotesDecision = 'add'): YeastSpec {
  const current = readYeastDocumentaryView(y).effectiveYeast;
  const v = sanitizeFacts(facts);
  const noteResolution = decideYeastDocumentaryNotes(current.documentaryNotes, v.documentaryNotes, documentaryNotesDecision);
  const next: YeastSpec = {
    ...current,
    hopIndexId: current.hopIndexId || v.hopIndexId,
    technicalFacts: mergeYeastTechnicalFacts(current.technicalFacts, yeastTechnicalFactsFromIngredient(v)),
    technicalSource: current.technicalSource || v.source,
    ...(noteResolution.value !== undefined ? { documentaryNotes: noteResolution.value } : {})
  };
  for (const change of yeastFactChanges(current, v)) {
    if (change.field === 'documentaryNotes') continue;
    if (change.conflict && !replaceFields.includes(change.field)) continue;
    (next as unknown as Record<string, unknown>)[change.field] = change.proposed;
    if (change.field === 'attenuationPct') next.attenuationBasis = 'declared';
  }
  return next;
}

export type YeastRangeKey = 'temperature' | 'attenuation' | 'alcoholTolerance';
const rangeFields: Record<YeastRangeKey, YeastFactField[]> = {
  temperature: ['fermTempMinC', 'fermTempMaxC'], attenuation: ['attenuationPct'], alcoholTolerance: ['alcoholTolerancePct']
};
const rangeLabels: Record<YeastRangeKey, string> = {
  temperature: 'Plage de température publiée', attenuation: 'Plage d’atténuation publiée', alcoholTolerance: 'Tolérance alcoolique publiée'
};
const rangeKeys: YeastRangeKey[] = ['temperature', 'attenuation', 'alcoholTolerance'];
const scalarObserved = (yeast: YeastSpec, key: YeastRangeKey): YeastTechnicalFact | undefined => {
  // Attenuation scalars are recipe hypotheses or untyped compatibility data;
  // neither establishes a personal observation with an invented qualifier.
  if (key === 'attenuation') return undefined;
  const min = key === 'temperature' ? yeast.fermTempMinC : yeast.alcoholTolerancePct;
  const max = key === 'temperature' ? yeast.fermTempMaxC : min;
  if (typeof min !== 'number' || !Number.isFinite(min) || typeof max !== 'number' || !Number.isFinite(max) || min > max) return undefined;
  const unit = key === 'temperature' ? '°C' : '%';
  return { key, reported: `${min}${min === max ? '' : `–${max}`} ${unit}`, range: { min, max }, unit,
    qualifier: min === max ? 'reportedPoint' : 'range', origin: 'personal', source: yeast.technicalSource || 'Saisie de recette', context: 'beer' };
};
const observedRange = (yeast: YeastSpec, key: YeastRangeKey) => {
  const effective = readYeastDocumentaryView(yeast).effectiveYeast;
  if (effective.technicalSelections && Object.prototype.hasOwnProperty.call(effective.technicalSelections, key))
    return effective.technicalSelections[key] ?? undefined;
  // A note for another medium does not hide the brewer's own figures.
  const beer = beerObservations(effective.technicalFacts, key);
  if (!beer.length) return scalarObserved(effective, key);
  const first = beer[0];
  return first?.range && beer.every(fact => fact.range && fact.qualifier === first.qualifier && fact.unit === first.unit &&
    fact.range.min === first.range!.min && fact.range.max === first.range!.max) ? first : undefined;
};

type ObservedFlocculation = YeastTechnicalFact | { key: 'flocculation'; reported: string };
const observedFlocculation = (yeast: YeastSpec): ObservedFlocculation | undefined => {
  const effective = readYeastDocumentaryView(yeast).effectiveYeast;
  if (effective.technicalSelections && Object.prototype.hasOwnProperty.call(effective.technicalSelections, 'flocculation'))
    return effective.technicalSelections.flocculation ?? undefined;
  const beer = beerObservations(effective.technicalFacts, 'flocculation').filter(fact => readYeastFactValue(fact).value.kind === 'category');
  if (beer.length) {
    const first = beer[0];
    return beer.every(fact => plainText(fact.reported) === plainText(first.reported)) ? first : undefined;
  }
  return effective.flocculation?.trim()
    ? { key: 'flocculation', reported: effective.flocculation.trim() }
    : undefined;
};

/** Distinct beer observations in one response; their order must not choose a range. */
export function yeastRangeObservations(facts: IngredientFacts): Partial<Record<YeastRangeKey, YeastTechnicalFact[]>> {
  const incoming = yeastTechnicalFactsFromIngredient(facts);
  return Object.fromEntries(rangeKeys.map(key => {
    const candidates = beerObservations(incoming, key).filter(fact => fact.range);
    const unique = [...new Map(candidates.map(fact => [JSON.stringify([fact.range, fact.qualifier, fact.unit]), fact])).values()];
    return [key, unique];
  })) as Partial<Record<YeastRangeKey, YeastTechnicalFact[]>>;
}

/** Beer observations that disagree leave their empty field unknown; list them for the brewer's review. */
export function yeastObservationDisagreements(facts: IngredientFacts): { key: FactKey; observations: YeastTechnicalFact[] }[] {
  const clean = sanitizeFacts(facts);
  const numeric = (fact: YeastTechnicalFact) => fact.range ? JSON.stringify([fact.qualifier, fact.range.min, fact.range.max, fact.unit]) : undefined;
  const groups: [FactKey, unknown, (fact: YeastTechnicalFact) => string | undefined][] = [
    ['temperature', clean.tempMinC ?? clean.tempMaxC, numeric], ['attenuation', clean.attenuationPct, numeric],
    ['alcoholTolerance', clean.alcoholTolerancePct, numeric], ['fermentationTime', clean.fermentDays, numeric],
    ['flocculation', clean.flocculation, fact => plainText(fact.reported)], ['form', clean.form, fact => reportedForm(fact.reported)]
  ];
  return groups.flatMap(([key, filled, identity]) => {
    const observations = beerObservations(clean.technicalFacts, key).filter(fact => identity !== numeric || fact.range);
    const distinct = new Map(observations.map(fact => [identity(fact), fact]));
    return filled == null && distinct.size > 1 ? [{ key, observations: [...distinct.values()] }] : [];
  });
}

/** A distinct published range needs its own review when no scalar field already asks the same question. */
export function yeastRangeConflicts(yeast: YeastSpec, facts: IngredientFacts, observationChoices: Partial<Record<YeastRangeKey, number>> = {}) {
  const incoming = yeastRangeObservations(facts);
  return rangeKeys.flatMap(key => {
    const variants = incoming[key] ?? [];
    const current = observedRange(yeast, key), proposed = variants.length > 1 ? variants[observationChoices[key] ?? -1] : variants[0];
    if (!current?.range || !proposed?.range || JSON.stringify([current.range, current.qualifier]) === JSON.stringify([proposed.range, proposed.qualifier])) return [];
    return [{ key, label: rangeLabels[key], current, proposed }];
  });
}

/** Keep every sourced observation, but make the brewer's reviewed range explicit for calculations. */
export function applyReviewedYeastFacts(y: YeastSpec, facts: IngredientFacts,
  replaceFields: readonly YeastFactField[], rangeChoices: Partial<Record<YeastRangeKey, 'keep' | 'replace'>>,
  observationChoices: Partial<Record<YeastRangeKey, number>> = {},
  documentaryNotesDecision: YeastDocumentaryNotesDecision = 'add'): YeastSpec {
  const current = readYeastDocumentaryView(y).effectiveYeast;
  const clean = sanitizeFacts(facts), next = applyYeastFacts(current, clean, replaceFields, documentaryNotesDecision);
  const incoming = yeastRangeObservations(clean), incomingFacts = yeastTechnicalFactsFromIngredient(clean);
  const scalarChanges = yeastFactChanges(current, clean);
  const selections: YeastTechnicalSelections = { ...current.technicalSelections };
  const scalarRange = (key: YeastRangeKey, value: YeastSpec): { min: number; max: number } | undefined => {
    const min = key === 'temperature' ? value.fermTempMinC : key === 'attenuation' ? value.attenuationPct : value.alcoholTolerancePct;
    const max = key === 'temperature' ? value.fermTempMaxC : min;
    return typeof min === 'number' && Number.isFinite(min) && typeof max === 'number' && Number.isFinite(max) && min <= max ? { min, max } : undefined;
  };
  const selectedFromRange = (key: YeastRangeKey, range: { min: number; max: number }, source: string): YeastTechnicalFact => {
    const unit = key === 'temperature' ? '°C' : '%';
    return { key, reported: `${range.min}${range.min === range.max ? '' : `–${range.max}`} ${unit}`, range, unit,
      qualifier: range.min === range.max ? 'reportedPoint' : 'range', origin: 'personal', source: source.slice(0, 2000), context: 'beer' };
  };
  const useReportedRange = (key: YeastRangeKey, fact: YeastTechnicalFact) => {
    if (!fact.range) return;
    // Two published bounds fill both fields; a point or a one-sided bound stays in the selection only.
    if (key === 'temperature') {
      const bounds = fact.qualifier === 'range' && fact.range.min < fact.range.max;
      next.fermTempMinC = bounds ? fact.range.min : undefined; next.fermTempMaxC = bounds ? fact.range.max : undefined;
    }
    else if (key === 'attenuation') { next.attenuationPct = fact.qualifier === 'reportedPoint' ? fact.range.min : undefined; next.attenuationBasis = 'declared'; }
    else next.alcoholTolerancePct = fact.qualifier === 'reportedPoint' ? fact.range.min : undefined;
  };
  for (const key of rangeKeys) {
    const variants = incoming[key] ?? [];
    const oldFact = observedRange(current, key), proposedFact = variants.length > 1 ? variants[observationChoices[key] ?? -1] : variants[0];
    if (variants.length > 1 && !proposedFact) { selections[key] = null; continue; }
    const scalar = scalarChanges.filter(change => rangeFields[key].includes(change.field));
    if (!proposedFact && !scalar.length && !rangeChoices[key]) continue;
    const choice = rangeChoices[key];
    if (choice === 'keep') {
      for (const field of rangeFields[key]) (next as unknown as Record<string, unknown>)[field] = current[field];
      if (key === 'attenuation') next.attenuationBasis = current.attenuationBasis;
      selections[key] = oldFact ?? (key !== 'attenuation' && scalarRange(key, current)
        ? selectedFromRange(key, scalarRange(key, current)!, current.technicalSource || 'Saisie de recette') : null);
      continue;
    }
    if (choice === 'replace' && proposedFact?.range) {
      useReportedRange(key, proposedFact);
      selections[key] = proposedFact;
      continue;
    }
    if (variants.length > 1 && proposedFact && !oldFact) {
      // The chosen observation, not an unrelated scalar in the same model
      // response, defines the selected interval.
      useReportedRange(key, proposedFact);
      selections[key] = proposedFact;
      continue;
    }
    const allKept = scalar.length > 0 && scalar.every(change => change.conflict && !replaceFields.includes(change.field));
    if (allKept) { selections[key] = oldFact ?? (key !== 'attenuation' && scalarRange(key, current)
      ? selectedFromRange(key, scalarRange(key, current)!, current.technicalSource || 'Saisie de recette') : null); continue; }
    const chosenRange = scalarRange(key, next);
    const matches = (fact?: YeastTechnicalFact) => fact?.range && chosenRange && fact.range.min === chosenRange.min && fact.range.max === chosenRange.max ? fact : undefined;
    if (proposedFact && !scalar.length && !oldFact) { useReportedRange(key, proposedFact); selections[key] = proposedFact; continue; }
    if (proposedFact && !scalar.length && oldFact) {
      const sameRange = oldFact.range && proposedFact.range && oldFact.range.min === proposedFact.range.min &&
        oldFact.range.max === proposedFact.range.max && oldFact.qualifier === proposedFact.qualifier;
      if (sameRange) { useReportedRange(key, proposedFact); selections[key] = proposedFact; }
      else selections[key] = null; // A conflicting range without the required review is unknown, never order-selected.
      continue;
    }
    selections[key] = matches(proposedFact) ?? matches(oldFact) ?? (chosenRange
      ? selectedFromRange(key, chosenRange, `Bornes retenues après revue : ${[oldFact?.source, proposedFact?.source ?? clean.source].filter(Boolean).join(' ; ')}`)
      : null);
  }
  const oldFlocculation = observedFlocculation(current);
  const flocculationVariants = beerObservations(incomingFacts, 'flocculation').filter(fact => readYeastFactValue(fact).value.kind === 'category');
  const distinctFlocculation = [...new Map(flocculationVariants.map(fact => [plainText(fact.reported), fact])).values()];
  const chosenFlocculation = replaceFields.includes('flocculation') && clean.flocculation
    ? distinctFlocculation.find(fact => plainText(fact.reported) === plainText(clean.flocculation!))
    : undefined;
  if (chosenFlocculation) selections.flocculation = chosenFlocculation;
  else if (distinctFlocculation.length > 1) {
    if (oldFlocculation && 'origin' in oldFlocculation) selections.flocculation = oldFlocculation;
    else if (oldFlocculation) delete selections.flocculation;
    else selections.flocculation = null;
  }
  else if (distinctFlocculation.length === 1) {
    const proposed = distinctFlocculation[0];
    if (!oldFlocculation || plainText(oldFlocculation.reported) === plainText(proposed.reported) || replaceFields.includes('flocculation'))
      selections.flocculation = proposed;
    else if ('origin' in oldFlocculation) selections.flocculation = oldFlocculation;
    else delete selections.flocculation;
  }
  return { ...next, technicalSelections: selections };
}

export function factsForStock(kind: IngredientKind, facts: IngredientFacts): Partial<StockItem> {
  const v = sanitizeFacts(facts);
  const fields: Partial<StockItem> =
    kind === 'malt'
      ? { colorEbc: v.colorEbc, potentialPpg: v.potentialPpg }
      : kind === 'houblon'
        ? { alphaPct: v.alphaPct }
        : {
            yeastFermentationFacts: v.fermentation,
            yeastTechnicalFacts: yeastTechnicalFactsFromIngredient(v),
            yeastFlocculation: v.flocculation,
            yeastAlcoholTolerancePct: v.alcoholTolerancePct,
            yeastNotes: v.note,
            yeastLab: v.lab,
            yeastStrain: v.strain,
            yeastForm: v.form,
            yeastAttenuationPct: v.attenuationPct,
            yeastTempMinC: v.tempMinC,
            yeastTempMaxC: v.tempMaxC
          };
  return {
    ...fields,
    category: { malt: 'Malt', houblon: 'Houblon', levure: 'Levure' }[kind],
    technicalSource: v.source
  };
}

export function factsFromStock(item: StockItem): IngredientFacts {
  return sanitizeFacts({
    found: true,
    name: item.name,
    fermentation: item.yeastFermentationFacts,
    technicalFacts: item.yeastTechnicalFacts,
    origin: 'personal',
    flocculation: item.yeastFlocculation,
    alcoholTolerancePct: item.yeastAlcoholTolerancePct,
    note: item.yeastNotes,
    source: item.technicalSource || `Article de stock ${item.ref}`,
    colorEbc: item.colorEbc,
    potentialPpg: item.potentialPpg,
    alphaPct: item.alphaPct,
    lab: item.yeastLab,
    strain: item.yeastStrain,
    form: item.yeastForm,
    attenuationPct: item.yeastAttenuationPct,
    tempMinC: item.yeastTempMinC,
    tempMaxC: item.yeastTempMaxC
  });
}

/** Lot facts require an explicit stock ref for yeast: its catalogue name does
 * not identify a selected lot. Malt and hops retain unique legacy name lookup. */
export function factsForRecipeStockItem(kind: IngredientKind, ingredient: { name: string; stockItemRef?: string }, stock: StockItem[]): IngredientFacts | undefined {
  if (kind === 'levure' && !ingredient.stockItemRef) return undefined;
  const rows = stock.filter(item => item.category.toLocaleLowerCase('fr') === kind &&
    (ingredient.stockItemRef ? item.ref === ingredient.stockItemRef : ingredientKey(kind, item.name) === ingredientKey(kind, ingredient.name)));
  if (rows.length !== 1) return undefined;
  const facts = factsFromStock(rows[0]);
  const usable = kind === 'malt' ? facts.colorEbc != null || facts.potentialPpg != null :
    kind === 'houblon' ? facts.alphaPct != null :
      !!(facts.lab || facts.strain || facts.form || facts.attenuationPct != null ||
        facts.tempMinC != null || facts.tempMaxC != null || facts.technicalFacts?.length || facts.fermentation);
  // A known stock ref may carry a brewer's own label values without a linked
  // document. The legacy name fallback still requires a recorded source.
  return rows[0].technicalSource?.trim() || ingredient.stockItemRef && usable ? facts : undefined;
}

export interface IngredientGap {
  key: string;
  kind: IngredientKind;
  name: string;
  stockItemRef?: string;
  missing: string[];
}
export function ingredientGaps(
  fermentables: Fermentable[],
  hops: HopIngredient[],
  yeast: YeastSpec,
  nolo = false
): IngredientGap[] {
  // An observation for another medium cannot close a gap it cannot fill.
  const technical = (readYeastTechnicalFacts(yeast.technicalFacts) ?? []).filter(f => beerSheetContext(f.context, f.key));
  const documentedAttenuation = technical.some(f => f.key === 'attenuation' && f.unit === '%' && f.range && ['range', 'reportedPoint'].includes(f.qualifier));
  const documentedMin = technical.some(f => f.key === 'temperature' && f.unit === '°C' && f.range && ['range', 'reportedPoint', 'atLeast', 'greaterThan'].includes(f.qualifier));
  const documentedMax = technical.some(f => f.key === 'temperature' && f.unit === '°C' && f.range && ['range', 'reportedPoint', 'upTo', 'lessThan'].includes(f.qualifier));
  const gaps = new Map<string, IngredientGap>();
  const add = (kind: IngredientKind, ingredient: { name: string; stockItemRef?: string }, missing: string[]) => {
    const { name, stockItemRef } = ingredient;
    if (!name?.trim() || !missing.length) return;
    const key = recipeIngredientKey(kind, ingredient);
    const old = gaps.get(key);
    gaps.set(key, {
      key,
      kind,
      name,
      stockItemRef,
      missing: [...new Set([...(old?.missing ?? []), ...missing])]
    });
  };
  fermentables
    .filter((f) => f.kind === 'grain')
    .forEach((f) =>
      add(
        'malt',
        f,
        [f.colorEbc == null && 'couleur EBC', !f.potentialPpg && 'potentiel PPG'].filter(
          Boolean
        ) as string[]
      )
    );
  // The technical sheet remains useful at every stage. Alpha is never used as
  // a dry-hop utilization, but must survive moving the same lot to the kettle.
  hops.forEach((h) => add('houblon', h, h.alpha ? [] : ['acides alpha']));
  add(
    'levure',
    yeast,
    [
      yeast.attenuationPct == null && !documentedAttenuation && 'atténuation',
      nolo && !yeast.fermentationFacts && 'assimilation NOLO et ensemencement',
      yeast.fermTempMinC == null && !documentedMin && 'température minimale',
      yeast.fermTempMaxC == null && !documentedMax && 'température maximale',
      !yeast.lab?.trim() && 'laboratoire'
    ].filter(Boolean) as string[]
  );
  return [...gaps.values()];
}

export function fillsGap(gap: IngredientGap, facts: IngredientFacts): boolean {
  const v = sanitizeFacts(facts);
  const technical = v.technicalFacts?.filter(f => beerSheetContext(f.context, f.key));
  const keys = {
    'couleur EBC': ['colorEbc'],
    'potentiel PPG': ['potentialPpg'],
    'acides alpha': ['alphaPct'],
    atténuation: ['attenuationPct'],
    'assimilation NOLO et ensemencement': ['fermentation'],
    'plage de température': ['tempMinC', 'tempMaxC'],
    'température minimale': ['tempMinC'],
    'température maximale': ['tempMaxC'],
    laboratoire: ['lab']
  };
  return gap.missing.some((label) => keys[label]?.some((key) => v[key] != null && v[key] !== '') ||
    (label === 'atténuation' && technical?.some(f => f.key === 'attenuation' && f.unit === '%' && f.range && ['range', 'reportedPoint'].includes(f.qualifier))) ||
    (label.startsWith('température') && technical?.some(f => f.key === 'temperature' && f.unit === '°C' && f.range &&
      (label === 'température minimale' ? ['range', 'reportedPoint', 'atLeast', 'greaterThan'].includes(f.qualifier)
        : ['range', 'reportedPoint', 'upTo', 'lessThan'].includes(f.qualifier)))));
}
