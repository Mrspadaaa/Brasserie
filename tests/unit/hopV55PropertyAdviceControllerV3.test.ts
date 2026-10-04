import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopAdviceAssertion } from '../../src/domain/hopDecision/adviceSchema';
import { buildHopPropertyAdvice, buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import * as decisionService from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3,
  readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1,
  type HopV55QuestionScopeTransitionV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55DecisionReadingArchive, HopV55DecisionReadingSource } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import { createHopV55PropertyAdviceAnswerRecord, type HopV55PropertyAdviceAnswerRecordV2 } from '../../src/services/hopV55/propertyAdviceRecords';
import { prepareHopV55PropertyAdviceRequestDraft, reviseHopV55PropertyAdviceRequestDraft } from '../../src/services/hopV55/propertyAdvicePreparation';
import {
  createHopV55PropertyAdviceAnswerRecordV3,
  readHopV55PropertyAdviceAnswerRecordV3,
  readHopV55PropertyAdviceDossierRecordV3,
  type HopV55PropertyAdviceAnswerRecordV3,
} from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55PropertyAdviceControllerV3, type HopV55PropertyAdviceHostV3 } from '../../src/services/hopV55/propertyAdviceControllerV3';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';

const ownerKey = 'fixture:property-advice-controller-v3-owner';
const workspaceId = 'workspace:property-advice-controller-v3';
const question = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’a encore été choisie.' };

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
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
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const snapshot = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
    try { return await work(); }
    catch (error) { this.workspaces.rows = snapshot; throw error; }
  }
  close() { /* Memory-only fixture. */ }
}

function baseJourney() {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(question, prepared);
  if (!reading.response || reading.branches.length) throw Error('La fixture exige une lecture structurée sans branche J5.');
  const source: HopV55DecisionReadingSource = context.recipe?.id
    ? { kind: 'recipe', id: context.recipe.id } : { kind: 'exploration' };
  const runtimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:controller-v3-source', ownerKey, workspaceId,
    recordedAt: '2026-10-03T10:00:00.000Z', reading, source, runtimeReference });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Contrôle V3 synthétique', intent: structuredClone(reading.intent), sourceRecipeId: context.recipe?.id,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-03T10:00:00.000Z' };
  return { context, prepared, reading, source, runtimeReference, archive, workspace };
}

type ControllerJourney = Omit<ReturnType<typeof baseJourney>, 'archive' | 'workspace'> & {
  archive: HopV55DecisionReadingArchive;
  workspace: HopV55Workspace;
};

async function makeHarness(base: ControllerJourney = baseJourney(), answers: HopV55Workspace['documentaryAnswers'] = []) {
  const database = new MemoryDatabase();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database });
  const initialWorkspace = await repository.save({ ...structuredClone(base.workspace), documentaryAnswers: structuredClone(answers) }, null);
  let activeArchive: HopV55DecisionReadingArchive | undefined = base.archive;
  let sourceOverride: HopV55DecisionReadingSource | undefined;
  let historical = false;
  let staleSaves = 0;
  let concurrentWrite = 0;
  const save = vi.fn(async (next: HopV55Workspace) => {
    const observed = await repository.read(ownerKey, next.id);
    if (!observed) throw Error('Le workspace fixture a disparu avant la sauvegarde.');
    if (staleSaves > 0) {
      staleSaves--;
      concurrentWrite++;
      await repository.save({ ...observed, title: `Workspace concurrence ${concurrentWrite}`,
        updatedAt: `2026-10-03T10:0${concurrentWrite}:00.000Z` }, observed.revision);
      return repository.save(next, observed.revision);
    }
    return repository.save(next, observed.revision);
  });
  const selected = vi.fn((_record: HopV55PropertyAdviceAnswerRecordV3) => undefined);
  const activated = vi.fn((archive: HopV55DecisionReadingArchive, _record: HopV55PropertyAdviceAnswerRecordV3) => { activeArchive = archive; });
  const host: HopV55PropertyAdviceHostV3 = {
    services: { ownerKey, scope: 'fixture' },
    enabled: () => true,
    historical: () => historical,
    reading: () => activeArchive && structuredClone(activeArchive),
    context: async () => structuredClone(base.context),
    workspace: async () => {
      const workspace = await repository.read(ownerKey, workspaceId);
      if (!workspace) throw Error('Le workspace fixture a disparu.');
      return workspace;
    },
    save,
    source: workspace => sourceOverride ?? (workspace.activeFutureDraftSource ? workspace.activeFutureDraftSource
      : workspace.activeCopyId ? (() => {
        const copy = workspace.copies.find(row => row.id === workspace.activeCopyId);
        return copy ? { kind: 'localRecipeCopy', workspaceId: workspace.id, copyId: copy.id,
          recipeId: copy.recipe.id, recipeReference: 'fixture:copy-reference' } : { kind: 'exploration' };
      })()
        : workspace.sourceBatchId ? { kind: 'batch', id: workspace.sourceBatchId } as HopV55DecisionReadingSource
          : workspace.sourceRecipeId ? { kind: 'recipe', id: workspace.sourceRecipeId } : { kind: 'exploration' }),
    runtimeReference: prepared => hopV55ScenarioRuntimeReference(prepared.runtime),
    selected,
    activated,
  };
  return {
    ...base, database, repository, host, selected, activated, save, initialWorkspace,
    queueStaleSave() { staleSaves++; }, setHistorical(value: boolean) { historical = value; },
    setSource(value: HopV55DecisionReadingSource | undefined) { sourceOverride = value; },
    async stored() {
      const workspace = await repository.read(ownerKey, workspaceId);
      if (!workspace) throw Error('Le workspace fixture a disparu.');
      return workspace;
    },
  };
}

