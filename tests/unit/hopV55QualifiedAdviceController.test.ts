import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { applyHopAdviceEvent, createHopAdviceDossier, hopAdviceEventContentReference, readHopAdviceEvent,
  type CreateHopAdviceDossierInput, type HopAdviceDossierV3, type HopAdviceEventRead, type HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import * as qualifiedAdviceDomain from '../../src/domain/hopDecision/qualifiedAdvice';
import * as advicePreferenceAdapter from '../../src/domain/hopDecision/adviceProgramAdapter';
import { makeHopAdviceJourneyFixture, addDocumentedAdviceCandidate } from '../fixtures/hopAdviceJourney';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import * as decisionReader from '../../src/services/hopV55/decision';
import * as catalogueLoader from '../../src/domain/hopDecision/catalogueLoader';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3, createHopV55DecisionReadingArchiveV4,
  type HopV55DecisionReadingArchive, type HopV55DecisionReadingSource } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Services, HopV55Workspace, HopV55WorkspaceRepository } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { withHopV55QualifiedAdvicePreparationSession } from '../../src/services/hopV55/qualifiedStudyPreparation';
import { createHopV55QualifiedStudyPreferenceCommandV1 } from '../../src/services/hopV55/qualifiedStudyPreference';
import { createHopV55QualifiedAdviceController, type HopV55QualifiedAdviceControllerHost,
  type HopV55QualifiedAdvicePreferenceRequest, type HopV55QualifiedAdviceSaveRequest } from '../../src/services/hopV55/qualifiedAdviceController';
import { createHopV55QualifiedStudyPreparationV1, readHopV55QualifiedStudyLink,
  readHopV55QualifiedStudyPreparation } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { hopV55Workspace } from '../fixtures/hopV55';

const ownerKey = 'fixture:q09-qualified-advice-controller';
const workspaceId = 'workspace:q09-qualified-advice-controller';
const recordedAt = '2026-10-03T21:10:00.000Z';
const operationQuestion = 'Je planifie une bière faible en alcool et acidulée avec une co-culture de Saccharomyces pastorianus et Lactobacillus plantarum. J’ai une petite récolte de houblon maison sans analyse. Je cherche un caractère plus fruité/citronné en gardant l’acidité. Quelles voies sont défendables ?';
const q09Question = 'Quand avec ma levure, utiliser au mieux mes houblons et lesquels ?';

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown) { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
  ]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows.clear(); for (const [key, value] of snapshot) this.workspaces.rows.set(key, value); throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory fixture only. */ }
}

