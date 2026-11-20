// BK4-3 (relance r3, 20.11) : TE-27 a retiré l’atelier Houblons V5.5 de l’étape Houblons de l’assistant. Les tests qui jouaient l’atelier à travers BrewWizard
// (gestes de l’atelier, preuve de contact à froid, traces V5.5 futures) sont retirés avec lui : l’écran qu’ils jouaient n’existe plus ; la logique reste testée
// dans tests/unit (services/hopV55). Restent ici les tests qui ne passent pas par l’atelier.
// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { readRecipeDraft, recipeServerBase, serializeRecipeDraft, writeRecipeDraft, type RecipeWizardDraft } from '../../src/services/recipeDraft';
import * as recipeDraftService from '../../src/services/recipeDraft';
import type { Recipe } from '../../src/types';
import { readRecipeText, RECIPE_TEXT_HEADER_V2, writeRecipeText } from '../../src/domain/recipeTransfer';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import type { HopColdBeerContext } from '../../src/domain/hopDecision/coldIbuContact';
import { coldContactBeerContextReference, coldContactQualificationReference } from '../../src/domain/hopDecision/coldContactEvidence';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { HopQualifiedAssemblyInput } from '../../src/domain/hopDecision/qualifiedDecision';
import { adviceAssignment } from '../fixtures/hopAdviceJourney';
import { fullRecipe } from '../fixtures/fullRecipe';
import { prepareHopV55QualifiedColdContactEvidence, type HopV55QualifiedColdContactAuthorityV1,
  type HopV55QualifiedColdContactSelectionV1 } from '../../src/services/hopV55/qualifiedColdContactEvidence';
import { appendHopV55RecipeColdContactAssociation, compareHopV55RecipeColdContactAssociationSourceV1,
  createHopV55RecipeColdContactAssociationV1, hopV55RecipeColdSourceReference,
  readHopV55RecipeColdContactAssociationV1 } from '../../src/services/hopV55/recipeColdContactAssociation';
import type { HopV55RecipeColdContactChange } from '../../src/ui/hopV55/RecipeStep';

const draftKey = 'qa-cold-owner:recipe-cold-persistence';
const ownerKey = 'qa-cold-owner';
const recipeId = 'REC-COLD-PERSISTENCE';
const storageKey = 'laffinee_recipe_draft_v1:' + draftKey;
const coldDriver = vi.hoisted(() => ({
  prepare: undefined as ((recipe: unknown) => Promise<unknown>) | undefined,
  change: undefined as unknown,
}));

vi.mock('../../src/ui/hopV55/RecipeStep', async () => {
  const ReactModule = await import('react');
  return {
    HopV55RecipeStep: (props: any) => {
      const [message, setMessage] = ReactModule.useState('');
      const prepare = async () => {
        try {
          if (!coldDriver.prepare) throw new Error('Source de fixture absente.');
          coldDriver.change = await coldDriver.prepare(props.recipe);
          setMessage('Preuve froide prête depuis le contexte synthétique.');
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Préparation refusée.');
        }
      };
      const conserve = async () => {
        try {
          if (!coldDriver.change || !props.onConserveColdEvidence) throw new Error('Association ou callback absent.');
          await props.onConserveColdEvidence(coldDriver.change);
          setMessage('Preuve froide conservée.');
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Conservation refusée.');
        }
      };
      return ReactModule.createElement('section', { 'data-testid': 'cold-recipe-step-seam' },
        ReactModule.createElement('output', { 'data-testid': 'cold-step-volume' }, String(props.recipe.volumeL)),
        ReactModule.createElement('output', { 'data-testid': 'cold-step-ibu' }, String(props.recipe.ibuTarget)),
        ReactModule.createElement('output', { 'data-testid': 'cold-step-hops' }, JSON.stringify(props.recipe.hops)),
        ReactModule.createElement('output', { 'data-testid': 'cold-step-journal-count' }, String(props.recipe.hopV55ColdEvidenceAssociations?.length ?? 0)),
        ReactModule.createElement('button', { type: 'button', onClick: () => void prepare() }, 'Préparer la preuve froide'),
        ReactModule.createElement('button', { type: 'button', onClick: () => void conserve() }, 'Conserver la preuve froide'),
        message ? ReactModule.createElement('p', { 'data-testid': 'cold-status', role: message === 'Preuve froide prête depuis le contexte synthétique.' || message === 'Preuve froide conservée.' ? 'status' : 'alert' }, message) : null);
    },
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  coldDriver.prepare = undefined;
  coldDriver.change = undefined;
  vi.restoreAllMocks();
});

type Scope = { kind: 'recipe'; id: string };
interface ColdFixture {
  program: HopDecisionProgram;
  qualificationInput: HopQualifiedAssemblyInput;
  context: HopColdBeerContext;
  selection: HopV55QualifiedColdContactSelectionV1;
  authority: HopV55QualifiedColdContactAuthorityV1<Scope>;
}

function coldFixture(recipe: Recipe): ColdFixture {
  const material: HopDecisionMaterial = { id: 'material:cold-persistence-fixture', name: 'Houblon synthétique froid',
    form: 'cone', availableGrams: 1000 };
  const program: HopDecisionProgram = { id: 'program:' + recipe.id, revision: 1, stage: 'conditioning',
    volumeL: recipe.volumeL, wortGravity: null, additions: [{
      id: 'addition:cold-persistence', materialId: material.id, grams: 58.6,
      use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 14, dayOffset: 8,
    }] };
  const qualificationInput: HopQualifiedAssemblyInput = { variants: [adviceAssignment(material)] };
  const context: HopColdBeerContext = { volumeBasis: 'beerAtContact', abvPct: 4.75,
    filteredBeforeContact: true, yeastStatus: 'removedBeforeContact', contactMode: 'static',
    beerDescription: 'Bière synthétique de fixture.' };
  const scope: Scope = { kind: 'recipe', id: recipe.id };
  const scopeReference = 'recipe-scope:cold-persistence:' + recipe.id;
  const references = { programReference: programFingerprint(program),
    qualificationReference: coldContactQualificationReference(qualificationInput),
    contextReference: coldContactBeerContextReference(context) };
  const selection: HopV55QualifiedColdContactSelectionV1 = { ...references,
    additionIds: ['addition:cold-persistence'], groupingReason: 'Une seule ligne source synthétique, liée explicitement.' };
  const source = { ownerKey, scope, scopeReference, ...references, program, qualificationInput, context };
  const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
    ownerKey, scope, scopeReference,
    knownReferences: { program: new Set([references.programReference]),
      qualification: new Set([references.qualificationReference]), context: new Set([references.contextReference]) },
    resolveCanonicalSource: async requested => requested.programReference === references.programReference
      && requested.qualificationReference === references.qualificationReference
      && requested.contextReference === references.contextReference ? structuredClone(source) : null,
  };
  return { program, qualificationInput, context, selection, authority };
}

