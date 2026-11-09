import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(__dirname, '../..');
const lire = (chemin: string) => readFileSync(resolve(racine, chemin), 'utf8');

const luminance = ([r, g, b]: number[]) => {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contraste = (a: number[], b: number[]) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe('BE-24 : « Visuel : … » de l’atelier, en thème clair', () => {
  it('garde la couleur de texte or sans transparence, assez contrastée sur le gris #dedede mesuré', () => {
    const source = lire('src/components/CreativeLabTab.tsx');
    const ligne = source.split('\n').find(l => l.includes('Visuel') === false && l.includes('italic bg-ebc-straw/10')) ?? '';
    expect(ligne).toMatch(/text-ebc-gold italic/);
    expect(ligne).not.toMatch(/text-ebc-gold\/\d+/);
    const themes = lire('src/theme/themes.css');
    const clair = themes.slice(themes.indexOf(":root,\n[data-theme='clair']"), themes.indexOf("[data-theme='cave']"));
    const m = /--ebc-gold-texte:\s*(\d+)\s+(\d+)\s+(\d+)/.exec(clair);
    expect(m).not.toBeNull();
    const or = [Number(m![1]), Number(m![2]), Number(m![3])];
    expect(contraste(or, [0xde, 0xde, 0xde])).toBeGreaterThanOrEqual(4.5);
  });
});
