import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Recipe } from '../../src/types';
import { makeHopV55FixtureContext, makeHopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55Services, type CreateHopV55ServicesOptions } from '../../src/services/hopV55/runtime';
import type { HopV55ContextSource, HopV55Services } from '../../src/services/hopV55/contracts';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import { createBrewingScenarioLocalRepository } from '../../src/services/brewingScenarioLocalRepository';
import type { BrewingScenarioLocalDatabaseAdapter, BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import type { HopV55WorkspaceDatabaseAdapter, HopV55WorkspaceEnvelopeV1, HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { prepareHopV55DecisionProgram } from '../../src/services/hopV55/decisionProgramPreparation';
import { HopV55RecipeStep } from '../../src/ui/hopV55/RecipeStep';
import type { HopV55RecipeDraftChange } from '../../src/ui/hopV55/RecipeStep';
import type { HopV55RecipeStepStorage } from '../../src/services/hopV55/recipeStepContext';

// Keep the actual Page, runtime, context adapter and J5/application services.
// Only dense comparison/editor surfaces are reduced to explicit gesture drivers.
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => {
  const ReactModule = await import('react');
  return { ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()),
    HopV55ProgramEditor: (props: any) => {
      const [editorNote, setEditorNote] = ReactModule.useState('');
      const current = props.prepared.runtime.current;
      const program = current?.program;
      const compose = () => {
        const material = props.prepared.runtime.materials[0];
        if (!program || !material) return;
        const result = prepareHopV55DecisionProgram({
          branch: { id: 'branch:recipe-live-refresh', label: 'Essai avant correction' }, program,
          materials: props.prepared.runtime.materials,
          intent: { question: 'Comparer le programme avant la correction.', interpretation: 'Geste de test explicite.', criteria: [] },
          operations: [{ id: 'operation:recipe-live-refresh', label: 'Ajouter un geste de comparaison', kind: 'add',
            additionId: 'scenario-hop:recipe-live-refresh', materialId: material.id, grams: 25, use: 'firstWort' }],
        });
        if (result.status === 'ready' && result.branch) props.onCommit(result.branch);
      };
      return ReactModule.createElement('div', null,
        ReactModule.createElement('output', { 'data-testid': 'live-program' },
          `${program?.volumeL ?? 'inconnu'} L · ${(program?.additions ?? []).map((row: { id: string; grams: number | null }) => `${row.id}:${row.grams ?? 'inconnu'} g`).join(' · ')}`),
        ReactModule.createElement('label', null, 'Note locale de l’éditeur', ReactModule.createElement('input', {
          'aria-label': 'Note locale de l’éditeur', value: editorNote, onChange: (event: React.ChangeEvent<HTMLInputElement>) => setEditorNote(event.target.value),
        })),
        ReactModule.createElement('button', { type: 'button', onClick: compose }, 'Composer l’essai antérieur'));
    } };
});
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: (props: any) => {
  const branch = props.result.branches[0];
  return <button type="button" disabled={!branch || !props.onChooseBranch}
    onClick={() => branch && props.onChooseBranch?.(branch.id)}>Choisir l’essai antérieur</button>;
} }));
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

afterEach(() => { cleanup(); createdServices.splice(0).forEach(services => services.close()); loadStats.splice(0); vi.restoreAllMocks(); });

const ownerKey = 'owner:recipe-live-refresh';
const draftId = 'recipe:draft-live-refresh';
const createdServices: HopV55Services[] = [];
const loadStats: Array<{ count: number }> = [];

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

type StoredScenarioDossier = { ownerKey: string; scenarioId: string; formatVersion: number; [key: string]: unknown };
type StoredScenarioEvent = { ownerKey: string; scenarioId: string; eventId: string; eventFormatVersion: number;
  resultingRevision: number; [key: string]: unknown };
