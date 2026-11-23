import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Une classe Tailwind qui n'existe pas ne produit AUCUNE règle, et ne dit rien.
 *
 * ⚠️ C'est ce qui est arrivé aux neuf interrupteurs de l'atelier de l'eau : ils
 * portaient `h-5.5` et leur pastille `w-4.5 h-4.5`. Ces valeurs ne sont pas dans
 * l'échelle d'espacement — elle s'arrête aux demis à 3.5. Les trois classes
 * étaient donc muettes, les interrupteurs mesuraient ZÉRO pixel de haut, et
 * personne ne pouvait ni les voir ni les viser. Rien dans la compilation, les
 * types ou les tests ne le signalait : il a fallu regarder l'écran.
 *
 * Ce contrôle relit les sources et refuse toute valeur fractionnaire hors
 * échelle. Il ne remplace pas l'œil, mais il ferme cette porte-là.
 */

const RACINE = join(__dirname, '..', '..', 'src');

/**
 * Les seules fractions de l'échelle Tailwind par défaut. Au-delà de 3.5, les
 * pas sont entiers : 4, 5, 6, 7…
 */
const FRACTIONS_VALIDES = new Set(['0.5', '1.5', '2.5', '3.5']);

/** Utilitaires qui puisent dans l'échelle d'espacement. */
const UTILITAIRES =
  'w|h|min-w|min-h|max-w|max-h|size|p|px|py|pt|pb|pl|pr|ps|pe|' +
  'm|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|' +
  'top|bottom|left|right|inset|inset-x|inset-y|space-x|space-y|translate-x|translate-y';

const MOTIF = new RegExp(String.raw`\b(?:${UTILITAIRES})-(\d+\.\d+)\b`, 'g');

/**
 * Retire commentaires de bloc et de ligne.
 *
 * Sans ça, le contrôle se signale lui-même : les commentaires qui EXPLIQUENT la
 * panne citent forcément les classes fautives.
 */
function sansCommentaires(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function fichiers(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return fichiers(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe('Classes Tailwind', () => {
  it('⚠️ aucune classe d’espacement hors échelle — elle serait silencieusement sans effet', () => {
    const fautes: string[] = [];

    fichiers(RACINE).forEach((f) => {
      const lignes = sansCommentaires(readFileSync(f, 'utf8')).split('\n');
      lignes.forEach((ligne, i) => {
        for (const m of ligne.matchAll(MOTIF)) {
          if (!FRACTIONS_VALIDES.has(m[1])) {
            fautes.push(`${f.replace(RACINE, 'src')}:${i + 1} → « ${m[0]} »`);
          }
        }
      });
    });

    expect(fautes).toEqual([]);
  });
});

/* ---------------------------------------------------------------------------
 * L'échelle typographique doit GRANDIR avec l'écran
 * ------------------------------------------------------------------------ */

describe('Rangs de texte responsives', () => {
  /**
   * ⚠️ TROUVÉ EN MESURANT LE RENDU, pas en relisant le code.
   *
   * `2xs` a été redéfini à 0.8125rem (13 px) pour gagner de la densité sur
   * mobile. Mais `xs` n'a PAS été redéfini : il garde le défaut Tailwind,
   * 0.75rem — soit 12 px. Le rang nommé « 2xs » est donc PLUS GROS que celui
   * nommé « xs », à rebours de ce que les noms promettent.
   *
   * Conséquence invisible à la lecture : `text-2xs sm:text-xs` — écrit trente-
   * quatre fois — faisait RÉTRÉCIR le texte de 13 à 12 px quand l'écran
   * s'élargissait. On croyait densifier le mobile et on rapetissait le bureau.
   *
   * Ce contrôle refuse toute paire responsive qui diminue. Il ne juge pas les
   * tailles : il vérifie seulement qu'un écran plus large ne rend jamais le
   * texte plus petit.
   */
  const RANG: Record<string, number> = {
    footnote: 12,
    '2xs': 13,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 20,
    xl: 25
  };

  const PAIRE = /text-(footnote|2xs|xs|sm|base|lg|xl)\s+sm:text-(footnote|2xs|xs|sm|base|lg|xl)/g;

  it('⚠️ aucune paire `text-X sm:text-Y` ne rapetisse le texte sur grand écran', () => {
    const fautes: string[] = [];
    for (const fichier of fichiers(RACINE)) {
      const contenu = readFileSync(fichier, 'utf8');
      for (const m of contenu.matchAll(PAIRE)) {
        if (RANG[m[2]] < RANG[m[1]]) {
          fautes.push(`${fichier.replace(RACINE, 'src')} · ${m[0]}`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });
});
