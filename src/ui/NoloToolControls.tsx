import React, { useEffect, useId, useRef, useState } from 'react';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import { NumberInput } from './NumberInput';

export const noloNumber = (value: number, digits = 2) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
export const noloToolRange = (range: HopRange | null | undefined) => range
  ? `${noloNumber(Math.floor(range.min * 1000) / 1000, 3)}–${noloNumber(Math.ceil(range.max * 1000) / 1000, 3)} %`
  : 'À déterminer';

export function ToolNumber({ label, unit, value, onChange, hint, shortLabel }: {
  label: string; unit?: string; value: number | null | undefined; onChange: (value: number | null) => void; hint?: string; shortLabel?: string;
}) {
  const id = useId();
  return <div className="nolo-field"><label htmlFor={id}>{shortLabel ?? label}{unit && <span> · {unit}</span>}</label>
    <NumberInput id={id} aria-label={shortLabel ? label : undefined} value={value == null ? undefined : Number(value.toPrecision(12))} emptyValue={undefined} onValue={n => onChange(n ?? null)} className="nolo-input" placeholder="À renseigner" aria-describedby={hint ? `${id}-hint` : undefined}/>
    {hint && <p id={`${id}-hint`} className="nolo-note">{hint}</p>}
  </div>;
}

export function ToolRange({ label, value, onChange, unit = '%', onInvalidChange }: {
  label: string; value: HopRange | null | undefined; onChange: (value: HopRange | null) => void; unit?: string; onInvalidChange?: (invalid: boolean) => void;
}) {
  const [min, setMin] = useState<number | null>(value?.min ?? null);
  const [max, setMax] = useState<number | null>(value?.max ?? null);
  const emitted = useRef(JSON.stringify(value ?? null));
  useEffect(() => {
    const next = JSON.stringify(value ?? null);
    if (next !== emitted.current) { setMin(value?.min ?? null); setMax(value?.max ?? null); }
    emitted.current = next;
  }, [value?.min, value?.max]);
  const update = (a: number | null, b: number | null) => {
    setMin(a); setMax(b);
    onInvalidChange?.((a !== null && a < 0) || (b !== null && b < 0) || (a !== null && b !== null && a > b));
    const next = a !== null && b !== null && a <= b && a >= 0 ? { min: a, max: b } : null;
    emitted.current = JSON.stringify(next); onChange(next);
  };
  return <fieldset className="nolo-range"><legend>{label} · {unit}</legend><div className="nolo-grid">
    <ToolNumber label={`${label} minimum`} shortLabel="Minimum" value={min} onChange={n => update(n, max)}/>
    <ToolNumber label={`${label} maximum`} shortLabel="Maximum" value={max} onChange={n => update(min, n)}/>
  </div>{min !== null && max !== null && min > max && <p role="alert" className="nolo-error">Le minimum dépasse le maximum. Corrige la plage.</p>}{((min !== null && min < 0) || (max !== null && max < 0)) && <p role="alert" className="nolo-error">La plage doit être positive ou nulle.</p>}</fieldset>;
}

