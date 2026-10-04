import { describe, expect, it, vi } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import * as adviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, type HopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import {
  HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  prepareReexaminationPreviewV1,
  prepareVerifiedReexaminationV4,
  upgradeV3ToV4,
  type HopV55PropertyAdviceReexaminationPreviewV1,
} from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  createHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceV4Transition,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import {
  appendHopV55PropertyAdviceReexaminationCommandReceipt,
  appendHopV55PropertyAdviceReexaminationCommandStaging,
  assertHopV55PropertyAdviceReexaminationCommandAppendOnly,
  assertHopV55PropertyAdviceReexaminationCommandWorkspace,
  createHopV55PropertyAdviceReexaminationCommandReceiptV1,
  createHopV55PropertyAdviceReexaminationCommandStagingV1,
  hopV55PropertyAdviceReexaminationConfirmationFingerprintV1,
  lookupStoredHopV55PropertyAdviceReexaminationCommand,
  readHopV55PropertyAdviceReexaminationCommandReceipt,
  readHopV55PropertyAdviceReexaminationCommandStaging,
  type HopV55PropertyAdviceReexaminationConfirmationInputV1,
} from '../../src/services/hopV55/propertyAdviceReexaminationCommand';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';

const ownerKey = 'fixture:reexamination-command-v1';
const workspaceId = 'workspace:reexamination-command-v1';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière présélectionnée dans cette fixture.' };
const recordedAt = '2026-10-03T20:45:00.000Z';
const question = 'Je veux plus de poire et garder le floral.';

type Row = HopV55WorkspaceEnvelopeV1;

class MemoryTable implements HopV55WorkspaceTable<Row> {
  rows = new Map<string, Row>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [(value as Row).ownerKey, (value as Row).workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const before = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = before; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Adaptateur mémoire réservé à la fixture unitaire. */ }
}

