// CT4C-4 (critique de vision, tour 4) : à 844×340, l'en-tête du Stock prenait ~190 px sur 340 et aucun article de l'étagère ne se voyait.
// jsdom n'évalue pas les @media : le test lit la feuille du paysage bas, chargée par la barre d'outils, et vérifie ses règles ;
// la preuve à l'écran est la capture 844×340 (voie g1).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const lire = (f: string) => readFileSync(join(process.cwd(), f), 'utf8');

describe('CT4C-4 : Stock en paysage bas, une seule ligne d\'outils', () => {
  it('la barre d\'outils charge la feuille du paysage bas', () => {
    expect(lire('src/ui/stock/OutilsStock.tsx')).toMatch(/import '\.\/paysageBas\.css';/);
  });
  it('en paysage bas : bascule, recherche et pastilles sur une ligne, pastilles sans retour à la ligne', () => {
    const css = lire('src/ui/stock/paysageBas.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const bloc = css.match(/@media \(orientation:landscape\) and \(max-height:480px\)\{([\s\S]*)\}\s*$/)?.[1] ?? '';
    expect(bloc).toMatch(/\.stock-outils\{display:flex/);
    expect(bloc).toMatch(/\.stock-outils>\.sz-pan-h\{[^}]*display:flex/);
    expect(bloc).toMatch(/\.sz-puces\{[^}]*flex-wrap:nowrap/);
    expect(bloc).toMatch(/\.sz-puces\{[^}]*margin-top:0/);
  });
});
