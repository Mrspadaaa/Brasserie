import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import {
  createBrewingSensoryComparison,
  createBrewingSensoryDefinitionReference,
  type BrewingSensoryComparisonDTO,
  type BrewingSensoryComparisonValue,
  type BrewingSensoryDefinitionReference,
  type BrewingSensoryDimension,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
  type BrewingSensoryValueProvenance
} from '../../src/domain/brewingSensory';
import { simulateBrewingScenario, type BrewingScenarioResult } from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55SensoryComparison } from '../../src/ui/hopV55/SensoryComparison';

afterEach(cleanup);

const source = (title: string, kind: HopSource['kind'] = 'research'): HopSource => ({
  title, author: 'Fixture sensorielle', year: 2026, kind, reference: `fixture:${title}`
});
const panelSource = source('panel notes', 'observation');
const modelSource = source('hypothèse de modèle', 'judgment');
const physicalSource = source('mesures analytiques', 'research');

const citrus: BrewingSensoryDimension = {
  id: 'citrus', version: 'fine-v1', name: 'Agrumes',
  definition: 'Nuance sensorielle d’agrumes.', sourceRefs: [source('définition agrumes', 'judgment')], terms: ['agrumes', 'citrus']
};
const pear: BrewingSensoryDimension = {
  id: 'pear', version: 'fine-v1', name: 'Poire',
  definition: 'Mention de poire dans une description source.', sourceRefs: [source('définition poire', 'judgment')], terms: ['poire', 'pear']
};
const bitterness: BrewingSensoryDimension = {
  id: 'bitterness-measure', version: 'measure-v1', name: 'Amertume mesurée',
  definition: 'Mesure chimique conservée à part du profil sensoriel.', sourceRefs: [physicalSource]
};
const dose: BrewingSensoryDimension = {
  id: 'dose-measure', version: 'measure-v1', name: 'Dose d’ajout',
  definition: 'Quantité appliquée au programme.', sourceRefs: [physicalSource]
};
const unscaled: BrewingSensoryDimension = {
  id: 'unscaled-index', version: 'v1', name: 'Indice sans domaine',
  definition: 'Indice fourni sans borne d’échelle.', sourceRefs: [modelSource]
};

const panelMetric: BrewingSensoryMetric = {
  id: 'panel-note', version: 'panel-2018', kind: 'ordinalNote', name: 'Note de panel',
  meaning: 'Intensité déclarée par le panel.', unit: 'points', sourceRefs: [source('métrique de panel')]
};
const indexMetric: BrewingSensoryMetric = {
  id: 'sensory-index', version: 'model-v3', kind: 'modelIndex', name: 'Indice projeté',
  meaning: 'Indice hypothétique d’intensité sensorielle.', unit: 'axisScale', sourceRefs: [modelSource]
};
const ibuMetric: BrewingSensoryMetric = {
  id: 'ibu-measurement', version: 'v1', kind: 'measurement', name: 'IBU final',
  meaning: 'Mesure analytique de l’amertume de bière.', unit: 'IBU', sourceRefs: [physicalSource]
};
const doseMetric: BrewingSensoryMetric = {
  id: 'dose-measurement', version: 'v1', kind: 'measurement', name: 'Dose par volume',
  meaning: 'Quantité d’ajout par volume de moût.', unit: 'g/L', sourceRefs: [physicalSource]
};
const unscaledMetric: BrewingSensoryMetric = {
  id: 'unscaled-metric', version: 'v1', kind: 'modelIndex', name: 'Indice non étalonné',
  meaning: 'Valeur conservée sans domaine numérique publié.', unit: 'indice', sourceRefs: [modelSource]
};

const scale = (id: string, version: string, metric: BrewingSensoryMetric, domain: BrewingSensoryScale['domain'], sourceRef: HopSource = source(`${id} scale`)): BrewingSensoryScale => ({
  id, version, metricRef: { id: metric.id, version: metric.version }, domain,
  ...(domain?.min === 0 && domain.max === 5 ? { labels: [{ value: 0, label: 'Absente' }, { value: 5, label: 'Très nette' }] } : {}),
  sourceRefs: [sourceRef]
});

