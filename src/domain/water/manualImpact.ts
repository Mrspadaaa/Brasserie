import type { IonBand, SaltId, WaterIons } from '../../types';
import type { calculateWaterTreatment } from './treatment';
import type { estimateMashPh } from './mashPh';
import { SALTS } from './substances';
import { assessWaterProfile, PROFILE_IONS } from './profileAssessment';
import { round1 } from './ions';

type Treatment = ReturnType<typeof calculateWaterTreatment>;
type PhEstimate = ReturnType<typeof estimateMashPh>;
export type ManualWaterEdit =
  | { kind: 'salt'; id: SaltId; from: number; to: number }
  | { kind: 'acid'; side: 'mash' | 'sparge'; from: number; to: number };

/** Compare the complete retained treatments: an automatic acid adjustment is
 * part of a salt edit's effect too. This is a before/after comparison, not a
 * comparison with a different hypothetical recipe or a new solver proposal.
 */
export function manualWaterImpact(input: {
  edit: ManualWaterEdit;
  before: Treatment;
  after: Treatment;
  beforePh: PhEstimate;
  afterPh: PhEstimate;
  ranges: Record<keyof WaterIons, IonBand>;
  targeted?: ReadonlyArray<keyof WaterIons>;
  totalWaterL: number;
}) {
  const { before, after, edit } = input;
  const ions = PROFILE_IONS.flatMap(ion => {
    const from = before.treatedTotal[ion], to = after.treatedTotal[ion];
    const delta = round1(to - from);
    return delta !== 0 ? [{ ion, from, to, delta }] : [];
  });
  const ratio = (water: WaterIons) => water.cl > 0 ? water.so4 / water.cl : null;
  const share = (water: WaterIons) => water.so4 + water.cl > 0 ? water.so4 / (water.so4 + water.cl) : null;
  const shareBefore = share(before.treatedTotal), shareAfter = share(after.treatedTotal);
  const shift = shareBefore != null && shareAfter != null ? shareAfter - shareBefore : 0;
  const beforeProfile = assessWaterProfile(before.treatedTotal, input.ranges, input.targeted);
  const afterProfile = assessWaterProfile(after.treatedTotal, input.ranges, input.targeted);
  const newlyOutside = afterProfile.deviations.filter(item => !beforeProfile.deviations.some(old => old.ion === item.ion));
  const restored = beforeProfile.deviations.filter(item => !afterProfile.deviations.some(next => next.ion === item.ion));
  const acids = (['mash', 'sparge'] as const).flatMap(side => {
    const from = side === 'mash' ? before.mashAcid.amount : before.spargeAcid.amount;
    const to = side === 'mash' ? after.mashAcid.amount : after.spargeAcid.amount;
    return Math.abs(to - from) >= 0.05 ? [{ side, from, to, unit: after.mashAcid.unit,
      automatic: edit.kind !== 'acid' || edit.side !== side }] : [];
  });
  const untracked = edit.kind === 'salt' ? SALTS[edit.id].untracked : undefined;
  return {
    edit, unit: edit.kind === 'salt' ? 'g' : after.mashAcid.unit,
    ions, acids, beforeProfile, afterProfile, newlyOutside, restored,
    ratio: { from: ratio(before.treatedTotal), to: ratio(after.treatedTotal) },
    direction: Math.abs(shift) < 0.001 ? 'unchanged' as const : shift > 0 ? 'drier' as const : 'rounder' as const,
    weakBalance: after.treatedTotal.cl < 25 && after.treatedTotal.so4 < 25,
    ph: input.beforePh.known && input.afterPh.known
      ? { from: input.beforePh.phPredicted, to: input.afterPh.phPredicted, limited: !!input.afterPh.limited } : null,
    stageHco3: (['mash', 'sparge'] as const).map(side => ({ side,
      from: before.treated[side].hco3, to: after.treated[side].hco3 })),
    untracked: untracked && input.totalWaterL > 0
      ? { label: untracked.label, delta: round1((edit.to - edit.from) * untracked.ppmPerGramPerLitre / input.totalWaterL) } : null,
  };
}

export type ManualWaterImpact = ReturnType<typeof manualWaterImpact>;
