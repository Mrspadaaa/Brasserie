// BK4-3 (relance r3, 20.11) : TE-27 a retiré l’atelier Houblons V5.5 de l’étape Houblons de l’assistant. Les tests qui jouaient l’atelier à travers BrewWizard
// (gestes de l’atelier, preuve de contact à froid, traces V5.5 futures) sont retirés avec lui : l’écran qu’ils jouaient n’existe plus ; la logique reste testée
// dans tests/unit (services/hopV55). Restent ici les tests qui ne passent pas par l’atelier.
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



});
