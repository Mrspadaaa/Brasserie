import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopAxis, HopTriplet, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import {
  createBrewingSensoryComparison,
  createBrewingSensoryDefinitionReference,
  type BrewingSensoryComparisonDTO,
  type BrewingSensoryComparisonValue,
  type BrewingSensoryDimension,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
  type BrewingSensoryValueProvenance
} from '../../src/domain/brewingSensory';
import { buildBrewingScenarioRequest, simulateBrewingScenario, type BrewingScenarioAssumption, type BrewingScenarioBranchRequest, type BrewingScenarioResult } from '../../src/domain/brewingScenario';
import { brewingScenarioViewModel } from '../../src/domain/brewingScenarioTools';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55SensoryComparison } from '../../src/ui/hopV55/SensoryComparison';
import { HopV55Comparison } from '../../src/ui/hopV55/Comparison';
import modelPack from '../../src/data/hopExtrapolationBootstrap.json';
import definitions from '../../src/data/hopKnowledgeBootstrap.json';
import studyPack from '../../src/data/hopStudyBootstrap.json';

afterEach(cleanup);

const source = (title: string, kind: HopSource['kind'] = 'research'): HopSource => ({
  title, author: 'Fixture de test', year: 2026, kind, reference: `fixture:creuset-compatible:${title.toLowerCase().replace(/\s+/g, '-')}`
});
const modelSource = source('projection synthétique', 'judgment');
const contextSource = source('contexte de programme synthétique', 'observation');
const referenceSource = source('référence de comparaison synthétique', 'judgment');
const analyticSource = source('cible analytique de test', 'research');

const modelMetric: BrewingSensoryMetric = {
  id: 'fixture-sensory-index', version: 'fixture-v1', kind: 'modelIndex',
  name: 'Indice sensoriel synthétique',
  meaning: 'Indice hypothétique employé par le fixture de comparaison.',
  unit: 'axisScale', sourceRefs: [modelSource]
};
const scaleFor = (id: string, version: string, metric: BrewingSensoryMetric, domain: BrewingSensoryScale['domain']): BrewingSensoryScale => ({
  id, version, metricRef: { id: metric.id, version: metric.version }, domain,
  sourceRefs: [source(`échelle ${id}`, 'judgment')]
});
const sharedScale = scaleFor('fixture-index-0-100', 'fixture-v1', modelMetric, { min: 0, max: 100 });
const alternateScale = scaleFor('fixture-index-0-10', 'fixture-v1', modelMetric, { min: 0, max: 10 });
const unknownDomainScale = scaleFor('fixture-index-domain-unknown', 'fixture-v1', modelMetric, null);
const panelMetric: BrewingSensoryMetric = {
  id: 'fixture-panel-note', version: 'fixture-v1', kind: 'ordinalNote', name: 'Note de panel synthétique',
  meaning: 'Note hypothétique de démonstration, distincte de l’indice de modèle.',
  unit: 'points', sourceRefs: [source('note de panel synthétique', 'observation')]
};
const panelScale = scaleFor('fixture-panel-0-5', 'fixture-v1', panelMetric, { min: 0, max: 5 });
const ibuMetric: BrewingSensoryMetric = {
  id: 'fixture-ibu', version: 'fixture-v1', kind: 'measurement', name: 'IBU cible',
  meaning: 'Quantité analytique en IBU, hors indice sensoriel.', unit: 'IBU', sourceRefs: [analyticSource]
};
const ibuScale = scaleFor('fixture-ibu-domain', 'fixture-v1', ibuMetric, { min: 0, max: 50 });
const doseMetric: BrewingSensoryMetric = {
  id: 'fixture-dose', version: 'fixture-v1', kind: 'measurement', name: 'Dose de houblon',
  meaning: 'Quantité par volume, hors indice sensoriel.', unit: 'g/L', sourceRefs: [analyticSource]
};
const doseScale = scaleFor('fixture-dose-domain', 'fixture-v1', doseMetric, { min: 0, max: 10 });
const candidates = [
  { id: 'baseline', name: 'Base de test' },
  { id: 'option-a', name: 'Option A de test' },
  { id: 'option-b', name: 'Option B de test' }
];
const candidateIds = candidates.map(candidate => candidate.id);

function dimension(id: string, name: string): BrewingSensoryDimension {
  return {
    id, version: 'v1', name, definition: `Définition synthétique de ${name.toLowerCase()}.`,
    sourceRefs: [source(`définition ${id}`, 'judgment')]
  };
}
const citrus = dimension('citrus-fixture', 'Agrumes');
const tropical = dimension('tropical-fixture', 'Fruits tropicaux');
const stoneFruit = dimension('stone-fruit-fixture', 'Fruits à noyau');
const resinous = dimension('resinous-fixture', 'Résineux');
const panel = dimension('panel-fixture', 'Note de panel');
const ibu = dimension('ibu-fixture', 'IBU analytique');
const dose = dimension('dose-fixture', 'Dose par volume');
const unscaled = dimension('unscaled-fixture', 'Indice sans domaine déclaré');
const qualitative = dimension('qualitative-fixture', 'Mention qualitative');

function definition(dim: BrewingSensoryDimension, metric: BrewingSensoryMetric | null, scale: BrewingSensoryScale | null) {
  return createBrewingSensoryDefinitionReference(dim, metric, scale);
}
const axisDefinitions = [citrus, tropical, stoneFruit].map(dim => definition(dim, modelMetric, sharedScale));
const alternateDefinition = definition(resinous, modelMetric, alternateScale);
const panelDefinition = definition(panel, panelMetric, panelScale);
const ibuDefinition = definition(ibu, ibuMetric, ibuScale);
const doseDefinition = definition(dose, doseMetric, doseScale);
const unscaledDefinition = definition(unscaled, modelMetric, unknownDomainScale);
const qualitativeDefinition = definition(qualitative, null, null);

function provenance(explanation: string, refs: HopSource[] = [modelSource], modelRef = true): BrewingSensoryValueProvenance {
  return {
    sourceRefs: refs,
    ...(modelRef ? { modelRef: { id: 'fixture-sensory-model', version: 'fixture-v1' }, hypothesisRefs: ['fixture-program-mixture-v1'] } : {}),
    explanation,
    limitations: ['Fixture synthétique, pas une mesure de bière; aucune couverture statistique revendiquée.']
  };
}
function point(candidateId: string, status: 'observed' | 'hypothetical' | 'target', value: number,
  detail: string, refs: HopSource[] = [modelSource], modelRef = true): BrewingSensoryComparisonValue {
  return { candidateId, status, value, provenance: provenance(detail, refs, modelRef) };
}
function range(candidateId: string, min: number, max: number, central: number | undefined, detail: string): BrewingSensoryComparisonValue {
  return { candidateId, status: 'hypothetical', range: { min, max }, ...(central === undefined ? {} : { central }), provenance: provenance(detail) };
}
function unknown(candidateId: string, reason: string): BrewingSensoryComparisonValue {
  return { candidateId, status: 'unknown', reason, provenance: provenance(reason, [], false) };
}
function nonDocumented(candidateId: string, reason: string): BrewingSensoryComparisonValue {
  return { candidateId, status: 'nonDocumented', reason, provenance: provenance(reason, [], false) };
}
function documented(candidateId: string): BrewingSensoryComparisonValue {
  const mentionSource = source('fiche documentaire synthétique', 'manufacturer');
  return {
    candidateId, status: 'documented',
    mentions: [{
      dimensionRef: { id: qualitative.id, version: qualitative.version },
      lexicalRuleRef: { id: 'fixture-lexical-rule', version: 'v1' },
      term: 'herbacé', context: 'rawHop', text: 'Mention de test : herbacé.', source: mentionSource, qualification: 'affirmed'
    }],
    provenance: provenance('Mention qualitative de fixture; aucune note numérique.', [mentionSource], false)
  };
}

