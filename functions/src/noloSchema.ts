import { hopSourceError, validHopRange, type HopRange, type HopSource } from './hopIndexSchema.js';

export const NOLO_SUGARS = ['glucose', 'fructose', 'sucrose', 'maltose', 'maltotriose'] as const;
export type NoloSugar = typeof NOLO_SUGARS[number];
export type SugarProfile = Partial<Record<NoloSugar, HopRange | null>>;
export type NoloProcess = 'restricted' | 'restored' | 'lowExtract' | 'coldExtraction' | 'coldContact' | 'arrested' | 'dealcoholized' | 'secondRunnings';
export type NoloStage = 'sourceWater' | 'mash' | 'sparge' | 'lastRunnings' | 'wort' | 'primary' | 'packaged';
export interface NoloParameter { value: number; unit: string; source: HopSource }
export interface NoloStrain {
  yeastId: string; name: string; aliases: string[];
  sugars: Record<NoloSugar, 'yes' | 'no' | 'unknown'>;
  hydrolysis: 'positive' | 'negative' | 'unknown'; pof: 'positive' | 'negative' | 'unknown';
  temperatureC: HopRange | null; attenuationPct: HopRange | null;
  durationDays: HopRange | null; pitchGL: HopRange | null;
  aroma: string[]; limitation: string; availability: string; source: HopSource;
}
export interface NoloProcessNote {
  id: NoloProcess; name: string; aroma: string; work: string; waterEnergy: string; equipment: string;
  analyses: string; evidence: string; limitation: string; source: HopSource;
}
export interface NoloScience {
  id: string; kind: 'noloScience'; name: string; version: string; enabled: boolean; source: HopSource;
  ethanolDensityGL: NoloParameter;
  waterMashMaxLKg: NoloParameter;
  /** Stoichiometric maxima, not fermentation yields or fitted confidence intervals. */
  ethanolMaxGPerG: Record<NoloSugar, NoloParameter>;
  la01: { yeastId: string; slope: NoloParameter; intercept: NoloParameter; plato: HopRange;
    mash: { tempC: number; minutes: number }[]; temperatureC: HopRange; source: HopSource; limitation: string };
  strains: NoloStrain[]; processes: NoloProcessNote[];
  /** Optional in legacy editions. Planning relations never certify packaged beer. */
  planningModels?: {
    sgAbvFactor: NoloParameter;
    sgPlatoCoefficients: [NoloParameter, NoloParameter, NoloParameter, NoloParameter];
    mothers: { yeastId: string; attenuationPct: HopRange; temperatureC: HopRange; source: HopSource }[];
  };
}
export interface NoloMeasurement {
  id: string; stage: NoloStage; date: string; method: string;
  abvPct?: HopRange | null; ph?: number | null; sg?: number | null; co2Vol?: number | null;
  volumeL?: number | null; sugarsGL?: SugarProfile; sugarsComplete?: boolean;
  /** Last operation already included in the analysis; no operation is counted twice. */
  afterOperationId?: string;
  /** Recipe/process identity at sampling; changed plans do not silently inherit an assay. */
  basis?: string;
}
export type NoloOperation =
  | { id: string; kind: 'sugar'; name: string; sugarsG: SugarProfile; complete: boolean; volumeL: number | null; unclassifiedSugarG?: HopRange | null; recipeAddition?: {index:number;basis:string} }
  | { id: string; kind: 'aroma'; name: string; volumeML: number | null; carrierAbvPct: HopRange | null; sugarG: HopRange | null; composition: string; moment: string;
      /** Joint mass available for ethanol OR fermentable sugar, after known inert material. */
      compositionBound?: { massG: number; inertMassPct: HopRange; source: HopSource } }
  | { id: string; kind: 'blend'; name: string; volumeL: number | null; abvPct: HopRange | null; remainingSugarG: HopRange | null }
  | { id: string; kind: 'dilution'; name: string; volumeL: number | null }
  | { id: string; kind: 'removal'; name: string; ethanolRemovedPct: HopRange | null; finalVolumeL: number | null; source: string };
