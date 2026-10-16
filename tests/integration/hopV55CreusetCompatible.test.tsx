// Owned new compatibility/presentation regression test; no domain schema changes.
import React, { useState } from 'react';
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
import { brewingScenarioViewModel } from '../../src/domain/brewingScenarioTools';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55Comparison } from '../../src/ui/hopV55/Comparison';
import { HopV55SensoryComparison } from '../../src/ui/hopV55/SensoryComparison';

afterEach(cleanup);

// Synthetic fixtures: frames are declared by exact metric/scale identity, never by names, units or bounds.
const source = (title: string, kind: HopSource['kind'] = 'research'): HopSource => ({
  title, author: 'Fixture creuset', year: 2026, kind, reference: `fixture:creuset:${title}`
});

const dimension = (id: string, name: string, definition: string): BrewingSensoryDimension => ({
  id, version: 'creuset-v1', name, definition, sourceRefs: [source(`définition ${id}`, 'judgment')]
});
const citrus = dimension('citrus', 'Agrumes', 'Nuance sensorielle d’agrumes.');
const tropical = dimension('tropical', 'Fruits tropicaux', 'Nuance sensorielle de fruits tropicaux.');
const floral = dimension('floral', 'Floral', 'Nuance sensorielle florale.');
const stone = dimension('stone-fruit', 'Fruits à noyau', 'Nuance sensorielle de fruits à noyau.');
const bitterness = dimension('bitterness-measure', 'Amertume mesurée', 'Mesure analytique gardée hors du profil sensoriel.');
const pear = dimension('pear', 'Poire', 'Mention de poire dans une description source.');
const unscaled = dimension('unscaled-index', 'Indice sans domaine', 'Indice publié sans borne d’échelle.');

const metric = (id: string, kind: BrewingSensoryMetric['kind'], name: string, meaning: string, unit: string): BrewingSensoryMetric => ({
  id, version: 'm1', kind, name, meaning, unit, sourceRefs: [source(`métrique ${id}`)]
});
const scaleFor = (id: string, owner: BrewingSensoryMetric, domain: BrewingSensoryScale['domain']): BrewingSensoryScale => ({
  id, version: 's1', metricRef: { id: owner.id, version: owner.version }, domain, sourceRefs: [source(`échelle ${id}`)]
});

const panelMetric = metric('creuset-panel-note', 'ordinalNote', 'Note de panel', 'Intensité déclarée par le panel de dégustation.', 'points');
const panelScale = scaleFor('creuset-panel-0-5', panelMetric, { min: 0, max: 5 });
// Same bounds and unit word as the panel, another declared identity: it never joins the panel frame.
const otherMetric = metric('creuset-other-note', 'ordinalNote', 'Note d’un autre panel', 'Intensité déclarée par un autre panel, sans correspondance publiée.', 'points');
const otherScale = scaleFor('creuset-other-0-5', otherMetric, { min: 0, max: 5 });
// A physical measurement on the same numeric interval: never a sensory score.
const ibuMetric = metric('creuset-ibu', 'measurement', 'IBU analytique', 'Mesure analytique de l’amertume.', 'IBU');
const ibuScale = scaleFor('creuset-ibu-0-5', ibuMetric, { min: 0, max: 5 });
const unscaledMetric = metric('creuset-unscaled', 'modelIndex', 'Indice non étalonné', 'Valeur publiée sans domaine numérique.', 'indice');
const unscaledScale = scaleFor('creuset-unscaled-scale', unscaledMetric, null);

const [citrusRef, tropicalRef, floralRef] = [citrus, tropical, floral]
  .map(row => createBrewingSensoryDefinitionReference(row, panelMetric, panelScale));
const stoneRef = createBrewingSensoryDefinitionReference(stone, otherMetric, otherScale);
const ibuRef = createBrewingSensoryDefinitionReference(bitterness, ibuMetric, ibuScale);
const pearRef = createBrewingSensoryDefinitionReference(pear);
const unscaledRef = createBrewingSensoryDefinitionReference(unscaled, unscaledMetric, unscaledScale);

