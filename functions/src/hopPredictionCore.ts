import { HopConfidence, HopLot, HopRange, HopSource, HopVariety, validHopRange } from './hopIndexSchema.js';
import { ResolvedHopFact, resolveHopFacts } from './hopIndexFacts.js';
import { extrapolateHopProfile, createHopExtrapolationCache } from './hopExtrapolationCore.js';
import { extrapolateHopProfile as extrapolateHopProfileV3 } from './hopExtrapolationV3.js';
import type { HopExtrapolation } from './hopExtrapolationSchema.js';
import { HopAxis, HopConfidencePolicy, HopEstimate, HopKnowledge, HopModel, HopModelOutput, HopPrediction, HopRisk, HopRiskPolicy, HopTasting, HopTriplet, HopYeast, assertHopKnowledge, assertHopTriplet } from './hopPredictionSchema.js';

const rank: Record<HopConfidence, number> = { low: 0, medium: 1, high: 2 };
export const weakestHopConfidence = (...values: HopConfidence[]): HopConfidence => values.reduce((a, b) => rank[a] <= rank[b] ? a : b, 'high');
const empty = (reason: string): HopEstimate => ({ range: null, confidence: 'low', reasons: [reason], sources: [] });
const add = (a: HopRange, b: HopRange): HopRange => ({ min: a.min + b.min, max: a.max + b.max });
const multiply = (a: HopRange, b: HopRange): HopRange => {
  const ends = [a.min * b.min, a.min * b.max, a.max * b.min, a.max * b.max];
  return { min: Math.min(...ends), max: Math.max(...ends) };
};
const contains = (support: HopRange, range: HopRange) => support.min <= range.min && support.max >= range.max;
const pointIn = (support: HopRange | null, v: number | null) => support !== null && v !== null && Number.isFinite(v) && support.min <= v && v <= support.max;

