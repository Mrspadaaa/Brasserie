// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import * as brewingScenarioContext from '../../src/domain/brewingScenarioContext';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter, type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { simulateBrewingScenario, type BrewingScenarioBranchRequest } from '../../src/domain/brewingScenario';
import { loadHopCatalogueQualificationInput } from '../../src/domain/hopDecision/catalogueLoader';
import { qualifyHopCatalogueVariants, type HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import { coldContactBeerContextReference, coldContactQualificationReference } from '../../src/domain/hopDecision/coldContactEvidence';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { hopV55Workspace } from '../fixtures/hopV55';
import { projectHopV55ColdCatalogueClosure, createHopV55RecipeColdContactHost,
  type HopV55RecipeColdContactFrameV1 } from '../../src/services/hopV55/recipeColdContactHost';
import { prepareHopV55QualifiedColdContactEvidence } from '../../src/services/hopV55/qualifiedColdContactEvidence';
import { HopV55RecipeColdContactSelection } from '../../src/ui/hopV55/RecipeColdContactSelection';

afterEach(() => cleanup());

type TestScope = { kind: 'recipe'; id: string };
type Row = Record<string, any>;

class MemoryTable implements BrewingScenarioLocalTable<Row> {
  rows = new Map<string, Row>();
  constructor(private readonly type: 'dossier' | 'event') {}
  private key(input: unknown): string {
    if (Array.isArray(input)) return JSON.stringify(input);
    const row = input as Row;
    return JSON.stringify(this.type === 'dossier' ? [row.ownerKey, row.scenarioId] : [row.ownerKey, row.eventId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row ? structuredClone(row) : undefined; }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw Object.assign(new Error('Duplicate key'), { name: 'ConstraintError' });
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => {
      const expected = Array.isArray(key) ? key : [key];
      const fields = index.startsWith('[') ? index.slice(1, -1).split('+') : [index];
      return [...this.rows.values()].filter(row => JSON.stringify(fields.map(field => row[field])) === JSON.stringify(expected))
        .map(row => structuredClone(row));
    } }) };
  }
}

class MemoryScenarioDatabase implements BrewingScenarioLocalDatabaseAdapter {
  dossiers = new MemoryTable('dossier');
  events = new MemoryTable('event');
  async transaction<T>(_mode: 'r' | 'rw', ...args: unknown[]): Promise<T> {
    return (args.at(-1) as () => Promise<T>)();
  }
  close() { /* Adaptateur mémoire de test. */ }
}

function catalogueInput(context: BrewerContext) {
  return { saved: { varieties: context.hopIndex?.varieties ?? [], lots: context.hopIndex?.lots ?? [] } };
}

function makeHost(options: { context?: BrewerContext; generation?: number; scope?: TestScope; coldContext?: HopV55RecipeColdContactFrameV1<TestScope>['coldContext'];
  workspace?: ReturnType<typeof hopV55Workspace> | null; services?: { ownerKey: string; scenarios: ReturnType<typeof createBrewingScenarioLocalRepository> } } = {}) {
  const ownerKey = options.services?.ownerKey ?? 'owner:cold-host-test';
  const context = options.context ?? makeHopV55FixtureContext('planning');
  let frame: HopV55RecipeColdContactFrameV1<TestScope> | null = {
    ownerKey, scope: options.scope ?? { kind: 'recipe', id: 'recipe:cold-host-test' }, scopeReference: 'scope:cold-host-test',
    generation: options.generation ?? 1, context, coldContext: options.coldContext === undefined ? null : options.coldContext,
  };
  let workspace = options.workspace === undefined ? (() => {
    const row = hopV55Workspace(ownerKey, 'workspace:cold-host-test');
    row.scenarioIds = []; delete row.selected; delete row.activeScenarioId; return row;
  })() : options.workspace;
  const getFrame = vi.fn(async () => frame ? structuredClone(frame) : null);
  const getWorkspace = vi.fn(async () => workspace ? structuredClone(workspace) : null);
  const scenarios = options.services?.scenarios ?? createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
  const host = createHopV55RecipeColdContactHost({ services: { ownerKey, scenarios }, getFrame, getWorkspace, catalogueInput });
  return {
    host, getFrame, getWorkspace, scenarios,
    replaceFrame(next: HopV55RecipeColdContactFrameV1<TestScope> | null) { frame = next ? structuredClone(next) : null; },
    replaceWorkspace(next: typeof workspace) { workspace = next ? structuredClone(next) : null; },
  };
}

