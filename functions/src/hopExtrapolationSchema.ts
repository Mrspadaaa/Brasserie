import { hopSourceError, validHopRange, type HopSource } from './hopIndexSchema.js';
import type { HopParameter as IntervalParameter, HopTiming } from './hopPredictionSchema.js';
/** The central scenario is an explicit editable assumption, never an observation. */
export interface HopExperimentalParameter extends IntervalParameter { central: number }
type HopParameter = HopExperimentalParameter;

/** A fixed, reviewable interval model. These are data, not executable conditions. */
export interface HopExtrapolation {
  id: string; kind: 'extrapolation'; name: string; version: string; enabled: boolean;
  source: HopSource; evidence: HopSource[]; limitations: string[];
  axes: { id: string; version: string; terms: string[]; doseScale: HopParameter; source: HopSource }[];
  descriptor: { mentioned: HopParameter; unmentioned: HopParameter; unknown: HopParameter };
  gain: HopParameter; residual: HopParameter; matrix: HopParameter;
  sourceUncertainty: Record<HopSource['kind'], HopParameter>;
  undatedUncertainty: HopParameter; unknownFormUncertainty: HopParameter;
  timings: Record<HopTiming, {
    expression: HopParameter; halfSaturationGL: HopParameter;
    extractionHours: HopParameter; decayHours: HopParameter | null;
    temperatureC: HopParameter; outsideTemperatureUncertainty: HopParameter;
  }>;
  defaultYeast: { aroma: HopParameter; expression: HopParameter };
  /** Opt-in convention for a whole recipe; does not change historical triplet calculations. */
  aggregation?: { version: string; source: HopSource; limitations: string[] };
  yeasts: {
    yeastId: string; source: HopSource; evidence: HopSource[];
    aroma: Record<string, HopParameter>; expression: Record<string, HopParameter>;
    otherAroma: HopParameter; otherExpression: HopParameter;
    notes: string[];
  }[];
  doseReferences?: {
    axisId: string; timings: HopTiming[];
    points: { doseGL: number; value: number }[];
    source: HopSource; evidence: HopSource; limitations: string[];
    transferWeight: HopParameter; relativeError: HopParameter;
  }[];
}

