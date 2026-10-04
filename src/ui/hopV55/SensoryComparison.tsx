import React, { useId, useMemo } from 'react';
import { assertBrewingScenarioResult } from '../../domain/brewingScenario';
import {
  assertBrewingSensoryComparison,
  type BrewingSensoryComparisonDTO,
  type BrewingSensoryComparisonDimension,
  type BrewingSensoryComparisonValue,
  type BrewingSensoryNumericStatus,
  type BrewingSensoryValueProvenance
} from '../../domain/brewingSensory';
import type { HopRange, HopSource } from '../../../functions/src/hopIndexSchema';
import type { BrewingScenarioBranchResult, BrewingScenarioResult } from '../../domain/brewingScenario';
import './sensory-comparison.css';

export type HopV55SensoryComparisonProps = {
  comparison: BrewingSensoryComparisonDTO;
  /** Exact J5 result for source/program scope labels; ignored if its reference differs from the comparison context. */
  result?: BrewingScenarioResult;
  candidateIds: string[];
  /** Exact comparison group keys: `dimension.referenceGroupId`. */
  dimensionIds: string[];
  mode: 'bars' | 'radar';
  onModeChange: (mode: 'bars' | 'radar') => void;
  onToggleCandidate: (id: string) => void;
  onToggleDimension: (referenceGroupId: string) => void;
  onChooseCandidate?: (id: string) => void;
  selectableCandidateIds?: string[];
  selectedCandidateId?: string;
};

type SensoryDimension = BrewingSensoryComparisonDimension;
type NumericValue = Extract<BrewingSensoryComparisonValue, { status: BrewingSensoryNumericStatus }>;
type NumericReading =
  | { kind: 'point'; status: BrewingSensoryNumericStatus; value: number }
  | { kind: 'range'; status: BrewingSensoryNumericStatus; range: HopRange; central?: number };
type Definition = SensoryDimension['definition'];

const CANDIDATE_SERIES = [
  { color: '#2f6b3f', marker: '●' },
  { color: '#b8741a', marker: '▲' },
  { color: '#2e5b86', marker: '■' },
  { color: '#a83a2b', marker: '◆' },
  { color: '#6b4fa0', marker: '✚' },
  { color: '#4c4f49', marker: '✕' }
] as const;

const VALUE_STATUS: Record<BrewingSensoryNumericStatus, string> = {
  observed: 'Observé', hypothetical: 'Projection hypothétique', target: 'Cible'
};
const METRIC_KIND_LABEL: Record<NonNullable<Definition['metric']>['kind'], string> = {
  ordinalNote: 'Note ordinale', modelIndex: 'Indice de modèle', measurement: 'Mesure'
};
const REFERENCE_KIND_LABEL: Record<string, string> = {
  adoptedReference: 'référence adoptée', hypothetical: 'hypothèse', observed: 'observation', actual: 'réalité déclarée',
  observationAnchor: 'ancre d’observation', anchoredScenario: 'question ancrée', j5Snapshot: 'prévision J5',
};
const COMPARISON_STATUS_LABEL: Record<string, string> = {
  observed: 'Observé', hypothetical: 'Hypothèse', target: 'Cible', documented: 'Mention',
  nonDocumented: 'Non documenté', unknown: 'Inconnu',
};

