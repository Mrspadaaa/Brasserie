import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as propertyAdviceSchema from '../../src/domain/hopDecision/propertyAdviceSchema';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchive, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  buildHopV55DocumentaryAnswerRecord as buildV1AnswerRecord,
  createHopV55DocumentaryDossierRecord as createV1DossierRecord,
  prepareHopV55DocumentaryRequest,
  readHopV55DocumentaryAnswerRecord as readV1AnswerRecord,
  readHopV55DocumentaryDossierRecord as readV1DossierRecord,
} from '../../src/services/hopV55/documentaryDecision';
import {
  readHopV55DocumentaryAnswerRecord,
  readHopV55DocumentaryDossierRecord,
} from '../../src/services/hopV55/documentaryRecords';
import {
  hopV55PropertyAdviceRequestDraftReference,
  prepareHopV55PropertyAdviceRequestDraft,
  reviseHopV55PropertyAdviceRequestDraft,
  resumeHopV55PropertyAdviceRequestDraft,
} from '../../src/services/hopV55/propertyAdvicePreparation';
import {
  createHopV55PropertyAdviceAnswerRecord,
  createHopV55PropertyAdviceDossierRecord,
} from '../../src/services/hopV55/propertyAdviceRecords';
import { buildHopPropertyAdvice, buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntent, HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import {
  reexamineHopV55PropertyAdviceRequestDraftV3,
  upgradeHopV55PropertyAdviceRequestDraftV2ToV3,
  hopV55PropertyAdviceRequestDraftReferenceV3,
} from '../../src/services/hopV55/propertyAdvicePreparationV3';
import {
  createHopV55PropertyAdviceAnswerRecordV3,
  createHopV55PropertyAdviceDossierRecordV3,
  readHopV55PropertyAdviceAnswerRecordV3,
  readHopV55PropertyAdviceDossierRecordV3,
} from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';

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
  close() { /* Memory-only service contract test. */ }
}

const question = 'Ma bière est trop sucrée. Quel équilibre le houblon peut-il examiner ?';
const ownerKey = 'owner-documentary-records-v2';
const workspaceId = 'workspace-documentary-records-v2';

function makeSweetnessIntents(): HopPropertyAdviceIntent[] {
  const observationStart = question.indexOf('trop sucrée');
  const investigationStart = question.indexOf('équilibre');
  const subject = { kind: 'beer' as const, label: 'Bière synthétique du test', materialId: null, sensoryContext: 'beer' as const };
  return [
    { id: 'intent-sweetness-reported', property: 'sweetness', label: 'trop sucrée', role: 'reportedObservation', direction: null,
      qualification: 'Excès perçu rapporté, aucune mesure analytique.', required: true,
      comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory', subject: structuredClone(subject),
      sourceSpans: [{ start: observationStart, end: observationStart + 'trop sucrée'.length, text: 'trop sucrée' }],
      interpretationOrigin: 'user', basis: 'Rapport de fixture explicite, pas une mesure.', relatedIntentIds: ['intent-sweetness-goal', 'intent-sweetness-investigation'] },
    { id: 'intent-sweetness-goal', property: 'sweetness', label: 'réduire la douceur perçue', role: 'target', direction: 'decrease',
      qualification: 'Comparer une baisse qualitative, sans valeur actuelle supposée.', required: true,
      comparisonBasis: { kind: 'current', assertionIds: [] }, metric: 'sensory', subject: structuredClone(subject),
      sourceSpans: [{ start: observationStart, end: observationStart + 'trop sucrée'.length, text: 'trop sucrée' }],
      interpretationOrigin: 'user', basis: 'Objectif qualitatif explicitement corrigé par le brasseur.', relatedIntentIds: ['intent-sweetness-reported', 'intent-sweetness-investigation'] },
    { id: 'intent-sweetness-investigation', property: 'sweetness', label: 'équilibre', role: 'investigation', direction: 'investigate',
      qualification: 'Examiner les voies sans décider qu’une cible est atteinte.', required: true,
      comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory', subject: structuredClone(subject),
      sourceSpans: [{ start: investigationStart, end: investigationStart + 'équilibre'.length, text: 'équilibre' }],
      interpretationOrigin: 'user', basis: 'Question de fixture distincte de l’observation rapportée.', relatedIntentIds: ['intent-sweetness-goal'] },
  ];
}

function makeRecords(scope: { ownerKey?: string; workspaceId?: string } = {}) {
  const recordOwnerKey = scope.ownerKey ?? ownerKey;
  const recordWorkspaceId = scope.workspaceId ?? workspaceId;
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const parsedReading = readHopV55Question(question, prepared);
  if (!parsedReading.response) throw new Error('La lecture V1 de fixture doit produire sa réponse canonique.');
  const archivedV1Reading = { intent: structuredClone(parsedReading.intent), interpretation: parsedReading.interpretation,
    response: structuredClone(parsedReading.response), branches: structuredClone(parsedReading.branches), unresolved: structuredClone(parsedReading.unresolved) };
  const readingArchive = createHopV55DecisionReadingArchive({ id: 'reading-sweetness-v1', ownerKey: recordOwnerKey, workspaceId: recordWorkspaceId,
    recordedAt: '2026-10-03T08:00:00.000Z', reading: archivedV1Reading,
    source: { kind: 'recipe', id: context.recipe!.id }, runtimeReference: 'runtime-sweetness-v1' });
  const v1Draft = prepareHopV55DocumentaryRequest({ reading: parsedReading, prepared, requestId: 'request-sweetness-v1',
    ownerKey: recordOwnerKey, workspaceId: recordWorkspaceId, sourceReadingReference: readingArchive.contentReference });
  const v1Answer = buildV1AnswerRecord({ draft: v1Draft, prepared, answerRecordId: 'answer-sweetness-v1' });
  const v1Route = v1Answer.answerSnapshot.routes[0];
  if (!v1Route) throw new Error('La réponse V1 de fixture doit avoir une route documentaire conservable.');
  const v1Dossier = createV1DossierRecord({ answerRecord: v1Answer, dossierId: 'dossier-sweetness-v1',
    expectedAnswerReference: v1Answer.answerReference,
    expectedInterpretationReference: v1Answer.answerSnapshot.interpretationReference,
    routeId: v1Route.id, expectedRouteReference: v1Route.reference,
    motive: 'Conserver le choix de route V1 exact avant la migration explicite.',
    createdAt: '2026-10-03T08:01:00.000Z', createdBy: { origin: 'fixture', label: 'Fixture locale' },
  });

  const propertyReading: HopV55QuestionReading = {
    intent: { question, criteria: [] }, criterionDrafts: [],
    interpretation: 'Question V2 corrigée avec rôles et bases explicites.', branches: [], unresolved: [],
  };
  const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucun candidat matière choisi dans cette fixture.' };
  const v2Draft = prepareHopV55PropertyAdviceRequestDraft({ reading: propertyReading, prepared,
    requestId: 'request-sweetness-v2', ownerKey: recordOwnerKey, workspaceId: recordWorkspaceId,
    sourceReadingReference: readingArchive.contentReference, candidatePolicy: policy,
    propertyIntents: makeSweetnessIntents() });
  const v2AnswerSnapshot = buildHopPropertyAdvice(v2Draft.requestSnapshot);
  const revisionContext = { sourceAnswerRecordReference: v1Answer.reference, sourceAnswerReference: v1Answer.answerReference,
    reason: 'Passage explicite vers des propriétés, rôles et bases V2.',
    recordedAt: '2026-10-03T08:02:00.000Z', recordedBy: { origin: 'user' as const, label: 'Brasseur de fixture' } };
  const v2Answer = createHopV55PropertyAdviceAnswerRecord({ draft: v2Draft, prepared, answerSnapshot: v2AnswerSnapshot,
    answerRecordId: 'answer-sweetness-v2', revisionContext });
  const strategy = v2Answer.answerSnapshot.strategies.find(row => row.kind === 'sweetness-balance');
  if (!strategy) throw new Error('La fixture V2 doit conserver une stratégie documentaire liée à la douceur rapportée.');
  const v2Dossier = createHopV55PropertyAdviceDossierRecord({ answerRecord: v2Answer, dossierId: 'dossier-sweetness-v2',
    expectedAnswerReference: v2Answer.answerReference,
    expectedInterpretationReference: v2Answer.answerSnapshot.interpretationReference,
    strategyId: strategy.id, expectedStrategyReference: strategy.reference,
    motive: 'Conserver la stratégie V2 de compensation avec ses limites documentaires.',
    createdAt: '2026-10-03T08:03:00.000Z', createdBy: { origin: 'fixture', label: 'Fixture locale' },
  });

  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: recordWorkspaceId, ownerKey: recordOwnerKey, revision: 0,
    title: 'Conseil documentaire synthétique · V1 puis V2',
    intent: { question, criteria: [] }, sourceRecipeId: context.recipe!.id,
    decisionReadings: [readingArchive], scenarioIds: [], referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-03T08:00:00.000Z',
  };
  return { context, prepared, readingArchive, v1Draft, v1Answer, v1Dossier, v2Draft, v2AnswerSnapshot, v2Answer, v2Dossier, workspace };
}

