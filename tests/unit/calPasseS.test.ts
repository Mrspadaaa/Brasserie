/**
 * CAL-PASSE voie S (21.11, rapport RAPPORT2 de la critique de vision) : la logique des cinq problèmes restants du Calendrier.
 */
import { describe, expect, it } from 'vitest';
import { prisesDuBord } from '../../src/ui/calendrier/frise/zoneToucher';

describe('R2-1 : la zone du bord ne mange pas le corps d’une barre courte', () => {
  it('Hefe en 3 mois à 390 (24 à 52 px) : la poignée et le jalon de fin ne prennent jamais plus du tiers, le milieu reste au déplacement', () => {
    for (const largeur of [24, 30, 41, 52]) {
      const p = prisesDuBord(largeur);
      /* depuis le bord droit : la poignée mord de `dedans`, le jalon de fin (icône de 14 px) de 14 + `jalonSup`, sauf muet */
      const jalon = p.jalonMuet ? 0 : 14 + p.jalonSup;
      expect(p.dedans, `poignée sur ${largeur} px`).toBeLessThanOrEqual(largeur / 3 + 1e-9);
      expect(jalon, `jalon de fin sur ${largeur} px`).toBeLessThanOrEqual(largeur / 3 + 1e-9);
      /* le milieu de la barre (la moitié de sa largeur depuis le bord) est hors de toute prise de bord */
      expect(largeur / 2).toBeGreaterThan(Math.max(p.dedans, jalon));
    }
  });
  it('une barre courte rend son icône de fin muette ; une barre large garde les zones d’origine (17 px et 29 px dedans)', () => {
    expect(prisesDuBord(24).jalonMuet).toBe(true);
    expect(prisesDuBord(52).jalonMuet).toBe(false);
    const large = prisesDuBord(400);
    expect(large.dedans).toBe(17);
    expect(large.jalonSup).toBe(15);
    expect(large.jalonMuet).toBe(false);
  });
  it('largeur nulle ou négative : jamais une zone négative', () => {
    const p = prisesDuBord(-5);
    expect(p.dedans).toBe(0);
    expect(p.jalonSup).toBe(0);
  });
});
