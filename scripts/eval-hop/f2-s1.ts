// Sondes de la voie f2.
//   npx vite-node scripts/eval-hop/f2-s1.ts            1) la liste par défaut de S1 (stout export, « plus floral, moins résineux », celle du pack et de engine.test.ts) ;
//                                                       2) la documentation des houblons qui y entrent ou en sortent ; 3) les 12 premiers de Nugget à 60′ avec leur α.
import { CATALOGUE, FAMILIES, describeFamilies, hopRef, proposeVoies, substitutes } from '../../src/domain/hopIndex/v4';
import { s1Recipe } from '../../prototypes/houblons-v4/src/pack/buildPack';

const r = proposeVoies(s1Recipe(), { floral: 1, resin: -1 });
console.log(`${r.voies.length} voies, ${r.evaluated} évaluées`);
for (const v of r.voies) console.log(`${String(v.rank).padStart(2)} ${v.domain.padEnd(9)} c${v.conflicts.length} déb ${v.overflowTotal} dist ${v.distance.total} côté ${v.sideTotal} | ${v.label}`);
const doc = (id: string) => { const d = describeFamilies(`beermaverick-${id}`); return `${id}: fiches lues ${d.floral.of}, familles citées ${FAMILIES.filter((f) => d[f].level !== 'non décrit' && d[f].level !== undefined && d[f].sources > 0).length}`; };
console.log(['teamaker', 'ultra', 'yakima-cluster', 'marco-polo', 'east-kent-goldings', 'celeia', 'aurum', 'boadicea', 'motueka'].map(doc).join('\n'));
const at60 = { moment: 'b60' as const, grams: 20 };
const nug = substitutes('beermaverick-nugget', { ...at60, limit: 12 }).remplacants;
console.log('Nugget à 60′ :', nug.map((s) => `${s.name} ${s.score} α${(() => { const a = hopRef(s.key)!.catalogue.alpha!; return ((a[0] + a[1]) / 2).toFixed(1); })()}`).join(' | '), CATALOGUE.length);
