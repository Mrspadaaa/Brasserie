/** Presentation only: raw quantities and calculation inputs are never rounded here. */
export function hopV55DoseReading(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '?';
  if (value === 0) return '0';
  return value.toLocaleString('fr-CH', Math.abs(value) < 0.001
    ? { notation: 'scientific', maximumFractionDigits: 2 }
    : { maximumFractionDigits: 3 });
}

/** Smallest fraction p/q (q ≤ 10⁶) whose JS quotient is exactly this value, or null. */
function exactFraction(value: number): [number, number] | null {
  let [h0, h1, k0, k1, x] = [0, 1, 1, 0, value];
  for (let step = 0; step < 40; step += 1) {
    const a = Math.floor(x);
    const [h, k] = [a * h1 + h0, a * k1 + k0];
    if (k > 1e6) return null;
    if (h / k === value) return [h, k];
    [h0, h1, k0, k1] = [h1, h, k1, k];
    if (x === a) return null;
    x = 1 / (x - a);
  }
  return null;
}

const decimals = (value: number) => value.toString().split('.')[1]?.length ?? 0;
const fullDigits = (value: number) => value.toString().replace('.', ',');

/**
 * All significant digits of the actual JS calculation remain available in its disclosure.
 * Decision 34c: a long decimal with an exact small fraction reads « p/q ≈ rounded »; others are unchanged.
 * The rounding is the dose reading used everywhere else (#75: one rule, at most 3 decimals).
 */
export function hopV55ExactReading(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '?';
  if (value.toString().includes('e') || decimals(value) <= 6) return fullDigits(value);
  const fraction = exactFraction(value);
  return fraction ? `${fraction[0]}/${fraction[1]} ≈ ${hopV55DoseReading(value)}` : fullDigits(value);
}

/**
 * #75, decision 34c — the single V5.5 dose and ratio text: at most 3 decimals, then, when that rounding hides digits,
 * the complete value: a short decimal as is, else its exact fraction, else every JS digit. Number and unit never split.
 */
export function hopV55DoseText(value: number | null | undefined, unit = 'g/L'): string {
  if (value == null || !Number.isFinite(value)) return 'dose inconnue';
  const rounded = `${hopV55DoseReading(value)}\u00a0${unit}`;
  if (value.toString().includes('e') || decimals(value) <= 3) return rounded;
  const fraction = decimals(value) <= 6 ? null : exactFraction(value);
  return `${rounded} (${fraction ? `${fraction[0]}/${fraction[1]}` : fullDigits(value)}\u00a0${unit} exacts)`;
}
