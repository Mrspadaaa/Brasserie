import { HopAxis, HopEstimate, HopTiming } from '../../../functions/src/hopPredictionSchema';
import { HopRange } from '../../../functions/src/hopIndexSchema';
export const HOP_TIMING_LABELS: Record<HopTiming, string> = { firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool', fermentation: 'Pendant la fermentation', postFermentation: 'Après la fermentation' };
export const HOP_CONFIDENCE_LABELS = { low: 'faible', medium: 'moyenne', high: 'élevée' };
const finite = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);
function formatHopNumber(value: number) {
  // Keep small nonzero doses visible instead of rounding them to an apparent zero.
  return value.toLocaleString('fr-FR', value !== 0 && Math.abs(value) < 0.01
    ? { maximumSignificantDigits: 2 }
    : { maximumFractionDigits: 2 });
}
export function hopDoseLabel(value: number | null | undefined) {
  return finite(value) && value >= 0 ? `${formatHopNumber(value)} g/L` : 'Dose non précisée';
}
export function hopTemperatureLabel(value: number | null | undefined) {
  return finite(value) ? `${formatHopNumber(value)} °C` : 'Température non précisée';
}
export function hopDurationLabel(hours: number | null | undefined) {
  if (!finite(hours) || hours < 0) return 'Durée non précisée';
  const totalMinutes = Math.round(hours * 60);
  if (hours > 0 && totalMinutes < 1) return '< 1 min';
  if (!totalMinutes) return '0 min';
  const days = Math.floor(totalMinutes / 1440), remainingHours = Math.floor(totalMinutes % 1440 / 60), minutes = totalMinutes % 60;
  return [days ? `${days} j` : '', remainingHours ? `${remainingHours} h` : '', minutes ? `${minutes} min` : ''].filter(Boolean).join(' ');
}
export function hopRangeLabel(range: HopRange | null) {
  if (!range) return 'Non quantifiable';
  // Outward rounding preserves the interval visible to the user.
  return `${(Math.floor(range.min * 10) / 10).toLocaleString('fr-FR')}–${(Math.ceil(range.max * 10) / 10).toLocaleString('fr-FR')}`;
}
export function hopIntensityLabel(estimate: HopEstimate | undefined, axis: HopAxis) {
  if (!estimate?.range) return 'Inconnue';
  const classify = (n: number) => n <= axis.lowMax ? 'faible' : n <= axis.mediumMax ? 'moyenne' : 'forte';
  const lo = classify(estimate.range.min), hi = classify(estimate.range.max);
  return lo === hi ? lo : `${lo} à ${hi}`;
}