function futureEnvelopeRecords(journey: ReturnType<typeof makeRecords>) {
  const scopeOwnerKey = journey.workspace.ownerKey;
  const scopeWorkspaceId = journey.workspace.id;
  const futureAnswer = { format: 'hop-v55-documentary-answer-record-v99', id: 'answer-future-v99',
    ownerKey: scopeOwnerKey, workspaceId: scopeWorkspaceId, sourceReadingReference: journey.readingArchive.contentReference, opaqueBytes: 'answer v3 bytes' };
  const futureAnswerDto = { format: 'hop-v55-documentary-answer-record-v2', id: 'answer-v2-future-domain',
    ownerKey: scopeOwnerKey, workspaceId: scopeWorkspaceId, sourceReadingReference: journey.readingArchive.contentReference,
    requestDraftReference: 'opaque-request-draft', preparedReference: 'opaque-prepared', answerReference: 'opaque-domain-answer',
    answerSnapshot: { format: 'hop-documentary-answer-v3', opaqueBytes: 'domain answer v3 bytes' }, reference: 'opaque-answer-envelope' };
  const futureDossier = { format: 'hop-v55-documentary-dossier-record-v99', id: 'dossier-future-v99',
    ownerKey: scopeOwnerKey, workspaceId: scopeWorkspaceId, sourceReadingReference: journey.readingArchive.contentReference, opaqueBytes: 'dossier v3 bytes' };
  const futureDossierDto = { format: 'hop-v55-documentary-dossier-record-v2', id: 'dossier-v2-future-domain',
    ownerKey: scopeOwnerKey, workspaceId: scopeWorkspaceId, sourceReadingReference: journey.readingArchive.contentReference,
    answerRecordReference: journey.v2Answer.reference, answerReference: journey.v2Answer.answerReference,
    strategyId: 'opaque-strategy', strategyReference: 'opaque-strategy-reference', dossierReference: 'opaque-domain-dossier',
    dossierSnapshot: { format: 'hop-documentary-dossier-v3', opaqueBytes: 'domain dossier v3 bytes' }, reference: 'opaque-dossier-envelope' };
  return { futureAnswer, futureAnswerDto, futureDossier, futureDossierDto };
}

function knownUnqualifiedV2Envelopes() {
  const path = new URL('../fixtures/public-history/legacy-measurement-01.json', import.meta.url);
  const archive = JSON.parse(readFileSync(path, 'utf8')) as { answer: Record<string, any>; dossier: Record<string, any> };
  const answerBody = {
    format: 'hop-v55-documentary-answer-record-v2', id: 'envelope-measurement-history-answer',
    ownerKey: 'owner-measurement-history-envelope', workspaceId: 'workspace-measurement-history-envelope',
    sourceReadingReference: 'reading-measurement-history-envelope', requestDraftReference: '',
    preparedReference: 'prepared-measurement-history-envelope', answerSnapshot: archive.answer,
    answerReference: archive.answer.reference,
  };
  answerBody.requestDraftReference = hopV55PropertyAdviceRequestDraftReference({
    format: 'hop-v55-property-advice-request-draft-v2', id: archive.answer.requestSnapshot.id,
    ownerKey: answerBody.ownerKey, workspaceId: answerBody.workspaceId,
    sourceReadingReference: answerBody.sourceReadingReference, preparedReference: answerBody.preparedReference,
    requestSnapshot: archive.answer.requestSnapshot,
  });
  const answer = { ...answerBody,
    reference: hopAdviceContentReference('hop-v55-documentary-answer-record-v2', answerBody) };
  const dossierBody = {
    format: 'hop-v55-documentary-dossier-record-v2', id: archive.dossier.id,
    ownerKey: answer.ownerKey, workspaceId: answer.workspaceId, sourceReadingReference: answer.sourceReadingReference,
    answerRecordReference: answer.reference, answerReference: answer.answerReference,
    strategyId: archive.dossier.strategyId, strategyReference: archive.dossier.strategyReference,
    dossierSnapshot: archive.dossier, dossierReference: archive.dossier.reference,
  };
  const dossier = { ...dossierBody,
    reference: hopAdviceContentReference('hop-v55-documentary-dossier-record-v2', dossierBody) };
  return { answer, dossier };
}

