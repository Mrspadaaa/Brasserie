import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import * as decisionService from '../../src/services/hopV55/decision';
import {
  createHopV55DecisionReadingArchiveV3,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource,
} from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord, readHopV55DocumentaryDossierRecord } from '../../src/services/hopV55/documentaryRecords';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import {
  createHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import {
  createHopV55PropertyAdviceControllerV4,
  type HopV55PropertyAdviceHostV4,
  type HopV55PropertyAdviceV4Command,
  type HopV55PropertyAdviceV4Pending,
} from '../../src/services/hopV55/propertyAdviceControllerV4';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';

const ownerKey = 'fixture:property-advice-controller-v4-owner';
const workspaceId = 'workspace:property-advice-controller-v4';
const recordedAt = '2026-10-03T20:10:00.000Z';
const question = 'Ma bière est trop sucrée, comment compenser ça avec mon houblon ? Quand avec ma levure utiliser les houblons et lesquels ?';
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
  close() { /* DAO mémoire de test. */ }
}

function baseJourney() {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const scoped = readHopV55QuestionWithScopesV1(question, prepared);
  if (!scoped.reading.response || scoped.scopeDrafts.length !== 2) {
    throw Error('La fixture exige une lecture structurée et ses deux portées documentaires.');
  }
  const source: HopV55DecisionReadingSource = context.recipe?.id
    ? { kind: 'recipe', id: context.recipe.id } : { kind: 'exploration' };
  const runtimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
  const transition = { actId: 'scope-controller-v4-create', kind: 'create' as const,
    reason: 'Portées présentes dans la fixture V3.', recordedAt,
    actor: { origin: 'proposal' as const, label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading: scoped.reading,
    scopeDrafts: scoped.scopeDrafts, transition });
  const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:controller-v4-source', ownerKey, workspaceId,
    recordedAt, reading: scoped.reading, source, runtimeReference, scopeLedger, transition });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: scoped.reading, prepared,
    requestId: 'request:controller-v4-source', ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, candidatePolicy });
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestSnapshot);
  const sourceRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot,
    answerRecordId: 'answer:controller-v4-source' });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Parcours V4 synthétique', intent: structuredClone(archive.reading.intent),
    ...(context.recipe?.id ? { sourceRecipeId: context.recipe.id } : {}),
    decisionReadings: [archive], documentaryAnswers: [sourceRecord], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: recordedAt,
  };
  return { context, prepared, reading: scoped.reading, scopeDrafts: scoped.scopeDrafts, runtimeReference,
    archive, sourceRecord, workspace };
}

function makeArchiveV3(base: ReturnType<typeof baseJourney>, id: string, actId: string, at: string) {
  const transition = { actId, kind: 'create' as const, reason: 'Nouvelle archive de fixture.', recordedAt: at,
    actor: { origin: 'user' as const, label: 'Brasseur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading: base.reading,
    scopeDrafts: base.scopeDrafts, transition });
  return createHopV55DecisionReadingArchiveV3({ id, ownerKey, workspaceId, recordedAt: at,
    reading: base.reading, source: base.archive.source, runtimeReference: base.runtimeReference, scopeLedger, transition });
}

type SaveMode = 'normal' | 'staleOnce' | 'commitThenLoseReply';

