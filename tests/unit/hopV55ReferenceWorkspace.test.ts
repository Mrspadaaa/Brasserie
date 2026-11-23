import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import type { HopProgramChange } from '../../src/domain/hopDecision/types';
import { brewingScenarioCurrentReference, buildBrewingScenarioRequest, simulateBrewingScenario, type BrewingScenarioResult } from '../../src/domain/brewingScenario';
import {
  applyBrewingReferenceCommand,
  openBrewingReferenceContext,
  readBrewingReferenceRecord,
  suggestNextBrewingReferenceVersion,
  type BrewingReferenceCommandInput,
  type BrewingReferenceEventV1,
  type BrewingReferenceObservationV1,
} from '../../src/domain/brewingReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { adoptBrewingNuancePlan, proposeBrewingNuancePlans, projectBrewingNuances, reviseBrewingNuancePlan, type BrewingNuancePlan } from '../../src/domain/brewingNuanceProjection';
import type { BrewingSensoryDimension } from '../../src/domain/brewingSensory';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import {
  adoptHopV55ReferenceHypothesis,
  applyHopV55ReferenceEvent,
  ensureHopV55ReferenceJournal,
  getHopV55AdoptedBaseline,
  getHopV55ReferenceDefinitions,
  getHopV55ReferenceHypotheses,
  getHopV55ReferenceProjection,
  hopV55ReferenceContextId,
  linkHopV55ScenarioResult,
} from '../../src/services/hopV55/referenceWorkspace';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace, HopV55WorkspaceEnvelopeV1 } from '../../src/services/hopV55/contracts';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter, type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import {
  applyHopV55FullRecipeCopy,
  HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
  previewHopV55FullRecipeCopy,
  readHopV55FullRecipeCopyReceipt,
  type HopV55FullRecipeCopyReceipt,
} from '../../src/services/hopV55/fullRecipeCopy';
import { applyHopV55ProgramCopy, hopV55ProgramCopyReference, previewHopV55ProgramCopy, type HopV55ProgramCopy } from '../../src/services/hopV55/programCopy';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { testHopPolicy, testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';
import { hopTestSource, hopTestVariety } from '../fixtures/hopIndex';
import { hopV55Workspace } from '../fixtures/hopV55';
import bootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import extrapolations from '../../src/data/hopExtrapolationBootstrap.json';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import { brewingNuanceViewModel, type BrewingNuanceProjection } from '../../src/domain/brewingNuanceProjection';

type WorkspaceRow = HopV55WorkspaceEnvelopeV1;
type Row = Record<string, any>;

class WorkspaceTable implements HopV55WorkspaceTable<WorkspaceRow> {
  rows = new Map<string, WorkspaceRow>();
  private key(rowOrKey: unknown): string {
    if (Array.isArray(rowOrKey)) return JSON.stringify(rowOrKey);
    const row = rowOrKey as WorkspaceRow;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: WorkspaceRow) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: WorkspaceRow) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class WorkspaceMemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new WorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = snapshot; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() {}
}

class ScenarioMemoryTable implements BrewingScenarioLocalTable<Row> {
  rows = new Map<string, Row>();
  constructor(private readonly kind: 'dossiers' | 'events') {}
  private key(rowOrKey: unknown): string {
    if (Array.isArray(rowOrKey)) return JSON.stringify(rowOrKey);
    const row = rowOrKey as Row;
    return JSON.stringify(this.kind === 'dossiers' ? [row.ownerKey, row.scenarioId] : [row.ownerKey, row.eventId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()].filter(row => {
      const actual = index === 'ownerKey' ? row.ownerKey
        : index === '[ownerKey+scenarioId]' ? [row.ownerKey, row.scenarioId]
          : index === '[ownerKey+eventId]' ? [row.ownerKey, row.eventId] : undefined;
      return JSON.stringify(actual) === JSON.stringify(key);
    }).map(row => structuredClone(row)) }) };
  }
}

class ScenarioMemoryDatabase implements BrewingScenarioLocalDatabaseAdapter {
  dossiers = new ScenarioMemoryTable('dossiers');
  events = new ScenarioMemoryTable('events');
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const dossiers = new Map([...this.dossiers.rows].map(([key, value]) => [key, structuredClone(value)]));
      const events = new Map([...this.events.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.dossiers.rows = dossiers; this.events.rows = events; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() {}
}

const when = '2026-10-02T08:10:00.000Z';
const source: HopSource = { title: 'Observation explicitement fictive', author: 'Fixture', year: 2026,
  kind: 'observation', reference: 'fixture://hop-v55/reference-workspace' };
const ownerActor = (ownerKey: string) => ({ id: ownerKey, label: 'Brasseur' });

async function contextFixture(mode: 'planning' | 'fermenting' | 'unknown' = 'planning') {
  const context = makeHopV55FixtureContext(mode);
  const references = await loadBrewingCatalogueReferences();
  context.hopIndex = {
    varieties: [...(context.hopIndex?.varieties ?? []), ...references.varieties],
    lots: context.hopIndex?.lots ?? [],
    knowledge: references.knowledge,
    predictions: context.hopIndex?.predictions ?? [],
    tastings: context.hopIndex?.tastings ?? [],
    truncated: context.hopIndex?.truncated ?? [],
  };
  return { context, prepared: prepareBrewingScenarioContext(context) };
}

function emptyHypothesisWorkspace(ownerKey = 'owner-reference-v55'): HopV55Workspace {
  const workspace = hopV55Workspace(ownerKey, 'workspace-reference-v55');
  workspace.referenceHypotheses = [];
  return workspace;
}

function adoptedHypothesis(workspace: HopV55Workspace, overrides: Partial<HopV55Workspace['referenceHypotheses'][number]> = {}) {
  const base = hopV55Workspace().referenceHypotheses[0];
  return { ...structuredClone(base), id: 'hypothesis-user-reference', version: 1, label: 'Référence adoptée explicitement', recordedAt: when,
    ...overrides };
}

function observation(id: string, definition?: ReturnType<typeof getHopV55ReferenceDefinitions>[number]): BrewingReferenceObservationV1 {
  return {
    id, version: 1,
    subject: { kind: 'beer', label: 'Bière explicitement observée' },
    observedAt: '2026-10-01T18:00:00.000Z',
    author: ownerActor('owner-reference-v55'), origin: { kind: 'personalObservation', description: 'Transcription littérale de fixture.' },
    originalText: 'Note personnelle 3; échelle et sens de la référence non établis.',
    dimension: definition ? { status: 'resolved', definition } : { status: 'unresolved', label: 'fruité' },
    scale: definition?.metric && definition.scale ? { status: 'known', metric: definition.metric, scale: definition.scale } : { status: 'unknown' },
    sense: { kind: 'sensoryRating', value: 3 },
    comparison: { kind: 'relative', relationship: 'plus marqué que le souvenir non ancré', referent: null },
    context: { sourceTextRetained: true },
  };
}

function actualScenarioResult(): BrewingScenarioResult {
  const input: HopRecipeInput = { volumeL: 24, yeastId: testHopYeast.id,
    additions: [{ id: 'hop-1', name: 'Lot témoin', triplet: structuredClone(testHopTriplet) }],
    fermentation: [{ kind: 'primaire', tempC: 20, days: 7 }] };
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-v55-link', revision: 1,
    baseline: { kind: 'hypothetical', label: 'Référence du scénario de test', input } });
  return simulateBrewingScenario(request, { engineData: testHopData(), materials: [] });
}

