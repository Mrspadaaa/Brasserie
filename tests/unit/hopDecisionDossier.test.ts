import { describe, expect, it } from 'vitest';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import { answerHopDecision, hopDecisionReference, previewHopPlannedRecipe, type HopPlannedRecipePreview } from '../../src/domain/hopDecision';
import {
  applyHopDecisionEvent,
  createHopDecisionDossier,
  createHopDecisionEvent,
  readHopDecisionDossier,
  type HopDecisionPublicInput,
  type HopDecisionStudySnapshot,
  type HopDecisionObservationSnapshot,
} from '../../src/domain/hopDecision/dossier';

const ownerKey = 'fixture-owner-dossier';

function indexObservations(input: HopDecisionPublicInput): HopDecisionObservationSnapshot[] {
  const rows: HopDecisionObservationSnapshot[] = [];
  for (const material of input.materials) {
    for (const [origin, measurements] of [
      ['declared', material.declaredAnalysis ?? []],
      ['lot', material.lot?.analysis ?? []],
      ['variety', material.variety?.analysis ?? []],
    ] as const) {
      measurements.forEach((snapshot, index) => rows.push({
        observationId: `observation:${material.id}:${origin}:${index}`,
        materialId: material.id,
        origin,
        observationRef: hopDecisionReference(snapshot),
        snapshot: structuredClone(snapshot),
      }));
    }
  }
  return rows;
}

function makePlanDossier(suffix = '01') {
  const fixture = makeHopDossierJourneyFixture();
  const study: HopDecisionStudySnapshot<'planReplacement'> = {
    actionKind: 'planReplacement',
    request: fixture.input,
    responseSnapshot: fixture.response,
    observations: indexObservations(fixture.input),
    context: { kind: 'recipe', recipeId: fixture.recipe.id, recipeReference: hopDecisionReference(fixture.recipe) },
  };
  const created = createHopDecisionDossier({
    ownerKey,
    dossierId: `dossier-fixture-${suffix}`,
    eventId: `event-study-${suffix}`,
    recordedAt: '2026-10-01T10:00:00.000Z',
    study,
  });
  return { fixture, study, created };
}

