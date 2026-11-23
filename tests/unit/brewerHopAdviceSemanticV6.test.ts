import { describe, expect, it } from 'vitest';
import source4Fixture from '../fixtures/source4-contract-fixture.json';
import type { BrewerContext } from '../../functions/src/companionTypes.js';
import {
  BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT,
  mapBrewerHopAdviceLaunchSourceToScopeV1,
  type BrewerHopAdviceContextProjectionV1,
} from '../../functions/src/brewerHopAdviceContextBinding.js';
import {
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5,
  createBrewerHopAdviceProposalEnvelopeV5,
  createBrewerHopAdviceRequestV3,
  readBrewerHopAdviceProposalEnvelopeV5,
} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import {
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6,
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V6,
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6,
  assertBrewerHopAdviceProposalV6MatchesSource,
  createBrewerHopAdviceProposalEnvelopeV6,
  readBrewerHopAdviceProposalEnvelopeV6,
  verifyBrewerHopAdviceSemanticEvidenceV6,
} from '../../functions/src/brewerHopAdviceSemanticV6.js';
import { resolveBrewerHopAdvicePredictionContribution } from '../../functions/src/brewerHopAdvicePredictionEvidence.js';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference.js';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';

const sourceArchive = source4Fixture.sourceReadingArchive as any;
const withoutReference = (value: Record<string, unknown>) => {
  const { reference: _reference, ...body } = value;
  return body;
};
const v6Reference = (envelope: any) => hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, withoutReference(envelope));

const E1 = { id: 'E1', name: 'lookup_style_reference', label: 'Fiche de style', facts: ['Référence documentaire.'], limits: [], data: { style: 'fixture-style' } };
const E2 = { id: 'E2', name: 'predict_hop_aroma', label: 'Prédiction non qualifiable', facts: [], limits: [], data: { unqualified: true } };
const E3 = { id: 'E3', name: 'lookup_style_reference', label: 'Autre fiche', facts: [], limits: [], data: { style: 'other-style' } };
const predictionSource = { title: 'Paramètre logiciel', author: 'Fixture locale', year: 2026, kind: 'research' as const,
  reference: 'fixture:prediction-model-v1', locator: 'sortie synthétique' };
const estimate = (range: { min: number; max: number } | null = { min: 20, max: 30 }) => ({
  range, confidence: range ? 'medium' as const : 'low' as const,
  sources: range ? [structuredClone(predictionSource)] : [], reasons: range ? ['repère de fixture'] : ['valeur inconnue'],
});
function computedPrediction() {
  return {
    triplet: { varietyId: 'variety:cascade', lotId: null, yeastId: 'yeast:ale', timing: 'boil', doseGL: 1.5,
      temperatureC: null, contactHours: null, matrixId: null },
    profile: { citrus: estimate({ min: 10, max: 20 }) }, compounds: { '4mmpFree': estimate(null) },
    score: estimate({ min: 35, max: 45 }), risks: [], modelRefs: [{ id: 'model:fixture', version: '4' }],
    reasons: ['limite de la fixture'],
  };
}

function requestFixture() {
  const ownerKey = sourceArchive.ownerKey as string;
  const workspaceId = sourceArchive.workspaceId as string;
  const scope = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, workspaceId, sourceArchive.source);
  const expected: BrewerHopAdviceContextProjectionV1 = {
    format: BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT, scope,
    source: { kind: 'app', id: scope.id, label: null, snapshotReference: null },
    journal: { state: 'absent', revision: { state: 'absent' }, contentReference: null, localOverlay: 'notPresent' },
    culture: { status: 'notReceived' },
    physicalAnchorReference: 'fixture:physical-anchor', catalogueDependencyReference: 'fixture:catalogue-dependencies',
    calculationDependencyReference: 'fixture:calculation-dependencies', runtimeDataRevision: null, stockAvailabilityReference: null,
  };
  const contextLaunch = {
    format: 'brewer-hop-advice-context-launch-v1' as const, ownerKey, workspaceId,
    sourceReadingReference: sourceArchive.contentReference, source: sourceArchive.source,
    sourceRuntimeReference: sourceArchive.runtimeReference, scope, expected,
  };
  return { request: createBrewerHopAdviceRequestV3({ sourceArchive, contextLaunch }), expected };
}