function fixture() {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(question, prepared);
  const sourceReadingArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:reexamination-command:parent',
    ownerKey, workspaceId, recordedAt, reading, source: { kind: 'exploration' }, runtimeReference: 'runtime:reexamination-command:parent' });
  const sourceDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'request:reexamination-command:v3',
    ownerKey, workspaceId, sourceReadingReference: sourceReadingArchive.contentReference, candidatePolicy });
  const sourceAnswer = buildHopPropertyAdviceV3(sourceDraft.requestSnapshot);
  const sourceRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft: sourceDraft, prepared, answerSnapshot: sourceAnswer,
    answerRecordId: 'answer:reexamination-command:v3' });
  const upgradeTransition: HopV55PropertyAdviceV4Transition = {
    kind: 'upgradeV3', actId: 'act:reexamination-command:upgrade', parentRecordReference: sourceRecord.reference,
    parentReadingReference: sourceRecord.sourceReadingReference, reason: 'Upgrade explicite synthétique.',
    actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt,
  };
  const upgrade = upgradeV3ToV4({ sourceRecord, sourceReadingArchive, prepared, recordId: 'record:reexamination-command:parent',
    requestId: 'request:reexamination-command:parent', transition: upgradeTransition, cultureBinding: null });
  if (upgrade.status !== 'ready') throw new Error('La fixture doit créer un parent V4 avec une intention active.');
  const upgradedAnswer = buildHopPropertyAdviceV3(upgrade.requestDraftV3.requestSnapshot);
  const parentRecord = createHopV55PropertyAdviceAnswerRecordV4({ draft: upgrade.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: upgrade.requestDraftV3.reference,
    answerSnapshot: upgradedAnswer, answerReference: upgradedAnswer.reference,
  } });

  const currentReading = structuredClone(reading) as typeof reading & { response?: unknown; branches: unknown[] };
  delete currentReading.response;
  currentReading.branches = [];
  const nextArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:reexamination-command:confirmed', ownerKey, workspaceId,
    recordedAt: '2026-10-03T20:46:00.000Z', reading: currentReading, source: { kind: 'exploration' },
    runtimeReference: 'runtime:reexamination-command:confirmed' });
  const currentInput = { sourceRecord: parentRecord, parentReadingArchive: sourceReadingArchive,
    sourceReadingArchive: nextArchive, prepared, cultureBinding: null,
    currentSource: { kind: 'exploration' as const }, currentRuntimeReference: nextArchive.runtimeReference,
    previewId: 'preview:reexamination-command:one' };
  const preparedPreview = prepareReexaminationPreviewV1(currentInput);
  if (preparedPreview.status !== 'ready') throw new Error(`Preview de fixture bloqué : ${preparedPreview.reason}`);
  const preview: HopV55PropertyAdviceReexaminationPreviewV1 = preparedPreview.preview;
  const commandId = 'act:reexamination-command:confirm';
  const confirmation: HopV55PropertyAdviceReexaminationConfirmationInputV1 = {
    commandId, expectedRecordReference: parentRecord.reference, expectedLedgerReference: parentRecord.ledger.reference,
    previewId: preview.previewId, expectedPreviewReference: preview.reference, actions: [], bindingChoices: [],
    readingContext: structuredClone(preview.readingContext), reason: 'Confirmer le cadre frais exact de la fixture.',
  };
  const transition: HopV55PropertyAdviceV4Transition = {
    kind: 'reexamine', actId: commandId, parentRecordReference: parentRecord.reference,
    parentReadingReference: parentRecord.sourceReadingReference, reason: confirmation.reason,
    actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-03T20:46:01.000Z',
  };
  const reexamined = prepareVerifiedReexaminationV4({ ...currentInput, preview,
    expectedPreviewReference: preview.reference, readingContext: confirmation.readingContext,
    recordId: 'record:reexamination-command:confirmed', requestId: 'request:reexamination-command:confirmed',
    transition, actions: confirmation.actions, bindingChoices: confirmation.bindingChoices });
  if (reexamined.status !== 'ready') throw new Error(`Confirmation synthétique bloquée : ${reexamined.reason}`);
  const finalAnswer = buildHopPropertyAdviceV3(reexamined.requestDraftV3.requestSnapshot);
  const preparedRecord = createHopV55PropertyAdviceAnswerRecordV4({ draft: reexamined.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: reexamined.requestDraftV3.reference,
    answerSnapshot: finalAnswer, answerReference: finalAnswer.reference,
  } });
  const staging = createHopV55PropertyAdviceReexaminationCommandStagingV1({ preview, confirmation, preparedRecord });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Commande de réexamen · fixture', intent: structuredClone(reading.intent), scenarioIds: [],
    referenceHypotheses: [], copies: [], decisionReadings: [sourceReadingArchive],
    documentaryAnswers: [sourceRecord, parentRecord], updatedAt: recordedAt,
  };
  return { context, prepared, sourceReadingArchive, nextArchive, sourceRecord, parentRecord, preview, confirmation,
    preparedRecord, staging, workspace };
}

function requirePreparationV4() {
  // Kept local to the fixture module so production services are never imported by tests as runtime adapters.
  return { upgradeV3ToV4: (require('../../src/services/hopV55/propertyAdvicePreparationV4') as typeof import('../../src/services/hopV55/propertyAdvicePreparationV4')).upgradeV3ToV4 };
}

