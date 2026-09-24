import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import type { BrewThermalSegment, ThermalMethod } from '../types/brewSystem';
import { effectivePitchTarget } from './pitchingPlan';

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); const i = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2; };
export const THERMAL_METHOD_LABELS: Record<ThermalMethod, string> = { heating: 'Chauffe', immersion: 'Serpentin', chamber: 'Enceinte régulée' };
export const thermalWindow = (method: ThermalMethod) => method === 'chamber'
  ? { freshMin: 120, pairGapMin: 360, minimumPairMin: 5, projectionMin: 2880, stallRate: 0.001, nextReadingMin: 30 }
  : { freshMin: 15, pairGapMin: method === 'heating' ? 45 : 30, minimumPairMin: .5, projectionMin: 240, stallRate: .05, nextReadingMin: 5 };

export function activeThermalSegment(state: BrewDayState, stepId?: string) {
  return [...state.thermalSegments ?? []].reverse().find(s => s.endedAt == null && (!stepId || s.stepId === stepId));
}

export function effectiveThermalTarget(recipe: RecipeSnapshot, state: BrewDayState, step: BrewDayStep) {
  return ['refroidissement', 'ensemencement'].includes(step.id) ? effectivePitchTarget(recipe, state) : step.tempC;
}

/** An explicit method/flow/power change starts a new series instead of mixing trajectories. */
export function startThermalSegment(state: BrewDayState, step: BrewDayStep, method: ThermalMethod, targetC: number,
  now: number, detail: Partial<Pick<BrewThermalSegment, 'coolantC' | 'volumeL' | 'vesselRef' | 'note'>> = {}): BrewDayState {
  if (!finite(now) || !finite(targetC) || state.finishedAt != null || step.doneAt != null) return state;
  const segment: BrewThermalSegment = { id: crypto.randomUUID(), stepId: step.id, method, startedAt: now, targetC, ...detail };
  return { ...state, startedAt: state.startedAt ?? now,
    thermalSegments: [...(state.thermalSegments ?? []).map(s => s.endedAt == null ? { ...s, endedAt: now } : s), segment],
    ...(method !== 'heating' ? { thermalChoices: { ...state.thermalChoices, coolingMethod: method, changedAt: now } } : {}),
    steps: state.steps.map(s => s.id === step.id ? { ...s, rampStartedAt: s.rampStartedAt ?? now } : s),
    notes: [...state.notes ?? [], { id: crypto.randomUUID(), at: now, stepId: step.id,
      text: `${THERMAL_METHOD_LABELS[method]} · cible ${targetC} °C${detail.note ? ` · ${detail.note}` : ''}. Nouvelle série de relevés.` }] };
}

export function thermalSamples(state: BrewDayState, step: BrewDayStep, now = Number.POSITIVE_INFINITY): BrewDayReading[] {
  const segment = activeThermalSegment(state, step.id) ?? [...state.thermalSegments ?? []].reverse().find(s => s.stepId === step.id);
  return (state.readings ?? []).filter(r => r.kind === 'temperature' && r.unit === '°C' &&
    (r.medium == null || r.medium === 'wort' || step.id === 'sparge' && r.medium === 'water') && r.stepId === step.id && finite(r.value) && finite(r.at) && r.at <= now + 1000 &&
    (segment ? r.thermalSegmentId === segment.id && r.at >= segment.startedAt && (segment.endedAt == null || r.at <= segment.endedAt) :
      !r.thermalSegmentId && (step.rampStartedAt == null || r.at >= step.rampStartedAt)))
    .sort((a, b) => a.at - b.at).filter((r, i, all) => i === 0 || r.at > all[i - 1].at);
}