function fixture() {
  const { request, expected } = requestFixture();
  const context: BrewerContext = { inventory: [], material: [], waterSources: [], phase: 'planning',
    now: Date.parse('2026-10-04T08:00:00.000Z'), provenance: ['Fixture sans recette.'] };
  const prepared = prepareBrewingScenarioContext(context);
  const annotations = request.sourceView.semantic.annotations;
  const anchor = annotations[0].source;
  const addIntent = {
    id: 'assist-added-intent', property: 'aroma', label: anchor.text, role: 'preference', direction: null, qualification: null,
    required: false, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [anchor], basis: 'Piste suggérée, à confirmer par le brasseur.', relatedIntentIds: [],
  };
  const raw = {
    annotationReviews: [], semanticRevisionProposals: [],
    propertyIntentProposals: [{ proposalId: 'assist-add-proposal', kind: 'add', sourceAnnotationIds: [], intent: addIntent,
      motive: 'Une lecture complémentaire de ce fragment.' }],
    openQuestions: [], materials: [],
    answer: {
      summary: 'Une piste reste à confirmer.', readingNote: 'La lecture source est conservée; la suggestion reste séparée.',
      options: [
        { id: 'assist-option-documented', kind: 'investigation', title: 'Documenter la piste', rationale: 'La fiche et l’exploration restent des références.',
          conditions: [], tradeoffs: [], relatedIds: [annotations[0].id], evidenceIds: ['E1', 'E2'] },
        { id: 'assist-option-other', kind: 'characterization', title: 'Autre lecture', rationale: 'Une autre référence documentaire.',
          conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: ['E3'] },
      ],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [],
    },
    optionProposalLinks: [{ optionId: 'assist-option-documented', proposalId: 'assist-add-proposal', evidenceIds: ['E1', 'E2'] }],
  };
  const serverContext = { phase: 'planning', provenance: ['Fixture locale.'], loadedAt: context.now, binding: expected };
  return { request, prepared, raw, serverContext, evidence: [E1, E2, E3], annotations };
}

const create = (f: ReturnType<typeof fixture>, raw: unknown = f.raw, evidence: any[] = f.evidence) =>
  createBrewerHopAdviceProposalEnvelopeV6({ request: f.request, prepared: f.prepared, raw, evidence, serverContext: f.serverContext });
const withRaw = (f: ReturnType<typeof fixture>, edit: (raw: any) => void) => { const raw = structuredClone(f.raw) as any; edit(raw); return raw; };
function withFutureSourceView(envelope: any) {
  const body = { format: 'hop-v55-source4-assistance-view-v99', opaquePayload: { future: true, values: [1, 'keep', { exact: true }] } };
  const sourceView = { ...body, reference: hopAdviceContentReference(body.format, body) };
  const result = structuredClone(envelope);
  result.requestSnapshot.sourceView = sourceView;
  result.reference = v6Reference(result);
  return { envelope: result, sourceView };
}

