import type { IonBand, WaterIons } from '../../types';
import { CA_DIVISOR, MG_DIVISOR } from './ions';

export interface BicarbonatePreferenceInput {
  range: IonBand;
  mash: Pick<WaterIons, 'ca' | 'mg'>;
  mashL: number;
  spargeL: number;
  spargeHco3: number;
  /** Upper mash RA supported by the grist estimate, or its colour fallback. */
  mashRaCeiling?: number | null;
  /** Mash RA corresponding to the grist's preferred pH, not a new hard bound. */
  mashRaTarget?: number | null;
  /** A pale colour alone does not justify compensating calcium with alkali. */
  allowAlkaliPreference?: boolean;
  /** Source waters after a retained positive mash acid dose, before salts. */
  sourceAfterManualAcid?: number;
}

/** Bicarbonate follows the mash's alkalinity need, not a point on a style band.
 * Convert on the mash first, then mix with the separately treated sparge.
 * This limits a soft preference; it never changes the selected profile bounds.
 */
export function bicarbonatePreference(input: BicarbonatePreferenceInput) {
  const { range, mashL, spargeL } = input;
  const totalL = mashL + spargeL;
  const known = Number.isFinite(input.mashRaCeiling) && mashL > 0 && totalL > 0;
  const mashLimit = known ? Math.max(0, (input.mashRaCeiling!
    + input.mash.ca / CA_DIVISOR + input.mash.mg / MG_DIVISOR) * 61 / 50) : 0;
  const totalLimit = known
    ? (mashLimit * mashL + Math.max(0, input.spargeHco3) * spargeL) / totalL : range.min;
  const wantedRa = Number.isFinite(input.mashRaTarget) ? Math.min(input.mashRaTarget!, input.mashRaCeiling!) : input.mashRaCeiling!;
  const mashTarget = known ? Math.max(0, (wantedRa
    + input.mash.ca / CA_DIVISOR + input.mash.mg / MG_DIVISOR) * 61 / 50) : 0;
  const totalTarget = known
    ? (mashTarget * mashL + Math.max(0, input.spargeHco3) * spargeL) / totalL : range.min;
  // Bicarbonate adjusts alkalinity. The grist can justify less OR more than
  // the style's middle-low point; centring it has no benefit of its own.
  let value = input.allowAlkaliPreference === false ? range.min
    : Math.max(range.min, Math.min(range.max, totalTarget));
  let reason: 'mash' | 'profile-conflict' | 'missing-grist' | 'manual-acid' =
    !known ? 'missing-grist' : totalLimit < range.min ? 'profile-conflict'
      : 'mash';
  // A manual acid is a retained decision, not an invitation to buy additional
  // alkali just to centre the graph. Compensate only the compulsory floor.
  if (Number.isFinite(input.sourceAfterManualAcid)) {
    const ceiling = Math.max(range.min, input.sourceAfterManualAcid!);
    if (value > ceiling) {
      value = ceiling;
      reason = 'manual-acid';
    }
  }
  return { value, reason, mashLimit: known ? mashLimit : undefined, totalLimit: known ? totalLimit : undefined };
}
