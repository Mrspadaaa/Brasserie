import React, { useMemo } from 'react';
import type { HopRange, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopAxis, HopEstimate, HopPrediction } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import { hopDescriptorEvidence } from '../../../functions/src/hopExtrapolationCore';
import { HOP_CONFIDENCE_LABELS, hopIntensityLabel, hopRangeLabel } from './presentation';
import { HopSourceLink } from './HopTechnicalPanel';
import './aroma-charts.css';

type ChartPrediction = Pick<HopPrediction, 'profile' | 'extrapolatedAxes'>;
const completeScale = (axis: HopAxis, range?: HopRange | null) => !!range && range.min <= axis.scale.min && range.max >= axis.scale.max;
const fraction = (axis: HopAxis, n: number) => Math.max(0, Math.min(1, (n - axis.scale.min) / (axis.scale.max - axis.scale.min)));
/** Existing sensory classes define an unresolved intensity, without a new precision coefficient. */
export const unresolvedAromaRange = (axis: HopAxis, range?: HopRange | null) =>
  !range || completeScale(axis, range) || range.min <= axis.lowMax && range.max > axis.mediumMax;
export function aromaPlotValue(axis: HopAxis, estimate?: HopEstimate) {
  const v=estimate?.central, r=estimate?.range;
  return r && !unresolvedAromaRange(axis,r) && typeof v==='number' && Number.isFinite(v) && v>=r.min && v<=r.max ? v : undefined;
}
const point = (angle: number, r: number) => [220 + Math.cos(angle) * r, 190 + Math.sin(angle) * r];
const words = (name: string) => {
  const lines: string[] = [];
  for (const word of name.split(' ')) {
    const last = lines.length - 1;
    if (last >= 0 && (lines[last]+' '+word).length <= 11) lines[last] += ' '+word;
    else lines.push(word);
  }
  return lines;
};

