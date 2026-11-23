import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { BATCH_FIELDS, RECIPE_FIELDS, pick } from '../../functions/src/brewerContext';
import {
  brewerHopAdviceCurrentCultureReference,
  compareBrewerHopAdviceContextBindings,
  mapBrewerHopAdviceLaunchSourceToScopeV1,
  projectBrewerHopAdviceContext,
  projectBrewerHopAdviceToolDependencies,
  type BrewerHopAdviceContextScopeV1,
} from '../../functions/src/brewerHopAdviceContextBinding';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { makeHopV55FutureRecipeDraftFixture } from '../fixtures/hopV55FutureRecipeDraft';
import {
  createHopV55DecisionReadingArchiveV2,
  type HopV55DecisionReadingSource,
} from '../../src/services/hopV55/decisionArchive';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { compareHopV55AssistedAdviceContextAtReception, prepareHopV55AssistedAdviceContextLaunch } from '../../src/services/hopV55/assistedAdviceContext';
import type { HopV55Copy, HopV55Workspace } from '../../src/services/hopV55/contracts';

const ownerKey = 'owner:assisted-context-fixture';
const workspaceId = 'workspace:assisted-context-fixture';
const question = 'Quel contexte exact le conseil a-t-il reçu ?';
const now = '2026-10-04T08:00:00.000Z';

