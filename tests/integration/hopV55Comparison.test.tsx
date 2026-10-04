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
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioResult
} from '../../src/domain/brewingScenario';
import { brewingScenarioViewModel } from '../../src/domain/brewingScenarioTools';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55Comparison } from '../../src/ui/hopV55/Comparison';
import modelPack from '../../src/data/hopExtrapolationBootstrap.json';
import definitions from '../../src/data/hopKnowledgeBootstrap.json';
import studyPack from '../../src/data/hopStudyBootstrap.json';

afterEach(cleanup);

const model = structuredClone(modelPack[0]) as HopExtrapolation;
const source: HopSource = { ...model.source, kind: 'manufacturer', year: 2026 };
const axes = definitions.filter(row => row.kind === 'axis') as HopAxis[];
const panelAxis = (studyPack as unknown as { hopKnowledge: HopAxis[] }).hopKnowledge.find(axis => axis.id === 'citrus-lafontaine');
if (!panelAxis) throw new Error('La fixture doit conserver l’axe panel Citrus de 0 à 15.');
const lagerYeast: HopYeast = { id: 'qa-lager-yeast', kind: 'yeast', name: 'Souche lager QA', betaLyase: 'unknown', source };
const aleYeast: HopYeast = { id: 'qa-ale-yeast', kind: 'yeast', name: 'Souche ale QA', betaLyase: 'unknown', source };
// Test-only parameters produce a narrow asymmetric envelope; they are never stored as product data.
function collapseFixtureParameters(value: unknown, path: string[] = []): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach((item, index) => collapseFixtureParameters(item, [...path, String(index)])); return; }
  const record = value as Record<string, unknown>;
  if (path[0] === 'descriptor' && ['unmentioned', 'unknown'].includes(path[1] ?? '')) return;
  const range = record.range as { min?: unknown; max?: unknown } | undefined;
  if (range && typeof record.central === 'number' && Number.isFinite(record.central)) {
    record.range = { min: record.central, max: record.central };
  }
  Object.entries(record).forEach(([key, nested]) => collapseFixtureParameters(nested, [...path, key]));
}
collapseFixtureParameters(model);
model.residual.range = { min: 0, max: 0.02 };
model.residual.central = 0;
for (const kind of Object.keys(model.sourceUncertainty) as Array<keyof HopExtrapolation['sourceUncertainty']>) {
  model.sourceUncertainty[kind].range = { min: 0, max: 0 };
  model.sourceUncertainty[kind].central = 0;
}
model.undatedUncertainty.range = { min: 0, max: 0 };
model.undatedUncertainty.central = 0;
model.unknownFormUncertainty.range = { min: 0, max: 0 };
model.unknownFormUncertainty.central = 0;
if (!model.yeasts[0]) throw new Error('La fixture du modèle doit exposer un profil de souche réutilisable.');
const yeastProfile = model.yeasts[0];
model.yeasts = [{
  ...yeastProfile,
  yeastId: lagerYeast.id,
  aroma: Object.fromEntries(Object.keys(yeastProfile.aroma).map(id => [id, structuredClone(model.defaultYeast.aroma)])),
  expression: Object.fromEntries(Object.keys(yeastProfile.expression).map(id => [id, structuredClone(model.defaultYeast.expression)])),
  otherAroma: structuredClone(model.defaultYeast.aroma),
  otherExpression: structuredClone(model.defaultYeast.expression)
}];

const variety = (id: string, name: string, description: string): HopVariety => ({
  id, name, aliases: [], form: 'pelletT90',
  descriptions: [{ text: description, context: 'rawHop', source }],
  analysis: []
});
const hallertau = variety('qa-hallertau', 'Hallertau QA', 'agrumes bergamote floral');
const saaz = variety('qa-saaz', 'Saaz QA', 'floral épicé herbacé');
const material = (hop: HopVariety): HopDecisionMaterial => ({ id: `material-${hop.id}`, name: hop.name, form: hop.form, variety: hop });
const materials = [material(hallertau), material(saaz)];

