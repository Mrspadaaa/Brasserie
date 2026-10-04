import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  prepare: vi.fn(),
  append: vi.fn(),
  readProjection: vi.fn(),
  readAnchor: vi.fn(),
  resolveSupport: vi.fn(),
  createBinding: vi.fn(),
  createStability: vi.fn(),
  appendSupport: vi.fn(),
  resolveStability: vi.fn(),
}));

vi.mock('../../src/ui/hopV55/ObservationExplorer', async () => {
  const ReactModule = await import('react');
  return {
    HopV55ObservationExplorer: (props: any) => ReactModule.createElement('section', { 'data-testid': 'observation-explorer' },
      ReactModule.createElement('output', { 'data-testid': 'current-observation' }, props.currentSelection.selected?.observation.id ?? 'none'),
      ReactModule.createElement('output', { 'data-testid': 'selected-projection' }, props.selectedProjectionId ?? 'none'),
      ReactModule.createElement('button', { type: 'button', onClick: () => props.onSelectProjection('projection-q1') }, 'Ouvrir Q1'),
      props.onPrepareProjection ? ReactModule.createElement('button', { type: 'button', onClick: () => {
        const candidate = props.currentSelection.selected;
        const input = props.projectionEditor.currentInput;
        void props.onPrepareProjection(candidate, {
          question: 'Question Q2 de fixture', role: 'documentedAdvance',
          target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: input.source.state.asOf,
            explanation: 'Coupure courante exacte.' }, explanation: 'Avancement documenté.' },
          frames: [{ id: 'frame-1', name: 'Cadre exact', plan: { id: 'plan-1', reference: 'plan-1-ref' } }],
          arithmetic: { id: 'arithmetic-1' }, arithmeticSupportReference: 'arithmetic-ref',
          restStability: { status: 'notEstablished', explanation: 'Non établi.', conditions: [] },
          expectedCurrentInputReference: input.reference,
          expectedCurrentStateReference: input.source.state.resolutionReference,
        }).catch(() => {});
      } }, 'Préparer Q2') : null,
      props.onPrepareProjection ? ReactModule.createElement('button', { type: 'button', onClick: () => {
        const candidate = props.currentSelection.selected;
        const input = props.projectionEditor.currentInput;
        void props.onPrepareProjection(candidate, {
          question: 'Question Q2 adoptée', role: 'documentedAdvance',
          target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: input.source.state.asOf,
            explanation: 'Coupure courante exacte.' }, explanation: 'Avancement documenté.' },
          frames: [{ id: 'frame-1', name: 'Cadre exact', plan: { id: 'plan-1', reference: 'plan-1-ref' } }],
          arithmetic: { id: 'arithmetic-1' }, arithmeticSupportReference: 'arithmetic-ref',
          restStability: { status: 'adopted', explanation: 'Adoptée pour cette question.',
            adoptedBy: { origin: 'user', name: 'Auteure déclarée' }, conditions: [{ id: 'condition-1', status: 'declaredCompatible',
              explanation: 'Condition documentée.', sourceRefs: [{ title: 'Référence déclarée', author: 'Source', year: null,
                kind: 'judgment', reference: 'local://condition' }] }] },
          expectedCurrentInputReference: input.reference,
          expectedCurrentStateReference: input.source.state.resolutionReference,
        }).catch(() => {});
      } }, 'Préparer Q2 avec adoption') : null,
      props.onPrepareProjection && props.onStartFromHistoricalAnchor ? ReactModule.createElement('button', { type: 'button', onClick: async () => {
        const choice = props.historicalAnchorChoices[0];
        await props.onStartFromHistoricalAnchor(choice);
        const input = props.projectionEditor.currentInput;
        await props.onPrepareProjection(choice.candidate, {
          question: 'Question depuis une ancre historique', role: 'documentedAdvance',
          target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: input.source.state.asOf,
            explanation: 'État cible courant exact.' }, explanation: 'Progression physique actuelle depuis une note historique.' },
          frames: [{ id: 'frame-1', name: 'Cadre exact', plan: { id: 'plan-1', reference: 'plan-1-ref' } }],
          arithmetic: { id: 'arithmetic-1' }, arithmeticSupportReference: 'arithmetic-ref',
          restStability: { status: 'notEstablished', explanation: 'La stabilité n’est pas établie.', conditions: [] },
          sourceAnchor: { anchorRecordId: choice.anchorRecordId, anchorReference: choice.anchorReference,
            expectedObservationReference: choice.observationReference },
          expectedCurrentInputReference: input.reference,
          expectedCurrentStateReference: input.source.state.resolutionReference,
        });
      } }, 'Préparer Q2 depuis une ancre historique') : null,
    ),
  };
});

