import { describe, expect, it } from 'vitest';
import { measuredReadingFeedback } from '../../src/domain/brewDay';
import type { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

/**
 * Paquet vérité du jour de brassage (mission brassage-zero, voie v1). Règles de calcul seulement ;
 * le reste du paquet se prouve à l'écran.
 */
const etat = (): BrewDayState => ({ currentIndex: 0, steps: [], readings: [] });
const releve = (kind: BrewDayReading['kind'], value: number, stepId: string): BrewDayReading => ({
  at: 1, stepId, kind, value, unit: kind === 'temperature' ? '°C' : kind === 'volume' ? 'L' : kind === 'densite' ? 'SG' : '', roomTemp: true
});
const recette = (extra: Partial<RecipeSnapshot> = {}): RecipeSnapshot => ({ name: 'NEIPA', volumeL: 19, ogTarget: 1.061, ...extra }) as RecipeSnapshot;

describe('1. une seule source de cible et d’écart', () => {
  it('Mashout 77,5 °C pour une consigne de 76 : « +0,5 au-dessus de la cible 75–77 °C », pas « +1,5 · cible 76 »', () => {
    const step: BrewDayStep = { id: 'mashout', label: 'Mashout', durationMin: 10, tempC: 76 };
    const f = measuredReadingFeedback(releve('temperature', 77.5, 'mashout'), etat(), step, recette());
    expect(f.title).toBe('+0,5 au-dessus de la cible 75–77 °C');
    expect(f.tone).toBe('watch');
    expect(f.title).not.toMatch(/1,5|Écart/);
  });
  it('Refroidissement 19,5 °C pour 18 : la même phrase que la feuille (bande 17–19)', () => {
    const step: BrewDayStep = { id: 'refroidissement', label: 'Refroidissement', durationMin: 0, tempC: 18 };
    const f = measuredReadingFeedback(releve('temperature', 19.5, 'refroidissement'), etat(), step, recette());
    expect(f.title).toBe('+0,5 au-dessus de la cible 17–19 °C');
  });
  it('Ensemencement 1,064 pour une OG de 1,061 : un seul écart, « +0,001 au-dessus de la cible 1,059–1,063 SG » (plus « +3 points »)', () => {
    const step: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    const f = measuredReadingFeedback(releve('densite', 1.064, 'ensemencement'), etat(), step, recette());
    expect(f.title).toBe('+0,001 au-dessus de la cible 1,059–1,063 SG');
    expect(f.title).not.toMatch(/points/);
  });
  it('la borne exacte est dans la cible, et le volume au fermenteur a une seule plage, celle de la feuille', () => {
    const step: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    expect(measuredReadingFeedback(releve('densite', 1.063, 'ensemencement'), etat(), step, recette()).tone).toBe('ok');
    const v = measuredReadingFeedback(releve('volume', 17, 'ensemencement'), etat(), step, recette());
    expect(v.title).toBe('−1,1 sous la cible 18,1–20 L');
  });
});
