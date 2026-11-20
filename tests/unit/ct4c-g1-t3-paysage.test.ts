// CT4C (g1, tour 3) n° 4 : à 844×340, la rangée Levures entière au premier écran (lettres non coupées), sans texte sous 12 px.
// jsdom n'évalue pas les @media : les règles de paysageBas.css se lisent dans le texte de la feuille ; la preuve à l'écran est la capture 844×340
// (banc g1 : bas de la rangée Levures ≤ haut de la barre du bas, 0 texte < 12 px).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = () => readFileSync(join(process.cwd(), 'src/ui/stock/paysageBas.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const bloc = () => css().match(/@media \(orientation:landscape\) and \(max-height:480px\)\{([\s\S]*)\}\s*$/)?.[1] ?? '';

describe('CT4C n° 4 : la rangée Levures tient au premier écran en paysage bas', () => {
  it('les sous-onglets du Stock et « Comparer une recette » partagent une ligne (33 px de moins), le détail ouvert reprend toute la largeur', () => {
    const b = bloc();
    expect(b).toMatch(/\.stocks-screen\{[^}]*flex-direction:row[^}]*flex-wrap:wrap/);
    // sans align-content:flex-start, les lignes se répartissent dans la hauteur de l'écran (Courses : 25 px de vide sous l'en-tête)
    expect(b).toMatch(/\.stocks-screen\{[^}]*align-content:flex-start/);
    expect(b).toMatch(/\.stocks-screen>details\.shrink-0\{[^}]*flex:0 0 auto/);
    expect(b).toMatch(/\.stocks-screen>details\[open\]\{[^}]*flex:1 0 100%/);
    expect(b).toMatch(/\.stocks-screen>:not\(:first-child\):not\(details\)\{[^}]*flex:1 0 100%/);
  });
  it('« Comparer une recette » tient sur une ligne', () => {
    expect(bloc()).toMatch(/\.stocks-screen>details\.shrink-0>summary\{[^}]*flex-wrap:nowrap/);
  });
  it('les planches Malts et Houblons sont plus basses (20 px, repère 8 px), la rangée Levures finit à 56 px et sa « Légende » descend', () => {
    const b = bloc();
    expect(b).toMatch(/\.l1e-r\[data-f=f0\],\.stock-mur \.l1e-r\[data-f=f1\]\{[^}]*--hm:20px!important[^}]*--hc:8px!important/);
    expect(b).toMatch(/\.l1e-r\[data-f=f2\]\{[^}]*min-height:56px/);
    expect(b).toMatch(/\.l1e-c1 \.sx-q\{[^}]*top:26px!important/);
  });
  it('aucun texte du bloc ne passe sous 12 px', () => {
    for (const m of bloc().matchAll(/font-size:\s*([\d.]+)px/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(12);
  });
});