/** Same vessel, same physical method, actual wort observations. No automatic target confirmation. */
export function thermalEstimate(state: BrewDayState, step: BrewDayStep, target: number, now: number, coolantC?: number, fallbackRate?: number) {
  const segment = activeThermalSegment(state, step.id);
  const cooling = ['refroidissement', 'ensemencement', 'whirlpool'].includes(step.id);
  const method = segment?.method ?? (cooling ? state.thermalChoices?.coolingMethod ?? 'immersion' : 'heating');
  const limits = thermalWindow(method);
  const points = thermalSamples(state, step, now).slice(-6), last = points.at(-1);
  const coolant = segment?.coolantC ?? coolantC;
  const basis = { points, last, cooling, target, method, segment };
  if (!last) return { ...basis, status: 'measure' as const, message: 'Relève la température du moût pour établir le point de départ.' };
  if (now - last.at > limits.freshMin * 60000)
    return { ...basis, status: 'stale' as const, message: `Le dernier relevé a plus de ${limits.freshMin} min : remesure le moût avant de projeter l’arrivée.` };
  if (cooling && last.value < target - .5) return { ...basis, status: 'below' as const, message: step.id === 'whirlpool'
    ? 'Le moût est sous la consigne de whirlpool : consigne la température réelle de contact. Prolonger ne reproduit pas automatiquement l’extraction prévue.'
    : 'Le moût est sous la cible choisie. Vérifie la plage de la levure et homogénéise avant d’ensemencer.' };
  if (Math.abs(last.value - target) <= .5) return { ...basis, status: 'reached' as const, minutes: 0,
    message: 'Cible atteinte sur le dernier relevé. Homogénéise et confirme avant de poursuivre.' };
  if (!cooling && last.value > target + .5) return { ...basis, status: 'overshoot' as const,
    message: `Le dernier relevé dépasse la consigne de ${Math.round((last.value - target) * 10) / 10} °C. Réduis ou coupe la chauffe, homogénéise et remesure. Ne rallonge pas automatiquement le palier.` };
  if (method === 'immersion' && finite(coolant) && target <= coolant + .5) return { ...basis, status: 'unreachable' as const,
    message: `L’eau de refroidissement à ${coolant} °C ne permet pas d’atteindre ${target} °C avec une marge utile. Un circuit plus froid ou une enceinte adaptée est nécessaire.` };
  const slopes: number[] = [], rates: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dt = (b.at - a.at) / 60000;
    if (dt < limits.minimumPairMin || dt > limits.pairGapMin) continue;
    slopes.push((b.value - a.value) / dt);
    if (method === 'immersion' && finite(coolant) && a.value > coolant && b.value > coolant && b.value < a.value)
      rates.push(Math.log((a.value - coolant) / (b.value - coolant)) / dt);
  }
  const slope = slopes.length ? median(slopes) : undefined;
  const previous = points.at(-2), recentDt = previous ? (last.at - previous.at) / 60000 : 0;
  const recentSlope = recentDt >= Math.max(2, limits.minimumPairMin) && recentDt <= limits.pairGapMin ? (last.value - previous!.value) / recentDt : undefined;
  const stalled = (v?: number) => v != null && (cooling ? v >= -limits.stallRate : v <= limits.stallRate);
  if (stalled(slope) || stalled(recentSlope)) return { ...basis, status: 'stalled' as const, message: method === 'chamber'
    ? 'La température du moût baisse peu sur les derniers relevés. Vérifie le froid et reprends un relevé dans 30 min ; la consigne de l’enceinte ne mesure pas le moût.'
    : cooling ? 'La baisse ralentit fortement ou s’arrête. Vérifie le débit, le fluide et la circulation du moût ; remesure dans 5 min.'
    : 'La chauffe progresse peu. Vérifie la puissance, la circulation et la sonde ; le maintien attend la température atteinte.' };
  let minutes: number | undefined;
  let model: string;
  let projections: number[] = [];
  if (method === 'immersion') {
    model = 'Refroidissement exponentiel · mêmes conditions';
    if (!finite(coolant)) return { ...basis, status: 'measure' as const,
      message: 'Renseigne la température mesurée de l’eau de refroidissement. La baisse ralentit près de cette température.' };
    projections = rates.map(rate => Math.log((last.value - coolant) / (target - coolant)) / rate);
    if (rates.length) minutes = Math.log((last.value - coolant) / (target - coolant)) / median(rates);
  } else if (method === 'chamber') {
    model = 'Tendance récente du moût · enceinte régulée';
    projections = slopes.filter(rate => rate < 0).map(rate => (target - last.value) / rate);
    if (slope != null && slope < 0) minutes = (target - last.value) / slope;
  } else {
    model = slopes.length ? 'Vitesse observée' : 'Repère estimé du matériel';
    projections = slopes.filter(rate => rate > 0).map(rate => (target - last.value) / rate);
    const rate = slope ?? fallbackRate;
    if (rate && rate > 0) minutes = (target - last.value) / rate;
  }
  if (!finite(minutes) || minutes < 0 || minutes > limits.projectionMin) return { ...basis, status: 'measure' as const,
    message: `Durée encore inconnue. Deux relevés espacés de cette méthode sont nécessaires ; les projections au-delà de ${limits.projectionMin / 60} h sont écartées. Reprends une mesure dans ${limits.nextReadingMin} min.` };
  const elapsed = Math.max(0, (now - last.at) / 60000);
  if (elapsed > minutes) return { ...basis, status: 'measure' as const,
    message: 'L’arrivée estimée est passée : relève la température. La cible n’est jamais confirmée automatiquement.' };
  const remaining = Math.max(0, minutes - elapsed);
  const valid = projections.filter(p => finite(p) && p >= 0 && p <= limits.projectionMin);
  return { ...basis, status: 'estimate' as const, minutes: remaining,
    low: valid.length > 1 ? Math.floor(Math.max(0, Math.min(...valid) - elapsed)) : Math.round(remaining),
    high: valid.length > 1 ? Math.ceil(Math.max(0, Math.max(...valid) - elapsed)) : Math.round(remaining),
    model, message: method === 'chamber'
      ? 'Projection de la tendance récente, sans garantie sur les cycles du froid. Confirme par la température du moût, distincte de la consigne de l’enceinte.'
      : 'Ordre de grandeur si débit, puissance et brassage restent identiques. La plage reflète les vitesses relevées, pas un intervalle de confiance.' };
}

