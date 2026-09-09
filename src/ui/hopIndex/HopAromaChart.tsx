import React, { useMemo } from 'react';
import type { HopRange, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopAxis, HopPrediction } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import { hopDescriptorEvidence } from '../../../functions/src/hopExtrapolationCore';
import { HOP_CONFIDENCE_LABELS, hopIntensityLabel, hopRangeLabel } from './presentation';
import { HopSourceLink } from './HopTechnicalPanel';

type ChartPrediction = Pick<HopPrediction, 'profile' | 'extrapolatedAxes'>;
const completeScale = (axis: HopAxis, range?: HopRange | null) => !!range && range.min <= axis.scale.min && range.max >= axis.scale.max;
const fraction = (axis: HopAxis, n: number) => Math.max(0, Math.min(1, (n - axis.scale.min) / (axis.scale.max - axis.scale.min)));
const point = (angle: number, r: number) => [220 + Math.cos(angle) * r, 190 + Math.sin(angle) * r];
const words = (name: string) => {
  const lines: string[] = [];
  for (const word of name.split(' ')) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= 15) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
};

/** Radial intervals share the model's axis definitions. Missing values have no vertex. */
export function HopAromaRadar({ prediction, axes, target, baseline }: { prediction: ChartPrediction; axes: HopAxis[]; target: Record<string, HopRange>; baseline?: ChartPrediction }) {
  if (!axes.length) return null;
  const angle = (i: number) => -Math.PI / 2 + i * 2 * Math.PI / axes.length;
  const polygon = (r: number) => axes.map((_, i) => point(angle(i), r).join(',')).join(' ');
  return <svg viewBox="0 0 440 380" className="w-full max-w-md mx-auto" role="img" aria-label="Radar des saveurs : simulation verte, comparaison grise, objectif doré">
    <title>Plages aromatiques par famille</title>
    <desc>Chaque rayon utilise l’échelle de sa famille. Une valeur inconnue ne représente pas une absence d’arôme.</desc>
    {[1 / 3, 2 / 3, 1].map(r => <polygon key={r} points={polygon(110 * r)} fill="none" stroke="currentColor" className="text-cave-700" strokeWidth="1" />)}
    {axes.map((axis, i) => {
      const a = angle(i), estimate = prediction.profile[axis.id], r = estimate?.range;
      const full = completeScale(axis, r), end = point(a, 110), label = point(a, 144);
      const segment = (range: HopRange) => [...point(a, 110 * fraction(axis, range.min)), ...point(a, 110 * fraction(axis, range.max))];
      const before = baseline?.profile[axis.id]?.range;
      const retained = before && !completeScale(axis, before) ? segment(before) : null;
      const band = r ? segment(r) : null, goal = target[axis.id] ? segment(target[axis.id]) : null;
      const center = r && !full && estimate.central !== undefined ? point(a, 110 * fraction(axis, estimate.central)) : null;
      const lines = words(axis.name);
      return <g key={axis.id} data-axis={axis.id} data-scale-min={axis.scale.min} data-scale-max={axis.scale.max}>
        <title>{axis.name} · échelle {hopRangeLabel(axis.scale)} · {r && !full ? `simulation ${hopRangeLabel(r)}, confiance ${HOP_CONFIDENCE_LABELS[estimate.confidence]}` : 'simulation indéterminée'}{baseline ? ` · conservé : ${before && !completeScale(axis, before) ? hopRangeLabel(before) : 'indéterminé'}` : ''}</title>
        <line x1="220" y1="190" x2={end[0]} y2={end[1]} stroke="currentColor" className="text-cave-700" strokeDasharray={!r || full ? '3 5' : undefined} />
        {goal && <line x1={goal[0]} y1={goal[1]} x2={goal[2]} y2={goal[3]} stroke="currentColor" className="text-ebc-straw" strokeWidth="10" strokeOpacity=".35" strokeLinecap="round" />}
        {retained && <line data-aroma-baseline x1={retained[0]} y1={retained[1]} x2={retained[2]} y2={retained[3]} stroke="currentColor" className="text-cave-400" strokeWidth="9" strokeOpacity=".8" strokeLinecap="round" />}
        {band && !full && <line x1={band[0]} y1={band[1]} x2={band[2]} y2={band[3]} stroke="currentColor" className="text-hop" strokeWidth="5" strokeLinecap="round" />}
        {center && <circle cx={center[0]} cy={center[1]} r="3" fill="currentColor" className="text-hop" />}
        <text x={label[0]} y={label[1] - (lines.length - 1) * 8.5} textAnchor="middle" dominantBaseline="middle" fill="currentColor" className={r && !full ? 'text-cave-200' : 'text-cave-400'} fontSize="16">
          {lines.map((line, j) => <tspan key={j} x={label[0]} dy={j ? 17 : 0}>{line}</tspan>)}
        </text>
      </g>;
    })}
  </svg>;
}

