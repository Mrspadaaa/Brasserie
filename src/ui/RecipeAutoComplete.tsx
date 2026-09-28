import { completeFromLocalReferences } from '../domain/localIngredientFacts';
import { resolveFermentationYeast } from '../domain/fermentationScenario';
import { tryAdoptYeastDocumentary, yeastWithAdoptedDocumentary } from '../services/recipeDraft';
import { yeastReferences } from '../domain/yeastReferences';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import { guideFermentations } from './hopIndex/guideData';
import { YEAST_FACT_LABELS } from '../domain/yeastCatalogue';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Fermentable, HopIngredient, YeastSpec, StockItem } from '../types';
import { AiClient } from '../services/aiClient';
import { readYeastFactValue, readYeastDocumentaryNotes, type YeastDocumentaryNote, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import {
  YEAST_DOCUMENTARY_UNITS, YEAST_SHEET_LABELS, YEAST_VALUE_KIND, YeastFlocculationEditor, YeastMeasuredFactEditor,
  withRetainedYeastFact, yeastCategoryKey, yeastRetainedValues, yeastValueText, type YeastDocumentaryKey
} from './YeastRecipeDossier';
import {
  IngredientFacts,
  IngredientGap,
  IngredientKind,
  LearnIngredient,
  ingredientGaps,
  recipeIngredientKey,
  applyMaltFacts,
  applyHopFacts,
  applyYeastFacts,
  applyReviewedYeastFacts,
  adaptYeastLookupResult,
  beerSheetContext,
  factsForStock,
  factsFromStock,
  mergeYeastTechnicalFacts,
  sanitizeFacts,
  fillsGap,
  yeastFactChanges,
  yeastRangeConflicts,
  yeastRangeObservations,
  yeastFactReported,
  yeastObservationDisagreements,
  yeastTechnicalFactsFromIngredient,
  type YeastDocumentaryNotesDecision, type YeastFactField, type YeastRangeKey
} from '../domain/ingredientFacts';

/**
 * Compléter TOUTE la fiche d'un coup, avec l'IA.
 *
 * ⚠️ Ce que ça règle : `AiAssist` existe déjà, mais un bouton par ingrédient.
 * Sur une recette de quatre malts, six houblons et une levure, c'est onze
 * recherches à lancer une par une, en remontant le fil d'étapes entre chaque —
 * et il suffit d'en oublier une pour que l'OG ou la couleur restent
 * « incalculables » jusqu'à la fin.
 *
 * Trois règles reprises telles quelles d'`AiAssist`, parce que ce sont elles qui
 * séparent une donnée RETROUVÉE d'une donnée inventée :
 *
 *   1. la recherche est **ancrée sur Google** côté serveur — les valeurs
 *      viennent des fiches des fabricants ;
 *   2. la **source est affichée**, ligne par ligne ;
 *   3. **rien n'est écrit** avant que Gaëtan ait vu ce qui va l'être.
 *
 * Les cases vides se complètent après revue. Pour la fiche d'une levure, les
 * données cohérentes se valident en un geste ; seuls les écarts pertinents
 * (identité, valeur retenue différente, observations contradictoires) demandent
 * une décision, sans bloquer les données indépendantes. L'alpha d'un lot de
 * houblon reste protégé contre la fiche générique de sa variété.
 */

const EMPTY_STOCK: StockItem[] = [];
// Un fait tient sur une ligne. Un conflit a besoin de toute la largeur du
// téléphone pour l’avant/après, sa source et le choix explicite.
const FACT_ROW = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-2 py-1';
const CONFLICT_ROW = 'grid grid-cols-1 items-start gap-0.5 py-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-2';
const CONFLICT_LABEL = 'font-semibold text-cave-200';
// Champ de la fiche → observation qui le documente.
const FACT_KEY_BY_FIELD: Record<string, string> = { form: 'form', attenuationPct: 'attenuation', fermTempMinC: 'temperature',
  fermTempMaxC: 'temperature', alcoholTolerancePct: 'alcoholTolerance', flocculation: 'flocculation', fermentDays: 'fermentationTime' };
/** Provenance of a proposed value: its exact observation when known, the whole sheet otherwise. */
const proposedSource = (facts: IngredientFacts, field: string, proposed: unknown) => {
  const fact = facts.technicalFacts?.filter(fact => fact.key === FACT_KEY_BY_FIELD[field] && beerSheetContext(fact.context, fact.key) && (fact.source || fact.sourceUrl)).find(fact =>
    typeof proposed === 'number'
      ? !!fact.range && (field === 'fermTempMinC' ? fact.range.min : field === 'fermTempMaxC' ? fact.range.max
        : fact.range.min === fact.range.max ? fact.range.min : undefined) === proposed
      : typeof proposed === 'string' && !!fact.reported?.toLocaleLowerCase('fr').includes(proposed.trim().toLocaleLowerCase('fr')));
  return fact ? { exact: true, label: fact.source || 'Source publiée', url: fact.sourceUrl }
    : facts.source?.trim() ? { exact: false, label: facts.source, url: facts.sourceUrl } : undefined;
};
const SourceLine = ({ source }: { source?: ReturnType<typeof proposedSource> }) => source ? <div className="text-cave-400">
  {source.exact ? 'Source du fait' : 'Source de la fiche'} : {source.url
    ? <a className="text-water underline" href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}
</div> : null;

// ---------------------------------------------------------------------------
// Revue d'une fiche de levure : ajouts, concordances, écarts et identité.
// ---------------------------------------------------------------------------

export type YeastReviewId = 'lab' | 'strain' | 'form' | YeastDocumentaryKey | 'flocculation' | 'fermentDays' | 'fermentation';
type ReviewSource = NonNullable<ReturnType<typeof proposedSource>>;
export interface YeastReviewProposal { text: string; source?: ReviewSource; fact?: YeastTechnicalFact }
export interface YeastReviewItem {
  id: YeastReviewId; label: string;
  /** addition: nothing retained yet; same: equivalent reading; gap: a relevant divergence that needs the brewer. */
  status: 'addition' | 'same' | 'gap';
  /** A different laboratory or strain code puts the whole answer in doubt. */
  identity: boolean;
  current: string; proposals: YeastReviewProposal[]; reason?: string;
}
export interface YeastReview {
  items: YeastReviewItem[];
  /** Same retained value, with a source observation that is not yet in this sheet. */
  corroborating: YeastReviewItem[];
  /** Narrative notes not yet in the sheet; never a data conflict. */
  newNotes: YeastDocumentaryNote[];
  /** Other sourced observations (pitch rate, species…) not yet in the sheet. */
  otherObservations: number;
  /** Observations kept as information only: another medium or condition. */
  outsideBeer: string[];
  identityGap: boolean;
}
const REVIEW_LABELS: Record<YeastReviewId, string> = { lab: 'Laboratoire', strain: 'Code de souche', form: 'Forme', ...YEAST_SHEET_LABELS,
  fermentDays: 'Durée indicative de la fiche', fermentation: 'Assimilation et domaine publié' };
// Response scalars, observation key and recipe fields carried by each reviewed group.
const REVIEW_SCALARS: Record<YeastReviewId, (keyof IngredientFacts)[]> = { lab: ['lab'], strain: ['strain'], form: ['form'],
  temperature: ['tempMinC', 'tempMaxC'], attenuation: ['attenuationPct'], alcoholTolerance: ['alcoholTolerancePct'], flocculation: ['flocculation'],
  fermentDays: ['fermentDays'], fermentation: ['fermentation'] };
const REVIEW_FACT_KEY: Partial<Record<YeastReviewId, YeastTechnicalFact['key']>> = { form: 'form', temperature: 'temperature', attenuation: 'attenuation',
  alcoholTolerance: 'alcoholTolerance', flocculation: 'flocculation', fermentDays: 'fermentationTime' };
const REVIEW_FIELDS: Record<YeastReviewId, YeastFactField[]> = { lab: ['lab'], strain: ['strain'], form: ['form'], temperature: ['fermTempMinC', 'fermTempMaxC'],
  attenuation: ['attenuationPct'], alcoholTolerance: ['alcoholTolerancePct'], flocculation: ['flocculation'], fermentDays: ['fermentDays'], fermentation: ['fermentationFacts'] };
const RANGE_IDS: YeastDocumentaryKey[] = ['temperature', 'attenuation', 'alcoholTolerance'];
const reviewIdFor = (key: YeastTechnicalFact['key']) => (Object.keys(REVIEW_FACT_KEY) as YeastReviewId[]).find(id => REVIEW_FACT_KEY[id] === key);
const compact = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
/** A shorter label naming the same maker or code is not an identity conflict. */
const sameIdentity = (a: string, b: string, field: 'lab' | 'strain' = 'lab') => {
  const x = compact(a), y = compact(b);
  // A code's prefix identifies neither the same strain nor the same product.
  return x === y || field === 'lab' && x.length > 1 && y.length > 1 && (x.includes(y) || y.includes(x));
};
const sameObservation = (a: YeastTechnicalFact, b: YeastTechnicalFact) =>
  JSON.stringify([a.key, a.range, a.qualifier, a.unit]) === JSON.stringify([b.key, b.range, b.qualifier, b.unit]) && (a.range || yeastCategoryKey(a.reported) === yeastCategoryKey(b.reported));
const sourceIdentity = (value?: { source?: string; sourceUrl?: string; label?: string; url?: string }) => {
  const url = value?.sourceUrl?.trim() || value?.url?.trim();
  if (url) return `url:${url}`;
  const label = value?.source?.trim() || value?.label?.trim();
  return label ? `label:${compact(label)}` : undefined;
};
const sameEvidenceValue = (id: YeastReviewId, proposed: YeastTechnicalFact, existing: YeastTechnicalFact) => {
  if (proposed.key !== existing.key || !beerSheetContext(existing.context, existing.key)) return false;
  if ((RANGE_IDS as string[]).includes(id)) {
    const key = id as YeastDocumentaryKey;
    return sameReading(key, readYeastFactValue(proposed).value, existing)
      || sameReading(key, readYeastFactValue(existing).value, proposed);
  }
  if (id === 'flocculation') return yeastCategoryKey(proposed.reported) === yeastCategoryKey(existing.reported);
  return id === 'fermentDays' && sameObservation(proposed, existing);
};
const exact = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 20 });
/** Value and its type, once: a point already names itself (« valeur ponctuelle »). */
const typedText = (value: Parameters<typeof yeastValueText>[0], unit: string) => value.kind === 'point'
  ? yeastValueText(value, unit) : `${yeastValueText(value, unit)} · ${YEAST_VALUE_KIND[value.kind]}`;
