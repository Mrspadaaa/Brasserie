import { BrewDayState } from '../types';

const timestamp =
  /^(at|startedAt|pausedAt|doneAt|rampStartedAt|holdStartedAt|boilStartedAt|boilFinishedAt|finishedAt)$/;
const identity = (v: any) =>
  v?.id ?? (v?.kind && v?.at != null ? `${v.kind}:${v.stepId}:${v.at}` : undefined);

/** Carry canonical timestamps through later queued snapshots without undoing new user edits. */
export function mergeBrewTimestamps(
  local: BrewDayState,
  sent: BrewDayState,
  saved: BrewDayState
): BrewDayState {
  const readingTimes = new Map(
    (sent.readings ?? []).map((r, i) => [r.at, saved.readings?.[i]?.at ?? r.at])
  );
  const merge = (value: any, before: any, canonical: any): any => {
    if (Array.isArray(value))
      return value.map((entry, i) => {
        const id = identity(entry);
        const index = id != null ? before?.findIndex((x: any) => identity(x) === id) : i;
        // The server preserves array order; legacy readings can have no stable ID.
        return merge(entry, before?.[index], canonical?.[index]);
      });
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key === 'readingAt' && readingTimes.has(entry as number)
          ? readingTimes.get(entry as number)
          : timestamp.test(key) && entry === before?.[key] && typeof canonical?.[key] === 'number'
            ? canonical[key]
            : merge(entry, before?.[key], canonical?.[key])
      ])
    );
  };
  return merge(local, sent, saved);
}
