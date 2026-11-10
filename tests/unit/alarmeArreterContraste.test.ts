/* BR-47 (banc du 08.11) : le bouton « Arrêter » de l'alarme de brassage (« À faire maintenant · 60 g Nugget ») était
   illisible au thème clair : texte #9A4F1E sur aplat #C8382F, 1,15:1. Le test lit la feuille réelle (brew-day.css) et les
   jetons réels des deux thèmes, et exige 4,5:1 pour le bouton et pour le texte du bandeau. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const lire = (chemin: string) => readFileSync(new URL(`../../${chemin}`, import.meta.url), 'utf8');
const CSS = lire('src/pages/brew-day.css');

/** Jetons d'un thème : les blocs « ne portant que des propriétés personnalisées » des deux feuilles de couleurs. */
function jetons(theme: 'clair' | 'cave'): Map<string, [number, number, number]> {
  const out = new Map<string, [number, number, number]>();
  for (const fichier of ['src/theme/themes.css', 'src/theme/couleurs-portees.css']) {
    const source = lire(fichier).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selecteur, corps] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = selecteur.replace(/\s+/g, ' ').trim();
      const estCave = sel === "[data-theme='cave']";
      const estClair = sel === ":root, [data-theme='clair']";
      if (!estCave && !estClair) continue;
      if (estCave && theme === 'clair') continue;
      for (const [, nom, r, g, b] of corps.matchAll(/(--[\w-]+)\s*:\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
        // Cascade : le clair est la base, la cave la surcharge ; le fichier lu en second ne remplace pas la cave.
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
/** Valeur CSS d'une propriété dans une règle : `rgb(var(--jeton))` → couleur du thème. */
function couleurDe(theme: 'clair' | 'cave', selecteur: string, propriete: 'background' | 'color') {
  const regle = CSS.match(new RegExp(`${selecteur.replace(/[.\s]/g, m => (m === '.' ? '\\.' : '\\s+'))}\\s*\\{([^}]*)\\}`));
  if (!regle) throw new Error(`Règle introuvable : ${selecteur}`);
  const decl = regle[1].match(new RegExp(`(?:^|[;\\s])${propriete}\\s*:\\s*rgb\\(var\\((--[\\w-]+)\\)`));
  if (!decl) throw new Error(`${propriete} introuvable dans ${selecteur}`);
  const valeur = jetons(theme).get(decl[1]);
  if (!valeur) throw new Error(`Jeton ${decl[1]} sans valeur au thème ${theme}`);
  return valeur;
}

describe('Alarme de brassage : le bouton « Arrêter » se lit dans les deux thèmes (BR-47)', () => {
  it.each(['clair', 'cave'] as const)('texte du bouton ≥ 4,5:1 sur son aplat, thème %s', theme => {
    const ratio = contraste(couleurDe(theme, '.brew-ringing .brew-ringing-stop', 'background'), couleurDe(theme, '.brew-ringing .brew-ringing-stop', 'color'));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['clair', 'cave'] as const)('texte « À faire maintenant » ≥ 4,5:1 sur le bandeau, thème %s', theme => {
    const fond = couleurDe(theme, '.brew-ringing', 'background');
    expect(contraste(fond, couleurDe(theme, '.brew-ringing-reason', 'color'))).toBeGreaterThanOrEqual(4.5);
    expect(contraste(fond, couleurDe(theme, '.brew-ringing-reason strong', 'color'))).toBeGreaterThanOrEqual(4.5);
  });
});
