import { describe, expect, it, vi } from 'vitest';
import type { HopAdviceAssertion } from '../../src/domain/hopDecision/adviceSchema';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { createHopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { createHopV55PropertyAdviceControllerV4, type HopV55PropertyAdviceHostV4,
  type HopV55PropertyAdviceV4ReexaminationCommand } from '../../src/services/hopV55/propertyAdviceControllerV4';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { verifyRecordResultV4, type V4RecordExpectation } from '../../src/ui/hopV55/PropertyAdviceDecisionV4';

const ownerKey = 'fixture:r20-3-access-context-v4';
const workspaceId = 'workspace:r20-3-access-context-v4';
const question = 'Ma bière est trop sucrée, comment compenser ça avec mon houblon ? Quand avec ma levure utiliser les houblons et lesquels ?';
const correctionAt = '2026-10-03T21:31:00.000Z';
const reexaminationAt = '2026-10-03T21:32:00.000Z';

function journey() {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const read = readHopV55QuestionWithScopesV1(question, prepared);
  if (!read.reading.response || read.scopeDrafts.length !== 2) throw Error('La fixture R20-3 exige une lecture structurée avec ses deux portées.');
  const source = context.recipe?.id ? { kind: 'recipe' as const, id: context.recipe.id } : { kind: 'exploration' as const };
  const runtimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
  const transition = { actId: 'act:r20-3-scope-create', kind: 'create' as const,
    reason: 'Portées proposées dans la fixture de réexamen.', recordedAt: '2026-10-03T21:00:00.000Z',
    actor: { origin: 'proposal' as const, label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading: read.reading,
    scopeDrafts: read.scopeDrafts, transition });
  const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:r20-3-source', ownerKey, workspaceId,
    recordedAt: transition.recordedAt, reading: read.reading, source, runtimeReference, scopeLedger, transition });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: read.reading, prepared,
    requestId: 'request:r20-3-source', ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière choisie dans la fixture.' } });
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestSnapshot);
  const sourceRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot, answerRecordId: 'answer:r20-3-source' });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'R20-3 · accès historique synthétique', intent: structuredClone(read.reading.intent),
    ...(context.recipe?.id ? { sourceRecipeId: context.recipe.id } : {}), decisionReadings: [archive],
    documentaryAnswers: [sourceRecord], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: transition.recordedAt };
  return { context, prepared, reading: read.reading, archive, sourceRecord, workspace };
}

function makeHost(base: ReturnType<typeof journey>) {
  let workspace = structuredClone(base.workspace);
  let activeReading = base.archive;
  const save = vi.fn(async (next: HopV55Workspace) => {
    if (next.revision !== workspace.revision) throw Object.assign(new Error('Révision périmée.'), { code: 'staleRevision' });
    workspace = { ...structuredClone(next), revision: workspace.revision + 1 };
    return structuredClone(workspace);
  });
  const selected = vi.fn();
  const activated = vi.fn((archive: typeof activeReading) => { activeReading = structuredClone(archive); });
  const host: HopV55PropertyAdviceHostV4 = {
    services: { ownerKey, scope: 'fixture' }, enabled: () => true, historical: () => false,
    reading: () => structuredClone(activeReading), context: async () => structuredClone(base.context),
    workspace: async () => structuredClone(workspace), save,
    source: row => row.sourceRecipeId ? { kind: 'recipe', id: row.sourceRecipeId } : { kind: 'exploration' },
    runtimeReference: prepared => hopV55ScenarioRuntimeReference(prepared.runtime), adoptedIdentity: () => null,
    pending: new Map(), selected, activated,
  };
  return { host, save, selected, activated, stored: () => structuredClone(workspace) };
}

function samplingAssertion(): HopAdviceAssertion {
  return { id: 'assertion:r20-3-sampling-yes', subject: 'sampling',
    statement: 'Un prélèvement est disponible pour un essai comparatif.', state: 'reported', value: true, dimension: 'process',
    source: { title: 'Attestation de fixture', author: 'Brasseur fixture', year: 2026, kind: 'observation',
      reference: 'fixture://r20-3/sampling', locator: 'Motif exact: prélèvement autorisé par le brasseur.' } };
}

async function correctedParent() {
  const base = journey();
  const harness = makeHost(base);
  const controller = createHopV55PropertyAdviceControllerV4(harness.host);
  const upgraded = await controller.upgradeV3(base.sourceRecord.reference, 'act:r20-3-upgrade', 'Reprise V4 de la fixture R20-3.');
  const readingContext = structuredClone(upgraded.readingContext);
  const assertion = samplingAssertion();
  readingContext.context.assertions.push(assertion);
  readingContext.context.access.sampling = { state: 'yes', basis: 'Motif exact: prélèvement autorisé par le brasseur.', assertionIds: [assertion.id] };
  const reason = 'Le brasseur confirme un prélèvement pour un essai comparatif.';
  const corrected = await controller.correct({ commandId: 'act:r20-3-sampling-yes', expectedRecordReference: upgraded.reference,
    expectedLedgerReference: upgraded.ledger.reference, actions: [], readingContext, reason });
  return { ...base, ...harness, controller, upgraded, corrected, assertion, correctionReason: reason };
}

