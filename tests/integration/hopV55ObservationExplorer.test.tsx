import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HopV55CanonicalObservationFixtureV1 } from '../../src/services/hopV55/canonicalObservationFixture';
import { loadHopV55CanonicalObservationFixture } from '../../src/services/hopV55/canonicalObservationFixture';
import { openBrewingReferenceContext, readBrewingReferenceRecord, type BrewingReferenceObservationV1 } from '../../src/domain/brewingReference';
import { createBrewingSensoryDefinitionReference } from '../../src/domain/brewingSensory';
import { resolveCurrentBrewingObservation, type BrewingObservationSelectionV1 } from '../../src/domain/brewingObservationSelection';
import { prepareBrewingObservedContext } from '../../src/domain/brewingObservationContext';
import * as observationProjection from '../../src/domain/brewingObservationProjection';
import { prepareHopV55ObservationAnchor, appendHopV55ObservationAnchor,
  prepareHopV55ObservationProjection, appendHopV55ObservationProjection } from '../../src/services/hopV55/observationSession';
import { hopV55ReferenceContextId } from '../../src/services/hopV55/referenceWorkspace';
import { prepareHopV55CurrentPreparationRecord, appendHopV55CurrentPreparationRecord } from '../../src/services/hopV55/observationSession';
import { hopV55Workspace } from '../fixtures/hopV55';
import { HopV55ObservationExplorer, type HopV55ObservationExplorerProps } from '../../src/ui/hopV55/ObservationExplorer';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

let canonical: HopV55CanonicalObservationFixtureV1;
beforeAll(async () => { canonical = await loadHopV55CanonicalObservationFixture(); });

type ArchivedQuestionOverrides = {
  currentOptions?: HopV55CanonicalObservationFixtureV1['options'];
  target?: HopV55CanonicalObservationFixtureV1['target'];
  restStability?: HopV55CanonicalObservationFixtureV1['restStability'];
  arithmetic?: HopV55CanonicalObservationFixtureV1['arithmetic'];
  data?: HopV55CanonicalObservationFixtureV1['data'];
  role?: 'documentedAdvance' | 'targetHorizon';
  question?: string;
};

