import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { BrewingReferenceObservationDimensionV1 } from '../../domain/brewingReference';
import type { BrewingObservedHopScope } from '../../domain/brewingObservationInputs';
import type { BrewingObservationRestStability } from '../../domain/brewingObservationProjection';
import { BREWING_OBSERVATION_SELECTION_VERSION, type BrewingObservationSelectionV1 } from '../../domain/brewingObservationSelection';
import type { BrewingObservationSelectionCandidateV1 } from '../../domain/brewingObservationSelection';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Workspace } from '../../services/hopV55/contracts';
import {
  appendHopV55ObservationProjection,
  prepareHopV55ObservationProjection,
  readHopV55ObservationAnchorRecord,
  readHopV55ObservationProjectionRecord,
  resolveHopV55CurrentObservation,
  type HopV55ObservationProjectionRecordV1,
} from '../../services/hopV55/observationSession';
import {
  appendHopV55ObservationSupportRecord,
  createHopV55ObservationSupportComparisonBinding,
  createHopV55ObservationSupportStabilityRecord,
  readHopV55ObservationSupportRecord,
  resolveHopV55ObservationStabilityForComparison,
  resolveHopV55ObservationSupport,
  type HopV55ObservationSupportStabilityRecordV1,
} from '../../services/hopV55/observationSupport';
import type {
  HopV55ObservationArithmeticChoice,
  HopV55ObservationExplorerProps,
  HopV55ObservationFrameChoice,
  HopV55ObservationHorizonChoice,
  HopV55ObservationProjectionDraft,
  HopV55ObservationProjectionEditorOptions,
  HopV55HistoricalObservationAnchorChoice,
  HopV55ObservationStabilityProposal,
  HopV55ObservationTargetChoice,
} from './ObservationExplorer';
import { HopV55ObservationExplorer } from './ObservationExplorer';
import './observation-workbench.css';

export interface HopV55ObservationWorkbenchSupport {
  /** Exact requested sensory definition; unresolved labels do not select by name. */
  requestedDimension: BrewingReferenceObservationDimensionV1;
  /** Exact physical/model scope; this supplies dependency IDs and is never inferred from the recipe. */
  hopScope: BrewingObservedHopScope;
  adoptedFrames: readonly HopV55ObservationFrameChoice[];
  arithmeticChoices: readonly HopV55ObservationArithmeticChoice[];
  /** Historical support is presented only as a draft proposal, never adopted on mount. */
  stabilityProposals?: readonly HopV55ObservationStabilityProposal[];
  targetChoices?: readonly HopV55ObservationTargetChoice[];
  horizonChoices?: readonly HopV55ObservationHorizonChoice[];
  matrixIds?: readonly string[];
}

