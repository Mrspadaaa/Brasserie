import { afterEach, describe, expect, it, vi } from 'vitest';
import * as propertyAdviceModule from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import {
  createHopV55DecisionReadingArchiveV2,
  createHopV55DecisionReadingArchiveV3,
  type HopV55DecisionReadingArchive,
} from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1,
  type HopV55QuestionScopeTransitionV1 } from '../../src/services/hopV55/questionScopeReading';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import {
  createHopV55PropertyAdviceAnswerRecordV3,
  type HopV55PropertyAdviceAnswerRecordV3,
} from '../../src/services/hopV55/propertyAdviceRecordsV3';
import * as recordsV4Module from '../../src/services/hopV55/propertyAdviceRecordsV4';
import {
  HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  prepareCorrectionV4,
  prepareReexaminationPreviewV1,
  prepareVerifiedReexaminationV4,
  readHopV55PropertyAdviceReexaminationPreviewV1,
  upgradeV3ToV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceReexaminationPreviewV1,
  type HopV55PropertyAdviceV4Transition,
  type PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input,
} from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';

const ownerKey = 'owner:v4-reconciliation-fixture';
const workspaceId = 'workspace:v4-reconciliation-fixture';
const recordedAt = '2026-10-03T20:30:00.000Z';
const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture.' };
const sweetnessQuestion = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';
const scopedQuestion = `${sweetnessQuestion} Quand utiliser le houblon avec ma levure, et lequel ?`;

afterEach(() => vi.restoreAllMocks());

function rawContext(readings: Array<{ kind: string; value: number | string | boolean; unit: string }>) {
  const context = makeHopV55FixtureContext('planning');
  context.journal = { ...(context.journal ?? {}), revision: 1, readings: structuredClone(readings) };
  return context;
}

function sourceArchive(question: string, prepared: ReturnType<typeof prepareBrewingScenarioContext>, id: string,
  version: 'v2' | 'v3' = 'v2'): HopV55DecisionReadingArchive {
  const source = { kind: 'exploration' as const };
  const runtimeReference = `runtime:${id}`;
  if (version === 'v2') {
    const reading = readHopV55Question(question, prepared);
    return createHopV55DecisionReadingArchiveV2({ id: `reading:${id}`, ownerKey, workspaceId, recordedAt,
      reading, source, runtimeReference });
  }
  const scoped = readHopV55QuestionWithScopesV1(question, prepared);
  const transition: HopV55QuestionScopeTransitionV1 = { actId: `scope:${id}`, kind: 'create',
    reason: 'Portées conservées pour la fixture.', recordedAt, actor: { origin: 'proposal', label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading: scoped.reading,
    scopeDrafts: scoped.scopeDrafts, transition });
  return createHopV55DecisionReadingArchiveV3({ id: `reading:${id}`, ownerKey, workspaceId, recordedAt,
    reading: scoped.reading, source, runtimeReference, scopeLedger, transition });
}

