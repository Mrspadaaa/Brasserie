// DC-1 (relance du 20.11) : une pièce haute dont le bas, pâli (flou, ombre), est sous le contraste d'encre ne perd plus ses lignes au recadrage.
// Mesure du banc (graine 1, 200 pièces, 20.11) : h0065 perdait 37 lignes du bas, h0101 45 lignes du haut. Cause : la boîte du papier (région claire)
// s'arrête avant la fin du texte et la croissance par densité d'encre ne voit pas un texte de contraste < PLANCHER_ENCRE (25 niveaux).
// Méthode : projection des rangées (profil horizontal) sur des colonnes de texte et sur des colonnes vides du MÊME papier ; du texte fait osciller
// le premier, jamais le second, alors qu'un grain, un tissu ou un dégradé touchent les deux pareil.
import { describe, expect, it } from 'vitest';
import { boiteGrandie, type Papier } from '../../src/services/decoupe';

const W = 600, H = 1800, PAS = 18;
const bruit = (graine: number) => { let s = graine >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 24) / 255; }; };

/** Un papier trouvé qui s'arrête à la rangée `bas` (région claire trop courte) : boîte, intervalles par bloc de 4 px. */
function papierJusqua(bas: number): Papier {
  const f = 4, bw = Math.ceil(W / f), bh = Math.ceil(H / f), intervalles = new Int32Array(2 * bh);
  for (let by = 0; by < bh; by++) { const dedans = by * f < bas; intervalles[2 * by] = dedans ? 5 : bw; intervalles[2 * by + 1] = dedans ? bw - 6 : -1; }
  return { boite: { x: 20, y: 0, w: 560, h: bas }, intervalles, f, bw, bh, rapport: 3, angle: null };
}

/** Du papier à 200 niveaux, du grain de ±2, et (si `lignes`) du texte pâle de contraste 12 (sous le plancher 25) sur les rangées [de, jusqua) : lignes de 3 px tous
 *  les 18 px, mots de 6 px séparés de 4 px, sur les colonnes de gauche (8 à 36 % du papier) et celles de droite (montants, 80 à 95 %). */
function gris(lignes: { de: number; jusqua: number } | null, rayures = false): Uint8Array {
  const g = new Uint8Array(W * H), alea = bruit(7);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 200 + Math.round(4 * alea() - 2);
      if (rayures && y % PAS < 3) v -= 12;
      if (lignes && y >= lignes.de && y < lignes.jusqua && y % PAS >= 6 && y % PAS < 9) {
        const col = (x - 20) / 560, gauche = col >= 0.08 && col < 0.36, droite = col >= 0.8 && col < 0.95;
        if ((gauche || droite) && (x - 20) % 10 < 6) v -= 12;
      }
      g[y * W + x] = v;
    }
  }
  return g;
}

const SANS_ENCRE = new Uint8Array(W * H);

describe('DC-1 : la boîte du papier grandit sur un texte pâli, sans inventer de texte', () => {
  it('un texte pâle sous la boîte (contraste 12 < plancher 25) est rejoint, jusqu\'à sa dernière ligne', () => {
    const g = gris({ de: 0, jusqua: 1700 });
    const b = boiteGrandie(papierJusqua(1000), SANS_ENCRE, W, H, PAS, SANS_ENCRE, g);
    expect(b.y + b.h).toBeGreaterThanOrEqual(1700);
    expect(b.y + b.h).toBeLessThanOrEqual(H);
  });

  it('une tache de café sur les colonnes vides (2 pas de haut) n\'arrête pas la croissance (h0101 : la tache à y ≈ 860 arrêtait la boîte)', () => {
    const g = gris({ de: 0, jusqua: 1700 });
    for (let y = 1250; y < 1290; y++) for (let x = 280; x < 420; x++) g[y * W + x] -= 25 * (((x >> 2) + y) % 2);
    const b = boiteGrandie(papierJusqua(1000), SANS_ENCRE, W, H, PAS, SANS_ENCRE, g);
    expect(b.y + b.h).toBeGreaterThanOrEqual(1700);
  });

  it('sans la carte de gris, le comportement reste celui d\'avant (boîte inchangée)', () => {
    const b = boiteGrandie(papierJusqua(1000), SANS_ENCRE, W, H, PAS, SANS_ENCRE);
    expect(b.y + b.h).toBe(1000);
  });

  it('un papier sans texte (grain seul) ne grandit pas', () => {
    const b = boiteGrandie(papierJusqua(1000), SANS_ENCRE, W, H, PAS, SANS_ENCRE, gris(null));
    expect(b.y + b.h).toBe(1000);
  });

  it('des rayures sur toute la largeur (tissu, bois : colonnes de texte et colonnes vides touchées pareil) ne sont pas du texte', () => {
    const b = boiteGrandie(papierJusqua(1000), SANS_ENCRE, W, H, PAS, SANS_ENCRE, gris(null, true));
    expect(b.y + b.h).toBe(1000);
  });

  it('un texte pâle ne s\'arrête pas non plus au bord haut de la boîte : la boîte remonte', () => {
    const papier = papierJusqua(H);
    papier.boite = { x: 20, y: 700, w: 560, h: H - 700 };
    const b = boiteGrandie(papier, SANS_ENCRE, W, H, PAS, SANS_ENCRE, gris({ de: 100, jusqua: H }));
    expect(b.y).toBeLessThanOrEqual(120);
  });
});