async function archivedQuestion(suffix = 'q1', overrides: ArchivedQuestionOverrides = {}) {
  const fixture = canonical;
  const workspace = hopV55Workspace(`owner-observation-explorer-${suffix}`, `workspace-observation-explorer-${suffix}`);
  if (overrides.currentOptions?.source.kind === 'batch') workspace.sourceBatchId = overrides.currentOptions.source.id;
  const contextId = hopV55ReferenceContextId(workspace.id);
  const opened = openBrewingReferenceContext({ ownerKey: workspace.ownerKey, contextId, commandId: `open-${suffix}`,
    recordedAt: fixture.note.observedAt, context: { programReference: null, past: { status: 'unknown' }, details: { fixture: 'observation explorer' } } });
  workspace.referenceJournal = { record: opened.record, events: [opened.event] };
  const noteCommand = { ownerKey: workspace.ownerKey, contextId, commandId: `note-${suffix}`, expectedRevision: opened.record.revision,
    recordedAt: fixture.note.observedAt, kind: 'observationRecorded' as const, payload: { observation: structuredClone(fixture.note) } };
  const anchorPrepared = prepareHopV55ObservationAnchor({ workspace, id: `anchor-${suffix}`, source: fixture.source,
    referenceCommand: noteCommand, anchor: { subjectRelation: 'sameSubject', explanation: fixture.anchor.explanation,
      createdAt: fixture.anchor.createdAt, createdBy: fixture.anchor.createdBy } });
  if (anchorPrepared.status !== 'ready') throw new Error(`Ancre de la fixture refusée: ${anchorPrepared.status}`);
  const anchored = appendHopV55ObservationAnchor(workspace, anchorPrepared.record, anchorPrepared.referenceJournalPatch);
  const readJournal = readBrewingReferenceRecord(anchored.referenceJournal!.record, anchored.referenceJournal!.events);
  if ('status' in readJournal) throw new Error('Le journal de fixture doit rester lisible.');
  const currentOptions = structuredClone(overrides.currentOptions ?? fixture.options);
  const target = structuredClone(overrides.target ?? fixture.target);
  const restStability = structuredClone(overrides.restStability ?? fixture.restStability);
  const arithmetic = structuredClone(overrides.arithmetic ?? fixture.arithmetic);
  const data = structuredClone(overrides.data ?? fixture.data);
  let projectionWorkspace = anchored;
  let currentPreparationRecord: { id: string; preparation: HopV55CanonicalObservationFixtureV1['prepared'] } | undefined;
  if (overrides.currentOptions) {
    const preparedCurrent = prepareHopV55CurrentPreparationRecord({ workspace: anchored, id: `current-preparation-${suffix}`,
      context: fixture.context, options: currentOptions });
    if (preparedCurrent.status !== 'ready') throw new Error(`État documenté de fixture refusé: ${preparedCurrent.status}`);
    currentPreparationRecord = preparedCurrent.record;
    projectionWorkspace = appendHopV55CurrentPreparationRecord(anchored, currentPreparationRecord);
  }
  const requestedDimension = { status: 'resolved' as const, definition: fixture.plan.definitions[0] };
  const prepared = prepareHopV55ObservationProjection({ workspace: projectionWorkspace, currentContext: fixture.context, currentOptions,
    ...(currentPreparationRecord ? { currentPreparationRecordId: currentPreparationRecord.id,
      anchorRecordId: anchorPrepared.record.id, expectedAnchorReference: anchorPrepared.record.anchor!.reference,
      expectedObservationReference: anchorPrepared.record.observationReference! } : {}),
    requestedDimension, requiredDependencyIds: currentOptions.hopScope!.dependencyIds, target,
    projection: { id: `projection-${suffix}`, question: overrides.question ?? 'Comparer la note ancrée au contact cible.',
      role: overrides.role ?? 'targetHorizon', frames: [{ id: `frame-${suffix}`, name: 'Cadre de sensibilité retenu', plan: fixture.plan }], arithmetic,
      restStability, createdAt: fixture.anchor.createdAt, createdBy: fixture.anchor.createdBy }, data });
  if (prepared.status !== 'ready') throw new Error(`Question de fixture non prête: ${prepared.status}`);
  const saved = appendHopV55ObservationProjection(projectionWorkspace, prepared.record);
  const currentSelection: BrewingObservationSelectionV1 = prepared.selection;
  const currentInput = currentPreparationRecord?.preparation.observedHopInput ?? fixture.prepared.observedHopInput;
  if (!currentInput) throw new Error('L’entrée observée canonique doit être disponible.');
  const realized = currentInput.used[0];
  const props: HopV55ObservationExplorerProps = {
    currentSelection, projectionRecords: saved.observationProjections ?? [], selectedProjectionId: prepared.record.id,
    onSelectProjection: vi.fn(),
    projectionEditor: {
      currentInput, materials: [fixture.material],
      targetChoices: [{ id: 'reuse-q1-target', label: 'Cadre Q1 · 24 h', role: overrides.role ?? 'targetHorizon', target }],
      adoptedFrames: [{ id: `frame-${suffix}`, label: 'Cadre de sensibilité poire', plan: fixture.plan }],
      arithmeticChoices: [{ id: 'fixture-arithmetic', label: 'Contrat conditionnel de fixture',
        contract: fixture.arithmetic, reference: 'fixture-arithmetic-support-reference' }],
      stabilityProposals: [],
      realizedFactChoices: realized ? [{ reference: realized.factReference, materialId: realized.materialId,
        label: 'Ajout réellement attesté', quantityLabel: `${realized.grams} g attestés` }] : [],
      horizonChoices: [{ reference: currentInput.source.state.physicalStateReference, label: 'État physique exact au moment de la note' }],
    },
    onPrepareProjection: vi.fn(),
  };
  return { fixture, workspace: saved, prepared, props };
}

async function documentedAdvanceQuestion(suffix: string, overrides: ArchivedQuestionOverrides = {}) {
  const fixture = canonical;
  const asOf = '2026-10-02T06:30:00.000Z';
  const knowledgeAsOf = '2026-10-02T07:00:00.000Z';
  const currentOptions = structuredClone(fixture.options);
  currentOptions.asOf = asOf;
  currentOptions.knowledgeAsOf = knowledgeAsOf;
  currentOptions.contactAttestations = (currentOptions.contactAttestations ?? []).map(row => ({
    ...row, evidence: { ...row.evidence, effectiveAt: asOf, recordedAt: knowledgeAsOf },
  }));
  currentOptions.coverageAttestations = (currentOptions.coverageAttestations ?? []).map(row => ({
    ...row, throughAt: asOf, recordedAt: knowledgeAsOf,
  }));
  const target: HopV55CanonicalObservationFixtureV1['target'] = {
    future: [], contactTargets: [], horizon: { kind: 'instant', at: asOf, explanation: 'Instant exact de l’avancement documenté.' },
    explanation: 'État physique documenté, sans nouvelle note ni opération cible.',
  };
  const restStability: HopV55CanonicalObservationFixtureV1['restStability'] = {
    status: 'notEstablished', explanation: 'Aucune stabilité du reste n’est adoptée pour cet avancement documenté.', conditions: [],
  };
  return archivedQuestion(suffix, { currentOptions, target, restStability, role: 'documentedAdvance',
    question: 'Q2 fixture · comparer la note historique à 6 h avec l’état documenté à 6 h 30.',
    ...overrides });
}

