import { describe, expect, it, vi } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { BrewingScenarioBranchRequest } from '../../src/domain/brewingScenario';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { prepareHopV55DecisionProgram } from '../../src/services/hopV55/decisionProgramPreparation';
import { createHopV55DecisionReadingArchive, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import {
  HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT,
  appendHopV55ExplorationTrialPreparationRecord,
  appendHopV55ExplorationTrialReceiptRecord,
  assertHopV55ExplorationTrialAppendOnly,
  assertHopV55ExplorationTrialWorkspaceCollections,
  confirmHopV55ExplorationTrialV1,
  createHopV55ExplorationTrialOriginContextV1,
  createHopV55ExplorationTrialProgramCopyRebaseV1,
  createHopV55ExplorationTrialReceiptV1,
  prepareHopV55ExplorationTrialV1,
  readHopV55ExplorationTrialPreparationV1,
  readHopV55ExplorationTrialReceiptV1,
  type HopV55ExplorationTrialCaptureV1,
  type HopV55ExplorationTrialEntryV1,
} from '../../src/services/hopV55/explorationTrialPreparation';
import { createHopV55ExplorationProfile } from '../../src/services/hopV55/explorationProfiles';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { HopV55ProgramCopy } from '../../src/services/hopV55/programCopy';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';

const ownerKey = 'fixture:exploration-trial';
const workspaceId = 'workspace:exploration-trial';
const source = { kind: 'recipe' as const, recipeId: 'recipe:physical-a' };
const sourceReference = 'recipe-reference:physical-a';
const runtimeReference = 'runtime:physical-a:v1';
const program: HopDecisionProgram = { id: 'program:physical-a', revision: 1, stage: 'planning', volumeL: 20,
  wortGravity: null, additions: [] };
const material: HopDecisionMaterial = { id: 'variety:hallertau', name: 'Hallertau', form: 'pelletT90',
  variety: { id: 'hallertau', name: 'Hallertau', form: 'pelletT90', analysis: [], descriptions: [] } } as unknown as HopDecisionMaterial;
const yeast = { id: 'yeast:ale', kind: 'yeast' as const, name: 'Levure ale fixture', betaLyase: 'unknown' as const,
  source: { title: 'Fiche culture fixture', author: 'Catalogue local', year: 2026, kind: 'manufacturer' as const,
    reference: 'fixture:yeast:ale', locator: 'Entrée locale de test.' } };
const programReference = programFingerprint(program);
const profileDraft = { label: 'Profil d’essai', status: 'hypothesis' as const, scope: 'explorationOnly' as const,
  description: 'Hypothèse de comparaison, pas mesure du lot.', criteria: [{ direction: 'keep' as const, label: 'Garder le floral',
    family: { key: 'axis:1@1:floral', axisId: 'axis:1', version: '1', name: 'Floral', terms: ['floral'] } }] };
const profile = createHopV55ExplorationProfile(profileDraft, { profileId: 'profile:exact-v1',
  recordedAt: '2026-10-04T10:00:00.000Z', newId: () => 'criterion:floral' });
const branchReference = (branch: BrewingScenarioBranchRequest) =>
  hopAdviceContentReference('hop-v55-exploration-trial-j5-branch-v1', branch);

function readingArchive(runtime = runtimeReference) {
  return createHopV55DecisionReadingArchive({ id: 'reading:exact', ownerKey, workspaceId,
    recordedAt: '2026-10-04T09:59:00.000Z',
    reading: { intent: { question: 'Ajouter Hallertau au premier moût.', criteria: [] }, interpretation: 'Question relue.', branches: [], unresolved: [] },
    source: { kind: 'recipe', id: source.recipeId }, runtimeReference: runtime });
}

function preparedEntry(overrides: HopV55ExplorationTrialEntryV1['overrides'] = { volumeL: 25, yeastId: 'yeast:ale' }): HopV55ExplorationTrialEntryV1 {
  const operation = { id: 'operation:add-hallertau', label: 'Ajouter Hallertau au premier moût', kind: 'add' as const,
    additionId: 'scenario-hop:first-wort', materialId: material.id, grams: 8, use: 'firstWort' as const };
  const preparationInput = { branch: { id: 'branch:hallertau', label: 'Hallertau au premier moût' },
    program, materials: [material], intent: { question: 'Ajouter Hallertau au premier moût.', interpretation: 'Essai préparé explicitement.', criteria: [] },
    operations: [operation] };
  const preparation = prepareHopV55DecisionProgram(preparationInput);
  if (preparation.status !== 'ready' || !preparation.branch) throw new Error('La préparation J1 de fixture doit être prête.');
  const assumptionRows = [
    ...(overrides.volumeL !== undefined ? [{ id: 'assumption:volume', path: 'recipe.volumeL', label: 'Volume hypothétique choisi',
      status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Volume choisi explicitement pour cet essai.',
      value: overrides.volumeL, unit: 'L' }] : []),
    ...(overrides.yeastId !== undefined ? [{ id: 'assumption:yeast', path: 'recipe.yeastId', label: 'Culture hypothétique choisie',
      status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Culture choisie explicitement pour cet essai.',
      value: overrides.yeastId }] : []),
  ];
  const programOrigin = { kind: 'physicalSource' as const, reference: sourceReference };
  const originContext = createHopV55ExplorationTrialOriginContextV1({ ownerKey, workspaceId, source, sourceReference,
    runtimeReference, cultureBindingReference: null, readingReference: readingArchive().contentReference,
    programOrigin, programReference });
  return { format: HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT, commandId: 'exploration-command:exact',
    originProgramReference: programReference, originContext,
    lineOrigins: preparation.operations.map(operation => ({ operationId: operation.id,
      originProgramReference: programReference, originContextReference: originContext.reference })),
    programReference, preparationInput: structuredClone(preparationInput), preparation,
    branch: { ...structuredClone(preparation.branch), inputOverrides: {
      ...(overrides.volumeL !== undefined ? { volumeL: overrides.volumeL } : {}),
      ...(overrides.yeastId !== undefined ? { yeastId: overrides.yeastId } : {}),
    }, assumptions: [...preparation.branch.assumptions, ...assumptionRows] },
    overrides: structuredClone(overrides), profileSnapshot: { kind: 'persisted', profile: structuredClone(profile) }, comparisonSnapshot: null };
}

function capture(archive = readingArchive(), entry = preparedEntry()): HopV55ExplorationTrialCaptureV1 {
  return { ownerKey, workspaceId, source, sourceReference, runtimeReference, cultureBinding: null,
    readingArchive: archive, program: structuredClone(program), programOrigin: { kind: 'physicalSource', reference: sourceReference },
    j5Branch: structuredClone(entry.branch), programCopyRebase: null,
    intent: { question: 'Ajouter Hallertau au premier moût.', criteria: [] }, target: null,
    materials: [structuredClone(material)], yeasts: [structuredClone(yeast)],
    input: { reference: 'input:physical-a:v1', volumeL: 20, yeastId: null }, workspaceProfiles: [structuredClone(profile)] };
}

function createPreparation(c: HopV55ExplorationTrialCaptureV1 | undefined = undefined, entry = preparedEntry()) {
  const currentCapture = c ?? capture(readingArchive(), entry);
  const result = prepareHopV55ExplorationTrialV1({ ...currentCapture, identity: { id: entry.commandId,
    scenarioId: 'scenario:exploration-command-exact', scenarioPreparationId: 'scenario-preparation:exploration-command-exact',
    eventId: 'scenario-event:exploration-command-exact', recordedAt: '2026-10-04T10:02:00.000Z' }, entry });
  if (result.status !== 'ready') throw new Error(result.reason);
  return result.preparation;
}

function workspaceBase(): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0, title: 'Essai fixture',
    intent: { question: 'Ajouter Hallertau au premier moût.', criteria: [] }, sourceRecipeId: source.recipeId,
    decisionReadings: [readingArchive()], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-04T10:00:00.000Z',
    explorationProfiles: [profile], explorationTrialPreparations: [], explorationTrialReceipts: [], scenarioPreparations: [], snapshotIntents: [] };
}

