// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CourbeEmpatage, geometrieEmpatage } from '../../src/ui/recette/Dessins';
afterEach(cleanup);

const segments = [{ nom: 'Palier protéique', tempC: 44, durationMin: 15 }, { nom: 'Empâtage', tempC: 66, durationMin: 60 }];

// BK2-1 (k2, 20.11) : « 66 °C · 60′ » et « 44 °C · 15′ » barrées par la ligne de grille (70 °C et 50 °C passent dans le texte),
// police à empattements faute de repli générique sur fontFamily.
describe('bugs r2 : courbe d’empâtage', () => {
  it('cause : une graduation passe bien dans la hauteur du texte de chaque étiquette (fixture 44/66)', () => {
    const { graduations, paliers } = geometrieEmpatage(segments);
    for (const p of paliers) {
      const haut = p.y - 6 - 11, bas = p.y - 6;
      expect(graduations.some((g) => g.y > haut && g.y < bas)).toBe(true);
    }
  });

  it('chaque étiquette de palier a un fond plein qui coupe la graduation, tracé avant la courbe', () => {
    const { container } = render(<CourbeEmpatage segments={segments} />);
    const fonds = [...container.querySelectorAll('rect[data-role="fond-etiquette"]')];
    expect(fonds).toHaveLength(2);
    const courbe = container.querySelector('path[stroke-width="3"]')!;
    for (const f of fonds) expect(f.compareDocumentPosition(courbe) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const { graduations, paliers } = geometrieEmpatage(segments);
    fonds.forEach((f, i) => {
      const y = Number(f.getAttribute('y')), h = Number(f.getAttribute('height'));
      const barree = graduations.filter((g) => g.y > paliers[i].y - 6 - 11 && g.y < paliers[i].y - 6);
      for (const g of barree) { expect(g.y).toBeGreaterThan(y); expect(g.y).toBeLessThan(y + h); }
      expect(y + h).toBeLessThan(paliers[i].y - 1); // ne mange pas le palier
    });
  });

  it('les polices ont un repli générique (monospace, sans-serif), jamais les empattements du navigateur', () => {
    const { container } = render(<CourbeEmpatage segments={segments} />);
    const familles = [...container.querySelectorAll('g[font-family]')].map((g) => g.getAttribute('font-family')!);
    expect(familles.length).toBeGreaterThanOrEqual(3);
    for (const f of familles) expect(f).toMatch(/(monospace|sans-serif)\s*$/);
  });
});
