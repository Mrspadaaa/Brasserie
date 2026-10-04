import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { simulateBrewingScenario, type BrewingScenarioRequest } from '../../src/domain/brewingScenario';
import { createBrewingScenarioDossier } from '../../src/domain/brewingScenarioDossier';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareHopV55FutureRecipeDraft, type HopV55FutureRecipeCurrentReferences, type HopV55FutureRecipeDraftV1 } from '../../src/services/hopV55/futureRecipeDraft';
import type { HopV55Intent } from '../../src/services/hopV55/contracts';
import type { BrewingReferenceIdentityV1 } from '../../src/domain/brewingReference';

/** A self-contained synthetic J5 example for service and workspace tests. */
export function makeHopV55FutureRecipeDraftFixture(options: {
  firstAdditionPerformed?: boolean;
  firstAdditionGrams?: number | null;
  firstAdditionId?: string;
  secondAdditionGrams?: number | null;
  secondAdditionId?: string;
  volumeL?: number;
  scenarioId?: string;
} = {}): {
  draft: HopV55FutureRecipeDraftV1;
  request: BrewingScenarioRequest;
  result: ReturnType<typeof simulateBrewingScenario>;
  snapshot: ReturnType<typeof createBrewingScenarioDossier>['event']['payload']['snapshot'];
  adoptedReference: BrewingReferenceIdentityV1;
  intent: HopV55Intent;
  currentRefs: HopV55FutureRecipeCurrentReferences;
  runtime: ReturnType<typeof prepareBrewingScenarioContext>['runtime'];
} {
  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  const varieties = context.hopIndex?.varieties ?? [];
  if (varieties.length < 2) throw Error('Fixture: deux identités houblon physiques requises.');
  const materials: HopDecisionMaterial[] = varieties.slice(0, 2).map(variety => ({
    id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety: structuredClone(variety),
  }));
  const volumeL = options.volumeL ?? 8;
  const firstAdditionId = options.firstAdditionId ?? 'future-add-10g25';
  const secondAdditionId = options.secondAdditionId ?? 'future-add-5g75';
  const program: HopDecisionProgram = {
    id: 'fixture-future-program', revision: 1, stage: 'planning', volumeL, wortGravity: null,
    additions: [
      { id: firstAdditionId, materialId: materials[0].id,
        grams: options.firstAdditionGrams === undefined ? 10.25 : options.firstAdditionGrams, use: 'fermentation', status: options.firstAdditionPerformed ? 'performed' : 'planned',
        temperatureC: 14, contactHours: 36 },
      { id: secondAdditionId, materialId: materials[1].id,
        grams: options.secondAdditionGrams === undefined ? 5.75 : options.secondAdditionGrams, use: 'fermentation', status: 'planned',
        temperatureC: 14, contactHours: 36 },
    ],
  };
  const input: HopRecipeInput = {
    volumeL, yeastId: null, fermentation: [],
    additions: program.additions.map((addition, index) => ({
      id: addition.id, name: materials[index].name,
      triplet: { varietyId: materials[index].variety!.id, lotId: null, yeastId: null, timing: addition.use,
        doseGL: addition.grams === null ? null : addition.grams / volumeL, temperatureC: addition.temperatureC!, contactHours: addition.contactHours!, matrixId: null },
    })),
  };
  const scenarioId = options.scenarioId ?? 'future-draft-synthetic-scenario';
  const request: BrewingScenarioRequest = {
    version: 'brewing-scenario-v1', scenarioId, revision: 1,
    baseline: { kind: 'hypothetical', label: 'Composition synthétique sans recette', input, program, materials: { hops: materials } },
    assumptions: [],
    branches: [{ id: 'future-mix', label: 'Mélange choisi', assumptions: [] }],
  };
  const result = simulateBrewingScenario(request, prepared.runtime);
  const saved = createBrewingScenarioDossier({ ownerKey: 'owner-future-draft-fixture', scenarioId,
    eventId: `result-saved-${scenarioId}`, recordedAt: '2026-10-02T10:00:00.000Z', result });
  const snapshot = saved.event.payload.snapshot;
  const adoptedReference: BrewingReferenceIdentityV1 = {
    id: 'reference-future-draft-fixture', version: '1', contentReference: 'reference-content-future-draft-fixture',
  };
  const intent: HopV55Intent = { question: 'Explorer un mélange de houblons pour 8 L.', criteria: [] };
  const preparedDraft = prepareHopV55FutureRecipeDraft({
    identity: { draftId: 'future-draft-fixture', revision: 1 }, result, snapshot, branchId: 'future-mix',
    adoptedReference, intent, declaredFields: {},
  });
  if (preparedDraft.status !== 'ready') throw Error(`Fixture de future recette invalide : ${preparedDraft.reason}`);
  return { draft: preparedDraft.draft, request, result, snapshot, adoptedReference, intent,
    currentRefs: { snapshot, adoptedReference,
      materials: structuredClone(result.branches.find(branch => branch.id === 'future-mix')!.dependencySnapshot.decisionMaterials) },
    runtime: prepared.runtime };
}
