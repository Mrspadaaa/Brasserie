// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import * as scenarioDomain from '../../src/domain/brewingScenario';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { makeHopV55FixtureContext, makeHopV55FixtureReferences, createHopV55FixtureServices,
  type HopV55FixtureCatalogueDatabaseAdapter, type HopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { HopV55Page } from '../../src/ui/hopV55/Page';

const trialNativeProbe = vi.hoisted(() => ({ entry: undefined as unknown, capture: undefined as unknown, result: undefined as unknown }));

// Keep the real Page, Explorer, J1 service, and repositories. The wrappers only
// retain the exact callback objects needed to diagnose the true integration edge.
vi.mock('../../src/ui/hopV55/Explorer', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/ui/hopV55/Explorer')>();
  return { ...actual, HopV55Explorer: (props: React.ComponentProps<typeof actual.HopV55Explorer>) => React.createElement(actual.HopV55Explorer, {
    ...props,
    onPrepareTrial: async entry => {
      trialNativeProbe.entry = structuredClone(entry);
      return props.onPrepareTrial?.(entry);
    },
  }) };
});

vi.mock('../../src/services/hopV55/explorationTrialPreparation', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/services/hopV55/explorationTrialPreparation')>();
  return { ...actual, prepareHopV55ExplorationTrialV1: input => {
    const dataOnly = Object.fromEntries(Object.entries(input).filter(([, value]) => typeof value !== 'function'));
    trialNativeProbe.capture = structuredClone(dataOnly);
    const result = actual.prepareHopV55ExplorationTrialV1(input);
    trialNativeProbe.result = structuredClone(result);
    return result;
  } };
});

vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

afterEach(() => {
  cleanup(); vi.restoreAllMocks();
  trialNativeProbe.entry = undefined; trialNativeProbe.capture = undefined; trialNativeProbe.result = undefined;
});

const targetVariety: HopVariety = {
  id: 'fixture-cascade-cones-j1', name: 'Cascade cônes', aliases: ['Cascade'], form: 'cone', descriptions: [], analysis: [],
};

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row));
  }
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

type ScenarioRow = Record<string, any>;
class MemoryScenarioTable implements BrewingScenarioLocalTable<ScenarioRow> {
  readonly rows = new Map<string, ScenarioRow>();
  constructor(private readonly keyField: 'scenarioId' | 'eventId') {}
  private key(value: unknown) { if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as ScenarioRow; return JSON.stringify([row.ownerKey, row[this.keyField]]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: ScenarioRow) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: ScenarioRow) { this.rows.set(this.key(row), structuredClone(row)); }
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

function memoryFixtureCatalogueDatabase(): HopV55FixtureCatalogueDatabaseAdapter {
  const records = new Map<string, any>(); const operations = new Map<string, any>();
  return {
    records: {
      get: async key => records.get(JSON.stringify(key)),
      add: async row => { const key = JSON.stringify([row.kind, row.id]); if (records.has(key)) throw new Error('ConstraintError'); records.set(key, structuredClone(row)); },
      put: async row => { records.set(JSON.stringify([row.kind, row.id]), structuredClone(row)); },
      toArray: async () => [...records.values()].map(row => structuredClone(row)),
    },
    operations: {
      get: async key => operations.get(String(key)),
      add: async row => { if (operations.has(row.operationId)) throw new Error('ConstraintError'); operations.set(row.operationId, structuredClone(row)); },
    },
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() {},
  };
}

function nativeTrialHarness() {
  const namespace = `native-j1-trial-${crypto.randomUUID()}`;
  const baseReferences = makeHopV55FixtureReferences();
  const loadReferences = async (): Promise<HopV55FixtureReferences> => ({
    ...baseReferences, varieties: [...baseReferences.varieties, structuredClone(targetVariety)],
  });
  const services = createHopV55FixtureServices(namespace, { mode: 'planning', loadReferences,
    workspaceDatabase: new MemoryWorkspaceDatabase(), scenarioDatabase: new MemoryScenarioDatabase(),
    catalogueDatabase: memoryFixtureCatalogueDatabase() });
  const context = makeHopV55FixtureContext('planning');
  context.recipe = { ...structuredClone(context.recipe!), id: 'recipe:exploration-j1-native', name: 'Recette neuve · 21 L', volumeL: 21, hops: [] };
  context.hopIndex!.varieties = [...context.hopIndex!.varieties, structuredClone(targetVariety)];
  services.loadContext = vi.fn(async () => structuredClone(context));
  return { services, context };
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return hopAdviceContentReference('native-j1-preparation-equality-test-v1', left)
    === hopAdviceContentReference('native-j1-preparation-equality-test-v1', right); } catch { return false; }
}

