import { describe, expect, it, vi } from 'vitest';
import { makeHopV55FutureRecipeDraftFixture } from '../fixtures/hopV55FutureRecipeDraft';
import { createBrewingScenarioDossier } from '../../src/domain/brewingScenarioDossier';
import { simulateBrewingScenario } from '../../src/domain/brewingScenario';
import {
  materializeHopV55FutureRecipe,
  inspectHopV55FutureRecipeDraft,
  prepareHopV55FutureRecipeDraft,
  prepareHopV55FutureRecipeMassRecomputeProposal,
  readHopV55FutureRecipeDraft,
  readHopV55FutureRecipeMaterializationReceipt,
  reviseHopV55FutureRecipeDraft,
  type HopV55FutureRecipeCurrentReferences,
} from '../../src/services/hopV55/futureRecipeDraft';

describe('brouillon local de future recette V5.5', () => {
  it('adopte un scénario hypothétique sans Recipe source et garde les deux masses, le volume et le contact exacts', () => {
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const draft = fixture.draft;

    expect(draft.origin.baselineKind).toBe('hypothetical');
    expect(draft.origin.snapshotReference).toBe(fixture.result.reference);
    expect(draft.origin.branchReference).toBe(fixture.result.branches[0].reference);
    expect(draft.hypotheticalBaseline.kind).toBe('hypothetical');
    expect(draft.hypotheticalBaseline.program.volumeL).toBe(8);
    expect(draft.additions.map(row => row.addition.grams)).toEqual([10.25, 5.75]);
    expect(draft.additions.map(row => [row.addition.use, row.addition.temperatureC, row.addition.contactHours])).toEqual([
      ['fermentation', 14, 36], ['fermentation', 14, 36],
    ]);
    expect(draft.hypotheticalBaseline.input.additions.map(row => row.triplet.doseGL)).toEqual([10.25 / 8, 5.75 / 8]);
    expect(draft.hypotheticalBaseline).not.toHaveProperty('materials');
    expect(draft.sourceMaterials).toHaveLength(2);
    expect(draft).not.toHaveProperty('sourceRecipeId');
    expect(draft).not.toHaveProperty('parentRecipeId');
    expect(draft.hypotheticalBaseline).not.toHaveProperty('recipe');
    expect(fixture.result.reference).toBe(fixture.snapshot.result.reference);
    expect(readHopV55FutureRecipeDraft(draft).status).toBe('available');
    const inspection = inspectHopV55FutureRecipeDraft(draft);
    expect(inspection.status).toBe('available');
    if (inspection.status !== 'available') throw Error(inspection.reason);
    expect(inspection.completion.draft).toBe('readyToSaveLocally');
    expect(inspection.completion.recipeSave).toBe('notMaterialized');
    expect(inspection.completion.brew).toBe('notMaterialized');
    expect(inspection.completion.unknownAlphaAdditionIds).toEqual(['future-add-10g25', 'future-add-5g75']);
    expect(inspection.completion.missing.map(row => row.field)).toEqual(expect.arrayContaining(['name', 'style', 'boilMin', 'fermentables', 'yeast']));
    expect(fixture.draft.contentReference).toMatch(/^hop-v55-future-recipe-draft-v1:sha256:[a-f0-9]{64}$/);
  });

  it('scelle toutes les sélections et refuse les altérations sans relancer de moteur', () => {
    const { draft } = makeHopV55FutureRecipeDraftFixture();
    const changedMass = structuredClone(draft);
    changedMass.additions[0].addition.grams = 11;
    expect(readHopV55FutureRecipeDraft(changedMass)).toMatchObject({ status: 'invalid' });

    const changedOrigin = structuredClone(draft);
    changedOrigin.origin.branchReference = 'branch-moved';
    expect(readHopV55FutureRecipeDraft(changedOrigin)).toMatchObject({ status: 'invalid' });

    const changedBaseline = structuredClone(draft);
    changedBaseline.hypotheticalBaseline.input.volumeL = 250;
    expect(readHopV55FutureRecipeDraft(changedBaseline)).toMatchObject({ status: 'invalid' });
  });

  it('exclut un ajout source effectué tant que le brasseur ne le replanifie pas explicitement', () => {
    const fixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionPerformed: true });
    expect(fixture.draft.additions.map(row => row.addition.grams)).toEqual([5.75]);
    expect(fixture.draft.operationDispositions).toEqual([
      { additionId: 'future-add-10g25', materialId: 'variety:hop-v55-fixture-identity-a', sourceStatus: 'performed', futureStatus: 'excludedPerformed' },
      { additionId: 'future-add-5g75', materialId: 'variety:hop-v55-fixture-identity-b', sourceStatus: 'planned', futureStatus: 'planned' },
    ]);
    const replan = reviseHopV55FutureRecipeDraft(fixture.draft, { revision: 2,
      declaredFields: { schedulePerformedAdditionIds: ['future-add-10g25'], name: 'Mélange replanifié' } });
    if (replan.status !== 'ready') throw Error(replan.reason);
    expect(replan.status).toBe('ready');
    expect(replan.draft.additions.map(row => row.addition.grams)).toEqual([10.25, 5.75]);
    expect(replan.draft.additions[0].addition.status).toBe('planned');
    expect(replan.draft.additions[0].sourceStatus).toBe('performed');
    expect(replan.draft.predecessor).toMatchObject({ draftId: fixture.draft.draftId, revision: 1,
      contentReference: fixture.draft.contentReference });
    expect(fixture.draft.additions.map(row => row.addition.grams)).toEqual([5.75]);
  });

  it('ne matérialise pas avant les champs qui invalident la sauvegarde et n’alloue pas d’ID trop tôt', () => {
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const ids = { createRecipeId: vi.fn(() => 'recipe-new-1'), createReceiptId: vi.fn(() => 'receipt-new-1'),
      createdAt: '2026-10-02T12:00:00.000Z' };
    const incomplete = materializeHopV55FutureRecipe(fixture.draft, { style: 'Blonde Ale', fermentables: [], yeast: { name: '' } },
      fixture.currentRefs, ids);
    expect(incomplete.status).toBe('needsCompletion');
    if (incomplete.status !== 'needsCompletion') throw Error('Un volume, un nom et une ébullition manquants exigent une correction.');
    expect(incomplete.issues.map(issue => issue.field)).toEqual(expect.arrayContaining(['wz-title', 'wz-boil']));
    expect(ids.createRecipeId).not.toHaveBeenCalled();
    expect(ids.createReceiptId).not.toHaveBeenCalled();
  });

  it('ne transforme pas une masse J5 inconnue en zéro et attend une masse de recette déclarée', () => {
    const fixture = makeHopV55FutureRecipeDraftFixture({ firstAdditionGrams: null, firstAdditionId: 'unknown-mass-hop' });
    expect(fixture.draft.additions[0].addition.grams).toBeNull();
    expect(fixture.draft.hypotheticalBaseline.input.additions[0].triplet.doseGL).toBeNull();
    const alphaChoices = Object.fromEntries(fixture.draft.additions.map((row, index) => [row.additionId,
      { value: 4 + index, reason: 'Nominal de travail saisi explicitement.' }]));
    const ids = { createRecipeId: vi.fn(() => 'should-not-create-recipe'), createReceiptId: vi.fn(() => 'should-not-create-receipt'),
      createdAt: '2026-10-02T12:03:00.000Z' };
    const outcome = materializeHopV55FutureRecipe(fixture.draft, {
      name: 'Mélange à compléter', style: 'Style déclaré', volumeL: 8, boilMin: 60,
      fermentables: [], yeast: { name: '' }, alphaChoices,
    }, fixture.currentRefs, ids);

    expect(outcome.status).toBe('needsCompletion');
    if (outcome.status !== 'needsCompletion') throw Error('Une masse J5 inconnue doit être explicitement complétée avant l’export.');
    expect(outcome.issues).toContainEqual(expect.objectContaining({ field: 'hops.unknown-mass-hop.grams' }));
    expect(ids.createRecipeId).not.toHaveBeenCalled();
    expect(ids.createReceiptId).not.toHaveBeenCalled();
    const intactDraft = readHopV55FutureRecipeDraft(fixture.draft);
    expect(intactDraft.status).toBe('available');
    if (intactDraft.status !== 'available') throw Error('Le brouillon doit rester lisible après un export incomplet.');
    expect(intactDraft.draft.additions[0].addition.grams).toBeNull();

    const explicitZeroIds = { createRecipeId: vi.fn(() => 'must-wait-for-new-j5'), createReceiptId: vi.fn(() => 'must-wait-for-new-j5-receipt'),
      createdAt: '2026-10-02T12:03:30.000Z' };
    const explicitZero = materializeHopV55FutureRecipe(fixture.draft, {
      name: 'Mélange sans première dose', style: 'Style déclaré', volumeL: 8, boilMin: 60,
      fermentables: [], yeast: { name: '' }, alphaChoices, hopMassChoices: { 'unknown-mass-hop': 0 },
    }, fixture.currentRefs, explicitZeroIds);
    expect(explicitZero.status).toBe('needsCompletion');
    if (explicitZero.status !== 'needsCompletion') throw Error('Une masse déclarée ne doit pas être présentée comme prévision J5 avant le nouveau calcul.');
    expect(explicitZero.issues).toContainEqual(expect.objectContaining({ field: 'hops.unknown-mass-hop.grams', message: expect.stringMatching(/relance J5/) }));
    expect(explicitZeroIds.createRecipeId).not.toHaveBeenCalled();
    expect(explicitZeroIds.createReceiptId).not.toHaveBeenCalled();

    const proposalDraftResult = reviseHopV55FutureRecipeDraft(fixture.draft, { revision: 2, declaredFields: {
      name: 'Mélange sans première dose', style: 'Style déclaré', volumeL: 8, boilMin: 60,
      fermentables: [], yeast: { name: '' }, alphaChoices, hopMassChoices: { 'unknown-mass-hop': 0 },
    } });
    expect(proposalDraftResult.status).toBe('ready');
    if (proposalDraftResult.status !== 'ready') throw Error(proposalDraftResult.reason);
    const proposal = prepareHopV55FutureRecipeMassRecomputeProposal(proposalDraftResult.draft);
    expect(proposal.status).toBe('ready');
    if (proposal.status !== 'ready') throw Error(proposal.status === 'blocked' ? proposal.reason : 'Une masse déclarée doit produire une entrée J5 proposée.');
    expect(proposal.proposal.changedAdditionIds).toEqual(['unknown-mass-hop']);
    expect(proposal.proposal.proposedBaseline.program.additions.map(row => row.grams)).toEqual([0, 5.75]);
    expect(proposal.proposal.proposedBaseline.program.additions.map(row => row.id)).toEqual(fixture.draft.additions.map(row => row.additionId));
    expect(proposal.proposal.proposedBaseline.input.additions.map(row => row.triplet.doseGL)).toEqual([0, 5.75 / 8]);

    const scenarioId = 'future-draft-explicit-zero-j5-scenario';
    const nextRequest = { ...fixture.request, scenarioId, revision: 3, baseline: proposal.proposal.proposedBaseline };
    const nextResult = simulateBrewingScenario(nextRequest, fixture.runtime);
    const nextScenario = createBrewingScenarioDossier({ ownerKey: 'owner-future-draft-fixture', scenarioId,
      eventId: 'result-saved-explicit-zero-j5', recordedAt: '2026-10-02T12:03:45.000Z', result: nextResult });
    const nextSnapshot = nextScenario.event.payload.snapshot;
    const nextBranch = nextResult.branches.find(row => row.id === 'future-mix')!;
    expect(nextBranch.program?.additions[0].grams).toBe(0);
    expect(nextBranch.input.additions[0].triplet.doseGL).toBe(0);
    const nextDraftResult = prepareHopV55FutureRecipeDraft({ identity: { draftId: fixture.draft.draftId, revision: 3,
      predecessor: { draftId: proposalDraftResult.draft.draftId, revision: proposalDraftResult.draft.revision,
        contentReference: proposalDraftResult.draft.contentReference } }, result: nextResult, snapshot: nextSnapshot,
      branchId: 'future-mix', adoptedReference: fixture.adoptedReference, intent: fixture.intent,
      declaredFields: { name: 'Mélange sans première dose', style: 'Style déclaré', volumeL: 8, boilMin: 60,
        fermentables: [], yeast: { name: '' }, alphaChoices } });
    expect(nextDraftResult.status).toBe('ready');
    if (nextDraftResult.status !== 'ready') throw Error(nextDraftResult.reason);
    expect(nextDraftResult.draft.additions[0].addition.grams).toBe(0);
    expect(nextDraftResult.draft.declaredFields.hopMassChoices).toBeUndefined();
    const nextRefs: HopV55FutureRecipeCurrentReferences = { snapshot: nextSnapshot, adoptedReference: fixture.adoptedReference,
      materials: structuredClone(nextBranch.dependencySnapshot.decisionMaterials) };
    const newlyPredictedZero = materializeHopV55FutureRecipe(nextDraftResult.draft, {}, nextRefs, {
      createRecipeId: () => 'recipe-from-new-j5-zero', createReceiptId: () => 'receipt-from-new-j5-zero',
      createdAt: '2026-10-02T12:04:00.000Z',
    });
    expect(newlyPredictedZero.status).toBe('ready');
    if (newlyPredictedZero.status !== 'ready') throw Error('La nouvelle prévision J5 à zéro déclaré doit être exportable comme recette incomplète.');
    expect(newlyPredictedZero.recipe.hops.map(row => row.weightG)).toEqual([0, 5.75]);
    expect(newlyPredictedZero.receipt.hopMappings[0].addition.grams).toBe(0);
    expect(newlyPredictedZero.receipt.hopMappings[0]).not.toHaveProperty('massChoice');
    expect(newlyPredictedZero.receipt.readiness.save).toBe('readyToSave');
    expect(newlyPredictedZero.receipt.readiness.brew).toBe('incomplete');
    expect(newlyPredictedZero.receipt.readiness.missing).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'wz-hop-0' })]));
    expect(readHopV55FutureRecipeMaterializationReceipt(newlyPredictedZero.receipt).status).toBe('available');
    expect(fixture.draft.additions[0].addition.grams).toBeNull();
  });

  it('matérialise les consignes exactes en Recipe incomplète enregistrable, sans cible issue de wortGravity', () => {
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const currentRefs: HopV55FutureRecipeCurrentReferences = structuredClone(fixture.currentRefs);
    // A stock refresh does not alter ingredient identity or turn the draft into an inventory reservation.
    currentRefs.materials[0].availableGrams = 900;
    const alphaChoices = Object.fromEntries(fixture.draft.additions.map((row, index) => [row.additionId,
      { value: 4.5 + index, reason: 'Nominal de travail choisi explicitement; ce n’est pas une analyse.' }]));
    const noFormIds = { createRecipeId: vi.fn(() => 'must-not-exist'), createReceiptId: vi.fn(() => 'must-not-exist-receipt'),
      createdAt: '2026-10-02T12:00:30.000Z' };
    const noForm = materializeHopV55FutureRecipe(fixture.draft, {
      name: 'Mélange futur', style: 'Style déclaré', boilMin: 60, yeast: { name: '' }, alphaChoices,
    }, currentRefs, noFormIds);
    expect(noForm).toMatchObject({ status: 'needsCompletion' });
    if (noForm.status !== 'needsCompletion') throw Error('L’absence de formulation ne signifie pas une liste de fermentescibles vide.');
    expect(noForm.issues.map(issue => issue.field)).toContain('fermentables');
    expect(noFormIds.createRecipeId).not.toHaveBeenCalled();

    const materialized = materializeHopV55FutureRecipe(fixture.draft, {
      name: 'Mélange futur', style: '', volumeL: 8, boilMin: 60, fermentables: [], yeast: { name: '' }, alphaChoices,
    }, currentRefs, { createRecipeId: () => 'new-recipe-id', createReceiptId: () => 'materialization-id',
      createdAt: '2026-10-02T12:01:00.000Z' });
    expect(materialized.status).toBe('ready');
    if (materialized.status !== 'ready') throw Error('La Recipe avec champs inconnus explicitement incomplets doit être enregistrable.');
    expect(materialized.recipe).toMatchObject({ id: 'new-recipe-id', name: 'Mélange futur', style: '', volumeL: 8,
      boilMin: 60, ogTarget: null, fgTarget: null, abvTarget: null });
    expect(materialized.recipe).not.toHaveProperty('parentRecipeId');
    expect(materialized.recipe).not.toHaveProperty('sourceRecipeId');
    expect(materialized.recipe.hops.map(row => row.weightG)).toEqual([10.25, 5.75]);
    expect(materialized.recipe.hops.map(row => row.stage)).toEqual(['dryHop', 'dryHop']);
    expect(materialized.recipe.hops.map(row => [row.aromaTiming, row.aromaContactHours, row.aromaTemperatureC, row.alpha])).toEqual([
      ['fermentation', 36, 14, 4.5], ['fermentation', 36, 14, 5.5],
    ]);
    expect(materialized.recipe.ibuTarget).toBeUndefined();
    expect(materialized.receipt.readiness.save).toBe('readyToSave');
    expect(materialized.receipt.readiness.brew).toBe('incomplete');
    expect(materialized.receipt.readiness.additionalMissing.map(row => row.field)).toEqual(expect.arrayContaining(['style', 'yeast']));
    expect(materialized.receipt.hopMappings.map(row => row.alphaChoice.reason)).toEqual([
      'Nominal de travail choisi explicitement; ce n’est pas une analyse.', 'Nominal de travail choisi explicitement; ce n’est pas une analyse.',
    ]);
    expect(readHopV55FutureRecipeMaterializationReceipt(materialized.receipt).status).toBe('available');

    const altered = structuredClone(materialized.receipt);
    altered.recipe.hops[0].weightG = 250;
    expect(readHopV55FutureRecipeMaterializationReceipt(altered)).toMatchObject({ status: 'invalid' });
  });

  it('refuse les références J5/adoption périmées avant la matérialisation', () => {
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const ids = { createRecipeId: vi.fn(() => 'new-recipe-id'), createReceiptId: vi.fn(() => 'receipt-id'),
      createdAt: '2026-10-02T12:02:00.000Z' };
    const staleReference = materializeHopV55FutureRecipe(fixture.draft, { name: 'Mélange', boilMin: 60 },
      { ...fixture.currentRefs, adoptedReference: { ...fixture.adoptedReference, version: '2' } }, ids);
    expect(staleReference).toMatchObject({ status: 'blocked' });
    expect(ids.createRecipeId).not.toHaveBeenCalled();

    const staleSnapshot = structuredClone(fixture.currentRefs);
    staleSnapshot.snapshot = { ...staleSnapshot.snapshot, reference: 'snapshot-new' };
    expect(materializeHopV55FutureRecipe(fixture.draft, { name: 'Mélange', boilMin: 60 }, staleSnapshot, ids))
      .toMatchObject({ status: 'blocked' });
  });
});
