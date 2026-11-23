import type { HopRange } from '../../functions/src/hopIndexSchema';

/** Decimal rounding directed outward, with a lossless fallback in older browsers. */
export function fermentationRangeLabel(range: HopRange, unit = '', digits = 1) {
  if (![range.min, range.max].every(Number.isFinite) || range.min > range.max) return 'Non quantifiable';
  const bound = (n: number, roundingMode: 'floor' | 'ceil') => {
    const options = { minimumFractionDigits: digits, maximumFractionDigits: digits, roundingMode };
    const format = new Intl.NumberFormat('fr-FR', options);
    return (format.resolvedOptions() as unknown as { roundingMode?: string }).roundingMode === roundingMode
      ? format.format(n) : n.toLocaleString('fr-FR', { maximumSignificantDigits: 21 });
  };
  return `${bound(range.min, 'floor')}–${bound(range.max, 'ceil')}${unit ? ' ' + unit : ''}`;
}
