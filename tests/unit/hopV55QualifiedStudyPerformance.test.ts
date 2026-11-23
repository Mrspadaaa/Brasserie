import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { createHopAdviceDossier, applyHopAdviceEvent, createHopAdviceEvent, hopAdviceEventContentReference,
  hopAdvicePreferenceReference, readHopAdviceEvent, type CreateHopAdviceDossierInput, type HopAdviceDossierV3,
  type HopAdviceEventRead, type HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import * as qualifiedAdviceDomain from '../../src/domain/hopDecision/qualifiedAdvice';
import * as catalogueLoader from '../../src/domain/hopDecision/catalogueLoader';
import { captureHopAdvicePreference } from '../../src/domain/hopDecision/adviceProgramAdapter';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopAdviceJourneyFixture } from '../fixtures/hopAdviceJourney';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV4 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';

import { appendHopV55QualifiedStudyAppendOnly, appendHopV55QualifiedStudyPreparationRecord,
  assertHopV55QualifiedStudyWorkspace, captureHopV55QualifiedStudyPreparation,
  createHopV55QualifiedStudyLinkV1, createHopV55QualifiedStudyPreparationV1, createHopV55QualifiedStudyPreparationV2,
  readHopV55QualifiedStudyCollectionsIndexV1, readHopV55QualifiedStudyPreparation, saveHopV55QualifiedStudy,
  type HopV55QualifiedStudyPreparationV1 } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import { appendHopV55QualifiedStudyPreference, assertHopV55QualifiedStudyPreferenceCommands,
  createHopV55QualifiedStudyPreferenceCommandV1, readHopV55QualifiedStudyPreferenceCommand } from '../../src/services/hopV55/qualifiedStudyPreference';
import { HopV55OperationValidationScope, hopV55QualifiedContentReference, sameCanonicalData } from '../../src/services/hopV55/operationScopedQualifiedValidation';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';

// Deterministic cost oracle: count content fingerprints by namespace instead of timing.
const hashStats = vi.hoisted(() => ({ byPrefix: {} as Record<string, number>, q09Depth: 0 }));
vi.mock('../../src/domain/hopDecision/adviceContentReference', async () => {
  const actual = await vi.importActual<typeof import('../../src/domain/hopDecision/adviceContentReference')>(
    '../../src/domain/hopDecision/adviceContentReference');
  return { ...actual, hopAdviceContentReference(prefix: string, value: unknown) {
    if (hashStats.q09Depth === 0) hashStats.byPrefix[prefix] = (hashStats.byPrefix[prefix] ?? 0) + 1;
    return actual.hopAdviceContentReference(prefix, value);
  } };
});
vi.mock('../../src/services/hopV55/operationScopedQualifiedValidation', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/hopV55/operationScopedQualifiedValidation')>(
    '../../src/services/hopV55/operationScopedQualifiedValidation');
  return { ...actual, hopV55QualifiedContentReference(prefix: string, value: unknown) {
    hashStats.byPrefix[prefix] = (hashStats.byPrefix[prefix] ?? 0) + 1;
    hashStats.q09Depth++;
    try { return actual.hopV55QualifiedContentReference(prefix, value); }
    finally { hashStats.q09Depth--; }
  } };
});

const STUDY = 'hop-advice-study-v3';
const PREPARATION_V1 = 'hop-v55-qualified-study-preparation-v1';
const PREPARATION_V2 = 'hop-v55-qualified-study-preparation-v2';
const QUALIFIED_V2 = 'hop-v55-qualified-advice-study-preparation-v2';
const resetCounts = () => { hashStats.byPrefix = {}; hashStats.q09Depth = 0; };
const count = (prefix: string) => hashStats.byPrefix[prefix] ?? 0;

