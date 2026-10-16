import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../../src/App';
import type { HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../../functions/src/hopPredictionSchema';
import type { Recipe, Batch } from '../../../src/types';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';
import { StorageService } from '../../../src/services/storage';
import { FirestoreRepo, qaMetrics, seedQa } from '../hop-recipe/repo';
import { qaCalls, qaInputs } from '../hop-recipe/functions';
import { createBrewingScenarioLocalRepository } from '../../../src/services/brewingScenarioLocalRepository';
import { createHopV55WorkspaceRepository } from '../../../src/services/hopV55/workspaceRepository';
import { guidePredictionKnowledge, loadGuideVarieties } from '../../../src/ui/hopIndex/guideData';
import { prepareBrewingScenarioContext } from '../../../src/domain/brewingScenarioContext';
import { buildHopPropertyAdviceV3 } from '../../../src/domain/hopDecision/propertyAdvice';
import { makeHopV55FixtureContext } from '../../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2 } from '../../../src/services/hopV55/decisionArchive';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../../src/services/hopV55/propertyAdviceRecordsV3';
import { upgradeV3ToV4 } from '../../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV4 } from '../../../src/services/hopV55/propertyAdviceRecordsV4';
import yeastCatalogue from '../../../src/data/yeastCatalogueBootstrap.json';
import '../../../src/index.css';

const QA_OWNER = 'hop-v55-browser-qa-owner';
const SCENARIO_DATABASE = 'laffinee-hop-v55-local-scenarios-v1';
const WORKSPACE_DATABASE = 'laffinee-hop-v55-local-workspaces-v1';
const fixtureSource: HopSource = {
  title: 'Fixture synthétique · contrôle V5.5',
  author: 'Banc QA local',
  year: 2026,
  kind: 'judgment',
  reference: 'tests/qa/hop-v55-app/main.tsx',
  locator: 'Identité et description artificielles, sans analyse ni recommandation commerciale.',
};
const qaVariety: HopVariety = {
  id: 'qa-v55-vallon-7',
  name: 'Houblon QA Vallon 7',
  aliases: ['Vallon 7 QA'],
  form: 'unknown',
  descriptions: [{
    text: 'Description artificielle pour vérifier le parcours local de l’atelier.',
    context: 'rawHop',
    source: fixtureSource,
  }],
  analysis: [],
};

function makeRecipe(id = 'QA-V55-RECIPE', name = 'Recette fixture V5.5', volumeL = 20, hopGrams = 20): Recipe {
  return {
    id,
    name,
    style: id === 'QA-V55-RECIPE' ? 'Style artificiel QA A' : 'Style artificiel QA B',
    volumeL,
    ogTarget: null,
    fgTarget: null,
    abvTarget: null,
    fermentables: [{
      name: 'Malt de contrôle',
      weightKg: 4,
      kind: 'grain',
      use: 'empatage',
      colorEbc: 5,
      potentialPpg: 36,
      fermentabilityPct: 75,
    }],
    totalGristKg: 4,
    hops: [{
      name: qaVariety.name,
      hopVarietyId: qaVariety.id,
      weightG: hopGrams,
      alpha: 5,
      stage: 'dryHop',
      dayOffset: 2,
      aromaTiming: 'postFermentation',
      aromaTemperatureC: 12,
      aromaContactHours: 48,
    }],
    yeast: { name: 'Culture QA non résolue', form: 'sèche', qty: 1, unit: 'sachet' },
    boilMin: 60,
    mash: {
      ratioLPerKg: 3,
      steps: [{ name: 'Empâtage fixture', tempC: 66, durationMin: 60 }],
      mashoutTempC: 76,
      spargeTempC: 76,
      spargeType: 'batch',
    },
    fermentation: [{ kind: 'primaire', name: 'Fermentation fixture', tempC: 18, days: 7 }],
    steps: [],
    notes: [],
  };
}

let fixtureSeeded = false;
async function seedFixtures() {
  if (fixtureSeeded) {
    return {
      recipeId: 'QA-V55-RECIPE',
      recipeBId: 'QA-V55-RECIPE-B',
      batchId: 'QA-V55-BATCH',
      recipeName: makeRecipe().name,
      recipeBName: makeRecipe('QA-V55-RECIPE-B', 'Recette fixture B', 12, 15).name,
    };
  }
  const recipe = makeRecipe();
  const recipeB = makeRecipe('QA-V55-RECIPE-B', 'Recette fixture B', 12, 15);
  StorageService.addRecipe(recipe);
  StorageService.addRecipe(recipeB);
  const planned = StorageService.planRecipeBatch(recipe, 'QA-V55-BATCH', '2026-10-02');
  const activeBatch: Batch = {
    ...planned,
    id: 'QA-V55-BATCH',
    status: 'planifie',
    brewDate: '',
  };
  StorageService.updateBatch(activeBatch);
  fixtureSeeded = true;
  return { recipeId: recipe.id, recipeBId: recipeB.id, batchId: activeBatch.id, recipeName: recipe.name, recipeBName: recipeB.name };
}

const HISTORICAL_WORKSPACE_ID = 'qa-v55-historical-property-advice';
const HISTORICAL_TITLE = 'Réponse historique fixture · archive V2';
const HISTORICAL_QUESTION = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';

/**
 * Additive seed: a no-source workspace written by the real repository, holding a documentary answer read on a
 * historical V2 archive (V3 record explicitly upgraded to V4), as older versions of the app stored it. Every
 * record comes from the real domain constructors; nothing is resealed by hand. Idempotent.
 */
async function seedHistoricalPropertyAdvice() {
  const repository = createHopV55WorkspaceRepository({ ownerKey: QA_OWNER, databaseName: WORKSPACE_DATABASE });
  try {
    const existing = await repository.read(QA_OWNER, HISTORICAL_WORKSPACE_ID);
    if (!existing) {
      const recordedAt = '2026-09-20T10:00:00.000Z';
      const context = makeHopV55FixtureContext('planning');
      context.journal = { ...(context.journal ?? {}), revision: 1, readings: [] };
      const prepared = prepareBrewingScenarioContext(context);
      const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:qa-historical-v2', ownerKey: QA_OWNER,
        workspaceId: HISTORICAL_WORKSPACE_ID, recordedAt, reading: readHopV55Question(HISTORICAL_QUESTION, prepared),
        source: { kind: 'exploration' }, runtimeReference: 'runtime:qa-historical-v2' });
      const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture QA.' };
      const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: archive.reading, prepared,
        requestId: 'request:qa-historical-v3', ownerKey: QA_OWNER, workspaceId: HISTORICAL_WORKSPACE_ID,
        sourceReadingReference: archive.contentReference, candidatePolicy: policy });
      const answerV3 = buildHopPropertyAdviceV3(draft.requestSnapshot);
      const v3Record = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot: answerV3,
        answerRecordId: 'answer:qa-historical-v3' });
      const upgraded = upgradeV3ToV4({ sourceRecord: v3Record, sourceReadingArchive: archive, prepared,
        recordId: 'record:qa-historical-v4', requestId: 'request:qa-historical-v4', cultureBinding: null,
        transition: { kind: 'upgradeV3', actId: 'act:qa-historical-upgrade', parentRecordReference: v3Record.reference,
          parentReadingReference: archive.contentReference, reason: 'Reprise explicite de la réponse historique (fixture QA).',
          actor: { origin: 'user', label: 'Brasseur QA' }, recordedAt } });
      if (upgraded.status !== 'ready') throw new Error('La fixture historique doit garder des intentions actives.');
      const answerV4 = buildHopPropertyAdviceV3(upgraded.requestDraftV3.requestSnapshot);
      const v4Record = createHopV55PropertyAdviceAnswerRecordV4({ draft: upgraded.recordDraft, outcome: { kind: 'domainAnswer',
        requestDraftReference: upgraded.requestDraftV3.reference, answerSnapshot: answerV4, answerReference: answerV4.reference } });
      await repository.save({ format: 'hop-v55-workspace-v1', id: HISTORICAL_WORKSPACE_ID, ownerKey: QA_OWNER, revision: 0,
        title: HISTORICAL_TITLE, intent: { question: HISTORICAL_QUESTION, criteria: [] }, decisionReadings: [archive],
        documentaryAnswers: [v3Record, v4Record], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt }, null);
    }
    const stored = await repository.read(QA_OWNER, HISTORICAL_WORKSPACE_ID);
    return { workspaceId: HISTORICAL_WORKSPACE_ID, title: HISTORICAL_TITLE, question: HISTORICAL_QUESTION,
      answerCount: stored?.documentaryAnswers?.length ?? 0, readingFormats: (stored?.decisionReadings ?? []).map(row => row.format),
      answerFormats: (stored?.documentaryAnswers ?? []).map(row => (row as { format?: string }).format ?? 'inconnu'),
      answerReferences: (stored?.documentaryAnswers ?? []).map(row => (row as { reference?: string }).reference ?? '') };
  } finally {
    repository.close();
  }
}

