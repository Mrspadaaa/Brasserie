import { describe, expect, it } from 'vitest';
import type { Recipe } from '../../src/types';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { canonicalizeHopV55RecipeDraft } from '../../src/services/hopV55/recipeStepContext';
import {
  BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1,
  assertBrewerHopAdviceWizardSourceMatchesSnapshotV1,
  assertBrewerHopAdviceWizardSourceV1,
  brewerHopAdviceWizardOriginV1,
  createBrewerHopAdviceWizardSourceV1,
  mapBrewerHopAdviceWizardSourceToScopeV1,
  readBrewerHopAdviceWizardSourceV1,
  type BrewerHopAdviceWizardCanonicalSnapshotV1,
  type BrewerHopAdviceWizardOriginV1,
  type BrewerHopAdviceWizardSourceV1,
} from '../../functions/src/brewerHopAdviceWizardSourceV1.js';

const originA: BrewerHopAdviceWizardOriginV1 = {
  ownerKey: 'owner:wizard-source-fixture',
  workspaceId: 'workspace:wizard-source-fixture',
  draftId: 'draft:wizard-source-fixture',
};

function recipeDraft(draftId = originA.draftId, overrides: Record<string, unknown> = {}): Recipe {
  // Deliberately incomplete: the canonicalizer binds the current Wizard object;
  // this boundary must not turn it into a saved/validated Recipe.
  return {
    id: draftId,
    name: '',
    style: '',
    volumeL: 0,
    nullableInput: null,
    unresolvedInput: Number.NaN,
    ...overrides,
  } as unknown as Recipe;
}

function canonicalSnapshot(origin: BrewerHopAdviceWizardOriginV1, recipe: Recipe): BrewerHopAdviceWizardCanonicalSnapshotV1 {
  return canonicalizeHopV55RecipeDraft({ ownerKey: origin.ownerKey, draftId: origin.draftId, draft: recipe });
}

function sourceFor(origin: BrewerHopAdviceWizardOriginV1, recipe: Recipe) {
  const snapshot = canonicalSnapshot(origin, recipe);
  return { snapshot, source: createBrewerHopAdviceWizardSourceV1({ origin, snapshot }) };
}