type NumericStatus = 'observed' | 'hypothetical' | 'target';
const tasting = (text: string): BrewingSensoryValueProvenance => ({ sourceRefs: [source('notes de dégustation', 'observation')], explanation: text, limitations: [] });
const projected = (text: string): BrewingSensoryValueProvenance => ({
  sourceRefs: [source('hypothèse de modèle', 'judgment')], modelRef: { id: 'creuset-model', version: 'v1' }, hypothesisRefs: ['creuset-plan-v1'],
  explanation: text, limitations: ['Plage synthétique de test, pas une mesure de bière.']
});
const aim = (text: string): BrewingSensoryValueProvenance => ({ sourceRefs: [source('cible du brasseur', 'judgment')], explanation: text, limitations: [] });
const point = (candidateId: string, status: NumericStatus, value: number, provenance: BrewingSensoryValueProvenance) => ({ candidateId, status, value, provenance });
const interval = (candidateId: string, status: NumericStatus, min: number, max: number, central: number | undefined, provenance: BrewingSensoryValueProvenance) =>
  ({ candidateId, status, range: { min, max }, ...(central !== undefined ? { central } : {}), provenance });
const unknown = (candidateId: string, reason: string) => ({ candidateId, status: 'unknown' as const, reason, provenance: { sourceRefs: [], explanation: reason, limitations: [] } });
const nonDocumented = (candidateId: string) => ({ candidateId, status: 'nonDocumented' as const,
  reason: 'Aucune description source ne mentionne cette nuance.', provenance: { sourceRefs: [], explanation: 'Absence de mention, sans intensité inférée.', limitations: [] } });
const documented = (candidateId: string) => ({
  candidateId, status: 'documented' as const,
  mentions: [{ dimensionRef: { id: pear.id, version: pear.version }, lexicalRuleRef: { id: 'fr-pear', version: 'v2' }, term: 'poire',
    context: 'rawHop' as const, text: 'Arômes décrits : poire mûre.', source: source('fiche houblon poire', 'manufacturer'), qualification: 'affirmed' as const }],
  provenance: { sourceRefs: [source('fiche houblon poire', 'manufacturer')], explanation: 'Mention lexicale conservée sans score.', limitations: [] }
});

const candidates = [
  { id: 'tasted', name: 'Bière dégustée' },
  { id: 'option-a', name: 'Option A' },
  { id: 'option-b', name: 'Option B' },
  { id: 'goal', name: 'Profil visé' }
];

/** Three nuances share one declared frame; a fourth has equal bounds under another identity; measurement,
 * qualitative mention and undefined domain complete the counter-frame. Overlapping ranges, absent centrals,
 * observed, projected, target and unknown values are all present. */
