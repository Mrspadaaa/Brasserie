// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import type { Recipe } from '../../src/types';
import type { HopV55Services } from '../../src/services/hopV55/contracts';
import { createHopV55Services, type CreateHopV55ServicesOptions } from '../../src/services/hopV55/runtime';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import type { HopV55RecipeStepStorage } from '../../src/services/hopV55/recipeStepContext';
import { HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, readHopV55RecipeApplication } from '../../src/services/hopV55/recipeDraftApplication';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { HopV55RecipeStep, type HopV55RecipeDraftChange } from '../../src/ui/hopV55/RecipeStep';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

// Only presentation-heavy panels are replaced. The program editor becomes an
// explicit J1 composition driver and the comparison a branch chooser; context,
// J5 simulation, preview, application and persistence run for real.
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => {
  const ReactModule = await import('react');
  const { prepareHopV55DecisionProgram } = await import('../../src/services/hopV55/decisionProgramPreparation');
  function FixtureProgramEditor(props: any) {
    const [message, setMessage] = ReactModule.useState('');
    const compose = () => {
      const program = props.editableProgram ?? props.referenceProgram ?? props.prepared?.runtime.current?.program;
      const material = props.prepared?.runtime.materials.find((row: { id?: unknown }) => typeof row.id === 'string' && row.id);
      if (!program || !material) { setMessage('Programme ou matière absent du contexte préparé.'); return; }
      driverState.materialCount = props.prepared.runtime.materials.length;
      driverState.materialId = material.id;
      const result = prepareHopV55DecisionProgram({ branch: { id: 'branch:recipe-draft-v55', label: 'Premier moût composé' }, program,
        materials: props.prepared.runtime.materials,
        intent: { question: 'Ajouter un premier moût au brouillon.', interpretation: 'Composition explicite de fixture.', criteria: [] },
        operations: [{ id: 'exploration-operation:recipe-draft-v55', label: 'Ajouter explicitement au programme', kind: 'add' as const,
          additionId: 'scenario-hop:recipe-draft-v55', materialId: material.id, grams: 25, use: 'firstWort' as const }] });
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
    return ReactModule.createElement(ReactModule.Fragment, null,
      ReactModule.createElement('button', { type: 'button', disabled: !branch || !props.onChooseBranch,
        onClick: () => branch && props.onChooseBranch?.(branch.id) }, 'Choisir la branche d’essai'),
      // The real comparison also offers its baseline (the source programme) as a branch to choose.
      ReactModule.createElement('button', { type: 'button', disabled: !props.onChooseBranch,
        onClick: () => props.onChooseBranch?.(props.result.baseline.id) }, 'Choisir la base du programme'));
  } };
});
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ownerKey = 'owner:recipe-step-v55';
const draftId = 'recipe-step-draft-v55';
const driverState = vi.hoisted(() => ({ materialCount: 0 as number, materialId: '' as string }));

/** Nonempty synthetic catalogue for host/persistence tests; full-catalogue Q09 is covered separately. */
function recipeStepCatalogueReferences() {
  const variety: HopVariety = { id: 'recipe-step-synthetic-alpha-unknown', name: 'Houblon synthétique sans analyse',
    aliases: [], form: 'unknown', descriptions: [], analysis: [] };
  return { varieties: [variety], knowledge: [] };
}

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

/** Real V5.5 runtime; only its two local storage engines are deterministic memory adapters. */
function memoryRuntime() {
  vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockImplementation(async () => recipeStepCatalogueReferences());
  const workspaceDatabase = new MemoryWorkspaceDatabase();
  const scenarios = createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
  const createServices = vi.fn((options: CreateHopV55ServicesOptions): HopV55Services =>
    ({ ...createHopV55Services({ ...options, workspaceDatabase }), scenarios }));
  return { createServices, workspaces: createHopV55WorkspaceRepository({ ownerKey, database: workspaceDatabase }) };
}

