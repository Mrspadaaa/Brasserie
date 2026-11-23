import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { brewingScenarioCurrentReference } from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { previewHopProgramChanges } from '../../src/domain/hopDecision/programs';
import type { HopProgramChange } from '../../src/domain/hopDecision/types';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { rebaseHopV55ProgramCopy } from '../../src/services/hopV55/programOverlay';
import type { HopV55ProgramCopy } from '../../src/services/hopV55/programCopy';

async function fermentingContext(stockGrams?: number) {
  const context = makeHopV55FixtureContext('fermenting');
  const references = await loadBrewingCatalogueReferences();
  const existing = context.hopIndex!;
  context.hopIndex = {
    ...existing,
    varieties: [...existing.varieties, ...references.varieties],
    knowledge: [...existing.knowledge, ...references.knowledge],
  };
  if (stockGrams !== undefined) {
    context.recipe!.hops[0].stockItemRef = 'fixture-stock-hop-0';
    context.inventory = [{ id: 'fixture-stock-row-0', ref: 'fixture-stock-hop-0', name: 'Matière de fixture',
      category: 'Houblon', unit: 'g', currentStock: stockGrams, minStock: 0, reorder: false }];
  }
  return { context, prepared: prepareBrewingScenarioContext(context) };
}

function changedAddition(program: NonNullable<ReturnType<typeof prepareBrewingScenarioContext>['runtime']['current']>['program'], delta: number): HopProgramChange {
  if (!program) throw new Error('Programme de fixture attendu.');
  const planned = program.additions.find(row => row.status === 'planned');
  if (!planned || planned.grams === null) throw new Error('Ajout futur avec masse explicite attendu.');
  return { kind: 'replace', additionId: planned.id, additions: [{ ...structuredClone(planned), grams: planned.grams + delta }] };
}

function copyWithProgramAfter(context: BrewerContext, prepared: ReturnType<typeof prepareBrewingScenarioContext>, programAfter: NonNullable<ReturnType<typeof prepareBrewingScenarioContext>['runtime']['current']>['program']): HopV55ProgramCopy {
  const current = prepared.runtime.current;
  if (!current?.program || !programAfter) throw new Error('Programme source et cible attendus.');
  return {
    format: 'hop-v55-program-copy-v1', id: 'program-copy-overlay-fixture', label: 'Correction de programme future',
    sourceProgramId: current.program.id, batchId: context.batch?.id,
    contextReference: brewingScenarioCurrentReference(current), scenarioId: 'scenario-overlay-fixture',
    snapshotReference: 'snapshot-overlay-fixture', branchId: 'branch-overlay-fixture', branchReference: 'branch-overlay-fixture-reference',
    programBefore: structuredClone(current.program), programAfter: structuredClone(programAfter), inputAfter: structuredClone(current.input),
    sourceRuntimeReference: 'runtime-overlay-fixture-reference', previewReference: 'preview-overlay-fixture-reference',
    createdAt: '2026-10-02T10:00:00.000Z', scope: 'local',
  };
}

describe('Rebase de copie future dans le dépôt workspace', () => {
  it('rebase une copie puis sa correction en conservant le delta complet et les opérations effectuées', async () => {
    const { context, prepared } = await fermentingContext();
    const source = prepared.runtime.current?.program;
    if (!source) throw new Error('La fixture doit lier le programme J1 courant.');
    const firstChange = changedAddition(source, 2);
    const copiedProgram = previewHopProgramChanges(source, [firstChange], prepared.runtime.materials).program;
    const copy = copyWithProgramAfter(context, prepared, copiedProgram);
    const secondChange = changedAddition(copiedProgram, 5);
    const finalProgram = previewHopProgramChanges(copiedProgram, [secondChange], prepared.runtime.materials).program;

    const rebased = rebaseHopV55ProgramCopy(prepared, copy, [secondChange]);
    const reapplied = previewHopProgramChanges(source, rebased, prepared.runtime.materials).program;

    expect(reapplied.additions).toEqual(finalProgram.additions);
    expect(rebased).toHaveLength(1);
    expect(rebased[0]).toMatchObject({ kind: 'replace', additionId: 'recipe-hop:1' });
    expect(reapplied.additions.find(row => row.id === 'recipe-hop:0')).toEqual(source.additions.find(row => row.id === 'recipe-hop:0'));
    expect(reapplied.additions.find(row => row.id === 'recipe-hop:1')?.grams)
      .toBe(source.additions.find(row => row.id === 'recipe-hop:1')!.grams! + 7);
  });

  it('refuse le rebase si le fait déjà effectué de la source a changé', async () => {
    const first = await fermentingContext();
    const source = first.prepared.runtime.current?.program;
    if (!source) throw new Error('La fixture doit lier le programme J1 courant.');
    const copy = copyWithProgramAfter(first.context, first.prepared,
      previewHopProgramChanges(source, [changedAddition(source, 2)], first.prepared.runtime.materials).program);
    const changedContext = structuredClone(first.context);
    changedContext.journal!.additions!['hop-0'].amount = 41;
    const changedPrepared = prepareBrewingScenarioContext(changedContext);

    expect(changedPrepared.runtime.current?.program?.additions.find(row => row.id === 'recipe-hop:0'))
      .toMatchObject({ grams: 41, status: 'performed' });
    expect(() => rebaseHopV55ProgramCopy(changedPrepared, copy, [changedAddition(copy.programAfter, 1)]))
      .toThrow(/journal ou le stock a changé/i);
  });

  it('refuse le rebase lorsque la référence de solde préparée a changé', async () => {
    const first = await fermentingContext(120);
    const source = first.prepared.runtime.current?.program;
    if (!source) throw new Error('La fixture doit lier le programme J1 courant.');
    expect(first.prepared.runtime.current?.stockAvailabilityReference).toBeTruthy();
    const copy = copyWithProgramAfter(first.context, first.prepared,
      previewHopProgramChanges(source, [changedAddition(source, 2)], first.prepared.runtime.materials).program);
    const changedContext = structuredClone(first.context);
    changedContext.inventory![0].currentStock = 80;
    const changedPrepared = prepareBrewingScenarioContext(changedContext);

    expect(changedPrepared.runtime.current?.stockAvailabilityReference)
      .not.toBe(first.prepared.runtime.current?.stockAvailabilityReference);
    expect(() => rebaseHopV55ProgramCopy(changedPrepared, copy, [changedAddition(copy.programAfter, 1)]))
      .toThrow(/journal ou le stock a changé/i);
  });
});
