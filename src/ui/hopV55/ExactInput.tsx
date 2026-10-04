import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../Input';
import { formatDecimal, parseDecimal } from '../numericInput';

/** Invalid and missing drafts remain missing; they never keep a hidden old dose. */
export function HopV55ExactInput({ label, value, onValue, unit, min, max, required = false }: {
  label: string; value: number | undefined; onValue(value: number | undefined): void;
  unit?: string; min?: number; max?: number; required?: boolean;
}) {
  const [draft, setDraft] = useState(() => formatDecimal(value));
  const emitted = useRef(value);
  useEffect(() => { if (!Object.is(value, emitted.current)) { emitted.current = value; setDraft(formatDecimal(value)); } }, [value]);
  const number = parseDecimal(draft);
  const invalid = draft.trim() !== '' && (number === null || min !== undefined && number < min || max !== undefined && number > max);
  return <label className="hv-field"><span>{label}{unit ? ` · ${unit}` : ''}</span>
    <Input type="text" inputMode="decimal" value={draft} aria-label={label} aria-invalid={invalid || undefined}
      required={required} placeholder={required ? 'À préciser' : 'Inconnu'} onChange={event => {
        const next = event.target.value;
        setDraft(next);
        const n = parseDecimal(next);
        const accepted = n !== null && (min === undefined || n >= min) && (max === undefined || n <= max) ? n : undefined;
        emitted.current = accepted; onValue(accepted);
      }} />
    {invalid ? <small role="alert">Valeur illisible ou hors des bornes{min !== undefined ? ` ≥ ${formatDecimal(min)}` : ''}{max !== undefined ? ` ≤ ${formatDecimal(max)}` : ''}.</small> : null}
  </label>;
}
