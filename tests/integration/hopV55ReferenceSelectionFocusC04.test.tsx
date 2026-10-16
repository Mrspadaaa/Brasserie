import React, { useEffect, useState } from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import {
  applyBrewingReferenceCommand,
  brewingReferenceVersionContentReference,
  openBrewingReferenceContext,
  type BrewingReferenceCommandInput,
  type BrewingReferenceEvent,
  type BrewingReferenceRecordV1,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceVersionV1,
  type JsonValue,
} from '../../src/domain/brewingReference';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryDefinitionReference } from '../../src/domain/brewingSensory';
import { buildBrewingScenarioRequest, simulateBrewingScenario, type BrewingScenarioResult } from '../../src/domain/brewingScenario';
import { createBrewingScenarioDossier, readBrewingScenarioRecord, type BrewingScenarioRecordRead,
  type BrewingScenarioSnapshotV1 } from '../../src/domain/brewingScenarioDossier';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';
import { hopTestSource } from '../fixtures/hopIndex';
import { createHopV55ReferenceComparison, HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID,
  type HopV55ReferenceComparisonDTO } from '../../src/services/hopV55/referenceComparison';
import { getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { HopV55Comparison } from '../../src/ui/hopV55/Comparison';
import { HopV55SensoryComparison } from '../../src/ui/hopV55/SensoryComparison';
import {
  HopV55ReferenceComparisonSlot,
  archivedHopV55ReferenceComparison,
  hopV55ReferenceComparisonBasis,
  useHopV55ReferenceComparisonSync,
} from '../../src/ui/hopV55/Page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Synthetic fixture only (same builders as tests/unit/hopV55ReferenceComparison.test.ts): no beer measurement.
const at = '2026-10-06T06:00:00.000Z';
const actor = { id: 'fixture-owner', label: 'Fixture de test' };

function testData() {
  const engineData = testHopData();
  const axis = engineData.knowledge.find((row): row is HopAxis => row.kind === 'axis')!;
  axis.scale = { min: 0, max: 100 };
  axis.lowMax = 30;
  axis.mediumMax = 70;
  const variety = engineData.varieties[0];
  const material: HopDecisionMaterial = { id: 'material-test-variety', name: variety.name, form: variety.form, variety };
  return { engineData, axis, material };
}

function input(doseGL: number, patch: Partial<HopRecipeInput['additions'][number]['triplet']> = {}): HopRecipeInput {
  return { volumeL: 20, yeastId: testHopYeast.id,
    additions: [{ id: 'addition-1', name: 'Houblon témoin', triplet: { ...testHopTriplet, doseGL, ...patch } }],
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 7 }] };
}

function createScenario() {
  const data = testData();
  const request = buildBrewingScenarioRequest({ scenarioId: 'c04-reference-fixture', revision: 1,
    baseline: { kind: 'hypothetical', label: 'Base J5 conservée', input: input(4, { timing: 'fermentation', contactHours: 48, temperatureC: 20 }),
      materials: { hops: [data.material] } } });
  request.branches.push({ id: 'option-a', label: 'Option A archivée', input: input(3.5, { timing: 'postFermentation', contactHours: 24, temperatureC: 18 }),
    assumptions: [], materials: { hops: [data.material] } });
  const result = simulateBrewingScenario(request, { engineData: data.engineData, materials: [data.material] });
  const created = createBrewingScenarioDossier({ ownerKey: 'fixture-owner', scenarioId: result.scenarioId, eventId: 'save-j5-r1', recordedAt: at, result });
  const record = readBrewingScenarioRecord(created.dossier, [created.event]);
  if ('status' in record) throw new Error('Fixture de scénario J5 illisible.');
  return { result, record, snapshot: record.currentSnapshot, data };
}

function panelDefinition(axis: HopAxis): BrewingSensoryDefinitionReference {
  const dimension = { id: axis.id, version: axis.version, name: axis.name, definition: axis.description, sourceRefs: [axis.source] };
  const metric = { id: 'panel-note', version: '2015', kind: 'ordinalNote' as const, name: 'Note de panel',
    meaning: 'Intensité de dégustation publiée.', unit: 'points', sourceRefs: [hopTestSource] };
  const scale = { id: 'panel-0-15', version: '2015', metricRef: { id: metric.id, version: metric.version },
    domain: { min: 0, max: 15 }, sourceRefs: [hopTestSource] };
  return createBrewingSensoryDefinitionReference(dimension, metric, scale);
}

