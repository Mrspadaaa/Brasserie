import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gaucheMenu } from '../../src/ui/calendrier/entete/MenuPeriode';

/**
 * CAL-PASSE d et a2 (20.11, tour 5). d : le menu de période, large de 300 px (CT4A-15, « 3 mois » ne mord plus sur « 6 mois »), sortait de
 * l'écran à 390 (left −30 mesuré en ligne). a2 : la zone de prise de 44 px d'une poignée de la frise de période, centrée sur le bord de la
 * piste, sortait de l'écran (x −2) : « Toujours très compliqué de reculer le graph.... ».
 */
describe('gaucheMenu : le menu de période reste dans l\'écran', () => {
  it('390 px : le bouton à droite à 270 px, menu de 300 px → posé à 8 px du bord, plus à −30', () => {
    const left = gaucheMenu(270 - 300, 300, 390);
    expect(left).toBe(8);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + 300).toBeLessThanOrEqual(390);
  });
  it('bouton contre le bord droit : le menu finit à 8 px du bord', () => {
    expect(gaucheMenu(382 - 300, 300, 390)).toBe(82);
  });
  it('1280 px et paysage : une position déjà dans l\'écran ne bouge pas', () => {
    expect(gaucheMenu(693, 300, 1280)).toBe(693);
    expect(gaucheMenu(55, 300, 844)).toBe(55);
  });
  it('bouton très à droite : borné à largeurEcran − largeur − marge', () => {
    expect(gaucheMenu(500, 300, 390)).toBe(82);
  });
});

describe('frise de période : la zone de prise d\'une poignée tient dans l\'écran', () => {
  const css = readFileSync(new URL('../../src/ui/finance/operations.css', import.meta.url), 'utf8');
  it('.ops-frise a une marge latérale d\'au moins 22 px (moitié de la zone de 44 px)', () => {
    const m = /\.ops-frise\s*\{\s*margin:\s*\d+px\s+(\d+)px\s+0/.exec(css);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(22);
  });
  it('la zone .ops-h fait 44 px, centrée sur le bord (largeur 44, marge −22)', () => {
    expect(/\.ops-h\s*\{[^}]*width:\s*44px;\s*margin-left:\s*-22px/.test(css)).toBe(true);
  });
});