export interface NoloConfig {
  version: 1; enabled: boolean; targetAbvPct: number; process: NoloProcess;
  orientation: 'free' | 'banana' | 'balanced' | 'clove';
  wort: { ogPlato: HopRange | null; sugarsGL: SugarProfile; sugarsComplete: boolean };
  operations: NoloOperation[]; measurements: NoloMeasurement[];
  equipment: string[]; stabilization: { method: string; validationReference: string; storage: string };
  secondRunnings?: { sourceBatchId: string; previousExtraction: string; waterAddedL: number | null; alkalinityPpm: number | null;
    temperatureC: number | null; minutes: number | null; recoveredL: number | null; sg: number | null; ph: number | null };
  trials?: { id: string; name: string; volumeL: number | null; product: string; composition: string; dosageML: number | null;
    carrierAbvPct: HopRange | null; moment: string; tasting: string; comparator: string }[];
  /** Captured at save/apply, allows replay independently of later database edits. */
  scienceSnapshot?: NoloScience;
  planning?: {
    version: 1; source: HopSource;
    /** New planning calculations retain full extract precision; absent replays legacy rounding. */
    exactExtract?: boolean;
    stopSg?: HopRange | null; stopAttenuationPct?: HopRange | null;
    /** Explicit conditional sensory equivalence, not a measured retention factor. */
    aromaTransfer?: { axes: Record<string, HopRange>; source: HopSource };
  };
  inactiveOperations?: { process: NoloProcess; index: number; operation: NoloOperation }[];
}
const check = (v: unknown, m: string) => { if (!v) throw Error(m); };
const range = (v: unknown, max = Infinity) => validHopRange(v) && (v as HopRange).min >= 0 && (v as HopRange).max <= max;
const nullable = (v: unknown, max = Infinity) => v === null || range(v, max);
const finite = (v: unknown, max = Infinity) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
export function assertSugarProfile(v: any) {
  check(v && typeof v === 'object' && !Array.isArray(v), 'Profil de sucres invalide.');
  for (const [k, r] of Object.entries(v)) check(NOLO_SUGARS.includes(k as NoloSugar) && nullable(r), 'Sucre ou unité invalide (g/L ou g selon le champ).');
}
export function assertNoloScience(v: any): asserts v is NoloScience {
  check(v && v.kind === 'noloScience' && v.id && v.name && v.version && typeof v.enabled === 'boolean' && !hopSourceError(v.source, true), 'Science NOLO invalide.');
  const parameter = (p: any) => check(p && Number.isFinite(p.value) && p.unit && !hopSourceError(p.source, true), 'Coefficient NOLO sans provenance datée.');
  parameter(v.ethanolDensityGL); check(v.ethanolDensityGL.value > 0, 'Masse volumique invalide.');
  parameter(v.waterMashMaxLKg); check(v.waterMashMaxLKg.value > 0, 'Domaine du modèle d’eau invalide.');
  if (v.planningModels) {
    const p = v.planningModels;
    parameter(p.sgAbvFactor); check(p.sgAbvFactor.value > 0, 'Relation de densité invalide.');
    check(Array.isArray(p.sgPlatoCoefficients) && p.sgPlatoCoefficients.length === 4, 'Conversion Plato incomplète.');
    p.sgPlatoCoefficients.forEach(parameter);
    check(Array.isArray(p.mothers), 'Références de fermentation complète absentes.');
    for (const m of p.mothers) check(m.yeastId && range(m.attenuationPct,100) && range(m.temperatureC) && !hopSourceError(m.source,true), 'Référence de bière mère invalide.');
  }
  for (const s of NOLO_SUGARS) { parameter(v.ethanolMaxGPerG?.[s]); check(v.ethanolMaxGPerG[s].value > 0 && v.ethanolMaxGPerG[s].value < 1, 'Rendement physique invalide.'); }
  parameter(v.la01?.slope); parameter(v.la01?.intercept);
  check(v.la01.yeastId && range(v.la01.plato) && range(v.la01.temperatureC) && !hopSourceError(v.la01.source, true) && v.la01.limitation &&
    Array.isArray(v.la01.mash) && v.la01.mash.length && v.la01.mash.every((s: any) => finite(s.tempC, 100) && finite(s.minutes)), 'Domaine LA-01 incomplet.');
  check(Array.isArray(v.strains) && Array.isArray(v.processes), 'Souches et procédés requis.');
  const ids = new Set();
  for (const s of v.strains) {
    check(s.yeastId && !ids.has(s.yeastId) && s.name && Array.isArray(s.aliases) && !hopSourceError(s.source) &&
      ['positive', 'negative', 'unknown'].includes(s.pof) && ['positive', 'negative', 'unknown'].includes(s.hydrolysis) &&
      nullable(s.temperatureC) && nullable(s.attenuationPct, 100) && nullable(s.durationDays) && nullable(s.pitchGL) &&
      Array.isArray(s.aroma) && s.limitation && s.availability, 'Fiche de souche NOLO invalide.');
    ids.add(s.yeastId);
    for (const sugar of NOLO_SUGARS) check(['yes', 'no', 'unknown'].includes(s.sugars?.[sugar]), 'Assimilation inconnue : utiliser unknown.');
  }
  for (const p of v.processes) check(p.id && p.name && p.aroma && p.work && p.waterEnergy && p.equipment && p.analyses && p.evidence && p.limitation && !hopSourceError(p.source), 'Procédé sans documentation.');
}
export function assertNoloConfig(v: any): asserts v is NoloConfig {
  check(v && v.version === 1 && typeof v.enabled === 'boolean' && finite(v.targetAbvPct, .5) &&
    ['restricted','restored','lowExtract','coldExtraction','coldContact','arrested','dealcoholized','secondRunnings'].includes(v.process) &&
    ['free','banana','balanced','clove'].includes(v.orientation), 'Objectif NOLO invalide.');
  check(v.wort && nullable(v.wort.ogPlato, 100) && typeof v.wort.sugarsComplete === 'boolean', 'Moût NOLO invalide.');
  assertSugarProfile(v.wort.sugarsGL);
  check(Array.isArray(v.operations) && Array.isArray(v.measurements) && Array.isArray(v.equipment) &&
    v.stabilization && typeof v.stabilization.method === 'string' && typeof v.stabilization.validationReference === 'string' && typeof v.stabilization.storage === 'string', 'Suivi NOLO incomplet.');
  const ids = new Set();
  if (v.planning) {
    check(v.planning.version === 1 && !hopSourceError(v.planning.source,true), 'Hypothèse de préparation sans provenance datée.');
    if (v.planning.exactExtract !== undefined) check(typeof v.planning.exactExtract === 'boolean', 'Précision du calcul invalide.');
    for (const [k,max] of [['stopSg',3],['stopAttenuationPct',100]] as const)
      if (v.planning[k] !== undefined) check(nullable(v.planning[k],max), 'Arrêt de fermentation invalide.');
    if (v.planning.aromaTransfer) {
      check(!hopSourceError(v.planning.aromaTransfer.source,true) && v.planning.aromaTransfer.axes && typeof v.planning.aromaTransfer.axes === 'object', 'Transfert aromatique sans source.');
      for (const r of Object.values(v.planning.aromaTransfer.axes)) check(range(r,1), 'Hypothèse aromatique hors 0–1.');
    }
  }
  if (v.inactiveOperations) {
    check(Array.isArray(v.inactiveOperations), 'Opérations écartées invalides.');
    for (const parked of v.inactiveOperations) {
      check(Number.isInteger(parked.index) && parked.index >= 0, 'Position d’opération invalide.');
      assertNoloConfig({...v, planning:undefined, inactiveOperations:undefined, operations:[parked.operation], measurements:[]});
    }
  }
  for (const o of v.operations) {
    check(o.id && !ids.has(o.id) && typeof o.name === 'string', 'Identité d’opération NOLO invalide.'); ids.add(o.id);
    if (o.kind === 'sugar') { assertSugarProfile(o.sugarsG); check(typeof o.complete === 'boolean' && (o.volumeL===null||finite(o.volumeL)) && (o.unclassifiedSugarG===undefined||nullable(o.unclassifiedSugarG)), 'Ajout de sucre invalide.'); }
    else if (o.kind === 'aroma') check((o.volumeML===null||finite(o.volumeML)) && nullable(o.carrierAbvPct, 100) && nullable(o.sugarG) && typeof o.composition === 'string' && typeof o.moment === 'string', 'Support aromatique invalide.');
    else if (o.kind === 'blend') check((o.volumeL===null||finite(o.volumeL)) && nullable(o.abvPct, 100) && nullable(o.remainingSugarG), 'Assemblage invalide.');
    else if (o.kind === 'dilution') check(o.volumeL===null||finite(o.volumeL), 'Dilution invalide.');
    else if (o.kind === 'removal') check(nullable(o.ethanolRemovedPct, 100) && (o.finalVolumeL === null || finite(o.finalVolumeL) && o.finalVolumeL > 0) && typeof o.source === 'string', 'Désalcoolisation invalide.');
    else check(false, 'Opération NOLO inconnue.');
    if(o.recipeAddition)check(o.kind==='sugar'&&Number.isInteger(o.recipeAddition.index)&&o.recipeAddition.index>=0&&typeof o.recipeAddition.basis==='string','Lien d’ingrédient NOLO invalide.');
    if(o.compositionBound) check(o.kind === 'aroma' && finite(o.compositionBound.massG) && range(o.compositionBound.inertMassPct,100) && !hopSourceError(o.compositionBound.source,true), 'Borne de composition sans masse ou provenance.');
  }
  const measurementIds = new Set();
  for (const m of v.measurements) {
    check(m.id && !measurementIds.has(m.id) && ['sourceWater','mash','sparge','lastRunnings','wort','primary','packaged'].includes(m.stage) &&
      typeof m.date === 'string' && typeof m.method === 'string' && (m.afterOperationId === undefined || typeof m.afterOperationId === 'string'), 'Mesure NOLO sans étape.'); measurementIds.add(m.id);
    if (m.abvPct !== undefined) check(nullable(m.abvPct, 100), 'Plage d’alcool mesurée invalide.');
    for (const [k, max] of [['ph',14],['sg',3],['co2Vol',Infinity],['volumeL',Infinity]] as const) if (m[k] != null) check(finite(m[k],max), 'Mesure NOLO invalide.');
    if (m.sugarsGL) assertSugarProfile(m.sugarsGL);
  }
  if (v.scienceSnapshot) assertNoloScience(v.scienceSnapshot);
  if (v.secondRunnings) {
    for (const k of ['waterAddedL','alkalinityPpm','temperatureC','minutes','recoveredL','sg','ph']) check(v.secondRunnings[k] === null || finite(v.secondRunnings[k]), 'Mesure de seconde extraction invalide.');
  }
  if (v.trials) for (const t of v.trials) check(t.id && t.name && (t.volumeL===null||finite(t.volumeL)) && (t.dosageML === null || finite(t.dosageML)) && nullable(t.carrierAbvPct,100) && typeof t.tasting === 'string', 'Essai de restitution invalide.');
}