/** Fixture de renderer seulement : valeurs explicitement synthétiques, sans valeur de bière ni sortie Gemini. */
function compatibleComparison(result: BrewingScenarioResult): BrewingSensoryComparisonDTO {
  const dimensions = [
    { definition: axisDefinitions[0], values: [
      range('baseline', 72, 86, 79, 'Plage synthétique d’agrumes, base.'),
      range('option-a', 35, 81, undefined, 'Plage synthétique d’agrumes, A; aucune centrale fournie.'),
      range('option-b', 70, 88, 78.5, 'Plage synthétique d’agrumes, B.')
    ] },
    { definition: axisDefinitions[1], values: [
      range('baseline', 50, 72, 61, 'Plage synthétique tropicale, base.'),
      range('option-a', 42, 68, undefined, 'Plage synthétique tropicale, A; aucune centrale fournie.'),
      range('option-b', 59, 78, 67, 'Plage synthétique tropicale, B.')
    ] },
    { definition: axisDefinitions[2], values: [
      range('baseline', 15, 31, 23, 'Plage synthétique fruits à noyau, base.'),
      unknown('option-a', 'Aucune valeur numérique fournie pour cette nuance et cette série.'),
      range('option-b', 18, 35, 26, 'Plage synthétique fruits à noyau, B.')
    ] },
    { definition: alternateDefinition, values: [
      point('baseline', 'hypothetical', 4.2, 'Point synthétique sur l’échelle distincte 0–10.'),
      range('option-a', 3, 6, undefined, 'Plage synthétique sur l’échelle distincte 0–10.'),
      point('option-b', 'hypothetical', 5.5, 'Point synthétique sur l’échelle distincte 0–10.')
    ] },
    { definition: panelDefinition, values: [
      point('baseline', 'hypothetical', 2.4, 'Note de panel synthétique, métrique distincte.'),
      range('option-a', 2, 3, undefined, 'Note de panel synthétique, sans centrale déclarée.'),
      unknown('option-b', 'Aucune note de panel fournie pour cette série.')
    ] },
    { definition: ibuDefinition, values: [
      unknown('baseline', 'Aucune valeur analytique fournie pour la base.'),
      point('option-a', 'target', 24.3, 'Cible analytique de fixture, pas une mesure réelle.', [analyticSource], false),
      unknown('option-b', 'Aucune valeur analytique fournie pour cette option.')
    ] },
    { definition: doseDefinition, values: [
      unknown('baseline', 'Aucune dose fournie pour la base.'),
      unknown('option-a', 'Aucune dose fournie pour cette option.'),
      point('option-b', 'target', 4.2, 'Cible de dose de fixture, en g/L.', [analyticSource], false)
    ] },
    { definition: unscaledDefinition, values: [
      range('baseline', 106, 112, undefined, 'Valeur synthétique conservée sans domaine publié.'),
      unknown('option-a', 'Aucun indice sans domaine fourni pour cette série.'),
      nonDocumented('option-b', 'Aucune définition documentaire de cette nuance.')
    ] },
    { definition: qualitativeDefinition, values: [
      unknown('baseline', 'Aucune extraction documentaire pour la base.'),
      nonDocumented('option-a', 'Aucune mention source trouvée pour cette option.'),
      documented('option-b')
    ] }
  ];
  return createBrewingSensoryComparison({
    context: {
      id: result.scenarioId, version: String(result.revision), kind: 'j5Snapshot', contentReference: result.reference,
      label: 'Snapshot de fixture · programme synthétique · sans brassin réel', sourceRefs: [contextSource]
    },
    reference: { id: 'fixture-reference', version: 'v1', kind: 'adoptedReference', contentReference: 'fixture:reference:v1', sourceRefs: [referenceSource] },
    candidateOrder: candidateIds, candidates,
    dimensionOrder: dimensions.map(row => row.definition.contentReference), dimensions
  });
}

function assumptionsSensoryComparison(result: BrewingScenarioResult): BrewingSensoryComparisonDTO {
  const base = compatibleComparison(result);
  const branchMap: Record<string, string> = { baseline: 'baseline', 'option-a': 'assumptions-used', 'option-b': 'assumptions-proposed' };
  const dimensions = base.dimensions.slice(0, 3).map(dimension => ({
    definition: dimension.definition,
    values: [
      ...dimension.values.map(value => ({ ...structuredClone(value), candidateId: branchMap[value.candidateId] ?? value.candidateId })),
      unknown('adopted-reference', 'La référence adoptée n’a pas de branche de scénario ni d’hypothèses de calcul.')
    ]
  }));
  const candidates = [
    { id: 'baseline', name: 'Base fixture' },
    { id: 'assumptions-used', name: 'Branche utilisée' },
    { id: 'assumptions-proposed', name: 'Branche proposée' },
    { id: 'adopted-reference', name: 'Référence adoptée' }
  ];
  return createBrewingSensoryComparison({
    context: base.context, reference: base.reference, candidateOrder: candidates.map(candidate => candidate.id), candidates,
    dimensionOrder: dimensions.map(dimension => dimension.definition.contentReference), dimensions
  });
}
function sourceProgramResult(): BrewingScenarioResult {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  const current = prepared.runtime.current;
  if (!current?.program || current.program.additions.length < 2) throw new Error('Le fixture source doit porter deux lignes de programme.');
  const program = structuredClone(current.program);
  program.additions[0].status = 'performed';
  program.additions[1].status = 'planned';
  prepared.runtime.current = { ...current, program, performedAdditionIds: [program.additions[0].id] };
  const request = createHopV55ScenarioRequest({
    prepared, scenarioId: 'creuset-compatible-test', revision: 1, branches: [],
    intent: { question: 'Fixture de contexte du programme source.', criteria: [] }
  });
  return simulateBrewingScenario(request, prepared.runtime);
}

