// Génère les huit pages de la série sbu : node generer.mjs [sbu3 …] ; puis node capturer.mjs pour les captures.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './socle.mjs';
const ici = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ici, '../..');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbu1', 'sbu2', 'sbu3', 'sbu4', 'sbu5', 'sbu6', 'sbu7', 'sbu8'];
for (const id of ids) {
  const f = path.join(LOT, id, 'concept.mjs');
  if (!fs.existsSync(f)) { console.log(id + ' : pas de concept.mjs'); continue; }
  const c = (await import(pathToFileURL(f).href + '?t=' + Date.now())).default;
  fs.writeFileSync(path.join(LOT, id, 'etat.html'), page({ id, ...c }));
  console.log(id + ' · etat.html écrit');
}
