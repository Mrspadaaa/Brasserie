import { breweryDay, hasBrewStarted, plannedBrewDate, type BatchDates } from '../../functions/src/batchSchedule';
export * from '../../functions/src/batchSchedule';

/** Un brassin « planifié » dont la date prévue est passée et qui n'a pas commencé : à signaler (test en ligne n° 33). */
export function plannedDateIsPast(batch: BatchDates, now: number = Date.now()): boolean {
  const date = plannedBrewDate(batch);
  if (!date || hasBrewStarted(batch)) return false;
  const key = (d: string) => d.split('.').reverse().join('-');
  return key(date) < key(breweryDay(now));
}