/** Equal typed readings; an exact Fahrenheit conversion is not a divergence. */
function sameReading(key: YeastDocumentaryKey, current: ReturnType<typeof readYeastFactValue>['value'], proposed: YeastTechnicalFact) {
  const value = readYeastFactValue(proposed).value;
  if (JSON.stringify(value) === JSON.stringify(current)) return true;
  if (key !== 'temperature' || !/^°?\s*F$/i.test(proposed.unit ?? '') || !proposed.range) return false;
  const celsius = (f: number) => Math.round((f - 32) * 5 / 9 * 10) / 10;
  return JSON.stringify(readYeastFactValue({ ...proposed, unit: '°C', range: { min: celsius(proposed.range.min), max: celsius(proposed.range.max) } }).value) === JSON.stringify(current);
}

/** Classify one lookup answer against the sheet's retained values. Only relevant divergences become gaps. */
export function reviewYeastFacts(current: YeastSpec, facts: IngredientFacts, reference?: HopYeast): YeastReview {
  const clean = sanitizeFacts(facts);
  const retained = yeastRetainedValues(current, reference);
  const incoming = yeastTechnicalFactsFromIngredient(clean) ?? [];
  const observations = yeastRangeObservations(clean);
  const changes = yeastFactChanges(current, clean);
  const sheetSource: ReviewSource | undefined = clean.source?.trim() ? { exact: false, label: clean.source, url: clean.sourceUrl } : undefined;
  const factSource = (fact: YeastTechnicalFact): ReviewSource | undefined => fact.source || fact.sourceUrl ? { exact: true, label: fact.source || 'Source publiée', url: fact.sourceUrl } : sheetSource;
  const items: YeastReviewItem[] = [];
  const push = (id: YeastReviewId, status: YeastReviewItem['status'], currentText: string, proposals: YeastReviewProposal[], reason?: string, identity = false) =>
    items.push({ id, label: REVIEW_LABELS[id], status, identity: identity && status === 'gap', current: currentText, proposals, ...(status === 'gap' && reason ? { reason } : {}) });
  for (const id of ['lab', 'strain'] as const) {
    const proposed = clean[id]?.trim(), was = current[id]?.trim();
    if (!proposed) continue;
    push(id, !was ? 'addition' : sameIdentity(was, proposed, id) ? 'same' : 'gap', was || 'Non renseigné', [{ text: proposed, source: proposedSource(clean, id, proposed) }],
      'Identité différente de la fiche : la réponse décrit peut-être un autre produit.', true);
  }
  if (clean.form) push('form', !current.form ? 'addition' : current.form === clean.form ? 'same' : 'gap', current.form ?? 'Non renseignée',
    [{ text: clean.form, source: proposedSource(clean, 'form', clean.form) }], 'Forme de produit différente : vérifie le produit visé.');
  for (const key of RANGE_IDS) {
    const unit = YEAST_DOCUMENTARY_UNITS[key].shown, variants = observations[key] ?? [];
    const scalar = changes.filter(change => REVIEW_FIELDS[key].includes(change.field));
    if (!variants.length && !scalar.length) continue;
    const was = retained[key];
    const currentText = was.value.kind === 'unknown' ? was.reviewedUnknown ? 'Inconnue après revue' : 'Non renseignée' : typedText(was.value, unit);
    const proposals = variants.length ? variants.map(fact => ({ text: typedText(readYeastFactValue(fact).value, unit), source: factSource(fact), fact }))
      : scalar.map(change => ({ text: `${change.label.replace(/ \(.*\)$/, '')} : ${typeof change.proposed === 'number' ? exact(change.proposed) : String(change.proposed)} ${unit}`, source: sheetSource }));
    const kindChange = variants.length === 1 && was.value.kind !== 'unknown' && readYeastFactValue(variants[0]).value.kind !== was.value.kind
      ? ` Type différent : ${YEAST_VALUE_KIND[was.value.kind]} → ${YEAST_VALUE_KIND[readYeastFactValue(variants[0]).value.kind]}.` : '';
    if (variants.length > 1) push(key, 'gap', currentText, proposals, 'La réponse publie plusieurs valeurs différentes pour la bière : choisis celle à retenir.');
    else if (was.value.kind === 'unknown') push(key, was.reviewedUnknown ? 'gap' : 'addition', currentText, proposals, 'Valeur marquée inconnue lors d’une revue précédente.');
    else if (variants.length === 1 && sameReading(key, was.value, variants[0])) push(key, 'same', currentText, proposals);
    else push(key, 'gap', currentText, proposals, `${was.origin === 'personal' ? 'Diffère de ta valeur saisie ou corrigée.' : 'Diffère de la valeur retenue.'}${kindChange}`);
  }
  const flocculation = [...new Map(incoming.filter(fact => fact.key === 'flocculation' && beerSheetContext(fact.context, 'flocculation') && readYeastFactValue(fact).value.kind === 'category')
    .map(fact => [yeastCategoryKey(fact.reported), fact])).values()];
  if (flocculation.length) {
    const was = retained.flocculation, text = was.value.kind === 'category' ? was.value.value : '';
    const proposals = flocculation.map(fact => ({ text: fact.reported, source: factSource(fact), fact }));
    if (flocculation.length > 1) push('flocculation', 'gap', text || 'Non renseignée', proposals, 'Les sources de la réponse ne s’accordent pas : choisis la catégorie à retenir.');
    else if (!text) push('flocculation', was.reviewedUnknown ? 'gap' : 'addition', was.reviewedUnknown ? 'Inconnue après revue' : 'Non renseignée', proposals, 'Valeur marquée inconnue lors d’une revue précédente.');
    else push('flocculation', yeastCategoryKey(text) === yeastCategoryKey(flocculation[0].reported) ? 'same' : 'gap', text, proposals, 'Catégorie différente de la valeur retenue.');
  }
  const days = [...new Map(incoming.filter(fact => fact.key === 'fermentationTime' && fact.range && beerSheetContext(fact.context, 'fermentationTime'))
    .map(fact => [JSON.stringify([fact.range, fact.qualifier, fact.unit]), fact])).values()];
  if (days.length) {
    const proposals = days.map(fact => ({ text: yeastValueText(readYeastFactValue(fact).value, fact.unit), source: factSource(fact), fact }));
    const was = current.fermentDays, currentText = was == null ? 'Non renseignée' : `${exact(was)} j`;
    if (days.length > 1) push('fermentDays', 'gap', currentText, proposals, 'La réponse publie plusieurs durées différentes : choisis celle à retenir.');
    else if (clean.fermentDays != null) push('fermentDays', was == null ? 'addition' : was === clean.fermentDays ? 'same' : 'gap', currentText, proposals, 'Durée de fiche différente (un repère, jamais un palier).');
  }
  if (clean.fermentation) push('fermentation', !current.fermentationFacts ? 'addition' : JSON.stringify(current.fermentationFacts) === JSON.stringify(clean.fermentation) ? 'same' : 'gap',
    current.fermentationFacts ? 'Document déjà présent' : 'Non renseigné', [{ text: `Document sourcé · ${clean.fermentation.source.title ?? clean.fermentation.source.reference}`, source: sheetSource }],
    'Un autre document d’assimilation est déjà retenu.');
  const reviewed = new Set(Object.values(REVIEW_FACT_KEY));
  const known = new Set((current.technicalFacts ?? []).map(fact => JSON.stringify(fact)));
  const currentNotes = readYeastDocumentaryNotes(current.documentaryNotes ?? []) ?? [];
  const corroborating = items.filter(item => item.status === 'same' && item.proposals.some(proposal => {
    const fact = proposal.fact, source = sourceIdentity(fact) ?? sourceIdentity(proposal.source);
    if (!fact || !source) return false;
    const alreadyKnown = (current.technicalFacts ?? []).some(existing => sameEvidenceValue(item.id, fact, existing) && sourceIdentity(existing) === source);
    const retainedValue = item.id === 'flocculation' ? retained.flocculation
      : (RANGE_IDS as string[]).includes(item.id) ? retained[item.id as YeastDocumentaryKey] : undefined;
    const retainedSource = retainedValue?.fact ? sourceIdentity(retainedValue.fact)
      : sourceIdentity({ source: retainedValue?.source, sourceUrl: retainedValue?.sourceUrl });
    return !alreadyKnown && retainedSource !== source;
  }));
  return {
    items, corroborating,
    newNotes: (clean.documentaryNotes ?? []).filter(note => !currentNotes.some(existing => JSON.stringify(existing) === JSON.stringify(note))),
    otherObservations: incoming.filter(fact => !reviewed.has(fact.key) && !known.has(JSON.stringify(fact))).length,
    outsideBeer: [...new Set(incoming.filter(fact => reviewed.has(fact.key) && !beerSheetContext(fact.context, fact.key)).map(fact => `${YEAST_FACT_LABELS[fact.key]} · ${fact.context}`))],
    identityGap: items.some(item => item.identity),
  };
}

/** Apply only the accepted groups of one answer. Kept and deferred groups stay untouched;
 * a same-valued corroboration adds evidence without replacing the retained selection. */