export interface HopV55ObservationWorkbenchProps {
  workspace: HopV55Workspace;
  context: BrewerContext;
  prepared: PreparedBrewingScenarioContext;
  getWorkspace(): Promise<HopV55Workspace>;
  onSave(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  support: HopV55ObservationWorkbenchSupport;
  disabled?: boolean;
  onOpenReference?(): void;
}

const actor = { origin: 'user' as const, name: 'Brasseur' };

interface PendingObservationArchive {
  archive: HopV55ObservationProjectionRecordV1;
  /** Stored with the archive in one workspace CAS; retry reuses these exact bytes. */
  stabilityRecord?: HopV55ObservationSupportStabilityRecordV1;
}

function emptySelection(reason: string): BrewingObservationSelectionV1 {
  return { format: BREWING_OBSERVATION_SELECTION_VERSION, selected: null, candidates: [], reasons: [reason] };
}

function instantLabel(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value || 'Instant non fourni';
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(timestamp);
}

function inputAvailability(value: 'available' | 'unknown' | undefined): string {
  if (value === 'available') return 'Projection du houblon possible';
  if (value === 'unknown') return 'Projection du houblon incomplète';
  return 'Projection du houblon non préparée';
}

function documentedStateLabel(status: string | undefined): string {
  switch (status) {
    case 'resolved': return 'Documenté dans le périmètre';
    case 'partial': return 'Partiellement documenté';
    case 'conflicting': return 'Informations contradictoires';
    case 'unknown': return 'Informations manquantes';
    default: return 'État non qualifié';
  }
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code : undefined;
}

function sameProjectionExists(workspace: HopV55Workspace, incoming: HopV55ObservationProjectionRecordV1): boolean {
  for (const raw of workspace.observationProjections ?? []) {
    const read = readHopV55ObservationProjectionRecord(raw);
    if (read.status === 'readOnly' && read.record.id === incoming.id) {
      if (read.record.reference !== incoming.reference) throw Error('Une archive utilise déjà cet identifiant avec un contenu différent.');
      return true;
    }
    if (read.status === 'unsupportedReadOnly' && raw && typeof raw === 'object'
      && (raw as { id?: unknown }).id === incoming.id) throw Error('Un archive futur utilise déjà cet identifiant; il reste en lecture seule.');
  }
  return false;
}

function sameStabilityExists(workspace: HopV55Workspace, incoming: HopV55ObservationSupportStabilityRecordV1): boolean {
  for (const raw of workspace.observationSupportRecords ?? []) {
    if (!raw || typeof raw !== 'object' || (raw as { id?: unknown }).id !== incoming.id) continue;
    const read = readHopV55ObservationSupportRecord(raw);
    if (read.status === 'readOnly' && read.record.recordKind === 'stability'
      && read.record.reference === incoming.reference) return true;
    throw Error('Une adoption de stabilité utilise déjà cet identifiant avec un contenu différent.');
  }
  return false;
}

function dimensionReference(value: HopV55ObservationWorkbenchSupport['requestedDimension']): string | null {
  return value.status === 'resolved' ? value.definition.contentReference : null;
}

function sameRows(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function candidateMatchesSourceAnchor(candidate: BrewingObservationSelectionCandidateV1,
  source: NonNullable<HopV55ObservationProjectionDraft['sourceAnchor']>): boolean {
  const expected = source.expectedObservationReference;
  const currentVersionMatches = candidate.observationReference.id === expected.id
    && candidate.observationReference.version === expected.version
    && candidate.observationReference.contentReference === expected.contentReference
    && candidate.anchor?.reference === source.anchorReference;
  const originalVersionMatches = candidate.originalObservationReference.id === expected.id
    && candidate.originalObservationReference.version === expected.version
    && candidate.originalObservationReference.contentReference === expected.contentReference
    && candidate.originalAnchor?.reference === source.anchorReference;
  return (currentVersionMatches || originalVersionMatches)
    && candidate.anchorReferences.concat(candidate.originalAnchorReferences).includes(source.anchorReference);
}

function historicalAnchorChoicesFor(workspace: HopV55Workspace, candidates: readonly BrewingObservationSelectionCandidateV1[],
  targetAsOf?: string, currentObservationReference?: string): HopV55HistoricalObservationAnchorChoice[] {
  const anchors = (workspace.observationAnchors ?? []).flatMap(raw => {
    if (raw && typeof raw === 'object' && (raw as { recordKind?: unknown }).recordKind === 'currentPreparation') return [];
    try {
      const read = readHopV55ObservationAnchorRecord(raw);
      return read.status === 'readOnly' && read.record.workspaceId === workspace.id
        && read.record.recordKind !== 'currentPreparation' && read.record.anchor ? [read.record] : [];
    } catch { return []; }
  });
  return candidates.flatMap(candidate => {
    const versions = [
      { anchor: candidate.anchor, observationReference: candidate.observationReference, observation: candidate.observation },
      { anchor: candidate.originalAnchor, observationReference: candidate.originalObservationReference, observation: candidate.originalObservation },
    ];
    const emitted = new Set<string>();
    return versions.flatMap(({ anchor, observationReference, observation }) => {
      if (!anchor || !observationReference || !observation
        || observationReference.contentReference === currentObservationReference
        || anchor.observationReference !== observationReference.contentReference
        || anchor.observation.id !== observationReference.id || anchor.observation.version !== observationReference.version
        || observation.id !== observationReference.id || observation.version !== observationReference.version
        || emitted.has(observationReference.contentReference)
        || targetAsOf && Date.parse(observation.observedAt) > Date.parse(targetAsOf)) return [];
      const record = anchors.find(row => row.anchor?.reference === anchor.reference
        && !!workspace.sourceBatchId && row.preparationOptions.source.kind === 'batch'
        && row.preparationOptions.source.id === workspace.sourceBatchId
        && row.observationReference?.id === observationReference.id
        && row.observationReference.version === observationReference.version
        && row.observationReference.contentReference === observationReference.contentReference
        && row.preparation.status === 'prepared' && !!row.preparation.state && !!row.preparation.observedHopInput
        && row.preparation.state.resolutionReference === anchor.observedState.resolutionReference
        && row.preparation.observedHopInput.source.state.resolutionReference === anchor.observedState.resolutionReference);
      if (!record) return [];
      emitted.add(observationReference.contentReference);
      return [{ anchorRecordId: record.id, anchorReference: anchor.reference,
        observationReference: structuredClone(observationReference), candidate: structuredClone(candidate),
        observedAt: observation.observedAt, subjectLabel: observation.subject.label, observationLabel: observation.originalText }];
    });
  });
}

function stableSnapshot(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSnapshot);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => [key, stableSnapshot(child)]));
}

