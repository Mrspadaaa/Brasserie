import { describe, expect, it } from 'vitest';
import { actualBrewDate, batchDisplayDate, breweryDay, brewSessionDatePatch, hasBrewStarted, normalizeBrewDate, plannedBrewDate, preserveBrewDates, rescheduleBatchPatch } from '../../src/domain/batchSchedule';
import { stampSession, validateSession } from '../../functions/src/brewSessionCore';
import { batchEntries, filterCatalog, DEFAULT_CATALOG_FILTERS } from '../../src/domain/productionCatalog';
import { daysSinceBrew } from '../../src/domain/productionInsights';
import type { Batch } from '../../src/types';

const time = Date.parse('2026-09-20T22:30:00Z'); // 21 September in the brewery.
const batch = (over: Partial<Batch> = {}): Batch => ({ id: 'LOT-1', name: 'Pale', style: 'Pale Ale', volumeL: 20, status: 'planifie', brewDate: '', plannedBrewDate: '25.09.2026', ...over });

describe('intention and actual brewing day', () => {
  it.each(['20.09.2026', '2026-09-20', ' 20.09.2026 '])('normalizes %s without changing the calendar day', value => expect(normalizeBrewDate(value)).toBe('20.09.2026'));
  it.each(['31.02.2026', '2026-02-29', '00.09.2026', '20.13.2026', 'x', '', undefined])('does not turn %s into a plausible date', value => expect(normalizeBrewDate(value)).toBeUndefined());
  it('accepts leap day and formats real timestamps in the brewery timezone', () => {
    expect(normalizeBrewDate('2028-02-29')).toBe('29.02.2028');
    expect(breweryDay(time)).toBe('21.09.2026');
  });
  it.each([
    ['2026-09-20T22:30:00Z', '22.09.2026'],
    ['2026-10-24T22:30:00Z', '26.10.2026'],
    ['2026-03-28T23:30:00Z', '30.03.2026']
  ])('moves calendar days from Zurich, including daylight-saving changes: %s', (timestamp, tomorrow) => {
    expect(breweryDay(Date.parse(timestamp), 1)).toBe(tomorrow);
  });
  it('has no actual date for a future, undated or merely consulted batch', () => {
    for (const value of [batch(), batch({ plannedBrewDate: '' }), batch({ brewDay: { steps: [], currentIndex: 0, notes: [{ id: 'n', at: time, stepId: 'eau', text: 'À préparer' }] } })]) {
      expect(hasBrewStarted(value)).toBe(false);
      expect(actualBrewDate(value)).toBeUndefined();
      expect(daysSinceBrew(value)).toBeUndefined();
    }
  });
  it('retains a legacy planning day without mistaking it for an actual day', () => {
    const old = batch({ plannedBrewDate: undefined, brewDate: '2026-09-25' });
    expect(plannedBrewDate(old)).toBe('25.09.2026'); expect(actualBrewDate(old)).toBeUndefined();
    expect(rescheduleBatchPatch(old, '')).toEqual({ plannedBrewDate: '', brewDate: '' });
    expect(old.brewDate).toBe('2026-09-25');
  });
  it('records a different actual day and keeps the initial plan', () => {
    const current = batch();
    const patch = brewSessionDatePatch(current, { startedAt: time });
    expect(patch).toEqual({ plannedBrewDate: '25.09.2026', brewDate: '21.09.2026' });
    const started = { ...current, ...patch, brewDay: { steps: [], currentIndex: 0, startedAt: time } };
    expect(actualBrewDate(started)).toBe('21.09.2026');
    expect(batchDisplayDate(started)).toBe('21.09.2026');
    expect(() => rescheduleBatchPatch(started, '29.09.2026')).toThrow('commencé');
  });
  it.each([
    { startedAt: time }, { boilStartedAt: time }, { steps: [{ doneAt: time }] },
    { steps: [{ rampStartedAt: time }] }, { steps: [{ holdStartedAt: time }] },
    { thermalSegments: [{ startedAt: time }] }, { transferredAt: time }, { pitchedAt: time },
    { additions: { malt: { doneAt: time } } }, { readings: [{ at: time }] }, { finishedAt: time }
  ])('recognizes actual work even without an explicit global start', session => {
    expect(brewSessionDatePatch(batch({ plannedBrewDate: '' }), session)).toEqual({ plannedBrewDate: '', brewDate: '21.09.2026' });
  });
  it('uses the earliest actual event, not a later resumed timer', () => {
    expect(brewSessionDatePatch(batch(), { startedAt: time + 86400000, steps: [{ doneAt: time }] }).brewDate).toBe('21.09.2026');
  });
  it('keeps the brewing day when yeast is added the next day, including legacy thermal journals', () => {
    const session = {
      startedAt: time + 86400000,
      transferredAt: time + 3600000,
      pitchedAt: time + 86400000,
      steps: [{ rampStartedAt: time - 3600000, holdStartedAt: time }],
      thermalSegments: [{ startedAt: time - 7200000 }]
    };
    expect(brewSessionDatePatch(batch(), session)).toEqual({ plannedBrewDate: '25.09.2026', brewDate: '20.09.2026' });
    expect(brewSessionDatePatch(batch({ brewDate: '19.09.2026' }), session)).toEqual({});
    expect(brewSessionDatePatch(batch(), { transferredAt: time, pitchedAt: time + 86400000 }).brewDate).toBe('21.09.2026');
  });
  it('does not overwrite historical or manually corrected real dates', () => {
    expect(brewSessionDatePatch(batch({ status: 'termine', plannedBrewDate: undefined, brewDate: '18.09.2026' }), { startedAt: time })).toEqual({});
    const corrected = batch({ brewDate: '19.09.2026', brewDay: { steps: [], currentIndex: 0, startedAt: time } });
    expect(actualBrewDate(corrected)).toBe('19.09.2026');
    expect(brewSessionDatePatch(corrected, { startedAt: time })).toEqual({});
  });
  it('repairs a legacy in-progress batch only when saving the journal', () => {
    const legacy = batch({ plannedBrewDate: undefined, brewDate: '25.09.2026', brewDay: { startedAt: time, steps: [], currentIndex: 0 } });
    expect(actualBrewDate(legacy)).toBe('21.09.2026');
    expect(brewSessionDatePatch(legacy, legacy.brewDay!)).toEqual({ plannedBrewDate: '25.09.2026', brewDate: '21.09.2026' });
    expect(legacy.brewDate).toBe('25.09.2026');
  });
  it('keeps missing actual dates missing for manually advanced historical lots', () => {
    expect(actualBrewDate(batch({ status: 'fermentation' }))).toBeUndefined();
  });
  it('retains an explicit actual date even without journal details', () => {
    expect(actualBrewDate(batch({ brewDate: '19.09.2026' }))).toBe('19.09.2026');
  });
  it('does not erase an unreadable legacy planning date when brewing starts', () => {
    expect(brewSessionDatePatch(batch({ plannedBrewDate: undefined, brewDate: 'septembre 2026' }), { startedAt: time }))
      .toEqual({ plannedBrewDate: 'septembre 2026', brewDate: '21.09.2026' });
  });
  it('preserves an unreadable historical actual date when reactivating or saving its journal', () => {
    const legacy = batch({ status: 'fermentation', plannedBrewDate: undefined, brewDate: 'septembre 2026' });
    const reopened = { ...legacy, ...preserveBrewDates(legacy), status: 'planifie' };
    expect(hasBrewStarted(reopened)).toBe(true);
    expect(actualBrewDate(reopened)).toBeUndefined();
    expect(() => rescheduleBatchPatch(reopened, '')).toThrow('commencé');
    expect(brewSessionDatePatch(legacy, { startedAt: time })).toEqual({});
    expect(brewSessionDatePatch(reopened, { startedAt: time })).toEqual({});
  });
  it('validates the global start and uses its server-stamped time', () => {
    const state = { steps: [{ id: 'eau', label: 'Eau', durationMin: 0 }], currentIndex: 0, startedAt: time };
    expect(() => validateSession({ ...state, startedAt: Infinity })).toThrow('Horodatage');
    const saved = stampSession(state, undefined, time, time + 1000);
    expect(saved.startedAt).toBe(time + 1000);
    expect(brewSessionDatePatch(batch(), saved).brewDate).toBe('21.09.2026');
  });
  it('sorts the catalogue on its planned date and keeps unscheduled lots in all dates', () => {
    const rows = batchEntries([batch({ id: 'later' }), batch({ id: 'undated', plannedBrewDate: '' }), batch({ id: 'sooner', plannedBrewDate: '22.09.2026' })]);
    expect(rows[0].date).toBe('25.09.2026');
    expect(filterCatalog(rows, { ...DEFAULT_CATALOG_FILTERS, period: 'all', sort: 'work' }, 'all').map(row => row.id)).toEqual(['sooner', 'later', 'undated']);
  });
});