export function applyYeastReview(current: YeastSpec, facts: IngredientFacts, review: YeastReview, accept: ReadonlySet<YeastReviewId>,
  observations: Partial<Record<YeastReviewId, number>> = {}, notes: YeastDocumentaryNotesDecision | false = false, includeOthers = false): { yeast: YeastSpec; applied: IngredientFacts } {
  const clean = sanitizeFacts(facts);
  const applied: IngredientFacts = { ...clean };
  const technical: YeastTechnicalFact[] = [];
  for (const fact of clean.technicalFacts ?? []) {
    const id = reviewIdFor(fact.key), item = id && review.items.find(row => row.id === id);
    // Unreviewed observations (pitch rate, species…) join only with the independent data, never with one gap's decision.
    if (!id || !item) { if (includeOthers) technical.push(fact); continue; }
    // Another medium never fills a field: kept as information only.
    if (!beerSheetContext(fact.context, fact.key)) { if (accept.has(id) || includeOthers) technical.push(fact); continue; }
    if (!accept.has(id)) continue;
    const chosen = observations[id] === undefined ? undefined : item.proposals[observations[id]!]?.fact;
    if (chosen && !sameObservation(chosen, fact)) continue;
    technical.push(fact);
  }
  // A chosen observation derived from the response's scalars is carried explicitly.
  for (const [id, index] of Object.entries(observations) as [YeastReviewId, number][]) {
    const fact = review.items.find(row => row.id === id)?.proposals[index]?.fact;
    if (accept.has(id) && fact && !technical.some(row => sameObservation(row, fact) && row.source === fact.source)) technical.push(fact);
  }
  applied.technicalFacts = technical.length ? technical : undefined;
  const corroboratingIds = new Set(review.corroborating.map(item => item.id));
  for (const item of review.items) if (!accept.has(item.id) || observations[item.id] !== undefined || corroboratingIds.has(item.id))
    for (const field of REVIEW_SCALARS[item.id]) delete applied[field];
  if (notes === false) delete applied.documentaryNotes;
  const gaps = review.items.filter(item => accept.has(item.id) && item.status === 'gap');
  const rangeChoices = Object.fromEntries(gaps.filter(item => (RANGE_IDS as string[]).includes(item.id)).map(item => [item.id, 'replace' as const])) as Partial<Record<YeastRangeKey, 'replace'>>;
  const corroboratingFacts = technical.filter(fact => review.corroborating.some(item =>
    item.proposals.some(proposal => proposal.fact && sameEvidenceValue(item.id, proposal.fact, fact))));
  const corroboratingSet = new Set(corroboratingFacts);
  const selectionFacts = technical.filter(fact => !corroboratingSet.has(fact));
  const factsForSelection = { ...applied,
    technicalFacts: selectionFacts.length ? selectionFacts : undefined };
  let yeast = applyReviewedYeastFacts(current, factsForSelection, gaps.flatMap(item => REVIEW_FIELDS[item.id]), rangeChoices, {}, notes === false ? 'keep' : notes);
  // Corroborating evidence is appended without turning a same-valued source into
  // the selected fact or deriving a new scalar/hypothesis from it.
  if (corroboratingFacts.length) yeast = { ...yeast,
    technicalFacts: mergeYeastTechnicalFacts(yeast.technicalFacts, corroboratingFacts) };
  // The accepted observation itself is the retained value, whatever older scalar the sheet carried.
  for (const item of review.items) {
    if (!accept.has(item.id) || item.status === 'same' || !(RANGE_IDS as string[]).includes(item.id)) continue;
    const fact = observations[item.id] !== undefined ? item.proposals[observations[item.id]!]?.fact : item.proposals.length === 1 ? item.proposals[0].fact : undefined;
    if (fact?.range) yeast = withRetainedYeastFact(yeast, item.id as YeastDocumentaryKey, fact);
  }
  // A recipe or measured hypothesis is not documentary data: reviewing the sheet never replaces it.
  if (current.attenuationBasis === 'recipe' || current.attenuationBasis === 'measured' || current.attenuationBasis === undefined && current.attenuationPct != null && !current.technicalSelections?.attenuation)
    yeast = { ...yeast, attenuationPct: current.attenuationPct, attenuationBasis: current.attenuationBasis ?? 'recipe' };
  return { yeast, applied };
}

export type YeastVerdict = { verdict: 'proposal' | 'current' | 'inconclusive'; index?: number; text: string; source?: ReviewSource };
/** A targeted second lookup recommends; the brewer still decides. It never loops and never writes. */
export function verifyYeastReview(current: YeastSpec, reference: HopYeast | undefined, review: YeastReview, verification: IngredientFacts): Partial<Record<YeastReviewId, YeastVerdict>> {
  const second = reviewYeastFacts(current, verification, reference);
  return Object.fromEntries(review.items.filter(item => item.status === 'gap').map(item => {
    const again = second.items.find(row => row.id === item.id);
    if (!again) return [item.id, { verdict: 'inconclusive', text: 'la vérification ne publie pas cette donnée' }];
    if (again.status === 'same') return [item.id, { verdict: 'current', text: again.current, source: again.proposals[0]?.source }];
    if (again.proposals.length !== 1) return [item.id, { verdict: 'inconclusive', text: 'plusieurs valeurs encore publiées' }];
    const found = again.proposals[0], index = item.proposals.findIndex(proposal => item.identity ? sameIdentity(proposal.text, found.text, item.id === 'strain' ? 'strain' : 'lab') : proposal.text === found.text);
    return [item.id, index >= 0 ? { verdict: 'proposal', index, text: found.text, source: found.source } : { verdict: 'inconclusive', text: `autre valeur publiée : ${found.text}`, source: found.source }];
  }));
}

export interface YeastVerifyItem { field: YeastReviewId; label: string; current: string; proposed: string[]; sources: string[] }
export type YeastLookupResult = { ok: true; facts: IngredientFacts } | { ok: false; error: string };
/** Documentary identity sent to the lookup: no quantity, stock lot operation or recipe hypothesis. */
const documentaryKnown = ({ qty: _qty, unit: _unit, pitchTempC: _pitch, notes: _notes, ...yeast }: YeastSpec) => yeast;
/** One explicit lookup for one strain. The answer is adapted once, here: its note becomes a documentary note with this answer's provenance. */
export async function lookupYeastSheet(yeast: YeastSpec, options: { nolo?: boolean; supplier?: string; verify?: YeastVerifyItem[] } = {}): Promise<YeastLookupResult> {
  const name = yeast.name.trim();
  try {
    const res = await AiClient.run<IngredientFacts>({
      task: 'lookupIngredient', tier: 'fast',
      instruction: `levure : ${name}${options.verify ? ` — vérifier seulement : ${options.verify.map(item => item.label).join(', ')}` : ''}`,
      context: { kind: 'levure', name, stockItemRef: yeast.stockItemRef, supplier: options.supplier,
        manquant: ingredientGaps([], [], yeast, options.nolo).find(gap => gap.kind === 'levure')?.missing ?? [], nolo: !!options.nolo,
        reviewTechnicalSheet: true, known: documentaryKnown(yeast), ...(options.verify ? { verifyDifferences: options.verify } : {}) }
    });
    if (!res.ok || !res.data?.found || !res.data.source?.trim()) return { ok: false, error: res.error ?? 'Rien de publié retrouvé pour cette levure.' };
    const facts = sanitizeFacts(adaptYeastLookupResult(res.data));
    // Identity belongs to the local catalogue, never to model output.
    delete facts.hopIndexId;
    // A targeted verification can validly confirm the retained value. It is
    // evidence for the brewer's decision even though it produces no value diff.
    const confirmation = !!options.verify?.length && reviewYeastFacts(yeast, facts).items.some(item =>
      options.verify!.some(requested => requested.field === item.id));
    const content = confirmation || (facts.technicalFacts?.length ?? 0) > 0 || !!facts.documentaryNotes?.length || yeastFactChanges(yeast, facts).length > 0;
    return content ? { ok: true, facts } : { ok: false, error: 'La fiche retrouvée n’apporte aucune donnée de levure exploitable.' };
  } catch { return { ok: false, error: 'Recherche interrompue. Tu peux réessayer.' }; }
}

let lookupSequence = 0;
export type YeastSheetAccept = { accepted: true; revision: string } | { accepted: false; message: string };
/** `expected` is the basis the proposal belongs to; the owner refuses the write when its sheet has moved on. */
export type YeastSheetAcceptHandler = (next: YeastSpec, applied: IngredientFacts | undefined, labels: string[], expected: string) => YeastSheetAccept;
export interface YeastLookupEntry {
  requestId: number;
  /** Sheet basis the answer was requested for; rebased only after this review's own acceptance. */
  revision: string;
  status: 'busy' | 'ready' | 'error' | 'stale';
  facts?: IngredientFacts; error?: string; message?: string;
  kept: YeastReviewId[]; deferred: YeastReviewId[]; applied: string[];
  identityConfirmed: boolean;
  /** 'add' (default), 'skip', or the index of the existing note to replace. */
  notesChoice: 'add' | 'skip' | number;
  verification?: { status: 'busy' | 'ready' | 'error'; requestId: number; facts?: IngredientFacts; error?: string };
}
const freshEntry = (requestId: number, revision: string): YeastLookupEntry =>
  ({ requestId, revision, status: 'busy', kept: [], deferred: [], applied: [], identityConfirmed: false, notesChoice: 'add' });