const stores: HopV55RecipeStepStorage = {
  getHopVarieties: () => [], getHopLots: () => [], getHopKnowledge: () => [],
  getStocks: () => ({ rawMaterials: [] }), getBatches: () => [],
};

function initialDraft(overrides: Partial<Recipe> = {}): Recipe {
  return { ...fixtureRecipe(), id: draftId, name: 'Brouillon V5.5 non enregistré', hops: [], ...overrides };
}

function DraftHarness({ initial, runtime, applied, latest }: { initial: Recipe; runtime: ReturnType<typeof memoryRuntime>;
  applied: HopV55RecipeDraftChange[]; latest: { current?: Recipe } }) {
  const [draft, setDraft] = React.useState(initial);
  latest.current = draft;
  return <>
    <button type="button" onClick={() => setDraft(current => ({ ...current, name: `${current.name} · modifié` }))}>Modifier le brouillon hors houblons</button>
    <HopV55RecipeStep ownerKey={ownerKey} localOnly recipe={draft} createServices={runtime.createServices} storage={stores}
      onApply={change => {
        applied.push(change);
        setDraft(current => ({ ...current, hops: change.hops, hopPredictionIds: undefined, hopTrialId: undefined,
          hopV55Applications: change.hopV55Applications }));
      }} />
  </>;
}

/** Explicit gestures: Décider → compose J1 → J5 → choose the branch → preview on the live draft (alpha chosen if asked). */
async function previewFixtureProgram() {
  const step = within(await screen.findByTestId('recipe-hop-v55'));
  await step.findByTestId('hop-v55');
  fireEvent.click(step.getByRole('button', { name: 'Décider' }));
  fireEvent.click(await step.findByRole('button', { name: 'Composer l’ajout de fixture' }));
  expect(driverState).toEqual({ materialCount: 1, materialId: 'variety:recipe-step-synthetic-alpha-unknown' });
  const choose = await step.findByRole('button', { name: 'Choisir la branche d’essai' }, { timeout: 5000 });
  await waitFor(() => expect(choose).toBeEnabled());
  fireEvent.click(choose);
  fireEvent.click(await step.findByRole('button', { name: 'Prévisualiser l’application au brouillon' }, { timeout: 5000 }));
  await waitFor(() => expect(step.queryByRole('button', { name: 'Appliquer au brouillon de recette' })
    ?? step.queryByText(/Alpha à choisir avant application/)).toBeTruthy(), { timeout: 5000 });
  if (step.queryByText(/Alpha à choisir avant application/)) {
    // A range or an unknown alpha never becomes 0 or a default: the brewer states a working value and why.
    expect(step.queryByRole('button', { name: 'Appliquer au brouillon de recette' })).toBeNull();
    fireEvent.change(step.getByRole('textbox', { name: /^Alpha de travail pour / }), { target: { value: '9' } });
    fireEvent.change(step.getByRole('textbox', { name: /^Motif du choix alpha pour / }), { target: { value: 'Nominal du sachet prévu, à vérifier sur le lot.' } });
    fireEvent.click(step.getByRole('button', { name: 'Recalculer l’aperçu avec ces choix' }));
  }
  await step.findByRole('button', { name: 'Appliquer au brouillon de recette' }, { timeout: 5000 });
  expect(step.getByText('Lignes de houblon après application')).toBeInTheDocument();
  return step;
}

