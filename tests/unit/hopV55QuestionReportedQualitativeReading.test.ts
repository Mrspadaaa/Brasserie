import { describe, expect, it } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3, createHopV55DecisionReadingArchiveV4,
  readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { hopV55HistoricalReadingCapabilityV1, readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { createHopV55QuestionScopeLedgerV1 } from '../../src/services/hopV55/questionScopeReading';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { prepareHopV55PropertyAdviceFromSemanticReadingV1 } from '../../src/services/hopV55/propertyAdviceSemanticPreparationV3';

const ownerKey = 'owner:reported-qualitative-reading-r21';
const workspaceId = 'workspace:reported-qualitative-reading-r21';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’est choisie dans cette fixture de lecture.' };

interface Path {
  question: string;
  archiveReference: string;
  reading: HopV55QuestionReading;
  request: ReturnType<typeof prepareHopV55PropertyAdviceRequestDraftV3>['requestSnapshot'];
  answer: ReturnType<typeof buildHopPropertyAdviceV3>;
}

function prepared() {
  return prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
}

/** Real local path only: reader → strict V2 archive/read → property request V3 → domain answer V3. */
function traverse(question: string, id: string): Path {
  const context = prepared();
  const original = readHopV55Question(question, context);
  const archive = createHopV55DecisionReadingArchiveV2({ id: `reading:${id}`, ownerKey, workspaceId,
    recordedAt: '2026-10-04T00:15:00.000Z', reading: original, source: { kind: 'exploration' },
    runtimeReference: `runtime:${id}` });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available') throw new Error(`Archive de lecture V2 non relisible : ${reread.status}.`);
  if (reread.archive.format !== 'hop-v55-decision-reading-v2') throw new Error(`Format relu inattendu : ${reread.archive.format}.`);
  const reading = reread.archive.reading;
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared: context,
    requestId: `request:${id}`, ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy });
  const answer = buildHopPropertyAdviceV3(draft.requestSnapshot);
  expect(reading.intent.question).toBe(question);
  expect(draft.requestSnapshot.originalQuestion).toBe(question);
  expect(draft.sourceReadingReference).toBe(archive.contentReference);
  expect(answer.requestSnapshot).toEqual(draft.requestSnapshot);
  for (const criterion of reading.criterionDrafts) {
    expect(question.slice(criterion.source.start, criterion.source.end)).toBe(criterion.source.text);
  }
  for (const intent of draft.requestSnapshot.propertyIntents) for (const span of intent.sourceSpans) {
    expect(question.slice(span.start, span.end)).toBe(span.text);
  }
  return { question, archiveReference: archive.contentReference, reading, request: draft.requestSnapshot, answer };
}

/** Semantic path: reader V4 → strict V4 archive/read → semantic PropertyV3 adapter → domain answer V3. */
function traverseSemantic(question: string, id: string) {
  const context = prepared();
  const reading = readHopV55QuestionSemanticV1(question, context);
  const archive = createHopV55DecisionReadingArchiveV4({ id: `reading-v4:${id}`, ownerKey, workspaceId,
    recordedAt: '2026-10-04T00:16:00.000Z', reading, source: { kind: 'exploration' }, runtimeReference: `runtime:${id}` });
  const reread = readHopV55DecisionReadingArchive(archive);
  if (reread.status !== 'available' || reread.archive.format !== 'hop-v55-decision-reading-v4') {
    throw new Error('La lecture V4 doit être relue exactement avant le conseil.');
  }
  const draft = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: reread.archive.reading, prepared: context,
    requestId: `request-v4:${id}`, ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy });
  const answer = buildHopPropertyAdviceV3(draft.requestSnapshot);
  expect(reread.archive).toEqual(archive);
  expect(answer.requestSnapshot).toEqual(draft.requestSnapshot);
  return { archive, reading: reread.archive.reading, request: draft.requestSnapshot, answer };
}

