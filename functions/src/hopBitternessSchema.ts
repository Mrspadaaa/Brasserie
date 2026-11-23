import { hopSourceError, validHopRange, type HopRange, type HopSource } from './hopIndexSchema.js';

export interface HopBitternessScience {
  id: string; kind: 'bitternessScience'; name: string; version: string; enabled: boolean; source: HopSource;
  /** Explicit what-if lot assumptions, never a population confidence interval. */
  humulinonesPct: { range: HopRange; source: HopSource; limitation: string };
  relativeBitterness: { value: number; source: HopSource };
  experiments: {
    id: string; name: string; temperatureC: number; contactHours: number; source: HopSource;
    points: { doseLbBbl: number; isoBeforeMgL: number; isoAfterMgL: number; recovery: number }[];
  }[];
}

export function assertHopBitternessScience(v: any): asserts v is HopBitternessScience {
  const check = (ok: unknown, message: string) => { if (!ok) throw Error(message); };
  const source = (s: unknown) => check(!hopSourceError(s, true), 'Source datée obligatoire pour l’amertume.');
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  const unit = (n: unknown) => finite(n) && (n as number) >= 0 && (n as number) <= 1;
  check(v && v.kind === 'bitternessScience' && typeof v.id === 'string' && v.id && typeof v.name === 'string' && v.name && typeof v.version === 'string' && v.version && typeof v.enabled === 'boolean', 'Révision d’amertume invalide.');
  source(v.source);
  check(validHopRange(v.humulinonesPct?.range) && v.humulinonesPct.range.min >= 0 && v.humulinonesPct.range.max <= 100 && v.humulinonesPct.limitation?.trim(), 'Hypothèses de composition invalides.');
  source(v.humulinonesPct.source);
  check(unit(v.relativeBitterness?.value), 'Amertume relative invalide.'); source(v.relativeBitterness.source);
  check(Array.isArray(v.experiments) && v.experiments.length > 0 && v.experiments.length <= 100, 'Essais d’amertume absents.');
  const ids = new Set();
  for (const experiment of v.experiments) {
    check(typeof experiment.id === 'string' && experiment.id && !ids.has(experiment.id) && experiment.name?.trim(), 'Identité d’essai invalide.'); ids.add(experiment.id);
    source(experiment.source);
    check(finite(experiment.temperatureC) && finite(experiment.contactHours) && experiment.contactHours > 0, 'Conditions d’essai absentes.');
    check(Array.isArray(experiment.points) && experiment.points.length >= 2 && experiment.points.length <= 100, 'Courbe d’essai absente.');
    let last = -1;
    for (const p of experiment.points) {
      check(finite(p.doseLbBbl) && p.doseLbBbl > last && p.doseLbBbl > 0 && finite(p.isoBeforeMgL) && p.isoBeforeMgL > 0 && finite(p.isoAfterMgL) && p.isoAfterMgL >= 0 && p.isoAfterMgL <= p.isoBeforeMgL && unit(p.recovery), 'Point d’essai invalide.');
      last = p.doseLbBbl;
    }
  }
}