function CurrentPreparationSummary({ record, loadedBatchId, requestedScope }: {
  record: NonNullable<ReturnType<typeof resolveHopV55CurrentObservation>['currentPreparation']>;
  loadedBatchId?: string;
  requestedScope: BrewingObservedHopScope;
}) {
  const preparation = record.preparation;
  const state = preparation.state;
  const options = record.preparationOptions;
  const sourceBatchId = options.source.id;
  return <section className="hv55-observation-workbench__state" aria-labelledby="hv55-observation-workbench-state-title">
    <header className="hv55-observation-workbench__state-heading">
      <div><p className="hv55-observation-workbench__eyebrow">État physique conservé</p>
        <h2 id="hv55-observation-workbench-state-title">Dernier état documenté</h2></div>
      <span className={`hv55-observation-workbench__badge hv55-observation-workbench__badge--${preparation.status}`}>
        {preparation.status === 'prepared' ? documentedStateLabel(state?.status) : 'Préparation refusée'}
      </span>
    </header>
    {preparation.status === 'refused' ? <p className="hv55-observation-workbench__message" role="status">
      {preparation.refusal?.message ?? 'L’état documenté ne peut pas être préparé.'}
    </p> : state ? <>
      <dl className="hv55-observation-workbench__facts">
        <div><dt>Brassin source</dt><dd>{loadedBatchId === sourceBatchId ? 'Source physique chargée' : 'Source physique conservée'}</dd></div>
        <div><dt>État physique au</dt><dd><time dateTime={state.asOf}>{instantLabel(state.asOf)}</time></dd></div>
        <div><dt>Références consultées au</dt><dd><time dateTime={state.knowledgeAsOf}>{instantLabel(state.knowledgeAsOf)}</time></dd></div>
        <div><dt>État documenté</dt><dd>{documentedStateLabel(state.status)}</dd></div>
        <div><dt>Calcul du houblon</dt><dd>{inputAvailability(preparation.observedHopInput?.status)}</dd></div>
        <div><dt>Périmètre demandé</dt><dd>{requestedScope.dependencyIds.join(', ') || 'Aucune dépendance déclarée'} · depuis {instantLabel(requestedScope.fromAt)}</dd></div>
        {preparation.modelContext ? <div><dt>Contexte de modèle</dt><dd>{preparation.modelContext.origin === 'declaredHypothesis'
          ? 'Hypothèse tirée du snapshot de recette' : 'Contexte enregistré'} · {preparation.modelContext.explanation}</dd></div> : null}
      </dl>
      {loadedBatchId && loadedBatchId !== sourceBatchId ? <p className="hv55-observation-workbench__message" role="status">
        Le contexte chargé diffère du brassin source documenté. Les archives restent consultables, mais une nouvelle projection attend la source physique exacte.
      </p> : null}
      <details className="hv55-observation-workbench__evidence">
        <summary>Options, attestations et limites de cet état</summary>
        <dl>
          <dt>ID du brassin source</dt><dd><code>{sourceBatchId}</code></dd>
          <dt>Référence d’état</dt><dd><code>{state.resolutionReference}</code></dd>
          <dt>Référence du snapshot préparé</dt><dd><code>{preparation.reference}</code></dd>
          <dt>ID de la préparation courante</dt><dd><code>{record.id}</code></dd>
          <dt>Snapshot de recette</dt><dd><code>{preparation.sourceSnapshotReference ?? 'absent'}</code></dd>
          <dt>Journal physique source</dt><dd><code>{preparation.sourceJournalReference ?? 'absent'}</code></dd>
          <dt>Portée demandée</dt><dd>{preparation.hopScope ? `${preparation.hopScope.id} · ${preparation.hopScope.dependencyIds.join(', ')}` : 'Aucune portée de modèle déclarée'}</dd>
          <dt>Attestations de contact</dt><dd>{options.contactAttestations?.length ?? 0}</dd>
          {options.contactAttestations?.map(row => <dd key={`contact-${row.additionKey}`}>
            <code>{row.additionKey}</code> · {row.kind} · {row.epistemicStatus} · {row.evidence.effectiveAt} · {row.evidence.provenance.reference}
          </dd>)}
          <dt>Attestations de complétude</dt><dd>{options.coverageAttestations?.length ?? 0}</dd>
          {options.coverageAttestations?.map(row => <dd key={`coverage-${row.id}`}>
            {row.dependencyId} · {row.status} · {row.fromAt} → {row.throughAt} · {row.provenance.reference}
          </dd>)}
          {options.sample ? <><dt>Échantillon</dt><dd>{options.sample.id} · v{options.sample.version} · collecté {options.sample.collection.effectiveAt}</dd></> : null}
          {options.legacyHopUnitQualification ? <><dt>Qualification legacy</dt><dd>{options.legacyHopUnitQualification.additionKeys.join(', ')} · {options.legacyHopUnitQualification.unit} · {options.legacyHopUnitQualification.reason}</dd></> : null}
          <dt>Dépendances</dt><dd>{state.dependencies.map(row => `${row.id}: ${row.status}`).join(' · ') || 'Aucune dépendance qualifiée'}</dd>
          {state.dependencies.flatMap(row => row.reasons.map((reason, index) => <dd key={`${row.id}-${index}`}>{row.id} · {reason}</dd>))}
          <dt>Limitations</dt><dd>{preparation.limitations.length ? preparation.limitations.join(' ') : 'Aucune limitation transmise.'}</dd>
          {preparation.unmapped.map((row, index) => <dd key={`${row.sourceKey}-${row.code}-${index}`}>
            {row.sourceKey} · {row.code} · {row.reason}
          </dd>)}
        </dl>
      </details>
    </> : <p className="hv55-observation-workbench__message" role="status">État physique non disponible.</p>}
  </section>;
}

