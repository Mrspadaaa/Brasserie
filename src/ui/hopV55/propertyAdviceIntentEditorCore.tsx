import React, { useId, useMemo, useRef, useState } from 'react';
import type { HopSource, HopSourceKind } from '../../../functions/src/hopIndexSchema';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import { listHopIntentEvidenceFamilies } from '../../domain/hopDecision/intentEvidence';
import type { HopDocumentaryAccess } from '../../domain/hopDecision/documentaryAnswerSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type {
  HopPropertyAdviceCandidatePolicy,
  HopPropertyAdviceIntentV3,
  HopPropertyAdviceMetric,
  HopPropertyAdviceProperty,
  HopPropertyAdviceRequest,
  HopPropertyAdviceRole,
  HopPropertyAdviceSensoryContext,
  HopPropertyAdviceSubjectKind,
} from '../../domain/hopDecision/propertyAdviceSchema';
import { Input, Textarea } from '../Input';
import {
  COMPENSATION_KIND,
  admissibleCompensationObservations,
  applyCompensationFix,
  compensationIssues,
  isForbiddenCompensationMetric,
  startCompensation,
  toggleCompensationObservation,
  type CompensationFix,
} from './propertyAdviceCompensationV3';
import './property-advice-intent-editor.css';

/*
 * Noyau PRIVÉ partagé par HopV55PropertyAdviceIntentEditor (V2) et HopV55PropertyAdviceIntentEditorV3.
 * Les façades gardent leurs DTO exacts; ce noyau ne crée aucune valeur, mesure, identité matière ou fait.
 * En mode 'v2', aucune question de compensation n’est proposée ni produite.
 */
export type EditorCoreIntent = HopPropertyAdviceIntentV3;
type AccessScope = keyof HopPropertyAdviceRequest['context']['access'];
type AccessState = HopDocumentaryAccess['state'] | '';
type SourceMode = 'external' | 'personal' | '';
type NewIntentProperty = HopPropertyAdviceProperty | '';
type NewIntentRole = HopPropertyAdviceRole | '';
type NewIntentDirection = Exclude<EditorCoreIntent['direction'], null> | '';
type QuestionNature = 'open' | 'compensation';

/** Vue structurelle du request : V2 et V3 y sont assignables sans conversion. */
export interface EditorCoreRequest {
  originalQuestion: string;
  interpretation: HopPropertyAdviceRequest['interpretation'];
  propertyIntents: readonly EditorCoreIntent[];
  context: HopPropertyAdviceRequest['context'];
  materials: readonly HopDecisionMaterial[];
}

export interface PropertyAdviceIntentEditorCoreProps {
  mode: 'v2' | 'v3';
  request: EditorCoreRequest;
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
  materialChoices: readonly HopDecisionMaterial[];
  onChangeIntent(intentId: string, replacement: EditorCoreIntent): void;
  onChangeCandidatePolicy(policy: HopPropertyAdviceCandidatePolicy): void;
  onSearchMaterials?(query: string, exactScopeIds: readonly string[]): Promise<HopDecisionMaterial[]>;
  onSelectMaterials?(ids: string[]): Promise<HopDecisionMaterial[]>;
  onChangeMaterials(materials: HopDecisionMaterial[]): void;
  onChangeAccess(scope: AccessScope, value: HopDocumentaryAccess): void;
  onChangeAssertions(assertions: HopAdviceAssertion[]): void;
  onAddIntent(intent: EditorCoreIntent): void;
  disabled?: boolean;
  /** Façade V4 : sections rendues. Absent = toutes, rendu V2/V3 inchangé. */
  sections?: readonly EditorCoreSection[];
  /**
   * Façade V4 : cartes rendues (sans en-tête de carte, la ligne appelante le porte).
   * Les autres termes restent connus pour les relations et les gardes de compensation.
   */
  visibleIntentIds?: readonly string[];
  /** Façade V4 : une projection confirmée porte toujours l’origine utilisateur; le sélecteur d’origine est masqué. */
  lockInterpretationOrigin?: boolean;
  /** Façade V4 : libellés des termes hors lecture active (écartés), pour nommer une référence liée au lieu d’un ID. */
  intentLabels?: ReadonlyMap<string, string>;
}

export type EditorCoreSection = 'header' | 'context' | 'intents' | 'add' | 'policy' | 'access';

interface AddIntentDraft {
  fragment: string;
  occurrenceIndex: number;
  property: NewIntentProperty;
  role: NewIntentRole;
  direction: NewIntentDirection;
  qualification: string;
  required: boolean;
  comparisonBasis: EditorCoreIntent['comparisonBasis']['kind'];
  assertionIds: string[];
  metric: HopPropertyAdviceMetric;
  subjectKind: HopPropertyAdviceSubjectKind;
  subjectLabel: string;
  sensoryContext: HopPropertyAdviceSensoryContext;
  familyId: string;
  motive: string;
  relatedIntentIds: string[];
  nature: QuestionNature;
  observationIds: string[];
}

interface SourceDraft { mode: SourceMode; title: string; author: string; year: string; kind: HopSourceKind | ''; reference: string; locator: string; reason: string }
interface AccessCorrectionDraft { state: AccessState; statement: string; basis: string; source: SourceDraft }

/* Libellés brasseur; les valeurs du DTO restent inchangées et visibles seulement dans les précisions avancées. */
const propertyRows: Array<{ value: HopPropertyAdviceProperty; label: string }> = [
  { value: 'aroma', label: 'Arôme' }, { value: 'bitterness', label: 'Amertume' },
  { value: 'sweetness', label: 'Sucrosité, douceur' }, { value: 'acidity', label: 'Acidité' },
  { value: 'bioContribution', label: 'Apport d’une culture (levure, bactéries)' }, { value: 'materialCharacter', label: 'Caractère de la matière' },
  { value: 'unresolved', label: 'Pas encore clair' },
];
const roleRows: Array<{ value: HopPropertyAdviceRole; label: string; help: string }> = [
  { value: 'target', label: 'Ce que je veux obtenir', help: 'Une cible : la réponse cherche des voies vers ce résultat, sans mesure actuelle implicite.' },
  { value: 'reportedObservation', label: 'Ce que je constate', help: 'Un constat rapporté : il décrit la bière telle qu’elle est, il ne fixe pas de but.' },
  { value: 'measurement', label: 'Une valeur mesurée', help: 'Une mesure garde sa métrique et ses assertions exactes. Les unités ou valeurs absentes ne sont pas complétées ici.' },
  { value: 'investigation', label: 'Une question à examiner', help: 'Une question ouvre un examen; elle n’est ni un constat ni une seconde option sensorielle.' },
  { value: 'preference', label: 'Une préférence', help: 'Une préférence oriente la réponse sans être exigée.' },
  { value: 'constraint', label: 'Une limite à respecter', help: 'Une garde : la réponse ne doit pas la franchir.' },
];
const directionRows: Array<{ value: NewIntentDirection; label: string }> = [
  { value: '', label: 'Rien de précis' }, { value: 'increase', label: 'En avoir plus' },
  { value: 'decrease', label: 'En avoir moins' }, { value: 'keep', label: 'Le garder tel quel' },
  { value: 'exclude', label: 'L’éviter' }, { value: 'investigate', label: 'L’examiner' },
];
const metricRows: Array<{ value: HopPropertyAdviceMetric; label: string }> = [
  { value: 'sensory', label: 'Perception (dégustation)' }, { value: 'pH', label: 'pH' },
  { value: 'titratableAcidity', label: 'Acidité titrable' }, { value: 'analyticalBU', label: 'Amertume analytique (BU)' },
  { value: 'unspecified', label: 'Non précisée' },
];
const basisRows: Array<{ value: EditorCoreIntent['comparisonBasis']['kind']; label: string }> = [
  { value: 'qualitativeTarget', label: 'Un résultat visé, sans mesure' }, { value: 'current', label: 'L’état actuel de la bière' },
  { value: 'none', label: 'Rien de précis' },
];
const subjectRows: Array<{ value: HopPropertyAdviceSubjectKind; label: string }> = [
  { value: 'beer', label: 'La bière' }, { value: 'material', label: 'Une matière' },
  { value: 'culture', label: 'Une culture' }, { value: 'process', label: 'Le procédé' },
  { value: 'unspecified', label: 'Non précisé' },
];
const sensoryContextRows: Array<{ value: HopPropertyAdviceSensoryContext; label: string }> = [
  { value: 'rawHop', label: 'Houblon brut' }, { value: 'infusion', label: 'Infusion' },
  { value: 'beer', label: 'Dans la bière' }, { value: 'unspecified', label: 'Non précisé' },
];
const sourceKinds: HopSourceKind[] = ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'];
const sourceKindLabels: Record<HopSourceKind, string> = { coa: 'Certificat d’analyse', manufacturer: 'Fabricant', research: 'Recherche',
  review: 'Revue', observation: 'Observation', community: 'Communauté', judgment: 'Jugement' };
const accessScopes: Array<{ key: AccessScope; label: string }> = [
  { key: 'bulkBeer', label: 'Bière entière' }, { key: 'sampling', label: 'Échantillon' },
  { key: 'separatePortion', label: 'Portion séparée' },
];
const label = <T extends string>(rows: ReadonlyArray<{ value: T; label: string }>, value: T): string => rows.find((row) => row.value === value)?.label ?? value;
const emptySource = (): SourceDraft => ({ mode: '', title: '', author: '', year: '', kind: '', reference: '', locator: '', reason: '' });
const emptyAccessCorrection = (): AccessCorrectionDraft => ({ state: '', statement: '', basis: '', source: emptySource() });
const emptyAddIntentDraft = (): AddIntentDraft => ({ fragment: '', occurrenceIndex: 0, property: '', role: '', direction: '',
  qualification: '', required: false, comparisonBasis: 'none', assertionIds: [], metric: 'unspecified',
  subjectKind: 'unspecified', subjectLabel: 'Sujet non précisé', sensoryContext: 'unspecified', familyId: '', motive: '', relatedIntentIds: [],
  nature: 'open', observationIds: [] });

