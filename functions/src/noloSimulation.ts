import type { HopRange, HopSource } from './hopIndexSchema.js';
import type { NoloInput } from './noloCore.js';
import type { NoloSimulation } from './noloSchema.js';

export const noloSimulationSource: HopSource = {
  title: 'Simulation de recette NOLO : bilan et hypothèses de pilote', author: 'L’Affinée', year: 2026,
  kind: 'judgment', reference: 'docs/research/nolo-solver-model-2026-09-12.md',
  locator: 'Relation SG–atténuation, propagation des bornes saisies et objectifs inverses. Aucune couverture statistique calibrée.'
};
/** Stable across JSON import/export and object-property order. */
export function noloCanonical(value: unknown): string {
  const normalize = (v: any): any => Array.isArray(v) ? v.map(normalize) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,normalize(v[k])])) : v;
  return JSON.stringify(normalize(value));
}
type SimulationInput = NoloInput & { recipeContext?: string; og?: { range: HopRange; origin: string } };
/** Deliberately excludes later observations and target changes, which do not
 * alter the wort. All physical recipe/process inputs used by this model remain bound. */
export function noloSimulationBasis(input: SimulationInput): string {
  const json = (v: string | undefined) => { try { return v ? JSON.parse(v) : null; } catch { return v; } };
  return noloCanonical([
    input.volumeL,input.yeastId,input.yeastName,
    input.fermentation.map(p=>[p.kind??null,p.tempC??null,p.days??null]),
    input.mash.map(p=>[p.tempC,p.durationMin]),input.mashRatioLKg??null,input.dryHop,
    json(input.fermentableBasis),json(input.recipeContext),input.config.process,input.config.wort,
    input.config.operations,input.config.secondRunnings??null,
    input.config.planning?.stopSg??null,input.config.planning?.stopAttenuationPct??null
  ]);
}
export function matchingNoloSimulation(input: SimulationInput): NoloSimulation | null {
  const s=input.config.planning?.simulation;
  return s && s.settings.process===input.config.process && s.basis===noloSimulationBasis(input) ? s : null;
}
export function simulationWortRange(ogSg: number, relativeTolerancePct: number): HopRange {
  const points=ogSg-1,tolerance=relativeTolerancePct/100;
  return {min:1+points*(1-tolerance),max:1+points*(1+tolerance)};
}
export function simulationAttenuationAbv(og: HopRange, attenuationPct: HopRange, factor: number): HopRange {
  return {min:(og.min-1)*attenuationPct.min/100*factor,max:(og.max-1)*attenuationPct.max/100*factor};
}
