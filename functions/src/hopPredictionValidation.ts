import { HopLot, HopVariety } from './hopIndexSchema.js';
import { predictHopTriplet } from './hopPredictionCore.js';
import { HopEstimate, HopPredictionSnapshot, assertHopPredictionSnapshotShape } from './hopPredictionSchema.js';

const stable = (value: unknown): string => JSON.stringify(value, (_key, item) =>
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const sameMembers = (left: unknown[], right: unknown[]) => stable(left.map(stable).sort()) === stable(right.map(stable).sort());
// Floating-point tolerance only: this is not an analytical or sensory margin.
const sameNumber = (left: number, right: number) => Math.abs(left - right) <=
  Math.max(64 * Number.MIN_VALUE, 64 * Number.EPSILON * Math.max(Math.abs(left), Math.abs(right)));

/** Replay from frozen evidence; legacy v1 stays immutable and is never recalculated. */
export function assertHopPredictionSnapshot(value: unknown, id?: string): asserts value is HopPredictionSnapshot {
  assertHopPredictionSnapshotShape(value, id);
  if (value.engineVersion === 'hop-envelope-v1') return;
  const actual = value.prediction;
  const expected = predictHopTriplet(actual.triplet, value.target, {
    varieties: value.evidence.varieties as HopVariety[], lots: value.evidence.lots as HopLot[], knowledge: value.evidence.knowledge
  });
  const check = (valid: boolean, detail: string) => { if (!valid) throw Error(`Instantané v2 incohérent avec ses données figées : ${detail}.`); };
  const estimate = (saved: HopEstimate, replayed: HopEstimate, name: string) => {
    check((saved.range === null) === (replayed.range === null), `${name}, quantification incompatible`);
    if (saved.range && replayed.range) check(sameNumber(saved.range.min, replayed.range.min) && sameNumber(saved.range.max, replayed.range.max), `${name}, plage différente du calcul`);
    check(saved.confidence === replayed.confidence, `${name}, confiance différente du calcul`);
    check((saved.central === undefined) === (replayed.central === undefined), `${name}, repère central incompatible`);
    if (saved.central !== undefined && replayed.central !== undefined) check(sameNumber(saved.central, replayed.central), `${name}, repère central différent du calcul`);
    check(sameMembers(saved.sources, replayed.sources), `${name}, provenance différente du calcul`);
  };
  for (const field of ['profile', 'compounds'] as const) {
    check(sameMembers(Object.keys(actual[field]), Object.keys(expected[field])), `${field}, sorties différentes`);
    for (const key of Object.keys(expected[field])) estimate(actual[field][key], expected[field][key], key);
  }
  estimate(actual.score, expected.score, 'score');
  check(sameMembers(actual.modelRefs, expected.modelRefs), 'références de modèles différentes');
  check(sameMembers(actual.extrapolatedAxes ?? [], expected.extrapolatedAxes ?? []), 'axes extrapolés différents');
  check(sameMembers(actual.risks, expected.risks), 'alertes différentes du calcul');
}
