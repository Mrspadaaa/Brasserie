import { describe, expect, it } from 'vitest';
import { dansDit, pointsPiste } from '../../src/domain/brewDayPiste';

const MIN = 60000;
const h = (hh: number, mm = 0) => new Date(2026, 10, 12, hh, mm).getTime();

describe('pointsPiste : les rendez-vous de l’horloge (test d’écran c6, n° 3)', () => {
  it('E1 de p2c : pH à 13 h 15 (16,7 %), eau de rinçage à 13 h 50 (75 %), fin à 100 %', () => {
    const { points, avance } = pointsPiste({
      debut: h(13, 5), fin: h(14, 5), now: h(13, 5) + 36_000, depart: 'du', finTexte: 'fin',
      rendezVous: [
        { id: 'ph', heure: h(13, 15), etat: 'vide', texte: 'pH · 13 h 15 · dans 10 min' },
        { id: 'eau', heure: h(13, 50), etat: 'vide', texte: 'eau de rinçage · 13 h 50' }
      ]
    });
    expect(points.map((p) => [p.id, Number(p.pos.toFixed(1))])).toEqual([['depart', 0], ['ph', 16.7], ['eau', 75], ['fin', 100]]);
    expect(avance).toBeCloseTo(1, 5);
  });
  it('un rendez-vous sans heure ou hors de l’étape n’est pas posé (jamais une heure inventée)', () => {
    const { points } = pointsPiste({
      debut: h(13), fin: h(14), now: h(13, 30),
      rendezVous: [{ id: 'a', heure: null, etat: 'vide' }, { id: 'b', heure: h(15), etat: 'vide' }, { id: 'c', heure: h(12), etat: 'vide' }, { id: 'd', heure: h(13, 30), etat: 'ok' }]
    });
    expect(points.map((p) => p.id)).toEqual(['d']);
  });
  it('sans début ou sans fin connus, aucune piste', () => {
    expect(pointsPiste({ debut: null, fin: h(14), now: h(13), rendezVous: [] }).points).toEqual([]);
    expect(pointsPiste({ debut: h(13), fin: null, now: h(13), rendezVous: [] }).points).toEqual([]);
  });
  it('l’avancée est bornée à 0–100 %', () => {
    expect(pointsPiste({ debut: h(13), fin: h(14), now: h(15), rendezVous: [] }).avance).toBe(100);
    expect(pointsPiste({ debut: h(13), fin: h(14), now: h(12), rendezVous: [] }).avance).toBe(0);
  });
  it('dansDit : dans 10 min, dans 1 h 05, maintenant une fois passée', () => {
    expect(dansDit(h(13, 15), h(13, 5))).toBe('dans 10 min');
    expect(dansDit(h(14, 10), h(13, 5))).toBe('dans 1 h 05');
    expect(dansDit(h(13, 0), h(13, 5))).toBe('maintenant');
    expect(dansDit(h(13, 5) + 20_000, h(13, 5))).toBe('maintenant');
    void MIN;
  });
});
