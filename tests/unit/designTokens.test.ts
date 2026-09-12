import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Les couleurs du système de design, vérifiées sur les sources.
 *
 * ⚠️ CE QUE CE CONTRÔLE A TROUVÉ LE PREMIER JOUR : 380 classes muettes.
 *
 * La palette `cave` ne définit que 950, 900, 850, 800, 700, 600, 400, 200 et 50.
 * Les sources utilisaient pourtant `text-cave-500` 131 fois, `text-cave-100`
 * 126 fois, `text-cave-300` 122 fois et `border-cave-750` une fois. Aucun de
 * ces degrés n'existe : Tailwind ne génère alors AUCUNE règle, la classe est
 * muette, et l'élément hérite simplement de la couleur de son parent.
 *
 * Rien ne le signalait. Ça compilait, les types passaient, et à l'écran le
 * texte avait *une* couleur — celle du parent — donc ça « marchait ». Un tiers
 * des couleurs de texte de l'application n'étaient pas des décisions, mais des
 * accidents d'héritage. Vérifié dans le navigateur en posant la classe sur un
 * élément dont le parent portait une couleur sentinelle : la sentinelle
 * ressortait intacte.
 *
 * Deux règles sont gardées ici, et elles n'ont pas la même nature :
 *
 *   1. UN JETON QUI N'EXISTE PAS — une faute de frappe qui ne dit rien.
 *   2. UN JETON TROP SOMBRE POUR DU TEXTE — une faute de contraste.
 *      `cave-600` mesure 2.11:1 sur `cave-900`, très en dessous du minimum AA
 *      de 4.5:1, et illisible dans la pénombre d'une cuverie. Il reste une
 *      couleur de bordure. Seuls `cave-400` (5.40:1), `cave-200` (11.60:1) et
 *      `cave-50` (15.87:1) portent du texte.
 *
 * Voir `DESIGN.md`, section « Colors ».
 */

const RACINE = join(__dirname, '..', '..', 'src');

/** Les degrés réellement définis dans `tailwind.config.js`. */
const CAVE = new Set(['950', '900', '850', '800', '700', '600', '400', '200', '50']);
const EBC = new Set(['straw', 'gold', 'amber', 'copper', 'brown', 'stout']);

/** Les seuls degrés qui tiennent 4.5:1 sur les surfaces de l'application. */
const CAVE_TEXTE = new Set(['400', '200', '50', '950']);

/**
 * `src/design/` est le banc d'essai du système : il AFFICHE la palette, donc il
 * pose légitimement `text-cave-600` sur un échantillon pour le montrer.
 */
const HORS_PORTEE = [join('src', 'design')];

/**
 * Utilitaires qui peignent la GLYPHE elle-même, et doivent donc contraster.
 *
 * `decoration-*` en est volontairement absent : il colore le trait de
 * soulignement, pas la lettre. Un soulignement discret sous un texte lisible
 * est un choix valable, pas un défaut de contraste.
 */
const UTILITAIRES_TEXTE = ['text', 'placeholder'];

/**
 * `text-*` sert aussi de `currentColor` à un trait SVG.
 *
 * Les grilles de `FermentationTemperatureChart`, `HopAromaChart` et
 * `YeastCataloguePanel` portent `text-cave-700` sur un `<line>` ou un
 * `<polygon>` en `stroke="currentColor"` : c'est un trait de repère décoratif,
 * pas du texte. WCAG 1.4.3 ne vise que le texte, et 1.4.11 exclut le décoratif.
 * Une grille de fond qui contrasterait à 4.5:1 mangerait la courbe qu'elle sert.
 */
const GRAPHIQUE = /stroke=|<(?:line|polygon|circle|path|rect|ellipse)\b/;
/** Tous les utilitaires qui puisent dans la palette. */
const UTILITAIRES =
  'text|bg|border|ring|fill|stroke|placeholder|divide|from|to|via|accent|caret|decoration|outline|shadow';

const MOTIF = new RegExp(String.raw`\b(${UTILITAIRES})-(cave|ebc)-([a-z0-9]+)\b`, 'g');

/** Retire les commentaires : ils citent forcément les classes fautives. */
function sansCommentaires(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function fichiers(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) return fichiers(chemin);
    return /\.(tsx?|css)$/.test(e.name) ? [chemin] : [];
  });
}

interface Faute {
  fichier: string;
  ligne: number;
  classe: string;
  motif: string;
}

function analyser(): { inexistants: Faute[]; troppSombres: Faute[] } {
  const inexistants: Faute[] = [];
  const troppSombres: Faute[] = [];

  for (const chemin of fichiers(RACINE)) {
    const relatif = chemin.slice(chemin.indexOf('src'));
    const horsPortee = HORS_PORTEE.some((d) => relatif.startsWith(d));
    const lignes = sansCommentaires(readFileSync(chemin, 'utf8')).split('\n');

    lignes.forEach((ligne, i) => {
      for (const m of ligne.matchAll(MOTIF)) {
        const [classe, utilitaire, echelle, degre] = m;
        const connu = echelle === 'cave' ? CAVE.has(degre) : EBC.has(degre);

        if (!connu) {
          inexistants.push({
            fichier: relatif,
            ligne: i + 1,
            classe,
            motif: `« ${degre} » n'est pas un degré de la palette ${echelle}`
          });
          continue;
        }

        if (
          !horsPortee &&
          !GRAPHIQUE.test(ligne) &&
          echelle === 'cave' &&
          UTILITAIRES_TEXTE.includes(utilitaire) &&
          !CAVE_TEXTE.has(degre)
        ) {
          troppSombres.push({
            fichier: relatif,
            ligne: i + 1,
            classe,
            motif: `cave-${degre} est une couleur de bordure : sous 4.5:1 en texte`
          });
        }
      }
    });
  }
  return { inexistants, troppSombres };
}

function rapport(fautes: Faute[]): string {
  return fautes.map((f) => `  ${f.fichier}:${f.ligne}  ${f.classe} — ${f.motif}`).join('\n');
}

describe('jetons de couleur', () => {
  const { inexistants, troppSombres } = analyser();

  it('n’utilise aucun degré absent de la palette', () => {
    expect(
      inexistants.length,
      `Classes muettes — Tailwind ne génère aucune règle, l'élément hérite de son parent :\n${rapport(inexistants)}`
    ).toBe(0);
  });

  it('ne peint jamais de texte avec une couleur de bordure', () => {
    expect(
      troppSombres.length,
      `Contraste sous 4.5:1 — texte illisible dans la pénombre :\n${rapport(troppSombres)}`
    ).toBe(0);
  });
});
