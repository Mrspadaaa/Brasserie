import { describe, expect, it } from 'vitest';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { createHopAdviceDossier, applyHopAdviceEvent, hopAdviceEventContentReference,
  readHopAdviceEvent, type CreateHopAdviceDossierInput, type HopAdviceDossierV3,
  type HopAdviceEventRead, type HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import { answerQualifiedHopAdvice } from '../../src/domain/hopDecision/qualifiedAdvice';
import { captureHopAdvicePreference } from '../../src/domain/hopDecision/adviceProgramAdapter';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopAdviceJourneyFixture } from '../fixtures/hopAdviceJourney';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QualifiedStudyPreparationV1, saveHopV55QualifiedStudy,
  type HopV55QualifiedStudyPreparationV1 } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import { appendHopV55QualifiedStudyPreference, appendHopV55QualifiedStudyPreferenceCommand,
  createHopV55QualifiedStudyPreferenceCommandV1 } from '../../src/services/hopV55/qualifiedStudyPreference';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown) { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
  ]); }
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

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
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
  close() { /* Memory fixture only. */ }
}

class MemoryAdviceRepository implements HopDecisionLocalRepository {
  dossiers = new Map<string, HopAdviceDossierV3>();
  events = new Map<string, HopAdviceEventV3[]>();
  createCalls = 0;
  appendCalls = 0;
  failAfterAppendOnce = false;
  private key(owner: string, dossierId: string) { return `${owner}\0${dossierId}`; }
  async create(input: Parameters<HopDecisionLocalRepository['create']>[0]) {
    if (!('formatVersion' in input.study) || input.study.formatVersion !== 3) throw new Error('Étude conseil V3 attendue.');
    this.createCalls++;
    const created = createHopAdviceDossier(input as CreateHopAdviceDossierInput);
    const key = this.key(input.ownerKey, input.dossierId);
    const prior = this.dossiers.get(key);
    const priorEvent = this.events.get(key)?.[0];
    if (prior && priorEvent) return { status: 'duplicate' as const, dossier: prior, event: priorEvent };
    this.dossiers.set(key, created.dossier);
    this.events.set(key, [created.event]);
    return { status: 'created' as const, dossier: created.dossier, event: created.event };
  }
  async append(input: Parameters<HopDecisionLocalRepository['append']>[0]) {
    this.appendCalls++;
    const read = readHopAdviceEvent(input.event);
    if ('status' in read) throw new Error('Événement V3 requis.');
    const key = this.key(input.ownerKey, input.dossierId);
    const current = this.dossiers.get(key);
    const priorEvents = this.events.get(key);
    if (!current || !priorEvents) throw Object.assign(new Error('Dossier absent.'), { code: 'notFound' });
    const existing = priorEvents.find(row => row.eventId === read.eventId);
    if (existing) {
      if (hopAdviceEventContentReference(existing) !== hopAdviceEventContentReference(read)
        || JSON.stringify(existing) !== JSON.stringify(read)) {
        throw Object.assign(new Error('EventId déjà utilisé avec un autre contenu.'), { code: 'eventIdConflict' });
      }
      return { status: 'duplicate' as const, dossier: current, event: existing };
    }
    const next = applyHopAdviceEvent(current, read, priorEvents);
    priorEvents.push(structuredClone(read));
    this.dossiers.set(key, next);
    if (this.failAfterAppendOnce) {
      this.failAfterAppendOnce = false;
      throw new Error('Réponse perdue après commit append de fixture.');
    }
    return { status: 'appended' as const, dossier: next, event: read };
  }
  async read(ownerKey: string, dossierId: string) { return this.dossiers.get(this.key(ownerKey, dossierId)) ?? null; }
  async list(ownerKey: string) { return [...this.dossiers.values()].filter(row => row.ownerKey === ownerKey); }
  async readEvents(ownerKey: string, dossierId: string): Promise<HopAdviceEventRead[]> {
    const rows = this.events.get(this.key(ownerKey, dossierId));
    if (!rows) throw Object.assign(new Error('Dossier absent.'), { code: 'notFound' });
    return structuredClone(rows);
  }
  close() { /* Memory fixture only. */ }
}

