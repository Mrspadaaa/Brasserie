// La poignée ↔ de durée : k1 point 17 (19.11, elle couvrait l'étiquette « ≈18′ » de la montée) puis PALIERS-EDITION-MAL (25.11, posée sur l'axe,
// loin du bord qu'elle déplace). Elle est maintenant sur le bord droit de la colonne, au-dessus de l'axe et des « + ».
import { describe, expect, it } from 'vitest';
import { G, POIGNEE_DUREE, poigneeDuree } from '../../src/ui/paliers/modele';

describe('poigneeDuree', () => {
  it('se pose sur le bord droit de la colonne', () => {
    expect(poigneeDuree(120, 80).cx).toBe(200);
  });
  it('reste au-dessus de l’axe et des « + » des frontières (cercle de rayon 12 centré sur l’axe)', () => {
    const { y } = poigneeDuree(120, 80);
    expect(y + POIGNEE_DUREE.h).toBeLessThanOrEqual(G.y0 + G.h - 12 - 12);
    expect(y).toBeGreaterThan(G.y0);
  });
  it('ne sort pas de la courbe à gauche ni à droite', () => {
    expect(poigneeDuree(G.x0, 0).cx).toBeGreaterThanOrEqual(G.x0 + POIGNEE_DUREE.w / 2);
    expect(poigneeDuree(G.x0 + 280, 60).cx).toBeLessThanOrEqual(G.x0 + G.w);
  });
});