/** Connect central values only: never a maximum-as-intensity or missing-as-zero vertex. */
export function HopAromaRadar({ prediction, axes, target, baseline }: { prediction: ChartPrediction; axes: HopAxis[]; target: Record<string, HopRange>; baseline?: ChartPrediction }) {
  if (!axes.length) return null;
  const angle = (i: number) => -Math.PI / 2 + i * 2 * Math.PI / axes.length;
  const polygon = (r: number) => axes.map((_, i) => point(angle(i), r).join(',')).join(' ');
  const values = (p?:ChartPrediction) => axes.map((axis,i)=>{const v=aromaPlotValue(axis,p?.profile[axis.id]);return v===undefined?null:point(angle(i),92*fraction(axis,v));});
  const current=values(prediction), previous=values(baseline);
  const labels=axes.map((axis,i)=>({xy:point(angle(i),120),anchor:Math.cos(angle(i))>.25?'start':Math.cos(angle(i))<-.25?'end':'middle'}));
  for(const side of ['start','end']){
    const column=labels.filter(l=>l.anchor===side).sort((a,b)=>a.xy[1]-b.xy[1]);
    column.forEach((l,i)=>{l.xy[1]=190+(i-(column.length-1)/2)*50;});
  }
  const contour=(vertices:(number[]|null)[],comparison=false)=>{
    const complete=vertices.length>=3&&vertices.every(Boolean);
    return <g data-aroma-contour={comparison?'baseline':'prediction'} className={comparison?'text-cave-400':'text-hop'}>
      {complete&&<polygon points={vertices.map(v=>v!.join(',')).join(' ')} fill="currentColor" fillOpacity={comparison?0:.10} stroke="currentColor" strokeWidth="2" strokeDasharray={comparison?'4 4':undefined}/>}
      {!complete&&vertices.length>=3&&vertices.map((v,i)=>{const next=vertices[(i+1)%vertices.length];return v&&next?<line key={i} x1={v[0]} y1={v[1]} x2={next[0]} y2={next[1]} stroke="currentColor" strokeWidth="2" strokeDasharray={comparison?'4 4':undefined}/>:null;})}
    </g>;
  };
  return <svg viewBox="0 45 440 300" className="aroma-radar" role="img" aria-label="Radar des saveurs : repères du modèle, comparaison et objectif" data-radar-center-x="220" data-radar-center-y="190" data-radar-radius="92">
    <title>Repères aromatiques du modèle</title>
    <desc>Les points représentent les valeurs centrales du modèle. Les plages se lisent dans les barres. Une famille sans point ne vaut pas zéro.</desc>
    {[1/3,2/3,1].map(r=><polygon key={r} points={polygon(92*r)} fill="none" stroke="currentColor" className="text-cave-700" strokeWidth="1"/>)}
    {contour(previous,true)}{contour(current)}
    {axes.map((axis,i)=>{
      const a=angle(i),estimate=prediction.profile[axis.id],r=estimate?.range,center=current[i],before=baseline?.profile[axis.id]?.range;
      const end=point(a,92),label=labels[i].xy,goal=target[axis.id];
      const goalEnds=goal&&!completeScale(axis,goal)?[...point(a,92*fraction(axis,goal.min)),...point(a,92*fraction(axis,goal.max))]:null;
      const lines=words(axis.name),anchor=Math.cos(a)>.25?'start':Math.cos(a)<-.25?'end':'middle';
      return <g key={axis.id} data-axis={axis.id} data-scale-min={axis.scale.min} data-scale-max={axis.scale.max}>
        <title>{axis.name} · échelle {hopRangeLabel(axis.scale)} · {r&&!completeScale(axis,r)?'simulation '+hopRangeLabel(r)+', confiance '+HOP_CONFIDENCE_LABELS[estimate.confidence]:'simulation indéterminée'}{baseline?' · conservé : '+(before&&!completeScale(axis,before)?hopRangeLabel(before):'indéterminé'):''}</title>
        <line x1="220" y1="190" x2={end[0]} y2={end[1]} stroke="currentColor" className="text-cave-700" strokeDasharray={center?undefined:'2 5'}/>
        {goalEnds&&<line data-aroma-goal x1={goalEnds[0]} y1={goalEnds[1]} x2={goalEnds[2]} y2={goalEnds[3]} stroke="currentColor" className="text-ebc-straw" strokeWidth="3" strokeLinecap="round"/>}
        {previous[i]&&<circle data-aroma-baseline cx={previous[i]![0]} cy={previous[i]![1]} r="4" fill="#1A1613" stroke="currentColor" className="text-cave-400" strokeWidth="2"/>}
        {center&&<circle data-aroma-point cx={center[0]} cy={center[1]} r="4" fill="currentColor" className="text-hop"/>}
        <text x={label[0]} y={label[1]-(lines.length-1)*11} textAnchor={anchor} dominantBaseline="middle" fill="currentColor" className={center?'text-cave-200':'text-cave-400'} fontSize="20">
          {lines.map((line,j)=><tspan key={j} x={label[0]} dy={j?22:0}>{line}</tspan>)}
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
  const informative = (a: HopAxis) => !!prediction.profile[a.id]?.range && !unresolvedAromaRange(a, prediction.profile[a.id].range);
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
  const showRadar = radarAxes.some(a=>aromaPlotValue(a,prediction.profile[a.id])!==undefined||aromaPlotValue(a,baseline?.profile[a.id])!==undefined);
  const row = (axis: HopAxis) => {
    const estimate = prediction.profile[axis.id], r = estimate?.range, full = completeScale(axis, r), unresolved=unresolvedAromaRange(axis,r), central=aromaPlotValue(axis,estimate);
    const start = (n: number) => fraction(axis, n) * 100, before = baseline?.profile[axis.id]?.range;
    return <div key={axis.id} role="group" aria-label={`Estimation · ${axis.name}`} className="py-2 border-b border-cave-800 last:border-0">
      <div className="flex items-start justify-between gap-3 text-sm"><span className="font-medium text-cave-200">{axis.name}</span><span className="text-right text-cave-200">{full ? 'Intensité indéterminée' : !r ? 'Non quantifiable' : unresolved ? 'Intensité peu précise' : hopIntensityLabel(estimate, axis)}</span></div>
      {(r||before||target[axis.id])&&<div className="aroma-range-track" aria-hidden="true">
        {target[axis.id]&&<span className="aroma-goal-range" style={{left:start(target[axis.id].min)+'%',width:start(target[axis.id].max)-start(target[axis.id].min)+'%'}}/>}
        {before&&!completeScale(axis,before)&&<span data-aroma-baseline className="aroma-interval aroma-interval-baseline" style={{left:start(before.min)+'%',width:start(before.max)-start(before.min)+'%'}}/>}
        {r&&<span data-aroma-range data-aroma-unresolved={unresolved} className={'aroma-interval '+(unresolved?'aroma-interval-unresolved':'')} style={{left:start(r.min)+'%',width:start(r.max)-start(r.min)+'%'}}/>}
        {central!==undefined&&<span data-testid="aroma-central-marker" className="aroma-point" style={{left:start(central)+'%'}}/>}
      </div>}
      <div className="flex flex-wrap justify-between gap-x-2 text-xs text-cave-400"><span>{r ? `Plage ${hopRangeLabel(r)}` : 'Plage inconnue'}</span><span>Confiance {HOP_CONFIDENCE_LABELS[estimate?.confidence ?? 'low']}</span></div>
      <p className="text-xs text-cave-400">Échelle {hopRangeLabel(axis.scale)}{baseline && <span className="block" data-aroma-baseline-label>Conservé : {before && !completeScale(axis, before) ? `${hopRangeLabel(before)} · confiance ${HOP_CONFIDENCE_LABELS[baseline.profile[axis.id].confidence]}` : 'intensité indéterminée'}</span>}</p>
      {!!descriptors[axis.id].length && <details className="text-xs text-cave-300"><summary className="cursor-pointer py-2 text-water">Descripteur documenté pour {variety!.name}</summary><p className="mb-2">Description du houblon ; l’intensité dans cette bière est évaluée séparément.</p>{descriptors[axis.id].map((d, i) => <div key={i} className="mb-2"><p>{d.text}</p><HopSourceLink source={d.source} /></div>)}</details>}
      <details className="text-xs text-cave-400"><summary className="cursor-pointer py-2">Sources et portée de l’estimation</summary>{unresolved && r && <p>{full?'Toute l’échelle reste possible.':'La plage traverse les classes faible, moyenne et forte.'} Aucun profil précis n’en est dessiné.</p>}{estimate?.reasons.map((reason, i) => <p key={i}>{reason}</p>)}{estimate?.sources.map((source, i) => <div key={i} className="mt-1"><HopSourceLink source={source} /></div>)}</details>
    </div>;
  };
  return <figure className="space-y-2" aria-label="Graphe de la prédiction expérimentale">
    <figcaption className="font-semibold text-base text-cave-50">{title}</figcaption>
    {showRadar?<div><HopAromaRadar prediction={prediction} axes={radarAxes} target={target} baseline={baseline}/><p className="text-xs text-cave-400 text-center">Axes normalisés à leur échelle ; sans point, intensité non précisée.</p></div>:
      <p className="text-sm text-cave-400 py-3 border-l-2 border-cave-700 pl-3">Les données ne permettent pas encore de dessiner un profil d’intensité. Les plages disponibles restent consultables ci-dessous.</p>}
    {!!visible.length&&<><p className="text-xs text-cave-400" aria-label="Légende du radar">Trait : plage possible · point vert : repère du modèle{baseline&&<span> · Trait inférieur : comparaison conservée</span>}{Object.keys(target).length>0&&<span> · Doré : objectif</span>}</p><div className="min-w-0">{visible.map(row)}</div></>}
    {!showAll && documentaryEvidence.length > 0 && <details className="text-sm text-cave-300"><summary className="cursor-pointer min-h-touch text-water">Repères documentés de {variety!.name}</summary><div className="pb-3 space-y-2"><p>{documentaryAxes.map(a => a.name).join(', ')}.</p><p className="text-xs text-cave-400">Descriptions de la variété ; l’intensité dans cette bière est évaluée séparément.</p>{documentaryEvidence.map((d, i) => <div key={i}><p>{d.text}</p><HopSourceLink source={d.source} /></div>)}</div></details>}
    {!showAll && other.length > 0 && <details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Autres familles · {other.length} à examiner</summary>{other.map(row)}</details>}
  </figure>;
}