describe('Explorateur d’observation ancrée V5.5', () => {
  it('relit Q1 sans moteur et le garde ouvert quand une note plus récente devient courante', async () => {
    const setup = await archivedQuestion('stable-q1');
    const projectionSpy = vi.spyOn(observationProjection, 'projectBrewingObservation').mockImplementation(() => {
      throw new Error('Une archive relue ne doit pas recalculer la projection.');
    });
    const { rerender, container } = render(<HopV55ObservationExplorer {...setup.props} />);
    expect(screen.getByRole('heading', { name: 'Comparer la note ancrée au contact cible.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Observation applicable maintenant' })).toBeInTheDocument();
    expect(container).toHaveTextContent('Note de fixture sur une échelle déclarée 0–100.');
    expect(container).toHaveTextContent('37 points');
    expect(container).toHaveTextContent('80 g');
    const currentFacts = container.querySelector('.hv55-observation-current .hv55-observation-facts')!;
    expect(container.querySelector('.hv55-observation-note-heading')).toHaveTextContent('Bière');
    expect(currentFacts).toHaveTextContent('Note ordinale');
    expect(currentFacts).not.toHaveTextContent('ordinalNote');
    const archiveFacts = container.querySelector('.hv55-observation-open .hv55-observation-facts')!;
    expect(archiveFacts).not.toHaveTextContent('sha256');
    expect(container.querySelector('.hv55-observation-summary')).toHaveTextContent(/écart modélisé 10,511 points d’indice/iu);
    expect(container.querySelector('.hv55-sensory-table-region')).toHaveTextContent('47,51111330495989');
    expect(container.querySelector('.hv55-observation-archive-list')).not.toHaveTextContent('targetHorizon');

    const nextSelection = structuredClone(setup.props.currentSelection);
    const nextCandidate = structuredClone(nextSelection.selected!);
    nextCandidate.observation.originalText = 'Note Q2, enregistrée après la question Q1.';
    nextCandidate.observation.id = 'fixture-note-q2';
    nextCandidate.observation.version = 1;
    nextSelection.selected = nextCandidate;
    nextSelection.candidates = [nextCandidate];
    rerender(<HopV55ObservationExplorer {...setup.props} currentSelection={nextSelection} />);

    expect(container).toHaveTextContent('Note Q2, enregistrée après la question Q1.');
    expect(screen.getByRole('heading', { name: 'Comparer la note ancrée au contact cible.' })).toBeInTheDocument();
    expect(container).toHaveTextContent(setup.prepared.record.anchorReference);
    expect(setup.props.onSelectProjection).not.toHaveBeenCalled();
    expect(projectionSpy).not.toHaveBeenCalled();
  });

  it('affiche le delta canonique de Q2 malgré la stabilité inconnue et distingue la note de la simulation à l’ancre', async () => {
    const fixture = canonical;
    const currentOptions = structuredClone(fixture.options);
    const asOf = '2026-10-02T06:30:00.000Z';
    const knowledgeAsOf = '2026-10-02T07:00:00.000Z';
    currentOptions.asOf = asOf;
    currentOptions.knowledgeAsOf = knowledgeAsOf;
    currentOptions.contactAttestations = (currentOptions.contactAttestations ?? []).map(row => ({
      ...row, evidence: { ...row.evidence, effectiveAt: asOf, recordedAt: knowledgeAsOf },
    }));
    currentOptions.coverageAttestations = (currentOptions.coverageAttestations ?? []).map(row => ({
      ...row, throughAt: asOf, recordedAt: knowledgeAsOf,
    }));
    const setup = await archivedQuestion('q2-partial-delta', {
      currentOptions,
      target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: asOf,
        explanation: 'Instant exact de l’état documenté à 6 h 30.' },
      explanation: 'Avancement documenté, sans cible d’ajout ni nouvelle durée.' },
      restStability: { status: 'notEstablished', explanation: 'Aucune stabilité du reste n’est adoptée pour Q2.', conditions: [] },
      role: 'documentedAdvance', question: 'Q2 fixture · état documenté à 6 h 30 depuis la note historique.',
    });
    const projection = setup.prepared.projection;
    const frame = projection.frames[0];
    expect(setup.prepared.record.role).toBe('documentedAdvance');
    expect(projection.requestSnapshot.restStability.status).toBe('notEstablished');
    expect(projection.numerical.status).toBe('comparable');
    expect(frame.status).toBe('nonComparable');
    expect(frame.observedCentral).toBeCloseTo(67.48700163219252, 9);
    expect(frame.targetCentral).toBeCloseTo(68.42102828896924, 9);
    expect(frame.delta).toBeCloseTo(0.934026656776723, 9);
    expect(frame.rawProjection).toBeNull();

    const { container } = render(<HopV55ObservationExplorer {...setup.props} />);
    const summary = container.querySelector('.hv55-observation-summary')!;
    expect(summary).toHaveTextContent(/note sous convention déclarée/i);
    expect(summary).toHaveTextContent('37 points d’indice');
    expect(summary).not.toHaveTextContent('Base du modèle');
    expect(summary).toHaveTextContent(/simulation à l’ancre/i);
    expect(summary).toHaveTextContent('67,487 points d’indice');
    expect(summary).toHaveTextContent(/delta modélisé disponible.*0,934 points d’indice/iu);
    expect(summary).toHaveTextContent(/poire.*indice hypothétique de saillance.*points d’indice/iu);
    expect(summary).toHaveTextContent(/note totale non établie/i);
    expect(summary).toHaveTextContent(/stabilité du reste non modélisé n’est pas établie/i);
    expect(container.querySelector('.hv55-observation-frame-details')).toHaveTextContent('0,934026656776723');
  });

  it('distingue un domaine note/modèle incompatible tout en gardant le delta de modèle porté par le DTO', async () => {
    const fixture = canonical;
    const incompatibleMetric = { ...fixture.noteDefinition.metric!, id: 'fixture-ordinal-five', version: '1',
      name: 'Note ordinale de fixture · domaine 0–5' };
    const incompatibleScale = { ...fixture.noteDefinition.scale!, id: 'fixture-ordinal-five-scale',
      metricRef: { id: incompatibleMetric.id, version: incompatibleMetric.version }, domain: { min: 0, max: 5 }, labels: undefined };
    const incompatibleSourceDefinition = createBrewingSensoryDefinitionReference(fixture.noteDefinition.dimension,
      incompatibleMetric, incompatibleScale);
    const incompatibleArithmetic = structuredClone(fixture.arithmetic);
    if (!incompatibleArithmetic.unitBridge) throw new Error('Le cas de fixture requiert le pont ordinal de domaine exact.');
    incompatibleArithmetic.unitBridge = { ...incompatibleArithmetic.unitBridge, sourceDefinition: incompatibleSourceDefinition,
      domain: { min: 0, max: 5 } };
    const currentOptions = structuredClone(fixture.options);
    const asOf = '2026-10-02T06:30:00.000Z';
    const knowledgeAsOf = '2026-10-02T07:00:00.000Z';
    currentOptions.asOf = asOf; currentOptions.knowledgeAsOf = knowledgeAsOf;
    currentOptions.contactAttestations = (currentOptions.contactAttestations ?? []).map(row => ({
      ...row, evidence: { ...row.evidence, effectiveAt: asOf, recordedAt: knowledgeAsOf },
    }));
    currentOptions.coverageAttestations = (currentOptions.coverageAttestations ?? []).map(row => ({
      ...row, throughAt: asOf, recordedAt: knowledgeAsOf,
    }));
    const setup = await archivedQuestion('q2-domain-mismatch', {
      currentOptions,
      target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: asOf, explanation: 'Instant cible exact.' },
        explanation: 'État documenté à 6 h 30.' },
      restStability: fixture.restStability, arithmetic: incompatibleArithmetic,
      role: 'documentedAdvance', question: 'Q2 fixture · domaines numériques distincts.',
    });
    const projection = setup.prepared.projection;
    const frame = projection.frames[0];
    expect(projection.numerical.status).toBe('nonComparable');
    if (projection.numerical.status !== 'nonComparable') throw new Error('La convention de note de fixture doit être incompatible avec le cadre.');
    expect(projection.numerical.reasons.map(row => row.code)).toEqual(expect.arrayContaining(['definitionMismatch', 'bridgeDomainMismatch']));
    expect(projection.requestSnapshot.restStability.status).toBe('adopted');
    expect(frame.status).toBe('nonComparable');
    expect(frame.delta).toBeCloseTo(0.934026656776723, 9);
    expect(frame.rawProjection).toBeNull();

    const { container } = render(<HopV55ObservationExplorer {...setup.props} />);
    const summary = container.querySelector('.hv55-observation-summary')!;
    expect(summary).toHaveTextContent(/delta modélisé disponible.*0,934 points d’indice/iu);
    expect(summary).toHaveTextContent(/note et indice non comparables/i);
    expect(summary).toHaveTextContent(/domaines numériques doivent être connus et exactement égaux/i);
    expect(summary).not.toHaveTextContent(/stabilité du reste non modélisé n’est pas établie/i);
    expect(summary).not.toHaveTextContent(/note totale non établie.*stabilité/i);
  });

  it('ne fabrique aucun delta quand le DTO cadre ne porte pas de calcul disponible', async () => {
    const fixture = canonical;
    const setup = await archivedQuestion('model-missing-delta', { data: { ...fixture.data, knowledge: [] } });
    const frame = setup.prepared.projection.frames[0];
    expect(frame.status).toBe('unknown');
    expect(frame.delta).toBeNull();
    expect(frame.observedCentral).toBeNull();
    expect(frame.targetCentral).toBeNull();

    const { container } = render(<HopV55ObservationExplorer {...setup.props} />);
    const summary = container.querySelector('.hv55-observation-summary')!;
    expect(summary).toHaveTextContent(/aucun delta modélisé disponible dans cette archive/i);
    expect(summary).toHaveTextContent(/Le modèle source ou sa convention ont changé/i);
    expect(summary).not.toHaveTextContent(/delta modélisé disponible.*\d/iu);
    expect(summary).not.toHaveTextContent(/simulation à l’ancre.*\d/iu);
  });

  it('ouvre une comparaison depuis une ancre historique exacte sans rétablir la note comme courante', async () => {
    const setup = await archivedQuestion('historical-anchor-source');
    const fixture = setup.fixture;
    const asOf = '2026-10-02T06:30:00.000Z';
    const knowledgeAsOf = '2026-10-02T07:00:00.000Z';
    const currentOptions = structuredClone(fixture.options);
    currentOptions.asOf = asOf;
    currentOptions.knowledgeAsOf = knowledgeAsOf;
    currentOptions.contactAttestations = (currentOptions.contactAttestations ?? []).map(row => ({
      ...row, evidence: { ...row.evidence, effectiveAt: asOf, recordedAt: knowledgeAsOf },
    }));
    currentOptions.coverageAttestations = (currentOptions.coverageAttestations ?? []).map(row => ({
      ...row, throughAt: asOf, recordedAt: knowledgeAsOf,
    }));
    const current = prepareBrewingObservedContext(fixture.context, currentOptions);
    if (current.status !== 'prepared' || !current.state || !current.observedHopInput) {
      throw new Error(`L’état documenté à 6,5 h doit être préparé: ${current.status}`);
    }
    const readJournal = readBrewingReferenceRecord(setup.workspace.referenceJournal!.record, setup.workspace.referenceJournal!.events);
    if ('status' in readJournal) throw new Error('Le journal canonique de fixture doit rester lisible.');
    const sourceAnchor = setup.prepared.selection.selected?.anchor;
    if (!sourceAnchor) throw new Error('La note source de fixture doit conserver son ancre exacte.');
    const currentSelection = resolveCurrentBrewingObservation({ journal: readJournal, anchors: [sourceAnchor], currentState: current.state,
      requestedDimension: { status: 'resolved', definition: fixture.plan.definitions[0] },
      requiredDependencyIds: currentOptions.hopScope!.dependencyIds });
    expect(currentSelection.selected).toBeNull();
    const historicalCandidate = currentSelection.candidates.find(row => row.observation.id === fixture.note.id);
    if (!historicalCandidate) throw new Error('La candidate NR historique doit rester visible.');
    expect(historicalCandidate.status).not.toBe('applicable');
    const anchorRecordId = setup.prepared.record.anchorRecordId;
    const anchorReference = setup.prepared.record.anchorReference;
    const historicalChoice = {
      anchorRecordId, anchorReference, observationReference: structuredClone(historicalCandidate.observationReference),
      candidate: historicalCandidate, observedAt: historicalCandidate.observation.observedAt,
      subjectLabel: historicalCandidate.observation.subject.label, observationLabel: 'Note sensorielle ordinale · 37 · 0–100',
    };
    const onStartFromHistoricalAnchor = vi.fn();
    const onPrepareProjection = vi.fn();
    const projectionSpy = vi.spyOn(observationProjection, 'projectBrewingObservation').mockImplementation(() => {
      throw new Error('Ouvrir une ancre historique ne doit ni recalculer ni appeler le moteur.');
    });
    const props = { ...setup.props, currentSelection, onStartFromHistoricalAnchor, onPrepareProjection,
      historicalAnchorChoices: [historicalChoice], projectionEditor: { ...setup.props.projectionEditor!, currentInput: current.observedHopInput } };
    const user = userEvent.setup();
    const { container } = render(<HopV55ObservationExplorer {...props} />);

    expect(screen.getByRole('heading', { name: 'Observation applicable maintenant' })).toBeInTheDocument();
    expect(container).toHaveTextContent('Aucune note n’est actuellement applicable.');
    expect(container.querySelector('.hv55-observation-historical-anchors')).toHaveTextContent('Ancre historique · non courante');
    expect(container.querySelector('.hv55-observation-historical-anchors')).toHaveTextContent('Note sensorielle · 37');
    expect(screen.getByRole('button', { name: 'Comparer depuis cette observation historique' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Comparer depuis cette observation historique' }));

    expect(onStartFromHistoricalAnchor).toHaveBeenCalledTimes(1);
    expect(onStartFromHistoricalAnchor).toHaveBeenCalledWith(historicalChoice);
    expect(onPrepareProjection).not.toHaveBeenCalled();
    expect(setup.props.onSelectProjection).not.toHaveBeenCalled();
    expect(currentSelection.selected).toBeNull();
    expect(historicalCandidate.status).not.toBe('applicable');
    expect(screen.getByRole('heading', { name: `Préparer une projection depuis ${historicalChoice.observationReference.id} v${historicalChoice.observationReference.version}` })).toBeInTheDocument();
    expect(container.querySelector('.hv55-observation-historical-source')).toHaveTextContent('État documenté comparé : 2 oct. 2026, 08:30');
    expect(container.querySelector('.hv55-observation-historical-source')).toHaveTextContent('Cette note ne décrit pas directement l’état actuel.');
    expect(container.querySelector('.hv55-observation-open')).toHaveTextContent('Comparer la note ancrée au contact cible.');
    expect(projectionSpy).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Question à archiver'), 'Avancement documenté de l’état à 6,5 h.');
    await user.selectOptions(screen.getByLabelText('Portée'), 'documentedAdvance');
    await user.click(screen.getByRole('checkbox', { name: /Cadre de sensibilité poire/ }));
    await user.selectOptions(screen.getByLabelText('Choix explicite'), 'fixture-arithmetic');
    await user.selectOptions(screen.getByLabelText('Choix pour cette question'), 'notEstablished');
    await user.type(screen.getByLabelText('Pourquoi la stabilité n’est-elle pas établie ?'),
      'Aucune stabilité du reste n’est déclarée pour cet avancement.');
    await user.click(screen.getByRole('button', { name: 'Transmettre pour archivage local' }));

    expect(onPrepareProjection).toHaveBeenCalledTimes(1);
    const [projectionCandidate, draft] = onPrepareProjection.mock.calls[0];
    expect(projectionCandidate).toEqual(historicalCandidate);
    expect(projectionCandidate.status).not.toBe('applicable');
    expect(draft).toMatchObject({ role: 'documentedAdvance', sourceAnchor: {
      anchorRecordId, anchorReference,
      expectedObservationReference: historicalChoice.observationReference,
    }, target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: asOf } } });
    expect(currentSelection.selected).toBeNull();
    expect(setup.props.onSelectProjection).not.toHaveBeenCalled();
  });

  it('laisse les choix de cible, de contact, de faits réalisés et de cadres explicites avant l’appel parent', async () => {
    const setup = await archivedQuestion('draft-target');
    const onPrepareProjection = vi.fn();
    const props = { ...setup.props, onPrepareProjection };
    const user = userEvent.setup();
    render(<HopV55ObservationExplorer {...props} />);
    await user.click(screen.getByRole('button', { name: 'Explorer depuis cette note' }));

    const frame = screen.getByRole('checkbox', { name: /Cadre de sensibilité poire/ });
    expect(frame).not.toBeChecked();
    expect(screen.getByLabelText('Portée')).toHaveValue('');
    expect(screen.getByLabelText('Choix pour cette question')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Reprendre puis vérifier' })).toBeInTheDocument();
    expect(onPrepareProjection).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Question à archiver'), 'Évaluer un contact supplémentaire après la note.');
    await user.selectOptions(screen.getByLabelText('Portée'), 'targetHorizon');
    await user.selectOptions(screen.getByLabelText('Horizon'), 'relative');
    await user.selectOptions(screen.getByLabelText('Événement de départ'), setup.fixture.prepared.state!.physicalStateReference);
    await user.type(screen.getByLabelText('Durée après l’événement en heures'), '48');
    await user.type(screen.getByLabelText('Pourquoi cet horizon ?'), 'Durée de contact explicitement évaluée.');
    await user.type(screen.getByLabelText('Pourquoi cette cible ?'), 'Question de sensibilité, distincte du réalisé.');

    const contactBox = screen.getByRole('checkbox', { name: /contact déjà écoulé/ });
    await user.click(contactBox);
    await user.type(screen.getByLabelText(/Durée cible pour/), '24');
    await user.type(screen.getByLabelText('Source ou raison de cette cible'), 'Contact cible choisi pour cette question.');

    await user.click(screen.getByRole('button', { name: 'Ajouter une opération future' }));
    await user.selectOptions(screen.getByLabelText('Matière exacte'), setup.fixture.material.id);
    await user.selectOptions(screen.getByLabelText('Moment'), 'postFermentation');
    await user.type(screen.getByLabelText('Contact prévu en heures, ajout 1'), '24');
    await user.selectOptions(screen.getByLabelText('Portée de la quantité'), 'totalIncludingRealized');
    await user.type(screen.getByLabelText('Quantité déclarée en grammes, ajout 1'), '100');
    const realizedLabel = screen.getByRole('checkbox', { name: /Ajout réellement attesté/ });
    await user.click(realizedLabel);
    await user.type(screen.getByLabelText('Source ou raison de cet ajout'), 'Total prévu avec le fait exact déjà réalisé.');

    await user.click(frame);
    await user.selectOptions(screen.getByLabelText('Choix explicite'), 'fixture-arithmetic');
    await user.selectOptions(screen.getByLabelText('Choix pour cette question'), 'notEstablished');
    await user.type(screen.getByLabelText('Pourquoi la stabilité n’est-elle pas établie ?'), 'Les conditions ne sont pas toutes documentées.');
    const submit = screen.getByRole('button', { name: 'Transmettre pour archivage local' });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onPrepareProjection).toHaveBeenCalledTimes(1);
    const [candidate, draft] = onPrepareProjection.mock.calls[0];
    expect(candidate.observationReference).toEqual(setup.props.currentSelection.selected!.observationReference);
    expect(draft.role).toBe('targetHorizon');
    expect(draft.expectedCurrentInputReference).toBe(setup.fixture.prepared.observedHopInput!.reference);
    expect(draft.target.horizon).toEqual({ kind: 'relative', eventReference: setup.fixture.prepared.state!.physicalStateReference,
      durationHours: 48, explanation: 'Durée de contact explicitement évaluée.' });
    expect(draft.target.contactTargets).toEqual([{ additionId: setup.fixture.prepared.observedHopInput!.used[0].additionId,
      contactHours: 24, explanation: 'Contact cible choisi pour cette question.' }]);
    expect(draft.target.future).toEqual([expect.objectContaining({ id: 'future-1', materialId: setup.fixture.material.id,
      timing: 'postFermentation', contactHours: 24, quantity: { kind: 'totalIncludingRealized', grams: 100,
        realizedFactReferences: [setup.fixture.prepared.observedHopInput!.used[0].factReference] } })]);
    expect(draft.target.future[0].quantity).not.toHaveProperty('remainingGrams');
    expect(draft.restStability.status).toBe('notEstablished');
    expect(draft.arithmeticSupportReference).toBe('fixture-arithmetic-support-reference');
    expect(draft.frames[0].plan.reference).toBe(setup.fixture.plan.reference);
    expect(setup.workspace.observationProjections).toHaveLength(1);
    expect(setup.workspace.observationProjections![0]).toEqual(setup.prepared.record);
  });

  it('représente une ancienne stabilité comme brouillon et exige sa réadoption attribuée', async () => {
    const setup = await archivedQuestion('stability-proposal');
    const previousStability = { status: 'adopted' as const, explanation: 'Ancienne hypothèse, autre question.',
      adoptedAt: '2026-09-20T10:00:00.000Z', adoptedBy: { origin: 'user' as const, name: 'Ancien auteur' },
      conditions: [{ id: 'old-condition', status: 'declaredCompatible' as const, explanation: 'Condition connue dans l’ancienne question.',
        sourceRefs: [{ title: 'Note personnelle antérieure', author: 'Ancien auteur', year: null, kind: 'judgment' as const,
          reference: 'local://observation/old-condition', locator: 'ancienne question' }] }] };
    const onPrepareProjection = vi.fn();
    const props = { ...setup.props, onPrepareProjection, projectionEditor: { ...setup.props.projectionEditor!,
      stabilityProposals: [{ id: 'old-stability', label: 'Ancienne question', description: previousStability.explanation,
        reference: 'old-stability-reference', comparisonBinding: { anchorReference: 'old-anchor', currentStateReference: 'old-state',
          targetRequestReference: 'old-target', frameReferences: ['old-frame'], arithmeticReference: 'old-arithmetic' },
        stability: previousStability }] } };
    const user = userEvent.setup();
    render(<HopV55ObservationExplorer {...props} />);
    await user.click(screen.getByRole('button', { name: 'Explorer depuis cette note' }));
    const stabilityChoice = screen.getByLabelText('Choix pour cette question');
    expect(stabilityChoice).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Reprendre comme brouillon, puis réadopter' }));
    expect(stabilityChoice).toHaveValue('');
    expect(screen.getByText(/Elles ne valent pas ici tant que tu ne les as pas réadoptées/)).toBeInTheDocument();
    expect(screen.queryByText(/La comparaison a changé/)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Question à archiver'), 'Comparer sous une condition révisée.');
    await user.selectOptions(screen.getByLabelText('Portée'), 'documentedAdvance');
    await user.click(screen.getByRole('checkbox', { name: /Cadre de sensibilité poire/ }));
    await user.selectOptions(screen.getByLabelText('Choix explicite'), 'fixture-arithmetic');
    await user.selectOptions(stabilityChoice, 'adopted');
    await user.clear(screen.getByLabelText('Pourquoi le reste de la bière est-il considéré dans cette hypothèse ?'));
    await user.type(screen.getByLabelText('Pourquoi le reste de la bière est-il considéré dans cette hypothèse ?'), 'Réévalué explicitement pour cette cible.');
    await user.clear(screen.getByLabelText('Auteur de cette adoption'));
    await user.type(screen.getByLabelText('Auteur de cette adoption'), 'Auteur présent');
    await user.selectOptions(screen.getByLabelText('Statut'), 'unknown');
    await user.clear(screen.getByLabelText('Explication et domaine de cette condition'));
    await user.type(screen.getByLabelText('Explication et domaine de cette condition'), 'La compatibilité ne peut pas être confirmée ici.');

    const submit = screen.getByRole('button', { name: 'Transmettre pour archivage local' });
    expect(submit).toBeEnabled();
    await user.click(submit);

    const [, draft] = onPrepareProjection.mock.calls[0];
    expect(draft.restStability).toMatchObject({ status: 'adopted', adoptedBy: { origin: 'user', name: 'Auteur présent' },
      explanation: 'Réévalué explicitement pour cette cible.' });
    expect(draft.restStability).not.toHaveProperty('adoptedAt');
    expect(draft.restStability.conditions[0]).toMatchObject({ status: 'unknown',
      sourceRefs: [{ reference: 'local://observation/old-condition' }] });
    expect(draft.stabilityProposalReference).toBe('old-stability-reference');
  });

  it('retire la déclaration de stabilité quand la cible change dans le brouillon', async () => {
    const setup = await archivedQuestion('stability-reset');
    render(<HopV55ObservationExplorer {...setup.props} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Explorer depuis cette note' }));
    await user.selectOptions(screen.getByLabelText('Portée'), 'documentedAdvance');
    await user.click(screen.getByRole('checkbox', { name: /Cadre de sensibilité poire/ }));
    await user.selectOptions(screen.getByLabelText('Choix explicite'), 'fixture-arithmetic');
    const stabilityChoice = screen.getByLabelText('Choix pour cette question');
    await user.selectOptions(stabilityChoice, 'adopted');
    expect(stabilityChoice).toHaveValue('adopted');

    await user.type(screen.getByLabelText('Question à archiver'), 'Nouvelle cible de comparaison.');

    expect(stabilityChoice).toHaveValue('');
    expect(screen.getByText(/La comparaison a changé/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transmettre pour archivage local' })).toBeDisabled();
  });

  it('marque les formats futurs en lecture seule et ne rend pas leur archive brute', () => {
    const futureRecord = { format: 'hop-v55-observation-projection-record-v9', id: 'future-q1', question: { text: 'Question future lisible' }, role: 'targetHorizon', privatePayload: { secret: 'ne pas afficher' } };
    const props: HopV55ObservationExplorerProps = { currentSelection: { format: 'brewing-observation-selection-v1', selected: null,
      candidates: [], reasons: ['Aucune note applicable.'] }, projectionRecords: [futureRecord], selectedProjectionId: 'future-q1',
      onSelectProjection: vi.fn() };
    const { container } = render(<HopV55ObservationExplorer {...props} />);
    expect(screen.getByRole('heading', { name: 'Archive en lecture seule' })).toBeInTheDocument();
    expect(container).toHaveTextContent('Question future lisible');
    expect(container).not.toHaveTextContent('privatePayload');
    expect(container).not.toHaveTextContent('ne pas afficher');
    expect(screen.getByText(/Aucune note n’est actuellement applicable/)).toBeInTheDocument();
  });
});
