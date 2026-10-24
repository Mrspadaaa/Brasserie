#!/usr/bin/env node
// Le livrable de chaque variante du lot « Dryhopper, avec ses retours » (BRIEF-AUTEUR.md) : sa page, sa greffe nommée
// (data-greffe), sa NOTE avec sa chaleur, sa capture.
// Usage : node variantes.mjs <id> [id…]  →  « VARIANTES-BIEN-<n> » ou « VARIANTES ECHEC <id> (<manques>)… ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node variantes.mjs <id> [id…]'); process.exit(2); }
const mal = [];
for (const id of ids) {
  const manque = [];
  const t = fs.existsSync(path.join(LOT, id, 'etat.html')) ? fs.readFileSync(path.join(LOT, id, 'etat.html'), 'utf8') : '';
  if (!t) manque.push('etat.html');
  if (t && !/data-greffe="[^"]+"/.test(t)) manque.push('data-greffe');
  const note = path.join(LOT, id, 'NOTE.md');
  if (!fs.existsSync(note) || !/chaleur/i.test(fs.readFileSync(note, 'utf8'))) manque.push('NOTE avec sa chaleur');
  if (!fs.existsSync(path.join(LOT, 'captures', id + '.png'))) manque.push('captures/' + id + '.png');
  if (manque.length) mal.push(id + ' (' + manque.join(', ') + ')');
}
console.log(mal.length ? 'VARIANTES ECHEC ' + mal.join(' ; ') : ['VARIANTES', 'BIEN', ids.length].join('-'));
process.exit(mal.length ? 1 : 0);
