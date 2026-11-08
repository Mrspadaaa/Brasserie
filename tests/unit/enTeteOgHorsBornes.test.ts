import { describe, expect, it } from 'vitest';
import { formatOgEnTete } from '../../src/domain/recipeMetrics';

// Rejeu en ligne du 08.11, RJ-4 : 10 000 kg de grain donnaient « OG 97,511 » dans l'en-tête, comme une valeur.
describe('RJ-4 · l’OG de l’en-tête de la recette', () => {
  it('hors bornes (> 1,130) : « — », jamais le nombre', () => {
    expect(formatOgEnTete(97.511)).toBe('—');
    expect(formatOgEnTete(1.33)).toBe('—');
    expect(formatOgEnTete(1.1301)).toBe('—');
  });
  it('dans les bornes : la densité à la française', () => {
    expect(formatOgEnTete(1.08)).toBe('1,080');
    expect(formatOgEnTete(1.13)).toBe('1,130');
  });
  it('inconnue : « — », jamais 0', () => {
    expect(formatOgEnTete(null)).toBe('—');
    expect(formatOgEnTete(undefined)).toBe('—');
    expect(formatOgEnTete(Number.NaN)).toBe('—');
  });
});
