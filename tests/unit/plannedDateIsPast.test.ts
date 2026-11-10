import { describe, expect, it } from 'vitest';
import { plannedDateIsPast } from '../../src/domain/batchSchedule';

// Test en ligne n° 33 (07.11) : « Prévu le 08.09.2026 » alors qu'on est le 07.11, sans alerte.
describe('plannedDateIsPast (n° 33)', () => {
  const now = Date.UTC(2026, 10, 7, 12);
  it('signale un brassin planifié dont la date est passée', () => {
    expect(plannedDateIsPast({ status: 'planifie', plannedBrewDate: '08.09.2026' } as never, now)).toBe(true);
  });
  it('ne signale ni une date future, ni aujourd’hui, ni l’absence de date', () => {
    expect(plannedDateIsPast({ status: 'planifie', plannedBrewDate: '08.11.2026' } as never, now)).toBe(false);
    expect(plannedDateIsPast({ status: 'planifie', plannedBrewDate: '07.11.2026' } as never, now)).toBe(false);
    expect(plannedDateIsPast({ status: 'planifie' } as never, now)).toBe(false);
  });
});
