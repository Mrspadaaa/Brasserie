import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Rejeu en ligne du 08.11, RJ-1 : en thème clair, le bouton principal de la conduite (« Commencer aujourd'hui », « Terminer et continuer »)
// avait son texte rgb(17,17,17) sur un fond rgb(17,17,17). Les captures prouvent le rendu ; ce test garde la cause : fond et texte
// issus de jetons qui valent la même encre en clair.
const css = readFileSync('src/pages/brew-day.css', 'utf8');
const themes = readFileSync('src/theme/themes.css', 'utf8');

const bloc = (source: string, ouverture: string): string => {
  const i = source.indexOf(ouverture);
  if (i < 0) throw new Error(`bloc absent : ${ouverture}`);
  return source.slice(i, source.indexOf('}', i));
};
const jeton = (theme: string, nom: string): string => {
  const m = bloc(themes, theme).match(new RegExp(`--${nom}:\\s*([^;]+);`));
  if (!m) throw new Error(`jeton absent : ${nom}`);
  return m[1].trim();
};

describe('RJ-1 · bouton principal de la conduite, thème clair', () => {
  it('le fond (--ebc-straw) et le texte de base (--cave-texte-950) valent la même encre en clair : une règle du clair est nécessaire', () => {
    expect(jeton('[data-theme=\'clair\'] {', 'ebc-straw')).toBe(jeton('[data-theme=\'clair\'] {', 'cave-texte-950'));
    expect(bloc(css, '.brew-primary {')).toMatch(/background:\s*var\(--brew-gold\)/);
    expect(bloc(css, '.brew-primary {')).toMatch(/color:\s*rgb\(var\(--cave-texte-950\)\)/);
  });
  it('en clair, le texte est blanc au repos (aplat noir) et foncé au survol (aplat doré)', () => {
    expect(bloc(css, ':root:not([data-theme=\'cave\']) .brew-primary {')).toMatch(/color:\s*rgb\(255 255 255\)/);
    expect(bloc(css, ':root:not([data-theme=\'cave\']) .brew-primary:hover {')).toMatch(/color:\s*rgb\(var\(--cave-texte-950\)\)/);
  });
  it('le thème sombre ne change pas : texte foncé sur l’aplat doré', () => {
    expect(jeton('[data-theme=\'cave\']', 'cave-texte-950')).not.toBe(jeton('[data-theme=\'cave\']', 'ebc-straw'));
  });
});
