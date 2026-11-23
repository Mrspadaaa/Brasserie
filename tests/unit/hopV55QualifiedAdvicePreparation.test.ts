import { describe, expect, it, vi } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { loadHopCatalogueQualificationInput } from '../../src/domain/hopDecision/catalogueLoader';
import * as qualifiedAdviceModule from '../../src/domain/hopDecision/qualifiedAdvice';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { prepareHopV55QualifiedAdviceStudyV1, inspectHopV55QualifiedAdvicePreparedReferenceV1,
  type HopV55QualifiedAdviceStudyFreshnessInputV1 } from '../../src/services/hopV55/qualifiedStudyPreparation';
import { createHopV55QuestionScopeLedgerV1, projectHopV55QuestionScopeCoverageV1,
  readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import { readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { hopV55Workspace } from '../fixtures/hopV55';

const ownerKey = 'owner:qualified-advice-fixture';
const workspaceId = 'workspace:qualified-advice-fixture';
const recordedAt = '2026-10-03T18:10:00.000Z';
const question = 'Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa.';

function futureInput(): HopV55QualifiedAdviceStudyFreshnessInputV1 {
  const brewerContext = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(brewerContext);
  const { reading, scopeDrafts } = readHopV55QuestionWithScopesV1(question, prepared);
  if (!reading.response || reading.response.actionKind !== 'exploreStrategies') {
    throw new Error('La fixture Q09 doit produire la route exploreStrategies.');
  }
  const transition = { actId: 'act:qualified-advice-scope-create', kind: 'create' as const,
    reason: 'Portées proposées pour la question Q09.', recordedAt, actor: { origin: 'proposal' as const, label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading, scopeDrafts, transition });
  const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:qualified-advice-source', ownerKey, workspaceId,
    recordedAt, reading, source: { kind: 'exploration' }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
    scopeLedger, transition });
  const workspace = hopV55Workspace(ownerKey, workspaceId);
  workspace.decisionReadings = [archive];
  const input: HopV55QualifiedAdviceStudyFreshnessInputV1 = {
    workspace, ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
    expectedRuntimeReference: archive.runtimeReference, sourceContext: null, prepared,
    action: { kind: 'exploreStrategies', situation: {
      stage: 'planning', program: null, materialIds: [], assertions: [], criterionDimensions: [], exclusions: [],
    } },
    catalogueInput: {},
    explicitFutureStage: { kind: 'futureExploration', stage: 'planning', basis: 'Exploration explicitement déclarée pour une recette future.' },
  };
  return input;
}

function identities(recordedAtValue = recordedAt) {
  return { preparationId: 'preparation:q09', dossierId: 'dossier:q09', eventId: 'event:q09', recordedAt: recordedAtValue };
}

