// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { BrewingMath } from '../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import type { BrewhouseProfile, Recipe } from '../../src/types';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { hopV55RecipeApplicationValueReference, readHopV55RecipeApplication } from '../../src/services/hopV55/recipeDraftApplication';
import { readRecipeDraftState } from '../../src/services/recipeDraft';
import * as recipeDraftApplication from '../../src/services/hopV55/recipeDraftApplication';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import { allerEtape } from '../helpers/wizard';

const runtimeState = vi.hoisted(() => ({
  workspaceDatabase: undefined as unknown,
  scenarios: undefined as unknown,
  options: [] as Array<{ ownerKey: string; context: (source?: unknown) => Promise<BrewerContext> }>,
  materialCount: 0 as number,
  materialId: '' as string,
}));

// The real runtime runs (context resolution, catalogue references, workspace
// repository); only its two local storage engines are memory adapters.
vi.mock('../../src/services/hopV55/runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/services/hopV55/runtime')>();
  return { ...actual, createHopV55Services: (options: Parameters<typeof actual.createHopV55Services>[0]) => {
    runtimeState.options.push(options as typeof runtimeState.options[number]);
    return { ...actual.createHopV55Services({ ...options, workspaceDatabase: runtimeState.workspaceDatabase as never }),
      scenarios: runtimeState.scenarios as never };
  } };
});
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
// Presentation-heavy V5.5 panels only: the program editor becomes an explicit
// J1 composition driver and the comparison a branch chooser.
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => {
  const ReactModule = await import('react');
  const { prepareHopV55DecisionProgram } = await import('../../src/services/hopV55/decisionProgramPreparation');
  function FixtureProgramEditor(props: any) {
    const [message, setMessage] = ReactModule.useState('');
    const compose = () => {
      const program = props.editableProgram ?? props.referenceProgram ?? props.prepared?.runtime.current?.program;
      const material = props.prepared?.runtime.materials.find((row: { id?: unknown }) => typeof row.id === 'string' && row.id);
      if (!program || !material) { setMessage('Programme ou matière absent du contexte préparé.'); return; }
      runtimeState.materialCount = props.prepared.runtime.materials.length;
      runtimeState.materialId = material.id;
      const result = prepareHopV55DecisionProgram({ branch: { id: 'branch:wizard-v55', label: 'Premier moût composé' }, program,
        materials: props.prepared.runtime.materials,
        intent: { question: 'Ajouter un premier moût au brouillon.', interpretation: 'Composition explicite de fixture.', criteria: [] },
        operations: [{ id: 'exploration-operation:wizard-v55', label: 'Ajouter explicitement au programme', kind: 'add' as const,
          additionId: 'scenario-hop:wizard-v55', materialId: material.id, grams: 25, use: 'firstWort' as const }] });
      if (result.status !== 'ready' || !result.branch) { setMessage(`Préparation J1 refusée : ${result.status}`); return; }
      props.onCommit(result.branch);
    };
    return ReactModule.createElement('div', null,
      ReactModule.createElement('button', { type: 'button', onClick: compose }, 'Composer l’ajout de fixture'),
      message ? ReactModule.createElement('p', { role: 'alert' }, message) : null);
  }
  return { ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: FixtureProgramEditor };
});
vi.mock('../../src/ui/hopV55/Comparison', async () => {
  const ReactModule = await import('react');
  return { HopV55Comparison: (props: any) => {
    const branch = props.result.branches[0];
    return ReactModule.createElement('button', { type: 'button', disabled: !branch || !props.onChooseBranch,
      onClick: () => branch && props.onChooseBranch?.(branch.id) }, 'Choisir la branche d’essai');
  } };
});
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));
// Busy-guard seam (REV-WIZ M4): the Lots/COA editor's async reference choice becomes an explicit pending state.
vi.mock('../../src/ui/hopIndex/HopRecipeGuide', async () => {
  const ReactModule = await import('react');
  return { HopRecipeGuide: (props: { onBusyChange?(busy: boolean): void }) => ReactModule.createElement('button',
    { type: 'button', onClick: () => props.onBusyChange?.(true) }, 'Commencer une référence en cours') };
});

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); } catch (error) {
        this.workspaces.rows.clear(); for (const [key, row] of snapshot) this.workspaces.rows.set(key, row); throw error;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined); return operation;
  }
  close() {}
}