function createReferenceJournal(axis: HopAxis) {
  const definition = panelDefinition(axis);
  const opened = openBrewingReferenceContext({ ownerKey: 'fixture-owner', contextId: 'hop-v55:fixture-workspace', commandId: 'context-open', recordedAt: at,
    context: { programReference: null, past: { status: 'unknown' }, details: { source: 'test fixture' } } });
  let record = opened.record;
  const events: BrewingReferenceEvent[] = [opened.event];
  const append = (kind: string, payload: unknown, commandId: string) => {
    const applied = applyBrewingReferenceCommand(record, { ownerKey: record.ownerKey, contextId: record.contextId, commandId,
      expectedRevision: record.revision, recordedAt: at, kind, payload } as never, events);
    record = applied.record;
    if (!applied.duplicate) events.push(applied.event);
  };
  const proposeAndAdopt = (version: string, predecessor: BrewingReferenceIdentityV1 | null, doseGL: number) => {
    const baseline = { kind: 'hypothetical' as const, label: `Baseline R${version}`,
      input: input(doseGL, { varietyId: 'test-variety', timing: 'fermentation', contactHours: 48, temperatureC: 20 }),
      materials: { hops: [{ id: 'material-test-variety', name: 'Variété témoin', form: 'pelletT90' as const, variety: testHopData().varieties[0] }] } };
    const content = JSON.parse(JSON.stringify({ label: `Référence R${version}`, baseline })) as Record<string, JsonValue>;
    const body = { id: 'fixture-adopted-reference', version, origin: { kind: 'userDeclaration', description: `Référence déclarée ${version}.` },
      hypotheses: [`Baseline explicitement adopté ${version}.`], context: {}, author: actor, createdAt: at, predecessor,
      sensoryDefinitions: [definition], content };
    const reference: BrewingReferenceVersionV1 = { ...body, contentReference: brewingReferenceVersionContentReference(body as never) } as BrewingReferenceVersionV1;
    append('referenceProposed', { reference }, `propose-${version}`);
    const identity = { id: reference.id, version: reference.version, contentReference: reference.contentReference };
    append('referenceAdopted', { reference: identity, adoptedBy: actor }, `adopt-${version}`);
    return identity;
  };
  const r1 = proposeAndAdopt('1', null, 3.86);
  const r2 = proposeAndAdopt('2', r1, 4.5);
  return { record, events, r1, r2 };
}

function activateReference(journal: ReturnType<typeof createReferenceJournal>, reference: BrewingReferenceIdentityV1) {
  const command: BrewingReferenceCommandInput<'referenceActivated'> = {
    ownerKey: journal.record.ownerKey, contextId: journal.record.contextId, commandId: 'activate-archived-r1',
    expectedRevision: journal.record.revision, recordedAt: '2026-10-06T06:01:00.000Z', kind: 'referenceActivated',
    payload: { reference: structuredClone(reference), activatedBy: actor, reason: 'Lecture d’une version déjà adoptée.' },
  };
  const applied = applyBrewingReferenceCommand(journal.record, command, journal.events);
  return { ...journal, record: applied.record, events: applied.duplicate ? journal.events : [...journal.events, applied.event] };
}

function workspaceFor(scenario: ReturnType<typeof createScenario>, journal: { record: BrewingReferenceRecordV1; events: BrewingReferenceEvent[] },
  comparisons: HopV55ReferenceComparisonDTO[] = []): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id: 'fixture-workspace', ownerKey: 'fixture-owner', revision: 1, title: 'Dossier C04 (fixture)',
    intent: { question: '', criteria: [] }, scenarioIds: [scenario.result.scenarioId], referenceHypotheses: [], copies: [],
    referenceJournal: { record: journal.record, events: journal.events }, referenceComparisons: comparisons, updatedAt: at };
}

