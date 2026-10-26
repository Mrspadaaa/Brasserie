// G5 de la voie t1-theme (#144) : les contrastes des jetons, dans les deux thèmes, aux seuils de DESIGN.md (« Colors ») :
//  - 7:1 : valeur lue et texte courant (`text-cave-50`, `text-cave-200`), texte posé sur l'action principale ;
//  - 4,5:1 : texte secondaire (`text-cave-400`) et tout texte coloré (variantes `-texte` des accents) ;
//  - 3:1 : marques porteuses de sens qui ne sont pas du texte (aplats houblon, eau, alerte, attention, repère, filet de
//    focus). `marque` n'est pas mesurée : en clair c'est la valeur de sa maquette (#9E9E9E, 2,25:1), que l'app n'emploie pas.
// Fonds mesurés : page (`cave-950`), panneau (`cave-900`), surface surélevée (`cave-850`).
// Lit src/theme/themes.css (les valeurs réelles), et, en clair, les textes portés de src/theme/couleurs-portees.css.
// Usage : node scripts/theme/contraste.mjs [--temoin] [--tableau]
//   --temoin : remplace le texte secondaire clair par #9E9E9E (2,7:1) ; le contrôle doit alors échouer.
//   --tableau : imprime le tableau Markdown des mesures (repris dans DESIGN.md).
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const css = fs.readFileSync(path.join(RACINE, 'src/theme/themes.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const portees = fs.readFileSync(path.join(RACINE, 'src/theme/couleurs-portees.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const bloc = (src, motif) => {
  const m = src.match(motif);
  if (!m) throw new Error(`bloc introuvable : ${motif}`);
  return Object.fromEntries([...m[1].matchAll(/--([-a-z0-9]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((x) => [x[1], [+x[2], +x[3], +x[4]]]));
};
const THEMES = {
  clair: bloc(css, /:root,\s*\[data-theme='clair'\]\s*\{([^}]*)\}/),
  cave: bloc(css, /\[data-theme='cave'\]\s*\{([^}]*)\}/),
};
const PORTEES_CLAIR = bloc(portees, /:root,\s*\[data-theme='clair'\]\s*\{([^}]*)\}/);
if (process.argv.includes('--temoin')) THEMES.clair['cave-texte-400'] = [158, 158, 158];

const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (c) => `#${c.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

const FONDS = ['cave-950', 'cave-900', 'cave-850'];
const REGLES = [
  ['Valeur lue, titre', 'cave-texte-50', 7],
  ['Texte courant', 'cave-texte-200', 7],
  ['Texte secondaire', 'cave-texte-400', 4.5],
  ['Paille / action en texte', 'ebc-straw-texte', 4.5],
  ['Or en texte', 'ebc-gold-texte', 4.5],
  ['Ambre en texte', 'ebc-amber-texte', 4.5],
  ['Cuivre en texte', 'ebc-copper-texte', 4.5],
  ['Production en texte', 'area-production-texte', 4.5],
  ['Finances en texte', 'area-finances-texte', 4.5],
  ['Stocks en texte', 'area-stocks-texte', 4.5],
  ['Agenda en texte', 'area-agenda-texte', 4.5],
  ['Attention en texte', 'attention-texte', 4.5],
  ['Erreur en texte (alert-strong)', 'alert-strong-texte', 4.5],
  ['Alerte en texte', 'alert-texte', 4.5],
  ['Houblon en texte', 'hop-texte', 4.5],
  ['Eau en texte', 'water-texte', 4.5],
  ['Repère en texte', 'repere-texte', 4.5],
  ['Houblon, aplat', 'hop', 3],
  ['Eau, aplat', 'water', 3],
  ['Alerte, aplat', 'alert', 3],
  ['Attention, aplat', 'attention', 3],
  ['Repère (cible)', 'repere', 3],
  ['Filet de focus', 'ebc-straw-bord', 3],
];
const SUR_ACTION = { clair: [255, 255, 255], cave: null }; // clair : texte blanc sur l'action noire (themes.css)

const fautes = [];
const lignes = [];
for (const [theme, v] of Object.entries(THEMES)) {
  for (const [role, jeton, seuil] of REGLES) {
    if (!v[jeton]) { fautes.push(`${theme} : jeton ${jeton} absent`); continue; }
    const mesures = FONDS.map((f) => ratio(v[jeton], v[f]));
    const pire = Math.min(...mesures);
    if (pire < seuil) fautes.push(`${theme} : ${role} (${jeton} ${hex(v[jeton])}) ${pire.toFixed(2)}:1 < ${seuil}`);
    lignes.push({ theme, role, jeton, valeur: hex(v[jeton]), mesures, seuil });
  }
  const encre = SUR_ACTION[theme] ?? v['cave-texte-950'];
  const action = ratio(encre, v['ebc-straw']);
  if (action < 7) fautes.push(`${theme} : texte sur l'action ${action.toFixed(2)}:1 < 7`);
  lignes.push({ theme, role: 'Texte sur l\'action principale', jeton: 'ebc-straw', valeur: `${hex(encre)} sur ${hex(v['ebc-straw'])}`, mesures: [action], seuil: 7 });
}
// Clair : chaque teinte de texte portée d'un composant (--ct-*) tient 4,5:1 sur la page et le panneau.
let portesOk = 0;
for (const [nom, c] of Object.entries(PORTEES_CLAIR)) {
  if (!nom.startsWith('ct-')) continue;
  const pire = Math.min(ratio(c, THEMES.clair['cave-950']), ratio(c, THEMES.clair['cave-900']));
  if (pire < 4.5) fautes.push(`clair : texte porté --${nom} ${hex(c)} ${pire.toFixed(2)}:1 < 4.5`); else portesOk++;
}

if (process.argv.includes('--tableau')) {
  for (const theme of Object.keys(THEMES)) {
    console.log(`\n| ${theme} | Jeton | Valeur | Page | Panneau | Surélevée | Seuil |\n|---|---|---|---|---|---|---|`);
    for (const l of lignes.filter((x) => x.theme === theme)) console.log(`| ${l.role} | \`${l.jeton}\` | \`${l.valeur}\` | ${l.mesures.map((m) => m.toFixed(2).replace('.', ',')).join(' | ')}${l.mesures.length === 1 ? ' | | ' : ''} | ${String(l.seuil).replace('.', ',')} |`);
  }
}
for (const f of fautes) console.log(`ECHEC ${f}`);
console.log(`${lignes.length} mesures sur 2 thèmes, ${portesOk} textes portés du clair`);
console.log(fautes.length ? `CONTRASTE ECHEC ${fautes.length}` : 'CONTRASTE OK');
process.exit(fautes.length ? 1 : 0);
