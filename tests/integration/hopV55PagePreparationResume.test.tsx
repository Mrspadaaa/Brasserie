import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildHopV55DecisionCriteria, readHopV55Question } from '../../src/services/hopV55/decision';
import { applyHopV55DecisionCriteriaCorrection } from '../../src/services/hopV55/decisionCorrection';
import * as decisionService from '../../src/services/hopV55/decision';
import * as preparationService from '../../src/services/hopV55/decisionProgramPreparation';
import * as brewingScenarioDomain from '../../src/domain/brewingScenario';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';

// Keep the real Page, history, DecisionResponse and resume handler. Isolate only
// unrelated panels which do not participate in this archived preparation flow.
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()),
  HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/Explorer', () => ({ HopV55Explorer: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));

import { HopV55Page } from '../../src/ui/hopV55/Page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const question = 'Remplace un ajout prévu par Hallertau Blanc, sans fixer la dose. Je veux plus de poire, garder le floral et ne pas augmenter l’amertume.';
const workspaceId = 'workspace:preparation-resume';
const ownerKey = 'fixture:preparation-resume-owner';

function preparationResumeHarness() {
  const context = makeHopV55FixtureContext('planning');
  const hallertau: HopVariety = { id: 'hop-v55-fixture-hallertau-blanc', name: 'Hallertau Blanc', aliases: [],
    form: 'unknown', descriptions: [], analysis: [] };
  context.hopIndex!.varieties.push(hallertau);
  const prepared = prepareBrewingScenarioContext(context);
  const program = prepared.runtime.current?.program;
  const sourceAddition = program?.additions[0];
  const sourceMaterial = prepared.runtime.materials.find(row => row.id === sourceAddition?.materialId);
  const targetMaterial = prepared.runtime.materials.find(row => row.variety?.id === hallertau.id);
  if (!program || !sourceAddition || !sourceMaterial || !targetMaterial) throw Error('La fixture doit charger le programme source A et Hallertau Blanc.');

  const parsed = readHopV55Question(question, prepared);
  const poire = parsed.criterionDrafts.find(row => row.source.text.toLocaleLowerCase('fr').includes('poire'));
  if (!poire || !parsed.response) throw Error('La fixture doit contenir un critère poire et une réponse lisible.');
  const correctedDrafts = parsed.criterionDrafts.map(row => row.id === poire.id
    ? { ...row, term: 'poire fraîche', origin: 'brasseur' as const }
    : row);
  const reading = applyHopV55DecisionCriteriaCorrection({ reading: { ...parsed, branches: [] }, criterionDrafts: correctedDrafts,
    prepared, sourceReadingReference: 'reading:before-correction', recordedAt: '2026-10-02T14:00:00.000Z' });
  const operationSpan = 'Remplace un ajout prévu par Hallertau Blanc';
  const operations = [{ id: 'operation:replace-source-a', label: 'Remplacer A par Hallertau Blanc', kind: 'replace' as const,
    additionId: sourceAddition.id, sourceMaterialId: sourceAddition.materialId, sourceUse: sourceAddition.use,
    materialId: targetMaterial.id, dose: { kind: 'explicit' as const, grams: null },
    sourceSpan: { start: question.indexOf(operationSpan), end: question.indexOf(operationSpan) + operationSpan.length, text: operationSpan } }];
  const input = { branch: { id: 'branch:resume-incomplete', label: 'Remplacement à compléter' }, program,
    materials: prepared.runtime.materials, intent: { question, interpretation: reading.interpretation,
      criteria: buildHopV55DecisionCriteria(reading.criterionDrafts) }, operations };
  const result = preparationService.prepareHopV55DecisionProgram(input);
  if (result.status !== 'needsInput' || result.needs.map(row => row.field).join(',') !== 'quantity') {
    throw Error(`La fixture attend uniquement la dose, reçu ${result.status}: ${result.needs.map(row => row.field).join(',')}.`);
  }
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:preparation-resume', ownerKey, workspaceId,
    recordedAt: '2026-10-02T14:01:00.000Z', reading,
    source: { kind: 'recipe', id: context.recipe!.id }, runtimeReference: 'runtime:before-current-context',
    programPreparation: { input, result } });
  const baseWorkspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Reprise de préparation synthétique', intent: structuredClone(reading.intent), sourceRecipeId: context.recipe!.id,
    decisionReadings: [archive], scenarioIds: [], snapshotIntents: [], referenceHypotheses: [], copies: [],
    updatedAt: new Date(context.now).toISOString() };
  const workspace = ensureHopV55ReferenceJournal(baseWorkspace, context, prepared);
  let stored: HopV55Workspace | undefined = structuredClone(workspace);
  let liveContext: BrewerContext = structuredClone(context);
  let deferredContextLoad: { promise: Promise<BrewerContext>; resolve(value: BrewerContext): void; started(): void } | undefined;
  const loadContext = vi.fn(async () => {
    const pending = deferredContextLoad;
    if (!pending) return structuredClone(liveContext);
    deferredContextLoad = undefined;
    pending.started();
    return pending.promise;
  });
  const read = vi.fn(async (_owner: string, id: string) => stored?.id === id ? structuredClone(stored) : null);
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number) => {
    if (!stored || stored.id !== next.id || stored.revision !== expectedRevision) throw Error('staleRevision');
    stored = { ...structuredClone(next), revision: expectedRevision + 1 };
    return structuredClone(stored);
  });
  const services = {
    scope: 'fixture' as const, ownerKey, loadContext,
    workspaces: { list: vi.fn(async () => stored ? [structuredClone(stored)] : []), read, save },
    scenarios: { list: vi.fn(async () => []) },
  } as unknown as HopV55Services;

  return {
    services, context, prepared, program, sourceMaterial, targetMaterial, reading, archive, input, result,
    get stored() { return stored; }, get liveContext() { return liveContext; },
    setLiveContext(next: BrewerContext) { liveContext = structuredClone(next); },
    deferNextContextLoad() {
      let resolve!: (value: BrewerContext) => void;
      let started!: () => void;
      const startedPromise = new Promise<void>(done => { started = done; });
      const promise = new Promise<BrewerContext>(done => { resolve = done; });
      deferredContextLoad = { promise, resolve, started };
      return { started: startedPromise, resolve: (value: BrewerContext) => resolve(structuredClone(value)) };
    },
  };
}