describe('lecture par actes — constat rapporté et cible sensorielle qualitative', () => {
  it.each([
    { id: 'plain-sweet', question: 'Ma bière est trop douce.', term: 'douce' },
    { id: 'plain-sweet-compensation', question: 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?', term: 'sucrée' },
  ])('ne transforme pas une plainte déclarative en demande de baisse dans le reader brut: $id', ({ id, question, term }) => {
    const path = traverse(question, id);
    const criterion = path.reading.criterionDrafts.find(row => row.term === term);
    expect.soft(criterion).toBeDefined();
    expect.soft(criterion).toMatchObject({ direction: null, requirement: 'optional' });
    expect.soft(path.reading.intent.criteria.some(row => row.id === criterion?.id && row.direction === 'decrease')).toBe(false);
    expect.soft(path.reading.interpretation).not.toMatch(/À réduire\s*:?\s*(?:douce|sucrée)/iu);
  });

  it.each([
    { id: 'plain-sweet-v3', question: 'Ma bière est trop douce.', term: 'douce' },
    { id: 'plain-sweet-compensation-v3', question: 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?', term: 'sucrée' },
  ])('conserve la plainte comme observation dans V3 après relecture archivée: $id', ({ id, question, term }) => {
    const path = traverse(question, id);
    const observation = path.request.propertyIntents.find(intent => intent.sourceSpans.some(span => span.text === term));
    expect(observation).toMatchObject({ property: 'sweetness', role: 'reportedObservation', direction: null,
      required: false, metric: 'sensory' });
  });

  it('garde le geste de compensation distinct et lié au constat, sans demander de réduction', () => {
    const question = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';
    const path = traverse(question, 'compensation-after-observation');
    const observation = path.request.propertyIntents.find(intent => intent.role === 'reportedObservation' && intent.property === 'sweetness');
    const inquiry = path.request.propertyIntents.find(intent => intent.sourceSpans.some(span => /compens/i.test(span.text)));
    const sweetnessDecrease = path.request.propertyIntents.filter(intent => intent.property === 'sweetness'
      && intent.role === 'target' && intent.direction === 'decrease');
    expect(observation).toBeDefined();
    expect(inquiry).toMatchObject({ role: 'investigation', direction: 'investigate', property: 'sweetness',
      relatedIntentIds: [observation?.id],
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation?.id] } });
    expect(sweetnessDecrease).toEqual([]);
    expect(path.answer.requestSnapshot.originalQuestion).toBe(question);
  });

  it('lit une amertume légère/faible comme cible absolue qualitative dès le reader brut, que V2/V3 refusent d’archiver', () => {
    const question = 'Je veux une bière avec une faible amertume.';
    const context = prepared();
    const raw = readHopV55Question(question, context);
    const target = raw.criterionDrafts.find(row => row.term === 'amertume');
    expect(target).toMatchObject({ direction: null, requirement: 'required', qualification: 'faible' });
    expect(raw.intent.criteria.some(row => row.id === target?.id)).toBe(false);
    expect(hopV55HistoricalReadingCapabilityV1(raw)).toEqual({ status: 'semanticRequired', annotationIds: [target!.id],
      reason: expect.stringMatching(/lecture sémantique V4/u) });
    // Negative V2/V3 witnesses: the historical codecs keep `required → direction connue`.
    expect(() => createHopV55DecisionReadingArchiveV2({ id: 'reading:low-v2', ownerKey, workspaceId,
      recordedAt: '2026-10-04T00:15:00.000Z', reading: raw, source: { kind: 'exploration' }, runtimeReference: 'runtime:low-v2' }))
      .toThrow(/V2/u);
    const transition = { actId: 'act:low-v3', kind: 'create' as const, reason: 'Fixture.', recordedAt: '2026-10-04T00:15:00.000Z',
      actor: { origin: 'proposal' as const, label: 'Lecture fixture' } };
    expect(() => createHopV55DecisionReadingArchiveV3({ id: 'reading:low-v3', ownerKey, workspaceId,
      recordedAt: '2026-10-04T00:15:00.000Z', reading: raw, source: { kind: 'exploration' }, runtimeReference: 'runtime:low-v3',
      scopeLedger: createHopV55QuestionScopeLedgerV1({ question, reading: raw, transition, scopeDrafts: [{ id: 'scope-fixture',
        kind: 'materialSelection', sourceSpan: { start: 0, end: 2, text: 'Je' }, contextSpans: [], relatedScopeIds: [],
        relatedCriterionIds: [], relatedOperationIds: [], origin: 'proposal' }] }), transition })).toThrow(/V3/u);
    // The historical mapper refuses the target instead of producing a substitute investigation.
    expect(() => prepareHopV55PropertyAdviceRequestDraftV3({ reading: raw, prepared: context, requestId: 'request:low-v2-mapper',
      ownerKey, workspaceId, sourceReadingReference: 'reading:unarchived', candidatePolicy })).toThrow(/lecture sémantique V4/u);
  });

  it('garde la faible amertume comme cible qualitative à travers V4 et le conseil V3, sans base courante inventée', () => {
    const question = 'Je veux une bière avec une faible amertume.';
    const path = traverseSemantic(question, 'low-bitterness-absolute-target-v4');
    const annotation = path.reading.annotations.find(row => row.term === 'amertume')!;
    expect(annotation).toMatchObject({ sense: 'qualitativeTarget', requirement: 'required', direction: null, qualification: 'faible',
      qualifierSource: { text: 'faible' }, origin: 'parser' });
    expect(annotation.primitiveConvention).toBeUndefined();
    expect(path.reading.projectionCoverage.notProjected).toEqual(expect.arrayContaining([
      { annotationId: annotation.id, reason: 'qualitativeTargetWithoutDirection' }]));
    expect(path.reading.interpretation).toMatch(/Cible qualitative · amertume — faible/u);
    expect(path.reading.interpretation).not.toMatch(/(?:À réduire|Baisse|moins de|facultati)/iu);
    const target = path.request.propertyIntents.find(intent => intent.id === annotation.id);
    expect(target).toMatchObject({ property: 'bitterness', role: 'target', direction: null, required: true,
      qualification: 'faible', comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] } });
    expect(path.request.interpretation.text).toContain('Cible qualitative : amertume (faible)');
    expect(path.request.interpretation.text).not.toMatch(/moins de amertume|plus de amertume/u);
  });

  it.each([
    'Je veux réduire l’amertume de ma bière.',
    'Je choisis de diminuer l’amertume de ma bière.',
  ])('conserve une vraie intention de baisse dans la lecture et la requête: %s', question => {
    const path = traverse(question, `explicit-decrease-${question.length}`);
    const raw = path.reading.criterionDrafts.find(row => row.term === 'amertume');
    expect(raw).toMatchObject({ direction: 'decrease', requirement: 'required' });
    expect(path.reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: raw?.id, direction: 'decrease' }),
    ]));
    expect(path.request.propertyIntents.find(intent => intent.sourceSpans.some(span => span.text === 'amertume')))
      .toMatchObject({ property: 'bitterness', role: 'target', direction: 'decrease' });
    const semantic = traverseSemantic(question, `explicit-decrease-v4-${question.length}`);
    expect(semantic.reading.annotations.find(row => row.term === 'amertume')).toMatchObject({ sense: 'directedChange', direction: 'decrease' });
    expect(semantic.request.propertyIntents.find(intent => intent.label === 'amertume'))
      .toMatchObject({ role: 'target', direction: 'decrease', comparisonBasis: { kind: 'current' } });
  });

  it('ne renverse pas une non-décision ni une garde déjà exprimées', () => {
    const nonCommitment = traverse('L’augmentation de l’amertume n’est pas décidée.', 'non-commitment');
    expect(nonCommitment.reading.criterionDrafts.some(row => row.term === 'amertume' && row.direction === 'increase')).toBe(false);
    expect(nonCommitment.request.propertyIntents.some(intent => intent.property === 'bitterness'
      && intent.role === 'target' && intent.direction === 'increase')).toBe(false);

    const guard = traverse('Garder le floral sans augmenter l’amertume.', 'preservation-guard');
    expect(guard.reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'amertume', direction: 'keep' }),
    ]));
    expect(guard.request.propertyIntents.find(intent => intent.sourceSpans.some(span => span.text === 'amertume')))
      .toMatchObject({ property: 'bitterness', direction: 'keep' });
  });
});
