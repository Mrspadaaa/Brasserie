import { agreedFermentationFact, fermentationProgramIssues } from './fermentationContext.js';
import { HOP_ANALYTES, validHopRange, type HopAnalyte, type HopConfidence, type HopRange, type HopSource, type HopVariety } from './hopIndexSchema.js';
import { resolveHopFacts } from './hopIndexFacts.js';
import { createHopPredictor, scoreHopProfile, usableHopKnowledge, weakestHopConfidence, type HopEngineData } from './hopPredictionCore.js';
import { createHopExtrapolationCache, hopDescriptorEvidence, hopDoseResponse, mixHopDoseShapes } from './hopExtrapolationCore.js';
import { HOP_TIMINGS, assertHopTriplet, type HopAxis, type HopConfidencePolicy, type HopEstimate, type HopPrediction, type HopTriplet, type HopYeast } from './hopPredictionSchema.js';
import type { HopExtrapolation } from './hopExtrapolationSchema.js';
import { fermentationProgramWarnings } from './fermentationScienceCore.js';
import type { FermentationGuide } from './fermentationGuideSchema.js';

export const HOP_RECIPE_ENGINE_VERSION = 'hop-recipe-experimental-v3' as const;
export type HopRecipeEngineVersion = 'hop-recipe-experimental-v1' | 'hop-recipe-experimental-v2' | typeof HOP_RECIPE_ENGINE_VERSION;
// Same editable physical convention: v2 tightens arithmetic; v3 harmonises process diagnostics.
const AGGREGATION_VERSION = 'hop-recipe-experimental-v1';
export interface HopRecipeInput {
  volumeL: number; yeastId: string | null; pitchTempC?: number;
  additions: { id: string; name: string; triplet: HopTriplet; dayOffset?: number }[];
  fermentation: { kind?: string; name?: string; note?: string; tempC?: number; days?: number }[];
}
/** Strict persistence boundary. Unknown process fields stay absent/null, never NaN or invented defaults. */
export function assertHopRecipeInput(value: unknown): asserts value is HopRecipeInput {
  const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
  const check = (ok: unknown, reason: string) => { if (!ok) throw Error(`Recette aromatique : ${reason}.`); };
  const keys = (v: Record<string, any>, allowed: string[]) => check(Object.keys(v).every(k => allowed.includes(k)), 'champ inconnu');
  check(object(value), 'entrée invalide');
  const v = value as Record<string, any>;
  keys(v, ['volumeL', 'yeastId', 'additions', 'fermentation', 'pitchTempC']);
  check(v.pitchTempC === undefined || finite(v.pitchTempC), 'température d’ensemencement invalide');
  check(nonnegative(v.volumeL), 'volume positif ou zéro si inconnu requis');
  assertHopTriplet({ varietyId: null, yeastId: v.yeastId, timing: null, doseGL: null, temperatureC: null, contactHours: null, matrixId: null });
  check(Array.isArray(v.additions) && Array.isArray(v.fermentation), 'ajouts et paliers requis');
  const ids = new Set<string>();
  for (const a of v.additions) {
    check(object(a), 'ajout invalide'); keys(a, ['id', 'name', 'triplet', 'dayOffset']);
    check(typeof a.id === 'string' && a.id.trim() && !ids.has(a.id), 'identifiant d’ajout vide ou dupliqué'); ids.add(a.id);
    check(typeof a.name === 'string' && a.name.trim(), 'nom d’ajout absent');
    assertHopTriplet(a.triplet);
    check(a.triplet.yeastId === v.yeastId, 'une seule souche cohérente pour tous les ajouts');
    check(a.dayOffset === undefined || nonnegative(a.dayOffset), 'jour d’ajout invalide');
  }
  for (const s of v.fermentation) {
    check(object(s), 'palier invalide'); keys(s, ['kind', 'name', 'note', 'tempC', 'days']);
    check(s.note === undefined || typeof s.note === 'string', 'note de palier invalide');
    check((s.kind === undefined || typeof s.kind === 'string') && (s.name === undefined || typeof s.name === 'string'), 'libellé de palier invalide');
    check(s.tempC === undefined || finite(s.tempC), 'température de palier invalide');
    check(s.days === undefined || nonnegative(s.days), 'durée de palier invalide');
  }
}
export interface HopRecipeChemicalAmount {
  analyte: HopAnalyte; unit: 'mg' | 'ug' | 'mL'; basis: 'introduced';
  range: HopRange | null;
  /** Nominal arithmetic from reported points; NEVER an invented analytical margin. */
  reported?: number;
  confidence: HopConfidence; sources: HopSource[]; reasons: string[];
  coverage: { knownAdditions: number; totalAdditions: number };
  /** Known contributions only; these are not bounds on the whole recipe. */
  partialRange?: HopRange; partialReported?: number;
}
export interface HopRecipePrediction {
  engineVersion: HopRecipeEngineVersion; input: HopRecipeInput;
  additions: HopPrediction[];
  overall: Omit<HopPrediction, 'triplet'> & { conditionalEnvelope: true; interactionsNonQuantifiees: boolean };
  chemistry: { introduced: Record<string, HopRecipeChemicalAmount>; final: Record<string, HopEstimate & { unit: 'ngL' | null }> };
  warnings: string[];
}
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const nonnegative = (x: unknown): x is number => finite(x) && x >= 0;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const unknown = (reason: string): HopEstimate => ({ range: null, confidence: 'low', sources: [], reasons: [reason] });
const sources = (rows: HopSource[]) => [...new Map(rows.map(s => [JSON.stringify(s), s])).values()];
const add = (a: HopRange, b: HopRange): HopRange => ({ min: a.min + b.min, max: a.max + b.max });
// Log products preserve compensation of small/large positive factors. No statistical independence is assumed.
const product = (xs: number[]) => xs.some(x => x === 0) ? 0 : Math.exp(xs.reduce((sum, x) => sum + Math.log(x), 0));
const mul = (...xs: HopRange[]): HopRange => ({ min: product(xs.map(x => x.min)), max: product(xs.map(x => x.max)) });
const widen = (estimates: HopEstimate[]): HopEstimate => {
  if (!estimates.length) return unknown('Convention de cumul absente ou inutilisable.');
  if (estimates.some(e => !e.range)) return unknown('Un modèle de cumul applicable ne borne pas cet axe.');
  return { range: { min: Math.min(...estimates.map(e => e.range!.min)), max: Math.max(...estimates.map(e => e.range!.max)) },
    confidence: 'low', sources: sources(estimates.flatMap(e => e.sources)), reasons: [...new Set(estimates.flatMap(e => e.reasons))],
    ...(estimates.length === 1 && estimates[0].central !== undefined ? { central: estimates[0].central } : {}) };
};

