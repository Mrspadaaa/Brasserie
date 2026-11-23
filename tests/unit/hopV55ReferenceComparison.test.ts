import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopAxis, HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import {
  applyBrewingReferenceCommand,
  brewingReferenceVersionContentReference,
  openBrewingReferenceContext,
  type BrewingReferenceCommandInput,
  type BrewingReferenceEvent,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceVersionV1,
  type JsonValue,
} from '../../src/domain/brewingReference';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryComparisonContext, type BrewingSensoryComparisonReference,
  type BrewingSensoryDefinitionReference, type BrewingSensoryDimension } from '../../src/domain/brewingSensory';
import { buildBrewingScenarioRequest, simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { createBrewingScenarioDossier, readBrewingScenarioRecord } from '../../src/domain/brewingScenarioDossier';
import * as recipePrediction from '../../functions/src/hopRecipePrediction';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';
import { hopTestSource } from '../fixtures/hopIndex';
import { adoptBrewingNuancePlan, projectBrewingNuances, proposeBrewingNuancePlans } from '../../src/domain/brewingNuanceProjection';
import { createHopV55ReferenceComparison, readHopV55ReferenceComparison, type HopV55ReferenceComparisonInput } from '../../src/services/hopV55/referenceComparison';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import knowledgeBootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import modelPack from '../../src/data/hopExtrapolationBootstrap.json';

afterEach(() => vi.restoreAllMocks());

const at = '2026-10-02T06:00:00.000Z';
const actor = { id: 'fixture-owner', label: 'Fixture de test' };

function testData(includeModel = true): { engineData: HopEngineData; material: HopDecisionMaterial; axis: HopAxis } {
  const engineData = testHopData();
  const axis = engineData.knowledge.find((row): row is HopAxis => row.kind === 'axis')!;
  axis.scale = { min: 0, max: 100 };
  axis.lowMax = 30;
  axis.mediumMax = 70;
  if (!includeModel) engineData.knowledge = engineData.knowledge.filter(row => row.kind !== 'model');
  const variety = engineData.varieties[0];
  return { engineData, axis, material: { id: 'material-test-variety', name: variety.name, form: variety.form, variety } };
}

function input(doseGL: number, patch: Partial<HopRecipeInput['additions'][number]['triplet']> = {}): HopRecipeInput {
  const triplet = { ...testHopTriplet, doseGL, ...patch };
  return { volumeL: 20, yeastId: testHopYeast.id,
    additions: [{ id: 'addition-1', name: 'Houblon témoin', triplet }],
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 7 }] };
}

function createScenario(data = testData()) {
  const baseInput = input(4, { timing: 'fermentation', contactHours: 48, temperatureC: 20 });
  const otherInput = input(3.5, { timing: 'postFermentation', contactHours: 24, temperatureC: 18 });
  const request = buildBrewingScenarioRequest({
    scenarioId: 'r17-reference-fixture', revision: 1,
    baseline: { kind: 'hypothetical', label: 'Base J5 conservée', input: baseInput, materials: { hops: [data.material] } }
  });
  request.branches.push({ id: 'option-a', label: 'Option A archivée', input: otherInput, assumptions: [], materials: { hops: [data.material] } });
  const result = simulateBrewingScenario(request, { engineData: data.engineData, materials: [data.material] });
  const created = createBrewingScenarioDossier({ ownerKey: 'fixture-owner', scenarioId: result.scenarioId, eventId: 'save-j5-r1', recordedAt: at, result });
  const read = readBrewingScenarioRecord(created.dossier, [created.event]);
  if ('status' in read) throw new Error('Fixture de scénario J5 illisible.');
  return { result, record: read, snapshotReference: read.currentSnapshot.reference, baseInput, otherInput, data };
}

function panelDefinition(axis: HopAxis): BrewingSensoryDefinitionReference {
  const dimension = { id: axis.id, version: axis.version, name: axis.name, definition: axis.description, sourceRefs: [axis.source] };
  const metric = { id: 'panel-note', version: '2015', kind: 'ordinalNote' as const, name: 'Note de panel',
    meaning: 'Intensité de dégustation publiée.', unit: 'points', sourceRefs: [hopTestSource] };
  const scale = { id: 'panel-0-15', version: '2015', metricRef: { id: metric.id, version: metric.version },
    domain: { min: 0, max: 15 }, sourceRefs: [hopTestSource] };
  return createBrewingSensoryDefinitionReference(dimension, metric, scale);
}

