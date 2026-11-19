// k1 (critique 19.11), point 17 : la poignée ↔ de durée couvrait l'étiquette de la montée (« ≈18′ ») qui suit le palier choisi.
import { describe, expect, it } from 'vitest';
import { xPoigneeDuree } from '../../src/ui/paliers/modele';

describe('k1 point 17 : xPoigneeDuree', () => {
  const LARGEUR_POIGNEE = 40, DEMI_ETIQUETTE = 14; // le rect de la poignée fait 40 px ; « ≈18′ » ≈ 28 px, centré dans la montée
  it('sans montée après le palier (fin de courbe) : la poignée reste au bout de la colonne', () => {
    expect(xPoigneeDuree(300, 120)).toBe(300);
  });
  it('avec une montée après : le bord droit de la poignée reste à gauche de l’étiquette de la montée', () => {
    const montee = { x: 300, w: 40 };
    const cx = xPoigneeDuree(300, 120, montee);
    const gaucheEtiquette = montee.x + montee.w / 2 - DEMI_ETIQUETTE;
    expect(cx + LARGEUR_POIGNEE / 2).toBeLessThanOrEqual(gaucheEtiquette);
  });
  it('la poignée ne sort pas de sa colonne par la gauche', () => {
    const cx = xPoigneeDuree(150, 140, { x: 150, w: 10 });
    expect(cx).toBeGreaterThanOrEqual(140 + LARGEUR_POIGNEE / 2);
  });
});
