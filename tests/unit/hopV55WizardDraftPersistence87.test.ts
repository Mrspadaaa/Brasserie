import { describe, expect, it } from 'vitest';
import {
  assertBrewerHopAdviceWizardSourceV1,
  brewerHopAdviceWizardOriginV1,
  mapBrewerHopAdviceWizardSourceToScopeV1,
  readBrewerHopAdviceWizardSourceV1,
  type BrewerHopAdviceWizardOriginV1,
  type BrewerHopAdviceWizardSourceV1,
} from '../../functions/src/brewerHopAdviceWizardSourceV1';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { canonicalizeHopV55RecipeDraft } from '../../src/services/hopV55/recipeStepContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import {
  createHopV55DecisionReadingArchive,
  createHopV55DecisionReadingArchiveV4,
  createHopV55DecisionReadingArchiveV4ForWizardV1,
  HOP_V55_DECISION_READING_FORMAT_V4,
  readHopV55DecisionReadingArchive,
  readHopV55DecisionReadingArchiveForWizardV1,
  readHopV55DecisionReadingArchiveV4MetadataForWizardV1,
  readHopV55DecisionReadingArchiveV4MetadataV1,
  type HopV55DecisionReadingSource,
  type HopV55WizardDecisionReadingArchiveV4,
} from '../../src/services/hopV55/decisionArchive';
import type {
  HopV55Workspace,
  HopV55WizardSourceSnapshotV1,
} from '../../src/services/hopV55/contracts';
import {
  assertHopV55WizardWorkspaceCollectionsV1,
  createHopV55WizardSourceSnapshotV1,
  createHopV55WizardWorkspaceOriginV1,
  createHopV55WorkspaceRepository,
  HOP_V55_WIZARD_SOURCE_SNAPSHOT_V1_FORMAT,
  readHopV55WizardSourceSnapshotForArchiveV1,
  readHopV55WizardSourceSnapshotV1,
  readHopV55WizardWorkspaceOriginV1,
  HopV55WorkspaceRepositoryError,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import { hopV55FixtureRecipe } from '../fixtures/hopV55';

const OWNER = 'owner:wizard-persistence-87';
const WORKSPACE = 'workspace:wizard-persistence-87';
const DRAFT = 'draft:same-recipe-id';
const RECORDED_AT = '2026-10-05T08:00:00.000Z';
const NOW = '2026-10-05T08:01:00.000Z';

function canonicalDraft(name: string, origin: Pick<BrewerHopAdviceWizardOriginV1, 'ownerKey' | 'draftId'> = {
  ownerKey: OWNER, draftId: DRAFT,
}) {
  const draft = hopV55FixtureRecipe(origin.draftId);
  draft.name = name;
  draft.totalGristKg = Number.NaN;
  draft.ogTarget = 0;
  const canonical = canonicalizeHopV55RecipeDraft({ ownerKey: origin.ownerKey, draftId: origin.draftId, draft });
  return { draft, snapshot: { recipe: canonical.recipe, reference: canonical.reference } };
}

function reading() {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
  return readHopV55QuestionSemanticV1('Comment conserver cette lecture liée au brouillon courant ?', prepared);
}

function wizardArchive(source: BrewerHopAdviceWizardSourceV1, id: string): HopV55WizardDecisionReadingArchiveV4 {
  return createHopV55DecisionReadingArchiveV4ForWizardV1({ id, ownerKey: OWNER, workspaceId: WORKSPACE,
    recordedAt: RECORDED_AT, reading: reading(), source, runtimeReference: `runtime:${id}` });
}

function wizardMetadata(archive: HopV55WizardDecisionReadingArchiveV4) {
  const { format: sourceFormat, response, ...semantic } = structuredClone(archive.reading);
  void response;
  return {
    archiveIdentity: {
      archiveFormat: archive.format, id: archive.id, ownerKey: archive.ownerKey, workspaceId: archive.workspaceId,
      recordedAt: archive.recordedAt, source: structuredClone(archive.source),
      runtimeReference: archive.runtimeReference, contentReference: archive.contentReference,
    },
    semantic: { sourceFormat, ...semantic },
    ...(archive.scopeLedger ? { scopeLedger: structuredClone(archive.scopeLedger) } : {}),
    ...(archive.transition ? { transition: structuredClone(archive.transition) } : {}),
    ...(archive.lineage ? { lineage: structuredClone(archive.lineage) } : {}),
    ...(archive.programPreparation ? { programPreparation: structuredClone(archive.programPreparation) } : {}),
  };
}

function assertNamedDraft(value: unknown): asserts value is Record<string, unknown> & { name: string } {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || !('name' in value) || typeof value.name !== 'string') {
    throw new Error('Le snapshot doit exposer un Recipe avec un nom textuel.');
  }
}