async function applyFullRecipeCopy(): Promise<{ copy: HopV55Workspace['copies'][number]; receipt: HopV55FullRecipeCopyReceipt;
  previewReceipt: HopV55FullRecipeCopyReceipt; sourceRecipeId: string }> {
  const { context, prepared } = await contextFixture('planning');
  const current = prepared.runtime.current;
  const program = prepared.binding?.program;
  if (!current || !program) throw new Error('La fixture planning doit produire un programme J1 courant.');
  const selected = program.additions.find(row => row.status === 'planned');
  if (!selected?.grams) throw new Error('La fixture planning doit produire une masse future explicite.');
  const branchId = 'full-copy-receipt-test';
  const change: HopProgramChange = { kind: 'replace', additionId: selected.id,
    additions: [{ ...structuredClone(selected), grams: selected.grams + 1 }] };
  const branch = { id: branchId, label: 'Copie complète de test', assumptions: [{ id: 'future-dose-v55', path: 'program.changes',
    label: 'Dose future explicite', status: 'selected' as const, origin: 'userHypothesis' as const,
    explanation: 'Masse de ligne futur J1 choisie dans la fixture.', value: 'masse future modifiée' }], programChanges: [change] };
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-full-copy-receipt-test', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program,
    contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push(branch);
  const result = simulateBrewingScenario(request, prepared.runtime);
  const resultBranch = result.branches.find(row => row.id === branchId);
  const proposed = resultBranch?.programProposal?.program;
  if (!proposed) throw new Error('La fixture doit conserver une proposition de programme J1.');
  const finalHopMasses = proposed.additions.map(row => {
    if (row.grams === null) throw new Error(`La masse finale de ${row.id} doit être déclarée pour ce test.`);
    return { additionId: row.id, grams: row.grams };
  });
  const preview = previewHopV55FullRecipeCopy({ result, branchId, context, plan: {
    format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId, adoptHopProgram: true, finalHopMasses,
  }, alphaChoices: Object.fromEntries(current.input.additions.map(row => [row.id, {
    value: 6, reason: 'Choix explicite réservé à la fixture d’application.',
  }])) });
  if (preview.status !== 'ready') throw new Error(preview.status === 'blocked' ? preview.reason : `Aperçu complet non prêt: ${preview.status}.`);
  const applied = applyHopV55FullRecipeCopy({ preview: preview.preview, context, copyId: 'full-recipe-copy-applied-v55',
    createdAt: '2026-10-02T08:20:00.000Z' });
  if (applied.status !== 'ready') throw new Error(applied.status === 'blocked' ? applied.reason : 'Application locale de copie complète attendue.');
  return { copy: applied.copy, receipt: applied.receipt, previewReceipt: preview.preview.receipt, sourceRecipeId: context.recipe!.id };
}

async function applyFutureProgramCopy(): Promise<HopV55ProgramCopy> {
  const { context, prepared } = await contextFixture('fermenting');
  const current = prepared.runtime.current;
  const program = current?.program;
  if (!current || !program) throw new Error('La fixture de fermentation doit fournir un programme courant.');
  const future = program.additions.find(row => row.status === 'planned');
  if (!future?.grams) throw new Error('La fixture doit garder une dose future déclarée.');
  const branchId = 'program-copy-persistence-test';
  const change: HopProgramChange = { kind: 'replace', additionId: future.id,
    additions: [{ ...structuredClone(future), grams: future.grams + 2 }] };
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-program-copy-persistence-test', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program,
    contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push({ id: branchId, label: 'Ajout futur de test', assumptions: [{ id: 'program-dose-v55', path: 'program.changes',
    label: 'Dose future', status: 'selected', origin: 'userHypothesis', explanation: 'Réglage explicite du futur.', value: 'dose ajustée' }], programChanges: [change] });
  const result = simulateBrewingScenario(request, prepared.runtime);
  const preview = previewHopV55ProgramCopy({ result, branchId, context });
  if (preview.status !== 'ready') throw new Error(preview.status === 'blocked' ? preview.reason : 'Aperçu programme attendu.');
  const applied = applyHopV55ProgramCopy({ preview: preview.preview, context, copyId: 'program-copy-applied-v55', createdAt: when });
  if (applied.status !== 'ready') throw new Error(applied.reason);
  return applied.copy;
}

