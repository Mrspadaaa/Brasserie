// Rejeu en ligne ff0f822e (08.11), RL-9 : bornes des champs de mesure écrites au point : « Saisis 0.1 à 2000 L », « 3 à 9 . » → virgule, pas d'espace avant le point final.
import { describe, expect, it } from 'vitest';
import { invitationMesure } from '../../../src/ui/BrewDayMeasurements';
import { READING } from '../../../src/domain/brewDay';

describe('RL-9 — l’invitation de saisie d’une mesure', () => {
  it('aucun point décimal, aucune espace avant le point final, pour toutes les mesures', () => {
    for (const kind of Object.keys(READING) as Array<keyof typeof READING>) {
      const t = invitationMesure(kind);
      expect(t, kind).not.toMatch(/\d\.\d/);
      expect(t, kind).not.toMatch(/ \.$/);
      expect(t, kind).toMatch(/^Saisis .+\.$/);
    }
  });
  it('le volume dit « 0,1 à 2000 L. » et le pH n’a pas d’unité', () => {
    expect(invitationMesure('volume')).toBe(`Saisis ${String(READING.volume.min).replace('.', ',')} à ${READING.volume.max} L.`);
    expect(invitationMesure('ph')).toMatch(/^Saisis \d+(,\d+)? à \d+(,\d+)?\.$/);
  });
});
