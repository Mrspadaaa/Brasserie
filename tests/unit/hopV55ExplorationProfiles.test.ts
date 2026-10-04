import { describe, expect, it } from 'vitest';
import {
  appendHopV55ExplorationProfileRecord,
  assertHopV55ExplorationProfileAppendOnly,
  createHopV55ExplorationProfile,
  hopV55ExplorationProfileDraftErrors,
  hopV55ExplorationProfileHistory,
  readHopV55ExplorationProfile,
  type HopV55ExplorationProfileDraft,
} from '../../src/services/hopV55/explorationProfiles';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';

const family = { key: 'axis:1@v1:floral', axisId: 'axis:1', version: '1', name: 'Floral', terms: ['floral', 'fleurs'] };
const draft: HopV55ExplorationProfileDraft = {
  label: 'Profil de brassage libre',
  status: 'hypothesis',
  description: 'Hypothèse de travail, sans analyse du lot.',
  criteria: [{ direction: 'keep', label: 'Préserver le floral', family }],
};

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as HopV55WorkspaceEnvelopeV1;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter((row) => index === 'ownerKey' && row.ownerKey === key).map((row) => structuredClone(row)) }) };
  }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(work);
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory-only adapter; no IndexedDB data is cleared. */ }
}

function workspaceBase(): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id: 'workspace:exploration-profiles', ownerKey: 'fixture:exploration-profiles',
    revision: 0, title: 'Profils de fixture', intent: { question: '', criteria: [] }, scenarioIds: [], referenceHypotheses: [],
    copies: [], updatedAt: '2026-10-04T10:00:00.000Z' };
}

function profile(previous?: ReturnType<typeof createHopV55ExplorationProfile>) {
  return createHopV55ExplorationProfile(draft, {
    recordedAt: previous ? '2026-10-04T10:01:00.000Z' : '2026-10-04T10:00:00.000Z',
    profileId: previous?.profileId ?? 'profile:fixture-exploration',
    ...(previous ? { previous } : {}),
    newId: () => 'criterion:floral',
  });
}

