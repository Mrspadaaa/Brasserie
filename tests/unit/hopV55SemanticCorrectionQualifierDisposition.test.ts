import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { applyHopV55SemanticCorrectionV1 } from '../../src/services/hopV55/decisionCorrection';
import { assertHopV55SemanticAnnotationsV1 } from '../../src/services/hopV55/decisionSemanticProjection';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';

describe('consumer-check — provenance du qualificatif après requalification brasseur', () => {
  it('garde la source historique exacte avec une nouvelle lecture explicitement corrigée', () => {
    const question = 'Je veux une bière avec une faible amertume.';
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
    const reading = readHopV55QuestionSemanticV1(question, prepared);
    const previous = reading.annotations.find(row => row.term === 'amertume')!;
    const submitted = structuredClone(reading.annotations);
    const correction = submitted.find(row => row.id === previous.id)!;
    correction.sense = 'reportedObservation';
    correction.requirement = 'optional';
    correction.direction = null;

    const corrected = applyHopV55SemanticCorrectionV1({ reading, annotations: submitted, prepared,
      sourceReadingReference: 'reading:source-qualifier', recordedAt: '2026-10-04T04:20:00.000Z',
      reason: 'Le brasseur précise que la formulation rapporte une perception, pas une cible.' });
    const next = corrected.annotations.find(row => row.id === previous.id)!;

    expect(next).toMatchObject({ id: previous.id, sense: 'reportedObservation', requirement: 'optional', direction: null,
      origin: 'brasseur', source: previous.source, qualifierSource: previous.qualifierSource });
    expect(question.slice(next.qualifierSource!.start, next.qualifierSource!.end)).toBe('faible');
    expect(corrected.correction?.changedAnnotationIds).toEqual([previous.id]);
    expect(() => assertHopV55SemanticAnnotationsV1(corrected.annotations, question)).not.toThrow();
  });

  it('refuse le même changement de sens sans provenance de correction humaine', () => {
    const question = 'Je veux une bière avec une faible amertume.';
    const reading = readHopV55QuestionSemanticV1(question,
      prepareBrewingScenarioContext(makeHopV55FixtureContext('planning')));
    const annotations = structuredClone(reading.annotations);
    const target = annotations.find(row => row.term === 'amertume')!;
    target.sense = 'reportedObservation';
    target.requirement = 'optional';
    target.direction = null;
    target.origin = 'parser';

    expect(() => assertHopV55SemanticAnnotationsV1(annotations, question)).toThrow(/source de qualificatif inattendue/u);
  });
});
