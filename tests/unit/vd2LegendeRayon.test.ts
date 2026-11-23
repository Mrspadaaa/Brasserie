// Voie vd2, verdict 5cdcd12e n° 2 : l'en-tête de rayon dit l'ordre CHOISI (« par quantité… »), pas l'ancien (« par couleur… »).
import { describe, expect, it } from 'vitest';
import { LEGENDE_RAYON, legendeRayon } from '../../src/domain/stock/ligne';
import { TRIS } from '../../src/domain/stock/liste';

describe('la phrase de l\'en-tête de rayon suit le tri choisi', () => {
  it('par défaut : l\'ordre du métier de chaque rayon (couleur, amertume, date)', () => {
    expect(legendeRayon('Malts', 'defaut')).toBe(LEGENDE_RAYON.Malts);
    expect(legendeRayon('Houblons', 'defaut')).toBe(LEGENDE_RAYON.Houblons);
    expect(legendeRayon('Levures', 'defaut')).toBe(LEGENDE_RAYON.Levures);
    expect(legendeRayon('Malts', undefined)).toBe(LEGENDE_RAYON.Malts);
  });
  it('quantité, nom, manque : la même phrase pour les trois rayons, qui nomme le tri et son sens', () => {
    for (const r of ['Malts', 'Houblons', 'Levures'] as const) {
      expect(legendeRayon(r, 'quantite')).toBe('par quantité, la plus grande d’abord');
      expect(legendeRayon(r, 'nom')).toBe('par nom, de A à Z');
      expect(legendeRayon(r, 'manque')).toBe('par manque, les plus à court d’abord');
    }
  });
  it('aucune phrase d\'en-tête ne garde « couleur », « amertume » ou « date » hors du tri par défaut', () => {
    for (const t of TRIS.filter((x) => x.id !== 'defaut')) {
      for (const r of ['Malts', 'Houblons', 'Levures'] as const) expect(legendeRayon(r, t.id)).not.toMatch(/couleur|amertume|date/);
    }
  });
});
