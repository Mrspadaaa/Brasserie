import React, { useId, useMemo, useState } from 'react';
import { brewingScenarioViewModel } from '../../domain/brewingScenarioTools';
import type { BrewingScenarioBranchResult, BrewingScenarioResult } from '../../domain/brewingScenario';
import { BranchAssumptionsDisclosure } from './BranchAssumptionsDisclosure';
import './comparison.css';
import { hopV55DoseText } from './readings';

export type HopV55ComparisonProps = {
  result: BrewingScenarioResult;
  /** Branches included in the view. The baseline is selected like any branch. */
  branchIds: string[];
  /** Active axes; every axis in the model remains available in the controls. */
  axisIds: string[];
  mode: 'bars' | 'radar';
  onModeChange: (mode: 'bars' | 'radar') => void;
  onToggleBranch: (id: string) => void;
  onToggleAxis: (id: string) => void;
  onChooseBranch?: (id: string) => void;
  selectedBranchId?: string;
};

type ScenarioView = ReturnType<typeof brewingScenarioViewModel>;
type ViewAxis = ScenarioView['axes'][number];
type ViewEstimate = NonNullable<ViewAxis['values'][number]['estimate']>;
type AxisScale = ViewAxis['scale'];

// These markers and colors match the approved candidate's comparison palette.
const SERIES = [
  { color: '#2f6b3f', marker: '●', pattern: 'solid' },
  { color: '#b8741a', marker: '▲', pattern: 'dashed' },
  { color: '#2e5b86', marker: '■', pattern: 'dotted' },
  { color: '#a83a2b', marker: '◆', pattern: 'double' },
  { color: '#6b4fa0', marker: '✚', pattern: 'dash-dot' },
  { color: '#4c4f49', marker: '✕', pattern: 'long-dash' }
] as const;
/** Hollow counterparts mark the upper bound of a range, so a bound never reads as a central value. */
const RANGE_CAPS = ['○', '△', '□', '◇', '✛', '×'] as const;

type Series = { color: string; marker: string; cap: string; pattern: string };

/** A branch keeps the identity of its place in the result, never its place in the current selection.
 * Past six branches a cycle number keeps the identity unique without capping the comparison. */
function seriesAt(index: number): Series {
  const base = SERIES[index % SERIES.length];
  const cycle = Math.floor(index / SERIES.length);
  const suffix = cycle ? String(cycle + 1) : '';
  return { color: base.color, marker: `${base.marker}${suffix}`, cap: `${RANGE_CAPS[index % RANGE_CAPS.length]}${suffix}`, pattern: base.pattern };
}

type SeriesOf = (branchId: string) => Series;

const TIMING_LABELS: Record<string, string> = {
  firstWort: 'Premier moût',
  boil: 'Ébullition',
  whirlpool: 'Whirlpool',
  fermentation: 'Fermentation active',
  postFermentation: 'Après fermentation'
};

/** Shortest round-tripping JS number, with French decimal punctuation. */
function frNumber(value: number): string {
  const raw = String(value);
  if (/[eE]/.test(raw)) return value.toLocaleString('fr-FR', { maximumSignificantDigits: 15 });
  const [integer, decimals] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

function scaleText(scale: AxisScale): string {
  return `${frNumber(scale.min)}–${frNumber(scale.max)}`;
}

function processNumber(value: number, maximumFractionDigits = 6): string {
  return new Intl.NumberFormat('fr-FR', { useGrouping: true, maximumFractionDigits }).format(value);
}

function contactDuration(timing: string | null, contactHours: number | null): string {
  if (contactHours === null) return 'durée inconnue';
  if (timing === 'boil' || contactHours < 1) return `${processNumber(contactHours * 60, 3)} min de contact`;
  return `${processNumber(contactHours)} h de contact`;
}

function rangeMeaningText(axis: ViewAxis): string {
  return axis.rangeMeaning === 'conditionalModelEnvelope' ? 'Enveloppe conditionnelle du modèle' : 'Plage du modèle';
}

function ratioFor(value: number, scale: AxisScale): number {
  const span = scale.max - scale.min;
  if (!(span > 0)) return 0;
  return Math.max(0, Math.min(1, (value - scale.min) / span));
}

function estimateFor(axis: ViewAxis, branchId: string): ViewEstimate | null {
  return axis.values.find(value => value.branchId === branchId)?.estimate ?? null;
}

function rangeText(estimate: ViewEstimate | null): string {
  const range = estimate?.range;
  return range ? `${frNumber(range.min)}–${frNumber(range.max)}` : 'Inconnu';
}

function centralText(estimate: ViewEstimate | null): string {
  return estimate?.central == null ? 'centre non fourni' : `centre ${frNumber(estimate.central)}`;
}

/** Decimals of a quick reading: about one hundredth of the axis span. */
function quickDecimals(span: number): number {
  return span > 0 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(span / 100)))) : 2;
}