function archiveFor(context: BrewerContext, source: HopV55DecisionReadingSource) {
  const prepared = prepareBrewingScenarioContext(context);
  return createHopV55DecisionReadingArchiveV2({
    id: 'reading:assisted-context-fixture', ownerKey, workspaceId, recordedAt: now,
    reading: readHopV55Question(question, prepared), source,
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
}

function workspaceFor(archive: ReturnType<typeof archiveFor>, changes: Partial<HopV55Workspace> = {}): HopV55Workspace {
  const source = archive.source;
  return {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1, title: 'Fixture locale',
    intent: { question, criteria: [] },
    ...(source.kind === 'recipe' ? { sourceRecipeId: source.id } : {}),
    ...(source.kind === 'batch' ? { sourceBatchId: source.id } : {}),
    decisionReadings: [structuredClone(archive)], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: now,
    ...changes,
  } as HopV55Workspace;
}

function pageInputFor(context: BrewerContext, source: HopV55DecisionReadingSource,
  changes: Partial<HopV55Workspace> = {}, scope?: BrewerHopAdviceContextScopeV1) {
  const archive = archiveFor(context, source);
  const workspace = workspaceFor(archive, changes);
  return { archive, workspace, ownerKey, workspaceId,
    scopeAtPageLaunch: scope ?? mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, workspaceId, source), context };
}

function launchFor(context: BrewerContext, source: HopV55DecisionReadingSource,
  changes: Partial<HopV55Workspace> = {}, scope?: BrewerHopAdviceContextScopeV1) {
  return prepareHopV55AssistedAdviceContextLaunch(pageInputFor(context, source, changes, scope));
}

function recipeSource(context: BrewerContext): Extract<HopV55DecisionReadingSource, { kind: 'recipe' }> {
  if (!context.recipe?.id) throw new Error('Fixture sans identité de recette.');
  return { kind: 'recipe', id: context.recipe.id };
}

describe('Liaison du contexte V5.5 assisté', () => {
  it('accepte la lecture, le workspace, le scope Page et le runtime canoniques; loadedAt et ordre JSON sont sans effet', () => {
    const context = makeHopV55FixtureContext('planning');
    const source = recipeSource(context);
    expect(launchFor(context, source).status).toBe('ready');

    const reordered = structuredClone(context);
    reordered.now += 120_000;
    reordered.recipe = Object.fromEntries(Object.entries(reordered.recipe!).reverse()) as any;
    expect(launchFor(reordered, source).status).toBe('ready');
  });

  it('normalise Page complet et source serveur pickée sur la même projection physique', () => {
    const pageContext = makeHopV55FixtureContext('planning');
    (pageContext.recipe as any).transportCacheOnly = { loadedAt: 99, ignored: true };
    const serverContext = structuredClone(pageContext);
    serverContext.recipe = normalizeRecipe(pick(pageContext.recipe, RECIPE_FIELDS));
    const source = recipeSource(pageContext);
    const scope = { kind: 'recipe' as const, id: source.id };
    const page = projectBrewerHopAdviceContext({ scope, context: pageContext, runtime: prepareBrewingScenarioContext(pageContext).runtime });
    const server = projectBrewerHopAdviceContext({ scope, context: serverContext, runtime: prepareBrewingScenarioContext(serverContext).runtime });
    expect(page.status).toBe('ready');
    expect(server.status).toBe('ready');
    if (page.status === 'ready' && server.status === 'ready') {
      expect(page.projection.physicalAnchorReference).toBe(server.projection.physicalAnchorReference);
      expect(compareBrewerHopAdviceContextBindings(page.projection, server.projection).status).toBe('matched');
    }

    const batchContext = makeHopV55FixtureContext('fermenting');
    const serverBatch = structuredClone(batchContext);
    serverBatch.batch = pick(batchContext.batch, BATCH_FIELDS);
    if (serverBatch.batch?.recipeSnapshot) {
      serverBatch.batch.recipeSnapshot = normalizeRecipe(pick(serverBatch.batch.recipeSnapshot, RECIPE_FIELDS));
    }
    serverBatch.recipe = normalizeRecipe(pick(batchContext.recipe, RECIPE_FIELDS));
    const batchScope = { kind: 'batch' as const, id: batchContext.batch!.id };
    const pageBatch = projectBrewerHopAdviceContext({ scope: batchScope, context: batchContext,
      runtime: prepareBrewingScenarioContext(batchContext).runtime });
    const serverBatchProjection = projectBrewerHopAdviceContext({ scope: batchScope, context: serverBatch,
      runtime: prepareBrewingScenarioContext(serverBatch).runtime });
    expect(pageBatch.status).toBe('ready');
    expect(serverBatchProjection.status).toBe('ready');
    if (pageBatch.status === 'ready' && serverBatchProjection.status === 'ready') {
      expect(compareBrewerHopAdviceContextBindings(pageBatch.projection, serverBatchProjection.projection).status).toBe('matched');
    }
  });

  it.each([
    ['recette', (context: BrewerContext) => { context.recipe!.name = 'Recette B, mêmes IDs'; }],
    ['programme', (context: BrewerContext) => { context.recipe!.hops![0].timeMin = 17; }],
  ])('refuse un changement de %s depuis l’archive', (_label, mutate) => {
    const before = makeHopV55FixtureContext('planning');
    const source = recipeSource(before);
    const archive = archiveFor(before, source);
    const workspace = workspaceFor(archive);
    const after = structuredClone(before);
    mutate(after);
    const oldArchive = structuredClone(archive);
    const result = prepareHopV55AssistedAdviceContextLaunch({ archive, workspace, ownerKey, workspaceId,
      scopeAtPageLaunch: { kind: 'recipe', id: source.id }, context: after });
    expect(result.status).toBe('stale');
    expect(archive).toEqual(oldArchive);
  });

  it('refuse une modification du journal de brassin sans lui attribuer une révision par défaut', () => {
    const before = makeHopV55FixtureContext('fermenting');
    const source: HopV55DecisionReadingSource = { kind: 'batch', id: before.batch!.id };
    const archive = archiveFor(before, source);
    const workspace = workspaceFor(archive);
    const after = structuredClone(before);
    after.journal!.additions['hop-0'].amount = 41;
    const result = prepareHopV55AssistedAdviceContextLaunch({ archive, workspace, ownerKey, workspaceId,
      scopeAtPageLaunch: { kind: 'batch', id: before.batch!.id }, context: after });
    expect(result.status).toBe('stale');

    const absent = projectBrewerHopAdviceContext({ scope: { kind: 'recipe', id: recipeSource(makeHopV55FixtureContext('planning')).id },
      context: makeHopV55FixtureContext('planning'), runtime: prepareBrewingScenarioContext(makeHopV55FixtureContext('planning')).runtime });
    const revisionZeroContext = makeHopV55FixtureContext('planning');
    revisionZeroContext.journal = { revision: 0 };
    const presentZero = projectBrewerHopAdviceContext({ scope: { kind: 'recipe', id: recipeSource(revisionZeroContext).id },
      context: revisionZeroContext, runtime: prepareBrewingScenarioContext(revisionZeroContext).runtime });
    expect(absent.status).toBe('ready');
    expect(presentZero.status).toBe('ready');
    if (absent.status === 'ready' && presentZero.status === 'ready') {
      expect(absent.projection.journal.revision).toEqual({ state: 'absent' });
      expect(presentZero.projection.journal.revision).toEqual({ state: 'present', value: 0 });
      expect(compareBrewerHopAdviceContextBindings(absent.projection, presentZero.projection).status).toBe('stale');
    }
  });

  it('garde le diagnostic de journal local égal sans le transformer en différence physique', () => {
    const loaded = makeHopV55FixtureContext('fermenting');
    const scope = { kind: 'batch' as const, id: loaded.batch!.id };
    const fromServer = projectBrewerHopAdviceContext({ scope, context: loaded,
      runtime: prepareBrewingScenarioContext(loaded).runtime });
    const withEqualLocalOverlay = structuredClone(loaded);
    withEqualLocalOverlay.localJournal = structuredClone(withEqualLocalOverlay.journal);
    const fromPage = projectBrewerHopAdviceContext({ scope, context: withEqualLocalOverlay,
      runtime: prepareBrewingScenarioContext(withEqualLocalOverlay).runtime });

    expect(fromServer.status).toBe('ready');
    expect(fromPage.status).toBe('ready');
    if (fromServer.status === 'ready' && fromPage.status === 'ready') {
      expect(fromServer.projection.journal.localOverlay).toBe('notPresent');
      expect(fromPage.projection.journal.localOverlay).toBe('matchesLoaded');
      expect(fromServer.projection.physicalAnchorReference).toBe(fromPage.projection.physicalAnchorReference);
      expect(compareBrewerHopAdviceContextBindings(fromServer.projection, fromPage.projection)).toMatchObject({
        status: 'matched', catalogueDependenciesChanged: false, calculationDependenciesChanged: false,
      });

      const changedJournal = structuredClone(loaded);
      changedJournal.journal!.additions['hop-0'].amount = 41;
      const changedProjection = projectBrewerHopAdviceContext({ scope, context: changedJournal,
        runtime: prepareBrewingScenarioContext(changedJournal).runtime });
      expect(changedProjection.status).toBe('ready');
      if (changedProjection.status === 'ready') {
        expect(compareBrewerHopAdviceContextBindings(fromServer.projection, changedProjection.projection).status).toBe('stale');
      }
    }

    const divergentLocal = structuredClone(loaded);
    divergentLocal.localJournal = structuredClone(divergentLocal.journal);
    divergentLocal.localJournal!.additions!['hop-0'].amount = 41;
    expect(projectBrewerHopAdviceContext({ scope, context: divergentLocal,
      runtime: prepareBrewingScenarioContext(divergentLocal).runtime })).toMatchObject({
      status: 'conflict', code: 'journalSourceDiverged',
    });
  });

  it('préserve le lien exact NR même si les valeurs culturelles sont identiques', () => {
    const context = makeHopV55FixtureContext('planning');
    const scope = { kind: 'recipe' as const, id: context.recipe!.id! };
    const runtime = prepareBrewingScenarioContext(context).runtime;
    const reference = { id: 'reference:NR-A', version: '1', contentReference: 'nr-content:A' };
    const cultureReference = brewerHopAdviceCurrentCultureReference(runtime)!;
    const left = projectBrewerHopAdviceContext({ scope, context, runtime, cultureUse: {
      status: 'consumed', reference, bindingReference: 'binding:A',
      cultureReference,
    } });
    const right = projectBrewerHopAdviceContext({ scope, context, runtime, cultureUse: {
      status: 'consumed', reference: { ...reference, id: 'reference:NR-B', contentReference: 'nr-content:B' },
      bindingReference: 'binding:B', cultureReference,
    } });
    expect(left.status).toBe('ready');
    expect(right.status).toBe('ready');
    if (left.status === 'ready' && right.status === 'ready') {
      expect(compareBrewerHopAdviceContextBindings(left.projection, right.projection)).toMatchObject({ status: 'stale', conflicts: expect.arrayContaining(['cultureChanged']) });
    }
  });

  it('rend stale deux recettes d’identités différentes même si les autres valeurs sont identiques', () => {
    const contextA = makeHopV55FixtureContext('planning');
    const contextB = structuredClone(contextA);
    contextB.recipe!.id = 'recipe:other-identity';
    const sourceA = recipeSource(contextA);
    const sourceB = recipeSource(contextB);
    const projectionA = projectBrewerHopAdviceContext({ scope: { kind: 'recipe', id: sourceA.id }, context: contextA,
      runtime: prepareBrewingScenarioContext(contextA).runtime });
    const projectionB = projectBrewerHopAdviceContext({ scope: { kind: 'recipe', id: sourceB.id }, context: contextB,
      runtime: prepareBrewingScenarioContext(contextB).runtime });
    expect(projectionA.status).toBe('ready');
    expect(projectionB.status).toBe('ready');
    if (projectionA.status === 'ready' && projectionB.status === 'ready') {
      expect(compareBrewerHopAdviceContextBindings(projectionA.projection, projectionB.projection)).toMatchObject({
        status: 'stale', conflicts: expect.arrayContaining(['sourceChanged']),
      });
    }
  });

  it('refuse une culture adoptée déclarée côté client si le contexte serveur ne l’a ni reçue ni consommée', () => {
    const context = makeHopV55FixtureContext('planning');
    const scope = { kind: 'recipe' as const, id: context.recipe!.id! };
    const runtime = prepareBrewingScenarioContext(context).runtime;
    const reference = { id: 'reference:adopted-culture', version: '7', contentReference: 'nr-content:exact' };
    const expected = projectBrewerHopAdviceContext({ scope, context, runtime, cultureUse: {
      status: 'declaredNotConsumed', reference, bindingReference: 'binding:exact-NR',
    } });
    const actual = projectBrewerHopAdviceContext({ scope, context, runtime, cultureUse: { status: 'notReceived' } });
    expect(expected.status).toBe('ready');
    expect(actual.status).toBe('ready');
    if (expected.status !== 'ready' || actual.status !== 'ready') return;
    expect(compareBrewerHopAdviceContextBindings(expected.projection, actual.projection)).toMatchObject({
      status: 'stale', conflicts: expect.arrayContaining(['cultureChanged']),
    });
  });

  it('distingue le catalogue chargé des faits physiques et conserve les dépendances d’outil séparément', () => {
    const before = makeHopV55FixtureContext('planning');
    const after = structuredClone(before);
    const extra = structuredClone(after.hopIndex!.varieties[0]);
    extra.id = 'hop-v55-unused-catalogue-entry';
    extra.name = 'Entrée de catalogue sans effet dans la recette';
    after.hopIndex!.varieties.push(extra);
    const scope = { kind: 'recipe' as const, id: before.recipe!.id! };
    const a = projectBrewerHopAdviceContext({ scope, context: before, runtime: prepareBrewingScenarioContext(before).runtime });
    const b = projectBrewerHopAdviceContext({ scope, context: after, runtime: prepareBrewingScenarioContext(after).runtime });
    expect(a.status).toBe('ready');
    expect(b.status).toBe('ready');
    if (a.status === 'ready' && b.status === 'ready') {
      expect(a.projection.physicalAnchorReference).toBe(b.projection.physicalAnchorReference);
      expect(compareBrewerHopAdviceContextBindings(a.projection, b.projection)).toMatchObject({
        status: 'matched', catalogueDependenciesChanged: true,
      });
    }
  });

  it('empreinte la preuve d’outil complète, ses identités, et uniquement son ordre canonique JSON', () => {
    const evidence = {
      id: 'E-cold', name: 'cold_contact_bitterness_reference',
      label: 'Contact froid · référence publiée '.repeat(7),
      facts: ['Observation publiée de fixture.', 'Ne décrit pas la bière cible.'],
      limits: ['La réponse reste attachée au protocole de référence.'],
      sources: [{ title: 'Source de fixture', url: 'https://example.test/reference' }],
      products: [{ name: 'Produit de fixture', supplier: 'Brasserie test', url: 'https://example.test/product',
        availability: 'unknown' as const, availabilityText: 'Non vérifié', checkedAt: 1790928000000 }],
      model: 'preuve complète, modèle synthétique',
      data: { format: 'tool-result-fixture-v1', payload: { value: 21, unit: 'BU' } },
    };
    const dependency = (row: { id: string; name: string }) => projectBrewerHopAdviceToolDependencies([row])[0];
    const reference = dependency(evidence).contentReference;
    expect(reference).toBe(hopAdviceContentReference('brewer-hop-advice-tool-evidence-v2', evidence));
    expect(reference).toMatch(/^brewer-hop-advice-tool-evidence-v2:sha256:[0-9a-f]{64}$/);

    const withoutLimits = (({ limits: _limits, ...rest }) => rest)(evidence);
    const mutations: Array<{ label: string; row: { id: string; name: string } }> = [
      { label: 'faits', row: { ...evidence, facts: ['Fait changé.'] } },
      { label: 'limites omises', row: withoutLimits },
      { label: 'URL source', row: { ...evidence, sources: [{ ...evidence.sources[0], url: 'https://example.test/changed' }] } },
      { label: 'label long non tronqué', row: { ...evidence, label: `${evidence.label}x` } },
      { label: 'produits', row: { ...evidence, products: [{ ...evidence.products[0], availabilityText: 'Autre état' }] } },
      { label: 'modèle', row: { ...evidence, model: 'autre modèle' } },
      { label: 'payload', row: { ...evidence, data: { ...evidence.data, payload: { value: 22, unit: 'BU' } } } },
      { label: 'identifiant de preuve', row: { ...evidence, id: 'E-other' } },
      { label: 'identité d’outil', row: { ...evidence, name: 'other_tool' } },
    ];
    for (const mutation of mutations) {
      expect(dependency(mutation.row).contentReference, mutation.label).not.toBe(reference);
    }

    const reorderedKeys = {
      model: evidence.model, products: evidence.products, sources: evidence.sources, limits: evidence.limits,
      facts: evidence.facts, data: evidence.data, label: evidence.label, name: evidence.name, id: evidence.id,
    };
    expect(dependency(reorderedKeys).contentReference).toBe(reference);

    const uncited = { ...evidence, id: 'E-not-cited', name: 'uncited_tool', facts: ['Preuve non citée.'] };
    const originalRows = projectBrewerHopAdviceToolDependencies([evidence, uncited]);
    const changedUncitedRows = projectBrewerHopAdviceToolDependencies([evidence, { ...uncited, facts: ['Preuve non citée modifiée.'] }]);
    expect(originalRows).toHaveLength(2);
    expect(changedUncitedRows[1].contentReference).not.toBe(originalRows[1].contentReference);
  });

  it('sépare la résolution de culture lazy des faits physiques, sans masquer une souche nommée ni une mutation explicite', () => {
    const byName = makeHopV55FixtureContext('planning');
    byName.recipe!.yeast = { name: 'Culture fictive neutre' };
    const withoutIndex = structuredClone(byName);
    delete withoutIndex.hopIndex;
    const scope = { kind: 'recipe' as const, id: byName.recipe!.id! };
    const resolved = prepareBrewingScenarioContext(byName).runtime;
    const unresolved = prepareBrewingScenarioContext(withoutIndex).runtime;
    expect(resolved.current?.culture).toMatchObject({ state: 'single', members: [{ yeastId: 'hop-v55-fixture-culture-neutral' }] });
    expect(unresolved.current?.culture).toMatchObject({ state: 'unknown', members: [] });
    const localProjection = projectBrewerHopAdviceContext({ scope, context: byName, runtime: resolved });
    const serverProjection = projectBrewerHopAdviceContext({ scope, context: withoutIndex, runtime: unresolved });
    expect(localProjection.status).toBe('ready');
    expect(serverProjection.status).toBe('ready');
    if (localProjection.status === 'ready' && serverProjection.status === 'ready') {
      expect(localProjection.projection.physicalAnchorReference).toBe(serverProjection.projection.physicalAnchorReference);
      expect(compareBrewerHopAdviceContextBindings(localProjection.projection, serverProjection.projection)).toMatchObject({
        status: 'matched', calculationDependenciesChanged: true,
      });
    }

    const explicit = structuredClone(byName);
    explicit.recipe!.yeast = { name: 'Culture fictive neutre', hopIndexId: 'hop-v55-fixture-culture-neutral' };
    const explicitWithoutIndex = structuredClone(explicit);
    delete explicitWithoutIndex.hopIndex;
    const explicitA = projectBrewerHopAdviceContext({ scope, context: explicit, runtime: prepareBrewingScenarioContext(explicit).runtime });
    const explicitB = projectBrewerHopAdviceContext({ scope, context: explicitWithoutIndex,
      runtime: prepareBrewingScenarioContext(explicitWithoutIndex).runtime });
    expect(explicitA.status).toBe('ready');
    expect(explicitB.status).toBe('ready');
    if (explicitA.status === 'ready' && explicitB.status === 'ready') {
      expect(explicitA.projection.physicalAnchorReference).toBe(explicitB.projection.physicalAnchorReference);
      expect(compareBrewerHopAdviceContextBindings(explicitA.projection, explicitB.projection).status).toBe('matched');
    }

    const changedRecipe = structuredClone(explicit);
    changedRecipe.recipe!.yeast!.name = 'Autre culture explicitement inscrite';
    const changed = projectBrewerHopAdviceContext({ scope, context: changedRecipe,
      runtime: prepareBrewingScenarioContext(changedRecipe).runtime });
    expect(changed.status).toBe('ready');
    if (explicitA.status === 'ready' && changed.status === 'ready') {
      expect(compareBrewerHopAdviceContextBindings(explicitA.projection, changed.projection).status).toBe('stale');
    }
  });

  it('conserve stocks et calculs comme dépendances, hors stale physique', () => {
    const context = makeHopV55FixtureContext('planning');
    const scope = { kind: 'recipe' as const, id: context.recipe!.id! };
    const runtimeA = prepareBrewingScenarioContext(context).runtime;
    const runtimeB = structuredClone(runtimeA);
    runtimeB.current!.stockAvailabilityReference = 'stock-availability:new-read';
    runtimeB.dataRevision = 'stock-data:new-read';
    const a = projectBrewerHopAdviceContext({ scope, context, runtime: runtimeA });
    const b = projectBrewerHopAdviceContext({ scope, context, runtime: runtimeB });
    expect(a.status).toBe('ready');
    expect(b.status).toBe('ready');
    if (a.status === 'ready' && b.status === 'ready') {
      expect(a.projection.physicalAnchorReference).toBe(b.projection.physicalAnchorReference);
      expect(compareBrewerHopAdviceContextBindings(a.projection, b.projection)).toMatchObject({
        status: 'matched', stockAvailabilityChanged: true, runtimeDataRevisionChanged: true,
      });
    }
  });

  it.each([
    ['malts', (context: BrewerContext) => { (context.recipe as any).malts = [{ name: 'Malt déclaré', amountKg: 1 }]; }],
    ['cibles', (context: BrewerContext) => { context.recipe!.ogTarget = 1.052; }],
    ['fermentation', (context: BrewerContext) => { (context.recipe as any).fermentation[0].days += 1; }],
  ])('rend stale une mutation de %s même si le programme houblon reste identique', (_label, mutate) => {
    const contextA = makeHopV55FixtureContext('planning');
    const contextB = structuredClone(contextA);
    mutate(contextB);
    const scope = { kind: 'recipe' as const, id: contextA.recipe!.id! };
    const runtimeA = prepareBrewingScenarioContext(contextA).runtime;
    const runtimeB = prepareBrewingScenarioContext(contextB).runtime;
    expect(runtimeA.current?.program?.additions).toEqual(runtimeB.current?.program?.additions);
    const a = projectBrewerHopAdviceContext({ scope, context: contextA, runtime: runtimeA });
    const b = projectBrewerHopAdviceContext({ scope, context: contextB, runtime: runtimeB });
    expect(a.status).toBe('ready');
    expect(b.status).toBe('ready');
    if (a.status === 'ready' && b.status === 'ready') {
      expect(a.projection.source.snapshotReference).not.toBe(b.projection.source.snapshotReference);
      expect(compareBrewerHopAdviceContextBindings(a.projection, b.projection)).toMatchObject({ status: 'stale', conflicts: expect.arrayContaining(['sourceChanged']) });
    }
  });

  it('conserve une copie locale sous son scope brouillon déclaré, sans la renommer en recette canonique', () => {
    const context = makeHopV55FixtureContext('planning');
    const recipe = structuredClone(context.recipe!);
    const copy: HopV55Copy = { id: 'copy:local-one', recipe, sourceRecipeId: 'recipe:source-one', previewReference: 'preview:1',
      scenarioId: 'scenario:1', snapshotReference: 'snapshot:1', branchId: 'branch:1', branchReference: 'branch:1-ref',
      createdAt: now, scope: 'local' };
    context.recipe = structuredClone(recipe);
    const source: HopV55DecisionReadingSource = { kind: 'localRecipeCopy', workspaceId, copyId: copy.id,
      recipeId: recipe.id!, recipeReference: hopDecisionReference(recipe) };
    const scope = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, workspaceId, source);
    expect(scope.kind).toBe('draft');
    expect(scope.id).toMatch(/^hop-v55-[a-f0-9]{64}$/);
    const result = launchFor(context, source, { activeCopyId: copy.id, copies: [copy] }, scope);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.launch.expected.source).toMatchObject({ kind: 'draft', id: scope.id });
      expect(result.launch.source).toMatchObject({ kind: 'localRecipeCopy', copyId: copy.id, recipeId: source.recipeId });
    }
  });

  it('encode copie/brouillon aux IDs ":" sous un scope transport strict, lié à la révision source', () => {
    const copySource: HopV55DecisionReadingSource = { kind: 'localRecipeCopy', workspaceId: 'workspace:copy-A',
      copyId: 'copy:alpha:17', recipeId: 'recipe:source:4', recipeReference: 'content:copy-A' };
    const copyScope = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, copySource.workspaceId, copySource);
    expect(copyScope).toMatchObject({ kind: 'draft' });
    expect(copyScope.id).toMatch(/^hop-v55-[a-f0-9]{64}$/);
    expect(() => mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, copySource.workspaceId,
      { ...copySource, workspaceId: 'workspace:other' })).toThrow(/workspace/);

    const draftSource: HopV55DecisionReadingSource = { kind: 'localFutureDraft', workspaceId: 'workspace:future-A',
      draftId: 'draft:future:19', revision: 1, contentReference: 'draft-content:1' };
    const first = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, draftSource.workspaceId, draftSource);
    const next = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, draftSource.workspaceId,
      { ...draftSource, revision: 2, contentReference: 'draft-content:2' });
    expect(first.kind).toBe('draft');
    expect(next.kind).toBe('draft');
    expect(next.id).not.toBe(first.id);
  });

  it('refuse un futur brouillon lorsque le transport courant n’a pas chargé son propre contenu', () => {
    const { draft } = makeHopV55FutureRecipeDraftFixture();
    const context = makeHopV55FixtureContext('unknown');
    const source: HopV55DecisionReadingSource = { kind: 'localFutureDraft', workspaceId, draftId: draft.draftId,
      revision: draft.revision, contentReference: draft.contentReference };
    const result = launchFor(context, source, { activeFutureDraftSource: source, futureDrafts: [draft] });
    expect(result).toMatchObject({ status: 'stale' });
  });

  it('refuse les archives absente, nulle ou futures sans les réécrire', () => {
    const context = makeHopV55FixtureContext('planning');
    const source = recipeSource(context);
    const archive = archiveFor(context, source);
    const workspace = workspaceFor(archive);
    const base = { workspace, ownerKey, workspaceId, scopeAtPageLaunch: { kind: 'recipe' as const, id: source.id }, context };
    expect(prepareHopV55AssistedAdviceContextLaunch({ ...base, archive: null }).status).toBe('invalid');
    expect(prepareHopV55AssistedAdviceContextLaunch({ ...base, archive: undefined }).status).toBe('invalid');
    const future = { ...archive, format: 'hop-v55-decision-reading-v999' };
    const result = prepareHopV55AssistedAdviceContextLaunch({ ...base, archive: future });
    expect(result.status).toBe('unsupportedFormat');
    expect(future.format).toBe('hop-v55-decision-reading-v999');
  });

  it('ne substitue pas silencieusement le scope réel chargé au scope Page demandé', () => {
    const context = makeHopV55FixtureContext('planning');
    const result = projectBrewerHopAdviceContext({ scope: { kind: 'recipe', id: 'recipe:other' }, context,
      runtime: prepareBrewingScenarioContext(context).runtime });
    expect(result).toMatchObject({ status: 'conflict', code: 'scopeMismatch' });

    const legacyBatch = makeHopV55FixtureContext('fermenting');
    delete legacyBatch.batch!.recipeSnapshot;
    const legacy = projectBrewerHopAdviceContext({ scope: { kind: 'batch', id: legacyBatch.batch!.id }, context: legacyBatch,
      runtime: prepareBrewingScenarioContext(legacyBatch).runtime });
    expect(legacy).toMatchObject({ status: 'conflict', code: 'scopeMismatch' });
  });

  it.each(['reception', 'confirmation'] as const)('%s : garde l’historique sous A mais interdit son applicabilité après passage à B', stage => {
    const contextA = makeHopV55FixtureContext('planning');
    const sourceA = recipeSource(contextA);
    const launchA = launchFor(contextA, sourceA);
    expect(launchA.status).toBe('ready');
    if (launchA.status !== 'ready') return;
    const serverA = projectBrewerHopAdviceContext({ scope: { kind: 'recipe', id: sourceA.id }, context: contextA,
      runtime: prepareBrewingScenarioContext(contextA).runtime, cultureUse: { status: 'notReceived' } });
    expect(serverA.status).toBe('ready');
    if (serverA.status !== 'ready') return;

    const contextB = structuredClone(contextA);
    contextB.recipe!.name = 'Source B, mêmes propriétés et même valeur physique';
    const sourceB = recipeSource(contextB);
    const currentB = pageInputFor(contextB, sourceB);
    const launchB = prepareHopV55AssistedAdviceContextLaunch(currentB);
    expect(launchB.status).toBe('ready');
    if (launchB.status !== 'ready') return;
    const before = structuredClone(launchA.launch);
    const received = compareHopV55AssistedAdviceContextAtReception({
      launch: launchA.launch,
      serverRequestReadingReference: launchA.launch.sourceReadingReference,
      serverProjection: serverA.projection,
      current: currentB,
      stage,
    });
    expect(received.history.status).toBe('matched');
    expect(received.applicability).toMatchObject({ status: 'stale' });
    expect(received.historicalSourceReadingReference).toBe(launchA.launch.sourceReadingReference);
    expect(launchA.launch).toEqual(before);
  });

  it('réception positive : trois projections identiques restent liées malgré loadedAt/ordre de sérialisation', () => {
    const context = makeHopV55FixtureContext('planning');
    const source = recipeSource(context);
    const launch = launchFor(context, source);
    expect(launch.status).toBe('ready');
    if (launch.status !== 'ready') return;
    const server = projectBrewerHopAdviceContext({ scope: launch.launch.scope, context,
      runtime: prepareBrewingScenarioContext(context).runtime, cultureUse: { status: 'notReceived' } });
    expect(server.status).toBe('ready');
    if (server.status !== 'ready') return;
    const currentContext = structuredClone(context);
    currentContext.now += 60_000;
    currentContext.recipe = Object.fromEntries(Object.entries(currentContext.recipe!).reverse()) as any;
    const current = pageInputFor(currentContext, source);
    const received = compareHopV55AssistedAdviceContextAtReception({ launch: launch.launch,
      serverRequestReadingReference: launch.launch.sourceReadingReference, serverProjection: server.projection,
      current, stage: 'reception' });
    expect(received).toMatchObject({ history: { status: 'matched' }, applicability: { status: 'current' } });
  });

  it('compare les dépendances réellement calculées au contexte actuel, pas seulement au lancement historique', () => {
    const pageContextB = makeHopV55FixtureContext('planning');
    const source = recipeSource(pageContextB);
    const launchInput = pageInputFor(pageContextB, source);
    const launch = prepareHopV55AssistedAdviceContextLaunch(launchInput);
    expect(launch.status).toBe('ready');
    if (launch.status !== 'ready') return;

    const serverContextC = structuredClone(pageContextB);
    const extra = structuredClone(serverContextC.hopIndex!.varieties[0]);
    extra.id = 'hop-v55-context-dependency-C';
    extra.name = 'Catalogue C, entrée non utilisée par cette recette';
    serverContextC.hopIndex!.varieties.push(extra);
    const serverC = projectBrewerHopAdviceContext({ scope: launch.launch.scope, context: serverContextC,
      runtime: prepareBrewingScenarioContext(serverContextC).runtime, cultureUse: { status: 'notReceived' } });
    expect(serverC.status).toBe('ready');
    if (serverC.status !== 'ready') return;

    const serverCPageB = compareHopV55AssistedAdviceContextAtReception({ launch: launch.launch,
      serverRequestReadingReference: launch.launch.sourceReadingReference, serverProjection: serverC.projection,
      current: launchInput, stage: 'reception' });
    expect(serverCPageB.history).toMatchObject({ status: 'matched', catalogueDependenciesChanged: true });
    expect(serverCPageB.applicability).toMatchObject({ status: 'current', recalculationRequired: true,
      catalogueDependenciesChanged: true });

    const serverCPageCInput = { ...launchInput, context: serverContextC };
    const serverCPageC = compareHopV55AssistedAdviceContextAtReception({ launch: launch.launch,
      serverRequestReadingReference: launch.launch.sourceReadingReference, serverProjection: serverC.projection,
      current: serverCPageCInput, stage: 'confirmation' });
    expect(serverCPageC.applicability).toMatchObject({ status: 'current', recalculationRequired: false,
      catalogueDependenciesChanged: false });
  });
});