function creusetFixture(): BrewingSensoryComparisonDTO {
  const dimensions: Array<{ definition: BrewingSensoryDefinitionReference; values: BrewingSensoryComparisonValue[] }> = [
    { definition: citrusRef, values: [
      point('tasted', 'observed', 2, tasting('Note observée.')),
      interval('option-a', 'hypothetical', 2.1, 2.6, undefined, projected('Plage A sans centrale.')),
      interval('option-b', 'hypothetical', 2.3, 2.8, 2.5, projected('Plage B recouvrante.')),
      interval('goal', 'target', 2.4, 3.2, undefined, aim('Cible déclarée sans centrale.'))
    ] },
    { definition: tropicalRef, values: [
      point('tasted', 'observed', 1.3, tasting('Note observée.')),
      interval('option-a', 'hypothetical', 1, 1.5, undefined, projected('Plage A sans centrale.')),
      interval('option-b', 'hypothetical', 1.2, 1.6, 1.4, projected('Plage B recouvrante.')),
      interval('goal', 'target', 1.5, 2, undefined, aim('Cible déclarée sans centrale.'))
    ] },
    { definition: floralRef, values: [
      point('tasted', 'observed', 3, tasting('Note observée.')),
      unknown('option-a', 'Aucune projection florale pour cette option.'),
      interval('option-b', 'hypothetical', 3, 3.5, 3.2, projected('Plage B seule.')),
      interval('goal', 'target', 2.5, 3, undefined, aim('Cible déclarée sans centrale.'))
    ] },
    { definition: stoneRef, values: [
      point('tasted', 'observed', 2, tasting('Note de l’autre panel.')),
      interval('option-a', 'hypothetical', 2.1, 2.6, undefined, projected('Plage A sur l’autre échelle.')),
      interval('option-b', 'hypothetical', 2.3, 2.8, 2.5, projected('Plage B sur l’autre échelle.')),
      unknown('goal', 'Aucune cible sur cette échelle.')
    ] },
    { definition: ibuRef, values: [
      point('tasted', 'observed', 3.2, tasting('IBU analytique; l’unité reste IBU.')),
      unknown('option-a', 'Aucune mesure IBU.'), unknown('option-b', 'Aucune mesure IBU.'),
      interval('goal', 'target', 2, 4, undefined, aim('Cible analytique, distincte d’une intensité.'))
    ] },
    { definition: pearRef, values: [documented('tasted'), nonDocumented('option-a'), unknown('option-b', 'Aucune extraction.'), unknown('goal', 'Aucune extraction.')] },
    { definition: unscaledRef, values: [
      unknown('tasted', 'Aucun indice fourni.'), unknown('option-a', 'Aucun indice fourni.'),
      interval('option-b', 'hypothetical', 3, 4, 3.4, projected('Valeurs conservées sans domaine.')),
      unknown('goal', 'Aucun indice fourni.')
    ] }
  ];
  return createBrewingSensoryComparison({
    context: { id: 'creuset-context', version: 'v1', kind: 'beer', contentReference: 'creuset-context-v1', label: 'Pale ale de test du creuset', sourceRefs: [source('contexte creuset', 'observation')] },
    reference: { id: 'creuset-root', version: 'r1', kind: 'savedReference', contentReference: 'creuset-reference-r1', sourceRefs: [source('référence creuset', 'judgment')] },
    candidateOrder: candidates.map(candidate => candidate.id), candidates,
    dimensionOrder: dimensions.map(row => row.definition.contentReference), dimensions
  });
}

/** Parent state as Page keeps it: the real toggles drive mode, candidates, nuances and choice. */
function SensoryHarness({ comparison, initialMode = 'bars', onChoose }: {
  comparison: BrewingSensoryComparisonDTO;
  initialMode?: 'bars' | 'radar';
  onChoose?: (id: string) => void;
}) {
  const [mode, setMode] = useState<'bars' | 'radar'>(initialMode);
  const [candidateIds, setCandidateIds] = useState(comparison.candidateOrder);
  const [dimensionIds, setDimensionIds] = useState(comparison.dimensionOrder);
  const [selected, setSelected] = useState<string | undefined>();
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(item => item !== id) : [...list, id];
  return <HopV55SensoryComparison comparison={comparison} candidateIds={candidateIds} dimensionIds={dimensionIds} mode={mode}
    onModeChange={setMode} onToggleCandidate={id => setCandidateIds(current => toggle(current, id))}
    onToggleDimension={id => setDimensionIds(current => toggle(current, id))}
    onChooseCandidate={id => { setSelected(id); onChoose?.(id); }} selectedCandidateId={selected} />;
}

const labelsOf = (root: ParentNode, selector: string) => [...root.querySelectorAll(selector)].map(label => {
  const clone = label.cloneNode(true) as Element;
  clone.querySelectorAll('title').forEach(title => title.remove());
  return clone.textContent;
});

/** Candidate, marker and exact accessible value of one bar row. */
const rowValues = (row: Element) => [...row.querySelectorAll('.hv55-sensory-bar-values > [data-candidate-id]')]
  .map(item => `${item.getAttribute('data-candidate-id')}:${item.getAttribute('data-series-marker')}:${item.querySelector('.hv55-sensory-sr-only')!.textContent}`);

const frExact = (value: number) => {
  const [integer, decimals] = String(value).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
};

