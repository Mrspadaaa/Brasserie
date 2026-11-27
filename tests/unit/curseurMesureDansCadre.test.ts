// NUIT-G4 (27.11, couverture G) : au jour de brassage, le <input type="range"> du curseur de mesure déborde de 11 px de chaque côté de son échelle
// (pour que le centre du pouce natif tombe sur les bouts). Dans la feuille Mesurer, le cadre défilant le rognait : un pouce au maximum (pH 8,92)
// ne se rattrapait plus au doigt. Le curseur garde 11 px de marge intérieure : la zone de toucher tient dans son cadre. (Mesure au banc : outils.)
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync('src/pages/brew-day.css', 'utf8');
describe('Curseur de mesure : la zone de toucher tient dans son cadre', () => {
  it('la piste native déborde de 11 px et le curseur lui réserve 11 px de chaque côté', () => {
    expect(css).toMatch(/\.bz-range \{[^}]*left: -11px;[^}]*width: calc\(100% \+ 22px\)/);
    expect(css).toMatch(/\.brew-page\.bz \.bz-curseur \{[^}]*padding-inline: 11px;/);
  });
});
