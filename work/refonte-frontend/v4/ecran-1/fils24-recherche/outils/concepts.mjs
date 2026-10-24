#!/usr/bin/env node
// Le livrable de chaque concept du lot « recherche avancée » (BRIEF-AUTEUR.md) : sa page avec l'écran de recherche
// (data-role="recherche") et cinq résultats au moins (data-houblon), sa NOTE avec sa chaleur, sa capture.
// Usage : node concepts.mjs <id> [id…]  →  « CONCEPTS-BIEN-<n> » ou « CONCEPTS ECHEC <id> (<manques>)… ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node concepts.mjs <id> [id…]'); process.exit(2); }
const mal = [];
for (const id of ids) {
  const manque = [];
  const page = path.join(LOT, id, 'etat.html');
  const t = fs.existsSync(page) ? fs.readFileSync(page, 'utf8') : '';
  if (!t) manque.push('etat.html');
  if (t && !t.includes('data-role="recherche"')) manque.push('data-role="recherche"');
  const res = new Set([...t.matchAll(/data-houblon="([^"]+)"/g)].map((m) => m[1])).size;
  if (t && res < 5) manque.push(`${res} résultats (5 au moins)`);
  const note = path.join(LOT, id, 'NOTE.md');
  if (!fs.existsSync(note) || !/chaleur/i.test(fs.readFileSync(note, 'utf8'))) manque.push('NOTE avec sa chaleur');
  if (!fs.existsSync(path.join(LOT, 'captures', `${id}.png`))) manque.push(`captures/${id}.png`);
  if (manque.length) mal.push(`${id} (${manque.join(', ')})`);
}
console.log(mal.length ? `CONCEPTS ECHEC ${mal.join(' ; ')}` : ['CONCEPTS', 'BIEN', ids.length].join('-'));
process.exit(mal.length ? 1 : 0);
