import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Undo2 } from 'lucide-react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { YeastSpec } from '../types';
import { readYeastPitchingPlan, type YeastPitchingWort } from '../../functions/src/yeastSupplySchema';
import { adoptedDocumentaryFromCandidateSheet, extractYeastCandidateSheet, mergeYeastCandidateSheet, tryAdoptYeastDocumentary, tryAcceptYeastCandidateSheet, type RecipeWizardDraft, type YeastCandidateSheets } from '../services/recipeDraft';
import { YeastSheetAssistant, type YeastLookupEntry, type YeastSheetAccept } from './RecipeAutoComplete';
import { YeastCitationList, YeastCitationMark, YeastLinkedText, YeastRecipeDossier, yeastCitationKey, yeastCitations, yeastDateText, yeastFactLabel, yeastObservationText, yeastSourceTitle } from './YeastRecipeDossier';
import { YeastDbCorrectionsPanel } from './YeastDbCorrectionsPanel';
import type { YeastDbCorrectionTarget } from '../../functions/src/yeastDbCorrectionTypes';
import {
  applyYeastRecipeDesign, completeYeastRecipeDesignApplication, createYeastRecipeDraft, evaluateYeastRecipeDesign, readYeastRecipeDesign, yeastRecipeCandidates, yeastSpecForCandidate, inferYeastRecipeStyle,
  YEAST_RECIPE_GOAL_LABELS, YEAST_STYLE_FAMILIES, type YeastRecipeGoal, type YeastStyleId, type YeastRecipeCandidate,
} from '../domain/yeastRecipeDesign';
import { planFermentationTimeline, type FermentationTimelineStep } from '../domain/fermentationTimeline';
import { yeastReferences } from '../domain/yeastReferences';
import { yeastStrainInformation } from '../domain/yeastStrainInformation';
import { YEAST_FACT_LABELS } from '../domain/yeastCatalogue';
import { readYeastDocumentaryNotes, readYeastFactValue, readYeastTechnicalFacts, type YeastDocumentaryNote, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { readYeastDocumentaryView } from '../domain/ingredientFacts';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { YeastCandidatePicker } from './YeastCandidatePicker';
import { YeastRecipeWorkbench, type YeastRecipeDestination } from './YeastRecipeWorkbench';
import { YeastStrainDetails } from './YeastStrainDetails';
import { YeastRecipePlan, YeastProjectionReading, StationHeading, yeastWarningsForReading } from './YeastRecipePlan';
import { YeastBeerTargetPanel, yeastBeerTargetSummary } from './YeastBeerTargetPanel';
import { YeastEvidenceSummary } from './YeastEvidenceSummary';
import './yeast-choice.css';
import { keepIndependentPitchingWort } from '../domain/yeastPitching';
import { YeastPitchingPanel, yeastPitchingChoiceChanged, yeastPitchingDifferences } from './YeastPitchingPanel';
import { useYeastSupply } from '../hooks/useYeastSupply';

type QuantityReading = { state: 'missing' | 'invalid' | 'unitless' | 'set'; text: string; hint?: string };
const UNKNOWN_COMPARISON_WORT: YeastPitchingWort = { basis: 'hypothesis', note: 'Moût à ensemencer non renseigné.' };
const quantityReading = ({ qty, unit }: YeastSpec): QuantityReading => {
  if (qty == null) return { state: 'missing', text: unit ? `non renseignée · ${unit}` : 'non renseignée',
    hint: 'Saisis la quantité prévue ; le repère fabricant ne la remplit pas automatiquement.' };
  if (!Number.isFinite(qty)) return { state: 'invalid', text: 'illisible', hint: 'Saisis de nouveau la quantité prévue.' };
  const shown = `${qty.toLocaleString('fr-FR', { maximumFractionDigits: 20 })}${unit ? ` ${unit}` : ''}`;
  if (qty === 0) return { state: 'invalid', text: `${shown} · zéro à corriger`, hint: 'Un zéro est enregistré : renseigne la quantité prévue avant de conserver la recette.' };
  if (qty < 0) return { state: 'invalid', text: `${shown} · négative`, hint: 'Corrige la quantité négative avant de conserver la recette.' };
  if (!unit) return { state: 'unitless', text: `${shown} · unité à préciser`, hint: 'Choisis une unité ; aucune conversion n’est supposée.' };
  return { state: 'set', text: shown };
};
const stateQuantity = (yeast: YeastSpec) => yeast.qty == null ? 'quantité à renseigner' : quantityReading(yeast).text;
const decimal = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const degrees = (value?: number, missing = 'température inconnue') => Number.isFinite(value) ? `${decimal(value!)} °C` : missing;
const days = (value?: number) => Number.isFinite(value) ? `${decimal(value!)} j` : 'durée inconnue';
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;
/** Comparable reading: key order, undefined and empty containers never count as a difference. */
const comparable = (value: unknown): string => JSON.stringify(value ?? null, (_key, entry) => {
  if (Array.isArray(entry)) return entry.length ? entry : undefined;
  if (entry && typeof entry === 'object') return Object.fromEntries(Object.entries(entry)
    .filter(([, item]) => item !== undefined && !(Array.isArray(item) && !item.length) && !(item && typeof item === 'object' && !Array.isArray(item) && !Object.keys(item).length))
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  return entry;
}) ?? 'null';
/** Documentary absence, an explicit unknown and an emptied collection are different decisions. */
const documentaryComparable = (value: unknown): string => value === undefined ? 'absent' : JSON.stringify(value, (_key, entry) =>
  entry && typeof entry === 'object' && !Array.isArray(entry) ? Object.fromEntries(Object.entries(entry)
    .filter(([, item]) => item !== undefined).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
const IDENTITY_KEYS = ['name', 'hopIndexId', 'stockItemRef'] as const;
const PHYSICAL_KEYS = new Set<string>([...IDENTITY_KEYS, 'form', 'qty', 'unit', 'pitchTempC']);
const SHEET_LABELS: Record<string, string> = { attenuationPct: 'Hypothèse d’atténuation', attenuationBasis: 'Nature de l’hypothèse', declaredAttenuationPct:'Atténuation documentaire', documentaryInvalid:'Fiche adoptée', fermTempMinC: 'Température mini',
  lab: 'Fabricant / laboratoire', strain: 'Code de souche', documentaryNotes: 'Notes documentaires', fermentationFacts: 'Assimilation et domaine publié',
  fermTempMaxC: 'Température maxi', alcoholTolerancePct: 'Tolérance alcoolique', flocculation: 'Floculation', fermentDays: 'Durée de fiche',
  technicalFacts: 'Observations documentaires', technicalSelections: 'Valeurs retenues de la fiche', technicalSource: 'Source / notice', notes: 'Notes (recette, lot)', fermentation: 'Profil fermentaire' };
const factDiffKey = (fact: YeastTechnicalFact) => JSON.stringify([fact.key, fact.reported, fact.range, fact.unit, fact.qualifier, fact.context, yeastCitationKey(fact)]);
const noteDiffKey = (note: YeastDocumentaryNote) => JSON.stringify([note.text.trim(), note.context, yeastCitationKey(note)]);
const counted = (count: number, singular: string, pluralWord = `${singular}s`) => count ? `${count} ${count > 1 ? pluralWord : singular}` : '';
/** Added and removed items only, each with its value and a short citation; the common document is named once. */
function ItemChanges({ rows }: { rows: { change: 'added' | 'removed' | 'changed'; label: string; value: ReactNode; cited?: { source?: string; sourceUrl?: string; retrievedAt?: string } }[] }) {
  if (!rows.length) return null;
  const citations = yeastCitations(rows.flatMap(row => row.cited ? [row.cited] : [])), single = citations.list.length === 1;
  return <><ul className="yc-diff-items">{rows.map((row, index) => <li key={index} data-diff-change={row.change}>
    <span className="yc-diff-kind">{row.change === 'added' ? 'Ajout' : row.change === 'removed' ? 'Retrait' : 'Retenue'}</span> {row.label} : {row.value}
    {row.cited && <YeastCitationMark citation={citations.of(row.cited)} single={single} />}</li>)}</ul>
    <YeastCitationList citations={citations.list} /></>;
}
/** Documentary changes read as decisions (added, removed, kept, retained value) instead of serialized records. */
function documentaryDifference(key: string, before: unknown, after: unknown): DraftDifference | undefined {
  const id = `sheet-${key}`, label = SHEET_LABELS[key] ?? key;
  if (key === 'technicalFacts') {
    const a = readYeastTechnicalFacts(before ?? []), b = readYeastTechnicalFacts(after ?? []);
    if (!a || !b) return undefined;
    const had = new Set(a.map(factDiffKey)), has = new Set(b.map(factDiffKey));
    const added = b.filter(fact => !had.has(factDiffKey(fact))), removed = a.filter(fact => !has.has(factDiffKey(fact))), kept = b.length - added.length;
    const text = [counted(added.length, 'ajoutée'), counted(removed.length, 'retirée'), counted(kept, 'conservée')].filter(Boolean).join(' · ');
    const row = (fact: YeastTechnicalFact, change: 'added' | 'removed') => ({ change, label: yeastFactLabel(fact.key), cited: fact,
      value: <>{yeastObservationText(fact).value}{fact.context && !/^beer$/i.test(fact.context) ? ` · ${fact.context}` : ''}</> });
    return { id, label, text: added.length || removed.length ? text : `${text || 'aucune observation'} · date ou origine de consultation actualisée`,
      detail: <ItemChanges rows={[...added.map(fact => row(fact, 'added')), ...removed.map(fact => row(fact, 'removed'))]} /> };
  }
  if (key === 'documentaryNotes') {
    const a = before === undefined ? [] : readYeastDocumentaryNotes(before), b = after === undefined ? [] : readYeastDocumentaryNotes(after);
    if (a === undefined || b === undefined) return undefined;
    if (a === null || b === null) return { id, label, before: a === null ? 'documentation inconnue' : counted(a.length, 'note') || 'aucune note', after: b === null ? 'documentation inconnue' : counted(b.length, 'note') || 'aucune note' };
    const had = new Set(a.map(noteDiffKey)), has = new Set(b.map(noteDiffKey));
    const added = b.filter(note => !had.has(noteDiffKey(note))), removed = a.filter(note => !has.has(noteDiffKey(note))), kept = b.length - added.length;
    const row = (note: YeastDocumentaryNote, change: 'added' | 'removed') => ({ change, label: note.origin === 'personal' ? 'Note personnelle' : 'Note', cited: note, value: <YeastLinkedText text={note.text} /> });
    return { id, label, text: [counted(added.length, 'ajoutée'), counted(removed.length, 'retirée'), counted(kept, 'conservée')].filter(Boolean).join(' · ') || (b.length ? 'provenance actualisée' : 'notes retirées'),
      detail: <ItemChanges rows={[...added.map(note => row(note, 'added')), ...removed.map(note => row(note, 'removed'))]} /> };
  }
  if (key === 'technicalSelections') {
    const a = (before ?? {}) as Record<string, unknown>, b = (after ?? {}) as Record<string, unknown>;
    const reading = (value: unknown) => value === null ? 'inconnue après revue' : value === undefined ? 'non retenue'
      : readYeastTechnicalFacts([value])?.[0] ? yeastObservationText(readYeastTechnicalFacts([value])![0]).value : 'valeur illisible';
    const rows = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(field => JSON.stringify(a[field] ?? null) !== JSON.stringify(b[field] ?? null) || (field in a) !== (field in b))
      .map(field => ({ change: 'changed' as const, label: yeastFactLabel(field), value: <>{reading(a[field])} → <strong>{reading(b[field])}</strong></>,
        cited: b[field] && typeof b[field] === 'object' ? b[field] as { source?: string; sourceUrl?: string; retrievedAt?: string } : undefined }));
    return { id, label, text: counted(rows.length, 'valeur modifiée', 'valeurs modifiées') || 'provenance actualisée', detail: <ItemChanges rows={rows} /> };
  }
  if (key === 'technicalSource') {
    const text = (value: unknown) => typeof value === 'string' && value.trim() ? yeastSourceTitle(value) : 'non renseignée';
    return { id, label, before: text(before), after: text(after),
      detail: typeof after === 'string' && /^https?:\/\//.test(after.trim()) ? <span className="block"><a className="yeast-source" href={after.trim()} target="_blank" rel="noreferrer">Ouvrir la nouvelle source</a></span> : undefined };
  }
  return undefined;
}
const PROCESS_LABELS: Record<string, string> = { unspecified: 'procédé à préciser', preacidified: 'moût pré-acidifié', 'acidifying-yeast': 'levure acidifiante', 'mixed-culture': 'cultures mixtes' };
const goalLabel = (goal?: YeastRecipeGoal) => goal ? YEAST_RECIPE_GOAL_LABELS[goal] : 'aucun';
type DraftDifference = { id: string; label: string; before?: string; after?: string; text?: string; detail?: ReactNode; open?: 'objectives' | 'conduct' };
/** Exact change of the stored phases; the programme itself stays in the conduct station. */
function programmeDifference(before: readonly FermentationTimelineStep[], after: readonly FermentationTimelineStep[]): string | undefined {
  if (comparable(before) === comparable(after)) return undefined;
  const end = (steps: readonly FermentationTimelineStep[]) => { const day = planFermentationTimeline(steps).endDay; return day === null ? 'fin inconnue' : `fin J${decimal(day)}`; };
  const endText = end(before) === end(after) ? '' : ` · ${end(before)} → ${end(after)}`;
  if (before.length === after.length && before.every((phase, index) => phase.kind === after[index].kind && phase.name === after[index].name)) {
    const parts = after.flatMap((phase, index) => {
      const was = before[index], bits: string[] = [];
      if (comparable(was.tempC) !== comparable(phase.tempC)) bits.push(`${degrees(was.tempC)} → ${degrees(phase.tempC)}`);
      if (comparable(was.days) !== comparable(phase.days)) bits.push(`${days(was.days)} → ${days(phase.days)}`);
      if ((was.note ?? '') !== (phase.note ?? '')) bits.push('consignes modifiées');
      return bits.length ? [`${phase.name} ${bits.join(', ')}`] : [];
    });
    return `${parts.join(' ; ')}${endText}`;
  }
  return `${plural(before.length, 'palier')} → ${plural(after.length, 'palier')} : ${after.map(phase => phase.name).join(' → ') || 'aucun'}${endText}`;
}
/** Compare effective documentary decisions, never the storage wrapper or its schema version. */
function documentaryDiffValues(yeast: YeastSpec): Record<string,unknown> {
  const view=readYeastDocumentaryView(yeast), values:Record<string,unknown>={...yeast};
  // `pitching` (product, offer, lot, wort, preparation) is compared by its own named rows, never as a sheet key.
  for(const key of [...PHYSICAL_KEYS,'pitching','adoptedDocumentary','localDocumentary','lab','strain','fermTempMinC','fermTempMaxC','flocculation','alcoholTolerancePct','fermentDays','technicalSource',
    'technicalFacts','technicalSelections','documentaryNotes','fermentationFacts','attenuationPct','attenuationBasis'])delete values[key];
  if(view.documentary)for(const [key,value]of Object.entries(view.documentary))if(!PHYSICAL_KEYS.has(key))values[key]=value;
  for(const key of ['technicalFacts','technicalSelections','documentaryNotes','fermentationFacts']as const)if(Object.prototype.hasOwnProperty.call(view,key))values[key]=view[key];
  if(yeast.attenuationBasis!=='declared'&&yeast.attenuationPct!==undefined) {
    values.attenuationPct=yeast.attenuationPct;values.attenuationBasis=yeast.attenuationBasis??'recipe';
  }
  if(view.status==='invalid')values.documentaryInvalid=[yeast.adoptedDocumentary,yeast.localDocumentary];
  return values;
}
/** Saved recipe versus draft, compared field by field; equality is only claimed after this comparison. */
function draftDifferences(saved: TrialRecipe, draft: TrialRecipe, savedGoal?: YeastRecipeGoal, draftGoal?: YeastRecipeGoal): DraftDifference[] {
  const rows: DraftDifference[] = [], a = saved.yeast, b = draft.yeast;
  for (const [key, label] of [['name', 'Levure'], ['hopIndexId', 'Référence catalogue'], ['stockItemRef', 'Référence d’article stock']] as const) {
    if (comparable(a[key]) !== comparable(b[key])) rows.push({ id: key === 'name' ? 'yeast' : key, label,
      before: a[key] || 'non renseignée', after: b[key] || 'non renseignée' });
  }
  if ((a.form || '') !== (b.form || '')) rows.push({ id: 'form', label: 'Forme', before: a.form || 'inconnue', after: b.form || 'inconnue' });
  if (comparable([a.qty, a.unit]) !== comparable([b.qty, b.unit])) rows.push({ id: 'quantity', label: 'Quantité', before: stateQuantity(a), after: stateQuantity(b) });
  if (comparable(a.pitchTempC) !== comparable(b.pitchTempC)) rows.push({ id: 'pitch', label: 'Température d’ensemencement', before: degrees(a.pitchTempC, 'à renseigner'), after: degrees(b.pitchTempC, 'à renseigner') });
  rows.push(...yeastPitchingDifferences(a, b));
  const adoc=documentaryDiffValues(a),bdoc=documentaryDiffValues(b);
  const sheet = [...new Set([...Object.keys(adoc), ...Object.keys(bdoc)])].filter(key => documentaryComparable(adoc[key]) !== documentaryComparable(bdoc[key]));
  const units: Record<string, string> = { attenuationPct: ' %', declaredAttenuationPct:' %', fermTempMinC: ' °C', fermTempMaxC: ' °C', alcoholTolerancePct: ' % vol', fermentDays: ' j' };
  const sheetReading = (key: string, value: unknown): string => {
    if(key==='documentaryInvalid')return value===undefined?'fiche compatible':'fiche incompatible · à vérifier';
    if (key === 'documentaryNotes') {
      if (value === undefined) return 'documentation absente';
      if (value === null) return 'documentation inconnue';
      if (Array.isArray(value) && value.length === 0) return 'notes retirées';
    }
    if (value == null) return 'non renseigné';
    if (typeof value === 'number') return Number.isFinite(value) ? `${decimal(value)}${units[key] ?? ''}` : 'valeur illisible';
    if (typeof value === 'string') return key === 'attenuationBasis' ? ({ declared: 'annoncée', recipe: 'hypothèse de recette', measured: 'mesurée' }[value] ?? value) : value;
    if (Array.isArray(value)) return value.length ? value.map(item => {
      if (!item || typeof item !== 'object') return String(item);
      const row = item as Record<string, unknown>;
      const label = typeof row.key === 'string' ? YEAST_FACT_LABELS[row.key as keyof typeof YEAST_FACT_LABELS] : undefined;
      const reading = readYeastFactValue(row).value;
      const shape = reading.kind === 'range' ? `plage ${decimal(reading.min)}–${decimal(reading.max)} ${row.unit ?? ''}`
        : reading.kind === 'point' ? `point publié ${decimal(reading.value)} ${row.unit ?? ''}`
          : reading.kind === 'bound' ? `borne ${reading.operator}${decimal(reading.value)} ${row.unit ?? ''}` : '';
      const origin = row.origin === 'ai' ? 'recherche IA' : row.origin === 'manufacturer' ? 'fabricant' : row.origin === 'personal' ? 'donnée personnelle' : '';
      // Unreadable records only: still one short source, never the pasted URL and timestamp.
      const cited = row.source || row.sourceUrl ? yeastSourceTitle(typeof row.source === 'string' ? row.source : undefined, typeof row.sourceUrl === 'string' ? row.sourceUrl : undefined) : '';
      return [label ? `${label} : ${row.reported ?? row.text ?? ''}` : row.text ?? row.reported ?? '', shape,
        origin, cited, row.context].filter(Boolean).join(' · ');
    }).join(' ; ') : 'aucune donnée retenue';
    if (key === 'technicalSelections' && typeof value === 'object') return Object.entries(value).map(([property, selected]) => {
      const label = YEAST_FACT_LABELS[property as keyof typeof YEAST_FACT_LABELS] ?? property;
      return selected == null ? `${label} : inconnu` : sheetReading('technicalFacts', [selected]);
    }).join(' ; ') || 'aucune valeur retenue';
    if (key === 'fermentationFacts' && typeof value === 'object') {
      const data = value as Record<string, unknown>;
      const source = data.source && typeof data.source === 'object' ? data.source as Record<string, unknown> : undefined;
      const sugarLabels: Record<string, string> = { glucose: 'glucose', fructose: 'fructose', sucrose: 'saccharose', maltose: 'maltose', maltotriose: 'maltotriose', lactose: 'lactose' };
      const state = (reading: unknown) => reading === true || reading === 'yes' ? 'oui' : reading === false || reading === 'no' ? 'non'
        : reading === 'positive' ? 'positif' : reading === 'negative' ? 'négatif' : reading === 'unknown' ? 'inconnu' : String(reading);
      const range = (reading: unknown, unit: string) => {
        if (!reading || typeof reading !== 'object') return '';
        const data = reading as { min?: number; max?: number };
        return Number.isFinite(data.min) && Number.isFinite(data.max) ? `${decimal(data.min!)}–${decimal(data.max!)} ${unit}` : '';
      };
      const sugars = data.sugars && typeof data.sugars === 'object' ? Object.entries(data.sugars).map(([sugar, reading]) => `${sugarLabels[sugar] ?? sugar} : ${state(reading)}`) : [];
      return [data.strainName, data.conditions, ...sugars, data.pof != null ? `POF : ${state(data.pof)}` : '',
        data.hydrolysis != null ? `Hydrolyse : ${state(data.hydrolysis)}` : '', range(data.pitchGL, 'g/L'), range(data.temperatureC, '°C'),
        range(data.durationDays, 'j'), source?.title || source?.reference ? `source : ${yeastSourceTitle(typeof source?.title === 'string' ? source.title : undefined, typeof source?.reference === 'string' && /^https?:\/\//.test(source.reference) ? source.reference : undefined)}` : '',
        typeof data.retrievedAt === 'string' ? `date indiquée : ${yeastDateText(data.retrievedAt)}` : ''].filter(Boolean).join(' · ') || 'non renseigné';
    }
    return 'donnée à consulter dans la fiche';
  };
  for (const key of sheet) rows.push(documentaryDifference(key, adoc[key], bdoc[key]) ?? { id: `sheet-${key}`, label: SHEET_LABELS[key] ?? key,
    before: sheetReading(key, adoc[key]), after: sheetReading(key, bdoc[key]) });
  if (savedGoal !== draftGoal) rows.push({ id: 'goal', label: 'Profil de fermentation', before: goalLabel(savedGoal), after: goalLabel(draftGoal), open: 'objectives' });
  const savedDesign = readYeastRecipeDesign(saved), draftDesign = readYeastRecipeDesign(draft);
  if (comparable(savedDesign?.beerTarget) !== comparable(draftDesign?.beerTarget)) rows.push({ id: 'target', label: 'Cible de la bière',
    before: yeastBeerTargetSummary(savedDesign?.beerTarget) || 'non fixée', after: yeastBeerTargetSummary(draftDesign?.beerTarget) || 'non fixée', open: 'objectives' });
  const bar = (value?: number) => Number.isFinite(value) ? `${decimal(value!)} bar rel.` : 'inconnue';
  if (comparable(savedDesign?.pressureBar) !== comparable(draftDesign?.pressureBar)) rows.push({ id: 'pressure', label: 'Pression précoce', before: bar(savedDesign?.pressureBar), after: bar(draftDesign?.pressureBar) });
  const culture = (design: typeof savedDesign) => [design?.process ?? 'unspecified', design?.cultureRoles, design?.pitchRateMillionPerMlPlato, design?.viableCellsBillion];
  if (comparable(culture(savedDesign)) !== comparable(culture(draftDesign))) rows.push({ id: 'process', label: 'Procédé et cultures',
    before: PROCESS_LABELS[savedDesign?.process ?? 'unspecified'] ?? 'à préciser', after: `${PROCESS_LABELS[draftDesign?.process ?? 'unspecified'] ?? 'à préciser'}${comparable(culture(savedDesign).slice(1)) !== comparable(culture(draftDesign).slice(1)) ? ' · rôles, taux ou cellules modifiés' : ''}` });
  const programme = programmeDifference(saved.fermentation ?? [], draft.fermentation ?? []);
  if (programme) rows.push({ id: 'programme', label: 'Paliers', text: programme, open: 'conduct' });
  return rows;
}

/** Fields a strain change replaces, and that « Annuler » restores exactly. Paliers, hops, mash and
 * every other step of the draft are never part of it, so a later independent correction survives. */
export type YeastChoiceFields = Pick<TrialRecipe, 'yeast' | 'yeastDesign' | 'yeastGuide' | 'hopPredictionIds' | 'hopMatrixId' | 'hopTrialId'>;
/** Catalogue sheet, a real stock lot, or a free entry: three distinct sources, never merged here. */
export type YeastChoiceSource = 'catalogue' | 'stock' | 'free';
export type YeastChoiceIntent = 'replace-selection' | 'restore-selection' | 'conduct' | 'pitching';
/** Last strain change of the draft. `to` is missing while a change started by the Wizard is not rendered yet. */
export interface YeastChoiceChange { source: YeastChoiceSource | 'undo'; from: YeastChoiceFields; to?: YeastChoiceFields; startedAt?: number }
export const yeastChoiceFields = (recipe: TrialRecipe): YeastChoiceFields => structuredClone({
  yeast: recipe.yeast, yeastDesign: recipe.yeastDesign, yeastGuide: recipe.yeastGuide,
  hopPredictionIds: recipe.hopPredictionIds, hopMatrixId: recipe.hopMatrixId, hopTrialId: recipe.hopTrialId,
});
/** Called by the Wizard just before a stock or free choice; the step completes the entry once the new strain is rendered. */
export const startYeastChoiceChange = (recipe: TrialRecipe, source: YeastChoiceSource): YeastChoiceChange =>
  ({ source, from: yeastChoiceFields(recipe), startedAt: Date.now() });
const PENDING_CHANGE_MS = 3000;
const identityKey = (yeast: YeastSpec) => JSON.stringify([yeast.name ?? '', yeast.hopIndexId ?? '', yeast.stockItemRef ?? '']);
const sourceOf = (yeast: YeastSpec): YeastChoiceSource => yeast.stockItemRef ? 'stock' : yeast.hopIndexId ? 'catalogue' : 'free';
const present = (value: unknown) => Array.isArray(value) ? value.length > 0 : value != null && value !== '';
/** What was set on the chosen strain after the change; « Annuler » names it before removing it. */
function laterEdits(to: YeastChoiceFields, now: TrialRecipe): string[] {
  const a = to.yeast, b = now.yeast, rows: string[] = [];
  if (comparable([a.qty, a.unit]) !== comparable([b.qty, b.unit])) rows.push(`quantité ${stateQuantity(b)}`);
  if ((a.form || '') !== (b.form || '')) rows.push(`forme ${b.form || 'à préciser'}`);
  if (comparable(a.pitchTempC) !== comparable(b.pitchTempC)) rows.push(`ensemencement ${degrees(b.pitchTempC, 'vide')}`);
  // The wort to pitch is a physical correction kept by the undo; product, offer, lot and preparation are not.
  if (yeastPitchingChoiceChanged(a, b)) rows.push('produit, offre, lot ou préparation choisis depuis');
  const adoc=documentaryDiffValues(a),bdoc=documentaryDiffValues(b);
  if ([...new Set([...Object.keys(adoc), ...Object.keys(bdoc)])].some(key => documentaryComparable(adoc[key]) !== documentaryComparable(bdoc[key]))) rows.push('corrections de fiche');
  if (comparable(to.yeastDesign) !== comparable(now.yeastDesign)) rows.push('conduite ou objectifs appliqués depuis');
  if (comparable([to.yeastGuide, to.hopPredictionIds, to.hopMatrixId, to.hopTrialId]) !== comparable([now.yeastGuide, now.hopPredictionIds, now.hopMatrixId, now.hopTrialId])) rows.push('guide ou simulation houblon liés depuis');
  return rows;
}

/** Creation-only composition. Touching a strain makes it the draft's strain at once, through the domain's
 * strain contract; « Annuler » restores the replaced fields exactly. A conduct trial stays a separate,
 * explicit path from the side by side. Nothing here saves, writes stock or touches a launched brew. */
export function YeastRecipeChoice({ recipe, savedRecipe, onChange, onNavigate, quantityEditor, identityEditor, factsEditor, aiEditor, programEditor, initialGoal, initialYeastId,
  candidateSheets, onCandidateSheetsChange, candidateSheetsWarning, yeastChange, onYeastChange }: {
  recipe: TrialRecipe; onChange: (next: TrialRecipe, intent?: YeastChoiceIntent) => TrialRecipe | void;
  savedRecipe?: TrialRecipe;
  onNavigate?: (destination: YeastRecipeDestination) => void; quantityEditor: ReactNode;
  identityEditor?: ReactNode; factsEditor?: ReactNode; aiEditor?: ReactNode;
  /** @deprecated Ignored: a candidate's sheet is edited here, in flow, with identity and revision checks. */
  trialFactsEditor?: (yeast: YeastSpec, onChange: (yeast: YeastSpec) => void) => ReactNode; programEditor?: ReactNode;
  initialGoal?: YeastRecipeGoal; initialYeastId?: string;
  /** Accepted local sheets by hopIndexId. Owned by the Wizard so that they survive remounts and the local draft. */
  candidateSheets?: YeastCandidateSheets; onCandidateSheetsChange?: (sheets: YeastCandidateSheets) => void;
  candidateSheetsWarning?: string;
  /** Last strain change, owned by the Wizard so that a stock or free choice (which remounts this step) keeps its undo.
   * Without it, catalogue choices keep a local undo. */
  yeastChange?: YeastChoiceChange; onYeastChange?: (change?: YeastChoiceChange) => void;
}) {
  const supply = useYeastSupply();
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  // The comparison uses only the stored moût at pitching. Recipe OG and final
  // recipe volume are never substituted for an absent measurement/estimate.
  const comparisonPlan = useMemo(() => recipe.yeast.pitching ? readYeastPitchingPlan(recipe.yeast.pitching) : undefined, [recipe.yeast.pitching]);
  const comparisonWort = useMemo(() => {
    return comparisonPlan?.wort ? structuredClone(comparisonPlan.wort) : UNKNOWN_COMPARISON_WORT;
  }, [comparisonPlan]);
  const comparisonRecipeContext = useMemo(() => ({ volumeL: recipe.volumeL, fermentables: recipe.fermentables, efficiencyPct: recipe.efficiencyPct }),
    [recipe.volumeL, recipe.fermentables, recipe.efficiencyPct]);
  const currentDraft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  const current = useMemo(() => evaluateYeastRecipeDesign(recipe, currentDraft, refs), [recipe, currentDraft, refs]);
  const savedDraft = useMemo(() => savedRecipe && createYeastRecipeDraft(savedRecipe, refs), [savedRecipe, refs]);
  const [styleId, setStyleId] = useState<YeastStyleId>(currentDraft.styleId);
  const [goal, setGoal] = useState<YeastRecipeGoal>(initialGoal ?? currentDraft.goal);
  // undefined follows the saved recipe, null means the brewer cleared the
  // objective in this local work, and a value survives strain changes.
  const [goalIntentOverride, setGoalIntentOverride] = useState<YeastRecipeGoal | null | undefined>(initialGoal);
  // Conduct trial of a compared alternative only; choosing a strain never goes through it.
  const [trial, setTrial] = useState<{ yeastId: string; form?: YeastRecipeCandidate['form'] }>();
  // Local programme carried as entered, unknown values included, across a strain change or a trial: never completed or dropped here.
  const [trialProgramme, setTrialProgramme] = useState<FermentationTimelineStep[]>();
  // The catalogue is computed on first use; with a strain chosen, its list opens on the first letter or « Parcourir ».
  const [catalogueVisited, setCatalogueVisited] = useState(!recipe.yeast.name || !!initialYeastId);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [pickerReset, setPickerReset] = useState(0);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(!!initialYeastId);
  const [notice, setNotice] = useState('');
  const [choiceError, setChoiceError] = useState('');
  const [consumedInitial, setConsumedInitial] = useState(false);
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  const [goalSlot, setGoalSlot] = useState<HTMLDivElement | null>(null);
  const [conductRequest, setConductRequest] = useState(0);
  const [pitchRequest, setPitchRequest] = useState(0);
  const [localChange, setLocalChange] = useState<YeastChoiceChange>();
  const change = onYeastChange ? yeastChange : localChange;
  const setChange = (next?: YeastChoiceChange) => { if (onYeastChange) onYeastChange(next); else setLocalChange(next); };
  const invalidDocumentaryRange = recipe.yeast.fermTempMinC != null && recipe.yeast.fermTempMaxC != null && recipe.yeast.fermTempMinC > recipe.yeast.fermTempMaxC;
  const [dossierOpen, setDossierOpen] = useState(false);
  const [referenceSheetOpen, setReferenceSheetOpen] = useState(invalidDocumentaryRange);
  const [candidateSheetOpen, setCandidateSheetOpen] = useState(false);
  // The detailed program does not affect the immediate strain evidence. Mount
  // it on first use, then retain a local scenario when the detail is closed.
  const [programVisited, setProgramVisited] = useState(false);
  useEffect(() => { if (invalidDocumentaryRange) setReferenceSheetOpen(true); }, [invalidDocumentaryRange]);
  const [localSheets, setLocalSheets] = useState<YeastCandidateSheets>({});
  const sheets = candidateSheets ?? localSheets;
  const sheetsRef = useRef(sheets); sheetsRef.current = sheets;
  // Lookups live here, keyed by candidate: a late answer for A is kept under A and never reaches B.
  const [lookups, setLookups] = useState<Record<string, YeastLookupEntry | undefined>>({});
  const [sheetErrors, setSheetErrors] = useState<Record<string, string | undefined>>({});
  const [compareRequest, setCompareRequest] = useState<{ id: string; nonce: number }>();
  const heading = useRef<HTMLHeadingElement>(null);
  const objectivesHeading = useRef<HTMLHeadingElement>(null);
  const catalogue = useRef<HTMLDivElement>(null);
  const quantityBlock = useRef<HTMLDivElement>(null);
  const pitchStation = useRef<HTMLElement>(null);
  // Shared catalogue sheet: corrected in the canonical base, never rewriting the sheet already adopted by this recipe.
  const [catalogueTarget, setCatalogueTarget] = useState<YeastDbCorrectionTarget | null>(null);
  const [catalogueReceipt, setCatalogueReceipt] = useState('');
  const personal = useRef<HTMLDetailsElement>(null);
  const referenceSheetSummary = useRef<HTMLElement>(null);
  const candidateSheetSummary = useRef<HTMLElement>(null);
  // A replacement can be homonymous: the whole selected object, including its documentary scope, matters.
  useEffect(() => {
    if (!change || change.to) return;
    if (documentaryComparable(recipe.yeast) !== documentaryComparable(change.from.yeast)) setChange({ ...change, to: yeastChoiceFields(recipe) });
    else if (Date.now() - (change.startedAt ?? 0) > PENDING_CHANGE_MS) setChange(undefined);
  }, [change, recipe]);
  const openReferenceSheet = () => {
    setReferenceSheetOpen(true);
    requestAnimationFrame(() => { referenceSheetSummary.current?.focus({ preventScroll: true }); referenceSheetSummary.current?.scrollIntoView({ block: 'start' }); });
  };
  const openCandidateSheet = () => {
    setCandidateSheetOpen(true);
    requestAnimationFrame(() => { candidateSheetSummary.current?.focus({ preventScroll: true }); candidateSheetSummary.current?.scrollIntoView({ block: 'start' }); });
  };
  /** Documentary state of a candidate: its catalogue sheet, hydrated with its accepted local sheet. No stock, dose or pitch is carried. */
  const hydrate = (candidate: YeastRecipeCandidate, form = candidate.form): YeastSpec => {
    const base = yeastSpecForCandidate({ ...candidate, form });
    const sheet = sheets[candidate.yeastId];
    if(!sheet)return base;
    const hydrated=mergeYeastCandidateSheet(base,sheet),documentary=adoptedDocumentaryFromCandidateSheet(sheet);
    return hydrated&&documentary?{...hydrated,adoptedDocumentary:documentary}:base;
  };
  /** Accept one candidate sheet against its identity and the revision the change was based on. Nothing else is written. */
  const acceptSheet = (candidateId: string, expectedRevision: number, next: YeastSpec): YeastSheetAccept => {
    const candidate = candidatesById.get(candidateId);
    const adoption = tryAdoptYeastDocumentary(candidate ? hydrate(candidate) : undefined,next,{intent:'documentary'});
    if(adoption.accepted===false)return {accepted:false,message:adoption.message};
    const update = extractYeastCandidateSheet(adoption.yeast);
    if (!update || update.hopIndexId !== candidateId) return { accepted: false, message: 'Identité de souche absente ou différente : rien n’a été retenu.' };
    // The helper reads and returns only the candidate map of the draft it receives.
    const result = tryAcceptYeastCandidateSheet({ candidateSheets: sheetsRef.current } as RecipeWizardDraft, update, expectedRevision);
    if (result.accepted === false) return { accepted: false, message: result.message };
    const nextSheets = result.draft.candidateSheets ?? {};
    sheetsRef.current = nextSheets;
    if (onCandidateSheetsChange) onCandidateSheetsChange(nextSheets); else setLocalSheets(nextSheets);
    return { accepted: true, revision: String(result.revision) };
  };
  /** In-flow sheet of one candidate: sourced lookup with arbitration, then the typed editor.
   * Its scope is said once: here, or in the summary of a fold that already names the candidate (`named` false). */
  const candidateSheet = (candidate: YeastRecipeCandidate, form?: YeastRecipeCandidate['form'], named = true) => {
    const key = candidate.yeastId, revision = sheets[key]?.revision ?? 0, yeast = hydrate(candidate, form);
    const revisionToken = candidateSheetRevisionToken(candidate, form);
    const latestRevision = () => candidateSheetRevisionToken(candidate, form);
    return <div className="yc-sheet-body" data-sheet-revision={revision}>
      {named && <p className="yeast-small" data-sheet-scope-note>Fiche locale de <strong>{candidate.label}</strong>{revision ? ` · corrigée (version ${revision})` : ' · données du catalogue'} : recette, stock et autres candidats inchangés.</p>}
      <YeastSheetAssistant subject={candidate.label} yeast={yeast} reference={candidate.reference} revision={revisionToken}
        latestRevision={latestRevision} entry={lookups[key]}
        onEntry={update => setLookups(map => ({ ...map, [key]: update(map[key]) }))}
        onAccept={(next, _applied, _labels, expected) => {
          if (expected !== latestRevision()) return { accepted: false, message: 'La fiche catalogue a changé depuis cette recherche. Relance-la avant de retenir les faits.' };
          const accepted = acceptSheet(key, sheetsRef.current[key]?.revision ?? 0, next);
          return accepted.accepted === true ? { ...accepted, revision: latestRevision() } : accepted;
        }}
        scopeText="" nolo={!!recipe.nolo?.enabled} />
      {sheetErrors[key] && <p role="alert" className="yeast-error">{sheetErrors[key]}</p>}
      <YeastRecipeDossier scope="candidate" yeast={yeast} reference={candidate.reference} onChange={next => {
        const result = acceptSheet(key, sheetsRef.current[key]?.revision ?? 0, next);
        setSheetErrors(map => ({ ...map, [key]: result.accepted === true ? undefined : result.message }));
      }} />
    </div>;
  };
  const openObjectives = () => {
    setObjectivesOpen(true);
    requestAnimationFrame(() => { objectivesHeading.current?.focus({ preventScroll: true }); objectivesHeading.current?.scrollIntoView({ block: 'start' }); });
  };
  const showCatalogue = () => {
    setCatalogueVisited(true);
    setCatalogueOpen(true);
    requestAnimationFrame(() => { catalogue.current?.focus({ preventScroll: true }); catalogue.current?.scrollIntoView({ block: 'start' }); });
  };
  const id = useId();
  const loadCatalogue = catalogueVisited || !recipe.yeast.name || trial?.yeastId !== undefined;
  const candidates = useMemo(() => loadCatalogue
    ? yeastRecipeCandidates(styleId, goal, refs, recipe.volumeL, { includeOtherStyles: true }) : [],
  [loadCatalogue, styleId, goal, refs, recipe.volumeL]);
  const candidatesById = useMemo(() => new Map(candidates.map(candidate => [candidate.yeastId, candidate])), [candidates]);
  const candidatesByIdRef = useRef(candidatesById); candidatesByIdRef.current = candidatesById;
  const trialCandidate = trial ? candidatesById.get(trial.yeastId) : undefined;
  /** Local sheet revision and the current catalogue base jointly define a lookup's identity. */
  const candidateSheetRevisionToken = (candidate: YeastRecipeCandidate, form?: YeastRecipeCandidate['form']) => {
    const currentCandidate = candidatesByIdRef.current.get(candidate.yeastId), revision = sheetsRef.current[candidate.yeastId]?.revision ?? 0;
    if (!currentCandidate) return JSON.stringify({ hopIndexId: candidate.yeastId, revision, missing: true });
    return JSON.stringify({ hopIndexId: candidate.yeastId, revision, form: form ?? currentCandidate.form,
      label: currentCandidate.label, lab: currentCandidate.lab, reference: currentCandidate.reference,
      temperature: currentCandidate.temperature, attenuation: currentCandidate.attenuation, evidence: currentCandidate.evidence });
  };
  const focusHeading = () => requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start' }); });
  /** Candidate-specific strategy notes are not evidence for the next strain: carried phases take the draft's notes back. */
  const withDraftNotes = (programme?: FermentationTimelineStep[]) => {
    const used = new Set<number>();
    return programme?.map(phase => {
      const index = recipe.fermentation?.findIndex((savedPhase, at) => !used.has(at) && savedPhase.kind === phase.kind && savedPhase.name === phase.name) ?? -1;
      if (index >= 0) used.add(index);
      return { ...phase, note: index >= 0 ? recipe.fermentation![index].note : undefined };
    });
  };
  /** Common end of any strain change: the trial ends, the list folds, the local conduct work is carried. */
  const settleStrainChange = (strainChanged: boolean) => {
    if (strainChanged) setTrialProgramme(withDraftNotes);
    // The catalogue stays loaded: compared alternatives and a later undo keep their candidates.
    setCatalogueVisited(true);
    setTrial(undefined); setCandidateSheetOpen(false); setCatalogueOpen(false); setPickerReset(count => count + 1);
    setSuggestionOpen(false); setConsumedInitial(true); setChoiceError('');
    focusHeading();
  };
  /** One onChange with the whole strain change; its undo entry holds the exact fields before and after. */
  const commitStrain = (next: TrialRecipe, source: YeastChoiceSource) => {
    const from = yeastChoiceFields(recipe);
    let accepted: TrialRecipe;
    const withWort = { ...next, yeast: keepIndependentPitchingWort(next.yeast, recipe.yeast) };
    try { accepted = onChange(withWort,'replace-selection') || withWort; }
    catch (e) { setChoiceError(e instanceof Error ? e.message : 'Changement de levure impossible.'); return; }
    setChange({ source, from, to: yeastChoiceFields(accepted) });
    settleStrainChange(from.yeast.hopIndexId !== accepted.yeast.hopIndexId);
    setNotice('Choix modifié dans le brouillon (non enregistré).');
  };
  /** Direct choice: the domain's strain contract (identity, form and sheet of the chosen product; no quantity,
   * unit, pitch or stock lot of another product), completed with this candidate's accepted local sheet. */
  const chooseDirect = (yeastId: string, form?: YeastRecipeCandidate['form']) => {
    const candidate = candidatesById.get(yeastId);
    if (!candidate) return;
    if (recipe.yeast.name && currentDraft.yeastId === yeastId) {
      if (trial) { setTrial(undefined); setTrialProgramme(undefined); setGoalIntentOverride(undefined); setCandidateSheetOpen(false); setNotice(`Essai arrêté. Le brouillon garde ${recipe.yeast.name}.`); }
      return;
    }
    let next: TrialRecipe;
    try {
      const base = createYeastRecipeDraft(recipe, refs, currentDraft.styleId, yeastId);
      next = applyYeastRecipeDesign(recipe, { ...base, goal: currentDraft.goal, goalExplicit: currentDraft.goalExplicit,
        form: form ?? candidate.form, formYeastId: yeastId }, refs, 'strain');
      const sheet = sheets[yeastId], hydrated = sheet ? mergeYeastCandidateSheet(next.yeast, sheet) : undefined;
      if (hydrated && sheet) {
        const documentary=adoptedDocumentaryFromCandidateSheet(sheet);
        next = completeYeastRecipeDesignApplication(next, documentary?{...hydrated,adoptedDocumentary:documentary}:hydrated);
      }
    } catch (e) { setChoiceError(e instanceof Error ? e.message : 'Choix impossible : vérifie la fiche de cette levure.'); return; }
    commitStrain(next, 'catalogue');
  };
  /** Local conduct trial from the side by side: the draft keeps its strain until « Appliquer au brouillon ». */
  const tryConduct = (yeastId: string, form?: YeastRecipeCandidate['form']) => {
    if (yeastId === currentDraft.yeastId && recipe.yeast.name) return;
    if (trial?.yeastId && trial.yeastId !== yeastId) setTrialProgramme(withDraftNotes);
    setTrial({ yeastId, form });
    // Coming back to a candidate reopens its sheet only when a proposal is waiting under it.
    setCandidateSheetOpen(!!lookups[yeastId]);
    setCatalogueVisited(true); setConsumedInitial(true); setSuggestionOpen(false); setChoiceError('');
    setNotice(trial?.yeastId && trial.yeastId !== yeastId && trialProgramme
      ? 'Nouvelle souche en essai : tes paliers locaux sont conservés tels quels, valeurs inconnues comprises ; vérifie leurs consignes et l’ensemencement pour ce produit.'
      : '');
    focusHeading();
  };
  const endTrial = () => {
    setTrial(undefined); setTrialProgramme(undefined); setGoalIntentOverride(undefined); setCandidateSheetOpen(false);
    setNotice(recipe.yeast.name ? `Essai arrêté. Le brouillon garde ${recipe.yeast.name}.` : 'Essai arrêté. Le brouillon reste sans levure.');
  };
  const changeCurrent = !!change?.to && identityKey(recipe.yeast) === identityKey(change.to.yeast);
  /** Restores exactly the replaced fields; the reverse stays one touch away. */
  const undoChange = () => {
    if (!change?.to || !changeCurrent) return;
    const now = yeastChoiceFields(recipe);
    let accepted: TrialRecipe;
    const restored = { ...recipe, ...structuredClone(change.from), yeast: keepIndependentPitchingWort(structuredClone(change.from.yeast), recipe.yeast) };
    try { accepted = onChange(restored,'restore-selection') || restored; }
    catch (e) { setChoiceError(e instanceof Error ? e.message : 'Annulation impossible.'); return; }
    setChange({ source: 'undo', from: now, to: yeastChoiceFields(accepted) });
    settleStrainChange(now.yeast.hopIndexId !== accepted.yeast.hopIndexId);
    setNotice(accepted.yeast.name ? `${accepted.yeast.name} rétablie telle qu’avant le changement.` : 'Brouillon sans levure rétabli.');
  };
  /** A trial applied from the plan changes the strain too: it gets the same undo. */
  const planChange = (next: TrialRecipe) => {
    const from = yeastChoiceFields(recipe);
    const accepted = onChange(next,'conduct') || next;
    if (identityKey(accepted.yeast) !== identityKey(from.yeast)) setChange({ source: sourceOf(accepted.yeast), from, to: yeastChoiceFields(accepted) });
    return accepted;
  };
  const focusQuantity = () => requestAnimationFrame(() => {
    // The Wizard's editor sits in its slot; without one, the pitching panel's own quantity entry carries the same marker.
    const block = quantityBlock.current ?? pitchStation.current?.querySelector<HTMLElement>('[data-yeast-quantity-editor]') ?? pitchStation.current;
    block?.scrollIntoView({ block: 'center' });
    // On touch devices the protected text entry renders a single-line textarea.
    block?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
  });
  /** Product, offer, lot, wort and preparation edits. Associating a stock lot changes the article reference,
   * not the strain choice: the last strain change keeps its undo, which names what it would also remove. */
  const pitchingChange = (next: TrialRecipe) => {
    const accepted = onChange(next, 'pitching') || next;
    if (changeCurrent && change?.to && identityKey(accepted.yeast) !== identityKey(recipe.yeast)
      && accepted.yeast.name === recipe.yeast.name && accepted.yeast.hopIndexId === recipe.yeast.hopIndexId)
      setChange({ ...change, to: { ...change.to, yeast: { ...change.to.yeast, stockItemRef: accepted.yeast.stockItemRef } } });
    return accepted;
  };
  const openPersonal = () => { setPersonalOpen(true); requestAnimationFrame(() => personal.current?.scrollIntoView({ block: 'start' })); };
  /** Settings of the former strain that the new one does not inherit, each with its place of correction. Rows vanish once set again. */
  const revalidations = (from: YeastChoiceFields): { id: string; text: string; action?: { label: string; run: () => void } }[] => {
    const was = from.yeast, is = recipe.yeast, rows: { id: string; text: string; action?: { label: string; run: () => void } }[] = [];
    if (!was.name) return recipe.fermentation?.length ? [{ id: 'programme', text: `${plural(recipe.fermentation.length, 'palier')} conservés : consignes à vérifier.`, action: { label: 'Voir la conduite', run: () => setConductRequest(count => count + 1) } }] : [];
    if (was.qty != null && is.qty == null) rows.push({ id: 'quantity', text: `Quantité : ${stateQuantity(was)} non reprise`, action: { label: 'Saisir', run: focusQuantity } });
    if (Number.isFinite(was.pitchTempC) && !Number.isFinite(is.pitchTempC)) rows.push({ id: 'pitch', text: `Ensemencement : ${degrees(was.pitchTempC)} non repris`, action: { label: 'Régler', run: () => setPitchRequest(count => count + 1) } });
    if (was.stockItemRef && was.stockItemRef !== is.stockItemRef) rows.push({ id: 'stock', text: `Lot ${was.stockItemRef} non repris${is.stockItemRef ? ` · lot ${is.stockItemRef}` : ' · aucun lot lié'}`, action: identityEditor ? { label: 'Mon stock', run: openPersonal } : undefined });
    if (was.pitching?.product && was.pitching.product.id !== is.pitching?.product?.id) rows.push({ id: 'product', text: `Produit ${was.pitching.product.label} non repris${was.pitching.preparation ? ', ni sa préparation' : ''}`, action: { label: 'Ensemencement', run: focusQuantity } });
    const before = readYeastRecipeDesign({ ...recipe, ...from }), after = readYeastRecipeDesign(recipe);
    const lost = [before?.pressureBar !== undefined && after?.pressureBar === undefined ? `pression ${decimal(before.pressureBar)} bar` : '',
      (before?.process ?? 'unspecified') !== 'unspecified' && (after?.process ?? 'unspecified') === 'unspecified' ? PROCESS_LABELS[before!.process!] : '',
      before?.cultureRoles?.length && !after?.cultureRoles?.length ? 'cultures' : '',
      before?.pitchRateMillionPerMlPlato !== undefined && after?.pitchRateMillionPerMlPlato === undefined ? 'taux cellulaire' : '',
      before?.viableCellsBillion !== undefined && after?.viableCellsBillion === undefined ? 'cellules viables' : ''].filter(Boolean);
    if (lost.length) rows.push({ id: 'scenario', text: `Scénario non repris : ${lost.join(', ')}`, action: { label: 'Scénario', run: () => setConductRequest(count => count + 1) } });
    if (present(from.yeastGuide) && !present(recipe.yeastGuide)) rows.push({ id: 'guide', text: 'Guide éditorial précédent retiré' });
    if ([from.hopMatrixId, from.hopTrialId, from.hopPredictionIds].some(present) && ![recipe.hopMatrixId, recipe.hopTrialId, recipe.hopPredictionIds].some(present))
      rows.push({ id: 'hops', text: 'Simulation houblon précédente à relancer', action: onNavigate ? { label: 'Houblons', run: () => onNavigate('houblons') } : undefined });
    if (recipe.fermentation?.length) rows.push({ id: 'programme', text: `${plural(recipe.fermentation.length, 'palier')} conservés tels quels : consignes à vérifier`, action: { label: 'Paliers', run: () => setConductRequest(count => count + 1) } });
    return rows;
  };
  const trialName = trialCandidate?.label ?? trial?.yeastId;
  const trialSheet = trial ? sheets[trial.yeastId] : undefined;
  const trialYeast = useMemo(() => !trial || !trialCandidate ? undefined : currentDraft.yeastId === trial.yeastId ? { ...recipe.yeast } : hydrate(trialCandidate, trial.form),
    [trial?.yeastId, trial?.form, trialSheet, trialCandidate, currentDraft.yeastId, recipe.yeast]);
  /** The side by side at the moment it helps: the tried candidate next to the draft strain, on request only. */
  const compareTrial = () => {
    if (!trial) return;
    showCatalogue();
    setCompareRequest(previous => ({ id: trial.yeastId, nonce: (previous?.nonce ?? 0) + 1 }));
  };
  const trialGoal = goalIntentOverride === undefined
    ? currentDraft.goalExplicit ? currentDraft.goal : undefined
    : goalIntentOverride ?? undefined;
  const onTrialGoal = (value: YeastRecipeGoal, explicit: boolean) => { setGoal(value); setGoalIntentOverride(explicit ? value : null); };
  const selected = current.candidate, dossier = current.projection?.dossier;
  const recipeStyle = inferYeastRecipeStyle(recipe);
  const quantity = quantityReading(recipe.yeast);
  const chosen = !!recipe.yeast.name;
  const warnings = yeastWarningsForReading(current).filter(text => !text.startsWith('Quantité de levure sèche à renseigner') && !text.startsWith('Style non reconnu')
    // A stored zero or negative value is explained with the quantity, not read as a dose beside the manufacturer reference.
    && !(quantity.state === 'invalid' && text.startsWith('Quantité prévue hors du repère fabricant')));
  // Without a strain, station 1 already asks for it: the identity error is not repeated as a red conduct error.
  const identityMessages = new Set(current.problems.filter(problem => problem.code === 'identity.required').map(problem => problem.message));
  const strainErrors = chosen ? current.errors : current.errors.filter(text => !identityMessages.has(text));
  const hasObjectives = chosen || !!trial;
  // Paliers already in the draft stay reachable even before any strain is chosen.
  const hasPlan = hasObjectives || !!recipe.fermentation?.length;
  // Decisions with a lead time (product, purchase, preparation before J0) come right after the strain; numbers never skip.
  const pitchStep = chosen ? 2 : 0;
  const objectivesStep = hasObjectives ? (chosen ? 3 : 2) : 0;
  const conductStep = (objectivesStep || pitchStep || 1) + 1;
  const draftGoal = currentDraft.goalExplicit ? currentDraft.goal : undefined;
  // A local profile not yet applied follows the strain change into the remounted plan.
  const goalCarry = goalIntentOverride && goalIntentOverride !== draftGoal ? goalIntentOverride : undefined;
  const differences = savedRecipe ? draftDifferences(savedRecipe, recipe, savedDraft?.goalExplicit ? savedDraft.goal : undefined, draftGoal) : [];
  const immediateDifferences = differences.filter(row => !row.id.startsWith('sheet-'));
  const documentaryDifferences = differences.filter(row => row.id.startsWith('sheet-'));
  const differenceRow = (row: DraftDifference) => <li key={row.id} data-difference={row.id}><strong>{row.label}</strong><div className="yc-diff-body">
    {row.text ?? <><span data-side="saved"><YeastLinkedText text={row.before ?? ''} /></span> → <span data-side="draft"><YeastLinkedText text={row.after ?? ''} /></span></>}
    {row.detail}
    {row.open && (row.open === 'conduct' ? hasPlan : hasObjectives) && <> <button type="button" className="yeast-link" onClick={() => row.open === 'conduct' ? setConductRequest(count => count + 1) : openObjectives()}>{row.open === 'conduct' ? 'Voir la conduite' : 'Voir les objectifs'}</button></>}
  </div></li>;
  const targetText = yeastBeerTargetSummary(currentDraft.beerTarget);
  const objectivesSummary = <><span>Profil : {goalLabel(trialGoal)}{trialGoal !== draftGoal ? ` · brouillon : ${goalLabel(draftGoal)}` : ''}</span>
    <span>Cible : {targetText || 'non fixée'}</span></>;
  const candidateFold = !!(trial && trialCandidate && currentDraft.yeastId !== trial.yeastId);
  const suggested = suggestionOpen && initialYeastId && initialYeastId !== currentDraft.yeastId && !trial ? candidatesById.get(initialYeastId) : undefined;
  const later = changeCurrent && change?.to ? laterEdits(change.to, recipe) : [];
  const toRevalidate = changeCurrent && change && change.source !== 'undo' ? revalidations(change.from) : [];
  const identityText = [recipe.yeast.lab || selected?.lab || 'laboratoire à préciser', recipe.yeast.form || 'forme à préciser'].join(' · ');
  const sourceText = recipe.yeast.stockItemRef ? `Lot ${recipe.yeast.stockItemRef}` : recipe.yeast.hopIndexId ? 'Catalogue' : 'Saisie libre';
  // NOLO keeps its complete workshop; the same qualified pitching carries the single quantity entry once a strain exists.
  if (recipe.nolo?.enabled) return <><YeastRecipeWorkbench recipe={recipe} onChange={onChange} onNavigate={onNavigate} />
    {chosen ? <YeastPitchingPanel recipe={recipe} onChange={pitchingChange} quantityEditor={quantityEditor} /> : quantityEditor}{identityEditor}{aiEditor}{factsEditor}</>;
  const quantitySlot = (editor: ReactNode) => <div ref={quantityBlock} role="group" aria-label="Quantité prévue de levure" className="yc-quantity-slot" data-yeast-quantity={quantity.state} data-yeast-quantity-editor>
    {editor}</div>;
  const catalogueReference = recipe.yeast.hopIndexId && selected?.reference && selected.reference.id === recipe.yeast.hopIndexId ? selected.reference : undefined;
  const openCatalogueCorrection = () => {
    if (!catalogueReference) return;
    const inBase = Array.isArray(saved) && saved.some(row => row.id === catalogueReference.id);
    setCatalogueReceipt('');
    setCatalogueTarget({ scope: 'catalogue', id: catalogueReference.id, ...(inBase ? {} : { fallback: catalogueReference }), context: { recipe } });
  };
  const catalogueCorrection = catalogueReference && <div className="yc-catalogue-correction" data-catalogue-correction>
    <p className="yeast-small">Fiche catalogue partagée de {catalogueReference.name ?? recipe.yeast.name} : corrigée dans la base commune ; la fiche déjà adoptée dans cette recette n’est pas réécrite.</p>
    <button type="button" className="yeast-link" onClick={openCatalogueCorrection}>Corriger la fiche catalogue</button>
    {catalogueReceipt && <p className="yeast-small" role="status" data-catalogue-receipt>{catalogueReceipt}</p>}
  </div>;
  return <div className="yeast-workbench yeast-choice yc-journey" aria-label="Choisir la levure de la recette" data-yeast-state={trial ? 'trial' : chosen ? 'chosen' : 'empty'}>
    <header className="yc-journey-state" aria-label="État du choix de levure">
      {!savedRecipe ? <p className="yc-state-line" data-draft-state="new">Recette pas encore enregistrée</p>
        : !differences.length ? <p className="yc-state-line" data-draft-state="saved" title="Comparés : identité, forme, quantité, ensemencement et fiche de la levure ; produit, offre, lot, moût à ensemencer et préparation ; profil, cible, pression, procédé et paliers.">
          Levure, quantité et conduite identiques à la recette enregistrée</p>
          : <><p className="yc-state-line" data-draft-state="changed"><strong>Brouillon non enregistré</strong></p>
            {immediateDifferences.length > 0 && <ul className="yc-state-diff" aria-label="Écarts du brouillon avec la recette enregistrée">{immediateDifferences.map(differenceRow)}</ul>}
            {documentaryDifferences.length > 0 && <details className="yc-state-documentary"><summary>{documentaryDifferences.length} modification{documentaryDifferences.length > 1 ? 's' : ''} de fiche à relire</summary>
              <ul className="yc-state-diff" aria-label="Différences documentaires avec la recette enregistrée">{documentaryDifferences.map(differenceRow)}</ul>
            </details>}</>}
      {candidateSheetsWarning && <p className="yeast-notice" role="status">{candidateSheetsWarning}</p>}
    </header>
    <section className="yc-station yc-strain-station" aria-label="Levure de la recette">
      {/* No introduction: each result says « Choisir », and stock/free entry carry their own heading just below. */}
      <div className="yc-station-heading"><span className="yc-step-number" aria-hidden="true">1</span><div><h3 tabIndex={-1} ref={heading}>{chosen ? 'Levure' : 'Levure · choisir'}</h3></div></div>
      {chosen && <div className="yc-identity-card" data-yeast-source={sourceOf(recipe.yeast)}>
        <span><strong>{recipe.yeast.name}</strong><small>{identityText}</small></span><span className="yc-tag">{sourceText}</span>
      </div>}
      {/* The undo sits with the strain it concerns; what it would also remove is said before the touch. */}
      {changeCurrent && change?.to && <div className="yc-change-bar" role="group" aria-label="Dernier changement de levure" data-change-source={change.source}>
        <p className="yc-change-line">{change.source === 'undo'
          ? <strong>{change.to.yeast.name ? `${change.to.yeast.name} rétablie` : 'Brouillon sans levure rétabli'}</strong>
          : <strong>{change.from.yeast.name ? `Depuis ${change.from.yeast.name}` : 'Levure choisie'}</strong>}
          {(!savedRecipe || differences.length > 0) && ' · non enregistré'}</p>
        <button type="button" className="yc-undo" data-undo-change onClick={undoChange} aria-describedby={later.length ? `${id}-undo-note` : undefined}>
          <Undo2 size={14} aria-hidden="true" className={change.source === 'undo' ? 'yc-redo-icon' : undefined} />
          {change.source === 'undo' ? `Rétablir ${change.from.yeast.name || 'sans levure'}` : 'Annuler le changement'}</button>
        {later.length > 0 && <p id={`${id}-undo-note`} className="yeast-small" data-undo-later>{change.source === 'undo' ? 'Rétablir' : 'Annuler'} retire aussi : {later.join(', ')}. Paliers et autres étapes restent tels quels.</p>}
        {toRevalidate.length > 0 && <ul className="yc-revalidate" aria-label="À revalider pour cette levure">{toRevalidate.map(row => <li key={row.id} data-revalidate={row.id}>
          <span>{row.text}</span>{row.action && <button type="button" className="yeast-link" onClick={row.action.run}>{row.action.label}</button>}</li>)}</ul>}
      </div>}
      {choiceError && <p role="alert" className="yeast-error">{choiceError}</p>}
      {suggested && <div className="yc-suggestion" role="group" aria-label="Levure proposée par la simulation houblon">
        <span>Proposée par la simulation houblon : <strong>{suggested.label}</strong> · {suggested.lab}</span>
        <span className="yc-suggestion-actions"><button type="button" className="yc-choose" onClick={() => chooseDirect(suggested.yeastId, suggested.form)}>Choisir</button>
          <button type="button" className="yeast-link" onClick={() => tryConduct(suggested.yeastId, suggested.form)}>Essayer la conduite</button>
          <button type="button" className="yeast-link" onClick={() => setSuggestionOpen(false)}>Ignorer</button></span>
      </div>}
      {/* The only statement of the conduct trial's scope, next to its exits. */}
      {trialName && trial && <p className="yc-trial-status" role="status" data-state="trial"><span>Essai de conduite <strong>{trialName}</strong>{trialYeast?.form ? ` · ${trialYeast.form}` : ' · forme inconnue'} · brouillon {chosen ? `garde ${recipe.yeast.name}` : 'sans levure'} jusqu’à « Appliquer au brouillon ».</span>
        <span className="yc-trial-actions">{trialCandidate && <button type="button" className="yeast-link" onClick={() => chooseDirect(trial.yeastId, trial.form)}>Choisir {trialName}</button>}
          {chosen && trialCandidate && <button type="button" className="yeast-link yc-compare-trial" onClick={compareTrial}>Comparer avec {recipe.yeast.name}</button>}
          <button type="button" className="yeast-link" onClick={endTrial}>{chosen ? `Garder ${recipe.yeast.name}` : 'Arrêter l’essai'}</button></span></p>}
      {notice && <p role="status" className="yeast-small">{notice}</p>}
      <div ref={catalogue} tabIndex={-1} id={`${id}-catalogue`} aria-label="Chercher une levure" className="yc-catalogue" data-collapsed={chosen && !catalogueOpen}>
        <YeastCandidatePicker candidates={candidates} styleId={styleId} selectedId={currentDraft.yeastId} onSelect={chooseDirect}
          collapsed={chosen && !catalogueOpen} onActivate={() => setCatalogueVisited(true)} onExpand={showCatalogue}
          onCollapse={chosen ? () => setCatalogueOpen(false) : undefined} resetRequest={pickerReset}
          searchLabel={chosen ? 'Chercher une autre levure' : 'Rechercher une levure'} placeholder={chosen ? 'Changer : nom, code, fabricant, arôme…' : undefined}
          filters={<>
            <div className="yeast-filter"><label htmlFor={`${id}-style`}>Famille</label><select id={`${id}-style`} aria-label="Filtrer les levures par style" value={styleId} onChange={e => setStyleId(e.target.value as YeastStyleId)}>{YEAST_STYLE_FAMILIES.map(style => <option key={style.id} value={style.id}>{style.id === 'unknown' ? 'Toutes les familles' : style.label}</option>)}</select></div>
            {styleId !== 'unknown' && styleId !== recipeStyle && <p className="yeast-small">Famille de comparaison distincte du style de la recette : {recipe.style || 'à préciser'}.</p>}
          </>}
          recipeChoice={{ volumeL: recipe.volumeL, onChoose: chooseDirect, onTry: tryConduct, trialId: trial?.yeastId,
            draftReference: chosen ? { label: recipe.yeast.name, lab: recipe.yeast.lab, form: recipe.yeast.form } : undefined,
            supply, comparisonWort, comparisonRecipeContext,
            recipeProductCopy: comparisonPlan?.product, recipeOfferCopy: comparisonPlan?.offer,
            sheetYeast: candidate => hydrate(candidate), sheetRevision: candidate => sheets[candidate.yeastId]?.revision ?? 0,
            renderSheet: candidate => candidateSheet(candidate),
            referenceDossier: chosen ? dossier : undefined, referenceYeast: chosen ? recipe.yeast : undefined,
            onEditReference: chosen && (aiEditor || factsEditor) ? openReferenceSheet : undefined, compareRequest }} />
        {/* Stock lot and free entry are sources of their own: open without a strain, one fold away with one. */}
        {identityEditor && (chosen
          ? <details ref={personal} className="yc-personal-fold" open={personalOpen} onToggle={e => setPersonalOpen(e.currentTarget.open)}>
            <summary><span>Mon stock ou saisie libre</span><ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="yc-personal">{identityEditor}</div>
          </details>
          : <div className="yc-personal" data-personal-open><h4>Mon stock ou saisie libre</h4>{identityEditor}</div>)}
      </div>
      {/* Exact product and offers, after the direct search that must stay in the first screen: optional, never a quantity, never a purchase. */}
      {chosen && <YeastPitchingPanel part="supply" recipe={recipe} onChange={pitchingChange} />}
      {/* Recipe reference and tried candidate are separate editable identities. */}
      {chosen && !!(aiEditor || factsEditor) && <details className="yc-sheet-fold" data-sheet-scope="recipe"
        aria-label={`Fiche de ${recipe.yeast.name}`} open={referenceSheetOpen} onToggle={e => setReferenceSheetOpen(e.currentTarget.open)}>
        <summary ref={referenceSheetSummary}><span><strong>Compléter ou corriger la fiche{candidateFold ? ` de ${recipe.yeast.name}` : ''}</strong>
          <small>{candidateFold ? 'Référence du brouillon · distincte de la fiche en essai' : 'Valeurs typées, sources et recherche IA'}</small></span>
          <ChevronDown size={14} aria-hidden="true" /></summary>
        <div>{aiEditor}{factsEditor}{catalogueCorrection}</div>
      </details>}
      {candidateFold && trial && trialCandidate && <details className="yc-sheet-fold" data-sheet-scope="candidate"
        aria-label={`Fiche de ${trialName}`} open={candidateSheetOpen} onToggle={e => setCandidateSheetOpen(e.currentTarget.open)}>
        <summary ref={candidateSheetSummary}><span><strong>Compléter ou corriger la fiche de {trialName}</strong>
          <small data-sheet-scope-note>Essai local · {trialSheet?.revision ? 'fiche corrigée localement' : 'fiche du catalogue'} · recette, stock et autres candidats inchangés</small></span>
          <ChevronDown size={14} aria-hidden="true" /></summary>
        <div>{candidateSheet(trialCandidate, trial.form, false)}</div>
      </details>}
      {chosen && <details className="yc-strain-reading"><summary>Profil du brouillon, estimation et sources<ChevronDown size={14} aria-hidden="true" /></summary><div>
        {dossier && <YeastEvidenceSummary dossier={dossier} recipe={recipe} onOpenDossier={openReferenceSheet} />}
        <YeastProjectionReading result={current} />
      </div></details>}
      {chosen && warnings.length > 0 && <ul className="yc-alerts" aria-label="Points à vérifier pour la levure choisie">{warnings.map(text => <li key={text}>{text}</li>)}</ul>}
      {strainErrors.map(text => <p className="yeast-error" role="alert" key={text}>{text} Corrige la conduite ci-dessous.</p>)}
    </section>
    {/* Wort to pitch, sourced advice, the single planned quantity, lot and preparation before J0 of the draft strain. */}
    {chosen && <section ref={pitchStation} className="yc-station yc-pitch-station" aria-label="Ensemencement et préparation" data-pitch-trial={trial ? true : undefined}>
      <div className="yc-station-heading"><span className="yc-step-number" aria-hidden="true">{pitchStep}</span><div><h3>Ensemencement et préparation</h3></div></div>
      {trial ? quantitySlot(<>
        <div className="yc-projection-title"><h4>Quantité prévue de {recipe.yeast.name}</h4><span className={quantity.state === 'set' ? 'yc-number' : 'yeast-notice'}>{quantity.text}</span></div>
        <p className="yeast-small" data-quantity-trial>Propre à {recipe.yeast.name} : non reprise pour l’essai, à revalider avant d’appliquer. Produit, moût et préparation restent ceux du brouillon.</p></>)
        // The state of the one planned quantity (missing, unit, zero, negative) is read by the panel right under this editor.
        // Without a Wizard editor, nothing is passed and the panel keeps its own entry.
        : <YeastPitchingPanel part="pitching" recipe={recipe} onChange={pitchingChange}
          legacyDoseG={recipe.yeast.form === 'sèche' ? current.doseG?.range : undefined}
          quantityEditor={quantityEditor ? quantitySlot(<div className="yc-quantity">{quantityEditor}</div>) : undefined} />}
    </section>}
    {/* Two distinct intentions, one entry: the profile prepares the conduct, the target may rescale the recipe. */}
    {hasObjectives && <section className="yc-station yc-goal-station" aria-label="Objectifs">
      <StationHeading step={objectivesStep} title="Objectifs" fold="objectives" open={objectivesOpen} onToggle={() => setObjectivesOpen(open => !open)}
        controls={`${id}-objectives`} headingRef={objectivesHeading} summary={objectivesSummary} />
      <div id={`${id}-objectives`} hidden={!objectivesOpen} className="yc-station-body">
        <div ref={setGoalSlot} className="yc-objective-slot" />
        {chosen && <YeastBeerTargetPanel recipe={recipe} refs={refs} onChange={onChange} onNavigate={onNavigate} />}
      </div>
    </section>}
    {hasPlan && <YeastRecipePlan key={`${currentDraft.yeastId || recipe.yeast.name}|${trial?.yeastId ?? ''}|${trial?.form ?? ''}`} recipe={recipe} refs={refs} onChange={planChange} onGoal={onTrialGoal} onCompare={showCatalogue}
        onNavigate={onNavigate} onEditFacts={trial ? openCandidateSheet : openReferenceSheet} onEditObjectives={openObjectives}
        initialGoal={trial ? trialGoal : goalCarry ?? (consumedInitial ? undefined : initialGoal)} initialYeastId={trial?.yeastId} initialForm={trial?.form}
        initialProgramme={trialProgramme} trialYeast={trialYeast} onProgrammeChange={setTrialProgramme}
        goalSlot={hasObjectives ? goalSlot : null} conductStep={conductStep} conductRequest={conductRequest} pitchRequest={pitchRequest}
        onApplied={() => { setTrial(undefined); setCandidateSheetOpen(false); setTrialProgramme(undefined); setGoalIntentOverride(undefined); setNotice('Essai appliqué au brouillon. Enregistre la recette pour le conserver.'); }}
        onDiscard={() => { setCandidateSheetOpen(false); setTrialProgramme(undefined); setGoalIntentOverride(undefined); if (trial) { setTrial(undefined); setNotice(chosen ? `Essai annulé. Le brouillon garde ${recipe.yeast.name}.` : 'Essai annulé. Le brouillon reste sans levure.'); } }} />}
    {chosen && <details className="yc-dossier" aria-label="Dossier de la levure" open={dossierOpen} onToggle={e => setDossierOpen(e.currentTarget.open)}><summary>Repères pratiques, sources et programme détaillé<ChevronDown size={14} aria-hidden="true" /></summary><div>
      {selected && <p className="yc-selected-profile">{selected.descriptor}</p>}
      {recipeStyle === 'unknown' && <p className="yeast-small">Style libre : {recipe.style || 'non précisé'}. Le catalogue permet une comparaison toutes familles.</p>}
      <YeastStrainDetails information={yeastStrainInformation(selected?.reference, recipe.yeast.form)} />
      {!(aiEditor || factsEditor) && catalogueCorrection}
      {programEditor && <details onToggle={e => { if (e.currentTarget.open) setProgramVisited(true); }}><summary onClick={() => setProgramVisited(true)}>Programme détaillé et guides enregistrés<ChevronDown size={14} aria-hidden="true" /></summary><div>{programVisited && programEditor}</div></details>}
    </div></details>}
    <YeastDbCorrectionsPanel target={catalogueTarget} onClose={() => setCatalogueTarget(null)} onUpdated={receipt => setCatalogueReceipt(receipt.readback === 'pending'
      ? 'Fiche catalogue corrigée et confirmée par la base ; la copie de cet appareil reste à actualiser. La fiche adoptée dans cette recette est inchangée.'
      : 'Fiche catalogue corrigée et confirmée par la base. La fiche adoptée dans cette recette est inchangée : relis-la ou relance sa recherche pour reprendre ces valeurs.')} />
    {/* Without a strain there is no sheet to show; the recorded programme stays one fold away. */}
    {!chosen && programEditor && <details className="yc-dossier" onToggle={e => { if (e.currentTarget.open) setProgramVisited(true); }}><summary onClick={() => setProgramVisited(true)}>Programme détaillé et guides enregistrés<ChevronDown size={14} aria-hidden="true" /></summary><div>{programVisited && programEditor}</div></details>}
  </div>;
}
