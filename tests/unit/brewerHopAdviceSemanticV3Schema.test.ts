import { describe, expect, it, vi } from 'vitest';
import source4Fixture from '../fixtures/source4-contract-fixture.json';
import type { BrewerContext } from '../../functions/src/companionTypes.js';
import {
  BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT,
  mapBrewerHopAdviceLaunchSourceToScopeV1,
  type BrewerHopAdviceContextProjectionV1,
} from '../../functions/src/brewerHopAdviceContextBinding.js';
import {
  BREWER_HOP_ADVICE_LOCAL_READING_RESPONSE_REFERENCE_V1,
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5,
  BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
  BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3,
  BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1,
  assertBrewerHopAdviceProposalEnvelopeV5,
  assertBrewerHopAdviceProposalV5MatchesSource,
  assertBrewerHopAdviceSourceViewMatchesArchiveV1,
  assertBrewerHopAdviceSourceViewV1,
  createBrewerHopAdviceProposalEnvelopeV5,
  createBrewerHopAdviceRequestV3,
  createBrewerHopAdviceSemanticSourcePropertyProjectionV3,
  createBrewerHopAdviceSourceViewV1,
  measureBrewerHopAdviceSemanticJsonWire,
  normalizeBrewerHopAdviceSemanticProposalV5,
  readBrewerHopAdviceProposalEnvelopeV5,
  readBrewerHopAdviceRequestV3,
  verifyBrewerHopAdviceSemanticEvidenceV5,
} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference.js';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';

// S06-R1 probe: every closed V2/V4 entry point the V3 module can reach is recorded, and fails while forbidden.
const legacy = vi.hoisted(() => ({
  forbidden: false,
  calls: [] as string[],
  entryPoints: ['validateBrewerHopAdviceRequest', 'createBrewerHopAdviceProposalEnvelope', 'assertBrewerHopAdviceProposalEnvelope',
    'normalizeBrewerHopAdviceProposal', 'verifyBrewerHopAdviceEvidence', 'brewerHopAdviceReaderCues'],
}));
vi.mock('../../functions/src/brewerHopAdviceProposal.js', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  const guard = (name: string) => (...args: unknown[]) => {
    legacy.calls.push(name);
    if (legacy.forbidden) throw new Error(`Entrée V2/V4 ${name} appelée par le parcours V5.`);
    return (original[name] as (...values: unknown[]) => unknown)(...args);
  };
  return { ...original, ...Object.fromEntries(legacy.entryPoints.map((name) => [name, guard(name)])) };
});

const sourceArchive = source4Fixture.sourceReadingArchive as any;

const withoutReference = (value: Record<string, unknown>) => {
  const { reference: _reference, ...body } = value;
  return body;
};
const viewReference = (view: any) => hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1, withoutReference(view));
const envelopeReference = (envelope: any) => hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, withoutReference(envelope));
const projectionReference = (projection: any) =>
  hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3, withoutReference(projection));

function requestFixture() {
  const ownerKey = sourceArchive.ownerKey as string;
  const workspaceId = sourceArchive.workspaceId as string;
  const scope = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, workspaceId, sourceArchive.source);
  const expected: BrewerHopAdviceContextProjectionV1 = {
    format: BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT,
    scope,
    source: { kind: 'app', id: scope.id, label: null, snapshotReference: null },
    journal: { state: 'absent', revision: { state: 'absent' }, contentReference: null, localOverlay: 'notPresent' },
    culture: { status: 'notReceived' },
    physicalAnchorReference: 'fixture:physical-anchor',
    catalogueDependencyReference: 'fixture:catalogue-dependencies',
    calculationDependencyReference: 'fixture:calculation-dependencies',
    runtimeDataRevision: null,
    stockAvailabilityReference: null,
  };
  const contextLaunch = {
    format: 'brewer-hop-advice-context-launch-v1' as const,
    ownerKey, workspaceId,
    sourceReadingReference: sourceArchive.contentReference,
    source: sourceArchive.source,
    sourceRuntimeReference: sourceArchive.runtimeReference,
    scope,
    expected,
  };
  const request = createBrewerHopAdviceRequestV3({ sourceArchive, contextLaunch });
  return { request, contextLaunch, expected };
}

function noRecipeContext(): BrewerContext {
  return {
    inventory: [], material: [], waterSources: [], phase: 'planning',
    now: Date.parse('2026-10-04T08:00:00.000Z'), provenance: ['Fixture sans recette.'],
  };
}

