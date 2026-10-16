import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { Recipe } from '../../src/types';
import type { HopV55Copy, HopV55ContextSource, HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import { HOP_V55_PROGRAM_COPY_FORMAT, type HopV55ProgramCopy } from '../../src/services/hopV55/programCopy';
import type { HopV55RecipeDraftTarget } from '../../src/services/hopV55/recipeDraftApplication';

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
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

import { HopV55Page } from '../../src/ui/hopV55/Page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ownerKey = 'fixture:recipe-draft-workspace-source';
const workspaceId = 'workspace:recipe-draft-workspace-source';
type WorkspacePointer = 'activeCopy' | 'activeProgramCopy' | 'activeFutureDraft';

function contexts() {
  const sourceContext = makeHopV55FixtureContext('planning');
  const sourceRecipe = sourceContext.recipe!;
  sourceRecipe.id = 'recipe-draft-target-shared-source-id';
  sourceRecipe.name = 'Recette enregistrée source';
  sourceRecipe.volumeL = 20;
  const draftContext = structuredClone(sourceContext);
  draftContext.recipe!.name = 'Brouillon courant';
  draftContext.recipe!.volumeL = 23;
  const copyContext = structuredClone(sourceContext);
  copyContext.recipe!.name = 'Copie historique';
  copyContext.recipe!.volumeL = 25;
  return { sourceContext, draftContext, copyContext };
}

function oldCopy(recipe: Recipe): HopV55Copy {
  return { id: 'recipe-copy-old-25l', recipe: structuredClone(recipe), sourceRecipeId: recipe.id,
    previewReference: 'fixture-copy-preview-25l', scenarioId: 'fixture-copy-scenario-25l',
    snapshotReference: 'fixture-copy-snapshot-25l', branchId: 'fixture-copy-branch-25l',
    branchReference: 'fixture-copy-branch-reference-25l', createdAt: '2026-10-03T10:00:00.000Z', scope: 'local' };
}

function oldProgramCopy(context: BrewerContext): HopV55ProgramCopy {
  const prepared = prepareBrewingScenarioContext(context);
  const programBefore = structuredClone(prepared.runtime.current!.program!);
  const programAfter = { ...structuredClone(programBefore), revision: programBefore.revision + 1 };
  return { format: HOP_V55_PROGRAM_COPY_FORMAT, id: 'program-copy-old-25l', label: 'Programme historique 25 L',
    sourceProgramId: programBefore.id, contextReference: 'fixture-program-context-25l', scenarioId: 'fixture-program-scenario-25l',
    snapshotReference: 'fixture-program-snapshot-25l', branchId: 'fixture-program-branch-25l',
    branchReference: 'fixture-program-branch-reference-25l', programBefore, programAfter,
    inputAfter: structuredClone(prepared.runtime.current!.input), sourceRuntimeReference: 'fixture-runtime-25l',
    previewReference: 'fixture-program-preview-25l', createdAt: '2026-10-03T10:00:00.000Z', scope: 'local' };
}

function harness(pointer: WorkspacePointer) {
  const { sourceContext, draftContext, copyContext } = contexts();
  const archivedCopy = oldCopy(copyContext.recipe!);
  const base: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Workspace de la recette source 20 L', intent: { question: '', criteria: [] },
    sourceRecipeId: sourceContext.recipe!.id, scenarioIds: [], referenceHypotheses: [], copies: [archivedCopy],
    updatedAt: '2026-10-03T10:00:00.000Z' };
  const withJournal = ensureHopV55ReferenceJournal(base, sourceContext, prepareBrewingScenarioContext(sourceContext));
  const staleSource = { kind: 'localFutureDraft' as const, workspaceId, draftId: 'draft-cache-étranger', revision: 1,
    contentReference: 'future-draft-cache-étranger-25l' };
  const workspace: HopV55Workspace = pointer === 'activeCopy'
    ? { ...withJournal, activeCopyId: archivedCopy.id }
    : pointer === 'activeProgramCopy'
      ? { ...withJournal, programCopies: [oldProgramCopy(copyContext)], activeProgramCopyId: 'program-copy-old-25l' }
      : { ...withJournal, activeFutureDraftSource: staleSource };
  let stored = structuredClone(workspace);
  const loadContext = vi.fn(async (recipe?: Recipe, source?: HopV55ContextSource) => {
    if (!recipe && !source) return structuredClone(draftContext);
    if (source?.kind === 'localRecipeCopy') return structuredClone(copyContext);
    if (source?.kind === 'localFutureDraft') return makeHopV55FixtureContext('unknown');
    if (source?.kind === 'recipe' && source.recipeId === sourceContext.recipe!.id) return structuredClone(sourceContext);
    return structuredClone(draftContext);
  });
  const loadFutureDraft = vi.fn(async () => { throw new Error('La révision de cache étrangère ne doit pas être restaurée dans le brouillon courant.'); });
  const save = vi.fn(async (next: HopV55Workspace) => {
    stored = { ...structuredClone(next), revision: stored.revision + 1 };
    return structuredClone(stored);
  });
  const target: HopV55RecipeDraftTarget = { ownerKey, draftId: sourceContext.recipe!.id, apply: vi.fn() };
  const services = { scope: 'fixture' as const, ownerKey, loadContext, loadFutureDraft,
    workspaces: { list: vi.fn(async () => [structuredClone(stored)]), read: vi.fn(async (_owner: string, id: string) =>
      id === workspaceId ? structuredClone(stored) : null), save, close: vi.fn() },
    scenarios: { list: vi.fn(async () => []) },
  } as unknown as HopV55Services;
  return { sourceContext, draftContext, copyContext, archivedCopy, workspace, loadContext, loadFutureDraft, save, target, services,
    stored: () => structuredClone(stored) };
}

