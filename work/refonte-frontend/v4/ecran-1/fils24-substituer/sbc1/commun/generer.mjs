// Série c · génère etat.html de chaque concept (sbcN/concept.mjs → sbcN/etat.html).
// Usage : node work/refonte-frontend/v4/ecran-1/fils24-substituer/sbc1/commun/generer.mjs [sbc1 sbc2 …]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE, ecrire } from './socle-sbc.mjs';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbc1', 'sbc2', 'sbc3', 'sbc4', 'sbc5', 'sbc6', 'sbc7', 'sbc8'];
for (const id of ids) {
  const m = await import(pathToFileURL(path.join(RACINE, id, 'concept.mjs')).href);
  ecrire(path.join(RACINE, id, 'etat.html'), m.rendre());
}