function formatNumber(value: number): string {
  const raw = String(value);
  if (/[eE]/.test(raw)) return value.toLocaleString('fr-FR', { maximumSignificantDigits: 15 });
  const [integer, decimals] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

function domainText(domain: HopRange | null): string {
  return domain ? `${formatNumber(domain.min)}–${formatNumber(domain.max)}` : 'domaine non défini';
}

function identityText(identity: { id: string; version: string }): string {
  return `${identity.id} · ${identity.version}`;
}

function isNumericValue(value: BrewingSensoryComparisonValue | undefined): value is NumericValue {
  return !!value && (value.status === 'observed' || value.status === 'hypothetical' || value.status === 'target');
}

function metricUnitText(metric: Definition['metric']): string {
  if (metric?.kind === 'modelIndex' && metric.unit === 'axisScale') return 'points d’indice';
  return metric?.unit ?? 'unité non déclarée';
}

function unitText(definition: Definition): string {
  return metricUnitText(definition.metric);
}

function valueUnitText(definition: Definition): string {
  return definition.metric?.unit ? ` ${metricUnitText(definition.metric)}` : '';
}

function readingOf(value: BrewingSensoryComparisonValue | undefined): NumericReading | null {
  if (!isNumericValue(value)) return null;
  const numeric = value;
  return 'value' in numeric
    ? { kind: 'point', status: numeric.status, value: numeric.value }
    : { kind: 'range', status: numeric.status, range: numeric.range, ...(numeric.central !== undefined ? { central: numeric.central } : {}) };
}

function valueFor(dimension: SensoryDimension, candidateId: string): BrewingSensoryComparisonValue | undefined {
  return dimension.values.find(value => value.candidateId === candidateId);
}

function candidateStatusSummary(comparison: BrewingSensoryComparisonDTO, candidateId: string, dimensionIds: string[]): string {
  const selectedDimensions = comparison.dimensionOrder.filter(reference => dimensionIds.includes(reference))
    .map(reference => comparison.dimensions.find(dimension => dimension.referenceGroupId === reference)).filter((dimension): dimension is SensoryDimension => !!dimension);
  const statuses = [...new Set(selectedDimensions.map(dimension => valueFor(dimension, candidateId)?.status)
    .filter((status): status is BrewingSensoryComparisonValue['status'] => status !== undefined)
    .map(status => COMPARISON_STATUS_LABEL[status] ?? 'Statut inconnu'))];
  return statuses.length ? statuses.join(' · ') : 'Aucune valeur sur les nuances choisies';
}

function candidateSeries(index: number) {
  return CANDIDATE_SERIES[index % CANDIDATE_SERIES.length];
}

function hasPlannedAdditions(branch: BrewingScenarioBranchResult): boolean {
  return branch.program?.additions.some(addition => addition.status === 'planned') ?? false;
}

function branchPresentationLabel(result: BrewingScenarioResult, branch: BrewingScenarioBranchResult): string {
  let label: string;
  if (branch.id === 'baseline') {
    const baseline = result.requestSnapshot.baseline;
    if (baseline.kind === 'hypothetical') label = `${baseline.label} · hypothèse explicite · profil total projeté`;
    else label = branch.program ? 'Projection du profil total du programme source' : 'Projection du profil total du contexte recette source';
  } else if (branch.applicability === 'unavailable') label = `${branch.label} · branche indisponible`;
  else if (branch.applicability === 'hypotheticalOnly') label = `${branch.label} · hypothèse de branche · profil total projeté`;
  else label = `${branch.label} · projection du profil total de la branche`;
  return hasPlannedAdditions(branch) ? `${label} · après les ajouts prévus` : label;
}

function candidateDisplayName(comparison: BrewingSensoryComparisonDTO, candidateId: string, originalName: string,
  result: BrewingScenarioResult | undefined, dimensionIds: string[]): string {
  if (!result || comparison.context.kind !== 'j5Snapshot' || result.reference !== comparison.context.contentReference
    || result.scenarioId !== comparison.context.id || String(result.revision) !== comparison.context.version) return originalName;
  const branch = [result.baseline, ...result.branches].find(row => row.id === candidateId);
  if (!branch) return originalName;
  const hasIndependentStatus = comparison.dimensions.filter(dimension => dimensionIds.includes(dimension.referenceGroupId))
    .some(dimension => {
      const value = valueFor(dimension, candidateId);
      return value?.status === 'observed' || value?.status === 'target' || value?.status === 'documented';
    });
  if (hasIndependentStatus) {
    if (branch.id === 'baseline' && result.requestSnapshot.baseline.kind === 'recipe') {
      return branch.program ? 'Série J5 du programme source' : 'Série J5 du contexte recette source';
    }
    return `Série J5 · ${branch.label}`;
  }
  return branchPresentationLabel(result, branch);
}

function CandidateMarker({ index }: { index: number }) {
  const series = candidateSeries(index);
  return <span className="hv55-sensory-marker" aria-hidden="true" style={{ color: series.color }}>{series.marker}</span>;
}

function candidateTitle(dimension: SensoryDimension, value: BrewingSensoryComparisonValue | undefined, candidateName: string): string {
  if (!value) return `${candidateName} : aucune valeur dans le DTO.`;
  if (isNumericValue(value)) {
    const unit = valueUnitText(dimension.definition);
    if ('value' in value) return `${candidateName} : ${VALUE_STATUS[value.status].toLocaleLowerCase('fr-FR')} ${formatNumber(value.value)}${unit}.`;
    return `${candidateName} : ${VALUE_STATUS[value.status].toLocaleLowerCase('fr-FR')} ${formatNumber(value.range.min)}–${formatNumber(value.range.max)}${unit}${value.central === undefined ? ', centrale non fournie' : `, centrale ${formatNumber(value.central)}${unit}`}.`;
  }
  const metric = dimension.definition.metric;
  if (value.status === 'documented') return `${candidateName} : mention qualitative documentée, sans score.`;
  if (value.status === 'nonDocumented') return `${candidateName} : non documenté. ${value.reason}`;
  if (value.status === 'unknown') return `${candidateName} : valeur inconnue. ${value.reason}`;
  return `${candidateName} : ${metric?.name ?? 'valeur'} sans statut lisible.`;
}

function exactValueText(dimension: SensoryDimension, value: BrewingSensoryComparisonValue | undefined): string {
  if (!value) return 'Aucune valeur dans cette comparaison.';
  if (isNumericValue(value)) {
    const unit = valueUnitText(dimension.definition);
    if ('value' in value) return `${VALUE_STATUS[value.status]} · ${formatNumber(value.value)}${unit}`;
    const central = value.central === undefined ? 'centrale non fournie' : `centrale ${formatNumber(value.central)}${unit}`;
    return `${VALUE_STATUS[value.status]} · ${formatNumber(value.range.min)}–${formatNumber(value.range.max)}${unit} · ${central}`;
  }
  if (value.status === 'documented') return 'Mention documentée · lecture qualitative, sans valeur chiffrée.';
  if (value.status === 'nonDocumented') return `Non documenté · ${value.reason}`;
  if (value.status === 'unknown') return `Inconnu · ${value.reason}`;
  return 'Statut absent.';
}

function numericStatus(value: BrewingSensoryComparisonValue | undefined): string {
  if (!value) return 'Absente du DTO';
  if (isNumericValue(value)) return VALUE_STATUS[value.status];
  if (value.status === 'documented') return 'Mention qualitative';
  if (value.status === 'nonDocumented') return 'Non documenté';
  if (value.status === 'unknown') return 'Inconnu';
  return VALUE_STATUS[value.status];
}

function scaleGroupKey(definition: Definition): string | null {
  if (!definition.metric || !definition.scale || !definition.scale.domain || !(definition.scale.domain.max > definition.scale.domain.min)) return null;
  return JSON.stringify([
    definition.metric.id, definition.metric.version,
    definition.scale.id, definition.scale.version
  ]);
}

function displayDimensionName(dimension: SensoryDimension): string {
  const definition = dimension.definition;
  const metric = definition.metric;
  if (!metric) return `${definition.dimension.name} · lecture documentaire`;
  const scale = definition.scale;
  return `${definition.dimension.name} · ${metric.name} · ${scale?.domain ? domainText(scale.domain) : 'échelle non définie'}${metric.unit ? ` ${metricUnitText(metric)}` : ''}`;
}

function DimensionSelection({
  dimensions, dimensionIds, onToggleDimension
}: {
  dimensions: SensoryDimension[];
  dimensionIds: string[];
  onToggleDimension: (referenceGroupId: string) => void;
}) {
  return (
    <fieldset className="hv55-sensory-selection hv55-sensory-dimension-selection">
      <legend>Nuances comparées</legend>
      <div className="hv55-sensory-toggle-list">
        {dimensions.map(dimension => (
          <label className="hv55-sensory-toggle" key={dimension.referenceGroupId}>
            <input type="checkbox" checked={dimensionIds.includes(dimension.referenceGroupId)} onChange={() => onToggleDimension(dimension.referenceGroupId)} />
            <span>{displayDimensionName(dimension)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CandidateSelection({
  comparison, candidateIds, dimensionIds, result, selectedCandidateId, onToggleCandidate, onChooseCandidate, selectableCandidateIds
}: {
  comparison: BrewingSensoryComparisonDTO;
  candidateIds: string[];
  dimensionIds: string[];
  result?: BrewingScenarioResult;
  selectedCandidateId?: string;
  onToggleCandidate: (id: string) => void;
  onChooseCandidate?: (id: string) => void;
  selectableCandidateIds?: string[];
}) {
  const candidates = comparison.candidateOrder.map(id => comparison.candidates.find(candidate => candidate.id === id)!).filter(Boolean);
  const statusPrefixId = useId();
  return (
    <fieldset className="hv55-sensory-selection">
      <legend>Candidats comparés</legend>
      <div className="hv55-sensory-candidate-list">
        {candidates.map(candidate => {
          const index = comparison.candidateOrder.indexOf(candidate.id);
          const name = candidateDisplayName(comparison, candidate.id, candidate.name, result, dimensionIds);
          const statusId = `${statusPrefixId}-candidate-status-${index}`;
          return (
            <div className="hv55-sensory-candidate" key={candidate.id}>
              <label className="hv55-sensory-toggle" title={`${name} · ${candidateStatusSummary(comparison, candidate.id, dimensionIds)}`}>
                <input type="checkbox" aria-label={`Comparer ${name}`} aria-describedby={statusId}
                  checked={candidateIds.includes(candidate.id)} onChange={() => onToggleCandidate(candidate.id)} />
                <CandidateMarker index={index} />
                <span>Comparer {name}<small className="hv55-sensory-candidate-status" id={statusId}>{candidateStatusSummary(comparison, candidate.id, dimensionIds)}</small></span>
              </label>
              {onChooseCandidate && (!selectableCandidateIds || selectableCandidateIds.includes(candidate.id)) && (
                <button className="hv55-sensory-choose" type="button" aria-pressed={selectedCandidateId === candidate.id}
                  onClick={() => onChooseCandidate(candidate.id)}>
                  {selectedCandidateId === candidate.id ? 'Choix courant' : 'Choisir ce candidat'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function SourceList({ sources }: { sources: HopSource[] }) {
  if (!sources.length) return <p>Aucune source rattachée.</p>;
  return (
    <ul className="hv55-sensory-sources">
      {sources.map((source, index) => (
        <li key={`${source.reference}-${index}`}>
          <span>{source.author} · {source.title}{source.year === null ? '' : ` · ${source.year}`} · {source.kind}</span>
          {source.locator && <span> · {source.locator}</span>} · <code>{source.reference}</code>
        </li>
      ))}
    </ul>
  );
}

function DefinitionDetails({ dimension }: { dimension: SensoryDimension }) {
  const definition = dimension.definition;
  const metric = definition.metric;
  const scale = definition.scale;
  return (
    <details className="hv55-sensory-definition-details">
      <summary>Définition, unité, échelle et sources</summary>
      <dl>
        <dt>Nuance</dt><dd>{definition.dimension.definition}</dd>
        <dt>Référence exacte</dt><dd><code>{definition.contentReference}</code></dd>
        <dt>Dimension</dt><dd>{identityText(definition.dimension)} · <code>{definition.dimensionReference}</code></dd>
        <dt>Métrique</dt><dd>{metric ? `${identityText(metric)} · ${METRIC_KIND_LABEL[metric.kind]} · ${metric.name} · ${metricUnitText(metric)}${metric.unit === 'axisScale' ? ' · code déclaré axisScale' : ''} · ${metric.meaning}` : 'Aucune métrique : dimension qualitative.'}</dd>
        <dt>Échelle</dt><dd>{scale ? `${identityText(scale)} · domaine ${domainText(scale.domain)}${scale.metricRef ? ` · métrique ${identityText(scale.metricRef)}` : ''}` : 'Aucune échelle définie.'}</dd>
      </dl>
      <strong>Sources de la dimension</strong><SourceList sources={definition.dimension.sourceRefs} />
      {metric && <><strong>Sources de la métrique</strong><SourceList sources={metric.sourceRefs} /></>}
      {scale && <><strong>Sources de l’échelle</strong><SourceList sources={scale.sourceRefs} />
        {scale.labels && scale.labels.length > 0 && <p>Repères déclarés : {scale.labels.map(label => `${formatNumber(label.value)} · ${label.label}`).join(' ; ')}.</p>}
      </>}
    </details>
  );
}

function ValueProvenance({ value }: { value: BrewingSensoryComparisonValue | undefined }) {
  if (!value) return null;
  const provenance: BrewingSensoryValueProvenance = value.provenance;
  const mentions = value.status === 'documented' ? value.mentions : [];
  return (
    <details className="hv55-sensory-provenance">
      <summary>Provenance · {provenance.sourceRefs.length} source{provenance.sourceRefs.length === 1 ? '' : 's'}</summary>
      <p>{provenance.explanation}</p>
      {provenance.limitations.length > 0 && <><strong>Limites</strong><ul>{provenance.limitations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></>}
      {provenance.modelRef && <p>Modèle : <code>{identityText(provenance.modelRef)}</code></p>}
      {provenance.hypothesisRefs && provenance.hypothesisRefs.length > 0 && <><strong>Hypothèses</strong><ul>{provenance.hypothesisRefs.map(reference => <li key={reference}><code>{reference}</code></li>)}</ul></>}
      {mentions.length > 0 && <>
        <strong>Mentions documentées</strong>
        <ul>{mentions.map((mention, index) => (
          <li key={`${mention.source.reference}-${index}`}>
            {mention.term} · {mention.qualification === 'qualified' ? `qualifiée · ${mention.qualifierTerm ?? 'qualificatif non précisé'}` : mention.qualification === 'negated' ? 'mention niée' : 'mention affirmée'}
            · {mention.context} · « {mention.text} » · {mention.source.author} · <code>{mention.source.reference}</code>
          </li>
        ))}</ul>
      </>}
      <SourceList sources={provenance.sourceRefs} />
    </details>
  );
}

function ReferenceDetails({ comparison }: { comparison: BrewingSensoryComparisonDTO }) {
  const contextKind = REFERENCE_KIND_LABEL[comparison.context.kind] ?? 'contexte de comparaison';
  const referenceKind = REFERENCE_KIND_LABEL[comparison.reference.kind] ?? 'référence de comparaison';
  return (
    <details className="hv55-sensory-reference-details">
      <summary>Références du contexte et de la comparaison</summary>
      <dl>
        <dt>Format</dt><dd>Comparaison sensorielle version 1 · <code>{comparison.version}</code></dd>
        <dt>Contexte · {contextKind}</dt>
        <dd>{identityText(comparison.context)} · {comparison.context.label} · <code>{comparison.context.contentReference}</code></dd>
        <dt>Référence · {referenceKind}</dt>
        <dd>{identityText(comparison.reference)} · <code>{comparison.reference.contentReference}</code></dd>
      </dl>
      <strong>Sources du contexte</strong><SourceList sources={comparison.context.sourceRefs} />
      <strong>Sources de la référence</strong><SourceList sources={comparison.reference.sourceRefs} />
    </details>
  );
}

function CandidateReferences({ candidates }: { candidates: Array<{ id: string; name: string }> }) {
  return <details className="hv55-sensory-candidate-references">
    <summary>Identités exactes des candidats · {candidates.length}</summary>
    <ul>{candidates.map(candidate => <li key={candidate.id}><span>{candidate.name}</span> · <code>{candidate.id}</code></li>)}</ul>
  </details>;
}

function ticksFor(dimension: SensoryDimension): Array<{ value: number; text: string }> {
  const domain = dimension.definition.scale?.domain;
  if (!domain) return [];
  const labels = dimension.definition.scale?.labels ?? [];
  const byValue = new Map<number, string>();
  byValue.set(domain.min, formatNumber(domain.min));
  byValue.set(domain.max, formatNumber(domain.max));
  for (const label of labels) byValue.set(label.value, `${label.label} · ${formatNumber(label.value)}`);
  return [...byValue.entries()].sort(([a], [b]) => a - b).map(([value, text]) => ({ value, text }));
}

function ratio(value: number, domain: HopRange): number {
  return (value - domain.min) / (domain.max - domain.min);
}

function BarProfiles({ dimensions, candidates, comparison }: {
  dimensions: SensoryDimension[];
  candidates: Array<{ id: string; name: string }>;
  comparison: BrewingSensoryComparisonDTO;
}) {
  const groups = groupPlottableDimensions(dimensions);
  if (!groups.length) return <p className="hv55-sensory-empty">Aucune dimension sélectionnée ne possède une métrique sensorielle numérique et une échelle bornée exacte. Les valeurs, mentions, unités et sources restent dans le tableau.</p>;
  return (
    <div className="hv55-sensory-bars" role="group" aria-label="Profils sensoriels en barres de plages">
      {groups.map((group, groupIndex) => (
        <section className="hv55-sensory-chart-group" key={group.key} data-metric-ref={group.metric.id} data-scale-ref={group.scale.id}>
          <header className="hv55-sensory-chart-group-heading">
            <h3>{group.metric.name}</h3>
            <p>{METRIC_KIND_LABEL[group.metric.kind]} · {group.metric.meaning} · {metricUnitText(group.metric)} · échelle {domainText(group.scale.domain)}</p>
          </header>
          {group.dimensions.map(dimension => (
            <SensoryBarRow key={dimension.referenceGroupId} dimension={dimension} candidates={candidates} comparison={comparison} />
          ))}
        </section>
      ))}
    </div>
  );
}

function SensoryBarRow({ dimension, candidates, comparison }: {
  dimension: SensoryDimension;
  candidates: Array<{ id: string; name: string }>;
  comparison: BrewingSensoryComparisonDTO;
}) {
  const domain = dimension.definition.scale!.domain!;
  const ticks = ticksFor(dimension);
  const candidateLabel = candidates.map(candidate => candidateTitle(dimension, valueFor(dimension, candidate.id), candidate.name)).join(' ');
  const trackHeight = Math.max(24, 10 + candidates.length * 10);
  return (
    <figure className="hv55-sensory-bar-row" data-reference-group={dimension.referenceGroupId}>
      <figcaption className="hv55-sensory-axis-label">
        <strong>{dimension.definition.dimension.name}</strong>
        <small>{identityText(dimension.definition.dimension)} · {unitText(dimension.definition)} · {domainText(domain)}</small>
      </figcaption>
      <div className="hv55-sensory-track-wrap">
        <div className="hv55-sensory-track" style={{ minHeight: trackHeight }} role="img"
          aria-label={`${dimension.definition.dimension.name}. ${dimension.definition.metric!.name}, ${metricUnitText(dimension.definition.metric)}, échelle ${domainText(domain)}. ${candidateLabel}`}>
          {ticks.map(tick => <span aria-hidden="true" key={tick.value} className="hv55-sensory-tick" style={{ left: `${ratio(tick.value, domain) * 100}%` }} />)}
          {candidates.map(candidate => {
            const reading = readingOf(valueFor(dimension, candidate.id));
            if (!reading) return null;
            const candidateIndex = comparison.candidateOrder.indexOf(candidate.id);
            const series = candidateSeries(candidateIndex);
            if (reading.kind === 'point') {
              return <span key={candidate.id} className="hv55-sensory-point" aria-hidden="true" style={{ left: `${ratio(reading.value, domain) * 100}%`, top: 5 + candidates.indexOf(candidate) * 10, color: series.color }}>{series.marker}</span>;
            }
            const left = ratio(reading.range.min, domain) * 100;
            const width = (ratio(reading.range.max, domain) - ratio(reading.range.min, domain)) * 100;
            return <React.Fragment key={candidate.id}>
              <span aria-hidden="true" className={`hv55-sensory-range hv55-sensory-${reading.status}${width === 0 ? ' hv55-sensory-degenerate-range' : ''}`}
                style={{ left: `${left}%`, width: width === 0 ? '1px' : `${width}%`, top: 5 + candidates.indexOf(candidate) * 10, '--hv55-sensory-series': series.color } as React.CSSProperties} />
              {reading.central !== undefined && <span aria-hidden="true" className="hv55-sensory-central"
                style={{ left: `${ratio(reading.central, domain) * 100}%`, top: 5 + candidates.indexOf(candidate) * 10, color: series.color }}>{series.marker}</span>}
            </React.Fragment>;
          })}
        </div>
        <div className="hv55-sensory-track-scale" aria-hidden="true"><span>{formatNumber(domain.min)}</span><span>{formatNumber(domain.max)}</span></div>
      </div>
      <div className="hv55-sensory-bar-values">
        {candidates.map(candidate => {
          const index = comparison.candidateOrder.indexOf(candidate.id);
          const value = valueFor(dimension, candidate.id);
          return <span key={candidate.id}><CandidateMarker index={index} /> {candidate.name} : {exactValueText(dimension, value)}</span>;
        })}
      </div>
    </figure>
  );
}

interface PlottableGroup {
  key: string;
  metric: NonNullable<Definition['metric']>;
  scale: NonNullable<Definition['scale']>;
  dimensions: SensoryDimension[];
}

function groupPlottableDimensions(dimensions: SensoryDimension[]): PlottableGroup[] {
  const groups = new Map<string, PlottableGroup>();
  for (const dimension of dimensions) {
    const { metric, scale } = dimension.definition;
    const key = scaleGroupKey(dimension.definition);
    if (!key || !metric || !scale || (metric.kind !== 'ordinalNote' && metric.kind !== 'modelIndex')) continue;
    const group = groups.get(key) ?? { key, metric, scale, dimensions: [] };
    group.dimensions.push(dimension);
    groups.set(key, group);
  }
  return [...groups.values()];
}

type RadarPoint = { x: number; y: number };
function radarPoint(index: number, count: number, value: number, domain: HopRange): RadarPoint {
  const center = 220, radius = 145;
  const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
  const distance = radius * ratio(value, domain);
  return { x: center + Math.cos(angle) * distance, y: center + Math.sin(angle) * distance };
}

function RadarProfiles({ dimensions, candidates, comparison, titleBaseId }: {
  dimensions: SensoryDimension[];
  candidates: Array<{ id: string; name: string }>;
  comparison: BrewingSensoryComparisonDTO;
  titleBaseId: string;
}) {
  const groups = groupPlottableDimensions(dimensions);
  if (!groups.length) return <p className="hv55-sensory-empty">Aucun radar ne peut être tracé sans échelle exacte. Les mentions documentées, mesures, domaines inconnus et valeurs inconnues restent lisibles au tableau, sans point ajouté.</p>;
  return (
    <div className="hv55-sensory-radars">
      {groups.map((group, groupIndex) => (
        <RadarProfile key={group.key} group={group} candidates={candidates} comparison={comparison}
          titleId={`${titleBaseId}-title-${groupIndex}`} descriptionId={`${titleBaseId}-description-${groupIndex}`} />
      ))}
    </div>
  );
}

function RadarProfile({ group, candidates, comparison, titleId, descriptionId }: {
  group: PlottableGroup;
  candidates: Array<{ id: string; name: string }>;
  comparison: BrewingSensoryComparisonDTO;
  titleId: string;
  descriptionId: string;
}) {
  const axes = group.dimensions;
  const domain = group.scale.domain!;
  const total = axes.length;
  const gaps = axes.flatMap(axis => candidates.flatMap(candidate => {
    const value = valueFor(axis, candidate.id);
    return readingOf(value) ? [] : [<li key={`${axis.referenceGroupId}-${candidate.id}`}>
      <CandidateMarker index={comparison.candidateOrder.indexOf(candidate.id)} /> {candidate.name} · {axis.definition.dimension.name} : {numericStatus(value).toLocaleLowerCase('fr-FR')}
    </li>];
  }));
  return (
    <section className="hv55-sensory-chart-group hv55-sensory-radar-group" data-metric-ref={group.metric.id} data-scale-ref={group.scale.id}>
      <header className="hv55-sensory-chart-group-heading">
        <h3>{group.metric.name}</h3>
        <p>{METRIC_KIND_LABEL[group.metric.kind]} · {group.metric.meaning} · {metricUnitText(group.metric)} · échelle {domainText(domain)}</p>
      </header>
      <svg className="hv55-sensory-radar" viewBox="0 0 440 440" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Radar · {group.metric.name} · {domainText(domain)}</title>
        <desc id={descriptionId}>Les axes gardent la même métrique et la même échelle exacte. Les plages sont tracées sur leur axe. Une valeur absente interrompt les segments centraux ; une centrale absente n’est pas remplacée par le milieu de la plage.</desc>
        {[0.25, 0.5, 0.75, 1].map(fraction => <circle key={fraction} cx="220" cy="220" r={145 * fraction} className="hv55-sensory-radar-ring" />)}
        {axes.map((axis, index) => {
          const angle = -Math.PI / 2 + index * Math.PI * 2 / total;
          const endpoint = { x: 220 + Math.cos(angle) * 145, y: 220 + Math.sin(angle) * 145 };
          const labelPoint = { x: 220 + Math.cos(angle) * 188, y: 220 + Math.sin(angle) * 188 };
          const anchor = Math.cos(angle) > 0.28 ? 'start' : Math.cos(angle) < -0.28 ? 'end' : 'middle';
          const fullName = axis.definition.dimension.name;
          const shortName = fullName.length > 15 ? `${fullName.slice(0, 14)}…` : fullName;
          return <g key={axis.referenceGroupId}>
            <line x1="220" y1="220" x2={endpoint.x} y2={endpoint.y} className="hv55-sensory-radar-axis" />
            <text x={labelPoint.x} y={labelPoint.y + 4} textAnchor={anchor} className="hv55-sensory-radar-label">
              <title>{`${fullName} · ${domainText(domain)} ${metricUnitText(group.metric)}`}</title>{shortName}
            </text>
          </g>;
        })}
        {candidates.map(candidate => {
          const candidateIndex = comparison.candidateOrder.indexOf(candidate.id);
          const series = candidateSeries(candidateIndex);
          const readings = axes.map(axis => readingOf(valueFor(axis, candidate.id)));
          const centralPoints = readings.map((reading, index) => {
            if (!reading) return null;
            const central = reading.kind === 'point' ? reading.value : reading.central;
            return central === undefined ? null : radarPoint(index, total, central, domain);
          });
          const lines = axes.map((_axis, index) => {
            const next = index + 1;
            if (next >= total) return null;
            const from = centralPoints[index], to = centralPoints[next];
            return from && to ? { from, to, index } : null;
          }).filter((line): line is { from: RadarPoint; to: RadarPoint; index: number } => line !== null);
          if (total > 2 && centralPoints.every(Boolean)) {
            const from = centralPoints[total - 1]!, to = centralPoints[0]!;
            lines.push({ from, to, index: total - 1 });
          }
          return <g key={candidate.id} data-candidate-id={candidate.id} style={{ '--hv55-sensory-series': series.color } as React.CSSProperties}>
            {readings.map((reading, index) => {
              if (!reading) return null;
              const axis = axes[index];
              if (reading.kind === 'point') {
                const point = radarPoint(index, total, reading.value, domain);
                return <text key={axis.referenceGroupId} x={point.x} y={point.y + 4} textAnchor="middle" className="hv55-sensory-radar-point" aria-hidden="true">
                  <title>{candidateTitle(axis, valueFor(axis, candidate.id), candidate.name)}</title>{series.marker}
                </text>;
              }
              const start = radarPoint(index, total, reading.range.min, domain);
              const end = radarPoint(index, total, reading.range.max, domain);
              const central = reading.central === undefined ? null : radarPoint(index, total, reading.central, domain);
              return <g key={axis.referenceGroupId} className={`hv55-sensory-radar-reading hv55-sensory-${reading.status}`}>
                <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="hv55-sensory-radar-extent" />
                <circle cx={start.x} cy={start.y} r="2.5" className="hv55-sensory-radar-range-end" />
                {reading.range.max !== reading.range.min && <circle cx={end.x} cy={end.y} r="2.5" className="hv55-sensory-radar-range-end" />}
                {central && <text x={central.x} y={central.y + 4} textAnchor="middle" className="hv55-sensory-radar-point" aria-hidden="true">
                  <title>{candidateTitle(axis, valueFor(axis, candidate.id), candidate.name)}</title>{series.marker}
                </text>}
              </g>;
            })}
            {lines.map(line => <line key={line.index} x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} className="hv55-sensory-radar-central-line" />)}
          </g>;
        })}
      </svg>
      {gaps.length > 0 && <ul className="hv55-sensory-gaps" aria-label="Valeurs absentes du radar">{gaps}</ul>}
      <p className="hv55-sensory-radar-note">Même métrique et échelle pour ces axes : {domainText(domain)} {metricUnitText(group.metric)}. Valeurs exactes, statut et sources au tableau.</p>
    </section>
  );
}

function TableValue({ dimension, value }: { dimension: SensoryDimension; value: BrewingSensoryComparisonValue | undefined }) {
  return (
    <div className={`hv55-sensory-cell hv55-sensory-cell-${value?.status ?? 'missing'}`}>
      <strong>{exactValueText(dimension, value)}</strong>
      {value && <small>{numericStatus(value)}</small>}
      <ValueProvenance value={value} />
    </div>
  );
}

function ExactValuesTable({ dimensions, candidates, comparison }: {
  dimensions: SensoryDimension[];
  candidates: Array<{ id: string; name: string }>;
  comparison: BrewingSensoryComparisonDTO;
}) {
  const hintId = useId();
  return (
    <div className="hv55-sensory-table-region" role="region" aria-label="Valeurs exactes, unités et provenances" tabIndex={0} aria-describedby={hintId}>
      <p id={hintId} className="hv55-sensory-sr-only">Fais défiler horizontalement pour lire toutes les colonnes.</p>
      <table>
        <caption>Valeurs, mentions et inconnues gardées sous leur métrique et leur échelle exactes. Les états documentés ne deviennent pas des notes.</caption>
        <thead><tr><th scope="col">Nuance · métrique · échelle</th>{candidates.map(candidate => (
          <th scope="col" key={candidate.id}>{candidate.name}</th>
        ))}</tr></thead>
        <tbody>
          {dimensions.map(dimension => (
            <tr key={dimension.referenceGroupId} data-reference-group={dimension.referenceGroupId}>
              <th scope="row">
                <strong>{displayDimensionName(dimension)}</strong>
                <DefinitionDetails dimension={dimension} />
              </th>
              {candidates.map(candidate => <td key={candidate.id}><TableValue dimension={dimension} value={valueFor(dimension, candidate.id)} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HopV55SensoryComparison({
  comparison,
  result,
  candidateIds,
  dimensionIds,
  mode,
  onModeChange,
  onToggleCandidate,
  onToggleDimension,
  onChooseCandidate,
  selectableCandidateIds,
  selectedCandidateId
}: HopV55SensoryComparisonProps) {
  const checked = useMemo(() => { assertBrewingSensoryComparison(comparison); return comparison; }, [comparison]);
  const chartTitleId = useId();
  const dimensionsByReference = useMemo(() => new Map(checked.dimensions.map(dimension => [dimension.referenceGroupId, dimension])), [checked]);
  const orderedDimensions = checked.dimensionOrder.map(reference => dimensionsByReference.get(reference)).filter((dimension): dimension is SensoryDimension => !!dimension);
  const sourceResult = useMemo(() => {
    if (!result || result.reference !== checked.context.contentReference || result.scenarioId !== checked.context.id
      || String(result.revision) !== checked.context.version) return undefined;
    try { assertBrewingScenarioResult(result); return result; }
    catch { return undefined; }
  }, [result, checked.context]);
  const orderedCandidates = checked.candidateOrder.map(id => checked.candidates.find(candidate => candidate.id === id))
    .filter((candidate): candidate is { id: string; name: string } => !!candidate)
    .map(candidate => ({ ...candidate, name: candidateDisplayName(checked, candidate.id, candidate.name, sourceResult, dimensionIds) }));
  const dimensions = orderedDimensions.filter(dimension => dimensionIds.includes(dimension.referenceGroupId));
  const candidates = orderedCandidates.filter(candidate => candidateIds.includes(candidate.id));

  return (
    <section className="hv55-sensory-comparison" aria-labelledby={`${chartTitleId}-heading`}>
      <header className="hv55-sensory-header">
        <div>
          <h2 id={`${chartTitleId}-heading`}>Comparer les nuances</h2>
          <p>{checked.context.label} · référence {REFERENCE_KIND_LABEL[checked.reference.kind] ?? 'comparative'}</p>
        </div>
        <div className="hv55-sensory-mode" role="group" aria-label="Rendu du même profil">
          <button type="button" aria-pressed={mode === 'bars'} onClick={() => onModeChange('bars')}>Barres</button>
          <button type="button" aria-pressed={mode === 'radar'} onClick={() => onModeChange('radar')}>Radar</button>
        </div>
      </header>

      <p className="hv55-sensory-qualification">
        Chaque profil garde sa métrique et son échelle déclarées. Une plage n’ajoute pas de centrale ; une mention qualitative, une mesure hors profil ou une valeur inconnue ne devient pas un zéro.
      </p>

      <div className="hv55-sensory-legend" aria-label="Légende des candidats sélectionnés">
        {candidates.map(candidate => <span key={candidate.id}><span><CandidateMarker index={checked.candidateOrder.indexOf(candidate.id)} />{candidate.name}</span>
          <small>{candidateStatusSummary(checked, candidate.id, dimensionIds)}</small></span>)}
      </div>
      <div className="hv55-sensory-status-legend" aria-label="Statuts des valeurs chiffrées">
        <span className="hv55-sensory-status-sample hv55-sensory-observed">Observé</span>
        <span className="hv55-sensory-status-sample hv55-sensory-hypothetical">Projection hypothétique</span>
        <span className="hv55-sensory-status-sample hv55-sensory-target">Cible</span>
        <span className="hv55-sensory-status-note">Mention documentée, non-documenté et inconnu se lisent dans le tableau.</span>
      </div>

      {candidates.length === 0 ? <p className="hv55-sensory-empty">Sélectionne au moins un candidat pour afficher son profil.</p>
        : dimensions.length === 0 ? <p className="hv55-sensory-empty">Sélectionne une nuance pour lire le profil.</p>
          : mode === 'bars'
            ? <BarProfiles dimensions={dimensions} candidates={candidates} comparison={checked} />
            : <RadarProfiles dimensions={dimensions} candidates={candidates} comparison={checked} titleBaseId={chartTitleId} />}

      <CandidateSelection comparison={checked} candidateIds={candidateIds} dimensionIds={dimensionIds} result={sourceResult} selectedCandidateId={selectedCandidateId}
        onToggleCandidate={onToggleCandidate} onChooseCandidate={onChooseCandidate} selectableCandidateIds={selectableCandidateIds} />
      <DimensionSelection dimensions={orderedDimensions} dimensionIds={dimensionIds} onToggleDimension={onToggleDimension} />
      <CandidateReferences candidates={orderedCandidates} />
      <ReferenceDetails comparison={checked} />
      <ExactValuesTable dimensions={dimensions} candidates={candidates} comparison={checked} />
    </section>
  );
}
