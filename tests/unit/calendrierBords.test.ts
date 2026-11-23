/**
 * CAL-BORDS-ET-LIGNES (23.11, « il y a des bords tout autour du calendrier » ; « une donné que je cache brise les lignes ») : aucune règle de calcul
 * ici, de la mise en page ; la preuve de rendu est faite en ligne, à 390. Ce contrôle garde les trois règles de la feuille de style : le groupe des
 * rangées vides n'a pas de fond (les traits de l'axe le traversent), le calendrier reprend la gouttière de la page (la même que <main>, 8 px puis
 * 12 px dès 375 px), et l'espace de fin cède la place à la barre du bas.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/calendrier/frise/frise.css', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const regle = (selecteur: string): string => {
  const i = css.indexOf(`${selecteur} {`);
  expect(i, `règle ${selecteur}`).toBeGreaterThanOrEqual(0);
  return css.slice(i, css.indexOf('}', i) + 1);
};

describe('CAL-BORDS-ET-LIGNES', () => {
  it('le groupe des rangées vides n’a pas de fond : les traits des graduations traversent « Activités · vide »', () => {
    expect(regle('.cal-vides')).not.toMatch(/background/);
  });

  it('hors paysage, le calendrier reprend la gouttière de <main> (px-2, xs:px-3) des deux côtés et sa réserve du bas', () => {
    expect(app).toMatch(/w-full mx-auto px-2 xs:px-3/);
    const bloc = css.slice(css.indexOf('CAL-BORDS-ET-LIGNES (23.11, « il y a des bords'));
    expect(bloc).toMatch(/@media \(max-width: 1023\.98px\) \{\s*\.cal-tab:not\(\.cal-tab-paysage\) \{ --cal-gouttiere: 0\.5rem; margin-inline: calc\(-1 \* var\(--cal-gouttiere\)\); margin-bottom: -0\.75rem; \}/);
    expect(bloc).toMatch(/\(min-width: 375px\) \{\s*\.cal-tab:not\(\.cal-tab-paysage\) \{ --cal-gouttiere: 0\.75rem; \}/);
    expect(bloc).toMatch(/\.cal-tab-fin \{ display: none; \}/);
  });

  it('les en-têtes (rangée, chiffre du creux et boutons) gardent un retrait égal à la gouttière : jamais collés au bord', () => {
    const bloc = css.slice(css.indexOf('CAL-BORDS-ET-LIGNES (23.11, « il y a des bords'));
    expect(bloc).toMatch(/\.cal-rh \{ padding-inline: var\(--cal-gouttiere\); \}/);
    expect(bloc).toMatch(/\.ent-t \{ padding-inline: calc\(var\(--cal-gouttiere\) \+ 4px\); \}/);
  });
});