function nuanceStudy(): { id: string; scenarioId: string; snapshotReference: string; proposal: BrewingNuancePlan; adoptedPlan: BrewingNuancePlan;
  projection: BrewingNuanceProjection; context: any; reference: any } {
  const dimensions: BrewingSensoryDimension[] = [{ id: 'dimension-neutre', version: '1', name: 'Dimension fictive',
    definition: 'Définition explicite de test, sans signification produit.', terms: ['terme-fictif'], sourceRefs: [hopTestSource] }];
  const model = structuredClone(extrapolations[0]) as HopExtrapolation;
  const axis = structuredClone((bootstrap.filter(row => row.kind === 'axis') as HopAxis[])
    .find(row => model.axes.some(candidate => candidate.id === row.id && candidate.version === row.version))!) as HopAxis;
  const data = { varieties: [{ ...hopTestVariety(), id: 'nuance-hop-v55', descriptions: [] }], lots: [],
    knowledge: [axis, testHopYeast, testHopPolicy, model] as HopKnowledge[] };
  const candidates = [{ id: 'candidate-v55', name: 'Bière fictive', input: {
    volumeL: 20, yeastId: testHopYeast.id,
    additions: [{ id: 'hop-v55', name: 'Lot fictif', triplet: { ...testHopTriplet, varietyId: 'nuance-hop-v55', timing: 'postFermentation' as const,
      contactHours: 24, temperatureC: 15 } }], fermentation: [],
  } }];
  const proposed = proposeBrewingNuancePlans({ planId: 'plan-v55-snapshot', dimensions, sourceModel: model, axes: [axis],
    proposedAt: when, proposedBy: { origin: 'user', name: 'Fixture' } });
  const adopted = adoptBrewingNuancePlan(proposed[0], { adoptedAt: when, adoptedBy: { origin: 'user', name: 'Fixture' }, reason: 'Adoption explicite de la projection de test.' });
  const projection = projectBrewingNuances(adopted, candidates, data);
  const context = { id: 'nuance-context-v55', version: '1', kind: 'fixture', contentReference: 'nuance-context-ref-v55', label: 'Contexte explicite', sourceRefs: [hopTestSource] };
  const reference = { id: 'nuance-reference-v55', version: '1', kind: 'adoptedHypothesis', contentReference: adopted.reference, sourceRefs: [hopTestSource] };
  // The DTO is constructed once here to prove this archive's exact context/reference pair is valid.
  brewingNuanceViewModel(projection, { context, reference });
  return { id: 'nuance-study-v55', scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1',
    proposal: proposed[0], adoptedPlan: adopted, projection, context, reference };
}

