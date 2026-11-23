import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import {
  applyHopV55SemanticCorrectionV1,
  reevaluateHopV55SemanticReadingV1,
} from '../../src/services/hopV55/decisionCorrection';
import {
  createHopV55DecisionReadingArchiveV2,
  createHopV55DecisionReadingArchiveV4,
  readHopV55DecisionReadingArchive,
} from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';

const ownerKey = 'owner:pro03-archive-fixture';
const workspaceId = 'workspace:pro03-archive-fixture';
const source = { kind: 'exploration' as const };
const prepared = () => prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));

describe('consumer-check — archive sémantique V4', () => {
  it('scelle la lecture, refuse une mutation de contenu et conserve les formats futurs en lecture seule', () => {
    const question = 'Je veux une bière avec une faible amertume.';
    const reading = readHopV55QuestionSemanticV1(question, prepared());
    const archive = createHopV55DecisionReadingArchiveV4({ id: 'reading:pro03-v4', ownerKey, workspaceId,
      recordedAt: '2026-10-04T04:00:00.000Z', reading, source, runtimeReference: 'runtime:pro03-v4' });

    expect(readHopV55DecisionReadingArchive(archive)).toEqual({ status: 'available', archive });
    const changed = structuredClone(archive);
    changed.reading.annotations[0].term += ' altéré';
    expect(readHopV55DecisionReadingArchive(changed)).toMatchObject({ status: 'invalidRecord' });

    const future = { ...archive, format: 'hop-v55-decision-reading-v5' };
    expect(readHopV55DecisionReadingArchive(future)).toMatchObject({ status: 'unsupportedFormat',
      format: 'hop-v55-decision-reading-v5' });
  });

  it('ne force pas une cible required sans direction dans le codec historique V2', () => {
    const reading = readHopV55Question('Je veux une bière avec une faible amertume.', prepared());
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'amertume', direction: null, requirement: 'required' }),
    ]));
    expect(() => createHopV55DecisionReadingArchiveV2({ id: 'reading:pro03-invalid-v2', ownerKey, workspaceId,
      recordedAt: '2026-10-04T04:00:00.000Z', reading: reading as HopV55QuestionReading, source,
      runtimeReference: 'runtime:pro03-invalid-v2' })).toThrow(/V2/u);
  });

  it('archive une correction et un réexamen comme deux successeurs, sans réécrire leurs parents', () => {
    const context = prepared();
    const question = 'Je veux une bière avec une faible amertume.';
    const originalReading = readHopV55QuestionSemanticV1(question, context);
    const original = createHopV55DecisionReadingArchiveV4({ id: 'reading:pro03-original', ownerKey, workspaceId,
      recordedAt: '2026-10-04T04:00:00.000Z', reading: originalReading, source, runtimeReference: 'runtime:pro03-original' });
    const submitted = structuredClone(originalReading.annotations);
    const target = submitted.find(row => row.term === 'amertume')!;
    target.sense = 'reportedObservation';
    target.requirement = 'optional';
    target.direction = null;

    const correctedReading = applyHopV55SemanticCorrectionV1({ reading: originalReading, annotations: submitted,
      prepared: context, sourceReadingReference: original.contentReference, recordedAt: '2026-10-04T04:01:00.000Z',
      reason: 'La phrase rapporte une impression, elle ne fixe pas une cible.' });
    const corrected = createHopV55DecisionReadingArchiveV4({ id: 'reading:pro03-corrected', ownerKey, workspaceId,
      recordedAt: '2026-10-04T04:01:00.000Z', reading: correctedReading, source, runtimeReference: 'runtime:pro03-corrected',
      lineage: { kind: 'reinterpretation', parentReadingReference: original.contentReference, parentReadingFormat: original.format,
        reason: 'Correction explicite de la lecture.', recordedAt: '2026-10-04T04:01:00.000Z', actor: { origin: 'user', label: 'Brasseur' } } });
    const correctedTarget = corrected.reading.annotations.find(row => row.id === target.id)!;
    expect(correctedTarget).toMatchObject({ id: target.id, source: target.source, sense: 'reportedObservation',
      direction: null, requirement: 'optional', origin: 'brasseur', qualifierSource: target.qualifierSource });
    expect(readHopV55DecisionReadingArchive(corrected)).toMatchObject({ status: 'available',
      archive: { lineage: { parentReadingReference: original.contentReference }, reading: correctedReading } });

    expect(readHopV55DecisionReadingArchive(original)).toEqual({ status: 'available', archive: original });
    const reread = readHopV55DecisionReadingArchive(corrected);
    if (reread.status !== 'available' || reread.archive.format !== 'hop-v55-decision-reading-v4') throw new Error('Le successeur V4 doit être relisible.');
    const reexaminedReading = reevaluateHopV55SemanticReadingV1({ reading: reread.archive.reading, prepared: context });
    expect(reexaminedReading.intent.question).toBe(question);
    expect(reexaminedReading.annotations.map(row => row.id)).toEqual(correctedReading.annotations.map(row => row.id));
    const reexamined = createHopV55DecisionReadingArchiveV4({ id: 'reading:pro03-reexamined', ownerKey, workspaceId,
      recordedAt: '2026-10-04T04:02:00.000Z', reading: reexaminedReading, source, runtimeReference: 'runtime:pro03-reexamined',
      lineage: { kind: 'reinterpretation', parentReadingReference: corrected.contentReference, parentReadingFormat: corrected.format,
        reason: 'Réexamen de la même lecture archivée.', recordedAt: '2026-10-04T04:02:00.000Z', actor: { origin: 'user', label: 'Brasseur' } } });
    expect(readHopV55DecisionReadingArchive(reexamined)).toMatchObject({ status: 'available',
      archive: { lineage: { parentReadingReference: corrected.contentReference } } });
    expect(readHopV55DecisionReadingArchive(corrected)).toMatchObject({ status: 'available', archive: corrected });
  });
});
