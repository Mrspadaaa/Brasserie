import React, { useId, useMemo } from 'react';
import { brewingScenarioViewModel } from '../../domain/brewingScenarioTools';
import type { BrewingScenarioBranchResult, BrewingScenarioResult } from '../../domain/brewingScenario';
import './comparison.css';

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
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
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
    const dose = triplet.doseGL == null ? 'dose inconnue' : `${processNumber(triplet.doseGL)} g/L`;
    const timing = triplet.timing ? TIMING_LABELS[triplet.timing] ?? triplet.timing : 'moment inconnu';
    const conditions = [
      triplet.temperatureC == null ? 'température inconnue' : `${processNumber(triplet.temperatureC, 3)} °C`,
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

function BranchMarker({ index }: { index: number }) {
  const series = SERIES[index % SERIES.length];
  return <span className="hv55-cmp-marker" aria-hidden="true" style={{ color: series.color }}>{series.marker}</span>;
}

function BarChart({ result, axes, branches }: { result: BrewingScenarioResult; axes: ViewAxis[]; branches: BrewingScenarioBranchResult[] }) {
  return (
    <div className="hv55-cmp-bars" role="group" aria-label="Comparaison par barres de plage">
      {axes.map((axis, axisIndex) => (
        <figure className="hv55-cmp-bar-row" key={axis.id} data-axis={axis.id}>
          <figcaption className="hv55-cmp-axis-title">
            <strong>{axis.name}</strong>
            <small>{rangeMeaningText(axis)} · échelle {scaleText(axis.scale)}</small>
          </figcaption>
          <div className="hv55-cmp-track-wrap">
            <div className="hv55-cmp-track" role="img" aria-label={branches.map(branch => estimateAria(result, axis, branch, estimateFor(axis, branch.id))).join(' ')} style={{ minHeight: Math.max(20, 10 + branches.length * 10) }}>
              {[25, 50, 75].map(tick => <span className="hv55-cmp-gridline" style={{ left: `${tick}%` }} key={tick} aria-hidden="true" />)}
              {branches.map((branch, branchIndex) => {
                const estimate = estimateFor(axis, branch.id);
                const range = estimate?.range;
                const series = SERIES[branchIndex % SERIES.length];
                const top = 5 + branchIndex * 10;
                return (
                  <React.Fragment key={branch.id}>
                    {range ? <span
                      className={`hv55-cmp-interval hv55-cmp-pattern-${series.pattern}`}
                      style={{
                        left: `${ratioFor(range.min, axis.scale) * 100}%`,
                        width: `${Math.max(0.6, (ratioFor(range.max, axis.scale) - ratioFor(range.min, axis.scale)) * 100)}%`,
                        top,
                        '--hv55-cmp-series': series.color
                      } as React.CSSProperties}
                      title={`${branchPresentationLabel(result, branch)} · plage ${rangeText(estimate)}`}
                      aria-hidden="true"
                    /> : <span className="hv55-cmp-unknown" style={{ top }} aria-hidden="true" />}
                    {estimate?.central != null && (
                      <span
                        className="hv55-cmp-central"
                        style={{ left: `${ratioFor(estimate.central, axis.scale) * 100}%`, top: top - 4, color: series.color }}
                        title={`${branchPresentationLabel(result, branch)} · centrale ${frNumber(estimate.central)}`}
                        aria-hidden="true"
                      >{series.marker}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="hv55-cmp-track-scale" aria-hidden="true">
              <span>{frNumber(axis.scale.min)}</span><span>{frNumber(axis.scale.max)}</span>
            </div>
          </div>
          <div className="hv55-cmp-bar-values" aria-label={`Valeurs de ${axis.name}`}>
            {branches.map((branch, branchIndex) => {
              const estimate = estimateFor(axis, branch.id);
              return (
                <span className="hv55-cmp-value" key={branch.id}>
                  <BranchMarker index={branchIndex} />
                  <span>{branchPresentationLabel(result, branch)} : {rangeText(estimate)} · {centralText(estimate)}</span>
                </span>
              );
            })}
          </div>
        </figure>
      ))}
    </div>
  );
}

const RADAR = { size: 440, center: 220, radius: 145, labelRadius: 194 } as const;
type Point = { x: number; y: number };

function radarPoint(index: number, count: number, value: number, scale: AxisScale): Point {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
  const radius = RADAR.radius * ratioFor(value, scale);
  return { x: RADAR.center + Math.cos(angle) * radius, y: RADAR.center + Math.sin(angle) * radius };
}

function polygonPoints(points: Point[]): string {
  return points.map(point => `${point.x},${point.y}`).join(' ');
}

function RadarChart({ result, axes, branches, titleId, descriptionId }: {
  result: BrewingScenarioResult;
  axes: ViewAxis[];
  branches: BrewingScenarioBranchResult[];
  titleId: string;
  descriptionId: string;
}) {
  const count = axes.length;
  if (!count) return null;
  return (
    <div className="hv55-cmp-radar-wrap">
      <svg className="hv55-cmp-radar" viewBox={`0 0 ${RADAR.size} ${RADAR.size}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Radar des profils comparés</title>
        <desc id={descriptionId}>Portée des séries : {branches.map(branch => branchPresentationLabel(result, branch)).join(' ; ')}. Chaque profil total est une projection du modèle, jamais une dégustation mesurée. Les axes suivent leurs échelles respectives, les axes inconnus interrompent le tracé et seules les centrales déclarées ont un point.</desc>
        {[0.25, 0.5, 0.75, 1].map(fraction => (
          <circle key={fraction} cx={RADAR.center} cy={RADAR.center} r={RADAR.radius * fraction} className="hv55-cmp-radar-ring" />
        ))}
        {axes.map((axis, index) => {
          const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
          const end = { x: RADAR.center + Math.cos(angle) * RADAR.radius, y: RADAR.center + Math.sin(angle) * RADAR.radius };
          const label = { x: RADAR.center + Math.cos(angle) * RADAR.labelRadius, y: RADAR.center + Math.sin(angle) * RADAR.labelRadius };
          const anchor = Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle';
          const abbreviated = axis.name.length > 15 ? `${axis.name.slice(0, 14)}…` : axis.name;
          return (
            <g key={axis.id}>
              <line x1={RADAR.center} y1={RADAR.center} x2={end.x} y2={end.y} className="hv55-cmp-radar-axis" />
              <text x={label.x} y={label.y + 4} textAnchor={anchor} className="hv55-cmp-radar-label">
                <title>{`${axis.name} · échelle ${scaleText(axis.scale)}`}</title>{abbreviated}
              </text>
            </g>
          );
        })}
        {branches.map((branch, branchIndex) => {
          const series = SERIES[branchIndex % SERIES.length];
          const estimates = axes.map(axis => estimateFor(axis, branch.id));
          const rangeBands = axes.length > 1 ? axes.map((axis, index) => {
            const nextIndex = (index + 1) % count;
            const first = estimates[index]?.range;
            const next = estimates[nextIndex]?.range;
            if (!first || !next) return null;
            return polygonPoints([
              radarPoint(index, count, first.max, axis.scale),
              radarPoint(nextIndex, count, next.max, axes[nextIndex].scale),
              radarPoint(nextIndex, count, next.min, axes[nextIndex].scale),
              radarPoint(index, count, first.min, axis.scale)
            ]);
          }).filter((points): points is string => points !== null) : [];
          const centralPoints = estimates.map((estimate, index) => estimate?.central == null
            ? null
            : radarPoint(index, count, estimate.central, axes[index].scale));
          const centralSegments = axes.map((_axis, index) => {
            const nextIndex = (index + 1) % count;
            const first = centralPoints[index];
            const next = centralPoints[nextIndex];
            return first && next ? { first, next, index } : null;
          }).filter((segment): segment is { first: Point; next: Point; index: number } => segment !== null);
          return (
            <g key={branch.id} data-branch-id={branch.id} className={`hv55-cmp-radar-series hv55-cmp-pattern-${series.pattern}`} style={{ '--hv55-cmp-series': series.color } as React.CSSProperties}>
              {rangeBands.map((points, index) => <polygon key={`range-${index}`} points={points} className="hv55-cmp-radar-range" />)}
              {axes.map((axis, index) => {
                const range = estimates[index]?.range;
                if (!range) return null;
                const start = radarPoint(index, count, range.min, axis.scale);
                const end = radarPoint(index, count, range.max, axis.scale);
                return <g key={`extent-${axis.id}`}>
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="hv55-cmp-radar-extent" />
                  <circle cx={start.x} cy={start.y} r="2.3" className="hv55-cmp-radar-range-end" />
                  {range.max !== range.min && <circle cx={end.x} cy={end.y} r="2.3" className="hv55-cmp-radar-range-end" />}
                </g>;
              })}
              {centralSegments.map(segment => <line key={`central-${segment.index}`} x1={segment.first.x} y1={segment.first.y} x2={segment.next.x} y2={segment.next.y} className="hv55-cmp-radar-central-line" />)}
              {centralPoints.map((point, index) => point && <circle key={`point-${axes[index].id}`} cx={point.x} cy={point.y} r="3.5" className="hv55-cmp-radar-central-point"><title>{`${branchPresentationLabel(result, branch)} · ${axes[index].name} · centrale ${frNumber(estimates[index]!.central!)}`}</title></circle>)}
            </g>
          );
        })}
      </svg>
      <ul className="hv55-cmp-radar-gaps" aria-label="Axes sans valeur dans les branches comparées">
        {branches.flatMap((branch, branchIndex) => {
          const missing = axes.filter(axis => {
            const estimate = estimateFor(axis, branch.id);
            return estimate?.range == null && estimate?.central == null;
          });
          return missing.length ? [<li key={branch.id}><BranchMarker index={branchIndex} /> {branchPresentationLabel(result, branch)} : inconnues — {missing.map(axis => axis.name).join(', ')}</li>] : [];
        })}
      </ul>
      <p className="hv55-cmp-radar-note">Le rayon suit la position relative à l’échelle propre de chaque axe. Les valeurs exactes et leurs sources sont accessibles dans le tableau ci-dessous.</p>
    </div>
  );
}

function ExactValues({ result, view, axes, branches }: { result: BrewingScenarioResult; view: ScenarioView; axes: ViewAxis[]; branches: BrewingScenarioBranchResult[] }) {
  const id = useId();
  return (
    <details className="hv55-cmp-exact">
      <summary>Valeurs exactes, statut et sources · {axes.length} axes</summary>
      <div className="hv55-cmp-table-region" role="region" aria-label="Tableau des valeurs exactes" tabIndex={0} aria-describedby={`${id}-hint`}>
        <p className="hv55-cmp-sr-only" id={`${id}-hint`}>Fais défiler horizontalement pour lire toutes les branches.</p>
        <table>
          <caption>Les nombres reprennent les estimations et enveloppes du modèle. Une centrale absente est indiquée comme non fournie, jamais remplacée par le milieu de la plage.</caption>
          <thead><tr><th scope="col">Axe · échelle du modèle</th>{branches.map((branch, index) => <th scope="col" key={branch.id}><BranchMarker index={index} /> {branchPresentationLabel(result, branch)}</th>)}</tr></thead>
          <tbody>
            {axes.map(axis => (
              <tr key={axis.id}>
                <th scope="row">{axis.name}<small>{rangeMeaningText(axis)} · échelle {scaleText(axis.scale)}</small></th>
                {branches.map((branch, branchIndex) => {
                  const estimate = estimateFor(axis, branch.id);
                  const sources = estimate?.sources ?? [];
                  const reasons = estimate?.reasons ?? [];
                  return (
                    <td key={branch.id}>
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
  const branchesById = useMemo(() => new Map(allBranches.map(branch => [branch.id, branch])), [allBranches]);
  const selectedBranches = branchIds.map(id => branchesById.get(id)).filter((branch): branch is BrewingScenarioBranchResult => !!branch);
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
          {allBranches.map((branch, index) => (
            <div className="hv55-cmp-branch" key={branch.id}>
              <label className="hv55-cmp-toggle">
                <input type="checkbox" checked={branchIds.includes(branch.id)} onChange={() => onToggleBranch(branch.id)} />
                <BranchMarker index={index} />
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
          const index = allBranches.findIndex(candidate => candidate.id === branch.id);
          return <span className="hv55-cmp-legend-item" key={branch.id}><BranchMarker index={index} />{branchPresentationLabel(result, branch)}</span>;
        })}
      </div>

      {selectedBranches.length === 0 ? (
        <p className="hv55-cmp-empty">Sélectionne au moins une branche pour afficher son profil.</p>
      ) : activeAxes.length === 0 ? (
        <p className="hv55-cmp-empty">Sélectionne un axe pour lire les profils.</p>
      ) : mode === 'bars' ? (
        <BarChart result={result} axes={activeAxes} branches={selectedBranches} />
      ) : (
        <RadarChart result={result} axes={activeAxes} branches={selectedBranches} titleId={descriptionId} descriptionId={`${descriptionId}-text`} />
      )}

      <ExactValues result={result} view={view} axes={activeAxes} branches={selectedBranches} />
    </section>
  );
}
