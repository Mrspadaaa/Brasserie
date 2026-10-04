import { describe, expect, it } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV4, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { prepareHopV55PropertyAdviceFromSemanticReadingV1 } from '../../src/services/hopV55/propertyAdviceSemanticPreparationV3';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import type { HopV55SemanticQuestionReadingV1 } from '../../src/services/hopV55/questionSemanticReading';

const ownerKey = 'owner:pro03-property-fixture';
const workspaceId = 'workspace:pro03-property-fixture';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière candidate choisie pour cette preuve.' };
const prepared = () => prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));

function archiveAndPrepare(question: string, suffix: string, semantic?: HopV55SemanticQuestionReadingV1) {
  const context = prepared();
  const reading = semantic ?? readHopV55QuestionSemanticV1(question, context);
  const archive = createHopV55DecisionReadingArchiveV4({ id: `reading:${suffix}`, ownerKey, workspaceId,
    recordedAt: '2026-10-04T04:10:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: `runtime:${suffix}` });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available' || reread.archive.format !== 'hop-v55-decision-reading-v4') {
    throw new Error('Le mapper consomme une lecture V4 relue, pas une projection reconstruite.');
  }
  const draft = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: reread.archive.reading, prepared: context,
    sourceReadingReference: archive.contentReference, requestId: `request:${suffix}`, ownerKey, workspaceId, candidatePolicy });
  return { context, archive, reading: reread.archive.reading, draft, answer: buildHopPropertyAdviceV3(draft.requestSnapshot) };
}

describe('consumer-check — projection PropertyAdviceV3 de lecture sémantique', () => {
  it('relie une demande de compensation au constat source sans inventer une baisse', () => {
    const question = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon de jardin ?';
    const path = archiveAndPrepare(question, 'linked-compensation');
    const observation = path.draft.requestSnapshot.propertyIntents.find(row => row.property === 'sweetness' && row.role === 'reportedObservation')!;
    const compensation = path.draft.requestSnapshot.propertyIntents.find(row => row.sourceSpans.some(span => span.text.includes('compensation')))!;

    expect(path.archive.contentReference).toBe(path.draft.sourceReadingReference);
    expect(path.draft.requestSnapshot.originalQuestion).toBe(question);
    expect(observation).toMatchObject({ property: 'sweetness', role: 'reportedObservation', direction: null, required: false, metric: 'sensory' });
    expect(compensation).toMatchObject({ role: 'investigation', property: 'sweetness', direction: 'investigate',
      relatedIntentIds: [observation.id], investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation.id] } });
    expect(path.draft.requestSnapshot.propertyIntents.some(row => row.role === 'target' && row.direction === 'decrease')).toBe(false);
    expect(path.answer.requestSnapshot).toEqual(path.draft.requestSnapshot);
    for (const intent of path.draft.requestSnapshot.propertyIntents) for (const span of intent.sourceSpans) {
      expect(question.slice(span.start, span.end)).toBe(span.text);
    }
  });

  it('ne déduit pas de comparaison typée d’un identifiant de relation supprimé', () => {
    const question = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon de jardin ?';
    const initial = readHopV55QuestionSemanticV1(question, prepared());
    const detached = structuredClone(initial);
    const compensation = detached.annotations.find(row => row.inquiry === 'compensation')!;
    compensation.relatedAnnotationIds = [];
    const path = archiveAndPrepare(question, 'detached-compensation', detached);
    const mapped = path.draft.requestSnapshot.propertyIntents.find(row => row.id === compensation.id)!;

    expect(mapped).toMatchObject({ role: 'investigation', direction: 'investigate' });
    expect(mapped.relatedIntentIds).toEqual([]);
    expect(mapped.investigation).toBeUndefined();
  });

  it('conserve une cible qualitative directionnelle nulle et garde un terme inconnu unresolved', () => {
    const targetQuestion = 'Je veux une bière avec une faible amertume.';
    const target = archiveAndPrepare(targetQuestion, 'qualitative-target');
    const bitterness = target.draft.requestSnapshot.propertyIntents.find(row => row.label === 'amertume')!;
    expect(bitterness).toMatchObject({ property: 'bitterness', role: 'target', direction: null, required: true,
      qualification: 'faible', comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });

    const unknownQuestion = 'Je veux une bière ultra juicy.';
    const unknown = archiveAndPrepare(unknownQuestion, 'unknown-term');
    const juicy = unknown.draft.requestSnapshot.propertyIntents.find(row => row.label === 'juicy')!;
    expect(juicy).toMatchObject({ property: 'unresolved', role: 'target', direction: 'increase', interpretationOrigin: 'proposal' });
    expect(juicy.familyId).toBeUndefined();
  });
});