const axesOf = (result: BrewingScenarioResult) => [...new Map([result.baseline, ...result.branches]
  .flatMap(row => row.dependencySnapshot.engineData.knowledge).filter((row): row is HopAxis => row.kind === 'axis').map(row => [row.id, row])).keys()];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

/** Repository double: reads and CAS saves of the exact workspace; individual calls can be held by the test. */
function repository(initial: HopV55Workspace) {
  let stored = structuredClone(initial);
  const read = vi.fn(async (_owner: string, _id: string): Promise<HopV55Workspace | null> => structuredClone(stored));
  const save = vi.fn(async (next: HopV55Workspace, expected: number | null): Promise<HopV55Workspace> => {
    stored = { ...structuredClone(next), revision: (expected ?? 0) + 1 };
    return structuredClone(stored);
  });
  const services = { ownerKey: 'fixture-owner', workspaces: { read, save } } as unknown as Pick<HopV55Services, 'ownerKey' | 'workspaces'>;
  return { services, read, save, current: () => structuredClone(stored), replace: (value: HopV55Workspace) => { stored = structuredClone(value); } };
}

const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
  (id: string) => setter(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);

/** Same wiring as Page: the exported basis, archive reader, sync hook and slot are the code under test. */
function PageSlotHarness(props: { services: Pick<HopV55Services, 'ownerKey' | 'workspaces'>; workspace: HopV55Workspace;
  record: BrewingScenarioRecordRead; snapshot: BrewingScenarioSnapshotV1; archive?: boolean }) {
  const result = props.snapshot.result;
  const [workspace, setWorkspace] = useState(props.workspace);
  useEffect(() => setWorkspace(props.workspace), [props.workspace]);
  const [branchIds, setBranchIds] = useState(() => [result.baseline, ...result.branches].map(branch => branch.id));
  const [axisIds, setAxisIds] = useState(() => axesOf(result));
  const [referenceComparison, setReferenceComparison] = useState<HopV55ReferenceComparisonDTO>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'bars' | 'radar'>('bars');
  const [showReferenceSeries, setShowReferenceSeries] = useState(true);
  const adoptedReference = getHopV55ReferenceProjection(workspace)?.currentReference ?? null;
  const basis = hopV55ReferenceComparisonBasis({ record: props.record, displayedSnapshot: props.snapshot, workspace, adoptedReference,
    displayingArchive: !!props.archive, compareArchiveToCurrentReference: false });
  const archived = basis.mode === 'archive' ? archivedHopV55ReferenceComparison(workspace, props.snapshot) : undefined;
  useHopV55ReferenceComparisonSync({ services: props.services, workspace, record: props.record, displayedSnapshot: props.snapshot,
    adoptedReference, basis, branchIds, axisIds, setReferenceComparison, setPending, setError, onWorkspaceSaved: setWorkspace });
  return <>
    <HopV55ReferenceComparisonSlot basis={basis} comparison={basis.mode === 'archive' ? archived : referenceComparison}
      pending={pending} error={error} result={result} branchIds={branchIds} axisIds={axisIds} showReferenceSeries={showReferenceSeries}
      selectableCandidateIds={[result.baseline, ...result.branches].map(branch => branch.id)} mode={mode} onModeChange={setMode}
      onToggleCandidate={id => id === HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID ? setShowReferenceSeries(value => !value) : toggleIn(setBranchIds)(id)}
      onToggleAxis={toggleIn(setAxisIds)}
      renderJ5={() => <HopV55Comparison result={result} branchIds={branchIds} axisIds={axisIds} mode={mode} onModeChange={setMode}
        onToggleBranch={toggleIn(setBranchIds)} onToggleAxis={toggleIn(setAxisIds)} />} />
    {error ? <p role="alert">La nouvelle comparaison n’a pas été conservée : {error}</p> : null}
  </>;
}

/**
 * Counter-proof: verbatim copy of the original Page effect and slot ternary (W Page.tsx 3609–3651 and 4013–4023,
 * current-reference path). It clears the comparison during the archive write and swaps to the J5 comparator.
 */
