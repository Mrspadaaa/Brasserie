import type { FermentationStep } from '../types';

/** A recipe stores how long each setpoint is held, not its absolute start day. */
export type FermentationTimelineStep = Omit<FermentationStep, 'tempC' | 'days'> & {
  tempC?: number;
  days?: number;
};

export type PositionedFermentationStep = FermentationTimelineStep & {
  index: number;
  /** Elapsed days since the planned start J0. Null follows an unknown duration. */
  start: number | null;
  end: number | null;
};

export type FermentationTransition = {
  /** The phase entered at this elapsed day. The first phase begins at J0. */
  phaseIndex: number;
  day: number | null;
  fromTempC?: number;
  toTempC?: number;
  kind: 'temperature-change' | 'same-temperature' | 'unknown-temperature';
};

export type PlannedFermentationContact = {
  dayOffset?: number;
  contactHours?: number;
};

/** Contacts use the same J0 but never extend a fermentation phase. */
export function positionFermentationContact(contact: PlannedFermentationContact) {
  const start = typeof contact.dayOffset === 'number' && Number.isFinite(contact.dayOffset) && contact.dayOffset >= 0
    ? contact.dayOffset : null;
  const end = start !== null && typeof contact.contactHours === 'number' && Number.isFinite(contact.contactHours) && contact.contactHours >= 0
    && Number.isFinite(start + contact.contactHours / 24) ? start + contact.contactHours / 24 : null;
  return { start, end };
}

/** Jn is an elapsed boundary: 10 j then 10 j means J0 → J10 → J20. */
export function positionFermentationSteps(steps: readonly FermentationTimelineStep[]): PositionedFermentationStep[] {
  let elapsed: number | null = 0;
  return steps.map((step, index) => {
    const start = elapsed;
    const days = step.days;
    const end = start !== null && typeof days === 'number' && Number.isFinite(days) && days >= 0 && Number.isFinite(start + days)
      ? start + days : null;
    elapsed = end;
    return { ...step, index, start, end };
  });
}

export function planFermentationTimeline(steps: readonly FermentationTimelineStep[]) {
  const phases = positionFermentationSteps(steps);
  const transitions: FermentationTransition[] = phases.slice(1).map((phase, index) => {
    const previous = phases[index];
    const fromTempC = Number.isFinite(previous.tempC) ? previous.tempC : undefined;
    const toTempC = Number.isFinite(phase.tempC) ? phase.tempC : undefined;
    const kind = fromTempC === undefined || toTempC === undefined ? 'unknown-temperature'
      : fromTempC === toTempC ? 'same-temperature' : 'temperature-change';
    return { phaseIndex: phase.index, day: phase.start, fromTempC, toTempC, kind };
  });
  return { phases, transitions, endDay: phases.at(-1)?.end ?? null };
}

/**
 * Set the end boundary of a phase. The selected phase owns this boundary, so
 * only its duration changes and every later phase keeps its own duration.
 * Returns undefined when the phase start is unknown or the requested day is
 * before that start; a time drag cannot recover an unknown preceding duration.
 */
export function moveFermentationTimelinePhaseEnd(
  steps: readonly FermentationTimelineStep[],
  phaseIndex: number,
  endDay: number,
): FermentationTimelineStep[] | undefined {
  const phase = positionFermentationSteps(steps)[phaseIndex];
  if (!phase || phase.start === null || !Number.isFinite(endDay) || endDay < phase.start) return;
  return editFermentationTimelineStep(steps, phaseIndex, { days: endDay - phase.start });
}

/** Pure field edit; assigning undefined represents a genuinely unknown value. */
export function editFermentationTimelineStep(
  steps: readonly FermentationTimelineStep[],
  phaseIndex: number,
  patch: Partial<FermentationTimelineStep>,
): FermentationTimelineStep[] {
  if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= steps.length) {
    throw new RangeError(`Palier de fermentation invalide : ${phaseIndex}`);
  }
  return steps.map((step, index) => index === phaseIndex ? { ...step, ...patch } : { ...step });
}

/** Insert a phase after the selected one (-1 inserts at J0); no values are inferred. */
export function insertFermentationTimelineStep(
  steps: readonly FermentationTimelineStep[],
  afterIndex: number,
  step: FermentationTimelineStep,
): FermentationTimelineStep[] {
  if (!Number.isInteger(afterIndex) || afterIndex < -1 || afterIndex >= steps.length) {
    throw new RangeError(`Palier de fermentation invalide : ${afterIndex}`);
  }
  const next = steps.map(current => ({ ...current }));
  next.splice(afterIndex + 1, 0, { ...step });
  return next;
}

/** Remove exactly one phase. Durations, names, notes and order of others stay intact. */
export function removeFermentationTimelineStep(
  steps: readonly FermentationTimelineStep[],
  phaseIndex: number,
): FermentationTimelineStep[] {
  if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= steps.length) {
    throw new RangeError(`Palier de fermentation invalide : ${phaseIndex}`);
  }
  return steps.filter((_, index) => index !== phaseIndex).map(step => ({ ...step }));
}
