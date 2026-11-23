import { describe, expect, it } from 'vitest';
import { makeHopAdviceJourneyFixture, addDocumentedAdviceCandidate, adviceFixtureIdentity as identity, adviceAssignment } from '../fixtures/hopAdviceJourney';
import { answerQualifiedHopAdvice } from '../../src/domain/hopDecision/qualifiedAdvice';
import { loadHopCatalogueQualificationInput } from '../../src/domain/hopDecision/catalogueLoader';
import { captureHopAdvicePreference, previewPreferredHopAdvice, captureHopAdvicePreviewEvent, applyPreferredHopAdvice, restorePreferredHopAdviceDraft } from '../../src/domain/hopDecision/adviceProgramAdapter';
import { createHopAdviceDossier, applyHopAdviceEvent, createHopAdviceEvent, readHopAdviceDossier,
  hopAdviceInterpretationReference, hopAdvicePreferenceReference, hopAdviceProgramPreviewReference, hopAdviceDraftRestorationReference,
  type HopAdviceStudyV3, type HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import { createHopDecisionDossier, createHopDecisionDossierV2, readHopDecisionDossier, readHopDecisionEvent } from '../../src/domain/hopDecision/dossier';
import { captureHopDecisionStudy } from '../../src/domain/hopDecision/dossierAdapter';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import type { HopDecisionProgram, HopProgramChange } from '../../src/domain/hopDecision/types';

function prefer(study: HopAdviceStudyV3, predicate: (option: HopAdviceStudyV3['responseSnapshot']['result']['options'][number]) => boolean) {
  const option = study.responseSnapshot.result.options.find(predicate);
  if (!option) throw Error('La voie demandée doit être produite par le vrai service.');
  return captureHopAdvicePreference({ identity: { ...identity, eventId: 'prefer', expectedRevision: 1 }, study, currentStudy: study,
    qualificationInput: study.requestSnapshot.qualificationInput, preferenceId: 'preference-1', optionId: option.id, reason: 'Choix explicite de fixture, sans dose.' });
}

function chain(study: HopAdviceStudyV3, preference: ReturnType<typeof prefer>, program: HopDecisionProgram, changes: HopProgramChange[], origin: 'existingProgram' | 'newScenario') {
  const input = { study, currentStudy: study, preference: preference.payload, qualificationInput: study.requestSnapshot.qualificationInput };
  const preview = previewPreferredHopAdvice({ ...input, origin, program, changes, reason: 'Valeurs et opération explicitement fournies dans la fixture.' });
  const applied = applyPreferredHopAdvice({ ...input, currentProgram: program, preview });
  const restored = restorePreferredHopAdviceDraft({ ...input, currentProgram: applied.application.after, application: applied });
  const saved = createHopAdviceDossier({ ...identity, eventId: 'saved', study });
  let dossier = saved.dossier;
  const events: HopAdviceEventV3[] = [saved.event];
  const additions: HopAdviceEventV3[] = [preference,
    captureHopAdvicePreviewEvent({ identity: { ...identity, eventId: 'preview', expectedRevision: 2 }, previewId: 'preview-1', receipt: preview }),
    createHopAdviceEvent({ ...identity, eventId: 'apply', expectedRevision: 3, kind: 'programAppliedLocally',
      payload: { preferenceId: preference.payload.preferenceId, previewId: 'preview-1', applicationId: 'application-1', receipt: applied } }),
    createHopAdviceEvent({ ...identity, eventId: 'restore', expectedRevision: 4, kind: 'draftRestored',
      payload: { preferenceId: preference.payload.preferenceId, applicationId: 'application-1', restorationId: 'restoration-1', receipt: restored } }),
  ];
  for (const event of additions) { dossier = applyHopAdviceEvent(dossier, event, events); events.push(event); }
  return { preview, applied, restored, dossier, events };
}

describe('conseil réel → préférence qualitative → programme local', () => {
  it('conserve X01 planification et sa préférence sans programme ni dose inventés', () => {
    const fixture = makeHopAdviceJourneyFixture('planning'), before = structuredClone(fixture);
    const study = answerQualifiedHopAdvice(fixture);
    expect(study.kind).toBe('advice');
    expect(study.requestSnapshot.action.situation.program).toBeNull();
    expect(study.serviceInput.materials[0].form).toBe('unknown');
    expect(study.responseSnapshot.result.options.length).toBeGreaterThan(0);
    const preference = prefer(study, () => true);
    expect(preference.payload).not.toHaveProperty('selection');
    expect(preference.payload).not.toHaveProperty('grams');
    const saved = createHopAdviceDossier({ ...identity, eventId: 'saved', study });
    const preferred = applyHopAdviceEvent(saved.dossier, preference, [saved.event]);
    expect(readHopDecisionDossier(structuredClone(preferred))).toEqual(preferred);
    expect(preferred.study.requestSnapshot.action.situation.program).toBeNull();
    expect(fixture).toEqual(before);
  });

  it('retire uniquement le planned X01 puis restaure le brouillon incomplet, performed/null intacts', () => {
    const fixture = makeHopAdviceJourneyFixture(), study = answerQualifiedHopAdvice(fixture);
    const preference = prefer(study, option => option.programScope.kind === 'removePlanned');
    const received = chain(study, preference, fixture.program!, [{ kind: 'remove', additionId: 'planned-follow-up-hop' }], 'existingProgram');
    expect(received.preview.proposal.program.additions).toEqual([fixture.program!.additions[0]]);
    expect(received.applied.application.after.additions[0]).toEqual(fixture.program!.additions[0]);
    expect(received.restored.draft.program).toEqual({ ...fixture.program!, revision: 6 });
    expect(received.dossier.state).toBe('draftRestored');
    expect(received.dossier.study).toEqual(study);
    expect(received.events.map(row => readHopDecisionEvent(structuredClone(row)))).toEqual(received.events);
  });

  it('remplace avec une masse explicitement fournie sans inventer g/L, analyse ou gain sensoriel', () => {
    const fixture = makeHopAdviceJourneyFixture(), candidate = addDocumentedAdviceCandidate(fixture);
    const study = answerQualifiedHopAdvice(fixture);
    const preference = prefer(study, option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(candidate.id));
    const next = { ...fixture.program!.additions[1], materialId: candidate.id, grams: 7.5 };
    const received = chain(study, preference, fixture.program!, [{ kind: 'replace', additionId: next.id, additions: [next] }], 'existingProgram');
    expect(received.applied.application.after.additions[1].grams).toBe(7.5);
    expect(received.preview.analysis.after.additions[1].doseGL.status).toBe('unknown');
    expect(received.preview.analysis.after.additions[1].alphaGrams.status).toBe('unknown');
    expect(received.applied.application.after.additions[0]).toEqual(fixture.program!.additions[0]);
    expect(received.restored.draft.program.additions).toEqual(fixture.program!.additions);
    expect(fixture.qualificationInput.variants[1].material.availableGrams).toBeNull();
    expect(received.preview.reference.length).toBeLessThan(110);
  });

  it('exige un scénario explicite pour passer d’un programme null à un vrai aperçu', () => {
    const fixture = makeHopAdviceJourneyFixture('planning'), candidate = addDocumentedAdviceCandidate(fixture);
    const study = answerQualifiedHopAdvice(fixture);
    const preference = prefer(study, option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(candidate.id));
    const program: HopDecisionProgram = { id: 'fixture-explicit-new-scenario', revision: 0, stage: 'planning', volumeL: null, wortGravity: null, additions: [] };
    const changes: HopProgramChange[] = [{ kind: 'append', addition: { id: 'explicit-first', materialId: candidate.id, status: 'planned', use: 'postFermentation', grams: 6.25 } }];
    const input = { study, currentStudy: study, preference: preference.payload, qualificationInput: fixture.qualificationInput, program, changes, reason: 'Nouveau scénario choisi.' };
    expect(() => previewPreferredHopAdvice({ ...input, origin: 'existingProgram' })).toThrow();
    const received = chain(study, preference, program, changes, 'newScenario');
    expect(received.applied.application.after.additions[0].grams).toBe(6.25);
    expect(received.restored.draft.program.additions).toEqual([]);
    expect(study.requestSnapshot.action.situation.program).toBeNull();
  });

  it('corrige seek en avoid à mots, lot et programme constants et refuse l’ancien reçu', () => {
    const fixture = makeHopAdviceJourneyFixture(), candidate = addDocumentedAdviceCandidate(fixture);
    const study = answerQualifiedHopAdvice(fixture);
    const preference = prefer(study, option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(candidate.id));
    const changes: HopProgramChange[] = [{ kind: 'replace', additionId: 'planned-follow-up-hop', additions: [{ ...fixture.program!.additions[1], materialId: candidate.id, grams: 7.5 }] }];
    const preview = previewPreferredHopAdvice({ study, currentStudy: study, preference: preference.payload, qualificationInput: fixture.qualificationInput,
      origin: 'existingProgram', program: fixture.program!, changes, reason: 'Choix sous la lecture initiale.' });
    const changed = structuredClone(fixture); changed.intent.criteria![2].role = 'avoid';
    const corrected = answerQualifiedHopAdvice(changed);
    const next = corrected.responseSnapshot.result.options.find(option => option.programScope.kind === 'addOrReplace')!;
    const old = study.responseSnapshot.result.options.find(option => option.id === preference.payload.optionId)!;
    expect(next.criterionEffects.find(row => row.criterionId === 'aroma')!.status).toBe('documentedTension');
    expect(old.criterionEffects.find(row => row.criterionId === 'aroma')!.status).toBe('documentedSupport');
    expect(changed.intent.originalQuestion).toBe(fixture.intent.originalQuestion);
    expect(corrected.reference).not.toBe(study.reference);
    expect(() => applyPreferredHopAdvice({ study, currentStudy: corrected, preference: preference.payload,
      qualificationInput: fixture.qualificationInput, currentProgram: fixture.program!, preview })).toThrow(/lecture|changé/);
    expect(preference.payload.studyReference).toBe(study.reference);
  });

  it('refuse quantité absente, cible performed, matière étrangère et données périmées', () => {
    const fixture = makeHopAdviceJourneyFixture(), candidate = addDocumentedAdviceCandidate(fixture);
    const study = answerQualifiedHopAdvice(fixture), preference = prefer(study, option => option.programScope.kind === 'addOrReplace');
    const base = { study, currentStudy: study, preference: preference.payload, qualificationInput: fixture.qualificationInput,
      origin: 'existingProgram' as const, program: fixture.program!, reason: 'Geste explicite.' };
    const addition = { ...fixture.program!.additions[1], materialId: candidate.id, grams: 7.5 };
    for (const [additionId, value] of [['planned-follow-up-hop', { ...addition, grams: null }], ['performed-late-hop', addition],
      ['planned-follow-up-hop', { ...addition, materialId: fixture.house.id }]] as const) {
      expect(() => previewPreferredHopAdvice({ ...base, changes: [{ kind: 'replace', additionId, additions: [value] }] })).toThrow();
    }
    const changed = structuredClone(fixture.qualificationInput); changed.variants[1].material.availableGrams = 0;
    expect(() => previewPreferredHopAdvice({ ...base, qualificationInput: changed,
      changes: [{ kind: 'replace', additionId: addition.id, additions: [addition] }] })).toThrow(/données|changé/);
  });

  it('archive toutes les variantes mais ne transforme pas une identité omise en action active', () => {
    const fixture = makeHopAdviceJourneyFixture(), candidate = addDocumentedAdviceCandidate(fixture);
    fixture.qualificationInput.variants.push({ ...adviceAssignment(candidate, 'other-scope'), scope: 'variety', recordId: candidate.variety!.id });
    const study = answerQualifiedHopAdvice(fixture);
    expect(study.responseSnapshot.result.coverage.omittedMaterials.some(row => row.materialId === candidate.id)).toBe(true);
    expect(study.responseSnapshot.result.options.some(row => row.programScope.kind === 'addOrReplace' && row.programScope.materialIds.includes(candidate.id))).toBe(false);
    expect(study.requestSnapshot.qualificationInput.variants).toHaveLength(3);
    expect(() => createHopAdviceDossier({ ...identity, eventId: 'saved', study })).not.toThrow();
  });

  it('garde une voie à masse explicite possible malgré des analyses concurrentes sans en choisir une', () => {
    const fixture = makeHopAdviceJourneyFixture(), candidate = addDocumentedAdviceCandidate(fixture);
    const source = candidate.product!.source;
    const first = fixture.qualificationInput.variants[1];
    first.material.declaredAnalysis = [{ analyte: 'alpha', unit: 'percentMass', kind: 'point', value: 4, basis: 'unknown', confidence: 'low', source }];
    const second = structuredClone(first); second.variantId = 'second-alpha-variant'; second.material.declaredAnalysis![0].value = 9;
    fixture.qualificationInput.variants.push(second);
    const study = answerQualifiedHopAdvice(fixture);
    expect(study.responseSnapshot.result.coverage.conditionalMaterials.some(row => row.materialId === candidate.id)).toBe(true);
    const preference = prefer(study, option => option.programScope.kind === 'addOrReplace');
    const received = chain(study, preference, fixture.program!, [{ kind: 'replace', additionId: 'planned-follow-up-hop',
      additions: [{ ...fixture.program!.additions[1], materialId: candidate.id, grams: 7.5 }] }], 'existingProgram');
    expect(received.preview.analysis.after.additions[1].alphaGrams.status).toBe('unknown');
    expect(received.applied.application.after.additions[1].grams).toBe(7.5);
    expect(received.dossier.study.requestSnapshot.qualificationInput.variants).toHaveLength(3);
  });

  it('conserve les alias du nouvel emploi futur et écarte une matière explicitement sans stock', () => {
    const fixture = makeHopAdviceJourneyFixture(), candidate = addDocumentedAdviceCandidate(fixture);
    // A planned old employment may be moved forward. This is not an executed operation.
    fixture.program!.additions[1].use = 'boil';
    const material = fixture.qualificationInput.variants[1].material;
    material.availableGrams = 100; material.stockItemRef = 'fixture-shared-stock';
    const alias = { ...structuredClone(material), id: 'fixture-unselected-alias', availableGrams: 0 };
    fixture.qualificationInput.variants.push(adviceAssignment(alias));
    const study = answerQualifiedHopAdvice(fixture), preference = prefer(study, option => option.programScope.kind === 'addOrReplace');
    const preview = previewPreferredHopAdvice({ study, currentStudy: study, preference: preference.payload, qualificationInput: fixture.qualificationInput,
      origin: 'existingProgram', program: fixture.program!, reason: 'Déplacer explicitement l’emploi futur.', changes: [{ kind: 'replace', additionId: 'planned-follow-up-hop',
        additions: [{ ...fixture.program!.additions[1], use: 'postFermentation', materialId: candidate.id, grams: 7.5 }] }] });
    expect(preview.materials.map(row => row.id)).toContain(alias.id);
    expect(preview.proposal.applicability).not.toBe('available');
    expect(preview.proposal.conditions.join(' ')).toMatch(/contradictoires/);
    // Now a genuinely known zero balance, without a conflicting alias, is unavailable.
    const empty = structuredClone(fixture); empty.qualificationInput.variants[1].material.availableGrams = 0;
    const emptyStudy = answerQualifiedHopAdvice(empty);
    expect(emptyStudy.responseSnapshot.result.options.some(option => option.programScope.kind === 'addOrReplace')).toBe(false);
  });

  it('les fabriques V1/V2 refusent le conseil et les versions futures restent des archives', () => {
    const fixture = makeHopAdviceJourneyFixture(), study = answerQualifiedHopAdvice(fixture);
    expect(() => answerQualifiedHopDecision(fixture as never)).toThrow();
    expect(() => captureHopDecisionStudy({ request: study.serviceInput, response: study.responseSnapshot } as never)).toThrow(/format/);
    expect(() => createHopDecisionDossier({ ...identity, eventId: 'old-v1', study } as never)).toThrow();
    expect(() => createHopDecisionDossierV2({ ...identity, eventId: 'old-v2', study } as never)).toThrow();
    const saved = createHopAdviceDossier({ ...identity, eventId: 'saved', study });
    const future = { ...structuredClone(saved.dossier), formatVersion: 4 };
    expect(readHopDecisionDossier(future)).toMatchObject({ status: 'unsupportedFormat', raw: future });
    const changed = structuredClone(saved.dossier); (changed.study.responseSnapshot.result as { version: string }).version = 'future-advice';
    expect(readHopAdviceDossier(changed)).toMatchObject({ status: 'unsupportedFormat', reason: 'adviceVersion', raw: changed });
  });

  it('refuse une lecture étrangère, un passé réécrit ou un faux retour même avec empreinte recalculée', () => {
    const fixture = makeHopAdviceJourneyFixture(), study = answerQualifiedHopAdvice(fixture);
    const preference = prefer(study, option => option.programScope.kind === 'removePlanned');
    const saved = createHopAdviceDossier({ ...identity, eventId: 'saved', study });
    const changed = structuredClone(preference);
    changed.payload.interpretation = 'Autre lecture, non soumise au service.';
    changed.payload.interpretationReference = hopAdviceInterpretationReference({ studyReference: changed.payload.studyReference,
      resultReference: changed.payload.resultReference, optionId: changed.payload.optionId,
      optionReference: changed.payload.optionReference, interpretation: changed.payload.interpretation });
    const { preferenceReference: _old, ...content } = changed.payload;
    changed.payload.preferenceReference = hopAdvicePreferenceReference(content);
    expect(() => applyHopAdviceEvent(saved.dossier, changed, [saved.event])).toThrow(/étude/);
    const received = chain(study, preference, fixture.program!, [{ kind: 'remove', additionId: 'planned-follow-up-hop' }], 'existingProgram');
    const preferred = applyHopAdviceEvent(saved.dossier, preference, [saved.event]);
    const forged = structuredClone(received.preview);
    forged.proposal.program.additions[0].grams = 12;
    forged.reference = hopAdviceProgramPreviewReference(forged);
    expect(() => {
      const badPreview = captureHopAdvicePreviewEvent({ identity: { ...identity, eventId: 'bad-preview', expectedRevision: 2 }, previewId: 'bad', receipt: forged });
      applyHopAdviceEvent(preferred, badPreview, [saved.event, preference]);
    }).toThrow(/effectué/);
    const relabeled = { ...received.preview, origin: 'newScenario' as const };
    relabeled.reference = hopAdviceProgramPreviewReference(relabeled);
    const badOrigin = captureHopAdvicePreviewEvent({ identity: { ...identity, eventId: 'bad-origin', expectedRevision: 2 }, previewId: 'bad-origin', receipt: relabeled });
    expect(() => applyHopAdviceEvent(preferred, badOrigin, [saved.event, preference])).toThrow(/sans programme/);
    let beforeRestore = saved.dossier;
    for (let i = 1; i < 4; i++) beforeRestore = applyHopAdviceEvent(beforeRestore, received.events[i], received.events.slice(0, i));
    const restoration = structuredClone(received.events[4]);
    if (restoration.kind !== 'draftRestored') throw Error('Fixture de restauration requise.');
    restoration.payload.receipt.draft.program.additions[1].grams = 2;
    restoration.payload.receipt.reference = hopAdviceDraftRestorationReference(restoration.payload.receipt);
    expect(() => applyHopAdviceEvent(beforeRestore, restoration, received.events.slice(0, 4))).toThrow(/retour de brouillon/i);
  });

  it('garde des références courtes avec les vrais six packs, sans ouvrir leur scope par défaut', async () => {
    const fixture = makeHopAdviceJourneyFixture('planning');
    fixture.qualificationInput = await loadHopCatalogueQualificationInput({ additionalVariants: fixture.qualificationInput.variants });
    const study = answerQualifiedHopAdvice(fixture), preference = prefer(study, () => true);
    expect(study.requestSnapshot.qualificationInput.variants.length).toBeGreaterThan(100);
    expect(study.responseSnapshot.result.coverage.consideredMaterialIds).toEqual([fixture.house.id]);
    expect(study.reference.length).toBeLessThan(100);
    expect(preference.payload.preferenceReference.length).toBeLessThan(110);
    expect(JSON.stringify(preference).length).toBeLessThan(3000);
    expect(() => createHopAdviceDossier({ ...identity, eventId: 'saved', study })).not.toThrow();
  });
});
