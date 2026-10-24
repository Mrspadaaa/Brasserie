// Série D, « le simulateur » (voie r7d-dryhopper) : huit concepts minimalistes de Dryhopper.
// Usage : node generer.mjs [d1 d2 …]   → d1/etat.html … d8/etat.html
// Chaque concept : une représentation qui se déforme en direct sous le doigt, un seul facteur libre (le
// moment), une vraie valeur sourcée. Classes préfixées par l'id du concept (L26) ; code client assemblé
// par concaténation, jamais par remplacement de chaîne.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ici, page } from './socle.mjs';

const seuls = process.argv.slice(2);
for (const id of ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8']) {
  if (seuls.length && !seuls.includes(id)) continue;
  const f = path.join(ici, 'concepts', id + '.mjs');
  if (!fs.existsSync(f)) continue;
  const c = (await import(pathToFileURL(f).href)).default;
  fs.mkdirSync(path.join(ici, id), { recursive: true });
  fs.writeFileSync(path.join(ici, id, 'etat.html'), page(c));
  console.log(id + ' · ' + c.chaleur + ' · ' + c.titre);
}