describe('hop-v55 exploration profile persistence', () => {
  it('scelle la cible ou hypothèse libre et relit le V1 exact sans le convertir en guide', () => {
    const first = profile();
    const read = readHopV55ExplorationProfile(first);
    expect(read).toMatchObject({ status: 'current', profile: first });
    expect(first).toMatchObject({ format: 'hop-v55-exploration-profile-v1', version: 1,
      previousReference: null, status: 'hypothesis', scope: 'explorationOnly', styleGuideRef: null,
      actor: { kind: 'brewer', label: 'Brasseur' }, description: draft.description });
    if (read.status !== 'current') throw new Error('Profil V1 attendu.');
    expect(read.profile.reference).toMatch(/^hop-v55-exploration-profile-v1:sha256:/u);
  });

  it('append une révision avec référence parente exacte sans réécrire le premier profil', () => {
    const first = profile();
    const second = profile(first);
    const rows = appendHopV55ExplorationProfileRecord([first], second);
    expect(rows).toEqual([first, second]);
    expect(second).toMatchObject({ profileId: first.profileId, version: 2, previousReference: first.reference });
    const history = hopV55ExplorationProfileHistory(rows);
    expect(history.history).toEqual([first, second]);
    expect(history.latest).toEqual([second]);
    expect(appendHopV55ExplorationProfileRecord(rows, second)).toEqual(rows);
    expect(() => appendHopV55ExplorationProfileRecord(rows, { ...second, label: 'autre contenu' }))
      .toThrow(/référence de profil existe déjà/u);
  });

  it('garde les formats futurs et profils altérés opaques, sans les réinterpréter ni les écraser', () => {
    const future = { format: 'hop-v55-exploration-profile-v2', profileId: 'profile:future', opaque: { x: 1 } };
    const damaged = { ...profile(), label: 'altéré' };
    expect(readHopV55ExplorationProfile(future)).toMatchObject({ status: 'unsupported', raw: future });
    expect(readHopV55ExplorationProfile(damaged)).toMatchObject({ status: 'invalid', raw: damaged });
    const next = createHopV55ExplorationProfile(draft, { recordedAt: '2026-10-04T10:02:00.000Z',
      profileId: 'profile:independent', newId: () => 'criterion:floral' });
    const appended = appendHopV55ExplorationProfileRecord([future, damaged], next);
    expect(appended).toEqual([future, damaged, next]);
    expect(hopV55ExplorationProfileHistory(appended).unreadable).toHaveLength(2);
    const first = profile();
    const futureHead = { ...future, profileId: first.profileId, version: 2 };
    expect(hopV55ExplorationProfileHistory([first, futureHead]).latest).toEqual([]);
    const futureCollision = createHopV55ExplorationProfile(draft, { recordedAt: '2026-10-04T10:03:00.000Z',
      profileId: 'profile:future', newId: () => 'criterion:floral' });
    expect(() => appendHopV55ExplorationProfileRecord([future], futureCollision))
      .toThrow(/réserve déjà cet identifiant/u);
  });

  it('refuse suppression, réécriture, sauts de version, parent inexact et cible de profil ambiguë', () => {
    const first = profile();
    const second = profile(first);
    const third = profile(second);
    expect(() => assertHopV55ExplorationProfileAppendOnly([first], [])).toThrow(/append-only/u);
    expect(() => assertHopV55ExplorationProfileAppendOnly([first], [{ ...first, description: 'modifiée' }]))
      .toThrow(/append-only/u);
    expect(() => appendHopV55ExplorationProfileRecord([first], third))
      .toThrow(/version manquante/u);
    const alternateParent = createHopV55ExplorationProfile({ ...draft, label: 'Autre lignée' }, {
      recordedAt: '2026-10-04T10:02:00.000Z', profileId: first.profileId, newId: () => 'criterion:floral' });
    const wrongParent = createHopV55ExplorationProfile(draft, { recordedAt: '2026-10-04T10:03:00.000Z',
      profileId: first.profileId, previous: alternateParent, newId: () => 'criterion:floral' });
    expect(() => appendHopV55ExplorationProfileRecord([first], wrongParent))
      .toThrow(/citer exactement le profil précédent/u);

    const ambiguous: HopV55ExplorationProfileDraft = { ...draft, criteria: [{ direction: 'keep', label: 'Floral', family,
      freeTerm: 'frais' }] };
    expect(hopV55ExplorationProfileDraftErrors(ambiguous)).toContain('Critère 1 : relie-le soit à une famille documentée, soit à un terme exact.');
    expect(() => createHopV55ExplorationProfile(ambiguous, { recordedAt: '2026-10-04T10:00:00.000Z',
      profileId: 'profile:ambiguous', newId: () => 'criterion:1' })).toThrow(/famille documentée/u);
    const firstBody = { ...first, actor: { kind: 'brewer' as const, label: 'Autre' } };
    const { reference: _reference, ...actorBody } = firstBody;
    const badActor = { ...actorBody, reference: hopAdviceContentReference('hop-v55-exploration-profile-v1', actorBody) };
    expect(readHopV55ExplorationProfile(badActor)).toMatchObject({ status: 'invalid', raw: badActor });
  });

  it('conserve V1/futurs au dépôt et refuse suppression, remplacement ou révision sur parent illisible', async () => {
    const base = workspaceBase();
    const future = { format: 'hop-v55-exploration-profile-v2', profileId: 'profile:reserved', opaque: true };
    const database = new MemoryWorkspaceDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: base.ownerKey, database });
    await repository.save({ ...base, explorationProfiles: [future] }, null);
    const loaded = await repository.read(base.ownerKey, base.id);
    expect(loaded?.explorationProfiles).toEqual([future]);

    const first = profile();
    const withProfile = await repository.save({ ...loaded!, explorationProfiles: [future, first] }, loaded!.revision);
    await expect(repository.save({ ...withProfile, explorationProfiles: [future] }, withProfile.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.save({ ...withProfile,
      explorationProfiles: [future, { ...first, description: 'remplacé' }] }, withProfile.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const reserved = createHopV55ExplorationProfile(draft, { recordedAt: '2026-10-04T10:02:00.000Z',
      profileId: 'profile:reserved', newId: () => 'criterion:floral' });
    await expect(repository.save({ ...withProfile, explorationProfiles: [future, first, reserved] }, withProfile.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    expect((await repository.read(base.ownerKey, base.id))?.explorationProfiles).toEqual([future, first]);
  });
});
