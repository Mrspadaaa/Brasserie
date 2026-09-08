import React from 'react';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import { hopRangeLabel } from './presentation';

/** Each lane keeps its own interval. Missing values never become zero or a polygon vertex. */
export function HopRangePlot({ axis, predicted, target, perceived }: {
  axis: HopAxis; predicted: HopRange | null; target?: HopRange | null; perceived?: HopRange | null;
}) {
  const percent = (value: number) => Math.max(0, Math.min(100, (value - axis.scale.min) / (axis.scale.max - axis.scale.min) * 100));
  const lanes = [
    ...(target !== undefined ? [{ label: 'Recherché', range: target, color: 'border-ebc-straw bg-ebc-straw/10 border-dashed' }] : []),
    { label: 'Prévu', range: predicted, color: 'border-water bg-water/50' },
    ...(perceived !== undefined ? [{ label: 'Dégusté', range: perceived, color: 'border-hop bg-hop/50' }] : [])
  ];
  return <figure aria-label={`Plages aromatiques · ${axis.name}`} className="rounded-control bg-cave-950/50 border border-cave-800 px-3 py-3 space-y-2">
    {lanes.map(lane => <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2" key={lane.label}>
      <span className="text-sm text-cave-200">{lane.label}<span className="sr-only"> : {hopRangeLabel(lane.range)}</span></span>
      {lane.range ? <div className="relative h-5 rounded bg-cave-800/70" aria-hidden="true">
        {[axis.lowMax, axis.mediumMax].map(mark => <span key={mark} className="absolute h-full border-l border-cave-600" style={{ left: `${percent(mark)}%` }} />)}
        <span className={`absolute inset-y-0 rounded-sm border-2 ${lane.color}`} style={{ left: `${percent(lane.range.min)}%`, width: `${percent(lane.range.max) - percent(lane.range.min)}%`, minWidth: '2px', maxWidth: '100%' }} />
      </div> : <span className="text-sm text-cave-400 border-b border-dashed border-cave-700">Non quantifiable</span>}
    </div>)}
    <figcaption className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-sm text-cave-400">
      <span>Échelle</span><span className="flex justify-between gap-2"><span className="font-mono">{axis.scale.min}</span><span>faible → forte</span><span className="font-mono">{axis.scale.max}</span></span>
    </figcaption>
  </figure>;
}