function journey() {
  const ownerKey = 'owner-q09-preference-stage';
  const workspaceId = 'workspace-q09-preference-stage';
  const fixture = makeHopAdviceJourneyFixture('planning');
  const study = answerQualifiedHopAdvice(fixture);
  const context = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
  const reading = readHopV55Question(fixture.intent.originalQuestion, context);
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading-q09-preference-stage', ownerKey, workspaceId,
    recordedAt: '2026-10-03T14:00:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: 'runtime-q09-preference-stage' });
  const dossierId = 'dossier-q09-preference-stage';
  const studySavedEventId = 'study-saved-q09-preference-stage';
  const recordedAt = '2026-10-03T14:01:00.000Z';
  const preparation = createHopV55QualifiedStudyPreparationV1({ id: 'preparation-q09-preference-stage', ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, preparedReference: 'prepared-q09-preference-stage',
    createCommand: { kind: 'advice', ownerKey, dossierId, eventId: studySavedEventId, recordedAt, study } });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Préférence stratégie synthétique', intent: { question: fixture.intent.originalQuestion, criteria: [] },
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-03T14:00:00.000Z' };
  const option = study.responseSnapshot.result.options[0];
  if (!option) throw new Error('Une option stratégique exacte est requise.');
  const captured = captureHopAdvicePreference({ identity: { ownerKey, dossierId, eventId: 'preference-event-q09',
    expectedRevision: 1, recordedAt: '2026-10-03T14:02:00.000Z' }, study, currentStudy: study,
    qualificationInput: fixture.qualificationInput, preferenceId: 'preference-id-q09', optionId: option.id,
    reason: 'Choix explicite de fixture pour tester le staging local; aucun dosage ni changement de programme.' });
  const command = createHopV55QualifiedStudyPreferenceCommandV1({ preparation, event: captured });
  const database = new MemoryWorkspaceDatabase();
  const workspaces = createHopV55WorkspaceRepository({ ownerKey, database });
  const repository = new MemoryAdviceRepository();
  return { ownerKey, workspaceId, workspace, archive, fixture, study, option, preparation, command, database, workspaces, repository };
}

async function saveStudy(row: ReturnType<typeof journey>) {
  await row.workspaces.save(row.workspace, null);
  return saveHopV55QualifiedStudy({ workspaces: row.workspaces, qualifiedStudies: row.repository,
    preparation: row.preparation, validateFreshness: async () => ({ status: 'current' }) });
}

