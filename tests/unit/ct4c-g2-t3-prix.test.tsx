// @vitest-environment node
/* Voie g2, tour 3 (CRITIQUE-CT4C-T2, n° 6) : Clients › Prix, coût connu, à 1280.
   « 7,51 CHF/L › » se pose à côté de « coût ≥ 2,18 » (même ligne, sans le recouvrir), comme à 390, et se lit (≥ 12 px).
   Au tour 2, le décalage ne portait que sous 1000 px ; à 1280 le bouton restait à 37 % et recouvrait le « 2,18 » du graphe. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/prix/prix.css', 'utf8');

/** Pose finale de `.prx-cout` à une largeur d'écran : les règles hors media, puis celles des media qui s'appliquent, dans l'ordre du fichier. */
function coutA(largeur: number): { left: number; font: number; lineHeight: number } {
  const plat = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocs: { cond: string; corps: string }[] = [];
  let i = 0;
  while (i < plat.length) {
    const m = /@media\s*\(([^)]*)\)\s*\{/g; m.lastIndex = i;
    const t = m.exec(plat);
    const prochain = plat.indexOf('{', i);
    if (!t || t.index > prochain) { const fin = plat.indexOf('}', prochain); if (prochain < 0) break; blocs.push({ cond: '', corps: plat.slice(i, fin + 1) }); i = fin + 1; continue; }
    let prof = 1, j = t.index + t[0].length;
    while (j < plat.length && prof > 0) { if (plat[j] === '{') prof++; else if (plat[j] === '}') prof--; j++; }
    blocs.push({ cond: t[1], corps: plat.slice(t.index + t[0].length, j - 1) });
    i = j;
  }
  const actif = (c: string) => {
    if (!c) return true;
    const mn = c.match(/min-width:\s*(\d+)px/); const mx = c.match(/max-width:\s*(\d+)px/);
    return (!mn || largeur >= Number(mn[1])) && (!mx || largeur <= Number(mx[1]));
  };
  let left = NaN, font = NaN, lineHeight = NaN;
  for (const b of blocs.filter(b => actif(b.cond))) {
    for (const r of b.corps.matchAll(/(^|[}\s])([^{}]*)\{([^}]*)\}/g)) {
      if (!r[2].split(',').some(s => s.trim() === '.prx-cout')) continue;
      const l = r[3].match(/(?:^|;|\s)left:\s*([\d.]+)%/); if (l) left = Number(l[1]);
      const f = r[3].match(/font-size:\s*([\d.]+)px/); if (f) font = Number(f[1]);
      const h = r[3].match(/line-height:\s*([\d.]+)px/); if (h) lineHeight = Number(h[1]);
    }
  }
  return { left, font, lineHeight };
}

describe('CT4C tour 3 (n° 6) : à 1280 le bouton suit la taille du « coût » du graphe agrandi', () => {
  it('à 1280 et 1600 px : police ≥ 14 px (le texte du SVG y fait ≈ 15 px) ; à 390 : 13 px', () => {
    expect(coutA(1280).font).toBeGreaterThanOrEqual(14);
    expect(coutA(1600).font).toBeGreaterThanOrEqual(14);
    expect(coutA(390).font).toBe(13);
  });
});

describe('CT4C tour 3 (n° 6) : même ligne que « coût ≥ 2,18 »', () => {
  it('le bouton se cale sur le centre du texte « coût » du SVG (5,9 % du bas, 20 px de haut), pas sur le bord bas : il ne glisse plus d’une ligne quand le graphe grandit', () => {
    const r = css.match(/\.prx-cout\s*\{[^}]*\bbottom:\s*([^;]*);/);
    expect(r).not.toBeNull();
    expect(r![1]).toMatch(/calc\(\s*5\.9%\s*-\s*10px\s*\)/);
  });
});

describe('CT4C tour 3 (n° 6) : « 7,51 CHF/L › » à côté de « coût ≥ 2,18 », à 390 comme à 1280', () => {
  for (const largeur of [390, 844, 999, 1000, 1280, 1600]) {
    it(`${largeur} px : le bouton commence à 44 % de la colonne ou plus (le « coût ≥ 2,18 » du graphe finit vers 42 %)`, () => {
      expect(coutA(largeur).left).toBeGreaterThanOrEqual(44);
    });
    it(`${largeur} px : le bouton se lit (police ≥ 12 px)`, () => {
      expect(coutA(largeur).font).toBeGreaterThanOrEqual(12);
    });
  }
});
