import type { HopRange } from './hopIndexSchema.js';
import { assertHopBitternessScience, type HopBitternessScience } from './hopBitternessSchema.js';

// Exact definitions of lb and US beer barrel. These are units, not fitted coefficients.
const GRAMS_PER_LB = 453.59237, LITRES_PER_US_BEER_BARREL = 31 * 3.785411784;
export const dryHopDoseGL = (lbBbl: number) => lbBbl * GRAMS_PER_LB / LITRES_PER_US_BEER_BARREL;
export interface DryBitternessResult {
  status: 'conditional' | 'incomplete'; doseGL: number | null; finalEquivalent: HopRange | null;
  deltaEquivalent: HopRange | null; humulinonesMgL: HopRange | null;
  reasons: string[]; version: string | null;
  scenarios: { experimentId: string; retainedIso: number; recovery: number; finalEquivalent: HopRange; deltaEquivalent: HopRange }[];
}

/** A transposition of observed extraction/adsorption scenarios. This is an
 * iso-alpha-equivalent bitterness proxy, NEVER the spectrophotometric IBU test.
 * All additions share a treatment scenario and are combined BEFORE interpolation:
 * splitting a line cannot create extra extraction or independent uncertainties. */
export function dryHopBitterness(input: { grams: number | null; volumeL: number; hotIbu: HopRange | null; humulinonesPct?: HopRange }, science?: HopBitternessScience): DryBitternessResult {
  const result: DryBitternessResult = { status: 'incomplete', doseGL: null, finalEquivalent: null, deltaEquivalent: null, humulinonesMgL: null, reasons: [], version: science?.version ?? null, scenarios: [] };
  try { assertHopBitternessScience(science); if (!science.enabled) throw Error('disabled'); }
  catch { result.reasons.push('Référence d’amertume à cru absente, désactivée ou invalide.'); return result; }
  const rangeValid = (r?: HopRange | null) => !!r && Number.isFinite(r.min) && Number.isFinite(r.max) && r.min >= 0 && r.max >= r.min;
  if (input.grams == null || !Number.isFinite(input.grams) || input.grams < 0 || !Number.isFinite(input.volumeL) || input.volumeL <= 0) {
    result.reasons.push('Renseigner la masse à cru et le volume de bière.'); return result;
  }
  const dose = result.doseGL = input.grams / input.volumeL;
  if (!rangeValid(input.hotIbu)) { result.reasons.push('Compléter les ajouts à chaud pour estimer leur amertume restante après le dry hop.'); return result; }
  const hum = input.humulinonesPct ?? science.humulinonesPct.range;
  if (!rangeValid(hum) || hum.max > 100) { result.reasons.push('Plage d’humulinones invalide.'); return result; }
  const maxDose = Math.min(...science.experiments.map(e => dryHopDoseGL(e.points.at(-1)!.doseLbBbl)));
  if (dose > maxDose) { result.reasons.push(`Dose cumulée au-delà des essais (${maxDose.toFixed(2)} g/L). Aucun plafonnement caché ni extrapolation illimitée.`); return result; }
  const humOutputs: number[] = [];
  for (const experiment of science.experiments) {
    const points = [{ dose: 0, iso: 1, recovery: experiment.points[0].recovery }, ...experiment.points.map(p => ({ dose: dryHopDoseGL(p.doseLbBbl), iso: p.isoAfterMgL / p.isoBeforeMgL, recovery: p.recovery }))];
    const index = points.findIndex(p => p.dose >= dose);
    const low = points[Math.max(0, index - 1)], high = points[Math.max(0, index)];
    const t = high.dose === low.dose ? 0 : (dose - low.dose) / (high.dose - low.dose);
    const retainedIso = low.iso + t * (high.iso - low.iso), recovery = low.recovery + t * (high.recovery - low.recovery);
    // g/L × percent /100 ×1000 mg/g. The same scenario is used in both totals
    // and their difference; subtracting independent interval ends would double uncertainty.
    const humLow = dose * hum.min * 10 * recovery, humHigh = dose * hum.max * 10 * recovery;
    humOutputs.push(humLow, humHigh);
    result.scenarios.push({ experimentId: experiment.id, retainedIso, recovery,
      finalEquivalent: { min: input.hotIbu!.min * retainedIso + humLow * science.relativeBitterness.value, max: input.hotIbu!.max * retainedIso + humHigh * science.relativeBitterness.value },
      deltaEquivalent: { min: input.hotIbu!.max * (retainedIso - 1) + humLow * science.relativeBitterness.value, max: input.hotIbu!.min * (retainedIso - 1) + humHigh * science.relativeBitterness.value } });
  }
  const envelope = (key: 'finalEquivalent' | 'deltaEquivalent') => ({ min: Math.min(...result.scenarios.map(s => s[key].min)), max: Math.max(...result.scenarios.map(s => s[key].max)) });
  result.finalEquivalent = envelope('finalEquivalent'); result.deltaEquivalent = envelope('deltaEquivalent');
  result.humulinonesMgL = { min: Math.min(...humOutputs), max: Math.max(...humOutputs) };
  result.status = 'conditional';
  result.reasons.push('Scénarios de pellets Cascade/Centennial à 16 °C, 1–5 jours. Plage de scénarios, sans intervalle statistique ni validation pour un autre lot, une fermentation active ou une bière NOLO.');
  return result;
}
