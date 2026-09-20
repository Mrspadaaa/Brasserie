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
    s.boilFinishedAt,
    s.thermalChoices,
    s.thermalSegments,
    s.transferredAt,
    s.pitchedAt
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
      title: `Écart ${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10} °C · cible ${step.tempC} °C`,
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
    thermalSegments: state.thermalSegments?.map(segment => segment.stepId === s.id && segment.method === 'heating' && segment.endedAt == null
      ? { ...segment, endedAt: now } : segment),
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
    ...(last && current.id !== 'ensemencement' ? { finishedAt: now } : {}),
    ...(current.id === 'ensemencement' ? { pitchedAt: state.pitchedAt ?? now, finishedAt: state.finishedAt ?? now, phase: 'brewing' as const } : {}),
    thermalSegments: started.thermalSegments?.map(segment => segment.stepId === current.id && segment.endedAt == null ? { ...segment, endedAt: now } : segment),
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

/** Transfer is a physical event, not the start of fermentation. Safe to retry offline. */
export function markTransferred(state: BrewDayState, now: number): BrewDayState {
  if (state.finishedAt != null || state.pitchedAt != null || state.transferredAt != null) return state;
  const pitchIndex = state.steps.findIndex(s => s.id === 'ensemencement');
  return { ...state, phase: 'awaiting-pitch', transferredAt: now,
    currentIndex: pitchIndex >= 0 ? pitchIndex : state.currentIndex,
    thermalSegments: state.thermalSegments?.map(s => s.endedAt == null ? { ...s, endedAt: now } : s),
    notes: [...state.notes ?? [], { id: crypto.randomUUID(), at: now, stepId: 'ensemencement',
      text: 'Transfert en fermenteur consigné. En attente d’ensemencement ; la fermentation n’a pas encore commencé.' }] };
}

/** Confirm the actual yeast addition. No OG, volume or pitch temperature is invented. */
export function recordPitch(state: BrewDayState, now: number, temperatureC?: number): BrewDayState {
  if (state.pitchedAt != null || state.finishedAt != null) return state;
  const temperature = typeof temperatureC === 'number' && Number.isFinite(temperatureC) ? temperatureC : undefined;
  return { ...state, phase: 'brewing', pitchedAt: now, finishedAt: now,
    ...(temperature == null ? {} : { pitchTemperatureC: temperature }),
    steps: state.steps.map(s => s.id === 'ensemencement' ? { ...s, doneAt: now } : s),
    thermalSegments: state.thermalSegments?.map(s => s.endedAt == null ? { ...s, endedAt: now } : s),
    notes: [...state.notes ?? [], { id: crypto.randomUUID(), at: now, stepId: 'ensemencement',
      text: `Levure ajoutée${temperature == null ? ' · température non relevée' : ` · moût à ${temperature} °C`}. Début de fermentation consigné.` }] };
}

export interface QualifiedFinalBrewReading {
  value: number;
  reading: BrewDayReading;
  approximate: boolean;
}

/** Qualify the latest observation before promoting it to the batch. Raw journal values stay intact. */
export function finalBrewReadings(state: BrewDayState, recipe?: Pick<RecipeSnapshot, 'brewhouse'>) {
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const isFinalGravity = (r: BrewDayReading) => r.kind === 'densite' && (r.measurementStage
    ? ['fermenter', 'kettle-cold'].includes(r.measurementStage) : isFinalWort(r.stepId));
  const isFermenterVolume = (r: BrewDayReading) => r.kind === 'volume' && (r.measurementStage
    ? r.measurementStage === 'fermenter' : r.stepId === 'ensemencement');
  const readings = (state.readings ?? []).filter(r => isFinalGravity(r) || isFermenterVolume(r))
    .map((reading, order) => ({ reading, order }))
    .sort((a, b) => (finite(b.reading.at) ? b.reading.at : Infinity) - (finite(a.reading.at) ? a.reading.at : Infinity) || b.order - a.order)
    .map(({ reading }) => reading);
  // An explicitly paired new capture cannot borrow the missing half from an older pair.
  const candidates = readings[0]?.pairId ? readings.filter(r => r.pairId === readings[0].pairId) : readings;
  const rawGravity = candidates.find(isFinalGravity), rawVolume = candidates.find(isFermenterVolume);
  let gravity: QualifiedFinalBrewReading | undefined, volume: QualifiedFinalBrewReading | undefined;
  const reasons = { gravity: 'Densité initiale inconnue : relève le moût refroidi à température de référence.',
    volume: 'Volume en fermenteur inconnu : relève le volume et sa référence de température.' };
  const beforePitch = (r: BrewDayReading) => finite(r.at) && r.at >= 0 && (state.pitchedAt == null || r.at <= state.pitchedAt);
  const wortChangedSince = (r: BrewDayReading) => Object.entries(state.additions ?? {}).some(([id, addition]) =>
    /^(water-|grain-)/.test(id) && addition.amount > 0 && finite(addition.doneAt) &&
    addition.doneAt > r.at && addition.doneAt <= (state.pitchedAt ?? state.finishedAt ?? Infinity),
  );
  if (rawGravity) {
    if (wortChangedSince(rawGravity)) {
      reasons.gravity = 'Le moût a changé depuis cette densité : reprends une mesure après le dernier ajout d’eau ou de fermentescible. Le relevé brut reste au journal.';
    } else if (beforePitch(rawGravity) && rawGravity.unit === 'SG' && finite(rawGravity.value) &&
      rawGravity.value >= READING.densite.min && rawGravity.value <= READING.densite.max && rawGravity.roomTemp === true) {
      gravity = { value: rawGravity.value, reading: rawGravity, approximate: false };
      reasons.gravity = '';
    } else reasons.gravity = 'Dernière densité non qualifiée comme OG : confirme sa référence de température et son prélèvement avant levure. Le relevé brut reste au journal.';
  }
  if (rawVolume) {
    const valid = beforePitch(rawVolume) && rawVolume.unit === 'L' && finite(rawVolume.value) && rawVolume.value > 0;
    const cold = rawVolume.volumeBasis === 'cold' || !rawVolume.volumeBasis && rawVolume.roomTemp === true;
    if (valid && cold && (!finite(rawVolume.temperatureC) || rawVolume.temperatureC <= 30)) {
      volume = { value: rawVolume.value, reading: rawVolume, approximate: false };
      reasons.volume = '';
    } else if (valid && rawVolume.volumeBasis === 'hot' && (!finite(rawVolume.temperatureC) || rawVolume.temperatureC >= 90)) {
      const shrink = recipe?.brewhouse?.equipment?.coolingShrinkagePct;
      if (finite(shrink) && shrink >= 0 && shrink < 20) {
        volume = { value: Number((rawVolume.value * (1 - shrink / 100)).toFixed(3)), reading: rawVolume, approximate: true };
        reasons.volume = '';
      }
    }
    if (!volume) reasons.volume = 'Dernier volume non qualifié à froid : précise sa référence. Un volume à ébullition demande le retrait du profil figé ; le relevé brut reste au journal.';
    if (wortChangedSince(rawVolume)) {
      volume = undefined;
      reasons.volume = 'Le moût a changé depuis ce volume : mesure à nouveau le volume final après les ajouts. Le relevé brut reste au journal.';
    }
  }
  return { gravity, volume, rawGravity, rawVolume, reasons };
}
