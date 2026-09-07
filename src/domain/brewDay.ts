import { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';

export type ReadingKind = BrewDayReading['kind'];
export const brewAdviceKey = (s: BrewDayState) =>
  JSON.stringify([
    s.steps[s.currentIndex],
    s.readings,
    s.notes,
    s.acidCorrections,
    s.mashContext,
    s.boilDurationMin,
    s.boilStartedAt,
    s.boilFinishedAt
  ]);
export const READING = {
  ph: { label: 'pH', unit: '', min: 0.1, max: 14, placeholder: '5,4' },
  temperature: {
    label: 'Température',
    unit: '°C',
    min: -10,
    max: 120,
    placeholder: '67'
  },
  densite: {
    label: 'Densité',
    unit: 'SG',
    min: 0.98,
    max: 1.2,
    placeholder: '1,056'
  },
  volume: {
    label: 'Volume',
    unit: 'L',
    min: 0.1,
    max: 100000,
    placeholder: '25'
  }
} as const;
export const isMash = (id = '') => /^mash/.test(id);
export const isFinalWort = (id = '') => ['refroidissement', 'ensemencement'].includes(id);
export const readingKey = (r: BrewDayReading) => r.id ?? `${r.at}-${r.kind}-${r.stepId ?? ''}`;
export const defaultReading = (s?: BrewDayStep): ReadingKind =>
  isMash(s?.id)
    ? s?.tempC != null && s.tempC >= 75
      ? 'temperature'
      : 'ph'
    : s?.id === 'preboil' || s?.id === 'ensemencement'
      ? 'densite'
      : s?.tempC
        ? 'temperature'
        : 'volume';

/** Une chaîne complète, jamais parseFloat('5.7abc'). Accepte SG et points (1056). */
export function parseReading(raw: string, kind: ReadingKind): number | null {
  const str = raw.trim().replace(',', '.');
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(str)) return null;
  let n = Number(str);
  if (kind === 'densite' && n >= 980 && n <= 1200) n /= 1000;
  return Number.isFinite(n) && n >= READING[kind].min && n <= READING[kind].max ? n : null;
}

export interface ReadingFeedback {
  tone: 'ok' | 'watch' | 'neutral';
  title: string;
  detail: string;
}
/** Même retour pour la saisie et le résumé : un pH ancien ou à chaud ne devient pas valide en fermant le formulaire. */
export function measuredReadingFeedback(
  reading: BrewDayReading,
  state: BrewDayState,
  step: BrewDayStep,
  recipe?: RecipeSnapshot
): ReadingFeedback {
  if (reading.kind === 'ph' && isMash(step.id)) {
    if (state.acidCorrections?.some((c) => c.at >= reading.at))
      return {
        tone: 'neutral',
        title: `pH précédent : ${reading.value} · à remesurer`,
        detail: ''
      };
    if (!reading.roomTemp)
      return {
        tone: 'neutral',
        title: `pH ${reading.value} · à confirmer à froid`,
        detail: 'La cible 5,2–5,5 concerne un échantillon à 20–25 °C.'
      };
  }
  return readingFeedback(reading.kind, reading.value, step, recipe);
}
export function readingFeedback(
  kind: ReadingKind,
  value: number,
  step: BrewDayStep,
  recipe?: RecipeSnapshot
): ReadingFeedback {
  if (kind === 'ph' && isMash(step.id)) {
    if (value < 5.2)
      return {
        tone: 'watch',
        title: 'Maische déjà acide',
        detail:
          'Ne rajoute pas d’acide. Vérifie l’étalonnage et confirme avec un nouvel échantillon refroidi.'
      };
    if (value <= 5.5)
      return {
        tone: 'ok',
        title: 'pH dans la cible · rien à ajouter',
        detail: 'Fenêtre de travail : 5,2–5,5 sur échantillon refroidi.'
      };
    return {
      tone: 'watch',
      title: 'Au-dessus de la fenêtre de pH',
      detail:
        'Une correction peut être utile. Le calcul ci-dessous part du pH mesuré et de ta maische.'
    };
  }
  if (kind === 'temperature' && step.tempC != null) {
    const delta = value - step.tempC;
    return {
      tone: Math.abs(delta) <= 1 ? 'ok' : 'watch',
      title: `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10} °C / cible ${step.tempC} °C`,
      detail:
        Math.abs(delta) <= 1
          ? 'Température proche de la consigne.'
          : delta > 0
            ? 'Refroidis progressivement et homogénéise avant de remesurer.'
            : step.startedAt != null
              ? 'Température sous la consigne. Homogénéise, ajuste doucement puis remesure.'
              : 'Température sous la consigne. Vérifie la sonde et ajuste avant de lancer le palier.'
    };
  }
  if (kind === 'densite') {
    const target = isFinalWort(step.id) ? recipe?.ogTarget : undefined;
    if (target && target > 1) {
      const points = Math.round((value - target) * 1000);
      return {
        tone: Math.abs(points) <= 2 ? 'ok' : 'watch',
        title: `${points > 0 ? '+' : ''}${points} points / OG ${target.toFixed(3)}`,
        detail:
          Math.abs(points) <= 2
            ? 'Densité proche de la recette.'
            : 'Compare aussi le volume recueilli avant de décider d’une dilution ou d’une correction.'
      };
    }
    return {
      tone: 'neutral',
      title: `Densité ${value.toFixed(3)}`,
      detail: 'Ce relevé suit cette étape. L’OG sera la densité du moût refroidi, avant levure.'
    };
  }
  if (kind === 'volume') {
    const plan = recipe?.waterPlan;
    const grain =
      recipe?.totalGristKg ??
      recipe?.fermentables
        ?.filter((f) => f.kind === 'grain')
        .reduce((sum, f) => sum + f.weightKg, 0) ??
      0;
    const target =
      step.id === 'ensemencement'
        ? recipe?.volumeL
        : step.id === 'preboil' && plan
          ? recipe?.preBoilL ?? plan.mashWaterL + plan.spargeWaterL - grain * (recipe?.brewhouse?.equipment?.grainAbsorptionLPerKg ?? 0.96)
          : undefined;
    if (target && target > 0)
      return {
        tone: Math.abs(value - target) <= target * 0.05 ? 'ok' : 'watch',
        title: `${Math.round((value - target) * 10) / 10 > 0 ? '+' : ''}${Math.round((value - target) * 10) / 10} L / ${step.id === 'preboil' ? 'repère ≈' : 'cible'} ${Math.round(target * 10) / 10} L`,
        detail:
          step.id === 'preboil'
            ? 'Repère eau moins absorption du grain ; le fond de cuve et le volume à chaud peuvent créer un écart.'
            : 'Volume en fermenteur, à comparer avec la densité.'
      };
  }
  return {
    tone: 'neutral',
    title: `${READING[kind].label} : ${value} ${READING[kind].unit}`,
    detail:
      kind === 'ph'
        ? 'pH hors empâtage : aucune dose d’acide de maische calculée.'
        : 'Relevé rattaché à cette étape.'
  };
}