function v5Input(request: ReturnType<typeof createBrewerHopAdviceRequestV3>, expected: BrewerHopAdviceContextProjectionV1) {
  const context: BrewerContext = noRecipeContext();
  const prepared = prepareBrewingScenarioContext(context);
  const sourceProjection = createBrewerHopAdviceSemanticSourcePropertyProjectionV3({ request, prepared });
  const firstAnnotation = request.sourceView.semantic.annotations[0];
  const firstIntent = sourceProjection.propertyIntents[0];
  const { interpretationOrigin: _sourceProjectionOrigin, ...intentInput } = firstIntent;
  const { id: _oldId, ...intentBody } = intentInput;
  const propertyIntent = { ...intentBody, id: 'assist-property-intent' };
  const raw = {
    annotationReviews: [{ annotationId: firstAnnotation.id, verdict: 'revise', reason: 'Proposition à relire.' }],
    propertyIntentProposals: [{ proposalId: 'assist-property-proposal', kind: 'revise',
      sourceAnnotationIds: [firstAnnotation.id], intent: propertyIntent, motive: 'La même ligne peut recevoir une qualification PropertyV3.' }],
    semanticRevisionProposals: [{ proposalId: 'assist-semantic-revision', kind: 'revise', sourceAnnotationIds: [firstAnnotation.id],
      sourceSpans: [firstAnnotation.source], proposedFields: { sense: firstAnnotation.sense, term: firstAnnotation.term,
        requirement: firstAnnotation.requirement, direction: firstAnnotation.direction }, motive: 'Proposition séparée, sans éditer la source.' }],
    openQuestions: [], materials: [],
    answer: {
      summary: 'La lecture source reste consultable avant le choix.',
      readingNote: 'La source sémantique est gardée entière et sans adoption.',
      options: [{ id: 'assist-answer-option', kind: 'characterization', title: 'Conserver la lecture',
        rationale: 'La caractérisation reste une proposition documentaire.', conditions: [], tradeoffs: [],
        relatedIds: [firstAnnotation.id], evidenceIds: [] }],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [],
    },
  };
  const serverContext = { phase: 'planning', provenance: ['Fixture locale.'], loadedAt: context.now, binding: expected };
  return { context, prepared, sourceProjection, raw, serverContext };
}

