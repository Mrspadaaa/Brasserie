import { describe, expect, it } from 'vitest';
import * as propertyAdviceModule from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import {
  createHopV55DecisionReadingArchiveV2,
  createHopV55DecisionReadingArchiveV3,
  createHopV55DecisionReadingArchiveV4ForWizardV1,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchive,
} from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1,
  type HopV55QuestionScopeTransitionV1 } from '../../src/services/hopV55/questionScopeReading';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { createHopV55PropertyAdviceAnswerRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import {
  HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  prepareReexaminationPreviewV1,
  prepareVerifiedReexaminationV4,
  upgradeV3ToV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceReexaminationPreviewV1,
  type PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input,
} from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createBrewerHopAdviceWizardSourceV1 } from '../../functions/src/brewerHopAdviceWizardSourceV1.js';

// A V4 answer reexamined from the history keeps the reading archive it was built on: the strict classic reader
// accepts its historical V2/V3 archives, while a Wizard archive stays on its own lane and is refused here.
const ownerKey = 'owner:v4-reexamination-formats';
const workspaceId = 'workspace:v4-reexamination-formats';
const recordedAt = '2026-10-08T21:00:00.000Z';
const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture.' };
const sweetnessQuestion = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';
const scopedQuestion = `${sweetnessQuestion} Quand utiliser le houblon avec ma levure, et lequel ?`;
type Readings = Array<{ kind: string; value: number | string | boolean; unit: string }>;

function preparedWith(readings: Readings) {
  const context = makeHopV55FixtureContext('planning');
  context.journal = { ...(context.journal ?? {}), revision: 1, readings: structuredClone(readings) };
  return prepareBrewingScenarioContext(context);
}

function classicArchive(input: { id: string; question: string; prepared: ReturnType<typeof preparedWith>;
  format: 'v2' | 'v3'; reading?: HopV55DecisionReadingArchive['reading'];
  scopes?: Pick<Extract<HopV55DecisionReadingArchive, { format: 'hop-v55-decision-reading-v3' }>, 'scopeLedger' | 'transition'> }) {
  const common = { id: `reading:${input.id}`, ownerKey, workspaceId, recordedAt, source: { kind: 'exploration' as const },
    runtimeReference: `runtime:${input.id}` };
  if (input.format === 'v2') {
    return createHopV55DecisionReadingArchiveV2({ ...common,
      reading: input.reading ?? readHopV55Question(input.question, input.prepared) });
  }
  if (input.reading && input.scopes) {
    return createHopV55DecisionReadingArchiveV3({ ...common, reading: input.reading, ...input.scopes });
  }
  const scoped = readHopV55QuestionWithScopesV1(input.question, input.prepared);
  const transition: HopV55QuestionScopeTransitionV1 = { actId: `scope:${input.id}`, kind: 'create',
    reason: 'Portées conservées pour la fixture.', recordedAt, actor: { origin: 'proposal', label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question: input.question, reading: scoped.reading,
    scopeDrafts: scoped.scopeDrafts, transition });
  return createHopV55DecisionReadingArchiveV3({ ...common, reading: scoped.reading, scopeLedger, transition });
}

