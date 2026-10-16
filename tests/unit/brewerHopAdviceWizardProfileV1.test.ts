import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../src/types';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { canonicalizeHopV55RecipeDraft } from '../../src/services/hopV55/recipeStepContext';
import {
  createHopV55DecisionReadingArchiveV4,
  createHopV55DecisionReadingArchiveV4ForWizardV1,
  readHopV55DecisionReadingArchive,
  readHopV55DecisionReadingArchiveForWizardV1,
  readHopV55QuestionSemanticV1,
} from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import {
  createBrewerHopAdviceWizardSourceV1,
  mapBrewerHopAdviceWizardSourceToScopeV1,
  type BrewerHopAdviceWizardOriginV1,
} from '../../functions/src/brewerHopAdviceWizardSourceV1.js';
import { RECIPE_FIELDS, pick } from '../../functions/src/brewerContext.js';
import { normalizeRecipe, prepareBrewingScenarioContext } from '../../src/domain/brewerTools';
import {
  BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT,
  brewerHopAdviceEffectiveDraftReferenceForWizardV1,
  createBrewerHopAdviceContextLaunchForWizardV1,
  isBrewerHopAdviceContextLaunchClaim,
  isBrewerHopAdviceContextLaunchClaimForWizardV1,
  mapBrewerHopAdviceLaunchSourceToScopeV1,
  projectBrewerHopAdviceContext,
  readBrewerHopAdviceContextLaunchClaimForWizardV1,
  readBrewerHopAdviceWizardSourceForWizardV1,
} from '../../functions/src/brewerHopAdviceContextBinding.js';
import {
  BREWER_HOP_ADVICE_SEMANTIC_PROPOSAL_KEYS_V5,
  assertBrewerHopAdviceRequestV3,
  assertBrewerHopAdviceRequestV3ForWizardV1,
  assertBrewerHopAdviceSemanticEnvelopeV3ForWizardV1,
  assertBrewerHopAdviceSourceViewMatchesArchiveV1ForWizardV1,
  assertBrewerHopAdviceSourceViewV1,
  assertBrewerHopAdviceSourceViewV1ForWizardV1,
  brewerHopAdviceProviderInputV3,
  brewerHopAdviceProviderInputV3ForWizardV1,
  brewerHopAdviceProviderInputV3Reference,
  brewerHopAdviceProviderInputV3ReferenceForWizardV1,
  brewerHopAdviceRequestV3Reference,
  brewerHopAdviceRequestV3ReferenceForWizardV1,
  brewerHopAdviceSourceViewReferenceV1,
  brewerHopAdviceSourceViewReferenceV1ForWizardV1,
  createBrewerHopAdviceRequestV3,
  createBrewerHopAdviceRequestV3ForWizardV1,
  createBrewerHopAdviceSourceViewV1,
  createBrewerHopAdviceSourceViewV1ForWizardV1,
  readBrewerHopAdviceRequestV3,
  readBrewerHopAdviceRequestV3ForWizardV1,
} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import {
  readBrewerHopAdviceSourceViewMetadataV1,
  readBrewerHopAdviceSourceViewMetadataV1ForWizardV1,
} from '../../functions/src/brewerHopAdviceSourceViewMetadataV1.js';
import {
  assertBrewerHopAdviceProposalEnvelopeV6,
  assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1,
  assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1,
  brewerHopAdviceProposalEnvelopeV6ReferenceForWizardV1,
  readBrewerHopAdviceProposalEnvelopeV6,
  readBrewerHopAdviceProposalEnvelopeV6ForWizardV1,
} from '../../functions/src/brewerHopAdviceSemanticV6.js';
import { buildHopAdviceV1WireV3ForWizardV1, HOP_ADVICE_PROTOCOL_V1 } from '../../functions/src/brewerHopAdviceTransportV1.js';
import {
  hopAdviceV1InputDigest,
  hopAdviceV1InputDigestForWizardV1,
  parseHopAdviceV1Wire,
  parseHopAdviceV1WireForWizardV1,
  validateHopAdviceV1Job,
  validateHopAdviceV1JobForWizardV1,
} from '../../functions/src/brewerHopAdviceLaneV1.js';
import {
  brewerHopAdviceSemanticHarnessOptionsV6ForWizardV1,
  createBrewerHopAdviceSemanticProfileV5,
  createBrewerHopAdviceSemanticProfileV6,
  createBrewerHopAdviceSemanticProfileV6ForWizardV1,
  validateHopAdviceV1ChatInputForWizardV1,
  type ValidatedHopAdviceV1InputForWizardV1,
} from '../../functions/src/brewerHopAdviceSemanticAdapter.js';
import { BREWER_HOP_ADVICE_READ_TOOLS } from '../../functions/src/brewerHopAdviceAdapter.js';

