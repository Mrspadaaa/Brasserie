// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import * as scenarioDomain from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55ExplorationTrialPreparationV1, readHopV55ExplorationTrialReceiptV1 } from '../../src/services/hopV55/explorationTrialPreparation';
import { readHopV55ContextualComparisonSnapshot } from '../../src/ui/hopV55/contextualExplorationModel';
import { HopV55Page } from '../../src/ui/hopV55/Page';

const pageExplorationTrialState = vi.hoisted(() => ({ entries: [] as unknown[], profileReferences: [] as string[] }));

vi.mock('../../src/ui/hopV55/Explorer', async () => {
  const ReactModule = await import('react');
  const { prepareHopV55DecisionProgram } = await import('../../src/services/hopV55/decisionProgramPreparation');
  const { programFingerprint } = await import('../../src/domain/hopDecision/programs');
  const { createHopV55ExplorationProfile } = await import('../../src/services/hopV55/explorationProfiles');
  const { HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT } = await import('../../src/services/hopV55/explorationTrialPreparation');
  const { createHopV55ContextualComparisonSnapshot } = await import('../../src/ui/hopV55/contextualExplorationModel');
  function FixtureExplorer(props: any) {
    const profiles = ReactModule.useMemo(() => {
      const family = { key: 'axis:fixture@1:floral', axisId: 'axis:fixture', version: '1', name: 'Floral', terms: ['floral'] };
      const first = createHopV55ExplorationProfile({ label: 'Cible florale V1', status: 'target',
        description: 'Cible de fixture, pas une mesure.', criteria: [{ direction: 'keep', label: 'Garder le floral', family }] }, {
        profileId: 'profile:page-trial', recordedAt: '2026-10-04T11:00:00.000Z', newId: () => 'criterion:floral-v1' });
      const second = createHopV55ExplorationProfile({ label: 'Cible florale V2', status: 'target',
        description: 'Révision explicite de la cible de fixture.', criteria: [{ direction: 'keep', label: 'Garder le floral', family }] }, {
        profileId: first.profileId, previous: first, recordedAt: '2026-10-04T11:01:00.000Z', newId: () => 'criterion:floral-v2' });
      return { first, second };
    }, []);
    const [message, setMessage] = ReactModule.useState('');
    const [trialNumber, setTrialNumber] = ReactModule.useState(0);
    const declare = async (profile: any) => {
      if (!props.onDeclareProfile) throw new Error('La Page n’a pas raccordé la sauvegarde des profils.');
      await props.onDeclareProfile(profile);
      pageExplorationTrialState.profileReferences.push(profile.reference);
      setMessage(`Profil ${profile.version} conservé`);
    };
    const prepare = async () => {
      const nextTrialNumber = trialNumber + 1;
      setMessage(`Préparation de l’essai ${nextTrialNumber}…`);
      const program = props.program ?? props.prepared.runtime.current?.program;
      const originContext = props.originContext;
      const material: HopDecisionMaterial | undefined = props.prepared.runtime.materials.find((row: HopDecisionMaterial) => !!row.id);
      const pair = props.prepared.runtime.materials.slice(0, 2) as HopDecisionMaterial[];
      if (!program || !originContext || !material || pair.length !== 2) throw new Error('Le cadre/programme/matières de fixture manque.');
      const use = program.stage === 'fermenting' ? 'postFermentation' as const : 'firstWort' as const;
      const operation = { id: `exploration-operation:page-trial-line-${nextTrialNumber}`, label: 'Ajouter explicitement au programme',
        kind: 'add' as const, additionId: `scenario-hop:page-trial-line-${nextTrialNumber}`, materialId: material.id,
        grams: 5, use, ...(use === 'postFermentation' ? { conditions: { contactHours: 24, temperatureC: 19, dayOffset: 1 } } : {}) };
      const preparationInput = { branch: { id: `branch:page-trial-${nextTrialNumber}`, label: 'Essai composé de fixture' }, program,
        materials: props.prepared.runtime.materials,
        intent: { question: props.intent.question, interpretation: 'Composition explicite de fixture.', criteria: [] },
        operations: [operation] };
      const result = prepareHopV55DecisionProgram(preparationInput);
      if (result.status !== 'ready' || !result.branch) throw new Error(`La fixture J1 ne peut pas préparer l’ajout : ${result.status}.`);
      const programReference = programFingerprint(program);
      const comparisonSnapshot = createHopV55ContextualComparisonSnapshot({ source: pair[0], alternative: pair[1],
        readingReference: props.readingArchive?.contentReference ?? null, profileSnapshotReference: profiles.first.reference,
        families: [], criteria: [] });
      const entry = { format: HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT,
        commandId: `exploration-command-12345678-1234-4abc-8abc-12345678900${nextTrialNumber}`, originProgramReference: programReference,
        originContext, lineOrigins: [{ operationId: operation.id, originProgramReference: programReference,
          originContextReference: originContext.reference }], programReference, preparationInput,
        preparation: result, branch: result.branch, overrides: {}, profileSnapshot: { kind: 'persisted', profile: profiles.first },
        comparisonSnapshot };
      pageExplorationTrialState.entries.push(structuredClone(entry));
      if (!props.onPrepareTrial) throw new Error('La Page n’a pas raccordé la préparation J5.');
      await props.onPrepareTrial(entry);
      setTrialNumber(nextTrialNumber);
      setMessage(`Essai J5 n°${nextTrialNumber} conservé`);
    };
    return ReactModule.createElement('section', { 'data-testid': 'page-trial-driver' },
      ReactModule.createElement('button', { type: 'button', onClick: () => void declare(profiles.first) }, 'Déclarer V1'),
      ReactModule.createElement('button', { type: 'button', onClick: () => void declare(profiles.second) }, 'Déclarer V2'),
      ReactModule.createElement('button', { type: 'button', onClick: () => void prepare() }, 'Préparer l’essai J5'),
      ReactModule.createElement('p', { role: 'status' }, message));
  }
  return { HopV55Explorer: FixtureExplorer };
});

vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: (props: any) =>
  <div data-testid="trial-branch-profile" data-version={props.branchProfile?.profile.version ?? ''}
    data-reference={props.branchProfile?.profile.reference ?? ''} /> }));
vi.mock('../../src/ui/hopV55/Comparison', async () => {
  const ReactModule = await import('react');
  return { HopV55Comparison: (props: any) => {
  const branch = props.result.branches[0];
  return ReactModule.createElement('button', { type: 'button', disabled: !branch || !props.onChooseBranch,
    onClick: () => branch && props.onChooseBranch?.(branch.id) }, 'Choisir la branche d’essai');
  } };
});
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); pageExplorationTrialState.entries = []; pageExplorationTrialState.profileReferences = []; });

const ownerKey = 'fixture:page-exploration-trial';
const question = 'Je veux comparer les ajouts planifiés de ce brassin.';

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

function pageTrialHarness() {
  const context = makeHopV55FixtureContext('fermenting');
  const workspaceRepository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryWorkspaceDatabase() });
  const scenarioRepository = createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
  let failReceiptCAS = true;
  let receiptSaveAttempts = 0;
  const workspaces = {
    list: workspaceRepository.list,
    read: workspaceRepository.read,
    close: workspaceRepository.close,
    save: async (next: HopV55Workspace, expectedRevision: number | null) => {
      if ((next.explorationTrialReceipts?.length ?? 0) > 0) {
        receiptSaveAttempts++;
        if (failReceiptCAS) { failReceiptCAS = false; throw Object.assign(new Error('staleRevision'), { code: 'staleRevision' }); }
      }
      return workspaceRepository.save(next, expectedRevision);
    },
  };
  const services = {
    scope: 'fixture' as const, ownerKey, loadContext: vi.fn(async () => structuredClone(context)),
    loadFutureDraft: vi.fn(async () => { throw new Error('Aucun brouillon futur ne fait partie de cet essai.'); }),
    workspaces, scenarios: scenarioRepository,
    catalogue: { scope: 'fixture', lookup: vi.fn(async () => ({ records: [], truncated: false })),
      write: vi.fn(async () => { throw new Error('Aucune écriture catalogue dans cet essai.'); }) }, close: vi.fn(),
  } as unknown as HopV55Services;
  return { context, services, workspaceRepository, scenarioRepository,
    receiptSaveAttempts: () => receiptSaveAttempts };
}