export interface HopEngineData { varieties: HopVariety[]; lots: HopLot[]; knowledge: HopKnowledge[] }
export function usableHopKnowledge(rows: HopKnowledge[]) {
  const valid: HopKnowledge[] = [], errors: string[] = [];
  for (const row of rows) {
    try { assertHopKnowledge(row); valid.push(row); }
    catch { errors.push(`Connaissance ${row?.id ?? 'sans identifiant'} inutilisable ; calcul dégradé.`); }
  }
  return { valid, errors };
}
function sourceCap(source: HopSource, policies: HopConfidencePolicy[]): HopConfidence {
  if (!policies.length || source.year === null || source.kind === 'judgment') return 'low';
  return weakestHopConfidence(...policies.map(p => p.caps[source.kind]));
}
function evaluateOutput(output: HopModelOutput, model: HopModel, facts: ResolvedHopFact[], policies: HopConfidencePolicy[], dose: number | null): HopEstimate {
  const sources = [model.source], reasons: string[] = [];
  let level = weakestHopConfidence(model.confidence, sourceCap(model.source, policies));
  const take = (source: HopSource) => { sources.push(source); level = weakestHopConfidence(level, sourceCap(source, policies)); };
  const c = output.calibration;
  let computed: HopRange | null = null;
  if (output.doseCurve && dose !== null) {
    const curve = output.doseCurve;
    const i = curve.points.findIndex((p, index) => index > 0 && dose <= p.doseGL);
    if (i < 1 || dose < curve.points[0].doseGL) return empty('Dose hors des observations ; aucune prolongation implicite de la courbe.');
    const left = curve.points[i-1], right = curve.points[i];
    const mean = left.value + (right.value-left.value) * (dose-left.doseGL) / (right.doseGL-left.doseGL);
    computed = { min: mean + curve.residual.range.min, max: mean + curve.residual.range.max };
    take(curve.source); take(curve.residual.source); level = 'low';
    reasons.push('Interpolation locale de moyennes publiées, avec marge exploratoire. Ni panel indépendant ni intervalle statistique de prédiction.', curve.method);
  }
  if (c) {
    const inputs = c.terms.map(t => ({ term: t, fact: facts.find(f => f.analyte === t.analyte) }));
    // A known incompatible unit/form/domain cannot be replaced by a generic envelope.
    const outside = inputs.some(({ term, fact }) => fact?.measurement && (fact.measurement.unit !== term.unit || fact.measurement.basis !== term.basis || !fact.compatible || (fact.range && !contains(term.support, fact.range)) || (fact.measurement.kind === 'point' && !pointIn(term.support, fact.measurement.value ?? null))));
    if (outside) return empty('COA ou référence hors du domaine de l’étalonnage ; aucune extrapolation.');
    if (inputs.every(({ fact }) => fact?.range && fact.compatible)) {
      take(c.intercept.source); take(c.residual.source);
      computed = add(c.intercept.range, c.residual.range);
      for (const { term, fact } of inputs) {
        take(term.coefficient.source); take(fact!.measurement!.source);
        level = weakestHopConfidence(level, fact!.confidence);
        computed = add(computed, multiply(term.coefficient.range, fact!.range!));
        reasons.push(`${term.analyte} : ${fact!.origin === 'lot' ? 'COA du lot' : 'plage variétale'}.`);
        if (fact!.measurement!.source.year === null) reasons.push('Année de la source analytique inconnue : confiance réduite.');
      }
      reasons.push('Étalonnage conjoint, incertitude des paramètres et résidu inclus ; aucune somme de voies enzymatiques.');
    } else {
      reasons.push('Mesures ou marges manquantes : confiance faible.'); level = 'low';
      if (output.envelope) {
        // Missing precision must not yield a tighter band than knowing a supported input.
        take(c.intercept.source); take(c.residual.source); take(output.envelope.source);
        let domain = add(c.intercept.range, c.residual.range);
        for (const term of c.terms) { take(term.coefficient.source); domain = add(domain, multiply(term.coefficient.range, term.support)); }
        computed = { min: Math.min(domain.min, output.envelope.range.min), max: Math.max(domain.max, output.envelope.range.max) };
        reasons.push('Enveloppe observée élargie au domaine complet de l’étalonnage ; aucune précision gagnée par une donnée absente.');
      }
    }
    reasons.push(c.method);
  }
  if (!computed && output.envelope) {
    computed = { ...output.envelope.range }; take(output.envelope.source);
    reasons.push('Enveloppe observée dans le contexte du modèle ; ce n’est pas un intervalle statistique de confiance.');
  }
  if (!computed || !validHopRange(computed)) return empty('Données insuffisantes pour quantifier cette sortie.');
  reasons.push(model.scope.notes);
  return { range: computed, confidence: level, reasons, sources: [...new Map(sources.map(s => [JSON.stringify(s), s])).values()] };
}
function combine(estimates: HopEstimate[]): HopEstimate {
  const known = estimates.filter(e => e.range);
  if (!known.length) return empty(estimates.flatMap(e => e.reasons).join(' ') || 'Aucun modèle documenté pour ce triplet et ce contexte.');
  const range = { min: Math.min(...known.map(e => e.range!.min)), max: Math.max(...known.map(e => e.range!.max)) };
  const conflict = Math.max(...known.map(e => e.range!.min)) > Math.min(...known.map(e => e.range!.max));
  return { range, confidence: conflict || known.length < estimates.length ? 'low' : weakestHopConfidence(...known.map(e => e.confidence)),
    ...(known.length === 1 && known[0].central !== undefined ? { central: known[0].central } : {}),
    sources: known.flatMap(e => e.sources), reasons: [...new Set(estimates.flatMap(e => e.reasons)), ...(known.length > 1 ? ['Plusieurs modèles : union des plages, sans moyenne ni addition.'] : []), ...(conflict ? ['Résultats contradictoires ; confiance réduite.'] : [])] };
}

/** Exact extrema of a weighted mean over independent positive weight intervals.
 * At an optimum, dR/dw_i = (error_i - R) / sum(w): weights switch once in
 * sorted error order. Enumerate those n+1 vertices, retaining the SAME weight
 * in numerator and denominator. Normalize each vertex separately to avoid overflow.
 */
