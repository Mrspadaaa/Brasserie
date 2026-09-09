import { HOP_ANALYTES, HOP_FORMS, HOP_UNITS, HopAnalyte, HopConfidence, HopMeasurement, HopProductForm, HopRange, HopSource, HopSourceKind, HopUnit, assertHopDocument, hopSourceError, validHopRange } from './hopIndexSchema.js';
import { assertHopTrial, type HopTrial } from './hopTrialSchema.js';
import { assertHopExtrapolation, type HopExtrapolation } from './hopExtrapolationSchema.js';
import { assertHopSolverPolicy, type HopSolverPolicy } from './hopSolverSchema.js';
import { assertFermentationGuide, type FermentationGuide } from './fermentationGuideSchema.js';
import { assertYeastCatalogue, type YeastCatalogue } from './yeastCatalogueSchema.js';
import { assertFermentationScience, type FermentationScience } from './fermentationScienceSchema.js';
import { assertBrewingStyleGuide, type BrewingStyleGuide } from './brewingStyleSchema.js';
import { assertNoloScience, type NoloScience } from './noloSchema.js';
import type { HopRecipePrediction } from './hopRecipePrediction.js';

export const HOP_TIMINGS = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'] as const;
export type HopTiming = typeof HOP_TIMINGS[number];
export interface HopParameter { range: HopRange; source: HopSource }
export interface HopAxis {
  id: string; kind: 'axis'; name: string; version: string; description: string;
  scale: HopRange; lowMax: number; mediumMax: number; weight: HopParameter; source: HopSource;
}
export interface HopYeast {
  id: string; kind: 'yeast'; name: string; betaLyase: 'positive' | 'negative' | 'unknown'; source: HopSource;
  form?: 'sèche' | 'liquide' | 'levain';
  catalogue?: YeastCatalogue;
}
export interface HopTriplet {
  varietyId: string | null; lotId?: string | null; yeastId: string | null; timing: HopTiming | null;
  doseGL: number | null; temperatureC: number | null; contactHours: number | null; matrixId: string | null;
}
export interface HopModelScope {
  varietyId: string; yeastId: string; timing: HopTiming; form: HopProductForm;
  doseGL: HopRange; temperatureC: HopRange | null; contactHours: HopRange | null;
  /** A named, documented beer/process domain, never an implicit universal matrix. */
  matrixId: string; notes: string;
}
export interface HopLinearTerm {
  analyte: HopAnalyte; unit: HopUnit; basis: HopMeasurement['basis']; support: HopRange;
  coefficient: HopParameter;
}
export interface HopModelOutput {
  /** axis:<id> or beer:4mmpFree (ng/L). No automatic chemical-to-sensory conversion. */
  target: string; axisVersion?: string;
  /** An observed envelope for this exact scope, not an invented confidence interval. */
  envelope: HopParameter | null;
  /** ONE joint empirical fit; slopes are not independent enzymatic reaction rules. */
  calibration?: { intercept: HopParameter; residual: HopParameter; terms: HopLinearTerm[]; method: string };
  /** Interpolation of published panel means in the model's exact process scope. */
  doseCurve?: { points: { doseGL: number; value: number }[]; source: HopSource; residual: HopParameter; method: string };
}
export interface HopModel {
  id: string; kind: 'model'; name: string; version: string; enabled: boolean; scope: HopModelScope;
  outputs: HopModelOutput[]; confidence: HopConfidence; source: HopSource;
}
export interface HopRiskPolicy {
  id: string; kind: 'risk'; risk: 'hopCreep' | 'fourMmp' | 'precursors'; name: string; enabled: boolean;
  source: HopSource; advice: string;
  /** Context-specific threshold, never an odour detection threshold labelled a defect limit. */
  threshold?: HopParameter; analyte?: HopAnalyte; unit?: HopUnit; basis?: HopMeasurement['basis']; matrixId?: string;
}
export interface HopConfidencePolicy {
  id: string; kind: 'confidence'; name: string; source: HopSource;
  caps: Record<HopSourceKind, HopConfidence>;
}
export interface HopResearchNote {
  id: string; kind: 'note'; name: string; topics: string[]; summary: string; limitation: string; source: HopSource;
}
export type HopKnowledge = HopAxis | HopYeast | HopModel | HopRiskPolicy | HopConfidencePolicy | HopResearchNote | HopTrial | HopExtrapolation | HopSolverPolicy | FermentationGuide | FermentationScience | BrewingStyleGuide | NoloScience;
export interface HopEstimate {
  range: HopRange | null; confidence: HopConfidence; reasons: string[]; sources: HopSource[];
  /** Central scenario of explicit expert parameters, always accompanied by range. */
  central?: number;
}
export interface HopRisk {
  code: HopRiskPolicy['risk']; status: 'possible' | 'flagged' | 'unknown'; title: string; message: string; source: HopSource; confidence: HopConfidence;
}
export interface HopPrediction {
  triplet: HopTriplet; profile: Record<string, HopEstimate>; compounds: Record<string, HopEstimate>;
  score: HopEstimate; risks: HopRisk[]; modelRefs: { id: string; version: string }[]; reasons: string[];
  /** These axes use expert assumptions, not calibrated confidence intervals. */
  extrapolatedAxes?: string[];
}
export interface HopPredictionSnapshot {
  id: string; createdAt: string; name: string; recipeId?: string; batchId?: string; engineVersion: 'hop-envelope-v1' | 'hop-envelope-v2' | 'hop-experimental-v3' | 'hop-experimental-v4';
  target: Record<string, HopRange>; prediction: HopPrediction;
  /** Whole programme, when frozen. `prediction` remains the first addition only,
   * never a total disguised as a triplet. New consumers use this overall profile. */
  recipePrediction?: Omit<HopRecipePrediction, 'additions'>;
  /** Inputs and definitions are copied: changing a COA/model never rewrites the past. */
  evidence: { varieties: unknown[]; lots: unknown[]; knowledge: HopKnowledge[] };
}
export interface HopTasting {
  id: string; name: string; date: string; origin: 'batch' | 'commercial'; batchId?: string;
  brewery?: string; beerLot?: string; notes: string; predictionId: string | null;
  /** Unknown commercial yeast/timing stay unknown, irrespective of aroma resemblance. */
  triplet: HopTriplet | null; tripletSource: HopSource | null;
  axes: { axis: HopAxis; perceived: HopRange | null; confidence: HopConfidence }[];
}
/** Context excerpt: a companion comparison needs the old axes, not repeated raw COAs. */
export type HopPredictionComparison = Pick<HopPredictionSnapshot, 'id' | 'createdAt' | 'name' | 'recipeId' | 'batchId' | 'prediction' | 'recipePrediction'> & { evidence: { knowledge: HopAxis[] } };