/** Same agreement requirement as catalogueSolverFacts: all temperature facts must
 * be explicit, identical Celsius ranges. Never merge conflicts or qualified bounds. */
function recipeFermentationWarnings(input: HopRecipeInput, yeast: HopYeast | undefined, guide: FermentationGuide | undefined): string[] {
  const stages = input.fermentation;
  const knownKinds = ['primaire', 'reposDiacetyle', 'ajout', 'garde'];
  const ambiguous = stages.filter(s => !s.kind || !knownKinds.includes(s.kind));
  const ambiguousWarnings = ambiguous.map(s => `${s.name || 'Palier'} : phase non précisée ; vérifier sa température avec la conduite de la souche.`);
  if (guide) return [...fermentationProgramWarnings(guide, stages), ...ambiguousWarnings];
  const temperatures = (yeast?.catalogue?.facts ?? []).filter(f => f.key === 'temperature');
  const first = temperatures[0];
  const agrees = first?.range && temperatures.every(t => t.range && t.unit === '°C' && t.qualifier === 'range' && t.range.min === first.range!.min && t.range.max === first.range!.max);
  if (!agrees) return [...ambiguousWarnings, temperatures.length ? 'Températures fabricant divergentes ou qualifiées : aucune fenêtre fusionnée ; comparer les fiches de la souche.' : 'Souche sans conduite documentée : vérifier sa fiche et les températures saisies.'];
  const range = first.range!;
  const checkable = stages.filter(s => s.kind === 'primaire' || s.kind === 'reposDiacetyle' || !s.kind || !knownKinds.includes(s.kind));
  const warnings = checkable.flatMap(s => !finite(s.tempC) ? [`${s.name || 'Palier'} : température inconnue.`]
    : s.tempC < range.min || s.tempC > range.max ? [`${s.name || 'Palier'} : ${s.tempC} °C hors de la fenêtre fabricant ${range.min}–${range.max} °C de ${yeast!.name}${!s.kind || !knownKinds.includes(s.kind) ? ' ; phase non précisée, à vérifier' : ''}.`] : []);
  return [...ambiguousWarnings, ...warnings];
}

