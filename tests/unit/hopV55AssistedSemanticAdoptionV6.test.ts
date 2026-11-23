import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { resolveHopV55AdoptedContext, type HopV55AdoptedContextBindingV1 } from '../../src/services/hopV55/adoptedContextResolution';
import { adoptHopV55ReferenceHypothesis, getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import { hopV55Workspace } from '../fixtures/hopV55';
import { prepareHopV55SemanticAssistedAdviceLaunchV1 } from '../../src/services/hopV55/assistedSemanticAdviceContextV4';
import { receiveHopV55AssistedSemanticAdviceProposalV6 } from '../../src/services/hopV55/assistedSemanticAdviceV6';
import {
  HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT,
  confirmHopV55SemanticAdoptionV1,
  hopV55SemanticAdoptionFingerprintV1,
  prepareHopV55SemanticAdoptionPlanV1,
  readHopV55SemanticAdoptionPlanV1,
  resolveHopV55SemanticAdoptionReplayV1,
  type HopV55SemanticAdoptionPrincipalV1,
  type HopV55SemanticAdoptionTicketV1,
} from '../../src/services/hopV55/assistedSemanticAdviceAdoptionV6';
import { prepareCorrectionV4, prepareInitialPropertyAdviceV4 } from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { createHopV55PropertyAdviceAnswerRecordV4, HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { createBrewerHopAdviceProposalEnvelopeV5, brewerHopAdviceRequestV3Reference } from '../../functions/src/brewerHopAdviceSemanticV3';
import { createBrewerHopAdviceProposalEnvelopeV6 } from '../../functions/src/brewerHopAdviceSemanticV6';
import {
  createHopV55DecisionReadingArchiveV4,
  prepareHopV55PropertyAdviceFromSemanticReadingV1,
  readHopV55QuestionSemanticV1,
} from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';

const ownerKey = 'owner:semantic-adoption-v6-fixture';
const workspaceId = 'workspace:semantic-adoption-v6-fixture';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie pour cette adoption.' };
const question = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const recordedAt = '2026-10-04T09:40:00.000Z';
const E1 = { id: 'E1', name: 'lookup_style_reference', label: 'Fiche de style', facts: ['Référence documentaire.'], limits: [], data: { style: 'fixture-style' } };

function setup(questionText = question, workspaceOverride?: HopV55Workspace) {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const recipeId = context.recipe?.id;
  if (!recipeId) throw new Error('La fixture planning doit fournir une recette synthétique.');
  const reading = readHopV55QuestionSemanticV1(questionText, prepared);
  const archive = createHopV55DecisionReadingArchiveV4({ id: 'reading:semantic-adoption-v6', ownerKey, workspaceId, recordedAt,
    reading, source: { kind: 'recipe', id: recipeId }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const scope = { kind: 'recipe' as const, id: recipeId };
  const workspace: HopV55Workspace = workspaceOverride ?? { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Fixture adoption V6', intent: { question: questionText, criteria: [] }, sourceRecipeId: recipeId,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt };
  const page = { archive, workspace, ownerKey, workspaceId, scopeAtPageLaunch: scope, context };
  const launched = prepareHopV55SemanticAssistedAdviceLaunchV1(page);
  if (launched.status !== 'ready') throw new Error(`Lancement fixture refusé : ${JSON.stringify(launched)}`);
  return { context, prepared, reading, archive, scope, workspace, page, request: launched.request };
}

function addIntent(text: string, id = 'assist-added-intent', questionText = question) {
  const start = questionText.indexOf(text);
  if (start < 0) throw new Error(`Fragment absent : ${text}`);
  return { id, property: 'aroma', label: text, role: 'preference', direction: null, qualification: null, required: false,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [{ start, end: start + text.length, text }], basis: 'Piste suggérée, à confirmer.', relatedIntentIds: [] };
}

function rawV6(s: ReturnType<typeof setup>) {
  const first = s.request.sourceView.semantic.annotations[0];
  return {
    annotationReviews: [],
      propertyIntentProposals: [{ proposalId: 'assist-add-proposal', kind: 'add', sourceAnnotationIds: [],
      intent: addIntent('odeur résineuse', 'assist-added-intent', s.reading.intent.question),
      motive: 'Lecture aromatique complémentaire du fragment cité.' }],
    semanticRevisionProposals: [{ proposalId: 'assist-semantic-revision', kind: 'revise', sourceAnnotationIds: [first.id],
      sourceSpans: [first.source], proposedFields: { sense: first.sense, term: first.term, requirement: first.requirement, direction: first.direction },
      motive: 'Révision de lecture source, séparée.' }],
    openQuestions: [], materials: [],
    answer: {
      summary: 'Une piste aromatique reste à confirmer.', readingNote: 'La lecture source est conservée; la suggestion reste séparée.',
      options: [
        { id: 'assist-option-documented', kind: 'investigation', title: 'Documenter la piste', rationale: 'La fiche reste une référence documentaire.',
          conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: ['E1'] },
        { id: 'assist-option-other', kind: 'characterization', title: 'Caractériser', rationale: 'Sans lien avec la suggestion.',
          conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [] },
      ],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [],
    },
    optionProposalLinks: [
      { optionId: 'assist-option-documented', proposalId: 'assist-add-proposal', evidenceIds: ['E1'] },
      { optionId: 'assist-option-documented', proposalId: 'assist-semantic-revision', evidenceIds: [] },
    ],
  };
}

function scenario(questionText = question, workspaceOverride?: HopV55Workspace, cultureBinding: HopV55AdoptedContextBindingV1 | null = null) {
  const s = setup(questionText, workspaceOverride);
  const envelope = createBrewerHopAdviceProposalEnvelopeV6({ request: s.request, prepared: s.prepared, raw: rawV6(s), evidence: [E1],
    serverContext: { phase: s.context.phase, provenance: [...s.context.provenance], loadedAt: s.context.now,
      binding: structuredClone(s.request.contextLaunch.expected) } });
  const principal: HopV55SemanticAdoptionPrincipalV1 = { principalId: 'principal:fixture', ownerKey, workspaceId, scope: s.scope, label: 'Brasseur' };
  const ticket: HopV55SemanticAdoptionTicketV1 = { ticketId: 'ticket:fixture', operationId: 'operation:fixture-0001', generation: 0,
    ownerKey, workspaceId, scope: s.scope, requestReference: brewerHopAdviceRequestV3Reference(s.request) };
  const turn = { envelope, request: s.request, sourceArchive: s.archive, turnEvidence: [E1], current: s.page };
  const planInput = { ...turn, principal, ticket,
    selection: [{ optionId: 'assist-option-documented', proposalId: 'assist-add-proposal', reason: 'Je retiens cette piste aromatique.' }],
    head: { kind: 'none' as const }, commandId: 'command:adoption-0001', recordId: 'property-answer-v4:adoption-0001',
    requestId: 'property-request-v4:adoption-0001', reason: 'Confirmation explicite de la suggestion liée.', candidatePolicy,
    cultureBinding, previewedAt: '2026-10-04T10:00:00.000Z' };
  return { s, envelope, principal, ticket, turn, planInput, cultureBinding };
}

function adoptedWorkspace(s: ReturnType<typeof setup>, version: number): HopV55Workspace {
  const template = hopV55Workspace(ownerKey, workspaceId).referenceHypotheses[0];
  if (!template) throw new Error('Une hypothèse NR de fixture réelle est requise.');
  return adoptHopV55ReferenceHypothesis(s.workspace, {
    ...structuredClone(template), id: 'nr-adoption-v6-fixture', version,
    label: `Référence NR de fixture ${version}`, recordedAt: `2026-10-04T09:${String(40 + version).padStart(2, '0')}:00.000Z`,
  }, s.context, s.prepared, { referenceVersion: String(version) });
}

function currentAdoptedBinding(workspace: HopV55Workspace): HopV55AdoptedContextBindingV1 {
  const projection = getHopV55ReferenceProjection(workspace);
  if (!projection?.currentReference) throw new Error('La fixture NR doit avoir une référence actuelle.');
  const resolved = resolveHopV55AdoptedContext({ workspace, expected: projection.currentReference });
  if (resolved.status !== 'resolved') throw new Error(`Binding NR de fixture non résolu : ${resolved.status}.`);
  return resolved.binding;
}

function createParentV3(s: ReturnType<typeof setup>) {
  const draft = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: s.archive.reading, prepared: s.prepared,
    requestId: 'property-request-v3-parent', ownerKey, workspaceId,
    sourceReadingReference: s.archive.contentReference, candidatePolicy });
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestSnapshot);
  return createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared: s.prepared, answerSnapshot,
    answerRecordId: 'property-answer-v3-parent' });
}