const panelReference = createBrewingSensoryDefinitionReference(citrus, panelMetric, scale('panel-0-5', '2018', panelMetric, { min: 0, max: 5 }));
const indexReference = createBrewingSensoryDefinitionReference(citrus, indexMetric, scale('model-0-100', 'v3', indexMetric, { min: 0, max: 100 }));
const pearReference = createBrewingSensoryDefinitionReference(pear);
const ibuReference = createBrewingSensoryDefinitionReference(bitterness, ibuMetric, scale('ibu-domain', 'v1', ibuMetric, { min: 0, max: 50 }, physicalSource));
const doseReference = createBrewingSensoryDefinitionReference(dose, doseMetric, scale('dose-domain', 'v1', doseMetric, { min: 0, max: 10 }, physicalSource));
const unscaledReference = createBrewingSensoryDefinitionReference(unscaled, unscaledMetric, scale('no-domain', 'v1', unscaledMetric, null, modelSource));

const explanation = (text: string, refs: HopSource[] = [panelSource]): BrewingSensoryValueProvenance => ({ sourceRefs: refs, explanation: text, limitations: [] });
const point = (candidateId: string, status: 'observed' | 'hypothetical' | 'target', value: number, provenance = explanation('Valeur source exacte.')) => ({ candidateId, status, value, provenance });
const interval = (candidateId: string, status: 'observed' | 'hypothetical' | 'target', min: number, max: number, central?: number,
  provenance = explanation('Plage source déclarée.')) => ({ candidateId, status, range: { min, max }, ...(central !== undefined ? { central } : {}), provenance });
const unknown = (candidateId: string, reason: string) => ({ candidateId, status: 'unknown' as const, reason, provenance: explanation(reason, []) });
const nonDocumented = (candidateId: string) => ({ candidateId, status: 'nonDocumented' as const,
  reason: 'Aucune description source ne mentionne cette nuance.', provenance: explanation('Absence de mention, sans inférence d’intensité.', []) });
const documented = (candidateId: string) => ({
  candidateId, status: 'documented' as const,
  mentions: [{ dimensionRef: { id: pear.id, version: pear.version }, lexicalRuleRef: { id: 'fr-pear', version: 'v2' }, term: 'poire',
    context: 'rawHop' as const, text: 'Arômes décrits : poire mûre.', source: source('fiche houblon poire', 'manufacturer'),
    qualification: 'affirmed' as const }],
  provenance: explanation('La mention lexicale source est conservée, sans conversion en score.', [source('fiche houblon poire', 'manufacturer')])
});

