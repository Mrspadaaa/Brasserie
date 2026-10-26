// Voie f6 (B5) : ce qui a grossi dans les fichiers du morceau profil-simule depuis 846b76aa. Octets de source et gzip, par fichier, HEAD de l'arbre de travail contre 846b76aa.
// Usage (racine) : node <ce fichier>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import zlib from 'node:zlib';

const BASE = '846b76aa';
const FICHIERS = ['data.ts', 'donneesApp.ts', 'hops.ts', 'palier.ts', 'quickAdd.ts', 'substitution.ts', 'voies.ts'].map((f) => `src/domain/hopIndex/v4/${f}`)
  .concat(['src/ui/hopIndex/parcours/adaptateur.ts', 'src/ui/hopIndex/parcours/calculs.ts', 'src/ui/hopIndex/parcours/donnees.ts', 'src/ui/hopIndex/suggerer/voies.ts']);
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
let tAvant = 0, tApres = 0;
for (const f of FICHIERS) {
  let avant = Buffer.alloc(0);
  try { avant = execFileSync('git', ['show', `${BASE}:${f}`], { maxBuffer: 64 * 1024 * 1024 }); } catch { /* fichier absent à la base */ }
  const apres = fs.readFileSync(f);
  tAvant += gz(avant); tApres += gz(apres);
  console.log(`${f.padEnd(46)} source ${String(avant.length).padStart(7)} → ${String(apres.length).padStart(7)} (${apres.length - avant.length >= 0 ? '+' : ''}${apres.length - avant.length}) · gzip ${String(gz(avant)).padStart(6)} → ${String(gz(apres)).padStart(6)} (${gz(apres) - gz(avant) >= 0 ? '+' : ''}${gz(apres) - gz(avant)})`);
}
console.log(`TOTAL gzip des fichiers (indicatif : le chunk compresse l'ensemble) ${tAvant} → ${tApres} (${tApres - tAvant >= 0 ? '+' : ''}${tApres - tAvant})`);
