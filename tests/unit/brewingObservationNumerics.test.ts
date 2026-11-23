import { describe, expect, it } from 'vitest';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryMetric } from '../../src/domain/brewingSensory';
import type { BrewingReferenceObservationV1 } from '../../src/domain/brewingReference';
import { qualifyBrewingObservationNumerics, type BrewingObservationArithmeticContract } from '../../src/domain/brewingObservationNumerics';

const source = { title: 'Fixture numérique', author: 'Test', year: null, kind: 'judgment' as const, reference: 'fixture://numerics' };
function setup(kind: BrewingSensoryMetric['kind'] = 'measurement') {
  const dimension = { id: 'dimension-a', version: '1', name: 'Dimension A', definition: 'Définition synthétique pour vérifier le contrat.', sourceRefs: [source] };
  const metric: BrewingSensoryMetric = { id: 'metric-a', version: '1', kind, name: 'Métrique A', meaning: 'Quantité de fixture.', unit: 'u', sourceRefs: [source] };
  const scale = { id: 'scale-a', version: '1', metricRef: { id: metric.id, version: metric.version }, domain: { min: 0, max: 10 }, sourceRefs: [source] };
  const definition = createBrewingSensoryDefinitionReference(dimension, metric, scale);
  const observation: BrewingReferenceObservationV1 = { id: 'observation', version: 1, subject: { kind: 'sample', id: 'sample-a', label: 'Échantillon' },
    observedAt: '2026-10-02T10:00:00.000Z', author: { label: 'Brasseur' }, origin: { kind: 'observation', description: 'Valeur rapportée' },
    originalText: 'Trois unités', dimension: { status: 'resolved', definition }, scale: { status: 'known', metric, scale },
    sense: kind === 'measurement' ? { kind: 'analyticalMeasurement', value: 3, unit: 'u', basis: 'sample', method: 'fixture' }
      : { kind: 'sensoryRating', value: 3 }, comparison: { kind: 'absolute' }, context: {} };
  const contract: BrewingObservationArithmeticContract = { version: 'brewing-observation-arithmetic-v1', id: 'contract-a', definition,
    operation: 'additiveDifference', basis: kind === 'measurement' ? 'sample' : null, explanation: 'Hypothèse de différence compatible explicitement retenue.',
    sourceRefs: [source], adoptedAt: '2026-10-02T10:01:00.000Z', adoptedBy: { origin: 'user', name: 'Brasseur' } };
  return { observation, contract };
}

function bridgedSetup() {
  const { observation, contract } = setup('ordinalNote');
  const sourceDefinition = contract.definition;
  const targetMetric: BrewingSensoryMetric = { ...sourceDefinition.metric!, id: 'model-index', kind: 'modelIndex',
    name: 'Indice hypothétique', meaning: 'Indice de travail de même dimension, hypothèse de fixture.' };
  const targetScale = { ...sourceDefinition.scale!, id: 'model-index-scale', metricRef: { id: targetMetric.id, version: targetMetric.version } };
  contract.definition = createBrewingSensoryDefinitionReference(sourceDefinition.dimension, targetMetric, targetScale);
  contract.operation = 'ordinalWorkingHypothesis';
  contract.unitBridge = { sourceDefinition, rule: 'unitCorrespondence', domain: { min: 0, max: 10 },
    sourceMeaning: { kind: 'intensity', direction: 'increasing' }, targetMeaning: { kind: 'intensity', direction: 'increasing' },
    explanation: 'Pour cette projection, un point de l’indice est traité comme un point de la note, sans calibration revendiquée.' };
  return { observation, contract };
}

