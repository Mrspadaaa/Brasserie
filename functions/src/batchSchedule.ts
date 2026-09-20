/** Calendar dates belong to a batch. A recipe is reusable; opening its journal is not brewing. */
export interface BatchDates {
  status: string;
  brewDate?: string;
  /** Empty string explicitly means unscheduled. Undefined identifies the legacy single-date model. */
  plannedBrewDate?: string;
  brewDay?: BrewDateSession;
}
export interface BrewDateSession {
  startedAt?: number;
  finishedAt?: number;
  boilStartedAt?: number;
  steps?: Array<{ startedAt?: number; doneAt?: number }>;
  additions?: Record<string, { doneAt?: number }>;
  readings?: Array<{ at: number }>;
}

/** Accept the two stored formats, but never normalize an impossible calendar day. */
export function normalizeBrewDate(value: string | undefined): string | undefined {
  const text = value?.trim() ?? '';
  const swiss = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!swiss && !iso) return undefined;
  const [year, month, day] = swiss ? [+swiss[3], +swiss[2], +swiss[1]] : [+iso![1], +iso![2], +iso![3]];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 2200 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

/** The brewery's calendar day is stable across server/device time zones. */
const breweryCalendar = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', year: 'numeric' });
export function breweryDay(at: number, offsetDays = 0): string {
  const today = breweryCalendar.format(at);
  if (!offsetDays) return today;
  const [day, month, year] = today.split('.').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return `${String(shifted.getUTCDate()).padStart(2, '0')}.${String(shifted.getUTCMonth() + 1).padStart(2, '0')}.${shifted.getUTCFullYear()}`;
}

export function brewStartedAt(session?: BrewDateSession): number | undefined {
  const times = [session?.startedAt, session?.boilStartedAt, session?.finishedAt,
    ...(session?.steps ?? []).flatMap(step => [step.startedAt, step.doneAt]),
    ...Object.values(session?.additions ?? {}).map(item => item.doneAt),
    ...(session?.readings ?? []).map(reading => reading.at)]
    .filter((time): time is number => typeof time === 'number' && Number.isFinite(time) && time >= 0);
  return times.length ? Math.min(...times) : undefined;
}

export function hasBrewStarted(batch: BatchDates): boolean {
  return brewStartedAt(batch.brewDay) !== undefined
    || batch.plannedBrewDate !== undefined && !!batch.brewDate?.trim()
    || !['planifie', 'annule'].includes(batch.status);
}

export function plannedBrewDate(batch: BatchDates): string | undefined {
  return normalizeBrewDate(batch.plannedBrewDate !== undefined ? batch.plannedBrewDate
    : batch.status === 'planifie' ? batch.brewDate : undefined);
}

export function actualBrewDate(batch: BatchDates): string | undefined {
  if (!hasBrewStarted(batch)) return undefined;
  const started = brewStartedAt(batch.brewDay);
  // Legacy planned batches used brewDate for the intention, even after their first timer.
  if (batch.plannedBrewDate === undefined && batch.status === 'planifie' && started !== undefined) return breweryDay(started);
  return normalizeBrewDate(batch.brewDate) ?? (started !== undefined ? breweryDay(started) : undefined);
}

export function batchDisplayDate(batch: BatchDates): string | undefined {
  return hasBrewStarted(batch) ? actualBrewDate(batch) : plannedBrewDate(batch);
}

/** Freeze a legacy date's meaning before changing the status that disambiguated it. */
export function preserveBrewDates(batch: BatchDates): { brewDate?: string; plannedBrewDate?: string } {
  if (batch.plannedBrewDate !== undefined) return {};
  return hasBrewStarted(batch)
    ? { plannedBrewDate: plannedBrewDate(batch) ?? '', brewDate: actualBrewDate(batch) ?? batch.brewDate ?? '' }
    : { plannedBrewDate: plannedBrewDate(batch) ?? batch.brewDate ?? '', brewDate: '' };
}

/** Persist alongside the journal, atomically on the server. Preserve a corrected actual day. */
export function brewSessionDatePatch(batch: BatchDates, session: BrewDateSession): { brewDate?: string; plannedBrewDate?: string } {
  const started = brewStartedAt(session);
  if (started === undefined) return {};
  if (batch.plannedBrewDate !== undefined && batch.brewDate?.trim()) return {};
  if (batch.plannedBrewDate === undefined && !['planifie', 'annule'].includes(batch.status) && batch.brewDate?.trim()) return {};
  return { plannedBrewDate: plannedBrewDate(batch) ?? batch.plannedBrewDate ?? (batch.status === 'planifie' ? batch.brewDate : undefined) ?? '', brewDate: breweryDay(started) };
}

export function rescheduleBatchPatch(batch: BatchDates, date: string): { plannedBrewDate: string; brewDate: string } {
  if (hasBrewStarted(batch)) throw new Error('Le brassage a commencé. Corrige sa date réelle dans les mesures.');
  if (batch.status === 'annule') throw new Error('Ce brassin est annulé. Remets-le à préparer avant de choisir une date.');
  const normalized = normalizeBrewDate(date);
  if (date.trim() && !normalized) throw new Error('Choisis une date valide ou « À définir ».');
  return { plannedBrewDate: normalized ?? '', brewDate: '' };
}
