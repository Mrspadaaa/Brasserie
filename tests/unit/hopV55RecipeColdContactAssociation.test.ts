// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { HOP_COLD_CONTACT_ASSESSMENT_FORMAT, type HopColdBeerContext } from '../../src/domain/hopDecision/coldIbuContact';
import { coldContactBeerContextReference, coldContactQualificationReference,
  HOP_COLD_CONTACT_EVIDENCE_FORMAT,
  readHopColdContactEvidenceV1, type HopColdContactEvidenceV1 } from '../../src/domain/hopDecision/coldContactEvidence';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { HopQualifiedAssemblyInput } from '../../src/domain/hopDecision/qualifiedDecision';
import { adviceAssignment } from '../fixtures/hopAdviceJourney';
import { hopV55FixtureRecipe } from '../fixtures/hopV55';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import type { Recipe } from '../../src/types';
import {
  HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES, HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH,
  prepareHopV55QualifiedColdContactEvidence,
  type HopV55QualifiedColdContactAuthorityV1,
  type HopV55QualifiedColdContactSelectionV1,
} from '../../src/services/hopV55/qualifiedColdContactEvidence';
import {
  appendHopV55RecipeColdContactAssociation,
  compareHopV55RecipeColdContactAssociationSourceV1,
  createHopV55RecipeColdContactAssociationV1,
  HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT,
  hopV55RecipeColdSourceReference,
  hopV55RecipeColdSourceReferenceFor,
  readHopV55RecipeColdContactAssociationV1,
  type HopV55RecipeColdContactApplicationWitnessV1,
  type HopV55RecipeColdContactAssociationV1,
} from '../../src/services/hopV55/recipeColdContactAssociation';
import { HopV55RecipeColdContactEvidencePanel } from '../../src/ui/hopV55/RecipeColdContactEvidencePanel';
import { HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, hopV55RecipeApplicationValueReference,
  type HopV55RecipeApplicationRecordV1 } from '../../src/services/hopV55/recipeDraftApplication';

afterEach(() => cleanup());

type Scope = { kind: 'recipe'; id: string };
interface ColdFixture {
  ownerKey: string;
  recipeId: string;
  sourceRecipeReference: string;
  scope: Scope;
  scopeReference: string;
  program: HopDecisionProgram;
  qualificationInput: HopQualifiedAssemblyInput;
  context: HopColdBeerContext;
  selection: HopV55QualifiedColdContactSelectionV1;
  authority: HopV55QualifiedColdContactAuthorityV1<Scope>;
}

function coldFixture(variant: 'A' | 'B' = 'A', recipeIdOverride?: string): ColdFixture {
  const ownerKey = 'owner:recipe-cold-contact-association-fixture';
  const recipeId = recipeIdOverride ?? 'recipe:cold-contact-association-fixture';
  const material: HopDecisionMaterial = { id: 'material:cold-contact-fixture', name: 'Houblon synthétique froid', form: 'cone', availableGrams: 1000 };
  const program: HopDecisionProgram = {
    id: 'program:cold-contact-association-fixture', revision: variant === 'A' ? 8 : 9,
    stage: 'conditioning', volumeL: 20, wortGravity: null,
    additions: [{ id: 'addition:cold-contact-fixture', materialId: material.id, grams: 58.6,
      use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 14, dayOffset: 8 }],
  };
  const qualificationInput: HopQualifiedAssemblyInput = { variants: [adviceAssignment({ ...material,
    name: variant === 'A' ? material.name : 'Houblon synthétique froid, fiche révisée' })] };
  const context: HopColdBeerContext = { volumeBasis: 'beerAtContact', abvPct: variant === 'A' ? 4.75 : 5,
    filteredBeforeContact: true, yeastStatus: 'removedBeforeContact', contactMode: 'static',
    beerDescription: 'Bière synthétique de fixture.' };
  const recipeSnapshot = { id: recipeId, name: variant === 'A' ? 'Brouillon source A' : 'Brouillon source B',
    volumeL: 20, hops: [{ name: material.name, weightG: 30, alpha: 8 }] };
  const sourceRecipeReference = hopDecisionReference(recipeSnapshot);
  const scope: Scope = { kind: 'recipe', id: recipeId };
  const scopeReference = 'recipe-scope:cold-contact-association-fixture';
  const references = { programReference: programFingerprint(program),
    qualificationReference: coldContactQualificationReference(qualificationInput),
    contextReference: coldContactBeerContextReference(context) };
  const selection: HopV55QualifiedColdContactSelectionV1 = { ...references,
    additionIds: ['addition:cold-contact-fixture'], groupingReason: 'Une ligne précise est conservée comme hypothèse de contact.' };
  const source = { ownerKey, scope, scopeReference, ...references, program, qualificationInput, context };
  const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
    ownerKey, scope, scopeReference,
    knownReferences: { program: new Set([references.programReference]),
      qualification: new Set([references.qualificationReference]), context: new Set([references.contextReference]) },
    resolveCanonicalSource: async requested => requested.programReference === references.programReference
      && requested.qualificationReference === references.qualificationReference && requested.contextReference === references.contextReference
      ? structuredClone(source) : null,
  };
  return { ownerKey, recipeId, sourceRecipeReference, scope, scopeReference, program, qualificationInput, context, selection, authority };
}