describe('compatibilité numérique des observations ancrées', () => {
  it('qualifie un point et une plage compatibles sans changer le fait ni inventer un centre', () => {
    const { observation, contract } = setup();
    const before = structuredClone(observation);
    expect(qualifyBrewingObservationNumerics(observation, contract)).toMatchObject({ status: 'comparable', observationValue: 3 });
    if (observation.sense.kind !== 'analyticalMeasurement') throw Error('fixture');
    observation.sense.value = { min: 2, max: 4 };
    expect(qualifyBrewingObservationNumerics(observation, contract)).toMatchObject({ status: 'comparable', observationValue: { min: 2, max: 4 } });
    expect(before.sense).toMatchObject({ value: 3 });
    expect(observation.sense.value).toEqual({ min: 2, max: 4 });
  });
  it('garde scaleUnknown3 sans valeur dans la qualification numérique', () => {
    const { observation, contract } = setup('modelIndex');
    observation.dimension = { status: 'unresolved', label: 'Nuance notée' };
    observation.scale = { status: 'unknown' };
    const before = structuredClone(observation);
    const result = qualifyBrewingObservationNumerics(observation, contract);
    expect(result).toMatchObject({ status: 'nonComparable', observationValue: null });
    expect(result.reasons.map(row => row.code)).toContain('scaleUnknown');
    expect(observation).toEqual(before);
    expect(observation.sense).toEqual({ kind: 'sensoryRating', value: 3 });
  });
  it('ne considère pas ordinalNote comme additive sans hypothèse explicite', () => {
    const { observation, contract } = setup('ordinalNote');
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('ordinalAdditionNotAdopted');
    contract.operation = 'ordinalWorkingHypothesis';
    const result = qualifyBrewingObservationNumerics(observation, contract);
    expect(result).toMatchObject({ status: 'comparable', observationValue: 3 });
    expect(result.limitations.join(' ')).toContain('pas par calibration');
  });
  it('refuse une note relative sans référent et ne transforme pas un pointeur en valeur absolue', () => {
    const { observation, contract } = setup('ordinalNote');
    contract.operation = 'ordinalWorkingHypothesis';
    observation.comparison = { kind: 'relative', relationship: 'Plus intense', referent: null };
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('relativeWithoutReferent');
    observation.comparison.referent = { id: 'prior', version: '1', contentReference: 'fixture:prior' };
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('relativeValueNotResolved');
  });
  it('ne convertit ni unité, ni base, ni définition proche', () => {
    const { observation, contract } = setup();
    contract.basis = 'other';
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('analyticalBasisMismatch');
    contract.basis = 'sample';
    if (observation.sense.kind !== 'analyticalMeasurement') throw Error('fixture');
    observation.sense.unit = 'other';
    expect(() => qualifyBrewingObservationNumerics(observation, contract)).toThrow(/unité exacte/);
    observation.sense.unit = 'u';
    const different = setup('modelIndex').contract;
    expect(qualifyBrewingObservationNumerics(observation, different).reasons.map(row => row.code)).toContain('definitionMismatch');
  });
  it('refuse un contrat non daté ou enrichi de paramètres numériques étrangers', () => {
    const { observation, contract } = setup();
    expect(() => qualifyBrewingObservationNumerics(observation, { ...contract, adoptedAt: '' })).toThrow();
    expect(() => qualifyBrewingObservationNumerics(observation, { ...contract, scaleFactor: 20 } as any)).toThrow();
  });
  it('interprète explicitement une note ordinale dans un indice sans modifier son type, sa valeur ou sa définition', () => {
    const { observation, contract } = bridgedSetup();
    const original = structuredClone(observation);
    const result = qualifyBrewingObservationNumerics(observation, contract);
    expect(result).toMatchObject({ status: 'comparable', observationValue: 3, valueStatus: 'hypotheticalInterpretation',
      sourceDefinitionReference: contract.unitBridge!.sourceDefinition.contentReference, definitionReference: contract.definition.contentReference });
    expect(observation).toEqual(original);
    expect(observation.scale).toMatchObject({ metric: { kind: 'ordinalNote' } });
    expect(result.limitations.join(' ')).toContain('g(x)=x');
  });
  it('refuse le même calcul si le bridge ou l’hypothèse ordinale manque', () => {
    const { observation, contract } = bridgedSetup();
    const missing = structuredClone(contract); delete missing.unitBridge;
    expect(qualifyBrewingObservationNumerics(observation, missing)).toMatchObject({ status: 'nonComparable' });
    contract.operation = 'additiveDifference';
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('ordinalAdditionNotAdopted');
  });
  it('ne convertit pas une note 0–5 vers un indice 0–100', () => {
    const { observation, contract } = bridgedSetup();
    const original = contract.unitBridge!.sourceDefinition;
    const sourceScale = { ...original.scale!, domain: { min: 0, max: 5 } };
    const sourceDefinition = createBrewingSensoryDefinitionReference(original.dimension, original.metric, sourceScale);
    observation.dimension = { status: 'resolved', definition: sourceDefinition };
    observation.scale = { status: 'known', metric: original.metric!, scale: sourceScale };
    contract.unitBridge!.sourceDefinition = sourceDefinition;
    contract.unitBridge!.domain = { min: 0, max: 5 };
    contract.definition = createBrewingSensoryDefinitionReference(contract.definition.dimension, contract.definition.metric,
      { ...contract.definition.scale!, domain: { min: 0, max: 100 } });
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('bridgeDomainMismatch');
    expect(observation.sense).toMatchObject({ value: 3 });
  });
  it('ne transforme pas préférence, classement ou orientation inversée en intensité croissante', () => {
    const { observation, contract } = bridgedSetup();
    contract.unitBridge!.sourceMeaning.kind = 'preference';
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('bridgeMeaningMismatch');
    contract.unitBridge!.sourceMeaning.kind = 'ranking';
    expect(qualifyBrewingObservationNumerics(observation, contract).status).toBe('nonComparable');
    contract.unitBridge!.sourceMeaning = { kind: 'intensity', direction: 'decreasing' };
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('bridgeOrientationMismatch');
  });
  it('refuse une autre dimension même si les bornes et la métrique correspondent', () => {
    const { observation, contract } = bridgedSetup();
    contract.definition = createBrewingSensoryDefinitionReference({ ...contract.definition.dimension, id: 'different-dimension', name: 'Autre nuance' },
      contract.definition.metric, contract.definition.scale);
    expect(qualifyBrewingObservationNumerics(observation, contract).reasons.map(row => row.code)).toContain('bridgeDimensionMismatch');
  });
  it('ne cache pas une conversion affine derrière la correspondance unitaire', () => {
    const { observation, contract } = bridgedSetup();
    expect(() => qualifyBrewingObservationNumerics(observation, { ...contract,
      unitBridge: { ...contract.unitBridge!, multiplier: 20 } } as any)).toThrow();
  });
});