function historicalMetricV3Envelopes(metric: 'pH' | 'analyticalBU') {
  const path = new URL('../fixtures/public-history/historique-metric-v3-06.json', import.meta.url);
  const history = JSON.parse(readFileSync(path, 'utf8')) as { rows: Array<{ metric: string; answer: Record<string, any>; dossier: Record<string, any> }> };
  const oldRow = history.rows.find(row => row.metric === metric);
  const oldAnswer = oldRow?.answer;
  const oldDossier = oldRow?.dossier;
  if (!oldAnswer || !oldDossier) throw new Error(`L’archive historique V3 ${metric} doit rester disponible.`);
  const suffix = metric === 'pH' ? 'ph' : 'bu';
  const answerBody = {
    format: 'hop-v55-documentary-answer-record-v3', id: `envelope-r05-${suffix}-answer-v3`,
    ownerKey: `owner-r05-v3-envelope-${suffix}`, workspaceId: `workspace-r05-v3-envelope-${suffix}`,
    sourceReadingReference: `reading-r05-v3-envelope-${suffix}`, requestDraftReference: '',
    preparedReference: `prepared-r05-v3-envelope-${suffix}`, answerSnapshot: oldAnswer,
    answerReference: oldAnswer.reference,
  };
  answerBody.requestDraftReference = hopV55PropertyAdviceRequestDraftReferenceV3({
    format: 'hop-v55-property-advice-request-draft-v3', id: oldAnswer.requestSnapshot.id,
    ownerKey: answerBody.ownerKey, workspaceId: answerBody.workspaceId,
    sourceReadingReference: answerBody.sourceReadingReference, preparedReference: answerBody.preparedReference,
    requestSnapshot: oldAnswer.requestSnapshot,
  });
  const answer = { ...answerBody,
    reference: hopAdviceContentReference('hop-v55-documentary-answer-record-v3', answerBody) };
  const dossierBody = {
    format: 'hop-v55-documentary-dossier-record-v3', id: oldDossier.id,
    ownerKey: answer.ownerKey, workspaceId: answer.workspaceId, sourceReadingReference: answer.sourceReadingReference,
    answerRecordReference: answer.reference, answerReference: oldDossier.answerReference,
    strategyId: oldDossier.strategyId, strategyReference: oldDossier.strategyReference,
    dossierSnapshot: oldDossier, dossierReference: oldDossier.reference,
  };
  const dossier = { ...dossierBody,
    reference: hopAdviceContentReference('hop-v55-documentary-dossier-record-v3', dossierBody) };
  return { answer, dossier };
}