function createParentV4(s: ReturnType<typeof setup>) {
  const draft = prepareInitialPropertyAdviceV4({ sourceReadingArchive: s.archive, ownerKey, workspaceId,
    prepared: s.prepared, recordId: 'property-answer-v4-parent', requestId: 'property-request-v4-parent',
    candidatePolicy, cultureBinding: null,
    transition: { actId: 'act:property-answer-v4-parent', kind: 'create', reason: 'Création de la tête de fixture.',
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-04T09:55:00.000Z' }, additions: [] });
  if (draft.status !== 'ready') throw new Error(`Tête V4 de fixture refusée : ${JSON.stringify(draft)}`);
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestDraftV3.requestSnapshot);
  return createHopV55PropertyAdviceAnswerRecordV4({ draft: draft.recordDraft, outcome: { kind: 'domainAnswer',
    requestDraftReference: draft.requestDraftV3.reference, answerSnapshot, answerReference: answerSnapshot.reference } });
}

function readyPlan(x: ReturnType<typeof scenario>) {
  const prepared = prepareHopV55SemanticAdoptionPlanV1(x.planInput);
  if (prepared.status !== 'ready') throw new Error(`Plan refusé : ${JSON.stringify(prepared)}`);
  return prepared;
}

const confirmInput = (x: ReturnType<typeof scenario>, plan: unknown) => ({ ...x.turn, plan, principal: x.principal, ticket: x.ticket,
  head: { kind: 'none' as const }, cultureBinding: x.cultureBinding, effectiveAt: '2026-10-04T10:01:00.000Z' });

describe('Adoption corrigible V6 → ledger de conseil V4', () => {
  it('reçoit V6 avec ses liens et garde V5 lisible sans liens reconstitués', () => {
    const x = scenario();
    const received = receiveHopV55AssistedSemanticAdviceProposalV6({ ...x.turn, candidatePolicy, baselineRequestId: 'baseline:adoption' });
    expect(received.status).toBe('readOnly');
    if (received.status === 'readOnly') expect(received.optionProposalLinks).toHaveLength(2);
    const { optionProposalLinks: _links, ...v5Raw } = rawV6(x.s);
    const v5 = createBrewerHopAdviceProposalEnvelopeV5({ request: x.s.request, prepared: x.s.prepared, raw: v5Raw, evidence: [E1],
      serverContext: { phase: x.s.context.phase, provenance: [...x.s.context.provenance], loadedAt: x.s.context.now,
        binding: structuredClone(x.s.request.contextLaunch.expected) } });
    const legacy = receiveHopV55AssistedSemanticAdviceProposalV6({ ...x.turn, envelope: v5 });
    expect(legacy).toMatchObject({ status: 'legacyReadOnly', format: 'brewer-hop-advice-proposal-v5', legacyV5: { status: 'readOnly' } });
    // A V5 reply cannot be adopted through V6 links.
    expect(prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput, envelope: v5 })).toMatchObject({ status: 'unsupported' });
  });

  it('prépare puis confirme une création V4 sans parent : base intacte, sélection seule ajoutée, aucune recette', () => {
    const x = scenario();
    const archiveBefore = structuredClone(x.s.archive);
    const envelopeBefore = structuredClone(x.envelope);
    const { plan, preview } = readyPlan(x);
    expect(plan.expectedHead).toEqual({ kind: 'none' });
    expect(preview.record.transition).toMatchObject({ kind: 'create', actor: { origin: 'user', label: 'Brasseur' } });
    expect(preview.record.transition).not.toHaveProperty('parentRecordReference');

    const confirmed = confirmHopV55SemanticAdoptionV1(confirmInput(x, plan));
    expect(confirmed.status).toBe('ready');
    if (confirmed.status !== 'ready') return;
    expect(Object.keys(confirmed).sort()).toEqual(['command', 'receipt', 'recipeEffect', 'record', 'status']);
    expect(confirmed.recipeEffect).toBe('none');
    expect(confirmed.command).toMatchObject({ commandId: plan.commandId, expectedHead: { kind: 'none' }, recordId: plan.recordId,
      fingerprint: hopV55SemanticAdoptionFingerprintV1(plan) });
    const record = confirmed.record;
    expect(record.transition.kind).toBe('create');
    expect(record.outcome.kind).toBe('domainAnswer');
    const base = record.ledger.entries.filter((entry) => entry.sourceKind === 'initial');
    const added = record.ledger.entries.filter((entry) => entry.sourceKind === 'added');
    expect(base.map((entry) => entry.annotationId)).toEqual(x.s.request.sourceView.semantic.annotations.map((row) => row.id));
    for (const entry of base) {
      expect(entry.decision.kind).toBe('initialize');
      expect(entry.activeIntent).toEqual(entry.sourceAnnotation);
    }
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ annotationId: 'assist-added-intent', decision: { kind: 'add', actId: plan.commandId },
      sourceAnnotation: { interpretationOrigin: 'proposal' }, activeIntent: { interpretationOrigin: 'user' } });
    // The semantic revision stays a suggestion; source4, its projection and the envelope are unchanged.
    expect(record.ledger.sourceAnnotations.map((row) => row.id)).not.toContain('assist-semantic-revision');
    expect(x.s.archive).toEqual(archiveBefore);
    expect(x.envelope).toEqual(envelopeBefore);
    expect(confirmed.receipt).toMatchObject({ commandId: plan.commandId, effectiveAt: '2026-10-04T10:01:00.000Z', recipeEffect: 'none',
      record: { id: record.id, reference: record.reference, ledgerReference: record.ledger.reference },
      selection: [{ optionId: 'assist-option-documented', proposalId: 'assist-add-proposal' }] });
  });

  it('retrouve le reçu original au rejeu et refuse un autre contenu sous le même commandId', () => {
    const x = scenario();
    const { plan } = readyPlan(x);
    const first = confirmHopV55SemanticAdoptionV1(confirmInput(x, plan));
    if (first.status !== 'ready') throw new Error('Confirmation fixture refusée.');
    const replay = confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, plan), existingReceipt: first.receipt, effectiveAt: '2026-10-04T11:00:00.000Z' });
    expect(replay).toEqual({ status: 'replay', receipt: first.receipt });
    const other = prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput, reason: 'Autre motif sous le même commandId.' });
    if (other.status !== 'ready') throw new Error('Plan concurrent fixture refusé.');
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, other.plan), existingReceipt: first.receipt })).toMatchObject({ status: 'conflict' });
    expect(resolveHopV55SemanticAdoptionReplayV1({ existingReceipt: undefined, commandId: plan.commandId, fingerprint: 'x' })).toEqual({ status: 'new' });
  });

  it('authentifie le rejeu avant de divulguer le reçu, mais garde le reçu historique sous contexte B', () => {
    const x = scenario();
    const { plan } = readyPlan(x);
    const first = confirmHopV55SemanticAdoptionV1(confirmInput(x, plan));
    if (first.status !== 'ready') throw new Error('Confirmation fixture refusée.');
    const b = setup('Ma bière est trop douce. Je veux conserver la poire. Version corrigée.');
    const replayInput = { ...confirmInput(x, plan), existingReceipt: first.receipt,
      principal: { ...x.principal, label: '' },
      ticket: { ...x.ticket, generation: x.ticket.generation + 1 },
      current: { ...b.page, archive: b.archive, workspace: b.workspace },
      effectiveAt: '2026-10-04T12:30:00.000Z' };
    expect(confirmHopV55SemanticAdoptionV1(replayInput)).toEqual({ status: 'replay', receipt: first.receipt });

    for (const principal of [
      { ...x.principal, principalId: 'principal:other' },
      { ...x.principal, ownerKey: 'owner:other' },
      { ...x.principal, workspaceId: 'workspace:other' },
      { ...x.principal, scope: { ...x.principal.scope, id: 'recipe:other' } },
    ]) {
      const refused = confirmHopV55SemanticAdoptionV1({ ...replayInput, principal });
      expect(refused).toMatchObject({ status: 'invalid' });
      expect(refused).not.toHaveProperty('receipt');
    }

    // A self-consistent but cross-plan receipt must not become visible just because it shares command/fingerprint.
    const { reference: _reference, ...receiptBody } = first.receipt;
    const foreignReceiptBody = { ...receiptBody, planReference: 'plan:foreign' };
    const foreignReceipt = { ...foreignReceiptBody, reference: hopAdviceContentReference(
      'hop-v55-semantic-adoption-receipt-v1', foreignReceiptBody) };
    expect(confirmHopV55SemanticAdoptionV1({ ...replayInput, existingReceipt: foreignReceipt }))
      .toMatchObject({ status: 'invalid', reason: expect.stringMatching(/relié au plan/) });
  });

  it('bloque A→B, tête apparue, ticket ou génération et principal différents avant tout record', () => {
    const x = scenario();
    const { plan } = readyPlan(x);
    const b = setup('Ma bière est trop douce. Je veux conserver la poire. Version corrigée.');
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, plan), current: { ...b.page, archive: b.archive, workspace: b.workspace } }))
      .toMatchObject({ status: 'stale' });
    const created = confirmHopV55SemanticAdoptionV1(confirmInput(x, plan));
    if (created.status !== 'ready') throw new Error('Confirmation fixture refusée.');
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, plan), head: { kind: 'recordV4', record: created.record } }))
      .toMatchObject({ status: 'stale', reason: expect.stringMatching(/tête/) });
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, plan), ticket: { ...x.ticket, generation: 1 } })).toMatchObject({ status: 'stale' });
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, plan), ticket: { ...x.ticket, operationId: 'operation:fixture-0002' } })).toMatchObject({ status: 'stale' });
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, plan), principal: { ...x.principal, principalId: 'principal:other' } }))
      .toMatchObject({ status: 'invalid' });
    expect(prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput, principal: { ...x.principal, ownerKey: 'owner:other' } })).toMatchObject({ status: 'invalid' });
    const tampered = structuredClone(plan) as any;
    tampered.selection[0].reason = 'Motif réécrit après aperçu.';
    expect(confirmHopV55SemanticAdoptionV1(confirmInput(x, tampered))).toMatchObject({ status: 'invalid' });
  });

  it('refuse une sélection non liée, une révision source4 et une mesure fabriquée', () => {
    const x = scenario();
    expect(prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput,
      selection: [{ optionId: 'assist-option-other', proposalId: 'assist-add-proposal', reason: 'Sans lien scellé.' }] }))
      .toMatchObject({ status: 'invalid', reason: expect.stringMatching(/aucun lien scellé/) });
    expect(prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput,
      selection: [{ optionId: 'assist-option-documented', proposalId: 'assist-semantic-revision', reason: 'Réviser la source.' }] }))
      .toMatchObject({ status: 'unsupported' });
    const measurement = { ...addIntent('odeur résineuse'), role: 'measurement', interpretationOrigin: 'user' } as any;
    expect(prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput,
      selection: [{ optionId: 'assist-option-documented', proposalId: 'assist-add-proposal', reason: 'Mesure.', activeIntent: measurement }] }))
      .toMatchObject({ status: 'invalid', reason: expect.stringMatching(/mesure/) });
    expect(prepareHopV55SemanticAdoptionPlanV1({ ...x.planInput, selection: [] })).toMatchObject({ status: 'invalid' });
  });

  it('lie la projection NR exacte avant preview et confirmation, et conserve absence puis adoption comme états distincts', () => {
    const absent = scenario();
    const absentPlan = readyPlan(absent).plan;
    expect(absentPlan.currentProjection.culture).toEqual({ status: 'notApplicable' });
    expect(absentPlan.cultureBindingReference).toBeNull();

    // A caller may retain the other no-binding state from a versioned projection; the sealed plan must not normalize it.
    const { reference: _absentReference, ...absentBody } = absentPlan;
    const notReceivedBody = { ...absentBody, currentProjection: { ...absentPlan.currentProjection,
      culture: { status: 'notReceived' as const } } };
    const notReceivedPlan = { ...notReceivedBody, reference: hopAdviceContentReference(
      HOP_V55_SEMANTIC_ADOPTION_PLAN_V1_FORMAT, notReceivedBody) };
    expect(readHopV55SemanticAdoptionPlanV1(notReceivedPlan).currentProjection.culture).toEqual({ status: 'notReceived' });
    expect(confirmHopV55SemanticAdoptionV1(confirmInput(absent, notReceivedPlan)))
      .toMatchObject({ status: 'stale', reason: expect.stringMatching(/état NR/) });

    const seed = setup();
    const workspaceR1 = adoptedWorkspace(seed, 1);
    const bindingR1 = currentAdoptedBinding(workspaceR1);
    const r1 = scenario(question, workspaceR1, bindingR1);
    const r1Plan = readyPlan(r1).plan;
    expect(r1Plan.currentProjection.culture).toMatchObject({ status: 'declaredNotConsumed',
      reference: bindingR1.reference, bindingReference: bindingR1.bindingReference });
    expect(r1Plan.cultureBindingReference).toBe(bindingR1.bindingReference);

    // A binding from revision 1 cannot qualify revision 2, and omitting an adopted current binding is not null/no-NR.
    const workspaceR2 = adoptedWorkspace(seed, 2);
    const bindingR2 = currentAdoptedBinding(workspaceR2);
    const r2WithOldBinding = scenario(question, workspaceR2, bindingR1);
    expect(prepareHopV55SemanticAdoptionPlanV1(r2WithOldBinding.planInput)).toMatchObject({ status: 'stale' });
    const r1WithoutBinding = scenario(question, workspaceR1, null);
    expect(prepareHopV55SemanticAdoptionPlanV1(r1WithoutBinding.planInput)).toMatchObject({ status: 'stale' });

    // A correct R2 plan still refuses the stale R1 binding at confirmation.
    const r2 = scenario(question, workspaceR2, bindingR2);
    const r2Plan = readyPlan(r2).plan;
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(r2, r2Plan), cultureBinding: bindingR1 }))
      .toMatchObject({ status: 'stale' });

    // A workspace with no adopted NR at preview cannot acquire one between preview and confirmation.
    const afterAdoption = scenario(question, workspaceR1, bindingR1);
    expect(confirmHopV55SemanticAdoptionV1({ ...confirmInput(absent, absentPlan),
      current: afterAdoption.s.page, cultureBinding: bindingR1 })).toMatchObject({ status: 'stale' });
  });

  it('adopte au-dessus d’une vraie tête V3 produite depuis la même archive4 source4', () => {
    const x = scenario();
    const parent = createParentV3(x.s);
    expect(parent.sourceReadingReference).toBe(x.s.archive.contentReference);
    const input = { ...x.planInput, head: { kind: 'recordV3' as const, record: parent } };
    const preview = prepareHopV55SemanticAdoptionPlanV1(input);
    expect(preview.status).toBe('ready');
    if (preview.status !== 'ready') throw new Error('La préparation V3→V4 de fixture a été refusée.');
    expect(preview.plan.expectedHead).toEqual({ kind: 'recordV3', reference: parent.reference });
    expect(preview.preview.record.transition).toMatchObject({ kind: 'upgradeV3',
      parentRecordReference: parent.reference, parentReadingReference: parent.sourceReadingReference });
    const confirmed = confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, preview.plan),
      head: { kind: 'recordV3', record: parent } });
    expect(confirmed.status).toBe('ready');
    if (confirmed.status === 'ready') expect(confirmed.record.transition).toMatchObject({ kind: 'upgradeV3',
      parentRecordReference: parent.reference });
  });

  it('adopte au-dessus d’une vraie tête V4 et exige son ledger de parent exact', () => {
    const x = scenario();
    const parent = createParentV4(x.s);
    expect(parent.format).toBe(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT);
    const input = { ...x.planInput, head: { kind: 'recordV4' as const, record: parent } };
    const preview = prepareHopV55SemanticAdoptionPlanV1(input);
    expect(preview.status).toBe('ready');
    if (preview.status !== 'ready') throw new Error('La préparation V4→V4 de fixture a été refusée.');
    expect(preview.plan.expectedHead).toEqual({ kind: 'recordV4', reference: parent.reference,
      ledgerReference: parent.ledger.reference });
    expect(preview.preview.record.transition).toMatchObject({ kind: 'revise',
      parentRecordReference: parent.reference, parentReadingReference: parent.sourceReadingReference });
    const confirmed = confirmHopV55SemanticAdoptionV1({ ...confirmInput(x, preview.plan),
      head: { kind: 'recordV4', record: parent } });
    expect(confirmed.status).toBe('ready');
    if (confirmed.status === 'ready') expect(confirmed.record.transition).toMatchObject({ kind: 'revise',
      parentRecordReference: parent.reference });
  });

  it('prépare une création initiale sans affaiblir prepareCorrectionV4 : collision, base vide, pending', () => {
    const x = scenario();
    const transition = { actId: 'act:initial-0001', kind: 'create' as const, reason: 'Création explicite.',
      actor: { origin: 'user' as const, label: 'Brasseur' }, recordedAt: '2026-10-04T10:05:00.000Z' };
    const common = { sourceReadingArchive: x.s.archive, ownerKey, workspaceId, prepared: x.s.prepared,
      recordId: 'property-answer-v4:initial-0001', requestId: 'property-request-v4:initial-0001', candidatePolicy, cultureBinding: null, transition };
    const baseId = x.s.request.sourceView.semantic.annotations[0].id;
    const collision = { ...addIntent('odeur résineuse', baseId), interpretationOrigin: 'proposal' } as any;
    expect(() => prepareInitialPropertyAdviceV4({ ...common, additions: [{ kind: 'add', sourceAnnotation: collision,
      activeIntent: { ...collision, interpretationOrigin: 'user' }, reason: 'Collision.' }] })).toThrow(/collision/);
    expect(() => prepareInitialPropertyAdviceV4({ ...common, transition: { ...transition, kind: 'revise' as const } as any, additions: [] }))
      .toThrow(/create sans parent/);
    expect(() => prepareCorrectionV4({ ...common, sourceRecord: undefined as any, transition } as any)).toThrow();

    const neutral = setup('Que montre exactement cette lecture sémantique ?');
    expect(neutral.reading.annotations).toEqual([]);
    const neutralCommon = { ...common, sourceReadingArchive: neutral.archive, prepared: neutral.prepared };
    expect(prepareInitialPropertyAdviceV4({ ...neutralCommon, additions: [] })).toMatchObject({ status: 'pending' });
    const fragment = 'lecture sémantique';
    const start = 'Que montre exactement cette lecture sémantique ?'.indexOf(fragment);
    const suggestion = { ...addIntent('odeur résineuse'), label: fragment, sourceSpans: [{ start, end: start + fragment.length, text: fragment }],
      interpretationOrigin: 'proposal' } as any;
    const onlyAddition = prepareInitialPropertyAdviceV4({ ...neutralCommon, additions: [{ kind: 'add', sourceAnnotation: suggestion,
      activeIntent: { ...suggestion, interpretationOrigin: 'user' }, reason: 'Ajout confirmé.' }] });
    expect(onlyAddition.status).toBe('ready');
    if (onlyAddition.status === 'ready') {
      expect(onlyAddition.recordDraft.ledger.sourceAnnotations.map((row) => row.id)).toEqual(['assist-added-intent']);
      expect(onlyAddition.recordDraft.ledger.entries).toHaveLength(1);
      expect(onlyAddition.requestDraftV3.requestSnapshot.propertyIntents.map((row) => row.interpretationOrigin)).toEqual(['user']);
    }
  });
});