export function ToolComparison({ before, after, target, beforeLabel = 'Actuel', afterLabel = 'Avec ce réglage', valuesOnly = false }: {
  before: HopRange | null; after: HopRange | null; target: number; beforeLabel?: string; afterLabel?: string; valuesOnly?: boolean;
}) {
  const top = Math.max(target * 1.3, before?.max ?? 0, after?.max ?? 0, .1);
  const x = (v: number) => 12 + v / top * 336;
  return <figure className="nolo-comparison" aria-label="Comparaison de l’alcool avant et après">
    <dl className="nolo-grid"><div><dt>{beforeLabel}</dt><dd>{noloToolRange(before)}</dd></div><div><dt>{afterLabel}</dt><dd>{noloToolRange(after)}</dd></div></dl>
    {!valuesOnly && (before || after) && <svg viewBox="0 0 360 64" role="img" aria-label={`Plages d’alcool : ${beforeLabel} ${noloToolRange(before)}, ${afterLabel} ${noloToolRange(after)}, cible ${noloNumber(target)} %`}>
      <line x1="12" y1="20" x2="348" y2="20" className="nolo-track"/><line x1="12" y1="42" x2="348" y2="42" className="nolo-track"/>
      {[before, after].map((r, i) => r && <g key={i} className={i ? 'nolo-after' : 'nolo-before'}><line x1={x(r.min)} x2={x(r.max)} y1={20 + i * 22} y2={20 + i * 22} strokeWidth="5"/><circle cx={x(r.min)} cy={20 + i * 22} r="3"/><circle cx={x(r.max)} cy={20 + i * 22} r="3"/></g>)}
      <line x1={x(target)} x2={x(target)} y1="8" y2="50" className="nolo-target" strokeDasharray="3 3"/>
      <text x="12" y="62">0 %</text><text x="348" y="62" textAnchor="end">{noloNumber(top)} %</text>
    </svg>}
    {!valuesOnly && <figcaption>Cible ≤ {noloNumber(target)} % vol.{(before || after) && ' · trait pointillé'}</figcaption>}
  </figure>;
}

export function NoloSensitivityChart({ points, target, selectedX, label, xLabel, digits = 2 }: {
  points: { x: number; abvPct: HopRange }[]; target: number; selectedX?: number | null; label: string; xLabel: string; digits?: number;
}) {
  if (points.length < 2) return null;
  const left = points[0].x, right = points[points.length - 1].x;
  const top = Math.max(target * 1.25, ...points.map(p => p.abvPct.max), .1);
  const x = (v: number) => 38 + (v - left) / (right - left || 1) * 310;
  const y = (v: number) => 102 - v / top * 78;
  const path = (bound: 'min' | 'max') => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(2)},${y(p.abvPct[bound]).toFixed(2)}`).join(' ');
  const area = `${path('max')} ${[...points].reverse().map(p => `L${x(p.x).toFixed(2)},${y(p.abvPct.min).toFixed(2)}`).join(' ')} Z`;
  const tableRows = [...new Map(points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 5)) === 0 || i === points.length - 1)
    .map(p => [`${noloNumber(p.x, digits)}|${noloToolRange(p.abvPct)}`, p])).values()];
  return <figure className="nolo-sensitivity" aria-label={label}>
    <svg viewBox="0 0 360 132" role="img" aria-label={`${label}. Bande entre les deux hypothèses, cible ${noloNumber(target)} % vol.`}>
      <text x="38" y="15">Alcool · % vol.</text><line x1="38" x2="348" y1="102" y2="102" className="nolo-track"/>
      <path d={area} className="nolo-area"/><path d={path('min')} className="nolo-curve"/><path d={path('max')} className="nolo-curve"/>
      <line x1="38" x2="348" y1={y(target)} y2={y(target)} className="nolo-target" strokeDasharray="4 3"/>
      {target > 0 && <text x="30" y={y(target) + 4} textAnchor="end">{noloNumber(target)}</text>}<text x="30" y="106" textAnchor="end">0</text>
      {selectedX != null && selectedX >= left && selectedX <= right && <line x1={x(selectedX)} x2={x(selectedX)} y1="24" y2="102" className="nolo-before" strokeDasharray="2 3"/>}
      <text x="38" y="123">{noloNumber(left, digits)}</text><text x="200" y="123" textAnchor="middle">{xLabel}</text><text x="348" y="123" textAnchor="end">{noloNumber(right, digits)}</text>
    </svg>
    <details><summary>Valeurs de la courbe</summary><table className="nolo-table"><thead><tr><th>{xLabel}</th><th>Alcool sous hypothèses</th></tr></thead><tbody>{tableRows.map(p => <tr key={p.x}><td>{noloNumber(p.x, digits)}</td><td>{noloToolRange(p.abvPct)}</td></tr>)}</tbody></table></details>
  </figure>;
}