function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

/** Rounded reading for the eye; `≈` marks every rounded number and the exact text stays in the table and for
 * assistive technologies. Bounds keep enough decimals to stay distinct; no central value is ever added. */
function quickEstimateText(estimate: ViewEstimate | null, scale: AxisScale): string {
  const range = estimate?.range;
  if (!range) return estimate?.central == null ? 'Inconnu' : `Inconnu · ${centralText(estimate)}`;
  let decimals = quickDecimals(scale.max - scale.min);
  while (decimals < 6 && range.min !== range.max && roundTo(range.min, decimals) === roundTo(range.max, decimals)) decimals += 1;
  const show = (value: number) => {
    const rounded = roundTo(value, decimals);
    return `${rounded !== value ? '≈ ' : ''}${frNumber(rounded)}`;
  };
  const min = roundTo(range.min, decimals), max = roundTo(range.max, decimals);
  const bounds = `${min !== range.min || max !== range.max ? '≈ ' : ''}${frNumber(min)}–${frNumber(max)}`;
  return `${bounds} · ${estimate?.central == null ? 'centre non fourni' : `centre ${show(estimate.central)}`}`;
}

/** Whole words per line for SVG axis labels: a name is wrapped, never truncated nor cut inside a word. */
function wrapLabel(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= maxChars) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

function hasPlannedAdditions(branch: BrewingScenarioBranchResult): boolean {
  return branch.program?.additions.some(addition => addition.status === 'planned') ?? false;
}

/** Values from J5 are model outputs. The baseline label must never imply a tasted beer. */
function branchPresentationLabel(result: BrewingScenarioResult, branch: BrewingScenarioBranchResult): string {
  let label: string;
  if (branch.id === 'baseline') {
    const baseline = result.requestSnapshot.baseline;
    if (baseline.kind === 'hypothetical') label = `${baseline.label} · hypothèse explicite · profil total projeté`;
    else label = branch.program ? 'Projection du profil total du programme source' : 'Projection du profil total du contexte recette source';
  } else if (branch.applicability === 'unavailable') {
    label = `${branch.label} · branche indisponible`;
  } else if (branch.applicability === 'hypotheticalOnly') {
    label = `${branch.label} · hypothèse de branche · profil total projeté`;
  } else {
    label = `${branch.label} · projection du profil total de la branche`;
  }
  return hasPlannedAdditions(branch) ? `${label} · après les ajouts prévus` : label;
}

function branchReference(view: ScenarioView, branch: BrewingScenarioBranchResult): string {
  const reference = view.axes.flatMap(axis => axis.values).find(value => value.branchId === branch.id)?.branchReference;
  return reference ?? branch.reference;
}

function materialName(branch: BrewingScenarioBranchResult, materialId: string | null): string {
  if (!materialId) return 'Matière non renseignée';
  const local = branch.dependencySnapshot.decisionMaterials.find(material => material.variety?.id === materialId || material.id === materialId);
  if (local?.name) return local.name;
  const scenario = branch.dependencySnapshot.scenarioMaterials?.hops?.find(material => material.variety?.id === materialId || material.id === materialId);
  if (scenario?.name) return scenario.name;
  return branch.dependencySnapshot.engineData.varieties.find(variety => variety.id === materialId)?.name ?? materialId;
}

function cultureName(branch: BrewingScenarioBranchResult): string {
  const culture = branch.culture;
  const knowledge = branch.dependencySnapshot.engineData.knowledge;
  const strain = (id: string | null | undefined): string | null => {
    if (!id) return null;
    const known = knowledge.find(row => row.kind === 'yeast' && row.id === id);
    return known?.kind === 'yeast' ? known.name : `Souche non chargée (${id})`;
  };

  if (culture?.state === 'unknown') return 'Culture inconnue';
  if (culture?.state === 'mixed') {
    const members = culture.members.map(member => member.name || strain(member.yeastId) || 'Souche non identifiée');
    return members.length ? `Culture mixte : ${members.join(' + ')}` : 'Culture mixte, membres non renseignés';
  }
  const member = culture?.members[0];
  return member?.name || strain(member?.yeastId ?? branch.input.yeastId) || 'Souche non renseignée';
}

