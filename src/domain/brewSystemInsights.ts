import type { Batch, BrewDayReading, BrewDayState, BrewhouseProfile, Recipe, RecipeSnapshot } from '../types';
import type { SystemCalibrationEvent, SystemParameter } from '../types/brewSystem';
import { BrewingMath } from '../services/brewingMath';

type BrewRecipe = Recipe | RecipeSnapshot;
type Stage = 'preboil' | 'postboil' | 'ensemencement';
export type SystemMetricId = 'preboilYield' | 'fermenterYield' | 'evaporation' | 'absorption' | 'transferLoss' | 'heating';
const MINUTE = 60_000;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const rounded = (value: number, digits = 2) => Number(value.toFixed(digits));
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const readingId = (reading: BrewDayReading) => reading.id ?? `legacy:${reading.stepId}:${reading.kind}:${reading.at}`;
const stageOf = (reading: BrewDayReading) => reading.measurementStage === 'fermenter' ? 'ensemencement' : reading.measurementStage ?? reading.stepId;
const chronological = (readings: BrewDayReading[]) => [...readings].sort((a, b) => a.at - b.at);

/** Stable content identity, not a cryptographic signature. Kept readable in exports. */
function canonical(value: unknown): string {
  if (value == null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}

function changedWort(state: BrewDayState, from: number, to: number) {
  return Object.entries(state.additions ?? {}).some(([id, addition]) =>
    /^(water-|grain-)/.test(id) && addition.amount > 0 && finite(addition.doneAt) && addition.doneAt > from && addition.doneAt <= to,
  );
}

function coldVolume(recipe: BrewRecipe, reading: Pick<BrewDayReading, 'value' | 'volumeBasis' | 'roomTemp' | 'temperatureC'>) {
  if (!finite(reading.value) || reading.value < 0) return null;
  if (reading.volumeBasis === 'cold' || (!reading.volumeBasis && reading.roomTemp === true)) {
    if (finite(reading.temperatureC) && reading.temperatureC > 30) return null;
    return { value: reading.value, approximate: false };
  }
  // The entry form explicitly defines “hot” as volume at boiling, not any warm volume.
  if (reading.volumeBasis !== 'hot' || (finite(reading.temperatureC) && reading.temperatureC < 90)) return null;
  const shrink = recipe.brewhouse?.equipment?.coolingShrinkagePct;
  if (!finite(shrink) || shrink < 0 || shrink >= 20) return null;
  return { value: reading.value * (1 - shrink / 100), approximate: true };
}

function hotVolume(recipe: BrewRecipe, reading: BrewDayReading) {
  if (reading.volumeBasis === 'hot' && (!finite(reading.temperatureC) || reading.temperatureC >= 90)) {
    return finite(reading.value) && reading.value > 0 ? { value: reading.value, approximate: false } : null;
  }
  const cold = coldVolume(recipe, reading);
  const shrink = recipe.brewhouse?.equipment?.coolingShrinkagePct;
  return cold && finite(shrink) && shrink >= 0 && shrink < 20
    ? { value: cold.value / (1 - shrink / 100), approximate: true } : null;
}

export interface WortMeasurementPair {
  volume: BrewDayReading;
  gravity: BrewDayReading;
  volumeColdL: number;
  approximate: boolean;
}

/** A correction/incomplete new pair cannot silently fall back to an older, better-looking result. */
export function pairedWortMeasurements(recipe: BrewRecipe, state: BrewDayState, stage: string): { pair: WortMeasurementPair | null; reason: string } {
  const entries = chronological((state.readings ?? []).filter(r => stageOf(r) === stage && (r.kind === 'volume' || r.kind === 'densite')));
  const latest = entries.at(-1);
  if (!latest) return { pair: null, reason: 'Relève ensemble le volume et la densité du même moût.' };
  const candidates = latest.pairId ? entries.filter(r => r.pairId === latest.pairId) : entries.filter(r => !r.pairId);
  const volume = candidates.filter(r => r.kind === 'volume').at(-1);
  const gravity = candidates.filter(r => r.kind === 'densite').at(-1);
  if (!volume || !gravity) return { pair: null, reason: 'Complète ce relevé avec le volume et la densité du même moût.' };
  const from = Math.min(volume.at, gravity.at), to = Math.max(volume.at, gravity.at);
  if (stage === 'ensemencement' && finite(state.pitchedAt) && to > state.pitchedAt) {
    return { pair: null, reason: 'Le rendement demande un relevé du moût avant l’ensemencement ; une densité de fermentation ne convient pas.' };
  }
  if (!finite(from) || !finite(to) || to - from > 30 * MINUTE || changedWort(state, from, to) ||
      (stage === 'preboil' && finite(state.boilStartedAt) && state.boilStartedAt > from && state.boilStartedAt <= to)) {
    return { pair: null, reason: 'Ces deux mesures ne décrivent plus le même moût : reprends un couple volume / densité.' };
  }
  if (!finite(gravity.value) || gravity.value < 1 || gravity.value > 1.3 || gravity.roomTemp !== true) {
    return { pair: null, reason: 'Confirme une densité mesurée à température de référence sur un échantillon refroidi.' };
  }
  const cold = coldVolume(recipe, volume);
  if (!cold || cold.value <= 0) return { pair: null, reason: 'Précise si le volume est mesuré à froid ou à ébullition ; la conversion demande le retrait au refroidissement du profil.' };
  return { pair: { volume, gravity, volumeColdL: cold.value, approximate: cold.approximate }, reason: '' };
}

function effectiveFermentables(recipe: BrewRecipe, state: BrewDayState) {
  return recipe.fermentables.map((ingredient, index) => {
    const addition = state.additions?.[`grain-${index}`];
    return {
      ...ingredient,
      ...(addition?.replacement ? { ...addition.replacement, potentialPpg: addition.replacement.potentialPpg } : {}),
      weightKg: addition?.amount ?? ingredient.weightKg,
      addition, sourceId: `addition:grain-${index}`,
    };
  });
}

export interface MeasuredWortYield {
  missingIngredients?: boolean;
  value: number | null;
  scope: 'grain' | 'global' | null;
  pair: WortMeasurementPair | null;
  approximate: boolean;
  calibrationEligible: boolean;
  sourceIds: string[];
  reason: string;
  questionable?: boolean;
}

/** Observed extract divided by documented ingredient potential; OG alone is never a yield. */
export function measuredWortYield(recipe: BrewRecipe, state: BrewDayState, stage: string): MeasuredWortYield {
  const paired = pairedWortMeasurements(recipe, state, stage);
  const empty: MeasuredWortYield = { value: null, scope: null, pair: paired.pair, approximate: false, calibrationEligible: false, sourceIds: [], reason: paired.reason };
  if (!paired.pair) return empty;
  const { volume, gravity, volumeColdL, approximate } = paired.pair;
  const at = Math.min(volume.at, gravity.at);
  const ingredients = effectiveFermentables(recipe, state).filter(f => {
    // A mash grain cannot disappear from the denominator because it was logged late.
    if (f.kind === 'grain' && f.use === 'empatage') return true;
    if (finite(f.addition?.doneAt)) return f.addition.doneAt <= at;
    return f.use === 'empatage' || (stage !== 'preboil' && f.use === 'ebullition');
  });
  const unconfirmed = ingredients.filter(f => (f.weightKg > 0 || f.addition) && (!finite(f.addition?.doneAt) || !finite(f.weightKg) || f.weightKg < 0));
  const sources = [readingId(volume), readingId(gravity), ...ingredients.map(f => f.sourceId)];
  const lateMashGrains = ingredients.filter(f => f.kind === 'grain' && f.use === 'empatage' && f.weightKg > 0 && finite(f.addition?.doneAt) && f.addition.doneAt > at);
  if (lateMashGrains.length) return { ...empty, sourceIds: sources, missingIngredients: true,
    reason: `Grains d’empâtage consignés après le relevé : ${lateMashGrains.map(f => f.name).join(', ')}. Corrige leur heure réelle, ou relève un nouveau couple volume–densité.` };
  if (unconfirmed.length) return { ...empty, sourceIds: sources, missingIngredients: true, reason: `Confirme les quantités réellement ajoutées : ${unconfirmed.map(f => f.name).join(', ')}.` };
  const active = ingredients.filter(f => f.weightKg > 0);
  const missing = active.filter(f => !finite(f.potentialPpg) || f.potentialPpg <= 0);
  if (missing.length) return { ...empty, sourceIds: sources, reason: `Potentiel d’extrait manquant : ${missing.map(f => f.name).join(', ')}.` };
  const potential = BrewingMath.extractPoints(active, 1, 100, 'full')?.total;
  if (!potential || potential <= 0) return { ...empty, sourceIds: sources, reason: 'Aucun potentiel d’extrait documenté pour ce moût.' };
  const value = 100 * (gravity.value - 1) * 1000 * volumeColdL / potential;
  const direct = active.some(f => f.kind !== 'grain');
  const unconventional = active.some(f => f.kind === 'grain' && f.use !== 'empatage');
  const questionable = value < 0 || value > 100;
  return {
    value, scope: direct ? 'global' : 'grain', pair: paired.pair, approximate, sourceIds: sources, questionable,
    calibrationEligible: stage === 'ensemencement' && !direct && !unconventional && !questionable && value > 0 && !recipe.nolo?.enabled,
    reason: questionable ? 'Résultat hors de 0–100 % : vérifie volume, densité, quantités et potentiels avant toute calibration.'
      : direct ? 'Extrait global, sucres et extraits compris. Leur part restante ne peut pas être isolée : aucune calibration du rendement des grains.'
        : recipe.nolo?.enabled ? 'Extraction du procédé NOLO, conservée séparément. Elle ne remplace pas le rendement général utilisé pour les recettes classiques.'
        : stage === 'preboil' ? 'Extraction des grains avant ébullition. Le rendement utilisé par les recettes est celui en fermenteur.'
          : approximate ? 'Volume ramené à froid avec le retrait du profil figé ; résultat corrigé, pas un volume froid mesuré.'
            : 'Volume et densité du même moût, rapportés aux grains réellement ajoutés.',
  };
}

export interface SystemMetric {
  id: SystemMetricId;
  label: string;
  unit: '%' | 'L/h' | 'L/kg' | 'L' | '°C/min';
  value: number | null;
  expected: number | null;
  approximate: boolean;
  sourceIds: string[];
  reason: string;
  nextStepId?: string;
  missingIngredients?: boolean;
  parameter?: SystemParameter;
  calibrationEligible: boolean;
  context?: Record<string, unknown>;
}

function lastVolume(state: BrewDayState, stage: Stage) {
  return chronological((state.readings ?? []).filter(r => r.kind === 'volume' && stageOf(r) === stage)).at(-1);
}
function metric(id: SystemMetricId, label: string, unit: SystemMetric['unit'], expected: number | undefined, reason: string, nextStepId?: string): SystemMetric {
  return { id, label, unit, expected: finite(expected) ? expected : null, value: null, approximate: false, sourceIds: [], reason, nextStepId, calibrationEligible: false };
}

function evaporation(recipe: BrewRecipe, state: BrewDayState): SystemMetric {
  const result = metric('evaporation', 'Évaporation à chaud', 'L/h', recipe.brewhouse?.equipment?.boilOffLPerHour,
    'Relève le volume juste avant et après l’ébullition, et enregistre son début et sa fin.', 'postboil');
  const before = lastVolume(state, 'preboil'), after = lastVolume(state, 'postboil');
  if (!before || !after || !finite(state.boilStartedAt) || !finite(state.boilFinishedAt)) return result;
  const minutes = (state.boilFinishedAt - state.boilStartedAt) / MINUTE;
  const a = hotVolume(recipe, before), b = hotVolume(recipe, after);
  if (!a || !b) return { ...result, reason: 'Il faut deux volumes à ébullition ou ramenés à la même référence de température.' };
  if (minutes <= 0 || before.at > state.boilStartedAt + 5 * MINUTE || before.at < state.boilStartedAt - 5 * MINUTE ||
      after.at < state.boilFinishedAt - 5 * MINUTE || after.at > state.boilFinishedAt + 5 * MINUTE || after.at <= before.at) {
    return { ...result, reason: 'Les volumes doivent encadrer le début et la fin d’ébullition à 5 min près ; la chauffe ou le refroidissement fausseraient ce débit.' };
  }
  if (changedWort(state, before.at, after.at)) return { ...result, reason: 'De l’eau ou un fermentescible a été ajouté entre les volumes : la seule évaporation ne peut pas être isolée.' };
  if (finite(before.temperatureC) && finite(after.temperatureC) && Math.abs(before.temperatureC - after.temperatureC) > 2) {
    return { ...result, reason: 'Les températures des deux volumes diffèrent : reprends des volumes sur une même référence.' };
  }
  if (a.value < b.value) return { ...result, reason: 'Le volume final dépasse le volume initial : vérifie les relevés ou les ajouts.' };
  return { ...result, value: (a.value - b.value) * 60 / minutes, approximate: a.approximate || b.approximate,
    parameter: 'boilOffLPerHour', calibrationEligible: true, sourceIds: [readingId(before), readingId(after)],
    context: { initialHotL: rounded(a.value, 1) },
    reason: `${rounded(minutes, 1)} min d’ébullition réellement enregistrées.${a.approximate || b.approximate ? ' Volumes convertis avec le retrait du profil figé.' : ' Volumes mesurés à ébullition.'}` };
}

function absorption(recipe: BrewRecipe, state: BrewDayState): SystemMetric {
  const result = metric('absorption', 'Absorption apparente', 'L/kg', undefined,
    'Confirme l’eau réellement utilisée et le grain, puis relève le volume collecté avant ébullition.', 'preboil');
  const volume = lastVolume(state, 'preboil');
  if (!volume) return result;
  const cold = coldVolume(recipe, volume);
  if (!cold) return { ...result, reason: 'Précise la référence de température du volume collecté.' };
  const additions = state.additions ?? {};
  const waters = Object.entries(additions).filter(([id, a]) => id.startsWith('water-') && finite(a.doneAt) && a.doneAt <= volume.at);
  // Planned volumes only tell which confirmations are missing; they never enter the arithmetic.
  const required = ['water-mash', ...(recipe.waterPlan?.spargeWaterL !== 0 ? ['water-sparge'] : [])];
  if (required.some(id => !waters.some(([key]) => key === id))) return result;
  const waterVolumes = waters.map(([, a]) => coldVolume(recipe, { value: a.amount, volumeBasis: a.volumeBasis, temperatureC: a.temperatureC }));
  if (waterVolumes.some(v => v == null)) return { ...result, reason: 'Précise la référence de température des quantités d’eau réellement utilisées.' };
  const grains = effectiveFermentables(recipe, state).filter(f => f.kind === 'grain' && f.use === 'empatage');
  if (!grains.length || grains.some(f => !finite(f.addition?.doneAt) || f.addition.doneAt > volume.at || !finite(f.weightKg) || f.weightKg < 0)) return result;
  const kg = grains.reduce((sum, f) => sum + f.weightKg, 0);
  if (kg <= 0 || recipe.nolo?.process === 'secondRunnings') return { ...result, reason: 'Le grain et l’eau de la première extraction ne sont pas connus pour ce second moût.' };
  const loss = waterVolumes.reduce((sum, v) => sum + v!.value, 0) - cold.value;
  if (loss < 0) return { ...result, reason: 'Le volume collecté dépasse l’eau confirmée : vérifie les volumes et les ajouts.' };
  const retained = state.lauterRetainedL;
  const otherExtract = effectiveFermentables(recipe, state).some(f => f.kind !== 'grain' && f.weightKg > 0 && finite(f.addition?.doneAt) && f.addition.doneAt <= volume.at);
  const separated = finite(retained) && retained >= 0 && retained <= loss && !otherExtract;
  return { ...result, label: separated ? 'Absorption des grains' : result.label,
    value: (loss - (separated ? retained : 0)) / kg,
    expected: separated ? recipe.brewhouse?.equipment?.grainAbsorptionLPerKg ?? null : null,
    approximate: cold.approximate || waterVolumes.some(v => v!.approximate),
    sourceIds: [readingId(volume), ...waters.map(([id]) => `addition:${id}`), ...grains.map(g => g.sourceId)],
    parameter: 'grainAbsorptionLPerKg', calibrationEligible: separated,
    reason: otherExtract ? 'Un autre fermentescible a modifié le volume collecté. L’absorption des grains ne peut pas être isolée.'
      : separated ? `Moût libre restant après filtration : ${rounded(retained)} L, retiré du bilan d’absorption.`
      : finite(retained) ? 'Le moût libre restant doit être compris entre zéro et la perte totale. Corrige ce relevé avant calibration.'
        : 'Inclut le moût libre laissé dans la cuve. Mesure ce reste, même nul, pour isoler l’absorption des grains.' };
}

function transferLoss(recipe: BrewRecipe, state: BrewDayState): SystemMetric {
  const result = metric('transferLoss', 'Pertes au transfert', 'L', undefined,
    'Relève à froid le volume en cuve avant transfert et celui reçu en fermenteur.', 'ensemencement');
  const before = chronological((state.readings ?? []).filter(r => r.kind === 'volume' &&
    (r.measurementStage === 'kettle-cold' || (r.stepId === 'refroidissement' && !r.measurementStage)))).at(-1);
  const after = lastVolume(state, 'ensemencement');
  if (!before || !after || after.at < before.at) return result;
  const a = coldVolume(recipe, before), b = coldVolume(recipe, after);
  if (!a || !b || a.approximate || b.approximate) return { ...result, reason: 'Deux volumes réellement mesurés à froid sont nécessaires pour isoler les pertes au transfert.' };
  if (changedWort(state, before.at, after.at) || a.value < b.value) return { ...result, reason: 'Le bilan du transfert est modifié par un ajout ou des volumes incohérents.' };
  return { ...result, value: a.value - b.value, sourceIds: [readingId(before), readingId(after)],
    reason: 'Perte totale observée, houblons compris. Elle ne remplace pas le fond de cuve : ces contributions ne sont pas séparées.' };
}

function heating(recipe: BrewRecipe, state: BrewDayState): SystemMetric {
  const result = metric('heating', 'Vitesse de chauffe', '°C/min', recipe.brewhouse?.equipment?.heatingRateCPerMin,
    'Enregistre deux températures du moût pendant une même montée, sans changement de puissance ou de méthode.');
  const segments = (state.thermalSegments ?? []).filter(s => s.method === 'heating' && s.stepId !== 'sparge').sort((a, b) => b.startedAt - a.startedAt);
  for (const segment of segments) {
    const points = chronological((state.readings ?? []).filter(r => r.kind === 'temperature' && (r.medium == null || r.medium === 'wort') &&
      r.thermalSegmentId === segment.id && finite(r.value) && finite(r.at) && r.at >= segment.startedAt && (!finite(segment.endedAt) || r.at <= segment.endedAt)));
    const first = points[0], last = points.at(-1);
    if (!first || !last || last.at <= first.at) continue;
    const minutes = (last.at - first.at) / MINUTE;
    if (minutes < 0.5 || points.some((p, i) => i > 0 && p.value < points[i - 1].value - 0.5) || last.value <= first.value || changedWort(state, first.at, last.at)) {
      return { ...result, reason: 'La montée comprend une baisse, un ajout ou des relevés trop rapprochés : recommence un segment comparable.' };
    }
    return { ...result, value: (last.value - first.value) / minutes, sourceIds: points.map(readingId),
      parameter: 'heatingRateCPerMin', calibrationEligible: finite(segment.volumeL) && segment.volumeL > 0,
      context: { method: segment.method, vessel: segment.vesselRef ?? null, volumeL: segment.volumeL ?? null,
        fromC: Math.round(first.value), toC: Math.round(last.value), targetC: segment.targetC },
      reason: `Moyenne observée de ${rounded(first.value, 1)} à ${rounded(last.value, 1)} °C sur ${rounded(minutes, 1)} min ; elle ne décrit pas chaque instant de la montée.${!finite(segment.volumeL) || segment.volumeL <= 0 ? ' Confirme le volume de ce segment pour comparer les brassins.' : ''}` };
  }
  return result;
}

export function brewSystemInsights(recipe: BrewRecipe, state: BrewDayState): { metrics: SystemMetric[]; nextMeasurement: { stepId: string; message: string; missingIngredients?: boolean } | null } {
  const pre = measuredWortYield(recipe, state, 'preboil'), final = measuredWortYield(recipe, state, 'ensemencement');
  const yieldMetric = (yieldResult: MeasuredWortYield, stage: 'preboil' | 'ensemencement'): SystemMetric => ({
    id: stage === 'preboil' ? 'preboilYield' : 'fermenterYield',
    label: yieldResult.scope === 'global' ? `Extrait global ${stage === 'preboil' ? 'avant ébullition' : 'en fermenteur'}` : `Rendement ${stage === 'preboil' ? 'avant ébullition' : 'en fermenteur'}`,
    unit: '%', value: yieldResult.value,
    expected: stage === 'ensemencement' && yieldResult.scope !== 'global' ? recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct ?? null : null,
    approximate: yieldResult.approximate, sourceIds: yieldResult.sourceIds,
    reason: yieldResult.pair && yieldResult.value != null
      ? `${rounded(yieldResult.pair.volumeColdL)} L à froid · densité ${yieldResult.pair.gravity.value.toFixed(3)}. ${yieldResult.reason}` : yieldResult.reason,
    nextStepId: stage,
    missingIngredients: yieldResult.missingIngredients,
    calibrationEligible: yieldResult.calibrationEligible, ...(stage === 'ensemencement' ? { parameter: 'efficiencyPct' as const } : {}),
  });
  const metrics = [yieldMetric(pre, 'preboil'), yieldMetric(final, 'ensemencement'), evaporation(recipe, state), absorption(recipe, state), transferLoss(recipe, state), heating(recipe, state)];
  const currentStage = state.steps[state.currentIndex]?.id;
  const expectedStage = currentStage && ['postboil', 'refroidissement', 'ensemencement'].includes(currentStage) || finite(state.boilFinishedAt) ? 'ensemencement' : 'preboil';
  const next = metrics.find(m => m.value == null && m.nextStepId === expectedStage) ?? metrics.find(m => m.value == null && m.nextStepId);
  return { metrics, nextMeasurement: next?.nextStepId ? { stepId: next.nextStepId, message: next.reason, missingIngredients:next.missingIngredients } : null };
}

function equipmentIdentity(profile: BrewhouseProfile) {
  const e = profile.equipment;
  return { id: profile.id, refs: profile.equipmentRefs ?? {}, physical: e ? {
    kettleCapacityL: e.kettleCapacityL, kettleWorkingL: e.kettleWorkingL, spargeCapacityL: e.spargeCapacityL,
    fermenterCapacityL: e.fermenterCapacityL, grainDisplacementLPerKg: e.grainDisplacementLPerKg,
    coolingShrinkagePct: e.coolingShrinkagePct,
  } : null };
}

export interface SystemObservation {
  batchId: string;
  batchName: string;
  at: number;
  parameter: SystemParameter;
  value: number;
  contextKey: string;
  contextLabel: string;
  sourceIds: string[];
  evidence: string;
  approximate: boolean;
}

function observations(batch: Batch): SystemObservation[] {
  const recipe = batch.recipeSnapshot, state = batch.brewDay;
  if (!recipe?.brewhouse || !state || batch.status === 'annule') return [];
  const ingredients = effectiveFermentables(recipe, state);
  const process = recipe.nolo?.enabled ? `NOLO · ${recipe.nolo.process}` : 'Classique';
  const grainKg = ingredients.filter(f => f.kind === 'grain').reduce((sum, f) => sum + f.weightKg, 0);
  const baseContext = {
    equipment: equipmentIdentity(recipe.brewhouse), volumeL: recipe.volumeL, grainKg: rounded(grainKg),
    process, sparge: recipe.mash?.spargeType ?? 'non documenté',
    mash: state.steps.filter(s => /^mash/.test(s.id)).map(s => [s.tempC ?? null, s.durationMin]),
    ratio: recipe.mash?.ratioLPerKg ?? recipe.brewhouse.mashRatioLPerKg,
    actualWater: ['water-mash', 'water-sparge'].map(id => {
      const addition = state.additions?.[id];
      if (!addition || !finite(addition.doneAt)) return null;
      const cold = coldVolume(recipe, { value: addition.amount, volumeBasis: addition.volumeBasis, temperatureC: addition.temperatureC });
      return cold ? rounded(cold.value, 1) : null;
    }),
  };
  return brewSystemInsights(recipe, state).metrics.filter(m => m.parameter && m.calibrationEligible && m.value != null).map(m => {
    const contextKey = canonical({ ...baseContext, metricContext: m.context ?? null, parameter: m.parameter });
    const selectedReadings = (state.readings ?? []).filter(r => m.sourceIds.includes(readingId(r))).sort((a, b) => readingId(a).localeCompare(readingId(b)));
    const sourceAdditions = Object.fromEntries(Object.entries(state.additions ?? {}).filter(([id]) => m.sourceIds.includes(`addition:${id}`)));
    const evidence = canonical({ value: m.value, sources: selectedReadings, additions: sourceAdditions,
      // Inputs used in denominators or interval eligibility must invalidate old approvals too.
      ingredients: ingredients.map(({ addition: _addition, ...f }) => f), boilStartedAt: m.id === 'evaporation' ? state.boilStartedAt : undefined,
      boilFinishedAt: m.id === 'evaporation' ? state.boilFinishedAt : undefined,
      lauterRetainedL: m.id === 'absorption' ? state.lauterRetainedL : undefined,
      segments: m.id === 'heating' ? state.thermalSegments : undefined,
    });
    const mashProgram = baseContext.mash.length ? baseContext.mash.map(([temp, duration]) => `${temp ?? '?'} °C/${duration} min`).join(' + ') : 'programme non documenté';
    const waterContext = baseContext.actualWater.every(v => v == null) ? 'eau non confirmée' : `eau ${baseContext.actualWater.map(v => v == null ? '?' : v).join('/')} L`;
    return { batchId: batch.id, batchName: batch.name, at: Math.max(0, ...selectedReadings.map(r => r.at)), parameter: m.parameter!, value: m.value!,
      contextKey, contextLabel: `${recipe.volumeL} L · ${process} · ${rounded(grainKg)} kg · ${m.context?.fromC != null ? `${m.context.fromC}–${m.context.toC} °C` : mashProgram} · ${waterContext}`,
      sourceIds: m.sourceIds, evidence, approximate: m.approximate };
  });
}

export interface SystemCalibrationProposal {
  parameter: SystemParameter;
  contextKey: string;
  contextLabel: string;
  value: number;
  previousValue: number | null;
  count: number;
  eligible: boolean;
  min: number;
  max: number;
  observations: SystemObservation[];
  evidenceFingerprint: string;
}

export const SYSTEM_PARAMETER_LABELS: Record<SystemParameter, { label: string; unit: SystemMetric['unit'] }> = {
  efficiencyPct: { label: 'Rendement en fermenteur', unit: '%' },
  boilOffLPerHour: { label: 'Évaporation à chaud', unit: 'L/h' },
  grainAbsorptionLPerKg: { label: 'Absorption des grains', unit: 'L/kg' },
  heatingRateCPerMin: { label: 'Vitesse de chauffe', unit: '°C/min' },
};
export function calibrationContextExclusion(profile: BrewhouseProfile, batch: Batch): string | null {
  if (!batch.recipeSnapshot?.brewhouse || !batch.brewDay) return 'Profil matériel figé ou journal absent : ce brassin ne calibre pas l’installation.';
  if (canonical(equipmentIdentity(batch.recipeSnapshot.brewhouse)) !== canonical(equipmentIdentity(profile))) {
    return 'Matériel ou capacités différents du profil actuel : le bilan est conservé, sans mélanger les installations.';
  }
  return null;
}
export function systemParameterValue(profile: BrewhouseProfile, parameter: SystemParameter): number | null {
  const value = parameter === 'efficiencyPct' ? profile.efficiencyPct : profile.equipment?.[parameter];
  return finite(value) ? value : null;
}

function evidenceFingerprint(parameter: SystemParameter, contextKey: string, entries: SystemObservation[]) {
  return canonical({ parameter, contextKey, observations: [...entries].sort((a, b) => a.batchId.localeCompare(b.batchId)).map(o => ({ batchId: o.batchId, evidence: o.evidence })) });
}

/** Only comparable frozen equipment/process contexts are grouped; each batch contributes once. */
export function systemCalibrationProposals(profile: BrewhouseProfile, batches: Batch[]): SystemCalibrationProposal[] {
  const groups = new Map<string, SystemObservation[]>();
  const identity = canonical(equipmentIdentity(profile));
  const distinctBatches = [...new Map(batches.map(b => [b.id, b])).values()];
  for (const batch of distinctBatches) {
    if (!batch.recipeSnapshot?.brewhouse || canonical(equipmentIdentity(batch.recipeSnapshot.brewhouse)) !== identity) continue;
    for (const observation of observations(batch)) {
      const list = groups.get(observation.contextKey) ?? [];
      list.push(observation);
      groups.set(observation.contextKey, list);
    }
  }
  return [...groups.entries()].map(([contextKey, all]) => {
    const entries = all.sort((a, b) => b.at - a.at || a.batchId.localeCompare(b.batchId)).slice(0, 5);
    const parameter = entries[0].parameter;
    const values = entries.map(o => o.value);
    return { parameter, contextKey, contextLabel: entries[0].contextLabel, value: rounded(median(values)),
      previousValue: systemParameterValue(profile, parameter), count: entries.length, eligible: entries.length >= 3,
      min: Math.min(...values), max: Math.max(...values), observations: entries,
      evidenceFingerprint: evidenceFingerprint(parameter, contextKey, entries) };
  }).sort((a, b) => Object.keys(SYSTEM_PARAMETER_LABELS).indexOf(a.parameter) - Object.keys(SYSTEM_PARAMETER_LABELS).indexOf(b.parameter) || b.observations[0].at - a.observations[0].at);
}

/** Re-checks the current evidence at the moment of the explicit user action. */
export function applySystemCalibration(profile: BrewhouseProfile, proposal: SystemCalibrationProposal, batches: Batch[], now = Date.now()): { ok: true; profile: BrewhouseProfile; event: SystemCalibrationEvent } | { ok: false; reason: string } {
  const fresh = systemCalibrationProposals(profile, batches).find(p => p.parameter === proposal.parameter && p.contextKey === proposal.contextKey);
  if (!fresh?.eligible || fresh.evidenceFingerprint !== proposal.evidenceFingerprint || fresh.value !== proposal.value) return { ok: false, reason: 'Les mesures ont changé. Consulte la proposition actualisée avant de l’appliquer.' };
  const previousValue = systemParameterValue(profile, fresh.parameter);
  if (previousValue == null || (!profile.equipment && fresh.parameter !== 'efficiencyPct')) return { ok: false, reason: 'Complète le paramètre de l’installation avant de le calibrer.' };
  if (previousValue === fresh.value) return { ok: false, reason: 'Cette valeur est déjà utilisée.' };
  const event: SystemCalibrationEvent = {
    id: `cal-${fresh.parameter}-${now}`, parameter: fresh.parameter, previousValue, value: fresh.value, appliedAt: now,
    batchIds: fresh.observations.map(o => o.batchId), readingIds: [...new Set(fresh.observations.flatMap(o => o.sourceIds))],
    evidenceFingerprint: fresh.evidenceFingerprint, contextKey: fresh.contextKey,
  };
  const next: BrewhouseProfile = { ...profile, calibrationHistory: [...(profile.calibrationHistory ?? []), event],
    ...(fresh.parameter === 'efficiencyPct' ? { efficiencyPct: fresh.value } : { equipment: { ...profile.equipment!, [fresh.parameter]: fresh.value } }) };
  return { ok: true, profile: next, event };
}

export function calibrationEventStatus(event: SystemCalibrationEvent, batches: Batch[]): 'current' | 'changed' | 'unavailable' {
  const sourceBatches = event.batchIds.map(id => batches.find(b => b.id === id));
  if (sourceBatches.some(b => !b?.recipeSnapshot || !b.brewDay)) return 'unavailable';
  const entries = sourceBatches.flatMap(b => observations(b!)).filter(o => o.parameter === event.parameter && o.contextKey === event.contextKey);
  if (entries.length !== event.batchIds.length) return 'changed';
  return evidenceFingerprint(event.parameter, event.contextKey, entries) === event.evidenceFingerprint ? 'current' : 'changed';
}
