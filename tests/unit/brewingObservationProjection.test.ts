import { beforeAll, describe, expect, it, vi } from 'vitest';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { proposeBrewingNuancePlans, adoptBrewingNuancePlan, reviseBrewingNuancePlan, type BrewingNuancePlan } from '../../src/domain/brewingNuanceProjection';
import * as nuances from '../../src/domain/brewingNuanceProjection';
import { createBrewingSensoryDefinitionReference } from '../../src/domain/brewingSensory';
import { createBrewingObservationAnchor } from '../../src/domain/brewingObservationAnchor';
import { resolveBrewingObservedState, type BrewingObservedStateInputV1 } from '../../src/domain/brewingObservedState';
import { buildBrewingObservedHopInput, buildBrewingObservationTarget } from '../../src/domain/brewingObservationInputs';
import { projectBrewingObservation, archiveBrewingObservationProjection, readBrewingObservationProjectionArchive,
  type BrewingObservationProjectionRequest } from '../../src/domain/brewingObservationProjection';
import { brewingObservationProjectionViewModel } from '../../src/domain/brewingObservationViewModel';
import { prepareBrewingObservedContext } from '../../src/domain/brewingObservationContext';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { applyBrewingReferenceCommand, openBrewingReferenceContext, readBrewingReferenceRecord,
  type BrewingReferenceObservationV1, type BrewingReferenceEvent } from '../../src/domain/brewingReference';
import { brewingObservationFactReference, type BrewingObservationArithmeticContract } from '../../src/domain/brewingObservationNumerics';
import { resolveCurrentBrewingObservation, createBrewingReferenceObservationCorrectionCommand } from '../../src/domain/brewingObservationSelection';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import { observedScenarioFixture, observedScenarioAt, observedScenarioSource } from '../fixtures/brewingObservedScenario';

let data: HopEngineData, plan: BrewingNuancePlan;
const actor = { origin: 'model' as const, name: 'Fixture automatisée, aucune adoption humaine prétendue' };
beforeAll(async () => {
  const refs = await loadBrewingCatalogueReferences();
  data = { ...refs, lots: [] };
  const sourceModel = refs.knowledge.find(row => row.kind === 'extrapolation' && row.id === 'laffinee-experimental-v1') as HopExtrapolation;
  const axis = refs.knowledge.find(row => row.kind === 'axis' && row.id === 'pomeFruit') as HopAxis;
  const modelAxis = sourceModel.axes.find(row => row.id === axis.id && row.version === axis.version)!;
  const description = refs.varieties.find(row => row.id === 'hopsteiner-eld')!.descriptions.find(row => row.context === 'rawHop' && /\bpear\b/i.test(row.text))!;
  const plans = proposeBrewingNuancePlans({ planId: 'fixture-anchored-pear', dimensions: [{ id: 'fixture-pear', version: '1', name: 'Poire',
    definition: 'Nuance de fixture, distincte d’une famille et d’une intensité mesurée.', terms: ['pear', 'poire'], sourceRefs: [description.source] }],
    sourceModel, axes: refs.knowledge.filter((row): row is HopAxis => row.kind === 'axis'), proposedAt: observedScenarioAt(6), proposedBy: actor });
  const selected = plans.find(candidate => candidate.parameterChoices.some(choice => choice.target.kind === 'dimension' && choice.target.parameter === 'yeastAroma')
    && sourceModel.axes.some(row => row.id === candidate.doseAxis.id && row.version === candidate.doseAxis.version
      && JSON.stringify(row.doseScale.range) === JSON.stringify(modelAxis.doseScale.range)
      && row.doseScale.central === modelAxis.doseScale.central && JSON.stringify(candidate.doseAxis.scale) === JSON.stringify(axis.scale)));
  if (!selected) throw Error('Convention de dose réelle non retrouvée.');
  plan = adoptBrewingNuancePlan(selected, { adoptedAt: observedScenarioAt(6), adoptedBy: actor, reason: 'Sensibilité conditionnelle de test, pas calibration.' });
});

function physical(options: { hours?: number; empty?: boolean; yeastKnown?: boolean; attestedThroughHours?: number;
  transform?: (input: BrewingObservedStateInputV1) => void } = {}) {
  const fixture = observedScenarioFixture({ asOfHours: options.hours ?? 6, grams: 80, empty: options.empty });
  const variety = data.varieties.find(row => row.id === 'hopsteiner-eld')!;
  const material = { id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety };
  for (const fact of fixture.stateInput.facts) if (fact.kind !== 'condition' && fact.material.status === 'identified') fact.material.reference.id = material.id;
  for (const contact of fixture.stateInput.contacts) if (contact.material.status === 'identified') contact.material.reference.id = material.id;
  if (options.attestedThroughHours !== undefined) for (const contact of fixture.stateInput.contacts) if (contact.activeThrough) {
    contact.activeThrough.effectiveAt = observedScenarioAt(options.attestedThroughHours);
    contact.activeThrough.recordedAt = observedScenarioAt(options.attestedThroughHours);
  }
  options.transform?.(fixture.stateInput);
  const state = resolveBrewingObservedState(fixture.stateInput);
  const source = { ...fixture.request, state, materials: [material],
    context: { ...fixture.request.context, input: { ...fixture.request.context.input, yeastId: options.yeastKnown === false ? null : 'wyeast-1728' } },
    bindings: options.empty ? [] : [{ ...fixture.request.bindings[0], materialId: material.id,
      factReference: state.factDispositions.find(row => row.disposition === 'effective')!.reference,
      contactReference: state.contactStates[0].reference }] };
  return { state, source, material, prepared: buildBrewingObservedHopInput(source) };
}

