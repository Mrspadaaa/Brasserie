import type { BrewerCatalogueCommand, BrewerCatalogueTarget } from '../../functions/src/brewerCatalogueSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { Recipe } from '../../src/types';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';

export const hopV55FixtureSource: HopSource = {
  title: 'Référence de test locale', author: 'Fixture', year: 2026,
  kind: 'observation', reference: 'fixture://hop-v55/unit-test',
};

export function hopV55FixtureRecipe(id = 'copy-recipe-v1'): Recipe {
  const recipe = structuredClone(makeHopV55FixtureContext('planning').recipe!);
  recipe.id = id;
  return recipe;
}

export function hopV55Workspace(ownerKey = 'owner-v55-a', id = 'workspace-v55-a'): HopV55Workspace {
  const recipe = hopV55FixtureRecipe();
  return {
    format: 'hop-v55-workspace-v1', id, ownerKey, revision: 0,
    title: 'Essai synthétique',
    intent: { question: 'Comparer deux profils d’exercice.', criteria: [{ id: 'criterion-aroma', label: 'Garder une expression inconnue', direction: 'investigate', familyId: 'family-aroma' }] },
    sourceRecipeId: 'recipe-source-v1', sourceBatchId: 'batch-source-v1',
    scenarioIds: ['scenario-v1'], activeScenarioId: 'scenario-v1',
    selected: { scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1', branchId: 'baseline', branchReference: 'branch-reference-v1' },
    referenceHypotheses: [{ id: 'hypothesis-v1', version: 1, label: 'Base de test', recordedAt: '2026-10-02T08:00:00.000Z',
      baseline: { kind: 'hypothetical', label: 'Base synthétique', input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] } } }],
    snapshotIntents: [{ scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1',
      intent: { question: 'Comparer le snapshot figé.', criteria: [{ id: 'snapshot-axis', label: 'Examiner la famille', direction: 'keep', axisId: 'axis-citrus', familyId: 'family-aroma' }] } }],
    recipeSaveReceipts: [{ copyId: 'copy-v1', recipeId: recipe.id, confirmedAt: '2026-10-02T08:01:00.000Z' }],
    copies: [{ id: 'copy-v1', recipe, sourceRecipeId: 'recipe-source-v1', previewReference: 'preview-reference-v1',
      scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1', branchId: 'baseline',
      branchReference: 'branch-reference-v1', createdAt: '2026-10-02T08:00:00.000Z', scope: 'local' }],
    activeCopyId: 'copy-v1', updatedAt: '2026-10-02T08:00:00.000Z',
  };
}

export function createHopCommand(operationId: string, name: string): BrewerCatalogueCommand {
  return { schemaVersion: 1, operationId, operation: 'create', entity: { kind: 'hopVariety', value: {
    name, aliases: [], form: 'unknown', descriptions: [], analysis: [],
  } }, claims: [], unmapped: [], projectionChoices: [] };
}

export function createYeastCommand(operationId: string, name: string): BrewerCatalogueCommand {
  return { schemaVersion: 1, operationId, operation: 'create', entity: { kind: 'yeastStrain', value: {
    kind: 'yeast', name, betaLyase: 'unknown', source: hopV55FixtureSource,
  } }, claims: [], unmapped: [], projectionChoices: [] };
}

export function createStyleCommand(operationId: string, name: string): BrewerCatalogueCommand {
  return { schemaVersion: 1, operationId, operation: 'create', entity: { kind: 'brewingStyle', value: {
    kind: 'styleGuide', name, version: 'fixture-v1', enabled: true, edition: 'Édition synthétique',
    retrievedAt: null, createdAt: '2026-10-02', attribution: 'Fixture uniquement', source: hopV55FixtureSource,
    styles: [{ code: 'TEST', name: `${name} style`, aliases: [], family: 'fixture', stats: {}, source: hopV55FixtureSource }],
  } }, claims: [], unmapped: [], projectionChoices: [] };
}

export function enrichHopCommand(operationId: string, target: BrewerCatalogueTarget, claimId: string, reported: string, value: number): BrewerCatalogueCommand {
  return { schemaVersion: 1, operationId, operation: 'enrich', target, claims: [{
    id: claimId, scope: 'identity-report', property: 'hop.alpha', label: 'Alpha déclaré dans une fixture',
    reported, normalized: { kind: 'point', value, unit: 'percentMass', basis: 'asIs' },
    epistemic: 'manufacturerClaim', source: { ...hopV55FixtureSource, title: `Source ${claimId}` },
    dates: { recordedAt: '2026-10-02T08:00:00.000Z' }, conflictGroupId: 'alpha-disagreement-v1',
  }], unmapped: [], projectionChoices: [] };
}

export function fixtureReferencesWithHop(row: HopVariety): { varieties: HopVariety[]; knowledge: HopKnowledge[] } {
  return { varieties: [structuredClone(row)], knowledge: [] };
}