function comparisonSubset(comparison: BrewingSensoryComparisonDTO, indexes: number[], separateAxisIndexes: number[] = []): BrewingSensoryComparisonDTO {
  const rows = indexes.map(index => {
    const row = comparison.dimensions[index];
    if (!row) throw new Error(`Axe fixture absent à l’index ${index}.`);
    if (!separateAxisIndexes.includes(index)) return { definition: row.definition, values: structuredClone(row.values) };
    const metric = row.definition.metric!;
    const oldScale = row.definition.scale!;
    const nextMetric = { ...structuredClone(metric), id: `fixture-axis-metric-${index + 1}`, name: `${row.definition.dimension.name} · indice propre` };
    const nextScale: BrewingSensoryScale = {
      ...structuredClone(oldScale), id: `fixture-axis-scale-${index + 1}`,
      metricRef: { id: nextMetric.id, version: nextMetric.version }
    };
    return { definition: definition(row.definition.dimension, nextMetric, nextScale), values: structuredClone(row.values) };
  });
  return createBrewingSensoryComparison({
    context: comparison.context, reference: comparison.reference, candidateOrder: comparison.candidateOrder,
    candidates: comparison.candidates, dimensionOrder: rows.map(row => row.definition.contentReference), dimensions: rows
  });
}

function mixedDomainJ5Scenario(withDisclosureBranches = false): BrewingScenarioResult {
  const model = structuredClone(modelPack[0]) as HopExtrapolation;
  const modelSource: HopSource = { ...model.source, kind: 'manufacturer', year: 2026 };
  const modelAxes = definitions.filter(row => row.kind === 'axis') as HopAxis[];
  const panelAxis = (studyPack as unknown as { hopKnowledge: HopAxis[] }).hopKnowledge.find(axis => axis.id === 'citrus-lafontaine');
  if (!panelAxis) throw new Error('Le fixture J5 doit conserver l’axe de panel 0–15.');
  const lager: HopYeast = { id: 'mix-domain-lager', kind: 'yeast', name: 'Souche lager fixture', betaLyase: 'unknown', source: modelSource };
  const ale: HopYeast = { id: 'mix-domain-ale', kind: 'yeast', name: 'Souche ale fixture', betaLyase: 'unknown', source: modelSource };
  const profile = model.yeasts[0];
  if (!profile) throw new Error('Le modèle fixture doit fournir un profil de souche.');
  model.yeasts = [{
    ...profile, yeastId: lager.id,
    aroma: Object.fromEntries(Object.keys(profile.aroma).map(id => [id, structuredClone(model.defaultYeast.aroma)])),
    expression: Object.fromEntries(Object.keys(profile.expression).map(id => [id, structuredClone(model.defaultYeast.expression)])),
    otherAroma: structuredClone(model.defaultYeast.aroma), otherExpression: structuredClone(model.defaultYeast.expression)
  }];
  const variety = (id: string, name: string, description: string): HopVariety => ({
    id, name, aliases: [], form: 'pelletT90', descriptions: [{ text: description, context: 'rawHop', source: modelSource }], analysis: []
  });
  const hallertau = variety('mix-domain-hallertau', 'Hallertau fixture', 'agrumes floraux');
  const saaz = variety('mix-domain-saaz', 'Saaz fixture', 'floral épicé');
  const materials: HopDecisionMaterial[] = [hallertau, saaz].map(hop => ({ id: `material-${hop.id}`, name: hop.name, form: hop.form, variety: hop }));
  const triplet = (varietyId: string, yeastId: string | null, timing: HopTriplet['timing'], doseGL: number): HopTriplet => ({
    varietyId, lotId: null, yeastId, timing, doseGL,
    temperatureC: model.timings[timing].temperatureC.central, contactHours: 24, matrixId: null
  });
  const input = (varietyId: string, yeastId: string | null, timing: HopTriplet['timing'], doseGL: number): HopRecipeInput => ({
    volumeL: 20, yeastId,
    additions: [{ id: `addition-${varietyId}`, name: `Ajout ${varietyId}`, triplet: triplet(varietyId, yeastId, timing, doseGL) }],
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 18, days: 10 }]
  });
  const engineData: HopEngineData = {
    varieties: [hallertau, saaz], lots: [], knowledge: [...structuredClone(modelAxes), structuredClone(panelAxis), lager, ale, model]
  };
  const request = buildBrewingScenarioRequest({
    scenarioId: 'creuset-j5-mixed-domain', revision: 1,
    baseline: { kind: 'hypothetical', label: 'Base Hallertau fixture', input: input(hallertau.id, lager.id, 'postFermentation', 4) },
    target: { citrus: { min: 55, max: 85 } }
  });
  request.branches.push(
    { id: 'saaz-close', label: 'Option Saaz fixture', input: input(saaz.id, ale.id, 'whirlpool', 4.1), assumptions: [] },
    { id: 'unknown-strain', label: 'Option souche inconnue fixture', input: input(hallertau.id, null, 'postFermentation', 4), assumptions: [] }
  );
  if (withDisclosureBranches) {
    const usedDose: BrewingScenarioAssumption = {
      id: 'fixture-used-zero-dose', path: `additions.addition-${hallertau.id}.doseGL`, label: 'Dose explicite égale à zéro',
      status: 'selected', origin: 'userHypothesis', explanation: 'Le brasseur choisit explicitement zéro g/L.',
      value: 0, unit: 'g/L', source: source('consigne de dose', 'observation')
    };
    const usedAnalogy: BrewingScenarioAssumption = {
      id: 'fixture-used-hop-analogy', path: 'analogy.hops', label: 'Descripteurs analogiques proposés',
      status: 'selected', origin: 'analogy', explanation: 'Lecture locale de descripteurs, sans transfert de mesure.',
      value: 'descripteurs uniquement', source: source('note d’analogie', 'judgment')
    };
    request.branches.push({
      id: 'assumptions-used', label: 'Branche avec hypothèses utilisées',
      input: input(hallertau.id, lager.id, 'postFermentation', 4),
      inputOverrides: { additions: [{ additionId: `addition-${hallertau.id}`, triplet: { doseGL: 0 } }] },
      assumptions: [usedDose, usedAnalogy],
      analogies: [{ kind: 'hopDescriptions', targetVarietyId: hallertau.id, referenceVarietyId: saaz.id,
        assumptionId: usedAnalogy.id, explanation: usedAnalogy.explanation }]
    });
    const proposedRange: BrewingScenarioAssumption = {
      id: 'fixture-proposed-range', path: 'model.axes.citrus-lafontaine.doseScale', label: 'Plage proposée sans centrale',
      status: 'proposed', origin: 'assistantHypothesis', explanation: 'Plage illustrative encore non appliquée.',
      range: { min: 0.25, max: 0.4 }, unit: 'points d’indice', source: source('plage de modèle', 'judgment')
    };
    const unappliedNull: BrewingScenarioAssumption = {
      id: 'fixture-unapplied-null', path: 'fermentation.pitchTempC', label: 'Température non renseignée',
      status: 'selected', origin: 'userHypothesis', explanation: 'Null signifie explicitement aucune température retenue.',
      value: null, unit: '°C', source: source('note de fermentation', 'observation')
    };
    request.branches.push({
      id: 'assumptions-proposed', label: 'Branche avec hypothèses proposées',
      input: input(saaz.id, ale.id, 'whirlpool', 4.1), assumptions: [proposedRange, unappliedNull],
      culture: { state: 'mixed', members: [
        { yeastId: ale.id, name: 'Souche ale fixture' }, { name: 'Souche sans identité résolue' }
      ], explanation: 'Fixture de culture mixte avec un membre non identifié.' }
    });
  }
  return simulateBrewingScenario(request, { engineData, materials });
}
function propsFor(comparison: BrewingSensoryComparisonDTO, result: BrewingScenarioResult, mode: 'bars' | 'radar' = 'bars') {
  return {
    comparison, result, candidateIds: comparison.candidateOrder, dimensionIds: comparison.dimensionOrder,
    mode, onModeChange: vi.fn(), onToggleCandidate: vi.fn(), onToggleDimension: vi.fn(), onChooseCandidate: vi.fn(),
    selectedCandidateId: 'baseline'
  };
}