describe('workspace du journal de référence V5.5', () => {
  it('distingue le planning physique déclaré vide du passé inconnu et n’invente aucune baseline', async () => {
    const planning = await contextFixture('planning');
    const fermenting = await contextFixture('fermenting');
    const unknown = await contextFixture('unknown');
    const workspace = emptyHypothesisWorkspace();
    const openedPlanning = ensureHopV55ReferenceJournal(workspace, planning.context, planning.prepared);
    const openedFermenting = ensureHopV55ReferenceJournal(workspace, fermenting.context, fermenting.prepared);
    const openedUnknown = ensureHopV55ReferenceJournal(workspace, unknown.context, unknown.prepared);
    const planningRead = readBrewingReferenceRecord(openedPlanning.referenceJournal!.record, openedPlanning.referenceJournal!.events);
    const fermentingRead = readBrewingReferenceRecord(openedFermenting.referenceJournal!.record, openedFermenting.referenceJournal!.events);
    const unknownRead = readBrewingReferenceRecord(openedUnknown.referenceJournal!.record, openedUnknown.referenceJournal!.events);
    if ('status' in planningRead || 'status' in fermentingRead || 'status' in unknownRead) throw new Error('Format de contexte de référence inattendu.');

    expect(planningRead.projection.context.past).toEqual({ status: 'declaredComplete', additions: [] });
    expect(fermentingRead.projection.context.past).toMatchObject({ status: 'partial', knownAdditions: [{ id: 'recipe-hop:0', label: 'Identité fictive A' }] });
    expect(fermentingRead.projection.context.past.status).toBe('partial');
    if (fermentingRead.projection.context.past.status === 'partial') expect(fermentingRead.projection.context.past.knownAdditions).toHaveLength(1);
    expect(unknownRead.projection.context.past).toEqual({ status: 'unknown' });
    expect(planningRead.projection.references).toEqual([]);
    expect(getHopV55ReferenceProjection(openedPlanning)?.currentReference).toBeNull();
    expect(getHopV55AdoptedBaseline(openedPlanning)).toBeUndefined();
    expect(getHopV55ReferenceHypotheses(openedPlanning)).toEqual([]);
    expect(openedPlanning.referenceJournal?.record.contextId).toBe(hopV55ReferenceContextId(workspace.id));
  });

  it('convertit une ancienne hypothèse sans perte, avec deux événements explicites et aucun axe rétroactivement inventé', async () => {
    const { context, prepared } = await contextFixture('planning');
    const legacy = hopV55Workspace();
    const baseline = structuredClone(legacy.referenceHypotheses[0].baseline);
    const converted = ensureHopV55ReferenceJournal(legacy, context, prepared);
    const read = readBrewingReferenceRecord(converted.referenceJournal!.record, converted.referenceJournal!.events);
    if ('status' in read) throw new Error('Format V1 attendu.');

    expect(read.events.map(event => event.kind)).toEqual(['contextOpened', 'referenceProposed', 'referenceAdopted']);
    expect(read.projection.references[0].sensoryDefinitions).toEqual([]);
    expect(read.projection.references[0].content).toMatchObject({ baseline });
    expect(getHopV55AdoptedBaseline(converted)).toEqual(baseline);
    expect(getHopV55ReferenceHypotheses(converted)).toEqual(legacy.referenceHypotheses);
    expect(converted.referenceHypotheses).toEqual(legacy.referenceHypotheses);

    const alreadyOpened = ensureHopV55ReferenceJournal(emptyHypothesisWorkspace(), context, prepared);
    const hybrid = { ...alreadyOpened, referenceHypotheses: structuredClone(legacy.referenceHypotheses) };
    const convertedHybrid = ensureHopV55ReferenceJournal(hybrid, context, prepared);
    const repeatedHybrid = ensureHopV55ReferenceJournal(convertedHybrid, context, prepared);
    expect(convertedHybrid.referenceJournal?.events.map(event => event.kind)).toEqual(['contextOpened', 'referenceProposed', 'referenceAdopted']);
    expect(repeatedHybrid.referenceJournal?.events).toEqual(convertedHybrid.referenceJournal?.events);
  });

  it('adopte un texte NR explicite sans renuméroter le wrapper numérique et garde le default legacy exact', async () => {
    const { context, prepared } = await contextFixture('planning');
    const workspace = emptyHypothesisWorkspace('owner-v55-reference-version-text');
    const hypothesisV1 = adoptedHypothesis(workspace, { id: 'hypothesis-numeric-reference', version: 1 });
    const defaultV1 = adoptHopV55ReferenceHypothesis(workspace, hypothesisV1, context, prepared);
    expect(defaultV1.referenceJournal?.events.map(event => event.commandId)).toEqual([
      'context-open:workspace-reference-v55',
      'reference-propose:hypothesis-numeric-reference:v1',
      'reference-adopt:hypothesis-numeric-reference:v1',
    ]);
    expect(getHopV55ReferenceProjection(defaultV1)?.references[0].version).toBe('1');
    const defaultReplay = adoptHopV55ReferenceHypothesis(workspace, hypothesisV1, context, prepared);
    expect(defaultReplay.referenceJournal).toEqual(defaultV1.referenceJournal);

    const hypothesisV2 = adoptedHypothesis(workspace, { id: hypothesisV1.id, version: 2, label: 'Référence numérique R2' });
    const defaultV2 = adoptHopV55ReferenceHypothesis(defaultV1, hypothesisV2, context, prepared);
    const beforeActivation = getHopV55ReferenceProjection(defaultV2)!;
    const suggested = suggestNextBrewingReferenceVersion([
      ...beforeActivation.references.map(row => ({ id: row.id, version: row.version })),
      { id: 'another-reference-series', version: '99' },
    ], hypothesisV1.id);
    expect(suggested).toEqual({ status: 'suggested', id: hypothesisV1.id, version: '3' });
    if (suggested.status !== 'suggested') throw new Error('La série numérique 1/2 doit proposer 3.');
    const referenceV1 = structuredClone(beforeActivation.references[0]);
    const referenceV2 = structuredClone(beforeActivation.references[1]);
    const hypothesisV3 = adoptedHypothesis(workspace, { id: hypothesisV1.id, version: 3, label: 'Référence numérique R3' });
    const explicitV3 = adoptHopV55ReferenceHypothesis(defaultV2, hypothesisV3, context, prepared,
      { referenceVersion: suggested.version });
    const afterV3 = getHopV55ReferenceProjection(explicitV3)!;
    expect(afterV3.references.map(row => row.version)).toEqual(['1', '2', '3']);
    expect(afterV3.references[0]).toEqual(referenceV1);
    expect(afterV3.references[1]).toEqual(referenceV2);
    expect(afterV3.currentReference?.version).toBe('3');
    expect(afterV3.references[2].predecessor).toEqual({ id: referenceV2.id, version: referenceV2.version,
      contentReference: referenceV2.contentReference });
    expect(getHopV55ReferenceHypotheses(explicitV3).map(row => row.version)).toEqual([1, 2, 3]);

    const opaqueWorkspace = emptyHypothesisWorkspace('owner-v55-reference-opaque-version');
    const opaqueText = 'Release/Legacy Α 02';
    const opaqueHypothesis = adoptedHypothesis(opaqueWorkspace, { id: 'hypothesis-opaque-version', version: 1,
      label: 'Référence de série opaque' });
    const opaque = adoptHopV55ReferenceHypothesis(opaqueWorkspace, opaqueHypothesis, context, prepared,
      { referenceVersion: opaqueText });
    const opaqueProjection = getHopV55ReferenceProjection(opaque)!;
    expect(opaqueProjection.references).toHaveLength(1);
    expect(opaqueProjection.references[0].version).toBe(opaqueText);
    expect(opaqueProjection.references[0].predecessor).toBeNull();
    expect(opaqueProjection.currentReference?.version).toBe(opaqueText);
    expect(getHopV55ReferenceHypotheses(opaque)).toEqual([]);

    const opaqueV1Identity = opaqueProjection.currentReference!;
    const opaqueV2Text = 'Release/Legacy Α 03';
    const opaqueV2 = adoptHopV55ReferenceHypothesis(opaque,
      adoptedHypothesis(opaqueWorkspace, { id: opaqueHypothesis.id, version: 2, label: 'Révision opaque explicite' }),
      context, prepared, { referenceVersion: opaqueV2Text });
    const opaqueV2Projection = getHopV55ReferenceProjection(opaqueV2)!;
    expect(opaqueV2Projection.references.map(row => row.version)).toEqual([opaqueText, opaqueV2Text]);
    expect(opaqueV2Projection.references[1].predecessor).toEqual(opaqueV1Identity);
    expect(getHopV55ReferenceHypotheses(opaqueV2)).toEqual([]);

    const beforeDuplicate = structuredClone(opaqueV2.referenceJournal);
    const duplicateOpaque = adoptedHypothesis(opaqueWorkspace, { id: opaqueHypothesis.id, version: 3,
      label: 'Contenu différent pour la même version NR' });
    expect(() => adoptHopV55ReferenceHypothesis(opaqueV2, duplicateOpaque, context, prepared,
      { referenceVersion: opaqueV2Text })).toThrow(/version de référence existe déjà/i);
    expect(opaqueV2.referenceJournal).toEqual(beforeDuplicate);
    expect(() => adoptHopV55ReferenceHypothesis(opaqueV2, duplicateOpaque, context, prepared, { referenceVersion: '   ' }))
      .toThrow(/texte non vide/i);

    const raceWorkspace = emptyHypothesisWorkspace('owner-v55-reference-version-race');
    const raceV1 = adoptHopV55ReferenceHypothesis(raceWorkspace,
      adoptedHypothesis(raceWorkspace, { id: 'hypothesis-version-race', version: 1 }), context, prepared,
      { referenceVersion: 'opaque-r1' });
    const database = new WorkspaceMemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: raceWorkspace.ownerKey, database });
    try {
      const savedV1 = await repository.save(raceV1, null);
      const forkA = adoptHopV55ReferenceHypothesis(savedV1,
        adoptedHypothesis(savedV1, { id: 'hypothesis-version-race', version: 2, label: 'Branche A' }), context, prepared,
        { referenceVersion: 'opaque-r2-A' });
      const forkB = adoptHopV55ReferenceHypothesis(savedV1,
        adoptedHypothesis(savedV1, { id: 'hypothesis-version-race', version: 2, label: 'Branche B' }), context, prepared,
        { referenceVersion: 'opaque-r2-B' });
      const savedForkA = await repository.save(forkA, savedV1.revision);
      await expect(repository.save(forkB, savedV1.revision)).rejects.toMatchObject({ code: 'staleRevision' });
      const reread = await repository.read(savedV1.ownerKey, savedV1.id);
      expect(getHopV55ReferenceProjection(reread!)?.references.map(row => row.version)).toEqual(['opaque-r1', 'opaque-r2-A']);
      expect(savedForkA.referenceJournal?.events.slice(0, raceV1.referenceJournal!.events.length))
        .toEqual(raceV1.referenceJournal?.events);
    } finally { repository.close(); }
  });

  it('fige les axes source en definitions modelIndex et conserve R1 quand une adoption devient R2 sous CAS', async () => {
    const { context, prepared } = await contextFixture('planning');
    const axes = prepared.runtime.engineData.knowledge.filter(row => row.kind === 'axis') as HopAxis[];
    const definitions = getHopV55ReferenceDefinitions(prepared);
    expect(definitions).toHaveLength(axes.length);
    expect(definitions.every(definition => definition.metric?.kind === 'modelIndex' && definition.metric.unit === 'axisScale'
      && definition.scale?.domain && definition.dimension.sourceRefs.length > 0)).toBe(true);

    const workspace = emptyHypothesisWorkspace();
    const hypothesisV1 = adoptedHypothesis(workspace);
    const first = adoptHopV55ReferenceHypothesis(workspace, hypothesisV1, context, prepared);
    const firstJournal = structuredClone(first.referenceJournal!);
    const firstProjection = getHopV55ReferenceProjection(first)!;
    expect(firstJournal.events.map(event => event.kind)).toEqual(['contextOpened', 'referenceProposed', 'referenceAdopted']);
    expect(firstProjection.references[0].sensoryDefinitions).toEqual(definitions);

    const database = new WorkspaceMemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database });
    const savedV1 = await repository.save(first, null);
    const hypothesisV2 = adoptedHypothesis(workspace, { version: 2, label: 'Référence révisée explicitement' });
    const revised = adoptHopV55ReferenceHypothesis(savedV1, hypothesisV2, context, prepared);
    const savedV2 = await repository.save(revised, savedV1.revision);
    const reread = await repository.read(workspace.ownerKey, workspace.id);
    const rereadProjection = getHopV55ReferenceProjection(reread!)!;

    expect(savedV2.revision).toBe(2);
    expect(reread?.referenceHypotheses).toEqual([]);
    expect(reread?.referenceJournal?.events.slice(0, firstJournal.events.length)).toEqual(firstJournal.events);
    expect(rereadProjection.references.map(row => row.version)).toEqual(['1', '2']);
    expect(rereadProjection.references[0].contentReference).toBe(firstProjection.references[0].contentReference);
    expect(getHopV55ReferenceHypotheses(reread!)).toMatchObject([{ version: 1 }, { version: 2 }]);
    expect(getHopV55AdoptedBaseline(reread!)).toEqual(hypothesisV2.baseline);
    await expect(repository.save(savedV1, savedV1.revision)).rejects.toMatchObject({ code: 'staleRevision' });
    repository.close();
  });

  it('conserve les observations qualitatives/note sans échelle, retry, conflit et référent relatif inconnu', async () => {
    const { context, prepared } = await contextFixture('unknown');
    const workspace = ensureHopV55ReferenceJournal(emptyHypothesisWorkspace(), context, prepared);
    const command: BrewingReferenceCommandInput<'observationRecorded'> = {
      ownerKey: workspace.ownerKey, contextId: hopV55ReferenceContextId(workspace.id), commandId: 'observation-relative-v55',
      expectedRevision: 1, recordedAt: when, kind: 'observationRecorded', payload: { observation: observation('tasting-v55') },
    };
    const recorded = applyHopV55ReferenceEvent(workspace, command);
    const replay = applyHopV55ReferenceEvent(recorded, command);
    expect(replay.referenceJournal?.events).toEqual(recorded.referenceJournal?.events);
    const read = readBrewingReferenceRecord(replay.referenceJournal!.record, replay.referenceJournal!.events);
    if ('status' in read) throw new Error('Format V1 attendu.');
    expect(read.projection.observations[0]).toMatchObject({
      originalText: 'Note personnelle 3; échelle et sens de la référence non établis.',
      dimension: { status: 'unresolved', label: 'fruité' },
      scale: { status: 'unknown' },
      comparison: { kind: 'relative', referent: null },
    });
    expect(read.events[1].recordedAt).not.toBe(read.projection.observations[0].observedAt);
    const changed = { ...command, payload: { observation: { ...command.payload.observation, originalText: 'Texte différent.' } } };
    expect(() => applyHopV55ReferenceEvent(recorded, changed)).toThrow(/contenu différent/);
  });

  it('refuse rehash/tamper et préserve un journal futur en lecture seule pendant un CAS workspace', async () => {
    const { context, prepared } = await contextFixture('planning');
    const workspace = ensureHopV55ReferenceJournal(emptyHypothesisWorkspace(), context, prepared);
    const database = new WorkspaceMemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database });
    const saved = await repository.save(workspace, null);
    const altered = structuredClone(saved);
    altered.referenceJournal!.events[0] = { ...altered.referenceJournal!.events[0], recordedAt: '2026-10-02T08:11:00.000Z' } as BrewingReferenceEventV1;
    await expect(repository.save(altered, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const oldOpen = saved.referenceJournal!.events[0] as Extract<BrewingReferenceEventV1, { kind: 'contextOpened' }>;
    const rehashedOpen = openBrewingReferenceContext({ ownerKey: saved.ownerKey, contextId: hopV55ReferenceContextId(saved.id),
      commandId: oldOpen.commandId, recordedAt: oldOpen.recordedAt,
      context: { ...oldOpen.payload.context, details: { ...oldOpen.payload.context.details, rehashed: true } } });
    const rehashed = structuredClone(saved);
    rehashed.referenceJournal = { record: rehashedOpen.record, events: [rehashedOpen.event] };
    await expect(repository.save(rehashed, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const badProjectionHash = structuredClone(saved);
    (badProjectionHash.referenceJournal!.record as any).reference = '0'.repeat(64);
    await expect(repository.save(badProjectionHash, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const wrongContextOpen = openBrewingReferenceContext({ ownerKey: saved.ownerKey, contextId: 'another-reference-context',
      commandId: oldOpen.commandId, recordedAt: oldOpen.recordedAt, context: oldOpen.payload.context });
    const wrongContext = structuredClone(saved);
    wrongContext.referenceJournal = { record: wrongContextOpen.record, events: [wrongContextOpen.event] };
    await expect(repository.save(wrongContext, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const futureWorkspace = emptyHypothesisWorkspace();
    futureWorkspace.id = 'workspace-future-v55';
    const future = ensureHopV55ReferenceJournal(futureWorkspace, context, prepared);
    (future.referenceJournal!.record as any).formatVersion = 2;
    (future.referenceJournal!.record as any).futureField = { keep: 'raw' };
    (future.referenceJournal!.events[0] as any).eventFormatVersion = 2;
    const savedFuture = await repository.save(future, null);
    expect(getHopV55ReferenceProjection(savedFuture)).toBeNull();
    const unrelatedEdit = structuredClone(savedFuture);
    unrelatedEdit.title = 'Métadonnée workspace sans toucher au journal futur';
    const preserved = await repository.save(unrelatedEdit, savedFuture.revision);
    expect(preserved.referenceJournal).toEqual(savedFuture.referenceJournal);
    const tamperedFuture = structuredClone(preserved);
    (tamperedFuture.referenceJournal!.record as any).futureField.keep = 'modifié';
    await expect(repository.save(tamperedFuture, preserved.revision)).rejects.toMatchObject({ code: 'unsupportedFormat' });
    repository.close();
  });

  it('lie uniquement un snapshot déjà reçu à une référence adoptée et ne remplace pas un passé inconnu', async () => {
    const { context, prepared } = await contextFixture('planning');
    const hypothesis = adoptedHypothesis(emptyHypothesisWorkspace());
    const adopted = adoptHopV55ReferenceHypothesis(emptyHypothesisWorkspace(), hypothesis, context, prepared);
    const result = actualScenarioResult();
    const scenarios = createBrewingScenarioLocalRepository({ databaseName: 'unused-test-name', database: new ScenarioMemoryDatabase() });
    const receivedAt = '2026-10-02T08:20:00.000Z';
    const receipt = await scenarios.saveResult({ ownerKey: adopted.ownerKey, scenarioId: result.scenarioId,
      eventId: 'result-receipt-v55', recordedAt: receivedAt, result });
    const linked = linkHopV55ScenarioResult(adopted, { result, snapshotReference: result.reference,
      receiptId: receipt.event.eventId, receivedAt });
    const replay = linkHopV55ScenarioResult(linked, { result, snapshotReference: result.reference,
      receiptId: receipt.event.eventId, receivedAt });
    const projection = getHopV55ReferenceProjection(replay)!;
    expect(projection.j5ResultLinks).toHaveLength(1);
    expect(projection.j5ResultLinks[0]).toMatchObject({ result: { snapshotReference: result.reference }, receipt: { status: 'local', receiptId: receipt.event.eventId } });
    const noAdoption = ensureHopV55ReferenceJournal(emptyHypothesisWorkspace(), context, prepared);
    await expect(Promise.resolve().then(() => linkHopV55ScenarioResult(noAdoption, { result, snapshotReference: result.reference,
      receiptId: 'unused-receipt', receivedAt }))).rejects.toThrow(/Aucune référence adoptée/);
    scenarios.close();
  });

  it('lie le reçu préparé à R1 même si R2 est devenue la référence courante avant le CAS de workspace', async () => {
    const { context, prepared } = await contextFixture('planning');
    const workspace = emptyHypothesisWorkspace('owner-v55-reference-race');
    const hypothesisR1 = adoptedHypothesis(workspace, { id: 'hypothesis-reference-race', version: 1, label: 'Référence R1 figée' });
    const adoptedR1 = adoptHopV55ReferenceHypothesis(workspace, hypothesisR1, context, prepared);
    const identityR1 = getHopV55ReferenceProjection(adoptedR1)!.currentReference!;
    const hypothesisR2 = adoptedHypothesis(workspace, { id: 'hypothesis-reference-race', version: 2, label: 'Référence R2 après calcul' });
    const adoptedR2 = adoptHopV55ReferenceHypothesis(adoptedR1, hypothesisR2, context, prepared);
    const identityR2 = getHopV55ReferenceProjection(adoptedR2)!.currentReference!;
    const result = actualScenarioResult();
    const scenarios = createBrewingScenarioLocalRepository({ databaseName: 'unused-reference-race', database: new ScenarioMemoryDatabase() });
    const receivedAt = '2026-10-02T08:25:00.000Z';
    const receipt = await scenarios.saveResult({ ownerKey: adoptedR2.ownerKey, scenarioId: result.scenarioId,
      eventId: 'result-r1-preparation', recordedAt: receivedAt, result });

    const linked = linkHopV55ScenarioResult(adoptedR2, { result, snapshotReference: result.reference,
      receiptId: receipt.event.eventId, receivedAt, reference: identityR1 });
    const projection = getHopV55ReferenceProjection(linked)!;
    expect(projection.currentReference).toEqual(identityR2);
    expect(projection.j5ResultLinks).toHaveLength(1);
    expect(projection.j5ResultLinks[0].reference).toEqual(identityR1);
    await expect(Promise.resolve().then(() => linkHopV55ScenarioResult(adoptedR2, { result,
      snapshotReference: result.reference, receiptId: 'bad-r1-preparation', receivedAt,
      reference: { ...identityR1, contentReference: 'not-adopted' } }))).rejects.toThrow(/identité exacte déjà adoptée/i);
    scenarios.close();
  });

  it('valide un archive de nuance avec son DTO et refuse de réécrire un snapshot antérieur', async () => {
    const { proposal, adoptedPlan, ...study } = nuanceStudy();
    const database = new WorkspaceMemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-a', database });
    const workspace = hopV55Workspace('owner-v55-a', 'workspace-v55-a');
    workspace.nuanceStudies = [study];
    workspace.nuancePlans = [proposal];
    const saved = await repository.save(workspace, null);
    const edit = structuredClone(saved);
    edit.title = 'Archive conservée';
    edit.nuancePlans = [proposal, adoptedPlan];
    const adopted = await repository.save(edit, saved.revision);
    const revision = reviseBrewingNuancePlan(adoptedPlan, { proposedAt: '2026-10-02T08:30:00.000Z',
      proposedBy: { origin: 'user', name: 'Fixture' }, explanation: 'Révision explicitement séparée.',
      parameterChoices: structuredClone(adoptedPlan.parameterChoices) });
    const revised = structuredClone(adopted);
    revised.nuancePlans = [proposal, adoptedPlan, revision];
    const next = await repository.save(revised, adopted.revision);
    expect(next.nuancePlans?.map(plan => plan.reference)).toEqual([proposal.reference, adoptedPlan.reference, revision.reference]);
    expect(next.nuancePlans?.[0]).toEqual(proposal);
    const altered = structuredClone(next);
    altered.nuanceStudies![0].context.label = 'Contexte réécrit après projection';
    await expect(repository.save(altered, next.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const alteredPlan = structuredClone(next);
    alteredPlan.nuancePlans![0].explanation = 'Plan historique réécrit.';
    await expect(repository.save(alteredPlan, next.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const duplicatePlan = structuredClone(next);
    duplicatePlan.nuancePlans!.push(structuredClone(proposal));
    await expect(repository.save(duplicatePlan, next.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read('owner-v55-a', workspace.id)).resolves.toMatchObject({ nuanceStudies: [study] });

    const futureWorkspace = hopV55Workspace('owner-v55-a', 'workspace-v55-future-nuance');
    futureWorkspace.nuanceStudies = [{ ...study, id: 'nuance-study-future', projection: {
      version: 'brewing-nuance-projection-future', rawPayload: { preserve: 'exact' },
    } as any }];
    const savedFuture = await repository.save(futureWorkspace, null);
    const futureEdit = structuredClone(savedFuture);
    futureEdit.title = 'Préserver un format inconnu';
    const preservedFuture = await repository.save(futureEdit, savedFuture.revision);
    expect(preservedFuture.nuanceStudies).toEqual(savedFuture.nuanceStudies);
    const modifiedFuture = structuredClone(preservedFuture);
    (modifiedFuture.nuanceStudies![0].projection as any).rawPayload.preserve = 'modifié';
    await expect(repository.save(modifiedFuture, preservedFuture.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    repository.close();
  });

  it('persiste un reçu de copie complète uniquement après application réelle et le relie à la copie source exacte', async () => {
    const applied = await applyFullRecipeCopy();
    expect(readHopV55FullRecipeCopyReceipt(applied.receipt)).toMatchObject({ status: 'available', receipt: {
      scope: 'localDraft', copyId: applied.copy.id, createdAt: applied.copy.createdAt,
      readiness: { localCopy: 'ready', saveConfirmed: false },
    } });
    const ownerKey = 'owner-v55-full-copy';
    const workspace = hopV55Workspace(ownerKey, 'workspace-v55-full-copy');
    workspace.scenarioIds = [...workspace.scenarioIds, applied.copy.scenarioId];
    workspace.activeScenarioId = applied.copy.scenarioId;
    workspace.selected = { scenarioId: applied.copy.scenarioId, snapshotReference: applied.copy.snapshotReference,
      branchId: applied.copy.branchId, branchReference: applied.copy.branchReference };
    workspace.copies = [...workspace.copies, applied.copy];
    workspace.activeCopyId = applied.copy.id;
    workspace.fullCopyReceipts = [applied.receipt];

    const database = new WorkspaceMemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const saved = await repository.save(workspace, null);
    await expect(repository.read(ownerKey, workspace.id)).resolves.toMatchObject({
      copies: [{ id: 'copy-v1' }, { id: applied.copy.id, sourceRecipeId: applied.sourceRecipeId, scenarioId: applied.copy.scenarioId,
        snapshotReference: applied.copy.snapshotReference, branchId: applied.copy.branchId, branchReference: applied.copy.branchReference }],
      fullCopyReceipts: [applied.receipt], recipeSaveReceipts: [{ copyId: 'copy-v1', recipeId: 'copy-recipe-v1' }],
    });

    const previewOnly = structuredClone(saved);
    previewOnly.fullCopyReceipts = [applied.previewReceipt];
    await expect(repository.save(previewOnly, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const serverScope = structuredClone(saved);
    (serverScope.fullCopyReceipts![0] as any).scope = 'serverConfirmed';
    await expect(repository.save(serverScope, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const mismatchedBranch = structuredClone(saved);
    (mismatchedBranch.fullCopyReceipts![0] as any).branchReference = 'branch-reference-forged';
    await expect(repository.save(mismatchedBranch, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const rehashedReceipt = structuredClone(saved);
    const appendedCopy = rehashedReceipt.copies.find(row => row.id === applied.copy.id)!;
    const appendedReceipt = rehashedReceipt.fullCopyReceipts![0] as any;
    appendedCopy.branchReference = 'branch-reference-rewritten';
    appendedReceipt.branchReference = 'branch-reference-rewritten';
    await expect(repository.save(rehashedReceipt, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    repository.close();
  });

  it('persiste le programme futur sans modifier son ID source; préférence seule ne crée aucune copie', async () => {
    const appliedCopy = await applyFutureProgramCopy();
    const ownerKey = 'owner-v55-program-copy';
    const workspace = emptyHypothesisWorkspace(ownerKey);
    workspace.copies = [];
    workspace.activeCopyId = undefined;
    workspace.snapshotIntents = [];
    workspace.recipeSaveReceipts = [];
    workspace.scenarioIds = [appliedCopy.scenarioId];
    workspace.activeScenarioId = appliedCopy.scenarioId;
    workspace.sourceBatchId = appliedCopy.batchId;
    workspace.selected = { scenarioId: appliedCopy.scenarioId, snapshotReference: appliedCopy.snapshotReference,
      branchId: appliedCopy.branchId, branchReference: appliedCopy.branchReference };
    workspace.programCopies = [appliedCopy];
    workspace.activeProgramCopyId = appliedCopy.id;
    const database = new WorkspaceMemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const saved = await repository.save(workspace, null);
    const reread = await repository.read(ownerKey, workspace.id);
    expect(reread?.programCopies).toEqual([appliedCopy]);
    expect(reread?.activeProgramCopyId).toBe(appliedCopy.id);
    expect(reread?.programCopies?.[0]).toMatchObject({
      sourceProgramId: appliedCopy.programBefore.id,
      programAfter: { id: appliedCopy.programBefore.id, stage: appliedCopy.programBefore.stage },
      scenarioId: appliedCopy.scenarioId, snapshotReference: appliedCopy.snapshotReference,
      branchId: appliedCopy.branchId, branchReference: appliedCopy.branchReference,
    });
    expect(reread?.programCopies?.[0].id).not.toBe(appliedCopy.sourceProgramId);

    const preference = emptyHypothesisWorkspace('owner-v55-preference-only');
    const preferenceRepository = createHopV55WorkspaceRepository({ ownerKey: preference.ownerKey, database: new WorkspaceMemoryDatabase() });
    const initialPreference = await preferenceRepository.save(preference, null);
    const choice = structuredClone(initialPreference);
    choice.selected = { scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1', branchId: 'branch-chosen', branchReference: 'branch-chosen-reference' };
    const selectedOnly = await preferenceRepository.save(choice, initialPreference.revision);
    expect(selectedOnly.selected?.branchId).toBe('branch-chosen');
    expect(selectedOnly.programCopies).toBeUndefined();
    expect(selectedOnly.activeProgramCopyId).toBeUndefined();

    const altered = structuredClone(reread!);
    altered.programCopies![0].branchReference += ':tampered';
    const { format: _format, id: _id, previewReference: _previewReference, createdAt: _createdAt, scope: _scope, ...payload } = altered.programCopies![0];
    altered.programCopies![0].previewReference = hopV55ProgramCopyReference(payload);
    await expect(repository.save(altered, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const activeMissing = structuredClone(reread!);
    activeMissing.activeProgramCopyId = 'missing-program-copy';
    await expect(repository.save(activeMissing, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    repository.close();
    preferenceRepository.close();
  });
});