function assertCurrentDraftVisible() {
  const root = screen.getByTestId('hop-v55');
  const context = root.querySelector('.hv-context');
  expect(context).toHaveTextContent('Brouillon courant');
  expect(context).toHaveTextContent('23 L');
  expect(context).not.toHaveTextContent('25 L');
  expect(context).not.toHaveTextContent('copie locale');
}

describe('Page V5.5 — la source d’un brouillon recette ouvert', () => {
  it.each(['activeCopy', 'activeProgramCopy', 'activeFutureDraft'] as const)(
    'garde le contexte 23 L du brouillon et ne restaure pas implicitement %s du workspace homonyme', async pointer => {
      const h = harness(pointer);
      render(<HopV55Page services={h.services} recipeDraftTarget={h.target} />);

      await screen.findByTestId('hop-v55');
      await waitFor(assertCurrentDraftVisible);
      expect(h.loadContext).toHaveBeenCalledTimes(2);
      expect(h.loadContext.mock.calls.every(([recipe, source]) => recipe === undefined && source === undefined)).toBe(true);
      expect(h.loadFutureDraft).not.toHaveBeenCalled();
      expect(h.target.apply).not.toHaveBeenCalled();
      expect(h.save).not.toHaveBeenCalled();
      expect(h.stored()).toMatchObject({ sourceRecipeId: h.sourceContext.recipe!.id, copies: [h.archivedCopy] });
      expect(h.stored().referenceJournal?.record.reference).toBe(h.workspace.referenceJournal?.record.reference);

      fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
      await screen.findByText('Copies distinctes');
      expect(screen.getByText(/Copie historique.*03\.10\.26/)).toBeInTheDocument();
      if (pointer === 'activeProgramCopy') {
        expect(screen.getByText('Programmes futurs locaux')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Programme historique 25 L/u })).toBeInTheDocument();
      }
      if (pointer === 'activeFutureDraft') expect(h.stored().activeFutureDraftSource).toEqual(h.workspace.activeFutureDraftSource);
      fireEvent.click(screen.getByRole('button', { name: 'Ma bière', exact: true }));
      await waitFor(assertCurrentDraftVisible);
      expect(h.loadContext.mock.calls.every(([recipe, source]) => recipe === undefined && source === undefined)).toBe(true);
      expect(h.target.apply).not.toHaveBeenCalled();
    });
});



