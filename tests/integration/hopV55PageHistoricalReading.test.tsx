import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopV55Services, HopV55Intent, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildBrewingScenarioRequest, brewingScenarioCurrentReference } from '../../src/domain/brewingScenario';
import * as brewingScenarioDomain from '../../src/domain/brewingScenario';
import { createBrewingScenarioDossier, readBrewingScenarioRecord } from '../../src/domain/brewingScenarioDossier';
import { createHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import * as decisionService from '../../src/services/hopV55/decision';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';

// Keep the real Page history and restoration code, while isolating expensive panels.
vi.mock('../../src/ui/hopV55/DecisionResponse', () => ({
  HopV55DecisionResponse: ({ reading }: { reading: { intent: { question: string } } }) =>
    <output data-testid="historical-decision-reading">{reading.intent.question}</output>,
}));
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

const q1: HopV55Intent = {
  question: 'Q1 · préserver le floral du premier essai.',
  criteria: [{ id: 'q1-floral', label: 'Critère floral Q1', direction: 'keep', familyId: 'floral' }],
};
const q2: HopV55Intent = {
  question: 'Q2 · rechercher la poire du deuxième essai.',
  criteria: [{ id: 'q2-pear', label: 'Critère poire Q2', direction: 'increase', familyId: 'pomeFruit' }],
};

function historicalFixture(snapshotIntent: 'unlinked' | 'linked' | 'absent') {
  const ownerKey = 'fixture-historical-reading-owner';
  const workspaceId = `workspace-historical-reading-${snapshotIntent}`;
  const scenarioId = `scenario-historical-reading-${snapshotIntent}`;
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  if (!current) throw new Error('La fixture historique doit contenir une entrée J1 canonique.');

  // Build the canonical immutable J5 result before installing no-compute spies.
  const request = buildBrewingScenarioRequest({ scenarioId, revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program !== undefined ? { program: current.program } : {}),
    contextReference: brewingScenarioCurrentReference(current),
  } });
  const result = brewingScenarioDomain.simulateBrewingScenario(request, prepared.runtime);
  const created = createBrewingScenarioDossier({ ownerKey, scenarioId,
    eventId: `event-historical-reading-${snapshotIntent}`, recordedAt: '2026-10-02T12:00:00.000Z', result });
  const scenarioRecord = readBrewingScenarioRecord(created.dossier, [created.event]);
  if ('status' in scenarioRecord) throw new Error('Le snapshot canonique de fixture doit être relisible.');
  const snapshot = scenarioRecord.currentSnapshot;

  const archive = (readingId: string, intent: HopV55Intent, recordedAt: string) => createHopV55DecisionReadingArchive({
    id: readingId, ownerKey, workspaceId, recordedAt,
    reading: { intent: structuredClone(intent), interpretation: `Lecture archivistique ${readingId}.`, branches: [], unresolved: [] },
    source: { kind: 'recipe', id: context.recipe!.id }, runtimeReference: `runtime-${readingId}`,
  });
  const q1Archive = archive(`reading-q1-${snapshotIntent}`, q1, '2026-10-02T12:01:00.000Z');
  // This newer workspace reading is a decoy: a historical snapshot without a
  // reading pointer must clear it instead of pairing Q1's frozen result with Q2.
  const q2Archive = archive(`reading-q2-${snapshotIntent}`, q2, '2026-10-02T12:02:00.000Z');

  const snapshotIntents: NonNullable<HopV55Workspace['snapshotIntents']> = snapshotIntent === 'absent' ? [] : [{
    scenarioId, snapshotReference: snapshot.reference, intent: structuredClone(q1),
    ...(snapshotIntent === 'linked' ? { decisionReadingReference: q1Archive.contentReference } : {}),
  }];
  const draft: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Q2 actif · Q1 historique', intent: structuredClone(q2),
    sourceRecipeId: context.recipe!.id, decisionReadings: [q1Archive, q2Archive],
    scenarioIds: [scenarioId], snapshotIntents, referenceHypotheses: [], copies: [],
    updatedAt: '2026-10-02T12:03:00.000Z',
  };
  const workspace = ensureHopV55ReferenceJournal(draft, context, prepared);
  const scenarioRows = [{ scope: 'local' as const, scenarioId,
    result: { status: 'available' as const, record: scenarioRecord } }];
  const save = vi.fn(async (updated: HopV55Workspace) => ({ ...structuredClone(updated), revision: updated.revision + 1 }));
  const services = {
    scope: 'fixture' as const, ownerKey,
    loadContext: vi.fn(async () => structuredClone(context)),
    workspaces: {
      list: vi.fn(async () => [structuredClone(workspace)]),
      read: vi.fn(async (_requestedOwner: string, id: string) => id === workspace.id ? structuredClone(workspace) : null),
      save,
    },
    scenarios: { list: vi.fn(async () => structuredClone(scenarioRows)) },
  } as unknown as HopV55Services;
  return { services, workspace, snapshot, q1Archive, q2Archive, save };
}

async function openHistoricalPreview(h: ReturnType<typeof historicalFixture>) {
  const parser = vi.spyOn(decisionService, 'readHopV55Question');
  const simulate = vi.spyOn(brewingScenarioDomain, 'simulateBrewingScenario');
  render(<HopV55Page services={h.services} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
  fireEvent.click(await screen.findByRole('button', { name: 'Relire la prévision v1', exact: true }));
  await screen.findByRole('heading', { name: 'Répondre, puis arbitrer' });
  return { parser, simulate };
}

describe('Page V5.5 — question historique liée au snapshot exact', () => {
  it('garde Q1 et ses critères sans joindre une lecture lorsque le lien du snapshot est absent', async () => {
    const h = historicalFixture('unlinked');
    const { parser, simulate } = await openHistoricalPreview(h);
    expect(screen.getByRole('textbox', { name: 'Question au brasseur' })).toHaveValue(q1.question);
    expect(screen.getByText('Garder · Critère floral Q1')).toBeInTheDocument();
    expect(screen.queryByTestId('historical-decision-reading')).not.toBeInTheDocument();
    expect(screen.queryByText(q2.question)).not.toBeInTheDocument();
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();
    expect(h.save).not.toHaveBeenCalled();
  });

  it('ne joint que l’archive Q1 référencée exactement par le snapshot', async () => {
    const h = historicalFixture('linked');
    const { parser, simulate } = await openHistoricalPreview(h);
    expect(screen.getByRole('textbox', { name: 'Question au brasseur' })).toHaveValue(q1.question);
    expect(screen.getByText('Garder · Critère floral Q1')).toBeInTheDocument();
    expect(await screen.findByTestId('historical-decision-reading')).toHaveTextContent(q1.question);
    expect(screen.queryByText(q2.question)).not.toBeInTheDocument();
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();
    expect(h.save).not.toHaveBeenCalled();
  });

  it('efface intention et lecture si le snapshot n’a pas de snapshotIntent, sans toucher au Q2 durable', async () => {
    const h = historicalFixture('absent');
    const { parser, simulate } = await openHistoricalPreview(h);
    expect(screen.getByRole('textbox', { name: 'Question au brasseur' })).toHaveValue('');
    expect(screen.queryByText('Garder · Critère floral Q1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('historical-decision-reading')).not.toBeInTheDocument();
    expect(screen.queryByText(q2.question)).not.toBeInTheDocument();
    expect(screen.getByText(/Aucune question ni aucun critère ne sont liés à cette ancienne prévision/)).toBeInTheDocument();
    expect(h.workspace.intent).toEqual(q2);
    expect(h.save).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(simulate).not.toHaveBeenCalled();
  });
});