// Fixture data only: ids, a deliberately incomplete Wizard draft and a saved Recipe sharing its ID.
// Every server-side context below is derived from the received wire; no better-filled side argument exists.
const OWNER = 'owner-wizard-87';
const WORKSPACE = 'workspace-wizard-87';
const DRAFT_ID = 'recipe-draft-87';
const ORIGIN: BrewerHopAdviceWizardOriginV1 = { ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT_ID };
const QUESTION = 'Je veux plus d’arôme agrume dans cette bière.';
const RECORDED_AT = '2026-10-05T12:00:00.000Z';
const RUNTIME_REFERENCE = 'runtime-fixture-wizard-87';
const OPERATION_ID = 'operation-wizard-87-0001';

function wizardDraft(overrides: Record<string, unknown> = {}): Recipe {
  // Incomplete on purpose: empty name/style, zero volume, null and NaN unknowns stay permitted.
  return {
    id: DRAFT_ID, name: 'Brouillon B', style: '', volumeL: 0, ogTarget: null, abvTarget: Number.NaN,
    hops: [], malts: [], ...overrides,
  } as unknown as Recipe;
}

const storedRecipeA = {
  id: DRAFT_ID, name: 'Recette enregistrée A', style: 'IPA', volumeL: 20, ogTarget: 1.06, hops: [], malts: [],
} as unknown as Recipe;

function contextFor(recipe: unknown): BrewerContext {
  return {
    recipe, inventory: [], material: [], waterSources: [], phase: 'Brouillon de recette en cours d’écriture',
    now: 1_760_000_000_000, provenance: ['Contexte de fixture dérivé du wire reçu.'],
  };
}

/** Client side: canonical snapshot → source → Wizard archive → claim on that snapshot → RequestV3. */
function wizardFixture(origin: BrewerHopAdviceWizardOriginV1 = ORIGIN, recipe: Recipe = wizardDraft()) {
  const snapshot = canonicalizeHopV55RecipeDraft({ ownerKey: origin.ownerKey, draftId: origin.draftId, draft: recipe });
  const source = createBrewerHopAdviceWizardSourceV1({ origin, snapshot });
  const scope = mapBrewerHopAdviceWizardSourceToScopeV1(source);
  const context = contextFor(snapshot.recipe);
  const prepared = prepareBrewingScenarioContext(context);
  // Fixture assumption to confirm under Sol's runner: the source4 reader takes the same prepared context
  // that the adapter passes to hopV55PropertyIntentsFromSemanticReadingV1.
  const reading = readHopV55QuestionSemanticV1(QUESTION, prepared);
  const archive = createHopV55DecisionReadingArchiveV4ForWizardV1({
    id: `reading-${origin.draftId}-${snapshot.reference.slice(-8)}`, ownerKey: origin.ownerKey, workspaceId: origin.workspaceId,
    recordedAt: RECORDED_AT, reading, source, runtimeReference: RUNTIME_REFERENCE,
  });
  const projected = projectBrewerHopAdviceContext({ scope, context, runtime: prepared.runtime });
  if (projected.status !== 'ready') throw new Error(projected.reason);
  const contextLaunch = createBrewerHopAdviceContextLaunchForWizardV1({
    source, snapshot, sourceReadingReference: archive.contentReference, sourceRuntimeReference: archive.runtimeReference,
    expected: projected.projection,
  });
  const request = createBrewerHopAdviceRequestV3ForWizardV1({ sourceArchive: archive, contextLaunch, snapshot });
  return { origin, recipe, snapshot, source, scope, context, prepared, archive, contextLaunch, request };
}