function pooledDose(dose: number | null, axisId: string, timing: HopTriplet['timing'], model: HopExtrapolation, knownMinimum = 0) {
  const t = model.timings[timing!], a = model.axes.find(a => a.id === axisId)!;
  if (dose === null) {
    const lower = hopDoseResponse(knownMinimum, t.halfSaturationGL.range.max, a.doseScale.range.max);
    const generic = { min: lower, max: 1 };
    const reference = model.doseReferences?.find(r => r.axisId === axisId && r.timings.includes(timing!));
    // An unknown dose can exceed the observed curve: its transferred shape still
    // spans 0–1. The positive saturating component retains the known dose floor.
    return { range: reference ? mixHopDoseShapes(generic, { min: 0, max: 1 }, reference.transferWeight.range) : generic, central: undefined };
  }
  let range = { min: hopDoseResponse(dose, t.halfSaturationGL.range.max, a.doseScale.range.max), max: hopDoseResponse(dose, t.halfSaturationGL.range.min, a.doseScale.range.min) };
  let central: number | undefined = hopDoseResponse(dose, t.halfSaturationGL.central, a.doseScale.central);
  const ref = model.doseReferences?.find(r => r.axisId === axisId && r.timings.includes(timing!));
  if (ref) {
    const i = ref.points.findIndex((p, i) => i > 0 && dose <= p.doseGL);
    let observed: HopRange = { min: 0, max: 1 }, middle: number | undefined;
    if (dose === 0) { observed = { min: 0, max: 0 }; middle = 0; }
    else if (i > 0) {
      const l = ref.points[i - 1], r = ref.points[i];
      middle = l.value + (r.value - l.value) * (dose - l.doseGL) / (r.doseGL - l.doseGL);
      observed = { min: clamp(middle * (1 - ref.relativeError.range.max)), max: clamp(middle * (1 + ref.relativeError.range.max)) };
    }
    range = mixHopDoseShapes(range, observed, ref.transferWeight.range);
    central = middle === undefined ? ref.transferWeight.central === 0 ? central : undefined : (1 - ref.transferWeight.central) * central + ref.transferWeight.central * middle;
  }
  return { range, central };
}

/** Conditional model envelope. Events are retained; only their phase's dose pressure is pooled.
 * Unknown mixture interactions are NOT claimed to lie inside this interval. */
