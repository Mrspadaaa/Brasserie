import { describe, expect, it } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import {
  createHopV55PropertyAdviceAnswerRecordV3,
} from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  prepareHopV55PropertyAdviceRequestDraftV3,
  reexamineHopV55PropertyAdviceRequestDraftV3,
  reviseHopV55PropertyAdviceRequestDraftV3,
} from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { propertyAdviceContextProvenance } from '../../src/ui/hopV55/propertyAdviceContextProvenance';

const question = 'Ma pastry stout est trop sucrée, comment compenser ça avec mon houblon ?';
const ownerKey = 'fixture:context-provenance-owner';
const workspaceId = 'workspace:context-provenance';
const recordedBy = { origin: 'fixture' as const, label: 'Test de provenance' };
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie.' };
const reexaminationReason = 'Relire les accès dans le contexte actif.';
const reexaminationAt = '2026-10-03T10:00:00.000Z';
const revisionReason = 'Corriger le texte sans déclarer un nouvel accès.';
const revisionAt = '2026-10-03T10:05:00.000Z';

function answerRecordV3(input: {
  requestId: string;
  answerRecordId: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  revisionContext?: {
    sourceAnswerRecordReference: string;
    sourceAnswerReference: string;
    reason: string;
    recordedAt: string;
    recordedBy: typeof recordedBy;
  };
  reexaminationContext?: {
    sourceAnswerRecordReference: string;
    sourceAnswerReference: string;
    sourceReadingReference: string;
    reason: string;
    recordedAt: string;
    recordedBy: typeof recordedBy;
  };
}) {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(question, prepared);
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({
    reading, prepared, requestId: input.requestId, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, candidatePolicy,
  });
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV3({
    draft, prepared, answerSnapshot, answerRecordId: input.answerRecordId,
    ...(input.revisionContext ? { revisionContext: input.revisionContext } : {}),
    ...(input.reexaminationContext ? { reexaminationContext: input.reexaminationContext } : {}),
  });
  expect(readHopV55DocumentaryAnswerRecord(record).status).toBe('readOnly');
  return { record, draft, prepared, reading };
}

function validLineage(owner = ownerKey, workspace = workspaceId) {
  const source = answerRecordV3({ requestId: 'request-A', answerRecordId: 'answer-A', ownerKey: owner,
    workspaceId: workspace, sourceReadingReference: 'reading-A' });
  const draftB = reexamineHopV55PropertyAdviceRequestDraftV3({
    draft: source.draft, reading: source.reading, prepared: source.prepared,
    requestId: 'request-B', sourceReadingReference: 'reading-B',
    reexaminationContext: { reason: reexaminationReason, recordedAt: reexaminationAt, recordedBy },
  });
  const answerB = buildHopPropertyAdviceV3(draftB.requestSnapshot);
  const reexamined = createHopV55PropertyAdviceAnswerRecordV3({ draft: draftB, prepared: source.prepared,
    answerSnapshot: answerB, answerRecordId: 'answer-B', reexaminationContext: {
      sourceAnswerRecordReference: source.record.reference,
      sourceAnswerReference: source.record.answerReference,
      sourceReadingReference: source.record.sourceReadingReference,
      reason: reexaminationReason, recordedAt: reexaminationAt, recordedBy,
    } });
  expect(readHopV55DocumentaryAnswerRecord(reexamined).status).toBe('readOnly');

  const draftC = reviseHopV55PropertyAdviceRequestDraftV3({
    draft: draftB, prepared: source.prepared,
    interpretation: { id: 'interpretation-C', version: 'fixture-v3',
      text: 'La compensation reste une question à examiner.', origin: 'user' },
    revisionContext: { reason: revisionReason, recordedAt: revisionAt, recordedBy },
  });
  const answerC = buildHopPropertyAdviceV3(draftC.requestSnapshot);
  const revised = createHopV55PropertyAdviceAnswerRecordV3({ draft: draftC, prepared: source.prepared,
    answerSnapshot: answerC, answerRecordId: 'answer-C', revisionContext: {
      sourceAnswerRecordReference: reexamined.reference, sourceAnswerReference: reexamined.answerReference,
      reason: revisionReason, recordedAt: revisionAt, recordedBy,
    } });
  expect(readHopV55DocumentaryAnswerRecord(revised).status).toBe('readOnly');
  return { source: source.record, reexamined, revised, prepared: source.prepared, reading: source.reading };
}

