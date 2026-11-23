import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { HOP_V55_SEMANTIC_PROJECTION_COVERAGE_V1 } from '../../src/services/hopV55/decisionSemanticProjection';

const prepared = () => prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));

describe('consumer-check — lecture sémantique V1', () => {
  it('préserve les actes distincts, leurs liens et les fragments UTF-16 de la question', () => {
    const question = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
    const context = prepared();
    const before = structuredClone(context);
    const reading = readHopV55QuestionSemanticV1(question, context);
    const sweetness = reading.annotations.find(row => row.source.text === 'douce')!;
    const compensation = reading.annotations.find(row => row.inquiry === 'compensation')!;
    const nonDecision = reading.annotations.find(row => row.sense === 'nonDecision' && row.source.text === 'amertume');
    const pear = reading.annotations.find(row => row.source.text === 'poire');
    const characterization = reading.annotations.find(row => row.inquiry === 'characterization');

    expect(reading.intent.question).toBe(question);
    expect(sweetness).toMatchObject({ sense: 'reportedObservation', requirement: 'optional', direction: null,
      subject: { kind: 'beer' }, origin: 'parser' });
    expect(compensation).toMatchObject({ sense: 'investigation', inquiry: 'compensation', direction: 'investigate',
      relatedAnnotationIds: [sweetness.id] });
    expect(nonDecision).toMatchObject({ sense: 'nonDecision', direction: null, requirement: 'optional' });
    expect(pear).toMatchObject({ sense: 'guard', guard: 'preserve' });
    expect(characterization).toMatchObject({ sense: 'investigation', inquiry: 'characterization',
      subject: { kind: 'material' } });

    for (const annotation of reading.annotations) {
      for (const span of [annotation.source, annotation.qualifierSource, annotation.frameSource, annotation.instrumentSource]) {
        if (span) expect(question.slice(span.start, span.end)).toBe(span.text);
      }
    }
    const allIds = reading.annotations.map(row => row.id).sort();
    const coverageIds = [...reading.projectionCoverage.included, ...reading.projectionCoverage.notProjected.map(row => row.annotationId)].sort();
    expect(reading.projectionCoverage.version).toBe(HOP_V55_SEMANTIC_PROJECTION_COVERAGE_V1);
    expect(new Set(coverageIds).size).toBe(allIds.length);
    expect(coverageIds).toEqual(allIds);
    expect(context).toEqual(before);
  });

  it('laisse un terme sensoriel hors lexique sans famille ni dimension inventée', () => {
    const question = 'Je veux une bière ultra juicy.';
    const reading = readHopV55QuestionSemanticV1(question, prepared());
    const juicy = reading.annotations.find(row => row.term === 'juicy');

    expect(juicy).toMatchObject({ lexicon: { status: 'outOfLexicon' }, origin: 'parser' });
    expect(juicy).not.toHaveProperty('familyId');
    expect(juicy).not.toHaveProperty('dimension');
    expect(question.slice(juicy!.source.start, juicy!.source.end)).toBe(juicy!.source.text);
  });
});