function aggregateModel(input: HopRecipeInput, data: HopEngineData, axes: HopAxis[], yeast: HopYeast, model: HopExtrapolation, version: HopRecipeEngineVersion): Record<string, HopEstimate> {
  const cache = createHopExtrapolationCache(), varieties = new Map(data.varieties.map(v => [v.id, v])), lots = new Map(data.lots.map(l => [l.id, l]));
  const strain = model.yeasts.find(y => y.yeastId === yeast.id);
  const active = input.additions.filter(a => a.triplet.doseGL !== 0);
  const invalidTiming = active.some(a => !a.triplet.timing || !HOP_TIMINGS.includes(a.triplet.timing));
  const commonReasons = [...model.aggregation!.limitations, 'Plage conditionnelle aux hypothèses du modèle ; interactions du mélange non quantifiées, aucun taux de couverture statistique.',
    'La levure, la matrice et les paramètres communs sont partagés entre les ajouts. Aucune réduction d’incertitude par nombre d’ajouts.',
    'Les paliers sont conservés et contrôlés ; leur effet aromatique quantitatif n’est pas étalonné.'];
  const result: Record<string, HopEstimate> = {};
  for (const axis of axes) {
    const definition = model.axes.find(a => a.id === axis.id && a.version === axis.version);
    if (!definition) { result[axis.id] = unknown('Axe absent de cette convention de cumul.'); continue; }
    const aroma = strain?.aroma[axis.id] ?? strain?.otherAroma ?? model.defaultYeast.aroma;
    const expression = strain?.expression[axis.id] ?? strain?.otherExpression ?? model.defaultYeast.expression;
    const evidence: HopSource[] = [model.source, model.aggregation!.source, axis.source, definition.source, definition.doseScale.source, aroma.source, expression.source,
      model.gain.source, model.matrix.source, model.residual.source, ...model.evidence, ...(strain ? [strain.source, ...strain.evidence] : [])];
    if (invalidTiming) {
      result[axis.id] = { range: { ...axis.scale }, confidence: 'low', sources: sources(evidence), reasons: [...commonReasons, 'Phase inconnue pour un ajout : domaine complet, sans phase ni repère central inventé.'] };
      continue;
    }
    let latent: HopRange = { min: 0, max: 0 }, centralLatent = 0, hasCentral = !!strain, margin = 0, supported = !!strain?.aroma[axis.id];
    const reasons: string[] = [];
    for (const phase of HOP_TIMINGS) {
      const rows = active.filter(a => a.triplet.timing === phase);
      if (!rows.length) continue;
      const t = model.timings[phase];
      const doseKnown = rows.every(a => nonnegative(a.triplet.doseGL));
      const total = doseKnown ? rows.reduce((sum, a) => sum + a.triplet.doseGL!, 0) : null;
      const knownDose = rows.reduce((sum, a) => sum + (nonnegative(a.triplet.doseGL) ? a.triplet.doseGL : 0), 0);
      const dose = pooledDose(total !== null && finite(total) ? total : null, axis.id, phase, model,
        version === 'hop-recipe-experimental-v1' || !finite(knownDose) ? 0 : knownDose);
      let weighted: HopRange = { min: 0, max: 0 }, centralWeighted = 0;
      const contributions: HopRange[] = [];
      let groupUnknown = total === null || !finite(total);
      evidence.push(t.expression.source, t.halfSaturationGL.source, (t.decayHours ?? t.extractionHours).source, t.temperatureC.source);
      const ref = model.doseReferences?.find(r => r.axisId === axis.id && r.timings.includes(phase));
      if (ref) evidence.push(ref.source, ref.evidence, ref.transferWeight.source, ref.relativeError.source);
      if (groupUnknown && version === 'hop-recipe-experimental-v1') reasons.push('Dose manquante : tout le domaine de la phase reste possible, sans moyenne imputée.');
      for (const row of rows) {
        const triplet = row.triplet, variety = varieties.get(triplet.varietyId ?? ''), lot = triplet.lotId ? lots.get(triplet.lotId) : undefined;
        const badLot = !!triplet.lotId && (!lot || lot.varietyId !== triplet.varietyId);
        const knownVariety = variety && !badLot ? variety : undefined;
        const matches = knownVariety ? hopDescriptorEvidence(knownVariety, definition.terms, cache) : [];
        const anyDescription = knownVariety && model.axes.some(a => hopDescriptorEvidence(knownVariety, a.terms, cache).length);
        const descriptor = matches.length ? model.descriptor.mentioned : anyDescription ? model.descriptor.unmentioned : model.descriptor.unknown;
        supported ||= matches.length > 0;
        const time = triplet.contactHours;
        const contact: HopRange = !nonnegative(time) ? { min: 0, max: 1 } : t.decayHours ? { min: Math.exp(-time / t.decayHours.range.min), max: Math.exp(-time / t.decayHours.range.max) }
          : { min: -Math.expm1(-time / t.extractionHours.range.max), max: -Math.expm1(-time / t.extractionHours.range.min) };
        const contactCentral = !nonnegative(time) ? undefined : t.decayHours ? Math.exp(-time / t.decayHours.central) : -Math.expm1(-time / t.extractionHours.central);
        contributions.push(mul(descriptor.range, contact));
        const temperatureUncertain = !finite(triplet.temperatureC) || triplet.temperatureC < t.temperatureC.range.min || triplet.temperatureC > t.temperatureC.range.max;
        const formKnown = !!knownVariety && (lot?.form ?? knownVariety.form) !== 'unknown';
        const documentary = matches.length ? Math.min(...matches.map(m => model.sourceUncertainty[m.source.kind].range.max + (m.source.year === null ? model.undatedUncertainty.range.max : 0)))
          : Math.max(...Object.values(model.sourceUncertainty).map(p => p.range.max)) + model.undatedUncertainty.range.max;
        margin = Math.max(margin, documentary + (formKnown ? 0 : model.unknownFormUncertainty.range.max) + (temperatureUncertain ? t.outsideTemperatureUncertainty.range.max : 0));
        evidence.push(descriptor.source, ...matches.flatMap(m => [m.source, model.sourceUncertainty[m.source.kind].source]));
        if (!matches.length) evidence.push(...Object.values(model.sourceUncertainty).map(p => p.source), model.undatedUncertainty.source);
        if (matches.some(m => m.source.year === null)) evidence.push(model.undatedUncertainty.source);
        if (!formKnown) evidence.push(model.unknownFormUncertainty.source);
        if (temperatureUncertain) evidence.push(t.outsideTemperatureUncertainty.source);
        if (badLot) reasons.push('Lot absent ou incompatible : aucune substitution implicite par une autre variété.');
        if (!knownVariety || contactCentral === undefined) hasCentral = false;
        if (!groupUnknown && total! > 0) {
          const weight = triplet.doseGL! / total!;
          const contribution = mul(descriptor.range, contact, { min: weight, max: weight });
          weighted = add(weighted, contribution);
          centralWeighted += weight * descriptor.central * (contactCentral ?? 0);
        }
      }
      // Ratios with an unknown dose cannot be evaluated by separately imputing numerator/denominator.
      if (groupUnknown) {
        // Every possible dose allocation is a convex combination of the same
        // descriptor/contact contributions. No weights or missing doses are imputed.
        // Keep the historical rectangle exactly for frozen v1 predictions.
        weighted = version === 'hop-recipe-experimental-v1' ? { min: 0, max: 1 }
          : { min: Math.min(...contributions.map(c => c.min)), max: Math.max(...contributions.map(c => c.max)) };
        hasCentral = false;
        if (version !== 'hop-recipe-experimental-v1') reasons.push('Dose manquante : les contacts et descripteurs connus bornent toutes les répartitions possibles ; aucune quantité n’est imputée.');
      }
      latent = add(latent, mul(dose.range, weighted, t.expression.range));
      if (dose.central === undefined) hasCentral = false;
      else centralLatent += dose.central * centralWeighted * t.expression.central;
    }
    // Shared positive factors are outside the sum. No fresh yeast/matrix draw per hop or event.
    const hop = mul(latent, expression.range, model.gain.range, model.matrix.range);
    const uncertainty = margin * -Math.expm1(-hop.max);
    const low = clamp(-Math.expm1(-(hop.min + aroma.range.min)) + model.residual.range.min - uncertainty);
    const high = clamp(-Math.expm1(-(hop.max + aroma.range.max)) + model.residual.range.max + uncertainty);
    const span = axis.scale.max - axis.scale.min;
    const range = { min: axis.scale.min + span * low, max: axis.scale.min + span * high };
    const central = axis.scale.min + span * clamp(-Math.expm1(-(product([centralLatent, expression.central, model.gain.central, model.matrix.central]) + aroma.central)) + model.residual.central);
    const completeDomain = low === 0 && high === 1;
    result[axis.id] = { range: validHopRange(range) ? range : { ...axis.scale }, confidence: 'low', sources: sources(evidence),
      reasons: [...commonReasons, ...new Set(reasons), supported ? 'Famille documentée ; intensité du mélange extrapolée.' : 'Famille sans support aromatique spécifique : aucune présence établie.',
        ...(completeDomain ? ['Domaine complet : le modèle ne discrimine aucune intensité.'] : [])],
      ...(hasCentral && supported && !completeDomain && finite(central) && central >= range.min && central <= range.max ? { central } : {}) };
  }
  return result;
}