vi.mock('../../src/services/hopV55/observationSupport', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/hopV55/observationSupport')>('../../src/services/hopV55/observationSupport');
  return { ...actual,
    resolveHopV55ObservationSupport: mocks.resolveSupport,
    createHopV55ObservationSupportComparisonBinding: mocks.createBinding,
    createHopV55ObservationSupportStabilityRecord: mocks.createStability,
    appendHopV55ObservationSupportRecord: mocks.appendSupport,
    resolveHopV55ObservationStabilityForComparison: mocks.resolveStability,
  };
});

vi.mock('../../src/services/hopV55/observationSession', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/hopV55/observationSession')>('../../src/services/hopV55/observationSession');
  return { ...actual,
    resolveHopV55CurrentObservation: mocks.resolve,
    readHopV55ObservationAnchorRecord: mocks.readAnchor,
    prepareHopV55ObservationProjection: mocks.prepare,
    appendHopV55ObservationProjection: mocks.append,
    readHopV55ObservationProjectionRecord: mocks.readProjection,
  };
});

import { HopV55ObservationWorkbench } from '../../src/ui/hopV55/ObservationWorkbench';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewerContext } from '../../functions/src/companionTypes';

const state = { asOf: '2026-10-02T12:00:00.000Z', knowledgeAsOf: '2026-10-02T12:00:00.000Z',
  status: 'partial', resolutionReference: 'state-current-ref', physicalStateReference: 'physical-current-ref',
  dependencies: [], facts: [], contacts: [], coverage: [], contactStates: [], factDispositions: [], contactDispositions: [],
  subject: { kind: 'beer', identity: { id: 'batch-workbench', version: '1', contentReference: 'batch-ref' } } };
const currentInput = { format: 'brewing-observed-hop-input-v1', reference: 'current-input-ref', status: 'unknown', input: null,
  knownAdditions: [], used: [], issues: [{ code: 'coverageUnknown', message: 'Couverture inconnue.' }],
  source: { state, scope: { id: 'scope', dependencyIds: ['hopMaterials'], fromAt: state.asOf, explanation: 'Portée fixture.' }, materials: [],
    context: { input: { volumeL: 20, yeastId: null, fermentation: [] }, origin: 'declaredHypothesis', source: { title: 'Snapshot', author: 'Fixture', year: null, kind: 'judgment', reference: 'fixture://snapshot' }, explanation: 'Hypothèse du snapshot.' } } };
const currentPreparation = { format: 'hop-v55-observation-anchor-record-v1', recordKind: 'currentPreparation', id: 'current-prep-1',
  workspaceId: 'workspace-observation-workbench', preparation: { format: 'brewing-observed-context-v1', status: 'prepared',
    observedBatchId: 'batch-workbench', state, stateInput: {}, observedHopInput: currentInput, materials: [], proposedBindings: [], unmapped: [], limitations: [],
    reference: 'prepared-current-ref' }, preparationOptions: { source: { kind: 'batch', id: 'batch-workbench' }, asOf: state.asOf, knowledgeAsOf: state.knowledgeAsOf },
  preparationReference: 'prepared-current-ref', observationReference: null, anchor: null, reference: 'current-record-ref' };
const candidate = { observation: { id: 'note-current', version: 1, subject: { kind: 'beer', id: 'batch-workbench', label: 'Bière fixture' },
    observedAt: state.asOf, originalText: 'Note synthétique actuelle', sense: { kind: 'sensoryRating', value: 50 } },
  observationReference: { id: 'note-current', version: 1, contentReference: 'note-current-ref' },
  anchor: { id: 'anchor-current', reference: 'anchor-current-ref', observationReference: 'note-current-ref', subjectRelation: 'sameSubject',
    observation: { id: 'note-current', version: 1 }, observedState: state }, status: 'applicable', reasons: [], dimensionStatus: 'exact', scaleStatus: 'known' };
