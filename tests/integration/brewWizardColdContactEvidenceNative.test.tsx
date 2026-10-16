// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { BrewingMath } from '../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import type { BrewhouseProfile, HopIngredient, Recipe } from '../../src/types';
import { type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55RecipeColdContactAssociationV1 } from '../../src/services/hopV55/recipeColdContactAssociation';
import { readRecipeDraftState } from '../../src/services/recipeDraft';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import { allerEtape } from '../helpers/wizard';

const runtimeState = vi.hoisted(() => ({ workspaceDatabase: undefined as unknown, scenarios: undefined as unknown }));

// The real V5.5 runtime, the real recipe step and the real cold workbench run; only the two local storage engines
// are memory adapters and the presentation-heavy decision panels, unused by the cold path, render nothing.
vi.mock('../../src/services/hopV55/runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/services/hopV55/runtime')>();
  return { ...actual, createHopV55Services: (options: Parameters<typeof actual.createHopV55Services>[0]) =>
    ({ ...actual.createHopV55Services({ ...options, workspaceDatabase: runtimeState.workspaceDatabase as never }),
      scenarios: runtimeState.scenarios as never }) };
});
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal =>
  ({ ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

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
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> { return (tablesAndWork.at(-1) as () => Promise<T>)(); }
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
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()].filter(row =>
    index === 'ownerKey' ? row.ownerKey === key
      : index === '[ownerKey+scenarioId]' && JSON.stringify([row.ownerKey, row.scenarioId]) === JSON.stringify(key))
    .map(row => structuredClone(row)) }) }; }
}

class MemoryScenarioDatabase implements BrewingScenarioLocalDatabaseAdapter {
  readonly dossiers = new MemoryScenarioTable('scenarioId');
  readonly events = new MemoryScenarioTable('eventId');
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> { return (tablesAndWork.at(-1) as () => Promise<T>)(); }
  close() {}
}

const OWNER = 'owner:wizard-cold-native';
const DRAFT_KEY = 'uid-in-draft-key:wizard-cold-native';
const GROUPING = 'Une seule ligne à cru, retenue comme hypothèse documentaire du contact.';
const fixtureVarieties = makeHopV55FixtureContext('planning').hopIndex!.varieties;
const dryHop: HopIngredient = { name: 'Identité fictive B', hopVarietyId: 'hop-v55-fixture-identity-b', alpha: 0, weightG: 30,
  stage: 'dryHop', dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 19 };

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockImplementation(async () =>
    ({ varieties: structuredClone(fixtureVarieties), knowledge: [] }));
  runtimeState.workspaceDatabase = new MemoryWorkspaceDatabase();
  runtimeState.scenarios = createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
});
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); localStorage.clear(); });

function seedRecipe(): Recipe {
  const profile: BrewhouseProfile = { id: 'my-rig', name: 'Cuve personnelle', volumeL: 26, efficiencyPct: 75,
    boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment },
    preferences: { ...practicalBrewingPreferences } };
  const water = BrewingMath.waterVolumes(2.5, 26, profile, 'batch', 60, 0);
  const fixture = fixtureRecipe();
  return { ...fixture, id: 'recipe-wizard-cold-native', name: 'Pale à cru', brewhouse: profile, volumeL: 26, totalGristKg: 2.5,
    installation: { manualWaterSplit: false, fermenterHeadspacePct: 10, spargeExceptionAccepted: false },
    hops: [structuredClone(dryHop)], fermentables: [{ ...fixture.fermentables[0], weightKg: 2.5 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], ratioLPerKg: water.mashWaterL / 2.5, spargeType: 'batch' },
    preBoilL: water.preBoilVolumeL, preBoilHotL: water.preBoilHotL,
    waterPlan: { ...fixture.waterPlan!, sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE,
      mashWaterL: water.mashWaterL, spargeWaterL: water.spargeWaterL },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
}

function mount(recipe: Recipe) {
  const save = vi.fn();
  return { save, ...render(<BrewWizard localOnly ownerKey={OWNER} draftKey={DRAFT_KEY} seed={{ recipe }}
    config={{ ...defaultConfig, brewhouses: [recipe.brewhouse!], activeBrewhouseId: recipe.brewhouse!.id }}
    stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />) };
}

/** Open the native hop step and its cold journal, through the real recipe step. */
async function openColdJournal(container: HTMLElement) {
  allerEtape(/^Houblons$/);
  const step = await screen.findByTestId('recipe-hop-v55', {}, { timeout: 5000 });
  await within(step).findByTestId('hop-v55', {}, { timeout: 5000 });
  fireEvent.click(container.querySelector('.recipe-hop-v55-cold > summary')!);
  return step;
}

