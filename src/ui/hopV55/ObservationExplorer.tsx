import React, { useId, useMemo, useState } from 'react';
import type { HopTiming } from '../../../functions/src/hopPredictionSchema';
import { HOP_TIMINGS } from '../../../functions/src/hopPredictionSchema';
import type { HopRange, HopSource, HopSourceKind } from '../../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type { BrewingObservationSelectionCandidateV1, BrewingObservationSelectionV1,
  BrewingObservationVersionReferenceV1 } from '../../domain/brewingObservationSelection';
import { brewingObservationProjectionViewModel, type BrewingObservationProjectionView } from '../../domain/brewingObservationViewModel';
import type { BrewingNuancePlan } from '../../domain/brewingNuanceProjection';
import type { BrewingObservedHopInput, BrewingObservationTargetRequest } from '../../domain/brewingObservationInputs';
import type { BrewingObservationArithmeticContract } from '../../domain/brewingObservationNumerics';
import type { BrewingObservationRestStability, BrewingObservationProjection } from '../../domain/brewingObservationProjection';
import type { BrewingReferenceObservationV1 } from '../../domain/brewingReference';
import type { BrewingSensoryComparisonDimension, BrewingSensoryComparisonValue } from '../../domain/brewingSensory';
import { readBrewingObservationProjectionArchive } from '../../domain/brewingObservationProjection';
import { readHopV55ObservationProjectionRecord, type HopV55ObservationProjectionRecordV1, type HopV55ObservationProjectionRole } from '../../services/hopV55/observationSession';
import { Input, Textarea } from '../Input';
import { NumberInput } from '../NumberInput';
import { HopV55SensoryComparison } from './SensoryComparison';
import './observation-explorer.css';

export interface HopV55ObservationFrameChoice {
  id: string;
  label: string;
  description?: string;
  plan: BrewingNuancePlan;
}

export interface HopV55ObservationArithmeticChoice {
  id: string;
  label: string;
  description?: string;
  contract: BrewingObservationArithmeticContract;
  /** Exact registry reference; a declared stability binding uses this, not `id` or the display label. */
  reference: string;
}

export interface HopV55ObservationStabilityProposal {
  id: string;
  label: string;
  description?: string;
  reference: string;
  comparisonBinding: {
    anchorReference: string;
    currentStateReference: string;
    targetRequestReference: string;
    frameReferences: string[];
    arithmeticReference: string;
  };
  stability: BrewingObservationRestStability;
}

export interface HopV55ObservationStabilityConditionDraft {
  id: string;
  status: 'declaredCompatible' | 'unknown' | 'changed' | '';
  explanation: string;
  sources: Array<{ id: string; title: string; author: string; year: string; kind: HopSourceKind | ''; reference: string; locator: string }>;
}

export interface HopV55ObservationTargetChoice {
  id: string;
  label: string;
  description?: string;
  role: 'targetHorizon';
  target: Omit<BrewingObservationTargetRequest, 'current'>;
}

export interface HopV55ObservationRealizedFactChoice {
  reference: string;
  materialId: string;
  label: string;
  quantityLabel?: string;
}

export interface HopV55ObservationHorizonChoice {
  reference: string;
  label: string;
}

export interface HopV55ObservationProjectionEditorOptions {
  /** Exact current input prepared by the parent; this component never resolves it. */
  currentInput: BrewingObservedHopInput;
  materials: readonly HopDecisionMaterial[];
  /** Existing, exact target snapshots can prefill the editor after an explicit click. */
  targetChoices?: readonly HopV55ObservationTargetChoice[];
  /** Only adopted plans are eligible. Proposed plans stay in the plan-adoption flow. */
  adoptedFrames: readonly HopV55ObservationFrameChoice[];
  /** Exact, already adopted arithmetic contracts; no bridge or scale is inferred here. */
  arithmeticChoices: readonly HopV55ObservationArithmeticChoice[];
  /** Historical stability records appear only as unadopted proposals. */
  stabilityProposals?: readonly HopV55ObservationStabilityProposal[];
  realizedFactChoices?: readonly HopV55ObservationRealizedFactChoice[];
  horizonChoices?: readonly HopV55ObservationHorizonChoice[];
  matrixIds?: readonly string[];
}

export interface HopV55ObservationProjectionDraft {
  question: string;
  role: HopV55ObservationProjectionRole;
  target: Omit<BrewingObservationTargetRequest, 'current'>;
  frames: Array<{ id: string; name: string; plan: BrewingNuancePlan }>;
  arithmetic: BrewingObservationArithmeticContract;
  restStability: BrewingObservationRestStability;
  /** Source record offered as a draft only; it is never treated as the current adoption. */
  stabilityProposalReference?: string;
  arithmeticSupportReference: string;
  /** An explicit historical departure point; current mode leaves this absent. */
  sourceAnchor?: { anchorRecordId: string; anchorReference: string; expectedObservationReference: BrewingObservationVersionReferenceV1 };
  /** Freshness guards for the parent transaction; not a replacement for its revalidation. */
  expectedCurrentInputReference: string;
  expectedCurrentStateReference: string;
}

/** Exact historical NR version and anchor offered by the parent; its candidate keeps its real resolver status. */
export interface HopV55HistoricalObservationAnchorChoice {
  anchorRecordId: string;
  anchorReference: string;
  observationReference: BrewingObservationVersionReferenceV1;
  candidate: BrewingObservationSelectionCandidateV1;
  observedAt: string;
  subjectLabel: string;
  observationLabel: string;
}

export interface HopV55ObservationExplorerProps {
  currentSelection: BrewingObservationSelectionV1;
  /** Append-only workspace records. Each envelope/archive is re-read without a model call. */
  projectionRecords: readonly unknown[];
  /** Parent keeps the opened question stable while current notes change. */
  selectedProjectionId: string | null;
  onSelectProjection: (id: string | null) => void;
  projectionEditor?: HopV55ObservationProjectionEditorOptions;
  /** Append-only historical anchors prepared and identity-checked by the parent. */
  historicalAnchorChoices?: readonly HopV55HistoricalObservationAnchorChoice[];
  /** Opens a comparison from the exact historical source; it does not change currentSelection. */
  onStartFromHistoricalAnchor?: (choice: HopV55HistoricalObservationAnchorChoice) => void | Promise<void>;
  /** Resolves/persists through the parent transaction; only persisted records appear in history. */
  onPrepareProjection?: (candidate: BrewingObservationSelectionCandidateV1, draft: HopV55ObservationProjectionDraft) => void | Promise<void>;
}

type ProjectionEntry =
  | { id: string; question: string; role: string; status: 'available'; record: HopV55ObservationProjectionRecordV1; view: BrewingObservationProjectionView; projection: BrewingObservationProjection }
  | { id: string; question: string; role: string; status: 'unsupported'; reason: string }
  | { id: string; question: string; role: string; status: 'invalid'; reason: string };

const ROLE_LABEL: Record<HopV55ObservationProjectionRole, string> = {
  documentedAdvance: 'Avancement documenté',
  targetHorizon: 'Horizon cible',
};

const TIMING_LABEL: Record<HopTiming, string> = {
  firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool',
  fermentation: 'Fermentation', postFermentation: 'Post-fermentation',
};

function safeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function idFrom(value: unknown, fallback: string): string {
  return value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string'
    ? (value as { id: string }).id : fallback;
}

function recordText(value: unknown, path: 'question' | 'role'): string {
  if (!value || typeof value !== 'object') return path === 'question' ? 'Question d’observation' : 'Rôle non reconnu';
  const row = value as Record<string, unknown>;
  if (path === 'question' && row.question && typeof row.question === 'object') {
    return safeText((row.question as Record<string, unknown>).text, 'Question d’observation');
  }
  if (path !== 'role') return 'Question d’observation';
  const role = typeof row.role === 'string' ? row.role : '';
  return role === 'documentedAdvance' ? ROLE_LABEL.documentedAdvance : role === 'targetHorizon' ? ROLE_LABEL.targetHorizon : 'Rôle non reconnu';
}

function readProjectionEntry(value: unknown, index: number): ProjectionEntry {
  const fallbackId = `archive-${index + 1}`;
  const id = idFrom(value, fallbackId);
  const question = recordText(value, 'question');
  const role = recordText(value, 'role');
  try {
    const recordRead = readHopV55ObservationProjectionRecord(value);
    if (recordRead.status === 'unsupportedReadOnly') {
      return { id, question, role, status: 'unsupported', reason: recordRead.reason };
    }
    const archiveRead = readBrewingObservationProjectionArchive(recordRead.record.archive);
    if (archiveRead.status === 'unsupportedReadOnly') {
      return { id, question, role, status: 'unsupported', reason: archiveRead.reason };
    }
    return { id: recordRead.record.id, question: recordRead.record.question.text, role: ROLE_LABEL[recordRead.record.role],
      status: 'available', record: recordRead.record, projection: archiveRead.projection,
      view: brewingObservationProjectionViewModel(archiveRead.projection) };
  } catch (error) {
    return { id, question, role, status: 'invalid', reason: error instanceof Error ? error.message : 'Archive illisible.' };
  }
}

function numberText(value: number): string {
  const raw = String(value);
  if (/[eE]/u.test(raw)) return value.toLocaleString('fr-CH', { maximumSignificantDigits: 15 });
  const [integer, decimals] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/gu, '\u202f');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

function rangeText(value: number | HopRange): string {
  return typeof value === 'number' ? numberText(value) : `${numberText(value.min)}–${numberText(value.max)}`;
}

function dateText(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('fr-CH', { timeZone: 'Europe/Zurich', dateStyle: 'medium', timeStyle: 'short' }) : value;
}

function observationValue(observation: BrewingReferenceObservationV1): string {
  if (observation.sense.kind === 'qualitative') return 'Note qualitative · aucun score numérique';
  if (observation.sense.kind === 'sensoryRating') {
    const unit = observation.scale.status === 'known' ? observation.scale.metric.unit : null;
    return `Note sensorielle · ${numberText(observation.sense.value)}${unit ? ` ${unit}` : ''}`;
  }
  return `Mesure analytique · ${rangeText(observation.sense.value)} ${observation.sense.unit} · base ${observation.sense.basis} · méthode ${observation.sense.method}`;
}

function observationScale(observation: BrewingReferenceObservationV1): string {
  if (observation.scale.status === 'unknown') return 'Échelle inconnue · valeur originale conservée';
  const metric = observation.scale.metric;
  const scale = observation.scale.scale;
  const domain = scale.domain ? `${numberText(scale.domain.min)}–${numberText(scale.domain.max)}` : 'bornes inconnues';
  const kind = metric.kind === 'ordinalNote' ? 'Note ordinale' : metric.kind === 'modelIndex' ? 'Indice de modèle' : 'Mesure';
  return `${kind} · ${metric.name} · ${domain}${metric.unit ? ` ${metric.unit}` : ''}`;
}

function contextEntries(value: unknown, path = ''): Array<{ path: string; value: string }> {
  if (value === null) return [{ path: path || 'Contexte', value: 'null' }];
  if (typeof value === 'string') return [{ path: path || 'Contexte', value }];
  if (typeof value === 'number' && Number.isFinite(value)) return [{ path: path || 'Contexte', value: numberText(value) }];
  if (typeof value === 'boolean') return [{ path: path || 'Contexte', value: value ? 'oui' : 'non' }];
  if (Array.isArray(value)) return value.length
    ? value.flatMap((child, index) => contextEntries(child, `${path}[${index}]`))
    : [{ path: path || 'Contexte', value: 'liste vide' }];
  if (value && typeof value === 'object') {
    const rows = Object.entries(value as Record<string, unknown>);
    return rows.length ? rows.flatMap(([key, child]) => contextEntries(child, path ? `${path}.${key}` : key))
      : [{ path: path || 'Contexte', value: 'objet vide' }];
  }
  return [{ path: path || 'Contexte', value: 'valeur structurée non lisible' }];
}

