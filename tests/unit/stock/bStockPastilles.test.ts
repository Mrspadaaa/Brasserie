// Mission levure-port, voie b-stock (09.11) : BR-120 / BE-46 — contraste des pastilles d'état des brassins, deux thèmes, sur chaque surface.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BATCH_STATUS } from '../../../src/domain/batchStatus';

const css = readFileSync('src/theme/themes.css', 'utf8');
type Rgb = [number, number, number];
function jetons(theme: 'clair' | 'cave'): Record<string, Rgb> {
  const ouverture = theme === 'clair' ? ':root,\n[data-theme=\'clair\'] {' : '[data-theme=\'cave\'] {';
  const i = css.indexOf(ouverture);
  const bloc = css.slice(i, css.indexOf('\n}', i));
  const out: Record<string, Rgb> = {};
  for (const m of bloc.matchAll(/--([\w-]+):\s*(\d+) (\d+) (\d+)/g)) out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  return out;
}
const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]: Rgb) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const rapport = (a: Rgb, b: Rgb) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const melange = (f: Rgb, b: Rgb, a: number): Rgb => [0, 1, 2].map((i) => Math.round(f[i] * a + b[i] * (1 - a))) as Rgb;

/** Les classes `text-X` lisent le jeton « -texte », les classes `bg-X` l'aplat (tailwind.config.js). */
function couleurs(chip: string, t: Record<string, Rgb>, surface: Rgb): { texte: Rgb; fond: Rgb } {
  const texte = /\btext-([\w-]+)\b/.exec(chip)![1];
  const fond = /\bbg-([\w-]+?)(?:\/(\d+))?(?:\s|$)/.exec(chip)!;
  const jetonTexte = /^cave-(\d+)$/.test(texte) ? `cave-texte-${texte.slice(5)}` : `${texte}-texte`;
  // L'aplat cuivre est fixe (tailwind.config.js : #A0522D), les autres lisent le jeton du thème.
  const aplat = fond[1] === 'ebc-copper' ? ([160, 82, 45] as Rgb) : t[fond[1]];
  return { texte: t[jetonTexte], fond: fond[2] ? melange(aplat, surface, Number(fond[2]) / 100) : aplat };
}

describe('BR-120, BE-46 — contraste des pastilles d’état (≥ 4,5:1, texte de 12 px)', () => {
  for (const theme of ['clair', 'cave'] as const) {
    const t = jetons(theme);
    for (const surface of ['950', '900', '850'] as const) {
      for (const [id, st] of Object.entries(BATCH_STATUS)) {
        it(`${theme}, sur cave-${surface} : « ${st.label} » (${id})`, () => {
          const { texte, fond } = couleurs(st.chip, t, t[`cave-${surface}`]);
          expect(rapport(texte, fond)).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }
});

describe('BR-120 — les compteurs des filtres de la liste', () => {
  it('le chiffre d’un filtre n’est pas éclairci par une opacité', () => {
    const source = readFileSync('src/ui/production/CatalogToolbar.tsx', 'utf8');
    const ligne = source.split('\n').find((l) => l.includes('ml-1 tabular-nums'))!;
    expect(ligne).toBeTruthy();
    expect(ligne).not.toMatch(/opacity-/);
  });
});

describe('RJ-14 — « À préciser » / « Non renseignée » dans la case de quantité', () => {
  const brewCss = readFileSync('src/pages/brew-day.css', 'utf8');
  const ingredients = readFileSync('src/ui/BrewIngredients.tsx', 'utf8');
  it('la valeur-texte est marquée et prend une police de texte, qui revient à la ligne dans son cadre', () => {
    expect(ingredients).toMatch(/<strong id=\{`brew-dose-value-\$\{item\.id\}`\} data-sans-valeur=\{/);
    const i = brewCss.indexOf('.brew-amount strong[data-sans-valeur]');
    expect(i).toBeGreaterThan(-1);
    const bloc = brewCss.slice(i, brewCss.indexOf('}', i));
    expect(bloc).toMatch(/font-size:\s*(1[2-4])px/);
    expect(bloc).toMatch(/overflow-wrap:\s*anywhere/);
  });
});
