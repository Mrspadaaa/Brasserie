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

const tropical: BrewingSensoryDimension = {
  id: 'tropical', version: 'fine-v1', name: 'Fruits tropicaux',
  definition: 'Nuance sensorielle de fruits tropicaux.', sourceRefs: [source('définition tropical', 'judgment')], terms: ['tropical']
};
const floral: BrewingSensoryDimension = {
  id: 'floral', version: 'fine-v1', name: 'Floral',
  definition: 'Nuance sensorielle florale.', sourceRefs: [source('définition floral', 'judgment')], terms: ['floral']
};

/** Synthetic overlap case: A and B overlap on the same axes, A never has a central value. Not a beer measurement. */
function overlapFixture(): BrewingSensoryComparisonDTO {
  const panelScale = scale('panel-0-5', '2018', panelMetric, { min: 0, max: 5 });
  const [citrusRef, tropicalRef, floralRef] = [citrus, tropical, floral]
    .map(dimension => createBrewingSensoryDefinitionReference(dimension, panelMetric, panelScale));
  const hypothesis = (text: string): BrewingSensoryValueProvenance => ({
    sourceRefs: [modelSource], modelRef: { id: 'overlap-fixture', version: 'v1' }, hypothesisRefs: ['overlap-plan-v1'],
    explanation: text, limitations: ['Plage synthétique de test, pas une mesure de bière.']
  });
  const candidates = [
    { id: 'start', name: 'Observation de départ' },
    { id: 'option-a', name: 'Option A' },
    { id: 'option-b', name: 'Option B' }
  ];
  const dimensions = [
    { definition: citrusRef, values: [
      point('start', 'observed', 2),
      interval('option-a', 'hypothetical', 2.1, 2.6, undefined, hypothesis('Plage A sans centrale.')),
      interval('option-b', 'hypothetical', 2.3, 2.8, 2.5, hypothesis('Plage B recouvrante.'))
    ] },
    { definition: tropicalRef, values: [
      point('start', 'observed', 1.3),
      interval('option-a', 'hypothetical', 1, 1.5, undefined, hypothesis('Plage A sans centrale.')),
      interval('option-b', 'hypothetical', 1.2, 1.6, 1.4, hypothesis('Plage B recouvrante.'))
    ] },
    { definition: floralRef, values: [
      point('start', 'observed', 3),
      unknown('option-a', 'Aucune projection florale pour A.'),
      interval('option-b', 'hypothetical', 3, 3.5, 3.2, hypothesis('Plage B seule.'))
    ] }
  ];
  return createBrewingSensoryComparison({
    context: { id: 'beer-context', version: 'v4', kind: 'beer', contentReference: 'context-overlap-v4', label: 'Pale ale de test', sourceRefs: [source('contexte overlap', 'observation')] },
    reference: { id: 'comparison-root', version: 'r2', kind: 'savedReference', contentReference: 'reference-overlap-r2', sourceRefs: [source('référence overlap', 'judgment')] },
    candidateOrder: candidates.map(candidate => candidate.id), candidates,
    dimensionOrder: dimensions.map(dimension => dimension.definition.contentReference), dimensions
  });
}

type Segment = { x1: number; y1: number; x2: number; y2: number };
const segmentOf = (line: Element): Segment => ({
  x1: Number(line.getAttribute('x1')), y1: Number(line.getAttribute('y1')),
  x2: Number(line.getAttribute('x2')), y2: Number(line.getAttribute('y2'))
});

