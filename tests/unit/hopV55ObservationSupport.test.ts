import { describe, expect, it } from 'vitest';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { BrewingNuancePlan } from '../../src/domain/brewingNuanceProjection';
import { reviseBrewingNuancePlan } from '../../src/domain/brewingNuanceProjection';
import { loadHopV55CanonicalObservationFixture } from '../../src/services/hopV55/canonicalObservationFixture';
import { qualifyBrewingObservationNumerics } from '../../src/domain/brewingObservationNumerics';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import { ensureHopV55ReferenceJournal, hopV55ReferenceContextId } from '../../src/services/hopV55/referenceWorkspace';
import {
  appendHopV55CurrentPreparationRecord,
  appendHopV55ObservationAnchor,
  prepareHopV55CurrentPreparationRecord,
  prepareHopV55ObservationAnchor,
  type HopV55ObservationReferenceCommand,
} from '../../src/services/hopV55/observationSession';
import {
  appendHopV55ObservationSupportRecord,
  assertHopV55ObservationSupportAppendOnly,
  createHopV55ObservationSupportArithmeticRecord,
  createHopV55ObservationSupportComparisonBinding,
  createHopV55ObservationSupportDefinition,
  createHopV55ObservationSupportHopScopeRecord,
  createHopV55ObservationSupportProtocolNoteRecord,
  createHopV55ObservationSupportStabilityRecord,
  readHopV55ObservationSupportRecord,
  resolveHopV55ObservationStabilityForComparison,
  resolveHopV55ObservationSupport,
  selectHopV55ObservationSupport,
} from '../../src/services/hopV55/observationSupport';

type Fixture = Awaited<ReturnType<typeof loadHopV55CanonicalObservationFixture>>;
const actor = { origin: 'model' as const, name: 'Fixture support synthétique' };
const recordedAt = '2026-10-02T07:00:00.000Z';

class SupportWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey,
      (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(structuredClone) }) }; }
}

class SupportWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new SupportWorkspaceTable();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    return (tablesAndWork.at(-1) as () => Promise<T>)();
  }
  close() { /* Memory-only repository test. */ }
}

function emptyWorkspace(overrides: Partial<HopV55Workspace> = {}): HopV55Workspace {
  return {
    format: 'hop-v55-workspace-v1', id: 'workspace-observation-support-test', ownerKey: 'owner-observation-support-test', revision: 0,
    title: 'Support de fixture', intent: { question: 'Exercice synthétique.', criteria: [] }, scenarioIds: [],
    referenceHypotheses: [], copies: [], updatedAt: recordedAt, ...overrides,
  };
}

function recordBase(workspace: HopV55Workspace, id: string, supportId: string) {
  return { workspace, id, supportId, revision: 1, predecessorReference: null, recordedAt, recordedBy: actor };
}