function request(options: { empty?: boolean; yeastKnown?: boolean; note?: number; unchanged?: boolean; hours?: number } = {}) {
  const source = physical(options);
  const targetDefinition = plan.definitions[0];
  const metric = { ...targetDefinition.metric!, id: 'fixture-ordinal-intensity', kind: 'ordinalNote' as const,
    name: 'Note ordinale d’intensité de fixture', meaning: 'Note perçue de fixture, jamais un calcul ni une préférence.', sourceRefs: [observedScenarioSource] };
  const scale = { ...targetDefinition.scale!, id: 'fixture-ordinal-scale', metricRef: { id: metric.id, version: metric.version }, sourceRefs: [observedScenarioSource] };
  const definition = createBrewingSensoryDefinitionReference(targetDefinition.dimension, metric, scale);
  const observation: BrewingReferenceObservationV1 = { id: 'fixture-note', version: 1, subject: { kind: 'beer', id: source.state.subject.identity.id, label: 'Bière synthétique' },
    observedAt: source.state.asOf, author: { label: 'Fixture automatisée' }, origin: { kind: 'fixture', description: 'Valeur synthétique, aucune dégustation réelle.' },
    originalText: 'Note de fixture sur une échelle déclarée 0–100.', dimension: { status: 'resolved', definition }, scale: { status: 'known', metric, scale },
    sense: { kind: 'sensoryRating', value: options.note ?? 37 }, comparison: { kind: 'absolute' }, context: {} };
  const arithmetic: BrewingObservationArithmeticContract = { version: 'brewing-observation-arithmetic-v1', id: 'fixture-unit-bridge', definition: targetDefinition,
    operation: 'ordinalWorkingHypothesis', basis: null, explanation: 'Correspondance numérique conditionnelle, non empirique.', sourceRefs: [observedScenarioSource],
    adoptedAt: source.state.asOf, adoptedBy: actor, unitBridge: { sourceDefinition: definition, rule: 'unitCorrespondence', domain: { min: 0, max: 100 },
      sourceMeaning: { kind: 'intensity', direction: 'increasing' }, targetMeaning: { kind: 'intensity', direction: 'increasing' },
      explanation: 'g(x)=x adopté seulement pour ce test, source et cible distinctes.' } };
  const anchor = createBrewingObservationAnchor({ id: 'fixture-anchor', observation, observedState: source.state,
    subjectRelation: 'sameSubject', explanation: 'Identité de bière explicite.', createdAt: source.state.asOf, createdBy: actor });
  const targetInput = buildBrewingObservationTarget({ current: source.prepared,
    future: options.empty && !options.unchanged ? [{ id: 'future-first', materialId: source.material.id, timing: 'postFermentation',
      contactHours: 24, temperatureC: 15, matrixId: null, quantity: { kind: 'remaining', grams: 80 }, explanation: 'Ajout uniquement prévu.' }] : [],
    contactTargets: !options.empty && !options.unchanged ? [{ additionId: 'realized-a', contactHours: 24, explanation: 'Horizon déclaré du contact actif.' }] : [],
    horizon: { kind: 'instant', at: options.unchanged ? source.state.asOf : observedScenarioAt(options.empty ? 30 : 24), explanation: 'Horizon explicite de test.' },
    explanation: 'Source réelle conservée, cible hypothétique séparée.' });
  const value: BrewingObservationProjectionRequest = { id: 'fixture-question', anchor, observedInput: source.prepared, targetInput,
    frames: [{ id: 'theta-source', name: 'Centrales déclarées du modèle', plan }], arithmetic,
    restStability: { status: 'adopted', explanation: 'Hypothèse de stabilité hors domaine du modèle, pas observation.',
      adoptedAt: source.state.asOf, adoptedBy: actor, conditions: [{ id: 'unchanged-rest', status: 'declaredCompatible',
        explanation: 'Reste de la bière invariant par hypothèse dans cette fixture.', sourceRefs: [observedScenarioSource] }] },
    createdAt: source.state.asOf, createdBy: actor };
  return value;
}

