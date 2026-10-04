import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3,
  readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1,
  reviseHopV55QuestionScopeLedgerV1, type HopV55QuestionScopeTransitionV1 } from '../../src/services/hopV55/questionScopeReading';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';

const ownerKey = 'owner:question-scope-fixture';
const workspaceId = 'workspace:question-scope-fixture';
const recordedAt = '2026-10-03T19:00:00.000Z';
const q09 = 'Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa.';

function prepared(mode: 'planning' | 'unknownCulture' = 'planning') {
  return prepareBrewingScenarioContext(makeHopV55FixtureContext(mode));
}

function actor(origin: HopV55QuestionScopeTransitionV1['actor']['origin'] = 'user') {
  return { origin, label: origin === 'user' ? 'Brasseur fixture' : 'Lecteur fixture' };
}

describe('portées V1 des questions de moment et de choix matière', () => {
  it('lit Q09 en deux portées reliées, sans cible aromatique/style, opération ou faux objectif levure', () => {
    const context = prepared();
    const result = readHopV55QuestionWithScopesV1(q09, context);
    expect(result.reading.intent.question).toBe(q09);
    expect(result.reading.criterionDrafts.some(row => row.term === 'levure')).toBe(false);
    expect(result.reading.criterionDrafts.some(row => /neipa|super/iu.test(row.term))).toBe(false);
    expect(result.reading.operationDrafts).toBeUndefined();
    expect(result.scopeDrafts).toHaveLength(2);
    const timing = result.scopeDrafts.find(row => row.kind === 'employmentTiming')!;
    const selection = result.scopeDrafts.find(row => row.kind === 'materialSelection')!;
    expect(timing).toMatchObject({ origin: 'proposal', sourceSpan: { text: 'Quand avec ma levure, utiliser au mieux mon houblons' },
      focusSpan: { text: 'mon houblons' }, contextSpans: [{ text: 'avec ma levure' }] });
    expect(selection).toMatchObject({ origin: 'proposal', sourceSpan: { text: 'lesquels' }, focusSpan: { text: 'mon houblons' },
      relatedScopeIds: [timing.id] });
    for (const scope of result.scopeDrafts) {
      expect(q09.slice(scope.sourceSpan.start, scope.sourceSpan.end)).toBe(scope.sourceSpan.text);
      if (scope.focusSpan) expect(q09.slice(scope.focusSpan.start, scope.focusSpan.end)).toBe(scope.focusSpan.text);
      for (const contextSpan of scope.contextSpans) expect(q09.slice(contextSpan.start, contextSpan.end)).toBe(contextSpan.text);
    }
  });

  it('ne dépend pas du style ou de l’identité connue/inconnue de la levure', () => {
    const known = readHopV55QuestionWithScopesV1('Dans ma lager, quand utiliser les houblons avec ma levure et lesquels ?', prepared('planning'));
    const unknown = readHopV55QuestionWithScopesV1('Dans ma sour, quand utiliser les houblons avec ma levure et lesquels ?', prepared('unknownCulture'));
    expect(known.scopeDrafts.map(row => row.kind)).toEqual(['employmentTiming', 'materialSelection']);
    expect(unknown.scopeDrafts.map(row => row.kind)).toEqual(known.scopeDrafts.map(row => row.kind));
    expect(known.reading.criterionDrafts.some(row => /lager|sour/iu.test(row.term))).toBe(false);
    expect(unknown.reading.criterionDrafts.some(row => /lager|sour/iu.test(row.term))).toBe(false);
    expect(unknown.scopeDrafts.every(row => row.origin === 'proposal')).toBe(true);
  });

  it('garde une commande physique séparée de ses questions de choix/moment', () => {
    const command = readHopV55QuestionWithScopesV1('Ajoute 20 g de houblon au whirlpool.', prepared());
    expect(command.scopeDrafts).toEqual([]);

    const mixedQuestion = 'Ajoute 20 g de houblon au whirlpool. Quand utiliser un houblon avec ma levure, et lesquels ?';
    const mixed = readHopV55QuestionWithScopesV1(mixedQuestion, prepared());
    expect(mixed.scopeDrafts.map(row => row.kind)).toEqual(['employmentTiming', 'materialSelection']);
    for (const operation of mixed.reading.operationDrafts ?? []) {
      expect(mixedQuestion.slice(operation.sourceSpan!.start, operation.sourceSpan!.end)).toBe(operation.sourceSpan!.text);
    }
    for (const scope of mixed.scopeDrafts) expect(mixedQuestion.slice(scope.sourceSpan.start, scope.sourceSpan.end)).toBe(scope.sourceSpan.text);
  });

  it('scelle un archive V3 strict sans altérer un archive V2, et refuse spans/liens/versions incohérents', () => {
    const context = prepared();
    const { reading, scopeDrafts } = readHopV55QuestionWithScopesV1(q09, context);
    const runtimeReference = `fixture-runtime:${hopAdviceContentReference('scope-runtime', context.runtime)}`;
    const ledger = createHopV55QuestionScopeLedgerV1({ question: q09, reading, scopeDrafts,
      transition: { actId: 'act:scope-create', kind: 'create', reason: 'Portées proposées par la lecture.',
        recordedAt, actor: actor('proposal') } });
    const archiveV3 = createHopV55DecisionReadingArchiveV3({ id: 'reading:scope-v3', ownerKey, workspaceId, recordedAt,
      reading, source: { kind: 'exploration' }, runtimeReference, scopeLedger: ledger,
      transition: { actId: 'act:scope-create', kind: 'create', reason: 'Portées proposées par la lecture.', recordedAt, actor: actor('proposal') } });
    expect(readHopV55DecisionReadingArchive(archiveV3)).toMatchObject({ status: 'available', archive: { format: 'hop-v55-decision-reading-v3' } });
    expect(archiveV3.reading).toEqual(reading);

    const v2Reading = readHopV55Question('Je veux plus de floral.', context);
    const v2 = createHopV55DecisionReadingArchiveV2({ id: 'reading:scope-v2', ownerKey, workspaceId, recordedAt,
      reading: v2Reading, source: { kind: 'exploration' }, runtimeReference });
    expect(readHopV55DecisionReadingArchive(v2)).toMatchObject({ status: 'available', archive: { format: 'hop-v55-decision-reading-v2' } });
    expect(() => createHopV55DecisionReadingArchiveV2({ id: 'reading:scope-v2-invalid', ownerKey, workspaceId, recordedAt,
      reading: { ...v2Reading, scopeDrafts } as unknown as HopV55QuestionReading, source: { kind: 'exploration' }, runtimeReference }))
      .toThrow(/V2/iu);

    const tampered = structuredClone(archiveV3);
    const target = tampered.scopeLedger.entries.find(entry => entry.scopeId === scopeDrafts[0].id)!;
    target.sourceScope.sourceSpan.start += 1;
    const { contentReference: _old, ...body } = tampered;
    const malformed = { ...body, contentReference: hopAdviceContentReference('hop-v55-decision-reading-v3', body) };
    expect(readHopV55DecisionReadingArchive(malformed)).toMatchObject({ status: 'invalidRecord' });

    const future = structuredClone(archiveV3) as unknown as Record<string, any>;
    future.scopeLedger.format = 'hop-v55-question-scope-ledger-v2';
    const { contentReference: _previous, ...futureBody } = future;
    const futureArchive = { ...futureBody, contentReference: hopAdviceContentReference('hop-v55-decision-reading-v3', futureBody) };
    expect(readHopV55DecisionReadingArchive(futureArchive)).toMatchObject({ status: 'unsupportedFormat',
      format: 'hop-v55-question-scope-ledger-v2' });
  });

  it('corrige une portée en archive successorale append-only sans reparsing ni perte de source', () => {
    const context = prepared();
    const { reading, scopeDrafts } = readHopV55QuestionWithScopesV1(q09, context);
    const createTransition = { actId: 'act:scope-create-2', kind: 'create' as const,
      reason: 'Proposition initiale.', recordedAt, actor: actor('proposal') };
    const ledger = createHopV55QuestionScopeLedgerV1({ question: q09, reading, scopeDrafts, transition: createTransition });
    const timing = scopeDrafts.find(row => row.kind === 'employmentTiming')!;
    const revisedTransition: HopV55QuestionScopeTransitionV1 = { actId: 'act:scope-retain-timing', kind: 'reviseScopes',
      parentReadingReference: 'reading:scope-parent', reason: 'Le brasseur confirme cette portée.',
      recordedAt: '2026-10-03T19:01:00.000Z', actor: actor() };
    const revised = reviseHopV55QuestionScopeLedgerV1({ ledger, question: q09, reading, transition: revisedTransition,
      expectedParentReadingReference: 'reading:scope-parent', actions: [{ scopeId: timing.id, status: 'retained',
        reason: 'Conserver la question de moment.', activeScope: structuredClone(timing) }] });
    expect(revised.entries.map(row => row.scopeId)).toEqual([timing.id, scopeDrafts[1].id, timing.id]);
    expect(revised.entries.slice(0, 2)).toEqual(ledger.entries);
    expect(revised.entries.at(-1)).toMatchObject({ scopeId: timing.id, status: 'retained', sourceScope: timing,
      activeScope: { id: timing.id, sourceSpan: timing.sourceSpan, origin: 'brasseur' },
      decision: { actId: revisedTransition.actId, kind: 'retain', predecessorEntryReference: ledger.entries[0].reference,
        reason: 'Conserver la question de moment.', recordedBy: actor() } });
    expect(ledger.entries.at(-1)?.status).toBe('open');
  });
});