describe('Page V5.5 — essai d’exploration append-only', () => {
  it('conserve deux versions de profil, prépare puis simule une seule fois, copie le programme et relit le même reçu hors ligne', async () => {
    const harness = pageTrialHarness();
    const simulateSpy = vi.spyOn(scenarioDomain, 'simulateBrewingScenario');
    const view = render(<HopV55Page services={harness.services} />);
    await screen.findByTestId('hop-v55');
    fireEvent.change(screen.getByRole('textbox', { name: 'Question au brasseur' }), { target: { value: question } });
    fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
    await waitFor(async () => expect((await harness.workspaceRepository.list(ownerKey))[0]?.decisionReadings).toHaveLength(1));
    const originalWorkspace = (await harness.workspaceRepository.list(ownerKey))[0];
    const originalReading = readHopV55DecisionReadingArchive(originalWorkspace.decisionReadings?.[0]);
    expect(originalReading.status).toBe('available');

    fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Déclarer V1' }));
    await waitFor(async () => expect((await harness.workspaceRepository.read(ownerKey, originalWorkspace.id))?.explorationProfiles).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Déclarer V2' }));
    await waitFor(async () => expect((await harness.workspaceRepository.read(ownerKey, originalWorkspace.id))?.explorationProfiles).toHaveLength(2));

    const beforeTrialSimulationCount = simulateSpy.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai J5' }));
    await screen.findByText('Essai J5 n°1 conservé');
    const afterTrialSimulationCount = simulateSpy.mock.calls.length;
    expect(afterTrialSimulationCount - beforeTrialSimulationCount).toBe(1);
    const storedAfterTrial = await harness.workspaceRepository.read(ownerKey, originalWorkspace.id);
    expect(storedAfterTrial?.explorationProfiles).toHaveLength(2);
    expect(storedAfterTrial?.explorationTrialPreparations).toHaveLength(1);
    expect(storedAfterTrial?.explorationTrialReceipts).toHaveLength(1);
    const entry = pageExplorationTrialState.entries[0] as any;
    const preparationRead = readHopV55ExplorationTrialPreparationV1(storedAfterTrial!.explorationTrialPreparations![0]);
    const receiptRead = readHopV55ExplorationTrialReceiptV1(storedAfterTrial!.explorationTrialReceipts![0]);
    expect(preparationRead.status).toBe('available');
    expect(receiptRead.status).toBe('available');
    if (preparationRead.status !== 'available' || receiptRead.status !== 'available') throw new Error('Archives exactes attendues.');
    expect(preparationRead.preparation.entry.profileSnapshot?.profile.version).toBe(1);
    expect(preparationRead.preparation.entry.profileSnapshot?.profile.reference).not.toBe(
      pageExplorationTrialState.profileReferences[1]);
    expect(preparationRead.preparation.entry).toMatchObject({ commandId: entry.commandId,
      preparationInput: { intent: { question } }, branch: { id: 'branch:page-trial-1' } });
    expect(receiptRead.receipt).toMatchObject({ preparationReference: preparationRead.preparation.reference,
      scenarioId: preparationRead.preparation.scenarioId, branchId: preparationRead.preparation.j5Branch.id });
    expect(simulateSpy.mock.calls.length).toBe(afterTrialSimulationCount);
    expect(harness.receiptSaveAttempts()).toBe(2); // one deliberate stale CAS, then exact same receipt succeeds
    expect(storedAfterTrial?.programCopies).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Choisir la branche d’essai' }));
    await waitFor(() => expect(screen.getByText(/Préférence conservée/)).toBeVisible());
    fireEvent.click(screen.getByRole('button', { name: 'Prévisualiser le programme futur' }));
    await screen.findByRole('button', { name: 'Conserver la copie du programme futur' });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver la copie du programme futur' }));
    await waitFor(async () => expect((await harness.workspaceRepository.read(ownerKey, originalWorkspace.id))?.programCopies).toHaveLength(1));
    const afterCopySimulationCount = simulateSpy.mock.calls.length;
    expect(afterCopySimulationCount).toBeGreaterThanOrEqual(afterTrialSimulationCount); // the copy gate may refresh J5 to prove applicability
    const withCopy = await harness.workspaceRepository.read(ownerKey, originalWorkspace.id);
    expect(withCopy?.activeProgramCopyId).toBe(withCopy?.programCopies?.[0]?.id);
    const immutableReading = structuredClone(withCopy?.decisionReadings?.[0]);
    const immutableProfilePrefix = structuredClone(withCopy?.explorationProfiles);
    const immutableEntry = structuredClone(preparationRead.preparation.entry);

    const beforeCopyBasedTrial = simulateSpy.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai J5' }));
    await screen.findByText('Essai J5 n°2 conservé');
    const afterCopyBasedTrial = await harness.workspaceRepository.read(ownerKey, originalWorkspace.id);
    expect(afterCopyBasedTrial?.explorationTrialPreparations).toHaveLength(2);
    expect(afterCopyBasedTrial?.explorationTrialReceipts).toHaveLength(2);
    const copyBasedPreparation = readHopV55ExplorationTrialPreparationV1(afterCopyBasedTrial?.explorationTrialPreparations?.[1]);
    if (copyBasedPreparation.status !== 'available') throw new Error('Préparation basée sur la copie attendue.');
    expect(copyBasedPreparation.preparation.programOrigin.kind).toBe('programCopy');
    expect(copyBasedPreparation.preparation.programCopyRebase?.copy.id).toBe(withCopy?.programCopies?.[0]?.id);
    expect(copyBasedPreparation.preparation.j5Branch.programChanges?.length)
      .toBeGreaterThan(copyBasedPreparation.preparation.entry.branch.programChanges?.length ?? 0);
    expect(simulateSpy.mock.calls.length - beforeCopyBasedTrial).toBe(1);
    const afterCopyBasedSimulationCount = simulateSpy.mock.calls.length;

    view.unmount();
    render(<HopV55Page services={harness.services} />);
    await screen.findByTestId('hop-v55');
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    fireEvent.click(screen.getByText(/Essais d’exploration composés/));
    const archivedTrialButtons = await screen.findAllByRole('button', { name: 'Relire le résultat J5 exact' });
    fireEvent.click(archivedTrialButtons.at(-1)!);
    await screen.findByText(/Prévision exacte de l’essai rouverte en lecture historique/);
    fireEvent.click(screen.getByText('Explorer les nuances fines'));
    await waitFor(() => expect(screen.getByTestId('trial-branch-profile')).toHaveAttribute('data-version', '1'));
    expect(screen.getByTestId('trial-branch-profile')).toHaveAttribute('data-reference', preparationRead.preparation.entry.profileSnapshot!.profile.reference);
    expect(simulateSpy.mock.calls.length).toBe(afterCopyBasedSimulationCount); // history recovery reads the saved snapshot, no second J5
    const afterReload = await harness.workspaceRepository.read(ownerKey, originalWorkspace.id);
    expect(afterReload?.decisionReadings?.[0]).toEqual(immutableReading);
    expect(afterReload?.explorationProfiles?.slice(0, 2)).toEqual(immutableProfilePrefix);
    expect(readHopV55ExplorationTrialPreparationV1(afterReload?.explorationTrialPreparations?.[0]).status).toBe('available');
    expect(preparationRead.preparation.entry).toEqual(immutableEntry);
  });
});
