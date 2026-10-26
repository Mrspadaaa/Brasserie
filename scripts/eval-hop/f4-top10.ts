// Voie f4-cout-et-usage (D106, partie 3) : les 10 premiers de Nugget à 60′ (recette S1, 46 g), leur usage chez Beer Maverick et leur démotion écrite.
//   npx vite-node scripts/eval-hop/f4-top10.ts
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const recipe: Recipe = { name: 'S1', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const r = m.substitutes('beermaverick-nugget', { moment: 'b60', grams: 46, recipe, limit: 10 });
const usage = (k: string) => CATALOGUE.find((c) => `beermaverick-${c.id}` === k || c.id === k)?.purpose ?? null;
let arome = 0;
for (const s of r.remplacants) {
  const u = usage(s.key);
  if (u === 'aroma') arome++;
  process.stdout.write(`${String(s.rank).padStart(2)}  ${s.name.padEnd(26)} usage ${String(u).padEnd(9)} score ${s.score}  ${s.amertumeDeconseillee ?? ''}\n`);
}
process.stdout.write(`usage arôme dans les 10 premiers : ${arome}\n`);
