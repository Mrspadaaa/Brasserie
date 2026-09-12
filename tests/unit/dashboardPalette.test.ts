import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';

const colors = tailwindConfig.theme.extend.colors;
const accents: Record<string, string> = {
  ...Object.fromEntries(Object.entries(colors.area).map(([area, color]) => [`area-${area}`, color])),
  attention: colors.attention,
  'alert-strong': colors['alert-strong']
};

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error(`Couleur non reconnue : ${hex}`);
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb;
}

/** Composition sRGB du fond translucide telle qu'appliquée par CSS. */
function over(foreground: Rgb, background: Rgb, opacity: number): Rgb {
  return foreground.map((channel, index) => channel * opacity + background[index] * (1 - opacity)) as Rgb;
}

function luminance(value: Rgb): number {
  const [red, green, blue] = value.map((channel) => {
    const linear = channel / 255;
    return linear <= 0.04045 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: Rgb, background: Rgb): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('palette des rubriques et alertes du dashboard', () => {
  it('garde les jetons dédiés synchronisés avec le frontmatter de DESIGN.md', () => {
    const document = readFileSync(new URL('../../DESIGN.md', import.meta.url), 'utf8');
    const frontmatter = document.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1];
    expect(frontmatter, 'Le frontmatter du document doit être présent').toBeDefined();
    const palette = frontmatter?.match(/^colors:\r?\n([\s\S]*?)(?=^\S)/mu)?.[1];
    expect(palette, 'La palette doit être déclarée dans colors').toBeDefined();
    const documented = Object.fromEntries(
      [...palette!.matchAll(/^  ([\w-]+): "(#[\da-f]{6})"/gimu)].map((match) => [match[1], match[2]])
    );

    expect(Object.keys(accents).sort()).toEqual([
      'alert-strong', 'area-agenda', 'area-finances', 'area-production', 'area-stocks', 'attention'
    ]);
    for (const [name, hex] of Object.entries(accents)) {
      expect(documented[name], `Jeton ${name} dans DESIGN.md`).toBe(hex);
    }
    expect(new Set(Object.values(accents).map((hex) => hex.toLowerCase())).size).toBe(6);
    const reserved = new Set([
      ...Object.values(colors.ebc), colors.alert, colors.hop, colors.water
    ].map((hex) => hex.toLowerCase()));
    for (const [name, hex] of Object.entries(accents)) {
      expect(reserved.has(hex.toLowerCase()), `${name} doit rester distinct de la bière et des états historiques`).toBe(false);
    }
  });

  it('conserve au moins 4,5:1 sur les surfaces cave et leurs fonds teintés composés', () => {
    // Comprend les titres/badges du dashboard et le fond actif /10 de la navigation.
    for (const [name, hex] of Object.entries(accents)) {
      const accent = rgb(hex);
      for (const surface of [colors.cave[950], colors.cave[900], colors.cave[850]]) {
        for (const opacity of [0, 0.1, 0.15, 0.2]) {
          const background = over(accent, rgb(surface), opacity);
          for (const foreground of [accent, rgb(colors.cave[200]), rgb(colors.cave[50])]) {
            expect(
              contrast(foreground, background),
              `${name} sur ${surface}, fond teinté à ${opacity * 100} %`
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    }
  });

  it('rend le nombre du badge de stock lisible et détecte la combinaison précédente insuffisante', () => {
    expect(contrast(rgb('#000000'), rgb('#FFFFFF'))).toBeCloseTo(21, 8);
    expect(contrast(rgb(colors.cave[50]), rgb(colors.alert))).toBeLessThan(4.5);
    expect(contrast(rgb(colors.cave[950]), rgb(colors.attention))).toBeGreaterThanOrEqual(4.5);
  });
});