/** Classic recipe-scoped RequestV3 on the saved Recipe A, built only through the unchanged classic exports. */
function classicFixture() {
  const scope = { kind: 'recipe' as const, id: DRAFT_ID };
  const source = { kind: 'recipe' as const, id: DRAFT_ID };
  const context = contextFor(storedRecipeA);
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55QuestionSemanticV1(QUESTION, prepared);
  const archive = createHopV55DecisionReadingArchiveV4({
    id: 'reading-classic-87', ownerKey: OWNER, workspaceId: WORKSPACE, recordedAt: RECORDED_AT, reading, source,
    runtimeReference: RUNTIME_REFERENCE,
  });
  const projected = projectBrewerHopAdviceContext({ scope, context, runtime: prepared.runtime });
  if (projected.status !== 'ready') throw new Error(projected.reason);
  const contextLaunch = {
    format: BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT, ownerKey: OWNER, workspaceId: WORKSPACE,
    sourceReadingReference: archive.contentReference, source, sourceRuntimeReference: archive.runtimeReference,
    scope, expected: projected.projection,
  };
  const request = createBrewerHopAdviceRequestV3({ sourceArchive: archive, contextLaunch });
  return { scope, archive, contextLaunch, request };
}

function wireFor(fixture: ReturnType<typeof wizardFixture>, draft: unknown = fixture.snapshot.recipe) {
  return buildHopAdviceV1WireV3ForWizardV1({
    operationId: OPERATION_ID, question: fixture.request.question, analysisMode: 'auto',
    scope: fixture.request.contextLaunch.scope, draft, hopAdvice: fixture.request,
  });
}

/** What the callable actually receives: JSON bytes, not the client objects. */
const received = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function withoutReference<T extends { reference: string }>(value: T): Omit<T, 'reference'> {
  const { reference: _reference, ...body } = value;
  return body;
}

function validatedFromWire(fixture: ReturnType<typeof wizardFixture>): ValidatedHopAdviceV1InputForWizardV1 {
  return validateHopAdviceV1ChatInputForWizardV1(parseHopAdviceV1WireForWizardV1(received(wireFor(fixture))), OWNER);
}

/** Fixture provider: its context depends on the validated wire only. */
const loadContextFromWire = (validated: ValidatedHopAdviceV1InputForWizardV1): BrewerContext => contextFor(validated.input.draft);

const futureSourceOf = (fixture: ReturnType<typeof wizardFixture>) => ({
  ...fixture.source, format: 'hop-v55-wizard-source-v2', futurePayload: { revision: 2, opaque: ['kept', null, 0] },
});

