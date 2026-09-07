/** Shared pure rules: no browser clock, SDK or network dependency. */
export interface SessionStep {
  id: string;
  label: string;
  durationMin: number;
  startedAt?: number;
  pausedAt?: number;
  doneAt?: number;
  tempC?: number;
  rampStartedAt?: number;
  holdStartedAt?: number;
  boilElapsedMin?: number;
}
export interface SessionState {
  steps: SessionStep[];
  currentIndex: number;
  revision?: number;
  savedAt?: number;
  finishedAt?: number;
  boilStartedAt?: number;
  boilFinishedAt?: number;
  boilDurationMin?: number;
  additions?: Record<string, { amount: number; doneAt?: number }>;
  hopElapsedMin?: Record<string, number>;
  waterMix?: Record<string, { roL: number }>;
  coolingWaterC?: number;
  boilOffLPerHour?: number;
  readings?: Array<{
    at: number;
    kind: string;
    value: number;
    stepId?: string;
  }>;
}
export interface SessionRecipe {
  boilMin?: number;
  hops?: Array<{
    name: string;
    stage: string;
    weightG: number;
    timeMin?: number;
  }>;
  fermentables?: Array<{ name: string; use: string; weightKg: number }>;
}
export function sessionEvents(state: SessionState, recipe: SessionRecipe) {
  const events: Array<{ id: string; at: number; title: string; body: string }> = [];
  if (state.finishedAt != null) return events;
  for (const s of state.steps ?? [])
    if (
      (/^mash/.test(s.id) || s.id === 'whirlpool') &&
      s.durationMin > 0 &&
      s.startedAt != null &&
      s.pausedAt == null &&
      s.doneAt == null
    )
      events.push({
        id: `timer-${s.id}`,
        at: s.startedAt + s.durationMin * 60000,
        title: `Fin · ${s.label}`,
        body: 'Temps de maintien écoulé. Vérifie la cuve et confirme la fin du palier.'
      });
  if (state.boilStartedAt != null && state.boilFinishedAt == null) {
    const start = state.boilStartedAt,
      duration = state.boilDurationMin ?? recipe.boilMin ?? 60,
      end = start + duration * 60000;
    const grouped = new Map<number, { id: string; name: string; amount: number; unit: string }[]>();
    const add = (id: string, name: string, planned: number, remaining: number, unit: string) => {
      const actual = state.additions?.[id];
      if (actual?.doneAt != null || (actual?.amount ?? planned) <= 0) return;
      const at =
        state.hopElapsedMin?.[id] != null
          ? Math.min(end, Math.max(start, start + state.hopElapsedMin[id] * 60000))
          : Math.max(start, end - remaining * 60000);
      grouped.set(at, [
        ...(grouped.get(at) ?? []),
        { id, name, amount: actual?.amount ?? planned, unit }
      ]);
    };
    (recipe.hops ?? []).forEach((h, i) => {
      if (h.stage === 'boil') add(`hop-${i}`, h.name, h.weightG, h.timeMin ?? 0, 'g');
    });
    (recipe.fermentables ?? []).forEach((f, i) => {
      if (f.use === 'ebullition')
        add(`grain-${i}`, f.name, f.weightKg, Math.min(10, recipe.boilMin ?? 60), 'kg');
    });
    for (const [at, items] of grouped)
      events.push({
        id: `add-${items.map((i) => i.id).join('-')}`,
        at,
        title: 'Ajout en cuve',
        body: items.map((i) => `${i.amount} ${i.unit} ${i.name}`).join(' · ')
      });
    events.push({
      id: 'boil-end',
      at: end,
      title: 'Fin d’ébullition',
      body: 'Couper le feu et confirmer. Passer au whirlpool ou au refroidissement.'
    });
  }
  return events.sort((a, b) => a.at - b.at);
}