async function makeHarness(base = baseJourney()) {
  const database = new MemoryDatabase();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database });
  const initialWorkspace = await repository.save(structuredClone(base.workspace), null);
  let activeArchive: HopV55DecisionReadingArchive = base.archive;
  let historical = false;
  let saveMode: SaveMode = 'normal';
  let concurrentWrite = 0;
  const save = vi.fn(async (next: HopV55Workspace) => {
    const observed = await repository.read(ownerKey, next.id);
    if (!observed) throw Error('Le workspace fixture a disparu avant la sauvegarde.');
    if (saveMode === 'staleOnce') {
      saveMode = 'normal'; concurrentWrite++;
      await repository.save({ ...observed, title: `Écriture concurrente ${concurrentWrite}`,
        updatedAt: `2026-10-03T20:1${concurrentWrite}:00.000Z` }, observed.revision);
      return repository.save(next, observed.revision);
    }
    if (saveMode === 'commitThenLoseReply') {
      saveMode = 'normal';
      await repository.save(next, observed.revision);
      throw Error('Réponse réseau perdue après commit fixture.');
    }
    return repository.save(next, observed.revision);
  });
  const selected = vi.fn((_record: HopV55PropertyAdviceAnswerRecordV4, _workspace: HopV55Workspace, _historical: boolean) => undefined);
  const activated = vi.fn((_archive: HopV55DecisionReadingArchive, _record: HopV55PropertyAdviceAnswerRecordV4,
    _workspace: HopV55Workspace) => undefined);
  const pending = new Map<string, HopV55PropertyAdviceV4Pending>();
  const host: HopV55PropertyAdviceHostV4 = {
    services: { ownerKey, scope: 'fixture' },
    enabled: () => true,
    historical: () => historical,
    reading: () => structuredClone(activeArchive),
    context: async () => structuredClone(base.context),
    workspace: async () => {
      const workspace = await repository.read(ownerKey, workspaceId);
      if (!workspace) throw Error('Le workspace fixture a disparu.');
      return workspace;
    },
    save,
    source: workspace => workspace.sourceRecipeId ? { kind: 'recipe', id: workspace.sourceRecipeId } : { kind: 'exploration' },
    runtimeReference: (prepared: PreparedBrewingScenarioContext) => hopV55ScenarioRuntimeReference(prepared.runtime),
    adoptedIdentity: () => null,
    pending,
    selected,
    activated,
  };
  return {
    ...base, database, repository, host, save, selected, activated, pending, initialWorkspace,
    setArchive(value: HopV55DecisionReadingArchive) { activeArchive = structuredClone(value); },
    setHistorical(value: boolean) { historical = value; },
    setSaveMode(value: SaveMode) { saveMode = value; },
    async stored() {
      const workspace = await repository.read(ownerKey, workspaceId);
      if (!workspace) throw Error('Le workspace fixture a disparu.');
      return workspace;
    },
  };
}

function correctCommand(record: HopV55PropertyAdviceAnswerRecordV4, commandId: string,
  actions: HopV55PropertyAdviceV4Command['actions'] = [],
  readingContext: HopV55PropertyAdviceV4Command['readingContext'] = record.readingContext): HopV55PropertyAdviceV4Command {
  return { commandId, expectedRecordReference: record.reference, expectedLedgerReference: record.ledger.reference,
    actions, readingContext: structuredClone(readingContext), reason: `Correction fixture ${commandId}.` };
}