describe('Sortie sémantique V6 : liens option → proposition → preuves', () => {
  it('déclare un finish V6 distinct sans modifier V5', () => {
    expect(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V6.name).toBe(BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6);
    expect(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V6.parameters.required).toContain('optionProposalLinks');
    expect(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.parameters.required).not.toContain('optionProposalLinks');
    expect(Object.keys(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.parameters.properties)).not.toContain('optionProposalLinks');
  });

  it('scelle un lien vers un ajout et ses preuves typées, relisible et vérifiable sans adoption', () => {
    const f = fixture();
    const sourceBefore = structuredClone(f.request.sourceView);
    const envelope = create(f);
    expect(envelope.format).toBe(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6);
    expect(envelope.proposal.optionProposalLinks).toEqual(f.raw.optionProposalLinks);
    const option = envelope.proposal.answer.options[0];
    // The prediction stays a derived exploration without qualification; the link does not upgrade it.
    expect(option.evidenceIds).toEqual(['E1']);
    expect(option.exploration).toMatchObject([{ evidenceId: 'E2', reason: 'payloadUnqualified' }]);
    expect(option.computed).toBeUndefined();
    expect(envelope.proposal.propertyIntentProposals[0]).toMatchObject({ provenance: 'proposal', qualificationStatus: 'pendingLocalQualification',
      intent: { interpretationOrigin: 'proposal' } });
    expect(envelope.requestSnapshot.sourceView).toEqual(sourceBefore);
    expect(envelope.sourcePropertyProjection.propertyIntents.map((intent) => intent.id)).toEqual(f.annotations.map((row) => row.id));
    const read = readBrewerHopAdviceProposalEnvelopeV6(JSON.parse(JSON.stringify(envelope)));
    expect(read.status).toBe('readOnly');
    expect(() => verifyBrewerHopAdviceSemanticEvidenceV6(envelope, f.evidence)).not.toThrow();
    expect(() => verifyBrewerHopAdviceSemanticEvidenceV6(envelope, [E1, { ...E2, data: { unqualified: false } }, E3])).toThrow();
    expect(() => assertBrewerHopAdviceProposalV6MatchesSource(envelope, f.request)).not.toThrow();
    // An older strict V5 reader keeps V6 raw and read-only; it never converts it.
    expect(readBrewerHopAdviceProposalEnvelopeV5(envelope)).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('lie une preuve calculée seule au sélecteur exact, sans accepter une exploration libre du modèle', () => {
    const f = fixture();
    const evidence = [E1, { ...E2, data: [computedPrediction()] }, E3];
    const raw = withRaw(f, (value) => {
      value.answer.options[0] = { ...value.answer.options[0], kind: 'characterization', evidenceIds: [],
        computed: { evidenceId: 'E2', predictionSelection: { kind: 'alternative', index: 0 } } };
      value.optionProposalLinks[0].evidenceIds = ['E2'];
    });
    const envelope = create(f, raw, evidence);
    const option = envelope.proposal.answer.options[0];
    expect(option.evidenceIds).toEqual([]);
    expect(option.computed).toMatchObject({ evidenceId: 'E2', predictionSelection: { kind: 'alternative', index: 0 } });
    if (!option.computed || !('predictionSelection' in option.computed)) throw new Error('Sélecteur calculé attendu.');
    const record = envelope.evidence.records.find((row) => row.id === 'E2');
    if (!record || record.kind !== 'prediction') throw new Error('Snapshot de prédiction attendu.');
    expect(option.computed.predictionSelection.reference).toBe(record.snapshot.reference);
    expect(resolveBrewerHopAdvicePredictionContribution(record.snapshot, option.computed.predictionSelection)).toMatchObject({
      kind: 'alternative', prediction: computedPrediction(),
    });
    expect(envelope.proposal.optionProposalLinks).toEqual([{ optionId: option.id, proposalId: 'assist-add-proposal', evidenceIds: ['E2'] }]);
    expect(readBrewerHopAdviceProposalEnvelopeV6(envelope).status).toBe('readOnly');

    const freeExploration = withRaw(f, (value) => {
      value.answer.options[0] = { ...value.answer.options[0], evidenceIds: [],
        computed: { evidenceId: 'E2', predictionSelection: { kind: 'alternative', index: 0 } },
        exploration: [{ evidenceId: 'E2', reason: 'payloadUnqualified', note: 'Exploration inventée.' }] };
      value.optionProposalLinks[0].evidenceIds = ['E2'];
    });
    expect(() => create(f, freeExploration, evidence)).toThrow();

    const foreignEvidence = withRaw(f, (value) => {
      value.answer.options[0] = { ...value.answer.options[0], kind: 'characterization', evidenceIds: [],
        computed: { evidenceId: 'E2', predictionSelection: { kind: 'alternative', index: 0 } } };
      value.optionProposalLinks[0].evidenceIds = ['E3'];
    });
    expect(() => create(f, foreignEvidence, evidence)).toThrow(/absente des preuves typées/);
  });

  it('garde une SourceView future brute en lecture seule mais refuse les liens V6 connus altérés et resealés', () => {
    const f = fixture();
    const { envelope: futureEnvelope, sourceView } = withFutureSourceView(create(f));
    const read = readBrewerHopAdviceProposalEnvelopeV6(futureEnvelope);
    expect(read).toMatchObject({ status: 'unsupportedReadOnly', snapshot: { requestSnapshot: { sourceView } } });

    const mutations: Array<[string, (value: any) => void]> = [
      ['option étrangère', (value) => { value.proposal.optionProposalLinks[0].optionId = 'assist-option-absent'; }],
      ['proposition étrangère', (value) => { value.proposal.optionProposalLinks[0].proposalId = 'assist-proposal-absent'; }],
      ['preuve d’une autre option', (value) => { value.proposal.optionProposalLinks[0].evidenceIds = ['E3']; }],
    ];
    for (const [label, mutate] of mutations) {
      const corrupt = structuredClone(futureEnvelope) as any;
      mutate(corrupt);
      corrupt.reference = v6Reference(corrupt);
      expect(readBrewerHopAdviceProposalEnvelopeV6(corrupt), label).toMatchObject({ status: 'invalid' });
    }
  });

  it('refuse les liens absents, dupliqués, étrangers ou à preuve hors de l’option', () => {
    const f = fixture();
    const cases: Array<[string, (raw: any) => void, RegExp]> = [
      ['option absente', (raw) => { raw.optionProposalLinks[0].optionId = 'assist-option-missing'; }, /option absente/],
      ['proposition absente', (raw) => { raw.optionProposalLinks[0].proposalId = 'assist-proposal-missing'; }, /proposition absente/],
      ['intent.id au lieu du proposalId', (raw) => { raw.optionProposalLinks[0].proposalId = 'assist-added-intent'; }, /intent\.id/],
      ['paire dupliquée', (raw) => { raw.optionProposalLinks.push(structuredClone(raw.optionProposalLinks[0])); }, /répète la paire/],
      ['preuve d’une autre option', (raw) => { raw.optionProposalLinks[0].evidenceIds = ['E3']; }, /absente des preuves typées/],
      ['preuve du tour non citée', (raw) => { raw.optionProposalLinks[0].evidenceIds = ['E9']; }, /absente des preuves typées/],
      ['preuve répétée', (raw) => { raw.optionProposalLinks[0].evidenceIds = ['E1', 'E1']; }, /répète une preuve/],
      ['acteur fourni par le modèle', (raw) => { raw.optionProposalLinks[0].actor = { origin: 'user', label: 'Brasseur' }; }, /champs inconnus/],
      ['proposalId dans relatedIds', (raw) => { raw.answer.options[0].relatedIds = ['assist-add-proposal']; }, /référence inconnue/],
      ['liens absents du finish', (raw) => { delete raw.optionProposalLinks; }, /optionProposalLinks/],
    ];
    for (const [label, edit, message] of cases) {
      expect(() => create(f, withRaw(f, edit)), label).toThrow(message);
    }
    // An empty evidence list is an explicit uncomputed hypothesis, not a computed proof.
    const hypothesis = create(f, withRaw(f, (raw) => { raw.optionProposalLinks[0].evidenceIds = []; }));
    expect(hypothesis.proposal.optionProposalLinks[0].evidenceIds).toEqual([]);
    expect(hypothesis.proposal.answer.options[0].computed).toBeUndefined();
  });

  it('ne laisse pas un lien contourner « garder n’est pas ajouter »', () => {
    const f = fixture();
    const guard = f.annotations.find((row) => row.sense === 'guard' || row.sense === 'exclusion');
    expect(guard).toBeDefined();
    const raw = withRaw(f, (value) => {
      value.answer.options[0] = { ...value.answer.options[0], kind: 'intervention', relatedIds: [guard!.id], conditions: ['Si la garde reste respectée.'] };
    });
    expect(() => create(f, raw)).toThrow(/pas seulement une garde/);
  });

  it('refuse un lien altéré sous une nouvelle empreinte et garde les formats historiques ou futurs', () => {
    const f = fixture();
    const envelope = create(f);
    const tampered = structuredClone(envelope) as any;
    tampered.proposal.optionProposalLinks[0].evidenceIds = ['E3'];
    tampered.reference = v6Reference(tampered);
    expect(readBrewerHopAdviceProposalEnvelopeV6(tampered)).toMatchObject({ status: 'invalid' });

    const v5Raw = withRaw(f, (raw) => { delete raw.optionProposalLinks; });
    const v5 = createBrewerHopAdviceProposalEnvelopeV5({ request: f.request, prepared: f.prepared, raw: v5Raw, evidence: f.evidence, serverContext: f.serverContext });
    const legacy = readBrewerHopAdviceProposalEnvelopeV6(v5);
    expect(legacy).toMatchObject({ status: 'legacyReadOnly', version: 'v5' });
    if (legacy.status === 'legacyReadOnly' && legacy.version === 'v5') expect(legacy.envelope.proposal).not.toHaveProperty('optionProposalLinks');
    expect(() => createBrewerHopAdviceProposalEnvelopeV5({ request: f.request, prepared: f.prepared, raw: f.raw,
      evidence: f.evidence, serverContext: f.serverContext })).toThrow(/champs inconnus \(optionProposalLinks\)/);
    expect(readBrewerHopAdviceProposalEnvelopeV6({ format: 'brewer-hop-advice-proposal-v7', opaque: { kept: true } }))
      .toMatchObject({ status: 'unsupportedReadOnly', snapshot: { opaque: { kept: true } } });
  });
});