class MemoryScenarioTable<Row extends Record<string, unknown>> implements BrewingScenarioLocalTable<Row> {
  readonly rows = new Map<string, Row>();
  constructor(private readonly keyField: 'scenarioId' | 'eventId') {}
  private key(value: unknown) {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as Record<string, unknown>; return JSON.stringify([row.ownerKey, row[this.keyField]]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()].filter(row => {
    const value = row as Record<string, unknown>;
    if (index === 'ownerKey') return value.ownerKey === key;
    if (index === '[ownerKey+scenarioId]') return JSON.stringify([value.ownerKey, value.scenarioId]) === JSON.stringify(key);
    return false;
  }).map(row => structuredClone(row)) }) }; }
}

class MemoryScenarioDatabase implements BrewingScenarioLocalDatabaseAdapter {
  readonly dossiers = new MemoryScenarioTable<StoredScenarioDossier>('scenarioId');
  readonly events = new MemoryScenarioTable<StoredScenarioEvent>('eventId');
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

function initialRecipe(): Recipe {
  const recipe = structuredClone(makeHopV55FixtureContext('planning').recipe!) as Recipe;
  recipe.id = draftId;
  recipe.name = 'Brouillon live';
  recipe.volumeL = 20;
  recipe.hops = [{ ...recipe.hops[0], name: 'Identité fictive A', hopVarietyId: 'hop-v55-fixture-identity-a',
    weightG: 17.625, alpha: 0, stage: 'boil', timeMin: 5 }];
  return recipe;
}

function createServices(options: CreateHopV55ServicesOptions): HopV55Services {
  if (options.ownerKey !== ownerKey) throw new Error('Le profil du service fixture doit correspondre au brouillon contrôlé.');
  const scenarios = createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
  const base = createHopV55Services({ ...options, workspaceDatabase: new MemoryWorkspaceDatabase() });
  const services = { ...base, scenarios, close() { base.close(); scenarios.close(); } };
  const stats = { count: 0 };
  const load = services.loadContext.bind(services);
  services.loadContext = async (recipe?: Recipe, source?: HopV55ContextSource) => {
    stats.count++;
    return load(recipe, source);
  };
  loadStats.push(stats);
  createdServices.push(services);
  return services;
}

const stores: HopV55RecipeStepStorage = { getHopVarieties: () => [], getHopLots: () => [], getHopKnowledge: () => [],
  getStocks: () => ({ rawMaterials: [] }), getBatches: () => [] };

function ControlledDraft({ createServices: makeServices, onApply }: {
  createServices(options: CreateHopV55ServicesOptions): HopV55Services;
  onApply(change: HopV55RecipeDraftChange): void;
}) {
  const [recipe, setRecipe] = React.useState(initialRecipe);
  const changeRecipe = (patch: Partial<Recipe>) => setRecipe(current => ({ ...current, ...patch }));
  return <>
    <label>Correction manuelle du volume<input aria-label="Volume manuel" type="number" value={recipe.volumeL ?? ''}
      onChange={event => changeRecipe({ volumeL: Number(event.target.value) })} /></label>
    <label>Correction manuelle de la masse<input aria-label="Masse manuelle" type="number" value={recipe.hops[0]?.weightG ?? ''}
      onChange={event => setRecipe(current => ({ ...current, hops: current.hops.map((hop, index) => index === 0
        ? { ...hop, weightG: Number(event.target.value) } : hop) }))} /></label>
    <HopV55RecipeStep ownerKey={ownerKey} recipe={recipe} localOnly createServices={makeServices} storage={stores} onApply={onApply} />
  </>;
}

describe('Recette V5.5 — relecture live du brouillon dans l’atelier monté', () => {
  it('actualise le programme après correction manuelle sans remonter l’atelier ni appliquer une ancienne prévision', async () => {
    vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockResolvedValue(makeHopV55FixtureReferences());
    const onApply = vi.fn();
    const makeServices = vi.fn(createServices);
    render(<ControlledDraft createServices={makeServices} onApply={onApply} />);
    const step = within(await screen.findByTestId('recipe-hop-v55'));
    await step.findByTestId('hop-v55');
    expect(loadStats[0].count).toBe(1); // Initial Page load is not followed by a duplicate refresh.

    fireEvent.click(step.getByRole('button', { name: 'Décider' }));
    expect(step.getByTestId('live-program')).toHaveTextContent('20 L');
    expect(step.getByTestId('live-program')).toHaveTextContent('recipe-hop:0:17.625 g');
    fireEvent.click(step.getByRole('button', { name: 'Composer l’essai antérieur' }));
    const simulationCount = await step.findByTestId('hop-v55');
    await waitFor(() => expect(simulationCount).toHaveAttribute('data-simulation-count', '1'), { timeout: 10000 });
    fireEvent.click(await step.findByRole('button', { name: 'Choisir l’essai antérieur' }, { timeout: 10000 }));

    fireEvent.click(await step.findByRole('button', { name: 'Prévisualiser l’application au brouillon' }, { timeout: 10000 }));
    const alphaInput = await step.findByRole('textbox', { name: /^Alpha de travail pour / }, { timeout: 10000 });
    fireEvent.change(alphaInput, { target: { value: '9' } });
    fireEvent.change(step.getByRole('textbox', { name: /^Motif du choix alpha pour / }), {
      target: { value: 'Nominal de travail choisi pour cette comparaison.' },
    });
    fireEvent.click(step.getByRole('button', { name: 'Recalculer l’aperçu avec ces choix' }));
    await step.findByRole('button', { name: 'Appliquer au brouillon de recette' }, { timeout: 10000 });
    fireEvent.change(step.getByRole('textbox', { name: 'Question au brasseur' }), {
      target: { value: 'Garder la question saisie pendant la correction du brouillon.' },
    });
    fireEvent.click(step.getByText('Régler dose, matière et emploi'));
    await waitFor(() => expect(document.querySelector<HTMLDetailsElement>('#hv-program-editor')?.open).toBe(true));
    fireEvent.change(step.getByRole('textbox', { name: 'Note locale de l’éditeur' }), { target: { value: 'Garder mon réglage en cours.' } });
    expect(makeServices).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();

    const beforeRefreshLoadCount = loadStats[0].count;
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Masse manuelle' }), { target: { value: '42' } });
    await waitFor(() => {
      expect(step.getByTestId('live-program')).toHaveTextContent('20 L');
      expect(step.getByTestId('live-program')).toHaveTextContent('recipe-hop:0:42 g');
    }, { timeout: 10000 });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Volume manuel' }), { target: { value: '23' } });

    await waitFor(() => {
      expect(step.getByTestId('live-program')).toHaveTextContent('23 L');
      expect(step.getByTestId('live-program')).toHaveTextContent('recipe-hop:0:42 g');
    }, { timeout: 10000 });
    expect(loadStats[0].count).toBe(beforeRefreshLoadCount + 2);
    expect(makeServices).toHaveBeenCalledTimes(1);
    expect(step.getByRole('textbox', { name: 'Question au brasseur' })).toHaveValue('Garder la question saisie pendant la correction du brouillon.');
    expect(step.getByRole('textbox', { name: 'Note locale de l’éditeur' })).toHaveValue('Garder mon réglage en cours.');
    expect(document.querySelector<HTMLDetailsElement>('#hv-program-editor')?.open).toBe(true);
    expect(step.getByText(/Alpha choisi · .*9 % \(Nominal de travail choisi pour cette comparaison\.\)/)).toBeInTheDocument();
    expect(step.getByTestId('hop-v55')).toHaveAttribute('data-simulation-count', '1');
    expect(step.getByText(/Archive · prévision v\d+ · lecture seule/)).toBeInTheDocument();
    expect(step.getByRole('button', { name: 'Recalculer l’aperçu sur le brouillon actuel' })).toBeDisabled();
    expect(step.getByRole('button', { name: 'Appliquer au brouillon de recette' })).toBeDisabled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