function selectionFor(source: { key: string; reference: string }, generation: number | string, additionId: string) {
  return { sourceKey: source.key, sourceReference: source.reference, generation,
    additionIds: [additionId], groupingReason: 'Les lignes sont regroupées uniquement comme hypothèse de contact à vérifier.' };
}

describe('host readonly de contact à froid depuis les sources locales', () => {
  it('réutilise une préparation par frame observée sans conserver de cache entre les opérations', async () => {
    const fixture = makeHost();
    const prepareContext = vi.spyOn(brewingScenarioContext, 'prepareBrewingScenarioContext');
    try {
      const listed = await fixture.host.readSources();
      expect(listed.status).toBe('ready');
      expect(prepareContext).toHaveBeenCalledTimes(4);
      if (listed.status !== 'ready') throw new Error(listed.reason);
      const source = listed.sources.find(row => row.kind === 'currentProgram')!;
      const addition = source.program.additions.find(row => row.use === 'fermentation' || row.use === 'postFermentation')!;

      prepareContext.mockClear();
      const prepared = await fixture.host.prepare(selectionFor(source, listed.generation, addition.id));
      expect(prepared.status).toBe('prepared');
      expect(prepareContext).toHaveBeenCalledTimes(16);
      if (prepared.status !== 'prepared') throw new Error(prepared.reason);
      expect(prepared.result.status).toBe('ready');

      prepareContext.mockClear();
      const reread = await fixture.host.readSources();
      expect(reread.status).toBe('ready');
      expect(prepareContext).toHaveBeenCalledTimes(4);
    } finally {
      prepareContext.mockRestore();
    }
  });

  it('accepte une horloge de lecture qui avance sans changement de source métier', async () => {
    const fixture = makeHost();
    const frame = await fixture.getFrame();
    if (!frame) throw new Error('Cadre de fixture absent.');
    let clock = 1000;
    fixture.getFrame.mockImplementation(async () => ({ ...structuredClone(frame),
      context: { ...structuredClone(frame.context), now: clock++ } }));
    const listed = await fixture.host.readSources();
    expect(listed.status).toBe('ready');
    if (listed.status !== 'ready') throw new Error(listed.reason);
    const source = listed.sources.find(row => row.kind === 'currentProgram')!;
    const addition = source.program.additions.find(row => row.use === 'fermentation' || row.use === 'postFermentation')!;
    const result = await fixture.host.prepare(selectionFor(source, listed.generation, addition.id));
    expect(result.status).toBe('prepared');
    if (result.status === 'prepared') expect(result.result.status).toBe('ready');
  });

  it('lie le programme physique courant, garde le contexte froid explicitement inconnu et ne crée aucun défaut de dose', async () => {
    const fixture = makeHost();
    const listed = await fixture.host.readSources();
    expect(listed.status).toBe('ready');
    if (listed.status !== 'ready') throw new Error(listed.reason);
    expect(listed.sources).toHaveLength(1);
    const source = listed.sources[0];
    expect(source.kind).toBe('currentProgram');
    expect(source.programReference).toBe(programFingerprint(source.program));
    expect(source.coldContext).toBeNull();
    const addition = source.program.additions.find(row => row.use === 'fermentation' || row.use === 'postFermentation')!;
    const result = await fixture.host.prepare(selectionFor(source, listed.generation, addition.id));
    expect(result.status).toBe('prepared');
    if (result.status !== 'prepared') throw new Error(result.reason);
    expect(result.result.status).toBe('ready');
    if (result.result.status !== 'ready') throw new Error(JSON.stringify(result.result));
    const wireProgram = result.result.evidence.assessment.inputSnapshot.program;
    expect(programFingerprint(wireProgram)).toBe(programFingerprint(source.program));
    expect(wireProgram.additions.find(row => row.id === addition.id)?.grams).toBe(addition.grams);
    expect(Object.prototype.hasOwnProperty.call(wireProgram.additions.find(row => row.id === addition.id), 'contactHours'))
      .toBe(Object.prototype.hasOwnProperty.call(addition, 'contactHours') && addition.contactHours !== undefined);
    expect(wireProgram.volumeL).toBe(20);
    expect(result.result.evidence.assessment.inputSnapshot.context).toBeNull();
    expect(result.result.evidence.sourceBinding.contextReference).toBe(coldContactBeerContextReference(null));
    expect(result.result.evidence.assessment.targetAssessment.valueBU).toBeNull();
    expect(fixture.getFrame).toHaveBeenCalled();
  });

  it('ne propose que la branche J5 exacte sélectionnée et refuse l’ancienne sélection après changement de source', async () => {
    const ownerKey = 'owner:cold-host-j5';
    const context = makeHopV55FixtureContext('planning');
    const prepared = brewingScenarioContext.prepareBrewingScenarioContext(context);
    const baseProgram = prepared.runtime.current!.program!;
    const first = baseProgram.additions[0];
    const branch: BrewingScenarioBranchRequest = { id: 'cold-branch-selected', label: 'Contact prévu distinct', assumptions: [],
      programChanges: [{ kind: 'replace', additionId: first.id, additions: [{ ...first, grams: (first.grams ?? 0) + 2 }] }] };
    const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'scenario:cold-host-j5', revision: 1, branches: [branch],
      intent: { question: 'Préserver la source de la branche pour une étude froide.', criteria: [{ id: 'keep-lines', label: 'Conserver les lignes', direction: 'keep' }] } });
    const result = simulateBrewingScenario(request, structuredClone(prepared.runtime));
    const db = new MemoryScenarioDatabase();
    const scenarios = createBrewingScenarioLocalRepository({ database: db });
    await scenarios.saveResult({ ownerKey, scenarioId: result.scenarioId, eventId: 'cold-j5-save',
      recordedAt: '2026-10-04T11:00:00.000Z', result });
    const recordRead = await scenarios.read(ownerKey, result.scenarioId);
    expect(recordRead?.status).toBe('available');
    if (!recordRead || recordRead.status !== 'available') throw new Error('Dossier J5 de fixture absent.');
    const snapshot = recordRead.record.currentSnapshot;
    const exactBranch = snapshot.result.branches.find(row => row.id === branch.id)!;
    expect(exactBranch.program).toBeTruthy();
    const workspace = hopV55Workspace(ownerKey, 'workspace:cold-host-j5');
    workspace.scenarioIds = [result.scenarioId];
    workspace.activeScenarioId = result.scenarioId;
    workspace.selected = { scenarioId: result.scenarioId, snapshotReference: snapshot.reference,
      branchId: exactBranch.id, branchReference: exactBranch.reference };
    const fixture = makeHost({ ownerKey, context, workspace, services: { ownerKey, scenarios } });
    const listed = await fixture.host.readSources();
    expect(listed.status).toBe('ready');
    if (listed.status !== 'ready') throw new Error(listed.reason);
    const j5 = listed.sources.find(row => row.kind === 'selectedScenarioBranch');
    expect(j5).toMatchObject({ programReference: programFingerprint(exactBranch.program!), scenario: {
      workspaceId: workspace.id, scenarioId: result.scenarioId, snapshotReference: snapshot.reference,
      branchId: exactBranch.id, branchReference: exactBranch.reference,
    } });
    const line = j5!.program.additions.at(-1)!;
    const ready = await fixture.host.prepare(selectionFor(j5!, listed.generation, line.id));
    expect(ready.status).toBe('prepared');
    if (ready.status !== 'prepared') throw new Error(ready.reason);
    expect(ready.result.status).toBe('ready');
    if (ready.result.status !== 'ready') throw new Error(JSON.stringify(ready.result));
    expect(ready.source.program).toEqual(j5!.program);

    const staleWorkspace = structuredClone(workspace);
    staleWorkspace.revision += 1;
    staleWorkspace.selected = { ...staleWorkspace.selected!, branchReference: 'branch-ref-changed' };
    fixture.replaceWorkspace(staleWorkspace);
    const refused = await fixture.host.prepare(selectionFor(j5!, listed.generation, line.id));
    expect(refused).toMatchObject({ status: 'refused', code: 'staleSource' });
  });

  it('refuse le changement de génération et l’identité de profil étrangère sans proposer un autre programme', async () => {
    const fixture = makeHost();
    const originalFrame = structuredClone((await fixture.getFrame())!);
    const listed = await fixture.host.readSources();
    expect(listed.status).toBe('ready');
    if (listed.status !== 'ready') throw new Error(listed.reason);
    const source = listed.sources[0];
    const current = fixture.getFrame.mock.results.at(-1)?.value as Promise<HopV55RecipeColdContactFrameV1<TestScope> | null>;
    const frame = structuredClone((await current)!);
    frame.generation = 2;
    fixture.replaceFrame(frame);
    const stale = await fixture.host.prepare(selectionFor(source, listed.generation, source.program.additions[0].id));
    expect(stale).toMatchObject({ status: 'refused', code: 'staleSource' });

    fixture.replaceFrame({ ...originalFrame, scope: { kind: 'recipe', id: 'recipe:other-scope' }, scopeReference: 'scope:other-scope' });
    const scopeStale = await fixture.host.prepare(selectionFor(source, listed.generation, source.program.additions[0].id));
    expect(scopeStale).toMatchObject({ status: 'refused', code: 'staleSource' });

    const changedCatalogueFrame = structuredClone(originalFrame);
    changedCatalogueFrame.context.hopIndex!.varieties[0].name += ' · version locale suivante';
    fixture.replaceFrame(changedCatalogueFrame);
    const catalogueStale = await fixture.host.prepare(selectionFor(source, listed.generation, source.program.additions[0].id));
    expect(catalogueStale).toMatchObject({ status: 'refused', code: 'staleSource' });

    const foreign = makeHost({ services: { ownerKey: 'owner:services', scenarios: fixture.scenarios } });
    const badFrame: HopV55RecipeColdContactFrameV1<TestScope> = {
      ownerKey: 'owner:other-profile', scope: { kind: 'recipe', id: 'recipe:foreign' }, scopeReference: 'scope:foreign',
      generation: 1, context: makeHopV55FixtureContext('planning'), coldContext: null,
    };
    foreign.replaceFrame(badFrame);
    expect(await foreign.host.readSources()).toMatchObject({ status: 'unavailable' });

    const missingColdFrame = makeHost();
    const incomplete = structuredClone((await missingColdFrame.getFrame())!) as HopV55RecipeColdContactFrameV1<TestScope> & { coldContext?: null };
    delete incomplete.coldContext;
    missingColdFrame.replaceFrame(incomplete);
    expect(await missingColdFrame.host.readSources()).toMatchObject({ status: 'unavailable' });
  });
});

