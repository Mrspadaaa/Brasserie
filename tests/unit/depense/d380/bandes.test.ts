// D380 : une bande est bornée en lignes (« Mais l'ia peut lire en une fois 75 lignes ??? » — « Faut pas abuser non plus... »).
// Bitmap fabriqué : 300 lignes de texte de 14 rangées, séparées de 10 rangées blanches, sur 1 200 px de large (une page haute de 300 lignes).
import { describe, expect, it } from 'vitest';
import { BAND_MAX_LINES, inkedCuts, linePitch, mergeDecoded, planBands, overlapDrops } from '../../../../functions/src/invoiceMorceaux';

const LIGNES = 300, TEXTE = 14, BLANC = 10, LARGEUR = 1200;
const rangees = (() => {
  const rows: number[] = new Array(40).fill(0);
  for (let i = 0; i < LIGNES; i++) rows.push(...new Array(TEXTE).fill(0.2), ...new Array(BLANC).fill(0));
  return rows;
})();
/** Les lignes de texte vues dans une bande : les séries encrées qui y COMMENCENT (une ligne coupée par le recouvrement ne compte qu'une fois). */
const lignesDe = (top: number, bottom: number) => { let n = 0; for (let y = top; y < bottom; y++) if (rangees[y] > 0 && (y === 0 || rangees[y - 1] === 0)) n++; return n; };

describe('D380 : bandes bornées en lignes', () => {
  it('le pas des lignes se mesure sur l’encre', () => {
    expect(linePitch(rangees)).toBe(TEXTE + BLANC);
  });
  it(`chaque bande porte au plus ${BAND_MAX_LINES} lignes, aucune coupe ne traverse une ligne, tout est couvert`, () => {
    const bandes = planBands(rangees, LARGEUR, { maxLines: BAND_MAX_LINES });
    expect(bandes.length).toBeGreaterThanOrEqual(Math.ceil(LIGNES / BAND_MAX_LINES));
    for (const b of bandes) expect(lignesDe(b.top, b.bottom)).toBeLessThanOrEqual(BAND_MAX_LINES);
    expect(inkedCuts(bandes, rangees)).toEqual([]);
    expect(bandes[0].top).toBe(0);
    expect(bandes.at(-1)!.bottom).toBe(rangees.length);
    bandes.slice(1).forEach((b, i) => expect(b.top).toBeLessThan(bandes[i].bottom));
  });
  it('témoin : sans borne en lignes, une bande de 1,4 × la largeur porte bien plus de 45 lignes', () => {
    const bandes = planBands(rangees, LARGEUR);
    expect(Math.max(...bandes.map(b => lignesDe(b.top, b.bottom)))).toBeGreaterThan(45);
  });
  it('le recollage garde une fois la ligne du recouvrement et rend toutes les lignes dans l’ordre', () => {
    const l = (n: number) => ({ name: `Article ${n}`, amountTTC: n + 0.5 });
    const parts = [{ vendor: 'Fictif', amountTTC: null, items: [1, 2, 3].map(l) }, { vendor: '', items: [3, 4, 5].map(l) }, { vendor: '', amountTTC: 42, items: [5, 6].map(l) }];
    const fusion = mergeDecoded(parts, { dedupe: true });
    expect(fusion.items.map((i: any) => i.name)).toEqual([1, 2, 3, 4, 5, 6].map(n => `Article ${n}`));
    expect(fusion.vendor).toBe('Fictif');
    expect(fusion.amountTTC).toBe(42);
    expect([...overlapDrops([1, 2, 3].map(l), [3, 4].map(l))]).toEqual([0]);
  });
});