async function readLocalScenarios() {
  const repository = createBrewingScenarioLocalRepository({ databaseName: SCENARIO_DATABASE });
  try { return await repository.list(QA_OWNER); }
  finally { repository.close(); }
}

async function readLocalWorkspaces() {
  const repository = createHopV55WorkspaceRepository({
    ownerKey: QA_OWNER,
    databaseName: WORKSPACE_DATABASE,
  });
  try { return await repository.list(QA_OWNER); }
  finally { repository.close(); }
}

async function start() {
  const publicVarieties = await loadGuideVarieties();
  const knowledge = guidePredictionKnowledge(yeastCatalogue.filter(row =>
    ['lalbrew-diamond', 'fermentis-us05', 'lalbrew-verdant-ipa'].includes(row.id)) as HopKnowledge[]);
  seedQa({
    recipes: [],
    batches: [],
    stockItems: [],
    hopVarieties: [...publicVarieties.filter(row => row.id !== qaVariety.id), qaVariety],
    hopKnowledge: knowledge,
  });

  // The shared auth adapter uses a reserved sentinel for its other QA flow.
  // J5 correctly refuses that value as an owner ID, so this isolated App entry
  // projects the same fixture user onto a stable, valid local QA identity.
  const fixtureUser = { ...(FirebaseAuthService.getCurrentUser() ?? {}), uid: QA_OWNER };
  FirebaseAuthService.getCurrentUser = () => fixtureUser as ReturnType<typeof FirebaseAuthService.getCurrentUser>;
  FirebaseAuthService.onUserChange = callback => {
    const timer = setTimeout(() => callback(fixtureUser), 0);
    return () => clearTimeout(timer);
  };

  const qa = {
    ready: () => FirestoreRepo.isReady() && !!document.querySelector('#root > *'),
    ownerKey: QA_OWNER,
    fixtureSource,
    seedFixtures,
    seedHistoricalPropertyAdvice,
    rejectNextRecipeSave: () => { qaMetrics.rejectNextRecipe = true; },
    recipe: (id = 'QA-V55-RECIPE') => structuredClone(StorageService.getRecipes().find(row => row.id === id) ?? null),
    batch: (id = 'QA-V55-BATCH') => structuredClone(StorageService.getBatches().find(row => row.id === id) ?? null),
    recipeSummaries: () => StorageService.getRecipes().map(row => ({ id: row.id, name: row.name, volumeL: row.volumeL })),
    batchSummaries: () => StorageService.getBatches().map(row => ({
      id: row.id, name: row.name, status: row.status, brewDate: row.brewDate,
      recipeId: row.recipeRef, brewDay: structuredClone(row.brewDay ?? null),
    })),
    localScenarios: readLocalScenarios,
    localWorkspaces: readLocalWorkspaces,
    firestoreMetrics: qaMetrics,
    functionCalls: qaCalls,
    functionInputs: qaInputs,
    storage: StorageService,
    fireStoreFixture: FirestoreRepo,
  };
  (window as any).__hopV55Qa = qa;
  // The existing callable fixture reads this stable browser test surface.
  (window as any).__hopQa = qa;
  createRoot(document.getElementById('root')!).render(<App />);
}

start().catch(error => {
  document.body.textContent = 'Échec du démarrage QA local : ' + String(error);
  throw error;
});
