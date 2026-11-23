import { describe, expect, it } from 'vitest';
import { ratioToShare, shareToRatio } from '../../src/ui/water/ratioScale';

describe('Piste SO₄/Cl : part de sulfate dans les deux ions', () => {
  it.each([
    [0, 0],
    [0.5, 100 / 3],
    [1, 50],
    [2, 200 / 3],
    [9, 90]
  ])('place le rapport %s à %s %% et retrouve le rapport', (ratio, share) => {
    expect(ratioToShare(ratio)).toBeCloseTo(share, 12);
    expect(shareToRatio(share)).toBeCloseTo(ratio, 12);
  });

  it('représente explicitement l’absence de chlorure en bout de piste', () => {
    expect(ratioToShare(Infinity)).toBe(100);
    expect(shareToRatio(100)).toBe(Infinity);
  });

  it('conserve l’ordre et inverse la conversion sur la plage utile', () => {
    const ratios = [0, 0.05, 0.2, 0.4, 0.7, 0.8108974358974359, 0.9, 1, 1.2, 2, 2.8, 5, 9];
    let previous = -1;
    for (const ratio of ratios) {
      const share = ratioToShare(ratio);
      expect(share).toBeGreaterThan(previous);
      expect(shareToRatio(share)).toBeCloseTo(ratio, 12);
      previous = share;
    }
  });

  it('borne les entrées hors domaine sans produire de NaN', () => {
    for (const ratio of [-1, -Infinity, NaN]) expect(ratioToShare(ratio)).toBe(0);
    for (const share of [-1, -Infinity, NaN]) expect(shareToRatio(share)).toBe(0);
    for (const share of [101, Infinity]) expect(shareToRatio(share)).toBe(Infinity);
    expect(ratioToShare(Number.MAX_VALUE)).toBe(100);
  });
});