async function coldChangeFor(recipe: Recipe, associationId = 'association:cold-persistence') : Promise<HopV55RecipeColdContactChange> {
  const fixture = coldFixture(recipe);
  const prepared = await prepareHopV55QualifiedColdContactEvidence({ selection: fixture.selection, authority: fixture.authority });
  if (prepared.status !== 'ready') throw new Error('La préparation froide synthétique a été refusée.');
  const created = createHopV55RecipeColdContactAssociationV1({
    id: associationId, ownerKey, recipeId: recipe.id,
    sourceRecipeReference: hopV55RecipeColdSourceReference(recipe), evidence: prepared.evidence,
    origin: { kind: 'localCalculation' }, applicationRecord: null, applicationWitness: null,
    recordedAt: '2026-10-04T12:00:00.000Z',
  });
  if (created.status !== 'ready') throw new Error('La création d’association froide synthétique a été refusée.');
  expect(created.payload.utf8Bytes).toBeLessThanOrEqual(100_000);
  expect(created.payload.maxDepth).toBeLessThanOrEqual(18);
  return { draftId: recipe.id, association: created.association, currentSourceBinding: prepared.evidence.sourceBinding };
}

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return { ...structuredClone(fullRecipe), id: recipeId, name: 'Brouillon recette froid',
    volumeL: 20, ibuTarget: 31.25, instructions: 'Consigne manuelle sans modification.',
    hops: [{ ...structuredClone(fullRecipe.hops[0]), stage: 'dryHop', aromaTiming: 'postFermentation',
      aromaContactHours: 24, aromaTemperatureC: 14, dayOffset: 8 }],
    ...overrides };
}

function wizardDraft(source: Recipe): RecipeWizardDraft {
  return { recipe: structuredClone(source), details: structuredClone(source), step: 'houblons',
    water: { sourceReference: 'water:fixture', manualSalts: { gypse: 1.25 } } as never,
    volumesEdited: true, waterProfileAuto: false, targetBasis: 'recipe', mashRatioOverride: 2.72,
    // Same-device draft started from the saved version that the Wizard reopens (#97).
    serverBase: recipeServerBase(source) };
}

function mountWizard(initial: Recipe, onSave = vi.fn()) {
  return render(<BrewWizard ownerKey={ownerKey} seed={{ recipe: structuredClone(initial) }} draftKey={draftKey} localOnly
    stockItems={[]} config={defaultConfig} knownStyles={[]} onClose={vi.fn()} onSave={onSave}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
}

function captureStorageFixtures() {
  vi.spyOn(StorageService, 'getHopKnowledge').mockReturnValue([] as never);
  vi.spyOn(StorageService, 'getHopVarieties').mockReturnValue([] as never);
  vi.spyOn(StorageService, 'getHopLots').mockReturnValue([] as never);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [] } as never);
}

describe('preuve froide V5.5 conservée avec la recette du Wizard', () => {



  it('exporte seulement un index lisible et ne fabrique pas de preuve courante à l’import texte', async () => {
    const source = recipe();
    const change = await coldChangeFor(source);
    const future = { format: 'hop-v55-recipe-cold-evidence-association-v99', id: 'future-transfer-row',
      nested: { doNotRender: 'raw' } };
    const sourceWithJournal = { ...source, hopV55ColdEvidenceAssociations: [change.association, future] };
    const text = writeRecipeText(sourceWithJournal);

    expect(text.startsWith(RECIPE_TEXT_HEADER_V2)).toBe(true);
    expect(text).toContain('Index de 2 entrée(s) d’association froide');
    expect(text).toContain(change.association.reference);
    expect(text).toContain(change.association.evidenceReference);
    expect(text).toContain('sauvegarde complète');
    expect(text).not.toContain(JSON.stringify(change.association));
    expect(text).not.toContain('evidenceSnapshot');
    const imported = readRecipeText(text)!;
    expect(imported).not.toHaveProperty('hopV55ColdEvidenceAssociations');
    expect(source.hopV55ColdEvidenceAssociations).toBeUndefined();
  });
});