class MemoryAdviceRepository implements HopDecisionLocalRepository {
  readonly dossiers = new Map<string, HopAdviceDossierV3>();
  readonly events = new Map<string, HopAdviceEventV3[]>();
  createCalls = 0;
  appendCalls = 0;
  failAfterPreferenceOnce = false;
  afterCreate?: () => void;
  private key(owner: string, dossierId: string) { return `${owner}\0${dossierId}`; }
  async create(input: Parameters<HopDecisionLocalRepository['create']>[0]) {
    if (!('formatVersion' in input.study) || input.study.formatVersion !== 3) throw new Error('Étude advice V3 requise.');
    this.createCalls++;
    const key = this.key(input.ownerKey, input.dossierId);
    const existing = this.dossiers.get(key), firstEvent = this.events.get(key)?.[0];
    if (existing && firstEvent) return { status: 'duplicate' as const, dossier: existing, event: firstEvent };
    const created = createHopAdviceDossier(input as CreateHopAdviceDossierInput);
    this.dossiers.set(key, created.dossier); this.events.set(key, [created.event]); this.afterCreate?.();
    return { status: 'created' as const, dossier: created.dossier, event: created.event };
  }
  async append(input: Parameters<HopDecisionLocalRepository['append']>[0]) {
    this.appendCalls++;
    const decoded = readHopAdviceEvent(input.event);
    if ('status' in decoded) throw new Error('Événement advice V3 requis.');
    const key = this.key(input.ownerKey, input.dossierId), current = this.dossiers.get(key), prior = this.events.get(key);
    if (!current || !prior) throw Object.assign(new Error('Dossier absent.'), { code: 'notFound' });
    const found = prior.find(event => event.eventId === decoded.eventId);
    if (found) {
      if (hopAdviceEventContentReference(found) !== hopAdviceEventContentReference(decoded)) {
        throw Object.assign(new Error('EventId conflict.'), { code: 'eventIdConflict' });
      }
      return { status: 'duplicate' as const, dossier: current, event: found };
    }
    const next = applyHopAdviceEvent(current, decoded, prior);
    prior.push(structuredClone(decoded)); this.dossiers.set(key, next);
    if (this.failAfterPreferenceOnce) { this.failAfterPreferenceOnce = false; throw new Error('Réponse perdue après append de préférence.'); }
    return { status: 'appended' as const, dossier: next, event: decoded };
  }
  async read(ownerKeyValue: string, dossierId: string) { return this.dossiers.get(this.key(ownerKeyValue, dossierId)) ?? null; }
  async list(ownerKeyValue: string) { return [...this.dossiers.values()].filter(row => row.ownerKey === ownerKeyValue); }
  async readEvents(ownerKeyValue: string, dossierId: string): Promise<HopAdviceEventRead[]> {
    const events = this.events.get(this.key(ownerKeyValue, dossierId));
    if (!events) throw Object.assign(new Error('Dossier absent.'), { code: 'notFound' });
    return structuredClone(events);
  }
  close() { /* Memory fixture only. */ }
}

function intentDimensions(reading: ReturnType<typeof readHopV55Question> | ReturnType<typeof readHopV55QuestionSemanticV1>) {
  return (reading.response?.intent.criteria ?? []).flatMap(criterion => {
    const description = criterion.description.toLocaleLowerCase('fr');
    if (/fruit|citron|ar[oô]me/iu.test(description)) return [{ criterionId: criterion.id, dimension: 'aroma' as const,
      ...(criterion.familyId ? { familyId: criterion.familyId } : {}) }];
    if (/acid/iu.test(description)) return [{ criterionId: criterion.id, dimension: 'acidity' as const }];
    if (/alcool/iu.test(description)) return [{ criterionId: criterion.id, dimension: 'alcohol' as const }];
    return [];
  });
}

