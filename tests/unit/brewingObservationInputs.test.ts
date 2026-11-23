import { describe, expect, it } from 'vitest';
import { brewingObservedContactSource, brewingObservedFactSource, resolveBrewingObservedState } from '../../src/domain/brewingObservedState';
import { buildBrewingObservedHopInput, buildBrewingObservationTarget, assertBrewingObservationTargetInput,
  type BrewingObservationTargetRequest } from '../../src/domain/brewingObservationInputs';
import { prepareBrewingObservedContext, type PrepareBrewingObservedContextOptions } from '../../src/domain/brewingObservationContext';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { RecipeSnapshot, HopIngredient } from '../../src/types';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { observedScenarioFixture, observedScenarioAt } from '../fixtures/brewingObservedScenario';

function target(fixture: ReturnType<typeof observedScenarioFixture>): BrewingObservationTargetRequest {
  return { current: fixture.prepared, future: [], contactTargets: fixture.prepared.used.filter(row => !row.ended).map(row => ({ additionId: row.additionId,
    contactHours: row.elapsedHours, explanation: 'Arrêt à la durée déjà écoulée explicitement choisi pour cette cible de fixture.' })),
    horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Horizon explicite de fixture.' },
    explanation: 'Projection hypothétique, sans réécriture des faits réalisés.' };
}
function future(fixture: ReturnType<typeof observedScenarioFixture>, id = 'future-a') {
  return { id, materialId: fixture.material.id, timing: 'postFermentation' as const, contactHours: 12, temperatureC: 15, matrixId: null,
    quantity: { kind: 'remaining' as const, grams: 10 }, explanation: 'Ajout seulement prévu.' };
}

function preparedByContext(rawLotId: string) {
  const batchId = 'context-batch-lot-identity';
  const varietyId = 'context-variety';
  const startedAt = '2026-10-02T06:00:00.000Z';
  const asOf = '2026-10-02T10:00:00.000Z';
  const readAt = '2026-10-02T10:06:00.000Z';
  const provenance = { kind: 'fixture', reference: 'fixture://canonical-lot', description: 'Identité canonique de fixture.' };
  const time = (effectiveAt: string, reference: string) => ({ effectiveAt, recordedAt: readAt, provenance: { ...provenance, reference } });
  const sourceHop: HopIngredient = { name: 'Lot observé', alpha: 8, weightG: 18, stage: 'dryHop',
    aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 18,
    hopVarietyId: varietyId, hopLotId: rawLotId };
  const snapshot = { capturedAt: '2026-10-01T08:00:00.000Z', sourceRecipeId: 'recipe-lot-identity', name: 'Fixture lot',
    style: 'IPA', volumeL: 20, fermentables: [], totalGristKg: 0, hops: [sourceHop], yeast: { name: 'US-05' },
    fermentation: [], steps: [], notes: [] } as unknown as RecipeSnapshot;
  const context = {
    batch: { id: batchId, name: 'Batch lot', status: 'fermentation', brewDate: '2026-10-02', volumeL: 20, recipeSnapshot: snapshot },
    recipe: snapshot,
    journal: { steps: [], currentIndex: 0, startedAt: Date.parse(startedAt), revision: 1,
      additions: { 'hop-0': { amount: 20, unit: 'g', doneAt: Date.parse(startedAt) } } },
    inventory: [], material: [], waterSources: [], phase: 'fermentation', now: Date.parse(readAt), provenance: [],
  } as unknown as BrewerContext;
  const material: HopDecisionMaterial = { id: `lot:${rawLotId}`, name: 'Lot observé', form: 'pelletT90',
    variety: { id: varietyId, name: 'Variété de fixture', aliases: [], form: 'pelletT90', analysis: [], descriptions: [] },
    lot: { id: rawLotId, varietyId, name: 'Lot observé', form: 'pelletT90', analysis: [] } };
  const options: PrepareBrewingObservedContextOptions = {
    source: { kind: 'batch', id: batchId }, asOf, knowledgeAsOf: '2026-10-02T10:10:00.000Z', materials: [material],
    contactAttestations: [{ additionKey: 'hop-0', kind: 'activeThrough', evidence: time(asOf, 'contact-through') , epistemicStatus: 'reported' }],
    coverageAttestations: ['hopMaterials', 'hopContact'].map(dependencyId => ({ id: `coverage:${dependencyId}`, version: 1,
      supersedesVersion: null, dependencyId, fromAt: '2026-10-02T00:00:00.000Z', throughAt: asOf, status: 'complete',
      recordedAt: readAt, provenance: { ...provenance, reference: `coverage:${dependencyId}` } })),
    hopScope: { id: 'scope-lot-identity', dependencyIds: ['hopMaterials', 'hopContact'], fromAt: '2026-10-02T00:00:00.000Z',
      explanation: 'Portée de fixture.' },
  };
  return prepareBrewingObservedContext(context, options);
}