async function supportedWorkspace() {
  const fixture = await loadHopV55CanonicalObservationFixture();
  const proposal: BrewingNuancePlan = reviseBrewingNuancePlan(fixture.plan, { parameterChoices: fixture.plan.parameterChoices,
    proposedAt: '2026-10-02T07:00:00.000Z', proposedBy: actor,
    explanation: 'Proposition de test uniquement; elle ne devient pas un cadre adopté.' });
  const initial = emptyWorkspace({ sourceBatchId: fixture.options.source.id,
    nuancePlans: [structuredClone(fixture.plan), structuredClone(proposal)],
    // The resolver reads this exact planSnapshot reference without calling its prediction engine.
    nuanceStudies: [{ id: 'study-existing-plan-snapshot', scenarioId: 'scenario-support-fixture', snapshotReference: 'snapshot-support-fixture',
      projection: { planSnapshot: structuredClone(fixture.plan) } as never, context: {} as never, reference: {} as never }] });
  const preparedScenario = prepareBrewingScenarioContext(fixture.context);
  const opened = ensureHopV55ReferenceJournal(initial, fixture.context, preparedScenario);
  const current = prepareHopV55CurrentPreparationRecord({ workspace: opened, id: 'current-support-state',
    context: fixture.context, options: fixture.options });
  if (current.status !== 'ready') throw new Error('État courant exact requis pour le test support.');
  const withCurrent = appendHopV55CurrentPreparationRecord(opened, current.record);
  const referenceCommand: HopV55ObservationReferenceCommand = {
    ownerKey: opened.ownerKey, contextId: hopV55ReferenceContextId(opened.id), commandId: 'record-support-fixture-note',
    expectedRevision: opened.referenceJournal!.record.revision, recordedAt, kind: 'observationRecorded',
    payload: { observation: structuredClone(fixture.note) },
  };
  const anchor = prepareHopV55ObservationAnchor({ workspace: opened, id: fixture.anchor.id, source: structuredClone(fixture.source),
    referenceCommand, anchor: { subjectRelation: 'sameSubject', explanation: fixture.anchor.explanation,
      createdAt: fixture.anchor.createdAt, createdBy: fixture.anchor.createdBy } });
  if (anchor.status !== 'ready' || !anchor.referenceJournalPatch) throw new Error('Note NR et ancre exactes requises pour le test support.');
  let workspace = appendHopV55ObservationAnchor(withCurrent, anchor.record, anchor.referenceJournalPatch);

  const noteDefinition = createHopV55ObservationSupportDefinition({ dimension: fixture.noteDefinition.dimension,
    metric: fixture.noteDefinition.metric, scale: fixture.noteDefinition.scale });
  const protocol = createHopV55ObservationSupportProtocolNoteRecord({ ...recordBase(workspace, 'protocol-note-v1', 'protocol-note'),
    definition: noteDefinition, meaning: { kind: 'intensity', orientation: 'increasing' } });
  workspace = appendHopV55ObservationSupportRecord(workspace, protocol);
  const scope = createHopV55ObservationSupportHopScopeRecord({ ...recordBase(workspace, 'hop-scope-v1', 'hop-scope'),
    scope: fixture.options.hopScope! });
  workspace = appendHopV55ObservationSupportRecord(workspace, scope);
  const arithmetic = createHopV55ObservationSupportArithmeticRecord({ ...recordBase(workspace, 'arithmetic-v1', 'ordinal-bridge'),
    contract: fixture.arithmetic });
  workspace = appendHopV55ObservationSupportRecord(workspace, arithmetic);
  workspace = selectHopV55ObservationSupport(workspace, {
    id: 'support-selection-v1', recordedAt, recordedBy: actor, dimensionReference: noteDefinition.contentReference,
    hopScopeReference: scope.reference, frameReferences: [fixture.plan.reference], arithmeticReference: arithmetic.reference,
  });
  return { fixture, workspace, protocol, scope, arithmetic, proposal };
}