async function makeHarness(options: { scopeArchive?: boolean; question?: string; staleSave?: boolean; failSaveOnce?: boolean } = {}) {
  const fixture = makeHopAdviceJourneyFixture('planning');
  const candidate = addDocumentedAdviceCandidate(fixture);
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const question = options.question ?? operationQuestion;
  const parsed = options.scopeArchive ? readHopV55QuestionWithScopesV1(question, prepared)
    : { reading: readHopV55QuestionSemanticV1(question, prepared), scopeDrafts: [] };
  const reading = parsed.reading;
  if (!reading.response || reading.response.actionKind !== 'exploreStrategies') {
    throw new Error('La lecture fixture Q09/Q01 doit conduire à exploreStrategies.');
  }
  const source: HopV55DecisionReadingSource = context.recipe?.id ? { kind: 'recipe', id: context.recipe.id } : { kind: 'exploration' };
  const runtimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
  let archive: HopV55DecisionReadingArchive;
  if (options.scopeArchive) {
    if (!parsed.scopeDrafts.length) throw new Error('La fixture V3 doit porter au moins une portée de question.');
    const transition = { actId: 'act:q09-controller-scope', kind: 'create' as const,
      reason: 'Portées proposées dans la fixture Q09.', recordedAt,
      actor: { origin: 'proposal' as const, label: 'Lecteur fixture' } };
    const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading, scopeDrafts: parsed.scopeDrafts, transition });
    archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:q09-controller-v3', ownerKey, workspaceId,
      recordedAt, reading, source, runtimeReference, scopeLedger, transition });
  } else {
    archive = createHopV55DecisionReadingArchiveV4({ id: 'reading:q09-controller-v4', ownerKey, workspaceId,
      recordedAt, reading: reading as Parameters<typeof createHopV55DecisionReadingArchiveV4>[0]['reading'], source, runtimeReference });
  }
  const workspace = hopV55Workspace(ownerKey, workspaceId);
  workspace.title = 'Q09 · conseil local synthétique';
  workspace.intent = structuredClone(reading.intent);
  delete workspace.sourceBatchId;
  delete workspace.sourceRecipeId;
  if (source.kind === 'recipe') workspace.sourceRecipeId = source.id;
  workspace.decisionReadings = [archive];

  const currentProgram = prepared.runtime.current?.program ?? null;
  const stage = currentProgram?.stage ?? 'planning';
  const action: HopV55QualifiedAdvicePrepareRequest['action'] = { kind: 'exploreStrategies', situation: {
    stage, program: currentProgram ? structuredClone(currentProgram) : null, materialIds: [candidate.id],
    assertions: structuredClone(fixture.action.situation.assertions), criterionDimensions: intentDimensions(reading), exclusions: [],
  } };
  const explicitFutureStage = currentProgram ? undefined : { kind: 'futureExploration' as const, stage,
    basis: 'Le brasseur déclare explicitement une exploration future à ce stade; le contexte physique reste inchangé.' };
  const database = new MemoryWorkspaceDatabase();
  const rawRepository = createHopV55WorkspaceRepository({ ownerKey, database });
  const initialWorkspace = await rawRepository.save(workspace, null);
  let activeReading: HopV55DecisionReadingArchive = structuredClone(archive);
  let currentContext: BrewerContext = structuredClone(context);
  let staleSaves = options.staleSave ? 1 : 0;
  let failSaveOnce = !!options.failSaveOnce;
  const saves = vi.fn(async (next: HopV55Workspace) => {
    if (failSaveOnce) { failSaveOnce = false; throw new Error('Échec avant CAS de fixture.'); }
    const opened = await rawRepository.read(ownerKey, workspaceId);
    if (!opened) throw new Error('Workspace fixture absent.');
    if (staleSaves > 0) {
      staleSaves--;
      await rawRepository.save({ ...opened, title: 'Écriture concurrente conservée', updatedAt: '2026-10-03T21:11:00.000Z' }, opened.revision);
    }
    return rawRepository.save(next, next.revision);
  });
  const workspaceRepository: HopV55WorkspaceRepository = { list: key => rawRepository.list(key), read: (key, id) => rawRepository.read(key, id),
    save: saves, close: () => rawRepository.close() };
  const qualifiedStudies = new MemoryAdviceRepository();
  const selected = vi.fn(); const received = vi.fn(); const preferenceReceived = vi.fn();
  const pendingPreparations = new Map<string, import('../../src/services/hopV55/qualifiedStudyWorkspace').HopV55QualifiedStudyPreparationV1>();
  const services = { ownerKey, workspaces: workspaceRepository, qualifiedStudies } as unknown as Pick<HopV55Services,
    'ownerKey' | 'workspaces' | 'qualifiedStudies'>;
  const sourceFor = (row: HopV55Workspace): HopV55DecisionReadingSource => row.sourceBatchId
    ? { kind: 'batch', id: row.sourceBatchId } : row.sourceRecipeId ? { kind: 'recipe', id: row.sourceRecipeId } : { kind: 'exploration' };
  const host: HopV55QualifiedAdviceControllerHost = {
    services, enabled: () => true, historical: () => false, reading: () => structuredClone(activeReading),
    context: async () => structuredClone(currentContext),
    workspace: async () => {
      const row = await rawRepository.read(ownerKey, workspaceId);
      if (!row) throw new Error('Workspace fixture absent.');
      return row;
    },
    save: next => saves(next), source: sourceFor,
    runtimeReference: value => hopV55ScenarioRuntimeReference(value.runtime),
    sourceContext: (value, _prepared, row) => value.recipe ? { kind: 'recipe', recipeId: value.recipe.id,
      recipeReference: hopDecisionReference(value.recipe) } : row.sourceBatchId ? { kind: 'batch', batchId: row.sourceBatchId,
        recipeId: value.recipe?.id, recipeSnapshotReference: 'fixture:recipe-snapshot', brewDayRevision: 1,
        programFingerprint: 'fixture:program', stage: 'planning' } : null,
    catalogueInput: () => ({ additionalVariants: structuredClone(fixture.qualificationInput.variants) }),
    selected, received, preferenceReceived, pendingPreparations, now: () => '2026-10-03T21:12:00.000Z',
  };
  return {
    context, prepared, fixture, candidate, reading, source, runtimeReference, archive, workspace, initialWorkspace, action, explicitFutureStage,
    database, rawRepository, workspaceRepository, qualifiedStudies, saves, selected, received, preferenceReceived, pendingPreparations, host,
    setReading(value: HopV55DecisionReadingArchive) { activeReading = structuredClone(value); },
    setContext(value: BrewerContext) { currentContext = structuredClone(value); },
    async stored() { const value = await rawRepository.read(ownerKey, workspaceId); if (!value) throw new Error('Workspace fixture absent.'); return value; },
  };
}