function LegacyHarness(props: { services: Pick<HopV55Services, 'ownerKey' | 'workspaces'>; workspace: HopV55Workspace;
  record: BrewingScenarioRecordRead; snapshot: BrewingScenarioSnapshotV1 }) {
  const result = props.snapshot.result;
  const [workspace, setWorkspace] = useState(props.workspace);
  const [branchIds, setBranchIds] = useState(() => [result.baseline, ...result.branches].map(branch => branch.id));
  const [axisIds, setAxisIds] = useState(() => axesOf(result));
  const [referenceComparison, setReferenceComparison] = useState<HopV55ReferenceComparisonDTO>();
  const [, setComparisonError] = useState('');
  const [mode, setMode] = useState<'bars' | 'radar'>('bars');
  const adoptedReference = getHopV55ReferenceProjection(workspace)?.currentReference ?? null;
  const record = props.record;
  const displayedSnapshot = props.snapshot;
  useEffect(() => {
    let cancelled = false;
    setComparisonError('');
    if (!record || !displayedSnapshot || !workspace?.referenceJournal) { setReferenceComparison(undefined); return; }
    const rows = workspace.referenceComparisons ?? [];
    if (!adoptedReference) { setReferenceComparison(undefined); return; }
    const currentSnapshot = displayedSnapshot;
    const reference = structuredClone(adoptedReference);
    setReferenceComparison(undefined);
    void (async () => {
      const dto = createHopV55ReferenceComparison({ scenarioRecord: record, snapshotReference: currentSnapshot.reference,
        referenceJournal: workspace.referenceJournal!, adoptedReference: reference,
        selection: { candidateIds: branchIds, dimensionIds: axisIds } });
      const found = rows.find(row => row.contentReference === dto.contentReference);
      if (found) { if (!cancelled) setReferenceComparison(found); return; }
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;
        const latest = await props.services.workspaces.read(props.services.ownerKey, workspace.id);
        if (!latest) throw Error('Le dossier de comparaison n’est plus disponible.');
        const currentReference = getHopV55ReferenceProjection(latest)?.currentReference;
        if (currentReference?.contentReference !== reference.contentReference) return;
        const existing = latest.referenceComparisons?.find(row => row.contentReference === dto.contentReference);
        if (existing) { if (!cancelled) setReferenceComparison(existing); return; }
        try {
          const saved = await props.services.workspaces.save({ ...latest, referenceComparisons: [...(latest.referenceComparisons ?? []), dto],
            updatedAt: new Date().toISOString() }, latest.revision);
          if (!cancelled) { setWorkspace(saved); setReferenceComparison(dto); }
          return;
        } catch (err) { if ((err as { code?: string }).code !== 'staleRevision' || attempt === 2) throw err; }
      }
    })().catch(err => { if (!cancelled) setComparisonError((err as Error).message); });
    return () => { cancelled = true; };
  }, [adoptedReference?.contentReference, branchIds.join('|'), axisIds.join('|')]);
  return referenceComparison ? <HopV55SensoryComparison comparison={referenceComparison.comparison} result={result}
    candidateIds={[...branchIds, HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID]} dimensionIds={referenceComparison.selection.dimensionReferenceIds}
    mode={mode} onModeChange={setMode} selectableCandidateIds={[result.baseline, ...result.branches].map(branch => branch.id)}
    onToggleCandidate={toggleIn(setBranchIds)}
    onToggleDimension={groupId => { const id = referenceComparison.comparison.dimensions.find(row => row.referenceGroupId === groupId)?.definition.dimension.id; if (id) toggleIn(setAxisIds)(id); }} />
    : <HopV55Comparison result={result} branchIds={branchIds} axisIds={axisIds} mode={mode} onModeChange={setMode}
      onToggleBranch={toggleIn(setBranchIds)} onToggleAxis={toggleIn(setAxisIds)} />;
}

const slotState = (container: HTMLElement) => container.querySelector('[data-reference-comparison-state]')?.getAttribute('data-reference-comparison-state');
const storedReference = (container: HTMLElement) => container.querySelector('.hv-reference-comparison details small')?.textContent;
const j5Heading = () => screen.queryByRole('heading', { name: 'Comparer les profils' });
const optionACheckbox = () => screen.getByRole('checkbox', { name: /^Comparer Option A archivée/ });

