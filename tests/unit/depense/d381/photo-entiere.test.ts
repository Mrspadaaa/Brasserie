// D381, (c) du 08.11 : une photo ne se coupe que si c'est nécessaire. Haute mais de LIGNES_ENTIERES lignes au plus (ses tickets Bauhaus de 17 articles) :
// lue entière, sans aucune coupe ; plus longue : coupée comme avant. Une relecture forcée (lecture entière coupée) n'est pas concernée.
import { describe, expect, it } from 'vitest';
import { decoupeAvant, lignesDeTexte, LIGNES_ENTIERES, type PlanImage } from '../../../../src/services/decoupe';

/** Profil d'un ticket : `n` lignes au pas de 20 rangées (encre sur 14), marges blanches de 40 ; `pales` : lignes que la carte ne voit pas. */
function profil(n: number, pales: number[] = []): number[] {
  const rows: number[] = new Array(40).fill(0);
  for (let l = 0; l < n; l++) for (let y = 0; y < 20; y++) rows.push(y < 14 && !pales.includes(l) ? 0.04 : 0);
  return rows.concat(new Array(40).fill(0));
}
const plan = (rangees: number[], haute: boolean | null): PlanImage => ({
  haute, g: { cx: 0, cy: 0, angle: 0, echelle: 1, largeur: 600, hauteur: rangees.length },
  finale: { crop: { x: 0, y: 0, w: 600, h: rangees.length }, angle: 0, morceaux: [], rangees, largeur: 600, hauteur: rangees.length, papier: false, colonnes: null },
});

describe('(c) ne couper une photo que si c’est nécessaire', () => {
  it('le seuil vient de la mesure du plafond (≈ 41 lignes pour 8 192 jetons), avec une marge', () => {
    expect(LIGNES_ENTIERES).toBeGreaterThanOrEqual(30);
    expect(LIGNES_ENTIERES).toBeLessThan(41);
  });

  it('lignesDeTexte compte les lignes, même pâles (la hauteur du texte sur le pas)', () => {
    expect(lignesDeTexte(profil(30))).toBe(30);
    expect(lignesDeTexte(profil(30, [10, 11, 12]))).toBe(30);
    expect(lignesDeTexte(new Array(100).fill(0))).toBe(0);
    // Rangées grisées (graine 2, h0122) : la carte des coupes fond 14 lignes en une série ; le pas de l'encre nette (32) les compte.
    const zebre = [...new Array(40).fill(0), ...new Array(14 * 32).fill(0.05), ...new Array(40).fill(0)];
    expect(lignesDeTexte(zebre)).toBe(1);
    expect(lignesDeTexte(zebre, 32)).toBe(14);
  });

  it('un ticket haut de 30 lignes (17 articles, en-tête, totaux) se lit entier : pas de découpe « avant »', () => {
    expect(decoupeAvant(plan(profil(30), true))).toBe(false);
  });

  it('un ticket haut de 120 lignes est coupé ; une pièce qui n’est pas haute ne l’est jamais', () => {
    expect(decoupeAvant(plan(profil(120), true))).toBe(true);
    expect(decoupeAvant(plan(profil(120), false))).toBe(false);
    expect(decoupeAvant(null)).toBe(false);
  });
});