describe('propertyAdviceContextProvenance', () => {
  it('suit un record V3 validé à travers une révision et lit les accès du snapshot affiché', () => {
    const lineage = validLineage();
    const result = propertyAdviceContextProvenance(lineage.revised, [lineage.source, lineage.reexamined]);
    expect(result).toEqual({ kind: 'reexamined', recordedAt: reexaminationAt,
      unknownAccesses: ['bulkBeer', 'sampling', 'separatePortion'] });
    expect(lineage.revised.revisionContext?.sourceAnswerRecordReference).toBe(lineage.reexamined.reference);
    expect(lineage.revised.answerSnapshot.requestSnapshot.originalQuestion).toBe(question);
  });

  it('refuse un parent au même texte mais d’un autre owner', () => {
    const lineage = validLineage();
    const foreign = validLineage('fixture:other-owner', workspaceId);
    const child = answerRecordV3({ requestId: 'request-child-owner', answerRecordId: 'answer-child-owner',
      ownerKey, workspaceId, sourceReadingReference: lineage.reexamined.sourceReadingReference,
      revisionContext: { sourceAnswerRecordReference: foreign.reexamined.reference,
        sourceAnswerReference: foreign.reexamined.answerReference, reason: revisionReason,
        recordedAt: revisionAt, recordedBy } });
    expect(child.record.answerSnapshot.requestSnapshot.originalQuestion).toBe(question);
    expect(propertyAdviceContextProvenance(child.record, [foreign.reexamined])).toEqual({ kind: 'unavailable' });
  });

  it('refuse une référence de réponse parente incohérente même si le record parent existe', () => {
    const lineage = validLineage();
    const child = answerRecordV3({ requestId: 'request-child-answer-ref', answerRecordId: 'answer-child-answer-ref',
      ownerKey, workspaceId, sourceReadingReference: lineage.reexamined.sourceReadingReference,
      revisionContext: { sourceAnswerRecordReference: lineage.reexamined.reference,
        sourceAnswerReference: 'hop-property-advice-answer-v3:sha256:not-the-parent', reason: revisionReason,
        recordedAt: revisionAt, recordedBy } });
    expect(propertyAdviceContextProvenance(child.record, [lineage.reexamined])).toEqual({ kind: 'unavailable' });
  });

  it('refuse un parent de même owner dont la source de lecture ne correspond pas', () => {
    const lineage = validLineage();
    const child = answerRecordV3({ requestId: 'request-child-source-ref', answerRecordId: 'answer-child-source-ref',
      ownerKey, workspaceId, sourceReadingReference: 'reading-unrelated',
      revisionContext: { sourceAnswerRecordReference: lineage.reexamined.reference,
        sourceAnswerReference: lineage.reexamined.answerReference, reason: revisionReason,
        recordedAt: revisionAt, recordedBy } });
    expect(child.record.answerSnapshot.requestSnapshot.originalQuestion).toBe(question);
    expect(propertyAdviceContextProvenance(child.record, [lineage.reexamined])).toEqual({ kind: 'unavailable' });
  });

  it('ne devine pas un parent par question ou date lorsqu’un lien exact est absent', () => {
    const lineage = validLineage();
    const child = answerRecordV3({ requestId: 'request-missing-parent', answerRecordId: 'answer-missing-parent',
      ownerKey, workspaceId, sourceReadingReference: lineage.reexamined.sourceReadingReference,
      revisionContext: { sourceAnswerRecordReference: 'answer-record:not-loaded',
        sourceAnswerReference: lineage.reexamined.answerReference, reason: revisionReason,
        recordedAt: revisionAt, recordedBy } });
    const sameQuestionAndDateDecoy = lineage.source;
    expect(sameQuestionAndDateDecoy.answerSnapshot.requestSnapshot.originalQuestion).toBe(question);
    expect(propertyAdviceContextProvenance(child.record, [sameQuestionAndDateDecoy])).toEqual({ kind: 'unavailable' });
  });
});
