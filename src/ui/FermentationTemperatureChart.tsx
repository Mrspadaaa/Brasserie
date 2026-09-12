import React, { useEffect, useRef, useState } from 'react';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { FermentationStep } from '../types';
const number = (n: number) => n.toLocaleString('fr-FR', { maximumSignificantDigits: 4 });

/** A programme of setpoints, not a growth curve. An unknown duration interrupts
 * the timeline; an unknown temperature leaves a gap without hiding other steps. */
export function FermentationTemperatureChart({ steps, bands = [], pitchTempC, compact = false }: { steps: FermentationStep[]; bands?: HopRange[]; pitchTempC?: number; compact?: boolean }) {
  const box = useRef<HTMLDivElement>(null), [width, setWidth] = useState(400);
  let elapsed: number | null = 0;
  const segments = steps.map((s, i) => {
    const start = elapsed;
    elapsed = start !== null && Number.isFinite(s.days) && s.days >= 0 && Number.isFinite(start + s.days) ? start + s.days : null;
    const b = bands[i], band = b && Number.isFinite(b.min) && Number.isFinite(b.max) && b.min <= b.max ? b : undefined;
    return { ...s, start, end: elapsed, band, index: i };
  });
  const placed = segments.filter(s => s.start !== null && s.end !== null);
  const total = placed.at(-1)?.end ?? 0;
  const known = placed.filter(s => Number.isFinite(s.tempC));
  const drawable = total > 0 && known.length > 0;
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setWidth(Math.max(200, entry.contentRect.width)); });
    observer.observe(box.current); return () => observer.disconnect();
  }, [drawable]);
  if (!drawable) return <p className="text-sm text-cave-400">Calendrier non positionnable : renseigne la durée et la température du premier palier.</p>;
  const temperatures = [...known.map(s => s.tempC), ...known.flatMap(s => s.band ? [s.band.min, s.band.max] : []), ...(Number.isFinite(pitchTempC) ? [pitchTempC!] : [])];
  const min = Math.floor(Math.min(...temperatures)) - 1, max = Math.ceil(Math.max(...temperatures)) + 1;
  const left = 42, right = width - 18, top = 20, bottom = compact ? 106 : 166;
  const x = (day: number) => left + day / total * (right - left), y = (temp: number) => bottom - (temp - min) / (max - min) * (bottom - top);
  return <figure aria-label="Calendrier des températures de fermentation" className="space-y-2" data-total-days={total} data-temp-min={min} data-temp-max={max}>
    <figcaption className="text-sm text-cave-200">Température de la bière · jours indicatifs</figcaption>
    <div ref={box} className="w-full min-w-0"><svg className="w-full" height={bottom + 39} viewBox={`0 0 ${width} ${bottom + 39}`} role="img" aria-label="Consignes de température en fonction des jours de fermentation">
      <title>Calendrier de consignes, à ajuster à la densité et à la dégustation</title>
      {[...new Set([0, 1, 2, 3].map(i => Math.round(min + (max - min) * i / 3)))].map(t => <g key={t}><line x1={left} x2={right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-cave-700" /><text x={left - 6} y={y(t) + 4} textAnchor="end" fill="currentColor" className="text-cave-400" fontSize="12">{number(t)}</text></g>)}
      {known.map(s => <g key={s.index} data-step={s.index} data-start={s.start} data-end={s.end} data-temp={s.tempC}>
        {s.band && (s.band.max === s.band.min ? <line x1={x(s.start!)} x2={x(s.end!)} y1={y(s.band.min)} y2={y(s.band.max)} className="text-ebc-straw/40" stroke="currentColor" /> : <rect data-band="temperature" x={x(s.start!)} width={x(s.end!) - x(s.start!)} y={y(s.band.max)} height={y(s.band.min) - y(s.band.max)} fill="currentColor" className="text-ebc-straw/20" />)}
        <line x1={x(s.end!)} x2={x(s.end!)} y1={top} y2={bottom} stroke="currentColor" className="text-cave-400" strokeDasharray="3 4" />
        {s.index > 0 && Number.isFinite(segments[s.index-1].tempC) && <line x1={x(s.start!)} x2={x(s.start!)} y1={y(segments[s.index-1].tempC)} y2={y(s.tempC)} stroke="currentColor" className="text-ebc-straw" strokeWidth="2" />}
        <line data-setpoint="true" x1={x(s.start!)} x2={x(s.end!)} y1={y(s.tempC)} y2={y(s.tempC)} stroke="currentColor" className="text-ebc-straw" strokeWidth="3" />
      </g>)}
      {Number.isFinite(pitchTempC) && <circle cx={x(0)} cy={y(pitchTempC!)} r="4" fill="currentColor" className="text-water" />}
      {[0, total / 2, total].map((day, i) => <text key={i} x={x(day)} y={bottom + 24} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fill="currentColor" className="text-cave-200" fontSize="12">J{number(day)}</text>)}
      <text x="3" y="12" fill="currentColor" className="text-cave-400" fontSize="12">°C</text>
    </svg></div>
    <p className="text-xs text-cave-400">Trait : consigne · bleu : ensemencement{bands.length > 0 ? ' · bande : plage proposée, confiance faible (non statistique).' : '.'}</p>
    {known.length < segments.length && <p role="status" className="text-xs text-ebc-straw">Calendrier partiel : les températures inconnues restent vides ; après une durée inconnue, les paliers ne sont pas positionnés.</p>}
  </figure>;
}