function createReferenceJournal(axis: HopAxis, referenceVarietyId = 'test-variety', extraDefinitions: BrewingSensoryDefinitionReference[] = [], extraHypotheses: string[] = []) {
  const definition = panelDefinition(axis);
  const opened = openBrewingReferenceContext({ ownerKey: 'fixture-owner', contextId: 'hop-v55:fixture-workspace', commandId: 'context-open', recordedAt: at,
    context: { programReference: null, past: { status: 'unknown' }, details: { source: 'test fixture' } } });
  let record = opened.record;
  const events: BrewingReferenceEvent[] = [opened.event];
  const references = new Map<string, BrewingReferenceIdentityV1>();
  const append = (kind: string, payload: any, commandId: string) => {
    const result = applyBrewingReferenceCommand(record, { ownerKey: record.ownerKey, contextId: record.contextId, commandId,
      expectedRevision: record.revision, recordedAt: at, kind, payload } as any, events);
    record = result.record;
    if (!result.duplicate) events.push(result.event);
  };
  const proposeAndAdopt = (version: string, predecessor: BrewingReferenceIdentityV1 | null, doseGL: number) => {
    const declaredInput = input(doseGL, { varietyId: referenceVarietyId, timing: 'fermentation', contactHours: 48, temperatureC: 20 });
    const baseline = { kind: 'hypothetical' as const, label: `Baseline R${version}`, input: declaredInput,
      materials: { hops: [{ id: 'material-test-variety', name: 'Variété témoin', form: 'pelletT90' as const,
        variety: testHopData().varieties[0] }] } };
    const content = JSON.parse(JSON.stringify({ label: `Référence R${version}`, baseline })) as Record<string, JsonValue>;
    const body = {
      id: 'fixture-adopted-reference', version,
      origin: { kind: 'userDeclaration', description: `Référence déclarée ${version}.` },
      hypotheses: [`Baseline explicitement adopté ${version}.`, ...extraHypotheses], context: {}, author: actor, createdAt: at, predecessor,
      sensoryDefinitions: [definition, ...extraDefinitions], content,
    };
    const reference: BrewingReferenceVersionV1 = { ...body, contentReference: brewingReferenceVersionContentReference(body) };
    append('referenceProposed', { reference }, `propose-${version}`);
    const identity = { id: reference.id, version: reference.version, contentReference: reference.contentReference };
    append('referenceAdopted', { reference: identity, adoptedBy: actor }, `adopt-${version}`);
    references.set(version, identity);
    return identity;
  };
  const r1 = proposeAndAdopt('1', null, 3.86);
  const r2 = proposeAndAdopt('2', r1, 4.5);
  return { record, events, references, r1, r2, definition };
}

function activateReference(journal: ReturnType<typeof createReferenceJournal>, reference: BrewingReferenceIdentityV1) {
  const command: BrewingReferenceCommandInput<'referenceActivated'> = {
    ownerKey: journal.record.ownerKey,
    contextId: journal.record.contextId,
    commandId: 'activate-archived-r1',
    expectedRevision: journal.record.revision,
    recordedAt: '2026-10-02T06:01:00.000Z',
    kind: 'referenceActivated',
    payload: { reference: structuredClone(reference), activatedBy: actor, reason: 'Lecture d’une version déjà adoptée.' },
  };
  const applied = applyBrewingReferenceCommand(journal.record, command, journal.events);
  return { ...journal, record: applied.record, events: applied.duplicate ? journal.events : [...journal.events, applied.event] };
}

function serviceInput(
  scenario: ReturnType<typeof createScenario>,
  journal: ReturnType<typeof createReferenceJournal>,
  reference: BrewingReferenceIdentityV1,
  overrides: Partial<HopV55ReferenceComparisonInput['selection']> = {}
): HopV55ReferenceComparisonInput {
  return { scenarioRecord: scenario.record, snapshotReference: scenario.snapshotReference,
    referenceJournal: { record: journal.record, events: journal.events }, adoptedReference: reference,
    selection: { candidateIds: ['baseline', 'option-a', 'adopted-reference'], dimensionIds: [scenario.data.axis.id], preferredCandidateId: 'option-a', ...overrides } };
}