/** Reject malformed/outsize journals before a transaction; historical times are retained. */
export function validateSession(input: unknown): SessionState {
  if (!input || typeof input !== 'object' || JSON.stringify(input).length > 250000)
    throw new Error('Journal invalide ou trop volumineux.');
  const s = input as SessionState;
  if (
    !Array.isArray(s.steps) ||
    !s.steps.length ||
    s.steps.length > 128 ||
    !Number.isInteger(s.currentIndex) ||
    s.currentIndex < 0 ||
    s.currentIndex >= s.steps.length
  )
    throw new Error('Étapes invalides.');
  const ids = new Set();
  for (const step of s.steps) {
    if (
      !step ||
      typeof step.id !== 'string' ||
      !step.id ||
      ids.has(step.id) ||
      typeof step.label !== 'string' ||
      step.label.length > 160 ||
      !Number.isFinite(step.durationMin) ||
      step.durationMin < 0 ||
      step.durationMin > 480
    )
      throw new Error('Palier invalide.');
    ids.add(step.id);
    for (const key of [
      'startedAt',
      'pausedAt',
      'doneAt',
      'rampStartedAt',
      'holdStartedAt'
    ] as const)
      if (step[key] != null && (!Number.isFinite(step[key]) || step[key]! < 0))
        throw new Error('Horodatage invalide.');
    if (step.pausedAt != null && (step.startedAt == null || step.pausedAt < step.startedAt))
      throw new Error('Pause sans départ valide.');
  }
  for (const key of ['boilStartedAt', 'boilFinishedAt', 'finishedAt'] as const)
    if (s[key] != null && (!Number.isFinite(s[key]) || s[key]! < 0))
      throw new Error('Horodatage invalide.');
  if (
    s.boilDurationMin != null &&
    (!Number.isFinite(s.boilDurationMin) || s.boilDurationMin < 1 || s.boilDurationMin > 480)
  )
    throw new Error('Durée invalide.');
  if (s.boilFinishedAt != null && (s.boilStartedAt == null || s.boilFinishedAt < s.boilStartedAt))
    throw new Error('Fin d’ébullition avant son départ.');
  for (const x of Object.values(s.additions ?? {}))
    if (!x || !Number.isFinite(x.amount) || x.amount < 0 || x.amount > 100000)
      throw new Error('Quantité invalide.');
  for (const x of Object.values(s.additions ?? {}))
    if (x.doneAt != null && (!Number.isFinite(x.doneAt) || x.doneAt < 0))
      throw new Error('Heure d’ajout invalide.');
  for (const x of Object.values(s.hopElapsedMin ?? {}))
    if (!Number.isFinite(x) || x < 0 || x > 480) throw new Error('Horaire houblon invalide.');
  for (const x of Object.values(s.waterMix ?? {}))
    if (!x || !Number.isFinite(x.roL) || x.roL < 0 || x.roL > 100000)
      throw new Error('Coupe d’eau invalide.');
  if (
    s.coolingWaterC != null &&
    (!Number.isFinite(s.coolingWaterC) || s.coolingWaterC < 0 || s.coolingWaterC > 60)
  )
    throw new Error('Température de refroidissement invalide.');
  if (
    s.boilOffLPerHour != null &&
    (!Number.isFinite(s.boilOffLPerHour) || s.boilOffLPerHour < 0 || s.boilOffLPerHour > 100)
  )
    throw new Error('Évaporation invalide.');
  if (s.readings != null && (!Array.isArray(s.readings) || s.readings.length > 2000))
    throw new Error('Relevés invalides.');
  for (const x of s.readings ?? [])
    if (
      !x ||
      !Number.isFinite(x.at) ||
      x.at < 0 ||
      !Number.isFinite(x.value) ||
      !['temperature', 'volume', 'densite', 'ph'].includes(x.kind)
    )
      throw new Error('Relevé invalide.');
  return JSON.parse(JSON.stringify(s));
}

/** Only newly captured timestamps near the client anchor are corrected, never old history. */
export function stampSession(
  input: SessionState,
  previous: SessionState | undefined,
  clientNow: number,
  serverNow: number
) {
  const next = validateSession(input) as unknown as Record<string, any>;
  const shift = (obj: Record<string, any>, old: Record<string, any> | undefined) => {
    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === 'number' &&
        /^(at|startedAt|pausedAt|doneAt|rampStartedAt|holdStartedAt|boilStartedAt|boilFinishedAt|finishedAt)$/.test(
          key
        ) &&
        value !== old?.[key] &&
        Math.abs(value - clientNow) < 5000
      )
        obj[key] = serverNow + (value - clientNow);
      else if (value && typeof value === 'object') {
        if (Array.isArray(value))
          value.forEach((v, i) => {
            if (v && typeof v === 'object')
              shift(v, old?.[key]?.find?.((x: any) => x.id && x.id === v.id) ?? old?.[key]?.[i]);
          });
        else shift(value, old?.[key]);
      }
    }
  };
  shift(next, previous);
  const readingTimes = new Map(
    (input.readings ?? []).map((r, i) => [r.at, next.readings?.[i]?.at ?? r.at])
  );
  for (const correction of next.acidCorrections ?? [])
    correction.readingAt = readingTimes.get(correction.readingAt) ?? correction.readingAt;
  next.revision = (previous?.revision ?? 0) + 1;
  next.savedAt = serverNow;
  return validateSession(next);
}
