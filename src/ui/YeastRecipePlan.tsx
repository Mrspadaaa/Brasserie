import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Trash2, Undo2 } from 'lucide-react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { YeastReference } from '../domain/yeastReferences';
import {
  applyYeastRecipeDesign, calculateYeastCellRequirement, completeYeastRecipeDesignApplication, createYeastRecipeDraft, evaluateYeastRecipeDesign, withTrialYeast,
  isCompleteYeastRecipeProgramme, yeastRecipeProgramme, yeastRecipeProgrammeIssues, proposeYeastGoalSettings,
  YEAST_RECIPE_GOAL_LABELS, YEAST_STYLE_FAMILIES,
  yeastRecipeHopSummary,
  type YeastRecipeDraft, type YeastRecipeEvaluation, type YeastRecipeGoal, type YeastRecipeProblem,
} from '../domain/yeastRecipeDesign';
import { NumberInput } from './NumberInput';
import { Input, Textarea } from './Input';
import { YeastRangeComparison } from './YeastRangeComparison';
import { YEAST_FACT_LABELS } from '../domain/yeastCatalogue';
import { proposeYeastFermentationStrategy, type YeastFermentationStrategy } from '../domain/yeastFermentationStrategy';
import {
  editFermentationTimelineStep, insertFermentationTimelineStep, planFermentationTimeline, positionFermentationSteps, removeFermentationTimelineStep,
  type FermentationTimelineStep, type PositionedFermentationStep,
} from '../domain/fermentationTimeline';
import { FermentationTemperatureChart, describeFermentationEdit, type FermentationChartContact } from './FermentationTemperatureChart';
import type { YeastSpec } from '../types';
import { readYeastFactValue, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const number = (value?: number | null, digits = 1) => Number.isFinite(value) ? value!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';
const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;
export const projectionRange = (value: { min: number; max: number } | null | undefined, digits: number) => value
  ? `${value.min.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}${value.min === value.max ? '' : `–${value.max.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`}` : 'À préciser';
const processLabels = {
  unspecified: 'Fermentation alcoolique · procédé à confirmer', preacidified: 'Moût déjà acidifié',
  'acidifying-yeast': 'Levure acidifiante', 'mixed-culture': 'Cultures mixtes / successives',
};
const chartContacts = (recipe: TrialRecipe): FermentationChartContact[] => recipe.hops.filter(hop => hop.stage === 'dryHop').map(hop => ({
  name: hop.name, dayOffset: hop.dayOffset, contactHours: hop.aromaContactHours, temperatureC: hop.aromaTemperatureC,
  phase: hop.aromaTiming === 'fermentation' || hop.aromaTiming === 'postFermentation' ? hop.aromaTiming : undefined,
}));
const recipeKey = (recipe: TrialRecipe) => JSON.stringify({ yeast: recipe.yeast, yeastDesign: recipe.yeastDesign,
  fermentation: recipe.fermentation, fermentables: recipe.fermentables, hops: recipe.hops, mash: recipe.mash,
  style: recipe.style, styleRef: recipe.styleRef, volumeL: recipe.volumeL, ogTarget: recipe.ogTarget, efficiencyPct: recipe.efficiencyPct });
const programmeForDraft = yeastRecipeProgramme;
const programmeKey = (steps: readonly FermentationTimelineStep[]) => JSON.stringify(steps.map(step => [step.kind, step.name, step.tempC ?? null, step.days ?? null, step.note ?? null]));
type YeastChange = YeastRecipeEvaluation['changes'][number];
/** "Ensemencement" alone is ambiguous: the temperature is the one expressed in °C. */
const isPitchTemperatureChange = (change: YeastChange) => change.id === 'pitch';
const isPitchQuantityChange = (change: YeastChange) => change.id === 'quantity';
const changeLabel = (change: YeastChange) => isPitchTemperatureChange(change) ? 'Température d’ensemencement'
  : isPitchQuantityChange(change) ? 'Quantité prévue de levure' : change.label;
const FACT_UNITS: Record<string, string> = { attenuationPct: '%', fermTempMinC: '°C', fermTempMaxC: '°C', alcoholTolerancePct: '% vol', fermentDays: 'j' };
const FLOCCULATION_LABELS: Record<string, string> = { low: 'Faible', 'low-medium': 'Faible à moyenne', 'medium-low': 'Faible à moyenne',
  medium: 'Moyenne', 'medium-high': 'Moyenne à élevée', high: 'Élevée', 'very high': 'Très élevée' };
const exactNumber = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 20 });
/** Sheet value in French: decimal comma and unit, known flocculation words translated, anything else as published. */
const factValue = (field: string, value: unknown) => value == null || value === '' ? 'inconnu'
  : typeof value === 'number' ? `${exactNumber(value)}${FACT_UNITS[field] ? ` ${FACT_UNITS[field]}` : ''}`
    : field === 'flocculation' ? FLOCCULATION_LABELS[String(value).trim().toLowerCase()] ?? String(value) : String(value);
const documentaryNotesText = (notes: YeastSpec['documentaryNotes']) => notes === undefined ? 'non renseignées'
  : notes === null ? 'inconnues' : notes.length === 0 ? 'aucune note retenue'
    : notes.map(note => [note.text, note.origin === 'personal' ? 'Saisie personnelle' : note.origin === 'manufacturer' ? 'Fabricant' : 'IA',
      note.source, note.sourceUrl, note.retrievedAt, note.context].filter(Boolean).join(' · ')).join(' ; ');
const factSignature = (fact: YeastTechnicalFact) => JSON.stringify([fact.key, fact.reported, fact.range?.min, fact.range?.max,
  fact.unit, fact.qualifier, fact.origin, fact.source, fact.sourceUrl, fact.retrievedAt, fact.context]);
const observationText = (fact: YeastTechnicalFact) => {
  const value = readYeastFactValue(fact).value;
  const unit = fact.unit ? ` ${fact.unit}` : '';
  const exact = value.kind === 'range' ? `plage ${exactNumber(value.min)}–${exactNumber(value.max)}${unit}`
    : value.kind === 'point' ? `point publié · ${exactNumber(value.value)}${unit}`
      : value.kind === 'bound' ? `borne ${value.operator} ${exactNumber(value.value)}${unit}`
        : value.kind === 'category' ? `catégorie · ${value.value}` : 'donnée inconnue';
  return [exact, fact.reported !== exact ? fact.reported : undefined, fact.context].filter(Boolean).join(' · ');
};
const DOCUMENTARY_SELECTIONS = [['temperature', 'Température de fermentation', '°C'], ['attenuation', 'Atténuation', '%'],
  ['alcoholTolerance', 'Tolérance alcoolique', '% vol']] as const;
/** Names what the sheet published — range, upper bound or point — without deriving a midpoint. */
const selectionText = ({ qualifier, range }: { qualifier?: string; range?: { min: number; max: number } }, unit: string) => !range ? 'à préciser'
  : qualifier === 'upTo' ? `borne haute · au plus ${exactNumber(range.max)} ${unit}`
    : qualifier === 'atLeast' ? `borne basse · au moins ${exactNumber(range.min)} ${unit}`
      : qualifier === 'greaterThan' ? `borne basse stricte · > ${exactNumber(range.min)} ${unit}`
        : qualifier === 'lessThan' ? `borne haute stricte · < ${exactNumber(range.max)} ${unit}`
      : qualifier === 'range' ? `plage ${exactNumber(range.min)}–${exactNumber(range.max)} ${unit}`
        : qualifier === 'reportedPoint' ? `point publié · ${exactNumber(range.min)} ${unit}`
          : `valeur publiée · ${exactNumber(range.min)} ${unit}`;

/** Existing phase types only; a new phase starts with unknown temperature and duration. */
const PHASE_KINDS: { kind: FermentationTimelineStep['kind']; label: string; name: string }[] = [
  { kind: 'primaire', label: 'Fermentation principale', name: 'Fermentation principale' },
  { kind: 'reposDiacetyle', label: 'Repos diacétyle', name: 'Repos diacétyle' },
  { kind: 'garde', label: 'Garde ou froid', name: 'Garde' },
  { kind: 'refermentation', label: 'Refermentation', name: 'Refermentation' },
  { kind: 'ajout', label: 'Étape ponctuelle ou ajout', name: 'Ajout' },
];
/** Pairs each target phase with a source phase of the same type and name, then a unique same-type phase. */
const matchPhases = (source: readonly FermentationTimelineStep[], target: readonly FermentationTimelineStep[]) => {
  const used = new Set<number>();
  return target.map(phase => {
    let match = source.findIndex((before, index) => !used.has(index) && before.kind === phase.kind && before.name === phase.name);
    if (match < 0) {
      const sameKind = source.map((before, index) => ({ before, index })).filter(row => !used.has(row.index) && row.before.kind === phase.kind);
      if (sameKind.length === 1 && target.filter(other => other.kind === phase.kind).length === 1) match = sameKind[0].index;
    }
    if (match >= 0) used.add(match);
    return match;
  });
};
type ProgrammeIssue = { index?: number; field?: 'name' | 'kind' | 'note' | 'tempC' | 'days' | 'phase'; text: string };
/** Navigation list for an incomplete programme; the domain alone decides completeness. */
const programmeIssues = (steps: readonly FermentationTimelineStep[]): ProgrammeIssue[] => yeastRecipeProgrammeIssues(steps).map(issue => ({
  index: issue.phaseIndex < 0 ? undefined : issue.phaseIndex, field: issue.field,
  text: `${issue.phaseIndex < 0 ? '' : `Palier ${issue.phaseIndex + 1} · ${steps[issue.phaseIndex]?.name || 'sans nom'} : `}${issue.message}`,
}));
const phaseValue = (value: number | undefined, unit: 'j' | '°C') => finite(value) ? `${number(value, 2)} ${unit}` : unit === 'j' ? 'durée inconnue' : 'température inconnue';
type ProposalRow = { id: string; label: string; text: string; detail?: string; kind?: 'note' };
/** Concrete differences between the trial before and after a proposal; nothing is inferred beyond the patch.
 * A follow-up note appended to a phase is shown as such, never as a changed setpoint. */