function exactOccurrences(source: string, fragment: string): Array<{ start: number; end: number; text: string }> {
  if (!fragment) return [];
  const occurrences: Array<{ start: number; end: number; text: string }> = [];
  let start = source.indexOf(fragment);
  while (start !== -1) {
    occurrences.push({ start, end: start + fragment.length, text: fragment });
    start = source.indexOf(fragment, start + 1);
  }
  return occurrences;
}

function occurrenceContext(source: string, span: { start: number; end: number }): string {
  const before = source.slice(Math.max(0, span.start - 28), span.start);
  const after = source.slice(span.end, Math.min(source.length, span.end + 28));
  return `${before ? `…${before}` : ''}«${source.slice(span.start, span.end)}»${after ? `${after}…` : ''}`;
}

/** Sélection faite dans la question → fragment exact + occurrence (offsets UTF-16 de la question originale). */
function selectionToFragment(question: string, value: string, start: number, end: number): { fragment: string; occurrenceIndex: number } | null {
  const raw = value.slice(start, end);
  const fragment = raw.trim();
  if (!fragment) return null;
  const trimmedStart = start + (raw.length - raw.trimStart().length);
  const occurrences = exactOccurrences(question, fragment);
  if (!occurrences.length) return null;
  const exact = occurrences.findIndex((span) => span.start === trimmedStart);
  if (exact >= 0) return { fragment, occurrenceIndex: exact };
  let best = 0;
  occurrences.forEach((span, index) => { if (Math.abs(span.start - trimmedStart) < Math.abs(occurrences[best].start - trimmedStart)) best = index; });
  return { fragment, occurrenceIndex: best };
}

const stateLabel = (state: 'yes' | 'no' | 'unknown'): string => state === 'yes' ? 'Oui' : state === 'no' ? 'Non' : 'Inconnu';
const intentOriginLabel = (origin: EditorCoreIntent['interpretationOrigin']): string =>
  origin === 'user' ? 'Corrigé par toi' : origin === 'proposal' ? 'Proposition corrigible' : 'Fixture';

function stageLabel(stage: HopPropertyAdviceRequest['context']['stage']): string {
  const labels: Record<HopPropertyAdviceRequest['context']['stage'], string> = {
    planning: 'Planification', hotSide: 'Côté chaud', fermenting: 'Fermentation',
    conditioning: 'Garde / conditionnement', packaged: 'Conditionné', unknown: 'Inconnu',
  };
  return labels[stage];
}

function assertionLabel(assertion: HopAdviceAssertion): string {
  const state = assertion.state === 'reported' ? 'Rapporté' : assertion.state === 'measured' ? 'Mesuré'
    : assertion.state === 'planned' ? 'Prévu' : assertion.state === 'performed' ? 'Réalisé' : 'Inconnu';
  const value = assertion.value === null ? '' : ` · ${String(assertion.value)}${assertion.unit ? ` ${assertion.unit}` : ''}`;
  return `${assertion.statement} · ${state}${value}`;
}

function assertionSourceLabel(source: HopSource | undefined): string {
  if (!source) return 'Aucune source portée';
  return `${source.title} · ${source.author} · ${sourceKindLabels[source.kind]}`;
}

function sourceDraftReady(source: SourceDraft): boolean {
  if (!source.title.trim() || !source.author.trim()) return false;
  if (source.mode === 'personal') return !!source.reason.trim();
  if (source.mode !== 'external' || !source.kind || !source.reference.trim()) return false;
  const year = source.year.trim() ? Number(source.year) : null;
  return year === null || Number.isInteger(year) && year >= 0 && year <= 9999;
}

function sourceForAssertion(source: SourceDraft, assertionId: string): HopSource | null {
  if (!sourceDraftReady(source)) return null;
  const title = source.title.trim(), author = source.author.trim();
  if (source.mode === 'personal') return { title, author, year: null, kind: 'observation', reference: `local-declaration:${assertionId}`,
    locator: `Motif déclaré : ${source.reason.trim()}` };
  const year = source.year.trim() ? Number(source.year) : null;
  if (!source.kind) return null;
  return { title, author, year, kind: source.kind, reference: source.reference.trim(), ...(source.locator.trim() ? { locator: source.locator.trim() } : {}) };
}

function materialLabel(material: HopDecisionMaterial): string {
  const forms: Record<HopDecisionMaterial['form'], string> = { pelletT90: 'Pellets T-90', pelletT45: 'Pellets T-45',
    cryo: 'Lupuline concentrée', cone: 'Cônes', extract: 'Extrait', unknown: 'Forme non précisée' };
  return `${material.name} · ${forms[material.form]}`;
}

const uniqueMaterials = (rows: readonly HopDecisionMaterial[]): HopDecisionMaterial[] => [...new Map(rows.map((row) => [row.id, row])).values()];

function appendCurrentValues<T>(before: readonly T[], added: readonly T[], getId: (value: T) => string): T[] {
  const map = new Map(before.map((row) => [getId(row), row]));
  for (const row of added) if (!map.has(getId(row))) map.set(getId(row), row);
  return [...map.values()];
}

/** Phrase lisible de la lecture d’un terme : ce que c’est, de quoi il parle, ce qu’on veut en faire. */
function readingSentence(intent: EditorCoreIntent): string {
  const parts = [label(roleRows, intent.role), label(propertyRows, intent.property)];
  if (intent.direction) parts.push(label(directionRows, intent.direction));
  if (intent.investigation?.kind === COMPENSATION_KIND) parts.push('comparer des compensations perceptives');
  return parts.join(' · ');
}

function sourceInputs(value: SourceDraft, onChange: (next: SourceDraft) => void, prefix: string, disabled: boolean) {
  const aria = (text: string) => `${prefix} · ${text}`;
  return <div className="hvp-source-grid">
    <label><span>Provenance</span><select aria-label={aria('Mode de source')} value={value.mode} disabled={disabled}
      onChange={(event) => onChange({ ...value, mode: event.target.value as SourceMode, kind: '', reference: '', reason: '' })}>
      <option value="">À préciser</option><option value="external">Source externe</option><option value="personal">Déclaration personnelle locale</option>
    </select></label>
    {value.mode === 'external' ? <>
      <label><span>Type de source</span><select aria-label={aria('Type de source')} value={value.kind} disabled={disabled}
        onChange={(event) => onChange({ ...value, kind: event.target.value as HopSourceKind | '' })}>
        <option value="">À préciser</option>{sourceKinds.map((kind) => <option key={kind} value={kind}>{sourceKindLabels[kind]}</option>)}
      </select></label>
      <label><span>Titre</span><Input autoComplete="off" aria-label={aria('Titre de la source')} value={value.title} disabled={disabled}
        onChange={(event) => onChange({ ...value, title: event.target.value })} /></label>
      <label><span>Auteur</span><Input autoComplete="off" aria-label={aria('Auteur de la source')} value={value.author} disabled={disabled}
        onChange={(event) => onChange({ ...value, author: event.target.value })} /></label>
      <label><span>Année · facultative</span><Input autoComplete="off" aria-label={aria('Année de la source')} value={value.year} disabled={disabled}
        onChange={(event) => onChange({ ...value, year: event.target.value })} /></label>
      <label><span>Référence exacte</span><Input autoComplete="off" aria-label={aria('Référence exacte')} value={value.reference} disabled={disabled}
        onChange={(event) => onChange({ ...value, reference: event.target.value })} /></label>
    </> : null}
    {value.mode === 'personal' ? <>
      <label><span>Titre de la déclaration</span><Input autoComplete="off" aria-label={aria('Titre de la déclaration')} value={value.title} disabled={disabled}
        onChange={(event) => onChange({ ...value, title: event.target.value })} /></label>
      <label><span>Acteur</span><Input autoComplete="off" aria-label={aria('Acteur de la déclaration')} value={value.author} disabled={disabled}
        onChange={(event) => onChange({ ...value, author: event.target.value })} /></label>
      <label className="hvp-source-wide"><span>Motif</span><Textarea autoComplete="off" aria-label={aria('Motif de la déclaration')} rows={2} value={value.reason} disabled={disabled}
        onChange={(event) => onChange({ ...value, reason: event.target.value })} /></label>
      <p className="hvp-help hvp-source-wide">Une référence locale sera ajoutée à l’attestation lors du clic; aucune clé à inventer.</p>
    </> : null}
  </div>;
}