const obj = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: any): v is string => typeof v === 'string' && !!v.trim();
const confidence = (v: any) => ['low', 'medium', 'high'].includes(v);
const idValid = (v: any) => str(v) && v.length <= 120 && !/[\/\\]/.test(v) && !/^__.*__$/.test(v) && !['constructor', 'prototype', '.', '..'].includes(v);
const check = (v: unknown, message: string): void => { if (!v) throw Error(message); };
const keys = (v: Record<string, unknown>, allowed: string[]) => check(Object.keys(v).every(k => allowed.includes(k)), 'Champ de connaissance non reconnu.');
const source = (v: unknown) => { const error = hopSourceError(v, true); if (error) throw Error(error); };
const documentarySource = (v: unknown) => { const error = hopSourceError(v); if (error) throw Error(error); };
const nonnegativeRange = (v: any) => validHopRange(v) && v.min >= 0;
const calendarDate = (v: any) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
function parameter(v: any, positive = false) {
  check(obj(v) && validHopRange(v.range) && (!positive || v.range.min >= 0), 'Paramètre : plage sourcée requise.');
  keys(v, ['range', 'source']); source(v.source);
}
export function assertHopTriplet(v: any): asserts v is HopTriplet {
  check(obj(v), 'Triplet invalide.');
  keys(v, ['varietyId', 'lotId', 'yeastId', 'timing', 'doseGL', 'temperatureC', 'contactHours', 'matrixId']);
  for (const key of ['varietyId', 'yeastId', 'matrixId']) check(v[key] === null || idValid(v[key]), 'Identifiant du triplet invalide.');
  check(v.lotId == null || idValid(v.lotId), 'Lot invalide.');
  check(v.timing === null || HOP_TIMINGS.includes(v.timing), 'Timing invalide.');
  for (const key of ['doseGL', 'temperatureC', 'contactHours']) check(v[key] === null || (typeof v[key] === 'number' && Number.isFinite(v[key]) && (key === 'temperatureC' || v[key] >= 0)), 'Condition du triplet invalide.');
}
export function assertHopKnowledge(v: any, id?: string): asserts v is HopKnowledge {
  check(obj(v) && idValid(v.id) && (!id || v.id === id) && str(v.name), 'Identité de connaissance invalide.');
  const provenanceError = hopSourceError(v.source, v.kind !== 'yeast');
  if (provenanceError) throw Error(provenanceError);
  const base = ['id', 'kind', 'name', 'source'];
  switch (v.kind) {
    case 'styleGuide': assertBrewingStyleGuide(v); break;
    case 'noloScience': assertNoloScience(v); break;
    case 'fermentation': assertFermentationGuide(v); break;
    case 'fermentationScience': assertFermentationScience(v); break;
    case 'solver': assertHopSolverPolicy(v); break;
    case 'extrapolation': assertHopExtrapolation(v); break;
    case 'trial': assertHopTrial(v); break;
    case 'note':
      keys(v, [...base, 'topics', 'summary', 'limitation']);
      check(Array.isArray(v.topics) && v.topics.length > 0 && v.topics.every(str) && str(v.summary) && str(v.limitation), 'Note documentaire incomplète.'); break;
    case 'axis':
      keys(v, [...base, 'version', 'description', 'scale', 'lowMax', 'mediumMax', 'weight']);
      check(str(v.version) && str(v.description) && nonnegativeRange(v.scale) && v.scale.max > v.scale.min, 'Axe ou échelle invalide.');
      check(Number.isFinite(v.lowMax) && Number.isFinite(v.mediumMax) && v.lowMax > v.scale.min && v.lowMax < v.mediumMax && v.mediumMax < v.scale.max, 'Classes de l’axe invalides.');
      parameter(v.weight, true); check(v.weight.range.min > 0, 'Poids strictement positif requis.'); break;
    case 'yeast':
      keys(v, [...base, 'betaLyase', 'form', 'catalogue']);
      if (v.catalogue !== undefined) assertYeastCatalogue(v.catalogue);
      check(v.form === undefined || ['sèche', 'liquide', 'levain'].includes(v.form), 'Forme de levure invalide.');
      check(['positive', 'negative', 'unknown'].includes(v.betaLyase), 'Statut β-lyase invalide.'); break;
    case 'confidence': {
      keys(v, [...base, 'caps']);
      check(obj(v.caps), 'Politique de confiance absente.');
      const kinds = ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'];
      keys(v.caps, kinds); check(kinds.every(k => confidence(v.caps[k])), 'Classes de confiance invalides.');
      // This is an epistemic invariant, not a calibrated weight.
      check(v.caps.judgment === 'low', 'Un jugement non validé garde une confiance faible.'); break;
    }
    case 'risk':
      keys(v, [...base, 'risk', 'enabled', 'advice', 'threshold', 'analyte', 'unit', 'basis', 'matrixId']);
      check(['hopCreep', 'fourMmp', 'precursors'].includes(v.risk) && typeof v.enabled === 'boolean' && str(v.advice), 'Risque invalide.');
      if (v.threshold != null) {
        parameter(v.threshold, true);
        check(idValid(v.matrixId) && HOP_ANALYTES.includes(v.analyte) && HOP_UNITS.includes(v.unit) && v.unit !== 'unknown' && ['asIs', 'dryMatter', 'oil', 'beer'].includes(v.basis), 'Seuil : contexte, composé, unité et base requis.');
        if (v.risk === 'fourMmp') check(v.analyte === '4mmpFree' && v.unit === 'ngL' && v.basis === 'beer', 'Le seuil 4MMP porte sur la bière en ng/L.');
        if (v.risk === 'precursors') check(['3mhCys', '3mhGsh', '3mhGluCys', '3mhCysGly', '4mmpCys', '4mmpGsh'].includes(v.analyte), 'Précurseur requis.');
      }
      break;
    case 'model': {
      keys(v, [...base, 'version', 'enabled', 'scope', 'outputs', 'confidence']);
      check(str(v.version) && typeof v.enabled === 'boolean' && confidence(v.confidence) && obj(v.scope), 'Modèle invalide.');
      const s = v.scope;
      keys(s, ['varietyId', 'yeastId', 'timing', 'form', 'doseGL', 'temperatureC', 'contactHours', 'matrixId', 'notes']);
      check(idValid(s.varietyId) && idValid(s.yeastId) && HOP_TIMINGS.includes(s.timing) && HOP_FORMS.includes(s.form) && s.form !== 'unknown' && idValid(s.matrixId) && str(s.notes), 'Domaine expérimental incomplet.');
      check(nonnegativeRange(s.doseGL) && (s.temperatureC === null || validHopRange(s.temperatureC)) && (s.contactHours === null || nonnegativeRange(s.contactHours)), 'Plages du domaine invalides.');
      check(Array.isArray(v.outputs) && v.outputs.length > 0, 'Sorties du modèle absentes.');
      const targets = new Set<string>();
      for (const output of v.outputs) {
        check(obj(output), 'Sortie invalide.'); keys(output, ['target', 'axisVersion', 'envelope', 'calibration', 'doseCurve']);
        check(str(output.target) && (output.target === 'beer:4mmpFree' || (output.target.startsWith('axis:') && idValid(output.target.slice(5)) && str(output.axisVersion))), 'Cible du modèle invalide.');
        check(!targets.has(output.target), 'Sortie en double : les voies ne s’additionnent pas.'); targets.add(output.target);
        check(output.envelope !== undefined, 'Enveloppe absente : utiliser null si inconnue.');
        if (output.envelope !== null) parameter(output.envelope, true);
        check(output.envelope !== null || output.calibration || output.doseCurve, 'Aucune donnée pour cette sortie.');
        if (output.doseCurve) {
          const c = output.doseCurve; keys(c, ['points', 'source', 'residual', 'method']); source(c.source); parameter(c.residual);
          check(!output.calibration && output.target.startsWith('axis:') && str(c.method) && Array.isArray(c.points) && c.points.length >= 2, 'Courbe de dose invalide.');
          check(c.residual.range.min <= 0 && c.residual.range.max >= 0, 'La marge de courbe doit englober zéro.');
          c.points.forEach((p: any, i: number) => { keys(p, ['doseGL', 'value']); check(Number.isFinite(p.doseGL) && p.doseGL >= 0 && Number.isFinite(p.value) && (i === 0 || p.doseGL > c.points[i-1].doseGL), 'Points de dose invalides ou non triés.'); });
          check(s.doseGL.min >= c.points[0].doseGL && s.doseGL.max <= c.points.at(-1).doseGL, 'Domaine de dose au-delà des observations.');
        }
        if (output.calibration) {
          const c = output.calibration; check(obj(c), 'Étalonnage invalide.'); keys(c, ['intercept', 'residual', 'terms', 'method']);
          parameter(c.intercept); parameter(c.residual); check(str(c.method) && Array.isArray(c.terms) && c.terms.length > 0, 'Méthode et prédicteurs requis.');
          const terms = new Set();
          for (const t of c.terms) {
            check(obj(t), 'Prédicteur invalide.'); keys(t, ['analyte', 'unit', 'basis', 'support', 'coefficient']);
            check(HOP_ANALYTES.includes(t.analyte) && HOP_UNITS.includes(t.unit) && t.unit !== 'unknown' && ['asIs', 'dryMatter', 'oil', 'beer'].includes(t.basis) && nonnegativeRange(t.support), 'Domaine du prédicteur invalide.');
            check(!terms.has(t.analyte), 'Prédicteur en double.'); terms.add(t.analyte); parameter(t.coefficient);
          }
        }
      }
      break;
    }
    default: throw Error('Type de connaissance inconnu.');
  }
}
export function assertHopTasting(v: any, id?: string): asserts v is HopTasting {
  check(obj(v) && idValid(v.id) && (!id || v.id === id) && str(v.name) && calendarDate(v.date), 'Dégustation invalide.');
  keys(v, ['id', 'name', 'date', 'origin', 'batchId', 'brewery', 'beerLot', 'notes', 'predictionId', 'triplet', 'tripletSource', 'axes']);
  check(['batch', 'commercial'].includes(v.origin) && typeof v.notes === 'string', 'Origine de dégustation invalide.');
  if (v.origin === 'batch') check(idValid(v.batchId), 'Brassin requis.');
  for (const key of ['brewery', 'beerLot']) check(v[key] == null || typeof v[key] === 'string', 'Information de bière invalide.');
  check(v.predictionId === null || idValid(v.predictionId), 'Prédiction invalide.');
  if (v.triplet !== null) { assertHopTriplet(v.triplet); documentarySource(v.tripletSource); }
  else check(v.tripletSource === null, 'Un triplet inconnu ne porte pas de provenance supposée.');
  check(Array.isArray(v.axes), 'Profil dégusté absent.');
  const ids = new Set();
  for (const entry of v.axes) {
    check(obj(entry), 'Axe dégusté invalide.'); keys(entry, ['axis', 'perceived', 'confidence']);
    assertHopKnowledge(entry.axis); check(entry.axis.kind === 'axis' && confidence(entry.confidence), 'Axe dégusté invalide.');
    check(!ids.has(entry.axis.id), 'Axe dégusté en double.'); ids.add(entry.axis.id);
    check(entry.perceived === null || (validHopRange(entry.perceived) && entry.perceived.min >= entry.axis.scale.min && entry.perceived.max <= entry.axis.scale.max), 'Dégustation hors échelle.');
  }
}