function weightedDistanceBound(items: { distance: HopRange; weight: HopRange }[], maximum: boolean): number {
  const rows = items.map(item => ({ error: maximum ? item.distance.max : item.distance.min, weight: item.weight }))
    .sort((a, b) => maximum ? b.error - a.error : a.error - b.error);
  let best = maximum ? 0 : 1;
  for (let split = 0; split <= rows.length; split++) {
    const chosen = rows.map((row, i) => i < split ? row.weight.max : row.weight.min);
    const scale = Math.max(...chosen);
    let numerator = 0, denominator = 0;
    rows.forEach((row, i) => { const weight = chosen[i] / scale; numerator += row.error * weight; denominator += weight; });
    const mean = numerator / denominator;
    best = maximum ? Math.max(best, mean) : Math.min(best, mean);
  }
  return best;
}

/** Distance to the requested interval; unknown axes contribute [0,1], never zero alone. */
export function scoreHopProfile(profile: Record<string, HopEstimate>, target: Record<string, HopRange>, axes: HopAxis[], policies: HopConfidencePolicy[] = []): HopEstimate {
  const requested = Object.entries(target);
  if (!requested.length) return empty('Choisir au moins un axe cible.');
  const distances: { distance: HopRange; weight: HopRange }[] = [];
  let known = 0, level: HopConfidence = 'high'; const reasons: string[] = [], sources: HopSource[] = [];
  for (const [id, desired] of requested) {
    const axis = axes.find(a => a.id === id);
    if (!axis || !validHopRange(desired) || !contains(axis.scale, desired) || !validHopRange(axis.weight.range) || axis.weight.range.min <= 0) return empty('Axe cible inconnu, poids invalide ou plage hors échelle.');
    const predicted = profile[id]?.range;
    let distance: HopRange = { min: 0, max: 1 };
    if (predicted) {
      const span = axis.scale.max - axis.scale.min;
      const nearest = Math.max(0, desired.min - predicted.max, predicted.min - desired.max);
      const furthest = Math.max(0, desired.min - predicted.min, predicted.max - desired.max);
      distance = { min: Math.min(1, nearest / span), max: Math.min(1, furthest / span) }; known++;
    } else reasons.push(`${axis.name} : inconnu, score élargi.`);
    distances.push({ distance, weight: axis.weight.range });
    level = weakestHopConfidence(level, profile[id]?.confidence ?? 'low', sourceCap(axis.weight.source, policies)); sources.push(axis.weight.source);
  }
  if (!known) return empty('Aucun axe cible quantifiable pour ce triplet.');
  return { range: { min: Math.max(0, 100 * (1 - weightedDistanceBound(distances, true))), max: Math.min(100, 100 * (1 - weightedDistanceBound(distances, false))) }, confidence: level, sources,
    reasons: [...reasons, 'Adéquation à la cible par distance normalisée ; ce score n’est ni une intensité ni une probabilité.'] };
}
function risksFor(triplet: HopTriplet, facts: ResolvedHopFact[], compounds: Record<string, HopEstimate>, yeast: HopYeast | undefined, policies: HopRiskPolicy[], reliability: HopConfidencePolicy[]): HopRisk[] {
  const risks: HopRisk[] = [];
  for (const p of policies.filter(p => p.enabled)) {
    const base = { code: p.risk, title: p.name, source: p.source, confidence: sourceCap(p.source, reliability) };
    if (p.risk === 'hopCreep') {
      if ((triplet.timing === 'fermentation' || triplet.timing === 'postFermentation') && triplet.doseGL !== 0) risks.push({ ...base, status: 'possible', message: `Houblonnage à cru : activité hydrolytique possible, ampleur non quantifiée. ${p.advice}` });
    } else if (p.risk === 'fourMmp') {
      const value = compounds['4mmpFree']?.range;
      if (!p.threshold || p.matrixId !== triplet.matrixId || !value) risks.push({ ...base, confidence: 'low', status: 'unknown', message: `Excès de 4MMP non évaluable : concentration en bière ou seuil contextuel manquant. ${p.advice}` });
      else if (value.max > p.threshold.range.min) risks.push({ ...base, confidence: weakestHopConfidence(base.confidence, compounds['4mmpFree'].confidence, sourceCap(p.threshold.source, reliability)), status: value.min > p.threshold.range.max ? 'flagged' : 'possible', message: `Le seuil documenté peut être dépassé dans ce contexte. ${p.advice}` });
    } else {
      const fact = p.analyte ? facts.find(f => f.analyte === p.analyte) : undefined;
      const capability = yeast?.betaLyase === 'positive' ? 'β-lyase positive documentée, mais transport, traitement de ce conjugué et rendement dans ce milieu non établis' : yeast?.betaLyase === 'negative' ? 'β-lyase documentée négative' : 'β-lyase inconnue';
      if (!p.threshold || p.matrixId !== triplet.matrixId || !fact?.range || !fact.compatible || fact.measurement?.unit !== p.unit || fact.measurement?.basis !== p.basis) risks.push({ ...base, confidence: 'low', status: 'unknown', message: `Capacité : ${capability} ; niveau de précurseurs non qualifié. Aucun rendement nul n’est supposé. ${p.advice}` });
      else if (fact.range.max > p.threshold.range.min) risks.push({ ...base, confidence: weakestHopConfidence(base.confidence, fact.confidence, sourceCap(p.threshold.source, reliability), yeast?.betaLyase === 'negative' ? sourceCap(yeast.source, reliability) : 'low'), status: fact.range.min > p.threshold.range.max && yeast?.betaLyase === 'negative' ? 'flagged' : 'possible', message: `Précurseurs au-dessus du seuil documenté ; ${capability}. ${p.advice}` });
    }
  }
  return risks;
}