class MemoryScenarioTable implements BrewingScenarioLocalTable<any> {
  readonly rows = new Map<string, any>();
  constructor(private readonly secondKey: 'scenarioId' | 'eventId') {}
  private key(value: unknown) {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as Record<string, unknown>;
    return JSON.stringify([row.ownerKey, row[this.secondKey]]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: any) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: any) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()].filter(row => {
    if (index === 'ownerKey') return row.ownerKey === key;
    if (index === '[ownerKey+scenarioId]') return JSON.stringify([row.ownerKey, row.scenarioId]) === JSON.stringify(key);
    return false;
  }).map(row => structuredClone(row)) }) }; }
}

class MemoryScenarioDatabase implements BrewingScenarioLocalDatabaseAdapter {
  readonly dossiers = new MemoryScenarioTable('scenarioId');
  readonly events = new MemoryScenarioTable('eventId');
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const dossiers = new Map([...this.dossiers.rows].map(([key, row]) => [key, structuredClone(row)]));
      const events = new Map([...this.events.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); } catch (error) {
        this.dossiers.rows.clear(); for (const [key, row] of dossiers) this.dossiers.rows.set(key, row);
        this.events.rows.clear(); for (const [key, row] of events) this.events.rows.set(key, row); throw error;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined); return operation;
  }
  close() {}
}

// The explicit owner differs on purpose from the account part of the draft key: it is never parsed from it.
const OWNER = 'owner:wizard-explicit';
const DRAFT_KEY = 'uid-in-draft-key:wizard-draft-1';

/** Nonempty synthetic catalogue for the host/persistence path; full-catalogue Q09 is covered separately. */
function recipeStepCatalogueReferences() {
  const variety: HopVariety = { id: 'wizard-synthetic-alpha-unknown', name: 'Houblon synthétique sans analyse',
    aliases: [], form: 'unknown', descriptions: [], analysis: [] };
  return { varieties: [variety], knowledge: [] };
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockImplementation(async () => recipeStepCatalogueReferences());
  runtimeState.workspaceDatabase = new MemoryWorkspaceDatabase();
  runtimeState.scenarios = createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
  runtimeState.options = [];
  runtimeState.materialCount = 0;
  runtimeState.materialId = '';
});
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); localStorage.clear(); });

function savedRecipe(): Recipe {
  const profile: BrewhouseProfile = { id: 'my-rig', name: 'Cuve personnelle', volumeL: 26, efficiencyPct: 75,
    boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment },
    preferences: { ...practicalBrewingPreferences } };
  const water = BrewingMath.waterVolumes(2.5, 26, profile, 'batch', 60, 0);
  const fixture = fixtureRecipe();
  return { ...fixture, id: 'recipe-wizard-v55', name: 'Pale enregistrée', brewhouse: profile, volumeL: 26, totalGristKg: 2.5,
    installation: { manualWaterSplit: false, fermenterHeadspacePct: 10, spargeExceptionAccepted: false },
    hops: [], fermentables: [{ ...fixture.fermentables[0], weightKg: 2.5 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], ratioLPerKg: water.mashWaterL / 2.5, spargeType: 'batch' },
    preBoilL: water.preBoilVolumeL, preBoilHotL: water.preBoilHotL,
    waterPlan: { ...fixture.waterPlan!, sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE,
      mashWaterL: water.mashWaterL, spargeWaterL: water.spargeWaterL },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
}

function mount(recipe: Recipe, options: { ownerKey?: string; draftKey?: string } = { ownerKey: OWNER, draftKey: DRAFT_KEY }) {
  const save = vi.fn();
  return { save, ...render(<BrewWizard localOnly ownerKey={options.ownerKey} draftKey={options.draftKey} seed={{ recipe }}
    config={{ ...defaultConfig, brewhouses: [recipe.brewhouse!], activeBrewhouseId: recipe.brewhouse!.id }}
    stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />) };
}