export function HopExplorationChart({ prediction, axes, target, baseline, highlighted = [], variety, models = [], showAll = false, title = 'Profil aromatique estimé' }: {
  prediction: ChartPrediction; axes: HopAxis[]; target: Record<string, HopRange>; baseline?: ChartPrediction; highlighted?: string[];
  variety?: HopVariety; models?: HopExtrapolation[]; showAll?: boolean; title?: string;
}) {
  const descriptors = useMemo(() => Object.fromEntries(axes.map(a => [a.id, variety ? [...new Set(models.flatMap(m => {
    const definition = m.axes.find(d => d.id === a.id && d.version === a.version);
    return definition ? hopDescriptorEvidence(variety, definition.terms) : [];
  }))] : []])), [axes, variety, models]);
  const informative = (a: HopAxis) => !!prediction.profile[a.id]?.range && !completeScale(a, prediction.profile[a.id].range);
  const retained = (a: HopAxis) => !!baseline?.profile[a.id]?.range && !completeScale(a, baseline.profile[a.id].range);
  const priority = (a: HopAxis) => informative(a) && !prediction.extrapolatedAxes?.includes(a.id) ? 0 : target[a.id] ? 1 : informative(a) && highlighted.includes(a.id) ? 2 : 3;
  const important = axes.filter(a => target[a.id] || informative(a) || retained(a)).sort((a, b) => priority(a) - priority(b));
  const visible = showAll ? axes : important.slice(0, 4);
  const other = axes.filter(a => !visible.includes(a));
  const documentaryAxes = axes.filter(a => descriptors[a.id].length > 0);
  const documentaryEvidence = [...new Map(documentaryAxes.flatMap(a => descriptors[a.id]).map(d => [JSON.stringify([d.text, d.source]), d])).values()];
  // Study-specific axes keep their own published scale. An inapplicable study
  // axis must not appear as a second unknown version of the same flavour.
  const radarAxes = axes.filter(a => !!target[a.id] || !!prediction.profile[a.id]?.range || !!baseline?.profile[a.id]?.range ||
    models.some(m => m.axes.some(d => d.id === a.id && d.version === a.version)));
  const showRadar = radarAxes.length > 0 && (showAll || radarAxes.some(a => informative(a) || retained(a) || target[a.id]));
  const row = (axis: HopAxis) => {
    const estimate = prediction.profile[axis.id], r = estimate?.range, full = completeScale(axis, r);
    const start = (n: number) => fraction(axis, n) * 100, before = baseline?.profile[axis.id]?.range;
    return <div key={axis.id} role="group" aria-label={`Estimation · ${axis.name}`} className="py-2 border-b border-cave-800 last:border-0">
      <div className="flex items-start justify-between gap-3 text-sm"><span className="font-medium text-cave-200">{axis.name}</span><span className="text-right text-cave-200">{full ? 'Intensité indéterminée' : r ? hopIntensityLabel(estimate, axis) : 'Non quantifiable'}</span></div>
      <div className="relative h-3 rounded bg-cave-800 my-1 overflow-hidden" aria-hidden="true">
        {target[axis.id] && <span className="absolute inset-y-0 bg-ebc-straw/25 border-x border-ebc-straw" style={{ left: `${start(target[axis.id].min)}%`, width: `${start(target[axis.id].max) - start(target[axis.id].min)}%` }} />}
        {before && !completeScale(axis, before) && <span data-aroma-baseline className="absolute bottom-0 h-1 min-w-px bg-cave-400" style={{ left: `${start(before.min)}%`, width: `${start(before.max) - start(before.min)}%` }} />}
        {r && <span className={`absolute rounded ${baseline ? 'top-0 h-2' : 'inset-y-0'} ${full ? 'border border-dashed border-cave-400' : 'bg-hop/60 min-w-px'}`} style={{ left: `${start(r.min)}%`, width: `${start(r.max) - start(r.min)}%`, ...(r.min === r.max && r.max === axis.scale.max ? { transform: 'translateX(-100%)' } : {}) }} />}
        {r && !full && estimate.central !== undefined && <span data-testid="aroma-central-marker" className={`absolute w-1 -translate-x-1/2 bg-hop ${baseline ? 'top-0 h-2' : 'inset-y-0'}`} style={{ left: `${start(estimate.central)}%` }} />}
      </div>
      <div className="flex flex-wrap justify-between gap-x-2 text-xs text-cave-400"><span>{r ? `Plage ${hopRangeLabel(r)}` : 'Plage inconnue'}</span><span>Confiance {HOP_CONFIDENCE_LABELS[estimate?.confidence ?? 'low']}</span></div>
      <p className="text-xs text-cave-400">Échelle {hopRangeLabel(axis.scale)}{baseline && <span className="block" data-aroma-baseline-label>Conservé : {before && !completeScale(axis, before) ? `${hopRangeLabel(before)} · confiance ${HOP_CONFIDENCE_LABELS[baseline.profile[axis.id].confidence]}` : 'intensité indéterminée'}</span>}</p>
      {!!descriptors[axis.id].length && <details className="text-xs text-cave-300"><summary className="cursor-pointer py-2 text-water">Descripteur documenté pour {variety!.name}</summary><p className="mb-2">Description du houblon ; l’intensité dans cette bière est évaluée séparément.</p>{descriptors[axis.id].map((d, i) => <div key={i} className="mb-2"><p>{d.text}</p><HopSourceLink source={d.source} /></div>)}</details>}
      <details className="text-xs text-cave-400"><summary className="cursor-pointer py-2">Sources et portée de l’estimation</summary>{full && <p>Toute l’échelle reste possible ; aucune intensité moyenne n’en est déduite.</p>}{estimate?.reasons.map((reason, i) => <p key={i}>{reason}</p>)}{estimate?.sources.map((source, i) => <div key={i} className="mt-1"><HopSourceLink source={source} /></div>)}</details>
    </div>;
  };
  return <figure className="space-y-2" aria-label="Graphe de la prédiction expérimentale">
    <figcaption className="font-serif text-lg text-cave-50">{title}</figcaption>
    <div className={`grid ${showRadar ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''} gap-x-4 ${showAll ? 'items-start' : 'items-center'}`}>
      {showRadar && <div><HopAromaRadar prediction={prediction} axes={radarAxes} target={target} baseline={baseline} /><div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-cave-400" aria-label="Légende du radar"><span className="text-hop">Vert : simulation</span>{baseline && <span>Gris : comparaison conservée</span>}{Object.keys(target).length > 0 && <span className="text-ebc-straw">Doré : objectif</span>}<span>Point : hypothèse · pointillés : indéterminé</span></div></div>}
      <div className="min-w-0">{visible.map(row)}{!visible.length && <p className="text-sm text-cave-400">Les données ne permettent pas encore de préciser les intensités de cette bière.</p>}</div>
    </div>
    {!showAll && documentaryEvidence.length > 0 && <details className="text-sm text-cave-300"><summary className="cursor-pointer min-h-touch text-water">Repères documentés de {variety!.name}</summary><div className="pb-3 space-y-2"><p>{documentaryAxes.map(a => a.name).join(', ')}.</p><p className="text-xs text-cave-400">Descriptions de la variété ; l’intensité dans cette bière est évaluée séparément.</p>{documentaryEvidence.map((d, i) => <div key={i}><p>{d.text}</p><HopSourceLink source={d.source} /></div>)}</div></details>}
    {!showAll && other.length > 0 && <details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Autres familles · {other.length} à examiner</summary>{other.map(row)}</details>}
  </figure>;
}