function prepareHopData(data: HopEngineData) {
  const { valid, errors } = usableHopKnowledge(data.knowledge);
  return {
    errors,
    extrapolationCache: createHopExtrapolationCache(),
    varieties: new Map(data.varieties.map(v => [v.id, v])), lots: new Map(data.lots.map(v => [v.id, v])),
    yeasts: new Map(valid.filter((v): v is HopYeast => v.kind === 'yeast').map(v => [v.id, v])),
    axes: valid.filter((v): v is HopAxis => v.kind === 'axis'),
    policies: valid.filter((v): v is HopConfidencePolicy => v.kind === 'confidence'),
    models: valid.filter((v): v is HopModel => v.kind === 'model' && v.enabled),
    extrapolations: valid.filter((v): v is HopExtrapolation => v.kind === 'extrapolation' && v.enabled),
    risks: valid.filter((v): v is HopRiskPolicy => v.kind === 'risk')
  };
}
/** Prepared once per ranking; no persistent cache that could hide a database revision. */
function predictPrepared(triplet: HopTriplet, target: Record<string, HopRange>, data: ReturnType<typeof prepareHopData>, legacyV3 = false): HopPrediction {
  const { axes, policies } = data;
  const result: HopPrediction = { triplet: { ...triplet }, profile: Object.fromEntries(axes.map(a => [a.id, empty('Triplet ou contexte incomplet.')])), compounds: {}, score: empty('Triplet ou contexte incomplet.'), risks: [], modelRefs: [], reasons: [...data.errors] };
  try { assertHopTriplet(triplet); } catch { result.reasons.push('Triplet invalide ; aucune valeur calculée.'); return result; }
  const variety = data.varieties.get(triplet.varietyId ?? '');
  const lot = triplet.lotId ? data.lots.get(triplet.lotId) : undefined;
  const yeast = data.yeasts.get(triplet.yeastId ?? '');
  const facts = resolveHopFacts(lot, variety);
  const models = data.models.filter(v => !!variety && !!yeast && v.scope.varietyId === variety.id && v.scope.yeastId === yeast.id && v.scope.timing === triplet.timing && v.scope.matrixId === triplet.matrixId && v.scope.form === (lot?.form ?? variety.form) && pointIn(v.scope.doseGL, triplet.doseGL) && pointIn(v.scope.temperatureC, triplet.temperatureC) && pointIn(v.scope.contactHours, triplet.contactHours));
  const badLot = !!triplet.lotId && (!lot || lot.varietyId !== triplet.varietyId);
  if (badLot) { models.length = 0; result.reasons.push('Lot absent ou relié à une autre variété ; aucune substitution implicite.'); }
  for (const axis of axes) {
    const estimates = models.flatMap(m => m.outputs.filter(o => o.target === `axis:${axis.id}` && o.axisVersion === axis.version).map(o => evaluateOutput(o, m, facts, policies, triplet.doseGL)));
    const combined = combine(estimates);
    if (combined.range) {
      const range = { min: Math.max(axis.scale.min, combined.range.min), max: Math.min(axis.scale.max, combined.range.max) };
      result.profile[axis.id] = range.min <= range.max ? { ...combined, range } : empty('Résultat hors de l’échelle sensorielle ; étalonnage à revoir.');
    } else result.profile[axis.id] = combined;
  }
  result.compounds['4mmpFree'] = combine(models.flatMap(m => m.outputs.filter(o => o.target === 'beer:4mmpFree').map(o => evaluateOutput(o, m, facts, policies, triplet.doseGL))));
  if (result.compounds['4mmpFree'].range && result.compounds['4mmpFree'].range!.min < 0) result.compounds['4mmpFree'] = empty('Étalonnage produisant une concentration négative ; à revoir.');
  result.modelRefs = models.map(m => ({ id: m.id, version: m.version }));
  if (yeast) for (const value of [...Object.values(result.profile), ...Object.values(result.compounds)]) {
    value.confidence = weakestHopConfidence(value.confidence, sourceCap(yeast.source, policies));
    if (yeast.source.year === null) value.reasons.push('Année de la source de levure inconnue.');
  }
  // Exact, contextual observations retain priority. The experimental model fills
  // only unsupported axes; its assumptions never become measured concentrations.
  if (variety && yeast && triplet.timing && !badLot && data.extrapolations.length) {
    const extrapolate = legacyV3 ? extrapolateHopProfileV3 : extrapolateHopProfile;
    const estimates = data.extrapolations.map(model => ({ model, profile: extrapolate(triplet, variety, yeast, axes, model, (lot?.form ?? variety.form) !== 'unknown', data.extrapolationCache) }));
    const extrapolatedAxes: string[] = [];
    for (const axis of axes) if (!result.profile[axis.id].range) {
      const outputs = estimates.map(e => e.profile[axis.id]).filter(Boolean);
      if (outputs.length) { result.profile[axis.id] = combine(outputs); extrapolatedAxes.push(axis.id); }
    }
    if (extrapolatedAxes.length) {
      result.extrapolatedAxes = extrapolatedAxes;
      result.modelRefs.push(...estimates.filter(e => extrapolatedAxes.some(id => e.profile[id])).map(e => ({ id: e.model.id, version: e.model.version })));
      result.reasons.push('Extrapolation expérimentale : intervalles d’hypothèses, confiance faible jusqu’à validation indépendante.');
    }
  }
  result.score = scoreHopProfile(result.profile, target, axes, policies);
  result.risks = risksFor(triplet, badLot ? [] : facts, result.compounds, yeast, data.risks, policies);
  if (!models.length) result.reasons.push(result.extrapolatedAxes?.length ? 'Aucun étalonnage exact pour ces conditions : le profil repose sur le modèle expérimental.' : 'Aucun modèle applicable à ce houblon × levure × timing, cette dose et cette matrice.');
  if (!policies.length) result.reasons.push('Politique de fiabilité absente : confiance faible.');
  return result;
}
/** Pure, shared client/server. Unsupported chemistry degrades per output, without throwing. */
export function predictHopTriplet(triplet: HopTriplet, target: Record<string, HopRange>, data: HopEngineData): HopPrediction {
  return predictPrepared(triplet, target, prepareHopData(data));
}
/** One immutable search context, discarded on the next data revision. */
export function createHopPredictor(data: HopEngineData) {
  const prepared = prepareHopData(data);
  return (triplet: HopTriplet, target: Record<string, HopRange>) => predictPrepared(triplet, target, prepared);
}
/** Historical v3 snapshots must replay the algorithm they actually used. */
export function replayHopTripletV3(triplet: HopTriplet, target: Record<string, HopRange>, data: HopEngineData): HopPrediction {
  return predictPrepared(triplet, target, prepareHopData(data), true);
}
/** Conservative fit first, optimistic bound second, unknowns last. No hidden midpoint. */
export function rankHopTriplets(triplets: HopTriplet[], target: Record<string, HopRange>, data: HopEngineData): HopPrediction[] {
  const prepared = prepareHopData(data);
  return triplets.map(t => predictPrepared(t, target, prepared)).sort(compareHopPredictions);
}
/** Shared by synchronous ranking and the UI's cooperative batches. */
export function compareHopPredictions(a: HopPrediction, b: HopPrediction): number {
  if (!a.score.range) return b.score.range ? 1 : 0;
  if (!b.score.range) return -1;
  // A pair-dependent rule creates cycles when exact and experimental results mix.
  // One lexicographic ordering for EVERY candidate is transitive and deterministic.
  return b.score.range.min - a.score.range.min
    || (a.score.range.max - a.score.range.min) - (b.score.range.max - b.score.range.min)
    || JSON.stringify(a.triplet).localeCompare(JSON.stringify(b.triplet));
}
export function compareHopTasting(tasting: HopTasting, prediction: Pick<HopPrediction, 'profile'> | undefined, axes: HopAxis[]) {
  return tasting.axes.map(({ axis, perceived, confidence: tastingConfidence }) => {
    const definition = axes.find(a => a.id === axis.id && a.version === axis.version && a.scale.min === axis.scale.min && a.scale.max === axis.scale.max);
    const expected = definition ? prediction?.profile[axis.id] : undefined;
    return { axis, perceived, predicted: expected?.range ?? null,
      gap: perceived && expected?.range ? { min: perceived.min - expected.range.max, max: perceived.max - expected.range.min } : null,
      confidence: expected?.range && perceived ? weakestHopConfidence(tastingConfidence, expected.confidence) : 'low' as HopConfidence };
  });
}

