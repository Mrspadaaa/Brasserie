/* VI-11 (rejeu b47cd90b n° 11) : au thème clair, le segment sélectionné du SegmentedControl (« Tous · 0 » de la barre des
   fûts, « 30 L » et « Propre » de la feuille Nouveau fût) était blanc sur gris clair, ≈ 1,9:1.
   Cause : `bg-ebc-straw` sur le bouton actif déclenche `:root:not([data-theme='cave']) .bg-ebc-straw *` (blanc sur tous
   les descendants, themes.css), alors que les feuilles de contexte ne changent que le fond du bouton.
   Le test lit les feuilles et les jetons réels, comme alarmeArreterContraste (BR-47), et exige 4,5:1 dans les deux thèmes
   pour chaque contexte où le composant est posé. Le texte effectif d'un libellé est blanc si la classe de l'aplat paille
   est restée sur le bouton actif (règle du thème clair), sinon la couleur que la règle de contexte pose sur le bouton. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const lire = (chemin: string) => readFileSync(new URL(`../../${chemin}`, import.meta.url), 'utf8');
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

/** `rgb(var(--x))` ou `theme('colors.cave.850')` / `theme('textColor.cave.50')` → jeton. */
function jetonDe(valeur: string): string {
  const v = valeur.match(/var\((--[\w-]+)\)/);
  if (v) return v[1];
  const t = valeur.match(/theme\('(colors|textColor)\.(\w+)\.(\w+)'\)/);
  if (!t) throw new Error(`Valeur illisible : ${valeur}`);
  const [, famille, groupe, degre] = t;
  if (groupe === 'ebc') return `--ebc-${degre}`;
  return famille === 'textColor' ? `--${groupe}-texte-${degre}` : `--${groupe}-${degre}`;
}
function regle(fichier: string, selecteur: string) {
  const css = lire(fichier).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, sels, corps] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!sels.split(',').some(s => s.replace(/\s+/g, ' ').trim() === selecteur)) continue;
    const fond = corps.match(/(?:^|[;\s])background(?:-color)?\s*:\s*((?:rgb\(var\([^)]*\)\)|theme\([^)]*\)))/);
    const texte = corps.match(/(?:^|[;\s])color\s*:\s*((?:rgb\(var\([^)]*\)\)|theme\([^)]*\)))/);
    if (fond && texte) return { fond: jetonDe(fond[1]), texte: jetonDe(texte[1]) };
  }
  throw new Error(`Règle introuvable : ${selecteur} dans ${fichier}`);
}

const SOURCE = lire('src/ui/SegmentedControl.tsx');
const classeActive = SOURCE.match(/active\s*\n?\s*\?\s*'([^']*)'\s*\n?\s*:\s*'text-cave-200/)?.[1] ?? '';

/** Contextes où le composant est posé : fichier et sélecteur de la règle du segment coché (aucun ⇒ la règle par défaut). */
const CONTEXTES: Array<[string, string, string]> = [
  ['défaut (feuille Nouveau fût, capacité et état)', 'src/ui/segmented-control.css', '.seg-actif'],
  ['barre des fûts (Tous · 0)', 'src/ui/equipment-compact.css', '.equipment-filters > [role="radio"][aria-checked="true"]'],
  ['choix de la feuille (30 L, Propre)', 'src/ui/equipment-compact.css', '.equipment-choice > [role="radio"][aria-checked="true"]'],
  ['clients', 'src/ui/clients.css', ".clients-segments [role='radio'][aria-checked='true']"],
  ['objectifs de levure', 'src/ui/yeast-recipe.css', ".yeast-workbench .yeast-goals button[aria-checked='true']"]
];

describe('SegmentedControl : le segment sélectionné se lit dans les deux thèmes (VI-11)', () => {
  it('la classe active a été lue dans le composant', () => {
    expect(classeActive).toContain('font-semibold');
  });
  it('le bouton actif ne porte plus l’aplat paille, dont la règle claire blanchit tous les descendants', () => {
    expect(classeActive).not.toMatch(/\bbg-ebc-straw\b/);
  });
  describe.each(CONTEXTES)('%s', (_nom, fichier, selecteur) => {
    it.each(['clair', 'cave'] as const)('libellé ≥ 4,5:1 sur le segment, thème %s', theme => {
      const { fond, texte } = regle(fichier, selecteur);
      const j = jetons(theme);
      const aplat = j.get(fond);
      let encre = j.get(texte);
      if (!aplat || !encre) throw new Error(`Jeton manquant : ${fond} / ${texte}`);
      // Au clair, la règle `.bg-ebc-straw *` impose du blanc au libellé si la classe est encore sur le bouton.
      if (theme === 'clair' && /\bbg-ebc-straw\b/.test(classeActive)) encre = [255, 255, 255];
      expect(contraste(aplat, encre)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