describe('entrées d’observation depuis des faits et contacts réels', () => {
  it('utilise la masse réalisée et le contact écoulé, sans duration cible dans l’état', () => {
    const fixture = observedScenarioFixture({ asOfHours: 6, grams: 20 });
    expect(fixture.prepared.status).toBe('available');
    expect(fixture.prepared.input?.additions[0].triplet).toMatchObject({ doseGL: 1, contactHours: 6, lotId: null });
    const proposed = target(fixture); proposed.contactTargets = [{ additionId: 'realized-a', contactHours: 24, explanation: 'Poursuite hypothétique du contact actif.' }];
    proposed.future = [future(fixture)];
    const result = buildBrewingObservationTarget(proposed);
    expect(result.status).toBe('available');
    expect(result.input?.additions.map(row => row.triplet.contactHours)).toEqual([24, 12]);
    expect(fixture.prepared.input?.additions[0].triplet.contactHours).toBe(6);
    expect(fixture.state.physicalStateReference).toBe(fixture.prepared.source.state.physicalStateReference);
  });
  it('résout les sources fact/contact par référence documentaire, pas par id/version partagés entre sujets', () => {
    const fixture = observedScenarioFixture();
    const currentFact = fixture.stateInput.facts[0]; if (currentFact.kind === 'condition') throw Error('fixture');
    const otherSubject = { id: 'other-beer', version: '1', contentReference: 'fixture:other-beer' };
    const otherFact = structuredClone(currentFact);
    otherFact.subjectReference = otherSubject;
    otherFact.effectiveAt = observedScenarioAt(23);
    otherFact.recordedAt = observedScenarioAt(23);
    otherFact.lot = { status: 'identified', reference: { id: 'other-lot', version: '1', contentReference: 'other-lot' } };
    otherFact.quantity = { status: 'known', value: 900, unit: 'g' };
    fixture.stateInput.facts.unshift(otherFact);

    const otherContact = structuredClone(fixture.stateInput.contacts[0]);
    otherContact.subjectReference = otherSubject;
    otherContact.started = { effectiveAt: observedScenarioAt(23), recordedAt: observedScenarioAt(23), provenance: otherContact.started.provenance };
    otherContact.activeThrough = { effectiveAt: observedScenarioAt(24), recordedAt: observedScenarioAt(24), provenance: otherContact.started.provenance };
    otherContact.lot = structuredClone(otherFact.lot);
    fixture.stateInput.contacts.unshift(otherContact);

    const state = resolveBrewingObservedState(fixture.stateInput);
    const factDisposition = state.factDispositions.find(row => row.disposition === 'effective')!;
    const contactDisposition = state.contactDispositions.find(row => row.disposition === 'effective')!;
    expect(state.factDispositions).toContainEqual(expect.objectContaining({ id: currentFact.id, version: currentFact.version, disposition: 'otherSubject' }));
    const sourcedFact = brewingObservedFactSource(state, factDisposition.reference);
    if (!sourcedFact || sourcedFact.kind === 'condition') throw Error('La référence documentaire courante doit désigner un fait houblon.');
    expect(sourcedFact.quantity).toEqual({ status: 'known', value: 20, unit: 'g' });
    expect(brewingObservedContactSource(state, contactDisposition.reference)?.started.effectiveAt).toBe(observedScenarioAt(0));

    const current = buildBrewingObservedHopInput({ ...fixture.request, state, bindings: [{ ...fixture.request.bindings[0],
      factReference: factDisposition.reference, contactReference: contactDisposition.reference }] });
    expect(current.status).toBe('available');
    expect(current.used[0]).toMatchObject({ grams: 20, elapsedHours: 6 });
    expect(current.input?.additions[0].triplet.lotId).toBeNull();

    const projection = buildBrewingObservationTarget({ current, future: [],
      contactTargets: [{ additionId: 'realized-a', contactHours: 6, explanation: 'Durée écoulée inchangée.' }],
      horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Horizon futur de fixture.' },
      explanation: 'Projection vérifiant la source temporelle exacte.' });
    expect(projection.status).toBe('available');
    expect(projection.issues.map(row => row.code)).not.toContain('contactBeyondHorizon');

    const relativePast = buildBrewingObservationTarget({ current, future: [], contactTargets: [],
      horizon: { kind: 'relative', eventReference: factDisposition.reference, durationHours: 0, explanation: 'Événement du fait courant.' },
      explanation: 'Horizon relatif ancré à la source exacte du fait.' });
    expect(relativePast.issues.map(row => row.code)).toContain('horizonBeforeCurrent');
    expect(relativePast.issues.map(row => row.code)).not.toContain('horizonEventUnknown');
  });
  it('ne transforme pas l’absence d’historique en programme vide', () => {
    const unknown = observedScenarioFixture({ empty: true, complete: false });
    expect(unknown.prepared.status).toBe('unknown');
    expect(unknown.prepared.input).toBeNull();
    expect(unknown.prepared.issues.map(row => row.code)).toContain('scopeNotComplete');
    const empty = observedScenarioFixture({ empty: true });
    expect(empty.prepared.status).toBe('available');
    expect(empty.prepared.input?.additions).toEqual([]);
  });
  it('ne retire pas une dose passée lorsque le contact est terminé et refuse sa prolongation fictive', () => {
    const fixture = observedScenarioFixture({ asOfHours: 10, endedHours: 8 });
    expect(fixture.prepared.input?.additions[0].triplet).toMatchObject({ doseGL: 1, contactHours: 8 });
    const proposed = target(fixture); proposed.contactTargets = [{ additionId: 'realized-a', contactHours: 12, explanation: 'Tentative de prolonger le passé clos.' }];
    expect(buildBrewingObservationTarget(proposed).issues.map(row => row.code)).toContain('realizedContactChanged');
  });
  it('calcule le restant d’un total en conservant le réalisé exactement une fois', () => {
    const fixture = observedScenarioFixture({ grams: 20 });
    const proposed = target(fixture);
    proposed.future = [{ ...future(fixture), quantity: { kind: 'totalIncludingRealized', grams: 30,
      realizedFactReferences: [fixture.prepared.used[0].factReference] } }];
    const result = buildBrewingObservationTarget(proposed);
    expect(result.remaining[0]).toMatchObject({ plannedGrams: 30, realizedGrams: 20, remainingGrams: 10 });
    expect(result.input?.additions.map(row => row.triplet.doseGL)).toEqual([1, 0.5]);
    expect(() => assertBrewingObservationTargetInput(result)).not.toThrow();
    const changed = structuredClone(result); changed.input!.additions[1].triplet.doseGL = 999;
    expect(() => assertBrewingObservationTargetInput(changed)).toThrow();
  });
  it('refuse de déduire deux fois la même réalisation et un total inférieur au passé', () => {
    const fixture = observedScenarioFixture({ grams: 20 });
    const proposed = target(fixture);
    const quantity = { kind: 'totalIncludingRealized' as const, grams: 30, realizedFactReferences: [fixture.prepared.used[0].factReference] };
    proposed.future = [{ ...future(fixture), quantity }, { ...future(fixture, 'future-b'), quantity }];
    expect(buildBrewingObservationTarget(proposed).issues.map(row => row.code)).toContain('realizedAllocationInvalid');
    proposed.future = [{ ...future(fixture), quantity: { ...quantity, grams: 19 } }];
    expect(buildBrewingObservationTarget(proposed).status).toBe('unknown');
  });
  it('garde les ajouts connus si une masse ou un contact nécessaire reste inconnu', () => {
    const fixture = observedScenarioFixture();
    const unbound = buildBrewingObservedHopInput({ ...fixture.request, bindings: [] });
    expect(unbound.status).toBe('unknown');
    expect(unbound.issues.map(row => row.code)).toContain('realizedFactUnbound');
    fixture.stateInput.contacts[0].activeThrough = undefined;
    delete fixture.stateInput.contacts[0].activeThrough;
    const state = resolveBrewingObservedState(fixture.stateInput);
    const request = { ...fixture.request, state, bindings: [{ ...fixture.request.bindings[0], contactReference: state.contactStates[0].reference }] };
    expect(buildBrewingObservedHopInput(request).issues.map(row => row.code)).toContain('contactUnknown');
  });
  it('refuse les timestamps sans fuseau et préserve le texte d’un offset explicite', () => {
    const fixture = observedScenarioFixture();
    const naiveScope = { ...fixture.request, scope: { ...fixture.request.scope, fromAt: '2026-10-02T00:00:00' } };
    expect(() => buildBrewingObservedHopInput(naiveScope)).toThrow(/Portée physique/);

    const offset = '2026-10-02T00:00:00+00:00';
    const explicitOffset = { ...fixture.request, scope: { ...fixture.request.scope, fromAt: offset } };
    expect(buildBrewingObservedHopInput(explicitOffset).source.scope.fromAt).toBe(offset);
    const naiveHorizon = target(fixture);
    naiveHorizon.horizon = { kind: 'instant', at: '2026-10-02T12:00:00', explanation: 'Instant sans fuseau.' };
    expect(() => buildBrewingObservationTarget(naiveHorizon)).toThrow(/Horizon explicite/);
  });
  it('lie le lot du matériau au même lot identifié par le fait et le contact', () => {
    const fixture = observedScenarioFixture();
    const actualLot = { status: 'identified' as const, reference: { id: 'observed-lot-A', version: '1', contentReference: 'lot-A' } };
    const fact = fixture.stateInput.facts[0]; if (fact.kind === 'condition') throw Error('fixture');
    fact.lot = structuredClone(actualLot);
    fixture.stateInput.contacts[0].lot = structuredClone(actualLot);
    const material = { ...structuredClone(fixture.material), lot: { id: 'observed-lot-A', varietyId: fixture.material.variety!.id,
      name: 'Lot réellement ajouté', form: 'pelletT90' as const, analysis: [] } };
    const state = resolveBrewingObservedState(fixture.stateInput);
    const request = { ...fixture.request, state, materials: [material], bindings: [{ ...fixture.request.bindings[0],
      factReference: state.factDispositions.find(row => row.id === fact.id)!.reference,
      contactReference: state.contactStates.find(row => row.id === 'contact-a')!.reference }] };

    const result = buildBrewingObservedHopInput(request);

    expect(result.status).toBe('available');
    expect(result.input?.additions[0].triplet).toMatchObject({ varietyId: 'fixture-hop', lotId: 'observed-lot-A' });
  });
  it('décode le lot snapshot canonique du vrai producteur Context sans tronquer un id contenant deux-points', () => {
    const rawLotId = 'lot:part-A';
    const prepared = preparedByContext(rawLotId);

    expect(prepared.status).toBe('prepared');
    const fact = prepared.stateInput?.facts[0];
    if (!fact || fact.kind === 'condition') throw Error('Le producteur Context doit créer un fait de houblon.');
    expect(fact.lot).toMatchObject({ status: 'identified', reference: {
      id: `lot:${rawLotId}`, version: 'snapshot-id-v1',
      contentReference: hopAdviceContentReference('brewing-observed-physical-identity-v1', { kind: 'lot', id: rawLotId }),
    } });
    expect(prepared.observedHopInput?.status).toBe('available');
    expect(prepared.observedHopInput?.input?.additions[0].triplet.lotId).toBe(rawLotId);
  });
  it('refuse le lot B du matériau si fait et contact qualifient le lot A', () => {
    const fixture = observedScenarioFixture();
    const actualLot = { status: 'identified' as const, reference: { id: 'observed-lot-A', version: '1', contentReference: 'lot-A' } };
    const fact = fixture.stateInput.facts[0]; if (fact.kind === 'condition') throw Error('fixture');
    fact.lot = structuredClone(actualLot);
    fixture.stateInput.contacts[0].lot = structuredClone(actualLot);
    const material = { ...structuredClone(fixture.material), lot: { id: 'different-lot-B', varietyId: fixture.material.variety!.id,
      name: 'Autre lot', form: 'pelletT90' as const, analysis: [] } };
    const state = resolveBrewingObservedState(fixture.stateInput);
    const request = { ...fixture.request, state, materials: [material], bindings: [{ ...fixture.request.bindings[0],
      factReference: state.factDispositions.find(row => row.id === fact.id)!.reference,
      contactReference: state.contactStates.find(row => row.id === 'contact-a')!.reference }] };

    const result = buildBrewingObservedHopInput(request);

    expect(result.status).toBe('unknown');
    expect(result.input).toBeNull();
    expect(result.issues.map(row => row.code)).toContain('lotIdentityMismatch');
  });
  it('refuse une référence snapshot namespacée dont le hash canonique est forgé', () => {
    const fixture = observedScenarioFixture();
    const forgedLot = { status: 'identified' as const,
      reference: { id: 'lot:observed-lot-A', version: 'snapshot-id-v1', contentReference: 'forged-content-reference' } };
    const fact = fixture.stateInput.facts[0]; if (fact.kind === 'condition') throw Error('fixture');
    fact.lot = structuredClone(forgedLot);
    fixture.stateInput.contacts[0].lot = structuredClone(forgedLot);
    const material = { ...structuredClone(fixture.material), lot: { id: 'observed-lot-A', varietyId: fixture.material.variety!.id,
      name: 'Lot réellement nommé', form: 'pelletT90' as const, analysis: [] } };
    const state = resolveBrewingObservedState(fixture.stateInput);
    const request = { ...fixture.request, state, materials: [material], bindings: [{ ...fixture.request.bindings[0],
      factReference: state.factDispositions.find(row => row.id === fact.id)!.reference,
      contactReference: state.contactStates.find(row => row.id === 'contact-a')!.reference }] };

    const result = buildBrewingObservedHopInput(request);

    expect(result.status).toBe('unknown');
    expect(result.input).toBeNull();
    expect(result.issues.map(row => row.code)).toContain('lotIdentityMismatch');
  });
  it('ne retire pas le préfixe lot: d’un identifiant historique brut qui contient lui-même deux-points', () => {
    const fixture = observedScenarioFixture();
    const rawLotId = 'lot:historique:A';
    const rawLot = { status: 'identified' as const,
      reference: { id: rawLotId, version: 'legacy-identity-v1', contentReference: 'legacy-source' } };
    const fact = fixture.stateInput.facts[0]; if (fact.kind === 'condition') throw Error('fixture');
    fact.lot = structuredClone(rawLot);
    fixture.stateInput.contacts[0].lot = structuredClone(rawLot);
    const material = { ...structuredClone(fixture.material), lot: { id: rawLotId, varietyId: fixture.material.variety!.id,
      name: 'Lot historique', form: 'pelletT90' as const, analysis: [] } };
    const state = resolveBrewingObservedState(fixture.stateInput);
    const request = { ...fixture.request, state, materials: [material], bindings: [{ ...fixture.request.bindings[0],
      factReference: state.factDispositions.find(row => row.id === fact.id)!.reference,
      contactReference: state.contactStates.find(row => row.id === 'contact-a')!.reference }] };

    const result = buildBrewingObservedHopInput(request);

    expect(result.status).toBe('available');
    expect(result.input?.additions[0].triplet.lotId).toBe(rawLotId);
  });
  it('refuse un lot de catalogue quand fait et contact ne connaissent que la variété', () => {
    const fixture = observedScenarioFixture();
    const material = { ...structuredClone(fixture.material), lot: { id: 'unobserved-lot', varietyId: fixture.material.variety!.id,
      name: 'Lot non attesté', form: 'pelletT90' as const, analysis: [] } };

    const result = buildBrewingObservedHopInput({ ...fixture.request, materials: [material] });

    expect(result.status).toBe('unknown');
    expect(result.input).toBeNull();
    expect(result.issues.map(row => row.code)).toContain('lotNotObserved');
  });
  it('convertit une masse documentée et refuse une unité de volume sans densité', () => {
    const fixture = observedScenarioFixture();
    const row = fixture.stateInput.facts[0]; if (row.kind === 'condition') throw Error('fixture');
    row.quantity = { status: 'known', value: 0.02, unit: 'kg' };
    let state = resolveBrewingObservedState(fixture.stateInput);
    let request = { ...fixture.request, state, bindings: [{ ...fixture.request.bindings[0], factReference: state.factDispositions[0].reference }] };
    expect(buildBrewingObservedHopInput(request).used[0].grams).toBe(20);
    row.quantity = { status: 'known', value: 20, unit: 'mL' };
    state = resolveBrewingObservedState(fixture.stateInput);
    request = { ...request, state, bindings: [{ ...request.bindings[0], factReference: state.factDispositions[0].reference }] };
    expect(buildBrewingObservedHopInput(request).issues.map(row => row.code)).toContain('massUnitNotConvertible');
  });
  it('rejette un futur incompatible avec l’horizon ou sans choix pour les contacts actifs', () => {
    const fixture = observedScenarioFixture();
    const proposed = target(fixture); proposed.contactTargets = [];
    expect(buildBrewingObservationTarget(proposed).issues.map(row => row.code)).toContain('activeContactFutureUnspecified');
    proposed.contactTargets = [{ additionId: 'realized-a', contactHours: 25, explanation: 'Durée incompatible avec horizon24.' }];
    expect(buildBrewingObservationTarget(proposed).issues.map(row => row.code)).toContain('contactBeyondHorizon');
    proposed.contactTargets = target(fixture).contactTargets;
    proposed.future = [{ ...future(fixture), contactHours: 30 }];
    expect(buildBrewingObservationTarget(proposed).issues.map(row => row.code)).toContain('futureContactBeyondHorizon');
    proposed.horizon = { kind: 'relative', eventReference: 'unidentified', durationHours: 48, explanation: 'Événement non identifié.' };
    expect(buildBrewingObservationTarget(proposed).issues.map(row => row.code)).toContain('horizonEventUnknown');
  });
  it('déduit exactement 0,1 + 0,2 d’un total 0,3 sans faux déficit ni troisième ajout', () => {
    const fixture = observedScenarioFixture({ grams: 0.1 });
    const second = structuredClone(fixture.stateInput.facts[0]);
    if (second.kind === 'condition') throw Error('fixture');
    second.id = 'addition-b'; second.quantity = { status: 'known', value: 0.2, unit: 'g' };
    const contact = structuredClone(fixture.stateInput.contacts[0]); contact.id = 'contact-b';
    fixture.stateInput.facts.push(second); fixture.stateInput.contacts.push(contact);
    const state = resolveBrewingObservedState(fixture.stateInput);
    const prepared = buildBrewingObservedHopInput({ ...fixture.request, state, bindings: state.factDispositions.map((row, index) => ({
      ...fixture.request.bindings[0], additionId: `realized-${index}`, factReference: row.reference, contactReference: state.contactStates[index].reference })) });
    const updated = { ...fixture, state, prepared };
    const proposed = target(updated);
    proposed.future = [{ ...future(updated), quantity: { kind: 'totalIncludingRealized', grams: 0.3,
      realizedFactReferences: prepared.used.map(row => row.factReference) } }];
    const result = buildBrewingObservationTarget(proposed);
    expect(result.status).toBe('available');
    expect(result.remaining[0]).toMatchObject({ realizedGrams: 0.3, remainingGrams: 0, arithmetic: { status: 'equal' } });
    expect(result.input?.additions).toHaveLength(2);
  });
});
