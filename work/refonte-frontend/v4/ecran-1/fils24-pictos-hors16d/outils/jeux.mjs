#!/usr/bin/env node
// Le livrable de chaque jeu du lot D131 (BRIEF-AUTEUR.md) : sa page avec les quinze pictos et le picto « en plus »
// (data-mot), sa légende (data-role="legende"), son mot précis (data-role="precis"), sa NOTE avec sa chaleur, ses deux
// captures. Un script plutôt qu'un `node -e` : sous cmd.exe, les guillemets échappés d'une commande en ligne
// laissent passer un `>` en redirection (24.10).
// Usage : node jeux.mjs <id> [id…]  →  « JEUX-BIEN-<n> » ou « JEUX ECHEC <id> (<manques>)… ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node jeux.mjs <id> [id…]'); process.exit(2); }
const mal = [];
for (const id of ids) {
  const manque = [];
  const page = path.join(LOT, id, 'etat.html');
  const t = fs.existsSync(page) ? fs.readFileSync(page, 'utf8') : '';
  if (!t) manque.push('etat.html');
  const mots = new Set([...t.matchAll(/data-mot="([^"]+)"/g)].map((m) => m[1]));
  if (t && mots.size < 16) manque.push(`${mots.size} pictos nommés (16 au moins)`);
  if (t && !mots.has('en-plus')) manque.push('picto « en plus »');
  if (t && !t.includes('data-role="legende"')) manque.push('légende');
  if (t && !t.includes('data-role="precis"')) manque.push('mot précis');
  const note = path.join(LOT, id, 'NOTE.md');
  if (!fs.existsSync(note) || !/chaleur/i.test(fs.readFileSync(note, 'utf8'))) manque.push('NOTE avec sa chaleur');
  for (const c of ['planche', 'carte']) if (!fs.existsSync(path.join(LOT, 'captures', `${id}-${c}.png`))) manque.push(`captures/${id}-${c}.png`);
  if (manque.length) mal.push(`${id} (${manque.join(', ')})`);
}
console.log(mal.length ? `JEUX ECHEC ${mal.join(' ; ')}` : ['JEUX', 'BIEN', ids.length].join('-'));
process.exit(mal.length ? 1 : 0);