/** Décider → compose J1 → J5 → choose the branch → preview on the live draft (alpha chosen if asked) → apply. */
async function previewFixtureProgram(host: HTMLElement) {
  const step = within(host);
  await step.findByTestId('hop-v55', {}, { timeout: 5000 });
  fireEvent.click(step.getByRole('button', { name: 'Décider' }));
  fireEvent.click(await step.findByRole('button', { name: 'Composer l’ajout de fixture' }));
  expect(runtimeState.materialCount).toBe(1);
  expect(runtimeState.materialId).toBe('variety:wizard-synthetic-alpha-unknown');
  const choose = await step.findByRole('button', { name: 'Choisir la branche d’essai' }, { timeout: 5000 });
  await waitFor(() => expect(choose).toBeEnabled());
  fireEvent.click(choose);
  fireEvent.click(await step.findByRole('button', { name: 'Prévisualiser l’application au brouillon' }, { timeout: 5000 }));
  await waitFor(() => expect(step.queryByRole('button', { name: 'Appliquer au brouillon de recette' })
    ?? step.queryByText(/Alpha à choisir avant application/)).toBeTruthy(), { timeout: 5000 });
  if (step.queryByText(/Alpha à choisir avant application/)) {
    fireEvent.change(step.getByRole('textbox', { name: /^Alpha de travail pour / }), { target: { value: '9' } });
    fireEvent.change(step.getByRole('textbox', { name: /^Motif du choix alpha pour / }), { target: { value: 'Nominal du sachet prévu, à vérifier sur le lot.' } });
    fireEvent.click(step.getByRole('button', { name: 'Recalculer l’aperçu avec ces choix' }));
  }
  await step.findByRole('button', { name: 'Appliquer au brouillon de recette' }, { timeout: 5000 });
  return step;
}

