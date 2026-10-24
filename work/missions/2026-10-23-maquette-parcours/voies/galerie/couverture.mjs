#!/usr/bin/env node
// La galerie de toutes les créations (« Fait moi un artefacts avec toutes le création depuis de début de toutes les
// sessions », 24.10, soir) couvre chaque mini maquette du dépôt, et la page Dryhopper chaque mini maquette de Dryhopper
// (« Rencontre moi toutes les mini maquettes du dryhopping »).
// Une mini maquette : un fichier etat*.html sous work/refonte-frontend/v4/ecran-1 (hors temoins/ et node_modules/), ou
// une capture d'écran de v3 (work/refonte-frontend/v3/**.png). L'inventaire de la voie (inventaire.json : un tableau
// d'objets portant `source`, le chemin de la mini maquette depuis la racine du dépôt) doit les citer toutes ; les pages
// doivent citer, en data-source, chaque source de l'inventaire (galerie) et chaque source qui contient « dryhop » (Dryhopper).
// Usage : node couverture.mjs  →  « COUVERTURE OK (n mini maquettes ; Dryhopper k) » ou « COUVERTURE ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const PAGES = 'work/refonte-frontend/v4/outils/pages/';
const INV = PAGES + '2026-10-24-galerie/inventaire.json';
const GAL = PAGES + '2026-10-24-galerie/index.html';
const DRY = PAGES + '2026-10-24-dryhopper-tout/index.html';
const marcher = (d, garder, out = []) => {
  for (const e of fs.readdirSync(path.join(RACINE, d), { withFileTypes: true })) {
    const p = d + '/' + e.name;
    if (e.isDirectory()) { if (!/^(node_modules|temoins|\.git)$/.test(e.name)) marcher(p, garder, out); }
    else if (garder(e.name, p)) out.push(p);
  }
  return out;
};
const attendues = [
  ...marcher('work/refonte-frontend/v4/ecran-1', (n) => /^etat.*\.html$/.test(n)),
  ...(fs.existsSync(path.join(RACINE, 'work/refonte-frontend/v3')) ? marcher('work/refonte-frontend/v3', (n) => /\.png$/.test(n)) : []),
];
const ecarts = [];
const inv = fs.existsSync(path.join(RACINE, INV)) ? JSON.parse(fs.readFileSync(path.join(RACINE, INV), 'utf8')) : null;
if (!Array.isArray(inv)) ecarts.push(`pas d'inventaire (${INV})`);
const sources = new Set((inv ?? []).map((x) => x.source));
const absentes = attendues.filter((s) => !sources.has(s));
if (absentes.length) ecarts.push(`${absentes.length}/${attendues.length} absentes de l'inventaire (dont ${absentes.slice(0, 4).join(', ')})`);
const lire = (f) => (fs.existsSync(path.join(RACINE, f)) ? fs.readFileSync(path.join(RACINE, f), 'utf8') : null);
const g = lire(GAL), dy = lire(DRY);
const cite = (html) => new Set([...(html ?? '').matchAll(/data-source="([^"]+)"/g)].map((m) => m[1]));
if (!g) ecarts.push(`pas de galerie (${GAL})`);
else { const c = cite(g); const m = [...sources].filter((s) => !c.has(s)); if (m.length) ecarts.push(`${m.length} sources de l'inventaire absentes de la galerie`); }
const dryAttendues = [...sources].filter((s) => /dryhop/i.test(s));
if (!dy) ecarts.push(`pas de page Dryhopper (${DRY})`);
else { const c = cite(dy); const m = dryAttendues.filter((s) => !c.has(s)); if (m.length) ecarts.push(`${m.length}/${dryAttendues.length} mini maquettes de Dryhopper absentes de sa page`); }
console.log(ecarts.length ? `COUVERTURE ECHEC (${ecarts.join(' ; ')})` : `COUVERTURE OK (${attendues.length} mini maquettes ; Dryhopper ${dryAttendues.length})`);
process.exit(ecarts.length ? 1 : 0);
