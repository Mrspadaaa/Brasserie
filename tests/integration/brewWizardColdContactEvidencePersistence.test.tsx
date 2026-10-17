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
  it('appende la fermeture exacte, garde la recette intacte et relit known+future sans requalifier la preuve', async () => {
    captureStorageFixtures();
    const future = { format: 'hop-v55-recipe-cold-evidence-association-v99', id: 'future-cold-entry',
      nested: { bytes: ['opaque', 7, null] } };
    const initial = recipe({ hopV55ColdEvidenceAssociations: [future] });
    writeRecipeDraft(draftKey, serializeRecipeDraft(wizardDraft(initial)));
    const onSave = vi.fn();
    coldDriver.prepare = async current => coldChangeFor(current as Recipe);

    const view = mountWizard(recipe({ name: 'Seed ancienne version', volumeL: 17 }), onSave);
    // The saved version differs from the draft's starting point: resuming it is an explicit choice (#97).
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre le brouillon' }));
    await screen.findByTestId('cold-recipe-step-seam');
    expect(screen.getByTestId('cold-step-volume')).toHaveTextContent('20');
    fireEvent.click(screen.getByRole('button', { name: 'Préparer la preuve froide' }));
    await screen.findByText('Preuve froide prête depuis le contexte synthétique.');
    const change = coldDriver.change as HopV55RecipeColdContactChange;
    expect(change.association.applicationRecordReference).toBeNull();
    expect(change.association.applicationWitness).toBeNull();
    expect(change.association.evidenceSnapshot.sourceBinding).toEqual(change.currentSourceBinding);
    const beforeLiveIbu = screen.getByTestId('cold-step-ibu').textContent;
    const beforeLiveHops = screen.getByTestId('cold-step-hops').textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Conserver la preuve froide' }));
    await screen.findByText('Preuve froide conservée.');
    const saved = readRecipeDraft(draftKey)!;
    const rows = saved.recipe.hopV55ColdEvidenceAssociations!;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(future);
    expect(rows[1]).toEqual(change.association);
    expect(saved.details.hopV55ColdEvidenceAssociations).toEqual(rows);
    expect(saved.recipe.hops).toEqual(initial.hops);
    expect(screen.getByTestId('cold-step-hops').textContent).toBe(beforeLiveHops);
    expect(screen.getByTestId('cold-step-ibu').textContent).toBe(beforeLiveIbu);
    expect(saved.recipe.instructions).toBe(initial.instructions);
    expect(onSave).not.toHaveBeenCalled();

    expect(compareHopV55RecipeColdContactAssociationSourceV1({ association: change.association,
      current: { ownerKey, recipeId, sourceRecipeReference: hopV55RecipeColdSourceReference(saved.recipe),
        sourceBinding: change.currentSourceBinding } })).toEqual({ status: 'current' });

    view.unmount();
    mountWizard(recipe({ name: 'Seed doit perdre face au brouillon', volumeL: 17 }), onSave);
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre le brouillon' }));
    await screen.findByTestId('cold-recipe-step-seam');
    expect(screen.getByTestId('cold-step-volume')).toHaveTextContent('20');
    expect(readRecipeDraft(draftKey)?.recipe.hopV55ColdEvidenceAssociations).toEqual(rows);
    expect(readRecipeDraft(draftKey)?.recipe.hops).toEqual(initial.hops);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('ne publie pas la mutation React si localStorage refuse, puis réessaie sans doublon', async () => {
    captureStorageFixtures();
    const future = { format: 'hop-v55-recipe-cold-evidence-association-v99', id: 'future-cold-before-write',
      nested: { retained: true } };
    const initial = recipe({ hopV55ColdEvidenceAssociations: [future] });
    writeRecipeDraft(draftKey, serializeRecipeDraft(wizardDraft(initial)));
    coldDriver.prepare = async current => coldChangeFor(current as Recipe);

    mountWizard(initial);
    await screen.findByTestId('cold-recipe-step-seam');
    const before = readRecipeDraft(draftKey)!;
    const writeDraft = vi.spyOn(recipeDraftService, 'writeRecipeDraft')
      .mockImplementationOnce(() => { throw new Error('Quota fixture'); });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer la preuve froide' }));
    await screen.findByText('Preuve froide prête depuis le contexte synthétique.');
    fireEvent.click(screen.getByRole('button', { name: 'Conserver la preuve froide' }));
    await screen.findByText('Quota fixture');
    expect(readRecipeDraft(draftKey)).toEqual(before);
    expect(readRecipeDraft(draftKey)?.recipe.hopV55ColdEvidenceAssociations).toEqual([future]);
    expect(screen.getByTestId('cold-step-journal-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'Conserver la preuve froide' }));
    await screen.findByText('Preuve froide conservée.');
    let saved = readRecipeDraft(draftKey)!;
    expect(saved.recipe.hopV55ColdEvidenceAssociations).toHaveLength(2);
    expect(screen.getByTestId('cold-step-journal-count')).toHaveTextContent('2');
    expect(saved.recipe.hopV55ColdEvidenceAssociations?.[0]).toEqual(future);
    expect(writeDraft).toHaveBeenCalledWith(draftKey, expect.any(String));

    fireEvent.click(screen.getByRole('button', { name: 'Conserver la preuve froide' }));
    await waitFor(() => { saved = readRecipeDraft(draftKey)!; expect(saved.recipe.hopV55ColdEvidenceAssociations).toHaveLength(2); });
    expect(saved.recipe.hopV55ColdEvidenceAssociations?.[1]).toEqual(coldDriver.change && (coldDriver.change as HopV55RecipeColdContactChange).association);
  });

  it('refuse une source physique modifiée sous le même Recipe ID et garde l’archive A historique', async () => {
    captureStorageFixtures();
    const future = { format: 'hop-v55-recipe-cold-evidence-association-v99', id: 'future-cold-stale',
      nested: { retained: 'yes' } };
    const initial = recipe({ volumeL: 20, hopV55ColdEvidenceAssociations: [future] });
    writeRecipeDraft(draftKey, serializeRecipeDraft(wizardDraft(initial)));
    coldDriver.prepare = async current => coldChangeFor(current as Recipe);

    mountWizard(initial);
    await screen.findByTestId('cold-recipe-step-seam');
    fireEvent.click(screen.getByRole('button', { name: 'Préparer la preuve froide' }));
    await screen.findByText('Preuve froide prête depuis le contexte synthétique.');

    fireEvent.click(screen.getAllByRole('button', { name: 'Identité' })[0]);
    const volume = screen.getByRole('textbox', { name: 'Volume en fermenteur' });
    fireEvent.change(volume, { target: { value: '23' } });
    fireEvent.blur(volume);
    fireEvent.click(screen.getAllByRole('button', { name: 'Houblons' })[0]);
    await screen.findByTestId('cold-recipe-step-seam');
    expect(screen.getByTestId('cold-step-volume')).toHaveTextContent('23');

    fireEvent.click(screen.getByRole('button', { name: 'Conserver la preuve froide' }));
    await screen.findByTestId('cold-status');
    expect(screen.getByTestId('cold-status')).toHaveTextContent('La source de cette preuve froide a changé');
    const currentDraft = readRecipeDraft(draftKey)!;
    expect(currentDraft.recipe.id).toBe(recipeId);
    expect(currentDraft.recipe.volumeL).toBe(23);
    expect(currentDraft.recipe.hopV55ColdEvidenceAssociations).toEqual([future]);
    expect(screen.getByTestId('cold-step-journal-count')).toHaveTextContent('1');

    const change = coldDriver.change as HopV55RecipeColdContactChange;
    expect(compareHopV55RecipeColdContactAssociationSourceV1({ association: change.association,
      current: { ownerKey, recipeId, sourceRecipeReference: hopV55RecipeColdSourceReference(currentDraft.recipe),
        sourceBinding: change.currentSourceBinding } })).toMatchObject({ status: 'historical' });
  });

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