describe('Page V5.5 — reprise exacte d’une préparation de programme archivée', () => {
  it('reprend A→Hallertau après reload, retire le vieux conseil du contexte courant et garde l’archive source intacte', async () => {
    const h = preparationResumeHarness();
    const originalPrefix = structuredClone(h.stored!.decisionReadings![0]);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const prepare = vi.spyOn(preparationService, 'prepareHopV55DecisionProgram');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    const saveRecipeCopy = vi.fn(async (recipe: never) => recipe);
    render(<HopV55Page services={h.services} onSaveRecipeCopy={saveRecipeCopy} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette lecture', exact: true }));
    const resume = await screen.findByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' });
    const archiveRegion = screen.getByRole('region', { name: 'Préparation de programme archivée' });
    expect(archiveRegion).toHaveTextContent('Identité fictive A vers Hallertau Blanc');
    expect(archiveRegion.querySelector('[aria-label="Entrée exacte de l’opération 1"]')).toHaveTextContent(/masse inconnue/i);
    expect(within(archiveRegion).getByText('Quantité à préciser')).toBeVisible();
    expect(h.reading.criterionDrafts.some(row => row.term === 'poire fraîche' && row.origin === 'brasseur')).toBe(true);
    expect(prepare).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();

    fireEvent.click(resume);

    await waitFor(() => expect(h.stored?.decisionReadings).toHaveLength(2));
    const old = h.stored!.decisionReadings!.find(row => row.contentReference === h.archive.contentReference)!;
    const next = h.stored!.decisionReadings!.find(row => row.contentReference !== h.archive.contentReference)!;
    expect(old).toEqual(originalPrefix);
    const decoded = readHopV55DecisionReadingArchive(next);
    expect(decoded.status).toBe('available');
    if (decoded.status !== 'available' || decoded.archive.format !== 'hop-v55-decision-reading-v2') throw Error('Nouvelle archive V2 attendue.');
    expect(decoded.archive.reading.intent.question).toBe(question);
    expect(decoded.archive.reading.intent.criteria).toEqual(h.reading.intent.criteria);
    expect(decoded.archive.reading.criterionDrafts).toEqual(h.reading.criterionDrafts);
    expect(decoded.archive.reading.correction).toEqual(h.reading.correction);
    expect(decoded.archive.reading.operationDrafts).toEqual(h.input.operations);
    expect(decoded.archive.reading.branches).toEqual([]);
    expect(decoded.archive.reading.response).toBeUndefined();
    expect(decoded.archive.reading.unresolved).toContain('Le contexte de la préparation a changé. Les opérations sont reprises avec leurs choix; les compatibilités doivent être vérifiées avant comparaison.');
    expect(decoded.archive.programPreparation?.input.operations).toEqual(h.input.operations);
    expect(decoded.archive.programPreparation?.input.program).toEqual(h.program);
    expect(decoded.archive.programPreparation?.result.status).toBe('needsInput');
    expect(decoded.archive.programPreparation?.result.needs.map(row => row.field)).toEqual(['quantity']);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();
    expect(saveRecipeCopy).not.toHaveBeenCalled();
    expect(screen.getByText(/Choix archivés repris sans calcul\. Le contexte a changé/)).toBeVisible();
    expect(screen.queryByText(h.reading.response?.answer ?? '')).not.toBeInTheDocument();
  });

  it('refuse le contexte qui a changé pendant l’action sans retirer ni remplacer l’archive', async () => {
    const h = preparationResumeHarness();
    const originalPrefix = structuredClone(h.stored!.decisionReadings![0]);
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const prepare = vi.spyOn(preparationService, 'prepareHopV55DecisionProgram');
    const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
    render(<HopV55Page services={h.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette lecture', exact: true }));
    const resume = await screen.findByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' });
    await waitFor(() => expect(h.services.loadContext).toHaveBeenCalledTimes(2));
    const contextReadsBeforeResume = h.services.loadContext.mock.calls.length;
    const pendingContext = h.deferNextContextLoad();

    fireEvent.click(resume);
    await waitFor(() => expect(h.services.loadContext).toHaveBeenCalledTimes(contextReadsBeforeResume + 1));
    await pendingContext.started;
    const changed = structuredClone(h.liveContext);
    changed.recipe!.hops![0].weightG = 41;
    pendingContext.resolve(changed);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some(alert => alert.textContent?.includes('Le contexte affiché a changé pendant la reprise'))).toBe(true);
    expect(alerts).toHaveLength(1);
    expect(h.stored?.decisionReadings).toHaveLength(1);
    expect(h.stored?.decisionReadings?.[0]).toEqual(originalPrefix);
    expect(h.stored?.decisionReadings?.[0].contentReference).toBe(h.archive.contentReference);
    expect(prepare).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();
    expect(h.services.workspaces.save).not.toHaveBeenCalled();
  });
});