const triplet = (varietyId: string, yeastId: string | null, patch: Partial<HopTriplet> = {}): HopTriplet => ({
  varietyId, lotId: null, yeastId, timing: patch.timing ?? 'postFermentation', doseGL: 4,
  temperatureC: patch.temperatureC ?? model.timings[patch.timing ?? 'postFermentation'].temperatureC.central,
  contactHours: 24, matrixId: null, ...patch
});
const input = (varietyId: string, yeastId: string | null, doseGL: number, timing: HopTriplet['timing']): HopRecipeInput => ({
  volumeL: 20,
  yeastId,
  additions: [{ id: `addition-${varietyId}`, name: `Ajout ${varietyId}`, triplet: triplet(varietyId, yeastId, { doseGL, timing }) }],
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 18, days: 10 }]
});

function scenario(baselineInput = input(hallertau.id, lagerYeast.id, 4, 'postFermentation')): BrewingScenarioResult {
  const engineData: HopEngineData = {
    varieties: [hallertau, saaz],
    lots: [],
    knowledge: [...structuredClone(axes), structuredClone(panelAxis), lagerYeast, aleYeast, model]
  };
  const request = buildBrewingScenarioRequest({
    scenarioId: 'qa-hop-v55-comparison',
    revision: 1,
    baseline: {
      kind: 'hypothetical',
      label: baselineInput.additions[0]?.triplet.timing === 'boil' ? 'Base à ébullition' : 'Base Hallertau',
      input: baselineInput
    },
    target: { citrus: { min: 55, max: 85 } }
  });
  request.branches.push({
    id: 'saaz-close', label: 'Option Saaz proche',
    input: input(saaz.id, aleYeast.id, 4.1, 'whirlpool'), assumptions: []
  });
  request.branches.push({
    id: 'unknown-strain', label: 'Option souche inconnue',
    input: input(hallertau.id, null, 4, 'postFermentation'), assumptions: []
  });
  return simulateBrewingScenario(request, { engineData, materials });
}

function sourceProgramScenario(): BrewingScenarioResult {
  const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
  const current = prepared.runtime.current;
  if (!current?.program || current.program.additions.length < 2) throw new Error('La fixture doit porter deux lignes au programme source.');
  const program = structuredClone(current.program);
  program.additions[0].status = 'performed';
  program.additions[1].status = 'planned';
  prepared.runtime.current = { ...current, program, performedAdditionIds: [program.additions[0].id] };
  const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'source-program-scope-fixture', revision: 1,
    branches: [], intent: { question: 'Qualifier la projection complète du programme source.', criteria: [] } });
  return simulateBrewingScenario(request, prepared.runtime);
}

const result = scenario();
const view = brewingScenarioViewModel(result);
const testAxes = view.axes.slice(0, Math.min(4, view.axes.length)).map(axis => axis.id);

function comparison(overrides: Partial<React.ComponentProps<typeof HopV55Comparison>> = {}) {
  return {
    result,
    branchIds: ['baseline', 'saaz-close'],
    axisIds: testAxes,
    mode: 'bars' as const,
    onModeChange: vi.fn(),
    onToggleBranch: vi.fn(),
    onToggleAxis: vi.fn(),
    onChooseBranch: vi.fn(),
    selectedBranchId: 'baseline',
    ...overrides
  };
}

const frExact = (value: number) => {
  const [integer, decimals] = String(value).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
};