async function coldEvidence(fixture: ColdFixture): Promise<HopColdContactEvidenceV1> {
  const prepared = await prepareHopV55QualifiedColdContactEvidence({ selection: fixture.selection, authority: fixture.authority });
  if (prepared.status !== 'ready') throw new Error(`Preuve froide canonique attendue : ${JSON.stringify(prepared)}.`);
  return prepared.evidence;
}

function createAssociation(input: { fixture: ColdFixture; evidence: unknown; id?: string; origin?: unknown;
  applicationRecord?: unknown | null; applicationWitness?: unknown | null }) {
  return createHopV55RecipeColdContactAssociationV1({
    id: input.id ?? 'association:cold-contact:A', ownerKey: input.fixture.ownerKey, recipeId: input.fixture.recipeId,
    sourceRecipeReference: input.fixture.sourceRecipeReference, evidence: input.evidence,
    origin: input.origin ?? { kind: 'localCalculation' }, applicationRecord: input.applicationRecord ?? null,
    applicationWitness: input.applicationWitness ?? null, recordedAt: '2026-10-04T12:00:00.000Z',
  });
}

function applicationRecord(fixture: ColdFixture, tag: string): HopV55RecipeApplicationRecordV1 {
  const body: Omit<HopV55RecipeApplicationRecordV1, 'reference'> = {
    format: HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, id: `application:${tag}`,
    ownerKey: fixture.ownerKey, recipeId: fixture.recipeId, workspaceId: 'workspace:cold-contact-fixture',
    appliedAt: '2026-10-04T11:50:00.000Z', scenarioId: `scenario:${tag}`,
    snapshotReference: `snapshot:${tag}`, branchId: `branch:${tag}`, branchReference: `branch-reference:${tag}`,
    copyPreviewReference: `copy-preview:${tag}`, recipePreviewReference: `recipe-preview:${tag}`,
    sourceRecipeReference: hopV55RecipeApplicationValueReference('sourceRecipe', fixture.sourceRecipeReference),
    hopsReference: hopV55RecipeApplicationValueReference('hops', []), alphaChoices: {},
    assumptions: [], conditions: [], dossierReference: `dossier-reference:${tag}`,
    programApplicationReference: `program-application-reference:${tag}`,
  };
  return { ...body, reference: hopAdviceContentReference(HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, body) };
}

function applicationWitness(record: HopV55RecipeApplicationRecordV1, evidence: HopColdContactEvidenceV1): HopV55RecipeColdContactApplicationWitnessV1 {
  return {
    applicationRecordReference: record.reference, scenarioId: record.scenarioId, snapshotReference: record.snapshotReference,
    branchId: record.branchId, branchReference: record.branchReference, copyPreviewReference: record.copyPreviewReference,
    recipePreviewReference: record.recipePreviewReference, dossierReference: record.dossierReference!,
    programApplicationReference: record.programApplicationReference!,
    scopeReference: evidence.sourceBinding.scopeReference, programReference: evidence.sourceBinding.programReference,
    qualificationReference: evidence.sourceBinding.qualificationReference, contextReference: evidence.sourceBinding.contextReference,
    contactReference: evidence.sourceBinding.contactReference,
  };
}