const CANDIDATE_STATUS: Record<BrewingObservationSelectionCandidateV1['status'], string> = {
  applicable: 'Applicable à l’état courant', noAnchor: 'Ancre physique absente', ambiguousAnchor: 'Plusieurs ancres possibles',
  invalidCorrectionLineage: 'Historique de correction incomplet', futureObservation: 'Note postérieure à la coupure courante',
  unresolvedSubject: 'Sujet non résolu', unresolvedDimension: 'Dimension non résolue', dimensionMismatch: 'Autre dimension',
  differentSubject: 'Autre sujet', continuityUnknown: 'Continuité inconnue', historical: 'Historique', partial: 'Applicabilité partielle',
  unknown: 'Applicabilité inconnue', conflicting: 'Données contradictoires',
};

function candidateHeading(candidate: BrewingObservationSelectionCandidateV1): string {
  const subjectKind = subjectKindLabel(candidate.observation.subject.kind);
  return `${subjectKind} · ${candidate.observation.subject.label} · ${dateText(candidate.observation.observedAt)} · version ${candidate.observation.version}`;
}

function subjectKindLabel(kind: string): string {
  return kind === 'sample' ? 'Échantillon' : kind === 'beer' ? 'Bière' : kind === 'batch' ? 'Brassin' : 'Objet observé';
}

function subjectRelationLabel(value: 'sameSubject' | 'analogy' | 'unresolved'): string {
  return value === 'sameSubject' ? 'Même sujet physique' : value === 'analogy' ? 'Sujet analogue' : 'Lien au sujet non résolu';
}

function historicalChoiceSource(choice: HopV55HistoricalObservationAnchorChoice): BrewingReferenceObservationV1 | null {
  const chosen = choice.observationReference;
  const current = choice.candidate.observationReference;
  if (current.id === chosen.id && current.version === chosen.version && current.contentReference === chosen.contentReference) {
    return choice.candidate.observation;
  }
  const original = choice.candidate.originalObservationReference;
  if (original.id === chosen.id && original.version === chosen.version && original.contentReference === chosen.contentReference) {
    return choice.candidate.originalObservation;
  }
  return null;
}

function historicalChoiceHasAnchor(choice: HopV55HistoricalObservationAnchorChoice): boolean {
  const candidate = choice.candidate;
  return candidate.anchor?.id === choice.anchorRecordId || candidate.originalAnchor?.id === choice.anchorRecordId
    || candidate.anchor?.reference === choice.anchorReference || candidate.originalAnchor?.reference === choice.anchorReference
    || candidate.anchorReferences.includes(choice.anchorReference) || candidate.originalAnchorReferences.includes(choice.anchorReference);
}

function CurrentObservation({ selection, historicalAnchorChoices = [], activeHistoricalAnchorRecordId,
  historicalActionEnabled, onStartFromHistoricalAnchor }: {
  selection: BrewingObservationSelectionV1;
  historicalAnchorChoices?: readonly HopV55HistoricalObservationAnchorChoice[];
  activeHistoricalAnchorRecordId?: string;
  historicalActionEnabled?: boolean;
  onStartFromHistoricalAnchor?: (choice: HopV55HistoricalObservationAnchorChoice) => void;
}) {
  const titleId = useId();
  const selected = selection.selected;
  const historicalObservationReferences = new Set(historicalAnchorChoices.map(choice => choice.observationReference.contentReference));
  const alternatives = selection.candidates.filter(candidate => candidate.observationReference.contentReference !== selected?.observationReference.contentReference
    && !historicalObservationReferences.has(candidate.observationReference.contentReference)
    && !historicalObservationReferences.has(candidate.originalObservationReference.contentReference));
  const alternativeCount = alternatives.length + historicalAnchorChoices.length;
  return <section className="hv55-observation-current" aria-labelledby={titleId}>
    <header>
      <p className="hv55-observation-eyebrow">Note et état réalisés</p>
      <h2 id={titleId}>Observation applicable maintenant</h2>
    </header>
    {selected ? <article className="hv55-observation-note">
      <div className="hv55-observation-note-heading">
        <div><strong>{selected.observation.subject.label}</strong><span>{subjectKindLabel(selected.observation.subject.kind)} · {dateText(selected.observation.observedAt)}</span></div>
        <span className="hv55-observation-status">{CANDIDATE_STATUS[selected.status]}</span>
      </div>
      <p className="hv55-observation-original">{selected.observation.originalText}</p>
      <dl className="hv55-observation-facts">
        <div><dt>Valeur d’origine</dt><dd>{observationValue(selected.observation)}</dd></div>
        <div><dt>Dimension</dt><dd>{selected.observation.dimension.status === 'resolved'
          ? `${selected.observation.dimension.definition.dimension.name} · v${selected.observation.dimension.definition.dimension.version}`
          : `${selected.observation.dimension.label} · non résolue`}</dd></div>
        <div><dt>Métrique et échelle</dt><dd>{observationScale(selected.observation)}</dd></div>
        <div><dt>Relation</dt><dd>{selected.observation.comparison.kind === 'absolute' ? 'Observation absolue'
          : `Observation relative · ${selected.observation.comparison.relationship}${selected.observation.comparison.referent ? ' · référent exact conservé' : ' · référent non précisé'}`}</dd></div>
        <div><dt>Applicabilité physique</dt><dd>{CANDIDATE_STATUS[selected.status]} · coupure {selected.anchor ? dateText(selected.anchor.observedState.asOf) : 'ancre absente'}</dd></div>
      </dl>
      {selected.reasons.length > 0 ? <ul className="hv55-observation-reasons" aria-label="Limites d’applicabilité">
        {selected.reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}
      </ul> : null}
      <p className="hv55-observation-origin">Source déclarée : {selected.observation.origin.description}
        </p>
      <details className="hv55-observation-details"><summary>Identité, auteur et état de l’ancre</summary>
        <dl><dt>Note exacte</dt><dd><code>{selected.observationReference.id} · v{selected.observationReference.version}</code></dd>
          <dt>Référence de contenu</dt><dd><code>{selected.observationReference.contentReference}</code></dd>
          <dt>Auteur</dt><dd>{selected.observation.author.label}{selected.observation.author.id ? ` · ${selected.observation.author.id}` : ''}</dd>
          <dt>Origine</dt><dd>{selected.observation.origin.kind} · {selected.observation.origin.description}{selected.observation.origin.sourceReference ? ` · ${selected.observation.origin.sourceReference}` : ''}</dd>
          {selected.observation.dimension.status === 'resolved' ? <><dt>Définition de dimension</dt><dd><code>{selected.observation.dimension.definition.dimensionReference} · {selected.observation.dimension.definition.contentReference}</code></dd></> : null}
          {selected.observation.comparison.kind === 'relative' ? <><dt>Référent initial</dt><dd>{selected.observation.comparison.referent
            ? <code>{selected.observation.comparison.referent.id} · v{selected.observation.comparison.referent.version} · {selected.observation.comparison.referent.contentReference}</code>
            : 'Non renseigné; conservé comme null.'}</dd></> : null}
          <dt>Lien au sujet</dt><dd>{selected.anchor ? subjectRelationLabel(selected.anchor.subjectRelation) : 'Aucune ancre'}</dd>
          {selected.anchor ? <><dt>Ancre exacte</dt><dd><code>{selected.anchor.id} · {selected.anchor.reference}</code></dd>
            <dt>État physique exact</dt><dd><code>{selected.anchor.observedState.resolutionReference}</code> · connaissance au {dateText(selected.anchor.observedState.knowledgeAsOf)}</dd></> : null}
          {Object.keys(selected.observation.context).length ? <><dt>Contexte original</dt><dd><ul className="hv55-observation-context">{contextEntries(selected.observation.context).map((row, index) =>
            <li key={`${row.path}-${index}`}><code>{row.path}</code> · {row.value}</li>)}</ul></dd></> : <><dt>Contexte original</dt><dd>Aucun détail contextuel supplémentaire déclaré.</dd></>}
          {selected.observation.scale.status === 'known' ? <><dt>Sources métrique</dt><dd>{selected.observation.scale.metric.sourceRefs.map(source => source.reference).join(' · ') || 'Aucune source attachée'}</dd>
            <dt>Sources d’échelle</dt><dd>{selected.observation.scale.scale.sourceRefs.map(source => source.reference).join(' · ') || 'Aucune source attachée'}</dd></> : null}
          {selected.observation.scale.status === 'known' ? <><dt>Identité métrique</dt><dd><code>{selected.observation.scale.metric.id} · v{selected.observation.scale.metric.version}</code></dd>
            <dt>Identité d’échelle</dt><dd><code>{selected.observation.scale.scale.id} · v{selected.observation.scale.scale.version}</code></dd></> : null}
        </dl>
      </details>
    </article> : <div className="hv55-observation-empty" role="status">
      <strong>Aucune note n’est actuellement applicable.</strong>
      <p>{selection.reasons.length ? selection.reasons.join(' ') : 'Les observations restent visibles ci-dessous avec leurs statuts et raisons.'}</p>
    </div>}
    {alternativeCount > 0 ? <details className="hv55-observation-candidates" open={!selected && historicalAnchorChoices.length > 0}>
      <summary>Historique et autres notes · {alternativeCount}</summary>
      {historicalAnchorChoices.length ? <ul className="hv55-observation-historical-anchors" aria-label="Ancres historiques non courantes">
        {historicalAnchorChoices.map(choice => {
          const source = historicalChoiceSource(choice);
          const exactAnchor = historicalChoiceHasAnchor(choice);
          const isCurrentVersion = selected?.observationReference.contentReference === choice.observationReference.contentReference;
          const ready = !!source && exactAnchor && !isCurrentVersion;
          const selectedForEditor = activeHistoricalAnchorRecordId === choice.anchorRecordId;
          return <li key={`${choice.anchorRecordId}:${choice.anchorReference}:${choice.observationReference.contentReference}`}
            className={selectedForEditor ? 'is-selected' : undefined}>
            <div className="hv55-observation-historical-heading"><strong>{choice.subjectLabel}</strong>
              <span className="hv55-observation-historical-status">Ancre historique · non courante</span></div>
            <p className="hv55-observation-historical-label">{choice.observationLabel} · {dateText(choice.observedAt)}</p>
            {source ? <p className="hv55-observation-historical-value">{observationValue(source)} · {observationScale(source)}</p>
              : <p className="hv55-observation-historical-warning" role="status">La version affichée ne correspond pas à la référence NR exacte de cette ancre; aucune valeur n’est substituée.</p>}
            <p className="hv55-observation-historical-value">Statut de la note la plus récente · {CANDIDATE_STATUS[choice.candidate.status]}</p>
            {isCurrentVersion ? <p className="hv55-observation-historical-warning" role="status">Cette version est déjà l’observation courante; garde le parcours courant pour la comparer.</p> : null}
            {!exactAnchor ? <p className="hv55-observation-historical-warning" role="status">L’ancre choisie n’est pas portée par cette candidate résolue.</p> : null}
            {selectedForEditor ? <p className="hv55-observation-historical-active" role="status">Point de départ choisi pour la question en cours.</p> : null}
            <button type="button" className="hv55-observation-secondary" disabled={!historicalActionEnabled || !ready}
              onClick={() => onStartFromHistoricalAnchor?.(choice)}>Comparer depuis cette observation historique</button>
            <details className="hv55-observation-details"><summary>Identités exactes de la note et de l’ancre</summary>
              <dl><dt>Ancre</dt><dd><code>{choice.anchorRecordId} · {choice.anchorReference}</code></dd>
                <dt>Version NR</dt><dd><code>{choice.observationReference.id} · v{choice.observationReference.version} · {choice.observationReference.contentReference}</code></dd>
              </dl>
            </details>
          </li>;
        })}
      </ul> : null}
      {alternatives.length ? <ul>{alternatives.map((candidate, index) => <li key={`${candidate.observation.id}-${candidate.observation.version}-${index}`}>
        <strong>{candidateHeading(candidate)}</strong><span>{CANDIDATE_STATUS[candidate.status]}</span>
        <p>{candidate.observation.originalText}</p>
        {candidate.reasons.length ? <ul>{candidate.reasons.map((reason, reasonIndex) => <li key={`${reasonIndex}-${reason}`}>{reason}</li>)}</ul> : null}
        <details className="hv55-observation-details"><summary>Identité exacte de cette version</summary>
          <dl><dt>Observation</dt><dd><code>{candidate.observationReference.id} · v{candidate.observationReference.version} · {candidate.observationReference.contentReference}</code></dd>
            <dt>Ancres conservées</dt><dd>{candidate.anchorReferences.length ? candidate.anchorReferences.map(reference => <code key={reference}>{reference} </code>) : 'Aucune ancre exacte associée.'}</dd>
          </dl>
        </details>
      </li>)}</ul> : null}
    </details> : null}
  </section>;
}