afterEach(() => { vi.restoreAllMocks(); });

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  key(value: unknown) { return JSON.stringify(Array.isArray(value) ? value : [
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
  key(owner: string, dossierId: string) { return `${owner}\0${dossierId}`; }
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
      if (hopAdviceEventContentReference(existing) !== hopAdviceEventContentReference(read)) {
        throw Object.assign(new Error('EventId déjà utilisé avec un autre contenu.'), { code: 'eventIdConflict' });
      }
      return { status: 'duplicate' as const, dossier: current, event: existing };
    }
    const next = applyHopAdviceEvent(current, read, priorEvents);
    priorEvents.push(structuredClone(read));
    this.dossiers.set(key, next);
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
  const ownerKey = 'owner-q09-performance';
  const workspaceId = 'workspace-q09-performance';
  const fixture = makeHopAdviceJourneyFixture('planning');
  const study = qualifiedAdviceDomain.answerQualifiedHopAdvice(fixture);
  const context = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
  const reading = readHopV55QuestionSemanticV1(fixture.intent.originalQuestion, context);
  const archive = createHopV55DecisionReadingArchiveV4({ id: 'reading-q09-performance', ownerKey, workspaceId,
    recordedAt: '2026-10-04T08:00:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: 'runtime-q09-performance' });
  const dossierId = 'dossier-q09-performance';
  const preparation = createHopV55QualifiedStudyPreparationV1({ id: 'preparation-q09-performance', ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, preparedReference: 'prepared-q09-performance',
    createCommand: { kind: 'advice', ownerKey, dossierId, eventId: 'study-saved-q09-performance',
      recordedAt: '2026-10-04T08:01:00.000Z', study } });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Coût Q09 synthétique', intent: { question: reading.intent.question, criteria: reading.intent.criteria },
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-04T08:00:00.000Z' };
  const option = study.responseSnapshot.result.options[0];
  if (!option) throw new Error('Une option stratégique exacte est requise.');
  const event = captureHopAdvicePreference({ identity: { ownerKey, dossierId, eventId: 'preference-event-q09-performance',
    expectedRevision: 1, recordedAt: '2026-10-04T08:02:00.000Z' }, study, currentStudy: study,
    qualificationInput: fixture.qualificationInput, preferenceId: 'preference-id-q09-performance', optionId: option.id,
    reason: 'Choix explicite de fixture; aucun dosage ni changement de programme.' });
  const command = createHopV55QualifiedStudyPreferenceCommandV1({ preparation, event });
  const database = new MemoryWorkspaceDatabase();
  const workspaces = createHopV55WorkspaceRepository({ ownerKey, database });
  const repository = new MemoryAdviceRepository();
  return { ownerKey, workspaceId, workspace, archive, study, preparation, command, fixture, database, workspaces, repository };
}

async function saveStudy(row: ReturnType<typeof journey>) {
  await row.workspaces.save(row.workspace, null);
  return saveHopV55QualifiedStudy({ workspaces: row.workspaces, qualifiedStudies: row.repository,
    preparation: row.preparation, validateFreshness: async () => ({ status: 'current' }) });
}

async function savePreferenceStudy(row: ReturnType<typeof journey>) {
  await saveStudy(row);
  await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
    command: row.command, validateFreshness: async () => ({ status: 'current' }) });
  const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
  if (!workspace) throw new Error('Workspace avec préférence préparée attendu.');
  return workspace;
}

/** Seals a V2 record around an exact V1 advice preparation, as the V2 preparer stores it. */
function qualifiedV2Body(base: HopV55QualifiedStudyPreparationV1, nested: HopV55QualifiedStudyPreparationV1) {
  if (base.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
  const study = base.createCommand.study;
  const body = {
    format: 'hop-v55-qualified-advice-study-preparation-v2', kind: 'advice',
    ownerKey: base.ownerKey, workspaceId: base.workspaceId, sourceReadingReference: base.sourceReadingReference,
    sourceRuntimeReference: 'runtime-q09-performance', sourceContext: null,
    sourceContextReference: 'source-context-q09-performance', qualificationInputReference: 'qualification-input-q09-performance',
    preparedReference: base.preparedReference, action: structuredClone(study.requestSnapshot.action),
    study: structuredClone(study), preparation: structuredClone(nested),
    scopeLedgerReference: 'scope-ledger-q09-performance', scopeCoverage: [],
  };
  return { ...body, reference: hopAdviceContentReference(QUALIFIED_V2, body) };
}

describe('Coût local Q09 — validations stricts sans répétition dans une même passe', () => {
  it('retourne des vues validées détachées sans alias après mutation des résultats', async () => {
    const row = journey();
    await saveStudy(row);
    const key = row.database.workspaces.key([row.ownerKey, row.workspaceId]);
    const initialStored = row.database.workspaces.rows.get(key);
    if (!initialStored) throw new Error('Workspace persisté attendu.');
    const sourceTitle = initialStored.workspace.title;

    const read = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!read) throw new Error('Lecture détachée attendue.');
    read.title = 'Mutation de la lecture retournée';
    expect(row.database.workspaces.rows.get(key)?.workspace.title).toBe(sourceTitle);

    const listed = await row.workspaces.list(row.ownerKey);
    listed[0].title = 'Mutation de la liste retournée';
    expect(row.database.workspaces.rows.get(key)?.workspace.title).toBe(sourceTitle);

    const saved = await row.workspaces.save({ ...read, title: 'Mise à jour CAS exacte' }, read.revision);
    saved.title = 'Mutation du résultat CAS retourné';
    const reloaded = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(reloaded?.title).toBe('Mise à jour CAS exacte');
  });

  it('relit un workspace en validant strictement chaque préparation une seule fois, sans changer un octet', async () => {
    const row = journey();
    await saveStudy(row);
    const stored = [...row.database.workspaces.rows.values()][0];
    const storedJson = JSON.stringify(stored.workspace);
    resetCounts();
    const read = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(count(STUDY)).toBe(1);
    expect(count(PREPARATION_V1)).toBe(1);
    expect(JSON.stringify(read)).toBe(storedJson);
    const rawPreparation = read!.qualifiedStudyPreparations![0];
    resetCounts();
    const decoded = readHopV55QualifiedStudyPreparation(rawPreparation);
    expect(decoded.status).toBe('available');
    if (decoded.status !== 'available') throw new Error('Préparation exacte attendue.');
    expect(count(PREPARATION_V1)).toBe(0);
    expect(JSON.stringify(decoded.preparation)).toBe(JSON.stringify(row.preparation));
    expect(decoded.preparation.reference).toBe(row.preparation.reference);

    resetCounts();
    const independent = readHopV55QualifiedStudyPreparation(structuredClone(rawPreparation));
    expect(independent.status).toBe('available');
    expect(count(PREPARATION_V1)).toBe(1);
  });

  it('sauve en relisant strictement la version stockée, et réutilise son index seulement dans la même passe', async () => {
    const row = journey();
    await saveStudy(row);
    const current = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!current) throw new Error('Workspace attendu.');
    resetCounts();
    const saved = await row.workspaces.save({ ...current, title: 'Titre modifié sans toucher l’étude' }, current.revision);
    // The incoming copy is strictly validated once; the fresh CAS row reuses only its exact immutable proof.
    expect(count(STUDY)).toBe(1);
    expect(count(PREPARATION_V1)).toBe(1);
    expect(saved.revision).toBe(current.revision + 1);
    expect(saved.qualifiedStudyPreparations).toEqual(current.qualifiedStudyPreparations);
    expect(saved.qualifiedStudyLinks).toEqual(current.qualifiedStudyLinks);

    // Another writer alters the stored study without resealing it: every new read is strict again.
    const key = row.database.workspaces.key([row.ownerKey, row.workspaceId]);
    const tampered = structuredClone(row.database.workspaces.rows.get(key)!);
    const preparation = tampered.workspace.qualifiedStudyPreparations![0] as HopV55QualifiedStudyPreparationV1;
    if (preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
    (preparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Réponse altérée hors scellé.';
    row.database.workspaces.rows.set(key, tampered);
    await expect(row.workspaces.read(row.ownerKey, row.workspaceId)).rejects.toMatchObject({ code: 'invalidStoredRecord' });
    await expect(row.workspaces.save({ ...saved, title: 'Autre titre' }, saved.revision))
      .rejects.toMatchObject({ code: 'invalidStoredRecord' });
  });

  it('refuse un row CAS corrompu pendant la lecture asynchrone malgré la copie entrante validée', async () => {
    const row = journey();
    await saveStudy(row);
    const current = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!current) throw new Error('Workspace attendu.');
    const key = row.database.workspaces.key([row.ownerKey, row.workspaceId]);
    const table = row.database.workspaces;
    const originalJson = JSON.stringify(table.rows.get(key)?.workspace);
    const get = table.get.bind(table);
    let corruptedDuringGet = false;
    table.get = async storageKey => {
      const envelope = await get(storageKey);
      if (!envelope || corruptedDuringGet) return envelope;
      corruptedDuringGet = true;
      const preparation = envelope.workspace.qualifiedStudyPreparations![0] as HopV55QualifiedStudyPreparationV1;
      if (preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
      (preparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Réponse altérée pendant get.';
      table.rows.set(table.key(storageKey), structuredClone(envelope));
      return envelope;
    };

    await expect(row.workspaces.save({ ...current, title: 'Écriture après altération CAS' }, current.revision))
      .rejects.toMatchObject({ code: 'invalidStoredRecord' });
    expect(corruptedDuringGet).toBe(true);
    expect(JSON.stringify(table.rows.get(key)?.workspace)).toBe(originalJson);
  });

  it('ignore le certificat sur chaque nouveau parse même si l’adaptateur retourne le même raw', async () => {
    const row = journey();
    await saveStudy(row);
    const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!workspace) throw new Error('Workspace avec préparation certifiée attendu.');
    const key = row.database.workspaces.key([row.ownerKey, row.workspaceId]);
    const table = row.database.workspaces;
    const envelope = table.rows.get(key);
    if (!envelope) throw new Error('Enveloppe stockée attendue.');
    envelope.workspace = workspace;
    table.get = async storageKey => table.rows.get(table.key(storageKey));

    resetCounts();
    const reread = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(reread).toBe(workspace);
    expect(count(PREPARATION_V1)).toBe(1);

    const preparation = reread.qualifiedStudyPreparations?.[0] as HopV55QualifiedStudyPreparationV1;
    if (preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
    (preparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Mutation du raw certifié.';
    await expect(row.workspaces.read(row.ownerKey, row.workspaceId)).rejects.toMatchObject({ code: 'invalidStoredRecord' });
  });

  it('borne le coût d’une préférence, garde ses deux fraîcheurs et rend le même événement exact', async () => {
    const row = journey();
    await saveStudy(row);
    const phases: string[] = [];
    let workspaceReads = 0;
    const workspaces = {
      async read(owner: string, id: string) { workspaceReads++; return row.workspaces.read(owner, id); },
      save: row.workspaces.save,
    };
    resetCounts();
    const result = await appendHopV55QualifiedStudyPreference({ workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async ({ phase }) => { phases.push(phase); return { status: 'current' }; } });
    expect(workspaceReads).toBe(1);
    expect(result.status).toBe('appended');
    expect(result.eventAdvice3).toEqual(row.command.event);
    expect(result.dossierAdvice3.revision).toBe(2);
    expect(phases).toEqual(['beforeStage', 'beforeAppend']);
    // Before this lot: 29 study fingerprints and 12 preparation fingerprints on this same path.
    expect(count(STUDY)).toBeLessThanOrEqual(9);
    expect(count(PREPARATION_V1)).toBeLessThanOrEqual(6);
    expect(row.repository.appendCalls).toBe(1);

    resetCounts();
    const retry = await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) });
    expect(retry.status).toBe('alreadyAppended');
    expect(retry.eventAdvice3).toEqual(result.eventAdvice3);
    expect(row.repository.appendCalls).toBe(1);
  });

  it('réutilise le résultat CAS exact après un écrit indépendant et ne relit pas le workspace', async () => {
    const row = journey();
    await saveStudy(row);
    let reads = 0;
    let saves = 0;
    const workspaces = {
      async read(owner: string, id: string) { reads++; return row.workspaces.read(owner, id); },
      async save(next: HopV55Workspace, expectedRevision: number | null) {
        saves++;
        const committed = await row.workspaces.save(next, expectedRevision);
        if (saves === 1) {
          await row.workspaces.save({ ...committed, title: 'Écriture concurrente après staging' }, committed.revision);
        }
        return committed;
      },
    };
    const result = await appendHopV55QualifiedStudyPreference({ workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) });
    expect(result.status).toBe('appended');
    expect(reads).toBe(1);
    expect(saves).toBe(1);
    const stored = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(stored?.title).toBe('Écriture concurrente après staging');
    expect(stored?.qualifiedStudyPreferenceCommands).toEqual([row.command]);
    expect(row.repository.appendCalls).toBe(1);
  });
  it('capture la préparation de l’appelant : une mutation après l’appel n’est jamais stockée', async () => {
    const row = journey();
    await row.workspaces.save(row.workspace, null);
    const original = structuredClone(row.preparation);
    resetCounts();
    const pending = saveHopV55QualifiedStudy({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      preparation: row.preparation, validateFreshness: async () => ({ status: 'current' }) });
    if (row.preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
    (row.preparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Réponse modifiée après validation.';
    const result = await pending;
    // Before this lot: about 40 study fingerprints for this save, preparation and link.
    expect(count(STUDY)).toBeLessThanOrEqual(10);
    expect(result.status).toBe('linked');
    expect(result.preparation).toEqual(original);
    expect(Object.isFrozen(result.preparation)).toBe(false);
    const stored = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(stored?.qualifiedStudyPreparations).toEqual([original]);
    expect(stored?.qualifiedStudyLinks?.[0]).toMatchObject({ preparationReference: original.reference, studyReference: original.studyReference });
  });

  it('donne à chaque contrôle de fraîcheur sa propre copie : il ne peut altérer ni la commande domaine ni le lien', async () => {
    const row = journey();
    await row.workspaces.save(row.workspace, null);
    const phases: string[] = [];
    const result = await saveHopV55QualifiedStudy({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      preparation: row.preparation, validateFreshness: async ({ preparation, phase }) => {
        phases.push(phase);
        (preparation as { studyReference: string }).studyReference = 'référence-forgée';
        (preparation.createCommand as { dossierId: string }).dossierId = 'dossier-forgé';
        return { status: 'current' };
      } });
    expect(phases).toEqual(['beforeCreate', 'beforeLink']);
    expect(result.link).toMatchObject({ studyReference: row.preparation.studyReference, dossierId: row.preparation.dossierId });
    expect([...row.repository.dossiers.keys()]).toEqual([row.repository.key(row.ownerKey, row.preparation.dossierId)]);
    expect(row.repository.createCalls).toBe(1);
  });

  it('décode une préparation V2 sans revalider la préparation imbriquée identique, et refuse une imbrication divergente', () => {
    const row = journey();
    const v2 = createHopV55QualifiedStudyPreparationV2({
      qualifiedPreparation: qualifiedV2Body(row.preparation, row.preparation) as never });
    resetCounts();
    const read = readHopV55QualifiedStudyPreparation(structuredClone(v2));
    expect(read.status).toBe('available');
    expect(JSON.stringify(read.status === 'available' ? read.preparation : null)).toBe(JSON.stringify(v2));
    // Before this lot: 4 study and 3 V1 fingerprints for one V2 decode.
    expect(count(STUDY)).toBe(1);
    expect(count(PREPARATION_V1)).toBe(1);
    expect(count(QUALIFIED_V2)).toBe(1);
    expect(count(PREPARATION_V2)).toBe(1);

    const other = createHopV55QualifiedStudyPreparationV1({ id: 'preparation-q09-autre', ownerKey: row.ownerKey,
      workspaceId: row.workspaceId, sourceReadingReference: row.preparation.sourceReadingReference,
      preparedReference: row.preparation.preparedReference, createCommand: structuredClone(row.preparation.createCommand) });
    const { reference: _reference, ...v2Body } = v2;
    const divergentBody = { ...v2Body, qualifiedPreparation: qualifiedV2Body(row.preparation, other) };
    const divergent = { ...divergentBody, reference: hopAdviceContentReference(PREPARATION_V2, divergentBody) };
    expect(() => readHopV55QualifiedStudyPreparation(divergent)).toThrow(/diverge/);
  });

  it('ne reconnaît dans une portée que la copie gelée capturée; une copie altérée ou une portée fermée repassent par le contrôle strict', () => {
    const row = journey();
    const scope = new HopV55OperationValidationScope();
    resetCounts();
    const snapshot = captureHopV55QualifiedStudyPreparation(scope, row.preparation);
    expect(count(STUDY)).toBe(1);
    expect(Object.isFrozen(snapshot)).toBe(true);
    resetCounts();
    const link = createHopV55QualifiedStudyLinkV1(snapshot, { scope });
    expect(count(STUDY)).toBe(0);
    expect(link).toEqual(createHopV55QualifiedStudyLinkV1(row.preparation));

    const altered = structuredClone(snapshot);
    if (altered.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
    (altered.createCommand.study.responseSnapshot as { answer: string }).answer = 'Réponse altérée.';
    expect(() => createHopV55QualifiedStudyLinkV1(altered, { scope })).toThrow(/invalide/i);
    const foreign = { ...structuredClone(row.workspace), ownerKey: 'owner-étranger' };
    expect(() => appendHopV55QualifiedStudyPreparationRecord(foreign, snapshot, { scope })).toThrow(/Owner\/workspace/);

    scope.close();
    resetCounts();
    createHopV55QualifiedStudyLinkV1(snapshot, { scope });
    expect(count(STUDY)).toBe(1);
  });

  it('relit l’historique sans requalifier ni recharger le catalogue', async () => {
    const row = journey();
    await saveStudy(row);
    await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async () => ({ status: 'current' }) });
    const advice = vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice');
    const loader = vi.spyOn(catalogueLoader, 'loadHopCatalogueQualificationInput');
    const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
    const preparation = readHopV55QualifiedStudyPreparation(workspace!.qualifiedStudyPreparations![0]);
    const command = readHopV55QualifiedStudyPreferenceCommand(workspace!.qualifiedStudyPreferenceCommands![0]);
    expect(preparation.status).toBe('available');
    expect(command).toEqual({ status: 'available', command: row.command });
    expect(advice).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
  });
});

  it('refuse un index fabriqué et un index réutilisé sur une autre révision', async () => {
    const row = journey();
    const validLink = createHopV55QualifiedStudyLinkV1(row.preparation);
    const malformed = { ...row.workspace,
      qualifiedStudyPreparations: [{ format: 'hop-v55-qualified-study-preparation-v99' }],
      qualifiedStudyLinks: [{ format: 'hop-v55-qualified-study-link-v99' }],
      qualifiedStudyPreferenceCommands: [row.command],
    };
    const forged = { sourceReadingReferences: new Set([row.archive.contentReference]),
      qualified: {
        preparationsByReference: new Map([[row.preparation.reference, row.preparation]]),
        linksByPreparationReference: new Map([[row.preparation.reference, validLink]]),
      },
    };
    expect(() => assertHopV55QualifiedStudyPreferenceCommands(malformed, forged as never)).toThrow();

    await saveStudy(row);
    const previous = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!previous) throw new Error('Workspace préparé attendu.');
    const oldIndex = assertHopV55QualifiedStudyWorkspace(previous);
    const nextRevision = structuredClone(previous);
    const storedPreparation = nextRevision.qualifiedStudyPreparations![0] as HopV55QualifiedStudyPreparationV1;
    if (storedPreparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
    (storedPreparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Altération après validation.';
    nextRevision.revision++;
    nextRevision.title = 'Révision altérée';
    expect(() => appendHopV55QualifiedStudyAppendOnly(nextRevision, nextRevision,
      { previousIndex: oldIndex })).toThrow();
    await expect(row.workspaces.save(nextRevision, previous.revision)).rejects.toMatchObject({ code: 'invalidInput' });
  });

  it('repasse strictement après mutation en place de la révision, du propriétaire ou des tableaux indexés', async () => {
    const revisionRow = journey();
    const revisionWorkspace = await savePreferenceStudy(revisionRow);
    const revisionIndex = assertHopV55QualifiedStudyWorkspace(revisionWorkspace);
    revisionWorkspace.revision++;
    resetCounts();
    expect(() => assertHopV55QualifiedStudyPreferenceCommands(revisionWorkspace, revisionIndex)).not.toThrow();
    expect(count(PREPARATION_V1)).toBeGreaterThan(0);

    const ownerRow = journey();
    const ownerWorkspace = await savePreferenceStudy(ownerRow);
    const ownerIndex = assertHopV55QualifiedStudyWorkspace(ownerWorkspace);
    ownerWorkspace.ownerKey = 'owner-q09-étranger';
    resetCounts();
    expect(() => assertHopV55QualifiedStudyPreferenceCommands(ownerWorkspace, ownerIndex)).toThrow();
    expect(count(PREPARATION_V1)).toBeGreaterThan(0);

    const rowsRow = journey();
    const rowsWorkspace = await savePreferenceStudy(rowsRow);
    const rowsIndex = assertHopV55QualifiedStudyWorkspace(rowsWorkspace);
    rowsWorkspace.qualifiedStudyPreparations = [{ format: 'hop-v55-qualified-study-preparation-v99' }];
    rowsWorkspace.qualifiedStudyLinks = [{ format: 'hop-v55-qualified-study-link-v99' }];
    expect(() => assertHopV55QualifiedStudyPreferenceCommands(rowsWorkspace, rowsIndex)).toThrow();
  });

  it('refuse une préparation dont le contenu imbriqué a changé après création de l’index', async () => {
    const row = journey();
    const workspace = await savePreferenceStudy(row);
    const index = assertHopV55QualifiedStudyWorkspace(workspace);
    const preparation = workspace.qualifiedStudyPreparations?.[0] as HopV55QualifiedStudyPreparationV1;
    if (preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
    (preparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Réponse altérée après validation.';
    expect(() => readHopV55QualifiedStudyPreparation(preparation)).toThrow();
    expect(() => assertHopV55QualifiedStudyPreferenceCommands(workspace, index)).toThrow();
  });

  it('détache les valeurs de toutes les maps exposées du workspace et de l’état privé de l’index', async () => {
    const row = journey();
    const workspace = await saveStudy(row);
    if (workspace.status !== 'linked') throw new Error('Étude liée attendue.');
    const persisted = await row.workspaces.read(row.ownerKey, row.workspaceId);
    if (!persisted) throw new Error('Workspace préparé attendu.');
    const index = assertHopV55QualifiedStudyWorkspace(persisted);
    const view = readHopV55QualifiedStudyCollectionsIndexV1(index, persisted);
    if (!view) throw new Error('Vue indexée attendue.');
    const rawPreparation = persisted.qualifiedStudyPreparations?.[0] as HopV55QualifiedStudyPreparationV1;
    const rawLink = persisted.qualifiedStudyLinks?.[0] as { reference: string; studyReference: string };
    const preparationByRow = view.preparations.get(rawPreparation);
    const preparationByReference = view.preparationsByReference.get(rawPreparation.reference);
    const linkByRow = view.links.get(rawLink);
    const linkByPreparationReference = view.linksByPreparationReference.get(rawPreparation.reference);
    if (!preparationByRow || !preparationByReference || !linkByRow || !linkByPreparationReference) {
      throw new Error('Les quatre valeurs indexées attendues sont absentes.');
    }
    const originalPreparation = structuredClone(rawPreparation);
    const originalLink = structuredClone(rawLink);
    expect(preparationByRow).not.toBe(rawPreparation);
    expect(preparationByReference).not.toBe(rawPreparation);
    expect(linkByRow).not.toBe(rawLink);
    expect(linkByPreparationReference).not.toBe(rawLink);

    for (const preparation of [preparationByRow, preparationByReference]) {
      if (preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice attendue.');
      (preparation.createCommand.study.responseSnapshot as { answer: string }).answer = 'Mutation de vue exposée.';
    }
    linkByRow.studyReference = 'study-forged-by-exposed-map';
    linkByPreparationReference.studyReference = 'study-forged-by-reference-map';

    expect(rawPreparation).toEqual(originalPreparation);
    expect(rawLink).toEqual(originalLink);
    const reread = readHopV55QualifiedStudyCollectionsIndexV1(index, persisted);
    expect(reread?.preparationsByReference.get(rawPreparation.reference)).toEqual(originalPreparation);
    expect(reread?.linksByPreparationReference.get(rawPreparation.reference)).toEqual(originalLink);
    resetCounts();
    expect(readHopV55QualifiedStudyPreparation(rawPreparation).status).toBe('available');
    expect(count(PREPARATION_V1)).toBe(0);
  });

  it('isole la commande du callback asynchrone avant append', async () => {
    const row = journey();
    await saveStudy(row);
    const original = structuredClone(row.command);
    const { preferenceReference: _preferenceReference, ...preferenceContent } = original.event.payload;
    const changedContent = { ...preferenceContent, reason: 'Motif modifié par le callback de fraîcheur.' };
    const changedPayload = { ...changedContent, preferenceReference: hopAdvicePreferenceReference(changedContent) };
    const changedEvent = createHopAdviceEvent({
      ownerKey: original.ownerKey, dossierId: original.dossierId, eventId: original.event.eventId,
      expectedRevision: original.event.expectedRevision, recordedAt: original.event.recordedAt,
      kind: 'strategyPreferred', payload: changedPayload,
    });
    const changedCommand = createHopV55QualifiedStudyPreferenceCommandV1({ preparation: row.preparation, event: changedEvent });
    const phases: string[] = [];
    const result = await appendHopV55QualifiedStudyPreference({ workspaces: row.workspaces, qualifiedStudies: row.repository,
      command: row.command, validateFreshness: async ({ command, phase }) => {
        phases.push(phase);
        if (phase === 'beforeAppend') Object.assign(command, changedCommand);
        return { status: 'current' };
      } });
    expect(phases).toEqual(['beforeStage', 'beforeAppend']);
    expect(result.command).toEqual(original);
    expect(result.eventAdvice3).toEqual(original.event);
    const workspace = await row.workspaces.read(row.ownerKey, row.workspaceId);
    expect(workspace?.qualifiedStudyPreferenceCommands).toEqual([original]);
    expect((await row.repository.readEvents(row.ownerKey, row.preparation.dossierId)).at(-1)).toEqual(original.event);
  });
describe('HopV55OperationValidationScope', () => {
  it('valide une seule fois une copie gelée; l’original, une copie ou une autre clé ne sont jamais reconnus', () => {
    const kind = Symbol('scope-test');
    const validate = vi.fn((value: unknown) => {
      if (!value || (value as { ok?: unknown }).ok !== true) throw new Error('Valeur invalide.');
    });
    const scope = new HopV55OperationValidationScope();
    const original = { ok: true, nested: { values: [1, 2] } };
    const snapshot = scope.capture<typeof original>(kind, original, validate);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual(original);
    expect(snapshot).not.toBe(original);
    expect(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.nested) && Object.isFrozen(snapshot.nested.values)).toBe(true);
    expect(() => { snapshot.nested.values.push(3); }).toThrow(TypeError);
    expect(scope.has(kind, snapshot)).toBe(true);
    expect(scope.has(kind, original)).toBe(false);
    expect(scope.has(kind, structuredClone(snapshot))).toBe(false);
    expect(scope.has(Symbol('scope-test'), snapshot)).toBe(false);
    original.ok = false;
    expect(snapshot.ok).toBe(true);
    expect(() => scope.capture(kind, { ok: false }, validate)).toThrow('Valeur invalide.');
    scope.close();
    expect(scope.has(kind, snapshot)).toBe(false);
    expect(() => scope.capture(kind, { ok: true }, validate)).toThrow(/fermée/);
  });

  it('ne déclare pas validée une valeur qui ne peut pas être gelée entièrement', () => {
    const kind = Symbol('scope-date');
    const scope = new HopV55OperationValidationScope();
    const snapshot = scope.capture<{ at: Date }>(kind, { at: new Date(0) }, () => undefined);
    expect(scope.has(kind, snapshot)).toBe(false);
  });

  it('réutilise seulement le contenu exact d’une même clé et revalide les mutations de l’original et de sa copie', () => {
    const kindA = Symbol('scope-copy-a'), kindB = Symbol('scope-copy-b');
    const validateA = vi.fn((value: unknown) => {
      const row = value as { payload?: { answer?: unknown }; seal?: unknown };
      if (row?.payload?.answer !== row?.seal) throw new Error('Contenu scellé invalide.');
    });
    const validateB = vi.fn();
    const scope = new HopV55OperationValidationScope();
    const original = { payload: { answer: 'exact' }, seal: 'exact' };
    scope.validateCopy(kindA, original, validateA);
    const exactCopy = structuredClone(original);
    scope.validateCopy(kindA, exactCopy, validateA);
    expect(validateA).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(original)).toBe(false);
    expect(Object.isFrozen(exactCopy)).toBe(false);
    expect(scope.has(kindA, original)).toBe(false);
    expect(scope.has(kindA, exactCopy)).toBe(false);

    original.payload.answer = 'mutation originale';
    expect(() => scope.validateCopy(kindA, original, validateA)).toThrow('Contenu scellé invalide.');
    exactCopy.payload.answer = 'mutation de copie';
    expect(() => scope.validateCopy(kindA, exactCopy, validateA)).toThrow('Contenu scellé invalide.');
    expect(validateA).toHaveBeenCalledTimes(3);

    scope.validateCopy(kindB, structuredClone({ payload: { answer: 'exact' }, seal: 'exact' }), validateB);
    expect(validateB).toHaveBeenCalledTimes(1);
  });

  it('repasse par validation stricte après close et refuse une nouvelle capture', () => {
    const kind = Symbol('scope-copy-close');
    const validate = vi.fn();
    const scope = new HopV55OperationValidationScope();
    const value = { valid: true };
    scope.validateCopy(kind, value, validate);
    scope.validateCopy(kind, structuredClone(value), validate);
    expect(validate).toHaveBeenCalledTimes(1);

    scope.close();
    scope.validateCopy(kind, structuredClone(value), validate);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(() => scope.capture(kind, value, validate)).toThrow(/fermée/);
    expect(validate).toHaveBeenCalledTimes(2);
  });
});

describe('sameCanonicalData', () => {
  it('n’affirme l’égalité que pour des données JSON identiques', () => {
    expect(sameCanonicalData({ a: 1, b: [true, null, 'x'] }, { b: [true, null, 'x'], a: 1 })).toBe(true);
    expect(sameCanonicalData({ a: 0 }, { a: -0 })).toBe(true);
    expect(sameCanonicalData({ a: undefined }, { a: undefined })).toBe(true);
    expect(sameCanonicalData({ a: undefined }, {})).toBe(false);
    expect(sameCanonicalData({ a: Number.NaN }, { a: Number.NaN })).toBe(false);
    expect(sameCanonicalData({ at: new Date(0) }, { at: new Date(1) })).toBe(false);
    expect(sameCanonicalData(new Map(), new Map())).toBe(false);
    class Box { value: number; constructor(value: number) { this.value = value; } }
    expect(sameCanonicalData(new Box(1), new Box(1))).toBe(false);
    const accessor = Object.defineProperty({}, 'a', { get: () => 1, enumerable: true });
    expect(sameCanonicalData(accessor, { a: 1 })).toBe(false);
    // eslint-disable-next-line no-sparse-arrays
    expect(sameCanonicalData([1, , 3], [1, undefined, 3])).toBe(false);
    expect(sameCanonicalData({ a: '1' }, { a: 1 })).toBe(false);
  });
});

describe('hopV55QualifiedContentReference', () => {
  it('conserve les références byte-exactes des scellements Q09 V1, DTO V2 et préparation V2', () => {
    const row = journey();
    const qualified = qualifiedV2Body(row.preparation, row.preparation);
    const v2 = createHopV55QualifiedStudyPreparationV2({ qualifiedPreparation: qualified as never });
    resetCounts();

    const { reference: _v1Reference, ...v1Body } = row.preparation;
    const v1 = hopV55QualifiedContentReference(PREPARATION_V1, v1Body);
    expect(count(PREPARATION_V1)).toBe(1);
    expect(v1).toBe(hopAdviceContentReference(PREPARATION_V1, v1Body));

    const { reference: _qualifiedReference, ...qualifiedBody } = qualified;
    const qualifiedV2 = hopV55QualifiedContentReference(QUALIFIED_V2, qualifiedBody);
    expect(count(QUALIFIED_V2)).toBe(1);
    expect(qualifiedV2).toBe(hopAdviceContentReference(QUALIFIED_V2, qualifiedBody));

    const { reference: _v2Reference, ...v2Body } = v2;
    const preparationV2 = hopV55QualifiedContentReference(PREPARATION_V2, v2Body);
    expect(count(PREPARATION_V2)).toBe(1);
    expect(preparationV2).toBe(hopAdviceContentReference(PREPARATION_V2, v2Body));
  });

  it('conserve le JSON canonique imbriqué, Unicode, les clés numériques, undefined, -0 et les collisions de reference', () => {
    const numericKeys: Record<string, unknown> = {};
    numericKeys['10'] = 'dix';
    numericKeys['2'] = 'deux';
    numericKeys['01'] = 'zéro un';
    numericKeys['label'] = 'brasserie';
    const sameReferenceRows = [
      { reference: 'collision-q09', value: { answer: 'premier' } },
      { reference: 'collision-q09', value: { answer: 'second' } },
      { reference: 'collision-q09', value: { answer: 'premier' } },
    ];
    const value = {
      nested: { question: 'Été 🍺', optional: undefined, numericKeys },
      values: [undefined, -0, { nested: ['café', 'orge'] }],
      repeatedReference: sameReferenceRows,
    };
    const prefix = 'hop-v55-q09-canonical-edges';
    resetCounts();
    const actual = hopV55QualifiedContentReference(prefix, value);
    expect(count(prefix)).toBe(1);
    expect(actual).toBe(hopAdviceContentReference(prefix, value));
  });

  it('garde les résultats et refus du sérialiseur historique pour les valeurs exotiques', () => {
    class Box { constructor(readonly value: number) {} }
    const sparse: unknown[] = [];
    sparse[0] = 'premier';
    sparse[2] = 'troisième';
    const stableAccessor = Object.defineProperty({}, 'answer', { enumerable: true, get: () => 'stable' });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const values: unknown[] = [sparse, new Date(0), new Map([['key', 'value']]), new Set(['value']),
      new Box(1), stableAccessor, Number.NaN, Number.POSITIVE_INFINITY, 1n, () => undefined, Symbol('q09'), undefined, cyclic];
    const prefix = 'hop-v55-q09-exotic-fallback';
    const outcome = (reference: (prefix: string, value: unknown) => string, value: unknown) => {
      try { return { status: 'hashed' as const, reference: reference(prefix, value) }; }
      catch { return { status: 'refused' as const }; }
    };

    resetCounts();
    expect(outcome(hopV55QualifiedContentReference, sparse)).toEqual(outcome(hopAdviceContentReference, sparse));
    expect(count(prefix)).toBe(2); // One helper call and one explicit legacy oracle call, with no double count for fallback.
    for (const value of values.slice(1)) {
      expect(outcome(hopV55QualifiedContentReference, value)).toEqual(outcome(hopAdviceContentReference, value));
    }
  });

  it('ne change pas les octets avant un fallback sur un accesseur à résultat variable', () => {
    const makeStatefulAccessor = () => {
      let reads = 0;
      return Object.defineProperty({}, 'answer', { enumerable: true, get: () => ++reads });
    };
    const prefix = 'hop-v55-q09-stateful-accessor';
    const expected = hopAdviceContentReference(prefix, makeStatefulAccessor());
    const actual = hopV55QualifiedContentReference(prefix, makeStatefulAccessor());
    expect(actual).toBe(expected);
  });
});
