// BR-45 (09.11) : contrôle bloquant des couleurs de l'atelier Houblons V5.5 (sans dépendance hors du dépôt).
//  1. aucune couleur littérale (#hex, rgb()/rgba() chiffrés, white) dans src/ui/hopV55 hors de jetons.css ;
//  2. chaque jeton `--hv-*` employé est défini dans les deux thèmes, et sa valeur claire est bien la couleur de son nom
//     (le clair reste identique) ;
//  3. cave : chaque texte (`--hv-t-*`) tient 4,5:1 sur la surface surélevée `cave-850` ; chaque fond (`--hv-f-*`) est
//     sombre (luminance relative ≤ 0,18 : aucun panneau clair dans la page sombre).
// Échoue sur HEAD avant BR-45 (1 520 couleurs littérales, pas de jetons.css). Usage : node src/ui/hopV55/jetons/controle.mjs
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const DOSSIER = path.join(RACINE, 'src', 'ui', 'hopV55');
const JETONS = path.join(DOSSIER, 'jetons.css');
const echecs = [];

// 1. Littérales restantes.
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
let litterales = 0;
const exemples = [];
for (const f of fs.readdirSync(DOSSIER)) {
  const p = path.join(DOSSIER, f);
  if (f === 'jetons.css' || !fs.statSync(p).isFile()) continue;
  if (f.endsWith('.css')) postcss.parse(fs.readFileSync(p, 'utf8')).walkDecls((d) => valueParser(d.value).walk((n) => {
    const lit = (n.type === 'word' && (HEX.test(n.value) || /^white$/i.test(n.value)))
      || (n.type === 'function' && /^rgba?$/i.test(n.value) && !valueParser.stringify(n.nodes).includes('var('));
    if (lit) { litterales++; if (exemples.length < 5) exemples.push(`${f} : ${d.prop}: ${d.value.slice(0, 60)}`); }
  }));
  else if (/\.tsx?$/.test(f)) for (const m of fs.readFileSync(p, 'utf8').matchAll(/['"`][^'"`\n]*?(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*\d)[^'"`\n]*['"`]/g)) {
    litterales++; if (exemples.length < 5) exemples.push(`${f} : ${m[0].slice(0, 60)}`);
  }
}
if (litterales) echecs.push(`${litterales} couleurs littérales dans src/ui/hopV55 (ex. ${exemples.join(' | ')})`);

// 2 et 3. Jetons.
if (!fs.existsSync(JETONS)) echecs.push('src/ui/hopV55/jetons.css absent');
else {
  const sansNotes = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
  const jetons = sansNotes(fs.readFileSync(JETONS, 'utf8'));
  const themes = sansNotes(fs.readFileSync(path.join(RACINE, 'src/theme/themes.css'), 'utf8'));
  const bloc = (src, motif) => Object.fromEntries([...(src.match(motif)?.[1] ?? '').matchAll(/(--[-a-z0-9]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const clair = bloc(jetons, /:root,\s*\[data-theme='clair'\]\s*\{([^}]*)\}/);
  const cave = bloc(jetons, /\n\[data-theme='cave'\]\s*\{([^}]*)\}/);
  const caveApp = bloc(themes, /\[data-theme='cave'\]\s*\{([^}]*)\}/);
  const canaux = (v) => { const r = /^var\((--[-a-z0-9]+)\)$/.exec(v); return (r ? caveApp[r[1]] : v)?.split(/\s+/).map(Number); };
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const employes = new Set();
  for (const f of fs.readdirSync(DOSSIER).filter((x) => /\.(css|tsx?)$/.test(x) && x !== 'jetons.css')) for (const m of fs.readFileSync(path.join(DOSSIER, f), 'utf8').matchAll(/var\((--hv-[tflo]-[0-9a-f]{6})\)/g)) employes.add(m[1]);
  for (const j of employes) if (!clair[j] || !cave[j]) echecs.push(`${j} employé mais non défini dans les deux thèmes`);
  for (const [j, v] of Object.entries(clair)) {
    const hex = j.slice(-6);
    if (v !== [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')) echecs.push(`${j} : clair ${v} n'est pas #${hex} (le clair doit rester identique)`);
  }
  const surface = canaux('var(--cave-850)');
  let textes = 0, fonds = 0;
  for (const [j, v] of Object.entries(cave)) {
    const c = canaux(v);
    if (!c || c.length !== 3 || c.some(Number.isNaN)) { echecs.push(`${j} : valeur cave illisible « ${v} »`); continue; }
    if (j.startsWith('--hv-t-')) { textes++; if (ratio(c, surface) < 4.5) echecs.push(`${j} : ${ratio(c, surface).toFixed(2)}:1 sur cave-850 (4,5 exigé)`); }
    if (j.startsWith('--hv-f-')) { fonds++; if (lum(c) > 0.18) echecs.push(`${j} : fond cave clair (luminance ${lum(c).toFixed(2)} > 0,18)`); }
  }
  console.log(`${Object.keys(clair).length} jetons ; cave : ${textes} textes ≥ 4,5:1 sur cave-850, ${fonds} fonds sombres contrôlés`);
}
if (echecs.length) { console.log(`JETONS ECHEC (${echecs.length})\n- ${echecs.slice(0, 40).join('\n- ')}`); process.exit(1); }
console.log('JETONS OK : aucune couleur littérale, clair identique, cave sombre et lisible');