describe('Comparaison de référence adoptée au snapshot J5', () => {
  it('R1 → R2 → retour garde les mêmes séries, sources, opérations et sélection', () => {
    const scenario = createScenario();
    const journal = createReferenceJournal(scenario.data.axis);
    const beforeScenario = structuredClone(scenario.record);
    const beforeJournal = structuredClone({ record: journal.record, events: journal.events });
    const beforePredictions = [scenario.result.baseline, ...scenario.result.branches].map(branch => structuredClone({
      id: branch.id, reference: branch.reference, input: branch.input, program: branch.program, profile: branch.hopPrediction.overall.profile
    }));
    const selected = serviceInput(scenario, journal, journal.r1);
    const r1 = createHopV55ReferenceComparison(selected);
    const oldDto = structuredClone(r1);
    const predictor = vi.spyOn(recipePrediction, 'predictHopRecipe');

    const r2 = createHopV55ReferenceComparison(serviceInput(scenario, journal, journal.r2));
    expect(predictor).toHaveBeenCalledTimes(1); // seule la nouvelle baseline R2 est calculée
    expect(r1).toEqual(oldDto);
    expect(r1.reference.version).toBe('1');
    expect(r2.reference.version).toBe('2');
    expect(r1.source.sourceFingerprint).toBe(r2.source.sourceFingerprint);
    expect(r1.selection).toEqual(r2.selection);
    expect(r1.comparison.candidateOrder).toEqual(r2.comparison.candidateOrder);
    expect(r1.comparison.dimensionOrder).toEqual(r2.comparison.dimensionOrder);
    expect(r1.series.map(row => row.candidateId)).toEqual(['baseline', 'option-a', 'adopted-reference']);
    expect(r1.series[0].role).toBe('j5Baseline');
    expect(r1.series[1].role).toBe('j5Branch');
    expect(r1.selection.preferredCandidateId).toBe('option-a');
    expect(r1.archive.scenarioRecord.events.filter(event => event.kind === 'branchPreferred')).toHaveLength(0);
    expect(r1.archive.scenarioRecord.snapshots.find(snapshot => snapshot.reference === scenario.snapshotReference)?.result.baseline.input).toEqual(scenario.baseInput);
    expect(r1.archive.scenarioRecord.snapshots.find(snapshot => snapshot.reference === scenario.snapshotReference)?.result.branches[0].input).toEqual(scenario.otherInput);
    expect([scenario.result.baseline, ...scenario.result.branches].map(branch => ({
      id: branch.id, reference: branch.reference, input: branch.input, program: branch.program, profile: branch.hopPrediction.overall.profile
    }))).toEqual(beforePredictions);
    expect(scenario.record).toEqual(beforeScenario);
    expect(journal).toMatchObject(beforeJournal);

    const j5Group = r1.comparison.dimensions.find(row => row.definition.metric?.kind === 'modelIndex')!;
    expect(j5Group.definition.metric?.unit).toBe('axisScale');
    const exactJ5Values = j5Group.values.filter(value => value.candidateId !== 'adopted-reference');
    const r2Group = r2.comparison.dimensions.find(row => row.referenceGroupId === j5Group.referenceGroupId)!;
    expect(r2Group.values.filter(value => value.candidateId !== 'adopted-reference')).toEqual(exactJ5Values);
    const panelGroup = r1.comparison.dimensions.find(row => row.definition.metric?.kind === 'ordinalNote')!;
    expect(panelGroup.definition.scale?.domain).toEqual({ min: 0, max: 15 });
    expect(j5Group.definition.scale?.domain).toEqual({ min: 0, max: 100 });
    expect(panelGroup.referenceGroupId).not.toBe(j5Group.referenceGroupId);
    expect(panelGroup.values.filter(value => value.candidateId !== 'adopted-reference').every(value => value.status === 'unknown')).toBe(true);
    expect(readHopV55ReferenceComparison(r1).status).toBe('available');
    predictor.mockImplementation(() => { throw new Error('La relecture historique ne lance pas J5.'); });
    expect(readHopV55ReferenceComparison(r2).status).toBe('available');
    predictor.mockRestore();

    const returned = createHopV55ReferenceComparison(serviceInput(scenario, journal, journal.r1));
    expect(returned.reference).toEqual(r1.reference);
    expect(returned.selection).toEqual(r1.selection);
    expect(returned.comparison.candidateOrder).toEqual(r1.comparison.candidateOrder);
    expect(returned.comparison.dimensions.find(row => row.referenceGroupId === j5Group.referenceGroupId)?.values
      .filter(value => value.candidateId !== 'adopted-reference')).toEqual(exactJ5Values);
  });

  it('laisse le modèle inconnu et les dépendances absentes sans fabriquer de zéro ni relire le catalogue courant', () => {
    const missingModel = testData(false);
    const scenario = createScenario(missingModel);
    const knownMaterialsJournal = createReferenceJournal(missingModel.axis);
    const predictor = vi.spyOn(recipePrediction, 'predictHopRecipe');
    const noModel = createHopV55ReferenceComparison(serviceInput(scenario, knownMaterialsJournal, knownMaterialsJournal.r1));
    expect(predictor).toHaveBeenCalledTimes(1);
    const noModelGroup = noModel.comparison.dimensions.find(row => row.definition.metric?.kind === 'modelIndex')!;
    expect(noModelGroup.values.find(value => value.candidateId === 'baseline')).toMatchObject({ status: 'unknown' });
    expect(noModelGroup.values.find(value => value.candidateId === 'adopted-reference')).toMatchObject({ status: 'unknown' });
    expect(noModelGroup.values.find(value => value.candidateId === 'adopted-reference')).not.toHaveProperty('value');

    predictor.mockClear();
    const journal = createReferenceJournal(missingModel.axis, 'not-in-frozen-dependencies');
    const dto = createHopV55ReferenceComparison(serviceInput(scenario, journal, journal.r1));
    expect(predictor).not.toHaveBeenCalled();
    expect(dto.referenceEvaluation.status).toBe('unknown');
    expect(dto.referenceEvaluation.reason).toContain('not-in-frozen-dependencies');
    const modelGroup = dto.comparison.dimensions.find(row => row.definition.metric?.kind === 'modelIndex')!;
    expect(modelGroup.values.find(value => value.candidateId === 'baseline')).toMatchObject({ status: 'unknown' });
    expect(modelGroup.values.find(value => value.candidateId === 'adopted-reference')).toMatchObject({ status: 'unknown' });
    expect(modelGroup.values.find(value => value.candidateId === 'baseline')).not.toHaveProperty('value');
  });

  it('refuse une référence non adoptée et rejette une annexe dont l’empreinte est altérée', () => {
    const scenario = createScenario();
    const journal = createReferenceJournal(scenario.data.axis);
    const notAdopted = { id: 'missing-reference', version: '1', contentReference: 'no-reference' };
    expect(() => createHopV55ReferenceComparison(serviceInput(scenario, journal, notAdopted))).toThrow(/adoptée/);
    const dto = createHopV55ReferenceComparison(serviceInput(scenario, journal, journal.r1));
    expect(readHopV55ReferenceComparison({ ...dto, version: 'hop-v55-reference-comparison-vNext' })).toMatchObject({ status: 'unsupportedFormat' });
    expect(readHopV55ReferenceComparison({ ...dto, contentReference: 'altéré' })).toMatchObject({ status: 'invalid' });
  });

  it('relit un journal typé v1/v2 sans recalcul ni changement du contexte de source', () => {
    const scenario = createScenario();
    const adopted = createReferenceJournal(scenario.data.axis);
    const v1Dto = createHopV55ReferenceComparison(serviceInput(scenario, adopted, adopted.r2));
    const journalWithV2 = activateReference(adopted, adopted.r1);
    const input = serviceInput(scenario, journalWithV2, adopted.r2);
    const dto = createHopV55ReferenceComparison(input);
    const activated = dto.archive.referenceJournal.events.at(-1);
    expect(activated).toMatchObject({ eventFormatVersion: 2, kind: 'referenceActivated', payload: { reference: adopted.r1 } });
    expect(dto.archive.referenceJournal.events).toEqual(journalWithV2.events);
    expect(dto.reference).toEqual(adopted.r2);
    expect(dto.comparison.context).toEqual(v1Dto.comparison.context);

    const predictor = vi.spyOn(recipePrediction, 'predictHopRecipe').mockImplementation(() => { throw new Error('La relecture ne prédit pas.'); });
    const read = readHopV55ReferenceComparison(dto);
    expect(read.status).toBe('available');
    if (read.status !== 'available') throw new Error('L’archive mixte NR v1/v2 doit rester lisible.');
    expect(read.dto.archive.referenceJournal.events).toEqual(journalWithV2.events);
    expect(read.dto.comparison.context).toEqual(dto.comparison.context);
    expect(predictor).not.toHaveBeenCalled();
    predictor.mockRestore();
  });
});