/** True when two drawn ranges share the same visible trace: parallel, on the same line and overlapping. */
function sameTrace(a: Segment, b: Segment): boolean {
  const da = { x: a.x2 - a.x1, y: a.y2 - a.y1 };
  const db = { x: b.x2 - b.x1, y: b.y2 - b.y1 };
  const la = Math.hypot(da.x, da.y), lb = Math.hypot(db.x, db.y);
  if (la < 1e-6 && lb < 1e-6) return Math.hypot(a.x1 - b.x1, a.y1 - b.y1) < 1;
  const [ref, refDir, refLen, other, otherDir, otherLen] = la >= lb ? [a, da, la, b, db, lb] as const : [b, db, lb, a, da, la] as const;
  const cross = (u: { x: number; y: number }, v: { x: number; y: number }) => u.x * v.y - u.y * v.x;
  if (otherLen > 1e-6 && Math.abs(cross(refDir, otherDir)) / (refLen * otherLen) > 1e-3) return false;
  const distance = Math.abs(cross(refDir, { x: other.x1 - ref.x1, y: other.y1 - ref.y1 })) / refLen;
  if (distance >= 1) return false;
  const project = (x: number, y: number) => ((x - ref.x1) * refDir.x + (y - ref.y1) * refDir.y) / refLen;
  const p1 = project(other.x1, other.y1), p2 = project(other.x2, other.y2);
  const overlap = Math.min(refLen, Math.max(p1, p2)) - Math.max(0, Math.min(p1, p2));
  return overlap > 0.5;
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
  it('sépare le 0 observé sur 5 de l’indice hypothétique 0–100, sans radar d’un seul axe, et nomme les mesures gardées au tableau', () => {
    const props = defaultProps({ mode: 'radar' });
    const { container } = render(<HopV55SensoryComparison {...props} />);

    expect(container.querySelectorAll('.hv55-sensory-radar-group'), 'Un cadre d’une seule nuance n’est jamais présenté comme un radar de profil.').toHaveLength(0);
    expect(container.querySelector('svg.hv55-sensory-radar')).toBeNull();
    const axisFrames = container.querySelectorAll('.hv55-sensory-axis-frame');
    expect(axisFrames).toHaveLength(2);
    expect(axisFrames[0]).toHaveAttribute('data-metric-ref', 'panel-note');
    expect(axisFrames[0]).toHaveAttribute('data-scale-ref', 'panel-0-5');
    expect(axisFrames[0]).toHaveAttribute('data-axis-count', '1');
    expect(axisFrames[1]).toHaveAttribute('data-metric-ref', 'sensory-index');
    expect(axisFrames[1]).toHaveAttribute('data-scale-ref', 'model-0-100');
    expect(container.querySelector('.hv55-sensory-axis-reading')).toHaveTextContent('Une forme de profil exige au moins trois nuances de même métrique et de même échelle déclarées.');
    expect(container.querySelector('.hv55-sensory-frame-summary')).toHaveTextContent('Radar : aucune forme de profil · 2 nuances en lecture par axe · 4 nuances au tableau seulement.');
    const zeroPoint = axisFrames[0].querySelector('.hv55-sensory-lane[data-candidate-id="panel-zero"] .hv55-sensory-point') as HTMLElement;
    expect(zeroPoint.style.left, 'Le 0 observé reste à la borne basse de sa propre échelle 0–5.').toBe('0%');
    expect(container.querySelector('[data-metric-ref="ibu-measurement"]')).toBeNull();
    expect(container.querySelector('[data-metric-ref="dose-measurement"]')).toBeNull();
    expect(container.querySelector('[data-metric-ref="unscaled-metric"]')).toBeNull();
    expect(container.querySelector('[data-reference-group="not-an-axis"]')).toBeNull();
    const unplotted = (index: number) => container.querySelector(`.hv55-sensory-unplotted [data-unplotted-reference="${comparison.dimensions[index].referenceGroupId}"]`);
    expect(unplotted(2)).toHaveTextContent('Poire · mention qualitative, sans métrique ni échelle chiffrée');
    expect(unplotted(3)).toHaveTextContent('Amertume mesurée · mesure en IBU : grandeur physique gardée hors des profils sensoriels');
    expect(unplotted(4)).toHaveTextContent('Dose d’ajout · mesure en g/L : grandeur physique gardée hors des profils sensoriels');
    expect(unplotted(5)).toHaveTextContent('Indice sans domaine · domaine d’échelle non défini');

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
    expect(container.querySelector('.hv55-sensory-radar-point'), 'Aucun point radar n’est posé sur une spoke isolée.').toBeNull();
  });

  it('garde la mention qualitative, la non-mention et l’inconnu distincts sans points graphiques', async () => {
    const pearId = comparison.dimensions[2].referenceGroupId;
    const panelId = comparison.dimensions[0].referenceGroupId;
    const { container } = render(<HopV55SensoryComparison {...defaultProps({ mode: 'radar', dimensionIds: [panelId, pearId] })} />);
    expect(container.querySelector('.hv55-sensory-radar-group')).toBeNull();
    const panelFrame = container.querySelector('.hv55-sensory-axis-frame[data-metric-ref="panel-note"]')!;
    const unknownLane = panelFrame.querySelector('.hv55-sensory-lane[data-candidate-id="fine-model"]')!;
    expect(unknownLane.querySelector('.hv55-sensory-point, .hv55-sensory-range, .hv55-sensory-central'), 'Une inconnue ne reçoit ni point ni plage.').toBeNull();
    expect(unknownLane.querySelector('.hv55-sensory-lane-status')).toHaveTextContent('Inconnu');
    expect(container.querySelector('.hv55-sensory-unplotted')).toHaveTextContent('Poire · mention qualitative, sans métrique ni échelle chiffrée');
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
    expect(screen.queryByRole('img', { name: /^Radar ·/ }), 'Deux cadres d’une nuance chacun ne forment pas de radar de profil.').toBeNull();
    expect(container.querySelectorAll('.hv55-sensory-axis-frame')).toHaveLength(2);
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

  it('C02 · sépare les plages recouvrantes par couloir et symbole, sans centrale inventée pour A', async () => {
    const overlap = overlapFixture();
    const props = defaultProps({ comparison: overlap, candidateIds: overlap.candidateOrder, dimensionIds: overlap.dimensionOrder, mode: 'radar', selectedCandidateId: undefined });
    const { container, rerender } = render(<HopV55SensoryComparison {...props} />);
    const tableBefore = container.querySelector('.hv55-sensory-table-region')!.textContent;
    const radars = container.querySelectorAll('.hv55-sensory-radar-group');
    expect(radars).toHaveLength(1);
    const radar = radars[0] as HTMLElement;

    const extents = (id: string) => [...radar.querySelectorAll(`g[data-candidate-id="${id}"] .hv55-sensory-radar-extent`)].map(segmentOf);
    const aExtents = extents('option-a');
    const bExtents = extents('option-b');
    expect(aExtents).toHaveLength(2);
    expect(bExtents).toHaveLength(3);
    for (const a of aExtents) for (const b of bExtents) expect(sameTrace(a, b), 'Les plages A et B ne partagent jamais le même tracé.').toBe(false);

    const aGroup = radar.querySelector('g[data-candidate-id="option-a"]')!;
    const bGroup = radar.querySelector('g[data-candidate-id="option-b"]')!;
    expect(aGroup.querySelector('.hv55-sensory-radar-point'), 'A n’a pas de centrale : aucun symbole plein, ni au milieu de sa plage.').toBeNull();
    expect([...aGroup.querySelectorAll('.hv55-sensory-radar-range-cap')].map(cap => cap.textContent)).toEqual(['△', '△']);
    expect([...bGroup.querySelectorAll('.hv55-sensory-radar-range-cap')].map(cap => cap.textContent)).toEqual(['□', '□', '□']);
    expect([...bGroup.querySelectorAll('.hv55-sensory-radar-point')].every(point => point.textContent?.endsWith('■'))).toBe(true);

    const user = userEvent.setup();
    const reader = within(radar).getByRole('group', { name: 'Lire les valeurs exactes d’un axe du radar' });
    expect(within(reader).getByRole('button', { name: 'Agrumes' })).toHaveAttribute('aria-pressed', 'true');
    const readerRow = () => radar.querySelector('.hv55-sensory-reader-row')!;
    expect(readerRow()).toHaveTextContent('Option A : Projection hypothétique · 2,1–2,6 points · centrale non fournie');
    const aReaderLane = readerRow().querySelector('.hv55-sensory-lane[data-candidate-id="option-a"]')!;
    expect(aReaderLane.querySelector('.hv55-sensory-lane-mark')?.textContent).toBe('▲');
    expect(aReaderLane.querySelector('.hv55-sensory-central')).toBeNull();
    await user.click(within(reader).getByRole('button', { name: 'Fruits tropicaux' }));
    expect(within(reader).getByRole('button', { name: 'Fruits tropicaux' })).toHaveAttribute('aria-pressed', 'true');
    expect(readerRow()).toHaveTextContent('Option A : Projection hypothétique · 1–1,5 points · centrale non fournie');

    rerender(<HopV55SensoryComparison {...props} mode="bars" />);
    const tracks = [...container.querySelectorAll('.hv55-sensory-bars .hv55-sensory-track')];
    expect(tracks).toHaveLength(3);
    tracks.forEach(track => ['●', '▲', '■'].forEach(marker => expect(track.textContent, `Chaque couloir porte le symbole ${marker}.`).toContain(marker)));
    const citrusRow = container.querySelector(`.hv55-sensory-bars [data-reference-group="${overlap.dimensions[0].referenceGroupId}"]`)!;
    const aLane = citrusRow.querySelector('.hv55-sensory-lane[data-candidate-id="option-a"]')!;
    const aRange = aLane.querySelector('.hv55-sensory-range') as HTMLElement;
    expect(parseFloat(aRange.style.left)).toBeCloseTo(42);
    expect(parseFloat(aRange.style.width)).toBeCloseTo(10);
    expect(aLane.querySelector('.hv55-sensory-central')).toBeNull();
    const floralRow = container.querySelector(`.hv55-sensory-bars [data-reference-group="${overlap.dimensions[2].referenceGroupId}"]`)!;
    expect(floralRow.querySelector('.hv55-sensory-lane[data-candidate-id="option-a"] .hv55-sensory-lane-status')).toHaveTextContent('Inconnu');
    expect(container.querySelector('.hv55-sensory-table-region')!.textContent).toBe(tableBefore);
  });

  it('C01 · garde le symbole de chaque candidat quand la sélection change d’ordre', () => {
    const overlap = overlapFixture();
    for (const candidateIds of [['option-b', 'option-a'], ['option-a', 'option-b', 'start']]) {
      for (const mode of ['bars', 'radar'] as const) {
        const { container, unmount } = render(<HopV55SensoryComparison {...defaultProps({ comparison: overlap, candidateIds, dimensionIds: overlap.dimensionOrder, mode, selectedCandidateId: undefined })} />);
        const expected: Record<string, string> = { start: '●', 'option-a': '▲', 'option-b': '■' };
        for (const id of candidateIds) {
          expect(container.querySelector(`.hv55-sensory-legend [data-candidate-id="${id}"]`)?.getAttribute('data-series-marker'), `légende ${mode} ${id}`).toBe(expected[id]);
          const drawn = mode === 'bars'
            ? [...container.querySelectorAll(`.hv55-sensory-bars .hv55-sensory-lane[data-candidate-id="${id}"] .hv55-sensory-lane-mark`)].map(mark => mark.textContent)
            : [container.querySelector(`.hv55-sensory-radar g[data-candidate-id="${id}"]`)?.getAttribute('data-series-marker')];
          expect(drawn.length).toBeGreaterThan(0);
          drawn.forEach(marker => expect(marker, `tracé ${mode} ${id}`).toBe(expected[id]));
        }
        unmount();
      }
    }
  });

  it('C02 lisibilité · noms de nuances entiers sur le radar et lecture rapide arrondie, statut et texte exact conservés', () => {
    const indexScale = scale('model-0-100', 'v3', indexMetric, { min: 0, max: 100 });
    const references = [citrus, tropical, floral].map(dimension => createBrewingSensoryDefinitionReference(dimension, indexMetric, indexScale));
    const projected = (text: string): BrewingSensoryValueProvenance => ({ sourceRefs: [modelSource], modelRef: { id: 'long-decimals', version: 'v1' },
      hypothesisRefs: ['long-decimals-plan'], explanation: text, limitations: ['Plage synthétique de test, pas une mesure de bière.'] });
    const candidates = [{ id: 'start', name: 'Observation de départ' }, { id: 'option-a', name: 'Option A' }, { id: 'option-b', name: 'Option B' }];
    const long = createBrewingSensoryComparison({
      context: { id: 'beer-context', version: 'v4', kind: 'beer', contentReference: 'context-long-v4', label: 'Pale ale de test', sourceRefs: [source('contexte long', 'observation')] },
      reference: { id: 'comparison-root', version: 'r2', kind: 'savedReference', contentReference: 'reference-long-r2', sourceRefs: [source('référence longue', 'judgment')] },
      candidateOrder: candidates.map(candidate => candidate.id), candidates,
      dimensionOrder: references.map(reference => reference.contentReference),
      dimensions: references.map(definition => ({ definition, values: [
        point('start', 'hypothetical', 37.5, projected('Point projeté.')),
        interval('option-a', 'hypothetical', 42.30501896195133, 83.21488270977073, undefined, projected('Plage longue sans centrale.')),
        interval('option-b', 'hypothetical', 79.03274440510913, 85.159807081334, 81.2092408563959, projected('Plage longue avec centrale.')),
      ] })),
    });
    const props = defaultProps({ comparison: long, candidateIds: long.candidateOrder, dimensionIds: long.dimensionOrder, mode: 'radar', selectedCandidateId: undefined });
    const { container, rerender } = render(<HopV55SensoryComparison {...props} />);
    const labels = [...container.querySelectorAll('.hv55-sensory-radar-label')].map(label => {
      const clone = label.cloneNode(true) as Element;
      clone.querySelectorAll('title').forEach(title => title.remove());
      return clone.textContent;
    });
    expect(labels, 'Chaque nom de nuance reste entier : ni troncature, ni « … ».').toEqual(['Agrumes', 'Fruits tropicaux', 'Floral']);
    const tableBefore = container.querySelector('.hv55-sensory-table-region')!.textContent;

    rerender(<HopV55SensoryComparison {...props} mode="bars" />);
    const row = container.querySelector(`.hv55-sensory-bars [data-reference-group="${long.dimensions[0].referenceGroupId}"]`)!;
    const quick = (id: string) => row.querySelector(`.hv55-sensory-bar-values [data-candidate-id="${id}"] .hv55-sensory-value-quick`)!;
    const exact = (id: string) => row.querySelector(`.hv55-sensory-bar-values [data-candidate-id="${id}"] .hv55-sensory-sr-only`)!;
    expect(quick('start').textContent).toBe('Projection hypothétique ≈ 38');
    expect(quick('option-a').textContent).toBe('Projection hypothétique ≈ 42–83 · centrale non fournie');
    expect(quick('option-b').textContent).toBe('Projection hypothétique ≈ 79–85 · centrale ≈ 81');
    expect(quick('option-a')).toHaveAttribute('aria-hidden', 'true');
    expect(exact('option-a').textContent).toBe('Option A : Projection hypothétique · 42,30501896195133–83,21488270977073 points d’indice · centrale non fournie');
    expect(exact('option-b').textContent).toBe('Option B : Projection hypothétique · 79,03274440510913–85,159807081334 points d’indice · centrale 81,2092408563959 points d’indice');
    expect(container.querySelector('.hv55-sensory-bars')).toHaveTextContent('≈ : lecture arrondie');
    expect(container.querySelector('.hv55-sensory-table-region')!.textContent, 'Le tableau exact ne change pas.').toBe(tableBefore);
    expect(container.querySelector('.hv55-sensory-table-region')).toHaveTextContent('42,30501896195133–83,21488270977073 points d’indice');
  });
});
