import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import * as scopeReading from '../../src/services/hopV55/questionScopeReading';
import * as semanticReading from '../../src/services/hopV55/questionSemanticReading';
import * as programPreparation from '../../src/services/hopV55/decisionProgramPreparation';
import { readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { HopV55Page } from '../../src/ui/hopV55/Page';

vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/Explorer', () => ({ HopV55Explorer: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/PropertyAdviceDecisionV3', () => ({ HopV55PropertyAdviceDecisionV3: () => null }));
vi.mock('../../src/ui/hopV55/PropertyAdviceDecisionV4', () => ({ HopV55PropertyAdviceDecisionV4: () => null }));
vi.mock('../../src/ui/hopV55/PropertyAdviceReexaminationPanelV4', () => ({ HopV55PropertyAdviceReexaminationPanelV4: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ownerKey = 'fixture:semantic-page-owner';
const question = 'Je veux garder le floral et ne pas augmenter l’amertume.';

function pageHarness() {
  const context = makeHopV55FixtureContext('planning');
  let stored: HopV55Workspace | undefined;
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number | null) => {
    if ((stored?.revision ?? null) !== expectedRevision) throw Object.assign(new Error('staleRevision'), { code: 'staleRevision' });
    stored = { ...structuredClone(next), revision: (stored?.revision ?? 0) + 1 };
    return structuredClone(stored);
  });
  const read = vi.fn(async (_owner: string, id: string) => stored?.id === id ? structuredClone(stored) : null);
  const services = {
    scope: 'fixture' as const, ownerKey,
    loadContext: vi.fn(async () => structuredClone(context)),
    workspaces: { list: vi.fn(async () => stored ? [structuredClone(stored)] : []), read, save },
    scenarios: { list: vi.fn(async () => []) },
  } as unknown as HopV55Services;
  return { context, services, save, read, stored: () => stored && structuredClone(stored) };
}

function availableArchives(workspace: HopV55Workspace) {
  return (workspace.decisionReadings ?? []).map(raw => {
    const read = readHopV55DecisionReadingArchive(raw);
    if (read.status !== 'available') throw new Error(`Archive de lecture invalide : ${read.status}`);
    return read.archive;
  });
}

async function readQuestionInPage(value: string) {
  fireEvent.change(await screen.findByRole('textbox', { name: 'Question au brasseur' }), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
}

describe('Page V5.5 — lecture sémantique V4', () => {
  it('archive la nouvelle lecture V4, corrige en nouvelle archive puis relit les deux sans parser', async () => {
    const harness = pageHarness();
    const readWithScopes = vi.spyOn(scopeReading, 'readHopV55QuestionSemanticWithScopesV1');
    const semanticParser = vi.spyOn(semanticReading, 'readHopV55QuestionSemanticV1');
    const view = render(<HopV55Page services={harness.services} />);

    await readQuestionInPage(question);
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(1));
    const originalRaw = structuredClone(harness.stored()!.decisionReadings![0]);
    const original = availableArchives(harness.stored()!)[0];
    expect(original.format).toBe('hop-v55-decision-reading-v4');
    if (original.format !== 'hop-v55-decision-reading-v4') throw new Error('Archive V4 attendue.');
    expect(original.reading.intent.question).toBe(question);
    expect(original.reading.annotations.map(row => row.source.text)).toEqual(expect.arrayContaining(['floral', 'amertume']));
    expect(readWithScopes).toHaveBeenCalledTimes(1);
    expect(semanticParser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Lecture initiale et préparation du programme'));
    await screen.findByText('Lecture sémantique V4');
    const annotation = original.reading.annotations.find(row => row.guard);
    if (!annotation?.guard) throw new Error('Garde sémantique V4 attendue pour le test de correction.');
    const correctedGuard = annotation.guard === 'preserve' ? 'noIncrease' : 'preserve';
    fireEvent.change(screen.getByRole('combobox', { name: `Garde de l’annotation · ${annotation.term}` }), {
      target: { value: correctedGuard },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif de la correction sémantique' }), {
      target: { value: 'Préciser la lecture sans changer le fragment original.' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Confirmer la correction sémantique' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette correction' }));

    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(2));
    const afterCorrection = harness.stored()!;
    const archives = availableArchives(afterCorrection);
    expect(afterCorrection.decisionReadings![0]).toEqual(originalRaw);
    expect(archives.every(row => row.format === 'hop-v55-decision-reading-v4')).toBe(true);
    const corrected = archives[1];
    expect(corrected.format).toBe('hop-v55-decision-reading-v4');
    if (corrected.format !== 'hop-v55-decision-reading-v4') throw new Error('La correction doit rester V4.');
    expect(corrected.reading.correction).toMatchObject({ sourceReadingReference: original.contentReference,
      actor: { label: 'Brasseur' }, reason: 'Préciser la lecture sans changer le fragment original.' });
    expect(corrected.reading.correction?.changedAnnotationIds).toContain(annotation.id);
    expect(corrected.reading.annotations.find(row => row.id === annotation.id)).toMatchObject({ source: annotation.source,
      guard: correctedGuard, origin: 'brasseur' });
    expect(readWithScopes).toHaveBeenCalledTimes(1);
    expect(semanticParser).toHaveBeenCalledTimes(1);

    view.unmount();
    render(<HopV55Page services={harness.services} />);
    await screen.findByTestId('hop-v55');
    fireEvent.click(screen.getByRole('button', { name: 'Décider' }));
    await screen.findByText('Lecture sémantique V4');
    expect(screen.getByText(/Corrigée explicitement le .*Préciser la lecture sans changer le fragment original/)).toBeVisible();
    expect(readWithScopes).toHaveBeenCalledTimes(1);
    expect(semanticParser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    fireEvent.click(screen.getByText(/Lectures et préparations de question · 2/));
    const rereadButtons = screen.getAllByRole('button', { name: 'Relire cette lecture' });
    fireEvent.click(rereadButtons[0]);
    await screen.findByText(/Lecture archivée · en lecture seule/);
    expect(availableArchives(harness.stored()!)[0]).toEqual(original);
    expect(readWithScopes).toHaveBeenCalledTimes(1);
    expect(semanticParser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(3));
    const reread = availableArchives(harness.stored()!)[2];
    expect(reread.format).toBe('hop-v55-decision-reading-v4');
    if (reread.format !== 'hop-v55-decision-reading-v4') throw new Error('Réinterprétation V4 attendue.');
    expect(reread.lineage).toMatchObject({ kind: 'reinterpretation', parentReadingReference: original.contentReference,
      actor: { origin: 'user', label: 'Brasseur' } });
    expect(harness.stored()!.decisionReadings![0]).toEqual(originalRaw);
    expect(readWithScopes).toHaveBeenCalledTimes(1);
    expect(semanticParser).toHaveBeenCalledTimes(2);
  });

  it('révise les portées V4 dans un ledger successoral sans convertir ni modifier le parent', async () => {
    const harness = pageHarness();
    const semanticReader = vi.spyOn(scopeReading, 'readHopV55QuestionSemanticWithScopesV1');
    const questionWithScopes = 'Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa.';
    render(<HopV55Page services={harness.services} />);
    await readQuestionInPage(questionWithScopes);
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(1));
    const parentRaw = structuredClone(harness.stored()!.decisionReadings![0]);
    const parent = availableArchives(harness.stored()!)[0];
    expect(parent.format).toBe('hop-v55-decision-reading-v4');
    if (parent.format !== 'hop-v55-decision-reading-v4' || !parent.scopeLedger) throw new Error('V4 avec ledger attendu.');
    expect(parent.scopeLedger.sourceScopes).toHaveLength(2);

    const panel = screen.getByTestId('hop-v55-semantic-scopes');
    fireEvent.click(within(panel).getByText(/Portées de la question · V4 · 2/));
    const scope = parent.scopeLedger.sourceScopes[1];
    const relatedScope = parent.scopeLedger.sourceScopes[0];
    fireEvent.click(within(panel).getByRole('checkbox', { name: `Relier « ${scope.sourceSpan.text} » à « ${relatedScope.sourceSpan.text} »` }));
    fireEvent.change(within(panel).getByRole('combobox', { name: `Disposition de ${scope.sourceSpan.text}` }), { target: { value: 'retained' } });
    fireEvent.change(within(panel).getByRole('textbox', { name: 'Motif des dispositions V4' }), {
      target: { value: 'Je confirme la portée de moment telle qu’écrite.' },
    });
    fireEvent.click(within(panel).getByRole('button', { name: 'Conserver les dispositions V4' }));

    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(2));
    const archives = availableArchives(harness.stored()!);
    expect(harness.stored()!.decisionReadings![0]).toEqual(parentRaw);
    expect(archives.every(row => row.format === 'hop-v55-decision-reading-v4')).toBe(true);
    const child = archives[1];
    expect(child.format).toBe('hop-v55-decision-reading-v4');
    if (child.format !== 'hop-v55-decision-reading-v4' || !child.scopeLedger) throw new Error('Successeur V4 attendu.');
    expect(child.transition).toMatchObject({ kind: 'reviseScopes', parentReadingReference: parent.contentReference,
      reason: 'Je confirme la portée de moment telle qu’écrite.' });
    expect(child.scopeLedger.entries.slice(0, parent.scopeLedger.entries.length)).toEqual(parent.scopeLedger.entries);
    expect(child.scopeLedger.entries.at(-1)).toMatchObject({ scopeId: scope.id, status: 'retained', sourceScope: scope,
      activeScope: { origin: 'brasseur', relatedScopeIds: [] } });
    expect(semanticReader).toHaveBeenCalledTimes(1);
  });

  it('archive une préparation incomplète de programme dans V4 et relit ses opérations sans reparser', async () => {
    const harness = pageHarness();
    const semanticReader = vi.spyOn(scopeReading, 'readHopV55QuestionSemanticWithScopesV1');
    const evaluator = vi.spyOn(programPreparation, 'prepareHopV55DecisionProgram');
    const simulation = vi.spyOn(await import('../../src/domain/brewingScenario'), 'simulateBrewingScenario');
    const query = 'Ajoute 20 g de houblon au whirlpool.';
    const view = render(<HopV55Page services={harness.services} />);
    await readQuestionInPage(query);
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(1));
    const parentRaw = structuredClone(harness.stored()!.decisionReadings![0]);
    const parent = availableArchives(harness.stored()!)[0];
    expect(parent.format).toBe('hop-v55-decision-reading-v4');
    if (parent.format !== 'hop-v55-decision-reading-v4') throw new Error('V4 source attendue.');
    expect(parent.reading.operationDrafts?.length).toBeGreaterThan(0);
    expect(parent.programPreparation).toBeUndefined();

    const currentSimulationCount = simulation.mock.calls.length;
    fireEvent.click(screen.getByText('Lecture et préparation de la demande'));
    await screen.findByRole('heading', { name: 'Ta demande et les voies examinées' });
    fireEvent.click(screen.getByRole('button', { name: 'Composer plusieurs opérations de programme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier et conserver cette préparation' }));
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(2));
    const archives = availableArchives(harness.stored()!);
    expect(harness.stored()!.decisionReadings![0]).toEqual(parentRaw);
    const prepared = archives[1];
    expect(prepared.format).toBe('hop-v55-decision-reading-v4');
    if (prepared.format !== 'hop-v55-decision-reading-v4' || !prepared.programPreparation) throw new Error('Préparation V4 archivée attendue.');
    expect(prepared.programPreparation.result.status).toBe('needsInput');
    expect(prepared.programPreparation.result.branch).toBeUndefined();
    expect(prepared.reading.operationDrafts).toEqual(prepared.programPreparation.input.operations);
    expect(prepared.reading.intent).toEqual(parent.reading.intent);
    const incompleteRaw = structuredClone(harness.stored()!.decisionReadings![1]);
    expect(evaluator).toHaveBeenCalledTimes(1);
    expect(simulation.mock.calls.length).toBe(currentSimulationCount);
    expect(semanticReader).toHaveBeenCalledTimes(1);

    view.unmount();
    render(<HopV55Page services={harness.services} />);
    await screen.findByTestId('hop-v55');
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    fireEvent.click(screen.getByText(/Lectures et préparations de question · 2/));
    fireEvent.click(screen.getAllByRole('button', { name: 'Relire cette lecture' })[1]);
    await screen.findByText('Préparation incomplète');
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre cette préparation dans le contexte actif' }));
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(3));
    const resumed = availableArchives(harness.stored()!)[2];
    expect(harness.stored()!.decisionReadings![1]).toEqual(incompleteRaw);
    expect(resumed.format).toBe('hop-v55-decision-reading-v4');
    if (resumed.format !== 'hop-v55-decision-reading-v4' || !resumed.programPreparation) throw new Error('Reprise V4 archivée attendue.');
    expect(resumed.programPreparation.input.operations).toEqual(prepared.programPreparation.input.operations);
    expect(resumed.programPreparation.result.status).toBe('needsInput');
    expect(semanticReader).toHaveBeenCalledTimes(1);
    expect(evaluator).toHaveBeenCalledTimes(2);
    expect(simulation.mock.calls.length).toBe(currentSimulationCount);
  });

  it('ne crée pas de ticket assisté pour V4 et indique la garde de version', async () => {
    const harness = pageHarness();
    const openAssisted = vi.fn();
    render(<HopV55Page services={harness.services} onOpenAssistedCompanion={openAssisted} />);
    await readQuestionInPage(question);
    await waitFor(() => expect(harness.stored()?.decisionReadings).toHaveLength(1));
    expect(availableArchives(harness.stored()!)[0].format).toBe('hop-v55-decision-reading-v4');
    expect(await screen.findByText(/Le conseil assisté n’accepte pas encore cette lecture sémantique V4/)).toBeVisible();
    expect(openAssisted).not.toHaveBeenCalled();
    expect(harness.stored()!.assistedAdviceTickets).toBeUndefined();
    expect(harness.stored()!.assistedAdviceRecords).toBeUndefined();
  });
});