/** SI conversions only. No oil density, enzyme yield, or beer retention is assumed. */
function introducedChemistry(input: HopRecipeInput, data: HopEngineData, policies: HopConfidencePolicy[]): Record<string, HopRecipeChemicalAmount> {
  const rows = input.additions.filter(a => a.triplet.doseGL !== 0);
  const resolved = rows.map(a => {
    const variety = data.varieties.find(v => v.id === a.triplet.varietyId), lot = a.triplet.lotId ? data.lots.find(l => l.id === a.triplet.lotId) : undefined;
    const badLot = !!a.triplet.lotId && (!lot || lot.varietyId !== a.triplet.varietyId);
    return { row: a, facts: badLot ? [] : resolveHopFacts(lot, variety) };
  });
  return Object.fromEntries(HOP_ANALYTES.map(analyte => {
    const unit = analyte === 'totalOil' ? 'mL' as const : ['alpha', 'beta'].includes(analyte) ? 'mg' as const : 'ug' as const;
    if (analyte === 'hsi') return [analyte, { analyte, unit, basis: 'introduced', range: null, confidence: 'low', sources: [],
      reasons: ['Le HSI est un indice de stockage ; il ne représente aucune quantité introduite additionnable.'], coverage: { knownAdditions: 0, totalAdditions: rows.length } } satisfies HopRecipeChemicalAmount];
    let bounded = 0, pointed = 0, known = 0, partialRange: HopRange = { min: 0, max: 0 }, partialReported = 0, confidence: HopConfidence = 'high';
    const evidence: HopSource[] = [], reasons = ['Quantité introduite par les houblons ; ni quantité extraite ni concentration finale en bière.'];
    for (const { row, facts } of resolved) {
      const fact = facts.find(f => f.analyte === analyte), m = fact?.measurement;
      if (m) evidence.push(m.source);
      const massG = nonnegative(row.triplet.doseGL) && finite(input.volumeL) && input.volumeL > 0 ? row.triplet.doseGL * input.volumeL : NaN;
      if (!m || !fact?.compatible || m.basis !== 'asIs' || !nonnegative(massG)) { reasons.push(!nonnegative(massG) ? 'Dose ou volume manquant.' : 'Mesure, forme ou base massique sur produit tel quel manquante.'); continue; }
      let factor: number | undefined;
      if (unit === 'mL' && m.unit === 'ml100g') factor = massG / 100;
      if (unit !== 'mL') {
        // First obtain milligrams, then choose the displayed exact SI unit.
        const toMg = m.unit === 'percentMass' ? massG * 10 : m.unit === 'mg100g' ? massG / 100 : m.unit === 'ugKg' ? massG / 1e6 : undefined;
        if (toMg !== undefined) factor = toMg * (unit === 'ug' ? 1000 : 1);
      }
      if (factor === undefined || !finite(factor)) { reasons.push('Unité non additionnable : pourcentage d’huile, équivalent analytique ou indice conservé comme information documentaire.'); continue; }
      const candidateRange = fact.range ? { min: fact.range.min * factor, max: fact.range.max * factor } : null;
      const candidatePoint = m.kind === 'point' && nonnegative(m.value) ? m.value * factor : undefined;
      const range = candidateRange && validHopRange(candidateRange) ? candidateRange : null;
      const point = finite(candidatePoint) ? candidatePoint : undefined;
      if (range) { bounded++; partialRange = add(partialRange, range); }
      if (point !== undefined) { pointed++; partialReported += point; }
      if (range || point !== undefined) {
        known++;
        // Same invariant as contextual predictions: a labelled high confidence does
        // not overrule the editable source caps, judgment, or missing provenance year.
        const cap = !policies.length || m.source.kind === 'judgment' || m.source.year === null ? 'low'
          : weakestHopConfidence(...policies.map(p => p.caps[m.source.kind]));
        confidence = weakestHopConfidence(confidence, fact.confidence, cap);
        evidence.push(...policies.map(p => p.source));
        if (m.source.kind === 'judgment') reasons.push('Valeur issue d’un jugement : confiance faible, même si la mesure déclare une confiance supérieure.');
        if (m.source.year === null) reasons.push('Année de la source analytique inconnue : confiance faible.');
        if (!policies.length) reasons.push('Politique de fiabilité des sources absente : confiance faible.');
      }
      if ((candidateRange && !validHopRange(candidateRange)) || (candidatePoint !== undefined && !finite(candidatePoint))) reasons.push('Conversion hors du domaine numérique fini : quantité inconnue.');
      reasons.push(...fact.reasons);
    }
    const allBounds = bounded === rows.length, allPoints = pointed === rows.length;
    const sumOverflow = (bounded > 0 && !validHopRange(partialRange)) || (pointed > 0 && !finite(partialReported));
    if (sumOverflow) reasons.push('Somme hors du domaine numérique fini : quantité totale inconnue.');
    const amount: HopRecipeChemicalAmount = { analyte, unit, basis: 'introduced', range: allBounds && validHopRange(partialRange) ? partialRange : null,
      confidence: allBounds && rows.length && !sumOverflow ? confidence : 'low', sources: sources(evidence), reasons: [...new Set(reasons)], coverage: { knownAdditions: known, totalAdditions: rows.length },
      ...(allPoints && finite(partialReported) ? { reported: partialReported } : {}),
      ...(!allBounds && bounded > 0 && validHopRange(partialRange) ? { partialRange } : {}),
      ...(!allPoints && pointed > 0 && finite(partialReported) ? { partialReported } : {}) };
    if (!allBounds) amount.reasons.push('Incertitude totale inconnue ; les contributions partielles ne représentent pas la recette entière.');
    if (allPoints && !allBounds) amount.reasons.push('Calcul nominal des valeurs rapportées ; marge analytique non publiée, aucun intervalle inventé.');
    return [analyte, amount];
  }));
}