// Deliberately minimal V6 finish: no tool evidence, one uncalculated investigation option. It exercises the
// profile's own contract; if the shared answer rules require more, adjust this raw only, never the invariants.
const minimalFinishV6 = {
  annotationReviews: [], propertyIntentProposals: [], semanticRevisionProposals: [], openQuestions: [], materials: [],
  answer: {
    summary: 'Lecture du brouillon sans calcul.', readingNote: 'Aucun outil appelé dans ce tour.',
    options: [{ id: 'assist-option-1', kind: 'investigation', title: 'Préciser la cible aromatique',
      rationale: 'Hypothèse non calculée, présentée comme telle.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [] }],
    unknowns: [], program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [],
  },
  optionProposalLinks: [],
};

describe('Profil Wizard V1 — formules et entrées classiques inchangées', () => {
  it('garde les références et le mapper classiques exacts, sans admettre la source Wizard', () => {
    const classic = classicFixture();
    expect(brewerHopAdviceRequestV3Reference(classic.request))
      .toBe(hopAdviceContentReference('brewer-hop-advice-request-v3', classic.request));
    expect(brewerHopAdviceSourceViewReferenceV1(classic.request.sourceView))
      .toBe(hopAdviceContentReference('hop-v55-source4-assistance-view-v1', withoutReference(classic.request.sourceView)));
    expect(brewerHopAdviceProviderInputV3Reference(classic.request))
      .toBe(hopAdviceContentReference('brewer-hop-advice-provider-input-v3', brewerHopAdviceProviderInputV3(classic.request)));

    // The classic content-bearing mapper still follows the content: it is not the Wizard origin scope.
    const futureDraft = (contentReference: string) => ({ kind: 'localFutureDraft' as const, workspaceId: WORKSPACE,
      draftId: DRAFT_ID, revision: 1, contentReference });
    const scopeOf = (contentReference: string) => mapBrewerHopAdviceLaunchSourceToScopeV1(OWNER, WORKSPACE, futureDraft(contentReference));
    const legacyDigest = hopAdviceContentReference('brewer-hop-v55-assisted-scope-v1',
      { ownerKey: OWNER, workspaceId: WORKSPACE, source: futureDraft('content-a') });
    expect(scopeOf('content-a')).toEqual({ kind: 'draft', id: `hop-v55-${legacyDigest.split(':').pop()}` });
    expect(scopeOf('content-a').id).not.toBe(scopeOf('content-b').id);

    // The effective draft source formula is shared, not duplicated.
    const draftScope = { kind: 'draft' as const, id: 'classic-draft-87' };
    const context = contextFor(storedRecipeA);
    const projected = projectBrewerHopAdviceContext({ scope: draftScope, context, runtime: prepareBrewingScenarioContext(context).runtime });
    expect(projected.status).toBe('ready');
    if (projected.status === 'ready') {
      expect(projected.projection.source.snapshotReference).toBe(hopAdviceContentReference(
        'brewer-hop-advice-normalized-draft-source-v1', normalizeRecipe(pick(storedRecipeA, RECIPE_FIELDS))));
      expect(brewerHopAdviceEffectiveDraftReferenceForWizardV1(storedRecipeA)).toBe(projected.projection.source.snapshotReference);
    }
  });

  it('refuse le Wizard dans chaque entrée classique et le classique dans chaque entrée Wizard', () => {
    const wizard = wizardFixture();
    const classic = classicFixture();

    expect(readHopV55DecisionReadingArchive(wizard.archive).status).toBe('invalidRecord');
    expect(() => createBrewerHopAdviceSourceViewV1(wizard.archive)).toThrow();
    expect(() => assertBrewerHopAdviceSourceViewV1(wizard.request.sourceView)).toThrow();
    expect(readBrewerHopAdviceSourceViewMetadataV1(wizard.request.sourceView).status).toBe('invalid');
    expect(isBrewerHopAdviceContextLaunchClaim(wizard.contextLaunch)).toBe(false);
    expect(() => assertBrewerHopAdviceRequestV3(wizard.request)).toThrow();
    expect(readBrewerHopAdviceRequestV3(wizard.request).status).toBe('invalid');
    expect(() => parseHopAdviceV1Wire(received(wireFor(wizard)))).toThrow();
    expect(() => createBrewerHopAdviceSemanticProfileV5(wizard.request as never, wizard.context, wizard.scope, OWNER)).toThrow();
    expect(() => createBrewerHopAdviceSemanticProfileV6(wizard.request as never, wizard.context, wizard.scope, OWNER)).toThrow();

    expect(() => createBrewerHopAdviceSourceViewV1ForWizardV1(classic.archive)).toThrow();
    expect(() => assertBrewerHopAdviceSourceViewV1ForWizardV1(classic.request.sourceView)).toThrow();
    expect(readBrewerHopAdviceSourceViewMetadataV1ForWizardV1(classic.request.sourceView).status).toBe('invalid');
    expect(isBrewerHopAdviceContextLaunchClaimForWizardV1(classic.contextLaunch)).toBe(false);
    expect(() => assertBrewerHopAdviceRequestV3ForWizardV1(classic.request)).toThrow();
    expect(readBrewerHopAdviceRequestV3ForWizardV1(classic.request).status).toBe('invalid');
    expect(readBrewerHopAdviceRequestV3ForWizardV1({ ...classic.request, format: 'brewer-hop-advice-request-v2' }).status).toBe('invalid');
  });
});

describe('Profil Wizard V1 — origine, contenu et lien de snapshot', () => {
  it('relie SourceView, claim et Request3 au même snapshot avec les formules V1/V3 existantes', () => {
    const wizard = wizardFixture();
    const { request } = wizard;
    expect(request.contextLaunch.scope).toEqual(wizard.scope);
    expect(request.contextLaunch.source).toEqual(wizard.source);
    expect(request.sourceView.archiveIdentity.source).toEqual(wizard.source);
    expect(request.sourceReadingReference).toBe(wizard.archive.contentReference);
    expect(() => assertBrewerHopAdviceSourceViewMatchesArchiveV1ForWizardV1(request.sourceView, wizard.archive)).not.toThrow();
    expect(brewerHopAdviceRequestV3ReferenceForWizardV1(request)).toBe(hopAdviceContentReference('brewer-hop-advice-request-v3', request));
    expect(brewerHopAdviceSourceViewReferenceV1ForWizardV1(request.sourceView))
      .toBe(hopAdviceContentReference('hop-v55-source4-assistance-view-v1', withoutReference(request.sourceView)));
    const providerInput = brewerHopAdviceProviderInputV3ForWizardV1(request);
    expect(brewerHopAdviceProviderInputV3ReferenceForWizardV1(request))
      .toBe(hopAdviceContentReference('brewer-hop-advice-provider-input-v3', providerInput));
    expect(Object.keys(providerInput).sort()).toEqual(Object.keys(brewerHopAdviceProviderInputV3(classicFixture().request)).sort());
    expect(JSON.stringify(providerInput)).not.toContain('wizardDraft');
    expect(readBrewerHopAdviceRequestV3ForWizardV1(received(request))).toMatchObject({ status: 'readOnly' });
  });

  it('garde l’origine et le scope de A à B, change le contenu, et refuse tout mélange A/B', () => {
    const a = wizardFixture(ORIGIN, wizardDraft({ name: 'Version A', volumeL: 10 }));
    const b = wizardFixture(ORIGIN, wizardDraft({ name: 'Version B', volumeL: 20 }));
    expect(a.scope).toEqual(b.scope);
    expect(a.request.contextLaunch.scope).toEqual(b.request.contextLaunch.scope);
    expect(a.source.contentReference).not.toBe(b.source.contentReference);
    expect(a.archive.contentReference).not.toBe(b.archive.contentReference);

    expect(() => createBrewerHopAdviceRequestV3ForWizardV1({ sourceArchive: a.archive, contextLaunch: b.contextLaunch, snapshot: b.snapshot })).toThrow();
    expect(() => createBrewerHopAdviceRequestV3ForWizardV1({ sourceArchive: a.archive, contextLaunch: a.contextLaunch, snapshot: b.snapshot })).toThrow();
    expect(() => createBrewerHopAdviceContextLaunchForWizardV1({ source: a.source, snapshot: a.snapshot,
      sourceReadingReference: a.archive.contentReference, sourceRuntimeReference: RUNTIME_REFERENCE,
      expected: b.contextLaunch.expected })).toThrow();
    // New emission of A while the live Wizard holds B: refused at build and at parse, without re-anchoring.
    expect(() => wireFor(a, b.snapshot.recipe)).toThrow();
    expect(() => parseHopAdviceV1WireForWizardV1(received({ ...wireFor(b), hopAdvice: a.request }))).toThrow();

    // History A stays readable as recorded, with no comparison to the live content B.
    expect(readHopV55DecisionReadingArchiveForWizardV1(a.archive).status).toBe('available');
    expect(readBrewerHopAdviceRequestV3ForWizardV1(a.request)).toMatchObject({ status: 'readOnly' });
  });

  it('sépare owner, workspace et draft, et invalide les claims étrangers ou au scope non dérivé', () => {
    const base = wizardFixture();
    const scopes = [
      base.scope,
      wizardFixture({ ...ORIGIN, ownerKey: 'owner-other-87' }).scope,
      wizardFixture({ ...ORIGIN, workspaceId: 'workspace-other-87' }).scope,
      wizardFixture({ ...ORIGIN, draftId: 'recipe-draft-other-87' }, wizardDraft({ id: 'recipe-draft-other-87' })).scope,
    ];
    expect(new Set(scopes.map(scope => scope.id)).size).toBe(4);

    const claim = base.contextLaunch;
    const withScope = (scope: { kind: string; id: string }) => ({ ...claim, scope,
      expected: { ...claim.expected, scope, source: { ...claim.expected.source, kind: scope.kind, id: scope.id } } });
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1(claim).status).toBe('readOnly');
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1({ ...claim, ownerKey: 'owner-other-87' }).status).toBe('invalid');
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1({ ...claim, workspaceId: 'workspace-other-87' }).status).toBe('invalid');
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1(withScope(scopes[3])).status).toBe('invalid');
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1(withScope({ kind: 'recipe', id: DRAFT_ID })).status).toBe('invalid');

    const view = base.request.sourceView;
    const foreignViewBody = { ...withoutReference(view), archiveIdentity: { ...view.archiveIdentity,
      source: { ...view.archiveIdentity.source, workspaceId: 'workspace-other-87' } } };
    const foreignView = { ...foreignViewBody, reference: hopAdviceContentReference('hop-v55-source4-assistance-view-v1', foreignViewBody) };
    expect(readBrewerHopAdviceRequestV3ForWizardV1({ ...base.request, sourceView: foreignView }).status).toBe('invalid');
  });

  it('classe un futur Wizard intact en lecture seule et invalide le connu corrompu ou étranger d’abord', () => {
    const wizard = wizardFixture();
    const future = futureSourceOf(wizard);
    expect(readBrewerHopAdviceWizardSourceForWizardV1(future)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: future });
    for (const foreign of [
      { ...wizard.source, format: 'hop-v55-wizard-source-v0' },
      { ...wizard.source, format: 'brewer-recipe-source-v2' },
      { kind: 'localFutureDraft', format: 'hop-v55-local-future-draft-v2', workspaceId: WORKSPACE, draftId: DRAFT_ID },
    ]) expect(readBrewerHopAdviceWizardSourceForWizardV1(foreign).status).toBe('invalid');

    const futureClaim = { ...wizard.contextLaunch, source: future };
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1(futureClaim).status).toBe('unsupportedReadOnly');
    expect(isBrewerHopAdviceContextLaunchClaimForWizardV1(futureClaim)).toBe(false);
    expect(readBrewerHopAdviceContextLaunchClaimForWizardV1({ ...futureClaim, source: { ...future, ownerKey: 'owner-other-87' } }).status)
      .toBe('invalid');
    expect(() => createBrewerHopAdviceRequestV3ForWizardV1({ sourceArchive: wizard.archive, contextLaunch: futureClaim,
      snapshot: wizard.snapshot })).toThrow();

    const view = wizard.request.sourceView;
    const futureViewBody = { ...withoutReference(view), archiveIdentity: { ...view.archiveIdentity, source: future } };
    const futureView = { ...futureViewBody, reference: hopAdviceContentReference('hop-v55-source4-assistance-view-v1', futureViewBody) };
    const futureRequest = { ...wizard.request, contextLaunch: futureClaim, sourceView: futureView };
    const before = structuredClone(futureRequest);
    const read = readBrewerHopAdviceRequestV3ForWizardV1(futureRequest);
    expect(read.status).toBe('unsupportedReadOnly');
    if (read.status === 'unsupportedReadOnly') expect(read.snapshot).toEqual(before);
    expect(() => assertBrewerHopAdviceRequestV3ForWizardV1(futureRequest)).toThrow();
    expect(readBrewerHopAdviceRequestV3ForWizardV1({ ...futureRequest, sourceView: { ...futureView, reference: view.reference } }).status)
      .toBe('invalid');
    expect(readBrewerHopAdviceRequestV3ForWizardV1({ ...futureRequest, contextLaunch: { ...futureClaim, ownerKey: 'owner-other-87' } }).status)
      .toBe('invalid');
    expect(readBrewerHopAdviceRequestV3(futureRequest).status).toBe('invalid');
  });

  it('préserve les témoins Request99/Archive99 sans conversion ni promotion', () => {
    const wizard = wizardFixture();
    const request99 = { ...wizard.request, format: 'brewer-hop-advice-request-v99' };
    const wizardRead = readBrewerHopAdviceRequestV3ForWizardV1(request99);
    expect(wizardRead.status).toBe('unsupportedReadOnly');
    if (wizardRead.status === 'unsupportedReadOnly') expect(wizardRead.snapshot).toEqual(request99);
    expect(readBrewerHopAdviceRequestV3(request99).status).toBe('unsupportedReadOnly');

    const archive99 = { ...wizard.archive, format: 'hop-v55-decision-reading-v99' };
    expect(readHopV55DecisionReadingArchiveForWizardV1(archive99).status).toBe('unsupportedFormat');
    expect(() => createBrewerHopAdviceSourceViewV1ForWizardV1(archive99)).toThrow(/future/);
    expect(() => createBrewerHopAdviceSourceViewV1ForWizardV1({ ...wizard.archive, format: 'hop-v55-decision-reading-v3' })).toThrow();
  });
});