function draftName(snapshot: HopV55WizardSourceSnapshotV1): string {
  assertNamedDraft(snapshot.draft);
  return snapshot.draft.name;
}

function wizardWorkspace(overrides: Partial<HopV55Workspace> = {}): HopV55Workspace {
  return {
    format: 'hop-v55-workspace-v1', id: WORKSPACE, ownerKey: OWNER, revision: 0,
    title: 'Brouillon actif', intent: { question: 'Préserver la source du brouillon.', criteria: [] },
    wizardOrigin: createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT }),
    wizardSourceSnapshots: [], decisionReadings: [], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: NOW,
    ...overrides,
  };
}

function resealSnapshot(snapshot: HopV55WizardSourceSnapshotV1, edits: {
  source?: unknown; draft?: unknown;
} = {}) {
  const body = {
    format: HOP_V55_WIZARD_SOURCE_SNAPSHOT_V1_FORMAT,
    source: structuredClone(edits.source ?? snapshot.source),
    draft: structuredClone(edits.draft ?? snapshot.draft),
  };
  return { ...body, reference: hopAdviceContentReference(HOP_V55_WIZARD_SOURCE_SNAPSHOT_V1_FORMAT, body) };
}

function expectRepositoryError(action: () => unknown, code: string): void {
  let caught: unknown;
  try { action(); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(HopV55WorkspaceRepositoryError);
  expect(caught).toMatchObject({ code });
}

type WorkspaceRow = HopV55WorkspaceEnvelopeV1;

class MemoryWorkspaceTable implements HopV55WorkspaceTable<WorkspaceRow> {
  rows = new Map<string, WorkspaceRow>();
  failAfterPutOnce = false;

  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as WorkspaceRow;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }

  async get(key: unknown) {
    const row = this.rows.get(this.key(key));
    return row && structuredClone(row);
  }

  async add(row: WorkspaceRow) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }

  async put(row: WorkspaceRow) {
    this.rows.set(this.key(row), structuredClone(row));
    if (this.failAfterPutOnce) {
      this.failAfterPutOnce = false;
      throw new Error('Injected write failure after put.');
    }
  }

  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();

  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const before = new Map([...this.workspaces.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = before; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }

  close() { /* Mémoire isolée du test. */ }
}

