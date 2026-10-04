import { describe, expect, it } from 'vitest';
import { applyHopV55ReferenceEvent, adoptHopV55ReferenceHypothesis, ensureHopV55ReferenceJournal,
  getHopV55ReferenceDefinitions, getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import { readHopV55AdoptedContextBinding, resolveHopV55AdoptedContext } from '../../src/services/hopV55/adoptedContextResolution';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { brewingReferenceVersionContentReference, type BrewingReferenceVersionV1 } from '../../src/domain/brewingReference';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55Workspace } from '../fixtures/hopV55';

const recordedAt = '2026-10-03T08:10:00.000Z';

async function preparedFixture(): Promise<{ context: BrewerContext; prepared: PreparedBrewingScenarioContext }> {
  const context = makeHopV55FixtureContext('planning');
  const references = await loadBrewingCatalogueReferences();
  context.hopIndex = {
    varieties: [...(context.hopIndex?.varieties ?? []), ...references.varieties],
    lots: context.hopIndex?.lots ?? [],
    knowledge: references.knowledge,
    predictions: context.hopIndex?.predictions ?? [],
    tastings: context.hopIndex?.tastings ?? [],
    truncated: context.hopIndex?.truncated ?? [],
  };
  return { context, prepared: prepareBrewingScenarioContext(context) };
}

function workspace(ownerKey = 'owner-culture-resolution', id = 'workspace-culture-resolution'): HopV55Workspace {
  const value = hopV55Workspace(ownerKey, id);
  value.referenceHypotheses = [];
  return value;
}

function hypothesis(id: string, version: number, culture?: BrewingScenarioCultureContext): HopV55Workspace['referenceHypotheses'][number] {
  const baseline: Extract<HopV55Workspace['referenceHypotheses'][number]['baseline'], { kind: 'hypothetical' }> = {
    kind: 'hypothetical', label: `Baseline R${version}`, input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
  };
  if (culture !== undefined) baseline.culture = structuredClone(culture);
  return { id, version, label: `Référence ${version}`, recordedAt,
    baseline };
}

function identityAt(workspaceValue: HopV55Workspace, index = 0) {
  const identity = getHopV55ReferenceProjection(workspaceValue)?.references[index];
  if (!identity) throw new Error('La référence adoptée de la fixture est absente.');
  return { id: identity.id, version: identity.version, contentReference: identity.contentReference };
}

function adoptWithDistinctOriginalAndAdoptingActors(workspaceValue: HopV55Workspace, context: BrewerContext,
  prepared: PreparedBrewingScenarioContext, id: string, baseline: HopV55Workspace['referenceHypotheses'][number]['baseline']) {
  const opened = ensureHopV55ReferenceJournal(workspaceValue, context, prepared);
  const contextId = opened.referenceJournal!.record.contextId;
  const body: Omit<BrewingReferenceVersionV1, 'contentReference'> = {
    id, version: 'version / α',
    origin: { kind: 'userHypothesis', description: 'Hypothèse originale conservée telle quelle.' },
    hypotheses: ['Déclaration d’origine conservée.'],
    context: { sourceLabel: 'Contexte de version explicite' },
    author: { id: 'original-author', label: 'Autrice de l’hypothèse' },
    createdAt: recordedAt,
    predecessor: null,
    sensoryDefinitions: getHopV55ReferenceDefinitions(prepared),
    content: { label: 'Hypothèse dont les acteurs sont distincts', baseline: structuredClone(baseline) as any },
  };
  const reference: BrewingReferenceVersionV1 = { ...body, contentReference: brewingReferenceVersionContentReference(body) };
  const proposed = applyHopV55ReferenceEvent(opened, { ownerKey: opened.ownerKey, contextId,
    commandId: 'propose-culture-with-distinct-author', expectedRevision: opened.referenceJournal!.record.revision,
    recordedAt, kind: 'referenceProposed', payload: { reference } });
  return applyHopV55ReferenceEvent(proposed, { ownerKey: proposed.ownerKey, contextId,
    commandId: 'adopt-culture-with-distinct-actor', expectedRevision: proposed.referenceJournal!.record.revision,
    recordedAt: '2026-10-03T08:11:00.000Z', kind: 'referenceAdopted',
    payload: { reference: { id: reference.id, version: reference.version, contentReference: reference.contentReference },
      adoptedBy: { id: 'adopting-operator', label: 'Responsable adoptant' } } });
}

