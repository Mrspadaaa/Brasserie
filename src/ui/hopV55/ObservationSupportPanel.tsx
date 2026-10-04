import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { HopSource, HopSourceKind } from '../../../functions/src/hopIndexSchema';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import {
  type BrewingSensoryDefinitionReference,
  type BrewingSensoryDimension,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
} from '../../domain/brewingSensory';
import type { BrewingObservedHopScope } from '../../domain/brewingObservationInputs';
import {
  brewingObservationFactReference,
  qualifyBrewingObservationNumerics,
  type BrewingObservationArithmeticContract,
} from '../../domain/brewingObservationNumerics';
import { readBrewingReferenceRecord, type BrewingReferenceObservationV1 } from '../../domain/brewingReference';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Workspace } from '../../services/hopV55/contracts';
import { readHopV55ObservationAnchorRecord } from '../../services/hopV55/observationSession';
import {
  appendHopV55ObservationSupportRecord,
  resolveHopV55ObservationSupport,
  selectHopV55ObservationSupport,
  createHopV55ObservationSupportArithmeticRecord,
  createHopV55ObservationSupportDefinition,
  createHopV55ObservationSupportHopScopeRecord,
  createHopV55ObservationSupportProtocolNoteRecord,
  readHopV55ObservationSupportRecord,
  readHopV55ObservationSupportSelection,
  type HopV55CreateObservationSupportRecordBaseV1,
  type HopV55ObservationSupportDefinitionChoiceV1,
  type HopV55ObservationSupportFrameChoiceV1,
  type HopV55ObservationSupportMeaning,
  type HopV55ObservationSupportRecordKind,
  type HopV55ObservationSupportRecordV1,
  type HopV55ObservationSupportResolutionV1,
  type HopV55ObservationSupportSelectionV1,
} from '../../services/hopV55/observationSupport';
import { Input, Textarea } from '../Input';
import { parseDecimal } from '../numericInput';
import { HopV55NuancePlanEditor, type NuancePlanDimensionCandidate } from './NuancePlanEditor';
import './observation-support-panel.css';

type MeaningKind = HopV55ObservationSupportMeaning['kind'] | '';
type Orientation = HopV55ObservationSupportMeaning['orientation'] | '';
type DomainMode = 'known' | 'unknown' | '';
type DimensionMode = 'existing' | 'new' | '';
type SourceMode = 'external' | 'personal' | '';
type SourceDraft = { mode: SourceMode; title: string; author: string; year: string; kind: HopSourceKind | ''; reference: string; locator: string; reason: string };
type ScopeDependencyChoice = { id: string; label: string; kind: 'canonical' | 'existing'; sourceReferences: string[] };
type ProtocolDraft = {
  dimensionMode: DimensionMode;
  dimensionReference: string;
  dimensionSourceReference: string;
  dimensionName: string;
  dimensionDefinition: string;
  dimensionTerms: string;
  meaningKind: MeaningKind;
  orientation: Orientation;
  domainMode: DomainMode;
  domainMin?: number;
  domainMax?: number;
  lowLabel: string;
  highLabel: string;
  source: SourceDraft;
  recordedBy: string;
};
type ScopeDraft = { dependencyIds: string[]; fromAt: string; explanation: string; recordedBy: string };
type SelectionDraft = { dimensionReference: string; hopScopeReference: string; frameReferences: string[]; arithmeticReference: string; recordedBy: string };
type ArithmeticDraft = {
  frameDefinitionReference: string;
  operation: 'ordinalWorkingHypothesis' | '';
  sourceMeaningKind: MeaningKind;
  sourceOrientation: Orientation;
  targetMeaningKind: MeaningKind;
  targetOrientation: Orientation;
  bridgeExplanation: string;
  explanation: string;
  recordedBy: string;
  source: SourceDraft;
};