const selection = { format: 'brewing-observation-selection-v1', selected: candidate, candidates: [candidate], reasons: [] };
const historicalState = { ...state, asOf: '2026-10-02T10:00:00.000Z', resolutionReference: 'state-historical-ref', physicalStateReference: 'physical-historical-ref' };
const historicalInput = { ...currentInput, reference: 'historical-input-ref', source: { ...currentInput.source, state: historicalState } };
const originalHistoricalObservation = { ...candidate.observation, id: 'note-historical', version: 1,
  observedAt: historicalState.asOf, originalText: 'Note historique, version 1', sense: { kind: 'sensoryRating', value: 37 } };
const originalHistoricalAnchor = { id: 'anchor-historical', reference: 'anchor-historical-ref', observationReference: 'note-historical-ref',
  observation: { id: 'note-historical', version: 1 }, observedState: historicalState, subjectRelation: 'sameSubject' };
const historicalCandidate = { ...candidate,
  observation: { ...originalHistoricalObservation, version: 2, originalText: 'Note historique corrigée, version 2', sense: { kind: 'sensoryRating', value: 38 } },
  observationReference: { id: 'note-historical', version: 2, contentReference: 'note-historical-v2-ref' },
  originalObservation: originalHistoricalObservation,
  originalObservationReference: { id: 'note-historical', version: 1, contentReference: 'note-historical-ref' },
  anchor: { id: 'anchor-historical-v2', reference: 'anchor-historical-v2-ref', observationReference: 'note-historical-v2-ref',
    observation: { id: 'note-historical', version: 2 }, observedState: historicalState, subjectRelation: 'sameSubject' },
  originalAnchor: originalHistoricalAnchor,
  anchorReferences: ['anchor-historical-v2-ref'], originalAnchorReferences: ['anchor-historical-ref'],
  status: 'historical', applicability: { status: 'historical', reasons: [], dependencies: [] } };
const historicalAnchorRecord = { ...currentPreparation, id: 'anchor-historical-record', recordKind: 'observationAnchor',
  preparation: { ...currentPreparation.preparation, state: historicalState, observedHopInput: historicalInput },
  preparationOptions: { ...currentPreparation.preparationOptions, asOf: historicalState.asOf }, preparationReference: 'historical-prepared-ref',
  observationReference: historicalCandidate.originalObservationReference, anchor: originalHistoricalAnchor, reference: 'historical-envelope-ref' };
const workspace = (): HopV55Workspace => ({
  format: 'hop-v55-workspace-v1', id: 'workspace-observation-workbench', ownerKey: 'owner-workbench', revision: 4,
  title: 'Observation fixture', intent: { question: '', criteria: [] }, sourceBatchId: 'batch-workbench', scenarioIds: [],
  referenceHypotheses: [], copies: [], updatedAt: state.asOf,
  observationAnchors: [historicalAnchorRecord, currentPreparation], observationProjections: [],
  observationSupportRecords: [], observationSupportSelections: [],
} as unknown as HopV55Workspace);
const prepared = { version: 'brewing-scenario-context-v1', runtime: { engineData: { varieties: [], lots: [], knowledge: [] }, materials: [] },
  limitations: [], provenance: [] } as unknown as PreparedBrewingScenarioContext;
const context = { now: Date.parse(state.knowledgeAsOf), batch: { id: 'batch-workbench', name: 'Fixture' } } as unknown as BrewerContext;
const support = { requestedDimension: { status: 'resolved', definition: { contentReference: 'dimension-ref' } },
  hopScope: { id: 'explicit-workbench-scope', dependencyIds: ['hopMaterials'], fromAt: state.asOf, explanation: 'Portée de fixture explicite.' },
  adoptedFrames: [{ id: 'frame-1', label: 'Cadre exact', plan: { id: 'plan-1', reference: 'plan-1-ref' } }],
  arithmeticChoices: [{ id: 'arithmetic-1', label: 'Contrat exact', contract: { id: 'arithmetic-1' }, reference: 'arithmetic-ref' }],
  stabilityProposals: [] } as any;