describe('Profil Wizard V1 — wire, lane et worker', () => {
  it('transporte exactement le snapshot sous scope draft et refuse la Recipe enregistrée du même id', () => {
    const wizard = wizardFixture();
    const wire = wireFor(wizard);
    expect(wire).toMatchObject({ mode: HOP_ADVICE_PROTOCOL_V1.name, scope: wizard.scope, draft: wizard.snapshot.recipe });
    expect(Object.prototype.hasOwnProperty.call(wire, 'localJournal')).toBe(false);
    expect(() => wireFor(wizard, storedRecipeA)).toThrow();
    expect(() => buildHopAdviceV1WireV3ForWizardV1({ ...wire, scope: { kind: 'draft', id: DRAFT_ID } } as never)).toThrow();
    expect(() => buildHopAdviceV1WireV3ForWizardV1({ ...wire, question: `${wire.question} ?` } as never)).toThrow();

    const parsed = parseHopAdviceV1WireForWizardV1(received(wire));
    expect(parsed.sourceProfile).toBe('wizardV1');
    expect(parsed.wizardDraft).toEqual(received(wizard.snapshot.recipe));
    expect(hopAdviceV1InputDigestForWizardV1(parsed.wireInput)).toBe(hopAdviceV1InputDigest(parsed.wireInput as never));

    for (const broken of [
      { ...received(wire), draft: received(storedRecipeA) },
      { ...received(wire), localJournal: [] },
      { ...received(wire), scope: { kind: 'recipe', id: DRAFT_ID } },
      { ...received(wire), editableTargets: ['recipe'] },
      { ...received(wire), unexpected: true },
      { ...received(wire), hopAdvice: { ...received(wire).hopAdvice, format: 'brewer-hop-advice-request-v2' } },
      { ...received(wire), hopAdvice: { ...received(wire).hopAdvice, format: 'brewer-hop-advice-request-v99' } },
    ]) expect(() => parseHopAdviceV1WireForWizardV1(broken)).toThrow();
  });

  it('revalide le job par le seul profil Wizard; un digest recalculé ne qualifie pas un brouillon substitué', () => {
    const wizard = wizardFixture();
    const wireInput = received(wireFor(wizard));
    const job = { protocol: { ...HOP_ADVICE_PROTOCOL_V1 }, wireInput, inputDigest: hopAdviceV1InputDigest(wireInput as never) };
    expect(validateHopAdviceV1JobForWizardV1(job).semanticRequest).toEqual(wireInput.hopAdvice);
    expect(() => validateHopAdviceV1Job(job)).toThrow();
    expect(() => validateHopAdviceV1JobForWizardV1({ ...job, inputDigest: '0'.repeat(64) })).toThrow();
    const substituted = { ...wireInput, draft: received(storedRecipeA) };
    expect(() => validateHopAdviceV1JobForWizardV1({ ...job, wireInput: substituted,
      inputDigest: hopAdviceV1InputDigest(substituted as never) })).toThrow();
  });

  it('charge le contexte du worker depuis le wire draft B, jamais depuis la Recipe A du même id', () => {
    const wizard = wizardFixture(ORIGIN, wizardDraft({ name: 'Brouillon B en cours' }));
    const validated = validatedFromWire(wizard);
    expect(validated.input.scope).toEqual(wizard.scope);
    expect(() => validateHopAdviceV1ChatInputForWizardV1(parseHopAdviceV1WireForWizardV1(received(wireFor(wizard))), 'owner-other-87'))
      .toThrow();

    const profile = createBrewerHopAdviceSemanticProfileV6ForWizardV1(validated, loadContextFromWire(validated), OWNER);
    expect((profile.promptData as Record<string, unknown>).assistedReading).toEqual(brewerHopAdviceProviderInputV3ForWizardV1(wizard.request));

    expect(() => createBrewerHopAdviceSemanticProfileV6ForWizardV1(validated, contextFor(storedRecipeA), OWNER))
      .toThrow(/brouillon Wizard du wire/);
    expect(() => createBrewerHopAdviceSemanticProfileV6ForWizardV1({ ...validated, wizardDraft: received(storedRecipeA) },
      contextFor(storedRecipeA), OWNER)).toThrow();
    expect(() => createBrewerHopAdviceSemanticProfileV6ForWizardV1(validated, loadContextFromWire(validated), 'owner-other-87')).toThrow();
    expect(() => createBrewerHopAdviceSemanticProfileV6ForWizardV1(
      { ...validated, input: { ...validated.input, scope: { kind: 'draft', id: DRAFT_ID } } }, loadContextFromWire(validated), OWNER)).toThrow();
  });

  it('reste en lecture seule et refuse une sortie hors contrat', () => {
    const wizard = wizardFixture();
    const validated = validatedFromWire(wizard);
    const options = brewerHopAdviceSemanticHarnessOptionsV6ForWizardV1(validated, loadContextFromWire(validated), { ownerUid: OWNER });
    expect(Object.keys(options)).toEqual(['profile']);
    expect(options.profile.readTools).toBe(BREWER_HOP_ADVICE_READ_TOOLS);
    expect(() => options.profile.complete({ ...minimalFinishV6, extra: 'out-of-contract' } as never, [])).toThrow(/champs inconnus/);
    expect(() => options.profile.complete({ ...minimalFinishV6,
      optionProposalLinks: [{ optionId: 'assist-option-missing', proposalId: 'assist-proposal-1', evidenceIds: [] }] } as never, []))
      .toThrow(/optionProposalLinks/);
  });
});