export function PropertyAdviceIntentEditorCore({ mode, request, candidatePolicy, materialChoices, onChangeIntent,
  onChangeCandidatePolicy, onSearchMaterials, onSelectMaterials, onChangeMaterials, onChangeAccess, onChangeAssertions, onAddIntent,
  disabled = false, sections, visibleIntentIds, lockInterpretationOrigin = false, intentLabels }: PropertyAdviceIntentEditorCoreProps) {
  const uid = useId().replace(/:/g, '');
  const v3 = mode === 'v3';
  const show = (section: EditorCoreSection): boolean => !sections || sections.includes(section);
  const cardFilter = visibleIntentIds ? new Set(visibleIntentIds) : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HopDecisionMaterial[]>([]);
  const [materialBusy, setMaterialBusy] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [editorNotice, setEditorNotice] = useState('');
  const [addIntentDraft, setAddIntentDraft] = useState<AddIntentDraft>(emptyAddIntentDraft);
  const [addIntentError, setAddIntentError] = useState('');
  const [addIntentPending, setAddIntentPending] = useState(false);
  const [recentAddFingerprints, setRecentAddFingerprints] = useState<string[]>([]);
  const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number; value: string } | null>(null);
  const addIntentIdRef = useRef<string | null>(null);
  const [accessDrafts, setAccessDrafts] = useState<Record<AccessScope, AccessCorrectionDraft>>({
    bulkBeer: emptyAccessCorrection(), sampling: emptyAccessCorrection(), separatePortion: emptyAccessCorrection(),
  });
  const [accessError, setAccessError] = useState('');
  const evidenceFamilies = useMemo(() => listHopIntentEvidenceFamilies(), []);
  const exactMaterials = useMemo(() => uniqueMaterials([...request.materials, ...materialChoices, ...searchResults]),
    [request.materials, materialChoices, searchResults]);
  const materialById = useMemo(() => new Map(exactMaterials.map((material) => [material.id, material])), [exactMaterials]);
  const missingCandidateIds = candidatePolicy.materialIds.filter((id) => !materialById.has(id));
  const exactFragment = addIntentDraft.fragment.trim();
  const addOccurrences = useMemo(() => exactOccurrences(request.originalQuestion, exactFragment), [request.originalQuestion, exactFragment]);
  const selectedOccurrence = addOccurrences[Math.min(addIntentDraft.occurrenceIndex, Math.max(0, addOccurrences.length - 1))] ?? null;
  const addIntentFingerprint = selectedOccurrence && addIntentDraft.property && addIntentDraft.role
    ? JSON.stringify([selectedOccurrence.start, selectedOccurrence.end, selectedOccurrence.text, addIntentDraft.property, addIntentDraft.role]) : '';
  const duplicateAddIntent = !!addIntentFingerprint && (recentAddFingerprints.includes(addIntentFingerprint)
    || request.propertyIntents.some((intent) => intent.property === addIntentDraft.property && intent.role === addIntentDraft.role
      && intent.sourceSpans.some((span) => span.start === selectedOccurrence!.start && span.end === selectedOccurrence!.end
        && span.text === selectedOccurrence!.text)));
  const issues = useMemo(() => v3 ? compensationIssues(request.propertyIntents) : [], [v3, request.propertyIntents]);
  const blockingIssueCount = issues.filter((issue) => issue.blocking).length;

  /* ---------- nouvelle intention : nature V3 et garde (rien n’est corrigé en douce) ---------- */
  const addAdmissible = v3 ? admissibleCompensationObservations(request.propertyIntents, null) : [];
  const addAdmissibleIds = new Set(addAdmissible.map((row) => row.id));
  const addCompensation = v3 && addIntentDraft.nature === 'compensation';
  const addCompensationActive = addCompensation && addIntentDraft.role === 'investigation';
  const addQuestionRoleDirectionIssue = v3 && !!addIntentDraft.role && (
    addIntentDraft.role === 'investigation' ? addIntentDraft.direction !== 'investigate' : addIntentDraft.direction === 'investigate');
  const addCompensationRoleIssue = addCompensation && !!addIntentDraft.role && addIntentDraft.role !== 'investigation';
  const addObservationIds = [...new Set(addIntentDraft.observationIds)];
  const addInadmissibleIds = addCompensationActive ? addObservationIds.filter((id) => !addAdmissibleIds.has(id)) : [];
  const addCompensationBlocks: string[] = [];
  if (addCompensationRoleIssue) {
    addCompensationBlocks.push('Tu avais choisi de comparer des compensations : remets « une question à examiner » ou choisis une question ouverte.');
  }
  if (addQuestionRoleDirectionIssue && !addCompensationRoleIssue) {
    addCompensationBlocks.push(addIntentDraft.role === 'investigation'
      ? 'Une question à examiner doit aussi porter la direction « l’examiner ».'
      : 'La direction « l’examiner » exige de lire ce terme comme une question à examiner.');
  }
  if (addCompensationActive && !addObservationIds.length) addCompensationBlocks.push('Choisis au moins un constat perçu à comparer.');
  if (addCompensationActive && addInadmissibleIds.length) addCompensationBlocks.push('Un constat choisi n’est plus un constat perçu : retire-le de la comparaison ou corrige ce terme.');
  if (addCompensationActive && isForbiddenCompensationMetric(addIntentDraft.metric)) {
    addCompensationBlocks.push(`Une comparaison de compensations porte sur une perception : « ${label(metricRows, addIntentDraft.metric)} » ne peut pas la qualifier.`);
  }

  function changeIntent(intent: EditorCoreIntent, change: Partial<EditorCoreIntent>) {
    onChangeIntent(intent.id, { ...intent, ...change });
  }

  function applyFix(ownerId: string, fix: CompensationFix) {
    if (disabled) return;
    const replacements = applyCompensationFix(request.propertyIntents, ownerId, fix);
    replacements.forEach((row) => onChangeIntent(row.id, row));
    if (replacements.length) setEditorNotice('Correction appliquée à la lecture à valider, à ta demande.');
  }

  function updateAddIntentDraft(change: Partial<AddIntentDraft>) {
    setAddIntentDraft((current) => ({ ...current, ...change }));
    setAddIntentError('');
  }

  function pickSelection() {
    if (!pendingSelection) return;
    const picked = selectionToFragment(request.originalQuestion, pendingSelection.value, pendingSelection.start, pendingSelection.end);
    if (!picked) {
      setAddIntentError('Ce passage n’a pas été retrouvé à l’identique dans la question (retour à la ligne ?). Tape-le dans le champ ci-dessous.');
      return;
    }
    updateAddIntentDraft(picked);
  }

  function toggleAddRelatedIntent(intentId: string, checked: boolean) {
    const existingIds = new Set(request.propertyIntents.map((intent) => intent.id));
    setAddIntentDraft((current) => {
      const retained = current.relatedIntentIds.filter((id) => existingIds.has(id));
      return { ...current, relatedIntentIds: checked ? [...new Set([...retained, intentId])] : retained.filter((id) => id !== intentId) };
    });
  }

  function appendAnnotatedIntent() {
    if (disabled || addIntentPending) return;
    if (!selectedOccurrence) {
      setAddIntentError(exactFragment ? 'Ce passage ne figure pas à l’identique dans la question originale.' : 'Choisis ou tape un passage exact non vide.');
      return;
    }
    if (!addIntentDraft.property || !addIntentDraft.role) {
      setAddIntentError('Dis ce que c’est et de quoi ce passage parle.');
      return;
    }
    if (!addIntentDraft.motive.trim()) {
      setAddIntentError('Explique en une phrase pourquoi ce passage corrige la lecture.');
      return;
    }
    if (duplicateAddIntent) {
      setAddIntentError('Ce passage porte déjà un terme de même nature et de même sujet. Corrige-le dans la liste.');
      return;
    }
    if (addCompensationBlocks.length) {
      setAddIntentError(addCompensationBlocks.join(' '));
      return;
    }
    setAddIntentPending(true);
    try {
      const id = addIntentIdRef.current ?? `property-intent:${crypto.randomUUID()}`;
      addIntentIdRef.current = id;
      const knownIntentIds = new Set(request.propertyIntents.map((intent) => intent.id));
      const knownAssertionIds = new Set(request.context.assertions.map((assertion) => assertion.id));
      const assertionIds = addIntentDraft.comparisonBasis === 'current'
        ? addIntentDraft.assertionIds.filter((assertionId) => knownAssertionIds.has(assertionId)) : [];
      const related = addIntentDraft.relatedIntentIds.filter((relatedId) => knownIntentIds.has(relatedId));
      const intent: EditorCoreIntent = {
        id,
        property: addIntentDraft.property,
        label: selectedOccurrence.text,
        ...(addIntentDraft.familyId ? { familyId: addIntentDraft.familyId } : {}),
        role: addIntentDraft.role,
        direction: addIntentDraft.direction || null,
        qualification: addIntentDraft.qualification.trim() || null,
        required: addIntentDraft.required,
        comparisonBasis: { kind: addIntentDraft.comparisonBasis, assertionIds },
        metric: addIntentDraft.metric,
        subject: { kind: addIntentDraft.subjectKind, label: addIntentDraft.subjectLabel.trim() || 'Sujet non précisé',
          materialId: null, sensoryContext: addIntentDraft.sensoryContext },
        sourceSpans: [structuredClone(selectedOccurrence)],
        interpretationOrigin: 'user',
        basis: addIntentDraft.motive.trim(),
        relatedIntentIds: [...new Set([...related, ...(addCompensationActive ? addObservationIds : [])])],
        ...(addCompensationActive ? { investigation: { kind: COMPENSATION_KIND, observationIntentIds: addObservationIds } } : {}),
      };
      onAddIntent(intent);
      setRecentAddFingerprints((current) => [...new Set([...current, addIntentFingerprint])]);
      setEditorNotice('Terme ajouté à la lecture à valider; rien n’est enregistré avant la nouvelle réponse.');
      setAddIntentError('');
      setAddIntentDraft(emptyAddIntentDraft());
      setPendingSelection(null);
      addIntentIdRef.current = null;
    } catch (error) {
      setAddIntentError(error instanceof Error ? error.message : 'Ce terme n’a pas été ajouté à la lecture.');
    } finally {
      setAddIntentPending(false);
    }
  }

  function toggleRelated(intent: EditorCoreIntent, relatedId: string, checked: boolean) {
    const knownIds = new Set(request.propertyIntents.map((row) => row.id));
    const missing = intent.relatedIntentIds.filter((id) => !knownIds.has(id));
    const current = intent.relatedIntentIds.filter((id) => knownIds.has(id));
    const next = checked ? [...new Set([...current, ...missing, relatedId])]
      : [...missing, ...current.filter((id) => id !== relatedId)];
    changeIntent(intent, { relatedIntentIds: next });
  }

  async function updatePolicyMaterials(nextIds: string[]) {
    if (!onSelectMaterials) { setSearchError('La reprise des fiches exactes n’est pas disponible ici; le périmètre reste inchangé.'); return; }
    setMaterialBusy(true); setSearchError(''); setEditorNotice('');
    try {
      const selectedIds = nextIds.filter((id) => materialById.has(id));
      const rows = (await onSelectMaterials(selectedIds)).filter((row) => selectedIds.includes(row.id));
      onChangeMaterials(appendCurrentValues(request.materials, rows, (row) => row.id));
      onChangeCandidatePolicy({ ...candidatePolicy, materialIds: [...new Set(nextIds)] });
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Les matières exactes n’ont pas pu être reprises.');
    } finally { setMaterialBusy(false); }
  }

  async function searchMaterials() {
    const query = searchQuery.trim();
    const exactScopeIds = [...candidatePolicy.materialIds];
    if (!onSearchMaterials || !query || !exactScopeIds.length || candidatePolicy.kind !== 'discover' || disabled || materialBusy) return;
    setMaterialBusy(true); setSearchError(''); setEditorNotice('');
    try {
      setSearchResults(uniqueMaterials(await onSearchMaterials(query, exactScopeIds)));
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'La recherche canonique a échoué.');
    } finally { setMaterialBusy(false); }
  }

  function updateAccessDraft(scope: AccessScope, change: Partial<AccessCorrectionDraft>) {
    setAccessDrafts((current) => ({ ...current, [scope]: { ...current[scope], ...change } }));
  }

  function correctAccess(scope: AccessScope) {
    const draft = accessDrafts[scope];
    if (!draft.state || !draft.basis.trim() || disabled) return;
    setAccessError('');
    try {
      if (draft.state === 'unknown') {
        onChangeAccess(scope, { state: 'unknown', basis: draft.basis.trim(), assertionIds: [] });
        setEditorNotice('Accès marqué inconnu dans la lecture à valider; aucune attestation n’a été créée.');
        setAccessDrafts((current) => ({ ...current, [scope]: emptyAccessCorrection() }));
        return;
      }
      if (!draft.statement.trim() || !sourceDraftReady(draft.source)) return;
      const assertionId = `property-access-assertion:${crypto.randomUUID()}`;
      const source = sourceForAssertion(draft.source, assertionId);
      if (!source) return;
      const assertion: HopAdviceAssertion = {
        id: assertionId, subject: scope, statement: draft.statement.trim(), state: 'reported',
        value: draft.state === 'yes', dimension: 'process', source,
      };
      onChangeAssertions([...request.context.assertions, assertion]);
      onChangeAccess(scope, { state: draft.state, basis: draft.basis.trim(), assertionIds: [assertionId] });
      setEditorNotice('Nouvelle attestation ajoutée à la lecture à valider; la sauvegarde dépend du parent.');
      setAccessDrafts((current) => ({ ...current, [scope]: emptyAccessCorrection() }));
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'La correction d’accès n’a pas été ajoutée à la lecture.');
    }
  }

  async function linkMaterial(materialId: string, failure: string): Promise<boolean> {
    if (request.materials.some((row) => row.id === materialId)) return true;
    if (!onSelectMaterials) { setSearchError('La reprise des fiches exactes n’est pas disponible ici.'); return false; }
    setMaterialBusy(true); setSearchError('');
    try {
      const rows = (await onSelectMaterials([materialId])).filter((row) => row.id === materialId);
      if (!rows.length) throw new Error('La matière canonique n’a pas renvoyé cet ID exact.');
      onChangeMaterials(appendCurrentValues(request.materials, rows, (row) => row.id));
      return true;
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : failure);
      return false;
    } finally { setMaterialBusy(false); }
  }

  async function selectSubjectMaterial(intent: EditorCoreIntent, materialId: string) {
    if (!materialId) { changeIntent(intent, { subject: { ...intent.subject, materialId: null } }); return; }
    if (!materialById.has(materialId)) return;
    if (await linkMaterial(materialId, 'Cette matière n’a pas pu être liée par son identité canonique.')) {
      changeIntent(intent, { subject: { ...intent.subject, materialId } });
    }
  }

  async function selectPartnerMaterial(intent: EditorCoreIntent, materialId: string) {
    if (!materialId) { changeIntent(intent, { partner: undefined }); return; }
    if (!materialById.has(materialId)) return;
    if (await linkMaterial(materialId, 'Cette relation matière n’a pas pu être liée par son identité exacte.')) {
      changeIntent(intent, { partner: { kind: 'material', id: materialId } });
    }
  }

  const assertionsById = new Map(request.context.assertions.map((assertion) => [assertion.id, assertion]));
  const knownMaterialIds = new Set(exactMaterials.map((material) => material.id));
  const accessSummary = accessScopes.map((scope) => `${scope.label} : ${stateLabel(request.context.access[scope.key].state)}`).join(' · ');

  /* ---------- question V3 sur une carte : nature, constats comparés, points à clarifier ---------- */
  function compensationFieldset(intent: EditorCoreIntent, number: number) {
    if (!v3 || (intent.role !== 'investigation' && !intent.investigation)) return null;
    const active = intent.investigation?.kind === COMPENSATION_KIND;
    const chosen = new Set(intent.investigation?.observationIntentIds ?? []);
    const admissible = admissibleCompensationObservations(request.propertyIntents, intent.id);
    const own = issues.filter((issue) => issue.intentId === intent.id);
    return <fieldset className="hvp-compensation">
      <legend>Nature de cette question</legend>
      <label className="hvp-check-line"><input type="radio" name={`${uid}-nature-${intent.id}`} checked={!active} disabled={disabled}
        aria-label={`Question ouverte · intention ${number}`}
        onChange={() => { if (active) applyFix(intent.id, { kind: 'clearQuestion' }); }} />
        <span>Une question ouverte à examiner</span></label>
      <label className="hvp-check-line"><input type="radio" name={`${uid}-nature-${intent.id}`} checked={active} disabled={disabled}
        aria-label={`Comparer des compensations perceptives · intention ${number}`}
        onChange={() => { if (!active) { onChangeIntent(intent.id, startCompensation(intent)); setEditorNotice(''); } }} />
        <span>Comparer des façons de compenser ce que je perçois</span></label>
      {active ? <>
        <p className="hvp-help">Tu ne demandes ni de baisser ni de choisir une amertume : la réponse comparera des compensations possibles d’un constat perçu.</p>
        {admissible.length ? <div className="hvp-chip-row" role="group" aria-label={`Constats perçus comparés · intention ${number}`}>
          {admissible.map((row) => <label className={`hvp-chip ${chosen.has(row.id) ? 'is-on' : ''}`} key={row.id}>
            <input type="checkbox" checked={chosen.has(row.id)} disabled={disabled} aria-label={`Comparer le constat ${row.label}`}
              onChange={(event) => onChangeIntent(intent.id, toggleCompensationObservation(intent, row.id, event.target.checked))} />
            <span>« {row.label} »</span>
          </label>)}
        </div> : <p className="hvp-warning" role="status">Aucun constat perçu dans cette lecture. Corrige d’abord un terme en « Ce que je constate » avec une perception (dégustation), ou ajoute-le depuis la question.</p>}
        <p className="hvp-help">Chaque constat coché est aussi relié à cette question. Décocher le retire de la comparaison sans défaire la relation.</p>
      </> : null}
      {own.map((issue, index) => <div className={issue.blocking ? 'hvp-issue is-blocking' : 'hvp-issue'} key={`${issue.code}-${index}`}>
        <p>{issue.blocking ? 'À clarifier · ' : 'À vérifier · '}{issue.message}</p>
        <div className="hvp-fix-row">{issue.fixes.map((option, fixIndex) => <button type="button" className="hvp-fix" key={fixIndex}
          disabled={disabled} onClick={() => applyFix(intent.id, option.fix)}>{option.label}</button>)}</div>
      </div>)}
    </fieldset>;
  }

  function renderIntentCard(intent: EditorCoreIntent, index: number) {
    const number = index + 1;
    const linkedAssertions = intent.comparisonBasis.assertionIds.map((id) => assertionsById.get(id)).filter((row): row is HopAdviceAssertion => !!row);
    const orphanAssertionIds = intent.comparisonBasis.assertionIds.filter((id) => !assertionsById.has(id));
    const knownIntentIds = new Set(request.propertyIntents.map((row) => row.id));
    const orphanRelatedIds = intent.relatedIntentIds.filter((id) => !knownIntentIds.has(id));
    const others = request.propertyIntents.filter((row) => row.id !== intent.id);
    const isKeepOrDecrease = intent.direction === 'keep' || intent.direction === 'decrease';
    const subjectHasUnavailableMaterial = intent.subject.materialId !== null && !knownMaterialIds.has(intent.subject.materialId);
    const partner = intent.partner;
    const partnerKind = partner?.kind ?? '';
    const displayedPartnerMaterialId = partner?.kind === 'material' ? partner.id : '';
    const partnerMaterialMissing = !!displayedPartnerMaterialId && !knownMaterialIds.has(displayedPartnerMaterialId);
    const roleHelp = roleRows.find((row) => row.value === intent.role)?.help;
    const advancedSummary = [`mesure : ${label(metricRows, intent.metric).toLocaleLowerCase('fr-CH')}`,
      `par rapport à : ${label(basisRows, intent.comparisonBasis.kind).toLocaleLowerCase('fr-CH')}`,
      `${intent.sourceSpans.length} passage${intent.sourceSpans.length === 1 ? '' : 's'} de la question`,
      intent.required ? 'essentiel' : 'facultatif'].join(' · ');
    const updatePartnerKind = (kind: string) => {
      if (!kind) { changeIntent(intent, { partner: undefined }); return; }
      if (kind === 'material') changeIntent(intent, { partner: { kind: 'material', id: partner?.kind === 'material' ? partner.id : '' } });
      else if (kind === 'observation') changeIntent(intent, { partner: { kind: 'observation', id: partner?.kind === 'observation' ? partner.id : '' } });
      else changeIntent(intent, { partner: { kind: 'freeContext', text: partner?.kind === 'freeContext' ? partner.text : '' } });
    };
    const updateIntentMaterialId = (materialId: string) => {
      if (materialId === intent.subject.materialId) return;
      if (!materialId) { changeIntent(intent, { subject: { ...intent.subject, materialId: null } }); return; }
      void selectSubjectMaterial(intent, materialId);
    };
    return <article className="hvp-intent-card" key={intent.id}>
      {cardFilter ? null : <header className="hvp-intent-heading"><div><span>Terme {number}</span><h5>« {intent.label || 'terme à préciser'} »</h5></div>
        <span className="hvp-property-tag">{intentOriginLabel(intent.interpretationOrigin)}</span>
      </header>}
      <p className="hvp-intent-reading"><span>Lu comme</span> {readingSentence(intent)}</p>

      <div className="hvp-intent-simple-grid">
        <label><span>Ce que c’est</span><select aria-label={`Rôle de l’intention ${number}`} value={intent.role} disabled={disabled}
          onChange={(event) => changeIntent(intent, { role: event.target.value as HopPropertyAdviceRole })}>
          {roleRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
        </select></label>
        <label><span>De quoi ça parle</span><select aria-label={`Propriété de l’intention ${number}`} value={intent.property} disabled={disabled}
          onChange={(event) => changeIntent(intent, { property: event.target.value as HopPropertyAdviceProperty })}>
          {propertyRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
        </select></label>
        <label><span>Ce que tu veux en faire</span><select aria-label={`Direction de l’intention ${number}`} value={intent.direction ?? ''} disabled={disabled}
          onChange={(event) => changeIntent(intent, { direction: (event.target.value || null) as EditorCoreIntent['direction'] })}>
          {directionRows.map((row) => <option key={row.value || 'none'} value={row.value}>{row.label}</option>)}
        </select></label>
        <label><span>Terme retenu</span><Input autoComplete="off" aria-label={`Terme exact de l’intention ${number}`} value={intent.label} disabled={disabled}
          onChange={(event) => changeIntent(intent, { label: event.target.value })} /></label>
      </div>
      {roleHelp ? <p className="hvp-help">{roleHelp}</p> : null}
      {isKeepOrDecrease && intent.comparisonBasis.kind !== 'current' ? <div className="hvp-warning" role="status">
        <p>« Garder » ou « en avoir moins » se compare à l’état actuel de la bière. Aucune mesure actuelle n’est créée.</p>
        <button type="button" className="hvp-fix" disabled={disabled}
          onClick={() => changeIntent(intent, { comparisonBasis: { kind: 'current', assertionIds: intent.comparisonBasis.assertionIds } })}>
          Comparer à l’état actuel</button>
      </div> : null}

      {others.length ? <fieldset className="hvp-relations hvp-relations-simple">
        <legend>Lié à · facultatif</legend>
        <div className="hvp-chip-row">{others.map((row) => {
          const checked = intent.relatedIntentIds.includes(row.id);
          return <label className={`hvp-chip ${checked ? 'is-on' : ''}`} key={row.id}>
            <input type="checkbox" aria-label={`Lier à ${row.label}`} checked={checked} disabled={disabled}
              onChange={(event) => toggleRelated(intent, row.id, event.target.checked)} />
            <span>« {row.label} »</span>
          </label>;
        })}</div>
        {orphanRelatedIds.length ? <details><summary>Références liées absentes, conservées ({orphanRelatedIds.length})</summary>{orphanRelatedIds.map((id) => intentLabels?.has(id)
          ? <span key={id}>« {intentLabels.get(id)} » · hors de la lecture active</span> : <code key={id}>{id}</code>)}</details> : null}
      </fieldset> : null}

      {compensationFieldset(intent, number)}

      <details className="hvp-intent-details">
        <summary>Précisions avancées <small>{advancedSummary}</small></summary>
        <div className="hvp-intent-secondary-grid">
          <label><span>Qualificatif exact · facultatif</span><Input autoComplete="off" aria-label={`Qualificatif de l’intention ${number}`} value={intent.qualification ?? ''} disabled={disabled}
            onChange={(event) => changeIntent(intent, { qualification: event.target.value || null })} /></label>
          <label><span>Comment c’est apprécié (métrique)</span><select aria-label={`Métrique de l’intention ${number}`} value={intent.metric} disabled={disabled}
            onChange={(event) => changeIntent(intent, { metric: event.target.value as HopPropertyAdviceMetric })}>
            {metricRows.map((row) => <option key={row.value} value={row.value}>{row.label}{v3 && intent.investigation && isForbiddenCompensationMetric(row.value) ? ' · incompatible avec la comparaison' : ''}</option>)}
          </select></label>
          <label><span>Par rapport à quoi</span><select aria-label={`Base de comparaison de l’intention ${number}`} value={intent.comparisonBasis.kind} disabled={disabled}
            onChange={(event) => {
              const kind = event.target.value as EditorCoreIntent['comparisonBasis']['kind'];
              if (kind !== 'current' && intent.comparisonBasis.assertionIds.length) {
                setEditorNotice(`Décoche d’abord les assertions liées au terme ${number}; elles restent conservées dans le contexte source.`);
                return;
              }
              setEditorNotice('');
              changeIntent(intent, { comparisonBasis: { kind, assertionIds: intent.comparisonBasis.assertionIds } });
            }}>
            {basisRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
          </select></label>
          <label className="hvp-check-line"><input type="checkbox" aria-label={`Intention ${number} essentielle`} checked={intent.required} disabled={disabled}
            onChange={(event) => changeIntent(intent, { required: event.target.checked })} /><span>Essentiel à la réponse</span></label>
          {lockInterpretationOrigin ? null : <label><span>Origine de l’interprétation</span><select aria-label={`Origine de l’intention ${number}`} value={intent.interpretationOrigin} disabled={disabled}
            onChange={(event) => changeIntent(intent, { interpretationOrigin: event.target.value as EditorCoreIntent['interpretationOrigin'] })}>
            <option value="user">Utilisateur</option><option value="proposal">Proposition</option><option value="fixture">Fixture</option>
          </select></label>}
          <label className="hvp-field-wide"><span>Motif de cette interprétation</span><Textarea autoComplete="off" aria-label={`Motif de l’intention ${number}`} rows={2} value={intent.basis} disabled={disabled}
            onChange={(event) => changeIntent(intent, { basis: event.target.value })} /></label>
          <label><span>Sujet</span><select aria-label={`Sujet de l’intention ${number}`} value={intent.subject.kind} disabled={disabled}
            onChange={(event) => {
              const kind = event.target.value as HopPropertyAdviceSubjectKind;
              if (kind !== 'material' && intent.subject.materialId !== null) {
                setEditorNotice('Ce terme conserve une matière liée. Délie-la explicitement avant de changer le type de sujet.');
                return;
              }
              setEditorNotice(''); changeIntent(intent, { subject: { ...intent.subject, kind } });
            }}>
            {subjectRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
          </select></label>
          <label><span>Libellé du sujet</span><Input autoComplete="off" aria-label={`Libellé du sujet ${number}`} value={intent.subject.label} disabled={disabled}
            onChange={(event) => changeIntent(intent, { subject: { ...intent.subject, label: event.target.value } })} /></label>
          <label><span>Contexte de dégustation</span><select aria-label={`Contexte sensoriel de l’intention ${number}`} value={intent.subject.sensoryContext} disabled={disabled}
            onChange={(event) => changeIntent(intent, { subject: { ...intent.subject, sensoryContext: event.target.value as HopPropertyAdviceSensoryContext } })}>
            {sensoryContextRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
          </select></label>
          {intent.subject.kind === 'material' || intent.subject.materialId !== null ? <label className="hvp-field-wide">
            <span>Matière exacte liée · facultative</span><select aria-label={`Matière exacte du sujet ${number}`} value={intent.subject.materialId ?? ''} disabled={disabled || materialBusy}
              onChange={(event) => updateIntentMaterialId(event.target.value)}>
              <option value="">Aucune identité matière liée</option>
              {intent.subject.materialId && subjectHasUnavailableMaterial ? <option value={intent.subject.materialId}>Matière déjà liée, non chargée</option> : null}
              {exactMaterials.map((material) => <option key={material.id} value={material.id}>{materialLabel(material)}</option>)}
            </select>
          </label> : null}
          <label className="hvp-field-wide"><span>Famille sensorielle du référentiel · facultative</span><select aria-label={`Famille de l’intention ${number}`} value={intent.familyId ?? ''} disabled={disabled}
            onChange={(event) => changeIntent(intent, { familyId: event.target.value || undefined })}>
            <option value="">Aucune famille résolue</option>
            {intent.familyId && !evidenceFamilies.some((family) => family.id === intent.familyId)
              ? <option value={intent.familyId}>Famille liée non disponible dans ce référentiel</option> : null}
            {evidenceFamilies.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
          </select></label>
          <label><span>Comparé à (matière, observation ou contexte)</span><select aria-label={`Type de relation ${number}`} value={partnerKind} disabled={disabled}
            onChange={(event) => updatePartnerKind(event.target.value)}>
            <option value="">Rien</option><option value="material">Une matière</option><option value="observation">Une observation</option><option value="freeContext">Un contexte libre</option>
          </select></label>
          {partner?.kind === 'material' ? <label><span>Matière exacte associée</span><select aria-label={`Matière associée à l’intention ${number}`} value={partner.id} disabled={disabled || materialBusy}
            onChange={(event) => void selectPartnerMaterial(intent, event.target.value)}>
            <option value="">Choisir une matière chargée</option>
            {partnerMaterialMissing ? <option value={partner.id}>Matière associée non chargée</option> : null}
            {exactMaterials.map((material) => <option key={material.id} value={material.id}>{materialLabel(material)}</option>)}
          </select></label> : null}
          {partner?.kind === 'observation' ? <label><span>Référence exacte de l’observation associée</span><Input autoComplete="off" aria-label={`Référence de l’observation liée ${number}`} value={partner.id} disabled={disabled}
            onChange={(event) => changeIntent(intent, { partner: { ...partner, id: event.target.value } })} /></label> : null}
          {partner?.kind === 'freeContext' ? <>
            <label><span>Contexte lié</span><Input autoComplete="off" aria-label={`Contexte lié ${number}`} value={partner.text} disabled={disabled}
              onChange={(event) => changeIntent(intent, { partner: { ...partner, text: event.target.value } })} /></label>
            <label><span>Précision de contexte · facultative</span><Input autoComplete="off" aria-label={`Précision du contexte lié ${number}`} value={partner.context ?? ''} disabled={disabled}
              onChange={(event) => changeIntent(intent, { partner: { ...partner, context: event.target.value || undefined } })} /></label>
          </> : null}
        </div>

        {intent.comparisonBasis.kind === 'current' ? <fieldset className="hvp-assertions">
          <legend>Assertions liées à l’état actuel · aucune sélection automatique</legend>
          {request.context.assertions.length ? request.context.assertions.map((assertion) => <label className="hvp-check-line" key={assertion.id}>
            <input type="checkbox" aria-label={`Assertion ${assertion.subject}`} checked={intent.comparisonBasis.assertionIds.includes(assertion.id)} disabled={disabled}
              onChange={(event) => {
                const selected = new Set(intent.comparisonBasis.assertionIds);
                if (event.target.checked) selected.add(assertion.id); else selected.delete(assertion.id);
                const known = new Set(request.context.assertions.map((row) => row.id));
                const missing = intent.comparisonBasis.assertionIds.filter((id) => !known.has(id));
                changeIntent(intent, { comparisonBasis: { kind: 'current', assertionIds: [...new Set([...missing, ...selected])] } });
              }} />
            <span>{assertionLabel(assertion)}</span>
          </label>) : <p>Aucune assertion transmise. La base actuelle reste inconnue.</p>}
          {orphanAssertionIds.length ? <details><summary>Références d’assertions absentes, conservées</summary>{orphanAssertionIds.map((id) => <code key={id}>{id}</code>)}</details> : null}
        </fieldset> : <p className="hvp-help">{intent.comparisonBasis.kind === 'qualitativeTarget'
          ? 'La cible reste qualitative; elle n’implique pas une mesure actuelle.' : 'Aucune base actuelle n’est ajoutée à ce terme.'}</p>}

        <details className="hvp-spans">
          <summary>Passages exacts de la question</summary>
          {intent.sourceSpans.length ? intent.sourceSpans.map((span, spanIndex) => <blockquote key={`${span.start}:${span.end}:${spanIndex}`}>
            <q>{span.text}</q><small>Position {span.start}–{span.end} · offsets du texte original</small>
          </blockquote>) : <p>Aucun passage exact transmis; aucun texte n’est reparsé ici.</p>}
        </details>

        <details className="hvp-exact-intent">
          <summary>Références exactes et partenaire</summary>
          <code>ID de l’intention · {intent.id}</code>
          <code>Valeurs · {intent.property} · {intent.role} · {intent.direction ?? 'sans direction'} · {intent.metric}</code>
          {intent.investigation ? <code>Question · {intent.investigation.kind} · {intent.investigation.observationIntentIds.join(', ') || 'aucun constat'}</code> : null}
          {intent.familyId ? <code>Famille · {intent.familyId}</code> : null}
          {intent.subject.materialId ? <code>Matière sujet · {intent.subject.materialId}</code> : null}
          {partner?.kind === 'material' ? <code>Matière liée · {partner.id}{partner.additionId ? ` · ligne ${partner.additionId}` : ''}</code> : null}
          {partner?.kind === 'observation' ? <><code>Observation liée · {partner.id}</code>
            {partner.descriptions?.map((description, descIndex) => <span key={`${description.source.reference}:${descIndex}`}>
              {description.text} · {description.context} · <code>{description.source.reference}</code>
            </span>)}</> : null}
          {partner?.kind === 'freeContext' && partner.source ? <span>Source du contexte lié · {partner.source.title} · {partner.source.author} · <code>{partner.source.reference}</code></span> : null}
          {linkedAssertions.map((assertion) => <code key={assertion.id}>Assertion liée · {assertion.id}</code>)}
          {intent.sourceSpans.map((span, spanIndex) => <code key={`span:${span.start}:${spanIndex}`}>Fragment · {span.start}–{span.end}</code>)}
        </details>
      </details>
    </article>;
  }

  const addRelatedForced = new Set(addCompensationActive ? addObservationIds : []);

  return <section className="hvp-intent-editor" aria-labelledby={show('header') ? `${uid}-title` : undefined} aria-busy={materialBusy}>
    {show('header') ? <header className="hvp-editor-header">
      <div><p className="hvp-eyebrow">Correction de lecture · {v3 ? 'V3' : 'V2'}</p>
        <h3 id={`${uid}-title`}>Ce que j’ai compris de ta question</h3>
        <p>Corrige un terme en trois gestes : le terme retenu, ce que c’est, ce à quoi il est lié. Les précisions de mesure, de sujet et de preuve restent sous chaque terme. Rien n’est enregistré ni appliqué avant la nouvelle réponse.</p>
      </div>
      <span className="hvp-count">{request.propertyIntents.length} terme{request.propertyIntents.length === 1 ? '' : 's'}</span>
    </header> : null}

    {editorNotice ? <p className="hvp-notice" role="status">{editorNotice}</p> : null}
    {searchError ? <p className="hvp-error" role="alert">{searchError}</p> : null}
    {accessError ? <p className="hvp-error" role="alert">{accessError}</p> : null}
    {blockingIssueCount ? <p className="hvp-error" role="status">
      {blockingIssueCount} point{blockingIssueCount === 1 ? '' : 's'} à clarifier dans une question de comparaison; la nouvelle lecture attend ton choix.</p> : null}

    {show('context') ? <details className="hvp-context-readonly">
      <summary>Question, stade et assertions transmis · lecture seule</summary>
      <div className="hvp-readonly-block"><b>Question originale</b><p>{request.originalQuestion}</p>
        <b>Interprétation actuelle · {request.interpretation.origin === 'user' ? 'utilisateur' : 'proposition'}</b>
        <p>{request.interpretation.text}</p>
        <b>Stade transmis · {stageLabel(request.context.stage)}</b><p>{request.context.stageBasis}</p>
      </div>
      <div className="hvp-assertion-list">
        <b>Assertions préparées ou ajoutées à cette lecture · {request.context.assertions.length}</b>
        {request.context.assertions.map((assertion) => <article key={assertion.id}>
          <strong>{assertionLabel(assertion)}</strong><span>Sujet exact · {assertion.subject}</span>
          <details><summary>Source et identité exactes</summary>
            <code>{assertion.id}</code><span>{assertionSourceLabel(assertion.source)}</span>
            {assertion.source ? <><code>{assertion.source.reference}</code>{assertion.source.locator ? <span>{assertion.source.locator}</span> : null}</> : null}
          </details>
        </article>)}
        {!request.context.assertions.length ? <p>Aucune assertion transmise; aucune mesure n’est créée par l’éditeur.</p> : null}
      </div>
    </details> : null}

    {show('intents') ? cardFilter ? <div className="hvp-intents">
      {request.propertyIntents.map((intent, index) => cardFilter.has(intent.id) ? renderIntentCard(intent, index) : null)}
    </div> : <section className="hvp-intents" aria-labelledby={`${uid}-intents-title`}>
      <div className="hvp-section-heading"><div><h4 id={`${uid}-intents-title`}>Termes lus dans la question</h4>
        <p>Le passage original reste mot pour mot. Une cible, un constat, une mesure et une question restent distincts.</p></div></div>
      {request.propertyIntents.map(renderIntentCard)}
      {!request.propertyIntents.length ? <p className="hvp-empty">Aucun terme reçu; l’éditeur n’en invente pas.</p> : null}
    </section> : null}

    {show('add') ? <details className="hvp-add-intent">
      <summary>Ajouter un terme oublié, depuis un passage exact de la question</summary>
      <div className="hvp-add-intent-form">
        <div className="hvp-step">
          <p className="hvp-step-title">1 · Choisis le passage</p>
          <label className="hvp-field-wide"><span>Sélectionne des mots dans ta question</span>
            <Textarea className="hvp-question-select" readOnly rows={3} value={request.originalQuestion} disabled={disabled || addIntentPending}
              aria-label="Question originale · sélectionner un passage"
              onSelect={(event) => {
                const target = event.currentTarget;
                setPendingSelection(target.selectionStart !== target.selectionEnd
                  ? { start: target.selectionStart, end: target.selectionEnd, value: target.value } : null);
              }} />
          </label>
          <button type="button" className="hvp-secondary" disabled={disabled || addIntentPending || !pendingSelection} onClick={pickSelection}>
            Utiliser le passage sélectionné</button>
          <label className="hvp-field-wide"><span>ou tape le passage exact</span>
            <Input autoComplete="off" aria-label="Fragment exact à annoter" value={addIntentDraft.fragment} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ fragment: event.target.value, occurrenceIndex: 0 })} />
          </label>
          {addOccurrences.length > 1 ? <label className="hvp-field-wide"><span>Ce passage revient plusieurs fois : lequel ?</span>
            <select aria-label="Occurrence du fragment exact" value={addIntentDraft.occurrenceIndex} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ occurrenceIndex: Number(event.target.value) })}>
              {addOccurrences.map((span, index) => <option key={`${span.start}:${span.end}`} value={index}>
                Occurrence {index + 1} · {occurrenceContext(request.originalQuestion, span)}
              </option>)}
            </select>
          </label> : null}
          <div className="hvp-add-intent-preview" aria-live="polite">
            {selectedOccurrence ? <><span>Passage retenu dans la question</span><p>{occurrenceContext(request.originalQuestion, selectedOccurrence)}</p></>
              : <p>{exactFragment ? 'Aucune occurrence exacte trouvée dans la question.' : 'Aucun passage choisi.'}</p>}
          </div>
        </div>

        <div className="hvp-step">
          <p className="hvp-step-title">2 · Dis ce que c’est</p>
          <div className="hvp-add-intent-grid">
            <label><span>Ce que c’est</span><select aria-label="Rôle de la nouvelle intention" value={addIntentDraft.role} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ role: event.target.value as NewIntentRole })}>
              <option value="">À préciser</option>{roleRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select></label>
            <label><span>De quoi ça parle</span><select aria-label="Propriété de la nouvelle intention" value={addIntentDraft.property} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ property: event.target.value as NewIntentProperty })}>
              <option value="">À préciser</option>{propertyRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select></label>
            <label><span>Ce que tu veux en faire</span><select aria-label="Direction de la nouvelle intention" value={addIntentDraft.direction} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ direction: event.target.value as NewIntentDirection })}>
              {directionRows.map((row) => <option key={row.value || 'none'} value={row.value}>{row.label}</option>)}
            </select></label>
          </div>
          {addIntentDraft.role ? <p className="hvp-help">{roleRows.find((row) => row.value === addIntentDraft.role)?.help}</p> : null}
          {addCompensationRoleIssue ? <div className="hvp-issue is-blocking" role="status">
            <p>À clarifier · Une comparaison de compensations est portée par une question à examiner.</p>
            <div className="hvp-fix-row"><button type="button" className="hvp-fix" disabled={disabled || addIntentPending}
              onClick={() => updateAddIntentDraft({ role: 'investigation', direction: 'investigate' })}>Lire comme une question à examiner</button>
              <button type="button" className="hvp-fix" disabled={disabled || addIntentPending}
                onClick={() => updateAddIntentDraft({ nature: 'open', observationIds: [] })}>Garder une question ouverte</button></div>
          </div> : addQuestionRoleDirectionIssue ? <div className="hvp-issue is-blocking" role="status">
            <p>À clarifier · {addIntentDraft.role === 'investigation'
              ? 'Une question à examiner doit porter la direction « l’examiner ».'
              : 'La direction « l’examiner » exige de lire ce terme comme une question à examiner.'}</p>
            <div className="hvp-fix-row"><button type="button" className="hvp-fix" disabled={disabled || addIntentPending}
              onClick={() => updateAddIntentDraft(addIntentDraft.role === 'investigation'
                ? { direction: 'investigate' } : { role: 'investigation', direction: 'investigate' })}>
              {addIntentDraft.role === 'investigation' ? 'L’examiner' : 'Lire comme une question à examiner'}</button></div>
          </div> : null}
          {v3 && (addIntentDraft.role === 'investigation' || addCompensation) ? <fieldset className="hvp-compensation">
            <legend>Nature de cette question</legend>
            <label className="hvp-check-line"><input type="radio" name={`${uid}-add-nature`} checked={!addCompensation} disabled={disabled || addIntentPending}
              aria-label="Nouvelle question ouverte" onChange={() => updateAddIntentDraft({ nature: 'open', observationIds: [] })} />
              <span>Une question ouverte à examiner</span></label>
            <label className="hvp-check-line"><input type="radio" name={`${uid}-add-nature`} checked={addCompensation} disabled={disabled || addIntentPending}
              aria-label="Nouvelle comparaison de compensations perceptives" onChange={() => updateAddIntentDraft({ nature: 'compensation' })} />
              <span>Comparer des façons de compenser ce que je perçois</span></label>
            {addCompensation ? <>
              <p className="hvp-help">Ni une baisse ni un choix d’amertume : la réponse comparera des compensations possibles d’un constat perçu.</p>
              {addAdmissible.length ? <div className="hvp-chip-row" role="group" aria-label="Constats perçus à comparer">
                {addAdmissible.map((row) => <label className={`hvp-chip ${addObservationIds.includes(row.id) ? 'is-on' : ''}`} key={row.id}>
                  <input type="checkbox" checked={addObservationIds.includes(row.id)} disabled={disabled || addIntentPending}
                    aria-label={`Comparer le constat ${row.label} dans la nouvelle question`}
                    onChange={(event) => updateAddIntentDraft({ observationIds: event.target.checked
                      ? [...new Set([...addIntentDraft.observationIds, row.id])]
                      : addIntentDraft.observationIds.filter((id) => id !== row.id) })} />
                  <span>« {row.label} »</span>
                </label>)}
              </div> : <p className="hvp-warning" role="status">Aucun constat perçu dans cette lecture : corrige d’abord un terme en « Ce que je constate » avec une perception (dégustation).</p>}
              {addInadmissibleIds.map((id) => {
                const row = request.propertyIntents.find((intent) => intent.id === id);
                return <div className="hvp-issue is-blocking" key={id}><p>À clarifier · « {row?.label ?? id} » n’est plus un constat perçu.</p>
                  <div className="hvp-fix-row"><button type="button" className="hvp-fix"
                    onClick={() => updateAddIntentDraft({ observationIds: addIntentDraft.observationIds.filter((value) => value !== id) })}>
                    Le retirer de la comparaison</button></div></div>;
              })}
              {addCompensationActive && isForbiddenCompensationMetric(addIntentDraft.metric) ? <div className="hvp-issue is-blocking">
                <p>À clarifier · Une comparaison de compensations porte sur une perception : « {label(metricRows, addIntentDraft.metric)} » ne peut pas la qualifier. Ta sélection est gardée jusqu’à ton choix.</p>
                <div className="hvp-fix-row">
                  <button type="button" className="hvp-fix" onClick={() => updateAddIntentDraft({ metric: 'sensory' })}>Perception (dégustation)</button>
                  <button type="button" className="hvp-fix" onClick={() => updateAddIntentDraft({ metric: 'unspecified' })}>Métrique non précisée</button>
                </div></div> : null}
            </> : null}
          </fieldset> : null}
        </div>

        <div className="hvp-step">
          <p className="hvp-step-title">3 · Pourquoi</p>
          <label className="hvp-field-wide"><span>Motif de cette correction</span><Textarea autoComplete="off" aria-label="Motif de la nouvelle intention"
            rows={2} value={addIntentDraft.motive} disabled={disabled || addIntentPending} placeholder="Ex. : « fruité » parle de l’arôme que je veux obtenir."
            onChange={(event) => updateAddIntentDraft({ motive: event.target.value })} /></label>
          {request.propertyIntents.length ? <fieldset className="hvp-add-intent-relations">
            <legend>Lié à · facultatif</legend>
            <div className="hvp-chip-row">{request.propertyIntents.map((intent) => {
              const forced = addRelatedForced.has(intent.id);
              const checked = forced || addIntentDraft.relatedIntentIds.includes(intent.id);
              return <label className={`hvp-chip ${checked ? 'is-on' : ''}`} key={intent.id} title={forced ? 'Relié parce qu’il est comparé' : undefined}>
                <input type="checkbox" aria-label={`Nouvelle intention liée à ${intent.label}`} checked={checked}
                  disabled={disabled || addIntentPending || forced} onChange={(event) => toggleAddRelatedIntent(intent.id, event.target.checked)} />
                <span>« {intent.label} »{forced ? ' · comparé' : ''}</span>
              </label>;
            })}</div>
          </fieldset> : <p className="hvp-help">Aucun autre terme n’est disponible pour une relation.</p>}
        </div>

        <details className="hvp-add-advanced">
          <summary>Précisions avancées · facultatives</summary>
          <div className="hvp-add-intent-grid">
            <label><span>Qualificatif exact · facultatif</span><Input autoComplete="off" aria-label="Qualificatif de la nouvelle intention"
              value={addIntentDraft.qualification} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ qualification: event.target.value })} /></label>
            <label><span>Comment c’est apprécié (métrique)</span><select aria-label="Métrique de la nouvelle intention" value={addIntentDraft.metric} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ metric: event.target.value as HopPropertyAdviceMetric })}>
              {metricRows.map((row) => <option key={row.value} value={row.value}>{row.label}{addCompensationActive && isForbiddenCompensationMetric(row.value) ? ' · incompatible avec la comparaison' : ''}</option>)}
            </select></label>
            <label><span>Par rapport à quoi</span><select aria-label="Base de comparaison de la nouvelle intention"
              value={addIntentDraft.comparisonBasis} disabled={disabled || addIntentPending}
              onChange={(event) => {
                const kind = event.target.value as EditorCoreIntent['comparisonBasis']['kind'];
                updateAddIntentDraft({ comparisonBasis: kind, ...(kind === 'current' ? {} : { assertionIds: [] }) });
              }}>
              {basisRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select></label>
            <label><span>Sujet</span><select aria-label="Sujet de la nouvelle intention" value={addIntentDraft.subjectKind} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ subjectKind: event.target.value as HopPropertyAdviceSubjectKind })}>
              {subjectRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select></label>
            <label><span>Libellé du sujet</span><Input autoComplete="off" aria-label="Libellé du sujet de la nouvelle intention"
              value={addIntentDraft.subjectLabel} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ subjectLabel: event.target.value })} /></label>
            <label><span>Contexte de dégustation</span><select aria-label="Contexte sensoriel de la nouvelle intention"
              value={addIntentDraft.sensoryContext} disabled={disabled || addIntentPending}
              onChange={(event) => updateAddIntentDraft({ sensoryContext: event.target.value as HopPropertyAdviceSensoryContext })}>
              {sensoryContextRows.map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select></label>
            <label><span>Famille · facultative</span><select aria-label="Famille de la nouvelle intention" value={addIntentDraft.familyId}
              disabled={disabled || addIntentPending} onChange={(event) => updateAddIntentDraft({ familyId: event.target.value })}>
              <option value="">Aucune famille attribuée</option>{evidenceFamilies.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
            </select></label>
            <label className="hvp-check-line"><input type="checkbox" aria-label="Nouvelle intention essentielle" checked={addIntentDraft.required}
              disabled={disabled || addIntentPending} onChange={(event) => updateAddIntentDraft({ required: event.target.checked })} />
              <span>Essentiel à la réponse</span></label>
          </div>
          {addIntentDraft.comparisonBasis === 'current' ? <fieldset className="hvp-add-intent-relations">
            <legend>Assertions existantes de l’état actuel · aucune sélection automatique</legend>
            {request.context.assertions.length ? request.context.assertions.map((assertion) => <label className="hvp-check-line" key={assertion.id}>
              <input type="checkbox" aria-label={`Assertion à relier · ${assertion.subject}`} checked={addIntentDraft.assertionIds.includes(assertion.id)}
                disabled={disabled || addIntentPending} onChange={(event) => updateAddIntentDraft({ assertionIds: event.target.checked
                  ? [...new Set([...addIntentDraft.assertionIds, assertion.id])]
                  : addIntentDraft.assertionIds.filter((id) => id !== assertion.id) })} />
              <span>{assertionLabel(assertion)}</span>
            </label>) : <p>Aucune assertion fournie. L’état reste inconnu; aucune mesure ne sera créée.</p>}
          </fieldset> : null}
        </details>

        {addIntentDraft.role === 'measurement' ? <p className="hvp-warning" role="status">
          Une valeur mesurée ne crée pas sa valeur : elle doit ensuite citer une assertion compatible avec sa métrique et son unité.
        </p> : null}
        {duplicateAddIntent ? <p className="hvp-warning" role="status">Ce passage porte déjà un terme de même nature et de même sujet.</p> : null}
        {addIntentError ? <p className="hvp-error" role="alert">{addIntentError}</p> : null}
        <button type="button" className="hvp-primary" aria-label="Ajouter cette intention à la lecture"
          disabled={disabled || addIntentPending || !selectedOccurrence || !addIntentDraft.property || !addIntentDraft.role
            || !addIntentDraft.motive.trim() || duplicateAddIntent || addCompensationBlocks.length > 0} onClick={appendAnnotatedIntent}>
          {addIntentPending ? 'Ajout…' : 'Ajouter ce terme à ma lecture'}
        </button>
      </div>
    </details> : null}

    {show('policy') ? <details className="hvp-candidate-policy">
      <summary>Matières prises en compte <small>{candidatePolicy.kind === 'explicit' ? 'liste explicite' : 'recherche dans un périmètre exact'} · {candidatePolicy.materialIds.length} identité{candidatePolicy.materialIds.length === 1 ? '' : 's'}{missingCandidateIds.length ? ` dont ${missingCandidateIds.length} non chargée${missingCandidateIds.length === 1 ? '' : 's'}` : ''}</small></summary>
      <p className="hvp-help">Les matières chargées ne deviennent pas candidates automatiquement. Les identités absentes restent dans le périmètre demandé.</p>
      <div className="hvp-policy-grid">
        <label><span>Mode de sélection</span><select aria-label="Candidate policy" value={candidatePolicy.kind} disabled={disabled}
          onChange={(event) => onChangeCandidatePolicy({ ...candidatePolicy, kind: event.target.value as HopPropertyAdviceCandidatePolicy['kind'] })}>
          <option value="explicit">Périmètre explicite</option><option value="discover" disabled={!candidatePolicy.materialIds.length}>Rechercher dans le périmètre exact</option>
        </select></label>
        <label className="hvp-field-wide"><span>Pourquoi ce périmètre ?</span><Textarea autoComplete="off" aria-label="Motif du périmètre candidat" rows={2}
          value={candidatePolicy.basis} disabled={disabled} onChange={(event) => onChangeCandidatePolicy({ ...candidatePolicy, basis: event.target.value })} /></label>
      </div>
      <fieldset className="hvp-material-scope" disabled={disabled || materialBusy}>
        <legend>{candidatePolicy.kind === 'explicit' ? 'Matières incluses explicitement' : 'Identités exactes couvertes par la recherche'}</legend>
        {exactMaterials.length ? <div className="hvp-material-list">{exactMaterials.map((material) => <label className="hvp-material-option" key={material.id}>
          <input type="checkbox" aria-label={`Matière candidate ${material.name}`} checked={candidatePolicy.materialIds.includes(material.id)}
            onChange={(event) => void updatePolicyMaterials(event.target.checked
              ? [...new Set([...candidatePolicy.materialIds, material.id])]
              : candidatePolicy.materialIds.filter((id) => id !== material.id))} />
          <span>{materialLabel(material)}</span>
        </label>)}</div> : <p>Aucune fiche canonique chargée. Une recherche exige d’abord un périmètre exact déclaré.</p>}
        {missingCandidateIds.length ? <details className="hvp-missing-materials"><summary>{missingCandidateIds.length} identité{missingCandidateIds.length === 1 ? '' : 's'} demandée{missingCandidateIds.length === 1 ? '' : 's'} non chargée{missingCandidateIds.length === 1 ? '' : 's'}, conservée{missingCandidateIds.length === 1 ? '' : 's'}</summary>
          {missingCandidateIds.map((id) => <code key={id}>{id}</code>)}
        </details> : null}
        <details className="hvp-material-ids"><summary>Voir les IDs exacts des matières sélectionnées</summary>
          {candidatePolicy.materialIds.map((id) => <code key={id}>{id}{!materialById.has(id) ? ' · non chargée' : ''}</code>)}
          {!candidatePolicy.materialIds.length ? <p>Aucune identité sélectionnée.</p> : null}
        </details>
      </fieldset>
      {candidatePolicy.kind === 'discover' ? <div className="hvp-search-row">
        <label className="hvp-search-field"><span>Rechercher dans ce périmètre</span><Input type="search" autoComplete="off" aria-label="Recherche de matière canonique"
          value={searchQuery} disabled={disabled || materialBusy || !candidatePolicy.materialIds.length || !onSearchMaterials}
          onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchMaterials(); } }} /></label>
        <button type="button" disabled={disabled || materialBusy || !candidatePolicy.materialIds.length || !searchQuery.trim() || !onSearchMaterials} onClick={() => void searchMaterials()}>
          {materialBusy ? 'Recherche…' : 'Rechercher'}
        </button>
      </div> : <p className="hvp-help">« Explicite » garde exactement les IDs ci-dessus, y compris une liste vide.</p>}
      {candidatePolicy.kind === 'discover' && !candidatePolicy.materialIds.length ? <p className="hvp-warning" role="status">
        Déclare d’abord au moins une identité exacte à explorer; « rechercher » ne signifie jamais tout le catalogue.
      </p> : null}
      {searchResults.length ? <p className="hvp-search-result-note" role="status">
        {searchResults.length} fiche{searchResults.length === 1 ? '' : 's'} canonique{searchResults.length === 1 ? '' : 's'} reçue{searchResults.length === 1 ? '' : 's'}; rien n’est sélectionné automatiquement.
      </p> : null}
    </details> : null}

    {show('access') ? <details className="hvp-access">
      <summary>Accès aux portions <small>{accessSummary}</small></summary>
      <p className="hvp-help">Le contexte préparé reste en lecture seule. Une correction crée une nouvelle assertion sourcée; elle ne crée pas d’autorisation physique.</p>
      {accessScopes.map((scope) => {
        const access = request.context.access[scope.key];
        const linked = request.context.assertions.filter((assertion) => access.assertionIds.includes(assertion.id));
        const draft = accessDrafts[scope.key];
        const canCorrect = !!draft.state && !!draft.basis.trim() && (draft.state === 'unknown'
          || !!draft.statement.trim() && sourceDraftReady(draft.source));
        return <article className="hvp-access-card" key={scope.key}>
          <header><strong>{scope.label}</strong><span className={`hvp-access-state is-${access.state}`}>{stateLabel(access.state)}</span></header>
          <p>{access.basis}</p>
          {linked.length ? <details className="hvp-access-prepared">
            <summary>{linked.length} assertion{linked.length === 1 ? '' : 's'} préparée{linked.length === 1 ? '' : 's'} liée{linked.length === 1 ? '' : 's'}</summary>
            {linked.map((assertion) => <div key={assertion.id}><p>{assertionLabel(assertion)}</p><span>{assertionSourceLabel(assertion.source)}</span>
              <details><summary>Identité exacte</summary><code>{assertion.id}</code>{assertion.source ? <code>{assertion.source.reference}</code> : null}</details>
            </div>)}
          </details> : <p className="hvp-help">Aucune assertion n’appuie cet état préparé.</p>}
          <details className="hvp-access-correction">
            <summary>Corriger cet accès par une nouvelle déclaration</summary>
            <div className="hvp-access-form">
              <label><span>État déclaré</span><select aria-label={`État d’accès ${scope.label}`} value={draft.state} disabled={disabled}
                onChange={(event) => updateAccessDraft(scope.key, { state: event.target.value as AccessCorrectionDraft['state'] })}>
                <option value="">À préciser</option><option value="yes">Oui, accessible</option><option value="no">Non, inaccessible</option><option value="unknown">Inconnu</option>
              </select></label>
              <label className="hvp-field-wide"><span>Motif de cette correction</span><Textarea autoComplete="off" aria-label={`Motif d’accès ${scope.label}`} rows={2} value={draft.basis} disabled={disabled}
                onChange={(event) => updateAccessDraft(scope.key, { basis: event.target.value })} /></label>
              {draft.state && draft.state !== 'unknown' ? <>
                <label className="hvp-field-wide"><span>Déclaration exacte</span><Textarea autoComplete="off" aria-label={`Déclaration d’accès ${scope.label}`} rows={2} value={draft.statement} disabled={disabled}
                  onChange={(event) => updateAccessDraft(scope.key, { statement: event.target.value })} /></label>
                {sourceInputs(draft.source, (source) => updateAccessDraft(scope.key, { source }), `Accès ${scope.label}`, disabled)}
              </> : null}
              {draft.state === 'unknown' ? <p className="hvp-help">Cette correction garde l’accès inconnu et ne crée aucune assertion.</p> : null}
              <button type="button" className="hvp-secondary" disabled={disabled || !canCorrect} onClick={() => correctAccess(scope.key)}>
                {draft.state === 'unknown' ? 'Conserver l’accès inconnu dans la correction' : 'Ajouter cette attestation à la lecture'}
              </button>
            </div>
          </details>
        </article>;
      })}
    </details> : null}
  </section>;
}