/** Ne réécrit pas les étapes d'un brassage entamé. Ajoute seulement l'horloge commune. */
export function restoreBrewDay(state: BrewDayState): BrewDayState {
  let elapsed = 0;
  const steps = state.steps.map((s) => {
    if (!/^boil-|^hop-/.test(s.id)) return s;
    const next = { ...s, boilElapsedMin: s.boilElapsedMin ?? elapsed };
    if (s.id.startsWith('boil-')) elapsed = next.boilElapsedMin + s.durationMin;
    return next;
  });
  const running = steps.find((s) => s.boilElapsedMin != null && s.startedAt != null);
  return {
    ...state,
    steps,
    currentIndex: Math.max(0, Math.min(state.currentIndex, Math.max(0, steps.length - 1))),
    ...(state.boilStartedAt == null && running
      ? { boilStartedAt: running.startedAt! - running.boilElapsedMin! * 60000 }
      : {})
  };
}

export function startBrewStep(state: BrewDayState, now: number): BrewDayState {
  const s = state.steps[state.currentIndex];
  if (!s || s.doneAt != null || (s.startedAt != null && s.pausedAt == null)) return state;
  const boilStartedAt =
    s.boilElapsedMin != null
      ? (state.boilStartedAt ?? now - s.boilElapsedMin * 60000)
      : state.boilStartedAt;
  const next: BrewDayStep = {
    ...s,
    holdStartedAt: s.holdStartedAt ?? s.startedAt ?? now,
    startedAt:
      s.pausedAt != null
        ? s.startedAt! + now - s.pausedAt
        : s.boilElapsedMin != null
          ? boilStartedAt! + s.boilElapsedMin * 60000
          : now
  };
  delete next.pausedAt;
  return {
    ...state,
    startedAt: state.startedAt ?? now,
    ...(boilStartedAt != null ? { boilStartedAt } : {}),
    steps: state.steps.map((x, i) => (i === state.currentIndex ? next : x))
  };
}

export function completeBrewStep(state: BrewDayState, now: number): BrewDayState {
  const current = state.steps[state.currentIndex];
  if (!current || current.doneAt != null) return state;
  // Confirmer un ajout au début de l'ébullition est aussi le départ de l'horloge.
  const started =
    current.boilElapsedMin != null && state.boilStartedAt == null
      ? startBrewStep(state, now)
      : state;
  const last = state.currentIndex === state.steps.length - 1;
  const nextIndex = last ? state.currentIndex : state.currentIndex + 1;
  return {
    ...started,
    currentIndex: nextIndex,
    ...(last ? { finishedAt: now } : {}),
    steps: started.steps.map((s, i) => {
      if (i === state.currentIndex) return { ...s, doneAt: now };
      // Les paliers démarrent à température atteinte. Seule l'ébullition continue.
      if (i === nextIndex && s.boilElapsedMin != null && started.boilStartedAt != null)
        return {
          ...s,
          startedAt: started.boilStartedAt + s.boilElapsedMin * 60000
        };
      return s;
    })
  };
}

/** Des relevés pré-ébullition ne deviennent jamais l'OG ni le volume en fermenteur. */
export function finalBrewReadings(state: BrewDayState) {
  const readings = [...(state.readings ?? [])].reverse();
  return {
    gravity: readings.find((r) => r.kind === 'densite' && isFinalWort(r.stepId)),
    volume: readings.find((r) => r.kind === 'volume' && r.stepId === 'ensemencement')
  };
}