function ReviewSourceLink({ source }: { source?: ReviewSource }) {
  if (!source) return null;
  return <span className="yc-review-source">{source.exact ? 'source du fait' : 'fiche consultée'} : {source.url
    ? <a className="yeast-source" href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</span>;
}

/** Compact review: one gesture for coherent data, a compact zone for the exceptions, explicit retained/remaining lists. */
function YeastReviewPanel({ subject, yeast, reference, entry, onEntry, onAccept, onVerify, scopeText }: {
  subject: string; yeast: YeastSpec; reference?: HopYeast; entry: YeastLookupEntry & { facts: IngredientFacts };
  onEntry: (update: (entry?: YeastLookupEntry) => YeastLookupEntry | undefined) => void;
  onAccept: YeastSheetAcceptHandler;
  onVerify: (items: YeastVerifyItem[]) => void; scopeText: string;
}) {
  const [manual, setManual] = useState<YeastReviewId>();
  const review = useMemo(() => reviewYeastFacts(yeast, entry.facts, reference), [yeast, entry.facts, reference]);
  const verdicts = entry.verification?.status === 'ready' && entry.verification.facts ? verifyYeastReview(yeast, reference, review, entry.verification.facts) : {};
  const gaps = review.items.filter(item => item.status === 'gap' && !entry.kept.includes(item.id));
  const pending = gaps.filter(item => !entry.deferred.includes(item.id)), later = gaps.filter(item => entry.deferred.includes(item.id));
  const additions = review.items.filter(item => item.status === 'addition');
  const same = review.items.filter(item => item.status === 'same');
  const corroboratingIds = new Set(review.corroborating.map(item => item.id));
  const sameOnly = same.filter(item => !corroboratingIds.has(item.id));
  const notes = entry.notesChoice === 'skip' ? [] : review.newNotes;
  const blocked = review.identityGap && !entry.identityConfirmed;
  const independent = additions.length > 0 || review.corroborating.length > 0 || notes.length > 0 || review.otherObservations > 0;
  const currentNotes = Array.isArray(yeast.documentaryNotes) ? yeast.documentaryNotes : [];
  const accept = (next: YeastSpec, applied: IngredientFacts | undefined, labels: string[]) => {
    // Checked again at acceptance against the basis this answer was requested (or rebased) for.
    const result = onAccept(next, applied, labels, entry.revision);
    onEntry(current => current && (result.accepted === true ? { ...current, revision: result.revision, applied: labels, message: undefined }
      : { ...current, message: result.message }));
    setManual(undefined);
  };
  const acceptIndependent = () => {
    const decision: YeastDocumentaryNotesDecision | false = !notes.length ? false
      : typeof entry.notesChoice === 'number' && currentNotes[entry.notesChoice] ? { action: 'replace', target: currentNotes[entry.notesChoice] } : 'add';
    const coherent = [...additions, ...review.corroborating];
    const { yeast: next, applied } = applyYeastReview(yeast, entry.facts, review, new Set(coherent.map(item => item.id)), {}, decision, true);
    accept(next, applied, [...additions.map(item => item.label), ...review.corroborating.map(item => `${item.label} · source concordante`), ...(notes.length ? [notes.length > 1 ? `${notes.length} notes documentaires` : 'note documentaire'] : []),
      ...(review.otherObservations ? [`${review.otherObservations} autre${review.otherObservations > 1 ? 's' : ''} observation${review.otherObservations > 1 ? 's' : ''}`] : [])]);
  };
  const acceptGap = (item: YeastReviewItem, index?: number) => {
    const { yeast: next, applied } = applyYeastReview(yeast, entry.facts, review, new Set([item.id]), index === undefined ? {} : { [item.id]: index });
    accept(next, applied, [item.label]);
  };
  const keep = (item: YeastReviewItem) => onEntry(current => current && { ...current, kept: [...current.kept, item.id], deferred: current.deferred.filter(id => id !== item.id) });
  const defer = (item: YeastReviewItem) => onEntry(current => current && { ...current, deferred: [...current.deferred, item.id] });
  const verifying = entry.verification?.status === 'busy';
  const typed = (id: YeastReviewId): id is YeastDocumentaryKey | 'flocculation' => id === 'flocculation' || (RANGE_IDS as string[]).includes(id);
  const clean = entry.facts;
  // The consulted sheet is named once, in the status line; a row only names a source of its own.
  // A fact cited from that same document (same URL, or same title without URL) is not repeated under each row.
  const sheetSourceKey = sourceIdentity({ source: clean.source, sourceUrl: clean.sourceUrl });
  const ownSource = (source?: ReviewSource) => source && sourceIdentity(source) !== sheetSourceKey ? source : undefined;
  const gapRow = (item: YeastReviewItem) => {
    const verdict = verdicts[item.id];
    return <div key={item.id} role="group" aria-label={`Écart · ${item.label}`} className="yc-review-gap" data-review-gap={item.id} data-identity={item.identity || undefined}>
      <p><strong>{item.label}</strong>{item.reason && <span className="yeast-small"> · {item.reason}</span>}</p>
      <dl className="yc-review-compare"><div><dt>Actuelle</dt><dd data-side="current">{item.current}</dd></div>
        <div><dt>{item.proposals.length > 1 ? 'Proposées' : 'Proposée'}</dt><dd data-side="proposed">{item.proposals.map((proposal, index) =>
          <span key={index} className="block">{proposal.text} <ReviewSourceLink source={ownSource(proposal.source)} /></span>)}</dd></div></dl>
      {verdict && <p className="yc-review-verdict" data-verdict={verdict.verdict}>{verdict.verdict === 'proposal' ? `Vérification IA : confirme « ${verdict.text} ».`
        : verdict.verdict === 'current' ? 'Vérification IA : confirme la valeur actuelle.' : `Vérification IA non concluante : ${verdict.text}. À toi de choisir ou de reporter.`}
        {verdict.source && <> <ReviewSourceLink source={verdict.source} /></>}
        {verdict.verdict !== 'inconclusive' && !blocked && <> <button type="button" className="yeast-link" onClick={() => verdict.verdict === 'proposal' ? acceptGap(item, item.proposals.length > 1 ? verdict.index : undefined) : keep(item)}>
          Suivre la vérification</button></>}</p>}
      {manual === item.id && typed(item.id) ? item.id === 'flocculation'
        ? <YeastFlocculationEditor initial={item.proposals[0]?.text ?? ''} submitLabel="Retenir ma valeur" onCancel={() => setManual(undefined)}
          onRetain={fact => accept(withRetainedYeastFact(yeast, 'flocculation', fact), undefined, [`${item.label} (valeur personnelle)`])} />
        : <YeastMeasuredFactEditor factKey={item.id} initial={item.proposals[0]?.fact ? readYeastFactValue(item.proposals[0].fact).value : { kind: 'unknown' }} submitLabel="Retenir ma valeur"
          onCancel={() => setManual(undefined)} onRetain={fact => accept(withRetainedYeastFact(yeast, item.id as YeastDocumentaryKey, fact), undefined, [`${item.label} (valeur personnelle)`])} />
        : <div className="yc-review-actions">
          {item.proposals.length === 1 ? <button type="button" disabled={blocked} onClick={() => acceptGap(item)}>Prendre la proposition</button>
            : item.proposals.map((proposal, index) => <button type="button" key={index} disabled={blocked} onClick={() => acceptGap(item, index)}>Prendre {proposal.text}</button>)}
          <button type="button" onClick={() => keep(item)}>{item.current.startsWith('Non renseign') ? 'Laisser non renseignée' : 'Garder l’actuelle'}</button>
          {typed(item.id) && <button type="button" className="yeast-link" disabled={blocked} onClick={() => setManual(item.id)}>Saisir ma valeur</button>}
          {!entry.deferred.includes(item.id) ? <button type="button" className="yeast-link" onClick={() => defer(item)}>Plus tard</button>
            : <button type="button" className="yeast-link" onClick={() => onEntry(current => current && { ...current, deferred: current.deferred.filter(id => id !== item.id) })}>Revoir maintenant</button>}
        </div>}
    </div>;
  };
  const verifyItems = [...pending, ...later].map(item => ({ field: item.id, label: item.label, current: item.current,
    proposed: item.proposals.map(proposal => proposal.text), sources: item.proposals.flatMap(proposal => proposal.source ? [proposal.source.label] : []) }));
  // Verification concerns the gaps only: it is offered inside their zone, never beside the coherent data.
  const verifyAction = (pending.length > 0 || later.length > 0 || blocked) && <div className="yc-review-actions" data-review-verify>
    <button type="button" disabled={verifying || !!entry.verification} onClick={() => onVerify(verifyItems)}>
      {verifying ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Vérification…</> : entry.verification ? 'Vérification faite' : 'Vérifier avec l’IA applicative'}</button>
    {entry.verification?.status === 'error' && <p role="alert" className="yeast-small">Vérification impossible : {entry.verification.error}</p>}
  </div>;
  return <section className="yc-review" aria-label={`Proposition IA pour ${subject}`}>
    <p role="status" className="yeast-small" data-review-found>Fiche retrouvée{clean.source ? <> : {clean.sourceUrl
      ? <a className="yeast-source" href={clean.sourceUrl} target="_blank" rel="noreferrer">{clean.source}</a> : clean.source}</> : null}.{scopeText ? ` ${scopeText}` : ''} Rien n’est retenu avant ta validation.</p>
    {blocked && <div role="alert" className="yc-review-identity">
      <strong>Identité à confirmer</strong>
      <p>La réponse ne décrit peut-être pas {subject} ({review.items.filter(item => item.identity).map(item => `${item.label.toLowerCase()} : ${item.current} → ${item.proposals[0].text}`).join(' ; ')}). Tant que l’identité n’est pas confirmée, aucune donnée de cette réponse n’est retenue.</p>
      <div className="yc-review-actions"><button type="button" onClick={() => onEntry(current => current && { ...current, identityConfirmed: true })}>C’est bien {subject}</button>
        <button type="button" className="yeast-link" onClick={() => onEntry(() => undefined)}>Ignorer la réponse</button></div>
    </div>}
    {entry.applied.length > 0 && <p role="status" className="yc-review-applied" data-review-applied>Retenu dans la fiche de {subject} : {entry.applied.join(', ')}.</p>}
    {entry.message && <p role="alert" className="yeast-error">{entry.message}</p>}
    {(additions.length > 0 || notes.length > 0) && <ul className="yc-review-list" aria-label={`Données proposées pour ${subject}`}>
      {additions.map(item => <li key={item.id} data-review-item={item.id} data-review-status="addition"><span className="yc-fact-label">{item.label}</span>
        <span>{item.proposals[0]?.text}<span className="yc-tag">ajout</span></span><ReviewSourceLink source={ownSource(item.proposals[0]?.source)} /></li>)}
      {notes.map((note, index) => <li key={`note-${index}`} data-review-item="note" data-review-status="addition"><span className="yc-fact-label">Note documentaire</span>
        <span>{note.text}</span>
        {note.source && <span className="yc-review-source">référence de recherche : {note.sourceUrl ? <a className="yeast-source" href={note.sourceUrl} target="_blank" rel="noreferrer">{note.source}</a> : note.source}</span>}
      </li>)}
    </ul>}
    {review.newNotes.length > 0 && <label className="yc-review-note-choice">Note proposée<select aria-label="Décision pour la note documentaire proposée" value={String(entry.notesChoice)}
      onChange={e => { const value = e.target.value; onEntry(current => current && { ...current, notesChoice: value === 'add' || value === 'skip' ? value : Number(value) }); }}>
      <option value="add">L’ajouter à la fiche</option>
      {currentNotes.map((note, index) => <option key={index} value={index}>Remplacer « {note.text.slice(0, 40)}{note.text.length > 40 ? '…' : ''} »</option>)}
      <option value="skip">Ne pas l’ajouter</option>
    </select></label>}
    {review.otherObservations > 0 && <p className="yeast-small">{review.otherObservations} autre{review.otherObservations > 1 ? 's' : ''} observation{review.otherObservations > 1 ? 's' : ''} sourcée{review.otherObservations > 1 ? 's' : ''} (ensemencement, espèce…) jointe{review.otherObservations > 1 ? 's' : ''} à la fiche, sans calcul.</p>}
    {review.corroborating.length > 0 && <section className="space-y-1" aria-label="Sources concordantes à conserver">
      <h5>Sources concordantes · valeur inchangée</h5>
      <ul className="yc-review-list" aria-label="Observations documentaires concordantes">
        {review.corroborating.flatMap(item => item.proposals.map((proposal, index) => <li key={`${item.id}-${index}`} data-review-item={item.id} data-review-status="corroborating">
          <span className="yc-fact-label">{item.label}</span><span>{proposal.text}</span><ReviewSourceLink source={ownSource(proposal.source)} />
        </li>))}
      </ul>
      <p className="yeast-small">Cette validation conserve les observations et leurs sources sans remplacer la valeur retenue.</p>
    </section>}
    {sameOnly.length > 0 && <p className="yeast-small" data-review-same>Concordant avec la fiche actuelle : {sameOnly.map(item => item.label).join(', ')}.</p>}
    {review.outsideBeer.length > 0 && <p className="yeast-small">Conservé comme information, non repris dans les calculs : {review.outsideBeer.join(' ; ')}.</p>}
    {/* The one-gesture validation sits right under the data it retains, before the exceptions. */}
    {independent && <div className="yc-review-actions"><button type="button" className="yc-review-primary" disabled={blocked} onClick={acceptIndependent}>
      <Check className="w-4 h-4" aria-hidden="true" />{pending.length ? 'Valider les données sans conflit' : 'Tout valider'}</button></div>}
    {pending.length > 0 && <section className="yc-review-gaps" aria-label="Écarts à vérifier"><h5>Écarts à vérifier · {pending.length}</h5>{pending.map(gapRow)}{verifyAction}</section>}
    {later.length > 0 && <details className="yc-review-later"><summary>Plus tard · {later.map(item => item.label).join(', ')}</summary>{later.map(gapRow)}</details>}
    {!pending.length && verifyAction}
    {entry.kept.length > 0 && <p className="yeast-small">Conservé tel quel : {review.items.filter(item => entry.kept.includes(item.id)).map(item => item.label).join(', ')}.</p>}
    <div className="yc-review-actions">
      <button type="button" className="yeast-link" onClick={() => onEntry(() => undefined)}>{independent || pending.length ? 'Ignorer la proposition' : 'Fermer la proposition'}</button>
    </div>
    {!independent && !pending.length && !later.length && !blocked && <p className="yeast-small" data-review-done>Rien d’autre à retenir de cette réponse.</p>}
  </section>;
}

/** Search, review and accept one strain's sheet. The answer is checked against identity, request and basis at reception and at acceptance. */
export function YeastSheetAssistant({ subject, yeast, reference, revision, latestRevision, entry, onEntry, onAccept, scopeText, nolo, supplier, searchLabel = 'Rechercher la fiche avec l’IA' }: {
  subject: string; yeast: YeastSpec; reference?: HopYeast;
  /** Current basis of the reviewed sheet (candidate revision or recipe yeast). */
  revision: string; latestRevision: () => string;
  entry?: YeastLookupEntry; onEntry: (update: (entry?: YeastLookupEntry) => YeastLookupEntry | undefined) => void;
  onAccept: YeastSheetAcceptHandler;
  scopeText: string; nolo?: boolean; supplier?: string; searchLabel?: string;
}) {
  const search = async () => {
    const requestId = ++lookupSequence, started = revision;
    onEntry(() => freshEntry(requestId, started));
    const result = await lookupYeastSheet(yeast, { nolo, supplier });
    onEntry(current => {
      // A cancelled or superseded request never replaces the current proposal.
      if (!current || current.requestId !== requestId) return current;
      if (latestRevision() !== started) return { ...current, status: 'stale', facts: undefined };
      return result.ok === true ? { ...current, status: 'ready', facts: result.facts } : { ...current, status: 'error', error: result.error };
    });
  };
  const verify = async (items: YeastVerifyItem[]) => {
    const requestId = ++lookupSequence, started = revision;
    onEntry(current => current && { ...current, verification: { status: 'busy', requestId } });
    const result = await lookupYeastSheet(yeast, { nolo, supplier, verify: items });
    onEntry(current => {
      if (!current || current.verification?.requestId !== requestId) return current;
      if (latestRevision() !== started || current.revision !== started) return { ...current, verification: undefined };
      return { ...current, verification: result.ok === true ? { status: 'ready', requestId, facts: result.facts } : { status: 'error', requestId, error: result.error } };
    });
  };
  const stale = !!entry && entry.status !== 'busy' && (entry.status === 'stale' || entry.revision !== revision);
  if (entry?.status === 'busy') return <div className="yc-sheet-assistant" aria-busy="true">
    <p role="status" className="yeast-small"><Loader2 className="w-4 h-4 animate-spin inline" aria-hidden="true" /> Recherche des fiches…</p>
    <button type="button" className="yeast-link" onClick={() => onEntry(() => undefined)}>Annuler la recherche</button>
  </div>;
  if (entry?.status === 'ready' && entry.facts && !stale)
    return <YeastReviewPanel subject={subject} yeast={yeast} reference={reference} entry={entry as YeastLookupEntry & { facts: IngredientFacts }}
      onEntry={onEntry} onAccept={onAccept} onVerify={verify} scopeText={scopeText} />;
  return <div className="yc-sheet-assistant">
    {!entry && <p className="yeast-small">Retrouver les données publiées, avec leurs sources et leurs limites. {scopeText}</p>}
    {entry?.status === 'error' && <p role="alert" className="yeast-small"><AlertTriangle className="w-4 h-4 inline" aria-hidden="true" /> {entry.error} — à saisir à la main.</p>}
    {stale && <p role="status" className="yeast-small" data-review-stale>La fiche de {subject} a changé depuis cette recherche : proposition périmée, rien n’a été retenu.</p>}
    <button type="button" className="yc-sheet-search" onClick={search}><Sparkles className="w-4 h-4" aria-hidden="true" />{stale ? 'Relancer la recherche' : searchLabel}</button>
  </div>;
}

interface Found extends IngredientGap {
  facts: IngredientFacts;
}
export type RecipeYeastAcceptance = {accepted:false;message:string}|{accepted:true;yeast?:YeastSpec;reviewRevisionToken?:string|number};
interface RecipeAutoCompleteProps {
  active?: boolean;
  /** Une recherche dédiée dans une étape ; tous les ingrédients au récapitulatif. */
  scope?: IngredientKind;
  /** Optional technical-sheet review, even when calculation inputs are present. */
  yeastEnrichment?: boolean;
  reviewScope?: 'trial' | 'recipe';
  /** Opaque parent selection/book revision; missing catalogue IDs do not identify a selection. */
  reviewRevisionToken?: string | number;
  /** Embed in the yeast step's own disclosure without adding another panel. */
  embedded?: boolean;
  nolo?: boolean;
  fermentables: Fermentable[];
  onFermentables: (v: Fermentable[]) => void;
  hops: HopIngredient[];
  onHops: (v: HopIngredient[]) => void;
  yeast: YeastSpec;
  onYeast: (v: YeastSpec) => void | RecipeYeastAcceptance;
  onLearnIngredient?: LearnIngredient;
  stockItems?: StockItem[];
}

/** One strain's technical sheet in the working recipe (or a legacy trial). Nothing is written before acceptance;
 * a review scope never teaches the stock. */
function RecipeYeastReview({ yeast: originalYeast, onYeast, onLearnIngredient, stockItems = EMPTY_STOCK, active = true, reviewScope, reviewRevisionToken, embedded = false, nolo = false }: RecipeAutoCompleteProps) {
  const yeast = yeastWithAdoptedDocumentary(originalYeast);
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const reference = useMemo(() => resolveFermentationYeast({ yeast } as TrialRecipe, yeastReferences(saved)), [saved, yeast.name, yeast.hopIndexId, yeast.lab, yeast.strain]);
  const lot = stockItems.filter(item => item.category.toLocaleLowerCase('fr') === 'levure' &&
    (yeast.stockItemRef ? item.ref === yeast.stockItemRef : recipeIngredientKey('levure', item) === recipeIngredientKey('levure', yeast)));
  // A Firestore refresh with identical facts keeps the proposal. A changed
  // selected article/source invalidates an answer for the old lot.
  const lotBasis = JSON.stringify(lot.map(item => [item.ref, item.name, item.supplier, item.technicalSource, item.yeastTechnicalFacts,
    item.yeastAttenuationPct, item.yeastTempMinC, item.yeastTempMaxC]));
  const basisFor = (value: YeastSpec,token=reviewRevisionToken) => JSON.stringify([value, nolo, lotBasis,token]);
  const revision = basisFor(yeast);
  const latest = useRef(revision); latest.current = revision;
  const [entry, setEntry] = useState<YeastLookupEntry>();
  const onEntry = useCallback((update: (entry?: YeastLookupEntry) => YeastLookupEntry | undefined) => setEntry(update), []);
  if (!active || !yeast.name?.trim()) return null;
  const accept: YeastSheetAcceptHandler = (next, applied, _labels, expected) => {
    if (latest.current !== expected) return { accepted: false, message: 'La levure a changé depuis la recherche : proposition périmée, rien n’a été retenu.' };
    const adoption=tryAdoptYeastDocumentary(yeast,next,{intent:'documentary'});
    if(adoption.accepted===false)return {accepted:false,message:adoption.message};
    next=adoption.yeast;
    const parentAcceptance=onYeast(next);
    if(parentAcceptance&&parentAcceptance.accepted===false)return parentAcceptance;
    const committed=parentAcceptance&&parentAcceptance.accepted===true?parentAcceptance.yeast??next:next;
    const committedToken=parentAcceptance&&parentAcceptance.accepted===true?parentAcceptance.reviewRevisionToken??reviewRevisionToken:reviewRevisionToken;
    // A trial or recipe review promises an unchanged stock, whatever callback
    // the caller passes. Only the historic completion may teach the stock.
    // Each acceptance teaches only what it retained; an undecided field is never sent as an empty value.
    if (!reviewScope && applied) onLearnIngredient?.(yeast.name, { ...Object.fromEntries(Object.entries(factsForStock('levure', applied)).filter(([, value]) => value !== undefined)),
      ...(yeast.stockItemRef ? { ref: yeast.stockItemRef } : {}) });
    return { accepted: true, revision: basisFor(committed,committedToken) };
  };
  const scopeText = reviewScope === 'trial' ? 'Portée : cet essai, puis cette recette après application. Le stock reste inchangé.'
    : reviewScope === 'recipe' ? 'Portée : ce brouillon de recette. Le stock reste inchangé.'
      : 'Portée : cette recette ; les valeurs retenues sont aussi apprises par l’article de stock.';
  return <section aria-label="Autocomplétion des ingrédients" aria-busy={entry?.status === 'busy'} className={embedded ? 'space-y-2' : 'panel p-2 space-y-2'}>
    <YeastSheetAssistant subject={yeast.name} yeast={yeast} reference={reference} revision={revision} latestRevision={() => latest.current}
      entry={entry} onEntry={onEntry} onAccept={accept} scopeText={scopeText} nolo={nolo} supplier={lot.length === 1 ? lot[0].supplier : undefined} />
  </section>;
}

export const RecipeAutoComplete: React.FC<RecipeAutoCompleteProps> = props => props.yeastEnrichment
  ? <RecipeYeastReview {...props} /> : <IngredientCompletion {...props} />;

/** Every missing calculation input at once (recap, malt and hop steps). Only empty fields are filled. */
function IngredientCompletion({
  fermentables,
  onFermentables,
  hops,
  onHops,
  yeast: originalYeast,
  onYeast,
  onLearnIngredient,
  stockItems = EMPTY_STOCK,
  active = true,
  scope,
  yeastEnrichment = false,
  reviewScope,
  embedded = false,
  nolo = false
}: RecipeAutoCompleteProps) {
  const yeast=yeastWithAdoptedDocumentary(originalYeast);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Found[] | null>(null);
  const [foundBasis, setFoundBasis] = useState<string>();
  const [missed, setMissed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conflictChoices, setConflictChoices] = useState<Partial<Record<YeastFactField, 'keep' | 'replace'>>>({});
  const [rangeChoices, setRangeChoices] = useState<Partial<Record<YeastRangeKey, 'keep' | 'replace'>>>({});
  const [observationChoices, setObservationChoices] = useState<Partial<Record<YeastRangeKey, number>>>({});

  const saved = useStorageValue(StorageService.getHopKnowledge);
  const documentedAttenuation = useMemo(() => {
    // Scoped malt and hop searches never inspect yeast gaps. Resolving the
    // whole yeast catalogue here would delay every return to the hop step.
    if (scope === 'malt' || scope === 'houblon') return undefined;
    const reference = resolveFermentationYeast({ yeast } as TrialRecipe, yeastReferences(saved));
    if (!reference) return undefined;
    return guideFermentations(saved).find(g => g.yeastId === reference.id)?.attenuationPct
      ?? agreedFermentationFact(reference, 'attenuation', '%');
  }, [scope, yeast.name, yeast.hopIndexId, saved]);
  const gaps = useMemo(
    () => ingredientGaps(fermentables, hops, yeast, nolo).filter(gap => !scope || gap.kind === scope).map(gap => ({ ...gap,
      // A published interval is already documented. Do not ask AI for a
      // pseudo-exact percentage to fill the deliberately empty manual field.
      missing: gap.missing.filter(field => !(gap.kind === 'levure' && field === 'atténuation' && documentedAttenuation))
    })).filter(gap => gap.missing.length),
    [fermentables, hops, yeast, nolo, scope, documentedAttenuation]
  );
  const searchGaps = useMemo(() => yeastEnrichment && yeast.name?.trim()
    ? [{ key: recipeIngredientKey('levure', yeast), kind: 'levure' as const, name: yeast.name, stockItemRef: yeast.stockItemRef,
      missing: gaps.find(g => g.kind === 'levure')?.missing ?? [] }]
    // Alpha belongs to the actual hop lot. A generic variety lookup must not
    // fill an explicitly selected stock article whose lot has no alpha data.
    : gaps.filter(gap => gap.kind !== 'houblon' || !gap.stockItemRef), [gaps, yeast.name, yeast.stockItemRef, yeastEnrichment]);
  // The lookup still covers every useful technical sheet. Its introduction
  // distinguishes alpha needed by a positive hot addition from an optional
  // dry-hop sheet, whose alpha does not contribute to hot IBU.
  const hotKeys = new Set(hops.filter(h => h.stage !== 'dryHop').map(h => recipeIngredientKey('houblon', h)));
  const activeHotKeys = new Set(hops.filter(h => h.stage !== 'dryHop' && h.weightG > 0).map(h => recipeIngredientKey('houblon', h)));
  const hotHopGaps = searchGaps.filter(gap => gap.kind === 'houblon' && activeHotKeys.has(gap.key));
  const undosedHotGaps = searchGaps.filter(gap => gap.kind === 'houblon' && hotKeys.has(gap.key) && !activeHotKeys.has(gap.key));
  const dryOnlyHopGaps = searchGaps.filter(gap => gap.kind === 'houblon' && !hotKeys.has(gap.key));
  const otherGaps = searchGaps.filter(gap => gap.kind !== 'houblon');
  const gapName = (gap: (typeof searchGaps)[number]) => `${gap.name}${gap.stockItemRef ? ` · ${gap.stockItemRef}` : ''}`;
  const gapNames = (rows: typeof searchGaps) => rows.map(gapName).join(' · ');

  const request = useRef(0);
  // A Firestore refresh with identical facts keeps the proposal. A changed
  // selected article/source invalidates an in-flight answer for the old lot.
  const stockBasis = JSON.stringify(searchGaps.map(gap => stockItems.filter(item =>
    item.category.toLocaleLowerCase('fr') === gap.kind &&
    (gap.stockItemRef ? item.ref === gap.stockItemRef : recipeIngredientKey(gap.kind, item) === gap.key))
    .map(item => [item.ref, item.name, item.supplier, item.technicalSource,
      item.colorEbc, item.potentialPpg, item.alphaPct, item.yeastTechnicalFacts,
      item.yeastAttenuationPct, item.yeastTempMinC, item.yeastTempMaxC])));
  const basis = JSON.stringify([fermentables, hops, yeast, nolo, scope, yeastEnrichment, !!documentedAttenuation, stockBasis]);
  const latest = useRef(basis); latest.current = basis;
  const cache = useRef(new Map<string, IngredientFacts>());
  useEffect(() => { cache.current.clear(); }, [stockBasis]);
  useEffect(() => {
    request.current += 1; setBusy(false); setFound(null); setFoundBasis(undefined); setError(null); setMissed([]); setConflictChoices({}); setRangeChoices({}); setObservationChoices({});
  }, [basis]);
  // Une notification Firestore renouvelle les tableaux même sans changement.
  // Seule une modification effective de la recette invalide sa proposition IA.
  useEffect(() => {
    // Reviewed sheets enrich the visible dossier through its readers. They may
    // only change the working recipe after the brewer accepts the proposal.
    if (reviewScope) return;
    const local = completeFromLocalReferences(fermentables, hops, yeast, stockItems, saved);
    // A step-scoped completion can hydrate only the ingredient being edited.
    if ((!scope || scope === 'malt') && JSON.stringify(local.fermentables) !== JSON.stringify(fermentables)) onFermentables(local.fermentables);
    if ((!scope || scope === 'houblon') && JSON.stringify(local.hops) !== JSON.stringify(hops)) onHops(local.hops);
    if ((!scope || scope === 'levure') && JSON.stringify(local.yeast) !== JSON.stringify(yeast)) onYeast(local.yeast);
  }, [basis, stockItems, saved, reviewScope]);
  useEffect(() => () => { request.current += 1; }, []);

  const search = async () => {
    const id = ++request.current;
    const started = basis;
    setBusy(true);
    setError(null);
    setFound(null);
    setConflictChoices({});
    setRangeChoices({});
    setObservationChoices({});
    setMissed([]);
    // Three requests at most at once; only identical recipe identities share a lookup.
    const queue = [...searchGaps];
    const ok: Found[] = [];
    const ko: string[] = [];
    let failure: string | undefined;
    try {
      await Promise.all(
        Array.from({ length: Math.min(3, queue.length) }, async () => {
          while (queue.length && request.current === id) {
            const gap = queue.shift()!;
            try {
              const matching = stockItems.filter(s => s.category.toLocaleLowerCase('fr') === gap.kind &&
                (gap.stockItemRef ? s.ref === gap.stockItemRef : recipeIngredientKey(gap.kind, s) === gap.key));
              const item = matching.length === 1 ? matching[0] : undefined;
              const cached = cache.current.get(gap.key) ?? (item && factsFromStock(item));
              const remaining =
                cached &&
                ingredientGaps(
                  gap.kind === 'malt'
                    ? fermentables
                        .filter((f) => recipeIngredientKey('malt', f) === gap.key)
                        .map((f) => applyMaltFacts(f, cached))
                    : [],
                  gap.kind === 'houblon'
                    ? hops
                        .filter((h) => recipeIngredientKey('houblon', h) === gap.key)
                        .map((h) => applyHopFacts(h, cached))
                    : [],
                  gap.kind === 'levure'
                    ? applyYeastFacts(yeast, cached)
                    : ({ name: '' } as YeastSpec),
                  nolo
                );
              if (!yeastEnrichment && cached && !remaining?.some(g => g.missing.some(field => gap.missing.includes(field)))) {
                ok.push({ ...gap, facts: cached });
                continue;
              }
              const res = await AiClient.run<IngredientFacts>({
                task: 'lookupIngredient',
                tier: 'fast',
                instruction: gap.kind + ' : ' + gap.name.trim(),
                context: { kind: gap.kind, name: gap.name.trim(), stockItemRef: gap.stockItemRef,
                  supplier: item?.supplier, manquant: gap.missing, nolo,
                  reviewTechnicalSheet: yeastEnrichment, known: gap.kind === 'levure' ? yeast : undefined }
              });
              // Une réponse annulée ou périmée ne doit pas non plus peupler le cache.
              if (request.current !== id || latest.current !== started) return;
              const hasYeastFacts = gap.kind === 'levure' && (yeastFactChanges(yeast, res.data ?? {} as IngredientFacts).length > 0 ||
                (sanitizeFacts(res.data ?? {} as IngredientFacts).technicalFacts?.length ?? 0) > 0);
              if (res.ok && res.data?.found && res.data.source?.trim() && (fillsGap(gap, res.data) || yeastEnrichment && hasYeastFacts)) {
                // A yeast answer's note becomes a documentary note with this answer's provenance, never a lot note.
                const facts = sanitizeFacts(gap.kind === 'levure' ? adaptYeastLookupResult(res.data) : res.data);
                // Identity belongs to the local catalogue, never to model output.
                delete facts.hopIndexId;
                facts.origin = 'ai';
                if (facts.technicalFacts) facts.technicalFacts = facts.technicalFacts.map(fact => ({ ...fact, origin: 'ai', source: fact.source || facts.source }));
                // An unrequested model percentage is dropped; a sourced published
                // point still reaches its field through the sheet mapping.
                if (gap.kind === 'levure' && !yeastEnrichment && !gap.missing.includes('atténuation')) delete facts.attenuationPct;
                cache.current.set(gap.key, facts);
                ok.push({ ...gap, facts });
              } else {
                ko.push(gap.name);
                failure ||= res.error;
              }
            } catch {
              ko.push(gap.name);
              failure = 'Recherche interrompue. Tu peux réessayer.';
            }
          }
        })
      );
      if (request.current !== id || latest.current !== started) return;
      setMissed(ko);
      if (ok.length) { setFound(ok); setFoundBasis(started); }
      else setError(failure ?? 'Rien de publié retrouvé pour ces ingrédients.');
    } finally {
      if (request.current === id) setBusy(false);
    }
  };

  const apply = () => {
    if (!found || foundBasis !== latest.current) return;
    const byKey = new Map(found.map((f) => [f.key, f]));
    const accepted = new Set<string>();
    const nextFerms = fermentables.map((f) => {
      const result = byKey.get(recipeIngredientKey('malt', f));
      if (!result || f.kind !== 'grain') return f;
      accepted.add(result.key);
      return applyMaltFacts(f, result.facts);
    });
    const nextHops = hops.map((h) => {
      const result = byKey.get(recipeIngredientKey('houblon', h));
      if (!result) return h;
      accepted.add(result.key);
      return applyHopFacts(h, result.facts);
    });
    const yeastResult = byKey.get(recipeIngredientKey('levure', yeast));
    if (yeastResult) accepted.add(yeastResult.key);
    if (!scope || scope === 'malt') onFermentables(nextFerms);
    if (!scope || scope === 'houblon') onHops(nextHops);
    const replaceFields = Object.entries(conflictChoices).filter(([, choice]) => choice === 'replace').map(([field]) => field as YeastFactField);
    let yeastFailure:string|undefined;
    if ((!scope || scope === 'levure')&&yeastResult) {
      const proposed=reviewScope?applyReviewedYeastFacts(yeast,yeastResult.facts,replaceFields,rangeChoices,observationChoices):applyYeastFacts(yeast,yeastResult.facts,replaceFields);
      const adopted=tryAdoptYeastDocumentary(yeast,proposed,{intent:'documentary'});
      if(adopted.accepted===false)yeastFailure=adopted.message;
      else {const parent=onYeast(adopted.yeast);if(parent&&parent.accepted===false)yeastFailure=parent.message;}
      if(yeastFailure)accepted.delete(yeastResult.key);
    }
    // A trial or recipe review promises an unchanged stock, whatever callback
    // the caller passes. Only the historic completion may teach the stock.
    if (!reviewScope) found
      .filter((f) => accepted.has(f.key))
      .forEach((f) => onLearnIngredient?.(f.name, { ...factsForStock(f.kind, f.facts), ...(f.stockItemRef ? { ref: f.stockItemRef } : {}) }));
    setFound(null); setFoundBasis(undefined);
    setError(yeastFailure??null);
  };

  const yeastResult = found?.find(f => f.kind === 'levure');
  const changes = yeastResult ? yeastFactChanges(yeast, yeastResult.facts) : [];
  const rangeObservations = yeastResult && reviewScope ? yeastRangeObservations(yeastResult.facts) : {};
  const ambiguousObservations = Object.entries(rangeObservations).filter(([, values]) => values.length > 1) as [YeastRangeKey, NonNullable<typeof rangeObservations[YeastRangeKey]>][];
  const ambiguousKeys = new Set(ambiguousObservations.map(([key]) => key));
  const visibleChanges = changes.filter(change => change.field !== 'documentaryNotes' && !(
    ambiguousKeys.has('temperature') && ['fermTempMinC', 'fermTempMaxC'].includes(change.field) ||
    ambiguousKeys.has('attenuation') && change.field === 'attenuationPct' ||
    ambiguousKeys.has('alcoholTolerance') && change.field === 'alcoholTolerancePct'));
  const rangeConflicts = yeastResult && reviewScope ? yeastRangeConflicts(yeast, yeastResult.facts, observationChoices).filter(range =>
    !visibleChanges.some(change => change.conflict && (range.key === 'temperature' ? ['fermTempMinC', 'fermTempMaxC'].includes(change.field)
      : range.key === 'attenuation' ? change.field === 'attenuationPct' : change.field === 'alcoholTolerancePct'))) : [];
  // Disagreeing sheet observations leave a field empty. A range key under
  // review already asks which observation to retain.
  const disagreements = yeastResult ? yeastObservationDisagreements(yeastResult.facts).filter(({ key }) => !ambiguousKeys.has(key as YeastRangeKey)) : [];
  const unresolved = visibleChanges.some(change => change.conflict && !conflictChoices[change.field]) ||
    rangeConflicts.some(change => !rangeChoices[change.key]) || ambiguousObservations.some(([key]) => observationChoices[key] === undefined);
  if (!active || searchGaps.length === 0 && !found && !error) return null;

  return (
    <section aria-label="Autocomplétion des ingrédients" aria-busy={busy} className={embedded ? 'space-y-2' : 'panel p-2 space-y-2'}>
      {!found && (
        <>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-ebc-straw shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-sm text-cave-200 leading-snug">
              {hotHopGaps.length > 0 && <p>Pour calculer les IBU à chaud, documenter l’alpha du lot : <span className="text-cave-50">{gapNames(hotHopGaps)}</span>.</p>}
              {otherGaps.length > 0 && <p>Données de fiche à compléter : <span className="text-cave-50">{otherGaps.map(gap => `${gapName(gap)} (${gap.missing.join(', ')})`).join(' · ')}</span>.</p>}
              {undosedHotGaps.length > 0 && <p>Ajout à chaud sans dose · alpha facultatif tant que la dose reste nulle : <span className="text-cave-50">{gapNames(undosedHotGaps)}</span>.</p>}
              {dryOnlyHopGaps.length > 0 && <p>À cru · alpha de fiche facultatif, hors du calcul IBU à chaud : <span className="text-cave-50">{gapNames(dryOnlyHopGaps)}</span>.</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={search}
            disabled={busy || searchGaps.length === 0}
            className="max-w-full min-h-7 rounded-control border border-cave-700 bg-cave-850 text-cave-50
                       text-2xs font-semibold flex items-center justify-center gap-2
                       px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recherche des fiches…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {scope === 'levure' ? 'Compléter la levure avec l’IA' : 'Compléter les données manquantes avec l’IA'}
              </>
            )}
          </button>
        </>
      )}

      {busy && <button type="button" className="min-h-7 px-2 text-2xs text-cave-200 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw" onClick={() => { request.current += 1; setBusy(false); }}>Annuler la recherche</button>}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-cave-200 leading-snug">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error} — à saisir à la main.</span>
        </p>
      )}

      {found && (
        <div className="space-y-2">
          <p role="status" className="text-sm text-cave-200">
            {found.length} fiche{found.length > 1 ? 's' : ''} retrouvée
            {found.length > 1 ? 's' : ''}. {reviewScope === 'trial' ? 'Portée : cet essai, puis cette recette après application. Le stock reste inchangé.' : reviewScope === 'recipe' ? 'Portée : cette recette. Le stock reste inchangé.' : 'Rien n’est écrit avant validation.'}
            {visibleChanges.some(change => change.conflict) || rangeConflicts.length || ambiguousObservations.length ? ' Choisis les valeurs et plages à retenir dans cette recette.' : ' Les valeurs déjà saisies sont conservées.'}
          </p>

          <ul className="divide-y divide-cave-850">
            {found.map((f) => (
              <li key={f.key} className="py-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <span className="min-w-0 text-sm text-cave-50 break-words [overflow-wrap:anywhere]">
                    {f.name}{f.stockItemRef && <span className="text-cave-400"> · {f.stockItemRef}</span>}
                  </span>
                  <span className="max-w-full reading text-sm text-ebc-straw break-words">
                    {f.kind === 'malt' &&
                      [
                        f.missing.includes('couleur EBC') && f.facts.colorEbc != null
                          ? `${f.facts.colorEbc} EBC`
                          : null,
                        f.missing.includes('potentiel PPG') && f.facts.potentialPpg != null
                          ? `${f.facts.potentialPpg} PPG`
                          : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    {f.kind === 'houblon' && f.facts.alphaPct != null && `${f.facts.alphaPct} % AA`}
                  </span>
                </div>
                {f.kind === 'levure' && <>
                  <dl className="mt-1 divide-y divide-cave-800 text-xs">
                    {f.facts.technicalFacts?.filter(fact => fact.range).map((fact, i) => <div key={`fact-${i}`} className={FACT_ROW}>
                      <dt className="text-cave-400">{YEAST_FACT_LABELS[fact.key]}</dt>
                      <dd className="min-w-0 text-cave-50 break-words"><span className="text-cave-400">Fiche consultée : </span>{yeastFactReported(fact)}{!beerSheetContext(fact.context, fact.key) && <span className="text-cave-400"> · non repris : {fact.context}</span>}</dd>
                    </div>)}
                    {visibleChanges.map(change => <div key={change.field} className={change.conflict ? CONFLICT_ROW : FACT_ROW}>
                      <dt className={change.conflict ? CONFLICT_LABEL : 'text-cave-400'}>{change.label}</dt>
                      <dd className="min-w-0 text-cave-50 break-words [overflow-wrap:anywhere]">
                        {change.conflict ? <>
                          <div className="text-cave-400">Saisie : {typeof change.current === 'object' ? 'fiche déjà présente' : String(change.current)}</div>
                          <div>Fiche : {typeof change.proposed === 'object' ? 'nouveau document sourcé' : String(change.proposed)}</div>
                          <SourceLine source={proposedSource(f.facts, change.field, change.proposed)} />
                          <select aria-label={`Choisir ${change.label}`} className="mt-1 w-full min-h-8 rounded-control border border-cave-700 bg-cave-850 px-1 text-base"
                            value={conflictChoices[change.field] ?? ''} onChange={event => setConflictChoices(current => ({ ...current, [change.field]: event.target.value as 'keep' | 'replace' }))}>
                            <option value="" disabled>Choisir…</option><option value="keep">Garder la saisie</option><option value="replace">Reprendre la fiche</option>
                          </select>
                        </> : <>{typeof change.proposed === 'object' ? 'Document sourcé à ajouter' : String(change.proposed)}</>}
                      </dd>
                    </div>)}
                    {ambiguousObservations.map(([key, observations]) => <div key={`observations-${key}`} className={CONFLICT_ROW}>
                      <dt className={CONFLICT_LABEL}>Observations {YEAST_FACT_LABELS[key]} contradictoires</dt><dd className="min-w-0 text-cave-50">
                        <select aria-label={`Choisir l’observation ${YEAST_FACT_LABELS[key]}`} className="w-full min-h-8 rounded-control border border-cave-700 bg-cave-850 px-1 text-base"
                          value={observationChoices[key] ?? ''} onChange={event => { setObservationChoices(current => ({ ...current, [key]: Number(event.target.value) })); setRangeChoices(current => ({ ...current, [key]: undefined })); }}>
                          <option value="" disabled>Choisir…</option>{observations.map((fact, index) => <option key={`${fact.reported}-${index}`} value={index}>{yeastFactReported(fact)} · {fact.source || 'source inconnue'}</option>)}
                        </select>
                        <p className="text-cave-400">L’observation choisie fixe les bornes ; les chiffres isolés de la réponse ne la remplacent pas.</p>
                      </dd>
                    </div>)}
                    {rangeConflicts.map(change => <div key={`range-${change.key}`} className={CONFLICT_ROW}>
                      <dt className={CONFLICT_LABEL}>{change.label}</dt><dd className="min-w-0 break-words text-cave-50">
                        <div className="text-cave-400">Retenue : {yeastFactReported(change.current)} · {change.current.source || 'source inconnue'}</div>
                        <div>Nouvelle fiche : {yeastFactReported(change.proposed)} · {change.proposed.source || 'source inconnue'}</div>
                        <select aria-label={`Choisir ${change.label}`} className="mt-1 w-full min-h-8 rounded-control border border-cave-700 bg-cave-850 px-1 text-base"
                          value={rangeChoices[change.key] ?? ''} onChange={event => setRangeChoices(current => ({ ...current, [change.key]: event.target.value as 'keep' | 'replace' }))}>
                          <option value="" disabled>Choisir…</option><option value="keep">Garder la plage retenue</option><option value="replace">Reprendre la nouvelle fiche</option>
                        </select>
                      </dd>
                    </div>)}
                    {disagreements.map(({ key, observations }) => <div key={`disagreement-${key}`} className={CONFLICT_ROW}>
                      <dt className={CONFLICT_LABEL}>{YEAST_FACT_LABELS[key]} · observations non concordantes</dt>
                      <dd className="min-w-0 break-words [overflow-wrap:anywhere] text-cave-50">
                        <span>{observations.map(fact => `${yeastFactReported(fact)} (${fact.source || 'source inconnue'})`).join(' · ')}</span>
                        <p className="text-cave-400">Champ laissé vide : aucune valeur n’est choisie sans ta revue.</p>
                      </dd>
                    </div>)}
                  </dl>
                  {!!f.facts.technicalFacts?.length && <details className="mt-1"><summary className="min-h-7 cursor-pointer text-xs text-water">{f.facts.technicalFacts.length > 1 ? `${f.facts.technicalFacts.length} observations et leurs sources` : '1 observation et sa source'}</summary>
                    <ul className="divide-y divide-cave-800 text-xs">{f.facts.technicalFacts.map((fact, i) => <li key={i} className="py-1 break-words [overflow-wrap:anywhere]">
                      <span className="text-cave-400">{YEAST_FACT_LABELS[fact.key]} : </span><span className="text-cave-50">{yeastFactReported(fact)}</span>{fact.context && <span className="text-cave-400"> · {fact.context}</span>}
                      {fact.sourceUrl ? <a className="block text-water underline" href={fact.sourceUrl} target="_blank" rel="noreferrer">{fact.source || 'Source publiée'}</a> : fact.source && <span className="block text-cave-400">{fact.source}</span>}
                    </li>)}</ul>
                  </details>}
                </>}
                {/* La source est le cœur du dispositif : sans elle, on ne
                    distinguerait pas une donnée retrouvée d'une inventée. */}
                {f.facts.fermentation && <details><summary className="min-h-touch cursor-pointer text-sm text-water">Assimilation, ensemencement et domaine publié</summary><p className="text-sm text-cave-200 break-words">{Object.entries(f.facts.fermentation.sugars).map(([k,v])=>k+': '+({yes:'oui',no:'non',unknown:'inconnu'})[v]).join(' · ')} · POF {f.facts.fermentation.pof}</p><p className="text-sm text-cave-400">{f.facts.fermentation.conditions} · {f.facts.fermentation.source.year ?? 'Année inconnue'} · {f.facts.fermentation.source.reference}</p></details>}
                <p className="text-2xs text-cave-400 leading-snug break-words [overflow-wrap:anywhere]">
                  {f.facts.source}
                </p>
              </li>
            ))}
          </ul>

          {missed.length > 0 && (
            <p className="text-sm text-cave-200 leading-snug">
              Rien trouvé pour : {missed.join(', ')}. À saisir à la main.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setFound(null)}
              className="min-h-7 px-2 py-1 rounded-control border border-cave-700
                         text-cave-200 text-2xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw"
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={unresolved}
              className="min-h-7 px-2 py-1 rounded-control border border-cave-700 bg-cave-850 text-cave-50
                         text-2xs font-semibold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {reviewScope === 'trial' ? 'Retenir dans l’essai' : 'Reprendre ces valeurs'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
