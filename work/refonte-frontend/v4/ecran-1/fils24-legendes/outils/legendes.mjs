#!/usr/bin/env node
// Le livrable de chaque variante du lot « légendes » (BRIEF-AUTEUR.md) : sa page avec la légende (data-role="legende") et
// des pictos de familles (data-famille, six au moins), sa NOTE avec sa chaleur, sa capture.
// Usage : node legendes.mjs <id> [id…]  →  « LEGENDES-BIEN-<n> » ou « LEGENDES ECHEC <id> (<manques>)… ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node legendes.mjs <id> [id…]'); process.exit(2); }
const mal = [];
for (const id of ids) {
  const manque = [];
  const t = fs.existsSync(path.join(LOT, id, 'etat.html')) ? fs.readFileSync(path.join(LOT, id, 'etat.html'), 'utf8') : '';
  if (!t) manque.push('etat.html');
  if (t && !t.includes('data-role="legende"')) manque.push('data-role="legende"');
  const fam = new Set([...t.matchAll(/data-famille="([^"]+)"/g)].map((m) => m[1])).size;
  if (t && fam < 6) manque.push(`${fam} familles en pictos (6 au moins)`);
  const note = path.join(LOT, id, 'NOTE.md');
  if (!fs.existsSync(note) || !/chaleur/i.test(fs.readFileSync(note, 'utf8'))) manque.push('NOTE avec sa chaleur');
  if (!fs.existsSync(path.join(LOT, 'captures', `${id}.png`))) manque.push(`captures/${id}.png`);
  if (manque.length) mal.push(`${id} (${manque.join(', ')})`);
}
console.log(mal.length ? `LEGENDES ECHEC ${mal.join(' ; ')}` : ['LEGENDES', 'BIEN', ids.length].join('-'));
process.exit(mal.length ? 1 : 0);