/** Structural and relational checks; use hopPredictionValidation for persistence. */
export function assertHopPredictionSnapshotShape(v: any, id?: string): asserts v is HopPredictionSnapshot {
  check(obj(v) && idValid(v.id) && (!id || v.id === id) && str(v.name) && typeof v.createdAt === 'string' && Number.isFinite(Date.parse(v.createdAt)) && ['hop-envelope-v1', 'hop-envelope-v2', 'hop-experimental-v3', 'hop-experimental-v4'].includes(v.engineVersion), 'Instantané de prédiction invalide.');
  keys(v, ['id', 'createdAt', 'name', 'recipeId', 'batchId', 'engineVersion', 'target', 'prediction', 'recipePrediction', 'evidence']);
  if (v.recipePrediction !== undefined) check(v.engineVersion === 'hop-experimental-v4' && obj(v.recipePrediction) && ['hop-recipe-experimental-v1', 'hop-recipe-experimental-v2', 'hop-recipe-experimental-v3', 'hop-recipe-experimental-v4', 'hop-recipe-experimental-v5'].includes(v.recipePrediction.engineVersion), 'Version du programme figé invalide.');
  for (const key of ['recipeId', 'batchId']) check(v[key] == null || idValid(v[key]), 'Référence de prédiction invalide.');
  check(obj(v.evidence) && Array.isArray(v.evidence.varieties) && Array.isArray(v.evidence.lots) && Array.isArray(v.evidence.knowledge), 'Données figées absentes.');
  keys(v.evidence, ['varieties', 'lots', 'knowledge']);
  v.evidence.varieties.forEach((row: unknown) => assertHopDocument('hopVarieties', row));
  v.evidence.lots.forEach((row: unknown) => assertHopDocument('hopLots', row));
  v.evidence.knowledge.forEach((row: unknown) => assertHopKnowledge(row));
  for (const rows of [v.evidence.varieties, v.evidence.lots, v.evidence.knowledge]) check(new Set(rows.map((row: { id: string }) => row.id)).size === rows.length, 'Identité figée en double.');
  const p = v.prediction;
  check(obj(p) && obj(p.profile) && obj(p.compounds) && obj(v.target), 'Profil figé invalide.');
  keys(p, ['triplet', 'profile', 'compounds', 'score', 'risks', 'modelRefs', 'reasons', 'extrapolatedAxes']);
  if (p.extrapolatedAxes !== undefined) check(['hop-experimental-v3', 'hop-experimental-v4'].includes(v.engineVersion) && Array.isArray(p.extrapolatedAxes) && p.extrapolatedAxes.length > 0 && p.extrapolatedAxes.every((id: any) => idValid(id) && p.profile[id]?.range) && new Set(p.extrapolatedAxes).size === p.extrapolatedAxes.length, 'Axes extrapolés invalides.');
  if (!['hop-experimental-v3', 'hop-experimental-v4'].includes(v.engineVersion)) check(!v.evidence.knowledge.some((k: HopKnowledge) => k.kind === 'extrapolation'), 'Les anciennes versions ne calculent pas d’extrapolation.');
  if (v.engineVersion !== 'hop-experimental-v4') check(!v.evidence.knowledge.some((k: HopKnowledge) => (k.kind === 'model' && k.outputs.some(o => o.doseCurve)) || (k.kind === 'extrapolation' && k.doseReferences?.length)), 'Courbe de dose absente des moteurs historiques.');
  assertHopTriplet(p.triplet);
  const estimate = (e: any) => {
    check(obj(e) && (e.range === null || validHopRange(e.range)) && confidence(e.confidence) && Array.isArray(e.reasons) && e.reasons.every((r: unknown) => typeof r === 'string') && Array.isArray(e.sources), 'Incertitude de prédiction invalide.');
    keys(e, ['range', 'confidence', 'reasons', 'sources', 'central']); e.sources.forEach(documentarySource);
    if (e.central !== undefined) check(['hop-experimental-v3', 'hop-experimental-v4'].includes(v.engineVersion) && e.range && Number.isFinite(e.central) && e.central >= e.range.min && e.central <= e.range.max && e.confidence === 'low', 'Repère central expérimental invalide.');
    if (e.range !== null) check(e.sources.length > 0 && p.triplet.varietyId && p.triplet.yeastId && p.triplet.timing, 'Valeur prédite sans triplet ou provenance.');
    if (e.range !== null && e.sources.some((s: HopSource) => s.year === null || s.kind === 'judgment')) check(e.confidence === 'low', 'Une source non datée ou un jugement limite la confiance.');
  };
  for (const [axisId, value] of Object.entries(p.profile)) {
    const axis = v.evidence.knowledge.find((a: HopKnowledge) => a.kind === 'axis' && a.id === axisId) as HopAxis | undefined;
    check(axis, 'Axe figé absent.'); estimate(value);
    const range = (value as HopEstimate).range;
    if (range) check(range.min >= axis!.scale.min && range.max <= axis!.scale.max, 'Profil hors échelle.');
  }
  for (const [axisId, value] of Object.entries(v.target)) {
    const axis = v.evidence.knowledge.find((a: HopKnowledge) => a.kind === 'axis' && a.id === axisId) as HopAxis | undefined;
    check(axis && validHopRange(value) && value.min >= axis.scale.min && value.max <= axis.scale.max, 'Cible figée invalide.');
  }
  keys(p.compounds, ['4mmpFree']); Object.values(p.compounds).forEach(estimate); estimate(p.score);
  if (p.score.range) check(p.score.range.min >= 0 && p.score.range.max <= 100, 'Score hors échelle.');
  check(Array.isArray(p.modelRefs) && p.modelRefs.every((r: any) => obj(r) && idValid(r.id) && str(r.version)), 'Versions de modèles absentes.');
  check(new Set(p.modelRefs.map((r: any) => r.id)).size === p.modelRefs.length, 'Modèle figé en double.');
  for (const ref of p.modelRefs) check(v.evidence.knowledge.some((k: HopKnowledge) => (k.kind === 'model' || k.kind === 'extrapolation') && k.id === ref.id && k.version === ref.version), 'Version de modèle absente des données figées.');
  const knownOutputs = [...Object.values(p.profile), ...Object.values(p.compounds)].some(e => (e as HopEstimate).range !== null);
  if (knownOutputs || p.score.range !== null) check(p.modelRefs.length > 0, 'Valeur calculée sans modèle figé.');
  if (p.score.range !== null) check(Object.keys(v.target).some(axisId => p.profile[axisId]?.range != null), 'Score sans axe cible quantifié.');
  const variety = v.evidence.varieties.find((row: { id: string }) => row.id === p.triplet.varietyId);
  const lot = p.triplet.lotId ? v.evidence.lots.find((row: { id: string }) => row.id === p.triplet.lotId) : undefined;
  const yeast = v.evidence.knowledge.find((row: HopKnowledge) => row.kind === 'yeast' && row.id === p.triplet.yeastId);
  const selectedModels = p.modelRefs.flatMap((ref: { id: string; version: string }) => v.evidence.knowledge.filter((row: HopKnowledge) => row.kind === 'model' && row.id === ref.id && row.version === ref.version)) as HopModel[];
  const selectedExtrapolations = p.modelRefs.flatMap((ref: { id: string; version: string }) => v.evidence.knowledge.filter((row: HopKnowledge) => row.kind === 'extrapolation' && row.id === ref.id && row.version === ref.version)) as HopExtrapolation[];
  check(selectedExtrapolations.every(model => model.enabled), 'Modèle expérimental désactivé.');
  if (p.modelRefs.length) {
    check(variety && yeast && (!p.triplet.lotId || (lot && lot.varietyId === variety.id)), 'Entrées du triplet absentes ou incohérentes dans les données figées.');
    const inside = (range: HopRange | null, value: number | null) => range !== null && value !== null && range.min <= value && value <= range.max;
    for (const model of selectedModels) {
      const s = model.scope;
      check(model.enabled && s.varietyId === p.triplet.varietyId && s.yeastId === p.triplet.yeastId && s.timing === p.triplet.timing && s.matrixId === p.triplet.matrixId && s.form === (lot?.form ?? variety.form) && inside(s.doseGL, p.triplet.doseGL) && inside(s.temperatureC, p.triplet.temperatureC) && inside(s.contactHours, p.triplet.contactHours), 'Modèle figé incompatible avec le triplet ou son contexte.');
    }
  }
  for (const [axisId, value] of Object.entries(p.profile)) if ((value as HopEstimate).range !== null) {
    const axis = v.evidence.knowledge.find((row: HopKnowledge) => row.kind === 'axis' && row.id === axisId) as HopAxis;
    check(selectedModels.some((model: HopModel) => model.outputs.some(output => output.target === `axis:${axisId}` && output.axisVersion === axis.version)) ||
      (p.extrapolatedAxes?.includes(axisId) && selectedExtrapolations.some(model => model.axes.some(a => a.id === axisId && a.version === axis.version))), 'Sortie ou version d’axe absente des modèles figés.');
  }
  if (p.compounds['4mmpFree']?.range) check(selectedModels.some((model: HopModel) => model.outputs.some(output => output.target === 'beer:4mmpFree')), 'Sortie chimique absente des modèles figés.');
  if (p.compounds['4mmpFree']?.range) check(p.compounds['4mmpFree'].range.min >= 0, 'Concentration figée négative.');
  check(Array.isArray(p.reasons) && p.reasons.every((r: unknown) => typeof r === 'string') && Array.isArray(p.risks), 'Explications absentes.');
  for (const r of p.risks) {
    check(obj(r) && ['hopCreep', 'fourMmp', 'precursors'].includes(r.code) && ['possible', 'flagged', 'unknown'].includes(r.status) && str(r.title) && str(r.message) && confidence(r.confidence), 'Alerte figée invalide.'); source(r.source);
  }
}