describe('fermeture qualifiée des matières réellement sélectionnées', () => {
  it('réduit le catalogue offline complet sans perdre la collision de variété liée au lot', async () => {
    const seed = await loadHopCatalogueQualificationInput();
    expect(seed.variants.length).toBeGreaterThan(100);
    const selectedLot = seed.variants.find(row => row.scope === 'lot' && row.recordId === 'public-coa-cas-2400')!;
    const varietyId = selectedLot.material.lot!.varietyId;
    const seedVariety = seed.variants.find(row => row.scope === 'variety' && row.recordId === varietyId)!;
    const baseVariety = seedVariety.material.variety!;
    const collidingSavedVersion: HopVariety = { ...structuredClone(baseVariety), form: 'unknown' };
    expect(collidingSavedVersion.form).not.toBe(baseVariety.form);
    const complete = await loadHopCatalogueQualificationInput({ saved: { varieties: [collidingSavedVersion] } });
    const selectedMaterialId = selectedLot.material.id;
    const closure = projectHopV55ColdCatalogueClosure(complete, [selectedMaterialId]);
    expect(closure.sourceVariantCount).toBe(complete.variants.length);
    expect(closure.input.variants.length).toBeLessThan(complete.variants.length);
    expect(closure.input.variants.filter(row => row.material.id === selectedMaterialId)).toHaveLength(1);
    const retainedGroup = qualifyHopCatalogueVariants(closure.input).groups.find(row => row.scope === 'variety' && row.recordId === varietyId);
    expect(retainedGroup?.status).toBe('collisionNeedsSelection');
    expect(retainedGroup?.rawVariants).toHaveLength(2);
    expect(closure.input.assembly.notices).toEqual(complete.assembly.notices.filter(row => row.materialId === selectedMaterialId));
    expect(closure.input.assembly.limitations).toEqual(complete.assembly.limitations);
    expect(closure.input.basisEvidence).toEqual(complete.basisEvidence?.filter(row => closure.includedVariantIds.includes(row.variantId)) ?? []);

    const program = { id: 'program:catalogue-closure', revision: 1, stage: 'conditioning' as const,
      volumeL: null, wortGravity: null, additions: [{ id: 'addition:lot-contact', materialId: selectedMaterialId,
        grams: null, use: 'postFermentation' as const, status: 'planned' as const, contactHours: null, temperatureC: null }] };
    const scope = { kind: 'recipe', id: 'recipe:catalogue-closure' };
    const source = { ownerKey: 'owner:catalogue-closure', scope, scopeReference: 'scope:catalogue-closure',
      programReference: programFingerprint(program), qualificationReference: coldContactQualificationReference(closure.input),
      contextReference: coldContactBeerContextReference(null), program, qualificationInput: closure.input };
    const prepared = await prepareHopV55QualifiedColdContactEvidence({ selection: {
      programReference: source.programReference, qualificationReference: source.qualificationReference,
      contextReference: source.contextReference, additionIds: ['addition:lot-contact'],
      groupingReason: 'Une ligne lot est conservée comme hypothèse distincte; sa variété reste non résolue.',
    }, authority: { ownerKey: source.ownerKey, scope, scopeReference: source.scopeReference,
      knownReferences: { program: new Set([source.programReference]), qualification: new Set([source.qualificationReference]),
        context: new Set([source.contextReference]) }, resolveCanonicalSource: async () => structuredClone(source) } });
    expect(prepared.status).toBe('ready');
    if (prepared.status !== 'ready') throw new Error(`Fermeture compacte et collision exacte attendues : ${JSON.stringify(prepared)}.`);
    expect(prepared.evidence.assessment.inputSnapshot.qualificationInput).toEqual(closure.input);
    expect(prepared.evidence.assessment.qualificationSnapshot.groups.find(row => row.scope === 'variety' && row.recordId === varietyId))
      .toMatchObject({ status: 'collisionNeedsSelection', rawVariants: expect.arrayContaining([expect.any(Object), expect.any(Object)]) });
    expect(prepared.evidence.assessment.inputSnapshot.context).toBeNull();
    expect(prepared.evidence.assessment.targetAssessment.valueBU).toBeNull();
    expect(prepared.payload.utf8Bytes).toBeLessThanOrEqual(100_000);
    expect(prepared.payload.maxDepth).toBeLessThanOrEqual(18);

    // Same full offline library, but a small programme contact directly on the
    // collision record has no unqualified analysis rows to break the wire format.
    const context = makeHopV55FixtureContext('planning');
    context.hopIndex!.varieties.push(structuredClone(collidingSavedVersion));
    context.recipe!.hops[0] = { ...context.recipe!.hops[0], name: baseVariety.name, hopVarietyId: varietyId,
      stage: 'dryHop', dayOffset: 3, aromaTiming: 'postFermentation', aromaContactHours: 24, aromaTemperatureC: 14 };
    const hostFixture = makeHost({ context });
    const listed = await hostFixture.host.readSources();
    expect(listed.status).toBe('ready');
    if (listed.status !== 'ready') throw new Error(listed.reason);
    const current = listed.sources.find(row => row.kind === 'currentProgram')!;
    const collisionLine = current.program.additions[0]!;
    expect(current.materials.some(row => row.id === collisionLine.materialId)).toBe(true);
    expect(collisionLine).toBeTruthy();
    const linked = await hostFixture.host.prepare(selectionFor(current, listed.generation, collisionLine!.id));
    expect(linked.status).toBe('prepared');
    if (linked.status !== 'prepared') throw new Error(linked.reason);
    expect(linked.result.status).toBe('ready');
    if (linked.result.status !== 'ready') throw new Error(JSON.stringify(linked.result));
    const linkedGroup = linked.result.evidence.assessment.qualificationSnapshot.groups.find(row => row.scope === 'variety' && row.recordId === varietyId);
    expect(linkedGroup).toMatchObject({ status: 'collisionNeedsSelection', rawVariants: expect.any(Array) });
    expect(linkedGroup?.rawVariants).toHaveLength(2);
    expect(linked.result.evidence.assessment.inputSnapshot.qualificationInput.variants).toHaveLength(3);
    expect(linked.result.evidence.assessment.inputSnapshot.qualificationInput.variants.filter(row => row.scope === 'variety')).toHaveLength(2);
    expect(linked.result.evidence.assessment.inputSnapshot.qualificationInput.variants.filter(row => row.scope === 'assignment'))
      .toMatchObject([{ recordId: collisionLine!.materialId, origin: { kind: 'assignment' } }]);
    expect(linked.result.evidence.assessment.inputSnapshot.context).toBeNull();
    expect(linked.result.evidence.assessment.targetAssessment.valueBU).toBeNull();
    expect(linked.result.payload.utf8Bytes).toBeLessThanOrEqual(100_000);
    expect(linked.result.payload.maxDepth).toBeLessThanOrEqual(18);
  });
});

