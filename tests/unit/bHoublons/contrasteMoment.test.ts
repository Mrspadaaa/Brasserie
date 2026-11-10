/* BR-39 (08.11) : au thème clair, le moment choisi (« Ébullition », « Premier moût », « Whirlpool », « À cru ») était blanc sur gris, 1,83:1.
   Cause (VI-11, commit 48a02ce7) : l'aplat paille du segment actif forçait du blanc sur ses descendants, alors que la règle de
   `.hop-stage-tabs` ne changeait que le fond. Ce test lit les feuilles et les jetons réels, comme segmentContraste.test.ts, et exige
   4,5:1 pour les trois segments de houblon de hop-recipe.css, dans les deux thèmes. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const lire = (chemin: string) => readFileSync(new URL(`../../../${chemin}`, import.meta.url), 'utf8');
type Rvb = [number, number, number];

function jetons(theme: 'clair' | 'cave'): Map<string, Rvb> {
  const out = new Map<string, Rvb>();
  for (const fichier of ['src/theme/themes.css', 'src/theme/couleurs-portees.css']) {
    const source = lire(fichier).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selecteur, corps] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = selecteur.replace(/\s+/g, ' ').trim();
      const estCave = sel === "[data-theme='cave']";
      const estClair = sel === ":root, [data-theme='clair']";
      if (!estCave && !estClair) continue;
      if (estCave && theme === 'clair') continue;
      for (const [, nom, r, g, b] of corps.matchAll(/(--[\w-]+)\s*:\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
        if (estCave || !out.has(nom) || theme === 'clair') out.set(nom, [Number(r), Number(g), Number(b)]);
      }
    }
  }
  return out;
}
const luminance = ([r, g, b]: number[]) => {
  const [R, G, B] = [r, g, b].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contraste = (a: number[], b: number[]) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function regle(selecteur: string) {
  const css = lire('src/ui/hopIndex/hop-recipe.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, sels, corps] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!sels.split(',').some(s => s.replace(/\s+/g, ' ').trim() === selecteur)) continue;
    const fond = corps.match(/(?:^|[;\s])background(?:-color)?\s*:\s*rgb\(var\((--[\w-]+)\)\)/);
    const texte = corps.match(/(?:^|[;\s])color\s*:\s*rgb\(var\((--[\w-]+)\)\)/);
    if (fond && texte) return { fond: fond[1], texte: texte[1] };
  }
  throw new Error(`Règle introuvable : ${selecteur}`);
}

describe('BR-39 — le moment choisi se lit dans les deux thèmes', () => {
  it('la règle de contrôle lit bien une règle (le test ne passe pas à vide)', () => {
    expect(regle('.hop-stage-tabs [role=radio][aria-checked=true]')).toEqual({ fond: '--cave-700', texte: '--cave-texte-50' });
  });
  it('le bouton actif du composant ne porte plus l’aplat paille, qui blanchit ses descendants au clair', () => {
    expect(lire('src/ui/SegmentedControl.tsx')).not.toMatch(/active\s*\n?\s*\?\s*'[^']*\bbg-ebc-straw\b/);
  });
  describe.each([
    '.hop-stage-tabs [role=radio][aria-checked=true]',
    '.hop-flavor [role=radio][aria-checked=true]',
    '.hop-tool-tabs button[aria-selected=true]',
  ])('%s', selecteur => {
    it.each(['clair', 'cave'] as const)('libellé ≥ 4,5:1 sur le segment, thème %s', theme => {
      const { fond, texte } = regle(selecteur);
      const j = jetons(theme), aplat = j.get(fond), encre = j.get(texte);
      if (!aplat || !encre) throw new Error(`Jeton manquant : ${fond} / ${texte}`);
      expect(contraste(aplat, encre)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