describe('Étape Houblons V5.5 — application explicite au brouillon', () => {
  it('applique les seules lignes de houblon au brouillon courant, garde les autres champs et les traces futures', async () => {
    const runtime = memoryRuntime();
    const applied: HopV55RecipeDraftChange[] = [];
    const latest: { current?: Recipe } = {};
    const future = { format: 'hop-v55-recipe-draft-application-v2', id: 'future-trace', kept: { exactly: true } };
    const initial = initialDraft({ hopPredictionIds: ['prediction:old'], hopV55Applications: [future] });
    render(<DraftHarness initial={initial} runtime={runtime} applied={applied} latest={latest} />);
    expect(await screen.findByText(/1 trace V5.5 de cette recette est conservée telle quelle, en lecture seule/)).toBeInTheDocument();

    const step = await previewFixtureProgram();
    expect(applied).toHaveLength(0); // the proposed program has not written anything yet
    expect(latest.current?.hops).toEqual([]);
    fireEvent.click(step.getByRole('button', { name: 'Appliquer au brouillon de recette' }));

    await waitFor(() => expect(applied).toHaveLength(1));
    await screen.findByText(/Programme appliqué au brouillon de recette · branche /);
    const draft = latest.current!;
    expect(draft.id).toBe(draftId);
    expect(draft.name).toBe(initial.name);
    expect(draft.fermentables).toEqual(initial.fermentables);
    expect(draft.yeast).toEqual(initial.yeast);
    expect(draft.fermentation).toEqual(initial.fermentation);
    expect(draft.hopPredictionIds).toBeUndefined();
    expect(draft.hops.length).toBeGreaterThan(0);
    expect(draft.hops.every(hop => hop.alpha > 0)).toBe(true);

    expect(draft.hopV55Applications?.[0]).toEqual(future);
    const read = readHopV55RecipeApplication(draft.hopV55Applications?.[1]);
    if (read.status !== 'current') throw new Error('Trace courante attendue.');
    expect(Object.values(read.record.alphaChoices)).toContainEqual({
      value: 9, reason: 'Nominal du sachet prévu, à vérifier sur le lot.'
    });
    const [workspace] = await runtime.workspaces.list(ownerKey);
    expect(workspace.sourceRecipeId).toBe(draftId);
    expect(workspace.copies).toEqual([]); // no separate Recipe copy is created in the wizard
    expect(read.record).toMatchObject({ ownerKey, recipeId: draftId, workspaceId: workspace.id });
    expect(workspace.scenarioIds).toContain(read.record.scenarioId);
    expect(workspace.selected).toMatchObject({ scenarioId: read.record.scenarioId, branchId: read.record.branchId });
    expect(JSON.stringify(read.record).length).toBeLessThan(4000); // references, not an embedded workspace
    expect(await screen.findByText(/Dernière application · /)).toBeInTheDocument();
  });

  it('#81 : double activation, clic pendant le calcul et clic tardif n’appliquent qu’une fois, sans erreur résiduelle', async () => {
    const runtime = memoryRuntime();
    const applied: HopV55RecipeDraftChange[] = [];
    const latest: { current?: Recipe } = {};
    render(<DraftHarness initial={initialDraft()} runtime={runtime} applied={applied} latest={latest} />);
    const step = await previewFixtureProgram();
    const button = step.getByRole('button', { name: 'Appliquer au brouillon de recette' });
    // Two activations in the same task, before React re-renders (double click, key repeat): one application only.
    act(() => { button.click(); button.click(); });
    // The operation is announced while it runs, and its command cannot be pressed again.
    expect(step.getByText('Vérification sur le brouillon actuel…')).toBeInTheDocument();
    expect(button).toBeDisabled();
    fireEvent.click(button);
    await screen.findByText(/Programme appliqué au brouillon de recette · branche /, undefined, { timeout: 5000 });
    // A later press on a command still on screen (the « control timeout » case) finds nothing left to apply.
    const late = step.queryByRole('button', { name: 'Appliquer au brouillon de recette' });
    if (late && !(late as HTMLButtonElement).disabled) fireEvent.click(late);
    // Let any second continuation run to its end before counting (no product timeout is involved).
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
    expect(applied).toHaveLength(1);
    expect(latest.current?.hopV55Applications).toHaveLength(1);
    expect(readHopV55RecipeApplication(latest.current?.hopV55Applications?.[0]).status).toBe('current');
    expect(step.queryByRole('alert')).toBeNull();
    // Once the workshop has reread the applied draft, no progress text remains next to the reset panel.
    expect(step.queryByText('Mise à jour de l’atelier avec le brouillon appliqué…')).toBeNull();
    expect(step.queryByText('Vérification sur le brouillon actuel…')).toBeNull();
  });

  it('refuse une application devenue périmée après une modification du brouillon et garde le geste de correction', async () => {
    const runtime = memoryRuntime();
    const applied: HopV55RecipeDraftChange[] = [];
    const latest: { current?: Recipe } = {};
    render(<DraftHarness initial={initialDraft()} runtime={runtime} applied={applied} latest={latest} />);
    const step = await previewFixtureProgram();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier le brouillon hors houblons' }));
    const staleApply = step.getByRole('button', { name: 'Appliquer au brouillon de recette' });
    await waitFor(() => expect(staleApply).toBeDisabled());
    fireEvent.click(staleApply);
    expect(applied).toHaveLength(0);
    expect(latest.current?.hops).toEqual([]);
    expect(latest.current?.hopV55Applications).toBeUndefined();
    expect(step.getByRole('button', { name: /Réévaluer ces mêmes candidats dans le contexte actif/ })).toBeEnabled();
  });

  it('montre dans l’origine du programme appliqué ses hypothèses, distinctes des conditions et des limites', async () => {
    const runtime = memoryRuntime();
    const body = { format: HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, id: 'hop-v55-recipe-application:fixture-origin', ownerKey,
      recipeId: draftId, workspaceId: null, appliedAt: '2026-10-08T18:00:00.000Z', scenarioId: 'scenario:fixture-origin',
      snapshotReference: 'snapshot:fixture', branchId: 'branch:fixture-origin', branchReference: 'branch-reference:fixture',
      copyPreviewReference: 'copy-preview:fixture', recipePreviewReference: 'recipe-preview:fixture',
      sourceRecipeReference: 'source-recipe:fixture', hopsReference: 'hops:fixture', alphaChoices: {},
      assumptions: ['Hypothèse de fixture : alpha nominal du sachet retenu comme valeur de travail.'],
      conditions: ['Condition de fixture : contact à cru prévu à 18 °C.'],
      limits: ['Limite de fixture : estimation du modèle, pas une mesure de la bière.'] };
    const record = { ...body, reference: hopAdviceContentReference(HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, body) };
    expect(readHopV55RecipeApplication(record).status).toBe('current');
    render(<HopV55RecipeStep ownerKey={ownerKey} localOnly recipe={initialDraft({ hopV55Applications: [record] })} onApply={vi.fn()}
      createServices={runtime.createServices} storage={stores} />);

    const origin = (await screen.findByText('Origine du programme appliqué')).closest('details')!;
    const group = (label: RegExp) => within(origin).getByText(label).closest('div')!;
    expect(within(group(/^Hypothèses · 1$/u)).getByText(body.assumptions[0])).toBeInTheDocument();
    expect(within(group(/^Conditions · 1$/u)).getByText(body.conditions[0])).toBeInTheDocument();
    expect(within(group(/^Limites · 1$/u)).getByText(body.limits[0])).toBeInTheDocument();
    expect(within(group(/^Hypothèses · 1$/u)).queryByText(body.conditions[0])).toBeNull();
  });

  it('V4 : la base du programme choisie ne mène à aucune impasse : rien à appliquer, sans correction de contexte hors sujet', async () => {
    const runtime = memoryRuntime();
    render(<DraftHarness initial={initialDraft()} runtime={runtime} applied={[]} latest={{}} />);
    const step = within(await screen.findByTestId('recipe-hop-v55'));
    await step.findByTestId('hop-v55');
    fireEvent.click(step.getByRole('button', { name: 'Décider' }));
    fireEvent.click(await step.findByRole('button', { name: 'Composer l’ajout de fixture' }));
    const base = await step.findByRole('button', { name: 'Choisir la base du programme' }, { timeout: 5000 });
    await waitFor(() => expect(base).toBeEnabled());
    fireEvent.click(base);
    expect(await step.findByText(/programme actuel du brouillon : rien à appliquer/u, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(step.queryByRole('button', { name: 'Prévisualiser l’application au brouillon' })).toBeNull();
    expect(step.queryByRole('button', { name: 'Choisir ou corriger la culture' })).toBeNull();
    expect(step.queryByText(/absente du résultat courant/u)).toBeNull();
  });

  it('V4 : aperçu, application et origine nomment matières et moments, avec une seule confirmation', async () => {
    const runtime = memoryRuntime();
    const applied: HopV55RecipeDraftChange[] = [];
    const latest: { current?: Recipe } = {};
    render(<DraftHarness initial={initialDraft()} runtime={runtime} applied={applied} latest={latest} />);
    const step = within(await screen.findByTestId('recipe-hop-v55'));
    await step.findByTestId('hop-v55');
    fireEvent.click(step.getByRole('button', { name: 'Décider' }));
    fireEvent.click(await step.findByRole('button', { name: 'Composer l’ajout de fixture' }));
    const choose = await step.findByRole('button', { name: 'Choisir la branche d’essai' }, { timeout: 5000 });
    await waitFor(() => expect(choose).toBeEnabled());
    fireEvent.click(choose);
    fireEvent.click(await step.findByRole('button', { name: 'Prévisualiser l’application au brouillon' }, { timeout: 5000 }));
    const prompt = (await step.findByText(/Alpha à choisir avant application/u, {}, { timeout: 5000 })).closest('.hv-draft-alpha')!;
    const technical = /scenario-hop:|recipe-hop:|variety:|alpha scalaire|avant copie/u;
    expect(prompt.textContent).not.toMatch(technical);
    expect(prompt.textContent).toMatch(/une plage ou une inconnue ne devient ni zéro ni valeur par défaut/iu);
    fireEvent.change(step.getByRole('textbox', { name: /^Alpha de travail pour / }), { target: { value: '9' } });
    fireEvent.change(step.getByRole('textbox', { name: /^Motif du choix alpha pour / }), { target: { value: 'Nominal du sachet prévu, à vérifier sur le lot.' } });
    fireEvent.click(step.getByRole('button', { name: 'Recalculer l’aperçu avec ces choix' }));
    const preview = (await step.findByText('Lignes de houblon après application', {}, { timeout: 5000 })).closest('.hv-draft-preview')!;
    expect(preview).toHaveTextContent('Alpha choisi · Houblon synthétique sans analyse · Premier moût : 9 % (Nominal du sachet prévu, à vérifier sur le lot.)');
    const previewProse = Array.from(preview.querySelectorAll('li, p'), node => node.textContent ?? '').join('\n');
    expect(previewProse).not.toMatch(technical);

    fireEvent.click(step.getByRole('button', { name: 'Appliquer au brouillon de recette' }));
    await waitFor(() => expect(applied).toHaveLength(1));
    await screen.findByText(/Dernière application · /u);
    await waitFor(() => expect(screen.getAllByRole('status').filter(node => /Programme appliqué au brouillon/u.test(node.textContent ?? ''))).toHaveLength(1));
    const origin = (await screen.findByText('Origine du programme appliqué')).closest('details')!;
    const groups = Array.from(origin.querySelectorAll('li'), node => node.textContent ?? '').join('\n');
    expect(groups).not.toMatch(technical);
  });

  it('reste fermée sans profil explicite et n’ouvre aucun dossier local', async () => {
    const runtime = memoryRuntime();
    render(<HopV55RecipeStep recipe={initialDraft()} localOnly onApply={vi.fn()} createServices={runtime.createServices} storage={stores} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Le profil propriétaire de ce brouillon n’est pas fourni explicitement');
    expect(screen.getByText('Les lignes de houblon restent modifiables dans « Corriger les lignes de houblon ».')).toBeInTheDocument();
    expect(screen.queryByTestId('hop-v55')).toBeNull();
    expect(runtime.createServices).not.toHaveBeenCalled();
  });
});