function rowSnapshot(row: Element) {
  return [...row.querySelectorAll('.hv55-sensory-lane')].map(lane => {
    const candidateId = lane.getAttribute('data-candidate-id')!;
    const exactValue = row.querySelector(`.hv55-sensory-bar-values [data-candidate-id="${candidateId}"] .hv55-sensory-sr-only`);
    return {
      candidateId,
      marker: lane.getAttribute('data-series-marker'),
      quickText: exactValue?.textContent,
      rangeStyle: lane.querySelector('.hv55-sensory-range')?.getAttribute('style') ?? null,
      pointStyle: lane.querySelector('.hv55-sensory-point')?.getAttribute('style') ?? null,
      centralStyle: lane.querySelector('.hv55-sensory-central')?.getAttribute('style') ?? null,
      status: lane.querySelector('.hv55-sensory-lane-status')?.textContent ?? null
    };
  });
}

function groupIdentity(container: HTMLElement) {
  return [...container.querySelectorAll('.hv55-sensory-chart-group')].map(group => [
    group.getAttribute('data-metric-ref'), group.getAttribute('data-scale-ref')
  ]);
}

describe('Contrat de présentation sensorielle · fixture multi-axes', () => {
  it('trace trois axes réellement compatibles et garde exacts, inconnus, unités et contexte identiques en Barres/Radar', async () => {
    const result = sourceProgramResult();
    const comparison = compatibleComparison(result);
    const props = propsFor(comparison, result);
    const user = userEvent.setup();
    const { container, rerender } = render(<HopV55SensoryComparison {...props} />);
    const table = () => container.querySelector('.hv55-sensory-table-region')!.textContent;
    const initialTable = table();
    const initialContext = container.querySelector('.hv55-sensory-header p')!.textContent;
    const initialLegend = [...container.querySelectorAll('.hv55-sensory-legend > span')].map(item => [
      item.getAttribute('data-candidate-id'), item.getAttribute('data-series-marker'), item.textContent
    ]);
    const initialCandidates = [...container.querySelectorAll('.hv55-sensory-candidate input')].map(input => [
      input.getAttribute('aria-label'), (input as HTMLInputElement).checked
    ]);
    const initialDimensions = [...container.querySelectorAll('.hv55-sensory-dimension-selection input')].map(input => (input as HTMLInputElement).checked);

    const barGroups = container.querySelectorAll('.hv55-sensory-chart-group');
    expect(barGroups).toHaveLength(3);
    expect(groupIdentity(container)).toEqual([
      ['fixture-sensory-index', 'fixture-index-0-100'],
      ['fixture-sensory-index', 'fixture-index-0-10'],
      ['fixture-panel-note', 'fixture-panel-0-5']
    ]);
    const sharedBarGroup = container.querySelector('.hv55-sensory-bars .hv55-sensory-chart-group[data-scale-ref="fixture-index-0-100"]')!;
    expect(sharedBarGroup.querySelectorAll('.hv55-sensory-bar-row')).toHaveLength(3);
    const barsByAxis = new Map<string, ReturnType<typeof rowSnapshot>>();
    for (const axis of axisDefinitions) {
      const row = sharedBarGroup.querySelector(`.hv55-sensory-bar-row[data-reference-group="${axis.contentReference}"]`)!;
      barsByAxis.set(axis.dimension.name, rowSnapshot(row));
    }
    const stoneRow = sharedBarGroup.querySelector(`.hv55-sensory-bar-row[data-reference-group="${axisDefinitions[2].contentReference}"]`)!;
    const unknownLane = stoneRow.querySelector('.hv55-sensory-lane[data-candidate-id="option-a"]')!;
    expect(unknownLane.querySelector('.hv55-sensory-lane-status')).toHaveTextContent('Inconnu');
    expect(unknownLane.querySelector('.hv55-sensory-lane-track .hv55-sensory-point, .hv55-sensory-lane-track .hv55-sensory-range, .hv55-sensory-lane-track .hv55-sensory-central')).toBeNull();
    expect(stoneRow.querySelector('.hv55-sensory-bar-values [data-candidate-id="option-a"] .hv55-sensory-sr-only')).toHaveTextContent('Inconnu');

    const ibuRow = container.querySelector(`.hv55-sensory-table-region [data-reference-group="${ibuDefinition.contentReference}"]`)!;
    const doseRow = container.querySelector(`.hv55-sensory-table-region [data-reference-group="${doseDefinition.contentReference}"]`)!;
    expect(ibuRow).toHaveTextContent('24,3 IBU');
    expect(doseRow).toHaveTextContent('4,2 g/L');
    expect(container).toHaveTextContent('Fixture synthétique, pas une mesure de bière; aucune couverture statistique revendiquée.');
    expect(container).toHaveTextContent('fixture:creuset-compatible:projection-synthétique');
    expect(container).toHaveTextContent('fixture-program-mixture-v1');
    expect(container).toHaveTextContent('aucune centrale fournie');
    expect(screen.getByRole('checkbox', { name: /Comparer Projection du profil total du programme source · après les ajouts prévus/ })).toBeChecked();
    expect(container.querySelector('.hv55-sensory-table-region tbody')?.children).toHaveLength(comparison.dimensions.length);

    const references = container.querySelector('.hv55-sensory-reference-details')!;
    await user.click(references.querySelector('summary')!);
    expect(references).toHaveTextContent('Snapshot de fixture · programme synthétique · sans brassin réel');
    expect(references).toHaveTextContent('fixture:reference:v1');

    await user.click(within(container).getByRole('button', { name: 'Radar' }));
    expect(props.onModeChange).toHaveBeenLastCalledWith('radar');
    expect(props.onToggleCandidate).not.toHaveBeenCalled();
    expect(props.onToggleDimension).not.toHaveBeenCalled();
    rerender(<HopV55SensoryComparison {...props} mode="radar" />);
    expect(table()).toBe(initialTable);
    expect(container.querySelector('.hv55-sensory-header p')?.textContent).toBe(initialContext);
    expect([...container.querySelectorAll('.hv55-sensory-legend > span')].map(item => [
      item.getAttribute('data-candidate-id'), item.getAttribute('data-series-marker'), item.textContent
    ])).toEqual(initialLegend);
    expect([...container.querySelectorAll('.hv55-sensory-candidate input')].map(input => [
      input.getAttribute('aria-label'), (input as HTMLInputElement).checked
    ])).toEqual(initialCandidates);
    expect([...container.querySelectorAll('.hv55-sensory-dimension-selection input')].map(input => (input as HTMLInputElement).checked)).toEqual(initialDimensions);
    expect(groupIdentity(container)).toEqual([
      ['fixture-sensory-index', 'fixture-index-0-100'],
      ['fixture-sensory-index', 'fixture-index-0-10'],
      ['fixture-panel-note', 'fixture-panel-0-5']
    ]);

    const radar = container.querySelector('.hv55-sensory-radar-group[data-metric-ref="fixture-sensory-index"][data-scale-ref="fixture-index-0-100"]')!;
    expect(radar.querySelectorAll('.hv55-sensory-radar-axis')).toHaveLength(3);
    expect(radar.querySelectorAll('.hv55-sensory-radar-reading')).toHaveLength(8);
    const optionA = radar.querySelector('g[data-candidate-id="option-a"]')!;
    expect(optionA.querySelectorAll('.hv55-sensory-radar-extent')).toHaveLength(2);
    expect(optionA.querySelectorAll('.hv55-sensory-radar-point')).toHaveLength(0);
    expect(radar).toHaveTextContent('Option A de test · Fruits à noyau : inconnu');

    const reader = within(radar as HTMLElement).getByRole('group', { name: 'Lire les valeurs exactes d’un axe du radar' });
    for (const axis of axisDefinitions) {
      const axisButton = within(reader).getByRole('button', { name: axis.dimension.name });
      await user.click(axisButton);
      expect(axisButton).toHaveAttribute('aria-pressed', 'true');
      const radarReaderRow = radar.querySelector('.hv55-sensory-reader-row[data-reference-group]')!;
      expect(rowSnapshot(radarReaderRow), `Le lecteur radar restitue les lanes exactes de ${axis.dimension.name}.`).toEqual(barsByAxis.get(axis.dimension.name));
    }

    const selectedOption = within(container).getByRole('checkbox', { name: 'Comparer Option B de test' });
    await user.click(selectedOption);
    expect(props.onToggleCandidate).toHaveBeenCalledWith('option-b');
    const filteredProps = { ...props, candidateIds: ['baseline', 'option-a'], mode: 'radar' as const };
    rerender(<HopV55SensoryComparison {...filteredProps} />);
    expect(container.querySelector('.hv55-sensory-radar-group[data-scale-ref="fixture-index-0-100"]')?.querySelectorAll('.hv55-sensory-radar-axis')).toHaveLength(3);
    expect(container.querySelector('.hv55-sensory-radar-group[data-scale-ref="fixture-index-0-100"]')?.querySelectorAll('g[data-candidate-id]')).toHaveLength(2);
    const filteredTable = table();
    rerender(<HopV55SensoryComparison {...filteredProps} mode="bars" />);
    expect(table()).toBe(filteredTable);
    expect(container.querySelector('.hv55-sensory-bars .hv55-sensory-chart-group[data-scale-ref="fixture-index-0-100"]')?.querySelectorAll('.hv55-sensory-bar-row')).toHaveLength(3);
    expect(container.querySelector('.hv55-sensory-table-region')).toHaveTextContent('Option A de test');
    expect(container.querySelector('.hv55-sensory-table-region')).not.toHaveTextContent('Option B de test');
  });

  it('n’affiche pas de profil radar pour un groupe compatible limité à deux axes et conserve la lecture exacte', async () => {
    const result = sourceProgramResult();
    const full = compatibleComparison(result);
    const comparison = comparisonSubset(full, [0, 1]);
    const props = propsFor(comparison, result, 'bars');
    const user = userEvent.setup();
    const { container, rerender } = render(<HopV55SensoryComparison {...props} />);
    const table = () => container.querySelector('.hv55-sensory-table-region')!;
    const before = table().textContent;
    const contextBefore = container.querySelector('.hv55-sensory-header p')?.textContent;
    const selectedBefore = [...container.querySelectorAll('.hv55-sensory-candidate input')].map(input => (input as HTMLInputElement).checked);
    const dimensionsBefore = [...container.querySelectorAll('.hv55-sensory-dimension-selection input')].map(input => (input as HTMLInputElement).checked);

    await user.click(within(container).getByRole('button', { name: 'Radar' }));
    rerender(<HopV55SensoryComparison {...props} mode="radar" />);
    expect.soft(container.querySelectorAll('.hv55-sensory-radar-group')).toHaveLength(0);
    const reasonText = (container.textContent ?? '').replace(/\s+/g, ' ');
    expect.soft(reasonText).toMatch(/(?:radar|profil).{0,120}(?:3|trois) (?:axes|dimensions|nuances)|(?:3|trois) (?:axes|dimensions|nuances).{0,120}(?:radar|profil)/i);
    expect(table().textContent).toBe(before);
    expect(table().querySelectorAll('tbody tr')).toHaveLength(2);
    expect(table()).toHaveTextContent('35–81 points d’indice');
    expect(table()).toHaveTextContent('Projection hypothétique · 35–81 points d’indice · centrale non fournie');
    expect(container.querySelector('.hv55-sensory-header p')?.textContent).toBe(contextBefore);
    expect([...container.querySelectorAll('.hv55-sensory-candidate input')].map(input => (input as HTMLInputElement).checked)).toEqual(selectedBefore);
    expect([...container.querySelectorAll('.hv55-sensory-dimension-selection input')].map(input => (input as HTMLInputElement).checked)).toEqual(dimensionsBefore);
    expect(screen.getByRole('checkbox', { name: /Comparer Projection du profil total du programme source · après les ajouts prévus/ })).toBeChecked();

    const provenance = table().querySelector('.hv55-sensory-provenance')!;
    await user.click(provenance.querySelector('summary')!);
    expect(provenance).toHaveTextContent('fixture:creuset-compatible:projection-synthétique');
    expect(provenance).toHaveTextContent('fixture-program-mixture-v1');
    expect(table()).toHaveTextContent(/aucune couverture statistique revendiquée/i);
  });

  it('n’unit pas les groupes incompatibles d’un et deux axes pour en fabriquer un radar, sans perdre leur tableau', () => {
    const result = sourceProgramResult();
    const full = compatibleComparison(result);
    const comparison = comparisonSubset(full, [0, 1, 2], [2]);
    const props = propsFor(comparison, result, 'radar');
    const { container } = render(<HopV55SensoryComparison {...props} />);
    expect.soft(container.querySelectorAll('.hv55-sensory-radar-group')).toHaveLength(0);
    const reasonText = (container.textContent ?? '').replace(/\s+/g, ' ');
    expect.soft(reasonText).toMatch(/(?:radar|profil).{0,120}(?:3|trois) (?:axes|dimensions|nuances)|(?:3|trois) (?:axes|dimensions|nuances).{0,120}(?:radar|profil)/i);
    const table = container.querySelector('.hv55-sensory-table-region')!;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(table).toHaveTextContent('72–86 points d’indice');
    expect(table).toHaveTextContent('42–68 points d’indice');
    expect(table).toHaveTextContent('Inconnu · Aucune valeur numérique fournie pour cette nuance et cette série.');
    expect([...container.querySelectorAll('.hv55-sensory-candidate input')].every(input => (input as HTMLInputElement).checked)).toBe(true);
    expect([...container.querySelectorAll('.hv55-sensory-dimension-selection input')].every(input => (input as HTMLInputElement).checked)).toBe(true);
    expect(container).toHaveTextContent('Snapshot de fixture · programme synthétique · sans brassin réel');
    expect(container).toHaveTextContent('fixture:creuset-compatible:projection-synthétique');
  });
  it('J5 fixture · trois axes aux domaines mixtes restent exacts dans le profil standard et séparés en sensoriel', async () => {
    const result = mixedDomainJ5Scenario();
    const view = brewingScenarioViewModel(result);
    const panel = view.axes.find(axis => axis.id === 'citrus-lafontaine');
    expect(panel, 'Le snapshot synthétique doit conserver le domaine panel 0–15.').toBeDefined();
    expect(panel!.scale).toEqual({ min: 0, max: 15 });
    const modelAxes = view.axes.filter(axis => axis.id !== panel!.id
      && (axis.scale.min !== panel!.scale.min || axis.scale.max !== panel!.scale.max));
    const selectedIds = [modelAxes[0]?.id, modelAxes[1]?.id, panel!.id].filter((id): id is string => !!id);
    const selectedAxes = view.axes.filter(axis => selectedIds.includes(axis.id));
    expect(selectedAxes).toHaveLength(3);
    expect(new Set(selectedAxes.map(axis => `${axis.scale.min}:${axis.scale.max}`)).size).toBeGreaterThan(1);

    const branchIds = ['baseline', 'saaz-close', 'unknown-strain'];
    const frExact = (value: number) => String(value).replace('.', ',');
    let numericValuesChecked = 0;
    for (const axis of selectedAxes) {
      for (const branchId of branchIds) {
        const estimate = axis.values.find(value => value.branchId === branchId)?.estimate;
        if (!estimate) continue;
        if (estimate.range) {
          expect(estimate.range.min, `${axis.name} ${branchId} borne basse`).toBeGreaterThanOrEqual(axis.scale.min);
          expect(estimate.range.max, `${axis.name} ${branchId} borne haute`).toBeLessThanOrEqual(axis.scale.max);
          numericValuesChecked += 1;
        }
        if (estimate.central != null) {
          expect(estimate.central, `${axis.name} ${branchId} centrale`).toBeGreaterThanOrEqual(axis.scale.min);
          expect(estimate.central, `${axis.name} ${branchId} centrale`).toBeLessThanOrEqual(axis.scale.max);
          numericValuesChecked += 1;
        }
      }
    }
    expect(numericValuesChecked, 'Le fixture doit contenir des plages/centrales numériques à contrôler.').toBeGreaterThan(0);

    const standardProps = {
      result, branchIds, axisIds: selectedIds, mode: 'bars' as const,
      onModeChange: vi.fn(), onToggleBranch: vi.fn(), onToggleAxis: vi.fn()
    };
    const user = userEvent.setup();
    const standard = render(<HopV55Comparison {...standardProps} />);
    const standardTable = () => standard.container.querySelector('.hv55-cmp-table-region')!.textContent;
    const standardBefore = standardTable();
    const standardRows = new Map([...standard.container.querySelectorAll('.hv55-cmp-bars .hv55-cmp-bar-row')].map(row => [
      row.getAttribute('data-axis')!, {
        scale: row.querySelector('.hv55-cmp-axis-title small')?.textContent,
        aria: row.querySelector('.hv55-cmp-track')?.getAttribute('aria-label'),
        values: [...row.querySelectorAll('.hv55-cmp-value')].map(value => [
          value.getAttribute('data-branch-id'), value.getAttribute('data-series-marker'),
          value.querySelector('.hv55-cmp-sr-only')?.textContent
        ])
      }
    ]));
    expect(standardRows.size).toBe(3);
    expect(standardRows.get(panel!.id)?.scale).toContain('0–15');
    expect([...selectedAxes.filter(axis => axis.id !== panel!.id)].every(axis =>
      standardRows.get(axis.id)?.scale?.includes(`${frExact(axis.scale.min)}–${frExact(axis.scale.max)}`))).toBe(true);

    await user.click(within(standard.container).getByRole('button', { name: 'Radar' }));
    standard.rerender(<HopV55Comparison {...standardProps} mode="radar" />);
    const radar = standard.container.querySelector('svg.hv55-cmp-radar')!;
    expect(radar).not.toBeNull();
    expect(radar.querySelectorAll('.hv55-cmp-radar-axis')).toHaveLength(3);
    expect(standardTable()).toBe(standardBefore);
    const reader = within(standard.container).getByRole('group', { name: 'Lire les valeurs exactes d’un axe du radar' });
    for (const axis of selectedAxes) {
      await user.click(within(reader).getByRole('button', { name: axis.name }));
      const row = standard.container.querySelector(`.hv55-cmp-reader-row[data-axis="${axis.id}"]`)!;
      const exact = {
        scale: row.querySelector('.hv55-cmp-axis-title small')?.textContent,
        aria: row.querySelector('.hv55-cmp-track')?.getAttribute('aria-label'),
        values: [...row.querySelectorAll('.hv55-cmp-value')].map(value => [
          value.getAttribute('data-branch-id'), value.getAttribute('data-series-marker'),
          value.querySelector('.hv55-cmp-sr-only')?.textContent
        ])
      };
      expect(exact, `Le lecteur radar conserve valeurs exactes et unité de ${axis.name}.`).toEqual(standardRows.get(axis.id));
    }

    const sourceRefs = selectedAxes.map(axis => source(`sortie J5 synthétique ${axis.id}`, 'judgment'));
    const sensoryRows = selectedAxes.map((axis, index) => {
      const dim: BrewingSensoryDimension = {
        id: axis.id, version: axis.version, name: axis.name,
        definition: `Axe conservé du résultat J5 synthétique : ${axis.name}.`, sourceRefs: [sourceRefs[index]]
      };
      const metric: BrewingSensoryMetric = {
        id: `fixture-j5-metric-${axis.id}`, version: axis.version, kind: 'modelIndex', name: axis.name,
        meaning: 'Indice du modèle sur cette définition, pas note observée.', unit: 'axisScale', sourceRefs: [sourceRefs[index]]
      };
      const exactScale: BrewingSensoryScale = {
        id: `fixture-j5-scale-${axis.id}`, version: axis.version,
        metricRef: { id: metric.id, version: metric.version }, domain: { min: axis.scale.min, max: axis.scale.max },
        sourceRefs: [sourceRefs[index]]
      };
      const definitionRef = createBrewingSensoryDefinitionReference(dim, metric, exactScale);
      const values: BrewingSensoryComparisonValue[] = branchIds.map(branchId => {
        const estimate = axis.values.find(value => value.branchId === branchId)?.estimate;
        const provenance: BrewingSensoryValueProvenance = {
          sourceRefs: [sourceRefs[index]], modelRef: { id: 'fixture-j5-model', version: 'v1' },
          hypothesisRefs: [result.reference], explanation: 'Valeur conservée du résultat J5 synthétique.',
          limitations: ['Fixture de test, pas une mesure de bière ni une sortie Gemini.']
        };
        if (estimate?.range) return {
          candidateId: branchId, status: 'hypothetical', range: { min: estimate.range.min, max: estimate.range.max },
          ...(estimate.central == null ? {} : { central: estimate.central }), provenance
        };
        if (estimate?.central != null) return { candidateId: branchId, status: 'hypothetical', value: estimate.central, provenance };
        const reason = 'Aucune estimation numérique prise en charge pour cette nuance et cette série.';
        return { candidateId: branchId, status: 'unknown', reason,
          provenance: { sourceRefs: [], explanation: reason, limitations: ['Une inconnue ne devient pas zéro.'] } };
      });
      return { definition: definitionRef, values };
    });
    const sensory = createBrewingSensoryComparison({
      context: { id: result.scenarioId, version: String(result.revision), kind: 'j5Snapshot', contentReference: result.reference,
        label: 'Snapshot J5 fixture · domaines mixtes', sourceRefs: [source('contexte J5 fixture', 'observation')] },
      reference: { id: 'j5-mixed-reference', version: 'v1', kind: 'adoptedReference', contentReference: 'fixture:j5-mixed-reference:v1', sourceRefs: [] },
      candidateOrder: branchIds,
      candidates: [
        { id: 'baseline', name: 'Base J5' }, { id: 'saaz-close', name: 'Option Saaz' }, { id: 'unknown-strain', name: 'Option souche inconnue' }
      ],
      dimensionOrder: sensoryRows.map(row => row.definition.contentReference), dimensions: sensoryRows
    });
    const sensoryView = render(<HopV55SensoryComparison comparison={sensory} result={result} candidateIds={branchIds}
      dimensionIds={sensory.dimensionOrder} mode="radar" onModeChange={vi.fn()} onToggleCandidate={vi.fn()} onToggleDimension={vi.fn()} />);
    expect(sensoryView.container.querySelectorAll('.hv55-sensory-radar-group'),
      'Le même résultat J5 ne fusionne pas des identités métriques propres à chaque axe.').toHaveLength(0);
    const frames = [...sensoryView.container.querySelectorAll('.hv55-sensory-axis-frame')];
    expect(frames).toHaveLength(3);
    expect(frames.map(frame => frame.getAttribute('data-metric-ref'))).toEqual(sensoryRows.map(row => row.definition.metric!.id));
    const sensoryTable = sensoryView.container.querySelector('.hv55-sensory-table-region')!;
    for (const axis of selectedAxes) {
      const row = sensoryTable.querySelector(`[data-reference-group="${sensoryRows[selectedAxes.indexOf(axis)].definition.contentReference}"]`)!;
      expect(row.querySelector('th')).toHaveTextContent(`${frExact(axis.scale.min)}–${frExact(axis.scale.max)} points d’indice`);
      for (const branchId of branchIds) {
        const estimate = axis.values.find(value => value.branchId === branchId)?.estimate;
        if (estimate?.range) {
          expect(estimate.range.min).toBeGreaterThanOrEqual(axis.scale.min);
          expect(estimate.range.max).toBeLessThanOrEqual(axis.scale.max);
          expect(row).toHaveTextContent(`${frExact(estimate.range.min)}–${frExact(estimate.range.max)} points d’indice`);
        } else if (estimate?.central != null) {
          expect(row).toHaveTextContent(`${frExact(estimate.central)} points d’indice`);
        } else {
          expect(row).toHaveTextContent('Inconnu · Aucune estimation numérique prise en charge');
        }
      }
    }
  });
  it('Comparaison · expose deux branches et leurs hypothèses en lecture passive, sans perdre sélection ni mode', async () => {
    const result = mixedDomainJ5Scenario(true);
    const usedBranch = result.branches.find(branch => branch.id === 'assumptions-used')!;
    const proposedBranch = result.branches.find(branch => branch.id === 'assumptions-proposed')!;
    expect(usedBranch.usedAssumptionIds).toEqual(expect.arrayContaining(['fixture-used-zero-dose', 'fixture-used-hop-analogy']));
    expect(proposedBranch.proposedAssumptionIds).toContain('fixture-proposed-range');
    expect(proposedBranch.unappliedAssumptionIds).toContain('fixture-unapplied-null');
    expect(proposedBranch.limitations.length).toBeGreaterThan(0);

    const axes = brewingScenarioViewModel(result).axes.slice(0, 3).map(axis => axis.id);
    const onModeChange = vi.fn();
    const onToggleBranch = vi.fn();
    const onToggleAxis = vi.fn();
    const onChooseBranch = vi.fn();
    const props = {
      result, branchIds: ['assumptions-used', 'assumptions-proposed'], axisIds: axes, mode: 'bars' as const,
      onModeChange, onToggleBranch, onToggleAxis, onChooseBranch
    };
    const user = userEvent.setup();
    const { container, rerender } = render(<HopV55Comparison {...props} />);
    const branchRow = (id: string) => container.querySelector(`.hv55-cmp-branch[data-branch-id="${id}"]`)! as HTMLElement;
    const usedDetails = branchRow('assumptions-used').querySelector('.hv55-branch-assumptions') as HTMLDetailsElement;
    const proposedDetails = branchRow('assumptions-proposed').querySelector('.hv55-branch-assumptions') as HTMLDetailsElement;
    expect(container.querySelectorAll('.hv55-branch-assumptions')).toHaveLength(2);
    expect([...container.querySelectorAll('.hv55-branch-assumptions')].map(details => details.getAttribute('data-assumptions-for-branch')))
      .toEqual(['assumptions-used', 'assumptions-proposed']);

    await user.click(usedDetails.querySelector('summary')!);
    await user.click(proposedDetails.querySelector('summary')!);
    expect(usedDetails.open).toBe(true);
    expect(proposedDetails.open).toBe(true);
    const zeroRow = usedDetails.querySelector('[data-assumption-id="fixture-used-zero-dose"]')!;
    expect(zeroRow).toHaveTextContent('0 g/L');
    expect(zeroRow).toHaveTextContent('Utilisée par le calcul');
    expect(zeroRow).toHaveTextContent('fixture:creuset-compatible:consigne-de-dose');
    expect(zeroRow).not.toHaveTextContent('Centrale explicite');
    expect(usedDetails).toHaveTextContent('Descriptions de houblon');
    expect(usedDetails).toHaveTextContent('mix-domain-hallertau ↔ mix-domain-saaz');
    expect(usedDetails).toHaveTextContent('fixture-used-hop-analogy');
    const usedAnalogyLimit = usedBranch.limitations.find(limit => limit.includes('descripteurs repris localement'))!;
    expect(usedDetails).toHaveTextContent(usedAnalogyLimit);

    const rangeRow = proposedDetails.querySelector('[data-assumption-id="fixture-proposed-range"]')!;
    expect(rangeRow).toHaveTextContent('Proposée · Hypothèse d’assistant');
    expect(rangeRow).toHaveTextContent('Proposée, non appliquée au calcul');
    expect(rangeRow).toHaveTextContent('0,25–0,4 points d’indice');
    expect(rangeRow).toHaveTextContent('fixture:creuset-compatible:plage-de-modèle');
    expect(rangeRow).not.toHaveTextContent('Centrale explicite');
    const nullRow = proposedDetails.querySelector('[data-assumption-id="fixture-unapplied-null"]')!;
    expect(nullRow).toHaveTextContent('Retenue, non utilisée par le calcul');
    expect(nullRow).toHaveTextContent('null explicite °C');
    const cultureLimit = proposedBranch.limitations.find(limit => limit.includes('aucune moyenne de culture'))!;
    expect(proposedDetails).toHaveTextContent(cultureLimit);
    expect([...usedDetails.querySelectorAll('button, input, select, textarea')]).toHaveLength(0);
    expect([...proposedDetails.querySelectorAll('button, input, select, textarea')]).toHaveLength(0);
    expect(onChooseBranch).not.toHaveBeenCalled();
    expect(onToggleBranch).not.toHaveBeenCalled();
    expect(onToggleAxis).not.toHaveBeenCalled();

    await user.click(within(container).getByRole('button', { name: 'Radar' }));
    expect(onModeChange).toHaveBeenLastCalledWith('radar');
    rerender(<HopV55Comparison {...props} mode="radar" />);
    expect(within(container).getByRole('button', { name: 'Radar' })).toHaveAttribute('aria-pressed', 'true');
    expect(usedDetails.open).toBe(true);
    expect(proposedDetails.open).toBe(true);
    expect((branchRow('assumptions-used').querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);
    expect((branchRow('assumptions-proposed').querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);

    await user.click(branchRow('assumptions-proposed').querySelector('input[type="checkbox"]')!);
    expect(onToggleBranch).toHaveBeenCalledWith('assumptions-proposed');
    rerender(<HopV55Comparison {...props} branchIds={['assumptions-used']} mode="radar" />);
    expect(branchRow('assumptions-proposed').querySelector('input[type="checkbox"]')).not.toBeChecked();
    expect(branchRow('assumptions-proposed').querySelector('.hv55-branch-assumptions')).toBeNull();
    expect(branchRow('assumptions-used').querySelector('.hv55-branch-assumptions')).toHaveAttribute('open');
    expect(within(container).getByRole('button', { name: 'Radar' })).toHaveAttribute('aria-pressed', 'true');
    expect(onChooseBranch).not.toHaveBeenCalled();
  });

  it('Sensory · montre les hypothèses de sourceResult exactes, jamais celles de la référence adoptée ou d’un contexte différent', async () => {
    const result = mixedDomainJ5Scenario(true);
    const comparison = assumptionsSensoryComparison(result);
    const candidateIds = ['assumptions-used', 'assumptions-proposed', 'adopted-reference'];
    const onModeChange = vi.fn();
    const onToggleCandidate = vi.fn();
    const onToggleDimension = vi.fn();
    const onChooseCandidate = vi.fn();
    const props = { comparison, result, candidateIds, dimensionIds: comparison.dimensionOrder, mode: 'bars' as const,
      onModeChange, onToggleCandidate, onToggleDimension, onChooseCandidate, selectedCandidateId: 'assumptions-used' };
    const user = userEvent.setup();
    const exact = render(<HopV55SensoryComparison {...props} />);
    const disclosures = [...exact.container.querySelectorAll('.hv55-branch-assumptions')];
    expect(disclosures).toHaveLength(2);
    expect(disclosures.map(details => details.getAttribute('data-assumptions-for-branch'))).toEqual(['assumptions-used', 'assumptions-proposed']);
    const usedDetails = exact.container.querySelector('.hv55-branch-assumptions[data-assumptions-for-branch="assumptions-used"]') as HTMLDetailsElement;
    const proposedDetails = exact.container.querySelector('.hv55-branch-assumptions[data-assumptions-for-branch="assumptions-proposed"]') as HTMLDetailsElement;
    const referenceCheckbox = screen.getByRole('checkbox', { name: 'Comparer Référence adoptée' });
    expect(referenceCheckbox).toBeChecked();
    expect(referenceCheckbox.closest('.hv55-sensory-candidate')?.querySelector('.hv55-branch-assumptions')).toBeNull();

    await user.click(usedDetails.querySelector('summary')!);
    await user.click(proposedDetails.querySelector('summary')!);
    expect(usedDetails).toHaveTextContent('0 g/L');
    expect(proposedDetails).toHaveTextContent('0,25–0,4 points d’indice');
    expect(onChooseCandidate).not.toHaveBeenCalled();
    expect(onToggleCandidate).not.toHaveBeenCalled();
    expect(onToggleDimension).not.toHaveBeenCalled();

    await user.click(within(exact.container).getByRole('button', { name: 'Radar' }));
    expect(onModeChange).toHaveBeenLastCalledWith('radar');
    exact.rerender(<HopV55SensoryComparison {...props} mode="radar" />);
    expect(usedDetails.open).toBe(true);
    expect(proposedDetails.open).toBe(true);
    expect([...exact.container.querySelectorAll('.hv55-sensory-candidate input')].filter(input => (input as HTMLInputElement).checked)).toHaveLength(3);
    expect(within(exact.container).getByRole('button', { name: 'Radar' })).toHaveAttribute('aria-pressed', 'true');
    expect(onChooseCandidate).not.toHaveBeenCalled();

    const mismatch = (patch: Partial<BrewingSensoryComparisonDTO['context']>) => createBrewingSensoryComparison({
      context: { ...comparison.context, ...patch }, reference: comparison.reference,
      candidateOrder: comparison.candidateOrder, candidates: comparison.candidates,
      dimensionOrder: comparison.dimensionOrder,
      dimensions: comparison.dimensions.map(dimension => ({ definition: dimension.definition, values: dimension.values }))
    });
    const mismatchedContexts = [
      mismatch({ id: 'other-scenario' }),
      mismatch({ version: String(result.revision + 1) }),
      mismatch({ contentReference: 'fixture:wrong-result-reference' })
    ];
    for (const mismatched of mismatchedContexts) {
      const mismatchView = render(<HopV55SensoryComparison {...props} comparison={mismatched} mode="bars" />);
      expect(mismatchView.container.querySelectorAll('.hv55-branch-assumptions')).toHaveLength(0);
      mismatchView.unmount();
    }
  });
});