const supportResolution = () => ({ status: 'ready', support: structuredClone(support),
  selection: { dimensionReference: 'dimension-ref', hopScopeReference: 'scope-ref', frameReferences: ['plan-1-ref'], arithmeticReference: 'arithmetic-ref' },
  choices: { stabilities: [] }, notices: [] });
const adoptedStability = { status: 'adopted' as const, explanation: 'Adoptée pour cette question.', adoptedAt: '2026-10-02T12:01:00.000Z',
  adoptedBy: { origin: 'user' as const, name: 'Auteure déclarée' }, conditions: [{ id: 'condition-1', status: 'declaredCompatible' as const,
    explanation: 'Condition documentée.', sourceRefs: [{ title: 'Référence déclarée', author: 'Source', year: null,
      kind: 'judgment' as const, reference: 'local://condition' }] }] };
const comparisonBinding = { anchorReference: 'anchor-current-ref', currentStateReference: 'prepared-current-ref',
  targetRequestReference: 'target-request-ref', frameReferences: ['plan-1-ref'], arithmeticReference: 'arithmetic-ref' };
const stabilityRecord = { format: 'hop-v55-observation-support-record-v1', recordKind: 'stability',
  id: 'observation-stability:test:revision-1', supportId: 'observation-stability:test', revision: 1, predecessorReference: null,
  workspaceId: 'workspace-observation-workbench', ownerKey: 'owner-workbench', recordedAt: adoptedStability.adoptedAt,
  recordedBy: { origin: 'user', name: 'Auteure déclarée' }, stability: adoptedStability, comparisonBinding, reference: 'stability-record-ref' };

function resolved(id = 'note-current') {
  const selected = { ...candidate, observation: { ...candidate.observation, id }, observationReference: { ...candidate.observationReference, id } };
  return { status: 'selected', currentPreparation, selection: { ...selection, selected, candidates: [selected] } };
}

function renderWorkbench(props?: Partial<React.ComponentProps<typeof HopV55ObservationWorkbench>>) {
  const getWorkspace = vi.fn(async () => workspace());
  const onSave = vi.fn(async (value: HopV55Workspace) => value);
  const element = (overrides: Partial<React.ComponentProps<typeof HopV55ObservationWorkbench>> = {}) =>
    <HopV55ObservationWorkbench workspace={workspace()} context={context} prepared={prepared} getWorkspace={getWorkspace}
      onSave={onSave} support={support} {...props} {...overrides} />;
  const view = render(element());
  return { ...view, getWorkspace, onSave, rerenderWorkbench: (overrides: Partial<React.ComponentProps<typeof HopV55ObservationWorkbench>> = {}) => view.rerender(element(overrides)) };
}