function setup() {
  const scenario = createScenario();
  const journal = createReferenceJournal(scenario.data.axis);
  const workspace = workspaceFor(scenario, journal);
  const current = getHopV55ReferenceProjection(workspace)?.currentReference;
  if (current?.contentReference !== journal.r2.contentReference) throw new Error('La fixture doit adopter R2 comme référence courante.');
  return { scenario, journal, workspace, repo: repository(workspace) };
}

describe('C04 · comparaison à la référence adoptée pendant un changement de sélection', () => {
  it('garde le comparateur monté et le focus pendant l’archivage d’une sélection de candidat puis de nuance', async () => {
    const { scenario, workspace, repo } = setup();
    const user = userEvent.setup();
    const { container } = render(<PageSlotHarness services={repo.services} workspace={workspace} record={scenario.record} snapshot={scenario.snapshot} />);
    expect(j5Heading(), 'Le premier calcul montre un chargement explicite, jamais le comparateur J5.').toBeNull();
    expect(slotState(container)).toBe('loading');
    await screen.findByRole('heading', { name: 'Comparer les nuances' });
    await waitFor(() => expect(slotState(container)).toBe('ready'));
    const firstReference = storedReference(container);
    expect(firstReference).toMatch(/^hop-v55-reference-comparison-content-v1:/);
    expect(repo.save).toHaveBeenCalledTimes(1);

    const heldCandidate = deferred<HopV55Workspace | null>();
    repo.read.mockImplementationOnce(() => heldCandidate.promise);
    const optionA = optionACheckbox();
    optionA.focus();
    await user.keyboard(' ');
    expect(j5Heading(), 'Aucun comparateur J5 transitoire pendant l’écriture.').toBeNull();
    expect(optionA.isConnected).toBe(true);
    expect(optionA).toHaveFocus();
    expect(optionA).not.toBeChecked();
    expect(slotState(container)).toBe('updating');
    expect(storedReference(container), 'La référence affichée reste celle de la comparaison déjà archivée.').toBe(firstReference);
    await act(async () => { heldCandidate.resolve(repo.current()); });
    await waitFor(() => expect(slotState(container)).toBe('ready'));
    expect(storedReference(container)).not.toBe(firstReference);
    expect(optionA).toHaveFocus();
    expect(repo.save).toHaveBeenCalledTimes(2);

    const heldDimension = deferred<HopV55Workspace | null>();
    repo.read.mockImplementationOnce(() => heldDimension.promise);
    const dimension = within(screen.getByRole('group', { name: 'Nuances comparées' })).getAllByRole('checkbox')
      .find(box => (box as HTMLInputElement).checked) as HTMLInputElement;
    dimension.focus();
    await user.keyboard(' ');
    expect(j5Heading()).toBeNull();
    expect(dimension.isConnected).toBe(true);
    expect(dimension).toHaveFocus();
    expect(dimension).not.toBeChecked();
    expect(slotState(container)).toBe('updating');
    await act(async () => { heldDimension.resolve(repo.current()); });
    await waitFor(() => expect(slotState(container)).toBe('ready'));
    expect(dimension).toHaveFocus();
    expect(repo.current().referenceComparisons, 'La politique d’archivage reste : une comparaison par sélection écrite.').toHaveLength(3);
  });

  it('montre une erreur explicite sans perdre le comparateur ni le focus quand l’écriture échoue', async () => {
    const { scenario, workspace, repo } = setup();
    const user = userEvent.setup();
    const { container } = render(<PageSlotHarness services={repo.services} workspace={workspace} record={scenario.record} snapshot={scenario.snapshot} />);
    await screen.findByRole('heading', { name: 'Comparer les nuances' });
    await waitFor(() => expect(slotState(container)).toBe('ready'));
    repo.save.mockRejectedValueOnce(Object.assign(new Error('Écriture refusée (fixture).'), { code: 'denied' }));
    const optionA = optionACheckbox();
    optionA.focus();
    await user.keyboard(' ');
    expect(await screen.findByRole('alert')).toHaveTextContent('La nouvelle comparaison n’a pas été conservée : Écriture refusée (fixture).');
    expect(j5Heading()).toBeNull();
    expect(optionA).toHaveFocus();
    expect(optionA).not.toBeChecked();
    expect(slotState(container)).toBe('ready');
    expect(repo.current().referenceComparisons).toHaveLength(1);
  });

  it('relit une archive telle que conservée, sans calcul ni lecture du dépôt', async () => {
    const { scenario, journal, workspace } = setup();
    const stored = createHopV55ReferenceComparison({ scenarioRecord: scenario.record, snapshotReference: scenario.snapshot.reference,
      referenceJournal: { record: journal.record, events: journal.events }, adoptedReference: journal.r2,
      selection: { candidateIds: ['baseline'], dimensionIds: [scenario.data.axis.id] } });
    const archivedWorkspace = { ...workspace, referenceComparisons: [stored] };
    const repo = repository(archivedWorkspace);
    const { container } = render(<PageSlotHarness services={repo.services} workspace={archivedWorkspace} record={scenario.record}
      snapshot={scenario.snapshot} archive />);
    expect(slotState(container), 'L’archive s’affiche sans état de chargement.').toBe('ready');
    expect(screen.getByText('Comparaison historique conservée')).toBeInTheDocument();
    expect(storedReference(container)).toBe(stored.contentReference);
    await screen.findByRole('heading', { name: 'Comparer les nuances' });
    expect(repo.read).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('ne sert jamais l’ancienne comparaison après un changement de référence adoptée', async () => {
    const { scenario, journal, workspace, repo } = setup();
    const { container, rerender } = render(<PageSlotHarness services={repo.services} workspace={workspace} record={scenario.record} snapshot={scenario.snapshot} />);
    await screen.findByRole('heading', { name: 'Comparer les nuances' });
    await waitFor(() => expect(slotState(container)).toBe('ready'));
    expect(container).toHaveTextContent('Comparaison à la référence adoptée · v2');

    const activated = activateReference(journal, journal.r1);
    const r1Workspace = { ...repo.current(), referenceJournal: { record: activated.record, events: activated.events } } as HopV55Workspace;
    if (getHopV55ReferenceProjection(r1Workspace)?.currentReference?.contentReference !== journal.r1.contentReference) {
      throw new Error('La fixture doit rendre R1 courante après activation.');
    }
    repo.replace(r1Workspace);
    const held = deferred<HopV55Workspace | null>();
    repo.read.mockImplementationOnce(() => held.promise);
    rerender(<PageSlotHarness services={repo.services} workspace={r1Workspace} record={scenario.record} snapshot={scenario.snapshot} />);
    await waitFor(() => expect(slotState(container)).toBe('loading'));
    expect(container).not.toHaveTextContent('· v2');
    expect(j5Heading()).toBeNull();
    await act(async () => { held.resolve(repo.current()); });
    await waitFor(() => expect(slotState(container)).toBe('ready'));
    expect(container).toHaveTextContent('Comparaison à la référence adoptée · v1');
  });

  it('contre-épreuve : l’effet et le ternaire d’origine montrent le J5 et perdent le focus pendant la même écriture', async () => {
    const { scenario, workspace, repo } = setup();
    const user = userEvent.setup();
    render(<LegacyHarness services={repo.services} workspace={workspace} record={scenario.record} snapshot={scenario.snapshot} />);
    await screen.findByRole('heading', { name: 'Comparer les nuances' });
    const held = deferred<HopV55Workspace | null>();
    repo.read.mockImplementationOnce(() => held.promise);
    const optionA = optionACheckbox();
    optionA.focus();
    await user.keyboard(' ');
    expect(j5Heading(), 'Le code d’origine bascule sur le comparateur J5 pendant l’écriture.').not.toBeNull();
    expect(optionA.isConnected).toBe(false);
    expect(document.activeElement).toBe(document.body);
    await act(async () => { held.resolve(repo.current()); });
    await screen.findByRole('heading', { name: 'Comparer les nuances' });
    expect(document.activeElement, 'Le focus n’est pas rendu à la case cochée.').toBe(document.body);
  });
});
