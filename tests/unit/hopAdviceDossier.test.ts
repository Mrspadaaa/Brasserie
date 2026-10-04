import { describe, expect, it } from 'vitest';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import { type HopDecisionMaterial, type HopDecisionProgram, type HopProgramChange } from '../../src/domain/hopDecision/types';
import type { HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import { analyzeHopProgram } from '../../src/domain/hopDecision/programAnalysis';
import { applyHopProgramProposal, previewHopProgramChanges, restoreHopProgramDraft } from '../../src/domain/hopDecision/programs';
import { answerQualifiedHopAdvice } from '../../src/domain/hopDecision/qualifiedAdvice';
import {
  HOP_ADVICE_DOSSIER_FORMAT_VERSION, HOP_ADVICE_EVENT_FORMAT_VERSION,
  applyHopAdviceEvent, createHopAdviceDossier, createHopAdviceEvent,
  hopAdviceDraftRestorationReference, hopAdviceInterpretationReference, hopAdvicePreferenceReference,
  hopAdviceProgramApplicationReference, hopAdviceProgramPreviewReference, hopAdviceStudyReference,
  readHopAdviceDossier, readHopAdviceEvent, type HopAdviceDossierV3, type HopAdviceEventV3,
  type HopAdvicePreferenceContent, type HopAdviceProgramPreviewReceipt, type HopAdviceStudyV3,
} from '../../src/domain/hopDecision/adviceDossier';
import {
  hopAdviceResultReference, type HopAdviceOption,
} from '../../src/domain/hopDecision/adviceSchema';

function material(id = 'petal'): HopDecisionMaterial {
  return { id, name: `Fixture ${id}`, form: 'pelletT90', availableGrams: 100, stockItemRef: `fixture-stock:${id}`,
    variety: { id: `variety:${id}`, name: `Fixture ${id}`, aliases: [], form: 'pelletT90', descriptions: [], analysis: [] },
    lot: { id: `lot:${id}`, varietyId: `variety:${id}`, name: `Fixture ${id}`, form: 'pelletT90', analysis: [] } };
}

function program(id = 'existing-program', grams = 10): HopDecisionProgram {
  return { id, revision: 2, stage: 'planning', volumeL: 18, wortGravity: 1.048,
    additions: [{ id: 'planned-main', materialId: 'woody', grams, use: 'boil', boilMinutes: 20, status: 'planned' }] };
}

function makeStudy(options: { originalQuestion?: string; program?: HopDecisionProgram | null } = {}): {
  study: HopAdviceStudyV3; material: HopDecisionMaterial; program: HopDecisionProgram | null; variants: HopCatalogueVariant[];
} {
  const variants: HopCatalogueVariant[] = ['petal', 'woody'].map(id => {
    const variantMaterial = material(id);
    return { variantId: `assignment:${id}`, scope: 'assignment', recordId: variantMaterial.id,
      origin: { kind: 'assignment' }, material: structuredClone(variantMaterial) };
  });
  const situation = { stage: 'planning' as const, program: options.program ?? null, materialIds: ['petal'],
    assertions: [], criterionDimensions: [], exclusions: [] };
  const intent = { originalQuestion: options.originalQuestion ?? 'Quelles pistes sont défendables ici ?', criteria: [] };
  const study = answerQualifiedHopAdvice({ intent, action: { kind: 'exploreStrategies', situation }, qualificationInput: { variants } });
  const projectedMaterial = study.serviceInput.materials.find(row => row.id === 'petal');
  if (!projectedMaterial) throw new Error('Fixture de conseil réelle sans projection petal.');
  return { study, material: projectedMaterial, program: situation.program, variants };
}

function preference(study: HopAdviceStudyV3, option: HopAdviceOption, preferenceId: string, reason: string): HopAdvicePreferenceContent & { preferenceReference: string } {
  const resultReference = hopAdviceResultReference(study.responseSnapshot.result);
  const interpretation = study.requestSnapshot.intent.interpretation ?? '';
  const content: HopAdvicePreferenceContent = { preferenceId, studyReference: study.reference, resultReference,
    optionId: option.id, optionReference: option.reference, programScope: structuredClone(option.programScope),
    interpretation, interpretationReference: hopAdviceInterpretationReference({ studyReference: study.reference, resultReference,
      optionId: option.id, optionReference: option.reference, interpretation }),
    reason };
  return { ...content, preferenceReference: hopAdvicePreferenceReference(content) };
}

function previewReceipt(input: {
  study: HopAdviceStudyV3; pref: HopAdvicePreferenceContent & { preferenceReference: string }; option: HopAdviceOption;
  before: HopDecisionProgram; material: HopDecisionMaterial; variants: HopCatalogueVariant[]; changes: HopProgramChange[];
  origin: 'existingProgram' | 'newScenario'; reason: string;
}) {
  const proposal = previewHopProgramChanges(input.before, input.changes, [input.material]);
  const payload: Omit<HopAdviceProgramPreviewReceipt, 'reference'> = {
    format: 'hop-advice-program-preview-v1', studyReference: input.study.reference,
    preferenceId: input.pref.preferenceId, preferenceReference: input.pref.preferenceReference,
    optionId: input.option.id, optionReference: input.option.reference, origin: input.origin,
    before: structuredClone(input.before), proposal, materials: [input.material],
    qualificationInput: { variants: structuredClone(input.variants) },
    qualificationSnapshot: input.study.qualificationSnapshot,
    analysis: { before: analyzeHopProgram(input.before, [input.material]), after: analyzeHopProgram(proposal.program, [input.material]) },
    declaration: { origin: 'explicitUserInput', reason: input.reason },
  };
  return { ...payload, reference: hopAdviceProgramPreviewReference(payload) };
}

function addEvent<K extends Parameters<typeof createHopAdviceEvent>[0]['kind']>(input: {
  dossier: HopAdviceDossierV3; history: HopAdviceEventV3[]; eventId: string; kind: K; payload: any; recordedAt: string;
}): { dossier: HopAdviceDossierV3; history: HopAdviceEventV3[] } {
  const event = createHopAdviceEvent({ ownerKey: input.dossier.ownerKey, dossierId: input.dossier.dossierId, eventId: input.eventId,
    expectedRevision: input.dossier.revision, recordedAt: input.recordedAt, kind: input.kind, payload: input.payload } as any) as unknown as HopAdviceEventV3;
  const dossier = applyHopAdviceEvent(input.dossier, event, input.history);
  return { dossier, history: [...input.history, event] };
}

describe('dossier de conseil v3', () => {
  it('archive un conseil J4 réellement exécuté sans préférer une option ni créer un programme', () => {
    const { study } = makeStudy({ program: null });
    const created = createHopAdviceDossier({ ownerKey: 'fixture-owner', dossierId: 'advice-open', eventId: 'advice-open-saved',
      recordedAt: '2026-10-01T10:00:00.000Z', study });
    expect(created.dossier).toMatchObject({ formatVersion: HOP_ADVICE_DOSSIER_FORMAT_VERSION, revision: 1, state: 'studySaved', study: { kind: 'advice' } });
    expect(created.event).toMatchObject({ eventFormatVersion: HOP_ADVICE_EVENT_FORMAT_VERSION, kind: 'studySaved', payload: { snapshotFormatVersion: 3 } });
    expect(created.dossier.study.requestSnapshot.action.situation.program).toBeNull();
    expect(readHopAdviceDossier(created.dossier)).toEqual(created.dossier);
    expect(created.dossier.study.responseSnapshot.result.options.length).toBeGreaterThan(0);
    expect(created.dossier.study.responseSnapshot.result.options[0]).not.toHaveProperty('grams');
  });

  it('conserve plusieurs préférences qualitatives et les relie à deux previews, applications et retours réels', () => {
    const baseline = program();
    const { study, material: safeMaterial, variants } = makeStudy({ program: baseline });
    const created = createHopAdviceDossier({ ownerKey: 'fixture-owner', dossierId: 'advice-program', eventId: 'advice-program-saved',
      recordedAt: '2026-10-01T10:00:00.000Z', study });
    let dossier = created.dossier;
    let history: HopAdviceEventV3[] = [created.event];
    const removeOption = study.responseSnapshot.result.options.find(option => option.programScope.kind === 'removePlanned');
    const replaceOption = study.responseSnapshot.result.options.find(option => option.programScope.kind === 'addOrReplace');
    expect(removeOption).toBeDefined();
    expect(replaceOption).toBeDefined();
    const preferOne = preference(study, removeOption!, 'preference-remove', 'Retirer seulement cet ajout prévu.');
    const preferTwo = preference(study, replaceOption!, 'preference-replace', 'Comparer une autre voie de programme.');
    const first = addEvent({ dossier, history, eventId: 'preferred-remove', kind: 'strategyPreferred', payload: preferOne,
      recordedAt: '2026-10-01T10:01:00.000Z' });
    dossier = first.dossier; history = first.history;
    expect(first.history[1].kind).toBe('strategyPreferred');
    expect(first.history[1].payload).not.toHaveProperty('grams');
    expect(first.history[1].payload).not.toHaveProperty('selectedDoses');
    const second = addEvent({ dossier, history, eventId: 'preferred-replace', kind: 'strategyPreferred', payload: preferTwo,
      recordedAt: '2026-10-01T10:02:00.000Z' });
    dossier = second.dossier; history = second.history;
    expect(second.history.filter(event => event.kind === 'strategyPreferred')).toHaveLength(2);

    const removePreview = previewReceipt({ study, pref: preferOne, option: removeOption!, before: baseline,
      material: safeMaterial, variants, changes: [{ kind: 'remove', additionId: 'planned-main' }], origin: 'existingProgram',
      reason: 'Programme existant cité et vérifié par le brasseur.' });
    const previewOne = addEvent({ dossier, history, eventId: 'preview-remove', kind: 'programPreviewed', payload: {
      preferenceId: preferOne.preferenceId, previewId: 'preview-remove-id', receipt: removePreview,
    }, recordedAt: '2026-10-01T10:03:00.000Z' });
    dossier = previewOne.dossier; history = previewOne.history;

    // Two alternative previews of the same frozen baseline, not a different program under the old advice.
    const scenario = structuredClone(baseline);
    const replacePreview = previewReceipt({ study, pref: preferTwo, option: replaceOption!, before: scenario,
      material: safeMaterial, variants, changes: [{ kind: 'replace', additionId: 'planned-main', additions: [{
        ...scenario.additions[0], materialId: 'petal', grams: 6,
      }] }], origin: 'existingProgram', reason: 'Autre remplacement avec une masse explicitement fournie sur cette base.' });
    const previewTwo = addEvent({ dossier, history, eventId: 'preview-replace', kind: 'programPreviewed', payload: {
      preferenceId: preferTwo.preferenceId, previewId: 'preview-replace-id', receipt: replacePreview,
    }, recordedAt: '2026-10-01T10:04:00.000Z' });
    dossier = previewTwo.dossier; history = previewTwo.history;
    expect(previewTwo.history.filter(event => event.kind === 'programPreviewed')).toHaveLength(2);

    const applicationOne = applyHopProgramProposal(baseline, removePreview.proposal, [safeMaterial]);
    const applicationOnePayload = { format: 'hop-advice-local-application-v1' as const, studyReference: study.reference,
      preferenceId: preferOne.preferenceId, preferenceReference: preferOne.preferenceReference,
      previewReference: removePreview.reference, application: applicationOne };
    const appOneReceipt = { ...applicationOnePayload, reference: hopAdviceProgramApplicationReference(applicationOnePayload) };
    const appOne = addEvent({ dossier, history, eventId: 'apply-remove', kind: 'programAppliedLocally', payload: {
      preferenceId: preferOne.preferenceId, previewId: 'preview-remove-id', applicationId: 'application-remove-id', receipt: appOneReceipt,
    }, recordedAt: '2026-10-01T10:05:00.000Z' });
    dossier = appOne.dossier; history = appOne.history;

    const applicationTwo = applyHopProgramProposal(scenario, replacePreview.proposal, [safeMaterial]);
    const applicationTwoPayload = { format: 'hop-advice-local-application-v1' as const, studyReference: study.reference,
      preferenceId: preferTwo.preferenceId, preferenceReference: preferTwo.preferenceReference,
      previewReference: replacePreview.reference, application: applicationTwo };
    const appTwoReceipt = { ...applicationTwoPayload, reference: hopAdviceProgramApplicationReference(applicationTwoPayload) };
    const appTwo = addEvent({ dossier, history, eventId: 'apply-replace', kind: 'programAppliedLocally', payload: {
      preferenceId: preferTwo.preferenceId, previewId: 'preview-replace-id', applicationId: 'application-replace-id', receipt: appTwoReceipt,
    }, recordedAt: '2026-10-01T10:06:00.000Z' });
    dossier = appTwo.dossier; history = appTwo.history;
    expect(appTwo.history.filter(event => event.kind === 'programAppliedLocally')).toHaveLength(2);

    const draftOne = restoreHopProgramDraft(applicationOne.after, applicationOne, [safeMaterial]);
    const draftOnePayload = { format: 'hop-advice-draft-restoration-v1' as const, studyReference: study.reference,
      preferenceId: preferOne.preferenceId, preferenceReference: preferOne.preferenceReference,
      applicationReference: appOneReceipt.reference, currentProgram: applicationOne.after, draft: draftOne };
    const restoredOne = addEvent({ dossier, history, eventId: 'restore-remove', kind: 'draftRestored', payload: {
      preferenceId: preferOne.preferenceId, applicationId: 'application-remove-id', restorationId: 'restore-remove-id',
      receipt: { ...draftOnePayload, reference: hopAdviceDraftRestorationReference(draftOnePayload) },
    }, recordedAt: '2026-10-01T10:07:00.000Z' });
    dossier = restoredOne.dossier; history = restoredOne.history;

    const draftTwo = restoreHopProgramDraft(applicationTwo.after, applicationTwo, [safeMaterial]);
    const draftTwoPayload = { format: 'hop-advice-draft-restoration-v1' as const, studyReference: study.reference,
      preferenceId: preferTwo.preferenceId, preferenceReference: preferTwo.preferenceReference,
      applicationReference: appTwoReceipt.reference, currentProgram: applicationTwo.after, draft: draftTwo };
    const restoredTwo = addEvent({ dossier, history, eventId: 'restore-replace', kind: 'draftRestored', payload: {
      preferenceId: preferTwo.preferenceId, applicationId: 'application-replace-id', restorationId: 'restore-replace-id',
      receipt: { ...draftTwoPayload, reference: hopAdviceDraftRestorationReference(draftTwoPayload) },
    }, recordedAt: '2026-10-01T10:08:00.000Z' });
    dossier = restoredTwo.dossier; history = restoredTwo.history;
    expect(restoredTwo.dossier.revision).toBe(9);
    expect(restoredTwo.dossier.state).toBe('draftRestored');
    expect(readHopAdviceDossier(restoredTwo.dossier)).toEqual(restoredTwo.dossier);

    const correctedStudy = makeStudy({ originalQuestion: 'Lecture corrigée : quelles options restent défendables ?', program: baseline }).study;
    const successor = createHopAdviceDossier({ ownerKey: 'fixture-owner', dossierId: 'advice-successor', eventId: 'successor-saved',
      recordedAt: '2026-10-01T10:09:00.000Z', study: correctedStudy, supersedesDossierId: dossier.dossierId });
    const correction = addEvent({ dossier, history, eventId: 'correction-recorded', kind: 'correctionRecorded', payload: {
      successorDossierId: successor.dossier.dossierId, reason: 'Lecture de la demande corrigée; historique antérieur conservé.', correctedAssertionIds: [],
    }, recordedAt: '2026-10-01T10:09:30.000Z' });
    dossier = correction.dossier; history = correction.history;
    expect(correction.dossier).toMatchObject({ state: 'correctionRecorded' });
    expect(correction.dossier.supersededByDossierId).toBeUndefined();
    const supersession = addEvent({ dossier, history, eventId: 'superseded-by-successor', kind: 'supersededBy', payload: {
      successorDossierId: successor.dossier.dossierId, reason: 'Le successeur explicite porte la lecture corrigée.',
    }, recordedAt: '2026-10-01T10:10:00.000Z' });
    expect(supersession.dossier).toMatchObject({ state: 'supersededBy', supersededByDossierId: successor.dossier.dossierId });
  });

  it('garde les versions inconnues brutes en lecture seule et refuse une préférence liée à une autre option', () => {
    const { study } = makeStudy();
    const created = createHopAdviceDossier({ ownerKey: 'fixture-owner', dossierId: 'advice-versions', eventId: 'advice-versions-saved',
      recordedAt: '2026-10-01T11:00:00.000Z', study });
    const future = structuredClone(created.dossier) as any;
    future.study.responseSnapshot.result.version = 'hop-strategy-advice-v99';
    expect(readHopAdviceDossier(future)).toMatchObject({ status: 'unsupportedFormat', reason: 'adviceVersion', raw: future });
    expect(readHopAdviceEvent({ ...created.event, eventFormatVersion: 2 })).toMatchObject({ status: 'unsupportedEventFormat', eventFormatVersion: 2 });

    const wrongPreference = preference(study, { ...study.responseSnapshot.result.options[0], id: 'not-in-result' }, 'wrong-pref', 'Option fausse.');
    const event = createHopAdviceEvent({ ownerKey: created.dossier.ownerKey, dossierId: created.dossier.dossierId, eventId: 'wrong-preference',
      expectedRevision: 1, recordedAt: '2026-10-01T11:01:00.000Z', kind: 'strategyPreferred', payload: wrongPreference });
    expect(() => applyHopAdviceEvent(created.dossier, event, [created.event])).toThrow(/option exacte du résultat/i);

    const mismatchedProjection = structuredClone(study) as any;
    mismatchedProjection.serviceInput.materials[0].availableGrams += 1;
    mismatchedProjection.reference = hopAdviceStudyReference(mismatchedProjection);
    expect(() => createHopAdviceDossier({ ownerKey: 'fixture-owner', dossierId: 'advice-tampered', eventId: 'advice-tampered-saved',
      recordedAt: '2026-10-01T11:02:00.000Z', study: mismatchedProjection })).toThrow(/projection qualifiée exacte/i);

    const mismatchedResponse = structuredClone(study) as any;
    const woodyProjection = mismatchedResponse.qualificationSnapshot.result.groups
      .find((group: any) => group.rawVariants.some((variant: any) => variant.material.id === 'woody')).calculationProjection.material;
    mismatchedResponse.serviceInput.materials = [woodyProjection];
    mismatchedResponse.reference = hopAdviceStudyReference(mismatchedResponse);
    expect(() => createHopAdviceDossier({ ownerKey: 'fixture-owner', dossierId: 'advice-response-mismatch', eventId: 'advice-response-saved',
      recordedAt: '2026-10-01T11:02:30.000Z', study: mismatchedResponse })).toThrow(/réponse de conseil ne correspond pas/i);

    const forgedProjection = { ...created.dossier, state: 'strategyPreferred' } as any;
    const nextPreference = preference(study, study.responseSnapshot.result.options[0], 'preference-stale', 'Préférence de test.');
    const stale = createHopAdviceEvent({ ownerKey: created.dossier.ownerKey, dossierId: created.dossier.dossierId, eventId: 'stale-event',
      expectedRevision: 0, recordedAt: '2026-10-01T11:03:00.000Z', kind: 'strategyPreferred', payload: nextPreference });
    expect(() => applyHopAdviceEvent(forgedProjection, stale, [created.event])).toThrow(/projection v3 ne correspond pas/i);
    expect(() => applyHopAdviceEvent(created.dossier, stale, [created.event])).toThrow(/révision du dossier conseil est périmée/i);
  });
});
