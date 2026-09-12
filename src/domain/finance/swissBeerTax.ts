import type { Batch } from '../../types';
import { isoDate } from './ledger';

export const BEER_TAX_SOURCE = 'https://www.bazg.admin.ch/dam/fr/sd-web/Ls9uMLNtgql4/Imp%C3%B4t%20sur%20la%20bi%C3%A8re%20directives%20brasseries%20indig%C3%A8nes.pdf';
export function beerTaxBracket(plato: number): number { return plato <= 10 ? 16.88 : plato <= 14 ? 25.32 : 33.76; }
/** Packaged beer is a planning proxy only. Liability requires release/onsite-consumption records. */
export function estimateSwissBeerTax(batches: Batch[], options?: {
  annualReductionPct?: number; reductionYear?: number; year?: number; selectedMonthYear?: string;
  /** Legacy options are accepted for compatibility, but never mistaken for the official tariff. */
  ratePerHl?: number; maxSmallBrewerHl?: number; reliefTiersHl?: Array<{ upToHl: number; reductionPct: number }>;
}) {
  const year = options?.year ?? new Date().getFullYear();
  const confirmed = Number.isFinite(options?.annualReductionPct) && options!.annualReductionPct! >= 0 && options!.annualReductionPct! <= 40 && options?.reductionYear === year;
  const reductionPct = confirmed ? options!.annualReductionPct! : 0;
  const multiplier = 1 - reductionPct / 100;
  const eligible = batches.filter(batch => {
    if (batch.status === 'annule' || !(Number(batch.volumePackagedL) > 0)) return false;
    const date = isoDate(batch.bottlingDate || batch.brewDate);
    if (options?.year && (!date || Number(date.slice(0, 4)) !== options.year)) return false;
    return !options?.selectedMonthYear || !!date && `${date.slice(5, 7)}.${date.slice(0, 4)}` === options.selectedMonthYear;
  });
  let totalVolumeL = 0, low = 0, high = 0, full = 0, missingPlatoCount = 0;
  for (const batch of eligible) {
    const volume = Number(batch.volumePackagedL), abv = batch.abv == null || batch.abv === '' ? null : Number(String(batch.abv).replace(',', '.'));
    totalVolumeL += volume;
    if (abv != null && Number.isFinite(abv) && abv >= 0 && abv <= 0.5) continue;
    const sg = Number(String(batch.og ?? '').replace(',', '.'));
    const plato = sg >= 1 && sg < 1.3 ? Math.round((-616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg) * 10) / 10 : null;
    if (plato == null) missingPlatoCount++;
    const min = plato == null ? 16.88 : beerTaxBracket(plato), max = plato == null ? 33.76 : min;
    low += volume / 100 * min * multiplier; high += volume / 100 * max * multiplier; full += volume / 100 * max;
  }
  totalVolumeL = Math.round(totalVolumeL * 100) / 100;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { totalVolumeL, totalHectoliters: totalVolumeL / 100, ratePerHl: totalVolumeL ? round(high * 100 / totalVolumeL) : 25.32 * multiplier,
    fullRatePerHl: totalVolumeL ? round(full * 100 / totalVolumeL) : 25.32, reductionPct, reductionConfirmed: confirmed,
    taxDueCHF: round(high), estimateLowCHF: round(low), estimateHighCHF: round(high), missingPlatoCount,
    batchesCount: eligible.length, isSmallBrewerRate: confirmed && reductionPct > 0, estimateOnly: true as const,
    warning: 'Réserve indicative sur la bière conditionnée. Les sorties et consommations sur place déterminent l’impôt dû ; elles ne sont pas encore suivies dans ce calcul.' };
}
