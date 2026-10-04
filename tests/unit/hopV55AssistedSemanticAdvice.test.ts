import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { applyBrewingReferenceCommand, openBrewingReferenceContext, readBrewingReferenceRecord,
  type BrewingReferenceEvent } from '../../src/domain/brewingReference';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  prepareHopV55SemanticAssistedAdviceLaunchV1,
  receiveHopV55AssistedSemanticAdviceProposalV5,
} from '../../src/services/hopV55/assistedSemanticAdviceContextV4';
import {
  buildHopV55AssistedSemanticAdviceRequestV3,
  measureHopAdviceV1SemanticWireV3,
} from '../../src/services/hopV55/assistedSemanticAdviceRequestV3';
import {
  buildHopAdviceV1WireV3,
} from '../../functions/src/brewerHopAdviceTransportV1';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
  createBrewerHopAdviceProposalEnvelopeV5,
  measureBrewerHopAdviceSemanticJsonWire,
} from '../../functions/src/brewerHopAdviceSemanticV3';
import {
  createHopV55DecisionReadingArchiveV4,
  readHopV55QuestionSemanticV1,
} from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';

const ownerKey = 'owner:assisted-v2-size-fixture';
const workspaceId = 'workspace:assisted-v2-size-fixture';
const candidatePolicy = {
  kind: 'explicit' as const,
  materialIds: [],
  basis: 'Mesure locale sans matière choisie.',
};
const question = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const recordedAt = '2026-10-04T09:40:00.000Z';