describe('BrewWizard — étape Houblons V5.5 native', () => {
  it('reprend le même identifiant après un refus de stockage puis relit une seule trace avant l’enregistrement', async () => {
    const seed = savedRecipe();
    const getRecipes = vi.spyOn(StorageService, 'getRecipes').mockReturnValue([{ ...seed, name: 'Version enregistrée du même ID',
      hops: [{ name: 'Ancien houblon', alpha: 5, weightG: 10, stage: 'boil', timeMin: 60 }] }] as never);
    const first = mount(seed);
    fireEvent.change(document.getElementById('wz-title') as HTMLInputElement, { target: { value: 'Pale V5.5 non enregistrée' } });
    allerEtape(/^Houblons$/);

    const host = await screen.findByTestId('recipe-hop-v55', {}, { timeout: 5000 });
    expect(host).toHaveAttribute('data-draft-id', seed.id);
    await within(host).findByTestId('hop-v55', {}, { timeout: 5000 });
    // The previous tools are no longer the hop step: no legacy workbench, workshop, simulate shortcut, link-out or iframe.
    expect(screen.queryByText('Comparer et simuler les houblons')).toBeNull();
    expect(screen.queryByText(/Recherche avancée · arômes, essais et analyses/)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Simuler l’ajout/ })).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getByText(/Corriger les lignes de houblon · 0/)).toBeInTheDocument();

    // The real service is opened for the explicit owner and resolves the live draft, never the saved recipe of the same ID.
    expect(runtimeState.options.at(-1)?.ownerKey).toBe(OWNER);
    getRecipes.mockClear();
    const context = await runtimeState.options.at(-1)!.context({ kind: 'recipe', recipeId: seed.id });
    expect((context.recipe as Recipe).name).toBe('Pale V5.5 non enregistrée');
    expect((context.recipe as Recipe).hops).toEqual([]);
    expect(context.batch).toBeUndefined();
    expect(getRecipes).not.toHaveBeenCalled();
    await expect(runtimeState.options.at(-1)!.context({ kind: 'recipe', recipeId: 'recipe-other' })).rejects.toThrow(/aucune recette enregistrée n’est substituée/);

    const step = await previewFixtureProgram(host);
    const persistedBefore = readRecipeDraftState(DRAFT_KEY);
    if (persistedBefore.status !== 'available') throw new Error('Le brouillon Wizard synthétique doit être conservé avant l’application.');
    const refusedDraftBytes = persistedBefore.raw;
    const storageKey = `laffinee_recipe_draft_v1:${DRAFT_KEY}`;
    const nativeSetItem = Storage.prototype.setItem;
    let refuseNextDraftWrite = true;
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === storageKey && refuseNextDraftWrite) {
        refuseNextDraftWrite = false;
        throw new Error('Fixture : écriture locale refusée une fois.');
      }
      return nativeSetItem.call(this, key, value);
    });
    const targetGuard = vi.spyOn(recipeDraftApplication, 'assertHopV55RecipeDraftApplicationTarget');
    const applicationBuilder = vi.spyOn(recipeDraftApplication, 'applyHopV55RecipeDraftApplication');

    fireEvent.click(step.getByRole('button', { name: 'Appliquer au brouillon de recette' }));
    expect(await step.findByRole('alert')).toHaveTextContent('Fixture : écriture locale refusée une fois.');
    // WIZ-F (#29) : the refusal names the problem and the way out first, next to the command that retries.
    const refusal = step.getByRole('alert');
    expect(refusal).toHaveTextContent(/^Programme non appliqué : le brouillon ne peut pas être conservé sur cet appareil/u);
    expect(refusal).toHaveTextContent('appuie de nouveau sur « Appliquer au brouillon de recette »');
    expect(refusal.closest('.hv-draft-preview')).not.toBeNull();
    expect(step.queryByText(/Programme appliqué au brouillon\./)).toBeNull();
    expect(storageWrite.mock.calls.filter(([key]) => key === storageKey)).toHaveLength(1);
    const afterRefusal = readRecipeDraftState(DRAFT_KEY);
    if (afterRefusal.status !== 'available') throw new Error('Le brouillon doit rester lisible après le refus d’écriture.');
    expect(afterRefusal.raw).toBe(refusedDraftBytes);
    expect(afterRefusal.draft.recipe.hops).toEqual([]);
    expect(afterRefusal.draft.recipe.hopV55Applications).toBeUndefined();
    expect(first.save).not.toHaveBeenCalled();

    const preparedApplication = applicationBuilder.mock.results[0]?.value;
    if (!preparedApplication || preparedApplication.status !== 'ready') throw new Error('L’application prête doit rester en attente après le refus local.');
    const stableApplicationId = preparedApplication.application.record.id;
    const refusedGuardIds = targetGuard.mock.calls.map(([application]) => application.record.id);
    expect(refusedGuardIds.length).toBeGreaterThan(0);
    expect(new Set(refusedGuardIds)).toEqual(new Set([stableApplicationId]));
    expect(applicationBuilder).toHaveBeenCalledTimes(1);

    const retryButton = step.getByRole('button', { name: 'Appliquer au brouillon de recette' });
    await waitFor(() => expect(retryButton).toBeEnabled());
    fireEvent.click(retryButton);
    // V4 (correction V3/V4 n°1): one confirmation only, the page's, next to the origin of the applied programme.
    await step.findByText(/Programme appliqué au brouillon de recette/u, {}, { timeout: 5000 });
    expect(applicationBuilder).toHaveBeenCalledTimes(1); // same prepared application/command is retried, never rebuilt
    const allGuardIds = targetGuard.mock.calls.map(([application]) => application.record.id);
    expect(allGuardIds.length).toBeGreaterThan(refusedGuardIds.length);
    expect(new Set(allGuardIds)).toEqual(new Set([stableApplicationId]));
    const persistedAfterRetry = readRecipeDraftState(DRAFT_KEY);
    if (persistedAfterRetry.status !== 'available') throw new Error('Le brouillon relu après l’écriture confirmée doit rester lisible.');
    expect(persistedAfterRetry.raw).not.toBe(refusedDraftBytes);
    expect(persistedAfterRetry.draft.recipe.hops).toHaveLength(1);
    expect(persistedAfterRetry.draft.recipe.hopV55Applications).toHaveLength(1);
    const persistedApplication = readHopV55RecipeApplication(persistedAfterRetry.draft.recipe.hopV55Applications![0]);
    if (persistedApplication.status !== 'current') throw new Error('Une trace d’application unique et relisible est attendue après le retry.');
    expect(persistedApplication.record.id).toBe(stableApplicationId);
    await waitFor(() => expect(screen.getByText(/Corriger les lignes de houblon · 1/)).toBeInTheDocument());
    const workspaces = createHopV55WorkspaceRepository({ ownerKey: OWNER, database: runtimeState.workspaceDatabase as never });
    const [workspace] = await workspaces.list(OWNER);
    expect(workspace.sourceRecipeId).toBe(seed.id);
    expect(workspace.copies).toEqual([]);
    expect(first.save).not.toHaveBeenCalled(); // applying never saves in place of the wizard

    // Close and reopen the same local draft (reload): the draft wins over the saved recipe, the trace and the dossier are found again.
    first.unmount();
    const second = mount(seed);
    const reopened = await screen.findByTestId('recipe-hop-v55', {}, { timeout: 5000 });
    expect(screen.getByText('Brouillon repris sur cet appareil.')).toBeInTheDocument();
    expect(await within(reopened).findByText(/Dernière application · /)).toBeInTheDocument();
    expect(screen.getByText(/Corriger les lignes de houblon · 1/)).toBeInTheDocument();
    const afterReload = readRecipeDraftState(DRAFT_KEY);
    if (afterReload.status !== 'available') throw new Error('Le brouillon avec la trace doit être relu après démontage/remontage.');
    expect(afterReload.draft.recipe.hopV55Applications).toHaveLength(1);
    const reloadedApplication = readHopV55RecipeApplication(afterReload.draft.recipe.hopV55Applications![0]);
    if (reloadedApplication.status !== 'current') throw new Error('La trace exacte doit rester lisible après reload.');
    expect(reloadedApplication.record.id).toBe(stableApplicationId);
    expect(await workspaces.list(OWNER)).toHaveLength(1);
    const reopenedContext = await runtimeState.options.at(-1)!.context({ kind: 'recipe', recipeId: seed.id });
    expect((reopenedContext.recipe as Recipe).name).toBe('Pale V5.5 non enregistrée');
    const appliedHops = structuredClone((reopenedContext.recipe as Recipe).hops);
    expect(appliedHops).toHaveLength(1);

    // Correction keeps its manual gesture; the sealed trace stays historical and is not rewritten.
    const alpha = document.getElementById('wz-hop-alpha-0') as HTMLInputElement;
    fireEvent.change(alpha, { target: { value: '12' } });
    fireEvent.blur(alpha);
    await waitFor(async () => expect(((await runtimeState.options.at(-1)!.context()).recipe as Recipe).hops[0].alpha).toBe(12));

    allerEtape(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    await waitFor(() => expect(second.save).toHaveBeenCalledTimes(1));
    const [saved, thenBrew] = second.save.mock.calls[0] as [Recipe, boolean];
    expect(thenBrew).toBe(false);
    expect(saved.id).toBe(seed.id);
    expect(saved.name).toBe('Pale V5.5 non enregistrée');
    expect(saved.fermentables.map(row => [row.name, row.weightKg])).toEqual(seed.fermentables.map(row => [row.name, row.weightKg]));
    expect(saved.yeast.name).toBe(seed.yeast.name);
    expect(saved.hops).toHaveLength(1);
    expect(saved.hops[0]).toMatchObject({ name: appliedHops[0].name, weightG: appliedHops[0].weightG, stage: appliedHops[0].stage, alpha: 12 });
    expect(saved.hopPredictionIds).toBeUndefined();
    expect(saved.hopV55Applications).toHaveLength(1);
    const read = readHopV55RecipeApplication(saved.hopV55Applications![0]);
    if (read.status !== 'current') throw new Error('Trace V5.5 courante attendue dans la recette enregistrée.');
    expect(Object.values(read.record.alphaChoices)).toContainEqual({
      value: 9, reason: 'Nominal du sachet prévu, à vérifier sur le lot.'
    });
    expect(read.record).toMatchObject({ ownerKey: OWNER, recipeId: seed.id, workspaceId: workspace.id });
    expect(read.record.hopsReference).toBe(hopV55RecipeApplicationValueReference('hops', appliedHops));
    expect(read.record.hopsReference).not.toBe(hopV55RecipeApplicationValueReference('hops', saved.hops));
  });

  it('transmet les valeurs manquantes telles quelles : ni zéro ni valeur par défaut', async () => {
    const seed = { ...savedRecipe(), hops: [{ name: 'Citra', alpha: 0, weightG: 40, stage: 'dryHop' as const }] };
    mount(seed, { ownerKey: OWNER });
    const boil = document.getElementById('wz-boil') as HTMLInputElement;
    fireEvent.change(boil, { target: { value: '' } });
    fireEvent.blur(boil);
    allerEtape(/^Houblons$/);
    await screen.findByTestId('recipe-hop-v55', {}, { timeout: 5000 });

    const context = await runtimeState.options.at(-1)!.context({ kind: 'recipe', recipeId: seed.id });
    const recipe = context.recipe as Recipe;
    // The canonical V5.5 context projection represents the wizard's missing-number sentinel as null.
    expect(recipe.boilMin).toBeNull();
    expect(recipe.boilMin).not.toBe(0);
    expect(recipe.hops[0]).toMatchObject({ name: 'Citra', alpha: 0, weightG: 40, stage: 'dryHop' });
    expect(recipe.hops[0].aromaTiming).toBeUndefined();
    expect(recipe.hops[0].dayOffset).toBeUndefined();
  });

  it('REV-WIZ M4 : garde ouverts les volets des lignes et des lots pendant une référence en cours', async () => {
    mount({ ...savedRecipe(), hops: [{ name: 'Citra', alpha: 12, weightG: 40, stage: 'boil', timeMin: 10 }] }, { ownerKey: OWNER });
    allerEtape(/^Houblons$/);
    const lines = document.getElementById('recipe-hop-lines') as HTMLDetailsElement;
    if (!lines.open) fireEvent.click(lines.querySelector(':scope > summary')!);
    expect(lines.open).toBe(true);
    const context = lines.querySelector('details.recipe-hop-context') as HTMLDetailsElement;
    fireEvent.click(context.querySelector(':scope > summary')!);
    expect(context.open).toBe(true);
    fireEvent.click(await screen.findByRole('button', { name: 'Commencer une référence en cours' }));
    fireEvent.click(context.querySelector(':scope > summary')!);
    expect(context.open).toBe(true);
    fireEvent.click(lines.querySelector(':scope > summary')!);
    expect(lines.open).toBe(true);
  });

  it('sans profil explicite, l’atelier reste fermé et les lignes de houblon restent corrigibles', async () => {
    mount(savedRecipe(), {});
    allerEtape(/^Houblons$/);
    expect(await screen.findByText(/Le profil propriétaire de ce brouillon n’est pas fourni explicitement/)).toBeInTheDocument();
    expect(screen.queryByTestId('hop-v55')).toBeNull();
    expect(runtimeState.options).toHaveLength(0);
    expect(screen.getByText(/Corriger les lignes de houblon · 0/)).toBeInTheDocument();
  });

  it('#28 : en création, monte l’atelier sur le brouillon inédit et incomplet, propriétaire explicite, rien d’enregistré', async () => {
    const brewhouse = savedRecipe().brewhouse!;
    const save = vi.fn();
    const getRecipes = vi.spyOn(StorageService, 'getRecipes').mockReturnValue([]);
    render(<BrewWizard localOnly ownerKey={OWNER} draftKey="uid-in-draft-key:new"
      config={{ ...defaultConfig, brewhouses: [brewhouse], activeBrewhouseId: brewhouse.id }}
      stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
      onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    expect(screen.getAllByText('Nouvelle recette').length).toBeGreaterThan(0);
    fireEvent.change(document.getElementById('wz-title') as HTMLInputElement, { target: { value: 'Brouillon inédit V5.5' } });
    allerEtape(/^Houblons$/);

    const host = await screen.findByTestId('recipe-hop-v55', {}, { timeout: 5000 });
    const draftId = host.getAttribute('data-draft-id');
    expect(draftId).toMatch(/\S/);
    await within(host).findByTestId('hop-v55', {}, { timeout: 5000 });
    expect(runtimeState.options.at(-1)?.ownerKey).toBe(OWNER);
    getRecipes.mockClear();
    // Live, never-saved and incomplete draft: no hop line, no yeast choice; the context is that draft, not a stored recipe.
    const context = await runtimeState.options.at(-1)!.context({ kind: 'recipe', recipeId: draftId! });
    const live = context.recipe as Recipe;
    expect(live.id).toBe(draftId);
    expect(live.name).toBe('Brouillon inédit V5.5');
    expect(live.hops).toEqual([]);
    expect(context.batch).toBeUndefined();
    expect(getRecipes).not.toHaveBeenCalled();
    await expect(runtimeState.options.at(-1)!.context({ kind: 'recipe', recipeId: 'recipe-other' })).rejects.toThrow(/aucune recette enregistrée n’est substituée/);
    // Native mount only: no link-out or frame to a standalone workshop stands in for the step.
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('link', { name: /atelier/i })).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('#32 : garde brutes les traces V5.5 futures à travers l’autosave, la reprise et l’enregistrement', async () => {
    const futureApplication = { format: 'hop-v55-recipe-draft-application-v9', id: 'application:futur', payload: { nested: [{ a: 1 }, { b: [2, 3] }] } };
    const futureCold = { format: 'hop-v55-recipe-cold-evidence-association-v9', id: 'cold:futur', opaque: { unknownField: true } };
    const seed: Recipe = { ...savedRecipe(), hops: [{ name: 'Citra', alpha: 0, weightG: 40, stage: 'boil', timeMin: 10 }],
      hopV55Applications: [structuredClone(futureApplication)], hopV55ColdEvidenceAssociations: [structuredClone(futureCold)] };
    const first = mount(seed);
    fireEvent.change(document.getElementById('wz-title') as HTMLInputElement, { target: { value: 'Pale aux traces futures' } });
    allerEtape(/^Houblons$/);
    await screen.findByTestId('recipe-hop-v55', {}, { timeout: 5000 });
    expect(await screen.findByText(/1 trace V5\.5 de cette recette est conservée telle quelle, en lecture seule/u)).toBeInTheDocument();
    await waitFor(() => {
      const autosaved = readRecipeDraftState(DRAFT_KEY);
      if (autosaved.status !== 'available') throw new Error('Autosave attendu.');
      expect(autosaved.draft.recipe.name).toBe('Pale aux traces futures');
    }, { timeout: 5000 });
    const autosaved = readRecipeDraftState(DRAFT_KEY);
    if (autosaved.status !== 'available') throw new Error('Autosave attendu.');
    expect(autosaved.draft.recipe.hopV55Applications).toEqual([futureApplication]);
    expect(autosaved.draft.recipe.hopV55ColdEvidenceAssociations).toEqual([futureCold]);

    first.unmount();
    const second = mount(seed);
    expect(await screen.findByText('Brouillon repris sur cet appareil.')).toBeInTheDocument();
    allerEtape(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    await waitFor(() => expect(second.save).toHaveBeenCalledTimes(1));
    const [saved] = second.save.mock.calls[0] as [Recipe, boolean];
    expect(saved.name).toBe('Pale aux traces futures');
    expect(saved.hopV55Applications).toEqual([futureApplication]);
    expect(saved.hopV55ColdEvidenceAssociations).toEqual([futureCold]);
    expect(saved.hops[0].alpha).toBe(0); // « 0 = inconnu » : ni effacé ni remplacé
  });
});
