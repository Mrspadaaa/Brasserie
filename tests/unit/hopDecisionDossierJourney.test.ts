import { describe, expect, it } from 'vitest';
import { captureHopDecisionStudy, captureHopDecisionSelectionEvent, captureHopDecisionRecipePreparationEvent } from '../../src/domain/hopDecision/dossierAdapter';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import { answerHopDecision } from '../../src/domain/hopDecision/service';
import { createHopDecisionDossier, applyHopDecisionEvent, readHopDecisionDossier, readHopDecisionEvent } from '../../src/domain/hopDecision';

describe('raccord public au dossier autonome', () => {
  it('traverse la demande réelle, la rétention et la préparation puis relit leurs instantanés entiers', () => {
    const fixture = makeHopDossierJourneyFixture();
    const study = captureHopDecisionStudy({ request: fixture.input, response: fixture.response,
      context: { kind: 'recipe', recipeId: fixture.recipe.id, recipeReference: fixture.binding.recipeReference } });
    const identity = { ownerKey: 'fixture-profile', dossierId: 'fixture-study' };
    const initial = createHopDecisionDossier({ ...identity, eventId: 'save', recordedAt: '2026-10-01T00:00:00.000Z', study });
    const retained = captureHopDecisionSelectionEvent({ identity: { ...identity, eventId: 'retain', expectedRevision: 1, recordedAt: '2026-10-01T00:01:00.000Z' },
      study, currentRequest: fixture.input, decisionId: 'choice', selection: fixture.selection, reason: 'Choix de fixture.' });
    const selected = applyHopDecisionEvent(initial.dossier, retained, [initial.event]);
    const prepared = captureHopDecisionRecipePreparationEvent({ identity: { ...identity, eventId: 'prepare', expectedRevision: 2, recordedAt: '2026-10-01T00:02:00.000Z' },
      study, currentRequest: fixture.input, decisionId: 'choice', preparationId: 'final', recipe: fixture.recipe, binding: fixture.binding, preview: fixture.preview });
    const final = applyHopDecisionEvent(selected, prepared, [initial.event, retained]);
    const reread = readHopDecisionDossier(JSON.parse(JSON.stringify(final)));
    const history = [initial.event, retained, prepared].map(event => readHopDecisionEvent(JSON.parse(JSON.stringify(event))));
    expect(reread).toEqual(final);
    expect(history).toEqual([initial.event, retained, prepared]);
    expect(final.study.responseSnapshot).toEqual(fixture.response);
    expect(prepared.payload.preview).toEqual(fixture.preview);
    expect(fixture.recipe.hops.map(hop => hop.alpha)).toEqual([8, 6]);
    expect(fixture.preview.recipePreview.draft.recipe.hops.map(hop => hop.alpha)).toEqual([6, 9]);
    expect(initial.dossier.revision).toBe(1);
    expect(selected.revision).toBe(2);
    expect(final.revision).toBe(3);
    // This is a memory/serialization check; browser tests prove persistence separately.
  });

  it('refuse de retenir des doses altérées et de préparer un reçu périmé sous une demande nouvelle', () => {
    const fixture = makeHopDossierJourneyFixture(), study = captureHopDecisionStudy({ request: fixture.input, response: fixture.response });
    const identity = { ownerKey: 'fixture-profile', dossierId: 'fixture-study', eventId: 'choice', expectedRevision: 1, recordedAt: '2026-10-01T00:00:00Z' };
    const tampered = structuredClone(fixture.selection); tampered.selectedDoses[0].grams += 1;
    expect(() => captureHopDecisionSelectionEvent({ identity, study, currentRequest: fixture.input, decisionId: 'choice', selection: tampered, reason: 'Choix.' })).toThrow();
    const currentRequest = structuredClone(fixture.input); currentRequest.intent.originalQuestion += ' Autre demande.';
    expect(() => captureHopDecisionRecipePreparationEvent({ identity, study, currentRequest, decisionId: 'choice', preparationId: 'prepared',
      recipe: fixture.recipe, binding: fixture.binding, preview: fixture.preview })).toThrow(/nouvelle étude/);
    const badPreview = structuredClone(fixture.preview); badPreview.recipePreview.draft.recipe.hops[0].alpha = 8;
    expect(() => captureHopDecisionRecipePreparationEvent({ identity, study, currentRequest: fixture.input, decisionId: 'choice', preparationId: 'prepared',
      recipe: fixture.recipe, binding: fixture.binding, preview: badPreview })).toThrow();
  });

  it('conserve toute la réponse argumentée, les variantes de même URL et les choix propres aux ajouts', () => {
    const fixture = makeHopDossierJourneyFixture();
    const study = captureHopDecisionStudy({ request: fixture.input, response: fixture.response });
    expect(study.request).toEqual(fixture.input);
    expect(study.responseSnapshot).toEqual(fixture.response);
    expect(study.responseSnapshot.result.programEvidence).toEqual(fixture.response.result.programEvidence);
    expect(study.responseSnapshot.criteria).toEqual(fixture.response.criteria);
    const sameSource = study.observations.filter(row => row.materialId === fixture.candidate.id);
    expect(sameSource).toHaveLength(2);
    expect(new Set(sameSource.map(row => row.snapshot.source.reference)).size).toBe(1);
    expect(new Set(sameSource.map(row => row.observationId)).size).toBe(2);
    expect(new Set(sameSource.map(row => row.observationRef)).size).toBe(2);
    expect(fixture.preview.recipePreview.programApplication.after.additions.map(row => row.alphaForModel?.value)).toEqual([6, 9]);
    expect(fixture.preview.recipePreview.analysis.alphaGrams.status).toBe('unknown');
    expect(captureHopDecisionStudy({ request: fixture.input, response: fixture.response })).toEqual(study);
    fixture.input.intent.originalQuestion = 'Modifiée après capture';
    fixture.response.answer = 'Modifiée après capture';
    fixture.input.materials.find(material => material.id === fixture.candidate.id)!.declaredAnalysis![0].range!.min = 0;
    expect(study.request.intent.originalQuestion).not.toBe(fixture.input.intent.originalQuestion);
    expect(study.responseSnapshot.answer).not.toBe(fixture.response.answer);
    expect(study.observations[0].snapshot.range?.min).toBe(4);
  });

  it('refuse une capture dont les données ou la réponse ont changé après le calcul montré', () => {
    const fixture = makeHopDossierJourneyFixture(), changed = structuredClone(fixture.input);
    changed.intent.criteria[0].role = 'avoid';
    expect(() => captureHopDecisionStudy({ request: changed, response: fixture.response })).toThrow(/réponse ne correspond/);
    const forged = structuredClone(fixture.response);
    forged.answer = 'Goût garanti.';
    expect(() => captureHopDecisionStudy({ request: fixture.input, response: forged })).toThrow(/réponse ne correspond/);
  });

  it('conserve aussi une comparaison sans recette, sélection ou programme', () => {
    const fixture = makeHopDossierJourneyFixture();
    const request = { intent: { originalQuestion: 'Comparer les données de ces deux matières.', assumptions: ['Sans recette ni cible imposée.'] },
      action: { kind: 'compareMaterials' as const, leftId: 'petal', rightId: 'woody' }, materials: fixture.input.materials };
    const response = answerHopDecision(request);
    const study = captureHopDecisionStudy({ request, response });
    expect(study.context).toBeNull();
    expect(study.actionKind).toBe('compareMaterials');
    expect(study.request.intent.assumptions).toEqual(['Sans recette ni cible imposée.']);
    expect(study.responseSnapshot.result).toEqual(response.result);
    expect(study.observations).toHaveLength(2);
  });
});