describe('préparation Q09 des études qualifiées de stratégie', () => {
  it('conserve la question complète et les IDs candidats explicites dans une étude advice V3', async () => {
    const input = futureInput();
    const catalogue = await loadHopCatalogueQualificationInput({});
    const candidateId = catalogue.variants.find(variant => variant.scope === 'variety')?.material.id;
    if (!candidateId) throw new Error('La fixture catalogue doit contenir au moins une variété chargée.');
    input.action.situation.materialIds = [candidateId];

    const answerBuilder = vi.spyOn(qualifiedAdviceModule, 'answerQualifiedHopAdvice');
    const result = await prepareHopV55QualifiedAdviceStudyV1({ ...input, identity: identities() });

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('La préparation future Q09 explicitement déclarée doit réussir.');
    expect(answerBuilder).toHaveBeenCalledTimes(1);
    expect(result.result.study.kind).toBe('advice');
    expect(result.result.study.formatVersion).toBe(3);
    expect(result.result.format).toBe('hop-v55-qualified-advice-study-preparation-v2');
    expect(result.result.study.requestSnapshot.intent.originalQuestion).toBe(question);
    const sourceResponse = input.workspace.decisionReadings![0];
    if (sourceResponse.format !== 'hop-v55-decision-reading-v3' || sourceResponse.reading.response?.actionKind !== 'exploreStrategies') {
      throw new Error('La fixture doit conserver une réponse Q09 exploreStrategies dans ArchiveV3.');
    }
    expect(result.result.study.requestSnapshot.intent.criteria).toEqual(sourceResponse.reading.response.intent.criteria);
    expect(result.result.scopeCoverage.map(scope => scope.kind)).toEqual(['employmentTiming', 'materialSelection']);
    expect(result.result.scopeCoverage.map(scope => scope.scopeId)).toEqual(sourceResponse.scopeLedger.sourceScopes.map(scope => scope.id));
    expect(result.result.scopeCoverage.every(scope => scope.coverage !== ('answered' as never))).toBe(true);
    expect(result.result.study.requestSnapshot.action.situation).toMatchObject({ program: null, materialIds: [candidateId] });
    expect(result.result.study.requestSnapshot.qualificationInput.variants.some(variant => variant.material.id === candidateId)).toBe(true);
    expect(result.result.preparation.createCommand.kind).toBe('advice');
    expect(result.result.preparation.createCommand.study).toEqual(result.result.study);
    expect(result.result.preparation.studyReference).toBe(result.result.study.reference);
    expect(result.result.preparedReference).toBe(result.result.preparation.preparedReference);

    const reloadedReading = readHopV55DecisionReadingArchive(input.workspace.decisionReadings![0]);
    expect(reloadedReading.status).toBe('available');
    if (reloadedReading.status !== 'available' || reloadedReading.archive.format !== 'hop-v55-decision-reading-v3') {
      throw new Error('La reprojection doit repartir de l’archive V3 scellée.');
    }
    answerBuilder.mockClear();
    const reprojected = projectHopV55QuestionScopeCoverageV1({ ledger: reloadedReading.archive.scopeLedger,
      question: reloadedReading.archive.reading.intent.question, reading: reloadedReading.archive.reading, study: result.result.study });
    expect(reprojected).toEqual(result.result.scopeCoverage);
    expect(answerBuilder).not.toHaveBeenCalled();
    answerBuilder.mockRestore();
  });

  it('l’inspecteur recalcul la fraîcheur sans répondre ni appeler le domaine', async () => {
    const input = futureInput();
    const answerBuilder = vi.spyOn(qualifiedAdviceModule, 'answerQualifiedHopAdvice');
    const inspected = await inspectHopV55QualifiedAdvicePreparedReferenceV1(input);
    expect(inspected.status).toBe('ready');
    if (inspected.status !== 'ready') throw new Error('La source Q09 et les choix courants doivent être inspectables.');
    expect(inspected.sourceReadingReference).toBe(input.sourceReadingReference);
    expect(inspected.sourceRuntimeReference).toBe(input.expectedRuntimeReference);
    expect(inspected.materialIds).toEqual([]);
    expect(inspected.stage).toBe('planning');
    expect(answerBuilder).not.toHaveBeenCalled();
    answerBuilder.mockRestore();
  });

  it('garde le programme et son stade préparés exacts, et refuse un programme divergent sous la même lecture', async () => {
    const brewerContext = makeHopV55FixtureContext('planning');
    const prepared = prepareBrewingScenarioContext(brewerContext);
    const currentProgram = prepared.runtime.current?.program;
    const recipeId = brewerContext.recipe?.id;
    const recipeReference = prepared.runtime.current?.recipeReference;
    if (!currentProgram || !recipeId || !recipeReference || !brewerContext.recipe) {
      throw new Error('La fixture source recette doit charger programme, ID et référence exacts.');
    }
    const reading = readHopV55Question(question, prepared);
    if (!reading.response || reading.response.actionKind !== 'exploreStrategies') throw new Error('La lecture recette doit rester une étude Q09.');
    const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:qualified-advice-recipe', ownerKey, workspaceId,
      recordedAt, reading, source: { kind: 'recipe', id: recipeId }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
    const workspace = hopV55Workspace(ownerKey, workspaceId);
    workspace.sourceRecipeId = recipeId;
    workspace.decisionReadings = [archive];
    const input: HopV55QualifiedAdviceStudyFreshnessInputV1 = {
      workspace, ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
      expectedRuntimeReference: archive.runtimeReference, prepared, catalogueInput: {},
      sourceContext: { kind: 'recipe', recipeId, recipeReference },
      action: { kind: 'exploreStrategies', situation: { stage: currentProgram.stage, program: structuredClone(currentProgram),
        materialIds: [], assertions: [], criterionDimensions: [], exclusions: [] } },
    };
    const ready = await prepareHopV55QualifiedAdviceStudyV1({ ...input, identity: identities('2026-10-03T18:12:00.000Z') });
    expect(ready.status).toBe('ready');
    if (ready.status !== 'ready') throw new Error('Le programme source exact doit être transmissible au conseil.');
    expect(ready.result.format).toBe('hop-v55-qualified-advice-study-preparation-v1');
    expect('scopeCoverage' in ready.result).toBe(false);
    expect(ready.result.study.requestSnapshot.action.situation.program).toEqual(currentProgram);
    expect(ready.result.study.requestSnapshot.action.situation.stage).toBe(currentProgram.stage);

    const divergent = structuredClone(currentProgram);
    if (divergent.additions.length) divergent.additions[0].grams += 1;
    const stale = { ...input, action: { ...input.action, situation: { ...input.action.situation, program: divergent } } };
    expect(await inspectHopV55QualifiedAdvicePreparedReferenceV1(stale))
      .toMatchObject({ status: 'refused', code: 'sourceProgramMismatch' });
  });

  it('refuse de décider le stade planning à partir d’un contexte exploration absent', async () => {
    const input = futureInput();
    delete (input as Partial<HopV55QualifiedAdviceStudyFreshnessInputV1>).explicitFutureStage;
    const result = await prepareHopV55QualifiedAdviceStudyV1({ ...input, identity: identities() });
    expect(result).toMatchObject({ status: 'refused', code: 'unknownStage' });
  });

  it('refuse un scope matériau ou un programme implicite avant le loader/conseil', async () => {
    const input = futureInput();
    delete (input.action.situation as unknown as Record<string, unknown>).materialIds;
    const result = await prepareHopV55QualifiedAdviceStudyV1({ ...input, identity: identities() });
    expect(result).toMatchObject({ status: 'refused', code: 'materialScopeMissing' });

    const programMissing = futureInput();
    delete (programMissing.action.situation as unknown as Record<string, unknown>).program;
    expect(await prepareHopV55QualifiedAdviceStudyV1({ ...programMissing, identity: identities() }))
      .toMatchObject({ status: 'refused', code: 'sourceProgramMismatch' });
  });

  it('refuse une lecture/runtime périmés et ne laisse pas requalifier un batch en exploration future', async () => {
    const stale = futureInput();
    stale.expectedRuntimeReference = 'runtime:stale';
    expect(await inspectHopV55QualifiedAdvicePreparedReferenceV1(stale))
      .toMatchObject({ status: 'refused', code: 'runtimeReferenceStale' });

    const physical = futureInput();
    const rawArchive = physical.workspace.decisionReadings![0];
    const reading = readHopV55Question(question, physical.prepared);
    const batchId = 'batch:q09-physical';
    const sourceBatch = createHopV55DecisionReadingArchiveV2({ id: 'reading:q09-batch', ownerKey, workspaceId, recordedAt,
      reading, source: { kind: 'batch', id: batchId }, runtimeReference: physical.expectedRuntimeReference });
    physical.workspace.decisionReadings = [sourceBatch];
    physical.workspace.sourceBatchId = batchId;
    physical.sourceReadingReference = sourceBatch.contentReference;
    physical.sourceContext = { kind: 'batch', batchId, recipeId: 'recipe:q09', recipeSnapshotReference: 'recipe-snapshot:q09',
      brewDayRevision: 8, programFingerprint: 'program:q09', stage: 'fermenting' };
    physical.action.situation.stage = 'planning';
    expect(rawArchive.contentReference).not.toBe(sourceBatch.contentReference);
    expect(await prepareHopV55QualifiedAdviceStudyV1({ ...physical,
      explicitFutureStage: { kind: 'futureExploration', stage: 'planning', basis: 'Demande de planning synthétique.' },
      identity: identities('2026-10-03T18:11:00.000Z') })).toMatchObject({ status: 'refused', code: 'futureStageNotAllowed' });
  });
});