function futureChildEvidence(evidence: HopColdContactEvidenceV1): HopColdContactEvidenceV1 {
  const future = structuredClone(evidence);
  future.assessment.referenceResult = { ...future.assessment.referenceResult, format: 'cold-hop-bu-reference-result-v3',
    version: 'hop-cold-bu-reference-v3', futureFields: { kept: true } } as unknown as typeof future.assessment.referenceResult;
  const { reference: _assessmentReference, ...assessmentBody } = future.assessment;
  future.assessment.reference = hopAdviceContentReference(HOP_COLD_CONTACT_ASSESSMENT_FORMAT, assessmentBody);
  const { reference: _evidenceReference, ...evidenceBody } = future;
  future.reference = hopAdviceContentReference(HOP_COLD_CONTACT_EVIDENCE_FORMAT, evidenceBody);
  return future;
}

describe('association autonome d’une preuve de contact froid à une recette', () => {
  it('garde la référence J4 de la source stable après ajout du journal, mais suit les champs de recette', async () => {
    const recipe = hopV55FixtureRecipe('recipe:cold-source-reference');
    const sourceRecipeReference = hopV55RecipeColdSourceReference(recipe);
    const fixture = coldFixture('A', recipe.id);
    fixture.sourceRecipeReference = sourceRecipeReference;
    const evidence = await coldEvidence(fixture);
    const created = createAssociation({ fixture, evidence, id: 'association:source-reference' });
    if (created.status !== 'ready') throw new Error(`Association de fixture attendue : ${JSON.stringify(created)}.`);

    const withAssociation = { ...recipe, hopV55ColdEvidenceAssociations: [created.association] };
    expect(hopV55RecipeColdSourceReference(withAssociation)).toBe(sourceRecipeReference);

    const changedMass = structuredClone(withAssociation);
    changedMass.hops[0].weightG += 1;
    expect(hopV55RecipeColdSourceReference(changedMass)).not.toBe(sourceRecipeReference);
    const changedVolume = { ...withAssociation, volumeL: withAssociation.volumeL + 1 };
    expect(hopV55RecipeColdSourceReference(changedVolume)).not.toBe(sourceRecipeReference);
    const changedApplicationHistory = { ...recipe, hopV55Applications: [{ id: 'j4-history-fixture' }] };
    expect(hopV55RecipeColdSourceReference(changedApplicationHistory)).not.toBe(sourceRecipeReference);
    expect(recipe.hopV55ColdEvidenceAssociations).toBeUndefined();
  });

  it('ne lit de la levure que l’ensemencé et l’hypothèse propre, et relit une preuve conservée sous sa règle d’origine (décision n°22)', async () => {
    const recipe = hopV55FixtureRecipe('recipe:cold-source-yeast');
    recipe.yeast = { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' };
    const reference = hopV55RecipeColdSourceReference(recipe);
    // The Recap completion only adds catalogue identity and documentary facts: same source.
    const completedYeast = completeFromLocalReferences([], [], structuredClone(recipe.yeast), [], []).yeast;
    expect(completedYeast.hopIndexId).toBeTruthy();
    const completed = { ...recipe, yeast: completedYeast };
    expect(hopV55RecipeColdSourceReference(completed)).toBe(reference);
    for (const yeast of [{ ...recipe.yeast, name: 'US-04' }, { ...recipe.yeast, qty: 2 },
      { ...recipe.yeast, attenuationPct: 78, attenuationBasis: 'recipe' as const }]) {
      expect(hopV55RecipeColdSourceReference({ ...recipe, yeast })).not.toBe(reference);
    }

    // An association sealed under rule 1 (whole recipe except the journal) keeps being read under that rule.
    const { hopV55ColdEvidenceAssociations: _journal, ...whole } = completed;
    const ruleOne = hopDecisionReference(whole);
    expect(ruleOne).not.toBe(hopV55RecipeColdSourceReference(completed));
    const fixture = { ...coldFixture('A', recipe.id), sourceRecipeReference: ruleOne };
    const evidence = await coldEvidence(fixture);
    const created = createAssociation({ fixture, evidence, id: 'association:rule-one' });
    if (created.status !== 'ready') throw new Error(`Association règle 1 attendue : ${JSON.stringify(created)}.`);
    const compare = (current: Recipe) => compareHopV55RecipeColdContactAssociationSourceV1({ association: created.association,
      current: { ownerKey: fixture.ownerKey, recipeId: recipe.id, sourceBinding: evidence.sourceBinding,
        sourceRecipeReference: hopV55RecipeColdSourceReferenceFor(created.association.sourceRecipeReference, current) } });
    expect(compare(completed)).toEqual({ status: 'current' });
    const heavier = structuredClone(completed);
    heavier.hops[0].weightG += 1;
    expect(compare(heavier)).toMatchObject({ status: 'historical', mismatches: ['sourceRecipeReference'] });
    // A proof conserved under the current rule is read under the current rule.
    expect(hopV55RecipeColdSourceReferenceFor(reference, completed)).toBe(reference);
  });

  // REV-WIZ M3 (cases 1 and 2 of its rule-reader probe): a rule 1 proof is never judged current after any yeast change.
  const ruleOneReference = (recipe: Recipe) => {
    const { hopV55ColdEvidenceAssociations: _journal, ...whole } = recipe;
    return hopDecisionReference(whole);
  };
  const judged = (stored: string, recipe: Recipe) =>
    hopV55RecipeColdSourceReferenceFor(stored, recipe) === stored ? 'current' : 'historical';
  const withPitchedYeast = (id: string): Recipe => {
    const recipe = hopV55FixtureRecipe(id);
    recipe.yeast = { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' };
    return recipe;
  };
  const completedRecipe = (recipe: Recipe): Recipe =>
    ({ ...recipe, yeast: completeFromLocalReferences([], [], structuredClone(recipe.yeast), [], []).yeast });

  it('rend historique une preuve règle 1 après tout changement de levure, même non ensemencé, et la règle 2 reste courante', () => {
    const completed = completedRecipe(withPitchedYeast('recipe:cold-rule-one-yeast'));
    const stored = ruleOneReference(completed);
    expect(judged(stored, completed)).toBe('current');
    for (const patch of [{ technicalSource: 'https://example.test/autre' }, { fermTempMaxC: 25 }, { hopIndexId: 'fermentis-s04' }, { lab: 'Autre' }]) {
      const changed = { ...completed, yeast: { ...completed.yeast, ...patch } };
      expect(judged(stored, changed), `règle 1 ${JSON.stringify(patch)}`).toBe('historical');
      expect(judged(hopV55RecipeColdSourceReference(completed), changed), `règle 2 ${JSON.stringify(patch)}`).toBe('current');
    }
    const heavier = structuredClone(completed);
    heavier.hops[0].weightG += 1;
    expect(judged(stored, heavier)).toBe('historical');
    expect(judged(stored, { ...completed, name: `${completed.name} bis` })).toBe('historical');
  });

  it('rend historique après complétion une preuve règle 1 d’une recette jamais complétée, sauf levure sans identité ni fait documentaire', () => {
    const raw = withPitchedYeast('recipe:cold-rule-one-completion');
    expect(judged(ruleOneReference(raw), completedRecipe(raw))).toBe('historical');
    const bare = { ...raw, yeast: { name: 'US-05', qty: 1, unit: 'sachet' } } as Recipe;
    expect(judged(ruleOneReference(bare), completedRecipe(bare))).toBe('current');
  });

  it('conserve la fermeture canonique complète en local sans receipt ni preuve de tour inventés', async () => {
    const fixture = coldFixture('A');
    const evidence = await coldEvidence(fixture);
    const before = structuredClone(evidence);
    const created = createAssociation({ fixture, evidence });
    expect(created.status).toBe('ready');
    if (created.status !== 'ready') throw new Error('Association locale valide attendue.');
    const { association, payload } = created;
    expect(association.format).toBe(HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT);
    expect(association).toMatchObject({ ownerKey: fixture.ownerKey, recipeId: fixture.recipeId,
      sourceRecipeReference: fixture.sourceRecipeReference, evidenceReference: evidence.reference,
      origin: { kind: 'localCalculation' }, applicationRecordReference: null, applicationWitness: null });
    expect(association.evidenceSnapshot).toEqual(evidence);
    expect(association.evidenceSnapshot.protocolSupplement).toEqual(evidence.protocolSupplement);
    expect(association.evidenceSnapshot.assessment.limitations).toEqual(evidence.assessment.limitations);
    expect(association.evidenceSnapshot.sourceBinding).toEqual(evidence.sourceBinding);
    expect(association.evidenceSnapshot.assessment.targetAssessment.valueBU).toBeNull();
    expect(association.origin).not.toHaveProperty('evidenceId');
    expect(evidence).toEqual(before);
    expect(fixture.program.additions[0].grams).toBe(58.6);
    expect(payload.utf8Bytes).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES);
    expect(payload.maxDepth).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH);
    expect(readHopV55RecipeColdContactAssociationV1(association)).toMatchObject({ status: 'readOnly',
      applicationLink: { status: 'notApplicable' }, association });

    const recipeOrigin = { id: fixture.recipeId, sourceReference: fixture.sourceRecipeReference, hopV55ColdContactAssociations: [association] };
    expect(recipeOrigin.sourceReference).toBe(association.sourceRecipeReference);
    expect(readHopV55RecipeColdContactAssociationV1(recipeOrigin.hopV55ColdContactAssociations[0])).toMatchObject({
      status: 'readOnly', association: { reference: association.reference },
    });
  });

  it('lie un receipt J4 exact par source, branche et programme; refuse un reçu homonyme d’une autre source', async () => {
    const fixtureA = coldFixture('A');
    const evidenceA = await coldEvidence(fixtureA);
    const receiptA = applicationRecord(fixtureA, 'A');
    const witnessA = applicationWitness(receiptA, evidenceA);
    const created = createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:applied:A',
      applicationRecord: receiptA, applicationWitness: witnessA });
    expect(created.status).toBe('ready');
    if (created.status !== 'ready') throw new Error('Association liée au receipt J4 exact attendue.');
    expect(created.association.applicationRecordReference).toBe(receiptA.reference);
    expect(created.association.applicationWitness).toEqual(witnessA);
    expect(readHopV55RecipeColdContactAssociationV1(created.association, receiptA)).toMatchObject({ status: 'readOnly',
      applicationLink: { status: 'verified', reference: receiptA.reference } });

    const fixtureB = coldFixture('B'); // même owner/recipe ID, autre snapshot source et programme
    const receiptB = applicationRecord(fixtureB, 'B');
    const wrongSource = createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:wrong-source',
      applicationRecord: receiptB, applicationWitness: applicationWitness(receiptB, evidenceA) });
    // The visible reason is French; the exact structured key stays in `mismatches`.
    expect(wrongSource).toMatchObject({ status: 'blocked', mismatches: expect.arrayContaining(['application.sourceRecipeReference']),
      reason: expect.stringContaining('brouillon d’origine de l’application') });
    expect((wrongSource as { reason: string }).reason).not.toMatch(/(?:application|evidence)\.[A-Za-z]/u);

    const wrongProgramWitness = { ...witnessA, programReference: 'program:other' };
    const wrongProgram = createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:wrong-program',
      applicationRecord: receiptA, applicationWitness: wrongProgramWitness });
    expect(wrongProgram).toMatchObject({ status: 'blocked', mismatches: expect.arrayContaining(['evidence.programReference']),
      reason: expect.stringContaining('programme de houblonnage') });

    const wrongBranchWitness = { ...witnessA, branchId: 'branch:other' };
    const wrongBranch = createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:wrong-branch',
      applicationRecord: receiptA, applicationWitness: wrongBranchWitness });
    expect(wrongBranch).toMatchObject({ status: 'blocked', mismatches: expect.arrayContaining(['application.branchId']),
      reason: expect.stringContaining('branche appliquée') });

    expect(createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:no-witness',
      applicationRecord: receiptA, applicationWitness: null })).toMatchObject({ status: 'blocked' });
    expect(createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:witness-without-receipt',
      applicationRecord: null, applicationWitness: witnessA })).toMatchObject({ status: 'blocked' });
  });

  it('garde l’association A comme historique après une nouvelle source B et append sans écraser', async () => {
    const fixtureA = coldFixture('A');
    const evidenceA = await coldEvidence(fixtureA);
    const createdA = createAssociation({ fixture: fixtureA, evidence: evidenceA, id: 'association:A' });
    if (createdA.status !== 'ready') throw new Error('Association A attendue.');
    const associationA = createdA.association;
    const currentA = { ownerKey: fixtureA.ownerKey, recipeId: fixtureA.recipeId,
      sourceRecipeReference: fixtureA.sourceRecipeReference, sourceBinding: evidenceA.sourceBinding };
    expect(compareHopV55RecipeColdContactAssociationSourceV1({ association: associationA, current: currentA }))
      .toEqual({ status: 'current' });

    const fixtureB = coldFixture('B');
    const evidenceB = await coldEvidence(fixtureB);
    const createdB = createAssociation({ fixture: fixtureB, evidence: evidenceB, id: 'association:B' });
    if (createdB.status !== 'ready') throw new Error('Association B attendue.');
    const currentB = { ownerKey: fixtureB.ownerKey, recipeId: fixtureB.recipeId,
      sourceRecipeReference: fixtureB.sourceRecipeReference, sourceBinding: evidenceB.sourceBinding };
    const stale = compareHopV55RecipeColdContactAssociationSourceV1({ association: associationA, current: currentB });
    expect(stale).toMatchObject({ status: 'historical', mismatches: expect.arrayContaining([
      'sourceRecipeReference', 'evidence.programReference', 'evidence.qualificationReference', 'evidence.contextReference',
    ]) });
    expect(associationA.evidenceSnapshot).toEqual(evidenceA);
    expect(associationA.reference).toBe(createdA.association.reference);

    const futureRaw = { format: 'hop-v55-recipe-cold-evidence-association-v99', id: 'association:future', opaque: 'kept' };
    const history = appendHopV55RecipeColdContactAssociation([futureRaw], associationA);
    const historyB = appendHopV55RecipeColdContactAssociation(history, createdB.association);
    expect(historyB).toEqual([futureRaw, associationA, createdB.association]);
    expect(appendHopV55RecipeColdContactAssociation(historyB, createdB.association)).toEqual(historyB);
    expect(readHopV55RecipeColdContactAssociationV1(historyB[1])).toMatchObject({ status: 'readOnly', association: associationA });
    expect(compareHopV55RecipeColdContactAssociationSourceV1({ association: associationA, current: currentB }).status).toBe('historical');
    expect(compareHopV55RecipeColdContactAssociationSourceV1({ association: createdB.association, current: currentB }).status).toBe('current');
  });

  it('refuse lisiblement, sans écrire, un ajout qui ferait dépasser au journal froid sa taille sûre de document', async () => {
    const fixtureA = coldFixture('A');
    const created = createAssociation({ fixture: fixtureA, evidence: await coldEvidence(fixtureA), id: 'association:bounded' });
    if (created.status !== 'ready') throw new Error('Association attendue.');
    // Opaque future rows count as they are stored: the journal is measured whole, never rewritten.
    const filler = (bytes: number) => ({ format: 'hop-v55-recipe-cold-evidence-association-v99', id: `future:filler-${bytes}`, raw: 'x'.repeat(bytes) });

    const nearlyFull = [filler(650_000)];
    const before = JSON.stringify(nearlyFull);
    expect(() => appendHopV55RecipeColdContactAssociation(nearlyFull, created.association))
      .toThrow(/taille maximale.*aucune preuve n’est ajoutée/u);
    expect(JSON.stringify(nearlyFull)).toBe(before);

    // Control: the same proof is appended to a journal well below the bound.
    const roomy = appendHopV55RecipeColdContactAssociation([filler(100_000)], created.association);
    expect(roomy).toHaveLength(2);
    // An exact replay adds nothing and stays accepted even when the stored journal is already large.
    expect(appendHopV55RecipeColdContactAssociation([filler(650_000), created.association], created.association)).toHaveLength(2);
  });

  it('ne crée aucune association pour un enfant froid futur ou une enveloppe connue corrompue', async () => {
    const fixture = coldFixture('A');
    const evidence = await coldEvidence(fixture);
    const future = futureChildEvidence(evidence);
    const futureRead = readHopColdContactEvidenceV1(future);
    if (futureRead.status !== 'unsupportedFormat') throw new Error('Futur enfant froid non préservé : ' + JSON.stringify(futureRead));
    expect(futureRead.raw).toEqual(future);
    const futureAssociation = createAssociation({ fixture, evidence: future, id: 'association:future-child' });
    expect(futureAssociation).toMatchObject({ status: 'unsupported' });
    expect(futureAssociation).not.toHaveProperty('association');

    const corrupt = structuredClone(future);
    Object.assign(corrupt.protocolSupplement.hopStorage, { temperatureC: -18 });
    expect(readHopColdContactEvidenceV1(corrupt)).toMatchObject({ status: 'invalid' });
    const corruptAssociation = createAssociation({ fixture, evidence: corrupt, id: 'association:corrupt-future-child' });
    expect(corruptAssociation).toMatchObject({ status: 'blocked' });
    expect(corruptAssociation).not.toHaveProperty('association');

    const validAssociation = createAssociation({ fixture, evidence, id: 'association:sealed' });
    if (validAssociation.status !== 'ready') throw new Error('Association valide attendue.');
    const tampered = { ...validAssociation.association, evidenceReference: 'evidence:other' };
    expect(readHopV55RecipeColdContactAssociationV1(tampered)).toMatchObject({ status: 'invalid', raw: tampered });
    const futureAssociationFormat = { ...validAssociation.association, format: 'hop-v55-recipe-cold-evidence-association-v99' };
    expect(readHopV55RecipeColdContactAssociationV1(futureAssociationFormat)).toMatchObject({
      status: 'unsupportedReadOnly', raw: futureAssociationFormat,
    });
  });

  it('affiche provenance et limites, puis remet au host le même record sans action d’application', async () => {
    const fixture = coldFixture('A');
    const evidence = await coldEvidence(fixture);
    const created = createAssociation({ fixture, evidence, id: 'association:panel-local' });
    if (created.status !== 'ready') throw new Error('Association locale attendue pour le panneau.');
    const onConserve = vi.fn(async (_association: HopV55RecipeColdContactAssociationV1) => undefined);
    render(createElement(HopV55RecipeColdContactEvidencePanel, {
      entry: { status: 'proposed', association: created.association }, onConserve,
    }));
    expect(screen.getByText(/Calcul local V5\.5/u)).toBeTruthy();
    expect(screen.getByText('BU cible de la bière')).toBeTruthy();
    expect(screen.getByText('Aucune valeur cible calculée')).toBeTruthy();
    expect(screen.getByText(/O₂ dissous < 110 µg\/L avant le prélèvement de bière filtrée/u)).toBeTruthy();
    expect(screen.getByText(/teneur en O₂ de la bière de cette recette n’est pas renseignée/u)).toBeTruthy();
    expect(screen.queryByText(/avant contact avec O₂ dissous/u)).toBeNull();
    expect(screen.getByRole('button', { name: 'Conserver cette preuve avec la recette' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /appliquer|confirmer/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette preuve avec la recette' }));
    await waitFor(() => expect(onConserve).toHaveBeenCalledTimes(1));
    expect(onConserve.mock.calls[0][0]).toBe(created.association);

    cleanup();
    render(createElement(HopV55RecipeColdContactEvidencePanel, {
      entry: { status: 'historical', association: created.association, reason: 'La recette A→B a changé.' }, onConserve,
    }));
    expect(screen.getByText(/Historique · source actuelle non vérifiée/u)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('La recette A→B a changé.');
    expect(screen.queryByRole('button', { name: 'Conserver cette preuve avec la recette' })).toBeNull();
  });
});
