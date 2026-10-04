import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import * as documentaryAnswerDomain from '../../src/domain/hopDecision/documentaryAnswer';
import * as documentarySchema from '../../src/domain/hopDecision/documentaryAnswerSchema';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { hopV55PropertyAdviceRequestDraftReference } from '../../src/services/hopV55/propertyAdvicePreparation';
import { readHopV55DocumentaryAnswerRecord as readDocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import {
  buildHopV55DocumentaryAnswerRecord,
  createHopV55DocumentaryDossierRecord,
  prepareHopV55DocumentaryRequest,
  readHopV55DocumentaryAnswerRecord,
  readHopV55DocumentaryDossierRecord,
} from '../../src/services/hopV55/documentaryDecision';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
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

function makeDocumentaryJourney(ownerKey = 'owner-documentary-workspace', workspaceId = 'workspace-documentary-workspace') {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
  const reading = readHopV55Question('Comment examiner une douceur perçue sans inventer une opération ?', prepared);
  if (!reading.response) throw new Error('Une réponse de décision structurée est requise pour la fixture documentaire.');
  const archive = createHopV55DecisionReadingArchiveV2({
    id: 'reading-documentary-workspace-v1', ownerKey, workspaceId,
    recordedAt: '2026-10-02T16:00:00.000Z', reading,
    source: { kind: 'exploration' }, runtimeReference: 'runtime-documentary-workspace-v1',
  });
  const draft = prepareHopV55DocumentaryRequest({ reading, prepared, requestId: 'request-documentary-workspace-v1',
    ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
    overrides: { needs: [{ id: 'need-documentary-workspace', kind: 'balancePerceivedSweetness', criterionIds: [],
      explanation: 'Besoin synthétique explicite pour valider la persistance.' }] } });
  const answer = buildHopV55DocumentaryAnswerRecord({ draft, prepared, answerRecordId: 'answer-documentary-workspace-v1' });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Dossier documentaire synthétique',
    intent: { question: 'Lecture documentaire de fixture.', criteria: [] },
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-02T16:00:00.000Z',
  };
  return { workspace, prepared, reading, archive, draft, answer };
}

function makeDossier(answer: ReturnType<typeof buildHopV55DocumentaryAnswerRecord>) {
  const route = answer.answerSnapshot.routes[0];
  if (!route) throw new Error('Une voie documentaire conservable est requise pour la fixture.');
  return createHopV55DocumentaryDossierRecord({ answerRecord: answer, dossierId: 'dossier-documentary-workspace-v1',
    expectedAnswerReference: answer.answerReference,
    expectedInterpretationReference: answer.answerSnapshot.interpretationReference,
    routeId: route.id, expectedRouteReference: route.reference,
    motive: 'Conserver le choix documentaire de la fixture sans inférer une opération.',
    createdAt: '2026-10-02T16:01:00.000Z', createdBy: { origin: 'fixture', label: 'Fixture automatisée' },
  });
}