function saveRequest(preparation: Awaited<ReturnType<ReturnType<typeof createHopV55QualifiedAdviceController>['prepareAdvice']>>): HopV55QualifiedAdviceSaveRequest {
  if (preparation.kind !== 'advice' || preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
  return { kind: 'advice', study: preparation.createCommand.study, sourceReadingReference: preparation.sourceReadingReference,
    studyReference: preparation.studyReference, expectedStudyReference: preparation.studyReference };
}

function preferenceRequest(result: PersistHopV55QualifiedStudyResult, optionId: string, optionReference: string): HopV55QualifiedAdvicePreferenceRequest {
  if (result.dossier.status !== undefined || result.dossier.formatVersion !== 3 || result.link.kind !== 'advice') {
    throw new Error('Dossier advice lié attendu.');
  }
  return { expectedLinkReference: result.link.reference, expectedDossierId: result.preparation.dossierId,
    expectedDossierRevision: result.dossier.revision, expectedStudyReference: result.preparation.studyReference,
    expectedOptionId: optionId, expectedOptionReference: optionReference,
    reason: 'Préférence explicite de fixture; aucune dose ni opération n’est demandée.' };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('contrôleur Q09 de conseil qualifié', () => {
  it('inspecte une archive V3 sans builder puis prépare une fois avec l’étape future explicitement scellée', async () => {
    const h = await makeHarness({ scopeArchive: true, question: q09Question, staleSave: true });
    const builder = vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice');
    const parser = vi.spyOn(decisionReader, 'readHopV55Question');
    const controller = createHopV55QualifiedAdviceController(h.host);
    const request = { action: { kind: 'exploreStrategies' as const, situation: { stage: 'planning' as const,
      program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [] } },
      explicitFutureStage: { kind: 'futureExploration' as const, stage: 'planning' as const,
        basis: 'Le brasseur choisit explicitement une exploration future à cette étape.' } };

    const inspected = await controller.inspectAdvice(request);
    expect(inspected.status).toBe('ready');
    expect(builder).not.toHaveBeenCalled();
    const preparation = await controller.prepareAdvice(request);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(preparation).toMatchObject({ kind: 'advice', sourceReadingReference: h.archive.contentReference,
      advicePreparationContext: { explicitFutureStage: request.explicitFutureStage } });
    expect(preparation.createCommand.kind).toBe('advice');
    if (preparation.createCommand.kind !== 'advice') throw new Error('Commande advice requise.');
    expect(preparation.createCommand.study.requestSnapshot.intent.originalQuestion).toBe(q09Question);
    expect(preparation.createCommand.study.requestSnapshot.action).toEqual(request.action);
    expect(h.selected).toHaveBeenCalledTimes(1);
    expect(h.saves).toHaveBeenCalledTimes(2);
    const writes = h.saves.mock.calls.map(([workspace]) => workspace);
    expect(writes[0].qualifiedStudyPreparations).toEqual([preparation]);
    expect(writes[1].qualifiedStudyPreparations).toEqual([preparation]);
    expect((await h.stored()).revision).toBe(h.initialWorkspace.revision + 2);

    const reloadedController = createHopV55QualifiedAdviceController(h.host);
    const builderCalls = builder.mock.calls.length;
    await expect(reloadedController.freshness({ preparation, phase: 'beforeCreate' })).resolves.toEqual({ status: 'current' });
    expect(builder).toHaveBeenCalledTimes(builderCalls);
    expect(parser).not.toHaveBeenCalled();
  });

  it('reprend un échec avant le CAS avec le record pending du host après recréation du controller', async () => {
    const h = await makeHarness({ scopeArchive: true, question: q09Question, failSaveOnce: true });
    const builder = vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice');
    const request = { action: { kind: 'exploreStrategies' as const, situation: { stage: 'planning' as const,
      program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [] } },
      explicitFutureStage: { kind: 'futureExploration' as const, stage: 'planning' as const,
        basis: 'Le brasseur choisit explicitement une exploration future à cette étape.' } };
    const firstController = createHopV55QualifiedAdviceController(h.host);

    await expect(firstController.prepareAdvice(request)).rejects.toThrow('Échec avant CAS de fixture.');
    expect(builder).toHaveBeenCalledTimes(1);
    expect((await h.stored()).qualifiedStudyPreparations).toBeUndefined();
    expect(h.pendingPreparations.size).toBe(1);
    const cached = [...h.pendingPreparations.values()][0];

    const reloadedController = createHopV55QualifiedAdviceController(h.host);
    const recovered = await reloadedController.prepareAdvice(request);
    expect(recovered).toEqual(cached);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(h.selected).toHaveBeenCalledTimes(1);
    expect((await h.stored()).qualifiedStudyPreparations).toEqual([cached]);
    expect(h.pendingPreparations.size).toBe(0);
  });

  it('sauvegarde l’étude et récupère une préférence A sous B sans nouveau builder ni capture', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice');
    const capture = vi.spyOn(advicePreferenceAdapter, 'captureHopAdvicePreference');
    const parser = vi.spyOn(decisionReader, 'readHopV55Question');
    const controller = createHopV55QualifiedAdviceController(h.host);
    const preparation = await controller.prepareAdvice({ action: h.action, ...(h.explicitFutureStage ? { explicitFutureStage: h.explicitFutureStage } : {}) });
    const preparedCalls = builder.mock.calls.length;
    expect(preparedCalls).toBe(1);
    const saved = await controller.saveAdviceStudy(saveRequest(preparation));
    expect(saved.status).toBe('linked');
    expect(saved.link.sourceReadingReference).toBe(h.archive.contentReference);
    expect(builder).toHaveBeenCalledTimes(preparedCalls);
    const study = preparation.createCommand.kind === 'advice' ? preparation.createCommand.study : undefined;
    const option = study?.responseSnapshot.result.options[0];
    if (!option) throw new Error('Le matériau documentaire sélectionné doit fournir une option de fixture.');
    const request = preferenceRequest(saved, option.id, option.reference);
    h.qualifiedStudies.failAfterPreferenceOnce = true;
    await expect(controller.preferAdvice(request)).rejects.toThrow('Réponse perdue après append de préférence.');
    expect(capture).toHaveBeenCalledTimes(1);
    const staged = await h.stored();
    expect(staged.qualifiedStudyPreferenceCommands).toHaveLength(1);
    expect((await h.qualifiedStudies.readEvents(ownerKey, preparation.dossierId)).map(event => event.kind))
      .toEqual(['studySaved', 'strategyPreferred']);

    const nextReading = createHopV55DecisionReadingArchiveV4({ id: 'reading:q09-controller-next', ownerKey, workspaceId,
      recordedAt: '2026-10-03T21:13:00.000Z',
      reading: h.reading as Parameters<typeof createHopV55DecisionReadingArchiveV4>[0]['reading'], source: h.source,
      runtimeReference: h.runtimeReference });
    await h.rawRepository.save({ ...staged, decisionReadings: [...(staged.decisionReadings ?? []), nextReading] }, staged.revision);
    h.setReading(nextReading);
    const revisionBeforeRecovery = (await h.stored()).revision;
    const builderBeforeRecovery = builder.mock.calls.length;
    const recovered = await controller.preferAdvice(request);
    expect(recovered.freshContext).toMatchObject({ status: 'historical' });
    expect(recovered.event).toMatchObject({ kind: 'strategyPreferred', payload: { studyReference: preparation.studyReference,
      optionId: option.id, optionReference: option.reference, reason: request.reason } });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledTimes(builderBeforeRecovery);
    expect(parser).not.toHaveBeenCalled();
    expect((await h.stored()).revision).toBe(revisionBeforeRecovery);
    expect(h.qualifiedStudies.createCalls).toBe(1);
    expect(h.qualifiedStudies.appendCalls).toBe(1);
    expect(h.preferenceReceived).toHaveBeenCalledTimes(1);
  }, 60000);

  it('refuse une préparation V3 devenue historique avant création et ne crée aucun dossier ou préférence', async () => {
    const h = await makeHarness({ scopeArchive: true, question: q09Question });
    const builder = vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice');
    const controller = createHopV55QualifiedAdviceController(h.host);
    const preparation = await controller.prepareAdvice({ action: { kind: 'exploreStrategies', situation: {
      stage: 'planning', program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [],
    } }, explicitFutureStage: { kind: 'futureExploration', stage: 'planning', basis: 'Exploration future de fixture.' } });
    const beforeHistory = await h.stored();
    const nextReading = createHopV55DecisionReadingArchiveV2({ id: 'reading:q09-controller-stale', ownerKey, workspaceId,
      recordedAt: '2026-10-03T21:14:00.000Z', reading: h.reading, source: h.source, runtimeReference: h.runtimeReference });
    await h.rawRepository.save({ ...beforeHistory, decisionReadings: [...(beforeHistory.decisionReadings ?? []), nextReading] }, beforeHistory.revision);
    h.setReading(nextReading);
    const builderCalls = builder.mock.calls.length;
    await expect(controller.freshness({ preparation, phase: 'beforeCreate' })).resolves.toMatchObject({ status: 'historical' });
    expect((await h.stored()).qualifiedStudyPreparations).toEqual([preparation]);
    expect(h.qualifiedStudies.createCalls).toBe(0);
    expect(h.qualifiedStudies.appendCalls).toBe(0);
    expect(builder).toHaveBeenCalledTimes(builderCalls);
  });
  it('ne persiste pas une préférence lorsque la lecture active a changé avant le staging', async () => {
    const h = await makeHarness({ scopeArchive: true, question: q09Question });
    const controller = createHopV55QualifiedAdviceController(h.host);
    const preparation = await controller.prepareAdvice({ action: { kind: 'exploreStrategies', situation: {
      stage: 'planning', program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [],
    } }, explicitFutureStage: { kind: 'futureExploration', stage: 'planning', basis: 'Exploration future de fixture.' } });
    const saved = await controller.saveAdviceStudy(saveRequest(preparation));
    if (preparation.createCommand.kind !== 'advice') throw new Error('Étude advice exacte attendue.');
    const option = preparation.createCommand.study.responseSnapshot.result.options[0];
    if (!option) throw new Error('Option advice exacte attendue.');
    const request = preferenceRequest(saved, option.id, option.reference);
    const nextReading = createHopV55DecisionReadingArchiveV2({ id: 'reading:q09-controller-pref-stale', ownerKey, workspaceId,
      recordedAt: '2026-10-03T21:16:00.000Z', reading: h.reading, source: h.source, runtimeReference: h.runtimeReference });
    h.setReading(nextReading);
    const capture = vi.spyOn(advicePreferenceAdapter, 'captureHopAdvicePreference');

    await expect(controller.preferAdvice(request)).rejects.toMatchObject({ code: 'staleRevision' });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(h.preferenceReceived).not.toHaveBeenCalled();
    expect(h.qualifiedStudies.appendCalls).toBe(0);
    expect((await h.stored()).qualifiedStudyPreferenceCommands).toBeUndefined();
  });
  it('refuse une lecture active changée pendant l’inspection sans relire le workspace', async () => {
    const h = await makeHarness({ scopeArchive: true, question: q09Question });
    const controller = createHopV55QualifiedAdviceController(h.host);
    const preparation = await controller.prepareAdvice({ action: { kind: 'exploreStrategies', situation: {
      stage: 'planning', program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [],
    } }, explicitFutureStage: { kind: 'futureExploration', stage: 'planning', basis: 'Exploration future de fixture.' } });
    const nextReading = createHopV55DecisionReadingArchiveV2({ id: 'reading:q09-controller-active-changed', ownerKey, workspaceId,
      recordedAt: '2026-10-03T21:15:00.000Z', reading: h.reading, source: h.source, runtimeReference: h.runtimeReference });
    const originalWorkspace = h.host.workspace;
    let workspaceReads = 0;
    h.host.workspace = async () => { workspaceReads++; return originalWorkspace(); };
    const originalContext = h.host.context;
    h.host.context = async () => { const current = await originalContext(); h.setReading(nextReading); return current; };

    const result = await controller.freshness({ preparation, phase: 'beforeCreate' });
    expect(result).toMatchObject({ status: 'historical' });
    expect(workspaceReads).toBe(1);
    expect((await h.stored()).qualifiedStudyPreparations).toEqual([preparation]);
    expect(h.qualifiedStudies.createCalls).toBe(0);
  });
  it('réutilise l’assemblage pur dans la même opération si source/runtime/action et entrées restent exacts', async () => {
    const h = await makeHarness({ scopeArchive: true, question: q09Question });
    const workspace = await h.rawRepository.read(ownerKey, workspaceId);
    if (!workspace) throw new Error('Workspace exact attendu.');
    const input = {
      workspace, ownerKey, workspaceId, sourceReadingReference: h.archive.contentReference,
      expectedRuntimeReference: h.runtimeReference,
      sourceContext: h.host.sourceContext(h.context, h.prepared, workspace),
      prepared: h.prepared,
      action: { kind: 'exploreStrategies' as const, situation: {
        stage: 'planning' as const, program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [],
      } },
      explicitFutureStage: { kind: 'futureExploration' as const, stage: 'planning' as const, basis: 'Session de test explicite.' },
      catalogueInput: { saved: { varieties: structuredClone(h.context.hopIndex?.varieties ?? []), lots: [] } },
    };
    const loader = vi.spyOn(catalogueLoader, 'loadHopCatalogueQualificationInput');
    let closedSession: import('../../src/services/hopV55/qualifiedStudyPreparation').HopV55QualifiedAdvicePreparationSessionV1 | undefined;
    await withHopV55QualifiedAdvicePreparationSession(async session => {
      closedSession = session;
      const first = await session.inspect(input);
      const identical = await session.inspect(input);
      expect(first.status).toBe('ready');
      expect(identical).toEqual(first);
      expect(loader).toHaveBeenCalledTimes(1);

      // A valid append-only preference advances the workspace revision, but it does not change
      // the inputs to catalogue assembly. The surrounding call still rechecks the fresh workspace.
      const stagedStudy = qualifiedAdviceDomain.answerQualifiedHopAdvice(h.fixture);
      const stagedDossierId = 'dossier:q09-assembly-cache';
      const stagedPreparation = createHopV55QualifiedStudyPreparationV1({
        id: 'preparation:q09-assembly-cache', ownerKey, workspaceId,
        sourceReadingReference: h.archive.contentReference, preparedReference: 'prepared:q09-assembly-cache',
        createCommand: { kind: 'advice', ownerKey, dossierId: stagedDossierId,
          eventId: 'study-saved:q09-assembly-cache', recordedAt, study: stagedStudy },
      });
      const stagedOption = stagedStudy.responseSnapshot.result.options[0];
      if (!stagedOption) throw new Error('Une option de préférence exacte est requise.');
      const stagedEvent = advicePreferenceAdapter.captureHopAdvicePreference({
        identity: { ownerKey, dossierId: stagedDossierId, eventId: 'preference-event:q09-assembly-cache',
          expectedRevision: 1, recordedAt },
        study: stagedStudy, currentStudy: stagedStudy,
        qualificationInput: stagedStudy.requestSnapshot.qualificationInput,
        preferenceId: 'preference:q09-assembly-cache', optionId: stagedOption.id,
        reason: 'Préférence de fixture append-only; source et données de conseil inchangées.',
      });
      const stagedCommand = createHopV55QualifiedStudyPreferenceCommandV1({ preparation: stagedPreparation, event: stagedEvent });
      const preferenceRevision = { ...input, workspace: { ...input.workspace,
        revision: input.workspace.revision + 1, qualifiedStudyPreferenceCommands: [stagedCommand] } };
      const afterPreferenceAppend = await session.inspect(preferenceRevision);
      expect(afterPreferenceAppend).toEqual(first);
      expect(loader).toHaveBeenCalledTimes(1);

      const savedVarieties = input.catalogueInput.saved?.varieties;
      if (!savedVarieties?.length) throw new Error('Variétés sauvegardées de la fixture attendues.');
      savedVarieties[0].name += ' · modifié après capture';
      const mutated = await session.inspect(preferenceRevision);
      expect(mutated.status).toBe('ready');
      expect(loader).toHaveBeenCalledTimes(2);
      if (first.status !== 'ready' || mutated.status !== 'ready') throw new Error('Lectures d’inspection attendues.');
      expect(mutated.qualificationInputReference).not.toBe(first.qualificationInputReference);

      const changedAction = { ...preferenceRevision,
        action: { ...preferenceRevision.action, situation: { ...preferenceRevision.action.situation,
          materialIds: [h.candidate.id] } } };
      const changedActionResult = await session.inspect(changedAction);
      expect(changedActionResult.status).toBe('ready');
      expect(loader).toHaveBeenCalledTimes(3);

      const wrongOwner = await session.inspect({ ...changedAction, ownerKey: 'foreign-owner' });
      expect(wrongOwner).toMatchObject({ status: 'refused', code: 'invalidWorkspace' });
      const wrongSource = await session.inspect({ ...changedAction, sourceReadingReference: 'reading:absente' });
      expect(wrongSource).toMatchObject({ status: 'refused', code: 'sourceReadingMissing' });
      const staleRuntime = await session.inspect({ ...changedAction, expectedRuntimeReference: 'runtime:stale' });
      expect(staleRuntime).toMatchObject({ status: 'refused', code: 'runtimeReferenceStale' });
      expect(loader).toHaveBeenCalledTimes(3);
    });
    expect(() => closedSession!.inspect(input)).toThrow(/fermée/);

    const separateOperation = await withHopV55QualifiedAdvicePreparationSession(session => session.inspect(input));
    expect(separateOperation.status).toBe('ready');
    expect(loader).toHaveBeenCalledTimes(4);
  });
});