describe('résolution de culture depuis une adoption NR exacte', () => {
  it('distingue adoption absente, unknown explicitement adopté et champ culture non fourni', async () => {
    const { context, prepared } = await preparedFixture();
    const empty = workspace();
    expect(resolveHopV55AdoptedContext({ workspace: empty, expected: null })).toEqual({ status: 'absent' });

    const unknownCulture: BrewingScenarioCultureContext = { state: 'unknown', members: [], explanation: 'Aucune identité déclarée.' };
    const adoptedUnknown = adoptHopV55ReferenceHypothesis(empty, hypothesis('nr-culture-unknown', 1, unknownCulture), context, prepared,
      { referenceVersion: 'NR/α — édition 01' });
    const unknownResult = resolveHopV55AdoptedContext({ workspace: adoptedUnknown, expected: identityAt(adoptedUnknown) });
    expect(unknownResult.status).toBe('resolved');
    if (unknownResult.status !== 'resolved') throw new Error('La culture unknown explicitement adoptée doit être résolue.');
    expect(unknownResult.binding.reference.version).toBe('NR/α — édition 01');
    expect(unknownResult.binding.culture).toEqual({ status: 'declared', value: unknownCulture });
    expect(resolveHopV55AdoptedContext({ workspace: adoptedUnknown, expected: null })).toMatchObject({
      status: 'stale', code: 'expectedAbsenceOutdated', current: identityAt(adoptedUnknown),
    });

    const noCulture = adoptHopV55ReferenceHypothesis(empty, hypothesis('nr-culture-not-provided', 1), context, prepared,
      { referenceVersion: 'édition / sans culture' });
    const noCultureResult = resolveHopV55AdoptedContext({ workspace: noCulture, expected: identityAt(noCulture) });
    expect(noCultureResult.status).toBe('resolved');
    if (noCultureResult.status !== 'resolved') throw new Error('La baseline sans champ culture doit rester résoluble.');
    expect(noCultureResult.binding.culture).toEqual({ status: 'notProvided' });
    expect(noCultureResult.binding.baseline).not.toHaveProperty('culture');
  });

  it('fige exactement une culture mixte à proportions absentes ou en plage, sans moyenne, et conserve auteurs/adoption/réactivation distincts', async () => {
    const { context, prepared } = await preparedFixture();
    const initial = workspace();
    const mixed: BrewingScenarioCultureContext = { state: 'mixed', members: [
      { yeastId: 'strain-without-proportion', name: 'Souche sans fraction déclarée' },
      { yeastId: 'strain-with-range', name: 'Souche à plage', proportion: { min: 0.2, max: 0.6 } },
    ], explanation: 'Membres documentés, fractions non complétées.' };
    const r1 = adoptWithDistinctOriginalAndAdoptingActors(initial, context, prepared, 'nr-culture-lineage', hypothesis('nr-culture-lineage', 1, mixed).baseline);
    const r1Identity = identityAt(r1);
    const r2 = adoptHopV55ReferenceHypothesis(r1, hypothesis('nr-culture-lineage', 2, mixed), context, prepared,
      { referenceVersion: 'version / β' });

    const staleR1 = resolveHopV55AdoptedContext({ workspace: r2, expected: r1Identity });
    expect(staleR1).toMatchObject({ status: 'stale', code: 'expectedReferenceChanged', current: identityAt(r2, 1) });

    const reactivated = applyHopV55ReferenceEvent(r2, {
      ownerKey: r2.ownerKey,
      contextId: r2.referenceJournal!.record.contextId,
      commandId: 'activate-r1-for-resolution-test',
      expectedRevision: r2.referenceJournal!.record.revision,
      recordedAt: '2026-10-03T08:15:00.000Z',
      kind: 'referenceActivated',
      payload: { reference: r1Identity, activatedBy: { id: 'cellar-operator', label: 'Responsable de cave' },
        reason: 'Réactivation explicite pour la prochaine préparation.' },
    });
    const resolved = resolveHopV55AdoptedContext({ workspace: reactivated, expected: r1Identity });
    expect(resolved.status).toBe('resolved');
    if (resolved.status !== 'resolved') throw new Error('La version NR R1 réactivée exactement doit être résolue.');
    expect(resolved.binding.culture).toEqual({ status: 'declared', value: mixed });
    expect(resolved.binding.baseline).toMatchObject({ culture: { members: [
      { yeastId: 'strain-without-proportion' }, { yeastId: 'strain-with-range', proportion: { min: 0.2, max: 0.6 } },
    ] } });
    expect(resolved.binding.versionSnapshot.author).toEqual({ id: 'original-author', label: 'Autrice de l’hypothèse' });
    expect(resolved.binding.adoption).toMatchObject({ adoptedAt: '2026-10-03T08:11:00.000Z',
      adoptedBy: { id: 'adopting-operator', label: 'Responsable adoptant' } });
    expect(resolved.binding.activations).toMatchObject([{ kind: 'referenceActivated', commandId: 'activate-r1-for-resolution-test',
      activatedAt: '2026-10-03T08:15:00.000Z', activatedBy: { id: 'cellar-operator', label: 'Responsable de cave' },
      reason: 'Réactivation explicite pour la prochaine préparation.', eventReference: expect.any(String),
      eventSnapshot: { kind: 'referenceActivated', eventFormatVersion: 2, ownerKey: initial.ownerKey,
        contextId: r1.referenceJournal!.record.contextId, payload: { reference: r1Identity } } }]);
    expect(resolved.binding.versionSnapshot.version).toBe('version / α');
    expect(readHopV55AdoptedContextBinding(resolved.binding).status).toBe('available');
  });

  it('refuse les identités périmées, les contenus altérés et les événements NR futurs sans fallback', async () => {
    const { context, prepared } = await preparedFixture();
    const adopted = adoptHopV55ReferenceHypothesis(workspace(), hypothesis('nr-culture-content', 1,
      { state: 'single', members: [{ yeastId: 'exact-strain' }] }), context, prepared,
    { referenceVersion: 'édition NR opaque' });
    const identity = identityAt(adopted);
    expect(resolveHopV55AdoptedContext({ workspace: adopted,
      expected: { ...identity, contentReference: 'altération-de-contenu' } })).toMatchObject({ status: 'stale', code: 'expectedReferenceChanged' });

    const tampered = structuredClone(adopted);
    const proposal = tampered.referenceJournal!.events.find(event => event.kind === 'referenceProposed');
    if (!proposal || proposal.kind !== 'referenceProposed') throw new Error('Événement de proposition manquant dans la fixture réelle.');
    proposal.payload.reference.content.baseline.label = 'Contenu réécrit sous la même identité';
    expect(resolveHopV55AdoptedContext({ workspace: tampered, expected: identity })).toMatchObject({
      status: 'invalid', code: 'journalInvalid',
    });

    const future = structuredClone(adopted);
    future.referenceJournal!.events.push({ eventFormatVersion: 3, ownerKey: future.ownerKey,
      contextId: future.referenceJournal!.record.contextId, kind: 'futureCultureCommand', payload: { untouched: true } } as any);
    const opaque = resolveHopV55AdoptedContext({ workspace: future, expected: identity });
    expect(opaque).toMatchObject({ status: 'unsupportedFormat', reason: 'eventFormat' });
    expect((opaque as Extract<typeof opaque, { status: 'unsupportedFormat' }>).raw).toBeDefined();
  });
});