function dateForArchive(value: string): string {
  return dateText(value);
}

function applicabilityText(value: BrewingObservationProjection['currentApplicability']): string {
  const labels: Record<typeof value.status, string> = {
    applicable: 'Applicable sous le périmètre déclaré', partial: 'Applicabilité partielle', unknown: 'Applicabilité inconnue',
    conflicting: 'État contradictoire', historical: 'État historique', differentSubject: 'Autre sujet', continuityUnknown: 'Continuité inconnue',
  };
  return labels[value.status];
}

function FrameResults({ view }: { view: BrewingObservationProjectionView }) {
  const titleId = useId();
  const label: Record<BrewingObservationProjection['frames'][number]['status'], string> = {
    projected: 'Projection numérique disponible', outOfDomain: 'Hors domaine déclaré',
    nonComparable: 'Métriques non comparables', unknown: 'Résultat inconnu',
  };
  return <section className="hv55-observation-frame-results" aria-labelledby={titleId}>
    <h3 id={titleId}>États de chaque cadre adopté</h3>
    <div className="hv55-observation-table-scroll" role="region" aria-label="Valeurs et statuts des cadres archivés" tabIndex={0}>
      <table><caption>Les valeurs centrales proviennent du résultat archivé. Une valeur hors échelle reste brute et n’est pas dessinée comme une position valide.</caption>
        <thead><tr><th scope="col">Cadre</th><th scope="col">Statut</th><th scope="col">Centrale ancrée</th><th scope="col">Centrale cible</th><th scope="col">Delta modélisé</th><th scope="col">Valeur brute</th><th scope="col">Raisons et limites</th></tr></thead>
        <tbody>{view.results.map(({ candidateId, frame }) => {
          return <tr key={candidateId} data-frame-status={frame.status}>
            <th scope="row">{frame.name}</th>
            <td>{label[frame.status]}</td>
            <td>{frame.observedCentral === null ? 'Non fournie' : numberText(frame.observedCentral)}</td>
            <td>{frame.targetCentral === null ? 'Non fournie' : numberText(frame.targetCentral)}</td>
            <td>{frame.delta === null ? 'Non calculable' : numberText(frame.delta)}</td>
            <td>{frame.rawProjection === null ? 'Non fournie' : <><strong>{rangeText(frame.rawProjection)}</strong>{frame.status === 'outOfDomain' ? <small>Valeur brute hors domaine, conservée hors graphique.</small> : null}</>}</td>
            <td>{frame.issues.length ? <ul>{frame.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul> : null}
              {frame.limitations.map((limitation, index) => <p key={`${index}-${limitation}`}>{limitation}</p>)}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {view.results.map(({ candidateId, frame }) => frame.declaredCentrals.length ? <details className="hv55-observation-details" key={`centrals-${candidateId}`}>
      <summary>Centrales déclarées dans le modèle · {frame.name}</summary>
      <ul className="hv55-observation-centrals">{frame.declaredCentrals.map((row, index) => <li key={`${row.path}-${index}`}>
        <code>{row.path}</code> · {numberText(row.value)}{row.source ? ` · ${row.source.title} · ${row.source.reference}${row.source.locator ? ` · ${row.source.locator}` : ''}` : ' · source non attachée à cette centrale'}
      </li>)}</ul>
    </details> : null)}
  </section>;
}

function StoredInputs({ projection }: { projection: BrewingObservationProjection }) {
  const titleId = useId();
  const request = projection.requestSnapshot;
  const observed = request.observedInput;
  const target = request.targetInput;
  const targetRequest = target.source;
  const formatHours = (value: number) => `${numberText(value)} h`;
  const horizon = targetRequest.horizon.kind === 'instant'
    ? `Instant ${dateText(targetRequest.horizon.at)} · ${targetRequest.horizon.explanation}`
    : `Après l’événement exact ${targetRequest.horizon.eventReference} · ${formatHours(targetRequest.horizon.durationHours)} · ${targetRequest.horizon.explanation}`;
  return <section className="hv55-observation-stored-inputs" aria-labelledby={titleId}>
    <h3 id={titleId}>État physique et cible conservés</h3>
    <dl className="hv55-observation-facts">
      <div><dt>Contexte commun du modèle</dt><dd>{observed.source.context.explanation} · {numberText(observed.source.context.input.volumeL)} L · souche incluse au contexte · {observed.source.context.origin === 'recorded' ? 'valeur enregistrée' : 'hypothèse déclarée'}</dd></div>
      <div><dt>État réalisé utilisé</dt><dd>{dateText(observed.source.state.asOf)} · connaissances lues au {dateText(observed.source.state.knowledgeAsOf)} · dépendances explicitement déclarées</dd></div>
      <div><dt>Statut de l’entrée</dt><dd>{observed.status === 'available' ? 'Entrée de modèle disponible' : 'Entrée inconnue · le calcul garde ses manques'}</dd></div>
      <div><dt>Cible déclarée</dt><dd>{targetRequest.explanation} · {horizon}</dd></div>
      <div><dt>Statut de la cible</dt><dd>{target.status === 'available' ? 'Cible construite depuis les valeurs déclarées' : 'Cible incomplète ou inconnue'}</dd></div>
    </dl>
    <details className="hv55-observation-details"><summary>Références exactes de l’état et du contexte modèle</summary>
      <dl><dt>État physique</dt><dd><code>{observed.source.state.physicalStateReference}</code></dd>
        <dt>Résolution de l’état</dt><dd><code>{observed.source.state.resolutionReference}</code></dd>
        <dt>Connaissance lue</dt><dd><code>{observed.source.state.knowledgeReference.id} · {observed.source.state.knowledgeReference.version} · {observed.source.state.knowledgeReference.contentReference}</code></dd>
        <dt>Portée de dépendances</dt><dd><code>{observed.source.scope.id}</code> · {observed.source.scope.dependencyIds.join(', ')} · {observed.source.scope.explanation}</dd>
        <dt>Contexte de modèle</dt><dd>{observed.source.context.source.title} · {observed.source.context.source.reference} · <code>{observed.source.context.input.yeastId ?? 'culture non identifiée'}</code></dd>
        <dt>Référence de l’entrée</dt><dd><code>{observed.reference}</code></dd>
        <dt>Référence de la cible</dt><dd><code>{target.reference}</code></dd>
      </dl>
    </details>
    <div className="hv55-observation-input-columns">
      <section aria-label="Ajouts réalisés figés">
        <h4>Ajouts réalisés figés</h4>
        {observed.used.length ? <ul>{observed.used.map(row => {
          const addition = observed.knownAdditions.find(value => value.id === row.additionId);
          return <li key={`${row.additionId}-${row.factReference}`}><strong>{addition?.name ?? 'Ajout réalisé'}</strong> · {numberText(row.grams)} g · contact {formatHours(row.elapsedHours)}{row.ended ? ' terminé' : ' actif'}
            {addition ? <small>Entrée modèle : {addition.triplet.timing ? TIMING_LABEL[addition.triplet.timing] : 'moment inconnu'} · dose {addition.triplet.doseGL === null ? 'inconnue' : `${numberText(addition.triplet.doseGL)} g/L`}
              · température {addition.triplet.temperatureC === null ? 'inconnue' : `${numberText(addition.triplet.temperatureC)} °C`} · contact {addition.triplet.contactHours === null ? 'inconnu' : formatHours(addition.triplet.contactHours)}
              {addition.triplet.matrixId ? ` · matrice ${addition.triplet.matrixId}` : ' · matrice non renseignée'}</small> : null}
            <details className="hv55-observation-details"><summary>Identités exactes du fait et du contact</summary>
              <dl><dt>Ajout</dt><dd><code>{row.additionId}</code></dd><dt>Fait</dt><dd><code>{row.factReference}</code></dd>
                <dt>Contact</dt><dd><code>{row.contactReference}</code></dd><dt>Matière</dt><dd><code>{row.materialId}</code></dd>
                {addition?.triplet.yeastId ? <><dt>Culture du modèle</dt><dd><code>{addition.triplet.yeastId}</code></dd></> : null}
              </dl>
            </details></li>;
        })}</ul> : <p>Aucun ajout réalisé utilisé n’est déclaré dans cette entrée.</p>}
        {observed.issues.length ? <ul className="hv55-observation-input-issues">{observed.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul> : null}
      </section>
      <section aria-label="Ajouts et contacts de la cible">
        <h4>Écarts explicitement demandés</h4>
        {targetRequest.contactTargets.length ? <ul>{targetRequest.contactTargets.map(row => {
          const name = targetRequest.current.knownAdditions.find(item => item.id === row.additionId)?.name ?? 'Contact réalisé';
          return <li key={`contact-${row.additionId}`}>Contact {name} · {formatHours(row.contactHours)} · {row.explanation}
            <details className="hv55-observation-details"><summary>Clé exacte du contact</summary><code>{row.additionId}</code></details></li>;
        })}</ul> : <p>Aucune durée de contact supplémentaire n’est demandée.</p>}
        {targetRequest.future.length ? <ul>{targetRequest.future.map(row => {
          const material = targetRequest.current.source.materials.find(item => item.id === row.materialId);
          return <li key={row.id}><strong>{material?.name ?? 'Matière non nommée'}</strong> · {TIMING_LABEL[row.timing]} · contact {formatHours(row.contactHours)}
          {row.temperatureC === null ? ' · température inconnue' : ` · ${numberText(row.temperatureC)} °C`}{row.matrixId ? ` · matrice ${row.matrixId}` : ' · matrice non renseignée'}
          {row.quantity.kind === 'remaining' ? ` · ${numberText(row.quantity.grams)} g restants à ajouter`
            : ` · ${numberText(row.quantity.grams)} g au total, faits inclus : ${row.quantity.realizedFactReferences.join(' ; ')}`}
          <small>{row.explanation}</small>
          <details className="hv55-observation-details"><summary>Identifiants exacts de cet ajout</summary><dl>
            <dt>Ajout futur</dt><dd><code>{row.id}</code></dd><dt>Matière</dt><dd><code>{row.materialId}</code></dd>
            {row.quantity.kind === 'totalIncludingRealized' ? <><dt>Faits inclus</dt><dd>{row.quantity.realizedFactReferences.map(reference => <code key={reference}>{reference} </code>)}</dd></> : null}
          </dl></details></li>;
        })}</ul> : <p>Aucun ajout futur n’est inclus dans la cible.</p>}
        {target.remaining.length ? <details className="hv55-observation-details"><summary>Lecture arithmétique fournie par le constructeur de cible</summary>
          <ul>{target.remaining.map(row => <li key={row.additionId}><strong>{row.additionId}</strong> · prévu {numberText(row.plannedGrams)} g · réalisé {row.realizedGrams === null ? 'inconnu' : `${numberText(row.realizedGrams)} g`}
            {row.remainingGrams !== null ? ` · reste ${numberText(row.remainingGrams)} g` : row.deficitGrams !== null ? ` · déficit ${numberText(row.deficitGrams)} g` : ' · reste non calculable'}
            {row.realizedFactReferences.length ? ` · références ${row.realizedFactReferences.join(' ; ')}` : ''}
          </li>)}</ul>
          <p>Aucune soustraction n’est refaite par l’écran. Le total, les quantités réalisées et le reste viennent de l’archive.</p>
        </details> : null}
        {target.issues.length ? <ul className="hv55-observation-input-issues">{target.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul> : null}
      </section>
    </div>
  </section>;
}

function compactIndexText(value: number | HopRange): string {
  const compact = (number: number) => number.toLocaleString('fr-CH', { maximumFractionDigits: 3 });
  return typeof value === 'number' ? compact(value) : `${compact(value.min)}–${compact(value.max)}`;
}

function comparisonUnit(metric: BrewingObservationArithmeticContract['definition']['metric']): string {
  if (metric?.kind === 'modelIndex' && metric.unit === 'axisScale') return 'points d’indice';
  return metric?.unit ?? 'unité non déclarée';
}

const SUMMARY_VALUE_STATUS = { observed: 'Observé', hypothetical: 'Projection hypothétique', target: 'Cible' } as const;

function isNumericComparisonValue(value: BrewingSensoryComparisonValue | undefined): value is Extract<BrewingSensoryComparisonValue, { status: 'observed' | 'hypothetical' | 'target' }> {
  return !!value && (value.status === 'observed' || value.status === 'hypothetical' || value.status === 'target');
}

function compactComparisonValue(dimension: BrewingSensoryComparisonDimension, value: BrewingSensoryComparisonValue | undefined): string {
  if (!value) return 'Valeur absente du DTO';
  if (!isNumericComparisonValue(value)) return value.status === 'documented' ? 'Mention documentée · sans score'
    : value.status === 'nonDocumented' ? 'Non documenté · pas de valeur numérique' : `Inconnu · ${value.reason}`;
  const declaredUnit = comparisonUnit(dimension.definition.metric);
  const unit = declaredUnit === 'unité non déclarée' ? '' : ` ${declaredUnit}`;
  if ('value' in value) return `${SUMMARY_VALUE_STATUS[value.status]} · ${compactIndexText(value.value)}${unit}`;
  return `${SUMMARY_VALUE_STATUS[value.status]} · ${compactIndexText(value.range)}${unit}${value.central === undefined ? ' · centrale non fournie' : ` · centrale ${compactIndexText(value.central)}${unit}`}`;
}

function signedIndexText(value: number): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${compactIndexText(Math.abs(value))}`;
}

function frameLimitationText(frame: BrewingObservationProjection['frames'][number], projection: BrewingObservationProjection): string {
  const messages: string[] = [];
  if (projection.numerical.status === 'nonComparable') {
    const reasons = projection.numerical.reasons.map(row => row.message).join(' ');
    messages.push(`Note et indice non comparables sous la convention de cette question. ${reasons}`);
  }
  const stabilityIssue = frame.issues.find(issue => issue.code === 'restStabilityNotEstablished');
  if (stabilityIssue) messages.push(`Note totale non établie. ${stabilityIssue.message}`);
  if (frame.status === 'outOfDomain') messages.push('La valeur totale reste hors domaine déclaré et n’est pas une note projetée valide.');
  messages.push(...frame.issues.filter(issue => issue.code !== 'restStabilityNotEstablished'
    && issue.code !== 'numericallyNonComparable').map(issue => issue.message));
  if (frame.status === 'unknown' && !messages.length) messages.push('Cadre inconnu ou modèle indisponible. Aucun résultat de modèle n’est archivé.');
  if (!messages.length) messages.push('Aucune note totale n’est fournie pour ce cadre.');
  return messages.join(' ');
}

function ObservationReadSummary({ view, projection, role }: { view: BrewingObservationProjectionView; projection: BrewingObservationProjection; role: HopV55ObservationProjectionRole }) {
  const titleId = useId();
  const request = projection.requestSnapshot;
  const modelDefinition = request.arithmetic.definition;
  const modelDimension = view.comparison.dimensions.find(dimension => dimension.definition.contentReference === modelDefinition.contentReference);
  const workingValue = modelDimension?.values.find(value => value.candidateId === 'working-anchor');
  const unit = comparisonUnit(modelDefinition.metric);
  const noteValueLabel = projection.numerical.status !== 'comparable'
    ? 'Note sous convention non comparable'
    : projection.numerical.valueStatus === 'hypotheticalInterpretation'
      ? 'Note sous convention déclarée' : 'Note source directement compatible';
  const frameRows = view.results.map(({ candidateId, frame }) => ({ candidateId, frame }));
  const restLabel = request.restStability.status === 'adopted' ? 'stabilité adoptée' : 'stabilité non établie';
  return <section className="hv55-observation-summary" aria-labelledby={titleId}>
    <header><div><p className="hv55-observation-eyebrow">Résumé de l’archive · sans nouveau calcul</p><h3 id={titleId}>Note, delta modélisé et portée</h3></div>
      <span>{ROLE_LABEL[role]}</span>
    </header>
    <dl>
      <div><dt>Note originale</dt><dd>{observationValue(view.observation)} · {observationScale(view.observation)}</dd></div>
      <div><dt>{noteValueLabel}</dt><dd>{modelDimension ? compactComparisonValue(modelDimension, workingValue) : 'Métrique de travail absente de la comparaison'}</dd></div>
      <div><dt>Portée du delta</dt><dd>{modelDefinition.dimension.name} · {modelDefinition.metric?.name ?? 'Métrique non déclarée'} · {unit}</dd></div>
      <div><dt>Cadre arithmétique</dt><dd>{request.arithmetic.operation === 'additiveDifference' ? 'Différence additive déclarée' : 'Hypothèse ordinale de travail déclarée'} · {request.arithmetic.explanation} · {restLabel}</dd></div>
    </dl>
    {frameRows.length ? <ul className="hv55-observation-summary-frames">{frameRows.map(({ candidateId, frame }) => {
      const simulationAtAnchor = frame.observedCentral === null
        ? 'Simulation à l’ancre non disponible dans cette archive.'
        : `Simulation à l’ancre · ${compactIndexText(frame.observedCentral)} ${unit}${frame.targetCentral === null
          ? '' : ` · simulation de l’état cible ${compactIndexText(frame.targetCentral)} ${unit}`}`;
      const deltaText = frame.delta === null ? 'Aucun delta modélisé disponible dans cette archive.'
        : `Delta modélisé disponible · ${signedIndexText(frame.delta)} ${unit}`;
      return <li key={candidateId} data-frame-status={frame.status}><strong>{frame.name}</strong>
        {frame.status === 'projected' && frame.rawProjection !== null
          ? <><span>Projection hypothétique · {compactIndexText(frame.rawProjection)} {unit} · écart modélisé {frame.delta === null ? 'non calculable' : `${compactIndexText(frame.delta)} ${unit}`}</span>
            <span>{simulationAtAnchor}</span></>
          : frame.status === 'outOfDomain' && frame.rawProjection !== null
            ? <><span>Hors domaine · valeur brute {compactIndexText(frame.rawProjection)} {unit}, non placée sur l’axe · {deltaText}</span>
              <span>{simulationAtAnchor}</span><span>{frameLimitationText(frame, projection)}</span></>
            : <><span>{deltaText}</span><span>{simulationAtAnchor}</span>
              <span>{frameLimitationText(frame, projection)}</span></>}
      </li>;
    })}</ul> : <p>Aucun cadre adopté n’est archivé dans cette question.</p>}
    <p className="hv55-observation-summary-note">Les indices du résumé sont arrondis pour lecture. Le tableau sensoriel et le détail des cadres conservent les valeurs exactes de l’archive.</p>
  </section>;
}

function SelectedProjection({ entry }: { entry: Extract<ProjectionEntry, { status: 'available' }> }) {
  const titleId = useId();
  const { record, view } = entry;
  const [mode, setMode] = useState<'bars' | 'radar'>('bars');
  const [candidateIds, setCandidateIds] = useState(() => [...view.comparison.candidateOrder]);
  const [dimensionIds, setDimensionIds] = useState(() => [...view.comparison.dimensionOrder]);
  const observation = view.observation;
  const snapshot = entry.projection.requestSnapshot;
  return <section className="hv55-observation-open" aria-labelledby={titleId}>
    <header className="hv55-observation-open-heading">
      <div><p className="hv55-observation-eyebrow">Question figée · archive locale</p><h2 id={titleId}>{record.question.text}</h2></div>
      <span>{ROLE_LABEL[record.role]}</span>
    </header>
    <dl className="hv55-observation-facts">
      <div><dt>Note d’ancrage</dt><dd>{subjectKindLabel(snapshot.anchor.observation.subject.kind)} · {snapshot.anchor.observation.subject.label} · {dateForArchive(snapshot.anchor.observation.observedAt)} · version {snapshot.anchor.observation.version}</dd></div>
      <div><dt>État à l’ancre</dt><dd>{dateForArchive(snapshot.anchor.observedState.asOf)} · {applicabilityText(view.anchorApplicability)}</dd></div>
      <div><dt>Applicabilité évaluée lors de cette question</dt><dd>{applicabilityText(view.currentApplicability)}</dd></div>
    </dl>
    <details className="hv55-observation-details"><summary>Identités et empreintes exactes de l’archive</summary>
      <dl><dt>Question</dt><dd><code>{record.id}</code></dd><dt>Référence de question</dt><dd><code>{record.question.projectionQuestionReference}</code></dd>
        <dt>Ancre</dt><dd><code>{record.anchorRecordId} · {record.anchorReference}</code></dd><dt>Observation</dt><dd><code>{snapshot.anchor.observation.id} · v{snapshot.anchor.observation.version}</code></dd>
        <dt>État physique</dt><dd><code>{snapshot.anchor.observedState.resolutionReference}</code></dd><dt>Projection</dt><dd><code>{record.projectionReference}</code></dd>
      </dl>
    </details>
    <blockquote className="hv55-observation-original">{observation.originalText}<footer>Observation d’origine, {observationValue(observation)} · {observationScale(observation)}</footer></blockquote>
    <details className="hv55-observation-details"><summary>Contexte original de la note · source figée</summary>
      {Object.keys(observation.context).length ? <ul className="hv55-observation-context">{contextEntries(observation.context).map((row, index) =>
        <li key={`${row.path}-${index}`}><code>{row.path}</code> · {row.value}</li>)}</ul> : <p>Aucun détail contextuel supplémentaire n’est déclaré dans la note.</p>}
      {observation.origin.sourceReference ? <p>Référence d’origine : <code>{observation.origin.sourceReference}</code></p> : null}
    </details>
    <p className="hv55-observation-guard">La question et son ancre restent celles de l’archive. Une note devenue courante depuis n’altère pas cette projection.</p>
    <StoredInputs projection={entry.projection} />
    <ObservationReadSummary view={view} projection={entry.projection} role={record.role} />
    <HopV55SensoryComparison comparison={view.comparison} candidateIds={candidateIds} dimensionIds={dimensionIds} mode={mode}
      onModeChange={setMode}
      onToggleCandidate={id => setCandidateIds(current => current.includes(id) ? current.filter(row => row !== id) : [...current, id])}
      onToggleDimension={id => setDimensionIds(current => current.includes(id) ? current.filter(row => row !== id) : [...current, id])} />
    <details className="hv55-observation-frame-details"><summary>Valeurs centrales, delta et raisons exactes · {view.results.length} cadre{view.results.length === 1 ? '' : 's'}</summary>
      <FrameResults view={view} />
    </details>
    {view.limitations.length ? <details className="hv55-observation-details"><summary>Limites et hypothèses archivées · {view.limitations.length}</summary>
      <ul>{view.limitations.map((limitation, index) => <li key={`${index}-${limitation}`}>{limitation}</li>)}</ul>
      <p>Cadre adopté : {snapshot.frames.map(frame => `${frame.name} · ${frame.plan.explanation}`).join(' ; ')}</p>
      <p>Contrat d’arithmétique : {snapshot.arithmetic.operation === 'additiveDifference' ? 'différence additive' : 'hypothèse ordinale de travail'} · {snapshot.arithmetic.explanation}</p>
      <p>Stabilité du reste : {snapshot.restStability.status === 'adopted' ? 'adoptée' : 'non établie'} · {snapshot.restStability.explanation}</p>
      {snapshot.restStability.conditions.length ? <ul>{snapshot.restStability.conditions.map(condition => <li key={condition.id}>
        {condition.status === 'declaredCompatible' ? 'Compatibilité déclarée' : condition.status === 'unknown' ? 'Inconnue' : 'Changement déclaré'} · {condition.explanation}
        {condition.sourceRefs.length ? ` · sources ${condition.sourceRefs.map(source => source.reference).join(' ; ')}` : ''}</li>)}</ul> : null}
      <details className="hv55-observation-details"><summary>Identités exactes des cadres et contrats</summary>
        <ul>{snapshot.frames.map(frame => <li key={frame.id}>{frame.name} · plan <code>{frame.plan.planId} r${frame.plan.revision} · ${frame.plan.reference}</code></li>)}
          <li>Arithmétique <code>{snapshot.arithmetic.id} · {snapshot.arithmetic.operation} · {snapshot.arithmetic.definition.contentReference}</code></li>
          <li>Stabilité <code>{snapshot.restStability.status}</code></li>
        </ul>
      </details>
    </details> : null}
  </section>;
}

export function HopV55ObservationExplorer({ currentSelection, projectionRecords, selectedProjectionId, onSelectProjection,
  projectionEditor, historicalAnchorChoices = [], onStartFromHistoricalAnchor, onPrepareProjection }: HopV55ObservationExplorerProps) {
  const titleId = useId();
  const historyTitleId = useId();
  const entries = useMemo(() => projectionRecords.map(readProjectionEntry), [projectionRecords]);
  const selected = selectedProjectionId ? entries.find(entry => entry.id === selectedProjectionId) : undefined;
  const [editing, setEditing] = useState<{ candidate: BrewingObservationSelectionCandidateV1;
    options: HopV55ObservationProjectionEditorOptions;
    sourceAnchor?: HopV55ObservationProjectionDraft['sourceAnchor'] } | null>(null);
  const [historicalStartError, setHistoricalStartError] = useState('');
  const currentCandidate = currentSelection.selected;
  const canStart = currentCandidate?.status === 'applicable' && !!currentCandidate.anchor;
  const canStartHistorical = !!projectionEditor && !!onPrepareProjection && !!onStartFromHistoricalAnchor;
  const start = () => {
    if (!currentCandidate || !projectionEditor) return;
    setEditing({ candidate: structuredClone(currentCandidate), options: structuredClone(projectionEditor) });
  };
  const startFromHistoricalAnchor = async (choice: HopV55HistoricalObservationAnchorChoice) => {
    if (!projectionEditor || !onPrepareProjection || !onStartFromHistoricalAnchor
      || !historicalChoiceSource(choice) || !historicalChoiceHasAnchor(choice)) return;
    try {
      await onStartFromHistoricalAnchor(choice);
      setEditing({ candidate: choice.candidate, options: structuredClone(projectionEditor), sourceAnchor: {
        anchorRecordId: choice.anchorRecordId,
        anchorReference: choice.anchorReference,
        expectedObservationReference: structuredClone(choice.observationReference),
      } });
    } catch {
      setHistoricalStartError('L’ancre historique n’est plus disponible avec cette référence exacte. Relis le journal et choisis une ancre toujours conservée.');
    }
  };
  const editingCandidateIsCurrent = !!editing && (editing.sourceAnchor
    ? historicalAnchorChoices.some(choice => choice.anchorRecordId === editing.sourceAnchor?.anchorRecordId
      && choice.anchorReference === editing.sourceAnchor.anchorReference
      && choice.observationReference.id === editing.sourceAnchor.expectedObservationReference.id
      && choice.observationReference.version === editing.sourceAnchor.expectedObservationReference.version
      && choice.observationReference.contentReference === editing.sourceAnchor.expectedObservationReference.contentReference)
    : currentCandidate?.observationReference.contentReference === editing.candidate.observationReference.contentReference)
    && projectionEditor?.currentInput.reference === editing.options.currentInput.reference;

  return <section className="hv55-observation-explorer" aria-labelledby={titleId}>
    <header className="hv55-observation-explorer-heading">
      <div><p className="hv55-observation-eyebrow">Faits, puis question</p><h1 id={titleId}>Explorer depuis une observation</h1>
        <p>La note d’origine et l’état physique gardent leur portée. Une projection future reste une hypothèse distincte.</p></div>
    </header>
    <CurrentObservation selection={currentSelection} historicalAnchorChoices={historicalAnchorChoices}
      activeHistoricalAnchorRecordId={editing?.sourceAnchor?.anchorRecordId} historicalActionEnabled={canStartHistorical && !editing}
      onStartFromHistoricalAnchor={choice => { setHistoricalStartError(''); void startFromHistoricalAnchor(choice); }} />
    {historicalStartError ? <p className="hv55-observation-unavailable" role="alert">{historicalStartError}</p> : null}
    {(editing || canStart && projectionEditor && onPrepareProjection) ? <section className="hv55-observation-start"
      aria-label={editing?.sourceAnchor ? 'Créer une question depuis une observation historique' : 'Créer une question depuis la note applicable'}>
      {!editing && canStart ? <button type="button" className="hv55-observation-primary" onClick={start}>Explorer depuis cette note</button>
        : <button type="button" className="hv55-observation-secondary" onClick={() => setEditing(null)}>Fermer l’éditeur</button>}
      {editing ? <>
        {editing.sourceAnchor ? <p className="hv55-observation-historical-source" role="status">
          Point de départ : {editing.candidate.observation.subject.label} · {editing.sourceAnchor.expectedObservationReference.id} v{editing.sourceAnchor.expectedObservationReference.version}, dégustation à {dateText(editing.candidate.observation.observedAt)}.
          État documenté comparé : {dateText(editing.options.currentInput.source.state.asOf)}. Cette note ne décrit pas directement l’état actuel.
        </p> : null}
        {!editingCandidateIsCurrent ? <p className="hv55-observation-unavailable" role="status">{editing.sourceAnchor
          ? 'L’ancre historique choisie ou l’état courant a changé depuis l’ouverture. La note de départ reste séparée de la cible; relis les références avant toute nouvelle question.'
          : `La note ou l’état courant a changé depuis l’ouverture. Cette question reste liée à ${editing.candidate.observation.id} v${editing.candidate.observation.version}; le parent vérifiera l’identité et l’état avant tout calcul ou archivage.`}</p> : null}
        {onPrepareProjection ? <ObservationProjectionEditor key={editing.candidate.observationReference.contentReference}
          candidate={editing.candidate} options={editing.options} sourceAnchor={editing.sourceAnchor} sourceStillCurrent={editingCandidateIsCurrent}
          onCancel={() => setEditing(null)} onPrepareProjection={onPrepareProjection} /> : null}
      </> : null}
    </section> : !canStart && historicalAnchorChoices.length === 0
      ? <p className="hv55-observation-unavailable" role="status">L’exploration numérique attend une observation exacte avec ancre applicable.</p> : null}
    <section className="hv55-observation-history" aria-labelledby={historyTitleId}>
      <header><p className="hv55-observation-eyebrow">Archives persistées</p><h2 id={historyTitleId}>Questions et projections</h2></header>
      {selectedProjectionId && !selected ? <p className="hv55-observation-empty" role="status">La question sélectionnée n’est pas présente dans les archives chargées.</p> : null}
      {entries.length === 0 ? <p className="hv55-observation-empty">Aucune question archivée. Une projection apparaît ici seulement après sa sauvegarde locale.</p> : <ul className="hv55-observation-archive-list">
        {entries.map(entry => <li key={entry.id} className={entry.id === selectedProjectionId ? 'is-selected' : undefined}>
          <div><strong>{entry.question}</strong><span>{entry.role}{entry.status === 'unsupported' ? ' · format futur, lecture seule' : entry.status === 'invalid' ? ' · archive illisible' : ''}</span>
            {entry.status !== 'available' ? <small>{entry.reason}</small> : <small>Observation du {dateText(entry.view.observation.observedAt)} · archive locale</small>}</div>
          <button type="button" className="hv55-observation-secondary" aria-pressed={entry.id === selectedProjectionId}
            onClick={() => onSelectProjection(entry.id === selectedProjectionId ? null : entry.id)}>{entry.id === selectedProjectionId ? 'Fermer la question' : 'Ouvrir la question'}</button>
        </li>)}
      </ul>}
      {selected?.status === 'available' ? <SelectedProjection key={selected.id} entry={selected} /> : selected?.status === 'unsupported' ? <div className="hv55-observation-empty" role="status">
        <h3>Archive en lecture seule</h3><p>{selected.reason} Le contenu d’un format futur est préservé; aucune conversion ni recalcul n’est fait.</p>
      </div> : selected?.status === 'invalid' ? <div className="hv55-observation-empty" role="alert"><h3>Archive non affichée</h3><p>{selected.reason}</p></div> : null}
    </section>
  </section>;
}

type EditorState = {
  question: string;
  role: HopV55ObservationProjectionRole | '';
  targetMode: 'instant' | 'relative' | '';
  instantAt: string;
  eventReference: string;
  durationHours: string;
  horizonExplanation: string;
  targetExplanation: string;
  future: FutureDraft[];
  contacts: Record<string, ContactDraft>;
  selectedFrames: string[];
  arithmeticChoiceId: string;
  restMode: '' | 'notEstablished' | 'adopted';
  restExplanation: string;
  restAuthor: string;
  restConditions: HopV55ObservationStabilityConditionDraft[];
  stabilityProposalReference: string;
  stabilityNeedsReadoption: boolean;
};

const COMPARISON_BINDING_FIELDS = new Set<keyof EditorState>(['question', 'role', 'targetMode', 'instantAt', 'eventReference',
  'durationHours', 'horizonExplanation', 'targetExplanation', 'future', 'contacts', 'selectedFrames', 'arithmeticChoiceId']);

function patchEditorState(current: EditorState, patch: Partial<EditorState>): EditorState {
  const changesBinding = Object.keys(patch).some(key => COMPARISON_BINDING_FIELDS.has(key as keyof EditorState));
  const next = { ...current, ...patch };
  if (changesBinding && current.restMode) {
    return { ...next, restMode: '', restExplanation: '', restAuthor: '', restConditions: [],
      stabilityProposalReference: '', stabilityNeedsReadoption: true };
  }
  if (patch.restMode) return { ...next, stabilityNeedsReadoption: false };
  return next;
}

type FutureDraft = {
  id: string;
  materialId: string;
  timing: HopTiming | '';
  contactHours: string;
  temperatureC: string;
  matrixId: string;
  quantityKind: '' | 'remaining' | 'totalIncludingRealized';
  quantityGrams: string;
  realizedFactReferences: string[];
  explanation: string;
};

type ContactDraft = { included: boolean; contactHours: string; explanation: string };

type StabilitySourceDraft = HopV55ObservationStabilityConditionDraft['sources'][number];

const sourceKinds: Array<{ value: HopSourceKind; label: string }> = [
  { value: 'judgment', label: 'Déclaration personnelle' },
  { value: 'observation', label: 'Observation documentée' },
  { value: 'research', label: 'Étude de recherche' },
  { value: 'review', label: 'Revue documentaire' },
  { value: 'manufacturer', label: 'Documentation fabricant' },
  { value: 'coa', label: 'Certificat d’analyse' },
  { value: 'community', label: 'Source communautaire' },
];

function emptyStabilitySource(id: string): StabilitySourceDraft {
  return { id, title: '', author: '', year: '', kind: '', reference: '', locator: '' };
}

function emptyStabilityCondition(id: string): HopV55ObservationStabilityConditionDraft {
  return { id, status: '', explanation: '', sources: [emptyStabilitySource(`${id}-source-1`)] };
}

function stabilitySource(source: StabilitySourceDraft): HopSource | null {
  const title = source.title.trim(), author = source.author.trim(), reference = source.reference.trim();
  if (!title || !author || !reference || !source.kind) return null;
  const yearText = source.year.trim();
  const year = yearText ? Number(yearText) : null;
  if (year !== null && (!Number.isInteger(year) || year < 1)) return null;
  return { title, author, year, kind: source.kind, reference, ...(source.locator.trim() ? { locator: source.locator.trim() } : {}) };
}

function emptyFuture(id: string): FutureDraft {
  return { id, materialId: '', timing: '', contactHours: '', temperatureC: '', matrixId: '', quantityKind: '', quantityGrams: '', realizedFactReferences: [], explanation: '' };
}

function initialEditorState(input: BrewingObservedHopInput): EditorState {
  return { question: '', role: '', targetMode: '', instantAt: '', eventReference: '', durationHours: '', horizonExplanation: '', targetExplanation: '',
    future: [], contacts: Object.fromEntries(input.used.map(row => [row.additionId, { included: false, contactHours: '', explanation: '' }])),
    selectedFrames: [], arithmeticChoiceId: '', restMode: '', restExplanation: '', restAuthor: '', restConditions: [],
    stabilityProposalReference: '', stabilityNeedsReadoption: false };
}

function parseNumber(value: string): number | null {
  const normalized = value.trim().replace(/[\s\u202f\u00a0]/gu, '').replace(',', '.');
  if (!normalized || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function DecimalInput({ value, onChange, label, disabled = false }: {
  value: string; onChange: (value: string) => void; label: string; disabled?: boolean;
}) {
  const numericValue = parseNumber(value);
  return <NumberInput aria-label={label} value={numericValue === null ? undefined : numericValue} emptyValue={undefined}
    disabled={disabled} onValue={next => onChange(next === undefined ? '' : String(next))} />;
}

function positiveOrZero(value: string): number | null {
  const number = parseNumber(value);
  return number !== null && number >= 0 ? number : null;
}

function localInstant(value: string): string | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function activeContactLabel(input: BrewingObservedHopInput, additionId: string): string {
  const addition = input.knownAdditions.find(row => row.id === additionId);
  return addition?.name ?? additionId;
}

export function ObservationProjectionEditor({ candidate, options, sourceAnchor, sourceStillCurrent, onCancel, onPrepareProjection }: {
  candidate: BrewingObservationSelectionCandidateV1;
  options: HopV55ObservationProjectionEditorOptions;
  sourceAnchor?: { anchorRecordId: string; anchorReference: string; expectedObservationReference: BrewingObservationVersionReferenceV1 };
  sourceStillCurrent: boolean;
  onCancel: () => void;
  onPrepareProjection: NonNullable<HopV55ObservationExplorerProps['onPrepareProjection']>;
}) {
  const titleId = useId();
  const [state, setState] = useState(() => initialEditorState(options.currentInput));
  const [nextFutureId, setNextFutureId] = useState(1);
  const [nextStabilityConditionId, setNextStabilityConditionId] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const current = options.currentInput;
  const sourceReference = sourceAnchor?.expectedObservationReference;
  const sourceObservation = sourceReference
    && candidate.originalObservationReference.id === sourceReference.id
    && candidate.originalObservationReference.version === sourceReference.version
    && candidate.originalObservationReference.contentReference === sourceReference.contentReference
    ? candidate.originalObservation : candidate.observation;
  const exactFrames = options.adoptedFrames.filter(choice => choice.plan.status === 'adopted');
  const exactArithmeticChoices = options.arithmeticChoices;
  const exactMaterials = options.materials;
  const eventChoices = [
    { reference: current.source.state.physicalStateReference, label: `État physique · ${dateText(current.source.state.asOf)}` },
    { reference: current.source.state.resolutionReference, label: `Résolution des faits · ${dateText(current.source.state.asOf)}` },
    ...(options.horizonChoices ?? []),
  ].filter((choice, index, all) => all.findIndex(other => other.reference === choice.reference) === index);
  const eligibleFrames = exactFrames.filter(choice => state.selectedFrames.includes(choice.id));
  const selectedArithmetic = exactArithmeticChoices.find(choice => choice.id === state.arithmeticChoiceId);
  const stabilityConditions = state.restConditions.map(condition => ({
    id: condition.id,
    status: condition.status,
    explanation: condition.explanation.trim(),
    sourceRefs: condition.sources.flatMap(source => {
      const value = stabilitySource(source);
      return value ? [value] : [];
    }),
  }));
  const selectedRest: BrewingObservationRestStability | null = state.restMode === 'notEstablished'
    ? { status: 'notEstablished', explanation: state.restExplanation.trim(), conditions: [] }
    : state.restMode === 'adopted'
      ? { status: 'adopted', explanation: state.restExplanation.trim(), conditions: stabilityConditions as BrewingObservationRestStability['conditions'],
          adoptedBy: { origin: 'user', name: state.restAuthor.trim() } }
      : null;

  const set = (patch: Partial<EditorState>) => setState(currentState => patchEditorState(currentState, patch));
  const updateFuture = (id: string, patch: Partial<FutureDraft>) => setState(currentState => patchEditorState(currentState, {
    future: currentState.future.map(row => row.id === id ? { ...row, ...patch } : row) }));
  const updateContact = (id: string, patch: Partial<ContactDraft>) => setState(currentState => patchEditorState(currentState, {
    contacts: { ...currentState.contacts, [id]: { ...currentState.contacts[id], ...patch } } }));
  const updateStabilityCondition = (id: string, patch: Partial<HopV55ObservationStabilityConditionDraft>) => setState(currentState => ({ ...currentState,
    restConditions: currentState.restConditions.map(row => row.id === id ? { ...row, ...patch } : row) }));
  const updateStabilitySource = (conditionId: string, sourceId: string, patch: Partial<StabilitySourceDraft>) => setState(currentState => ({ ...currentState,
    restConditions: currentState.restConditions.map(condition => condition.id !== conditionId ? condition : ({ ...condition,
      sources: condition.sources.map(source => source.id === sourceId ? { ...source, ...patch } : source) })) }));
  const proposeStability = (proposal: HopV55ObservationStabilityProposal) => {
    const stability = proposal.stability;
    setState(currentState => ({ ...currentState, restMode: '', stabilityNeedsReadoption: false, stabilityProposalReference: proposal.reference,
      restExplanation: stability.explanation, restAuthor: '',
      restConditions: stability.conditions.map((condition, index) => ({ id: `rest-condition-${index + 1}`,
        status: condition.status, explanation: condition.explanation,
        sources: condition.sourceRefs.map((source, sourceIndex) => ({ id: `rest-condition-${index + 1}-source-${sourceIndex + 1}`,
          title: source.title, author: source.author, year: source.year === null ? '' : String(source.year),
          kind: source.kind, reference: source.reference, locator: source.locator ?? '' })) })) }));
    setNextStabilityConditionId(stability.conditions.length + 1);
  };

  const targetError = useMemo(() => {
    if (!state.role) return 'Choisis le rôle de cette question.';
    if (!state.question.trim()) return 'Formule la question à archiver.';
    if (!eligibleFrames.length) return 'Choisis au moins un cadre déjà adopté.';
    if (!selectedArithmetic || !selectedArithmetic.reference.trim()) return 'Choisis le contrat arithmétique exact déjà adopté dans le registre.';
    if (!selectedRest) return 'Choisis explicitement une stabilité adoptée pour cette question ou « non établie ». Rien n’est présélectionné.';
    if (!state.restExplanation.trim()) return 'Explique pourquoi le reste est considéré stable, ou pourquoi la stabilité n’est pas établie.';
    if (state.restMode === 'adopted') {
      if (!state.restAuthor.trim()) return 'Renseigne l’auteur de l’adoption.';
      if (!state.restConditions.length) return 'Décris au moins une condition du reste de la bière.';
      for (const [index, condition] of state.restConditions.entries()) {
        if (!condition.status) return `Choisis le statut de la condition ${index + 1}.`;
        if (!condition.explanation.trim()) return `Explique la condition ${index + 1}.`;
        if (!condition.sources.length || condition.sources.some(source => !stabilitySource(source))) {
          return `Chaque condition exige une source explicite complète (titre, auteur, nature et référence).`;
        }
      }
    }
    if (state.role === 'documentedAdvance') return '';
    if (!state.targetMode) return 'Choisis un horizon absolu ou relatif.';
    if (!state.horizonExplanation.trim() || !state.targetExplanation.trim()) return 'Décris l’horizon et la cible sans ajouter d’hypothèse implicite.';
    if (state.targetMode === 'instant' && !localInstant(state.instantAt)) return 'Saisis un instant cible valide.';
    if (state.targetMode === 'relative' && (!eventChoices.some(row => row.reference === state.eventReference)
      && !state.future.some(row => row.id === state.eventReference))) return 'Choisis un événement exact comme origine de l’horizon.';
    if (state.targetMode === 'relative' && positiveOrZero(state.durationHours) === null) return 'La durée relative doit être un nombre positif ou nul.';
    for (const future of state.future) {
      if (!future.materialId || !exactMaterials.some(material => material.id === future.materialId)) return 'Chaque ajout futur doit désigner une matière exacte.';
      if (!future.timing || !HOP_TIMINGS.includes(future.timing)) return 'Choisis le moment de chaque ajout futur.';
      if (positiveOrZero(future.contactHours) === null) return 'Le contact futur doit être un nombre positif ou nul.';
      if (future.temperatureC.trim() && parseNumber(future.temperatureC) === null) return 'La température future est invalide.';
      if (!future.quantityKind || positiveOrZero(future.quantityGrams) === null) return 'Déclare une quantité future en grammes et sa portée.';
      if (!future.explanation.trim()) return 'Explique chaque ajout futur.';
      if (future.quantityKind === 'totalIncludingRealized' && !future.realizedFactReferences.length) return 'Pour une quantité totale, choisis les faits réalisés inclus.';
      const wrongMaterialReference = future.realizedFactReferences.some(reference =>
        !options.realizedFactChoices?.some(choice => choice.reference === reference && choice.materialId === future.materialId));
      if (wrongMaterialReference) return 'Un fait réalisé choisi ne correspond plus à la matière de cet ajout.';
    }
    for (const used of current.used) {
      const contact = state.contacts[used.additionId];
      if (!contact?.included) continue;
      if (used.ended) {
        if (!contact.explanation.trim()) return 'Explique le maintien du contact déjà terminé.';
      } else if (positiveOrZero(contact.contactHours) === null || !contact.explanation.trim()) {
        return 'Déclare une durée cible et une explication pour chaque contact actif retenu.';
      }
    }
    return '';
  }, [state, eligibleFrames.length, selectedArithmetic, selectedRest, eventChoices, exactMaterials, options.realizedFactChoices, current.used]);

  const applyTargetChoice = (choice: HopV55ObservationTargetChoice) => {
    set({ role: choice.role, targetMode: choice.target.horizon.kind,
      instantAt: choice.target.horizon.kind === 'instant' ? toLocalDateTime(choice.target.horizon.at) : '',
      eventReference: choice.target.horizon.kind === 'relative' ? choice.target.horizon.eventReference : '',
      durationHours: choice.target.horizon.kind === 'relative' ? numberText(choice.target.horizon.durationHours) : '',
      horizonExplanation: choice.target.horizon.explanation, targetExplanation: choice.target.explanation,
      future: choice.target.future.map(row => ({ ...row, timing: row.timing, contactHours: numberText(row.contactHours),
        temperatureC: row.temperatureC === null ? '' : numberText(row.temperatureC), matrixId: row.matrixId ?? '',
        quantityKind: row.quantity.kind, quantityGrams: numberText(row.quantity.grams),
        realizedFactReferences: row.quantity.kind === 'totalIncludingRealized' ? [...row.quantity.realizedFactReferences] : [] })),
      contacts: Object.fromEntries(choice.target.contactTargets.map(row => [row.additionId, { included: true,
        contactHours: numberText(row.contactHours), explanation: row.explanation }])) });
  };

  const buildDraft = (sourceAnchor?: { anchorRecordId: string; anchorReference: string; expectedObservationReference: BrewingObservationVersionReferenceV1 }): HopV55ObservationProjectionDraft | null => {
    if (targetError || !selectedArithmetic || !selectedRest || !eligibleFrames.length) return null;
    const role = state.role as HopV55ObservationProjectionRole;
    const target: Omit<BrewingObservationTargetRequest, 'current'> = role === 'documentedAdvance'
      ? { future: [], contactTargets: [], horizon: { kind: 'instant', at: current.source.state.asOf,
          explanation: 'Instant exact de l’état physique réalisé préparé.' },
        explanation: state.question.trim() }
      : {
        future: state.future.map(row => ({ id: row.id, materialId: row.materialId, timing: row.timing as HopTiming,
          contactHours: positiveOrZero(row.contactHours)!, temperatureC: row.temperatureC.trim() ? parseNumber(row.temperatureC) : null,
          matrixId: row.matrixId.trim() || null,
          quantity: row.quantityKind === 'totalIncludingRealized'
            ? { kind: 'totalIncludingRealized' as const, grams: positiveOrZero(row.quantityGrams)!, realizedFactReferences: [...row.realizedFactReferences] }
            : { kind: 'remaining' as const, grams: positiveOrZero(row.quantityGrams)! }, explanation: row.explanation.trim() })),
        contactTargets: current.used.flatMap(used => {
          const choice = state.contacts[used.additionId];
          return choice?.included ? [{ additionId: used.additionId,
            contactHours: used.ended ? used.elapsedHours : positiveOrZero(choice.contactHours)!, explanation: choice.explanation.trim() }] : [];
        }),
        horizon: state.targetMode === 'instant'
          ? { kind: 'instant' as const, at: localInstant(state.instantAt)!, explanation: state.horizonExplanation.trim() }
          : { kind: 'relative' as const, eventReference: state.eventReference, durationHours: positiveOrZero(state.durationHours)!, explanation: state.horizonExplanation.trim() },
        explanation: state.targetExplanation.trim(),
      };
    return { question: state.question.trim(), role, target,
      frames: eligibleFrames.map(choice => ({ id: choice.id, name: choice.label, plan: structuredClone(choice.plan) })),
      arithmetic: structuredClone(selectedArithmetic.contract), restStability: structuredClone(selectedRest),
      ...(state.stabilityProposalReference ? { stabilityProposalReference: state.stabilityProposalReference } : {}),
      arithmeticSupportReference: selectedArithmetic.reference,
      ...(sourceAnchor ? { sourceAnchor: structuredClone(sourceAnchor) } : {}),
      expectedCurrentInputReference: current.reference, expectedCurrentStateReference: current.source.state.resolutionReference };
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (!sourceStillCurrent) { setError('La note ou l’état a changé. Ferme puis relance depuis la note actuellement applicable.'); return; }
    const draft = buildDraft(sourceAnchor);
    if (!draft) { setError(targetError || 'La question ne peut pas être préparée avec ces choix.'); return; }
    setSubmitting(true);
    try {
      await onPrepareProjection(candidate, draft);
      onCancel();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La question n’a pas été archivée.');
    } finally { setSubmitting(false); }
  };

  return <section className="hv55-observation-editor" aria-labelledby={titleId}>
    <header><p className="hv55-observation-eyebrow">Question liée à une version précise</p>
      <h3 id={titleId}>Préparer une projection depuis {sourceObservation.id} v{sourceObservation.version}</h3>
      {sourceAnchor ? <p className="hv55-observation-editor-note">Note de départ exacte : {sourceObservation.originalText} · {dateText(sourceObservation.observedAt)}. Elle reste une ancre historique non courante.</p> : null}
      <p>La note originale reste un fait. Les valeurs à venir sont des hypothèses, enregistrées seulement après validation de l’archive.</p></header>
    {current.status === 'unknown' ? <div className="hv55-observation-unknown-input" role="status">
      <strong>Entrée de modèle incomplète</strong><ul>{current.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
      <p>Les éléments inconnus ne deviennent pas des ajouts nuls. Le service décidera si la question peut rester archivable.</p>
    </div> : null}
    {options.targetChoices?.length ? <details className="hv55-observation-target-presets"><summary>Reprendre un cadrage archivé comme point de départ</summary>
      <ul>{options.targetChoices.map(choice => <li key={choice.id}><div><strong>{choice.label}</strong>{choice.description ? <p>{choice.description}</p> : null}</div>
        <button type="button" className="hv55-observation-secondary" onClick={() => applyTargetChoice(choice)}>Reprendre puis vérifier</button></li>)}</ul>
    </details> : null}
    <form autoComplete="off" onSubmit={submit}>
      <label className="hv55-observation-field"><span>Question à archiver</span><Input value={state.question}
        onChange={event => set({ question: event.target.value })} /></label>
      <label className="hv55-observation-field"><span>Portée</span><select value={state.role} onChange={event => {
        const role = event.target.value as EditorState['role'];
        set(role === 'documentedAdvance' ? { role, targetMode: '', future: [], contacts: initialEditorState(current).contacts } : { role });
      }}>
        <option value="">Choisir une portée</option><option value="documentedAdvance">Avancement documenté · garder l’état réalisé actuel</option>
        <option value="targetHorizon">Horizon cible · hypothèse à préciser</option>
      </select></label>
      {state.role === 'documentedAdvance' ? <p className="hv55-observation-editor-note">La cible sera exactement l’état physique préparé à {dateText(current.source.state.asOf)} : aucun ajout futur ni prolongement de contact.</p> : null}
      {state.role === 'targetHorizon' ? <>
        <fieldset className="hv55-observation-editor-group"><legend>Horizon et cible</legend>
          <div className="hv55-observation-field-row">
            <label className="hv55-observation-field"><span>Horizon</span><select value={state.targetMode} onChange={event => set({ targetMode: event.target.value as EditorState['targetMode'],
              eventReference: '', durationHours: '', instantAt: '' })}>
              <option value="">Choisir</option><option value="instant">Instant local explicite</option><option value="relative">Durée depuis un événement identifié</option>
            </select></label>
            {state.targetMode === 'instant' ? <label className="hv55-observation-field"><span>Instant cible</span><input type="datetime-local" value={state.instantAt}
              onChange={event => set({ instantAt: event.target.value })} /><small>Interprété dans le fuseau du navigateur; l’archive conserve l’instant ISO.</small></label> : null}
            {state.targetMode === 'relative' ? <>
              <label className="hv55-observation-field"><span>Événement de départ</span><select value={state.eventReference} onChange={event => set({ eventReference: event.target.value })}>
                <option value="">Choisir un événement exact</option>
                {eventChoices.map(choice => <option key={choice.reference} value={choice.reference}>{choice.label}</option>)}
                {state.future.map(row => <option key={row.id} value={row.id}>Ajout futur · {row.id}{row.materialId ? ` · ${exactMaterials.find(material => material.id === row.materialId)?.name ?? row.materialId}` : ''}</option>)}
              </select></label>
              <label className="hv55-observation-field"><span>Durée après l’événement · h</span><DecimalInput label="Durée après l’événement en heures" value={state.durationHours}
                onChange={value => set({ durationHours: value })} /></label>
            </> : null}
          </div>
          {state.targetMode ? <label className="hv55-observation-field"><span>Pourquoi cet horizon ?</span><Input value={state.horizonExplanation}
            onChange={event => set({ horizonExplanation: event.target.value })} /></label> : null}
          <label className="hv55-observation-field"><span>Pourquoi cette cible ?</span><Input value={state.targetExplanation}
            onChange={event => set({ targetExplanation: event.target.value })} /></label>
        </fieldset>
        <fieldset className="hv55-observation-editor-group"><legend>Contacts évalués</legend>
          {current.used.length ? current.used.map(used => {
            const contact = state.contacts[used.additionId] ?? { included: false, contactHours: '', explanation: '' };
            return <div className="hv55-observation-contact" key={used.additionId}>
              <label className="hv55-observation-check"><input type="checkbox" checked={contact.included}
                onChange={event => updateContact(used.additionId, { included: event.target.checked })} />
                <span><strong>{activeContactLabel(current, used.additionId)}</strong> · contact déjà écoulé {numberText(used.elapsedHours)} h{used.ended ? ' · terminé' : ' · actif'}</span></label>
              {contact.included ? <div className="hv55-observation-field-row">
                <label className="hv55-observation-field"><span>Durée cible · h</span>{used.ended
                  ? <output aria-label={`Durée cible conservée pour ${activeContactLabel(current, used.additionId)}`}>{numberText(used.elapsedHours)} h · contact terminé</output>
                  : <DecimalInput label={`Durée cible pour ${activeContactLabel(current, used.additionId)}`} value={contact.contactHours}
                    onChange={value => updateContact(used.additionId, { contactHours: value })} />}</label>
                <label className="hv55-observation-field"><span>Source ou raison de cette cible</span><Input value={contact.explanation}
                  onChange={event => updateContact(used.additionId, { explanation: event.target.value })} /></label>
              </div> : null}
            </div>;
          }) : <p className="hv55-observation-editor-note">Aucun contact réalisé n’est attaché à cette entrée; rien n’est supposé.</p>}
          <p className="hv55-observation-editor-note">Un contact actif non ciblé n’est réputé ni arrêté ni prolongé. Le service peut demander une précision si l’horizon dépend de ce contact.</p>
        </fieldset>
        <fieldset className="hv55-observation-editor-group"><legend>Ajouts futurs explicites</legend>
          {state.future.map((future, index) => {
            const matchingFacts = (options.realizedFactChoices ?? []).filter(choice => choice.materialId === future.materialId);
            const selectedFacts = (options.realizedFactChoices ?? []).filter(choice => future.realizedFactReferences.includes(choice.reference));
            return <fieldset className="hv55-observation-future" key={future.id}><legend>Ajout futur {index + 1} · {future.id}</legend>
              <div className="hv55-observation-field-row">
                <label className="hv55-observation-field"><span>Matière exacte</span><select value={future.materialId} onChange={event => updateFuture(future.id, { materialId: event.target.value })}>
                  <option value="">Choisir une matière</option>{exactMaterials.map(material => <option key={material.id} value={material.id}>{material.name} · {material.id}</option>)}
                </select></label>
                <label className="hv55-observation-field"><span>Moment</span><select value={future.timing} onChange={event => updateFuture(future.id, { timing: event.target.value as HopTiming | '' })}>
                  <option value="">Choisir</option>{HOP_TIMINGS.map(timing => <option key={timing} value={timing}>{TIMING_LABEL[timing]}</option>)}
                </select></label>
                <label className="hv55-observation-field"><span>Contact prévu · h</span><DecimalInput label={`Contact prévu en heures, ajout ${index + 1}`} value={future.contactHours}
                  onChange={value => updateFuture(future.id, { contactHours: value })} /></label>
                <label className="hv55-observation-field"><span>Température · °C <small>facultative si inconnue</small></span><DecimalInput label={`Température en degrés Celsius, ajout ${index + 1}`} value={future.temperatureC}
                  onChange={value => updateFuture(future.id, { temperatureC: value })} /></label>
                <label className="hv55-observation-field"><span>Matrice exacte <small>vide = non renseignée</small></span><select value={future.matrixId} onChange={event => updateFuture(future.id, { matrixId: event.target.value })}>
                  <option value="">Non renseignée</option>{(options.matrixIds ?? []).map(matrixId => <option key={matrixId} value={matrixId}>{matrixId}</option>)}
                </select></label>
                <label className="hv55-observation-field"><span>Portée de la quantité</span><select value={future.quantityKind} onChange={event => updateFuture(future.id, { quantityKind: event.target.value as FutureDraft['quantityKind'], realizedFactReferences: [] })}>
                  <option value="">Choisir</option><option value="remaining">Quantité restante à ajouter</option><option value="totalIncludingRealized">Total incluant des faits réalisés</option>
                </select></label>
                <label className="hv55-observation-field"><span>Quantité déclarée · g</span><DecimalInput label={`Quantité déclarée en grammes, ajout ${index + 1}`} value={future.quantityGrams}
                  onChange={value => updateFuture(future.id, { quantityGrams: value })} /></label>
              </div>
              {future.quantityKind === 'totalIncludingRealized' ? <fieldset className="hv55-observation-facts-select"><legend>Faits réalisés déjà inclus dans ce total</legend>
                {selectedFacts.filter(choice => choice.materialId !== future.materialId).map(choice => <label className="hv55-observation-check" key={choice.reference}>
                  <input type="checkbox" checked onChange={() => updateFuture(future.id, { realizedFactReferences: future.realizedFactReferences.filter(ref => ref !== choice.reference) })} />
                  <span>{choice.label} · référence d’une autre matière{choice.quantityLabel ? ` · ${choice.quantityLabel}` : ''}</span></label>)}
                {matchingFacts.length ? matchingFacts.map(choice => <label className="hv55-observation-check" key={choice.reference}>
                  <input type="checkbox" checked={future.realizedFactReferences.includes(choice.reference)} onChange={event => updateFuture(future.id, {
                    realizedFactReferences: event.target.checked ? [...new Set([...future.realizedFactReferences, choice.reference])] : future.realizedFactReferences.filter(ref => ref !== choice.reference) })} />
                  <span>{choice.label}{choice.quantityLabel ? ` · ${choice.quantityLabel}` : ''} · <code>{choice.reference}</code></span></label>)
                  : <p className="hv55-observation-editor-note">Aucun fait réalisé exact n’est proposé pour cette matière; le total reste à préciser ou cette matière doit changer.</p>}
              </fieldset> : null}
              <label className="hv55-observation-field"><span>Source ou raison de cet ajout</span><Input value={future.explanation}
                onChange={event => updateFuture(future.id, { explanation: event.target.value })} /></label>
              <button type="button" className="hv55-observation-danger" onClick={() => setState(currentState => patchEditorState(currentState, {
                future: currentState.future.filter(row => row.id !== future.id), eventReference: currentState.eventReference === future.id ? '' : currentState.eventReference }))}>Retirer cet ajout futur</button>
            </fieldset>;
          })}
          <button type="button" className="hv55-observation-secondary" onClick={() => {
            const id = `future-${nextFutureId}`; setNextFutureId(value => value + 1); setState(currentState => patchEditorState(currentState,
              { future: [...currentState.future, emptyFuture(id)] }));
          }}>Ajouter une opération future</button>
        </fieldset>
      </> : null}
      <fieldset className="hv55-observation-editor-group"><legend>Cadres déjà adoptés</legend>
        {exactFrames.length ? exactFrames.map(choice => <label className="hv55-observation-choice" key={choice.id}>
          <input type="checkbox" checked={state.selectedFrames.includes(choice.id)} onChange={event => set({ selectedFrames: event.target.checked
            ? [...new Set([...state.selectedFrames, choice.id])] : state.selectedFrames.filter(id => id !== choice.id) })} />
          <span><strong>{choice.label}</strong><small>{choice.description ?? choice.plan.explanation} · {choice.plan.planId} r{choice.plan.revision} · adopté le {dateText(choice.plan.adoption?.adoptedAt ?? choice.plan.proposedAt)}</small>
            {choice.plan.adoption ? <small>Motif d’adoption : {choice.plan.adoption.reason}</small> : null}</span>
        </label>) : <p className="hv55-observation-editor-note">Aucun cadre adopté n’est disponible. Une proposition n’est pas utilisable avant son adoption explicite.</p>}
      </fieldset>
      <fieldset className="hv55-observation-editor-group"><legend>Contrat arithmétique</legend>
        <label className="hv55-observation-field"><span>Choix explicite</span><select value={state.arithmeticChoiceId} onChange={event => set({ arithmeticChoiceId: event.target.value })}>
          <option value="">Choisir un contrat déjà adopté</option>{exactArithmeticChoices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
        </select></label>
        {selectedArithmetic ? <div className="hv55-observation-choice-description"><strong>{selectedArithmetic.contract.operation === 'additiveDifference' ? 'Différence additive' : 'Hypothèse ordinale de travail'}</strong>
          <p>{selectedArithmetic.description ?? selectedArithmetic.contract.explanation}</p>
          <p>Définition exacte : {selectedArithmetic.contract.definition.dimension.name} · {selectedArithmetic.contract.definition.metric?.name ?? 'métrique inconnue'} · {selectedArithmetic.contract.definition.scale?.domain
            ? `${rangeText(selectedArithmetic.contract.definition.scale.domain)}` : 'échelle ou bornes inconnues'}.
            {selectedArithmetic.contract.unitBridge ? ` Pont explicitement adopté : ${selectedArithmetic.contract.unitBridge.explanation}` : ' Aucun pont d’unité n’est ajouté par cet écran.'}</p>
          <p>Adopté le {dateText(selectedArithmetic.contract.adoptedAt)} · {selectedArithmetic.contract.adoptedBy.name} · sources {selectedArithmetic.contract.sourceRefs.map(source => source.reference).join(' · ') || 'aucune'}</p>
        </div> : <p className="hv55-observation-editor-note">Sans contrat exact déjà adopté, l’écran ne convertit pas la note et ne fabrique pas de delta numérique.</p>}
      </fieldset>
      <fieldset className="hv55-observation-editor-group"><legend>Stabilité du reste de la bière</legend>
        <p className="hv55-observation-editor-note">Aucune adoption globale n’est reprise. Le choix reste attaché à cette ancre, cet état, cette cible, ces cadres et ce contrat arithmétique.</p>
        {state.stabilityNeedsReadoption ? <p className="hv55-observation-editor-error" role="status">
          La comparaison a changé. L’ancienne déclaration a été retirée; choisis à nouveau sa portée et, si nécessaire, son auteur, ses conditions et ses sources.
        </p> : null}
        {options.stabilityProposals?.length ? <details className="hv55-observation-stability-proposals">
          <summary>Pistes d’anciennes questions · non appliquées · {options.stabilityProposals.length}</summary>
          {options.stabilityProposals.map(proposal => <article key={proposal.reference} className="hv55-observation-stability-proposal">
            <div><strong>{proposal.stability.status === 'adopted' ? 'Hypothèse adoptée pour une autre question' : 'Stabilité non établie dans une autre question'}</strong>
              <p>{proposal.stability.explanation}</p>
              {proposal.stability.adoptedAt ? <small>Adoptée le {dateText(proposal.stability.adoptedAt)} · {proposal.stability.adoptedBy?.name ?? 'auteur non transmis'}</small> : null}
            </div>
            <button type="button" className="hv55-observation-secondary" onClick={() => proposeStability(proposal)}>
              Reprendre comme brouillon, puis réadopter
            </button>
            <details><summary>Binding et référence de l’ancienne question</summary>
              <dl><dt>Ancre</dt><dd><code>{proposal.comparisonBinding.anchorReference}</code></dd>
                <dt>État physique courant</dt><dd><code>{proposal.comparisonBinding.currentStateReference}</code></dd>
                <dt>Cible</dt><dd><code>{proposal.comparisonBinding.targetRequestReference}</code></dd>
                <dt>Cadres</dt><dd><code>{proposal.comparisonBinding.frameReferences.join(' · ')}</code></dd>
                <dt>Contrat arithmétique</dt><dd><code>{proposal.comparisonBinding.arithmeticReference}</code></dd></dl>
              <code>{proposal.reference}</code>
            </details>
          </article>)}
        </details> : null}
        <label className="hv55-observation-field"><span>Choix pour cette question</span><select value={state.restMode} onChange={event => set({ restMode: event.target.value as EditorState['restMode'] })}>
          <option value="">Choisir explicitement</option>
          <option value="notEstablished">Stabilité non établie · garder le delta sans note projetée</option>
          <option value="adopted">Adopter une hypothèse de stabilité pour cette question</option>
        </select></label>
        {state.stabilityProposalReference ? <p className="hv55-observation-editor-note">Les conditions ont été copiées d’une ancienne question. Elles ne valent pas ici tant que tu ne les as pas réadoptées pour ce binding.</p> : null}
        {state.restMode === 'notEstablished' ? <>
          <label className="hv55-observation-field"><span>Pourquoi la stabilité n’est-elle pas établie ?</span>
            <Textarea rows={2} value={state.restExplanation} onChange={event => set({ restExplanation: event.target.value })} /></label>
          <p className="hv55-observation-editor-note">Le delta du modèle peut rester visible. Aucune projection « note + delta » ne sera présentée.</p>
        </> : null}
        {state.restMode === 'adopted' ? <>
          <label className="hv55-observation-field"><span>Pourquoi le reste de la bière est-il considéré dans cette hypothèse ?</span>
            <Textarea rows={2} value={state.restExplanation} onChange={event => set({ restExplanation: event.target.value })} /></label>
          <label className="hv55-observation-field"><span>Auteur de cette adoption</span>
            <Input autoComplete="off" value={state.restAuthor} onChange={event => set({ restAuthor: event.target.value })} /></label>
          <p className="hv55-observation-editor-note">Les provenances sont conservées telles que saisies; elles ne sont pas vérifiées automatiquement.</p>
          {state.restConditions.map((condition, index) => <fieldset className="hv55-observation-stability-condition" key={condition.id}>
            <legend>Condition {index + 1}</legend>
            <label className="hv55-observation-field"><span>Statut</span><select value={condition.status} onChange={event => updateStabilityCondition(condition.id,
              { status: event.target.value as HopV55ObservationStabilityConditionDraft['status'] })}>
              <option value="">Choisir le statut</option><option value="declaredCompatible">Compatible déclaré</option>
              <option value="unknown">Inconnu</option><option value="changed">Modifié</option>
            </select></label>
            <label className="hv55-observation-field"><span>Explication et domaine de cette condition</span>
              <Textarea rows={2} value={condition.explanation} onChange={event => updateStabilityCondition(condition.id, { explanation: event.target.value })} /></label>
            <div className="hv55-observation-stability-sources">
              {condition.sources.map((source, sourceIndex) => <fieldset className="hv55-observation-stability-source" key={source.id}>
                <legend>Source {sourceIndex + 1}</legend>
                <label className="hv55-observation-field"><span>Nature</span><select value={source.kind} onChange={event => updateStabilitySource(condition.id, source.id,
                  { kind: event.target.value as HopSourceKind | '' })}>
                  <option value="">Choisir une nature</option>{sourceKinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                </select></label>
                <label className="hv55-observation-field"><span>Titre de la source</span><Input autoComplete="off" value={source.title}
                  onChange={event => updateStabilitySource(condition.id, source.id, { title: event.target.value })} /></label>
                <label className="hv55-observation-field"><span>Auteur de la source</span><Input autoComplete="off" value={source.author}
                  onChange={event => updateStabilitySource(condition.id, source.id, { author: event.target.value })} /></label>
                <label className="hv55-observation-field"><span>Référence déclarée</span><Input autoComplete="off" value={source.reference}
                  onChange={event => updateStabilitySource(condition.id, source.id, { reference: event.target.value })} /></label>
                <div className="hv55-observation-field-row">
                  <label className="hv55-observation-field"><span>Année · facultative</span><Input inputMode="numeric" value={source.year}
                    onChange={event => updateStabilitySource(condition.id, source.id, { year: event.target.value })} /></label>
                  <label className="hv55-observation-field"><span>Emplacement · facultatif</span><Input autoComplete="off" value={source.locator}
                    onChange={event => updateStabilitySource(condition.id, source.id, { locator: event.target.value })} /></label>
                </div>
                {condition.sources.length > 1 ? <button type="button" className="hv55-observation-danger" onClick={() => updateStabilityCondition(condition.id,
                  { sources: condition.sources.filter(row => row.id !== source.id) })}>Retirer cette source</button> : null}
              </fieldset>)}
              <button type="button" className="hv55-observation-secondary" onClick={() => updateStabilityCondition(condition.id,
                { sources: [...condition.sources, emptyStabilitySource(`${condition.id}-source-${condition.sources.length + 1}`)] })}>Ajouter une source</button>
            </div>
            {condition.status === 'unknown' || condition.status === 'changed' ? <p className="hv55-observation-editor-note">Cette condition peut conserver le delta, mais elle ne permet pas à elle seule de projeter une note avec ce delta.</p> : null}
            <button type="button" className="hv55-observation-danger" onClick={() => setState(currentState => ({ ...currentState,
              restConditions: currentState.restConditions.filter(row => row.id !== condition.id) }))}>Retirer cette condition</button>
          </fieldset>)}
          <button type="button" className="hv55-observation-secondary" onClick={() => {
            const id = `rest-condition-${nextStabilityConditionId}`;
            setNextStabilityConditionId(value => value + 1);
            setState(currentState => ({ ...currentState, restConditions: [...currentState.restConditions, emptyStabilityCondition(id)] }));
          }}>Ajouter une condition</button>
          <p className="hv55-observation-editor-note">La date d’adoption sera l’instant où tu transmets cette question. Les conditions et leur portée restent liées à son binding exact.</p>
        </> : null}
      </fieldset>
      {targetError ? <p className="hv55-observation-editor-error" role="status">{targetError}</p> : null}
      {error ? <p className="hv55-observation-editor-error" role="alert">{error}</p> : null}
      <div className="hv55-observation-editor-actions"><button type="button" className="hv55-observation-secondary" onClick={onCancel}>Fermer</button>
        <button type="submit" className="hv55-observation-primary" disabled={!!targetError || submitting || !sourceStillCurrent || !onPrepareProjection}>Transmettre pour archivage local</button></div>
    </form>
  </section>;
}

function toLocalDateTime(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