/** Coverage matters: endpoints 40 minutes apart cannot describe the temperature throughout those minutes. */
export function rampExposureDetail(state: BrewDayState, step: BrewDayStep, now?: number) {
  if (step.rampStartedAt == null) return { minutes: null, coveredMin: 0, totalMin: null };
  const end = step.holdStartedAt ?? step.startedAt ?? now;
  const points = (state.readings ?? []).filter(r => r.kind === 'temperature' && r.unit === '°C' && r.stepId === step.id &&
    (r.medium == null || r.medium === 'wort') && finite(r.value) && r.at >= step.rampStartedAt! && (end == null || r.at <= end)).sort((a, b) => a.at - b.at);
  let minutes = 0, coveredMin = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dt = (b.at - a.at) / 60000;
    if (dt <= 0 || dt > 15 || a.thermalSegmentId !== b.thermalSegmentId) continue;
    const low = Math.min(a.value, b.value), high = Math.max(a.value, b.value);
    const fraction = high === low ? Number(low >= 58 && low <= 72) : Math.max(0, Math.min(72, high) - Math.max(58, low)) / (high - low);
    minutes += dt * fraction; coveredMin += dt;
  }
  return { minutes: coveredMin ? Math.round(minutes * 10) / 10 : null, coveredMin,
    totalMin: end == null ? null : Math.max(0, (end - step.rampStartedAt) / 60000) };
}

export function rampExposure(state: BrewDayState, step: BrewDayStep) { return rampExposureDetail(state, step).minutes; }