function pHMeasurementIntent(question: string, assertionId: string): HopPropertyAdviceIntentV3 {
  const start = question.indexOf('pH');
  if (start < 0) throw new Error('La fixture de mesure doit contenir le fragment pH exact.');
  return {
    id: 'manual:measurement-ph', property: 'acidity', label: 'pH', role: 'measurement', direction: null,
    qualification: null, required: true, comparisonBasis: { kind: 'current', assertionIds: [assertionId] },
    metric: 'pH', subject: { kind: 'beer', label: 'Bière mesurée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [{ start, end: start + 2, text: 'pH' }], interpretationOrigin: 'user',
    basis: 'Mesure pH ajoutée explicitement à la fixture avec sa base courante.', relatedIntentIds: [],
  };
}

function parentJourney(input: {
  id: string;
  question?: string;
  readings?: Array<{ kind: string; value: number | string | boolean; unit: string }>;
  readingFormat?: 'v2' | 'v3';
  measurement?: boolean;
}): {
  prepared: ReturnType<typeof prepareBrewingScenarioContext>;
  archive: HopV55DecisionReadingArchive;
  v3Record: HopV55PropertyAdviceAnswerRecordV3;
  record: HopV55PropertyAdviceAnswerRecordV4;
} {
  const question = input.question ?? (input.measurement
    ? 'Ma bière pH est mesuré; je veux garder le floral.'
    : input.readingFormat === 'v3' ? scopedQuestion : sweetnessQuestion);
  const prepared = prepareBrewingScenarioContext(rawContext(input.readings ?? [
    { kind: 'sweetness', value: 2.5, unit: 'point-fixture' },
  ]));
  const archive = sourceArchive(question, prepared, `${input.id}:parent`, input.readingFormat ?? 'v2');
  const reading = archive.reading;
  const baseDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: `request:${input.id}:source`,
    ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy: policy });
  const scopedIntents = structuredClone(baseDraft.requestSnapshot.propertyIntents);
  const sweetness = scopedIntents.find(intent => intent.property === 'sweetness' && intent.role === 'reportedObservation');
  if (sweetness && prepared.runtime.current?.beerContext?.facts.some(fact => fact.id === 'reading-0')) {
    // This is a synthetic, explicitly linked V3 baseline used only to exercise
    // the requalification guard; no real brewing record or measurement is read.
    sweetness.comparisonBasis = { kind: 'current', assertionIds: ['context-reading-0'] };
  }
  const requestDraft = input.measurement
    ? prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: `request:${input.id}:source-with-ph`,
      ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy: policy,
      propertyIntents: [...scopedIntents,
        pHMeasurementIntent(question, 'context-reading-0')] })
    : prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: `request:${input.id}:source-linked`,
      ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy: policy,
      propertyIntents: scopedIntents });
  const answerSnapshot = propertyAdviceModule.buildHopPropertyAdviceV3(requestDraft.requestSnapshot);
  const v3Record = createHopV55PropertyAdviceAnswerRecordV3({ draft: requestDraft, prepared, answerSnapshot,
    answerRecordId: `answer:${input.id}:source` });
  const transition: HopV55PropertyAdviceV4Transition = { kind: 'upgradeV3', actId: `act:${input.id}:upgrade`,
    parentRecordReference: v3Record.reference, parentReadingReference: archive.contentReference,
    reason: 'Upgrade explicite de la fixture.', actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt };
  const upgraded = upgradeV3ToV4({ sourceRecord: v3Record, sourceReadingArchive: archive, prepared,
    recordId: `record:${input.id}:v4`, requestId: `request:${input.id}:v4`, transition, cultureBinding: null });
  if (upgraded.status !== 'ready') throw new Error('La fixture doit avoir des intentions actives.');
  const answerV4 = propertyAdviceModule.buildHopPropertyAdviceV3(upgraded.requestDraftV3.requestSnapshot);
  const record = recordsV4Module.createHopV55PropertyAdviceAnswerRecordV4({ draft: upgraded.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: upgraded.requestDraftV3.reference,
    answerSnapshot: answerV4, answerReference: answerV4.reference } });
  return { prepared, archive, v3Record, record };
}

function currentInput(parent: ReturnType<typeof parentJourney>, input: {
  id: string;
  readings: Array<{ kind: string; value: number | string | boolean; unit: string }>;
}) {
  const prepared = prepareBrewingScenarioContext(rawContext(input.readings));
  const reading = structuredClone(parent.archive.reading) as typeof parent.archive.reading & { response?: unknown; branches: unknown[] };
  delete reading.response;
  reading.branches = [];
  const common = { id: `reading:${input.id}:current`, ownerKey, workspaceId, recordedAt: '2026-10-03T20:40:00.000Z',
    reading, source: { kind: 'exploration' as const }, runtimeReference: `runtime:${input.id}:current` };
  const archive = parent.archive.format === 'hop-v55-decision-reading-v3'
    ? createHopV55DecisionReadingArchiveV3({ ...common, scopeLedger: parent.archive.scopeLedger,
      transition: parent.archive.transition })
    : createHopV55DecisionReadingArchiveV2(common);
  const currentSource = { kind: 'exploration' as const };
  const currentRuntimeReference = archive.runtimeReference;
  return { sourceRecord: parent.record, parentReadingArchive: parent.archive, sourceReadingArchive: archive,
    prepared, cultureBinding: null, currentSource, currentRuntimeReference, previewId: `preview:${input.id}` };
}

function previewFor(input: ReturnType<typeof currentInput>): HopV55PropertyAdviceReexaminationPreviewV1 {
  const result = prepareReexaminationPreviewV1(input);
  if (result.status !== 'ready') throw new Error(`Preview fixture bloqué : ${result.reason}`);
  return result.preview;
}

