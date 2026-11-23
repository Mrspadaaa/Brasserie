// Contrôles complémentaires, hors de l'outil Google (qui ne lit que le YAML) :
//  1. les chemins de fichiers cités entre accents graves dans DESIGN.md existent ;
//  2. les contrastes WCAG des paires texte/fond des composants déclarés, y compris
//     le texte sur la surface quand le fond est transparent.
// Usage : node tools/design-lint/verifier-extra.mjs [DESIGN.md]
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cible = resolve(racine, process.argv[2] ?? 'DESIGN.md');
const texte = readFileSync(cible, 'utf8');
let problemes = 0;

// 1. Chemins cités
const chemins = new Set();
for (const m of texte.matchAll(/`([A-Za-z0-9_.\-/]+\.(?:md|mjs|ts|tsx|json|css|js|html|png))`/g)) {
  if (m[1].includes('/') || /^[A-Z]+\.md$/.test(m[1]) || /^index\.(css|html)$/.test(m[1])) chemins.add(m[1]);
}
// liens markdown vers un fichier local
for (const m of texte.matchAll(/\]\(([^)#\s]+\.md)\)/g)) chemins.add(m[1]);
for (const c of [...chemins].sort()) {
  if (c.includes('*')) continue;
  if (!existsSync(resolve(racine, c))) {
    problemes++;
    console.log(`CHEMIN ABSENT : ${c}`);
  }
}
console.log(`Chemins cités vérifiés : ${chemins.size}`);

// 2. Contrastes des composants (YAML d'en-tête, lecture simple)
const entete = texte.split(/^---\s*$/m)[1] ?? '';
const couleurs = {};
for (const m of entete.matchAll(/^ {2}([a-z0-9-]+): "(#[0-9A-Fa-f]{6})"/gm)) couleurs[m[1]] = m[2];
const lum = (hex) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const composants = entete.split(/^components:\s*$/m)[1] ?? '';
const blocs = composants.split(/^ {2}(?=[a-z0-9-]+:\s*$)/m).filter(Boolean);
for (const bloc of blocs) {
  const nom = bloc.match(/^([a-z0-9-]+):/)?.[1];
  const fond = bloc.match(/backgroundColor:\s*"\{colors\.([a-z0-9-]+)\}"/)?.[1];
  const txt = bloc.match(/textColor:\s*"\{colors\.([a-z0-9-]+)\}"/)?.[1];
  if (!nom || !txt) continue;
  const fondEff = fond ?? 'cave-900'; // transparent : posé sur une surface cave-900
  const r = ratio(couleurs[txt], couleurs[fondEff]);
  const ok = r >= 4.5;
  // Un contraste faible est une question de fond (décision du pilote) : signalé, jamais bloquant.
  console.log(`${ok ? 'OK ' : 'AVERTISSEMENT contraste <4,5 :'} ${nom} : ${txt} sur ${fondEff}${fond ? '' : ' (fond transparent, surface supposée)'} = ${r.toFixed(2)}:1`);
}

console.log(problemes ? `EXTRA : ${problemes} problème(s)` : 'EXTRA OK');
process.exit(problemes ? 1 : 0);
