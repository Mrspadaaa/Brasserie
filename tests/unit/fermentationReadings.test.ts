import { describe, expect, it } from 'vitest';
import { fermentationReadings } from '../../src/domain/fermentationReadings';
import { Batch } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
const batch: Batch = {
  id: 'LOT',
  name: 'Test',
  style: 'IPA',
  brewDate: '',
  volumeL: 20,
  status: 'planifie'
};
describe('Fermentation observations', () => {
  it('contains no invented OG, FG, temperature, date or attenuation', () => {
    expect(fermentationReadings(batch)).toEqual({
      points: [],
      target: undefined,
      latest: undefined,
      attenuation: undefined
    });
  });
  it('keeps the recipe target separate from the measured curve', () => {
    const result = fermentationReadings({
      ...batch,
      og: '1,050',
      fg: '1,010',
      recipeSnapshot: captureSnapshot({ ...fullRecipe, fgTarget: 1.012 })
    });
    expect(result.points.map((p) => p.sg)).toEqual([1.05, 1.01]);
    expect(result.target).toBe(1.012);
    expect(result.attenuation).toBeCloseTo(80, 8);
    expect(
      result.points.every((p) => p.tempC === undefined && p.date === 'Date non renseignée')
    ).toBe(true);
  });
  it('orders actual measurements by date and excludes invalid observations', () => {
    const result = fermentationReadings({
      ...batch,
      gravityLog: [
        { date: '03.09.2026', sg: 1.02, tempC: 0 },
        { date: '01.09.2026', sg: 1.04, tempC: 20 },
        { date: '', sg: NaN, tempC: NaN }
      ]
    });
    expect(result.points.map((p) => p.sg)).toEqual([1.04, 1.02]);
    expect(result.points[1].tempC).toBe(0);
  });
});