describe('staging durable d’une confirmation de réexamen V4', () => {
  it('relit la staging et termine le CAS answer+receipt après recréation du repository, sans builder', async () => {
    const data = fixture();
    const builder = vi.spyOn(adviceDomain, 'buildHopPropertyAdviceV3');
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const initial = await repository.save(data.workspace, null);

    const cas1Candidate = appendHopV55PropertyAdviceReexaminationCommandStaging(initial, data.staging);
    assertHopV55PropertyAdviceReexaminationCommandAppendOnly(initial, cas1Candidate);
    const afterCas1 = await repository.save(cas1Candidate, initial.revision);
    expect(afterCas1.decisionReadings?.map(row => row.contentReference)).toContain(data.nextArchive.contentReference);
    expect(afterCas1.documentaryAnswers).toEqual(initial.documentaryAnswers);
    expect(afterCas1.propertyAdviceReexaminationCommandStaging?.map(row => (row as { reference: string }).reference))
      .toContain(data.staging.reference);
    expect(lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: afterCas1, confirmation: data.confirmation }))
      .toMatchObject({ status: 'pending', staging: data.staging, sourceReadingArchive: data.nextArchive, preparedRecord: data.preparedRecord });

    // A separate repository adapter instance represents page/host reload. Its lookup uses only durable workspace data.
    const reopenedRepository = createHopV55WorkspaceRepository({ ownerKey, database });
    const reopened = await reopenedRepository.read(ownerKey, workspaceId);
    expect(reopened).not.toBeNull();
    const persistedStage = reopened!.propertyAdviceReexaminationCommandStaging?.[0];
    expect(readHopV55PropertyAdviceReexaminationCommandStaging(persistedStage)).toMatchObject({
      status: 'available', staging: data.staging,
    });
    const receipt = createHopV55PropertyAdviceReexaminationCommandReceiptV1({ staging: data.staging,
      committedAt: '2026-10-03T20:46:02.000Z' });
    const cas2Candidate = appendHopV55PropertyAdviceReexaminationCommandReceipt(reopened!, receipt);
    assertHopV55PropertyAdviceReexaminationCommandAppendOnly(reopened!, cas2Candidate);
    const committed = await reopenedRepository.save(cas2Candidate, reopened!.revision);
    expect(committed.propertyAdviceReexaminationCommandStaging).toEqual(reopened!.propertyAdviceReexaminationCommandStaging);
    expect(committed.propertyAdviceReexaminationCommandReceipts).toEqual([receipt]);
    expect(committed.documentaryAnswers?.at(-1)).toEqual(data.preparedRecord);
    expect(readHopV55PropertyAdviceAnswerRecordV4(committed.documentaryAnswers?.at(-1))).toMatchObject({
      status: 'readOnly', record: data.preparedRecord,
    });
    expect(readHopV55PropertyAdviceReexaminationCommandReceipt(receipt)).toMatchObject({ status: 'available', receipt });
    expect(lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: committed, confirmation: data.confirmation }))
      .toMatchObject({ status: 'committed', staging: data.staging, receipt, record: data.preparedRecord });
    expect(builder).not.toHaveBeenCalled();
  });

  it('préserve les écritures concurrentes et refuse de dédupliquer sous un commandId avec des bindingChoices différents', async () => {
    const data = fixture();
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const initial = await repository.save(data.workspace, null);
    const afterCas1 = await repository.save(appendHopV55PropertyAdviceReexaminationCommandStaging(initial, data.staging), initial.revision);
    const receipt = createHopV55PropertyAdviceReexaminationCommandReceiptV1({ staging: data.staging,
      committedAt: '2026-10-03T20:46:02.000Z' });
    const staleCandidate = appendHopV55PropertyAdviceReexaminationCommandReceipt(afterCas1, receipt);
    const concurrent = await repository.save({ ...afterCas1, title: 'Édition indépendante conservée' }, afterCas1.revision);
    await expect(repository.save(staleCandidate, afterCas1.revision)).rejects.toMatchObject({ code: 'staleRevision' });
    const retryBase = await repository.read(ownerKey, workspaceId);
    expect(retryBase?.title).toBe('Édition indépendante conservée');
    const retried = await repository.save(appendHopV55PropertyAdviceReexaminationCommandReceipt(retryBase!, receipt), retryBase!.revision);
    expect(retried.title).toBe('Édition indépendante conservée');
    expect(retried.documentaryAnswers?.at(-1)).toEqual(data.preparedRecord);

    const changedChoices: HopV55PropertyAdviceReexaminationConfirmationInputV1 = {
      ...data.confirmation,
      bindingChoices: [{ format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
        kind: 'detach', previewReference: data.preview.reference, annotationId: 'intent:changed-choice',
        previousAssertionId: 'assertion:changed-choice' }],
    };
    expect(hopV55PropertyAdviceReexaminationConfirmationFingerprintV1(changedChoices))
      .not.toBe(hopV55PropertyAdviceReexaminationConfirmationFingerprintV1(data.confirmation));
    expect(lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: retried, confirmation: changedChoices }))
      .toMatchObject({ status: 'conflict', reason: expect.stringMatching(/bindingChoices différents/u) });
    expect((await repository.read(ownerKey, workspaceId))?.documentaryAnswers).toEqual(retried.documentaryAnswers);
    void concurrent;
  });

  it('refuse un staging/receipt altéré, un CAS séparé archive-only et une version future du même commandId', async () => {
    const data = fixture();
    const tamperedStage = structuredClone(data.staging);
    tamperedStage.preparedRecord.reference += ':altéré';
    expect(readHopV55PropertyAdviceReexaminationCommandStaging(tamperedStage)).toMatchObject({ status: 'invalid' });
    const validReceipt = createHopV55PropertyAdviceReexaminationCommandReceiptV1({ staging: data.staging,
      committedAt: '2026-10-03T20:46:02.000Z' });
    const tamperedReceipt = { ...validReceipt, answerRecordReference: 'answer:étrangère' };
    expect(readHopV55PropertyAdviceReexaminationCommandReceipt(tamperedReceipt)).toMatchObject({ status: 'invalid' });

    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
    const initial = await repository.save(data.workspace, null);
    const archiveOnly = { ...initial, decisionReadings: [...initial.decisionReadings!, data.nextArchive] };
    await repository.save(archiveOnly, initial.revision);
    const orphan = await repository.read(ownerKey, workspaceId);
    expect(() => appendHopV55PropertyAdviceReexaminationCommandStaging(orphan!, data.staging))
      .toThrow(/même CAS|archive seule/u);
    const mismatchedWorkspace = { ...orphan!, id: 'workspace:other-reexamination-command' };
    expect(() => appendHopV55PropertyAdviceReexaminationCommandStaging(mismatchedWorkspace, data.staging))
      .toThrow(/autre workspace/u);
    expect(() => appendHopV55PropertyAdviceReexaminationCommandReceipt(orphan!, validReceipt))
      .toThrow(/staging exact doit être persisté/u);

    const future = { format: 'hop-v55-property-advice-reexamination-command-staging-v2',
      commandId: data.confirmation.commandId, ownerKey, workspaceId, reference: 'future:sealed' };
    const futureWorkspace = { ...data.workspace, propertyAdviceReexaminationCommandStaging: [future] };
    assertHopV55PropertyAdviceReexaminationCommandWorkspace(futureWorkspace);
    const futureDatabase = new MemoryDatabase();
    const futureRepository = createHopV55WorkspaceRepository({ ownerKey, database: futureDatabase });
    const storedFutureWorkspace = { ...futureWorkspace, revision: 1 };
    futureDatabase.workspaces.rows.set(JSON.stringify([ownerKey, workspaceId]), {
      format: 'hop-v55-workspace-envelope-v1', ownerKey, workspaceId, revision: 1,
      workspace: structuredClone(storedFutureWorkspace),
    });
    await expect(futureRepository.read(ownerKey, workspaceId)).resolves.toMatchObject({
      propertyAdviceReexaminationCommandStaging: [future],
    });
    expect(lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: futureWorkspace, confirmation: data.confirmation }))
      .toMatchObject({ status: 'unsupportedReadOnly', snapshot: future });
    expect(() => appendHopV55PropertyAdviceReexaminationCommandStaging(futureWorkspace, data.staging))
      .toThrow(/version future|future/i);

    const withStage = appendHopV55PropertyAdviceReexaminationCommandStaging(data.workspace, data.staging);
    const rewrittenStage = structuredClone(withStage);
    (rewrittenStage.propertyAdviceReexaminationCommandStaging![0] as { fingerprint: string }).fingerprint = 'hash altéré';
    expect(() => assertHopV55PropertyAdviceReexaminationCommandAppendOnly(withStage, rewrittenStage))
      .toThrow(/immuables et append-only/u);
  });
});