async function upgrade(harness: Awaited<ReturnType<typeof makeHarness>>, commandId = 'act:upgrade-v4') {
  const controller = createHopV55PropertyAdviceControllerV4(harness.host);
  return { controller, record: await controller.upgradeV3(harness.sourceRecord.reference, commandId, 'Upgrade explicite de fixture.') };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('contrôleur V4 du conseil documentaire — archive V3, ledger et reprises', () => {
  it('promote une archive V3 stricte à travers un CAS concurrent sans reparsing ni rebâtir', async () => {
    const h = await makeHarness();
    expect(readHopV55DecisionReadingArchive(h.archive)).toMatchObject({ status: 'available', archive: { format: 'hop-v55-decision-reading-v3' } });
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    h.setSaveMode('staleOnce');
    const { record } = await upgrade(h);

    expect(record.format).toBe('hop-v55-documentary-answer-record-v4');
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(2);
    const saved = await h.stored();
    expect(saved.revision).toBe(h.initialWorkspace.revision + 2);
    expect(saved.title).toBe('Écriture concurrente 1');
    expect(saved.decisionReadings).toEqual([h.archive]);
    expect(saved.documentaryAnswers?.map(row => row.reference)).toEqual([h.sourceRecord.reference, record.reference]);
    expect(readHopV55PropertyAdviceAnswerRecordV4(saved.documentaryAnswers?.[1])).toMatchObject({
      status: 'readOnly', record: { sourceReadingReference: h.archive.contentReference, transition: { actId: 'act:upgrade-v4', kind: 'upgradeV3' } },
    });
    expect(h.selected.mock.calls.at(-1)?.[2]).toBe(false);
  });

  it('garde allRejected comme tête sans fallback V3 et restaure uniquement depuis une nouvelle entrée du ledger', async () => {
    const h = await makeHarness();
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const { controller, record: upgraded } = await upgrade(h);
    expect(builder).toHaveBeenCalledTimes(1);
    builder.mockClear();

    const rejectAll = upgraded.ledger.sourceAnnotations.map(annotation => ({ kind: 'reject' as const,
      annotationId: annotation.id, reason: 'Non retenue dans cette correction explicite.' }));
    const allRejected = await controller.correct(correctCommand(upgraded, 'act:reject-all-v4', rejectAll));
    expect(allRejected.outcome).toEqual({ kind: 'allRejected' });
    expect(builder).not.toHaveBeenCalled();
    expect(readHopV55DocumentaryAnswerRecord((await h.stored()).documentaryAnswers?.at(-1)))
      .toMatchObject({ status: 'readOnly', version: 'v4', record: { outcome: { kind: 'allRejected' } } });
    await expect(controller.upgradeV3(h.sourceRecord.reference, 'act:old-v3-fallback', 'Ancienne tête V3 interdite.'))
      .rejects.toThrow(/tête exacte|lecture courante/iu);
    expect(builder).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();

    const rejectedAnnotation = allRejected.ledger.sourceAnnotations[0];
    if (!rejectedAnnotation) throw new Error('Une annotation de fixture doit être disponible pour restauration.');
    const activeIntent: HopPropertyAdviceIntentV3 = { ...structuredClone(rejectedAnnotation), interpretationOrigin: 'user' };
    const restored = await controller.correct(correctCommand(allRejected, 'act:restore-v4', [{ kind: 'restore',
      annotationId: rejectedAnnotation.id, activeIntent, reason: 'Restauration explicite depuis l’historique du ledger.' }]));
    expect(restored.outcome.kind).toBe('domainAnswer');
    expect(builder).toHaveBeenCalledTimes(1);
    if (restored.outcome.kind !== 'domainAnswer') throw new Error('Réponse attendue après restauration.');
    expect(restored.outcome.answerSnapshot.requestSnapshot.propertyIntents).toEqual([activeIntent]);
    const history = await h.stored();
    expect(history.documentaryAnswers?.[2]).toEqual(allRejected);
    const restoredRead = readHopV55PropertyAdviceAnswerRecordV4(history.documentaryAnswers?.[3]);
    expect(restoredRead.status).toBe('readOnly');
    if (restoredRead.status !== 'readOnly') throw new Error('Record restauré V4 relisible attendu.');
    expect(restoredRead.record.transition.actId).toBe('act:restore-v4');
    expect(restoredRead.record.ledger.sourceAnnotations).toContainEqual(rejectedAnnotation);
    expect(restoredRead.record.ledger.entries.at(-1)).toMatchObject({ annotationId: rejectedAnnotation.id,
      disposition: 'active', decision: { kind: 'restore' }, activeIntent });
  });

  it('régénère le résumé proposal depuis les annotations actives et reprend le reçu sans rebâtir', async () => {
    const h = await makeHarness();
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const { controller, record: upgraded } = await upgrade(h);
    builder.mockClear();
    const proposal = upgraded.ledger.sourceAnnotations.find(annotation => annotation.role === 'investigation');
    if (!proposal) throw new Error('La fixture doit porter une investigation proposée à écarter.');
    const command = correctCommand(upgraded, 'act:reject-proposal-v4', [{ kind: 'reject', annotationId: proposal.id,
      reason: 'Cette piste n’est pas retenue.' }]);
    const parentBefore = structuredClone(upgraded);
    h.setSaveMode('commitThenLoseReply');
    await expect(controller.correct(command)).rejects.toThrow(/Réponse réseau perdue/iu);
    expect(builder).toHaveBeenCalledTimes(1);

    const saved = await h.stored();
    const candidate = saved.documentaryAnswers?.at(-1);
    const read = readHopV55PropertyAdviceAnswerRecordV4(candidate);
    expect(read.status).toBe('readOnly');
    if (read.status !== 'readOnly' || read.record.outcome.kind !== 'domainAnswer') {
      throw new Error('La correction partielle doit rester relisible avec une réponse domaine.');
    }
    expect(read.record.readingContext.interpretation.origin).toBe('proposal');
    expect(read.record.readingContext.interpretation.id).not.toBe(upgraded.readingContext.interpretation.id);
    expect(read.record.readingContext.interpretation.text).not.toMatch(/compenser/iu);
    expect(read.record.outcome.answerSnapshot.requestSnapshot.interpretation).toEqual(read.record.readingContext.interpretation);
    expect(read.record.outcome.answerSnapshot.requestSnapshot.propertyIntents.map(intent => intent.id)).not.toContain(proposal.id);
    expect(saved.documentaryAnswers?.[1]).toEqual(parentBefore);

    const recovered = await controller.correct(command);
    expect(recovered.reference).toBe(read.record.reference);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.selected.mock.calls.at(-1)?.[2]).toBe(false);
  });

  it('refuse une exclusion qui resterait liée à une annotation rejetée sans écrire', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const { controller, record: upgraded } = await upgrade(h);
    builder.mockClear();
    const proposal = upgraded.ledger.sourceAnnotations.find(annotation => annotation.role === 'investigation');
    if (!proposal) throw new Error('La fixture doit porter une investigation proposée à rejeter.');
    const readingContext = structuredClone(upgraded.readingContext);
    readingContext.exclusions = [{ id: 'exclusion:retained-link-v4', intervention: 'changeAroma', certainty: 'certain',
      intentIds: [proposal.id], reason: 'Exclusion fixture liée explicitement à la piste.' }];
    const before = await h.stored();
    await expect(controller.correct(correctCommand(upgraded, 'act:reject-excluded-v4', [{ kind: 'reject', annotationId: proposal.id,
      reason: 'La piste est écartée.' }], readingContext))).rejects.toThrow(/exclusion cite une annotation écartée/iu);
    expect(await h.stored()).toEqual(before);
    expect(h.save).toHaveBeenCalledTimes(1);
    expect(builder).not.toHaveBeenCalled();
  });

  it('réexamine une V4 issue d’une archive V3 en archivant aussi une nouvelle lecture V3 stricte', async () => {
    const h = await makeHarness();
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const { controller, record: upgraded } = await upgrade(h);
    const parentBefore = structuredClone(upgraded);
    builder.mockClear();

    const command = { commandId: 'act:reexamine-v3-source',
      expectedRecordReference: upgraded.reference, expectedLedgerReference: upgraded.ledger.reference,
      reason: 'Réexamen explicite sur la lecture source exacte.' };
    h.setSaveMode('commitThenLoseReply');
    await expect(controller.reexamine(command)).rejects.toThrow(/Réponse réseau perdue/iu);
    expect(builder).toHaveBeenCalledTimes(1);
    const archiveOnly = await h.stored();
    expect(archiveOnly.decisionReadings).toHaveLength(2);
    expect(archiveOnly.documentaryAnswers).toHaveLength(2);
    expect(h.activated).not.toHaveBeenCalled();
    const preparedPending = h.pending.get(command.commandId);
    if (!preparedPending) throw new Error('La correction préparée doit survivre à la perte de réponse après l’archive.');
    const preparedReference = preparedPending.record.reference;
    const reexamined = await controller.reexamine(command);
    expect(reexamined.transition.kind).toBe('reexamine');
    expect(reexamined.transition.parentRecordReference).toBe(upgraded.reference);
    expect(reexamined.reference).toBe(preparedReference);
    expect(reexamined.sourceReadingReference).not.toBe(h.archive.contentReference);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(3); // upgrade, archive V3, answer V4
    const saved = await h.stored();
    expect(saved.documentaryAnswers?.[1]).toEqual(parentBefore);
    expect(saved.documentaryAnswers).toHaveLength(3);
    const archive = saved.decisionReadings?.find(row => row.contentReference === reexamined.sourceReadingReference);
    expect(readHopV55DecisionReadingArchive(archive)).toMatchObject({ status: 'available', archive: {
      format: 'hop-v55-decision-reading-v3', scopeLedger: h.archive.scopeLedger, transition: h.archive.transition,
    } });
    expect(h.activated).toHaveBeenCalledTimes(1);
    expect(h.activated.mock.calls[0]?.[0].contentReference).toBe(reexamined.sourceReadingReference);
  });

  it('récupère un commit après réponse perdue en lecture seule quand B a remplacé la lecture courante A', async () => {
    const h = await makeHarness();
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const { controller, record: upgraded } = await upgrade(h);
    builder.mockClear();

    const archivedB = makeArchiveV3(h, 'reading:controller-v4-current-B', 'scope:controller-v4-current-B', '2026-10-03T20:12:00.000Z');
    const beforeSwitch = await h.stored();
    await h.repository.save({ ...beforeSwitch, decisionReadings: [...(beforeSwitch.decisionReadings ?? []), archivedB] }, beforeSwitch.revision);
    h.setArchive(archivedB);
    const freshUnderB = correctCommand(upgraded, 'act:fresh-source-A-under-B');
    await expect(controller.correct(freshUnderB)).rejects.toThrow(/lecture .* changé/iu);
    expect(builder).not.toHaveBeenCalled();

    h.setArchive(h.archive);
    h.setSaveMode('commitThenLoseReply');
    const command = correctCommand(upgraded, 'act:commit-response-lost-v4');
    await expect(controller.correct(command)).rejects.toThrow(/Réponse réseau perdue/iu);
    expect(builder).toHaveBeenCalledTimes(1);

    h.setArchive(archivedB);
    h.setHistorical(false);
    const committed = (await h.stored()).documentaryAnswers?.find(row => row.format === 'hop-v55-documentary-answer-record-v4'
      && 'transition' in row && row.transition?.actId === command.commandId);
    if (!committed) throw new Error('Le commit doit exister malgré la réponse perdue.');
    const original = structuredClone(committed);

    await expect(controller.correct({ ...command, reason: 'Même ID avec un autre motif.' })).rejects.toThrow(/autre (?:correction|lecture)/iu);
    const recovered = await controller.correct(command);
    expect(recovered.reference).toBe(committed.reference);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.selected.mock.calls.at(-1)?.[0].reference).toBe(committed.reference);
    expect(h.selected.mock.calls.at(-1)?.[2]).toBe(true);
    const afterRecovery = await h.stored();
    expect(afterRecovery.documentaryAnswers?.find(row => row.reference === committed.reference)).toEqual(original);
    expect(afterRecovery.decisionReadings?.at(-1)).toEqual(archivedB);
  });

  it('lie le dossier à la réponse V4 exacte et réutilise le reçu après un CAS concurrent', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
    const { controller, record } = await upgrade(h);
    expect(record.outcome.kind).toBe('domainAnswer');
    if (record.outcome.kind !== 'domainAnswer') throw new Error('Réponse domaine requise pour ce dossier.');
    const strategy = record.outcome.answerSnapshot.strategies[0];
    if (!strategy) throw new Error('La fixture documentaire doit exposer une stratégie pour le dossier.');
    const input = { commandId: 'command:dossier-v4-stable', expectedRecordReference: record.reference,
      expectedLedgerReference: record.ledger.reference, expectedAnswerReference: record.outcome.answerReference,
      expectedInterpretationReference: record.outcome.answerSnapshot.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference, motive: 'Conserver cette voie pour examen.' };
    const savesBeforeDossier = h.save.mock.calls.length;
    h.setSaveMode('staleOnce');
    const builderCalls = builder.mock.calls.length;
    const dossier = await controller.dossier(input);
    expect(builder).toHaveBeenCalledTimes(builderCalls);
    expect(h.save).toHaveBeenCalledTimes(savesBeforeDossier + 2);
    const read = readHopV55DocumentaryDossierRecord((await h.stored()).documentaryDossiers?.[0]);
    expect(read).toMatchObject({ status: 'readOnly', version: 'v4', record: {
      id: input.commandId, answerRecordReference: record.reference, answerReference: record.outcome.answerReference,
      ledgerReference: record.ledger.reference, strategyId: strategy.id,
    } });
    if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-dossier-record-v4') {
      throw new Error('Dossier V4 strict relisible attendu.');
    }
    expect(dossier.reference).toBe(read.record.reference);
    const calls = h.save.mock.calls.length;
    expect(await controller.dossier(input)).toEqual(read.record);
    expect(h.save).toHaveBeenCalledTimes(calls);
    await expect(controller.dossier({ ...input, motive: 'Autre commande cachée sous le même ID.' })).rejects.toThrow(/autre dossier/iu);
  });
});
