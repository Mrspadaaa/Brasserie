import { describe, expect, it } from 'vitest';
import { plageEbc, positionDansPlage, texteSuisse } from '../../../src/ui/identite/plages';

describe('plages du style', () => {
  it('place la valeur par rapport à la plage', () => {
    const p = { min: 12, max: 28 };
    expect(positionDansPlage(9.5, p)).toBe('sous');
    expect(positionDansPlage(30, p)).toBe('au-dessus');
    expect(positionDansPlage(12, p)).toBe('dedans');
    expect(positionDansPlage(28, p)).toBe('dedans');
  });
  it('une valeur inconnue n’est jamais « dedans »', () => {
    expect(positionDansPlage(null, { min: 1, max: 2 })).toBe('inconnu');
    expect(positionDansPlage(Number.NaN, { min: 1, max: 2 })).toBe('inconnu');
    expect(positionDansPlage(5, undefined)).toBe('inconnu');
  });
  it('SRM → EBC', () => {
    expect(plageEbc({ min: 6, max: 14 })).toEqual({ min: 12, max: 28 });
    expect(plageEbc(undefined)).toBeUndefined();
  });
  it('texte à la suisse', () => {
    expect(texteSuisse({ min: 1.065, max: 1.085 }, 3)).toBe('1,065–1,085');
    expect(texteSuisse({ min: 60, max: 100 })).toBe('60–100');
    expect(texteSuisse({ min: 7.5, max: 10 })).toBe('7,5–10');
  });
});