describe('persistance de la source du brouillon Wizard V1', () => {
  it('distingue le contenu A/B sous le même draftId sans déplacer l’origine ni le scope', () => {
    const origin = createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT });
    const a = canonicalDraft('Recette A');
    const b = canonicalDraft('Brouillon Wizard B');
    const storedA = createHopV55WizardSourceSnapshotV1({ origin, snapshot: a.snapshot });
    const storedB = createHopV55WizardSourceSnapshotV1({ origin, snapshot: b.snapshot });
    const sourceA = storedA.source;
    const sourceB = storedB.source;

    expect(a.draft.totalGristKg).toBeNaN();
    expect(a.snapshot.recipe.totalGristKg).toBeNull();
    expect(a.snapshot.recipe.ogTarget).toBe(0);
    expect(a.draft.ogTarget).toBe(0);
    expect(sourceA.draftId).toBe(sourceB.draftId);
    expect(sourceA.contentReference).not.toBe(sourceB.contentReference);
    expect(readBrewerHopAdviceWizardSourceV1(sourceA)).toEqual({ status: 'readOnly', source: sourceA });
    expect(brewerHopAdviceWizardOriginV1(sourceA)).toEqual({ ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT });
    expect(mapBrewerHopAdviceWizardSourceToScopeV1(sourceA)).toEqual(mapBrewerHopAdviceWizardSourceToScopeV1(sourceB));
    for (const changedOrigin of [
      { ownerKey: 'owner:other', workspaceId: WORKSPACE, draftId: DRAFT },
      { ownerKey: OWNER, workspaceId: 'workspace:other', draftId: DRAFT },
      { ownerKey: OWNER, workspaceId: WORKSPACE, draftId: 'draft:other' },
    ]) {
      const otherSource = createHopV55WizardSourceSnapshotV1({
        origin: createHopV55WizardWorkspaceOriginV1(changedOrigin),
        snapshot: canonicalDraft('Même projet sous une autre origine', changedOrigin).snapshot,
      }).source;
      expect(mapBrewerHopAdviceWizardSourceToScopeV1(sourceA)).not.toEqual(mapBrewerHopAdviceWizardSourceToScopeV1(otherSource));
    }

    const futureSource = { ...sourceA, format: 'hop-v55-wizard-source-v2', extension: { retained: true } };
    expect(readBrewerHopAdviceWizardSourceV1(futureSource)).toMatchObject({ status: 'unsupportedReadOnly' });
    expect(() => assertBrewerHopAdviceWizardSourceV1(futureSource)).toThrow();
  });

  it('garde les archives Recipe classiques fermées et résout A et B sur leurs snapshots exacts', async () => {
    const origin = createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT });
    const snapshotA = createHopV55WizardSourceSnapshotV1({ origin, snapshot: canonicalDraft('Recette A').snapshot });
    const snapshotB = createHopV55WizardSourceSnapshotV1({ origin, snapshot: canonicalDraft('Brouillon Wizard B').snapshot });
    const archiveA = wizardArchive(snapshotA.source, 'reading:wizard-source-a');
    const archiveB = wizardArchive(snapshotB.source, 'reading:wizard-source-b');
    const recipeA = createHopV55DecisionReadingArchiveV4({ id: 'reading:classic-recipe-a', ownerKey: OWNER, workspaceId: WORKSPACE,
      recordedAt: RECORDED_AT, reading: reading(), source: { kind: 'recipe', id: DRAFT }, runtimeReference: 'runtime:classic-recipe-a' });
    const classicV1 = createHopV55DecisionReadingArchive({ id: 'reading:classic-v1', ownerKey: OWNER, workspaceId: WORKSPACE,
      recordedAt: RECORDED_AT, reading: { intent: { question: 'Lecture classique.', criteria: [] }, interpretation: '',
        branches: [], unresolved: [] }, source: { kind: 'exploration' }, runtimeReference: 'runtime:classic-v1' });

    expect(recipeA.source).toEqual({ kind: 'recipe', id: DRAFT });
    if (recipeA.source.kind !== 'recipe') throw new Error('La source classique doit rester une recette.');
    expect(archiveB.source.draftId).toBe(recipeA.source.id);
    expect(archiveB.source.contentReference).not.toBe(recipeA.contentReference);
    expect(readHopV55DecisionReadingArchive(recipeA)).toMatchObject({ status: 'available' });
    expect(readHopV55DecisionReadingArchive(classicV1)).toMatchObject({ status: 'available' });
    expect(readHopV55DecisionReadingArchive(archiveA)).toMatchObject({ status: 'invalidRecord' });
    expect(readHopV55DecisionReadingArchiveForWizardV1(recipeA)).toMatchObject({ status: 'invalidRecord' });
    expect(readHopV55DecisionReadingArchiveForWizardV1(archiveA)).toMatchObject({ status: 'available', archive: { source: snapshotA.source } });
    const metadata = wizardMetadata(archiveA);
    expect(metadata.semantic).not.toHaveProperty('format');
    expect(metadata.semantic).not.toHaveProperty('response');
    expect(metadata.semantic.sourceFormat).toBe('hop-v55-question-semantic-reading-v1');
    expect(readHopV55DecisionReadingArchiveV4MetadataForWizardV1(metadata)).toMatchObject({ status: 'readOnly' });
    expect(readHopV55DecisionReadingArchiveV4MetadataV1(metadata)).toMatchObject({ status: 'invalid' });
    const futureSemanticMetadata = { ...metadata, semantic: { ...metadata.semantic,
      sourceFormat: 'hop-v55-question-semantic-reading-v2' } };
    expect(readHopV55DecisionReadingArchiveV4MetadataForWizardV1(futureSemanticMetadata))
      .toMatchObject({ status: 'unsupportedReadOnly' });
    expect(readHopV55DecisionReadingArchiveV4MetadataForWizardV1({ ...futureSemanticMetadata,
      archiveIdentity: { ...metadata.archiveIdentity, ownerKey: 'owner:foreign' } })).toMatchObject({ status: 'invalid' });
    expect(readHopV55DecisionReadingArchiveV4MetadataForWizardV1({ ...futureSemanticMetadata,
      archiveIdentity: { ...metadata.archiveIdentity, source: { ...archiveA.source, ownerKey: 'owner:foreign' } },
    })).toMatchObject({ status: 'invalid' });
    expect(() => createHopV55DecisionReadingArchiveV4({ id: 'reading:classic-builder-refuses-wizard', ownerKey: OWNER,
      workspaceId: WORKSPACE, recordedAt: RECORDED_AT, reading: reading(),
      source: archiveA.source as unknown as HopV55DecisionReadingSource, runtimeReference: 'runtime:classic-refuses-wizard' })).toThrow();

    const db = new MemoryWorkspaceDatabase();
    const repo = createHopV55WorkspaceRepository({ ownerKey: OWNER, database: db });
    try {
      const initial = await repo.save(wizardWorkspace(), null);
      const afterA = await repo.save({ ...initial, wizardSourceSnapshots: [snapshotA], decisionReadings: [archiveA] }, initial.revision);
      const appendB = { ...afterA, wizardSourceSnapshots: [snapshotA, snapshotB], decisionReadings: [archiveA, archiveB] };
      db.workspaces.failAfterPutOnce = true;
      await expect(repo.save(appendB, afterA.revision)).rejects.toThrow('Injected write failure after put.');
      const afterRolledBackPut = await repo.read(OWNER, WORKSPACE);
      expect(afterRolledBackPut).toEqual(afterA);
      if (!afterRolledBackPut) throw new Error('Le workspace A doit rester après rollback du put interrompu.');
      expect(draftName(readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterRolledBackPut, archive: archiveA })))
        .toBe('Recette A');
      expect(() => readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterRolledBackPut, archive: archiveB }))
        .toThrow(HopV55WorkspaceRepositoryError);
      const afterB = await repo.save(appendB, afterA.revision);

      expect(afterB.revision).toBe(3);
      expect(draftName(readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterB, archive: archiveA }))).toBe('Recette A');
      expect(draftName(readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterB, archive: archiveB }))).toBe('Brouillon Wizard B');
      expect(() => readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterB,
        archive: recipeA as unknown as HopV55WizardDecisionReadingArchiveV4 })).toThrow(HopV55WorkspaceRepositoryError);
      expect(() => readHopV55WizardSourceSnapshotForArchiveV1({ workspace: { ...afterB, decisionReadings: [archiveB] },
        archive: archiveA })).toThrow(HopV55WorkspaceRepositoryError);

      const view = assertHopV55WizardWorkspaceCollectionsV1(afterB);
      const exposed = view.get(snapshotA.source.contentReference)!;
      const exposedDraft = exposed.draft;
      assertNamedDraft(exposedDraft);
      exposedDraft.name = 'Valeur de vue empoisonnée';
      expect(afterB.wizardSourceSnapshots?.[0]).toMatchObject({ draft: { name: 'Recette A' } });
      const returned = readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterB, archive: archiveA });
      const returnedDraft = returned.draft;
      assertNamedDraft(returnedDraft);
      returnedDraft.name = 'Valeur de retour empoisonnée';
      expect(draftName(readHopV55WizardSourceSnapshotForArchiveV1({ workspace: afterB, archive: archiveA }))).toBe('Recette A');

      const beforeRejectedWrites = await repo.read(OWNER, WORKSPACE);
      expect(beforeRejectedWrites).not.toBeNull();
      await expect(repo.save({ ...afterB, wizardSourceSnapshots: [snapshotB, snapshotA] }, afterB.revision))
        .rejects.toMatchObject({ code: 'invalidInput' });
      await expect(repo.save({ ...afterB, revision: afterB.revision - 1, title: 'CAS périmé' }, afterB.revision - 1))
        .rejects.toMatchObject({ code: 'staleRevision' });
      expect(await repo.read(OWNER, WORKSPACE)).toEqual(beforeRejectedWrites);
    } finally { repo.close(); }
  });

  it('refuse les snapshots connus altérés même si leur sceau de stockage est recalculé', () => {
    const origin = createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT });
    const snapshot = createHopV55WizardSourceSnapshotV1({ origin, snapshot: canonicalDraft('Recette intacte').snapshot });
    const originalDraft = snapshot.draft;
    assertNamedDraft(originalDraft);
    const alteredDraft = { ...originalDraft, name: 'Recette remplacée' };
    const resealedKnownSnapshot = resealSnapshot(snapshot, { draft: alteredDraft });
    expect(readHopV55WizardSourceSnapshotV1(resealedKnownSnapshot)).toMatchObject({ status: 'invalidRecord' });
    expect(() => assertHopV55WizardWorkspaceCollectionsV1(wizardWorkspace({ wizardSourceSnapshots: [resealedKnownSnapshot] })))
      .toThrow(HopV55WorkspaceRepositoryError);

    for (const foreignTuple of [
      { ownerKey: 'owner:foreign', workspaceId: WORKSPACE, draftId: DRAFT },
      { ownerKey: OWNER, workspaceId: 'workspace:foreign', draftId: DRAFT },
      { ownerKey: OWNER, workspaceId: WORKSPACE, draftId: 'draft:foreign' },
    ]) {
      const foreignOrigin = createHopV55WizardWorkspaceOriginV1(foreignTuple);
      const foreignSnapshot = createHopV55WizardSourceSnapshotV1({ origin: foreignOrigin,
        snapshot: canonicalDraft('Recette étrangère', foreignTuple).snapshot });
      expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1(
        wizardWorkspace({ wizardSourceSnapshots: [foreignSnapshot] })), 'invalidInput');
    }
    const foreignArchiveOrigin = createHopV55WizardWorkspaceOriginV1({ ownerKey: 'owner:foreign', workspaceId: WORKSPACE, draftId: DRAFT });
    const foreignArchiveSnapshot = createHopV55WizardSourceSnapshotV1({ origin: foreignArchiveOrigin,
      snapshot: canonicalDraft('Archive étrangère', foreignArchiveOrigin).snapshot });
    const foreignArchiveBody = { format: HOP_V55_DECISION_READING_FORMAT_V4, id: 'reading:foreign-source', ownerKey: OWNER,
      workspaceId: WORKSPACE, recordedAt: RECORDED_AT, reading: reading(), source: foreignArchiveSnapshot.source,
      runtimeReference: 'runtime:foreign-source' };
    const resealedForeignArchive = { ...foreignArchiveBody,
      contentReference: hopAdviceContentReference(HOP_V55_DECISION_READING_FORMAT_V4, foreignArchiveBody) };
    expect(readHopV55DecisionReadingArchiveForWizardV1(resealedForeignArchive)).toMatchObject({ status: 'invalidRecord' });
    expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1(wizardWorkspace({
      wizardOrigin: { ...origin, draftId: 'draft:foreign' }, wizardSourceSnapshots: [snapshot],
    })), 'invalidInput');
    expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1(wizardWorkspace({ sourceRecipeId: DRAFT })), 'invalidInput');
    expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1(wizardWorkspace({ sourceBatchId: 'batch:alias' })), 'invalidInput');
    expect(readHopV55WizardWorkspaceOriginV1({ ...origin, draftId: 'draft\\foreign' })).toMatchObject({ status: 'invalidRecord' });
    expect(readHopV55WizardWorkspaceOriginV1({ ...origin, draftId: 'draft:control\u0001' })).toMatchObject({ status: 'invalidRecord' });
    expect(readHopV55WizardWorkspaceOriginV1({ ...origin, draftId: 'd'.repeat(161) })).toMatchObject({ status: 'invalidRecord' });

    const duplicate = wizardWorkspace({ wizardSourceSnapshots: [snapshot, structuredClone(snapshot)] });
    expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1(duplicate), 'invalidInput');
  });

  it('préserve un enfant futur en lecture seule mais refuse les identités connues étrangères', () => {
    const origin = createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: WORKSPACE, draftId: DRAFT });
    const snapshot = createHopV55WizardSourceSnapshotV1({ origin, snapshot: canonicalDraft('Lecture source').snapshot });
    const futureSource = { ...snapshot.source, format: 'hop-v55-wizard-source-v2', extension: { opaque: ['v2'] } };
    const futureRow = resealSnapshot(snapshot, { source: futureSource });
    expect(readHopV55WizardSourceSnapshotV1(futureRow)).toMatchObject({ status: 'unsupportedFormat', format: 'hop-v55-wizard-source-v2' });

    const foreignFutureSource = { ...futureSource, ownerKey: 'owner:foreign' };
    const foreignFutureRow = resealSnapshot(snapshot, { source: foreignFutureSource });
    expect(readHopV55WizardSourceSnapshotV1(foreignFutureRow)).toMatchObject({ status: 'unsupportedFormat' });
    expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1(wizardWorkspace({ wizardSourceSnapshots: [foreignFutureRow] })), 'invalidInput');

    const futureOrigin = { ...origin, format: 'hop-v55-workspace-wizard-origin-v2', opaque: true };
    expect(readHopV55WizardWorkspaceOriginV1(futureOrigin)).toMatchObject({ status: 'unsupportedFormat' });
    expectRepositoryError(() => assertHopV55WizardWorkspaceCollectionsV1({ ...wizardWorkspace(), wizardOrigin: {
      ...futureOrigin, ownerKey: 'owner:foreign',
    } }), 'invalidInput');
  });

  it('ne permet pas de supprimer ni de réécrire l’origine initiale par un CAS valide', async () => {
    const database = new MemoryWorkspaceDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: OWNER, database });
    try {
      const initial = await repository.save(wizardWorkspace(), null);
      const withoutOrigin = { ...initial, wizardOrigin: undefined };
      await expect(repository.save(withoutOrigin, initial.revision)).rejects.toMatchObject({ code: 'invalidInput' });

      const rewrittenOrigin = { ...initial, wizardOrigin: { ...initial.wizardOrigin!, draftId: 'draft:rewritten' } };
      await expect(repository.save(rewrittenOrigin, initial.revision)).rejects.toMatchObject({ code: 'invalidInput' });
      expect(await repository.read(OWNER, WORKSPACE)).toEqual(initial);
    } finally { repository.close(); }
  });
});
