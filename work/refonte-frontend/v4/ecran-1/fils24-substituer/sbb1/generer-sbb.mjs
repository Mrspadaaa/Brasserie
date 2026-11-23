// Série b du lot D125 (Substituer, « Lequel à la place de Nugget ? ») : la réponse d'abord. Huit concepts, sbb1 à sbb8,
// sur la baseline (socle-sbb.mjs) et les données du moteur du parcours (donnees-sbb.json, produit par moteur-sbb.ts).
// Un seul facteur libre : le remplaçant. Fixés : la stout 16D, Nugget 46 g à 60′, la règle « même IBU ».
// Usage : node generer-sbb.mjs [sbb1 sbb2 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './socle-sbb.mjs';
import { CONCEPTS as C2 } from './concepts-sbb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.resolve(ici, '..');
const voulus = process.argv.slice(2);
for (const [id, f] of Object.entries(C2)) {
  if (voulus.length && !voulus.includes(id)) continue;
  const html = f(S);
  fs.mkdirSync(path.join(lot, id), { recursive: true });
  fs.writeFileSync(path.join(lot, id, 'etat.html'), html);
  console.log(id, '·', html.length, 'octets');
}