function recordBuilderV2(base: ReturnType<typeof baseJourney>): HopV55PropertyAdviceAnswerRecordV2 {
  const draft = prepareHopV55PropertyAdviceRequestDraft({ reading: base.reading, prepared: base.prepared,
    requestId: 'request:controller-v2-head', ownerKey, workspaceId, sourceReadingReference: base.archive.contentReference, candidatePolicy });
  const revised = reviseHopV55PropertyAdviceRequestDraft({ draft, prepared: base.prepared,
    interpretation: { id: 'interpretation:controller-v2-user', version: 'brasseur-v2',
      text: 'Constat utilisateur conservé; compensation à examiner sans choisir un levier.', origin: 'user' },
    revisionContext: { reason: 'Correction V2 synthétique avant upgrade.', recordedAt: '2026-10-03T10:01:00.000Z',
      recordedBy: { origin: 'user', label: 'Brasseur fixture' } } });
  return createHopV55PropertyAdviceAnswerRecord({ draft: revised, prepared: base.prepared,
    answerSnapshot: buildHopPropertyAdvice(revised.requestSnapshot), answerRecordId: 'answer:controller-v2-head' });
}

function accessAssertion(id: string, scope: 'sampling' | 'bulkBeer' | 'separatePortion', value: boolean): HopAdviceAssertion {
  return { id, subject: scope, statement: `Accès ${scope} déclaré dans la fixture.`, state: 'reported', value, dimension: 'process',
    source: { title: 'Attestation synthétique d’accès', author: 'Brasseur fixture', year: null,
      kind: 'judgment', reference: `fixture://property-advice/${id}` } };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('contrôleur V3 du conseil par propriétés — DAO et archives exactes', () => {
  it('prépare une réponse depuis la lecture V2 réelle et traverse un CAS stale sans rebâtir ni relire la question', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const controller = createHopV55PropertyAdviceControllerV3(h.host);
    h.queueStaleSave();

    const record = await controller.prepare(h.archive, h.prepared);

    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.selected).toHaveBeenCalledTimes(1);
    const workspace = await h.stored();
    expect(workspace.revision).toBe(h.initialWorkspace.revision + 2);
    expect(workspace.title).toBe('Workspace concurrence 1');
    expect(workspace.decisionReadings).toEqual([h.archive]);
    expect(workspace.documentaryAnswers).toHaveLength(1);
    expect(workspace.documentaryDossiers ?? []).toEqual([]);
    expect(workspace.scenarioIds).toEqual([]);
    expect(workspace.copies).toEqual([]);
    const persisted = workspace.documentaryAnswers![0];
    expect(readHopV55PropertyAdviceAnswerRecordV3(persisted)).toMatchObject({
      status: 'readOnly', record: { reference: record.reference, sourceReadingReference: h.archive.contentReference },
    });
    const read = readHopV55DocumentaryAnswerRecord(persisted);
    expect(read).toMatchObject({ status: 'readOnly', record: {
      format: 'hop-v55-documentary-answer-record-v3', id: record.id, reference: record.reference,
      sourceReadingReference: h.archive.contentReference, answerReference: record.answerReference,
    } });
    if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v3') throw Error('Réponse V3 relisible attendue.');
    expect(read.record.answerSnapshot.requestSnapshot.candidatePolicy).toMatchObject({ kind: 'explicit', materialIds: [] });
    expect(read.record.answerSnapshot.requestSnapshot.candidatePolicy.basis).toContain('geste explicite');
    const builderCallsAfterGesture = builder.mock.calls.length;
    const reloaded = readHopV55DocumentaryAnswerRecord(structuredClone(persisted));
    expect(reloaded.status).toBe('readOnly');
    expect(builder).toHaveBeenCalledTimes(builderCallsAfterGesture);
    expect(parser).not.toHaveBeenCalled();
    expect(await h.stored()).toEqual(workspace);
  });

  it('révise l’accès en ajout append-only puis archive un dossier exact avec replay idempotent sous CAS', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const controller = createHopV55PropertyAdviceControllerV3(h.host);
    const original = await controller.prepare(h.archive, h.prepared);
    const sourcePrefix = structuredClone(original);
    expect(builder).toHaveBeenCalledTimes(1);
    const previous = original.answerSnapshot.requestSnapshot;
    const request: HopPropertyAdviceRequestV3 = structuredClone(previous);
    const assertion = accessAssertion('assertion:sampling-access-v3', 'sampling', true);
    request.context.assertions.push(assertion);
    request.context.access.sampling = { state: 'yes', basis: 'Le brasseur confirme un prélèvement distinct pour cet examen.',
      assertionIds: [assertion.id] };

    const update = await controller.reinterpret({ request, reason: 'Préciser explicitement l’accès à un échantillon.',
      expectedAnswerRecordReference: original.reference, expectedAnswerReference: original.answerReference,
      expectedInterpretationReference: original.answerSnapshot.interpretationReference });

    expect(update.kind).toBe('revision');
    if (update.kind !== 'revision') throw Error('Révision attendue.');
    expect(builder).toHaveBeenCalledTimes(2);
    expect(parser).not.toHaveBeenCalled();
    let workspace = await h.stored();
    expect(workspace.documentaryAnswers).toHaveLength(2);
    expect(workspace.documentaryAnswers![0]).toEqual(sourcePrefix);
    const revisedRead = readHopV55DocumentaryAnswerRecord(workspace.documentaryAnswers![1]);
    expect(revisedRead.status).toBe('readOnly');
    if (revisedRead.status !== 'readOnly' || revisedRead.record.format !== 'hop-v55-documentary-answer-record-v3') throw Error('Réponse V3 révisée attendue.');
    const revised = revisedRead.record;
    expect(revised.reference).toBe(update.answerRecordReference);
    expect(revised.revisionContext).toMatchObject({ sourceAnswerRecordReference: original.reference,
      sourceAnswerReference: original.answerReference, reason: 'Préciser explicitement l’accès à un échantillon.' });
    expect(revised.answerSnapshot.requestSnapshot.context.assertions.slice(0, previous.context.assertions.length))
      .toEqual(previous.context.assertions);
    expect(revised.answerSnapshot.requestSnapshot.context.assertions.slice(previous.context.assertions.length)).toEqual([assertion]);
    expect(revised.answerSnapshot.requestSnapshot.context.access.sampling).toEqual({ state: 'yes',
      basis: 'Le brasseur confirme un prélèvement distinct pour cet examen.', assertionIds: [assertion.id] });
    expect(revised.answerSnapshot.requestSnapshot.context.access.bulkBeer).toEqual(previous.context.access.bulkBeer);
    expect(revised.answerSnapshot.requestSnapshot.context.access.separatePortion).toEqual(previous.context.access.separatePortion);

    const strategy = revised.answerSnapshot.strategies[0];
    if (!strategy) throw Error('Une stratégie V3 documentée est nécessaire au dossier.');
    const dossierRequest = { commandId: 'command:dossier-v3-stable', strategyId: strategy.id,
      expectedStrategyReference: strategy.reference, motive: 'Comparer cette voie sans l’appliquer au brassin.',
      expectedAnswerRecordReference: revised.reference, expectedAnswerReference: revised.answerReference,
      expectedInterpretationReference: revised.answerSnapshot.interpretationReference };
    h.queueStaleSave();
    const builderBeforeDossier = builder.mock.calls.length;
    const savedDossier = await controller.dossier(dossierRequest);
    expect(builder).toHaveBeenCalledTimes(builderBeforeDossier);
    workspace = await h.stored();
    expect(workspace.documentaryDossiers).toHaveLength(1);
    const dossierRead = readHopV55PropertyAdviceDossierRecordV3(workspace.documentaryDossiers![0]);
    expect(dossierRead.status).toBe('readOnly');
    if (dossierRead.status !== 'readOnly') throw Error('Dossier V3 relisible attendu.');
    expect(dossierRead.record.dossierSnapshot).toEqual(savedDossier);
    expect(dossierRead.record.answerRecordReference).toBe(revised.reference);
    expect(dossierRead.record.strategyReference).toBe(strategy.reference);
    const revisionAfterFirstDossier = workspace.revision;
    const savesAfterFirstDossier = h.save.mock.calls.length;

    const replay = await controller.dossier(dossierRequest);

    expect(replay).toEqual(savedDossier);
    expect(replay.reference).toBe(savedDossier.reference);
    expect(h.save).toHaveBeenCalledTimes(savesAfterFirstDossier);
    expect((await h.stored()).revision).toBe(revisionAfterFirstDossier);
    expect((await h.stored()).documentaryDossiers).toHaveLength(1);
    expect(builder).toHaveBeenCalledTimes(builderBeforeDossier);
    expect(parser).not.toHaveBeenCalled();
  });

  it('réexamine sur une nouvelle archive en gardant la lecture et la réponse source intactes', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const controller = createHopV55PropertyAdviceControllerV3(h.host);
    const original = await controller.prepare(h.archive, h.prepared);
    const sourcePrefix = structuredClone(original);
    const sourceArchive = structuredClone(h.archive);
    h.queueStaleSave();

    const update = await controller.reexamine(original.id, original.reference);

    expect(update.kind).toBe('reexamination');
    if (update.kind !== 'reexamination') throw Error('Réexamen attendu.');
    expect(builder).toHaveBeenCalledTimes(2);
    expect(parser).not.toHaveBeenCalled();
    expect(h.activated).toHaveBeenCalledTimes(1);
    const workspace = await h.stored();
    expect(workspace.decisionReadings).toHaveLength(2);
    expect(workspace.decisionReadings![0]).toEqual(sourceArchive);
    expect(workspace.documentaryAnswers).toHaveLength(2);
    expect(workspace.documentaryAnswers![0]).toEqual(sourcePrefix);
    const archiveRead = readHopV55DecisionReadingArchive(workspace.decisionReadings![1]);
    expect(archiveRead.status).toBe('available');
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2') throw Error('Nouvelle archive V2 attendue.');
    const activatedArchive = h.activated.mock.calls[0][0];
    expect(archiveRead.archive.contentReference).toBe(activatedArchive.contentReference);
    expect(archiveRead.archive.contentReference).not.toBe(h.archive.contentReference);
    expect(archiveRead.archive.reading.intent.question).toBe(question);
    expect(archiveRead.archive.reading.response).toBeUndefined();
    expect(archiveRead.archive.reading.branches).toEqual([]);
    const updatedRead = readHopV55DocumentaryAnswerRecord(workspace.documentaryAnswers![1]);
    expect(updatedRead.status).toBe('readOnly');
    if (updatedRead.status !== 'readOnly' || updatedRead.record.format !== 'hop-v55-documentary-answer-record-v3') throw Error('Réponse V3 réexaminée attendue.');
    expect(updatedRead.record.sourceReadingReference).toBe(archiveRead.archive.contentReference);
    expect(updatedRead.record.reexaminationContext).toMatchObject({ sourceAnswerRecordReference: original.reference,
      sourceAnswerReference: original.answerReference, sourceReadingReference: original.sourceReadingReference });
    expect(updatedRead.record.answerSnapshot.requestSnapshot.id).not.toBe(original.answerSnapshot.requestSnapshot.id);
    expect(updatedRead.record.answerSnapshot.requestSnapshot.propertyIntents).toEqual(original.answerSnapshot.requestSnapshot.propertyIntents);
    expect(updatedRead.record.answerSnapshot.requestSnapshot.interpretation).toEqual(original.answerSnapshot.requestSnapshot.interpretation);
    expect(workspace.scenarioIds).toEqual([]);
    expect(workspace.copies).toEqual([]);
  });

  it('prépare et réexamine une archive V3 en conservant le ledger scope exact et le stage avant le record', async () => {
    const base = baseJourney();
    const sourceQuestion = 'Je veux plus de tropical. Quand avec ma levure, utiliser au mieux mes houblons et lesquels pour cette neipa ?';
    const scoped = readHopV55QuestionWithScopesV1(sourceQuestion, base.prepared);
    const transition: HopV55QuestionScopeTransitionV1 = { actId: 'act:scope-q09-controller', kind: 'create',
      reason: 'Portées proposées par la lecture synthétique.', recordedAt: '2026-10-03T10:04:00.000Z',
      actor: { origin: 'proposal', label: 'Lecteur fixture' } };
    const scopeLedger = createHopV55QuestionScopeLedgerV1({ question: sourceQuestion, reading: scoped.reading,
      scopeDrafts: scoped.scopeDrafts, transition });
    const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:controller-v3-scope-source', ownerKey, workspaceId,
      recordedAt: transition.recordedAt, reading: scoped.reading, source: base.source, runtimeReference: base.runtimeReference,
      scopeLedger, transition });
    const scopedBase: ControllerJourney = { ...base, reading: scoped.reading, archive,
      workspace: { ...base.workspace, intent: structuredClone(scoped.reading.intent), decisionReadings: [archive] } };
    const h = await makeHarness(scopedBase);
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const controller = createHopV55PropertyAdviceControllerV3(h.host);
    const original = await controller.prepare(archive, base.prepared);
    const sourcePrefix = structuredClone(original);
    const sourceArchive = structuredClone(archive);
    const beforeReexaminationSaves = h.save.mock.calls.length;

    const update = await controller.reexamine(original.id, original.reference);

    expect(update.kind).toBe('reexamination');
    expect(builder).toHaveBeenCalledTimes(2);
    expect(parser).not.toHaveBeenCalled();
    expect(h.activated).toHaveBeenCalledTimes(1);
    const stagedWrites = h.save.mock.calls.slice(beforeReexaminationSaves).map(([workspace]) => workspace);
    expect(stagedWrites.map(workspace => [workspace.decisionReadings?.length, workspace.documentaryAnswers?.length]))
      .toEqual([[2, 1], [2, 2]]);

    const workspace = await h.stored();
    expect(workspace.decisionReadings).toHaveLength(2);
    expect(workspace.decisionReadings![0]).toEqual(sourceArchive);
    expect(workspace.documentaryAnswers).toHaveLength(2);
    expect(workspace.documentaryAnswers![0]).toEqual(sourcePrefix);
    const archiveRead = readHopV55DecisionReadingArchive(workspace.decisionReadings![1]);
    expect(archiveRead.status).toBe('available');
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v3') {
      throw Error('Le réexamen doit garder le format Archive V3.');
    }
    expect(archiveRead.archive.scopeLedger).toEqual(sourceArchive.scopeLedger);
    expect(archiveRead.archive.transition).toEqual(sourceArchive.transition);
    expect(archiveRead.archive.reading.intent).toEqual(sourceArchive.reading.intent);
    expect(archiveRead.archive.reading).not.toHaveProperty('response');
    expect(archiveRead.archive.reading.branches).toEqual([]);
    expect(h.activated.mock.calls[0][0]).toEqual(archiveRead.archive);
    const answerRead = readHopV55DocumentaryAnswerRecord(workspace.documentaryAnswers![1]);
    expect(answerRead.status).toBe('readOnly');
    if (answerRead.status !== 'readOnly' || answerRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw Error('Réponse V3 liée à la lecture successorale attendue.');
    }
    expect(answerRead.record.sourceReadingReference).toBe(archiveRead.archive.contentReference);
    expect(answerRead.record.reexaminationContext).toMatchObject({ sourceAnswerRecordReference: original.reference,
      sourceReadingReference: sourceArchive.contentReference });
    expect(answerRead.record.answerSnapshot.requestSnapshot.propertyIntents).toEqual(original.answerSnapshot.requestSnapshot.propertyIntents);
  });

  it('upgrade V2→V3 ne modifie ni le record V2 ni sa tête et refuse ensuite une vieille référence', async () => {
    const base = baseJourney();
    const sourceV2 = recordBuilderV2(base);
    const h = await makeHarness(base, [sourceV2]);
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const sourcePrefix = structuredClone(sourceV2);
    const interpretation = structuredClone(sourceV2.answerSnapshot.requestSnapshot.interpretation);
    const controller = createHopV55PropertyAdviceControllerV3(h.host);

    const upgraded = await controller.upgrade(sourceV2);

    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(upgraded.format).toBe('hop-v55-documentary-answer-record-v3');
    expect(upgraded.reference).not.toBe(sourceV2.reference);
    expect(upgraded.answerSnapshot.requestSnapshot.id).not.toBe(sourceV2.answerSnapshot.requestSnapshot.id);
    expect(upgraded.sourceReadingReference).toBe(sourceV2.sourceReadingReference);
    expect(upgraded.answerSnapshot.requestSnapshot.originalQuestion).toBe(sourceV2.answerSnapshot.requestSnapshot.originalQuestion);
    expect(upgraded.answerSnapshot.requestSnapshot.interpretation).toEqual(interpretation);
    expect(upgraded.revisionContext).toMatchObject({ sourceAnswerRecordReference: sourceV2.reference,
      sourceAnswerReference: sourceV2.answerReference });
    let workspace = await h.stored();
    expect(workspace.documentaryAnswers).toHaveLength(2);
    expect(workspace.documentaryAnswers![0]).toEqual(sourcePrefix);
    const v2Read = readHopV55DocumentaryAnswerRecord(workspace.documentaryAnswers![0]);
    const v3Read = readHopV55DocumentaryAnswerRecord(workspace.documentaryAnswers![1]);
    expect(v2Read).toMatchObject({ status: 'readOnly', record: { reference: sourceV2.reference } });
    expect(v3Read).toMatchObject({ status: 'readOnly', record: { reference: upgraded.reference } });
    const revision = workspace.revision;
    const writes = h.save.mock.calls.length;

    await expect(controller.upgrade(sourceV2)).rejects.toThrow(/n’est plus la tête/u);

    workspace = await h.stored();
    expect(workspace.documentaryAnswers).toHaveLength(2);
    expect(workspace.documentaryAnswers![0]).toEqual(sourcePrefix);
    expect(workspace.revision).toBe(revision);
    expect(h.save).toHaveBeenCalledTimes(writes);
    expect(builder).toHaveBeenCalledTimes(1);
  });

  it('refuse un lien de lecture absent, une source différente et des références de réponse périmées sans écrire', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const controller = createHopV55PropertyAdviceControllerV3(h.host);
    const unlinked = createHopV55DecisionReadingArchiveV2({ id: 'reading:controller-v3-unlinked', ownerKey, workspaceId,
      recordedAt: '2026-10-03T10:02:00.000Z', reading: h.reading,
      source: h.source, runtimeReference: h.runtimeReference });
    await expect(controller.prepare(unlinked, h.prepared)).rejects.toThrow(/lecture structurée exacte/u);
    h.setSource({ kind: 'exploration' });
    await expect(controller.prepare(h.archive, h.prepared)).rejects.toThrow(/n’appartient plus à la préparation active/u);
    h.setSource(undefined);
    expect(builder).not.toHaveBeenCalled();
    expect((await h.stored()).documentaryAnswers ?? []).toEqual([]);

    const record = await controller.prepare(h.archive, h.prepared);
    const beforeStale = await h.stored();
    const staleRequest: HopV55PropertyAdviceReinterpretRequestV3 = {
      request: structuredClone(record.answerSnapshot.requestSnapshot), reason: 'Révision avec référence périmée.',
      expectedAnswerRecordReference: 'answer:other-head', expectedAnswerReference: record.answerReference,
      expectedInterpretationReference: record.answerSnapshot.interpretationReference,
    };
    const builderCalls = builder.mock.calls.length;
    const writes = h.save.mock.calls.length;
    await expect(controller.reinterpret(staleRequest)).rejects.toThrow(/tête exacte/u);
    expect(builder).toHaveBeenCalledTimes(builderCalls);
    expect(h.save).toHaveBeenCalledTimes(writes);
    expect(await h.stored()).toEqual(beforeStale);
    expect(parser).not.toHaveBeenCalled();
  });
});