function transition(parent: HopV55PropertyAdviceAnswerRecordV4, actId: string): HopV55PropertyAdviceV4Transition {
  return { kind: 'reexamine', actId, parentRecordReference: parent.reference,
    parentReadingReference: parent.sourceReadingReference, reason: 'Requalification fraîche choisie dans la fixture.',
    actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-03T20:45:00.000Z' };
}

function observation(parent: HopV55PropertyAdviceAnswerRecordV4): HopPropertyAdviceIntentV3 {
  const intent = parent.outcome.kind === 'domainAnswer'
    ? parent.outcome.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.role === 'reportedObservation' && row.property === 'sweetness')
    : undefined;
  if (!intent) throw new Error('La fixture doit conserver son constat de douceur.');
  return intent;
}

function confirmInput(parent: ReturnType<typeof parentJourney>, current: ReturnType<typeof currentInput>,
  preview: HopV55PropertyAdviceReexaminationPreviewV1, input: {
    actions: PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input['actions'];
    bindingChoices: PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input['bindingChoices'];
    readingContext?: HopV55PropertyAdviceReexaminationPreviewV1['readingContext'];
    actId?: string;
  }): PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input {
  return { ...current, preview, expectedPreviewReference: preview.reference,
    readingContext: structuredClone(input.readingContext ?? preview.readingContext),
    recordId: `record:${current.previewId}:confirmed`, requestId: `request:${current.previewId}:confirmed`,
    transition: transition(parent.record, input.actId ?? `${current.previewId}:confirm`),
    actions: input.actions, bindingChoices: input.bindingChoices };
}

function bindingChoice(preview: HopV55PropertyAdviceReexaminationPreviewV1,
  diagnostic: HopV55PropertyAdviceReexaminationPreviewV1['diagnostics'][number],
  kind: 'bind' | 'detach', freshAssertionId?: string) {
  return { format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
    kind, previewReference: preview.reference, annotationId: diagnostic.annotationId,
    previousAssertionId: diagnostic.previousAssertionId,
    ...(kind === 'bind' && freshAssertionId ? { freshAssertionId } : {}) } as const;
}

function activeIntent(parent: HopV55PropertyAdviceAnswerRecordV4, id: string): HopPropertyAdviceIntentV3 {
  const row = parent.ledger.entries.filter(entry => entry.annotationId === id && entry.disposition === 'active' && entry.activeIntent).at(-1)?.activeIntent;
  if (!row) throw new Error(`L’annotation ${id} doit être active dans la fixture.`);
  return structuredClone(row);
}