function createFixture(): BrewingSensoryComparisonDTO {
  const candidates = [
    { id: 'panel-zero', name: 'Observation à zéro' },
    { id: 'small-a', name: 'Plage A' },
    { id: 'small-b', name: 'Plage B' },
    { id: 'fine-model', name: 'Projection fine' },
    { id: 'documentary', name: 'Candidat documentaire' }
  ];
  const candidateOrder = candidates.map(candidate => candidate.id);
  const dimensions = [
    { definition: panelReference, values: [
      point('panel-zero', 'observed', 0, explanation('Note de panel réellement observée à zéro.', [panelSource])),
      interval('small-a', 'observed', 2.1, 2.2, 2.18, explanation('Plage observée courte.', [panelSource])),
      interval('small-b', 'observed', 2.15, 2.25, 2.23, explanation('Plage observée recouvrante.', [panelSource])),
      unknown('fine-model', 'Aucune note de panel n’est enregistrée pour cette projection.'),
      nonDocumented('documentary')
    ] },
    { definition: indexReference, values: [
      unknown('panel-zero', 'Aucun indice de modèle n’est fourni pour cette observation.'),
      unknown('small-a', 'Aucun indice de modèle n’est fourni pour cette observation.'),
      unknown('small-b', 'Aucun indice de modèle n’est fourni pour cette observation.'),
      interval('fine-model', 'hypothetical', 0, 100, undefined,
        { sourceRefs: [modelSource], modelRef: { id: 'fine-model', version: 'v3' }, hypothesisRefs: ['plan-fixture-v1'],
          explanation: 'Enveloppe hypothétique entière, conservée sans la rétrécir.', limitations: ['Aucune couverture statistique revendiquée.'] }),
      unknown('documentary', 'Aucune projection chiffrée pour cette entrée.')
    ] },
    { definition: pearReference, values: [
      nonDocumented('panel-zero'), unknown('small-a', 'Aucune extraction pour ce candidat.'), unknown('small-b', 'Aucune extraction pour ce candidat.'),
      unknown('fine-model', 'Aucune extraction pour ce candidat.'), documented('documentary')
    ] },
    { definition: ibuReference, values: [
      point('panel-zero', 'observed', 23.4, explanation('IBU analytique observé; l’unité reste IBU.', [physicalSource])),
      unknown('small-a', 'Aucune mesure IBU fournie.'), unknown('small-b', 'Aucune mesure IBU fournie.'),
      unknown('fine-model', 'Aucune mesure IBU pour la projection.'), unknown('documentary', 'Aucune mesure IBU fournie.')
    ] },
    { definition: doseReference, values: [
      point('panel-zero', 'observed', 4.2, explanation('Dose du programme, distincte d’une intensité aromatique.', [physicalSource])),
      unknown('small-a', 'Aucune dose fournie.'), unknown('small-b', 'Aucune dose fournie.'),
      unknown('fine-model', 'Dose non renseignée pour cette projection.'), unknown('documentary', 'Aucune dose fournie.')
    ] },
    { definition: unscaledReference, values: [
      unknown('panel-zero', 'Aucun indice fourni.'), unknown('small-a', 'Aucun indice fourni.'), unknown('small-b', 'Aucun indice fourni.'),
      interval('fine-model', 'hypothetical', 3, 4, 3.4,
        { sourceRefs: [modelSource], modelRef: { id: 'unscaled-fixture', version: 'v1' }, hypothesisRefs: ['unscaled-plan'],
          explanation: 'Valeurs conservées avec domaine non défini.', limitations: ['Aucune position graphique inventée.'] }),
      unknown('documentary', 'Aucun indice fourni.')
    ] }
  ];
  const contextSource = source('contexte de dégustation', 'observation');
  const referenceSource = source('référence de comparaison', 'judgment');
  return createBrewingSensoryComparison({
    context: { id: 'beer-context', version: 'v4', kind: 'beer', contentReference: 'context-fixture-v4', label: 'Pale ale dégustée', sourceRefs: [contextSource] },
    reference: { id: 'comparison-root', version: 'r2', kind: 'savedReference', contentReference: 'reference-fixture-r2', sourceRefs: [referenceSource] },
    candidateOrder, candidates, dimensionOrder: dimensions.map(dimension => dimension.definition.contentReference), dimensions
  });
}

const comparison = createFixture();
const dimensionIds = comparison.dimensionOrder;

function sourceProgramResult(): BrewingScenarioResult {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  const current = prepared.runtime.current;
  if (!current?.program || current.program.additions.length < 2) throw new Error('La fixture source doit porter deux lignes de programme.');
  const program = structuredClone(current.program);
  program.additions[0].status = 'performed';
  program.additions[1].status = 'planned';
  prepared.runtime.current = { ...current, program, performedAdditionIds: [program.additions[0].id] };
  const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'sensory-scope-fixture', revision: 1, branches: [],
    intent: { question: 'Portée de la projection du programme source.', criteria: [] } });
  return simulateBrewingScenario(request, prepared.runtime);
}

function sourceComparison(result: BrewingScenarioResult, baselineObservation = false): BrewingSensoryComparisonDTO {
  const candidates = [
    { id: 'baseline', name: 'État courant' },
    { id: 'option-a', name: 'Option A' },
    { id: 'adopted-reference', name: 'Référence NR R2' }
  ];
  const dimensions = comparison.dimensions.map(dimension => ({
    definition: dimension.definition,
    values: candidates.map(candidate => {
      const sourceId = candidate.id === 'baseline'
        ? baselineObservation && dimension.definition.metric?.kind === 'ordinalNote' ? 'panel-zero' : 'fine-model'
        : candidate.id === 'option-a' ? 'small-a' : 'documentary';
      const sourceValue = dimension.values.find(value => value.candidateId === sourceId);
      if (!sourceValue) throw new Error(`Valeur fixture absente pour ${candidate.id}.`);
      return { ...structuredClone(sourceValue), candidateId: candidate.id } as BrewingSensoryComparisonValue;
    })
  }));
  return createBrewingSensoryComparison({
    context: { id: result.scenarioId, version: String(result.revision), kind: 'j5Snapshot', contentReference: result.reference,
      label: 'Snapshot J5 source', sourceRefs: [] },
    reference: { id: 'adopted-reference-fixture', version: '2', kind: 'adoptedReference', contentReference: 'reference-r2-fixture', sourceRefs: [source('NR R2', 'judgment')] },
    candidateOrder: candidates.map(candidate => candidate.id), candidates,
    dimensionOrder: dimensions.map(dimension => dimension.definition.contentReference), dimensions
  });
}