describe('Comparaison V5.5 des profils', () => {
  it('bascule sur les mêmes branches et axes, sans perdre les valeurs, plages, centrales ou références', async () => {
    const candidateAxis = view.axes.filter(axis => testAxes.includes(axis.id)).find(axis => {
      const first = axis.values.find(value => value.branchId === 'baseline')?.estimate;
      const second = axis.values.find(value => value.branchId === 'saaz-close')?.estimate;
      return first?.range && second?.range && Math.max(first.range.min, second.range.min) <= Math.min(first.range.max, second.range.max);
    });
    expect(candidateAxis, 'Le fixture doit éprouver deux plages qui se recouvrent.').toBeDefined();
    const baselineEstimate = candidateAxis!.values.find(value => value.branchId === 'baseline')!.estimate!;
    expect(baselineEstimate.central, 'Le fixture doit conserver une centrale explicite.').toBeDefined();
    expect(baselineEstimate.range!.max - baselineEstimate.range!.min, 'Le fixture doit garder une petite plage visible sur l’échelle 0–100.').toBeLessThan(10);
    expect(baselineEstimate.central).not.toBe((baselineEstimate.range!.min + baselineEstimate.range!.max) / 2);

    const props = comparison();
    const { rerender, container } = render(<HopV55Comparison {...props} />);
    const user = userEvent.setup();
    const originalRange = `${frExact(baselineEstimate.range!.min)}–${frExact(baselineEstimate.range!.max)}`;
    const originalCentral = frExact(baselineEstimate.central!);
    expect(container.querySelector('.hv55-cmp-bar-row')).toHaveAttribute('data-axis', candidateAxis!.id);

    await user.click(screen.getByRole('button', { name: 'Radar' }));
    expect(props.onModeChange).toHaveBeenCalledWith('radar');
    expect(props.onToggleBranch).not.toHaveBeenCalled();
    expect(props.onToggleAxis).not.toHaveBeenCalled();
    expect(props.onChooseBranch).not.toHaveBeenCalled();

    rerender(<HopV55Comparison {...props} mode="radar" />);
    expect(screen.getByRole('img', { name: /Radar des profils comparés/ })).toBeInTheDocument();
    const exactDetails = screen.getByText(/Valeurs exactes, statut et sources/).closest('details')!;
    await user.click(exactDetails.querySelector('summary')!);
    const valuesTable = within(exactDetails).getByRole('table');
    const candidateRow = within(valuesTable).getByRole('row', { name: new RegExp(candidateAxis!.name) });
    const baselineCell = candidateRow.querySelector('td')!;
    expect(baselineCell.textContent).toContain(originalRange);
    expect(baselineCell.textContent).toContain(`centre ${originalCentral}`);
    await user.click(baselineCell.querySelector('.hv55-cmp-source-details summary')!);
    expect(baselineCell).toHaveTextContent(`Référence de branche : ${result.baseline.reference}`);
    expect(screen.getByRole('checkbox', { name: /Comparer Base Hallertau/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Comparer Option Saaz proche/ })).toBeChecked();
    expect(props.onToggleBranch).not.toHaveBeenCalled();
    expect(props.onToggleAxis).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Barres' }));
    expect(props.onModeChange).toHaveBeenLastCalledWith('bars');
    rerender(<HopV55Comparison {...props} mode="bars" />);
    expect(container.querySelectorAll('.hv55-cmp-bar-row')).toHaveLength(testAxes.length);
    expect(screen.getByRole('checkbox', { name: /Comparer Base Hallertau/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Comparer Option Saaz proche/ })).toBeChecked();
  });

  it('garde dose, moment et souche séparés par branche et expose les axes et contrôles parentaux', async () => {
    const props = comparison({ branchIds: ['baseline', 'saaz-close'] });
    render(<HopV55Comparison {...props} />);
    expect(screen.getByText(/volume hypothétique 20 L · souche Souche lager QA · Ajout hypothétique · Hallertau QA · dose 4 g\/L · moment Après fermentation/)).toBeInTheDocument();
    expect(screen.getByText(/volume de la projection 20 L · souche Souche ale QA · Ajout hypothétique · Saaz QA · dose 4,1 g\/L · moment Whirlpool/)).toBeInTheDocument();

    const unknownBranch = screen.getByRole('checkbox', { name: /Comparer Option souche inconnue/ });
    const user = userEvent.setup();
    await user.click(unknownBranch);
    expect(props.onToggleBranch).toHaveBeenCalledWith('unknown-strain');
    const unselectedAxis = view.axes.find(axis => !testAxes.includes(axis.id))!;
    await user.click(screen.getByRole('checkbox', { name: new RegExp(unselectedAxis.name) }));
    expect(props.onToggleAxis).toHaveBeenCalledWith(unselectedAxis.id);
    const baselineOption = screen.getByRole('checkbox', { name: /Comparer Base Hallertau/ }).closest('.hv55-cmp-branch') as HTMLElement;
    await user.click(within(baselineOption).getByRole('button', { name: 'Choix courant' }));
    expect(props.onChooseBranch).toHaveBeenCalledWith('baseline');
  });

  it('présente la durée d’ébullition et les contacts courts en minutes, sans modifier les heures du snapshot', () => {
    const boilingInput = input(hallertau.id, lagerYeast.id, 0.6125, 'boil');
    boilingInput.additions[0].triplet.contactHours = 5 / 60;
    boilingInput.additions[0].triplet.temperatureC = 100;
    boilingInput.additions.push({ id: 'short-contact', name: 'Contact court',
      triplet: { ...boilingInput.additions[0].triplet, timing: 'postFermentation', doseGL: 0.25, contactHours: 0.5 } });
    const formattedResult = scenario(boilingInput);
    const { container } = render(<HopV55Comparison {...comparison({ result: formattedResult, branchIds: ['baseline'], axisIds: ['citrus'] })} />);
    expect(container).toHaveTextContent('Ajout hypothétique · Hallertau QA · dose 0,6125 g/L · moment Ébullition · 100 °C · 5 min de contact');
    expect(container).toHaveTextContent('Ajout hypothétique · Hallertau QA · dose 0,25 g/L · moment Après fermentation · 100 °C · 30 min de contact');
    expect(formattedResult.baseline.input.additions[0].triplet.contactHours).toBe(5 / 60);
    expect(formattedResult.baseline.input.additions[0].triplet.doseGL).toBe(0.6125);
  });

  it('conserve l’échelle propre du panel 0–15 quand l’axe est disponible sans estimation supportée', async () => {
    const axis = view.axes.find(candidate => candidate.id === panelAxis.id)!;
    expect(axis.scale).toEqual({ min: 0, max: 15 });
    expect(axis.values.find(value => value.branchId === 'baseline')?.estimate?.range).toBeNull();
    const props = comparison({ branchIds: ['baseline'], axisIds: [panelAxis.id] });
    const { rerender, container } = render(<HopV55Comparison {...props} />);
    expect(screen.getByRole('checkbox', { name: /Agrumes · panel Lafontaine.*0–15/ })).toBeChecked();
    expect(container.querySelector('.hv55-cmp-bar-row')).toHaveAttribute('data-axis', panelAxis.id);
    expect(container.querySelector('.hv55-cmp-track')?.getAttribute('aria-label')).toContain('échelle du modèle 0–15');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Radar' }));
    rerender(<HopV55Comparison {...props} mode="radar" />);
    expect(screen.getByRole('img', { name: /Radar des profils comparés/ })).toBeInTheDocument();
    expect(screen.getByText(/Base Hallertau · hypothèse explicite · profil total projeté : inconnues — Agrumes · panel Lafontaine/)).toBeInTheDocument();
    const exact = screen.getByText(/Valeurs exactes, statut et sources/).closest('details')!;
    await user.click(exact.querySelector('summary')!);
    expect(within(within(exact).getByRole('table')).getByRole('row', { name: /Agrumes · panel Lafontaine/ })).toHaveTextContent('0–15');
  });

  it('laisse une souche manquante inconnue : aucun zéro ni polygone fermé ne la remplace', async () => {
    const unknownEstimate = view.axes[0].values.find(value => value.branchId === 'unknown-strain')?.estimate;
    expect(unknownEstimate?.range).toBeNull();
    expect(unknownEstimate?.central).toBeUndefined();

    const { container } = render(<HopV55Comparison {...comparison({ branchIds: ['baseline', 'unknown-strain'], mode: 'radar' })} />);
    const unknownSeries = container.querySelector<SVGGElement>('.hv55-cmp-radar-series[data-branch-id="unknown-strain"]');
    expect(unknownSeries).not.toBeNull();
    expect(unknownSeries!.querySelector('.hv55-cmp-radar-range')).toBeNull();
    expect(unknownSeries!.querySelector('.hv55-cmp-radar-extent')).toBeNull();
    expect(unknownSeries!.querySelector('.hv55-cmp-radar-central-point')).toBeNull();
    expect(screen.getByText(/Option souche inconnue · hypothèse de branche · profil total projeté : inconnues/)).toBeInTheDocument();

    const exactDetails = screen.getByText(/Valeurs exactes, statut et sources/).closest('details')!;
    await userEvent.setup().click(within(exactDetails).getByText(/Valeurs exactes, statut et sources/));
    const exactTable = within(exactDetails).getByRole('table');
    const firstAxisRow = within(exactTable).getByRole('row', { name: new RegExp(view.axes[0].name) });
    const unknownCell = firstAxisRow.querySelectorAll('td')[1] as HTMLElement;
    expect(within(unknownCell).getByText('Inconnu')).toBeInTheDocument();
    expect(within(unknownCell).getByText('centre non fourni')).toBeInTheDocument();
  });

  it('qualifie le baseline recette comme projection totale du programme après ajouts prévus, sans le confondre avec une dégustation', async () => {
    const sourceResult = sourceProgramScenario();
    expect(sourceResult.requestSnapshot.baseline.kind).toBe('recipe');
    expect(sourceResult.baseline.program?.additions.map(addition => addition.status)).toEqual(['performed', 'planned']);
    const sourceView = brewingScenarioViewModel(sourceResult);
    const inputSnapshot = structuredClone(sourceResult.baseline.input);
    const props = comparison({ result: sourceResult, branchIds: ['baseline'], axisIds: sourceView.axes.slice(0, 3).map(axis => axis.id) });
    const { container, rerender } = render(<HopV55Comparison {...props} />);
    const sourceScope = 'Projection du profil total du programme source · après les ajouts prévus';
    expect(screen.getByRole('checkbox', { name: `Comparer ${sourceScope}` })).toBeChecked();
    expect(container).toHaveTextContent(`${sourceScope} :`);
    expect(container).toHaveTextContent('Ajout effectué');
    expect(container).toHaveTextContent('Ajout prévu');
    expect(container).not.toHaveTextContent('État courant');
    const track = container.querySelector('.hv55-cmp-track')!;
    expect(track.getAttribute('aria-label')).toContain(sourceScope);
    expect(container.querySelector('.hv55-cmp-legend')?.textContent).toContain(sourceScope);
    const valuesTable = container.querySelector('.hv55-cmp-table-region')!;
    const tableBefore = valuesTable.textContent;

    await userEvent.setup().click(screen.getByRole('button', { name: 'Radar' }));
    rerender(<HopV55Comparison {...props} mode="radar" />);
    expect(container.querySelector('.hv55-cmp-radar')?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(container.querySelector('.hv55-cmp-radar')?.querySelector('desc')).toHaveTextContent(sourceScope);
    expect(container.querySelector('.hv55-cmp-table-region')?.textContent).toBe(tableBefore);
    expect(sourceResult.baseline.input).toEqual(inputSnapshot);
    expect(brewingScenarioViewModel(sourceResult)).toEqual(sourceView);
  });
});