function additionScopeLabel(result: BrewingScenarioResult, branch: BrewingScenarioBranchResult, additionId: string): string {
  const programStatus = branch.program?.additions.find(addition => addition.id === additionId)?.status;
  if (programStatus === 'performed' || branch.performedAdditionIds.includes(additionId)) return 'Ajout effectué';
  if (programStatus === 'planned') return 'Ajout prévu';
  if (result.requestSnapshot.baseline.kind === 'hypothetical' || branch.applicability === 'hypotheticalOnly') return 'Ajout hypothétique';
  return 'Portée de l’ajout non déterminée';
}

function additionContext(result: BrewingScenarioResult, branch: BrewingScenarioBranchResult): string[] {
  return branch.input.additions.map(addition => {
    const triplet = addition.triplet;
    // #75: one dose reading everywhere (3 decimals, then the complete value); « dose » is written once below.
    const dose = triplet.doseGL == null ? 'inconnue' : hopV55DoseText(triplet.doseGL);
    const timing = triplet.timing ? TIMING_LABELS[triplet.timing] ?? triplet.timing : 'moment inconnu';
    const conditions = [
      // A boil needs no declared temperature: only other moments report it as unknown.
      triplet.temperatureC == null ? triplet.timing === 'boil' ? null : 'température inconnue' : `${processNumber(triplet.temperatureC, 3)} °C`,
      contactDuration(triplet.timing, triplet.contactHours),
      addition.dayOffset == null ? null : `J${addition.dayOffset >= 0 ? '+' : ''}${processNumber(addition.dayOffset, 3)}`
    ].filter((value): value is string => value !== null);
    return `${additionScopeLabel(result, branch, addition.id)} · ${materialName(branch, triplet.varietyId)} · dose ${dose} · moment ${timing}${conditions.length ? ` · ${conditions.join(' · ')}` : ''}`;
  });
}

function branchInputSummary(result: BrewingScenarioResult, branch: BrewingScenarioBranchResult): string {
  const volume = branch.input.volumeL > 0 ? `${processNumber(branch.input.volumeL)} L` : 'volume inconnu';
  const additions = additionContext(result, branch);
  const volumeScope = branch.id === 'baseline' && result.requestSnapshot.baseline.kind === 'hypothetical'
    ? 'volume hypothétique' : branch.id === 'baseline' ? 'volume du contexte recette' : 'volume de la projection';
  return `${volumeScope} ${volume} · souche ${cultureName(branch)} · ${additions.length ? additions.join(' ; ') : 'aucun ajout renseigné'}`;
}

function estimateAria(result: BrewingScenarioResult, axis: ViewAxis, branch: BrewingScenarioBranchResult, estimate: ViewEstimate | null): string {
  const value = estimate?.range
    ? `plage ${rangeText(estimate)}, ${centralText(estimate)}`
    : `valeur inconnue, ${centralText(estimate)}`;
  return `${axis.name}, échelle du modèle ${scaleText(axis.scale)}. ${branchPresentationLabel(result, branch)} : ${value}.`;
}

function BranchMarker({ series }: { series: Series }) {
  return <span className="hv55-cmp-marker" aria-hidden="true" style={{ color: series.color }}>{series.marker}</span>;
}