function defaultProps(overrides: Partial<React.ComponentProps<typeof HopV55SensoryComparison>> = {}) {
  return {
    comparison,
    candidateIds: comparison.candidateOrder,
    dimensionIds,
    mode: 'bars' as const,
    onModeChange: vi.fn(),
    onToggleCandidate: vi.fn(),
    onToggleDimension: vi.fn(),
    onChooseCandidate: vi.fn(),
    selectedCandidateId: 'panel-zero',
    ...overrides
  };
}

describe('Comparaison sensorielle V5.5', () => {
  it('sépare le 0 observé sur 5 de l’indice hypothétique 0–100 et garde les mesures au tableau', () => {
    const props = defaultProps({ mode: 'radar' });
    const { container } = render(<HopV55SensoryComparison {...props} />);

    const radarGroups = container.querySelectorAll('.hv55-sensory-radar-group');
    expect(radarGroups).toHaveLength(2);
    expect(radarGroups[0]).toHaveAttribute('data-metric-ref', 'panel-note');
    expect(radarGroups[0]).toHaveAttribute('data-scale-ref', 'panel-0-5');
    expect(radarGroups[1]).toHaveAttribute('data-metric-ref', 'sensory-index');
    expect(radarGroups[1]).toHaveAttribute('data-scale-ref', 'model-0-100');
    expect(container.querySelector('[data-metric-ref="ibu-measurement"]')).toBeNull();
    expect(container.querySelector('[data-metric-ref="dose-measurement"]')).toBeNull();
    expect(container.querySelector('[data-metric-ref="unscaled-metric"]')).toBeNull();
    expect(container.querySelector('[data-reference-group="not-an-axis"]')).toBeNull();

    const table = container.querySelector('.hv55-sensory-table-region')!;
    const panelRow = table.querySelector(`[data-reference-group="${comparison.dimensions[0].referenceGroupId}"]`)!;
    expect(panelRow.querySelectorAll('td')[0]).toHaveTextContent('Observé · 0 points');
    const indexRow = table.querySelector(`[data-reference-group="${comparison.dimensions[1].referenceGroupId}"]`)!;
    expect(indexRow.querySelectorAll('td')[3]).toHaveTextContent('Projection hypothétique · 0–100 points d’indice · centrale non fournie');
    expect(indexRow.querySelectorAll('td')[3]).not.toHaveTextContent('hypothetical');
    expect(indexRow.querySelectorAll('td')[3]).toHaveTextContent('centrale non fournie');
    const indexChart = container.querySelector('.hv55-sensory-chart-group[data-metric-ref="sensory-index"]')!;
    expect(indexChart.querySelector('.hv55-sensory-chart-group-heading')).toHaveTextContent('points d’indice');
    expect(indexChart.querySelector('.hv55-sensory-chart-group-heading')).not.toHaveTextContent('sensory-index');
    expect(comparison.dimensions[1].definition.metric?.unit).toBe('axisScale');
    expect(indexRow.querySelector('.hv55-sensory-definition-details')).toHaveTextContent('code déclaré axisScale');
    expect(table).toHaveTextContent('23,4 IBU');
    expect(table).toHaveTextContent('4,2 g/L');
    expect(container.querySelector('.hv55-sensory-radar-point')).not.toBeNull();
  });

  it('garde la mention qualitative, la non-mention et l’inconnu distincts sans points graphiques', async () => {
    const pearId = comparison.dimensions[2].referenceGroupId;
    const panelId = comparison.dimensions[0].referenceGroupId;
    const { container } = render(<HopV55SensoryComparison {...defaultProps({ mode: 'radar', dimensionIds: [panelId, pearId] })} />);
    const panelRadar = container.querySelector('.hv55-sensory-radar-group[data-metric-ref="panel-note"]')!;
    const unknownSeries = panelRadar.querySelector('g[data-candidate-id="fine-model"]')!;
    expect(unknownSeries.querySelector('.hv55-sensory-radar-point')).toBeNull();
    expect(panelRadar).toHaveTextContent('inconnu');
    expect(container).not.toHaveTextContent('3/5');
    expect(container).toHaveTextContent('Mention documentée · lecture qualitative, sans valeur chiffrée.');
    expect(container).toHaveTextContent('Non documenté');
    expect(container).toHaveTextContent('Inconnu');

    const qualitativeRow = container.querySelector(`[data-reference-group="${pearId}"]`)!;
    const provenance = qualitativeRow.querySelectorAll('td')[4].querySelector('.hv55-sensory-provenance')!;
    await userEvent.setup().click(provenance.querySelector('summary')!);
    expect(provenance).toHaveTextContent('Arômes décrits : poire mûre.');
    expect(provenance).toHaveTextContent('fixture:fiche houblon poire');
  });

  it('garde les groupes d’échelle, valeurs, contexte, sources et sélections en basculant dans les deux sens', async () => {
    const props = defaultProps();
    const user = userEvent.setup();
    const { rerender, container } = render(<HopV55SensoryComparison {...props} />);
    const table = () => container.querySelector('.hv55-sensory-table-region')!.textContent;
    const references = container.querySelector('.hv55-sensory-reference-details')!;
    await user.click(references.querySelector('summary')!);
    expect(references).toHaveTextContent('context-fixture-v4');
    expect(references).toHaveTextContent('fixture:contexte de dégustation');
    const panelRow = container.querySelector(`.hv55-sensory-table-region [data-reference-group="${comparison.dimensions[0].referenceGroupId}"]`)!;
    const panelCell = panelRow.querySelectorAll('td')[0];
    await user.click(panelCell.querySelector('.hv55-sensory-provenance summary')!);
    expect(panelCell).toHaveTextContent('fixture:panel notes');
    const initialTable = table();
    expect(container.querySelector('.hv55-sensory-header p')).toHaveTextContent('Pale ale dégustée');
    expect(container).toHaveTextContent('reference-fixture-r2');

    await user.click(screen.getByRole('button', { name: 'Radar' }));
    expect(props.onModeChange).toHaveBeenLastCalledWith('radar');
    expect(props.onToggleCandidate).not.toHaveBeenCalled();
    expect(props.onToggleDimension).not.toHaveBeenCalled();
    expect(props.onChooseCandidate).not.toHaveBeenCalled();
    rerender(<HopV55SensoryComparison {...props} mode="radar" />);
    expect(screen.getByRole('img', { name: /Radar · Note de panel/ })).toBeInTheDocument();
    expect(table()).toBe(initialTable);
    expect(screen.getByRole('checkbox', { name: /Comparer Observation à zéro/ })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Barres' }));
    expect(props.onModeChange).toHaveBeenLastCalledWith('bars');
    rerender(<HopV55SensoryComparison {...props} mode="bars" />);
    expect(table()).toBe(initialTable);
    expect(screen.getByRole('checkbox', { name: /Comparer Projection fine/ })).toBeChecked();

    const candidateToggle = screen.getByRole('checkbox', { name: /Comparer Projection fine/ });
    await user.click(candidateToggle);
    expect(props.onToggleCandidate).toHaveBeenCalledWith('fine-model');
    const chosen = screen.getByRole('checkbox', { name: /Comparer Observation à zéro/ }).closest('.hv55-sensory-candidate') as HTMLElement;
    await user.click(within(chosen).getByRole('button', { name: 'Choix courant' }));
    expect(props.onChooseCandidate).toHaveBeenCalledWith('panel-zero');
    const dimToggle = screen.getByRole('checkbox', { name: /Indice projeté/ });
    await user.click(dimToggle);
    expect(props.onToggleDimension).toHaveBeenCalledWith(comparison.dimensions[1].referenceGroupId);
  });

  it('place le premier profil avant les filtres et garde les noms/statuts visibles avec les références au détail', async () => {
    const { container } = render(<HopV55SensoryComparison {...defaultProps()} />);
    const chart = container.querySelector('.hv55-sensory-chart-group')!;
    const filters = container.querySelector('.hv55-sensory-selection')!;
    expect(chart.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const legend = container.querySelector('.hv55-sensory-legend')!;
    expect(legend).toHaveTextContent('Observation à zéro');
    expect(legend).toHaveTextContent('Observé');
    expect(legend).toHaveTextContent('Inconnu');
    const exactValues = container.querySelector('.hv55-sensory-table-region')!;
    expect(exactValues.querySelector('thead')).not.toHaveTextContent('panel-zero');

    const references = container.querySelector('.hv55-sensory-candidate-references')!;
    expect(references).not.toHaveAttribute('open');
    await userEvent.setup().click(references.querySelector('summary')!);
    expect(references).toHaveTextContent('panel-zero');
    expect(references).toHaveTextContent('Observation à zéro');
  });

  it('garde les petites plages recouvrantes exactes, la centrale fournie et la plage complète', () => {
    const { container } = render(<HopV55SensoryComparison {...defaultProps()} />);
    const panelRow = container.querySelector(`[data-reference-group="${comparison.dimensions[0].referenceGroupId}"]`)!;
    expect(panelRow).toHaveTextContent('2,1–2,2 points · centrale 2,18 points');
    expect(panelRow).toHaveTextContent('2,15–2,25 points · centrale 2,23 points');
    expect(2.18).not.toBe((2.1 + 2.2) / 2);

    const fullScaleGroup = container.querySelector('.hv55-sensory-chart-group[data-metric-ref="sensory-index"]')!;
    const fullRange = fullScaleGroup.querySelector('.hv55-sensory-range.hv55-sensory-hypothetical') as HTMLElement;
    expect(fullRange.style.left).toBe('0%');
    expect(fullRange.style.width).toBe('100%');
    expect(fullScaleGroup).toHaveTextContent('0–100 points d’indice');
    expect(fullScaleGroup.querySelector('.hv55-sensory-central')).toBeNull();
  });

  it('qualifie la baseline J5 depuis son programme exact sans transformer une note observée en hypothèse', async () => {
    const result = sourceProgramResult();
    const projected = sourceComparison(result);
    const modelDimension = projected.dimensions.find(dimension => dimension.definition.metric?.kind === 'modelIndex')!;
    const common = { result, comparison: projected, candidateIds: projected.candidateOrder, dimensionIds: [modelDimension.referenceGroupId] };
    const { rerender, container } = render(<HopV55SensoryComparison {...defaultProps(common)} />);
    expect(screen.getByRole('checkbox', { name: 'Comparer Projection du profil total du programme source · après les ajouts prévus' })).toBeChecked();
    expect(container).not.toHaveTextContent('Comparer État courant');
    expect(container).toHaveTextContent('Projection hypothétique · 0–100 points d’indice');
    const modelRow = container.querySelector(`.hv55-sensory-table-region [data-reference-group="${modelDimension.referenceGroupId}"]`)!;
    const before = modelRow.textContent;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Radar' }));
    rerender(<HopV55SensoryComparison {...defaultProps({ ...common, mode: 'radar' })} />);
    expect(container.querySelector(`.hv55-sensory-table-region [data-reference-group="${modelDimension.referenceGroupId}"]`)!.textContent).toBe(before);

    const observedComparison = sourceComparison(result, true);
    const panelDimension = observedComparison.dimensions.find(dimension => dimension.definition.metric?.kind === 'ordinalNote')!;
    const observedProps = defaultProps({ result, comparison: observedComparison, candidateIds: observedComparison.candidateOrder,
      dimensionIds: [panelDimension.referenceGroupId, modelDimension.referenceGroupId] });
    const observedView = render(<HopV55SensoryComparison {...observedProps} />);
    expect(screen.getByRole('checkbox', { name: 'Comparer Série J5 du programme source' })).toBeChecked();
    const observedPanelCell = observedView.container.querySelector(`.hv55-sensory-table-region [data-reference-group="${panelDimension.referenceGroupId}"]`)!.querySelectorAll('td')[0];
    const projectedModelCell = observedView.container.querySelector(`.hv55-sensory-table-region [data-reference-group="${modelDimension.referenceGroupId}"]`)!.querySelectorAll('td')[0];
    expect(observedPanelCell).toHaveTextContent('Observé · 0 points');
    expect(projectedModelCell).toHaveTextContent('Projection hypothétique · 0–100 points d’indice');
  });
});
