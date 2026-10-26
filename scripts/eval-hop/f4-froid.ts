// Voie f4-cout-et-usage : d'où vient le premier appel à froid de proposeVoies (~400 ms contre 206 ms à HEAD) ? On chauffe UNE mémoire à la fois, hors appel, et on remesure le premier appel.
//   npx vite-node scripts/eval-hop/f4-froid.ts -- --chauffe=aucune|familles|citations|apports
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { describeFamilies, citations } from '../../src/domain/hopIndex/v4/hops';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

const chauffe = process.argv.slice(2).find((a) => a.startsWith('--chauffe='))?.slice(10) ?? 'aucune';
const R: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const m = creerMoteur();
const t = <T>(f: () => T): number => { const a = performance.now(); f(); return Math.round((performance.now() - a) * 10) / 10; };
const out: Record<string, number | string> = { chauffe };
m.dans(() => {
  if (chauffe === 'familles') out['chauffe-ms'] = t(() => { for (const c of CATALOGUE) describeFamilies(c.id); });
  if (chauffe === 'citations') out['chauffe-ms'] = t(() => { for (const c of CATALOGUE) citations(c.id); });
});
if (chauffe === 'apports') out['chauffe-ms'] = t(() => m.proposeVoies({ ...R, additions: [R.additions[0]] }, { floral: 1 }, { assemblages: false, remplacements: false }));
out['premier-appel-ms'] = t(() => m.proposeVoies(R, { citrus: 1 }, { assemblages: true, remplacements: false }));
process.stdout.write(JSON.stringify(out) + '\n');