export interface HopV55ObservationSupportPanelProps {
  workspace: HopV55Workspace;
  context: BrewerContext;
  prepared: PreparedBrewingScenarioContext;
  getWorkspace(): Promise<HopV55Workspace>;
  onSave(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  disabled?: boolean;
}

const SOURCE_KINDS: HopSourceKind[] = ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'];
const SOURCE_KIND_LABELS: Record<HopSourceKind, string> = { coa: 'Certificat d’analyse', manufacturer: 'Fabricant', research: 'Recherche',
  review: 'Revue', observation: 'Observation', community: 'Communauté', judgment: 'Jugement' };
const emptySource = (): SourceDraft => ({ mode: '', title: '', author: '', year: '', kind: '', reference: '', locator: '', reason: '' });
const initialProtocol = (): ProtocolDraft => ({ dimensionMode: '', dimensionReference: '', dimensionSourceReference: '',
  dimensionName: '', dimensionDefinition: '', dimensionTerms: '', meaningKind: '', orientation: '', domainMode: '',
  domainMin: undefined, domainMax: undefined, lowLabel: '', highLabel: '', source: emptySource(), recordedBy: '' });
const initialScope = (): ScopeDraft => ({ dependencyIds: [], fromAt: '', explanation: '', recordedBy: '' });
const initialSelection = (): SelectionDraft => ({ dimensionReference: '', hopScopeReference: '', frameReferences: [], arithmeticReference: '', recordedBy: '' });
const initialArithmetic = (): ArithmeticDraft => ({ frameDefinitionReference: '', operation: '', sourceMeaningKind: '', sourceOrientation: '',
  targetMeaningKind: '', targetOrientation: '', bridgeExplanation: '', explanation: '', recordedBy: '', source: emptySource() });
const clone = <T,>(value: T): T => structuredClone(value);

function dateTimeToIso(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function sourceDraftValid(value: SourceDraft): boolean {
  const title = value.title.trim(), author = value.author.trim();
  if (!title || !author) return false;
  if (value.mode === 'personal') return !!value.reason.trim();
  if (value.mode !== 'external' || !value.kind || !value.reference.trim()) return false;
  const year = value.year.trim() ? Number(value.year) : null;
  return year === null || Number.isInteger(year) && year >= 0 && year <= 9999;
}

function sourceFromDraft(value: SourceDraft, localReference?: string): HopSource | null {
  if (!sourceDraftValid(value)) return null;
  const title = value.title.trim(), author = value.author.trim();
  if (value.mode === 'personal') {
    if (!localReference) return null;
    return { title, author, year: null, kind: 'observation', reference: localReference,
      locator: `Motif de la déclaration personnelle : ${value.reason.trim()}` };
  }
  const reference = value.reference.trim(), locator = value.locator.trim();
  const year = value.year.trim() ? Number(value.year) : null;
  if (!value.kind) return null;
  return { title, author, year, kind: value.kind, reference, ...(locator ? { locator } : {}) };
}

function sourceLabel(source: HopSource): string {
  const kind = ({ coa: 'certificat d’analyse', manufacturer: 'fabricant', research: 'recherche', review: 'revue',
    observation: 'observation', community: 'communauté', judgment: 'jugement' } satisfies Record<HopSourceKind, string>)[source.kind];
  return [source.title, source.author, source.year === null ? 'année non déclarée' : source.year, kind, source.reference, source.locator]
    .filter(value => value !== undefined && value !== '').join(' · ');
}

function meaningLabel(value: HopV55ObservationSupportMeaning | undefined): string {
  if (!value) return 'Sens non déclaré';
  const kind = value.kind === 'intensity' ? 'Intensité' : value.kind === 'preference' ? 'Préférence' : 'Classement';
  return `${kind} · orientation ${value.orientation === 'increasing' ? 'croissante' : 'décroissante'}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 9 }).format(value);
}

function instantLabel(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(timestamp) : value;
}

function observationExampleLabel(observation: BrewingReferenceObservationV1): string {
  const dimension = observation.dimension.status === 'resolved'
    ? observation.dimension.definition.dimension.name : observation.dimension.label;
  let value: string;
  if (observation.sense.kind === 'sensoryRating') {
    const domain = observation.scale.status === 'known' ? observation.scale.scale.domain : null;
    value = `note ${formatNumber(observation.sense.value)}${domain ? ` · échelle ${formatNumber(domain.min)}–${formatNumber(domain.max)}` : ' · échelle inconnue'}`;
  } else if (observation.sense.kind === 'analyticalMeasurement') {
    const quantity = typeof observation.sense.value === 'number' ? formatNumber(observation.sense.value)
      : `${formatNumber(observation.sense.value.min)}–${formatNumber(observation.sense.value.max)}`;
    value = `mesure ${quantity} ${observation.sense.unit} · base ${observation.sense.basis}`;
  } else value = 'description qualitative';
  return `${dimension} · ${value} · ${instantLabel(observation.observedAt)} · v${observation.version}`;
}

function dimensionMetricLabel(definition: BrewingSensoryDefinitionReference): string {
  const metric = definition.metric;
  if (!metric) return 'Qualitative · aucune métrique';
  const kind = metric.kind === 'ordinalNote' ? 'Note ordinale' : metric.kind === 'modelIndex' ? 'Indice de modèle' : 'Mesure analytique';
  const metricName = metric.name.trim().toLocaleLowerCase('fr-CH') === kind.toLocaleLowerCase('fr-CH') ? '' : ` · ${metric.name}`;
  return `${kind}${metricName} · ${metric.unit ?? 'sans unité'}${definition.scale?.domain
    ? ` · ${formatNumber(definition.scale.domain.min)}–${formatNumber(definition.scale.domain.max)}` : ' · domaine inconnu'}`;
}

function dimensionChoiceLabel(choice: HopV55ObservationSupportDefinitionChoiceV1): string {
  const origin = choice.origin === 'protocolNote' ? 'Protocole de note' : choice.origin === 'observation'
    ? 'Note consignée' : 'Dimension de cadre adopté';
  return `${choice.definition.dimension.name} · ${origin}${choice.meaning ? ` · ${meaningLabel(choice.meaning)}` : ''} · ${dimensionMetricLabel(choice.definition)}`;
}

function frameLabel(frame: HopV55ObservationSupportFrameChoiceV1): string {
  return `Cadre adopté · ${frame.plan.sourceModel.name} · version ${frame.plan.revision}`;
}

function dependencyLabel(id: string): string {
  if (id === 'hopMaterials') return 'Houblons ajoutés';
  if (id === 'hopContact') return 'Continuité du contact';
  return 'Autre dépendance existante';
}

function scopeDependencyChoices(workspace: HopV55Workspace,
  scopes: ReadonlyArray<{ reference: string; scope: BrewingObservedHopScope }>): ScopeDependencyChoice[] {
  const known = new Map<string, Set<string>>();
  const add = (id: string, sourceReference: string) => {
    if (!id.trim()) return;
    const sources = known.get(id) ?? new Set<string>();
    sources.add(sourceReference);
    known.set(id, sources);
  };
  for (const scope of scopes) for (const id of scope.scope.dependencyIds) add(id, scope.reference);
  for (const raw of workspace.observationAnchors ?? []) {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status !== 'readOnly') continue;
    for (const dependency of read.record.preparation.state?.dependencies ?? []) add(dependency.id, read.record.reference);
  }
  const canonicalIds = ['hopMaterials', 'hopContact'] as const;
  const canonical = canonicalIds.map(id => ({ id, label: dependencyLabel(id), kind: 'canonical' as const,
    sourceReferences: [...(known.get(id) ?? [])] }));
  const additional = [...known.entries()].filter(([id]) => !canonicalIds.includes(id as typeof canonicalIds[number]))
    .sort(([left], [right]) => left.localeCompare(right, 'fr-CH'))
    .map(([id, refs], index) => ({ id, label: `Autre dépendance existante ${index + 1}`, kind: 'existing' as const,
      sourceReferences: [...refs] }));
  return [...canonical, ...additional];
}

function currentSelection(resolution: HopV55ObservationSupportResolutionV1): HopV55ObservationSupportSelectionV1 | undefined {
  return resolution.status === 'ready' || resolution.status === 'needsSetup' ? resolution.selection : undefined;
}

function observations(workspace: HopV55Workspace): BrewingReferenceObservationV1[] {
  if (!workspace.referenceJournal) return [];
  const read = readBrewingReferenceRecord(workspace.referenceJournal.record, workspace.referenceJournal.events);
  return 'status' in read ? [] : read.projection.observations;
}

function exactExampleNotesFor(workspace: HopV55Workspace, definition: BrewingSensoryDefinitionReference): BrewingReferenceObservationV1[] {
  return observations(workspace).filter(row => row.dimension.status === 'resolved'
    && row.dimension.definition.contentReference === definition.contentReference);
}

function buildArithmeticCandidate(input: {
  draft: ArithmeticDraft;
  sourceDimension?: HopV55ObservationSupportDefinitionChoiceV1;
  targetDefinition?: BrewingSensoryDefinitionReference;
  recordedAt?: string;
  contractId?: string;
  sourceReference?: string;
}): { contract?: BrewingObservationArithmeticContract; reasons: string[] } {
  const { draft, sourceDimension, targetDefinition, recordedAt, contractId, sourceReference } = input;
  const sourceDefinition = sourceDimension?.definition;
  const source = sourceFromDraft(draft.source, sourceReference ?? 'local-declaration:preview');
  const reasons: string[] = [];
  if (!sourceDefinition || !targetDefinition) reasons.push('Choisis d’abord une définition de note et un cadre adopté exacts.');
  if (sourceDefinition && targetDefinition && sourceDefinition.dimensionReference !== targetDefinition.dimensionReference) {
    return { reasons: ['Refus : le protocole de note et le cadre ne portent pas sur la même référence exacte de dimension. Aucun rapprochement par nom.'] };
  }
  if (sourceDefinition && targetDefinition && (sourceDefinition.metric?.kind !== 'ordinalNote'
    || !sourceDefinition.scale?.domain || !targetDefinition.metric || !targetDefinition.scale?.domain)) {
    return { reasons: ['Refus : cette tranche ne construit une hypothèse ordinale que pour une note ordinale et un cadre à domaines numériques connus.'] };
  }

  const sameDefinition = !!sourceDefinition && !!targetDefinition
    && sourceDefinition.contentReference === targetDefinition.contentReference;
  let unitBridge: BrewingObservationArithmeticContract['unitBridge'];
  let contractDefinition = sourceDefinition;
  if (sourceDefinition && targetDefinition && !sameDefinition) {
    const sourceDomain = sourceDefinition.scale.domain;
    const targetDomain = targetDefinition.scale.domain;
    if (targetDefinition.metric.kind !== 'modelIndex') {
      return { reasons: ['Refus : deux échelles de note distinctes ne sont pas converties automatiquement. Utilise la même définition exacte ou un cadre d’indice explicitement admissible.'] };
    }
    if (sourceDomain.min !== targetDomain.min || sourceDomain.max !== targetDomain.max) {
      return { reasons: [`Refus : domaines incompatibles (${formatNumber(sourceDomain.min)}–${formatNumber(sourceDomain.max)} vers ${formatNumber(targetDomain.min)}–${formatNumber(targetDomain.max)}). Aucune conversion ni mise à l’échelle.`] };
    }
    const sourceMeaning = sourceDimension.meaning ?? { kind: draft.sourceMeaningKind, orientation: draft.sourceOrientation };
    if (sourceMeaning.kind !== 'intensity' || sourceMeaning.orientation !== 'increasing'
      || draft.targetMeaningKind !== 'intensity' || draft.targetOrientation !== 'increasing') {
      return { reasons: ['Refus : une correspondance 1 point pour 1 point exige une intensité croissante explicitement déclarée des deux côtés.'] };
    }
    if (!draft.bridgeExplanation.trim()) return { reasons: ['Décris le domaine et le sens de cette correspondance hypothétique avant de la conserver.'] };
    contractDefinition = targetDefinition;
    unitBridge = { sourceDefinition, rule: 'unitCorrespondence', domain: { ...sourceDomain },
      sourceMeaning: { kind: 'intensity', direction: 'increasing' },
      targetMeaning: { kind: 'intensity', direction: 'increasing' },
      explanation: draft.bridgeExplanation.trim() };
  }

  if (!source) reasons.push('La convention doit conserver sa source exacte.');
  if (!draft.explanation.trim() || !draft.recordedBy.trim()) reasons.push('Le motif et l’auteur de la convention sont requis.');
  if (draft.operation !== 'ordinalWorkingHypothesis') reasons.push('Choisis le type d’hypothèse numérique.');
  const declaredMeaning = sourceDimension?.meaning ?? { kind: draft.sourceMeaningKind, orientation: draft.sourceOrientation };
  if (sameDefinition && (declaredMeaning.kind !== 'intensity' || declaredMeaning.orientation !== 'increasing')) {
    reasons.push('Refus : une hypothèse additive exige une intensité ordinale croissante explicitement déclarée.');
  }
  if (reasons.length || !sourceDefinition || !targetDefinition || !source || !draft.operation) return { reasons };
  return { contract: {
    version: 'brewing-observation-arithmetic-v1',
    id: contractId ?? `observation-arithmetic-${crypto.randomUUID()}`,
    definition: clone(contractDefinition),
    operation: 'ordinalWorkingHypothesis',
    basis: null,
    explanation: draft.explanation.trim(),
    sourceRefs: [source],
    adoptedAt: recordedAt ?? new Date().toISOString(),
    adoptedBy: { origin: 'user', name: draft.recordedBy.trim() },
    ...(unitBridge ? { unitBridge } : {}),
  }, reasons: [] };
}

function pendingBase(workspace: HopV55Workspace, identity: {
  id: string; supportId: string; recordedAt: string; recordedBy: string;
}): HopV55CreateObservationSupportRecordBaseV1 {
  return { workspace, id: identity.id, supportId: identity.supportId, revision: 1, predecessorReference: null,
    recordedAt: identity.recordedAt, recordedBy: { origin: 'user', name: identity.recordedBy } };
}

function ProvenanceFields({ value, onChange, disabled, prefix = '' }: {
  value: SourceDraft; onChange(value: SourceDraft): void; disabled: boolean; prefix?: string;
}) {
  const fieldName = (name: string) => `${prefix}${prefix ? ' · ' : ''}${name}`;
  return <div className="hv55-support-grid">
    <label className="hv55-support-field"><span>Provenance · {prefix}</span><select aria-label={fieldName('Mode de source')} value={value.mode} disabled={disabled}
      onChange={event => onChange({ ...value, mode: event.target.value as SourceMode, kind: '', reference: '', reason: '' })}>
      <option value="">À préciser</option><option value="external">Source externe</option><option value="personal">Déclaration personnelle locale</option>
    </select></label>
    {value.mode === 'external' ? <>
      <label className="hv55-support-field"><span>Type de source · {prefix}</span><select aria-label={`Type de source ${prefix}`}
        value={value.kind} disabled={disabled} onChange={event => onChange({ ...value, kind: event.target.value as HopSourceKind | '' })}>
        <option value="">Choisir le type de source</option>{SOURCE_KINDS.map(kind => <option key={kind} value={kind}>{SOURCE_KIND_LABELS[kind]}</option>)}
      </select></label>
      <label className="hv55-support-field"><span>Titre · {prefix || 'source'}</span><Input autoComplete="off" aria-label={fieldName('Titre de la source')} value={value.title} disabled={disabled}
        onChange={event => onChange({ ...value, title: event.target.value })} /></label>
      <label className="hv55-support-field"><span>Auteur · {prefix || 'source'}</span><Input autoComplete="off" aria-label={fieldName('Auteur de la source')} value={value.author} disabled={disabled}
        onChange={event => onChange({ ...value, author: event.target.value })} /></label>
      <label className="hv55-support-field"><span>Année, si connue · {prefix || 'source'}</span><Input autoComplete="off" aria-label={fieldName('Année de la source')} value={value.year} disabled={disabled}
        onChange={event => onChange({ ...value, year: event.target.value })} /></label>
      <label className="hv55-support-field"><span>Référence externe exacte · {prefix}</span><Input autoComplete="off" aria-label={fieldName('Référence de la source')} value={value.reference} disabled={disabled}
        onChange={event => onChange({ ...value, reference: event.target.value })} /></label>
      <label className="hv55-support-field hv55-support-wide"><span>Repère dans la source · facultatif</span><Input autoComplete="off" aria-label={fieldName('Repère de la source')} value={value.locator} disabled={disabled}
        onChange={event => onChange({ ...value, locator: event.target.value })} /></label>
    </> : null}
    {value.mode === 'personal' ? <>
      <label className="hv55-support-field"><span>Titre de la déclaration · {prefix}</span><Input autoComplete="off" aria-label={fieldName('Titre de la déclaration')} value={value.title} disabled={disabled}
        onChange={event => onChange({ ...value, title: event.target.value })} /></label>
      <label className="hv55-support-field"><span>Acteur ou auteur · {prefix}</span><Input autoComplete="off" aria-label={fieldName('Acteur de la déclaration')} value={value.author} disabled={disabled}
        onChange={event => onChange({ ...value, author: event.target.value })} /></label>
      <label className="hv55-support-field hv55-support-wide"><span>Motif de la déclaration</span><Textarea autoComplete="off" aria-label={fieldName('Motif de la déclaration')} rows={2} value={value.reason} disabled={disabled}
        onChange={event => onChange({ ...value, reason: event.target.value })} /></label>
      <p className="hv55-support-note">Une référence locale sera créée à l’enregistrement; aucune adresse ou clé technique n’est à saisir.</p>
    </> : null}
  </div>;
}

export function HopV55ObservationSupportPanel({ workspace, context, prepared, getWorkspace, onSave, disabled = false }: HopV55ObservationSupportPanelProps) {
  const [workingWorkspace, setWorkingWorkspace] = useState(workspace);
  const [protocol, setProtocol] = useState<ProtocolDraft>(initialProtocol);
  const [scope, setScope] = useState<ScopeDraft>(initialScope);
  const [selection, setSelection] = useState<SelectionDraft>(initialSelection);
  const [arithmetic, setArithmetic] = useState<ArithmeticDraft>(initialArithmetic);
  const [exampleNoteKey, setExampleNoteKey] = useState('');
  const [planEditorOpen, setPlanEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const latestProps = useRef({ workspace, prepared, getWorkspace, onSave, disabled });
  latestProps.current = { workspace, prepared, getWorkspace, onSave, disabled };
  const pendingRecords = useRef<Partial<Record<'protocolNote' | 'hopScope' | 'arithmetic', {
    fingerprint: string; id: string; supportId: string; recordedAt: string; recordedBy: string; record?: HopV55ObservationSupportRecordV1;
  }>>>({});
  const pendingSelection = useRef<{ fingerprint: string; id: string; recordedAt: string; recordedBy: string;
    baseReference: string | null } | null>(null);

  useEffect(() => {
    setWorkingWorkspace(current => !current || workspace.id !== current.id || workspace.revision >= current.revision ? workspace : current);
  }, [workspace.id, workspace.revision]);

  const currentWorkspace = workingWorkspace ?? workspace;
  const resolution = useMemo(() => resolveHopV55ObservationSupport({ workspace: currentWorkspace }), [currentWorkspace]);
  const active = currentSelection(resolution);
  const choices = resolution.choices;
  const scopeDependencyOptions = useMemo(() => scopeDependencyChoices(currentWorkspace, choices.hopScopes), [currentWorkspace, choices.hopScopes]);
  const userDimensions = choices.dimensions.filter(choice => choice.definition.metric?.kind !== 'modelIndex');
  const protocolDimensions = choices.dimensions;
  const exactSelectionReference = active?.reference ?? null;
  const sourceDimension = userDimensions.find(row => row.reference === selection.dimensionReference);
  const savedSelectedDimension = userDimensions.find(row => row.reference === active?.dimensionReference);
  const selectedFrameChoices = choices.frames.filter(row => selection.frameReferences.includes(row.plan.reference));
  const targetDefinitions = selectedFrameChoices.flatMap(frame => frame.plan.definitions.map(definition => ({
    frame, definition, reference: definition.contentReference,
    label: `${frame.plan.planId} · r${frame.plan.revision} · ${definition.dimension.name} · ${dimensionMetricLabel(definition)}`,
  })));
  const selectedTargetDefinition = targetDefinitions.find(row => row.reference === arithmetic.frameDefinitionReference)?.definition;
  const observationsAvailable = useMemo(() => observations(currentWorkspace), [currentWorkspace]);
  const exactExampleNotes = sourceDimension ? observationsAvailable.filter(row => row.dimension.status === 'resolved'
    && row.dimension.definition.contentReference === sourceDimension.definition.contentReference) : [];
  const candidateArithmetic = useMemo(() => buildArithmeticCandidate({ draft: arithmetic, sourceDimension,
    targetDefinition: selectedTargetDefinition, recordedAt: new Date().toISOString() }),
    [arithmetic, sourceDimension, selectedTargetDefinition]);
  const selectedExample = exactExampleNotes.find(row => `${row.id}@${row.version}:${row.dimension.status === 'resolved' ? row.dimension.definition.contentReference : ''}` === exampleNoteKey);
  const arithmeticPreview = selectedExample && candidateArithmetic.contract
    ? qualifyBrewingObservationNumerics(selectedExample, candidateArithmetic.contract) : undefined;
  const planDimensionCandidates = choices.dimensions.flatMap(choice => {
    if (choice.origin !== 'protocolNote' && choice.origin !== 'observation') return [];
    return choice.definition.dimension.sourceRefs.map(source => ({ dimension: clone(choice.definition.dimension),
      source: { kind: choice.origin === 'protocolNote' ? 'protocol' as const : 'note' as const,
        reference: source.reference, label: `${choice.definition.dimension.name} · ${choice.origin === 'protocolNote' ? 'protocole de note' : 'note consignée'} · ${sourceLabel(source)}` } }));
  });

  useEffect(() => {
    const next = active ? { dimensionReference: active.dimensionReference, hopScopeReference: active.hopScopeReference,
      frameReferences: [...active.frameReferences], arithmeticReference: active.arithmeticReference ?? '', recordedBy: '' } : initialSelection();
    setSelection(next);
    setExampleNoteKey('');
    setArithmetic(initialArithmetic());
  }, [currentWorkspace.id, exactSelectionReference]);

  const readOnly = disabled || busy || resolution.status === 'unsupportedRO';
  const selectionReady = !!selection.dimensionReference && !!selection.hopScopeReference && !!selection.recordedBy.trim();

  function updateProtocol(change: Partial<ProtocolDraft>) { setProtocol(current => ({ ...current, ...change })); }
  function updateScope(change: Partial<ScopeDraft>) { setScope(current => ({ ...current, ...change })); }
  function updateScopeDependency(id: string, checked: boolean) {
    setScope(current => ({ ...current, dependencyIds: checked
      ? [...new Set([...current.dependencyIds, id])]
      : current.dependencyIds.filter(candidate => candidate !== id) }));
  }
  function updateSelection(change: Partial<SelectionDraft>) { setSelection(current => ({ ...current, ...change })); }
  function updateArithmetic(change: Partial<ArithmeticDraft>) { setArithmetic(current => ({ ...current, ...change })); }
  function updateFrameSelection(reference: string, checked: boolean) {
    setSelection(current => ({ ...current, frameReferences: checked
      ? [...new Set([...current.frameReferences, reference])]
      : current.frameReferences.filter(row => row !== reference) }));
  }
  function currentRecordBase(latest: HopV55Workspace,
    intent: NonNullable<typeof pendingRecords.current['protocolNote']>): HopV55CreateObservationSupportRecordBaseV1 {
    return pendingBase(latest, intent);
  }

  async function persistRecord(kind: 'protocolNote' | 'hopScope' | 'arithmetic', fingerprint: string,
    build: (latest: HopV55Workspace, intent: NonNullable<typeof pendingRecords.current['protocolNote']>) => HopV55ObservationSupportRecordV1) {
    if (readOnly || busyRef.current) return;
    const existingIntent = pendingRecords.current[kind];
    const intent = existingIntent?.fingerprint === fingerprint ? existingIntent : {
      fingerprint, id: `observation-support-record:${crypto.randomUUID()}`, supportId: `observation-support:${crypto.randomUUID()}`,
      recordedAt: new Date().toISOString(), recordedBy: kind === 'protocolNote' ? protocol.recordedBy.trim()
        : kind === 'hopScope' ? scope.recordedBy.trim() : arithmetic.recordedBy.trim(),
    };
    pendingRecords.current[kind] = intent;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const props = latestProps.current;
      const latest = await props.getWorkspace();
      let record = intent.record;
      if (!record) {
        record = build(latest, intent);
        intent.record = record;
      }
      const existing = latest.observationSupportRecords?.find(row => row && typeof row === 'object' && row.id === record!.id);
      let saved: HopV55Workspace;
      if (existing) {
        const read = readHopV55ObservationSupportRecord(existing);
        if (read.status !== 'readOnly' || read.record.reference !== record.reference) throw new Error('Cet identifiant de déclaration existe avec un autre contenu; relis la comparaison.');
        saved = latest;
      } else saved = await props.onSave(appendHopV55ObservationSupportRecord(latest, record));
      setWorkingWorkspace(saved);
      setNotice(kind === 'protocolNote' ? 'Protocole conservé. Choisis sa référence exacte dans la sélection active pour l’utiliser.'
        : kind === 'hopScope' ? 'Portée conservée. Sa déclaration ne confirme aucune complétude du journal.'
          : 'Convention arithmétique conservée. Choisis sa référence exacte dans la sélection active pour l’utiliser.');
      pendingRecords.current[kind] = undefined;
      if (kind === 'protocolNote') setProtocol(initialProtocol());
      else if (kind === 'hopScope') setScope(initialScope());
      else setArithmetic(initialArithmetic());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La déclaration n’a pas été conservée. La saisie reste disponible.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  async function saveProtocol() {
    const chosenDimension = protocol.dimensionMode === 'existing'
      ? choices.dimensions.find(row => row.reference === protocol.dimensionReference)?.definition.dimension : undefined;
    const selectedDimensionSource = protocol.dimensionMode === 'existing'
      ? choices.dimensions.find(row => row.reference === protocol.dimensionReference)?.definition.dimension.sourceRefs
        .find(row => row.reference === protocol.dimensionSourceReference) ?? null
      : null;
    const minValid = protocol.domainMode === 'known' && protocol.domainMin !== undefined && protocol.domainMax !== undefined
      && protocol.domainMin < protocol.domainMax;
    if (!protocol.meaningKind || !protocol.orientation || !protocol.domainMode || !sourceDraftValid(protocol.source) || !protocol.recordedBy.trim()
      || protocol.domainMode === 'known' && !minValid
      || protocol.dimensionMode === 'existing' && !chosenDimension
      || protocol.dimensionMode === 'existing' && !selectedDimensionSource
      || protocol.dimensionMode === 'new' && (!protocol.dimensionName.trim() || !protocol.dimensionDefinition.trim())) {
      setError('Renseigne une dimension exacte, une source, le sens, l’orientation, le domaine et l’auteur du protocole.');
      return;
    }
    const fingerprint = JSON.stringify({ ...protocol, dimension: chosenDimension ?? null, selectedDimensionSource });
    await persistRecord('protocolNote', fingerprint, (latest, intent) => {
      const protocolSource = sourceFromDraft(protocol.source, `local-declaration:${intent.id}`);
      if (!protocolSource) throw new Error('La provenance du protocole ne peut pas être construite depuis cette déclaration.');
      const dimensionSource = selectedDimensionSource ?? protocolSource;
      const dimension: BrewingSensoryDimension = chosenDimension ? clone(chosenDimension) : {
        id: `brewing-note-dimension-${crypto.randomUUID()}`, version: '1', name: protocol.dimensionName.trim(),
        definition: protocol.dimensionDefinition.trim(), sourceRefs: [dimensionSource],
        ...(protocol.dimensionTerms.trim() ? { terms: [...new Set(protocol.dimensionTerms.split(/[;,]/).map(row => row.trim()).filter(Boolean))] } : {}),
      };
      const metric: BrewingSensoryMetric = { id: `brewing-note-metric-${crypto.randomUUID()}`, version: '1', kind: 'ordinalNote',
        name: 'Note ordinale', meaning: `${protocol.meaningKind} · orientation ${protocol.orientation}`, unit: null, sourceRefs: [protocolSource] };
      const labels = [];
      if (protocol.domainMode === 'known' && protocol.domainMin !== undefined && protocol.domainMax !== undefined) {
        if (protocol.lowLabel.trim()) labels.push({ value: protocol.domainMin, label: protocol.lowLabel.trim() });
        if (protocol.highLabel.trim()) labels.push({ value: protocol.domainMax, label: protocol.highLabel.trim() });
      }
      const scale: BrewingSensoryScale = { id: `brewing-note-scale-${crypto.randomUUID()}`, version: '1',
        metricRef: { id: metric.id, version: metric.version },
        domain: protocol.domainMode === 'known' ? { min: protocol.domainMin!, max: protocol.domainMax! } : null,
        ...(labels.length ? { labels } : {}), sourceRefs: [protocolSource] };
      const definition = createHopV55ObservationSupportDefinition({ dimension, metric, scale });
      return createHopV55ObservationSupportProtocolNoteRecord({ ...currentRecordBase(latest, intent), definition,
        meaning: { kind: protocol.meaningKind as HopV55ObservationSupportMeaning['kind'], orientation: protocol.orientation as HopV55ObservationSupportMeaning['orientation'] } });
    });
  }

  async function saveScope() {
    const fromAt = dateTimeToIso(scope.fromAt);
    const dependencyIds = [...new Set(scope.dependencyIds)];
    if (!fromAt || !dependencyIds.length || !scope.explanation.trim() || !scope.recordedBy.trim()) {
      setError('Une portée exige une période de départ, au moins une dépendance, une explication et son auteur.');
      return;
    }
    const fingerprint = JSON.stringify({ ...scope, dependencyIds, fromAt });
    await persistRecord('hopScope', fingerprint, (latest, intent) => {
      const scopeValue: BrewingObservedHopScope = { id: intent.supportId, dependencyIds, fromAt,
        explanation: scope.explanation.trim() };
      return createHopV55ObservationSupportHopScopeRecord({ ...currentRecordBase(latest, intent), scope: scopeValue });
    });
  }

  async function saveSelection() {
    if (!selectionReady) { setError('Choisis une définition, une portée exacte et le nom de l’auteur de la sélection.'); return; }
    const currentLast = currentWorkspace.observationSupportSelections?.at(-1);
    const currentLastRead = currentLast ? readHopV55ObservationSupportSelection(currentLast) : undefined;
    const currentReference = currentLastRead?.status === 'readOnly' ? currentLastRead.selection.reference : null;
    const fingerprint = JSON.stringify({ workspaceId: currentWorkspace.id, dimensionReference: selection.dimensionReference,
      hopScopeReference: selection.hopScopeReference, frameReferences: selection.frameReferences,
      arithmeticReference: selection.arithmeticReference || null, recordedBy: selection.recordedBy.trim() });
    const intent = pendingSelection.current?.fingerprint === fingerprint ? pendingSelection.current : {
      fingerprint, id: `observation-support-selection:${crypto.randomUUID()}`, recordedAt: new Date().toISOString(),
      recordedBy: selection.recordedBy.trim(), baseReference: currentReference,
    };
    pendingSelection.current = intent;
    if (readOnly || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const props = latestProps.current;
      const latest = await props.getWorkspace();
      const existing = latest.observationSupportSelections?.find(row => row && typeof row === 'object' && row.id === intent.id);
      if (existing) {
        const read = readHopV55ObservationSupportSelection(existing);
        if (read.status !== 'readOnly' || read.selection.dimensionReference !== selection.dimensionReference
          || read.selection.hopScopeReference !== selection.hopScopeReference
          || JSON.stringify(read.selection.frameReferences) !== JSON.stringify(selection.frameReferences)
          || read.selection.arithmeticReference !== (selection.arithmeticReference || null)) {
          throw new Error('Cette sélection de support existe avec un contenu différent; relis les choix actifs.');
        }
        setWorkingWorkspace(latest); setNotice('Cette sélection exacte est déjà conservée.');
        pendingSelection.current = null; return;
      }
      const latestPrior = latest.observationSupportSelections?.at(-1);
      const latestPriorRead = latestPrior ? readHopV55ObservationSupportSelection(latestPrior) : undefined;
      const latestReference = latestPriorRead?.status === 'readOnly' ? latestPriorRead.selection.reference : null;
      if (latestReference !== intent.baseReference) throw new Error('La sélection active a changé depuis son ouverture; relis les choix avant de remplacer quoi que ce soit.');
      const saved = await props.onSave(selectHopV55ObservationSupport(latest, { id: intent.id, recordedAt: intent.recordedAt,
        recordedBy: { origin: 'user', name: intent.recordedBy }, dimensionReference: selection.dimensionReference,
        hopScopeReference: selection.hopScopeReference, frameReferences: [...selection.frameReferences],
        arithmeticReference: selection.arithmeticReference || null }));
      setWorkingWorkspace(saved); setNotice('Sélection de comparaison conservée sous ses références exactes.'); pendingSelection.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La sélection n’a pas été conservée. Relis les choix avant de réessayer.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  async function saveArithmetic() {
    const selectedFrame = targetDefinitions.find(row => row.reference === arithmetic.frameDefinitionReference);
    const selectedDefinition = sourceDimension?.definition;
    if (!selectedDefinition || !selectedFrame || !sourceDraftValid(arithmetic.source) || !arithmetic.operation || !arithmetic.explanation.trim()
      || !arithmetic.recordedBy.trim()) { setError('Choisis les définitions exactes et complète la convention, sa source et son auteur.'); return; }
    const fingerprint = JSON.stringify({ dimension: selectedDefinition.contentReference, target: selectedFrame.reference,
      operation: arithmetic.operation, meaning: [arithmetic.sourceMeaningKind, arithmetic.sourceOrientation,
        arithmetic.targetMeaningKind, arithmetic.targetOrientation], bridgeExplanation: arithmetic.bridgeExplanation,
      explanation: arithmetic.explanation, recordedBy: arithmetic.recordedBy, source: arithmetic.source });
    await persistRecord('arithmetic', fingerprint, (latest, intent) => {
      const candidate = buildArithmeticCandidate({ draft: arithmetic, sourceDimension, targetDefinition: selectedFrame.definition,
        recordedAt: intent.recordedAt, contractId: `${intent.id}:contract`, sourceReference: `local-declaration:${intent.id}` });
      if (!candidate.contract) throw new Error(candidate.reasons.join(' ') || 'La convention n’est pas complète.');
      return createHopV55ObservationSupportArithmeticRecord({
        ...currentRecordBase(latest, intent), contract: candidate.contract,
      });
    });
  }

  const activeDimensionChoice = choices.dimensions.find(row => row.reference === active?.dimensionReference);
  const activeScopeChoice = choices.hopScopes.find(row => row.reference === active?.hopScopeReference);
  const activeArithmeticChoice = choices.arithmetic.find(row => row.reference === active?.arithmeticReference);
  const compatibleArithmeticChoices = sourceDimension ? choices.arithmetic.filter(row =>
    row.contract.definition.contentReference === sourceDimension.reference
      || row.contract.unitBridge?.sourceDefinition.contentReference === sourceDimension.reference) : [];
  const selectedArithmeticIsAvailable = !selection.arithmeticReference
    || compatibleArithmeticChoices.some(row => row.reference === selection.arithmeticReference);
  const selectedFramesAreAvailable = selectedFrameChoices.length === selection.frameReferences.length;
  const canSaveSelection = !readOnly && selectionReady && !!userDimensions.find(row => row.reference === selection.dimensionReference)
    && !!choices.hopScopes.find(row => row.reference === selection.hopScopeReference)
    && selectedFramesAreAvailable && selectedArithmeticIsAvailable;
  const canSaveArithmetic = !readOnly && !!sourceDimension && !!selectedTargetDefinition && sourceDraftValid(arithmetic.source)
    && !!arithmetic.explanation.trim() && !!arithmetic.recordedBy.trim() && !!arithmetic.operation && !!candidateArithmetic.contract;
  const dimensionSourceReady = protocol.dimensionMode === 'existing'
    ? !!protocolDimensions.find(row => row.reference === protocol.dimensionReference)?.definition.dimension.sourceRefs
      .find(row => row.reference === protocol.dimensionSourceReference)
    : protocol.dimensionMode === 'new' && !!protocol.dimensionName.trim() && !!protocol.dimensionDefinition.trim();
  const protocolDomainValid = protocol.domainMode === 'unknown'
    || protocol.domainMode === 'known' && protocol.domainMin !== undefined && protocol.domainMax !== undefined
      && Number.isFinite(protocol.domainMin) && Number.isFinite(protocol.domainMax) && protocol.domainMin < protocol.domainMax;
  const canSaveProtocol = !readOnly && dimensionSourceReady
    && !!protocol.meaningKind && !!protocol.orientation && !!protocol.domainMode
    && protocolDomainValid && sourceDraftValid(protocol.source) && !!protocol.recordedBy.trim();
  const hostLabel = context.batch?.name || context.recipe?.name || 'contexte sans nom déclaré';

  return <section className="hv55-observation-support" aria-labelledby="hv55-observation-support-title" aria-busy={busy}>
    <header className="hv55-support-header">
      <div><p className="hv55-support-eyebrow">Réglage de la comparaison · {hostLabel}</p>
        <h2 id="hv55-observation-support-title">Configurer cette comparaison</h2>
        <p>Choisis des définitions, une portée physique et des cadres par références exactes. Une portée ne prouve pas la couverture du journal; aucune convention ou stabilité n’est adoptée à l’ouverture.</p>
      </div>
      <div className="hv55-support-state" data-status={resolution.status}>
        <strong>{resolution.status === 'ready' ? 'Support prêt' : resolution.status === 'unsupportedRO' ? 'Format futur · lecture seule' : 'Configuration à compléter'}</strong>
        <span>{resolution.status === 'ready' ? 'La dimension et la portée exactes sont sélectionnées.'
          : resolution.status === 'unsupportedRO' ? resolution.reason
            : 'Le comparateur reste utile sans cadre ou convention numérique.'}</span>
      </div>
    </header>

    {error ? <p className="hv55-support-error" role="alert">{error}</p> : null}
    {notice ? <p className="hv55-support-notice" role="status">{notice}</p> : null}
    {resolution.status === 'needsSetup' && resolution.missing.length ? <div className="hv55-support-warning" aria-live="polite">
      <strong>À choisir ou relire</strong><ul>{resolution.missing.map((message, index) => <li key={`${index}:${message}`}>{message}</li>)}</ul>
    </div> : null}
    {resolution.status === 'unsupportedRO' ? <details className="hv55-support-details"><summary>Référence conservée en lecture seule</summary>
      <pre>{JSON.stringify(resolution.snapshot, null, 2)}</pre></details> : null}

    <section className="hv55-support-section" aria-labelledby="hv55-support-protocol-title">
      <h3 id="hv55-support-protocol-title">Définir ce qui est noté</h3>
      <p className="hv55-support-muted">Choisis la nuance, le sens et les bornes de la note. Ce protocole crée une échelle séparée; il ne modifie pas les mesures ou indices déjà conservés.</p>
      <div className="hv55-support-fields">
        <label className="hv55-support-field"><span>Dimension sensorielle</span><select aria-label="Dimension du protocole" value={protocol.dimensionMode === 'existing' ? protocol.dimensionReference : protocol.dimensionMode}
          disabled={readOnly} onChange={event => {
            const value = event.target.value;
            if (value === 'new' || value === '') updateProtocol({ dimensionMode: value as DimensionMode, dimensionReference: '', dimensionSourceReference: '' });
            else updateProtocol({ dimensionMode: 'existing', dimensionReference: value, dimensionSourceReference: '' });
          }}>
          <option value="">Choisir une dimension exacte ou en créer une</option><option value="new">Créer une nouvelle dimension</option>
          {protocolDimensions.map(row => <option key={row.reference} value={row.reference}>{dimensionChoiceLabel(row)}</option>)}
        </select></label>

        {protocol.dimensionMode === 'existing' ? <>
          <label className="hv55-support-field"><span>Source exacte de la dimension</span><select aria-label="Source exacte de la dimension" value={protocol.dimensionSourceReference} disabled={readOnly}
            onChange={event => updateProtocol({ dimensionSourceReference: event.target.value })}>
            <option value="">Choisir la source conservée</option>
            {(protocolDimensions.find(row => row.reference === protocol.dimensionReference)?.definition.dimension.sourceRefs ?? []).map(row =>
              <option key={row.reference} value={row.reference}>{sourceLabel(row)}</option>)}
          </select></label>
          <p className="hv55-support-note">Cette dimension exacte est réutilisée; la métrique ordinale et l’échelle ci-dessous seront nouvelles. La définition existante, y compris un index modèle, reste intacte.</p>
        </> : null}

        {protocol.dimensionMode === 'new' ? <>
          <label className="hv55-support-field"><span>Nom de la nuance</span><Input autoComplete="off" aria-label="Nom de la nuance" value={protocol.dimensionName} disabled={readOnly}
            onChange={event => updateProtocol({ dimensionName: event.target.value })} /></label>
          <label className="hv55-support-field hv55-support-wide"><span>Définition sensorielle</span><Textarea autoComplete="off" aria-label="Définition sensorielle" rows={2} value={protocol.dimensionDefinition} disabled={readOnly}
            onChange={event => updateProtocol({ dimensionDefinition: event.target.value })} /></label>
          <label className="hv55-support-field hv55-support-wide"><span>Termes exacts · facultatif, séparés par virgule ou point-virgule</span><Input autoComplete="off" aria-label="Termes de la nuance" value={protocol.dimensionTerms} disabled={readOnly}
            onChange={event => updateProtocol({ dimensionTerms: event.target.value })} /></label>
        </> : null}

        <p className="hv55-support-note">Cette source documente le protocole, sa métrique et son échelle. Avec une nouvelle dimension, elle documente aussi cette dimension; pour une dimension reprise, sa source d’origine reste séparée ci-dessus.</p>
        <ProvenanceFields value={protocol.source} prefix="protocole" disabled={readOnly}
          onChange={source => updateProtocol({ source })} />

        <label className="hv55-support-field"><span>Sens de la note</span><select aria-label="Sens de la note" value={protocol.meaningKind} disabled={readOnly}
          onChange={event => updateProtocol({ meaningKind: event.target.value as MeaningKind })}>
          <option value="">À préciser</option><option value="intensity">Intensité</option><option value="preference">Préférence</option><option value="ranking">Classement</option>
        </select></label>
        <label className="hv55-support-field"><span>Orientation de l’échelle</span><select aria-label="Orientation de l’échelle" value={protocol.orientation} disabled={readOnly}
          onChange={event => updateProtocol({ orientation: event.target.value as Orientation })}>
          <option value="">À préciser</option><option value="increasing">Croissante</option><option value="decreasing">Décroissante</option>
        </select></label>
        <label className="hv55-support-field"><span>Domaine numérique de la note</span><select aria-label="Domaine numérique de la note" value={protocol.domainMode} disabled={readOnly}
          onChange={event => updateProtocol({ domainMode: event.target.value as DomainMode, domainMin: undefined, domainMax: undefined })}>
          <option value="">À préciser</option><option value="unknown">Inconnu · note qualitative conservée</option><option value="known">Bornes connues</option>
        </select></label>
        {protocol.domainMode === 'known' ? <>
          <label className="hv55-support-field"><span>Borne basse incluse</span><Input autoComplete="off" type="text" inputMode="decimal" aria-label="Borne basse incluse" value={protocol.domainMin === undefined ? '' : String(protocol.domainMin)} disabled={readOnly}
            onChange={event => updateProtocol({ domainMin: parseDecimal(event.target.value) ?? undefined })} /></label>
          <label className="hv55-support-field"><span>Borne haute incluse</span><Input autoComplete="off" type="text" inputMode="decimal" aria-label="Borne haute incluse" value={protocol.domainMax === undefined ? '' : String(protocol.domainMax)} disabled={readOnly}
            onChange={event => updateProtocol({ domainMax: parseDecimal(event.target.value) ?? undefined })} /></label>
          <label className="hv55-support-field"><span>Libellé de la borne basse · facultatif</span><Input autoComplete="off" aria-label="Libellé bas de l’échelle" value={protocol.lowLabel} disabled={readOnly}
            onChange={event => updateProtocol({ lowLabel: event.target.value })} /></label>
          <label className="hv55-support-field"><span>Libellé de la borne haute · facultatif</span><Input autoComplete="off" aria-label="Libellé haut de l’échelle" value={protocol.highLabel} disabled={readOnly}
            onChange={event => updateProtocol({ highLabel: event.target.value })} /></label>
        </> : null}
        <label className="hv55-support-field"><span>Auteur de la déclaration</span><Input autoComplete="off" aria-label="Auteur du protocole" value={protocol.recordedBy} disabled={readOnly}
          onChange={event => updateProtocol({ recordedBy: event.target.value })} /></label>
      </div>
      {protocol.domainMode === 'unknown' ? <p className="hv55-support-note">Aucune borne n’est déduite. Le protocole autorise une description qualitative, sans valeur numérique.</p> : null}
      <div className="hv55-support-actions"><button type="button" className="hv55-support-primary" disabled={!canSaveProtocol} onClick={() => void saveProtocol()}>
        Conserver ce protocole de note
      </button><span>La source reste attribuée; l’heure de conservation est enregistrée séparément de l’année de source.</span></div>
    </section>

    <section className="hv55-support-section" aria-labelledby="hv55-support-scope-title">
      <h3 id="hv55-support-scope-title">Déclarer une portée physique</h3>
      <p className="hv55-support-muted">Choisis les données à inclure et le début de période. Cette portée ne déclare pas leur complétude.</p>
      <div className="hv55-support-grid">
        <fieldset className="hv55-support-dependencies hv55-support-wide">
          <legend>Dépendances à inclure · aucun choix présélectionné</legend>
          <div className="hv55-support-checks">
            {scopeDependencyOptions.map(choice => <label className="hv55-support-check" key={choice.id}>
              <input type="checkbox" aria-label={choice.label} checked={scope.dependencyIds.includes(choice.id)} disabled={readOnly}
                onChange={event => updateScopeDependency(choice.id, event.target.checked)} />
              <span><strong>{choice.label}</strong>{choice.kind === 'existing' ? <small>Déjà présente dans un état ou une portée enregistrés.</small> : null}</span>
            </label>)}
          </div>
          <details className="hv55-support-dependency-keys"><summary>Clés exactes et provenances existantes</summary>
            <ul>{scopeDependencyOptions.map(choice => <li key={choice.id}><strong>{choice.label}</strong> · <code>{choice.id}</code>
              {choice.sourceReferences.length ? <div>{choice.sourceReferences.map(reference => <code key={reference}>{reference}</code>)}</div>
                : <small>Choix canonique disponible; aucune observation ne l’atteste.</small>}</li>)}</ul>
          </details>
        </fieldset>
        <label className="hv55-support-field"><span>Début de la période considérée</span><input autoComplete="off" type="datetime-local" aria-label="Début de portée" value={scope.fromAt} disabled={readOnly}
          onChange={event => updateScope({ fromAt: event.target.value })} /></label>
        <label className="hv55-support-field"><span>Auteur de la portée</span><Input autoComplete="off" aria-label="Auteur de la portée" value={scope.recordedBy} disabled={readOnly}
          onChange={event => updateScope({ recordedBy: event.target.value })} /></label>
        <label className="hv55-support-field hv55-support-wide"><span>Pourquoi ce périmètre et cette période ?</span><Textarea autoComplete="off" aria-label="Motif de la portée" rows={2} value={scope.explanation} disabled={readOnly}
          onChange={event => updateScope({ explanation: event.target.value })} /></label>
      </div>
      <div className="hv55-support-actions"><button type="button" className="hv55-support-primary" disabled={readOnly || !scope.dependencyIds.length || !dateTimeToIso(scope.fromAt) || !scope.explanation.trim() || !scope.recordedBy.trim()}
        onClick={() => void saveScope()}>Conserver cette portée</button><span>Les choix, la période et le motif seront conservés ensemble.</span></div>
    </section>

    <details className="hv55-support-details" open={planEditorOpen} onToggle={event => setPlanEditorOpen(event.currentTarget.open)}>
      <summary>Créer ou adopter un cadre de projection</summary>
      <p className="hv55-support-muted">Les cadres admissibles sont des plans adoptés sous leur référence exacte. Une proposition ou une simulation ne devient pas un cadre automatiquement.</p>
      {planEditorOpen ? <fieldset className="hv55-support-plan-editor__gate" disabled={readOnly}>
        <legend className="hv55-support-muted">Proposition et adoption explicites</legend>
        <div className="hv55-support-plan-editor"><HopV55NuancePlanEditor prepared={prepared} workspace={currentWorkspace}
          getWorkspace={getWorkspace} onSave={onSave} dimensionCandidates={planDimensionCandidates} /></div>
      </fieldset> : null}
    </details>

    <section className="hv55-support-section" aria-labelledby="hv55-support-arithmetic-title">
      <h3 id="hv55-support-arithmetic-title">Conventions numériques</h3>
      <p className="hv55-support-muted">Une convention est propre à cette comparaison. Une correspondance 1 pour 1 reste une hypothèse de travail, jamais une calibration ou une nouvelle observation.</p>
      <div className="hv55-support-grid">
        <label className="hv55-support-field"><span>Définition exacte de note</span><select aria-label="Définition exacte de note" value={selection.dimensionReference} disabled={readOnly}
          onChange={event => updateSelection({ dimensionReference: event.target.value, arithmeticReference: '' })}>
          <option value="">Choisir une note ou un protocole exact</option>
          {userDimensions.map(row => <option key={row.reference} value={row.reference}>{dimensionChoiceLabel(row)}</option>)}
        </select></label>
        <label className="hv55-support-field"><span>Cadre exact adopté</span><select aria-label="Cadre exact du calcul" value={arithmetic.frameDefinitionReference} disabled={readOnly}
          onChange={event => updateArithmetic({ frameDefinitionReference: event.target.value })}>
          <option value="">Choisir une définition du cadre sélectionné</option>
          {targetDefinitions.map(row => <option key={row.reference} value={row.reference}>{frameLabel(row.frame)} · {row.definition.dimension.name} · {dimensionMetricLabel(row.definition)}</option>)}
        </select></label>
        <label className="hv55-support-field"><span>Type d’hypothèse</span><select aria-label="Type d’hypothèse arithmétique" value={arithmetic.operation} disabled={readOnly}
          onChange={event => updateArithmetic({ operation: event.target.value as ArithmeticDraft['operation'] })}>
          <option value="">À préciser</option><option value="ordinalWorkingHypothesis">Différences ordinales · hypothèse de travail explicite</option>
        </select></label>
        {sourceDimension?.meaning ? <p className="hv55-support-note">Sens du protocole exact : {meaningLabel(sourceDimension.meaning)}.</p>
          : <>
            <label className="hv55-support-field"><span>Sens déclaré de la note</span><select aria-label="Sens déclaré de la note" value={arithmetic.sourceMeaningKind} disabled={readOnly}
              onChange={event => updateArithmetic({ sourceMeaningKind: event.target.value as MeaningKind })}>
              <option value="">À préciser</option><option value="intensity">Intensité</option><option value="preference">Préférence</option><option value="ranking">Classement</option>
            </select></label>
            <label className="hv55-support-field"><span>Orientation de la note</span><select aria-label="Orientation de la note" value={arithmetic.sourceOrientation} disabled={readOnly}
              onChange={event => updateArithmetic({ sourceOrientation: event.target.value as Orientation })}>
              <option value="">À préciser</option><option value="increasing">Croissante</option><option value="decreasing">Décroissante</option>
            </select></label>
          </>}
        {selectedTargetDefinition && sourceDimension && selectedTargetDefinition.contentReference !== sourceDimension.reference ? <>
          <label className="hv55-support-field"><span>Sens déclaré du cadre</span><select aria-label="Sens déclaré du cadre" value={arithmetic.targetMeaningKind} disabled={readOnly}
            onChange={event => updateArithmetic({ targetMeaningKind: event.target.value as MeaningKind })}>
            <option value="">À préciser</option><option value="intensity">Intensité</option><option value="preference">Préférence</option><option value="ranking">Classement</option>
          </select></label>
          <label className="hv55-support-field"><span>Orientation du cadre</span><select aria-label="Orientation du cadre" value={arithmetic.targetOrientation} disabled={readOnly}
            onChange={event => updateArithmetic({ targetOrientation: event.target.value as Orientation })}>
            <option value="">À préciser</option><option value="increasing">Croissante</option><option value="decreasing">Décroissante</option>
          </select></label>
          <label className="hv55-support-field hv55-support-wide"><span>Pourquoi retenir cette correspondance de domaine exact ?</span><Textarea autoComplete="off" aria-label="Motif de la correspondance" rows={2}
            value={arithmetic.bridgeExplanation} disabled={readOnly} onChange={event => updateArithmetic({ bridgeExplanation: event.target.value })} /></label>
        </> : null}
        <label className="hv55-support-field hv55-support-wide"><span>Motif de l’hypothèse</span><Textarea autoComplete="off" aria-label="Motif de l’hypothèse arithmétique" rows={2} value={arithmetic.explanation} disabled={readOnly}
          onChange={event => updateArithmetic({ explanation: event.target.value })} /></label>
        <label className="hv55-support-field"><span>Auteur de la convention</span><Input autoComplete="off" aria-label="Auteur de la convention" value={arithmetic.recordedBy} disabled={readOnly}
          onChange={event => updateArithmetic({ recordedBy: event.target.value })} /></label>
        <ProvenanceFields value={arithmetic.source} prefix="convention" disabled={readOnly}
          onChange={source => updateArithmetic({ source })} />
      </div>
      {candidateArithmetic.reasons.length ? <p className="hv55-support-warning" role="status">{candidateArithmetic.reasons.join(' ')}</p> : null}
      {selectedFrameChoices.length === 0 ? <p className="hv55-support-note">Choisis d’abord un cadre adopté dans « Sélection active », ou crée-en un dans l’éditeur ci-dessus. Aucune définition de cadre n’est présélectionnée.</p> : null}
      {exactExampleNotes.length ? <label className="hv55-support-field"><span>Exemple de note exacte à vérifier · facultatif</span><select aria-label="Exemple de note numérique" value={exampleNoteKey} disabled={readOnly}
        onChange={event => setExampleNoteKey(event.target.value)}>
        <option value="">Aucune note sélectionnée</option>{exactExampleNotes.map(row => <option key={`${row.id}@${row.version}`} value={`${row.id}@${row.version}:${row.dimension.status === 'resolved' ? row.dimension.definition.contentReference : ''}`}>
          {observationExampleLabel(row)}
        </option>)}
      </select></label> : null}
      {selectedExample ? <details className="hv55-support-details">
        <summary>Références exactes de cette observation</summary>
        <span>Observation · <code>{selectedExample.id} · v{selectedExample.version}</code></span>
        <code>{brewingObservationFactReference(selectedExample)}</code>
        {selectedExample.dimension.status === 'resolved' ? <><span>Définition · {selectedExample.dimension.definition.dimension.name}</span>
          <code>{selectedExample.dimension.definition.contentReference}</code></> : <span>Dimension · {selectedExample.dimension.label}</span>}
      </details> : null}
      {selectedExample ? <div className="hv55-support-preview" data-status={arithmeticPreview?.status ?? 'nonComparable'}>
        <strong>{arithmeticPreview?.status === 'comparable' ? 'Compatible sous hypothèse' : 'Refus numérique'}</strong>
        {arithmeticPreview?.status === 'comparable' ? <p>{arithmeticPreview.valueStatus === 'hypotheticalInterpretation' ? 'Interprétation hypothétique' : 'Valeur originale'} · {JSON.stringify(arithmeticPreview.observationValue)} · aucune conversion.</p>
          : <ul>{candidateArithmetic.reasons.map((reason, index) => <li key={`${index}:${reason}`}>{reason}</li>)}
            {arithmeticPreview?.status === 'nonComparable' ? arithmeticPreview.reasons.map((reason, index) => <li key={`${index}:${reason.code}`}>{reason.message}</li>) : null}</ul>}
      </div> : null}
      <div className="hv55-support-actions"><button type="button" className="hv55-support-primary" disabled={!canSaveArithmetic} onClick={() => void saveArithmetic()}>
        Conserver cette convention sans l’activer
      </button><span>Choisis ensuite sa référence explicite dans la sélection active; une incompatibilité reste non comparable.</span></div>
    </section>

    <section className="hv55-support-section" aria-labelledby="hv55-support-selection-title">
      <h3 id="hv55-support-selection-title">Sélection active</h3>
      <p className="hv55-support-muted">La sélection relie des versions exactes; elle ne copie pas les plans et ne déclare pas la stabilité du reste de la bière.</p>
      {active ? <div className="hv55-support-card" data-testid="hop-v55-active-observation-support">
        <strong>Sélection enregistrée · version {active.revision}</strong>
        <span>Dimension · {activeDimensionChoice ? dimensionChoiceLabel(activeDimensionChoice) : 'référence indisponible'}</span>
        <span>Portée · {activeScopeChoice?.scope.dependencyIds.map(dependencyLabel).join(', ') ?? 'référence indisponible'} · depuis {activeScopeChoice ? instantLabel(activeScopeChoice.scope.fromAt) : 'instant indisponible'}</span>
        {activeScopeChoice ? <span>Motif · {activeScopeChoice.scope.explanation}</span> : null}
        <span>Cadres exacts · {active.frameReferences.length ? active.frameReferences.map(reference => choices.frames.find(row => row.plan.reference === reference)).filter(Boolean).map(frame => frameLabel(frame!)).join(' · ') : 'aucun choisi'}</span>
        <span>Convention · {activeArithmeticChoice?.description ?? 'aucune choisie'}</span>
        <details><summary>Voir les références exactes</summary>
          <span>Sélection · <code>{active.reference}</code></span>
          <span>Dimension · <code>{active.dimensionReference}</code></span>
          <span>Portée · <code>{active.hopScopeReference}</code></span>
          {active.frameReferences.map(reference => <span key={reference}>Cadre · <code>{reference}</code></span>)}
          {active.arithmeticReference ? <span>Convention · <code>{active.arithmeticReference}</code></span> : null}
          {activeScopeChoice ? <><span>Portée · <code>{activeScopeChoice.scope.id}</code></span>
            <span>Début exact · <code>{activeScopeChoice.scope.fromAt}</code></span>
            <span>Dépendances · <code>{activeScopeChoice.scope.dependencyIds.join(' · ')}</code></span></> : null}
        </details>
      </div> : <p className="hv55-support-note">Aucune sélection active. Les choix restent vides jusqu’à une action explicite.</p>}
      {active && (!activeDimensionChoice || !activeScopeChoice || active.frameReferences.some(reference => !choices.frames.some(frame => frame.plan.reference === reference))
        || active.arithmeticReference && !choices.arithmetic.some(row => row.reference === active.arithmeticReference))
        ? <p className="hv55-support-warning">Une référence active manque dans le registre disponible. Choisis de nouveau uniquement après avoir vérifié la version exacte; les archives existantes restent inchangées.</p> : null}
      <div className="hv55-support-selection">
        <label className="hv55-support-field"><span>Définition sensorielle exacte à utiliser</span><select aria-label="Définition de la sélection" value={selection.dimensionReference} disabled={readOnly}
          onChange={event => updateSelection({ dimensionReference: event.target.value, arithmeticReference: '' })}>
          <option value="">Choisir une note ou un protocole exact</option>
          {userDimensions.map(row => <option key={row.reference} value={row.reference}>{dimensionChoiceLabel(row)}</option>)}
        </select></label>
        <label className="hv55-support-field"><span>Portée houblon exacte</span><select aria-label="Portée de la sélection" value={selection.hopScopeReference} disabled={readOnly}
          onChange={event => updateSelection({ hopScopeReference: event.target.value })}>
          <option value="">Choisir une portée conservée</option>{choices.hopScopes.map(row => <option key={row.reference} value={row.reference}>{row.label} · {row.scope.dependencyIds.map(dependencyLabel).join(', ')} · depuis {instantLabel(row.scope.fromAt)}</option>)}
        </select></label>
        <label className="hv55-support-field"><span>Auteur de cette sélection</span><Input autoComplete="off" aria-label="Auteur de la sélection" value={selection.recordedBy} disabled={readOnly}
          onChange={event => updateSelection({ recordedBy: event.target.value })} /></label>
        <label className="hv55-support-field"><span>Convention exacte · facultative</span><select aria-label="Convention de la sélection" value={selection.arithmeticReference} disabled={readOnly || !sourceDimension}
          onChange={event => updateSelection({ arithmeticReference: event.target.value })}>
          <option value="">Aucune convention numérique adoptée ici</option>{compatibleArithmeticChoices.map(row => <option key={row.reference} value={row.reference}>{row.description}</option>)}
        </select></label>
        <fieldset className="hv55-support-frames">
          <legend>Cadres adoptés · facultatifs, références exactes</legend>
          {choices.frames.length ? choices.frames.map(frame => <div className="hv55-support-frame" key={frame.plan.reference}>
            <label><input type="checkbox" aria-label={frameLabel(frame)} checked={selection.frameReferences.includes(frame.plan.reference)} disabled={readOnly}
              onChange={event => updateFrameSelection(frame.plan.reference, event.target.checked)} />
              <span>{frameLabel(frame)}</span></label>
            <small>{frame.description}</small>
            <details><summary>Voir les définitions exactes</summary><div className="hv55-support-exact"><span>Plan · <code>{frame.plan.planId}</code></span><span>Référence · <code>{frame.plan.reference}</code></span></div>{frame.plan.definitions.map(definition => <div className="hv55-support-exact" key={definition.contentReference}>
              <strong>{definition.dimension.name} · {dimensionMetricLabel(definition)}</strong><code>{definition.contentReference}</code>
            </div>)}</details>
          </div>) : <p className="hv55-support-note">Aucun cadre adopté disponible. La sélection peut rester sans cadre; propose et adopte une version depuis l’éditeur ci-dessus si nécessaire.</p>}
        </fieldset>
      </div>
      <div className="hv55-support-actions"><button type="button" className="hv55-support-primary" disabled={!canSaveSelection} onClick={() => void saveSelection()}>
        Enregistrer cette sélection exacte
      </button><span>Les questions déjà archivées gardent leurs références d’origine.</span></div>
    </section>

    <section className="hv55-support-section" aria-labelledby="hv55-support-stability-title">
      <h3 id="hv55-support-stability-title">Stabilité du reste</h3>
      <p className="hv55-support-muted">Aucune stabilité globale n’est créée ici. Elle est liée à chaque question, son ancre, son état, sa cible, ses cadres et sa convention.</p>
      {choices.stabilities.length ? <details className="hv55-support-details"><summary>Propositions historiques à revalider</summary>
        {choices.stabilities.map(row => <div className="hv55-support-card" key={row.reference}><strong>{row.label} · {row.reference}</strong><p>{row.description}</p><code>{JSON.stringify(row.comparisonBinding)}</code></div>)}
      </details> : <p className="hv55-support-note">Aucune proposition historique de stabilité.</p>}
    </section>

    <details className="hv55-support-details"><summary>Déclarations conservées · références exactes</summary>
      {choices.dimensions.filter(row => row.origin === 'protocolNote').map(choice => {
        const sources = [...choice.definition.dimension.sourceRefs, ...(choice.definition.metric?.sourceRefs ?? []), ...(choice.definition.scale?.sourceRefs ?? [])]
          .filter((source, index, rows) => rows.findIndex(other => other.reference === source.reference) === index);
        return <article className="hv55-support-card" key={choice.reference}>
          <strong>{dimensionChoiceLabel(choice)}</strong><span>Définition · <code>{choice.reference}</code></span>
          <span>Dimension · <code>{choice.definition.dimensionReference}</code></span>
          {sources.map(source => <span key={source.reference}>Source · {sourceLabel(source)}</span>)}
        </article>;
      })}
      {choices.hopScopes.map(row => <article className="hv55-support-card" key={row.reference}>
        <strong>Portée · {row.scope.dependencyIds.map(dependencyLabel).join(', ')}</strong><code>{row.reference}</code>
        <span>Clés · <code>{row.scope.dependencyIds.join(' · ')}</code></span>
      </article>)}
      {choices.arithmetic.map(row => <article className="hv55-support-card" key={row.reference}>
        <strong>Convention · {row.description}</strong><code>{row.reference}</code><span>Source · {row.contract.sourceRefs.map(sourceLabel).join(' · ')}</span>
      </article>)}
    </details>
  </section>;
}