export function assertHopExtrapolation(v: any): asserts v is HopExtrapolation {
  const object = (x: any) => !!x && typeof x === 'object' && !Array.isArray(x);
  const text = (x: any) => typeof x === 'string' && !!x.trim();
  const check = (ok: any, message: string) => { if (!ok) throw Error(`Extrapolation : ${message}.`); };
  const keys = (x: any, allowed: string[]) => check(object(x) && Object.keys(x).every(k => allowed.includes(k)), 'champ non reconnu');
  const source = (x: any, dated = true) => { const error = hopSourceError(x, dated); if (error) throw Error(`Extrapolation : ${error}`); };
  const parameter = (x: any, min = 0, max = Infinity, strictlyPositive = false) => {
    keys(x, ['range', 'source', 'central']);
    check(validHopRange(x.range) && x.range.min >= min && x.range.max <= Math.min(max, Number.MAX_SAFE_INTEGER) && (!strictlyPositive || x.range.min > 0), 'plage de paramètre invalide');
    check(Number.isFinite(x.central) && x.central >= x.range.min && x.central <= x.range.max, 'hypothèse centrale hors de la plage');
    source(x.source);
  };
  keys(v, ['id', 'kind', 'name', 'version', 'enabled', 'source', 'evidence', 'limitations', 'axes', 'descriptor', 'gain', 'residual', 'matrix', 'sourceUncertainty', 'undatedUncertainty', 'unknownFormUncertainty', 'timings', 'defaultYeast', 'yeasts', 'doseReferences', 'aggregation']);
  check(v.kind === 'extrapolation' && text(v.version) && typeof v.enabled === 'boolean', 'identité invalide');
  source(v.source);
  const evidence = (x: any) => { check(Array.isArray(x) && x.length > 0, 'preuves absentes'); x.forEach((s: any) => source(s, false)); };
  const notes = (x: any) => check(Array.isArray(x) && x.length > 0 && x.every(text), 'limites absentes');
  evidence(v.evidence); notes(v.limitations);
  if (v.aggregation !== undefined) {
    keys(v.aggregation, ['version', 'source', 'limitations']);
    check(text(v.aggregation.version), 'version du cumul absente');
    source(v.aggregation.source); notes(v.aggregation.limitations);
  }
  check(Array.isArray(v.axes) && v.axes.length > 0 && new Set(v.axes.map((a: any) => a.id)).size === v.axes.length, 'axes absents ou dupliqués');
  for (const a of v.axes) {
    keys(a, ['id', 'version', 'terms', 'doseScale', 'source']); parameter(a.doseScale, 0, Infinity, true);
    check(text(a.id) && !/[\\/]/.test(a.id) && text(a.version) && Array.isArray(a.terms) && a.terms.length > 0 && a.terms.every(text), 'lexique invalide'); source(a.source);
  }
  keys(v.descriptor, ['mentioned', 'unmentioned', 'unknown']);
  for (const key of ['mentioned', 'unmentioned', 'unknown']) parameter(v.descriptor[key], 0, 1);
  check(v.descriptor.unknown.range.min === 0 && v.descriptor.unknown.range.max === 1, 'un houblon sans descripteur doit conserver le domaine complet');
  check(v.descriptor.unmentioned.range.min === 0 && v.descriptor.unmentioned.range.max === 1, 'non mentionné ne signifie pas absent');
  parameter(v.gain, 0, Infinity, true); parameter(v.residual, -1, 1); parameter(v.matrix, 0, Infinity, true);
  check(v.residual.range.min <= 0 && v.residual.range.max >= 0, 'le résidu doit englober zéro');
  const kinds = ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'];
  keys(v.sourceUncertainty, kinds); for (const kind of kinds) parameter(v.sourceUncertainty[kind], 0, 1);
  parameter(v.undatedUncertainty, 0, 1); parameter(v.unknownFormUncertainty, 0, 1);
  const timings = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
  keys(v.timings, timings);
  for (const timing of timings) {
    const t = v.timings[timing];
    keys(t, ['expression', 'halfSaturationGL', 'extractionHours', 'decayHours', 'temperatureC', 'outsideTemperatureUncertainty']);
    parameter(t.expression); parameter(t.halfSaturationGL, 0, Infinity, true); parameter(t.extractionHours, 0, Infinity, true);
    if (t.decayHours !== null) parameter(t.decayHours, 0, Infinity, true);
    parameter(t.temperatureC, -273.15); parameter(t.outsideTemperatureUncertainty, 0, 1);
  }
  keys(v.defaultYeast, ['aroma', 'expression']); parameter(v.defaultYeast.aroma); parameter(v.defaultYeast.expression);
  check(Array.isArray(v.yeasts) && new Set(v.yeasts.map((y: any) => y.yeastId)).size === v.yeasts.length, 'profils de levure dupliqués');
  for (const y of v.yeasts) {
    keys(y, ['yeastId', 'source', 'evidence', 'aroma', 'expression', 'otherAroma', 'otherExpression', 'notes']);
    check(text(y.yeastId), 'levure absente'); source(y.source); evidence(y.evidence); notes(y.notes);
    for (const field of ['aroma', 'expression']) {
      keys(y[field], v.axes.map((a: any) => a.id)); Object.values(y[field]).forEach(p => parameter(p));
    }
    parameter(y.otherAroma); parameter(y.otherExpression);
    // Losing the strain must widen, never select a reassuring average strain.
    for (const p of [y.otherAroma, ...Object.values(y.aroma)] as HopParameter[]) check(p.range.min >= v.defaultYeast.aroma.range.min && p.range.max <= v.defaultYeast.aroma.range.max, 'arôme de levure hors enveloppe inconnue');
    for (const p of [y.otherExpression, ...Object.values(y.expression)] as HopParameter[]) check(p.range.min >= v.defaultYeast.expression.range.min && p.range.max <= v.defaultYeast.expression.range.max, 'expression hors enveloppe inconnue');
  }
  if (v.doseReferences !== undefined) {
    check(Array.isArray(v.doseReferences) && new Set(v.doseReferences.map((r: any)=>r.axisId)).size === v.doseReferences.length, 'courbes dupliquées');
    for (const r of v.doseReferences) {
      keys(r, ['axisId','timings','points','source','evidence','limitations','transferWeight','relativeError']);
      check(v.axes.some((a: any)=>a.id===r.axisId) && Array.isArray(r.timings) && r.timings.length>0 && r.timings.every((t:any)=>timings.includes(t)), 'domaine de transfert invalide');
      source(r.source); source(r.evidence,false); notes(r.limitations); parameter(r.transferWeight,0,1); parameter(r.relativeError);
      check(Array.isArray(r.points) && r.points.length>=2 && r.points[0].doseGL===0 && r.points[0].value===0, 'la courbe doit commencer sans apport à dose zéro');
      r.points.forEach((p:any,i:number)=>{keys(p,['doseGL','value']);check(Number.isFinite(p.doseGL)&&p.doseGL>=0&&Number.isFinite(p.value)&&p.value>=0&&p.value<=1&&(i===0||p.doseGL>r.points[i-1].doseGL),'point de courbe invalide');});
    }
  }
}
