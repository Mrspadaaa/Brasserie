// Voie h1 : débogage (CATALOGUE réduit, comme les tests) : une neipa déjà herbacée (Cascade 144 g au dry hop actif : l'herbacé est établi au-dessus de la bande) : la liste principale « plus d'agrumes », avec et sans la règle.
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { chargerTable } from './f9-commun';

chargerTable();
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const FOIN: Recipe = { name: 'neipa déjà herbacée', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 240 }] };
for (const opts of [{}, { defautVegetal: false }]) {
  const res = m.proposeVoies(FOIN, { citrus: 1 }, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'], ...opts } as never);
  const vs = res.voies.filter((v) => v.type === 'ajouter');
  console.log('---', JSON.stringify(opts), vs.length, 'voies ; avant : herbal', res.before.profile.herbal.central, 'green', res.before.profile.green.central);
  vs.slice(0, 14).forEach((v) => console.log(v.rank, v.id.replace('ajouter|beermaverick-', ''), 'dist', v.distance.total, 'rang', v.overflowRang, 'style', v.overflowStyle, 'total', v.overflowTotal, JSON.stringify(v.styleOverflow.filter((o) => o.family === 'herbal' || o.family === 'green').map((o) => `${o.family}:${o.crans}${o.defaut ? 'D' : ''}${o.minuscule ? 'm' : ''}`))));
}