describe('Contrat source4 / RequestV3 / ProposalV5', () => {
  it('projette la lecture complète, retire seulement response du wire et la rattache à l’archive locale', () => {
    const archive = structuredClone(sourceArchive);
    const view = createBrewerHopAdviceSourceViewV1(archive);
    const { request } = requestFixture();
    expect(view.format).toBe(BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1);
    expect(view.archiveIdentity).toEqual({
      archiveFormat: archive.format, id: archive.id, ownerKey: archive.ownerKey, workspaceId: archive.workspaceId,
      recordedAt: archive.recordedAt, source: archive.source, runtimeReference: archive.runtimeReference,
      contentReference: archive.contentReference,
    });
    const { format, response, ...readingWithoutResponse } = archive.reading;
    expect(response).toBeDefined();
    expect(view.semantic).toEqual({ sourceFormat: format, ...readingWithoutResponse });
    expect(view.semantic).not.toHaveProperty('response');
    expect(view.localDerivations.readingResponse).toEqual({ state: 'localOnly', path: 'reading.response',
      reference: hopAdviceContentReference(BREWER_HOP_ADVICE_LOCAL_READING_RESPONSE_REFERENCE_V1, response) });
    expect(view).not.toHaveProperty('branches');
    expect(view.programPreparation).toEqual(archive.programPreparation);
    assertBrewerHopAdviceSourceViewV1(view);
    expect(() => assertBrewerHopAdviceSourceViewMatchesArchiveV1(view, archive)).not.toThrow();
    expect(request.sourceView).toEqual(view);
    expect(request).not.toHaveProperty('sourceArchive');
    expect(readBrewerHopAdviceRequestV3(request).status).toBe('readOnly');
    const changedArchive = structuredClone(archive);
    changedArchive.reading.response = { ...changedArchive.reading.response, intent: { altered: true } };
    expect(() => assertBrewerHopAdviceSourceViewMatchesArchiveV1(view, changedArchive)).toThrow();
    const changedView = structuredClone(view);
    changedView.semantic.annotations[0].source.text += '!';
    expect(() => assertBrewerHopAdviceSourceViewV1(changedView)).toThrow();
    const wire = measureBrewerHopAdviceSemanticJsonWire(request);
    expect(wire.utf8Bytes).toBe(new TextEncoder().encode(JSON.stringify(request)).byteLength);
    expect(wire.maxDepth).toBeGreaterThan(3);
  });

  it('conserve les formats futurs bruts et refuse un mélange connu dans une enveloppe V5', () => {
    const { request } = requestFixture();
    const requestFutureView = structuredClone(request);
    requestFutureView.sourceView.format = 'hop-v55-source4-assistance-view-v9' as any;
    expect(readBrewerHopAdviceRequestV3(requestFutureView).status).toBe('unsupportedReadOnly');
    const semanticFuture = structuredClone(request);
    semanticFuture.sourceView.semantic.sourceFormat = 'hop-v55-question-semantic-reading-v9' as any;
    // The V1 view hash covers its future child: a stale hash is corruption, a recomputed one stays opaque.
    expect(readBrewerHopAdviceRequestV3(semanticFuture).status).toBe('invalid');
    semanticFuture.sourceView.reference = viewReference(semanticFuture.sourceView);
    expect(readBrewerHopAdviceRequestV3(semanticFuture).status).toBe('unsupportedReadOnly');

    const input = v5Input(request, request.contextLaunch.expected);
    const envelope = createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, evidence: [] });
    const mixed = structuredClone(envelope);
    mixed.requestSnapshot = { ...mixed.requestSnapshot, format: 'brewer-hop-advice-request-v2' } as any;
    expect(readBrewerHopAdviceProposalEnvelopeV5(mixed)).toMatchObject({ status: 'invalid' });
    const futureRequest = structuredClone(envelope);
    futureRequest.requestSnapshot = { ...futureRequest.requestSnapshot, format: 'brewer-hop-advice-request-v9' } as any;
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureRequest)).toMatchObject({ status: 'invalid' });
    futureRequest.reference = envelopeReference(futureRequest);
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureRequest)).toMatchObject({ status: 'unsupportedReadOnly' });
    const futureSource = structuredClone(envelope);
    futureSource.requestSnapshot.sourceView.format = 'hop-v55-source4-assistance-view-v9' as any;
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureSource)).toMatchObject({ status: 'invalid' });
    futureSource.reference = envelopeReference(futureSource);
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureSource)).toMatchObject({ status: 'unsupportedReadOnly' });
    expect(readBrewerHopAdviceProposalEnvelopeV5({ format: 'brewer-hop-advice-proposal-v9', payload: { intact: true } }))
      .toMatchObject({ status: 'unsupportedReadOnly', snapshot: { payload: { intact: true } } });
  });

  it('scelle une sourcePropertyProjection exacte, sépare les propositions et relit sans moteur ni archive complète', () => {
    const { request, contextLaunch } = requestFixture();
    const input = v5Input(request, contextLaunch.expected);
    const envelope = createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, evidence: [] });
    expect(envelope.format).toBe(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5);
    expect(envelope).not.toHaveProperty('propertyAdviceBaseline');
    expect(envelope.proposal.propertyIntentProposals[0]).toMatchObject({ provenance: 'proposal', qualificationStatus: 'pendingLocalQualification' });
    expect(envelope.proposal.semanticRevisionProposals[0]).toMatchObject({ provenance: 'proposal' });
    expect(envelope.proposal.semanticRevisionProposals[0]).not.toHaveProperty('origin');
    expect(envelope.requestSnapshot.sourceView).toEqual(request.sourceView);
    expect(envelope.evidence.dependencies).toEqual([]);
    expect(readBrewerHopAdviceProposalEnvelopeV5(envelope).status).toBe('readOnly');
    expect(() => assertBrewerHopAdviceProposalEnvelopeV5(envelope)).not.toThrow();
    expect(() => assertBrewerHopAdviceProposalV5MatchesSource(envelope, request)).not.toThrow();
    verifyBrewerHopAdviceSemanticEvidenceV5(envelope, []);

    const rawWithOrigin = structuredClone(input.raw) as any;
    rawWithOrigin.propertyIntentProposals[0].intent.interpretationOrigin = 'user';
    expect(() => createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, raw: rawWithOrigin, evidence: [] })).toThrow(/interpretationOrigin/);
    const rawWithFakeOrigin = structuredClone(input.raw) as any;
    rawWithFakeOrigin.semanticRevisionProposals[0].proposedFields.origin = 'brasseur';
    expect(() => createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, raw: rawWithFakeOrigin, evidence: [] }))
      .toThrow(/champs inconnus \(origin\)/);

    const mutated = structuredClone(envelope);
    mutated.sourcePropertyProjection.propertyIntents[0].label = 'terme fabriqué';
    const projectionBody = { format: mutated.sourcePropertyProjection.format,
      sourceReadingReference: mutated.sourcePropertyProjection.sourceReadingReference,
      propertyIntents: mutated.sourcePropertyProjection.propertyIntents };
    mutated.sourcePropertyProjection.reference = hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3, projectionBody);
    const { reference: _reference, ...body } = mutated;
    mutated.reference = hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, body);
    expect(readBrewerHopAdviceProposalEnvelopeV5(mutated).status).toBe('invalid');

    const staleRequest = structuredClone(request);
    staleRequest.sourceView.archiveIdentity.contentReference = 'different-source';
    expect(() => assertBrewerHopAdviceProposalV5MatchesSource(envelope, staleRequest)).toThrow();
  });

  it('S06-R1 : crée, normalise, relit et vérifie V5 sans RequestV2 ni entrée V2/V4', () => {
    const { request, contextLaunch } = requestFixture();
    const input = v5Input(request, contextLaunch.expected);
    legacy.calls.length = 0;
    legacy.forbidden = true;
    try {
      const envelope = createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, evidence: [] });
      expect(normalizeBrewerHopAdviceSemanticProposalV5(input.raw, request, input.sourceProjection, [], input.serverContext))
        .toEqual(envelope.proposal);
      expect(readBrewerHopAdviceProposalEnvelopeV5(JSON.parse(JSON.stringify(envelope))).status).toBe('readOnly');
      assertBrewerHopAdviceProposalEnvelopeV5(envelope);
      assertBrewerHopAdviceProposalV5MatchesSource(envelope, request);
      verifyBrewerHopAdviceSemanticEvidenceV5(envelope, []);
      expect(readBrewerHopAdviceRequestV3(request).status).toBe('readOnly');
    } finally {
      legacy.forbidden = false;
    }
    expect(legacy.calls).toEqual([]);
    // Control: the probe does sit on the V3 import path; the legacy dispatch still uses the strict V2 reader.
    expect(readBrewerHopAdviceRequestV3({ format: 'brewer-hop-advice-request-v2' }).status).toBe('invalid');
    expect(legacy.calls).toEqual(['validateBrewerHopAdviceRequest']);
  });

  it('S06-R1 : juge les gardes au sens source4, à la création comme à la relecture', () => {
    const { request, contextLaunch } = requestFixture();
    const input = v5Input(request, contextLaunch.expected);
    const annotations = request.sourceView.semantic.annotations;
    const guard = annotations.find((annotation) => annotation.sense === 'guard' || annotation.sense === 'exclusion');
    const objective = annotations.find((annotation) => annotation.sense !== 'guard' && annotation.sense !== 'exclusion');
    expect(guard).toBeDefined();
    expect(objective).toBeDefined();
    const withIntervention = (relatedIds: string[]) => {
      const raw = structuredClone(input.raw) as any;
      raw.answer.options = [{ id: 'assist-answer-option', kind: 'intervention', title: 'Ajuster sous condition',
        rationale: 'Une intervention reste conditionnelle à la lecture source.', conditions: ['Si la garde reste respectée.'],
        tradeoffs: [], relatedIds, evidenceIds: [] }];
      return raw;
    };
    expect(() => createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, raw: withIntervention([guard!.id]), evidence: [] }))
      .toThrow(/pas seulement une garde/);
    const accepted = createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, raw: withIntervention([guard!.id, objective!.id]), evidence: [] });
    expect(accepted.proposal.answer.options[0]).toMatchObject({ kind: 'intervention', relatedIds: [guard!.id, objective!.id] });

    const stored = structuredClone(accepted) as any;
    stored.proposal.answer.options[0].relatedIds = [guard!.id];
    stored.reference = envelopeReference(stored);
    expect(readBrewerHopAdviceProposalEnvelopeV5(stored))
      .toMatchObject({ status: 'invalid', reason: expect.stringMatching(/pas seulement une garde/) });
  });

  it('relit V5 dans le même espace d’IDs suggestion/réponse qu’à la création', () => {
    const { request, contextLaunch } = requestFixture();
    const input = v5Input(request, contextLaunch.expected);
    const raw = structuredClone(input.raw) as any;
    raw.answer.options[0].id = raw.semanticRevisionProposals[0].proposalId;
    expect(() => createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, raw, evidence: [] })).toThrow(/répété/);

    const stored = structuredClone(createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, evidence: [] })) as any;
    stored.proposal.answer.options[0].id = stored.proposal.semanticRevisionProposals[0].proposalId;
    stored.reference = envelopeReference(stored);
    expect(readBrewerHopAdviceProposalEnvelopeV5(stored)).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/répété/) });
  });

  it('S06-R2 : vérifie l’intégrité connue de RequestV3 avant de classer un enfant futur', () => {
    const { request } = requestFixture();
    const futureView = structuredClone(request) as any;
    futureView.sourceView = { ...futureView.sourceView, format: 'hop-v55-source4-assistance-view-v9', futureField: { keep: true } };
    expect(readBrewerHopAdviceRequestV3(futureView)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureView });
    const detached = structuredClone(futureView);
    detached.sourceReadingReference = `hop-v55-decision-reading-v4:sha256:${'0'.repeat(64)}`;
    expect(readBrewerHopAdviceRequestV3(detached).status).toBe('invalid');
    const launchWithoutExpected = structuredClone(futureView);
    delete launchWithoutExpected.contextLaunch.expected;
    expect(readBrewerHopAdviceRequestV3(launchWithoutExpected).status).toBe('invalid');
    expect(readBrewerHopAdviceRequestV3({ ...structuredClone(futureView), unknownOuterKey: true }).status).toBe('invalid');

    const futureSemantic = structuredClone(request) as any;
    futureSemantic.sourceView.semantic = { sourceFormat: 'hop-v55-question-semantic-reading-v9', opaque: { kept: true } };
    futureSemantic.sourceView.reference = viewReference(futureSemantic.sourceView);
    expect(readBrewerHopAdviceRequestV3(futureSemantic)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureSemantic });
    const divergentIdentity = structuredClone(futureSemantic);
    divergentIdentity.sourceView.archiveIdentity.runtimeReference = 'runtime:autre-source';
    divergentIdentity.sourceView.reference = viewReference(divergentIdentity.sourceView);
    expect(readBrewerHopAdviceRequestV3(divergentIdentity).status).toBe('invalid');
    const badDerivation = structuredClone(futureSemantic);
    badDerivation.sourceView.localDerivations = { readingResponse: { state: 'inline', payload: {} } };
    badDerivation.sourceView.reference = viewReference(badDerivation.sourceView);
    expect(readBrewerHopAdviceRequestV3(badDerivation).status).toBe('invalid');

    const futureArchive = structuredClone(request) as any;
    futureArchive.sourceView.archiveIdentity.archiveFormat = 'hop-v55-decision-reading-v9';
    futureArchive.sourceView.reference = viewReference(futureArchive.sourceView);
    expect(readBrewerHopAdviceRequestV3(futureArchive)).toMatchObject({ status: 'unsupportedReadOnly' });
    const otherQuestion = structuredClone(futureArchive);
    otherQuestion.question = 'Une autre question exacte.';
    expect(readBrewerHopAdviceRequestV3(otherQuestion).status).toBe('invalid');
    const notANamespace = structuredClone(request) as any;
    notANamespace.sourceView.archiveIdentity.archiveFormat = 'decision-reading-v9';
    notANamespace.sourceView.reference = viewReference(notANamespace.sourceView);
    expect(readBrewerHopAdviceRequestV3(notANamespace).status).toBe('invalid');
  });

  it('S06-R2 : vérifie l’enveloppe V5 connue avant de classer une request imbriquée future', () => {
    const { request, contextLaunch } = requestFixture();
    const input = v5Input(request, contextLaunch.expected);
    const envelope = createBrewerHopAdviceProposalEnvelopeV5({ request, ...input, evidence: [] });
    const withFutureView = () => {
      const value = structuredClone(envelope) as any;
      value.requestSnapshot.sourceView = { ...value.requestSnapshot.sourceView, format: 'hop-v55-source4-assistance-view-v9', futureField: { keep: true } };
      value.reference = envelopeReference(value);
      return value;
    };
    const intact = withFutureView();
    expect(readBrewerHopAdviceProposalEnvelopeV5(intact)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: intact });
    const alteredReference = withFutureView();
    alteredReference.proposal.answer.summary = 'Réponse modifiée après scellement.';
    expect(readBrewerHopAdviceProposalEnvelopeV5(alteredReference)).toMatchObject({ status: 'invalid' });

    const badContext = withFutureView();
    badContext.serverContext.loadedAt = 'hier';
    badContext.reference = envelopeReference(badContext);
    expect(readBrewerHopAdviceProposalEnvelopeV5(badContext)).toMatchObject({ status: 'invalid' });
    const badEvidence = withFutureView();
    badEvidence.evidence.records = [{ id: 'E-absent', tool: 'lookup_hop_reference', label: 'Absent', kind: 'reference' }];
    badEvidence.reference = envelopeReference(badEvidence);
    expect(readBrewerHopAdviceProposalEnvelopeV5(badEvidence)).toMatchObject({ status: 'invalid' });
    const detachedProjection = withFutureView();
    detachedProjection.sourcePropertyProjection.sourceReadingReference = 'autre-lecture';
    detachedProjection.sourcePropertyProjection.reference = projectionReference(detachedProjection.sourcePropertyProjection);
    detachedProjection.reference = envelopeReference(detachedProjection);
    expect(readBrewerHopAdviceProposalEnvelopeV5(detachedProjection)).toMatchObject({ status: 'invalid' });
    const detachedLaunch = withFutureView();
    detachedLaunch.requestSnapshot.sourceReadingReference = `hop-v55-decision-reading-v4:sha256:${'0'.repeat(64)}`;
    detachedLaunch.reference = envelopeReference(detachedLaunch);
    expect(readBrewerHopAdviceProposalEnvelopeV5(detachedLaunch)).toMatchObject({ status: 'invalid' });

    const futureRequest = structuredClone(envelope) as any;
    futureRequest.requestSnapshot = { format: 'brewer-hop-advice-request-v9', opaque: { kept: true } };
    futureRequest.reference = envelopeReference(futureRequest);
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureRequest)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureRequest });
    const futureRequestBadKeys = structuredClone(futureRequest);
    futureRequestBadKeys.proposal = { ...futureRequestBadKeys.proposal, adoptedAnnotations: [] };
    futureRequestBadKeys.reference = envelopeReference(futureRequestBadKeys);
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureRequestBadKeys)).toMatchObject({ status: 'invalid' });

    // An archive version may be opaque while the semantic V1 reading and its
    // derived projection/proposal/provider input remain fully checkable.
    const futureArchive = structuredClone(envelope) as any;
    futureArchive.requestSnapshot.sourceView.archiveIdentity.archiveFormat = 'hop-v55-decision-reading-v9';
    futureArchive.requestSnapshot.sourceView.reference = viewReference(futureArchive.requestSnapshot.sourceView);
    futureArchive.reference = envelopeReference(futureArchive);
    expect(readBrewerHopAdviceProposalEnvelopeV5(futureArchive)).toMatchObject({ status: 'unsupportedReadOnly' });
    const detachedIntent = structuredClone(futureArchive);
    detachedIntent.sourcePropertyProjection.propertyIntents[0].id = 'annotation-absente';
    detachedIntent.sourcePropertyProjection.reference = projectionReference(detachedIntent.sourcePropertyProjection);
    detachedIntent.reference = envelopeReference(detachedIntent);
    expect(readBrewerHopAdviceProposalEnvelopeV5(detachedIntent)).toMatchObject({ status: 'invalid' });
    const malformedReviews = structuredClone(futureArchive);
    malformedReviews.proposal.annotationReviews = 'not-an-array';
    malformedReviews.reference = envelopeReference(malformedReviews);
    expect(readBrewerHopAdviceProposalEnvelopeV5(malformedReviews)).toMatchObject({ status: 'invalid' });
    const detachedProvider = structuredClone(futureArchive);
    detachedProvider.providerInputReference = `brewer-hop-advice-provider-input-v3:sha256:${'0'.repeat(64)}`;
    detachedProvider.reference = envelopeReference(detachedProvider);
    expect(readBrewerHopAdviceProposalEnvelopeV5(detachedProvider)).toMatchObject({ status: 'invalid' });
  });
});