describe('Staging CAS et append idempotent de strategyPreferred Q09', () => {
  it('stages first, appends one exact V3 event without creating a second workspace link, then recovers it verbatim', async () => {
    const row = journey();
    const studySaved = await saveStudy(row);
    const calls: string[] = [];
    const result = await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async ({ phase }) => { calls.push(phase); return { status: 'current' }; } });

    expect(result.status).toBe('appended');
    expect(result.repositoryStatus).toBe('appended');
    expect(result.eventAdvice3).toEqual(row.command.event);
    expect(result.eventAdvice3.payload).toMatchObject({ preferenceId: 'preference-id-q09',
      studyReference: row.study.reference, optionId: row.option.id, optionReference: row.option.reference,
      reason: 'Choix explicite de fixture pour tester le staging local; aucun dosage ni changement de programme.' });
    expect(result.dossierAdvice3.revision).toBe(2);
    expect(result.dossierAdvice3.state).toBe('strategyPreferred');
    expect(result.eventsAdvice3).toHaveLength(2);
    expect(calls).toEqual(['beforeStage', 'beforeAppend']);

    const staged = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(staged?.qualifiedStudyPreferenceCommands).toEqual([row.command]);
    expect(staged?.qualifiedStudyLinks).toEqual([studySaved.link]);
    expect(staged?.revision).toBe(studySaved.workspace.revision + 1);
    const retryCalls: string[] = [];
    const retry = await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async ({ phase }) => { retryCalls.push(phase); return { status: 'historical', reason: 'Lecture source conservée pour son archive exacte.' }; } });
    expect(retry.status).toBe('recoveredHistorical');
    expect(retry.repositoryStatus).toBe('duplicate');
    expect(retry.freshContext).toEqual({ status: 'historical', reason: 'Lecture source conservée pour son archive exacte.' });
    expect(retry.eventAdvice3).toEqual(result.eventAdvice3);
    expect(retry.eventsAdvice3).toEqual(result.eventsAdvice3);
    expect(retryCalls).toEqual(['alreadyAppended']);
    expect(row.repository.appendCalls).toBe(1);
    expect(row.repository.createCalls).toBe(1);
    expect((await row.workspaces.read(row.ownerKey, row.workspaceId))?.revision).toBe(staged?.revision);
  });

  it('refuse une fraîcheur historique avant staging sans écrire commande ni événement', async () => {
    const row = journey();
    await saveStudy(row);
    await expect(appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'historical', reason: 'Le contexte a changé avant le geste.' }) }))
      .rejects.toMatchObject({ code: 'staleRevision' });
    const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(workspace?.qualifiedStudyPreferenceCommands).toBeUndefined();
    expect(workspace?.qualifiedStudyLinks).toHaveLength(1);
    expect((await row.repository.readEvents(row.ownerKey, row.preparation.dossierId)).map(event => event.kind)).toEqual(['studySaved']);
    expect(row.repository.appendCalls).toBe(0);
  });

  it('conserve le staging durable après refus de fraîcheur; une autre tentative réutilise le même event, sans recapture', async () => {
    const row = journey();
    await saveStudy(row);
    const phases: string[] = [];
    await expect(appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async ({ phase }) => {
        phases.push(phase);
        return phase === 'beforeStage' ? { status: 'current' } : { status: 'historical', reason: 'Lecture en archive, append suspendu.' };
      } })).rejects.toMatchObject({ code: 'staleRevision' });
    const staged = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(staged?.qualifiedStudyPreferenceCommands).toEqual([row.command]);
    expect(row.repository.appendCalls).toBe(0);

    const recovered = await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) });
    expect(recovered.status).toBe('appended');
    expect(recovered.eventAdvice3).toEqual(row.command.event);
    expect(row.repository.appendCalls).toBe(1);
    expect(phases).toEqual(['beforeStage', 'beforeAppend']);
  });

  it('reprend après append commis dont le résultat est perdu, en relisant l’event exact au lieu de le reconstruire', async () => {
    const row = journey();
    await saveStudy(row);
    row.repository.failAfterAppendOnce = true;
    await expect(appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) }))
      .rejects.toThrow('Réponse perdue après commit append de fixture.');
    expect(row.repository.appendCalls).toBe(1);
    const retry = await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) });
    expect(retry.status).toBe('alreadyAppended');
    expect(retry.repositoryStatus).toBe('duplicate');
    expect(retry.eventAdvice3).toEqual(row.command.event);
    expect(row.repository.appendCalls).toBe(1);
  });

  it('refuse eventId/preferenceId réutilisés sous un autre contenu et garde le lien Q09 existant', async () => {
    const row = journey();
    const studySaved = await saveStudy(row);
    const opened = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!opened) throw new Error('Workspace de staging attendu.');
    await row.workspaces.save(appendHopV55QualifiedStudyPreferenceCommand(opened, row.command), opened.revision);
    const changedEvent = captureHopAdvicePreference({ identity: { ownerKey: row.ownerKey, dossierId: row.preparation.dossierId,
      eventId: row.command.event.eventId, expectedRevision: 1, recordedAt: '2026-10-03T14:03:00.000Z' }, study: row.study,
      currentStudy: row.study, qualificationInput: row.fixture.qualificationInput,
      preferenceId: row.command.preferenceId, optionId: row.option.id, reason: 'Autre payload sous le même eventId.' });
    const changedCommand = createHopV55QualifiedStudyPreferenceCommandV1({ preparation: row.preparation, event: changedEvent });
    await expect(appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: changedCommand, validateFreshness: async () => ({ status: 'current' }) }))
      .rejects.toMatchObject({ code: 'eventConflict' });
    await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) });
    const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(workspace?.qualifiedStudyLinks).toEqual([studySaved.link]);
    expect(workspace?.qualifiedStudyPreferenceCommands).toEqual([row.command]);
    const reusedPreferenceId = createHopV55QualifiedStudyPreferenceCommandV1({ preparation: row.preparation,
      event: captureHopAdvicePreference({ identity: { ownerKey: row.ownerKey, dossierId: row.preparation.dossierId,
        eventId: 'different-event-same-preference', expectedRevision: 1, recordedAt: '2026-10-03T14:04:00.000Z' },
        study: row.study, currentStudy: row.study, qualificationInput: row.fixture.qualificationInput,
        preferenceId: row.command.preferenceId, optionId: row.option.id, reason: row.command.event.payload.reason }) });
    await expect(appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: reusedPreferenceId, validateFreshness: async () => ({ status: 'current' }) }))
      .rejects.toMatchObject({ code: 'eventConflict' });
    expect(row.repository.createCalls).toBe(1);
    expect(row.repository.appendCalls).toBe(1);
  });

  it('garde une commande de révision périmée durable, mais n’écrit pas strategyPreferred sous une autre révision', async () => {
    const row = journey();
    await saveStudy(row);
    const staleEvent = captureHopAdvicePreference({ identity: { ownerKey: row.ownerKey, dossierId: row.preparation.dossierId,
      eventId: 'preference-event-stale', expectedRevision: 2, recordedAt: '2026-10-03T14:05:00.000Z' },
      study: row.study, currentStudy: row.study, qualificationInput: row.fixture.qualificationInput,
      preferenceId: 'preference-id-stale', optionId: row.option.id, reason: 'Révision explicitement périmée de fixture.' });
    const staleCommand = createHopV55QualifiedStudyPreferenceCommandV1({ preparation: row.preparation, event: staleEvent });
    await expect(appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: staleCommand, validateFreshness: async () => ({ status: 'current' }) })).rejects.toMatchObject({ code: 'staleRevision' });
    const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(workspace?.qualifiedStudyPreferenceCommands).toEqual([staleCommand]);
    expect((await row.repository.readEvents(row.ownerKey, row.preparation.dossierId)).map(event => event.kind)).toEqual(['studySaved']);
    expect(row.repository.appendCalls).toBe(0);
  });

  it('préserve une commande V99 déjà stockée et interdit le writer V1 sur la même lecture', async () => {
    const row = journey();
    const created = await saveStudy(row);
    const prior = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!prior) throw new Error('Workspace de préférence sauvegardé attendu.');
    const future = { format: 'hop-v55-qualified-study-preference-command-v99', id: 'future-preference-v99',
      ownerKey: row.ownerKey, workspaceId: row.workspaceId, sourceReadingReference: row.preparation.sourceReadingReference,
      payload: { exact: ['v99', undefined, null] } };
    const dbRow: HopV55WorkspaceEnvelopeV1 = { format: 'hop-v55-workspace-envelope-v1', ownerKey: row.ownerKey,
      workspaceId: row.workspaceId, revision: prior.revision + 1,
      workspace: { ...prior, revision: prior.revision + 1, qualifiedStudyPreferenceCommands: [future] } };
    row.database.workspaces.rows.set(JSON.stringify([row.ownerKey, row.workspaceId]), structuredClone(dbRow));
    const reloaded = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!reloaded) throw new Error('Workspace historique rechargé attendu.');
    expect(reloaded.qualifiedStudyPreferenceCommands?.[0]).toEqual(future);
    const unrelated = await row.workspaces.save({ ...reloaded, title: 'Autre édition conservée' }, reloaded.revision);
    expect(unrelated.qualifiedStudyPreferenceCommands?.[0]).toEqual(future);
    expect(unrelated.qualifiedStudyLinks).toEqual([created.link]);
    expect(() => appendHopV55QualifiedStudyPreferenceCommand(unrelated, row.command)).toThrow(/future|lecture/i);
  });

  it('refuse un staging sans le CAS préalable du lien d’étude conseil V3', async () => {
    const row = journey();
    await row.workspaces.save(row.workspace, null);
    const current = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!current) throw new Error('Workspace ouvert attendu.');
    expect(() => appendHopV55QualifiedStudyPreferenceCommand(current, row.command)).toThrow(/étude conseil V3 liée/i);
  });
});
