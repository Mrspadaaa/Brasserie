import { describe, expect, it, vi } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import * as propertyAdviceModule from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import * as decisionModule from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55AdoptedContextBinding, resolveHopV55AdoptedContext } from '../../src/services/hopV55/adoptedContextResolution';
import { adoptHopV55ReferenceHypothesis, getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import { hopV55Workspace } from '../fixtures/hopV55';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import {
  createHopV55PropertyAdviceAnswerRecordV3,
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT,
} from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  createHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceV4Transition,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { prepareCorrectionV4, resumeV4, upgradeV3ToV4,
  type PrepareHopV55PropertyAdviceCorrectionV4Input, type PrepareHopV55PropertyAdviceCorrectionV4Result }
  from '../../src/services/hopV55/propertyAdvicePreparationV4';
import type { HopV55AdoptedContextBindingV1 } from '../../src/services/hopV55/adoptedContextResolution';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';

const ownerKey = 'owner:property-advice-v4-fixture';
const workspaceId = 'workspace:property-advice-v4-fixture';
const recordedAt = '2026-10-03T17:20:00.000Z';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie.' };
const question = 'Je veux plus de poire et garder le floral.';

function fixture(questionText = question) {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(questionText, prepared);
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:v4-source', ownerKey, workspaceId, recordedAt,
    reading, source: { kind: 'exploration' }, runtimeReference: 'runtime:v4-fixture' });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'request:v4-parent',
    ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy });
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot, answerRecordId: 'answer:v3-parent' });
  return { context, prepared, reading, archive, draft, record };
}

function transition(input: {
  kind: HopV55PropertyAdviceV4Transition['kind'];
  parentRecordReference: string;
  parentReadingReference: string;
  actId: string;
  recordedAt?: string;
}): HopV55PropertyAdviceV4Transition {
  return { kind: input.kind, parentRecordReference: input.parentRecordReference,
    parentReadingReference: input.parentReadingReference, actId: input.actId,
    reason: 'Action de correction V4 explicite pour la fixture.',
    actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: input.recordedAt ?? recordedAt };
}

function upgrade(source: ReturnType<typeof fixture>, opts: { binding?: HopV55AdoptedContextBindingV1 | null } = {}) {
  return upgradeV3ToV4({ sourceRecord: source.record, sourceReadingArchive: source.archive, prepared: source.prepared,
    recordId: 'record:v4-upgrade', requestId: 'request:v4-upgrade', transition: transition({ kind: 'upgradeV3',
      parentRecordReference: source.record.reference, parentReadingReference: source.record.sourceReadingReference,
      actId: 'act:v4-upgrade' }), ...(opts.binding !== undefined ? { cultureBinding: opts.binding } : {}) });
}

function sealV4(result: PrepareHopV55PropertyAdviceCorrectionV4Result): HopV55PropertyAdviceAnswerRecordV4 {
  if (result.status === 'ready') {
    const answerSnapshot = buildHopPropertyAdviceV3(result.requestDraftV3.requestSnapshot);
    return createHopV55PropertyAdviceAnswerRecordV4({ draft: result.recordDraft, outcome: {
      kind: 'domainAnswer', requestDraftReference: result.requestDraftV3.reference,
      answerSnapshot, answerReference: answerSnapshot.reference,
    } });
  }
  return createHopV55PropertyAdviceAnswerRecordV4({ draft: result.recordDraft, outcome: { kind: 'allRejected' } });
}

function reviseInput(source: ReturnType<typeof fixture>, record: HopV55PropertyAdviceAnswerRecordV4,
  actions: NonNullable<PrepareHopV55PropertyAdviceCorrectionV4Input['actions']>, ids: { recordId: string; requestId?: string }) {
  return { sourceRecord: record, sourceReadingArchive: source.archive, prepared: source.prepared,
    recordId: ids.recordId, ...(ids.requestId ? { requestId: ids.requestId } : {}),
    transition: transition({ kind: 'revise', parentRecordReference: record.reference,
      parentReadingReference: record.sourceReadingReference, actId: `act:${ids.recordId}` }), actions };
}

