import { describe, expect, it } from 'vitest';
import { openBrewingReferenceContext, applyBrewingReferenceCommand, readBrewingReferenceRecord, getBrewingReferenceProjection,
  brewingReferenceVersionContentReference, type BrewingReferenceEventV1, type BrewingReferenceVersionV1 } from '../../src/domain/brewingReference';
import { createBrewingSensoryDefinitionReference } from '../../src/domain/brewingSensory';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { buildBrewingScenarioRequest, simulateBrewingScenario, brewingScenarioResultReference } from '../../src/domain/brewingScenario';
import { createBrewingScenarioDossier, readBrewingScenarioRecord } from '../../src/domain/brewingScenarioDossier';
import { proposeBrewingNuancePlans, adoptBrewingNuancePlan, projectBrewingNuances, brewingNuanceViewModel, readBrewingNuanceProjection } from '../../src/domain/brewingNuanceProjection';
import { brewingScenarioViewModel } from '../../src/domain/brewingScenarioTools';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { encodeBrewingScenarioArchive, decodeBrewingScenarioArchive } from '../../src/domain/brewingScenarioArchive';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';

const at = '2026-10-02T06:00:00.000Z', actor = { label: 'Fixture explicite' }, origin = { kind: 'userDeclaration', description: 'Saisie de fixture, aucune bière réelle.' };
const source = { title: 'Définition de fixture', author: 'Fixture', year: 2026, kind: 'judgment' as const, reference: 'fixture:sensory-definition' };
const dimension = { id: 'pear-fixture', version: '1', name: 'Poire', definition: 'Nuance de la fixture.', terms: ['pear', 'poire'], sourceRefs: [source] };
const metric = { id: 'personal-rating', version: '1', kind: 'ordinalNote' as const, name: 'Note déclarée', meaning: 'Échelle personnelle déclarée', unit: null, sourceRefs: [source] };
const scale = { id: 'personal-five', version: '1', metricRef: { id: metric.id, version: metric.version }, domain: { min: 0, max: 5 }, sourceRefs: [source] };