describe('hop-v55 exploration trial preparation', () => {
  it('scelle le contexte exact, les overrides explicitement hypothétiques et le profil V1 choisi, puis confirme sans recalcul', () => {
    const input = capture();
    const entry = preparedEntry();
    const j1 = vi.fn(() => entry.preparation);
    const prepared = createPreparation(input, entry);
    const read = readHopV55ExplorationTrialPreparationV1(prepared);
    expect(read).toMatchObject({ status: 'available', preparation: {
      source, sourceReference, runtimeReference, readingReference: input.readingArchive?.contentReference,
      programReference, entry: { commandId: entry.commandId, profileSnapshot: { profile: { reference: profile.reference } },
        overrides: { volumeL: 25, yeastId: 'yeast:ale' } },
    } });
    expect(read.status === 'available' && read.preparation.entry.branch.assumptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'recipe.volumeL', value: 25, origin: 'userHypothesis', status: 'selected', unit: 'L' }),
      expect.objectContaining({ path: 'recipe.yeastId', value: 'yeast:ale', origin: 'userHypothesis', status: 'selected' }),
    ]));
    expect(j1).not.toHaveBeenCalled();

    const current = confirmHopV55ExplorationTrialV1({ preparation: prepared, current: { ...input, entry } });
    expect(current).toMatchObject({ status: 'current', preparationReference: prepared.reference,
      scenarioId: prepared.scenarioId, scenarioPreparationId: prepared.scenarioPreparationId, eventId: prepared.eventId,
      branch: entry.branch });
    expect(readHopV55DecisionReadingArchive(input.readingArchive).status).toBe('available');
  });

  it('refuse un runtime qui ne correspond pas à la lecture scellée, une source ou un programme A→B', () => {
    const entry = preparedEntry();
    const mismatchedReading = readingArchive('runtime:old');
    expect(prepareHopV55ExplorationTrialV1({ ...capture(mismatchedReading), identity: {
      id: entry.commandId, scenarioId: 'scenario:a', scenarioPreparationId: 'prep:a', eventId: 'event:a', recordedAt: '2026-10-04T10:02:00.000Z' }, entry }))
      .toMatchObject({ status: 'refused', code: 'invalidInput' });

    const prepared = createPreparation();
    expect(confirmHopV55ExplorationTrialV1({ preparation: prepared, current: { ...capture(), entry,
      source: { kind: 'recipe', recipeId: 'recipe:other' }, sourceReference: 'recipe-reference:other' } }))
      .toMatchObject({ status: 'stale' });
    expect(confirmHopV55ExplorationTrialV1({ preparation: prepared, current: { ...capture(), entry,
      runtimeReference: 'runtime:changed' } })).toMatchObject({ status: 'stale' });
    const changedProgram = { ...program, revision: 2 };
    expect(confirmHopV55ExplorationTrialV1({ preparation: prepared, current: { ...capture(), entry,
      program: changedProgram } })).toMatchObject({ status: 'stale' });
  });

  it('refuse un profil persisté absent et une comparison dont les références ne couvrent pas la lecture exacte', () => {
    const entry = preparedEntry();
    const input = capture();
    expect(prepareHopV55ExplorationTrialV1({ ...input, workspaceProfiles: [], identity: {
      id: entry.commandId, scenarioId: 'scenario:profile', scenarioPreparationId: 'prep:profile', eventId: 'event:profile',
      recordedAt: '2026-10-04T10:02:00.000Z' }, entry })).toMatchObject({ status: 'refused', code: 'profileUnavailable' });

    const comparisonMaterial = { ...material, id: 'variety:alternative', name: 'Alternative', variety: { ...material.variety, id: 'alternative', name: 'Alternative' } } as HopDecisionMaterial;
    const sourceMaterial = material;
    const snapshot = { sourceId: sourceMaterial.id, alternativeId: comparisonMaterial.id,
      sourceMaterial, alternativeMaterial: comparisonMaterial, sourceMaterialReference: 'material:source',
      alternativeMaterialReference: 'material:alternative', readingReference: input.readingArchive?.contentReference,
      profileSnapshotReference: profile.reference, reference: 'comparison:sealed' };
    const comparisonEntry = { ...entry, preparationInput: { ...entry.preparationInput, materials: [sourceMaterial, comparisonMaterial] },
      comparisonSnapshot: snapshot };
    const reader = vi.fn(() => ({ status: 'current' as const, sourceId: sourceMaterial.id, alternativeId: comparisonMaterial.id,
      sourceMaterialReference: 'material:source', alternativeMaterialReference: 'material:alternative',
      readingReference: 'reading:other', profileSnapshotReference: profile.reference, reference: 'comparison:sealed' }));
    expect(prepareHopV55ExplorationTrialV1({ ...input, materials: [sourceMaterial, comparisonMaterial], identity: {
      id: entry.commandId, scenarioId: 'scenario:comparison', scenarioPreparationId: 'prep:comparison', eventId: 'event:comparison',
      recordedAt: '2026-10-04T10:02:00.000Z' }, entry: comparisonEntry, readComparison: reader }))
      .toMatchObject({ status: 'refused', code: 'comparisonInvalid' });
    expect(reader).toHaveBeenCalledWith({ snapshot, sourceMaterial, alternativeMaterial: comparisonMaterial });
  });

  it('scelle le rebase explicite d’une copie sur le programme physique, sans écraser le résultat J1', () => {
    const copyAddition = { id: 'copy-addition:existing', materialId: material.id, grams: 3, use: 'firstWort' as const,
      status: 'planned' as const };
    const copyProgram: HopDecisionProgram = { ...program, revision: 2, additions: [copyAddition] };
    const copy: HopV55ProgramCopy = { format: 'hop-v55-program-copy-v1', id: 'program-copy:exact', label: 'Copie locale fixture',
      sourceProgramId: program.id, contextReference: 'context:recipe-a', scenarioId: 'scenario:seed',
      snapshotReference: 'snapshot:seed', branchId: 'branch:seed', branchReference: 'branch:seed-ref',
      programBefore: structuredClone(program), programAfter: structuredClone(copyProgram), inputAfter: {} as HopV55ProgramCopy['inputAfter'],
      sourceRuntimeReference: runtimeReference, previewReference: 'program-copy-preview:exact', createdAt: '2026-10-04T10:01:00.000Z', scope: 'local' };
    const operation = { id: 'operation:add-trial', label: 'Ajouter Hallertau au premier moût', kind: 'add' as const,
      additionId: 'scenario-hop:trial', materialId: material.id, grams: 8, use: 'firstWort' as const };
    const preparationInput = { branch: { id: 'branch:copy-trial', label: 'Copie plus ajout test' }, program: copyProgram,
      materials: [material], intent: { question: 'Ajouter Hallertau au premier moût.', interpretation: 'Essai explicite.', criteria: [] },
      operations: [operation] };
    const j1 = prepareHopV55DecisionProgram(preparationInput);
    if (j1.status !== 'ready' || !j1.branch) throw new Error('Résultat J1 prêt attendu.');
    const programReference = programFingerprint(copyProgram);
    const programOrigin = { kind: 'programCopy' as const, id: copy.id, reference: copy.previewReference };
    const originContext = createHopV55ExplorationTrialOriginContextV1({ ownerKey, workspaceId, source, sourceReference,
      runtimeReference, cultureBindingReference: null, readingReference: readingArchive().contentReference,
      programOrigin, programReference });
    const entry: HopV55ExplorationTrialEntryV1 = { format: HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT,
      commandId: 'exploration-command-copy-rebase', originProgramReference: programReference, originContext,
      lineOrigins: [{ operationId: operation.id, originProgramReference: programReference, originContextReference: originContext.reference }],
      programReference, preparationInput, preparation: j1, branch: structuredClone(j1.branch), overrides: {},
      profileSnapshot: null, comparisonSnapshot: null };
    const rebasedChanges = [
      { kind: 'append' as const, addition: structuredClone(copyAddition) },
      ...(j1.branch.programChanges ?? []),
    ];
    const j5Branch: BrewingScenarioBranchRequest = { ...structuredClone(j1.branch), programChanges: rebasedChanges };
    const programCopyRebase = createHopV55ExplorationTrialProgramCopyRebaseV1({ copy: structuredClone(copy),
      sourceProgram: structuredClone(program), sourceProgramReference: programFingerprint(program),
      originalBranchReference: branchReference(entry.branch), rebasedChanges: structuredClone(rebasedChanges),
      j5BranchReference: branchReference(j5Branch) });
    const input = { ...capture(readingArchive(), entry), program: structuredClone(copyProgram), programOrigin,
      j5Branch, programCopyRebase };
    const prepared = prepareHopV55ExplorationTrialV1({ ...input, identity: { id: entry.commandId,
      scenarioId: 'scenario:copy-rebase', scenarioPreparationId: 'prep:copy-rebase', eventId: 'event:copy-rebase',
      recordedAt: '2026-10-04T10:02:00.000Z' }, entry });
    expect(prepared).toMatchObject({ status: 'ready', preparation: { entry: { branch: j1.branch }, j5Branch,
      programCopyRebase: { copy: { id: copy.id, previewReference: copy.previewReference }, sourceProgram: program, rebasedChanges } } });
    if (prepared.status !== 'ready') throw new Error(prepared.reason);
    expect(prepared.preparation.entry.branch).toEqual(j1.branch);
    expect(confirmHopV55ExplorationTrialV1({ preparation: prepared.preparation, current: { ...input, entry } }))
      .toMatchObject({ status: 'current', branch: j5Branch });
    const workspaceWithCopy = { ...workspaceBase(), programCopies: [copy] };
    expect(appendHopV55ExplorationTrialPreparationRecord(workspaceWithCopy, prepared.preparation).explorationTrialPreparations)
      .toHaveLength(1);
    const changedCopy = { ...copy, previewReference: 'program-copy-preview:changed' };
    expect(() => appendHopV55ExplorationTrialPreparationRecord({ ...workspaceBase(), programCopies: [changedCopy] }, prepared.preparation))
      .toThrow(/origine exacte du programme/u);

    const changedPhysical = { ...program, revision: program.revision + 1 };
    expect(() => createHopV55ExplorationTrialProgramCopyRebaseV1({ copy,
      sourceProgram: changedPhysical, sourceProgramReference: programFingerprint(changedPhysical),
      originalBranchReference: branchReference(entry.branch), rebasedChanges,
      j5BranchReference: branchReference(j5Branch) })).toThrow(/programme physique exact/u);
  });

  it('conserve la préparation avant J5, puis lie un reçu au même événement, snapshot et branche exacte', () => {
    const preparation = createPreparation();
    const base = workspaceBase();
    const staged = appendHopV55ExplorationTrialPreparationRecord(base, preparation);
    expect(staged.explorationTrialPreparations).toEqual([preparation]);
    expect(() => createHopV55ExplorationTrialReceiptV1({ preparation,
      result: { scenarioId: preparation.scenarioId, snapshotReference: 'snapshot:before-j5', branchId: preparation.entry.branch.id },
      recordedAt: '2026-10-04T10:03:00.000Z' })).not.toThrow();

    const result = { scenarioId: preparation.scenarioId, snapshotReference: 'snapshot:exact', branchId: preparation.entry.branch.id };
    const receipt = createHopV55ExplorationTrialReceiptV1({ preparation, result, recordedAt: '2026-10-04T10:03:00.000Z' });
    expect(readHopV55ExplorationTrialReceiptV1(receipt)).toMatchObject({ status: 'available', receipt });
    const committed = { ...staged, revision: 2,
      scenarioPreparations: [{ id: preparation.scenarioPreparationId, scenarioId: preparation.scenarioId, ownerKey, workspaceId }],
      snapshotIntents: [{ scenarioId: preparation.scenarioId, snapshotReference: result.snapshotReference,
        decisionReadingReference: preparation.readingReference }] } as unknown as HopV55Workspace;
    const withReceipt = appendHopV55ExplorationTrialReceiptRecord(committed, receipt);
    expect(withReceipt.explorationTrialReceipts).toEqual([receipt]);
    assertHopV55ExplorationTrialWorkspaceCollections(withReceipt);
    expect(appendHopV55ExplorationTrialReceiptRecord(withReceipt, receipt)).toEqual(withReceipt);
    const tampered = { ...receipt, snapshotReference: 'snapshot:wrong' };
    expect(readHopV55ExplorationTrialReceiptV1(tampered)).toMatchObject({ status: 'invalid' });
    expect(() => appendHopV55ExplorationTrialReceiptRecord(withReceipt, tampered)).toThrow(/reçu V1 valide/u);
    const stagedJ5 = { ...staged, scenarioPreparations: [{ id: preparation.scenarioPreparationId,
      scenarioId: preparation.scenarioId, ownerKey, workspaceId }] } as unknown as HopV55Workspace;
    expect(() => appendHopV55ExplorationTrialReceiptRecord(stagedJ5, receipt)).toThrow(/snapshot J5/u);
  });

  it('garde les archives append-only, les formats futurs et les refs réservées au lieu de replier', () => {
    const preparation = createPreparation();
    const future = { format: 'hop-v55-exploration-trial-preparation-v2', id: preparation.id, opaque: true };
    const damaged = { ...preparation, programReference: 'program:other' };
    expect(readHopV55ExplorationTrialPreparationV1(future)).toMatchObject({ status: 'unsupportedReadOnly', raw: future });
    expect(readHopV55ExplorationTrialPreparationV1(damaged)).toMatchObject({ status: 'invalid', raw: damaged });
    expect(() => appendHopV55ExplorationTrialPreparationRecord({ ...workspaceBase(), explorationTrialPreparations: [future] }, preparation))
      .toThrow(/réserve/u);
    const workspace = workspaceBase();
    const previous = { ...workspace, explorationTrialPreparations: [preparation] };
    expect(() => assertHopV55ExplorationTrialAppendOnly(previous, { ...previous, explorationTrialPreparations: [] })).toThrow(/append-only/u);
    expect(() => assertHopV55ExplorationTrialAppendOnly(previous, { ...previous,
      explorationTrialPreparations: [{ ...preparation, entry: { ...preparation.entry, commandId: 'other' } }] }))
      .toThrow(/append-only/u);
  });
});