describe('Persistance des réponses et dossiers documentaires V5.5', () => {
  it('relit les enveloppes exactes après CAS, lie le dossier à une réponse déjà persistée et ne reconstruit rien', async () => {
    const journey = makeDocumentaryJourney();
    const repository = createHopV55WorkspaceRepository({ ownerKey: journey.workspace.ownerKey, database: new MemoryDatabase() });
    const opened = await repository.save(journey.workspace, null);

    const unarchivedDraft = prepareHopV55DocumentaryRequest({ reading: journey.reading, prepared: journey.prepared,
      requestId: 'request-documentary-unarchived-reading', ownerKey: journey.workspace.ownerKey,
      workspaceId: journey.workspace.id, sourceReadingReference: 'missing-reading-reference' });
    const unarchivedAnswer = buildHopV55DocumentaryAnswerRecord({ draft: unarchivedDraft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-unarchived-reading' });
    await expect(repository.save({ ...opened, documentaryAnswers: [unarchivedAnswer] }, opened.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const wrongOwnerDraft = prepareHopV55DocumentaryRequest({ reading: journey.reading, prepared: journey.prepared,
      requestId: 'request-documentary-wrong-owner', ownerKey: 'other-documentary-owner',
      workspaceId: journey.workspace.id, sourceReadingReference: journey.archive.contentReference });
    const wrongOwnerAnswer = buildHopV55DocumentaryAnswerRecord({ draft: wrongOwnerDraft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-wrong-owner' });
    await expect(repository.save({ ...opened, documentaryAnswers: [wrongOwnerAnswer] }, opened.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const foreignWorkspaceId = 'workspace-documentary-foreign-answer';
    const foreignArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading-documentary-foreign-answer',
      ownerKey: journey.workspace.ownerKey, workspaceId: foreignWorkspaceId, recordedAt: '2026-10-02T16:00:30.000Z',
      reading: journey.reading, source: { kind: 'exploration' }, runtimeReference: 'runtime-documentary-foreign-answer' });
    await expect(repository.save({ ...journey.workspace, id: foreignWorkspaceId, decisionReadings: [foreignArchive],
      documentaryAnswers: [journey.answer] }, null)).rejects.toMatchObject({ code: 'invalidInput' });

    const withAnswer = await repository.save({ ...opened, documentaryAnswers: [journey.answer] }, opened.revision);
    expect(readHopV55DocumentaryAnswerRecord(withAnswer.documentaryAnswers![0])).toMatchObject({
      status: 'readOnly', record: { reference: journey.answer.reference,
        sourceReadingReference: journey.archive.contentReference, answerReference: journey.answer.answerReference },
    });
    expect(withAnswer.scenarioIds).toEqual([]);
    expect(withAnswer.copies).toEqual([]);
    expect(withAnswer).not.toHaveProperty('serverScenarioReceipts');

    const removedPrefix = structuredClone(withAnswer);
    removedPrefix.documentaryAnswers = [];
    await expect(repository.save(removedPrefix, withAnswer.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const dossier = makeDossier(journey.answer);
    expect(dossier.dossierSnapshot.preparation.operational.status).toBe('notProvided');
    const alternateAnswer = buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-alternate-record' });
    const dossierForAlternateAnswer = makeDossier(alternateAnswer);
    await expect(repository.save({ ...withAnswer, documentaryDossiers: [dossierForAlternateAnswer] }, withAnswer.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const withDossier = await repository.save({ ...withAnswer, documentaryDossiers: [dossier] }, withAnswer.revision);
    expect(readHopV55DocumentaryDossierRecord(withDossier.documentaryDossiers![0])).toMatchObject({
      status: 'readOnly', record: { reference: dossier.reference, answerRecordReference: journey.answer.reference,
        answerReference: journey.answer.answerReference, sourceReadingReference: journey.archive.contentReference },
    });

    const wrongAnswerLink = structuredClone(withDossier);
    wrongAnswerLink.documentaryDossiers![0].answerRecordReference = 'answer-record-from-another-workspace';
    await expect(repository.save(wrongAnswerLink, withDossier.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const wrongWorkspace = { ...withDossier, id: 'workspace-documentary-foreign' };
    await expect(repository.save(wrongWorkspace, null)).rejects.toMatchObject({ code: 'invalidInput' });

    const stale = structuredClone(withAnswer);
    stale.title = 'Révision périmée';
    await expect(repository.save(stale, opened.revision)).rejects.toMatchObject({ code: 'staleRevision' });

    const buildAnswer = vi.spyOn(documentaryAnswerDomain, 'buildHopDocumentaryAnswer');
    const buildDossier = vi.spyOn(documentarySchema, 'createHopDocumentaryDossier');
    try {
      const reloaded = await repository.read(withDossier.ownerKey, withDossier.id);
      expect(reloaded?.documentaryAnswers).toEqual([journey.answer]);
      expect(reloaded?.documentaryDossiers).toEqual([dossier]);
      expect(readHopV55DocumentaryAnswerRecord(reloaded!.documentaryAnswers![0]).status).toBe('readOnly');
      expect(readHopV55DocumentaryDossierRecord(reloaded!.documentaryDossiers![0]).status).toBe('readOnly');
      expect(buildAnswer).not.toHaveBeenCalled();
      expect(buildDossier).not.toHaveBeenCalled();
    } finally {
      buildAnswer.mockRestore(); buildDossier.mockRestore(); repository.close();
    }
  });

  it('n’accepte une révision que depuis la réponse précédente exacte de la même lecture', async () => {
    const journey = makeDocumentaryJourney('owner-documentary-revision', 'workspace-documentary-revision');
    const otherArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading-documentary-other-scope',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id, recordedAt: '2026-10-02T16:00:30.000Z',
      reading: journey.reading, source: { kind: 'exploration' }, runtimeReference: 'runtime-documentary-other-scope' });
    const otherDraft = prepareHopV55DocumentaryRequest({ reading: journey.reading, prepared: journey.prepared,
      requestId: 'request-documentary-other-scope', ownerKey: journey.workspace.ownerKey,
      workspaceId: journey.workspace.id, sourceReadingReference: otherArchive.contentReference });
    const otherAnswer = buildHopV55DocumentaryAnswerRecord({ draft: otherDraft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-other-scope' });
    const revisionContext = { sourceAnswerRecordReference: journey.answer.reference,
      sourceAnswerReference: journey.answer.answerReference,
      reason: 'Corriger explicitement la lecture documentaire tout en conservant sa question source.',
      recordedAt: '2026-10-02T16:02:00.000Z', recordedBy: { origin: 'user' as const, label: 'Brasseur' } };
    const revision = buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-revision-v1', revisionContext });
    const repository = createHopV55WorkspaceRepository({ ownerKey: journey.workspace.ownerKey, database: new MemoryDatabase() });
    await expect(repository.save({ ...journey.workspace, documentaryAnswers: [revision] }, null))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const opened = await repository.save({ ...journey.workspace, decisionReadings: [journey.archive, otherArchive] }, null);
    const initial = await repository.save({ ...opened, documentaryAnswers: [journey.answer, otherAnswer] }, opened.revision);
    expect(revision.answerReference).toBe(journey.answer.answerReference);
    expect(revision.reference).not.toBe(journey.answer.reference);
    const revisedWorkspace = await repository.save({ ...initial,
      documentaryAnswers: [...initial.documentaryAnswers!, revision] }, initial.revision);
    expect(readHopV55DocumentaryAnswerRecord(revisedWorkspace.documentaryAnswers![2])).toMatchObject({
      status: 'readOnly', record: { revisionContext },
    });

    const staleRevision = buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-revision-stale-source', revisionContext: { ...revisionContext,
        reason: 'Tentative de reprendre l’ancienne réponse après la révision v1.' } });
    await expect(repository.save({ ...revisedWorkspace,
      documentaryAnswers: [...revisedWorkspace.documentaryAnswers!, staleRevision] }, revisedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const foreignScopeRevision = buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-revision-foreign-scope', revisionContext: { ...revisionContext,
        sourceAnswerRecordReference: otherAnswer.reference, sourceAnswerReference: otherAnswer.answerReference,
        reason: 'Référence vers une autre lecture du même workspace.' } });
    await expect(repository.save({ ...revisedWorkspace,
      documentaryAnswers: [...revisedWorkspace.documentaryAnswers!, foreignScopeRevision] }, revisedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const wrongAnswerReference = buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-revision-wrong-answer-ref', revisionContext: { ...revisionContext,
        sourceAnswerReference: 'forged-answer-reference', reason: 'Référence de réponse altérée.' } });
    await expect(repository.save({ ...revisedWorkspace,
      documentaryAnswers: [...revisedWorkspace.documentaryAnswers!, wrongAnswerReference] }, revisedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const orphan = buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-revision-orphan', revisionContext: { ...revisionContext,
        sourceAnswerRecordReference: 'missing-answer-record', reason: 'Référence d’origine absente.' } });
    await expect(repository.save({ ...revisedWorkspace,
      documentaryAnswers: [...revisedWorkspace.documentaryAnswers!, orphan] }, revisedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    expect(() => buildHopV55DocumentaryAnswerRecord({ draft: journey.draft, prepared: journey.prepared,
      answerRecordId: 'answer-documentary-revision-no-reason', revisionContext: { ...revisionContext, reason: ' ' } }))
      .toThrow(/reason/i);

    await expect(repository.read(revisedWorkspace.ownerKey, revisedWorkspace.id)).resolves.toMatchObject({
      revision: revisedWorkspace.revision, documentaryAnswers: revisedWorkspace.documentaryAnswers,
    });

    await expect(repository.save({ ...revisedWorkspace, documentaryDossiers: [makeDossier(journey.answer)] }, revisedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const latestDossier = makeDossier(revision);
    const saved = await repository.save({ ...revisedWorkspace, documentaryDossiers: [latestDossier] }, revisedWorkspace.revision);
    expect(readHopV55DocumentaryDossierRecord(saved.documentaryDossiers![0])).toMatchObject({
      status: 'readOnly', record: { answerRecordReference: revision.reference, answerReference: revision.answerReference },
    });
    expect(await repository.read(saved.ownerKey, saved.id)).toMatchObject({
      documentaryAnswers: [journey.answer, otherAnswer, revision], documentaryDossiers: [latestDossier],
    });
    repository.close();
  });

  it('conserve une enveloppe historique non qualifiable intacte mais refuse son altération au CAS suivant', async () => {
    const journey = makeDocumentaryJourney('owner-documentary-unqualified', 'workspace-documentary-unqualified');
    const path = new URL('../fixtures/public-history/legacy-measurement-01.json', import.meta.url);
    const legacyArchive = JSON.parse(readFileSync(path, 'utf8')) as { answer: Record<string, any> };
    const reading = readHopV55Question(legacyArchive.answer.requestSnapshot.originalQuestion, journey.prepared);
    const decisionArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading-documentary-unqualified',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id, recordedAt: '2026-10-03T11:00:00.000Z',
      reading, source: { kind: 'exploration' }, runtimeReference: 'runtime-documentary-unqualified' });
    const answerBody = {
      format: 'hop-v55-documentary-answer-record-v2', id: 'answer-documentary-unqualified',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: decisionArchive.contentReference, requestDraftReference: '',
      preparedReference: 'prepared-documentary-unqualified', answerSnapshot: legacyArchive.answer,
      answerReference: legacyArchive.answer.reference,
    };
    answerBody.requestDraftReference = hopV55PropertyAdviceRequestDraftReference({
      format: 'hop-v55-property-advice-request-draft-v2', id: legacyArchive.answer.requestSnapshot.id,
      ownerKey: answerBody.ownerKey, workspaceId: answerBody.workspaceId,
      sourceReadingReference: answerBody.sourceReadingReference, preparedReference: answerBody.preparedReference,
      requestSnapshot: legacyArchive.answer.requestSnapshot,
    });
    const answer = { ...answerBody,
      reference: hopAdviceContentReference('hop-v55-documentary-answer-record-v2', answerBody) };
    const repository = createHopV55WorkspaceRepository({ ownerKey: journey.workspace.ownerKey, database: new MemoryDatabase() });
    const saved = await repository.save({ ...journey.workspace, decisionReadings: [decisionArchive], documentaryAnswers: [answer] }, null);
    expect(readDocumentaryAnswerRecord(saved.documentaryAnswers![0])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: answer,
    });

    const altered = structuredClone(saved);
    (altered.documentaryAnswers![0] as Record<string, any>).preparedReference = 'prepared-without-reseal';
    await expect(repository.save(altered, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read(saved.ownerKey, saved.id)).resolves.toEqual(saved);
    repository.close();
  });

  it('préserve les enveloppes futures brutes, refuse leur réécriture et ne migre pas les workspaces anciens', async () => {
    const journey = makeDocumentaryJourney('owner-documentary-future', 'workspace-documentary-future');
    const repository = createHopV55WorkspaceRepository({ ownerKey: journey.workspace.ownerKey, database: new MemoryDatabase() });
    const futureAnswer = { format: 'hop-v55-documentary-answer-record-v99', id: 'future-answer-v99',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: journey.archive.contentReference, opaqueBytes: 'future answer snapshot' };
    const futureAnswerDto = { format: 'hop-v55-documentary-answer-record-v2', id: 'future-answer-dto-v3',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: journey.archive.contentReference, requestDraftReference: 'opaque-draft-ref',
      preparedReference: 'opaque-prepared-ref', answerReference: 'opaque-answer-ref',
      answerSnapshot: { format: 'hop-documentary-answer-v3', opaqueBytes: 'nested future answer DTO' }, reference: 'opaque-envelope-ref' };
    const futureDossier = { format: 'hop-v55-documentary-dossier-record-v99', id: 'future-dossier-v99',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: journey.archive.contentReference, opaqueBytes: 'future dossier snapshot' };
    const futureDossierDto = { format: 'hop-v55-documentary-dossier-record-v2', id: 'future-dossier-dto-v3',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: journey.archive.contentReference, answerRecordReference: 'opaque-answer-record-ref',
      answerReference: 'opaque-answer-ref', dossierReference: 'opaque-dossier-ref',
      dossierSnapshot: { format: 'hop-documentary-dossier-v3', opaqueBytes: 'nested future dossier DTO' }, reference: 'opaque-dossier-envelope-ref' };
    const saved = await repository.save({ ...journey.workspace,
      documentaryAnswers: [journey.answer, futureAnswer, futureAnswerDto], documentaryDossiers: [futureDossier, futureDossierDto] }, null);
    expect(readHopV55DocumentaryAnswerRecord(saved.documentaryAnswers![0])).toMatchObject({
      status: 'readOnly', record: { reference: journey.answer.reference },
    });
    expect(readHopV55DocumentaryAnswerRecord(saved.documentaryAnswers![1])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureAnswer,
    });
    expect(readHopV55DocumentaryDossierRecord(saved.documentaryDossiers![0])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureDossier,
    });
    expect(readHopV55DocumentaryAnswerRecord(saved.documentaryAnswers![2])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureAnswerDto,
    });
    expect(readHopV55DocumentaryDossierRecord(saved.documentaryDossiers![1])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureDossierDto,
    });
    const titleEdit = structuredClone(saved);
    titleEdit.title = 'Métadonnée modifiée, payload futur préservé';
    const preserved = await repository.save(titleEdit, saved.revision);
    expect(preserved.documentaryAnswers).toEqual([journey.answer, futureAnswer, futureAnswerDto]);
    expect(preserved.documentaryDossiers).toEqual([futureDossier, futureDossierDto]);
    await expect(repository.save({ ...preserved, documentaryDossiers: [
      ...(preserved.documentaryDossiers ?? []), makeDossier(journey.answer),
    ] }, preserved.revision)).rejects.toMatchObject({ code: 'unsupportedFormat' });
    const removedFuture = structuredClone(preserved);
    removedFuture.documentaryAnswers = [];
    await expect(repository.save(removedFuture, preserved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const oldWorkspace = { ...journey.workspace, id: 'workspace-documentary-legacy', decisionReadings: undefined };
    delete (oldWorkspace as Partial<HopV55Workspace>).documentaryAnswers;
    delete (oldWorkspace as Partial<HopV55Workspace>).documentaryDossiers;
    const oldSaved = await repository.save(oldWorkspace, null);
    expect(oldSaved).not.toHaveProperty('documentaryAnswers');
    expect(oldSaved).not.toHaveProperty('documentaryDossiers');
    const oldEdit = await repository.save({ ...oldSaved, title: 'Ancien workspace sans migration' }, oldSaved.revision);
    expect(oldEdit).not.toHaveProperty('documentaryAnswers');
    expect(oldEdit).not.toHaveProperty('documentaryDossiers');
    repository.close();
  });
});
