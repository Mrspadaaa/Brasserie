// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { HopV55FixtureCatalogueDatabaseAdapter, HopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55FixtureServices, makeHopV55FixtureContext, makeHopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { getHopV55AdoptedBaseline } from '../../src/services/hopV55/referenceWorkspace';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { createHopV55ExplorationTrialOriginContextV1 } from '../../src/services/hopV55/explorationTrialPreparation';
import { HopV55Explorer } from '../../src/ui/hopV55/Explorer';
import { HopV55Page } from '../../src/ui/hopV55/Page';

// Keep the real Page, Catalogue, Explorer and trial editor. Only unrelated
// visual panels are isolated; fixture services and workspace/scenario repos are real.
// The reference panel is reduced to one explicit gesture: adopt an exact hypothesis through
// the real journal writers and the Page's own save, as the full editor does.
vi.mock('../../src/ui/hopV55/ReferencePanel', async () => {
  const reference = await import('../../src/services/hopV55/referenceWorkspace');
  return { HopV55ReferencePanel: (props: import('../../src/ui/hopV55/ReferencePanel').HopV55ReferencePanelProps) =>
    React.createElement('button', { type: 'button', onClick: async () => {
      const latest = await props.getWorkspace();
      const opened = reference.ensureHopV55ReferenceJournal(latest, props.context, props.prepared);
      const baseline = { kind: 'hypothetical' as const, label: 'Référence de test sans recette',
        input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
        program: { id: 'reference-catalogue-use', revision: 1, stage: 'planning' as const, volumeL: 20, wortGravity: null, additions: [] },
        culture: { state: 'unknown' as const, members: [] } };
      await props.onSave(reference.adoptHopV55ReferenceHypothesis(opened, { id: 'reference-catalogue-use', version: 1,
        label: baseline.label, recordedAt: '2026-10-08T20:00:00.000Z', baseline }, props.context, props.prepared));
    } }, 'Adopter l’hypothèse de test') };
});
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

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const targetVariety: HopVariety = {
  id: 'catalogue-use-cold02-target', name: 'Variété sélectionnable de fixture', aliases: [], form: 'unknown',
  descriptions: [], analysis: [],
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
  private key(value: unknown) {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as ScenarioRow; return JSON.stringify([row.ownerKey, row[this.keyField]]);
  }
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
  const records = new Map<string, any>();
  const operations = new Map<string, any>();
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

function fixtureHarness(mode: 'planning' | 'unknown' = 'planning') {
  const namespace = `page-catalogue-use-${crypto.randomUUID()}`;
  const baseReferences = makeHopV55FixtureReferences();
  const loadReferences = async (): Promise<HopV55FixtureReferences> => ({
    ...baseReferences,
    varieties: [...baseReferences.varieties, structuredClone(targetVariety)],
  });
  const workspacesDb = new MemoryWorkspaceDatabase();
  const scenariosDb = new MemoryScenarioDatabase();
  const services = createHopV55FixtureServices(namespace, {
    mode, loadReferences, workspaceDatabase: workspacesDb,
    scenarioDatabase: scenariosDb, catalogueDatabase: memoryFixtureCatalogueDatabase(),
  });
  const context = makeHopV55FixtureContext(mode);
  const recipeHops = structuredClone(context.recipe?.hops);
  return { services, ownerKey: services.ownerKey, workspacesDb, scenariosDb, recipeHops };
}

describe('Page V5.5 — utilisation explicite d’une fiche catalogue sans workspace', () => {
  it('crée d’abord le dossier, ajoute la matière exacte sans masse/emploi, et reste idempotent au second geste', async () => {
    const h = fixtureHarness();
    const lookup = vi.spyOn(h.services.catalogue, 'lookup');
    const write = vi.spyOn(h.services.catalogue, 'write');
    const loadContext = vi.spyOn(h.services, 'loadContext');
    render(<HopV55Page services={h.services} />);
    await screen.findByTestId('hop-v55');
    expect(await h.services.workspaces.list(h.ownerKey)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
    fireEvent.click(screen.getByRole('button', { name: /Catalogues/ }));
    fireEvent.change(await screen.findByLabelText('Rechercher houblons'), { target: { value: targetVariety.name } });
    await waitFor(() => expect(lookup).toHaveBeenCalledWith('hopVariety', targetVariety.name));
    fireEvent.click(await screen.findByRole('button', { name: /Variété sélectionnable de fixture.*Référence embarquée/ }));
    fireEvent.click(screen.getByText('Identifiants techniques'));
    expect(screen.getByText(targetVariety.id)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
    await screen.findByText(/Son ID et ses sources sont conservés/);

    // RED on the original Page: it stores a selectionRequest before a workspace
    // exists, leaving the Explorer without a fresh trial frame to accept it.
    const [workspace] = await h.services.workspaces.list(h.ownerKey);
    expect(workspace).toBeDefined();
    expect(workspace.explorationTrialPreparations ?? []).toEqual([]);
    expect(workspace.explorationTrialReceipts ?? []).toEqual([]);
    expect(workspace.scenarioIds).toEqual([]);
    expect(workspace.programCopies).toBeUndefined();
    expect(workspace.copies).toEqual([]);

    const lines = await screen.findByRole('list', { name: 'Lignes de l’essai' });
    expect(within(lines).getAllByRole('listitem')).toHaveLength(1);
    expect(lines).toHaveTextContent(`Ajouter ${targetVariety.name}`);
    expect(screen.getByLabelText(`Masse de ${targetVariety.name}`)).toHaveValue('');
    expect(screen.getByLabelText(`Emploi de ${targetVariety.name}`)).toHaveValue('');
    expect(screen.getByRole('button', { name: `Retirer ${targetVariety.name} de l’essai` })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Catalogues/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
    await waitFor(async () => expect((await h.services.workspaces.list(h.ownerKey))).toHaveLength(1));
    expect(within(lines).getAllByRole('listitem')).toHaveLength(1);

    expect(lookup).toHaveBeenCalledWith('hopVariety', targetVariety.name);
    expect(write).not.toHaveBeenCalled();
    expect(h.scenariosDb.dossiers.rows.size).toBe(0);
    expect(h.scenariosDb.events.rows.size).toBe(0);
    expect(loadContext.mock.calls.some(([, source]) => source?.kind === 'batch')).toBe(false);
    const finalContext = await h.services.loadContext();
    expect(finalContext.recipe?.hops).toEqual(h.recipeHops);
    h.services.close();
  });

  it('sans recette : garde la fiche en attente visible, sans annonce de conservation, puis l’ajoute une seule fois après l’adoption d’une référence', async () => {
    const h = fixtureHarness('unknown');
    const lookup = vi.spyOn(h.services.catalogue, 'lookup');
    render(<HopV55Page services={h.services} />);
    await screen.findByTestId('hop-v55');
    await useTargetFromCatalogue(lookup);
    await waitFor(async () => expect(await h.services.workspaces.list(h.ownerKey)).toHaveLength(1));
    await screen.findByText(/relu pour l’exploration/);

    // RED on the previous Page: it announced « Son ID et ses sources sont conservés » while the
    // trial lines stayed disabled and the hand-off was dropped without a visible trace.
    expect(screen.queryByText(/Son ID et ses sources sont conservés/)).toBeNull();
    expect(screen.getByText(/attend un programme de référence exact/)).toBeInTheDocument();
    const waiting = await screen.findByRole('list', { name: 'Matières en attente de l’essai' });
    expect(within(waiting).getAllByRole('listitem')).toHaveLength(1);
    expect(waiting).toHaveTextContent(targetVariety.name);
    expect(screen.queryByRole('list', { name: 'Lignes de l’essai' })).toBeNull();

    // Leaving the view and coming back keeps the hand-off visible.
    fireEvent.click(screen.getByRole('button', { name: 'Ma bière' }));
    fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
    expect(within(screen.getByRole('list', { name: 'Matières en attente de l’essai' })).getAllByRole('listitem')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Déclarer une référence' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adopter l’hypothèse de test' }));
    await waitFor(async () => {
      const [workspace] = await h.services.workspaces.list(h.ownerKey);
      expect(getHopV55AdoptedBaseline(workspace)).toMatchObject({ kind: 'hypothetical', program: { id: 'reference-catalogue-use' } });
    });
    // V3 m1: where the reference was adopted, the « waiting » notice gives way to what really happened.
    await screen.findByText(`La fiche ${targetVariety.name} est entrée dans l’essai ; « Préparer l’essai » l’enregistre.`);
    expect(screen.queryByText(/en attente d’un programme de référence/u)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
    const lines = await screen.findByRole('list', { name: 'Lignes de l’essai' });
    expect(within(lines).getAllByRole('listitem')).toHaveLength(1);
    expect(lines).toHaveTextContent(`Ajouter ${targetVariety.name}`);
    expect(screen.queryByRole('list', { name: 'Matières en attente de l’essai' })).toBeNull();

    // A second explicit use keeps one exact line and nothing is stored before « Préparer l’essai ».
    fireEvent.click(screen.getByRole('button', { name: /Catalogues/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
    await screen.findByText(/Son ID et ses sources sont conservés dans la ligne d’essai/);
    expect(within(screen.getByRole('list', { name: 'Lignes de l’essai' })).getAllByRole('listitem')).toHaveLength(1);
    const [workspace] = await h.services.workspaces.list(h.ownerKey);
    expect(workspace.explorationTrialPreparations ?? []).toEqual([]);
    expect(h.scenariosDb.dossiers.rows.size).toBe(0);
    h.services.close();
  });

  it('avec recette : la ligne garde identité et provenance jusqu’à la préparation J5, puis se relit après réouverture', async () => {
    const h = fixtureHarness('planning');
    const lookup = vi.spyOn(h.services.catalogue, 'lookup');
    const first = render(<HopV55Page services={h.services} />);
    await screen.findByTestId('hop-v55');
    await useTargetFromCatalogue(lookup);
    await screen.findByText(/Son ID et ses sources sont conservés dans la ligne d’essai/);
    fireEvent.change(screen.getByLabelText(`Masse de ${targetVariety.name}`), { target: { value: '17,625' } });
    fireEvent.change(screen.getByLabelText(`Emploi de ${targetVariety.name}`), { target: { value: 'fermentation' } });
    fireEvent.change(screen.getByLabelText('Contact · essai 1'), { target: { value: '72' } });
    fireEvent.change(screen.getByLabelText('Température · essai 1'), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’essai' }));
    await screen.findByText('Essai prêt à simuler');
    fireEvent.click(screen.getByRole('button', { name: 'Simuler et comparer cet essai' }));
    let stored: HopV55Workspace | undefined;
    await waitFor(async () => {
      const [workspace] = await h.services.workspaces.list(h.ownerKey);
      expect(workspace.explorationTrialPreparations).toHaveLength(1);
      expect(workspace.explorationTrialReceipts).toHaveLength(1);
      stored = workspace;
    }, { timeout: 8000 });
    const entry = (stored!.explorationTrialPreparations![0] as { entry: any }).entry;
    expect(entry.preparationInput.operations).toMatchObject([{ kind: 'add', materialId: `variety:${targetVariety.id}`,
      grams: 17.625, use: 'fermentation', conditions: { contactHours: 72, temperatureC: 18 } }]);
    expect(entry.lineOrigins).toEqual([{ operationId: entry.preparation.operations[0].id,
      originProgramReference: entry.originProgramReference, originContextReference: entry.originContext.reference }]);
    first.unmount();

    render(<HopV55Page services={h.services} />);
    await screen.findByTestId('hop-v55');
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    fireEvent.click(await screen.findByText('Essais d’exploration composés · 1'));
    const article = screen.getByRole('button', { name: 'Relire le résultat J5 exact' }).closest('article')!;
    expect(article).toHaveTextContent(targetVariety.name);
    expect(article).toHaveTextContent('J5 et son reçu sont conservés');
    h.services.close();
  });
});

// V3 m2: a hand-off belongs to the dossier where it was chosen; another dossier never receives it.
describe('Explorer V5.5 — essai lié au dossier du geste', () => {
  function scopeFixture() {
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
    const material = prepared.runtime.materials.find(row => row.id.startsWith('variety:'));
    if (!material) throw new Error('La fixture doit charger au moins une variété.');
    const program = { id: 'reference-scope-b', revision: 1, stage: 'planning' as const, volumeL: 20, wortGravity: null, additions: [] };
    const frameB = createHopV55ExplorationTrialOriginContextV1({ ownerKey: 'fixture:scope', workspaceId: 'workspace:B',
      source: { kind: 'exploration' }, sourceReference: null, runtimeReference: 'runtime:scope', cultureBindingReference: null,
      readingReference: null, programOrigin: { kind: 'physicalSource', reference: 'reference:scope-b' }, programReference: programFingerprint(program) });
    const props = { prepared, intent: { question: '', criteria: [] }, onCompose: () => undefined, onPrepareTrial: () => undefined };
    return { material, program, frameB, props };
  }

  it('ne fait pas entrer une fiche en attente dans l’essai d’un autre dossier et le dit', async () => {
    const { material, program, frameB, props } = scopeFixture();
    const request = { id: 'catalogue-use:scope', materialId: material.id };
    const view = render(<HopV55Explorer {...props} selectionScope="workspace:A" program={null} originContext={null} selectionRequest={request} />);
    expect(within(await screen.findByRole('list', { name: 'Matières en attente de l’essai' })).getAllByRole('listitem')).toHaveLength(1);

    view.rerender(<HopV55Explorer {...props} selectionScope="workspace:B" program={program} originContext={frameB} selectionRequest={request} />);
    expect(screen.queryByRole('list', { name: 'Lignes de l’essai' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Matières en attente de l’essai' })).toBeNull();
    expect(await screen.findByText(`${material.name} a été choisie dans un autre dossier : elle n’entre pas dans cet essai. `
      + 'Choisis-la de nouveau ici pour l’ajouter; rien n’a été enregistré.')).toBeInTheDocument();
  });

  // The Page empties its main view while it opens another dossier: the Explorer remounts there with the Page's last request.
  it('ne rejoue pas dans un autre dossier la demande d’un geste fait ailleurs, au remontage de l’Explorer', async () => {
    const { material, program, frameB, props } = scopeFixture();
    const first = render(<HopV55Explorer {...props} selectionScope="workspace:B" program={program} originContext={frameB}
      selectionRequest={{ id: 'catalogue-use:from-a', materialId: material.id, scope: 'workspace:A' }} />);
    expect(await screen.findByText(/a été choisie dans un autre dossier : elle n’entre pas dans cet essai/u)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Lignes de l’essai' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Matières en attente de l’essai' })).toBeNull();
    first.unmount();

    // Control: the same gesture made in this dossier enters its trial once.
    render(<HopV55Explorer {...props} selectionScope="workspace:B" program={program} originContext={frameB}
      selectionRequest={{ id: 'catalogue-use:from-b', materialId: material.id, scope: 'workspace:B' }} />);
    expect(within(await screen.findByRole('list', { name: 'Lignes de l’essai' })).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText(/dans un autre dossier/u)).toBeNull();
  });

  it('garde l’attente quand le dossier du geste vient seulement d’être créé', async () => {
    const { material, props } = scopeFixture();
    const request = { id: 'catalogue-use:new-scope', materialId: material.id };
    const view = render(<HopV55Explorer {...props} selectionScope={null} program={null} originContext={null} selectionRequest={request} />);
    await screen.findByRole('list', { name: 'Matières en attente de l’essai' });
    view.rerender(<HopV55Explorer {...props} selectionScope="workspace:new" program={null} originContext={null} selectionRequest={request} />);
    expect(within(screen.getByRole('list', { name: 'Matières en attente de l’essai' })).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText(/dans un autre dossier/u)).toBeNull();
  });
});

async function useTargetFromCatalogue(lookup: { mock: { calls: unknown[][] } }) {
  fireEvent.click(screen.getByRole('button', { name: 'Explorer' }));
  fireEvent.click(screen.getByRole('button', { name: /Catalogues/ }));
  fireEvent.change(await screen.findByLabelText('Rechercher houblons'), { target: { value: targetVariety.name } });
  await waitFor(() => expect(lookup.mock.calls).toContainEqual(['hopVariety', targetVariety.name]));
  fireEvent.click(await screen.findByRole('button', { name: /Variété sélectionnable de fixture.*Référence embarquée/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette fiche' }));
}
