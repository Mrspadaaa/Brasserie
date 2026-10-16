import React, { useState } from 'react';
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
  type BrewingScenarioBranchRequest,
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

function scenario(baselineInput = input(hallertau.id, lagerYeast.id, 4, 'postFermentation'), extraBranches: BrewingScenarioBranchRequest[] = []): BrewingScenarioResult {
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
  request.branches.push(...extraBranches);
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

// Identity is defined by the result order (baseline, then branches), never by the current selection.
const branchLabels: Record<string, string> = { baseline: 'Base Hallertau', 'saaz-close': 'Option Saaz proche', 'unknown-strain': 'Option souche inconnue' };
const expectedMarkers: Record<string, string> = { baseline: '\u25cf', 'saaz-close': '\u25b2', 'unknown-strain': '\u25a0' };
const expectedCaps: Record<string, string> = { baseline: '\u25cb', 'saaz-close': '\u25b3', 'unknown-strain': '\u25a1' };

const markerOf = (element: Element | null | undefined) => element?.querySelector('.hv55-cmp-marker')?.textContent ?? undefined;

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

/** Parent state as Page keeps it: the real toggles drive mode, series, axes and choice. */
function ComparisonHarness({ initial, onChoose }: {
  initial: Pick<React.ComponentProps<typeof HopV55Comparison>, 'branchIds' | 'axisIds' | 'mode'> & { result?: BrewingScenarioResult };
  onChoose?: (id: string) => void;
}) {
  const [mode, setMode] = useState(initial.mode);
  const [branchIds, setBranchIds] = useState(initial.branchIds);
  const [axisIds, setAxisIds] = useState(initial.axisIds);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(item => item !== id) : [...list, id];
  return <HopV55Comparison result={initial.result ?? result} branchIds={branchIds} axisIds={axisIds} mode={mode} onModeChange={setMode}
    onToggleBranch={id => setBranchIds(current => toggle(current, id))} onToggleAxis={id => setAxisIds(current => toggle(current, id))}
    onChooseBranch={id => { setSelectedBranchId(id); onChoose?.(id); }} selectedBranchId={selectedBranchId} />;
}

const radarLabels = (root: ParentNode) => [...root.querySelectorAll('.hv55-cmp-radar-label')].map(label => {
  const clone = label.cloneNode(true) as Element;
  clone.querySelectorAll('title').forEach(title => title.remove());
  return clone.textContent;
});

/** Axis rows outside the radar reader: axis, lane identity and the quick value of each branch. */
const axisRows = (root: ParentNode) => [...root.querySelectorAll('.hv55-cmp-bar-row:not(.hv55-cmp-reader-row)')].map(row => ({
  axis: row.getAttribute('data-axis'),
  lanes: [...row.querySelectorAll('.hv55-cmp-lane')].map(lane => `${lane.getAttribute('data-branch-id')}:${lane.getAttribute('data-series-marker')}`),
  values: [...row.querySelectorAll('.hv55-cmp-value')].map(value => value.textContent)
}));

const axisCheckbox = (root: ParentNode, axisId: string) => {
  const name = view.axes.find(axis => axis.id === axisId)!.name;
  return [...root.querySelectorAll('.hv55-cmp-axis-list label')].find(label => label.querySelector('span')?.textContent === name)!.querySelector('input')!;
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
    const exactDetails = screen.getByText(/^Valeurs exactes, statut et sources · \d+ axes?$/).closest('details')!;
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

  it('V4 : une ébullition sans température déclarée ne porte pas « température inconnue »', () => {
    const boilingInput = input(hallertau.id, lagerYeast.id, 0.6125, 'boil');
    boilingInput.additions[0].triplet.contactHours = 1;
    boilingInput.additions[0].triplet.temperatureC = null;
    const { container } = render(<HopV55Comparison {...comparison({ result: scenario(boilingInput), branchIds: ['baseline'], axisIds: ['citrus'] })} />);
    expect(container).toHaveTextContent('Ajout hypothétique · Hallertau QA · dose 0,613 g/L (0,6125 g/L exacts) · moment Ébullition · 60 min de contact');
    // Source notes may still say « température inconnue » about extrapolation; the boil line itself must not.
    expect(container.textContent).not.toMatch(/moment Ébullition · température inconnue/u);
  });

  it('#75 : la dose s’écrit à 3 décimales avec sa valeur complète, jamais en flottant long', () => {
    const doseInput = input(hallertau.id, lagerYeast.id, 40 / 30, 'boil');
    doseInput.additions[0].triplet.contactHours = 1;
    doseInput.additions[0].triplet.temperatureC = null;
    const { container } = render(<HopV55Comparison {...comparison({ result: scenario(doseInput), branchIds: ['baseline'], axisIds: ['citrus'] })} />);
    expect(container).toHaveTextContent('Ajout hypothétique · Hallertau QA · dose 1,333 g/L (4/3 g/L exacts) · moment Ébullition');
    expect(container.textContent).not.toMatch(/1,3333/u);
  });

  it('présente la durée d’ébullition et les contacts courts en minutes, sans modifier les heures du snapshot', () => {
    const boilingInput = input(hallertau.id, lagerYeast.id, 0.6125, 'boil');
    boilingInput.additions[0].triplet.contactHours = 5 / 60;
    boilingInput.additions[0].triplet.temperatureC = 100;
    boilingInput.additions.push({ id: 'short-contact', name: 'Contact court',
      triplet: { ...boilingInput.additions[0].triplet, timing: 'postFermentation', doseGL: 0.25, contactHours: 0.5 } });
    const formattedResult = scenario(boilingInput);
    const { container } = render(<HopV55Comparison {...comparison({ result: formattedResult, branchIds: ['baseline'], axisIds: ['citrus'] })} />);
    expect(container).toHaveTextContent('Ajout hypothétique · Hallertau QA · dose 0,613 g/L (0,6125 g/L exacts) · moment Ébullition · 100 °C · 5 min de contact');
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
    expect(screen.queryByRole('img', { name: /Radar des profils comparés/ }), 'Un seul axe n’est pas présenté comme un radar de profil.').toBeNull();
    expect(container.querySelector('.hv55-cmp-radar-unavailable')).toHaveTextContent('Une forme de profil exige au moins trois axes ; un seul axe est choisi.');
    expect(container.querySelector('.hv55-cmp-axis-reading .hv55-cmp-bar-row')).toHaveAttribute('data-axis', panelAxis.id);
    expect(container.querySelector('.hv55-cmp-axis-reading .hv55-cmp-track')?.getAttribute('aria-label')).toContain('échelle du modèle 0–15');
    expect(screen.getByText(/Base Hallertau · hypothèse explicite · profil total projeté : inconnues — Agrumes · panel Lafontaine/)).toBeInTheDocument();
    const exact = screen.getByText(/^Valeurs exactes, statut et sources · \d+ axes?$/).closest('details')!;
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

    const exactDetails = screen.getByText(/^Valeurs exactes, statut et sources · \d+ axes?$/).closest('details')!;
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

  it('C01 · garde la même identité par branche dans sélection, légende, Barres, Radar, lacunes et tableau', () => {
    const viewBefore = structuredClone(view);
    const states = [
      ['saaz-close', 'unknown-strain'],
      ['unknown-strain', 'saaz-close'],
      ['unknown-strain', 'saaz-close', 'baseline']
    ];
    const cellsByBranch = new Map<string, string>();
    for (const branchIds of states) {
      for (const mode of ['bars', 'radar'] as const) {
        const { container, unmount } = render(<HopV55Comparison {...comparison({ branchIds, axisIds: testAxes, mode })} />);
        const headers = [...container.querySelectorAll('.hv55-cmp-table-region thead th')];
        const firstRow = container.querySelector('.hv55-cmp-table-region tbody tr')!;
        for (const id of branchIds) {
          const label = branchLabels[id];
          const expected = expectedMarkers[id];
          const state = `${branchIds.join('+')} · ${mode} · ${id}`;
          expect(markerOf(screen.getByRole('checkbox', { name: new RegExp(`Comparer ${label}`) }).closest('label')), `sélection ${state}`).toBe(expected);
          expect(markerOf([...container.querySelectorAll('.hv55-cmp-legend-item')].find(item => item.textContent?.includes(label))), `légende ${state}`).toBe(expected);
          const headerIndex = headers.findIndex(header => header.textContent?.includes(label));
          expect(markerOf(headers[headerIndex]), `tableau ${state}`).toBe(expected);
          const cell = firstRow.querySelectorAll('td')[headerIndex - 1].querySelector('strong')!.textContent! + firstRow.querySelectorAll('td')[headerIndex - 1].querySelector('span')!.textContent!;
          if (!cellsByBranch.has(id)) cellsByBranch.set(id, cell);
          expect(cell, `valeur inchangée ${state}`).toBe(cellsByBranch.get(id));
          if (mode === 'bars') {
            const values = [...container.querySelectorAll('.hv55-cmp-bars .hv55-cmp-value')].filter(item => item.textContent?.includes(label));
            expect(values).toHaveLength(testAxes.length);
            values.forEach(value => expect(markerOf(value), `valeurs Barres ${state}`).toBe(expected));
            const lanes = [...container.querySelectorAll(`.hv55-cmp-bars .hv55-cmp-lane[data-branch-id="${id}"]`)];
            expect(lanes, `couloirs Barres ${state}`).toHaveLength(testAxes.length);
            lanes.forEach(lane => expect(lane.querySelector('.hv55-cmp-lane-mark')?.textContent, `couloir ${state}`).toBe(expected));
          } else {
            const series = container.querySelector(`.hv55-cmp-radar-series[data-branch-id="${id}"]`)!;
            expect(series.getAttribute('data-series-marker'), `radar ${state}`).toBe(expected);
            series.querySelectorAll('.hv55-cmp-radar-central-point').forEach(point =>
              expect(point.textContent?.endsWith(expected), `centrale radar ${state}`).toBe(true));
            series.querySelectorAll('.hv55-cmp-radar-range-cap').forEach(cap => expect(cap.textContent, `borne radar ${state}`).toBe(expectedCaps[id]));
            const gap = [...container.querySelectorAll('.hv55-cmp-radar-gaps li')].find(item => item.textContent?.includes(label));
            if (gap) expect(markerOf(gap), `lacune ${state}`).toBe(expected);
          }
        }
        if (mode === 'radar') {
          expect([...container.querySelectorAll('.hv55-cmp-radar-gaps li')].some(item => item.textContent?.includes(branchLabels['unknown-strain'])),
            'La branche sans souche doit rester listée comme inconnue.').toBe(true);
        }
        unmount();
      }
    }
    expect(brewingScenarioViewModel(result)).toEqual(viewBefore);
  });

  it('C02 · garde des plages recouvrantes sur des couloirs distincts, attribuables sans couleur ni bande inter-axes', async () => {
    const overlapAxis = view.axes.filter(axis => testAxes.includes(axis.id)).find(axis => {
      const first = axis.values.find(value => value.branchId === 'baseline')?.estimate?.range;
      const second = axis.values.find(value => value.branchId === 'saaz-close')?.estimate?.range;
      return first && second && Math.max(first.min, second.min) <= Math.min(first.max, second.max);
    });
    expect(overlapAxis, 'Le fixture doit éprouver deux plages qui se recouvrent.').toBeDefined();
    const props = comparison({ branchIds: ['baseline', 'saaz-close'], mode: 'radar' });
    const { container, rerender } = render(<HopV55Comparison {...props} />);
    const tableBefore = container.querySelector('.hv55-cmp-table-region')!.textContent;

    expect(container.querySelector('.hv55-cmp-radar-range'), 'Aucune bande ne relie deux plages marginales voisines.').toBeNull();
    const extents = (id: string) => [...container.querySelectorAll(`.hv55-cmp-radar-series[data-branch-id="${id}"] .hv55-cmp-radar-extent`)].map(segmentOf);
    const baselineExtents = extents('baseline');
    const saazExtents = extents('saaz-close');
    expect(baselineExtents.length).toBeGreaterThan(0);
    expect(saazExtents.length).toBeGreaterThan(0);
    for (const a of baselineExtents) for (const b of saazExtents) expect(sameTrace(a, b), 'Deux séries ne partagent jamais le même tracé de plage.').toBe(false);
    for (const id of ['baseline', 'saaz-close']) {
      const caps = [...container.querySelectorAll(`.hv55-cmp-radar-series[data-branch-id="${id}"] .hv55-cmp-radar-range-cap`)];
      expect(caps.length, `Chaque plage de ${id} porte le symbole creux de sa série.`).toBeGreaterThan(0);
      caps.forEach(cap => expect(cap.textContent).toBe(expectedCaps[id]));
    }

    const reader = screen.getByRole('group', { name: 'Lire les valeurs exactes d’un axe du radar' });
    await userEvent.setup().click(within(reader).getByRole('button', { name: overlapAxis!.name }));
    expect(within(reader).getByRole('button', { name: overlapAxis!.name })).toHaveAttribute('aria-pressed', 'true');
    const readerRow = container.querySelector(`.hv55-cmp-reader-row[data-axis="${overlapAxis!.id}"]`)!;
    expect([...readerRow.querySelectorAll('.hv55-cmp-lane-mark')].map(mark => mark.textContent)).toEqual(['●', '▲']);
    expect(readerRow).toHaveTextContent(`${branchLabels.baseline}`);
    expect(readerRow).toHaveTextContent(`${branchLabels['saaz-close']}`);

    rerender(<HopV55Comparison {...props} mode="bars" />);
    const row = container.querySelector(`.hv55-cmp-bars .hv55-cmp-bar-row[data-axis="${overlapAxis!.id}"]`)!;
    const lanes = [...row.querySelectorAll('.hv55-cmp-lane')];
    expect(lanes.map(lane => lane.getAttribute('data-branch-id'))).toEqual(['baseline', 'saaz-close']);
    expect(lanes.map(lane => lane.querySelector('.hv55-cmp-lane-mark')?.textContent)).toEqual(['●', '▲']);
    lanes.forEach(lane => expect(lane.querySelectorAll('.hv55-cmp-interval')).toHaveLength(1));
    expect(container.querySelector('.hv55-cmp-table-region')!.textContent).toBe(tableBefore);
  });

  const centralAbsent = view.axes.flatMap(axis => axis.values
    .filter(value => value.estimate?.range && value.estimate.central == null)
    .map(value => ({ axis, branchId: value.branchId })))[0];
  // The synthetic J5 seed of the fixtures actor carries this case; this local fixture runs it only when the engine produces it.
  it.runIf(!!centralAbsent)('C02 · ne dessine aucune centrale quand le modèle n’en fournit pas', () => {
    const { axis, branchId } = centralAbsent!;
    // Three axes so the radar draws a profile; the checked axis keeps its own row and spoke.
    const axisIds = [axis.id, ...view.axes.filter(other => other.id !== axis.id).slice(0, 2).map(other => other.id)];
    const props = comparison({ branchIds: [branchId], axisIds });
    const { container, rerender } = render(<HopV55Comparison {...props} />);
    const row = container.querySelector(`.hv55-cmp-bars .hv55-cmp-bar-row[data-axis="${axis.id}"]`)!;
    const lane = row.querySelector(`.hv55-cmp-lane[data-branch-id="${branchId}"]`)!;
    expect(lane.querySelector('.hv55-cmp-interval')).not.toBeNull();
    expect(lane.querySelector('.hv55-cmp-central')).toBeNull();
    expect(row.querySelector('.hv55-cmp-value')).toHaveTextContent('centre non fourni');
    rerender(<HopV55Comparison {...props} mode="radar" />);
    const series = container.querySelector(`.hv55-cmp-radar-series[data-branch-id="${branchId}"]`)!;
    expect(series.querySelector(`[data-axis="${axis.id}"] .hv55-cmp-radar-extent`)).not.toBeNull();
    const centralPoints = [...series.querySelectorAll('.hv55-cmp-radar-central-point')];
    expect(centralPoints.every(point => point.hasAttribute('data-axis')), 'Chaque centrale tracée porte son axe.').toBe(true);
    expect(series.querySelector(`.hv55-cmp-radar-central-point[data-axis="${axis.id}"]`)).toBeNull();
  });

  it('C02 lisibilité · noms d’axes entiers sur le radar, lecture rapide arrondie et valeurs exactes conservées', () => {
    const axisIds = [...testAxes, panelAxis.id];
    const props = comparison({ branchIds: ['baseline', 'saaz-close', 'unknown-strain'], axisIds, mode: 'radar' });
    const { container, rerender } = render(<HopV55Comparison {...props} />);
    const shownAxes = view.axes.filter(axis => axisIds.includes(axis.id));
    expect(shownAxes.some(axis => axis.name.length > 15), 'Le fixture doit porter un nom d’axe long.').toBe(true);
    const labels = [...container.querySelectorAll('.hv55-cmp-radar-label')].map(label => {
      const clone = label.cloneNode(true) as Element;
      clone.querySelectorAll('title').forEach(title => title.remove());
      return clone.textContent;
    });
    expect(labels, 'Chaque nom d’axe reste entier : ni troncature, ni « … ».').toEqual(shownAxes.map(axis => axis.name));
    const tableRadar = container.querySelector('.hv55-cmp-table-region')!.textContent;

    rerender(<HopV55Comparison {...props} mode="bars" />);
    expect(container.querySelector('.hv55-cmp-table-region')!.textContent, 'Le tableau exact ne change pas.').toBe(tableRadar);
    expect(container.querySelector('.hv55-cmp-bars')).toHaveTextContent('≈ : lecture arrondie');
    let roundedSeen = false;
    for (const axis of shownAxes) {
      for (const value of axis.values) {
        const node = container.querySelector(`.hv55-cmp-bars .hv55-cmp-bar-row[data-axis="${axis.id}"] .hv55-cmp-value[data-branch-id="${value.branchId}"]`)!;
        const quick = node.querySelector('.hv55-cmp-value-quick')!;
        const exact = node.querySelector('.hv55-cmp-sr-only')!;
        expect(quick).toHaveAttribute('aria-hidden', 'true');
        const range = value.estimate?.range;
        if (!range) {
          expect(quick.textContent).toBe('Inconnu');
          expect(exact).toHaveTextContent('Inconnu · centre non fourni');
          continue;
        }
        const exactRange = `${frExact(range.min)}–${frExact(range.max)}`;
        expect(exact, 'Le texte exact reste disponible pour les lecteurs d’écran.').toHaveTextContent(exactRange);
        expect(quick.textContent, 'La lecture rapide ne garde pas de longues décimales.').not.toMatch(/\d,\d{4,}/);
        if (/\d,\d{3,}/.test(exactRange)) {
          expect(quick.textContent).toContain('≈');
          roundedSeen = true;
        }
        if (value.estimate?.central == null) expect(quick.textContent, 'Aucune centrale n’est inventée.').toContain('centre non fourni');
        else expect(quick.textContent).toMatch(/centre (≈ )?\d/);
      }
    }
    expect(roundedSeen, 'Le fixture doit éprouver au moins une valeur longue arrondie.').toBe(true);
  });

  it('Creuset · trois axes du même résultat font une forme ; un ou deux axes restent en lecture par axe, mêmes séries, valeurs et table', async () => {
    expect(testAxes.length, 'Le fixture doit offrir au moins trois axes de profil.').toBeGreaterThanOrEqual(3);
    const three = testAxes.slice(0, 3);
    const threeNames = view.axes.filter(axis => three.includes(axis.id)).map(axis => axis.name);
    const viewBefore = structuredClone(view);
    const user = userEvent.setup();
    const { container } = render(<ComparisonHarness initial={{ branchIds: ['baseline', 'saaz-close', 'unknown-strain'], axisIds: three, mode: 'bars' }} />);
    const tableText = () => container.querySelector('.hv55-cmp-table-region')!.textContent;
    const radar = () => container.querySelector('svg.hv55-cmp-radar');
    const barsThree = axisRows(container);
    const tableThree = tableText();
    expect(barsThree.map(row => row.axis)).toEqual(view.axes.filter(axis => three.includes(axis.id)).map(axis => axis.id));

    await user.click(screen.getByRole('button', { name: 'Radar' }));
    expect(radar(), 'Trois axes du même résultat J5 forment un profil.').not.toBeNull();
    expect(radarLabels(container)).toEqual(threeNames);
    expect(container.querySelector('.hv55-cmp-radar-unavailable')).toBeNull();
    expect(container.querySelector('.hv55-cmp-radar-note')).toHaveTextContent('des bornes égales ne font pas une calibration commune');
    expect(tableText()).toBe(tableThree);

    // Filter one series then restore it: identities follow the result order, not the toggling order.
    await user.click(screen.getByRole('checkbox', { name: /Comparer Option Saaz proche/ }));
    expect(container.querySelector('.hv55-cmp-radar-series[data-branch-id="saaz-close"]')).toBeNull();
    expect(container.querySelector('.hv55-cmp-radar-series[data-branch-id="unknown-strain"]')).toHaveAttribute('data-series-marker', expectedMarkers['unknown-strain']);
    await user.click(screen.getByRole('checkbox', { name: /Comparer Option Saaz proche/ }));
    expect(container.querySelector('.hv55-cmp-radar-series[data-branch-id="saaz-close"]')).toHaveAttribute('data-series-marker', expectedMarkers['saaz-close']);
    expect(tableText()).toBe(tableThree);

    // Two spokes would be a line: the radar is not drawn, the brewer's mode is kept and the same lanes stay readable.
    await user.click(axisCheckbox(container, three[2]));
    expect(radar()).toBeNull();
    expect(screen.queryByRole('img', { name: /Radar des profils comparés/ })).toBeNull();
    expect(container.querySelector('.hv55-cmp-radar-unavailable')).toHaveTextContent('Une forme de profil exige au moins trois axes ; 2 axes sont choisis.');
    expect(screen.getByRole('button', { name: 'Radar' })).toHaveAttribute('aria-pressed', 'true');
    const radarTwo = axisRows(container);
    expect(radarTwo).toEqual(barsThree.slice(0, 2));
    const tableTwo = tableText();
    await user.click(screen.getByRole('button', { name: 'Barres' }));
    expect(axisRows(container)).toEqual(radarTwo);
    expect(tableText()).toBe(tableTwo);
    await user.click(screen.getByRole('button', { name: 'Radar' }));

    await user.click(axisCheckbox(container, three[1]));
    expect(radar()).toBeNull();
    expect(container.querySelector('.hv55-cmp-radar-unavailable')).toHaveTextContent('un seul axe est choisi');
    expect(axisRows(container)).toEqual(barsThree.slice(0, 1));

    // Restoring the same axes restores the same shape; exact values never moved.
    await user.click(axisCheckbox(container, three[1]));
    await user.click(axisCheckbox(container, three[2]));
    expect(radar()).not.toBeNull();
    expect(radarLabels(container)).toEqual(threeNames);
    expect(tableText()).toBe(tableThree);
    await user.click(screen.getByRole('button', { name: 'Barres' }));
    expect(axisRows(container)).toEqual(barsThree);
    expect(brewingScenarioViewModel(result)).toEqual(viewBefore);
  });

  it('Creuset · mélange valide : chaque élément garde matière, dose, moment et conditions reçus, sans dose cumulée, dans les deux lectures', async () => {
    const blendInput = input(hallertau.id, aleYeast.id, 2.5, 'whirlpool');
    blendInput.additions.push({ id: 'addition-blend-saaz', name: 'Ajout Saaz du mélange',
      triplet: triplet(saaz.id, aleYeast.id, { doseGL: 1.5, timing: 'postFermentation' }) });
    const blendResult = scenario(undefined, [{ id: 'blend', label: 'Option mélange Hallertau et Saaz', input: blendInput, assumptions: [] }]);
    const blendBranch = blendResult.branches.find(branch => branch.id === 'blend')!;
    expect(blendBranch.input.additions.map(addition => [addition.triplet.varietyId, addition.triplet.doseGL])).toEqual([[hallertau.id, 2.5], [saaz.id, 1.5]]);
    const inputBefore = structuredClone(blendBranch.input);
    const onChoose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<ComparisonHarness initial={{ result: blendResult, branchIds: ['baseline', 'blend'], axisIds: testAxes.slice(0, 3), mode: 'bars' }} onChoose={onChoose} />);
    const blendRow = () => container.querySelector('.hv55-cmp-branch[data-branch-id="blend"]') as HTMLElement;
    const context = () => blendRow().querySelector('.hv55-cmp-context')!.textContent!;
    const tableText = () => container.querySelector('.hv55-cmp-table-region')!.textContent;

    const contextBars = context();
    expect(contextBars).toMatch(/^volume de la projection 20 L · souche Souche ale QA · Ajout hypothétique · Hallertau QA · dose 2,5\sg\/L · moment Whirlpool · .+ ; Ajout hypothétique · Saaz QA · dose 1,5\sg\/L · moment Après fermentation · /);
    expect(contextBars, 'Aucune dose cumulée ni proportion n’est fabriquée pour le mélange.').not.toMatch(/dose 4\sg\/L|%/);
    expect(container.querySelector('.hv55-cmp-legend-item[data-branch-id="blend"]')).toHaveAttribute('data-series-marker', '◆');
    const tableBars = tableText();

    await user.click(screen.getByRole('button', { name: 'Radar' }));
    expect(container.querySelector('svg.hv55-cmp-radar')).not.toBeNull();
    expect(container.querySelector('.hv55-cmp-radar-series[data-branch-id="blend"]')).toHaveAttribute('data-series-marker', '◆');
    expect(context()).toBe(contextBars);
    expect(tableText()).toBe(tableBars);

    await user.click(within(blendRow()).getByRole('button', { name: 'Choisir cette branche' }));
    expect(onChoose).toHaveBeenCalledWith('blend');
    expect(within(blendRow()).getByRole('button', { name: 'Choix courant' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Radar' }), 'Choisir ne change pas la lecture.').toHaveAttribute('aria-pressed', 'true');
    expect(tableText()).toBe(tableBars);
    expect(blendResult.branches.find(branch => branch.id === 'blend')!.input).toEqual(inputBefore);
  });
});
