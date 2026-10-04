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