describe('enveloppe locale houblon J2', () => {
  it('fige entrée publique, réponse complète, preuves, observations et contexte sans réécrire les mesures', () => {
    const { fixture, study, created } = makePlanDossier();
    expect(created.dossier).toMatchObject({ formatVersion: 1, ownerKey, revision: 1, state: 'studySaved' });
    expect(created.dossier.study.context).toMatchObject({ kind: 'recipe', recipeId: fixture.recipe.id });
    expect(created.dossier.study).toEqual(study);
    expect(created.dossier.study.request).toEqual(fixture.input);
    expect(created.dossier.study.responseSnapshot).toEqual(fixture.response);
    expect(created.dossier.study.responseSnapshot.intent.assumptions).toEqual(fixture.input.intent.assumptions);
    expect(created.dossier.study.responseSnapshot.result.baselineEvidence).toEqual(fixture.response.result.baselineEvidence);
    const observations = created.dossier.study.observations;
    expect(observations).toHaveLength(2);
    expect(observations.map(row => row.snapshot.basis)).toEqual(['unknown', 'dryMatter']);
    expect(observations[0].snapshot.source.reference).toBe(observations[1].snapshot.source.reference);
    expect(observations[0].observationRef).not.toBe(observations[1].observationRef);
    expect(fixture.candidate.alphaForModel?.observationRef).toBe(observations[0].observationRef);
    expect(created.event).toMatchObject({ kind: 'studySaved', eventId: 'event-study-01', expectedRevision: 0, resultingRevision: 1 });

    fixture.input.intent.originalQuestion = 'Texte modifié après la capture.';
    expect(created.dossier.study.request.intent.originalQuestion).not.toBe(fixture.input.intent.originalQuestion);
    expect(created.dossier.study.responseSnapshot.answer).toBe(fixture.response.answer);
  });

  it('accepte une étude autonome compareMaterials sans inventer de voie ni de préparation recette', () => {
    const fixture = makeHopDossierJourneyFixture();
    const request: HopDecisionPublicInput = {
      intent: { originalQuestion: 'Comparer ces deux matières sans recette.', assumptions: ['Comparaison documentaire seulement.'] },
      action: { kind: 'compareMaterials', leftId: fixture.candidate.id, rightId: 'woody' },
      materials: fixture.input.materials,
    };
    const response = answerHopDecision(request);
    const study: HopDecisionStudySnapshot<'compareMaterials'> = { actionKind: 'compareMaterials', request, responseSnapshot: response,
      observations: indexObservations(request), context: null };
    const { dossier, event } = createHopDecisionDossier({ ownerKey, dossierId: 'study-only-01', eventId: 'study-only-event-01',
      recordedAt: '2026-10-01T10:10:00.000Z', study });
    expect(dossier.state).toBe('studySaved');
    expect(dossier.study.context).toBeNull();
    expect(dossier.study.request.action.kind).toBe('compareMaterials');
    expect(dossier.study.responseSnapshot.result.analytical.length).toBeGreaterThan(0);
    expect(event.kind).toBe('studySaved');
  });

  it('conserve séparément rétention et reçu complet de previewHopPlannedRecipe', () => {
    const { fixture, created } = makePlanDossier('journey');
    const selection = fixture.selection;
    const retained = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-retained-journey',
      expectedRevision: created.dossier.revision, recordedAt: '2026-10-01T10:01:00.000Z', kind: 'optionRetained',
      payload: { decisionId: 'decision-fixture-01', optionId: selection.pathId, selection, reason: 'Voie explicitement retenue en fixture.' } });
    const retainedDossier = applyHopDecisionEvent(created.dossier, retained, [created.event]);
    expect(retainedDossier.state).toBe('optionRetained');
    expect(retainedDossier.study).toBe(created.dossier.study);

    const preview = fixture.preview;
    const prepared = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-prepared-journey',
      expectedRevision: retainedDossier.revision, recordedAt: '2026-10-01T10:02:00.000Z', kind: 'programPrepared',
      payload: { decisionId: 'decision-fixture-01', optionId: selection.pathId, preparationId: 'preparation-fixture-01', preview } });
    const preparedDossier = applyHopDecisionEvent(retainedDossier, prepared, [created.event, retained]);
    expect(preparedDossier.state).toBe('programPrepared');
    expect(preparedDossier.preparationStatus).toBe('ready');
    expect(preparedDossier.lastDecisionId).toBe('decision-fixture-01');
    expect(preparedDossier.lastPreparationId).toBe('preparation-fixture-01');
    expect(prepared.payload.preview).toEqual(preview);
    expect(prepared.payload.preview.selection).toEqual(selection);
    expect(Object.keys(prepared.payload.preview.recipePreview.alphaChoices)).toEqual(['recipe-hop:0', 'recipe-hop:1']);
    expect(Object.values(prepared.payload.preview.recipePreview.alphaChoices).map(choice => choice.value)).toEqual([6, 9]);
    expect(prepared.payload.preview.conventions).toEqual([]);
    const withoutRetention = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-prepared-without-retention',
      expectedRevision: created.dossier.revision, recordedAt: '2026-10-01T10:02:01.000Z', kind: 'programPrepared',
      payload: { decisionId: 'decision-fixture-01', optionId: selection.pathId, preparationId: 'preparation-without-retention', preview } });
    expect(() => applyHopDecisionEvent(created.dossier, withoutRetention, [created.event])).toThrow(/explicitement retenue/);
    expect(() => applyHopDecisionEvent(retainedDossier, prepared, [created.event, { ...retained, dossierId: 'other-dossier' }])).toThrow(/historique du dossier/);
  });

  it('préserve mismatch et besoin alpha comme états non applicables, sans les confondre avec ready', () => {
    const { fixture, created } = makePlanDossier('states');
    const selection = fixture.selection;
    const retained = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-retained-states',
      expectedRevision: 1, recordedAt: '2026-10-01T10:01:00.000Z', kind: 'optionRetained',
      payload: { decisionId: 'decision-states', optionId: selection.pathId, selection, reason: 'Sélection de fixture.' } });
    const base = applyHopDecisionEvent(created.dossier, retained, [created.event]);
    // Isolate the stored outcome discriminator; the fixture remains synthetic and no model value is asserted here.
    const { reference: _reference, ...readyContent } = fixture.preview;
    const mismatchContent = { ...readyContent, status: 'conventionMismatch' as const };
    const mismatch: HopPlannedRecipePreview<typeof fixture.recipe> = { ...mismatchContent, reference: hopDecisionReference(mismatchContent) };
    const event = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-mismatch',
      expectedRevision: 2, recordedAt: '2026-10-01T10:02:00.000Z', kind: 'programPrepared',
      payload: { decisionId: 'decision-states', optionId: selection.pathId, preparationId: 'prep-mismatch', preview: mismatch } });
    const result = applyHopDecisionEvent(base, event, [created.event, retained]);
    expect(result.state).toBe('programPrepared');
    expect(result.preparationStatus).toBe('conventionMismatch');

    const needsAlpha = previewHopPlannedRecipe({ request: fixture.request, selection, recipe: fixture.recipe, binding: fixture.binding });
    expect(needsAlpha.status).toBe('needsAlphaSelection');
    if (needsAlpha.status !== 'needsAlphaSelection') throw Error('Cette fixture exige un alpha scalaire explicite.');
    const needsAlphaEvent = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-alpha-needed',
      expectedRevision: 2, recordedAt: '2026-10-01T10:02:30.000Z', kind: 'programPrepared',
      payload: { decisionId: 'decision-states', optionId: selection.pathId, preparationId: 'prep-alpha-needed', preview: needsAlpha } });
    const needsAlphaDossier = applyHopDecisionEvent(base, needsAlphaEvent, [created.event, retained]);
    expect(needsAlphaDossier.preparationStatus).toBe('needsAlphaSelection');
  });

  it('refuse un index de mesure incomplet, une référence altérée et un calcul historique inconnu en écriture', () => {
    const { study, created } = makePlanDossier('validation');
    expect(() => createHopDecisionDossier({ ownerKey, dossierId: 'missing-observation', eventId: 'missing-observation-event',
      recordedAt: '2026-10-01T10:00:00.000Z', study: { ...study, observations: [] } })).toThrow(/n’est pas indexée/);
    expect(() => createHopDecisionDossier({ ownerKey, dossierId: 'wrong-observation-ref', eventId: 'wrong-observation-event',
      recordedAt: '2026-10-01T10:00:00.000Z', study: { ...study, observations: study.observations.map((row, i) => i === 0 ? { ...row, observationRef: 'bad-ref' } : row) } })).toThrow(/référence canonique/);

    const future = structuredClone(created.dossier) as any;
    future.study.responseSnapshot.version = 'hop-decision-v2';
    const readOnly = readHopDecisionDossier(future);
    expect(readOnly).toMatchObject({ status: 'unsupportedFormat', reason: 'calculationVersion', formatVersion: 1, raw: future });
  });

  it('permet plusieurs corrections alternatives; seule la supersession explicite ferme le dossier', () => {
    const { fixture, study, created } = makePlanDossier('correction');
    const successorA = createHopDecisionDossier({ ownerKey, dossierId: 'dossier-correction-successor-a', eventId: 'event-successor-save-a',
      recordedAt: '2026-10-01T11:00:00.000Z', study: structuredClone(study), supersedesDossierId: created.dossier.dossierId });
    const successorB = createHopDecisionDossier({ ownerKey, dossierId: 'dossier-correction-successor-b', eventId: 'event-successor-save-b',
      recordedAt: '2026-10-01T11:00:01.000Z', study: structuredClone(study), supersedesDossierId: created.dossier.dossierId });
    expect(successorA.dossier.supersedesDossierId).toBe(created.dossier.dossierId);
    expect(successorB.dossier.supersedesDossierId).toBe(created.dossier.dossierId);

    const correctionA = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-correction-a',
      expectedRevision: 1, recordedAt: '2026-10-01T11:01:00.000Z', kind: 'correctionRecorded',
      payload: { successorDossierId: successorA.dossier.dossierId, reason: 'Première correction alternative.', correctedObservationIds: ['observation:petal:declared:1'] } });
    const correctedA = applyHopDecisionEvent(created.dossier, correctionA, [created.event]);
    expect(correctedA.state).toBe('correctionRecorded');
    expect(correctedA.supersededByDossierId).toBeUndefined();

    const correctionB = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-correction-b',
      expectedRevision: 2, recordedAt: '2026-10-01T11:02:00.000Z', kind: 'correctionRecorded',
      payload: { successorDossierId: successorB.dossier.dossierId, reason: 'Autre correction alternative.', correctedObservationIds: [] } });
    const correctedB = applyHopDecisionEvent(correctedA, correctionB, [created.event, correctionA]);
    expect(correctedB.supersededByDossierId).toBeUndefined();

    const superseded = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-explicit-supersede',
      expectedRevision: 3, recordedAt: '2026-10-01T11:03:00.000Z', kind: 'supersededBy',
      payload: { successorDossierId: successorA.dossier.dossierId, reason: 'Le brasseur retient explicitement cette correction.' } });
    const final = applyHopDecisionEvent(correctedB, superseded, [created.event, correctionA, correctionB]);
    expect(final.supersededByDossierId).toBe(successorA.dossier.dossierId);
    expect(final.study).toEqual(created.dossier.study);
    const laterChoice = createHopDecisionEvent({ ownerKey, dossierId: created.dossier.dossierId, eventId: 'event-after-supersede',
      expectedRevision: 4, recordedAt: '2026-10-01T11:04:00.000Z', kind: 'optionRetained',
      payload: { decisionId: 'too-late', optionId: study.responseSnapshot.result.plan.paths[0].pathId,
        selection: fixture.selection, reason: 'Ne doit plus s’ajouter.' } });
    expect(() => applyHopDecisionEvent(final, laterChoice, [created.event, correctionA, correctionB, superseded])).toThrow(/supersédé/);
    expect(created.dossier).toMatchObject({ revision: 1, state: 'studySaved' });
  });
});