describe('orchestrateur des observations V5.5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolve.mockReturnValue(resolved());
    mocks.resolveSupport.mockImplementation(supportResolution);
    mocks.createBinding.mockReturnValue(comparisonBinding);
    mocks.createStability.mockReturnValue(stabilityRecord);
    mocks.appendSupport.mockImplementation((ws: HopV55Workspace, record: unknown) => ({ ...ws,
      observationSupportRecords: [...(ws.observationSupportRecords ?? []), record] }));
    mocks.createStability.mockImplementation((input: any) => ({ ...stabilityRecord, ...input, reference: 'stability-record-ref' }));
    mocks.resolveStability.mockImplementation((input: any) => ({ status: 'ready',
      record: input.workspace.observationSupportRecords.find((row: any) => row.reference === input.recordReference) }));
    mocks.readProjection.mockReturnValue({ status: 'unsupportedReadOnly', snapshot: {}, reason: 'Future fixture' });
    mocks.readAnchor.mockImplementation((raw: any) => raw?.id === historicalAnchorRecord.id
      ? { status: 'readOnly', record: historicalAnchorRecord }
      : raw?.id === currentPreparation.id ? { status: 'readOnly', record: currentPreparation }
        : { status: 'invalid', reason: 'Record de fixture illisible.' });
    mocks.append.mockImplementation((ws: HopV55Workspace, record: unknown) => ({ ...ws, observationProjections: [record] }));
  });

  it('garde Q1 sélectionnée quand la note actuelle change', async () => {
    const { rerenderWorkbench } = renderWorkbench();
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir Q1' }));
    expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-q1');
    mocks.resolve.mockReturnValue(resolved('note-new-current'));
    rerenderWorkbench({ workspace: { ...workspace(), revision: 5 } as HopV55Workspace });
    expect(screen.getByTestId('current-observation')).toHaveTextContent('note-new-current');
    expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-q1');
  });

  it('calcule une fois puis rebase le même archive après conflit CAS', async () => {
    const record = { format: 'hop-v55-observation-projection-record-v1', id: 'projection-q2', workspaceId: workspace().id,
      question: { text: 'Question Q2 de fixture', projectionQuestionReference: 'question-ref' }, role: 'documentedAdvance',
      anchorRecordId: 'anchor-current-record', anchorReference: 'anchor-current-ref', currentPreparationRecordId: 'current-prep-1',
      archive: { format: 'future-fixture' }, projectionReference: 'projection-ref', reference: 'record-ref' };
    mocks.prepare.mockReturnValue({ status: 'ready', record, projection: { frames: [{ status: 'unknown' }] }, selection });
    const fresh = { ...workspace(), revision: 5 } as HopV55Workspace;
    const getWorkspace = vi.fn().mockResolvedValueOnce(workspace()).mockResolvedValueOnce(workspace())
      .mockResolvedValueOnce(fresh).mockResolvedValueOnce(fresh);
    const onSave = vi.fn().mockRejectedValueOnce(Object.assign(new Error('staleRevision'), { code: 'staleRevision' }))
      .mockRejectedValueOnce(Object.assign(new Error('staleRevision'), { code: 'staleRevision' }))
      .mockResolvedValueOnce({ ...fresh, revision: 6, observationProjections: [record] });
    const view = render(<HopV55ObservationWorkbench workspace={workspace()} context={context} prepared={prepared} getWorkspace={getWorkspace}
      onSave={onSave} support={support} />);
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2' }));
    await screen.findByRole('button', { name: 'Réessayer la sauvegarde sans recalculer' });
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.append).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer la sauvegarde sans recalculer' }));
    await waitFor(() => expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-q2'));
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledWith(expect.objectContaining({
      currentPreparationRecordId: 'current-prep-1',
      workspace: expect.anything(),
    }));
    expect(mocks.append).toHaveBeenCalledTimes(3);
    expect(mocks.append.mock.calls[0][1]).toBe(record);
    expect(mocks.append.mock.calls[1][1]).toBe(record);
    expect(mocks.append.mock.calls[2][1]).toBe(record);
    expect(onSave).toHaveBeenCalledTimes(3);
    expect(view.container).toHaveTextContent('Archive projection-q2 conservée sans nouveau calcul.');
  });

  it('refuse le draft si un nouveau currentPreparation apparaît avant submit et conserve la sélection Q1', async () => {
    const older = resolved();
    const newerState = { ...state, asOf: '2026-10-02T13:00:00.000Z', resolutionReference: 'state-newer-ref' };
    const newerInput = { ...currentInput, reference: 'current-input-newer-ref', source: { ...currentInput.source, state: newerState } };
    const newerRecord = { ...currentPreparation, id: 'current-prep-newer', preparation: { ...currentPreparation.preparation,
      state: newerState, observedHopInput: newerInput } };
    const newer = { ...older, currentPreparation: newerRecord };
    mocks.resolve.mockReturnValueOnce(older).mockReturnValueOnce(newer);
    const latest = { ...workspace(), revision: 5, observationAnchors: [currentPreparation, newerRecord] } as unknown as HopV55Workspace;
    const getWorkspace = vi.fn().mockResolvedValue(latest);
    const onSave = vi.fn(async (value: HopV55Workspace) => value);
    const view = render(<HopV55ObservationWorkbench workspace={workspace()} context={context} prepared={prepared} getWorkspace={getWorkspace}
      onSave={onSave} support={support} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir Q1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2' }));
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-q1');
    expect(view.container).toHaveTextContent('note-current');
  });

  it('refuse un hôte dont le batch diverge avant le calcul, sans masquer les archives', async () => {
    const latest = { ...workspace(), revision: 5, sourceBatchId: 'batch-other' } as HopV55Workspace;
    const getWorkspace = vi.fn().mockResolvedValue(latest);
    const onSave = vi.fn(async (value: HopV55Workspace) => value);
    render(<HopV55ObservationWorkbench workspace={workspace()} context={context} prepared={prepared} getWorkspace={getWorkspace}
      onSave={onSave} support={support} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir Q1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2' }));
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-q1');
  });

  it('garde le current NR vide, choisit explicitement l’ancre historique et cible la dernière préparation', async () => {
    const historicSelection = { status: 'needs', currentPreparation, candidates: [historicalCandidate],
      requirements: ['Aucune note NR actuelle ne correspond à l’état physique cible.'] };
    mocks.resolve.mockReturnValue(historicSelection);
    const record = { format: 'hop-v55-observation-projection-record-v1', id: 'projection-retrospective', workspaceId: workspace().id,
      question: { text: 'Question depuis une ancre historique', projectionQuestionReference: 'question-historical-ref' }, role: 'documentedAdvance',
      anchorRecordId: historicalAnchorRecord.id, anchorReference: historicalAnchorRecord.anchor.reference, currentPreparationRecordId: currentPreparation.id,
      archive: { format: 'future-fixture' }, projectionReference: 'projection-historical-ref', reference: 'record-historical-ref' };
    mocks.prepare.mockReturnValue({ status: 'ready', record, projection: { frames: [{ status: 'unknown' }] },
      selection: { format: 'brewing-observation-selection-v1', selected: null, candidates: [historicalCandidate], reasons: historicSelection.requirements },
      chosenAnchor: { recordId: historicalAnchorRecord.id, anchor: historicalAnchorRecord.anchor,
        observationReference: historicalCandidate.observationReference } });
    const { onSave } = renderWorkbench();
    expect(screen.getByTestId('current-observation')).toHaveTextContent('none');
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2 depuis une ancre historique' }));

    await waitFor(() => expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-retrospective'));
    expect(screen.getByTestId('current-observation')).toHaveTextContent('none');
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.prepare.mock.calls[0][0]).toMatchObject({
      currentPreparationRecordId: currentPreparation.id,
      anchorRecordId: historicalAnchorRecord.id,
      expectedAnchorReference: historicalAnchorRecord.anchor.reference,
      expectedObservationReference: historicalCandidate.originalObservationReference,
    });
    expect(mocks.prepare.mock.calls[0][0].target.horizon).toEqual({ kind: 'instant', at: state.asOf,
      explanation: 'État cible courant exact.' });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].observationProjections).toEqual([record]);
  });

  it('refuse le draft si le registre courant change de cadre après son ouverture', async () => {
    mocks.resolveSupport.mockReturnValueOnce({ ...supportResolution(), support: { ...structuredClone(support), adoptedFrames: [] } });
    const { onSave } = renderWorkbench();
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2' }));
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(mocks.resolveSupport).toHaveBeenCalledWith({ workspace: expect.objectContaining({ id: workspace().id }) });
  });

  it('lie l’adoption au binding exact puis sauvegarde record et archive dans un seul CAS', async () => {
    const record = { format: 'hop-v55-observation-projection-record-v1', id: 'projection-adopted', workspaceId: workspace().id,
      question: { text: 'Question Q2 adoptée', projectionQuestionReference: 'question-adopted-ref' }, role: 'documentedAdvance',
      anchorRecordId: 'anchor-current-record', anchorReference: 'anchor-current-ref', currentPreparationRecordId: 'current-prep-1',
      archive: { format: 'future-fixture' }, projectionReference: 'projection-adopted-ref', reference: 'record-adopted-ref' };
    mocks.prepare.mockReturnValue({ status: 'ready', record, projection: { frames: [{ status: 'unknown' }] }, selection });
    const { onSave } = renderWorkbench();
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2 avec adoption' }));

    await waitFor(() => expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-adopted'));
    expect(mocks.createBinding).toHaveBeenCalledWith({ anchorReference: 'anchor-current-ref', currentStateReference: 'prepared-current-ref',
      target: expect.objectContaining({ explanation: 'Avancement documenté.' }), frameReferences: ['plan-1-ref'], arithmeticReference: 'arithmetic-ref' });
    expect(mocks.createStability).toHaveBeenCalledWith(expect.objectContaining({ supportId: expect.stringMatching(/^observation-stability:/),
      revision: 1, predecessorReference: null, recordedBy: { origin: 'user', name: 'Auteure déclarée' },
      stability: expect.objectContaining({ adoptedAt: expect.any(String), adoptedBy: { origin: 'user', name: 'Auteure déclarée' } }),
      comparisonBinding }));
    const savedStability = mocks.createStability.mock.results[0].value;
    expect(mocks.resolveStability).toHaveBeenCalledWith(expect.objectContaining({ recordReference: 'stability-record-ref', comparisonBinding,
      workspace: expect.objectContaining({ observationSupportRecords: [savedStability] }) }));
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.prepare.mock.calls[0][0].projection).toMatchObject({ frames: [{ id: 'frame-1', name: 'Cadre exact', plan: support.adoptedFrames[0].plan }],
      arithmetic: support.arithmeticChoices[0].contract, restStability: savedStability.stability, createdAt: savedStability.stability.adoptedAt });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].observationSupportRecords).toEqual([savedStability]);
    expect(onSave.mock.calls[0][0].observationProjections).toEqual([record]);
  });

  it('après conflit CAS réutilise le même record et la même archive sans recalculer', async () => {
    const record = { format: 'hop-v55-observation-projection-record-v1', id: 'projection-adopted-retry', workspaceId: workspace().id,
      question: { text: 'Question Q2 adoptée', projectionQuestionReference: 'question-adopted-ref' }, role: 'documentedAdvance',
      anchorRecordId: 'anchor-current-record', anchorReference: 'anchor-current-ref', currentPreparationRecordId: 'current-prep-1',
      archive: { format: 'future-fixture' }, projectionReference: 'projection-adopted-ref', reference: 'record-adopted-retry-ref' };
    mocks.prepare.mockReturnValue({ status: 'ready', record, projection: { frames: [{ status: 'unknown' }] }, selection });
    const fresh = { ...workspace(), revision: 5 } as HopV55Workspace;
    const getWorkspace = vi.fn().mockResolvedValueOnce(workspace()).mockResolvedValueOnce(workspace()).mockResolvedValueOnce(fresh);
    const onSave = vi.fn().mockRejectedValueOnce(Object.assign(new Error('staleRevision'), { code: 'staleRevision' }))
      .mockResolvedValueOnce({ ...fresh, revision: 6, observationSupportRecords: [stabilityRecord], observationProjections: [record] });
    render(<HopV55ObservationWorkbench workspace={workspace()} context={context} prepared={prepared} getWorkspace={getWorkspace}
      onSave={onSave} support={support} />);
    await userEvent.click(screen.getByRole('button', { name: 'Préparer Q2 avec adoption' }));

    await waitFor(() => expect(screen.getByTestId('selected-projection')).toHaveTextContent('projection-adopted-retry'));
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.createStability).toHaveBeenCalledTimes(1);
    expect(mocks.appendSupport).toHaveBeenCalledTimes(3);
    expect(mocks.appendSupport.mock.calls[0][1]).toBe(mocks.appendSupport.mock.calls[1][1]);
    expect(mocks.appendSupport.mock.calls[1][1]).toBe(mocks.appendSupport.mock.calls[2][1]);
    expect(mocks.append.mock.calls[0][1]).toBe(record);
    expect(mocks.append.mock.calls[1][1]).toBe(record);
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave.mock.calls[1][0].observationSupportRecords).toEqual([mocks.createStability.mock.results[0].value]);
    expect(onSave.mock.calls[1][0].observationProjections).toEqual([record]);
  });
});
