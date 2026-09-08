import { HopAxis, HopEstimate, HopTiming } from '../../../functions/src/hopPredictionSchema';
import { HopRange } from '../../../functions/src/hopIndexSchema';
export const HOP_TIMING_LABELS: Record<HopTiming, string> = { firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool', fermentation: 'Pendant la fermentation', postFermentation: 'Après la fermentation' };
export const HOP_CONFIDENCE_LABELS = { low: 'faible', medium: 'moyenne', high: 'élevée' };
export function hopRangeLabel(range: HopRange | null) {
  if (!range) return 'Non quantifiable';
  // Outward rounding preserves the interval visible to the user.
  return `${(Math.floor(range.min * 10) / 10).toLocaleString('fr-CH')}–${(Math.ceil(range.max * 10) / 10).toLocaleString('fr-CH')}`;
}
export function hopIntensityLabel(estimate: HopEstimate | undefined, axis: HopAxis) {
  if (!estimate?.range) return 'Inconnue';
  const classify = (n: number) => n <= axis.lowMax ? 'faible' : n <= axis.mediumMax ? 'moyenne' : 'forte';
  const lo = classify(estimate.range.min), hi = classify(estimate.range.max);
  return lo === hi ? lo : `${lo} à ${hi}`;
}
