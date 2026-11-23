// Génère les huit pages de la série d : node generer.mjs [sbd1 …]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { LOT } from './socle.mjs';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbd1', 'sbd2', 'sbd3', 'sbd4', 'sbd5', 'sbd6', 'sbd7', 'sbd8'];
for (const id of ids) {
  const mod = path.join(LOT, id, 'concept.mjs');
  if (!fs.existsSync(mod)) { console.log(id + ' · pas de concept.mjs'); continue; }
  const { construire } = await import(pathToFileURL(mod).href + '?t=' + Date.now());
  const html = construire();
  fs.writeFileSync(path.join(LOT, id, 'etat.html'), html);
  console.log(id + ' · etat.html ' + (html.length / 1024).toFixed(1) + ' ko');
}