describe('R20-3 · assertion historique contre accès du contexte réexaminé', () => {
  it('conserve le oui, sa source, son motif et sa date dans le parent, et relit séparément les accès physiques inconnus', async () => {
    const h = await correctedParent();
    const parentBefore = structuredClone(h.corrected);
    const reexamination: HopV55PropertyAdviceV4ReexaminationCommand = { commandId: 'act:r20-3-reexamine-current',
      expectedRecordReference: h.corrected.reference, expectedLedgerReference: h.corrected.ledger.reference,
      reason: 'Relire cette interprétation avec le contexte physique actif.' };
    const result = await h.controller.reexamine(reexamination);

    expect(result.transition).toMatchObject({ kind: 'reexamine', actId: reexamination.commandId,
      parentRecordReference: parentBefore.reference, parentReadingReference: parentBefore.sourceReadingReference,
      reason: reexamination.reason, actor: { origin: 'user' } });
    expect(Date.parse(result.transition.recordedAt)).not.toBeNaN();
    expect(result.sourceReadingReference).not.toBe(parentBefore.sourceReadingReference);
    expect(result.preparation.source).toEqual(parentBefore.preparation.source);

    const stored = h.stored();
    expect(stored.documentaryAnswers?.[2]).toEqual(parentBefore);
    expect(stored.documentaryAnswers).toHaveLength(4);
    expect(parentBefore.readingContext.context.access.sampling).toEqual({ state: 'yes',
      basis: 'Motif exact: prélèvement autorisé par le brasseur.', assertionIds: [h.assertion.id] });
    expect(parentBefore.readingContext.context.assertions).toContainEqual(h.assertion);
    expect(parentBefore.transition).toMatchObject({ kind: 'revise', reason: h.correctionReason, recordedAt: expect.any(String),
      actor: { origin: 'user' } });
    expect(Date.parse(parentBefore.transition.recordedAt)).not.toBeNaN();
    expect(parentBefore.ledger).toEqual(h.corrected.ledger);

    const current = result.readingContext.context;
    expect(current.stage).toBe(h.prepared.runtime.current?.program?.stage ?? 'unknown');
    expect(current.access.sampling).toMatchObject({ state: 'unknown', assertionIds: [] });
    expect(current.access.sampling.basis).toMatch(/Accès non déclaré/u);
    const currentIds = current.assertions.map(row => row.id);
    expect(new Set(currentIds).size).toBe(currentIds.length);
    expect(currentIds).not.toContain(h.assertion.id);
    expect(current.access.sampling.assertionIds).not.toContain(h.assertion.id);

    const expectedCurrentIds = [
      ...(h.prepared.runtime.current?.culture ? ['context-culture'] : []),
      ...(h.prepared.runtime.current?.input.aromaDomain === 'nolo' ? ['context-aroma-domain-nolo'] : []),
      ...(h.prepared.runtime.current?.beerContext?.facts ?? []).map(fact => `context-${fact.id}`),
      ...(h.prepared.runtime.current?.program?.additions ?? []).map(addition => `program-${addition.id}`),
    ];
    expect(currentIds).toEqual(expectedCurrentIds);
    expect(currentIds.every(id => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(h.activated).toHaveBeenCalledTimes(1);
  });

  it('accepte le cadre physique relu sans conserver une attestation historique non liée', async () => {
    const h = await correctedParent();
    const result = await h.controller.reexamine({ commandId: 'act:r20-3-ui-guard',
      expectedRecordReference: h.corrected.reference, expectedLedgerReference: h.corrected.ledger.reference,
      reason: 'Contrôle du conflit entre assertion historique et contexte frais.' });
    const expectation: V4RecordExpectation = { kind: 'reexamine', base: h.corrected, commandId: 'act:r20-3-ui-guard',
      reason: 'Contrôle du conflit entre assertion historique et contexte frais.', actions: [],
      expectedReadingContext: h.corrected.readingContext,
      expectedActiveIds: h.corrected.ledger.sourceAnnotations.map(row => row.id) };

    expect(h.corrected.readingContext.context.access.sampling.state).toBe('yes');
    expect(result.readingContext.context.access.sampling.state).toBe('unknown');
    expect(verifyRecordResultV4(expectation, result)).toBeNull();

    const withMissingOldAssertion = structuredClone(result) as any;
    const missingAnswer = withMissingOldAssertion.outcome.answerSnapshot;
    const missingIntent = missingAnswer.requestSnapshot.propertyIntents[0];
    missingIntent.comparisonBasis = { ...missingIntent.comparisonBasis, kind: 'current', assertionIds: [h.assertion.id] };
    expect(verifyRecordResultV4(expectation, withMissingOldAssertion)).toMatch(/fait absent du contexte relu/u);

    const withChangedOldAssertion = structuredClone(result) as any;
    const changedAssertion = { ...h.assertion, statement: 'L’ancienne attestation a été réutilisée avec un autre contenu.' };
    const changedAnswer = withChangedOldAssertion.outcome.answerSnapshot;
    const changedIntent = changedAnswer.requestSnapshot.propertyIntents[0];
    changedIntent.comparisonBasis = { ...changedIntent.comparisonBasis, kind: 'current', assertionIds: [h.assertion.id] };
    changedAnswer.requestSnapshot.context.assertions.push(changedAssertion);
    withChangedOldAssertion.readingContext.context.assertions.push(changedAssertion);
    expect(verifyRecordResultV4(expectation, withChangedOldAssertion)).toMatch(/contenu a changé/u);
  });
});