describe('Profil Wizard V1 — ProposalV6 explicite, V5 épinglée', () => {
  it('produit une V6 liée au même Request3 Wizard que les lecteurs classiques refusent', () => {
    const wizard = wizardFixture();
    const validated = validatedFromWire(wizard);
    const profile = createBrewerHopAdviceSemanticProfileV6ForWizardV1(validated, loadContextFromWire(validated), OWNER);
    const { payload } = profile.complete(minimalFinishV6 as never, []) as { payload: unknown };

    expect(() => assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1(payload)).not.toThrow();
    const envelope = payload as Parameters<typeof brewerHopAdviceProposalEnvelopeV6ReferenceForWizardV1>[0];
    expect(envelope.requestSnapshot).toEqual(wizard.request);
    expect(brewerHopAdviceProposalEnvelopeV6ReferenceForWizardV1(envelope)).toBe(envelope.reference);
    expect(envelope.reference).toBe(hopAdviceContentReference('brewer-hop-advice-proposal-v6', withoutReference(envelope)));
    expect(() => assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1(envelope, wizard.request)).not.toThrow();
    expect(() => assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1(envelope,
      wizardFixture(ORIGIN, wizardDraft({ name: 'Autre contenu' })).request)).toThrow();
    expect(readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(received(envelope))).toMatchObject({ status: 'readOnly' });

    expect(() => assertBrewerHopAdviceProposalEnvelopeV6(envelope)).toThrow();
    expect(readBrewerHopAdviceProposalEnvelopeV6(envelope).status).toBe('invalid');
    expect(() => assertBrewerHopAdviceSemanticEnvelopeV3ForWizardV1(envelope, {
      format: 'brewer-hop-advice-proposal-v5', label: 'V5', proposalKeys: BREWER_HOP_ADVICE_SEMANTIC_PROPOSAL_KEYS_V5,
    })).toThrow(/épinglée/);
    expect(readBrewerHopAdviceProposalEnvelopeV6ForWizardV1({ ...received(envelope), format: 'brewer-hop-advice-proposal-v5' }).status)
      .toBe('invalid');

    const tamperedBody = { ...withoutReference(received(envelope)) };
    tamperedBody.requestSnapshot.contextLaunch.source.contentReference = wizardFixture(ORIGIN, wizardDraft({ name: 'C' })).source.contentReference;
    const tampered = { ...tamperedBody, reference: hopAdviceContentReference('brewer-hop-advice-proposal-v6', tamperedBody) };
    expect(readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(tampered).status).toBe('invalid');
  });
});
