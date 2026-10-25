// Lot fils25-comparer : chaque variante a sa page, sa note, ses trois captures, un sélecteur de moment, « lui seul » hors 16D,
// retirer/remplacer/chercher, et ≤ 100 mots au premier écran. Usage : node variantes.mjs <id> [id…] → VARIANTES-CMP-n ou ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const lot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outils = path.resolve(lot, '../../tournoi/outils');
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node variantes.mjs <id> [id…]'); process.exit(2); }
const fautes = [];
for (const id of ids) {
  const page = path.join(lot, id, 'etat.html');
  if (!fs.existsSync(page)) { fautes.push(`${id} : etat.html absent`); continue; }
  const html = fs.readFileSync(page, 'utf8');
  if (!fs.existsSync(path.join(lot, id, 'NOTE.md'))) fautes.push(`${id} : NOTE.md absente`);
  for (const c of [`${id}.png`, `${id}-moment.png`, `${id}-long.png`]) if (!fs.existsSync(path.join(lot, 'captures', c))) fautes.push(`${id} : captures/${c} absente`);
  if (!/data-role=["']quand-comparer["']/.test(html)) fautes.push(`${id} : aucun [data-role="quand-comparer"]`);
  if (!/data-role=["']hors-16d["']/.test(html)) fautes.push(`${id} : aucun [data-role="hors-16d"]`);
  if (!/data-greffe=/.test(html)) fautes.push(`${id} : aucune greffe nommée (data-greffe)`);
  const m = spawnSync(process.execPath, [path.join(outils, 'mots-premier-ecran.mjs'), lot, id, '--page=etat.html', '--max=100'], { encoding: 'utf8' });
  if (!/MOTS OK/.test(m.stdout ?? '')) fautes.push(`${id} : ${(m.stdout ?? '').trim().split('\n')[0]}`);
}
if (fautes.length) { for (const f of fautes) console.log(`  - ${f}`); console.log(`VARIANTES-CMP ECHEC (${fautes.length})`); process.exit(1); }
console.log(`VARIANTES-CMP-${ids.length}`);
