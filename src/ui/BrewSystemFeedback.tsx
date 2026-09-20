import { useId, useMemo } from 'react';
import type { BrewDayState, Recipe, RecipeSnapshot } from '../types';
import { brewSystemInsights, type SystemMetric } from '../domain/brewSystemInsights';
import './brew-system.css';

export function systemNumber(value: number | null, unit: SystemMetric['unit']) {
  return value == null ? '—' : value.toLocaleString('fr-CH', { maximumFractionDigits: unit === '°C/min' || unit === 'L/kg' ? 2 : 1 });
}

export interface BrewSystemFeedbackProps {
  recipe: Recipe | RecipeSnapshot;
  state: BrewDayState;
  onMeasure?: (stepId: string) => void;
  onIngredients?: () => void;
  compact?: boolean;
}

/** Paired evidence is adjacent to the next useful measurement, never hidden in settings. */
export function BrewSystemFeedback({ recipe, state, onMeasure, onIngredients, compact = false }: BrewSystemFeedbackProps) {
  const titleId = useId();
  const insights = useMemo(() => brewSystemInsights(recipe, state), [recipe, state]);
  const observed = insights.metrics.filter(m => m.value != null).length;
  return <section className={`brew-system${compact ? ' brew-system--compact' : ''}`} aria-labelledby={titleId}>
    <div className="brew-system-heading">
      <h3 id={titleId}>Ce brassin · mon installation</h3>
      <span>{observed} / {insights.metrics.length} résultats</span>
    </div>
    <table className="brew-system-table">
      <thead><tr><th scope="col">Repère</th><th scope="col">Prévu</th><th scope="col">Observé</th></tr></thead>
      <tbody>{insights.metrics.map(metric => <tr key={metric.id}>
        <th scope="row">{metric.label}<small>{metric.unit}</small></th>
        <td>{systemNumber(metric.expected, metric.unit)}</td>
        <td className={metric.value == null ? 'brew-system-unknown' : undefined}>
          {metric.value == null ? <span aria-label="Pas encore mesuré">—</span> : <>{metric.approximate && <abbr title="Volume corrigé à partir du retrait au refroidissement">≈</abbr>}{systemNumber(metric.value, metric.unit)}</>}
        </td>
      </tr>)}</tbody>
    </table>
    {insights.nextMeasurement && <div className="brew-system-next">
      <p>{insights.nextMeasurement.message}</p>
      {insights.nextMeasurement.missingIngredients
        ? onIngredients && <button type="button" className="brew-system-button" onClick={onIngredients}>Vérifier les ajouts réels</button>
        : onMeasure && <button type="button" className="brew-system-button" onClick={() => onMeasure(insights.nextMeasurement!.stepId)}>Compléter les mesures</button>}
    </div>}
    <details className="brew-system-details">
      <summary>Comprendre les résultats et les données manquantes</summary>
      <dl>{insights.metrics.map(metric => <div key={metric.id}>
        <dt>{metric.label}</dt><dd>{metric.reason}</dd>
      </div>)}</dl>
      <p>Une valeur absente reste inconnue. Les coefficients de l’installation ne changent qu’après ton accord dans les réglages.</p>
    </details>
  </section>;
}