/** Local O(additions × axes × models), with no search, network, persistence, or recipe mutation. */
export function predictHopRecipe(input: HopRecipeInput, target: Record<string, HopRange>, data: HopEngineData, version: HopRecipeEngineVersion = HOP_RECIPE_ENGINE_VERSION): HopRecipePrediction {
  if (!['hop-recipe-experimental-v1', 'hop-recipe-experimental-v2', HOP_RECIPE_ENGINE_VERSION].includes(version)) throw Error('Version du calcul de recette inconnue.');
  const warnings: string[] = [];
  const normalized: HopRecipeInput = { ...input, additions: (input.additions ?? []).map(a => ({ ...a, triplet: { ...a.triplet, yeastId: input.yeastId } })), fermentation: (input.fermentation ?? []).map(s => ({ ...s })) };
  if ((input.additions ?? []).some(a => a.triplet.yeastId !== input.yeastId)) warnings.push('La souche de la recette est utilisée pour tous les ajouts ; une référence de souche différente a été écartée.');
  const { valid, errors } = usableHopKnowledge(data.knowledge), axes = valid.filter((v): v is HopAxis => v.kind === 'axis');
  warnings.push(...errors);
  const yeast = new Map(valid.filter((v): v is HopYeast => v.kind === 'yeast').map(v => [v.id, v])).get(input.yeastId ?? '');
  const guide = valid.find(v => v.kind === 'fermentation' && v.yeastId === input.yeastId && (version !== HOP_RECIPE_ENGINE_VERSION || v.enabled));
  const hasDryHop = normalized.additions.some(a => a.triplet.doseGL !== 0 && (a.triplet.timing === 'fermentation' || a.triplet.timing === 'postFermentation'));
  if (version === HOP_RECIPE_ENGINE_VERSION) {
    const temperature = (guide?.kind === 'fermentation' ? guide.temperatureC : undefined) ?? agreedFermentationFact(yeast, 'temperature', '°C');
    warnings.push(...fermentationProgramIssues(normalized.fermentation, temperature, { hasDryHop, pitchTempC: input.pitchTempC }).map(i => i.message));
  } else {
    // Frozen v1/v2 predictions replay their original diagnostics as well as numbers.
    warnings.push(...recipeFermentationWarnings(normalized, yeast, guide?.kind === 'fermentation' ? guide : undefined));
    if (normalized.fermentation.some(s => s.kind === 'ajout') && !hasDryHop) warnings.push('Le programme annonce un ajout en fermentation, mais aucun houblon à cru n’est saisi.');
  }
  const predict = createHopPredictor(data), additions = normalized.additions.map(a => predict(a.triplet, target));
  const models = valid.filter((v): v is HopExtrapolation => v.kind === 'extrapolation' && v.enabled && v.aggregation?.version === AGGREGATION_VERSION);
  const profiles = yeast ? models.map(m => aggregateModel(normalized, data, axes, yeast, m, version)) : [];
  const profile = Object.fromEntries(axes.map(a => [a.id, yeast ? widen(profiles.map(p => p[a.id])) : unknown('Levure de recette inconnue : aucune prédiction sensorielle sans contexte de souche.') ]));
  const policies = valid.filter((v): v is HopConfidencePolicy => v.kind === 'confidence');
  const activePredictions = additions.filter((_, i) => normalized.additions[i].triplet.doseGL !== 0);
  // Only a whole, single-addition contextual result may be reused. Never sum beer endpoints.
  if (activePredictions.length === 1) {
    const one = activePredictions[0];
    for (const a of axes) if (one.profile[a.id]?.range && !one.extrapolatedAxes?.includes(a.id)) profile[a.id] = one.profile[a.id];
  }
  const finalKeys = [...new Set(['4mmpFree', ...additions.flatMap(p => Object.keys(p.compounds))])];
  const final = Object.fromEntries(finalKeys.map(key => [key, { ...(activePredictions.length === 1 && activePredictions[0].compounds[key]?.range ? activePredictions[0].compounds[key] : unknown('Concentration finale non calculable pour cette recette : aucun bilan de transformation du mélange étalonné.')), unit: key === '4mmpFree' ? 'ngL' as const : null } ]));
  const risks = [...new Map(activePredictions.flatMap(p => p.risks).map(r => [JSON.stringify(r), r])).values()];
  const overall: HopRecipePrediction['overall'] = { profile, compounds: final, score: scoreHopProfile(profile, target, axes, policies), risks,
    modelRefs: [...new Map([...models.map(m => ({ id: m.id, version: m.version })), ...(activePredictions.length === 1 ? activePredictions[0].modelRefs : [])].map(m => [JSON.stringify(m), m])).values()],
    reasons: profiles.length ? ['Cumul expérimental conditionnel aux paramètres ; aucune garantie sur les interactions sensorielles du mélange.'] : ['Convention de cumul ou levure disponible manquante.'],
    extrapolatedAxes: axes.filter(a => profile[a.id]?.range && !(activePredictions.length === 1 && !activePredictions[0].extrapolatedAxes?.includes(a.id) && activePredictions[0].profile[a.id]?.range)).map(a => a.id),
    conditionalEnvelope: true, interactionsNonQuantifiees: normalized.additions.filter(a => a.triplet.doseGL !== 0).length > 1 };
  return { engineVersion: version, input: normalized, additions, overall, chemistry: { introduced: introducedChemistry(normalized, data, policies), final }, warnings: [...new Set(warnings)] };
}