describe('BrewWizard — preuve de contact à froid dans l’étape Houblons native, sans substitut', () => {
  it('recette neuve : prépare et conserve une preuve, l’enregistre après la complétion du Récapitulatif, la relit actuelle après réouverture puis historique après une nouvelle masse', async () => {
    // A new recipe whose yeast was never completed: the Recap completion fills its catalogue identity and documentary facts.
    const seed = seedRecipe();
    expect(seed.yeast.hopIndexId).toBeUndefined();
    const first = mount(seed);
    const step = within(await openColdJournal(first.container));

    // Prepare: an explicit source, an explicit line and an explicit grouping reason.
    const selector = await step.findByLabelText('Programme à examiner', {}, { timeout: 5000 });
    await waitFor(() => expect(selector).not.toBeDisabled());
    const sourceOption = Array.from((selector as HTMLSelectElement).options).find(option => option.value !== '');
    expect(sourceOption).toBeDefined();
    fireEvent.change(selector, { target: { value: sourceOption!.value } });
    fireEvent.click(await step.findByRole('checkbox', { name: `Sélectionner ${seed.id}:recipe-hop:0` }, { timeout: 5000 }));
    fireEvent.change(step.getByLabelText('Pourquoi ces lignes représentent-elles un même contact ?'), { target: { value: GROUPING } });
    fireEvent.click(step.getByRole('button', { name: 'Préparer la référence de contact' }));
    await step.findByText('Référence préparée; BU cible non calculée', {}, { timeout: 5000 });

    // Conserve: the wizard writer stores the sealed closure in the local draft and changes nothing else.
    fireEvent.click(step.getByRole('button', { name: 'Conserver cette preuve avec la recette' }));
    // The writer's notice is immediately followed by the draft autosave notice: the durable draft is the proof.
    await waitFor(() => {
      const stored = readRecipeDraftState(DRAFT_KEY);
      expect(stored.status === 'available' && stored.draft.recipe.hopV55ColdEvidenceAssociations?.length).toBe(1);
    }, { timeout: 5000 });
    // The step may remount after the durable write: read the live document, not a stale step node.
    await screen.findByText('Source actuelle vérifiée', {}, { timeout: 5000 });
    const draft = readRecipeDraftState(DRAFT_KEY);
    if (draft.status !== 'available') throw new Error('Le brouillon local doit porter la preuve conservée.');
    const journal = draft.draft.recipe.hopV55ColdEvidenceAssociations!;
    expect(journal).toHaveLength(1);
    const read = readHopV55RecipeColdContactAssociationV1(journal[0]);
    if (read.status !== 'readOnly') throw new Error('Association conservée lisible attendue.');
    expect(read.association).toMatchObject({ ownerKey: OWNER, recipeId: seed.id, applicationRecordReference: null,
      origin: { kind: 'localCalculation' } });
    expect(read.association.evidenceSnapshot.assessment.inputSnapshot.contact.grouping.reason).toBe(GROUPING);
    expect(read.association.evidenceSnapshot.assessment.targetAssessment.valueBU).toBeNull();
    expect(draft.draft.recipe.hops).toEqual(seed.hops);
    expect(draft.draft.recipe.hopV55Applications).toBeUndefined();

    // Save through the wizard: the recipe carries the same journal, hops unchanged, same ID.
    allerEtape(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    await waitFor(() => expect(first.save).toHaveBeenCalledTimes(1));
    const [saved] = first.save.mock.calls[0] as [Recipe, boolean];
    expect(saved.id).toBe(seed.id);
    expect(saved.hopV55ColdEvidenceAssociations).toEqual(journal);
    expect(saved.hops).toEqual(seed.hops);
    // The Recap completion changed the yeast after the proof was conserved; the proof must stay current.
    expect(saved.yeast.hopIndexId).toBeTruthy();

    // Reopen the saved recipe in a fresh wizard: the proof is read again from the recipe and is still current.
    first.unmount();
    localStorage.clear();
    const second = mount(structuredClone(saved));
    await openColdJournal(second.container);
    await screen.findByText('Source actuelle vérifiée', {}, { timeout: 5000 });
    expect(second.container.querySelector('.recipe-hop-v55-cold > summary')).toHaveTextContent('1 preuve conservée');

    // A new mass makes the same proof historical: kept byte for byte, its export unchanged, its reason in French.
    const hopLines = second.container.querySelector<HTMLDetailsElement>('#recipe-hop-lines')!;
    fireEvent.click(hopLines.querySelector('summary')!);
    const mass = document.getElementById('wz-hop-0') as HTMLInputElement;
    fireEvent.change(mass, { target: { value: '45' } });
    fireEvent.blur(mass);
    await screen.findByText('Historique · source actuelle non vérifiée', {}, { timeout: 5000 });
    const status = screen.getByText(/Cette preuve reste liée à son ancien instantané/u);
    expect(status.textContent).not.toMatch(/(?:evidence|application)\.[A-Za-z]|Reference\b/u);
    const exported = screen.getByRole('link', { name: 'Exporter la preuve complète (JSON)' }) as HTMLAnchorElement;
    expect(JSON.parse(decodeURIComponent(exported.href.replace(/^data:application\/json;charset=utf-8,/u, '')))).toEqual(journal[0]);
    await waitFor(() => {
      const current = readRecipeDraftState(DRAFT_KEY);
      expect(current.status === 'available' && current.draft.recipe.hops[0].weightG).toBe(45);
    });
    const after = readRecipeDraftState(DRAFT_KEY);
    if (after.status !== 'available') throw new Error('Brouillon modifié attendu.');
    expect(after.draft.recipe.hopV55ColdEvidenceAssociations).toEqual(journal);
  }, 30_000);
});