function setupInputs(context: ReturnType<typeof makeHopV55FixtureContext>, questionText = question) {
  const prepared = prepareBrewingScenarioContext(context);
  const recipeId = context.recipe?.id;
  if (!recipeId) throw new Error('La fixture planning doit fournir une recette synthétique.');
  const reading = readHopV55QuestionSemanticV1(questionText, prepared);
  const archive = createHopV55DecisionReadingArchiveV4({
    id: 'reading:assisted-v2-size',
    ownerKey,
    workspaceId,
    recordedAt,
    reading,
    source: { kind: 'recipe', id: recipeId },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const scope = { kind: 'recipe' as const, id: recipeId };
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Fixture conseil sémantique', intent: { question: questionText, criteria: [] }, sourceRecipeId: recipeId,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt,
  };
  const page = { archive, workspace, ownerKey, workspaceId, scopeAtPageLaunch: scope, context };
  return { context, prepared, reading, archive, scope, workspace, page };
}

function setupFromContext(context: ReturnType<typeof makeHopV55FixtureContext>, questionText = question) {
  const base = setupInputs(context, questionText);
  const { page } = base;
  const launched = prepareHopV55SemanticAssistedAdviceLaunchV1(page);
  if (launched.status !== 'ready') throw new Error(`Lancement fixture refusé : ${JSON.stringify(launched)}`);
  return { ...base, launched };
}

function setup(questionText = question) {
  return setupFromContext(makeHopV55FixtureContext('planning'), questionText);
}

async function setupWithLocalCatalogue() {
  const context = makeHopV55FixtureContext('planning');
  const catalogue = await loadBrewingCatalogueReferences();
  context.hopIndex = { ...context.hopIndex!, varieties: catalogue.varieties, lots: [], knowledge: catalogue.knowledge,
    predictions: [], tastings: [], truncated: [] };
  return setupInputs(context);
}

function setupBatch() {
  const context = makeHopV55FixtureContext('fermenting');
  const prepared = prepareBrewingScenarioContext(context);
  const batchId = context.batch?.id;
  if (!batchId) throw new Error('La fixture fermentation doit fournir un brassin synthétique.');
  const reading = readHopV55QuestionSemanticV1(question, prepared);
  const archive = createHopV55DecisionReadingArchiveV4({ id: 'reading:large-local-journal', ownerKey, workspaceId,
    recordedAt, reading, source: { kind: 'batch', id: batchId }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const scope = { kind: 'batch' as const, id: batchId };
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Fixture journal local volumineux', intent: { question, criteria: [] }, sourceBatchId: batchId,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt };
  const page = { archive, workspace, ownerKey, workspaceId, scopeAtPageLaunch: scope, context };
  const launched = prepareHopV55SemanticAssistedAdviceLaunchV1(page);
  if (launched.status !== 'ready') throw new Error(`Lancement batch fixture refusé : ${JSON.stringify(launched)}`);
  return { context, prepared, reading, archive, scope, workspace, page, launched };
}

function largeValidLocalReferenceJournal(observationCount: number) {
  const journalOwner = 'owner:semantic06-journal-fixture';
  const contextId = 'reference-context:semantic06-journal-fixture';
  const opened = openBrewingReferenceContext({ ownerKey: journalOwner, contextId,
    commandId: 'open:semantic06-journal-fixture', recordedAt: '2026-10-04T08:00:00.000Z',
    context: { programReference: null, past: { status: 'unknown' }, details: { source: 'fixture de taille locale' } } });
  let record = opened.record;
  const events: BrewingReferenceEvent[] = [opened.event];
  for (let index = 0; index < observationCount; index++) {
    const recordedAt = new Date(Date.parse('2026-10-04T08:00:01.000Z') + index * 1000).toISOString();
    const result = applyBrewingReferenceCommand(record, {
      ownerKey: journalOwner, contextId, commandId: `observation:${index}`,
      expectedRevision: record.revision, recordedAt, kind: 'observationRecorded',
      payload: { observation: {
        id: `qualitative-fixture-${index}`, version: 1,
        subject: { kind: 'beer', label: `Échantillon synthétique ${index}` }, observedAt: recordedAt,
        author: { id: 'fixture-author', label: 'Fixture synthétique' },
        origin: { kind: 'userDeclaration', description: 'Observation qualitative synthétique pour vérifier la borne du wire.' },
        originalText: `Observation qualitative distincte ${index} : caractère descriptif de l’échantillon fictif numéro ${index}.`,
        dimension: { status: 'unresolved', label: `Dimension descriptive non résolue ${index}` },
        scale: { status: 'unknown' }, sense: { kind: 'qualitative' }, comparison: { kind: 'absolute' },
        context: { fixture: 'wire-size', sequence: index },
      } },
    }, events);
    record = result.record;
    events.push(result.event);
  }
  const reread = readBrewingReferenceRecord(record, events);
  if ('status' in reread) throw new Error(`Journal append-only synthétique invalide : ${reread.reason}`);
  return { record: reread.record, events: reread.events };
}

function proposal(s: ReturnType<typeof setup>, evidence: Array<{ id: string; name: string; label: string; facts: string[]; limits: string[]; data: unknown }> = []) {
  const request = s.launched.request;
  return createBrewerHopAdviceProposalEnvelopeV5({
    request,
    prepared: s.prepared,
    raw: {
      annotationReviews: [], propertyIntentProposals: [], semanticRevisionProposals: [],
      openQuestions: [], materials: [],
      answer: { summary: 'Lecture de la fixture.', readingNote: 'Aucune action n’est choisie.',
        options: [{ id: 'assist-investigation', kind: 'investigation', title: 'Caractériser avant de choisir',
          rationale: 'La lecture n’établit pas qu’une hausse soit décidée.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [] }], unknowns: [],
        program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [] },
    },
    evidence,
    serverContext: { phase: s.context.phase, provenance: [...s.context.provenance], loadedAt: s.context.now,
      binding: structuredClone(request.contextLaunch.expected) },
  });
}

describe('client source4 RequestV3 / ProposalV5', () => {
  it('garde archive4 complète du cas gros-catalogue à côté de RequestV3 compacte et mesure le wire V1 exact', async () => {
    const s = await setupWithLocalCatalogue();
    const launchResult = prepareHopV55SemanticAssistedAdviceLaunchV1(s.page);
    expect(launchResult.status).toBe('ready');
    if (launchResult.status !== 'ready') return;
    const launched = launchResult;
    const recipeScope = launched.request.contextLaunch.scope;
    if (recipeScope.kind !== 'recipe') throw new Error('Le cas V2 taille doit conserver son scope recette source.');
    expect(launched.request.format).toBe(BREWER_HOP_ADVICE_REQUEST_FORMAT_V3);
    expect(launched.sourceArchive).toEqual(s.archive);
    expect('sourceArchive' in launched.request).toBe(false);
    expect(launched.request.sourceView.archiveIdentity.contentReference).toBe(s.archive.contentReference);
    expect(launched.requestBytes.utf8Bytes).toBeGreaterThan(0);
    expect(launched.request.sourceView.semantic.annotations).toEqual(s.archive.reading.annotations);
    expect(launched.request.sourceView.semantic.branches).toEqual(s.archive.reading.branches);
    expect(launched.request.sourceView.semantic.operationDrafts).toEqual(s.archive.reading.operationDrafts);
    expect(launched.request.sourceView.scopeLedger).toEqual(s.archive.scopeLedger);
    expect(launched.request.sourceView.transition).toEqual(s.archive.transition);
    expect(launched.request.sourceView.lineage).toEqual(s.archive.lineage);
    expect(launched.request.sourceView.programPreparation).toEqual(s.archive.programPreparation);
    expect(launched.request.sourceView.semantic).not.toHaveProperty('response');
    if (s.archive.reading.response === undefined) {
      expect(launched.request.sourceView.localDerivations.readingResponse).toEqual({ state: 'absent' });
    } else {
      expect(launched.request.sourceView.localDerivations.readingResponse).toMatchObject({
        state: 'localOnly', path: 'reading.response', reference: expect.any(String),
      });
    }

    const wire = buildHopAdviceV1WireV3({ operationId: 'operation:semantic06-fixture', generation: 7,
      scope: { kind: recipeScope.kind, id: recipeScope.id }, question: launched.request.question,
      analysisMode: 'fast', phase: 'fixture', hopAdvice: launched.request });
    const measured = measureHopAdviceV1SemanticWireV3({ request: launched.request, sourceArchive: s.archive, wire });
    expect(measured.status).toBe('ready');
    if (measured.status !== 'ready') return;
    expect(measured.wireBytes.utf8Bytes).toBeGreaterThan(launched.requestBytes.utf8Bytes);
    expect(measured.wire).toEqual(wire);
    const archiveBytes = measureBrewerHopAdviceSemanticJsonWire(s.archive);
    const sourceViewBytes = measureBrewerHopAdviceSemanticJsonWire(launched.request.sourceView);
    const contextLaunchBytes = measureBrewerHopAdviceSemanticJsonWire(launched.request.contextLaunch);
    const responseDescriptor = launched.request.sourceView.localDerivations.readingResponse;
    const responseBytes = s.archive.reading.response === undefined
      ? null : measureBrewerHopAdviceSemanticJsonWire(s.archive.reading.response);
    const measurement = {
      fixture: 'exact setup from hopV55AssistedAdviceControllerV2Size.test.ts: local full catalogue + same semantic question',
      archiveBytes, requestBytes: launched.requestBytes, wireBytes: measured.wireBytes,
      sourceViewBytes, contextLaunchBytes,
      sourceViewReference: launched.request.sourceView.reference,
      readingResponse: responseDescriptor,
      readingResponseBytes: responseBytes,
      maxPayloadBytes: 100000, maxDepth: 18,
    };
    console.info(`SEMANTIC06_SOURCE4_WIRE ${JSON.stringify(measurement)}`);
    expect(archiveBytes.utf8Bytes).toBeGreaterThan(100_000);
    expect(launched.requestBytes.utf8Bytes).toBeLessThanOrEqual(100_000);
    expect(measured.wireBytes.utf8Bytes).toBeLessThanOrEqual(100_000);
    expect(measured.wireBytes.maxDepth).toBeLessThanOrEqual(18);
  });

  it('refuse un wire trop grand avec un journal local append-only valide, sans troncature', () => {
    const s = setupBatch();
    const localJournal = largeValidLocalReferenceJournal(220);
    const localJournalBytes = measureBrewerHopAdviceSemanticJsonWire(localJournal);
    expect(localJournalBytes.utf8Bytes).toBeGreaterThan(100_000);
    const batchScope = s.launched.request.contextLaunch.scope;
    if (batchScope.kind !== 'batch') throw new Error('Le journal local volumineux exige le scope brassin de sa fixture.');
    const wire = buildHopAdviceV1WireV3({ operationId: 'operation:large-journal-fixture', generation: 2,
      scope: { kind: batchScope.kind, id: batchScope.id }, question: s.launched.request.question,
      analysisMode: 'fast', phase: 'fixture', hopAdvice: s.launched.request, localJournal });
    const measured = measureHopAdviceV1SemanticWireV3({ request: s.launched.request,
      sourceArchive: s.archive, wire });
    expect(measured).toMatchObject({ status: 'tooLarge', maxBytes: 100000, maxDepth: 18 });
    if (measured.status !== 'tooLarge') return;
    console.info(`SEMANTIC06_OVERSIZE_WIRE ${JSON.stringify({
      fixture: 'strictly replayed append-only qualitative reference journal',
      archiveBytes: measureBrewerHopAdviceSemanticJsonWire(s.archive), requestBytes: s.launched.requestBytes,
      localJournalBytes, wireBytes: measured.wireBytes, maxBytes: measured.maxBytes, maxDepth: measured.maxDepth,
      localJournalEvents: localJournal.events.length,
    })}`);
    expect(measured.wireBytes.utf8Bytes).toBeGreaterThan(100_000);
    expect(measured.wireBytes.maxDepth).toBeLessThanOrEqual(18);
    expect(wire.localJournal).toEqual(localJournal);
    expect((wire.localJournal as typeof localJournal).events).toHaveLength(221);
  });

  it('relecture JSON conserve sourceView, résultat froid futur brut et turnover exact sans calcul froid', () => {
    const s = setup();
    const futureCold = { id: 'E-cold-future', name: 'cold_contact_bitterness_reference', label: 'Fixture future froide',
      facts: [], limits: [], data: { format: 'cold-hop-bu-reference-result-v99', version: 99, note: 'opaque-fixture' } };
    const envelope = proposal(s, [futureCold]);
    const requestRoundTrip = JSON.parse(JSON.stringify(s.launched.request));
    const envelopeRoundTrip = JSON.parse(JSON.stringify(envelope));
    const evidence = [futureCold];
    const result = receiveHopV55AssistedSemanticAdviceProposalV5({ request: requestRoundTrip,
      sourceArchive: JSON.parse(JSON.stringify(s.archive)), envelope: envelopeRoundTrip,
      current: { ...s.page, archive: JSON.parse(JSON.stringify(s.archive)), workspace: JSON.parse(JSON.stringify(s.workspace)) },
      turnEvidence: evidence, baselineRequestId: 'baseline:semantic06-receipt', candidatePolicy });
    expect(result.status).toBe('readOnly');
    if (result.status !== 'readOnly') return;
    expect(result.envelope.requestSnapshot.sourceView).toEqual(requestRoundTrip.sourceView);
    expect(result.sourcePropertyProjection.sourceReadingReference).toBe(s.archive.contentReference);
    expect(result.turnEvidence).toBe(evidence);
    expect(result.coldContactEvidence).toMatchObject([{ status: 'unsupportedFormat', evidenceId: 'E-cold-future',
      format: 'cold-hop-bu-reference-result-v99', raw: futureCold.data }]);
    expect(result.runtimeGate).toMatchObject({ status: 'notChecked', requiredChecks: ['ticket identity', 'operationId', 'generation'] });
    expect(result.readerBaseline.status).toBe('ready');
    if (result.readerBaseline.status !== 'ready') return;
    const bitterTarget = result.readerBaseline.draft.requestSnapshot.propertyIntents.find((intent) =>
      intent.property === 'bitterness' && intent.sourceSpans.some((span) => /faible|amertume/iu.test(span.text)));
    expect(bitterTarget).toMatchObject({ role: 'target', direction: null, comparisonBasis: { kind: 'qualitativeTarget' } });
    expect(result.answer.options).toHaveLength(1);
    expect(result.answer.options[0]).toMatchObject({ kind: 'investigation', title: 'Caractériser avant de choisir' });
    expect(result.answer.program.kind).toBe('none');
    expect(result.suggestions.propertyIntentProposals).toEqual([]);
    expect(result.suggestions.semanticRevisionProposals).toEqual([]);
  });

  it('garde l’enveloppe A en historique et refuse baseline lorsqu’une lecture corrigée B est affichée', () => {
    const a = setup();
    const envelopeA = proposal(a);
    const b = setup('Ma bière est trop douce. Je veux conserver la poire. Version corrigée.');
    const result = receiveHopV55AssistedSemanticAdviceProposalV5({ request: a.launched.request,
      sourceArchive: a.archive, envelope: envelopeA,
      current: { ...b.page, archive: b.archive, workspace: b.workspace }, turnEvidence: [],
      baselineRequestId: 'baseline:semantic06-stale', candidatePolicy });
    expect(result.status).toBe('readOnly');
    if (result.status !== 'readOnly') return;
    expect(result.envelope.requestSnapshot.sourceReadingReference).toBe(a.archive.contentReference);
    expect(result.contextCheck.history.status).toBe('matched');
    expect(result.contextCheck.applicability).toMatchObject({ status: 'stale' });
    expect(result.readerBaseline.status).toBe('withheld');
  });

  it('conserve les formats futurs raw/read-only et refuse une archive locale qui diffère de la sourceView du ticket', () => {
    const s = setup();
    const envelope = proposal(s);
    const futureRequest = { ...s.launched.request, format: 'brewer-hop-advice-request-v99', futureField: { keep: true } };
    const futureRequestResult = receiveHopV55AssistedSemanticAdviceProposalV5({ request: futureRequest,
      sourceArchive: s.archive, envelope, current: s.page, turnEvidence: [] });
    expect(futureRequestResult).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureRequest });

    const futureViewRequest = { ...s.launched.request,
      sourceView: { ...s.launched.request.sourceView, format: 'hop-v55-source4-assistance-view-v99', opaque: true } };
    expect(receiveHopV55AssistedSemanticAdviceProposalV5({ request: futureViewRequest,
      sourceArchive: s.archive, envelope, current: s.page, turnEvidence: [] }))
      .toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureViewRequest });

    const futureEnvelope = { ...envelope, format: 'brewer-hop-advice-proposal-v99', futureField: { keep: 'opaque' } };
    const futureEnvelopeResult = receiveHopV55AssistedSemanticAdviceProposalV5({ request: s.launched.request,
      sourceArchive: s.archive, envelope: futureEnvelope, current: s.page, turnEvidence: [] });
    expect(futureEnvelopeResult).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureEnvelope });

    const changedArchive = structuredClone(s.archive);
    changedArchive.reading.interpretation += ' altérée';
    expect(receiveHopV55AssistedSemanticAdviceProposalV5({ request: s.launched.request,
      sourceArchive: changedArchive, envelope, current: s.page, turnEvidence: [] })).toMatchObject({ status: 'invalid' });
  });
});
