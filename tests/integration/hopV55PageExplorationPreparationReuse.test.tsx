// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopLot, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { StockItem } from '../../src/types';
import * as scenarioDomain from '../../src/domain/brewingScenario';
import * as contextDomain from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioRecordRead } from '../../src/domain/brewingScenarioDossier';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import * as adoptedPreparation from '../../src/services/hopV55/adoptedContextPreparation';
import { makeHopV55FixtureContext, makeHopV55FixtureReferences, createHopV55FixtureServices,
  type HopV55FixtureCatalogueDatabaseAdapter, type HopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { HopV55WorkspaceDatabaseAdapter, HopV55WorkspaceEnvelopeV1,
  HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { BrewingScenarioLocalDatabaseAdapter, BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { readHopV55ExplorationTrialPreparationV1,
  readHopV55ExplorationTrialReceiptV1 } from '../../src/services/hopV55/explorationTrialPreparation';
import { readHopV55ScenarioPreparation } from '../../src/services/hopV55/scenarioCommit';
import { HopV55Page } from '../../src/ui/hopV55/Page';

// #34 counter-tests: one preparation per exact read, a fresh read after the staging
// CAS, a J5 compute read after the commit's last DAO await, a publication read, and
// no reuse of an earlier command's proof.
const reuseProbe = vi.hoisted(() => ({
  entries: [] as any[],
  lastPreparationCall: undefined as Promise<void> | undefined,
  onPrepareTrial: undefined as ((entry: any) => Promise<void> | void) | undefined,
}));

// The real Page, Explorer, J1 service and repositories stay in place; the wrapper only
// retains the exact entry and Page's own callback for a second, distinct command.
vi.mock('../../src/ui/hopV55/Explorer', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/ui/hopV55/Explorer')>();
  return { ...actual, HopV55Explorer: (props: React.ComponentProps<typeof actual.HopV55Explorer>) => {
    reuseProbe.onPrepareTrial = props.onPrepareTrial;
    return React.createElement(actual.HopV55Explorer, {
      ...props,
      onPrepareTrial: async entry => {
        reuseProbe.entries.push(structuredClone(entry));
        const pending = Promise.resolve(props.onPrepareTrial?.(entry));
        reuseProbe.lastPreparationCall = pending;
        return pending;
      },
    });
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
vi.mock('../../src/ui/hopV55/ObservationWorkbench', () => ({ HopV55ObservationWorkbench: () => null }));
vi.mock('../../src/ui/hopV55/ObservationSupportPanel', () => ({ HopV55ObservationSupportPanel: () => null }));

afterEach(() => {
  cleanup(); vi.restoreAllMocks();
  reuseProbe.entries = []; reuseProbe.lastPreparationCall = undefined; reuseProbe.onPrepareTrial = undefined;
});

const trialVariety: HopVariety = {
  id: 'fixture-preparation-reuse-variety', name: 'Variété témoin', aliases: [], form: 'cone', descriptions: [], analysis: [],
};
const stockVariety: HopVariety = {
  id: 'fixture-stock-counterexample-variety', name: 'Variété synthétique de stock', aliases: [], form: 'pelletT90',
  descriptions: [], analysis: [],
};
const stockItemRef = 'fixture-stock-counterexample-ref';
const stockLot: HopLot = {
  id: 'fixture-stock-counterexample-lot', varietyId: stockVariety.id, name: 'Lot synthétique stocké',
  lotNumber: 'SYN-STOCK-01', form: 'pelletT90', stockItemRef, analysis: [],
};
const stockItem = (currentStock: number): StockItem => ({
  id: 'fixture-stock-counterexample-item', ref: stockItemRef, name: 'Article de stock synthétique', category: 'Houblon',
  unit: 'g', currentStock, minStock: 0, reorder: false,
});
const publishedNotice = 'Essai exact conservé et affiché avec sa copie locale distincte.';

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
type StoredScenarioDossierRow = ScenarioRow & { ownerKey: string; scenarioId: string; formatVersion: number };
type StoredScenarioEventRow = ScenarioRow & { ownerKey: string; scenarioId: string; eventId: string; eventFormatVersion: number; resultingRevision: number };
class MemoryScenarioTable<Row extends ScenarioRow> implements BrewingScenarioLocalTable<Row> {
  readonly rows = new Map<string, Row>();
  constructor(private readonly keyField: 'scenarioId' | 'eventId') {}
  private key(value: unknown) { if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as ScenarioRow; return JSON.stringify([row.ownerKey, row[this.keyField]]); }
  async get(key: unknown): Promise<Row | undefined> { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row): Promise<void> { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: Row): Promise<void> { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async (): Promise<Row[]> => [...this.rows.values()].filter(row => {
    if (index === 'ownerKey') return row.ownerKey === key;
    if (index === '[ownerKey+scenarioId]') return JSON.stringify([row.ownerKey, row.scenarioId]) === JSON.stringify(key);
    return false;
  }).map(row => structuredClone(row)) }) }; }
}

class MemoryScenarioDatabase implements BrewingScenarioLocalDatabaseAdapter {
  readonly dossiers = new MemoryScenarioTable<StoredScenarioDossierRow>('scenarioId');
  readonly events = new MemoryScenarioTable<StoredScenarioEventRow>('eventId');
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

/** Every loadContext call is one distinct exact read; the staging and receipt CAS are timestamped in read counts. */
function reuseHarness() {
  const namespace = `preparation-reuse-${crypto.randomUUID()}`;
  const baseReferences = makeHopV55FixtureReferences();
  const loadReferences = async (): Promise<HopV55FixtureReferences> => ({
    ...baseReferences, varieties: [...baseReferences.varieties, structuredClone(trialVariety)],
  });
  const services = createHopV55FixtureServices(namespace, { mode: 'planning', loadReferences,
    workspaceDatabase: new MemoryWorkspaceDatabase(), scenarioDatabase: new MemoryScenarioDatabase(),
    catalogueDatabase: memoryFixtureCatalogueDatabase() });
  const context = makeHopV55FixtureContext('planning');
  context.recipe = { ...structuredClone(context.recipe!), id: 'recipe:preparation-reuse', name: 'Recette neuve · 21 L', volumeL: 21, hops: [] };
  context.hopIndex!.varieties = [...context.hopIndex!.varieties, structuredClone(trialVariety)];
  const h = {
    services, context, reads: [] as BrewerContext[],
    marks: {} as { stagingReads?: number; j5StagingReads?: number; receiptReads?: number; stockReadBoundary?: {
      readCount: number; stockAvailabilityReferenceBefore: string | undefined; stockAvailabilityReferenceAfter: string | undefined;
      programReferenceBefore: string; programReferenceAfter: string; availableGramsBefore: number | null; availableGramsAfter: number | null;
      changedWhileWorkspaceReadPending: boolean; ownerKey: string; workspaceId: string; commandId: string; operationId: string;
      stockLotId: string; stockItemRef: string;
    } },
    duringStaging: undefined as ((context: BrewerContext) => void) | undefined,
    /** Runs when the commit's own J5 staging CAS returns, before its remaining reads and compute. */
    duringJ5Staging: undefined as ((context: BrewerContext) => void) | undefined,
  };
  services.loadContext = vi.fn(async () => { const read = structuredClone(h.context); h.reads.push(read); return read; });
  const save = services.workspaces.save.bind(services.workspaces);
  vi.spyOn(services.workspaces, 'save').mockImplementation(async (next, expectedRevision) => {
    const staging = h.marks.stagingReads === undefined && !!next.explorationTrialPreparations?.length
      && !next.explorationTrialReceipts?.length;
    const j5Staging = h.marks.j5StagingReads === undefined
      && !!next.scenarioPreparations?.some(row => row.id.startsWith('exploration-preparation-'));
    const receipt = h.marks.receiptReads === undefined && !!next.explorationTrialReceipts?.length;
    const saved = await save(next, expectedRevision);
    if (staging) { h.marks.stagingReads = h.reads.length; h.duringStaging?.(h.context); }
    if (j5Staging) { h.marks.j5StagingReads = h.reads.length; h.duringJ5Staging?.(h.context); }
    if (receipt) h.marks.receiptReads = h.reads.length;
    return saved;
  });
  return h;
}
type ReuseHarness = ReturnType<typeof reuseHarness>;

function sameJson(left: unknown, right: unknown): boolean {
  try { return hopAdviceContentReference('preparation-reuse-equality-test-v1', left)
    === hopAdviceContentReference('preparation-reuse-equality-test-v1', right); } catch { return false; }
}

async function storedWorkspace(h: ReuseHarness, id: string): Promise<HopV55Workspace> {
  const workspace = await h.services.workspaces.read(h.services.ownerKey, id);
  if (!workspace) throw new Error('Le dossier de l’essai doit rester lisible.');
  return workspace;
}

async function availableScenarios(h: ReuseHarness): Promise<BrewingScenarioRecordRead[]> {
  const rows = await h.services.scenarios.list(h.services.ownerKey);
  return rows.filter(row => row.result.status === 'available')
    .map(row => (row.result as { status: 'available'; record: BrewingScenarioRecordRead }).record);
}

/** Same native gesture as the J1→J5 oracle, with neutral fixture values. */
async function openTrialReadyToSimulate(h: ReuseHarness): Promise<HopV55Workspace> {
  const lookup = vi.spyOn(h.services.catalogue, 'lookup');
  render(<HopV55Page services={h.services} />);
  await screen.findByTestId('hop-v55');
  fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Créer un dossier local pour cette exploration' }));
  await screen.findByText(/Dossier local prêt/);
  const [workspace] = await h.services.workspaces.list(h.services.ownerKey);
  if (!workspace) throw new Error('Le dossier local doit exister avant le geste J1.');

  fireEvent.click(screen.getByRole('button', { name: /Catalogues/ }));
  fireEvent.change(await screen.findByLabelText('Rechercher houblons'), { target: { value: trialVariety.name } });
  await waitFor(() => expect(lookup).toHaveBeenCalledWith('hopVariety', trialVariety.name));
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(`${trialVariety.name}.*Référence embarquée`) }));
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
  await screen.findByText(/Son ID et ses sources sont conservés/);

  const lines = await screen.findByRole('list', { name: 'Lignes de l’essai' });
  expect(within(lines).getAllByRole('listitem')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText(`Masse de ${trialVariety.name}`), { target: { value: '12,5' } });
  fireEvent.change(screen.getByLabelText(`Emploi de ${trialVariety.name}`), { target: { value: 'fermentation' } });
  fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
  await screen.findByText('Essai incomplet');
  fireEvent.change(screen.getByLabelText('Contact · essai 1'), { target: { value: '48' } });
  fireEvent.change(screen.getByLabelText('Température · essai 1'), { target: { value: '19' } });
  fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
  await screen.findByText('Essai prêt à simuler');
  return workspace;
}

function installStockLotFixture(h: ReuseHarness, physicalGrams: number): {
  stockAvailabilityReference: string; programReference: string; availableGrams: number | null;
} {
  const context = h.context;
  context.hopIndex!.varieties = [...context.hopIndex!.varieties, structuredClone(stockVariety)];
  context.hopIndex!.lots = [...context.hopIndex!.lots, structuredClone(stockLot)];
  context.recipe = { ...context.recipe!, hops: [{
    name: stockLot.name, hopVarietyId: stockVariety.id, hopLotId: stockLot.id, stockItemRef,
    alpha: 0, weightG: 40, stage: 'dryHop', dayOffset: 3, aromaTiming: 'fermentation',
    aromaContactHours: 48, aromaTemperatureC: 19,
  }] };
  context.inventory = [stockItem(physicalGrams)];
  context.stockReservations = { complete: true, batches: [], source: 'localCache' };
  context.provenance.push('Fixture synthétique de réception : lot et article de stock liés par référence exacte; aucune mesure réelle.');
  const prepared = contextDomain.prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  const row = prepared.stockAvailability?.rows.find(item => item.stockItemRef === stockItemRef);
  if (!current?.program || !current.stockAvailabilityReference || !row) {
    throw new Error('La fixture lot/inventaire ne produit pas de disponibilité canonique dans le Prepared exact.');
  }
  return { stockAvailabilityReference: current.stockAvailabilityReference,
    programReference: programFingerprint(current.program), availableGrams: row.availableGrams };
}

async function openStockLotTrialReadyToSimulate(h: ReuseHarness): Promise<HopV55Workspace> {
  render(<HopV55Page services={h.services} />);
  await screen.findByTestId('hop-v55');
  fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Créer un dossier local pour cette exploration' }));
  await screen.findByText(/Dossier local prêt/);
  const [workspace] = await h.services.workspaces.list(h.services.ownerKey);
  if (!workspace) throw new Error('Le dossier local doit exister avant la ligne J1 de stock.');

  fireEvent.click(screen.getByRole('button', { name: 'Ajuster une ligne existante' }));
  const sourceLine = await screen.findByLabelText('Ligne du programme · essai 1');
  expect(within(sourceLine).getByRole('option', { name: /Lot synthétique stocké/ })).toHaveValue('recipe-hop:0');
  fireEvent.change(sourceLine, { target: { value: 'recipe-hop:0' } });
  fireEvent.change(screen.getByLabelText('Ajustement · essai 1'), { target: { value: 'target' } });
  fireEvent.change(screen.getByLabelText('Masse de l’ajustement · essai 1'), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
  await screen.findByText('Essai prêt à simuler');
  return workspace;
}

const stagingChanges: Array<[string, (context: BrewerContext) => void]> = [
  ['le volume de la source physique', context => { context.recipe = { ...context.recipe, volumeL: 24 }; }],
  ['le catalogue complet', context => {
    context.hopIndex!.varieties = [...context.hopIndex!.varieties,
      { ...structuredClone(trialVariety), id: 'fixture-preparation-reuse-added', name: 'Variété ajoutée pendant le staging' }];
  }],
  ['les cultures chargées', context => {
    const yeast = context.hopIndex!.knowledge.find((row): row is HopYeast => row.kind === 'yeast');
    if (!yeast) throw new Error('La fixture doit porter une culture explicite.');
    context.hopIndex!.knowledge = [...context.hopIndex!.knowledge,
      { ...structuredClone(yeast), id: 'fixture-preparation-reuse-culture', name: 'Culture ajoutée pendant le staging' }];
  }],
];

describe('Page native — préparation réutilisée dans une même lecture, jamais au-delà d’un await', () => {
  it('stock fixture: une ligne J1 liée au lot local atteint J5 avec disponibilité sourcée connue', async () => {
    const h = reuseHarness();
    const stockBefore = installStockLotFixture(h, 100);
    expect(stockBefore.availableGrams).toBe(100);
    const prepared = await openStockLotTrialReadyToSimulate(h);
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');

    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await screen.findByText(publishedNotice, {}, { timeout: 8000 });

    const entry = reuseProbe.entries.at(-1)!;
    expect(entry.preparationInput.operations).toEqual([expect.objectContaining({ kind: 'setDose', additionId: 'recipe-hop:0',
      quantity: { kind: 'target', grams: 20 } })]);
    const stored = await storedWorkspace(h, prepared.id);
    expect(stored.explorationTrialPreparations).toHaveLength(1);
    expect(stored.explorationTrialReceipts).toHaveLength(1);
    const read = readHopV55ExplorationTrialPreparationV1(stored.explorationTrialPreparations![0]);
    if (read.status !== 'available') throw new Error(`Préparation lot illisible : ${read.status}`);
    const lotMaterial = read.preparation.materials.find(material => material.lot?.id === stockLot.id);
    expect(lotMaterial).toMatchObject({ id: `lot:${stockLot.id}`, stockItemRef, availableGrams: 100, lot: stockLot });
    const linkedLine = entry.preparationInput.program.additions.find((addition: { id: string }) => addition.id === 'recipe-hop:0');
    expect(linkedLine?.materialId).toBe('recipe:preparation-reuse:recipe-hop:0');
    const linkedMaterial = read.preparation.materials.find(material => material.id === linkedLine?.materialId);
    expect(linkedMaterial).toMatchObject({ id: linkedLine?.materialId, stockItemRef, availableGrams: 100, lot: stockLot });
    expect(entry.preparationInput.operations).toEqual([expect.objectContaining({ kind: 'setDose', additionId: 'recipe-hop:0',
      quantity: { kind: 'target', grams: 20 } })]);
    expect(read.preparation.sourceReference).toBe(entry.originContext.sourceReference);
    expect(read.preparation.runtimeReference).toBe(entry.originContext.runtimeReference);
    expect(simulate.mock.calls).toHaveLength(1);
    expect(await availableScenarios(h)).toHaveLength(1);
  });

  it('stock fixture: refuse J5 si la disponibilité change pendant la lecture workspace après le Prepared frais', async () => {
    const h = reuseHarness();
    const stockBefore = installStockLotFixture(h, 100);
    const workspace = await openStockLotTrialReadyToSimulate(h);
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    const originalRead = h.services.workspaces.read.bind(h.services.workspaces);
    let stockMutationApplied = false;
    vi.spyOn(h.services.workspaces, 'read').mockImplementation(async (ownerKey, workspaceId) => {
      const isPostStagingReferenceRead = !stockMutationApplied && h.marks.stagingReads !== undefined
        && h.marks.receiptReads === undefined && h.reads.length > h.marks.stagingReads;
      if (!isPostStagingReferenceRead) return originalRead(ownerKey, workspaceId);

      stockMutationApplied = true;
      const freshContextAlreadyPreparedByPage = h.reads.at(-1)!;
      const preparedDuringRead = contextDomain.prepareBrewingScenarioContext(freshContextAlreadyPreparedByPage);
      const preparedReadStock = preparedDuringRead.stockAvailability?.rows.find(row => row.stockItemRef === stockItemRef);
      if (!preparedReadStock || !preparedDuringRead.runtime.current?.stockAvailabilityReference
        || !preparedDuringRead.runtime.current.program) throw new Error('Le Prepared frais ne consomme pas le lot/inventaire canonique.');

      const readStillPending = originalRead(ownerKey, workspaceId);
      const workspaceRow = await readStillPending;
      // The repository read has resolved, but this wrapper has not returned to the Page's await.
      h.context.inventory = [stockItem(10)];
      const currentAfterRead = contextDomain.prepareBrewingScenarioContext(h.context);
      const afterStockRow = currentAfterRead.stockAvailability?.rows.find(row => row.stockItemRef === stockItemRef);
      const beforeStockReference = preparedDuringRead.runtime.current.stockAvailabilityReference;
      const afterStockReference = currentAfterRead.runtime.current?.stockAvailabilityReference;
      const beforeProgramReference = programFingerprint(preparedDuringRead.runtime.current.program);
      const afterProgramReference = currentAfterRead.runtime.current?.program
        ? programFingerprint(currentAfterRead.runtime.current.program) : '';
      h.marks.stockReadBoundary = {
        readCount: h.reads.length,
        stockAvailabilityReferenceBefore: beforeStockReference,
        stockAvailabilityReferenceAfter: afterStockReference,
        programReferenceBefore: beforeProgramReference,
        programReferenceAfter: afterProgramReference,
        availableGramsBefore: preparedReadStock.availableGrams,
        availableGramsAfter: afterStockRow?.availableGrams ?? null,
        changedWhileWorkspaceReadPending: true,
        ownerKey, workspaceId,
        commandId: reuseProbe.entries.at(-1)?.commandId ?? '',
        operationId: reuseProbe.entries.at(-1)?.preparationInput.operations[0]?.id ?? '',
        stockLotId: stockLot.id, stockItemRef,
      };
      return workspaceRow;
    });

    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await waitFor(() => expect(h.marks.stockReadBoundary).toBeDefined());
    const boundary = h.marks.stockReadBoundary!;
    expect(boundary.readCount).toBeGreaterThan(h.marks.stagingReads!);
    expect(boundary.stockAvailabilityReferenceBefore).toBe(stockBefore.stockAvailabilityReference);
    expect(boundary.stockAvailabilityReferenceAfter).not.toBe(boundary.stockAvailabilityReferenceBefore);
    expect(boundary.availableGramsBefore).toBe(100);
    expect(boundary.availableGramsAfter).toBe(10);
    expect(boundary.programReferenceAfter).toBe(boundary.programReferenceBefore);
    expect(boundary.changedWhileWorkspaceReadPending).toBe(true);

    const callbackResult = await reuseProbe.lastPreparationCall!.then(
      () => ({ status: 'resolved' as const }), error => ({ status: 'rejected' as const, error }));
    const stored = await storedWorkspace(h, workspace.id);
    const scenarioRecords = await availableScenarios(h);
    expect(callbackResult.status, JSON.stringify({ stockBoundary: boundary, simulationCalls: simulate.mock.calls.length,
      receiptsAtBoundary: stored.explorationTrialReceipts?.length ?? 0, scenarioCount: scenarioRecords.length }))
      .toBe('rejected');
    expect(simulate).not.toHaveBeenCalled();
    expect(stored.explorationTrialPreparations).toHaveLength(1);
    expect(stored.explorationTrialReceipts ?? []).toHaveLength(0);
    expect(stored.scenarioIds).toHaveLength(0);
    expect(scenarioRecords).toHaveLength(0);
  });

  it('stock fixture: refuse J5 si la disponibilité change pendant le CAS de staging J5 du commit', async () => {
    const h = reuseHarness();
    installStockLotFixture(h, 100);
    const workspace = await openStockLotTrialReadyToSimulate(h);
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    // Same lot/stock identities; the change now lands inside commitHopV55Scenario, after
    // Page's confirmed read and the J5 staging CAS, before the commit's remaining reads.
    h.duringJ5Staging = context => { context.inventory = [stockItem(10)]; };

    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await waitFor(() => expect(h.marks.j5StagingReads).toBeDefined());
    const callbackResult = await reuseProbe.lastPreparationCall!.then(
      () => ({ status: 'resolved' as const, error: undefined }), (error: unknown) => ({ status: 'rejected' as const, error }));
    expect(h.marks.stagingReads).toBeDefined();
    expect(h.marks.j5StagingReads!).toBeGreaterThan(h.marks.stagingReads!);
    expect(h.reads.length).toBeGreaterThan(h.marks.j5StagingReads!);

    expect(callbackResult.status).toBe('rejected');
    expect((callbackResult.error as Error).message).toMatch(/diffère du premier geste/);
    await screen.findByText('Une prévision attend sa finalisation');
    expect(screen.getByRole('button', { name: 'Conserver cette préparation et préparer un autre essai' })).toBeInTheDocument();
    expect(simulate).not.toHaveBeenCalled();
    const stored = await storedWorkspace(h, workspace.id);
    expect(stored.explorationTrialPreparations).toHaveLength(1);
    expect(stored.scenarioPreparations).toHaveLength(1);
    const pendingJ5 = readHopV55ScenarioPreparation(stored.scenarioPreparations![0]);
    if (pendingJ5.status !== 'available') throw new Error(`Préparation J5 en attente illisible : ${pendingJ5.status}`);
    expect(pendingJ5.preparation.ownerKey).toBe(h.services.ownerKey);
    expect(pendingJ5.preparation.workspaceId).toBe(workspace.id);
    expect(stored.explorationTrialReceipts ?? []).toHaveLength(0);
    expect(stored.scenarioIds).toHaveLength(0);
    expect(stored.snapshotIntents ?? []).toHaveLength(0);
    expect(await availableScenarios(h)).toHaveLength(0);
  });

  it('prépare chaque lecture une fois et calcule J5 sur une relecture postérieure au staging', async () => {
    const h = reuseHarness();
    const prepare = vi.spyOn(contextDomain, 'prepareBrewingScenarioContext');
    const adopted = vi.spyOn(adoptedPreparation, 'prepareHopV55AdoptedContext');
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    const workspace = await openTrialReadyToSimulate(h);
    const workspaceReads = vi.spyOn(h.services.workspaces, 'read');
    const scenarioReads = vi.spyOn(h.services.scenarios, 'read');
    const scenarioSaves = vi.spyOn(h.services.scenarios, 'saveResult');
    const readsBefore = h.reads.length;
    const preparedBefore = prepare.mock.calls.length;
    const adoptedBefore = adopted.mock.calls.length;
    const simulatedBefore = simulate.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await screen.findByText(publishedNotice, {}, { timeout: 8000 });

    // Fresh reads are kept: J1 before staging, one after the staging CAS for confirm, one
    // inside J5's compute after the commit's own DAO awaits, and one for publication.
    const { stagingReads, receiptReads } = h.marks;
    expect(stagingReads).toBeGreaterThan(readsBefore);
    expect(receiptReads).toBeGreaterThan(stagingReads!);
    expect(h.reads.length).toBeGreaterThan(receiptReads!);

    // The identical engine preparation of one read is not repeated for J1, capture, NR or J5.
    const commandPreparations = prepare.mock.calls.slice(preparedBefore).map((call, index) => ({
      context: call[0], prepared: prepare.mock.results[preparedBefore + index]?.value as contextDomain.PreparedBrewingScenarioContext,
    }));
    for (const read of h.reads.slice(readsBefore)) {
      expect(commandPreparations.filter(row => row.context === read).length).toBeLessThanOrEqual(1);
    }
    expect(adopted.mock.calls.length - adoptedBefore).toBe(0);

    // J5 runs on the preparation of a read started after the staging CAS returned.
    expect(simulate.mock.calls.length - simulatedBefore).toBe(1);
    const j5Runtime = simulate.mock.calls.at(-1)?.[1];
    const j5Preparation = commandPreparations.find(row => row.prepared?.runtime === j5Runtime);
    expect(j5Preparation).toBeDefined();
    const j5ReadIndex = h.reads.indexOf(j5Preparation!.context as BrewerContext);
    expect(j5ReadIndex).toBeGreaterThanOrEqual(stagingReads!);
    expect(j5ReadIndex).toBeLessThan(receiptReads!);

    // That read is fresh after the last DAO await: it follows the commit's J5 staging CAS,
    // and no workspace or scenario call starts between it and the simulation.
    expect(h.marks.j5StagingReads).toBeDefined();
    expect(j5ReadIndex).toBeGreaterThanOrEqual(h.marks.j5StagingReads!);
    const j5ReadOrder = vi.mocked(h.services.loadContext).mock.invocationCallOrder[j5ReadIndex]!;
    const simulateOrder = simulate.mock.invocationCallOrder.at(-1)!;
    const daoOrders = [workspaceReads, scenarioReads, scenarioSaves, vi.mocked(h.services.workspaces.save)]
      .flatMap(spy => spy.mock.invocationCallOrder);
    expect(daoOrders.filter(order => order > j5ReadOrder && order < simulateOrder)).toEqual([]);

    // Positive path: exact J1 entry, complete materials and cultures, sealed references and receipt.
    const stored = await storedWorkspace(h, workspace.id);
    expect(stored.explorationTrialPreparations).toHaveLength(1);
    expect(stored.explorationTrialReceipts).toHaveLength(1);
    expect(stored.scenarioIds).toHaveLength(1);
    const preparationRead = readHopV55ExplorationTrialPreparationV1(stored.explorationTrialPreparations![0]);
    if (preparationRead.status !== 'available') throw new Error(`Préparation illisible : ${preparationRead.status}`);
    const preparation = preparationRead.preparation;
    const entry = reuseProbe.entries.at(-1);
    expect(sameJson(preparation.entry, entry)).toBe(true);
    expect(preparation.sourceReference).toBe(entry.originContext.sourceReference);
    expect(preparation.runtimeReference).toBe(entry.originContext.runtimeReference);
    expect(preparation.intent.question).toBe('');
    expect(preparation.readingReference).toBeNull();
    expect(sameJson(preparation.materials, entry.preparationInput.materials)).toBe(true);
    const varietyIds = h.context.hopIndex!.varieties.map(variety => `variety:${variety.id}`);
    expect(preparation.materials).toHaveLength(varietyIds.length);
    expect(new Set(preparation.materials.map(material => material.id))).toEqual(new Set(varietyIds));
    // Compare with the exact prepared frame used by J5. The raw BrewerContext fixture
    // omits yeast catalogue rows that the prepared runtime adds to its engine input.
    const expectedYeasts = j5Preparation!.prepared.runtime.engineData.knowledge
      .filter((row): row is HopYeast => row.kind === 'yeast');
    expect(new Set(preparation.yeasts.map(yeast => yeast.id))).toEqual(new Set(expectedYeasts.map(row => row.id)));
    expect(sameJson(preparation.yeasts, expectedYeasts)).toBe(true);

    const receiptRead = readHopV55ExplorationTrialReceiptV1(stored.explorationTrialReceipts![0]);
    if (receiptRead.status !== 'available') throw new Error(`Reçu illisible : ${receiptRead.status}`);
    expect((receiptRead.receipt as { preparationReference?: string }).preparationReference).toBe(preparation.reference);
    expect(receiptRead.receipt.branchId).toBe(preparation.j5Branch.id);
    const scenarios = await availableScenarios(h);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].dossier.scenarioId).toBe(preparation.scenarioId);
    expect(receiptRead.receipt.snapshotReference).toBe(scenarios[0].currentSnapshot.reference);
  });

  it.each(stagingChanges)('refuse J5 sous l’ancienne capture si %s change pendant le staging', async (_label, change) => {
    const h = reuseHarness();
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    const workspace = await openTrialReadyToSimulate(h);
    const simulatedBefore = simulate.mock.calls.length;
    h.duringStaging = change;

    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    expect((await screen.findAllByText(/diffère du premier geste/, {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.queryByText('En cours…')).toBeNull());

    expect(h.marks.stagingReads).toBeDefined();
    expect(h.reads.length).toBeGreaterThan(h.marks.stagingReads!);
    expect(simulate.mock.calls.length).toBe(simulatedBefore);
    const stored = await storedWorkspace(h, workspace.id);
    expect(stored.explorationTrialPreparations).toHaveLength(1);
    expect(stored.explorationTrialReceipts ?? []).toHaveLength(0);
    expect(stored.scenarioIds).toHaveLength(0);
    expect(await availableScenarios(h)).toHaveLength(0);
    // The staged preparation stays the archive of its original capture; nothing is rebound to B.
    const preparationRead = readHopV55ExplorationTrialPreparationV1(stored.explorationTrialPreparations![0]);
    if (preparationRead.status !== 'available') throw new Error(`Préparation illisible : ${preparationRead.status}`);
    const entry = reuseProbe.entries.at(-1);
    expect(preparationRead.preparation.runtimeReference).toBe(entry.originContext.runtimeReference);
    expect(preparationRead.preparation.sourceReference).toBe(entry.originContext.sourceReference);
    expect(screen.queryByText(publishedNotice)).toBeNull();
    expect(screen.queryByText('Une prévision attend sa finalisation')).toBeNull();
  });

  it('une nouvelle commande relit la source et ne réemploie pas la preuve de la précédente', async () => {
    const h = reuseHarness();
    const simulate = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    const workspace = await openTrialReadyToSimulate(h);
    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    await screen.findByText(publishedNotice, {}, { timeout: 8000 });

    const before = await storedWorkspace(h, workspace.id);
    const firstPreparation = before.explorationTrialPreparations![0];
    const entryA = reuseProbe.entries.at(-1);
    const simulatedBefore = simulate.mock.calls.length;
    const readsBefore = h.reads.length;
    h.context.recipe = { ...h.context.recipe, volumeL: 24 };
    const entryB = { ...structuredClone(entryA), commandId: `exploration-command-${crypto.randomUUID()}` };
    expect(reuseProbe.onPrepareTrial).toBeDefined();

    let failure: unknown;
    await act(async () => {
      try { await reuseProbe.onPrepareTrial!(entryB); } catch (error) { failure = error; }
    });
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toMatch(/diffère du premier geste/);
    expect(h.reads.length).toBeGreaterThan(readsBefore);
    expect(simulate.mock.calls.length).toBe(simulatedBefore);

    const after = await storedWorkspace(h, workspace.id);
    expect(after.explorationTrialPreparations).toHaveLength(1);
    expect(sameJson(after.explorationTrialPreparations![0], firstPreparation)).toBe(true);
    expect(after.explorationTrialPreparations!.some(row => (row as { id?: string } | null)?.id === entryB.commandId)).toBe(false);
    expect(after.explorationTrialReceipts).toHaveLength(1);
    expect(await availableScenarios(h)).toHaveLength(1);
  });
});
