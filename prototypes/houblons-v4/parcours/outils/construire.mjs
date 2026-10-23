// Construit la maquette jouable en pages statiques, une par route, ouvrables en file:// et publiables.
// Usage (depuis la racine du dépôt) : node prototypes/houblons-v4/parcours/outils/construire.mjs [--sortie=<dossier>]
// Sortie par défaut : prototypes/houblons-v4/maquettes/parcours (vidée) ; une voie d'écran construit dans
// maquettes/parcours-<écran>/ (non vidée) sans écraser les autres. Vérifie les 8 pages → CONSTRUIT OK (8 pages).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const parcours = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prototype = path.resolve(parcours, '..');
const depot = path.resolve(prototype, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || 'true']; }));
const inconnues = Object.keys(args).filter((k) => k !== 'sortie');
if (inconnues.length) { console.log(`CONSTRUIT ECHEC : option inconnue --${inconnues.join(', --')}`); process.exit(1); }
const DEFAUT = path.join(prototype, 'maquettes', 'parcours');
const sortie = args.sortie ? path.resolve(depot, args.sortie) : DEFAUT;
// Garde-fou : jamais hors de maquettes/ (dossier ignoré par git), jamais maquettes/ lui-même.
const maquettes = path.join(prototype, 'maquettes');
if (!sortie.startsWith(maquettes + path.sep)) { console.log(`CONSTRUIT ECHEC : --sortie doit être sous ${path.relative(depot, maquettes)}/`); process.exit(1); }
process.env.PARCOURS_SORTIE = sortie;

try {
  await build({ configFile: path.join(parcours, 'vite.config.ts'), logLevel: 'warn' });
} catch (e) {
  console.log(`CONSTRUIT ECHEC : ${e.message}`);
  process.exit(1);
}
import { ROUTES } from './routes-pages.mjs';
const pages = ['index.html', ...ROUTES.map((r) => `${r}/etat.html`)];
const manques = [];
for (const p of pages) {
  const f = path.join(sortie, p);
  if (!fs.existsSync(f)) { manques.push(`${p} absente`); continue; }
  const html = fs.readFileSync(f, 'utf8');
  const route = p === 'index.html' ? 'ma-biere' : p.split('/')[0];
  const prefixe = p === 'index.html' ? './' : '../';
  if (!html.includes(`data-route="${route}"`)) manques.push(`${p} : data-route="${route}" manquant`);
  if (!html.includes(`src="${prefixe}assets/parcours.js"`)) manques.push(`${p} : script commun introuvable`);
  if (!html.includes(`href="${prefixe}assets/`)) manques.push(`${p} : feuille commune introuvable`);
  if (html.includes('type="module"')) manques.push(`${p} : module ES (bloqué en file://)`);
}
for (const a of ['assets/parcours.js']) if (!fs.existsSync(path.join(sortie, a))) manques.push(`${a} absent`);
if (manques.length) { console.log(manques.join('\n')); console.log(`CONSTRUIT ECHEC (${manques.length} défaut${manques.length > 1 ? 's' : ''})`); process.exit(1); }
console.log(`CONSTRUIT OK (${pages.length} pages) → ${path.relative(depot, sortie).split(path.sep).join('/')}/`);
