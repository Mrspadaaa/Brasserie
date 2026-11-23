import React from 'react';
import type { HopRange } from '../../functions/src/hopIndexSchema';

const finiteRange = (range?: HopRange | null): range is HopRange => !!range &&
  Number.isFinite(range.min) && Number.isFinite(range.max) && range.min <= range.max;
const format = (value: number, digits: number) => value.toLocaleString('fr-FR', {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
});

/** A common numeric axis makes documentary ranges comparable. No aroma scale. */
export function YeastRangeComparison({ label, unit, current, proposed, digits = 1, quantity }: {
  label: string; unit: string; current?: HopRange | null; proposed?: HopRange | null; digits?: number; quantity?: number;
}) {
  const known = [current, proposed].filter(finiteRange);
  const point = Number.isFinite(quantity) ? quantity : undefined;
  const low = known.length ? Math.min(...known.map(r => r.min), ...point === undefined ? [] : [point]) : point ?? 0;
  const high = known.length ? Math.max(...known.map(r => r.max), ...point === undefined ? [] : [point]) : point ?? 0;
  const padding = Math.max((high - low) * 0.1, 10 ** -digits);
  const min = low - padding, max = high + padding;
  const position = (value: number) => (value - min) / (max - min) * 100;
  const rangeLabel = (range?: HopRange | null) => finiteRange(range)
    ? `${format(range.min, digits)}${range.min === range.max ? '' : `–${format(range.max, digits)}`} ${unit}`
    : 'À renseigner';
  return <figure className="yeast-range-comparison" aria-label={label}>
    <figcaption>{label}</figcaption>
    <div className="yeast-range-rows">
      {([{ name: 'Recette', range: current, kind: 'current' }, { name: 'Scénario', range: proposed, kind: 'proposed' }] as const).map(row => <div key={row.kind} className="yeast-range-row">
        <span className="text-cave-400">{row.name}</span>
        {finiteRange(row.range) ? <span className="yeast-range-track" aria-hidden="true" data-scale-min={min} data-scale-max={max}>
          <span className={`yeast-range-interval yeast-range-${row.kind}`} data-min={row.range.min} data-max={row.range.max}
            style={{ left: `${position(row.range.min)}%`, width: `${position(row.range.max) - position(row.range.min)}%` }} />
          {row.kind === 'proposed' && point !== undefined && <span className="yeast-range-point" style={{ left: `${position(point)}%` }} />}
        </span> : <span className="yeast-range-unknown" aria-hidden="true" />}
        <output className="font-mono tabular-nums text-cave-50">{rangeLabel(row.range)}</output>
      </div>)}
    </div>
    {point !== undefined && <p className="yeast-small mt-1">Quantité prévue : {format(point, digits)} {unit}{finiteRange(proposed) ? point < proposed.min ? ' · sous le repère fabricant' : point > proposed.max ? ' · au-dessus du repère fabricant' : ' · dans le repère fabricant' : ' · repère inconnu'}.</p>}
  </figure>;
}