describe('Verticale métier NR avec sérialisation JSON de fixture', () => {
  it('garde observation avant référence, R1/R2, vraie projection et résultats exacts sans fabriquer de passé', async () => {
    const definition = createBrewingSensoryDefinitionReference(dimension, metric, scale);
    const opened = openBrewingReferenceContext({ ownerKey: 'fixture-owner', contextId: 'fixture-unresolved-past', commandId: 'open', recordedAt: at,
      context: { programReference: null, past: { status: 'unknown' }, details: { actualProcessStage: 'unknown' } } });
    let record = opened.record;
    const events: BrewingReferenceEventV1[] = [opened.event];
    const apply = (kind: any, payload: any, id: string) => {
      const result = applyBrewingReferenceCommand(record, { ownerKey: record.ownerKey, contextId: record.contextId,
        commandId: id, expectedRevision: record.revision, recordedAt: at, kind, payload }, events);
      record = result.record; if (!result.duplicate) events.push(result.event); return result;
    };
    const observed = { id: 'O1', version: 1, subject: { kind: 'beer', label: 'Bière inconnue de fixture' }, observedAt: '2026-10-01T17:00:00.000Z',
      author: actor, origin, originalText: 'Poire, note3/5.', dimension: { status: 'resolved', definition },
      scale: { status: 'known', metric, scale }, sense: { kind: 'sensoryRating', value: 3 }, comparison: { kind: 'absolute' }, context: {} };
    apply('observationRecorded', { observation: observed }, 'observe');
    const beforeCalculation = JSON.parse(JSON.stringify({ record, events }));
    const readBefore = readBrewingReferenceRecord(beforeCalculation.record, beforeCalculation.events);
    expect('status' in readBefore).toBe(false);
    if ('status' in readBefore) throw Error('Fixture illisible');
    expect(getBrewingReferenceProjection(readBefore).currentReference).toBeNull();
    expect(events.some(event => event.kind === 'j5ResultLinked')).toBe(false);
    const propose = (version: string, predecessor: any) => {
      const value = { id: 'working-reference', version, origin: { kind: 'hypothesis', description: 'Référence déclarée, pas observation.' }, hypotheses: ['Programme de travail fictif'],
        context: {}, author: actor, createdAt: at, predecessor, sensoryDefinitions: [definition], content: { purpose: 'comparison', version } };
      const reference: BrewingReferenceVersionV1 = { ...value, contentReference: brewingReferenceVersionContentReference(value) };
      apply('referenceProposed', { reference }, `propose-${version}`);
      const identity = { id: reference.id, version: reference.version, contentReference: reference.contentReference };
      apply('referenceAdopted', { reference: identity, adoptedBy: actor }, `adopt-${version}`);
      apply('interpretationLinked', { interpretation: { id: `interpret-${version}`, observationId: observed.id, observationVersion: observed.version,
        reference: identity, targetDefinition: definition, relation: 'interprétation ultérieure', reason: 'Comparer sous la référence de travail explicitement adoptée.',
        origin, author: actor, comparability: { kind: 'exact' } } }, `link-${version}`);
      return identity;
    };
    const r1 = propose('1', null);
    // An unavailable calculation is not an event: adoption and facts still survive serialization.
    expect(record.currentReference).toEqual(r1);
    const refs = await loadBrewingCatalogueReferences();
    const variety = refs.varieties.find(row => row.descriptions.some(description => /\bpear\b/i.test(description.text)))!;
    const data = { varieties: refs.varieties, lots: [], knowledge: [...refs.knowledge, testHopYeast] };
    const request = buildBrewingScenarioRequest({ scenarioId: 'fixture-derived-calculation', revision: 1,
      baseline: { kind: 'hypothetical', label: 'Programme explicitement déclaré, distinct du passé inconnu',
        input: { volumeL: 20, yeastId: testHopYeast.id, additions: [{ id: 'declared-hypothesis', name: 'Contact hypothétique',
          triplet: { ...testHopTriplet, varietyId: variety.id } }], fermentation: [] } } });
    const scenario = simulateBrewingScenario(request, { engineData: data, materials: [] });
    const saved = createBrewingScenarioDossier({ ownerKey: record.ownerKey, scenarioId: scenario.scenarioId, eventId: 'saved-scenario', recordedAt: at, result: scenario });
    // JSON fixture transport only, not a browser/Dexie or server receipt proof.
    const savedFixture = decodeBrewingScenarioArchive(encodeBrewingScenarioArchive(saved));
    expect(readBrewingScenarioRecord(savedFixture.dossier, [savedFixture.event])).toHaveProperty('currentSnapshot.result.reference', scenario.reference);
    apply('j5ResultLinked', { link: { id: 'calculation-link', reference: r1,
      result: { scenarioId: scenario.scenarioId, resultId: scenario.reference, resultRevision: scenario.revision,
        resultReference: scenario.reference, snapshotReference: saved.event.payload.snapshot.reference },
      receipt: { status: 'local', receiptId: saved.event.eventId, localRecordId: 'fixture-json-only', receivedAt: at } } }, 'link-calculation');
    const model = refs.knowledge.find(row => row.kind === 'extrapolation' && row.enabled)!;
    if (model.kind !== 'extrapolation') throw Error('Modèle absent');
    const plan = proposeBrewingNuancePlans({ planId: 'fixture-fine', dimensions: [dimension], sourceModel: model,
      axes: refs.knowledge.filter((row): row is HopAxis => row.kind === 'axis'), proposedAt: at, proposedBy: { origin: 'model', name: 'Fixture de proposition' } })[1];
    const adopted = adoptBrewingNuancePlan(plan, { adoptedAt: at, adoptedBy: { origin: 'user', name: actor.label }, reason: 'Adoption explicite de fixture.' });
    const projection = projectBrewingNuances(adopted, [{ id: 'candidate-r1', name: 'Scénario sous R1', input: scenario.baseline.input, sourceReference: scenario.baseline.reference }], data);
    const view = brewingNuanceViewModel(projection, { context: { id: record.contextId, version: '1', kind: 'referenceContext',
      contentReference: opened.record.reference, label: 'Passé toujours inconnu', sourceRefs: [] },
      reference: { ...r1, kind: 'adoptedHypothesis', sourceRefs: [] } });
    expect(view.dimensions[0].values[0].status).toBe('hypothetical');
    const r2 = propose('2', r1);
    const restored = decodeBrewingScenarioArchive(encodeBrewingScenarioArchive({ record, events, projection, view }));
    const read = readBrewingReferenceRecord(restored.record, restored.events);
    if ('status' in read) throw Error('Fixture illisible');
    const final = getBrewingReferenceProjection(read);
    expect(final.currentReference).toEqual(r2);
    expect(final.context.past).toEqual({ status: 'unknown' });
    expect(final.observations[0]).toEqual(observed);
    expect(final.interpretations.map(row => row.reference)).toEqual([r1, r2]);
    expect(readBrewingNuanceProjection(restored.projection)).toEqual(projection);
    expect(restored.view).toEqual(view);
  });

  it('le VM J5 expose les versions et refuse une même identité avec deux définitions', () => {
    const data = testHopData();
    const request = buildBrewingScenarioRequest({ scenarioId: 'fixture-axis-versions', revision: 1,
      baseline: { kind: 'hypothetical', label: 'Programme de fixture', input: { volumeL: 20, yeastId: testHopYeast.id,
        additions: [{ id: 'hop', name: 'Contact', triplet: testHopTriplet }], fermentation: [] } } });
    request.branches = [{ id: 'other', label: 'Même entrée', assumptions: [] }];
    const result = simulateBrewingScenario(request, { engineData: data, materials: [] });
    const view = brewingScenarioViewModel(result);
    expect(view.axes[0].version).toBe('test-1');
    expect(view.axes[0].definitionReference).toContain('sha256:');
    const branch = result.branches[0];
    (branch.dependencySnapshot.engineData.knowledge.find(row => row.kind === 'axis') as HopAxis).version = 'other-version';
    const { reference: _dependencyReference, ...dependency } = branch.dependencySnapshot;
    branch.dependencySnapshot.reference = hopAdviceContentReference('brewing-scenario-dependencies-v1', dependency);
    const { reference: _branchReference, ...branchBody } = branch;
    branch.reference = hopAdviceContentReference('brewing-scenario-branch-v1', branchBody);
    result.reference = brewingScenarioResultReference(result);
    expect(() => brewingScenarioViewModel(result)).toThrow(/incompatibles/);
  });
});