describe('sélecteur accessible sans saisie de masse', () => {
  it('exige une source, une ligne exacte et un motif avant de préparer; aucun geste ne modifie le programme', async () => {
    const fixture = makeHost();
    const onPrepared = vi.fn();
    render(createElement(HopV55RecipeColdContactSelection, { host: fixture.host, onPrepared }));
    const sourceSelect = await screen.findByLabelText('Programme à examiner');
    const option = await screen.findByRole('option', { name: /Programme courant/ });
    fireEvent.change(sourceSelect, { target: { value: option.getAttribute('value') } });
    const listed = await fixture.host.readSources();
    if (listed.status !== 'ready') throw new Error(listed.reason);
    const source = listed.sources[0];
    const addition = source.program.additions.find(row => row.use === 'fermentation' || row.use === 'postFermentation')!;
    fireEvent.click(screen.getByRole('checkbox', { name: `Sélectionner ${addition.materialId}` }));
    fireEvent.change(screen.getByLabelText('Pourquoi ces lignes représentent-elles un même contact ?'), {
      target: { value: 'Une seule ligne explicitement choisie pour cette hypothèse.' },
    });
    expect(screen.queryByRole('spinbutton')).toBeNull();
    const prepareButton = screen.getByRole('button', { name: 'Préparer la référence de contact' });
    expect(prepareButton).toBeEnabled();
    fireEvent.click(prepareButton);
    await waitFor(() => expect(onPrepared).toHaveBeenCalledOnce());
    expect(onPrepared.mock.calls[0][0]).toMatchObject({ status: 'prepared', source: { programReference: programFingerprint(source.program) } });
    expect(screen.getByText(/Référence préparée/)).toBeInTheDocument();
    expect(screen.getByText(/Contexte de bière au contact non attesté/)).toBeInTheDocument();
    expect(screen.getByText('Identité fictive B', { exact: true })).toBeInTheDocument();
    expect(fixture.getFrame.mock.calls.length).toBeGreaterThan(2);
  });
});