function jsonDiff(left: unknown, right: unknown, path = ''): string[] {
  if (sameJson(left, right)) return [];
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return [`${path || 'value'}[length]: ${left.length} ≠ ${right.length}`];
    return left.flatMap((value, index) => jsonDiff(value, right[index], `${path}[${index}]`));
  }
  if (left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(left) && !Array.isArray(right)) {
    const leftRecord = left as Record<string, unknown>, rightRecord = right as Record<string, unknown>;
    return [...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])]
      .flatMap(key => jsonDiff(leftRecord[key], rightRecord[key], path ? `${path}.${key}` : key));
  }
  return [`${path || 'value'}: ${JSON.stringify(left)} ≠ ${JSON.stringify(right)}`];
}

describe('Page + Explorer natifs — composition J1 transmise à J5', () => {
  it('conserve exactement le J1 préparé avant de lancer la prévision J5', async () => {
    const h = nativeTrialHarness();
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    const lookup = vi.spyOn(h.services.catalogue, 'lookup');
    render(<HopV55Page services={h.services} />);
    await screen.findByTestId('hop-v55');
    expect(await h.services.workspaces.list(h.services.ownerKey)).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Créer un dossier local pour cette exploration' }));
    await screen.findByText(/Dossier local prêt/);
    const [workspace] = await h.services.workspaces.list(h.services.ownerKey);
    expect(workspace).toBeDefined();
    if (!workspace) throw new Error('Le workspace local de fixture doit être créé avant Use.');

    fireEvent.click(screen.getByRole('button', { name: /Catalogues/ }));
    fireEvent.change(await screen.findByLabelText('Rechercher houblons'), { target: { value: targetVariety.name } });
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('hopVariety', targetVariety.name));
    fireEvent.click(await screen.findByRole('button', { name: /Cascade cônes.*Référence embarquée/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
    await screen.findByText(/Son ID et ses sources sont conservés/);

    const lines = await screen.findByRole('list', { name: 'Lignes de l’essai' });
    expect(within(lines).getAllByRole('listitem')).toHaveLength(1);
    expect(lines).toHaveTextContent(`Ajouter ${targetVariety.name}`);
    expect(screen.getByLabelText(`Masse de ${targetVariety.name}`)).toHaveValue('');
    expect(screen.getByLabelText(`Emploi de ${targetVariety.name}`)).toHaveValue('');
    const shownOrder = [...new Set(within(screen.getByRole('list', { name: 'Résultats du catalogue de houblons' }))
      .getAllByRole('heading', { level: 4 }).map(node => node.textContent ?? ''))];
    fireEvent.change(screen.getByLabelText(`Masse de ${targetVariety.name}`), { target: { value: '17,625' } });
    fireEvent.change(screen.getByLabelText(`Emploi de ${targetVariety.name}`), { target: { value: 'fermentation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    await screen.findByText('Essai incomplet');
    expect(trialNativeProbe.capture).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Contact · essai 1'), { target: { value: '72' } });
    fireEvent.change(screen.getByLabelText('Température · essai 1'), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    await screen.findByText('Essai prêt à simuler');
    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await waitFor(() => expect(trialNativeProbe.capture).toBeDefined());

    const entry = trialNativeProbe.entry as any;
    const capture = trialNativeProbe.capture as any;
    const result = trialNativeProbe.result as any;
    const entryMaterials = entry?.preparationInput?.materials ?? [];
    const captureMaterials = capture?.materials ?? [];
    const captureMaterialById = new Map(captureMaterials.map((row: any) => [row.id, row]));
    const entryMaterialById = new Map(entryMaterials.map((row: any) => [row.id, row]));
    const j1Input = entry?.preparationInput;
    const allowedJ1Keys = ['branch', 'program', 'materials', 'intent', 'operations', 'expectedProgramReference'];
    const isText = (value: unknown) => typeof value === 'string' && !!value.trim() && value.trim() === value;
    const guardPredicates = {
      inputRecord: !!j1Input && typeof j1Input === 'object' && !Array.isArray(j1Input),
      onlyKeys: !!j1Input && Object.keys(j1Input).every(key => allowedJ1Keys.includes(key)),
      branchRecord: !!j1Input?.branch && typeof j1Input.branch === 'object' && !Array.isArray(j1Input.branch),
      branchIdText: isText(j1Input?.branch?.id), branchLabelText: isText(j1Input?.branch?.label),
      intentRecord: !!j1Input?.intent && typeof j1Input.intent === 'object' && !Array.isArray(j1Input.intent),
      questionText: typeof j1Input?.intent?.question === 'string', interpretationText: typeof j1Input?.intent?.interpretation === 'string',
      criteriaArray: Array.isArray(j1Input?.intent?.criteria), operationsArray: Array.isArray(j1Input?.operations),
      materialsArray: Array.isArray(j1Input?.materials), programRecord: !!j1Input?.program && typeof j1Input.program === 'object' && !Array.isArray(j1Input.program),
      expectedProgramReference: j1Input?.expectedProgramReference === undefined || j1Input.expectedProgramReference === entry?.programReference,
    };
    const materialDiagnostics = {
      entryCount: entryMaterials.length, captureCount: captureMaterials.length,
      entryIds: entryMaterials.map((row: any) => row.id), captureIds: captureMaterials.map((row: any) => row.id),
      entryOnly: entryMaterials.filter((row: any) => !captureMaterialById.has(row.id)).map((row: any) => row.id),
      captureOnly: captureMaterials.filter((row: any) => !entryMaterialById.has(row.id)).map((row: any) => row.id),
      changed: entryMaterials.flatMap((row: any) => {
        const current = captureMaterialById.get(row.id);
        return current ? jsonDiff(row, current, row.id) : [];
      }),
    };
    const diagnostics = {
      status: result?.status,
      reason: result?.reason,
      program: sameJson(entry?.preparationInput?.program, capture?.program),
      materials: sameJson(entry?.preparationInput?.materials, capture?.materials),
      operations: sameJson(entry?.preparationInput?.operations, entry?.preparation?.operations),
      branchId: entry?.preparationInput?.branch?.id === entry?.preparation?.branch?.id,
      branchLabel: entry?.preparationInput?.branch?.label === entry?.preparation?.branch?.label,
      expectedProgramReference: entry?.preparationInput?.expectedProgramReference ?? null,
      programReference: entry?.programReference,
      j1InputKeys: j1Input ? Object.keys(j1Input) : [],
      j1Branch: j1Input?.branch,
      preparedBranch: entry?.preparation?.branch,
      j1Intent: j1Input?.intent,
      guardPredicates,
      guardFailures: Object.entries(guardPredicates).filter(([, passed]) => !passed).map(([key]) => key),
      materialDiagnostics,
      addition: entry?.preparation?.proposal?.program?.additions?.find((row: any) => row.materialId?.includes(targetVariety.id)),
      j5OperationCount: entry?.preparation?.operations?.length,
    };
    expect(capture.program).toMatchObject({ volumeL: 21, additions: [] });
    expect(entry.preparationInput.operations).toMatchObject([{
      kind: 'add', materialId: `variety:${targetVariety.id}`, grams: 17.625, use: 'fermentation',
      conditions: { contactHours: 72, temperatureC: 18 },
    }]);
    expect(entry.preparation.branch.programChanges).toHaveLength(1);

    // The original producer reordered materials and rejected an explicit programme
    // with an empty question. Both defects must fail this positive, persisted path.
    expect(diagnostics, `Diagnostic du raccord J1→J5: ${JSON.stringify(diagnostics)}`).toMatchObject({
      status: 'ready', program: true, materials: true, operations: true, branchId: true, branchLabel: true,
      j5OperationCount: 1,
    });
    // The Explorer sorts its catalogue for reading; J1 must still carry the canonical runtime order.
    // The precondition keeps this witness discriminating: both orders really differ here.
    const canonicalShown = [...new Set((capture.materials as Array<{ name: string }>).map(row => row.name)
      .filter(name => shownOrder.includes(name)))];
    expect(shownOrder.length).toBeGreaterThan(1);
    expect(new Set(canonicalShown)).toEqual(new Set(shownOrder));
    expect(shownOrder, 'L’ordre affiché doit différer de l’ordre canonique pour que ce témoin reste discriminant.').not.toEqual(canonicalShown);
    expect(entry.preparationInput.materials.map((row: { id: string }) => row.id))
      .toEqual((capture.materials as Array<{ id: string }>).map(row => row.id));
    await waitFor(async () => {
      const rows = await h.services.workspaces.read(h.services.ownerKey, workspace.id);
      expect(rows?.explorationTrialPreparations).toHaveLength(1);
      expect(rows?.explorationTrialReceipts).toHaveLength(1);
      expect(rows?.scenarioIds).toHaveLength(1);
    });
    expect(simulate).toHaveBeenCalled();
    const scenarios = await h.services.scenarios.list(h.services.ownerKey);
    expect(scenarios).toHaveLength(1);
  });
});
