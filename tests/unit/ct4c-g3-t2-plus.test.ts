/**
 * Critique tour 4 (c), voie g3, tour 2, n° 5 : le + flottant couvrait du contenu hors Finances.
 *   - Stocks › Articles à 390 : « 0 kg », l'étoile, la bascule du rayon et l'échelle de chaque ligne ;
 *   - Clients › Prix (390 et 844×340) : « Anciens tarifs sans format… », la liste « Il manque ces données » ;
 *   - Opérations à 390 : les montants et « + pièce » ;
 *   - Synthèse à 844×340 : la colonne « Matériel à part ».
 * Même remède que CT4C-7 : la colonne de droite reste libre, de la largeur du + (56 px à 12 px du bord, 8 px d'air = 4,75 rem),
 * seulement quand le + flotte (`body[data-has-fab-floating]`). jsdom ne mesure pas la mise en page : les règles se lisent dans la feuille du +
 * (`navigation.css`), la mesure réelle (rectangles au banc, à chaque arrêt de défilement) est dans RESULTAT.md (`voies/g3/bench-t2.mjs`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve(__dirname, '../../src/components/navigation/navigation.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Corps du bloc `@media <entête>` qui contient le sélecteur, et corps de la règle de ce sélecteur dans ce bloc. */
function regle(entete: RegExp, selecteur: string): { media: string; corps: string } | null {
  const re = /@media\s+([^{]+)\{/g;
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (!entete.test(m[1])) continue;
    let prof = 1, j = re.lastIndex;
    for (; j < css.length && prof > 0; j++) { if (css[j] === '{') prof++; else if (css[j] === '}') prof--; }
    const bloc = css.slice(re.lastIndex, j - 1);
    const i = bloc.indexOf(selecteur);
    if (i < 0) continue;
    const ouvre = bloc.indexOf('{', i), ferme = bloc.indexOf('}', ouvre);
    // le sélecteur doit être dans l'en-tête de cette règle (pas dans un corps précédent)
    if (bloc.slice(i, ouvre).includes('}')) continue;
    return { media: m[1].trim(), corps: bloc.slice(ouvre + 1, ferme) };
  }
  return null;
}
const rem = (corps: string, prop: string) => {
  const m = new RegExp(`${prop}:\\s*([\\d.]+)rem`).exec(corps);
  return m ? parseFloat(m[1]) : 0;
};
const GOUTTIERE = 4.75; // 56 px (le +) + 12 px (bord) + 8 px d'air

describe('CT4C n° 5 : le + ne couvre plus de contenu hors Finances', () => {
  it("Stocks › Articles : chaque bloc de rayon et chaque ligne gardent 4,75 rem libres à droite, l'étoile (bord du bloc) suit (390)", () => {
    for (const sel of [':root body[data-has-fab-floating] .stock-liste.l1-eh-bloc', ':root body[data-has-fab-floating] .stock-liste.l1-li']) {
      const r = regle(/max-width:\s*639px/, sel);
      expect(r, sel).not.toBeNull();
      expect(rem(r!.corps, 'padding-right'), sel).toBeGreaterThanOrEqual(GOUTTIERE);
    }
    // l'étoile est posée au bord du bloc (`position:absolute; right:0`) : sans ce décalage son bouton de 44 px resterait sous le +
    const fav = regle(/max-width:\s*639px/, ':root body[data-has-fab-floating] .stock-liste .l1-fav');
    expect(fav).not.toBeNull();
    expect(rem(fav!.corps, 'right')).toBeGreaterThanOrEqual(GOUTTIERE);
  });

  it('Stocks › Articles au rail (1280) : le + est à 24 px des bords, la gouttière passe à 5,5 rem (56 + 24 + 8)', () => {
    for (const sel of [':root body[data-has-fab-floating] .stock-liste.l1-eh-bloc', ':root body[data-has-fab-floating] .stock-liste.l1-li', ':root body[data-has-fab-floating] .stock-liste .l1-fav']) {
      const r = regle(/min-width:\s*1024px/, sel);
      expect(r, sel).not.toBeNull();
      expect(Math.max(rem(r!.corps, 'padding-right'), rem(r!.corps, 'right')), sel).toBeGreaterThanOrEqual(5.5);
    }
  });

  it('Clients › Prix : « Il manque ces données » et « Anciens tarifs sans format » restent à gauche du + (390 et 844×340)', () => {
    const r = regle(/max-width:\s*999px/, ':root body[data-has-fab-floating] .prx-manque');
    expect(r).not.toBeNull();
    expect(rem(r!.corps, 'padding-right')).toBeGreaterThanOrEqual(GOUTTIERE);
  });

  it('Opérations à 390 : la liste des opérations garde la gouttière du +, comme déjà en paysage bas', () => {
    const r = regle(/max-width:\s*599px/, ':root body[data-has-fab-floating] .ops > :not(.ops-bande)');
    expect(r).not.toBeNull();
    expect(rem(r!.corps, 'padding-right')).toBeGreaterThanOrEqual(GOUTTIERE);
  });

  it('Synthèse en paysage bas : la scène (colonne « Matériel à part » comprise) garde la gouttière du +', () => {
    const r = regle(/orientation:\s*landscape[^{]*max-height:\s*520px/, ':root body[data-has-fab-floating] .syn-scene');
    expect(r).not.toBeNull();
    expect(rem(r!.corps, 'padding-right')).toBeGreaterThanOrEqual(GOUTTIERE);
  });

  it('rien ne passe par un style en ligne ni par une position : le + reste en bas à droite (acquis)', () => {
    const base = fs.readFileSync(path.resolve(__dirname, '../../src/ui/floating-actions.css'), 'utf8');
    expect(base).toMatch(/\.floating-actions\s*\{[^}]*right:\s*var\(--floating-actions-right, 0\.75rem\)/);
    expect(base).toMatch(/bottom:\s*var\(--floating-actions-bottom, 1rem\)/);
  });
});