/** Read-only reload and explicit archive orchestration. Model work happens once before CAS; retry appends the exact archive. */
export function HopV55ObservationWorkbench({ workspace, context, prepared, getWorkspace, onSave, support,
  disabled = false, onOpenReference }: HopV55ObservationWorkbenchProps) {
  const [selectedProjectionId, setSelectedProjectionId] = useState<string | null>(null);
  const [locallySavedProjections, setLocallySavedProjections] = useState<HopV55ObservationProjectionRecordV1[]>([]);
  const [busy, setBusy] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<PendingObservationArchive | null>(null);
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const activeWorkspaceId = useRef(workspace.id);

  useEffect(() => {
    if (activeWorkspaceId.current === workspace.id) return;
    activeWorkspaceId.current = workspace.id;
    setSelectedProjectionId(null);
    setLocallySavedProjections([]);
    setNotice('');
  }, [workspace.id]);

  const currentResolution = useMemo(() => {
    try {
      return resolveHopV55CurrentObservation({ workspace, requestedDimension: support.requestedDimension,
        requiredDependencyIds: support.hopScope.dependencyIds });
    } catch (error) {
      return { status: 'needs' as const, requirements: [error instanceof Error ? error.message : 'La sélection NR est indisponible.'] };
    }
  }, [workspace, support.requestedDimension, support.hopScope]);

  const currentSelection = useMemo<BrewingObservationSelectionV1>(() => currentResolution.status === 'selected'
    ? currentResolution.selection
    : { format: BREWING_OBSERVATION_SELECTION_VERSION, selected: null,
      candidates: currentResolution.status === 'needs' ? currentResolution.candidates ?? [] : [],
      reasons: currentResolution.status === 'refused' ? currentResolution.reasons : currentResolution.requirements }, [currentResolution]);
  const currentPreparation = currentResolution.status === 'selected' || currentResolution.status === 'refused'
    ? currentResolution.currentPreparation : currentResolution.status === 'needs' ? currentResolution.currentPreparation : undefined;
  const currentInput = currentPreparation?.preparation.status === 'prepared'
    ? currentPreparation.preparation.observedHopInput ?? undefined : undefined;
  const currentSourceBatchId = currentPreparation?.preparationOptions.source?.id;
  const sourceScopeMatches = !!workspace.sourceBatchId && !!context.batch?.id
    && context.batch.id === workspace.sourceBatchId && currentSourceBatchId === workspace.sourceBatchId;
  const projectionRecords = useMemo(() => {
    const savedIds = new Set((workspace.observationProjections ?? []).flatMap(row => row && typeof row === 'object'
      && typeof (row as { id?: unknown }).id === 'string' ? [(row as { id: string }).id] : []));
    return [...(workspace.observationProjections ?? []), ...locallySavedProjections.filter(row => !savedIds.has(row.id))];
  }, [workspace.observationProjections, locallySavedProjections]);

  const currentCandidates = currentResolution.status === 'selected' ? currentResolution.selection.candidates
    : currentResolution.status === 'needs' ? currentResolution.candidates ?? [] : [];
  const currentObservationReference = currentResolution.status === 'selected'
    ? currentResolution.selection.selected?.observationReference.contentReference : undefined;
  const historicalAnchorChoices = useMemo(() => historicalAnchorChoicesFor(workspace, currentCandidates,
    currentPreparation?.preparation.state?.asOf, currentObservationReference), [workspace, currentCandidates, currentPreparation, currentObservationReference]);

  const projectionEditor = useMemo<HopV55ObservationProjectionEditorOptions | undefined>(() => {
    if (!currentInput || !currentPreparation || currentPreparation.preparation.status !== 'prepared' || !sourceScopeMatches) return undefined;
    const realizedFactChoices = currentInput.used.map(row => ({ reference: row.factReference, materialId: row.materialId,
      label: row.additionId, quantityLabel: `${row.grams} g · fait exact` }));
    const state = currentPreparation.preparation.state;
    const horizonChoices = [
      { reference: state?.physicalStateReference ?? '', label: `État physique · ${state ? instantLabel(state.asOf) : ''}` },
      { reference: state?.resolutionReference ?? '', label: `Résolution des faits · ${state ? instantLabel(state.asOf) : ''}` },
      ...(support.horizonChoices ?? []),
    ].filter((row, index, all) => row.reference && all.findIndex(other => other.reference === row.reference) === index);
    return { currentInput, materials: currentPreparation.preparation.materials,
      adoptedFrames: support.adoptedFrames, arithmeticChoices: support.arithmeticChoices,
      stabilityProposals: support.stabilityProposals, targetChoices: support.targetChoices,
      realizedFactChoices, horizonChoices, matrixIds: support.matrixIds };
  }, [currentInput, currentPreparation, sourceScopeMatches, support.adoptedFrames, support.arithmeticChoices,
    support.stabilityProposals,
    support.targetChoices, support.horizonChoices, support.matrixIds]);

  const persistArchiveBundle = useCallback(async (bundle: PendingObservationArchive): Promise<HopV55Workspace> => {
    const saveAgainst = async (latest: HopV55Workspace) => {
      const hasStability = bundle.stabilityRecord ? sameStabilityExists(latest, bundle.stabilityRecord) : true;
      const hasArchive = sameProjectionExists(latest, bundle.archive);
      if (hasStability && hasArchive) return latest;
      const withStability = bundle.stabilityRecord && !hasStability
        ? appendHopV55ObservationSupportRecord(latest, bundle.stabilityRecord) : latest;
      return onSave(appendHopV55ObservationProjection(withStability, bundle.archive));
    };
    const firstWorkspace = await getWorkspace().catch(error => {
      setPendingArchive(bundle);
      setNotice(`La projection ${bundle.archive.id} est calculée et conservée en mémoire; le workspace n’a pas pu être relu. Réessaie sa sauvegarde sans recalculer.`);
      throw error;
    });
    try { return await saveAgainst(firstWorkspace); }
    catch (error) {
      if (errorCode(error) !== 'staleRevision') {
        setPendingArchive(bundle);
        setNotice(`La projection ${bundle.archive.id} est calculée et figée, mais sa sauvegarde a échoué. Réessaie sans recalculer.`);
        throw error;
      }
      let latest: HopV55Workspace;
      try { latest = await getWorkspace(); }
      catch (retryReadError) {
        setPendingArchive(bundle);
        setNotice(`Le workspace a changé et sa relecture a échoué. L’archive et son adoption exacte restent en mémoire; réessaie sans recalculer.`);
        throw retryReadError;
      }
      try { return await saveAgainst(latest); }
      catch (retryError) {
        setPendingArchive(bundle);
        setNotice(`La projection ${bundle.archive.id} est calculée et figée, mais le workspace a encore changé. Réessaie uniquement sa sauvegarde; aucun nouveau calcul ne sera lancé.`);
        throw retryError;
      }
    }
  }, [getWorkspace, onSave]);

  const startFromHistoricalAnchor = useCallback(async (choice: HopV55HistoricalObservationAnchorChoice) => {
    if (disabled || busyRef.current) throw Error('Le workspace est en lecture seule ou une question est déjà en cours.');
    const latest = await getWorkspace();
    if (!latest.sourceBatchId || latest.sourceBatchId !== context.batch?.id) {
      throw Error('Le brassin source chargé ne correspond plus à celui du workspace.');
    }
    const latestTarget = resolveHopV55CurrentObservation({ workspace: latest,
      requestedDimension: support.requestedDimension, requiredDependencyIds: support.hopScope.dependencyIds });
    const latestPreparation = 'currentPreparation' in latestTarget ? latestTarget.currentPreparation : undefined;
    if (!latestPreparation || latestPreparation.id !== currentPreparation?.id
      || latestPreparation.recordKind !== 'currentPreparation' || latestPreparation.preparation.status !== 'prepared'
      || !latestPreparation.preparation.state || !latestPreparation.preparation.observedHopInput
      || latestPreparation.preparationOptions.source.id !== latest.sourceBatchId) {
      throw Error('Le dernier état cible a changé ou n’est pas conservé. Relis cet état avant de choisir une ancre historique.');
    }
    const latestCandidates = latestTarget.status === 'selected' ? latestTarget.selection.candidates
      : latestTarget.status === 'needs' ? latestTarget.candidates ?? [] : [];
    const latestSelectedReference = latestTarget.status === 'selected'
      ? latestTarget.selection.selected?.observationReference.contentReference : undefined;
    const exactChoice = historicalAnchorChoicesFor(latest, latestCandidates, latestPreparation.preparation.state.asOf, latestSelectedReference)
      .find(row => row.anchorRecordId === choice.anchorRecordId && row.anchorReference === choice.anchorReference
        && row.observationReference.id === choice.observationReference.id
        && row.observationReference.version === choice.observationReference.version
        && row.observationReference.contentReference === choice.observationReference.contentReference);
    if (!exactChoice) throw Error('Cette version NR ou son ancre historique a changé. Relis le journal et choisis une ancre encore exacte.');
  }, [disabled, getWorkspace, context.batch?.id, support.requestedDimension, support.hopScope.dependencyIds, currentPreparation]);

  const prepareProjection = useCallback<NonNullable<HopV55ObservationExplorerProps['onPrepareProjection']>>(async (candidate, draft) => {
    if (disabled) throw Error('Ce workspace est en lecture seule.');
    if (busyRef.current) throw Error('Une question est déjà en cours de préparation.');
    busyRef.current = true; setBusy(true); setNotice('');
    try {
      const historicalSource = draft.sourceAnchor;
      if (!support.requestedDimension) throw Error('Une dimension sensorielle exacte est requise.');
      if (!currentPreparation || currentPreparation.recordKind !== 'currentPreparation'
        || currentPreparation.preparation.status !== 'prepared' || !currentPreparation.preparation.state
        || !currentPreparation.preparation.observedHopInput || !historicalSource && currentResolution.status !== 'selected') {
        throw Error(currentResolution.status === 'refused' ? currentResolution.reasons.join(' ')
          : currentResolution.status === 'needs' ? currentResolution.requirements.join(' ') : 'Aucune note actuelle sélectionnée.');
      }
      if (historicalSource) {
        const selected = historicalAnchorChoices.find(choice => choice.anchorRecordId === historicalSource.anchorRecordId
          && choice.anchorReference === historicalSource.anchorReference
          && choice.observationReference.id === historicalSource.expectedObservationReference.id
          && choice.observationReference.version === historicalSource.expectedObservationReference.version
          && choice.observationReference.contentReference === historicalSource.expectedObservationReference.contentReference);
        if (!selected
          || !candidateMatchesSourceAnchor(candidate, historicalSource)) {
          throw Error('Choisis explicitement une ancre historique exacte; elle ne remplace pas la note courante.');
        }
      }
      const latest = await getWorkspace();
      if (!latest.sourceBatchId || latest.sourceBatchId !== context.batch?.id) {
        throw Error('Le batch exact du contexte chargé et la source du workspace divergent ou sont absents; aucune nouvelle projection ne peut être produite.');
      }
      const freshSupport = resolveHopV55ObservationSupport({ workspace: latest });
      if (freshSupport.status !== 'ready') {
        throw Error(freshSupport.status === 'unsupportedRO' ? freshSupport.reason : freshSupport.missing.join(' '));
      }
      const canonical = freshSupport.support;
      if (dimensionReference(canonical.requestedDimension) === null
        || dimensionReference(canonical.requestedDimension) !== dimensionReference(support.requestedDimension)
        || JSON.stringify(stableSnapshot(canonical.hopScope)) !== JSON.stringify(stableSnapshot(support.hopScope))
        || !sameRows(canonical.adoptedFrames.map(row => row.plan.reference), support.adoptedFrames.map(row => row.plan.reference))
        || !sameRows(canonical.arithmeticChoices.map(row => row.reference), support.arithmeticChoices.map(row => row.reference))) {
        throw Error('La définition, la portée, les cadres ou le contrat arithmétique ont changé depuis l’ouverture. Reprends la comparaison avec le support courant.');
      }
      const freshSelection = resolveHopV55CurrentObservation({ workspace: latest,
        requestedDimension: canonical.requestedDimension,
        requiredDependencyIds: canonical.hopScope.dependencyIds });
      const freshTargetPreparation = 'currentPreparation' in freshSelection ? freshSelection.currentPreparation : undefined;
      if (freshSelection.status === 'refused' || !freshTargetPreparation
        || freshTargetPreparation.id !== currentPreparation.id
        || freshTargetPreparation.preparationOptions.source.id !== latest.sourceBatchId
        || freshTargetPreparation.recordKind !== 'currentPreparation'
        || freshTargetPreparation.preparation.status !== 'prepared'
        || freshTargetPreparation.preparation.state?.resolutionReference !== draft.expectedCurrentStateReference
        || freshTargetPreparation.preparation.observedHopInput?.reference !== draft.expectedCurrentInputReference) {
        throw Error('Le dernier état physique cible a changé depuis l’ouverture; relis sa préparation avant de calculer.');
      }
      if (!historicalSource && freshSelection.status !== 'selected') {
        throw Error(freshSelection.status === 'needs' ? freshSelection.requirements.join(' ')
          : 'Aucune note NR courante ne peut servir de point de départ.');
      }
      if (!historicalSource && (freshSelection.status !== 'selected'
        || freshSelection.selection.selected?.observationReference.contentReference !== candidate.observationReference.contentReference
        || freshSelection.selection.selected?.anchor?.reference !== candidate.anchor?.reference)) {
        throw Error('La note courante a changé depuis l’ouverture; relis la sélection avant de calculer.');
      }
      if (historicalSource) {
        const freshCandidates = freshSelection.status === 'selected' ? freshSelection.selection.candidates
          : freshSelection.status === 'needs' ? freshSelection.candidates ?? [] : [];
        const latestSelectedReference = freshSelection.status === 'selected'
          ? freshSelection.selection.selected?.observationReference.contentReference : undefined;
        const exactHistoricalChoice = historicalAnchorChoicesFor(latest, freshCandidates, freshTargetPreparation.preparation.state!.asOf, latestSelectedReference)
          .find(choice => choice.anchorRecordId === historicalSource.anchorRecordId
            && choice.anchorReference === historicalSource.anchorReference
            && choice.observationReference.id === historicalSource.expectedObservationReference.id
            && choice.observationReference.version === historicalSource.expectedObservationReference.version
            && choice.observationReference.contentReference === historicalSource.expectedObservationReference.contentReference);
        if (!exactHistoricalChoice) throw Error('L’ancre historique ou la version NR a changé. Choisis la version affichée avec son ancre correspondante.');
      }
      if (!prepared.runtime.engineData) throw Error('Les dépendances du moteur ne sont pas préparées par le parent.');
      const frameReferences = draft.frames.map(frame => frame.plan.reference);
      if (!frameReferences.length || new Set(frameReferences).size !== frameReferences.length) {
        throw Error('Chaque cadre de la comparaison doit garder une référence exacte et unique.');
      }
      const frames = draft.frames.map(frame => {
        const exact = canonical.adoptedFrames.find(row => row.plan.reference === frame.plan.reference);
        if (!exact || !freshSupport.selection.frameReferences.includes(frame.plan.reference)) {
          throw Error('Un cadre a changé ou n’est plus adopté dans le support courant. Reprends la comparaison.');
        }
        return { id: exact.id, name: exact.label, plan: structuredClone(exact.plan) };
      });
      const arithmetic = canonical.arithmeticChoices.find(row => row.reference === draft.arithmeticSupportReference);
      if (!arithmetic || freshSupport.selection.arithmeticReference !== draft.arithmeticSupportReference) {
        throw Error('Le contrat arithmétique a changé ou n’est plus sélectionné dans le support courant. Reprends la comparaison.');
      }

      let stabilityRecord: HopV55ObservationSupportStabilityRecordV1 | undefined;
      let restStability: BrewingObservationRestStability = structuredClone(draft.restStability);
      const actionAt = new Date().toISOString();
      if (draft.restStability.status === 'adopted') {
        const anchorReference = historicalSource?.anchorReference
          ?? (freshSelection.status === 'selected' ? freshSelection.selection.selected?.anchor?.reference : undefined);
        if (!anchorReference) throw Error('Une ancre physique exacte est requise pour adopter cette stabilité.');
        const adoptedBy = draft.restStability.adoptedBy;
        if (adoptedBy?.origin !== 'user' || !adoptedBy.name.trim()) {
          throw Error('L’auteur déclaré de l’adoption est requis; il ne sera pas déduit du brassin ou du compte.');
        }
        const adoptedAt = actionAt;
        restStability = { ...structuredClone(draft.restStability), adoptedAt };
        const comparisonBinding = createHopV55ObservationSupportComparisonBinding({
          anchorReference,
          currentStateReference: freshTargetPreparation.preparation.reference,
          target: draft.target,
          frameReferences: frames.map(frame => frame.plan.reference),
          arithmeticReference: arithmetic.reference,
        });
        const supportId = `observation-stability:${crypto.randomUUID()}`;
        const created = createHopV55ObservationSupportStabilityRecord({ workspace: latest,
          id: `${supportId}:revision-1`, supportId, revision: 1, predecessorReference: null,
          stability: restStability, comparisonBinding, recordedAt: adoptedAt, recordedBy: adoptedBy });
        if (created.recordKind !== 'stability') throw Error('Le registre a retourné un type inattendu pour l’adoption.');
        const candidateWorkspace = appendHopV55ObservationSupportRecord(latest, created);
        const canonicalStability = resolveHopV55ObservationStabilityForComparison({ workspace: candidateWorkspace,
          recordReference: created.reference, comparisonBinding });
        if (canonicalStability.status !== 'ready') {
          throw Error(canonicalStability.status === 'unsupportedRO' ? canonicalStability.reason : canonicalStability.reason);
        }
        stabilityRecord = canonicalStability.record;
        restStability = structuredClone(canonicalStability.record.stability);
      }
      const id = `observation-projection:${crypto.randomUUID()}`;
      const result = prepareHopV55ObservationProjection({
        workspace: latest,
        currentPreparationRecordId: freshTargetPreparation.id,
        ...(historicalSource ? { anchorRecordId: historicalSource.anchorRecordId,
          expectedAnchorReference: historicalSource.anchorReference,
          expectedObservationReference: historicalSource.expectedObservationReference } : {}),
        requestedDimension: canonical.requestedDimension,
        requiredDependencyIds: canonical.hopScope.dependencyIds,
        target: draft.target,
        projection: { id, question: draft.question, role: draft.role, frames,
          arithmetic: arithmetic.contract, restStability,
          createdAt: actionAt, createdBy: actor },
        data: prepared.runtime.engineData,
      });
      if (result.status !== 'ready') {
        throw Error(result.status === 'refused' ? result.reasons.join(' ') : result.requirements.join(' '));
      }
      await persistArchiveBundle({ archive: result.record, ...(stabilityRecord ? { stabilityRecord } : {}) });
      setLocallySavedProjections(rows => rows.some(row => row.id === result.record.id) ? rows : [...rows, result.record]);
      setSelectedProjectionId(result.record.id);
      setPendingArchive(null);
      setNotice(`Question « ${result.record.question.text} » conservée ${historicalSource
        ? 'depuis l’ancre historique choisie vers l’état cible courant exact.' : 'avec son ancre et son état courant exact.'}`);
    } finally {
      busyRef.current = false; setBusy(false);
    }
  }, [disabled, support, currentResolution, currentPreparation, historicalAnchorChoices, context.batch?.id,
    prepared.runtime.engineData, getWorkspace, persistArchiveBundle]);

  const retryPendingArchive = useCallback(async () => {
    const record = pendingArchive;
    if (!record || disabled || busyRef.current) return;
    if (record.archive.workspaceId !== workspace.id) {
      setNotice(`L’archive ${record.archive.id} appartient à un autre dossier. Rouvre ${record.archive.workspaceId} pour reprendre sa sauvegarde.`);
      return;
    }
    busyRef.current = true; setBusy(true);
    try {
      await persistArchiveBundle(record);
      setLocallySavedProjections(rows => rows.some(row => row.id === record.archive.id) ? rows : [...rows, record.archive]);
      setSelectedProjectionId(record.archive.id); setPendingArchive(null);
      setNotice(`Archive ${record.archive.id} conservée sans nouveau calcul.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'L’archive reste en attente de sauvegarde.');
    } finally { busyRef.current = false; setBusy(false); }
  }, [pendingArchive, disabled, persistArchiveBundle, workspace.id]);

  return <section className="hv55-observation-workbench" aria-labelledby="hv55-observation-workbench-title">
    <header className="hv55-observation-workbench__heading">
      <div><p className="hv55-observation-workbench__eyebrow">Brassin · faits documentés</p>
        <h1 id="hv55-observation-workbench-title">Observation et questions</h1>
        <p>La sélection relit le dernier état documenté et le journal des observations. Une question ouverte reste attachée à son archive quand une nouvelle note arrive.</p></div>
      {onOpenReference ? <button type="button" className="hv55-observation-workbench__secondary" onClick={onOpenReference}>Journal de références</button> : null}
    </header>

    {currentPreparation ? <CurrentPreparationSummary record={currentPreparation} loadedBatchId={context.batch?.id} requestedScope={support.hopScope} />
      : <section className="hv55-observation-workbench__state" aria-label="État physique courant">
        <p className="hv55-observation-workbench__message" role="status">{currentResolution.status === 'refused'
          ? currentResolution.reasons.join(' ') : currentResolution.status === 'needs' ? currentResolution.requirements.join(' ')
            : 'Aucun état physique courant explicitement documenté.'}</p>
        {onOpenReference ? <button type="button" className="hv55-observation-workbench__secondary" onClick={onOpenReference}>Documenter un état ou une observation</button> : null}
      </section>}

    {currentPreparation && !sourceScopeMatches ? <p className="hv55-observation-workbench__message" role="status">
      Le batch exact chargé, la source du workspace et la préparation courante doivent être identiques pour créer une nouvelle projection. Les archives restent consultables.
    </p> : null}

    {notice ? <p className="hv55-observation-workbench__notice" role="status">{notice}</p> : null}
    {pendingArchive ? <div className="hv55-observation-workbench__pending" role="status">
      <p>Archive calculée en attente de sauvegarde · <code>{pendingArchive.archive.id}</code>. Elle conserve le résultat déjà préparé.
        {pendingArchive.stabilityRecord ? ' L’adoption exacte est jointe à cette même sauvegarde.' : ''}</p>
      <button type="button" className="hv55-observation-workbench__secondary"
        disabled={busy || disabled || pendingArchive.archive.workspaceId !== workspace.id} onClick={() => void retryPendingArchive()}>
        Réessayer la sauvegarde sans recalculer
      </button>
    </div> : null}

    <HopV55ObservationExplorer currentSelection={currentSelection} projectionRecords={projectionRecords}
      selectedProjectionId={selectedProjectionId} onSelectProjection={setSelectedProjectionId}
      projectionEditor={projectionEditor} historicalAnchorChoices={historicalAnchorChoices}
      onStartFromHistoricalAnchor={disabled || busy || !sourceScopeMatches ? undefined : startFromHistoricalAnchor}
      onPrepareProjection={disabled || busy || !sourceScopeMatches ? undefined : prepareProjection} />
  </section>;
}
