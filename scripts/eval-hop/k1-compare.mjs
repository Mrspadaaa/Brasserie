// Voie k1-substituer-60 (D196) : compare deux dumps de k1-ordre.ts (HEAD puis arbre modifié). Ce que la règle doit faire, et rien d'autre :
//  1. mêmes candidats, mêmes scores ;
//  2. l'ordre des candidats à amertume connue est celui de HEAD, à l'octet près (les inconnus qui s'y mêlaient en sortent) ;
//  3. aucun inconnu avant un connu ; l'ordre interne des inconnus est celui de HEAD ;
//  4. aucun inconnu « proche » ou « très proche » ; le palier des connus ne change pas ;
//  5. quand le classement change, c'est que HEAD avait un inconnu avant un connu.
//   node scripts/eval-hop/k1-compare.mjs <avant.json> <apres.json>
import { readFileSync } from 'node:fs';

const [pa, pb] = process.argv.slice(2);
const A = JSON.parse(readFileSync(pa, 'utf8')), B = JSON.parse(readFileSync(pb, 'utf8'));
const echecs = { candidats: 0, scores: 0, ordreDesConnus: 0, inconnuAvantConnu: 0, ordreDesInconnus: 0, paliersInconnus: 0, paliersConnus: 0, changeSansRaison: 0 };
let total = 0, changes = 0, premiersTouches = 0;
const exemples = [];
for (const cle of Object.keys(A)) {
  total++;
  const a = A[cle], b = B[cle];
  if (!b || a.length !== b.length || [...a].map((x) => x[0]).sort().join() !== [...b].map((x) => x[0]).sort().join()) { echecs.candidats++; continue; }
  const score = new Map(a.map((x) => [x[0], x[1]]));
  if (b.some((x) => score.get(x[0]) !== x[1])) echecs.scores++;
  const connusA = a.filter((x) => !x[2]).map((x) => x[0]), connusB = b.filter((x) => !x[2]).map((x) => x[0]);
  const inconnusA = a.filter((x) => x[2]).map((x) => x[0]), inconnusB = b.filter((x) => x[2]).map((x) => x[0]);
  if (connusA.join() !== connusB.join()) echecs.ordreDesConnus++;
  if (inconnusA.join() !== inconnusB.join()) echecs.ordreDesInconnus++;
  const premierInconnu = b.findIndex((x) => x[2]);
  if (premierInconnu >= 0 && b.slice(premierInconnu).some((x) => !x[2])) echecs.inconnuAvantConnu++;
  if (b.some((x) => x[2] && (x[3] === 'très proche' || x[3] === 'proche'))) echecs.paliersInconnus++;
  const pc = new Map(a.map((x) => [x[0], x[3]]));
  if (b.some((x) => !x[2] && pc.get(x[0]) !== x[3])) echecs.paliersConnus++;
  const change = a.map((x) => x[0]).join() !== b.map((x) => x[0]).join();
  if (change) {
    changes++;
    const avantUnInconnu = a.findIndex((x) => x[2]), dernierConnuA = a.map((x) => x[2]).lastIndexOf(0);
    if (!(avantUnInconnu >= 0 && avantUnInconnu < dernierConnuA)) { echecs.changeSansRaison++; if (exemples.length < 5) exemples.push(cle); }
    if (a.slice(0, 5).some((x) => x[2])) premiersTouches++;
  }
}
console.log(`classements : ${total} ; changés : ${changes} (dont ${premiersTouches} avec un inconnu dans les 5 premiers de HEAD)`);
console.log(`échecs : ${JSON.stringify(echecs)}${exemples.length ? ` ; exemples ${exemples.join(', ')}` : ''}`);
console.log(Object.values(echecs).every((x) => x === 0) ? 'INVARIANTS OK' : 'INVARIANTS ECHEC');
