import { describe, expect, it } from 'vitest';
import { defaultReading, measuredReadingFeedback } from '../../src/domain/brewDay';
import { grandeursOuvertes, mesureDue } from '../../src/domain/brewMeasures';
import { PREPARATIONS } from '../../src/domain/brewCompanion';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const MIN = 60000;
const T0 = 1_700_000_000_000;
const palier: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
const etat = (readings: BrewDayReading[] = [], step: BrewDayStep = palier): BrewDayState => ({ steps: [step], currentIndex: 0, readings });
const recette = { ogTarget: 1.062, volumeL: 24 } as unknown as RecipeSnapshot;
const lu = (kind: BrewDayReading['kind'], stepId: string, value: number): BrewDayReading => ({ id: `${kind}-${stepId}`, at: T0 + MIN, stepId, kind, value, unit: '' });

describe('v1 n° 8 : la feuille Mesurer s’ouvre sur la mesure due', () => {
  it('palier : Maische °C d’abord, même quand le pH est dû', () => {
    expect(mesureDue(palier, etat(), recette, T0 + 12 * MIN)).toBe('temperature');
    // la grandeur habituelle (pH) était celle que la feuille ouvrait, même quand la température était due : le constat n° 19
    expect(defaultReading(palier)).toBe('ph');
  });
  it('palier pas encore lancé : rien n’est dû, la grandeur habituelle reste', () => {
    const attente: BrewDayStep = { ...palier, startedAt: undefined };
    expect(mesureDue(attente, etat([], attente), recette, T0)).toBe(defaultReading(attente));
  });
  it('palier : la température relevée, le pH dû passe devant ; pas encore dû, la grandeur habituelle (pH)', () => {
    const t = lu('temperature', 'mash-1', 66.4);
    expect(mesureDue(palier, etat([t]), recette, T0 + 12 * MIN)).toBe('ph');
    expect(mesureDue(palier, etat([t]), recette, T0 + 3 * MIN)).toBe('ph');
  });
  it('mashout : la température', () => {
    const mashout: BrewDayStep = { id: 'mash-2', label: 'Mashout', durationMin: 10, tempC: 76, startedAt: T0 };
    expect(mesureDue(mashout, etat([], mashout), recette, T0 + 20 * MIN)).toBe('temperature');
  });
  it('ensemencement : la densité initiale ; l’avant-ébullition : la densité (volume dû aussi)', () => {
    const e: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    expect(mesureDue(e, etat([], e), recette, T0)).toBe('densite');
    const p: BrewDayStep = { id: 'preboil', label: 'Avant ébullition', durationMin: 0 };
    expect(mesureDue(p, etat([], p), recette, T0)).toBe('densite');
    expect(mesureDue(p, etat([lu('densite', 'preboil', 1.05)], p), recette, T0)).toBe('volume');
  });
});

describe('v1 n° 10 : onglets, virgule, pH-mètre', () => {
  it('pas d’onglet Densité avant le moût (eau, concassage, palier, mashout) ; présent dès l’avant-ébullition', () => {
    for (const id of ['eau', 'concassage', 'mash-1', 'mash-2'])
      expect(grandeursOuvertes({ id, label: id, durationMin: 0 }, etat())).toEqual(['ph', 'temperature', 'volume']);
    for (const id of ['preboil', 'refroidissement', 'ensemencement'])
      expect(grandeursOuvertes({ id, label: id, durationMin: 0 }, etat())).toContain('densite');
  });
  it('un relevé de densité déjà noté à l’étape garde l’onglet', () => {
    expect(grandeursOuvertes(palier, etat([lu('densite', 'mash-1', 1.04)]))).toContain('densite');
  });
  it('pH à la virgule décimale', () => {
    const r = { ...lu('ph', 'mash-1', 5.5), roomTemp: false };
    expect(measuredReadingFeedback(r, etat(), palier, recette).title).toBe('pH 5,5 · à confirmer à froid');
  });
  it('« Étalonner le pH-mètre » est un rappel de Préparer', () => {
    expect(PREPARATIONS.find((p) => p.id === 'phmetre')?.area).toBe('preparation');
  });
});
