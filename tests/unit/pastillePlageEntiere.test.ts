/**
 * Voie v2, problème 2 du test d'écran 8b9e1732 : à 1280, la pastille « 18 oct. → 16 nov. » était rognée à 108 px contre la flèche. Une plage de dates
 * lève le plafond de largeur du bouton central (le rendu mesuré est dans les captures de la voie ; jsdom ne mesure pas la mise en page).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/components/periode/periode.css', 'utf8');

describe('2 : la pastille d’une plage se lit entière', () => {
  it('le bouton central qui porte la plage longue n’a plus de max-width ni de points de suspension', () => {
    const regle = /\.pr-pill>button\.pr-ce:has\(\.pr-long\)\{([^}]*)\}/.exec(css);
    expect(regle).not.toBeNull();
    expect(regle![1]).toMatch(/max-width:none/);
    expect(regle![1]).toMatch(/text-overflow:clip/);
  });
});