/** Planned additions, without guessing a dry-hop fermentation phase from its calendar day. */
export function hopTripletsOfRecipe(recipe: any): HopTriplet[] {
  const numeric = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? n : null;
  return (Array.isArray(recipe?.hops) ? recipe.hops : []).map((hop: any) => {
    const dryTiming = ['fermentation', 'postFermentation'].includes(hop.aromaTiming) ? hop.aromaTiming : null;
    const timing = hop.stage === 'dryHop' ? dryTiming : ['whirlpool', 'boil', 'firstWort'].includes(hop.stage) ? hop.stage : null;
    const doseGL = numeric(hop.weightG) !== null && numeric(recipe.volumeL) !== null && recipe.volumeL > 0 ? hop.weightG / recipe.volumeL : null;
    return { varietyId: hop.hopVarietyId || null, lotId: hop.hopLotId || null, yeastId: recipe.yeast?.hopIndexId || null, timing, doseGL,
      temperatureC: numeric(hop.aromaTemperatureC) ?? numeric(hop.tempC),
      contactHours: numeric(hop.aromaContactHours) ?? (hop.stage !== 'dryHop' && numeric(hop.timeMin) !== null ? hop.timeMin / 60 : null), matrixId: recipe.hopMatrixId || null };
  });
}

/** The journal can change an addition's mass and completed boil contact, not its identity. */
export function recipeForHopAnalysis<T extends { hops?: any[] }>(recipe: T, journal?: any): T {
  if (!recipe || !journal) return recipe;
  return { ...recipe, hops: (recipe.hops ?? []).map((hop, i) => {
    const addition = journal.additions?.[`hop-${i}`];
    const mass = typeof addition?.amount === 'number' && Number.isFinite(addition.amount) ? addition.amount : hop.weightG;
    const completedContact = hop.stage === 'boil' && typeof addition?.doneAt === 'number' && typeof journal.boilStartedAt === 'number' && typeof journal.boilFinishedAt === 'number'
      ? Math.max(0, journal.boilFinishedAt - Math.max(addition.doneAt, journal.boilStartedAt)) / 3600000 : undefined;
    return { ...hop, weightG: mass, ...(completedContact != null ? { aromaContactHours: completedContact } : {}) };
  }) };
}
