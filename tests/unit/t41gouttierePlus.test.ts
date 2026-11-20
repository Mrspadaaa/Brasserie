/**
 * T4-1 (en ligne, passe 5) : au repos, le + flottant cachait des montants et des noms dans Finances (Opérations, Synthèse, Prévisions, Annuel).
 * La mesure géométrique vit au banc (voies/t4a/sous-le-plus.mjs : le + contre chaque texte, à chaque pas de défilement, 390, 844×340, 1280) ;
 * ce test garde la réserve de 76 px (56 + 12 + 8 d'air) dans le CSS de chaque écran, comme `.syn-caisse` (CT4C-7), pas dans floating-actions.css.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = (f: string) => readFileSync(`src/ui/finance/${f}`, 'utf8');
/** Le bloc de la règle qui contient `sel`, jusqu'à la fin de sa déclaration. */
const regle = (texte: string, sel: string) => {
  const i = texte.indexOf(sel);
  return i < 0 ? '' : texte.slice(texte.lastIndexOf('\n', i) + 1, texte.indexOf('}', i) + 1);
};

describe('T4-1 : gouttière du + au repos, par écran', () => {
  const cas: Array<[string, string, string]> = [
    ['operations.css', '.ops > :not(.ops-bande)', 'max-width: 599px'],
    ['synthese.css', '.syn-wrap :is(.syn-row', 'max-width: 1023px'],
    ['previsions.css', '.prv :is(.prv-pied', 'max-width: 1023px'],
    ['annuel.css', '.ann-wrap :is(.ann-pile', 'max-width: 1023px'],
  ];
  for (const [fichier, sel, borne] of cas) {
    it(`${fichier} : ${sel} garde 4,75 rem à droite quand le + flotte (${borne})`, () => {
      const t = css(fichier);
      const r = regle(t, sel);
      expect(r, `règle absente de ${fichier}`).toContain('padding-right:4.75rem');
      expect(r).toContain('[data-has-fab-floating]');
      expect(t).toContain(`@media (${borne})`);
    });
  }
  it('Stocks › Courses : la gouttière vaut aussi dès 1024 px (stocks.css), la liste couvrant toute la largeur', () => {
    const t = readFileSync('src/ui/stocks.css', 'utf8');
    const r = regle(t, '.stocks-screen > :has(> [data-testid="commande-repliee"])');
    expect(r).toContain('padding-right: 4.75rem');
    expect(r).toContain('[data-has-fab-floating]');
    expect(t).toContain('@media (min-width: 1024px)');
  });
  it('la réserve n’est pas dans floating-actions.css (une règle par écran)', () => {
    const f = readFileSync('src/ui/floating-actions.css', 'utf8');
    expect(f).not.toMatch(/\.syn-wrap|\.ann-wrap|\.prv :is/);
  });
});