/** V3 answer on a historical archive, explicitly upgraded to V4: the head a brewer reexamines from the history. */
function historicalAnswer(id: string, format: 'v2' | 'v3') {
  const question = format === 'v3' ? scopedQuestion : sweetnessQuestion;
  const prepared = preparedWith([{ kind: 'sweetness', value: 2.5, unit: 'point-fixture' }]);
  const archive = classicArchive({ id: `${id}:parent`, question, prepared, format });
  const base = prepareHopV55PropertyAdviceRequestDraftV3({ reading: archive.reading, prepared, requestId: `request:${id}:base`,
    ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy: policy });
  const intents = structuredClone(base.requestSnapshot.propertyIntents);
  const sweetness = intents.find(intent => intent.property === 'sweetness' && intent.role === 'reportedObservation');
  if (!sweetness) throw new Error('La fixture doit lire un constat de douceur.');
  // Synthetic baseline link, only to exercise the reexamination of a changed fact; no real record is read.
  sweetness.comparisonBasis = { kind: 'current', assertionIds: ['context-reading-0'] };
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: archive.reading, prepared, requestId: `request:${id}:source`,
    ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy: policy, propertyIntents: intents });
  const answerV3 = propertyAdviceModule.buildHopPropertyAdviceV3(draft.requestSnapshot);
  const v3Record = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot: answerV3,
    answerRecordId: `answer:${id}:source` });
  const upgraded = upgradeV3ToV4({ sourceRecord: v3Record, sourceReadingArchive: archive, prepared,
    recordId: `record:${id}:v4`, requestId: `request:${id}:v4`, cultureBinding: null,
    transition: { kind: 'upgradeV3', actId: `act:${id}:upgrade`, parentRecordReference: v3Record.reference,
      parentReadingReference: archive.contentReference, reason: 'Upgrade explicite de la fixture.',
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt } });
  if (upgraded.status !== 'ready') throw new Error('La fixture doit garder des intentions actives.');
  const answerV4 = propertyAdviceModule.buildHopPropertyAdviceV3(upgraded.requestDraftV3.requestSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV4({ draft: upgraded.recordDraft, outcome: {
    kind: 'domainAnswer', requestDraftReference: upgraded.requestDraftV3.reference,
    answerSnapshot: answerV4, answerReference: answerV4.reference } });
  return { archive, record };
}

/** Fresh frame of the same question: same reading format, changed sweetness reading. */
function freshFrame(parent: ReturnType<typeof historicalAnswer>, id: string) {
  const prepared = preparedWith([{ kind: 'sweetness', value: 3.25, unit: 'point-fixture' }]);
  const reading = structuredClone(parent.archive.reading) as typeof parent.archive.reading & { response?: unknown; branches: unknown[] };
  delete reading.response;
  reading.branches = [];
  const sourceReadingArchive = classicArchive({ id: `${id}:current`, question: '', prepared, reading,
    format: parent.archive.format === 'hop-v55-decision-reading-v3' ? 'v3' : 'v2',
    ...(parent.archive.format === 'hop-v55-decision-reading-v3'
      ? { scopes: { scopeLedger: parent.archive.scopeLedger, transition: parent.archive.transition } } : {}) });
  return { sourceRecord: parent.record, parentReadingArchive: parent.archive, sourceReadingArchive, prepared,
    cultureBinding: null, currentSource: { kind: 'exploration' as const },
    currentRuntimeReference: sourceReadingArchive.runtimeReference, previewId: `preview:${id}` };
}

function previewFor(frame: ReturnType<typeof freshFrame>): HopV55PropertyAdviceReexaminationPreviewV1 {
  const result = prepareReexaminationPreviewV1(frame);
  if (result.status !== 'ready') throw new Error(`Preview fixture bloqué : ${result.reason}`);
  return result.preview;
}

function sweetnessObservation(record: HopV55PropertyAdviceAnswerRecordV4): HopPropertyAdviceIntentV3 {
  const intent = record.outcome.kind === 'domainAnswer'
    ? record.outcome.answerSnapshot.requestSnapshot.propertyIntents.find(row => row.role === 'reportedObservation' && row.property === 'sweetness')
    : undefined;
  if (!intent) throw new Error('La fixture doit conserver son constat de douceur.');
  return intent;
}

