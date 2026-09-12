import { describe, it, expect, vi, afterEach } from 'vitest';
import { DateUtils } from '../../src/services/dateUtils';
afterEach(()=>vi.useRealTimers());
describe('Dates de comptabilité sans année figée',()=>{
  it('rejette les jours impossibles et conserve le 29 février bissextile',()=>{
    expect(DateUtils.parseDate('31.02.2026')).toBeNull();expect(DateUtils.parseDate('2026-02-29')).toBeNull();
    expect(DateUtils.parseDate('29.02.2028')?.getDate()).toBe(29);
  });
  it('filtre explicitement les exercices passés quand l’horloge change',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date(2028,1,4));
    expect(DateUtils.isDateInPeriod('15.02.2026','q1')).toBe(false);
    expect(DateUtils.isDateInPeriod('15.02.2026','year-2026')).toBe(true);
    expect(DateUtils.isDateInPeriod('15.02.2026','month-2026-02')).toBe(true);
  });
});