describe('ancrage numérique par le vrai modèle et snapshots couplés', () => {
  it('traverse état dégusté, note et contact futur avec un delta central réellement couplé', () => {
    const input = request(), original = structuredClone(input);
    const result = projectBrewingObservation(input, data), frame = result.frames[0];
    expect(frame.issues).toEqual([]);
    expect(frame.status).toBe('projected');
    expect(frame.modelPair?.candidates.map(row => row.inputSnapshot.additions[0].triplet.contactHours)).toEqual([6, 24]);
    expect(frame.delta).toBe(frame.targetCentral! - frame.observedCentral!);
    expect(frame.delta).toBeGreaterThan(0);
    expect(frame.rawProjection).toBe(37 + frame.delta!);
    expect(result.numerical).toMatchObject({ status: 'comparable', valueStatus: 'hypotheticalInterpretation' });
    expect(input).toEqual(original);
    expect(result.currentApplicability.status).toBe('applicable');
  });
  it('garde un vrai état vide et son prior déclaré, sans centrale inventée si la levure manque', () => {
    const known = projectBrewingObservation(request({ empty: true }), data).frames[0];
    expect(known.status).toBe('projected');
    expect(known.modelPair?.candidates[0].inputSnapshot.additions).toEqual([]);
    expect(known.observedCentral).toBeGreaterThan(0);
    const unknown = projectBrewingObservation(request({ empty: true, yeastKnown: false }), data).frames[0];
    expect(unknown.status).toBe('unknown');
    expect(unknown.observedCentral).toBeNull(); expect(unknown.delta).toBeNull(); expect(unknown.rawProjection).toBeNull();
    expect(unknown.issues.map(row => row.code)).toContain('centralMissing');
  });
  it('donne exactement zéro au même état sous le même cadre et garde la note', () => {
    const result = projectBrewingObservation(request({ unchanged: true }), data).frames[0];
    expect(result.status).toBe('projected'); expect(result.delta).toBe(0); expect(result.rawProjection).toBe(37);
  });
  it.each(['otherScope', 'forgottenFact', 'changedMass', 'changedBinding'] as const)(
    'refuse une cible qui change silencieusement le passé : %s', defect => {
      const input = request(), current = physical({ hours: 12, empty: defect === 'forgottenFact', transform: state => {
        if (defect === 'otherScope') state.coverage.push({ ...state.coverage[0], id: 'other-scope', dependencyId: 'other' });
        if (defect === 'changedMass' && state.facts[0].kind !== 'condition') state.facts[0].quantity = { status: 'known', value: 40, unit: 'g' };
      } });
      if (defect === 'otherScope') current.prepared = buildBrewingObservedHopInput({ ...current.source,
        scope: { ...current.source.scope, dependencyIds: ['other'] }, bindings: [] });
      if (defect === 'changedBinding') current.prepared = buildBrewingObservedHopInput({ ...current.source,
        bindings: current.source.bindings.map(row => ({ ...row, temperatureC: 25 })) });
      expect(current.prepared.status).toBe('available');
      input.targetInput = buildBrewingObservationTarget({ current: current.prepared, future: [],
        contactTargets: current.prepared.used.map(row => ({ additionId: row.additionId, contactHours: 24, explanation: 'Contact cible.' })),
        horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Horizon futur valide.' }, explanation: 'Contre-exemple du préfixe.' });
      const result = projectBrewingObservation(input, data).frames[0];
      expect(result.status).toBe('unknown'); expect(result.delta).toBeNull();
      expect(result.issues.map(row => row.code)).toContain(defect === 'otherScope' ? 'physicalScopeMismatch'
        : defect === 'forgottenFact' ? 'realizedPrefixMissing' : defect === 'changedMass' ? 'realizedPrefixChanged' : 'realizedBindingChanged');
    });
  it('accepte le même passé avec provenance corrigée et continuité prolongée', () => {
    const input = request(), current = physical({ hours: 12, transform: state => {
      const prior = state.facts[0];
      state.facts.push({ ...structuredClone(prior), version: 2, supersedesVersion: 1, recordedAt: observedScenarioAt(12),
        provenance: { ...prior.provenance, reference: 'fixture://later-transcription', description: 'Métadonnées corrigées, même fait physique.' } });
    } });
    expect(current.prepared.status).toBe('available');
    input.targetInput = buildBrewingObservationTarget({ current: current.prepared, future: [],
      contactTargets: [{ additionId: 'realized-a', contactHours: 24, explanation: 'Contact cible conservé.' }],
      horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Horizon conservé.' }, explanation: 'Même réalisé, autre transcription.' });
    const result = projectBrewingObservation(input, data).frames[0];
    expect(result.issues).toEqual([]); expect(result.status).toBe('projected');
  });
  it.each([3, 8])('distingue un ajout à%sh découvert après coup d’un ajout postérieur à l’état dégusté', addedAt => {
    const input = request(), current = physical({ hours: 12, transform: state => {
      const fact = structuredClone(state.facts[0]), contact = structuredClone(state.contacts[0]);
      fact.id = 'addition-b'; fact.effectiveAt = observedScenarioAt(addedAt); fact.recordedAt = observedScenarioAt(12);
      if (fact.kind !== 'condition') fact.quantity = { status: 'known', value: 10, unit: 'g' };
      contact.id = 'contact-b'; contact.started.effectiveAt = observedScenarioAt(addedAt); contact.started.recordedAt = observedScenarioAt(12);
      state.facts.push(fact); state.contacts.push(contact);
    } });
    current.prepared = buildBrewingObservedHopInput({ ...current.source, bindings: [...current.source.bindings,
      { ...current.source.bindings[0], additionId: 'realized-b',
        factReference: current.state.factDispositions.find(row => row.id === 'addition-b')!.reference,
        contactReference: current.state.contactStates.find(row => row.id === 'contact-b')!.reference }] });
    expect(current.prepared.status).toBe('available');
    input.targetInput = buildBrewingObservationTarget({ current: current.prepared, future: [],
      contactTargets: current.prepared.used.map(row => ({ additionId: row.additionId, contactHours: row.elapsedHours + 12, explanation: 'Jusqu’au même horizon24h.' })),
      horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Horizon après les deux ajouts.' }, explanation: 'Ordre physique et connaissance distincts.' });
    const result = projectBrewingObservation(input, data).frames[0];
    if (addedAt < 6) {
      expect(result.status).toBe('unknown'); expect(result.issues.map(row => row.code)).toContain('realizedPastDiscovered');
    } else {
      expect(result.status).toBe('projected'); expect(result.issues).toEqual([]);
      expect(result.modelPair?.candidates.map(row => row.inputSnapshot.additions.length)).toEqual([1, 2]);
    }
  });
  it.each(['instant', 'relative'] as const)('refuse un horizon %s antérieur à la note même si target.current est plus ancien', kind => {
    const input = request({ empty: true }), earlier = physical({ hours: 0, empty: true });
    input.targetInput = buildBrewingObservationTarget({ current: earlier.prepared,
      future: [{ id: 'first-before-note', materialId: earlier.material.id, timing: 'postFermentation', contactHours: 3,
        temperatureC: 15, matrixId: null, quantity: { kind: 'remaining', grams: 80 }, explanation: 'Futur du mauvais état courant.' }], contactTargets: [],
      horizon: kind === 'instant' ? { kind, at: observedScenarioAt(3), explanation: 'Avant dégustation à6h.' }
        : { kind, eventReference: earlier.state.physicalStateReference, durationHours: 3, explanation: 'Avant dégustation à6h.' },
      explanation: 'La cible passe son propre validateur, pas celui de la relation à la note.' });
    expect(input.targetInput.status).toBe('available');
    const result = projectBrewingObservation(input, data).frames[0];
    expect(result.status).toBe('unknown'); expect(result.delta).toBeNull();
    expect(result.issues.map(row => row.code)).toContain('horizonBeforeObservation');
  });
  it.each([0, 2])('qualifie la borne d’un horizon après événement futur pour un échantillon dégusté après prélèvement (%sh)', durationHours => {
    const input = request({ empty: true }), beer = input.anchor.observedState;
    const identity = { id: 'delayed-sample', version: '1', contentReference: 'fixture:delayed-sample' };
    const provenance = { kind: 'fixture', reference: 'fixture://preserved-sample', description: 'Continuité explicitement attestée.' };
    const state = resolveBrewingObservedState({ format: 'brewing-observed-state-input-v1',
      subject: { kind: 'sample', identity, sourceBeer: beer.subject.identity,
        collection: { effectiveAt: observedScenarioAt(6), recordedAt: observedScenarioAt(6), provenance } },
      asOf: observedScenarioAt(6), knowledgeAsOf: observedScenarioAt(7), knowledgeReference: beer.knowledgeReference,
      facts: beer.facts, contacts: beer.contacts, coverage: beer.coverage,
      sampleContinuity: [{ id: 'sample-preserved', version: 1, supersedesVersion: null, sampleReference: identity,
        fromAt: observedScenarioAt(6), throughAt: observedScenarioAt(7), recordedAt: observedScenarioAt(7), status: 'preserved', provenance }] });
    const note = structuredClone(input.anchor.observation); note.subject.id = identity.id; note.observedAt = observedScenarioAt(7);
    input.anchor = createBrewingObservationAnchor({ id: 'delayed-sample-anchor', observation: note, observedState: state,
      subjectRelation: 'sameSubject', explanation: 'Échantillon intact dégusté après prélèvement.', createdAt: observedScenarioAt(7), createdBy: actor });
    input.observedInput = buildBrewingObservedHopInput({ ...input.observedInput.source, state });
    const target = input.targetInput.source;
    input.targetInput = buildBrewingObservationTarget({ ...target,
      future: target.future.map(row => ({ ...row, contactHours: durationHours })),
      horizon: { kind: 'relative', eventReference: target.future[0].id, durationHours, explanation: 'Date du prochain ajout non encore fixée.' } });
    const result = projectBrewingObservation(input, data).frames[0];
    if (durationHours === 0) {
      expect(result.status).toBe('unknown'); expect(result.issues.map(row => row.code)).toContain('horizonOrderUnknown');
    } else {
      expect(result.status).toBe('projected'); expect(result.issues).toEqual([]);
    }
  });
  it('préserve le delta séparé sans stabilité adoptée et refuse de changer le type de note', () => {
    const input = request(); input.restStability = { status: 'notEstablished', explanation: 'Évolution du reste inconnue.', conditions: [] };
    const result = projectBrewingObservation(input, data).frames[0];
    expect(result.status).toBe('nonComparable'); expect(result.delta).toBeTypeOf('number'); expect(result.rawProjection).toBeNull();
    const withoutBridge = request(); delete withoutBridge.arithmetic.unitBridge;
    expect(projectBrewingObservation(withoutBridge, data).frames[0].status).toBe('nonComparable');
    expect(withoutBridge.anchor.observation.scale).toMatchObject({ metric: { kind: 'ordinalNote' } });
  });
  it('conserve un résultat hors échelle au lieu de le saturer', () => {
    const projection = projectBrewingObservation(request({ empty: true, note: 99 }), data);
    const result = projection.frames[0];
    expect(result.status).toBe('outOfDomain'); expect(result.rawProjection).toBeGreaterThan(100);
    const view = brewingObservationProjectionViewModel(projection);
    const target = view.comparison.dimensions.find(row => row.definition.contentReference === projection.requestSnapshot.arithmetic.definition.contentReference)!;
    expect(target.values.find(row => row.candidateId === view.series[0].candidateId)?.status).toBe('unknown');
    expect(view.results[0].frame.rawProjection).toBe(result.rawProjection);
  });
  it('ne prend pas l’état au prélèvement pour celui d’un échantillon changé avant la dégustation', () => {
    const input = request(), beer = input.anchor.observedState;
    const sample = { id: 'fixture-sample', version: '1', contentReference: 'fixture:sample' };
    const provenance = { kind: 'fixture', reference: 'fixture://changed-sample', description: 'Altération explicitement consignée avant dégustation.' };
    const state = resolveBrewingObservedState({ format: 'brewing-observed-state-input-v1',
      subject: { kind: 'sample', identity: sample, sourceBeer: beer.subject.identity,
        collection: { effectiveAt: observedScenarioAt(6), recordedAt: observedScenarioAt(6), provenance } },
      asOf: observedScenarioAt(6), knowledgeAsOf: observedScenarioAt(7), knowledgeReference: beer.knowledgeReference,
      facts: beer.facts, contacts: beer.contacts, coverage: beer.coverage,
      sampleContinuity: [{ id: 'sample-change', version: 1, supersedesVersion: null, sampleReference: sample,
        fromAt: observedScenarioAt(6), throughAt: observedScenarioAt(7), recordedAt: observedScenarioAt(7), status: 'changed', provenance }] });
    const observation = structuredClone(input.anchor.observation);
    observation.subject.id = sample.id; observation.observedAt = observedScenarioAt(7);
    input.anchor = createBrewingObservationAnchor({ id: 'changed-sample-anchor', observation, observedState: state,
      subjectRelation: 'sameSubject', explanation: 'Le verre est bien dégusté, mais après un changement documenté.', createdAt: observedScenarioAt(7), createdBy: actor });
    input.observedInput = buildBrewingObservedHopInput({ ...input.observedInput.source, state });
    const result = projectBrewingObservation(input, data);
    expect(result.anchorApplicability.status).toBe('historical');
    expect(result.frames[0].status).toBe('nonComparable');
    expect(result.frames[0].delta).toBeTypeOf('number');
    expect(result.frames[0].rawProjection).toBeNull();
    expect(result.frames[0].issues.map(row => row.code)).toContain('anchorNotApplicable');
  });
  it('un décalage de fuseau ne prouve pas la continuité entre prélèvement et dégustation', () => {
    const input = request(), beer = input.anchor.observedState;
    const sample = { id: 'offset-sample', version: '1', contentReference: 'fixture:offset-sample' };
    const collectedAt = '2026-10-02T08:00:00.000+02:00';
    const provenance = { kind: 'fixture', reference: 'fixture://offset-sample', description: 'Aucune continuité attestée.' };
    const state = resolveBrewingObservedState({ format: 'brewing-observed-state-input-v1',
      subject: { kind: 'sample', identity: sample, sourceBeer: beer.subject.identity,
        collection: { effectiveAt: collectedAt, recordedAt: observedScenarioAt(6), provenance } },
      asOf: collectedAt, knowledgeAsOf: observedScenarioAt(7), knowledgeReference: beer.knowledgeReference,
      facts: beer.facts, contacts: beer.contacts, coverage: beer.coverage, sampleContinuity: [] });
    const observation = structuredClone(input.anchor.observation);
    observation.subject.id = sample.id; observation.observedAt = observedScenarioAt(7);
    input.anchor = createBrewingObservationAnchor({ id: 'offset-sample-anchor', observation, observedState: state,
      subjectRelation: 'sameSubject', explanation: 'Note une heure après prélèvement.', createdAt: observedScenarioAt(7), createdBy: actor });
    input.observedInput = buildBrewingObservedHopInput({ ...input.observedInput.source, state });
    const result = projectBrewingObservation(input, data);
    expect(result.anchorApplicability.status).toBe('continuityUnknown');
    expect(result.frames[0].status).toBe('nonComparable'); expect(result.frames[0].rawProjection).toBeNull();
    expect(result.requestSnapshot.anchor.observedState.asOf).toBe(collectedAt);
  });
  it('isole les mêmes identifiants locaux d’un autre sujet jusque dans le vrai modèle', () => {
    const baseline = request(), expected = projectBrewingObservation(baseline, data);
    const current = physical({ transform: state => {
      const other = { id: 'foreign-beer', version: '1', contentReference: 'fixture:foreign-beer' };
      const fact = structuredClone(state.facts[0]); fact.subjectReference = other;
      if (fact.kind !== 'condition') fact.quantity = { status: 'known', value: 999, unit: 'g' };
      state.facts.unshift(fact);
      state.contacts.unshift({ ...structuredClone(state.contacts[0]), subjectReference: other });
      state.coverage.unshift({ ...structuredClone(state.coverage[0]), subjectReference: other });
    } });
    expect(current.state.physicalStateReference).toBe(baseline.anchor.observedState.physicalStateReference);
    expect(current.prepared.status).toBe('available'); expect(current.prepared.used[0].grams).toBe(80);
    baseline.anchor = createBrewingObservationAnchor({ id: 'foreign-preserved-anchor', observation: baseline.anchor.observation,
      observedState: current.state, subjectRelation: 'sameSubject', explanation: 'Les autres sujets sont conservés et isolés.',
      createdAt: current.state.asOf, createdBy: actor });
    baseline.observedInput = current.prepared;
    baseline.targetInput = buildBrewingObservationTarget({ ...baseline.targetInput.source, current: current.prepared });
    const result = projectBrewingObservation(baseline, data);
    expect(result.frames[0].status).toBe('projected'); expect(result.frames[0].rawProjection).toBe(expected.frames[0].rawProjection);
    expect(result.requestSnapshot.observedInput.source.state.facts).toHaveLength(2);
  });
  it('partage exactement les valeurs et sépare note ordinale et interprétation dans le DTO', () => {
    const projection = projectBrewingObservation(request(), data), view = brewingObservationProjectionViewModel(projection);
    expect(view.observation).toEqual(projection.requestSnapshot.anchor.observation);
    expect(view.comparison.dimensions).toHaveLength(2);
    const target = view.comparison.dimensions.find(row => row.definition.contentReference === projection.requestSnapshot.arithmetic.definition.contentReference)!;
    expect(target.values.find(row => row.candidateId === 'working-anchor')).toMatchObject({ status: 'hypothetical', value: 37 });
    expect(target.values.find(row => row.candidateId === view.series[0].candidateId)).toMatchObject({ status: 'hypothetical', value: projection.frames[0].rawProjection });
    expect(view.results[0].frame.delta).toBe(projection.frames[0].delta);
  });
  it('relit l’ancienne archive après nouveau cadre sans moteur ni heure courante', () => {
    const input = request(), old = projectBrewingObservation(input, data), archive = archiveBrewingObservationProjection(old);
    const revised = reviseBrewingNuancePlan(plan, { parameterChoices: [...plan.parameterChoices, { id: 'slower-contact',
      target: { kind: 'timing', timing: 'postFermentation', parameter: 'extractionHours' }, range: { min: 2, max: 12 }, central: 12,
      origin: 'modelHypothesis', explanation: 'Autre scénario explicitement choisi, pas une mesure.', sourceRefs: [observedScenarioSource] }],
      proposedAt: observedScenarioAt(7), proposedBy: actor, explanation: 'Révision de sensibilité.' });
    input.frames = [{ id: 'theta-revised', name: 'Autre cadre', plan: adoptBrewingNuancePlan(revised,
      { adoptedAt: observedScenarioAt(7), adoptedBy: actor, reason: 'Cadre de fixture distinct.' }) }];
    const next = projectBrewingObservation(input, data);
    expect(next.reference).not.toBe(old.reference);
    const engine = vi.spyOn(nuances, 'projectBrewingNuances').mockImplementation(() => { throw Error('Pas de moteur à la relecture'); });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('Pas d’horloge à la relecture'); });
    try { expect(readBrewingObservationProjectionArchive(archive)).toEqual({ status: 'readOnly', projection: old }); }
    finally { engine.mockRestore(); clock.mockRestore(); }
  });
  it('projette un avancement documenté à 4,5 jours sans attendre la cible à cinq jours', () => {
    const oldRequest = request({ hours: 96, unchanged: true });
    oldRequest.targetInput = buildBrewingObservationTarget({ current: oldRequest.observedInput, future: [],
      contactTargets: [{ additionId: 'realized-a', contactHours: 120, explanation: 'Contact cible à cinq jours.' }],
      horizon: { kind: 'instant', at: observedScenarioAt(120), explanation: 'Prévision à cinq jours.' }, explanation: 'Question ancienne figée.' });
    const oldProjection = projectBrewingObservation(oldRequest, data), archive = archiveBrewingObservationProjection(oldProjection);
    const intermediate = physical({ hours: 108 });
    const currentRequest = { ...oldRequest, id: 'current-at-four-and-half-days', targetInput: buildBrewingObservationTarget({
      current: intermediate.prepared, future: [], contactTargets: [], horizon: { kind: 'instant', at: observedScenarioAt(108), explanation: 'État intermédiaire documenté.' },
      explanation: 'Projection au courant, distincte de la question à cinq jours.' }) };
    const result = projectBrewingObservation(currentRequest, data);
    expect(result.frames[0].status).toBe('projected');
    expect(result.frames[0].delta).toBeGreaterThan(0);
    expect(result.frames[0].modelPair?.candidates.map(row => row.inputSnapshot.additions[0].triplet.contactHours)).toEqual([96, 108]);
    expect(result.currentApplicability.status).toBe('historical');
    expect(readBrewingObservationProjectionArchive(archive)).toEqual({ status: 'readOnly', projection: oldProjection });
    expect(oldProjection.requestSnapshot.targetInput.source.horizon).toMatchObject({ at: observedScenarioAt(120) });
    const unexplained = physical({ hours: 120, attestedThroughHours: 108 });
    const noEvidence = projectBrewingObservation({ ...oldRequest, id: 'day-only-without-contact-evidence', targetInput: buildBrewingObservationTarget({
      current: unexplained.prepared, future: [], contactTargets: [], horizon: { kind: 'instant', at: observedScenarioAt(120), explanation: 'Jour avancé seul.' }, explanation: 'Pas d’attestation après4,5jours.' }) }, data);
    expect(noEvidence.frames[0].status).toBe('unknown');
    expect(noEvidence.frames[0].delta).toBeNull();
    expect(noEvidence.currentApplicability.status).toBe('continuityUnknown');
  });
  it('le journal choisit la nouvelle note, projette le contact restant et préserve l’archive après correction ancienne', () => {
    const first = request();
    const old = projectBrewingObservation(first, data), archive = archiveBrewingObservationProjection(old);
    const current = physical({ hours: 12 });
    const note = structuredClone(first.anchor.observation);
    note.id = 'new-note-during-contact'; note.observedAt = current.state.asOf;
    note.sense = { kind: 'sensoryRating', value: 50 }; note.originalText = 'Nouvelle note synthétique à douze heures.';
    const anchor = createBrewingObservationAnchor({ id: 'new-anchor', observation: note, observedState: current.state,
      subjectRelation: 'sameSubject', explanation: 'Nouvelle observation, pas correction de la première.', createdAt: current.state.asOf, createdBy: actor,
      previousAnchorReference: first.anchor.reference });
    const opened = openBrewingReferenceContext({ ownerKey: 'fixture-owner', contextId: 'fixture-note-history', commandId: 'open',
      recordedAt: observedScenarioAt(6), context: { programReference: null, past: { status: 'unknown' }, details: {} } });
    let record = opened.record;
    const events: BrewingReferenceEvent[] = [opened.event];
    for (const observation of [first.anchor.observation, note]) {
      const recorded = applyBrewingReferenceCommand(record, { ownerKey: record.ownerKey, contextId: record.contextId,
        commandId: `record-${observation.id}`, expectedRevision: record.revision, recordedAt: observation.observedAt,
        kind: 'observationRecorded', payload: { observation } }, events);
      record = recorded.record; events.push(recorded.event);
    }
    const readJournal = () => {
      const journal = readBrewingReferenceRecord(record, events);
      if ('status' in journal) throw Error('Journal de fixture illisible.');
      return journal;
    };
    const select = () => resolveCurrentBrewingObservation({ journal: readJournal(), anchors: [first.anchor, anchor],
      currentState: current.state, requestedDimension: note.dimension, requiredDependencyIds: current.prepared.source.scope.dependencyIds });
    const selected = select().selected!;
    expect(selected.observation.id).toBe(note.id); expect(selected.anchor?.reference).toBe(anchor.reference);
    const next = projectBrewingObservation({ ...first, id: 'remaining-contact-after-new-note', anchor: selected.anchor!, observedInput: current.prepared,
      targetInput: buildBrewingObservationTarget({ current: current.prepared, future: [],
        contactTargets: [{ additionId: 'realized-a', contactHours: 24, explanation: 'Contact restant jusqu’à24h.' }],
        horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Même horizon final.' }, explanation: 'Depuis la nouvelle note.' }) }, data);
    expect(next.frames[0].status).toBe('projected');
    expect(next.frames[0].modelPair?.candidates.map(row => row.inputSnapshot.additions[0].triplet.contactHours)).toEqual([12, 24]);
    expect(next.frames[0].rawProjection).toBe(50 + next.frames[0].delta!);
    expect(next.frames[0].delta).toBeLessThan(old.frames[0].delta!);
    const correction = createBrewingReferenceObservationCorrectionCommand({ journal: readJournal(),
      expectedObservation: { id: first.anchor.observation.id, version: 1, contentReference: brewingObservationFactReference(first.anchor.observation) },
      commandId: 'correct-old-note', recordedAt: observedScenarioAt(13), correctedBy: { label: 'Correcteur fixture' },
      reason: 'Correction de transcription rétrospective, sans nouvelle dégustation.', changes: { value: 39 } });
    const corrected = applyBrewingReferenceCommand(record, correction, events);
    record = corrected.record; events.push(corrected.event);
    const after = select();
    expect(after.selected).toEqual(selected);
    expect(after.candidates.find(row => row.observation.id === first.anchor.observation.id)?.observation).toMatchObject({
      version: 2, observedAt: first.anchor.observation.observedAt, origin: first.anchor.observation.origin,
      subject: first.anchor.observation.subject, context: first.anchor.observation.context, sense: { kind: 'sensoryRating', value: 39 } });
    expect(readBrewingObservationProjectionArchive(archive)).toEqual({ status: 'readOnly', projection: old });
  });
  it('traverse la vraie forme BrewerContext et son snapshot sans emprunter recette mutable, masse prévue ou durée cible', () => {
    const variety = data.varieties.find(row => row.id === 'hopsteiner-eld')!;
    const material = { id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety };
    const recipe = { capturedAt: observedScenarioAt(-1), sourceRecipeId: 'fixture-source-recipe', name: 'Recette figée', style: '', volumeL: 20,
      fermentables: [], totalGristKg: 0, hops: [{ name: 'Libellé libre sans résolution nominale', hopVarietyId: variety.id, weightG: 200,
        alpha: 5, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 15 }],
      yeast: { name: 'Culture déclarée de travail', hopIndexId: 'wyeast-1728' }, fermentation: [], steps: [], notes: [] };
    const context = { now: Date.parse(observedScenarioAt(7)), phase: 'fixture', batch: { id: 'fixture-canonical-batch', status: 'fermentation', recipeSnapshot: recipe },
      recipe: { ...recipe, volumeL: 999, hops: [{ ...recipe.hops[0], weightG: 999 }] },
      journal: { steps: [], currentIndex: 0, additions: { 'hop-0': { amount: 80, unit: 'g', doneAt: Date.parse(observedScenarioAt(0)) } } },
      inventory: [], material: [], waterSources: [], provenance: [], hopIndex: { ...data, predictions: [], tastings: [], truncated: [] } } as unknown as BrewerContext;
    const provenance = { kind: 'fixtureAttestation', reference: 'fixture://canonical-contact', description: 'Attestation synthétique explicite.' };
    const prepared = prepareBrewingObservedContext(context, { source: { kind: 'batch', id: 'fixture-canonical-batch' },
      asOf: observedScenarioAt(6), knowledgeAsOf: observedScenarioAt(7), materials: [material],
      contactAttestations: [{ additionKey: 'hop-0', kind: 'activeThrough', epistemicStatus: 'reported',
        evidence: { effectiveAt: observedScenarioAt(6), recordedAt: observedScenarioAt(7), provenance } }],
      coverageAttestations: ['hopMaterials', 'hopContact'].map(dependencyId => ({ id: `coverage-${dependencyId}`, version: 1,
        supersedesVersion: null, dependencyId, fromAt: observedScenarioAt(0), throughAt: observedScenarioAt(6), status: 'complete', recordedAt: observedScenarioAt(7), provenance })),
      hopScope: { id: 'canonical-hop-scope', dependencyIds: ['hopMaterials', 'hopContact'], fromAt: observedScenarioAt(0), explanation: 'Programme connu de fixture.' } });
    expect(prepared.status).toBe('prepared'); expect(prepared.observedHopInput?.status).toBe('available');
    expect(prepared.observedHopInput?.input).toMatchObject({ volumeL: 20, yeastId: 'wyeast-1728',
      additions: [{ triplet: { doseGL: 4, contactHours: 6 } }] });
    const input = request(), note = structuredClone(input.anchor.observation);
    note.subject.id = prepared.state!.subject.identity.id;
    input.anchor = createBrewingObservationAnchor({ id: 'source-canonical-anchor', observation: note, observedState: prepared.state!,
      subjectRelation: 'sameSubject', explanation: 'Identité issue du batch canonique.', createdAt: observedScenarioAt(7), createdBy: actor });
    input.observedInput = prepared.observedHopInput!;
    input.targetInput = buildBrewingObservationTarget({ current: prepared.observedHopInput!, future: [],
      contactTargets: [{ additionId: prepared.observedHopInput!.used[0].additionId, contactHours: 24, explanation: 'Horizon hypothétique explicite.' }],
      horizon: { kind: 'instant', at: observedScenarioAt(24), explanation: 'Contact évalué à24h.' }, explanation: 'Cible distincte des faits.' });
    const projection = projectBrewingObservation(input, data);
    expect(projection.frames[0].issues).toEqual([]); expect(projection.frames[0].status).toBe('projected');
    expect(projection.requestSnapshot.observedInput.source.state.facts[0].recordedAt).toBe(observedScenarioAt(7));
    expect(readBrewingObservationProjectionArchive(archiveBrewingObservationProjection(projection))).toEqual({ status: 'readOnly', projection });
  });
});