/** The brewer reconfirms the exact baseline link shown by the preview, as the Page's reexamination panel does. */
function reconfirmedInput(parent: ReturnType<typeof historicalAnswer>, frame: ReturnType<typeof freshFrame>,
  preview: HopV55PropertyAdviceReexaminationPreviewV1): PrepareVerifiedHopV55PropertyAdviceReexaminationV4Input {
  const intent = sweetnessObservation(parent.record);
  const diagnostic = preview.diagnostics.find(row => row.annotationId === intent.id);
  if (!diagnostic) throw new Error('Le preview doit diagnostiquer le constat de douceur.');
  return { ...frame, preview, expectedPreviewReference: preview.reference,
    readingContext: structuredClone(preview.readingContext),
    recordId: `record:${frame.previewId}:confirmed`, requestId: `request:${frame.previewId}:confirmed`,
    transition: { kind: 'reexamine', actId: `act:${frame.previewId}:confirm`, parentRecordReference: parent.record.reference,
      parentReadingReference: parent.record.sourceReadingReference, reason: 'Réexamen explicite depuis l’historique.',
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-08T21:05:00.000Z' },
    actions: [{ kind: 'revise', annotationId: intent.id, reason: 'Lien de baseline reconfirmé.',
      activeIntent: { ...intent, interpretationOrigin: 'user', basis: 'Le brasseur reconfirme le lien exact au fait frais.' } }],
    bindingChoices: [{ format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: preview.reference, annotationId: diagnostic.annotationId,
      previousAssertionId: diagnostic.previousAssertionId, freshAssertionId: 'context-reading-0' }] };
}

describe('réexamen V4 vérifié — formats d’archive de lecture historiques', () => {
  it.each(['v2', 'v3'] as const)('confirme le réexamen d’une réponse lue sur une archive %s, sans changer son format', format => {
    const parent = historicalAnswer(`formats-${format}`, format);
    const frame = freshFrame(parent, `formats-${format}`);
    const preview = previewFor(frame);
    expect(frame.sourceReadingArchive.format).toBe(`hop-v55-decision-reading-${format}`);

    const result = prepareVerifiedReexaminationV4(reconfirmedInput(parent, frame, preview));

    if (result.status !== 'ready') throw new Error(`Le réexamen historique doit être confirmable : ${result.status === 'blocked' ? result.reason : result.status}`);
    expect(result).toMatchObject({ status: 'ready', previewReference: preview.reference });
    expect(result.recordDraft.sourceReadingReference).toBe(frame.sourceReadingArchive.contentReference);
    expect(result.recordDraft.transition).toMatchObject({ kind: 'reexamine', parentRecordReference: parent.record.reference });
  });

  it('refuse toujours une archive Wizard dans le réexamen classique, par le lecteur strict', () => {
    const parent = historicalAnswer('formats-wizard', 'v2');
    const frame = freshFrame(parent, 'formats-wizard');
    const preview = previewFor(frame);
    const draft = { id: 'draft:formats-wizard', name: 'Brouillon fixture', style: '', volumeL: 20, ogTarget: null,
      abvTarget: null, malts: [], hops: [] };
    const snapshot = { recipe: structuredClone(draft), reference: hopAdviceContentReference('hop-v55-recipe-step-draft-context-v1',
      { ownerKey, draftId: draft.id, recipe: draft }) };
    const source = createBrewerHopAdviceWizardSourceV1({ origin: { ownerKey, workspaceId, draftId: draft.id }, snapshot });
    const wizardArchive = createHopV55DecisionReadingArchiveV4ForWizardV1({ id: 'reading:formats-wizard', ownerKey, workspaceId,
      recordedAt, reading: readHopV55QuestionSemanticV1(sweetnessQuestion, frame.prepared), source,
      runtimeReference: 'runtime:formats-wizard' });
    expect(readHopV55DecisionReadingArchive(wizardArchive).status).not.toBe('available');

    const result = prepareVerifiedReexaminationV4({ ...reconfirmedInput(parent, frame, preview), sourceReadingArchive: wizardArchive });

    // Refused by the strict classic reader itself, not by a later guard.
    expect(result).toEqual({ status: 'blocked', reason: 'L’archive de lecture source est indisponible : invalidRecord.' });
  });
});
