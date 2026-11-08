import { describe, expect, it } from 'vitest';
import { parseReading, readingFeedback } from '../../src/domain/brewDay';
import type { BrewDayStep, RecipeSnapshot } from '../../src/types';

// Voie b du 08.11 : AM-41 (pH 0,1 à 14, 120 °C, 100 000 L), AM-42 (volume > cuve ou fermenteur), AM-43 (ensemencement jusqu'à 120 °C).
describe('bornes des mesures du jour de brassage (AM-41)', () => {
  it('pH : 5,4 passe ; 0,1 ; 14 ; 3 « virgule oubliée » (54) sont refusés', () => {
    expect(parseReading('5,4', 'ph')).toBe(5.4);
    expect(parseReading('0,1', 'ph')).toBeNull();
    expect(parseReading('14', 'ph')).toBeNull();
    expect(parseReading('54', 'ph')).toBeNull();
  });
  it('température : 67 et 100 passent ; 120 et 1000 sont refusés', () => {
    expect(parseReading('67', 'temperature')).toBe(67);
    expect(parseReading('100', 'temperature')).toBe(100);
    expect(parseReading('120', 'temperature')).toBeNull();
    expect(parseReading('1000', 'temperature')).toBeNull();
  });
  it('volume : 25 passe ; 100000 est refusé', () => {
    expect(parseReading('25', 'volume')).toBe(25);
    expect(parseReading('100000', 'volume')).toBeNull();
  });
  it('densité : 1056 devient 1,056 ; 0,9 et 1,3 sont refusées (mêmes bornes que gravityBounds)', () => {
    expect(parseReading('1056', 'densite')).toBe(1.056);
    expect(parseReading('0,9', 'densite')).toBeNull();
    expect(parseReading('1,3', 'densite')).toBeNull();
  });
});

const recette = (extra: Partial<RecipeSnapshot['brewhouse']> = {}) =>
  ({ brewhouse: { equipment: { kettleCapacityL: 45, fermenterCapacityL: 30 }, ...extra } }) as unknown as RecipeSnapshot;
const etape = (id: string): BrewDayStep => ({ id, label: id, durationMin: 0 }) as BrewDayStep;

describe('volume plus grand que le récipient (AM-42)', () => {
  it('50 L dans la cuve de 45 L : alerte', () => {
    const f = readingFeedback('volume', 50, etape('preboil'), recette());
    expect(f.tone).toBe('watch');
    expect(f.title).toMatch(/plus que la cuve \(45 L\)/);
  });
  it('35 L en fermenteur de 30 L : alerte ; 28 L : pas d’alerte de capacité', () => {
    expect(readingFeedback('volume', 35, etape('ensemencement'), recette()).title).toMatch(/plus que le fermenteur \(30 L\)/);
    expect(readingFeedback('volume', 28, etape('ensemencement'), recette()).title).not.toMatch(/plus que/);
  });
  it('capacité inconnue : aucune alerte inventée', () => {
    expect(readingFeedback('volume', 500, etape('preboil'), { } as RecipeSnapshot).title).not.toMatch(/plus que/);
  });
});

describe('température d’ensemencement (AM-43)', () => {
  it('25 °C : rien à dire ; 60 °C : trop chaud pour la levure', () => {
    expect(readingFeedback('temperature', 20, etape('ensemencement'), recette()).title).not.toMatch(/trop chaud/);
    expect(readingFeedback('temperature', 60, etape('ensemencement'), recette()).title).toMatch(/trop chaud pour la levure/);
  });
});