describe('préparation V4 du conseil par propriété', () => {
  it('promote explicitement un V3 sans reparsing et conserve les sources/annotations dans le ledger', () => {
    const source = fixture();
    const sourceBefore = structuredClone(source.record);
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    const result = upgrade(source);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('L’upgrade de la fixture active doit créer une projection V3.');
    expect(parser).not.toHaveBeenCalled();
    expect(result.recordDraft.format).toBe('hop-v55-documentary-answer-record-v4');
    expect(result.recordDraft.sourceReadingReference).toBe(source.archive.contentReference);
    expect(result.recordDraft.preparation.source).toEqual(source.archive.source);
    expect(result.recordDraft.ledger.sourceAnnotations).toEqual(source.record.answerSnapshot.requestSnapshot.propertyIntents);
    expect(result.recordDraft.ledger.entries.every(entry => entry.sourceKind === 'initial'
      && entry.disposition === 'active' && entry.decision.kind === 'initialize')).toBe(true);
    expect(result.requestDraftV3.requestSnapshot.propertyIntents).toEqual(source.record.answerSnapshot.requestSnapshot.propertyIntents);
    expect(source.record.format).toBe(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V3_FORMAT);
    expect(source.record).toEqual(sourceBefore);
    parser.mockRestore();
  });

  it('projette seulement les actifs; le rejet garde son annotation et ses spans d’origine', () => {
    const source = fixture();
    const upgraded = upgrade(source);
    const record = sealV4(upgraded);
    const parentBefore = structuredClone(record);
    const pear = source.record.answerSnapshot.requestSnapshot.propertyIntents.find(intent => intent.sourceSpans.some(span => span.text === 'poire'))!;
    const flower = source.record.answerSnapshot.requestSnapshot.propertyIntents.find(intent => intent.sourceSpans.some(span => span.text === 'floral'))!;
    const result = prepareCorrectionV4(reviseInput(source, record, [{ kind: 'reject', annotationId: pear.id,
      reason: 'Cette annotation n’est pas retenue dans cette lecture.' }], { recordId: 'record:v4-reject-pear', requestId: 'request:v4-only-floral' }));

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Le floral reste actif après le rejet de la poire.');
    expect(result.requestDraftV3.requestSnapshot.propertyIntents).toEqual([flower]);
    const latestPear = result.recordDraft.ledger.entries.filter(entry => entry.annotationId === pear.id).at(-1)!;
    expect(latestPear).toMatchObject({ disposition: 'rejected', sourceAnnotation: pear, sourceKind: 'initial' });
    expect(latestPear).not.toHaveProperty('activeIntent');
    expect(latestPear.sourceAnnotation.interpretationOrigin).toBe(pear.interpretationOrigin);
    expect(result.recordDraft.ledger.entries.length).toBe(result.recordDraft.ledger.sourceAnnotations.length + 1);
    expect(result.recordDraft.readingContext).toEqual(expect.objectContaining({ candidatePolicy, context: source.draft.requestSnapshot.context }));
    expect(record).toEqual(parentBefore);
  });

  it('lie une annotation ajoutée à son acte et à la lecture source exacte', () => {
    const source = fixture('Je veux plus de poire et garder le floral; conserver la banane comme autre cible.');
    const upgraded = upgrade(source);
    const record = sealV4(upgraded);
    const start = source.archive.reading.intent.question.indexOf('banane');
    const sourceAnnotation = {
      id: 'manual:banana-v4', property: 'unresolved' as const, label: 'banane', role: 'target' as const,
      direction: 'increase' as const, qualification: null, required: true,
      comparisonBasis: { kind: 'qualitativeTarget' as const, assertionIds: [] }, metric: 'unspecified' as const,
      subject: { kind: 'unspecified' as const, label: 'Sujet à qualifier', materialId: null, sensoryContext: 'unspecified' as const },
      sourceSpans: [{ start, end: start + 'banane'.length, text: 'banane' }],
      interpretationOrigin: 'user' as const, basis: 'Annotation ajoutée explicitement par le brasseur.', relatedIntentIds: [],
    };
    const result = prepareCorrectionV4(reviseInput(source, record, [{ kind: 'add', sourceAnnotation,
      activeIntent: structuredClone(sourceAnnotation), reason: 'Ajout confirmé depuis le fragment exact.' }], {
      recordId: 'record:v4-added', requestId: 'request:v4-added' }));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('L’ajout explicite doit rejoindre la projection active.');
    const added = result.recordDraft.ledger.entries.find(entry => entry.annotationId === sourceAnnotation.id)!;
    expect(added).toMatchObject({ sourceKind: 'added', additionActId: result.recordDraft.transition.actId,
      sourceQuestionReference: source.archive.contentReference, sourceAnnotation, disposition: 'active', activeIntent: sourceAnnotation,
      decision: { kind: 'add', actId: result.recordDraft.transition.actId } });
    expect(source.archive.reading.intent.question.slice(start, start + 'banane'.length)).toBe('banane');
  });

  it('réexamine une lecture successorale sans réattribuer la source d’une annotation ajoutée en A', () => {
    const source = fixture('Je veux plus de poire et garder le floral; conserver la banane comme autre cible.');
    const upgraded = upgrade(source);
    const record = sealV4(upgraded);
    const start = source.archive.reading.intent.question.indexOf('banane');
    const annotation = {
      id: 'manual:banana-reexamine-v4', property: 'unresolved' as const, label: 'banane', role: 'target' as const,
      direction: 'increase' as const, qualification: null, required: true,
      comparisonBasis: { kind: 'qualitativeTarget' as const, assertionIds: [] }, metric: 'unspecified' as const,
      subject: { kind: 'unspecified' as const, label: 'Sujet à qualifier', materialId: null, sensoryContext: 'unspecified' as const },
      sourceSpans: [{ start, end: start + 'banane'.length, text: 'banane' }],
      interpretationOrigin: 'user' as const, basis: 'Annotation ajoutée explicitement par le brasseur.', relatedIntentIds: [],
    };
    const added = prepareCorrectionV4(reviseInput(source, record, [{ kind: 'add', sourceAnnotation: annotation,
      activeIntent: structuredClone(annotation), reason: 'Ajout depuis la lecture A.' }], {
      recordId: 'record:v4-added-A', requestId: 'request:v4-added-A' }));
    const addedRecord = sealV4(added);
    const archiveB = createHopV55DecisionReadingArchiveV2({ id: 'reading:v4-source-B', ownerKey, workspaceId,
      recordedAt: '2026-10-03T18:12:00.000Z', reading: source.archive.reading,
      source: source.archive.source, runtimeReference: source.archive.runtimeReference });
    const resumed = prepareCorrectionV4({ sourceRecord: addedRecord, sourceReadingArchive: archiveB,
      prepared: source.prepared, recordId: 'record:v4-reexamine-B', requestId: 'request:v4-reexamine-B',
      transition: transition({ kind: 'reexamine', parentRecordReference: addedRecord.reference,
        parentReadingReference: addedRecord.sourceReadingReference, actId: 'act:v4-reexamine-B' }),
      readingContext: addedRecord.readingContext, cultureBinding: null, actions: [] });

    expect(resumed.status).toBe('ready');
    if (resumed.status !== 'ready') throw new Error('Le réexamen B garde la projection active sans parser.');
    const first = resumed.recordDraft.ledger.entries.find(entry => entry.annotationId === annotation.id)!;
    expect(resumed.recordDraft.sourceReadingReference).toBe(archiveB.contentReference);
    expect(first).toMatchObject({ sourceKind: 'added', additionActId: 'act:record:v4-added-A',
      sourceQuestionReference: source.archive.contentReference, sourceAnnotation: annotation });
    expect(first.sourceQuestionReference).not.toBe(resumed.recordDraft.sourceReadingReference);

    const savedB = sealV4(resumed);
    expect(readHopV55PropertyAdviceAnswerRecordV4(savedB)).toMatchObject({ status: 'readOnly', record: {
      sourceReadingReference: archiveB.contentReference, ledger: { sourceAnnotations: expect.arrayContaining([annotation]) } } });
    expect(resumeV4({ record: savedB, sourceReadingArchive: archiveB, prepared: source.prepared }).status).toBe('ready');
  });

  it('archive allRejected sans request ni réponse et restaure par une nouvelle entrée active', () => {
    const source = fixture();
    const upgraded = upgrade(source);
    const all = source.record.answerSnapshot.requestSnapshot.propertyIntents;
    const upgradedRecord = sealV4(upgraded);
    const builder = vi.spyOn(propertyAdviceModule, 'buildHopPropertyAdviceV3');
    const allRejected = prepareCorrectionV4(reviseInput(source, upgradedRecord, all.map(intent => ({ kind: 'reject' as const,
      annotationId: intent.id, reason: 'Rejet explicite de la proposition.' })), { recordId: 'record:v4-all-rejected' }));
    expect(builder).not.toHaveBeenCalled();
    builder.mockRestore();
    expect(allRejected.status).toBe('allRejected');
    const sealedRejected = sealV4(allRejected);
    expect(sealedRejected.outcome).toEqual({ kind: 'allRejected' });
    expect(sealedRejected.readingContext).toEqual(upgraded.recordDraft.readingContext);
    expect(readHopV55PropertyAdviceAnswerRecordV4(sealedRejected)).toMatchObject({ status: 'readOnly', record: { outcome: { kind: 'allRejected' } } });

    const sourceIntent = all[0];
    const restored = prepareCorrectionV4({ sourceRecord: sealedRejected, sourceReadingArchive: source.archive,
      prepared: source.prepared, recordId: 'record:v4-restored', requestId: 'request:v4-restored',
      transition: transition({ kind: 'revise', parentRecordReference: sealedRejected.reference,
        parentReadingReference: sealedRejected.sourceReadingReference, actId: 'act:v4-restored' }),
      actions: [{ kind: 'restore', annotationId: sourceIntent.id,
        activeIntent: { ...structuredClone(sourceIntent), interpretationOrigin: 'user' },
        reason: 'Restauration choisie à partir du registre.' }] });
    expect(restored.status).toBe('ready');
    if (restored.status !== 'ready') throw new Error('La restauration explicite doit créer une nouvelle projection active.');
    const entries = restored.recordDraft.ledger.entries.filter(entry => entry.annotationId === sourceIntent.id);
    expect(entries.map(entry => entry.disposition)).toEqual(['active', 'rejected', 'active']);
    expect(entries[1]).not.toHaveProperty('activeIntent');
    expect(entries[2]).toMatchObject({ decision: { kind: 'restore', predecessorEntryReference: entries[1].reference },
      activeIntent: { id: sourceIntent.id, interpretationOrigin: 'user' }, sourceAnnotation: sourceIntent });
    expect(restored.requestDraftV3.requestSnapshot.propertyIntents).toEqual([entries[2].activeIntent]);
  });

  it('refuse un lien actif vers un constat rejeté, sans nettoyer la compensation en silence', () => {
    const source = fixture('Ma bière est trop sucrée, comment compenser ça avec mon houblon ?');
    const upgraded = upgrade(source);
    const record = sealV4(upgraded);
    const intents = source.record.answerSnapshot.requestSnapshot.propertyIntents;
    const observation = intents.find(intent => intent.role === 'reportedObservation')!;
    const compensation = intents.find(intent => intent.investigation?.kind === 'comparePerceptualCompensation')!;
    const rejectObservation = { kind: 'reject' as const, annotationId: observation.id, reason: 'Constat non conservé.' };
    expect(() => prepareCorrectionV4(reviseInput(source, record, [rejectObservation], {
      recordId: 'record:v4-linked-reject', requestId: 'request:v4-linked-reject' }))).toThrow(/Lien actif|compensation active/u);

    const { investigation: _investigation, ...compensationWithoutLink } = structuredClone(compensation);
    const explicitUnlink = { ...compensationWithoutLink, relatedIntentIds: [], interpretationOrigin: 'user' as const };
    const corrected = prepareCorrectionV4(reviseInput(source, record, [rejectObservation,
      { kind: 'revise', annotationId: compensation.id, activeIntent: explicitUnlink,
        reason: 'La relation de compensation est retirée explicitement.' }], {
        recordId: 'record:v4-linked-unlink', requestId: 'request:v4-linked-unlink' }));
    expect(corrected.status).toBe('ready');
    if (corrected.status !== 'ready') throw new Error('Le retrait explicite du lien doit laisser les autres annotations actives.');
    const updated = corrected.requestDraftV3.requestSnapshot.propertyIntents.find(intent => intent.id === compensation.id)!;
    expect(updated.relatedIntentIds).toEqual([]);
    expect(updated.investigation).toBeUndefined();
    expect(corrected.recordDraft.ledger.sourceAnnotations.find(intent => intent.id === compensation.id)).toEqual(compensation);
  });

  it('refuse une révision Prepared périmée et reprend une V4 sans parser ni rebâtir', () => {
    const source = fixture();
    const upgraded = upgrade(source);
    const record = sealV4(upgraded);
    const resumed = resumeV4({ record, sourceReadingArchive: source.archive, prepared: source.prepared });
    expect(resumed.status).toBe('ready');
    if (resumed.status !== 'ready') throw new Error('Le record V4 frais doit se reprendre en lecture seule.');
    expect(resumed.requestDraftV3.requestSnapshot).toEqual(record.outcome.kind === 'domainAnswer'
      ? record.outcome.answerSnapshot.requestSnapshot : undefined);
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');

    const changed = makeHopV55FixtureContext('planning');
    if (!changed.recipe) throw new Error('La fixture planning attend une recette synthétique.');
    changed.recipe.volumeL = (changed.recipe.volumeL ?? 0) + 1;
    const stalePrepared = prepareBrewingScenarioContext(changed);
    expect(resumeV4({ record, sourceReadingArchive: source.archive, prepared: stalePrepared })).toMatchObject({ status: 'stale' });
    expect(() => prepareCorrectionV4({ sourceRecord: record, sourceReadingArchive: source.archive,
      prepared: stalePrepared, recordId: 'record:v4-stale-revision', requestId: 'request:v4-stale-revision',
      transition: transition({ kind: 'revise', parentRecordReference: record.reference,
        parentReadingReference: record.sourceReadingReference, actId: 'act:v4-stale-revision' }), actions: [] }))
      .toThrow(/contexte ou le binding NR V4 a changé/u);
    expect(parser).not.toHaveBeenCalled();
    parser.mockRestore();
  });

  it('lie une culture adoptée au preparedReference et la représente comme hypothèse planned ou unknown', () => {
    const source = fixture();
    const workspace = hopV55Workspace(ownerKey, workspaceId);
    workspace.referenceHypotheses = [];
    const makeBinding = (culture?: BrewingScenarioCultureContext) => {
      const baseline: Extract<HopV55Workspace['referenceHypotheses'][number]['baseline'], { kind: 'hypothetical' }> = {
        kind: 'hypothetical', label: 'Culture hypothétique de test', input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
      };
      if (culture) baseline.culture = structuredClone(culture);
      const hypothesis = { id: 'nr-culture-v4', version: 1, label: 'Culture NR de test', recordedAt,
        baseline } as typeof workspace.referenceHypotheses[number];
      const adopted = adoptHopV55ReferenceHypothesis(workspace, hypothesis, source.context, source.prepared);
      const reference = getHopV55ReferenceProjection(adopted)?.references[0];
      if (!reference) throw new Error('La fixture NR attend une version adoptée.');
      const result = resolveHopV55AdoptedContext({ workspace: adopted,
        expected: { id: reference.id, version: reference.version, contentReference: reference.contentReference } });
      if (result.status !== 'resolved') throw new Error('La fixture NR attend une résolution exacte.');
      return result.binding;
    };

    const single = makeBinding({ state: 'single', members: [{ yeastId: 'fixture:yeast-exact' }] });
    expect(readHopV55AdoptedContextBinding(single).status).toBe('available');
    const bound = upgrade(source, { binding: single });
    expect(bound.status).toBe('ready');
    if (bound.status !== 'ready') throw new Error('Une culture adoptée doit rester exploitable comme hypothèse.');
    const assertion = bound.requestDraftV3.requestSnapshot.context.assertions.find(row => row.id === 'adopted-context-culture');
    expect(assertion).toMatchObject({ state: 'planned', dimension: 'bioInteraction', value: JSON.stringify(single.culture.status === 'declared' ? single.culture.value : null) });
    expect(bound.recordDraft.preparation.cultureBinding?.bindingReference).toBe(single.bindingReference);

    const unknown = makeBinding({ state: 'unknown', members: [], explanation: 'Culture explicitement non résolue.' });
    const unknownBound = upgrade(source, { binding: unknown });
    expect(unknownBound.status).toBe('ready');
    if (unknownBound.status !== 'ready') throw new Error('Une adoption unknown doit rester présente.');
    expect(unknownBound.requestDraftV3.requestSnapshot.context.assertions.find(row => row.id === 'adopted-context-culture'))
      .toMatchObject({ state: 'unknown', dimension: 'bioInteraction' });
    const noBinding = upgrade(source);
    expect(noBinding.status).toBe('ready');
    if (noBinding.status !== 'ready') throw new Error('L’absence d’adoption laisse le chemin courant disponible.');
    expect(noBinding.requestDraftV3.requestSnapshot.context.assertions.some(row => row.id === 'adopted-context-culture')).toBe(false);
    expect(bound.recordDraft.preparation.preparedReference).not.toBe(noBinding.recordDraft.preparation.preparedReference);
  });
});