function proposalDifferences(before: FermentationTimelineStep[], after: FermentationTimelineStep[], beforeDraft: YeastRecipeDraft, afterDraft: YeastRecipeDraft, strategy: YeastFermentationStrategy): ProposalRow[] {
  const rows: ProposalRow[] = [], matches = matchPhases(before, after);
  const condition = (phase: FermentationTimelineStep) => strategy.phases.find(item => item.kind === phase.kind && item.name === phase.name && !item.preserved)?.condition;
  after.forEach((phase, index) => {
    const was = matches[index] >= 0 ? before[matches[index]] : undefined;
    if (!was) { rows.push({ id: `added-${index}`, label: `Ajouté · ${phase.name}`, text: `${phaseValue(phase.tempC, '°C')} · ${phaseValue(phase.days, 'j')}`, detail: condition(phase) }); return; }
    const parts = [was.tempC !== phase.tempC ? `${phaseValue(was.tempC, '°C')} → ${phaseValue(phase.tempC, '°C')}` : '',
      was.days !== phase.days ? `${phaseValue(was.days, 'j')} → ${phaseValue(phase.days, 'j')}` : ''].filter(Boolean);
    if (parts.length) rows.push({ id: `phase-${index}`, label: phase.name, text: parts.join(' · '), detail: condition(phase) });
    else if ((was.note ?? '') !== (phase.note ?? '')) rows.push({ id: `note-${index}`, label: phase.name, text: 'valeurs conservées · consigne de suivi ajoutée', detail: condition(phase), kind: 'note' });
  });
  before.forEach((phase, index) => { if (!matches.includes(index)) rows.push({ id: `removed-${index}`, label: `Retiré · ${phase.name}`, text: `${phaseValue(phase.tempC, '°C')} · ${phaseValue(phase.days, 'j')}` }); });
  const endBefore = planFermentationTimeline(before).endDay, endAfter = planFermentationTimeline(after).endDay;
  if (rows.some(row => row.kind !== 'note') && endBefore !== endAfter) rows.push({ id: 'end', label: 'Fin de consigne', text: `${endBefore === null ? 'inconnue' : `J${number(endBefore, 2)}`} → ${endAfter === null ? 'inconnue' : `J${number(endAfter, 2)}`}` });
  if (afterDraft.pitchTempC !== beforeDraft.pitchTempC) rows.push({ id: 'pitch', label: 'Température d’ensemencement', text: `${finite(beforeDraft.pitchTempC) ? `${number(beforeDraft.pitchTempC)} °C` : 'à renseigner'} → ${finite(afterDraft.pitchTempC) ? `${number(afterDraft.pitchTempC)} °C` : 'à renseigner'}` });
  if (afterDraft.ferulicRest && !beforeDraft.ferulicRest) rows.push({ id: 'ferulic', label: 'Empâtage', text: 'Repos férulique 44 °C · 15 min ajouté avant la saccharification' });
  return rows;
}
/** A patch naming only the primary temperature or duration edits an explicit programme's primary, never a hidden copy. */
function mergeProposal(base: YeastRecipeDraft, patch: Partial<YeastRecipeDraft>): YeastRecipeDraft {
  const next: YeastRecipeDraft = { ...base, ...patch };
  if (!('programme' in patch) && base.programme !== undefined && (patch.temperatureC !== undefined || patch.days !== undefined)) {
    const at = base.programme.findIndex(phase => phase.kind === 'primaire');
    if (at >= 0) next.programme = editFermentationTimelineStep(base.programme, at, {
      ...(patch.temperatureC !== undefined ? { tempC: patch.temperatureC } : {}), ...(patch.days !== undefined ? { days: patch.days } : {}) });
  }
  if (next.programme !== undefined) { const primary = next.programme.find(phase => phase.kind === 'primaire'); next.temperatureC = primary?.tempC; next.days = primary?.days; }
  return next;
}
const OUTCOME_LABELS: Record<YeastFermentationStrategy['outcome'], string> = { proposed: 'Réglages proposés', unchanged: 'Conduite conservée', 'insufficient-data': 'Données insuffisantes' };
const sameRange = (a?: { min: number; max: number } | null, b?: { min: number; max: number } | null) => !!a && !!b && a.min === b.min && a.max === b.max;

/** Tiny setpoint shape for a folded summary; drawn only when every duration is known. */
function ProgrammeSpark({ steps }: { steps: readonly FermentationTimelineStep[] }) {
  const positions = positionFermentationSteps(steps), end = positions.at(-1)?.end;
  const temps = steps.map(step => step.tempC).filter(finite);
  if (!steps.length || end == null || end <= 0 || !temps.length) return null;
  const low = Math.min(...temps), span = Math.max(...temps) - low || 1, w = 56, h = 18;
  const path = positions.filter(p => finite(p.tempC) && p.start !== null && p.end !== null)
    .map(p => `M${(p.start! / end * w).toFixed(1)} ${(h - 3 - (p.tempC! - low) / span * (h - 6)).toFixed(1)}H${Math.max(p.start! / end * w + 1, p.end! / end * w).toFixed(1)}`).join('');
  return <svg className="yc-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><path d={path} stroke="currentColor" strokeWidth="2.5" fill="none" /></svg>;
}

/** Folded station: the button carries the title and the short state; the body stays mounted to keep partial entries. */
export function StationHeading({ step, title, summary, open, onToggle, controls, fold, headingRef }: {
  step: number; title: string; summary?: ReactNode; open: boolean; onToggle: () => void; controls: string; fold: string; headingRef?: Ref<HTMLHeadingElement>;
}) {
  return <div className="yc-station-heading yc-fold-heading">
    <span className="yc-step-number" aria-hidden="true">{step}</span>
    <h3 ref={headingRef} tabIndex={-1} className="yc-fold-title">
      <button type="button" className="yc-fold-toggle" aria-expanded={open} aria-controls={controls} data-station-toggle={fold} onClick={onToggle}>
        <span className="yc-fold-text"><span className="yc-fold-name">{title}</span>{summary && <span className="yc-fold-summary">{summary}</span>}</span>
        <ChevronDown size={16} aria-hidden="true" className="yc-fold-chevron" />
      </button>
    </h3>
  </div>;
}

export function yeastWarningsForReading(result: YeastRecipeEvaluation): string[] {
  const processExplained = !result.abv.range && result.abv.reasons.some(reason => /acid|culture/i.test(reason));
  const temperatureExplained = result.warnings.some(text => /hors de la plage de conduite/.test(text));
  const wineHypothesisExplained = result.warnings.some(text => text.startsWith('Usage vin/cidre/conditionnement :'));
  return [...new Set([...result.warnings,
    ...result.effects.filter(effect => effect.state === 'warning' && !(effect.id === 'temperature' && temperatureExplained)).map(effect => effect.id === 'dose' ? `Quantité prévue hors du repère fabricant : ${effect.impact}.` : effect.impact)
  ])].filter(text => !text.startsWith('Souche non identifiée') && !text.startsWith('Fenêtre de température absente') && !text.startsWith('Usage non documenté pour cette famille') &&
    !(wineHypothesisExplained && text.startsWith('Usage vin, cidre')) &&
    !(processExplained && /^(Fermentation acidulée ou culture spécialisée|Procédé acidulé à préciser)/.test(text)));
}

export function YeastProjectionReading({ result }: { result: YeastRecipeEvaluation }) {
  const attenuation = result.projection?.attenuation;
  return <section className="yc-projection" aria-label="Aperçu de la fermentation de cette recette">
    <div className="yc-projection-title"><h4>Dans cette recette</h4><span className="yeast-small">Estimation</span></div>
    <dl className="yc-projection-values"><div><dt>Densité finale · SG</dt><dd>{projectionRange(result.fg.range, 3)}</dd></div>
      <div><dt>Alcool · % vol</dt><dd>{projectionRange(result.abv.range, 1)}</dd></div></dl>
    {attenuation && <p className="yeast-small">Atténuation {number(attenuation.range.min, 20)}{attenuation.range.max !== attenuation.range.min ? `–${number(attenuation.range.max, 20)}` : ''} % · {attenuation.basis === 'measured' ? 'retour mesuré' : attenuation.basis === 'recipe' ? 'hypothèse de recette' : 'donnée annoncée'}.</p>}
    {!result.fg.range && <p className="yeast-notice">{result.fg.reasons[0]}</p>}
    {!result.abv.range && result.abv.reasons[0] !== result.fg.reasons[0] && <p className="yeast-notice">{result.abv.reasons[0]}</p>}
  </section>;
}

/** Sequence of known contacts, not a claimed biochemical response or a kinetic curve. */
function Contacts({ recipe }: { recipe: TrialRecipe }) {
  const primary = recipe.fermentation?.find(step => step.kind === 'primaire');
  const contacts = yeastRecipeHopSummary(recipe);
  return <section className="yc-contacts" aria-label="Conduite et contacts des houblons">
    <h4>Levure et houblons dans la recette</h4>
    <ol className="yc-contact-sequence">
      <li><strong>Départ</strong><span>{Number.isFinite(recipe.yeast.pitchTempC) ? `${number(recipe.yeast.pitchTempC)} °C` : 'Température à renseigner'}</span></li>
      <li><strong>Fermentation</strong><span>{number(primary?.tempC)} °C · {number(primary?.days)} j</span><span>{number(contacts.activeG)} g à cru</span></li>
      <li><strong>Après</strong><span>{number(contacts.postG)} g à cru</span></li>
    </ol>
    {!!contacts.additions.length && <table className="yc-contact-table"><caption className="sr-only">Contacts de houblon prévus</caption><thead><tr><th>Ajout / phase</th><th>Dose</th><th>Contact</th></tr></thead><tbody>
      {contacts.additions.map((hop, i) => <tr key={i}><th scope="row">{hop.name}<span className="yeast-small">{hop.phase === 'active' ? 'Active' : hop.phase === 'post' ? 'Après fermentation' : 'Phase à préciser'}{hop.dayOffset != null ? ` · J+${number(hop.dayOffset)}` : ''}</span></th><td>{number(hop.doseGL)} g/L</td><td>{number(hop.contactHours)} h<br />{number(hop.temperatureC)} °C</td></tr>)}
    </tbody></table>}
    <p className="yeast-small">Ordre des phases, jours indicatifs. La fin de fermentation se confirme à la densité, après le dernier houblonnage.</p>
  </section>;
}

/** Recipe creation only. Every local setting belongs to a proposal until one atomic apply.
 * The local programme is the single truth for chart, phase fields, Paliers list and Apply. */