/** One lane per branch: the lane mark identifies the series even when no central value is drawn. */
function BarRow({ result, axis, branches, seriesOf, className = 'hv55-cmp-bar-row' }: {
  result: BrewingScenarioResult;
  axis: ViewAxis;
  branches: BrewingScenarioBranchResult[];
  seriesOf: SeriesOf;
  className?: string;
}) {
  return (
    <figure className={className} data-axis={axis.id}>
      <figcaption className="hv55-cmp-axis-title">
        <strong>{axis.name}</strong>
        <small>{rangeMeaningText(axis)} · <span className="hv55-cmp-nowrap">échelle {scaleText(axis.scale)}</span></small>
      </figcaption>
      <div className="hv55-cmp-track-wrap">
        <div className="hv55-cmp-track" role="img" aria-label={branches.map(branch => estimateAria(result, axis, branch, estimateFor(axis, branch.id))).join(' ')}>
          {branches.map(branch => {
            const estimate = estimateFor(axis, branch.id);
            const range = estimate?.range;
            const series = seriesOf(branch.id);
            return (
              <div className="hv55-cmp-lane" key={branch.id} data-branch-id={branch.id} data-series-marker={series.marker} aria-hidden="true">
                <span className="hv55-cmp-lane-mark" style={{ color: series.color }}>{series.marker}</span>
                <span className="hv55-cmp-lane-track">
                  {[25, 50, 75].map(tick => <span className="hv55-cmp-gridline" style={{ left: `${tick}%` }} key={tick} />)}
                  {range ? <span
                    className={`hv55-cmp-interval hv55-cmp-pattern-${series.pattern}`}
                    style={{
                      left: `${ratioFor(range.min, axis.scale) * 100}%`,
                      width: `${Math.max(0.6, (ratioFor(range.max, axis.scale) - ratioFor(range.min, axis.scale)) * 100)}%`,
                      '--hv55-cmp-series': series.color
                    } as React.CSSProperties}
                    title={`${branchPresentationLabel(result, branch)} · plage ${rangeText(estimate)}`}
                  /> : <span className="hv55-cmp-unknown" title={`${branchPresentationLabel(result, branch)} · inconnu`} />}
                  {estimate?.central != null && (
                    <span
                      className="hv55-cmp-central"
                      style={{ left: `${ratioFor(estimate.central, axis.scale) * 100}%`, color: series.color }}
                      title={`${branchPresentationLabel(result, branch)} · centrale ${frNumber(estimate.central)}`}
                    >{series.marker}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="hv55-cmp-track-scale" aria-hidden="true">
          <span>{frNumber(axis.scale.min)}</span><span>{frNumber(axis.scale.max)}</span>
        </div>
      </div>
      <div className="hv55-cmp-bar-values" aria-label={`Valeurs de ${axis.name}`}>
        {branches.map(branch => {
          const estimate = estimateFor(axis, branch.id);
          const series = seriesOf(branch.id);
          return (
            <span className="hv55-cmp-value" key={branch.id} data-branch-id={branch.id} data-series-marker={series.marker}>
              <BranchMarker series={series} />
              <span className="hv55-cmp-value-quick" aria-hidden="true" title={`${rangeText(estimate)} · ${centralText(estimate)}`}>{quickEstimateText(estimate, axis.scale)}</span>
              <span className="hv55-cmp-sr-only">{branchPresentationLabel(result, branch)} : {rangeText(estimate)} · {centralText(estimate)}</span>
            </span>
          );
        })}
      </div>
    </figure>
  );
}

const QUICK_READING_NOTE = '≈ : lecture arrondie au centième de l’échelle. Les valeurs exactes, centrales, statuts et sources restent dans le tableau ci-dessous.';

function BarChart({ result, axes, branches, seriesOf }: { result: BrewingScenarioResult; axes: ViewAxis[]; branches: BrewingScenarioBranchResult[]; seriesOf: SeriesOf }) {
  return (
    <div className="hv55-cmp-bars" role="group" aria-label="Comparaison par barres de plage">
      {axes.map(axis => <BarRow key={axis.id} result={result} axis={axis} branches={branches} seriesOf={seriesOf} />)}
      <p className="hv55-cmp-quick-note">{QUICK_READING_NOTE}</p>
    </div>
  );
}

const RADAR = { size: 440, center: 220, radius: 120, labelRadius: 136, laneGap: 6, tick: 3.5, labelChars: 11, lineHeight: 17 } as const;
/** A closed profile shape needs three spokes: one spoke draws a point and two spokes a line. */
const PROFILE_MIN_AXES = 3;
type Point = { x: number; y: number };

/** Names the scale of every spoke, so each radius reads back to its exact value; equal bounds are not merged. */
function radarScaleText(axes: ViewAxis[]): string {
  const counts = new Map<string, number>();
  for (const axis of axes) counts.set(scaleText(axis.scale), (counts.get(scaleText(axis.scale)) ?? 0) + 1);
  const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const others = axes.filter(axis => scaleText(axis.scale) !== common);
  return others.length
    ? `${common}, sauf ${others.map(axis => `${axis.name} ${scaleText(axis.scale)}`).join(' ; ')}`
    : `${common} pour chaque axe`;
}

function axisAngle(index: number, count: number): number {
  return -Math.PI / 2 + index * Math.PI * 2 / count;
}

/** Each series runs on its own lane, offset across the axis; the distance along the axis still carries the value. */
function laneOffset(lane: number, lanes: number): number {
  return (lane - (lanes - 1) / 2) * RADAR.laneGap;
}

function radarPoint(index: number, count: number, value: number, scale: AxisScale, offset = 0): Point {
  const angle = axisAngle(index, count);
  const radius = RADAR.radius * ratioFor(value, scale);
  return {
    x: RADAR.center + Math.cos(angle) * radius - Math.sin(angle) * offset,
    y: RADAR.center + Math.sin(angle) * radius + Math.cos(angle) * offset
  };
}

/** Exact values of one axis, read with the same lanes as the bars; no hover is needed on a touch screen. */
function RadarAxisReader({ result, axes, branches, seriesOf }: { result: BrewingScenarioResult; axes: ViewAxis[]; branches: BrewingScenarioBranchResult[]; seriesOf: SeriesOf }) {
  const [axisId, setAxisId] = useState<string | null>(null);
  const axis = axes.find(row => row.id === axisId) ?? axes[0];
  if (!axis) return null;
  return (
    <div className="hv55-cmp-radar-reader">
      <div className="hv55-cmp-radar-reader-axes" role="group" aria-label="Lire les valeurs exactes d’un axe du radar">
        {axes.map(row => (
          <button type="button" key={row.id} aria-pressed={row.id === axis.id} onClick={() => setAxisId(row.id)}>{row.name}</button>
        ))}
      </div>
      <BarRow result={result} axis={axis} branches={branches} seriesOf={seriesOf} className="hv55-cmp-bar-row hv55-cmp-reader-row" />
      <p className="hv55-cmp-quick-note">{QUICK_READING_NOTE}</p>
    </div>
  );
}

/** Unknown axes per branch, named once; an unknown never becomes a zero or a closing point. */
function AxisGaps({ result, axes, branches, seriesOf }: { result: BrewingScenarioResult; axes: ViewAxis[]; branches: BrewingScenarioBranchResult[]; seriesOf: SeriesOf }) {
  return (
    <ul className="hv55-cmp-radar-gaps" aria-label="Axes sans valeur dans les branches comparées">
      {branches.flatMap(branch => {
        const missing = axes.filter(axis => {
          const estimate = estimateFor(axis, branch.id);
          return estimate?.range == null && estimate?.central == null;
        });
        const series = seriesOf(branch.id);
        return missing.length ? [<li key={branch.id} data-branch-id={branch.id} data-series-marker={series.marker}><BranchMarker series={series} /> {branchPresentationLabel(result, branch)} : inconnues — {missing.map(axis => axis.name).join(', ')}</li>] : [];
      })}
    </ul>
  );
}

/** Radar mode with fewer than three axes: no lone spoke or two-spoke line is presented as a profile. The same lanes,
 * values and unknowns stay readable, and the mode chosen by the brewer is kept. */
function AxisReading({ result, axes, availableAxes, branches, seriesOf }: {
  result: BrewingScenarioResult;
  axes: ViewAxis[];
  availableAxes: number;
  branches: BrewingScenarioBranchResult[];
  seriesOf: SeriesOf;
}) {
  const chosen = axes.length === 1 ? 'un seul axe est choisi' : `${axes.length} axes sont choisis`;
  const next = availableAxes >= PROFILE_MIN_AXES
    ? 'Coche au moins trois axes dans « Axes du profil » pour lire la forme du profil.'
    : availableAxes === 1 ? 'Ce résultat ne contient qu’un axe.' : `Ce résultat ne contient que ${availableAxes} axes.`;
  return (
    <div className="hv55-cmp-axis-reading" data-profile-status="insufficient-axes">
      <p className="hv55-cmp-radar-unavailable" role="note">
        <strong>Radar non tracé.</strong> Une forme de profil exige au moins trois axes ; {chosen}. {next} Les mêmes valeurs se lisent par axe ci-dessous.
      </p>
      <BarChart result={result} axes={axes} branches={branches} seriesOf={seriesOf} />
      <AxisGaps result={result} axes={axes} branches={branches} seriesOf={seriesOf} />
    </div>
  );
}

function RadarChart({ result, axes, branches, seriesOf, titleId, descriptionId }: {
  result: BrewingScenarioResult;
  axes: ViewAxis[];
  branches: BrewingScenarioBranchResult[];
  seriesOf: SeriesOf;
  titleId: string;
  descriptionId: string;
}) {
  const count = axes.length;
  if (!count) return null;
  return (
    <div className="hv55-cmp-radar-wrap">
      <svg className="hv55-cmp-radar" viewBox={`0 0 ${RADAR.size} ${RADAR.size}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Radar des profils comparés</title>
        <desc id={descriptionId}>Portée des séries : {branches.map(branch => branchPresentationLabel(result, branch)).join(' ; ')}. Chaque profil total est une projection du modèle, jamais une dégustation mesurée. Les axes suivent leurs échelles respectives ; chaque série suit son propre couloir le long de l’axe, dans l’ordre de la légende. Les plages restent sur leur axe, les axes inconnus interrompent le tracé et seules les centrales déclarées ont un symbole plein.</desc>
        {[0.25, 0.5, 0.75, 1].map(fraction => (
          <circle key={fraction} cx={RADAR.center} cy={RADAR.center} r={RADAR.radius * fraction} className="hv55-cmp-radar-ring" />
        ))}
        {axes.map((axis, index) => {
          const angle = axisAngle(index, count);
          const end = { x: RADAR.center + Math.cos(angle) * RADAR.radius, y: RADAR.center + Math.sin(angle) * RADAR.radius };
          const label = { x: RADAR.center + Math.cos(angle) * RADAR.labelRadius, y: RADAR.center + Math.sin(angle) * RADAR.labelRadius };
          const anchor = Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle';
          const lines = wrapLabel(axis.name, RADAR.labelChars);
          const sin = Math.sin(angle);
          const firstY = sin < -0.35 ? label.y - (lines.length - 1) * RADAR.lineHeight
            : sin > 0.35 ? label.y + 12 : label.y + 5 - ((lines.length - 1) * RADAR.lineHeight) / 2;
          return (
            <g key={axis.id}>
              <line x1={RADAR.center} y1={RADAR.center} x2={end.x} y2={end.y} className="hv55-cmp-radar-axis" />
              <text x={label.x} y={firstY} textAnchor={anchor} className="hv55-cmp-radar-label">
                <title>{`${axis.name} · échelle ${scaleText(axis.scale)}`}</title>
                {lines.map((line, lineIndex) => <tspan key={lineIndex} x={label.x} dy={lineIndex === 0 ? 0 : RADAR.lineHeight}>{lineIndex < lines.length - 1 ? `${line} ` : line}</tspan>)}
              </text>
            </g>
          );
        })}
        {branches.map((branch, lane) => {
          const series = seriesOf(branch.id);
          const offset = laneOffset(lane, branches.length);
          const estimates = axes.map(axis => estimateFor(axis, branch.id));
          const centralPoints = estimates.map((estimate, index) => estimate?.central == null
            ? null
            : radarPoint(index, count, estimate.central, axes[index].scale, offset));
          const centralSegments = axes.map((_axis, index) => {
            const nextIndex = index + 1 < count ? index + 1 : count > 2 ? 0 : null;
            if (nextIndex === null) return null;
            const first = centralPoints[index];
            const next = centralPoints[nextIndex];
            return first && next ? { first, next, index } : null;
          }).filter((segment): segment is { first: Point; next: Point; index: number } => segment !== null);
          return (
            <g key={branch.id} data-branch-id={branch.id} data-series-marker={series.marker} className={`hv55-cmp-radar-series hv55-cmp-pattern-${series.pattern}`} style={{ '--hv55-cmp-series': series.color } as React.CSSProperties}>
              {axes.map((axis, index) => {
                const range = estimates[index]?.range;
                if (!range) return null;
                const angle = axisAngle(index, count);
                const across = { x: -Math.sin(angle) * RADAR.tick, y: Math.cos(angle) * RADAR.tick };
                const start = radarPoint(index, count, range.min, axis.scale, offset);
                const end = radarPoint(index, count, range.max, axis.scale, offset);
                return <g key={`extent-${axis.id}`} data-axis={axis.id}>
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="hv55-cmp-radar-extent">
                    <title>{`${branchPresentationLabel(result, branch)} · ${axis.name} · plage ${rangeText(estimates[index])} · ${centralText(estimates[index])}`}</title>
                  </line>
                  {range.max !== range.min && <line x1={start.x - across.x} y1={start.y - across.y} x2={start.x + across.x} y2={start.y + across.y} className="hv55-cmp-radar-range-end" />}
                  <text x={end.x} y={end.y + 3} textAnchor="middle" className="hv55-cmp-radar-range-cap" aria-hidden="true">{series.cap}</text>
                </g>;
              })}
              {centralSegments.map(segment => <line key={`central-${segment.index}`} x1={segment.first.x} y1={segment.first.y} x2={segment.next.x} y2={segment.next.y} className="hv55-cmp-radar-central-line" />)}
              {centralPoints.map((point, index) => point && <text key={`point-${axes[index].id}`} data-axis={axes[index].id} x={point.x} y={point.y + 4} textAnchor="middle" className="hv55-cmp-radar-central-point"><title>{`${branchPresentationLabel(result, branch)} · ${axes[index].name} · centrale ${frNumber(estimates[index]!.central!)}`}</title>{series.marker}</text>)}
            </g>
          );
        })}
      </svg>
      <AxisGaps result={result} axes={axes} branches={branches} seriesOf={seriesOf} />
      <p className="hv55-cmp-radar-note">Le rayon suit la position relative à l’échelle propre de chaque axe ({radarScaleText(axes)}) ; des bornes égales ne font pas une calibration commune. Le contour relie seulement les centrales déclarées : ni somme, ni score, ni ressemblance. Symbole plein : centrale déclarée ; symbole creux : borne haute de la plage ; petit trait : borne basse. Les séries sont décalées de part et d’autre de l’axe pour rester distinctes. Les valeurs exactes et leurs sources sont accessibles dans le tableau ci-dessous.</p>
      <RadarAxisReader result={result} axes={axes} branches={branches} seriesOf={seriesOf} />
    </div>
  );
}

function ExactValues({ result, view, axes, branches, seriesOf }: { result: BrewingScenarioResult; view: ScenarioView; axes: ViewAxis[]; branches: BrewingScenarioBranchResult[]; seriesOf: SeriesOf }) {
  const id = useId();
  return (
    <details className="hv55-cmp-exact">
      <summary>Valeurs exactes, statut et sources · {axes.length} axes</summary>
      <div className="hv55-cmp-table-region" role="region" aria-label="Tableau des valeurs exactes" tabIndex={0} aria-describedby={`${id}-hint`}>
        <p className="hv55-cmp-sr-only" id={`${id}-hint`}>Fais défiler horizontalement pour lire toutes les branches.</p>
        <table>
          <caption>Les nombres reprennent les estimations et enveloppes du modèle. Une centrale absente est indiquée comme non fournie, jamais remplacée par le milieu de la plage.</caption>
          <thead><tr><th scope="col">Axe · échelle du modèle</th>{branches.map(branch => <th scope="col" key={branch.id} data-branch-id={branch.id} data-series-marker={seriesOf(branch.id).marker}><BranchMarker series={seriesOf(branch.id)} /> {branchPresentationLabel(result, branch)}</th>)}</tr></thead>
          <tbody>
            {axes.map(axis => (
              <tr key={axis.id}>
                <th scope="row">{axis.name}<small>{rangeMeaningText(axis)} · échelle {scaleText(axis.scale)}</small></th>
                {branches.map(branch => {
                  const estimate = estimateFor(axis, branch.id);
                  const sources = estimate?.sources ?? [];
                  const reasons = estimate?.reasons ?? [];
                  return (
                    <td key={branch.id} data-branch-id={branch.id}>
                      <strong>{rangeText(estimate)}</strong>
                      <span>{centralText(estimate)}</span>
                      <span>{estimate?.range ? `Confiance déclarée : ${estimate.confidence}` : 'Statut : inconnu'}</span>
                      <details className="hv55-cmp-source-details">
                        <summary>{sources.length} source{sources.length === 1 ? '' : 's'} · {reasons.length} motif{reasons.length === 1 ? '' : 's'}</summary>
                        <p>Portée : {branchPresentationLabel(result, branch)}</p>
                        <p>Référence de branche : <code>{branchReference(view, branch)}</code></p>
                        {reasons.length > 0 && <ul>{reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}</ul>}
                        {sources.length > 0 ? <ul>{sources.map((source, index) => (
                          <li key={`${source.reference}-${index}`}>
                            {[source.author, source.title, source.year].filter(Boolean).join(' · ')}
                            {source.locator ? ` · ${source.locator}` : ''} · <code>{source.reference}</code>
                          </li>
                        ))}</ul> : <p>Aucune source associée à cette estimation.</p>}
                      </details>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hv55-cmp-reference">Référence du résultat : <code>{view.resultReference}</code></p>
    </details>
  );
}

export function HopV55Comparison({
  result,
  branchIds,
  axisIds,
  mode,
  onModeChange,
  onToggleBranch,
  onToggleAxis,
  onChooseBranch,
  selectedBranchId
}: HopV55ComparisonProps) {
  const view = useMemo(() => brewingScenarioViewModel(result), [result]);
  const titleId = useId();
  const descriptionId = useId();
  const allBranches = useMemo(() => [result.baseline, ...result.branches], [result]);
  // Identity comes from the result order, so deselecting or re-toggling a branch never repaints another one.
  const seriesById = useMemo(() => new Map(allBranches.map((branch, index) => [branch.id, seriesAt(index)])), [allBranches]);
  const seriesOf = (branchId: string) => seriesById.get(branchId) ?? seriesAt(0);
  // Lanes, legend and columns follow the result order, independently of the order in which branches were toggled.
  const selectedBranches = allBranches.filter(branch => branchIds.includes(branch.id));
  const activeAxes = view.axes.filter(axis => axisIds.includes(axis.id));

  return (
    <section className="hv55-comparison" aria-labelledby={titleId}>
      <header className="hv55-cmp-header">
        <div><h2 id={titleId}>Comparer les profils</h2><p>Un même scénario, deux lectures du même modèle.</p></div>
        <div className="hv55-cmp-mode" role="group" aria-label="Rendu de la comparaison">
          <button type="button" aria-pressed={mode === 'bars'} onClick={() => onModeChange('bars')}>Barres</button>
          <button type="button" aria-pressed={mode === 'radar'} onClick={() => onModeChange('radar')}>Radar</button>
        </div>
      </header>

      <p className="hv55-cmp-qualification">
        {view.axes.length > 0 && view.axes.every(axis => axis.rangeMeaning === 'conditionalModelEnvelope')
          ? `Plages : enveloppes conditionnelles du modèle${view.axes.every(axis => axis.statisticalCoverage === null) ? ', sans couverture statistique déclarée' : ''}. `
          : 'Les plages et leur portée suivent les informations du modèle. '}
        Les axes utilisent chacun leur échelle de modèle ; les doses en g/L, les IBU et les quantités biologiques gardent leurs unités propres hors de ces graphiques.
      </p>

      <fieldset className="hv55-cmp-selection">
        <legend>Branches disponibles</legend>
        <div className="hv55-cmp-branch-list">
          {allBranches.map(branch => (
            <div className="hv55-cmp-branch" key={branch.id} data-branch-id={branch.id} data-series-marker={seriesOf(branch.id).marker}>
              <label className="hv55-cmp-toggle">
                <input type="checkbox" checked={branchIds.includes(branch.id)} onChange={() => onToggleBranch(branch.id)} />
                <BranchMarker series={seriesOf(branch.id)} />
                <span>Comparer {branchPresentationLabel(result, branch)}</span>
              </label>
              {onChooseBranch && (
                <button
                  className="hv55-cmp-choose"
                  type="button"
                  aria-pressed={selectedBranchId === branch.id}
                  onClick={() => onChooseBranch(branch.id)}
                >{selectedBranchId === branch.id ? 'Choix courant' : 'Choisir cette branche'}</button>
              )}
              <p className="hv55-cmp-context">{branchInputSummary(result, branch)}</p>
              {branchIds.includes(branch.id) && <BranchAssumptionsDisclosure branch={branch} label={branchPresentationLabel(result, branch)} />}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="hv55-cmp-selection hv55-cmp-axis-selection">
        <legend>Axes du profil</legend>
        <div className="hv55-cmp-axis-list">
          {view.axes.map(axis => (
            <label className="hv55-cmp-toggle" key={axis.id}>
              <input type="checkbox" checked={axisIds.includes(axis.id)} onChange={() => onToggleAxis(axis.id)} />
              <span>{axis.name}</span>
              <small>{scaleText(axis.scale)}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="hv55-cmp-legend" aria-label="Légende des branches affichées">
        {selectedBranches.map(branch => {
          const series = seriesOf(branch.id);
          return <span className="hv55-cmp-legend-item" key={branch.id} data-branch-id={branch.id} data-series-marker={series.marker}>
            <BranchMarker series={series} />
            <span className={`hv55-cmp-legend-swatch hv55-cmp-pattern-${series.pattern}`} aria-hidden="true" style={{ '--hv55-cmp-series': series.color } as React.CSSProperties} />
            {branchPresentationLabel(result, branch)}
          </span>;
        })}
      </div>

      {selectedBranches.length === 0 ? (
        <p className="hv55-cmp-empty">Sélectionne au moins une branche pour afficher son profil.</p>
      ) : activeAxes.length === 0 ? (
        <p className="hv55-cmp-empty">Sélectionne un axe pour lire les profils.</p>
      ) : mode === 'bars' ? (
        <BarChart result={result} axes={activeAxes} branches={selectedBranches} seriesOf={seriesOf} />
      ) : activeAxes.length < PROFILE_MIN_AXES ? (
        <AxisReading result={result} axes={activeAxes} availableAxes={view.axes.length} branches={selectedBranches} seriesOf={seriesOf} />
      ) : (
        <RadarChart result={result} axes={activeAxes} branches={selectedBranches} seriesOf={seriesOf} titleId={descriptionId} descriptionId={`${descriptionId}-text`} />
      )}

      <ExactValues result={result} view={view} axes={activeAxes} branches={selectedBranches} seriesOf={seriesOf} />
    </section>
  );
}