describe('Support typé du Workbench observation V5.5', () => {
  it('résout les références exactes, déduplique le plan adopté et reste prêt sans cadres ni arithmétique', async () => {
    const full = await supportedWorkspace();
    const resolved = resolveHopV55ObservationSupport({ workspace: full.workspace });
    expect(resolved.status).toBe('ready');
    if (resolved.status !== 'ready') return;
    expect(resolved.selection).toEqual(full.workspace.observationSupportSelections?.[0]);
    expect(resolved.support.requestedDimension).toEqual({ status: 'resolved', definition: full.protocol.definition });
    expect(resolved.support.hopScope).toEqual(full.scope.scope);
    expect(resolved.support.adoptedFrames).toHaveLength(1);
    expect(resolved.support.adoptedFrames[0].plan.reference).toBe(full.fixture.plan.reference);
    expect(resolved.support.adoptedFrames[0].label).toBe(
      `${full.fixture.plan.sourceModel.name} v${full.fixture.plan.sourceModel.version} · Poire · r${full.fixture.plan.revision}`);
    expect(resolved.support.adoptedFrames[0].label).not.toContain(full.fixture.plan.reference);
    expect(resolved.choices.frames).toHaveLength(1);
    expect(resolved.choices.observationDefinitions).toContainEqual(full.protocol.definition);
    expect(resolved.support.arithmeticChoices[0].reference).toBe(full.arithmetic.reference);
    expect(resolved.support.arithmeticChoices[0].label).toBe('Correspondance note–indice · Poire');
    expect(resolved.choices.arithmetic[0].label).toBe('Correspondance note–indice · Poire');
    expect(resolved.support.stabilityProposals).toEqual([]);

    const bare = emptyWorkspace();
    const definition = createHopV55ObservationSupportProtocolNoteRecord({ ...recordBase(bare, 'protocol-bare', 'protocol-bare'),
      definition: full.protocol.definition, meaning: { kind: 'intensity', orientation: 'increasing' } });
    const withDefinition = appendHopV55ObservationSupportRecord(bare, definition);
    const scope = createHopV55ObservationSupportHopScopeRecord({ ...recordBase(withDefinition, 'scope-bare', 'scope-bare'), scope: full.scope.scope });
    const readyWithoutNumericOptions = appendHopV55ObservationSupportRecord(withDefinition, scope);
    const selected = selectHopV55ObservationSupport(readyWithoutNumericOptions, { id: 'support-bare-selection', recordedAt, recordedBy: actor,
      dimensionReference: definition.definition.contentReference, hopScopeReference: scope.reference,
      frameReferences: [], arithmeticReference: null });
    const resolvedBare = resolveHopV55ObservationSupport({ workspace: selected });
    expect(resolvedBare.status).toBe('ready');
    if (resolvedBare.status === 'ready') {
      expect(resolvedBare.support.adoptedFrames).toEqual([]);
      expect(resolvedBare.support.arithmeticChoices).toEqual([]);
    }
  });

  it('refuse un index modèle comme protocole ordinal et laisse le plan proposé hors des frames', async () => {
    const full = await supportedWorkspace();
    const modelDefinition = full.fixture.plan.definitions[0];
    expect(() => createHopV55ObservationSupportDefinition({ dimension: modelDefinition.dimension,
      metric: modelDefinition.metric, scale: modelDefinition.scale })).toThrow(/index de modèle/i);

    expect(() => selectHopV55ObservationSupport(full.workspace, { id: 'selection-proposed-plan', recordedAt, recordedBy: actor,
      dimensionReference: full.protocol.definition.contentReference, hopScopeReference: full.scope.reference,
      frameReferences: [full.proposal.reference], arithmeticReference: full.arithmetic.reference })).toThrow(/adoptée/i);
    expect(full.workspace.observationSupportSelections).toHaveLength(1);
  });

  it('conserve les anciennes sélections et refuse toute réécriture du préfixe', async () => {
    const full = await supportedWorkspace();
    const next = selectHopV55ObservationSupport(full.workspace, { id: 'support-selection-v2', recordedAt: '2026-10-02T08:00:00.000Z',
      recordedBy: actor, dimensionReference: full.protocol.definition.contentReference, hopScopeReference: full.scope.reference,
      frameReferences: [], arithmeticReference: null });
    expect(next.observationSupportSelections).toHaveLength(2);
    expect(next.observationSupportSelections?.[0]).toEqual(full.workspace.observationSupportSelections?.[0]);
    const tampered = structuredClone(next);
    tampered.observationSupportSelections![0].dimensionReference = 'unknown-definition';
    expect(() => assertHopV55ObservationSupportAppendOnly(full.workspace, tampered)).toThrow(/append-only/i);
  });

  it('valide les collections au repository, protège owner et conserve le CAS après une entrée invalide', async () => {
    const full = await supportedWorkspace();
    const database = new SupportWorkspaceDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: full.workspace.ownerKey, database });
    const repositoryWorkspace = structuredClone(full.workspace);
    // The planSnapshot-only branch above deliberately uses opaque context/reference stubs;
    // repository validation is exercised here with the exact canonical plan collection.
    delete repositoryWorkspace.nuanceStudies;
    const created = await repository.save(repositoryWorkspace, null);
    expect(created.observationSupportRecords).toHaveLength(3);
    expect(created.observationSupportSelections).toHaveLength(1);
    await expect(repository.read('another-owner', created.id)).rejects.toMatchObject({ code: 'ownerMismatch' });

    const goodEdit = structuredClone(created);
    goodEdit.title = 'Support conservé après lecture';
    const saved = await repository.save(goodEdit, created.revision);
    expect(saved.revision).toBe(2);

    const stale = structuredClone(created);
    stale.title = 'Écriture périmée';
    await expect(repository.save(stale, created.revision)).rejects.toMatchObject({ code: 'staleRevision' });

    const tampered = structuredClone(saved);
    tampered.observationSupportSelections![0].dimensionReference = 'forged-dimension';
    await expect(repository.save(tampered, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read(created.ownerKey, created.id)).resolves.toMatchObject({
      revision: 2, title: 'Support conservé après lecture',
    });
    repository.close();
  });

  it('qualifie une note 3/5 face à 0–100 comme non comparable selon le contrat existant', async () => {
    const full = await supportedWorkspace();
    const metric = structuredClone(full.fixture.noteDefinition.metric!);
    const scale = { ...structuredClone(full.fixture.noteDefinition.scale!), id: 'fixture-scale-five', domain: { min: 0, max: 5 } };
    scale.metricRef = { id: metric.id, version: metric.version };
    const definition = createHopV55ObservationSupportDefinition({ dimension: full.fixture.noteDefinition.dimension, metric, scale });
    const observation = structuredClone(full.fixture.note);
    observation.dimension = { status: 'resolved', definition };
    observation.scale = { status: 'known', metric, scale };
    observation.sense = { kind: 'sensoryRating', value: 3 };
    const arithmetic = structuredClone(full.fixture.arithmetic);
    arithmetic.unitBridge!.sourceDefinition = definition;
    const result = qualifyBrewingObservationNumerics(observation, arithmetic);
    expect(result.status).toBe('nonComparable');
    if (result.status === 'nonComparable') expect(result.reasons.map(row => row.code)).toContain('bridgeDomainMismatch');
  });

  it('lie une stabilité à la cible/frame/arithmétique exacte et refuse une cible changée avant projection', async () => {
    const full = await supportedWorkspace();
    const binding = createHopV55ObservationSupportComparisonBinding({
      anchorReference: full.fixture.anchor.reference,
      currentStateReference: full.workspace.observationAnchors!.find(row => row.recordKind === 'currentPreparation')!.preparation.reference,
      target: full.fixture.target,
      frameReferences: [full.fixture.plan.reference], arithmeticReference: full.arithmetic.reference,
    });
    const record = createHopV55ObservationSupportStabilityRecord({ ...recordBase(full.workspace, 'stability-v1', 'stability-question-1'),
      stability: full.fixture.restStability, comparisonBinding: binding });
    const withStability = appendHopV55ObservationSupportRecord(full.workspace, record);
    expect(resolveHopV55ObservationStabilityForComparison({ workspace: withStability, recordReference: record.reference,
      comparisonBinding: binding })).toMatchObject({ status: 'ready', record: { reference: record.reference } });
    const changedTarget = { ...full.fixture.target, explanation: 'Nouvelle cible explicitement différente.' };
    const changedBinding = createHopV55ObservationSupportComparisonBinding({
      anchorReference: full.fixture.anchor.reference,
      currentStateReference: full.workspace.observationAnchors!.find(row => row.recordKind === 'currentPreparation')!.preparation.reference,
      target: changedTarget,
      frameReferences: [full.fixture.plan.reference], arithmeticReference: full.arithmetic.reference,
    });
    expect(resolveHopV55ObservationStabilityForComparison({ workspace: withStability, recordReference: record.reference,
      comparisonBinding: changedBinding })).toMatchObject({ status: 'needsSetup' });
    expect(withStability.observationProjections ?? []).toEqual([]);
  });

  it('renvoie un format support futur en lecture seule sans retomber sur une ancienne sélection', async () => {
    const full = await supportedWorkspace();
    const future = { format: 'hop-v55-observation-support-selection-v2', id: 'future-selection', workspaceId: full.workspace.id,
      ownerKey: full.workspace.ownerKey, revision: 2, predecessorReference: full.workspace.observationSupportSelections![0].reference,
      rawBytes: 'opaque support bytes' };
    const withFuture = { ...full.workspace, observationSupportSelections: [...full.workspace.observationSupportSelections!, future as never] };
    expect(resolveHopV55ObservationSupport({ workspace: withFuture })).toMatchObject({ status: 'unsupportedRO', snapshot: future });

    const protocol = full.protocol;
    const futureProtocol = { format: 'hop-v55-observation-support-record-v2', recordKind: 'protocolNote',
      id: 'future-protocol-v2', supportId: protocol.supportId, revision: protocol.revision + 1,
      predecessorReference: protocol.reference, workspaceId: full.workspace.id, ownerKey: full.workspace.ownerKey,
      rawBytes: 'opaque record bytes' };
    const withFutureSuccessor = { ...full.workspace,
      observationSupportRecords: [...full.workspace.observationSupportRecords!, futureProtocol as never] };
    expect(resolveHopV55ObservationSupport({ workspace: withFutureSuccessor }))
      .toMatchObject({ status: 'unsupportedRO', snapshot: futureProtocol });
  });
});