function sourceProgramResult(): BrewingScenarioResult {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  const current = prepared.runtime.current;
  if (!current?.program || current.program.additions.length < 2) throw new Error('La fixture source doit porter deux lignes de programme.');
  const program = structuredClone(current.program);
  program.additions[0].status = 'performed';
  program.additions[1].status = 'planned';
  prepared.runtime.current = { ...current, program, performedAdditionIds: [program.additions[0].id] };
  const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'creuset-j5-fixture', revision: 1, branches: [],
    intent: { question: 'Creuset J5 de test.', criteria: [] } });
  return simulateBrewingScenario(request, prepared.runtime);
}

describe('Creuset compatible · Barres et Radar sur des cadres exacts', () => {
  it('trace une seule forme pour le cadre déclaré de trois nuances ; cadre distinct, mesure, mention et domaine inconnu restent nommés hors forme', () => {
    const { container } = render(<SensoryHarness comparison={creusetFixture()} initialMode="radar" />);
    const radars = container.querySelectorAll('.hv55-sensory-radar-group');
    expect(radars).toHaveLength(1);
    const radar = radars[0] as HTMLElement;
    expect(radar).toHaveAttribute('data-metric-ref', panelMetric.id);
    expect(radar).toHaveAttribute('data-scale-ref', panelScale.id);
    expect(within(radar).getByRole('img', { name: /^Radar · Note de panel · 0–5/ })).toBeInTheDocument();
    expect(labelsOf(radar, '.hv55-sensory-radar-label')).toEqual(['Agrumes', 'Fruits tropicaux', 'Floral']);
    expect(radar.querySelector('.hv55-sensory-radar-note')).toHaveTextContent('il ne calcule ni somme, ni ressemblance, ni score');

    // Equal bounds and the same unit word under another identity: read per axis, never a fourth spoke.
    const otherFrame = container.querySelector(`.hv55-sensory-axis-frame[data-metric-ref="${otherMetric.id}"]`)!;
    expect(otherFrame).toHaveAttribute('data-axis-count', '1');
    expect(otherFrame.querySelector(`[data-reference-group="${stoneRef.contentReference}"]`)).not.toBeNull();
    expect(radar.querySelector(`[data-reference-group="${stoneRef.contentReference}"]`)).toBeNull();
    expect(container.querySelector('.hv55-sensory-frame-summary')).toHaveTextContent('Radar : 1 forme de profil · 1 nuance en lecture par axe · 3 nuances au tableau seulement.');
    expect([...container.querySelectorAll('.hv55-sensory-unplotted li')].map(item => [item.getAttribute('data-unplotted-reference'), item.textContent])).toEqual([
      [ibuRef.contentReference, 'Amertume mesurée · mesure en IBU : grandeur physique gardée hors des profils sensoriels'],
      [pearRef.contentReference, 'Poire · mention qualitative, sans métrique ni échelle chiffrée'],
      [unscaledRef.contentReference, 'Indice sans domaine · domaine d’échelle non défini']
    ]);

    // Each status keeps its own drawing; no centre, zero or closing point is invented.
    const series = (id: string) => radar.querySelector(`g[data-candidate-id="${id}"]`)!;
    expect(series('tasted').querySelectorAll('.hv55-sensory-radar-point')).toHaveLength(3);
    expect(series('tasted').querySelectorAll('.hv55-sensory-radar-central-line'), 'Trois points observés ferment leur forme.').toHaveLength(3);
    expect(series('option-a').querySelector('.hv55-sensory-radar-point'), 'A n’a ni centrale ni milieu de plage.').toBeNull();
    expect(series('option-a').querySelectorAll('.hv55-sensory-radar-central-line')).toHaveLength(0);
    expect(series('option-a').querySelectorAll('.hv55-sensory-radar-reading.hv55-sensory-hypothetical')).toHaveLength(2);
    expect(series('option-a').querySelector(`[data-reference-group="${floralRef.contentReference}"]`), 'L’inconnue florale de A ne devient pas un zéro.').toBeNull();
    expect(series('option-b').querySelectorAll('.hv55-sensory-radar-central-line')).toHaveLength(3);
    expect(series('goal').querySelectorAll('.hv55-sensory-radar-reading.hv55-sensory-target')).toHaveLength(3);
    expect(series('goal').querySelector('.hv55-sensory-radar-point'), 'Une cible sans centrale ne reçoit aucun point.').toBeNull();
    expect(radar.querySelector('.hv55-sensory-gaps')).toHaveTextContent('Option A · Floral : inconnu');

    const table = container.querySelector('.hv55-sensory-table-region')!;
    expect(table.querySelectorAll('tbody tr')).toHaveLength(7);
    expect(table).toHaveTextContent('Observé · 3,2 IBU');
    const cell = (reference: BrewingSensoryDefinitionReference, column: number) => table.querySelector(`[data-reference-group="${reference.contentReference}"]`)!.querySelectorAll('td')[column];
    expect(cell(citrusRef, 1)).toHaveTextContent('Projection hypothétique · 2,1–2,6 points · centrale non fournie');
    expect(cell(citrusRef, 3)).toHaveTextContent('Cible · 2,4–3,2 points · centrale non fournie');
    expect(cell(floralRef, 1)).toHaveTextContent('Inconnu · Aucune projection florale pour cette option.');
  });

  it('garde identités, valeurs, table et sources en Barres ↔ Radar, filtre de série puis rétablissement, nuance retirée puis remise', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<SensoryHarness comparison={creusetFixture()} onChoose={onChoose} />);
    const tableText = () => container.querySelector('.hv55-sensory-table-region')!.textContent;
    const legend = () => [...container.querySelectorAll('.hv55-sensory-legend [data-candidate-id]')]
      .map(item => `${item.getAttribute('data-candidate-id')}:${item.getAttribute('data-series-marker')}`);
    const unplottedText = () => {
      const list = container.querySelector('.hv55-sensory-unplotted');
      expect(list, 'Les nuances hors forme restent nommées avec leur motif.').not.toBeNull();
      return list!.textContent;
    };
    const barRows = () => new Map([...container.querySelectorAll('.hv55-sensory-bars .hv55-sensory-bar-row')]
      .map(row => [row.getAttribute('data-reference-group')!, rowValues(row)]));
    const radarGroup = () => container.querySelector('.hv55-sensory-radar-group') as HTMLElement | null;

    const barsBefore = barRows();
    expect([...barsBefore.keys()]).toEqual([citrusRef, tropicalRef, floralRef, stoneRef].map(reference => reference.contentReference));
    const tableBefore = tableText();
    const legendBefore = legend();
    expect(legendBefore).toEqual(['tasted:●', 'option-a:▲', 'option-b:■', 'goal:◆']);
    const unplottedBefore = unplottedText();

    await user.click(screen.getByRole('button', { name: 'Radar' }));
    expect(radarGroup()).not.toBeNull();
    expect(tableText()).toBe(tableBefore);
    expect(legend()).toEqual(legendBefore);
    expect(unplottedText()).toBe(unplottedBefore);
    const reader = within(radarGroup()!).getByRole('group', { name: 'Lire les valeurs exactes d’un axe du radar' });
    for (const [reference, name] of [[citrusRef, 'Agrumes'], [tropicalRef, 'Fruits tropicaux'], [floralRef, 'Floral']] as const) {
      await user.click(within(reader).getByRole('button', { name }));
      const row = radarGroup()!.querySelector('.hv55-sensory-reader-row')!;
      expect(row).toHaveAttribute('data-reference-group', reference.contentReference);
      expect(rowValues(row), `Lecture exacte de ${name} identique aux barres.`).toEqual(barsBefore.get(reference.contentReference));
    }
    const stoneRow = container.querySelector(`.hv55-sensory-axis-frame [data-reference-group="${stoneRef.contentReference}"]`)!;
    expect(rowValues(stoneRow)).toEqual(barsBefore.get(stoneRef.contentReference));

    // Filter a series then restore it: no other series is repainted, and the exact table comes back unchanged.
    await user.click(screen.getByRole('checkbox', { name: 'Comparer Option A' }));
    expect(radarGroup()!.querySelector('g[data-candidate-id="option-a"]')).toBeNull();
    expect(radarGroup()!.querySelector('g[data-candidate-id="option-b"]')).toHaveAttribute('data-series-marker', '■');
    expect(radarGroup()!.querySelector('g[data-candidate-id="goal"]')).toHaveAttribute('data-series-marker', '◆');
    expect([...container.querySelectorAll('.hv55-sensory-table-region thead th')].map(header => header.textContent))
      .toEqual(['Nuance · métrique · échelle', 'Bière dégustée', 'Option B', 'Profil visé']);
    await user.click(screen.getByRole('checkbox', { name: 'Comparer Option A' }));
    expect(radarGroup()!.querySelector('g[data-candidate-id="option-a"]')).toHaveAttribute('data-series-marker', '▲');
    expect(legend()).toEqual(legendBefore);
    expect(tableText()).toBe(tableBefore);

    // Two nuances of the frame would be a line: the frame is read per axis, with the way back to its shape.
    await user.click(screen.getByRole('checkbox', { name: /^Floral · / }));
    expect(radarGroup(), 'Deux nuances du cadre ne forment pas un profil.').toBeNull();
    const panelFrame = container.querySelector(`.hv55-sensory-axis-frame[data-metric-ref="${panelMetric.id}"]`)!;
    expect(panelFrame).toHaveAttribute('data-axis-count', '2');
    expect(panelFrame.querySelector('.hv55-sensory-frame-hint')).toHaveTextContent('Ce cadre compte 3 nuances dans la comparaison : en choisir au moins trois dans « Nuances comparées » affiche sa forme.');
    expect(rowValues(panelFrame.querySelector(`[data-reference-group="${citrusRef.contentReference}"]`)!)).toEqual(barsBefore.get(citrusRef.contentReference));
    expect(container.querySelector(`.hv55-sensory-axis-frame[data-metric-ref="${otherMetric.id}"] .hv55-sensory-frame-hint`),
      'Un cadre d’une seule nuance dans la comparaison n’annonce aucune forme possible.').toBeNull();
    await user.click(screen.getByRole('checkbox', { name: /^Floral · / }));
    expect(container.querySelectorAll('.hv55-sensory-radar-group')).toHaveLength(1);
    expect(tableText()).toBe(tableBefore);

    await user.click(screen.getByRole('button', { name: 'Barres' }));
    expect(barRows()).toEqual(barsBefore);
    expect(unplottedText()).toBe(unplottedBefore);
    const optionB = screen.getByRole('checkbox', { name: 'Comparer Option B' }).closest('.hv55-sensory-candidate') as HTMLElement;
    await user.click(within(optionB).getByRole('button', { name: 'Choisir ce candidat' }));
    expect(onChoose).toHaveBeenCalledWith('option-b');
    expect(within(optionB).getByRole('button', { name: 'Choix courant' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Barres' }), 'Choisir ne change pas la lecture.').toHaveAttribute('aria-pressed', 'true');
    expect(tableText()).toBe(tableBefore);
  });

  it('garde trois lectures par axe quand chaque nuance a sa propre métrique 0–100 « axisScale », sans polygone commun', async () => {
    const references = [citrus, tropical, stone].map(row => {
      const own: BrewingSensoryMetric = { id: `axis-metric-${row.id}`, version: 'v1', kind: 'modelIndex', name: row.name,
        meaning: 'Indice du modèle sur cette définition, pas note observée.', unit: 'axisScale', sourceRefs: [source(`axe ${row.id}`)] };
      return createBrewingSensoryDefinitionReference(row, own, scaleFor(`axis-scale-${row.id}`, own, { min: 0, max: 100 }));
    });
    const series = [{ id: 'baseline', name: 'Base' }, { id: 'option-a', name: 'Option A' }, { id: 'adopted-reference', name: 'Référence adoptée' }];
    const dto = createBrewingSensoryComparison({
      context: { id: 'creuset-axis-context', version: 'v1', kind: 'beer', contentReference: 'creuset-axis-context-v1', label: 'Axes à métrique propre', sourceRefs: [] },
      reference: { id: 'creuset-axis-root', version: 'r1', kind: 'savedReference', contentReference: 'creuset-axis-reference-r1', sourceRefs: [] },
      candidateOrder: series.map(row => row.id), candidates: series,
      dimensionOrder: references.map(reference => reference.contentReference),
      dimensions: references.map(definition => ({ definition, values: [
        interval('baseline', 'hypothetical', 40, 60, 48, projected('Plage de base.')),
        interval('option-a', 'hypothetical', 45, 70, undefined, projected('Plage A sans centrale.')),
        unknown('adopted-reference', 'La référence adoptée n’a pas de valeur calculée ici.')
      ] }))
    });
    const user = userEvent.setup();
    const { container } = render(<SensoryHarness comparison={dto} initialMode="radar" />);
    expect(container.querySelectorAll('.hv55-sensory-radar-group'),
      'Des métriques distinctes ne sont pas réunies malgré un même domaine 0–100 et un même code d’unité.').toHaveLength(0);
    expect(container.querySelector('svg.hv55-sensory-radar')).toBeNull();
    const frames = [...container.querySelectorAll('.hv55-sensory-axis-frame')];
    expect(frames.map(frame => [frame.getAttribute('data-metric-ref'), frame.getAttribute('data-axis-count')]))
      .toEqual(references.map(reference => [reference.metric!.id, '1']));
    frames.forEach(frame => expect(frame.querySelector('h4'), 'Le titre ne répète pas la nuance déjà nommée sur sa ligne.').toBeNull());
    expect(container.querySelector('.hv55-sensory-frame-summary')).toHaveTextContent('Radar : aucune forme de profil · 3 nuances en lecture par axe.');
    expect(container.querySelector('.hv55-sensory-axis-reading')).toHaveTextContent('des bornes égales ou un même mot d’unité ne prouvent pas une calibration commune');
    const tableRadar = container.querySelector('.hv55-sensory-table-region')!.textContent;

    await user.click(screen.getByRole('button', { name: 'Barres' }));
    expect(container.querySelectorAll('.hv55-sensory-bars .hv55-sensory-chart-group')).toHaveLength(3);
    expect(container.querySelector('.hv55-sensory-table-region')!.textContent).toBe(tableRadar);
  });

  it('même J5 : trois axes forment le profil standard ; le sensoriel ne trace une forme que pour un cadre commun déclaré', () => {
    const j5 = sourceProgramResult();
    const view = brewingScenarioViewModel(j5);
    const first = view.axes[0];
    // The common frame below is declared explicitly by the fixture; equal bounds only keep its values inside that
    // declared scale, they never create the frame.
    const axes = view.axes.filter(axis => axis.scale.min === first.scale.min && axis.scale.max === first.scale.max).slice(0, 3);
    expect(axes, 'Le fixture J5 doit offrir trois axes de mêmes bornes.').toHaveLength(3);
    const scope = 'Projection du profil total du programme source · après les ajouts prévus';

    const standard = render(<HopV55Comparison result={j5} branchIds={['baseline']} axisIds={axes.map(axis => axis.id)} mode="radar"
      onModeChange={vi.fn()} onToggleBranch={vi.fn()} onToggleAxis={vi.fn()} />).container;
    expect(standard.querySelector('svg.hv55-cmp-radar'), 'Le J5 standard forme son profil dans le cadre exact de son résultat.').not.toBeNull();
    expect(labelsOf(standard, '.hv55-cmp-radar-label')).toEqual(axes.map(axis => axis.name));
    expect(standard.querySelector('.hv55-cmp-legend')).toHaveTextContent(scope);

    const j5Dimension = (axis: typeof first): BrewingSensoryDimension => ({
      id: axis.id, version: axis.version, name: axis.name, definition: `Axe J5 ${axis.name}.`, sourceRefs: [source(`axe J5 ${axis.id}`)]
    });
    const valueFrom = (axis: typeof first): BrewingSensoryComparisonValue => {
      const estimate = axis.values.find(value => value.branchId === 'baseline')?.estimate;
      if (!estimate?.range) return unknown('baseline', 'Le J5 ne fournit pas de plage pour cet axe.');
      return interval('baseline', 'hypothetical', estimate.range.min, estimate.range.max, estimate.central ?? undefined, {
        sourceRefs: [], modelRef: { id: 'j5-snapshot', version: String(j5.revision) }, hypothesisRefs: [j5.reference],
        explanation: 'Plage J5 conservée telle quelle.', limitations: ['Enveloppe conditionnelle du modèle, sans couverture statistique.']
      });
    };
    const j5Comparison = (references: BrewingSensoryDefinitionReference[]) => createBrewingSensoryComparison({
      context: { id: j5.scenarioId, version: String(j5.revision), kind: 'j5Snapshot', contentReference: j5.reference, label: 'Snapshot J5 du creuset', sourceRefs: [] },
      reference: { id: 'creuset-adopted-reference', version: '1', kind: 'adoptedReference', contentReference: 'creuset-adopted-reference-v1', sourceRefs: [source('référence adoptée', 'judgment')] },
      candidateOrder: ['baseline', 'adopted-reference'],
      candidates: [{ id: 'baseline', name: 'État courant' }, { id: 'adopted-reference', name: 'Référence adoptée' }],
      dimensionOrder: references.map(reference => reference.contentReference),
      dimensions: references.map((definition, index) => ({ definition, values: [
        valueFrom(axes[index]), unknown('adopted-reference', 'La référence adoptée n’a pas de valeur calculée sur ce snapshot.')
      ] }))
    });
    // As the frozen J5 reference construction does: one metric and one scale per axis.
    const perAxis = j5Comparison(axes.map(axis => {
      const own: BrewingSensoryMetric = { id: `j5-axis-metric-${axis.id}`, version: axis.version, kind: 'modelIndex', name: axis.name,
        meaning: 'Indice du modèle sur cette définition, pas note observée.', unit: 'axisScale', sourceRefs: [source(`axe ${axis.id}`)] };
      return createBrewingSensoryDefinitionReference(j5Dimension(axis), own, scaleFor(`j5-axis-scale-${axis.id}`, own, { min: axis.scale.min, max: axis.scale.max }));
    }));
    const commonMetric = metric('j5-declared-common-index', 'modelIndex', 'Indice commun déclaré', 'Indice déclaré commun à ces trois axes par la source du test.', 'axisScale');
    const commonScale = scaleFor('j5-declared-common-scale', commonMetric, { min: first.scale.min, max: first.scale.max });
    const declared = j5Comparison(axes.map(axis => createBrewingSensoryDefinitionReference(j5Dimension(axis), commonMetric, commonScale)));

    const sensory = (dto: BrewingSensoryComparisonDTO) => render(<HopV55SensoryComparison comparison={dto} result={j5} candidateIds={dto.candidateOrder}
      dimensionIds={dto.dimensionOrder} mode="radar" onModeChange={vi.fn()} onToggleCandidate={vi.fn()} onToggleDimension={vi.fn()} />).container;
    const separate = sensory(perAxis);
    expect(separate.querySelectorAll('.hv55-sensory-radar-group'), 'Le snapshot J5 ne réunit pas des métriques propres à chaque axe.').toHaveLength(0);
    expect(separate.querySelectorAll('.hv55-sensory-axis-frame')).toHaveLength(3);
    const common = sensory(declared);
    const radars = common.querySelectorAll('.hv55-sensory-radar-group');
    expect(radars).toHaveLength(1);
    expect(radars[0]).toHaveAttribute('data-metric-ref', commonMetric.id);
    expect(labelsOf(radars[0], '.hv55-sensory-radar-label')).toEqual(axes.map(axis => axis.name));

    const standardRows = [...standard.querySelectorAll('.hv55-cmp-table-region tbody tr')];
    axes.forEach((axis, index) => {
      const estimate = axis.values.find(value => value.branchId === 'baseline')?.estimate;
      const exact = estimate?.range ? `${frExact(estimate.range.min)}–${frExact(estimate.range.max)}` : 'Inconnu';
      expect(standardRows[index].querySelector('td strong')).toHaveTextContent(exact);
      for (const [container, dto] of [[separate, perAxis], [common, declared]] as const) {
        expect(container.querySelector('.hv55-sensory-table-region thead')).toHaveTextContent(scope);
        const cell = container.querySelector(`.hv55-sensory-table-region [data-reference-group="${dto.dimensionOrder[index]}"]`)!.querySelectorAll('td')[0];
        expect(cell, `Même valeur J5 pour ${axis.name}.`).toHaveTextContent(exact);
      }
    });
  });
});
