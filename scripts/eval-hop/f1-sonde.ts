// Voie f1-affinage-diagnostic : sonde (stock des fixtures, Citra cryo, Citra simple). Lecture seule.
// Lancement : npx vite-node scripts/eval-hop/f1-sonde.ts
import { STOCK, CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

console.log('stock', STOCK.length, JSON.stringify(STOCK.map((s) => [s.key, s.grams, s.form])));
console.log('catalogue', CATALOGUE.length, 'citra' , JSON.stringify(CATALOGUE.find((h) => h.id === 'citra')?.alpha), JSON.stringify(CATALOGUE.filter((h) => /citra/i.test(h.name)).map((h) => h.id)));
const m = creerMoteur();
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
for (const mo of ['b60', 'dryActive'] as const) {
  const r = m.substitutes('beermaverick-nugget', { moment: mo, grams: 20, recipe: R21C, style: getStyleScale('21C'), stockFirst: false });
  const idx = (k: string) => r.remplacants.findIndex((s) => s.key === k) + 1;
  console.log(mo, r.candidats, 'cryo', JSON.stringify(r.remplacants.filter((s) => /citra/i.test(s.key)).map((s) => [s.key, s.rank, s.score, s.composantes, s.stock.etat, s.amertumeDeconseillee])));
  console.log(r.remplacants.slice(0, 8).map((s) => `${s.rank} ${s.key} ${s.score}`).join(' | '));
}