describe('BrewerHopAdviceWizardSourceV1', () => {
  it('crée le source exact à partir du snapshot canonique, sans normaliser le brouillon', () => {
    const draft = recipeDraft();
    const before = structuredClone(draft);
    const snapshot = canonicalSnapshot(originA, draft);
    const source = createBrewerHopAdviceWizardSourceV1({ origin: originA, snapshot });

    expect(Object.keys(source).sort()).toEqual([
      'contentReference', 'draftId', 'format', 'kind', 'ownerKey', 'workspaceId',
    ]);
    expect(source).toEqual({
      format: BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1,
      kind: 'wizardDraft',
      ...originA,
      contentReference: snapshot.reference,
    });
    expect(snapshot.reference).toBe(hopAdviceContentReference(
      'hop-v55-recipe-step-draft-context-v1',
      { ownerKey: originA.ownerKey, draftId: originA.draftId, recipe: snapshot.recipe },
    ));
    expect(snapshot.recipe).toMatchObject({
      id: originA.draftId, name: '', style: '', volumeL: 0, nullableInput: null, unresolvedInput: null,
    });
    expect(Number.isNaN((draft as unknown as Record<string, unknown>).unresolvedInput)).toBe(true);
    expect(draft).toEqual(before);
    expect(brewerHopAdviceWizardOriginV1(source)).toEqual(originA);
    expect(() => assertBrewerHopAdviceWizardSourceV1(source)).not.toThrow();
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(source, snapshot)).not.toThrow();
    expect(readBrewerHopAdviceWizardSourceV1(source)).toMatchObject({ status: 'readOnly', source });
  });

  it('ferme les six clés V1 et invalide un source reconnu mal formé ou un lien rompu', () => {
    const { source, snapshot } = sourceFor(originA, recipeDraft());
    const malformed: unknown[] = [
      { ...source, extra: 'ignored-by-no-reader' },
      Object.fromEntries(Object.entries(source).filter(([key]) => key !== 'workspaceId')),
      { ...source, format: 'hop-v55-wizard-source-v0' },
      { ...source, format: 'hop-v55-wizard-source-v02' },
      { ...source, format: 'hop-v55-wizard-source-v1e2' },
      { ...source, format: 'hop-v55-local-future-draft-v1' },
      { ...source, format: 'future-unrelated-format-v2' },
      { ...source, kind: 'recipe' },
      { ...source, ownerKey: 'owner/unsafe' },
      { ...source, workspaceId: ' workspace-with-padding' },
      { ...source, draftId: '' },
      { ...source, contentReference: 'not-a-canonical-reference' },
    ];
    for (const raw of malformed) {
      expect(readBrewerHopAdviceWizardSourceV1(raw).status).toBe('invalid');
      expect(() => assertBrewerHopAdviceWizardSourceV1(raw)).toThrow();
    }

    const changedRecipe = { ...(snapshot.recipe as Record<string, unknown>), name: 'Contenu B' };
    const mismatchedSnapshot = { ...snapshot, recipe: changedRecipe };
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(source, mismatchedSnapshot)).toThrow();
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(
      { ...source, draftId: 'draft:other' }, snapshot,
    )).toThrow();
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(
      source, { ...snapshot, extra: 'closed snapshot' } as BrewerHopAdviceWizardCanonicalSnapshotV1,
    )).toThrow();
  });

  it('conserve un futur intact brut, mais invalide ses champs de liaison connus corrompus', () => {
    const { source } = sourceFor(originA, recipeDraft());
    const future = {
      ...source,
      format: 'hop-v55-wizard-source-v2',
      futurePayload: { revision: 2, opaque: ['kept', null, 0] },
    };
    const before = structuredClone(future);
    const result = readBrewerHopAdviceWizardSourceV1(future);
    expect(result.status).toBe('unsupportedReadOnly');
    if (result.status === 'unsupportedReadOnly') expect(result.snapshot).toBe(future);
    expect(future).toEqual(before);

    for (const broken of [
      { ...future, ownerKey: 'owner/broken' },
      { ...future, workspaceId: '' },
      { ...future, draftId: 12 },
      { ...future, kind: null },
      { ...future, kind: 'recipe' },
      { ...future, contentReference: null },
      { ...future, contentReference: 'other-namespace:sha256:' + 'a'.repeat(64) },
    ]) {
      expect(readBrewerHopAdviceWizardSourceV1(broken).status).toBe('invalid');
    }

    // Without a snapshot, a well-formed digest cannot prove which payload it binds.
    // The future reader preserves it; content equality belongs to the matched-snapshot assertion.
    const wellFormedButUnbound = {
      ...future,
      contentReference: 'hop-v55-recipe-step-draft-context-v1:sha256:' + '0'.repeat(64),
    };
    expect(readBrewerHopAdviceWizardSourceV1(wellFormedButUnbound).status).toBe('unsupportedReadOnly');

    for (const format of ['hop-v55-wizard-source-v9007199254740992', `hop-v55-wizard-source-v${'9'.repeat(120)}`]) {
      const largeFuture = { ...future, format };
      const largeResult = readBrewerHopAdviceWizardSourceV1(largeFuture);
      expect(largeResult.status).toBe('unsupportedReadOnly');
      if (largeResult.status === 'unsupportedReadOnly') expect(largeResult.snapshot).toBe(largeFuture);
      expect(() => assertBrewerHopAdviceWizardSourceV1(largeFuture)).toThrow();
      expect(() => mapBrewerHopAdviceWizardSourceToScopeV1(largeFuture as unknown as BrewerHopAdviceWizardSourceV1)).toThrow();
      expect(() => createBrewerHopAdviceWizardSourceV1({
        origin: originA,
        snapshot: largeFuture as unknown as BrewerHopAdviceWizardCanonicalSnapshotV1,
      })).toThrow();
    }
  });

  it('garde le scope d’origine stable quand le même brouillon passe du contenu A au contenu B', () => {
    const recipeA = recipeDraft(originA.draftId, { name: 'Version A', volumeL: 10 });
    const recipeB = recipeDraft(originA.draftId, { name: 'Version B', volumeL: 20 });
    const a = sourceFor(originA, recipeA);
    const b = sourceFor(originA, recipeB);
    const scopeA = mapBrewerHopAdviceWizardSourceToScopeV1(a.source);
    const scopeB = mapBrewerHopAdviceWizardSourceToScopeV1(b.source);

    expect(a.snapshot.reference).not.toBe(b.snapshot.reference);
    expect(a.source.contentReference).not.toBe(b.source.contentReference);
    expect(scopeA).toEqual(scopeB);
    expect(scopeA.id).toBe(`hop-v55-wizard-${hopAdviceContentReference('hop-v55-wizard-origin-v1', originA).split(':').pop()}`);
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(a.source, a.snapshot)).not.toThrow();
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(a.source, b.snapshot)).toThrow();
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(b.source, b.snapshot)).not.toThrow();
  });

  it('sépare les origines owner/workspace/draft tout en laissant le contenu Recipe complet', () => {
    const draft = recipeDraft();
    const baseline = sourceFor(originA, draft);
    const anotherWorkspace = { ...originA, workspaceId: 'workspace:other' };
    const workspaceCopy = sourceFor(anotherWorkspace, draft);
    const anotherOwner = { ...originA, ownerKey: 'owner:other' };
    const ownerCopy = sourceFor(anotherOwner, draft);
    const anotherDraft = { ...originA, draftId: 'draft:other' };
    const draftCopy = sourceFor(anotherDraft, recipeDraft(anotherDraft.draftId));

    expect(workspaceCopy.snapshot.reference).toBe(baseline.snapshot.reference);
    expect(workspaceCopy.source.contentReference).toBe(baseline.source.contentReference);
    expect(mapBrewerHopAdviceWizardSourceToScopeV1(workspaceCopy.source).id)
      .not.toBe(mapBrewerHopAdviceWizardSourceToScopeV1(baseline.source).id);
    expect(ownerCopy.snapshot.reference).not.toBe(baseline.snapshot.reference);
    expect(draftCopy.snapshot.reference).not.toBe(baseline.snapshot.reference);
    const scopeIds = [baseline, workspaceCopy, ownerCopy, draftCopy]
      .map(item => mapBrewerHopAdviceWizardSourceToScopeV1(item.source).id);
    expect(new Set(scopeIds).size).toBe(scopeIds.length);
    expect(baseline.snapshot.recipe).toEqual(canonicalSnapshot(originA, draft).recipe);
  });

  it('accepte les champs incomplets valides sans assertRecipe, sans compléter null, zéro ni chaînes vides', () => {
    const incomplete = recipeDraft(originA.draftId, {
      name: '', style: '', volumeL: 0, ogTarget: null, unfinishedField: null,
    });
    const { snapshot, source } = sourceFor(originA, incomplete);

    expect(snapshot.recipe).toMatchObject({
      id: originA.draftId, name: '', style: '', volumeL: 0, ogTarget: null, unfinishedField: null,
    });
    expect(Object.prototype.hasOwnProperty.call(snapshot.recipe, 'hops')).toBe(false);
    expect(() => assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(source, snapshot)).not.toThrow();
  });
});