describe('préparation V4 de réconciliation des liens de baseline', () => {
  it('prévisualise le changement du même ID sans mutation, builder, reçu ni activation', () => {
    const parent = parentJourney({ id: 'same-id' });
    expect(parent.prepared.runtime.current?.beerContext?.facts).toContainEqual(expect.objectContaining({ id: 'reading-0', field: 'journal.sweetness' }));
    expect(observation(parent.record).comparisonBasis).toEqual({ kind: 'current', assertionIds: ['context-reading-0'] });
    const parentBefore = structuredClone(parent.record);
    const current = currentInput(parent, { id: 'same-id', readings: [{ kind: 'sweetness', value: 3.25, unit: 'point-fixture' }] });
    const build = vi.spyOn(propertyAdviceModule, 'buildHopPropertyAdviceV3');
    const createRecord = vi.spyOn(recordsV4Module, 'createHopV55PropertyAdviceAnswerRecordV4');

    const result = prepareReexaminationPreviewV1(current);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Le preview du changement de fait doit être consultable.');
    const row = result.preview.diagnostics.find(item => item.previousAssertionId === 'context-reading-0')!;
    expect(row).toMatchObject({ annotationId: observation(parent.record).id, status: 'changed',
      previousAssertion: { id: 'context-reading-0', subject: 'journal.sweetness', state: 'measured', value: 2.5,
        unit: 'point-fixture' }, currentAssertion: { id: 'context-reading-0', value: 3.25, unit: 'point-fixture' } });
    expect(row.previousAssertionReference).not.toBe(row.currentAssertionReference);
    expect(row.compatibleFreshAssertions.map(candidate => candidate.assertionId)).toContain('context-reading-0');
    expect(result.preview.parentReadingReference).toBe(parent.archive.contentReference);
    expect(result.preview.sourceReadingReference).toBe(current.sourceReadingArchive.contentReference);
    expect(result.preview.preparedReference).not.toBe(parent.record.preparation.preparedReference);
    expect(parent.record).toEqual(parentBefore);
    expect(build).not.toHaveBeenCalled();
    expect(createRecord).not.toHaveBeenCalled();
  });

  it('refuse de confirmer un lien périmé sans choix et garde le garde strict de prepareCorrectionV4', () => {
    const parent = parentJourney({ id: 'no-choice' });
    const current = currentInput(parent, { id: 'no-choice', readings: [] });
    const preview = previewFor(current);
    const record = parent.record;
    const strictTransition = transition(record, 'act:no-choice:strict');
    expect(() => prepareCorrectionV4({ sourceRecord: record, sourceReadingArchive: current.sourceReadingArchive,
      prepared: current.prepared, recordId: 'record:no-choice:strict', requestId: 'request:no-choice:strict',
      transition: strictTransition, actions: [], readingContext: preview.readingContext, cultureBinding: null }))
      .toThrow(/lien de baseline context-reading-0 .*périmé/iu);

    const result = prepareVerifiedReexaminationV4(confirmInput(parent, current, preview, { actions: [], bindingChoices: [] }));
    expect(result).toMatchObject({ status: 'blocked', reason: expect.stringMatching(/choix explicite|requalifie/i) });
  });

  it('relie explicitement un ID courant nouveau seulement si le fait a la même structure', () => {
    const parent = parentJourney({ id: 'new-id' });
    const current = currentInput(parent, { id: 'new-id', readings: [
      { kind: 'pH', value: 4.2, unit: 'pH' },
      { kind: 'sweetness', value: 3.5, unit: 'point-fixture' },
    ] });
    const preview = previewFor(current);
    const observationIntent = observation(parent.record);
    const diagnostic = preview.diagnostics.find(row => row.annotationId === observationIntent.id)!;
    expect(diagnostic.status).toBe('changed');
    expect(diagnostic.compatibleFreshAssertions.map(row => row.assertionId)).toEqual(['context-reading-1']);

    const revised = { ...observationIntent, comparisonBasis: { kind: 'current' as const, assertionIds: ['context-reading-1'] },
      interpretationOrigin: 'user' as const, basis: 'Le brasseur lie explicitement ce constat au fait frais de même sujet, unité et état.' };
    const result = prepareVerifiedReexaminationV4(confirmInput(parent, current, preview, { actions: [
      { kind: 'revise', annotationId: observationIntent.id, activeIntent: revised, reason: 'Lier à l’assertion fraîche exacte.' },
    ], bindingChoices: [bindingChoice(preview, diagnostic, 'bind', 'context-reading-1')] }));

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error(`Le fait frais compatible doit être relié : ${result.reason}`);
    expect(result.recordDraft.sourceReadingReference).toBe(current.sourceReadingArchive.contentReference);
    expect(result.recordDraft.transition.parentRecordReference).toBe(parent.record.reference);
    expect(result.recordDraft.ledger.entries.at(-1)).toMatchObject({ annotationId: observationIntent.id,
      disposition: 'active', activeIntent: revised, decision: { kind: 'revise', reason: 'Lier à l’assertion fraîche exacte.' } });
    expect(result.requestDraftV3.requestSnapshot.propertyIntents.find(row => row.id === observationIntent.id)?.comparisonBasis)
      .toEqual({ kind: 'current', assertionIds: ['context-reading-1'] });
  });

  it('accepte une attestation d’accès fraîche et sourcée sans la copier depuis le parent', () => {
    const parent = parentJourney({ id: 'fresh-access' });
    const current = currentInput(parent, { id: 'fresh-access', readings: [{ kind: 'sweetness', value: 3.25, unit: 'point-fixture' }] });
    const preview = previewFor(current);
    const intent = observation(parent.record);
    const diagnostic = preview.diagnostics.find(row => row.annotationId === intent.id)!;
    const confirmedContext = structuredClone(preview.readingContext);
    const accessAssertion = { id: 'attestation:sampling:fresh-access', subject: 'sampling',
      statement: 'Le brasseur déclare qu’un prélèvement distinct est disponible.', state: 'reported' as const,
      value: true, dimension: 'process' as const,
      source: { title: 'Déclaration de fixture', author: 'Brasseur fixture', year: 2026, kind: 'observation',
        reference: 'fixture://v4-reconciliation/sampling', locator: 'Geste d’attestation après le preview.' } };
    confirmedContext.context.assertions.push(accessAssertion);
    confirmedContext.context.access.sampling = { state: 'yes', basis: 'Le brasseur atteste un prélèvement distinct.',
      assertionIds: [accessAssertion.id] };
    const revised = { ...intent, interpretationOrigin: 'user' as const,
      basis: 'Le brasseur confirme le lien exact et déclare séparément un accès frais.' };
    const result = prepareVerifiedReexaminationV4(confirmInput(parent, current, preview, { readingContext: confirmedContext,
      actions: [{ kind: 'revise', annotationId: intent.id, activeIntent: revised, reason: 'Lien de baseline reconfirmé.' }],
      bindingChoices: [bindingChoice(preview, diagnostic, 'bind', 'context-reading-0')] }));

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error(`La déclaration fraîche doit être conservée : ${result.reason}`);
    expect(result.recordDraft.readingContext.context.access.sampling).toEqual({ state: 'yes',
      basis: 'Le brasseur atteste un prélèvement distinct.', assertionIds: [accessAssertion.id] });
    expect(result.recordDraft.readingContext.context.assertions).toContainEqual(accessAssertion);
    expect(parent.record.readingContext.context.access.sampling).toMatchObject({ state: 'unknown', assertionIds: [] });
    expect(parent.record.readingContext.context.assertions).not.toContainEqual(accessAssertion);
  });

  it('refuse un fait au même nom mais avec une unité non compatible, même si le brasseur le pointe', () => {
    const parent = parentJourney({ id: 'unit-mismatch' });
    const current = currentInput(parent, { id: 'unit-mismatch', readings: [
      { kind: 'sweetness', value: 3.5, unit: 'score-incompatible' },
    ] });
    const preview = previewFor(current);
    const diagnostic = preview.diagnostics.find(row => row.previousAssertionId === 'context-reading-0')!;
    expect(diagnostic.compatibleFreshAssertions).toEqual([]);
    const intent = observation(parent.record);
    const changed = { ...intent, interpretationOrigin: 'user' as const };

    const result = prepareVerifiedReexaminationV4(confirmInput(parent, current, preview, { actions: [
      { kind: 'revise', annotationId: intent.id, activeIntent: changed, reason: 'Tentative de lier une unité différente.' },
    ], bindingChoices: [bindingChoice(preview, diagnostic, 'bind', 'context-reading-0')] }));
    expect(result).toMatchObject({ status: 'blocked', reason: expect.stringMatching(/compatible|preview/i) });
  });

  it('permet le détachement explicite d’une observation, mais pas celui d’une mesure pH', () => {
    const parent = parentJourney({ id: 'detach-report' });
    const current = currentInput(parent, { id: 'detach-report', readings: [] });
    const preview = previewFor(current);
    const intent = observation(parent.record);
    const diagnostic = preview.diagnostics.find(row => row.annotationId === intent.id)!;
    const detached = { ...intent, comparisonBasis: { kind: 'none' as const, assertionIds: [] },
      interpretationOrigin: 'user' as const, basis: 'Le brasseur détache la base absente; le constat source reste une observation.' };
    const success = prepareVerifiedReexaminationV4(confirmInput(parent, current, preview, { actions: [
      { kind: 'revise', annotationId: intent.id, activeIntent: detached, reason: 'Détacher explicitement la base absente.' },
    ], bindingChoices: [bindingChoice(preview, diagnostic, 'detach')] }));
    expect(success.status).toBe('ready');
    if (success.status !== 'ready') throw new Error(`Le détachement admis doit être préparé : ${success.reason}`);
    expect(success.requestDraftV3.requestSnapshot.propertyIntents.find(row => row.id === intent.id)?.comparisonBasis)
      .toEqual({ kind: 'none', assertionIds: [] });

    const measurementQuestion = 'Ma bière a un pH mesuré de 4,2; garder le floral.';
    const measuredParent = parentJourney({ id: 'detach-measurement', question: measurementQuestion, measurement: true,
      readings: [{ kind: 'pH', value: 4.2, unit: 'pH' }] });
    const measuredCurrent = currentInput(measuredParent, { id: 'detach-measurement', readings: [] });
    const measuredPreview = previewFor(measuredCurrent);
    const measured = measuredParent.record.outcome.kind === 'domainAnswer'
      ? measuredParent.record.outcome.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.id === 'manual:measurement-ph')!
      : undefined;
    if (!measured) throw new Error('La fixture doit conserver la mesure pH.');
    const measuredDiagnostic = measuredPreview.diagnostics.find(row => row.annotationId === measured.id)!;
    const detachedMeasurement = { ...measured, comparisonBasis: { kind: 'none' as const, assertionIds: [] },
      interpretationOrigin: 'user' as const };
    const refusal = prepareVerifiedReexaminationV4(confirmInput(measuredParent, measuredCurrent, measuredPreview, { actions: [
      { kind: 'revise', annotationId: measured.id, activeIntent: detachedMeasurement, reason: 'Tentative de détacher une mesure.' },
    ], bindingChoices: [bindingChoice(measuredPreview, measuredDiagnostic, 'detach')] }));
    expect(refusal).toMatchObject({ status: 'blocked', reason: expect.stringMatching(/measurement|base current|détach/i) });
  });

  it('archive allRejected sans request, réponse ou appel builder', () => {
    const parent = parentJourney({ id: 'all-rejected' });
    const current = currentInput(parent, { id: 'all-rejected', readings: [] });
    const preview = previewFor(current);
    const activeIds = parent.record.ledger.entries.filter(entry => entry.disposition === 'active' && entry.activeIntent)
      .map(entry => entry.annotationId);
    const actions = [...new Set(activeIds)].map(annotationId => ({ kind: 'reject' as const, annotationId,
      reason: 'Rejet explicite de la projection au nouveau contexte.' }));
    const builder = vi.spyOn(propertyAdviceModule, 'buildHopPropertyAdviceV3');
    const recordWriter = vi.spyOn(recordsV4Module, 'createHopV55PropertyAdviceAnswerRecordV4');

    const result = prepareVerifiedReexaminationV4(confirmInput(parent, current, preview, { actions, bindingChoices: [] }));

    expect(result.status).toBe('allRejected');
    if (result.status !== 'allRejected') throw new Error(`Le rejet total doit rester un résultat distinct : ${result.reason}`);
    expect(result.recordDraft.sourceReadingReference).toBe(current.sourceReadingArchive.contentReference);
    expect(result.recordDraft.outcome).toBeUndefined();
    expect(builder).not.toHaveBeenCalled();
    expect(recordWriter).not.toHaveBeenCalled();
  });

  it('conserve scopes V3 exacts dans l’archive successorale et refuse un preview altéré', () => {
    const parent = parentJourney({ id: 'scope-preserved', readingFormat: 'v3' });
    expect(parent.archive.format).toBe('hop-v55-decision-reading-v3');
    const current = currentInput(parent, { id: 'scope-preserved', readings: [{ kind: 'sweetness', value: 3.1, unit: 'point-fixture' }] });
    const preview = previewFor(current);
    if (parent.archive.format !== 'hop-v55-decision-reading-v3' || preview.sourceReadingArchive.format !== 'hop-v55-decision-reading-v3') {
      throw new Error('La fixture doit garder la version V3 et ses scopes.');
    }
    expect(preview.sourceReadingArchive.scopeLedger).toEqual(parent.archive.scopeLedger);
    expect(preview.sourceReadingArchive.transition).toEqual(parent.archive.transition);
    const reread = readHopV55PropertyAdviceReexaminationPreviewV1(preview);
    if (reread.status !== 'readOnly') throw new Error(`Le reader doit relire le preview scellé : ${reread.reason}`);
    expect(reread.preview).toEqual(preview);

    const tampered = structuredClone(preview);
    tampered.preparedReference = 'tampered-prepared-reference';
    expect(readHopV55PropertyAdviceReexaminationPreviewV1(tampered)).toMatchObject({ status: 'invalid' });
  });

  it('refuse un preview/parent ou un current frame qui change après l’affichage', () => {
    const parent = parentJourney({ id: 'stale-preview' });
    const current = currentInput(parent, { id: 'stale-preview', readings: [{ kind: 'sweetness', value: 3, unit: 'point-fixture' }] });
    const preview = previewFor(current);
    const wrongHead = parentJourney({ id: 'other-parent' }).record;
    const mismatch = prepareVerifiedReexaminationV4({ ...confirmInput(parent, current, preview, { actions: [], bindingChoices: [] }),
      sourceRecord: wrongHead });
    expect(mismatch).toMatchObject({ status: 'blocked', reason: expect.stringMatching(/parent|preview/i) });

    const changedPrepared = prepareBrewingScenarioContext(rawContext([
      { kind: 'sweetness', value: 4, unit: 'point-fixture' },
    ]));
    const stale = prepareVerifiedReexaminationV4({ ...confirmInput(parent, current, preview, { actions: [], bindingChoices: [] }),
      prepared: changedPrepared });
    expect(stale).toMatchObject({ status: 'blocked', reason: expect.stringMatching(/changé|nouveau preview/i) });
  });
});