describe('Enveloppes documentaires V1/V2 dans les mêmes collections workspace', () => {
  it('dispatch V1 byte-à-byte inchangé, migre explicitement la tête vers V2, puis garde le dossier V1 lié à sa route', async () => {
    const journey = makeRecords();
    const directV1 = readV1AnswerRecord(journey.v1Answer);
    const dispatchV1 = readHopV55DocumentaryAnswerRecord(journey.v1Answer);
    expect(directV1).toMatchObject({ status: 'readOnly', record: journey.v1Answer });
    expect(dispatchV1).toMatchObject({ status: 'readOnly', version: 'v1', record: journey.v1Answer });
    expect(JSON.stringify(directV1.status === 'readOnly' && directV1.record)).toBe(JSON.stringify(dispatchV1.status === 'readOnly' && dispatchV1.record));
    const directV1Dossier = readV1DossierRecord(journey.v1Dossier);
    const dispatchV1Dossier = readHopV55DocumentaryDossierRecord(journey.v1Dossier);
    expect(directV1Dossier).toMatchObject({ status: 'readOnly', record: journey.v1Dossier });
    expect(dispatchV1Dossier).toMatchObject({ status: 'readOnly', version: 'v1', record: journey.v1Dossier });
    expect(JSON.stringify(directV1Dossier.status === 'readOnly' && directV1Dossier.record))
      .toBe(JSON.stringify(dispatchV1Dossier.status === 'readOnly' && dispatchV1Dossier.record));

    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
    const opened = await repository.save(journey.workspace, null);
    const withV1 = await repository.save({ ...opened, documentaryAnswers: [journey.v1Answer] }, opened.revision);
    const withV1Dossier = await repository.save({ ...withV1, documentaryDossiers: [journey.v1Dossier] }, withV1.revision);
    const intervening = await repository.save({ ...withV1Dossier, title: 'Révision entre deux CAS' }, withV1Dossier.revision);
    const staleCandidate = { ...withV1Dossier,
      documentaryAnswers: [...withV1Dossier.documentaryAnswers!, journey.v2Answer] };
    await expect(repository.save(staleCandidate, withV1Dossier.revision)).rejects.toMatchObject({ code: 'staleRevision' });
    await expect(repository.read(ownerKey, journey.workspace.id)).resolves.toMatchObject({ revision: intervening.revision,
      documentaryAnswers: [journey.v1Answer], documentaryDossiers: [journey.v1Dossier] });

    // Retry uses the very same sealed envelope; it does not call the domain builder again.
    const buildAdvice = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdvice');
    const createAdviceDossier = vi.spyOn(propertyAdviceSchema, 'createHopPropertyAdviceDossier');
    const withV2 = await repository.save({ ...intervening,
      documentaryAnswers: [...intervening.documentaryAnswers!, journey.v2Answer] }, intervening.revision);
    expect(withV2.documentaryAnswers).toEqual([journey.v1Answer, journey.v2Answer]);
    expect(journey.v2Draft.requestSnapshot.candidatePolicy).toMatchObject({ kind: 'explicit', materialIds: [] });
    expect(journey.v2Answer.answerSnapshot.requestSnapshot.candidatePolicy).toEqual(journey.v2Draft.requestSnapshot.candidatePolicy);
    expect(readHopV55DocumentaryAnswerRecord(withV2.documentaryAnswers![0])).toMatchObject({ status: 'readOnly', version: 'v1' });
    expect(readHopV55DocumentaryAnswerRecord(withV2.documentaryAnswers![1])).toMatchObject({ status: 'readOnly', version: 'v2',
      record: { revisionContext: { sourceAnswerRecordReference: journey.v1Answer.reference,
        sourceAnswerReference: journey.v1Answer.answerReference } } });

    await expect(repository.save({ ...withV2, documentaryDossiers: [...withV2.documentaryDossiers!, journey.v2Dossier] }, withV2.revision))
      .resolves.toMatchObject({ documentaryDossiers: [journey.v1Dossier, journey.v2Dossier] });
    const reloaded = await repository.read(ownerKey, journey.workspace.id);
    expect(reloaded?.documentaryAnswers).toEqual([journey.v1Answer, journey.v2Answer]);
    expect(reloaded?.documentaryDossiers).toEqual([journey.v1Dossier, journey.v2Dossier]);
    expect(readHopV55DocumentaryDossierRecord(reloaded!.documentaryDossiers![0])).toMatchObject({
      status: 'readOnly', version: 'v1', record: { dossierSnapshot: { routeId: journey.v1Dossier.dossierSnapshot.routeId } },
    });
    expect(readHopV55DocumentaryDossierRecord(reloaded!.documentaryDossiers![1])).toMatchObject({
      status: 'readOnly', version: 'v2', record: { strategyId: journey.v2Dossier.strategyId,
        strategyReference: journey.v2Dossier.strategyReference, dossierSnapshot: { preparation: { operational: { status: 'notProvided' } } } },
    });
    const reloadedV2Answer = readHopV55DocumentaryAnswerRecord(reloaded!.documentaryAnswers![1]);
    if (reloadedV2Answer.status !== 'readOnly' || reloadedV2Answer.version !== 'v2') {
      throw new Error('La réponse V2 archivée doit pouvoir reprendre son requestSnapshot exact.');
    }
    const resumedDraft = resumeHopV55PropertyAdviceRequestDraft({
      source: {
        id: reloadedV2Answer.record.id,
        ownerKey: reloadedV2Answer.record.ownerKey,
        workspaceId: reloadedV2Answer.record.workspaceId,
        sourceReadingReference: reloadedV2Answer.record.sourceReadingReference,
        preparedReference: reloadedV2Answer.record.preparedReference,
        requestDraftReference: reloadedV2Answer.record.requestDraftReference,
        requestSnapshot: reloadedV2Answer.record.answerSnapshot.requestSnapshot,
      },
      prepared: journey.prepared,
    });
    expect(resumedDraft.reference).toBe(reloadedV2Answer.record.requestDraftReference);
    expect(resumedDraft.requestSnapshot).toEqual(reloadedV2Answer.record.answerSnapshot.requestSnapshot);
    expect(buildAdvice).not.toHaveBeenCalled();
    expect(createAdviceDossier).not.toHaveBeenCalled();
    expect(reloaded?.scenarioIds).toEqual([]);
    expect(reloaded?.copies).toEqual([]);
    expect(reloaded).not.toHaveProperty('serverScenarioReceipts');
    repository.close();
  });

  it('scelle un réexamen V2 depuis une réponse historique d’une autre lecture, sans déplacer la tête ni réécrire le préfixe', async () => {
    const journey = makeRecords();
    const reexaminationArchive = createHopV55DecisionReadingArchive({ id: 'reading-sweetness-reexam',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      recordedAt: '2026-10-03T08:05:00.000Z', reading: structuredClone(journey.readingArchive.reading),
      source: structuredClone(journey.readingArchive.source), runtimeReference: 'runtime-sweetness-reexam' });
    const reading: HopV55QuestionReading = {
      intent: structuredClone(journey.readingArchive.reading.intent), criterionDrafts: [],
      interpretation: journey.readingArchive.reading.interpretation,
      branches: structuredClone(journey.readingArchive.reading.branches),
      unresolved: structuredClone(journey.readingArchive.reading.unresolved),
    };
    const draft = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: journey.prepared,
      requestId: 'request-sweetness-reexam', ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: reexaminationArchive.contentReference,
      candidatePolicy: structuredClone(journey.v2Draft.requestSnapshot.candidatePolicy), propertyIntents: makeSweetnessIntents() });
    const answerSnapshot = buildHopPropertyAdvice(draft.requestSnapshot);
    const reexaminationContext = {
      sourceAnswerRecordReference: journey.v1Answer.reference,
      sourceAnswerReference: journey.v1Answer.answerReference,
      sourceReadingReference: journey.v1Answer.sourceReadingReference,
      reason: 'Réexaminer la question depuis une nouvelle archive, en choisissant explicitement une ancienne réponse.',
      recordedAt: '2026-10-03T08:06:00.000Z', recordedBy: { origin: 'user' as const, label: 'Brasseur de fixture' },
    };
    const reexaminedAnswer = createHopV55PropertyAdviceAnswerRecord({ draft, prepared: journey.prepared,
      answerSnapshot, answerRecordId: 'answer-sweetness-reexam', reexaminationContext });
    expect(readHopV55DocumentaryAnswerRecord(reexaminedAnswer)).toMatchObject({
      status: 'readOnly', version: 'v2', record: { reexaminationContext },
    });

    const repository = createHopV55WorkspaceRepository({ ownerKey: journey.workspace.ownerKey, database: new MemoryDatabase() });
    const opened = await repository.save({ ...journey.workspace,
      decisionReadings: [...journey.workspace.decisionReadings!, reexaminationArchive] }, null);
    const withV1 = await repository.save({ ...opened, documentaryAnswers: [journey.v1Answer] }, opened.revision);
    const withV1Dossier = await repository.save({ ...withV1, documentaryDossiers: [journey.v1Dossier] }, withV1.revision);
    const withV2 = await repository.save({ ...withV1Dossier,
      documentaryAnswers: [...withV1Dossier.documentaryAnswers!, journey.v2Answer] }, withV1Dossier.revision);

    const foreignJourney = makeRecords({ ownerKey: 'owner-documentary-reexamination-foreign',
      workspaceId: 'workspace-documentary-reexamination-foreign' });
    const foreignParent = createHopV55PropertyAdviceAnswerRecord({ draft, prepared: journey.prepared, answerSnapshot,
      answerRecordId: 'answer-reexam-foreign-parent', reexaminationContext: { ...reexaminationContext,
        sourceAnswerRecordReference: foreignJourney.v1Answer.reference,
        sourceAnswerReference: foreignJourney.v1Answer.answerReference,
        sourceReadingReference: foreignJourney.v1Answer.sourceReadingReference } });
    await expect(repository.save({ ...withV2,
      documentaryAnswers: [...withV2.documentaryAnswers!, foreignParent] }, withV2.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const wrongReadingLink = createHopV55PropertyAdviceAnswerRecord({ draft, prepared: journey.prepared, answerSnapshot,
      answerRecordId: 'answer-reexam-wrong-reading-link', reexaminationContext: { ...reexaminationContext,
        sourceReadingReference: 'reading-not-the-parent-archive' } });
    await expect(repository.save({ ...withV2,
      documentaryAnswers: [...withV2.documentaryAnswers!, wrongReadingLink] }, withV2.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const tampered = structuredClone(reexaminedAnswer);
    tampered.reexaminationContext!.reason = 'Motif altéré après scellement.';
    expect(() => readHopV55DocumentaryAnswerRecord(tampered)).toThrow(/enveloppe|canonique|altéré/i);
    await expect(repository.save({ ...withV2,
      documentaryAnswers: [...withV2.documentaryAnswers!, tampered] }, withV2.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const sameReadingDraft = prepareHopV55PropertyAdviceRequestDraft({ reading, prepared: journey.prepared,
      requestId: 'request-same-reading-reexam', ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      sourceReadingReference: journey.readingArchive.contentReference,
      candidatePolicy: structuredClone(journey.v2Draft.requestSnapshot.candidatePolicy), propertyIntents: makeSweetnessIntents() });
    const sameReadingAnswer = buildHopPropertyAdvice(sameReadingDraft.requestSnapshot);
    expect(() => createHopV55PropertyAdviceAnswerRecord({ draft: sameReadingDraft, prepared: journey.prepared,
      answerSnapshot: sameReadingAnswer, answerRecordId: 'answer-same-reading-reexam', reexaminationContext }))
      .toThrow(/lecture distincte/i);
    expect(() => createHopV55PropertyAdviceAnswerRecord({ draft, prepared: journey.prepared, answerSnapshot,
      answerRecordId: 'answer-dual-lineage', reexaminationContext,
      revisionContext: { sourceAnswerRecordReference: journey.v2Answer.reference,
        sourceAnswerReference: journey.v2Answer.answerReference, reason: 'Conflit de filiation intentionnel.',
        recordedAt: '2026-10-03T08:07:00.000Z', recordedBy: { origin: 'user', label: 'Brasseur de fixture' } } }))
      .toThrow(/révision et un réexamen/i);

    const saved = await repository.save({ ...withV2,
      documentaryAnswers: [...withV2.documentaryAnswers!, reexaminedAnswer] }, withV2.revision);
    expect(saved.documentaryAnswers).toEqual([journey.v1Answer, journey.v2Answer, reexaminedAnswer]);
    expect(readHopV55DocumentaryAnswerRecord(saved.documentaryAnswers![2])).toMatchObject({
      status: 'readOnly', version: 'v2', record: { sourceReadingReference: reexaminationArchive.contentReference,
        reexaminationContext: { sourceAnswerRecordReference: journey.v1Answer.reference,
          sourceAnswerReference: journey.v1Answer.answerReference, sourceReadingReference: journey.readingArchive.contentReference } },
    });
    const persistedReexam = saved.documentaryAnswers![2];
    const reloadedReexam = readHopV55DocumentaryAnswerRecord(persistedReexam);
    if (reloadedReexam.status !== 'readOnly' || reloadedReexam.version !== 'v2') {
      throw new Error('La réponse de réexamen doit pouvoir reprendre son requestSnapshot V2.');
    }
    const resumedReexamDraft = resumeHopV55PropertyAdviceRequestDraft({ source: {
      ownerKey: reloadedReexam.record.ownerKey, workspaceId: reloadedReexam.record.workspaceId,
      sourceReadingReference: reloadedReexam.record.sourceReadingReference,
      preparedReference: reloadedReexam.record.preparedReference,
      requestDraftReference: reloadedReexam.record.requestDraftReference,
      requestSnapshot: reloadedReexam.record.answerSnapshot.requestSnapshot,
      reexaminationContext: reloadedReexam.record.reexaminationContext,
    }, prepared: journey.prepared });
    expect(resumedReexamDraft.reference).toBe(reloadedReexam.record.requestDraftReference);
    expect(resumedReexamDraft.requestSnapshot).toEqual(reloadedReexam.record.answerSnapshot.requestSnapshot);
    await expect(repository.read(saved.ownerKey, saved.id)).resolves.toMatchObject({
      documentaryAnswers: [journey.v1Answer, journey.v2Answer, reexaminedAnswer],
    });
    repository.close();
  });

  it('scelle la fraîcheur du contexte, la policy et le requestSnapshot canonique exacts', () => {
    const journey = makeRecords();
    const stalePrepared = structuredClone(journey.prepared);
    if (!stalePrepared.runtime.current) throw new Error('La fixture doit contenir son contexte préparé exact.');
    stalePrepared.runtime.current.input.volumeL += 1;
    expect(() => createHopV55PropertyAdviceAnswerRecord({ draft: journey.v2Draft, prepared: stalePrepared,
      answerSnapshot: journey.v2AnswerSnapshot, answerRecordId: 'answer-stale-prepared' })).toThrow(/contexte, les matières ou la policy/i);

    const correctedIntents = journey.v2Draft.requestSnapshot.propertyIntents.map(intent => intent.id === 'intent-sweetness-goal'
      ? { ...intent, qualification: 'Nouvelle qualification déclarée, sans mesure.' } : structuredClone(intent));
    const correctedDraft = reviseHopV55PropertyAdviceRequestDraft({ draft: journey.v2Draft, prepared: journey.prepared,
      propertyIntents: correctedIntents, candidatePolicy: structuredClone(journey.v2Draft.requestSnapshot.candidatePolicy),
      revisionContext: { reason: 'Corriger une qualification sans reparsing.', recordedAt: '2026-10-03T08:04:00.000Z',
        recordedBy: { origin: 'user', label: 'Brasseur de fixture' } } });
    const correctedAnswer = buildHopPropertyAdvice(correctedDraft.requestSnapshot);
    expect(() => createHopV55PropertyAdviceAnswerRecord({ draft: journey.v2Draft, prepared: journey.prepared,
      answerSnapshot: correctedAnswer, answerRecordId: 'answer-corrected-on-wrong-draft' })).toThrow(/requestSnapshot scellé/i);
  });

  it('upgrade V2→V3 explicite, dossier V3 exact, refus des raccourcis et downgrade CAS', async () => {
    const journey = makeRecords();
    const reading = readHopV55Question(question, journey.prepared);
    const v3Intents = journey.v2Draft.requestSnapshot.propertyIntents.map((intent): HopPropertyAdviceIntentV3 => {
      if (intent.id !== 'intent-sweetness-investigation') return structuredClone(intent);
      return { ...structuredClone(intent),
        relatedIntentIds: [...new Set([...intent.relatedIntentIds, 'intent-sweetness-reported'])],
        investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: ['intent-sweetness-reported'] },
      };
    });
    const draftV3 = upgradeHopV55PropertyAdviceRequestDraftV2ToV3({ draft: journey.v2Draft,
      reading, prepared: journey.prepared, requestId: 'request-sweetness-v3',
      sourceReadingReference: journey.readingArchive.contentReference,
      revisionContext: { reason: 'Upgrade explicite pour typer l’investigation de compensation sans créer de cible.',
        recordedAt: '2026-10-03T12:00:00.000Z', recordedBy: { origin: 'user', label: 'Brasseur de fixture' } },
      propertyIntents: v3Intents });
    expect(draftV3.requestSnapshot.format).toBe('hop-documentary-request-v3');
    expect(draftV3.requestSnapshot.propertyIntents.find(intent => intent.id === 'intent-sweetness-investigation'))
      .toMatchObject({ role: 'investigation', direction: 'investigate',
        investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: ['intent-sweetness-reported'] } });
    const answerSnapshotV3 = propertyAdviceDomain.buildHopPropertyAdviceV3(draftV3.requestSnapshot);
    const upgradeLineage = { sourceAnswerRecordReference: journey.v2Answer.reference,
      sourceAnswerReference: journey.v2Answer.answerReference,
      reason: 'Passage explicite de la réponse V2 à la requête V3.',
      recordedAt: '2026-10-03T12:01:00.000Z', recordedBy: { origin: 'user' as const, label: 'Brasseur de fixture' } };
    const answerV3 = createHopV55PropertyAdviceAnswerRecordV3({ draft: draftV3, prepared: journey.prepared,
      answerSnapshot: answerSnapshotV3, answerRecordId: 'answer-sweetness-v3', revisionContext: upgradeLineage });
    expect(readHopV55DocumentaryAnswerRecord(answerV3)).toMatchObject({ status: 'readOnly', version: 'v3', record: answerV3 });
    expect(readHopV55PropertyAdviceAnswerRecordV3(answerV3)).toMatchObject({ status: 'readOnly', record: answerV3 });
    expect(propertyAdviceSchema.readHopPropertyAdviceAnswerV3(journey.v2Answer.answerSnapshot)).toMatchObject({
      status: 'legacyReadOnly', version: 'v2',
    });
    const legacyNestedAnswerBody = {
      format: 'hop-v55-documentary-answer-record-v3', id: 'answer-v3-envelope-with-v2-body',
      ownerKey, workspaceId, sourceReadingReference: journey.readingArchive.contentReference,
      requestDraftReference: draftV3.reference, preparedReference: draftV3.preparedReference,
      answerSnapshot: journey.v2Answer.answerSnapshot, answerReference: journey.v2Answer.answerReference,
    };
    const legacyNestedAnswerRecord = { ...legacyNestedAnswerBody,
      reference: hopAdviceContentReference('hop-v55-documentary-answer-record-v3', legacyNestedAnswerBody) };
    expect(readHopV55DocumentaryAnswerRecord(legacyNestedAnswerRecord)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: legacyNestedAnswerRecord,
    });

    const v3Strategy = answerV3.answerSnapshot.strategies[0];
    if (!v3Strategy) throw new Error('La fixture V3 doit conserver une stratégie documentaire.');
    const dossierV3 = createHopV55PropertyAdviceDossierRecordV3({ answerRecord: answerV3,
      dossierId: 'dossier-sweetness-v3', expectedAnswerReference: answerV3.answerReference,
      expectedInterpretationReference: answerV3.answerSnapshot.interpretationReference,
      strategyId: v3Strategy.id, expectedStrategyReference: v3Strategy.reference,
      motive: 'Conserver le choix V3 exact, sans promotion opérationnelle.',
      createdAt: '2026-10-03T12:02:00.000Z', createdBy: { origin: 'fixture', label: 'Fixture locale' } });
    expect(readHopV55DocumentaryDossierRecord(dossierV3)).toMatchObject({ status: 'readOnly', version: 'v3', record: dossierV3 });
    expect(readHopV55PropertyAdviceDossierRecordV3(dossierV3)).toMatchObject({ status: 'readOnly', record: dossierV3 });
    for (const field of ['ownerKey', 'workspaceId', 'sourceReadingReference', 'requestDraftReference', 'answerReference', 'reference'] as const) {
      const altered = structuredClone(answerV3);
      altered[field] = `${altered[field]}-altéré`;
      expect(altered.answerSnapshot).toEqual(answerV3.answerSnapshot);
      expect(() => readHopV55PropertyAdviceAnswerRecordV3(altered), field).toThrow();
    }
    for (const field of ['ownerKey', 'workspaceId', 'sourceReadingReference', 'answerRecordReference', 'answerReference',
      'strategyId', 'strategyReference', 'dossierReference', 'reference'] as const) {
      const altered = structuredClone(dossierV3);
      altered[field] = `${altered[field]}-altéré`;
      expect(altered.dossierSnapshot).toEqual(dossierV3.dossierSnapshot);
      expect(() => readHopV55PropertyAdviceDossierRecordV3(altered), field).toThrow();
    }
    expect(() => createHopV55PropertyAdviceDossierRecordV3({
      answerRecord: journey.v2Answer as unknown as typeof answerV3, dossierId: 'dossier-v3-from-v2',
      expectedAnswerReference: journey.v2Answer.answerReference,
      expectedInterpretationReference: journey.v2Answer.answerSnapshot.interpretationReference,
      strategyId: journey.v2Dossier.strategyId, expectedStrategyReference: journey.v2Dossier.strategyReference,
      motive: 'Fausse conversion de dossier.', createdAt: '2026-10-03T12:02:30.000Z',
      createdBy: { origin: 'fixture', label: 'Fixture locale' },
    })).toThrow(/V3/i);

    const directV1ToV3 = createHopV55PropertyAdviceAnswerRecordV3({ draft: draftV3, prepared: journey.prepared,
      answerSnapshot: answerSnapshotV3, answerRecordId: 'answer-v3-skipping-v2',
      revisionContext: { ...upgradeLineage, sourceAnswerRecordReference: journey.v1Answer.reference,
        sourceAnswerReference: journey.v1Answer.answerReference } });
    const directRepository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
    const directOpened = await directRepository.save({ ...journey.workspace,
      documentaryAnswers: [journey.v1Answer] }, null);
    await expect(directRepository.save({ ...directOpened,
      documentaryAnswers: [...directOpened.documentaryAnswers!, directV1ToV3] }, directOpened.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });
    directRepository.close();

    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
    const opened = await repository.save(journey.workspace, null);
    const withV1 = await repository.save({ ...opened, documentaryAnswers: [journey.v1Answer] }, opened.revision);
    const withV1Dossier = await repository.save({ ...withV1, documentaryDossiers: [journey.v1Dossier] }, withV1.revision);
    const withV2 = await repository.save({ ...withV1Dossier,
      documentaryAnswers: [...withV1Dossier.documentaryAnswers!, journey.v2Answer] }, withV1Dossier.revision);
    const withV2Dossier = await repository.save({ ...withV2,
      documentaryDossiers: [...withV2.documentaryDossiers!, journey.v2Dossier] }, withV2.revision);

    await expect(repository.save({ ...withV2Dossier, sourceRecipeId: 'recipe-posthoc-source',
      documentaryAnswers: [...withV2Dossier.documentaryAnswers!, answerV3] }, withV2Dossier.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const withV3 = await repository.save({ ...withV2Dossier,
      documentaryAnswers: [...withV2Dossier.documentaryAnswers!, answerV3] }, withV2Dossier.revision);
    expect(withV3.documentaryAnswers).toEqual([journey.v1Answer, journey.v2Answer, answerV3]);
    const withV3Dossier = await repository.save({ ...withV3,
      documentaryDossiers: [...withV3.documentaryDossiers!, dossierV3] }, withV3.revision);

    const downgradeV2 = createHopV55PropertyAdviceAnswerRecord({ draft: journey.v2Draft, prepared: journey.prepared,
      answerSnapshot: journey.v2AnswerSnapshot, answerRecordId: 'answer-sweetness-v2-after-v3',
      revisionContext: journey.v2Answer.revisionContext });
    await expect(repository.save({ ...withV3Dossier,
      documentaryAnswers: [...withV3Dossier.documentaryAnswers!, downgradeV2] }, withV3Dossier.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });
    const secondV2Dossier = createHopV55PropertyAdviceDossierRecord({ answerRecord: journey.v2Answer,
      dossierId: 'dossier-sweetness-v2-after-v3', expectedAnswerReference: journey.v2Answer.answerReference,
      expectedInterpretationReference: journey.v2Answer.answerSnapshot.interpretationReference,
      strategyId: journey.v2Dossier.strategyId, expectedStrategyReference: journey.v2Dossier.strategyReference,
      motive: 'Tentative explicite de rattacher un dossier V2 ancien après V3.',
      createdAt: '2026-10-03T12:03:00.000Z', createdBy: { origin: 'fixture', label: 'Fixture locale' } });
    await expect(repository.save({ ...withV3Dossier,
      documentaryDossiers: [...withV3Dossier.documentaryDossiers!, secondV2Dossier] }, withV3Dossier.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.save({ ...withV2Dossier,
      documentaryAnswers: [...withV2Dossier.documentaryAnswers!, answerV3] }, withV2Dossier.revision))
      .rejects.toMatchObject({ code: 'staleRevision' });
    await expect(repository.read(withV3Dossier.ownerKey, withV3Dossier.id)).resolves.toMatchObject({
      documentaryAnswers: [journey.v1Answer, journey.v2Answer, answerV3],
      documentaryDossiers: [journey.v1Dossier, journey.v2Dossier, dossierV3],
    });
    const reexaminationArchive = createHopV55DecisionReadingArchive({ id: 'reading-sweetness-v3-reexamination',
      ownerKey: journey.workspace.ownerKey, workspaceId: journey.workspace.id,
      recordedAt: '2026-10-03T12:04:00.000Z', reading: structuredClone(journey.readingArchive.reading),
      source: structuredClone(journey.readingArchive.source), runtimeReference: 'runtime-sweetness-v3-reexamination' });
    const withNewReading = await repository.save({ ...withV3Dossier,
      decisionReadings: [...withV3Dossier.decisionReadings!, reexaminationArchive] }, withV3Dossier.revision);
    const reexaminedDraftV3 = reexamineHopV55PropertyAdviceRequestDraftV3({ draft: draftV3, reading,
      prepared: journey.prepared, requestId: 'request-sweetness-v3-reexamined',
      sourceReadingReference: reexaminationArchive.contentReference,
      reexaminationContext: { reason: 'Réexaminer le snapshot V3 sous une archive de lecture distincte.',
        recordedAt: '2026-10-03T12:05:00.000Z', recordedBy: { origin: 'user', label: 'Brasseur de fixture' } } });
    const reexaminedSnapshotV3 = propertyAdviceDomain.buildHopPropertyAdviceV3(reexaminedDraftV3.requestSnapshot);
    const reexaminedAnswerV3 = createHopV55PropertyAdviceAnswerRecordV3({ draft: reexaminedDraftV3,
      prepared: journey.prepared, answerSnapshot: reexaminedSnapshotV3, answerRecordId: 'answer-sweetness-v3-reexamined',
      reexaminationContext: { sourceAnswerRecordReference: answerV3.reference,
        sourceAnswerReference: answerV3.answerReference, sourceReadingReference: answerV3.sourceReadingReference,
        reason: 'Réexamen explicite depuis la réponse V3 exacte.', recordedAt: '2026-10-03T12:06:00.000Z',
        recordedBy: { origin: 'user', label: 'Brasseur de fixture' } } });
    const savedReexamination = await repository.save({ ...withNewReading,
      documentaryAnswers: [...withNewReading.documentaryAnswers!, reexaminedAnswerV3] }, withNewReading.revision);
    expect(savedReexamination.documentaryAnswers).toEqual([journey.v1Answer, journey.v2Answer, answerV3, reexaminedAnswerV3]);
    expect(readHopV55DocumentaryAnswerRecord(savedReexamination.documentaryAnswers![2])).toMatchObject({
      status: 'readOnly', version: 'v3', record: { reference: answerV3.reference },
    });
    expect(readHopV55DocumentaryAnswerRecord(savedReexamination.documentaryAnswers![3])).toMatchObject({
      status: 'readOnly', version: 'v3', record: { sourceReadingReference: reexaminationArchive.contentReference,
        reexaminationContext: { sourceAnswerRecordReference: answerV3.reference,
          sourceAnswerReference: answerV3.answerReference, sourceReadingReference: journey.readingArchive.contentReference } },
    });
    await expect(repository.read(savedReexamination.ownerKey, savedReexamination.id)).resolves.toMatchObject({
      documentaryAnswers: [journey.v1Answer, journey.v2Answer, answerV3, reexaminedAnswerV3],
      documentaryDossiers: [journey.v1Dossier, journey.v2Dossier, dossierV3],
    });
    repository.close();
  });

  it('valide les wrappers autour des anciennes réponses V3 R05 avant le retour raw read-only', () => {
    for (const metric of ['pH', 'analyticalBU'] as const) {
    const { answer, dossier } = historicalMetricV3Envelopes(metric);
    expect(propertyAdviceSchema.readHopPropertyAdviceAnswerV3(answer.answerSnapshot)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: answer.answerSnapshot,
    });
    expect(propertyAdviceSchema.readHopPropertyAdviceDossierV3(dossier.dossierSnapshot)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: dossier.dossierSnapshot,
    });
    expect(readHopV55PropertyAdviceAnswerRecordV3(answer)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: answer,
    });
    expect(readHopV55PropertyAdviceDossierRecordV3(dossier)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: dossier,
    });

    const answerMutations: Array<[string, (record: Record<string, any>) => void]> = [
      ['id', record => { record.id = 'answer-v3-id-altéré'; }],
      ['ownerKey', record => { record.ownerKey = 'owner-v3-étranger'; }],
      ['workspaceId', record => { record.workspaceId = 'workspace-v3-étranger'; }],
      ['sourceReadingReference', record => { record.sourceReadingReference = 'reading-v3-altérée'; }],
      ['requestDraftReference', record => { record.requestDraftReference = 'draft-v3-altéré'; }],
      ['preparedReference', record => { record.preparedReference = 'prepared-v3-altéré'; }],
      ['answerReference', record => { record.answerReference = 'answer-v3-ref-altérée'; }],
      ['reference', record => { record.reference = 'envelope-v3-ref-altérée'; }],
    ];
    for (const [label, mutate] of answerMutations) {
      const altered = structuredClone(answer);
      mutate(altered);
      expect(altered.answerSnapshot).toEqual(answer.answerSnapshot);
      expect(() => readHopV55PropertyAdviceAnswerRecordV3(altered), label).toThrow();
    }
    const alteredAnswerBody = structuredClone(answer);
    alteredAnswerBody.answerSnapshot.body[0].text = `${alteredAnswerBody.answerSnapshot.body[0].text} altéré`;
    expect(() => readHopV55PropertyAdviceAnswerRecordV3(alteredAnswerBody)).toThrow();

    const dossierMutations: Array<[string, (record: Record<string, any>) => void]> = [
      ['id', record => { record.id = 'dossier-v3-id-altéré'; }],
      ['ownerKey', record => { record.ownerKey = 'owner-v3-étranger'; }],
      ['workspaceId', record => { record.workspaceId = 'workspace-v3-étranger'; }],
      ['sourceReadingReference', record => { record.sourceReadingReference = 'reading-v3-altérée'; }],
      ['answerRecordReference', record => { record.answerRecordReference = 'answer-record-v3-altéré'; }],
      ['answerReference', record => { record.answerReference = 'answer-v3-ref-altérée'; }],
      ['strategyId', record => { record.strategyId = 'strategy-v3-altérée'; }],
      ['strategyReference', record => { record.strategyReference = 'strategy-v3-ref-altérée'; }],
      ['dossierReference', record => { record.dossierReference = 'dossier-v3-ref-altérée'; }],
      ['reference', record => { record.reference = 'envelope-v3-ref-altérée'; }],
    ];
    for (const [label, mutate] of dossierMutations) {
      const altered = structuredClone(dossier);
      mutate(altered);
      expect(altered.dossierSnapshot).toEqual(dossier.dossierSnapshot);
      expect(() => readHopV55PropertyAdviceDossierRecordV3(altered), label).toThrow();
    }
    const alteredDossierBody = structuredClone(dossier);
    alteredDossierBody.dossierSnapshot.motive = 'Motif altéré';
    expect(() => readHopV55PropertyAdviceDossierRecordV3(alteredDossierBody)).toThrow();
    }
  });

  it('vérifie les enveloppes V2 connues avant de conserver une mesure historique non qualifiable en lecture seule', () => {
    const { answer, dossier } = knownUnqualifiedV2Envelopes();
    expect(propertyAdviceSchema.readHopPropertyAdviceAnswer(answer.answerSnapshot).status).toBe('unsupportedReadOnly');
    expect(propertyAdviceSchema.readHopPropertyAdviceDossier(dossier.dossierSnapshot).status).toBe('unsupportedReadOnly');
    expect(readHopV55DocumentaryAnswerRecord(answer)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: answer });
    expect(readHopV55DocumentaryDossierRecord(dossier)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: dossier });

    const answerMutations: Array<[string, (record: Record<string, any>) => void]> = [
      ['id', record => { record.id = 'answer-externe-altérée'; }],
      ['ownerKey', record => { record.ownerKey = 'owner-étranger'; }],
      ['workspaceId', record => { record.workspaceId = 'workspace-étranger'; }],
      ['sourceReadingReference', record => { record.sourceReadingReference = 'reading-altérée'; }],
      ['requestDraftReference', record => { record.requestDraftReference = 'draft-altéré'; }],
      ['preparedReference', record => { record.preparedReference = 'prepared-altéré'; }],
      ['answerReference', record => { record.answerReference = 'answer-ref-altérée'; }],
      ['reference', record => { record.reference = 'envelope-ref-altérée'; }],
    ];
    for (const [label, mutate] of answerMutations) {
      const altered = structuredClone(answer);
      mutate(altered);
      expect(altered.answerSnapshot).toEqual(answer.answerSnapshot);
      expect(() => readHopV55DocumentaryAnswerRecord(altered), label).toThrow();
    }

    const dossierMutations: Array<[string, (record: Record<string, any>) => void]> = [
      ['id', record => { record.id = 'dossier-externe-altéré'; }],
      ['ownerKey', record => { record.ownerKey = 'owner-étranger'; }],
      ['workspaceId', record => { record.workspaceId = 'workspace-étranger'; }],
      ['sourceReadingReference', record => { record.sourceReadingReference = 'reading-altérée'; }],
      ['answerRecordReference', record => { record.answerRecordReference = 'answer-record-altéré'; }],
      ['answerReference', record => { record.answerReference = 'answer-ref-altérée'; }],
      ['strategyId', record => { record.strategyId = 'strategy-altérée'; }],
      ['strategyReference', record => { record.strategyReference = 'strategy-ref-altérée'; }],
      ['dossierReference', record => { record.dossierReference = 'dossier-ref-altérée'; }],
      ['reference', record => { record.reference = 'envelope-ref-altérée'; }],
    ];
    for (const [label, mutate] of dossierMutations) {
      const altered = structuredClone(dossier);
      mutate(altered);
      expect(altered.dossierSnapshot).toEqual(dossier.dossierSnapshot);
      expect(() => readHopV55DocumentaryDossierRecord(altered), label).toThrow();
    }
  });

  it('refuse downgrade et conserve envelopes/DTOs futures bruts sans fallback V1/V2', async () => {
    const journey = makeRecords();
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const opened = await repository.save(journey.workspace, null);
    const withV1 = await repository.save({ ...opened, documentaryAnswers: [journey.v1Answer] }, opened.revision);
    const withV1Dossier = await repository.save({ ...withV1, documentaryDossiers: [journey.v1Dossier] }, withV1.revision);
    const withV2 = await repository.save({ ...withV1Dossier,
      documentaryAnswers: [...withV1Dossier.documentaryAnswers!, journey.v2Answer] }, withV1Dossier.revision);
    const withV2Dossier = await repository.save({ ...withV2,
      documentaryDossiers: [...withV2.documentaryDossiers!, journey.v2Dossier] }, withV2.revision);
    const future = futureEnvelopeRecords(journey);
    const withFuture = { ...withV2Dossier,
      documentaryAnswers: [...withV2Dossier.documentaryAnswers!, future.futureAnswer, future.futureAnswerDto],
      documentaryDossiers: [...withV2Dossier.documentaryDossiers!, future.futureDossier, future.futureDossierDto],
    };
    // Simulate a newer application having stored these opaque records. The
    // current writer must preserve them on read but cannot create them itself.
    await database.workspaces.put({ format: 'hop-v55-workspace-envelope-v1', ownerKey,
      workspaceId: journey.workspace.id, revision: withFuture.revision, workspace: structuredClone(withFuture) });
    const loadedFuture = await repository.read(ownerKey, journey.workspace.id);
    if (!loadedFuture) throw new Error('Le workspace futur doit rester consultable.');
    const persistedFuture = loadedFuture;
    expect(readHopV55DocumentaryAnswerRecord(persistedFuture.documentaryAnswers![2])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: future.futureAnswer,
    });
    expect(readHopV55DocumentaryAnswerRecord(persistedFuture.documentaryAnswers![3])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: future.futureAnswerDto,
    });
    expect(readHopV55DocumentaryDossierRecord(persistedFuture.documentaryDossiers![2])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: future.futureDossier,
    });
    expect(readHopV55DocumentaryDossierRecord(persistedFuture.documentaryDossiers![3])).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: future.futureDossierDto,
    });
    const unrelatedEdit = await repository.save({ ...persistedFuture, title: 'Le futur brut reste conservé' }, persistedFuture.revision);
    expect(unrelatedEdit.documentaryAnswers?.slice(-2)).toEqual([future.futureAnswer, future.futureAnswerDto]);
    expect(unrelatedEdit.documentaryDossiers?.slice(-2)).toEqual([future.futureDossier, future.futureDossierDto]);

    const v1Downgrade = buildV1AnswerRecord({ draft: journey.v1Draft, prepared: journey.prepared,
      answerRecordId: 'answer-v1-downgrade' });
    await expect(repository.save({ ...unrelatedEdit,
      documentaryAnswers: [...unrelatedEdit.documentaryAnswers!, v1Downgrade] }, unrelatedEdit.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });
    await expect(repository.read(ownerKey, journey.workspace.id)).resolves.toMatchObject({ revision: unrelatedEdit.revision,
      documentaryAnswers: unrelatedEdit.documentaryAnswers, documentaryDossiers: unrelatedEdit.documentaryDossiers });
    repository.close();
  });
});
