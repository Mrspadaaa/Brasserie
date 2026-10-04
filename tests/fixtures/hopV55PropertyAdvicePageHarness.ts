import { vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';

export const pagePropertyAdviceV4R20 = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
export const pagePropertyAdviceV4OwnerA = 'fixture:page-property-advice-v4-A';
export const pagePropertyAdviceV4WorkspaceA = 'workspace:page-property-advice-v4-A';
export const pagePropertyAdviceV4OwnerB = 'fixture:page-property-advice-v4-B';
export const pagePropertyAdviceV4WorkspaceB = 'workspace:page-property-advice-v4-B';

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
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
      try { return await work(); }
      catch (error) {
        this.workspaces.rows.clear();
        for (const [key, row] of snapshot) this.workspaces.rows.set(key, row);
        throw error;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory-only adapter. */ }
}

export interface HopV55PropertyAdvicePageSaveGate {
  entered: Promise<void>;
  release(): void;
  committed: Promise<void>;
}

export interface HopV55PropertyAdvicePageHarness {
  context: BrewerContext;
  prepared: ReturnType<typeof prepareBrewingScenarioContext>;
  services: HopV55Services;
  repository: ReturnType<typeof createHopV55WorkspaceRepository>;
  saveInputs: HopV55Workspace[];
  save: ReturnType<typeof vi.fn>;
  initialize(): Promise<void>;
  failNextWorkspaceSave(): void;
  /** Fails only the CAS that adds a V4 reexamination receipt, after staging was stored. */
  failNextReexaminationReceiptSave(): void;
  holdNextWorkspaceSave(): HopV55PropertyAdvicePageSaveGate;
  stored(): Promise<HopV55Workspace | null>;
}

/** Real Page/controllers/domain/repository with only the workspace persistence adapter in memory. */
export function pageHarness(options: { ownerKey: string; workspaceId: string; mode: 'planning' | 'unknown' }): HopV55PropertyAdvicePageHarness {
  const context = makeHopV55FixtureContext(options.mode);
  const prepared = prepareBrewingScenarioContext(context);
  const base: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: options.workspaceId, ownerKey: options.ownerKey, revision: 0,
    title: options.mode === 'unknown' ? 'Dossier B · exploration sans recette' : 'Dossier A · recette source fixture',
    intent: { question: '', criteria: [] },
    ...(context.recipe?.id ? { sourceRecipeId: context.recipe.id } : {}),
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-03T12:00:00.000Z',
  };
  const initial = ensureHopV55ReferenceJournal(base, context, prepared);
  const database = new MemoryWorkspaceDatabase();
  const repository = createHopV55WorkspaceRepository({ ownerKey: options.ownerKey, database });
  const saveInputs: HopV55Workspace[] = [];
  let failNextSave = false;
  let failNextReexaminationReceiptSave = false;
  let nextSaveGate: { entered(): void; enteredPromise: Promise<void>; release(): void; wait: Promise<void>; committed(): void; committedPromise: Promise<void> } | undefined;
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number | null) => {
    saveInputs.push(structuredClone(next));
    const gate = nextSaveGate;
    if (gate) {
      nextSaveGate = undefined;
      gate.entered();
      await gate.wait;
    }
    if (failNextSave) { failNextSave = false; throw new Error('Échec transitoire du workspace fixture V4.'); }
    if (failNextReexaminationReceiptSave && (next.propertyAdviceReexaminationCommandReceipts?.length ?? 0) > 0) {
      failNextReexaminationReceiptSave = false;
      throw new Error('Échec transitoire du reçu de réexamen fixture V4 après le staging.');
    }
    const saved = await repository.save(next, expectedRevision);
    gate?.committed();
    return saved;
  });
  const workspaces = { list: repository.list, read: repository.read, save, close: repository.close };
  const services = {
    scope: 'fixture' as const, ownerKey: options.ownerKey,
    loadContext: vi.fn(async () => structuredClone(context)),
    workspaces,
    scenarios: { list: vi.fn(async () => []) },
  } as unknown as HopV55Services;
  const ready = repository.save(initial, null);
  return {
    context, prepared, services, repository, saveInputs, save,
    async initialize() { await ready; },
    failNextWorkspaceSave() { failNextSave = true; },
    failNextReexaminationReceiptSave() { failNextReexaminationReceiptSave = true; },
    holdNextWorkspaceSave(): HopV55PropertyAdvicePageSaveGate {
      let entered!: () => void, release!: () => void, committed!: () => void;
      const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
      const wait = new Promise<void>(resolve => { release = resolve; });
      const committedPromise = new Promise<void>(resolve => { committed = resolve; });
      nextSaveGate = { entered, enteredPromise, release, wait, committed, committedPromise };
      return { entered: enteredPromise, release, committed: committedPromise };
    },
    async stored() { return repository.read(options.ownerKey, options.workspaceId); },
  };
}