export function YeastRecipePlan({ recipe, refs, onChange, onCompare, onGoal, initialGoal, initialYeastId, initialForm, initialProgramme, trialYeast, onProgrammeChange, onIncompleteChange, onApplied, onDiscard, goalSlot, conductStep = 3, conductRequest, pitchRequest, onNavigate, onEditFacts, onEditObjectives }: {
  recipe: TrialRecipe; refs: YeastReference[]; onChange: (value: TrialRecipe) => TrialRecipe | void;
  onCompare: () => void; onGoal: (goal: YeastRecipeGoal, explicit: boolean) => void; initialGoal?: YeastRecipeGoal; initialYeastId?: string;
  initialForm?: YeastRecipeDraft['form']; initialProgramme?: FermentationTimelineStep[]; trialYeast?: YeastSpec; onProgrammeChange?: (programme?: FermentationTimelineStep[]) => void;
  onIncompleteChange?: (incomplete: boolean) => void;
  onApplied?: () => void; onDiscard?: () => void;
  /** Stable container of the shared « Objectifs » station. Undefined renders the profile in this plan. */
  goalSlot?: HTMLElement | null;
  /** Visible number of the conduct station: 2 while the parent shows no Objectives station, so no step reads as missing. */
  conductStep?: number;
  /** Incremented by the parent to open the conduct from a folded summary. */
  conductRequest?: number;
  /** Incremented by the parent to reach the pitch temperature field, e.g. after a strain change. */
  pitchRequest?: number;
  onNavigate?: (destination: 'identite' | 'fermentescibles' | 'houblons' | 'paliers' | 'eau') => void;
  onEditFacts?: () => void;
  onEditObjectives?: () => void;
}) {
  const id = useId(), key = recipeKey(recipe);
  const conductHeading = useRef<HTMLHeadingElement>(null);
  const goalControl = useRef<HTMLSelectElement>(null);
  const proposalPanel = useRef<HTMLElement>(null);
  const applyButton = useRef<HTMLButtonElement>(null);
  const [local, setLocal] = useState(() => {
    const draft = createYeastRecipeDraft(recipe, refs, undefined, initialYeastId);
    const carriedPrimary = initialProgramme?.find(phase => phase.kind === 'primaire');
    return { key, draft: { ...draft, ...(initialGoal ? { goal: initialGoal, goalExplicit: true } : {}),
      ...(initialYeastId ? { form: initialForm ?? draft.form, formYeastId: initialYeastId } : {}),
      ...(initialProgramme ? { programme: initialProgramme.map(phase => ({ ...phase })), temperatureC: carriedPrimary?.tempC, days: carriedPrimary?.days } : {}) } };
  });
  const [scheduleBase, setScheduleBase] = useState(() => ({ key, steps: initialProgramme ? recipe.fermentation ?? [] : programmeForDraft(recipe, local.draft) }));
  const initialPhaseIndex = (recipe.fermentation ?? []).findIndex(phase => phase.kind === 'primaire');
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(initialPhaseIndex < 0 ? 0 : initialPhaseIndex);
  const [goalChoice, setGoalChoice] = useState<YeastRecipeGoal | ''>(local.draft.goalExplicit ? local.draft.goal : '');
  // A programme carried across a strain change is local work to review, unless it equals the draft's paliers.
  const [edited, setEdited] = useState(!!initialGoal || !!initialYeastId
    || (!!initialProgramme && programmeKey(initialProgramme) !== programmeKey(recipe.fermentation ?? [])));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [rationale, setRationale] = useState('');
  const [strategy, setStrategy] = useState<YeastFermentationStrategy>();
  const [proposalRows, setProposalRows] = useState<ProposalRow[]>([]);
  const [beforeProposal, setBeforeProposal] = useState<{ key: string; draft: YeastRecipeDraft }>();
  // `series` groups successive key presses on one axis of one phase under a single undo.
  const [lastEdit, setLastEdit] = useState<{ key: string; label: string; before: FermentationTimelineStep[]; after: string; series?: string }>();
  const [editNotice, setEditNotice] = useState('');
  const [newPhaseKind, setNewPhaseKind] = useState<FermentationTimelineStep['kind']>('garde');
  // Stations open folded; a tried candidate or a carried programme needs its conduct in view.
  const [goalOpen, setGoalOpen] = useState(false);
  const [conductOpen, setConductOpen] = useState(!!initialYeastId || !!initialProgramme);
  useEffect(() => {
    if (trialYeast?.hopIndexId === local.draft.yeastId && trialYeast.form !== local.draft.form) {
      setLocal(previous => ({ ...previous, draft: { ...previous.draft, form: trialYeast.form, formYeastId: previous.draft.yeastId, quantityG: undefined } }));
    }
  }, [trialYeast?.hopIndexId, trialYeast?.form]);
  const previousTrialAttenuation = useRef<{ id?: string; value?: number; basis?: YeastSpec['attenuationBasis'] } | undefined>(undefined);
  useEffect(() => {
    const before = previousTrialAttenuation.current;
    previousTrialAttenuation.current = { id: trialYeast?.hopIndexId, value: trialYeast?.attenuationPct, basis: trialYeast?.attenuationBasis };
    if (trialYeast?.hopIndexId !== local.draft.yeastId) return;
    if (trialYeast.attenuationBasis === 'recipe') {
      setLocal(previous => ({ ...previous, draft: { ...previous.draft, attenuationPct: trialYeast.attenuationPct,
        attenuationBasis: 'recipe', attenuationYeastId: previous.draft.yeastId } }));
    } else if (before?.id === trialYeast.hopIndexId && before.basis === 'recipe') {
      // A source-backed replacement removes the former dossier hypothesis,
      // unless the brewer separately changed the scenario control.
      setLocal(previous => previous.draft.attenuationBasis === 'recipe' && previous.draft.attenuationPct === before.value
        ? { ...previous, draft: { ...previous.draft, attenuationPct: undefined, attenuationBasis: undefined } } : previous);
    }
  }, [trialYeast?.hopIndexId, trialYeast?.attenuationPct, trialYeast?.attenuationBasis]);
  const currentDraft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  // Local reference enrichment may finish on mount. Only a trial the brewer
  // has actually edited needs stale protection; a pristine one follows reality.
  const draft = !edited && local.key !== key ? currentDraft : local.draft;
  const stale = edited && local.key !== key;
  const trialIdentityInvalid = !!trialYeast && trialYeast.hopIndexId !== draft.yeastId;
  const trialRangeInvalid = !!trialYeast && trialYeast.fermTempMinC != null && trialYeast.fermTempMaxC != null && trialYeast.fermTempMinC > trialYeast.fermTempMaxC;
  const current = useMemo(() => evaluateYeastRecipeDesign(recipe, currentDraft, refs), [recipe, currentDraft, refs]);
  const result = useMemo(() => evaluateYeastRecipeDesign(recipe, draft, refs, trialYeast), [recipe, draft, refs, trialYeast]);
  const programme = programmeForDraft(recipe, draft);
  const incomplete = draft.programme !== undefined && !isCompleteYeastRecipeProgramme(draft.programme);
  const issues = incomplete ? programmeIssues(programme) : [];
  // Without any strain, existing paliers stay readable and editable locally; the choice itself is asked in station 1,
  // so its missing identity neither forces this station open nor reads as a conduct error.
  const identityPending = !recipe.yeast.name?.trim() && !draft.yeastId;
  const identityMessages = new Set(result.problems.filter(problem => problem.code === 'identity.required').map(problem => problem.message));
  const shownErrors = identityPending ? result.errors.filter(text => !identityMessages.has(text)) : result.errors;
  const blocking = shownErrors.length > 0;
  // A blocking state opens the conduct; it never stays hidden behind the fold.
  useEffect(() => { if (blocking || stale) setConductOpen(true); }, [blocking, stale]);
  useEffect(() => { onIncompleteChange?.(incomplete); }, [incomplete]);
  // Requests are counters kept by the parent: a remount (strain change) must not replay an old one and steal the focus.
  const handledConductRequest = useRef(conductRequest);
  const handledPitchRequest = useRef(pitchRequest);
  useEffect(() => {
    if (!conductRequest || conductRequest === handledConductRequest.current) return;
    handledConductRequest.current = conductRequest;
    setConductOpen(true);
    requestAnimationFrame(() => { conductHeading.current?.focus({ preventScroll: true }); conductHeading.current?.scrollIntoView({ block: 'start' }); });
  }, [conductRequest]);
  const styleGoals = YEAST_STYLE_FAMILIES.find(style => style.id === draft.styleId)?.goals ?? ['balanced' as const];
  const otherGoals = (Object.keys(YEAST_RECIPE_GOAL_LABELS) as YeastRecipeGoal[]).filter(goal => !styleGoals.includes(goal));
  const patch = (value: Partial<YeastRecipeDraft>) => {
    if (stale) { setError('La recette a changé. Reprends les données actuelles avant de modifier cet essai.'); return; }
    let nextDraft: YeastRecipeDraft = { ...draft, ...value };
    let nextProgramme: FermentationTimelineStep[] | undefined;
    if ('programme' in value) nextProgramme = value.programme;
    else if ('temperatureC' in value || 'days' in value) {
      if (draft.programme !== undefined) {
        // An explicit programme owns its primary: complementary fields edit it through the same pure operation.
        const at = draft.programme.findIndex(phase => phase.kind === 'primaire');
        if (at >= 0) nextProgramme = editFermentationTimelineStep(draft.programme, at, {
          ...('temperatureC' in value ? { tempC: value.temperatureC } : {}), ...('days' in value ? { days: value.days } : {}) });
      } else {
        // A lone temperature does not freeze an empty programme: the primary appears once both values exist.
        const derived = programmeForDraft(recipe, nextDraft);
        if (derived.some(phase => phase.kind === 'primaire')) nextProgramme = derived;
      }
    }
    if (nextProgramme !== undefined) {
      const primary = nextProgramme.find(phase => phase.kind === 'primaire');
      nextDraft = { ...nextDraft, programme: nextProgramme.map(phase => ({ ...phase })), temperatureC: primary?.tempC, days: primary?.days };
    }
    setLocal({ key: edited ? local.key : key, draft: nextDraft });
    if (nextProgramme !== undefined) onProgrammeChange?.(nextDraft.programme);
    setEdited(true); setNotice(''); setError('');
  };
  /** Chart gestures, exact fields and add/remove all land here: one programme, one undo.
   * A key series on one axis of one phase keeps the value before its first press, so one undo restores it exactly. */
  const commitProgramme = (next: FermentationTimelineStep[], label: string, series?: { id: string; index: number }) => {
    if (stale) { setError('La recette a changé. Reprends les données actuelles avant de modifier les paliers.'); return; }
    if (scheduleBase.key !== key) setScheduleBase({ key, steps: programme });
    const continues = !!series && !!lastEdit && lastEdit.key === key && lastEdit.series === series.id && lastEdit.after === programmeKey(programme);
    const before = continues ? lastEdit!.before : programme.map(phase => ({ ...phase }));
    setLastEdit({ key, label: continues ? describeFermentationEdit(before, next, series!.index) : label, before, after: programmeKey(next), series: series?.id });
    setEditNotice('');
    patch({ programme: next });
  };
  const changePhase = (index: number, values: Partial<FermentationTimelineStep>) => {
    const next = editFermentationTimelineStep(programme, index, values);
    if (programmeKey(next) === programmeKey(programme)) return;
    commitProgramme(next, describeFermentationEdit(programme, next, index));
  };
  const insertPhase = (afterIndex: number, kind: FermentationTimelineStep['kind']) => {
    const option = PHASE_KINDS.find(item => item.kind === kind) ?? PHASE_KINDS[2];
    const next = insertFermentationTimelineStep(programme, afterIndex, { kind: option.kind, name: option.name });
    commitProgramme(next, `Palier ${afterIndex + 2} · ${option.name} ajouté${afterIndex < 0 ? ' à J0' : ''} : température et durée à renseigner`);
    setSelectedPhaseIndex(afterIndex + 1); setConductOpen(true);
    requestAnimationFrame(() => (document.getElementById(`${id}-phase-${afterIndex + 1}-tempC`) as HTMLInputElement | null)?.focus());
  };
  const removePhase = (index: number) => {
    if (!programme[index]) return;
    const next = removeFermentationTimelineStep(programme, index);
    commitProgramme(next, `Palier ${index + 1} · ${programme[index].name} supprimé ; les autres durées sont conservées`);
    setSelectedPhaseIndex(Math.max(0, Math.min(index, next.length - 1)));
  };
  const lastEditCurrent = !!lastEdit && lastEdit.key === key && lastEdit.after === programmeKey(programme);
  const undoLastEdit = () => {
    if (!lastEdit || !lastEditCurrent) return;
    const label = lastEdit.label;
    patch({ programme: lastEdit.before });
    setLastEdit(undefined); setEditNotice(`Réglage annulé : ${label}`);
  };
  const propose = () => {
    if (stale) { setError('La recette a changé. Reprends les données actuelles avant de proposer une conduite.'); return; }
    if (!goalChoice) return;
    const goal = goalChoice;
    const base = { ...draft, goal, goalExplicit: true };
    const suggestion = proposeYeastFermentationStrategy(recipe, base, refs, trialYeast);
    const proposedDraft = mergeProposal(base, suggestion.patch);
    const beforeSteps = programmeForDraft(recipe, base), afterSteps = programmeForDraft(recipe, proposedDraft);
    setBeforeProposal({ key, draft: structuredClone(base) });
    setScheduleBase({ key, steps: afterSteps });
    const proposedPrimary = afterSteps.findIndex(phase => phase.kind === 'primaire');
    setSelectedPhaseIndex(proposedPrimary < 0 ? 0 : proposedPrimary);
    setLocal({ key, draft: proposedDraft });
    onProgrammeChange?.(afterSteps);
    setEdited(true); setConductOpen(true); setLastEdit(undefined); setEditNotice('');
    setRationale(suggestion.rationale); setStrategy(suggestion); setProposalRows(proposalDifferences(beforeSteps, afterSteps, base, proposedDraft, suggestion));
    onGoal(goal, true); setGoalChoice(goal);
    setNotice(''); setError('');
    requestAnimationFrame(() => { proposalPanel.current?.focus({ preventScroll: true }); proposalPanel.current?.scrollIntoView({ block: 'start' }); });
  };
  const clearProposal = () => { setRationale(''); setStrategy(undefined); setProposalRows([]); setBeforeProposal(undefined); setLastEdit(undefined); setEditNotice(''); };
  const reset = () => { setLocal({ key, draft: currentDraft }); setScheduleBase({ key, steps: programmeForDraft(recipe, currentDraft) }); onProgrammeChange?.(undefined); onIncompleteChange?.(false); setGoalChoice(currentDraft.goalExplicit ? currentDraft.goal : ''); setEdited(false); setNotice('Essai annulé. Le brouillon reste inchangé.'); setError(''); clearProposal(); onGoal(currentDraft.goal, currentDraft.goalExplicit !== false); onDiscard?.(); requestAnimationFrame(() => conductHeading.current?.focus()); };
  const resumeCurrent = () => { setLocal({ key, draft: currentDraft }); setScheduleBase({ key, steps: programmeForDraft(recipe, currentDraft) }); onProgrammeChange?.(undefined); setGoalChoice(currentDraft.goalExplicit ? currentDraft.goal : ''); setEdited(false); clearProposal(); onGoal(currentDraft.goal, currentDraft.goalExplicit !== false); };
  /** Explicit rebase after a draft change (e.g. the quantity entered for a new strain): every setting is read again
   * from the draft, only the local paliers are kept as entered, unknown values included. Nothing is applied. */
  const resumeKeepingProgramme = () => {
    const fresh = createYeastRecipeDraft(recipe, refs, undefined, initialYeastId);
    const base = initialYeastId ? { ...fresh, form: trialYeast?.form ?? initialForm ?? fresh.form, formYeastId: initialYeastId } : fresh;
    const kept = draft.programme?.map(phase => ({ ...phase }));
    const primary = kept?.find(phase => phase.kind === 'primaire');
    setLocal({ key, draft: kept ? { ...base, programme: kept, temperatureC: primary?.tempC, days: primary?.days } : base });
    setScheduleBase({ key, steps: recipe.fermentation ?? [] });
    onProgrammeChange?.(kept);
    setGoalChoice(base.goalExplicit ? base.goal : '');
    setEdited(!!initialYeastId || (!!kept && programmeKey(kept) !== programmeKey(recipe.fermentation ?? [])));
    clearProposal(); onGoal(base.goal, base.goalExplicit !== false);
    setError(''); setEditNotice('Données actuelles reprises · paliers de l’essai conservés, non appliqués.');
  };
  const restoreBeforeProposal = () => {
    if (!beforeProposal) return;
    if (stale || beforeProposal.key !== key) { setError('Cet essai ne correspond plus aux données actuelles. Reprends la recette avant de poursuivre.'); return; }
    setLocal({ key, draft: beforeProposal.draft }); setScheduleBase({ key, steps: programmeForDraft(recipe, beforeProposal.draft) });
    onProgrammeChange?.(beforeProposal.draft.programme); setGoalChoice(beforeProposal.draft.goalExplicit ? beforeProposal.draft.goal : '');
    onGoal(beforeProposal.draft.goal, beforeProposal.draft.goalExplicit !== false); clearProposal();
  };
  const apply = () => {
    try {
      if (stale) throw Error('La recette ou les données de la souche ont changé. Reprends leur état actuel avant d’appliquer.');
      if (trialIdentityInvalid) throw Error('La fiche de l’essai ne correspond plus à la souche sélectionnée. Reprends ce candidat.');
      if (trialRangeInvalid) throw Error('La température minimale de la fiche dépasse la maximale. Corrige la fiche avant d’appliquer.');
      if (incomplete) throw Error('Complète les températures et durées du programme avant de l’appliquer.');
      const base = applyYeastRecipeDesign(recipe, draft, refs, 'settings');
      const next = completeYeastRecipeDesignApplication(base, withTrialYeast(base, trialYeast, draft).yeast);
      const accepted = onChange(next) || next;
      const acceptedDraft = createYeastRecipeDraft(accepted, refs);
      setLocal({ key: recipeKey(accepted), draft: acceptedDraft }); setGoalChoice(acceptedDraft.goalExplicit ? acceptedDraft.goal : '');
      setScheduleBase({ key: recipeKey(accepted), steps: programmeForDraft(accepted, acceptedDraft) });
      onProgrammeChange?.(undefined);
      onIncompleteChange?.(false);
      setEdited(false); clearProposal();
      setNotice('Essai appliqué au brouillon. Enregistre la recette pour le conserver.'); setError('');
      onGoal(acceptedDraft.goal, acceptedDraft.goalExplicit !== false);
      onApplied?.();
      requestAnimationFrame(() => conductHeading.current?.focus());
    } catch (e) { setError(e instanceof Error ? e.message : 'Vérifie les valeurs du scénario.'); }
  };
  let preview: TrialRecipe = recipe, basePreview: TrialRecipe = recipe;
  try { if (!result.errors.length) { basePreview = applyYeastRecipeDesign(recipe, draft, refs, 'settings'); preview = withTrialYeast(basePreview, trialYeast, draft); } } catch { /* Visible validation below. */ }
  const factFields = [
    ['lab', 'Laboratoire'], ['strain', 'Code de souche'], ['form', 'Forme'], ['attenuationPct', 'Atténuation annoncée'],
    ['fermTempMinC', 'Température mini publiée'], ['fermTempMaxC', 'Température maxi publiée'],
    ['alcoholTolerancePct', 'Tolérance alcoolique'], ['flocculation', 'Floculation'], ['fermentDays', 'Durée indicative de fiche'],
    ['technicalSource', 'Référence de fiche'],
  ] as const;
  const factChanges: { field: string; label: string; before: string; after: string }[] = basePreview === recipe ? [] : factFields.flatMap(([field, label]) =>
    JSON.stringify(basePreview.yeast[field]) === JSON.stringify(preview.yeast[field]) ? []
      : [{ field, label, before: factValue(field, basePreview.yeast[field]), after: factValue(field, preview.yeast[field]) }]);
  const beforeFacts = basePreview.yeast.technicalFacts ?? [], afterFacts = preview.yeast.technicalFacts ?? [];
  const addedFacts = basePreview === recipe ? [] : afterFacts.filter(fact => !beforeFacts.some(before => factSignature(before) === factSignature(fact)));
  const removedFacts = basePreview === recipe ? [] : beforeFacts.filter(fact => !afterFacts.some(after => factSignature(after) === factSignature(fact)));
  if (addedFacts.length || removedFacts.length) factChanges.push({ field: 'technicalFacts', label: 'Observations documentaires',
    before: `${beforeFacts.length} observation${beforeFacts.length === 1 ? '' : 's'}`,
    after: `${addedFacts.length} ajoutée${addedFacts.length === 1 ? '' : 's'} · ${removedFacts.length} retirée${removedFacts.length === 1 ? '' : 's'}` });
  if (basePreview !== recipe && JSON.stringify(basePreview.yeast.documentaryNotes) !== JSON.stringify(preview.yeast.documentaryNotes)) {
    factChanges.push({ field: 'documentaryNotes', label: 'Notes documentaires',
      before: documentaryNotesText(basePreview.yeast.documentaryNotes), after: documentaryNotesText(preview.yeast.documentaryNotes) });
  }
  const documentaryKeys: Record<string, string> = { form: 'form', attenuationPct: 'attenuation', fermTempMinC: 'temperature',
    fermTempMaxC: 'temperature', alcoholTolerancePct: 'alcoholTolerance', flocculation: 'flocculation', fermentDays: 'fermentationTime' };
  // Documentary ranges the trial really carries into the draft, even when no scalar moved.
  const selectionChanges = basePreview === recipe ? [] : DOCUMENTARY_SELECTIONS.flatMap(([key, label, unit]) => {
    const selection = preview.yeast.technicalSelections?.[key];
    return selection && JSON.stringify(selection) !== JSON.stringify(basePreview.yeast.technicalSelections?.[key])
      ? [{ key, label, text: selectionText(selection, unit), source: selection.source, sourceUrl: selection.sourceUrl }] : [];
  });
  const relevantKeys = new Set([...factChanges.map(change => documentaryKeys[change.field]), ...selectionChanges.map(change => change.key)].filter(Boolean));
  const relevantSources = [...new Map(preview.yeast.technicalFacts?.filter(fact =>
    (relevantKeys.has(fact.key) || addedFacts.some(added => factSignature(added) === factSignature(fact))) &&
    (fact.sourceUrl || fact.source)).map(fact => [fact.sourceUrl ?? fact.source, fact]) ?? []).values()];
  const sourceTitle = (source?: string) => source?.replace(/https?:\/\/\S+/g, '').replace(/[\s·—–-]+$/g, '').trim() || 'fiche publiée';
  const realChangeCount = result.changes.length + factChanges.length + selectionChanges.length;
  const cells = calculateYeastCellRequirement({ volumeL: recipe.volumeL, og: result.projection?.og ?? recipe.ogTarget,
    pitchRateMillionPerMlPlato: draft.pitchRateMillionPerMlPlato, viableCellsBillion: draft.viableCellsBillion });
  const warnings = yeastWarningsForReading(result);
  const primaryPhase = programme.find(phase => phase.kind === 'primaire');
  const mainTemperature = primaryPhase ? primaryPhase.tempC : draft.temperatureC;
  const mainDays = primaryPhase ? primaryPhase.days : draft.days;
  const explicitWithoutPrimary = draft.programme !== undefined && !primaryPhase;
  const programmeBaseline = matchPhases(recipe.fermentation ?? [], programme).map(at => at >= 0 ? (recipe.fermentation ?? [])[at] : undefined);
  const positions = positionFermentationSteps(programme);
  const recipeEnd = positionFermentationSteps(recipe.fermentation ?? []).at(-1)?.end ?? null;
  const trialEnd = positions.at(-1)?.end ?? null;
  const baseProgramme = scheduleBase.key === key ? scheduleBase.steps : programmeForDraft(recipe, currentDraft);
  const basePositions = positionFermentationSteps(baseProgramme);
  const matchingBasePositions = matchPhases(baseProgramme, programme).map(at => at >= 0 ? basePositions[at] : undefined);
  const baselineName = strategy ? 'proposition' : 'brouillon';
  const baselinePhrase = strategy ? 'à la proposition avant ce réglage' : 'au brouillon avant l’essai';
  const totalDays = programme.length > 0 && trialEnd !== null ? trialEnd : undefined;
  const dateText = (position: PositionedFermentationStep) => position.start === null
    ? 'J début inconnu · J fin inconnue'
    : position.end === null
      ? `J début ${number(position.start)} · J fin inconnue`
      : `J début ${number(position.start)} · J fin ${number(position.end)}`;
  const phaseShift = (index: number) => {
    const currentStart = positions[index]?.start, baseStart = matchingBasePositions[index]?.start;
    if (currentStart == null || baseStart == null) return undefined;
    const shift = currentStart - baseStart;
    return Math.abs(shift) < 1e-9 ? undefined : `Décalé ${shift > 0 ? '+' : ''}${number(shift)} j vs ${baselineName}`;
  };
  const followingShift = (index: number) => {
    if (index >= positions.length - 1) return 'Dernier palier · aucun décalage des suivants.';
    const readings = positions.slice(index + 1).map((position, offset) => {
      const at = index + 1 + offset, baseStart = matchingBasePositions[at]?.start, currentStart = position.start;
      if (currentStart === null) return `${position.name} : jour de début inconnu`;
      if (baseStart === null || baseStart === undefined) return `${position.name} : début J${number(currentStart)}, sans phase correspondante ${baselinePhrase}`;
      const shift = currentStart - baseStart;
      return `${position.name} : J${number(baseStart)} → J${number(currentStart)} (${shift > 0 ? '+' : ''}${number(shift)} j)`;
    });
    return `Jours de début suivants vs ${baselineName} · ${readings.join(' ; ')}.`;
  };
  const conditionFor = (phase: FermentationTimelineStep) => strategy?.phases.find(item => item.kind === phase.kind && item.name === phase.name)?.condition ?? phase.note;
  const activePhaseIndex = positions.length ? Math.min(Math.max(0, selectedPhaseIndex), positions.length - 1) : -1;
  const activePosition = activePhaseIndex >= 0 ? positions[activePhaseIndex] : undefined;
  const activePhase = activePhaseIndex >= 0 ? programme[activePhaseIndex] : undefined;
  const restorePhase = (index: number) => {
    const before = programmeBaseline[index];
    if (!programme[index]) return;
    const next = before ? editFermentationTimelineStep(programme, index, { tempC: before.tempC, days: before.days })
      : removeFermentationTimelineStep(programme, index);
    if (!before) {
      setSelectedPhaseIndex(Math.max(0, Math.min(index, next.length - 1)));
      setStrategy(undefined); setRationale(''); setProposalRows([]);
      setScheduleBase({ key, steps: recipe.fermentation ?? [] });
    }
    setLastEdit({ key, label: before ? `Palier ${index + 1} · ${programme[index].name} rétabli comme dans le brouillon` : `Palier ${index + 1} · ${programme[index].name} ajouté puis retiré`,
      before: programme.map(phase => ({ ...phase })), after: programmeKey(next) });
    setEditNotice('');
    patch({ programme: next });
  };
  const selectPhase = (index: number, keyboard = false) => {
    setSelectedPhaseIndex(index);
    if (keyboard) requestAnimationFrame(() => (document.getElementById(`${id}-phase-${index}-days`) as HTMLInputElement | null)?.focus());
  };
  const goToIssue = (issue: ProgrammeIssue) => {
    setConductOpen(true);
    const index = issue.index;
    if (index === undefined) return;
    setSelectedPhaseIndex(index);
    requestAnimationFrame(() => {
      const input = document.getElementById(`${id}-phase-${index}-${issue.field ?? 'tempC'}`) as HTMLInputElement | null;
      const details = input?.closest('details');
      if (details) details.open = true;
      input?.scrollIntoView({ block: 'center' }); input?.focus({ preventScroll: true });
    });
  };
  const focusControl = (suffix: string) => {
    setConductOpen(true);
    requestAnimationFrame(() => {
      const control = document.getElementById(`${id}-${suffix}`);
      let parent = control?.parentElement;
      while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
      control?.scrollIntoView({ block: 'center' }); control?.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    if (!pitchRequest || pitchRequest === handledPitchRequest.current) return;
    handledPitchRequest.current = pitchRequest;
    focusControl('pitch');
  }, [pitchRequest]);
  const correctProblem = (problem: YeastRecipeProblem) => {
    if (problem.section === 'programme') {
      if (problem.index === -1 && draft.programme !== undefined) { insertPhase(-1, 'primaire'); return; }
      if (problem.property === 'programme' && problem.index != null && problem.index >= 0) {
        goToIssue({ index: problem.index, field: problem.field as ProgrammeIssue['field'], text: problem.message }); return;
      }
      focusControl(problem.property === 'days' ? 'days' : 'temp'); return;
    }
    if (problem.section === 'mash') { onNavigate?.(problem.property === 'fermentables' ? 'fermentescibles' : 'paliers'); return; }
    if (problem.section === 'objectives') { setGoalOpen(true); onEditObjectives?.(); requestAnimationFrame(() => goalControl.current?.focus()); return; }
    if (problem.section === 'identity') { (problem.property.startsWith('yeast.technicalFacts') || problem.property === 'form' ? onEditFacts ?? onCompare : onCompare)(); return; }
    if (problem.property === 'cultureRoles' && problem.index != null) { focusControl(`culture-${problem.index}-${problem.field ?? 'name'}`); return; }
    const controls: Record<string, string> = { attenuationPct: 'att', pressureBar: 'pressure', process: 'process',
      pitchTempC: 'pitch', quantityG: 'grams', pitchRateMillionPerMlPlato: 'rate', viableCellsBillion: 'cells' };
    if (controls[problem.property]) focusControl(controls[problem.property]);
  };
  const goToDecision = () => requestAnimationFrame(() => {
    const target = applyButton.current && !applyButton.current.disabled ? applyButton.current : document.getElementById(`${id}-decision-title`);
    target?.scrollIntoView({ block: 'center' }); target?.focus({ preventScroll: true });
  });
  // A new strain inherits neither quantity nor pitch temperature: both are
  // revalidated next to Apply, never guessed from the fermentation range.
  const previousStrain = current.candidate?.label || recipe.yeast.name || 'souche non renseignée';
  const previousProduct = recipe.yeast.name || previousStrain;
  const trialStrain = result.candidate?.label || recipe.yeast.name || 'souche à choisir';
  const strainChanged = draft.yeastId !== currentDraft.yeastId;
  const previousQuantity = Number.isFinite(recipe.yeast.qty)
    ? `${number(recipe.yeast.qty)} ${recipe.yeast.unit || 'unité à préciser'}` : undefined;
  const trialQuantity = Number.isFinite(draft.quantityG) ? `${number(draft.quantityG)} g` : undefined;
  const trialForm = draft.form ?? result.candidate?.form ?? (strainChanged ? undefined : recipe.yeast.form);
  const priorityChanges = result.changes.filter(change => ['yeast', 'form', 'goal', 'programme-0', 'programme-1'].includes(change.id));
  const headlineChanges = (priorityChanges.length ? priorityChanges : result.changes).slice(0, 5);
  const hiddenChangeCount = result.changes.length - headlineChanges.length;
  const intentOnly = result.changes.length > 0 && result.changes.every(change => change.id === 'goal') && !factChanges.length && !selectionChanges.length;
  const projectionUnchanged = sameRange(current.fg.range, result.fg.range) && sameRange(current.abv.range, result.abv.range);
  const otherErrors = shownErrors.filter(text => !(incomplete && text.startsWith('Programme incomplet')));
  const problemGroups = [...new Set(otherErrors)].map(message => ({ message,
    problems: result.problems.filter(problem => problem.message === message) }));
  const proposedValues = proposalRows.some(row => row.kind !== 'note');
  const draftGoal: YeastRecipeGoal | '' = currentDraft.goalExplicit ? currentDraft.goal : '';
  const goalName = (goal: YeastRecipeGoal | '') => goal ? YEAST_RECIPE_GOAL_LABELS[goal] : 'aucun';
  const pitchField = (hint?: string) => <div className="yeast-setting-line"><label htmlFor={`${id}-pitch`}>Température d’ensemencement{hint && <span className="yeast-small block">{hint}</span>}</label><NumberInput id={`${id}-pitch`} disabled={stale} aria-label="Température d’ensemencement du scénario" value={draft.pitchTempC} emptyValue={undefined} onValue={pitchTempC => patch({ pitchTempC })} placeholder="À renseigner" /><span>°C</span></div>;
  const addPrimaryButton = <button type="button" className="yeast-link" onClick={() => insertPhase(-1, 'primaire')}>Ajouter une primaire à J0</button>;

  const profileBlock = <div className="yc-objective" role="group" aria-labelledby={`${id}-profile-title`}>
    <div className="yc-objective-head"><h4 id={`${id}-profile-title`}>Profil de fermentation</h4><span className="yc-scope">Conduite · paliers</span></div>
    <p className="yeast-small">Oriente la conduite proposée et le classement des souches. Ne change ni malts, ni houblons, ni atténuation ; le choisir seul ne déplace aucun palier.</p>
    <div className="yc-goal-row"><label htmlFor={`${id}-goal`}>Profil recherché</label>
      <select ref={goalControl} id={`${id}-goal`} disabled={stale} value={goalChoice} onChange={e => { const chosen = e.target.value as YeastRecipeGoal | ''; const neutral = styleGoals[0]; setGoalChoice(chosen); patch(chosen ? { goal: chosen, goalExplicit: true } : { goal: neutral, goalExplicit: false }); onGoal(chosen || neutral, !!chosen); }}>
        <option value="">Aucun objectif exprimé</option>
        <optgroup label="Repères pour cette famille">{styleGoals.map(goal => <option key={goal} value={goal}>{YEAST_RECIPE_GOAL_LABELS[goal]}</option>)}</optgroup>
        {otherGoals.length > 0 && <optgroup label="Autres objectifs à documenter">{otherGoals.map(goal => <option key={goal} value={goal}>{YEAST_RECIPE_GOAL_LABELS[goal]}</option>)}</optgroup>}
      </select><button type="button" disabled={!goalChoice || stale} onClick={propose}>Proposer une conduite</button>
    </div>
    {goalChoice !== draftGoal && <p className="yeast-small" data-goal-change>Brouillon : {goalName(draftGoal)} → essai : {goalName(goalChoice)} · non appliqué</p>}
  </div>;
  const conductSummary = <>
    <ProgrammeSpark steps={programme} />
    <span>{programme.length ? `${plural(programme.length, 'palier')} · ${trialEnd === null ? 'fin inconnue' : `fin J${number(trialEnd)}`}` : 'Aucun palier'}</span>
    <span className="yc-chip" data-tone={edited ? 'trial' : undefined}>{edited ? `Essai · ${plural(realChangeCount, 'changement')}` : 'Brouillon'}</span>
    {issues.length > 0 ? <span className="yc-chip" data-tone="error">À compléter · {issues[0].text}{issues.length > 1 ? ` (+${issues.length - 1})` : ''}</span>
      : blocking && <span className="yc-chip" data-tone="error">À corriger</span>}
    {warnings.length > 0 && <span className="yc-chip" data-tone="warning">{plural(warnings.length, 'point')} à vérifier</span>}
  </>;

  return <section className="yc-plan" data-trial={edited} aria-label="Préparer une conduite de fermentation">
    {goalSlot === undefined && <section className="yc-station yc-goal-station" aria-label="Objectifs">
      <StationHeading step={2} title="Objectifs" fold="objectives" open={goalOpen} onToggle={() => setGoalOpen(open => !open)} controls={`${id}-objectives`}
        summary={<span>Profil : {goalName(goalChoice)}{goalChoice !== draftGoal ? ` · brouillon : ${goalName(draftGoal)}` : ''}</span>} />
      <div id={`${id}-objectives`} hidden={!goalOpen} className="yc-station-body">{profileBlock}</div>
    </section>}
    {goalSlot ? createPortal(profileBlock, goalSlot) : null}
    <section id={`${id}-proposal`} className="yc-station yc-conduct-station" aria-label="Scénario de levure">
      <StationHeading step={conductStep} title="Conduite · température × jours" fold="conduct" open={conductOpen} onToggle={() => setConductOpen(open => !open)}
        controls={`${id}-conduct`} headingRef={conductHeading} summary={conductSummary} />
      <div id={`${id}-conduct`} hidden={!conductOpen} className="yc-station-body yc-proposal">
      {/* A draft change (e.g. the quantity of a new strain) freezes the local paliers: said where they are edited,
          outside the disabled fieldset so that its way out stays usable. */}
      {stale && <p className="yeast-notice yc-stale-line" data-stale-near-chart>Brouillon modifié depuis cet essai : paliers en lecture seule.
        {draft.programme !== undefined && <> <button type="button" className="yeast-link" onClick={resumeKeepingProgramme}>Reprendre en gardant ces paliers</button></>}</p>}
      <fieldset disabled={stale} className="yc-proposal m-0 min-w-0 border-0 p-0"><legend className="sr-only">Réglages de l’essai</legend>
      {strategy && <section ref={proposalPanel} tabIndex={-1} className="yc-proposal-result" aria-label="Proposition de conduite" data-outcome={strategy.outcome}>
        <div className="yc-projection-title"><h4>{strategy.title}</h4><span className="yc-tag" data-outcome={strategy.outcome}>{strategy.outcome === 'proposed' && !proposedValues ? 'Valeurs conservées' : OUTCOME_LABELS[strategy.outcome]}</span></div>
        {!proposedValues && <p className="yeast-small" data-no-proposed-change>{strategy.outcome === 'insufficient-data' ? 'Aucune valeur modifiée : les données ne permettent pas une proposition fondée.'
          : `Aucune valeur modifiée. Conservé : ${programme.length ? programme.map(phase => `${phase.name} ${phaseValue(phase.tempC, '°C')} · ${phaseValue(phase.days, 'j')}`).join(' → ') : 'aucun palier'}.`}</p>}
        {proposalRows.length > 0 && <ul className="yc-decision-list" aria-label="Changements proposés">{proposalRows.map(row => <li key={row.id} data-proposal-row={row.kind ?? 'value'}><strong>{row.label}</strong><span>{row.text}{row.detail && <small className="block">{row.detail}</small>}</span></li>)}</ul>}
        {strategy.reasons.filter(Boolean).length > 0 && <ul className="yc-proposal-reasons" aria-label="Motifs de la proposition">{strategy.reasons.filter(Boolean).map(reason => <li key={reason}>{reason}</li>)}</ul>}
        {strategy.outcome === 'insufficient-data' && issues.length > 0 && <button type="button" className="yeast-link" onClick={() => issues[0].index === undefined ? insertPhase(-1, 'primaire') : goToIssue(issues[0])}>{issues[0].index === undefined ? 'Ajouter une primaire à J0' : `Compléter : ${issues[0].text}`}</button>}
        <section className="yc-strategy-effects" aria-label="Effets attendus de la stratégie"><h4>Effets attendus et limites</h4>{strategy.effects.map(effect => <p key={effect.label}><strong>{effect.label}</strong> · {effect.expected}{effect.limit && <span className="yeast-small block">{effect.limit}</span>}</p>)}</section>
        {(rationale || strategy.sources.length > 0) && <details className="yc-proposal-sources"><summary>Pourquoi, sources{strategy.sources.length ? ` · ${strategy.sources.length}` : ''}<ChevronDown size={14} aria-hidden="true" /></summary>
          {rationale && <p className="yc-rationale">{rationale}</p>}
          {strategy.sources.map(source => <p className="yeast-small" key={source.reference}>{/^https?:\/\//.test(source.reference) ? <a className="yeast-source" href={source.reference} target="_blank" rel="noreferrer">{source.author} · {source.title}</a> : `${source.author} · ${source.title}`}</p>)}
        </details>}
        {beforeProposal?.key === key && <p className="yeast-small">La proposition remplace les paliers de l’essai. <button type="button" className="yeast-link" onClick={restoreBeforeProposal}>Rétablir l’essai avant proposition</button></p>}
      </section>}
      <div className="yc-projection-title"><h4>{result.candidate?.label || recipe.yeast.name || 'Sans levure'} · {edited ? 'essai' : 'conduite actuelle'}</h4><span className="yc-tag">{edited ? 'Non appliqué' : 'Brouillon'}</span></div>
      {(draft.styleId === 'sour' || currentDraft.process !== 'unspecified') && <p className="yeast-small">{processLabels[currentDraft.process ?? 'unspecified']}</p>}
      <FermentationTemperatureChart steps={programme} referenceSteps={edited ? recipe.fermentation ?? [] : []} pitchTempC={draft.pitchTempC}
        bands={programme.map(phase => phase.kind === 'primaire' && result.projection.dossier.temperature?.qualifier === 'range' ? result.projection.dossier.temperature.range : undefined)}
        bandLabel={`plage retenue de ${trialStrain} pour la primaire, non une consigne`} contacts={chartContacts(preview)}
        onSelectStep={selectPhase} selectedStepIndex={activePhaseIndex >= 0 ? activePhaseIndex : undefined}
        onStepsChange={stale ? undefined : (next, edit) => commitProgramme(next, edit.label,
          edit.source === 'keyboard' && edit.axis ? { id: `${edit.index}-${edit.axis}`, index: edit.index } : undefined)} />
      {(lastEditCurrent || editNotice || edited) && <div className="yc-trial-bar" role="group" aria-label="Essai près du graphe">
        {lastEditCurrent ? <><span className="yeast-small" data-last-edit>Dernier réglage · {lastEdit!.label}</span><button type="button" className="yeast-link" onClick={undoLastEdit}><Undo2 size={14} aria-hidden="true" /> Annuler ce réglage</button></>
          : editNotice && <span className="yeast-small" role="status">{editNotice}</span>}
        {edited && <button type="button" className="yeast-link yc-trial-jump" onClick={goToDecision}>Relire et appliquer · {plural(realChangeCount, 'changement')}</button>}
      </div>}
      {/* Exact fields of the selected phase sit right under the chart and its undo: a gesture is read and corrected in the same view. */}
      {activePhase && activePosition && <section id={`${id}-phase-editor`} aria-label="Modifier le palier sélectionné" className="yc-phase-editor min-w-0 space-y-2 rounded-panel border border-area-production bg-cave-900 p-2">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 className="min-w-0 break-words text-sm font-semibold text-cave-50">Palier {activePhaseIndex + 1} · {activePhase.name}</h4>
          <span className="text-xs text-cave-200">{dateText(activePosition)}</span>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          <label htmlFor={`${id}-phase-${activePhaseIndex}-tempC`} className="min-w-0 space-y-1 text-xs text-cave-400">
            Température de la bière
            <span className="flex min-w-0 items-center gap-1"><NumberInput id={`${id}-phase-${activePhaseIndex}-tempC`}
              aria-label={`Température du palier ${activePhaseIndex + 1} · ${activePhase.name}`}
              aria-invalid={!finite(activePhase.tempC)} value={activePhase.tempC}
              min={0} max={60} emptyValue={undefined} onValue={tempC => changePhase(activePhaseIndex, { tempC })} placeholder="inconnue"
              className="w-full min-w-0 text-right" /><span className="shrink-0 text-cave-200">°C</span></span>
          </label>
          <label htmlFor={`${id}-phase-${activePhaseIndex}-days`} className="min-w-0 space-y-1 text-xs text-cave-400">
            Durée du palier
            <span className="flex min-w-0 items-center gap-1"><NumberInput id={`${id}-phase-${activePhaseIndex}-days`}
              aria-label={`Durée du palier ${activePhaseIndex + 1} · ${activePhase.name}`}
              aria-invalid={!finite(activePhase.days)} value={activePhase.days}
              min={0} emptyValue={undefined} onValue={days => changePhase(activePhaseIndex, { days })} placeholder="inconnue"
              className="w-full min-w-0 text-right" /><span className="shrink-0 text-cave-200">j</span></span>
          </label>
        </div>
        <p className="text-xs text-cave-400">Vide = inconnu, distinct de 0 j.</p>
        <div className="yc-phase-structure" role="group" aria-label="Ajouter ou supprimer un palier">
          <label className="yc-phase-kind">Type à ajouter<select aria-label="Type du palier à ajouter" value={newPhaseKind} onChange={e => setNewPhaseKind(e.target.value as FermentationTimelineStep['kind'])}>
            {PHASE_KINDS.map(option => <option key={option.kind} value={option.kind}>{option.label}</option>)}</select></label>
          <button type="button" aria-label={`Ajouter un palier avant le palier ${activePhaseIndex + 1}`} onClick={() => insertPhase(activePhaseIndex - 1, newPhaseKind)}><Plus size={14} aria-hidden="true" /> Avant</button>
          <button type="button" aria-label={`Ajouter un palier après le palier ${activePhaseIndex + 1}`} onClick={() => insertPhase(activePhaseIndex, newPhaseKind)}><Plus size={14} aria-hidden="true" /> Après</button>
          <button type="button" className="yc-phase-remove" aria-label={`Supprimer le palier ${activePhaseIndex + 1} · ${activePhase.name}`} onClick={() => removePhase(activePhaseIndex)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
        </div>
        <details className="yc-phase-metadata"><summary>Nom, type et consignes du palier</summary><div className="yc-dossier-fields">
          <label htmlFor={`${id}-phase-${activePhaseIndex}-name`}>Nom<Input id={`${id}-phase-${activePhaseIndex}-name`} value={activePhase.name} onChange={event => changePhase(activePhaseIndex, { name: event.target.value })} /></label>
          <label htmlFor={`${id}-phase-${activePhaseIndex}-kind`}>Type<select id={`${id}-phase-${activePhaseIndex}-kind`} value={activePhase.kind} onChange={event => changePhase(activePhaseIndex, { kind: event.target.value as FermentationTimelineStep['kind'] })}>
            {PHASE_KINDS.map(option => <option key={option.kind} value={option.kind}>{option.label}</option>)}
          </select></label>
          <label htmlFor={`${id}-phase-${activePhaseIndex}-note`}>Consignes<Textarea id={`${id}-phase-${activePhaseIndex}-note`} value={activePhase.note ?? ''} onChange={event => changePhase(activePhaseIndex, { note: event.target.value || undefined })} rows={2} /></label>
        </div></details>
        {conditionFor(activePhase) && <p className="yeast-small" data-phase-condition>{conditionFor(activePhase)}</p>}
        <div className="yc-phase-baseline"><span>{programmeBaseline[activePhaseIndex]
          ? `Dans le brouillon : ${Number.isFinite(programmeBaseline[activePhaseIndex]?.tempC) ? `${number(programmeBaseline[activePhaseIndex]!.tempC)} °C` : 'température inconnue'} · ${Number.isFinite(programmeBaseline[activePhaseIndex]?.days) ? `${number(programmeBaseline[activePhaseIndex]!.days)} j` : 'durée inconnue'}`
          : 'Palier ajouté dans l’essai · aucune phase correspondante dans le brouillon.'}</span>
          <button type="button" className="yeast-link" data-phase-restore={activePhaseIndex} onClick={() => restorePhase(activePhaseIndex)}>{programmeBaseline[activePhaseIndex] ? 'Rétablir ce palier' : 'Retirer ce palier ajouté'}</button></div>
        <p className="text-xs text-cave-200" data-following-shift>{followingShift(activePhaseIndex)}</p>
      </section>}
      {programme.length > 0 ? <section className="yc-programme" aria-label="Programme proposé"><div className="yc-projection-title"><h4>{edited ? 'Paliers de l’essai' : 'Paliers du brouillon'}</h4><span className="yc-number">{totalDays == null ? 'Durée totale inconnue' : `${number(totalDays)} j indicatifs`}</span></div>
        <ol>{positions.map((position, index) => { const phase = programme[index]; const before = programmeBaseline[index]; const condition = conditionFor(phase); const shift = phaseShift(index);
          const tempChanged = before && Number.isFinite(before.tempC) && Number.isFinite(phase.tempC) && before.tempC !== phase.tempC;
          const daysChanged = before && Number.isFinite(before.days) && Number.isFinite(phase.days) && before.days !== phase.days;
          const temperatureText = tempChanged ? `${number(before.tempC)} → ${number(phase.tempC!)} °C` : Number.isFinite(phase.tempC) ? `${number(phase.tempC!)} °C` : 'Température inconnue';
          const daysText = daysChanged ? `${number(before.days)} → ${number(phase.days!)} j` : Number.isFinite(phase.days) ? `${number(phase.days!)} j` : 'durée inconnue';
          const unknown = !finite(phase.tempC) || !finite(phase.days);
          return <li key={index} data-phase-modified={!!(tempChanged || daysChanged)} data-phase-incomplete={unknown || undefined}
            data-phase-temp={finite(phase.tempC) ? phase.tempC : phase.tempC == null ? '' : 'invalid'} data-phase-days={finite(phase.days) ? phase.days : phase.days == null ? '' : 'invalid'} data-phase-start={position.start ?? ''} data-phase-end={position.end ?? ''}>
          <button type="button" data-phase-choice={index} aria-pressed={index === activePhaseIndex} onClick={() => setSelectedPhaseIndex(index)}
            className={`w-full min-w-0 rounded-control border px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-area-production ${index === activePhaseIndex ? 'border-area-production bg-cave-850' : 'border-cave-700 bg-cave-900'}`}>
            <span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><strong className="min-w-0 break-words">Palier {index + 1} · {phase.name}{tempChanged || daysChanged ? ' · modifié' : ''}</strong><span className="text-xs text-cave-200">{temperatureText} · {daysText}</span></span>
            <span className="block text-xs text-cave-400">{dateText(position)}{shift ? ` · ${shift}` : ''}</span>
          </button>
          {condition && index !== activePhaseIndex && <details className="yc-phase-note"><summary>Condition</summary><p className="yeast-small">{condition}</p></details>}
        </li>; })}</ol>
        <p className="yc-end-shift" aria-live="polite">{recipeEnd === null || trialEnd === null ? 'Fin de consigne : décalage inconnu tant qu’une durée manque.'
          : edited ? `Fin de consigne : brouillon J${number(recipeEnd)} → essai J${number(trialEnd)} (${trialEnd - recipeEnd > 0 ? '+' : ''}${number(trialEnd - recipeEnd)} j).`
            : `Fin de consigne du brouillon : J${number(recipeEnd)}.`} Pas une fin de fermentation attestée.</p>
      </section> : <p className="yeast-notice" data-empty-programme>Aucun palier dans cet essai. {addPrimaryButton}</p>}
      {warnings.length > 0 && <ul className="yc-alerts" aria-label="Points à vérifier dans le scénario">{warnings.map(text => <li key={text}>{text}</li>)}</ul>}
      {!!result.activeHopTemperatureConflicts?.length && <label className="yeast-check"><input type="checkbox" checked={draft.alignActiveHopTemperature ?? false} onChange={e => patch({ alignActiveHopTemperature: e.target.checked })} /><span>Aligner les ajouts en fermentation active sur {number(mainTemperature)} °C<span className="yeast-small block">Sans cette option, leurs températures restent celles de la recette.</span></span></label>}
      <details className="yc-adjustments" open={otherErrors.length > 0 || (!programme.length && draft.programme === undefined) || draft.styleId === 'sour'}><summary>Hypothèses et réglages complémentaires<ChevronDown size={14} aria-hidden="true" /></summary>
      <div className="yc-scenario-inputs">
        <div className="yeast-setting-line"><label htmlFor={`${id}-att`}>Atténuation retenue pour l’essai<span className="yeast-small block">Hypothèse sur ce moût</span></label><NumberInput id={`${id}-att`} aria-label="Atténuation retenue pour le scénario" value={draft.attenuationPct} min={0} max={100} emptyValue={undefined} onValue={attenuationPct => patch({ attenuationPct, attenuationBasis: 'recipe' })} placeholder="Fiche" /><span>%</span></div>
        {result.projection.dossier.documentedAttenuation && draft.attenuationPct !== undefined && <button type="button" className="yeast-link" onClick={() => patch({ attenuationPct: undefined, attenuationBasis: 'declared' })}>Utiliser la plage de la fiche</button>}
        {explicitWithoutPrimary ? <p className="yeast-small">Aucune primaire dans le programme de l’essai : elle n’est pas recréée implicitement. {addPrimaryButton}</p>
          : <div className="yeast-setting-line"><label htmlFor={`${id}-temp`}>Consigne de fermentation<span className="yeast-small block">Température de la primaire</span></label><NumberInput id={`${id}-temp`} aria-label="Température principale du scénario" value={mainTemperature} emptyValue={undefined} onValue={temperatureC => patch({ temperatureC })} /><span>°C</span></div>}
      </div>
      {result.projection.dossier.temperature?.qualifier === 'range' && <p className="yeast-small">Plage retenue : {projectionRange(result.projection.dossier.temperature.range, 1)} °C. La température ne modifie pas numériquement l’atténuation dans ce modèle.</p>}
      <label className="yc-process-label" htmlFor={`${id}-process`}>Procédé de fermentation<select id={`${id}-process`} value={draft.process ?? 'unspecified'} onChange={e => patch({ process: e.target.value as YeastRecipeDraft['process'] })}>{Object.entries(processLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {(draft.process === 'mixed-culture' || draft.process === 'acidifying-yeast' || !!draft.cultureRoles?.length) && <div className="yc-cultures"><p className="yeast-small">Décris les rôles. Le pH et la production d’alcool des cultures ne sont pas déduits d’un nom.</p>
        {(draft.cultureRoles ?? []).map((culture, index) => <div key={index} className="yc-culture-row"><Input id={`${id}-culture-${index}-name`} aria-label={`Culture ${index + 1}`} value={culture.name} onChange={e => patch({ cultureRoles: draft.cultureRoles!.map((value, i) => i === index ? { ...value, name: e.target.value } : value) })} />
          <select id={`${id}-culture-${index}-role`} aria-label={`Rôle de la culture ${index + 1}`} value={culture.role} onChange={e => patch({ cultureRoles: draft.cultureRoles!.map((value, i) => i === index ? { ...value, role: e.target.value as typeof culture.role } : value) })}><option value="alcoholic">Alcoolique</option><option value="acidifying">Acidifiante</option><option value="conditioning">Maturation</option><option value="mixed">Mixte</option></select>
          <button type="button" aria-label={`Retirer la culture ${index + 1}`} onClick={() => patch({ cultureRoles: draft.cultureRoles!.filter((_, i) => i !== index) })}>×</button></div>)}
        <button type="button" onClick={() => patch({ cultureRoles: [...draft.cultureRoles ?? [], { name: '', role: 'mixed' }] })}>Ajouter une culture</button>
      </div>}
      <details className="yc-preparation"><summary>Ensemencement, durée et pression<ChevronDown size={14} aria-hidden="true" /></summary><div>
        {strainChanged ? <p className="yeast-small">Température d’ensemencement : à revalider juste avant « Appliquer au brouillon ». <button type="button" className="yeast-link" onClick={() => document.getElementById(`${id}-pitch`)?.focus()}>Aller au champ</button></p> : pitchField()}
        {!explicitWithoutPrimary && <div className="yeast-setting-line"><label htmlFor={`${id}-days`}>Durée indicative</label><NumberInput id={`${id}-days`} aria-label="Durée principale du scénario en jours" min={0} value={mainDays} emptyValue={undefined} onValue={days => patch({ days })} /><span>j</span></div>}
        <div className="yeast-setting-line"><label htmlFor={`${id}-pressure`}>Contre-pression précoce</label><NumberInput id={`${id}-pressure`} aria-label="Contre-pression du scénario en bar" min={0} value={draft.pressureBar} emptyValue={undefined} onValue={pressureBar => patch({ pressureBar })} /><span>bar rel.</span></div>
        <p className="yeast-small">Vide : inconnue. 0 bar : sans contre-pression. Les jours servent au calendrier, pas à attester la fin de fermentation.</p>
        {(draft.ferulicRest || proposeYeastGoalSettings(recipe, { ...draft, ferulicRest: false }, refs, trialYeast)?.patch.ferulicRest) && <label className="yeast-check"><input type="checkbox" checked={draft.ferulicRest} onChange={e => patch({ ferulicRest: e.target.checked })} /><span>Ajouter un repos férulique · 44 °C, 15 min si absent</span></label>}
        {trialForm === 'sèche' ? <>{!strainChanged && <div className="yeast-setting-line"><label htmlFor={`${id}-grams`}>Masse sèche prévue</label><NumberInput id={`${id}-grams`} disabled={stale} aria-label="Masse de levure du scénario en grammes" min={0} value={draft.quantityG} emptyValue={undefined} onValue={quantityG => patch({ quantityG })} /><span>g</span></div>}<p className="yeast-small">Dose fabricant au volume de la recette : {projectionRange(result.doseG?.range, 1)} g. La masse du produit essayé reste à renseigner explicitement.</p></>
          : <>{!trialForm && <p className="yeast-notice">Forme du nouveau produit inconnue : aucune masse sèche ou quantité de pack n’est déduite. Le besoin en cellules peut être exploré avec un taux et une viabilité explicitement renseignés.</p>}
            <div className="yeast-setting-line"><label htmlFor={`${id}-rate`}>Taux visé · M cellules/mL/°P</label><NumberInput id={`${id}-rate`} aria-label="Taux de cellules visé par mL et degré Plato" min={0} value={draft.pitchRateMillionPerMlPlato} emptyValue={undefined} onValue={pitchRateMillionPerMlPlato => patch({ pitchRateMillionPerMlPlato })} /></div>
            <div className="yeast-setting-line"><label htmlFor={`${id}-cells`}>Cellules viables disponibles</label><NumberInput id={`${id}-cells`} aria-label="Cellules viables disponibles en milliards" min={0} value={draft.viableCellsBillion} emptyValue={undefined} onValue={viableCellsBillion => patch({ viableCellsBillion })} /><span>Md</span></div>
            <output className="yc-cell-result">{cells.requiredBillion == null ? 'Besoin calculable avec volume, densité et taux visé.' : `${number(cells.requiredBillion)} Md nécessaires${cells.balanceBillion == null ? ' · disponibilité inconnue' : ` · écart ${number(cells.balanceBillion)} Md`}`}</output>
            <p className="yeast-small">Le taux est une hypothèse. Aucun nombre de flacons ni volume de levain sans comptage viable.</p>
          </>}
      </div></details>
      </details>
      <button type="button" className="yeast-link" onClick={onCompare}>Comparer les souches pour ce profil</button>
      <details><summary>Contacts, calcul et sources<ChevronDown size={14} aria-hidden="true" /></summary><div>
        {result.candidate?.preferred && <p className="yeast-small">{result.candidate.reason}</p>}
        <Contacts recipe={preview} />
        {result.effects.filter(effect => effect.state !== 'warning' && ['temperature', 'pressure', 'hop-active', 'hop-post', 'ferulic'].includes(effect.id)).map(effect => <p key={effect.id} className="text-[13px]"><strong>{effect.impact}</strong> · {effect.detail}</p>)}
        {result.fg.reasons.map(reason => <p className="yeast-small" key={reason}>{reason}</p>)}
        {result.projection?.extract && <p className="yeast-small">Extrait : {number(result.projection.extract.totalPoints, 2)} points, dont {number(result.projection.extract.unfermentablePoints, 2)} non fermentescibles et {number(result.projection.extract.sugarPoints, 2)} de sucres.</p>}
        {[...new Map([...result.sources, ...strategy?.sources ?? []].map(source => [source.reference, source])).values()].map((source, i) => <p className="yeast-small" key={i}>{/^https?:\/\//.test(source.reference) ? <a className="yeast-source" href={source.reference} target="_blank" rel="noreferrer">{source.author} · {source.title}</a> : `${source.author} · ${source.title}`}</p>)}
      </div></details>
      </fieldset></div>
    </section>
    {/* Only a trial has something to decide; its blocking states stay here, outside the folds. */}
    {edited && <section className="yc-station yc-decision" aria-label="Décider des changements de l’essai">
      <div className="yc-station-heading"><span className="yc-step-number" aria-hidden="true">4</span><div><h3 id={`${id}-decision-title`} tabIndex={-1}>Relire et décider</h3><p className="yeast-small">Essai local → brouillon · {realChangeCount} changement{realChangeCount === 1 ? '' : 's'} réel{realChangeCount === 1 ? '' : 's'}</p></div></div>
      {stale && <div className="yeast-notice" role="alert">La recette ou la fiche de la souche a changé. <button type="button" onClick={resumeCurrent}>Reprendre les données actuelles</button>
        {draft.programme !== undefined && <> <button type="button" onClick={resumeKeepingProgramme}>Reprendre en gardant les paliers de l’essai</button></>}</div>}
      {result.changes.length ? <ul className="yc-decision-list" aria-label="Changements principaux de l’essai">{headlineChanges.map(change => <li key={change.id}><strong>{changeLabel(change)}</strong><span>{change.before} → {change.after}</span></li>)}</ul>
        : <p className="yeast-small">Aucune différence à appliquer.</p>}
      {hiddenChangeCount > 0 && <details className="yc-diff" aria-label="Tous les changements réels"><summary>{headlineChanges.length} changements principaux · {hiddenChangeCount} autre{hiddenChangeCount === 1 ? '' : 's'} à relire<ChevronDown size={14} aria-hidden="true" /></summary><table><thead><tr><th>Réglage</th><th>Brouillon</th><th>Essai</th></tr></thead><tbody>{result.changes.map(change => <tr key={change.id}><th scope="row">{changeLabel(change)}</th><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody></table></details>}
      {intentOnly && <p className="yeast-small" data-intent-only>Intention seulement : aucun palier ni consigne n’est modifié. Le profil sera conservé avec la recette.</p>}
      {current.fg.range || result.fg.range || current.abv.range || result.abv.range
        ? <div className="yc-preview-pair" aria-label="Estimations avant la décision">
          <YeastRangeComparison label="Densité finale" unit="SG" digits={3} current={current.fg.range} proposed={result.fg.range} />
          <YeastRangeComparison label="Alcool estimé" unit="% vol" current={current.abv.range} proposed={result.abv.range} />
        </div>
        : <p className="yc-unknown-projection">Densité finale et alcool estimé : <strong>à renseigner</strong> pour le brouillon et l’essai.</p>}
      {projectionUnchanged && <p className="yeast-small" data-projection-unchanged>Densité finale et alcool estimés identiques au brouillon : ni le profil ni les paliers ne modifient l’atténuation ou le moût dans ce modèle.</p>}
      {!result.fg.range && <p className="yeast-notice">{result.fg.reasons[0]}</p>}
      {!result.abv.range && result.abv.reasons[0] !== result.fg.reasons[0] && <p className="yeast-notice">{result.abv.reasons[0]}</p>}
      {(factChanges.length > 0 || selectionChanges.length > 0) && <div className="yc-fact-changes"><h4>Fiche du candidat retenue dans l’essai</h4>{factChanges.length > 0 && <ul className="yc-decision-list">{factChanges.map(change => <li key={change.label}><strong>{change.label}</strong><span>{change.before} → {change.after}</span></li>)}</ul>}
        {(addedFacts.length > 0 || removedFacts.length > 0) && <details><summary>Observations et sources modifiées</summary><ul className="yc-decision-list" aria-label="Observations documentaires retenues">{[...addedFacts.map(fact => ({ fact, added: true })), ...removedFacts.map(fact => ({ fact, added: false }))].map(({ fact, added }) => <li key={`${added}-${factSignature(fact)}`}><strong>{added ? 'Ajout' : 'Retrait'} · {YEAST_FACT_LABELS[fact.key]}</strong><span>{observationText(fact)}<small className="block">{fact.origin === 'personal' ? 'Saisie personnelle' : fact.origin === 'manufacturer' ? 'Fabricant' : 'IA'} · {fact.sourceUrl ? <a className="yeast-source" href={fact.sourceUrl} target="_blank" rel="noreferrer">{sourceTitle(fact.source)}</a> : fact.source || 'source à préciser'}{fact.retrievedAt && ` · consultée le ${fact.retrievedAt}`}</small></span></li>)}</ul></details>}
        {selectionChanges.length > 0 && <><ul className="yc-decision-list" aria-label="Plages documentaires retenues">{selectionChanges.map(change => <li key={change.key}><strong>{change.label}</strong><span>{change.text}{(change.source || change.sourceUrl) && <small className="block">Source : {change.sourceUrl ? <a className="yeast-source" href={change.sourceUrl} target="_blank" rel="noreferrer">{sourceTitle(change.source)}</a> : change.source}</small>}</span></li>)}</ul><p className="yeast-small">Plages, bornes et points retenus tels que publiés, sans valeur médiane.</p></>}
        <p className="yeast-small">Sources : {relevantSources.length ? relevantSources.map((fact, index) => <span key={fact.sourceUrl ?? fact.source}>{index > 0 && ' · '}{fact.sourceUrl ? <a className="yeast-source" href={fact.sourceUrl} target="_blank" rel="noreferrer">{YEAST_FACT_LABELS[fact.key]} · {sourceTitle(fact.source)}</a> : `${YEAST_FACT_LABELS[fact.key]} · ${fact.source}`}</span>) : preview.yeast.technicalSource || 'à préciser'}. Les autres valeurs de la fiche restent celles du candidat.</p></div>}
      {strainChanged && <div role="group" aria-labelledby={`${id}-pitch-check`} data-pitch-revalidation className="yc-pitch-check min-w-0 space-y-2 rounded-panel border border-ebc-straw bg-cave-900 p-2">
        <h4 id={`${id}-pitch-check`} className="min-w-0 break-words text-sm font-semibold text-cave-50">Ensemencement à revalider · {trialStrain}</h4>
        <p className="text-xs text-cave-200">La plage publiée ne fixe ni quantité ni température d’ensemencement du nouveau produit.</p>
        <ul className="yc-decision-list">
          <li data-pitch-check="quantity"><strong>Quantité prévue</strong><span>{previousQuantity ? `${previousQuantity} (${previousProduct}) · non repris` : `Inconnue (${previousProduct})`} → {trialQuantity || 'à renseigner'}</span></li>
          <li data-pitch-check="temperature"><strong>Temp. ensemencement</strong><span>{Number.isFinite(recipe.yeast.pitchTempC) ? `${number(recipe.yeast.pitchTempC)} °C (${previousProduct}) · non reprise` : `Inconnue (${previousProduct})`} → {Number.isFinite(draft.pitchTempC) ? `${number(draft.pitchTempC)} °C · saisie dans l’essai` : 'à renseigner'}</span></li>
        </ul>
        {trialForm === 'sèche' && <div className="yeast-setting-line"><label htmlFor={`${id}-grams`}>Masse sèche prévue<span className="yeast-small block">Vide = inconnue</span></label><NumberInput id={`${id}-grams`} disabled={stale} aria-label="Masse de levure du scénario en grammes" min={0} value={draft.quantityG} emptyValue={undefined} onValue={quantityG => patch({ quantityG })} placeholder="—" /><span>g</span></div>}
        {trialForm === 'sèche' && <details><summary>Repère de dose fabricant<ChevronDown size={14} aria-hidden="true" /></summary><p className="yeast-small">Au volume de la recette : {projectionRange(result.doseG?.range, 1)} g. Aucun pré-remplissage ni conversion de l’ancienne quantité.</p></details>}
        {pitchField('Vide : à renseigner dans le brouillon après application.')}
      </div>}
      {incomplete && <div className="yeast-error yc-programme-issues" role="alert" data-programme-incomplete>
        <p>Programme à compléter avant d’appliquer. Une valeur vide reste inconnue, distincte de 0 j.</p>
        <ul>{issues.map((issue, index) => <li key={index}><span>{issue.text}</span>{issue.index === undefined
          ? <button type="button" className="yeast-link" onClick={() => insertPhase(-1, 'primaire')}>Ajouter une primaire à J0</button>
          : issue.field === 'phase' ? <button type="button" className="yeast-link" onClick={() => removePhase(issue.index!)}>Retirer ce palier invalide</button>
          : <button type="button" className="yeast-link" data-issue-field={`${issue.index}-${issue.field ?? 'tempC'}`} onClick={() => goToIssue(issue)}>Aller au champ</button>}</li>)}</ul>
      </div>}
      {problemGroups.map(({ message, problems }) => <div key={message} className="yeast-error" role="alert"><p>{message}</p>
        {problems.map(problem => <button key={`${problem.code}-${problem.index ?? ''}-${problem.field ?? ''}`} type="button" className="yeast-link" data-error-code={problem.code} onClick={() => correctProblem(problem)}>
          {problem.property === 'cultureRoles' ? `Corriger la culture ${problem.index! + 1} · ${problem.field === 'role' ? 'rôle' : 'nom'}` : problem.section === 'mash' ? 'Voir le poste à corriger' : 'Aller à la correction'}
        </button>)}
      </div>)}
      {trialIdentityInvalid && <p className="yeast-error" role="alert">La fiche de l’essai ne correspond plus à la souche sélectionnée. <button type="button" className="yeast-link" onClick={onCompare}>Reprendre le candidat</button></p>}
      {trialRangeInvalid && <p className="yeast-error" role="alert">La température minimale de la fiche dépasse la maximale. <button type="button" className="yeast-link" onClick={onEditFacts ?? onCompare}>Corriger la fiche de l’essai</button></p>}
      {error && <p className="yeast-error" role="alert">{error}</p>}
      {identityPending && <p className="yeast-notice" data-identity-pending>Choisis d’abord une levure (point 1) : ces paliers restent en essai local et suivent ton choix.</p>}
      <div className="yc-actions"><button ref={applyButton} className="yc-apply" type="button" disabled={!edited || stale || identityPending || trialIdentityInvalid || trialRangeInvalid || blocking || incomplete} onClick={apply}>Appliquer au brouillon</button><button type="button" onClick={reset}>Annuler l’essai</button></div>
      <p className="yeast-small">Enregistre ensuite la recette pour conserver le brouillon. Un brassin lancé garde son snapshot.</p>
    </section>}
    {notice && <p role="status" className="yeast-small">{notice}</p>}
  </section>;
}
